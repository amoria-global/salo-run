'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

/**
 * Creator studio for one Explore album: drop photos and clips in, see what state each item is in, set a title, a price
 * and tags, publish or unpublish, and read how many times it sold.
 *
 * Photos go to the existing album upload (one request each, with the server's size and type caps). A clip is uploaded
 * straight to Cloudflare Stream over a resumable (TUS) upload that the server opens, so a dropped connection resumes
 * instead of starting over; Stream then makes the full clip and a 15 second watermarked preview, and an admin
 * approves it before it is public.
 */

interface Item {
  id: string;
  mediaType: 'PHOTO' | 'VIDEO';
  status: 'LIVE' | 'PROCESSING' | 'PENDING_REVIEW' | 'REJECTED' | 'UNPUBLISHED' | 'FAILED';
  detail?: string | null;
  title?: string | null;
  priceOverride?: number | null;
  albumPrice?: number | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  sales: number;
  tags: string[];
}
interface Upload { key: string; name: string; kind: 'photo' | 'clip'; pct: number; state: 'uploading' | 'done' | 'error'; message?: string }

const MAX_CLIP_BYTES = 1024 * 1024 * 1024;
const MAX_PHOTO_BYTES = 30 * 1024 * 1024;
const CHUNK = 5 * 1024 * 1024; // Stream wants chunks in multiples of 256 KiB, 5 MiB or more

const STATUS: Record<Item['status'], { label: string; tone: string }> = {
  LIVE: { label: 'Live', tone: '#2fd48f' },
  PROCESSING: { label: 'Processing', tone: '#f5b942' },
  PENDING_REVIEW: { label: 'In review', tone: '#7aa7ff' },
  REJECTED: { label: 'Rejected', tone: '#ff6b81' },
  UNPUBLISHED: { label: 'Unpublished', tone: '#a6b0c8' },
  FAILED: { label: 'Failed', tone: '#ff6b81' },
};

