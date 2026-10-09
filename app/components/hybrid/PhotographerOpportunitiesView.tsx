"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';
import {
  approveOpportunity,
  budgetLabel,
  getPhotographerOpportunities,
  hhmm,
  rejectOpportunity,
  syncServerClock,
  type OpportunityFilter,
  type PhotographerOpportunity,
} from '@/app/lib/hybridBooking';
import { CountdownText, EventStartClock, HybridStyles, MODE_META, Notice, useCountdown } from './hybridUi';

const TABS: { key: OpportunityFilter; label: string; icon: string; empty: string }[] = [
  { key: 'PENDING_RESPONSE', label: 'New', icon: 'bi-lightning-charge', empty: "No open opportunities right now. When a client posts an event that fits your profile and calendar, it appears here and you get a call-style alert." },
  { key: 'APPROVED', label: 'Waiting for client', icon: 'bi-hourglass-split', empty: 'Opportunities you said yes to wait here until the client chooses.' },
  { key: 'ALL', label: 'History', icon: 'bi-clock-history', empty: 'Your past opportunities and their outcomes will appear here.' },
];

const DECLINE_REASONS = ['Already booked', 'Too far', 'Budget too low', 'Not my specialty', 'Other'];

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  INVITED: { text: 'Waiting for your answer', tone: '#F20C8F' },
  APPROVED: { text: 'You said yes · client choosing', tone: '#3B82F6' },
  SELECTED: { text: 'You were selected', tone: '#10B981' },
  NOT_SELECTED: { text: 'Client chose someone else', tone: '#6A6D76' },
  REJECTED: { text: 'You declined', tone: '#6A6D76' },
  EXPIRED: { text: 'Time ran out', tone: '#6A6D76' },
  WITHDRAWN: { text: 'Closed by the client', tone: '#6A6D76' },
  NO_LONGER_AVAILABLE: { text: 'Released: your calendar overlaps', tone: '#6A6D76' },
};

const fmtDate = (d: string) => {
  const t = Date.parse(`${d}T00:00:00`);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : d;
};

/**
 * Opportunities from Post My Event. Everything shown comes from the server:
 * the duration, the distance, what was matched and the response deadline.
 * Internal scores never reach this screen.
 */
