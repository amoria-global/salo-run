"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { HeartIcon as DonateHeartIcon } from '../../components/UnlockModal';

function getApiUrl(): string {
  return 'https://backend.connekyt.com';
}

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
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = ({ active, activeColor = '#083A85' }: { active: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
  </svg>
);

const ListIcon = ({ active, activeColor = '#083A85' }: { active: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="6" x2="21" y2="6" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const TipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
  </svg>
);

const ReviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'partially_paid';

interface Booking {
  id: string;
  declarationId?: string;
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
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: colors.bgTertiary,
                border: `2px solid ${colors.borderPrimary}`,
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textPrimary,
                transition: 'all 0.2s'
              }}
            >
              <CloseIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

interface PhotographersPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const BookedPhotographersPage = ({ userRole = 'client' }: PhotographersPageProps) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice, currencyId } = useCurrency();
  const { token, user } = useDashboardAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPhotographer, setSelectedPhotographer] = useState<BookedPhotographer | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPhotographer, setReportPhotographer] = useState<BookedPhotographer | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [rebookPhotographer, setRebookPhotographer] = useState<BookedPhotographer | null>(null);
  const [rebookEventType, setRebookEventType] = useState('');
  const [rebookDate, setRebookDate] = useState('');
  const [rebookTime, setRebookTime] = useState('');
  const [rebookLocation, setRebookLocation] = useState('');
  const [rebookNotes, setRebookNotes] = useState('');
  const [isSubmittingRebook, setIsSubmittingRebook] = useState(false);
  const [rebookError, setRebookError] = useState<string | null>(null);
  const [rebookEvents, setRebookEvents] = useState<{id: string; title: string; eventType: string; eventDate: string; startTime: string; endTime: string; location: string; city: string; country: string; address: string}[]>([]);
  const [rebookEventsLoading, setRebookEventsLoading] = useState(false);
  const [selectedRebookEventId, setSelectedRebookEventId] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewPhotographer, setReviewPhotographer] = useState<BookedPhotographer | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; photographer: BookedPhotographer } | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'bookings' | 'spent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'pending_payments'>('all');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewEvents, setReviewEvents] = useState<{id: string; title: string; eventDate: string}[]>([]);
  const [selectedReviewEventId, setSelectedReviewEventId] = useState<string>('');
  const [reviewEventsLoading, setReviewEventsLoading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState<number | 'custom' | ''>('');
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // New states for tip flow
  const [showTipPromptModal, setShowTipPromptModal] = useState(false);
  const [showTipSelectionModal, setShowTipSelectionModal] = useState(false);
  const [showTipPaymentModal, setShowTipPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Invite modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [pendingReviewPhotographer, setPendingReviewPhotographer] = useState<BookedPhotographer | null>(null);
  const [selectedTipPaymentMethod, setSelectedTipPaymentMethod] = useState<string>('card');
  const [paymentBooking, setPaymentBooking] = useState<{ photographer: BookedPhotographer; booking: Booking } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  // Donation states for payment modal
  const [payDonationAmount, setPayDonationAmount] = useState<string>('');
  const [payCustomDonation, setPayCustomDonation] = useState<string>('');
  const [payDonationSkipped, setPayDonationSkipped] = useState<boolean>(false);
  const [payShowCustomInput, setPayShowCustomInput] = useState<boolean>(false);
  const [payShowReceipt, setPayShowReceipt] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Donation states for tip payment modal
  const [tipDonationAmount, setTipDonationAmount] = useState<string>('');
  const [tipCustomDonation, setTipCustomDonation] = useState<string>('');
  const [tipDonationSkipped, setTipDonationSkipped] = useState<boolean>(false);
  const [tipShowCustomInput, setTipShowCustomInput] = useState<boolean>(false);
  const [tipShowReceipt, setTipShowReceipt] = useState<boolean>(false);

  const [photographers, setPhotographers] = useState<BookedPhotographer[]>([]);

  const specializations = ['Weddings', 'Events', 'Portraits', 'Birthdays', 'Corporate', 'Fashion', 'Festivals', 'Concerts'];

  // Fetch booked photographers from API
  useEffect(() => {
    if (!token || !user?.id) return;

    const fetchPhotographers = async () => {
      try {
        const apiUrl = getApiUrl();
        const ns = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
        const endpoint = `${apiUrl}/api/remote/${ns}/photographers`;

        // Fetch photographers and bookmarks in parallel
        const [response, bookmarksResponse] = await Promise.all([
          dashboardAuthFetch(endpoint, { headers: { 'Content-Type': 'application/json' } }),
          dashboardAuthFetch(`${apiUrl}/api/remote/customer/photographers/bookmarks`, { headers: { 'Content-Type': 'application/json' } }).catch(() => null),
        ]);
        if (!response.ok) throw new Error('Failed to fetch photographers');
        const result = await response.json();

        // Build a set of bookmarked photographer IDs
        let bookmarkedIds = new Set<string>();
        if (bookmarksResponse?.ok) {
          try {
            const bmResult = await bookmarksResponse.json();
            const bmData = bmResult?.data?.content || bmResult?.data || [];
            const bmArr = Array.isArray(bmData) ? bmData : [];
            bmArr.forEach((b: any) => {
              if (b.photographerId) bookmarkedIds.add(b.photographerId);
            });
          } catch { /* ignore parse errors */ }
        }

        // Coordinator endpoint returns paginated {content:[...]}, customer returns flat array
        const data = result?.data?.content || result?.data || [];
        const mapped: BookedPhotographer[] = data.map((p: any) => ({
          id: p.id,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          profileImage: ((url: string | undefined) => url && !url.includes('/null') ? url.replace('http://197.243.24.101', 'https://backend.connekyt.com') : undefined)(p.profileImage || p.profilePicture || undefined),
          coverImage: ((url: string) => url && !url.includes('/null') ? url.replace('http://197.243.24.101', 'https://backend.connekyt.com') : '')(p.coverImage || p.coverPicture || ''),
          portfolioImages: (p.portfolioImages || (p.projects || []).map((proj: any) => proj.imageUrl || '')).map((url: string) => url ? url.replace('http://197.243.24.101', 'https://backend.connekyt.com') : ''),
          bio: p.bio || p.about || '',
          specializations: p.specializations || (p.specialties || []).map((s: any) => typeof s === 'string' ? s : s.name || ''),
          experience: p.experience || 0,
          location: p.location || (p.address ? { city: p.address, country: '' } : { city: '', country: '' }),
          rating: p.rating || 0,
          reviewCount: p.reviewCount || (p.reviews || []).length || 0,
          completedBookings: p.completedBookings || 0,
          verified: p.isVerified || p.profileReviewStatus === 'ACCEPTED' || false,
          startingPrice: p.startingPrice || 0,
          responseTime: p.responseTime || 'N/A',
          isFavorite: p.isFavorite || p.isBookmarked || p.bookmarked || bookmarkedIds.has(p.id) || false,
          isAvailable: p.isAvailable || false,
          languages: p.languages || [],
          equipment: p.equipment || (p.equipments || []).map((e: any) => typeof e === 'string' ? e : e.name || ''),
          lastBookingDate: p.lastBookingDate || '',
          lastEventType: p.lastEventType || '',
          lastEventName: p.lastEventName || '',
          totalBookingsWithClient: p.totalBookingsWithClient || 0,
          totalSpent: p.totalSpent || 0,
          myRating: p.myRating || undefined,
          myReview: p.myReview || undefined,
          bookings: (p.bookings || []).map((b: any) => ({
            id: b.id,
            declarationId: b.declarationId || b.paymentDeclarationId || b.id,
            eventName: b.eventName || '',
            eventType: b.eventType || '',
            eventDate: b.eventDate || '',
            eventTime: b.eventTime || '',
            duration: b.duration || '',
            location: b.location || '',
            packageName: b.packageName || '',
            totalAmount: b.totalAmount || 0,
            paidAmount: b.paidAmount || 0,
            paymentStatus: b.paymentStatus || 'pending',
            status: b.status || 'upcoming',
          })),
        }));
        setPhotographers(mapped);
      } catch (err) {
        console.error('Failed to fetch photographers:', err);
      }
    };

    fetchPhotographers();
  }, [token, user?.id]);

  // Fetch completed events when review modal opens
  useEffect(() => {
    if (!showReviewModal || !reviewPhotographer || !token) return;

    const fetchEvents = async () => {
      setReviewEventsLoading(true);
      setReviewError(null);
      try {
        const apiUrl = getApiUrl();
        const eventsNs = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/${eventsNs}/events?page=0&size=100`);

        if (!response.ok) throw new Error('Failed to fetch events');

        const result = await response.json();
        const events = result?.data?.content || result?.data || [];

        // Filter for completed events involving this photographer
        const completedEvents = events
          .filter((evt: { status?: string; photographerId?: string }) =>
            evt.photographerId === reviewPhotographer.id &&
            (evt.status === 'COMPLETED' || evt.status === 'completed')
          )
          .map((evt: { id: string; title?: string; eventDate?: string }) => ({
            id: evt.id,
            title: evt.title || 'Untitled Event',
            eventDate: evt.eventDate || '',
          }));

        setReviewEvents(completedEvents);
      } catch (err) {
        console.error('Failed to fetch events for review:', err);
        setReviewEvents([]);
      } finally {
        setReviewEventsLoading(false);
      }
    };

    fetchEvents();
  }, [showReviewModal, reviewPhotographer, token]);

  // Fetch existing events when rebook modal opens
  useEffect(() => {
    if (!showRebookModal || !token) return;

    const fetchRebookEvents = async () => {
      setRebookEventsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const eventsNs = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/${eventsNs}/events?page=0&size=100`);
        if (!response.ok) throw new Error('Failed to fetch events');
        const result = await response.json();
        const rawEvents = result?.data?.content || result?.data || [];
        const events = Array.isArray(rawEvents) ? rawEvents : [];
        const upcoming = events
          .filter((evt: any) => {
            const s = (evt.eventStatus || evt.status || '').toUpperCase();
            return s !== 'CANCELLED' && s !== 'CANCELED';
          })
          .map((evt: any) => ({
            id: evt.id,
            title: evt.title || evt.eventName || 'Untitled Event',
            eventType: evt.eventCategory || evt.eventType || evt.title || '',
            eventDate: evt.eventDate || '',
            startTime: evt.startTime || '',
            endTime: evt.endTime || '',
            location: evt.location || '',
            city: '',
            country: '',
            address: '',
          }));
        setRebookEvents(upcoming);
      } catch (err) {
        console.error('Failed to fetch events for rebook:', err);
        setRebookEvents([]);
      } finally {
        setRebookEventsLoading(false);
      }
    };

    fetchRebookEvents();
  }, [showRebookModal, token]);

  const handleRebookEventSelect = (eventId: string) => {
    setSelectedRebookEventId(eventId);
    if (!eventId) {
      // Cleared selection — reset fields
      setRebookEventType('');
      setRebookDate('');
      setRebookTime('');
      setRebookLocation('');
      return;
    }
    const evt = rebookEvents.find(e => e.id === eventId);
    if (!evt) return;
    setRebookEventType(evt.eventType || '');
    setRebookDate(evt.eventDate || '');
    setRebookTime(evt.startTime || '');
    setRebookLocation(evt.location || '');
  };

  const toggleFavorite = async (id: string) => {
    const photographer = photographers.find(p => p.id === id);
    if (!photographer) return;
    const willFavorite = !photographer.isFavorite;
    setPhotographers(prev => prev.map(p =>
      p.id === id ? { ...p, isFavorite: willFavorite } : p
    ));
    try {
      const apiUrl = getApiUrl();
      // Bookmark endpoints are under /customer/ for all roles (no role restriction)
      const endpoint = willFavorite
        ? `${apiUrl}/api/remote/customer/photographers/bookmark/${id}`
        : `${apiUrl}/api/remote/customer/photographers/unbookmark/${id}`;
      const res = await dashboardAuthFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Bookmark failed');
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setPhotographers(prev => prev.map(p =>
        p.id === id ? { ...p, isFavorite: !willFavorite } : p
      ));
    }
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
      case 'paid': return { bg: actualTheme === 'dark' ? '#14532D' : '#DCFCE7', text: actualTheme === 'dark' ? '#86EFAC' : '#15803D' };
      case 'pending': return { bg: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', text: actualTheme === 'dark' ? '#FCD34D' : '#B45309' };
      case 'partially_paid': return { bg: actualTheme === 'dark' ? '#1E3A8A' : '#DBEAFE', text: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8' };
      case 'failed': return { bg: actualTheme === 'dark' ? '#450A0A' : '#FEE2E2', text: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' };
      default: return { bg: actualTheme === 'dark' ? '#374151' : '#F3F4F6', text: actualTheme === 'dark' ? '#D1D5DB' : '#6B7280' };
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

  const submitReview = async () => {
    if (!reviewPhotographer) return;

    if (!selectedReviewEventId) {
      setReviewError('Please select an event to review');
      return;
    }

    if (!reviewText.trim()) {
      setReviewError('Please write a review comment');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedReviewEventId,
          rating: reviewRating,
          comment: reviewText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to submit review: ${response.status}`);
      }

      // Update local state
      setPhotographers(prev => prev.map(p =>
        p.id === reviewPhotographer.id
          ? { ...p, myRating: reviewRating, myReview: reviewText }
          : p
      ));

      // Store photographer for tip flow
      setPendingReviewPhotographer(reviewPhotographer);

      // Close review modal and reset
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText('');
      setSelectedReviewEventId('');
      setReviewEvents([]);
      setReviewError(null);

      // Show tip prompt modal
      setShowTipPromptModal(true);
    } catch (err) {
      console.error('Submit review error:', err);
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleTipPromptYes = () => {
    setShowTipPromptModal(false);
    setShowTipSelectionModal(true);
  };

  const handleTipPromptNo = () => {
    setShowTipPromptModal(false);
    setSuccessMessage('Review submitted successfully!');
    setShowSuccessModal(true);
    setPendingReviewPhotographer(null);
  };

  const handleSendTip = () => {
    setShowTipSelectionModal(false);
    setShowTipPaymentModal(true);
  };

  const handleTipPaymentComplete = async () => {
    if (pendingReviewPhotographer) {
      const finalTipAmount = tipAmount === 'custom' ? parseFloat(customTipAmount) || 0 : (tipAmount as number) || 0;

      // Find an eventId from the photographer's bookings
      const completedBooking = pendingReviewPhotographer.bookings?.find(b => b.status === 'completed');
      const eventId = completedBooking?.id;

      let tipRecorded = false;
      if (eventId && finalTipAmount > 0) {
        try {
          const apiUrl = getApiUrl();
          const params = new URLSearchParams({
            recipientId: pendingReviewPhotographer.id,
            eventId,
            amount: finalTipAmount.toString(),
            ...(currencyId ? { currencyId } : {}),
          });
          const res = await dashboardAuthFetch(
            `${apiUrl}/api/remote/payments/record-tip?${params.toString()}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to record tip');
          }
          tipRecorded = true;
        } catch (err) {
          console.error('Failed to record tip:', err);
        }
      }

      // Only update local total spent if tip was successfully recorded
      if (tipRecorded) {
        setPhotographers(prev => prev.map(p =>
          p.id === pendingReviewPhotographer.id
            ? { ...p, totalSpent: p.totalSpent + finalTipAmount }
            : p
        ));
      }

      setShowTipPaymentModal(false);
      setTipAmount('');
      setCustomTipAmount('');
      setSelectedTipPaymentMethod('card');
      setSuccessMessage(tipRecorded ? 'Review and tip submitted successfully!' : 'Review submitted successfully!');
      setShowSuccessModal(true);
      setPendingReviewPhotographer(null);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  // --- Send rebook request (both client and coordinator) ---
  const handleSendBookingRequest = async () => {
    if (!rebookPhotographer) return;

    if (!rebookEventType || !rebookDate || !rebookTime || !rebookLocation) {
      setRebookError('Please fill in all required fields');
      return;
    }

    setIsSubmittingRebook(true);
    setRebookError(null);

    try {
      const apiUrl = getApiUrl();
      const rebookNs = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/${rebookNs}/rebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(selectedRebookEventId ? { eventId: selectedRebookEventId } : {}),
          title: selectedRebookEventId
            ? (rebookEvents.find(e => e.id === selectedRebookEventId)?.title || `${rebookEventType} - ${rebookPhotographer.firstName} ${rebookPhotographer.lastName}`.trim())
            : `${rebookEventType} - ${rebookPhotographer.firstName} ${rebookPhotographer.lastName}`.trim(),
          photographerId: rebookPhotographer.id,
          eventType: rebookEventType,
          eventDate: rebookDate,
          startTime: rebookTime,
          endTime: rebookTime,
          location: rebookLocation,
          notes: rebookNotes,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.action === 0) {
        throw new Error(result.message || 'Failed to send booking request');
      }

      // Reset form & close modal
      setShowRebookModal(false);
      setRebookEventType('');
      setRebookDate('');
      setRebookTime('');
      setRebookLocation('');
      setRebookNotes('');
      setRebookPhotographer(null);
      setSelectedRebookEventId('');
      setRebookEvents([]);

      setSuccessMessage('Booking request sent successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Rebook error:', err);
      setRebookError(err instanceof Error ? err.message : 'Failed to send booking request');
    } finally {
      setIsSubmittingRebook(false);
    }
  };

  // --- Coordinator: Invite photographer by email ---
  const inviteLink = `https://connekt.app/invite/photographer/${user?.id || ''}`;

  const handleInvitePhotographer = async () => {
    if (userRole !== 'event-coordinator' || !inviteEmail.trim()) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setIsSendingInvite(true);
    setInviteError(null);

    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/coordinator/photographers/invite?email=${encodeURIComponent(inviteEmail.trim())}`,
        { method: 'POST' }
      );

      const result = await response.json();
      if (!response.ok || result.action === 0) {
        throw new Error(result.message || 'Failed to invite photographer');
      }

      setInviteEmail('');
      setInviteError(null);
      setShowInviteModal(false);
      setSuccessMessage('Invitation sent successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Invite photographer error:', err);
      setInviteError(err instanceof Error ? err.message : 'Failed to invite photographer');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // Allow reviews only for photographers with completed events
  const hasCompletedEvent = (photographer: BookedPhotographer) => {
    if (photographer.completedBookings > 0) return true;
    return photographer.bookings.some(booking => {
      const s = (booking.status || '').toUpperCase();
      return s === 'COMPLETED';
    });
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem;
          }
          .mobile-title {
            font-size: 1.5rem !important;
          }
          .mobile-subtitle {
            font-size: 0.85rem !important;
          }
          .mobile-header-actions {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .mobile-stats-grid > div {
            padding: 0.75rem !important;
          }
          .mobile-stats-grid > div > div:first-child {
            font-size: 0.75rem !important;
          }
          .mobile-stats-grid > div > div:last-child {
            font-size: 1.2rem !important;
          }
          .mobile-tabs {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .mobile-search-filters {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-filter-buttons {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .mobile-photographers-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 8rem !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-title {
            font-size: 1.3rem !important;
          }
          .mobile-subtitle {
            font-size: 0.8rem !important;
          }
          .mobile-stats-grid {
            gap: 0.5rem !important;
          }
          .mobile-stats-grid > div {
            padding: 0.6rem !important;
          }
          .mobile-stats-grid > div > div:first-child {
            font-size: 0.7rem !important;
          }
          .mobile-stats-grid > div > div:last-child {
            font-size: 1.1rem !important;
          }
          .mobile-main-content {
            padding: 0.5rem !important;
            padding-bottom: 10rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600' }}>Booked Photographers</h1>
              <p className="mobile-subtitle" style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Photographers you&apos;ve worked with - rebook your favorites
              </p>
            </div>
            <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Invite Photographer - coordinator only */}
              {userRole === 'event-coordinator' && (
                <button
                  onClick={() => { setShowInviteModal(true); setInviteEmail(''); setInviteError(null); setInviteCopied(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F20C8F',
                    color: 'white',
                    border: '2px solid #c00a72',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <MessageIcon />
                  Invite New
                </button>
              )}
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
                    backgroundColor: colors.bgCard,
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
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
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: colors.bgTertiary, borderRadius: '0.375rem', padding: '0.25rem' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? colors.bgCard : 'transparent',
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
                    backgroundColor: viewMode === 'list' ? colors.bgCard : 'transparent',
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
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #083A85' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Photographers</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{photographers.length}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Bookings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                {photographers.reduce((sum, p) => sum + p.totalBookingsWithClient, 0)}
              </div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Spent</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                {formatPrice(photographers.reduce((sum, p) => sum + p.totalSpent, 0))}
              </div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #F20C8F' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F20C8F' }}>
                {photographers.filter(p => p.isFavorite).length}
              </div>
            </div>
            <div style={{ backgroundColor: totalPendingAmount > 0 ? (actualTheme === 'dark' ? '#450A0A' : '#FEF2F2') : colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: totalPendingAmount > 0 ? `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FECACA'}` : `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #DC2626' }}>
              <div style={{ fontSize: '0.85rem', color: totalPendingAmount > 0 ? (actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C') : colors.textSecondary, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {totalPendingAmount > 0 && <AlertCircleIcon />}
                Pending Payments
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalPendingAmount > 0 ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : colors.textSecondary }}>
                {formatPrice(totalPendingAmount)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mobile-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
                    : colors.bgCard,
                  color: activeTab === tab.key ? 'white' : colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: activeTab === tab.key
                    ? 'rgba(255,255,255,0.2)'
                    : ((tab as { alert?: boolean }).alert && tab.count > 0 ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2') : colors.bgTertiary),
                  color: (tab as { alert?: boolean }).alert && tab.count > 0 && activeTab !== tab.key ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : undefined,
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
          <div className="mobile-search-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: showFilters ? '#083A85' : colors.bgCard,
                color: showFilters ? 'white' : '#6B7280',
                border: `2px solid ${colors.borderPrimary}`,
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
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', backgroundColor: colors.bgCard, padding: '1rem', borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}` }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem', display: 'block' }}>Event Type</span>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialization(selectedSpecialization === spec ? null : spec)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: selectedSpecialization === spec ? '1px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        backgroundColor: selectedSpecialization === spec ? '#083A85' : colors.bgCard,
                        color: selectedSpecialization === spec ? 'white' : colors.textSecondary,
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
            <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Showing {filteredPhotographers.length} photographer{filteredPhotographers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Photographers Grid/List */}
          {filteredPhotographers.length === 0 ? (
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', border: `2px solid ${colors.borderPrimary}` }}>
              <CameraIcon />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginTop: '1rem' }}>No photographers found</h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                {activeTab === 'favorites' ? 'You haven\'t added any photographers to favorites yet.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="mobile-photographers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredPhotographers.map((photographer) => (
                <div
                  key={photographer.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => setSelectedPhotographer(photographer)}
                  onContextMenu={(e) => handleContextMenu(e, photographer)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(0, 0, 0, 0.2), 0 15px 30px -10px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Cover Image with overlay */}
                  <div style={{ position: 'relative', height: '160px', backgroundColor: photographer.coverImage ? 'transparent' : '#0D1B2A' }}>
                    <img src={photographer.coverImage || '/coverr.jpg'} alt={photographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: photographer.coverImage ? 'cover' : 'contain', objectPosition: 'center', borderRadius: '1rem 1rem 0 0' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                    {photographer.coverImage && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13, 27, 42, 0.3)', borderRadius: '1rem 1rem 0 0' }} />
                    )}
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
                      gap: '0.25rem',
                      zIndex: 5
                    }}>
                      <CalendarIcon /> {photographer.totalBookingsWithClient} booking{photographer.totalBookingsWithClient > 1 ? 's' : ''}
                    </div>
                    {/* Action Buttons */}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.375rem', zIndex: 5 }}>
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
                    {/* Profile Image - positioned to overlap */}
                    <div style={{
                      position: 'absolute',
                      top: '122px',
                      left: '20px',
                      width: '70px',
                      height: '70px',
                      zIndex: 10,
                    }}>
                      <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        {photographer.profileImage && (
                          <img src={photographer.profileImage} alt={photographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                      </div>
                      {photographer.verified && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0px',
                          right: '0px',
                          background: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                        }}>
                          <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Info - with padding to account for overlapping profile image */}
                  <div style={{ padding: '1rem', paddingTop: '55px' }}>
                    <div style={{ marginLeft: '0px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                          {photographer.firstName} {photographer.lastName}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <LocationIcon />
                        <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                          {photographer.location.city}, {photographer.location.country}
                        </span>
                      </div>
                    </div>

                    {/* Last Booking Info */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Last Booking</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{photographer.lastEventName}</div>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.125rem' }}>
                        {photographer.lastEventType} • {formatDate(photographer.lastBookingDate)}
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {renderStars(photographer.rating)}
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{photographer.rating}</span>
                      <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>({photographer.reviewCount} reviews)</span>
                    </div>

                    {/* Payment Status for Pending Bookings */}
                    {photographer.bookings.some(b => b.paymentStatus !== 'paid') && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', borderRadius: '0.375rem' }}>
                        {photographer.bookings.filter(b => b.paymentStatus !== 'paid').slice(0, 1).map((booking) => {
                          const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                          const amountDue = booking.totalAmount - booking.paidAmount;
                          return (
                            <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: actualTheme === 'dark' ? '#FCD34D' : '#92400E', fontWeight: '500' }}>{booking.eventName}</div>
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
                                  border: booking.paymentStatus === 'failed' ? '2px solid #C0096D' : '2px solid #062a63',
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
                                {booking.paymentStatus === 'failed' ? <><RefreshIcon /> Retry</> : <><CreditCardIcon /> Pay {formatPrice(amountDue)}</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: `2px solid ${colors.borderPrimary}` }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Total Spent</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(photographer.totalSpent)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {hasCompletedEvent(photographer) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewPhotographer(photographer);
                              setReviewRating(photographer.myRating || 5);
                              setReviewText(photographer.myReview || '');
                              setTipAmount('');
                              setCustomTipAmount('');
                              setShowReviewModal(true);
                            }}
                            style={{
                              backgroundColor: photographer.myReview ? colors.bgTertiary : '#083A85',
                              color: photographer.myReview ? colors.textPrimary : 'white',
                              border: photographer.myReview ? `2px solid ${colors.borderPrimary}` : '2px solid #062a63',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}
                            title={photographer.myReview ? 'Edit your review' : 'Leave a review'}
                          >
                            <ReviewIcon />
                            {photographer.myReview ? 'Edit' : 'Review'}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setRebookPhotographer(photographer); setSelectedRebookEventId(''); setRebookEventType(''); setRebookDate(''); setRebookTime(''); setRebookLocation(''); setRebookNotes(''); setShowRebookModal(true); }}
                          style={{
                            backgroundColor: '#F20C8F',
                            color: 'white',
                            border: '2px solid #C0096D',
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
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              {filteredPhotographers.map((photographer, index) => (
                <div
                  key={photographer.id}
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    borderBottom: index < filteredPhotographers.length - 1 ? `2px solid ${colors.borderPrimary}` : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => setSelectedPhotographer(photographer)}
                  onContextMenu={(e) => handleContextMenu(e, photographer)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? '#374151' : '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                      </svg>
                      {photographer.profileImage && (
                        <img src={photographer.profileImage} alt={photographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                    </div>
                    {photographer.verified && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        background: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                      }}>
                        <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                            {photographer.firstName} {photographer.lastName}
                          </h3>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: actualTheme === 'dark' ? '#1E3A8A' : '#EFF6FF',
                            color: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8'
                          }}>
                            {photographer.totalBookingsWithClient} booking{photographer.totalBookingsWithClient > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <LocationIcon />
                          <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                            {photographer.location.city}, {photographer.location.country}
                          </span>
                          <span style={{ color: '#D1D5DB', margin: '0 0.5rem' }}>•</span>
                          <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Last: {formatDate(photographer.lastBookingDate)}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: colors.textPrimary, marginTop: '0.25rem' }}>
                          {photographer.lastEventType}: {photographer.lastEventName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {renderStars(photographer.rating)}
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{photographer.rating}</span>
                          <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>({photographer.reviewCount} reviews)</span>
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: colors.textSecondary }}
                        >
                          <MoreIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Total Spent</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(photographer.totalSpent)}</div>
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
                                border: booking.paymentStatus === 'failed' ? '2px solid #C0096D' : '2px solid #062a63',
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
                              {booking.paymentStatus === 'failed' ? <><RefreshIcon /> Retry Payment</> : <><CreditCardIcon /> Pay {formatPrice(amountDue)}</>}
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
                          backgroundColor: colors.bgCard,
                          color: colors.textSecondary,
                          border: `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.375rem',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageIcon />
                        Message
                      </button>
                      {hasCompletedEvent(photographer) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewPhotographer(photographer);
                            setReviewRating(photographer.myRating || 5);
                            setReviewText(photographer.myReview || '');
                            setTipAmount('');
                            setCustomTipAmount('');
                            setShowReviewModal(true);
                          }}
                          style={{
                            backgroundColor: photographer.myReview ? colors.bgTertiary : '#083A85',
                            color: photographer.myReview ? colors.textPrimary : 'white',
                            border: photographer.myReview ? `2px solid ${colors.borderPrimary}` : '2px solid #062a63',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}
                          title={photographer.myReview ? 'Edit your review' : 'Leave a review'}
                        >
                          <ReviewIcon />
                          {photographer.myReview ? 'Edit Review' : 'Review'}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setRebookPhotographer(photographer); setSelectedRebookEventId(''); setRebookEventType(''); setRebookDate(''); setRebookTime(''); setRebookLocation(''); setRebookNotes(''); setShowRebookModal(true); }}
                        style={{
                          backgroundColor: '#F20C8F',
                          color: 'white',
                          border: '2px solid #C0096D',
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
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            border: `2px solid ${colors.borderPrimary}`,
            padding: '0.5rem 0',
            zIndex: 1000,
            minWidth: '180px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: <RefreshIcon />, label: 'Rebook Photographer', action: () => { setRebookPhotographer(contextMenu.photographer); setSelectedRebookEventId(''); setRebookEventType(''); setRebookDate(''); setRebookTime(''); setRebookLocation(''); setRebookNotes(''); setShowRebookModal(true); } },
            { icon: <MessageIcon />, label: 'Send Message', action: () => {} },
            { icon: <CameraIcon />, label: 'View Profile', action: () => setSelectedPhotographer(contextMenu.photographer) },
            { icon: <HeartIcon filled={contextMenu.photographer.isFavorite} />, label: contextMenu.photographer.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', action: () => toggleFavorite(contextMenu.photographer.id) },
            ...(hasCompletedEvent(contextMenu.photographer) ? [{ icon: <StarIcon filled={true} />, label: contextMenu.photographer.myReview ? 'Edit Review' : 'Leave a Review', action: () => { setReviewPhotographer(contextMenu.photographer); setReviewRating(contextMenu.photographer.myRating || 5); setReviewText(contextMenu.photographer.myReview || ''); setShowReviewModal(true); } }] : []),
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
                color: (item as { danger?: boolean }).danger ? '#DC2626' : colors.textPrimary,
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? '#374151' : '#F3F4F6'; }}
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
            {/* Cover with overlay */}
            <div style={{ position: 'relative', height: '160px', margin: '-1.5rem -1.5rem 0 -1.5rem', overflow: 'visible', backgroundColor: selectedPhotographer.coverImage ? 'transparent' : '#0D1B2A' }}>
              <img src={selectedPhotographer.coverImage || '/coverr.jpg'} alt={selectedPhotographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedPhotographer.coverImage ? 'cover' : 'contain', objectPosition: 'center' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
              {selectedPhotographer.coverImage && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13, 27, 42, 0.3)' }} />
              )}
              <button
                onClick={() => setSelectedPhotographer(null)}
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
              {/* Profile Image - positioned to overlap */}
              <div style={{
                position: 'absolute',
                top: '105px',
                left: '20px',
                width: '70px',
                height: '70px',
                zIndex: 10
              }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {selectedPhotographer.profileImage && (
                    <img src={selectedPhotographer.profileImage} alt={selectedPhotographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
                {selectedPhotographer.verified && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    background: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                  }}>
                    <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info - with padding to account for overlapping profile image */}
            <div style={{ paddingTop: '55px', paddingLeft: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                  {selectedPhotographer.firstName} {selectedPhotographer.lastName}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <LocationIcon />
                <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                  {selectedPhotographer.location.city}, {selectedPhotographer.location.country}
                </span>
              </div>
            </div>

            {/* Your History Stats */}
            <div style={{ backgroundColor: actualTheme === 'dark' ? '#831843' : '#FDF2F8', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F', marginBottom: '0.75rem' }}>Your History with {selectedPhotographer.firstName}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary }}>{selectedPhotographer.totalBookingsWithClient}</div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Bookings</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(selectedPhotographer.totalSpent)}</div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Total Spent</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary }}>{formatDate(selectedPhotographer.lastBookingDate)}</div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Last Booking</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: colors.bgCard, borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Last Event</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>{selectedPhotographer.lastEventName}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{selectedPhotographer.lastEventType}</div>
              </div>
            </div>

            {/* Your Review */}
            {selectedPhotographer.myReview && (
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Your Review</h3>
                  {renderStars(selectedPhotographer.myRating || 0)}
                </div>
                <p style={{ fontSize: '0.9rem', color: colors.textSecondary, fontStyle: 'italic' }}>&quot;{selectedPhotographer.myReview}&quot;</p>
              </div>
            )}

            {/* General Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedPhotographer.rating}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Rating</div>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedPhotographer.completedBookings}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Total Bookings</div>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedPhotographer.experience} yrs</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Experience</div>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedPhotographer.responseTime}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Response</div>
              </div>
            </div>

            {/* Portfolio Preview */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Portfolio</h3>
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
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>About</h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: '1.6' }}>{selectedPhotographer.bio}</p>
            </div>

            {/* Specializations */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>Specializations</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedPhotographer.specializations.map((spec) => (
                  <span
                    key={spec}
                    style={{
                      backgroundColor: actualTheme === 'dark' ? '#1E3A8A' : '#EFF6FF',
                      color: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8',
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
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={() => toggleFavorite(selectedPhotographer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: colors.bgTertiary,
                  color: colors.textPrimary,
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <HeartIcon filled={selectedPhotographer.isFavorite} />
              </button>
              {hasCompletedEvent(selectedPhotographer) && (
                <button
                  onClick={() => { setReviewPhotographer(selectedPhotographer); setReviewRating(selectedPhotographer.myRating || 5); setReviewText(selectedPhotographer.myReview || ''); setShowReviewModal(true); }}
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
                  <StarIcon filled={true} />
                  {selectedPhotographer.myReview ? 'Edit Review' : 'Leave Review'}
                </button>
              )}
              <button
                onClick={() => { setRebookPhotographer(selectedPhotographer); setSelectedRebookEventId(''); setRebookEventType(''); setRebookDate(''); setRebookTime(''); setRebookLocation(''); setRebookNotes(''); setShowRebookModal(true); setSelectedPhotographer(null); }}
                style={{
                  flex: 1,
                  backgroundColor: '#F20C8F',
                  color: 'white',
                  border: '2px solid #c00a72',
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
                Rebook - {formatPrice(selectedPhotographer.startingPrice)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: actualTheme === 'dark' ? '#831843' : '#FDF2F8', borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {rebookPhotographer.profileImage && (
                    <img src={rebookPhotographer.profileImage} alt={rebookPhotographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
                {rebookPhotographer.verified && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    background: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                  }}>
                    <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '0.75rem' }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: colors.textPrimary }}>{rebookPhotographer.firstName} {rebookPhotographer.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                  You&apos;ve booked {rebookPhotographer.totalBookingsWithClient} time{rebookPhotographer.totalBookingsWithClient > 1 ? 's' : ''} before
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Last booking</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>{rebookPhotographer.lastEventName}</div>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{rebookPhotographer.lastEventType} • {formatDate(rebookPhotographer.lastBookingDate)}</div>
            </div>

            {/* Assign to existing event */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Assign to Existing Event
              </label>
              <select
                value={selectedRebookEventId}
                onChange={(e) => handleRebookEventSelect(e.target.value)}
                disabled={rebookEventsLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${selectedRebookEventId ? '#F20C8F' : colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  cursor: rebookEventsLoading ? 'wait' : 'pointer'
                }}
              >
                <option value="">{rebookEventsLoading ? 'Loading events...' : '-- Select an event or fill manually --'}</option>
                {rebookEvents.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}{evt.eventDate ? ` — ${evt.eventDate}` : ''}
                  </option>
                ))}
              </select>
              {selectedRebookEventId && (
                <div style={{ fontSize: '0.8rem', color: '#F20C8F', marginTop: '0.375rem' }}>
                  Fields auto-filled from selected event. You can still edit them below.
                </div>
              )}
            </div>

            <div style={{ height: '1px', backgroundColor: colors.borderPrimary, margin: '0.75rem 0 1rem' }} />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Event Type
              </label>
              <input
                list="rebook-event-types"
                value={rebookEventType}
                onChange={(e) => setRebookEventType(e.target.value)}
                placeholder="Enter or select event type"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                }}
              />
              <datalist id="rebook-event-types">
                {rebookPhotographer.specializations.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={rebookDate}
                  onChange={(e) => setRebookDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={rebookTime}
                  onChange={(e) => setRebookTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Location
              </label>
              <input
                type="text"
                placeholder="Enter event location"
                value={rebookLocation}
                onChange={(e) => setRebookLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Additional Notes
              </label>
              <textarea
                placeholder="Any special requirements or details..."
                value={rebookNotes}
                onChange={(e) => setRebookNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '80px',
                  resize: 'vertical',
                  color: colors.textPrimary
                }}
              />
            </div>

            {rebookError && (
              <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', borderRadius: '0.375rem' }}>
                {rebookError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={() => { setShowRebookModal(false); setRebookError(null); }}
                disabled={isSubmittingRebook}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isSubmittingRebook ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingRebook ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendBookingRequest}
                disabled={isSubmittingRebook}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #c00a72',
                  borderRadius: '0.5rem',
                  background: '#F20C8F',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isSubmittingRebook ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingRebook ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckIcon />
                {isSubmittingRebook ? 'Sending...' : 'Send Booking Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedReviewEventId('');
          setReviewEvents([]);
          setReviewError(null);
        }}
        title={reviewPhotographer?.myReview ? 'Edit Your Review' : 'Leave a Review'}
      >
        {reviewPhotographer && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {reviewPhotographer.profileImage && (
                    <img src={reviewPhotographer.profileImage} alt={reviewPhotographer.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
                {reviewPhotographer.verified && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    background: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                  }}>
                    <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '0.75rem' }} />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: colors.textPrimary }}>{reviewPhotographer.firstName} {reviewPhotographer.lastName}</div>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{reviewPhotographer.lastEventName}</div>
              </div>
            </div>

            {/* Event Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Select Event *
              </label>
              {reviewEventsLoading ? (
                <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e5e7eb',
                    borderTopColor: '#083A85',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Loading completed events...
                </div>
              ) : reviewEvents.length === 0 ? (
                <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#9CA3AF', background: colors.bgTertiary, borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}` }}>
                  No completed events with this photographer
                </div>
              ) : (
                <select
                  value={selectedReviewEventId}
                  onChange={(e) => setSelectedReviewEventId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    background: colors.bgPrimary,
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Select an event --</option>
                  {reviewEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}{evt.eventDate ? ` (${new Date(evt.eventDate).toLocaleDateString()})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Review Error */}
            {reviewError && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '0.5rem',
                color: '#DC2626',
                fontSize: '0.85rem',
              }}>
                {reviewError}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience working with this photographer..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  minHeight: '120px',
                  resize: 'vertical',
                  color: colors.textPrimary
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReviewEventId('');
                  setReviewEvents([]);
                  setReviewError(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
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
                onClick={submitReview}
                disabled={isSubmittingReview || !selectedReviewEventId}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  background: isSubmittingReview || !selectedReviewEventId ? '#6B7280' : '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isSubmittingReview || !selectedReviewEventId ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingReview ? 0.7 : 1,
                }}
              >
                {isSubmittingReview ? 'Submitting...' : reviewPhotographer.myReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setReportReason(''); setReportDescription(''); }}
        title="Report Photographer"
      >
        {reportPhotographer && (
          <div>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1rem' }}>
              Report {reportPhotographer.firstName} {reportPhotographer.lastName} for:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {['Inappropriate content', 'Fake profile', 'Spam or scam', 'Unprofessional behavior', 'Other'].map((reason) => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: `2px solid ${reportReason === reason ? '#083A85' : colors.borderPrimary}`, borderRadius: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="report-reason" checked={reportReason === reason} onChange={() => setReportReason(reason)} style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{reason}</span>
                </label>
              ))}
            </div>
            <textarea
              placeholder="Additional details (optional)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: '1rem',
                color: colors.textPrimary
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '4rem' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '0.625rem 1.25rem',
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
                onClick={async () => {
                  if (!reportPhotographer || !reportReason) return;
                  setIsSubmittingReport(true);
                  try {
                    const apiUrl = getApiUrl();
                    const reportNs = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
                    const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${reportNs}/photographers/${reportPhotographer.id}/report`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: reportReason, description: reportDescription }),
                    });
                    if (!res.ok) throw new Error('Failed to submit report');
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDescription('');
                    setSuccessMessage('Report submitted successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    console.error('Failed to submit report:', err);
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                disabled={isSubmittingReport || !reportReason}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '2px solid #b91c1c',
                  borderRadius: '0.5rem',
                  background: isSubmittingReport || !reportReason ? '#9CA3AF' : '#DC2626',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isSubmittingReport || !reportReason ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingReport ? 0.7 : 1,
                }}
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      {paymentBooking && (() => {
        const payAmountDue = paymentBooking.booking.totalAmount - paymentBooking.booking.paidAmount;
        const payDonationValue = payDonationAmount === 'custom' ? (parseFloat(payCustomDonation) || 0) : (parseFloat(payDonationAmount) || 0);
        const payTotalAmount = payAmountDue + payDonationValue;
        const payDonationAddressed = payDonationSkipped || payDonationValue > 0;
        const payIsEnabled = payDonationAddressed;
        const payMethodMap: Record<string, { label: string; image: string }> = {
          card: { label: 'Credit/Debit Card', image: '/cards.png' },
          mtn: { label: 'MTN Mobile Money', image: '/mtn.png' },
          airtel: { label: 'Airtel Mobile Money', image: '/airtel.png' },
        };
        const handlePaySelectDonation = (amount: string) => {
          setPayDonationSkipped(false);
          if (amount === 'custom') { setPayDonationAmount('custom'); setPayShowCustomInput(true); }
          else { setPayDonationAmount(amount); setPayShowCustomInput(false); setPayCustomDonation(''); }
        };
        const handlePaySkipDonation = () => {
          setPayDonationSkipped(true); setPayDonationAmount(''); setPayCustomDonation(''); setPayShowCustomInput(false);
        };
        const handlePayClose = () => { setPayShowReceipt(false); setShowPaymentModal(false); };

        if (payShowReceipt) {
          const mi = payMethodMap[selectedPaymentMethod] || payMethodMap.card;
          return (
            <Modal isOpen={showPaymentModal} onClose={handlePayClose} title="Payment Summary" maxWidth="450px">
              <div>
                <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem', border: `2px solid ${colors.borderPrimary}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Photographer</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{paymentBooking.photographer.firstName} {paymentBooking.photographer.lastName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Event</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{paymentBooking.booking.eventName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Date</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{formatDate(paymentBooking.booking.eventDate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Package</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{paymentBooking.booking.packageName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Payment Method</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
                        {selectedPaymentMethod === 'card' ? (
                          <>
                            <Image src="/visa.png" alt="Visa" width={14} height={20} unoptimized style={{ objectFit: 'contain' }} />
                            <Image src="/master.png" alt="Mastercard" width={14} height={20} unoptimized style={{ objectFit: 'contain' }} />
                          </>
                        ) : (
                          <Image src={mi.image} alt={mi.label} width={24} height={24} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{mi.label}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>Amount Due</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(payAmountDue)}</span>
                  </div>
                  {payDonationValue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><DonateHeartIcon /><span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#F20C8F' }}>Donation</span></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F' }}>{formatPrice(payDonationValue)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: colors.textPrimary }}>Total</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(payTotalAmount)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button onClick={() => setPayShowReceipt(false)} style={{ flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={async () => {
                      if (isProcessingPayment) return;
                      setIsProcessingPayment(true);
                      try {
                        const apiUrl = getApiUrl();
                        const declId = paymentBooking.booking.declarationId || paymentBooking.booking.id;
                        const params = new URLSearchParams({
                          amount: payTotalAmount.toString(),
                          method: selectedPaymentMethod,
                        });
                        if (payDonationValue > 0) {
                          params.append('remarks', `Includes donation of ${payDonationValue}`);
                        }
                        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/payments/${declId}/pay?${params.toString()}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        if (!res.ok) throw new Error('Payment failed');
                        setShowPaymentModal(false);
                        setPayShowReceipt(false);
                        setSuccessMessage('Payment processed successfully');
                        setTimeout(() => setSuccessMessage(''), 3000);
                      } catch (err) {
                        console.error('Payment failed:', err);
                      } finally {
                        setIsProcessingPayment(false);
                      }
                    }}
                    disabled={isProcessingPayment}
                    style={{ flex: 1, padding: '0.75rem 1rem', border: paymentBooking.booking.paymentStatus === 'failed' ? '2px solid #c00a72' : '2px solid #062a63', borderRadius: '0.5rem', background: isProcessingPayment ? '#9CA3AF' : (paymentBooking.booking.paymentStatus === 'failed' ? '#F20C8F' : '#083A85'), color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: isProcessingPayment ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isProcessingPayment ? 0.7 : 1 }}>
                    {isProcessingPayment ? 'Processing...' : `${paymentBooking.booking.paymentStatus === 'failed' ? 'Retry' : 'Pay'} ${formatPrice(payTotalAmount)}`}
                  </button>
                </div>
              </div>
            </Modal>
          );
        }

        return (
          <Modal isOpen={showPaymentModal} onClose={handlePayClose} title={paymentBooking.booking.paymentStatus === 'failed' ? 'Retry Payment' : 'Complete Payment'} maxWidth="450px">
            <div>
              {paymentBooking.booking.paymentStatus === 'failed' && (
                <div style={{ backgroundColor: actualTheme === 'dark' ? '#450A0A' : '#FEE2E2', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircleIcon />
                  <span style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' }}>Previous payment attempt failed. Please try again with a different payment method.</span>
                </div>
              )}

              {/* Payment Method Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Select Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { id: 'card', label: 'Credit/Debit Card', description: 'Pay with Visa, Mastercard, etc.', image: '/cards.png' },
                    { id: 'mtn', label: 'MTN Mobile Money', description: 'Pay via MTN MoMo', image: '/mtn.png' },
                    { id: 'airtel', label: 'Airtel Mobile Money', description: 'Pay via Airtel Money', image: '/airtel.png' },
                  ].map((method) => (
                    <div key={method.id} onClick={() => setSelectedPaymentMethod(method.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                      border: selectedPaymentMethod === method.id ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.75rem', cursor: 'pointer',
                      backgroundColor: selectedPaymentMethod === method.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard, transition: 'all 0.2s'
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        {method.id === 'card' ? (
                          <>
                            <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                            <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                          </>
                        ) : (
                          <Image src={method.image} alt={method.label} width={48} height={48} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>{method.label}</div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{method.description}</div>
                      </div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selectedPaymentMethod === method.id ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.86rem', color: colors.textSecondary, margin: '0.75rem 0 0 0', textAlign: 'center' }}>
                  <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
                  Manage your payment methods in <span onClick={() => router.push(`/user/${userRole === 'event-coordinator' ? 'event-coordinator' : 'client'}/preferences?tab=payments`)} style={{ color: colors.brandPrimary, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}>Preferences → Payment Accounts</span>
                </p>
              </div>

              {/* Donation Section */}
              <div style={{
                marginBottom: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
                border: `2px solid ${payDonationSkipped ? colors.borderPrimary : (payDonationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.3)')}`,
                background: actualTheme === 'dark' ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)' : 'linear-gradient(135deg, rgba(242, 12, 143, 0.05) 0%, rgba(255, 107, 157, 0.02) 100%)',
                transition: 'all 0.2s'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DonateHeartIcon />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Support a Cause</span>
                    <span style={{ fontSize: '0.81rem', color: colors.textSecondary, marginLeft: 'auto' }}>Optional</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '0.35rem 0 0 0', lineHeight: '1.4' }}>
                    Add a small donation to help fund community projects and initiatives
                  </p>
                </div>
                {!payDonationSkipped && (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {['5', '10', '25', '50'].map((amount) => (
                        <button key={amount} onClick={() => handlePaySelectDonation(amount)} style={{
                          padding: '0.4rem 0.75rem', border: payDonationAmount === amount ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem', background: payDonationAmount === amount ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                          color: payDonationAmount === amount ? '#F20C8F' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0'
                        }}>{formatPrice(parseFloat(amount))}</button>
                      ))}
                      <button onClick={() => handlePaySelectDonation('custom')} style={{
                        padding: '0.4rem 0.75rem', border: payDonationAmount === 'custom' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem', background: payDonationAmount === 'custom' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                        color: payDonationAmount === 'custom' ? '#F20C8F' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0'
                      }}>Custom</button>
                    </div>
                    {payShowCustomInput && (
                      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary }}>$</span>
                        <input type="number" placeholder="Enter amount" value={payCustomDonation} onChange={(e) => setPayCustomDonation(e.target.value)} style={{
                          width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem', border: `2px solid ${payCustomDonation ? '#F20C8F' : colors.borderPrimary}`,
                          borderRadius: '0.5rem', fontSize: '0.85rem', color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = payCustomDonation ? '#F20C8F' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }} />
                      </div>
                    )}
                  </>
                )}
                <button onClick={handlePaySkipDonation} style={{
                  width: '100%', padding: '0.5rem 1rem', borderRadius: '9999px',
                  border: payDonationSkipped ? '2px solid #F20C8F' : '2px solid #6B7280',
                  background: payDonationSkipped ? '#F20C8F' : colors.bgTertiary,
                  color: payDonationSkipped ? 'white' : '#374151',
                  fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                }}>{payDonationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}</button>
                <div style={{ marginTop: '0.5rem' }}>
                  <a href={`${process.env.NEXT_PUBLIC_LANDING_URL || 'https://connekyt.com'}/user/donations`} onClick={(e) => { e.preventDefault(); router.push('/user/donations'); }} style={{ fontSize: '0.81rem', color: '#F20C8F', textDecoration: 'none', fontWeight: '500' }}>Learn more about our donation program →</a>
                </div>
              </div>

              {!payDonationAddressed && (
                <p style={{ fontSize: '0.86rem', color: '#EF4444', margin: '0 0 0.75rem 0', textAlign: 'center' }}>Please select a donation amount or skip to continue</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button onClick={handlePayClose} style={{ flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button disabled={!payIsEnabled} onClick={() => setPayShowReceipt(true)} style={{
                  flex: 1, padding: '0.75rem 1rem', border: !payIsEnabled ? '2px solid #9CA3AF' : '2px solid #062a63',
                  borderRadius: '0.5rem', background: !payIsEnabled ? '#9CA3AF' : '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600',
                  cursor: !payIsEnabled ? 'not-allowed' : 'pointer', opacity: !payIsEnabled ? 0.7 : 1, transition: 'all 0.2s'
                }}>Proceed to Payment</button>
              </div>
            </div>
          </Modal>
        );
      })()}


      {/* Tip Prompt Modal */}
      <Modal
        isOpen={showTipPromptModal}
        onClose={() => {
          setShowTipPromptModal(false);
          setSuccessMessage('Review submitted successfully!');
          setShowSuccessModal(true);
          setPendingReviewPhotographer(null);
        }}
        title=""
        maxWidth="400px"
      >
        {pendingReviewPhotographer && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: actualTheme === 'dark' ? '#60A5FA' : '#083A85'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
              Would you like to leave a tip for {pendingReviewPhotographer.firstName}?
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
              Show your appreciation for their great work!
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '4rem' }}>
              <button
                onClick={handleTipPromptNo}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                No
              </button>
              <button
                onClick={handleTipPromptYes}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  background: '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Tip Selection Modal */}
      <Modal
        isOpen={showTipSelectionModal}
        onClose={() => {
          setShowTipSelectionModal(false);
          setTipAmount('');
          setCustomTipAmount('');
          setSuccessMessage('Review submitted successfully!');
          setShowSuccessModal(true);
          setPendingReviewPhotographer(null);
        }}
        title={`Tip for ${pendingReviewPhotographer?.firstName || ''}`}
        maxWidth="400px"
      >
        {pendingReviewPhotographer && (
          <div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1rem' }}>
              Select a tip amount to show your appreciation
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[5, 10, 20, 50].map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setTipAmount(amount); setCustomTipAmount(''); }}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: tipAmount === amount ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                    backgroundColor: tipAmount === amount ? (actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE') : colors.bgCard,
                    color: tipAmount === amount ? (actualTheme === 'dark' ? '#F9FAFB' : '#083A85') : colors.textPrimary,
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {formatPrice(amount)}
                </button>
              ))}
              <button
                onClick={() => { setTipAmount('custom'); }}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: tipAmount === 'custom' ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                  backgroundColor: tipAmount === 'custom' ? (actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE') : colors.bgCard,
                  color: tipAmount === 'custom' ? (actualTheme === 'dark' ? '#F9FAFB' : '#083A85') : colors.textPrimary,
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Custom
              </button>
            </div>
            {tipAmount === 'custom' && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.textSecondary,
                    fontWeight: '500',
                    fontSize: '1rem'
                  }}>$</span>
                  <input
                    type="number"
                    value={customTipAmount}
                    onChange={(e) => setCustomTipAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 1.75rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      color: colors.textPrimary,
                      backgroundColor: colors.bgCard,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', marginBottom: '4rem' }}>
              <button
                onClick={() => {
                  setShowTipSelectionModal(false);
                  setTipAmount('');
                  setCustomTipAmount('');
                  setSuccessMessage('Review submitted successfully!');
                  setShowSuccessModal(true);
                  setPendingReviewPhotographer(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
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
                onClick={handleSendTip}
                disabled={!tipAmount || (tipAmount === 'custom' && (!customTipAmount || parseFloat(customTipAmount) <= 0))}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  background: (!tipAmount || (tipAmount === 'custom' && (!customTipAmount || parseFloat(customTipAmount) <= 0))) ? '#9CA3AF' : '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: (!tipAmount || (tipAmount === 'custom' && (!customTipAmount || parseFloat(customTipAmount) <= 0))) ? 'not-allowed' : 'pointer'
                }}
              >
                Send Tip
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Tip Payment Modal */}
      {pendingReviewPhotographer && (() => {
        const tipAmountNum = tipAmount === 'custom' ? (parseFloat(customTipAmount) || 0) : (parseFloat(String(tipAmount)) || 0);
        const tipDonationValue = tipDonationAmount === 'custom' ? (parseFloat(tipCustomDonation) || 0) : (parseFloat(tipDonationAmount) || 0);
        const tipTotalAmount = tipAmountNum + tipDonationValue;
        const tipDonationAddressed = tipDonationSkipped || tipDonationValue > 0;
        const tipIsEnabled = tipDonationAddressed;
        const tipMethodMap: Record<string, { label: string; image: string }> = {
          card: { label: 'Credit/Debit Card', image: '/cards.png' },
          mtn: { label: 'MTN Mobile Money', image: '/mtn.png' },
          airtel: { label: 'Airtel Mobile Money', image: '/airtel.png' },
        };
        const handleTipSelectDonation = (amount: string) => {
          setTipDonationSkipped(false);
          if (amount === 'custom') { setTipDonationAmount('custom'); setTipShowCustomInput(true); }
          else { setTipDonationAmount(amount); setTipShowCustomInput(false); setTipCustomDonation(''); }
        };
        const handleTipSkipDonation = () => {
          setTipDonationSkipped(true); setTipDonationAmount(''); setTipCustomDonation(''); setTipShowCustomInput(false);
        };
        const handleTipClose = () => {
          setTipShowReceipt(false); setShowTipPaymentModal(false); setTipAmount(''); setCustomTipAmount('');
          setSelectedTipPaymentMethod('card'); setSuccessMessage('Review submitted successfully!');
          setShowSuccessModal(true); setPendingReviewPhotographer(null);
        };

        if (tipShowReceipt) {
          const mi = tipMethodMap[selectedTipPaymentMethod] || tipMethodMap.card;
          return (
            <Modal isOpen={showTipPaymentModal} onClose={handleTipClose} title="Payment Summary" maxWidth="450px">
              <div>
                <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem', border: `2px solid ${colors.borderPrimary}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Photographer</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{pendingReviewPhotographer.firstName} {pendingReviewPhotographer.lastName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Type</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>Tip for great service</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Payment Method</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
                        {selectedTipPaymentMethod === 'card' ? (
                          <>
                            <Image src="/visa.png" alt="Visa" width={14} height={20} unoptimized style={{ objectFit: 'contain' }} />
                            <Image src="/master.png" alt="Mastercard" width={14} height={20} unoptimized style={{ objectFit: 'contain' }} />
                          </>
                        ) : (
                          <Image src={mi.image} alt={mi.label} width={24} height={24} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{mi.label}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>Tip Amount</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(tipAmountNum)}</span>
                  </div>
                  {tipDonationValue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><DonateHeartIcon /><span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#F20C8F' }}>Donation</span></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F' }}>{formatPrice(tipDonationValue)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: colors.textPrimary }}>Total</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(tipTotalAmount)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button onClick={() => setTipShowReceipt(false)} style={{ flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleTipPaymentComplete} style={{ flex: 1, padding: '0.75rem 1rem', border: '2px solid #062a63', borderRadius: '0.5rem', background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Pay {formatPrice(tipTotalAmount)}
                  </button>
                </div>
              </div>
            </Modal>
          );
        }

        return (
          <Modal isOpen={showTipPaymentModal} onClose={handleTipClose} title="Complete Tip Payment" maxWidth="450px">
            <div>
              {/* Payment Method Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Select Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { id: 'card', label: 'Credit/Debit Card', description: 'Pay with Visa, Mastercard, etc.', image: '/cards.png' },
                    { id: 'mtn', label: 'MTN Mobile Money', description: 'Pay via MTN MoMo', image: '/mtn.png' },
                    { id: 'airtel', label: 'Airtel Mobile Money', description: 'Pay via Airtel Money', image: '/airtel.png' },
                  ].map((method) => (
                    <div key={method.id} onClick={() => setSelectedTipPaymentMethod(method.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                      border: selectedTipPaymentMethod === method.id ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.75rem', cursor: 'pointer',
                      backgroundColor: selectedTipPaymentMethod === method.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard, transition: 'all 0.2s'
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        {method.id === 'card' ? (
                          <>
                            <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                            <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                          </>
                        ) : (
                          <Image src={method.image} alt={method.label} width={48} height={48} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>{method.label}</div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{method.description}</div>
                      </div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selectedTipPaymentMethod === method.id ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.86rem', color: colors.textSecondary, margin: '0.75rem 0 0 0', textAlign: 'center' }}>
                  <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
                  Manage your payment methods in <span onClick={() => router.push(`/user/${userRole === 'event-coordinator' ? 'event-coordinator' : 'client'}/preferences?tab=payments`)} style={{ color: colors.brandPrimary, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}>Preferences → Payment Accounts</span>
                </p>
              </div>

              {/* Donation Section */}
              <div style={{
                marginBottom: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
                border: `2px solid ${tipDonationSkipped ? colors.borderPrimary : (tipDonationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.3)')}`,
                background: actualTheme === 'dark' ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)' : 'linear-gradient(135deg, rgba(242, 12, 143, 0.05) 0%, rgba(255, 107, 157, 0.02) 100%)',
                transition: 'all 0.2s'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DonateHeartIcon />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Support a Cause</span>
                    <span style={{ fontSize: '0.81rem', color: colors.textSecondary, marginLeft: 'auto' }}>Optional</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '0.35rem 0 0 0', lineHeight: '1.4' }}>
                    Add a small donation to help fund community projects and initiatives
                  </p>
                </div>
                {!tipDonationSkipped && (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {['5', '10', '25', '50'].map((amount) => (
                        <button key={amount} onClick={() => handleTipSelectDonation(amount)} style={{
                          padding: '0.4rem 0.75rem', border: tipDonationAmount === amount ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem', background: tipDonationAmount === amount ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                          color: tipDonationAmount === amount ? '#F20C8F' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0'
                        }}>{formatPrice(parseFloat(amount))}</button>
                      ))}
                      <button onClick={() => handleTipSelectDonation('custom')} style={{
                        padding: '0.4rem 0.75rem', border: tipDonationAmount === 'custom' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem', background: tipDonationAmount === 'custom' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                        color: tipDonationAmount === 'custom' ? '#F20C8F' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0'
                      }}>Custom</button>
                    </div>
                    {tipShowCustomInput && (
                      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary }}>$</span>
                        <input type="number" placeholder="Enter amount" value={tipCustomDonation} onChange={(e) => setTipCustomDonation(e.target.value)} style={{
                          width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem', border: `2px solid ${tipCustomDonation ? '#F20C8F' : colors.borderPrimary}`,
                          borderRadius: '0.5rem', fontSize: '0.85rem', color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = tipCustomDonation ? '#F20C8F' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }} />
                      </div>
                    )}
                  </>
                )}
                <button onClick={handleTipSkipDonation} style={{
                  width: '100%', padding: '0.5rem 1rem', borderRadius: '9999px',
                  border: tipDonationSkipped ? '2px solid #F20C8F' : '2px solid #6B7280',
                  background: tipDonationSkipped ? '#F20C8F' : colors.bgTertiary,
                  color: tipDonationSkipped ? 'white' : '#374151',
                  fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                }}>{tipDonationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}</button>
                <div style={{ marginTop: '0.5rem' }}>
                  <a href={`${process.env.NEXT_PUBLIC_LANDING_URL || 'https://connekyt.com'}/user/donations`} onClick={(e) => { e.preventDefault(); router.push('/user/donations'); }} style={{ fontSize: '0.81rem', color: '#F20C8F', textDecoration: 'none', fontWeight: '500' }}>Learn more about our donation program →</a>
                </div>
              </div>

              {!tipDonationAddressed && (
                <p style={{ fontSize: '0.86rem', color: '#EF4444', margin: '0 0 0.75rem 0', textAlign: 'center' }}>Please select a donation amount or skip to continue</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button onClick={handleTipClose} style={{ flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button disabled={!tipIsEnabled} onClick={() => setTipShowReceipt(true)} style={{
                  flex: 1, padding: '0.75rem 1rem', border: !tipIsEnabled ? '2px solid #9CA3AF' : '2px solid #062a63',
                  borderRadius: '0.5rem', background: !tipIsEnabled ? '#9CA3AF' : '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600',
                  cursor: !tipIsEnabled ? 'not-allowed' : 'pointer', opacity: !tipIsEnabled ? 0.7 : 1, transition: 'all 0.2s'
                }}>Proceed to Payment</button>
              </div>
            </div>
          </Modal>
        );
      })()}


      {/* Invite Photographer Modal */}
      {showInviteModal && userRole === 'event-coordinator' && (
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
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Invite Photographer</h2>
                <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>Send an invite via email or share the link</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Email Invite */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  placeholder="photographer@example.com"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInvitePhotographer(); }}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: `2px solid ${inviteError ? '#EF4444' : colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleInvitePhotographer}
                  disabled={isSendingInvite || !inviteEmail.trim()}
                  style={{
                    padding: '0.625rem 1rem',
                    border: '2px solid #c00a72',
                    borderRadius: '0.5rem',
                    background: (!inviteEmail.trim() || isSendingInvite) ? '#9CA3AF' : '#F20C8F',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: (!inviteEmail.trim() || isSendingInvite) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  <MessageIcon />
                  {isSendingInvite ? 'Sending...' : 'Send'}
                </button>
              </div>
              {inviteError && (
                <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.375rem' }}>
                  {inviteError}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: colors.borderPrimary }} />
              <span style={{ fontSize: '0.8rem', color: colors.textSecondary, fontWeight: '500' }}>or share invite link</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: colors.borderPrimary }} />
            </div>

            {/* Invite Link */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Invite Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary
                  }}
                />
                <button
                  onClick={handleCopyInviteLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    border: inviteCopied ? '2px solid #059669' : '2px solid #062a63',
                    borderRadius: '0.5rem',
                    background: inviteCopied ? '#10B981' : '#083A85',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <CopyIcon />
                  {inviteCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title=""
        maxWidth="350px"
      >
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            {successMessage}
          </h3>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
            Thank you for your feedback!
          </p>
          <button
            onClick={handleSuccessClose}
            style={{
              padding: '0.75rem 2rem',
              border: '2px solid #062a63',
              borderRadius: '0.5rem',
              background: '#083A85',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '4rem'
            }}
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BookedPhotographersPage;
