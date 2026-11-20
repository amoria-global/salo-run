'use client';

/**
 * Client and coordinator "My events" in Compact Glass. Behaviour is the classic pages' (useClientEvents and
 * useCoordinatorEvents, moved verbatim); every dialog is the classic page's own Modals component, passed in.
 *
 * Header like Home with Create event as the primary action, four summary cards, search, a segmented switch with
 * counts, then glass event cards: cover, status chip, type, title, the booking mode, a facts strip (date, time,
 * place, guests, photographer) and the actions the classic card offered, in the same conditions. Publish keeps its
 * checks (photo, photographer, pending booking); Unpublish of a live event goes straight to the explanation.
 */
import { CalendarDays, Camera, CircleHelp, Clock, Globe, MapPin, Pause, Pencil, Play, Plus, QrCode, Radio, RotateCw, Search, Share2, Trash2, Users, Check, EyeOff, Hourglass } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { canOwnerGoLive } from '@/lib/events/ownerGoLive';
import { ModeBadge, friendlyEventStatus, isOpenHybrid, modeOf } from '@/app/components/hybrid/hybridUi';
import { Card, Chip, EmptyState, ErrorState, OverflowMenu, PageHeader, RowsSkeleton, Segmented } from '../ui';

type Role = 'client' | 'event-coordinator';
type Tab = 'all' | 'upcoming' | 'published' | 'past';
/* eslint-disable @typescript-eslint/no-explicit-any */
type Ev = any;
type Ctl = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const toneOf = (status: string): 'success' | 'info' | 'pending' | 'neutral' | 'error' | 'accent' => {
  const s = String(status).toUpperCase();
  if (s === 'ONGOING' || s === 'LIVE') return 'error';
  if (s === 'PUBLISHED') return 'success';
  if (s === 'COMPLETED') return 'neutral';
  if (s === 'PAUSED' || s === 'CANCELLED') return 'pending';
  if (s.includes('MATCH') || s.includes('CANDIDATE') || s === 'OPEN_FOR_INTEREST') return 'accent';
  return 'info';
};

