"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FBBF24' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#F20C8F' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.09924 19.7228 3.6929 19.0554 3.41524C18.3879 3.13757 17.6725 2.99414 16.95 2.99414C16.2275 2.99414 15.5121 3.13757 14.8446 3.41524C14.1772 3.6929 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99479 7.05 2.99479C5.59096 2.99479 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54478 7.04097 1.54478 8.5C1.54478 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.7571 11.2728 22.0348 10.6054C22.3124 9.93789 22.4559 9.22249 22.4559 8.5C22.4559 7.77751 22.3124 7.06211 22.0348 6.39464C21.7571 5.72718 21.3508 5.12075 20.84 4.61Z" stroke={filled ? '#F20C8F' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="#6B7280" strokeWidth="2"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
  </svg>
);

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'partially_paid';

interface Booking {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  duration: string;
  location: string;
  packageName: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface BookedPhotographer {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  coverImage: string;
  portfolioImages: string[];
  bio: string;
  specializations: string[];
  experience: number;
  location: {
    city: string;
    country: string;
  };
  rating: number;
  reviewCount: number;
  completedBookings: number;
  verified: boolean;
  startingPrice: number;
  responseTime: string;
  isFavorite: boolean;
  isAvailable: boolean;
  languages: string[];
  equipment: string[];
  // Booking history
  lastBookingDate: string;
  lastEventType: string;
  lastEventName: string;
  totalBookingsWithClient: number;
  totalSpent: number;
  myRating?: number;
  myReview?: string;
  // Bookings with payment info
  bookings: Booking[];
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
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
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
              <CloseIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const BookedPhotographersPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPhotographer, setSelectedPhotographer] = useState<BookedPhotographer | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePhotographer, setSharePhotographer] = useState<BookedPhotographer | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPhotographer, setReportPhotographer] = useState<BookedPhotographer | null>(null);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [rebookPhotographer, setRebookPhotographer] = useState<BookedPhotographer | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewPhotographer, setReviewPhotographer] = useState<BookedPhotographer | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; photographer: BookedPhotographer } | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'bookings' | 'spent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'pending_payments'>('all');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<{ photographer: BookedPhotographer; booking: Booking } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');

  const [photographers, setPhotographers] = useState<BookedPhotographer[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Studio',
      profileImage: 'https://randomuser.me/api/portraits/men/75.jpg',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      portfolioImages: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400'
      ],
      bio: 'Professional wedding and event photographer with over 10 years of experience capturing lifes most precious moments. Specialized in candid shots and emotional storytelling.',
      specializations: ['Weddings', 'Events', 'Portraits'],
      experience: 10,
      location: { city: 'Kigali', country: 'Rwanda' },
      rating: 4.9,
      reviewCount: 156,
      completedBookings: 234,
      verified: true,
      startingPrice: 450,
      responseTime: '1 hour',
      isFavorite: true,
      isAvailable: true,
      languages: ['English', 'Kinyarwanda', 'French'],
      equipment: ['Canon EOS R5', 'Sony A7III', 'DJI Mavic Pro'],
      lastBookingDate: '2024-11-15',
      lastEventType: 'Wedding',
      lastEventName: 'Sarah & James Wedding',
      totalBookingsWithClient: 3,
      totalSpent: 1350,
      myRating: 5,
      myReview: 'Absolutely amazing work! John captured every moment perfectly.',
      bookings: [
        {
          id: 'BK-001',
          eventName: 'Sarah & James Wedding',
          eventType: 'Wedding',
          eventDate: '2024-11-15',
          eventTime: '14:00',
          duration: '8 hours',
          location: 'Kigali Convention Center',
          packageName: 'Premium Wedding',
          totalAmount: 1500,
          paidAmount: 1500,
          paymentStatus: 'paid',
          status: 'completed'
        },
        {
          id: 'BK-008',
          eventName: 'Anniversary Celebration',
          eventType: 'Event',
          eventDate: '2025-01-20',
          eventTime: '16:00',
          duration: '4 hours',
          location: 'Marriott Hotel Kigali',
          packageName: 'Event Coverage',
          totalAmount: 600,
          paidAmount: 300,
          paymentStatus: 'partially_paid',
          status: 'upcoming'
        }
      ]
    },
    {
      id: '2',
      firstName: 'Mary',
      lastName: 'Shots',
      profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
      coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      portfolioImages: [
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
        'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400',
        'https://images.unsplash.com/photo-1496843916299-590492c751f4?w=400'
      ],
      bio: 'Specializing in birthday parties and family celebrations. I believe every moment deserves to be captured beautifully. Natural light specialist.',
      specializations: ['Birthdays', 'Family', 'Kids'],
      experience: 6,
      location: { city: 'Nairobi', country: 'Kenya' },
      rating: 4.7,
      reviewCount: 89,
      completedBookings: 142,
      verified: true,
      startingPrice: 300,
      responseTime: '2 hours',
      isFavorite: false,
      isAvailable: true,
      languages: ['English', 'Swahili'],
      equipment: ['Nikon D850', 'Canon 5D Mark IV'],
      lastBookingDate: '2024-10-28',
      lastEventType: 'Birthday',
      lastEventName: 'Emily\'s 5th Birthday',
      totalBookingsWithClient: 2,
      totalSpent: 600,
      bookings: [
        {
          id: 'BK-002',
          eventName: 'Emily\'s 5th Birthday',
          eventType: 'Birthday',
          eventDate: '2024-10-28',
          eventTime: '15:00',
          duration: '4 hours',
          location: 'Lake Kivu Resort, Gisenyi',
          packageName: 'Birthday Special',
          totalAmount: 300,
          paidAmount: 300,
          paymentStatus: 'paid',
          status: 'completed'
        },
        {
          id: 'BK-009',
          eventName: 'Baby Shower',
          eventType: 'Family',
          eventDate: '2025-02-14',
          eventTime: '11:00',
          duration: '3 hours',
          location: 'Home Studio',
          packageName: 'Family Package',
          totalAmount: 350,
          paidAmount: 0,
          paymentStatus: 'pending',
          status: 'upcoming'
        }
      ]
    },
    {
      id: '3',
      firstName: 'Alex',
      lastName: 'Frames',
      profileImage: 'https://randomuser.me/api/portraits/men/44.jpg',
      coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      portfolioImages: [
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'
      ],
      bio: 'Festival and concert photographer bringing energy and life to every shot. Experienced in low-light and fast-paced environments. Published in Rolling Stone Africa.',
      specializations: ['Festivals', 'Concerts', 'Nightlife'],
      experience: 8,
      location: { city: 'Kampala', country: 'Uganda' },
      rating: 4.8,
      reviewCount: 67,
      completedBookings: 98,
      verified: true,
      startingPrice: 350,
      responseTime: '3 hours',
      isFavorite: true,
      isAvailable: false,
      languages: ['English', 'Luganda'],
      equipment: ['Sony A7S III', 'Canon EOS R6'],
      lastBookingDate: '2024-09-20',
      lastEventType: 'Concert',
      lastEventName: 'Nyege Nyege Festival 2024',
      totalBookingsWithClient: 1,
      totalSpent: 350,
      myRating: 5,
      myReview: 'Alex is incredible at capturing the energy of live events!',
      bookings: [
        {
          id: 'BK-003',
          eventName: 'Nyege Nyege Festival 2024',
          eventType: 'Concert',
          eventDate: '2024-09-20',
          eventTime: '16:00',
          duration: '6 hours',
          location: 'Amahoro Stadium, Kigali',
          packageName: 'Festival Coverage',
          totalAmount: 350,
          paidAmount: 350,
          paymentStatus: 'paid',
          status: 'completed'
        }
      ]
    },
    {
      id: '4',
      firstName: 'Elite',
      lastName: 'Photography',
      profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
      coverImage: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800',
      portfolioImages: [
        'https://images.unsplash.com/photo-1560439514-4e9645039924?w=400',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400'
      ],
      bio: 'Corporate photography specialist. Headshots, team photos, and company events with a professional touch. Trusted by Fortune 500 companies.',
      specializations: ['Corporate', 'Headshots', 'Commercial'],
      experience: 12,
      location: { city: 'Dar es Salaam', country: 'Tanzania' },
      rating: 4.6,
      reviewCount: 112,
      completedBookings: 187,
      verified: true,
      startingPrice: 500,
      responseTime: '30 mins',
      isFavorite: false,
      isAvailable: true,
      languages: ['English', 'Swahili', 'Arabic'],
      equipment: ['Canon EOS R5', 'Profoto B10', 'Phase One'],
      lastBookingDate: '2024-11-01',
      lastEventType: 'Corporate',
      lastEventName: 'MTN Annual Conference',
      totalBookingsWithClient: 4,
      totalSpent: 2000,
      myRating: 4,
      myReview: 'Very professional. Great corporate shots.',
      bookings: [
        {
          id: 'BK-004',
          eventName: 'MTN Annual Conference',
          eventType: 'Corporate',
          eventDate: '2024-11-01',
          eventTime: '09:00',
          duration: '6 hours',
          location: 'Tech Hub Office, Kigali',
          packageName: 'Corporate Full Day',
          totalAmount: 800,
          paidAmount: 800,
          paymentStatus: 'paid',
          status: 'completed'
        },
        {
          id: 'BK-010',
          eventName: 'Team Headshots',
          eventType: 'Corporate',
          eventDate: '2025-01-15',
          eventTime: '10:00',
          duration: '3 hours',
          location: 'Company HQ',
          packageName: 'Corporate Headshots',
          totalAmount: 500,
          paidAmount: 0,
          paymentStatus: 'failed',
          status: 'upcoming'
        }
      ]
    },
    {
      id: '5',
      firstName: 'Sarah',
      lastName: 'Lens',
      profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
      coverImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
      portfolioImages: [
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'
      ],
      bio: 'Fashion and portrait photographer with an eye for detail and beauty. Published in multiple magazines including Vogue Africa and Elle.',
      specializations: ['Fashion', 'Portraits', 'Editorial'],
      experience: 7,
      location: { city: 'Bujumbura', country: 'Burundi' },
      rating: 4.9,
      reviewCount: 78,
      completedBookings: 124,
      verified: false,
      startingPrice: 400,
      responseTime: '2 hours',
      isFavorite: false,
      isAvailable: true,
      languages: ['English', 'French', 'Kirundi'],
      equipment: ['Hasselblad X2D', 'Sony A1'],
      lastBookingDate: '2024-08-15',
      lastEventType: 'Portraits',
      lastEventName: 'Personal Photoshoot',
      totalBookingsWithClient: 1,
      totalSpent: 400,
      bookings: [
        {
          id: 'BK-005',
          eventName: 'Personal Photoshoot',
          eventType: 'Portraits',
          eventDate: '2024-08-15',
          eventTime: '14:00',
          duration: '2 hours',
          location: 'Studio, Bujumbura',
          packageName: 'Portrait Session',
          totalAmount: 400,
          paidAmount: 400,
          paymentStatus: 'paid',
          status: 'completed'
        }
      ]
    }
  ]);

  const specializations = ['Weddings', 'Events', 'Portraits', 'Birthdays', 'Corporate', 'Fashion', 'Festivals', 'Concerts'];

  const toggleFavorite = (id: string) => {
    setPhotographers(prev => prev.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const handleContextMenu = (e: React.MouseEvent, photographer: BookedPhotographer) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, photographer });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return { bg: '#DCFCE7', text: '#15803D' };
      case 'pending': return { bg: '#FEF3C7', text: '#B45309' };
      case 'partially_paid': return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'failed': return { bg: '#FEE2E2', text: '#DC2626' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  // Get photographers with pending payments
  const photographersWithPendingPayments = photographers.filter(p =>
    p.bookings.some(b => b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid' || b.paymentStatus === 'failed')
  );

  // Calculate total pending amount
  const totalPendingAmount = photographers.reduce((sum, p) => {
    return sum + p.bookings.reduce((bookingSum, b) => {
      if (b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid' || b.paymentStatus === 'failed') {
        return bookingSum + (b.totalAmount - b.paidAmount);
      }
      return bookingSum;
    }, 0);
  }, 0);

  const filteredPhotographers = photographers.filter(photographer => {
    const matchesSearch = searchQuery === '' ||
      `${photographer.firstName} ${photographer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photographer.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpecialization = !selectedSpecialization ||
      photographer.specializations.includes(selectedSpecialization);
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'favorites' && photographer.isFavorite) ||
      (activeTab === 'pending_payments' && photographer.bookings.some(b =>
        b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid' || b.paymentStatus === 'failed'
      ));
    return matchesSearch && matchesSpecialization && matchesTab;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'recent':
        comparison = new Date(a.lastBookingDate).getTime() - new Date(b.lastBookingDate).getTime();
        break;
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'bookings':
        comparison = a.totalBookingsWithClient - b.totalBookingsWithClient;
        break;
      case 'spent':
        comparison = a.totalSpent - b.totalSpent;
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onSelect && onSelect(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              padding: '0.125rem'
            }}
            disabled={!interactive}
          >
            <StarIcon filled={star <= Math.floor(rating)} />
          </button>
        ))}
      </div>
    );
  };

  const submitReview = () => {
    if (reviewPhotographer) {
      setPhotographers(prev => prev.map(p =>
        p.id === reviewPhotographer.id
          ? { ...p, myRating: reviewRating, myReview: reviewText }
          : p
      ));
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText('');
    }
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600' }}>Booked Photographers</h1>
              <p style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Photographers you&apos;ve worked with - rebook your favorites
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Sort Dropdown */}
              <div style={{ position: 'relative' }}>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSort, newOrder] = e.target.value.split('-');
                    setSortBy(newSort as typeof sortBy);
                    setSortOrder(newOrder as typeof sortOrder);
                  }}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    fontSize: '0.9rem',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <option value="recent-desc">Most Recent</option>
                  <option value="recent-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="bookings-desc">Most Booked</option>
                  <option value="spent-desc">Most Spent</option>
                </select>
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <SortIcon />
                </div>
              </div>
              {/* View Mode Toggle */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', padding: '0.25rem' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                    boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={viewMode === 'grid'} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <ListIcon active={viewMode === 'list'} />
                </button>
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Photographers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{photographers.length}</div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Bookings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>
                {photographers.reduce((sum, p) => sum + p.totalBookingsWithClient, 0)}
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Spent</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>
                ${photographers.reduce((sum, p) => sum + p.totalSpent, 0).toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F20C8F' }}>
                {photographers.filter(p => p.isFavorite).length}
              </div>
            </div>
            <div style={{ backgroundColor: totalPendingAmount > 0 ? '#FEF2F2' : 'white', borderRadius: '0.75rem', padding: '1rem', border: totalPendingAmount > 0 ? '1px solid #FECACA' : '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: totalPendingAmount > 0 ? '#B91C1C' : '#6B7280', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {totalPendingAmount > 0 && <AlertCircleIcon />}
                Pending Payments
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalPendingAmount > 0 ? '#DC2626' : '#6B7280' }}>
                ${totalPendingAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'all', label: 'All Photographers', count: photographers.length },
              { key: 'favorites', label: 'Favorites', count: photographers.filter(p => p.isFavorite).length },
              { key: 'pending_payments', label: 'Pending Payments', count: photographersWithPendingPayments.length, alert: true }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key
                    ? ((tab as { alert?: boolean }).alert ? '#F20C8F' : '#083A85')
                    : 'white',
                  color: activeTab === tab.key ? 'white' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: activeTab === tab.key
                    ? 'rgba(255,255,255,0.2)'
                    : ((tab as { alert?: boolean }).alert && tab.count > 0 ? '#FEE2E2' : '#F3F4F6'),
                  color: (tab as { alert?: boolean }).alert && tab.count > 0 && activeTab !== tab.key ? '#DC2626' : undefined,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Search */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search your booked photographers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: showFilters ? '#083A85' : 'white',
                color: showFilters ? 'white' : '#6B7280',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <FilterIcon />
              Filters
            </button>
          </div>

          {/* Filter Tags */}
          {showFilters && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', display: 'block' }}>Event Type</span>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialization(selectedSpecialization === spec ? null : spec)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: selectedSpecialization === spec ? '1px solid #083A85' : '1px solid #E5E7EB',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: selectedSpecialization === spec ? '#083A85' : 'white',
                        color: selectedSpecialization === spec ? 'white' : '#6B7280',
                        transition: 'all 0.2s'
                      }}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
              {selectedSpecialization && (
                <button
                  onClick={() => setSelectedSpecialization(null)}
                  style={{
                    alignSelf: 'flex-end',
                    fontSize: '0.85rem',
                    color: '#DC2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* Results Count */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Showing {filteredPhotographers.length} photographer{filteredPhotographers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Photographers Grid/List */}
          {filteredPhotographers.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', border: '1px solid #E5E7EB' }}>
              <CameraIcon />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginTop: '1rem' }}>No photographers found</h3>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.5rem' }}>
                {activeTab === 'favorites' ? 'You haven\'t added any photographers to favorites yet.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredPhotographers.map((photographer) => (
                <div
                  key={photographer.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => setSelectedPhotographer(photographer)}
                  onContextMenu={(e) => handleContextMenu(e, photographer)}
                >
                  {/* Cover Image */}
                  <div style={{ position: 'relative', height: '140px' }}>
                    <Image
                      src={photographer.coverImage}
                      alt={`${photographer.firstName}'s work`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Bookings Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CalendarIcon /> {photographer.totalBookingsWithClient} booking{photographer.totalBookingsWithClient > 1 ? 's' : ''}
                    </div>
                    {/* Action Buttons */}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(photographer.id); }}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Add to favorites"
                      >
                        <HeartIcon filled={photographer.isFavorite} />
                      </button>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '-2.5rem' }}>
                      <Image
                        src={photographer.profileImage}
                        alt={photographer.firstName}
                        width={60}
                        height={60}
                        style={{ borderRadius: '50%', border: '3px solid white', objectFit: 'cover' }}
                      />
                      <div style={{ marginTop: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {photographer.firstName} {photographer.lastName}
                          </h3>
                          {photographer.verified && <VerifiedIcon />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <LocationIcon />
                          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                            {photographer.location.city}, {photographer.location.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Last Booking Info */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Last Booking</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111827' }}>{photographer.lastEventName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                        {photographer.lastEventType} • {formatDate(photographer.lastBookingDate)}
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {renderStars(photographer.rating)}
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{photographer.rating}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>({photographer.reviewCount} reviews)</span>
                    </div>

                    {/* Payment Status for Pending Bookings */}
                    {photographer.bookings.some(b => b.paymentStatus !== 'paid') && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#FEF3C7', borderRadius: '0.375rem' }}>
                        {photographer.bookings.filter(b => b.paymentStatus !== 'paid').slice(0, 1).map((booking) => {
                          const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                          const amountDue = booking.totalAmount - booking.paidAmount;
                          return (
                            <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '500' }}>{booking.eventName}</div>
                                <span style={{
                                  backgroundColor: paymentColor.bg,
                                  color: paymentColor.text,
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.65rem',
                                  fontWeight: '600',
                                  textTransform: 'capitalize'
                                }}>
                                  {booking.paymentStatus.replace('_', ' ')}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setPaymentBooking({ photographer, booking }); setShowPaymentModal(true); }}
                                style={{
                                  backgroundColor: booking.paymentStatus === 'failed' ? '#F20C8F' : '#083A85',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                {booking.paymentStatus === 'failed' ? <><RefreshIcon /> Retry</> : <><CreditCardIcon /> Pay ${amountDue}</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Spent</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#083A85' }}>${photographer.totalSpent}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRebookPhotographer(photographer); setShowRebookModal(true); }}
                        style={{
                          backgroundColor: '#F20C8F',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}
                      >
                        <RefreshIcon />
                        Rebook
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              {filteredPhotographers.map((photographer, index) => (
                <div
                  key={photographer.id}
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    borderBottom: index < filteredPhotographers.length - 1 ? '1px solid #E5E7EB' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedPhotographer(photographer)}
                  onContextMenu={(e) => handleContextMenu(e, photographer)}
                >
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={photographer.profileImage}
                      alt={photographer.firstName}
                      width={80}
                      height={80}
                      style={{ borderRadius: '0.5rem', objectFit: 'cover' }}
                    />
                    {photographer.isFavorite && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#F20C8F',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <HeartIcon filled={true} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {photographer.firstName} {photographer.lastName}
                          </h3>
                          {photographer.verified && <VerifiedIcon />}
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8'
                          }}>
                            {photographer.totalBookingsWithClient} booking{photographer.totalBookingsWithClient > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <LocationIcon />
                          <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                            {photographer.location.city}, {photographer.location.country}
                          </span>
                          <span style={{ color: '#D1D5DB', margin: '0 0.5rem' }}>•</span>
                          <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Last: {formatDate(photographer.lastBookingDate)}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '0.25rem' }}>
                          {photographer.lastEventType}: {photographer.lastEventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {renderStars(photographer.rating)}
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{photographer.rating}</span>
                          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>({photographer.reviewCount} reviews)</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(photographer.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <HeartIcon filled={photographer.isFavorite} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleContextMenu(e, photographer); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6B7280' }}
                        >
                          <MoreIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Spent</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>${photographer.totalSpent}</div>
                    </div>
                    {/* Payment Status in List View */}
                    {photographer.bookings.some(b => b.paymentStatus !== 'paid') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {photographer.bookings.filter(b => b.paymentStatus !== 'paid').slice(0, 1).map((booking) => {
                          const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                          const amountDue = booking.totalAmount - booking.paidAmount;
                          return (
                            <button
                              key={booking.id}
                              onClick={(e) => { e.stopPropagation(); setPaymentBooking({ photographer, booking }); setShowPaymentModal(true); }}
                              style={{
                                backgroundColor: booking.paymentStatus === 'failed' ? '#F20C8F' : '#083A85',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              {booking.paymentStatus === 'failed' ? <><RefreshIcon /> Retry Payment</> : <><CreditCardIcon /> Pay ${amountDue}</>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          backgroundColor: 'white',
                          color: '#6B7280',
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageIcon />
                        Message
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRebookPhotographer(photographer); setShowRebookModal(true); }}
                        style={{
                          backgroundColor: '#F20C8F',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}
                      >
                        <RefreshIcon />
                        Rebook
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E5E7EB',
            padding: '0.5rem 0',
            zIndex: 1000,
            minWidth: '180px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: <RefreshIcon />, label: 'Rebook Photographer', action: () => { setRebookPhotographer(contextMenu.photographer); setShowRebookModal(true); } },
            { icon: <MessageIcon />, label: 'Send Message', action: () => {} },
            { icon: <CameraIcon />, label: 'View Profile', action: () => setSelectedPhotographer(contextMenu.photographer) },
            { icon: <HeartIcon filled={contextMenu.photographer.isFavorite} />, label: contextMenu.photographer.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', action: () => toggleFavorite(contextMenu.photographer.id) },
            { icon: <StarIcon filled={true} />, label: contextMenu.photographer.myReview ? 'Edit Review' : 'Leave a Review', action: () => { setReviewPhotographer(contextMenu.photographer); setReviewRating(contextMenu.photographer.myRating || 5); setReviewText(contextMenu.photographer.myReview || ''); setShowReviewModal(true); } },
            { icon: <ShareIcon />, label: 'Share Profile', action: () => { setSharePhotographer(contextMenu.photographer); setShowShareModal(true); } },
            { icon: <ReportIcon />, label: 'Report', action: () => { setReportPhotographer(contextMenu.photographer); setShowReportModal(true); }, danger: true }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => { item.action(); setContextMenu(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.625rem 1rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: (item as { danger?: boolean }).danger ? '#DC2626' : '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Photographer Detail Modal */}
      <Modal
        isOpen={!!selectedPhotographer}
        onClose={() => setSelectedPhotographer(null)}
        title=""
        maxWidth="700px"
      >
        {selectedPhotographer && (
          <div>
            {/* Cover */}
            <div style={{ position: 'relative', height: '180px', margin: '-1.5rem -1.5rem 0 -1.5rem', borderRadius: '0.75rem 0.75rem 0 0', overflow: 'hidden' }}>
              <Image
                src={selectedPhotographer.coverImage}
                alt="Cover"
                fill
                style={{ objectFit: 'cover' }}
              />
              <button
                onClick={() => setSelectedPhotographer(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginTop: '-40px', marginBottom: '1rem', paddingLeft: '1rem' }}>
              <Image
                src={selectedPhotographer.profileImage}
                alt={selectedPhotographer.firstName}
                width={90}
                height={90}
                style={{ borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }}
              />
              <div style={{ paddingBottom: '0.5rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {selectedPhotographer.firstName} {selectedPhotographer.lastName}
                  </h2>
                  {selectedPhotographer.verified && <VerifiedIcon />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <LocationIcon />
                  <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                    {selectedPhotographer.location.city}, {selectedPhotographer.location.country}
                  </span>
                </div>
              </div>
            </div>

            {/* Your History Stats */}
            <div style={{ backgroundColor: '#FDF2F8', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F', marginBottom: '0.75rem' }}>Your History with {selectedPhotographer.firstName}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>{selectedPhotographer.totalBookingsWithClient}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Bookings</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>${selectedPhotographer.totalSpent}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Total Spent</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>{formatDate(selectedPhotographer.lastBookingDate)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Last Booking</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Last Event</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{selectedPhotographer.lastEventName}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{selectedPhotographer.lastEventType}</div>
              </div>
            </div>

            {/* Your Review */}
            {selectedPhotographer.myReview && (
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>Your Review</h3>
                  {renderStars(selectedPhotographer.myRating || 0)}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', fontStyle: 'italic' }}>&quot;{selectedPhotographer.myReview}&quot;</p>
              </div>
            )}

            {/* General Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedPhotographer.rating}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Rating</div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedPhotographer.completedBookings}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Total Bookings</div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedPhotographer.experience} yrs</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Experience</div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedPhotographer.responseTime}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Response</div>
              </div>
            </div>

            {/* Portfolio Preview */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>Portfolio</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {selectedPhotographer.portfolioImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', height: '100px', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <Image src={img} alt={`Portfolio ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>About</h3>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: '1.6' }}>{selectedPhotographer.bio}</p>
            </div>

            {/* Specializations */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Specializations</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedPhotographer.specializations.map((spec) => (
                  <span
                    key={spec}
                    style={{
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => toggleFavorite(selectedPhotographer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <HeartIcon filled={selectedPhotographer.isFavorite} />
              </button>
              <button
                onClick={() => { setSharePhotographer(selectedPhotographer); setShowShareModal(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <ShareIcon />
              </button>
              <button
                onClick={() => { setReviewPhotographer(selectedPhotographer); setReviewRating(selectedPhotographer.myRating || 5); setReviewText(selectedPhotographer.myReview || ''); setShowReviewModal(true); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <StarIcon filled={true} />
                {selectedPhotographer.myReview ? 'Edit Review' : 'Leave Review'}
              </button>
              <button
                onClick={() => { setRebookPhotographer(selectedPhotographer); setShowRebookModal(true); setSelectedPhotographer(null); }}
                style={{
                  flex: 1,
                  backgroundColor: '#F20C8F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshIcon />
                Rebook - ${selectedPhotographer.startingPrice}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rebook Modal */}
      <Modal
        isOpen={showRebookModal}
        onClose={() => setShowRebookModal(false)}
        title="Rebook Photographer"
        maxWidth="500px"
      >
        {rebookPhotographer && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#FDF2F8', borderRadius: '0.5rem' }}>
              <Image src={rebookPhotographer.profileImage} alt={rebookPhotographer.firstName} width={48} height={48} style={{ borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#111827' }}>{rebookPhotographer.firstName} {rebookPhotographer.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  You&apos;ve booked {rebookPhotographer.totalBookingsWithClient} time{rebookPhotographer.totalBookingsWithClient > 1 ? 's' : ''} before
                </div>
              </div>
              {rebookPhotographer.verified && <VerifiedIcon />}
            </div>

            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.25rem' }}>Last booking</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{rebookPhotographer.lastEventName}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{rebookPhotographer.lastEventType} • {formatDate(rebookPhotographer.lastBookingDate)}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Event Type
              </label>
              <select style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                backgroundColor: 'white'
              }}>
                <option>Select event type</option>
                {rebookPhotographer.specializations.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Date
                </label>
                <input
                  type="date"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Time
                </label>
                <input
                  type="time"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Location
              </label>
              <input
                type="text"
                placeholder="Enter event location"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Additional Notes
              </label>
              <textarea
                placeholder="Any special requirements or details..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowRebookModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: '#F20C8F',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckIcon />
                Send Booking Request
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={reviewPhotographer?.myReview ? 'Edit Your Review' : 'Leave a Review'}
      >
        {reviewPhotographer && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Image src={reviewPhotographer.profileImage} alt={reviewPhotographer.firstName} width={48} height={48} style={{ borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>{reviewPhotographer.firstName} {reviewPhotographer.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{reviewPhotographer.lastEventName}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Your Rating
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={star <= reviewRating ? '#FBBF24' : 'none'} xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience working with this photographer..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {reviewPhotographer.myReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Photographer"
      >
        {sharePhotographer && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <Image src={sharePhotographer.profileImage} alt={sharePhotographer.firstName} width={48} height={48} style={{ borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>{sharePhotographer.firstName} {sharePhotographer.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{sharePhotographer.location.city}, {sharePhotographer.location.country}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {['WhatsApp', 'Facebook', 'Twitter', 'Email', 'Copy Link', 'QR Code'].map((option) => (
                <button
                  key={option}
                  style={{
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Share Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={`https://connekt.app/photographer/${sharePhotographer.id}`}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    backgroundColor: '#F9FAFB'
                  }}
                />
                <button
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: '#083A85',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Photographer"
      >
        {reportPhotographer && (
          <div>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1rem' }}>
              Report {reportPhotographer.firstName} {reportPhotographer.lastName} for:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {['Inappropriate content', 'Fake profile', 'Spam or scam', 'Unprofessional behavior', 'Other'].map((reason) => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="report-reason" style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.9rem', color: '#374151' }}>{reason}</span>
                </label>
              ))}
            </div>
            <textarea
              placeholder="Additional details (optional)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: '#DC2626',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Submit Report
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={paymentBooking?.booking.paymentStatus === 'failed' ? 'Retry Payment' : 'Complete Payment'}
        maxWidth="450px"
      >
        {paymentBooking && (
          <div>
            {/* Failed Payment Warning */}
            {paymentBooking.booking.paymentStatus === 'failed' && (
              <div style={{ backgroundColor: '#FEE2E2', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircleIcon />
                <span style={{ fontSize: '0.85rem', color: '#DC2626' }}>Previous payment attempt failed. Please try again with a different payment method.</span>
              </div>
            )}

            {/* Photographer Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <Image src={paymentBooking.photographer.profileImage} alt={paymentBooking.photographer.firstName} width={48} height={48} style={{ borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>{paymentBooking.photographer.firstName} {paymentBooking.photographer.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{paymentBooking.booking.eventName}</div>
              </div>
            </div>

            {/* Amount Summary */}
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Event</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{paymentBooking.booking.eventType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Date</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{formatDate(paymentBooking.booking.eventDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Package</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{paymentBooking.booking.packageName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Total Amount</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>${paymentBooking.booking.totalAmount}</span>
              </div>
              {paymentBooking.booking.paidAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Already Paid</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#059669' }}>-${paymentBooking.booking.paidAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>Amount Due</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>
                  ${paymentBooking.booking.totalAmount - paymentBooking.booking.paidAmount}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                  { id: 'mobile', label: 'Mobile Money (MTN, Airtel)', icon: '📱' },
                  { id: 'bank', label: 'Bank Transfer', icon: '🏦' }
                ].map((method) => (
                  <label
                    key={method.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem',
                      border: selectedPaymentMethod === method.id ? '2px solid #083A85' : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: selectedPaymentMethod === method.id ? '#EFF6FF' : 'white'
                    }}
                  >
                    <input
                      type="radio"
                      name="photographer-payment-method"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => setSelectedPaymentMethod(method.id)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '1.25rem' }}>{method.icon}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Card Details (shown when card is selected) */}
            {selectedPaymentMethod === 'card' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Money (shown when mobile is selected) */}
            {selectedPaymentMethod === 'mobile' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+250 78X XXX XXX"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: paymentBooking.booking.paymentStatus === 'failed' ? '#F20C8F' : '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {paymentBooking.booking.paymentStatus === 'failed' ? 'Retry Payment' : 'Pay'} ${paymentBooking.booking.totalAmount - paymentBooking.booking.paidAmount}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookedPhotographersPage;
