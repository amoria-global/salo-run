"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import PaymentCurrencyPreview from '../../components/PaymentCurrencyPreview';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { HeartIcon } from '../../components/UnlockModal';
import WithdrawModal from '../../components/WithdrawModal';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { initiateBookingPayment, pollPaymentStatus, getTelecomProvider, getPaymentMethodType, sanitizeErrorMessage, releaseEscrowFunds, isSurveyCompleted } from '@/lib/xentripay';
import { getApiUrl } from '@/lib/api';
import SatisfactionSurveyModal from '../../components/SatisfactionSurveyModal';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';

// Icons
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="#3B82F6" strokeWidth="2"/>
    <path d="M20.188 10.9343C20.5762 11.4056 20.7703 11.6412 20.7703 12C20.7703 12.3588 20.5762 12.5944 20.188 13.0657C18.7679 14.7899 15.6357 18 12 18C8.36427 18 5.23206 14.7899 3.81197 13.0657C3.42381 12.5944 3.22973 12.3588 3.22973 12C3.22973 11.6412 3.42381 11.4056 3.81197 10.9343C5.23206 9.21014 8.36427 6 12 6C15.6357 6 18.7679 9.21014 20.188 10.9343Z" stroke="#3B82F6" strokeWidth="2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="#9CA3AF" strokeWidth="2"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9V2H18V9M6 18H4C2.89543 18 2 17.1046 2 16V11C2 9.89543 2.89543 9 4 9H20C21.1046 9 22 9.89543 22 11V16C22 17.1046 21.1046 18 20 18H18M6 14H18V22H6V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const StreamFeeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#16A34A" strokeWidth="2"/>
    <path d="M12 6V18" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 9.5C15 8.12 13.66 7 12 7C10.34 7 9 8.12 9 9.5C9 10.88 10.34 12 12 12C13.66 12 15 13.12 15 14.5C15 15.88 13.66 17 12 17C10.34 17 9 15.88 9 14.5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const LiveStreamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill="#EF4444"/>
    <path d="M4.93 4.93a10 10 0 0 1 14.14 0M7.76 7.76a6 6 0 0 1 8.48 0M9.17 9.17a3 3 0 0 1 4.24 0" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.48M14.83 9.17a3 3 0 0 1 0 4.24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 18C3 15.2386 5.23858 13 8 13H10C12.7614 13 15 15.2386 15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 18C21 16.3431 19.6569 15 18 15H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>{title}</h3>
          <button className="no-print" onClick={onClose} style={{ background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, cursor: 'pointer', padding: '0.5rem', borderRadius: '0.375rem', color: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// View Report Modal Content
interface ViewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments?: Payment[];
}

const ViewReportModal: React.FC<ViewReportModalProps> = ({ isOpen, onClose, payments = [] }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const reportData = {
    period: payments.length > 0 ? `${payments[payments.length - 1]?.date?.split(' ')[0] || ''} - ${payments[0]?.date?.split(' ')[0] || ''} ${new Date().getFullYear()}` : 'No data',
    totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amountNum, 0),
    pending: payments.filter(p => p.status === 'pending' || p.status === 'partially_paid').reduce((sum, p) => sum + (p.amountNum - p.paidAmount), 0),
    failed: payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amountNum, 0),
    totalTransactions: payments.length,
    completedTransactions: payments.filter(p => p.status === 'paid').length,
    pendingTransactions: payments.filter(p => p.status === 'pending' || p.status === 'partially_paid').length,
    failedTransactions: payments.filter(p => p.status === 'failed').length,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportContent = `
Payment Summary Report
Period: ${reportData.period}
Generated: ${new Date().toLocaleDateString()}

Financial Summary:
- Total Paid: ${formatPrice(reportData.totalPaid)}
- Pending Amount: ${formatPrice(reportData.pending)}
- Failed: ${formatPrice(reportData.failed)}
- Total: ${formatPrice(reportData.totalPaid + reportData.pending + reportData.failed)}

Transaction Summary:
- Total Transactions: ${reportData.totalTransactions}
- Completed: ${reportData.completedTransactions}
- Pending: ${reportData.pendingTransactions}
- Failed: ${reportData.failedTransactions}
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${reportData.period.replace(/ /g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Report" maxWidth="520px">
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
          Report Period: <span style={{ fontWeight: '600', color: colors.textPrimary }}>{reportData.period}</span>
        </div>

        {/* Financial & Transaction Summary Side by Side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Financial Summary */}
          <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>Financial Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Paid</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(reportData.totalPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                  <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Pending</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(reportData.pending)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Failed</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(reportData.failed)}</span>
              </div>
              <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, marginTop: '0.35rem', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textSecondary }}>Total</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(reportData.totalPaid + reportData.pending + reportData.failed)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>Transaction Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Total</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textPrimary }}>{reportData.totalTransactions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Completed</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10B981' }}>{reportData.completedTransactions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>Pending</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#F59E0B' }}>{reportData.pendingTransactions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Failed</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#EF4444' }}>{reportData.failedTransactions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleDownload} style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          backgroundColor: '#083A85',
          color: 'white',
          border: '2px solid #062a63',
          borderRadius: '0.5rem',
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          <DownloadIcon />
          Download
        </button>
        <button onClick={handlePrint} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          backgroundColor: colors.bgTertiary,
          color: colors.textPrimary,
          border: `2px solid ${colors.borderPrimary}`,
          borderRadius: '0.5rem',
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          <PrintIcon />
          Print
        </button>
      </div>
    </Modal>
  );
};

// Payment Details Modal
type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

interface Payment {
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

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ isOpen, onClose, payment }) => {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();
  if (!payment) return null;

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
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

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'partially_paid': return '#3B82F6';
      case 'failed': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details" maxWidth="480px">
      {/* Status Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
        {payment.status === 'paid' ? (
          <CheckCircleIcon />
        ) : (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(payment.status) + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ color: getStatusColor(payment.status), fontWeight: '700', fontSize: '1.25rem' }}>
              {payment.status === 'failed' ? '!' : payment.status === 'pending' ? '...' : '~'}
            </span>
          </div>
        )}
        <span style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: getStatusColor(payment.status),
          marginTop: '0.5rem',
          textTransform: 'capitalize'
        }}>
          {payment.status.replace('_', ' ')}
        </span>
        <span style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.textPrimary, marginTop: '0.5rem' }}>
          {formatPrice(payment.amountNum)}
        </span>
      </div>

      {/* Payment Info */}
      <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
            </svg>
            {payment.photographerImage && (
              <img src={payment.photographerImage} alt={payment.photographerName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>{payment.photographerName}</div>
            <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{payment.eventName}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Invoice Number</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{payment.invoiceNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Date & Time</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{payment.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Payment Method</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{payment.method}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Event Type</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{payment.eventType}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="no-print" style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={handleDownloadReceipt} style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          backgroundColor: '#083A85',
          color: 'white',
          border: '2px solid #062a63',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          <DownloadIcon />
          Download
        </button>
        <button onClick={handlePrintReceipt} style={{
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
        }}>
          <PrintIcon />
          Print
        </button>
        <button onClick={onClose} style={{
          backgroundColor: colors.bgTertiary,
          color: colors.textPrimary,
          border: `2px solid ${colors.borderPrimary}`,
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Close
        </button>
      </div>
    </Modal>
  );
};

// Pay Now Modal
interface PayNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onPaymentSuccess?: () => void;
}

const PAYMENT_METHODS: Record<string, { label: string; image: string }> = {
  card: { label: 'Credit/Debit Card', image: '/cards.png' },
  mtn: { label: 'MTN Mobile Money', image: '/mtn.png' },
  airtel: { label: 'Airtel Mobile Money', image: '/airtel.png' },
};

const PayNowModal: React.FC<PayNowModalProps> = ({ isOpen, onClose, payment, onPaymentSuccess }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice, currencyId } = useCurrency();
  const { profile } = useUserProfile();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [customDonation, setCustomDonation] = useState<string>('');
  const [donationSkipped, setDonationSkipped] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Escrow states — auto-skip if already set at booking time
  const [escrowStep, setEscrowStep] = useState<'options' | 'method'>('options');
  const [selectedEscrowOption, setSelectedEscrowOption] = useState<number | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(false);
  const [checkingSurvey, setCheckingSurvey] = useState<boolean>(false);
  const [showSurveyModal, setShowSurveyModal] = useState<boolean>(false);

  // Sync escrow state when modal opens or payment changes
  useEffect(() => {
    if (isOpen && payment) {
      if (payment.escrowPercentage) {
        setEscrowStep('method');
        setSelectedEscrowOption(payment.escrowPercentage);
      } else {
        setEscrowStep('options');
        setSelectedEscrowOption(null);
      }
    }
  }, [isOpen, payment]);

  // XentriPay states
  const [paymentPhone, setPaymentPhone] = useState<string>('');
  const [xentriPayStep, setXentriPayStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [xentriPayError, setXentriPayError] = useState<string>('');
  const stopPollingRef = React.useRef<(() => void) | null>(null);

  // Pre-fill phone from user profile when modal opens
  useEffect(() => {
    if (isOpen && profile?.phoneNumber && !paymentPhone) {
      setPaymentPhone(`${profile.phoneCode || ''}${profile.phoneNumber}`);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/preferences`)
      .then(res => res.json())
      .then(result => {
        const prefs = result?.data || {};
        const defaultId = prefs.default_payment_method as string | undefined;
        if (!defaultId) return;
        const raw = prefs[`payment_method_${defaultId}`];
        if (!raw) return;
        const pm = JSON.parse(raw);
        const isAirtel = (pm.name as string)?.toLowerCase().includes('airtel');
        const methodKey = pm.type === 'card' ? 'card' : isAirtel ? 'airtel' : 'mtn';
        setSelectedPaymentMethod(methodKey);
      })
      .catch(() => { /* keep default 'card' */ });
  }, [isOpen]);

  if (!payment) return null;

  // For escrow payments, the amount due is the remaining balance.
  // When payment.escrowPercentage is already set, declaration amount IS the milestone amount — don't re-apply %.
  const fullAmountDue = payment.amountNum - payment.paidAmount;
  const amountDue = (selectedEscrowOption && selectedEscrowOption < 100 && !payment.escrowPercentage)
    ? fullAmountDue * selectedEscrowOption / 100
    : fullAmountDue;
  const donationValue = donationAmount === 'custom' ? (parseFloat(customDonation) || 0) : (parseFloat(donationAmount) || 0);
  const totalAmount = amountDue + donationValue;
  const donationAddressed = donationSkipped || donationValue > 0;
  const phoneValid = selectedPaymentMethod === 'card' || paymentPhone.trim().length > 0;
  const isPayEnabled = donationAddressed && phoneValid;

  const handleSelectDonation = (amount: string) => {
    setDonationSkipped(false);
    if (amount === 'custom') {
      setDonationAmount('custom');
      setShowCustomInput(true);
    } else {
      setDonationAmount(amount);
      setShowCustomInput(false);
      setCustomDonation('');
    }
  };

  const handleSkipDonation = () => {
    setDonationSkipped(true);
    setDonationAmount('');
    setCustomDonation('');
    setShowCustomInput(false);
  };

  const handleClose = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    setShowReceipt(false);
    setXentriPayStep('select');
    setXentriPayError('');
    setPaymentPhone('');
    setPaymentError(null);
    setSurveyCompleted(false);
    setShowSurveyModal(false);
    onClose();
  };

  const handlePayNowXentriPay = async () => {
    if (!payment.declarationId) {
      setXentriPayError('This payment cannot be processed. The event may have been removed or the booking is no longer active.');
      return;
    }
    if (!paymentPhone.trim()) {
      setXentriPayError(`Please enter your ${selectedPaymentMethod === 'mtn' ? 'MTN' : selectedPaymentMethod === 'airtel' ? 'Airtel' : ''} phone number to receive the payment prompt.`);
      return;
    }
    setIsProcessing(true);
    setXentriPayError('');
    setXentriPayStep('processing');

    try {
      const telecom = getTelecomProvider(selectedPaymentMethod);
      const methodType = getPaymentMethodType(selectedPaymentMethod);
      const phone = paymentPhone.trim();
      // Use production URL for http (localhost), keep current URL for https (production)
      const currentUrl = window.location.href;
      const redirectUrl = selectedPaymentMethod === 'card'
        ? (currentUrl.startsWith('http://') ? 'https://dashboard.connekyt.com/user/event-coordinator/payments' : currentUrl)
        : undefined;

      const escrowPct = (!payment.escrowPercentage && (selectedEscrowOption === 50 || selectedEscrowOption === 70)) ? selectedEscrowOption : undefined;
      const result = await initiateBookingPayment(payment.declarationId!, phone, telecom, methodType, redirectUrl, donationValue > 0 ? donationValue : undefined, currencyId, escrowPct);

      if (!result.success || !result.data) {
        setXentriPayError(result.error || 'Payment could not be initiated. Please check your payment details and try again.');
        setXentriPayStep('failed');
        setIsProcessing(false);
        return;
      }

      if (selectedPaymentMethod === 'card' && result.data.paymentUrl) {
        window.open(result.data.paymentUrl, '_blank');
      }

      const stopPolling = pollPaymentStatus(result.data.refid, {
        onSuccess: () => { setXentriPayStep('success'); setIsProcessing(false); },
        onFailure: () => { setXentriPayStep('failed'); setXentriPayError('Payment was not completed. If you were charged, the amount will be refunded automatically. Please try again.'); setIsProcessing(false); },
        onError: (error) => { setXentriPayStep('failed'); setXentriPayError(sanitizeErrorMessage(error, 'Unable to check payment status. Please try again.')); setIsProcessing(false); },
      });
      stopPollingRef.current = stopPolling;
    } catch (error) {
      setXentriPayError(sanitizeErrorMessage(error instanceof Error ? error.message : '', 'Something went wrong while processing your payment. Please check your connection and try again.'));
      setXentriPayStep('failed');
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = () => {
    setXentriPayStep('select');
    setXentriPayError('');
    setShowReceipt(false);
    setIsProcessing(false);
  };

  // Check survey status when 100% option is selected
  const handleSelectEscrowOption = async (option: number) => {
    setSelectedEscrowOption(option);
    if (option === 100 && payment?.eventId) {
      setCheckingSurvey(true);
      const result = await isSurveyCompleted(payment.eventId);
      setSurveyCompleted(result.completed);
      setCheckingSurvey(false);
    }
  };

  const isEventCompleted = payment?.eventCompletionStatus === 'COMPLETED';

  // Survey modal for 100% payment option
  if (showSurveyModal && payment.eventId) {
    return (
      <SatisfactionSurveyModal
        isOpen={isOpen}
        onClose={() => setShowSurveyModal(false)}
        eventId={payment.eventId}
        eventName={payment.eventName}
        photographerName={payment.photographerName}
        onSurveyComplete={(disputeFlagged) => {
          setSurveyCompleted(true);
          setShowSurveyModal(false);
          if (!disputeFlagged) {
            setEscrowStep('method');
          }
        }}
      />
    );
  }

  // XentriPay Processing View
  if (xentriPayStep === 'processing') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Processing Payment" maxWidth="450px">
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', border: '4px solid rgba(8, 58, 133, 0.2)', borderTopColor: '#083A85', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            {selectedPaymentMethod === 'card' ? 'Complete payment in your browser' : 'Check your phone'}
          </h4>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1rem', lineHeight: '1.5' }}>
            {selectedPaymentMethod === 'card'
              ? 'A payment page has been opened. Complete the payment there and we\'ll confirm it here.'
              : 'A USSD prompt has been sent to your phone. Please approve the payment on your device.'}
          </p>
          <p style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Waiting for the gateway to confirm your payment — this can take up to a minute.</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Modal>
    );
  }

  // XentriPay Success View
  if (xentriPayStep === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Payment Successful" maxWidth="450px">
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>Payment Completed!</h4>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem' }}>Your payment of {formatPrice(totalAmount)} has been received successfully.</p>
          <button onClick={() => { handleClose(); onPaymentSuccess?.(); }} style={{ padding: '0.75rem 2rem', border: '2px solid #062a63', borderRadius: '0.5rem', background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Done</button>
        </div>
      </Modal>
    );
  }

  // XentriPay Failed View
  if (xentriPayStep === 'failed') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Payment Failed" maxWidth="450px">
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', borderRadius: '50%', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>Payment Failed</h4>
          <p style={{ fontSize: '0.9rem', color: '#EF4444', margin: '0 0 1.5rem' }}>{xentriPayError || 'Something went wrong. Please try again.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={handleClose} style={{ padding: '0.75rem 1.5rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Close</button>
            <button onClick={handleRetryPayment} style={{ padding: '0.75rem 1.5rem', border: '2px solid #c00a72', borderRadius: '0.5rem', background: '#F20C8F', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Try Again</button>
          </div>
        </div>
      </Modal>
    );
  }

  // Escrow Options View — choose payment percentage
  if (escrowStep === 'options' && xentriPayStep === 'select' && !showReceipt) {
    const fullAmountForOptions = payment.amountNum - payment.paidAmount;
    const options = [
      { pct: 50, label: '50% Now', amount: fullAmountForOptions * 0.5, desc: 'Held securely until service confirmed. Pay the rest later.' },
      { pct: 70, label: '70% Now', amount: fullAmountForOptions * 0.70, desc: 'Held securely until service confirmed. Pay the rest later.' },
      { pct: 100, label: '100% After Completion', amount: fullAmountForOptions, desc: 'Pay the full amount after the photographer completes the job.' },
    ];

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Choose Payment Option" maxWidth="460px">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <i className="bi bi-shield-fill-check" style={{ fontSize: 12, color: '#F20C8F' }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payment split</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1rem', lineHeight: 1.55 }}>
            How would you like to pay for <strong style={{ color: colors.textPrimary }}>{payment.eventName}</strong>?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {options.map((opt) => {
              const isSelected = selectedEscrowOption === opt.pct;
              const isDisabled = opt.pct === 100 && !isEventCompleted;

              return (
                <div
                  key={opt.pct}
                  onClick={() => !isDisabled && handleSelectEscrowOption(opt.pct)}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.85rem 0.95rem',
                    border: `1.5px solid ${isSelected ? '#F20C8F' : colors.borderPrimary}`,
                    borderRadius: 14,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.55 : 1,
                    background: isSelected
                      ? (actualTheme === 'dark'
                        ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                        : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.05) 100%)')
                      : colors.bgCard,
                    boxShadow: isSelected ? '0 8px 22px -8px rgba(242,12,143,0.30)' : 'none',
                    overflow: 'hidden',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                  }}
                >
                  {isSelected && (
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                    }} />
                  )}
                  {/* Branded radio */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    flexShrink: 0, marginTop: 2,
                    padding: isSelected ? 2 : 0,
                    background: isSelected ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' : 'transparent',
                    border: isSelected ? 'none' : `1.5px solid ${colors.borderPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected ? (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: colors.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' }} />
                      </div>
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>{opt.label}</span>
                      <span style={{
                        fontSize: '0.98rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.01em',
                      }}>
                        {formatPrice(opt.amount)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: 0, lineHeight: 1.45 }}>
                      {opt.desc}
                    </p>
                    {opt.pct < 100 && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        marginTop: 7, padding: '3px 8px',
                        background: actualTheme === 'dark' ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.12)',
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.40)' : 'rgba(245,158,11,0.35)'}`,
                        borderRadius: 999, fontSize: '0.7rem',
                        color: '#D97706', fontWeight: 700,
                        letterSpacing: '0.03em',
                      }}>
                        <i className="bi bi-shield-lock-fill" style={{ fontSize: 10 }} />
                        Escrow protected
                      </div>
                    )}
                    {opt.pct === 100 && !isEventCompleted && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        marginTop: 7, padding: '3px 8px',
                        background: actualTheme === 'dark' ? 'rgba(127,29,29,0.32)' : 'rgba(220,38,38,0.10)',
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(252,165,165,0.32)' : 'rgba(220,38,38,0.30)'}`,
                        borderRadius: 999, fontSize: '0.7rem',
                        color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
                        fontWeight: 700, letterSpacing: '0.03em',
                      }}>
                        <i className="bi bi-lock-fill" style={{ fontSize: 10 }} />
                        Available after event is completed
                      </div>
                    )}
                    {opt.pct === 100 && isEventCompleted && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        marginTop: 7, padding: '3px 8px',
                        background: actualTheme === 'dark' ? 'rgba(6,95,70,0.32)' : 'rgba(16,185,129,0.12)',
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(110,231,183,0.40)' : 'rgba(16,185,129,0.35)'}`,
                        borderRadius: 999, fontSize: '0.7rem',
                        color: '#059669', fontWeight: 700, letterSpacing: '0.03em',
                      }}>
                        <i className="bi bi-clipboard-check-fill" style={{ fontSize: 10 }} />
                        Requires satisfaction survey
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedEscrowOption === 100 && isEventCompleted && !surveyCompleted && !checkingSurvey && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '0.6rem 0.8rem', margin: '0 0 0.85rem',
              background: actualTheme === 'dark' ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.30)' : 'rgba(245,158,11,0.30)'}`,
              borderRadius: 10,
              fontSize: '0.82rem', color: '#D97706', lineHeight: 1.45,
            }}>
              <i className="bi bi-clipboard-check-fill" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }} />
              <span>You need to complete a satisfaction survey before making the full payment. The survey will appear in the next step.</span>
            </div>
          )}

          {checkingSurvey && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 0.85rem' }}>
              <span className="ck-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              Checking survey status…
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
            <button
              onClick={handleClose}
              className="ck-btn ck-btn-soft"
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button
              disabled={selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted)}
              onClick={() => {
                if (selectedEscrowOption === 100 && isEventCompleted && !surveyCompleted) {
                  setShowSurveyModal(true);
                } else {
                  setEscrowStep('method');
                }
              }}
              style={{
                padding: '0.7rem 1.3rem',
                borderRadius: 11,
                border: 'none',
                background: (selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted))
                  ? colors.bgTertiary
                  : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: (selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted)) ? colors.textSecondary : '#fff',
                fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em',
                cursor: (selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted)) ? 'not-allowed' : 'pointer',
                opacity: (selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted)) ? 0.7 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: (selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted)) ? 'none' : '0 8px 22px -6px rgba(242,12,143,0.42)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { if (!(selectedEscrowOption === null || checkingSurvey || (selectedEscrowOption === 100 && !isEventCompleted))) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {selectedEscrowOption === 100 && isEventCompleted && !surveyCompleted ? (
                <>
                  <i className="bi bi-clipboard-check-fill" style={{ fontSize: 13 }} />
                  Complete survey first
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: 13 }} />
                  Continue
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Receipt View (Phase 2)
  if (showReceipt) {
    const methodInfo = PAYMENT_METHODS[selectedPaymentMethod] || PAYMENT_METHODS.card;

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Payment Summary" maxWidth="450px">
        <div>
          <div style={{
            backgroundColor: colors.bgTertiary, borderRadius: '0.75rem', padding: '1.25rem',
            marginBottom: '1.25rem', border: `2px solid ${colors.borderPrimary}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Event</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{payment.eventName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Photographer</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{payment.photographerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Date</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{payment.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Invoice</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{payment.invoiceNumber}</span>
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
                    <Image src={methodInfo.image} alt={methodInfo.label} width={24} height={24} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{methodInfo.label}</span>
              </div>
            </div>
            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>
                {selectedEscrowOption && selectedEscrowOption < 100 ? `Amount (${selectedEscrowOption}% Escrow)` : 'Amount Due'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(amountDue)}</span>
            </div>
            {selectedEscrowOption && selectedEscrowOption < 100 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '500', color: '#D97706' }}>Remaining ({100 - selectedEscrowOption}%)</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '500', color: '#D97706' }}>{formatPrice(fullAmountDue - amountDue)} (later)</span>
              </div>
            )}
            {donationValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <HeartIcon />
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#F20C8F' }}>Donation</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F' }}>{formatPrice(donationValue)}</span>
              </div>
            )}
            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: colors.textPrimary }}>Total</span>
              <span style={{ fontSize: '1.3rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {xentriPayError && (
            <p style={{ fontSize: '0.85rem', color: '#EF4444', margin: '0 0 0.75rem', textAlign: 'center' }}>{xentriPayError}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => { setShowReceipt(false); setXentriPayError(''); }} disabled={isProcessing} style={{
              flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.6 : 1
            }}>Cancel</button>
            <button disabled={isProcessing} onClick={handlePayNowXentriPay} style={{
              flex: 1, padding: '0.75rem 1rem',
              border: payment.status === 'failed' ? '2px solid #c00a72' : '2px solid #062a63',
              borderRadius: '0.5rem', background: isProcessing ? '#9CA3AF' : (payment.status === 'failed' ? '#F20C8F' : '#083A85'),
              color: 'white', fontSize: '0.9rem', fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1, transition: 'all 0.2s'
            }}>
              {isProcessing ? 'Processing...' : `${payment.status === 'failed' ? 'Retry' : 'Pay'} ${formatPrice(totalAmount)}`}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Selection View (Phase 1)
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={payment.status === 'failed' ? 'Retry Payment' : 'Complete Payment'} maxWidth="460px">
      <div>
        {/* Payment Method Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.55rem' }}>
            Select Payment Method
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {([
              {
                id: 'card',
                title: 'Credit/Debit Card',
                subtitle: 'Pay with Visa, Mastercard, etc.',
                kind: 'card' as const,
              },
              {
                id: 'mtn',
                title: 'MTN Mobile Money',
                subtitle: 'Pay via MTN MoMo',
                kind: 'logo' as const,
                src: '/mtn.png',
              },
              {
                id: 'airtel',
                title: 'Airtel Mobile Money',
                subtitle: 'Pay via Airtel Money',
                kind: 'logo' as const,
                src: '/airtel.png',
              },
            ]).map((m) => {
              const isSelected = selectedPaymentMethod === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedPaymentMethod(m.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 0.95rem',
                    border: `1.5px solid ${isSelected ? '#F20C8F' : colors.borderPrimary}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    background: isSelected
                      ? (actualTheme === 'dark'
                        ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                        : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.05) 100%)')
                      : colors.bgCard,
                    boxShadow: isSelected ? '0 8px 22px -8px rgba(242,12,143,0.30)' : 'none',
                    overflow: 'hidden',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                  }}
                >
                  {isSelected && (
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                    }} />
                  )}
                  <div style={{
                    width: 50, height: 46,
                    borderRadius: 11,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: m.kind === 'card' ? 3 : 0,
                    background: m.kind === 'card' ? colors.bgCard : 'transparent',
                    border: m.kind === 'card' ? `1px solid ${colors.borderPrimary}` : 'none',
                  }}>
                    {m.kind === 'card' ? (
                      <>
                        <Image src="/visa.png" alt="Visa" width={22} height={36} unoptimized style={{ objectFit: 'contain' }} />
                        <Image src="/master.png" alt="Mastercard" width={22} height={36} unoptimized style={{ objectFit: 'contain' }} />
                      </>
                    ) : (
                      <Image src={m.src} alt={m.title} width={46} height={46} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>{m.title}</div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 2 }}>{m.subtitle}</div>
                  </div>
                  {/* Branded radio */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    flexShrink: 0,
                    padding: isSelected ? 2 : 0,
                    background: isSelected ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' : 'transparent',
                    border: isSelected ? 'none' : `1.5px solid ${colors.borderPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: colors.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phone Number Input (for all methods - XentriPay requires it) */}
          {selectedPaymentMethod && (
            <div style={{ marginTop: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>Phone Number</label>
              <input type="tel" placeholder="e.g. 078XXXXXXX" value={paymentPhone} onChange={(e) => { setPaymentPhone(e.target.value); setXentriPayError(''); }}
                style={{ width: '100%', padding: '0.7rem 0.85rem', border: `1.5px solid ${colors.borderPrimary}`, borderRadius: 11, fontSize: '0.9rem', color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s, box-shadow 0.18s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p style={{ fontSize: '0.76rem', color: colors.textSecondary, margin: '0.4rem 0 0 0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-info-circle-fill" style={{ fontSize: 10, color: '#F20C8F' }} />
                {selectedPaymentMethod === 'card'
                  ? 'Required for payment verification'
                  : `Enter the ${selectedPaymentMethod === 'mtn' ? 'MTN' : 'Airtel'} number to receive the payment prompt`}
              </p>
            </div>
          )}

          <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '0.85rem 0 0 0', textAlign: 'center', display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
            <i className="bi bi-info-circle-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
            Manage your payment methods in <span
              onClick={() => router.push('/user/event-coordinator/preferences?tab=payments')}
              style={{ color: '#F20C8F', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
            >Preferences → Payment Accounts</span>
          </p>
        </div>

        {/* Donation Section */}
        <div style={{
          position: 'relative',
          marginBottom: '1.25rem', padding: '0.9rem 1rem',
          borderRadius: 14,
          border: `1.5px solid ${donationSkipped ? colors.borderPrimary : (donationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.30)')}`,
          background: actualTheme === 'dark'
            ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.14) 100%)'
            : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.05) 100%)',
          transition: 'border-color 0.18s, background 0.18s',
          overflow: 'hidden',
        }}>
          <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)' }} />
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(242,12,143,0.18) 0%, rgba(242,12,143,0.10) 100%)',
                border: '1px solid rgba(242,12,143,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-heart-fill" style={{ fontSize: 12, color: '#F20C8F' }} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Support a Cause</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700,
                color: colors.textSecondary,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginLeft: 'auto',
                padding: '2px 7px',
                background: colors.bgCard,
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: 999,
              }}>Optional</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '0.4rem 0 0 0', lineHeight: 1.45 }}>
              Add a small donation to help fund community projects and initiatives.
            </p>
          </div>
          {!donationSkipped && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
                {['5', '10', '25', '50'].map((amount) => {
                  const isOn = donationAmount === amount;
                  return (
                    <button key={amount} onClick={() => handleSelectDonation(amount)} style={{
                      padding: '0.4rem 0.75rem',
                      border: `1.5px solid ${isOn ? '#F20C8F' : colors.borderPrimary}`,
                      borderRadius: 10,
                      background: isOn ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.14) 100%)' : colors.bgCard,
                      color: isOn ? '#F20C8F' : colors.textSecondary,
                      fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.15s', flex: 1, minWidth: 0,
                      letterSpacing: '-0.005em',
                      boxShadow: isOn ? '0 4px 10px -3px rgba(242,12,143,0.32)' : 'none',
                    }}>{formatPrice(Number(amount))}</button>
                  );
                })}
                <button onClick={() => handleSelectDonation('custom')} style={{
                  padding: '0.4rem 0.75rem',
                  border: `1.5px solid ${donationAmount === 'custom' ? '#F20C8F' : colors.borderPrimary}`,
                  borderRadius: 10,
                  background: donationAmount === 'custom' ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.14) 100%)' : colors.bgCard,
                  color: donationAmount === 'custom' ? '#F20C8F' : colors.textSecondary,
                  fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.15s', flex: 1, minWidth: 0,
                  letterSpacing: '-0.005em',
                  boxShadow: donationAmount === 'custom' ? '0 4px 10px -3px rgba(242,12,143,0.32)' : 'none',
                }}>Custom</button>
              </div>
              {showCustomInput && (
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: 700, color: '#F20C8F' }}>$</span>
                  <input type="number" placeholder="Enter amount" value={customDonation} onChange={(e) => setCustomDonation(e.target.value)} style={{
                    width: '100%', padding: '0.65rem 0.85rem 0.65rem 1.85rem',
                    border: `1.5px solid ${customDonation ? '#F20C8F' : colors.borderPrimary}`,
                    borderRadius: 11, fontSize: '0.88rem', color: colors.textPrimary,
                    backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.18s, box-shadow 0.18s'
                  }} onFocus={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = customDonation ? '#F20C8F' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>
              )}
              {/* Donation amount preview — the tier buttons + custom input
                  are USD-denominated internally (see donationValue below),
                  so the panel converts from USD using the live backend
                  rates. Display-only; submit still carries USD as
                  canonical. */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <PaymentCurrencyPreview
                  fromCurrency="USD"
                  amounts={[{
                    label: 'Donation amount',
                    amount: donationAmount === 'custom'
                      ? (parseFloat(customDonation) || 0)
                      : (parseFloat(donationAmount) || 0),
                  }]}
                />
              </div>
            </>
          )}
          <button onClick={handleSkipDonation} style={{
            width: '100%', padding: '0.55rem 1rem', borderRadius: 999,
            border: donationSkipped ? 'none' : `1.5px solid ${colors.borderPrimary}`,
            background: donationSkipped ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' : colors.bgCard,
            color: donationSkipped ? '#fff' : colors.textSecondary,
            fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s', textAlign: 'center',
            letterSpacing: '-0.005em',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: donationSkipped ? '0 6px 16px -4px rgba(242,12,143,0.36)' : 'none',
          }}>
            {donationSkipped ? (
              <>
                <i className="bi bi-check2-circle" style={{ fontSize: 13 }} />
                Donation skipped
              </>
            ) : 'No thanks, skip donation'}
          </button>
          <div style={{ marginTop: '0.55rem', textAlign: 'center' }}>
            <a href={`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/donations`} onClick={(e) => { e.preventDefault(); router.push('/user/donations'); }} style={{
              fontSize: '0.78rem', color: '#F20C8F', textDecoration: 'none', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              Learn more about our donation program
              <i className="bi bi-arrow-right" style={{ fontSize: 11 }} />
            </a>
          </div>
        </div>

        {(!donationAddressed || !phoneValid) && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            margin: '0 0 0.85rem 0',
            padding: '0.55rem 0.8rem',
            background: actualTheme === 'dark' ? 'rgba(127,29,29,0.32)' : '#FEF2F2',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(252,165,165,0.32)' : '#FECACA'}`,
            borderRadius: 10,
            color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
            fontSize: '0.83rem',
          }}>
            <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }} />
            <span>{!phoneValid ? 'Please enter your phone number' : 'Please select a donation amount or skip to continue'}</span>
          </div>
        )}

        {/* Escrow info banner */}
        {selectedEscrowOption && selectedEscrowOption < 100 && !payment.escrowPercentage && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            marginBottom: '1rem', padding: '0.65rem 0.85rem',
            borderRadius: 11,
            background: actualTheme === 'dark' ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.30)' : 'rgba(245,158,11,0.30)'}`,
          }}>
            <i className="bi bi-shield-lock-fill" style={{ fontSize: 14, color: '#D97706', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: '0.82rem', color: '#D97706', margin: 0, lineHeight: 1.45, fontWeight: 600 }}>
              You are paying <strong>{selectedEscrowOption}% ({formatPrice(amountDue)})</strong> upfront. Funds will be held securely and released after you confirm service satisfaction.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
          {!payment.escrowPercentage && (
            <button
              onClick={() => setEscrowStep('options')}
              className="ck-btn ck-btn-soft"
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem' }}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: 12, marginRight: 5 }} />
              Back
            </button>
          )}
          <button
            disabled={!isPayEnabled}
            onClick={() => setShowReceipt(true)}
            title={!isPayEnabled ? (!phoneValid ? 'Enter your phone number' : 'Select a donation amount or skip') : undefined}
            style={{
              padding: '0.7rem 1.3rem',
              borderRadius: 11,
              border: 'none',
              background: !isPayEnabled ? colors.bgTertiary : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
              color: !isPayEnabled ? colors.textSecondary : '#fff',
              fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em',
              cursor: !isPayEnabled ? 'not-allowed' : 'pointer',
              opacity: !isPayEnabled ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: !isPayEnabled ? 'none' : '0 8px 22px -6px rgba(242,12,143,0.42)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { if (isPayEnabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: 13 }} />
            Proceed to payment
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Chart Type Icons
const LineChartIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12L7 8L12 13L17 6L21 10" stroke={active ? '#3B82F6' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 20H21" stroke={active ? '#3B82F6' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BarChartIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="10" width="4" height="10" rx="1" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <rect x="10" y="6" width="4" height="14" rx="1" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <rect x="16" y="12" width="4" height="8" rx="1" fill={active ? '#3B82F6' : '#9CA3AF'}/>
  </svg>
);

const ScatterChartIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="14" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <circle cx="10" cy="8" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <circle cx="15" cy="12" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <circle cx="19" cy="6" r="2.5" fill={active ? '#3B82F6' : '#9CA3AF'}/>
    <path d="M3 20H21" stroke={active ? '#3B82F6' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

type ChartType = 'line' | 'bar' | 'scatter';

interface SpendingChartProps {
  data: { date: string; value: number }[];
  height?: number;
  chartType: ChartType;
}

const SpendingChart: React.FC<SpendingChartProps> = ({ data, height = 140, chartType }) => {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>
        No spending data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 10;
  const paddingRight = 10;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = 500;
  const barWidth = 35;
  const barGap = data.length > 1 ? (chartWidth - paddingLeft - paddingRight - (data.length * barWidth)) / (data.length - 1) : 0;

  const points = data.map((item, index) => {
    const x = chartType === 'bar'
      ? paddingLeft + index * (barWidth + barGap) + barWidth / 2
      : paddingLeft + (index / Math.max(data.length - 1, 1)) * (chartWidth - paddingLeft - paddingRight);
    const y = paddingTop + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, ...item };
  });

  // Create smooth bezier curve for line chart
  const pathD = points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const tension = 0.3;
    const cpx1 = prev.x + (point.x - prev.x) * tension;
    const cpx2 = point.x - (point.x - prev.x) * tension;
    return `C ${cpx1} ${prev.y} ${cpx2} ${point.y} ${point.x} ${point.y}`;
  }).join(' ');

  // Area path for line chart
  const areaPath = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <>
            <defs>
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#083A85" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            {points.map((point, index) => {
              const barHeight = chartHeight - (point.y - paddingTop);
              const barX = paddingLeft + index * (barWidth + barGap);
              return (
                <g key={index}>
                  <rect
                    x={barX}
                    y={point.y}
                    width={barWidth}
                    height={barHeight}
                    fill={hoveredIndex === index ? '#F20C8F' : 'url(#barGradient)'}
                    rx={4}
                    ry={4}
                    style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </>
        );

      case 'scatter':
        return (
          <>
            {/* Connecting lines (optional, subtle) */}
            <path
              d={points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Scatter points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredIndex === index ? 10 : 8}
                  fill={hoveredIndex === index ? '#F20C8F' : '#083A85'}
                  stroke="white"
                  strokeWidth="3"
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Inner dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill="white"
                  pointerEvents="none"
                />
              </g>
            ))}
          </>
        );

      case 'line':
      default:
        return (
          <>
            <defs>
              <linearGradient id="spendingAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#083A85" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#083A85" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#spendingAreaGradient)" />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#083A85"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Hover detection areas */}
            {points.map((point, index) => (
              <rect
                key={`hover-${index}`}
                x={point.x - 25}
                y={0}
                width={50}
                height={height}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}

            {/* Data point (only show on hover) */}
            {hoveredIndex !== null && (
              <>
                {/* Vertical line */}
                <line
                  x1={points[hoveredIndex].x}
                  y1={points[hoveredIndex].y}
                  x2={points[hoveredIndex].x}
                  y2={height - paddingBottom}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
                {/* Point */}
                <circle
                  cx={points[hoveredIndex].x}
                  cy={points[hoveredIndex].y}
                  r={6}
                  fill="white"
                  stroke="#083A85"
                  strokeWidth="3"
                />
              </>
            )}
          </>
        );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Frame label */}
      <div style={{ fontSize: '0.75rem', color: '#D1D5DB', marginBottom: '0.5rem' }}>Spending Trend</div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
          {renderChart()}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div style={{
            position: 'absolute',
            left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
            top: chartType === 'bar' ? `${points[hoveredIndex].y - 80}px` : `${points[hoveredIndex].y - 70}px`,
            transform: 'translateX(-50%)',
            backgroundColor: colors.bgCard,
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '6px', fontWeight: '500' }}>
              {points[hoveredIndex].date}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#083A85',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: '600' }}>$</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Spending</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: colors.textPrimary }}>
                {formatPrice(points[hoveredIndex].value)}
              </span>
            </div>
          </div>
        )}

        {/* X-axis labels */}
        <div style={{
          position: 'absolute',
          bottom: '0px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 5px'
        }}>
          {data.map((item, index) => (
            <span key={index} style={{
              fontSize: '0.75rem',
              color: '#9CA3AF',
              fontWeight: '500',
              minWidth: '45px',
              textAlign: 'center'
            }}>
              {item.date}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface PaymentGaugeProps {
  paid: number;
  pending: number;
  failed: number;
}

const PaymentGauge: React.FC<PaymentGaugeProps> = ({ paid, pending, failed }) => {
  const { colors } = useTheme();
  const total = paid + pending + failed;
  const paidAngle = (paid / total) * 180;
  const pendingAngle = (pending / total) * 180;

  const createArc = (startAngle: number, endAngle: number, color: string) => {
    const radius = 70;
    const centerX = 80;
    const centerY = 80;
    const startRad = (180 + startAngle) * (Math.PI / 180);
    const endRad = (180 + endAngle) * (Math.PI / 180);
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return (
      <path
        key={color}
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        {createArc(0, paidAngle, '#10B981')}
        {createArc(paidAngle, paidAngle + pendingAngle, '#FBBF24')}
        {createArc(paidAngle + pendingAngle, 180, '#EF4444')}
      </svg>
    </div>
  );
};

interface StatusBadgeProps {
  status: PaymentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'partially_paid': return '#3B82F6';
      case 'failed': return '#EF4444';
      case 'refunded': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: getColor(), textTransform: 'capitalize' }}>
      {status.replace('_', ' ')}
    </span>
  );
};

interface EventTypeBadgeProps {
  type: string;
}

const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({ type }) => {
  const getColor = () => {
    switch (type) {
      case 'Wedding': return '#F20C8F';
      case 'Birthday': return '#8B5CF6';
      case 'Corporate': return '#3B82F6';
      case 'Festival': return '#10B981';
      case 'Portrait': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: getColor() }}>
      {type}
    </span>
  );
};

