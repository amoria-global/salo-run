"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import EventConfirmModal from '../../components/EventConfirmModal';
import { platformAlert } from '../../components/PlatformAlert';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import PayNowModal from '@/app/components/UnlockModal';
import type { Payment } from '@/app/components/UnlockModal';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';
import CandidatesShortlistModal from '@/app/components/hybrid/CandidatesShortlistModal';
import { convertToHybrid } from '@/app/lib/hybridBooking';

// ── Icons ────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CheckCircleIcon = ({ size = 20, color = '#10B981' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const PackageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 9.4L7.5 4.21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 16V8C20.9996 7.6493 20.9071 7.30483 20.7315 7.00017C20.556 6.69552 20.3037 6.44177 20 6.264L13 2.264C12.696 2.08623 12.3511 1.99316 12 1.99316C11.6489 1.99316 11.304 2.08623 11 2.264L4 6.264C3.69626 6.44177 3.44398 6.69552 3.26846 7.00017C3.09294 7.30483 3.00036 7.6493 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9998C3.44398 17.3045 3.69626 17.5582 4 17.736L11 21.736C11.304 21.9138 11.6489 22.0068 12 22.0068C12.3511 22.0068 12.696 21.9138 13 21.736L20 17.736C20.3037 17.5582 20.556 17.3045 20.7315 16.9998C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.27 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

// ── Types ────────────────────────────────────────────────────────────────────

