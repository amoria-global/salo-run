'use client';

// app/pages/event-coordinator/payments.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import PaymentCurrencyPreview from '@/app/components/PaymentCurrencyPreview';
import { useTheme } from '@/app/context/ThemeContext';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { HeartIcon } from '@/app/components/UnlockModal';
import WithdrawModal from '@/app/components/WithdrawModal';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { initiateBookingPayment, pollPaymentStatus, getTelecomProvider, getPaymentMethodType, releaseEscrowFunds, isSurveyCompleted } from '@/lib/xentripay';
import { PaymentMethodPicker, type PaymentMethodSelection } from '@/app/components/payments/PaymentMethodPicker';
import { usePaymentCountry } from '@/lib/payments/usePaymentCountry';
import InternationalPhoneInput, { type PhoneValue } from '@/app/components/phone/InternationalPhoneInput';
import { parsePhone } from '@/lib/phone/phoneKit';
import { iconForOperator } from '@/lib/payments/operatorIcons';
import type { PaymentOperator } from '@/lib/payments/types';
import { getApiUrl } from '@/lib/api';
import SatisfactionSurveyModal from '@/app/components/SatisfactionSurveyModal';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

// The backend sends COMPLETED / PARTIAL / PENDING. Lowercasing them gave
// 'completed' and 'partial', which never matched 'paid', so Paid was always 0.
export const mapCoordinatorStatus = (apiStatus?: string): PaymentStatus => {
  switch ((apiStatus || '').toUpperCase()) {
    case 'COMPLETED': case 'PAID': return 'paid';
    case 'PARTIAL': case 'PARTIALLY_PAID': return 'partially_paid';
    case 'FAILED': return 'failed';
    case 'REFUNDED': return 'refunded';
    default: return 'pending';
  }
};

export interface Payment {
  id: number;
  declarationId?: string;
  eventId?: string;
  date: string;
  eventName: string;
  eventType: string;
  photographerName: string;
  photographerImage: string;
  method: string;
  amount: string;
  amountNum: number;
  paidAmount: number;
  status: PaymentStatus;
  invoiceNumber: string;
  escrowStatus?: string;
  escrowPercentage?: number;
  heldAmount?: number;
  releasedAmount?: number;
  eventCompletionStatus?: string;
}


export type ChartType = 'line' | 'bar' | 'scatter';

