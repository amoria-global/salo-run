"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import PayNowModal, { Payment as PayNowPayment } from '../../components/UnlockModal';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';

// ── Icons ──────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaymentDeclaration {
  id: string;
  eventId: string;
  eventTitle: string;
  photographerName: string;
  photographerImage: string | null;
  amount: number;
  currencyAbbreviation: string;
  paymentType: string;
  status: string;
  paidAmount: number;
  dueDate: string | null;
  createdAt: string;
  escrowStatus: string | null;
  escrowPercentage: number | null;
  heldAmount: number;
  releasedAmount: number;
  eventCompletionStatus: string | null;
  withdrawableAmount: number;
  deliveryHeldAmount: number;
  deliveryHeldReleased: boolean;
  amountInUsd: number;
  paidAmountInUsd: number;
}

interface PaymentDetailPageProps {
  userRole: 'client' | 'event-coordinator';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return '#10B981';
    case 'PAID': return '#10B981';
    case 'PENDING': return '#F59E0B';
    case 'PARTIAL': return '#3B82F6';
    case 'FAILED': return '#EF4444';
    case 'REFUNDED': return '#6B7280';
    default: return '#6B7280';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'Paid';
    case 'PAID': return 'Paid';
    case 'PENDING': return 'Pending';
    case 'PARTIAL': return 'Partially Paid';
    case 'FAILED': return 'Failed';
    case 'REFUNDED': return 'Refunded';
    default: return status || 'Unknown';
  }
};

const getEscrowStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'HELD': return '#3B82F6';
    case 'PENDING_HOLD': return '#F59E0B';
    case 'RELEASED': return '#10B981';
    default: return '#6B7280';
  }
};

const getEscrowStatusLabel = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'HELD': return 'Held in Escrow';
    case 'PENDING_HOLD': return 'Pending Hold';
    case 'RELEASED': return 'Released';
    default: return status || 'None';
  }
};

