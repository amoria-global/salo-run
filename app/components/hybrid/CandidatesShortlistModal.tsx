"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { getLandingUrl } from '@/lib/urls';
import {
  budgetLabel,
  convertToDirect,
  getCandidatesOverview,
  getHybridOptions,
  hhmm,
  selectEventPhotographer,
  syncServerClock,
  TIER_META,
  type CandidateSummary,
  type CandidatesOverview,
  type RecommendationTier,
} from '@/app/lib/hybridBooking';
import { isMatchBooked } from '@/app/lib/hybridStatus';
import { CountdownText, HybridStyles, MODE_META, Notice, TierBadge } from './hybridUi';

interface CandidatesShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
  eventStatus?: string;
  latitude?: number;
  longitude?: number;
  eventDate?: string;
  onPhotographerSelected: (photographerId: string, result: any, candidate?: CandidateSummary) => void;
  /** Open the wizard to post this event again after matching ended. */
  onRepost?: () => void;
  /** Matching stopped; continue with Find a Photographer. */
  onConvertedToDirect?: () => void;
}

const TIERS: RecommendationTier[] = ['HIGH', 'MEDIUM', 'LOW'];

/**
 * The client's view of a posted event: who said yes, grouped by how well
 * they fit, and the progress of everyone else. Only photographers who
 * approved are listed. Choosing one is re-checked by the server and creates
 * the booking; the client picks the first payment (50, 70 or 100%).
 */
