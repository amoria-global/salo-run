'use client';

/**
 * Event detail in Compact Glass, for photographers, clients and coordinators (/user/<role>/events/[id]). Behaviour is
 * the classic page's (useEventDetail, moved verbatim); every dialog is the classic EventDetailModals, passed in.
 *
 * Layout like the profile page: a header card (banner, title, status, facts, tags, the role's actions), the booking
 * progress as steps, then two columns on wide screens (photographer and booking details; payments with escrow) and
 * an information card. Amounts carry their ISO code; dates are written out, never raw.
 */
import Link from 'next/link';
import { ArrowLeft, RadioTower as Broadcast, CalendarDays, Camera, Check, CircleCheck, Clock, CreditCard, EyeOff, Hourglass, MapPin, Package, Pause, Play, Plus, QrCode, Radio, Search, Share2, ShieldCheck, Trash2, Users, X, Pencil } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { platformAlert } from '@/app/components/PlatformAlert';
import { convertToHybrid } from '@/app/lib/hybridBooking';
import { isOpenHybrid } from '@/app/lib/hybridStatus';
import { formatEventDate, formatTime, getPaymentStatusLabel, getStatusLabel, type EventDetailController } from '@/app/components/events/detail/useEventDetail';
import { Money } from '../Money';
import { Avatar, Card, Chip, EmptyState, ErrorState, RowsSkeleton } from '../ui';

type Ctl = EventDetailController;
type Tone = 'success' | 'info' | 'pending' | 'neutral' | 'error' | 'accent';

const toneFor = (s: string): Tone => {
  const v = String(s || '').toUpperCase();
  if (['COMPLETED', 'ACCEPTED', 'PAID', 'PUBLISHED', 'CONFIRMED', 'RELEASED'].includes(v)) return 'success';
  if (['PENDING', 'PARTIAL', 'PAUSED', 'PENDING_CUSTOMER_CONFIRMATION', 'HELD'].includes(v)) return 'pending';
  if (['REJECTED', 'CANCELLED', 'FAILED', 'DECLINED', 'HYBRID_TIMEOUT', 'MATCHING_FAILED'].includes(v)) return 'error';
  if (['ONGOING', 'LIVE'].includes(v)) return 'accent';
  return 'info';
};

