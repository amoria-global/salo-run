"use client";

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import {
  MAX_ALBUMS_PER_SHARE,
  filterAlbums,
  mapShareable,
  toggleSelection,
  type ShareBadge,
  type ShareTab,
  type ShareableAlbum,
} from './chatShared';

const BADGE_LABEL: Record<ShareBadge, string> = { PAID: 'Paid', PRIVATE: 'Private', FREE: 'Free' };
const BADGE_COLORS: Record<ShareBadge, { fg: string; bg: string }> = {
  PAID: { fg: '#083A85', bg: '#E0EAFB' },
  PRIVATE: { fg: '#8A5A00', bg: '#FEF3C7' },
  FREE: { fg: '#047857', bg: '#D1FAE5' },
};

function Badge({ badge, muted }: { badge: ShareBadge; muted?: boolean }) {
  const c = muted ? { fg: '#6B7280', bg: '#F3F4F6' } : BADGE_COLORS[badge];
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: c.fg, background: c.bg, padding: '0.15rem 0.5rem', borderRadius: 9999, whiteSpace: 'nowrap' }}>
      {BADGE_LABEL[badge]}
    </span>
  );
}

// ---------------------------------------------------------------- cards

type CardData =
  | { available: false }
  | {
      available: true;
      title: string;
      photoCount: number;
      badge: ShareBadge;
      coverImage?: string;
      photographerName?: string;
      shareSlug?: string;
      thumbnails: string[];
    };

/** Where the album opens for the client: the same page and access rules as any shared link. */
export function albumShareUrl(slug: string): string {
  const site = (process.env.NEXT_PUBLIC_LANDING_URL || 'https://connekyt.com').replace(/\/$/, '');
  return `${site}/user/browse-photos/${encodeURIComponent(slug)}`;
}

/**
 * One shared album in a chat bubble. Fetched when the card shows, so a renamed, archived or removed album is always
 * current. Opening never grants anything: a paid or private album asks for payment or the access code as usual.
 */
export function AlbumShareCard({ albumId, isOwn }: { albumId: string; isOwn: boolean }) {
  const { colors } = useTheme();
  const [card, setCard] = useState<CardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/chat/albums/${encodeURIComponent(albumId)}/card`);
        const body = await res.json().catch(() => null);
        if (!live) return;
        const d = body?.data;
        if (!res.ok || body?.action === 0 || !d || d.available !== true) {
          setCard({ available: false });
          return;
        }
        setCard({
          available: true,
          title: d.title || 'Album',
          photoCount: Number(d.photoCount) || 0,
          badge: d.badge === 'PAID' || d.badge === 'PRIVATE' ? d.badge : 'FREE',
          coverImage: normalizeImageUrl(d.coverImage) || undefined,
          photographerName: d.photographerName || undefined,
          shareSlug: d.shareSlug || undefined,
          thumbnails: Array.isArray(d.thumbnails) ? d.thumbnails.map((u: string) => normalizeImageUrl(u)).filter(Boolean) : [],
        });
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [albumId]);

  const box: React.CSSProperties = {
    width: 264,
    maxWidth: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    border: `1px solid ${colors.borderPrimary}`,
    backgroundColor: colors.bgCard,
    boxShadow: colors.shadowSm,
  };

  if (failed || (card && !card.available)) {
    return (
      <div style={{ ...box, padding: '0.75rem 1rem', fontSize: '0.85rem', color: colors.textSecondary }} role="status">
        This album is no longer available
      </div>
    );
  }
  if (!card) {
    return (
      <div style={box} aria-busy="true" aria-label="Loading album">
        <div style={{ height: 132, background: colors.bgTertiary }} />
        <div style={{ padding: '0.75rem' }}>
          <div style={{ height: 12, width: '65%', background: colors.bgTertiary, borderRadius: 6 }} />
          <div style={{ height: 10, width: '40%', background: colors.bgTertiary, borderRadius: 6, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  const photos = card.photoCount === 1 ? '1 photo' : `${card.photoCount} photos`;
  const thumbs = card.thumbnails.length >= 3 ? card.thumbnails.slice(0, 3) : [];
  const href = card.shareSlug ? albumShareUrl(card.shareSlug) : undefined;
  const img: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${card.title}, ${photos}. View album`}
      style={{ ...box, display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{ height: 132, background: colors.bgTertiary, display: 'flex', gap: 2 }}>
        {thumbs.length === 3 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbs[0]} alt="" style={{ ...img, flex: 2 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbs[1]} alt="" style={{ ...img, flex: 1, minHeight: 0 }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbs[2]} alt="" style={{ ...img, flex: 1, minHeight: 0 }} />
            </div>
          </>
        ) : card.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.coverImage} alt="" style={img} />
        ) : null}
      </div>
      <div style={{ padding: '0.7rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.92rem', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.title}
          </span>
          <Badge badge={card.badge} />
        </div>
        <span style={{ fontSize: '0.78rem', color: colors.textSecondary }}>
          {photos}
          {card.photographerName ? ` · by ${card.photographerName}` : ''}
        </span>
        {card.badge === 'PRIVATE' && !isOwn ? (
          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#8A5A00' }}>Private · needs the access code</span>
        ) : null}
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--g-link, #083A85)', marginTop: 4 }}>View album ›</span>
      </div>
    </a>
  );
}

