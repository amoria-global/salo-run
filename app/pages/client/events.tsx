"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localforage from 'localforage';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import { platformAlert } from '../../components/PlatformAlert';
import SatisfactionSurveyModal from '../../components/SatisfactionSurveyModal';
import EventConfirmModal from '../../components/EventConfirmModal';
import RebookWizard from '../../components/RebookWizard';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { StatCard } from '../../components/dashboard/StatCard';
import { getApiUrl, normalizeImageUrl, autoCapitalize, capitalizeWords } from '@/lib/api';
import { isEventPriceInvalid, getMinEventPriceLabel } from '../../components/eventPriceValidation';
import { useCurrency } from '@/app/context/CurrencyContext';
import BookingModeSelectorModal from '../../components/hybrid/BookingModeSelectorModal';
import HybridEventWizardModal from '../../components/hybrid/HybridEventWizardModal';
import CandidatesShortlistModal from '../../components/hybrid/CandidatesShortlistModal';
import { convertToHybrid } from '@/app/lib/hybridBooking';

function parseTimeToApiString(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return `${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`;
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Configure localforage for event form data
const eventFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'event_form_draft'
});

// Storage key for the create event form
const CREATE_EVENT_FORM_KEY = 'create_event_form_draft';

// Interface for saved form data
interface CreateEventFormData {
  createTitle: string;
  createDescription: string;
  createEventType: string;
  createCategory: string;
  createStatus: 'UPCOMING' | 'LIVE';
  createDate: string;
  createTime: string;
  createEndTime: string;
  createDuration: string;
  createVenueName: string;
  createAddress: string;
  createCity: string;
  createCountry: string;
  createPrice: string;
  createMaxGuests: string;
  createOrganizer: string;
  createTags: string[];
  createPhotographerId: string;
  createPackageId: string;
  createEventVisibility: string;
  createBannerImagePreview: string | null;
  savedAt: number;
}

// Icons
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Social Media Icons with Brand Colors
const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/>
    <rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/>
  </svg>
);

// Types
type EventCategory = string;

type EventStatus = 'UPCOMING' | 'LIVE' | 'PUBLISHED' | 'PAUSED' | 'upcoming' | 'ongoing' | 'completed' | 'published' | 'paused';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  category: EventCategory;
  date: string;
  time: string;
  endTime?: string;
  duration: string;
  location: {
    address: string;
    city: string;
    country: string;
  };
  coverImage: string;
  bannerImage?: string;
  price: string;
  priceCurrency?: string;
  hasLiveStream: boolean;
  isPublished: boolean;
  guestCount: number;
  maxGuests: number;
  status: EventStatus;
  organizer: string;
  tags: string[];
  hasPhotographer: boolean;
  bookingStatus?: string;
  bookingMode?: string;
  photographerId?: string;
  photographerName?: string;
  photographerImage?: string;
  shareLink: string;
  inviteCode?: string;
  streamInviteToken?: string;
  completionStatus?: string;
  albumDelivered?: boolean;
  createdAt: string;
}

// Tag Icon
const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

