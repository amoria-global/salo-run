'use client';

/**
 * Photographer Events & albums in Compact Glass. Behaviour is the classic page's (usePhotographerEvents, moved
 * verbatim); every dialog is the classic page's EventsModals, passed in so both views open the same flows.
 *
 * Header like Home (eyebrow, title, subtitle, one primary action per section), a segmented section switch with the
 * five sections, then: Events (the shared EventsBrowser toolbar, calendar and grouped rows, with glass action
 * buttons), Albums (summary cards, filters with counts, search, glass album cards in Grid or List), Photobooks
 * (summary cards, search, cards with the review status as a chip), Content and Opportunities (their own views).
 */
import { Archive, Check, CheckCheck, CircleHelp, EyeOff, Images, LayoutGrid, Link2, List, Pencil, Plus, QrCode, Radio, RotateCw, Search, Send, Share2, Tag, Trash2, UserRoundSearch, X } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import HostEntryTiles from '@/app/components/HostEntryTiles';
import { dayFilter } from '@/lib/events/eventsFilter';
import { EmptyResult, EventRowShell, EventsCalendar, EventsToolbar, GroupedEvents } from '@/app/components/events/EventsBrowser';
import ContentAlbumsTab from '@/app/pages/photographer/ContentAlbumsTab';
import GlassOpportunities from './GlassOpportunities';
import { notVisibleBadge, SELL_SUBTITLE } from '@/lib/albums/sellPhotos';
import { CREATE_LABEL } from '@/app/lib/getStarted';
import { Card, Chip, EmptyState, OverflowMenu, PageHeader, Segmented } from '../ui';
import PhotobooksShelf from '@/app/components/photobooks/PhotobooksShelf';
import type { PhotographerEventsController, Album } from '@/app/components/events/photographer/usePhotographerEvents';

type Ctl = PhotographerEventsController;
type Section = 'events' | 'opportunities' | 'albums' | 'photobooks' | 'content';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'events', label: 'Events' }, { key: 'opportunities', label: 'Opportunities' }, { key: 'albums', label: 'Albums' },
  { key: 'photobooks', label: 'Photobooks' }, { key: 'content', label: 'Content' },
];
const SUBTITLE: Record<Section, string> = {
  events: 'Manage your assigned events, live streams and event lifecycle.',
  opportunities: 'Requests that match your profile.',
  albums: 'Browse and manage the photo albums you created.',
  photobooks: 'Photobooks clients sent you for review.',
  content: 'Albums you sell to everyone.',
};

function Stat({ label, value }: { label: string; value: number | string }) {
  const { t } = useLanguage();
  return <Card className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{value}</strong></Card>;
}

