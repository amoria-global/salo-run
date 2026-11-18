"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import EventConfirmModal from '../../components/EventConfirmModal';
import EventQrWizard from '../../components/EventQrWizard';
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
import { friendlyEventStatus, isOpenHybrid } from '@/app/lib/hybridStatus';
import { useEventDetail, type EventDetailController } from '@/app/components/events/detail/useEventDetail';
import { useUiGlass } from '@/app/lib/useUiGlass';
import GlassEventDetail from '@/app/components/glass/pages/GlassEventDetail';

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
  /** The owner has published the event, which is what makes its link open for guests. */
  isPublished: boolean;
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
  bookingMode?: string | null;
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
    case 'MATCHES_AWAITING_SELECTION':
    case 'CANDIDATES_AVAILABLE':
      return '#7C3AED';
    case 'HYBRID_MATCHING':
    case 'MATCHING':
    case 'PUBLISHED_PENDING_ASSIGNMENT':
      return '#0284C7';
    case 'HYBRID_TIMEOUT':
    case 'MATCHING_FAILED':
      return '#D97706';
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
    case 'MATCHES_AWAITING_SELECTION': return 'Candidates Ready';
    case 'HYBRID_MATCHING': return 'Matching Active';
    case 'HYBRID_TIMEOUT': return 'Match Timeout';
    case 'PENDING': return 'Pending';
    case 'PARTIAL': return 'Partially Paid';
    case 'PARTIALLY_PAID': return 'Partially Paid';
    case 'AWAITING_REVIEW': return 'Awaiting Review';
    case 'CANCELLED': return 'Cancelled';
    case 'FAILED': return 'Failed';
    // Post My Event states read as words, never as the raw enum.
    default: return status ? friendlyEventStatus(status) : 'Unknown';
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

/** The classic page body. The dialogs are EventDetailModals, shared with the Compact Glass page. */
function EventDetailBody({ ctl }: { ctl: EventDetailController }) {
  const {
    params,
    router,
    colors,
    actualTheme,
    formatPrice,
    token,
    eventId,
    highlightId,
    shouldHighlight,
    event,
    setEvent,
    qrOpen,
    setQrOpen,
    qrJustPublished,
    setQrJustPublished,
    payments,
    setPayments,
    loading,
    setLoading,
    error,
    setError,
    actionLoading,
    setActionLoading,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showPauseConfirm,
    setShowPauseConfirm,
    showCompletionModal,
    setShowCompletionModal,
    completionStatus,
    setCompletionStatus,
    completionComment,
    setCompletionComment,
    showDeclineModal,
    setShowDeclineModal,
    declineReason,
    setDeclineReason,
    showAcceptModal,
    setShowAcceptModal,
    showPayNowModal,
    setShowPayNowModal,
    showCandidatesModal,
    setShowCandidatesModal,
    selectedPayNowPayment,
    setSelectedPayNowPayment,
    convertToPayNowPayment,
    handlePayNowClick,
    fetchEvent,
    eventsListPath,
    paymentsPath,
    totalAmount,
    totalPaid,
    totalRemaining,
    hasPendingPayments,
    renderLoading,
    renderError,
    renderStatusBadge,
    renderPaymentStatusBadge,
    isEventDeletable,
    isEventPausable,
    isEventResumable,
    handlePublish,
    handleUnpublish,
    handlePause,
    handleResume,
    handleDelete,
    handleConfirmCompletion,
    handleAcceptBooking,
    handleDeclineBooking,
    handleMarkComplete,
    goToEventAction,
    handleShareEvent,
    renderEventContent,
    userRole,
  } = ctl;
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

    </div>
  );
}