/**
 * The bubble for the two message types that are not plain text: a message the server hid ("Message removed"), and
 * one or more shared albums with an optional note.
 */
export function SpecialMessage({
  message,
  isOwn,
  time,
}: {
  message: { id: string; type: string; content: string; albumShare?: { albumIds: string[]; note?: string } };
  isOwn: boolean;
  time: string;
}) {
  const { colors } = useTheme();
  const row: React.CSSProperties = { display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '0.4rem' };
  const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '82%' };

  if (message.type === 'removed') {
    return (
      <div style={row}>
        <div
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: 16,
            border: `1px dashed ${colors.borderPrimary}`,
            fontSize: '0.88rem',
            fontStyle: 'italic',
            color: colors.textSecondary,
          }}
        >
          Message removed
        </div>
      </div>
    );
  }

  const share = message.albumShare;
  return (
    <div style={row}>
      <div style={col}>
        {(share?.albumIds ?? []).map((id) => (
          <AlbumShareCard key={id} albumId={id} isOwn={isOwn} />
        ))}
        {share?.note ? (
          <div
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: 16,
              fontSize: '0.92rem',
              backgroundColor: isOwn ? '#083A85' : colors.bgCard,
              color: isOwn ? '#fff' : colors.textPrimary,
              border: isOwn ? 'none' : `1px solid ${colors.borderPrimary}`,
            }}
          >
            {share.note}
          </div>
        ) : null}
        <span style={{ fontSize: '0.7rem', color: 'var(--g-text-muted, #9CA3AF)' }}>{time}</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------- the "+" and picker

/**
 * "+" beside the message field: a small panel ("Send to <name>"), then the album picker as a modal (a full-height sheet
 * on a phone). Photographer-only: the caller decides whether to render it.
 */
