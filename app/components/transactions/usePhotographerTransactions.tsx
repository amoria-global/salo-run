'use client';

// app/pages/photographer/transaction.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import WithdrawModal from '@/app/components/WithdrawModal';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';
import { fetchPlatformConfig, type PlatformConfig, DEFAULT_CONFIG } from '@/lib/platformConfig';


export type TransactionStatus = 'completed' | 'pending' | 'in_progress' | 'withdrawn' | 'initiated';

export interface Transaction {
  id: number;
  date: string;
  clientName: string;
  clientImage: string;
  service: string;
  serviceType: string;
  method: string;
  amount: string;
  amountNum: number;
  status: TransactionStatus;
  transactionId: string;
  requestId: string;
}

export type ChartType = 'line' | 'bar' | 'scatter';

export function usePhotographerTransactions() {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const router = useRouter();
  const [activeTimeFilter, setActiveTimeFilter] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1W');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasPaymentAccount, setHasPaymentAccount] = useState<boolean | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/photographer/withdrawal-methods`)
      .then(res => res.json())
      .then(result => {
        const methods = result?.data || [];
        setHasPaymentAccount(methods.length > 0);
      })
      .catch(() => setHasPaymentAccount(null));
  }, []);

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    const receiptContent = `
=====================================
        TRANSACTION RECEIPT
=====================================

Transaction ID: ${transaction.transactionId}
Request ID: ${transaction.requestId}
Date: ${transaction.date}
Status: ${transaction.status}

Client: ${transaction.clientName}
Service: ${transaction.service}
Payment Method: ${transaction.method}

Amount: ${formatPrice(transaction.amountNum)}

=====================================
    Thank you for using Connekt
=====================================
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletError, setWalletError] = useState(false);
  const [earningsData, setEarningsData] = useState<{ date: string; value: number }[]>([]);
  const [tipsData, setTipsData] = useState<{ id: number; clientName: string; amount: number; date: string; eventName: string; message: string }[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [bonusStatus, setBonusStatus] = useState<{ status: string; amount?: number; currencyAbbreviation?: string; threshold?: number; completedEvents?: number; adminComment?: string }>({ status: 'NOT_ELIGIBLE' });

  function formatTxDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const h = d.getHours();
    return `${months[d.getMonth()]}, ${String(d.getDate()).padStart(2, '0')} ${String(h % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  function mapStatus(s: string): TransactionStatus {
    if (!s) return 'initiated';
    const u = s.toUpperCase();
    if (u === 'COMPLETED' || u === 'SUCCESS') return 'completed';
    if (u === 'PENDING') return 'pending';
    if (u === 'IN_PROGRESS' || u === 'PROCESSING') return 'in_progress';
    if (u === 'WITHDRAWN') return 'withdrawn';
    return 'initiated';
  }

  // Glass view only: whether the last history load failed (HTTP error, action 0, or a thrown request).
  const [transactionsError, setTransactionsError] = useState(false);
  const fetchData = useCallback(async (page: number = 0) => {
    const apiUrl = getApiUrl();
    try {
      const [txRes, analyticsRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/transactions?page=${page}&size=8`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/analytics`),
      ]);

      // Wallet. source of truth for balances
      // A failed wallet read must not render as $0 earnings.
      getMyWallet().then(w => { setWallet(w); setWalletError(false); }).catch(() => setWalletError(true));

      const txOk = txRes.status === 'fulfilled' && txRes.value.ok;
      if (!txOk) setTransactionsError(true);
      if (txRes.status === 'fulfilled' && txRes.value.ok) {
        const data = await txRes.value.json();
        setTransactionsError(!(data.action === 1 && data.data));
        if (data.action === 1 && data.data) {
          const content = Array.isArray(data.data) ? data.data : data.data.content || [];
          // Newest-created first. Mapped shape formats date string, so sort raw.
          content.sort((a: any, b: any) => {
            const ta = (a?.createdAt || a?.date) ? new Date(a.createdAt || a.date).getTime() : 0;
            const tb = (b?.createdAt || b?.date) ? new Date(b.createdAt || b.date).getTime() : 0;
            return tb - ta;
          });
          const mapped: Transaction[] = content.map((t: any, i: number) => ({
            id: t.id || i + 1,
            date: formatTxDate(t.createdAt || t.date || ''),
            // Ledger rows have no counterparty (a photographer's row is their
            // own earning leg). Never fall back to photographerName. that
            // wrongly showed the photographer as their own client.
            clientName: t.viewerName || t.service || t.eventTitle || t.paymentType || '-',
            clientImage: t.clientImage || t.customerImage || undefined,
            service: t.service || t.description || t.eventTitle || t.paymentType || 'Payment',
            serviceType: t.serviceType || t.eventType || t.paymentType || 'Service',
            method: t.paymentMethod || t.method || '-',
            amount: `$${t.amount || 0}`,
            amountNum: t.amountInUsd ?? t.amount ?? 0,
            status: mapStatus(t.status || ''),
            transactionId: t.transactionId || t.reference || `${String(t.id).slice(0, 4)}****`,
            requestId: t.requestId || t.reference || t.invoiceNumber || `AM${t.id || i}`,
          }));
          setTransactions(mapped);
          if (data.data.totalPages) setTotalPages(data.data.totalPages);
          if (data.data.number !== undefined) setCurrentPage(data.data.number);
        }
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.action === 1 && data.data) {
          setAnalytics(data.data);
          if (data.data.earningsChart && Array.isArray(data.data.earningsChart)) {
            setEarningsData(data.data.earningsChart.map((e: any) => ({
              date: e.date || e.label || '',
              value: e.value || e.amount || 0,
            })));
          }
        }
      }
    } catch (err) {
      console.error('[Transactions] Error fetching:', err);
      setTransactionsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  // Fetch platform config + bonus status
  useEffect(() => {
    fetchPlatformConfig().then(setPlatformConfig);
    if (user) {
      (async () => {
        try {
          const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/bonus-status`);
          if (res.ok) {
            const result = await res.json();
            if (result.data) setBonusStatus(result.data);
          }
        } catch { /* ignore */ }
      })();
    }
  }, [user]);

  // Totals come from the reconciled wallet (the same source as the top-bar
  // balance). NOT a sum of the gross transaction rows. Summing the rows
  // double-counted gross client payments and surfaced never-paid phantom
  // declarations, so Total Earnings / Earnings Summary disagreed with the
  // $11.95 wallet. Completed = currently withdrawable net, Pending = real
  // ledger-backed holds, Withdrawn = lifetime paid out.
  const totalCompleted = wallet?.balanceAvailable ?? 0;
  const totalPending = wallet?.pendingAmount ?? 0;
  const totalWithdrawn = wallet?.totalWithdrawn ?? 0;

  // Wallet-based values (source of truth)
  const totalTips = wallet?.balanceTips ?? tipsData.reduce((sum, t) => sum + t.amount, 0);
  const completedEventsCount = analytics?.completedEvents || analytics?.totalCompletedEvents || 0;
  const totalEventsAmount = analytics?.totalEarnings || totalCompleted + totalPending + totalWithdrawn;
  const BONUS_THRESHOLD = bonusStatus.threshold || platformConfig.photographer.bonusThreshold;
  const platformBonus = wallet?.balanceBonuses ?? bonusStatus.amount ?? 0;
  const bonusApproved = bonusStatus.status === 'APPROVED';
  const bonusPending = bonusStatus.status === 'PENDING_APPROVAL';
  const bonusRejected = bonusStatus.status === 'REJECTED';
  const bonusEarned = bonusApproved;
  const bonusReached = completedEventsCount >= BONUS_THRESHOLD;
  const eventsToBonus = Math.max(0, BONUS_THRESHOLD - completedEventsCount);

  const resultsPerPage = 8;
  const totalResults = transactions.length;


  return {
    transactionsError,
    colors,
    actualTheme,
    formatPrice,
    user,
    router,
    activeTimeFilter,
    setActiveTimeFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    chartType,
    setChartType,
    showReportModal,
    setShowReportModal,
    showTransactionModal,
    setShowTransactionModal,
    showWithdrawModal,
    setShowWithdrawModal,
    showSetupModal,
    setShowSetupModal,
    hasPaymentAccount,
    setHasPaymentAccount,
    showTipsModal,
    setShowTipsModal,
    selectedTransaction,
    setSelectedTransaction,
    isLoading,
    setIsLoading,
    wallet,
    setWallet,
    analytics,
    setAnalytics,
    handleViewTransaction,
    handleDownloadReceipt,
    transactions,
    setTransactions,
    walletError,
    setWalletError,
    earningsData,
    setEarningsData,
    tipsData,
    setTipsData,
    platformConfig,
    setPlatformConfig,
    bonusStatus,
    setBonusStatus,
    fetchData,
    totalCompleted,
    totalPending,
    totalWithdrawn,
    totalTips,
    completedEventsCount,
    totalEventsAmount,
    BONUS_THRESHOLD,
    platformBonus,
    bonusApproved,
    bonusPending,
    bonusRejected,
    bonusEarned,
    bonusReached,
    eventsToBonus,
    resultsPerPage,
    totalResults,
  };
}

export type PhotographerTransactionsController = ReturnType<typeof usePhotographerTransactions>;
