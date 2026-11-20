'use client';

// app/pages/client/payment-detail.tsx's state, effects and handlers, moved verbatim (no behaviour change).

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import PayNowModal, { Payment as PayNowPayment } from '@/app/components/UnlockModal';
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

export interface PaymentDeclaration {
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
  heldAmountInUsd: number;
  releasedAmountInUsd: number;
  withdrawableAmountInUsd: number;
  deliveryHeldAmountInUsd: number;
}

export interface PaymentDetailPageProps {
  userRole: 'client' | 'event-coordinator';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export const getStatusColor = (status: string): string => {
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

export const getStatusLabel = (status: string): string => {
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

export const getEscrowStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'HELD': return '#3B82F6';
    case 'PENDING_HOLD': return '#F59E0B';
    case 'RELEASED': return '#10B981';
    default: return '#6B7280';
  }
};

export const getEscrowStatusLabel = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'HELD': return 'Held in Escrow';
    case 'PENDING_HOLD': return 'Pending Hold';
    case 'RELEASED': return 'Released';
    default: return status || 'None';
  }
};

export const getPaymentTypeColor = (type: string): string => {
  switch (type?.toUpperCase()) {
    case 'BOOKING': return '#083A85';
    case 'TIP': return '#16A34A';
    case 'GIFT': return '#F20C8F';
    case 'STREAM_TICKET': return '#EF4444';
    default: return '#6B7280';
  }
};

export const formatDateTime = (dateStr: string | null): string => {
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

export const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// ── Component ──────────────────────────────────────────────────────────────────


export function usePaymentDetail(userRole: PaymentDetailPageProps['userRole']) {
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
    // Cookie-only sessions have no JS-readable token. dashboardAuthFetch
    // sends the HttpOnly cookie regardless, so gate only on id.
    if (!id) return;
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
        heldAmountInUsd: Number(data.heldAmountInUsd ?? data.heldAmount) || 0,
        releasedAmountInUsd: Number(data.releasedAmountInUsd ?? data.releasedAmount) || 0,
        withdrawableAmountInUsd: Number(data.withdrawableAmountInUsd ?? data.withdrawableAmount) || 0,
        deliveryHeldAmountInUsd: Number(data.deliveryHeldAmountInUsd ?? data.deliveryHeldAmount) || 0,
      });
    } catch (err) {
      console.error('Failed to fetch payment:', err);
      setError('An error occurred while loading payment details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    amount: formatPrice(payment.amount, payment.currencyAbbreviation),
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


  return {
    colors,
    actualTheme,
    formatPrice,
    token,
    router,
    params,
    id,
    highlightId,
    shouldHighlight,
    payment,
    setPayment,
    loading,
    setLoading,
    error,
    setError,
    showPayNowModal,
    setShowPayNowModal,
    fetchPayment,
    remainingBalance,
    paymentProgress,
    isBooking,
    canPay,
    isPaid,
    has7030Split,
    totalEscrowAmount,
    withdrawablePercent,
    deliveryHeldPercent,
    handlePayNow,
    payNowPayment,
    handleDownloadReceipt,
    handleGoBack,
    userRole,
  };
}

export type PaymentDetailController = ReturnType<typeof usePaymentDetail>;