function Facts({ items }: { items: [string, React.ReactNode][] }) {
  const { t } = useLanguage();
  return (
    <dl className="ged-facts">
      {items.map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

function Actions({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const e = c.event!;
  const status = e.status.toUpperCase();
  const busy = (k: string) => c.actionLoading === k;
  if (c.userRole !== 'photographer') {
    return (
      <div className="gev-actions">
        <button type="button" className="g-btn g-btn-ghost" onClick={() => c.router.push(`/user/${c.userRole}/events`)}><Pencil size={15} aria-hidden /> {t('Edit')}</button>
        {status === 'PUBLISHED' ? (
          <>
            <button type="button" className="g-btn g-btn-ghost" onClick={() => { c.setQrJustPublished(false); c.setQrOpen(true); }}><QrCode size={15} aria-hidden /> {t('QR code')}</button>
            <button type="button" className="g-btn g-btn-ghost" disabled={busy('unpublish')} onClick={c.handleUnpublish}><EyeOff size={15} aria-hidden /> {busy('unpublish') ? t('Unpublishing…') : t('Unpublish')}</button>
          </>
        ) : status !== 'COMPLETED' ? (
          <button type="button" className="g-btn g-btn-primary" disabled={busy('publish')} onClick={c.handlePublish}><Radio size={15} aria-hidden /> {busy('publish') ? t('Publishing…') : t('Publish')}</button>
        ) : null}
        {c.isEventPausable() && <button type="button" className="g-btn g-btn-ghost" disabled={busy('pause')} onClick={() => c.setShowPauseConfirm(true)}><Pause size={15} aria-hidden /> {busy('pause') ? t('Pausing…') : t('Pause')}</button>}
        {c.isEventResumable() && <button type="button" className="g-btn g-btn-ghost" disabled={busy('resume')} onClick={c.handleResume}><Play size={15} aria-hidden /> {busy('resume') ? t('Resuming…') : t('Resume')}</button>}
        {c.isEventDeletable() && <button type="button" className="g-btn gp-btn-quiet-danger" onClick={() => c.setShowDeleteConfirm(true)}><Trash2 size={15} aria-hidden /> {t('Delete')}</button>}
        {e.completionStatus?.toUpperCase() === 'PENDING_CUSTOMER_CONFIRMATION' && <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowCompletionModal(true)}><Check size={15} aria-hidden /> {t('Confirm completion')}</button>}
      </div>
    );
  }
  return (
    <div className="gev-actions">
      {e.bookingStatus?.toUpperCase() === 'PENDING' && (
        <>
          <button type="button" className="g-btn g-btn-primary" disabled={busy('accept')} onClick={() => c.setShowAcceptModal(true)}><Check size={15} aria-hidden /> {busy('accept') ? t('Accepting…') : t('Accept')}</button>
          <button type="button" className="g-btn g-btn-ghost" onClick={() => c.setShowDeclineModal(true)}><X size={15} aria-hidden /> {t('Decline')}</button>
        </>
      )}
      {e.bookingStatus?.toUpperCase() === 'ACCEPTED' && (
        <>
          <button type="button" className="g-btn g-btn-primary" onClick={() => c.goToEventAction('createAlbum')}><Plus size={15} aria-hidden /> {t('Create album')}</button>
          {e.hasLiveStream && <button type="button" className="g-btn g-btn-ghost" onClick={() => c.goToEventAction('stream')}><Broadcast size={15} aria-hidden /> {t('Live stream')}</button>}
          {e.isPublished && <button type="button" className="g-btn g-btn-ghost" onClick={c.handleShareEvent}><Share2 size={15} aria-hidden /> {t('Share')}</button>}
          {status === 'PUBLISHED' && <button type="button" className="g-btn g-btn-ghost" onClick={() => { c.setQrJustPublished(false); c.setQrOpen(true); }}><QrCode size={15} aria-hidden /> {t('QR code')}</button>}
          {e.completionStatus?.toUpperCase() !== 'COMPLETED' && <button type="button" className="g-btn g-btn-ghost" disabled={busy('markComplete')} onClick={c.handleMarkComplete}><CircleCheck size={15} aria-hidden /> {busy('markComplete') ? t('Marking…') : t('Mark complete')}</button>}
        </>
      )}
    </div>
  );
}

function PhotographerCard({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const e = c.event!;
  const base = c.userRole === 'event-coordinator' ? '/user/event-coordinator' : '/user/client';
  const find = `${base}/photographers?lat=${e.latitude ?? -1.9536}&lng=${e.longitude ?? 30.0606}&eventDate=${encodeURIComponent(e.eventDate || e.date || '')}`;
  const st = String(e.eventStatus || e.status);
  const retry = async () => {
    c.setActionLoading('retry-hybrid');
    try {
      const posted = await convertToHybrid(c.eventId);
      if (posted.invitedCount) platformAlert(`Posted again. ${posted.invitedCount} photographer${posted.invitedCount === 1 ? ' was' : 's were'} alerted.`, { tone: 'success' });
      else platformAlert('Posted again, but nobody fits right now. Find a Photographer to book one yourself.', { tone: 'warning' });
      c.fetchEvent();
    } catch (err: unknown) {
      platformAlert((err as Error)?.message || 'Could not retry matching', { tone: 'danger' });
    } finally {
      c.setActionLoading(null);
    }
  };
  let body: React.ReactNode;
  if (e.photographerName) {
    body = (
      <div className="gc-detail-head">
        <Avatar name={e.photographerName} src={e.photographerImage} size={48} />
        <span className="gc-two"><strong>{e.photographerName}</strong>{e.bookingStatus ? <span><Chip tone={toneFor(e.bookingStatus)}>{t(getStatusLabel(e.bookingStatus))}</Chip></span> : null}</span>
      </div>
    );
  } else if (['HYBRID_TIMEOUT', 'MATCHING_FAILED'].includes(st)) {
    body = (
      <div className="ged-notice">
        <Chip tone="error">{t('Matching ended: no photographer said yes')}</Chip>
        <p>{t('Post My Event did not find a photographer this time. Post it again with the same requirements, or use Find a Photographer and choose one yourself.')}</p>
        <div className="gev-actions">
          <Link href={find} className="g-btn g-btn-primary"><Search size={15} aria-hidden /> {t('Find a photographer')}</Link>
          <button type="button" className="g-btn g-btn-ghost" disabled={c.actionLoading === 'retry-hybrid'} onClick={retry}><Broadcast size={15} aria-hidden /> {c.actionLoading === 'retry-hybrid' ? t('Reactivating…') : t('Post again')}</button>
        </div>
      </div>
    );
  } else if (st === 'MATCHES_AWAITING_SELECTION') {
    body = (
      <div className="ged-notice">
        <Chip tone="accent">{t('Candidates ready')}</Chip>
        <strong>{t('Matching complete. Choose your photographer')}</strong>
        <p>{t('Verified local creators accepted your event brief. Compare their match tiers, reviews, ratings and proposed rates, then confirm your photographer to lock your date.')}</p>
        <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowCandidatesModal(true)}><Users size={15} aria-hidden /> {t('Review candidates and confirm')}</button>
      </div>
    );
  } else if (isOpenHybrid(e.bookingMode, e.eventStatus || e.status, e.photographerId)) {
    body = (
      <div className="ged-notice">
        <Chip tone="info">{t('Photographer matching active')}</Chip>
        <p>{t('Local photographers are reviewing your brief.')}</p>
        <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowCandidatesModal(true)}><Users size={15} aria-hidden /> {t('View candidates and select')}</button>
      </div>
    );
  } else {
    body = (
      <div className="ged-notice">
        <p>{t('No photographer assigned yet')}</p>
        <Link href={find} className="g-btn g-btn-primary"><Search size={15} aria-hidden /> {t('Find a photographer')}</Link>
      </div>
    );
  }
  return (
    <Card className="ged-card">
      <h2 className="gc-h"><Camera size={15} aria-hidden /> {t('Photographer')}</h2>
      {body}
    </Card>
  );
}

function BookingCard({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const e = c.event!;
  const items: [string, React.ReactNode][] = [];
  if (e.packageName) {
    items.push(['Package', e.packageName]);
    if (e.packagePrice != null) items.push(['Price', <Money key="p" amount={e.packagePrice} from={e.packageCurrencyAbbreviation || undefined} />]);
    if (e.packageDurationHours) items.push(['Duration', `${e.packageDurationHours} ${t(e.packageDurationHours === 1 ? 'hour' : 'hours')}`]);
    if (e.packageIncludedPhotos) items.push(['Included photos', e.packageIncludedPhotos]);
    if (e.packageIncludedVideos) items.push(['Included videos', e.packageIncludedVideos]);
    if (e.packageDescription) items.push(['Description', e.packageDescription]);
  }
  if (e.eventType) items.push(['Event type', t(e.eventType)]);
  if (e.category) items.push(['Category', t(e.category)]);
  return (
    <Card className="ged-card">
      <h2 className="gc-h"><Package size={15} aria-hidden /> {t('Booking details')}</h2>
      {!e.packageName ? <p className="gpf-help">{t('No package booked')}</p> : null}
      {items.length ? <Facts items={items} /> : null}
      {e.completionStatus ? (
        <div className="ged-completion">
          <Chip tone={toneFor(e.completionStatus)}>{t(getStatusLabel(e.completionStatus))}</Chip>
          {e.completionStatus.toUpperCase() === 'COMPLETED' ? <span className="gpf-help">{t('The event was completed.')}</span> : null}
          {e.completionStatus.toUpperCase() === 'PENDING' ? <span className="gpf-help">{t('Awaiting confirmation')}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}

function Payments({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const e = c.event!;
  if (!c.payments.length) {
    return e.packageName ? <Card className="ged-card"><h2 className="gc-h"><CreditCard size={15} aria-hidden /> {t('Payments')}</h2><p className="gpf-help">{t('No payment records for this event yet.')}</p></Card> : null;
  }
  return (
    <Card className="ged-card">
      <div className="gpf-section-head">
        <h2 className="gc-h"><ShieldCheck size={15} aria-hidden /> {t('Payments and milestones')}</h2>
        {c.hasPendingPayments && <button type="button" className="g-btn g-btn-primary" onClick={() => { const p = c.payments.find((x) => x.status === 'PENDING' || x.status === 'PARTIAL'); if (p) c.handlePayNowClick(p); }}><CreditCard size={15} aria-hidden /> {t('Pay now')}</button>}
      </div>
      <dl className="gc-strip">
        <div><dt>{t('Total')}</dt><dd><Money amount={c.totalAmount} /></dd></div>
        <div><dt>{t('Paid')}</dt><dd><Money amount={c.totalPaid} /></dd></div>
        <div><dt>{t('Remaining')}</dt><dd><Money amount={Math.max(0, c.totalRemaining)} /></dd></div>
      </dl>
      <ul className="ged-payments">
        {c.payments.map((p, i) => {
          const pending = p.status === 'PENDING' || p.status === 'PARTIAL';
          const held = p.escrowStatus === 'HELD';
          const released = p.escrowStatus === 'RELEASED';
          const remaining = p.amountInUsd - p.paidAmountInUsd;
          const heldFor = p.heldAmountInUsd;
          const withdrawable = heldFor > 0 ? p.amountInUsd - heldFor : 0;
          const pct = p.amountInUsd > 0 ? Math.min((p.paidAmountInUsd / p.amountInUsd) * 100, 100) : 0;
          return (
            <li key={p.id || i} className="ged-payment">
              <div className="ged-payment-head">
                <span className="gc-two"><strong>{t(p.paymentType || 'Booking payment')}</strong></span>
                <Chip tone={toneFor(p.status)}>{t(getPaymentStatusLabel(p.status))}</Chip>
                <strong className="g-num"><Money amount={p.amountInUsd} /></strong>
              </div>
              {p.escrowPercentage ? (
                <p className="ged-escrow"><ShieldCheck size={14} aria-hidden /> {t('Escrow protection')} ({p.escrowPercentage}%){held ? <> · <Chip tone="pending">{t('Held')}</Chip></> : released ? <> · <Chip tone="success">{t('Released')}</Chip></> : null}</p>
              ) : null}
              {(withdrawable > 0 || heldFor > 0) ? (
                <dl className="gc-strip">
                  <div><dt>{t('Withdrawable')} ({100 - (p.escrowPercentage || 0)}%)</dt><dd><Money amount={withdrawable} /></dd></div>
                  <div><dt>{t('Held for delivery')} ({p.escrowPercentage}%)</dt><dd><Money amount={heldFor} /></dd></div>
                </dl>
              ) : null}
              {p.amountInUsd > 0 ? (
                <div className="ged-progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={t('Paid')}>
                  <div className="ged-progress-text"><span>{t('Paid')} <Money amount={p.paidAmountInUsd} /></span><span>{remaining > 0 ? <>{t('Remaining')} <Money amount={remaining} /></> : t('Fully paid')}</span></div>
                  <span className="ged-bar"><i style={{ width: `${pct}%` }} /></span>
                </div>
              ) : null}
              {held && p.eventCompletionStatus !== 'COMPLETED' ? <p className="gpf-help"><Hourglass size={13} aria-hidden /> {t('Escrow funds are released after the event is completed.')}</p> : null}
              {held && p.eventCompletionStatus === 'COMPLETED' ? <p className="gpf-help"><CircleCheck size={13} aria-hidden /> {t('Event completed: funds can now be released.')}</p> : null}
              {pending && !held ? <div className="gpf-actions-end"><button type="button" className="g-btn g-btn-primary" onClick={() => c.handlePayNowClick(p)}><CreditCard size={15} aria-hidden /> {t('Pay now')}</button></div> : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function GlassEventDetail({ ctl: c, modals }: { ctl: Ctl; modals: React.ReactNode }) {
  const { t, language } = useLanguage();
  const e = c.event;
  const place = e ? [e.venueName, e.address, e.city, e.country].filter(Boolean).join(', ') : '';
  return (
    <div className={`gp-page ged-page${c.shouldHighlight ? ' notif-highlight-pop' : ''}`}>
      <button type="button" className="g-btn g-btn-ghost ged-back" onClick={() => c.router.back()}><ArrowLeft size={16} aria-hidden /> {t('Back to events')}</button>
      {c.loading ? <RowsSkeleton rows={3} height={140} /> : c.error ? (
        <ErrorState message={c.error} onRetry={() => c.fetchEvent()} />
      ) : !e ? (
        <EmptyState title="Event not found" body="It may have been removed." />
      ) : (
        <>
          <Card className="ged-hero">
            {e.bannerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ged-banner" src={e.bannerImage} alt="" onError={(x) => { (x.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : null}
            <div className="ged-hero-body">
              <div className="ged-title-row">
                <h1 className="g-display gp-title">{e.title}</h1>
                <Chip tone={toneFor(e.status)}>{t(getStatusLabel(e.status))}</Chip>
              </div>
              {e.description ? <p className="gp-sub">{e.description}</p> : null}
              <ul className="gme-facts ged-meta">
                {e.date ? <li><CalendarDays size={14} aria-hidden /> {formatEventDate(e.date)}</li> : null}
                {e.time ? <li><Clock size={14} aria-hidden /> {formatTime(e.time)}{e.endTime ? ` – ${formatTime(e.endTime)}` : ''}</li> : null}
                <li className="g-ellipsis"><MapPin size={14} aria-hidden /> {place || t('No location specified')}</li>
                {e.maxGuests > 0 ? <li><Users size={14} aria-hidden /> {e.maxGuests} {t(e.maxGuests === 1 ? 'guest' : 'guests')}</li> : null}
              </ul>
              {e.tags?.length ? <div className="gpf-chips">{e.tags.map((tag, i) => <Chip key={i} tone="info">{tag}</Chip>)}</div> : null}
              <Actions c={c} />
            </div>
          </Card>

          {e.bookingProgress?.length ? (
            <Card className="ged-card">
              <h2 className="gc-h">{t('Booking progress')}</h2>
              <ol className="ged-steps">
                {e.bookingProgress.map((s, i) => (
                  <li key={s.key} className={s.done ? 'is-done' : ''}><span className="ged-step-dot" aria-hidden>{s.done ? <Check size={14} /> : i + 1}</span><span>{t(s.label)}</span>{s.done ? <span className="sr-only"> {t('done')}</span> : null}</li>
                ))}
              </ol>
            </Card>
          ) : null}

          <div className="ged-grid">
            <div className="ged-col">
              <PhotographerCard c={c} />
              <BookingCard c={c} />
            </div>
            <div className="ged-col">
              <Payments c={c} />
              <Card className="ged-card">
                <h2 className="gc-h">{t('Event information')}</h2>
                <Facts items={[
                  ...(e.organizer ? [['Organizer', e.organizer] as [string, React.ReactNode]] : []),
                  ...(e.eventVisibility ? [['Visibility', t(e.eventVisibility.charAt(0) + e.eventVisibility.slice(1).toLowerCase())] as [string, React.ReactNode]] : []),
                  ...(e.duration ? [['Duration', e.duration] as [string, React.ReactNode]] : []),
                  ...(e.createdAt ? [['Created', new Date(e.createdAt).toLocaleDateString(language === 'en' ? 'en-GB' : language, { day: 'numeric', month: 'short', year: 'numeric' })] as [string, React.ReactNode]] : []),
                ]} />
              </Card>
            </div>
          </div>
        </>
      )}
      {modals}
    </div>
  );
}
