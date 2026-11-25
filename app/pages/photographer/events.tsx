"use client";


import MoneyInput from '../../components/MoneyInput';
import { CURRENCY_FLAG_MAP } from '@/lib/currencyFlag';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { hasActiveStream } from '../../lib/streamState';
import Sidebar from '../../components/sidebar';
import { platformAlert } from '../../components/PlatformAlert';
import EventConfirmModal from '../../components/EventConfirmModal';
import EventQrWizard from '../../components/EventQrWizard';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import StandaloneAlbumRestore from '../../components/StandaloneAlbumRestore';
import { EmptyResult, EventRowShell, EventsCalendar, EventsToolbar, GroupedEvents, SectionTabsBar, type CalendarMode, type EventsLayout } from '../../components/events/EventsBrowser';
import { countsOf, dayFilter, emptyInfo, filterEvents, groupEvents, type DateFilter, type StatusFilter } from '@/lib/events/eventsFilter';

// What the user last chose this session. A fresh visit opens on List, All and Any date, so only the layout and the calendar
// mode are remembered, and only until the tab is closed.
const webSession: { layout: EventsLayout; calMode: CalendarMode } = { layout: 'list', calMode: 'month' };
const SECTION_TABS = [
  { key: 'events', label: 'Events', icon: 'bi-calendar-event' },
  { key: 'opportunities', label: 'Opportunities', icon: 'bi-broadcast' },
  { key: 'albums', label: 'Albums', icon: 'bi-images' },
  { key: 'photobooks', label: 'Photobooks', icon: 'bi-book' },
  { key: 'content', label: 'Content', icon: 'bi-newspaper' },
] as const;
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { usePermissions } from '@/app/lib/usePermissions';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import HostEntryTiles from '../../components/HostEntryTiles';
import { useHostEntry } from '../../components/useHostEntry';
import { getPlatformConfig } from '@/lib/platformConfig';
import HostLivePage from '../../components/live/HostLivePage';
import AlbumTypeSelector, { type AlbumType } from '../../components/AlbumTypeSelector';
import PaidAlbumForm, { paidAlbumPriceError } from '../../components/PaidAlbumForm';
import { priceError, usePaymentLimit } from '@/lib/paymentLimits';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';
import FreeAlbumForm from '../../components/FreeAlbumForm';
import SendFreeInvitationModal from '../../components/SendFreeInvitationModal';
import ContentAlbumsTab from './ContentAlbumsTab';
import { useRouter } from 'next/navigation';
import GetStartedModal from '../../components/events/GetStartedModal';
import SellChooserModal from '../../components/events/SellChooserModal';
import NewPhotobookModal from '../../components/events/NewPhotobookModal';
import { useGetStarted } from '../../lib/useGetStarted';
import { CREATE_LABEL } from '../../lib/getStarted';
import LiveChatPreviewDrawer from '../../components/LiveChatPreviewDrawer';
import PhotographerOpportunitiesView from '../../components/hybrid/PhotographerOpportunitiesView';
import { AlbumShareCard } from '../../components/albums/AlbumShareCard';
import { FieldError, invalidFieldProps, invalidFieldStyle } from '../../components/errors/FieldError';
import {
  describePublishFailure, LISTING_NOTE, notVisibleBadge, outcomeFromIndexing, publishOutcome, sellFieldErrors, SELL_FORM_NOTE, SELL_SUBTITLE,
  type PublishOutcome, type SellField,
} from '../../../lib/albums/sellPhotos';
import { albumShareUrl } from '@/lib/albums/albumShare';


import { SearchIcon, CloseIcon, CalendarIcon, ClockIcon, LocationIcon, UserIcon, PackageIcon, BroadcastIcon, PlayIcon, StopIcon, CopyIcon, EyeIcon, EyeOffIcon, HeartIcon, DownloadIcon, ShareIcon, SendIcon, ImageIcon, EditIcon, TrashIcon, GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CheckCircleIcon, WhatsAppIcon, FacebookIcon, TwitterIcon, EmailIcon, LinkIcon, QRCodeIcon, ServerIcon, PlusIcon, FaceRecognitionIcon, InviteCodeIcon, EventsViewIcon, AlbumsViewIcon, PhotobooksViewIcon } from '../../components/events/photographer/icons';
import { usePhotographerEvents, type PhotographerEventsController, type AssignedEvent, type Album } from '../../components/events/photographer/usePhotographerEvents';
import { useUiGlass } from '../../lib/useUiGlass';
import GlassEvents from '../../components/glass/pages/GlassEvents';