const PaymentsPage = () => {
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
      if (response.ok) {
        const result = await response.json();
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
            amount: p.amount ? `$${p.amount}` : '$0',
            amountNum: p.amountInUsd ?? p.amount ?? p.amountNum ?? 0,
            paidAmount: p.paidAmountInUsd ?? p.paidAmount ?? 0,
            status: (p.status || 'pending').toLowerCase() as Payment['status'],
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
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  // Fetch streaming payments from dedicated endpoint
  const fetchStreams = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/payments/streaming`);
      if (response.ok) {
        const result = await response.json();
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
          setStreamFeeEvents(mapped);
          if (!result?.totalStreamingRevenue) {
            setTotalStreamingRevenue(mapped.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0));
          }
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
        const data = result?.data?.content || result?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id || '',
            eventTitle: p.eventTitle || 'Live Stream',
            amount: p.amountInUsd || p.amount || 0,
            netAmount: p.withdrawableAmount || p.netAmount || (p.amount ? p.amount * 0.65 : 0),
            currency: p.currencyAbbreviation || p.currency || 'RWF',
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
    setValidationError(null);
    return true;
  };

  const resultsPerPage = 8;
  const totalResults = payments.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));
  const paginatedPayments = payments.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
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
          .mobile-top-row {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-chart-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
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
          .mobile-filters {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-payments-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-stream-fees-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-stream-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            padding: 1rem !important;
          }
          .mobile-stream-right {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            width: 100% !important;
          }
          .mobile-withdraw-card {
            max-width: 100% !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .mobile-withdraw-card button {
            width: 100% !important;
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
        <Topbar userRole="event-coordinator" />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header className="mobile-header" style={{ marginBottom: '1.5rem' }}>
            <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600' }}>Payments</h1>
            <p className="mobile-subtitle" style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
              Manage your payments and view transaction history
            </p>
          </header>

          {/* Pending Payment Warning */}
          {totalPending > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              padding: '0.875rem 1.25rem', marginBottom: '1rem', borderRadius: '0.75rem',
              backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FFFBEB',
              border: `1px solid ${actualTheme === 'dark' ? '#92400E' : '#F59E0B'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(251,191,36,0.2)' : 'rgba(245,158,11,0.15)',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={actualTheme === 'dark' ? '#FDE68A' : '#D97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: actualTheme === 'dark' ? '#FDE68A' : '#92400E' }}>
                    You have {formatPrice(totalPending)} in pending payments
                  </p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: actualTheme === 'dark' ? '#FCD34D' : '#B45309', opacity: 0.85 }}>
                    Please complete your outstanding payments to avoid booking cancellations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Row - Spending Chart and Payment Summary */}
          <div className="mobile-top-row" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginBottom: '1rem' }}>

            {/* Spending Chart */}
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div className="mobile-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Spending</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalPaid + totalPending + totalFailed)}</span>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary, fontWeight: '500' }}>This period</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Chart Type Selector */}
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: colors.bgTertiary, borderRadius: '0.375rem', padding: '0.25rem' }}>
                    <button
                      onClick={() => setChartType('line')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'line' ? colors.bgCard : 'transparent',
                        boxShadow: chartType === 'line' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Line Chart"
                    >
                      <LineChartIcon active={chartType === 'line'} />
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'bar' ? colors.bgCard : 'transparent',
                        boxShadow: chartType === 'bar' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Bar Chart"
                    >
                      <BarChartIcon active={chartType === 'bar'} />
                    </button>
                    <button
                      onClick={() => setChartType('scatter')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'scatter' ? colors.bgCard : 'transparent',
                        boxShadow: chartType === 'scatter' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Scatter Chart"
                    >
                      <ScatterChartIcon active={chartType === 'scatter'} />
                    </button>
                  </div>
                  {/* Time Period Filter */}
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: colors.bgTertiary, borderRadius: '0.375rem', padding: '0.25rem' }}>
                    {(['1W', '1M', '3M', '6M', '1Y'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setActiveTimeFilter(period)}
                        style={{
                          padding: '0.375rem 0.625rem',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          backgroundColor: activeTimeFilter === period ? '#083A85' : 'transparent',
                          color: activeTimeFilter === period ? 'white' : colors.textSecondary,
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <SpendingChart data={spendingData} height={150} chartType={chartType} />
            </div>

            {/* Payment Summary */}
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Payment Summary</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Current Period</div>
                </div>
                <button onClick={() => setShowReportModal(true)} style={{ fontSize: '0.85rem', color: '#2563EB', textDecoration: 'none', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>View report</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Paid</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalPaid)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Pending</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalPending)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Failed</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalFailed)}</div>
                </div>
              </div>
              <PaymentGauge paid={totalPaid} pending={totalPending} failed={totalFailed} />
            </div>
          </div>

          {/* Stream Fees Section */}
          <div style={{
            position: 'relative',
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            boxShadow: '0 14px 32px -14px rgba(8,58,133,0.18), 0 4px 12px -4px rgba(0,0,0,0.06)',
            border: `1px solid ${colors.borderPrimary}`,
            overflow: 'hidden',
            marginBottom: '1rem',
          }}>
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            }} />
            <div className="mobile-stream-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: 12,
                  padding: 2,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  flexShrink: 0,
                  boxShadow: '0 6px 14px -4px rgba(242,12,143,0.30)',
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    borderRadius: 10,
                    background: colors.bgCard,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-broadcast" style={{ fontSize: 18, color: '#F20C8F' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>ConnektLive</div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Live Stream Revenue</h2>
                  <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: '2px 0 0' }}>From ticketed live-stream viewers on ConnektLive</p>
                </div>
              </div>
              <div className="mobile-stream-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Withdrawal Setup Card */}
                <div className="mobile-withdraw-card" style={{
                  position: 'relative',
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                    : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.22)' : 'rgba(8,58,133,0.12)'}`,
                  borderRadius: 12,
                  padding: '0.7rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  maxWidth: 440,
                  overflow: 'hidden',
                }}>
                  <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                      {hasWithdrawalMethod ? 'Withdrawal' : 'Setup needed'}
                    </div>
                    <div style={{ fontSize: '0.93rem', fontWeight: 800, color: colors.textPrimary, marginBottom: 2, letterSpacing: '-0.01em' }}>
                      {hasWithdrawalMethod ? 'Stream Revenue Earnings' : 'Withdraw Your Stream Revenue Earnings'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: colors.textSecondary, lineHeight: 1.4 }}>
                      {hasWithdrawalMethod ? 'Withdraw your stream revenue earnings to your saved payment account.' : 'Set up your preferred account to receive payments from stream ticket sales.'}
                    </div>
                  </div>
                  {hasWithdrawalMethod ? (
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: '#fff', border: 'none',
                        borderRadius: 10, padding: '0.5rem 0.95rem',
                        fontSize: '0.83rem', fontWeight: 700, letterSpacing: '-0.005em',
                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        boxShadow: '0 6px 16px -4px rgba(242,12,143,0.40)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <i className="bi bi-cash-coin" style={{ fontSize: 13 }} />
                      Withdraw
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowStreamFeeWithdrawModal(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: '#fff', border: 'none',
                        borderRadius: 10, padding: '0.5rem 0.95rem',
                        fontSize: '0.83rem', fontWeight: 700, letterSpacing: '-0.005em',
                        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        boxShadow: '0 6px 16px -4px rgba(242,12,143,0.40)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <i className="bi bi-bank2" style={{ fontSize: 13 }} />
                      Set up withdrawal
                    </button>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  textAlign: 'right',
                  paddingLeft: 6,
                  borderLeft: `1px solid ${colors.borderPrimary}`,
                }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total Revenue</div>
                  <div style={{
                    fontSize: '1.55rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.015em',
                    marginTop: 2,
                  }}>{formatPrice(totalStreamFees)}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem' }}>
              {streamFeeEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textSecondary, fontSize: '0.85rem' }}>
                  No streaming payments yet. Entry fee payments from viewers will appear here.
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4' }}>
                        <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase' }}>Viewer</th>
                        <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase' }}>Event</th>
                        <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase' }}>Method</th>
                        <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamFeeEvents.map((payment) => (
                        <tr key={payment.id} style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: colors.textPrimary }}>{payment.viewerName}</div>
                            {payment.viewerEmail && <div style={{ fontSize: '0.7rem', color: colors.textSecondary }}>{payment.viewerEmail}</div>}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <LiveStreamIcon />
                              <span style={{ fontSize: '0.82rem', color: colors.textPrimary }}>{payment.eventTitle}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.82rem', color: colors.textSecondary, textTransform: 'capitalize' }}>{payment.method}</td>
                          <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>
                            {formatPrice(payment.amount)} {payment.currency}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: colors.textSecondary }}>
                            {payment.date ? new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <span style={{
                              display: 'inline-block',
                              backgroundColor: payment.status === 'completed' ? (actualTheme === 'dark' ? '#064E3B' : '#D1FAE5') : payment.status === 'failed' ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2') : (actualTheme === 'dark' ? '#78350F' : '#FEF3C7'),
                              color: payment.status === 'completed' ? (actualTheme === 'dark' ? '#34D399' : '#059669') : payment.status === 'failed' ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : (actualTheme === 'dark' ? '#FBBF24' : '#D97706'),
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Gift Earnings Section */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #F20C8F 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Gift Earnings</h2>
                  <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: 0 }}>Gifts received from live-stream viewers</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: colors.textSecondary }}>Total Gifts (65%)</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#F20C8F' }}>{formatPrice(totalGiftRevenue)}</div>
              </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {giftPayments.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>
                  No gifts received yet. Gifts from live-stream viewers will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
                  {giftPayments.map((gift) => {
                    const isPhoneOnly = gift.customerPhone && /^\d+$/.test(gift.customerPhone.replace(/[+\s]/g, ''));
                    const senderDisplay = isPhoneOnly
                      ? gift.customerPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
                      : (gift.customerPhone || 'Anonymous');
                    return (
                      <div key={gift.id} style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgTertiary,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: gift.giftMessage ? '0.5rem' : 0 }}>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: colors.textPrimary }}>{senderDisplay}</div>
                            <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.1rem' }}>{gift.eventTitle} &bull; {gift.date ? new Date(gift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F20C8F' }}>{gift.currency} {gift.netAmount.toLocaleString()}</div>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 600,
                              padding: '0.1rem 0.4rem', borderRadius: '0.25rem',
                              backgroundColor: gift.status === 'completed' ? '#ECFDF5' : '#FEF3C7',
                              color: gift.status === 'completed' ? '#059669' : '#D97706',
                              textTransform: 'uppercase',
                            }}>{gift.status}</span>
                          </div>
                        </div>
                        {gift.giftMessage && (
                          <div style={{
                            backgroundColor: actualTheme === 'dark' ? 'rgba(242,12,143,0.06)' : '#FDF2F8',
                            borderLeft: '3px solid #F20C8F',
                            borderRadius: '0 0.35rem 0.35rem 0',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.78rem',
                            color: colors.textSecondary,
                            fontStyle: 'italic',
                          }}>
                            &ldquo;{gift.giftMessage}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Payments History Table */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary }}>Payment History</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: colors.bgCard, border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: colors.textSecondary, cursor: 'pointer' }}>
                <CalendarIcon />
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </button>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: colors.bgTertiary }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Event / Photographer</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Invoice</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', backgroundColor: colors.bgTertiary }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: `2px solid ${colors.borderPrimary}` }}>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>{payment.date}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                          {payment.photographerImage && (
                            <img src={payment.photographerImage} alt={payment.photographerName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>{payment.eventName}</div>
                          <EventTypeBadge type={payment.eventType} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>{payment.method}</td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(payment.amountNum)}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}><StatusBadge status={payment.status} /></td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{payment.invoiceNumber}</span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><CopyIcon /></button>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {(payment.status === 'pending' || payment.status === 'partially_paid') && (
                          <button
                            onClick={() => handlePayNow(payment)}
                            style={{
                              backgroundColor: '#083A85',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <CreditCardIcon />
                            Pay Now
                          </button>
                        )}
                        {payment.status === 'failed' && (
                          <button
                            onClick={() => handlePayNow(payment)}
                            style={{
                              backgroundColor: '#F20C8F',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <RefreshIcon />
                            Retry
                          </button>
                        )}
                        {payment.status === 'paid' && (
                          <button onClick={() => handleDownloadReceipt(payment)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} title="Download Receipt"><DownloadIcon /></button>
                        )}
                        <button onClick={() => handleViewPayment(payment)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} title="View Details"><ViewIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: `2px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Showing {Math.min(resultsPerPage, totalResults - (currentPage - 1) * resultsPerPage)} of {totalResults} Results</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ background: 'none', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === 1 ? 0.5 : 1 }}>
                  <ChevronLeftIcon />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ width: '32px', height: '32px', border: currentPage === page ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: currentPage === page ? '#083A85' : colors.bgCard, color: currentPage === page ? 'white' : colors.textSecondary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {page}
                  </button>
                ))}
                {totalPages > 5 && <>
                  <span style={{ padding: '0 0.5rem', color: colors.textSecondary }}>...</span>
                  <button onClick={() => setCurrentPage(totalPages)} style={{ width: '32px', height: '32px', border: currentPage === totalPages ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: currentPage === totalPages ? '#083A85' : colors.bgCard, color: currentPage === totalPages ? 'white' : colors.textSecondary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {totalPages}
                  </button>
                </>}
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ background: 'none', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} payments={payments} />
      <PaymentDetailsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payment={selectedPayment}
      />
      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
        onPaymentSuccess={fetchPayments}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        role="event-coordinator"
        colors={colors}
        actualTheme={actualTheme}
      />

      {/* Stream Fee Withdrawal Modal */}
      <Modal
        isOpen={showStreamFeeWithdrawModal}
        onClose={() => {
          setShowStreamFeeWithdrawModal(false);
          setSelectedStreamFeePaymentMethod(null);
          setValidationError(null);
        }}
        title="Withdraw Stream Revenue"
        maxWidth="500px"
      >
        <div>
          {/* Explainer Box */}
          <div style={{
            position: 'relative',
            background: actualTheme === 'dark'
              ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
              : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.22)' : 'rgba(8,58,133,0.12)'}`,
            borderRadius: 12,
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            overflow: 'hidden',
          }}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)' }} />
            <div style={{
              width: 38, height: 38,
              borderRadius: 11,
              padding: 2,
              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
              flexShrink: 0,
              boxShadow: '0 5px 12px -4px rgba(242,12,143,0.30)',
            }}>
              <div style={{
                width: '100%', height: '100%',
                borderRadius: 9,
                background: colors.bgCard,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-broadcast" style={{ fontSize: 16, color: '#F20C8F' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Withdrawal account</div>
              <div style={{ fontSize: '0.93rem', fontWeight: 800, color: colors.textPrimary, marginBottom: 3, letterSpacing: '-0.01em' }}>
                Where should we send your stream revenue earnings?
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary, lineHeight: 1.45 }}>
                When viewers pay for access to your live streams, this is the account where you&apos;ll receive those payments.
              </div>
            </div>
          </div>

          {/* Rwanda Mobile Money Requirement Notice */}
          {isRwanda && (
            <div style={{
              background: actualTheme === 'dark' ? 'rgba(30,58,95,0.45)' : 'rgba(8,58,133,0.06)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(147,197,253,0.30)' : 'rgba(8,58,133,0.22)'}`,
              borderRadius: 10,
              padding: '0.6rem 0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '0.83rem',
              color: actualTheme === 'dark' ? '#93C5FD' : '#083A85',
              lineHeight: 1.45,
            }}>
              <i className="bi bi-info-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
              <span><strong>Required for Rwanda:</strong> You must select either MTN or Airtel Mobile Money as a payment method. You can also add other methods optionally.</span>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div style={{
              background: actualTheme === 'dark' ? 'rgba(127,29,29,0.32)' : '#FEF2F2',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(252,165,165,0.32)' : '#FECACA'}`,
              borderRadius: 10,
              padding: '0.6rem 0.8rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
              fontSize: '0.85rem',
            }}>
              <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Payment Method Options */}
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.55rem' }}>
            Select your withdrawal account
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {([
              { id: 'mtn',    title: 'MTN Mobile Money',    subtitle: 'Receive payments via MTN MoMo',         logo: { src: '/mtn.png' },    rwandaRequired: true },
              { id: 'airtel', title: 'Airtel Mobile Money', subtitle: 'Receive payments via Airtel Money',     logo: { src: '/airtel.png' }, rwandaRequired: true },
              { id: 'bank',   title: 'Bank Transfer',       subtitle: 'Receive payments to your bank account', logo: { icon: 'bi-bank2' },   rwandaRequired: false },
            ] as const).map((m) => {
              const isSelected = selectedStreamFeePaymentMethod === m.id;
              const showRwandaWarning = isRwanda && m.rwandaRequired && !hasMobileMoneySelected;
              return (
                <div
                  key={m.id}
                  onClick={() => { setSelectedStreamFeePaymentMethod(m.id); setValidationError(null); }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 0.95rem',
                    border: `1.5px solid ${isSelected ? '#F20C8F' : (showRwandaWarning ? '#F59E0B' : colors.borderPrimary)}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    background: isSelected
                      ? (actualTheme === 'dark'
                        ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                        : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.05) 100%)')
                      : colors.bgCard,
                    boxShadow: isSelected ? '0 8px 22px -8px rgba(242,12,143,0.30)' : 'none',
                    overflow: 'hidden',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                  }}
                >
                  {isSelected && (
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                    }} />
                  )}
                  <div style={{
                    width: 46, height: 46,
                    borderRadius: 11,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'logo' in m && m.logo && 'icon' in m.logo ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)' : 'transparent',
                    border: 'logo' in m && m.logo && 'icon' in m.logo ? `1px solid rgba(8,58,133,0.20)` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {'logo' in m && m.logo && 'src' in m.logo ? (
                      <Image src={m.logo.src} alt={m.title} width={46} height={46} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    ) : (
                      <i className={`bi ${(m.logo as { icon: string }).icon}`} style={{ fontSize: 22, color: '#083A85' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em' }}>{m.title}</span>
                      {isRwanda && m.rwandaRequired && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: '0.6rem', fontWeight: 700,
                          color: '#D97706',
                          background: actualTheme === 'dark' ? 'rgba(120,53,15,0.45)' : 'rgba(245,158,11,0.14)',
                          border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.40)' : 'rgba(245,158,11,0.35)'}`,
                          padding: '2px 7px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          <i className="bi bi-flag-fill" style={{ fontSize: 9 }} />
                          Required
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 2 }}>{m.subtitle}</div>
                  </div>
                  {/* Branded radio */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    flexShrink: 0,
                    padding: isSelected ? 2 : 0,
                    background: isSelected ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' : 'transparent',
                    border: isSelected ? 'none' : `1.5px solid ${colors.borderPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: colors.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Details Form */}
          {selectedStreamFeePaymentMethod && (
            <div style={{
              position: 'relative',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.03) 100%)',
              borderRadius: 14,
              padding: '1rem',
              marginBottom: '1.25rem',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.22)' : 'rgba(8,58,133,0.12)'}`,
              overflow: 'hidden',
            }}>
              <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
                <i className={`bi ${selectedStreamFeePaymentMethod === 'bank' ? 'bi-bank2' : 'bi-phone-fill'}`} style={{ fontSize: 14, color: '#F20C8F' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                  {selectedStreamFeePaymentMethod === 'mtn' && 'MTN Mobile Money details'}
                  {selectedStreamFeePaymentMethod === 'airtel' && 'Airtel Mobile Money details'}
                  {selectedStreamFeePaymentMethod === 'bank' && 'Bank account details'}
                </h4>
              </div>

              {/* MTN Fields */}
              {selectedStreamFeePaymentMethod === 'mtn' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    MTN Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+256 78X XXX XXX"
                    value={streamFeePaymentDetails.mtnNumber}
                    onChange={(e) => setStreamFeePaymentDetails({ ...streamFeePaymentDetails, mtnNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      border: `1.5px solid ${colors.borderPrimary}`,
                      borderRadius: 11,
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgCard,
                      color: colors.textPrimary,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Airtel Fields */}
              {selectedStreamFeePaymentMethod === 'airtel' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    Airtel Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+256 70X XXX XXX"
                    value={streamFeePaymentDetails.airtelNumber}
                    onChange={(e) => setStreamFeePaymentDetails({ ...streamFeePaymentDetails, airtelNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      border: `1.5px solid ${colors.borderPrimary}`,
                      borderRadius: 11,
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgCard,
                      color: colors.textPrimary,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Bank Transfer Fields */}
              {selectedStreamFeePaymentMethod === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Select Bank
                    </label>
                    <select
                      value={streamFeePaymentDetails.selectedBank}
                      onChange={(e) => setStreamFeePaymentDetails({ ...streamFeePaymentDetails, selectedBank: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem',
                        border: `1.5px solid ${streamFeePaymentDetails.selectedBank ? '#F20C8F' : colors.borderPrimary}`,
                        borderRadius: 11,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary,
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="">Choose a bank…</option>
                      {bankProviders.map((bank) => (
                        <option key={bank.id} value={bank.name}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your bank account number"
                      value={streamFeePaymentDetails.bankAccountNumber}
                      onChange={(e) => setStreamFeePaymentDetails({ ...streamFeePaymentDetails, bankAccountNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem',
                        border: `1.5px solid ${colors.borderPrimary}`,
                        borderRadius: 11,
                        fontSize: '0.9rem',
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name as it appears on your bank account"
                      value={streamFeePaymentDetails.bankAccountName}
                      onChange={(e) => setStreamFeePaymentDetails({ ...streamFeePaymentDetails, bankAccountName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem',
                        border: `1.5px solid ${colors.borderPrimary}`,
                        borderRadius: 11,
                        fontSize: '0.9rem',
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
            <button
              onClick={() => {
                setShowStreamFeeWithdrawModal(false);
                setSelectedStreamFeePaymentMethod(null);
                setValidationError(null);
              }}
              className="ck-btn ck-btn-soft"
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Validate Rwanda mobile money requirement
                if (!validateStreamFeePaymentMethod()) {
                  return;
                }
                // Handle save payment method
                setShowStreamFeeWithdrawModal(false);
                setSelectedStreamFeePaymentMethod(null);
                setValidationError(null);
              }}
              disabled={!selectedStreamFeePaymentMethod}
              title={!selectedStreamFeePaymentMethod ? 'Select a withdrawal account first' : undefined}
              style={{
                padding: '0.7rem 1.3rem',
                borderRadius: 11,
                border: 'none',
                background: !selectedStreamFeePaymentMethod ? colors.bgTertiary : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: !selectedStreamFeePaymentMethod ? colors.textSecondary : '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: !selectedStreamFeePaymentMethod ? 'not-allowed' : 'pointer',
                opacity: !selectedStreamFeePaymentMethod ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: !selectedStreamFeePaymentMethod ? 'none' : '0 8px 22px -6px rgba(242,12,143,0.42)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { if (selectedStreamFeePaymentMethod) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="bi bi-check2-circle" style={{ fontSize: 13 }} />
              Save withdrawal method
            </button>
          </div>
        </div>
      </Modal>

      {/* Note: Event Coordinators don't have donate prompts - they manage commercial event stream revenue */}

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentsPage;
