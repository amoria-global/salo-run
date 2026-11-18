'use client';

// The photographer Events page's state, effects and handlers, moved verbatim out of app/pages/photographer/events.tsx
// so the classic page and the Compact Glass page share one source of truth (no behaviour change).

import MoneyInput from '@/app/components/MoneyInput';
import { CURRENCY_FLAG_MAP } from '@/lib/currencyFlag';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { hasActiveStream } from '@/app/lib/streamState';
import Sidebar from '@/app/components/sidebar';
import { platformAlert } from '@/app/components/PlatformAlert';
import EventConfirmModal from '@/app/components/EventConfirmModal';
import EventQrWizard from '@/app/components/EventQrWizard';
import Topbar from '@/app/components/topbar';
import Image from 'next/image';
import { useTheme } from '@/app/context/ThemeContext';
import StandaloneAlbumRestore from '@/app/components/StandaloneAlbumRestore';
import { EmptyResult, EventRowShell, EventsCalendar, EventsToolbar, GroupedEvents, SectionTabsBar, type CalendarMode, type EventsLayout } from '@/app/components/events/EventsBrowser';
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
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/lib/usePermissions';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import HostEntryTiles from '@/app/components/HostEntryTiles';
import { useHostEntry } from '@/app/components/useHostEntry';
import { getPlatformConfig } from '@/lib/platformConfig';
import HostLivePage from '@/app/components/live/HostLivePage';
import AlbumTypeSelector, { type AlbumType } from '@/app/components/AlbumTypeSelector';
import PaidAlbumForm, { paidAlbumPriceError } from '@/app/components/PaidAlbumForm';
import { priceError, usePaymentLimit } from '@/lib/paymentLimits';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';
import FreeAlbumForm from '@/app/components/FreeAlbumForm';
import SendFreeInvitationModal from '@/app/components/SendFreeInvitationModal';
import ContentAlbumsTab from '@/app/pages/photographer/ContentAlbumsTab';
import { useRouter } from 'next/navigation';
import GetStartedModal from '@/app/components/events/GetStartedModal';
import SellChooserModal from '@/app/components/events/SellChooserModal';
import NewPhotobookModal from '@/app/components/events/NewPhotobookModal';
import { useGetStarted } from '@/app/lib/useGetStarted';
import { CREATE_LABEL } from '@/app/lib/getStarted';
import LiveChatPreviewDrawer from '@/app/components/LiveChatPreviewDrawer';
import PhotographerOpportunitiesView from '@/app/components/hybrid/PhotographerOpportunitiesView';
import { AlbumShareCard } from '@/app/components/albums/AlbumShareCard';
import { FieldError, invalidFieldProps, invalidFieldStyle } from '@/app/components/errors/FieldError';
import {
  describePublishFailure, LISTING_NOTE, notVisibleBadge, outcomeFromIndexing, publishOutcome, sellFieldErrors, SELL_FORM_NOTE, SELL_SUBTITLE,
  type PublishOutcome, type SellField,
} from '@/app/../lib/albums/sellPhotos';
import { albumShareUrl } from '@/lib/albums/albumShare';


import { SearchIcon, CloseIcon, CalendarIcon, ClockIcon, LocationIcon, UserIcon, PackageIcon, BroadcastIcon, PlayIcon, StopIcon, CopyIcon, EyeIcon, EyeOffIcon, HeartIcon, DownloadIcon, ShareIcon, SendIcon, ImageIcon, EditIcon, TrashIcon, GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CheckCircleIcon, WhatsAppIcon, FacebookIcon, TwitterIcon, EmailIcon, LinkIcon, QRCodeIcon, ServerIcon, PlusIcon, FaceRecognitionIcon, InviteCodeIcon, EventsViewIcon, AlbumsViewIcon, PhotobooksViewIcon } from './icons';

export type EventStatus = 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface AssignedEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: { address: string; city: string; country: string };
  coverImage: string;
  status: EventStatus;
  clientName: string;
  clientImage: string;
  clientEmail: string;
  organizerName: string;
  packageName: string;
  packageId: string;
  hasLiveStream: boolean;
  streamStatus?: string;
  isPublished: boolean;
  guestCount: number;
  maxGuests: number;
  bookingId: string;
  bookingStatus?: string;
  escrowPercentage?: number;
  totalAmount: number;
  createdAt: string;
}

export interface StreamConfig {
  eventId: string;
  whipUrl?: string;
  whepUrl?: string;
  connectionStatus: 'disconnected' | 'connected' | 'paused' | 'ended';
  streamHealth: 'good' | 'fair' | 'poor';
  uploadSpeed: string;
  viewerCount: number;
  peakViewers: number;
  inviteToken?: string;
  streamType?: 'entry_fee' | 'invite_token';
  error?: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  category: string;
  eventId: string;
  eventTitle: string;
  clientId: string;
  clientName: string;
  coverImage: string;
  images: string[];
  photoCount: number;
  views: number;
  likes: number;
  downloads: number;
  shared: boolean;
  sharedWithClient: boolean;
  faceRecognitionEnabled: boolean;
  inviteCode: string | null;
  createdAt: string;
  eventDate: string;
  clientImage: string;
  sentAt: string;
  expiresAt: string;
  albumType?: 'event' | 'standalone';
  isStandalone?: boolean;
  /** Archived: locked after its access ran out. The photographer keeps read-only access and can restore it. */
  isLocked?: boolean;
  lockedAt?: string | null;
  // Standalone free-album fields. recipientEmail is the email captured at
  // album creation (already auto-sent then); "Send" on these is a Resend
  // via POST /albums/{id}/send-free. no event/eventId needed.
  isFreeAlbum?: boolean;
  recipientEmail?: string;
  accessCode?: string;
  location?: string;
  albumDate?: string;
}


// View Toggle Icons

