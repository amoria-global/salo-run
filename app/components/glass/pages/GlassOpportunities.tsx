'use client';

/**
 * Opportunities in Compact Glass. Same behaviour as the classic page (useOpportunities is shared): New / Waiting for client
 * / History, 10 s polling on New, the notification deep link, "Yes, I'm available", and "Not this time" with an optional
 * reason. Only the presentation is new.
 */
import Link from 'next/link';
import { ArrowRight, Banknote, CalendarDays, Check, Clock, MapPin, Radio, Timer } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { budgetLabel, hhmm, type OpportunityFilter, type PhotographerOpportunity } from '@/app/lib/hybridBooking';
import { CountdownText, EventStartClock, Notice, useCountdown } from '../../hybrid/hybridUi';
import { STATUS_LABEL, TABS, fmtDate } from '../../hybrid/PhotographerOpportunitiesView';
import { DECLINE_REASONS, useOpportunities } from '../../hybrid/useOpportunities';
import { Card, Chip, EmptyState, ErrorState, GlassModal, PageHeader, RowsSkeleton, Segmented, type Tone } from '../ui';

const INFO = 'Opportunities come from clients who used Post My Event: Connekyt matched you because you are free for the whole event and fit what they asked for. Say yes and the client sees you; they choose one photographer. These are different from booking requests, which a client sends to you directly and appear under Events.';
const STATUS_TONE: Record<string, Tone> = { INVITED: 'accent', APPROVED: 'info', SELECTED: 'success' };

function OpportunityCard({ o, focused, busy, onYes, onNo }: { o: PhotographerOpportunity; focused: boolean; busy: boolean; onYes: () => void; onNo: () => void }) {
  const { t } = useLanguage();
  const open = o.status === 'INVITED';
  const left = useCountdown(o.responseDeadlineAt);
  const urgent = !!(open && left && !left.done && left.ms < 5 * 60 * 1000);
  const st = STATUS_LABEL[o.status] || { text: o.status, tone: '' };
  const budget = budgetLabel(o.minBudget, o.maxBudget);
  return (
    <Card id={`opp-${o.opportunityId}`} className={`gp-opp${open ? ' is-open' : ''}${focused ? ' is-focused' : ''}`} aria-label={o.eventTitle}>
      <div className="gp-opp-top">
        {open
          ? <Chip tone="accent"><Radio size={12} aria-hidden /> {t('New nearby opportunity')}</Chip>
          : <Chip tone={STATUS_TONE[o.status] ?? 'neutral'}>{t(st.text)}</Chip>}
        {open && o.responseDeadlineAt && (
          <Chip tone={urgent ? 'error' : 'accent'}><Timer size={12} aria-hidden /> {t('Respond in')} <CountdownText to={o.responseDeadlineAt} doneText="0m 00s" /></Chip>
        )}
      </div>

      <div>
        <h3 className="g-display gp-opp-title">{o.eventTitle}</h3>
        {o.eventType && <span className="gp-sub">{o.eventType}</span>}
      </div>

      <div className="gp-opp-meta">
        <span><CalendarDays size={15} aria-hidden /> {fmtDate(o.eventDate)}</span>
        <span><Clock size={15} aria-hidden /> {hhmm(o.startTime)}{o.endTime ? `–${hhmm(o.endTime)}` : ''}{o.durationLabel ? <strong> · {o.durationLabel}</strong> : null}</span>
        <span><MapPin size={15} aria-hidden /> {o.city || o.venue || t('Location shared on booking')}{o.distanceLabel ? ` · ${o.distanceLabel}` : ''}</span>
        {budget && <span><Banknote size={15} aria-hidden /> {budget}</span>}
      </div>

      {o.matchReasons.length > 0 && (
        <div>
          <div className="gp-label">{t('Why you were matched')}</div>
          <ul className="gp-chips">
            {o.matchReasons.map((r) => <li key={r}><Chip tone="success"><Check size={12} aria-hidden /> {r}</Chip></li>)}
          </ul>
        </div>
      )}

      {o.instructions && <p className="gp-note">{o.instructions}</p>}

      {o.status === 'SELECTED' && o.eventStartAt && (
        <div className="gp-opp-selected">
          <EventStartClock startAt={o.eventStartAt} />
          <Link href="/user/photographer/events" className="gp-link">{t('Open booking')} <ArrowRight size={14} aria-hidden /></Link>
        </div>
      )}

      {open && (
        <div className="gp-actions">
          <button type="button" className="g-btn g-btn-primary" disabled={busy || !!left?.done} onClick={onYes}>
            <Check size={16} aria-hidden /> {busy ? t('Sending…') : t("Yes, I'm available")}
          </button>
          <button type="button" className="g-btn g-btn-ghost" disabled={busy || !!left?.done} onClick={onNo}>{t('Not this time')}</button>
        </div>
      )}
    </Card>
  );
}

