"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localforage from 'localforage';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { StatCard } from '../../components/dashboard/StatCard';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';

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
  createPriceCurrency: string;
  createMaxGuests: string;
  createOrganizer: string;
  createTags: string[];
  createPhotographerId: string;
  createPackageId: string;
  createEventVisibility: string;
  createBannerImagePreview: string | null;
  savedAt: number;
}

// Fallback currency options (used when API is unavailable)
const fallbackCurrencyOptions: { value: string; label: string; id?: string }[] = [
  { value: 'RWF', label: 'RWF' },
  { value: 'USD', label: 'USD' },
  { value: 'KES', label: 'KES' },
  { value: 'UGX', label: 'UGX' },
  { value: 'TZS', label: 'TZS' }
];

const CURRENCY_FLAG_MAP: Record<string, string> = {
  USD: 'us', RWF: 'rw', EUR: 'eu', KES: 'ke', UGX: 'ug', TZS: 'tz', GBP: 'gb',
};


function parseTimeToApiString(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return `${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`;
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Format number with commas for thousands
const formatNumberWithCommas = (value: string): string => {
  // Remove all non-digit characters
  const numericValue = value.replace(/[^\d]/g, '');
  // Add commas for thousands
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

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

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33397 21.9434 7.02299C21.932 5.71201 21.4061 4.45794 20.4791 3.5309C19.5521 2.60386 18.298 2.07802 16.987 2.06663C15.676 2.05523 14.413 2.55921 13.47 3.47L11.75 5.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7643 9.26331 11.0685 9.05889 10.3533 9.00768C9.63816 8.95646 8.92037 9.05964 8.24861 9.31023C7.57685 9.56082 6.96684 9.95294 6.46 10.46L3.46 13.46C2.54921 14.403 2.04523 15.666 2.05663 16.977C2.06802 18.288 2.59387 19.5421 3.52091 20.4691C4.44795 21.3961 5.70201 21.922 7.01299 21.9334C8.32397 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  groupDiscountPercentage?: number;
  guestCount: number;
  maxGuests: number;
  status: EventStatus;
  organizer: string;
  tags: string[];
  hasPhotographer: boolean;
  bookingStatus?: string;
  photographerId?: string;
  photographerName?: string;
  photographerImage?: string;
  isPublished: boolean;
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
  const [apiCurrencies, setApiCurrencies] = useState<{ value: string; label: string; id?: string }[]>([]);

  // Photographers fetched from API
  const [pastPhotographers, setPastPhotographers] = useState<{id: string; name: string; image?: string; speciality: string; rating: number; eventsWorked: number}[]>([]);
  const [showFindPhotographerModal, setShowFindPhotographerModal] = useState(false);
  const [photographerSearchQuery, setPhotographerSearchQuery] = useState('');
  const [photographerAssignMode, setPhotographerAssignMode] = useState<'none' | 'existing' | 'platform' | 'invite'>('none');
  const [invitePhotographerEmail, setInvitePhotographerEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showInviteSuccessModal, setShowInviteSuccessModal] = useState(false);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('');
  const [editPhotographerId, setEditPhotographerId] = useState<string>('');
  const [editPhotographerAssignMode, setEditPhotographerAssignMode] = useState<'none' | 'existing' | 'platform'>('none');
  const [editPhotographerSearchQuery, setEditPhotographerSearchQuery] = useState('');

  const [platformPhotographers, setPlatformPhotographers] = useState<{id: string; name: string; image?: string; speciality: string; rating: number; eventsWorked: number}[]>([]);

  useEffect(() => {
    // Fetch booked/connected photographers (authenticated — same as inbox new chat)
    const normalizeImg = (url: string | undefined | null): string | undefined => {
      if (!url || url.includes('/null')) return undefined;
      return normalizeImageUrl(url);
    };
    const fetchBookedPhotographers = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/photographers`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.data?.content || data.data || []).map((p: Record<string, unknown>) => ({
            id: (p.id as string) || '',
            name: `${(p.firstName as string) || ''} ${(p.lastName as string) || ''}`.trim() || (p.name as string) || 'Photographer',
            image: normalizeImg((p.profilePicture as string) || (p.image as string) || null),
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
  const [editGroupDiscount, setEditGroupDiscount] = useState('');
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
  const [createStatus, setCreateStatus] = useState<'UPCOMING' | 'LIVE'>('LIVE');
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
  const [createGroupDiscount, setCreateGroupDiscount] = useState('');
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
  const [photographerPackages, setPhotographerPackages] = useState<{id: string; packageName: string; price: number; currencyId: string; description: string; durationHours: number}[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [createEscrowPercentage, setCreateEscrowPercentage] = useState<number>(50);

  // Completion confirmation modal
  const [completionModalEvent, setCompletionModalEvent] = useState<Event | null>(null);
  const [completionFeedbackStatus, setCompletionFeedbackStatus] = useState<'COMPLETED' | 'REQUIRE_CHANGES'>('COMPLETED');
  const [completionComment, setCompletionComment] = useState('');
  const [completionSubmitting, setCompletionSubmitting] = useState(false);

  const [createCurrencyOpen, setCreateCurrencyOpen] = useState(false);
  const [editCurrencyOpen, setEditCurrencyOpen] = useState(false);
  const createCurrencyRef = useRef<HTMLDivElement>(null);
  const editCurrencyRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/remote/public/currencies`);
        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            setApiCurrencies(result.data.map((c: { id?: string; code?: string; currencyCode?: string; name?: string; currencyName?: string }) => ({
              value: c.code || c.currencyCode || '',
              label: `${c.code || c.currencyCode || ''}${c.name || c.currencyName ? ` - ${c.name || c.currencyName}` : ''}`,
              id: c.id || undefined,
            })).filter((c: { value: string }) => c.value));
          }
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
      }
    };
    fetchCurrencies();
  }, []);

  // Close currency dropdowns on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (createCurrencyRef.current && !createCurrencyRef.current.contains(e.target as Node)) setCreateCurrencyOpen(false);
      if (editCurrencyRef.current && !editCurrencyRef.current.contains(e.target as Node)) setEditCurrencyOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Use API currencies when available, otherwise fallback
  const currencyOptions = apiCurrencies.length > 0 ? apiCurrencies : fallbackCurrencyOptions;

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
      createPriceCurrency,
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
    createAddress, createCity, createCountry, createPrice, createPriceCurrency, createMaxGuests,
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
            setCreatePriceCurrency(savedDraft.createPriceCurrency || 'RWF');
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
    const landingPhotographerId = searchParams.get('photographerId');
    const landingPackageId = searchParams.get('packageId');
    if (!landingPhotographerId) return;
    setCreatePhotographerId(landingPhotographerId);
    if (landingPackageId) setCreatePackageId(landingPackageId);
    setPhotographerAssignMode('platform');
    setShowCreateModal(true);
    const url = new URL(window.location.href);
    url.searchParams.delete('photographerId');
    url.searchParams.delete('packageId');
    window.history.replaceState({}, '', url.pathname + (url.search !== '?' ? url.search : ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          description: (p.description as string) || '',
          durationHours: (p.durationHours as number) || 0,
        })));
      } catch {
        setPackagesError('Could not load packages. Please try again.');
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, [createPhotographerId]);

  // Clear saved draft from IndexedDB
  const clearFormDraft = useCallback(async () => {
    try {
      await eventFormStorage.removeItem(CREATE_EVENT_FORM_KEY);
    } catch (error) {
      console.error('Failed to clear form draft:', error);
    }
  }, []);

  // Event categories from prompt
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
        // Fallback silently — dropdowns will be empty
      }
    })();
  }, []);


  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);
  const [unpublishingEventId, setUnpublishingEventId] = useState<string | null>(null);
  const [publishConfirmEvent, setPublishConfirmEvent] = useState<Event | null>(null);
  const [unpublishConfirmEvent, setUnpublishConfirmEvent] = useState<Event | null>(null);
  const [noPhotographerEvent, setNoPhotographerEvent] = useState<Event | null>(null);
  const [pendingBookingEvent, setPendingBookingEvent] = useState<Event | null>(null);
  const [noPhotoEvent, setNoPhotoEvent] = useState<Event | null>(null);

  // Fetch events — use coordinator endpoint (returns only this user's events)
  const fetchMyEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events?page=0&size=100`);

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
            groupDiscountPercentage: (evt.groupDiscountPercentage as number) ?? 0,
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
            hasPhotographer: !!(evt.photographerId || (evt.photographer && (evt.photographer as Record<string, unknown>).id)),
            bookingStatus: (evt.bookingStatus as string) || undefined,
            photographerId: (evt.photographerId as string) || (evt.photographer && (evt.photographer as Record<string, unknown>).id as string) || undefined,
            photographerName: (evt.photographerName as string) || (evt.photographer ? `${(evt.photographer as Record<string, unknown>).firstName || ''} ${(evt.photographer as Record<string, unknown>).lastName || ''}`.trim() : '') || '',
            photographerImage: (evt.photographerImage as string) || (evt.photographer && (evt.photographer as Record<string, unknown>).profilePicture as string) || '',
            isPublished: evt.isPublished === true,
            inviteCode: (evt.inviteCode as string) || (evt.hostId as string) || '',
            streamInviteToken: (evt.streamInviteToken as string) || undefined,
            shareLink: `${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/events/view-event?id=${evt.id}`,
            completionStatus: (evt.completionStatus as string) || undefined,
            createdAt: (evt.createdAt as string) || '',
          };
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

  const handlePublishEvent = async (eventId: string) => {
    if (!token) return;
    setPublishConfirmEvent(null);
    setPublishingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${eventId}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        setEvents(prev => prev.map(evt =>
          evt.id === eventId ? { ...evt, status: 'PUBLISHED' as EventStatus, isPublished: true } : evt
        ));
        if (activeTab === 'upcoming') setActiveTab('all');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to publish event. Please try again.');
      }
    } catch (err) {
      alert('Failed to publish event. Please try again.');
    }
    setPublishingEventId(null);
  };

  const handleUnpublishEvent = async (eventId: string) => {
    if (!token) return;
    setUnpublishConfirmEvent(null);
    setUnpublishingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${eventId}/unpublish`, {
        method: 'POST',
      });
      if (res.ok) {
        setEvents(prev => prev.map(evt =>
          evt.id === eventId ? { ...evt, status: 'UPCOMING' as EventStatus, isPublished: false } : evt
        ));
        if (activeTab === 'published') setActiveTab('all');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to unpublish event. Please try again.');
      }
    } catch (err) {
      alert('Failed to unpublish event. Please try again.');
    }
    setUnpublishingEventId(null);
  };


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
        const unpubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${eventId}/unpublish`, {
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
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete event (${res.status})`);
      }
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete event');
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
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${eventId}/pause`, {
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
      alert(err instanceof Error ? err.message : 'Failed to pause event');
      fetchMyEvents();
    } finally {
      setPausingEventId(null);
    }
  };

  const handleResumeEvent = async (eventId: string) => {
    setResumingEventId(eventId);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${eventId}/resume`, {
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
      alert(err instanceof Error ? err.message : 'Failed to resume event');
      fetchMyEvents();
    } finally {
      setResumingEventId(null);
    }
  };

  const openEditModal = (event: Event) => {
    setEditEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description);
    setEditCategory((event.category as EventCategory) || '');
    setEditStatus(event.status.toLowerCase() === 'live' ? 'LIVE' : 'UPCOMING');
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
    setEditGroupDiscount(event.groupDiscountPercentage !== undefined && event.groupDiscountPercentage !== null ? String(event.groupDiscountPercentage) : '0');
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
          location: {
            address: [editVenueName, editAddress].filter(Boolean).join(', '),
            city: editCity,
            country: editCountry
          },
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
        };
      }
      return event;
    }));

    // Send update to backend
    try {
      const apiUrl = getApiUrl();
      const editNumericPrice = editPrice.replace(/[^\d]/g, '');
      const editPayload: Record<string, unknown> = {
        title: editTitle,
        description: editDescription,
        eventType: editCategory,
        eventDate: editDate,
        startTime: editTime ? parseTimeToApiString(editTime) : null,
        endTime: editEndTime ? parseTimeToApiString(editEndTime) : null,
        location: [editVenueName, editAddress, editCity, editCountry].filter(Boolean).join(', '),
        eventOrganizer: editOrganizer,
        eventTags: editTags.join(','),
        price: editNumericPrice ? Number(editNumericPrice) : 0,
        priceCurrency: editPriceCurrency || 'RWF',
        streamFee: editNumericPrice ? Number(editNumericPrice) : 0,
        streamFeeCurrencyId: (() => {
          const match = currencyOptions.find(c => c.value === (editPriceCurrency || 'RWF'));
          return match?.id || undefined;
        })(),
        maxGuests: editMaxGuests ? Number(editMaxGuests.replace(/[^\d]/g, '')) : 0,
        groupDiscountPercentage: editGroupDiscount ? Number(editGroupDiscount) : 0,
      };
      const validEditPhotographerId = (editPhotographerId && isValidUUID(editPhotographerId)) ? editPhotographerId : null;
      if (validEditPhotographerId) {
        editPayload.photographerId = validEditPhotographerId;
      }
      Object.keys(editPayload).forEach(key => {
        if (editPayload[key] === undefined || editPayload[key] === null) delete editPayload[key];
      });
      const editRes = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${editEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPayload),
      });
      if (!editRes.ok) {
        const errData = await editRes.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to update event: ${editRes.status}`);
      }
      const editResult = await editRes.json().catch(() => null);
      if (editResult && editResult.action === 0) {
        throw new Error(editResult.message || 'Failed to update event.');
      }
      // Upload banner image if a new file was selected
      if (editBannerImageFile) {
        try {
          const photoForm = new FormData();
          photoForm.append('file', editBannerImageFile);
          await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${editEvent.id}/photo`, {
            method: 'POST',
            body: photoForm,
          });
        } catch (photoErr) {
          console.error('Failed to upload event photo:', photoErr);
        }
      }
      // Refresh to get the updated eventPhoto URL
      await fetchMyEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
      alert(err instanceof Error ? err.message : 'Failed to update event. Please try again.');
    }

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
    setCreateGroupDiscount('');
    setCreateMaxGuests('');
    setCreateOrganizer('');
    setCreateTags([]);
    setCreateTagInput('');
    setCreateBannerImage(null);
    setCreateBannerImagePreview(null);
    setCreateBannerImageFile(null);
    setCreatePhotographerId('');
    setCreatePackageId('');
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
    const missingFields: string[] = [];
    if (!createTitle) missingFields.push('Event Title');
    if (!createCategory) missingFields.push('Category');
    if (!createDate) missingFields.push('Date');
    if (!createTime) missingFields.push('Start Time');
    if (!createBannerImageFile && !createBannerImagePreview) missingFields.push('Banner Image');
    if (createPrice === undefined || createPrice === null || createPrice === '') missingFields.push('Price');
    if (createGroupDiscount === '') missingFields.push('Group Stream Discount');
    if (missingFields.length > 0) {
      setSubmitError(`Please fill in the required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call the backend API
      if (token) {
        const apiUrl = getApiUrl();

        const locationStr = [createVenueName, createAddress, createCity, createCountry].filter(Boolean).join(', ');
        const tagsStr = createTags.length > 0 ? createTags.join(',') : createCategory;

        const validPhotographerId = (createPhotographerId && isValidUUID(createPhotographerId)) ? createPhotographerId : null;

        const numericPrice = createPrice.replace(/[^\d]/g, '');

        const payload: Record<string, unknown> = {
          title: createTitle,
          description: createDescription || '',
          eventType: createCategory,
          startTime: parseTimeToApiString(createTime),
          endTime: createEndTime ? parseTimeToApiString(createEndTime) : parseTimeToApiString(createTime),
          eventDate: createDate,
          location: locationStr,
          eventOrganizer: createOrganizer || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Organizer',
          eventVisibility: createEventVisibility || 'PUBLIC',
          eventTags: tagsStr,
          price: numericPrice ? Number(numericPrice) : 0,
          priceCurrency: createPriceCurrency || 'RWF',
          streamFee: numericPrice ? Number(numericPrice) : 0,
          streamFeeCurrencyId: (() => {
            const match = currencyOptions.find(c => c.value === (createPriceCurrency || 'RWF'));
            return match?.id || undefined;
          })(),
          maxGuests: createMaxGuests ? Number(createMaxGuests.replace(/[^\d]/g, '')) : 0,
          groupDiscountPercentage: createGroupDiscount ? Number(createGroupDiscount) : 0,
          notes: '',
        };

        // Only include photographer/package IDs if they are valid UUIDs — sending null causes backend JPA errors
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

        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.action === 1) {
            // Upload banner image if a file was selected
            const newEventId = result.data?.event?.id || result.data?.eventId || result.data?.id;
            if (createBannerImageFile && newEventId) {
              try {
                const photoForm = new FormData();
                photoForm.append('file', createBannerImageFile);
                await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${newEventId}/photo`, {
                  method: 'POST',
                  body: photoForm,
                });
              } catch (photoErr) {
                console.error('Failed to upload event photo:', photoErr);
              }
            }
            // Refresh events from the backend to get the real event data
            await fetchMyEvents();
            resetCreateForm();
            setShowCreateModal(false);
            setIsSubmitting(false);
            return;
          } else {
            throw new Error(result.message || 'Failed to create event. Please try again.');
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create event. Please try again.');
        }
      } else {
        throw new Error('Authentication required. Please log in again.');
      }
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
        return { backgroundColor: '#d19d0d', color: '#FFFFFF' };
      case 'published':
        return { backgroundColor: '#05a129', color: '#FFFFFF' };
      case 'ongoing':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'completed':
        return { backgroundColor: '#DC2626', color: '#FFFFFF' };
      case 'paused':
        return { backgroundColor: '#F59E0B', color: '#FFFFFF' };
      default:
        return { backgroundColor: colors.bgTertiary, color: colors.textSecondary };
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
      return matchesSearch && statusLower === 'completed';
    }
    return matchesSearch;
  });

  const upcomingCount = events.filter(e => {
    const s = e.status.toLowerCase();
    return s === 'upcoming' || s === 'ongoing' || s === 'live' || s === 'paused';
  }).length;
  const publishedCount = events.filter(e => e.status.toLowerCase() === 'published').length;
  const completedCount = events.filter(e => e.status.toLowerCase() === 'completed').length;
  const pastCount = completedCount;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
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
          }
          .mobile-search {
            max-width: 100% !important;
          }
          .mobile-tabs {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .mobile-tabs button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .mobile-events-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-event-card {
            border-radius: 1.25rem !important;
          }
          .mobile-event-image {
            height: 140px !important;
          }
          .mobile-event-content {
            padding: 0.5rem 0.7rem !important;
          }
          .mobile-event-actions {
            flex-wrap: wrap !important;
            gap: 0.3rem !important;
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
          .mobile-event-image {
            height: 120px !important;
          }
          .mobile-event-content {
            padding: 0.4rem 0.6rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="event-coordinator" />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600' }}>My Events</h1>
              <p className="mobile-subtitle" style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Create and manage your events
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mobile-create-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <PlusIcon />
              Create Event
            </button>
          </header>

          {/* Status Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1.5rem', borderRadius: '0.5rem',
                    backgroundColor: '#083A85', color: '#fff', border: '2px solid #062a63',
                    cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  <PlusIcon />
                  Create Event
                </button>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '1rem', color: colors.textSecondary }}>No events found.</p>
              <button
                onClick={() => setShowCreateModal(true)}
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
                  {/* Inner card — clickable to view */}
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
                      <div style={{ ...getStatusBadgeStyle(event.status), backdropFilter: 'blur(8px)', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'capitalize' }}>
                        {event.status}
                      </div>
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                        {event.eventType}
                      </div>
                    </div>

                    {/* MIDDLE-BOTTOM: event title + category */}
                    <div style={{ position: 'absolute', bottom: '9rem', left: 0, right: 0, padding: '0 0.8rem' }}>
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
                      {/* Action buttons — always 4 buttons: Share, Edit, Delete, Publish/Unpublish */}
                      <div className="mobile-event-actions" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button onClick={() => { setShareEvent(event); setShowShareModal(true); }} title="Share" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: 'pointer' }}>
                          <ShareIcon />
                        </button>
                        <button onClick={() => openEditModal(event)} title="Edit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: 'pointer' }}>
                          <EditIcon />
                        </button>
                        {isEventDeletable(event) && (
                          <button onClick={() => { setDeleteEvent(event); setShowDeleteModal(true); }} title="Delete" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.5rem', backgroundColor: 'rgba(220,38,38,0.82)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: 'pointer' }}>
                            <TrashIcon />
                          </button>
                        )}
                        {isEventPausable(event) && (
                          <button onClick={() => { setPauseEvent(event); setShowPauseModal(true); }} title="Pause" disabled={pausingEventId === event.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.5rem', backgroundColor: '#F59E0B', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: pausingEventId === event.id ? 'not-allowed' : 'pointer', opacity: pausingEventId === event.id ? 0.7 : 1 }}>
                            {pausingEventId === event.id ? '...' : <i className="bi bi-pause-fill" style={{ fontSize: '1rem' }}></i>}
                          </button>
                        )}
                        {isEventResumable(event) && (
                          <button onClick={() => handleResumeEvent(event.id)} title="Resume" disabled={resumingEventId === event.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.5rem', backgroundColor: '#10B981', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: resumingEventId === event.id ? 'not-allowed' : 'pointer', opacity: resumingEventId === event.id ? 0.7 : 1 }}>
                            {resumingEventId === event.id ? '...' : <i className="bi bi-play-fill" style={{ fontSize: '1rem' }}></i>}
                          </button>
                        )}
                        {event.status.toUpperCase() !== 'COMPLETED' && (
                          (event.isPublished || event.status.toUpperCase() === 'PUBLISHED' || event.status.toUpperCase() === 'ONGOING') ? (
                            <button onClick={() => setUnpublishConfirmEvent(event)} disabled={unpublishingEventId === event.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem 0.5rem', backgroundColor: '#d19d0d', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: unpublishingEventId === event.id ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: unpublishingEventId === event.id ? 0.7 : 1 }}>
                              {unpublishingEventId === event.id ? 'Unpublishing...' : 'Unpublish'}
                            </button>
                          ) : (
                            <button onClick={() => !event.coverImage ? setNoPhotoEvent(event) : !event.hasPhotographer ? setNoPhotographerEvent(event) : (event.bookingStatus && event.bookingStatus.toUpperCase() !== 'ACCEPTED' && event.bookingStatus.toUpperCase() !== 'UNASSIGNED') ? setPendingBookingEvent(event) : setPublishConfirmEvent(event)} disabled={publishingEventId === event.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.4rem 0.5rem', backgroundColor: '#05a129', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: publishingEventId === event.id ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: publishingEventId === event.id ? 0.7 : 1 }}>
                              {publishingEventId === event.id ? 'Publishing...' : 'Publish'}
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
                  setCompletionSubmitting(true);
                  try {
                    const apiUrl = getApiUrl();
                    const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${completionModalEvent.id}/confirm-completion`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: completionFeedbackStatus, comment: completionComment || null }),
                    });
                    if (res.ok) {
                      if (completionFeedbackStatus === 'COMPLETED') {
                        setEvents(prev => prev.map(e => e.id === completionModalEvent.id ? { ...e, status: 'COMPLETED' as EventStatus, completionStatus: 'COMPLETED' } : e));
                      } else {
                        setEvents(prev => prev.map(e => e.id === completionModalEvent.id ? { ...e, completionStatus: 'PENDING_CUSTOMER_CONFIRMATION' } : e));
                      }
                      setCompletionModalEvent(null);
                    } else {
                      const err = await res.json().catch(() => null);
                      alert(err?.message || 'Failed to submit feedback');
                    }
                  } catch {
                    alert('Network error. Please try again.');
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
                {completionSubmitting ? 'Submitting...' : (completionFeedbackStatus === 'COMPLETED' ? 'Confirm Completion' : 'Request Changes')}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CameraIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Event Image</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.375rem' }}>Banner Image (1200x800) <span style={{ color: '#DC2626' }}>*</span></label>
              <div style={{
                border: `2px dashed ${submitError && !createBannerImagePreview ? '#DC2626' : colors.borderPrimary}`,
                borderRadius: '0.5rem',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bgTertiary,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {createBannerImagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image src={createBannerImagePreview} alt="Banner" fill style={{ objectFit: 'cover' }} />
                    <button onClick={() => { setCreateBannerImage(null); setCreateBannerImagePreview(null); setCreateBannerImageFile(null); }} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>×</button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem' }}>
                    <input type="file" accept="image/*" onChange={handleBannerImageChange} style={{ display: 'none' }} />
                    <ImageIcon />
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>Click to upload banner image</p>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section: Basic Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <EditIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Basic Information</span>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Title *</label>
              <input type="text" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g., APR BBC Vs Espoir BCC" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  Live Event
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CalendarIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Date & Time</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Date *</label>
                <input type="date" value={createDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => { setDateError(''); setCreateDate(e.target.value); }} style={{ width: '100%', padding: '0.625rem', border: dateError ? '2px solid #DC2626' : '2px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                {dateError && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>{dateError}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Start Time *</label>
                <input type="time" value={createTime} onChange={(e) => { setTimeError(''); setCreateTime(e.target.value); }} style={{ width: '100%', padding: '0.625rem', border: timeError ? '2px solid #DC2626' : '2px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
                {timeError && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>{timeError}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>End Time</label>
                <input type="time" value={createEndTime} onChange={(e) => setCreateEndTime(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer' }} />
              </div>
            </div>
          </div>

          {/* Section: Location */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <LocationIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Location</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

          {/* Section: Pricing & Capacity */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <DollarIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Pricing & Capacity</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Live Stream Access Fee</label>
                <div style={{ display: 'flex', gap: '0' }}>
                  <input
                    type="text"
                    value={createPrice}
                    onChange={(e) => setCreatePrice(formatNumberWithCommas(e.target.value))}
                    placeholder="e.g., 15,000"
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRight: 'none',
                      borderRadius: '0.5rem 0 0 0.5rem',
                      fontSize: '0.9rem',
                      color: colors.textPrimary,
                      backgroundColor: colors.bgCard
                    }}
                  />
                  <div ref={createCurrencyRef} style={{ position: 'relative', minWidth: '120px' }}>
                    <button type="button" onClick={() => setCreateCurrencyOpen(!createCurrencyOpen)} style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
                      padding: '0.625rem 0.5rem', border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0 0.5rem 0.5rem 0', borderLeft: 'none',
                      fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary,
                      backgroundColor: colors.bgTertiary, cursor: 'pointer',
                    }}>
                      {CURRENCY_FLAG_MAP[createPriceCurrency] && <img src={`https://flagcdn.com/w40/${CURRENCY_FLAG_MAP[createPriceCurrency]}.png`} alt="" style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />}
                      <span style={{ flex: 1, textAlign: 'left' }}>{createPriceCurrency}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: createCurrencyOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                        <path d="M6 9L12 15L18 9" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {createCurrencyOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 0.35rem)', right: 0, backgroundColor: colors.bgSecondary, borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `2px solid ${colors.borderPrimary}`, padding: '0.4rem', minWidth: '200px', zIndex: 100 }}>
                        {currencyOptions.map(opt => {
                          const flag = CURRENCY_FLAG_MAP[opt.value] || '';
                          const isSelected = createPriceCurrency === opt.value;
                          const extra = opt.label !== opt.value ? opt.label.replace(opt.value, '').replace(/^\s*-\s*/, '') : '';
                          return (
                            <button key={opt.value} type="button" onClick={() => { setCreatePriceCurrency(opt.value); setCreateCurrencyOpen(false); }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', border: 'none', background: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent', color: colors.textPrimary, fontSize: '0.85rem', fontWeight: isSelected ? '600' : '400', cursor: 'pointer', gap: '0.5rem' }}
                              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {flag && <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />}
                                <span style={{ fontWeight: '600' }}>{opt.value}</span>
                                {extra && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{extra}</span>}
                              </div>
                              {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Expected Attendees *</label>
                <input type="number" value={createMaxGuests} onChange={(e) => setCreateMaxGuests(e.target.value)} placeholder="e.g., 500" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
            </div>

            {/* Group Stream Discount */}
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Group Stream Discount (%) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={createGroupDiscount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || (Number(val) >= 0 && Number(val) <= 50)) setCreateGroupDiscount(val);
                  }}
                  placeholder="e.g., 10"
                  min="0"
                  max="50"
                  style={{
                    width: '120px',
                    padding: '0.625rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard
                  }}
                  required
                />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary }}>%</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.375rem', display: 'block' }}>
                Discount applied when viewers purchase stream access as a group (0 = no group option, max 50%). Set to 0 if you don't want to offer group packages.
              </span>
              {createGroupDiscount && Number(createGroupDiscount) > 0 && createPrice && (() => {
                const fee = Number(createPrice.replace(/[^\d]/g, ''));
                const disc = Number(createGroupDiscount);
                if (!fee || !disc) return null;
                const perPerson = Math.round(fee * (1 - disc / 100));
                const groupSize = getPlatformConfig().streaming.groupSize;
                const total = perPerson * groupSize;
                const saved = fee * groupSize - total;
                return (
                  <div style={{ marginTop: '0.5rem', padding: '0.625rem', backgroundColor: actualTheme === 'dark' ? '#1a2e1a' : '#F0FDF4', borderRadius: '0.5rem', border: `1px solid ${actualTheme === 'dark' ? '#2d4a2d' : '#BBF7D0'}` }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: actualTheme === 'dark' ? '#86EFAC' : '#166534' }}>Preview (group of 5):</span>
                    <span style={{ fontSize: '0.78rem', color: actualTheme === 'dark' ? '#A7F3D0' : '#15803D', display: 'block', marginTop: '0.25rem' }}>
                      5 viewers x {formatNumberWithCommas(String(fee))} {createPriceCurrency} = {formatNumberWithCommas(String(fee * groupSize))} {createPriceCurrency} → {formatNumberWithCommas(String(total))} {createPriceCurrency} (saving {formatNumberWithCommas(String(saved))} {createPriceCurrency})
                    </span>
                  </div>
                );
              })()}
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
              <input type="text" value={createOrganizer} onChange={(e) => setCreateOrganizer(e.target.value)} placeholder="e.g., Rwanda Basketball Federation" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
            </div>
          </div>

          {/* Section: Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <EditIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Description</span>
            </div>
            <textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Describe your event in detail..." style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical', color: colors.textPrimary }} />
          </div>

          {/* Section: Tags */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <TagIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Hash Tags</span>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" value={createTagInput} onChange={(e) => setCreateTagInput(e.target.value)} onKeyPress={handleAddTag} placeholder="Add hash tags" style={{ flex: 1, padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                <button type="button" onClick={addTagFromInput} style={{ padding: '0.625rem 1rem', backgroundColor: '#083A85', color: 'white', border: '2px solid #062a63', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
              {createTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {createTags.map((tag, index) => (
                    <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.375rem 0.625rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: '500' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CameraIcon />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Photographer Assignment</span>
              <span style={{ fontSize: '0.8rem', color: colors.textSecondary, marginLeft: 'auto' }}>(Optional)</span>
            </div>

            {/* Three assignment option buttons */}
            {photographerAssignMode === 'none' && !createPhotographerId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                <p style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.5rem' }}>Send an invitation email to a photographer to join the platform and be assigned to this event.</p>
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
                        `${apiUrl}/api/remote/coordinator/photographers/invite?email=${encodeURIComponent(invitePhotographerEmail.trim())}`,
                        { method: 'POST' }
                      );
                      const result = await response.json();
                      if (!response.ok || result.action === 0) {
                        throw new Error(result.message || 'Failed to invite photographer');
                      }
                      setInvitePhotographerEmail('');
                      setInviteError(null);
                      setPhotographerAssignMode('none');
                      setInviteSuccessMessage('Invitation sent successfully!');
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
                    {photographerPackages.map((pkg: { id: string; packageName: string; price: number; currencyId: string; description: string; durationHours: number }) => (
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
                          {pkg.currencyId} {pkg.price.toLocaleString()}
                        </div>
                        {pkg.durationHours > 0 && (
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
                            {pkg.durationHours} hour{pkg.durationHours !== 1 ? 's' : ''}
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


          {/* Escrow / Payment Milestone Selector — shown when photographer + package selected */}
          {createPhotographerId && createPackageId && (
            <div style={{ marginBottom: '1.5rem' }}>
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
            <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: `2px solid ${colors.borderPrimary}`, marginBottom: '4rem' }}>
            <button onClick={() => { resetCreateForm(); setShowCreateModal(false); }} style={{ padding: '0.75rem 1.25rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateEvent} disabled={isSubmitting} style={{ padding: '0.75rem 1.25rem', border: '2px solid #062a63', borderRadius: '0.5rem', background: isSubmitting ? '#9CA3AF' : '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{isSubmitting ? 'Creating...' : 'Create Event'}</button>
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
                    href="/user/event-coordinator/photographers"
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: actualTheme === 'dark' ? '#0F172A' : '#F8FAFC', border: `2px dashed ${colors.borderPrimary}`, borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.2rem' }}>No photographer assigned</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textSecondary }}>Your event is published — you can now hire a photographer.</div>
                </div>
                <Link href="/user/event-coordinator/photographers" style={{ padding: '0.5rem 0.875rem', backgroundColor: '#083A85', color: 'white', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Find Photographer
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', backgroundColor: actualTheme === 'dark' ? '#0F172A' : '#F8FAFC', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <CameraIcon />
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Publish this event to assign a photographer.</div>
              </div>
            )}

            {/* Share Link */}
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
                  onClick={() => { window.location.href = '/user/event-coordinator/gallery'; }}
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
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Event Stream">
        {shareEvent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0, backgroundColor: shareEvent.coverImage ? 'transparent' : '#0D1B2A' }}>
                <img src={shareEvent.coverImage || '/coverr.jpg'} alt={shareEvent.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: shareEvent.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '0.9rem' }}>{shareEvent.title}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{formatDate(shareEvent.date)}</div>
              </div>
            </div>
            {/* Stream Invite Token */}
            {shareEvent.streamInviteToken && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: actualTheme === 'dark' ? 'rgba(139,92,246,0.1)' : '#F5F3FF', borderRadius: '0.5rem', border: `1px solid ${actualTheme === 'dark' ? 'rgba(139,92,246,0.3)' : '#DDD6FE'}` }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Viewer Invite Token</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input readOnly value={shareEvent.streamInviteToken} style={{ flex: 1, padding: '0.5rem 0.75rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center' as const, color: colors.textPrimary, backgroundColor: colors.bgCard }} />
                  <button onClick={() => handleCopyLink(shareEvent.streamInviteToken!)} style={{ padding: '0.5rem 0.75rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{copiedLink ? 'Copied!' : 'Copy'}</button>
                </div>
                <p style={{ fontSize: '0.72rem', color: colors.textTertiary, margin: '0.35rem 0 0 0' }}>Share this token with viewers so they can access the live stream on the event page.</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`Join ${title} event stream: ${link}`)}` },
                { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join ${title} event stream`)}` },
                { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(`Join ${title} Event Stream`)}&body=${encodeURIComponent(`You're invited to join the ${title} event stream: ${link}`)}` },
                { name: 'Copy Link', icon: <LinkIcon />, color: colors.textSecondary, getUrl: () => '' },
                { name: 'QR Code', icon: <QRCodeIcon />, color: colors.textPrimary, getUrl: () => '' }
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    if (option.name === 'Copy Link') {
                      handleCopyLink(shareEvent.shareLink);
                    } else if (option.name === 'QR Code') {
                      alert('QR Code feature coming soon!');
                    } else {
                      const url = option.getUrl(shareEvent.shareLink, shareEvent.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    border: option.name === 'Copy Link' && copiedLink ? '1px solid #10B981' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    background: option.name === 'Copy Link' && copiedLink ? (actualTheme === 'dark' ? '#14532D' : '#ECFDF5') : colors.bgCard,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: option.name === 'Copy Link' && copiedLink ? '#10B981' : colors.textPrimary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!(option.name === 'Copy Link' && copiedLink)) {
                      e.currentTarget.style.borderColor = option.color;
                      e.currentTarget.style.color = option.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(option.name === 'Copy Link' && copiedLink)) {
                      e.currentTarget.style.borderColor = colors.borderPrimary;
                      e.currentTarget.style.color = colors.textPrimary;
                    }
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.name === 'Copy Link' && copiedLink ? 'Copied!' : option.name}</span>
                </button>
              ))}
            </div>
            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Event Stream Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={shareEvent.shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgTertiary
                  }}
                />
                <button
                  onClick={() => handleCopyLink(shareEvent.shareLink)}
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
                    transition: 'background 0.2s'
                  }}
                >
                  <CopyIcon />
                  {copiedLink ? 'Copied!' : 'Copy'}
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
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem'
          }}
          onClick={() => setPublishConfirmEvent(null)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard, borderRadius: '1rem',
              padding: '1.5rem', width: '400px', maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#e6f9eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="bi bi-globe" style={{ fontSize: '2rem', color: '#05a129' }}></i>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>
              Publish Event
            </h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              Are you sure you want to publish <strong style={{ color: colors.textPrimary }}>&quot;{publishConfirmEvent.title}&quot;</strong>?
            </p>
            <p style={{ fontSize: '0.85rem', color: '#05a129', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              This event will become visible to all users on the public platform. Photographers will be able to see and accept bookings for it.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={() => setPublishConfirmEvent(null)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard,
                  color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Cancel</button>
              <button
                onClick={() => handlePublishEvent(publishConfirmEvent.id)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: '2px solid #05a129', backgroundColor: '#05a129',
                  color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <i className="bi bi-globe" style={{ fontSize: '1rem' }}></i>
                Publish Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Photographer Warning Modal */}
      {noPhotographerEvent && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem'
          }}
          onClick={() => setNoPhotographerEvent(null)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard, borderRadius: '1rem',
              padding: '1.5rem', width: '420px', maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#d97706' }}></i>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>
              Photographer Required
            </h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              You cannot publish <strong style={{ color: colors.textPrimary }}>&quot;{noPhotographerEvent.title}&quot;</strong> because no photographer has been assigned to it.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#d97706', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              Please edit the event and assign a photographer before publishing.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setNoPhotographerEvent(null)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard,
                  color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Close</button>
              <button
                onClick={() => { const evt = noPhotographerEvent; setNoPhotographerEvent(null); openEditModal(evt); }}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: '2px solid #d97706', backgroundColor: '#d97706',
                  color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <i className="bi bi-camera" style={{ fontSize: '1rem' }}></i>
                Assign Photographer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Event Photo Warning Modal */}
      {noPhotoEvent && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem'
          }}
          onClick={() => setNoPhotoEvent(null)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard, borderRadius: '1rem',
              padding: '1.5rem', width: '400px', maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#d97706" strokeWidth="2"/></svg>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>
              Event Photo Required
            </h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              You cannot publish <strong style={{ color: colors.textPrimary }}>&quot;{noPhotoEvent.title}&quot;</strong> without a banner image.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#d97706', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              Please edit the event and upload a banner photo before publishing. This image will be the first thing guests see on the public platform.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setNoPhotoEvent(null)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard,
                  color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Close</button>
              <button
                onClick={() => { const evt = noPhotoEvent; setNoPhotoEvent(null); openEditModal(evt); }}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: '2px solid #d97706', backgroundColor: '#d97706',
                  color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Edit Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Booking Warning Modal */}
      {pendingBookingEvent && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem'
          }}
          onClick={() => setPendingBookingEvent(null)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard, borderRadius: '1rem',
              padding: '1.5rem', width: '400px', maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>
              Awaiting Photographer Confirmation
            </h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              You cannot publish <strong style={{ color: colors.textPrimary }}>&quot;{pendingBookingEvent.title}&quot;</strong> because the assigned photographer has not yet accepted the booking.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#d97706', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              {pendingBookingEvent.bookingStatus?.toUpperCase() === 'REJECTED'
                ? 'The photographer has rejected this booking. Please assign a different photographer before publishing.'
                : 'Please wait for the photographer to accept, or assign a different photographer.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setPendingBookingEvent(null)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard,
                  color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Modal */}
      {unpublishConfirmEvent && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '1rem'
          }}
          onClick={() => setUnpublishConfirmEvent(null)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard, borderRadius: '1rem',
              padding: '1.5rem', width: '400px', maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#fdf3d7',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="bi bi-eye-slash-fill" style={{ fontSize: '2rem', color: '#d19d0d' }}></i>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>
              Unpublish Event
            </h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              Are you sure you want to unpublish <strong style={{ color: colors.textPrimary }}>&quot;{unpublishConfirmEvent.title}&quot;</strong>?
            </p>
            <p style={{ fontSize: '0.85rem', color: '#d19d0d', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              This event will be removed from the public platform and will no longer be visible to users or photographers.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={() => setUnpublishConfirmEvent(null)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard,
                  color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer'
                }}
              >Keep Published</button>
              <button
                onClick={() => handleUnpublishEvent(unpublishConfirmEvent.id)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  border: '2px solid #d19d0d', backgroundColor: '#d19d0d',
                  color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <i className="bi bi-eye-slash" style={{ fontSize: '1rem' }}></i>
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2rem', color: '#DC2626' }}></i>
              </div>
            </div>

            {/* Modal Header */}
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: colors.textPrimary,
              margin: 0,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>Delete Event</h2>

            {/* Modal Content */}
            <p style={{
              fontSize: '0.95rem',
              color: colors.textSecondary,
              margin: 0,
              marginBottom: '0.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{deleteEvent.title}&quot;</strong>?
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: '#DC2626',
              margin: 0,
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              This action cannot be undone. All guests will be notified and any booked photographer will be released.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '4rem'
            }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Keep Event
              </button>
              <button
                onClick={handleDeleteEvent}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <i className="bi bi-trash" style={{ fontSize: '1rem' }}></i>
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Event Modal */}
      {showPauseModal && pauseEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => setShowPauseModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-pause-circle-fill" style={{ fontSize: '2rem', color: '#F59E0B' }}></i>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>Pause Event</h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              Are you sure you want to pause <strong style={{ color: colors.textPrimary }}>&quot;{pauseEvent.title}&quot;</strong>?
            </p>
            <p style={{ fontSize: '0.85rem', color: '#F59E0B', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              The event will be put on hold. The photographer will be notified. You can resume it at any time.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={() => setShowPauseModal(false)}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePauseEvent}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '2px solid #F59E0B', backgroundColor: '#F59E0B', color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <i className="bi bi-pause-fill" style={{ fontSize: '1rem' }}></i>
                Pause Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditEvent(null); }} title="Edit Event" maxWidth="700px">
        {editEvent && (
          <div>
            {/* Section: Event Image */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CameraIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Event Image</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.375rem' }}>Banner Image (1200x800)</label>
                <div style={{
                  border: `2px dashed ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.bgTertiary,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {editBannerImagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image src={editBannerImagePreview} alt="Banner" fill style={{ objectFit: 'cover' }} />
                      <button onClick={() => { setEditBannerImage(null); setEditBannerImagePreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>×</button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem' }}>
                      <input type="file" accept="image/*" onChange={handleEditBannerImageChange} style={{ display: 'none' }} />
                      <ImageIcon />
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>Click to upload banner image</p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Basic Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <EditIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Basic Information</span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Event Title *</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="e.g., APR BBC Vs Espoir BCC" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CalendarIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Date & Time</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

            {/* Section: Pricing & Capacity */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <DollarIcon />
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Pricing & Capacity</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Live Stream Access Fee</label>
                  <div style={{ display: 'flex', gap: '0' }}>
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(formatNumberWithCommas(e.target.value))}
                      placeholder="e.g., 15,000"
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        border: `2px solid ${colors.borderPrimary}`,
                        borderRight: 'none',
                        borderRadius: '0.5rem 0 0 0.5rem',
                        fontSize: '0.9rem',
                        color: colors.textPrimary,
                        backgroundColor: colors.bgCard
                      }}
                    />
                    <div ref={editCurrencyRef} style={{ position: 'relative', minWidth: '120px' }}>
                      <button type="button" onClick={() => setEditCurrencyOpen(!editCurrencyOpen)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
                        padding: '0.625rem 0.5rem', border: `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0 0.5rem 0.5rem 0', borderLeft: 'none',
                        fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary,
                        backgroundColor: colors.bgTertiary, cursor: 'pointer',
                      }}>
                        {CURRENCY_FLAG_MAP[editPriceCurrency] && <img src={`https://flagcdn.com/w40/${CURRENCY_FLAG_MAP[editPriceCurrency]}.png`} alt="" style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />}
                        <span style={{ flex: 1, textAlign: 'left' }}>{editPriceCurrency}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: editCurrencyOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                          <path d="M6 9L12 15L18 9" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {editCurrencyOpen && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 0.35rem)', right: 0, backgroundColor: colors.bgSecondary, borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `2px solid ${colors.borderPrimary}`, padding: '0.4rem', minWidth: '200px', zIndex: 100 }}>
                          {currencyOptions.map(opt => {
                            const flag = CURRENCY_FLAG_MAP[opt.value] || '';
                            const isSelected = editPriceCurrency === opt.value;
                            const extra = opt.label !== opt.value ? opt.label.replace(opt.value, '').replace(/^\s*-\s*/, '') : '';
                            return (
                              <button key={opt.value} type="button" onClick={() => { setEditPriceCurrency(opt.value); setEditCurrencyOpen(false); }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', border: 'none', background: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent', color: colors.textPrimary, fontSize: '0.85rem', fontWeight: isSelected ? '600' : '400', cursor: 'pointer', gap: '0.5rem' }}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {flag && <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />}
                                  <span style={{ fontWeight: '600' }}>{opt.value}</span>
                                  {extra && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{extra}</span>}
                                </div>
                                {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Expected Attendees *</label>
                  <input type="number" value={editMaxGuests} onChange={(e) => setEditMaxGuests(e.target.value)} placeholder="e.g., 500" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                </div>
              </div>

              {/* Group Stream Discount */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Group Stream Discount (%) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={editGroupDiscount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 0 && Number(val) <= 50)) setEditGroupDiscount(val);
                    }}
                    placeholder="e.g., 10"
                    min="0"
                    max="50"
                    style={{
                      width: '120px',
                      padding: '0.625rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      color: colors.textPrimary,
                      backgroundColor: colors.bgCard
                    }}
                    required
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary }}>%</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.375rem', display: 'block' }}>
                  Discount applied when viewers purchase stream access as a group (0 = no group option, max 50%). Set to 0 if you don't want to offer group packages.
                </span>
                {editGroupDiscount && Number(editGroupDiscount) > 0 && editPrice && (() => {
                  const fee = Number(editPrice.replace(/[^\d]/g, ''));
                  const disc = Number(editGroupDiscount);
                  if (!fee || !disc) return null;
                  const perPerson = Math.round(fee * (1 - disc / 100));
                  const groupSize = getPlatformConfig().streaming.groupSize;
                  const total = perPerson * groupSize;
                  const saved = fee * groupSize - total;
                  return (
                    <div style={{ marginTop: '0.5rem', padding: '0.625rem', backgroundColor: actualTheme === 'dark' ? '#1a2e1a' : '#F0FDF4', borderRadius: '0.5rem', border: `1px solid ${actualTheme === 'dark' ? '#2d4a2d' : '#BBF7D0'}` }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: actualTheme === 'dark' ? '#86EFAC' : '#166534' }}>Preview (group of 5):</span>
                      <span style={{ fontSize: '0.78rem', color: actualTheme === 'dark' ? '#A7F3D0' : '#15803D', display: 'block', marginTop: '0.25rem' }}>
                        5 viewers x {formatNumberWithCommas(String(fee))} {editPriceCurrency} = {formatNumberWithCommas(String(fee * groupSize))} {editPriceCurrency} → {formatNumberWithCommas(String(total))} {editPriceCurrency} (saving {formatNumberWithCommas(String(saved))} {editPriceCurrency})
                      </span>
                    </div>
                  );
                })()}
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: `2px solid ${colors.borderPrimary}`, marginBottom: '4rem' }}>
              <button
                onClick={() => { setShowEditModal(false); setEditEvent(null); }}
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