function EventsSection({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="gev-tools">
        <EventsToolbar counts={c.eventCounts} status={c.eventFilter} onStatus={c.setEventFilter} date={c.eventDate} onClearDate={() => c.setEventDate(null)}
          onPickDate={() => c.setEventsLayout('calendar')} layout={c.eventsLayout} onLayout={c.setEventsLayout} search={c.eventSearch} onSearch={c.setEventSearch} />
        {c.eventsLayout === 'calendar' ? <EventsCalendar events={c.eventItems} date={c.eventDate} onSelect={c.setEventDate} mode={c.calMode} onMode={c.setCalMode} /> : null}
      </div>
      {c.events.length === 0 ? (
        <EmptyState title="No events yet" body="Events you are assigned to appear here." />
      ) : c.visibleItems.length === 0 ? (
        <EmptyResult info={c.emptyHelp} canShowAll={!!c.eventDate || c.eventFilter !== 'all' || !!c.eventSearch}
          showAllLabel={c.eventDate ? 'Show all dates' : 'Show all events'}
          onShowAll={() => { if (c.eventDate) c.setEventDate(null); else { c.setEventFilter('all'); c.setEventSearch(''); } }}
          onJump={() => c.emptyHelp.nextDay && c.setEventDate(dayFilter(c.emptyHelp.nextDay))} />
      ) : (
        <GroupedEvents groups={c.groupedItems} renderRow={(item, st) => {
          const event = item.src;
          const pending = event.bookingStatus?.toUpperCase() === 'PENDING';
          const accepted = event.bookingStatus?.toUpperCase() === 'ACCEPTED';
          const wd = event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }) : '';
          const meta = [wd, event.startTime ? c.formatTime(event.startTime) : '', event.location.address || event.location.city].filter(Boolean).join(' · ');
          const albumReady = (event.status === 'completed' || accepted);
          return (
            <EventRowShell key={event.id} day={item.eventDate || null} title={event.title} meta={meta} status={st} pending={pending}
              onOpen={() => { c.setSelectedEvent(event); c.setShowEventDetailModal(true); }}
              actions={pending ? (
                <>
                  <button type="button" className="g-btn g-btn-primary gev-act" onClick={() => c.openBookingAction(event, 'accept')}><Check size={15} aria-hidden /> {t('Accept')}</button>
                  <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.openBookingAction(event, 'decline')}><X size={15} aria-hidden /> {t('Decline')}</button>
                </>
              ) : (
                <>
                  {event.isPublished && accepted && <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.setQrEvent({ id: event.id, title: event.title })}><QrCode size={15} aria-hidden /> {t('QR code')}</button>}
                  {event.hasLiveStream && (event.status === 'upcoming' || event.status === 'ongoing') && (
                    <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => { c.setSelectedEvent(event); if (!event.isPublished) c.setShowUnpublishedModal(true); else c.setShowStreamPreview(true); }}>
                      <Radio size={15} aria-hidden /> {t('Live stream')}
                    </button>
                  )}
                  {c.canCreateEvents && albumReady && c.canCreateAlbumForEvent(event.id) && (
                    <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => { if (!event.isPublished) { c.setSelectedEvent(event); c.setShowUnpublishedModal(true); } else c.handleOpenCreateAlbum(event.id); }}>
                      <Plus size={15} aria-hidden /> {t('Create album')}
                    </button>
                  )}
                  {albumReady && !c.canCreateAlbumForEvent(event.id) && c.eventHasAlbum(event.id).sent && <Chip tone="success"><Send size={12} aria-hidden /> {t('Album sent')}</Chip>}
                  {event.hasLiveStream && event.status === 'ongoing' && <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.setMarkCompleteTarget(event)}><CheckCheck size={15} aria-hidden /> {t('Mark complete')}</button>}
                  {c.canDismissEvent(event) && (
                    <button type="button" className="g-icon-btn gev-dismiss" aria-label={`${t('Dismiss')} ${event.title}`} title={t('Dismiss event')} onClick={() => { c.setEventToDismiss(event); c.setShowDismissEventModal(true); }}><X size={16} aria-hidden /></button>
                  )}
                </>
              )} />
          );
        }} />
      )}
    </>
  );
}

