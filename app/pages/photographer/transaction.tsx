"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { HeartIcon } from '../../components/UnlockModal';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';

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

const WithdrawIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="14" rx="2" stroke="#374151" strokeWidth="2"/>
    <path d="M22 10H18C16.8954 10 16 10.8954 16 12C16 13.1046 16.8954 14 18 14H22" stroke="#374151" strokeWidth="2"/>
    <path d="M6 6V4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V6" stroke="#374151" strokeWidth="2"/>
  </svg>
);

// Payment Method Icons for Withdraw Modal
const MobileMoneyIcon = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="18" r="1" fill={color}/>
    <path d="M9 5H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CardIcon = ({ color = '#8B5CF6' }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M2 10H22" stroke={color} strokeWidth="2"/>
    <path d="M6 15H10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 15H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
      <div className="mobile-modal mobile-modal-content" style={{
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }} onClick={(e) => e.stopPropagation()}>
        <div className="mobile-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', position: 'relative' }}>
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
}

const ViewReportModal: React.FC<ViewReportModalProps> = ({ isOpen, onClose }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const reportData = {
    period: '13 - 18 July 2025',
    totalEarned: 1200.13,
    pending: 350.13,
    withdrawn: 850.00,
    totalTransactions: 45,
    completedTransactions: 32,
    pendingTransactions: 8,
    withdrawnTransactions: 5,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportContent = `
Earnings Summary Report
Period: ${reportData.period}
Generated: ${new Date().toLocaleDateString()}

Financial Summary:
- Total Earned: ${formatPrice(reportData.totalEarned)}
- Pending Amount: ${formatPrice(reportData.pending)}
- Withdrawn: ${formatPrice(reportData.withdrawn)}
- Total: ${formatPrice(reportData.totalEarned + reportData.pending + reportData.withdrawn)}

Transaction Summary:
- Total Transactions: ${reportData.totalTransactions}
- Completed: ${reportData.completedTransactions}
- Pending: ${reportData.pendingTransactions}
- Withdrawn: ${reportData.withdrawnTransactions}
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-report-${reportData.period.replace(/ /g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Earnings Report" maxWidth="520px">
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
                  <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Earned</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(reportData.totalEarned)}</span>
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
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                  <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Withdrawn</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(reportData.withdrawn)}</span>
              </div>
              <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, marginTop: '0.35rem', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: colors.textSecondary }}>Total</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(reportData.totalEarned + reportData.pending + reportData.withdrawn)}</span>
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
                <span style={{ fontSize: '0.75rem', color: '#3B82F6' }}>Withdrawn</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#3B82F6' }}>{reportData.withdrawnTransactions}</span>
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

// Transaction Details Modal
type TransactionStatus = 'completed' | 'pending' | 'in_progress' | 'withdrawn' | 'initiated';

interface Transaction {
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

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isOpen, onClose, transaction }) => {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();
  if (!transaction) return null;

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
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

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'withdrawn': return '#8B5CF6';
      case 'initiated': return '#6366F1';
      default: return '#6B7280';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details" maxWidth="480px">
      {/* Status Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
        {transaction.status === 'completed' ? (
          <CheckCircleIcon />
        ) : (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(transaction.status) + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ color: getStatusColor(transaction.status), fontWeight: '700', fontSize: '1.25rem' }}>
              {transaction.status === 'pending' ? '...' : transaction.status === 'in_progress' ? '~' : '$'}
            </span>
          </div>
        )}
        <span style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: getStatusColor(transaction.status),
          marginTop: '0.5rem',
          textTransform: 'capitalize'
        }}>
          {transaction.status.replace('_', ' ')}
        </span>
        <span style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.textPrimary, marginTop: '0.5rem' }}>
          {formatPrice(transaction.amountNum)}
        </span>
      </div>

      {/* Transaction Info */}
      <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <Image src={transaction.clientImage} alt={transaction.clientName} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>{transaction.clientName}</div>
            <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{transaction.service}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Transaction ID</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{transaction.transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Request ID</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{transaction.requestId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Date & Time</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{transaction.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Payment Method</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{transaction.method}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Service Type</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{transaction.serviceType}</span>
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

// Withdraw Modal
interface WithdrawModalProps {
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

interface WithdrawAccount {
  id: string;
  type: 'mobile' | 'card' | 'mtn' | 'airtel';
  label: string;
  accountNumber: string;
  accountName: string;
  color: string;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, availableBalance, userName }) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [customDonation, setCustomDonation] = useState<string>('');
  const [donationSkipped, setDonationSkipped] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const displayName = userName || 'Account Holder';
  const accounts: WithdrawAccount[] = [
    { id: 'mtn', type: 'mtn', label: 'MTN Mobile Money', accountNumber: '0789 XXX 980', accountName: displayName, color: '#F59E0B' },
    { id: 'airtel', type: 'airtel', label: 'Airtel Money', accountNumber: '0738 XXX 456', accountName: displayName, color: '#ED1C24' },
    { id: 'visa', type: 'card', label: 'Visa Debit Card', accountNumber: '**** **** **** 4187', accountName: displayName, color: '#8B5CF6' }
  ];

  const donationValue = donationAmount === 'custom' ? (parseFloat(customDonation) || 0) : (parseFloat(donationAmount) || 0);
  const donationAddressed = donationSkipped || donationValue > 0;

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

  const handleWithdraw = () => {
    console.log('Withdrawing:', withdrawAmount, 'to account:', selectedAccount);
    onClose();
    setWithdrawAmount('');
    setSelectedAccount('');
    setDonationAmount('');
    setCustomDonation('');
    setDonationSkipped(false);
    setShowCustomInput(false);
  };

  const getAccountImage = (type: string) => {
    switch (type) {
      case 'mtn':
        return '/mtn.png';
      case 'airtel':
        return '/airtel.png';
      case 'card':
        return '/cards.png';
      default:
        return '/cards.png';
    }
  };

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
      <div className="mobile-modal" style={{
        backgroundColor: colors.bgCard,
        borderRadius: '1rem',
        width: '420px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="mobile-modal-header" style={{
          padding: '1.5rem 1.5rem 0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>Withdraw Funds</h3>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>Transfer earnings to your account</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: colors.bgTertiary,
              border: `2px solid ${colors.borderPrimary}`,
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textPrimary,
              transition: 'background 0.2s'
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mobile-modal-content" style={{ padding: '1.5rem' }}>
          {/* Available Balance Card */}
          <div className="mobile-balance-display" style={{
            background: 'linear-gradient(135deg, #083A85 0%, #1E40AF 100%)',
            borderRadius: '0.875rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              right: '40px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="mobile-balance-display-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontWeight: '500' }}>
                Available Balance
              </div>
              <div className="mobile-balance-display-amount" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', letterSpacing: '-0.02em' }}>
                {formatPrice(availableBalance)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mobile-input-section" style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: colors.textSecondary
              }}>$</span>
              <input
                type="text"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#083A85';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            {/* Quick amount buttons */}
            <div className="mobile-quick-amounts" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
              {['100', '250', '500', '1000'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setWithdrawAmount(amount)}
                  style={{
                    padding: '0.5rem',
                    border: withdrawAmount === amount ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    background: withdrawAmount === amount ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                    color: withdrawAmount === amount ? '#083A85' : colors.textSecondary,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Account Selection */}
          <div className="mobile-account-section" style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>
              Withdraw To
            </label>
            <div className="mobile-account-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account.id)}
                  className="mobile-account-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: selectedAccount === account.id ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: selectedAccount === account.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Image Container */}
                  <div className="mobile-account-image" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                  }}>
                    {account.type === 'card' ? (
                      <>
                        <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                        <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                      </>
                    ) : (
                      <Image
                        src={getAccountImage(account.type)}
                        alt={account.label}
                        width={48}
                        height={48}
                        unoptimized
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    )}
                  </div>

                  {/* Account Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mobile-account-info" style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: '0.125rem'
                    }}>
                      {account.label}
                    </div>
                    <div className="mobile-account-number" style={{
                      fontSize: '0.8rem',
                      color: colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>{account.accountNumber}</span>
                      <span style={{
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        backgroundColor: '#D1D5DB'
                      }} />
                      <span>{account.accountName}</span>
                    </div>
                  </div>

                  {/* Radio Selection Indicator */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: selectedAccount === account.id ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgCard,
                    flexShrink: 0
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Info text about withdrawal accounts */}
          <p className="mobile-info-text" style={{
            fontSize: '0.86rem',
            color: colors.textSecondary,
            margin: '0.75rem 0 1.25rem 0',
            textAlign: 'center'
          }}>
            <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
            Manage your withdrawal accounts in <span
              onClick={() => router.push('/user/photographer/preferences?tab=payments')}
              style={{ color: colors.brandPrimary, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
            >Preferences → Withdrawal Accounts</span>
          </p>

          {/* Donation Section */}
          <div style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: `2px solid ${donationSkipped ? colors.borderPrimary : (donationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.3)')}`,
            background: actualTheme === 'dark'
              ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)'
              : 'linear-gradient(135deg, rgba(242, 12, 143, 0.05) 0%, rgba(255, 107, 157, 0.02) 100%)',
            transition: 'all 0.2s'
          }}>
            {/* Header */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartIcon />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>
                  Support a Cause
                </span>
                <span style={{ fontSize: '0.81rem', color: colors.textSecondary, marginLeft: 'auto' }}>Optional</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '0.35rem 0 0 0', lineHeight: '1.4' }}>
                Add a small donation to help fund community projects and initiatives
              </p>
            </div>

            {!donationSkipped && (
              <>
                {/* Quick Amount Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {['5', '10', '25', '50'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleSelectDonation(amount)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        border: donationAmount === amount ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem',
                        background: donationAmount === amount
                          ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)')
                          : colors.bgCard,
                        color: donationAmount === amount ? '#F20C8F' : colors.textSecondary,
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flex: '1',
                        minWidth: '0'
                      }}
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSelectDonation('custom')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      border: donationAmount === 'custom' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      background: donationAmount === 'custom'
                        ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)')
                        : colors.bgCard,
                      color: donationAmount === 'custom' ? '#F20C8F' : colors.textSecondary,
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flex: '1',
                      minWidth: '0'
                    }}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom Amount Input */}
                {showCustomInput && (
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <span style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: colors.textSecondary
                    }}>$</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={customDonation}
                      onChange={(e) => setCustomDonation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem 0.6rem 1.75rem',
                        border: `2px solid ${customDonation ? '#F20C8F' : colors.borderPrimary}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        color: colors.textPrimary,
                        backgroundColor: colors.bgCard,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#F20C8F';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = customDonation ? '#F20C8F' : colors.borderPrimary;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {/* No Thanks Button */}
            <button
              onClick={handleSkipDonation}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: donationSkipped ? '2px solid #F20C8F' : '2px solid #6B7280',
                background: donationSkipped ? '#F20C8F' : colors.bgTertiary,
                color: donationSkipped ? 'white' : '#374151',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              {donationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}
            </button>

            {/* Donations Page Link */}
            <div style={{ marginTop: '0.5rem' }}>
              <a
                href={`${process.env.NEXT_PUBLIC_LANDING_URL || 'https://amoria-connekt.vercel.app'}/user/donations`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/user/donations');
                }}
                style={{
                  fontSize: '0.81rem',
                  color: '#F20C8F',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Learn more about our donation program →
              </a>
            </div>
          </div>

          {/* Validation Message */}
          {!donationAddressed && (
            <p style={{
              fontSize: '0.86rem',
              color: '#F20C8F',
              margin: '0 0 0.75rem 0',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Please select a donation amount or skip to continue
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                background: colors.bgTertiary,
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.borderPrimary}
              onMouseLeave={(e) => e.currentTarget.style.background = colors.bgTertiary}
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || !selectedAccount || !donationAddressed}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: !withdrawAmount || !selectedAccount || !donationAddressed ? '2px solid #9CA3AF' : '2px solid #062a63',
                borderRadius: '0.75rem',
                background: !withdrawAmount || !selectedAccount || !donationAddressed ? '#9CA3AF' : '#083A85',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: !withdrawAmount || !selectedAccount || !donationAddressed ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <WithdrawIcon />
              Withdraw Funds
            </button>
          </div>
        </div>
      </div>
    </div>
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

interface EarningsChartProps {
  data: { date: string; value: number }[];
  height?: number;
  chartType: ChartType;
}

const EarningsChart: React.FC<EarningsChartProps> = ({ data, height = 140, chartType }) => {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out invalid entries and handle empty/insufficient data
  const safeData = (data || []).filter(d => d && typeof d.value === 'number');

  if (safeData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary, fontSize: '0.85rem' }}>
        No earnings data available
      </div>
    );
  }

  const maxValue = Math.max(...safeData.map(d => d.value));
  const minValue = Math.min(...safeData.map(d => d.value));
  const range = maxValue - minValue || 1;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 10;
  const paddingRight = 10;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = 500;
  const barWidth = 35;
  const divisor = safeData.length > 1 ? safeData.length - 1 : 1;
  const barGap = (chartWidth - paddingLeft - paddingRight - (safeData.length * barWidth)) / divisor;

  const points = safeData.map((item, index) => {
    const x = chartType === 'bar'
      ? paddingLeft + index * (barWidth + barGap) + barWidth / 2
      : paddingLeft + (index / divisor) * (chartWidth - paddingLeft - paddingRight);
    const y = paddingTop + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, ...item };
  });

  // Create smooth bezier curve for line chart
  const pathD = points.length > 0 ? points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const tension = 0.3;
    const cpx1 = prev.x + (point.x - prev.x) * tension;
    const cpx2 = point.x - (point.x - prev.x) * tension;
    return `C ${cpx1} ${prev.y} ${cpx2} ${point.y} ${point.x} ${point.y}`;
  }).join(' ') : '';

  // Area path for line chart
  const areaPath = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

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
                    fill={hoveredIndex === index ? '#10B981' : 'url(#barGradient)'}
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
                  fill={hoveredIndex === index ? '#10B981' : '#083A85'}
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
              <linearGradient id="earningsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#083A85" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#083A85" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill="url(#earningsAreaGradient)" />

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
      <div style={{ fontSize: '0.75rem', color: '#D1D5DB', marginBottom: '0.5rem' }}>Earnings Trend</div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
          {renderChart()}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
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
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: '600' }}>$</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Earnings</span>
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
          {safeData.map((item, index) => (
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

interface EarningsGaugeProps {
  completed: number;
  pending: number;
  withdrawn: number;
}

const EarningsGauge: React.FC<EarningsGaugeProps> = ({ completed, pending, withdrawn }) => {
  const total = completed + pending + withdrawn;
  const completedAngle = total > 0 ? (completed / total) * 180 : 60;
  const pendingAngle = total > 0 ? (pending / total) * 180 : 60;

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
        {createArc(0, completedAngle, '#10B981')}
        {createArc(completedAngle, completedAngle + pendingAngle, '#FBBF24')}
        {createArc(completedAngle + pendingAngle, 180, '#3B82F6')}
      </svg>
    </div>
  );
};

interface StatusBadgeProps {
  status: TransactionStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'withdrawn': return '#8B5CF6';
      case 'initiated': return '#6366F1';
      default: return '#6B7280';
    }
  };

  return (
    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: getColor(), textTransform: 'capitalize' }}>
      {status.replace('_', ' ')}
    </span>
  );
};

interface ServiceTypeBadgeProps {
  type: string;
}

const ServiceTypeBadge: React.FC<ServiceTypeBadgeProps> = ({ type }) => {
  const getColor = () => {
    switch (type) {
      case 'Wedding': return '#F20C8F';
      case 'Birthday': return '#8B5CF6';
      case 'Corporate': return '#3B82F6';
      case 'Portrait': return '#F59E0B';
      case 'Event': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: getColor() }}>
      {type}
    </span>
  );
};

const TransactionsPage = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const [activeTimeFilter, setActiveTimeFilter] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1W');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

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
  const [earningsData, setEarningsData] = useState<{ date: string; value: number }[]>([]);
  const [tipsData, setTipsData] = useState<{ id: number; clientName: string; amount: number; date: string; eventName: string; message: string }[]>([]);

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

  const fetchData = useCallback(async (page: number = 0) => {
    const apiUrl = getApiUrl();
    try {
      const [txRes, balRes, analyticsRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/transactions?page=${page}&size=8`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/balance`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/analytics`),
      ]);

      if (txRes.status === 'fulfilled' && txRes.value.ok) {
        const data = await txRes.value.json();
        if (data.action === 1 && data.data) {
          const content = Array.isArray(data.data) ? data.data : data.data.content || [];
          const mapped: Transaction[] = content.map((t: any, i: number) => ({
            id: t.id || i + 1,
            date: formatTxDate(t.createdAt || t.date || ''),
            clientName: t.clientName || t.customerName || t.photographerName || 'N/A',
            clientImage: t.clientImage || t.customerImage || '/default-avatar.png',
            service: t.service || t.description || t.eventTitle || t.paymentType || 'Payment',
            serviceType: t.serviceType || t.eventType || t.paymentType || 'Service',
            method: t.paymentMethod || t.method || '-',
            amount: `$${t.amount || 0}`,
            amountNum: t.amount || 0,
            status: mapStatus(t.status || ''),
            transactionId: t.transactionId || t.reference || `${String(t.id).slice(0, 4)}****`,
            requestId: t.requestId || t.reference || t.invoiceNumber || `AM${t.id || i}`,
          }));
          setTransactions(mapped);
          if (data.data.totalPages) setTotalPages(data.data.totalPages);
          if (data.data.number !== undefined) setCurrentPage(data.data.number);
        }
      }

      if (balRes.status === 'fulfilled' && balRes.value.ok) {
        const data = await balRes.value.json();
        if (data.action === 1 && data.data) {
          setBalance(data.data);
          // Map tips from balance data if available
          if (data.data.tips && Array.isArray(data.data.tips)) {
            setTipsData(data.data.tips.map((t: any, i: number) => ({
              id: t.id || i + 1,
              clientName: t.clientName || t.customerName || 'Client',
              amount: t.amount || 0,
              date: t.date || t.createdAt || '',
              eventName: t.eventName || t.description || 'Service',
              message: t.message || '',
            })));
          }
        }
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.action === 1 && data.data) {
          setAnalytics(data.data);
          // Map earnings chart data if available
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  // Calculate totals from fetched transactions
  const totalCompleted = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amountNum, 0);
  const totalPending = transactions.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'initiated').reduce((sum, t) => sum + t.amountNum, 0);
  const totalWithdrawn = transactions.filter(t => t.status === 'withdrawn').reduce((sum, t) => sum + t.amountNum, 0);

  // Balance values from API
  const totalTips = balance?.totalTips || tipsData.reduce((sum, t) => sum + t.amount, 0);
  const completedEventsCount = analytics?.completedEvents || analytics?.totalCompletedEvents || 0;
  const totalEventsAmount = analytics?.totalEarnings || totalCompleted + totalPending + totalWithdrawn;
  const bonusEligibleSets = Math.floor(completedEventsCount / 10);
  const platformBonus = balance?.totalBonuses || 0;
  const nextBonusAt = (bonusEligibleSets + 1) * 10;
  const eventsToNextBonus = nextBonusAt - completedEventsCount;
  const availableBalance = balance?.totalBalance || balance?.balance || 0;

  const resultsPerPage = 8;
  const totalResults = transactions.length;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem;
          }
          .mobile-header button {
            width: 100%;
            justify-content: center;
          }
          .mobile-balance-card {
            padding: 1rem !important;
            overflow: visible !important;
          }
          .mobile-balance-card > div {
            flex-direction: row !important;
            gap: 1rem !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            overflow: visible !important;
            flex-wrap: wrap !important;
          }
          .mobile-balance-card > div > div:first-child {
            flex: 0 0 100% !important;
            margin-bottom: 0.5rem !important;
          }
          .mobile-balance-card .wallet-icon-container {
            width: 40px !important;
            height: 40px !important;
          }
          .mobile-balance-card .balance-label {
            font-size: 0.7rem !important;
          }
          .mobile-balance-amount {
            font-size: 1.4rem !important;
          }
          .mobile-balance-stats {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.75rem !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .mobile-balance-stats > div {
            min-width: 0 !important;
          }
          .mobile-balance-stats .stat-label {
            font-size: 0.65rem !important;
            margin-bottom: 0.15rem !important;
            white-space: nowrap !important;
          }
          .mobile-balance-stats .stat-value {
            font-size: 0.8rem !important;
          }
          .mobile-grid-2 {
            grid-template-columns: 1fr !important;
            overflow: visible !important;
          }
          .mobile-chart-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto !important;
            overflow: visible !important;
            gap: 1rem !important;
          }
          .mobile-earnings-summary {
            width: 100% !important;
            max-width: 100% !important;
            padding: 1rem !important;
            margin-right: 0 !important;
          }
          .mobile-earnings-summary h3 {
            font-size: 1rem !important;
            margin-bottom: 0.25rem !important;
            font-weight: 600 !important;
          }
          .mobile-earnings-summary p {
            font-size: 0.8rem !important;
            margin-bottom: 1rem !important;
          }
          .mobile-earnings-summary button {
            font-size: 0.85rem !important;
            padding: 0.6rem 1.2rem !important;
          }
          .mobile-earnings-summary > div > div {
            gap: 1rem !important;
          }
          .mobile-earnings-summary svg {
            transform: scale(1);
            transform-origin: center;
            margin: 0.5rem 0 !important;
          }
          .mobile-earnings-summary .stat-label {
            font-size: 0.75rem !important;
          }
          .mobile-earnings-summary .stat-value {
            font-size: 1.1rem !important;
            font-weight: 600 !important;
          }
          .mobile-table-container {
            overflow-x: auto !important;
            overflow-y: visible !important;
            -webkit-overflow-scrolling: touch;
            position: relative;
          }
          .mobile-table-container::after {
            content: '→ Scroll';
            position: sticky;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(to right, transparent, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.3));
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
            color: white;
            pointer-events: none;
            border-radius: 0.25rem 0 0 0.25rem;
            float: right;
          }
          .mobile-table-container table {
            min-width: 900px;
          }
          .mobile-pagination {
            flex-direction: column !important;
            gap: 1rem !important;
            align-items: stretch !important;
            overflow: visible !important;
          }
          .mobile-pagination > div:last-child {
            justify-content: center;
          }
          .mobile-main-content {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            overflow-x: hidden !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-title {
            font-size: 1.5rem !important;
          }
          .mobile-balance-amount {
            font-size: 1.5rem !important;
          }
          .mobile-table-container table {
            min-width: 700px;
          }
          .mobile-modal {
            width: 95% !important;
            margin: 0.5rem;
            max-height: 85vh !important;
            overflow-y: auto !important;
          }
          .mobile-modal-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.25rem;
            padding: 0.75rem 0.75rem 0 0.75rem !important;
          }
          .mobile-modal-header button {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.35rem !important;
          }
          .mobile-modal-header h3 {
            font-size: 1rem !important;
            margin-bottom: 0 !important;
          }
          .mobile-modal-header p {
            font-size: 0.75rem !important;
            margin: 0 !important;
          }
          .mobile-modal-content {
            padding: 0.75rem !important;
            padding-bottom: 3rem !important;
          }
          .mobile-balance-display {
            padding: 0.75rem !important;
            margin-bottom: 0.75rem !important;
          }
          .mobile-balance-display-text {
            font-size: 0.7rem !important;
            margin-bottom: 0.25rem !important;
          }
          .mobile-balance-display-amount {
            font-size: 1.35rem !important;
          }
          .mobile-input-section {
            margin-bottom: 0.75rem !important;
          }
          .mobile-input-section label {
            font-size: 0.75rem !important;
            margin-bottom: 0.35rem !important;
          }
          .mobile-input-section input {
            padding: 0.65rem 0.75rem 0.65rem 1.5rem !important;
            font-size: 0.95rem !important;
          }
          .mobile-quick-amounts {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.35rem !important;
            margin-top: 0.4rem !important;
          }
          .mobile-quick-amounts button {
            padding: 0.35rem !important;
            font-size: 0.7rem !important;
          }
          .mobile-account-section {
            margin-bottom: 0.75rem !important;
          }
          .mobile-account-section label {
            font-size: 0.75rem !important;
            margin-bottom: 0.4rem !important;
          }
          .mobile-account-list {
            gap: 0.4rem !important;
          }
          .mobile-account-item {
            padding: 0.5rem !important;
            gap: 0.6rem !important;
          }
          .mobile-account-image {
            width: 32px !important;
            height: 32px !important;
          }
          .mobile-account-info {
            font-size: 0.75rem !important;
            margin-bottom: 0.05rem !important;
          }
          .mobile-account-number {
            font-size: 0.65rem !important;
            gap: 0.25rem !important;
          }
          .mobile-account-number span:nth-child(2) {
            display: none !important;
          }
          .mobile-account-number span:nth-child(3) {
            display: none !important;
          }
          .mobile-info-text {
            font-size: 0.7rem !important;
            margin: 0.4rem 0 0.75rem 0 !important;
          }
          .mobile-modal-actions {
            flex-direction: column !important;
            gap: 0.4rem !important;
            margin-bottom: 2rem !important;
          }
          .mobile-modal-actions > * {
            width: 100% !important;
          }
          .mobile-modal-actions button {
            width: 100% !important;
            padding: 0.65rem 0.75rem !important;
            font-size: 0.8rem !important;
            min-height: 42px !important;
          }
          .mobile-modal-actions .donate-btn {
            width: 100% !important;
          }
          .mobile-modal-actions .donate-btn button {
            padding: 0.55rem 0.75rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="photographer" tipsAmount={totalTips} bonusAmount={platformBonus} balanceAmount={availableBalance} />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header with Withdraw Button */}
          <header className="mobile-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600' }}>Transactions</h1>
              <p style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Manage your earnings and view transaction history
              </p>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <WithdrawIcon />
              Withdraw Funds
            </button>
          </header>

          {/* Available Balance Card */}
          <div className="mobile-balance-card" style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem', boxShadow: colors.shadowSm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="wallet-icon-container" style={{ width: '48px', height: '48px', backgroundColor: '#EFF6FF', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WalletIcon />
                </div>
                <div>
                  <div className="balance-label" style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Available to Withdraw</div>
                  <div className="mobile-balance-amount" style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(availableBalance)}</div>
                </div>
              </div>
              <div className="mobile-balance-stats" style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div className="stat-label" style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Previous Deposit</div>
                  <div className="stat-value" style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(balance?.lastDeposit || 0)}</div>
                </div>
                <div>
                  <div className="stat-label" style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Last Withdrawal</div>
                  <div className="stat-value" style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(balance?.lastWithdrawal || 0)}</div>
                </div>
                <div>
                  <div className="stat-label" style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Active Account</div>
                  <div className="stat-value" style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>{balance?.activeAccount || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips and Bonus Cards */}
          <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Tips Section - From Clients */}
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: colors.shadowSm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1rem' }}>💝</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Tips from Clients</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: 0 }}>Appreciation from your clients</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{formatPrice(totalTips)}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{tipsData.length} tips received</div>
                </div>
              </div>

              {/* Recent Tips List */}
              <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary }}>Recent Tips</span>
                  <button
                    onClick={() => setShowTipsModal(true)}
                    style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    View All
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {tipsData.map((tip) => (
                    <div key={tip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4', borderRadius: '0.375rem', border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}` }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{tip.clientName}</div>
                        <div style={{ fontSize: '0.7rem', color: colors.textSecondary }}>{tip.eventName} • {tip.date}</div>
                        {tip.message && <div style={{ fontSize: '0.7rem', color: actualTheme === 'dark' ? '#4ADE80' : '#166534', fontStyle: 'italic', marginTop: '0.125rem' }}>&ldquo;{tip.message}&rdquo;</div>}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#16A34A' }}>+${tip.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Bonus Section */}
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: colors.shadowSm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1rem' }}>🎁</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Platform Bonus</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: 0 }}>Earn 10% for every 10 events completed</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{formatPrice(platformBonus)}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{bonusEligibleSets} bonus{bonusEligibleSets !== 1 ? 'es' : ''} earned</div>
                </div>
              </div>

              {/* Progress to Next Bonus */}
              <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary }}>Progress to Next Bonus</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#16A34A' }}>{completedEventsCount % 10}/10 events</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: colors.borderPrimary, borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                  <div style={{ width: `${(completedEventsCount % 10) * 10}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: actualTheme === 'dark' ? '#14532D' : '#F0FDF4', borderRadius: '0.375rem', border: `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}` }}>
                    <div style={{ fontSize: '0.7rem', color: actualTheme === 'dark' ? '#4ADE80' : '#166534', marginBottom: '0.125rem' }}>Completed Events</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#16A34A' }}>{completedEventsCount}</div>
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF', borderRadius: '0.375rem', border: `1px solid ${actualTheme === 'dark' ? '#1E40AF' : '#BFDBFE'}` }}>
                    <div style={{ fontSize: '0.7rem', color: actualTheme === 'dark' ? '#60A5FA' : '#1E40AF', marginBottom: '0.125rem' }}>Events to Next Bonus</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#2563EB' }}>{eventsToNextBonus}</div>
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', borderRadius: '0.375rem', border: `1px solid ${actualTheme === 'dark' ? '#92400E' : '#FCD34D'}` }}>
                    <div style={{ fontSize: '0.7rem', color: actualTheme === 'dark' ? '#FCD34D' : '#92400E', marginBottom: '0.125rem' }}>Next Bonus Amount</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F59E0B' }}>~${Math.round(totalEventsAmount * 0.10 / bonusEligibleSets || 0)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Row - Earnings Chart and Earnings Summary */}
          <div className="mobile-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginBottom: '1rem' }}>

            {/* Earnings Chart */}
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: colors.shadowSm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Earnings</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalCompleted + totalPending + totalWithdrawn)}</span>
                    <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: '500' }}>+23% vs last week</span>
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
                          color: activeTimeFilter === period ? 'white' : '#6B7280',
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
              <EarningsChart data={earningsData} height={150} chartType={chartType} />
            </div>

            {/* Earnings Summary */}
            <div className="mobile-earnings-summary" style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.25rem', boxShadow: colors.shadowSm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Earnings Summary</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Current Period</div>
                </div>
                <button onClick={() => setShowReportModal(true)} style={{ fontSize: '0.85rem', color: '#2563EB', textDecoration: 'none', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>View report</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Completed</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalCompleted)}</div>
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
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Withdrawn</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary }}>{formatPrice(totalWithdrawn)}</div>
                </div>
              </div>
              <EarningsGauge completed={totalCompleted} pending={totalPending} withdrawn={totalWithdrawn} />
            </div>
          </div>

          {/* Transaction History Table */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', boxShadow: colors.shadowSm, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary }}>Transaction History</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: colors.bgCard, border: '2px solid #D1D5DB', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: colors.textSecondary, cursor: 'pointer' }}>
                <CalendarIcon />
                19 Nov - 29 Nov 2024
              </button>
            </div>

            <div className="mobile-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.bgTertiary }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Client / Service</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Transaction ID</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: `2px solid ${colors.borderPrimary}` }}>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>{transaction.date}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={transaction.clientImage} alt={transaction.clientName} width={32} height={32} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>{transaction.clientName}</div>
                          <ServiceTypeBadge type={transaction.serviceType} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>{transaction.method}</td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(transaction.amountNum)}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}><StatusBadge status={transaction.status} /></td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{transaction.transactionId}</span>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><CopyIcon /></button>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {transaction.status === 'completed' && (
                          <button onClick={() => handleDownloadReceipt(transaction)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} title="Download Receipt"><DownloadIcon /></button>
                        )}
                        <button onClick={() => handleViewTransaction(transaction)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} title="View Details"><ViewIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: colors.textSecondary }}>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>Loading transactions...</p>
              </div>
            )}

            {/* No results */}
            {!isLoading && transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: colors.textSecondary }}>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>No transactions found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
            <div className="mobile-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: `2px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Page {currentPage + 1} of {totalPages}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => fetchData(currentPage - 1)} disabled={currentPage === 0} style={{ background: 'none', border: '2px solid #D1D5DB', borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === 0 ? 0.5 : 1 }}>
                  <ChevronLeftIcon />
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i).map((page) => (
                  <button key={page} onClick={() => fetchData(page)} style={{ width: '32px', height: '32px', border: currentPage === page ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: currentPage === page ? '#083A85' : colors.bgCard, color: currentPage === page ? 'white' : colors.textSecondary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {page + 1}
                  </button>
                ))}
                {totalPages > 3 && <>
                  <span style={{ padding: '0 0.5rem', color: colors.textSecondary }}>...</span>
                  <button onClick={() => fetchData(totalPages - 1)} style={{ width: '32px', height: '32px', border: currentPage === totalPages - 1 ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', backgroundColor: currentPage === totalPages - 1 ? '#083A85' : colors.bgCard, color: currentPage === totalPages - 1 ? 'white' : colors.textSecondary, fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {totalPages}
                  </button>
                </>}
                <button onClick={() => fetchData(currentPage + 1)} disabled={currentPage >= totalPages - 1} style={{ background: 'none', border: '2px solid #D1D5DB', borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />
      <TransactionDetailsModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transaction={selectedTransaction}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={availableBalance}
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
      />

      {/* Tips Modal */}
      <Modal isOpen={showTipsModal} onClose={() => setShowTipsModal(false)} title="All Tips from Clients" maxWidth="550px">
        <div>
          {/* Total Summary */}
          <div style={{
            backgroundColor: '#F0FDF4',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center',
            border: '1px solid #BBF7D0',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#16A34A' }}>{formatPrice(totalTips)}</div>
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>Total Tips Received</div>
            <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.25rem' }}>{tipsData.length} tips from clients</div>
          </div>

          {/* Tips List */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Tips History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              {tipsData.map((tip) => (
                <div key={tip.id} style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>TIP</span>
                      <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{tip.date}</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#16A34A' }}>+${tip.amount}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>{tip.clientName}</div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{tip.eventName}</div>
                  {tip.message && (
                    <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>&ldquo;{tip.message}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowTipsModal(false)}
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
              Close
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

export default TransactionsPage;
