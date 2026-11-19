'use client';

// app/pages/client/photographers.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { HeartIcon as DonateHeartIcon } from '@/app/components/UnlockModal';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { initiateBookingPayment, pollPaymentStatus, getTelecomProvider, getPaymentMethodType } from '@/lib/xentripay';
import { PaymentMethodPicker, type PaymentMethodSelection } from '@/app/components/payments/PaymentMethodPicker';
import { usePaymentCountry } from '@/lib/payments/usePaymentCountry';
import InternationalPhoneInput, { type PhoneValue } from '@/app/components/phone/InternationalPhoneInput';
import { iconForOperator } from '@/lib/payments/operatorIcons';
import type { PaymentOperator } from '@/lib/payments/types';
import SortDropdown from '@/app/components/SortDropdown';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'partially_paid';

export interface Booking {
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

export interface BookedPhotographer {
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


/** Shared with the classic page, which imports it from here. */
export const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FBBF24' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface PhotographersPageProps {
  userRole?: 'client' | 'event-coordinator';
}

export function useBookedPhotographers({ userRole = 'client' }: PhotographersPageProps) {
  const { colors, actualTheme } = useTheme();
  const { formatPrice, currencyId } = useCurrency();
  const { user } = useDashboardAuth();
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
  const [rebookPackages, setRebookPackages] = useState<any[]>([]);
  const [rebookPackageId, setRebookPackageId] = useState<string>('');
  const [rebookPackagesLoading, setRebookPackagesLoading] = useState(false);
  const [rebookPackagesError, setRebookPackagesError] = useState<string | null>(null);
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
  const [selectedTipOperator, setSelectedTipOperator] = useState<PaymentOperator | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<{ photographer: BookedPhotographer; booking: Booking } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  // Multi-country PawaPay: detected/overridable country + selected operator
  // object (for receipt logo/name). Shared by both payment flows below.
  const { country: payCountry, setCountry: setPayCountry } = usePaymentCountry();
  const [selectedOperator, setSelectedOperator] = useState<PaymentOperator | null>(null);
  // Donation states for payment modal
  const [payDonationAmount, setPayDonationAmount] = useState<string>('');
  const [payCustomDonation, setPayCustomDonation] = useState<string>('');
  const [payDonationSkipped, setPayDonationSkipped] = useState<boolean>(false);
  const [payShowCustomInput, setPayShowCustomInput] = useState<boolean>(false);
  const [payShowReceipt, setPayShowReceipt] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // XentriPay states
  const [paymentPhone, setPaymentPhone] = useState<PhoneValue | null>(null);
  const [xentriPayStep, setXentriPayStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [xentriPayError, setXentriPayError] = useState<string>('');
  const stopPollingRef = React.useRef<(() => void) | null>(null);
  // Donation states for tip payment modal
  const [tipDonationAmount, setTipDonationAmount] = useState<string>('');
  const [tipCustomDonation, setTipCustomDonation] = useState<string>('');
  const [tipDonationSkipped, setTipDonationSkipped] = useState<boolean>(false);
  const [tipShowCustomInput, setTipShowCustomInput] = useState<boolean>(false);
  const [tipShowReceipt, setTipShowReceipt] = useState<boolean>(false);

  const [photographers, setPhotographers] = useState<BookedPhotographer[]>([]);

  const specializations = ['Weddings', 'Events', 'Portraits', 'Birthdays', 'Corporate', 'Fashion', 'Festivals', 'Concerts'];

  // Glass view only: first answer received, last load failed, and a key that reruns the load (Try again).
  const [photographersLoaded, setPhotographersLoaded] = useState(false);
  const [photographersError, setPhotographersError] = useState(false);
  const [photographersReload, setPhotographersReload] = useState(0);
  const retryPhotographers = () => setPhotographersReload((n) => n + 1);

  // Fetch booked photographers from API
  useEffect(() => {
    // Cookie-only sessions have no JS-readable token. dashboardAuthFetch
    // sends the HttpOnly cookie regardless, so gate only on user id.
    if (!user?.id) return;

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
        const bookmarkedIds = new Set<string>();
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
          profileImage: normalizeImageUrl(p.profileImage || p.profilePicture || undefined),
          coverImage: normalizeImageUrl(p.coverImage || p.coverPicture || '') || '',
          portfolioImages: (p.portfolioImages || (p.projects || []).map((proj: any) => proj.imageUrl || '')).map((url: string) => normalizeImageUrl(url) || ''),
          bio: p.bio || p.about || '',
          specializations: p.specializations || (p.specialties || []).map((s: any) => typeof s === 'string' ? s : s.name || ''),
          experience: p.experience || 0,
          location: p.location || (p.address ? { city: p.address, country: '' } : { city: '', country: '' }),
          rating: Number(p.rating) || 0, // unrated shows as New, not an invented 5.0
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
        setPhotographersError(false);
        setPhotographersLoaded(true);
      } catch (err) {
        console.error('Failed to fetch photographers:', err);
        setPhotographersError(true);
        setPhotographersLoaded(true);
      }
    };

    fetchPhotographers();
  }, [user?.id, photographersReload]);