const getPaymentTypeColor = (type: string): string => {
  switch (type?.toUpperCase()) {
    case 'BOOKING': return '#083A85';
    case 'TIP': return '#16A34A';
    case 'GIFT': return '#F20C8F';
    case 'STREAM_TICKET': return '#EF4444';
    default: return '#6B7280';
  }
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${month} ${day}, ${year} at ${displayHour}:${minutes} ${ampm}`;
};

const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// ── Component ──────────────────────────────────────────────────────────────────

const PaymentDetailPage: React.FC<PaymentDetailPageProps> = ({ userRole }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { token } = useDashboardAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  // Pop-animate the main card if arrived via "Go to notification" for this id.
  const highlightId = useHighlightOnMount();
  const shouldHighlight = highlightId != null && highlightId === id;

  const [payment, setPayment] = useState<PaymentDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayNowModal, setShowPayNowModal] = useState(false);

  const fetchPayment = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/payments/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Payment not found.');
        } else {
          setError('Failed to load payment details. Please try again.');
        }
        setLoading(false);
        return;
      }
      const result = await res.json();
      const data = result.data || result;
      setPayment({
        id: data.id,
        eventId: data.eventId,
        eventTitle: data.eventTitle || 'Untitled Event',
        photographerName: data.photographerName || 'Unknown Photographer',
        photographerImage: normalizeImageUrl(data.photographerImage) || null,
        amount: Number(data.amount) || 0,
        currencyAbbreviation: data.currencyAbbreviation || 'USD',
        paymentType: data.paymentType || 'BOOKING',
        status: data.status || 'PENDING',
        paidAmount: Number(data.paidAmount) || 0,
        dueDate: data.dueDate || null,
        createdAt: data.createdAt || '',
        escrowStatus: data.escrowStatus || null,
        escrowPercentage: data.escrowPercentage != null ? Number(data.escrowPercentage) : null,
        heldAmount: Number(data.heldAmount) || 0,
        releasedAmount: Number(data.releasedAmount) || 0,
        eventCompletionStatus: data.eventCompletionStatus || null,
        withdrawableAmount: Number(data.withdrawableAmount) || 0,
        deliveryHeldAmount: Number(data.deliveryHeldAmount) || 0,
        deliveryHeldReleased: Boolean(data.deliveryHeldReleased),
        amountInUsd: Number(data.amountInUsd ?? data.amount) || 0,
        paidAmountInUsd: Number(data.paidAmountInUsd ?? data.paidAmount) || 0,
      });
    } catch (err) {
      console.error('Failed to fetch payment:', err);
      setError('An error occurred while loading payment details.');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const remainingBalance = payment ? payment.amountInUsd - payment.paidAmountInUsd : 0;
  const paymentProgress = payment && payment.amountInUsd > 0
    ? Math.min((payment.paidAmountInUsd / payment.amountInUsd) * 100, 100)
    : 0;

  const isBooking = payment?.paymentType?.toUpperCase() === 'BOOKING';
  const canPay = payment && (payment.status?.toUpperCase() === 'PENDING' || payment.status?.toUpperCase() === 'PARTIAL');
  const isPaid = payment && (payment.status?.toUpperCase() === 'COMPLETED' || payment.status?.toUpperCase() === 'PAID');

  // 70/30 breakdown helpers
  const has7030Split = isBooking && payment?.escrowPercentage === 70;
  const totalEscrowAmount = payment ? payment.withdrawableAmount + payment.deliveryHeldAmount : 0;
  const withdrawablePercent = totalEscrowAmount > 0
    ? (payment!.withdrawableAmount / totalEscrowAmount) * 100
    : 70;
  const deliveryHeldPercent = totalEscrowAmount > 0
    ? (payment!.deliveryHeldAmount / totalEscrowAmount) * 100
    : 30;

  const handlePayNow = () => {
    if (!payment) return;
    setShowPayNowModal(true);
  };

  // Convert PaymentDeclaration to the Payment type expected by PayNowModal
  const payNowPayment: PayNowPayment | null = payment ? {
    id: typeof payment.id === 'string' ? parseInt(payment.id, 10) || 0 : payment.id as unknown as number,
    declarationId: String(payment.id),
    eventId: payment.eventId,
    date: payment.createdAt,
    eventName: payment.eventTitle,
    eventType: payment.paymentType,
    photographerName: payment.photographerName,
    photographerImage: payment.photographerImage || '',
    method: '',
    amount: `${payment.currencyAbbreviation} ${payment.amount}`,
    amountNum: payment.amount,
    paidAmount: payment.paidAmount,
    status: payment.status?.toLowerCase() as any,
    invoiceNumber: `INV-${String(payment.id).substring(0, 8).toUpperCase()}`,
  } : null;

  const handleDownloadReceipt = () => {
    if (!payment) return;
    const invoiceNumber = `INV-${String(payment.id).substring(0, 8).toUpperCase()}`;
    const receiptContent = `
=====================================
        PAYMENT RECEIPT
=====================================

Invoice: ${invoiceNumber}
Date: ${formatDateTime(payment.createdAt)}
Status: ${getStatusLabel(payment.status)}

Event: ${payment.eventTitle}
Photographer: ${payment.photographerName}
Payment Type: ${payment.paymentType}

Amount: ${payment.currencyAbbreviation} ${payment.amount}
Paid: ${payment.currencyAbbreviation} ${payment.paidAmount}
Remaining: ${payment.currencyAbbreviation} ${Math.max(payment.amount - payment.paidAmount, 0)}
${isBooking && payment.escrowPercentage ? `
Escrow: ${payment.escrowPercentage}%
Escrow Status: ${getEscrowStatusLabel(payment.escrowStatus || '')}
` : ''}
=====================================
    Thank you for using Connekt
=====================================
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoBack = () => {
    router.back();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar userRole={userRole} />
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${colors.borderPrimary}`,
                borderTopColor: '#083A85',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: colors.textSecondary, fontSize: '0.95rem' }}>Loading payment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !payment) {
    return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar userRole={userRole} />
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                {error || 'Payment not found'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
                The payment you are looking for may have been removed or does not exist.
              </p>
              <button
                onClick={handleGoBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#083A85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeftIcon />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .pd-two-col {
            grid-template-columns: 1fr !important;
          }
          .pd-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .pd-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .pd-amount-grid {
            grid-template-columns: 1fr !important;
          }
          .pd-action-buttons {
            flex-direction: column !important;
          }
          .pd-action-buttons button {
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .pd-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div className={shouldHighlight ? 'pd-main-content notif-highlight-pop' : 'pd-main-content'} style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem' }}>

          {/* ── Back Button ────────────────────────────────────────────── */}
          <button
            onClick={handleGoBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '0.25rem 0',
              marginBottom: '1.25rem',
            }}
          >
            <ArrowLeftIcon />
            Back to Payments
          </button>

          {/* ── Payment Header ─────────────────────────────────────────── */}
          <div
            className="pd-header-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: colors.textPrimary, margin: 0, lineHeight: '1.3' }}>
                {payment.eventTitle}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {/* Payment type badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: getPaymentTypeColor(payment.paymentType),
                  borderRadius: '9999px',
                  padding: '0.25rem 0.75rem',
                }}>
                  <CreditCardIcon />
                  {payment.paymentType}
                </span>
                {/* Status badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: getStatusColor(payment.status),
                  backgroundColor: getStatusColor(payment.status) + '18',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.75rem',
                  border: `1px solid ${getStatusColor(payment.status)}40`,
                }}>
                  {getStatusLabel(payment.status)}
                </span>
                {/* Invoice number */}
                <span style={{
                  fontSize: '0.75rem',
                  color: colors.textSecondary,
                  fontFamily: 'monospace',
                }}>
                  INV-{String(payment.id).substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* ── Two Column Layout ──────────────────────────────────────── */}
          <div className="pd-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>

            {/* ── Left Column ────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Payment Amount Card ──────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <CreditCardIcon />
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Payment Amount</h2>
                </div>

                {/* Amount display */}
                <div style={{
                  textAlign: 'center',
                  padding: '1.5rem 0',
                  marginBottom: '1.25rem',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.15)' : 'rgba(8, 58, 133, 0.04)',
                  borderRadius: '0.75rem',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.3)' : 'rgba(8, 58, 133, 0.1)'}`,
                }}>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Amount</div>
                  <div style={{
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                    lineHeight: '1.2',
                  }}>
                    {formatPrice(payment.amountInUsd)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                    {payment.currencyAbbreviation} {payment.amount.toLocaleString()}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Payment Progress</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textPrimary }}>{paymentProgress.toFixed(0)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: colors.borderPrimary,
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${paymentProgress}%`,
                      height: '100%',
                      backgroundColor: paymentProgress >= 100 ? '#10B981' : '#083A85',
                      borderRadius: '9999px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Amount breakdown grid */}
                <div className="pd-amount-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    border: `1px solid ${colors.borderPrimary}`,
                  }}>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Paid</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10B981' }}>
                      {formatPrice(payment.paidAmountInUsd)}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    border: `1px solid ${colors.borderPrimary}`,
                  }}>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Remaining</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: remainingBalance > 0 ? '#F59E0B' : '#10B981' }}>
                      {formatPrice(Math.max(remainingBalance, 0))}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    border: `1px solid ${colors.borderPrimary}`,
                  }}>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Currency</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary }}>
                      {payment.currencyAbbreviation}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Milestone / Escrow Card (BOOKING only) ────────────── */}
              {isBooking && payment.escrowPercentage && (
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  padding: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{ color: '#3B82F6' }}><ShieldIcon /></span>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Escrow & Milestone</h2>
                  </div>

                  {/* Escrow overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      backgroundColor: colors.bgPrimary,
                      borderRadius: '0.5rem',
                      padding: '0.875rem',
                      border: `1px solid ${colors.borderPrimary}`,
                    }}>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Escrow Percentage</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3B82F6' }}>
                        {payment.escrowPercentage}%
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: colors.bgPrimary,
                      borderRadius: '0.5rem',
                      padding: '0.875rem',
                      border: `1px solid ${colors.borderPrimary}`,
                    }}>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Escrow Status</div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: getEscrowStatusColor(payment.escrowStatus || ''),
                        marginTop: '0.15rem',
                      }}>
                        {payment.escrowStatus?.toUpperCase() === 'HELD' ? <LockIcon /> : <UnlockIcon />}
                        {getEscrowStatusLabel(payment.escrowStatus || '')}
                      </div>
                    </div>
                  </div>

                  {/* Held / Released amounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      backgroundColor: colors.bgPrimary,
                      borderRadius: '0.5rem',
                      padding: '0.875rem',
                      border: `1px solid ${colors.borderPrimary}`,
                    }}>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Held Amount</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F59E0B' }}>
                        {formatPrice(payment.heldAmount)}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: colors.bgPrimary,
                      borderRadius: '0.5rem',
                      padding: '0.875rem',
                      border: `1px solid ${colors.borderPrimary}`,
                    }}>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Released Amount</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10B981' }}>
                        {formatPrice(payment.releasedAmount)}
                      </div>
                    </div>
                  </div>

                  {/* 70/30 Delivery-hold breakdown */}
                  {has7030Split && (
                    <div style={{
                      backgroundColor: actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: `1px solid ${actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'}`,
                    }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.875rem' }}>
                        70/30 Delivery-Hold Breakdown
                      </div>

                      {/* Visual progress bar for 70/30 split */}
                      <div style={{
                        display: 'flex',
                        height: '12px',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        marginBottom: '0.75rem',
                        backgroundColor: colors.borderPrimary,
                      }}>
                        <div
                          style={{
                            width: `${withdrawablePercent}%`,
                            backgroundColor: '#10B981',
                            transition: 'width 0.5s ease',
                          }}
                          title={`Withdrawable: ${withdrawablePercent.toFixed(0)}%`}
                        />
                        <div
                          style={{
                            width: `${deliveryHeldPercent}%`,
                            backgroundColor: payment.deliveryHeldReleased ? '#3B82F6' : '#F59E0B',
                            transition: 'width 0.5s ease',
                          }}
                          title={`Delivery Held: ${deliveryHeldPercent.toFixed(0)}%`}
                        />
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                          <div>
                            <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Withdrawable </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10B981' }}>
                              {formatPrice(payment.withdrawableAmount)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: payment.deliveryHeldReleased ? '#3B82F6' : '#F59E0B',
                          }} />
                          <div>
                            <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Held for Delivery </span>
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: payment.deliveryHeldReleased ? '#3B82F6' : '#F59E0B',
                            }}>
                              {formatPrice(payment.deliveryHeldAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery held released status */}
                      <div style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: payment.deliveryHeldReleased ? '#10B981' : '#F59E0B',
                      }}>
                        {payment.deliveryHeldReleased ? (
                          <>
                            <span style={{ color: '#10B981' }}><CheckCircleIcon /></span>
                            Delivery-held funds have been released
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#F59E0B' }}><ClockIcon /></span>
                            Delivery-held funds are pending release
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event completion status */}
                  {payment.eventCompletionStatus && (
                    <div style={{
                      marginTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      color: payment.eventCompletionStatus === 'COMPLETED' ? '#10B981' : colors.textSecondary,
                      fontWeight: '500',
                    }}>
                      {payment.eventCompletionStatus === 'COMPLETED' ? (
                        <span style={{ color: '#10B981' }}><CheckCircleIcon /></span>
                      ) : (
                        <span style={{ color: colors.textSecondary }}><ClockIcon /></span>
                      )}
                      Event: {payment.eventCompletionStatus === 'COMPLETED' ? 'Completed' : payment.eventCompletionStatus?.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              )}

              {/* ── Payment Timeline ──────────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ color: colors.textSecondary }}><ClockIcon /></span>
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Payment Timeline</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {/* Created */}
                  <TimelineItem
                    colors={colors}
                    icon={<CalendarIcon />}
                    label="Created"
                    date={formatDateTime(payment.createdAt)}
                    dotColor="#3B82F6"
                    isLast={!payment.dueDate && !isPaid}
                  />
                  {/* Due date */}
                  {payment.dueDate && (
                    <TimelineItem
                      colors={colors}
                      icon={<CalendarIcon />}
                      label="Due Date"
                      date={formatDateShort(payment.dueDate)}
                      dotColor={isPaid ? '#10B981' : new Date(payment.dueDate) < new Date() ? '#EF4444' : '#F59E0B'}
                      isLast={!isPaid}
                    />
                  )}
                  {/* Paid date (if completed) */}
                  {isPaid && (
                    <TimelineItem
                      colors={colors}
                      icon={<CheckCircleIcon />}
                      label="Payment Completed"
                      date={formatDateTime(payment.createdAt)}
                      dotColor="#10B981"
                      isLast={true}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Column ───────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Action Buttons ─────────────────────────────────────── */}
              <div
                className="pd-action-buttons"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {canPay && (
                  <button
                    onClick={handlePayNow}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      border: '2px solid #062a63',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <CreditCardIcon />
                    Pay Now {remainingBalance > 0 ? `(${formatPrice(remainingBalance)})` : ''}
                  </button>
                )}
                {isPaid && (
                  <button
                    onClick={handleDownloadReceipt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                      color: actualTheme === 'dark' ? '#93C5FD' : '#083A85',
                      border: `2px solid ${actualTheme === 'dark' ? '#2563EB40' : '#083A8530'}`,
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <DownloadIcon />
                    Download Receipt
                  </button>
                )}
              </div>

              {/* ── Photographer Info Card ──────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Photographer</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: `2px solid ${colors.borderPrimary}`,
                  }}>
                    <UserIcon />
                    {payment.photographerImage && (
                      <img
                        src={payment.photographerImage}
                        alt={payment.photographerName}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                      {payment.photographerName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.15rem' }}>
                      Photographer
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Quick Info Card ────────────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '1rem' }}>Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <InfoRow
                    label="Event"
                    value={payment.eventTitle}
                    colors={colors}
                  />
                  <InfoRow
                    label="Payment Type"
                    value={payment.paymentType}
                    colors={colors}
                  />
                  <InfoRow
                    label="Status"
                    value={getStatusLabel(payment.status)}
                    colors={colors}
                    valueColor={getStatusColor(payment.status)}
                  />
                  <InfoRow
                    label="Created"
                    value={formatDateShort(payment.createdAt)}
                    colors={colors}
                  />
                  {payment.dueDate && (
                    <InfoRow
                      label="Due Date"
                      value={formatDateShort(payment.dueDate)}
                      colors={colors}
                    />
                  )}
                  {isBooking && payment.escrowPercentage && (
                    <InfoRow
                      label="Escrow"
                      value={`${payment.escrowPercentage}% - ${getEscrowStatusLabel(payment.escrowStatus || '')}`}
                      colors={colors}
                      valueColor={getEscrowStatusColor(payment.escrowStatus || '')}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Now Modal */}
      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
        onPaymentSuccess={() => {
          setShowPayNowModal(false);
          fetchPayment();
        }}
      />
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, colors, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{label}</span>
    <span style={{
      fontSize: '0.85rem',
      fontWeight: '600',
      color: valueColor || colors.textPrimary,
      maxWidth: '60%',
      textAlign: 'right',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  </div>
);

interface TimelineItemProps {
  colors: any;
  icon: React.ReactNode;
  label: string;
  date: string;
  dotColor: string;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ colors, icon, label, date, dotColor, isLast }) => (
  <div style={{ display: 'flex', gap: '0.875rem', position: 'relative' }}>
    {/* Vertical line */}
    {!isLast && (
      <div style={{
        position: 'absolute',
        left: '11px',
        top: '24px',
        width: '2px',
        height: 'calc(100% - 4px)',
        backgroundColor: colors.borderPrimary,
      }} />
    )}
    {/* Dot */}
    <div style={{
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: dotColor + '20',
      border: `2px solid ${dotColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      zIndex: 1,
    }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor }} />
    </div>
    {/* Content */}
    <div style={{ paddingBottom: isLast ? '0' : '1.5rem', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: colors.textSecondary, marginBottom: '0.15rem' }}>
        {icon}
        <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{label}</span>
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>
        {date}
      </div>
    </div>
  </div>
);

export default PaymentDetailPage;
