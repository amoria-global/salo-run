'use client';

// app/pages/photographer/all-transactions.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';

function formatTransactionDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const formatted = date.toLocaleDateString('en-US', options);
  const hours = date.getHours();
  return `${formatted} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function mapTransactionStatus(status: string): string {
  if (!status) return 'Initiated';
  const s = status.toUpperCase();
  if (s === 'COMPLETED' || s === 'SUCCESS') return 'Completed';
  if (s === 'PENDING') return 'Pending';
  if (s === 'IN_PROGRESS' || s === 'PROCESSING') return 'In progress';
  if (s === 'FAILED' || s === 'CANCELLED') return 'Failed';
  return 'Initiated';
}


export function useAllTransactions() {
  const { colors, actualTheme } = useTheme();
  const { formatPrice, currency } = useCurrency();
  const { user } = useDashboardAuth();

  // Render a row amount using the SOURCE currency the backend tagged on
  // it (rows are returned already converted to whatever displayCurrency
  // we requested). Falls back to formatPrice when the row has no tag,
  // so legacy callers keep working.
  const formatRowAmount = (amount: number, ccy?: string): string => {
    const safeAmount = typeof amount === 'number' ? amount : 0;
    if (!ccy) return formatPrice(safeAmount);
    return formatPrice(safeAmount, ccy);
  };
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  // If navigated in from a "Go to notification" link, scroll-to + pop-animate
  // the matching transaction row.
  const highlightId = useHighlightOnMount();
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (highlightId && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, transactions.length]);

  // Glass view only: whether the last list load failed (HTTP error, action 0, or a thrown request).
  const [transactionsError, setTransactionsError] = useState(false);
  const fetchTransactions = useCallback(async (page: number = 0) => {
    const apiUrl = getApiUrl();
    try {
      // Ask the backend to convert canonical-USD amounts to the user's
      // selected display currency BEFORE serving them. Each row comes
      // back with both `amount` (in displayCurrency) and
      // `currencyAbbreviation` so the renderer can stamp the right
      // symbol without re-converting (which would double-count).
      const txRes = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/transactions?page=${page}&size=20&displayCurrency=${encodeURIComponent(currency)}`
      );

      if (!txRes.ok) setTransactionsError(true);
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactionsError(!(data.action === 1 && data.data));
        if (data.action === 1 && data.data) {
          const content = Array.isArray(data.data) ? data.data : data.data.content || [];
          // Newest-created first. Mapped shape formats date string, so sort raw.
          content.sort((a: any, b: any) => {
            const ta = (a?.createdAt || a?.date) ? new Date(a.createdAt || a.date).getTime() : 0;
            const tb = (b?.createdAt || b?.date) ? new Date(b.createdAt || b.date).getTime() : 0;
            return tb - ta;
          });
          const mapped = content.map((t: any, index: number) => ({
            id: t.id || index + 1,
            date: formatTransactionDate(t.createdAt || t.date || ''),
            transactionId: t.transactionId || t.reference || `${String(t.id).slice(0, 4)}****`,
            client: t.clientName || t.customerName || t.photographerName || 'N/A',
            service: t.service || t.paymentType || t.description || t.eventTitle || 'Payment',
            method: t.paymentMethod || t.method || 'N/A',
            amount: t.amount || 0,
            currency: t.currencyAbbreviation || 'USD',
            status: mapTransactionStatus(t.status || ''),
            requestId: t.requestId || t.reference || t.invoiceNumber || `AM${t.id || index}`,
          }));
          setTransactions(mapped);
          if (data.data.totalPages) setTotalPages(data.data.totalPages);
          if (data.data.number !== undefined) setCurrentPage(data.data.number);
        }
      }

      // Fetch wallet for the compact summary
      try {
        const w = await getMyWallet();
        setWallet(w);
      } catch { /* wallet is optional here */ }
    } catch (error) {
      console.error('[Transactions] Error fetching:', error);
      setTransactionsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    // Refetch when the user flips their display-currency selection so
    // every row's `amount` is recalculated server-side in the new
    // currency (the page renders the value verbatim — no client-side
    // conversion — so we have to round-trip on currency change).
    fetchTransactions(0);
  }, [fetchTransactions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'in progress':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'initiated':
        return { bg: '#E0E7FF', text: '#3730A3' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const handleDownload = (transaction: any) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Receipt</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #111827;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #083A85;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #083A85;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #6B7280;
      margin: 5px 0 0 0;
    }
    .content {
      max-width: 600px;
      margin: 0 auto;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .label {
      color: #6B7280;
      font-size: 14px;
    }
    .value {
      color: #111827;
      font-weight: 600;
      font-size: 14px;
    }
    .total-row {
      background-color: #F9FAFB;
      padding: 20px;
      margin-top: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label {
      font-size: 18px;
      font-weight: 600;
    }
    .total-amount {
      font-size: 24px;
      font-weight: 700;
      color: #083A85;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TRANSACTION RECEIPT</h1>
    <p>Amoria connekt</p>
  </div>
  <div class="content">
    <div class="row">
      <span class="label">Date</span>
      <span class="value">${transaction.date}</span>
    </div>
    <div class="row">
      <span class="label">Transaction ID</span>
      <span class="value">${transaction.transactionId}</span>
    </div>
    <div class="row">
      <span class="label">Request ID</span>
      <span class="value">${transaction.requestId}</span>
    </div>
    <div class="row">
      <span class="label">Client</span>
      <span class="value">${transaction.client}</span>
    </div>
    <div class="row">
      <span class="label">Service</span>
      <span class="value">${transaction.service}</span>
    </div>
    <div class="row">
      <span class="label">Payment Method</span>
      <span class="value">${transaction.method}</span>
    </div>
    <div class="row">
      <span class="label">Status</span>
      <span class="value">${transaction.status}</span>
    </div>
    <div class="total-row">
      <span class="total-label">Total Amount</span>
      <span class="total-amount">${formatPrice(transaction.amount)}</span>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This receipt was generated on ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          window.URL.revokeObjectURL(url);
        }, 100);
      };
    }
  };

  const handleView = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  // Filter transactions based on status and search query
  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = filterStatus === 'All' || transaction.status === filterStatus;
    const matchesSearch = transaction.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.requestId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });


  return {
    transactionsError,
    colors,
    actualTheme,
    formatPrice,
    currency,
    user,
    formatRowAmount,
    transactions,
    setTransactions,
    selectedTransaction,
    setSelectedTransaction,
    showModal,
    setShowModal,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isLoading,
    setIsLoading,
    wallet,
    setWallet,
    highlightId,
    highlightRowRef,
    fetchTransactions,
    getStatusColor,
    handleDownload,
    handleView,
    closeModal,
    filteredTransactions,
  };
}

export type AllTransactionsController = ReturnType<typeof useAllTransactions>;