/** Every dialog of the page, unchanged; rendered by both the classic and the Compact Glass page. */
export function EventDetailModals({ ctl }: { ctl: EventDetailController }) {
  const {
    params,
    router,
    colors,
    actualTheme,
    formatPrice,
    token,
    eventId,
    highlightId,
    shouldHighlight,
    event,
    setEvent,
    qrOpen,
    setQrOpen,
    qrJustPublished,
    setQrJustPublished,
    payments,
    setPayments,
    loading,
    setLoading,
    error,
    setError,
    actionLoading,
    setActionLoading,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showPauseConfirm,
    setShowPauseConfirm,
    showCompletionModal,
    setShowCompletionModal,
    completionStatus,
    setCompletionStatus,
    completionComment,
    setCompletionComment,
    showDeclineModal,
    setShowDeclineModal,
    declineReason,
    setDeclineReason,
    showAcceptModal,
    setShowAcceptModal,
    showPayNowModal,
    setShowPayNowModal,
    showCandidatesModal,
    setShowCandidatesModal,
    selectedPayNowPayment,
    setSelectedPayNowPayment,
    convertToPayNowPayment,
    handlePayNowClick,
    fetchEvent,
    eventsListPath,
    paymentsPath,
    totalAmount,
    totalPaid,
    totalRemaining,
    hasPendingPayments,
    renderLoading,
    renderError,
    renderStatusBadge,
    renderPaymentStatusBadge,
    isEventDeletable,
    isEventPausable,
    isEventResumable,
    handlePublish,
    handleUnpublish,
    handlePause,
    handleResume,
    handleDelete,
    handleConfirmCompletion,
    handleAcceptBooking,
    handleDeclineBooking,
    handleMarkComplete,
    goToEventAction,
    handleShareEvent,
    renderEventContent,
    userRole,
  } = ctl;
  return (
    <>
      {/* Confirmation Modals */}

      {/* Delete Confirmation */}
      {event && (
        <EventQrWizard
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          eventId={event.id}
          eventTitle={event.title}
          published={event.status.toUpperCase() === 'PUBLISHED'}
          justPublished={qrJustPublished}
        />
      )}

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
                  { value: 'COMPLETED', label: 'Completed', subLabel: 'Everything is perfect', color: 'var(--g-success, #10B981)', icon: 'bi-check2-circle' },
                  { value: 'REQUIRE_CHANGES', label: 'Require Changes', subLabel: 'Needs adjustments', color: 'var(--g-warning, #F59E0B)', icon: 'bi-arrow-counterclockwise' },
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
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--g-success, #059669)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Accept booking</div>
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
                  fontSize: '0.66rem', fontWeight: 700, color: 'var(--g-error, #DC2626)',
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
        latitude={event?.latitude ?? undefined}
        longitude={event?.longitude ?? undefined}
        eventDate={event?.eventDate || event?.date}
        onPhotographerSelected={(_photographerId, result, candidate) => {
          setShowCandidatesModal(false);
          if (result?.declarationId && result?.depositAmount) {
            setSelectedPayNowPayment({
              id: 0,
              declarationId: String(result.declarationId),
              eventId: eventId,
              date: new Date().toISOString(),
              eventName: event?.title || 'Your Event',
              eventType: 'BOOKING_DEPOSIT',
              photographerName: candidate?.photographerName || 'Selected Photographer',
              photographerImage: candidate?.profilePicture || '',
              method: '',
              amount: formatPrice(result.depositAmount, result.currency || 'RWF'),
              amountNum: result.depositAmount,
              paidAmount: 0,
              status: 'pending' as any,
              invoiceNumber: `INV-${String(result.declarationId).substring(0, 8).toUpperCase()}`,
            });
            setShowPayNowModal(true);
          }
          fetchEvent();
        }}
      />
    </>
  );
}

/** One controller for both views, so the classic page (UI_GLASS=off) and the Compact Glass page behave the same. */
export default function EventDetailPage({ userRole }: EventDetailPageProps) {
  const ctl = useEventDetail(userRole);
  const glass = useUiGlass();
  if (glass) return <GlassEventDetail ctl={ctl} modals={<EventDetailModals ctl={ctl} />} />;
  return <><EventDetailBody ctl={ctl} /><EventDetailModals ctl={ctl} /></>;
}
