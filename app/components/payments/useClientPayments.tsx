'use client';

// app/pages/client/payments.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { HeartIcon } from '@/app/components/UnlockModal';
import WithdrawModal from '@/app/components/WithdrawModal';
import { initiateBookingPayment, pollPaymentStatus, getTelecomProvider, getPaymentMethodType, sanitizeErrorMessage, releaseEscrowFunds, isSurveyCompleted } from '@/lib/xentripay';
import { PaymentMethodPicker, type PaymentMethodSelection } from '@/app/components/payments/PaymentMethodPicker';
import { usePaymentCountry } from '@/lib/payments/usePaymentCountry';
import InternationalPhoneInput, { type PhoneValue } from '@/app/components/phone/InternationalPhoneInput';
import { parsePhone } from '@/lib/phone/phoneKit';
import { iconForOperator } from '@/lib/payments/operatorIcons';
import type { PaymentOperator } from '@/lib/payments/types';
import { getApiUrl } from '@/lib/api';
import SatisfactionSurveyModal from '@/app/components/SatisfactionSurveyModal';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

export interface Payment {
  id: number;
  declarationId: string;
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

export function useClientPayments() {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { profile } = useUserProfile();
  const { token, user } = useDashboardAuth();
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

  // Fetch wallet for compact summary
  useEffect(() => {
    let cancelled = false;
    getMyWallet().then(w => { if (!cancelled) setWallet(w); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);


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

  const [spendingData, setSpendingData] = useState<{ date: string; value: number }[]>([]);

  const fetchSpendingTrend = useCallback(async (period: string) => {
    if (!user) return;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/customer/payments/spending-trend?period=${period}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const result = await response.json();
      const data = result.data;
      if (Array.isArray(data) && data.length > 0) {
        setSpendingData(data.map((item: any) => ({
          date: item.date,
          value: Number(item.value) || 0
        })));
      }
    } catch (err) {
      console.error('Failed to fetch spending trend:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchSpendingTrend(activeTimeFilter);
  }, [activeTimeFilter, fetchSpendingTrend]);

  const [payments, setPayments] = useState<Payment[]>([]);
  // Pop-highlight the matching row if arrived from "Go to notification".
  // Match on declarationId because `payment.id` is a display-only sequence.
  const highlightId = useHighlightOnMount();
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (highlightId && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, payments.length]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 8;

  // Map API status to frontend PaymentStatus
  const mapStatus = (apiStatus: string): PaymentStatus => {
    switch (apiStatus?.toUpperCase()) {
      case 'COMPLETED': return 'paid';
      case 'PENDING': return 'pending';
      case 'PARTIAL': return 'partially_paid';
      case 'FAILED': return 'failed';
      case 'REFUNDED': return 'refunded';
      default: return 'pending';
    }
  };

  // Format date from API LocalDateTime
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${month}, ${day} ${displayHour}:${minutes} ${ampm}`;
  };

  // Fetch payment history from API
  // Glass view only: whether the list has answered once, and whether the last load failed (the classic page ignores both).
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentsError, setPaymentsError] = useState(false);
  const fetchPayments = useCallback(async (page: number) => {
    if (!user) return;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/customer/payments?page=${page - 1}&size=${resultsPerPage}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) { setPaymentsError(true); setPaymentsLoaded(true); return; }
      const result = await response.json();
      const pageData = result.data;
      const content = pageData?.content || [];

      // Newest-created first. Mapped shape formats date string, so sort raw.
      content.sort((a: any, b: any) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      const mapped: Payment[] = content.map((item: any, index: number) => ({
        id: index + 1 + (page - 1) * resultsPerPage,
        declarationId: item.id,
        eventId: item.eventId,
        date: formatDate(item.createdAt),
        eventName: item.eventTitle || 'Untitled Event',
        eventType: item.paymentType || 'Booking',
        photographerName: item.photographerName || 'Unknown',
        photographerImage: item.photographerImage || undefined,
        method: '-',
        amount: formatPrice(Number(item.amount) || 0, item.currencyAbbreviation || undefined),
        amountNum: Number(item.amountInUsd ?? item.amount) || 0,
        paidAmount: Number(item.paidAmountInUsd ?? item.paidAmount) || 0,
        status: mapStatus(item.status),
        invoiceNumber: `INV-${String(item.id).substring(0, 8).toUpperCase()}`,
        escrowStatus: item.escrowStatus || 'NONE',
        escrowPercentage: item.escrowPercentage || null,
        heldAmount: Number(item.heldAmount) || 0,
        releasedAmount: Number(item.releasedAmount) || 0,
        eventCompletionStatus: item.eventCompletionStatus || 'NOT_COMPLETED',
      }));

      setPayments(mapped);
      setTotalPages(pageData?.totalPages || 1);
      setTotalResults(pageData?.totalElements || 0);
      setPaymentsError(false);
      setPaymentsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPaymentsError(true);
      setPaymentsLoaded(true);
    }
  }, [user, resultsPerPage]);

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage, fetchPayments]);

  // Balance totals from API
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [streamingEarnings, setStreamingEarnings] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/customer/payments/balance`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const result = await response.json();
      const data = result.action === 1 ? result.data : null; // HTTP 200 + action 0 is a failure
      if (data) {
        setTotalPaid(Number(data.totalPaid) || 0);
        setTotalPending(Number(data.totalPending) || 0);
        if (data.totalEarnings != null) setStreamingEarnings(Number(data.totalEarnings) || 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Report/stats data. Starts empty: this used to start from a hardcoded
  // sample ($1,200.13, "13 - 18 July 2025") that stayed on screen whenever
  // the stats request failed. /stats is lifetime, so the period says so.
  const [reportData, setReportData] = useState({
    period: 'All time',
    totalPaid: 0,
    pending: 0,
    failed: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/customer/payments/stats`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const result = await response.json();
      const data = result.action === 1 ? result.data : null;
      if (data) {
        setReportData({
          period: 'All time',
          totalPaid: Number(data.totalPaid) || 0,
          pending: Number(data.pending) || 0,
          failed: Number(data.failed) || 0,
          totalTransactions: Number(data.totalTransactions) || 0,
          completedTransactions: Number(data.completedTransactions) || 0,
          pendingTransactions: Number(data.pendingTransactions) || 0,
          failedTransactions: Number(data.failedTransactions) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Gifts data - organized by stream/event with gifters list
  const [giftStreams, setGiftStreams] = useState<{
    id: number;
    streamTitle: string;
    date: string;
    platform: string;
    gifters: { name: string; amount: number; message: string }[];
  }[]>([]);

  const fetchGiftStreams = useCallback(async () => {
    if (!user) return;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/customer/payments/gift-streams`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return;
      const result = await response.json();
      const data = result.data;
      if (Array.isArray(data)) {
        setGiftStreams(data.map((item: any, index: number) => ({
          id: index + 1,
          streamTitle: item.streamTitle || 'Untitled Stream',
          date: item.date || '',
          platform: item.platform || 'ConnektLive',
          gifters: (item.gifters || []).map((g: any) => ({
            name: g.name || 'Anonymous',
            amount: Number(g.amount) || 0,
            message: g.message || ''
          }))
        })));
      }
    } catch (err) {
      console.error('Failed to fetch gift streams:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchGiftStreams();
  }, [fetchGiftStreams]);

  const totalGifts = giftStreams.reduce((sum, stream) => sum + stream.gifters.reduce((s, g) => s + g.amount, 0), 0);

  // State for gift senders modal
  const [showGiftSendersModal, setShowGiftSendersModal] = useState(false);
  const [selectedGiftStream, setSelectedGiftStream] = useState<typeof giftStreams[0] | null>(null);

  // Whether user already has a withdrawal method set
  const [hasWithdrawalMethod, setHasWithdrawalMethod] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/preferences`);
        if (res.ok) {
          const result = await res.json();
          const prefs = result.data || {};
          const hasAccounts = Object.keys(prefs).some(k => k.startsWith('payment_method_'));
          setHasWithdrawalMethod(hasAccounts);
        }
      } catch { /* ignore */ }
    })();
  }, [user]);

  // State for gifts payment method modal
  const [showGiftsPaymentMethodModal, setShowGiftsPaymentMethodModal] = useState(false);
  const [selectedGiftPaymentMethod, setSelectedGiftPaymentMethod] = useState<string | null>(null);
  const [giftPaymentDetails, setGiftPaymentDetails] = useState({
    mtnNumber: '',
    airtelNumber: '',
    bankAccountNumber: '',
    bankAccountName: '',
    selectedBank: '',
  });
  // Per-network validity of the payout phone numbers (from InternationalPhoneInput).
  const [giftPhoneValid, setGiftPhoneValid] = useState({ mtn: false, airtel: false });
  // Default the payout phone's country to the user's saved profile phone.
  const giftPhoneDefaultIso2 = React.useMemo(
    () => parsePhone(`${profile.phoneCode || ''}${profile.phoneNumber || ''}`).country?.iso2 ?? null,
    [profile.phoneCode, profile.phoneNumber]
  );
  const [bankProviders, setBankProviders] = useState<{ id: string; name: string }[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load bank providers when modal opens
  useEffect(() => {
    if (!showGiftsPaymentMethodModal) return;
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/withdrawals/xentripay/providers`)
      .then(res => res.json())
      .then(result => setBankProviders(result?.data?.banks || []))
      .catch(() => setBankProviders([]));
  }, [showGiftsPaymentMethodModal, user]);

  // Validate payment method selection
  const validateGiftPaymentMethod = (): boolean => {
    if (!selectedGiftPaymentMethod) {
      setValidationError('Please select a payment method.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const [savingWithdrawal, setSavingWithdrawal] = useState(false);

  const saveWithdrawalMethod = async () => {
    if (!validateGiftPaymentMethod()) return;
    if (!selectedGiftPaymentMethod || !user) return;

    let methodType = '';
    let accountName = '';
    let accountNumber = '';
    let bankName = '';

    if (selectedGiftPaymentMethod === 'mtn') {
      if (!giftPaymentDetails.mtnNumber.trim() || !giftPhoneValid.mtn) {
        setValidationError('Please enter a valid MTN phone number.');
        return;
      }
      methodType = 'MOBILE_MONEY';
      accountName = 'MTN Mobile Money';
      accountNumber = giftPaymentDetails.mtnNumber.trim();
      bankName = 'MTN';
    } else if (selectedGiftPaymentMethod === 'airtel') {
      if (!giftPaymentDetails.airtelNumber.trim() || !giftPhoneValid.airtel) {
        setValidationError('Please enter a valid Airtel phone number.');
        return;
      }
      methodType = 'MOBILE_MONEY';
      accountName = 'Airtel Money';
      accountNumber = giftPaymentDetails.airtelNumber.trim();
      bankName = 'Airtel';
    } else if (selectedGiftPaymentMethod === 'bank') {
      if (!giftPaymentDetails.bankAccountNumber.trim() || !giftPaymentDetails.bankAccountName.trim() || !giftPaymentDetails.selectedBank) {
        setValidationError('Please fill in your bank, account number, and account holder name.');
        return;
      }
      methodType = 'BANK_TRANSFER';
      accountName = giftPaymentDetails.bankAccountName.trim();
      accountNumber = giftPaymentDetails.bankAccountNumber.trim();
      bankName = giftPaymentDetails.selectedBank;
    }

    setSavingWithdrawal(true);
    setValidationError(null);

    try {
      const apiUrl = getApiUrl();
      const params = new URLSearchParams({
        methodType,
        accountName,
        accountNumber,
        isDefault: 'true',
      });
      if (bankName) params.append('bankName', bankName);

      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/customer/withdrawal-methods?${params.toString()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const errResult = await response.json().catch(() => null);
        setValidationError(sanitizeErrorMessage(errResult?.message, 'Failed to save withdrawal method. Please try again.'));
        return;
      }

      // Success - close modal and reset
      setShowGiftsPaymentMethodModal(false);
      setSelectedGiftPaymentMethod(null);
      setGiftPaymentDetails({ mtnNumber: '', airtelNumber: '', bankAccountNumber: '', bankAccountName: '', selectedBank: '' });
      setGiftPhoneValid({ mtn: false, airtel: false });
      setValidationError(null);
      setHasWithdrawalMethod(true);
    } catch (err) {
      console.error('Failed to save withdrawal method:', err);
      setValidationError('Network error. Please check your connection and try again.');
    } finally {
      setSavingWithdrawal(false);
    }
  };

  const handleViewGiftSenders = (stream: typeof giftStreams[0]) => {
    setSelectedGiftStream(stream);
    setShowGiftSendersModal(true);
  };


  return {
    paymentsLoaded,
    paymentsError,
    retryPayments: () => fetchPayments(currentPage),
    colors,
    actualTheme,
    formatPrice,
    profile,
    token,
    user,
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
    handleViewPayment,
    handlePayNow,
    handleDownloadReceipt,
    spendingData,
    setSpendingData,
    fetchSpendingTrend,
    payments,
    setPayments,
    highlightId,
    highlightRowRef,
    totalPages,
    setTotalPages,
    totalResults,
    setTotalResults,
    resultsPerPage,
    mapStatus,
    formatDate,
    fetchPayments,
    totalPaid,
    setTotalPaid,
    totalPending,
    setTotalPending,
    totalFailed,
    setTotalFailed,
    streamingEarnings,
    setStreamingEarnings,
    fetchBalance,
    reportData,
    setReportData,
    fetchStats,
    giftStreams,
    setGiftStreams,
    fetchGiftStreams,
    totalGifts,
    showGiftSendersModal,
    setShowGiftSendersModal,
    selectedGiftStream,
    setSelectedGiftStream,
    hasWithdrawalMethod,
    setHasWithdrawalMethod,
    showWithdrawModal,
    setShowWithdrawModal,
    showGiftsPaymentMethodModal,
    setShowGiftsPaymentMethodModal,
    selectedGiftPaymentMethod,
    setSelectedGiftPaymentMethod,
    giftPaymentDetails,
    setGiftPaymentDetails,
    giftPhoneValid,
    setGiftPhoneValid,
    giftPhoneDefaultIso2,
    bankProviders,
    setBankProviders,
    validationError,
    setValidationError,
    validateGiftPaymentMethod,
    savingWithdrawal,
    setSavingWithdrawal,
    saveWithdrawalMethod,
    handleViewGiftSenders,
  };
}

export type ClientPaymentsController = ReturnType<typeof useClientPayments>;
