"use client";

/**
 * Rebook Wizard — after a photographer declines a booking, the client or
 * coordinator picks an alternative from preference-matched recommendations
 * (or browses all available photographers) without re-entering any event
 * details. The event is reused server-side; only the new photographer +
 * package (and optional escrow/notes) are sent.
 *
 * Backend:
 *   GET  /api/remote/customer/events/{eventId}/rebook-recommendations
 *   GET  /api/remote/customer/events/{eventId}/rebook-browse?search=&page=&size=
 *   POST /api/remote/customer/events/{eventId}/rebook
 *
 * Design carried over from the greenfield sandbox (app/_design-sandbox/).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';

const NAVY = '#083A85';
const PINK = '#F20C8F';
const BRAND_GRADIENT = `linear-gradient(135deg, ${NAVY} 0%, ${PINK} 130%)`;

// ── Data shapes (subset of the backend payloads we render) ───────────────────
interface Pkg {
  id: string;
  packageName: string;
  price: number;
  currencyAbbreviation?: string;
  includedPhotos?: number;
  includedVideos?: number;
  deliveryDays?: number;
}
interface Photographer {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  rating?: number;
  address?: string;
  currentStatus?: string;
  nextAvailableDate?: string | null;
  packages: Pkg[];
}
interface Recommendation {
  photographer: Photographer;
  recommendedPackageId: string;
  categoryMatch: boolean;
}
interface EventSummary {
  id: string;
  title: string;
  eventDate: string;
  location?: string;
  category?: string;
  serviceType?: string | null;
  maxGuests?: number | null;
}

type ProjectColors = Record<string, string>;

interface RebookWizardProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  colors: ProjectColors;
  actualTheme: string;
  onSuccess?: () => void;
}

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

// ── Helpers ──────────────────────────────────────────────────────────────────
const initials = (p: Photographer) => `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase();
const money = (n?: number, c?: string) => (n == null ? '—' : `${c ?? ''} ${Number(n).toLocaleString()}`.trim());
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

// Map a raw backend photographer DTO into our render shape.
function mapPhotographer(raw: Record<string, unknown>): Photographer {
  const pkgs = Array.isArray(raw.packages) ? (raw.packages as Record<string, unknown>[]) : [];
  return {
    id: String(raw.id ?? ''),
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    profilePicture: raw.profilePicture ? String(raw.profilePicture) : undefined,
    rating: typeof raw.rating === 'number' ? raw.rating : undefined,
    address: raw.address ? String(raw.address) : undefined,
    currentStatus: raw.currentStatus ? String(raw.currentStatus) : undefined,
    nextAvailableDate: raw.nextAvailableDate ? String(raw.nextAvailableDate) : null,
    packages: pkgs.map((k) => ({
      id: String(k.id ?? ''),
      packageName: String(k.packageName ?? 'Package'),
      price: typeof k.price === 'number' ? k.price : Number(k.price ?? 0),
      currencyAbbreviation: k.currencyAbbreviation ? String(k.currencyAbbreviation) : undefined,
      includedPhotos: typeof k.includedPhotos === 'number' ? k.includedPhotos : undefined,
      includedVideos: typeof k.includedVideos === 'number' ? k.includedVideos : undefined,
      deliveryDays: typeof k.deliveryDays === 'number' ? k.deliveryDays : undefined,
    })),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function RebookWizard({ open, onClose, eventId, eventTitle, colors, actualTheme, onSuccess }: RebookWizardProps) {
  const isDark = actualTheme === 'dark';
  const c = useMemo(() => ({
    bgCard: colors.bgCard,
    bgSubtle: colors.bgTertiary,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textTertiary: colors.textTertiary,
    borderPrimary: colors.borderPrimary,
  }), [colors]);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [event, setEvent] = useState<EventSummary>({ id: eventId, title: eventTitle, eventDate: '' });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [escrowDefault, setEscrowDefault] = useState(50);
  const [notesDefault, setNotesDefault] = useState('');

  const [tab, setTab] = useState<'recommended' | 'browse'>('recommended');
  const [browse, setBrowse] = useState<Recommendation[]>([]);
  const [browseState, setBrowseState] = useState<LoadState>('loading');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Photographer | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [pkgId, setPkgId] = useState('');
  const [escrow, setEscrow] = useState(50);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'choose' | 'confirm' | 'success'>('choose');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const chosenPkg = useMemo(
    () => selected?.packages.find((k) => k.id === pkgId) ?? selected?.packages[0],
    [selected, pkgId],
  );

  // ── Fetch recommendations when the wizard opens ──
  const loadRecommendations = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/events/${eventId}/rebook-recommendations`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error(json?.message || 'Failed to load recommendations');
      const d = json.data;
      const evt = d.event || {};
      setEvent({
        id: String(evt.id ?? eventId),
        title: String(evt.title ?? eventTitle),
        eventDate: String(evt.eventDate ?? ''),
        location: evt.location ? String(evt.location) : undefined,
        category: evt.category ? String(evt.category) : undefined,
        serviceType: evt.serviceType ?? null,
        maxGuests: evt.maxGuests ?? null,
      });
      setEscrowDefault(typeof d.escrowPercentage === 'number' ? d.escrowPercentage : 50);
      setEscrow(typeof d.escrowPercentage === 'number' ? d.escrowPercentage : 50);
      setNotesDefault(d.notes ? String(d.notes) : '');
      setNotes(d.notes ? String(d.notes) : '');
      const recs: Recommendation[] = Array.isArray(d.recommendations)
        ? d.recommendations.map((r: Record<string, unknown>) => ({
            photographer: mapPhotographer((r.photographer as Record<string, unknown>) || {}),
            recommendedPackageId: String(r.recommendedPackageId ?? ''),
            categoryMatch: Boolean(r.categoryMatch),
          }))
        : [];
      setRecommendations(recs);
      setLoadState(recs.length ? 'ready' : 'empty');
    } catch {
      setLoadState('error');
    }
  }, [eventId, eventTitle]);

  useEffect(() => {
    if (open) {
      setStep('choose');
      setTab('recommended');
      setSelected(null);
      setSelectedRec(null);
      setSubmitError(null);
      loadRecommendations();
    }
  }, [open, loadRecommendations]);

  // ── Browse fallback (lazy, debounced on search) ──
  const loadBrowse = useCallback(async (term: string) => {
    setBrowseState('loading');
    try {
      const url = `${getApiUrl()}/api/remote/customer/events/${eventId}/rebook-browse?page=0&size=24${term ? `&search=${encodeURIComponent(term)}` : ''}`;
      const res = await dashboardAuthFetch(url);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error('Failed to load photographers');
      const content: Record<string, unknown>[] = Array.isArray(json.data.content) ? json.data.content : [];
      const items: Recommendation[] = content.map((raw) => {
        const p = mapPhotographer(raw);
        const cheapest = [...p.packages].sort((a, b) => a.price - b.price)[0];
        return { photographer: p, recommendedPackageId: cheapest?.id ?? '', categoryMatch: false };
      });
      setBrowse(items);
      setBrowseState(items.length ? 'ready' : 'empty');
    } catch {
      setBrowseState('error');
    }
  }, [eventId]);

  useEffect(() => {
    if (!open || tab !== 'browse') return;
    const t = setTimeout(() => loadBrowse(search), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [open, tab, search, loadBrowse]);

  const pickPhotographer = (rec: Recommendation) => {
    setSelected(rec.photographer);
    setSelectedRec(rec);
    setPkgId(rec.recommendedPackageId || rec.photographer.packages[0]?.id || '');
    setStep('confirm');
  };

  const submit = async () => {
    if (!selected || !chosenPkg) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/events/${eventId}/rebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographerId: selected.id, packageId: chosenPkg.id, escrowPercentage: escrow, notes }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.action === 0) throw new Error(json?.message || `Rebook failed (HTTP ${res.status})`);
      setStep('success');
      onSuccess?.();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to send rebook request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const activeList = tab === 'recommended' ? recommendations : browse;
  const activeState = tab === 'recommended' ? loadState : browseState;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(17,24,39,0.5)',
    backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1100,
  };
  const modal: React.CSSProperties = {
    position: 'relative', width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'hidden',
    background: c.bgCard, borderRadius: 20, border: `1px solid ${c.borderPrimary}`,
    boxShadow: '0 30px 70px -20px rgba(8,58,133,0.45)', display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <style>{`
        @keyframes rbwPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes rbwUp { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
        @keyframes rbwPop { 0%{transform:scale(0.6); opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1); opacity:1} }
        @keyframes rbwSpin { to { transform: rotate(360deg); } }
        .rbw-modal { animation: rbwUp 0.28s ease-out; }
      `}</style>
      <div className="rbw-modal" style={modal} onClick={(e) => e.stopPropagation()}>
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: BRAND_GRADIENT }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1.15rem 1.4rem', borderBottom: `1px solid ${c.borderPrimary}` }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 18px rgba(8,58,133,0.3)' }}>
            <i className="bi bi-arrow-repeat" style={{ fontSize: 19, color: '#fff' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: PINK }}>Rebook photographer</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title || eventTitle}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${c.borderPrimary}`, background: c.bgCard, color: c.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="bi bi-x-lg" style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.1rem 1.4rem', overflowY: 'auto' }}>
          {step === 'choose' && (
            <>
              <ReusedDetails event={event} escrow={escrowDefault} c={c} isDark={isDark} />

              <div style={{ display: 'flex', gap: 4, background: c.bgSubtle, borderRadius: 11, padding: 4, margin: '1rem 0' }}>
                {([['recommended', `Recommended${recommendations.length ? ` (${recommendations.length})` : ''}`], ['browse', 'Browse all']] as const).map(([key, label]) => {
                  const active = tab === key;
                  return (
                    <button key={key} onClick={() => setTab(key)} style={{
                      flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: active ? BRAND_GRADIENT : 'transparent', color: active ? '#fff' : c.textSecondary,
                      fontWeight: active ? 800 : 600, fontSize: '0.82rem', transition: 'all 0.18s',
                    }}>{label}</button>
                  );
                })}
              </div>

              {tab === 'browse' && (
                <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: c.textTertiary }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search photographers by name"
                    style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: 11, border: `1px solid ${c.borderPrimary}`, background: c.bgSubtle, color: c.textPrimary, fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>
              )}

              {activeState === 'loading' && <SkeletonGrid c={c} />}
              {activeState === 'error' && <ErrorState c={c} isDark={isDark} onRetry={() => (tab === 'recommended' ? loadRecommendations() : loadBrowse(search))} />}
              {activeState === 'empty' && (
                tab === 'recommended'
                  ? <EmptyState c={c} isDark={isDark} onBrowseAll={() => setTab('browse')} />
                  : <NoResults c={c} isDark={isDark} />
              )}
              {activeState === 'ready' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                  {activeList.map((rec) => (
                    <PhotographerCard key={rec.photographer.id} rec={rec} c={c} isDark={isDark} onSelect={() => pickPhotographer(rec)} />
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'confirm' && selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 1rem', borderRadius: 14, border: `1px solid ${c.borderPrimary}`, background: c.bgSubtle }}>
                <Avatar p={selected} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, color: c.textPrimary }}>{selected.firstName} {selected.lastName}</div>
                  <div style={{ fontSize: '0.78rem', color: c.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <i className="bi bi-star-fill" style={{ fontSize: 10, color: '#F5A623' }} /> {selected.rating ? selected.rating.toFixed(1) : 'New'}
                    {selectedRec?.categoryMatch && <span style={{ color: PINK, fontWeight: 700 }}>· Best match</span>}
                  </div>
                </div>
                <button onClick={() => setStep('choose')} style={{ fontSize: '0.78rem', fontWeight: 700, color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer' }}>Change</button>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textTertiary, marginBottom: 8 }}>Package</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.packages.map((k) => {
                    const active = (chosenPkg?.id ?? '') === k.id;
                    const isRec = selectedRec?.recommendedPackageId === k.id;
                    return (
                      <button key={k.id} data-ck-shape="card" onClick={() => setPkgId(k.id)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        padding: '0.7rem 0.85rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        background: active ? (isDark ? 'rgba(8,58,133,0.22)' : 'rgba(8,58,133,0.05)') : c.bgCard,
                        border: `1.5px solid ${active ? NAVY : c.borderPrimary}`, transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? NAVY : c.textTertiary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: NAVY }} />}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {k.packageName}
                              {isRec && <span style={{ fontSize: '0.58rem', fontWeight: 800, color: PINK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: c.textTertiary }}>
                              {[k.includedPhotos && `${k.includedPhotos} photos`, k.includedVideos ? `${k.includedVideos} videos` : null, k.deliveryDays && `${k.deliveryDays}d delivery`].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: c.textPrimary, whiteSpace: 'nowrap' }}>{money(k.price, k.currencyAbbreviation)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textTertiary, marginBottom: 8 }}>Payment mode</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[50, 70, 100].map((v) => {
                    const active = escrow === v;
                    return (
                      <button key={v} onClick={() => setEscrow(v)} style={{
                        flex: 1, padding: '0.55rem', borderRadius: 11, cursor: 'pointer',
                        background: active ? BRAND_GRADIENT : c.bgCard, color: active ? '#fff' : c.textSecondary,
                        border: `1.5px solid ${active ? 'transparent' : c.borderPrimary}`, fontSize: '0.82rem', fontWeight: 700,
                      }}>{v}% upfront</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: c.textTertiary, marginBottom: 8 }}>Notes to photographer <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything the photographer should know…" style={{
                  width: '100%', padding: '0.7rem', borderRadius: 12, resize: 'vertical',
                  border: `1px solid ${c.borderPrimary}`, background: c.bgSubtle, color: c.textPrimary, fontSize: '0.86rem', outline: 'none', fontFamily: 'inherit',
                }} />
              </div>

              {submitError && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '0.65rem 0.85rem', borderRadius: 10, background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: '#EF4444', fontSize: 12, marginTop: 2 }} />
                  <span style={{ fontSize: '0.82rem', color: isDark ? '#FCA5A5' : '#B91C1C', fontWeight: 500 }}>{submitError}</span>
                </div>
              )}
            </div>
          )}

          {step === 'success' && selected && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: 74, height: 74, margin: '0 auto 1.1rem', borderRadius: 22, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(16,185,129,0.4)', animation: 'rbwPop 0.4s ease-out' }}>
                <i className="bi bi-check-lg" style={{ fontSize: 38, color: '#fff' }} />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, marginBottom: 8 }}>Rebook request sent</div>
              <div style={{ fontSize: '0.9rem', color: c.textSecondary, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                We&apos;ve sent your request to <strong style={{ color: c.textPrimary }}>{selected.firstName} {selected.lastName}</strong> for <strong style={{ color: c.textPrimary }}>{event.title || eventTitle}</strong>. You&apos;ll be notified as soon as they respond.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'confirm' && (
          <div style={{ display: 'flex', gap: 10, padding: '1rem 1.4rem', borderTop: `1px solid ${c.borderPrimary}` }}>
            <button onClick={() => setStep('choose')} disabled={submitting} style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: `1px solid ${c.borderPrimary}`, background: c.bgCard, color: c.textPrimary, fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>Back</button>
            <button onClick={submit} disabled={submitting || !chosenPkg} style={{
              flex: 1.6, padding: '0.75rem', borderRadius: 12, border: 'none',
              background: BRAND_GRADIENT, color: '#fff', fontWeight: 700, fontSize: '0.92rem',
              cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.8 : 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 18px rgba(8,58,133,0.3)',
            }}>
              {submitting ? <><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rbwSpin 0.7s linear infinite' }} /> Sending…</> : <><i className="bi bi-send" style={{ fontSize: 13 }} /> Send rebook request</>}
            </button>
          </div>
        )}
        {step === 'success' && (
          <div style={{ padding: '1rem 1.4rem', borderTop: `1px solid ${c.borderPrimary}` }}>
            <button onClick={onClose} style={{ width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none', background: BRAND_GRADIENT, color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
interface TC { bgCard: string; bgSubtle: string; textPrimary: string; textSecondary: string; textTertiary: string; borderPrimary: string; }

function Avatar({ p, size = 52 }: { p: Photographer; size?: number }) {
  const src = p.profilePicture ? normalizeImageUrl(p.profilePicture) : '';
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`${p.firstName} ${p.lastName}`} width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div aria-hidden style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: BRAND_GRADIENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.36, letterSpacing: '-0.02em' }}>
      {initials(p)}
    </div>
  );
}

function ReusedDetails({ event, escrow, c, isDark }: { event: EventSummary; escrow: number; c: TC; isDark: boolean }) {
  const chips = [
    { icon: 'bi-calendar-event', label: 'Date', value: fmtDate(event.eventDate) },
    ...(event.location ? [{ icon: 'bi-geo-alt', label: 'Location', value: event.location }] : []),
    ...(event.category ? [{ icon: 'bi-tag', label: 'Type', value: event.category }] : []),
    { icon: 'bi-wallet2', label: 'Payment', value: `${escrow}% escrow` },
  ].filter((ch) => ch.value);
  return (
    <div style={{ background: isDark ? 'rgba(8,58,133,0.16)' : 'rgba(8,58,133,0.045)', border: `1px solid ${isDark ? 'rgba(8,58,133,0.30)' : 'rgba(8,58,133,0.12)'}`, borderRadius: 14, padding: '0.85rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.6rem' }}>
        <i className="bi bi-arrow-repeat" style={{ fontSize: 13, color: PINK }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: PINK }}>Reusing your original details</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.4rem' }}>
        {chips.map((ch) => (
          <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <i className={`bi ${ch.icon}`} style={{ fontSize: 13, color: NAVY, opacity: isDark ? 0.9 : 0.7 }} />
            <span style={{ fontSize: '0.7rem', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ch.label}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{ch.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotographerCard({ rec, c, isDark, onSelect }: { rec: Recommendation; c: TC; isDark: boolean; onSelect: () => void }) {
  const [hover, setHover] = useState(false);
  const p = rec.photographer;
  const pkg = p.packages.find((k) => k.id === rec.recommendedPackageId) ?? p.packages[0];
  const available = (p.currentStatus ?? 'available') !== 'booked';
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: c.bgCard, border: `1px solid ${hover ? (isDark ? 'rgba(242,12,143,0.45)' : 'rgba(8,58,133,0.28)') : c.borderPrimary}`,
      borderRadius: 16, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
      transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.18s', boxShadow: hover ? '0 12px 26px rgba(8,58,133,0.14)' : 'none', transform: hover ? 'translateY(-2px)' : 'none',
    }}>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
        <Avatar p={p} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.98rem', fontWeight: 700, color: c.textPrimary, letterSpacing: '-0.01em' }}>{p.firstName} {p.lastName}</span>
            {rec.categoryMatch && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: PINK, background: isDark ? 'rgba(242,12,143,0.16)' : 'rgba(242,12,143,0.08)', border: `1px solid ${isDark ? 'rgba(242,12,143,0.38)' : 'rgba(242,12,143,0.24)'}`, padding: '0.12rem 0.42rem', borderRadius: 9999 }}>
                <i className="bi bi-stars" style={{ fontSize: 9 }} /> Best match
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: c.textSecondary }}>
              <i className="bi bi-star-fill" style={{ fontSize: 10, color: '#F5A623' }} /> {p.rating ? p.rating.toFixed(1) : 'New'}
            </span>
            {p.address && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: c.textTertiary, minWidth: 0 }}>
                <i className="bi bi-geo-alt" style={{ fontSize: 10 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{p.address}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.7rem', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{pkg?.packageName ?? 'Package'}</div>
          <div style={{ fontSize: '1.02rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.01em' }}>{pkg ? money(pkg.price, pkg.currencyAbbreviation) : '—'}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.66rem', fontWeight: 700, color: available ? '#059669' : '#B45309', background: available ? (isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.09)') : (isDark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.10)'), border: `1px solid ${available ? 'rgba(16,185,129,0.30)' : 'rgba(245,158,11,0.30)'}`, padding: '0.2rem 0.5rem', borderRadius: 9999 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: available ? '#10B981' : '#F59E0B' }} /> {available ? 'Available' : 'Limited'}
        </span>
      </div>
      <button onClick={onSelect} style={{
        width: '100%', padding: '0.6rem', borderRadius: 11, border: 'none', cursor: 'pointer',
        background: hover ? BRAND_GRADIENT : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(8,58,133,0.06)'), color: hover ? '#fff' : NAVY,
        fontSize: '0.85rem', fontWeight: 700, letterSpacing: '-0.005em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.18s, color 0.18s',
      }}>
        Select photographer <i className="bi bi-arrow-right" style={{ fontSize: 12 }} />
      </button>
    </div>
  );
}

function SkeletonGrid({ c }: { c: TC }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ background: c.bgCard, border: `1px solid ${c.borderPrimary}`, borderRadius: 16, padding: '1rem' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: c.bgSubtle, animation: 'rbwPulse 1.4s ease-in-out infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, width: '70%', borderRadius: 6, background: c.bgSubtle, marginBottom: 8, animation: 'rbwPulse 1.4s ease-in-out infinite' }} />
              <div style={{ height: 10, width: '40%', borderRadius: 6, background: c.bgSubtle, animation: 'rbwPulse 1.4s ease-in-out infinite' }} />
            </div>
          </div>
          <div style={{ height: 40, borderRadius: 10, background: c.bgSubtle, marginTop: 16, animation: 'rbwPulse 1.4s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ c, isDark, onBrowseAll }: { c: TC; isDark: boolean; onBrowseAll: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 1rem', background: isDark ? 'rgba(8,58,133,0.18)' : 'rgba(8,58,133,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-search" style={{ fontSize: 26, color: NAVY }} />
      </div>
      <div style={{ fontSize: '1.02rem', fontWeight: 800, color: c.textPrimary, marginBottom: 6 }}>No exact matches for this date</div>
      <div style={{ fontSize: '0.88rem', color: c.textSecondary, maxWidth: 380, margin: '0 auto 1.2rem', lineHeight: 1.55 }}>
        We couldn&apos;t find photographers matching your event type and budget who are free that day. You can browse everyone available instead.
      </div>
      <button onClick={onBrowseAll} style={{ padding: '0.6rem 1.1rem', borderRadius: 11, border: 'none', cursor: 'pointer', background: BRAND_GRADIENT, color: '#fff', fontSize: '0.86rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 18px rgba(8,58,133,0.26)' }}>
        <i className="bi bi-people" style={{ fontSize: 13 }} /> Browse all available photographers
      </button>
    </div>
  );
}

function NoResults({ c, isDark }: { c: TC; isDark: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 0.9rem', background: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-person-x" style={{ fontSize: 24, color: c.textTertiary }} />
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: c.textPrimary, marginBottom: 4 }}>No photographers available</div>
      <div style={{ fontSize: '0.85rem', color: c.textSecondary, maxWidth: 340, margin: '0 auto', lineHeight: 1.5 }}>No one matches this search and is free on your event date. Try a different name.</div>
    </div>
  );
}

function ErrorState({ c, isDark, onRetry }: { c: TC; isDark: boolean; onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 1rem', background: isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-exclamation-triangle" style={{ fontSize: 26, color: '#EF4444' }} />
      </div>
      <div style={{ fontSize: '1.02rem', fontWeight: 800, color: c.textPrimary, marginBottom: 6 }}>Couldn&apos;t load photographers</div>
      <div style={{ fontSize: '0.88rem', color: c.textSecondary, maxWidth: 360, margin: '0 auto 1.2rem', lineHeight: 1.55 }}>Something went wrong. Please try again.</div>
      <button onClick={onRetry} style={{ padding: '0.6rem 1.1rem', borderRadius: 11, cursor: 'pointer', background: 'transparent', color: c.textPrimary, fontSize: '0.86rem', fontWeight: 700, border: `1px solid ${c.borderPrimary}`, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <i className="bi bi-arrow-clockwise" style={{ fontSize: 13 }} /> Try again
      </button>
    </div>
  );
}

export type { RebookWizardProps };
