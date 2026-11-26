"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

/**
 * Admin review of Explore clips. A clip lands here after Stream has made its 15 second watermarked preview; the admin
 * watches that preview (never the full clip) and approves it, which makes it public, or rejects it with a reason the
 * creator sees.
 */

interface QueueItem {
  id: string;
  title: string | null;
  album: string;
  category: string | null;
  creator: string;
  duration_seconds: number | null;
  created_at: string;
  previewIframe: string;
  poster: string;
}

export default function AdminExploreReview() {
  const { colors } = useTheme();
  const apiUrl = getApiUrl();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/admin/explore/queue`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.action !== 1) throw new Error(j?.message || `HTTP ${res.status}`);
      setItems(j.data.items as QueueItem[]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the queue.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (id: string, verb: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/admin/explore/${id}/${verb}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verb === 'reject' ? { reason: reasons[id] || '' } : {}),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.action !== 1) throw new Error(j?.message || `HTTP ${res.status}`);
      setItems(prev => prev.filter(i => i.id !== id));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work.');
    } finally {
      setBusyId(null);
    }
  };

  const card: React.CSSProperties = { border: `1px solid ${colors.borderPrimary}`, borderRadius: 16, padding: 14, background: colors.bgSecondary, display: 'grid', gap: 10 };
  const btn: React.CSSProperties = { minHeight: 42, padding: '0 16px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="admin" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: colors.textPrimary }}>Explore clip review</h1>
          <p style={{ margin: '4px 0 16px', color: colors.textSecondary }}>
            Watch the 15 second preview. Approving makes the clip public; rejecting tells the creator why.
          </p>
          {error && <div role="alert" style={{ ...card, color: '#c4086f', marginBottom: 12 }}>{error}</div>}
          {loading && <p style={{ color: colors.textSecondary }}>Loading…</p>}
          {!loading && items.length === 0 && !error && <p style={{ color: colors.textSecondary }}>Nothing waiting for review.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {items.map(it => (
              <div key={it.id} style={card}>
                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', background: '#05080f' }}>
                  <iframe title={it.title || 'Clip preview'} src={`${it.previewIframe}?controls=true&poster=${encodeURIComponent(it.poster)}`}
                    allow="fullscreen" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: colors.textPrimary }}>{it.title || 'Untitled clip'}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>
                    {it.creator} · {it.album}{it.category ? ` · ${it.category}` : ''}{it.duration_seconds ? ` · ${it.duration_seconds}s` : ''}
                  </div>
                </div>
                <input aria-label="Reason if rejecting" placeholder="Reason if rejecting (the creator sees it)" value={reasons[it.id] || ''}
                  onChange={e => setReasons(prev => ({ ...prev, [it.id]: e.target.value }))}
                  style={{ minHeight: 42, borderRadius: 10, padding: '0 12px', border: `1px solid ${colors.borderPrimary}`, background: colors.bgPrimary, color: colors.textPrimary }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={{ ...btn, flex: 1 }} disabled={busyId === it.id} onClick={() => void decide(it.id, 'approve')}>Approve</button>
                  <button type="button" style={{ ...btn, background: 'transparent', border: `1px solid ${colors.borderPrimary}`, color: colors.textPrimary }} disabled={busyId === it.id} onClick={() => void decide(it.id, 'reject')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