export function ShareAlbumButton({
  partnerId,
  partnerName,
  onSent,
}: {
  partnerId: string;
  partnerName: string;
  onSent: () => void;
}) {
  const { colors } = useTheme();
  const [panel, setPanel] = useState(false);
  const [picker, setPicker] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panel) return;
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setPanel(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [panel]);

  return (
    <div ref={wrap} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setPanel((v) => !v)}
        aria-label="Share something"
        aria-haspopup="menu"
        aria-expanded={panel}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `1px solid ${colors.borderPrimary}`,
          background: colors.bgTertiary,
          color: 'var(--g-link, #083A85)',
          fontSize: '1.5rem',
          lineHeight: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        +
      </button>
      {panel ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: 52,
            left: 0,
            width: 280,
            maxWidth: '80vw',
            padding: '0.75rem',
            borderRadius: 14,
            border: `1px solid ${colors.borderPrimary}`,
            background: colors.bgCard,
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary, margin: '0 0.25rem 0.5rem' }}>Send to {partnerName}</div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setPanel(false);
              setPicker(true);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              padding: '0.7rem',
              borderRadius: 12,
              border: `1px solid ${colors.borderPrimary}`,
              background: colors.bgTertiary,
              cursor: 'pointer',
              color: colors.textPrimary,
            }}
          >
            <span aria-hidden style={{ fontSize: '1.2rem' }}>🖼</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>Share an album</span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: colors.textSecondary }}>Send a link to one of your albums</span>
            </span>
            <span aria-hidden style={{ color: 'var(--g-link, #083A85)' }}>›</span>
          </button>
        </div>
      ) : null}
      {picker ? <AlbumShareModal partnerId={partnerId} partnerName={partnerName} onClose={() => setPicker(false)} onSent={onSent} /> : null}
    </div>
  );
}