interface EventData {
  id: string;
  title: string;
  description: string;
  eventType: string;
  category: string;
  status: string;
  date: string;
  time: string;
  endTime: string;
  duration: string;
  venueName: string;
  address: string;
  city: string;
  country: string;
  maxGuests: number;
  organizer: string;
  tags: string[];
  bannerImage: string | null;
  photographerId: string | null;
  photographerName: string | null;
  photographerImage: string | null;
  packageId: string | null;
  packageName: string | null;
  packagePrice: number | null;
  packageCurrencySymbol?: string;
  packageCurrencyAbbreviation?: string;
  packageDurationHours?: number;
  packageIncludedPhotos?: number;
  packageIncludedVideos?: number;
  packageDescription?: string;
  bookingStatus: string | null;
  bookingId: string | null;
  completionStatus: string | null;
  createdAt: string;
  eventVisibility: string;
  hasLiveStream: boolean;
  bookingProgress: ProgressStage[];
  eventStatus?: string | null;
  eventDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ProgressStage {
  key: string;
  label: string;
  done: boolean;
}

interface PaymentData {
  id: string;
  eventId: string;
  eventTitle: string;
  photographerName: string;
  photographerImage: string | null;
  amount: number;
  amountInUsd: number;
  paidAmount: number;
  paidAmountInUsd: number;
  status: string;
  escrowStatus: string;
  escrowPercentage: number | null;
  heldAmount: number;
  releasedAmount: number;
  heldAmountInUsd: number;
  releasedAmountInUsd: number;
  eventCompletionStatus: string;
  paymentType: string;
  createdAt: string;
  currencyAbbreviation: string;
}

interface EventDetailPageProps {
  userRole: 'client' | 'photographer' | 'event-coordinator';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '-';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'CONFIRMED':
    case 'PAID':
      return '#10B981';
    case 'UPCOMING':
    case 'ACTIVE':
    case 'LIVE':
      return '#3B82F6';
    case 'PENDING':
    case 'PARTIAL':
    case 'PARTIALLY_PAID':
      return '#F59E0B';
    case 'AWAITING_REVIEW':
      return '#D97706';
    case 'CANCELLED':
    case 'FAILED':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'Completed';
    case 'CONFIRMED': return 'Confirmed';
    case 'PAID': return 'Paid';
    case 'UPCOMING': return 'Upcoming';
    case 'ACTIVE': return 'Active';
    case 'LIVE': return 'Live';
    case 'PENDING': return 'Pending';
    case 'PARTIAL': return 'Partially Paid';
    case 'PARTIALLY_PAID': return 'Partially Paid';
    case 'AWAITING_REVIEW': return 'Awaiting Review';
    case 'CANCELLED': return 'Cancelled';
    case 'FAILED': return 'Failed';
    default: return status || 'Unknown';
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'Paid';
    case 'PENDING': return 'Pending';
    case 'PARTIAL': return 'Partially Paid';
    case 'FAILED': return 'Failed';
    case 'REFUNDED': return 'Refunded';
    default: return status || 'Unknown';
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function EventDetailPage({ userRole }: EventDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { token } = useDashboardAuth();

  const eventId = params?.id as string;
  // If arrived here from a "Go to notification" link, play the pop animation
  // on the main event card so the user sees which event they were pointed to.
  const highlightId = useHighlightOnMount();
  const shouldHighlight = highlightId != null && highlightId === eventId;

  const [event, setEvent] = useState<EventData | null>(null);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<'COMPLETED' | 'REQUIRE_CHANGES'>('COMPLETED');
  const [completionComment, setCompletionComment] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [selectedPayNowPayment, setSelectedPayNowPayment] = useState<Payment | null>(null);

  const convertToPayNowPayment = (p: PaymentData): Payment => ({
    id: typeof p.id === 'string' ? parseInt(p.id, 10) || 0 : p.id as unknown as number,
    declarationId: String(p.id),
    eventId: p.eventId,
    date: p.createdAt,
    eventName: p.eventTitle,
    eventType: p.paymentType,
    photographerName: p.photographerName,
    photographerImage: p.photographerImage || '',
    method: '',
    amount: formatPrice(p.amount, p.currencyAbbreviation),
    amountNum: p.amount,
    paidAmount: p.paidAmount,
    status: (p.status?.toLowerCase() || 'pending') as any,
    invoiceNumber: `INV-${String(p.id).substring(0, 8).toUpperCase()}`,
  });

  const handlePayNowClick = (payment: PaymentData) => {
    setSelectedPayNowPayment(convertToPayNowPayment(payment));
    setShowPayNowModal(true);
  };

  // Fetch event details
  const fetchEvent = useCallback(async () => {
    // Cookie-only sessions have no JS-readable token. dashboardAuthFetch
    // sends the HttpOnly cookie regardless, so gate only on eventId.
    if (!eventId) return;
    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();

      // Always use the customer events endpoint. it allows both creator and photographer access
      const eventRes = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${eventId}`);

      if (!eventRes.ok) {
        if (eventRes.status === 404) {
          setError('Event not found');
        } else {
          setError('Failed to load event details');
        }
        setLoading(false);
        return;
      }

      const eventResult = await eventRes.json();
      const data = eventResult?.data || eventResult;

      const mappedEvent: EventData = {
        id: data.id || eventId,
        title: data.title || data.eventTitle || 'Untitled Event',
        description: data.description || '',
        eventType: data.eventType || data.type || '',
        category: data.category || '',
        status: data.eventStatus || data.status || 'UPCOMING',
        eventStatus: data.eventStatus || data.status || null,
        eventDate: data.eventDate || data.date || '',
        latitude: typeof data.latitude === 'number' ? data.latitude : null,
        longitude: typeof data.longitude === 'number' ? data.longitude : null,
        date: data.date || data.eventDate || '',
        time: data.time || data.startTime || '',
        endTime: data.endTime || '',
        duration: data.duration || '',
        venueName: data.venueName || data.venue || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        maxGuests: Number(data.maxGuests || data.maxAttendees) || 0,
        organizer: data.organizer || data.organizerName || '',
        tags: data.tags || [],
        bannerImage: normalizeImageUrl(data.bannerImage || data.bannerImageUrl) || null,
        photographerId: data.photographerId || null,
        photographerName: data.photographerName || data.photographer?.name || null,
        photographerImage: normalizeImageUrl(data.photographerImage || data.photographer?.profileImage) || null,
        packageId: data.packageId || data.booking?.packageId || null,
        packageName: data.packageName || data.booking?.packageName || null,
        packagePrice: data.packagePrice != null ? Number(data.packagePrice) : (data.booking?.packagePrice != null ? Number(data.booking.packagePrice) : null),
        bookingStatus: data.bookingStatus || data.booking?.status || null,
        bookingId: data.bookingId || data.booking?.id || null,
        completionStatus: data.completionStatus || data.eventCompletionStatus || null,
        createdAt: data.createdAt || '',
        eventVisibility: data.eventVisibility || data.visibility || 'PUBLIC',
        hasLiveStream: Boolean(data.hasLiveStream),
        bookingProgress: Array.isArray(data.bookingProgress) ? data.bookingProgress : [],
      };

      setEvent(mappedEvent);

      // Fetch payments for this event
      try {
        const paymentsRes = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/payments?page=0&size=50`);
        if (paymentsRes.ok) {
          const paymentsResult = await paymentsRes.json();
          const allPayments = paymentsResult?.data?.content || [];

          // Filter payments for this event
          const eventPayments: PaymentData[] = allPayments
            .filter((p: any) => p.eventId === eventId)
            .map((item: any) => ({
              id: item.id,
              eventId: item.eventId,
              eventTitle: item.eventTitle || 'Untitled Event',
              photographerName: item.photographerName || 'Unknown',
              photographerImage: normalizeImageUrl(item.photographerImage) || null,
              amount: Number(item.amount) || 0,
              amountInUsd: Number(item.amountInUsd ?? item.amount) || 0,
              paidAmount: Number(item.paidAmount) || 0,
              paidAmountInUsd: Number(item.paidAmountInUsd ?? item.paidAmount) || 0,
              status: item.status || 'PENDING',
              escrowStatus: item.escrowStatus || 'NONE',
              escrowPercentage: item.escrowPercentage || null,
              heldAmount: Number(item.heldAmount) || 0,
              releasedAmount: Number(item.releasedAmount) || 0,
              heldAmountInUsd: Number(item.heldAmountInUsd ?? item.heldAmount) || 0,
              releasedAmountInUsd: Number(item.releasedAmountInUsd ?? item.releasedAmount) || 0,
              eventCompletionStatus: item.eventCompletionStatus || 'NOT_COMPLETED',
              paymentType: item.paymentType || 'Booking',
              createdAt: item.createdAt || '',
              currencyAbbreviation: item.currencyAbbreviation || 'USD',
            }));

          setPayments(eventPayments);
        }
      } catch {
        // Payments fetch failure is non-critical
        console.error('Failed to fetch payments for event');
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventId, userRole]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Navigation helpers
  const eventsListPath = `/user/${userRole}/events`;
  const paymentsPath = `/user/${userRole}/payments`;

  // Compute totals across all payments for this event
  const totalAmount = payments.reduce((sum, p) => sum + p.amountInUsd, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmountInUsd, 0);
  const totalRemaining = totalAmount - totalPaid;
  const hasPendingPayments = payments.some(p => p.status === 'PENDING' || p.status === 'PARTIAL');

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderLoading = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${colors.borderPrimary}`,
          borderTopColor: '#083A85',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem auto',
        }} />
        <p style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Loading event details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const renderError = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto',
        }}>
          <AlertCircleIcon />
        </div>
        <h3 style={{ color: colors.textPrimary, fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
          {error}
        </h3>
        <p style={{ color: colors.textSecondary, fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
          The event you are looking for may have been removed or you may not have permission to view it.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => fetchEvent()}
            style={{
              backgroundColor: '#083A85',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <Link
            href={eventsListPath}
            style={{
              backgroundColor: colors.bgTertiary,
              color: colors.textPrimary,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Back to Events
          </Link>
        </div>
      </div>
    </div>
  );

  const renderStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: color + '18',
        color: color,
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          marginRight: '0.375rem',
        }} />
        {getStatusLabel(status)}
      </span>
    );
  };

  const renderPaymentStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: '600',
        backgroundColor: color + '18',
        color: color,
      }}>
        {getPaymentStatusLabel(status)}
      </span>
    );
  };

  // ── Condition Helpers ───────────────────────────────────────────────────────

  const isEventDeletable = () => {
    if (!event) return false;
    if (event.status.toUpperCase() === 'COMPLETED') return false;
    if (event.completionStatus && event.completionStatus.toUpperCase() !== 'NOT_COMPLETED') return false;
    if (event.bookingStatus?.toUpperCase() === 'ACCEPTED') return false;
    if (event.status.toUpperCase() === 'PAUSED') return false;
    return true;
  };

  const isEventPausable = () => {
    if (!event) return false;
    if (event.bookingStatus?.toUpperCase() !== 'ACCEPTED') return false;
    if (event.status.toUpperCase() === 'COMPLETED') return false;
    if (event.status.toUpperCase() === 'PAUSED') return false;
    return true;
  };

  const isEventResumable = () => {
    if (!event) return false;
    return event.status.toUpperCase() === 'PAUSED';
  };

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!event) return;
    setActionLoading('publish');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to publish event (${res.status})`);
      }
      await fetchEvent(); // Re-fetch to get updated status
    } catch (err) {
      console.error('Publish event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to publish event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async () => {
    if (!event) return;
    setActionLoading('unpublish');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to unpublish event (${res.status})`);
      }
      await fetchEvent();
    } catch (err) {
      console.error('Unpublish event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to unpublish event');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async () => {
    if (!event) return;
    setShowPauseConfirm(false);
    setActionLoading('pause');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to pause event (${res.status})`);
      }
      await fetchEvent();
    } catch (err) {
      console.error('Pause event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to pause event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    if (!event) return;
    setActionLoading('resume');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to resume event (${res.status})`);
      }
      await fetchEvent();
    } catch (err) {
      console.error('Resume event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to resume event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setShowDeleteConfirm(false);
    setActionLoading('delete');
    try {
      const apiUrl = getApiUrl();
      const wasPublished = event.status.toUpperCase() === 'PUBLISHED';

      // Unpublish first if published
      if (wasPublished) {
        const unpubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}/unpublish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!unpubRes.ok) {
          const errorData = await unpubRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to unpublish event before deletion');
        }
      }

      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete event (${res.status})`);
      }

      // Navigate back to events list
      router.push(`/user/${userRole}/events`);
    } catch (err) {
      console.error('Delete event error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to delete event');
      setActionLoading(null);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!event) return;
    setActionLoading('completion');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/events/${event.id}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: completionStatus, comment: completionComment || null }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit completion feedback');
      }
      setShowCompletionModal(false);
      await fetchEvent();
    } catch (err) {
      console.error('Confirm completion error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to submit completion feedback');
    } finally {
      setActionLoading(null);
    }
  };

  // Photographer actions
  const handleAcceptBooking = async () => {
    if (!event) return;
    setActionLoading('accept');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${event.id}/accept`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to accept booking');
      }
      await fetchEvent();
    } catch (err) {
      console.error('Accept booking error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineBooking = async () => {
    if (!event) return;
    setShowDeclineModal(false);
    setActionLoading('decline');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${event.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason || 'No reason provided' }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to decline booking');
      }
      await fetchEvent();
    } catch (err) {
      console.error('Decline booking error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to decline booking');
    } finally {
      setActionLoading(null);
      setDeclineReason('');
    }
  };

  const handleMarkComplete = async () => {
    if (!event) return;
    setActionLoading('markComplete');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${event.id}/mark-completed`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to mark event as completed');
      }
      await fetchEvent();
    } catch (err) {
      console.error('Mark complete error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to mark event as completed');
    } finally {
      setActionLoading(null);
    }
  };

  // Deep-link to the photographer Events page with the action pre-opened for
  // this event (Create Album / Live Stream control reuse the working flows
  // there rather than duplicating them on the detail page).
  const goToEventAction = (action: 'createAlbum' | 'stream') => {
    if (!event) return;
    router.push(`/user/${userRole}/events?event=${event.id}&action=${action}`);
  };

  const handleShareEvent = async () => {
    if (!event) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = { title: event.title, text: `Event: ${event.title}`, url: shareUrl };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        platformAlert('Event link copied to clipboard.');
      }
    } catch {
      /* user cancelled share or clipboard blocked - no-op */
    }
  };

  const renderEventContent = () => {
    if (!event) return null;

    const locationParts = [event.venueName, event.address, event.city, event.country].filter(Boolean);
    const locationString = locationParts.join(', ') || 'No location specified';

    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: colors.textSecondary,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500',
            padding: '0.25rem 0',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeftIcon />
          Back to Events
        </button>

        {/* Event Banner */}
        {event.bannerImage && (
          <div style={{
            width: '100%',
            height: '220px',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            position: 'relative',
            backgroundColor: colors.bgTertiary,
          }}>
            <img
              src={event.bannerImage}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Event Header Card */}
        <div style={{
          backgroundColor: colors.bgCard,
          borderRadius: '0.75rem',
          border: `1px solid ${colors.borderPrimary}`,
          padding: '1.5rem',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                  {event.title}
                </h1>
                {renderStatusBadge(event.status)}
              </div>

              {event.description && (
                <p style={{ color: colors.textSecondary, fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                  {event.description}
                </p>
              )}

              {/* Event Meta Info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
                {event.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.textSecondary, fontSize: '0.85rem' }}>
                    <CalendarIcon />
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                )}
                {event.time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.textSecondary, fontSize: '0.85rem' }}>
                    <ClockIcon />
                    <span>{formatTime(event.time)}{event.endTime ? ` - ${formatTime(event.endTime)}` : ''}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.textSecondary, fontSize: '0.85rem' }}>
                  <LocationIcon />
                  <span>{locationString}</span>
                </div>
                {event.maxGuests > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.textSecondary, fontSize: '0.85rem' }}>
                    <UsersIcon />
                    <span>{event.maxGuests} guests</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
              {event.tags.map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(8, 58, 133, 0.08)',
                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
            {userRole !== 'photographer' ? (
              <>
                {/* Edit - navigates to events page */}
                <button
                  onClick={() => router.push(`/user/${userRole}/events`)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>

                {/* Publish / Unpublish */}
                {event.status.toUpperCase() === 'PUBLISHED' ? (
                  <button
                    onClick={handleUnpublish}
                    disabled={actionLoading === 'unpublish'}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#d19d0d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: actionLoading === 'unpublish' ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === 'unpublish' ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === 'unpublish' ? 'Unpublishing...' : 'Unpublish'}
                  </button>
                ) : event.status.toUpperCase() !== 'COMPLETED' ? (
                  <button
                    onClick={handlePublish}
                    disabled={actionLoading === 'publish'}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#05a129',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: actionLoading === 'publish' ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === 'publish' ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === 'publish' ? 'Publishing...' : 'Publish'}
                  </button>
                ) : null}

                {/* Pause */}
                {isEventPausable() && (
                  <button
                    onClick={() => setShowPauseConfirm(true)}
                    disabled={actionLoading === 'pause'}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: actionLoading === 'pause' ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === 'pause' ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === 'pause' ? 'Pausing...' : 'Pause'}
                  </button>
                )}

                {/* Resume */}
                {isEventResumable() && (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading === 'resume'}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: actionLoading === 'resume' ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === 'resume' ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === 'resume' ? 'Resuming...' : 'Resume'}
                  </button>
                )}

                {/* Delete */}
                {isEventDeletable() && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}

                {/* Confirm Completion */}
                {event.completionStatus?.toUpperCase() === 'PENDING_CUSTOMER_CONFIRMATION' && (
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#7C3AED',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Confirm Completion
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Accept / Decline (photographer, booking pending) */}
                {event.bookingStatus?.toUpperCase() === 'PENDING' && (
                  <>
                    <button
                      onClick={() => setShowAcceptModal(true)}
                      disabled={actionLoading === 'accept'}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: actionLoading === 'accept' ? 'not-allowed' : 'pointer',
                        opacity: actionLoading === 'accept' ? 0.7 : 1,
                      }}
                    >
                      {actionLoading === 'accept' ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(true)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Decline
                    </button>
                  </>
                )}

                {/* Photographer action row (booking accepted): Create Album,
                    Live Stream, Share, Mark Complete - shown together so the
                    photographer has every next step in one place. */}
                {event.bookingStatus?.toUpperCase() === 'ACCEPTED' && (
                  <>
                    <button
                      onClick={() => goToEventAction('createAlbum')}
                      style={{
                        padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 6,
                        backgroundColor: '#083A85', color: 'white', border: 'none',
                        borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      <i className="bi bi-plus-circle-fill" style={{ fontSize: 13 }} /> Create Album
                    </button>
                    {event.hasLiveStream && (
                      <button
                        onClick={() => goToEventAction('stream')}
                        style={{
                          padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 6,
                          backgroundColor: '#F20C8F', color: 'white', border: 'none',
                          borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                        }}
                      >
                        <i className="bi bi-broadcast-pin" style={{ fontSize: 13 }} /> Live Stream
                      </button>
                    )}
                    <button
                      onClick={handleShareEvent}
                      style={{
                        padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 6,
                        backgroundColor: colors.bgCard, color: colors.textPrimary,
                        border: `1px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                      }}
                    >
                      <i className="bi bi-share-fill" style={{ fontSize: 13 }} /> Share
                    </button>
                    {event.completionStatus?.toUpperCase() !== 'COMPLETED' && (
                      <button
                        onClick={handleMarkComplete}
                        disabled={actionLoading === 'markComplete'}
                        style={{
                          padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 6,
                          backgroundColor: '#059669', color: 'white', border: 'none',
                          borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600',
                          cursor: actionLoading === 'markComplete' ? 'not-allowed' : 'pointer',
                          opacity: actionLoading === 'markComplete' ? 0.7 : 1,
                        }}
                      >
                        <i className="bi bi-check2-circle" style={{ fontSize: 13 }} />
                        {actionLoading === 'markComplete' ? 'Marking...' : 'Mark Complete'}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Booking progression bar */}
        {event.bookingProgress && event.bookingProgress.length > 0 && (
          <div style={{
            backgroundColor: colors.bgCard, borderRadius: '0.75rem',
            border: `1px solid ${colors.borderPrimary}`, padding: '1.25rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textPrimary, margin: '0 0 1.1rem' }}>
              Booking Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
              {event.bookingProgress.map((stage, i) => {
                const isLast = i === event.bookingProgress.length - 1;
                const nextDone = !isLast && event.bookingProgress[i + 1].done;
                return (
                  <div key={stage.key} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : 1, minWidth: isLast ? 64 : 90 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: 64, flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: stage.done ? '#10B981' : 'transparent',
                        border: stage.done ? 'none' : `2px solid ${colors.borderPrimary}`,
                        color: stage.done ? '#fff' : colors.textSecondary,
                        fontSize: 13, fontWeight: 700,
                      }}>
                        {stage.done ? <i className="bi bi-check-lg" /> : i + 1}
                      </div>
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.25,
                        color: stage.done ? colors.textPrimary : colors.textSecondary,
                      }}>{stage.label}</span>
                    </div>
                    {!isLast && (
                      <div style={{
                        flex: 1, height: 2, marginTop: 14, minWidth: 12,
                        backgroundColor: nextDone ? '#10B981' : colors.borderPrimary,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Photographer Card */}
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.borderPrimary}`,
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ color: '#083A85' }}><CameraIcon /></div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Photographer</h3>
            </div>

            {event.photographerName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {event.photographerImage && (
                    <img
                      src={event.photographerImage}
                      alt={event.photographerName}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>
                    {event.photographerName}
                  </div>
                  {event.bookingStatus && (
                    <div style={{ marginTop: '0.25rem' }}>
                      {renderStatusBadge(event.bookingStatus)}
                    </div>
                  )}
                </div>
              </div>
            ) : (event.eventStatus === 'HYBRID_TIMEOUT' || event.status === 'HYBRID_TIMEOUT') ? (
              <div>
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.05) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Matching Window Concluded (0 Accepted)
                    </span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  </div>
                  <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '0 0 14px', lineHeight: 1.5 }}>
                    The 24-hour matching window has concluded without an accepted photographer. You can instantly switch to Direct Booking to browse and select available creators nearby on our interactive radar map.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Link
                      href={`/photographers?lat=${event.latitude ?? -1.9536}&lng=${event.longitude ?? 30.0606}&eventDate=${encodeURIComponent(event.eventDate || event.date || '')}`}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 10px rgba(8,58,133,0.20)',
                      }}
                    >
                      <i className="bi bi-geo-alt-fill" /> Browse Nearby Photographers
                    </Link>
                    <button
                      type="button"
                      disabled={actionLoading === 'retry-hybrid'}
                      onClick={async () => {
                        setActionLoading('retry-hybrid');
                        try {
                          await convertToHybrid(eventId);
                          platformAlert.success('Matching reactivated! Your brief has been broadcast to local creators.');
                          fetchEvent();
                        } catch (err: any) {
                          platformAlert.error(err?.message || 'Could not retry matching');
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                      style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '9px',
                        border: `1px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgTertiary,
                        color: colors.textPrimary,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {actionLoading === 'retry-hybrid' ? (
                        <><i className="bi bi-arrow-clockwise" style={{ animation: 'spin 0.9s linear infinite' }} /> Reactivating...</>
                      ) : (
                        <><i className="bi bi-arrow-repeat" /> Retry Matching</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ color: colors.textSecondary, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  No photographer assigned yet
                </div>
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.06) 100%)',
                  border: '1.5px solid rgba(8,58,133,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#083A85', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Photographer Matching Active
                    </span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '0 0 10px', lineHeight: 1.4 }}>
                    Local photographers are reviewing your brief.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCandidatesModal(true)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #083A85 0%, #1D4ED8 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(8,58,133,0.20)',
                    }}
                  >
                    <i className="bi bi-people-fill" /> View Candidates & Select
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Booking Details Card */}
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.borderPrimary}`,
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ color: '#083A85' }}><PackageIcon /></div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Booking Details</h3>
            </div>

            {event.packageName ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Package</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{event.packageName}</span>
                </div>
                {event.packagePrice != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Price</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                      {event.packageCurrencySymbol || ''}{formatPrice(event.packagePrice)} {event.packageCurrencyAbbreviation || ''}
                    </span>
                  </div>
                )}
                {event.packageDurationHours != null && event.packageDurationHours > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Duration</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.packageDurationHours} hours</span>
                  </div>
                )}
                {event.packageIncludedPhotos != null && event.packageIncludedPhotos > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Included Photos</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.packageIncludedPhotos}</span>
                  </div>
                )}
                {event.packageIncludedVideos != null && event.packageIncludedVideos > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Included Videos</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.packageIncludedVideos}</span>
                  </div>
                )}
                {event.packageDescription && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Description</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.packageDescription}</span>
                  </div>
                )}
                {event.eventType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Event Type</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.eventType}</span>
                  </div>
                )}
                {event.category && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Category</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.category}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {event.eventType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Event Type</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.eventType}</span>
                  </div>
                )}
                {event.category && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Category</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{event.category}</span>
                  </div>
                )}
                <div style={{ color: colors.textSecondary, fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No package booked
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Completion Status Card */}
        {event.completionStatus && (
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.borderPrimary}`,
            padding: '1.25rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircleIcon color={getStatusColor(event.completionStatus)} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Completion Status</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {renderStatusBadge(event.completionStatus)}
              {event.completionStatus?.toUpperCase() === 'COMPLETED' && (
                <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '500' }}>
                  Event has been completed successfully
                </span>
              )}
              {event.completionStatus?.toUpperCase() === 'PENDING' && (
                <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: '500' }}>
                  Awaiting confirmation
                </span>
              )}
            </div>
          </div>
        )}

        {/* Milestone / Payments Section */}
        {payments.length > 0 && (
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.borderPrimary}`,
            padding: '1.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: '#083A85' }}><ShieldIcon /></div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                  Payments & Milestones
                </h3>
              </div>
              {hasPendingPayments && (
                <button
                  onClick={() => {
                    const pendingPayment = payments.find(p => p.status === 'PENDING' || p.status === 'PARTIAL');
                    if (pendingPayment) handlePayNowClick(pendingPayment);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    backgroundColor: '#083A85',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <CreditCardIcon />
                  Pay Now
                </button>
              )}
            </div>

            {/* Payment Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                backgroundColor: colors.bgTertiary,
                borderRadius: '0.5rem',
                padding: '0.875rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.7rem', color: colors.textSecondary, fontWeight: '500', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Amount
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                  {formatPrice(totalAmount)}
                </div>
              </div>
              <div style={{
                backgroundColor: colors.bgTertiary,
                borderRadius: '0.5rem',
                padding: '0.875rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.7rem', color: colors.textSecondary, fontWeight: '500', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Paid
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10B981' }}>
                  {formatPrice(totalPaid)}
                </div>
              </div>
              <div style={{
                backgroundColor: colors.bgTertiary,
                borderRadius: '0.5rem',
                padding: '0.875rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.7rem', color: colors.textSecondary, fontWeight: '500', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Remaining
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: totalRemaining > 0 ? '#F59E0B' : '#10B981' }}>
                  {formatPrice(totalRemaining > 0 ? totalRemaining : 0)}
                </div>
              </div>
            </div>

            {/* Individual Payment Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {payments.map((payment, index) => {
                const isPending = payment.status === 'PENDING' || payment.status === 'PARTIAL';
                const isHeld = payment.escrowStatus === 'HELD';
                const isReleased = payment.escrowStatus === 'RELEASED';
                const paymentAmount = payment.amountInUsd;
                const paidAmount = payment.paidAmountInUsd;
                const remaining = paymentAmount - paidAmount;

                // 70/30 breakdown for escrow (all USD - heldAmountInUsd is the
                // converted hold; mixing it with the RWF heldAmount used to show
                // the raw RWF figure as dollars).
                const heldForDelivery = payment.heldAmountInUsd;
                const withdrawableAmount = heldForDelivery > 0 ? paymentAmount - heldForDelivery : 0;

                return (
                  <div key={payment.id || index} style={{
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.3)' : colors.borderPrimary}`,
                  }}>
                    {/* Payment header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>
                          {payment.paymentType || 'Booking Payment'}
                        </span>
                        {renderPaymentStatusBadge(payment.status)}
                      </div>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: colors.textPrimary }}>
                        {formatPrice(paymentAmount)}
                      </span>
                    </div>

                    {/* Escrow Info */}
                    {payment.escrowPercentage != null && payment.escrowPercentage > 0 && (
                      <div style={{
                        backgroundColor: actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(8, 58, 133, 0.04)',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        marginBottom: '0.75rem',
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(8, 58, 133, 0.1)'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                          <ShieldIcon />
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                            Escrow Protection ({payment.escrowPercentage}%)
                          </span>
                          {isHeld && (
                            <span style={{
                              display: 'inline-flex',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px',
                              fontSize: '0.65rem',
                              fontWeight: '600',
                              backgroundColor: 'rgba(251, 191, 36, 0.15)',
                              color: '#D97706',
                            }}>
                              Held
                            </span>
                          )}
                          {isReleased && (
                            <span style={{
                              display: 'inline-flex',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px',
                              fontSize: '0.65rem',
                              fontWeight: '600',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#059669',
                            }}>
                              Released
                            </span>
                          )}
                        </div>

                        {/* 70/30 Breakdown */}
                        {(withdrawableAmount > 0 || heldForDelivery > 0) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                                <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Withdrawable ({100 - (payment.escrowPercentage || 0)}%)</span>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10B981' }}>
                                {formatPrice(withdrawableAmount)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                                <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Held for delivery ({payment.escrowPercentage}%)</span>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#F59E0B' }}>
                                {formatPrice(heldForDelivery)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Progress */}
                    {paymentAmount > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                            Paid: {formatPrice(paidAmount)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                            {remaining > 0 ? `Remaining: ${formatPrice(remaining)}` : 'Fully Paid'}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: colors.borderPrimary,
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.min((paidAmount / paymentAmount) * 100, 100)}%`,
                            height: '100%',
                            backgroundColor: paidAmount >= paymentAmount ? '#10B981' : '#F59E0B',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Escrow awaiting completion notice */}
                    {isHeld && payment.eventCompletionStatus !== 'COMPLETED' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(251, 191, 36, 0.08)',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                      }}>
                        <AlertCircleIcon />
                        <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: '500' }}>
                          Escrow funds will be released after event completion
                        </span>
                      </div>
                    )}

                    {/* Escrow released after completion */}
                    {isHeld && payment.eventCompletionStatus === 'COMPLETED' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: '0.375rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}>
                        <CheckCircleIcon size={16} color="#10B981" />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '500' }}>
                          Event completed - funds eligible for release
                        </span>
                      </div>
                    )}

                    {/* Pay Now button for individual pending payment */}
                    {isPending && !isHeld && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          onClick={() => handlePayNowClick(payment)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            backgroundColor: '#083A85',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.45rem 0.875rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          <CreditCardIcon />
                          Pay Now
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Payments Yet */}
        {payments.length === 0 && event.packageName && (
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.borderPrimary}`,
            padding: '1.5rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ color: '#083A85' }}><CreditCardIcon /></div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Payments</h3>
            </div>
            <p style={{ color: colors.textSecondary, fontSize: '0.85rem', margin: 0 }}>
              No payment records found for this event.
            </p>
          </div>
        )}

        {/* Event Details Card (extra info) */}
        <div style={{
          backgroundColor: colors.bgCard,
          borderRadius: '0.75rem',
          border: `1px solid ${colors.borderPrimary}`,
          padding: '1.25rem',
          marginBottom: '1rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 1rem 0' }}>
            Event Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {event.organizer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organizer</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{event.organizer}</span>
              </div>
            )}
            {event.eventVisibility && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visibility</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' }}>{event.eventVisibility.toLowerCase()}</span>
              </div>
            )}
            {event.duration && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{event.duration}</span>
              </div>
            )}
            {event.createdAt && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>
                  {formatEventDate(event.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
      <style>{`
        @media (max-width: 768px) {
          .event-detail-content {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div
          className={shouldHighlight ? 'event-detail-content notif-highlight-pop' : 'event-detail-content'}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: colors.bgPrimary,
            paddingLeft: '1.25rem',
            paddingRight: '1.25rem',
            paddingTop: '1rem',
            paddingBottom: '2rem',
          }}
        >
          {loading && renderLoading()}
          {!loading && error && renderError()}
          {!loading && !error && event && renderEventContent()}
        </div>
      </div>

      {/* Confirmation Modals */}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Delete event"
          title="Delete Event?"
          intro="Are you sure you want to delete this event?"
          detail="This action cannot be undone."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDeleteConfirm(false)}
          closeLabel="Cancel"
          primary={{
            label: actionLoading === 'delete' ? 'Deleting...' : 'Delete',
            icon: actionLoading === 'delete' ? 'bi-arrow-clockwise' : 'bi-trash3-fill',
            onClick: handleDelete,
            tone: 'danger',
          }}
        />
      )}

      {/* Pause Confirmation */}
      {showPauseConfirm && (
        <EventConfirmModal
          tone="warning"
          icon="bi-pause-circle-fill"
          eyebrow="Pause event"
          title="Pause Event?"
          intro="This will temporarily pause the event."
          detail="You can resume it later at any time."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowPauseConfirm(false)}
          closeLabel="Cancel"
          primary={{
            label: actionLoading === 'pause' ? 'Pausing...' : 'Pause',
            icon: actionLoading === 'pause' ? 'bi-arrow-clockwise' : 'bi-pause-fill',
            onClick: handlePause,
            tone: 'warning',
          }}
        />
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div
          onClick={() => setShowCompletionModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: colors.bgCard,
              borderRadius: 18,
              maxWidth: 500,
              width: '95%',
              border: `1px solid ${colors.borderPrimary}`,
              boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
              overflow: 'hidden',
            }}
          >
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            }} />
            <div style={{ padding: '1.5rem 1.5rem 1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
                  boxShadow: '0 10px 24px rgba(8,58,133,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-check2-circle" style={{ fontSize: 24, color: '#fff' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Wrap up the event</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                  Confirm Event Completion
                </h3>
              </div>

              {/* Status Selection */}
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                {[
                  { value: 'COMPLETED', label: 'Completed', subLabel: 'Everything is perfect', color: '#10B981', icon: 'bi-check2-circle' },
                  { value: 'REQUIRE_CHANGES', label: 'Require Changes', subLabel: 'Needs adjustments', color: '#F59E0B', icon: 'bi-arrow-counterclockwise' },
                ].map((opt) => {
                  const isSel = completionStatus === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setCompletionStatus(opt.value as any)}
                      style={{
                        flex: 1,
                        padding: '0.85rem 0.75rem',
                        border: `1px solid ${isSel ? opt.color + '88' : colors.borderPrimary}`,
                        borderRadius: 12,
                        background: isSel
                          ? (actualTheme === 'dark'
                            ? `linear-gradient(135deg, ${opt.color}30 0%, ${opt.color}18 100%)`
                            : `linear-gradient(135deg, ${opt.color}14 0%, ${opt.color}08 100%)`)
                          : colors.bgCard,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.18s',
                        boxShadow: isSel ? `0 6px 14px ${opt.color}22` : 'none',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        margin: '0 auto 6px',
                        background: isSel ? opt.color : (actualTheme === 'dark' ? '#374151' : '#F3F4F6'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isSel ? `0 4px 10px ${opt.color}40` : 'none',
                      }}>
                        <i className={`bi ${opt.icon}`} style={{ fontSize: 13, color: isSel ? '#fff' : colors.textSecondary }} />
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSel ? opt.color : colors.textPrimary, letterSpacing: '-0.005em' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginTop: 1 }}>{opt.subLabel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Comment Input */}
              <div style={{ marginBottom: '1.3rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '0.45rem',
                }}>
                  Comment {completionStatus === 'COMPLETED' ? '(optional)' : ''}
                </label>
                <textarea
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  placeholder={completionStatus === 'REQUIRE_CHANGES' ? 'Describe what needs to be changed...' : 'Any additional feedback...'}
                  style={{
                    width: '100%',
                    minHeight: 90,
                    padding: '0.75rem 0.85rem',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(242,12,143,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.10)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  disabled={actionLoading === 'completion'}
                  style={{
                    flex: 1.6,
                    padding: '0.7rem 1rem',
                    background: actionLoading === 'completion'
                      ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                      : (completionStatus === 'COMPLETED'
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'),
                    color: 'white',
                    border: 'none',
                    borderRadius: 11,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    cursor: actionLoading === 'completion' ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === 'completion' ? 0.7 : 1,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: actionLoading === 'completion'
                      ? 'none'
                      : (completionStatus === 'COMPLETED' ? '0 8px 18px rgba(16,185,129,0.32)' : '0 8px 18px rgba(245,158,11,0.32)'),
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { if (actionLoading !== 'completion') e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {actionLoading === 'completion' ? (
                    <><i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} /> Submitting...</>
                  ) : completionStatus === 'COMPLETED' ? (
                    <><i className="bi bi-check2" style={{ fontSize: 13 }} /> Confirm Completion</>
                  ) : (
                    <><i className="bi bi-arrow-counterclockwise" style={{ fontSize: 13 }} /> Request Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal (Photographer) */}
      {showAcceptModal && event && (
        <div
          onClick={() => setShowAcceptModal(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'relative', backgroundColor: colors.bgCard, borderRadius: 18,
            maxWidth: 500, width: '95%', border: `1px solid ${colors.borderPrimary}`,
            boxShadow: '0 25px 60px -12px rgba(8,58,133,0.30)', overflow: 'hidden',
          }}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)' }} />
            <div style={{ padding: '1.5rem 1.5rem 1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 10px 24px rgba(16,185,129,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-check2-circle" style={{ fontSize: 26, color: '#fff' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Accept booking</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Accept this booking?</h3>
              </div>

              {/* Booking summary */}
              <div style={{ backgroundColor: 'rgba(127,127,127,0.08)', border: `1px solid ${colors.borderPrimary}`, borderRadius: 11, padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.85rem', marginBottom: 6 }}>
                  <span style={{ color: colors.textSecondary }}>Event</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 600, textAlign: 'right' }}>{event.title}</span>
                </div>
                {event.packageName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.85rem', marginBottom: 6 }}>
                    <span style={{ color: colors.textSecondary }}>Package</span>
                    <span style={{ color: colors.textPrimary, fontWeight: 600, textAlign: 'right' }}>{event.packageName}</span>
                  </div>
                )}
                {event.packagePrice != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.85rem' }}>
                    <span style={{ color: colors.textSecondary }}>Price</span>
                    <span style={{ color: colors.textPrimary, fontWeight: 700, textAlign: 'right' }}>{event.packageCurrencyAbbreviation || ''} {event.packagePrice}</span>
                  </div>
                )}
              </div>

              {/* What happens next */}
              <div style={{ fontSize: '0.82rem', color: colors.textSecondary, lineHeight: 1.55, marginBottom: '1.3rem' }}>
                By accepting, you confirm your availability for this event. The client is notified and their deposit is held securely in escrow by Connekyt, not paid to you directly. Your share is released to your wallet (net of fees) as you deliver: the upfront portion on acceptance, then on album delivery and photobook acceptance.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => setShowAcceptModal(false)}
                  style={{ flex: 1, padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, backgroundColor: colors.bgCard, color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 11, cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={() => { setShowAcceptModal(false); handleAcceptBooking(); }}
                  disabled={actionLoading === 'accept'}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: 11, cursor: 'pointer', boxShadow: '0 8px 18px rgba(16,185,129,0.30)' }}
                >
                  <i className="bi bi-check2-circle" style={{ fontSize: 13 }} /> Confirm acceptance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && (
        <div
          onClick={() => setShowDeclineModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: colors.bgCard,
              borderRadius: 18,
              maxWidth: 500,
              width: '95%',
              border: `1px solid ${colors.borderPrimary}`,
              boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
              overflow: 'hidden',
            }}
          >
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
            }} />
            <div style={{ padding: '1.5rem 1.5rem 1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  boxShadow: '0 10px 24px rgba(220,38,38,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-x-octagon-fill" style={{ fontSize: 24, color: '#fff' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, color: '#DC2626',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Decline booking</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                  Decline Booking
                </h3>
              </div>

              {/* Reason Input */}
              <div style={{ marginBottom: '1.3rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: '0.45rem',
                }}>
                  Reason for declining
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  style={{
                    width: '100%',
                    minHeight: 110,
                    padding: '0.75rem 0.85rem',
                    backgroundColor: colors.bgCard,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    fontSize: '0.88rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(242,12,143,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.10)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                  }}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineBooking}
                  disabled={actionLoading === 'decline'}
                  style={{
                    flex: 1.6,
                    padding: '0.7rem 1rem',
                    background: actionLoading === 'decline'
                      ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 11,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    cursor: actionLoading === 'decline' ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === 'decline' ? 0.7 : 1,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: actionLoading === 'decline' ? 'none' : '0 8px 18px rgba(220,38,38,0.30)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { if (actionLoading !== 'decline') e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {actionLoading === 'decline' ? (
                    <><i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} /> Declining...</>
                  ) : (
                    <><i className="bi bi-x-circle-fill" style={{ fontSize: 13 }} /> Decline Booking</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => { setShowPayNowModal(false); setSelectedPayNowPayment(null); }}
        payment={selectedPayNowPayment}
        onPaymentSuccess={() => { setShowPayNowModal(false); setSelectedPayNowPayment(null); fetchEvent(); }}
      />

      <CandidatesShortlistModal
        isOpen={showCandidatesModal}
        onClose={() => setShowCandidatesModal(false)}
        eventId={eventId}
        eventTitle={event?.title || 'Your Event'}
        eventStatus={event?.eventStatus || event?.status || undefined}
        latitude={event?.latitude}
        longitude={event?.longitude}
        eventDate={event?.eventDate || event?.date}
        onPhotographerSelected={() => {
          setShowCandidatesModal(false);
          fetchEvent();
        }}
      />
    </div>
  );
}