/** The classic page body (header, tabs, lists). The modals are EventsModals, shared with the Compact Glass page. */
const ClassicEventsBody = ({ ctl }: { ctl: PhotographerEventsController }) => {
  const {
    colors,
    actualTheme,
    user,
    token,
    formatPrice,
    currencies,
    hasPermission,
    canCreateEvents,
    apiUrl,
    canHost,
    hostedCaption,
    chatPreview,
    setChatPreview,
    activeTab,
    setActiveTab,
    events,
    setEvents,
    eventsLoaded,
    setEventsLoaded,
    showNewPhotobook,
    setShowNewPhotobook,
    photobooksReload,
    setPhotobooksReload,
    router,
    getStarted,
    highlightId,
    highlightCardRef,
    eventFilter,
    setEventFilter,
    eventSearch,
    setEventSearch,
    eventDate,
    setEventDate,
    eventsLayout,
    setEventsLayoutState,
    calMode,
    setCalModeState,
    nowMs,
    setNowMs,
    setEventsLayout,
    setCalMode,
    selectedEvent,
    setSelectedEvent,
    showEventDetailModal,
    setShowEventDetailModal,
    showStreamPreview,
    setShowStreamPreview,
    showUnpublishedModal,
    setShowUnpublishedModal,
    qrEvent,
    setQrEvent,
    streamConfigs,
    setStreamConfigs,
    copiedField,
    setCopiedField,
    markCompleteTarget,
    setMarkCompleteTarget,
    markingCompletedId,
    setMarkingCompletedId,
    bookingActionTarget,
    setBookingActionTarget,
    bookingActionType,
    setBookingActionType,
    declineReason,
    setDeclineReason,
    bookingActionLoading,
    setBookingActionLoading,
    albums,
    setAlbums,
    albumFilter,
    setAlbumFilter,
    albumSearch,
    setAlbumSearch,
    albumViewMode,
    setAlbumViewMode,
    showCreateAlbumModal,
    setShowCreateAlbumModal,
    createAlbumMode,
    setCreateAlbumMode,
    createAlbumEventId,
    setCreateAlbumEventId,
    standaloneLocation,
    setStandaloneLocation,
    standaloneDate,
    setStandaloneDate,
    albumTitle,
    setAlbumTitle,
    albumDescription,
    setAlbumDescription,
    albumCategory,
    setAlbumCategory,
    selectedFiles,
    setSelectedFiles,
    uploadedImagePreviews,
    setUploadedImagePreviews,
    selectedCoverIndex,
    setSelectedCoverIndex,
    showAlbumBrowseModal,
    setShowAlbumBrowseModal,
    showAlbumEditModal,
    setShowAlbumEditModal,
    selectedAlbum,
    setSelectedAlbum,
    showSendModal,
    setShowSendModal,
    showFaceRecognitionModal,
    setShowFaceRecognitionModal,
    faceAIPrice,
    setFaceAIPrice,
    faceAICurrency,
    setFaceAICurrency,
    showFaceAICurrencyDropdown,
    setShowFaceAICurrencyDropdown,
    faceAICurrencyRef,
    showDeleteConfirm,
    setShowDeleteConfirm,
    albumToDelete,
    setAlbumToDelete,
    showAlbumSuccessModal,
    setShowAlbumSuccessModal,
    albumSuccessMessage,
    setAlbumSuccessMessage,
    showDismissEventModal,
    setShowDismissEventModal,
    eventToDismiss,
    setEventToDismiss,
    showDismissAlbumModal,
    setShowDismissAlbumModal,
    albumToDismiss,
    setAlbumToDismiss,
    copiedLink,
    setCopiedLink,
    copiedInviteCode,
    setCopiedInviteCode,
    showImageViewer,
    setShowImageViewer,
    viewerAlbum,
    setViewerAlbum,
    restoreAlbum,
    setRestoreAlbum,
    albumsReload,
    setAlbumsReload,
    currentImageIndex,
    setCurrentImageIndex,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    editImages,
    setEditImages,
    editCoverIndex,
    setEditCoverIndex,
    isUploadingAlbum,
    setIsUploadingAlbum,
    standaloneAlbumType,
    setStandaloneAlbumType,
    paidAlbumPrice,
    setPaidAlbumPrice,
    paidAlbumCurrencyId,
    setPaidAlbumCurrencyId,
    paidAlbumCurrencyCode,
    paidAlbumPriceMsg,
    faceAICurrencyCode,
    faceAILimit,
    faceAIMsg,
    freeAlbumEmail,
    setFreeAlbumEmail,
    freeMaxDownloads,
    setFreeMaxDownloads,
    freeExtraPrice,
    setFreeExtraPrice,
    freeExtraCurrencyId,
    setFreeExtraCurrencyId,
    showSendFreeInvitationModal,
    setShowSendFreeInvitationModal,
    freeAlbumToSend,
    setFreeAlbumToSend,
    albumSuccessModal,
    setAlbumSuccessModal,
    sellPreset,
    setSellPreset,
    showSellChooser,
    setShowSellChooser,
    contentCreateSignal,
    setContentCreateSignal,
    sellErrors,
    setSellErrors,
    retryingPublish,
    setRetryingPublish,
    codeCopied,
    setCodeCopied,
    linkCopied,
    setLinkCopied,
    cardLinkCopiedId,
    setCardLinkCopiedId,
    copyToClipboard,
    buildAlbumLink,
    uploadProgress,
    setUploadProgress,
    mediaIdMap,
    setMediaIdMap,
    receivedPhotobooks,
    setReceivedPhotobooks,
    photobookSearch,
    setPhotobookSearch,
    selectedPhotobook,
    setSelectedPhotobook,
    showPhotobookBrowse,
    setShowPhotobookBrowse,
    photobookSelectedImages,
    setPhotobookSelectedImages,
    isPhotobookSelectMode,
    setIsPhotobookSelectMode,
    showPhotobookImageViewer,
    setShowPhotobookImageViewer,
    photobookCurrentImageIndex,
    setPhotobookCurrentImageIndex,
    showDeletePhotobookModal,
    setShowDeletePhotobookModal,
    photobookToDelete,
    setPhotobookToDelete,
    photobookToResubmit,
    setPhotobookToResubmit,
    isResubmittingPhotobook,
    setIsResubmittingPhotobook,
    handleDeletePhotobook,
    handleResubmitPhotobook,
    downloadImage,
    downloadAllImages,
    openPhotobookBrowse,
    closePhotobookBrowse,
    openPhotobookImageViewer,
    closePhotobookImageViewer,
    handlePhotobookBulkDownload,
    normalizeImg,
    mapApiAlbum,
    deepLinkHandled,
    formatDate,
    formatTime,
    getStatusBadge,
    handleOpenFaceAI,
    handleCopyField,
    handleCopyLink,
    handleCopyInviteCode,
    handleStartStream,
    handleResumeStream,
    handlePauseStream,
    handleEndStream,
    handleResetStream,
    handleMarkCompleted,
    openBookingAction,
    closeBookingAction,
    handleConfirmBookingAction,
    uploadMediaToEvent,
    uploadImageToAlbum,
    fetchEventMedia,
    deleteEventMedia,
    handleFileSelect,
    eventHasAlbum,
    canCreateAlbumForEvent,
    EDIT_WINDOW_DAYS,
    getAlbumSentMs,
    canEditAlbum,
    getEditDaysRemaining,
    handleOpenCreateAlbum,
    startEventSale,
    startContentSale,
    handleSellPhotos,
    retryPublishAlbum,
    preparingAlbumId,
    handleEventSelectForAlbum,
    handleCreateAlbum,
    handleOpenEdit,
    handleSaveEdit,
    handleEditFileAdd,
    handleEditImageRemove,
    handleToggleFaceRecognition,
    handleSendToClient,
    handleDeleteAlbum,
    handleDismissEvent,
    handleDismissAlbum,
    canDismissEvent,
    canDismissAlbum,
    handleBrowseKeyDown,
    filteredAlbums,
    eventItems,
    eventFilters,
    eventCounts,
    visibleItems,
    groupedItems,
    emptyHelp,
    filterBtnStyle,
    cardStyle,
    modalOverlay,
    modalContent,
    inputStyle,
    primaryBtn,
    secondaryBtn,
    smallActionBtn,
  } = ctl;
  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .events-page-grid { grid-template-columns: 1fr 1fr !important; }
          .events-page-stats { grid-template-columns: 1fr 1fr !important; }
          .events-page-header { flex-direction: column !important; gap: 0.75rem !important; }
          .events-page-filters { flex-wrap: wrap !important; }
          .events-page-main { padding: 0.75rem !important; }
        }
        @media (max-width: 480px) {
          .events-page-grid { grid-template-columns: 1fr !important; }
          .events-page-stats { grid-template-columns: 1fr 1fr !important; }
          .events-page-filters { overflow-x: auto !important; flex-wrap: nowrap !important; }
          .events-page-main { padding: 0.5rem !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar userRole="photographer" />
          <div className="events-page-main" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

            {/* One bar of equal tabs at the top of the content area */}
            <div style={{ marginBottom: '1rem', maxWidth: 760 }}>
              <SectionTabsBar tabs={SECTION_TABS} value={activeTab} onChange={setActiveTab} />
            </div>

            {/* Page Header */}
            <header className="events-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', margin: '8px 0 22px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
                }}>Library</div>
                <h1 style={{
                  margin: 0, fontSize: '1.85rem', fontWeight: 800,
                  letterSpacing: '-0.02em', color: colors.textPrimary,
                }}>Events & albums</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                  {activeTab === 'events'
                    ? 'Manage your assigned events, live streams, and event lifecycle.'
                    : activeTab === 'albums'
                    ? 'Browse and manage your created photo albums.'
                    : 'Curate and share photobooks with your clients.'}
                </p>
                {canHost ? <HostEntryTiles caption={hostedCaption} /> : null}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={getStarted.show} className="ck-btn ck-btn-ghost" aria-label="Show getting started" title="Show getting started">
                  <i className="bi bi-question-circle" aria-hidden="true" />
                </button>
                {/* Host an event here duplicated the Go live tile above, so this is the photographer's own sale instead. */}
                {activeTab === 'events' && canCreateEvents ? (
                  <button type="button" onClick={handleSellPhotos} className="ck-btn ck-btn-primary" title={SELL_SUBTITLE}>
                    <i className="bi bi-tag-fill" aria-hidden="true" /> Sell photos
                  </button>
                ) : null}
                {activeTab === 'photobooks' && canCreateEvents ? (
                  <button type="button" onClick={() => setShowNewPhotobook(true)} className="ck-btn ck-btn-primary">
                    <i className="bi bi-plus-lg" aria-hidden="true" /> {CREATE_LABEL.photobooks}
                  </button>
                ) : null}
                {activeTab === 'albums' && canCreateEvents ? (
                  <button type="button" onClick={() => handleOpenCreateAlbum()} className="ck-btn ck-btn-primary">
                    <i className="bi bi-plus-lg" aria-hidden="true" /> {CREATE_LABEL.albums}
                  </button>
                ) : null}
              </div>
            </header>

            {/* ==================== EVENTS TAB ==================== */}
            {activeTab === 'events' && (
              <>
                <div style={{ display: 'grid', gap: 14, marginBottom: '1.25rem' }}>
                  <EventsToolbar
                    counts={eventCounts}
                    status={eventFilter}
                    onStatus={setEventFilter}
                    date={eventDate}
                    onClearDate={() => setEventDate(null)}
                    onPickDate={() => setEventsLayout('calendar')}
                    layout={eventsLayout}
                    onLayout={setEventsLayout}
                    search={eventSearch}
                    onSearch={setEventSearch}
                  />
                  {eventsLayout === 'calendar' ? <EventsCalendar events={eventItems} date={eventDate} onSelect={setEventDate} mode={calMode} onMode={setCalMode} /> : null}
                </div>

                {events.length === 0 ? (
                  <div role="status" style={{ textAlign: 'center', padding: '28px 12px', color: colors.textSecondary }}>
                    <strong style={{ display: 'block', color: colors.textPrimary, fontSize: '1.05rem' }}>No events found</strong>
                    Events you’re assigned to will appear here.
                  </div>
                ) : visibleItems.length === 0 ? (
                  <EmptyResult
                    info={emptyHelp}
                    canShowAll={!!eventDate || eventFilter !== 'all' || !!eventSearch}
                    showAllLabel={eventDate ? 'Show all dates' : 'Show all events'}
                    onShowAll={() => { if (eventDate) setEventDate(null); else { setEventFilter('all'); setEventSearch(''); } }}
                    onJump={() => emptyHelp.nextDay && setEventDate(dayFilter(emptyHelp.nextDay))}
                  />
                ) : (
                  <GroupedEvents
                    groups={groupedItems}
                    renderRow={(item, st) => {
                      const event = item.src;
                      const streamCfg = event.hasLiveStream ? streamConfigs[event.id] : null;
                      const isLive = streamCfg?.connectionStatus === 'connected';
                      const pending = event.bookingStatus?.toUpperCase() === 'PENDING';
                      const small: React.CSSProperties = { minHeight: 36, padding: '0 12px', borderRadius: 9, border: '1px solid currentColor', background: 'transparent', cursor: 'pointer', font: 'inherit', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, color: colors.textPrimary };
                      const wd = event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }) : '';
                      const meta = [wd, event.startTime ? formatTime(event.startTime) : '', event.location.address || event.location.city].filter(Boolean).join(' · ');
                      return (
                        <EventRowShell
                          key={event.id}
                          day={item.eventDate || null}
                          title={event.title}
                          meta={meta}
                          status={st}
                          pending={pending}
                          onOpen={() => { setSelectedEvent(event); setShowEventDetailModal(true); }}
                          actions={pending ? (
                            <>
                              <button type="button" onClick={() => openBookingAction(event, 'accept')} style={{ ...small, color: 'var(--g-success, #10B981)' }}><i className="bi bi-check2-circle" aria-hidden="true" /> Accept</button>
                              <button type="button" onClick={() => openBookingAction(event, 'decline')} style={{ ...small, color: 'var(--g-error, #EF4444)' }}><i className="bi bi-x-circle-fill" aria-hidden="true" /> Deny</button>
                            </>
                          ) : (
                            <>
                              {event.isPublished && event.bookingStatus?.toUpperCase() === 'ACCEPTED' && (
                                <button type="button" onClick={() => setQrEvent({ id: event.id, title: event.title })} style={small}><i className="bi bi-qr-code" aria-hidden="true" /> QR code</button>
                              )}
                              {event.hasLiveStream && (event.status === 'upcoming' || event.status === 'ongoing') && (
                                <button type="button" onClick={() => { setSelectedEvent(event); if (!event.isPublished) setShowUnpublishedModal(true); else setShowStreamPreview(true); }} style={{ ...small, color: isLive ? '#EF4444' : '#A78BFA' }}><i className="bi bi-broadcast-pin" aria-hidden="true" /> {isLive ? 'LIVE' : 'Live Stream'}</button>
                              )}
                              {canCreateEvents && (event.status === 'completed' || event.bookingStatus?.toUpperCase() === 'ACCEPTED') && canCreateAlbumForEvent(event.id) && (
                                <button type="button" onClick={() => { if (!event.isPublished) { setSelectedEvent(event); setShowUnpublishedModal(true); } else handleOpenCreateAlbum(event.id); }} style={{ ...small, color: 'var(--g-link, #7fa8ff)' }}><i className="bi bi-plus-circle-fill" aria-hidden="true" /> Create Album</button>
                              )}
                              {(event.status === 'completed' || event.bookingStatus?.toUpperCase() === 'ACCEPTED') && !canCreateAlbumForEvent(event.id) && eventHasAlbum(event.id).sent && (
                                <span style={{ ...small, cursor: 'default', color: 'var(--g-success, #10B981)' }}><i className="bi bi-send-check-fill" aria-hidden="true" /> Album Sent</span>
                              )}
                              {event.hasLiveStream && event.status === 'ongoing' && (
                                <button type="button" onClick={() => setMarkCompleteTarget(event)} style={small}><i className="bi bi-check2-all" aria-hidden="true" /> Mark complete</button>
                              )}
                              {canDismissEvent(event) && (
                                <button type="button" title="Dismiss Event" aria-label={'Dismiss ' + event.title} onClick={() => { setEventToDismiss(event); setShowDismissEventModal(true); }} style={{ ...small, color: colors.textSecondary }}><i className="bi bi-eye-slash" aria-hidden="true" /></button>
                              )}
                            </>
                          )}
                        />
                      );
                    }}
                  />
                )}
              </>
            )}

            {/* ==================== ALBUMS TAB ==================== */}
            {activeTab === 'albums' && (
              <>
                {/* Stats */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Total Albums', value: albums.length, accent: 'var(--g-link, #083A85)', icon: 'bi-images', tint: 'rgba(8,58,133,0.10)' },
                    { label: 'Shared', value: albums.filter(a => a.shared).length, accent: '#10B981', icon: 'bi-share-fill', tint: 'rgba(16,185,129,0.12)' },
                    { label: 'Total Photos', value: albums.reduce((s, a) => s + a.photoCount, 0), accent: '#F59E0B', icon: 'bi-camera-fill', tint: 'rgba(245,158,11,0.12)' },
                    { label: 'Total Views', value: albums.reduce((s, a) => s + a.views, 0), accent: '#F20C8F', icon: 'bi-eye-fill', tint: 'rgba(242,12,143,0.12)' },
                  ] as const).map(stat => (
                    <div
                      key={stat.label}
                      className="ck-card"
                      style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px 16px' }}
                    >
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: stat.tint,
                          border: `1px solid ${stat.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`bi ${stat.icon}`} style={{ fontSize: 16, color: stat.accent }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: 2, fontWeight: 600 }}>{stat.label}</div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{stat.value.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters + Search + Actions */}
                <div className="events-page-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div className="ck-tabs">
                    {(['all', 'shared', 'unshared'] as const).map(f => (
                      <button key={f} onClick={() => setAlbumFilter(f)} className={`ck-tab ${albumFilter === f ? 'is-active' : ''}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setAlbumViewMode('grid')} style={{ ...smallActionBtn, borderColor: albumViewMode === 'grid' ? colors.brandPrimary : colors.borderPrimary }}><GridIcon active={albumViewMode === 'grid'} /></button>
                    <button onClick={() => setAlbumViewMode('list')} style={{ ...smallActionBtn, borderColor: albumViewMode === 'list' ? colors.brandPrimary : colors.borderPrimary }}><ListIcon active={albumViewMode === 'list'} /></button>
                  </div>
                  <div className="ck-search" style={{ marginLeft: 'auto', minWidth: 240, maxWidth: 320 }}>
                    <i className="bi bi-search" />
                    <input placeholder="Search albums…" value={albumSearch} onChange={e => setAlbumSearch(e.target.value)} />
                  </div>
                </div>

                {/* Album Cards */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: albumViewMode === 'grid' ? 'repeat(auto-fill, minmax(380px, 1fr))' : '1fr', gap: '1rem' }}>
                  {filteredAlbums.map(album => {
                    const matchedEvent = events.find(e => e.id === album.eventId);
                    const displayDate = album.eventDate || matchedEvent?.date || album.createdAt;
                    const clientImg = album.clientImage || matchedEvent?.clientImage || '';
                    return albumViewMode === 'grid' ? (
                    /* ── GRID VIEW: outer glow wrapper + inner card ── */
                    <div key={album.id} style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                      {/* Blurred cover image behind card = image-based border glow */}
                      <img src={album.coverImage || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                      {/* Inner card. clickable to browse album */}
                      <div
                        onClick={() => { setSelectedAlbum(album); setViewerAlbum(album); setCurrentImageIndex(0); setShowAlbumBrowseModal(true); }}
                        style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {/* Full-bleed cover image spanning entire inner card */}
                        <img src={album.coverImage || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {album.isLocked && (
                          <button
                            type="button"
                            title="This album is archived. Restore it to open it to buyers again."
                            onClick={(e) => { e.stopPropagation(); setRestoreAlbum(album); }}
                            style={{ position: 'absolute', top: '3.4rem', left: '0.7rem', zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(8,58,133,0.92)', color: '#fff', padding: '5px 11px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
                          >
                            <i className="bi bi-lock-fill" style={{ fontSize: 11 }} />
                            Archived · Restore
                          </button>
                        )}
                        {/* Gradient overlay. lighter so image shows through */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                        {/* TOP: date badge + shared badge */}
                        <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', right: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                          <div style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: 'white',
                            padding: '0.28rem 0.7rem',
                            borderRadius: 9999,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            border: '1px solid rgba(255,255,255,0.18)',
                          }}>
                            <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                            {formatDate(displayDate)}
                          </div>
                          {album.shared && (
                            <div style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: 'white',
                              padding: '0.28rem 0.65rem',
                              borderRadius: 9999,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              border: '1px solid rgba(255,255,255,0.25)',
                              boxShadow: '0 4px 10px rgba(16,185,129,0.32)',
                            }}>
                              <i className="bi bi-share-fill" style={{ fontSize: 10 }} /> Shared
                            </div>
                          )}
                        </div>

                        {/* MIDDLE-BOTTOM: title content over image */}
                        <div style={{ position: 'absolute', bottom: '5.8rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>{album.isStandalone ? (album.location || 'Personal Album') : album.eventTitle}</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                            {album.title}
                          </div>
                        </div>

                        {/* FOOTER BAR: frosted glass over blurred cover image */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                          {/* Client avatar + name (or Personal badge for standalone) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, marginBottom: '0.5rem' }}>
                            {album.isStandalone ? (
                              <>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>
                                  <ImageIcon />
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Personal Album</span>
                              </>
                            ) : (
                              <>
                                {clientImg ? (
                                  <img src={clientImg} alt={album.clientName} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.45)', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.30)' }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                                ) : null}
                                <div style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  padding: 1.5,
                                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                                  display: clientImg ? 'none' : 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 3px 8px rgba(8,58,133,0.36), 0 0 0 1px rgba(255,255,255,0.18)',
                                }}>
                                  <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0a4da8 0%, #DB0A7F 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.005em',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.30)',
                                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 3px rgba(0,0,0,0.18)',
                                  }}>
                                    {album.clientName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.clientName}</span>
                              </>
                            )}
                          </div>
                          {/* Action buttons + photo count pill */}
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                            {!album.isStandalone ? (album.sharedWithClient ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.42rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white', borderRadius: 9,
                                boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                              }}>
                                <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Sent
                              </span>
                            ) : (
                              <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} title="Send to Client" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(8,58,133,0.32)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-send-fill" style={{ fontSize: 11 }} /> Send
                              </button>
                            )) : album.isFreeAlbum ? (
                              // Free standalone albums were emailed at creation;
                              // the card-level action here is always a Resend
                              // (no terminal "Sent" chip. opens the send modal
                              // which then resends to the captured recipient).
                              <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} title="Resend invitation" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(8,58,133,0.32)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-arrow-clockwise" style={{ fontSize: 11 }} /> Resend
                              </button>
                            ) : null}
                            {notVisibleBadge(album) && (
                              <button onClick={() => handleOpenFaceAI(album)} data-testid="not-visible-badge" title="This album is saved but buyers cannot find it yet" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.42rem 0.65rem', fontSize: '0.7rem', fontWeight: 700,
                                background: 'transparent', color: colors.textPrimary, border: '1px solid #F5B400', borderRadius: 9, cursor: 'pointer',
                              }}>
                                <i className="bi bi-eye-slash" style={{ fontSize: 11 }} /> {notVisibleBadge(album)} · Publish
                              </button>
                            )}
                            {!(album.isStandalone && album.albumType === 'standalone' && !album.faceRecognitionEnabled && !album.inviteCode) && (
                              album.faceRecognitionEnabled ? (
                                <span onClick={() => handleOpenFaceAI(album)} title="Album is live on Find-My-Photos" style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  padding: '0.42rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                  <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> On Face AI
                                </span>
                              ) : !album.isStandalone ? (
                                <button onClick={() => handleOpenFaceAI(album)} title="Face AI / Find-My-Photos" style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.32)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                  <i className="bi bi-person-bounding-box" style={{ fontSize: 11 }} /> Face AI
                                </button>
                              ) : null
                            )}
                            {(() => {
                              // Share-link affordance. Same buyer URL the
                              // invitation email + create-success modal use.
                              // Hidden when there's no inviteCode/accessCode
                              // yet (e.g. a fresh event album without Face
                              // AI enabled) so we never copy a broken link.
                              const link = buildAlbumLink(album);
                              if (!link) return null;
                              const copied = cardLinkCopiedId === album.id;
                              return (
                                <button
                                  onClick={() => copyToClipboard(link, () => {
                                    setCardLinkCopiedId(album.id);
                                    setTimeout(() => setCardLinkCopiedId(curr => curr === album.id ? null : curr), 1800);
                                  })}
                                  title="Copy share link"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                    background: copied
                                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                      : 'rgba(255,255,255,0.14)',
                                    backdropFilter: 'blur(6px)',
                                    color: 'white',
                                    border: copied ? '1px solid rgba(16,185,129,0.55)' : '1px solid rgba(255,255,255,0.22)',
                                    borderRadius: 9,
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, background 0.15s',
                                  }}
                                  onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; } }}
                                  onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; } }}
                                >
                                  <i className={`bi ${copied ? 'bi-check2' : 'bi-link-45deg'}`} style={{ fontSize: 12 }} />
                                  {copied ? 'Copied' : 'Link'}
                                </button>
                              );
                            })()}
                            {canEditAlbum(album) && (
                              <button onClick={() => handleOpenEdit(album)} title={album.sharedWithClient ? `Edit (${getEditDaysRemaining(album)} days left)` : 'Edit Album'} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.42rem 0.55rem',
                                background: 'rgba(255,255,255,0.14)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                              >
                                <i className="bi bi-pencil-fill" style={{ fontSize: 11 }} />
                              </button>
                            )}
                            {!album.sharedWithClient ? (
                              <button onClick={() => { setAlbumToDelete(album); setShowDeleteConfirm(true); }} title="Delete Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.42rem 0.55rem',
                                background: 'rgba(220,38,38,0.85)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                              >
                                <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                              </button>
                            ) : canDismissAlbum(album) ? (
                              <button onClick={() => { setAlbumToDismiss(album); setShowDismissAlbumModal(true); }} title="Dismiss Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.42rem 0.55rem',
                                background: 'rgba(220,38,38,0.85)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                              >
                                <i className="bi bi-x-octagon-fill" style={{ fontSize: 11 }} />
                              </button>
                            ) : null}
                            <div style={{
                              marginLeft: 'auto',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              padding: '0.42rem 0.7rem', borderRadius: 9,
                              fontSize: '0.7rem', color: 'white', fontWeight: 700, letterSpacing: '-0.005em',
                              flexShrink: 0,
                              boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                            }}>
                              <i className="bi bi-images" style={{ fontSize: 11 }} /> {album.photoCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                    /* ── LIST VIEW ── */
                    <div key={album.id} style={{ ...cardStyle, position: 'relative', height: 160, display: 'flex', flexDirection: 'row' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.boxShadow = '0 12px 28px -10px rgba(8,58,133,0.22)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = '0 4px 16px -6px rgba(8, 58, 133, 0.10)'; }}
                    >
                      {/* Image side with overlay */}
                      <div style={{ position: 'relative', width: 220, flexShrink: 0, overflow: 'hidden' }}>
                        {album.isLocked && (
                          <button
                            type="button"
                            title="This album is archived. Restore it to open it to buyers again."
                            onClick={(e) => { e.stopPropagation(); setRestoreAlbum(album); }}
                            style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(8,58,133,0.92)', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
                          >
                            <i className="bi bi-lock-fill" style={{ fontSize: 10 }} />
                            Archived · Restore
                          </button>
                        )}
                        <img src={album.coverImage || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }} />
                        <div style={{
                          position: 'absolute', top: 10, left: 10,
                          background: 'rgba(0,0,0,0.55)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: 'white',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 9999,
                          fontSize: '0.66rem', fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          border: '1px solid rgba(255,255,255,0.18)',
                        }}>
                          <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                          {formatDate(displayDate)}
                        </div>
                        {album.shared && (
                          <div style={{
                            position: 'absolute', bottom: 10, left: 10,
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 9999,
                            fontSize: '0.64rem', fontWeight: 800,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            border: '1px solid rgba(255,255,255,0.25)',
                            boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                          }}>
                            <i className="bi bi-share-fill" style={{ fontSize: 9 }} /> Shared
                          </div>
                        )}
                      </div>
                      {/* Content side */}
                      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                        <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                          <div>
                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{album.isStandalone ? (album.location || 'Personal Album') : album.eventTitle}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.005em' }}>{album.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: colors.textSecondary }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                {clientImg ? (
                                  <img src={clientImg} alt={album.clientName} style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${colors.borderPrimary}`, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                                ) : null}
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #F20C8F)', border: `1px solid ${colors.borderPrimary}`, display: clientImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 800 }}>{album.clientName.charAt(0).toUpperCase()}</div>
                                <span style={{ fontWeight: 600, color: colors.textPrimary }}>{album.clientName}</span>
                              </div>
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                padding: '0.18rem 0.55rem', borderRadius: 9999,
                                fontSize: '0.66rem', color: 'white', fontWeight: 700,
                                boxShadow: '0 3px 8px rgba(8,58,133,0.24)',
                              }}>
                                <i className="bi bi-images" style={{ fontSize: 10 }} /> {album.photoCount}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => { setSelectedAlbum(album); setViewerAlbum(album); setCurrentImageIndex(0); setShowAlbumBrowseModal(true); }} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                              transition: 'transform 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            ><i className="bi bi-eye-fill" style={{ fontSize: 11 }} /> Browse</button>
                            {!album.isStandalone ? (album.sharedWithClient ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white', borderRadius: 9, cursor: 'default',
                                boxShadow: '0 4px 10px rgba(16,185,129,0.28)',
                              }}><i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Sent</span>
                            ) : (
                              <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(16,185,129,0.28)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-send-fill" style={{ fontSize: 11 }} /> Send</button>
                            )) : album.isFreeAlbum ? (
                              // Free standalone albums: always offer Resend
                              // (emailed at creation; no terminal Sent state).
                              <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-arrow-clockwise" style={{ fontSize: 11 }} /> Resend</button>
                            ) : null}
                            {notVisibleBadge(album) && (
                              <button onClick={() => handleOpenFaceAI(album)} data-testid="not-visible-badge" title="This album is saved but buyers cannot find it yet" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700,
                                background: 'transparent', color: colors.textPrimary, border: '1px solid #F5B400', borderRadius: 9, cursor: 'pointer',
                              }}>
                                <i className="bi bi-eye-slash" style={{ fontSize: 11 }} /> {notVisibleBadge(album)} · Publish
                              </button>
                            )}
                            {!(album.isStandalone && !album.faceRecognitionEnabled && !album.inviteCode) && (
                              album.faceRecognitionEnabled ? (
                                <span onClick={() => handleOpenFaceAI(album)} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.28)',
                                }}><i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> On Face AI</span>
                              ) : !album.isStandalone ? (
                                <button onClick={() => handleOpenFaceAI(album)} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                ><i className="bi bi-person-bounding-box" style={{ fontSize: 11 }} /> Face AI</button>
                              ) : null
                            )}
                            {canEditAlbum(album) && (
                              <button onClick={() => handleOpenEdit(album)} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: colors.bgTertiary,
                                color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                              ><i className="bi bi-pencil-fill" style={{ fontSize: 11 }} /> Edit{album.sharedWithClient ? ` (${getEditDaysRemaining(album)}d)` : ''}</button>
                            )}
                            {!album.sharedWithClient ? (
                              <button onClick={() => { setAlbumToDelete(album); setShowDeleteConfirm(true); }} title="Delete Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.4rem 0.6rem',
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(220,38,38,0.28)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-trash3-fill" style={{ fontSize: 11 }} /></button>
                            ) : canDismissAlbum(album) ? (
                              <button onClick={() => { setAlbumToDismiss(album); setShowDismissAlbumModal(true); }} title="Dismiss Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.4rem 0.6rem',
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(220,38,38,0.28)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-x-octagon-fill" style={{ fontSize: 11 }} /></button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
                {filteredAlbums.length === 0 && (
                  <div className="ck-empty" style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 16,
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.10) 100%)',
                      border: '1px solid var(--ck-stroke)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-images" style={{ fontSize: 26, color: 'var(--g-link, #083A85)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>No albums found</div>
                      <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 460, lineHeight: 1.5 }}>
                        Create one from an event or start a personal album to get going.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ==================== PHOTOBOOKS TAB ==================== */}
            {activeTab === 'photobooks' && (
              <>
                {/* Stats */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Received Photobooks', value: receivedPhotobooks.length, accent: 'var(--g-link, #083A85)', icon: 'bi-book-half', tint: 'rgba(8,58,133,0.10)' },
                    { label: 'Total Photos', value: receivedPhotobooks.reduce((s, pb) => s + pb.images.length, 0), accent: '#F59E0B', icon: 'bi-camera-fill', tint: 'rgba(245,158,11,0.12)' },
                    { label: 'Recent (7 days)', value: receivedPhotobooks.filter(pb => { const d = new Date(pb.sentAt || pb.createdAt); return (nowMs - d.getTime()) < 7 * 24 * 60 * 60 * 1000; }).length, accent: '#10B981', icon: 'bi-clock-history', tint: 'rgba(16,185,129,0.12)' },
                  ] as const).map(stat => (
                    <div
                      key={stat.label}
                      className="ck-card"
                      style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px 16px' }}
                    >
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: stat.tint,
                          border: `1px solid ${stat.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`bi ${stat.icon}`} style={{ fontSize: 16, color: stat.accent }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: 2, fontWeight: 600 }}>{stat.label}</div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{stat.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div className="ck-search" style={{ flex: 1, maxWidth: 420 }}>
                    <i className="bi bi-search" />
                    <input
                      value={photobookSearch}
                      onChange={(e) => setPhotobookSearch(e.target.value)}
                      placeholder="Search photobooks…"
                    />
                  </div>
                </div>

                {/* Photobook Cards Grid */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {receivedPhotobooks
                    .filter(pb => !photobookSearch || pb.name.toLowerCase().includes(photobookSearch.toLowerCase()) || pb.senderName.toLowerCase().includes(photobookSearch.toLowerCase()))
                    .map(pb => (
                    <div
                      key={pb.id}
                      style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {/* Blurred cover = glow effect */}
                      <img src={pb.thumbnail || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                      {/* Inner card */}
                      <div
                        onClick={() => { if (pb.images.length > 0) openPhotobookBrowse(pb); }}
                        style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {/* Full-bleed cover image */}
                        <img src={pb.thumbnail || '/coverr.jpg'} alt={pb.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                        {/* TOP: badges */}
                        <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', right: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              color: 'white',
                              padding: '0.28rem 0.7rem',
                              borderRadius: 9999,
                              fontSize: '0.65rem', fontWeight: 800,
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              border: '1px solid rgba(255,255,255,0.25)',
                              boxShadow: '0 4px 10px rgba(8,58,133,0.32)',
                            }}>
                              <i className="bi bi-book-half" style={{ fontSize: 10 }} /> Photobook
                            </div>
                            {pb.layout && (() => {
                              const cfg: Record<string, { grad: string; shadow: string; icon: string }> = {
                                'book-flip': { grad: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', shadow: '0 4px 10px rgba(139,92,246,0.32)', icon: 'bi-journal-bookmark-fill' },
                                'mosaic': { grad: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadow: '0 4px 10px rgba(245,158,11,0.32)', icon: 'bi-grid-3x3-gap-fill' },
                                'grid': { grad: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', shadow: '0 4px 10px rgba(99,102,241,0.32)', icon: 'bi-grid-fill' },
                                'gallery-wall': { grad: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: '0 4px 10px rgba(16,185,129,0.32)', icon: 'bi-grid-1x2-fill' },
                              };
                              const c = cfg[pb.layout] || cfg['gallery-wall'];
                              return (
                                <div style={{
                                  background: c.grad,
                                  color: 'white',
                                  padding: '0.28rem 0.65rem',
                                  borderRadius: 9999,
                                  fontSize: '0.62rem', fontWeight: 800,
                                  letterSpacing: '0.06em', textTransform: 'uppercase',
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  border: '1px solid rgba(255,255,255,0.25)',
                                  boxShadow: c.shadow,
                                }}>
                                  <i className={`bi ${c.icon}`} style={{ fontSize: 10 }} />
                                  {pb.layout === 'book-flip' ? 'Book Flip' : pb.layout === 'mosaic' ? 'Mosaic' : pb.layout === 'gallery-wall' ? 'Gallery Wall' : pb.layout.replace(/-/g, ' ')}
                                </div>
                              );
                            })()}
                          </div>
                          <div style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: 'white',
                            padding: '0.28rem 0.65rem',
                            borderRadius: 9999,
                            fontSize: '0.66rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            border: '1px solid rgba(255,255,255,0.18)',
                          }}>
                            <i className="bi bi-images" style={{ fontSize: 10 }} /> {pb.images.length}
                          </div>
                        </div>

                        {/* MIDDLE-BOTTOM: title content */}
                        <div style={{ position: 'absolute', bottom: '4.8rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>
                            From: {pb.senderName || 'Client'} &middot; {pb.sentAt ? new Date(pb.sentAt).toLocaleDateString() : pb.createdAt ? new Date(pb.createdAt).toLocaleDateString() : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                              {pb.name}
                            </div>
                            {(() => {
                              const s = pb.status || 'SENT_TO_PHOTOGRAPHER';
                              const cfg: Record<string, { grad: string; shadow: string; label: string; icon: string }> = {
                                SENT_TO_PHOTOGRAPHER: { grad: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', shadow: '0 3px 8px rgba(37,99,235,0.36)', label: 'Received', icon: 'bi-inbox-fill' },
                                PHOTOGRAPHER_EDITING: { grad: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', shadow: '0 3px 8px rgba(139,92,246,0.36)', label: 'Editing', icon: 'bi-pencil-fill' },
                                RESUBMITTED: { grad: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: '0 3px 8px rgba(16,185,129,0.36)', label: 'Resubmitted', icon: 'bi-arrow-return-left' },
                                COMPLETED: { grad: 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)', shadow: '0 3px 8px rgba(16,185,129,0.36)', label: 'Completed', icon: 'bi-check2-all' },
                              };
                              const c = cfg[s] || cfg.SENT_TO_PHOTOGRAPHER;
                              return <span style={{
                                color: 'white',
                                background: c.grad,
                                padding: '0.2rem 0.55rem',
                                borderRadius: 9999,
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                border: '1px solid rgba(255,255,255,0.25)',
                                boxShadow: c.shadow,
                              }}><i className={`bi ${c.icon}`} style={{ fontSize: 9 }} />{c.label}</span>;
                            })()}
                          </div>
                          {pb.description && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{pb.description}</div>
                          )}
                        </div>

                        {/* FOOTER BAR: frosted glass */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openPhotobookBrowse(pb)}
                              style={{
                                flex: 1,
                                padding: '0.42rem 0.65rem',
                                borderRadius: 9, border: 'none',
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                color: 'white',
                                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em',
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              <i className="bi bi-eye-fill" style={{ fontSize: 11 }} /> View
                            </button>
                            {(pb.status === 'SENT_TO_PHOTOGRAPHER' || pb.status === 'PHOTOGRAPHER_EDITING') && (
                              <button
                                onClick={() => setPhotobookToResubmit(pb)}
                                style={{
                                  flex: 1,
                                  padding: '0.42rem 0.65rem',
                                  borderRadius: 9, border: 'none',
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: 'white',
                                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-send-fill" style={{ fontSize: 11 }} />
                                Send Back
                              </button>
                            )}
                            {pb.status === 'RESUBMITTED' && (
                              <span style={{
                                flex: 1,
                                padding: '0.42rem 0.65rem',
                                borderRadius: 9,
                                background: 'rgba(16,185,129,0.18)',
                                border: '1px solid rgba(16,185,129,0.35)',
                                color: 'var(--g-success, #10B981)',
                                fontSize: '0.74rem', fontWeight: 700, letterSpacing: '-0.005em',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              }}>
                                <i className="bi bi-hourglass-split" style={{ fontSize: 11 }} />
                                Awaiting Review
                              </span>
                            )}
                            {pb.status === 'COMPLETED' && (
                              <span style={{
                                flex: 1,
                                padding: '0.42rem 0.65rem',
                                borderRadius: 9,
                                background: 'rgba(16,185,129,0.18)',
                                border: '1px solid rgba(16,185,129,0.35)',
                                color: 'var(--g-success, #10B981)',
                                fontSize: '0.74rem', fontWeight: 700, letterSpacing: '-0.005em',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              }}>
                                <i className="bi bi-check2-all" style={{ fontSize: 12 }} />
                                Accepted
                              </span>
                            )}
                            {(!pb.status || !['SENT_TO_PHOTOGRAPHER', 'PHOTOGRAPHER_EDITING', 'RESUBMITTED', 'COMPLETED'].includes(pb.status)) && (
                              <button
                                onClick={() => downloadAllImages(pb)}
                                style={{
                                  flex: 1,
                                  padding: '0.42rem 0.65rem',
                                  borderRadius: 9, border: 'none',
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: 'white',
                                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-download" style={{ fontSize: 11 }} /> Download
                              </button>
                            )}
                            <button
                              onClick={() => { setPhotobookToDelete(pb); setShowDeletePhotobookModal(true); }}
                              title="Delete Photobook"
                              style={{
                                padding: '0.42rem 0.55rem',
                                borderRadius: 9,
                                background: 'rgba(220,38,38,0.85)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.18)',
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                            >
                              <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {receivedPhotobooks.filter(pb => !photobookSearch || pb.name.toLowerCase().includes(photobookSearch.toLowerCase()) || pb.senderName.toLowerCase().includes(photobookSearch.toLowerCase())).length === 0 && (
                  <div className="ck-empty" style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 16,
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.10) 100%)',
                      border: '1px solid var(--ck-stroke)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-book" style={{ fontSize: 26, color: 'var(--g-link, #083A85)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                        {photobookSearch ? 'No photobooks match your search' : 'No photobooks yet'}
                      </div>
                      <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 460, lineHeight: 1.5 }}>
                        {photobookSearch
                          ? 'Try a different keyword or clear the search.'
                          : 'Clients and coordinators can send you photobooks with their preferred photo selections. They’ll appear here for review and resubmission.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ==================== CONTENT TAB ==================== */}
            {activeTab === 'content' && (
              <ContentAlbumsTab
                openCreateSignal={contentCreateSignal}
                currencies={currencies as any}
                defaultCurrencyId={paidAlbumCurrencyId}
              />
            )}

            {/* ==================== OPPORTUNITIES TAB ==================== */}
            {activeTab === 'opportunities' && (
              <div style={{ marginTop: '1.25rem' }}>
                <PhotographerOpportunitiesView />
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

/** Every modal of the Events page, unchanged; rendered by both the classic and the Compact Glass page. */
export const EventsModals = ({ ctl }: { ctl: PhotographerEventsController }) => {
  const {
    colors,
    actualTheme,
    user,
    token,
    formatPrice,
    currencies,
    hasPermission,
    canCreateEvents,
    apiUrl,
    canHost,
    hostedCaption,
    chatPreview,
    setChatPreview,
    activeTab,
    setActiveTab,
    events,
    setEvents,
    eventsLoaded,
    setEventsLoaded,
    showNewPhotobook,
    setShowNewPhotobook,
    photobooksReload,
    setPhotobooksReload,
    router,
    getStarted,
    highlightId,
    highlightCardRef,
    eventFilter,
    setEventFilter,
    eventSearch,
    setEventSearch,
    eventDate,
    setEventDate,
    eventsLayout,
    setEventsLayoutState,
    calMode,
    setCalModeState,
    nowMs,
    setNowMs,
    setEventsLayout,
    setCalMode,
    selectedEvent,
    setSelectedEvent,
    showEventDetailModal,
    setShowEventDetailModal,
    showStreamPreview,
    setShowStreamPreview,
    showUnpublishedModal,
    setShowUnpublishedModal,
    qrEvent,
    setQrEvent,
    streamConfigs,
    setStreamConfigs,
    copiedField,
    setCopiedField,
    markCompleteTarget,
    setMarkCompleteTarget,
    markingCompletedId,
    setMarkingCompletedId,
    bookingActionTarget,
    setBookingActionTarget,
    bookingActionType,
    setBookingActionType,
    declineReason,
    setDeclineReason,
    bookingActionLoading,
    setBookingActionLoading,
    albums,
    setAlbums,
    albumFilter,
    setAlbumFilter,
    albumSearch,
    setAlbumSearch,
    albumViewMode,
    setAlbumViewMode,
    showCreateAlbumModal,
    setShowCreateAlbumModal,
    createAlbumMode,
    setCreateAlbumMode,
    createAlbumEventId,
    setCreateAlbumEventId,
    standaloneLocation,
    setStandaloneLocation,
    standaloneDate,
    setStandaloneDate,
    albumTitle,
    setAlbumTitle,
    albumDescription,
    setAlbumDescription,
    albumCategory,
    setAlbumCategory,
    selectedFiles,
    setSelectedFiles,
    uploadedImagePreviews,
    setUploadedImagePreviews,
    selectedCoverIndex,
    setSelectedCoverIndex,
    showAlbumBrowseModal,
    setShowAlbumBrowseModal,
    showAlbumEditModal,
    setShowAlbumEditModal,
    selectedAlbum,
    setSelectedAlbum,
    showSendModal,
    setShowSendModal,
    showFaceRecognitionModal,
    setShowFaceRecognitionModal,
    faceAIPrice,
    setFaceAIPrice,
    faceAICurrency,
    setFaceAICurrency,
    showFaceAICurrencyDropdown,
    setShowFaceAICurrencyDropdown,
    faceAICurrencyRef,
    showDeleteConfirm,
    setShowDeleteConfirm,
    albumToDelete,
    setAlbumToDelete,
    showAlbumSuccessModal,
    setShowAlbumSuccessModal,
    albumSuccessMessage,
    setAlbumSuccessMessage,
    showDismissEventModal,
    setShowDismissEventModal,
    eventToDismiss,
    setEventToDismiss,
    showDismissAlbumModal,
    setShowDismissAlbumModal,
    albumToDismiss,
    setAlbumToDismiss,
    copiedLink,
    setCopiedLink,
    copiedInviteCode,
    setCopiedInviteCode,
    showImageViewer,
    setShowImageViewer,
    viewerAlbum,
    setViewerAlbum,
    restoreAlbum,
    setRestoreAlbum,
    albumsReload,
    setAlbumsReload,
    currentImageIndex,
    setCurrentImageIndex,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    editImages,
    setEditImages,
    editCoverIndex,
    setEditCoverIndex,
    isUploadingAlbum,
    setIsUploadingAlbum,
    standaloneAlbumType,
    setStandaloneAlbumType,
    paidAlbumPrice,
    setPaidAlbumPrice,
    paidAlbumCurrencyId,
    setPaidAlbumCurrencyId,
    paidAlbumCurrencyCode,
    paidAlbumPriceMsg,
    faceAICurrencyCode,
    faceAILimit,
    faceAIMsg,
    freeAlbumEmail,
    setFreeAlbumEmail,
    freeMaxDownloads,
    setFreeMaxDownloads,
    freeExtraPrice,
    setFreeExtraPrice,
    freeExtraCurrencyId,
    setFreeExtraCurrencyId,
    showSendFreeInvitationModal,
    setShowSendFreeInvitationModal,
    freeAlbumToSend,
    setFreeAlbumToSend,
    albumSuccessModal,
    setAlbumSuccessModal,
    sellPreset,
    setSellPreset,
    showSellChooser,
    setShowSellChooser,
    contentCreateSignal,
    setContentCreateSignal,
    sellErrors,
    setSellErrors,
    retryingPublish,
    setRetryingPublish,
    codeCopied,
    setCodeCopied,
    linkCopied,
    setLinkCopied,
    cardLinkCopiedId,
    setCardLinkCopiedId,
    copyToClipboard,
    buildAlbumLink,
    uploadProgress,
    setUploadProgress,
    mediaIdMap,
    setMediaIdMap,
    receivedPhotobooks,
    setReceivedPhotobooks,
    photobookSearch,
    setPhotobookSearch,
    selectedPhotobook,
    setSelectedPhotobook,
    showPhotobookBrowse,
    setShowPhotobookBrowse,
    photobookSelectedImages,
    setPhotobookSelectedImages,
    isPhotobookSelectMode,
    setIsPhotobookSelectMode,
    showPhotobookImageViewer,
    setShowPhotobookImageViewer,
    photobookCurrentImageIndex,
    setPhotobookCurrentImageIndex,
    showDeletePhotobookModal,
    setShowDeletePhotobookModal,
    photobookToDelete,
    setPhotobookToDelete,
    photobookToResubmit,
    setPhotobookToResubmit,
    isResubmittingPhotobook,
    setIsResubmittingPhotobook,
    handleDeletePhotobook,
    handleResubmitPhotobook,
    downloadImage,
    downloadAllImages,
    openPhotobookBrowse,
    closePhotobookBrowse,
    openPhotobookImageViewer,
    closePhotobookImageViewer,
    handlePhotobookBulkDownload,
    normalizeImg,
    mapApiAlbum,
    deepLinkHandled,
    formatDate,
    formatTime,
    getStatusBadge,
    handleOpenFaceAI,
    handleCopyField,
    handleCopyLink,
    handleCopyInviteCode,
    handleStartStream,
    handleResumeStream,
    handlePauseStream,
    handleEndStream,
    handleResetStream,
    handleMarkCompleted,
    openBookingAction,
    closeBookingAction,
    handleConfirmBookingAction,
    uploadMediaToEvent,
    uploadImageToAlbum,
    fetchEventMedia,
    deleteEventMedia,
    handleFileSelect,
    eventHasAlbum,
    canCreateAlbumForEvent,
    EDIT_WINDOW_DAYS,
    getAlbumSentMs,
    canEditAlbum,
    getEditDaysRemaining,
    handleOpenCreateAlbum,
    startEventSale,
    startContentSale,
    handleSellPhotos,
    retryPublishAlbum,
    preparingAlbumId,
    handleEventSelectForAlbum,
    handleCreateAlbum,
    handleOpenEdit,
    handleSaveEdit,
    handleEditFileAdd,
    handleEditImageRemove,
    handleToggleFaceRecognition,
    handleSendToClient,
    handleDeleteAlbum,
    handleDismissEvent,
    handleDismissAlbum,
    canDismissEvent,
    canDismissAlbum,
    handleBrowseKeyDown,
    filteredAlbums,
    eventItems,
    eventFilters,
    eventCounts,
    visibleItems,
    groupedItems,
    emptyHelp,
    filterBtnStyle,
    cardStyle,
    modalOverlay,
    modalContent,
    inputStyle,
    primaryBtn,
    secondaryBtn,
    smallActionBtn,
  } = ctl;
  return (
    <>
      {/* ==================== MODALS ==================== */}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div style={modalOverlay} onClick={() => setShowEventDetailModal(false)}>
          <div style={modalContent('620px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Event details</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>{selectedEvent.title}</h2>
              </div>
              <button onClick={() => setShowEventDetailModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>

            <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', backgroundColor: selectedEvent.coverImage ? 'transparent' : '#0D1B2A', border: `1px solid ${colors.borderPrimary}` }}>
              <img src={selectedEvent.coverImage || '/coverr.jpg'} alt={selectedEvent.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedEvent.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.30) 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(() => { const b = getStatusBadge(selectedEvent.status); return <span style={{
                  background: b.bg, color: b.color,
                  padding: '0.28rem 0.65rem', borderRadius: 9999,
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                }}>{b.label}</span>; })()}
                {selectedEvent.hasLiveStream && (
                  <span style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: 'white',
                    padding: '0.28rem 0.65rem', borderRadius: 9999,
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    boxShadow: '0 4px 10px rgba(139,92,246,0.32)',
                  }}>
                    <i className="bi bi-broadcast-pin" style={{ fontSize: 10 }} /> Live Stream
                  </span>
                )}
              </div>
            </div>

            {selectedEvent.description && (
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.1rem', lineHeight: 1.55 }}>{selectedEvent.description}</p>
            )}

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem',
              marginBottom: '1.1rem',
            }}>
              {[
                { icon: 'bi-calendar3', label: 'Date', value: formatDate(selectedEvent.date) },
                { icon: 'bi-clock', label: 'Time', value: `${formatTime(selectedEvent.startTime)}. ${formatTime(selectedEvent.endTime)}` },
                { icon: 'bi-geo-alt-fill', label: 'Location', value: [selectedEvent.location.address, selectedEvent.location.city, selectedEvent.location.country].filter(Boolean).join(', ') || 'No location' },
                { icon: 'bi-person-fill', label: 'Client', value: selectedEvent.clientName },
                { icon: 'bi-box-seam-fill', label: 'Package', value: selectedEvent.packageName },
                { icon: 'bi-tag-fill', label: 'Event Type', value: selectedEvent.eventType },
                { icon: 'bi-people-fill', label: 'Guests', value: `${selectedEvent.guestCount} / ${selectedEvent.maxGuests}` },
                { icon: 'bi-cash-stack', label: 'Amount', value: formatPrice(selectedEvent.totalAmount), highlight: true },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0.6rem 0.75rem',
                  background: colors.bgTertiary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: 10,
                  minWidth: 0,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.12) 0%, rgba(242,12,143,0.10) 100%)',
                    border: '1px solid rgba(8,58,133,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`bi ${item.icon}`} style={{ fontSize: 12, color: 'var(--g-link, #083A85)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</div>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 700, color: colors.textPrimary,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      ...(item.highlight ? {
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      } : {}),
                    }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedEvent.bookingStatus?.toUpperCase() === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                <button onClick={() => openBookingAction(selectedEvent, 'accept')} style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white', border: 'none', borderRadius: 11, cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(16,185,129,0.30)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <i className="bi bi-check2-circle" style={{ fontSize: 13 }} /> Accept
                </button>
                <button onClick={() => openBookingAction(selectedEvent, 'decline')} style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white', border: 'none', borderRadius: 11, cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(220,38,38,0.30)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <i className="bi bi-x-circle-fill" style={{ fontSize: 13 }} /> Deny
                </button>
              </div>
            )}
            {canCreateEvents && (selectedEvent.status === 'completed' || selectedEvent.bookingStatus?.toUpperCase() === 'ACCEPTED') && canCreateAlbumForEvent(selectedEvent.id) && (
              <button onClick={() => { setShowEventDetailModal(false); handleOpenCreateAlbum(selectedEvent.id); }} style={{
                ...primaryBtn,
                width: '100%',
                marginTop: '0.5rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(8,58,133,0.30)'; }}
              ><i className="bi bi-plus-circle-fill" style={{ fontSize: 13 }} /> Create Album from this Event</button>
            )}
            {(selectedEvent.status === 'completed' || selectedEvent.bookingStatus?.toUpperCase() === 'ACCEPTED') && !canCreateAlbumForEvent(selectedEvent.id) && (() => {
              const sent = eventHasAlbum(selectedEvent.id).sent;
              return (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.7rem 0.85rem',
                  background: sent
                    ? (actualTheme === 'dark' ? 'rgba(16,185,129,0.16)' : 'rgba(236,253,245,0.85)')
                    : (actualTheme === 'dark' ? 'rgba(234,179,8,0.14)' : 'rgba(254,243,199,0.55)'),
                  border: `1px solid ${sent ? (actualTheme === 'dark' ? 'rgba(16,185,129,0.40)' : 'rgba(16,185,129,0.30)') : (actualTheme === 'dark' ? 'rgba(245,158,11,0.40)' : 'rgba(245,158,11,0.30)')}`,
                  borderRadius: 11,
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: sent ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
                  }} />
                  <i className={`bi ${sent ? 'bi-send-check-fill' : 'bi-info-circle-fill'}`} style={{ fontSize: 14, color: sent ? '#059669' : '#D97706', marginLeft: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: sent ? (actualTheme === 'dark' ? '#86EFAC' : '#065F46') : (actualTheme === 'dark' ? '#FCD34D' : '#92400E') }}>
                    {sent ? 'Album already created and sent for this event.' : 'Album already created for this event. Delete it first to create a new one.'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Unpublished Event Modal */}
      {qrEvent && (
        <EventQrWizard
          open
          onClose={() => setQrEvent(null)}
          eventId={qrEvent.id}
          eventTitle={qrEvent.title}
          published
        />
      )}

      {showUnpublishedModal && selectedEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-shield-exclamation"
          eyebrow="Not yet published"
          title="Event Not Published"
          intro={<>Live streaming and album creation are only available for published events. Please ask the event creator to publish <strong style={{ color: colors.textPrimary }}>{selectedEvent.title}</strong> first.</>}
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowUnpublishedModal(false)}
          closeLabel="Got it"
          fullWidthClose
        />
      )}

      {/* Live Stream Control Modal */}
      {selectedEvent && showStreamPreview && (
        <HostLivePage
          onClose={() => setShowStreamPreview(false)}
          eventTitle={selectedEvent.title}
          eventId={selectedEvent.id}
          whipUrl={streamConfigs[selectedEvent.id]?.whipUrl}
          whepUrl={streamConfigs[selectedEvent.id]?.whepUrl}
          inviteToken={streamConfigs[selectedEvent.id]?.streamType === 'entry_fee' ? undefined : streamConfigs[selectedEvent.id]?.inviteToken}
          connectionStatus={streamConfigs[selectedEvent.id]?.connectionStatus || 'disconnected'}
          streamHealth={streamConfigs[selectedEvent.id]?.streamHealth}
          uploadSpeed={streamConfigs[selectedEvent.id]?.uploadSpeed}
          viewerCount={streamConfigs[selectedEvent.id]?.viewerCount || 0}
          peakViewers={streamConfigs[selectedEvent.id]?.peakViewers || 0}
          error={streamConfigs[selectedEvent.id]?.error}
          onStartStream={() => handleStartStream(selectedEvent.id)}
          onResumeStream={() => handleResumeStream(selectedEvent.id)}
          onPauseStream={() => handlePauseStream(selectedEvent.id)}
          onEndStream={() => handleEndStream(selectedEvent.id)}
          onResetStream={() => handleResetStream(selectedEvent.id)}
          theme={actualTheme as 'light' | 'dark'}
          colors={colors}
        />
      )}

      {/* Mark Complete Confirmation Modal */}
      {markCompleteTarget && (
        <EventConfirmModal
          tone="success"
          icon="bi-check2-all"
          eyebrow="Mark complete"
          title="Mark Event as Complete"
          intro={<>Are you sure the live stream for <strong style={{ color: colors.textPrimary }}>{markCompleteTarget.title}</strong> is complete?</>}
          detail="This will mark the event as completed."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setMarkCompleteTarget(null)}
          closeLabel="Cancel"
          primary={{
            label: markingCompletedId ? 'Processing...' : 'Confirm Complete',
            icon: markingCompletedId ? 'bi-arrow-clockwise' : 'bi-check2-circle',
            onClick: () => handleMarkCompleted(markCompleteTarget.id),
            tone: 'success',
          }}
        />
      )}

      {/* Booking Accept/Decline Confirmation Modal */}
      {bookingActionTarget && bookingActionType && (() => {
        const isAccept = bookingActionType === 'accept';
        const toneStripe = isAccept ? 'linear-gradient(90deg, #10B981 0%, #16A34A 100%)' : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)';
        const toneGradient = isAccept ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
        const toneShadow = isAccept ? '0 12px 28px rgba(16,185,129,0.40)' : '0 12px 28px rgba(220,38,38,0.40)';
        return (
        <div style={modalOverlay} onClick={closeBookingAction}>
          <div style={modalContent('500px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: toneStripe, zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: toneGradient,
                boxShadow: toneShadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${isAccept ? 'bi-check2-circle' : 'bi-x-octagon-fill'}`} style={{ fontSize: 26, color: '#fff' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: isAccept ? '#059669' : '#DC2626',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
              }}>{isAccept ? 'Confirm acceptance' : 'Confirm decline'}</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                {isAccept ? 'Accept Booking' : 'Decline Booking'}
              </h2>
            </div>

            {/* Event Summary */}
            <div style={{
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.12) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
              borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Event</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.65rem', letterSpacing: '-0.005em' }}>{bookingActionTarget.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem', fontSize: '0.8rem', color: colors.textSecondary }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-calendar3" style={{ fontSize: 11, color: '#F20C8F' }} /> {formatDate(bookingActionTarget.date)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-clock" style={{ fontSize: 11, color: '#F20C8F' }} /> {formatTime(bookingActionTarget.startTime)}. {formatTime(bookingActionTarget.endTime)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-person-fill" style={{ fontSize: 11, color: '#F20C8F' }} /> {bookingActionTarget.clientName}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}><i className="bi bi-geo-alt-fill" style={{ fontSize: 11, color: '#F20C8F', flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingActionTarget.location.address || [bookingActionTarget.location.city, bookingActionTarget.location.country].filter(Boolean).join(', ') || 'N/A'}</span></div>
                {bookingActionTarget.packageName && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-box-seam-fill" style={{ fontSize: 11, color: '#F20C8F' }} /> {bookingActionTarget.packageName}</div>}
                {bookingActionTarget.totalAmount > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: colors.textPrimary }}><i className="bi bi-cash-stack" style={{ fontSize: 11, color: '#F20C8F' }} /> {formatPrice(bookingActionTarget.totalAmount)}</div>}
              </div>
            </div>

            {/* Payment Terms Info. only show on accept */}
            {isAccept && bookingActionTarget.escrowPercentage && (
              <div style={{
                background: actualTheme === 'dark' ? 'rgba(8,58,133,0.18)' : 'rgba(239,246,255,0.85)',
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.40)' : 'rgba(8,58,133,0.22)'}`,
                borderRadius: 11,
                padding: '0.7rem 0.85rem',
                marginBottom: '1rem',
                position: 'relative', overflow: 'hidden',
              }}>
                <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #083A85 0%, #F20C8F 100%)' }} />
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: 11 }} /> Payment Terms
                </div>
                <div style={{ fontSize: '0.82rem', color: actualTheme === 'dark' ? '#BFDBFE' : '#1E40AF', lineHeight: 1.5, paddingLeft: 6 }}>
                  {bookingActionTarget.escrowPercentage === 100
                    ? '100% paid upfront by the client, held in escrow and released upon event completion.'
                    : `${bookingActionTarget.escrowPercentage}% paid upfront (held in escrow) + ${100 - bookingActionTarget.escrowPercentage}% upon event completion.`}
                </div>
              </div>
            )}

            {isAccept ? (
              <p style={{ fontSize: '0.88rem', color: colors.textSecondary, marginBottom: '1.25rem', lineHeight: 1.55, textAlign: 'center' }}>
                By accepting, you confirm your availability for this event. The client will be notified and a payment will be initiated.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '0.88rem', color: colors.textSecondary, marginBottom: '0.75rem', lineHeight: 1.55 }}>
                  The client will be notified and can assign another photographer. Please provide a reason (optional):
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Reason</label>
                  <select
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    style={{ ...inputStyle, marginBottom: '0.5rem', cursor: 'pointer' }}
                  >
                    <option value="">Select a reason (optional)</option>
                    <option value="Scheduling conflict">Scheduling conflict</option>
                    <option value="Location too far">Location too far</option>
                    <option value="Rate doesn't match">Rate doesn&apos;t match expectations</option>
                    <option value="Already booked">Already booked for this date</option>
                    <option value="Personal reasons">Personal reasons</option>
                    <option value="Other">Other</option>
                  </select>
                  {declineReason === 'Other' && (
                    <textarea
                      placeholder="Please specify your reason..."
                      onChange={e => setDeclineReason(e.target.value === '' ? 'Other' : e.target.value)}
                      style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeBookingAction} style={secondaryBtn}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
              >Cancel</button>
              <button
                onClick={handleConfirmBookingAction}
                disabled={bookingActionLoading}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: 11,
                  border: 'none',
                  background: bookingActionLoading
                    ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                    : toneGradient,
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: bookingActionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  boxShadow: bookingActionLoading ? 'none' : (isAccept ? '0 8px 18px rgba(16,185,129,0.32)' : '0 8px 18px rgba(220,38,38,0.32)'),
                  opacity: bookingActionLoading ? 0.7 : 1,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { if (!bookingActionLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {bookingActionLoading ? (
                  <><i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} /> Processing...</>
                ) : (
                  <><i className={`bi ${isAccept ? 'bi-check2-circle' : 'bi-x-circle-fill'}`} style={{ fontSize: 13 }} /> {isAccept ? 'Confirm Accept' : 'Confirm Decline'}</>
                )}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {showSellChooser ? (
        <SellChooserModal
          onClose={() => setShowSellChooser(false)}
          onPick={(key) => {
            setShowSellChooser(false);
            if (key === 'event') startEventSale();
            else startContentSale();
          }}
        />
      ) : null}

      {getStarted.open ? (
        <GetStartedModal
          actions={getStarted.actions}
          createLabel={CREATE_LABEL.host}
          initialDismissed={getStarted.dismissed}
          onClose={getStarted.close}
          onDismissChange={getStarted.setForever}
          onPick={(key) => {
            getStarted.close();
            if (key === 'new-album') handleSellPhotos();
            else if (key === 'photobook') { setActiveTab('photobooks'); setShowNewPhotobook(true); }
            else router.push('/user/photographer/host?new=1');
          }}
        />
      ) : null}

      {showNewPhotobook ? (
        <NewPhotobookModal
          onClose={() => setShowNewPhotobook(false)}
          onCreated={(id) => { setShowNewPhotobook(false); setPhotobooksReload((n) => n + 1); router.push(`/user/photographer/photobooks/${id}`); }}
        />
      ) : null}

      {/* Create Album Modal */}
      {showCreateAlbumModal && (
        <div style={modalOverlay} onClick={() => setShowCreateAlbumModal(false)}>
          <div style={modalContent('620px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-plus-circle-fill" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>{sellPreset ? SELL_SUBTITLE : 'New collection'}</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>{sellPreset ? 'Sell photos' : 'Create Album'}</h2>
                </div>
              </div>
              <button onClick={() => setShowCreateAlbumModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>
            {/* Album Type Toggle (hidden for Sell photos: it is always a standalone PAID album) */}
            {!sellPreset && (
            <>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.1rem' }}>
              <button onClick={() => { setCreateAlbumMode('event'); setCreateAlbumEventId(''); setAlbumTitle(''); setAlbumDescription(''); setAlbumCategory(''); setUploadedImagePreviews([]); setSelectedFiles(null); }} style={{
                flex: 1, padding: '0.8rem 0.9rem',
                borderRadius: 12,
                border: `1px solid ${createAlbumMode === 'event' ? 'rgba(8,58,133,0.45)' : colors.borderPrimary}`,
                background: createAlbumMode === 'event'
                  ? (actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                    : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.04) 100%)')
                  : colors.bgCard,
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                color: createAlbumMode === 'event' ? '#083A85' : colors.textPrimary,
                transition: 'all 0.18s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: createAlbumMode === 'event' ? '0 6px 14px rgba(8,58,133,0.14)' : 'none',
              }}>
                <i className="bi bi-calendar-event-fill" style={{ fontSize: 13, color: createAlbumMode === 'event' ? '#F20C8F' : colors.textSecondary }} />
                Event Album
              </button>
              <button onClick={() => { setCreateAlbumMode('standalone'); setCreateAlbumEventId(''); setAlbumTitle(''); setAlbumDescription(''); setAlbumCategory(''); setStandaloneLocation(''); setStandaloneDate(''); setUploadedImagePreviews([]); setSelectedFiles(null); }} style={{
                flex: 1, padding: '0.8rem 0.9rem',
                borderRadius: 12,
                border: `1px solid ${createAlbumMode === 'standalone' ? 'rgba(139,92,246,0.50)' : colors.borderPrimary}`,
                background: createAlbumMode === 'standalone'
                  ? (actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(242,12,143,0.04) 100%)')
                  : colors.bgCard,
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                color: createAlbumMode === 'standalone' ? '#7C3AED' : colors.textPrimary,
                transition: 'all 0.18s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: createAlbumMode === 'standalone' ? '0 6px 14px rgba(139,92,246,0.16)' : 'none',
              }}>
                <i className="bi bi-person-vcard-fill" style={{ fontSize: 13, color: createAlbumMode === 'standalone' ? '#F20C8F' : colors.textSecondary }} />
                Personal Album
              </button>
            </div>
            </>
            )}
            {createAlbumMode === 'standalone' && (
              <>
                <div style={{
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.16) 0%, rgba(242,12,143,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(242,12,143,0.04) 100%)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(139,92,246,0.30)' : 'rgba(139,92,246,0.20)'}`,
                  borderRadius: 11,
                  padding: '0.7rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', gap: 9,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #8B5CF6 0%, #F20C8F 100%)',
                  }} />
                  <i className="bi bi-info-circle-fill" style={{ fontSize: 14, color: '#8B5CF6', flexShrink: 0, marginLeft: 4 }} />
                  <span style={{ fontSize: '0.82rem', color: colors.textPrimary, lineHeight: 1.5 }} data-testid="sell-note">
                    {sellPreset ? SELL_FORM_NOTE : (<>Personal albums can be <strong style={{ color: 'var(--g-link, #083A85)', fontWeight: 700 }}>PAID</strong> with facial recognition enabled, or <strong style={{ color: 'var(--g-success, #059669)', fontWeight: 700 }}>FREE</strong> with private email access.</>)}
                  </span>
                </div>
                {/* Album Type Selector */}
                {!sellPreset && (
                <AlbumTypeSelector
                  selectedType={standaloneAlbumType}
                  onChange={setStandaloneAlbumType}
                />
                )}
              </>
            )}
            {/* Select Event (event mode only) */}
            {createAlbumMode === 'event' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Select Event <span style={{ color: 'var(--g-error, #EF4444)' }}>*</span></label>
                <select value={createAlbumEventId} onChange={e => handleEventSelectForAlbum(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Choose an event...</option>
                  {events.filter(e => (e.bookingStatus?.toUpperCase() === 'ACCEPTED' || e.status === 'completed') && canCreateAlbumForEvent(e.id)).map(e => <option key={e.id} value={e.id}>{e.title} - {formatDate(e.date)}</option>)}
                </select>
              </div>
            )}
            {(createAlbumMode === 'standalone' || createAlbumEventId) && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Album Title <span style={{ color: 'var(--g-error, #EF4444)' }}>*</span></label>
                  <input value={albumTitle} onChange={e => { setAlbumTitle(e.target.value); if (sellErrors.title) setSellErrors(p => ({ ...p, title: undefined })); }} style={{ ...inputStyle, ...(sellErrors.title ? invalidFieldStyle(colors.statusError) : null) }} placeholder="Enter album title" {...invalidFieldProps('sell-title-error', sellErrors.title)} />
                  <FieldError id="sell-title-error" message={sellErrors.title} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Category</label>
                    {createAlbumMode === 'standalone' ? (
                      <select value={albumCategory} onChange={e => setAlbumCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Select category...</option>
                        {['Wedding', 'Portrait', 'Corporate', 'Birthday', 'Concert', 'Sports', 'Fashion', 'Conference', 'Graduation', 'Festival', 'Religious', 'Cultural', 'Entertainment', 'Other'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={albumCategory} onChange={e => setAlbumCategory(e.target.value)} style={inputStyle} />
                    )}
                  </div>
                  {createAlbumMode === 'event' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Client</label>
                      <input readOnly value={events.find(e => e.id === createAlbumEventId)?.clientName || ''} style={{ ...inputStyle, opacity: 0.7 }} />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Date</label>
                      <input type="date" value={standaloneDate} onChange={e => setStandaloneDate(e.target.value)} style={inputStyle} />
                    </div>
                  )}
                </div>
                {createAlbumMode === 'standalone' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Location</label>
                    <input value={standaloneLocation} onChange={e => setStandaloneLocation(e.target.value)} style={inputStyle} placeholder="e.g. Kigali, Rwanda" />
                  </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Description</label>
                  <textarea value={albumDescription} onChange={e => setAlbumDescription(e.target.value)} style={{ ...inputStyle, minHeight: 84, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {/* PAID/FREE Album Forms */}
                {createAlbumMode === 'standalone' && (
                  <>
                    {standaloneAlbumType === 'PAID' ? (
                      <PaidAlbumForm
                        pricePerImage={paidAlbumPrice}
                        onPriceChange={setPaidAlbumPrice}
                        currencyId={paidAlbumCurrencyId}
                        onCurrencyChange={setPaidAlbumCurrencyId}
                        currencies={currencies}
                        colors={{ textPrimary: colors.textPrimary, textSecondary: colors.textSecondary, border: colors.borderPrimary, background: colors.bgTertiary }}
                      />
                    ) : (
                      <FreeAlbumForm
                        recipientEmail={freeAlbumEmail}
                        onEmailChange={setFreeAlbumEmail}
                        maxFreeDownloads={freeMaxDownloads}
                        onMaxFreeDownloadsChange={setFreeMaxDownloads}
                        pricePerExtraImage={freeExtraPrice}
                        onPricePerExtraImageChange={setFreeExtraPrice}
                        currencyId={freeExtraCurrencyId || paidAlbumCurrencyId}
                        onCurrencyChange={setFreeExtraCurrencyId}
                        currencies={currencies}
                        colors={{ textPrimary: colors.textPrimary, textSecondary: colors.textSecondary, border: colors.borderPrimary, background: colors.bgTertiary }}
                      />
                    )}
                    {sellPreset && <FieldError id="sell-price-error" message={sellErrors.price} />}
                  </>
                )}
                {/* Image Upload */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Upload Photos <span style={{ color: 'var(--g-error, #EF4444)' }}>*</span></label>
                  <div style={{
                    border: `2px dashed ${actualTheme === 'dark' ? 'rgba(242,12,143,0.30)' : 'rgba(242,12,143,0.35)'}`,
                    borderRadius: 12,
                    padding: '1.6rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: actualTheme === 'dark'
                      ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                  onClick={() => document.getElementById('album-file-input')?.click()}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = actualTheme === 'dark' ? 'rgba(242,12,143,0.30)' : 'rgba(242,12,143,0.35)'; }}
                  >
                    <div style={{
                      width: 44, height: 44, margin: '0 auto 0.5rem',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 18px rgba(242,12,143,0.30)',
                    }}>
                      <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 20, color: '#fff' }} />
                    </div>
                    <p style={{ fontSize: '0.88rem', color: colors.textPrimary, margin: '0.5rem 0 0 0', fontWeight: 700, letterSpacing: '-0.005em' }}>Click to upload photos</p>
                    <p style={{ fontSize: '0.76rem', color: colors.textSecondary, margin: '2px 0 0 0' }}>or drag & drop your files here</p>
                    <input id="album-file-input" type="file" multiple accept="image/*" onChange={(e) => { handleFileSelect(e); if (sellErrors.photos) setSellErrors(p => ({ ...p, photos: undefined })); }} style={{ display: 'none' }} {...invalidFieldProps('sell-photos-error', sellErrors.photos)} />
                  </div>
                  <FieldError id="sell-photos-error" message={sellErrors.photos} />
                  {uploadedImagePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {uploadedImagePreviews.map((preview, i) => (
                        <div key={i} onClick={() => setSelectedCoverIndex(i)} style={{ position: 'relative', borderRadius: '0.375rem', overflow: 'hidden', cursor: 'pointer', border: selectedCoverIndex === i ? '3px solid #F20C8F' : `2px solid ${colors.borderPrimary}`, aspectRatio: '1' }}>
                          <img src={preview} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {selectedCoverIndex === i && <div style={{ position: 'absolute', top: '2px', left: '2px', backgroundColor: '#F20C8F', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', fontWeight: 600 }}>Cover</div>}
                          <button onClick={(e) => { e.stopPropagation(); setUploadedImagePreviews(prev => prev.filter((_, idx) => idx !== i)); setSelectedFiles(prev => prev ? prev.filter((_, idx) => idx !== i) : prev); if (selectedCoverIndex >= uploadedImagePreviews.length - 1) setSelectedCoverIndex(Math.max(0, uploadedImagePreviews.length - 2)); else if (selectedCoverIndex === i) setSelectedCoverIndex(0); else if (selectedCoverIndex > i) setSelectedCoverIndex(selectedCoverIndex - 1); }} style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.85)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreateAlbumModal(false)} style={secondaryBtn}>Cancel</button>
                  <button
                    onClick={handleCreateAlbum}
                    disabled={
                      isUploadingAlbum || (!sellPreset && (
                      !albumTitle ||
                      (createAlbumMode === 'event' && !createAlbumEventId) ||
                      (createAlbumMode === 'standalone' && standaloneAlbumType === 'PAID' && (!paidAlbumPrice || !paidAlbumCurrencyId || !!paidAlbumPriceMsg)) ||
                      (createAlbumMode === 'standalone' && standaloneAlbumType === 'FREE' && !freeAlbumEmail) ||
                      !selectedFiles || selectedFiles.length === 0
                      ))
                    }
                    style={{
                      ...primaryBtn,
                      opacity: (isUploadingAlbum || (!sellPreset && (
                        !albumTitle ||
                        (createAlbumMode === 'event' && !createAlbumEventId) ||
                        (createAlbumMode === 'standalone' && standaloneAlbumType === 'PAID' && (!paidAlbumPrice || !paidAlbumCurrencyId || !!paidAlbumPriceMsg)) ||
                        (createAlbumMode === 'standalone' && standaloneAlbumType === 'FREE' && !freeAlbumEmail) ||
                        !selectedFiles || selectedFiles.length === 0
                      ))) ? 0.5 : 1
                    }}
                  >
                    {isUploadingAlbum ? (uploadProgress || 'Uploading...') : sellPreset ? 'Upload and publish' : (createAlbumMode === 'standalone' && standaloneAlbumType === 'PAID' ? 'Publish to Face AI' : createAlbumMode === 'standalone' && standaloneAlbumType === 'FREE' ? 'Create & Send Invitation' : 'Create Album')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Send FREE Album Invitation Modal */}
      {showSendFreeInvitationModal && freeAlbumToSend && (
        <SendFreeInvitationModal
          albumTitle={freeAlbumToSend.title}
          recipientEmail={freeAlbumToSend.email}
          accessCode={freeAlbumToSend.accessCode}
          onClose={() => {
            setShowSendFreeInvitationModal(false);
            setFreeAlbumToSend(null);
          }}
          onSend={async () => {
            // Send invitation via API
            try {
              const res = await dashboardAuthFetch(
                `${apiUrl}/api/remote/photographer/albums/${freeAlbumToSend.albumId}/send-free`,
                { method: 'POST' }
              );
              if (!res.ok) {
                throw new Error('Failed to send invitation');
              }
            } catch (err) {
              throw err;
            }
          }}
        />
      )}

      {/* Album Success Modal */}
      {albumSuccessModal && (
        <div style={modalOverlay} onClick={() => setAlbumSuccessModal(null)}>
          <div style={{ ...modalContent('480px'), textAlign: 'center' as const }} onClick={e => e.stopPropagation()}>
            {/* Success icon */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: albumSuccessModal.type === 'paid' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d={albumSuccessModal.outcome?.state === 'failed' ? 'M12 7v6m0 4h.01' : 'M5 13l4 4L19 7'} stroke={albumSuccessModal.outcome?.state === 'failed' ? '#EF4444' : albumSuccessModal.type === 'paid' ? '#3B82F6' : '#10B981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, margin: '0 0 0.35rem' }}>
              {albumSuccessModal.type === 'paid' ? (albumSuccessModal.outcome?.headline ?? 'Published to Face AI') : 'Album Created & Invitation Sent'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1.25rem' }}>
              {albumSuccessModal.type === 'paid'
                ? `"${albumSuccessModal.title}": ${albumSuccessModal.photoCount} photo${albumSuccessModal.photoCount === 1 ? '' : 's'} uploaded.`
                : `"${albumSuccessModal.title}" has been created and an invitation has been sent.`}
            </p>
            {albumSuccessModal.type === 'paid' && albumSuccessModal.outcome && (
              <div data-testid="publish-status" role="status" aria-live="polite" style={{
                textAlign: 'left' as const, marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.85rem', lineHeight: 1.5, color: colors.textPrimary,
                border: `1px solid ${albumSuccessModal.outcome.state === 'failed' ? colors.statusError : albumSuccessModal.outcome.state === 'preparing' ? '#3B82F6' : albumSuccessModal.outcome.warn ? '#F5B400' : '#10B981'}`,
              }}>
                {retryingPublish ? 'Preparing your photos. This can take a minute for a large album.' : albumSuccessModal.outcome.status}
                {albumSuccessModal.outcome.state === 'preparing' && albumSuccessModal.outcome.total > 0 && (
                  <div role="progressbar" aria-valuemin={0} aria-valuemax={albumSuccessModal.outcome.total} aria-valuenow={Math.min(albumSuccessModal.outcome.done, albumSuccessModal.outcome.total)} style={{ marginTop: 8, height: 6, borderRadius: 3, background: colors.bgTertiary, overflow: 'hidden' }}>
                    <div style={{ height: 6, borderRadius: 3, background: '#3B82F6', width: `${Math.round((Math.min(albumSuccessModal.outcome.done, albumSuccessModal.outcome.total) / albumSuccessModal.outcome.total) * 100)}%`, transition: 'width 0.4s' }} />
                  </div>
                )}
                {albumSuccessModal.outcome.state !== 'failed' && <div style={{ marginTop: 6, fontSize: '0.78rem', color: colors.textSecondary }}>{LISTING_NOTE}</div>}
              </div>
            )}

            {/* Details card */}
            <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.75rem', padding: '1.5rem 1.25rem', marginBottom: '1.25rem', textAlign: 'center' as const }}>
              {albumSuccessModal.type === 'paid' && albumSuccessModal.inviteCode && albumSuccessModal.outcome?.state !== 'failed' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Invite Code</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--g-link, #3B82F6)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{albumSuccessModal.inviteCode}</div>
                </div>
              )}
              {albumSuccessModal.type === 'paid' && albumSuccessModal.inviteCode && albumSuccessModal.outcome?.state !== 'failed' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Find My Photos Link</div>
                  {/* Hardcoded host matches the URL MailService bakes into
                      the invitation email - flip this single line if the
                      public host ever moves. The NEXT_PUBLIC_LANDING_URL
                      env var was rendering "undefined" on production
                      builds where the env wasn't injected. */}
                  <div style={{ fontSize: '0.78rem', color: colors.textPrimary, wordBreak: 'break-all' }}>
                    {`https://connekyt.com/user/find-my-photos?code=${albumSuccessModal.inviteCode}`}
                  </div>
                </div>
              )}
              {albumSuccessModal.type === 'free' && albumSuccessModal.email && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Invitation Sent To</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary }}>{albumSuccessModal.email}</div>
                </div>
              )}
              {albumSuccessModal.type === 'free' && albumSuccessModal.accessCode && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Access Code</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--g-success, #10B981)', letterSpacing: '0.3em', fontFamily: 'monospace' }}>{albumSuccessModal.accessCode}</div>
                </div>
              )}
              {/* Direct album link - same URL the invitation email uses,
                  surfaced here so the photographer can share it manually
                  (WhatsApp, SMS, etc.) without waiting for / re-sending
                  the email. The code alone identifies the recipient; the
                  link carries no email, so sharing it never discloses the
                  client's address. */}
              {albumSuccessModal.type === 'free' && albumSuccessModal.accessCode && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Album Link</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textPrimary, wordBreak: 'break-all' }}>
                    {`https://connekyt.com/user/find-my-photos?code=${albumSuccessModal.accessCode}`}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Photos</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.textPrimary }}>{albumSuccessModal.photoCount} uploaded</div>
              </div>
            </div>

            {albumSuccessModal.albumId && albumSuccessModal.outcome?.state !== 'failed' && (
              <AlbumShareCard
                albumId={albumSuccessModal.albumId}
                title={albumSuccessModal.title}
                album={albumSuccessModal.type === 'free' ? { isFreeAlbum: true, accessCode: albumSuccessModal.accessCode, inviteCode: albumSuccessModal.inviteCode } : { inviteCode: albumSuccessModal.inviteCode }}
              />
            )}

            {albumSuccessModal.rejected && albumSuccessModal.rejected.length > 0 && (
              <div style={{
                background: actualTheme === 'dark' ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.30)',
                borderRadius: 10,
                padding: '0.75rem 1rem',
                marginBottom: '0.75rem',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--g-error, #EF4444)', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
                  {albumSuccessModal.rejected.length} photo{albumSuccessModal.rejected.length === 1 ? '' : 's'} not uploaded (resolution too low)
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 1rem', listStyle: 'disc' }}>
                  {albumSuccessModal.rejected.map((msg, i) => (
                    <li key={i} style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: '0.2rem', wordBreak: 'break-word' as const }}>{msg}</li>
                  ))}
                </ul>
                <div style={{ fontSize: '0.72rem', color: colors.textTertiary, marginTop: '0.4rem' }}>
                  Re-export these photos at 700×700 or larger and add them to this album.
                </div>
              </div>
            )}

            {/* Copy code + Copy link + Done buttons.
                Link = the same URL the invitation email's button uses.
                Paid: ?code=<inviteCode>. Free: ?code=<accessCode>. */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {albumSuccessModal.outcome?.state === 'failed' && (
                <button onClick={retryPublishAlbum} disabled={retryingPublish} style={{ ...primaryBtn, minWidth: '150px', opacity: retryingPublish ? 0.6 : 1 }}>
                  {retryingPublish ? 'Publishing...' : 'Retry publishing'}
                </button>
              )}
              {(albumSuccessModal.inviteCode || albumSuccessModal.accessCode) && albumSuccessModal.outcome?.state !== 'failed' && (
                <button
                  onClick={() => {
                    const code = albumSuccessModal.type === 'paid' ? albumSuccessModal.inviteCode : albumSuccessModal.accessCode;
                    if (!code) return;
                    copyToClipboard(code, () => {
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    });
                  }}
                  style={{ ...secondaryBtn, minWidth: '150px' }}
                >
                  {codeCopied ? 'Copied!' : `Copy ${albumSuccessModal.type === 'paid' ? 'Invite Code' : 'Access Code'}`}
                </button>
              )}
              {(() => {
                // Build the share URL identically to the URL the invitation
                // email uses (MailService.java). Neither variant carries an
                // email: the code is the secret and the server resolves the
                // recipient from it.
                let link: string | null = null;
                if (albumSuccessModal.type === 'paid' && albumSuccessModal.inviteCode && albumSuccessModal.outcome?.state !== 'failed') {
                  link = `https://connekyt.com/user/find-my-photos?code=${albumSuccessModal.inviteCode}`;
                } else if (albumSuccessModal.type === 'free' && albumSuccessModal.accessCode) {
                  link = `https://connekyt.com/user/find-my-photos?code=${albumSuccessModal.accessCode}`;
                }
                if (!link) return null;
                return (
                  <button
                    onClick={() => {
                      copyToClipboard(link!, () => {
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      });
                    }}
                    style={{ ...secondaryBtn, minWidth: '150px' }}
                  >
                    {linkCopied ? 'Link copied!' : 'Copy Album Link'}
                  </button>
                );
              })()}
              <button onClick={() => setAlbumSuccessModal(null)} style={primaryBtn}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Album Browse / Image Viewer Modal */}
      {restoreAlbum && (
        <StandaloneAlbumRestore
          album={{ id: restoreAlbum.id, title: restoreAlbum.title, lockedAt: restoreAlbum.lockedAt }}
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setRestoreAlbum(null)}
          onRestored={() => { setRestoreAlbum(null); setAlbumsReload((n) => n + 1); }}
        />
      )}

      {showAlbumBrowseModal && viewerAlbum && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}>
          {/* Radial cinematic backdrop tint */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(8,58,133,0.18) 0%, rgba(0,0,0,0) 65%)',
            pointerEvents: 'none',
          }} />
          {/* Top brand stripe */}
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 15,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            boxShadow: '0 0 18px rgba(242,12,143,0.45)',
          }} />

          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={viewerAlbum.images[currentImageIndex]}
              alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
              style={{ maxWidth: 'calc(100% - 8rem)', maxHeight: 'calc(100% - 9rem)', objectFit: 'contain', borderRadius: 10, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.55)' }}
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.30) 60%, transparent 100%)',
            padding: '1.1rem 1.5rem 2.2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                padding: 2,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(8,58,133,0.32)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', backgroundColor: viewerAlbum.coverImage ? 'transparent' : '#0D1B2A', position: 'relative' }}>
                  <img src={viewerAlbum.coverImage || '/coverr.jpg'} alt={viewerAlbum.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: viewerAlbum.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 800, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 2,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <i className="bi bi-images" style={{ fontSize: 10 }} /> Album viewer
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{viewerAlbum.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.12)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 9999,
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}>
                    <i className="bi bi-person-fill" style={{ fontSize: 9 }} /> {viewerAlbum.clientName}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.7rem', color: 'white',
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    padding: '0.15rem 0.6rem',
                    borderRadius: 9999,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    boxShadow: '0 3px 8px rgba(8,58,133,0.30)',
                  }}>
                    {currentImageIndex + 1} / {viewerAlbum.images.length}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAlbumBrowseModal(false)}
              aria-label="Close viewer"
              style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.18s, transform 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'rotate(0)'; }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* Navigation - Left */}
          <button
            onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
            aria-label="Previous photo"
            style={{
              position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'white',
              cursor: currentImageIndex > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: currentImageIndex > 0 ? 0.78 : 0,
              boxShadow: '0 8px 18px rgba(0,0,0,0.30)',
            }}
            onMouseEnter={(e) => { if (currentImageIndex > 0) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex > 0 ? '0.78' : '0'; e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >
            <i className="bi bi-chevron-left" style={{ fontSize: 20, fontWeight: 800 }} />
          </button>

          {/* Navigation - Right */}
          <button
            onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
            aria-label="Next photo"
            style={{
              position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'white',
              cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 0.78 : 0,
              boxShadow: '0 8px 18px rgba(0,0,0,0.30)',
            }}
            onMouseEnter={(e) => { if (currentImageIndex < viewerAlbum.images.length - 1) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex < viewerAlbum.images.length - 1 ? '0.78' : '0'; e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >
            <i className="bi bi-chevron-right" style={{ fontSize: 20, fontWeight: 800 }} />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '2.5rem 1.5rem 1.4rem'
          }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {viewerAlbum.images.map((image: string, index: number) => {
                const active = currentImageIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Photo ${index + 1}`}
                    style={{
                      position: 'relative', width: 64, height: 48,
                      borderRadius: 8,
                      padding: active ? 2 : 0,
                      background: active ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)' : 'transparent',
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.20)',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.18s',
                      opacity: active ? 1 : 0.55,
                      transform: active ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: active ? '0 6px 14px rgba(242,12,143,0.32)' : 'none',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.04)'; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.transform = 'scale(1)'; } }}
                  >
                    <div style={{ width: '100%', height: '100%', borderRadius: active ? 6 : 8, overflow: 'hidden' }}>
                      <img src={image} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Send Album Modal */}
      {showSendModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowSendModal(false)}>
          <div style={modalContent('480px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-send-fill" style={{ fontSize: 15 }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Deliver photos</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Send Album</h2>
                </div>
              </div>
              <button onClick={() => setShowSendModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>

            {/* Album Preview */}
            <div style={{
              display: 'flex', gap: '0.85rem',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
              borderRadius: 12,
              padding: '0.85rem 0.95rem',
              marginBottom: '1.1rem',
              alignItems: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 11,
                padding: 2,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(8,58,133,0.22)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', backgroundColor: selectedAlbum.coverImage ? 'transparent' : '#0D1B2A', position: 'relative' }}>
                  <img src={selectedAlbum.coverImage || '/coverr.jpg'} alt={selectedAlbum.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedAlbum.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{selectedAlbum.category || 'Album'}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.005em' }}>{selectedAlbum.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.76rem', color: colors.textSecondary }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="bi bi-images" style={{ fontSize: 10, color: '#F20C8F' }} /> {selectedAlbum.photoCount} photos
                  </span>
                  {selectedAlbum.eventTitle && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <i className="bi bi-calendar-event-fill" style={{ fontSize: 10, color: '#F20C8F', marginRight: 4 }} />
                        {selectedAlbum.eventTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '0.45rem',
              }}>Recipient</label>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: colors.bgCard,
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: 12,
                padding: '0.85rem 1rem',
                gap: 12,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    padding: 2,
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 6px 14px rgba(8,58,133,0.28), 0 0 0 1px rgba(255,255,255,0.18)',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0a4da8 0%, #DB0A7F 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      textShadow: '0 1px 2px rgba(0,0,0,0.30)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.18)',
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {(() => {
                        const sf = (selectedAlbum.isStandalone || selectedAlbum.albumType === 'standalone') && !!selectedAlbum.isFreeAlbum;
                        const initial = sf
                          ? (selectedAlbum.recipientEmail?.charAt(0).toUpperCase() || '@')
                          : (selectedAlbum.clientName?.charAt(0).toUpperCase() || '?');
                        return initial;
                      })()}
                      {(() => {
                        const sf = (selectedAlbum.isStandalone || selectedAlbum.albumType === 'standalone') && !!selectedAlbum.isFreeAlbum;
                        if (sf) return null; // no booked-client image for standalone-free
                        const img = selectedAlbum.clientImage || events.find(e => e.id === selectedAlbum.eventId)?.clientImage || '';
                        return img ? <img src={img} alt={selectedAlbum.clientName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null;
                      })()}
                    </div>
                  </div>
                  {(() => {
                    const sf = (selectedAlbum.isStandalone || selectedAlbum.albumType === 'standalone') && !!selectedAlbum.isFreeAlbum;
                    return (
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sf ? (selectedAlbum.recipientEmail || 'No recipient set') : selectedAlbum.clientName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <i className={`bi ${sf ? 'bi-envelope-paper-heart-fill' : 'bi-bookmark-heart-fill'}`} style={{ fontSize: 9, color: '#F20C8F' }} />
                          {sf ? 'Free album recipient · already invited' : 'Booked client'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {(() => {
                  // Standalone-free albums: the invitation was emailed on
                  // creation, so the action here is always a Resend (no
                  // "Delivered" terminal state. they may need it resent
                  // multiple times). Event-linked albums keep the original
                  // "Send Now / Delivered" two-state UX.
                  const sf = (selectedAlbum.isStandalone || selectedAlbum.albumType === 'standalone') && !!selectedAlbum.isFreeAlbum;
                  if (!sf && selectedAlbum.sharedWithClient) {
                    return (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 9999,
                        fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                        boxShadow: '0 4px 10px rgba(16,185,129,0.32)',
                        flexShrink: 0,
                      }}>
                        <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Delivered
                      </div>
                    );
                  }
                  return (
                    <button onClick={() => handleSendToClient(selectedAlbum)} style={{
                      padding: '0.55rem 1.2rem',
                      borderRadius: 9999,
                      border: 'none',
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: 'white',
                      fontSize: '0.82rem', fontWeight: 700,
                      letterSpacing: '-0.005em',
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 6px 14px rgba(8,58,133,0.30)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 22px rgba(242,12,143,0.35)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.30)'; }}
                    >
                      <i className={`bi ${sf ? 'bi-arrow-clockwise' : 'bi-send-fill'}`} style={{ fontSize: 12 }} />
                      {sf ? 'Resend invitation' : 'Send Now'}
                    </button>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Face Recognition Modal */}
      {showFaceRecognitionModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowFaceRecognitionModal(false)}>
          <div style={modalContent('500px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8B5CF6 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(139,92,246,0.32)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-person-bounding-box" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Find-my-photos</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Face Recognition</h2>
                </div>
              </div>
              <button onClick={() => setShowFaceRecognitionModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>
            {/* Album Info */}
            <div style={{
              display: 'flex', gap: '0.85rem',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(139,92,246,0.32)' : 'rgba(139,92,246,0.18)'}`,
              borderRadius: 12,
              padding: '0.85rem 0.95rem',
              marginBottom: '1rem',
              alignItems: 'center',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 11,
                padding: 2,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(139,92,246,0.24)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', backgroundColor: selectedAlbum.coverImage ? 'transparent' : '#0D1B2A', position: 'relative' }}>
                  <img src={selectedAlbum.coverImage || '/coverr.jpg'} alt={selectedAlbum.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedAlbum.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  {selectedAlbum.isStandalone ? 'Personal Album' : (selectedAlbum.category || 'Event Album')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAlbum.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.76rem', color: colors.textSecondary, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="bi bi-images" style={{ fontSize: 10, color: '#F20C8F' }} /> {selectedAlbum.photoCount} photos
                  </span>
                  {selectedAlbum.clientName && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className="bi bi-person-fill" style={{ fontSize: 10, color: '#F20C8F' }} /> {selectedAlbum.clientName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {selectedAlbum.faceRecognitionEnabled ? (
              <>
                {/* Already live. show status + invite code + link */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0.7rem 0.85rem',
                  background: actualTheme === 'dark' ? 'rgba(16,185,129,0.18)' : 'rgba(209,250,229,0.85)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(16,185,129,0.40)' : 'rgba(16,185,129,0.32)'}`,
                  borderRadius: 11,
                  fontSize: '0.86rem',
                  color: actualTheme === 'dark' ? '#86EFAC' : '#065F46',
                  fontWeight: 700, letterSpacing: '-0.005em',
                  marginBottom: '1rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
                  }} />
                  <i className="bi bi-shield-fill-check" style={{ fontSize: 14, color: 'var(--g-success, #10B981)', marginLeft: 4 }} />
                  Album is live on Find-My-Photos
                </div>
                {selectedAlbum.inviteCode && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Invite Code</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input readOnly value={selectedAlbum.inviteCode} style={{
                          ...inputStyle,
                          flex: 1,
                          fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.2em',
                          textAlign: 'center',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          background: actualTheme === 'dark'
                            ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                            : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                          color: 'var(--g-link, #083A85)',
                          WebkitBackgroundClip: 'padding-box',
                          backgroundClip: 'padding-box',
                          padding: '0.85rem 1rem',
                        }} />
                        <button onClick={() => handleCopyInviteCode(selectedAlbum.inviteCode!)} style={{
                          ...smallActionBtn,
                          padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                          background: copiedInviteCode ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                          color: copiedInviteCode ? 'white' : colors.textPrimary,
                          border: copiedInviteCode ? 'none' : `1px solid ${colors.borderPrimary}`,
                          boxShadow: copiedInviteCode ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                        }}
                        onMouseEnter={(e) => { if (!copiedInviteCode) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                        onMouseLeave={(e) => { if (!copiedInviteCode) e.currentTarget.style.borderColor = colors.borderPrimary; }}
                        >
                          {copiedInviteCode ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                <AlbumShareCard albumId={selectedAlbum.id} title={selectedAlbum.title} album={selectedAlbum} />
              </>
            ) : (
              <>
                {/* Not yet sent. show form */}
                <p style={{ fontSize: '0.88rem', color: colors.textSecondary, marginBottom: '1rem', lineHeight: 1.55 }}>
                  Upload this album to <strong style={{ color: colors.textPrimary }}>Find-My-Photos</strong> so event attendees can use face recognition to find their photos. Share the invite code below to help them filter results.
                </p>
                {/* Invite Code */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Invite Code</label>
                  {selectedAlbum.inviteCode ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input readOnly value={selectedAlbum.inviteCode} style={{
                        ...inputStyle,
                        flex: 1,
                        fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.2em',
                        textAlign: 'center',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        background: actualTheme === 'dark'
                          ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                          : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                        color: 'var(--g-link, #083A85)',
                        padding: '0.85rem 1rem',
                      }} />
                      <button onClick={() => handleCopyInviteCode(selectedAlbum.inviteCode!)} style={{
                        ...smallActionBtn,
                        padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                        background: copiedInviteCode ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                        color: copiedInviteCode ? 'white' : colors.textPrimary,
                        border: copiedInviteCode ? 'none' : `1px solid ${colors.borderPrimary}`,
                        boxShadow: copiedInviteCode ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                      }}>
                        {copiedInviteCode ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      background: actualTheme === 'dark' ? 'rgba(220,38,38,0.18)' : 'rgba(254,242,242,0.85)',
                      border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
                      borderRadius: 10,
                      fontSize: '0.84rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
                      fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 13 }} />
                      Failed to generate invite code. Close and try again.
                    </div>
                  )}
                </div>
                {/* Find-My-Photos Link */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Find-My-Photos Link</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input readOnly value={`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${selectedAlbum.inviteCode}`} style={{ ...inputStyle, flex: 1, fontSize: '0.78rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
                    <button onClick={() => handleCopyLink(`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${selectedAlbum.inviteCode}`)} style={{
                      ...smallActionBtn,
                      padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                      background: copiedLink ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                      color: copiedLink ? 'white' : colors.textPrimary,
                      border: copiedLink ? 'none' : `1px solid ${colors.borderPrimary}`,
                      boxShadow: copiedLink ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                    }}>
                      {copiedLink ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                    </button>
                  </div>
                </div>
                {/* Price Per Image */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>
                    Price Per Image {selectedAlbum.isStandalone ? '(optional)' : <span style={{ color: 'var(--g-error, #EF4444)' }}>*</span>}
                  </label>
                  <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: '0 0 0.55rem 0' }}>{selectedAlbum.isStandalone ? 'Optionally set a price per photo. Leave empty for free downloads.' : 'Set the price users will pay to download each photo on Find-My-Photos.'}</p>
                  <MoneyInput
                    label="Price per image"
                    hideLabel
                    value={faceAIPrice}
                    onChange={setFaceAIPrice}
                    currencyId={faceAICurrency}
                    onCurrencyChange={setFaceAICurrency}
                    currencies={currencies.map(c => ({ value: c.id || c.code, code: c.code, name: c.name }))}
                    placeholder={selectedAlbum.isStandalone ? 'Free if empty' : 'Enter price'}
                  />
                </div>
                {/* Upload Button */}
                <button onClick={async () => {
                  const updated = { ...selectedAlbum, faceRecognitionEnabled: true };
                  let published = false;
                  try {
                    // Publish with pricing. triggers Rekognition face indexing without notifying client
                    const publishBody: Record<string, unknown> = {};
                    if (faceAIPrice && parseFloat(faceAIPrice) > 0) {
                      publishBody.pricePerImage = parseFloat(faceAIPrice);
                      publishBody.currencyId = faceAICurrency;
                    }
                    const pubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${selectedAlbum.id}/publish`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(publishBody),
                    });
                    const pubJson = await pubRes.json().catch(() => null);
                    published = pubRes.ok && pubJson?.action !== 0;
                    if (!published) {
                      setShowFaceRecognitionModal(false);
                      setAlbumSuccessMessage({
                        status: 'error',
                        title: 'Could not publish to Find-My-Photos',
                        description: pubJson?.message || 'The album was not published. Please try again.',
                      });
                      setShowAlbumSuccessModal(true);
                    }
                  } catch (err) {
                    console.error('Failed to enable face recognition on album:', err);
                    setShowFaceRecognitionModal(false);
                    setAlbumSuccessMessage({ status: 'error', title: 'Could not publish to Find-My-Photos', description: 'The album was not published. Please try again.' });
                    setShowAlbumSuccessModal(true);
                  }
                  if (published) {
                    // Stay on the modal: it now shows the invite code, the link and the QR to share.
                    setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? updated : a));
                    setSelectedAlbum(updated);
                  }
                }} disabled={(() => {
                  if (!selectedAlbum.inviteCode) return true;
                  if (selectedAlbum.isStandalone) {
                    // Standalone: price optional, but if provided must be valid
                    if (faceAIPrice && parseFloat(faceAIPrice) > 0 && (!faceAICurrency || faceAIMsg)) return true;
                    return false;
                  }
                  // Event album: price + currency required
                  return !faceAIPrice || !!faceAIMsg || !faceAICurrency;
                })()} style={(() => {
                  const isDisabled = (() => {
                    if (!selectedAlbum.inviteCode) return true;
                    if (selectedAlbum.isStandalone) {
                      if (faceAIPrice && parseFloat(faceAIPrice) > 0 && (!faceAICurrency || faceAIMsg)) return true;
                      return false;
                    }
                    return !faceAIPrice || !!faceAIMsg || !faceAICurrency;
                  })();
                  return { ...primaryBtn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: isDisabled ? (actualTheme === 'dark' ? '#374151' : '#D1D5DB') : '#8B5CF6', borderColor: isDisabled ? (actualTheme === 'dark' ? '#374151' : '#D1D5DB') : '#8B5CF6', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1 };
                })()}>
                  <FaceRecognitionIcon /> Upload to Find-My-Photos
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {showAlbumEditModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowAlbumEditModal(false)}>
          <div style={modalContent('620px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-pencil-square" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Edit details</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Edit Album</h2>
                </div>
              </div>
              <button onClick={() => setShowAlbumEditModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Category</label>
                <input value={editCategory} onChange={e => setEditCategory(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Photos</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', opacity: 0.7, cursor: 'default' }}>{editImages.length} image{editImages.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            {/* Images Section */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Album Images</label>
                <button onClick={() => document.getElementById('edit-album-file-input')?.click()} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                ><i className="bi bi-plus-circle-fill" style={{ fontSize: 12 }} /> Add Photos</button>
                <input id="edit-album-file-input" type="file" multiple accept="image/*" onChange={handleEditFileAdd} style={{ display: 'none' }} />
              </div>
              {editImages.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, maxHeight: 260, overflowY: 'auto', padding: 4 }}>
                  {editImages.map((image, i) => {
                    const isCover = editCoverIndex === i;
                    return (
                      <div key={i} style={{
                        position: 'relative',
                        borderRadius: 10,
                        overflow: 'hidden',
                        aspectRatio: '1',
                        padding: isCover ? 2 : 0,
                        background: isCover ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)' : 'transparent',
                        border: isCover ? 'none' : `1px solid ${colors.borderPrimary}`,
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        boxShadow: isCover ? '0 6px 14px rgba(242,12,143,0.30)' : 'none',
                      }}
                      onClick={() => setEditCoverIndex(i)}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: isCover ? 8 : 9, overflow: 'hidden' }}>
                          <img src={image} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {isCover && (
                            <div style={{
                              position: 'absolute', top: 4, left: 4,
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              color: 'white',
                              fontSize: '0.55rem', fontWeight: 800,
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              padding: '0.15rem 0.4rem',
                              borderRadius: 9999,
                              boxShadow: '0 3px 8px rgba(8,58,133,0.32)',
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              border: '1px solid rgba(255,255,255,0.30)',
                            }}>
                              <i className="bi bi-star-fill" style={{ fontSize: 7 }} /> Cover
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleEditImageRemove(i); }} style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 22, height: 22,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            border: '1px solid rgba(255,255,255,0.30)',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 3px 8px rgba(220,38,38,0.36)',
                            transition: 'transform 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          aria-label="Remove image"
                          ><i className="bi bi-x" style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  border: `2px dashed ${actualTheme === 'dark' ? 'rgba(242,12,143,0.30)' : 'rgba(242,12,143,0.35)'}`,
                  borderRadius: 12,
                  padding: '1.5rem 1rem', textAlign: 'center',
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                }}>
                  <i className="bi bi-images" style={{ fontSize: 22, color: '#F20C8F' }} />
                  <p style={{ fontSize: '0.85rem', color: colors.textPrimary, margin: '0.4rem 0 0 0', fontWeight: 600 }}>No images yet</p>
                  <p style={{ fontSize: '0.76rem', color: colors.textSecondary, margin: '2px 0 0 0' }}>Click <strong style={{ color: '#F20C8F' }}>Add Photos</strong> to upload.</p>
                </div>
              )}
              <p style={{ fontSize: '0.74rem', color: colors.textSecondary, margin: '0.5rem 0 0 0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-info-circle" style={{ fontSize: 10, color: '#F20C8F' }} />
                Click an image to set as cover. Click <strong style={{ fontWeight: 700 }}>×</strong> to remove.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAlbumEditModal(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editImages.length === 0} style={{ ...primaryBtn, opacity: editImages.length === 0 ? 0.5 : 1 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Delete Album Warning Modal */}
      {showDeleteConfirm && albumToDelete && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Delete album"
          title="Delete Album?"
          intro={<>You are about to permanently delete <strong style={{ color: colors.textPrimary }}>&quot;{albumToDelete.title}&quot;</strong>.</>}
          detail="This action cannot be undone."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDeleteConfirm(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Delete',
            icon: 'bi-trash3-fill',
            onClick: handleDeleteAlbum,
            tone: 'danger',
          }}
        />
      )}

      {/* Dismiss Event Confirmation Modal */}
      {showDismissEventModal && eventToDismiss && (
        <EventConfirmModal
          tone="danger"
          icon="bi-x-octagon-fill"
          eyebrow="Dismiss event"
          title="Dismiss Event?"
          intro={<><strong style={{ color: colors.textPrimary }}>{eventToDismiss.title}</strong> will be removed from your events list.</>}
          detail="The event and its album will still exist for the client."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDismissEventModal(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Dismiss',
            icon: 'bi-x-octagon-fill',
            onClick: handleDismissEvent,
            tone: 'danger',
          }}
        />
      )}

      {/* Dismiss Album Confirmation Modal */}
      {showDismissAlbumModal && albumToDismiss && (
        <EventConfirmModal
          tone="danger"
          icon="bi-x-octagon-fill"
          eyebrow="Dismiss album"
          title="Dismiss Album?"
          intro={<><strong style={{ color: colors.textPrimary }}>{albumToDismiss.title}</strong> will be removed from your albums list. The album and its photos will still be accessible to the client.</>}
          detail={albumToDismiss.faceRecognitionEnabled
            ? 'Warning: This album is published to Find-My-Photos. Dismissing it will unpublish it and images will no longer appear there.'
            : undefined}
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDismissAlbumModal(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Dismiss',
            icon: 'bi-x-octagon-fill',
            onClick: handleDismissAlbum,
            tone: 'danger',
          }}
        />
      )}

      {/* Album Action Success Modal */}
      {showAlbumSuccessModal && (() => {
        const isError = albumSuccessMessage.status === 'error';
        return (
          <EventConfirmModal
            tone={isError ? 'danger' : 'success'}
            icon={isError ? 'bi-exclamation-octagon-fill' : 'bi-check2-circle'}
            eyebrow={isError ? 'Failed' : 'Success'}
            title={albumSuccessMessage.title}
            intro={albumSuccessMessage.description}
            colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
            actualTheme={actualTheme}
            onClose={() => setShowAlbumSuccessModal(false)}
            closeLabel="Done"
            fullWidthClose
          />
        );
      })()}

      {/* Photobook Image Viewer */}
      {/* Resubmit Photobook Confirmation Modal */}
      {photobookToResubmit && (
        <EventConfirmModal
          tone="success"
          icon="bi-send-check-fill"
          eyebrow="Send back to client"
          title="Resubmit Photobook?"
          intro={<>You&apos;re about to send <strong style={{ color: colors.textPrimary }}>&quot;{photobookToResubmit.name}&quot;</strong> back to <strong style={{ color: colors.textPrimary }}>{photobookToResubmit.senderName || 'the client'}</strong> for review.</>}
          detail="The client will be notified that their photobook is ready for review. You won't be able to make further edits unless they send it back."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => { if (!isResubmittingPhotobook) setPhotobookToResubmit(null); }}
          closeLabel="Cancel"
          primary={{
            label: isResubmittingPhotobook ? 'Sending...' : 'Send Back',
            icon: isResubmittingPhotobook ? 'bi-arrow-clockwise' : 'bi-send-fill',
            onClick: () => { if (!isResubmittingPhotobook) handleResubmitPhotobook(photobookToResubmit); },
            tone: 'success',
          }}
        />
      )}

      {/* Delete Photobook Confirmation Modal */}
      {showDeletePhotobookModal && photobookToDelete && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Delete photobook"
          title="Delete Photobook"
          intro={<>Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{photobookToDelete.name}&quot;</strong>?</>}
          detail="This action cannot be undone."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => { setShowDeletePhotobookModal(false); setPhotobookToDelete(null); }}
          closeLabel="Cancel"
          primary={{
            label: 'Delete',
            icon: 'bi-trash3-fill',
            onClick: handleDeletePhotobook,
            tone: 'danger',
          }}
        />
      )}

      {/* Phase 1: Grid Browse with Select Mode */}
      {showPhotobookBrowse && selectedPhotobook && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', display: 'flex', flexDirection: 'column', zIndex: 1001 }}
          onClick={closePhotobookBrowse}
        >
          {/* Header */}
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>{selectedPhotobook.name}</h2>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>({selectedPhotobook.images.length} photos)</span>
              {selectedPhotobook.layout && (
                <span style={{
                  padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600',
                  backgroundColor: selectedPhotobook.layout === 'book-flip' ? 'rgba(124, 58, 237, 0.2)' : selectedPhotobook.layout === 'mosaic' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(5, 150, 105, 0.2)',
                  color: selectedPhotobook.layout === 'book-flip' ? '#A78BFA' : selectedPhotobook.layout === 'mosaic' ? '#FCD34D' : '#6EE7B7',
                  border: `1px solid ${selectedPhotobook.layout === 'book-flip' ? 'rgba(124, 58, 237, 0.4)' : selectedPhotobook.layout === 'mosaic' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(5, 150, 105, 0.4)'}`
                }}>
                  {selectedPhotobook.layout === 'book-flip' ? 'Book Flip' : selectedPhotobook.layout === 'mosaic' ? 'Mosaic' : selectedPhotobook.layout === 'gallery-wall' ? 'Gallery Wall' : selectedPhotobook.layout.replace(/-/g, ' ')}
                </span>
              )}
              {selectedPhotobook.senderName && (
                <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>From: {selectedPhotobook.senderName}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Select Mode Toggle */}
              {selectedPhotobook.images.length > 0 && (
                <button
                  onClick={() => {
                    setIsPhotobookSelectMode(!isPhotobookSelectMode);
                    if (isPhotobookSelectMode) setPhotobookSelectedImages([]);
                  }}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '2px solid',
                    borderColor: isPhotobookSelectMode ? '#16A34A' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: isPhotobookSelectMode ? '#16A34A' : 'transparent',
                    color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={false} />
                  {isPhotobookSelectMode ? 'Exit Select Mode' : 'Select Mode'}
                </button>
              )}
              {/* Close Button */}
              <button
                onClick={closePhotobookBrowse}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls Bar */}
          {isPhotobookSelectMode && (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', borderBottom: '1px solid rgba(22, 163, 74, 0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--g-success, #16A34A)' }}>
                  {photobookSelectedImages.length} of {selectedPhotobook.images.length} selected
                </span>
                <button
                  onClick={() => {
                    if (photobookSelectedImages.length === selectedPhotobook.images.length) {
                      setPhotobookSelectedImages([]);
                    } else {
                      setPhotobookSelectedImages([...selectedPhotobook.images]);
                    }
                  }}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #16A34A', backgroundColor: 'transparent', color: 'var(--g-success, #16A34A)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  {photobookSelectedImages.length === selectedPhotobook.images.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {photobookSelectedImages.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handlePhotobookBulkDownload}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <DownloadIcon />
                    Download ({photobookSelectedImages.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {selectedPhotobook.images.map((image: string, index: number) => (
                <div
                  key={index}
                  style={{
                    position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden',
                    cursor: 'pointer', border: photobookSelectedImages.includes(image) ? '3px solid #16A34A' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (isPhotobookSelectMode) {
                      if (photobookSelectedImages.includes(image)) {
                        setPhotobookSelectedImages(photobookSelectedImages.filter((img: string) => img !== image));
                      } else {
                        setPhotobookSelectedImages([...photobookSelectedImages, image]);
                      }
                    } else {
                      openPhotobookImageViewer(selectedPhotobook, index);
                    }
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <Image src={image} alt={`${selectedPhotobook.name} - Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {/* Selection overlay */}
                  {isPhotobookSelectMode && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: photobookSelectedImages.includes(image) ? 'rgba(22, 163, 74, 0.25)' : 'transparent',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0.5rem'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: photobookSelectedImages.includes(image) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                        backgroundColor: photobookSelectedImages.includes(image) ? '#16A34A' : 'rgba(0, 0, 0, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}>
                        {photobookSelectedImages.includes(image) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Image number badge */}
                  {!isPhotobookSelectMode && (
                    <div style={{
                      position: 'absolute', bottom: '0.4rem', left: '0.4rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white',
                      padding: '0.15rem 0.5rem', borderRadius: '0.75rem', fontSize: '0.7rem', fontWeight: '600'
                    }}>
                      {index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Full-screen Single Image Viewer */}
      {showPhotobookImageViewer && selectedPhotobook && selectedPhotobook.images.length > 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 35%, rgba(20,24,40,0.97) 0%, rgba(0,0,0,1) 80%)',
          zIndex: 2000,
        }}>
          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image
              src={selectedPhotobook.images[photobookCurrentImageIndex]}
              alt={`${selectedPhotobook.name} - Image ${photobookCurrentImageIndex + 1}`}
              fill
              style={{ objectFit: 'contain', padding: '5rem 4rem' }}
              priority
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0.85rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          }}>
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              opacity: 0.85,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              {selectedPhotobook.thumbnail && (
                <div style={{
                  width: 40, height: 40, borderRadius: 10, overflow: 'hidden', position: 'relative',
                  flexShrink: 0, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 10px rgba(0,0,0,0.40)',
                }}>
                  <Image src={selectedPhotobook.thumbnail} alt={selectedPhotobook.name} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1,
                }}>Photobook</div>
                <h3 style={{
                  fontSize: '0.98rem', fontWeight: 800, color: 'white',
                  margin: 0, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '40vw',
                }}>{selectedPhotobook.name}</h3>
                {selectedPhotobook.senderName && (
                  <p style={{
                    fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.60)',
                    margin: '2px 0 0', display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <i className="bi bi-person-fill" style={{ fontSize: 10 }} />
                    From {selectedPhotobook.senderName}
                  </p>
                )}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: 'white',
                padding: '4px 11px',
                borderRadius: 9999,
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 4px 12px rgba(242,12,143,0.30)',
              }}>
                <i className="bi bi-image" style={{ fontSize: 10 }} />
                {photobookCurrentImageIndex + 1} <span style={{ opacity: 0.6 }}>/</span> {selectedPhotobook.images.length}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => {
                  const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
                  const filename = `${bookName}_${photobookCurrentImageIndex + 1}.jpg`;
                  downloadImage(selectedPhotobook.images[photobookCurrentImageIndex], filename);
                }}
                style={{
                  width: 36, height: 36, padding: 0,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: 10,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(242,12,143,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Download image"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={closePhotobookImageViewer}
                style={{
                  width: 36, height: 36, padding: 0,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: 10,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Close (Esc)"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => photobookCurrentImageIndex > 0 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex - 1)}
            disabled={photobookCurrentImageIndex === 0}
            aria-label="Previous photo"
            style={{
              position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'white',
              cursor: photobookCurrentImageIndex > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: photobookCurrentImageIndex > 0 ? 1 : 0.25,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              if (photobookCurrentImageIndex > 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(242,12,143,0.34)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => photobookCurrentImageIndex < selectedPhotobook.images.length - 1 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex + 1)}
            disabled={photobookCurrentImageIndex === selectedPhotobook.images.length - 1}
            aria-label="Next photo"
            style={{
              position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'white',
              cursor: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 1 : 0.25,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              if (photobookCurrentImageIndex < selectedPhotobook.images.length - 1) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(242,12,143,0.34)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ChevronRightIcon />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '2.5rem 1.5rem 1.25rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {selectedPhotobook.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setPhotobookCurrentImageIndex(index)}
                  style={{
                    position: 'relative', width: '56px', height: '42px', borderRadius: '0.375rem',
                    overflow: 'hidden', border: photobookCurrentImageIndex === index ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                    opacity: photobookCurrentImageIndex === index ? 1 : 0.5,
                    transform: photobookCurrentImageIndex === index ? 'scale(1.1)' : 'scale(1)',
                    background: 'none', padding: 0
                  }}
                  onMouseEnter={(e) => { if (photobookCurrentImageIndex !== index) e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { if (photobookCurrentImageIndex !== index) e.currentTarget.style.opacity = '0.5'; }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live-chat preview drawer - rendered once, fed by chatPreview
          state. Polls the coordinator chats endpoint every 1s and
          renders compact bubbles. */}
      <LiveChatPreviewDrawer
        eventId={chatPreview?.id ?? null}
        eventTitle={chatPreview?.title}
        isOpen={!!chatPreview}
        onClose={() => setChatPreview(null)}
      />
    </>
  );
};


/** One controller for both views, so the classic page (UI_GLASS=off) and the Compact Glass page behave the same. */
const PhotographerEventsPage = () => {
  const ctl = usePhotographerEvents();
  const glass = useUiGlass();
  if (glass) return <GlassEvents ctl={ctl} modals={<EventsModals ctl={ctl} />} />;
  return <><ClassicEventsBody ctl={ctl} /><EventsModals ctl={ctl} /></>;
};

export default PhotographerEventsPage;