export default function CandidatesShortlistModal({
  isOpen, onClose, eventId, eventTitle, onPhotographerSelected, onRepost, onConvertedToDirect,
}: CandidatesShortlistModalProps) {
  const { colors } = useTheme();
  const [data, setData] = useState<CandidatesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [choosing, setChoosing] = useState<CandidateSummary | null>(null);
  const [escrow, setEscrow] = useState(50);
  const [escrowOptions, setEscrowOptions] = useState<number[]>([50, 70, 100]);
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [booked, setBooked] = useState<{ candidate: CandidateSummary; result: any } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await getCandidatesOverview(eventId);
      setData(d);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not load the photographers who answered.' });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setBooked(null);
    setChoosing(null);
    syncServerClock();
    getHybridOptions().then((o) => setEscrowOptions(o.escrowOptions)).catch(() => {});
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [isOpen, load]);

  if (!isOpen) return null;

  const confirmChoice = async () => {
    if (!choosing) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const result = await selectEventPhotographer(eventId, {
        candidateId: choosing.candidateId,
        photographerId: choosing.photographerId,
        escrowPercentage: escrow,
      });
      setBooked({ candidate: choosing, result });
      setChoosing(null);
    } catch (e: any) {
      setChoosing(null);
      setNotice({ tone: 'error', text: e?.message || 'Could not confirm this photographer.' });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const switchToDirect = async () => {
    setConverting(true);
    try {
      await convertToDirect(eventId);
      onConvertedToDirect?.();
      onClose();
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not switch to Find a Photographer.' });
    } finally {
      setConverting(false);
    }
  };

  const title = data?.eventTitle || eventTitle || 'Your event';
  const candidates = data?.candidates ?? [];
  const active = data?.matchStatus === 'ACTIVE';

  const CandidateCard = ({ c }: { c: CandidateSummary }) => {
    const profileUrl = c.slug ? `${getLandingUrl()}/${c.slug}` : null;
    return (
      <article style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 16, border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: colors.bgTertiary, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: colors.brandPrimary, fontSize: 20 }}>
          {c.profilePicture ? <img src={c.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.photographerName.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: colors.textPrimary }}>{c.photographerName}</h4>
            <TierBadge tier={c.recommendationTier} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: '0.8rem', color: colors.textSecondary }}>
            <span><i className={`bi ${c.photographerType === 'STUDIO' ? 'bi-building' : 'bi-person'}`} aria-hidden /> {c.photographerType === 'STUDIO' ? 'Company / Studio' : 'Freelancer / Individual'}</span>
            {c.distanceLabel && <span><i className="bi bi-geo-alt" aria-hidden /> {c.distanceLabel}</span>}
            {c.rating != null && c.reviewCount ? <span><i className="bi bi-star-fill" aria-hidden style={{ color: '#F59E0B' }} /> {c.rating.toFixed(1)} ({c.reviewCount} review{c.reviewCount === 1 ? '' : 's'})</span> : <span style={{ color: colors.textTertiary }}>No reviews yet</span>}
            {c.typicalPriceRange && <span><i className="bi bi-tag" aria-hidden /> {c.typicalPriceRange}</span>}
            {c.instagramHandle && <span><i className="bi bi-instagram" aria-hidden /> @{c.instagramHandle}</span>}
          </div>
          {c.specialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {c.specialties.slice(0, 4).map((s) => <span key={s} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, background: colors.bgTertiary, color: colors.textSecondary }}>{s}</span>)}
            </div>
          )}
          {c.about && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: colors.textTertiary, lineHeight: 1.45 }}>{c.about}</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: 140 }}>
          <button type="button" className="hy-focus" onClick={() => { setEscrow(50); setChoosing(c); }}
            style={{ padding: '0.6rem 1rem', borderRadius: 10, border: 'none', background: MODE_META.HYBRID.color, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            Choose
          </button>
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="hy-focus"
              style={{ textAlign: 'center', padding: '0.5rem 1rem', borderRadius: 10, border: `1.5px solid ${colors.borderPrimary}`, color: colors.textPrimary, fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>
              View portfolio <i className="bi bi-box-arrow-up-right" aria-hidden />
            </a>
          )}
        </div>
      </article>
    );
  };

  let body: React.ReactNode;
  if (loading && !data) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1].map((i) => <div key={i} style={{ height: 96, borderRadius: 16, background: colors.bgTertiary, animation: 'hy-pulse 1.2s infinite' }} />)}
      </div>
    );
  } else if (booked) {
    const pct = booked.result?.escrowPercentage ?? escrow;
    body = (
      <div style={{ textAlign: 'center', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span aria-hidden style={{ width: 64, height: 64, borderRadius: '50%', background: colors.statusSuccessBg, color: colors.statusSuccess, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
          <i className="bi bi-check-lg" />
        </span>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary }}>{booked.candidate.photographerName} is booked</div>
        <p style={{ margin: 0, maxWidth: 440, color: colors.textSecondary, fontSize: '0.88rem' }}>
          Pay your {pct}% first payment to confirm it. Connekyt holds the money and releases it to the photographer by the usual milestones.
          {booked.result?.depositAmount ? <> Amount due: <strong>{Math.round(booked.result.depositAmount).toLocaleString('en-US')} {booked.result.currency || 'RWF'}</strong>.</> : null}
        </p>
      </div>
    );
  } else if (candidates.length > 0) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {TIERS.filter((t) => candidates.some((c) => c.recommendationTier === t)).map((t) => (
          <section key={t} aria-label={TIER_META[t].label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: TIER_META[t].color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{TIER_META[t].label}</h3>
              <span style={{ fontSize: '0.76rem', color: colors.textTertiary }}>{TIER_META[t].hint}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidates.filter((c) => c.recommendationTier === t).map((c) => <CandidateCard key={c.candidateId || c.photographerId} c={c} />)}
            </div>
          </section>
        ))}
        <p style={{ margin: 0, fontSize: '0.74rem', color: colors.textTertiary }}>
          Groups show how closely each photographer fits your request. They are a recommendation, not a guarantee of quality.
        </p>
      </div>
    );
  } else if (isMatchBooked(data)) {
    // Someone was chosen: the answers are closed because the event is booked, not because matching failed.
    body = (
      <div style={{ textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span aria-hidden style={{ width: 60, height: 60, borderRadius: '50%', background: colors.statusSuccessBg, color: colors.statusSuccess, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          <i className="bi bi-check-lg" />
        </span>
        <div style={{ fontWeight: 800, color: colors.textPrimary }}>A photographer is booked for this event</div>
        <p style={{ margin: 0, maxWidth: 420, fontSize: '0.86rem', color: colors.textSecondary }}>
          Answers are closed. The booking and its first payment are on the event page.
        </p>
        <button type="button" className="hy-focus" onClick={() => onPhotographerSelected('', null)}
          style={{ padding: '0.7rem 1.4rem', borderRadius: 12, border: 'none', background: colors.brandPrimary, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
          Open the event <i className="bi bi-arrow-right" aria-hidden />
        </button>
      </div>
    );
  } else if (active) {
    body = (
      <div style={{ textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span aria-hidden style={{ width: 60, height: 60, borderRadius: '50%', background: MODE_META.HYBRID.soft, color: MODE_META.HYBRID.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, animation: 'hy-pulse 1.8s infinite' }}>
          <i className="bi bi-broadcast" />
        </span>
        <div style={{ fontWeight: 800, color: colors.textPrimary }}>Waiting for photographers to answer</div>
        <p style={{ margin: 0, maxWidth: 420, fontSize: '0.86rem', color: colors.textSecondary }}>
          {data?.pendingCount ?? 0} photographer{data?.pendingCount === 1 ? ' is' : 's are'} deciding now. Anyone who passes is replaced by the next best match. We&apos;ll notify you as soon as someone says yes.
        </p>
      </div>
    );
  } else {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Notice tone="warning" icon="bi-hourglass-bottom">
          {data?.status === 'MATCHING_FAILED'
            ? 'Nobody fit this event when it was posted.'
            : 'Matching ended without a photographer saying yes.'} You can post it again with a wider area or budget, or book one yourself.
        </Notice>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {data?.canRepost && onRepost && (
            <button type="button" className="hy-focus" onClick={() => { onClose(); onRepost(); }}
              style={{ padding: 14, borderRadius: 14, border: `2px solid ${MODE_META.HYBRID.color}`, background: MODE_META.HYBRID.soft, color: colors.textPrimary, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontWeight: 800 }}><i className="bi bi-broadcast" aria-hidden style={{ color: MODE_META.HYBRID.color }} /> Post again</div>
              <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>Change the area, budget or type and alert photographers again.</div>
            </button>
          )}
          {data?.canConvertToDirect && (
            <button type="button" className="hy-focus" onClick={switchToDirect} disabled={converting}
              style={{ padding: 14, borderRadius: 14, border: `2px solid ${MODE_META.DIRECT.color}`, background: MODE_META.DIRECT.soft, color: colors.textPrimary, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontWeight: 800 }}><i className="bi bi-search" aria-hidden style={{ color: MODE_META.DIRECT.color }} /> {converting ? 'Switching…' : 'Find a Photographer instead'}</div>
              <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>Browse photographers and send a request yourself.</div>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hy-cands-title"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bgOverlay, backdropFilter: 'blur(6px)', padding: 16 }}
      onClick={onClose}>
      <HybridStyles />
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 760, maxHeight: '94vh', display: 'flex', flexDirection: 'column', background: colors.bgModal, borderRadius: 22, overflow: 'hidden', border: `1px solid ${colors.borderPrimary}` }}>
        <header style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${colors.borderPrimary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: MODE_META.HYBRID.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <i className="bi bi-broadcast" aria-hidden /> Post My Event · Photographers who said yes
              </div>
              <h2 id="hy-cands-title" style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary }}>{title}</h2>
              {data && (
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                  {data.eventDate && <span><i className="bi bi-calendar-event" aria-hidden /> {data.eventDate}{data.startTime ? ` · ${hhmm(data.startTime)}–${hhmm(data.endTime)}` : ''}{data.durationLabel ? ` · ${data.durationLabel}` : ''}</span>}
                  {(data.venue || data.city) && <span><i className="bi bi-geo-alt" aria-hidden /> {data.city || data.venue}</span>}
                  {budgetLabel(data.minBudget, data.maxBudget) && <span><i className="bi bi-cash" aria-hidden /> {budgetLabel(data.minBudget, data.maxBudget)}</span>}
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="hy-focus"
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: colors.bgTertiary, color: colors.textSecondary, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>
              <i className="bi bi-x" aria-hidden />
            </button>
          </div>
          {data && !booked && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {[
                [candidates.length, 'said yes', colors.statusSuccess],
                [data.pendingCount, 'deciding', colors.statusInfo],
                [data.declinedCount, 'passed', colors.textTertiary],
                [data.expiredCount + data.noLongerAvailableCount, 'missed it', colors.textTertiary],
              ].map(([n, l, c]) => (
                <span key={l as string} style={{ padding: '4px 10px', borderRadius: 999, background: colors.bgTertiary, fontSize: '0.76rem', color: colors.textSecondary }}>
                  <strong style={{ color: c as string }}>{n as number}</strong> {l as string}
                </span>
              ))}
              {active && data.windowExpiresAt && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: MODE_META.HYBRID.soft, fontSize: '0.76rem', color: MODE_META.HYBRID.color, fontWeight: 700 }}>
                  <i className="bi bi-clock" aria-hidden /> Answers close in <CountdownText to={data.windowExpiresAt} doneText="a moment" />
                </span>
              )}
            </div>
          )}
        </header>

        <div style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
          {body}
        </div>

        {booked && (
          <footer style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${colors.borderPrimary}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="hy-focus" onClick={() => onPhotographerSelected(booked.candidate.photographerId, booked.result, booked.candidate)}
              style={{ padding: '0.7rem 1.4rem', borderRadius: 12, border: 'none', background: colors.brandPrimary, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
              Continue to payment <i className="bi bi-arrow-right" aria-hidden />
            </button>
          </footer>
        )}
      </div>

      {choosing && (
        <div role="dialog" aria-modal="true" aria-labelledby="hy-choose-title" onClick={(e) => { e.stopPropagation(); if (!submitting) setChoosing(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: colors.bgModal, borderRadius: 20, padding: 20, border: `1px solid ${colors.borderPrimary}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 id="hy-choose-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: colors.textPrimary }}>Book {choosing.photographerName}?</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textSecondary }}>
              We check they are still free for the whole event, then create your booking. How much do you want to pay now?
            </p>
            <div role="radiogroup" aria-label="First payment" style={{ display: 'grid', gridTemplateColumns: `repeat(${escrowOptions.length}, 1fr)`, gap: 8 }}>
              {escrowOptions.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={escrow === p} onClick={() => setEscrow(p)} className="hy-focus"
                  style={{ padding: '12px 6px', borderRadius: 12, border: `2px solid ${escrow === p ? colors.brandPrimary : colors.borderPrimary}`, background: escrow === p ? `${colors.brandPrimary}12` : colors.bgCard, cursor: 'pointer', color: colors.textPrimary }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{p}%</div>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary }}>{p === 100 ? 'Pay in full' : 'Now, rest later'}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.76rem', color: colors.textTertiary }}>
              <i className="bi bi-shield-check" aria-hidden style={{ color: colors.statusSuccess }} /> Held by Connekyt and released by milestones: event day, then delivery.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="hy-focus" disabled={submitting} onClick={() => setChoosing(null)}
                style={{ padding: '0.6rem 1rem', borderRadius: 10, border: `1.5px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textSecondary, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="button" className="hy-focus" disabled={submitting} onClick={confirmChoice}
                style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: 'none', background: MODE_META.HYBRID.color, color: '#fff', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer' }}>
                {submitting ? 'Booking…' : `Book and pay ${escrow}%`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