export default function ExploreStudio({ albumId, albumTitle, currency, onClose }: {
  albumId: string; albumTitle: string; currency: string; onClose: () => void;
}) {
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [drag, setDrag] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { title: string; price: string; tags: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/explore/albums/${albumId}/items`);
      const j = await res.json();
      if (!res.ok || j?.action !== 1) throw new Error(j?.message || `HTTP ${res.status}`);
      setItems(j.data.items as Item[]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the items.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, albumId]);

  useEffect(() => { void load(); }, [load]);
  // While a clip is being prepared, look again every 10 seconds.
  useEffect(() => {
    if (!items.some(i => i.status === 'PROCESSING')) return;
    const h = setInterval(() => void load(true), 10_000);
    return () => clearInterval(h);
  }, [items, load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setUpload = (key: string, patch: Partial<Upload>) =>
    setUploads(prev => prev.map(u => (u.key === key ? { ...u, ...patch } : u)));

  const uploadPhoto = async (file: File, key: string) => {
    if (file.size > MAX_PHOTO_BYTES) { setUpload(key, { state: 'error', message: 'A photo can be up to 30 MB.' }); return; }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${albumId}/images`, { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.action === 0) throw new Error(j?.message || `HTTP ${res.status}`);
      setUpload(key, { state: 'done', pct: 100 });
    } catch (e) {
      setUpload(key, { state: 'error', message: e instanceof Error ? e.message : 'Upload failed' });
    }
  };

  const uploadClip = async (file: File, key: string) => {
    if (file.size > MAX_CLIP_BYTES) { setUpload(key, { state: 'error', message: 'A clip can be up to 1 GB and 2 minutes.' }); return; }
    try {
      const start = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/explore/videos/upload`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId, fileName: file.name, sizeBytes: file.size, title: file.name.replace(/\.[^.]+$/, '') }),
      });
      const sj = await start.json().catch(() => ({}));
      if (!start.ok || sj?.action !== 1) throw new Error(sj?.message || `HTTP ${start.status}`);
      const url: string = sj.data.uploadUrl;
      let offset = 0;
      while (offset < file.size) {
        const end = Math.min(offset + CHUNK, file.size);
        let ok = false;
        for (let attempt = 0; attempt < 4 && !ok; attempt++) {
          try {
            const r = await fetch(url, {
              method: 'PATCH',
              headers: { 'Tus-Resumable': '1.0.0', 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' },
              body: file.slice(offset, end),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const next = Number(r.headers.get('Upload-Offset'));
            offset = Number.isFinite(next) && next > offset ? next : end;
            ok = true;
          } catch (e) {
            if (attempt === 3) throw e;
            await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
          }
        }
        setUpload(key, { pct: Math.round((offset / file.size) * 100) });
      }
      setUpload(key, { state: 'done', pct: 100 });
    } catch (e) {
      setUpload(key, { state: 'error', message: e instanceof Error ? e.message : 'Upload failed' });
    }
  };

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const list = Array.from(files);
    const entries = list.map((f, i) => ({
      f, key: `${Date.now()}-${i}-${f.name}`,
      kind: (/^video\//.test(f.type) || /\.(mp4|mov)$/i.test(f.name)) ? 'clip' as const : 'photo' as const,
    }));
    setUploads(prev => [...prev, ...entries.map(e => ({ key: e.key, name: e.f.name, kind: e.kind, pct: 0, state: 'uploading' as const }))]);
    // A few at a time: kind to the connection and to the server.
    const queue = [...entries];
    const worker = async () => {
      for (let e = queue.shift(); e; e = queue.shift()) {
        if (e.kind === 'clip') await uploadClip(e.f, e.key); else await uploadPhoto(e.f, e.key);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    await load(true);
  };

  const draftOf = (it: Item) => drafts[it.id] ?? {
    title: it.title ?? '',
    price: it.priceOverride != null ? String(it.priceOverride) : '',
    tags: it.tags.join(', '),
  };
  const edit = (it: Item, patch: Partial<{ title: string; price: string; tags: string }>) =>
    setDrafts(prev => ({ ...prev, [it.id]: { ...draftOf(it), ...patch } }));

  const save = async (it: Item, publish?: boolean) => {
    const d = draftOf(it);
    const price = d.price.trim() === '' ? null : Number(d.price);
    if (price != null && (!Number.isFinite(price) || price <= 0)) { setError('Enter a price above zero, or leave it empty to use the album price.'); return; }
    setSavingId(it.id);
    try {
      const body: Record<string, unknown> = {
        title: d.title, tags: d.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(price != null ? { price } : { clearPrice: true }),
        ...(publish === undefined ? {} : { published: publish }),
      };
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/explore/items/${it.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.action !== 1) throw new Error(j?.message || `HTTP ${res.status}`);
      setDrafts(prev => { const n = { ...prev }; delete n[it.id]; return n; });
      setError('');
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSavingId(null);
    }
  };

  const glass: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16 };
  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 40, borderRadius: 10, padding: '0 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', font: 'inherit', fontSize: 13 };
  const btn: React.CSSProperties = { minHeight: 40, padding: '0 14px', borderRadius: 10, border: 0, cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: 13, background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' };
  const ghost: React.CSSProperties = { ...btn, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Items in ${albumTitle}`} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(3,7,18,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ ...glass, width: '100%', maxWidth: 1040, maxHeight: '94vh', overflow: 'auto', background: 'linear-gradient(160deg,#0a2148,#071634)', color: '#fff', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontFamily: '"Space Grotesk", Inter, sans-serif' }}>Items in {albumTitle}</h3>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>Photos up to 30 MB. Clips up to 2 minutes and 1 GB, MP4 or MOV. Currency: {currency}.</div>
          </div>
          <button type="button" style={ghost} onClick={onClose} aria-label="Close">Close</button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}
          style={{ ...glass, borderStyle: 'dashed', borderColor: drag ? '#F20C8F' : 'rgba(255,255,255,0.3)', padding: 22, textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop photos and clips here</div>
          <button type="button" style={btn} onClick={() => fileRef.current?.click()}>Choose files</button>
          <input ref={fileRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.mp4,.mov"
            onChange={e => { void addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        {uploads.length > 0 && (
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }} aria-live="polite">
            {uploads.slice(-8).map(u => (
              <div key={u.key} style={{ ...glass, padding: '8px 12px', fontSize: 12.5, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.kind === 'clip' ? 'Clip' : 'Photo'}: {u.name}</span>
                <span style={{ color: u.state === 'error' ? '#ff8da1' : 'rgba(255,255,255,0.8)' }}>
                  {u.state === 'uploading' ? `${u.pct}%` : u.state === 'done' ? (u.kind === 'clip' ? 'Uploaded, processing' : 'Uploaded') : u.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <div role="alert" style={{ ...glass, padding: 10, marginBottom: 12, color: '#ffb3c0' }}>{error}</div>}
        {loading && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Loading items…</div>}
        {!loading && items.length === 0 && !error && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>No items yet. Drop your first photo or clip above.</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {items.map(it => {
            const d = draftOf(it);
            const st = STATUS[it.status];
            const canToggle = it.status === 'LIVE' || it.status === 'UNPUBLISHED';
            return (
              <div key={it.id} style={{ ...glass, padding: 12, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {it.thumbnailUrl ? <img src={it.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className={`bi ${it.mediaType === 'VIDEO' ? 'bi-camera-video' : 'bi-image'}`} style={{ fontSize: 26, opacity: 0.7 }} aria-hidden />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, color: '#07101f', background: st.tone }}>{st.label}</span>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
                      {it.mediaType === 'VIDEO' ? 'Clip' : 'Photo'}{it.durationSeconds ? ` · ${Math.floor(it.durationSeconds / 60)}:${String(it.durationSeconds % 60).padStart(2, '0')}` : ''} · {it.sales} sold
                    </div>
                    {it.status === 'PENDING_REVIEW' && <div style={{ fontSize: 12, color: '#bcd0ff' }}>Waiting for an admin to approve it.</div>}
                    {(it.status === 'FAILED' || it.status === 'REJECTED') && <div style={{ fontSize: 12, color: '#ffb3c0' }}>{it.detail || 'This item could not be published.'}</div>}
                  </div>
                </div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Title
                  <input style={field} value={d.title} maxLength={160} onChange={e => edit(it, { title: e.target.value })} />
                </label>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Price in {currency} (empty uses the album price{it.albumPrice != null ? `: ${it.albumPrice}` : ''})
                  <input style={field} inputMode="decimal" value={d.price} onChange={e => edit(it, { price: e.target.value.replace(/[^\d.]/g, '') })} />
                </label>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Tags, separated by commas (up to 10)
                  <input style={field} value={d.tags} onChange={e => edit(it, { tags: e.target.value })} placeholder="kigali, sunset, aerial" />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={{ ...btn, flex: 1 }} disabled={savingId === it.id} onClick={() => void save(it)}>{savingId === it.id ? 'Saving…' : 'Save'}</button>
                  {canToggle && (
                    <button type="button" style={ghost} disabled={savingId === it.id} onClick={() => void save(it, it.status === 'UNPUBLISHED')}>
                      {it.status === 'LIVE' ? 'Unpublish' : 'Publish'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
