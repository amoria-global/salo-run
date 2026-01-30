"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import localforage from 'localforage';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';

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
  createBannerImagePreview: string | null;
  savedAt: number;
}

// Currency options for Live Stream Access Fee
const currencyOptions = [
  { value: 'RWF', label: 'RWF' },
  { value: 'USD', label: 'USD' },
  { value: 'KES', label: 'KES' },
  { value: 'UGX', label: 'UGX' },
  { value: 'TZS', label: 'TZS' }
];

// Format number with commas for thousands
const formatNumberWithCommas = (value: string): string => {
  // Remove all non-digit characters
  const numericValue = value.replace(/[^\d]/g, '');
  // Add commas for thousands
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse formatted number back to raw value
const parseFormattedNumber = (value: string): string => {
  return value.replace(/,/g, '');
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
type EventCategory =
  | 'Sports'
  | 'Wedding'
  | 'Academic'
  | 'Gathering'
  | 'Concert'
  | 'Fashion'
  | 'Religious'
  | 'Cultural'
  | 'Corporate'
  | 'Conference'
  | 'Entertainment'
  | 'Birthday'
  | 'Baby Shower'
  | 'Graduation';

type EventStatus = 'UPCOMING' | 'LIVE' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

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
  guestCount: number;
  maxGuests: number;
  status: EventStatus;
  organizer: string;
  tags: string[];
  hasPhotographer: boolean;
  photographerName?: string;
  photographerImage?: string;
  shareLink: string;
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
const pastPhotographers = [
  {
    id: 'p1',
    name: 'John Studio',
    image: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg',
    speciality: 'Weddings',
    rating: 4.9,
    eventsWorked: 3
  },
  {
    id: 'p2',
    name: 'Mary Shots',
    image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    speciality: 'Birthdays & Events',
    rating: 4.8,
    eventsWorked: 2
  },
  {
    id: 'p3',
    name: 'David Captures',
    image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    speciality: 'Corporate & Baby Showers',
    rating: 4.7,
    eventsWorked: 1
  },
  {
    id: 'p4',
    name: 'Elite Photography',
    image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    speciality: 'Graduations & Events',
    rating: 4.9,
    eventsWorked: 1
  }
];

const MyEventsPage = () => {
  const { colors, actualTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<Event | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

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

  // Create form state
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createEventType, setCreateEventType] = useState('');
  const [createCategory, setCreateCategory] = useState<EventCategory | ''>('');
  const [createStatus, setCreateStatus] = useState<'UPCOMING' | 'LIVE'>('UPCOMING');
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
  const [createPhotographerId, setCreatePhotographerId] = useState<string>('');
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
      createPriceCurrency,
      createMaxGuests,
      createOrganizer,
      createTags,
      createPhotographerId,
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
    createOrganizer, createTags, createPhotographerId, createBannerImagePreview
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

  // Clear saved draft from IndexedDB
  const clearFormDraft = useCallback(async () => {
    try {
      await eventFormStorage.removeItem(CREATE_EVENT_FORM_KEY);
    } catch (error) {
      console.error('Failed to clear form draft:', error);
    }
  }, []);

  // Event categories from prompt
  const eventCategories: EventCategory[] = [
    'Sports', 'Wedding', 'Academic', 'Gathering', 'Concert', 'Fashion',
    'Religious', 'Cultural', 'Corporate', 'Conference', 'Entertainment',
    'Birthday', 'Baby Shower', 'Graduation'
  ];


  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Sarah & James Wedding',
      description: 'A beautiful garden wedding ceremony and reception at Kigali Convention Center. Join us to celebrate the union of Sarah and James.',
      eventType: 'Wedding',
      category: 'Wedding',
      date: '2025-08-15',
      time: '14:00',
      endTime: '22:00',
      duration: '6 hours',
      location: { address: 'Kigali Convention Center', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
      price: '50,000 RWF',
      guestCount: 156,
      maxGuests: 200,
      status: 'UPCOMING',
      organizer: 'Sarah & James',
      tags: ['Wedding', 'Reception', 'Garden'],
      hasPhotographer: true,
      photographerName: 'John Studio',
      photographerImage: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg',
      shareLink: 'https://connekt.app/event/evt_7x9K2mNpQrS4',
      createdAt: '2025-06-01'
    },
    {
      id: '2',
      title: 'My 30th Birthday Bash',
      description: 'Celebrating three decades of life! Join us for an evening of fun, music, and memories.',
      eventType: 'Birthday',
      category: 'Birthday',
      date: '2025-07-25',
      time: '18:00',
      endTime: '23:00',
      duration: '4 hours',
      location: { address: 'Lake Kivu Resort', city: 'Gisenyi', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200',
      price: 'Free',
      guestCount: 45,
      maxGuests: 80,
      status: 'UPCOMING',
      organizer: 'Diane Marry',
      tags: ['Birthday', 'Party', 'Celebration'],
      hasPhotographer: true,
      photographerName: 'Mary Shots',
      photographerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
      shareLink: 'https://connekt.app/event/evt_3pL8wYzTuV5H',
      createdAt: '2025-06-15'
    },
    {
      id: '3',
      title: 'Company Team Building 2025',
      description: 'Annual team building event for our amazing team. Activities, workshops, and team bonding.',
      eventType: 'Corporate',
      category: 'Corporate',
      date: '2025-09-10',
      time: '09:00',
      endTime: '17:00',
      duration: '8 hours',
      location: { address: 'Serena Hotel', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      price: '25,000 RWF',
      guestCount: 75,
      maxGuests: 100,
      status: 'UPCOMING',
      organizer: 'Tech Solutions Ltd',
      tags: ['Corporate', 'Team Building', 'Workshop'],
      hasPhotographer: false,
      shareLink: 'https://connekt.app/event/evt_9dF4kBnCxM1J',
      createdAt: '2025-07-01'
    },
    {
      id: '4',
      title: 'Baby Shower - Emma',
      description: 'Welcoming baby Emma! A lovely afternoon celebrating the upcoming arrival.',
      eventType: 'Baby Shower',
      category: 'Baby Shower',
      date: '2025-05-20',
      time: '14:00',
      endTime: '17:00',
      duration: '3 hours',
      location: { address: 'Radisson Blu', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
      price: 'Free',
      guestCount: 35,
      maxGuests: 50,
      status: 'completed',
      organizer: 'Jane & Mark',
      tags: ['Baby Shower', 'Celebration', 'Family'],
      hasPhotographer: true,
      photographerName: 'David Captures',
      photographerImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
      shareLink: 'https://connekt.app/event/evt_5hR2vJmLnP8W',
      createdAt: '2025-04-01'
    },
    {
      id: '5',
      title: 'Graduation Party 2024',
      description: 'Celebrating academic achievements! A memorable evening with family and friends.',
      eventType: 'Graduation',
      category: 'Academic',
      date: '2024-12-15',
      time: '17:00',
      endTime: '22:00',
      duration: '5 hours',
      location: { address: 'Marriott Hotel', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      bannerImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
      price: '15,000 RWF',
      guestCount: 120,
      maxGuests: 150,
      status: 'completed',
      organizer: 'University Alumni',
      tags: ['Graduation', 'Academic', 'Achievement'],
      hasPhotographer: true,
      photographerName: 'Elite Photography',
      photographerImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
      shareLink: 'https://connekt.app/event/evt_1qA6tXsGdK4Y',
      createdAt: '2024-11-01'
    }
  ]);

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Baby Shower', 'Graduation', 'Anniversary', 'Engagement', 'Other'];

  const handleDeleteEvent = () => {
    if (deleteEvent) {
      setEvents(prev => prev.filter(e => e.id !== deleteEvent.id));
      setDeleteEvent(null);
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (event: Event) => {
    setEditEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description);
    setEditEventType(event.eventType);
    setEditCategory((event.category as EventCategory) || '');
    setEditStatus(event.status.toLowerCase() === 'live' ? 'LIVE' : 'UPCOMING');
    setEditDate(event.date);
    setEditTime(event.time);
    setEditEndTime(event.endTime || '');
    setEditDuration(event.duration);
    // Parse venue name and address from location.address if it contains ' - '
    const addressParts = event.location.address.split(' - ');
    if (addressParts.length > 1) {
      setEditVenueName(addressParts[0]);
      setEditAddress(addressParts.slice(1).join(' - '));
    } else {
      setEditVenueName(event.location.address);
      setEditAddress('');
    }
    setEditCity(event.location.city);
    setEditCountry(event.location.country);
    setEditPrice(event.price || '');
    setEditMaxGuests(event.maxGuests.toString());
    setEditOrganizer(event.organizer || '');
    setEditTags(event.tags || []);
    setEditTagInput('');
    setEditBannerImage(event.bannerImage || null);
    setEditBannerImagePreview(event.bannerImage || null);
    setShowEditModal(true);
  };

  const handleEditEvent = () => {
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
          status: editStatus,
          date: editDate,
          time: timeDisplay,
          endTime: editEndTime,
          duration: calculatedDuration,
          location: {
            address: editVenueName ? `${editVenueName}${editAddress ? ' - ' + editAddress : ''}` : editAddress,
            city: editCity,
            country: editCountry
          },
          coverImage: editBannerImage || event.coverImage,
          bannerImage: editBannerImage || event.bannerImage,
          price: editPrice || 'Free',
          maxGuests: parseInt(editMaxGuests) || event.maxGuests,
          organizer: editOrganizer,
          tags: editTags
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
    setCreatePhotographerId('');
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBannerImage(reader.result as string);
        setEditBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle create event
  const handleCreateEvent = () => {
    if (!createTitle || !createCategory || !createDate || !createTime) return;

    const selectedPhotographer = pastPhotographers.find(p => p.id === createPhotographerId);

    // Calculate duration from start and end time
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

    // Format time display
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
      id: `evt_${Date.now()}`,
      title: createTitle,
      description: createDescription,
      eventType: createCategory,
      category: createCategory as EventCategory,
      date: createDate,
      time: timeDisplay,
      endTime: createEndTime,
      duration: calculatedDuration,
      location: {
        address: createVenueName ? `${createVenueName}${createAddress ? ' - ' + createAddress : ''}` : createAddress,
        city: createCity,
        country: createCountry
      },
      coverImage: createBannerImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      bannerImage: createBannerImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
      price: createPrice || 'Free',
      guestCount: 0,
      maxGuests: parseInt(createMaxGuests) || 100,
      status: createStatus,
      organizer: createOrganizer || 'Organizer',
      tags: createTags.length > 0 ? createTags : [createCategory],
      hasPhotographer: !!selectedPhotographer,
      photographerName: selectedPhotographer?.name,
      photographerImage: selectedPhotographer?.image,
      shareLink: `https://connekt.app/event/evt_${Math.random().toString(36).substr(2, 12)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setEvents(prev => [newEvent, ...prev]);
    resetCreateForm();
    setShowCreateModal(false);
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
    switch (status) {
      case 'upcoming':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
      case 'ongoing':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'completed':
        return { backgroundColor: colors.bgTertiary, color: colors.textSecondary };
      case 'cancelled':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
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
      return matchesSearch && (statusLower === 'upcoming' || statusLower === 'ongoing' || statusLower === 'live');
    } else if (activeTab === 'past') {
      return matchesSearch && (statusLower === 'completed' || statusLower === 'cancelled');
    }
    return matchesSearch;
  });

  const upcomingCount = events.filter(e => {
    const s = e.status.toLowerCase();
    return s === 'upcoming' || s === 'ongoing' || s === 'live';
  }).length;
  const pastCount = events.filter(e => {
    const s = e.status.toLowerCase();
    return s === 'completed' || s === 'cancelled';
  }).length;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
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
            border-radius: 0.75rem !important;
          }
          .mobile-event-image {
            height: 140px !important;
          }
          .mobile-event-content {
            padding: 1rem !important;
          }
          .mobile-event-title {
            font-size: 1rem !important;
          }
          .mobile-event-actions {
            flex-direction: row !important;
            gap: 0.5rem !important;
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
            padding: 0.875rem !important;
          }
          .mobile-event-title {
            font-size: 0.95rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="event-coordinator" liveStreamFeeAmount={3250.00} />
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
              { key: 'upcoming' as const, label: 'Upcoming', count: upcomingCount },
              { key: 'past' as const, label: 'Past', count: pastCount },
              { key: 'all' as const, label: 'All Events', count: events.length }
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
          {filteredEvents.length === 0 ? (
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
                <div
                  key={event.id}
                  className="mobile-event-card"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${colors.borderPrimary}`
                  }}
                >
                  {/* Cover Image */}
                  <div className="mobile-event-image" style={{ position: 'relative', height: '160px' }}>
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      ...getStatusBadgeStyle(event.status),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {event.status}
                    </div>
                    {/* Event Type */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {event.eventType}
                    </div>
                    {/* Photographer Badge */}
                    {event.hasPhotographer && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        <CameraIcon />
                        {event.photographerName}
                        <Link
                          href="/user/event-coordinator/photographers"
                          style={{
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#083A85',
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textDecoration: 'none',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#062a63'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#083A85'}
                        >
                          View
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="mobile-event-content" style={{ padding: '1rem' }}>
                    <h3 className="mobile-event-title" style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
                      {event.title}
                    </h3>

                    {/* Date & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: colors.textSecondary }}>
                        <CalendarIcon />
                        <span style={{ fontSize: '0.85rem' }}>{formatDate(event.date)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: colors.textSecondary }}>
                        <ClockIcon />
                        <span style={{ fontSize: '0.85rem' }}>{event.time}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', color: colors.textSecondary }}>
                      <LocationIcon />
                      <span style={{ fontSize: '0.85rem' }}>{event.location.city}, {event.location.country}</span>
                    </div>

                    {/* Guest Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', color: colors.textSecondary }}>
                      <UsersIcon />
                      <span style={{ fontSize: '0.85rem' }}>{event.guestCount} / {event.maxGuests} guests</span>
                    </div>

                    {/* Actions */}
                    <div className="mobile-event-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                        <button
                          onClick={() => setShowEventDetails(event)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            backgroundColor: colors.bgTertiary,
                            color: colors.textPrimary,
                            border: `2px solid ${colors.borderPrimary}`,
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => { setShareEvent(event); setShowShareModal(true); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.bgTertiary,
                            color: colors.textPrimary,
                            border: `2px solid ${colors.borderPrimary}`,
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                          title="Share Event Stream"
                        >
                          <ShareIcon />
                        </button>
                      </div>
                      {(event.status.toLowerCase() === 'upcoming' || event.status.toLowerCase() === 'live') && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(event)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.bgTertiary,
                              color: colors.textPrimary,
                              border: `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                            title="Edit Event"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => { setDeleteEvent(event); setShowDeleteModal(true); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '2px solid #FECACA',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                            title="Delete Event"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                {createBannerImagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image src={createBannerImagePreview} alt="Banner" fill style={{ objectFit: 'cover' }} />
                    <button onClick={() => { setCreateBannerImage(null); setCreateBannerImagePreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>×</button>
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
                  {eventCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Status *</label>
                <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value as 'UPCOMING' | 'LIVE')} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: colors.bgCard, color: colors.textPrimary, cursor: 'pointer' }}>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="LIVE">LIVE</option>
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
                <input type="text" value={createVenueName} onChange={(e) => setCreateVenueName(e.target.value)} placeholder="e.g., BK Arena" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Location Address *</label>
                <input type="text" value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} placeholder="e.g., KN 4 Ave, Kigali" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Live Stream Access Fee *</label>
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
                    required
                  />
                  <select
                    value={createPriceCurrency}
                    onChange={(e) => setCreatePriceCurrency(e.target.value)}
                    style={{
                      padding: '0.625rem 0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0 0.5rem 0.5rem 0',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: colors.textPrimary,
                      backgroundColor: colors.bgTertiary,
                      cursor: 'pointer',
                      minWidth: '70px'
                    }}
                  >
                    {currencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Expected Attendees *</label>
                <input type="number" value={createMaxGuests} onChange={(e) => setCreateMaxGuests(e.target.value)} placeholder="e.g., 500" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
              </div>
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
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Assign Photographer</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>Select a photographer you&apos;ve worked with before or find a new one</p>
            <div style={{ border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', cursor: 'pointer', borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: createPhotographerId === '' ? (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF') : colors.bgCard }}>
                <input type="radio" name="photographer" value="" checked={createPhotographerId === ''} onChange={() => setCreatePhotographerId('')} style={{ width: '16px', height: '16px', accentColor: '#083A85' }} />
                <div><div style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>No photographer assigned</div><div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>You can assign one later</div></div>
              </label>
              {pastPhotographers.map((photographer) => (
                <label key={photographer.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', cursor: 'pointer', borderBottom: `1px solid ${colors.borderPrimary}`, backgroundColor: createPhotographerId === photographer.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF') : colors.bgCard }}>
                  <input type="radio" name="photographer" value={photographer.id} checked={createPhotographerId === photographer.id} onChange={() => setCreatePhotographerId(photographer.id)} style={{ width: '16px', height: '16px', accentColor: '#083A85' }} />
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}><Image src={photographer.image} alt={photographer.name} fill style={{ objectFit: 'cover' }} /></div>
                  <div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{photographer.name}</span><span style={{ fontSize: '0.85rem', color: '#F59E0B' }}>★ {photographer.rating}</span></div><div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{photographer.speciality}</div></div>
                </label>
              ))}
            </div>
            <button onClick={() => window.open('https://amoria-connekt.vercel.app/user/photographers?category=event', '_blank')} style={{ width: '100%', padding: '0.625rem', border: `2px dashed ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`, borderRadius: '0.5rem', backgroundColor: 'transparent', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><PlusIcon />Connect with a new Photographer</button>

            {/* Invite a New Photographer */}
            <button
              onClick={() => setShowInviteSection(!showInviteSection)}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: `2px dashed ${actualTheme === 'dark' ? '#F472B6' : '#DB2777'}`,
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: actualTheme === 'dark' ? '#F472B6' : '#DB2777',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              <LinkIcon />
              Invite a New Photographer
            </button>

            {/* Invite Link Section */}
            {showInviteSection && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                backgroundColor: actualTheme === 'dark' ? '#1E293B' : '#FDF2F8',
                borderRadius: '0.5rem',
                border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#FBCFE8'}`
              }}>
                <p style={{
                  fontSize: '0.85rem',
                  color: colors.textSecondary,
                  marginBottom: '0.75rem'
                }}>
                  Share this link with photographers who haven&apos;t registered yet to invite them to join the platform:
                </p>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'stretch'
                }}>
                  <input
                    type="text"
                    readOnly
                    value="https://connekt.rw/register/photographer?ref=invite"
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.75rem',
                      border: `1px solid ${colors.borderPrimary}`,
                      borderRadius: '0.375rem',
                      backgroundColor: colors.bgCard,
                      color: colors.textPrimary,
                      fontSize: '0.9rem',
                      minWidth: 0
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://connekt.rw/register/photographer?ref=invite');
                      setInviteLinkCopied(true);
                      setTimeout(() => setInviteLinkCopied(false), 2000);
                    }}
                    style={{
                      padding: '0.625rem 1rem',
                      backgroundColor: inviteLinkCopied ? '#10B981' : (actualTheme === 'dark' ? '#DB2777' : '#DB2777'),
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <CopyIcon />
                    {inviteLinkCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: `1px solid ${colors.borderPrimary}`, marginBottom: '4rem' }}>
            <button onClick={() => { resetCreateForm(); setShowCreateModal(false); }} style={{ padding: '0.75rem 1.25rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateEvent} disabled={!createTitle || !createCategory || !createDate || !createTime || !createPrice} style={{ padding: '0.75rem 1.25rem', border: '2px solid #062a63', borderRadius: '0.5rem', background: (!createTitle || !createCategory || !createDate || !createTime || !createPrice) ? '#9CA3AF' : '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: (!createTitle || !createCategory || !createDate || !createTime || !createPrice) ? 'not-allowed' : 'pointer', opacity: (!createTitle || !createCategory || !createDate || !createTime || !createPrice) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Create Event ✓</button>
          </div>
        </div>
      </Modal>

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
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
              <div style={{
                width: '100%',
                height: '160px',
                backgroundImage: `url(${showEventDetails.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(13, 27, 42, 0.3)'
                }} />
              </div>
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
            {showEventDetails.hasPhotographer && (
              <div style={{ backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#93C5FD' : '#0369A1', marginBottom: '0.5rem', fontWeight: '600' }}>Booked Photographer</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <Image
                        src={showEventDetails.photographerImage || ''}
                        alt={showEventDetails.photographerName || ''}
                        width={40}
                        height={40}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
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
            )}

            {!showEventDetails.hasPhotographer && showEventDetails.status === 'upcoming' && (
              <div style={{ backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#FCD34D' : '#92400E', marginBottom: '0.5rem', fontWeight: '600' }}>
                  No Photographer Booked
                </div>
                <p style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#FCD34D' : '#92400E', marginBottom: '0.75rem' }}>
                  Don&apos;t miss capturing your special moments!
                </p>
                <button
                  style={{
                    backgroundColor: '#083A85',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Find a Photographer
                </button>
              </div>
            )}

            {/* Share Link */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>Join Event Stream Link</div>
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
                </>
              )}
              {showEventDetails.status === 'completed' && (
                <button
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
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <Image src={shareEvent.coverImage} alt={shareEvent.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '0.9rem' }}>{shareEvent.title}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{formatDate(shareEvent.date)}</div>
              </div>
            </div>
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
                    border: option.name === 'Copy Link' && copiedLink ? '1px solid #10B981' : `1px solid ${colors.borderPrimary}`,
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
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Join Event Stream Link
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
                    {eventCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Status *</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'UPCOMING' | 'LIVE')} style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: colors.bgCard, color: colors.textPrimary, cursor: 'pointer' }}>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="LIVE">LIVE</option>
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
                  <input type="text" value={editVenueName} onChange={(e) => setEditVenueName(e.target.value)} placeholder="e.g., BK Arena" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Location Address *</label>
                  <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="e.g., KN 4 Ave, Kigali" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Live Stream Access Fee *</label>
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
                      required
                    />
                    <select
                      value={editPriceCurrency}
                      onChange={(e) => setEditPriceCurrency(e.target.value)}
                      style={{
                        padding: '0.625rem 0.5rem',
                        border: `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0 0.5rem 0.5rem 0',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: colors.textPrimary,
                        backgroundColor: colors.bgTertiary,
                        cursor: 'pointer',
                        minWidth: '70px'
                      }}
                    >
                      {currencyOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>Expected Attendees *</label>
                  <input type="number" value={editMaxGuests} onChange={(e) => setEditMaxGuests(e.target.value)} placeholder="e.g., 500" style={{ width: '100%', padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary }} />
                </div>
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: `1px solid ${colors.borderPrimary}`, marginBottom: '4rem' }}>
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

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default MyEventsPage;
