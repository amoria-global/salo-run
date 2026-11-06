'use client';

/**
 * "New photobook": pick an album, choose the photos, name it and create it. Same request as the mobile app
 * (POST /customer/events/photobook with name, description, mediaIds, layout, coverImage and eventId).
 */
import React, { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { dashboardAuthFetch } from '../../providers/AuthProvider';

export type PhotobookAlbum = { id: string; title: string; eventId?: string; images: string[] };

const LAYOUTS = [
  { value: 'GRID', label: 'Classic Grid', hint: 'Even 3-column grid with balanced borders' },
  { value: 'MAGAZINE', label: 'Editorial Magazine', hint: 'Mixed portrait and landscape magazine spread' },
  { value: 'STORY', label: 'Story Flow', hint: 'Full-bleed vertical narrative scroll' },
] as const;

/** The photos of an album that the dashboard can name by id, in album order. */
export function selectableImages(album: PhotobookAlbum | undefined, mediaIdMap: Record<string, string>): { url: string; id: string }[] {
  if (!album) return [];
  return album.images.filter((u) => !!mediaIdMap[u]).map((u) => ({ url: u, id: mediaIdMap[u] }));
}

export default function NewPhotobookModal({
  apiUrl, albums, mediaIdMap, onClose, onCreated,
}: {
  apiUrl: string;
  albums: PhotobookAlbum[];
  mediaIdMap: Record<string, string>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [albumId, setAlbumId] = useState(albums[0]?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [layout, setLayout] = useState<string>('GRID');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const album = albums.find((a) => a.id === albumId);
  const photos = useMemo(() => selectableImages(album, mediaIdMap), [album, mediaIdMap]);

  const toggle = (id: string) => setPicked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const chooseAlbum = (id: string) => { setAlbumId(id); setPicked(new Set()); };
  const allPicked = photos.length > 0 && photos.every((p) => picked.has(p.id));

  const create = async () => {
    if (!name.trim()) { setError('Give the photobook a name.'); return; }
    if (picked.size === 0) { setError('Choose at least one photo.'); return; }
    setBusy(true);
    setError(null);
    try {
      const mediaIds = photos.filter((p) => picked.has(p.id)).map((p) => p.id);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/photobook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          mediaIds,
          layout,
          coverImage: photos.find((p) => picked.has(p.id))?.url,
          ...(album?.eventId ? { eventId: album.eventId } : {}),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.action !== 1) { setError(body?.message || 'Could not create the photobook.'); return; }
      onCreated();
    } catch {
      setError('Could not create the photobook. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => { if (!busy) onClose(); }}
      lockBackdrop={busy}
      size="lg"
      title="New photobook"
      description="Choose an album, pick the photos and name your photobook."
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="ck-btn ck-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="ck-btn ck-btn-primary" onClick={create} disabled={busy}>
            {busy ? 'Creating…' : `Create photobook${picked.size ? ` (${picked.size})` : ''}`}
          </button>
        </div>
      }
    >
      {albums.length === 0 ? (
        <p role="status" style={{ color: 'var(--ck-text-soft)', margin: 0 }}>
          You need an album with photos first. Create an album, upload photos, then come back to make a photobook.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: '0.88rem', fontWeight: 600 }}>
            Name
            <input className="ck-input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Wedding, Nyarutarama" />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: '0.88rem', fontWeight: 600 }}>
            Description (optional)
            <textarea className="ck-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: '0.88rem', fontWeight: 600 }}>
            Album
            <select className="ck-input" value={albumId} onChange={(e) => chooseAlbum(e.target.value)}>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            <legend style={{ fontSize: '0.88rem', fontWeight: 600, padding: 0 }}>Layout</legend>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LAYOUTS.map((l) => (
                <label key={l.value} title={l.hint} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: '0.88rem' }}>
                  <input type="radio" name="photobook-layout" checked={layout === l.value} onChange={() => setLayout(l.value)} /> {l.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Photos ({picked.size} of {photos.length} chosen)</span>
              {photos.length > 0 ? (
                <button type="button" className="ck-btn ck-btn-ghost" onClick={() => setPicked(allPicked ? new Set() : new Set(photos.map((p) => p.id)))}>
                  {allPicked ? 'Clear all' : 'Choose all'}
                </button>
              ) : null}
            </div>
            {photos.length === 0 ? (
              <p role="status" style={{ color: 'var(--ck-text-soft)', margin: 0, fontSize: '0.88rem' }}>This album has no photos yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={picked.has(p.id)}
                    aria-label={`Photo ${i + 1}${picked.has(p.id) ? ', chosen' : ''}`}
                    style={{ position: 'relative', padding: 0, border: picked.has(p.id) ? '3px solid var(--ck-blue)' : '1px solid var(--ck-stroke)', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'transparent', cursor: 'pointer' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {picked.has(p.id) ? <i className="bi bi-check-circle-fill" aria-hidden="true" style={{ position: 'absolute', top: 4, right: 4, color: '#fff', background: 'var(--ck-blue)', borderRadius: '50%' }} /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error ? <p role="alert" style={{ color: '#d92d20', margin: 0, fontSize: '0.88rem' }}>{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}