function AlbumShareModal({
  partnerId,
  partnerName,
  onClose,
  onSent,
}: {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const { colors } = useTheme();
  const [albums, setAlbums] = useState<ShareableAlbum[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pickedTab, setPickedTab] = useState<ShareTab | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setAlbums(null);
    setLoadError(false);
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/albums`);
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.action === 0 || !Array.isArray(body?.data)) throw new Error('load');
      setAlbums(
        body.data
          .map((r: Record<string, unknown>) => mapShareable(r, (u) => normalizeImageUrl(u as string) || undefined))
          .filter((a: ShareableAlbum | null): a is ShareableAlbum => !!a),
      );
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    dialog.current?.focus();
  }, [load]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !sending && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose, sending]);

  const tab: ShareTab =
    pickedTab ??
    (albums && !albums.some((a) => a.tab === 'project') && albums.some((a) => a.tab === 'personal') ? 'personal' : 'project');
  const shown = useMemo(() => filterAlbums(albums ?? [], tab, query), [albums, tab, query]);

  const toggle = (a: ShareableAlbum) => {
    const r = toggleSelection(selected, a);
    setSelected(r.next);
    setProblem(r.limited ? `You can share up to ${MAX_ALBUMS_PER_SHARE} albums at once` : null);
  };

  const send = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    setProblem(null);
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/chat/send-albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: partnerId, albumIds: selected, note: note.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.action === 0) {
        setProblem(body?.message || 'Albums not sent. Please try again.');
        return;
      }
      onSent();
      onClose();
    } catch {
      setProblem('Albums not sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const tabBtn = (value: ShareTab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setPickedTab(value)}
      style={{
        flex: 1,
        padding: '0.5rem',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.88rem',
        background: tab === value ? '#083A85' : 'transparent',
        color: tab === value ? '#fff' : colors.textSecondary,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,16,32,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      className="album-share-scrim"
    >
      <style>{`
        @media (max-width: 640px) {
          .album-share-scrim { align-items: flex-end !important; padding: 0 !important; }
          .album-share-dialog { width: 100% !important; max-height: 92dvh !important; border-radius: 18px 18px 0 0 !important; }
        }
      `}</style>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Choose albums to send to ${partnerName}`}
        className="album-share-dialog"
        style={{
          width: 520,
          maxWidth: '100%',
          maxHeight: '86dvh',
          display: 'flex',
          flexDirection: 'column',
          background: colors.bgCard,
          color: colors.textPrimary,
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '1rem 1.25rem 0.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Choose albums</div>
            <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
              Send to {partnerName} · Up to {MAX_ALBUMS_PER_SHARE} at once
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Close" style={{ width: 44, height: 44, margin: '-0.5rem -0.75rem 0 0', border: 'none', background: 'transparent', fontSize: '1.3rem', cursor: 'pointer', color: colors.textSecondary }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, flex: 1 }}>
          {loadError ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: colors.textSecondary, marginBottom: 12 }}>Could not load your albums</div>
              <button type="button" onClick={() => void load()} style={{ padding: '0.6rem 1.2rem', borderRadius: 9999, border: 'none', background: '#083A85', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Try again
              </button>
            </div>
          ) : albums === null ? (
            <div aria-busy="true" aria-label="Loading albums" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0.5rem 0 1rem' }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: colors.bgTertiary }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: '55%', background: colors.bgTertiary, borderRadius: 6 }} />
                    <div style={{ height: 10, width: '30%', background: colors.bgTertiary, borderRadius: 6, marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No albums yet</div>
              <div style={{ color: colors.textSecondary, fontSize: '0.88rem', marginBottom: 14 }}>Create an album, then share it here.</div>
              <Link href="/user/photographer/events" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', borderRadius: 9999, background: '#083A85', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
                Create album
              </Link>
            </div>
          ) : (
            <>
              <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: colors.bgTertiary }}>
                {tabBtn('project', 'Project')}
                {tabBtn('personal', 'Personal')}
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search albums"
                aria-label="Search albums"
                style={{ padding: '0.65rem 0.9rem', borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textPrimary, fontSize: '0.9rem', outline: 'none' }}
              />
              <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
                {shown.length === 0 ? (
                  <div style={{ textAlign: 'center', color: colors.textSecondary, padding: '1.5rem 0', fontSize: '0.88rem' }}>
                    {query.trim() ? `No albums match "${query.trim()}"` : 'No albums yet'}
                  </div>
                ) : (
                  shown.map((a) => {
                    const on = selected.includes(a.id);
                    const disabled = !!a.disabledReason;
                    const reason = a.disabledReason === 'archived' ? 'Archived · restore to share' : a.disabledReason === 'empty' ? 'No photos yet' : null;
                    const photos = a.photoCount === 1 ? '1 photo' : `${a.photoCount} photos`;
                    const date = a.date ? new Date(a.date) : null;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        aria-disabled={disabled}
                        disabled={disabled}
                        onClick={() => toggle(a)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem',
                          borderRadius: 12,
                          border: `1px solid ${on ? '#083A85' : colors.borderPrimary}`,
                          background: on ? 'rgba(8,58,133,0.08)' : colors.bgCard,
                          color: colors.textPrimary,
                          opacity: disabled ? 0.6 : 1,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: colors.bgTertiary, flexShrink: 0 }}>
                          {a.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : null}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: colors.textSecondary }}>
                            {photos}
                            {date && !Number.isNaN(date.getTime()) ? ` · ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                          </span>
                          {reason ? <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#8A5A00' }}>{reason}</span> : null}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <Badge badge={a.badge} muted={disabled} />
                          <span aria-hidden style={{ fontSize: '1.15rem', color: on ? '#083A85' : colors.textSecondary }}>{on ? '●' : '○'}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {albums && albums.length > 0 ? (
          <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: `1px solid ${colors.borderPrimary}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {problem ? (
              <div role="alert" style={{ color: '#DC2626', fontSize: '0.85rem', fontWeight: 500 }}>
                {problem}
              </div>
            ) : null}
            {selected.length ? (
              <input
                type="text"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                aria-label="Add a note (optional)"
                style={{ padding: '0.65rem 0.9rem', borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textPrimary, fontSize: '0.9rem', outline: 'none' }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => void send()}
              disabled={!selected.length || sending}
              style={{
                padding: '0.8rem',
                borderRadius: 9999,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#fff',
                background: selected.length && !sending ? '#083A85' : '#9CA3AF',
                cursor: selected.length && !sending ? 'pointer' : 'not-allowed',
              }}
            >
              {sending ? 'Sending…' : selected.length === 0 ? 'Send albums' : selected.length === 1 ? 'Send 1 album' : `Send ${selected.length} albums`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