export function usePhotographerEvents() {
  const { colors, actualTheme } = useTheme();
  const { user, token } = useDashboardAuth();
  const { formatPrice, currencies } = useCurrency();
  const { hasPermission } = usePermissions();
  // Owner = implicit all-perms; restricted team members (Editor / Support)
  // see the events list but can't fire Create Album / send to client.
  // Add more permission flags here when wrapping additional buttons.
  const canCreateEvents = hasPermission('events.create');
  const apiUrl = getApiUrl();

  // Offered only when the server says this account can host its own events, so with the feature off nothing shows.
  const { canHost, caption: hostedCaption } = useHostEntry();

  // Live-chat preview drawer state. Set to {id, title} when the
  // photographer clicks the 'Chat' chip on a LIVE event card; drawer
  // closes by setting back to null. Single instance shared across
  // every card so we never mount two pollers.
  const [chatPreview, setChatPreview] = useState<{ id: string; title: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'events' | 'opportunities' | 'albums' | 'photobooks' | 'content'>(() => {
    if (typeof window !== 'undefined') {
      // Query param takes priority (e.g. from notification click)
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get('tab');
      if (qTab === 'opportunities' || qTab === 'albums' || qTab === 'photobooks' || qTab === 'events' || qTab === 'content') {
        window.history.replaceState({}, '', window.location.pathname);
        return qTab;
      }
      // Otherwise restore from localStorage
      const saved = localStorage.getItem('connekt_events_tab');
      if (saved === 'events' || saved === 'opportunities' || saved === 'albums' || saved === 'photobooks' || saved === 'content') return saved;
    }
    return 'events';
  });
  useEffect(() => {
    localStorage.setItem('connekt_events_tab', activeTab);
  }, [activeTab]);
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [showNewPhotobook, setShowNewPhotobook] = useState(false);
  const [photobooksReload, setPhotobooksReload] = useState(0);
  const router = useRouter();
  const getStarted = useGetStarted({ role: 'photographer', canHost, canCreate: canCreateEvents, listLoaded: eventsLoaded, hasItems: events.length > 0 });
  const highlightId = useHighlightOnMount();
  const highlightCardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (highlightId && highlightCardRef.current) {
      highlightCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, events.length]);
  const [eventFilter, setEventFilter] = useState<StatusFilter>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventDate, setEventDate] = useState<DateFilter>(null);
  const [eventsLayout, setEventsLayoutState] = useState<EventsLayout>(webSession.layout);
  const [calMode, setCalModeState] = useState<CalendarMode>(webSession.calMode);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const setEventsLayout = (l: EventsLayout) => {
    webSession.layout = l;
    setEventsLayoutState(l);
    // Back to the list means no date filter at all.
    if (l === 'list') setEventDate(null);
  };
  const setCalMode = (m: CalendarMode) => {
    webSession.calMode = m;
    setCalModeState(m);
  };
  const [selectedEvent, setSelectedEvent] = useState<AssignedEvent | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showStreamPreview, setShowStreamPreview] = useState(false);
  const [showUnpublishedModal, setShowUnpublishedModal] = useState(false);
  const [qrEvent, setQrEvent] = useState<{ id: string; title: string } | null>(null);
  const [streamConfigs, setStreamConfigs] = useState<Record<string, StreamConfig>>({});
  const [copiedField, setCopiedField] = useState('');
  const [markCompleteTarget, setMarkCompleteTarget] = useState<AssignedEvent | null>(null);
  const [markingCompletedId, setMarkingCompletedId] = useState<string | null>(null);
  const [bookingActionTarget, setBookingActionTarget] = useState<AssignedEvent | null>(null);
  const [bookingActionType, setBookingActionType] = useState<'accept' | 'decline' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumFilter, setAlbumFilter] = useState<'all' | 'shared' | 'unshared'>('all');
  const [albumSearch, setAlbumSearch] = useState('');
  const [albumViewMode, setAlbumViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [createAlbumMode, setCreateAlbumMode] = useState<'event' | 'standalone'>('event');
  const [createAlbumEventId, setCreateAlbumEventId] = useState('');
  const [standaloneLocation, setStandaloneLocation] = useState('');
  const [standaloneDate, setStandaloneDate] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumCategory, setAlbumCategory] = useState('');
  // File[] (not FileList) so subsequent uploads can APPEND. The native
  // FileList off an <input type=file> is a static snapshot of the most
  // recent selection — assigning it directly threw away anything the
  // viewer picked before, which is why re-clicking "Upload" wiped the
  // earlier picks instead of stacking them.
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [showAlbumBrowseModal, setShowAlbumBrowseModal] = useState(false);
  const [showAlbumEditModal, setShowAlbumEditModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFaceRecognitionModal, setShowFaceRecognitionModal] = useState(false);
  const [faceAIPrice, setFaceAIPrice] = useState('');
  const [faceAICurrency, setFaceAICurrency] = useState('');
  const [showFaceAICurrencyDropdown, setShowFaceAICurrencyDropdown] = useState(false);
  const faceAICurrencyRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [showAlbumSuccessModal, setShowAlbumSuccessModal] = useState(false);
  // `status` drives the icon/tone/eyebrow of the result modal. without it
  // failure messages get the green "Success" check (see the failed-send
  // screenshot before this fix).
  const [albumSuccessMessage, setAlbumSuccessMessage] = useState<{
    title: string;
    description: string;
    status?: 'success' | 'error';
  }>({ title: '', description: '', status: 'success' });
  // Soft delete (dismiss) state
  const [showDismissEventModal, setShowDismissEventModal] = useState(false);
  const [eventToDismiss, setEventToDismiss] = useState<AssignedEvent | null>(null);
  const [showDismissAlbumModal, setShowDismissAlbumModal] = useState(false);
  const [albumToDismiss, setAlbumToDismiss] = useState<Album | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<Album | null>(null);
  const [restoreAlbum, setRestoreAlbum] = useState<Album | null>(null);
  const [albumsReload, setAlbumsReload] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editCoverIndex, setEditCoverIndex] = useState(0);
  const [isUploadingAlbum, setIsUploadingAlbum] = useState(false);
  // PAID/FREE standalone album states
  const [standaloneAlbumType, setStandaloneAlbumType] = useState<AlbumType>('PAID');
  const [paidAlbumPrice, setPaidAlbumPrice] = useState('');
  const [paidAlbumCurrencyId, setPaidAlbumCurrencyId] = useState('');
  const paidAlbumCurrencyCode = currencies.find(c => c.code === paidAlbumCurrencyId || (c.id || c.code) === paidAlbumCurrencyId)?.code || '';
  const paidAlbumPriceMsg = paidAlbumPriceError(paidAlbumPrice, paidAlbumCurrencyCode);
  // Find-My-Photos price: judged in its own currency, same minimum the server enforces.
  const faceAICurrencyCode = currencies.find(c => (c.id || c.code) === faceAICurrency)?.code;
  const faceAILimit = usePaymentLimit(faceAICurrencyCode);
  const faceAIMsg = faceAIPrice ? priceError(faceAIPrice, faceAILimit) : null;
  const [freeAlbumEmail, setFreeAlbumEmail] = useState('');
  // Optional free-album download cap + price per extra image (blank = all free).
  // freeExtraCurrencyId required by the backend when freeExtraPrice > 0 so
  // the client cap+pay flow on knockout knows what to charge in. Defaults to
  // whatever was last picked for the paid-album form so the photographer
  // doesn't have to re-select on every album.
  const [freeMaxDownloads, setFreeMaxDownloads] = useState('');
  const [freeExtraPrice, setFreeExtraPrice] = useState('');
  const [freeExtraCurrencyId, setFreeExtraCurrencyId] = useState('');
  const [showSendFreeInvitationModal, setShowSendFreeInvitationModal] = useState(false);
  const [freeAlbumToSend, setFreeAlbumToSend] = useState<{ albumId: string; title: string; email: string; accessCode: string } | null>(null);
  const [albumSuccessModal, setAlbumSuccessModal] = useState<{ type: 'paid' | 'free'; albumId?: string; title: string; inviteCode?: string; email?: string; accessCode?: string; photoCount: number; rejected?: string[]; outcome?: PublishOutcome; price?: string; currencyId?: string } | null>(null);
  // "Sell photos" presets the album form to a standalone PAID album, which is what Find my photos lists.
  const [sellPreset, setSellPreset] = useState(false);
  // Every Sell photos entry opens this chooser first; the album forms open from its two options.
  const [showSellChooser, setShowSellChooser] = useState(false);
  const [contentCreateSignal, setContentCreateSignal] = useState(0);
  const [sellErrors, setSellErrors] = useState<Partial<Record<SellField, string>>>({});
  const [retryingPublish, setRetryingPublish] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // Tracks which album card's Copy Link button just flashed "Copied" —
  // null when no flash active. Per-card so two adjacent cards don't
  // both light up green when only one was clicked.
  const [cardLinkCopiedId, setCardLinkCopiedId] = useState<string | null>(null);

  // Clipboard helper used by the album-success modal's Copy code +
  // Copy link buttons. Tries the modern API, falls back to the legacy
  // textarea trick on browsers where the Clipboard API is gated (e.g.
  // http dev, sandboxed contexts), and to window.prompt as a last
  // resort so the user can always copy something.
  const copyToClipboard = (value: string, onSuccess: () => void) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(onSuccess).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove();
          onSuccess();
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        onSuccess();
      }
    } catch {
      window.prompt('Copy this:', value);
    }
  };

  // Build the buyer-facing share URL for an album card. Matches the
  // exact URL the invitation email uses (MailService.java) and the
  // album-create success modal's Copy Album Link button:
  //   paid : /user/find-my-photos?code=<inviteCode>
  //   free : /user/find-my-photos?code=<accessCode>
  //   event-linked albums use ?code=<inviteCode> too once Face AI is on
  // The recipient's email used to ride along on the free variant. It was
  // never a second factor — the code is the secret, and the server holds
  // the address it was checked against — but it put a real person's email
  // into browser history, referrer headers and every chat the link was
  // pasted into. The code alone now identifies the recipient.
  // Returns null when the album doesn't have the required pieces yet —
  // the card hides the Copy Link button entirely in that case so it
  // never offers a broken link.
  const buildAlbumLink = (album: Album): string | null => albumShareUrl(album);

  const [uploadProgress, setUploadProgress] = useState('');
  const [mediaIdMap, setMediaIdMap] = useState<Record<string, string>>({});

  // Photobooks state
  interface Photobook {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    images: string[];
    mediaIds?: string[];
    layout: string;
    createdAt: string;
    sentAt: string;
    senderName: string;
    status?: string;
    freePhotosLimit?: number;
    extraPhotosCount?: number;
    extraPhotosAmount?: number;
    photographerName?: string;
    resubmittedAt?: string;
  }
  const [receivedPhotobooks, setReceivedPhotobooks] = useState<Photobook[]>([]);
  const [photobookSearch, setPhotobookSearch] = useState('');
  const [selectedPhotobook, setSelectedPhotobook] = useState<Photobook | null>(null);
  // Phase 1: Grid browse with select mode
  const [showPhotobookBrowse, setShowPhotobookBrowse] = useState(false);
  const [photobookSelectedImages, setPhotobookSelectedImages] = useState<string[]>([]);
  const [isPhotobookSelectMode, setIsPhotobookSelectMode] = useState(false);
  // Phase 2: Full-screen single image viewer
  const [showPhotobookImageViewer, setShowPhotobookImageViewer] = useState(false);
  const [photobookCurrentImageIndex, setPhotobookCurrentImageIndex] = useState(0);
  const [showDeletePhotobookModal, setShowDeletePhotobookModal] = useState(false);
  const [photobookToDelete, setPhotobookToDelete] = useState<Photobook | null>(null);
  const [photobookToResubmit, setPhotobookToResubmit] = useState<Photobook | null>(null);
  const [isResubmittingPhotobook, setIsResubmittingPhotobook] = useState(false);

  const handleDeletePhotobook = async () => {
    if (!photobookToDelete) return;
    const id = photobookToDelete.id;
    setReceivedPhotobooks(prev => prev.filter(pb => pb.id !== id));
    setShowDeletePhotobookModal(false);
    setPhotobookToDelete(null);
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/photobooks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete photobook:', err);
    }
  };

  const handleResubmitPhotobook = async (photobook: Photobook) => {
    if (!photobook) return;
    setIsResubmittingPhotobook(true);
    setReceivedPhotobooks(prev => prev.map(pb =>
      pb.id === photobook.id ? { ...pb, status: 'RESUBMITTED', resubmittedAt: new Date().toISOString() } : pb
    ));
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/photobooks/${photobook.id}/resubmit`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to resubmit photobook:', err);
    } finally {
      setIsResubmittingPhotobook(false);
      setPhotobookToResubmit(null);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(url, '_blank');
    }
  };

  const downloadAllImages = async (photobook: Photobook) => {
    for (let i = 0; i < photobook.images.length; i++) {
      await downloadImage(photobook.images[i], `${photobook.name.replace(/\s+/g, '_')}_${i + 1}.jpg`);
    }
  };

  const openPhotobookBrowse = (photobook: Photobook) => {
    setSelectedPhotobook(photobook);
    setPhotobookSelectedImages([]);
    setIsPhotobookSelectMode(false);
    setShowPhotobookBrowse(true);
  };

  const closePhotobookBrowse = () => {
    setShowPhotobookBrowse(false);
    setSelectedPhotobook(null);
    setPhotobookSelectedImages([]);
    setIsPhotobookSelectMode(false);
  };

  const openPhotobookImageViewer = (photobook: Photobook, startIndex: number = 0) => {
    setSelectedPhotobook(photobook);
    setPhotobookCurrentImageIndex(startIndex);
    setShowPhotobookImageViewer(true);
    setShowPhotobookBrowse(false);
  };

  const closePhotobookImageViewer = () => {
    setShowPhotobookImageViewer(false);
    if (selectedPhotobook) {
      setShowPhotobookBrowse(true);
    }
    setPhotobookCurrentImageIndex(0);
  };

  const handlePhotobookBulkDownload = async () => {
    if (selectedPhotobook && photobookSelectedImages.length > 0) {
      const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
      for (let i = 0; i < photobookSelectedImages.length; i++) {
        const image = photobookSelectedImages[i];
        const imageIndex = selectedPhotobook.images.indexOf(image);
        const filename = `${bookName}_${imageIndex + 1}.jpg`;
        await downloadImage(image, filename);
        if (i < photobookSelectedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  const normalizeImg = (url: string | undefined | null): string | undefined => {
    if (!url || url === 'null' || url.endsWith('/null')) return undefined;
    let u = url;
    // If it's a bare filename (no slashes, no protocol), construct full URL
    if (!u.includes('/') && !u.startsWith('http')) {
      u = `${getApiUrl()}/uploads/profile/photos/${u}`;
    }
    return normalizeImageUrl(u);
  };

  // Single source of truth for turning a raw API album payload into the
  // Album shape used in state. Used by both the initial list fetch AND the
  // post-create refetch so freshly-created albums are byte-for-byte
  // identical to reloaded ones (and edit/face-AI flows don't misbehave on
  // a half-populated locally-built newAlbum).
  const mapApiAlbum = (a: any): { album: Album; imageIds: Record<string, string> } => {
    const imageIds: Record<string, string> = {};
    (a?.images || []).forEach((img: any) => {
      if (img && typeof img === 'object' && img.id) {
        const u = normalizeImg(img.fileUrl || img.url || '');
        if (u) imageIds[u] = img.id;
      }
    });
    const album: Album = {
      id: a.id,
      title: a.title || '',
      description: a.description || '',
      category: a.category || '',
      eventId: a.eventId || '',
      eventTitle: a.eventTitle || '',
      clientId: a.clientId || '',
      clientName: a.clientName || '',
      coverImage: normalizeImg(a.coverImage || a.thumbnail) || '',
      images: (a.images || []).map((img: any) => normalizeImg(typeof img === 'string' ? img : img?.fileUrl || img?.url || '') || '').filter(Boolean),
      photoCount: a.photoCount || a.imageCount || 0,
      views: a.views || 0,
      likes: a.likes || 0,
      downloads: a.downloads || 0,
      shared: a.shared || a.sent || false,
      sharedWithClient: a.sharedWithClient || a.sent || false,
      faceRecognitionEnabled: a.faceRecognitionEnabled || false,
      inviteCode: a.inviteCode || null,
      createdAt: a.createdAt || '',
      eventDate: a.eventDate || a.date || '',
      clientImage: normalizeImg(a.clientImage) || '',
      sentAt: a.sentAt || a.deliveredAt || '',
      expiresAt: a.expiresAt || '',
      albumType: a.albumType || (a.isStandalone ? 'standalone' : 'event'),
      isStandalone: a.isStandalone || a.albumType === 'standalone' || a.albumType === 'free' || a.albumType === 'paid' || false,
      isFreeAlbum: a.freeAlbum || a.isFreeAlbum || a.albumType === 'free' || false,
      recipientEmail: a.recipientEmail || '',
      accessCode: a.accessCode || '',
      location: a.location || '',
      albumDate: a.albumDate || '',
      isLocked: a.isLocked === true,
      lockedAt: a.lockedAt || null,
    };
    return { album, imageIds };
  };

  // Fetch events from API
  useEffect(() => {
    if (!user?.id) return;
    const loadEvents = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events?page=0&size=100`);
        if (res.ok) {
          const result = await res.json();
          const data = Array.isArray(result?.data) ? result.data : result?.data?.content || [];
          if (data.length > 0) {
            const mapped: AssignedEvent[] = data.map((e: any) => ({
              id: e.id,
              title: e.title || '',
              description: e.description || '',
              eventType: (typeof e.eventType === 'object' && e.eventType !== null ? (e.eventType as Record<string, unknown>).name as string : e.eventType)
                || (typeof e.eventCategory === 'object' && e.eventCategory !== null ? (e.eventCategory as Record<string, unknown>).name as string : e.eventCategory)
                || (typeof e.category === 'object' && e.category !== null ? (e.category as Record<string, unknown>).name as string : e.category)
                || '',
              category: (typeof e.eventCategory === 'object' && e.eventCategory !== null ? (e.eventCategory as Record<string, unknown>).name as string : e.eventCategory)
                || (typeof e.category === 'object' && e.category !== null ? (e.category as Record<string, unknown>).name as string : e.category)
                || (typeof e.eventType === 'object' && e.eventType !== null ? (e.eventType as Record<string, unknown>).name as string : e.eventType)
                || '',
              date: e.date || '',
              startTime: e.startTime || '',
              endTime: e.endTime || '',
              duration: '',
              location: e.location || { address: '', city: '', country: '' },
              coverImage: normalizeImg(e.coverImage || e.bannerImage) || '',
              status: (() => {
                switch ((e.eventStatus || e.status || '')?.toUpperCase()) {
                  case 'PENDING': case 'PROPOSED': case 'ASSIGNED': return 'pending';
                  case 'UPCOMING': case 'PUBLISHED': return 'upcoming';
                  case 'ONGOING': case 'IN_PROGRESS': return 'ongoing';
                  case 'COMPLETED': case 'DONE': return 'completed';
                  case 'CANCELLED': case 'CANCELED': return 'cancelled';
                  default: return 'upcoming';
                }
              })() as EventStatus,
              clientName: e.clientName || '',
              clientImage: normalizeImg(e.clientImage) || '',
              clientEmail: e.clientEmail || '',
              organizerName: e.organizerName || '',
              packageName: e.packageName || '',
              packageId: e.packageId || '',
              // A stream can exist on an event whose package has no live-stream
              // flag (free events). Keep the flag for the entitlement, and carry
              // the real stream state so the card never hides a running stream.
              hasLiveStream: e.hasLiveStream || hasActiveStream(e.streamStatus) || false,
              streamStatus: e.streamStatus || '',
              isPublished: e.isPublished === true || e.eventStatus === 'PUBLISHED' || e.isEventPublished === true || false,
              guestCount: e.guestCount || 0,
              maxGuests: e.maxGuests || 0,
              bookingId: e.bookingId || e.id,
              bookingStatus: e.bookingStatus || '',
              escrowPercentage: e.escrowPercentage || 50,
              totalAmount: e.totalAmount || 0,
              createdAt: e.createdAt || '',
            }));
            // Enrich isPublished from public events (photographer DTO may omit it)
            try {
              const pubRes = await fetch(`${apiUrl}/api/remote/public/events/list?size=100`);
              if (pubRes.ok) {
                const pubResult = await pubRes.json();
                const pubEvents = pubResult?.data?.content || pubResult?.data || [];
                const publishedIds = new Set(pubEvents.filter((pe: any) => pe.isPublished).map((pe: any) => pe.id));
                mapped.forEach(ev => { if (publishedIds.has(ev.id)) ev.isPublished = true; });
              }
            } catch { /* ignore */ }
            // Newest-created first. ISO timestamps include milliseconds so ties
            // inside the same second break naturally by ms precision.
            mapped.sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            });
            setEvents(mapped);
          } else {
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      } finally {
        setEventsLoaded(true);
      }
    };
    loadEvents();
  }, [user?.id, apiUrl]);

  // Deep-link from the event-detail page: ?event=<id>&action=createAlbum|stream
  // auto-opens the matching flow once events have loaded, then clears the query
  // so a refresh doesn't re-trigger it.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || events.length === 0) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const evId = params.get('event');
    const action = params.get('action');
    if (!evId || !action) return;
    const ev = events.find(e => e.id === evId);
    if (!ev) return;
    deepLinkHandled.current = true;
    if (action === 'createAlbum') {
      handleOpenCreateAlbum(ev.id);
    } else if (action === 'stream') {
      setSelectedEvent(ev);
      if (!ev.isPublished) setShowUnpublishedModal(true);
      else setShowStreamPreview(true);
    }
    try { window.history.replaceState(null, '', '/user/photographer/events'); } catch { /* no-op */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // Fetch albums from API (galleries)
  useEffect(() => {
    if (!user?.id) return;
    const loadAlbums = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums`);
        const result = await res.json();
        if (res.ok) {
          const data = Array.isArray(result?.data) ? result.data : result?.data?.content || [];
          if (data.length > 0) {
            // Single mapping pass. collects the Album rows AND the
            // url→imageId entries the edit/delete flow needs.
            const idMap: Record<string, string> = {};
            const mapped: Album[] = data.map((a: any) => {
              const { album, imageIds } = mapApiAlbum(a);
              Object.assign(idMap, imageIds);
              return album;
            });
            setMediaIdMap(prev => ({ ...prev, ...idMap }));
            // Newest-created first. Ties break by ms inside the ISO timestamp.
            mapped.sort((a: Album, b: Album) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            });
            setAlbums(mapped);
          } else {
            setAlbums([]);
          }
        } else {
          setAlbums([]);
        }
      } catch {
        setAlbums([]);
      }
    };
    loadAlbums();
  }, [user?.id, apiUrl, albumsReload]);

  // Fetch received photobooks
  useEffect(() => {
    if (!user?.id) return;
    const loadPhotobooks = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/photobooks`);
        if (res.ok) {
          const result = await res.json();
          const items = result?.data?.content || result?.data || [];
          if (Array.isArray(items)) {
            setReceivedPhotobooks(items.map((pb: any) => {
              const mediaItems = pb.mediaItems || pb.images || [];
              return {
                id: pb.id || '',
                name: pb.name || pb.title || '',
                description: pb.description || '',
                thumbnail: normalizeImg(pb.coverImage || pb.thumbnail) || '',
                images: mediaItems.map((img: any) => typeof img === 'string' ? normalizeImg(img) || '' : normalizeImg(img?.fileUrl || img?.url || '') || '').filter(Boolean),
                mediaIds: mediaItems.map((img: any) => typeof img === 'object' ? img?.id || '' : '').filter(Boolean),
                layout: pb.layout || '',
                createdAt: pb.createdAt || '',
                sentAt: pb.sentAt || '',
                senderName: pb.senderName || pb.clientName || pb.coordinatorName || '',
                status: pb.status || 'SENT_TO_PHOTOGRAPHER',
                freePhotosLimit: pb.freePhotosLimit,
                extraPhotosCount: pb.extraPhotosCount || 0,
                extraPhotosAmount: pb.extraPhotosAmount || 0,
                resubmittedAt: pb.resubmittedAt || '',
              };
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch photobooks:', err);
      }
    };
    loadPhotobooks();
  }, [user?.id, apiUrl, photobooksReload]);

  // Fetch stream configs for events with live stream
  useEffect(() => {
    if (events.length === 0) return;
    const loadStreamConfigs = async () => {
      const configs: Record<string, StreamConfig> = {};
      for (const event of events.filter(e => e.hasLiveStream)) {
        try {
          const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${event.id}/stream/config`);
          if (res.ok) {
            const result = await res.json();
            if (result?.data) {
              const cfg = result.data;
              const connStatus: string = cfg.connectionStatus || 'disconnected';
              // Also fetch public event for playbackUrl and streamType
              let hlsUrl = '';
              let streamType = '';
              try {
                const pubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/public/events/${event.id}`);
                if (pubRes.ok) {
                  const pubData = await pubRes.json();
                  hlsUrl = pubData.data?.hlsManifestUrl || '';
                  streamType = pubData.data?.streamType || '';
                  // Construct HLS URL from liveInputId if hlsManifestUrl is missing
                  if (!hlsUrl && pubData.data?.liveInputId) {
                    hlsUrl = `https://customer-ngk2huwatflljurq.cloudflarestream.com/${pubData.data.liveInputId}/manifest/video.m3u8`;
                  }
                }
              } catch { /* ignore */ }
              configs[event.id] = {
                ...cfg,
                connectionStatus: connStatus as StreamConfig['connectionStatus'],
                playbackUrl: hlsUrl || cfg.hlsManifestUrl || '',
                streamType: (streamType || '') as StreamConfig['streamType'],
              };
            }
          }
        } catch { /* use default */ }
      }
      if (Object.keys(configs).length > 0) {
        setStreamConfigs(prev => ({ ...prev, ...configs }));
      } else {
        setStreamConfigs({});
      }
    };
    loadStreamConfigs();
  }, [events, apiUrl]);

  // Close face AI currency dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (faceAICurrencyRef.current && !faceAICurrencyRef.current.contains(e.target as Node)) {
        setShowFaceAICurrencyDropdown(false);
      }
    };
    if (showFaceAICurrencyDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFaceAICurrencyDropdown]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (time: string) => { const [h, m] = time.split(':'); const hour = parseInt(h); return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`; };

  const getStatusBadge = (status: EventStatus) => {
    const map: Record<EventStatus, { bg: string; color: string; label: string }> = {
      pending: { bg: actualTheme === 'dark' ? '#312E81' : '#EDE9FE', color: actualTheme === 'dark' ? '#A78BFA' : '#7C3AED', label: 'Pending Approval' },
      upcoming: { bg: actualTheme === 'dark' ? '#78350F' : '#c29c04', color: actualTheme === 'dark' ? '#FBBF24' : '#FFFFFF', label: 'Upcoming' },
      ongoing: { bg: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE', color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB', label: 'Ongoing' },
      completed: { bg: actualTheme === 'dark' ? '#064E3B' : '#D1FAE5', color: actualTheme === 'dark' ? '#34D399' : '#059669', label: 'Completed' },
      cancelled: { bg: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2', color: actualTheme === 'dark' ? '#F87171' : '#DC2626', label: 'Cancelled' },
    };
    return map[status];
  };

  // Opens the Face AI modal, generating the invite code from the API if one doesn't exist yet
  const handleOpenFaceAI = async (album: Album) => {
    let updated = album;
    if (!album.inviteCode) {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${album.id}/invite-code`, { method: 'POST' });
        if (res.ok) {
          const result = await res.json();
          const code = result?.data?.inviteCode || result?.data?.code || result?.data;
          if (code && typeof code === 'string') {
            updated = { ...album, inviteCode: code, faceRecognitionEnabled: album.faceRecognitionEnabled };
          }
        }
      } catch (err) {
        console.error('Failed to generate invite code:', err);
      }
      if (updated.inviteCode) {
        setAlbums(prev => prev.map(a => a.id === album.id ? updated : a));
      }
    }
    setSelectedAlbum(updated);
    setShowFaceRecognitionModal(true);
    setFaceAIPrice('');
    setFaceAICurrency('');
    setShowFaceAICurrencyDropdown(false);
  };

  const handleCopyField = (text: string, field: string) => { navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(''), 2000); };
  const handleCopyLink = (text: string) => { navigator.clipboard.writeText(text); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
  const handleCopyInviteCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedInviteCode(true); setTimeout(() => setCopiedInviteCode(false), 2000); };

  const handleStartStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/start`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to start stream. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: msg } }));
        return;
      }
      const startData = await res.json().catch(() => ({}));
      const sData = startData.data || startData;
      const whipUrlVal = sData.whipUrl || '';
      const whepUrlVal = sData.whepUrl || '';
      const inviteToken = sData.inviteToken || '';
      const connStatus = sData.connectionStatus || 'disconnected';

      if (whipUrlVal) {
        setStreamConfigs(prev => ({
          ...prev,
          [eventId]: {
            ...prev[eventId],
            eventId,
            whipUrl: whipUrlVal,
            whepUrl: whepUrlVal,
            connectionStatus: connStatus as StreamConfig['connectionStatus'],
            streamHealth: 'unknown' as StreamConfig['streamHealth'],
            uploadSpeed: '0 Mbps',
            viewerCount: 0,
            peakViewers: 0,
            inviteToken,
          }
        }));
      } else {
        // Fallback: fetch from /stream/config
        const configRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          const cfg = configData.data || {};
          setStreamConfigs(prev => ({
            ...prev,
            [eventId]: {
              ...prev[eventId],
              eventId,
              whipUrl: cfg.whipUrl || '',
              whepUrl: cfg.whepUrl || '',
              connectionStatus: (cfg.connectionStatus || 'disconnected') as StreamConfig['connectionStatus'],
              streamHealth: cfg.streamHealth || 'unknown',
              uploadSpeed: cfg.uploadSpeed || '0 Mbps',
              viewerCount: cfg.viewerCount || 0,
              peakViewers: cfg.peakViewers || 0,
              inviteToken: cfg.inviteToken || '',
            }
          }));
        }
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: 'Failed to start stream. Please try again.' } }));
    }
  };

  const handleResumeStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'connected', error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/resume`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to go live. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: msg } }));
      } else {
        const data = await res.json().catch(() => ({}));
        const rData = data.data || data;
        if (rData.inviteToken) {
          setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], inviteToken: rData.inviteToken } }));
        }
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'ongoing' as EventStatus } : e));
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: 'Failed to go live. Please try again.' } }));
    }
  };

  const handlePauseStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/pause`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to pause stream. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: msg } }));
      } else {
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'paused' } }));
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: 'Failed to pause stream. Please try again.' } }));
    }
  };

  const handleEndStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/stop`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to end stream. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: msg } }));
      } else {
        // Stream permanently ended. credentials cleared by backend
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'ended', serverUrl: undefined, streamKey: undefined } }));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' as EventStatus } : e));
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: 'Failed to end stream. Please try again.' } }));
    }
  };

  const handleResetStream = async (eventId: string) => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const sData = data.data || data;
        setStreamConfigs(prev => ({
          ...prev,
          [eventId]: {
            ...prev[eventId],
            eventId,
            whipUrl: sData.whipUrl || '',
            whepUrl: sData.whepUrl || '',
            connectionStatus: 'disconnected',
            streamHealth: 'unknown' as StreamConfig['streamHealth'],
            uploadSpeed: '0 Mbps',
            viewerCount: 0,
            peakViewers: 0,
            error: undefined,
          }
        }));
      } else {
        const err = await res.json().catch(() => ({}));
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: err.message || 'Failed to reset stream.' } }));
      }
    } catch {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: 'Failed to reset stream. Please try again.' } }));
    }
  };

  // Poll stream config every 5s when stream preview or setup modal is open
  useEffect(() => {
    if (!selectedEvent) return;
    if (!showStreamPreview) return;
    const eventId = selectedEvent.id;
    const poll = async () => {
      try {
        // Fetch stream config for RTMP credentials + connection status
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/config`);
        if (res.ok) {
          const data = await res.json();
          const cfg = data.data;
          if (cfg) {
            const connStatus: string = cfg.connectionStatus || 'disconnected';
            // Fetch public event for whepUrl and streamType
            let pubStreamType = '';
            let pubWhepUrl = '';
            try {
              const pubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/public/events/${eventId}`);
              if (pubRes.ok) {
                const pubData = await pubRes.json();
                pubStreamType = pubData.data?.streamType || '';
                pubWhepUrl = pubData.data?.whepUrl || '';
              }
            } catch { /* ignore */ }
            setStreamConfigs(prev => ({
              ...prev,
              [eventId]: {
                ...prev[eventId],
                eventId,
                whipUrl: cfg.whipUrl || prev[eventId]?.whipUrl || '',
                whepUrl: cfg.whepUrl || pubWhepUrl || prev[eventId]?.whepUrl || '',
                connectionStatus: connStatus as StreamConfig['connectionStatus'],
                streamHealth: cfg.streamHealth || 'unknown',
                uploadSpeed: cfg.uploadSpeed || '0 Mbps',
                viewerCount: cfg.viewerCount || 0,
                peakViewers: cfg.peakViewers || 0,
                inviteToken: cfg.inviteToken || prev[eventId]?.inviteToken || '',
                streamType: (pubStreamType || prev[eventId]?.streamType || '') as StreamConfig['streamType'],
              }
            }));
          }
        }
      } catch { /* ignore polling errors */ }
    };
    poll(); // Run immediately
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent, showStreamPreview, apiUrl]);

  const handleMarkCompleted = async (eventId: string) => {
    setMarkingCompletedId(eventId);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/mark-completed`, { method: 'POST' });
      if (res.ok) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' as EventStatus } : e));
      } else {
        const data = await res.json().catch(() => ({}));
        platformAlert(data.message || 'Failed to mark event as completed. Please try again.');
      }
    } catch (err) {
      platformAlert('Failed to mark event as completed. Please try again.');
    } finally {
      setMarkingCompletedId(null);
      setMarkCompleteTarget(null);
    }
  };

  const openBookingAction = (event: AssignedEvent, action: 'accept' | 'decline') => {
    setBookingActionTarget(event);
    setBookingActionType(action);
    setDeclineReason('');
    setShowEventDetailModal(false);
  };

  const closeBookingAction = () => {
    setBookingActionTarget(null);
    setBookingActionType(null);
    setDeclineReason('');
    setBookingActionLoading(false);
  };

  const handleConfirmBookingAction = async () => {
    if (!bookingActionTarget || !bookingActionType) return;
    setBookingActionLoading(true);
    try {
      const endpoint = bookingActionType === 'accept' ? 'accept' : 'decline';
      const body = bookingActionType === 'decline' && declineReason
        ? JSON.stringify({ reason: declineReason })
        : undefined;
      const headers: Record<string, string> = {};
      if (body) headers['Content-Type'] = 'application/json';
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/events/${bookingActionTarget.id}/${endpoint}`,
        { method: 'POST', body, headers }
      );
      if (res.ok) {
        if (bookingActionType === 'accept') {
          setEvents(prev => prev.map(e => e.id === bookingActionTarget.id
            ? { ...e, bookingStatus: 'ACCEPTED' }
            : e
          ));
        } else {
          setEvents(prev => prev.filter(e => e.id !== bookingActionTarget.id));
        }
        closeBookingAction();
      } else {
        const errorText = await res.text().catch(() => '');
        platformAlert(`Failed to ${bookingActionType} booking: ${res.status} ${errorText}`);
        setBookingActionLoading(false);
      }
    } catch (err) {
      console.error(`Error ${bookingActionType}ing booking:`, err);
      platformAlert(`Failed to ${bookingActionType} booking. Please try again.`);
      setBookingActionLoading(false);
    }
  };

  const uploadMediaToEvent = async (eventId: string, file: File): Promise<{ id: string; url: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/events/${eventId}/media/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const media = data.data || data;
        return { id: media.id || '', url: media.url || media.fileUrl || media.mediaUrl || '' };
      }
      console.error('Failed to upload media:', res.status);
      return null;
    } catch (err) {
      console.error('Error uploading media:', err);
      return null;
    }
  };

  const uploadImageToAlbum = async (albumId: string, file: File): Promise<{ id: string; url: string } | { error: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${albumId}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const img = data.data || data;
        return { id: img.id || '', url: img.url || img.fileUrl || img.imageUrl || img.mediaUrl || '' };
      }
      const errorMsg = data?.message || `Upload failed (HTTP ${res.status})`;
      console.error('Failed to upload album image:', res.status, data);
      return { error: errorMsg };
    } catch (err) {
      console.error('Error uploading album image:', err);
      return null;
    }
  };

  const fetchEventMedia = async (eventId: string): Promise<{ id: string; url: string }[]> => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/media`);
      if (res.ok) {
        const data = await res.json();
        const mediaList = data.data || [];
        return mediaList.map((m: any) => ({ id: m.id || '', url: m.url || m.fileUrl || m.mediaUrl || '' }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching event media:', err);
      return [];
    }
  };

  const deleteEventMedia = async (eventId: string, mediaId: string): Promise<boolean> => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/media/${mediaId}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('Error deleting media:', err);
      return false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added = Array.from(files);
    // APPEND to whatever the viewer picked before. Previously we
    // overwrote both selectedFiles and the previews array, so clicking
    // the upload tile a second time wiped the first batch.
    setSelectedFiles(prev => (prev ? [...prev, ...added] : added));
    added.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        setUploadedImagePreviews(prev => [...prev, src]);
      };
      reader.readAsDataURL(file);
    });
    // Clear the input value so picking the same file twice in a row
    // still fires onChange (browsers suppress change when value is
    // unchanged).
    e.target.value = '';
  };

  // Check if an event already has an album (sent albums block creation permanently)
  const eventHasAlbum = (eventId: string): { exists: boolean; sent: boolean } => {
    const album = albums.find(a => a.eventId === eventId);
    if (!album) return { exists: false, sent: false };
    return { exists: true, sent: album.shared || album.sharedWithClient };
  };

  const canCreateAlbumForEvent = (eventId: string): boolean => {
    const { exists, sent } = eventHasAlbum(eventId);
    if (!exists) return true;    // no album yet → can create
    if (sent) return false;       // album sent → permanently blocked
    return false;                 // album exists unsent → still blocked (must delete first)
  };

  // 7-day edit window for sent albums; unsent albums can always be edited
  const EDIT_WINDOW_DAYS = getPlatformConfig().photographer.albumEditWindowDays;
  // Resolve the date the album was sent
  const getAlbumSentMs = (album: Album): number | null => {
    if (album.sentAt) return new Date(album.sentAt).getTime();
    if (album.expiresAt) return new Date(album.expiresAt).getTime() - 365 * 24 * 60 * 60 * 1000;
    // Fallback: use createdAt (album is typically sent shortly after creation)
    if (album.createdAt) return new Date(album.createdAt).getTime();
    return null;
  };

  const canEditAlbum = (album: Album): boolean => {
    if (!album.shared && !album.sharedWithClient) return true; // not sent → always editable
    const sentMs = getAlbumSentMs(album);
    if (!sentMs || isNaN(sentMs)) return true; // no date info → allow editing (don't block without reason)
    const daysSinceSent = (Date.now() - sentMs) / (24 * 60 * 60 * 1000);
    return daysSinceSent <= EDIT_WINDOW_DAYS;
  };

  const getEditDaysRemaining = (album: Album): number | null => {
    if (!album.shared && !album.sharedWithClient) return null; // not sent
    const sentMs = getAlbumSentMs(album);
    if (!sentMs || isNaN(sentMs)) return EDIT_WINDOW_DAYS;
    return Math.max(0, Math.ceil(EDIT_WINDOW_DAYS - (Date.now() - sentMs) / (24 * 60 * 60 * 1000)));
  };

  const handleOpenCreateAlbum = async (eventId?: string) => {
    setSellPreset(false); setSellErrors({});
    if (eventId) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setCreateAlbumEventId(eventId);
        setAlbumTitle(`${event.title} Album`);
        setAlbumCategory(event.eventType);
        setAlbumDescription(`Photo collection from ${event.title}`);
        // Fetch existing event media
        const existingMedia = await fetchEventMedia(eventId);
        if (existingMedia.length > 0) {
          setUploadedImagePreviews(existingMedia.map(m => m.url));
          const idMap: Record<string, string> = {};
          existingMedia.forEach(m => { idMap[m.url] = m.id; });
          setMediaIdMap(prev => ({ ...prev, ...idMap }));
        }
      }
    } else {
      setCreateAlbumEventId(''); setAlbumTitle(''); setAlbumCategory(''); setAlbumDescription('');
      setUploadedImagePreviews([]);
    }
    setCreateAlbumMode('event'); setStandaloneLocation(''); setStandaloneDate('');
    setSelectedFiles(null); setSelectedCoverIndex(0); setShowCreateAlbumModal(true);
  };

  // The photographer's own one-click sale: the existing album form, preset to a PAID standalone album.
  const startEventSale = () => {
    void handleOpenCreateAlbum();
    setCreateAlbumMode('standalone');
    setStandaloneAlbumType('PAID');
    setSellPreset(true);
  };

  // Stock & content: the existing content album form, on the Content tab. No face scanning, no face credits.
  const startContentSale = () => {
    setActiveTab('content');
    setContentCreateSignal((n) => n + 1);
  };

  const handleSellPhotos = () => setShowSellChooser(true);

  // Retry publishing: publish only, never re-upload. The album and its photos are already saved.
  const retryPublishAlbum = async () => {
    const m = albumSuccessModal;
    if (!m?.albumId || retryingPublish) return;
    setRetryingPublish(true);
    let outcome: PublishOutcome;
    let inviteCode = m.inviteCode;
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${m.albumId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m.price && m.currencyId ? { pricePerImage: parseFloat(m.price), currencyId: m.currencyId } : {}),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.action !== 0) {
        inviteCode = json?.data?.inviteCode || inviteCode;
        outcome = publishOutcome({
          published: true,
          facesIndexed: typeof json?.data?.facesIndexed === 'number' ? json.data.facesIndexed : undefined,
          indexing: json?.data?.indexing === true ? { total: Number(json.data.indexingTotal) || 0, done: Number(json.data.indexingDone) || 0 } : undefined,
        });
      } else {
        outcome = publishOutcome({ failure: describePublishFailure({ status: res.status, body: json }) });
      }
    } catch {
      outcome = publishOutcome({ failure: describePublishFailure({ networkError: true }) });
    }
    setAlbumSuccessModal(prev => (prev ? { ...prev, outcome, inviteCode } : prev));
    if (outcome.state === 'listed') {
      setAlbums(prev => prev.map(a => (a.id === m.albumId ? { ...a, faceRecognitionEnabled: true, inviteCode: inviteCode || a.inviteCode } : a)));
    }
    setRetryingPublish(false);
  };

  // A large album is indexed in the background: follow it while the result modal is open, until it is ready or has failed.
  const preparingAlbumId = albumSuccessModal?.outcome?.state === 'preparing' ? albumSuccessModal.albumId : undefined;
  useEffect(() => {
    if (!preparingAlbumId) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${preparingAlbumId}/face-status`);
        const json = await res.json().catch(() => null);
        const next = outcomeFromIndexing(json?.data?.indexing);
        if (!stopped && next) setAlbumSuccessModal(prev => (prev && prev.albumId === preparingAlbumId ? { ...prev, outcome: next } : prev));
      } catch {
        // A missed poll is not a failure: the next one will say.
      }
    }, 4000);
    return () => { stopped = true; clearInterval(timer); };
  }, [preparingAlbumId, apiUrl]);

  // Deep link from Home and the Get started sheet: /user/photographer/events?sell=1
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sell') !== '1') return;
    params.delete('sell');
    const rest = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''));
    handleSellPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEventSelectForAlbum = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setCreateAlbumEventId(eventId);
      setAlbumTitle(`${event.title} Album`);
      setAlbumCategory(event.eventType);
      setAlbumDescription(`Photo collection from ${event.title}`);
      // Fetch existing event media
      const existingMedia = await fetchEventMedia(eventId);
      if (existingMedia.length > 0) {
        setUploadedImagePreviews(existingMedia.map(m => m.url));
        const idMap: Record<string, string> = {};
        existingMedia.forEach(m => { idMap[m.url] = m.id; });
        setMediaIdMap(prev => ({ ...prev, ...idMap }));
      } else {
        setUploadedImagePreviews([]);
      }
      setSelectedCoverIndex(0);
    }
  };

  const handleCreateAlbum = async () => {
    const isStandalone = createAlbumMode === 'standalone';
    const event = isStandalone ? null : events.find(e => e.id === createAlbumEventId);
    if (!isStandalone && (!event || !albumTitle)) return;
    if (isStandalone && !albumTitle) return;

    // Sell photos: every missing condition shows next to its field, so an album never silently fails to appear.
    if (sellPreset) {
      const errs = sellFieldErrors({ title: albumTitle, price: paidAlbumPrice, currencyId: paidAlbumCurrencyId, priceMsg: paidAlbumPriceMsg, photoCount: selectedFiles?.length ?? 0 });
      setSellErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    // Validate PAID/FREE album fields
    if (isStandalone && standaloneAlbumType === 'PAID') {
      if (!paidAlbumPrice || !paidAlbumCurrencyId) {
        platformAlert('Please fill in price and currency for PAID album');
        return;
      }
      if (paidAlbumPriceMsg) {
        platformAlert(paidAlbumPriceMsg);
        return;
      }
    }
    if (isStandalone && standaloneAlbumType === 'FREE' && !freeAlbumEmail) {
      platformAlert('Please enter recipient email for FREE album');
      return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      platformAlert('Please select at least one photo to upload.');
      return;
    }

    setIsUploadingAlbum(true);

    // 1. Create album on backend first
    let backendAlbumId = '';
    let backendInviteCode = '';
    let backendAccessCode = '';
    try {
      setUploadProgress('Creating album...');
      const formData = new FormData();
      formData.append('title', albumTitle);
      if (albumDescription) formData.append('description', albumDescription);
      if (albumCategory) formData.append('category', albumCategory);

      // Determine endpoint based on album mode and type
      let endpoint = `${apiUrl}/api/remote/photographer/albums`;
      if (isStandalone) {
        if (standaloneAlbumType === 'PAID') {
          endpoint = `${apiUrl}/api/remote/photographer/albums/paid`;
          formData.append('pricePerImage', paidAlbumPrice);
          formData.append('currencyId', paidAlbumCurrencyId);
        } else {
          endpoint = `${apiUrl}/api/remote/photographer/albums/free`;
          formData.append('recipientEmail', freeAlbumEmail);
          // Optional download cap + price for extras. Blank = whole album
          // free to download (unchanged behaviour).
          if (freeMaxDownloads && String(freeMaxDownloads).trim() !== '') {
            formData.append('maxFreeDownloads', String(freeMaxDownloads).trim());
          }
          if (freeExtraPrice && String(freeExtraPrice).trim() !== '') {
            formData.append('pricePerExtraImage', String(freeExtraPrice).trim());
            // Currency only relevant when there's actually a price to charge.
            // Fall back to the paid-album currency the photographer just
            // picked so we don't make them double-select.
            const effectiveCurrency = freeExtraCurrencyId || paidAlbumCurrencyId;
            if (effectiveCurrency) formData.append('currencyId', effectiveCurrency);
          }
        }
        if (standaloneLocation) formData.append('location', standaloneLocation);
        if (standaloneDate) formData.append('date', standaloneDate);
      } else {
        formData.append('eventId', event!.id);
      }

      const res = await dashboardAuthFetch(endpoint, { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        backendAlbumId = result?.data?.id || '';
        backendInviteCode = result?.data?.inviteCode || '';
        backendAccessCode = result?.data?.accessCode || '';

        // For FREE albums, send invitation email automatically
        if (isStandalone && standaloneAlbumType === 'FREE' && backendAlbumId) {
          try {
            setUploadProgress('Sending invitation...');
            const sendRes = await dashboardAuthFetch(
              `${apiUrl}/api/remote/photographer/albums/${backendAlbumId}/send-free`,
              { method: 'POST' }
            );
            if (sendRes.ok) {
              const sendResult = await sendRes.json();
              backendAccessCode = sendResult?.data?.accessCode || '';
              backendInviteCode = backendAccessCode || backendInviteCode;
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) { console.error('Failed to create album:', err); }

    if (!backendAlbumId) {
      setIsUploadingAlbum(false); setUploadProgress('');
      platformAlert('Failed to create album. Please try again.');
      return;
    }

    // 2. Upload images to the album
    let albumImages: string[] = isStandalone ? [] : [event!.coverImage];
    let albumCover = isStandalone ? '' : event!.coverImage;
    const rejectedMessages: string[] = [];

    if (selectedFiles && selectedFiles.length > 0) {
      const uploadedUrls: string[] = [];
      const idMap: Record<string, string> = {};
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}...`);
        const result = await uploadImageToAlbum(backendAlbumId, selectedFiles[i]);
        if (result && 'url' in result && result.url) {
          const normalizedUrl = normalizeImg(result.url) || result.url;
          uploadedUrls.push(normalizedUrl);
          idMap[normalizedUrl] = result.id;
        } else if (result && 'error' in result) {
          rejectedMessages.push(`${selectedFiles[i].name}: ${result.error}`);
        }
      }
      if (uploadedUrls.length > 0) {
        albumImages = uploadedUrls;
        albumCover = uploadedUrls[Math.min(selectedCoverIndex, uploadedUrls.length - 1)];
        setMediaIdMap(prev => ({ ...prev, ...idMap }));
      }
    }

    // 3. Auto-publish PAID standalone albums to Face AI. A failure is shown with its real reason and a retry that only
    // publishes again (never re-uploads); it is never swallowed, so an album cannot silently stay invisible.
    let publishedToFaceAI = false;
    let facesIndexed: number | undefined;
    let indexingProgress: { total: number; done: number } | undefined;
    let publishFailure: ReturnType<typeof describePublishFailure> | undefined;
    if (isStandalone && standaloneAlbumType === 'PAID' && backendAlbumId) {
      try {
        setUploadProgress('Preparing your photos for Find my photos... this can take a minute for a large album');
        const pubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${backendAlbumId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricePerImage: parseFloat(paidAlbumPrice), currencyId: paidAlbumCurrencyId }),
        });
        const pubResult = await pubRes.json().catch(() => null);
        if (pubRes.ok && pubResult?.action !== 0) {
          backendInviteCode = pubResult?.data?.inviteCode || backendInviteCode;
          facesIndexed = typeof pubResult?.data?.facesIndexed === 'number' ? pubResult.data.facesIndexed : undefined;
          // A large album is published at once and indexed in the background; the result modal follows its progress.
          if (pubResult?.data?.indexing === true) indexingProgress = { total: Number(pubResult.data.indexingTotal) || 0, done: Number(pubResult.data.indexingDone) || 0 };
          publishedToFaceAI = true;
          // If publish didn't return an invite code, generate one
          if (!backendInviteCode) {
            try {
              const codeRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${backendAlbumId}/invite-code`, { method: 'POST' });
              if (codeRes.ok) {
                const codeResult = await codeRes.json();
                backendInviteCode = codeResult?.data?.inviteCode || codeResult?.data?.code || '';
              }
            } catch (err) { console.error('Invite code request failed:', err); }
          }
        } else {
          publishFailure = describePublishFailure({ status: pubRes.status, body: pubResult });
        }
      } catch (err) {
        console.error('Publish to Find my photos failed:', err);
        publishFailure = describePublishFailure({ networkError: true });
      }
    }

    const newAlbum: Album = {
      id: backendAlbumId, title: albumTitle, description: albumDescription, category: albumCategory,
      eventId: isStandalone ? '' : event!.id, eventTitle: isStandalone ? '' : event!.title,
      clientId: isStandalone ? '' : event!.bookingId, clientName: isStandalone ? '' : event!.clientName,
      coverImage: albumCover, images: albumImages, photoCount: albumImages.length,
      views: 0, likes: 0, downloads: 0, shared: false, sharedWithClient: false,
      faceRecognitionEnabled: publishedToFaceAI, inviteCode: backendInviteCode || null,
      createdAt: new Date().toISOString().split('T')[0],
      eventDate: isStandalone ? standaloneDate : event!.date,
      clientImage: isStandalone ? '' : event!.clientImage, sentAt: '', expiresAt: '',
      albumType: isStandalone ? 'standalone' : 'event', isStandalone,
      location: isStandalone ? standaloneLocation : '', albumDate: isStandalone ? standaloneDate : '',
    };
    setAlbums(prev => [newAlbum, ...prev]);
    setShowCreateAlbumModal(false);
    setActiveTab('albums');
    setIsUploadingAlbum(false);
    setUploadProgress('');

    // Show success modal for standalone albums
    if (isStandalone) {
      setAlbumSuccessModal({
        type: standaloneAlbumType === 'PAID' ? 'paid' : 'free',
        albumId: backendAlbumId,
        title: albumTitle,
        inviteCode: backendInviteCode || undefined,
        email: standaloneAlbumType === 'FREE' ? freeAlbumEmail : undefined,
        accessCode: backendAccessCode || undefined,
        photoCount: albumImages.length,
        rejected: rejectedMessages.length > 0 ? rejectedMessages : undefined,
        outcome: standaloneAlbumType === 'PAID' ? publishOutcome({ published: publishedToFaceAI, facesIndexed, indexing: indexingProgress, failure: publishFailure }) : undefined,
        price: standaloneAlbumType === 'PAID' ? paidAlbumPrice : undefined,
        currencyId: standaloneAlbumType === 'PAID' ? paidAlbumCurrencyId : undefined,
      });
    }

    // Reset form fields
    setAlbumTitle('');
    setAlbumDescription('');
    setAlbumCategory('');
    setStandaloneLocation('');
    setStandaloneDate('');
    setPaidAlbumPrice('');
    setPaidAlbumCurrencyId('');
    setFreeAlbumEmail('');
    setUploadedImagePreviews([]);
    setSelectedFiles(null);

    // Reconcile local state with the backend's canonical view of this new
    // album. The locally-built newAlbum above is an approximation. for
    // event albums where no new files were picked, `images`/`coverImage`
    // here point at the event cover (which is NOT actually in the gallery
    // server-side), and fields like recipientEmail / accessCode /
    // isFreeAlbum are unset. Without this refetch, opening the edit modal
    // immediately after create shows phantom images and PUT sends bad
    // coverImageUrl values. the user has to reload to recover. Single
    // GET, swap the entry in state, populate mediaIdMap with the real
    // image ids. Best-effort: if it fails we keep the local version.
    try {
      const refetch = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${backendAlbumId}`);
      if (refetch.ok) {
        const refetchResult = await refetch.json();
        const canonical = refetchResult?.data;
        if (canonical && typeof canonical === 'object') {
          const { album: canonicalAlbum, imageIds } = mapApiAlbum(canonical);
          setAlbums(prev => prev.map(a => a.id === backendAlbumId ? canonicalAlbum : a));
          if (Object.keys(imageIds).length > 0) {
            setMediaIdMap(prev => ({ ...prev, ...imageIds }));
          }
        }
      }
    } catch { /* keep the locally-built newAlbum; user can reload if edit misbehaves */ }
  };

  const handleOpenEdit = (album: Album) => { setSelectedAlbum(album); setEditTitle(album.title); setEditDescription(album.description); setEditCategory(album.category); setEditImages([...album.images]); setEditCoverIndex(album.images.indexOf(album.coverImage) >= 0 ? album.images.indexOf(album.coverImage) : 0); setShowAlbumEditModal(true); };
  const handleSaveEdit = async () => {
    if (!selectedAlbum || editImages.length === 0) return;
    const coverIdx = Math.min(editCoverIndex, editImages.length - 1);
    const newCoverImage = editImages[coverIdx];
    setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, title: editTitle, description: editDescription, category: editCategory, images: editImages, coverImage: newCoverImage, photoCount: editImages.length } : a));
    setShowAlbumEditModal(false);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('category', editCategory);
      formData.append('coverImageUrl', newCoverImage);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${selectedAlbum.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!res.ok) console.error('Failed to update album:', await res.text());
    } catch (err) {
      console.error('Failed to update album:', err);
    }
  };
  const handleEditFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || !selectedAlbum) return;
    for (const file of Array.from(files)) {
      const result = await uploadImageToAlbum(selectedAlbum.id, file);
      if (result && 'url' in result && result.url) {
        const nUrl = normalizeImg(result.url) || result.url;
        setEditImages(prev => [...prev, nUrl]);
        setMediaIdMap(prev => ({ ...prev, [nUrl]: result.id }));
      } else {
        if (result && 'error' in result) platformAlert(result.error);
        // Fallback to local preview if upload fails
        const reader = new FileReader();
        reader.onload = (ev) => { setEditImages(prev => [...prev, ev.target?.result as string]); };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };
  const handleEditImageRemove = async (index: number) => {
    const imageUrl = editImages[index];
    const imageId = mediaIdMap[imageUrl];
    // Delete from album on server if we have an image ID
    if (imageId && selectedAlbum) {
      try {
        await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${selectedAlbum.id}/images/${imageId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete album image:', err);
      }
      setMediaIdMap(prev => { const updated = { ...prev }; delete updated[imageUrl]; return updated; });
    }
    setEditImages(prev => { const updated = prev.filter((_, i) => i !== index); if (editCoverIndex >= updated.length) setEditCoverIndex(Math.max(0, updated.length - 1)); else if (editCoverIndex === index) setEditCoverIndex(0); else if (editCoverIndex > index) setEditCoverIndex(editCoverIndex - 1); return updated; });
  };
  // Enabling face recognition asks the backend for the album's invite code
  // via POST /albums/{id}/invite-code. The backend's standalone-album path on
  // that endpoint now returns gallery.inviteCode (PAID standalone) or
  // gallery.accessCode (FREE standalone), generating one if neither is set,
  // so the previous "Failed to generate invite code" error is gone for
  // standalone albums.
  const handleToggleFaceRecognition = async (album: Album) => {
    let inviteCode = album.inviteCode;
    if (!album.faceRecognitionEnabled && !inviteCode) {
      try {
        const res = await dashboardAuthFetch(
          `${apiUrl}/api/remote/photographer/albums/${album.id}/invite-code`,
          { method: 'POST' }
        );
        if (res.ok) {
          const result = await res.json();
          inviteCode = result?.data?.inviteCode
            || result?.data?.code
            || (typeof result?.data === 'string' ? result.data : null);
        }
      } catch (err) {
        console.error('Failed to generate invite code:', err);
      }
    }
    const updated = { ...album, faceRecognitionEnabled: !album.faceRecognitionEnabled, inviteCode };
    setAlbums(prev => prev.map(a => a.id === album.id ? updated : a));
    setSelectedAlbum(updated);
  };
  const handleSendToClient = async (album: Album) => {
    setShowSendModal(false);
    // Standalone FREE albums were already emailed at creation time, so "Send"
    // here means RESEND to the captured recipientEmail via /send-free. no
    // event/eventId required. Event-linked albums use the original /send.
    const isStandaloneFree = (album.isStandalone || album.albumType === 'standalone')
      && album.isFreeAlbum;
    const endpoint = isStandaloneFree
      ? `${apiUrl}/api/remote/photographer/albums/${album.id}/send-free`
      : `${apiUrl}/api/remote/photographer/albums/${album.id}/send`;
    try {
      const res = await dashboardAuthFetch(endpoint, { method: 'POST' });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        setAlbumSuccessMessage({
          status: 'error',
          title: isStandaloneFree ? 'Failed to Resend Invitation' : 'Failed to Send Album',
          description: errorBody?.message || 'Failed to send album. Please try again.',
        });
        setShowAlbumSuccessModal(true);
        return;
      }
      setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, sharedWithClient: true, shared: true } : a));
      const recipient = isStandaloneFree
        ? (album.recipientEmail || 'the recipient')
        : (album.clientName || 'the client');
      setAlbumSuccessMessage({
        status: 'success',
        title: isStandaloneFree ? 'Invitation Resent' : 'Album Sent Successfully',
        description: isStandaloneFree
          ? `The invitation for "${album.title}" was resent to ${recipient}.`
          : `"${album.title}" has been delivered to ${recipient}. They can now view and download their photos.`,
      });
      setShowAlbumSuccessModal(true);
    } catch (err) {
      console.error('Failed to send album:', err);
      setAlbumSuccessMessage({
        status: 'error',
        title: isStandaloneFree ? 'Failed to Resend Invitation' : 'Failed to Send Album',
        description: 'Network error. Please check your connection and try again.',
      });
      setShowAlbumSuccessModal(true);
    }
  };
  const handleDeleteAlbum = async () => { if (!albumToDelete) return; setAlbums(prev => prev.filter(a => a.id !== albumToDelete.id)); setShowDeleteConfirm(false); const id = albumToDelete.id; setAlbumToDelete(null); try { await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${id}`, { method: 'DELETE' }); } catch (err) { console.error('Failed to delete album:', err); } };

  // Soft delete (dismiss) handlers
  const handleDismissEvent = async () => {
    if (!eventToDismiss) return;
    const id = eventToDismiss.id;
    setEvents(prev => prev.filter(e => e.id !== id));
    setShowDismissEventModal(false);
    setEventToDismiss(null);
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${id}/dismiss`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to dismiss event:', err);
    }
  };

  const handleDismissAlbum = async () => {
    if (!albumToDismiss) return;
    const id = albumToDismiss.id;
    setAlbums(prev => prev.filter(a => a.id !== id));
    setShowDismissAlbumModal(false);
    setAlbumToDismiss(null);
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${id}/dismiss`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to dismiss album:', err);
    }
  };

  // Check if event can be dismissed (album has been created for it)
  const canDismissEvent = (event: AssignedEvent): boolean => {
    return eventHasAlbum(event.id).exists;
  };

  // Check if album can be dismissed (sent to client AND Face AI enabled)
  const canDismissAlbum = (album: Album): boolean => {
    return album.sharedWithClient && album.faceRecognitionEnabled;
  };

  const handleBrowseKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showAlbumBrowseModal || !viewerAlbum) return;
    if (e.key === 'ArrowLeft' && currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
    else if (e.key === 'ArrowRight' && currentImageIndex < viewerAlbum.images.length - 1) setCurrentImageIndex(currentImageIndex + 1);
    else if (e.key === 'Escape') setShowAlbumBrowseModal(false);
  }, [showAlbumBrowseModal, viewerAlbum, currentImageIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleBrowseKeyDown);
    return () => window.removeEventListener('keydown', handleBrowseKeyDown);
  }, [handleBrowseKeyDown]);

  const filteredAlbums = albums.filter(a => {
    // Content albums live exclusively in the Content tab - exclude
    // them from the Albums tab so they don't appear in both places.
    // Two signals: explicit albumType==='content' from the typed
    // enum, OR presence of contentApprovalStatus (only CONTENT rows
    // ever have that field populated on the DTO).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aa: any = a;
    const isContent = aa.albumType === 'content' || !!aa.contentApprovalStatus;
    if (isContent) return false;
    const matchesFilter = albumFilter === 'all' || (albumFilter === 'shared' ? a.shared : !a.shared);
    const matchesSearch = a.title.toLowerCase().includes(albumSearch.toLowerCase()) || a.clientName.toLowerCase().includes(albumSearch.toLowerCase()) || a.category.toLowerCase().includes(albumSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  // The shared Events model: statuses from getEventStatus, so the chips, their counts and the rows always agree.
  const eventItems = events.map((e) => ({
    id: e.id,
    title: e.title,
    clientName: e.clientName,
    category: e.eventType,
    eventDate: (e.date || '').slice(0, 10),
    startTime: e.startTime,
    endTime: e.endTime,
    eventStatus: e.status === 'pending' ? 'UPCOMING' : e.status.toUpperCase(),
    streamStatus: e.streamStatus,
    hasLiveStream: e.hasLiveStream,
    src: e,
  }));
  const eventFilters = { status: eventFilter, date: eventDate, search: eventSearch };
  const eventCounts = countsOf(eventItems, { date: eventDate, search: eventSearch }, nowMs);
  const visibleItems = filterEvents(eventItems, eventFilters, nowMs);
  const groupedItems = groupEvents(visibleItems, nowMs);
  const emptyHelp = emptyInfo(eventItems, eventFilters, nowMs);

  const filterBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 9, border: 'none',
    backgroundColor: isActive ? 'var(--ck-surface)' : 'transparent',
    color: isActive ? 'var(--ck-text)' : 'var(--ck-text-soft)',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
    transition: 'background 180ms, color 180ms',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
    whiteSpace: 'nowrap',
  });
  const cardStyle: React.CSSProperties = { backgroundColor: colors.bgCard, borderRadius: 14, border: `1px solid ${colors.borderPrimary}`, boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.10)', overflow: 'hidden', transition: 'box-shadow 0.2s, border-color 0.2s' };
  const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
  const modalContent = (maxW: string): React.CSSProperties => ({ position: 'relative', backgroundColor: colors.bgCard, borderRadius: 18, paddingTop: 'calc(1.5rem + 3px)', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '1.5rem', width: '95%', maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)', border: `1px solid ${colors.borderPrimary}` });
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.85rem', borderRadius: 11, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.9rem', boxSizing: 'border-box' as const, outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s' };
  const primaryBtn: React.CSSProperties = { padding: '0.7rem 1.2rem', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: 'white', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 8px 18px rgba(8,58,133,0.30)', transition: 'transform 0.15s, box-shadow 0.15s' };
  const secondaryBtn: React.CSSProperties = { padding: '0.7rem 1.2rem', borderRadius: 11, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer', transition: 'border-color 0.15s' };
  const smallActionBtn: React.CSSProperties = { padding: '0.4rem 0.7rem', borderRadius: 9, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'border-color 0.15s, background-color 0.15s' };

  // === RENDER ===

  return {
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
  };
}

export type PhotographerEventsController = ReturnType<typeof usePhotographerEvents>;
