"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { HeartIcon } from '../../components/UnlockModal';

function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}

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

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="13" rx="2" stroke="#16A34A" strokeWidth="2"/>
    <path d="M12 8V21" stroke="#16A34A" strokeWidth="2"/>
    <path d="M3 12H21" stroke="#16A34A" strokeWidth="2"/>
    <path d="M12 8C12 8 12 5 9.5 5C7 5 7 8 9.5 8C10.5 8 11.5 8 12 8Z" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8C12 8 12 5 14.5 5C17 5 17 8 14.5 8C13.5 8 12.5 8 12 8Z" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  reportData: {
    period: string;
    totalPaid: number;
    pending: number;
    failed: number;
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
  };
}

const ViewReportModal: React.FC<ViewReportModalProps> = ({ isOpen, onClose, reportData }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();

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
type PaymentPercentage = 50 | 75 | 100;
type PaymentStep = 'percentage' | 'survey' | 'method' | 'receipt';

interface SurveyResponses {
  attendedAsAgreed: 'yes' | 'no' | null;
  serviceDelivered: 'yes' | 'partially' | 'no' | null;
  qualitySatisfaction: 'very_satisfied' | 'satisfied' | 'not_satisfied' | null;
  deliverablesReceived: 'yes' | 'not_yet' | null;
  issuesDuringService: string;
  wouldBookAgain: 'yes' | 'no' | null;
}

const EMPTY_SURVEY: SurveyResponses = {
  attendedAsAgreed: null,
  serviceDelivered: null,
  qualitySatisfaction: null,
  deliverablesReceived: null,
  issuesDuringService: '',
  wouldBookAgain: null,
};

interface Payment {
  id: number;
  declarationId: string;
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
}

const PAYMENT_METHODS: Record<string, { label: string; image: string }> = {
  card: { label: 'Credit/Debit Card', image: '/cards.png' },
  mtn: { label: 'MTN Mobile Money', image: '/mtn.png' },
  airtel: { label: 'Airtel Mobile Money', image: '/airtel.png' },
};

const PayNowModal: React.FC<PayNowModalProps> = ({ isOpen, onClose, payment }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [customDonation, setCustomDonation] = useState<string>('');
  const [donationSkipped, setDonationSkipped] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const initialStep: PaymentStep = payment?.status === 'failed' ? 'method' : 'percentage';
  const [step, setStep] = useState<PaymentStep>(initialStep);
  const [selectedPercentage, setSelectedPercentage] = useState<PaymentPercentage | null>(
    payment?.status === 'failed' ? 100 : null
  );
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponses>({ ...EMPTY_SURVEY });
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  useEffect(() => {
    if (payment) {
      const key = `survey_completed_${payment.declarationId || payment.id}`;
      setSurveyCompleted(localStorage.getItem(key) === 'true');
    }
  }, [payment]);

  useEffect(() => {
    if (!isOpen) return;
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/customer/preferences`)
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

  const fullAmountDue = payment.amountNum - payment.paidAmount;
  const amountDue = selectedPercentage
    ? fullAmountDue * (selectedPercentage / 100)
    : fullAmountDue;
  const donationValue = donationAmount === 'custom' ? (parseFloat(customDonation) || 0) : (parseFloat(donationAmount) || 0);
  const totalAmount = amountDue + donationValue;
  const donationAddressed = donationSkipped || donationValue > 0;
  const isPayEnabled = donationAddressed;

  const isSurveyComplete = (): boolean => {
    const r = surveyResponses;
    return r.attendedAsAgreed !== null && r.serviceDelivered !== null &&
      r.qualitySatisfaction !== null && r.deliverablesReceived !== null &&
      r.wouldBookAgain !== null;
  };

  const hasNegativeResponses = (): boolean => {
    const r = surveyResponses;
    return r.attendedAsAgreed === 'no' || r.serviceDelivered === 'no' ||
      r.qualitySatisfaction === 'not_satisfied' || r.deliverablesReceived === 'not_yet' ||
      r.wouldBookAgain === 'no';
  };

  const handlePercentageContinue = () => {
    if (selectedPercentage === 100 && !surveyCompleted) {
      setStep('survey');
    } else {
      setStep('method');
    }
  };

  const handleSurveySubmit = async () => {
    const paymentKey = String(payment.declarationId || payment.id);
    const surveyData = {
      paymentId: paymentKey,
      responses: surveyResponses,
      hasDispute: hasNegativeResponses(),
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(`survey_completed_${paymentKey}`, 'true');
    localStorage.setItem(`survey_data_${paymentKey}`, JSON.stringify(surveyData));
    setSurveyCompleted(true);

    try {
      const apiUrl = getApiUrl();
      await dashboardAuthFetch(`${apiUrl}/api/remote/payments/${paymentKey}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });
      localStorage.removeItem(`survey_data_${paymentKey}`);
    } catch {
      // Stored locally for retry
    }
    setStep('method');
  };

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
    setStep(payment?.status === 'failed' ? 'method' : 'percentage');
    setSelectedPercentage(payment?.status === 'failed' ? 100 : null);
    setSurveyResponses({ ...EMPTY_SURVEY });
    onClose();
  };

  // ==================== STEP: PERCENTAGE ====================
  if (step === 'percentage') {
    const percentageOptions: { value: PaymentPercentage; label: string; isEscrow: boolean }[] = [
      { value: 50, label: '50%', isEscrow: true },
      { value: 75, label: '75%', isEscrow: true },
      { value: 100, label: '100%', isEscrow: false },
    ];

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Select Payment Amount" maxWidth="450px">
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
            How much would you like to pay?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {percentageOptions.map((opt) => {
              const isSelected = selectedPercentage === opt.value;
              const is100Locked = opt.value === 100 && !surveyCompleted;
              const calcAmount = fullAmountDue * (opt.value / 100);

              return (
                <div
                  key={opt.value}
                  onClick={() => { if (!is100Locked) setSelectedPercentage(opt.value); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                    border: isSelected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.75rem',
                    cursor: is100Locked ? 'not-allowed' : 'pointer',
                    backgroundColor: is100Locked
                      ? (actualTheme === 'dark' ? 'rgba(107, 114, 128, 0.1)' : '#F9FAFB')
                      : isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                    opacity: is100Locked ? 0.6 : 1, transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: is100Locked ? colors.textSecondary : colors.textPrimary }}>{opt.label}</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '9999px',
                        backgroundColor: opt.isEscrow ? '#FEF3C7' : '#D1FAE5', color: opt.isEscrow ? '#92400E' : '#065F46',
                      }}>{opt.isEscrow ? 'Escrow' : 'Direct'}</span>
                      {is100Locked && <i className="bi bi-lock-fill" style={{ fontSize: '0.85rem', color: colors.textSecondary }} />}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: is100Locked ? colors.textSecondary : (actualTheme === 'dark' ? '#60A5FA' : '#083A85') }}>{formatPrice(calcAmount)}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.2rem' }}>
                      {is100Locked ? 'Complete satisfaction survey to unlock' : opt.isEscrow ? 'Held by platform until you confirm satisfaction' : 'Released directly to photographer'}
                    </div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          {selectedPercentage && selectedPercentage < 100 && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE'}`,
              borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <i className="bi bi-info-circle-fill" style={{ color: '#3B82F6', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF', lineHeight: '1.4' }}>
                Remaining balance of {formatPrice(fullAmountDue - fullAmountDue * (selectedPercentage / 100))} will be due after service completion. Escrowed funds are released when you confirm satisfaction.
              </span>
            </div>
          )}

          {selectedPercentage === 100 && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`,
              borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <i className="bi bi-check-circle-fill" style={{ color: '#10B981', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#6EE7B7' : '#065F46', lineHeight: '1.4' }}>
                Full payment will be released directly to the photographer.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={handleClose} style={{
              flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
            }}>Cancel</button>
            <button disabled={!selectedPercentage} onClick={handlePercentageContinue} style={{
              flex: 1, padding: '0.75rem 1rem',
              border: !selectedPercentage ? '2px solid #9CA3AF' : '2px solid #062a63',
              borderRadius: '0.5rem', background: !selectedPercentage ? '#9CA3AF' : '#083A85',
              color: 'white', fontSize: '0.9rem', fontWeight: '600',
              cursor: !selectedPercentage ? 'not-allowed' : 'pointer', opacity: !selectedPercentage ? 0.7 : 1, transition: 'all 0.2s'
            }}>Continue</button>
          </div>
        </div>
      </Modal>
    );
  }

  // ==================== STEP: SURVEY ====================
  if (step === 'survey') {
    const surveyOptionStyle = (isSelected: boolean) => ({
      padding: '0.45rem 0.85rem',
      border: isSelected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
      borderRadius: '0.5rem',
      background: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
      color: isSelected ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
      fontSize: '0.8rem', fontWeight: '600' as const, cursor: 'pointer', transition: 'all 0.2s',
    });

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Service Confirmation" maxWidth="520px">
        <div>
          <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0', lineHeight: '1.4' }}>
            Please complete this survey before making a full (100%) payment. Your feedback helps ensure service quality.
          </p>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.attendedAsAgreed ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>1. Did the photographer attend the event as agreed?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, attendedAsAgreed: 'yes' }))} style={surveyOptionStyle(surveyResponses.attendedAsAgreed === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, attendedAsAgreed: 'no' }))} style={surveyOptionStyle(surveyResponses.attendedAsAgreed === 'no')}>No</button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.serviceDelivered ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>2. Was the service delivered as expected?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, serviceDelivered: 'yes' }))} style={surveyOptionStyle(surveyResponses.serviceDelivered === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, serviceDelivered: 'partially' }))} style={surveyOptionStyle(surveyResponses.serviceDelivered === 'partially')}>Partially</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, serviceDelivered: 'no' }))} style={surveyOptionStyle(surveyResponses.serviceDelivered === 'no')}>No</button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.qualitySatisfaction ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>3. Are you satisfied with the quality of service?</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, qualitySatisfaction: 'very_satisfied' }))} style={surveyOptionStyle(surveyResponses.qualitySatisfaction === 'very_satisfied')}>Very Satisfied</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, qualitySatisfaction: 'satisfied' }))} style={surveyOptionStyle(surveyResponses.qualitySatisfaction === 'satisfied')}>Satisfied</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, qualitySatisfaction: 'not_satisfied' }))} style={surveyOptionStyle(surveyResponses.qualitySatisfaction === 'not_satisfied')}>Not Satisfied</button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.deliverablesReceived ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>4. Have you received the agreed deliverables (photos/videos)?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, deliverablesReceived: 'yes' }))} style={surveyOptionStyle(surveyResponses.deliverablesReceived === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, deliverablesReceived: 'not_yet' }))} style={surveyOptionStyle(surveyResponses.deliverablesReceived === 'not_yet')}>Not Yet</button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${colors.borderPrimary}` }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              5. Were there any issues during the service? <span style={{ fontWeight: '400', color: colors.textSecondary }}>(Optional)</span>
            </p>
            <textarea placeholder="Describe any issues..." value={surveyResponses.issuesDuringService}
              onChange={(e) => setSurveyResponses(p => ({ ...p, issuesDuringService: e.target.value }))}
              style={{ width: '100%', minHeight: '60px', padding: '0.5rem 0.75rem', border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', fontSize: '0.85rem', color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.wouldBookAgain ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>6. Would you book this photographer again?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, wouldBookAgain: 'yes' }))} style={surveyOptionStyle(surveyResponses.wouldBookAgain === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, wouldBookAgain: 'no' }))} style={surveyOptionStyle(surveyResponses.wouldBookAgain === 'no')}>No</button>
            </div>
          </div>

          {hasNegativeResponses() && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`,
              borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F59E0B', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#FCD34D' : '#92400E', lineHeight: '1.4' }}>
                Your responses indicate potential issues. A review flag will be created for this booking.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setStep('percentage')} style={{
              flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
            }}>Back</button>
            <button disabled={!isSurveyComplete()} onClick={handleSurveySubmit} style={{
              flex: 1, padding: '0.75rem 1rem',
              border: !isSurveyComplete() ? '2px solid #9CA3AF' : '2px solid #062a63',
              borderRadius: '0.5rem', background: !isSurveyComplete() ? '#9CA3AF' : '#083A85',
              color: 'white', fontSize: '0.9rem', fontWeight: '600',
              cursor: !isSurveyComplete() ? 'not-allowed' : 'pointer', opacity: !isSurveyComplete() ? 0.7 : 1, transition: 'all 0.2s'
            }}>Submit & Continue</button>
          </div>
        </div>
      </Modal>
    );
  }

  // ==================== STEP: RECEIPT ====================
  if (step === 'receipt') {
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
            {/* Payment Type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Payment Type</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '9999px',
                backgroundColor: selectedPercentage === 100 ? '#D1FAE5' : '#FEF3C7',
                color: selectedPercentage === 100 ? '#065F46' : '#92400E',
              }}>{selectedPercentage}% - {selectedPercentage === 100 ? 'Direct' : 'Escrow'}</span>
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
              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>Amount Due ({selectedPercentage}%)</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(amountDue)}</span>
            </div>
            {selectedPercentage && selectedPercentage < 100 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary }}>Remaining</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary }}>{formatPrice(fullAmountDue - amountDue)}</span>
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

          {/* Escrow notice */}
          {selectedPercentage && selectedPercentage < 100 && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE'}`,
              borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <i className="bi bi-shield-check" style={{ color: '#3B82F6', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF', lineHeight: '1.4' }}>
                This payment will be held in escrow and released to the photographer once you confirm satisfaction.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setStep('method')} disabled={isProcessing} style={{
              flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}>Cancel</button>
            <button disabled={isProcessing} onClick={async () => {
              if (!payment.declarationId) return;
              setIsProcessing(true);
              try {
                const apiUrl = getApiUrl();
                const params = new URLSearchParams({
                  amount: totalAmount.toString(),
                  method: selectedPaymentMethod,
                });
                const res = await dashboardAuthFetch(
                  `${apiUrl}/api/remote/payments/${payment.declarationId}/pay?${params.toString()}`,
                  { method: 'POST', headers: { 'Content-Type': 'application/json' } }
                );
                if (!res.ok) {
                  const err = await res.text().catch(() => '');
                  throw new Error(`Payment failed: ${res.status} ${err}`);
                }
                handleClose();
              } catch (err) {
                console.error('Payment error:', err);
                alert(err instanceof Error ? err.message : 'Payment failed');
              } finally {
                setIsProcessing(false);
              }
            }} style={{
              flex: 1, padding: '0.75rem 1rem',
              border: payment.status === 'failed' ? '2px solid #c00a72' : '2px solid #062a63',
              borderRadius: '0.5rem', background: isProcessing ? '#9CA3AF' : (payment.status === 'failed' ? '#F20C8F' : '#083A85'),
              color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: isProcessing ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}>
              {isProcessing ? 'Processing...' : `${payment.status === 'failed' ? 'Retry' : 'Pay'} ${formatPrice(totalAmount)}`}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ==================== STEP: METHOD (Payment Method + Donation) ====================
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={payment.status === 'failed' ? 'Retry Payment' : 'Complete Payment'} maxWidth="450px">
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
            Select Payment Method
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div onClick={() => setSelectedPaymentMethod('card')} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
              border: selectedPaymentMethod === 'card' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
              borderRadius: '0.75rem', cursor: 'pointer',
              backgroundColor: selectedPaymentMethod === 'card' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard, transition: 'all 0.2s'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Credit/Debit Card</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay with Visa, Mastercard, etc.</div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selectedPaymentMethod === 'card' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard }} />
            </div>

            <div onClick={() => setSelectedPaymentMethod('mtn')} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
              border: selectedPaymentMethod === 'mtn' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
              borderRadius: '0.75rem', cursor: 'pointer',
              backgroundColor: selectedPaymentMethod === 'mtn' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard, transition: 'all 0.2s'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/mtn.png" alt="MTN Mobile Money" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>MTN Mobile Money</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via MTN MoMo</div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selectedPaymentMethod === 'mtn' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard }} />
            </div>

            <div onClick={() => setSelectedPaymentMethod('airtel')} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
              border: selectedPaymentMethod === 'airtel' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
              borderRadius: '0.75rem', cursor: 'pointer',
              backgroundColor: selectedPaymentMethod === 'airtel' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard, transition: 'all 0.2s'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/airtel.png" alt="Airtel Mobile Money" width={48} height={48} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Airtel Mobile Money</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via Airtel Money</div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: selectedPaymentMethod === 'airtel' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard }} />
            </div>
          </div>

          <p style={{ fontSize: '0.86rem', color: colors.textSecondary, margin: '0.75rem 0 0 0', textAlign: 'center' }}>
            <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
            Manage your payment methods in <span
              onClick={() => router.push('/user/client/preferences?tab=payments')}
              style={{ color: colors.brandPrimary, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
            >Preferences → Payment Accounts</span>
          </p>
        </div>

        {/* Donation Section */}
        <div style={{
          marginBottom: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
          border: `2px solid ${donationSkipped ? colors.borderPrimary : (donationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.3)')}`,
          background: actualTheme === 'dark'
            ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)'
            : 'linear-gradient(135deg, rgba(242, 12, 143, 0.05) 0%, rgba(255, 107, 157, 0.02) 100%)',
          transition: 'all 0.2s'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartIcon />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Support a Cause</span>
              <span style={{ fontSize: '0.81rem', color: colors.textSecondary, marginLeft: 'auto' }}>Optional</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '0.35rem 0 0 0', lineHeight: '1.4' }}>
              Add a small donation to help fund community projects and initiatives
            </p>
          </div>
          {!donationSkipped && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['5', '10', '25', '50'].map((amount) => (
                  <button key={amount} onClick={() => handleSelectDonation(amount)} style={{
                    padding: '0.4rem 0.75rem', border: donationAmount === amount ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem', background: donationAmount === amount ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                    color: donationAmount === amount ? '#F20C8F' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0'
                  }}>{formatPrice(Number(amount))}</button>
                ))}
                <button onClick={() => handleSelectDonation('custom')} style={{
                  padding: '0.4rem 0.75rem', border: donationAmount === 'custom' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem', background: donationAmount === 'custom' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                  color: donationAmount === 'custom' ? '#F20C8F' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0'
                }}>Custom</button>
              </div>
              {showCustomInput && (
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary }}>$</span>
                  <input type="number" placeholder="Enter amount" value={customDonation} onChange={(e) => setCustomDonation(e.target.value)} style={{
                    width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem', border: `2px solid ${customDonation ? '#F20C8F' : colors.borderPrimary}`,
                    borderRadius: '0.5rem', fontSize: '0.85rem', color: colors.textPrimary, backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }} onFocus={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = customDonation ? '#F20C8F' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>
              )}
            </>
          )}
          <button onClick={handleSkipDonation} style={{
            width: '100%', padding: '0.5rem 1rem', borderRadius: '9999px',
            border: donationSkipped ? '2px solid #F20C8F' : '2px solid #6B7280',
            background: donationSkipped ? '#F20C8F' : colors.bgTertiary,
            color: donationSkipped ? 'white' : '#374151',
            fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
          }}>{donationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}</button>
          <div style={{ marginTop: '0.5rem' }}>
            <a href={`${process.env.NEXT_PUBLIC_LANDING_URL || 'https://amoria-connekt.vercel.app'}/user/donations`} onClick={(e) => { e.preventDefault(); router.push('/user/donations'); }} style={{
              fontSize: '0.81rem', color: '#F20C8F', textDecoration: 'none', fontWeight: '500'
            }}>Learn more about our donation program →</a>
          </div>
        </div>

        {!donationAddressed && (
          <p style={{ fontSize: '0.86rem', color: '#EF4444', margin: '0 0 0.75rem 0', textAlign: 'center' }}>
            Please select a donation amount or skip to continue
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => setStep('percentage')} style={{
            flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
            background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
          }}>Back</button>
          <button disabled={!isPayEnabled} onClick={() => setStep('receipt')} style={{
            flex: 1, padding: '0.75rem 1rem',
            border: !isPayEnabled ? '2px solid #9CA3AF' : '2px solid #062a63',
            borderRadius: '0.5rem', background: !isPayEnabled ? '#9CA3AF' : '#083A85',
            color: 'white', fontSize: '0.9rem', fontWeight: '600',
            cursor: !isPayEnabled ? 'not-allowed' : 'pointer', opacity: !isPayEnabled ? 0.7 : 1, transition: 'all 0.2s'
          }}>Proceed to Payment</button>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: colors.textSecondary, fontSize: '0.85rem' }}>
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
  const barGap = (chartWidth - paddingLeft - paddingRight - (data.length * barWidth)) / (data.length - 1);

  const points = data.map((item, index) => {
    const x = chartType === 'bar'
      ? paddingLeft + index * (barWidth + barGap) + barWidth / 2
      : paddingLeft + (index / (data.length - 1)) * (chartWidth - paddingLeft - paddingRight);
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
  const { token } = useDashboardAuth();
  const router = useRouter();
  const [activeTimeFilter, setActiveTimeFilter] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1W');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasPaymentAccount, setHasPaymentAccount] = useState<boolean | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/customer/preferences`)
      .then(res => res.json())
      .then(result => {
        const prefs = result?.data || {};
        setHasPaymentAccount(Object.keys(prefs).some(k => k.startsWith('payment_method_')));
      })
      .catch(() => setHasPaymentAccount(null));
  }, []);

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handlePayNow = (payment: Payment) => {
    if (hasPaymentAccount === false) {
      setShowSetupModal(true);
      return;
    }
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
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `${apiUrl}/api/remote/customer/payments/spending-trend?period=${period}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'api-token': apiKey,
          },
        }
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
  }, [token]);

  useEffect(() => {
    fetchSpendingTrend(activeTimeFilter);
  }, [activeTimeFilter, fetchSpendingTrend]);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPages, setTotalPages] = useState(5);
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
  const fetchPayments = useCallback(async (page: number) => {
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `${apiUrl}/api/remote/customer/payments?page=${page - 1}&size=${resultsPerPage}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'api-token': apiKey,
          },
        }
      );
      if (!response.ok) return;
      const result = await response.json();
      const pageData = result.data;
      const content = pageData?.content || [];

      const mapped: Payment[] = content.map((item: any, index: number) => ({
        id: index + 1 + (page - 1) * resultsPerPage,
        declarationId: item.id,
        date: formatDate(item.createdAt),
        eventName: item.eventTitle || 'Untitled Event',
        eventType: item.paymentType || 'Booking',
        photographerName: item.photographerName || 'Unknown',
        photographerImage: item.photographerImage || undefined,
        method: '-',
        amount: `${item.currencyAbbreviation || '$'}${item.amount}`,
        amountNum: Number(item.amount) || 0,
        paidAmount: Number(item.paidAmount) || 0,
        status: mapStatus(item.status),
        invoiceNumber: `INV-${String(item.id).substring(0, 8).toUpperCase()}`,
      }));

      setPayments(mapped);
      setTotalPages(pageData?.totalPages || 1);
      setTotalResults(pageData?.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  }, [token, resultsPerPage]);

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage, fetchPayments]);

  // Balance totals from API
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `${apiUrl}/api/remote/customer/payments/balance`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'api-token': apiKey,
          },
        }
      );
      if (!response.ok) return;
      const result = await response.json();
      const data = result.data;
      if (data) {
        setTotalPaid(Number(data.totalPaid) || 0);
        setTotalPending(Number(data.totalPending) || 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Report/stats data
  const [reportData, setReportData] = useState({
    period: '13 - 18 July 2025',
    totalPaid: 1200.13,
    pending: 350.13,
    failed: 200.00,
    totalTransactions: 45,
    completedTransactions: 32,
    pendingTransactions: 8,
    failedTransactions: 5,
  });

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `${apiUrl}/api/remote/customer/payments/stats`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'api-token': apiKey,
          },
        }
      );
      if (!response.ok) return;
      const result = await response.json();
      const data = result.data;
      if (data) {
        setReportData({
          period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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
  }, [token]);

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
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(
        `${apiUrl}/api/remote/customer/payments/gift-streams`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'api-token': apiKey,
          },
        }
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
  }, [token]);

  useEffect(() => {
    fetchGiftStreams();
  }, [fetchGiftStreams]);

  const totalGifts = giftStreams.reduce((sum, stream) => sum + stream.gifters.reduce((s, g) => s + g.amount, 0), 0);

  // State for gift senders modal
  const [showGiftSendersModal, setShowGiftSendersModal] = useState(false);
  const [selectedGiftStream, setSelectedGiftStream] = useState<typeof giftStreams[0] | null>(null);

  // State for gifts payment method modal
  const [showGiftsPaymentMethodModal, setShowGiftsPaymentMethodModal] = useState(false);
  const [selectedGiftPaymentMethod, setSelectedGiftPaymentMethod] = useState<string | null>(null);
  const [giftPaymentDetails, setGiftPaymentDetails] = useState({
    mtnNumber: '',

    
    airtelNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if Rwanda requires mobile money selection
  const isRwanda = profile.country === 'Rwanda';
  const hasMobileMoneySelected = selectedGiftPaymentMethod === 'mtn' || selectedGiftPaymentMethod === 'airtel';

  // Validate that Rwanda users have selected a mobile money option
  const validateGiftPaymentMethod = (): boolean => {
    if (isRwanda && !hasMobileMoneySelected) {
      setValidationError('For users in Rwanda, you must select either MTN or Airtel Mobile Money as a payment method.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const [savingWithdrawal, setSavingWithdrawal] = useState(false);

  const saveWithdrawalMethod = async () => {
    if (!validateGiftPaymentMethod()) return;
    if (!selectedGiftPaymentMethod || !token) return;

    let methodType = '';
    let accountName = '';
    let accountNumber = '';
    let bankName = '';

    if (selectedGiftPaymentMethod === 'mtn') {
      if (!giftPaymentDetails.mtnNumber.trim()) {
        setValidationError('Please enter your MTN phone number.');
        return;
      }
      methodType = 'MOBILE_MONEY';
      accountName = 'MTN Mobile Money';
      accountNumber = giftPaymentDetails.mtnNumber.trim();
      bankName = 'MTN';
    } else if (selectedGiftPaymentMethod === 'airtel') {
      if (!giftPaymentDetails.airtelNumber.trim()) {
        setValidationError('Please enter your Airtel phone number.');
        return;
      }
      methodType = 'MOBILE_MONEY';
      accountName = 'Airtel Money';
      accountNumber = giftPaymentDetails.airtelNumber.trim();
      bankName = 'Airtel';
    } else if (selectedGiftPaymentMethod === 'card') {
      if (!giftPaymentDetails.cardNumber.trim() || !giftPaymentDetails.cardName.trim()) {
        setValidationError('Please fill in all card details.');
        return;
      }
      methodType = 'BANK_TRANSFER';
      accountName = giftPaymentDetails.cardName.trim();
      accountNumber = giftPaymentDetails.cardNumber.trim();
    }

    setSavingWithdrawal(true);
    setValidationError(null);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const params = new URLSearchParams({
        methodType,
        accountName,
        accountNumber,
        isDefault: 'true',
      });
      if (bankName) params.append('bankName', bankName);

      const response = await fetch(
        `${apiUrl}/api/remote/customer/withdrawal-methods?${params.toString()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'api-token': apiKey,
          },
        }
      );

      if (!response.ok) {
        const errResult = await response.json().catch(() => null);
        setValidationError(errResult?.message || 'Failed to save withdrawal method. Please try again.');
        return;
      }

      // Success - close modal and reset
      setShowGiftsPaymentMethodModal(false);
      setSelectedGiftPaymentMethod(null);
      setGiftPaymentDetails({ mtnNumber: '', airtelNumber: '', cardNumber: '', cardExpiry: '', cardCvv: '', cardName: '' });
      setValidationError(null);
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

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
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
          .mobile-gift-streams-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
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
        <Topbar userRole="client" giftAmount={totalGifts} />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header className="mobile-header" style={{ marginBottom: '1.5rem' }}>
            <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600' }}>Payments</h1>
            <p className="mobile-subtitle" style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
              Manage your payments and view transaction history
            </p>
          </header>

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

          {/* Gifts Section */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  backgroundColor: actualTheme === 'dark' ? '#14532D' : '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: actualTheme === 'dark' ? '#4ADE80' : '#16A34A'
                }}>
                  <GiftIcon />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Gifts Received</h2>
                  <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: 0 }}>From live-stream viewers on ConnektLive</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Withdrawal Setup Card */}
                <div style={{
                  backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4',
                  border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}`,
                  borderRadius: '0.5rem',
                  padding: '0.6rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  maxWidth: '420px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.15rem' }}>
                      Withdraw Your Gift Earnings
                    </div>
                    <div style={{ fontSize: '0.82rem', color: colors.textSecondary, lineHeight: '1.35' }}>
                      Set up your preferred account to receive payments from viewer gifts.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGiftsPaymentMethodModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      backgroundColor: '#16A34A',
                      color: 'white',
                      border: '2px solid #15803D',
                      borderRadius: '0.375rem',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    Set Up Withdrawal Method
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Total Gifts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{formatPrice(totalGifts)}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem' }}>
              <div className="mobile-gift-streams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {giftStreams.map((stream) => {
                  const streamTotal = stream.gifters.reduce((s, g) => s + g.amount, 0);
                  const latestMessageGifter = stream.gifters.find(g => g.message);
                  const messagesCount = stream.gifters.filter(g => g.message).length;
                  return (
                    <div
                      key={stream.id}
                      style={{
                        backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4',
                        borderRadius: '0.5rem',
                        border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}`,
                        padding: '0.65rem',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {/* Header row: Platform badge, date, and amount */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <LiveStreamIcon />
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#EF4444',
                            backgroundColor: '#FEE2E2',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '0.25rem',
                            fontWeight: '500'
                          }}>
                            {stream.platform}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: colors.textSecondary }}>{stream.date}</span>
                        </div>
                        <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#16A34A' }}>{formatPrice(streamTotal)}</span>
                      </div>

                      {/* Title row */}
                      <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.35rem 0', lineHeight: '1.3' }}>
                        {stream.streamTitle}
                      </h3>

                      {/* Gifters count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: colors.textSecondary }}><UsersIcon /></span>
                        <span style={{ fontSize: '0.72rem', color: colors.textSecondary }}>{stream.gifters.length} gifter{stream.gifters.length !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Latest Message Preview */}
                      {latestMessageGifter && (
                        <div style={{
                          backgroundColor: actualTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                          borderRadius: '0.375rem',
                          padding: '0.35rem 0.45rem',
                          marginBottom: '0.45rem',
                          border: `1px solid ${actualTheme === 'dark' ? '#374151' : '#E5E7EB'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                            <i className="bi bi-chat-quote" style={{ fontSize: '0.6rem', color: colors.textTertiary }}></i>
                            <span style={{ fontSize: '0.6rem', color: colors.textTertiary }}>
                              {messagesCount} message{messagesCount > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.68rem',
                            color: colors.textSecondary,
                            margin: 0,
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.3'
                          }}>
                            <span style={{ fontWeight: '600', fontStyle: 'normal', color: colors.textPrimary }}>{latestMessageGifter.name}:</span> &ldquo;{latestMessageGifter.message}&rdquo;
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => handleViewGiftSenders(stream)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#16A34A',
                          color: 'white',
                          border: '2px solid #15803D',
                          borderRadius: '0.375rem',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <UsersIcon />
                        View Senders
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payments History Table */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary }}>Payment History</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: colors.bgCard, border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: colors.textSecondary, cursor: 'pointer' }}>
                <CalendarIcon />
                19 Nov - 29 Nov 2024
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
                {payments.map((payment) => (
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
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Showing {resultsPerPage} of {totalResults} Results</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ background: 'none', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === 1 ? 0.5 : 1 }}>
                  <ChevronLeftIcon />
                </button>
                {[1, 2, 3].map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ width: '32px', height: '32px', border: currentPage === page ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: currentPage === page ? '#083A85' : colors.bgCard, color: currentPage === page ? 'white' : colors.textSecondary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {page}
                  </button>
                ))}
                <span style={{ padding: '0 0.5rem', color: colors.textSecondary }}>...</span>
                <button onClick={() => setCurrentPage(totalPages)} style={{ width: '32px', height: '32px', border: currentPage === totalPages ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: currentPage === totalPages ? '#083A85' : colors.bgCard, color: currentPage === totalPages ? 'white' : colors.textSecondary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                  {totalPages}
                </button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ background: 'none', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} reportData={reportData} />
      <PaymentDetailsModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payment={selectedPayment}
      />
      {/* Payment Account Setup Required Modal */}
      {showSetupModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowSetupModal(false)}
        >
          <div
            style={{ backgroundColor: colors.bgCard, borderRadius: '1rem', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="6" width="22" height="15" rx="2" stroke="#083A85" strokeWidth="2"/>
                <path d="M1 10H23" stroke="#083A85" strokeWidth="2"/>
                <circle cx="6" cy="15" r="1.5" fill="#083A85"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.75rem 0' }}>
              Payment Account Required
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem 0', lineHeight: '1.6' }}>
              You need to set up a payment account before making payments. Add one in Preferences → Payment Accounts.
            </p>
            <button
              onClick={() => { setShowSetupModal(false); router.push('/user/client/preferences?tab=payments'); }}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#083A85', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '0.75rem' }}
            >
              Set Up Payment Account
            </button>
            <button
              onClick={() => setShowSetupModal(false)}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: colors.textSecondary, border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
      />

      {/* Gift Senders Modal */}
      <Modal
        isOpen={showGiftSendersModal}
        onClose={() => setShowGiftSendersModal(false)}
        title="Gift Senders"
        maxWidth="450px"
      >
        {selectedGiftStream && (
          <div>
            {/* Stream Info */}
            <div style={{
              backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <LiveStreamIcon />
                <span style={{
                  fontSize: '0.7rem',
                  color: '#EF4444',
                  backgroundColor: '#FEE2E2',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '0.25rem',
                  fontWeight: '500'
                }}>
                  {selectedGiftStream.platform}
                </span>
                <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{selectedGiftStream.date}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                {selectedGiftStream.streamTitle}
              </h3>
            </div>

            {/* Gift Senders List */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
                {selectedGiftStream.gifters.length} Viewers Gifted
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedGiftStream.gifters.map((gifter, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.875rem',
                      backgroundColor: colors.bgTertiary,
                      borderRadius: '0.625rem',
                      border: `2px solid ${colors.borderPrimary}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: gifter.message ? '0.625rem' : 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: actualTheme === 'dark' ? '#166534' : '#DCFCE7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: actualTheme === 'dark' ? '#4ADE80' : '#16A34A'
                        }}>
                          {gifter.name === 'Anonymous' ? '?' : gifter.name.charAt(0)}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, display: 'block' }}>
                            {gifter.name}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#16A34A' }}>
                        {formatPrice(gifter.amount)}
                      </span>
                    </div>
                    {/* Message from viewer */}
                    {gifter.message && (
                      <div style={{
                        backgroundColor: actualTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                        borderRadius: '0.5rem',
                        padding: '0.625rem 0.75rem',
                        marginLeft: '2.85rem',
                        border: `1px solid ${actualTheme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        position: 'relative'
                      }}>
                        {/* Speech bubble pointer */}
                        <div style={{
                          position: 'absolute',
                          top: '-6px',
                          left: '12px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: actualTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                          borderLeft: `1px solid ${actualTheme === 'dark' ? '#374151' : '#E5E7EB'}`,
                          borderTop: `1px solid ${actualTheme === 'dark' ? '#374151' : '#E5E7EB'}`,
                          transform: 'rotate(45deg)'
                        }} />
                        <p style={{
                          fontSize: '0.8rem',
                          color: colors.textSecondary,
                          margin: 0,
                          fontStyle: 'italic',
                          lineHeight: '1.4'
                        }}>
                          &ldquo;{gifter.message}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              backgroundColor: actualTheme === 'dark' ? '#14532D' : '#DCFCE7',
              borderRadius: '0.5rem',
              border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}`,
              marginBottom: '4rem'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Total from this stream</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#4ADE80' : '#16A34A' }}>
                {formatPrice(selectedGiftStream.gifters.reduce((s, g) => s + g.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Gifts Payment Method Modal */}
      <Modal
        isOpen={showGiftsPaymentMethodModal}
        onClose={() => {
          setShowGiftsPaymentMethodModal(false);
          setSelectedGiftPaymentMethod(null);
          setValidationError(null);
        }}
        title="Withdraw Your Gifts"
        maxWidth="500px"
      >
        <div>
          {/* Explainer Box */}
          <div style={{
            backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4',
            border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}`,
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: actualTheme === 'dark' ? '#166534' : '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <GiftIcon />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                Where should we send your gift earnings?
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textSecondary, lineHeight: '1.4' }}>
                When viewers send you gifts during your live streams, this is the account where you&apos;ll receive those payments.
              </div>
            </div>
          </div>

          {/* Rwanda Mobile Money Requirement Notice */}
          {isRwanda && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
              border: `1px solid ${actualTheme === 'dark' ? '#3B82F6' : '#BFDBFE'}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>ℹ️</span>
              <div style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF' }}>
                <strong>Required for Rwanda:</strong> You must select either MTN or Airtel Mobile Money as a payment method. You can also add other methods optionally.
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2',
              border: `1px solid ${actualTheme === 'dark' ? '#F87171' : '#FECACA'}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' }}>
                {validationError}
              </span>
            </div>
          )}

          {/* Payment Method Options */}
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
            Select your withdrawal account:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* MTN Mobile Money */}
            <div
              onClick={() => {
                setSelectedGiftPaymentMethod('mtn');
                setValidationError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedGiftPaymentMethod === 'mtn' ? '2px solid #16A34A' : (isRwanda && !hasMobileMoneySelected ? `2px solid #F59E0B` : `2px solid ${colors.borderPrimary}`),
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedGiftPaymentMethod === 'mtn' ? (actualTheme === 'dark' ? '#14532D' : '#F0FDF4') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/mtn.png" alt="MTN Mobile Money" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>MTN Mobile Money</span>
                  {isRwanda && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#F59E0B',
                      backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '0.25rem',
                      textTransform: 'uppercase'
                    }}>Required</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Receive gifts via MTN MoMo</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedGiftPaymentMethod === 'mtn' ? '6px solid #16A34A' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>

            {/* Airtel Mobile Money */}
            <div
              onClick={() => {
                setSelectedGiftPaymentMethod('airtel');
                setValidationError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedGiftPaymentMethod === 'airtel' ? '2px solid #16A34A' : (isRwanda && !hasMobileMoneySelected ? `2px solid #F59E0B` : `2px solid ${colors.borderPrimary}`),
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedGiftPaymentMethod === 'airtel' ? (actualTheme === 'dark' ? '#14532D' : '#F0FDF4') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/airtel.png" alt="Airtel Mobile Money" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Airtel Mobile Money</span>
                  {isRwanda && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#F59E0B',
                      backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '0.25rem',
                      textTransform: 'uppercase'
                    }}>Required</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Receive gifts via Airtel Money</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedGiftPaymentMethod === 'airtel' ? '6px solid #16A34A' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>

            {/* VISA/Debit/Credit Cards */}
            <div
              onClick={() => setSelectedGiftPaymentMethod('card')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedGiftPaymentMethod === 'card' ? '2px solid #16A34A' : `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedGiftPaymentMethod === 'card' ? (actualTheme === 'dark' ? '#14532D' : '#F0FDF4') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Debit/Credit Cards</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Receive gifts to your card</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedGiftPaymentMethod === 'card' ? '6px solid #16A34A' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>
          </div>

          {/* Payment Details Form */}
          {selectedGiftPaymentMethod && (
            <div style={{
              backgroundColor: colors.bgTertiary,
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.25rem',
              border: `2px solid ${colors.borderPrimary}`
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 1rem 0' }}>
                {selectedGiftPaymentMethod === 'mtn' && 'MTN Mobile Money Details'}
                {selectedGiftPaymentMethod === 'airtel' && 'Airtel Mobile Money Details'}
                {selectedGiftPaymentMethod === 'card' && 'Card Details'}
              </h4>

              {/* MTN Fields */}
              {selectedGiftPaymentMethod === 'mtn' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                    MTN Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+256 78X XXX XXX"
                    value={giftPaymentDetails.mtnNumber}
                    onChange={(e) => setGiftPaymentDetails({ ...giftPaymentDetails, mtnNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgCard,
                      color: colors.textPrimary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Airtel Fields */}
              {selectedGiftPaymentMethod === 'airtel' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                    Airtel Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+256 70X XXX XXX"
                    value={giftPaymentDetails.airtelNumber}
                    onChange={(e) => setGiftPaymentDetails({ ...giftPaymentDetails, airtelNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgCard,
                      color: colors.textPrimary,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Card Fields */}
              {selectedGiftPaymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={giftPaymentDetails.cardNumber}
                      onChange={(e) => setGiftPaymentDetails({ ...giftPaymentDetails, cardNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={giftPaymentDetails.cardName}
                      onChange={(e) => setGiftPaymentDetails({ ...giftPaymentDetails, cardName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={giftPaymentDetails.cardExpiry}
                        onChange={(e) => setGiftPaymentDetails({ ...giftPaymentDetails, cardExpiry: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={giftPaymentDetails.cardCvv}
                        onChange={(e) => setGiftPaymentDetails({ ...giftPaymentDetails, cardCvv: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                setShowGiftsPaymentMethodModal(false);
                setSelectedGiftPaymentMethod(null);
                setValidationError(null);
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.5rem',
                background: colors.bgTertiary,
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveWithdrawalMethod}
              disabled={!selectedGiftPaymentMethod || savingWithdrawal}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid #15803D',
                borderRadius: '0.5rem',
                background: selectedGiftPaymentMethod && !savingWithdrawal ? '#16A34A' : colors.bgTertiary,
                color: selectedGiftPaymentMethod && !savingWithdrawal ? 'white' : colors.textSecondary,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: selectedGiftPaymentMethod && !savingWithdrawal ? 'pointer' : 'not-allowed',
                opacity: selectedGiftPaymentMethod && !savingWithdrawal ? 1 : 0.6
              }}
            >
              {savingWithdrawal ? 'Saving...' : 'Save Withdrawal Method'}
            </button>
          </div>
        </div>
      </Modal>


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