function EventCard({ c, e, role }: { c: Ctl; e: Ev; role: Role }) {
  const { t } = useLanguage();
  const status = String(e.status).toUpperCase();
  const published = e.isPublished || status === 'PUBLISHED' || status === 'ONGOING';
  const place = [e.location?.city, e.location?.country].filter(Boolean).join(', ');
  const hybridOpen = isOpenHybrid(e.bookingMode, e.status as string, e.photographerId);
  const candLabel = ['MATCHES_AWAITING_SELECTION', 'CANDIDATES_AVAILABLE'].includes(e.status) ? 'Choose photographer'
    : ['HYBRID_TIMEOUT', 'MATCHING_FAILED'].includes(e.status) ? 'Matching ended' : 'Answers';
  const rejected = e.bookingStatus?.toUpperCase() === 'REJECTED';
  const directNoPhotographer = !e.photographerId && modeOf(e.bookingMode) === 'DIRECT' && !['COMPLETED', 'CANCELLED'].includes(status)
    && (role === 'event-coordinator' || !rejected);
  const editable = role === 'event-coordinator' ? c.isEventEditable(e) : true;

  const unpublish = () => {
    if (status === 'ONGOING') c.setOngoingUnpublishBlock({ title: e.title, photographerName: e.photographerName || null });
    else c.setUnpublishConfirmEvent(e);
  };
  const publish = () => {
    if (role === 'client') return c.handlePublishClick(e);
    if (!e.coverImage) return c.setNoPhotoEvent(e);
    if (!e.hasPhotographer) return c.setNoPhotographerEvent(e);
    if (e.bookingStatus && e.bookingStatus.toUpperCase() !== 'ACCEPTED' && e.bookingStatus.toUpperCase() !== 'UNASSIGNED') return c.setPendingBookingEvent(e);
    return c.setPublishConfirmEvent(e);
  };

  const menu = [
    ...(e.isPublished ? [{ key: 'share', label: <><Share2 size={15} aria-hidden /> {t('Share')}</>, onSelect: () => { c.setShareEvent(e); c.setShowShareModal(true); } }] : []),
    ...(editable && role === 'event-coordinator' ? [{ key: 'geo', label: <><Globe size={15} aria-hidden /> {t('Geo pricing')}</>, onSelect: () => c.setGeoEvent(e) }] : []),
    ...(editable ? [{ key: 'edit', label: <><Pencil size={15} aria-hidden /> {t('Edit')}</>, onSelect: () => c.openEditModal(e) }] : []),
    ...(c.isEventPausable(e) ? [{ key: 'pause', disabled: c.pausingEventId === e.id, label: <><Pause size={15} aria-hidden /> {t('Pause')}</>, onSelect: () => { c.setPauseEvent(e); c.setShowPauseModal(true); } }] : []),
    ...(c.isEventResumable(e) ? [{ key: 'resume', disabled: c.resumingEventId === e.id, label: <><Play size={15} aria-hidden /> {t('Resume')}</>, onSelect: () => c.handleResumeEvent(e.id) }] : []),
    ...(c.isEventDeletable(e) ? [{ key: 'delete', danger: true, label: <><Trash2 size={15} aria-hidden /> {t('Delete')}</>, onSelect: () => { c.setDeleteEvent(e); c.setShowDeleteModal(true); } }] : []),
  ];

  return (
    <Card className="gev-album gme-card">
      <button type="button" className="gev-cover" onClick={() => c.setShowEventDetails(e)} aria-label={`${t('Event details')}: ${e.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.coverImage || '/coverr.jpg'} alt="" loading="lazy" onError={(x) => { (x.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
        <span className="gev-cover-chips">
          <Chip tone={toneOf(e.status)}>{t(friendlyEventStatus(e.status as string))}</Chip>
          {e.eventType ? <Chip tone="neutral">{t(e.eventType)}</Chip> : null}
        </span>
      </button>
      <div className="gev-album-body">
        <span className="gc-two">
          <strong className="g-ellipsis">{e.title}</strong>
          <small className="g-ellipsis gme-mode">{(modeOf(e.bookingMode) === 'HYBRID' || e.photographerId) ? <ModeBadge mode={modeOf(e.bookingMode)} /> : null}{e.category ? <span>{t(e.category)}</span> : null}</small>
        </span>
        <ul className="gme-facts">
          <li><CalendarDays size={14} aria-hidden /> {c.formatDate(e.date)}</li>
          {e.time ? <li><Clock size={14} aria-hidden /> {e.time}</li> : null}
          {place ? <li className="g-ellipsis"><MapPin size={14} aria-hidden /> {place}</li> : null}
          <li><Users size={14} aria-hidden /> {e.guestCount}/{e.maxGuests}</li>
          {e.hasPhotographer ? <li className="g-ellipsis"><Camera size={14} aria-hidden /> {e.photographerName}</li> : null}
        </ul>
        <div className="gev-actions">
          {canOwnerGoLive(e) && <button type="button" className="g-btn g-btn-primary gev-act" onClick={() => c.setGoLiveEvent(e)} aria-label={`${t('Go live')}: ${e.title}`}><Radio size={15} aria-hidden /> {t('Go live')}</button>}
          {rejected && <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.setRebookEvent(e)}><RotateCw size={15} aria-hidden /> {t('Rebook')}</button>}
          {rejected && role === 'client' && (
            <button type="button" className="g-btn g-btn-ghost gev-act" disabled={c.convertingHybridId === e.id} onClick={() => c.openPostWizard(e)}><Radio size={15} aria-hidden /> {c.convertingHybridId === e.id ? t('Please wait…') : t('Match nearby')}</button>
          )}
          {directNoPhotographer && <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.openPostWizard(e)} title={t('No photographer yet. Post My Event: matching photographers say yes, you pick one.')}><Radio size={15} aria-hidden /> {t('Post')}</button>}
          {hybridOpen && <button type="button" className={`g-btn ${e.status === 'MATCHES_AWAITING_SELECTION' ? 'g-btn-primary' : 'g-btn-ghost'} gev-act`} onClick={() => c.setCandidateModalEvent(e)}><Users size={15} aria-hidden /> {t(candLabel)}</button>}
          {status !== 'COMPLETED' && (published ? (
            <>
              {(e.isPublished || status === 'PUBLISHED') && <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.setQrEvent({ id: e.id, title: e.title, justPublished: false })}><QrCode size={15} aria-hidden /> {t('QR code')}</button>}
              <button type="button" className="g-btn g-btn-ghost gev-act" disabled={c.unpublishingEventId === e.id} onClick={unpublish}><EyeOff size={15} aria-hidden /> {c.unpublishingEventId === e.id ? t('Unpublishing…') : t('Unpublish')}</button>
            </>
          ) : (
            <button type="button" className="g-btn g-btn-primary gev-act" disabled={c.publishingEventId === e.id} onClick={publish}><Radio size={15} aria-hidden /> {c.publishingEventId === e.id ? t('Publishing…') : t('Publish')}</button>
          ))}
          {e.completionStatus === 'PENDING_CUSTOMER_CONFIRMATION' && e.albumDelivered && (
            <button type="button" className="g-btn g-btn-primary gev-act" onClick={() => { c.setCompletionModalEvent(e); c.setCompletionFeedbackStatus('COMPLETED'); c.setCompletionComment(''); }}><Check size={15} aria-hidden /> {t('Confirm completion')}</button>
          )}
          {e.completionStatus === 'PENDING_CUSTOMER_CONFIRMATION' && !e.albumDelivered && <Chip tone="pending"><Hourglass size={12} aria-hidden /> {t('Waiting for album delivery')}</Chip>}
          {menu.length ? <OverflowMenu label={`${t('More options for')} ${e.title}`} items={menu} /> : null}
        </div>
      </div>
    </Card>
  );
}

export default function GlassMyEvents({ ctl: c, modals, role }: { ctl: Ctl; modals: React.ReactNode; role: Role }) {
  const { t } = useLanguage();
  const tab = c.activeTab as Tab;
  return (
    <div className="gp-page gev-page">
      <PageHeader eyebrow="Events" title="My events" subtitle="Create, publish and follow your events." action={
        <span className="gc-head-actions">
          <button type="button" className="g-icon-btn gev-help" onClick={c.getStarted.show} aria-label={t('Show getting started')} title={t('Show getting started')}><CircleHelp size={18} aria-hidden /></button>
          <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowBookingModeSelector(true)}><Plus size={16} aria-hidden /> {t('Create event')}</button>
        </span>
      } />
      <div className="gc-sums">
        {[['Events', c.events.length], ['Upcoming', c.upcomingCount], ['Published', c.publishedCount], ['Completed', c.completedCount]].map(([l, v]) => (
          <Card key={String(l)} className="gc-sum"><span className="gc-sum-label">{t(String(l))}</span><strong className="g-num gc-sum-value">{v}</strong></Card>
        ))}
      </div>
      <div className="gp-toolbar gc-toolbar">
        <Segmented<Tab> label="Filter events" value={tab} onChange={c.setActiveTab} options={[
          { key: 'all', label: 'All', count: c.events.length }, { key: 'upcoming', label: 'Upcoming', count: c.upcomingCount },
          { key: 'published', label: 'Published', count: c.publishedCount }, { key: 'past', label: 'Past', count: c.pastCount },
        ]} />
        <div className="gc-tools">
          <label className="gc-search"><Search size={15} aria-hidden /><span className="sr-only">{t('Search events')}</span>
            <input type="search" value={c.searchQuery} onChange={(x) => c.setSearchQuery(x.target.value)} placeholder={t('Search events')} /></label>
        </div>
      </div>
      {c.isLoadingEvents ? <RowsSkeleton rows={3} height={260} /> : c.eventsError ? (
        <ErrorState message="We could not load your events." onRetry={() => c.fetchMyEvents()} />
      ) : !c.filteredEvents.length ? (
        <EmptyState icon={<CalendarDays size={20} />} title={c.events.length ? 'No events match' : 'No events yet'} body={c.events.length ? 'Try another filter or search.' : 'Create your first event and book a photographer.'}
          action={<button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowBookingModeSelector(true)}><Plus size={16} aria-hidden /> {t('Create event')}</button>} />
      ) : (
        <div className="gev-grid">{c.filteredEvents.map((e: Ev) => <EventCard key={e.id} c={c} e={e} role={role} />)}</div>
      )}
      {modals}
    </div>
  );
}
