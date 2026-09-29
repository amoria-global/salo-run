'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { Can, usePermissions } from '@/app/lib/usePermissions';
import { getApiUrl } from '@/lib/api';
import { useCurrency } from '@/app/context/CurrencyContext';

/**
 * Content-album tab on the photographer events page.
 *
 * CONTENT albums are stock-style paid albums in a curated category
 * (press / newspaper / luxury / diplomatic / nature / environment /
 * fashion / sports / etc.) browsed publicly on knockout and paid for
 * per-photo via the existing XentriPay album-purchase flow.
 *
 * Lifecycle:
 *   DRAFT → Submit for approval → PENDING_APPROVAL → admin → APPROVED
 *   (then photographer flips is_published to go live). REJECTED returns
 *   to DRAFT; the admin's reason rides on contentApprovalComment.
 *
 * Permission gating:
 *   albums.view   → list visible
 *   albums.create → "New content album" button visible
 *   albums.publish → "Submit for approval" button on draft / rejected rows
 *
 * This component is the photographer-side scaffolding only. The admin
 * review page + knockout public browse page are separate scopes.
 */

interface ContentImageDto { id: string; fileUrl: string; }
interface ContentAlbumDto {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  imageCount?: number;
  images?: ContentImageDto[];
  pricePerImage?: number;
  currencyAbbreviation?: string;
  currencySymbol?: string;
  contentCategory?: string;        // enum name e.g. PRESS
  contentCategoryLabel?: string;   // display label e.g. "Press"
  contentApprovalStatus?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  contentApprovalComment?: string;
  isPublished?: boolean;
  createdAt?: string;
  // Populated by backend only when the album is APPROVED + published -
  // backend hosts the slug-resolver at /api/public/content/album-by-slug.
  // Dashboard joins this with the knockout base URL to produce the
  // photographer's shareable deep link.
  shareSlug?: string;
}

// Public knockout host that serves /user/browse-photos/{slug}. We don't
// have the env var on the dashboard build (different app, different
// .env) - hardcode the prod domain so the copy-link button never breaks
// on an env miss. Override in dev by editing this one line.
const KNOCKOUT_PUBLIC_BASE = 'https://connekyt.com';

interface CategoryOption { name: string; label: string; }
interface CurrencyOption { id?: string; code: string; name?: string; }

interface Props {
  /** Currencies dropdown options. Reuse the list events.tsx already
   *  fetched via useCurrency() so we don't re-fetch. */
  currencies: CurrencyOption[];
  /** Default currency id (e.g. the photographer's last-picked one). */
  defaultCurrencyId?: string;
}