export default function PhotographerOpportunitiesView({ focusCandidateId }: { focusCandidateId?: string | null }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<OpportunityFilter>('PENDING_RESPONSE');
  const [items, setItems] = useState<PhotographerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [declining, setDeclining] = useState<PhotographerOpportunity | null>(null);
  const [reason, setReason] = useState<string>('');

  const load = useCallback(async (which: OpportunityFilter) => {
    try {
      const data = await getPhotographerOpportunities(which);
      setItems(which === 'ALL' ? data.filter((d) => d.status !== 'INVITED' && d.status !== 'APPROVED') : data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load opportunities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncServerClock();
  }, []);

  useEffect(() => {
    setLoading(true);
    load(tab);
    const id = setInterval(() => load(tab), tab === 'PENDING_RESPONSE' ? 10000 : 30000);
    return () => clearInterval(id);
  }, [tab, load]);

  useEffect(() => {
    if (!focusCandidateId || loading) return;
    const el = document.getElementById(`opp-${focusCandidateId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusCandidateId, loading, items]);

  const approve = async (o: PhotographerOpportunity) => {
    setBusyId(o.opportunityId);
    setNotice(null);
    try {
      await approveOpportunity(o.opportunityId);
      setNotice({ tone: 'success', text: `You said yes to ${o.eventTitle}. The client will be told, and we'll let you know if they choose you.` });
      load(tab);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not send your answer.' });
      load(tab);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDecline = async () => {
    if (!declining) return;
    const o = declining;
    setBusyId(o.opportunityId);
    try {
      await rejectOpportunity(o.opportunityId, reason || undefined);
      setNotice({ tone: 'info', text: `You passed on ${o.eventTitle}. It goes to the next photographer.` });
      setDeclining(null);
      setReason('');
      load(tab);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not send your answer.' });
      setDeclining(null);
      load(tab);
    } finally {
      setBusyId(null);
    }
  };

  const Card = ({ o }: { o: PhotographerOpportunity }) => {
    const open = o.status === 'INVITED';
    const left = useCountdown(o.responseDeadlineAt);
    const urgent = open && left && !left.done && left.ms < 5 * 60 * 1000;
    const st = STATUS_LABEL[o.status] || { text: o.status, tone: colors.textTertiary };
    const budget = budgetLabel(o.minBudget, o.maxBudget);
    const focused = focusCandidateId === o.opportunityId;
    return (
      <article id={`opp-${o.opportunityId}`}
        style={{
          borderRadius: 18, border: `${focused ? 2 : 1}px solid ${focused || open ? MODE_META.HYBRID.color : colors.borderPrimary}`,
          background: colors.bgCard, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
          boxShadow: open ? `0 12px 30px -22px ${MODE_META.HYBRID.color}` : 'none',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: st.tone }}>
            {open ? <><i className="bi bi-broadcast" aria-hidden /> New nearby opportunity</> : st.text}
          </span>
          {open && o.responseDeadlineAt && (
            <span aria-live="off" style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.76rem', fontWeight: 800, background: urgent ? colors.statusErrorBg : MODE_META.HYBRID.soft, color: urgent ? colors.statusError : MODE_META.HYBRID.color }}>
              <i className="bi bi-stopwatch" aria-hidden /> Respond in <CountdownText to={o.responseDeadlineAt} doneText="0m 00s" />
            </span>
          )}
        </div>

        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary }}>{o.eventTitle}</h3>
          {o.eventType && <span style={{ fontSize: '0.8rem', color: colors.textTertiary }}>{o.eventType}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.86rem', color: colors.textSecondary }}>
          <span><i className="bi bi-calendar-event" aria-hidden style={{ color: colors.brandPrimary }} /> {fmtDate(o.eventDate)}</span>
          <span><i className="bi bi-clock" aria-hidden style={{ color: colors.brandPrimary }} /> {hhmm(o.startTime)}{o.endTime ? `–${hhmm(o.endTime)}` : ''}{o.durationLabel ? <strong style={{ color: colors.textPrimary }}> · {o.durationLabel}</strong> : null}</span>
          <span><i className="bi bi-geo-alt" aria-hidden style={{ color: colors.brandPrimary }} /> {o.city || o.venue || 'Location shared on booking'}{o.distanceLabel ? ` · ${o.distanceLabel}` : ''}</span>
          {budget && <span><i className="bi bi-cash-coin" aria-hidden style={{ color: colors.brandPrimary }} /> {budget}</span>}
        </div>

        {o.matchReasons.length > 0 && (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Why you were matched</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {o.matchReasons.map((r) => (
                <li key={r} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: 999, background: colors.statusSuccessBg, color: colors.textPrimary }}>
                  <i className="bi bi-check2" aria-hidden style={{ color: colors.statusSuccess }} /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {o.instructions && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: colors.textSecondary, background: colors.bgTertiary, borderRadius: 12, padding: '8px 12px' }}>
            <i className="bi bi-chat-quote" aria-hidden /> {o.instructions}
          </p>
        )}

        {o.status === 'SELECTED' && o.eventStartAt && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <EventStartClock startAt={o.eventStartAt} />
            <Link href={`/user/photographer/events`} className="hy-focus" style={{ fontWeight: 700, color: colors.textLink }}>Open booking <i className="bi bi-arrow-right" aria-hidden /></Link>
          </div>
        )}

        {open && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="hy-focus" disabled={busyId === o.opportunityId || left?.done} onClick={() => approve(o)}
              style={{ flex: '1 1 180px', padding: '0.75rem 1rem', borderRadius: 12, border: 'none', background: colors.statusSuccess, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.92rem' }}>
              <i className="bi bi-check-lg" aria-hidden /> {busyId === o.opportunityId ? 'Sending…' : "Yes, I'm available"}
            </button>
            <button type="button" className="hy-focus" disabled={busyId === o.opportunityId || left?.done} onClick={() => { setReason(''); setDeclining(o); }}
              style={{ flex: '1 1 140px', padding: '0.75rem 1rem', borderRadius: 12, border: `1.5px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textSecondary, fontWeight: 700, cursor: 'pointer' }}>
              Not this time
            </button>
          </div>
        )}
      </article>
    );
  };

  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <HybridStyles />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 16, background: MODE_META.HYBRID.soft }}>
        <i className="bi bi-info-circle" aria-hidden style={{ color: MODE_META.HYBRID.color, marginTop: 2 }} />
        <div style={{ fontSize: '0.84rem', color: colors.textSecondary, lineHeight: 1.5 }}>
          <strong style={{ color: colors.textPrimary }}>Opportunities</strong> come from clients who used <strong>Post My Event</strong>: Connekyt matched you because you are free for the whole event and fit what they asked for. Say yes and the client sees you; they choose one photographer. These are different from <strong>booking requests</strong>, which a client sends to you directly and appear under Events.
        </div>
      </div>

      <div role="tablist" aria-label="Opportunities" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => setTab(t.key)} className="hy-focus"
            style={{ padding: '8px 14px', borderRadius: 999, border: `1.5px solid ${tab === t.key ? colors.brandPrimary : colors.borderPrimary}`, background: tab === t.key ? colors.brandPrimary : colors.bgCard, color: tab === t.key ? '#fff' : colors.textPrimary, fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
            <i className={`bi ${t.icon}`} aria-hidden /> {t.label}{tab === t.key && !loading ? ` (${items.length})` : ''}
          </button>
        ))}
      </div>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      {error && <Notice tone="error">{error} <button type="button" onClick={() => load(tab)} style={{ background: 'none', border: 'none', color: colors.textLink, fontWeight: 700, cursor: 'pointer' }}>Retry</button></Notice>}

      {loading && items.length === 0 ? (
        [0, 1].map((i) => <div key={i} style={{ height: 180, borderRadius: 18, background: colors.bgTertiary, animation: 'hy-pulse 1.2s infinite' }} />)
      ) : items.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', borderRadius: 18, border: `1px dashed ${colors.borderPrimary}`, color: colors.textTertiary }}>
          <i className={`bi ${current.icon}`} aria-hidden style={{ fontSize: 30, color: colors.borderSecondary }} />
          <p style={{ margin: '10px auto 0', maxWidth: 420, fontSize: '0.88rem' }}>{current.empty}</p>
          {tab === 'PENDING_RESPONSE' && (
            <Link href="/user/photographer/profile#matching" style={{ display: 'inline-block', marginTop: 12, fontWeight: 700, color: colors.textLink }}>
              Get matched more often: complete your matching profile <i className="bi bi-arrow-right" aria-hidden />
            </Link>
          )}
        </div>
      ) : (
        items.map((o) => <Card key={o.opportunityId} o={o} />)
      )}

      {declining && (
        <div role="dialog" aria-modal="true" aria-labelledby="hy-decline-title" onClick={() => setDeclining(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bgOverlay, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: colors.bgModal, borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, border: `1px solid ${colors.borderPrimary}` }}>
            <h3 id="hy-decline-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: colors.textPrimary }}>Pass on {declining.eventTitle}?</h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: colors.textSecondary }}>It goes to the next photographer. A reason is optional and helps us match you better.</p>
            <div role="radiogroup" aria-label="Reason" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DECLINE_REASONS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(reason === r ? '' : r)} className="hy-focus"
                  style={{ padding: '6px 12px', borderRadius: 999, border: `1.5px solid ${reason === r ? colors.brandPrimary : colors.borderPrimary}`, background: reason === r ? colors.brandPrimary : colors.bgCard, color: reason === r ? '#fff' : colors.textPrimary, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{r}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="hy-focus" onClick={() => setDeclining(null)}
                style={{ padding: '0.6rem 1rem', borderRadius: 10, border: `1.5px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textSecondary, fontWeight: 700, cursor: 'pointer' }}>Keep it</button>
              <button type="button" className="hy-focus" disabled={busyId === declining.opportunityId} onClick={confirmDecline}
                style={{ padding: '0.6rem 1.1rem', borderRadius: 10, border: 'none', background: colors.textSecondary, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {busyId === declining.opportunityId ? 'Sending…' : 'Pass'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