// Image Icon for banner
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Dollar Icon for pricing
const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V18M15 9.5C15 8.12 13.65 7 12 7C10.35 7 9 8.12 9 9.5C9 10.88 10.35 12 12 12C13.65 12 15 13.12 15 14.5C15 15.88 13.65 17 12 17C10.35 17 9 15.88 9 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Organizer Icon
const OrganizerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  const { colors } = useTheme();
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', cursor: 'pointer', padding: '0.5rem', color: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Photographers the client has worked with before
const MyEventsPage = () => {
  const { formatPrice } = useCurrency();
  const { colors, actualTheme } = useTheme();
  const { token, user } = useDashboardAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'published' | 'past' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<Event | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseEvent, setPauseEvent] = useState<Event | null>(null);
  const [pausingEventId, setPausingEventId] = useState<string | null>(null);
  const [resumingEventId, setResumingEventId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Photographers fetched from API
  const [pastPhotographers, setPastPhotographers] = useState<{id: string; name: string; image?: string; speciality: string; rating: number; eventsWorked: number}[]>([]);
  const [platformPhotographers, setPlatformPhotographers] = useState<{id: string; name: string; image?: string; speciality: string; rating: number; eventsWorked: number}[]>([]);
  const [showFindPhotographerModal, setShowFindPhotographerModal] = useState(false);
  const [photographerSearchQuery, setPhotographerSearchQuery] = useState('');
  const [photographerAssignMode, setPhotographerAssignMode] = useState<'none' | 'existing' | 'platform' | 'invite'>('none');
  const [invitePhotographerEmail, setInvitePhotographerEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false);
  const [editPhotographerId, setEditPhotographerId] = useState<string>('');
  const [editPhotographerAssignMode, setEditPhotographerAssignMode] = useState<'none' | 'existing' | 'platform'>('none');
  const [editPhotographerSearchQuery, setEditPhotographerSearchQuery] = useState('');

  const filteredPhotographers = pastPhotographers.filter((photographer) => {
    if (!photographerSearchQuery.trim()) return true;
    const query = photographerSearchQuery.toLowerCase();
    return photographer.name.toLowerCase().includes(query) || photographer.speciality.toLowerCase().includes(query);
  });

  useEffect(() => {
    const normalizeImg = (url: string | undefined | null): string | undefined => {
      if (!url || url.includes('/null')) return undefined;
      return normalizeImageUrl(url);
    };
    // Fetch booked/existing photographers (authenticated)
    const fetchBookedPhotographers = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/photographers`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.data?.content || data.data || []).map((p: Record<string, unknown>) => ({
            id: (p.id as string) || '',
            name: `${(p.firstName as string) || ''} ${(p.lastName as string) || ''}`.trim() || (p.name as string) || 'Photographer',
            image: normalizeImg((p.profilePicture as string) || (p.profileImage as string) || (p.image as string) || null),
            speciality: (p.speciality as string) || (p.category as string) || 'Photography',
            rating: (p.rating as number) || 0,
            eventsWorked: 0,
          }));
          setPastPhotographers(list);
        }
      } catch {
        // Silently fail
      }
    };
    // Fetch all platform photographers (public endpoint)
    const fetchPlatformPhotographers = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/remote/public/photographers/list?page=0&size=50&sortColumn=createdAt&sortDirection=desc`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.action === 1 && data.data?.content) {
          const mapped = data.data.content.map((p: Record<string, unknown>) => ({
            id: (p.id as string) || '',
            name: `${(p.firstName as string) || ''} ${(p.lastName as string) || ''}`.trim() || 'Photographer',
            image: normalizeImg((p.profilePicture as string) || null),
            speciality: Array.isArray(p.specialties) ? p.specialties.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : (p.customerType as string) || 'Photography',
            rating: (p.rating as number) || 0,
            eventsWorked: 0,
          }));
          setPlatformPhotographers(mapped);
        }
      } catch {
        // Silently fail
      }
    };
    fetchBookedPhotographers();
    fetchPlatformPhotographers();
  }, []);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState('');
  const [editCategory, setEditCategory] = useState<EventCategory | ''>('');
  const [editStatus, setEditStatus] = useState<'UPCOMING' | 'LIVE'>('UPCOMING');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editVenueName, setEditVenueName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPriceCurrency, setEditPriceCurrency] = useState('RWF');
  const [editMaxGuests, setEditMaxGuests] = useState('');
  const [editOrganizer, setEditOrganizer] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editBannerImage, setEditBannerImage] = useState<string | null>(null);
  const [editBannerImagePreview, setEditBannerImagePreview] = useState<string | null>(null);
  const [editBannerImageFile, setEditBannerImageFile] = useState<File | null>(null);

  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createEventType, setCreateEventType] = useState('');
  const [createCategory, setCreateCategory] = useState<EventCategory | ''>('');
  const [createStatus, setCreateStatus] = useState<'UPCOMING' | 'LIVE'>('UPCOMING');
  const [statusFieldHovered, setStatusFieldHovered] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [createTime, setCreateTime] = useState('');
  const [createEndTime, setCreateEndTime] = useState('');
  const [createDuration, setCreateDuration] = useState('');
  const [createVenueName, setCreateVenueName] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createCity, setCreateCity] = useState('');
  const [createCountry, setCreateCountry] = useState('Rwanda');
  const [createPrice, setCreatePrice] = useState('');
  const [createPriceCurrency, setCreatePriceCurrency] = useState('RWF');
  const [createMaxGuests, setCreateMaxGuests] = useState('');
  const [createOrganizer, setCreateOrganizer] = useState('');
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [createTagInput, setCreateTagInput] = useState('');
  const [createBannerImage, setCreateBannerImage] = useState<string | null>(null);
  const [createBannerImagePreview, setCreateBannerImagePreview] = useState<string | null>(null);
  const [createBannerImageFile, setCreateBannerImageFile] = useState<File | null>(null);
  const [createPhotographerId, setCreatePhotographerId] = useState<string>('');
  const [createEventVisibility, setCreateEventVisibility] = useState<string>('PUBLIC');
  const [createPackageId, setCreatePackageId] = useState<string>('');
  const [photographerPackages, setPhotographerPackages] = useState<{id: string; packageName: string; price: number; currencyId: string; currencySymbol: string; currencyAbbreviation: string; description: string; durationHours: number; hasLiveStream: boolean; includedPhotos: number; includedVideos: number}[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [createEscrowPercentage, setCreateEscrowPercentage] = useState<number>(50);

  // Hybrid booking state
  const [showBookingModeSelector, setShowBookingModeSelector] = useState(false);
  const [showHybridWizard, setShowHybridWizard] = useState(false);
  const [candidateModalEvent, setCandidateModalEvent] = useState<Event | null>(null);
  const [convertingHybridId, setConvertingHybridId] = useState<string | null>(null);

  const handleConvertToHybrid = async (ev: Event) => {
    setConvertingHybridId(ev.id);
    try {
      await convertToHybrid(ev.id);
      platformAlert('Your event brief has been broadcast to verified local photographers.', {
        title: 'Hybrid Matching Active',
        tone: 'success',
      });
      fetchMyEvents();
    } catch (e: any) {
      platformAlert(e.message || 'Could not broadcast event to photographers.', {
        title: 'Error',
        tone: 'danger',
      });
    } finally {
      setConvertingHybridId(null);
    }
  };

  // Completion confirmation modal
  const [completionModalEvent, setCompletionModalEvent] = useState<Event | null>(null);
  const [completionFeedbackStatus, setCompletionFeedbackStatus] = useState<'COMPLETED' | 'REQUIRE_CHANGES'>('COMPLETED');
  const [completionComment, setCompletionComment] = useState('');
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  // Satisfaction survey - shown AFTER the client picks "Completed" on
  // the confirmation modal. Submission of the survey then triggers the
  // backend's confirm-completion endpoint (which releases survey-held
  // escrow). "Require Changes" skips the survey entirely.
  const [surveyForEvent, setSurveyForEvent] = useState<Event | null>(null);

  // Fetch packages when photographer changes
  useEffect(() => {
    if (!createPhotographerId || !isValidUUID(createPhotographerId)) {
      setPhotographerPackages([]);
      setCreatePackageId('');
      setPackagesError(null);
      return;
    }
    setPackagesLoading(true);
    setCreatePackageId('');
    const fetchPackages = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/remote/public/photographers/${createPhotographerId}/packages`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          setPackagesError('Could not load packages. Please try again.');
          return;
        }
        const data = await response.json();
        const pkgs = data.action === 1 && Array.isArray(data.data) ? data.data : [];
        setPhotographerPackages(pkgs.filter((p: Record<string, unknown>) => p.isActive !== false).map((p: Record<string, unknown>) => ({
          id: (p.id as string) || '',
          packageName: (p.packageName as string) || 'Package',
          price: (p.price as number) || 0,
          currencyId: (p.currencyId as string) || 'RWF',
          currencySymbol: (p.currencySymbol as string) || (p.currency as any)?.symbol || '',
          currencyAbbreviation: (p.currencyAbbreviation as string) || (p.currency as any)?.abbreviation || '',
          description: (p.description as string) || '',
          durationHours: (p.durationHours as number) || 0,
          hasLiveStream: (p.hasLiveStream as boolean) ?? false,
          includedPhotos: (p.includedPhotos as number) || 0,
          includedVideos: (p.includedVideos as number) || 0,
        })));
      } catch {
        setPackagesError('Could not load packages. Please try again.');
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, [createPhotographerId]);

  // Auto-set status based on selected package: hasLiveStream → Live Event, else Upcoming
  useEffect(() => {
    if (!createPackageId) {
      setCreateStatus('UPCOMING');
      return;
    }
    const selected = photographerPackages.find(p => p.id === createPackageId);
    if (selected && selected.hasLiveStream) {
      setCreateStatus('LIVE');
    } else {
      setCreateStatus('UPCOMING');
    }
  }, [createPackageId, photographerPackages]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save form data to IndexedDB
  const saveFormDraft = useCallback(async () => {
    const formData: CreateEventFormData = {
      createTitle,
      createDescription,
      createEventType,
      createCategory: createCategory as string,
      createStatus,
      createDate,
      createTime,
      createEndTime,
      createDuration,
      createVenueName,
      createAddress,
      createCity,
      createCountry,
      createPrice,
      createMaxGuests,
      createOrganizer,
      createTags,
      createPhotographerId,
      createPackageId,
      createEventVisibility,
      createBannerImagePreview,
      savedAt: Date.now()
    };

    // Only save if there's actual data entered
    const hasData = createTitle || createDescription || createEventType ||
                    createCategory || createDate || createTime ||
                    createAddress || createCity || createOrganizer;

    if (hasData) {
      try {
        await eventFormStorage.setItem(CREATE_EVENT_FORM_KEY, formData);
      } catch (error) {
        console.error('Failed to save form draft:', error);
      }
    }
  }, [
    createTitle, createDescription, createEventType, createCategory, createStatus,
    createDate, createTime, createEndTime, createDuration, createVenueName,
    createAddress, createCity, createCountry, createPrice, createMaxGuests,
    createOrganizer, createTags, createPhotographerId, createPackageId, createEventVisibility, createBannerImagePreview
  ]);

  // Debounced auto-save when form fields change
  useEffect(() => {
    if (showCreateModal && !isRestoringDraft) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveFormDraft();
      }, 500); // Save after 500ms of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    showCreateModal, isRestoringDraft, saveFormDraft
  ]);

  // Restore saved draft when modal opens
  useEffect(() => {
    const restoreDraft = async () => {
      if (showCreateModal) {
        try {
          const savedDraft = await eventFormStorage.getItem<CreateEventFormData>(CREATE_EVENT_FORM_KEY);
          if (savedDraft) {
            setIsRestoringDraft(true);
            setCreateTitle(savedDraft.createTitle || '');
            setCreateDescription(savedDraft.createDescription || '');
            setCreateEventType(savedDraft.createEventType || '');
            setCreateCategory((savedDraft.createCategory as EventCategory) || '');
            setCreateStatus(savedDraft.createStatus || 'UPCOMING');
            setCreateDate(savedDraft.createDate || '');
            setCreateTime(savedDraft.createTime || '');
            setCreateEndTime(savedDraft.createEndTime || '');
            setCreateDuration(savedDraft.createDuration || '');
            setCreateVenueName(savedDraft.createVenueName || '');
            setCreateAddress(savedDraft.createAddress || '');
            setCreateCity(savedDraft.createCity || '');
            setCreateCountry(savedDraft.createCountry || 'Rwanda');
            setCreatePrice(savedDraft.createPrice || '');
            setCreateMaxGuests(savedDraft.createMaxGuests || '');
            setCreateOrganizer(savedDraft.createOrganizer || '');
            setCreateTags(savedDraft.createTags || []);
            setCreatePhotographerId(savedDraft.createPhotographerId || '');
            setCreatePackageId(savedDraft.createPackageId || '');
            setCreateEventVisibility(savedDraft.createEventVisibility || 'PUBLIC');
            setCreateBannerImagePreview(savedDraft.createBannerImagePreview || null);

            // Show notice that draft was restored
            setShowDraftRestoredNotice(true);
            setTimeout(() => setShowDraftRestoredNotice(false), 3000);

            // Allow auto-save after restoration is complete
            setTimeout(() => setIsRestoringDraft(false), 100);
          }
        } catch (error) {
          console.error('Failed to restore form draft:', error);
        }
      }
    };

    restoreDraft();
  }, [showCreateModal]);

  // Auto-open create modal pre-filled when redirected from landing with ?photographerId=&packageId=
  useEffect(() => {
    // Delay to ensure AuthProvider has processed the token param first
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const landingPhotographerId = params.get('photographerId');
      const landingPackageId = params.get('packageId');
      if (!landingPhotographerId) return;
      setCreatePhotographerId(landingPhotographerId);
      if (landingPackageId) setCreatePackageId(landingPackageId);
      setPhotographerAssignMode('platform');
      setShowCreateModal(true);
      // Clean params from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('photographerId');
      url.searchParams.delete('packageId');
      window.history.replaceState({}, '', url.pathname + (url.search !== '?' ? url.search : ''));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Clear saved draft from IndexedDB
  const clearFormDraft = useCallback(async () => {
    try {
      await eventFormStorage.removeItem(CREATE_EVENT_FORM_KEY);
    } catch (error) {
      console.error('Failed to clear form draft:', error);
    }
  }, []);

  const [eventCategories, setEventCategories] = useState<{ id: string; name: string }[]>([]);

  // Fetch event categories from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/remote/public/events/categories`);
        const data = await res.json();
        if (data.action === 1 && Array.isArray(data.data)) {
          setEventCategories(data.data);
        }
      } catch {
        // Fallback silently
      }
    })();
  }, []);


  // Auto-scroll to escrow/payment terms section when package is selected
  useEffect(() => {
    if (createPackageId && createPhotographerId) {
      const timer = setTimeout(() => {
        const escrowSection = document.querySelector('[data-section="escrow"]');
        if (escrowSection) {
          escrowSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [createPackageId, createPhotographerId]);

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);
  const [unpublishingEventId, setUnpublishingEventId] = useState<string | null>(null);
  const [publishConfirmEvent, setPublishConfirmEvent] = useState<Event | null>(null);
  const [unpublishConfirmEvent, setUnpublishConfirmEvent] = useState<Event | null>(null);
  // Surfaced when the backend rejects an unpublish because the event is
  // currently live. The creator has to wait for the photographer to end the
  // stream before they can take the event offline.
  const [ongoingUnpublishBlock, setOngoingUnpublishBlock] = useState<{ title: string; photographerName: string | null } | null>(null);
  const [noPhotographerEvent, setNoPhotographerEvent] = useState<Event | null>(null);
  const [pendingBookingEvent, setPendingBookingEvent] = useState<Event | null>(null);
  const [rebookEvent, setRebookEvent] = useState<Event | null>(null);
  const [noPhotoEvent, setNoPhotoEvent] = useState<Event | null>(null);

  // Fetch events using authenticated customer endpoint
  const fetchMyEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events?page=0&size=100`);

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();

      if (data.action === 1 && (data.data?.content || Array.isArray(data.data))) {
        const myEvents = data.data?.content || data.data || [];

        const mappedEvents: Event[] = myEvents.map((evt: Record<string, unknown>) => {
          const locationStr = (evt.location as string) || '';
          const lp = locationStr.split(',').map((s: string) => s.trim());
          // Handle both "Venue, Address, City, Country" (4 parts) and "Address, City, Country" (3 parts)
          const locAddress = lp.length >= 4 ? `${lp[0]}, ${lp[1]}` : (lp[0] || locationStr);
          const locCity = lp.length >= 4 ? (lp[2] || '') : (lp[1] || '');
          const locCountry = lp.length >= 4 ? (lp[3] || '') : (lp[2] || '');
          const rawPhoto = (evt.eventPhoto as string) || (evt.bannerImage as string) || (evt.coverImage as string) || '';
          const photo = normalizeImageUrl(rawPhoto) || '';
          return {
            id: (evt.id as string) || '',
            title: (evt.title as string) || 'Untitled Event',
            description: (evt.description as string) || '',
            eventType: (typeof evt.eventType === 'object' && evt.eventType !== null ? (evt.eventType as Record<string, unknown>).name as string : evt.eventType as string)
              || (typeof evt.eventCategory === 'object' && evt.eventCategory !== null ? (evt.eventCategory as Record<string, unknown>).name as string : evt.eventCategory as string)
              || (typeof evt.category === 'object' && evt.category !== null ? (evt.category as Record<string, unknown>).name as string : evt.category as string)
              || '',
            category: ((typeof evt.eventCategory === 'object' && evt.eventCategory !== null ? (evt.eventCategory as Record<string, unknown>).name as string : evt.eventCategory as string)
              || (typeof evt.category === 'object' && evt.category !== null ? (evt.category as Record<string, unknown>).name as string : evt.category as string)
              || (typeof evt.eventType === 'object' && evt.eventType !== null ? (evt.eventType as Record<string, unknown>).name as string : evt.eventType as string)
              || 'Entertainment') as EventCategory,
            date: (evt.eventDate as string) || '',
            time: (evt.startTime as string) || '',
            endTime: (evt.endTime as string) || '',
            duration: '',
            location: {
              address: locAddress,
              city: locCity,
              country: locCountry,
            },
            coverImage: photo,
            bannerImage: photo,
            price: evt.price ? `${evt.price}` : (evt.isEventFree ? 'Free' : 'Free'),
            priceCurrency: (evt.streamFeeCurrencyAbbreviation as string) || (evt.priceCurrency as string) || 'RWF',
            hasLiveStream: (evt.hasLiveStream as boolean) ?? false,
            isPublished: evt.isPublished === true,
            guestCount: (evt.guestCount as number) || 0,
            maxGuests: (evt.maxGuests as number) || 0,
            status: (() => {
              const raw = ((evt.eventStatus as string) || (evt.status as string) || 'UPCOMING').toUpperCase();
              if (raw === 'PAUSED') return 'PAUSED';
              if (evt.isPublished === true && (raw === 'UPCOMING' || raw === 'PUBLISHED')) return 'PUBLISHED';
              return raw;
            })() as EventStatus,
            organizer: (evt.eventOrganizer as string) || '',
            tags: evt.eventTags ? (evt.eventTags as string).split(',').map((t: string) => t.trim()) : [],
            hasPhotographer: !!(evt.photographerId || (evt.photographer as Record<string, unknown>)?.id),
            bookingStatus: (evt.bookingStatus as string) || undefined,
            photographerId: (evt.photographerId as string) || ((evt.photographer as Record<string, unknown>)?.id as string) || undefined,
            photographerName: (evt.photographerName as string) || `${((evt.photographer as Record<string, unknown>)?.firstName as string) || ''} ${((evt.photographer as Record<string, unknown>)?.lastName as string) || ''}`.trim() || '',
            photographerImage: (evt.photographerImage as string) || ((evt.photographer as Record<string, unknown>)?.profilePicture as string) || '',
            inviteCode: (evt.inviteCode as string) || (evt.hostId as string) || '',
            streamInviteToken: (evt.streamInviteToken as string) || undefined,
            shareLink: (() => {
              const base = `${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/events/view-event?id=${evt.id}`;
              const code = (evt.inviteCode as string) || (evt.hostId as string) || '';
              return code ? `${base}&hostId=${code}` : base;
            })(),
            completionStatus: (evt.completionStatus as string) || undefined,
            createdAt: (evt.createdAt as string) || '',
          };
        });

        // Newest-created first. ISO timestamps include milliseconds so ties
        // inside the same second break naturally by ms precision.
        mappedEvents.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setEvents(mappedEvents);
      }
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user, fetchMyEvents]);

  // Deep-link from album-detail's "Request changes" CTA:
  //   /user/client/events?requestChanges=<eventId>
  //   /user/client/events?requestChangesAlbum=<albumId>  (fallback for older builds)
  // Open the completion-confirmation modal pre-set to REQUIRE_CHANGES so the
  // client lands directly in the feedback flow instead of having to hunt for
  // the right event and re-pick the option.
  const [requestChangesConsumed, setRequestChangesConsumed] = useState(false);
  useEffect(() => {
    if (requestChangesConsumed || !searchParams) return;
    if (isLoadingEvents) return;
    const eventIdParam = searchParams.get('requestChanges');
    const albumIdParam = searchParams.get('requestChangesAlbum');
    if (!eventIdParam && !albumIdParam) return;

    let target: Event | undefined;
    if (eventIdParam) {
      target = events.find(e => e.id === eventIdParam);
    } else if (albumIdParam) {
      // Best-effort fallback: any event with an album delivered and pending
      // customer confirmation. If there's exactly one, take it; otherwise
      // leave the modal closed so the user can pick manually.
      const candidates = events.filter(e =>
        e.albumDelivered && e.completionStatus === 'PENDING_CUSTOMER_CONFIRMATION'
      );
      if (candidates.length === 1) target = candidates[0];
    }
    if (target) {
      setCompletionModalEvent(target);
      setCompletionFeedbackStatus('REQUIRE_CHANGES');
      setCompletionComment('');
    }
    setRequestChangesConsumed(true);
  }, [searchParams, isLoadingEvents, events, requestChangesConsumed]);

  // Auto-refresh events when tab regains focus (e.g. after photographer accepts on their dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchMyEvents();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchMyEvents]);

  const handlePublishEvent = async (eventId: string) => {
    if (!user) return;
    setPublishConfirmEvent(null);
    setPublishingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to publish event (${response.status})`);
      }

      setEvents(prev => prev.map(evt =>
        evt.id === eventId ? { ...evt, status: 'PUBLISHED' as EventStatus, isPublished: true } : evt
      ));
      if (activeTab === 'upcoming') setActiveTab('all');
    } catch (err) {
      console.error('Publish event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to publish event');
    } finally {
      setPublishingEventId(null);
    }
  };

  const handleUnpublishEvent = async (eventId: string) => {
    if (!user) return;
    // Capture the title before closing the confirm modal. used below if the
    // backend rejects with EVENT_ONGOING so the block modal can name it.
    const targetTitle = unpublishConfirmEvent?.title
      ?? events.find(e => e.id === eventId)?.title
      ?? 'this event';
    setUnpublishConfirmEvent(null);
    setUnpublishingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Backend returns 409 + { error: "EVENT_ONGOING", photographerName } when
        // the event is live. Show the dedicated block modal instead of platformAlert().
        if (response.status === 409 && errorData?.error === 'EVENT_ONGOING') {
          setOngoingUnpublishBlock({
            title: targetTitle,
            photographerName: errorData?.photographerName ?? null,
          });
          return;
        }
        throw new Error(errorData.message || `Failed to unpublish event (${response.status})`);
      }

      setEvents(prev => prev.map(evt =>
        evt.id === eventId ? { ...evt, status: 'UPCOMING' as EventStatus, isPublished: false } : evt
      ));
      if (activeTab === 'published') setActiveTab('all');
    } catch (err) {
      console.error('Unpublish event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to unpublish event');
    } finally {
      setUnpublishingEventId(null);
    }
  };


  // Re-fetch a single event from server and run publish pre-checks with fresh data
  const handlePublishClick = async (event: Event) => {
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}`);
      if (res.ok) {
        const json = await res.json();
        const fresh = json.data;
        if (fresh) {
          // Update local event state with fresh data
          const updatedEvent: Event = {
            ...event,
            hasPhotographer: !!((fresh.photographerId as string) || (fresh.photographer as any)?.id),
            bookingStatus: (fresh.bookingStatus as string) || undefined,
            photographerId: (fresh.photographerId as string) || (fresh.photographer as any)?.id || undefined,
            coverImage: fresh.eventPhoto || fresh.bannerImage || fresh.coverImage || event.coverImage,
          };
          setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));

          // Run publish checks with fresh data
          if (!updatedEvent.coverImage) {
            setNoPhotoEvent(updatedEvent);
          } else if (!updatedEvent.hasPhotographer) {
            setNoPhotographerEvent(updatedEvent);
          } else if (updatedEvent.bookingStatus && updatedEvent.bookingStatus.toUpperCase() !== 'ACCEPTED' && updatedEvent.bookingStatus.toUpperCase() !== 'UNASSIGNED') {
            setPendingBookingEvent(updatedEvent);
          } else {
            setPublishConfirmEvent(updatedEvent);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Failed to refresh event before publish:', err);
    }
    // Fallback: use stale data if refresh fails
    if (!event.coverImage) {
      setNoPhotoEvent(event);
    } else if (!event.hasPhotographer) {
      setNoPhotographerEvent(event);
    } else if (event.bookingStatus && event.bookingStatus.toUpperCase() !== 'ACCEPTED' && event.bookingStatus.toUpperCase() !== 'UNASSIGNED') {
      setPendingBookingEvent(event);
    } else {
      setPublishConfirmEvent(event);
    }
  };

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Baby Shower', 'Graduation', 'Anniversary', 'Engagement', 'Other'];

  const handleDeleteEvent = async () => {
    if (!deleteEvent) return;
    const eventId = deleteEvent.id;
    const wasPublished = deleteEvent.status.toUpperCase() === 'PUBLISHED';
    setDeleteEvent(null);
    setShowDeleteModal(false);
    try {
      const apiUrl = getApiUrl();
      // Unpublish first if the event is published, so it's removed from the public platform
      if (wasPublished) {
        const unpubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}/unpublish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!unpubRes.ok) {
          const errorData = await unpubRes.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to unpublish event before deletion (${unpubRes.status})`);
        }
        // Update local state to reflect unpublish
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'UPCOMING' as EventStatus } : e));
      }
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete event (${res.status})`);
      }
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Delete event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to delete event');
      // Refetch to sync state with backend
      fetchMyEvents();
    }
  };

  const isEventDeletable = (event: Event): boolean => {
    if (event.status.toUpperCase() === 'COMPLETED') return false;
    if (event.completionStatus && event.completionStatus !== 'NOT_COMPLETED') return false;
    if (event.bookingStatus?.toUpperCase() === 'ACCEPTED') return false;
    if (event.status.toUpperCase() === 'PAUSED') return false;
    return true;
  };

  const isEventPausable = (event: Event): boolean => {
    if (event.bookingStatus?.toUpperCase() !== 'ACCEPTED') return false;
    if (event.status.toUpperCase() === 'COMPLETED') return false;
    if (event.status.toUpperCase() === 'PAUSED') return false;
    return true;
  };

  const isEventResumable = (event: Event): boolean => {
    return event.status.toUpperCase() === 'PAUSED';
  };

  const handlePauseEvent = async () => {
    if (!pauseEvent) return;
    const eventId = pauseEvent.id;
    setPauseEvent(null);
    setShowPauseModal(false);
    setPausingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to pause event (${res.status})`);
      }
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'PAUSED' as EventStatus, isPublished: false } : e));
    } catch (err) {
      console.error('Pause event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to pause event');
      fetchMyEvents();
    } finally {
      setPausingEventId(null);
    }
  };

  const handleResumeEvent = async (eventId: string) => {
    setResumingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to resume event (${res.status})`);
      }
      const data = await res.json();
      const newStatus = data.data?.eventStatus?.toUpperCase() || 'UPCOMING';
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus as EventStatus } : e));
    } catch (err) {
      console.error('Resume event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to resume event');
      fetchMyEvents();
    } finally {
      setResumingEventId(null);
    }
  };

  const openEditModal = (event: Event) => {
    setEditEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description);
    setEditEventType(event.eventType);
    setEditCategory((event.category as EventCategory) || '');
    setEditStatus(event.hasLiveStream ? 'LIVE' : 'UPCOMING');
    setEditDate(event.date);
    setEditTime(event.time);
    setEditEndTime(event.endTime || '');
    setEditDuration(event.duration);
    // Parse venue name and address from location.address
    // location.address may be "Venue, Address" (from 4-part location) or just "Venue"
    const addrComma = event.location.address.indexOf(',');
    if (addrComma !== -1) {
      setEditVenueName(event.location.address.substring(0, addrComma).trim());
      setEditAddress(event.location.address.substring(addrComma + 1).trim());
    } else {
      setEditVenueName(event.location.address);
      setEditAddress('');
    }
    setEditCity(event.location.city);
    setEditCountry(event.location.country);
    setEditPrice(event.price || '');
    setEditPriceCurrency(event.priceCurrency || 'RWF');
    setEditMaxGuests(event.maxGuests.toString());
    setEditOrganizer(event.organizer || '');
    setEditTags(event.tags || []);
    setEditTagInput('');
    setEditBannerImage(event.bannerImage || null);
    setEditBannerImagePreview(event.bannerImage || null);
    setEditBannerImageFile(null);
    setEditPhotographerId(event.photographerId || '');
    setEditPhotographerAssignMode('none');
    setEditPhotographerSearchQuery('');
    setShowEditModal(true);
  };

  const handleEditEvent = async () => {
    if (!editEvent || !editTitle || !editCategory || !editDate || !editTime) return;

    // Currency-aware minimum stream access fee
    if (isEventPriceInvalid(editPrice || '', editPriceCurrency)) {
      setSubmitError(`Live Stream Access Fee must be at least ${getMinEventPriceLabel(editPriceCurrency)}.`);
      return;
    }

    // Calculate duration from start and end time
    let calculatedDuration = editDuration;
    if (editTime && editEndTime) {
      const [startHours, startMins] = editTime.split(':').map(Number);
      const [endHours, endMins] = editEndTime.split(':').map(Number);
      const startTotalMins = startHours * 60 + startMins;
      const endTotalMins = endHours * 60 + endMins;
      const durationMins = endTotalMins >= startTotalMins ? endTotalMins - startTotalMins : (24 * 60 - startTotalMins) + endTotalMins;
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      calculatedDuration = mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }

    // Format time for display
    const formatTimeDisplay = (time24: string) => {
      if (!time24) return '';
      const [hours, mins] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
    };
    const timeDisplay = editEndTime
      ? `${formatTimeDisplay(editTime)} - ${formatTimeDisplay(editEndTime)}`
      : formatTimeDisplay(editTime);

    try {
      const apiUrl = getApiUrl();
      const editNumericPrice = editPrice.replace(/[^\d]/g, '');
      const editPayload: Record<string, unknown> = {
        title: capitalizeWords(editTitle),
        description: autoCapitalize(editDescription),
        eventType: editCategory,
        eventDate: editDate,
        startTime: editTime ? parseTimeToApiString(editTime) : null,
        endTime: editEndTime ? parseTimeToApiString(editEndTime) : null,
        location: capitalizeWords([editVenueName, editAddress, editCity, editCountry].filter(Boolean).join(', ')),
        eventOrganizer: capitalizeWords(editOrganizer),
        eventTags: editTags.length > 0 ? editTags.join(',') : editCategory,
        price: editNumericPrice ? Number(editNumericPrice) : 0,
        priceCurrency: editPriceCurrency || 'RWF',
        maxGuests: editMaxGuests ? Number(editMaxGuests.replace(/[^\d]/g, '')) : 0,
      };
      const validEditPhotographerId = (editPhotographerId && isValidUUID(editPhotographerId)) ? editPhotographerId : null;
      if (validEditPhotographerId) {
        editPayload.photographerId = validEditPhotographerId;
      }
      Object.keys(editPayload).forEach(key => {
        if (editPayload[key] === undefined || editPayload[key] === null) delete editPayload[key];
      });
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${editEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPayload),
      });
      // Upload banner image if a new file was selected
      if (editBannerImageFile) {
        try {
          const photoForm = new FormData();
          photoForm.append('file', editBannerImageFile);
          await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${editEvent.id}/photo`, {
            method: 'POST',
            body: photoForm,
          });
        } catch (photoErr) {
          console.error('Failed to upload event photo:', photoErr);
        }
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || `Failed to update event: ${response.status}`);
      }
      const editResult = await response.json().catch(() => null);
      if (editResult && editResult.action === 0) {
        throw new Error(editResult.message || 'Failed to update event.');
      }
    } catch (err) {
      console.error('Edit event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to update event');
      return;
    }

    setEvents(prev => prev.map(event => {
      if (event.id === editEvent.id) {
        return {
          ...event,
          title: editTitle,
          description: editDescription,
          eventType: editCategory,
          category: editCategory,
          date: editDate,
          time: timeDisplay,
          endTime: editEndTime,
          duration: calculatedDuration,
          location: { address: [editVenueName, editAddress].filter(Boolean).join(', '), city: editCity, country: editCountry },
          coverImage: editBannerImage || event.coverImage,
          bannerImage: editBannerImage || event.bannerImage,
          price: editPrice || 'Free',
          maxGuests: parseInt(editMaxGuests) || event.maxGuests,
          organizer: editOrganizer,
          tags: editTags,
          hasPhotographer: !!(editPhotographerId && isValidUUID(editPhotographerId)),
          photographerId: (editPhotographerId && isValidUUID(editPhotographerId)) ? editPhotographerId : event.photographerId,
          photographerName: (() => {
            if (editPhotographerId && isValidUUID(editPhotographerId)) {
              const sel = pastPhotographers.find(p => p.id === editPhotographerId) || platformPhotographers.find(p => p.id === editPhotographerId);
              return sel?.name || event.photographerName || '';
            }
            return event.photographerName || '';
          })(),
          photographerImage: (() => {
            if (editPhotographerId && isValidUUID(editPhotographerId)) {
              const sel = pastPhotographers.find(p => p.id === editPhotographerId) || platformPhotographers.find(p => p.id === editPhotographerId);
              return sel?.image || event.photographerImage || '';
            }
            return event.photographerImage || '';
          })(),
        };
      }
      return event;
    }));

    setShowEditModal(false);
    setEditEvent(null);
  };

  // Reset create form
  const resetCreateForm = (clearDraft: boolean = true) => {
    setCreateTitle('');
    setCreateDescription('');
    setCreateEventType('');
    setCreateCategory('');
    setCreateStatus('UPCOMING');
    setCreateDate('');
    setCreateTime('');
    setCreateEndTime('');
    setCreateDuration('');
    setCreateVenueName('');
    setCreateAddress('');
    setCreateCity('');
    setCreateCountry('Rwanda');
    setCreatePrice('');
    setCreateMaxGuests('');
    setCreateOrganizer('');
    setCreateTags([]);
    setCreateTagInput('');
    setCreateBannerImage(null);
    setCreateBannerImagePreview(null);
    setCreateBannerImageFile(null);
    setCreatePhotographerId('');
    setCreatePackageId('');
    setPhotographerPackages([]);
    setCreateEscrowPercentage(50);
    setCreateEventVisibility('PUBLIC');
    setShowFindPhotographerModal(false);
    setPhotographerSearchQuery('');
    setPhotographerAssignMode('none');
    setInvitePhotographerEmail('');
    setIsSubmitting(false);
    setSubmitError(null);
    setDateError('');
    setTimeError('');
    // Clear saved draft from IndexedDB when explicitly requested
    if (clearDraft) {
      clearFormDraft();
    }
  };

  // Handle tag addition via Enter key
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && createTagInput.trim()) {
      e.preventDefault();
      addTagFromInput();
    }
  };

  // Add tag from input (used by both Enter key and button click)
  const addTagFromInput = () => {
    if (!createTagInput.trim()) return;
    // Remove # prefix if user typed it, store without #
    let tagValue = createTagInput.trim();
    if (tagValue.startsWith('#')) {
      tagValue = tagValue.substring(1).trim();
    }
    if (tagValue && !createTags.includes(tagValue)) {
      setCreateTags([...createTags, tagValue]);
    }
    setCreateTagInput('');
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setCreateTags(createTags.filter(tag => tag !== tagToRemove));
  };

  // Handle banner image change
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCreateBannerImage(reader.result as string);
        setCreateBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit tag handlers
  const handleEditAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editTagInput.trim()) {
      e.preventDefault();
      addEditTagFromInput();
    }
  };

  const addEditTagFromInput = () => {
    if (!editTagInput.trim()) return;
    let tagValue = editTagInput.trim();
    if (tagValue.startsWith('#')) {
      tagValue = tagValue.substring(1).trim();
    }
    if (tagValue && !editTags.includes(tagValue)) {
      setEditTags([...editTags, tagValue]);
    }
    setEditTagInput('');
  };

  const handleEditRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  // Handle edit banner image change
  const handleEditBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBannerImage(reader.result as string);
        setEditBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle create event
  const handleCreateEvent = async () => {
    // Hard gate: a cover image is required before anything else can be validated.
    if (!createBannerImageFile && !createBannerImagePreview) {
      setSubmitError('A cover image is required before an event can be created. Please upload one above.');
      return;
    }
    const missingFields: string[] = [];
    if (!createTitle) missingFields.push('Event Title');
    if (!createCategory) missingFields.push('Category');
    if (!createDate) missingFields.push('Date');
    if (!createTime) missingFields.push('Start Time');
    if (missingFields.length > 0) {
      setSubmitError(`Please fill in the required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Currency-aware minimum stream access fee
    if (isEventPriceInvalid(createPrice || '', createPriceCurrency)) {
      setSubmitError(`Live Stream Access Fee must be at least ${getMinEventPriceLabel(createPriceCurrency)}.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call the backend API
      let backendEventId: string | null = null;
      if (user) {
        const apiUrl = getApiUrl();
        const locationStr = [createVenueName, createAddress, createCity, createCountry].filter(Boolean).join(', ');
        const tagsStr = createTags.length > 0 ? createTags.join(',') : createCategory;

        const validPhotographerId = (createPhotographerId && isValidUUID(createPhotographerId)) ? createPhotographerId : null;

        const numericPrice = createPrice.replace(/[^\d]/g, '');

        const payload: Record<string, unknown> = {
          title: capitalizeWords(createTitle),
          description: autoCapitalize(createDescription || ''),
          eventType: createCategory,
          startTime: parseTimeToApiString(createTime),
          endTime: createEndTime ? parseTimeToApiString(createEndTime) : parseTimeToApiString(createTime),
          eventDate: createDate,
          location: capitalizeWords(locationStr),
          eventOrganizer: capitalizeWords(createOrganizer || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Organizer'),
          eventVisibility: createEventVisibility || 'PUBLIC',
          eventTags: tagsStr,
          price: numericPrice ? Number(numericPrice) : 0,
          priceCurrency: createPriceCurrency || 'RWF',
          maxGuests: createMaxGuests ? Number(createMaxGuests.replace(/[^\d]/g, '')) : 0,
          notes: '',
        };

        // Only include photographer/package IDs if they are valid UUIDs. sending null causes backend JPA errors
        if (validPhotographerId) {
          payload.photographerId = validPhotographerId;
        }

        if (createPackageId && isValidUUID(createPackageId)) {
          payload.packageId = createPackageId;
        }

        if (validPhotographerId && createPackageId) {
          payload.escrowPercentage = createEscrowPercentage;
        }

        // Strip any undefined/null values to prevent backend "id must not be null" errors
        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined || payload[key] === null) delete payload[key];
        });

        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          // Log field-level validation errors if available
          if (errorBody?.errors) {
            console.error('Validation errors:', errorBody.errors);
          }
          throw new Error(errorBody?.message || 'Failed to create event. Please try again.');
        }

        const responseData = await response.json();
        // Extract the real event ID from backend response
        // Response shape: { data: { event: { id }, booking } } or { data: { eventId } } or { data: { id } }
        backendEventId = responseData?.data?.event?.id || responseData?.data?.eventId || responseData?.data?.id || null;

        // Upload banner image if a file was selected
        if (createBannerImageFile && backendEventId) {
          try {
            const photoForm = new FormData();
            photoForm.append('file', createBannerImageFile);
            await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${backendEventId}/photo`, {
              method: 'POST',
              body: photoForm,
            });
          } catch (photoErr) {
            console.error('Failed to upload event photo:', photoErr);
          }
        }
      }

      // Also update local state for immediate UI feedback
      const selectedPhotographer = pastPhotographers.find(p => p.id === createPhotographerId) || platformPhotographers.find(p => p.id === createPhotographerId);

      let calculatedDuration = createDuration || '4 hours';
      if (createTime && createEndTime) {
        const startParts = createTime.split(':').map(Number);
        const endParts = createEndTime.split(':').map(Number);
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        const durationMinutes = endMinutes - startMinutes;
        if (durationMinutes > 0) {
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          calculatedDuration = minutes > 0 ? `${hours} hours ${minutes} minutes` : `${hours} hours`;
        }
      }

      const formatTimeDisplay = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
      };

      const timeDisplay = createEndTime
        ? `${formatTimeDisplay(createTime)} - ${formatTimeDisplay(createEndTime)}`
        : formatTimeDisplay(createTime);

      const newEvent: Event = {
        id: backendEventId || `evt_${Date.now()}`,
        title: createTitle,
        description: createDescription,
        eventType: createCategory,
        category: createCategory as EventCategory,
        date: createDate,
        time: timeDisplay,
        endTime: createEndTime,
        duration: calculatedDuration,
        location: {
          address: [createVenueName, createAddress].filter(Boolean).join(', '),
          city: createCity,
          country: createCountry
        },
        coverImage: createBannerImage || '',
        bannerImage: createBannerImage || '',
        price: createPrice || 'Free',
        hasLiveStream: createStatus === 'LIVE',
        isPublished: false,
        guestCount: 0,
        maxGuests: parseInt(createMaxGuests) || 100,
        status: createStatus,
        organizer: createOrganizer || 'Organizer',
        tags: createTags.length > 0 ? createTags : [createCategory],
        hasPhotographer: !!selectedPhotographer,
        photographerName: selectedPhotographer?.name,
        photographerImage: selectedPhotographer?.image,
        shareLink: `${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/events/view-event?id=${backendEventId || `evt_${Date.now()}`}`,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setEvents(prev => [newEvent, ...prev]);
      resetCreateForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Event creation error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
      case 'awaiting_review':
        return { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(245,158,11,0.30)' };
      case 'published':
        return { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(16,185,129,0.30)' };
      case 'ongoing':
      case 'live':
        return { background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(220,38,38,0.30)' };
      case 'completed':
        return { background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(8,58,133,0.30)' };
      case 'paused':
        return { background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(75,85,99,0.25)' };
      default:
        return { background: colors.bgTertiary, color: colors.textSecondary };
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase());

    const statusLower = event.status.toLowerCase();
    if (activeTab === 'upcoming') {
      return matchesSearch && (statusLower === 'upcoming' || statusLower === 'ongoing' || statusLower === 'live' || statusLower === 'paused');
    } else if (activeTab === 'published') {
      return matchesSearch && statusLower === 'published';
    } else if (activeTab === 'past') {
      return matchesSearch && (statusLower === 'completed' || statusLower === 'awaiting_review');
    }
    return matchesSearch;
  });

  const upcomingCount = events.filter(e => {
    const s = e.status.toLowerCase();
    return s === 'upcoming' || s === 'ongoing' || s === 'live' || s === 'paused';
  }).length;
  const publishedCount = events.filter(e => e.status.toLowerCase() === 'published').length;
  const completedCount = events.filter(e => {
    const s = e.status.toLowerCase();
    return s === 'completed' || s === 'awaiting_review';
  }).length;
  const pastCount = completedCount;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
            overflow-x: hidden !important;
          }
          .mobile-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .mobile-title {
            font-size: 1.5rem !important;
          }
          .mobile-subtitle {
            font-size: 0.85rem !important;
          }
          .mobile-create-btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 44px !important;
          }
          .mobile-search {
            max-width: 100% !important;
          }
          .mobile-search input {
            min-height: 44px !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .mobile-tabs {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          .mobile-tabs::-webkit-scrollbar {
            display: none !important;
          }
          .mobile-tabs button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            min-height: 40px !important;
          }
          .mobile-events-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-event-card {
            height: 380px !important;
            border-radius: 1.25rem !important;
          }
          .mobile-event-title-area {
            bottom: 8rem !important;
          }
          .mobile-event-content {
            padding: 0.6rem 0.8rem !important;
          }
          .mobile-event-actions {
            flex-wrap: wrap !important;
            gap: 0.4rem !important;
          }
          .mobile-event-actions button {
            min-height: 40px !important;
          }
          .mobile-modal-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .mobile-modal-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-title {
            font-size: 1.3rem !important;
          }
          .mobile-subtitle {
            font-size: 0.8rem !important;
          }
          .mobile-tabs button {
            font-size: 0.85rem !important;
            padding: 0.4rem 0.75rem !important;
          }
          .mobile-event-card {
            height: 350px !important;
          }
          .mobile-event-title-area {
            bottom: 7.5rem !important;
          }
          .mobile-event-content {
            padding: 0.5rem 0.7rem !important;
          }
        }
        @media (max-width: 375px) {
          .mobile-main-content {
            padding: 0.5rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-title {
            font-size: 1.2rem !important;
          }
          .mobile-subtitle {
            font-size: 0.75rem !important;
          }
          .mobile-tabs button {
            font-size: 0.75rem !important;
            padding: 0.35rem 0.5rem !important;
          }
          .mobile-event-card {
            height: 320px !important;
          }
          .mobile-event-title-area {
            bottom: 7rem !important;
          }
          .mobile-event-content {
            padding: 0.4rem 0.6rem !important;
          }
          .mobile-create-btn {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="client" />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header className="mobile-header" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            gap: 16, flexWrap: 'wrap', margin: '8px 0 22px',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
              }}>Events</div>
              <h1 className="mobile-title" style={{
                margin: 0, fontSize: '1.85rem', fontWeight: 800,
                letterSpacing: '-0.02em', color: colors.textPrimary,
              }}>My events</h1>
              <p className="mobile-subtitle" style={{
                margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary,
              }}>
                Create and manage your events.
              </p>
            </div>
            <button onClick={() => setShowBookingModeSelector(true)} className="ck-btn ck-btn-primary mobile-create-btn">
              <i className="bi bi-plus-lg" /> Create event
            </button>
          </header>

          {/* Status Summary Cards */}
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard title="Total Events" value={String(events.length)} percentage="" timeframe="" icon={<CalendarIcon />} accentColor="#083A85" />
            <StatCard title="Upcoming" value={String(upcomingCount)} percentage="" timeframe="" icon={<ClockIcon />} accentColor="#3B82F6" />
            <StatCard title="Published" value={String(publishedCount)} percentage="" timeframe="" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#10B981" strokeWidth="2"/></svg>} accentColor="#10B981" />
            <StatCard title="Completed" value={String(completedCount)} percentage="" timeframe="" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,4 12,14.01 9,11.01" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} accentColor="#8B5CF6" />
          </div>

          {/* Search */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="mobile-search" style={{ position: 'relative', maxWidth: '400px' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mobile-tabs" style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.25rem', width: 'fit-content' }}>
            {([
              { key: 'all' as const, label: 'All Events', count: events.length },
              { key: 'upcoming' as const, label: 'Upcoming', count: upcomingCount },
              { key: 'published' as const, label: 'Published', count: publishedCount },
              { key: 'past' as const, label: 'Past', count: pastCount }
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? colors.bgCard : 'transparent',
                  color: activeTab === tab.key ? colors.textPrimary : colors.textSecondary,
                  boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: activeTab === tab.key ? '#083A85' : colors.bgTertiary,
                  color: activeTab === tab.key ? 'white' : colors.textSecondary,
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {isLoadingEvents ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
              <div style={{
                width: '40px', height: '40px', border: `4px solid ${colors.borderPrimary}`,
                borderTopColor: '#083A85', borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : eventsError ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: colors.bgCard, borderRadius: '0.75rem' }}>
              <p style={{ color: '#DC2626', marginBottom: '0.5rem' }}>{eventsError}</p>
              <button
                onClick={() => fetchMyEvents()}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '0.5rem',
                  backgroundColor: '#083A85', color: '#fff', border: 'none',
                  cursor: 'pointer', fontWeight: '600'
                }}
              >
                Retry
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '1rem', color: colors.textSecondary }}>No events found.</p>
              <button
                onClick={() => setShowBookingModeSelector(true)}
                style={{
                  marginTop: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#083A85',
                  color: 'white',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <PlusIcon />
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="mobile-events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              {filteredEvents.map((event) => (
                <div key={event.id} className="mobile-event-card" style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                  {/* Blurred cover image = glow effect */}
                  <img src={event.coverImage || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                  {/* Inner card. clickable to view */}
                  <div
                    onClick={() => setShowEventDetails(event)}
                    style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    {/* Full-bleed cover image */}
                    <img src={event.coverImage || '/coverr.jpg'} alt={event.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                    {/* TOP: status badge + event type badge */}
                    <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', right: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                      <div style={{ ...getStatusBadgeStyle(event.status), padding: '4px 10px', borderRadius: 9999, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(255,255,255,0.18)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff', boxShadow: '0 0 0 2px rgba(255,255,255,0.30)' }} />
                        {event.status.toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'white', padding: '4px 10px', borderRadius: 9999, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.18)' }}>
                        {event.eventType}
                      </div>
                    </div>

                    {/* MIDDLE-BOTTOM: event title + category */}
                    <div className="mobile-event-title-area" style={{ position: 'absolute', bottom: '9rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '0.2rem' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.category}</div>
                    </div>

                    {/* FOOTER BAR: frosted glass */}
                    <div onClick={(e) => e.stopPropagation()} className="mobile-event-content" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                      {/* Info rows */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>
                          <CalendarIcon />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>
                            <ClockIcon />
                            <span>{event.time}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                        {(event.location.city || event.location.country) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
                            <LocationIcon />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location.city}{event.location.city && event.location.country ? ', ' : ''}{event.location.country}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
                          <UsersIcon />
                          <span>{event.guestCount}/{event.maxGuests}</span>
                        </div>
                        {event.hasPhotographer && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
                            <CameraIcon />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{event.photographerName}</span>
                          </div>
                        )}
                      </div>
                      {/* Action buttons. always 4 buttons: Share, Edit, Delete, Publish/Unpublish */}
                      <div className="mobile-event-actions" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => { setShareEvent(event); setShowShareModal(true); }} title="Share" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.5rem', background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 9, cursor: 'pointer', backdropFilter: 'blur(6px)', transition: 'background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}>
                          <ShareIcon />
                        </button>
                        <button onClick={() => openEditModal(event)} title="Edit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.5rem', background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 9, cursor: 'pointer', backdropFilter: 'blur(6px)', transition: 'background 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}>
                          <EditIcon />
                        </button>
                        {event.bookingStatus?.toUpperCase() === 'REJECTED' && (
                          <>
                            <button onClick={() => setRebookEvent(event)} title="Rebook another photographer" style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.6rem', background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em', boxShadow: '0 4px 10px rgba(8,58,133,0.30)', transition: 'transform 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                              <i className="bi bi-arrow-repeat" style={{ fontSize: 13 }} /> Rebook
                            </button>
                            <button onClick={() => handleConvertToHybrid(event)} disabled={convertingHybridId === event.id} title="Broadcast to nearby photographers (Hybrid)" style={{ flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.6rem', background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 130%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: convertingHybridId === event.id ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em', boxShadow: '0 4px 10px rgba(242,12,143,0.30)', transition: 'transform 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                              {convertingHybridId === event.id ? <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} /> : <><i className="bi bi-broadcast" style={{ fontSize: 13 }} /> Match Nearby</>}
                            </button>
                          </>
                        )}
                        {(!event.photographerId || event.bookingMode === 'HYBRID' || (event.status as string) === 'PUBLISHED_PENDING_ASSIGNMENT') && (
                          <button onClick={() => setCandidateModalEvent(event)} title="View candidate photographers" style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.6rem', background: 'rgba(8,58,133,0.12)', color: '#083A85', border: '1px solid rgba(8,58,133,0.25)', borderRadius: 9, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                            <i className="bi bi-people" style={{ fontSize: 13 }} /> Candidates
                          </button>
                        )}
                        {isEventDeletable(event) && (
                          <button onClick={() => { setDeleteEvent(event); setShowDeleteModal(true); }} title="Delete" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.5rem', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: 'pointer', boxShadow: '0 4px 10px rgba(220,38,38,0.30)', transition: 'transform 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                            <TrashIcon />
                          </button>
                        )}
                        {isEventPausable(event) && (
                          <button onClick={() => { setPauseEvent(event); setShowPauseModal(true); }} title="Pause" disabled={pausingEventId === event.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.5rem', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: pausingEventId === event.id ? 'not-allowed' : 'pointer', opacity: pausingEventId === event.id ? 0.7 : 1, boxShadow: '0 4px 10px rgba(245,158,11,0.30)', transition: 'transform 0.15s' }} onMouseEnter={(e) => { if (pausingEventId !== event.id) e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                            {pausingEventId === event.id ? <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} /> : <i className="bi bi-pause-fill" style={{ fontSize: '1rem' }}></i>}
                          </button>
                        )}
                        {isEventResumable(event) && (
                          <button onClick={() => handleResumeEvent(event.id)} title="Resume" disabled={resumingEventId === event.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.5rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: resumingEventId === event.id ? 'not-allowed' : 'pointer', opacity: resumingEventId === event.id ? 0.7 : 1, boxShadow: '0 4px 10px rgba(16,185,129,0.30)', transition: 'transform 0.15s' }} onMouseEnter={(e) => { if (resumingEventId !== event.id) e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                            {resumingEventId === event.id ? <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} /> : <i className="bi bi-play-fill" style={{ fontSize: '1rem' }}></i>}
                          </button>
                        )}
                        {event.status.toUpperCase() !== 'COMPLETED' && (
                          (event.isPublished || event.status.toUpperCase() === 'PUBLISHED' || event.status.toUpperCase() === 'ONGOING') ? (
                            <button onClick={() => {
                              // Short-circuit straight to the block modal when the event is live.
                              // Backend will reject the unpublish anyway, so skip the "Are you sure?"
                              // prompt and tell the creator what they actually need to do.
                              if (event.status.toUpperCase() === 'ONGOING') {
                                setOngoingUnpublishBlock({
                                  title: event.title,
                                  photographerName: event.photographerName || null,
                                });
                              } else {
                                setUnpublishConfirmEvent(event);
                              }
                            }} disabled={unpublishingEventId === event.id} style={{ flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.6rem', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: unpublishingEventId === event.id ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 700, opacity: unpublishingEventId === event.id ? 0.7 : 1, boxShadow: '0 4px 10px rgba(245,158,11,0.30)', letterSpacing: '-0.005em', transition: 'transform 0.15s' }} onMouseEnter={(e) => { if (unpublishingEventId !== event.id) e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                              {unpublishingEventId === event.id ? (
                                <><span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} /> Unpublishing…</>
                              ) : (
                                <><i className="bi bi-eye-slash-fill" style={{ fontSize: 12 }} /> Unpublish</>
                              )}
                            </button>
                          ) : (
                            <button onClick={() => handlePublishClick(event)} disabled={publishingEventId === event.id} style={{ flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.6rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9, cursor: publishingEventId === event.id ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 700, opacity: publishingEventId === event.id ? 0.7 : 1, boxShadow: '0 4px 10px rgba(16,185,129,0.30)', letterSpacing: '-0.005em', transition: 'transform 0.15s' }} onMouseEnter={(e) => { if (publishingEventId !== event.id) e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                              {publishingEventId === event.id ? (
                                <><span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff' }} /> Publishing…</>
                              ) : (
                                <><i className="bi bi-broadcast" style={{ fontSize: 12 }} /> Publish</>
                              )}
                            </button>
                          )
                        )}
                        {event.completionStatus === 'PENDING_CUSTOMER_CONFIRMATION' && event.albumDelivered && (
                          <button onClick={() => { setCompletionModalEvent(event); setCompletionFeedbackStatus('COMPLETED'); setCompletionComment(''); }} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem 0.5rem', backgroundColor: '#7C3AED', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Confirm Completion
                          </button>
                        )}
                        {event.completionStatus === 'PENDING_CUSTOMER_CONFIRMATION' && !event.albumDelivered && (
                          <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem 0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '0.375rem', fontSize: '0.65rem', fontWeight: 500, textAlign: 'center', lineHeight: '1.2' }}>
                            Waiting for album delivery
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completion Confirmation Modal */}
      <Modal isOpen={!!completionModalEvent} onClose={() => setCompletionModalEvent(null)} title="Confirm Event Completion" maxWidth="480px">
        {completionModalEvent && (
          <div>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1rem', lineHeight: 1.5 }}>
              The photographer has marked <strong>{completionModalEvent.title}</strong> as complete. Was everything submitted satisfactorily?
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div
                onClick={() => setCompletionFeedbackStatus('COMPLETED')}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${completionFeedbackStatus === 'COMPLETED' ? '#10B981' : colors.borderPrimary}`,
                  backgroundColor: completionFeedbackStatus === 'COMPLETED' ? (actualTheme === 'dark' ? '#064E3B' : '#ECFDF5') : colors.bgTertiary,
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>&#10003;</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: completionFeedbackStatus === 'COMPLETED' ? '#10B981' : colors.textPrimary }}>Completed</div>
                <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.15rem' }}>Everything looks good</div>
              </div>
              <div
                onClick={() => setCompletionFeedbackStatus('REQUIRE_CHANGES')}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${completionFeedbackStatus === 'REQUIRE_CHANGES' ? '#F59E0B' : colors.borderPrimary}`,
                  backgroundColor: completionFeedbackStatus === 'REQUIRE_CHANGES' ? (actualTheme === 'dark' ? '#78350F' : '#FFFBEB') : colors.bgTertiary,
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>&#9998;</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: completionFeedbackStatus === 'REQUIRE_CHANGES' ? '#F59E0B' : colors.textPrimary }}>Require Changes</div>
                <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.15rem' }}>Something needs to be fixed</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: colors.textSecondary, marginBottom: '0.25rem', display: 'block' }}>
                Comment {completionFeedbackStatus === 'COMPLETED' ? '(optional)' : ''}
              </label>
              <textarea
                value={completionComment}
                onChange={e => setCompletionComment(e.target.value)}
                placeholder={completionFeedbackStatus === 'REQUIRE_CHANGES' ? 'Describe what needs to be changed...' : 'Any additional feedback...'}
                rows={3}
                style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.85rem', color: colors.textPrimary, backgroundColor: colors.bgCard, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setCompletionModalEvent(null)} style={{ padding: '0.6rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                disabled={completionSubmitting}
                onClick={async () => {
                  // For COMPLETED, route through the satisfaction survey
                  // first - the survey submission is what releases the
                  // remaining held funds on the backend (see
                  // ClientSurveyService.submitSurvey -> releaseSurveyHeldFunds).
                  // For REQUIRE_CHANGES, skip the survey and just submit
                  // the feedback so the photographer can iterate.
                  if (completionFeedbackStatus === 'COMPLETED') {
                    setSurveyForEvent(completionModalEvent);
                    setCompletionModalEvent(null);
                    return;
                  }
                  setCompletionSubmitting(true);
                  try {
                    const apiUrl = getApiUrl();
                    const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${completionModalEvent.id}/confirm-completion`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: completionFeedbackStatus, comment: completionComment || null }),
                    });
                    if (res.ok) {
                      setEvents(prev => prev.map(e => e.id === completionModalEvent.id ? { ...e, completionStatus: 'PENDING_CUSTOMER_CONFIRMATION' } : e));
                      setCompletionModalEvent(null);
                    } else {
                      const err = await res.json().catch(() => null);
                      platformAlert(err?.message || 'Failed to submit feedback');
                    }
                  } catch {
                    platformAlert('Network error. Please try again.');
                  } finally {
                    setCompletionSubmitting(false);
                  }
                }}
                style={{
                  padding: '0.6rem 1rem', border: 'none', borderRadius: '0.5rem',
                  background: completionFeedbackStatus === 'COMPLETED' ? '#10B981' : '#F59E0B',
                  color: 'white', fontSize: '0.85rem', fontWeight: 600,
                  cursor: completionSubmitting ? 'not-allowed' : 'pointer',
                  opacity: completionSubmitting ? 0.7 : 1,
                }}
              >
                {completionSubmitting ? 'Submitting...' : (completionFeedbackStatus === 'COMPLETED' ? 'Continue to survey' : 'Request Changes')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Satisfaction Survey - the 6-question form gates the final
          escrow release. After submit (or dispute), call confirm-completion
          so the event's completionStatus reflects the outcome and
          downstream notifications fire correctly. */}
      {surveyForEvent && (
        <SatisfactionSurveyModal
          isOpen={!!surveyForEvent}
          onClose={() => setSurveyForEvent(null)}
          eventId={surveyForEvent.id}
          eventName={surveyForEvent.title}
          photographerName={surveyForEvent.photographerName || ''}
          onSurveyComplete={async (disputeFlagged, surveyComment) => {
            const ev = surveyForEvent;
            try {
              const apiUrl = getApiUrl();
              // Survey backend already releases escrow; this endpoint
              // updates the event's completion-feedback fields so the
              // event card / status badge reflects the outcome.
              // For COMPLETED path the user reached the survey directly
              // (no completion-modal comment), so surface the survey's
              // own issuesDescription instead of the empty modal comment.
              await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${ev.id}/confirm-completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: disputeFlagged ? 'REQUIRE_CHANGES' : 'COMPLETED',
                  comment: surveyComment || completionComment || null,
                }),
              });
              setEvents(prev => prev.map(e =>
                e.id === ev.id
                  ? {
                      ...e,
                      status: disputeFlagged ? e.status : 'AWAITING_REVIEW' as EventStatus,
                      completionStatus: disputeFlagged ? 'PENDING_CUSTOMER_CONFIRMATION' : 'COMPLETED',
                    }
                  : e
              ));
            } catch {
              // Survey persisted on the backend; failure of the
              // confirm-completion mirror is recoverable by refresh.
            } finally {
              setSurveyForEvent(null);
              setCompletionComment('');
            }
          }}
        />
      )}

      {/* Create Event Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { resetCreateForm(false); setShowCreateModal(false); }} title="Create New Event" maxWidth="700px">
        <div>
          {/* Draft Restored Notice */}
          {showDraftRestoredNotice && (
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #10B981',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ color: '#047857', fontSize: '0.875rem', fontWeight: '500' }}>
                Your previous draft has been restored
              </span>
            </div>
          )}
          {/* Section: Event Image */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(8,58,133,0.10)',
                border: '1px solid rgba(8,58,133,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className="bi bi-camera-fill" style={{ fontSize: 13, color: '#083A85' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Visuals</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Event image</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Banner image (1200×800) <span style={{ color: '#DC2626' }}>*</span></label>
              <div
                onClick={(e) => { if (!createBannerImagePreview) { (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null)?.click(); } }}
                style={{
                  border: `1.5px dashed ${(!createBannerImagePreview) ? (submitError ? '#DC2626' : 'rgba(242,12,143,0.55)') : (actualTheme === 'dark' ? 'rgba(99,162,255,0.45)' : 'rgba(8,58,133,0.32)')}`,
                  borderRadius: 12,
                  height: 170,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: createBannerImagePreview
                    ? 'transparent'
                    : (actualTheme === 'dark'
                        ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.06) 100%)'
                        : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.03) 100%)'),
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.18s, background 0.18s',
                }}
              >
                {createBannerImagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image src={createBannerImagePreview} alt="Banner" fill style={{ objectFit: 'cover' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setCreateBannerImage(null); setCreateBannerImagePreview(null); setCreateBannerImageFile(null); }}
                      title="Remove image"
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'rgba(0,0,0,0.65)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.35)',
                        borderRadius: 9, width: 30, height: 30,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <i className="bi bi-trash3" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <input type="file" accept="image/*" onChange={handleBannerImageChange} style={{ display: 'none' }} />
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: '#fff',
                      border: '1px solid rgba(8,58,133,0.20)',
                      boxShadow: '0 4px 10px rgba(8,58,133,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 20, color: '#083A85' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                        Upload banner image
                      </div>
                      <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginTop: 2 }}>
                        Click to choose · 1200×800 · PNG or JPG
                      </div>
                    </div>
                  </label>
                )}
              </div>
              {!createBannerImagePreview && (
                <div style={{
                  marginTop: 8,
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: '0.74rem', fontWeight: 600,
                  color: '#F20C8F',
                  letterSpacing: '-0.005em',
                }}>
                  <i className="bi bi-info-circle-fill" style={{ fontSize: 11 }} />
                  A cover image is required before this event can be created.
                </div>
              )}
            </div>
          </div>

          {/* Section: Basic Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(242,12,143,0.10)',
                border: '1px solid rgba(242,12,143,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className="bi bi-pencil-fill" style={{ fontSize: 13, color: '#F20C8F' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Overview</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Basic information</span>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Title *</label>
              <input type="text" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g., APR BBC Vs Espoir BCC" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
            </div>
            <div className="mobile-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Category *</label>
                <select value={createCategory} onChange={(e) => setCreateCategory(e.target.value as EventCategory)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: colors.bgCard, color: colors.textPrimary, cursor: 'pointer' }}>
                  <option value="">Select category</option>
                  {eventCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Type Status</label>
                <div
                  onMouseEnter={() => setStatusFieldHovered(true)}
                  onMouseLeave={() => setStatusFieldHovered(false)}
                  style={{ position: 'relative', width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: colors.bgSecondary, color: colors.textSecondary, cursor: 'not-allowed', boxSizing: 'border-box' }}>
                  {createStatus === 'LIVE' ? 'Live Event' : 'Upcoming'}
                  {statusFieldHovered && (
                    <span style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: colors.textSecondary }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Date & Time */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-calendar-event-fill" style={{ fontSize: 13, color: '#F59E0B' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Schedule</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Date &amp; time</span>
              </div>
            </div>
            <div className="mobile-modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Date *</label>
                <input type="date" value={createDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => { setDateError(''); setCreateDate(e.target.value); }} style={{ width: '100%', padding: '0.625rem', border: dateError ? '2px solid #DC2626' : '2px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                {dateError && <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>{dateError}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Start Time *</label>
                <input type="time" value={createTime} onChange={(e) => { setTimeError(''); setCreateTime(e.target.value); }} style={{ width: '100%', padding: '0.625rem', border: timeError ? '2px solid #DC2626' : '2px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                {timeError && <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>{timeError}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>End Time</label>
                <input type="time" value={createEndTime} onChange={(e) => setCreateEndTime(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-geo-alt-fill" style={{ fontSize: 13, color: '#10B981' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Venue</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Location</span>
              </div>
            </div>
            <div className="mobile-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Venue Name *</label>
                <input type="text" value={createVenueName} onChange={(e) => setCreateVenueName(e.target.value.replace(/,/g, ''))} placeholder="e.g., BK Arena" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Location Address *</label>
                <input type="text" value={createAddress} onChange={(e) => setCreateAddress(e.target.value.replace(/,/g, ''))} placeholder="e.g., KN 4 Ave" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
            </div>
          </div>

          {/* Section: Capacity */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-people-fill" style={{ fontSize: 13, color: '#3B82F6' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Attendance</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Capacity</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Expected Attendees *</label>
              <input type="number" value={createMaxGuests} onChange={(e) => setCreateMaxGuests(e.target.value)} placeholder="e.g., 500" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
            </div>
          </div>

          {/* Section: Organizer */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-building" style={{ fontSize: 13, color: '#7C3AED' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Host</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Organizer</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Organizer Name *</label>
              <input type="text" value={createOrganizer} onChange={(e) => setCreateOrganizer(e.target.value)} placeholder="e.g., Rwanda Basketball Federation" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
            </div>
          </div>

          {/* Section: Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(8,58,133,0.10)', border: '1px solid rgba(8,58,133,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-file-text-fill" style={{ fontSize: 13, color: '#083A85' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>About</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Description</span>
              </div>
            </div>
            <textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Describe your event in detail…" style={{ width: '100%', padding: '0.7rem 0.95rem', border: `1.5px solid ${colors.borderPrimary}`, borderRadius: 11, fontSize: '0.9rem', minHeight: 110, resize: 'vertical', color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none' }} />
          </div>

          {/* Section: Tags */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(242,12,143,0.10)', border: '1px solid rgba(242,12,143,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-hash" style={{ fontSize: 14, color: '#F20C8F' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Discovery</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Hash tags</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" value={createTagInput} onChange={(e) => setCreateTagInput(e.target.value)} onKeyPress={handleAddTag} placeholder="Add hash tags" style={{ flex: 1, padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                <button type="button" onClick={addTagFromInput} style={{ padding: '0.625rem 1rem', backgroundColor: '#083A85', color: 'white', border: '2px solid #062a63', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
              {createTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {createTags.map((tag, index) => (
                    <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.375rem 0.625rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '500' }}>
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', padding: 0, display: 'flex', alignItems: 'center', fontSize: '14px' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Photographer Assignment */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(8,58,133,0.10)', border: '1px solid rgba(8,58,133,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-camera2" style={{ fontSize: 14, color: '#083A85' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coverage</div>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Photographer assignment</span>
              </div>
              <span style={{
                fontSize: '0.66rem', fontWeight: 700,
                color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 999,
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`,
              }}>Optional</span>
            </div>

            {/* Assignment option buttons */}
            {photographerAssignMode === 'none' && !createPhotographerId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button type="button" onClick={() => { setShowCreateModal(false); setShowHybridWizard(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '2px solid rgba(242,12,143,0.35)', borderRadius: '0.5rem', background: 'linear-gradient(135deg, rgba(242,12,143,0.04) 0%, rgba(8,58,133,0.04) 100%)', color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2" stroke="#F20C8F" strokeWidth="2"/><path d="M16.24 7.76C17.5 9.02 18.25 10.7 18.25 12.5C18.25 14.3 17.5 15.98 16.24 17.24" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round"/><path d="M7.76 16.24C6.5 14.98 5.75 13.3 5.75 11.5C5.75 9.7 6.5 8.02 7.76 6.76" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round"/></svg>
                  Let Connekyt match verified nearby photographers (Hybrid • Recommended)
                </button>
                <button type="button" onClick={() => setPhotographerAssignMode('existing')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Assign an existing Photographer you worked with before
                </button>
                <button type="button" onClick={() => setShowFindPhotographerModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Assign a new Photographer from platform
                </button>
                <button type="button" onClick={() => setPhotographerAssignMode('invite')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Invite and assign a new Photographer on platform
                </button>
              </div>
            )}

            {/* Existing photographer selection */}
            {photographerAssignMode === 'existing' && (
              <div>
                <input type="text" value={photographerSearchQuery} onChange={(e) => setPhotographerSearchQuery(e.target.value)} placeholder="Search photographers..." style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, backgroundColor: colors.bgCard, marginBottom: '0.5rem' }} />
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.5rem' }}>
                  {pastPhotographers.filter(p => p.name.toLowerCase().includes(photographerSearchQuery.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => { setCreatePhotographerId(p.id); setPhotographerAssignMode('none'); setPhotographerSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', cursor: 'pointer', borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: createPhotographerId === p.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                        {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>{p.name.charAt(0)}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{p.speciality}</div>
                      </div>
                    </div>
                  ))}
                  {pastPhotographers.filter(p => p.name.toLowerCase().includes(photographerSearchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>No photographers found</div>
                  )}
                </div>
                <button type="button" onClick={() => { setPhotographerAssignMode('none'); setPhotographerSearchQuery(''); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', background: 'transparent', color: colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            )}

            {/* Platform photographer browse */}
            {photographerAssignMode === 'platform' && (
              <div>
                <input type="text" value={photographerSearchQuery} onChange={(e) => setPhotographerSearchQuery(e.target.value)} placeholder="Search platform photographers..." style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, backgroundColor: colors.bgCard, marginBottom: '0.5rem' }} />
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.5rem' }}>
                  {platformPhotographers.filter(p => p.name.toLowerCase().includes(photographerSearchQuery.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => { setCreatePhotographerId(p.id); setPhotographerAssignMode('none'); setPhotographerSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', cursor: 'pointer', borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: createPhotographerId === p.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                        {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>{p.name.charAt(0)}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{p.speciality}</div>
                      </div>
                    </div>
                  ))}
                  {platformPhotographers.filter(p => p.name.toLowerCase().includes(photographerSearchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>No photographers found on platform.</div>
                  )}
                </div>
                <button type="button" onClick={() => { setPhotographerAssignMode('none'); setPhotographerSearchQuery(''); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', background: 'transparent', color: colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            )}

            {/* Invite photographer by email */}
            {photographerAssignMode === 'invite' && (
              <div>
                <p style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.5rem' }}>Send an invitation email to a photographer to join the platform.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="email" value={invitePhotographerEmail} onChange={(e) => { setInvitePhotographerEmail(e.target.value); setInviteError(null); }} placeholder="photographer@email.com" style={{ flex: 1, padding: '0.625rem', border: `2px solid ${inviteError ? '#EF4444' : colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, backgroundColor: colors.bgCard }} />
                  <button type="button" onClick={async () => {
                    if (!invitePhotographerEmail.trim()) {
                      setInviteError('Please enter a valid email address');
                      return;
                    }
                    setIsSendingInvite(true);
                    setInviteError(null);
                    try {
                      const apiUrl = getApiUrl();
                      const response = await dashboardAuthFetch(
                        `${apiUrl}/api/remote/customer/photographers/invite?email=${encodeURIComponent(invitePhotographerEmail.trim())}`,
                        { method: 'POST' }
                      );
                      const result = await response.json();
                      if (!response.ok || result.action === 0) {
                        throw new Error(result.message || 'Failed to invite photographer');
                      }
                      setInvitePhotographerEmail('');
                      setInviteError(null);
                      setPhotographerAssignMode('none');
                      setShowCreateModal(false);
                      setShowInviteSuccessModal(true);
                    } catch (err) {
                      console.error('Invite photographer error:', err);
                      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation. Please try again.');
                    } finally {
                      setIsSendingInvite(false);
                    }
                  }} disabled={isSendingInvite || !invitePhotographerEmail.trim()} style={{ padding: '0.625rem 1rem', backgroundColor: (!invitePhotographerEmail.trim() || isSendingInvite) ? '#9CA3AF' : '#083A85', color: 'white', border: '2px solid #062a63', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: (!invitePhotographerEmail.trim() || isSendingInvite) ? 'not-allowed' : 'pointer' }}>{isSendingInvite ? 'Sending...' : 'Send Invite'}</button>
                </div>
                {inviteError && (
                  <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.375rem' }}>{inviteError}</p>
                )}
                <button type="button" onClick={() => { setPhotographerAssignMode('none'); setInvitePhotographerEmail(''); setInviteError(null); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', background: 'transparent', color: colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            )}

            {/* Selected photographer display */}
            {createPhotographerId && photographerAssignMode === 'none' && (() => {
              const selected = pastPhotographers.find(p => p.id === createPhotographerId) || platformPhotographers.find(p => p.id === createPhotographerId);
              return selected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', border: `2px solid #083A85`, borderRadius: '0.5rem', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                    {selected.image ? <img src={selected.image} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>{selected.name.charAt(0)}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{selected.name}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{selected.speciality}</div>
                  </div>
                  <button type="button" onClick={() => setCreatePhotographerId('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1.1rem', padding: '0.25rem' }} title="Remove photographer">×</button>
                </div>
              ) : null;
            })()}

            {/* Package Selection */}
            {createPhotographerId && photographerAssignMode === 'none' && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Select a Package <span style={{ color: '#DC2626' }}>*</span></span>
                  {packagesLoading && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Loading...</span>}
                </div>
                {packagesError && (
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '0.375rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    {packagesError}
                  </div>
                )}
                {!packagesLoading && photographerPackages.length === 0 && !packagesError && (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem', border: `1px dashed ${colors.borderPrimary}`, borderRadius: '0.5rem' }}>
                    No packages available for this photographer
                  </div>
                )}
                {photographerPackages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {photographerPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setCreatePackageId(pkg.id)}
                        style={{
                          padding: '0.75rem',
                          border: `2px solid ${createPackageId === pkg.id ? '#083A85' : colors.borderPrimary}`,
                          borderRadius: '0.5rem',
                          backgroundColor: createPackageId === pkg.id
                            ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                            : colors.bgTertiary,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                          {pkg.packageName}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#083A85', marginBottom: '0.25rem' }}>
                          {formatPrice(pkg.price, pkg.currencyAbbreviation || undefined)}
                        </div>
                        {pkg.durationHours > 0 && (
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
                            {pkg.durationHours} hour{pkg.durationHours !== 1 ? 's' : ''}
                          </div>
                        )}
                        {(pkg.includedPhotos > 0 || pkg.includedVideos > 0) && (
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
                            {pkg.includedPhotos > 0 && <span>{pkg.includedPhotos} photos</span>}
                            {pkg.includedPhotos > 0 && pkg.includedVideos > 0 && <span> &middot; </span>}
                            {pkg.includedVideos > 0 && <span>{pkg.includedVideos} videos</span>}
                          </div>
                        )}
                        {pkg.description && (
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, lineHeight: '1.3' }}>
                            {pkg.description.length > 80 ? pkg.description.slice(0, 80) + '...' : pkg.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Escrow / Payment Milestone Selector. shown when photographer + package selected */}
          {createPhotographerId && createPackageId && (
            <div data-section="escrow" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Payment Terms</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Choose how much to pay upfront. All funds are held in escrow and released upon event completion.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {([50, 70, 100] as const).map(pct => (
                  <div
                    key={pct}
                    onClick={() => setCreateEscrowPercentage(pct)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      border: `2px solid ${createEscrowPercentage === pct ? '#083A85' : colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      backgroundColor: createEscrowPercentage === pct
                        ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                        : colors.bgTertiary,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: createEscrowPercentage === pct ? '#083A85' : colors.textPrimary, marginBottom: '0.25rem' }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: colors.textSecondary, lineHeight: 1.3 }}>
                      {pct === 100 ? 'Full upfront' : `${pct}% upfront + ${100 - pct}% on completion`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div style={{
              padding: '0.7rem 0.95rem',
              background: actualTheme === 'dark' ? 'rgba(220,38,38,0.10)' : '#FEF2F2',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.32)' : '#FECACA'}`,
              color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
              borderRadius: 10, fontSize: '0.85rem', marginBottom: '0.75rem',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: `1px solid ${colors.borderPrimary}`, marginBottom: '4rem' }}>
            <button
              onClick={() => { resetCreateForm(); setShowCreateModal(false); }}
              className="ck-btn ck-btn-soft"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEvent}
              disabled={isSubmitting || (!createBannerImageFile && !createBannerImagePreview)}
              title={(!createBannerImageFile && !createBannerImagePreview) ? 'Upload a cover image to continue' : undefined}
              style={{
                padding: '0.65rem 1.3rem',
                borderRadius: 11,
                border: 'none',
                background: (isSubmitting || (!createBannerImageFile && !createBannerImagePreview))
                  ? colors.bgTertiary
                  : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: (isSubmitting || (!createBannerImageFile && !createBannerImagePreview)) ? colors.textSecondary : '#fff',
                fontSize: '0.9rem', fontWeight: 700,
                cursor: (isSubmitting || (!createBannerImageFile && !createBannerImagePreview)) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || (!createBannerImageFile && !createBannerImagePreview)) ? 0.7 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: (isSubmitting || (!createBannerImageFile && !createBannerImagePreview)) ? 'none' : '0 6px 18px rgba(242,12,143,0.28)',
                letterSpacing: '-0.005em',
                transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
              }}
              onMouseEnter={(e) => { if (!isSubmitting && (createBannerImageFile || createBannerImagePreview)) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isSubmitting ? (
                <>
                  <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  Creating…
                </>
              ) : (!createBannerImageFile && !createBannerImagePreview) ? (
                <>
                  <i className="bi bi-image-fill" style={{ fontSize: 13 }} />
                  Cover image required
                </>
              ) : (
                <>
                  <i className="bi bi-calendar-plus-fill" style={{ fontSize: 13 }} />
                  Create event
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Find New Photographer Redirect Prompt */}
      {showFindPhotographerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
        }} onClick={() => setShowFindPhotographerModal(false)}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
          }} onClick={(e) => e.stopPropagation()}>

            {/* Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="10,17 15,12 10,7" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="15" y1="12" x2="3" y2="12" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
              Find a New Photographer
            </h3>

            {/* Description */}
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem', lineHeight: '1.5' }}>
              You are about to be redirected to the photographers page where you can browse and book a new photographer for your event.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowFindPhotographerModal(false)}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  backgroundColor: 'transparent',
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL as string;
                  window.open(`${landingUrl}/user/photographers`, '_blank');
                  setShowFindPhotographerModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowEventDetails(null)}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0 0 0.75rem 0.75rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Cover Image with overlay */}
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden', backgroundColor: showEventDetails.coverImage ? 'transparent' : '#0D1B2A' }}>
              <img src={showEventDetails.coverImage || '/coverr.jpg'} alt={showEventDetails.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: showEventDetails.coverImage ? 'cover' : 'contain', objectPosition: 'center' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
              {showEventDetails.coverImage && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13, 27, 42, 0.3)' }} />
              )}
              {/* Close Button */}
              <button
                onClick={() => setShowEventDetails(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textPrimary,
                  zIndex: 5,
                  transition: 'all 0.2s'
                }}
              >
                <CloseIcon />
              </button>
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                ...getStatusBadgeStyle(showEventDetails.status),
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                zIndex: 5
              }}>
                {showEventDetails.status}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, marginBottom: '0.75rem' }}>
              {showEventDetails.title}
            </h2>

            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: '1.6', marginBottom: '1.25rem' }}>
              {showEventDetails.description}
            </p>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                  <CalendarIcon />
                  <span style={{ fontSize: '0.8rem' }}>Date & Time</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                  {formatDate(showEventDetails.date)} at {showEventDetails.time}
                </div>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                  <ClockIcon />
                  <span style={{ fontSize: '0.8rem' }}>Duration</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>{showEventDetails.duration}</div>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                  <LocationIcon />
                  <span style={{ fontSize: '0.8rem' }}>Location</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                  {showEventDetails.location.address}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                  {showEventDetails.location.city}, {showEventDetails.location.country}
                </div>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                  <UsersIcon />
                  <span style={{ fontSize: '0.8rem' }}>Guests</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                  {showEventDetails.guestCount} / {showEventDetails.maxGuests} confirmed
                </div>
              </div>
            </div>

            {/* Photographer Info */}
            {showEventDetails.hasPhotographer ? (
              <div style={{ backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#93C5FD' : '#0369A1', marginBottom: '0.5rem', fontWeight: '600' }}>Booked Photographer</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                      </svg>
                      {showEventDetails.photographerImage && (
                        <img src={showEventDetails.photographerImage} alt={showEventDetails.photographerName || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                      {showEventDetails.photographerName}
                    </span>
                  </div>
                  <Link
                    href="/user/client/photographers"
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      borderRadius: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#062a63'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#083A85'}
                  >
                    View
                  </Link>
                </div>
              </div>
            ) : showEventDetails.status === 'PUBLISHED' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: actualTheme === 'dark' ? '#1E293B' : '#F8FAFC', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem', border: `2px dashed ${colors.borderPrimary}` }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.2rem' }}>No photographer assigned</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>Your event is published. You can now hire a photographer.</div>
                </div>
                <Link
                  href="/user/client/photographers"
                  style={{ padding: '0.375rem 0.875rem', backgroundColor: '#083A85', color: 'white', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Find Photographer
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', backgroundColor: actualTheme === 'dark' ? '#1E293B' : '#F8FAFC', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem', border: `2px solid ${colors.borderPrimary}` }}>
                <CameraIcon />
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Publish this event to assign a photographer.</div>
              </div>
            )}


            {/* Host ID + Event Stream Link */}
            {showEventDetails.inviteCode && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>Host ID</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={showEventDetails.inviteCode}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.875rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary
                    }}
                  />
                  <button
                    onClick={() => handleCopyLink(showEventDetails.inviteCode || '')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.625rem 1rem',
                      border: copiedLink ? '2px solid #059669' : '2px solid #062a63',
                      borderRadius: '0.375rem',
                      background: copiedLink ? '#10B981' : '#083A85',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CopyIcon />
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>Event Stream Link</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={showEventDetails.shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary
                  }}
                />
                <button
                  onClick={() => handleCopyLink(showEventDetails.shareLink)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    border: copiedLink ? '2px solid #059669' : '2px solid #062a63',
                    borderRadius: '0.375rem',
                    background: copiedLink ? '#10B981' : '#083A85',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <CopyIcon />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              {showEventDetails.status === 'upcoming' && (
                <>
                  <button
                    onClick={() => { setShowEventDetails(null); openEditModal(showEventDetails); }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary,
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <EditIcon />
                    Edit Event
                  </button>
                  {showEventDetails && isEventDeletable(showEventDetails) && (
                    <button
                      onClick={() => { setShowEventDetails(null); setDeleteEvent(showEventDetails); setShowDeleteModal(true); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '2px solid #FECACA',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  )}
                  {showEventDetails && isEventPausable(showEventDetails) && (
                    <button
                      onClick={() => { setShowEventDetails(null); setPauseEvent(showEventDetails); setShowPauseModal(true); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#FEF3C7',
                        color: '#D97706',
                        border: '2px solid #FDE68A',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bi bi-pause-fill" style={{ fontSize: '1rem' }}></i>
                      Pause Event
                    </button>
                  )}
                  {showEventDetails && isEventResumable(showEventDetails) && (
                    <button
                      onClick={() => { handleResumeEvent(showEventDetails.id); setShowEventDetails(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#D1FAE5',
                        color: '#059669',
                        border: '2px solid #A7F3D0',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="bi bi-play-fill" style={{ fontSize: '1rem' }}></i>
                      Resume Event
                    </button>
                  )}
                </>
              )}
              {showEventDetails.status === 'completed' && (
                <button
                  onClick={() => { window.location.href = '/user/client/gallery'; }}
                  style={{
                    flex: 1,
                    backgroundColor: '#083A85',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View Photos & Gallery
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share event stream">
        {shareEvent && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: '1.25rem',
              padding: '0.7rem 0.9rem',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.20) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.03) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.30)' : 'rgba(8,58,133,0.18)'}`,
              borderRadius: 12,
            }}>
              <div style={{ position: 'relative', width: 56, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, backgroundColor: shareEvent.coverImage ? 'transparent' : '#0D1B2A' }}>
                <img src={shareEvent.coverImage || '/coverr.jpg'} alt={shareEvent.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: shareEvent.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: colors.textPrimary, fontSize: '0.95rem', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareEvent.title}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: colors.textSecondary, marginTop: 2 }}>
                  <i className="bi bi-calendar-event" style={{ fontSize: 11 }} />
                  {formatDate(shareEvent.date)}
                </div>
              </div>
            </div>
            {/* Stream Invite Token */}
            {shareEvent.streamInviteToken && (
              <div style={{
                position: 'relative', overflow: 'hidden',
                marginBottom: '1.1rem',
                padding: '0.8rem 0.95rem 0.8rem 1.05rem',
                background: actualTheme === 'dark' ? 'rgba(124,58,237,0.12)' : '#F5F3FF',
                borderRadius: 11,
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(124,58,237,0.32)' : '#DDD6FE'}`,
              }}>
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                  background: 'linear-gradient(180deg, #7C3AED 0%, #F20C8F 130%)',
                }} />
                <label style={{ fontSize: '0.66rem', fontWeight: 700, color: actualTheme === 'dark' ? '#A78BFA' : '#6D28D9', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Viewer invite token</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input readOnly value={shareEvent.streamInviteToken} style={{ flex: 1, padding: '0.55rem 0.75rem', border: `1.5px solid ${colors.borderPrimary}`, borderRadius: 10, fontSize: '1rem', fontWeight: 800, letterSpacing: '0.12em', textAlign: 'center' as const, color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }} />
                  <button onClick={() => handleCopyLink(shareEvent.streamInviteToken!)} style={{ padding: '0.55rem 0.85rem', border: 'none', borderRadius: 10, background: copiedLink ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)' : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: copiedLink ? '0 4px 12px rgba(16,185,129,0.30)' : '0 4px 12px rgba(124,58,237,0.30)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <i className={`bi ${copiedLink ? 'bi-check2' : 'bi-clipboard'}`} style={{ fontSize: 12 }} />
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '0.74rem', color: colors.textSecondary, margin: '0.45rem 0 0 0', lineHeight: 1.45 }}>Share this token with viewers so they can access the live stream on the event page.</p>
              </div>
            )}
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.55rem' }}>Share via</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`Join ${title} event stream: ${link}`)}` },
                { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join ${title} event stream`)}` },
                { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(`Join ${title} Event Stream`)}&body=${encodeURIComponent(`You're invited to join the ${title} event stream: ${link}`)}` },
                { name: 'Copy Link', icon: <LinkIcon />, color: '#083A85', getUrl: () => '' },
                { name: 'QR Code', icon: <QRCodeIcon />, color: '#F20C8F', getUrl: () => '' }
              ].map((option) => {
                const isCopyActive = option.name === 'Copy Link' && copiedLink;
                return (
                <button
                  key={option.name}
                  onClick={() => {
                    if (option.name === 'Copy Link') {
                      handleCopyLink(shareEvent.shareLink);
                    } else if (option.name === 'QR Code') {
                      platformAlert('QR Code feature coming soon!');
                    } else {
                      const url = option.getUrl(shareEvent.shareLink, shareEvent.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '0.85rem 0.6rem',
                    border: isCopyActive ? '1.5px solid #10B981' : `1px solid ${colors.borderPrimary}`,
                    borderRadius: 12,
                    background: isCopyActive
                      ? (actualTheme === 'dark' ? 'rgba(16,185,129,0.14)' : '#ECFDF5')
                      : colors.bgCard,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: isCopyActive ? '#10B981' : colors.textPrimary,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'transform 0.15s, border-color 0.18s, background 0.18s, box-shadow 0.18s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                  onMouseEnter={(e) => {
                    if (isCopyActive) return;
                    e.currentTarget.style.borderColor = option.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 14px ${option.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    if (isCopyActive) return;
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: isCopyActive ? '#10B981' : `${option.color}18`,
                    border: `1px solid ${isCopyActive ? '#10B981' : `${option.color}38`}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCopyActive ? '#fff' : option.color,
                  }}>{option.icon}</div>
                  <span>{isCopyActive ? 'Copied!' : option.name}</span>
                </button>
              );})}
            </div>
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
              {shareEvent.inviteCode && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    Host ID
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'stretch',
                    border: `1.5px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    background: colors.bgTertiary,
                    overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.7rem', color: colors.textSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}>
                      <i className="bi bi-person-badge" style={{ fontSize: 14 }} />
                    </div>
                    <input
                      type="text"
                      value={shareEvent.inviteCode}
                      readOnly
                      onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                      style={{ flex: 1, padding: '0.6rem 0.85rem', border: 'none', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.12em', color: colors.textPrimary, backgroundColor: 'transparent', outline: 'none', minWidth: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                    />
                    <button
                      onClick={() => handleCopyLink(shareEvent.inviteCode || '')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 1rem', border: 'none', borderLeft: `1px solid ${colors.borderPrimary}`, background: copiedLink ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)' : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '-0.005em' }}
                    >
                      <i className={`bi ${copiedLink ? 'bi-check2' : 'bi-clipboard'}`} style={{ fontSize: 13 }} />
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
              <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Event stream link
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'stretch',
                border: `1.5px solid ${colors.borderPrimary}`,
                borderRadius: 11,
                background: colors.bgTertiary,
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.7rem', color: colors.textSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}>
                  <i className="bi bi-link-45deg" style={{ fontSize: 16 }} />
                </div>
                <input
                  type="text"
                  value={shareEvent.shareLink}
                  readOnly
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  style={{ flex: 1, padding: '0.65rem 0.85rem', border: 'none', fontSize: '0.84rem', backgroundColor: 'transparent', color: colors.textPrimary, outline: 'none', minWidth: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                />
                <button
                  onClick={() => handleCopyLink(shareEvent.shareLink)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 1rem', border: 'none', borderLeft: `1px solid ${colors.borderPrimary}`, background: copiedLink ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)' : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.15s', whiteSpace: 'nowrap', letterSpacing: '-0.005em' }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <i className={`bi ${copiedLink ? 'bi-check2' : 'bi-clipboard'}`} style={{ fontSize: 13 }} />
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ marginBottom: '4rem' }}></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {/* Publish Confirmation Modal */}
      {publishConfirmEvent && (
        <EventConfirmModal
          tone="success"
          icon="bi-broadcast"
          eyebrow="Go live"
          title="Publish event"
          highlight={publishConfirmEvent.title}
          intro={<>Are you sure you want to publish <strong style={{ color: colors.textPrimary }}>&ldquo;{publishConfirmEvent.title}&rdquo;</strong>?</>}
          detail="This event will become visible to all users on the public platform. Photographers will be able to see and accept bookings for it."
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setPublishConfirmEvent(null)}
          primary={{
            label: 'Publish event',
            icon: 'bi-broadcast',
            onClick: () => handlePublishEvent(publishConfirmEvent.id),
          }}
        />
      )}

      {/* No Photographer Warning Modal */}
      {noPhotographerEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-camera"
          eyebrow="Action needed"
          title="Photographer required"
          highlight={noPhotographerEvent.title}
          intro={<>You cannot publish <strong style={{ color: colors.textPrimary }}>&ldquo;{noPhotographerEvent.title}&rdquo;</strong> because no photographer has been assigned to it.</>}
          detail="Please edit the event and assign a photographer before publishing."
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setNoPhotographerEvent(null)}
          closeLabel="Close"
          primary={{
            label: 'Assign photographer',
            icon: 'bi-camera-fill',
            onClick: () => { const evt = noPhotographerEvent; setNoPhotographerEvent(null); openEditModal(evt); },
          }}
        />
      )}

      {/* No Event Photo Warning Modal */}
      {noPhotoEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-camera-fill"
          eyebrow="Action needed"
          title="Event photo required"
          highlight={noPhotoEvent.title}
          intro={<>You cannot publish <strong style={{ color: colors.textPrimary }}>&ldquo;{noPhotoEvent.title}&rdquo;</strong> without a banner image.</>}
          detail="Please edit the event and upload a banner photo before publishing. This image will be the first thing guests see on the public platform."
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setNoPhotoEvent(null)}
          closeLabel="Close"
          primary={{
            label: 'Edit event',
            icon: 'bi-pencil-square',
            onClick: () => { const evt = noPhotoEvent; setNoPhotoEvent(null); openEditModal(evt); },
          }}
        />
      )}

      {/* Pending Booking Warning Modal */}
      {pendingBookingEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-hourglass-split"
          eyebrow="Action needed"
          title="Awaiting photographer confirmation"
          intro={<>You cannot publish <strong style={{ color: colors.textPrimary }}>&ldquo;{pendingBookingEvent.title}&rdquo;</strong> because the assigned photographer has not yet accepted the booking.</>}
          detail={pendingBookingEvent.bookingStatus?.toUpperCase() === 'REJECTED'
            ? 'The photographer has rejected this booking. Rebook an alternative photographer, we’ll reuse all your original event details.'
            : 'Please wait for the photographer to accept, or assign a different photographer.'}
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setPendingBookingEvent(null)}
          closeLabel="Close"
          primary={pendingBookingEvent.bookingStatus?.toUpperCase() === 'REJECTED' ? {
            label: 'Rebook photographer',
            icon: 'bi-arrow-repeat',
            onClick: () => { const evt = pendingBookingEvent; setPendingBookingEvent(null); setRebookEvent(evt); },
          } : undefined}
        />
      )}

      {/* Rebook Wizard. reuses the rejected event's details; only picks a new photographer */}
      {rebookEvent && (
        <RebookWizard
          open={!!rebookEvent}
          onClose={() => setRebookEvent(null)}
          eventId={rebookEvent.id}
          eventTitle={rebookEvent.title}
          colors={colors}
          actualTheme={actualTheme}
          onSuccess={() => { fetchMyEvents(); }}
        />
      )}

      {/* Unpublish Confirmation Modal */}
      {unpublishConfirmEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-eye-slash-fill"
          eyebrow="Visibility"
          title="Unpublish event"
          highlight={unpublishConfirmEvent.title}
          intro={<>Are you sure you want to unpublish <strong style={{ color: colors.textPrimary }}>&ldquo;{unpublishConfirmEvent.title}&rdquo;</strong>?</>}
          detail="This event will be removed from the public platform and will no longer be visible to users or photographers."
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setUnpublishConfirmEvent(null)}
          closeLabel="Keep published"
          primary={{
            label: 'Unpublish',
            icon: 'bi-eye-slash-fill',
            tone: 'warning',
            onClick: () => handleUnpublishEvent(unpublishConfirmEvent.id),
          }}
        />
      )}

      {/*
        Block modal shown instead of the generic unpublish confirm when the
        event is currently ONGOING (live stream in progress). The creator can't
        unpublish from here. the photographer has to end the stream first.
      */}
      {ongoingUnpublishBlock && (
        <EventConfirmModal
          tone="danger"
          icon="bi-broadcast"
          eyebrow="Stream in progress"
          title="Event is currently live"
          intro={<><strong style={{ color: colors.textPrimary }}>&ldquo;{ongoingUnpublishBlock.title}&rdquo;</strong> can&apos;t be unpublished while the stream is still running. Viewers are watching right now.</>}
          detail={ongoingUnpublishBlock.photographerName
            ? `Please contact the assigned photographer, ${ongoingUnpublishBlock.photographerName}, to end the event stream. Once the stream ends you'll be able to unpublish.`
            : "Please contact the assigned photographer to end the event stream. Once the stream ends you'll be able to unpublish."}
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setOngoingUnpublishBlock(null)}
          closeLabel="Got it"
          fullWidthClose
        />
      )}

      {showDeleteModal && deleteEvent && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Permanent action"
          title="Delete event"
          highlight={deleteEvent.title}
          intro={<>Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&ldquo;{deleteEvent.title}&rdquo;</strong>?</>}
          detail="This action cannot be undone. All guests will be notified and any booked photographer will be released."
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setShowDeleteModal(false)}
          closeLabel="Keep event"
          primary={{
            label: 'Delete event',
            icon: 'bi-trash3-fill',
            tone: 'danger',
            onClick: handleDeleteEvent,
          }}
        />
      )}

      {/* Pause Event Modal */}
      {showPauseModal && pauseEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-pause-circle-fill"
          eyebrow="Pause event"
          title="Pause Event"
          intro={<>Are you sure you want to pause <strong style={{ color: colors.textPrimary }}>&quot;{pauseEvent.title}&quot;</strong>?</>}
          detail="The event will be put on hold. The photographer will be notified. You can resume it at any time."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowPauseModal(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Pause Event',
            icon: 'bi-pause-fill',
            onClick: handlePauseEvent,
            tone: 'warning',
          }}
        />
      )}

      {/* Edit Event Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditEvent(null); }} title="Edit Event" maxWidth="700px">
        {editEvent && (
          <div>
            {/* Section: Event Image */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(8,58,133,0.10)', border: '1px solid rgba(8,58,133,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-camera-fill" style={{ fontSize: 13, color: '#083A85' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Visuals</div>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Event image</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Banner image (1200×800)</label>
                <div
                  onClick={(e) => { if (!editBannerImagePreview) { (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null)?.click(); } }}
                  style={{
                    border: `1.5px dashed ${actualTheme === 'dark' ? 'rgba(99,162,255,0.45)' : 'rgba(8,58,133,0.32)'}`,
                    borderRadius: 12,
                    height: 170,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: editBannerImagePreview
                      ? 'transparent'
                      : (actualTheme === 'dark'
                          ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.06) 100%)'
                          : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.03) 100%)'),
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                >
                  {editBannerImagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image src={editBannerImagePreview} alt="Banner" fill style={{ objectFit: 'cover' }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditBannerImage(null); setEditBannerImagePreview(null); }}
                        title="Remove image"
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          border: '1px solid rgba(255,255,255,0.35)',
                          borderRadius: 9, width: 30, height: 30, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        <i className="bi bi-trash3" style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <input type="file" accept="image/*" onChange={handleEditBannerImageChange} style={{ display: 'none' }} />
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: '#fff',
                        border: '1px solid rgba(8,58,133,0.20)',
                        boxShadow: '0 4px 10px rgba(8,58,133,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 20, color: '#083A85' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                          Upload banner image
                        </div>
                        <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginTop: 2 }}>
                          Click to choose · 1200×800 · PNG or JPG
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Basic Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(242,12,143,0.10)', border: '1px solid rgba(242,12,143,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-pencil-fill" style={{ fontSize: 13, color: '#F20C8F' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Overview</div>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Basic information</span>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Title *</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="e.g., APR BBC Vs Espoir BCC" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
              <div className="mobile-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Category *</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as EventCategory)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: colors.bgCard, color: colors.textPrimary, cursor: 'pointer' }}>
                    <option value="">Select category</option>
                    {eventCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Date & Time */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-calendar-event-fill" style={{ fontSize: 13, color: '#F59E0B' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Schedule</div>
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Date &amp; time</span>
                </div>
              </div>
              <div className="mobile-modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Date *</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Start Time *</label>
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>End Time</label>
                  <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <LocationIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Location</span>
              </div>
              <div className="mobile-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Venue Name *</label>
                  <input type="text" value={editVenueName} onChange={(e) => setEditVenueName(e.target.value.replace(/,/g, ''))} placeholder="e.g., BK Arena" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Location Address *</label>
                  <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value.replace(/,/g, ''))} placeholder="e.g., KN 4 Ave" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                </div>
              </div>
            </div>

            {/* Section: Capacity */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <DollarIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Capacity</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Expected Attendees *</label>
                <input type="number" value={editMaxGuests} onChange={(e) => setEditMaxGuests(e.target.value)} placeholder="e.g., 500" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
            </div>

            {/* Section: Organizer */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <OrganizerIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Organizer</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Organizer Name *</label>
                <input type="text" value={editOrganizer} onChange={(e) => setEditOrganizer(e.target.value)} placeholder="e.g., Rwanda Basketball Federation" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
            </div>

            {/* Section: Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <EditIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Description</span>
              </div>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Describe your event in detail..." style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical', color: colors.textPrimary }} />
            </div>

            {/* Section: Hash Tags */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <TagIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Hash Tags</span>
              </div>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" value={editTagInput} onChange={(e) => setEditTagInput(e.target.value)} onKeyPress={handleEditAddTag} placeholder="Add hash tags" style={{ flex: 1, padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                  <button type="button" onClick={addEditTagFromInput} style={{ padding: '0.625rem 1rem', backgroundColor: '#083A85', color: 'white', border: '2px solid #062a63', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
                {editTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {editTags.map((tag, index) => (
                      <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.375rem 0.625rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '500' }}>
                        #{tag}
                        <button onClick={() => handleEditRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', padding: 0, display: 'flex', alignItems: 'center', fontSize: '14px' }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section: Photographer Assignment */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CameraIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Photographer Assignment</span>
              </div>

              {editPhotographerAssignMode === 'none' && !editPhotographerId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setEditPhotographerAssignMode('existing')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Assign an existing Photographer you worked with before
                  </button>
                  <button type="button" onClick={() => setShowFindPhotographerModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Assign a new Photographer from platform
                  </button>
                </div>
              )}

              {editPhotographerAssignMode === 'existing' && (
                <div>
                  <input type="text" value={editPhotographerSearchQuery} onChange={(e) => setEditPhotographerSearchQuery(e.target.value)} placeholder="Search photographers..." style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, backgroundColor: colors.bgCard, marginBottom: '0.5rem' }} />
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.5rem' }}>
                    {pastPhotographers.filter(p => p.name.toLowerCase().includes(editPhotographerSearchQuery.toLowerCase())).map(p => (
                      <div key={p.id} onClick={() => { setEditPhotographerId(p.id); setEditPhotographerAssignMode('none'); setEditPhotographerSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', cursor: 'pointer', borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: editPhotographerId === p.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                          {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>{p.name.charAt(0)}</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{p.speciality}</div>
                        </div>
                      </div>
                    ))}
                    {pastPhotographers.filter(p => p.name.toLowerCase().includes(editPhotographerSearchQuery.toLowerCase())).length === 0 && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>No photographers found</div>
                    )}
                  </div>
                  <button type="button" onClick={() => { setEditPhotographerAssignMode('none'); setEditPhotographerSearchQuery(''); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', background: 'transparent', color: colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                </div>
              )}

              {editPhotographerAssignMode === 'platform' && (
                <div>
                  <input type="text" value={editPhotographerSearchQuery} onChange={(e) => setEditPhotographerSearchQuery(e.target.value)} placeholder="Search platform photographers..." style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, backgroundColor: colors.bgCard, marginBottom: '0.5rem' }} />
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.5rem' }}>
                    {platformPhotographers.filter(p => p.name.toLowerCase().includes(editPhotographerSearchQuery.toLowerCase())).map(p => (
                      <div key={p.id} onClick={() => { setEditPhotographerId(p.id); setEditPhotographerAssignMode('none'); setEditPhotographerSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', cursor: 'pointer', borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: editPhotographerId === p.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                          {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>{p.name.charAt(0)}</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{p.speciality}</div>
                        </div>
                      </div>
                    ))}
                    {platformPhotographers.filter(p => p.name.toLowerCase().includes(editPhotographerSearchQuery.toLowerCase())).length === 0 && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>No photographers found on platform.</div>
                    )}
                  </div>
                  <button type="button" onClick={() => { setEditPhotographerAssignMode('none'); setEditPhotographerSearchQuery(''); }} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', background: 'transparent', color: colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                </div>
              )}

              {editPhotographerId && editPhotographerAssignMode === 'none' && (() => {
                const selected = pastPhotographers.find(p => p.id === editPhotographerId) || platformPhotographers.find(p => p.id === editPhotographerId);
                return selected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', border: `2px solid #083A85`, borderRadius: '0.5rem', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                      {selected.image ? <img src={selected.image} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>{selected.name.charAt(0)}</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{selected.name}</div>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{selected.speciality}</div>
                    </div>
                    <button type="button" onClick={() => setEditPhotographerId('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1.1rem', padding: '0.25rem' }} title="Remove photographer">x</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', border: `2px solid #083A85`, borderRadius: '0.5rem', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{editEvent?.photographerName || 'Assigned Photographer'}</div>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Currently assigned</div>
                    </div>
                    <button type="button" onClick={() => setEditPhotographerId('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1.1rem', padding: '0.25rem' }} title="Remove photographer">x</button>
                  </div>
                );
              })()}
            </div>

            {/* Submit Error (Edit) */}
            {submitError && (
              <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ flexShrink: 0 }}>⚠</span>
                {submitError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: `2px solid ${colors.borderPrimary}`, marginBottom: '4rem' }}>
              <button
                onClick={() => { setShowEditModal(false); setEditEvent(null); setSubmitError(null); }}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditEvent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  background: '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Changes ✓
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Success Modal */}
      {showInviteSuccessModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100,
          animation: 'fadeIn 0.2s ease-out',
        }} onClick={(e) => { e.stopPropagation(); setShowInviteSuccessModal(false); }}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '1.25rem',
            padding: '2.5rem 2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            animation: 'slideUp 0.3s ease-out',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.3)',
              }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: colors.textPrimary, marginBottom: '0.625rem', letterSpacing: '-0.01em' }}>
                Invitation Sent
              </h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '0.5rem', lineHeight: '1.5' }}>
                The photographer will receive an email invitation to join the platform.
              </p>
              <p style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#6B7280' : '#9CA3AF', marginBottom: '2rem', lineHeight: '1.4' }}>
                Once they accept, you can assign them to your events.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setShowInviteSuccessModal(false); }}
                style={{
                  padding: '0.75rem 2.5rem',
                  border: 'none',
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #083A85 0%, #0A4DA6 100%)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px -2px rgba(8, 58, 133, 0.4)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(8, 58, 133, 0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(8, 58, 133, 0.4)'; }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <BookingModeSelectorModal
        isOpen={showBookingModeSelector}
        onClose={() => setShowBookingModeSelector(false)}
        onSelectDirect={() => {
          setShowBookingModeSelector(false);
          setShowCreateModal(true);
        }}
        onSelectHybrid={() => {
          setShowBookingModeSelector(false);
          setShowHybridWizard(true);
        }}
      />

      <HybridEventWizardModal
        isOpen={showHybridWizard}
        onClose={() => setShowHybridWizard(false)}
        onSuccess={() => {
          setShowHybridWizard(false);
          fetchMyEvents();
          platformAlert('Your hybrid event has been published. Matching photographers will receive alerts.', {
            title: 'Event Brief Published',
            tone: 'success',
          });
        }}
      />

      {candidateModalEvent && (
        <CandidatesShortlistModal
          isOpen={!!candidateModalEvent}
          onClose={() => setCandidateModalEvent(null)}
          eventId={candidateModalEvent.id}
          eventTitle={candidateModalEvent.title}
          onPhotographerSelected={() => {
            setCandidateModalEvent(null);
            fetchMyEvents();
          }}
        />
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MyEventsPage;