  // Fetch completed events when review modal opens. dashboardAuthFetch
  // authenticates via the HttpOnly cookie; the context token is always null,
  // so gating on it meant this list never loaded (CONN-AUTH-10).
  useEffect(() => {
    if (!showReviewModal || !reviewPhotographer) return;

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
  }, [showReviewModal, reviewPhotographer]);

  // Fetch existing events when rebook modal opens
  useEffect(() => {
    if (!showRebookModal) return;

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
  }, [showRebookModal]);

  // Fetch photographer packages when rebook modal opens
  useEffect(() => {
    if (!showRebookModal || !rebookPhotographer) return;

    const fetchPackages = async () => {
      setRebookPackagesLoading(true);
      setRebookPackagesError(null);
      try {
        const apiUrl = getApiUrl();
        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/public/photographers/${rebookPhotographer.id}/packages`);
        if (!response.ok) throw new Error('Failed to fetch packages');
        const result = await response.json();
        const pkgs = result?.data || result || [];
        setRebookPackages(Array.isArray(pkgs) ? pkgs : []);
      } catch (err) {
        console.error('Failed to fetch photographer packages:', err);
        setRebookPackagesError('Could not load packages');
        setRebookPackages([]);
      } finally {
        setRebookPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [showRebookModal, rebookPhotographer]);

  const handleRebookEventSelect = (eventId: string) => {
    setSelectedRebookEventId(eventId);
    if (!eventId) {
      // Cleared selection. reset fields
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
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

      // The tip step is off. Its "payment" screen never charged anything: it only
      // called record-tip, which the backend used to accept and book as a paid tip
      // for the photographer, and now refuses. A tip must go through a real
      // gateway checkout before this prompt comes back.
      setSuccessMessage('Review submitted successfully!');
      setShowSuccessModal(true);
      setPendingReviewPhotographer(null);
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
          const tipDonationValue = tipDonationAmount === 'custom' ? (parseFloat(tipCustomDonation) || 0) : (parseFloat(tipDonationAmount) || 0);
          const params = new URLSearchParams({
            recipientId: pendingReviewPhotographer.id,
            eventId,
            amount: finalTipAmount.toString(),
            ...(currencyId ? { currencyId } : {}),
            ...(tipDonationValue > 0 ? { donationAmount: tipDonationValue.toString() } : {}),
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
      if (tipRecorded) {
        setSuccessMessage('Review and tip submitted successfully!');
      } else if (finalTipAmount > 0) {
        setSuccessMessage('Review submitted, but the tip could not be processed. Please try tipping from the photographer\'s profile.');
      } else {
        setSuccessMessage('Review submitted successfully!');
      }
      setShowSuccessModal(true);
      setPendingReviewPhotographer(null);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  // Auto-submit rebook when package is selected and all required fields are filled
  useEffect(() => {
    if (rebookPackageId && !isSubmittingRebook && (
      selectedRebookEventId || (rebookEventType && rebookDate && rebookTime && rebookLocation)
    )) {
      const timer = setTimeout(() => {
        handleSendBookingRequest();
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebookPackageId]);

  // --- Send rebook request (both client and coordinator) ---
  const handleSendBookingRequest = async () => {
    if (!rebookPhotographer) return;

    if (!rebookPackageId) {
      setRebookError('Please select a photographer package');
      return;
    }

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
          packageId: rebookPackageId,
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
      setRebookPackages([]);
      setRebookPackageId('');
      setRebookPackagesError(null);

      setSuccessMessage('Booking request sent successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Rebook error:', err);
      setRebookError(err instanceof Error ? err.message : 'Failed to send booking request');
    } finally {
      setIsSubmittingRebook(false);
    }
  };

  // --- Invite photographer by email (coordinator + client) ---
  const inviteLink = `${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/auth/signup?userType=Photographer&invitedBy=${user?.id || ''}`;

  const handleInvitePhotographer = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setIsSendingInvite(true);
    setInviteError(null);

    try {
      const apiUrl = getApiUrl();
      const rolePrefix = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/${rolePrefix}/photographers/invite?email=${encodeURIComponent(inviteEmail.trim())}`,
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


  return {
    photographersLoaded,
    photographersError,
    retryPhotographers,
    colors,
    actualTheme,
    formatPrice,
    currencyId,
    user,
    router,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedSpecialization,
    setSelectedSpecialization,
    showFilters,
    setShowFilters,
    selectedPhotographer,
    setSelectedPhotographer,
    showReportModal,
    setShowReportModal,
    reportPhotographer,
    setReportPhotographer,
    reportReason,
    setReportReason,
    reportDescription,
    setReportDescription,
    isSubmittingReport,
    setIsSubmittingReport,
    showRebookModal,
    setShowRebookModal,
    rebookPhotographer,
    setRebookPhotographer,
    rebookEventType,
    setRebookEventType,
    rebookDate,
    setRebookDate,
    rebookTime,
    setRebookTime,
    rebookLocation,
    setRebookLocation,
    rebookNotes,
    setRebookNotes,
    isSubmittingRebook,
    setIsSubmittingRebook,
    rebookError,
    setRebookError,
    rebookEvents,
    setRebookEvents,
    rebookEventsLoading,
    setRebookEventsLoading,
    selectedRebookEventId,
    setSelectedRebookEventId,
    rebookPackages,
    setRebookPackages,
    rebookPackageId,
    setRebookPackageId,
    rebookPackagesLoading,
    setRebookPackagesLoading,
    rebookPackagesError,
    setRebookPackagesError,
    showReviewModal,
    setShowReviewModal,
    reviewPhotographer,
    setReviewPhotographer,
    contextMenu,
    setContextMenu,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    activeTab,
    setActiveTab,
    reviewRating,
    setReviewRating,
    reviewText,
    setReviewText,
    reviewEvents,
    setReviewEvents,
    selectedReviewEventId,
    setSelectedReviewEventId,
    reviewEventsLoading,
    setReviewEventsLoading,
    isSubmittingReview,
    setIsSubmittingReview,
    reviewError,
    setReviewError,
    tipAmount,
    setTipAmount,
    customTipAmount,
    setCustomTipAmount,
    showPaymentModal,
    setShowPaymentModal,
    showTipPromptModal,
    setShowTipPromptModal,
    showTipSelectionModal,
    setShowTipSelectionModal,
    showTipPaymentModal,
    setShowTipPaymentModal,
    showSuccessModal,
    setShowSuccessModal,
    successMessage,
    setSuccessMessage,
    showInviteModal,
    setShowInviteModal,
    inviteEmail,
    setInviteEmail,
    inviteError,
    setInviteError,
    isSendingInvite,
    setIsSendingInvite,
    inviteCopied,
    setInviteCopied,
    pendingReviewPhotographer,
    setPendingReviewPhotographer,
    selectedTipPaymentMethod,
    setSelectedTipPaymentMethod,
    selectedTipOperator,
    setSelectedTipOperator,
    paymentBooking,
    setPaymentBooking,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    payCountry,
    setPayCountry,
    selectedOperator,
    setSelectedOperator,
    payDonationAmount,
    setPayDonationAmount,
    payCustomDonation,
    setPayCustomDonation,
    payDonationSkipped,
    setPayDonationSkipped,
    payShowCustomInput,
    setPayShowCustomInput,
    payShowReceipt,
    setPayShowReceipt,
    isProcessingPayment,
    setIsProcessingPayment,
    paymentPhone,
    setPaymentPhone,
    xentriPayStep,
    setXentriPayStep,
    xentriPayError,
    setXentriPayError,
    stopPollingRef,
    tipDonationAmount,
    setTipDonationAmount,
    tipCustomDonation,
    setTipCustomDonation,
    tipDonationSkipped,
    setTipDonationSkipped,
    tipShowCustomInput,
    setTipShowCustomInput,
    tipShowReceipt,
    setTipShowReceipt,
    photographers,
    setPhotographers,
    specializations,
    handleRebookEventSelect,
    toggleFavorite,
    handleContextMenu,
    formatDate,
    getPaymentStatusColor,
    photographersWithPendingPayments,
    totalPendingAmount,
    filteredPhotographers,
    renderStars,
    submitReview,
    handleTipPromptYes,
    handleTipPromptNo,
    handleSendTip,
    handleTipPaymentComplete,
    handleSuccessClose,
    handleSendBookingRequest,
    inviteLink,
    handleInvitePhotographer,
    handleCopyInviteLink,
    hasCompletedEvent,
    userRole,
  };
}

export type BookedPhotographersController = ReturnType<typeof useBookedPhotographers>;