export default function ContentAlbumsTab({ currencies, defaultCurrencyId }: Props) {
  const { formatPrice } = useCurrency();
  const { hasPermission } = usePermissions();
  const [albums, setAlbums] = useState<ContentAlbumDto[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<ContentAlbumDto | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedSlugId, setCopiedSlugId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const apiUrl = useMemo(() => getApiUrl(), []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // We don't have a dedicated /content GET endpoint yet - reuse the
      // existing album-list endpoint and filter client-side. Adding a
      // dedicated endpoint is a follow-up if list-size becomes an issue.
      const [albRes, catRes] = await Promise.all([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/content/categories`),
      ]);
      if (catRes.ok) {
        const j = await catRes.json();
        setCategories(j?.data?.categories ?? []);
      }
      if (albRes.ok) {
        const j = await albRes.json();
        const list: ContentAlbumDto[] = Array.isArray(j?.data)
          ? j.data
          : Array.isArray(j?.data?.albums) ? j.data.albums : [];
        // Filter to content albums only (contentApprovalStatus is the
        // tell - only set for AlbumType.CONTENT rows).
        setAlbums(list.filter(a => !!a.contentApprovalStatus));
      } else {
        setError(`Failed to load: HTTP ${albRes.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);

  const handleCopyShareLink = async (album: ContentAlbumDto) => {
    if (!album.shareSlug) return;
    const url = `${KNOCKOUT_PUBLIC_BASE}/user/browse-photos/${album.shareSlug}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts where clipboard API is blocked.
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      setCopiedSlugId(album.id);
      setTimeout(() => setCopiedSlugId(prev => prev === album.id ? null : prev), 2500);
    } catch {
      alert('Could not copy link. Long-press to copy manually:\n' + url);
    }
  };

  const handleDelete = async (album: ContentAlbumDto) => {
    if (!confirm(`Delete content album "${album.title}"? Photos and the cover image will be removed from storage. This cannot be undone.`)) return;
    setDeletingId(album.id);
    try {
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/albums/${album.id}`,
        { method: 'DELETE' }
      );
      const j = await res.json().catch(() => ({} as Record<string, unknown>));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = j;
      if (!res.ok || data?.action === 0) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    if (!confirm('Submit this content album for admin approval? You won\'t be able to edit it while it\'s pending.')) return;
    setSubmittingId(id);
    try {
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/albums/content/${id}/submit`,
        { method: 'POST' });
      const j = await res.json().catch(() => ({} as Record<string, unknown>));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = j;
      if (!res.ok || data?.action === 0) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 4px' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        gap: 12, flexWrap: 'wrap', marginBottom: 18,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>Content albums</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#6b7280', maxWidth: 640 }}>
            Stock-style paid albums by category (press / newspaper / luxury / diplomatic /
            nature / etc.). Public can browse on Connekyt; per-photo download is paid.
            Each album must be admin-approved before it goes live.
          </p>
        </div>
        <Can permission="albums.create">
          <button onClick={() => setShowCreate(true)} style={btnPrimary}>
            + New content album
          </button>
        </Can>
      </header>

      {error && (
        <div style={{
          padding: 12, marginBottom: 14, borderRadius: 8,
          background: '#fef2f2', color: '#991b1b', fontSize: 13.5, border: '1px solid #fecaca',
        }}>{error}</div>
      )}

      {showCreate && (
        <CreateContentAlbumModal
          categories={categories}
          currencies={currencies}
          defaultCurrencyId={defaultCurrencyId}
          onClose={() => setShowCreate(false)}
          onCreated={async () => { setShowCreate(false); await refresh(); }}
        />
      )}

      {editingAlbum && (
        <EditContentAlbumModal
          album={editingAlbum}
          currencies={currencies}
          onClose={() => setEditingAlbum(null)}
          onSaved={async () => { setEditingAlbum(null); await refresh(); }}
        />
      )}

      {/* Filters + search - only show once we have at least one album so an
          empty workspace doesn't look intimidating. */}
      {!loading && albums.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          {/* Status chips */}
          <div style={{ display: 'inline-flex', gap: 4, background: '#f3f4f6', padding: 4, borderRadius: 999 }}>
            {([
              { key: 'ALL',              label: 'All',      count: albums.length },
              { key: 'DRAFT',            label: 'Draft',    count: albums.filter(a => a.contentApprovalStatus === 'DRAFT').length },
              { key: 'PENDING_APPROVAL', label: 'Pending',  count: albums.filter(a => a.contentApprovalStatus === 'PENDING_APPROVAL').length },
              { key: 'APPROVED',         label: 'Approved', count: albums.filter(a => a.contentApprovalStatus === 'APPROVED').length },
              { key: 'REJECTED',         label: 'Rejected', count: albums.filter(a => a.contentApprovalStatus === 'REJECTED').length },
            ] as const).map(c => {
              const active = statusFilter === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => setStatusFilter(c.key as any)}
                  style={{
                    padding: '6px 12px', fontSize: 12.5, fontWeight: 700,
                    color: active ? '#fff' : '#374151',
                    background: active ? '#111' : 'transparent',
                    border: 'none', borderRadius: 999, cursor: 'pointer',
                  }}
                >
                  {c.label} <span style={{ opacity: 0.7, fontWeight: 600 }}>· {c.count}</span>
                </button>
              );
            })}
          </div>

          {/* Category dropdown (only categories that actually appear in the list) */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ ...inp, width: 180, marginTop: 0 }}
          >
            <option value="">All categories</option>
            {Array.from(new Set(albums.map(a => a.contentCategory).filter(Boolean)))
              .map(cat => {
                const label = categories.find(c => c.name === cat)?.label || cat;
                return <option key={cat} value={cat as string}>{label}</option>;
              })}
          </select>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title…"
              style={{ ...inp, paddingLeft: 32, marginTop: 0 }}
            />
          </div>
        </div>
      )}

      {(() => {
        // Apply filters + search to the loaded list.
        const filtered = albums.filter(a => {
          if (statusFilter !== 'ALL' && a.contentApprovalStatus !== statusFilter) return false;
          if (categoryFilter && a.contentCategory !== categoryFilter) return false;
          if (search.trim()) {
            const q = search.trim().toLowerCase();
            if (!(a.title || '').toLowerCase().includes(q)) return false;
          }
          return true;
        });
        const filtersActive = statusFilter !== 'ALL' || !!categoryFilter || !!search.trim();

        if (loading) {
          return <div style={{ color: '#6b7280', padding: '16px 0' }}>Loading…</div>;
        }
        if (albums.length === 0) {
          return (
            <div style={{
              background: '#fff', border: '1px dashed #d1d5db', borderRadius: 12,
              padding: 36, textAlign: 'center', color: '#6b7280',
            }}>
              {hasPermission('albums.create')
                ? <>No content albums yet. Click <strong>+ New content album</strong> to create one.</>
                : <>No content albums yet. Ask an owner to grant you <code>albums.create</code> to publish.</>}
            </div>
          );
        }
        if (filtered.length === 0) {
          return (
            <div style={{
              background: '#fff', border: '1px dashed #d1d5db', borderRadius: 12,
              padding: 30, textAlign: 'center', color: '#6b7280',
            }}>
              No content albums match your filters.
              {filtersActive && (
                <> <button type="button" onClick={() => { setStatusFilter('ALL'); setCategoryFilter(''); setSearch(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#F20C8F', cursor: 'pointer', fontWeight: 700 }}>
                  Clear filters
                </button></>
              )}
            </div>
          );
        }

        return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
          {filtered.map(a => {
            const cover = a.coverImage || '/coverr.jpg';
            const status = a.contentApprovalStatus;
            const canEdit = status === 'DRAFT' || status === 'REJECTED';
            const canSubmit = status === 'DRAFT' || status === 'REJECTED';
            // Delete is always available - the photographer (or someone
            // with the perm) needs to be able to pull a live or pending
            // album. Backend cascades the disk cleanup either way.
            return (
              <div key={a.id} style={{ position: 'relative', height: 450, borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {/* Blurred cover behind = image-based glow border */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }}
                  style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }}
                />

                {/* Inner card */}
                <div style={{ position: 'absolute', inset: 7, borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000' }}>
                  {/* Full-bleed cover */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt={a.title}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />

                  {/* TOP: category pill (left) + status pill (right) */}
                  <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', right: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none', gap: 8 }}>
                    {a.contentCategoryLabel ? (
                      <div style={{
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        color: '#fff', padding: '0.28rem 0.7rem',
                        borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700,
                        letterSpacing: '0.02em',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        border: '1px solid rgba(255,255,255,0.18)',
                      }}>
                        <i className="bi bi-newspaper" style={{ fontSize: 10 }} />
                        {a.contentCategoryLabel}
                      </div>
                    ) : <span />}
                    <StatusBadge status={a.contentApprovalStatus} published={!!a.isPublished} />
                  </div>

                  {/* MIDDLE-BOTTOM: title block above the footer bar */}
                  <div style={{ position: 'absolute', bottom: '6.4rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.78)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem', fontWeight: 600 }}>
                      Content Album
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                      {a.title}
                    </div>
                    {(a.pricePerImage != null || a.currencyAbbreviation) && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                        {a.pricePerImage != null ? formatPrice(a.pricePerImage, a.currencyAbbreviation || undefined) : (a.currencyAbbreviation || '')} per photo
                      </div>
                    )}
                  </div>

                  {/* REJECTION reason - surfaced above the footer so the
                      photographer sees it without leaving the card. */}
                  {status === 'REJECTED' && a.contentApprovalComment && (
                    <div style={{
                      position: 'absolute', left: '0.7rem', right: '0.7rem', bottom: '5.5rem',
                      padding: '6px 10px',
                      background: 'rgba(220,38,38,0.20)', color: '#fff',
                      borderRadius: 8, fontSize: 11.5, border: '1px solid rgba(254,202,202,0.55)',
                      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                      maxHeight: 60, overflow: 'hidden',
                    }}>
                      <strong>Admin feedback:</strong> {a.contentApprovalComment}
                    </div>
                  )}

                  {/* FOOTER BAR: frosted glass over blurred cover */}
                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '0.55rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.10)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                    {/* Identity strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, marginBottom: '0.5rem' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '0.62rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        <i className="bi bi-collection" />
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Content Album · {(a.imageCount ?? 0)} photo{(a.imageCount ?? 0) === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Action row: Edit · Submit/Live · Delete · photo-count chip */}
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Can permission="albums.create">
                        <button type="button"
                          onClick={() => setEditingAlbum(a)}
                          disabled={!canEdit}
                          title={canEdit ? 'Edit album' : 'Withdraw or wait until rejection to edit'}
                          style={{
                            ...cardActionBtn,
                            background: canEdit
                              ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                              : 'rgba(255,255,255,0.12)',
                            cursor: canEdit ? 'pointer' : 'not-allowed',
                            opacity: canEdit ? 1 : 0.6,
                          }}
                        >
                          <i className="bi bi-pencil" style={{ fontSize: 11 }} /> Edit
                        </button>
                      </Can>

                      {canSubmit && (
                        <Can permission="albums.publish">
                          <button type="button"
                            onClick={() => handleSubmitForApproval(a.id)}
                            disabled={submittingId === a.id}
                            style={{
                              ...cardActionBtn,
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            }}
                          >
                            <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 11 }} />
                            {submittingId === a.id ? 'Submitting…' : 'Submit'}
                          </button>
                        </Can>
                      )}

                      {status === 'APPROVED' && a.isPublished && (
                        <span style={{
                          ...cardActionBtn,
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                          cursor: 'default',
                        }}>
                          <i className="bi bi-broadcast" style={{ fontSize: 11 }} /> Live
                        </span>
                      )}

                      {/* Share link - only on live albums (shareSlug is
                          backend-populated when the album is APPROVED +
                          published). Copies the slug deep-link to the
                          buyer-facing page so photographers can post
                          directly anywhere. */}
                      {a.shareSlug && (
                        <button type="button"
                          onClick={() => handleCopyShareLink(a)}
                          title="Copy public link to this album"
                          aria-label="Copy share link"
                          style={{
                            ...cardActionBtn,
                            background: copiedSlugId === a.id
                              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                              : 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                          }}
                        >
                          <i className={`bi ${copiedSlugId === a.id ? 'bi-check2' : 'bi-link-45deg'}`} style={{ fontSize: 12 }} />
                          {copiedSlugId === a.id ? 'Copied' : 'Copy link'}
                        </button>
                      )}

                      <Can permission="albums.delete">
                        <button type="button"
                          onClick={() => handleDelete(a)}
                          disabled={deletingId === a.id}
                          title="Delete album"
                          aria-label="Delete content album"
                          style={{
                            ...cardActionBtn,
                            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          }}
                        >
                          <i className="bi bi-trash" style={{ fontSize: 11 }} />
                          {deletingId === a.id ? '…' : 'Delete'}
                        </button>
                      </Can>

                      <span style={{
                        marginLeft: 'auto',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#fff', padding: '0.38rem 0.7rem', borderRadius: 9,
                        fontSize: '0.72rem', fontWeight: 700,
                        boxShadow: '0 4px 10px rgba(99,102,241,0.30)',
                      }}>
                        <i className="bi bi-images" style={{ fontSize: 11 }} /> {a.imageCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}

function StatusBadge({ status, published }: { status?: string; published?: boolean }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    DRAFT:            { bg: '#f3f4f6', fg: '#374151', label: 'Draft' },
    PENDING_APPROVAL: { bg: '#fef3c7', fg: '#92400e', label: 'Pending approval' },
    APPROVED:         published
                        ? { bg: '#d1fae5', fg: '#065f46', label: 'Live' }
                        : { bg: '#dbeafe', fg: '#1e40af', label: 'Approved' },
    REJECTED:         { bg: '#fee2e2', fg: '#991b1b', label: 'Rejected' },
  };
  const v = map[status ?? 'DRAFT'] ?? map.DRAFT;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: v.fg, background: v.bg,
      padding: '3px 9px', borderRadius: 999, letterSpacing: 0.3,
    }}>
      {v.label}
    </span>
  );
}

function CreateContentAlbumModal({
  categories, currencies, defaultCurrencyId, onClose, onCreated,
}: {
  categories: CategoryOption[];
  currencies: CurrencyOption[];
  defaultCurrencyId?: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pricePerImage, setPricePerImage] = useState('');
  const [currencyId, setCurrencyId] = useState(defaultCurrencyId || '');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [photosDragOver, setPhotosDragOver] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const apiUrl = useMemo(() => getApiUrl(), []);

  // Generate object URLs for preview thumbnails. Revoke on cleanup to
  // avoid the memory leak the browser silently accumulates otherwise.
  useEffect(() => {
    const urls = images.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [images]);
  useEffect(() => {
    if (!coverImage) { setCoverPreview(null); return; }
    const u = URL.createObjectURL(coverImage);
    setCoverPreview(u);
    return () => { URL.revokeObjectURL(u); };
  }, [coverImage]);

  const onlyImages = (files: FileList | File[] | null) =>
    Array.from(files || []).filter(f => f.type.startsWith('image/'));

  const addPhotos = (files: FileList | File[] | null) => {
    const next = onlyImages(files);
    if (next.length === 0) return;
    setImages(prev => [...prev, ...next]);
  };
  const removePhoto = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required'); return; }
    if (!category) { setError('Pick a category'); return; }
    if (!pricePerImage || Number(pricePerImage) < 100) { setError('Price per image must be at least 100'); return; }
    if (!currencyId) { setError('Pick a currency'); return; }
    if (images.length === 0) { setError('Upload at least one photo'); return; }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      if (description) fd.append('description', description);
      fd.append('category', category);
      fd.append('pricePerImage', pricePerImage);
      fd.append('currencyId', currencyId);
      if (coverImage) fd.append('coverImage', coverImage);
      for (const f of images) fd.append('images', f);

      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/content`, {
        method: 'POST', body: fd,
      });
      const j = await res.json().catch(() => ({} as Record<string, unknown>));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = j;
      if (!res.ok || data?.action === 0) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680,
        padding: 24, maxHeight: '90dvh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>New content album</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#6b7280' }}>
          Saved as a draft. Hit <strong>Submit for approval</strong> when you&apos;re ready
          and we&apos;ll review it before it goes live on Connekyt&apos;s public browse.
        </p>
        {error && (
          <div style={{ padding: 10, borderRadius: 6, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <form onSubmit={submit}>
          <label style={lbl}>Title
            <input value={title} onChange={e => setTitle(e.target.value)} style={inp} placeholder="e.g. Diplomatic Reception, Kigali 2026" required />
          </label>
          <label style={lbl}>Description (optional)
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, minHeight: 70, resize: 'vertical' }} placeholder="Caption-style summary that public browsers will see." />
          </label>
          <label style={lbl}>Category
            <select value={category} onChange={e => setCategory(e.target.value)} style={inp} required>
              <option value="">- Pick a category -</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.label}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={lbl}>Price per image
              <input type="number" min={100} step="1" value={pricePerImage} onChange={e => setPricePerImage(e.target.value)} style={inp} placeholder="e.g. 500" required />
            </label>
            <label style={lbl}>Currency
              <select value={currencyId} onChange={e => setCurrencyId(e.target.value)} style={inp} required>
                <option value="">- Pick -</option>
                {currencies.map(c => (
                  <option key={c.id || c.code} value={c.id || c.code}>
                    {c.code}{c.name ? ` - ${c.name}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Cover image - drag-drop zone with preview */}
          <div style={{ marginTop: 14 }}>
            <div style={lblTitle}>Cover image (optional)</div>
            <div
              onClick={() => coverInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setCoverDragOver(true); }}
              onDragLeave={() => setCoverDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setCoverDragOver(false);
                const f = onlyImages(e.dataTransfer.files)[0];
                if (f) setCoverImage(f);
              }}
              style={{ ...dropZone(coverDragOver), padding: '0.9rem 1rem', minHeight: 70, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="cover" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coverImage?.name}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>Click or drop a new image to replace.</div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(null); if (coverInputRef.current) coverInputRef.current.value = ''; }}
                    style={iconRemoveBtn} aria-label="Remove cover">&times;</button>
                </>
              ) : (
                <>
                  <div style={cloudIcon}>
                    <i className="bi bi-image" style={{ fontSize: 18, color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Click or drop a cover image</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>Falls back to your first photo if you skip this.</div>
                  </div>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file" accept="image/*"
                onChange={e => setCoverImage(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Photos - drag-drop zone + thumbnail grid */}
          <div style={{ marginTop: 14 }}>
            <div style={lblTitle}>Photos (required)</div>
            <div
              onClick={() => photosInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setPhotosDragOver(true); }}
              onDragLeave={() => setPhotosDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setPhotosDragOver(false);
                addPhotos(e.dataTransfer.files);
              }}
              style={{ ...dropZone(photosDragOver), padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ ...cloudIcon, margin: '0 auto 8px' }}>
                <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <p style={{ margin: '0', fontSize: 14, color: '#111', fontWeight: 700 }}>Click to upload photos</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>or drag &amp; drop your files here</p>
              {images.length > 0 && (
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#054d6f', fontWeight: 600 }}>
                  {images.length} photo{images.length === 1 ? '' : 's'} ready
                </p>
              )}
              <input
                ref={photosInputRef}
                type="file" accept="image/*" multiple
                onChange={e => { addPhotos(e.target.files); if (photosInputRef.current) photosInputRef.current.value = ''; }}
                style={{ display: 'none' }}
              />
            </div>

            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))', gap: 8, marginTop: 10 }}>
                {previews.map((p, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', aspectRatio: '1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removePhoto(i)} aria-label="Remove photo"
                      style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(220,38,38,0.92)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <button type="button" onClick={onClose} style={btnSecondary} disabled={busy}>Cancel</button>
            <button type="submit" style={btnPrimary} disabled={busy}>{busy ? 'Creating…' : 'Create draft'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginTop: 12,
};
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13.5, borderRadius: 8,
  border: '1px solid #e5e7eb', outline: 'none', marginTop: 4,
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', fontSize: 13.5, fontWeight: 700, borderRadius: 8,
  background: '#F20C8F', color: '#fff', border: 'none', cursor: 'pointer',
};
const btnPrimarySm: React.CSSProperties = { ...btnPrimary, padding: '6px 12px', fontSize: 12.5 };
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', fontSize: 13.5, fontWeight: 700, borderRadius: 8,
  background: '#fff', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer',
};
const lblTitle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 700, color: '#F20C8F',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};
const dropZone = (active: boolean): React.CSSProperties => ({
  border: `2px dashed ${active ? '#F20C8F' : 'rgba(242,12,143,0.35)'}`,
  borderRadius: 12,
  background: active
    ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.12) 100%)'
    : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
  transition: 'border-color 0.15s, background 0.15s',
});
const cloudIcon: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 12,
  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 8px 18px rgba(242,12,143,0.30)', flexShrink: 0,
};
const iconRemoveBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%',
  background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
  cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const btnSecondarySm: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12.5, fontWeight: 600, borderRadius: 8,
  background: '#fff', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center',
};
const btnDangerSm: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12.5, fontWeight: 600, borderRadius: 8,
  background: '#fff', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center',
};
// Pill button used on the polished card footer - matches the
// regular-album card actions in events.tsx (gradient bg, white text,
// rounded 9px, small icon + label).
const cardActionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  padding: '0.42rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
  color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(0,0,0,0.20)',
  transition: 'transform 0.15s',
};

/**
 * Edit modal for DRAFT / REJECTED content albums.
 *
 * Reuses the existing per-album endpoints (no new backend work):
 *   PUT    /api/remote/photographer/albums/{id}             metadata + cover
 *   POST   /api/remote/photographer/albums/{id}/images      add a photo (one per call)
 *   DELETE /api/remote/photographer/albums/{id}/images/{id} remove a photo
 *
 * Existing photos are removed immediately on click (DELETE fires from the
 * × button). Adds are staged locally and uploaded on Save so the
 * photographer can drop a batch without N round-trips firing mid-pick.
 *
 * Edit is only surfaced for DRAFT/REJECTED rows (see button gate above) -
 * PENDING and APPROVED states shouldn't be silently mutated.
 */
function EditContentAlbumModal({
  album, currencies, onClose, onSaved,
}: {
  album: ContentAlbumDto;
  currencies: CurrencyOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(album.title || '');
  const [description, setDescription] = useState(album.description || '');
  const [pricePerImage, setPricePerImage] = useState(
    album.pricePerImage != null ? String(album.pricePerImage) : ''
  );
  const [currencyId, setCurrencyId] = useState(() => {
    // Pre-select whichever currency matches the album's code/abbr.
    const code = album.currencyAbbreviation || '';
    const match = currencies.find(c => c.code === code);
    return match ? (match.id || match.code) : '';
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ContentImageDto[]>(album.images || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [photosDragOver, setPhotosDragOver] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const apiUrl = useMemo(() => getApiUrl(), []);

  useEffect(() => {
    const urls = newImages.map(f => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [newImages]);
  useEffect(() => {
    if (!coverImage) { setCoverPreview(null); return; }
    const u = URL.createObjectURL(coverImage);
    setCoverPreview(u);
    return () => { URL.revokeObjectURL(u); };
  }, [coverImage]);

  const onlyImages = (files: FileList | File[] | null) =>
    Array.from(files || []).filter(f => f.type.startsWith('image/'));

  const addNewPhotos = (files: FileList | File[] | null) => {
    const next = onlyImages(files);
    if (next.length === 0) return;
    setNewImages(prev => [...prev, ...next]);
  };
  const removeNewPhoto = (idx: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingPhoto = async (img: ContentImageDto) => {
    if (!confirm('Remove this photo from the album?')) return;
    setRemovingId(img.id);
    try {
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/albums/${album.id}/images/${img.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as Record<string, unknown>));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((j as any)?.message || `HTTP ${res.status}`);
      }
      setExistingImages(prev => prev.filter(p => p.id !== img.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setRemovingId(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required'); return; }
    if (!pricePerImage || Number(pricePerImage) < 100) { setError('Price per image must be at least 100'); return; }
    if (!currencyId) { setError('Pick a currency'); return; }
    const totalAfter = existingImages.length + newImages.length;
    if (totalAfter === 0) { setError('Album must have at least one photo'); return; }

    setBusy(true);
    try {
      // 1) Metadata + cover (existing PUT shape - title is required even
      //    on partial updates; everything else is optional and skipped
      //    server-side when null).
      const fd = new FormData();
      fd.append('title', title.trim());
      if (description) fd.append('description', description);
      fd.append('pricePerImage', pricePerImage);
      fd.append('currencyId', currencyId);
      if (coverImage) fd.append('coverImage', coverImage);

      const putRes = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/albums/${album.id}`,
        { method: 'PUT', body: fd }
      );
      const putJson = await putRes.json().catch(() => ({} as Record<string, unknown>));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!putRes.ok || (putJson as any)?.action === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((putJson as any)?.message || `Update failed (HTTP ${putRes.status})`);
      }

      // 2) Upload any newly-added photos. The existing /images endpoint
      //    takes one file at a time, so loop. We POST sequentially to
      //    keep the order predictable and avoid hammering the upload pipe.
      for (const f of newImages) {
        const ifd = new FormData();
        ifd.append('file', f);
        const r = await dashboardAuthFetch(
          `${apiUrl}/api/remote/photographer/albums/${album.id}/images`,
          { method: 'POST', body: ifd }
        );
        if (!r.ok) {
          const j = await r.json().catch(() => ({} as Record<string, unknown>));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          throw new Error((j as any)?.message || `Photo upload failed (HTTP ${r.status})`);
        }
      }

      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 720,
        padding: 24, maxHeight: '92dvh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Edit content album</h3>
          {album.contentCategoryLabel && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#054d6f', background: '#eef6fb',
              padding: '3px 9px', borderRadius: 999, letterSpacing: 0.3,
            }}>{album.contentCategoryLabel}</span>
          )}
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#6b7280' }}>
          Status: <strong>{album.contentApprovalStatus}</strong>.
          {album.contentApprovalStatus === 'REJECTED' && (
            <> Re-submit for approval after you&apos;ve addressed the admin&apos;s feedback.</>
          )}
        </p>

        {album.contentApprovalStatus === 'REJECTED' && album.contentApprovalComment && (
          <div style={{
            padding: 10, marginBottom: 12, background: '#fef2f2', color: '#991b1b',
            borderRadius: 6, fontSize: 12.5, border: '1px solid #fecaca',
          }}>
            <strong>Admin feedback:</strong> {album.contentApprovalComment}
          </div>
        )}

        {error && (
          <div style={{ padding: 10, borderRadius: 6, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <label style={lbl}>Title
            <input value={title} onChange={e => setTitle(e.target.value)} style={inp} required />
          </label>
          <label style={lbl}>Description (optional)
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, minHeight: 70, resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={lbl}>Price per image
              <input type="number" min={100} step="1" value={pricePerImage} onChange={e => setPricePerImage(e.target.value)} style={inp} required />
            </label>
            <label style={lbl}>Currency
              <select value={currencyId} onChange={e => setCurrencyId(e.target.value)} style={inp} required>
                <option value="">- Pick -</option>
                {currencies.map(c => (
                  <option key={c.id || c.code} value={c.id || c.code}>
                    {c.code}{c.name ? ` - ${c.name}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Cover image */}
          <div style={{ marginTop: 14 }}>
            <div style={lblTitle}>Cover image</div>
            <div
              onClick={() => coverInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setCoverDragOver(true); }}
              onDragLeave={() => setCoverDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setCoverDragOver(false);
                const f = onlyImages(e.dataTransfer.files)[0];
                if (f) setCoverImage(f);
              }}
              style={{ ...dropZone(coverDragOver), padding: '0.9rem 1rem', minHeight: 70, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              {coverPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="new cover" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coverImage?.name}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>New cover (saved when you click Save).</div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(null); if (coverInputRef.current) coverInputRef.current.value = ''; }}
                    style={iconRemoveBtn} aria-label="Cancel cover replacement">&times;</button>
                </>
              ) : album.coverImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={album.coverImage} alt="current cover" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Current cover</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>Click or drop a new image to replace.</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={cloudIcon}>
                    <i className="bi bi-image" style={{ fontSize: 18, color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Click or drop a cover image</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>Falls back to the first photo otherwise.</div>
                  </div>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file" accept="image/*"
                onChange={e => setCoverImage(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Existing photos */}
          <div style={{ marginTop: 14 }}>
            <div style={lblTitle}>Photos in album ({existingImages.length})</div>
            {existingImages.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#6b7280', padding: '10px 0' }}>
                No photos left in this album. Add some below before saving.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))', gap: 8 }}>
                {existingImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', aspectRatio: '1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removeExistingPhoto(img)} disabled={removingId === img.id}
                      aria-label="Remove photo"
                      style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: removingId === img.id ? 'rgba(107,114,128,0.92)' : 'rgba(220,38,38,0.92)', color: '#fff', border: 'none', cursor: removingId === img.id ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {removingId === img.id ? '…' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add more photos */}
          <div style={{ marginTop: 14 }}>
            <div style={lblTitle}>Add more photos</div>
            <div
              onClick={() => photosInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setPhotosDragOver(true); }}
              onDragLeave={() => setPhotosDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setPhotosDragOver(false);
                addNewPhotos(e.dataTransfer.files);
              }}
              style={{ ...dropZone(photosDragOver), padding: '1.2rem 1rem', textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ ...cloudIcon, margin: '0 auto 8px' }}>
                <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <p style={{ margin: '0', fontSize: 14, color: '#111', fontWeight: 700 }}>Click to upload photos</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>or drag &amp; drop your files here</p>
              {newImages.length > 0 && (
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#054d6f', fontWeight: 600 }}>
                  {newImages.length} new photo{newImages.length === 1 ? '' : 's'} staged · uploads on Save
                </p>
              )}
              <input
                ref={photosInputRef}
                type="file" accept="image/*" multiple
                onChange={e => { addNewPhotos(e.target.files); if (photosInputRef.current) photosInputRef.current.value = ''; }}
                style={{ display: 'none' }}
              />
            </div>
            {newPreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))', gap: 8, marginTop: 10 }}>
                {newPreviews.map((p, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid #F20C8F33', aspectRatio: '1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt={`New ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removeNewPhoto(i)} aria-label="Remove staged photo"
                      style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(220,38,38,0.92)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      &times;
                    </button>
                    <span style={{ position: 'absolute', bottom: 3, left: 3, fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(242,12,143,0.85)', padding: '2px 5px', borderRadius: 4, letterSpacing: 0.3 }}>NEW</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <button type="button" onClick={onClose} style={btnSecondary} disabled={busy}>Cancel</button>
            <button type="submit" style={btnPrimary} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