export function useCoordinatorPayments() {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { profile } = useUserProfile();
  const { user, token } = useDashboardAuth();
  const router = useRouter();
  const [activeTimeFilter, setActiveTimeFilter] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1W');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [apiPayments, setApiPayments] = useState<Payment[]>([]);

  // Fetch wallet for compact summary
  useEffect(() => {
    let cancelled = false;
    getMyWallet().then(w => { if (!cancelled) setWallet(w); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  // Glass view only: whether the list has answered once, so it shows a skeleton instead of an empty state first.
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [streamFeeEvents, setStreamFeeEvents] = useState<Array<{
    id: string;
    eventTitle: string;
    viewerName: string;
    viewerEmail: string;
    date: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
  }>>([]);
  const [totalStreamingRevenue, setTotalStreamingRevenue] = useState(0);
  const [giftPayments, setGiftPayments] = useState<Array<{
    id: string;
    eventTitle: string;
    amount: number;
    netAmount: number;
    currency: string;
    giftMessage: string | null;
    customerPhone: string;
    method: string;
    status: string;
    date: string;
  }>>([]);
  const [totalGiftRevenue, setTotalGiftRevenue] = useState(0);

  // Fetch payments from coordinator API
  const fetchPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/payments`);
      const result = response.ok ? await response.json() : null;
      // HTTP 200 with action 0 is a failure; say so instead of showing $0.
      if (!result || result.action !== 1) {
        setPaymentsError(result?.message || 'Could not load payments. Please refresh.');
      } else {
        setPaymentsError(null);
        const data = result?.data?.content || result?.data || [];
        if (data.length > 0) {
          const mapped: Payment[] = data.map((p: any, idx: number) => ({
            id: p.id || idx + 1,
            declarationId: p.declarationId || p.id?.toString(),
            eventId: p.eventId,
            date: p.date || p.createdAt || '',
            eventName: p.eventName || p.description || '',
            eventType: p.eventType || '',
            photographerName: p.photographerName || '',
            photographerImage: p.photographerImage || undefined,
            method: p.method || p.paymentMethod || '-',
            // amountNum is USD; the label used to put "$" on the booking-currency amount.
            amount: `${Number(p.amountInUsd ?? p.amount ?? 0).toFixed(2)}`,
            amountNum: p.amountInUsd ?? p.amount ?? p.amountNum ?? 0,
            paidAmount: p.paidAmountInUsd ?? p.paidAmount ?? 0,
            status: mapCoordinatorStatus(p.status),
            invoiceNumber: p.invoiceNumber || `INV-${p.id || idx + 1}`,
            escrowStatus: p.escrowStatus || 'NONE',
            escrowPercentage: p.escrowPercentage || null,
            heldAmount: Number(p.heldAmount) || 0,
            releasedAmount: Number(p.releasedAmount) || 0,
            eventCompletionStatus: p.eventCompletionStatus || 'NOT_COMPLETED',
          }));
          setApiPayments(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPaymentsError('Could not load payments. Please refresh.');
    } finally {
      setIsLoadingPayments(false);
      setPaymentsLoaded(true);
    }
  }, []);

  // Fetch streaming payments from dedicated endpoint
  const fetchStreams = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/payments/streaming`);
      if (response.ok) {
        const result = await response.json();
        if (result?.action !== 1) throw new Error(result?.message || 'stream payments failed');
        const data = result?.data?.content || result?.data || [];
        if (result?.totalStreamingRevenue !== undefined) {
          setTotalStreamingRevenue(result.totalStreamingRevenue);
        }
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id || '',
            eventTitle: p.eventTitle || p.description || 'Live Stream',
            viewerName: p.viewerName || 'Unknown Viewer',
            viewerEmail: p.viewerEmail || '',
            date: p.createdAt || p.date || '',
            amount: p.amount || 0,
            currency: p.currencyAbbreviation || 'RWF',
            method: p.paymentMethod || p.method || '-',
            status: (p.status || 'pending').toLowerCase(),
          }));
          // No fallback total: a 0 wallet bucket is real, and summing these
          // gross booking-currency rows as USD overstated revenue about 1,460x.
          setStreamFeeEvents(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch streaming payments:', err);
    }
  }, []);

  // Fetch gift payments
  const fetchGifts = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/payments?type=GIFT&page=0&size=100`);
      if (response.ok) {
        const result = await response.json();
        if (result?.action !== 1) throw new Error(result?.message || 'gift payments failed');
        const data = result?.data?.content || result?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id || '',
            eventTitle: p.eventTitle || 'Live Stream',
            // Both in USD so they match the label; the share comes from the
            // backend split, never an assumed 65%.
            amount: Number(p.amountInUsd ?? 0),
            netAmount: Number(p.withdrawableAmountInUsd ?? 0),
            currency: 'USD',
            giftMessage: p.giftMessage || null,
            customerPhone: p.senderName || p.viewerName || p.customerPhone || p.viewerEmail || '',
            method: p.paymentMethod || '-',
            status: (p.status || 'pending').toLowerCase(),
            date: p.paymentCompletedAt || p.dueDate || p.createdAt || '',
          }));
          setGiftPayments(mapped);
          setTotalGiftRevenue(mapped.filter((g: { status: string }) => g.status === 'completed').reduce((sum: number, g: { netAmount: number }) => sum + g.netAmount, 0));
        }
      }
    } catch (err) {
      console.error('Failed to fetch gift payments:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchPayments();
      fetchStreams();
      fetchGifts();
    }
  }, [user?.id, fetchPayments, fetchStreams, fetchGifts]);

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handlePayNow = (payment: Payment) => {
    setPayNowPayment(payment);
    setShowPayNowModal(true);
  };

  const handleDownloadReceipt = (payment: Payment) => {
    const receiptContent = `
=====================================
        PAYMENT RECEIPT
=====================================

Invoice: ${payment.invoiceNumber}
Date: ${payment.date}
Status: ${payment.status}

Event: ${payment.eventName}
Photographer: ${payment.photographerName}
Payment Method: ${payment.method}

Amount: ${formatPrice(payment.amountNum)}

=====================================
    Thank you for using Connekt
