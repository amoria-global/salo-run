'use client';

// app/pages/event-coordinator/events.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import MoneyInput from '@/app/components/MoneyInput';
import LocationRulesField, { fetchSavedRules, useCurrencyChoices, useLocationRules } from '@/app/components/LocationRulesField';
import { CURRENCY_FLAG_MAP } from '@/lib/currencyFlag';
import { WishInvitesField, focusWishInvitesField } from '@/app/components/wishes/WishInvitesField';
import { AttendanceField, eventFieldId, focusEventField } from '@/app/components/events/AttendanceField';
import { FieldError, invalidFieldProps } from '@/app/components/errors/FieldError';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { attendanceFromSaved, firstInvalidField, locationPayload, maxGuestsPayload, validateEventForm, type AttendanceChoice } from '@/lib/events/eventFormRules';
import { invitesOn, wishInvitesError } from '@/lib/wishes/wishInvites';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localforage from 'localforage';
import { useRouter, useSearchParams } from 'next/navigation';
import GetStartedModal from '@/app/components/events/GetStartedModal';
import { confirmYear } from '@/app/lib/farFutureDate';
import { useGetStarted } from '@/app/lib/useGetStarted';
import { CREATE_LABEL } from '@/app/lib/getStarted';
import GeoPricingManager from '@/app/components/GeoPricingManager';
import Sidebar from '@/app/components/sidebar';
import { platformAlert } from '@/app/components/PlatformAlert';
import Topbar from '@/app/components/topbar';
import EventConfirmModal from '@/app/components/EventConfirmModal';
import EventQrWizard from '@/app/components/EventQrWizard';
import HostEntryTiles from '@/app/components/HostEntryTiles';
import SelfStreamLink from '@/app/components/SelfStreamLink';
import { useHostEntry } from '@/app/components/useHostEntry';
import { selfStreamFeeError } from '@/lib/events/selfStream';
import OwnerGoLive from '@/app/components/live/OwnerGoLive';
import { canOwnerGoLive } from '@/lib/events/ownerGoLive';
import RebookWizard from '@/app/components/RebookWizard';
import { useTheme } from '@/app/context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { getApiUrl, normalizeImageUrl, autoCapitalize, capitalizeWords } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';
import { eventPriceError } from '@/app/components/eventPriceValidation';
import { usePaymentLimit } from '@/lib/paymentLimits';
import { useCurrency } from '@/app/context/CurrencyContext';
import BookingModeSelectorModal from '@/app/components/hybrid/BookingModeSelectorModal';
import HybridEventWizardModal from '@/app/components/hybrid/HybridEventWizardModal';
import CandidatesShortlistModal from '@/app/components/hybrid/CandidatesShortlistModal';
import { ModeBadge, friendlyEventStatus, isOpenHybrid, isUpcomingEventStatus, modeOf } from '@/app/components/hybrid/hybridUi';

// Configure localforage for event form data 
const eventFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'event_form_draft'
});

// Storage key for the create event form
const CREATE_EVENT_FORM_KEY = 'create_event_form_draft';