function AlbumActions({ c, a }: { c: Ctl; a: Album }) {
  const { t } = useLanguage();
  const link = c.buildAlbumLink(a);
  const copied = c.cardLinkCopiedId === a.id;
  const hidden = notVisibleBadge(a);
  const faceAi = !(a.isStandalone && a.albumType === 'standalone' && !a.faceRecognitionEnabled && !a.inviteCode);
  const menu = [
    ...(c.canEditAlbum(a) ? [{ key: 'edit', label: <><Pencil size={15} aria-hidden /> {a.sharedWithClient ? `${t('Edit')} (${c.getEditDaysRemaining(a)} ${t('days left')})` : t('Edit album')}</>, onSelect: () => c.handleOpenEdit(a) }] : []),
    ...(!a.sharedWithClient
      ? [{ key: 'delete', danger: true, label: <><Trash2 size={15} aria-hidden /> {t('Delete album')}</>, onSelect: () => { c.setAlbumToDelete(a); c.setShowDeleteConfirm(true); } }]
      : c.canDismissAlbum(a) ? [{ key: 'dismiss', label: <><Archive size={15} aria-hidden /> {t('Dismiss album')}</>, onSelect: () => { c.setAlbumToDismiss(a); c.setShowDismissAlbumModal(true); } }] : []),
  ];
  return (
    <div className="gev-actions" onClick={(e) => e.stopPropagation()}>
      {!a.isStandalone ? (a.sharedWithClient
        ? <Chip tone="success"><Check size={12} aria-hidden /> {t('Sent')}</Chip>
        : <button type="button" className="g-btn g-btn-primary gev-act" onClick={() => { c.setSelectedAlbum(a); c.setShowSendModal(true); }}><Send size={15} aria-hidden /> {t('Send')}</button>)
        : a.isFreeAlbum ? <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => { c.setSelectedAlbum(a); c.setShowSendModal(true); }}><RotateCw size={15} aria-hidden /> {t('Resend')}</button> : null}
      {hidden && <button type="button" className="g-btn g-btn-ghost gev-act gev-warn" onClick={() => c.handleOpenFaceAI(a)} title={t('This album is saved but buyers cannot find it yet')}><EyeOff size={15} aria-hidden /> {t(hidden)} · {t('Publish')}</button>}
      {faceAi && (a.faceRecognitionEnabled
        ? <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.handleOpenFaceAI(a)} title={t('Album is live on Find-My-Photos')}><Check size={15} aria-hidden /> {t('On Face AI')}</button>
        : !a.isStandalone ? <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.handleOpenFaceAI(a)}><UserRoundSearch size={15} aria-hidden /> {t('Face AI')}</button> : null)}
      {link && (
        <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.copyToClipboard(link, () => { c.setCardLinkCopiedId(a.id); setTimeout(() => c.setCardLinkCopiedId((cur: string | null) => (cur === a.id ? null : cur)), 1800); })}>
          {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />} {copied ? t('Copied') : t('Link')}
        </button>
      )}
      {menu.length ? <OverflowMenu label={`${t('More options for')} ${a.title}`} items={menu} /> : null}
    </div>
  );
}