=====================================
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derive spending chart data from actual payments
  const spendingData = (() => {
    if (apiPayments.length === 0) return [];
    const grouped: Record<string, number> = {};
    apiPayments.forEach(p => {
      if (!p.date) return;
      const d = new Date(p.date);
      const label = isNaN(d.getTime()) ? p.date.substring(0, 6) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[label] = (grouped[label] || 0) + p.amountNum;
    });
    return Object.entries(grouped).slice(-7).map(([date, value]) => ({ date, value }));
  })();

  const payments: Payment[] = apiPayments;

  // Calculate totals
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountNum, 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'partially_paid').reduce((sum, p) => sum + (p.amountNum - p.paidAmount), 0);
  const totalFailed = payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amountNum, 0);

  const totalStreamFees = totalStreamingRevenue;

  // State for stream fee events (no individual payer modal needed)
  const [selectedStreamFeeEvent, setSelectedStreamFeeEvent] = useState<typeof streamFeeEvents[0] | null>(null);

  // Whether user already has a withdrawal method set
  const [hasWithdrawalMethod, setHasWithdrawalMethod] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/preferences`);
        if (res.ok) {
          const result = await res.json();
          const prefs = result.data || {};
          setHasWithdrawalMethod(Object.keys(prefs).some(k => k.startsWith('payment_method_')));
        }
      } catch { /* ignore */ }
    })();
  }, [user]);

  // State for stream fee withdrawal modal
  const [showStreamFeeWithdrawModal, setShowStreamFeeWithdrawModal] = useState(false);
  const [selectedStreamFeePaymentMethod, setSelectedStreamFeePaymentMethod] = useState<string | null>(null);
  const [streamFeePaymentDetails, setStreamFeePaymentDetails] = useState({
    mtnNumber: '',
    airtelNumber: '',
    selectedBank: '',
    bankAccountNumber: '',
    bankAccountName: ''
  });
  // Per-network validity of the payout phone numbers (from InternationalPhoneInput).
  const [streamFeePhoneValid, setStreamFeePhoneValid] = useState({ mtn: false, airtel: false });
  // Default the payout phone's country to the coordinator's saved profile phone.
  const streamFeePhoneDefaultIso2 = React.useMemo(
    () => parsePhone(`${profile.phoneCode || ''}${profile.phoneNumber || ''}`).country?.iso2 ?? null,
    [profile.phoneCode, profile.phoneNumber]
  );
  const [bankProviders, setBankProviders] = useState<{ id: string; name: string }[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load bank providers when withdrawal modal opens
  useEffect(() => {
    if (!showStreamFeeWithdrawModal) return;
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/withdrawals/xentripay/providers`)
      .then(res => res.json())
      .then(result => setBankProviders(result?.data?.banks || []))
      .catch(() => setBankProviders([]));
  }, [showStreamFeeWithdrawModal, user]);

  // Check if Rwanda requires mobile money selection
  const isRwanda = profile.country === 'Rwanda';
  const hasMobileMoneySelected = selectedStreamFeePaymentMethod === 'mtn' || selectedStreamFeePaymentMethod === 'airtel';

  // Validate that Rwanda users have selected a mobile money option
  const validateStreamFeePaymentMethod = (): boolean => {
    if (isRwanda && !hasMobileMoneySelected) {
      setValidationError('For users in Rwanda, you must select either MTN or Airtel Mobile Money as a payment method.');
      return false;
    }
    if (selectedStreamFeePaymentMethod === 'mtn' && !streamFeePhoneValid.mtn) {
      setValidationError('Please enter a valid MTN phone number.');
      return false;
    }
    if (selectedStreamFeePaymentMethod === 'airtel' && !streamFeePhoneValid.airtel) {
      setValidationError('Please enter a valid Airtel phone number.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const resultsPerPage = 8;
  const totalResults = payments.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));
  const paginatedPayments = payments.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);


  return {
    paymentsLoaded,
    colors,
    actualTheme,
    formatPrice,
    profile,
    user,
    token,
    router,
    activeTimeFilter,
    setActiveTimeFilter,
    currentPage,
    setCurrentPage,
    chartType,
    setChartType,
    showReportModal,
    setShowReportModal,
    showPaymentModal,
    setShowPaymentModal,
    showPayNowModal,
    setShowPayNowModal,
    selectedPayment,
    setSelectedPayment,
    payNowPayment,
    setPayNowPayment,
    wallet,
    setWallet,
    apiPayments,
    setApiPayments,
    isLoadingPayments,
    setIsLoadingPayments,
    paymentsError,
    setPaymentsError,
    streamFeeEvents,
    setStreamFeeEvents,
    totalStreamingRevenue,
    setTotalStreamingRevenue,
    giftPayments,
    setGiftPayments,
    totalGiftRevenue,
    setTotalGiftRevenue,
    fetchPayments,
    fetchStreams,
    fetchGifts,
    handleViewPayment,
    handlePayNow,
    handleDownloadReceipt,
    spendingData,
    payments,
    totalPaid,
    totalPending,
    totalFailed,
    totalStreamFees,
    selectedStreamFeeEvent,
    setSelectedStreamFeeEvent,
    hasWithdrawalMethod,
    setHasWithdrawalMethod,
    showWithdrawModal,
    setShowWithdrawModal,
    showStreamFeeWithdrawModal,
    setShowStreamFeeWithdrawModal,
    selectedStreamFeePaymentMethod,
    setSelectedStreamFeePaymentMethod,
    streamFeePaymentDetails,
    setStreamFeePaymentDetails,
    streamFeePhoneValid,
    setStreamFeePhoneValid,
    streamFeePhoneDefaultIso2,
    bankProviders,
    setBankProviders,
    validationError,
    setValidationError,
    isRwanda,
    hasMobileMoneySelected,
    validateStreamFeePaymentMethod,
    resultsPerPage,
    totalResults,
    totalPages,
    paginatedPayments,
  };
}

export type CoordinatorPaymentsController = ReturnType<typeof useCoordinatorPayments>;