export default function GlassOpportunities({ focusCandidateId }: { focusCandidateId?: string | null }) {
  const { t } = useLanguage();
  const s = useOpportunities(focusCandidateId);
  const current = TABS.find((x) => x.key === s.tab)!;
  return (
    <div className="gp-page gp-page-narrow">
      <PageHeader eyebrow="Post My Event" title="Opportunities"
        subtitle="Events near you that fit your calendar. Answer quickly: each one has a short response window." />

      <Card className="gp-info">
        <p className="gp-sub" style={{ margin: 0 }}>{t(INFO)}</p>
      </Card>

      <Segmented<OpportunityFilter> label="Opportunities" value={s.tab} onChange={s.setTab}
        options={TABS.map((x) => ({ key: x.key, label: x.label, count: s.tab === x.key && !s.loading ? s.items.length : null }))} />

      {s.notice && <Notice tone={s.notice.tone}>{s.notice.text}</Notice>}

      {s.error ? (
        <ErrorState message={s.error} onRetry={() => s.load(s.tab)} />
      ) : s.loading && s.items.length === 0 ? (
        <RowsSkeleton rows={2} height={180} />
      ) : s.items.length === 0 ? (
        <EmptyState title={current.label} body={current.empty}
          action={s.tab === 'PENDING_RESPONSE' ? <Link href="/user/photographer/profile#matching" className="gp-link">{t('Get matched more often: complete your matching profile')} <ArrowRight size={14} aria-hidden /></Link> : undefined} />
      ) : (
        <div className="gp-stack">
          {s.items.map((o) => (
            <OpportunityCard key={o.opportunityId} o={o} focused={focusCandidateId === o.opportunityId} busy={s.busyId === o.opportunityId}
              onYes={() => s.approve(o)} onNo={() => s.startDecline(o)} />
          ))}
        </div>
      )}

      {s.declining && (
        <GlassModal title={`${t('Pass on')} ${s.declining.eventTitle}?`} onClose={() => s.setDeclining(null)}
          footer={
            <>
              <button type="button" className="g-btn g-btn-ghost" onClick={() => s.setDeclining(null)}>{t('Keep it')}</button>
              <button type="button" className="g-btn g-btn-primary" disabled={s.busyId === s.declining.opportunityId} onClick={s.confirmDecline}>
                {s.busyId === s.declining.opportunityId ? t('Sending…') : t('Pass')}
              </button>
            </>
          }>
          <p className="gp-sub" style={{ margin: 0 }}>{t('It goes to the next photographer. A reason is optional and helps us match you better.')}</p>
          <div role="radiogroup" aria-label={t('Reason')} className="gp-chips">
            {DECLINE_REASONS.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={s.reason === r} className={`gp-pill${s.reason === r ? ' is-on' : ''}`}
                onClick={() => s.setReason(s.reason === r ? '' : r)}>{t(r)}</button>
            ))}
          </div>
        </GlassModal>
      )}
    </div>
  );
}