function AlbumCard({ c, a, list }: { c: Ctl; a: Album; list: boolean }) {
  const { t } = useLanguage();
  const open = () => { c.setSelectedAlbum(a); c.setViewerAlbum(a); c.setCurrentImageIndex(0); c.setShowAlbumBrowseModal(true); };
  return (
    <Card className={`gev-album${list ? ' is-list' : ''}`}>
      <button type="button" className="gev-cover" onClick={open} aria-label={`${t('Open album')} ${a.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.coverImage || '/coverr.jpg'} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
        <span className="gev-cover-chips">
          {a.shared ? <Chip tone="info"><Share2 size={12} aria-hidden /> {t('Shared')}</Chip> : null}
          <Chip tone="neutral"><Images size={12} aria-hidden /> {a.photoCount}</Chip>
        </span>
      </button>
      <div className="gev-album-body">
        <span className="gc-two">
          <small className="g-ellipsis">{a.isStandalone ? (a.location || t('Personal album')) : a.eventTitle}</small>
          <strong className="g-ellipsis">{a.title}</strong>
          <small className="g-ellipsis">{a.isStandalone ? t('Personal album') : a.clientName}</small>
        </span>
        {a.isLocked ? (
          <div className="gev-actions">
            <Chip tone="pending"><Archive size={12} aria-hidden /> {t('Archived')}</Chip>
            <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.setRestoreAlbum(a)} title={t('This album is archived. Restore it to open it to buyers again.')}><RotateCw size={15} aria-hidden /> {t('Restore')}</button>
          </div>
        ) : <AlbumActions c={c} a={a} />}
      </div>
    </Card>
  );
}

function AlbumsSection({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const albums = c.albums as Album[];
  const counts = { all: albums.length, shared: albums.filter((a) => a.shared).length, unshared: albums.filter((a) => !a.shared).length };
  return (
    <>
      <div className="gc-sums">
        <Stat label="Albums" value={albums.length} />
        <Stat label="Shared" value={counts.shared} />
        <Stat label="Photos" value={albums.reduce((s, a) => s + a.photoCount, 0)} />
        <Stat label="Views" value={albums.reduce((s, a) => s + a.views, 0)} />
      </div>
      <div className="gp-toolbar gc-toolbar">
        <Segmented<'all' | 'shared' | 'unshared'> label="Filter albums" value={c.albumFilter} onChange={c.setAlbumFilter} options={[
          { key: 'all', label: 'All', count: counts.all }, { key: 'shared', label: 'Shared', count: counts.shared }, { key: 'unshared', label: 'Not shared', count: counts.unshared },
        ]} />
        <div className="gc-tools">
          <label className="gc-search"><Search size={15} aria-hidden /><span className="sr-only">{t('Search albums')}</span>
            <input type="search" value={c.albumSearch} onChange={(e) => c.setAlbumSearch(e.target.value)} placeholder={t('Search albums')} /></label>
          <div className="gp-seg gc-layout" role="group" aria-label={t('Layout')}>
            <button type="button" className={`gp-seg-btn${c.albumViewMode === 'grid' ? ' is-on' : ''}`} aria-pressed={c.albumViewMode === 'grid'} aria-label={t('Grid')} onClick={() => c.setAlbumViewMode('grid')}><LayoutGrid size={16} aria-hidden /></button>
            <button type="button" className={`gp-seg-btn${c.albumViewMode === 'list' ? ' is-on' : ''}`} aria-pressed={c.albumViewMode === 'list'} aria-label={t('List')} onClick={() => c.setAlbumViewMode('list')}><List size={16} aria-hidden /></button>
          </div>
        </div>
      </div>
      {!c.filteredAlbums.length ? (
        <EmptyState icon={<Images size={20} />} title={albums.length ? 'No albums match' : 'No albums yet'} body={albums.length ? 'Try another filter or search.' : 'Create an album from an event, or sell photos on their own.'}
          action={!albums.length && c.canCreateEvents ? <button type="button" className="g-btn g-btn-primary" onClick={() => c.handleOpenCreateAlbum()}><Plus size={16} aria-hidden /> {t(CREATE_LABEL.albums)}</button> : undefined} />
      ) : (
        <div className={c.albumViewMode === 'grid' ? 'gev-grid' : 'gev-list'}>
          {(c.filteredAlbums as Album[]).map((a) => <AlbumCard key={a.id} c={c} a={a} list={c.albumViewMode === 'list'} />)}
        </div>
      )}
    </>
  );
}

export default function GlassEvents({ ctl: c, modals }: { ctl: Ctl; modals: React.ReactNode }) {
  const { t } = useLanguage();
  const tab = c.activeTab as Section;
  const action = tab === 'events' && c.canCreateEvents ? <button type="button" className="g-btn g-btn-primary" onClick={c.handleSellPhotos} title={t(SELL_SUBTITLE)}><Tag size={16} aria-hidden /> {t('Sell photos')}</button>
    : tab === 'albums' && c.canCreateEvents ? <button type="button" className="g-btn g-btn-primary" onClick={() => c.handleOpenCreateAlbum()}><Plus size={16} aria-hidden /> {t(CREATE_LABEL.albums)}</button>
    : null;
  return (
    <div className="gp-page gev-page">
      <PageHeader eyebrow="Library" title="Events & albums" subtitle={SUBTITLE[tab]} action={
        <span className="gc-head-actions">
          <button type="button" className="g-icon-btn gev-help" onClick={c.getStarted.show} aria-label={t('Show getting started')} title={t('Show getting started')}><CircleHelp size={18} aria-hidden /></button>
          {action}
        </span>
      } />
      {c.canHost ? <HostEntryTiles caption={c.hostedCaption} /> : null}
      <Segmented<Section> label="Library sections" value={tab} onChange={c.setActiveTab} options={SECTIONS.map((s) => ({ key: s.key, label: s.label }))} />
      {tab === 'events' && <EventsSection c={c} />}
      {tab === 'albums' && <AlbumsSection c={c} />}
      {tab === 'photobooks' && <PhotobooksShelf role="photographer" embedded />}
      {tab === 'content' && <ContentAlbumsTab openCreateSignal={c.contentCreateSignal} currencies={c.currencies as never} defaultCurrencyId={c.paidAlbumCurrencyId} />}
      {tab === 'opportunities' && <GlassOpportunities />}
      {modals}
    </div>
  );
}