// Interface for saved form data
export interface CreateEventFormData {
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
export type EventCategory = string;

export type EventStatus = 'UPCOMING' | 'LIVE' | 'PUBLISHED' | 'PAUSED' | 'upcoming' | 'ongoing' | 'completed' | 'published' | 'paused';

export interface Event {
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
  groupDiscountPercentage?: number;
  guestCount: number;
  maxGuests: number;
  status: EventStatus;
  organizer: string;
  tags: string[];
  hasPhotographer: boolean;
  bookingStatus?: string;
  photographerId?: string;
  bookingMode?: string;
  photographerName?: string;
  photographerImage?: string;
  isPublished: boolean;
  /** PUBLIC (a photographer streams it) or PRIVATE (its owner streams it). */
  eventVisibility?: string;
  /** Whether viewers may invite others to send wishes. Undefined on a server that predates the setting (treated as on). */
  allowWishInvites?: boolean;
  /** IN_PERSON, HYBRID or STREAM_ONLY as saved; the edit form preselects it. */
  attendanceMode?: string;
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
export interface ModalProps {
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

export function useCoordinatorEvents() {
  const { formatPrice } = useCurrency();
  const { colors, actualTheme } = useTheme();
  const { token, user } = useDashboardAuth();
  const { profile } = useUserProfile();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'published' | 'past' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { canHost, caption: hostedCaption } = useHostEntry();
  // Post My Event (hybrid booking), the same flow clients have.
  const [showBookingModeSelector, setShowBookingModeSelector] = useState(false);
  const [showHybridWizard, setShowHybridWizard] = useState(false);
  const [hybridWizardEvent, setHybridWizardEvent] = useState<{ id: string; title?: string; eventDate?: string; startTime?: string; endTime?: string; city?: string; venue?: string } | null>(null);
  const [candidateModalEvent, setCandidateModalEvent] = useState<Event | null>(null);
  const openPostWizard = (ev?: Event | null) => {
    setHybridWizardEvent(ev ? { id: ev.id, title: ev.title, eventDate: ev.date, startTime: ev.time, endTime: ev.endTime, city: ev.location?.city, venue: ev.location?.address } : null);
    setShowHybridWizard(true);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('post') === '1') {
      openPostWizard(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('post');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showEventDetails, setShowEventDetails] = useState<Event | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  // Go live (camera or OBS) for a private event the user streams themselves.
  const [goLiveEvent, setGoLiveEvent] = useState<Event | null>(null);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseEvent, setPauseEvent] = useState<Event | null>(null);
  const [pausingEventId, setPausingEventId] = useState<string | null>(null);
  const [resumingEventId, setResumingEventId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  // Geo-pricing manager modal target (an event to price by location).
  const [geoEvent, setGeoEvent] = useState<Event | null>(null);
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
    // Fetch booked/connected photographers (authenticated. same as inbox new chat)
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
  // The saved mode is preselected when an event is opened for editing.
  const [editAttendance, setEditAttendance] = useState<AttendanceChoice | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editPriceCurrency, setEditPriceCurrency] = useState('RWF');
  usePaymentLimit(editPriceCurrency); // fills the cache the fee validators read
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
  // Empty until the person types one: the form shows the country of their profile instead of a hardcoded one.
  const [createCountry, setCreateCountry] = useState('');
  // How guests attend: no default on a new event, so the choice is required (see lib/events/eventFormRules).
  const [createAttendance, setCreateAttendance] = useState<AttendanceChoice | null>(null);
  const [createShowMore, setCreateShowMore] = useState(false);
  // Errors stay hidden until the first click on Create, then follow the form live as each field is fixed.
  const [createShowErrors, setCreateShowErrors] = useState(false);
  const [createPrice, setCreatePrice] = useState('');
  // Location pricing & access: the rules save WITH the event (create and edit), in one transaction.
  const geoCreate = useLocationRules();
  const geoEdit = useLocationRules();
  const currencyChoices = useCurrencyChoices();
  // On an edit the saved rules must be read before they are sent; a failed read sends nothing, so they are never wiped.
  const [editRulesLoaded, setEditRulesLoaded] = useState(false);
  const [createPriceCurrency, setCreatePriceCurrency] = useState('RWF');
  usePaymentLimit(createPriceCurrency);
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
  // Wish invites: no default on a new event, so the choice is required before it can be created.
  const [createWishInvites, setCreateWishInvites] = useState<boolean | null>(null);
  const [createWishInvitesErr, setCreateWishInvitesErr] = useState<string | null>(null);
  const [editWishInvites, setEditWishInvites] = useState<boolean | null>(null);
  const [createPackageId, setCreatePackageId] = useState<string>('');
  const [photographerPackages, setPhotographerPackages] = useState<{id: string; packageName: string; price: number; currencyId: string; currencySymbol: string; currencyAbbreviation: string; description: string; durationHours: number; includedPhotos: number; includedVideos: number}[]>([]);
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
            setCreateCountry(savedDraft.createCountry || '');
            setCreatePrice(savedDraft.createPrice || '');
            setCreatePriceCurrency(savedDraft.createPriceCurrency || 'RWF');
            setCreateMaxGuests(savedDraft.createMaxGuests || '');
            setCreateOrganizer(savedDraft.createOrganizer || '');
            setCreateTags(savedDraft.createTags || []);
            setCreatePhotographerId(savedDraft.createPhotographerId || '');
            setCreatePackageId(savedDraft.createPackageId || '');
            setCreateEventVisibility('PUBLIC');
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
          currencySymbol: (p.currencySymbol as string) || (p.currency as any)?.symbol || '',
          currencyAbbreviation: (p.currencyAbbreviation as string) || (p.currency as any)?.abbreviation || '',
          description: (p.description as string) || '',
          durationHours: (p.durationHours as number) || 0,
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

  // Clear saved draft from IndexedDB
  const clearFormDraft = useCallback(async () => {
    try {
      await eventFormStorage.removeItem(CREATE_EVENT_FORM_KEY);
    } catch (error) {
      console.error('Failed to clear form draft:', error);
    }
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
        // Fallback silently. dropdowns will be empty
      }
    })();
  }, []);


  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const router = useRouter();
  const getStarted = useGetStarted({ role: 'coordinator', canHost, listLoaded: !isLoadingEvents, hasItems: events.length > 0 });
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);
  const [unpublishingEventId, setUnpublishingEventId] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<{ id: string; title: string; justPublished: boolean } | null>(null);
  const [publishConfirmEvent, setPublishConfirmEvent] = useState<Event | null>(null);
  const [unpublishConfirmEvent, setUnpublishConfirmEvent] = useState<Event | null>(null);
  // Surfaced when the backend rejects an unpublish because the event is
  // currently live. Blocks the action and points the creator at the
  // photographer so the stream can be ended first.
  const [ongoingUnpublishBlock, setOngoingUnpublishBlock] = useState<{ title: string; photographerName: string | null } | null>(null);
  const [noPhotographerEvent, setNoPhotographerEvent] = useState<Event | null>(null);
  const [pendingBookingEvent, setPendingBookingEvent] = useState<Event | null>(null);
  const [rebookEvent, setRebookEvent] = useState<Event | null>(null);
  const [noPhotoEvent, setNoPhotoEvent] = useState<Event | null>(null);

  // Fetch events. use coordinator endpoint (returns only this user's events)
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
            // The "price" field on the UI event card is the LIVE STREAM FEE
            // (per-viewer access charge), not the photographer's package
            // price. Reading evt.price here was a long-standing bug. it
            // pulled the wrong number, so the edit modal showed "Free"
            // even when the coordinator had set a stream fee. Now we
            // prefer evt.streamFee (which the booking + edit endpoints
            // both write to) and only fall back to evt.price for legacy
            // rows that pre-date the streamFee column.
            price: (() => {
              const sf = (evt as Record<string, unknown>).streamFee;
              if (sf !== undefined && sf !== null && Number(sf) > 0) return `${sf}`;
              if (evt.price) return `${evt.price}`;
              return 'Free';
            })(),
            priceCurrency: (evt.streamFeeCurrencyAbbreviation as string) || (evt.priceCurrency as string) || 'RWF',
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
            bookingMode: (evt.bookingMode as string) || undefined,
            photographerId: (evt.photographerId as string) || (evt.photographer && (evt.photographer as Record<string, unknown>).id as string) || undefined,
            photographerName: (evt.photographerName as string) || (evt.photographer ? `${(evt.photographer as Record<string, unknown>).firstName || ''} ${(evt.photographer as Record<string, unknown>).lastName || ''}`.trim() : '') || '',
            photographerImage: (evt.photographerImage as string) || (evt.photographer && (evt.photographer as Record<string, unknown>).profilePicture as string) || '',
            isPublished: evt.isPublished === true,
            eventVisibility: typeof evt.eventVisibility === 'string' ? evt.eventVisibility : undefined,
            attendanceMode: typeof evt.attendanceMode === 'string' ? evt.attendanceMode : undefined,
            allowWishInvites: typeof evt.allowWishInvites === 'boolean' ? evt.allowWishInvites : undefined,
            inviteCode: (evt.inviteCode as string) || (evt.hostId as string) || '',
            streamInviteToken: (evt.streamInviteToken as string) || undefined,
            shareLink: `${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/events/view-event?id=${evt.id}`,
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
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, [user?.id, fetchMyEvents]);

  const handlePublishEvent = async (eventId: string) => {
    // Gate on `user` rather than `token`. cookie-only sessions (no Bearer
    // in localStorage) populate `user` via the /profile cookie handshake but
    // leave `token` empty, and those sessions are still fully authenticated.
    if (!user) return;
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
        setQrEvent({ id: eventId, title: events.find(e => e.id === eventId)?.title ?? 'Your event', justPublished: true });
      } else {
        const data = await res.json().catch(() => ({}));
        platformAlert(data.message || 'Failed to publish event. Please try again.');
      }
    } catch (err) {
      platformAlert('Failed to publish event. Please try again.');
    }
    setPublishingEventId(null);
  };

  const handleUnpublishEvent = async (eventId: string) => {
    if (!user) return;
    // Capture the event title before we close the confirm modal. used later
    // if the backend responds with the "event is live" block so the modal can
    // name which event is stuck.
    const targetTitle = unpublishConfirmEvent?.title
      ?? events.find(e => e.id === eventId)?.title
      ?? 'this event';
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
        // Backend returns 409 with { error: "EVENT_ONGOING", photographerName }
        // when the event is live and must be ended by the photographer first.
        // Show the dedicated modal instead of the generic alert.
        if (res.status === 409 && data?.error === 'EVENT_ONGOING') {
          setOngoingUnpublishBlock({
            title: targetTitle,
            photographerName: data?.photographerName ?? null,
          });
        } else {
          platformAlert(data.message || 'Failed to unpublish event. Please try again.');
        }
      }
    } catch (err) {
      platformAlert('Failed to unpublish event. Please try again.');
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

  // Backend rejects PUT on completed/paused events with a 400. Hide Edit in
  // those states so the user doesn't get a confusing "Bad request" toast for
  // an action that was never going to succeed.
  const isEventEditable = (event: Event): boolean => {
    const s = event.status.toUpperCase();
    if (s === 'COMPLETED') return false;
    if (s === 'PAUSED') return false;
    if (event.completionStatus && event.completionStatus !== 'NOT_COMPLETED') return false;
    return true;
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
      platformAlert(err instanceof Error ? err.message : 'Failed to resume event');
      fetchMyEvents();
    } finally {
      setResumingEventId(null);
    }
  };

  const openEditModal = (event: Event) => {
    setEditEvent(event);
    // The saved value; an event from before the setting reads as on.
    setEditWishInvites(invitesOn(event.allowWishInvites));
    setEditAttendance(attendanceFromSaved(event.attendanceMode, event.location.address));
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
    setEditPriceCurrency(event.priceCurrency || 'RWF');
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
    geoEdit.reset();
    setEditRulesLoaded(false);
    fetchSavedRules('event', String(event.id))
      .then((rules) => {
        geoEdit.hydrate(rules);
        setEditRulesLoaded(true);
      })
      .catch(() => undefined);
    setShowEditModal(true);
  };

  const handleEditEvent = async () => {
    if (!editEvent) return;
    const editRules = validateEventForm(
      {
        hasCover: true,
        title: editTitle,
        category: String(editCategory ?? ''),
        eventDate: editDate,
        startTime: editTime,
        attendance: editAttendance,
        venueName: editVenueName,
        city: editCity,
        wishInvites: editWishInvites,
      },
      { legacyLocation: true },
    );
    const editBlocked = firstInvalidField(editRules);
    if (editBlocked) {
      setSubmitError(editRules[editBlocked] ?? null);
      if (editBlocked === 'wishInvites') focusWishInvitesField();
      else focusEventField(editBlocked);
      return;
    }

    // Currency-aware minimum stream access fee
    if (!confirmYear(editDate)) return;
    if (eventPriceError(editPrice || '', editPriceCurrency)) {
      setSubmitError(eventPriceError(editPrice || '', editPriceCurrency) ?? 'Enter a valid price.');
      return;
    }

    // A rule typed into the new-rule row but not added would be lost on save: finish or cancel it first.
    if (geoEdit.blockSave()) return;

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
        title: capitalizeWords(editTitle),
        description: autoCapitalize(editDescription),
        eventType: editCategory,
        eventDate: editDate,
        startTime: editTime ? parseTimeToApiString(editTime) : null,
        endTime: editEndTime ? parseTimeToApiString(editEndTime) : null,
        location: capitalizeWords(locationPayload(editAttendance, { venueName: editVenueName, address: editAddress, city: editCity, country: editCountry }) ?? ''),
        attendanceMode: editAttendance ?? undefined,
        eventOrganizer: capitalizeWords(editOrganizer),
        eventTags: editTags.join(','),
        price: editNumericPrice ? Number(editNumericPrice) : 0,
        priceCurrency: editPriceCurrency || 'RWF',
        allowWishInvites: editWishInvites === true,
        streamFee: editNumericPrice ? Number(editNumericPrice) : 0,
        streamFeeCurrencyId: (() => {
          const match = currencyOptions.find(c => c.value === (editPriceCurrency || 'RWF'));
          return match?.id || undefined;
        })(),
        // Empty means no limit and sends nothing. Only clearing a limit that was set sends 0, the one way to remove it.
        maxGuests: maxGuestsPayload(editMaxGuests) ?? ((editEvent.maxGuests ?? 0) > 0 ? 0 : undefined),
        groupDiscountPercentage: editGroupDiscount ? Number(editGroupDiscount) : 0,
      };
      const validEditPhotographerId = (editPhotographerId && isValidUUID(editPhotographerId)) ? editPhotographerId : null;
      if (validEditPhotographerId) {
        editPayload.photographerId = validEditPhotographerId;
      }
      if (editRulesLoaded) editPayload.geoRules = geoEdit.payload();
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
        throw Object.assign(new Error(errData.message || `Failed to update event: ${editRes.status}`), { field: errData.field });
      }
      const editResult = await editRes.json().catch(() => null);
      if (editResult && editResult.action === 0) {
        throw Object.assign(new Error(editResult.message || 'Failed to update event.'), { field: editResult.field });
      }
      // Upload banner image if a new file was selected
      if (editBannerImageFile) {
        try {
          const photoForm = new FormData();
          photoForm.append('file', editBannerImageFile);
          const photoRes = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${editEvent.id}/photo`, {
            method: 'POST',
            body: photoForm,
          });
          const photoJson = await photoRes.json().catch(() => null);
          if (!photoRes.ok || photoJson?.action === 0) {
            platformAlert(photoJson?.message || 'The event was saved but its photo could not be uploaded. Please try again.', {
              title: 'Event photo not saved',
              tone: 'danger',
            });
          }
        } catch (photoErr) {
          console.error('Failed to upload event photo:', photoErr);
        }
      }
      // Refresh to get the updated eventPhoto URL
      await fetchMyEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
      // A refused location rule names its row: show it there and keep the form open.
      const ruleField = (err as { field?: unknown } | null)?.field;
      if (typeof ruleField === 'string' && ruleField.startsWith('geoRules')) {
        geoEdit.showServerError(ruleField, err instanceof Error ? err.message : 'That location rule cannot be saved.');
        return;
      }
      platformAlert(err instanceof Error ? err.message : 'Failed to update event. Please try again.');
    }

    setShowEditModal(false);
    setEditEvent(null);
  };

  // Reset create form
  const resetCreateForm = (clearDraft: boolean = true) => {
    geoCreate.reset();
    setCreateWishInvites(null);
    setCreateWishInvitesErr(null);
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
    setCreateCountry('');
    setCreateAttendance(null);
    setCreateShowMore(false);
    setCreateShowErrors(false);
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

  // Which required fields still block Create, from the one shared rule set (lib/events/eventFormRules).
  const createRules = validateEventForm({
    hasCover: !!(createBannerImageFile || createBannerImagePreview),
    title: createTitle,
    category: String(createCategory ?? ''),
    eventDate: createDate,
    startTime: createTime,
    attendance: createAttendance,
    venueName: createVenueName,
    city: createCity,
    wishInvites: createWishInvites,
  });
  const createShown = createShowErrors ? createRules : {};
  const createBlocked = Object.keys(createRules).length > 0;
  const eventLabelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' };
  const eventInputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary };

  // Handle create event
  const handleCreateEvent = async () => {
    // Every required field is checked together by the shared rules; the first blocked one is scrolled to and focused.
    // Required fields are never inside "More options", so an error never needs it opened.
    setCreateShowErrors(true);
    const firstBlocked = firstInvalidField(createRules);
    if (firstBlocked) {
      setSubmitError(null);
      if (firstBlocked === 'wishInvites') focusWishInvitesField();
      else focusEventField(firstBlocked);
      return;
    }
    const missingFields: string[] = [];
    if (createPrice === undefined || createPrice === null || createPrice === '') missingFields.push('Price');
    if (createGroupDiscount === '') missingFields.push('Group Stream Discount');
    if (missingFields.length > 0) {
      setSubmitError(`Please fill in the required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!confirmYear(createDate)) return;

    // A rule typed into the new-rule row but not added would be lost on save: finish or cancel it first.
    if (geoCreate.blockSave()) { setSubmitError(null); return; }

    if (createEventVisibility === 'PRIVATE') {
      const feeError = selfStreamFeeError(createPrice, createPriceCurrency || 'RWF');
      if (feeError) { setSubmitError(feeError); return; }
    } else if (eventPriceError(createPrice || '', createPriceCurrency)) {
      setSubmitError(eventPriceError(createPrice || '', createPriceCurrency) ?? 'Enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call the backend API. Gate on `user`, not `token`, so cookie-only
      // sessions (no Bearer in localStorage) aren't blocked before the
      // request is even sent. dashboardAuthFetch handles attaching the
      // HttpOnly cookie via credentials: 'include'.
      if (user) {
        const apiUrl = getApiUrl();

        // Only an in person event has a venue; a stream-only event sends none.
        const locationStr = locationPayload(createAttendance, { venueName: createVenueName, address: createAddress, city: createCity, country: createCountry || profile.country }) ?? '';
        const tagsStr = createTags.length > 0 ? createTags.join(',') : createCategory;

        const validPhotographerId = (createEventVisibility !== 'PRIVATE' && createPhotographerId && isValidUUID(createPhotographerId)) ? createPhotographerId : null;

        const numericPrice = createPrice.replace(/[^\d]/g, '');

        const payload: Record<string, unknown> = {
          title: capitalizeWords(createTitle),
          description: autoCapitalize(createDescription || ''),
          eventType: createCategory,
          startTime: parseTimeToApiString(createTime),
          endTime: createEndTime ? parseTimeToApiString(createEndTime) : parseTimeToApiString(createTime),
          eventDate: createDate,
          location: capitalizeWords(locationStr),
          attendanceMode: createAttendance ?? undefined,
          eventOrganizer: capitalizeWords(createOrganizer || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Organizer'),
          eventVisibility: createEventVisibility || 'PUBLIC',
          allowWishInvites: createWishInvites === true,
          eventTags: tagsStr,
          price: numericPrice ? Number(numericPrice) : 0,
          priceCurrency: createPriceCurrency || 'RWF',
          streamFee: numericPrice ? Number(numericPrice) : 0,
          streamFeeCurrencyId: (() => {
            const match = currencyOptions.find(c => c.value === (createPriceCurrency || 'RWF'));
            return match?.id || undefined;
          })(),
          // Empty means no limit: nothing is sent.
          maxGuests: maxGuestsPayload(createMaxGuests),
          groupDiscountPercentage: createGroupDiscount ? Number(createGroupDiscount) : 0,
          notes: '',
        };

        // Only include photographer/package IDs if they are valid UUIDs. sending null causes backend JPA errors
        if (validPhotographerId) {
          payload.photographerId = validPhotographerId;
        }

        if (createEventVisibility !== 'PRIVATE' && createPackageId && isValidUUID(createPackageId)) {
          payload.packageId = createPackageId;
        }

        if (validPhotographerId && createPackageId) {
          payload.escrowPercentage = createEscrowPercentage;
        }

        payload.geoRules = geoCreate.payload();

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
                const photoRes = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/events/${newEventId}/photo`, {
                  method: 'POST',
                  body: photoForm,
                });
                const photoJson = await photoRes.json().catch(() => null);
                if (!photoRes.ok || photoJson?.action === 0) {
                  platformAlert(photoJson?.message || 'The event was saved but its photo could not be uploaded. Please try again.', {
                    title: 'Event photo not saved',
                    tone: 'danger',
                  });
                }
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
          throw Object.assign(new Error(errorData.message || 'Failed to create event. Please try again.'), { field: errorData.field });
        }
      } else {
        throw new Error('Authentication required. Please log in again.');
      }
    } catch (error) {
      console.error('Event creation error:', error);
      // A refused location rule names its row: show it there.
      const ruleField = (error as { field?: unknown } | null)?.field;
      if (typeof ruleField === 'string' && ruleField.startsWith('geoRules')) {
        geoCreate.showServerError(ruleField, error instanceof Error ? error.message : 'That location rule cannot be saved.');
      }
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
      case 'matches_awaiting_selection':
      case 'candidates_available':
        return { background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(124,58,237,0.30)' };
      case 'matching':
      case 'published_pending_assignment':
        return { background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(2,132,199,0.30)' };
      case 'hybrid_timeout':
      case 'matching_failed':
        return { background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(217,119,6,0.30)' };
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
      return matchesSearch && isUpcomingEventStatus(event.status);
    } else if (activeTab === 'published') {
      return matchesSearch && statusLower === 'published';
    } else if (activeTab === 'past') {
      // The backend reports a past-dated event that isn't completed as AWAITING_REVIEW; it is past too, as on the client page.
      return matchesSearch && (statusLower === 'completed' || statusLower === 'awaiting_review');
    }
    return matchesSearch;
  });

  const upcomingCount = events.filter(e => isUpcomingEventStatus(e.status)).length;
  const publishedCount = events.filter(e => e.status.toLowerCase() === 'published').length;
  const completedCount = events.filter(e => {
    const s = e.status.toLowerCase();
    return s === 'completed' || s === 'awaiting_review';
  }).length;
  const pastCount = completedCount;


  return {
    formatPrice,
    colors,
    actualTheme,
    token,
    user,
    profile,
    searchParams,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    showCreateModal,
    setShowCreateModal,
    canHost,
    hostedCaption,
    showBookingModeSelector,
    setShowBookingModeSelector,
    showHybridWizard,
    setShowHybridWizard,
    hybridWizardEvent,
    setHybridWizardEvent,
    candidateModalEvent,
    setCandidateModalEvent,
    openPostWizard,
    showEventDetails,
    setShowEventDetails,
    showShareModal,
    setShowShareModal,
    goLiveEvent,
    setGoLiveEvent,
    shareEvent,
    setShareEvent,
    showDeleteModal,
    setShowDeleteModal,
    deleteEvent,
    setDeleteEvent,
    showPauseModal,
    setShowPauseModal,
    pauseEvent,
    setPauseEvent,
    pausingEventId,
    setPausingEventId,
    resumingEventId,
    setResumingEventId,
    showEditModal,
    setShowEditModal,
    editEvent,
    setEditEvent,
    geoEvent,
    setGeoEvent,
    copiedLink,
    setCopiedLink,
    apiCurrencies,
    setApiCurrencies,
    pastPhotographers,
    setPastPhotographers,
    showFindPhotographerModal,
    setShowFindPhotographerModal,
    photographerSearchQuery,
    setPhotographerSearchQuery,
    photographerAssignMode,
    setPhotographerAssignMode,
    invitePhotographerEmail,
    setInvitePhotographerEmail,
    isSendingInvite,
    setIsSendingInvite,
    inviteError,
    setInviteError,
    showInviteSuccessModal,
    setShowInviteSuccessModal,
    inviteSuccessMessage,
    setInviteSuccessMessage,
    editPhotographerId,
    setEditPhotographerId,
    editPhotographerAssignMode,
    setEditPhotographerAssignMode,
    editPhotographerSearchQuery,
    setEditPhotographerSearchQuery,
    platformPhotographers,
    setPlatformPhotographers,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editCategory,
    setEditCategory,
    editStatus,
    setEditStatus,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    editEndTime,
    setEditEndTime,
    editDuration,
    setEditDuration,
    editVenueName,
    setEditVenueName,
    editAddress,
    setEditAddress,
    editCity,
    setEditCity,
    editCountry,
    setEditCountry,
    editAttendance,
    setEditAttendance,
    editPrice,
    setEditPrice,
    editPriceCurrency,
    setEditPriceCurrency,
    editGroupDiscount,
    setEditGroupDiscount,
    editMaxGuests,
    setEditMaxGuests,
    editOrganizer,
    setEditOrganizer,
    editTags,
    setEditTags,
    editTagInput,
    setEditTagInput,
    editBannerImage,
    setEditBannerImage,
    editBannerImagePreview,
    setEditBannerImagePreview,
    editBannerImageFile,
    setEditBannerImageFile,
    createTitle,
    setCreateTitle,
    createDescription,
    setCreateDescription,
    createEventType,
    setCreateEventType,
    createCategory,
    setCreateCategory,
    createStatus,
    setCreateStatus,
    statusFieldHovered,
    setStatusFieldHovered,
    createDate,
    setCreateDate,
    createTime,
    setCreateTime,
    createEndTime,
    setCreateEndTime,
    createDuration,
    setCreateDuration,
    createVenueName,
    setCreateVenueName,
    createAddress,
    setCreateAddress,
    createCity,
    setCreateCity,
    createCountry,
    setCreateCountry,
    createAttendance,
    setCreateAttendance,
    createShowMore,
    setCreateShowMore,
    createShowErrors,
    setCreateShowErrors,
    createPrice,
    setCreatePrice,
    geoCreate,
    geoEdit,
    currencyChoices,
    editRulesLoaded,
    setEditRulesLoaded,
    createPriceCurrency,
    setCreatePriceCurrency,
    createGroupDiscount,
    setCreateGroupDiscount,
    createMaxGuests,
    setCreateMaxGuests,
    createOrganizer,
    setCreateOrganizer,
    createTags,
    setCreateTags,
    createTagInput,
    setCreateTagInput,
    createBannerImage,
    setCreateBannerImage,
    createBannerImagePreview,
    setCreateBannerImagePreview,
    createBannerImageFile,
    setCreateBannerImageFile,
    createPhotographerId,
    setCreatePhotographerId,
    createEventVisibility,
    setCreateEventVisibility,
    createWishInvites,
    setCreateWishInvites,
    createWishInvitesErr,
    setCreateWishInvitesErr,
    editWishInvites,
    setEditWishInvites,
    createPackageId,
    setCreatePackageId,
    photographerPackages,
    setPhotographerPackages,
    packagesLoading,
    setPackagesLoading,
    packagesError,
    setPackagesError,
    createEscrowPercentage,
    setCreateEscrowPercentage,
    completionModalEvent,
    setCompletionModalEvent,
    completionFeedbackStatus,
    setCompletionFeedbackStatus,
    completionComment,
    setCompletionComment,
    completionSubmitting,
    setCompletionSubmitting,
    createCurrencyOpen,
    setCreateCurrencyOpen,
    editCurrencyOpen,
    setEditCurrencyOpen,
    createCurrencyRef,
    editCurrencyRef,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
    dateError,
    setDateError,
    timeError,
    setTimeError,
    isRestoringDraft,
    setIsRestoringDraft,
    showDraftRestoredNotice,
    setShowDraftRestoredNotice,
    autoSaveTimeoutRef,
    currencyOptions,
    saveFormDraft,
    clearFormDraft,
    eventCategories,
    setEventCategories,
    events,
    setEvents,
    isLoadingEvents,
    setIsLoadingEvents,
    router,
    getStarted,
    eventsError,
    setEventsError,
    publishingEventId,
    setPublishingEventId,
    unpublishingEventId,
    setUnpublishingEventId,
    qrEvent,
    setQrEvent,
    publishConfirmEvent,
    setPublishConfirmEvent,
    unpublishConfirmEvent,
    setUnpublishConfirmEvent,
    ongoingUnpublishBlock,
    setOngoingUnpublishBlock,
    noPhotographerEvent,
    setNoPhotographerEvent,
    pendingBookingEvent,
    setPendingBookingEvent,
    rebookEvent,
    setRebookEvent,
    noPhotoEvent,
    setNoPhotoEvent,
    fetchMyEvents,
    handlePublishEvent,
    handleUnpublishEvent,
    handleDeleteEvent,
    isEventDeletable,
    isEventPausable,
    isEventResumable,
    isEventEditable,
    handlePauseEvent,
    handleResumeEvent,
    openEditModal,
    handleEditEvent,
    resetCreateForm,
    handleAddTag,
    addTagFromInput,
    handleRemoveTag,
    handleBannerImageChange,
    handleEditAddTag,
    addEditTagFromInput,
    handleEditRemoveTag,
    handleEditBannerImageChange,
    createRules,
    createShown,
    createBlocked,
    eventLabelStyle,
    eventInputStyle,
    handleCreateEvent,
    handleCopyLink,
    formatDate,
    getStatusBadgeStyle,
    filteredEvents,
    upcomingCount,
    publishedCount,
    completedCount,
    pastCount,
  };
}

export type CoordinatorEventsController = ReturnType<typeof useCoordinatorEvents>;
