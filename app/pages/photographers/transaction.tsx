"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

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
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
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
    <path d="M15 18L9 12L15 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const BankIcon = ({ color = '#3B82F6' }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 3L21 10H3L12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 10V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 10V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 10V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
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
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
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
- Total Earned: $${reportData.totalEarned.toFixed(2)}
- Pending Amount: $${reportData.pending.toFixed(2)}
- Withdrawn: $${reportData.withdrawn.toFixed(2)}
- Total: $${(reportData.totalEarned + reportData.pending + reportData.withdrawn).toFixed(2)}

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
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.75rem' }}>
          Report Period: <span style={{ fontWeight: '600', color: '#111827' }}>{reportData.period}</span>
        </div>

        {/* Financial & Transaction Summary Side by Side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Financial Summary */}
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>Financial Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Earned</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>${reportData.totalEarned.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Pending</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>${reportData.pending.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Withdrawn</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>${reportData.withdrawn.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '0.35rem', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6B7280' }}>Total</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#083A85' }}>${(reportData.totalEarned + reportData.pending + reportData.withdrawn).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>Transaction Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827' }}>{reportData.totalTransactions}</span>
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
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleDownload} style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          backgroundColor: '#083A85',
          color: 'white',
          border: 'none',
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
          backgroundColor: 'white',
          color: '#6B7280',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          fontWeight: '500',
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

Amount: ${transaction.amount}

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
        <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginTop: '0.5rem' }}>
          {transaction.amount}
        </span>
      </div>

      {/* Transaction Info */}
      <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #E5E7EB' }}>
          <Image src={transaction.clientImage} alt={transaction.clientName} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{transaction.clientName}</div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{transaction.service}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Transaction ID</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{transaction.transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Request ID</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{transaction.requestId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Date & Time</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{transaction.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Payment Method</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{transaction.method}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Service Type</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{transaction.serviceType}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={handleDownloadReceipt} style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          backgroundColor: '#083A85',
          color: 'white',
          border: 'none',
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
          backgroundColor: 'white',
          color: '#6B7280',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          <PrintIcon />
          Print
        </button>
        <button onClick={onClose} style={{
          backgroundColor: 'white',
          color: '#6B7280',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem',
          fontWeight: '500',
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
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

interface WithdrawAccount {
  id: string;
  type: 'mobile' | 'bank' | 'card';
  label: string;
  accountNumber: string;
  accountName: string;
  color: string;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, availableBalance }) => {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  const accounts: WithdrawAccount[] = [
    { id: 'mtn', type: 'mobile', label: 'MTN Mobile Money', accountNumber: '0789 XXX 980', accountName: 'John Doe', color: '#F59E0B' },
    { id: 'bank', type: 'bank', label: 'Bank of Kigali', accountNumber: '0012 XXXX 4532', accountName: 'John Doe', color: '#3B82F6' },
    { id: 'visa', type: 'card', label: 'Visa Debit Card', accountNumber: '**** **** **** 4187', accountName: 'John Doe', color: '#8B5CF6' }
  ];

  const handleWithdraw = () => {
    console.log('Withdrawing:', withdrawAmount, 'to account:', selectedAccount);
    onClose();
    setWithdrawAmount('');
    setSelectedAccount('');
  };

  const getIcon = (type: string, color: string) => {
    switch (type) {
      case 'mobile':
        return <MobileMoneyIcon color={color} />;
      case 'bank':
        return <BankIcon color={color} />;
      case 'card':
        return <CardIcon color={color} />;
      default:
        return null;
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        width: '420px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>Withdraw Funds</h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>Transfer earnings to your account</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Available Balance Card */}
          <div style={{
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
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontWeight: '500' }}>
                Available Balance
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', letterSpacing: '-0.02em' }}>
                ${availableBalance.toLocaleString()}.00
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div style={{ marginBottom: '1.5rem' }}>
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
                color: '#6B7280'
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
                  color: '#111827',
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
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              {['100', '250', '500', '1000'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setWithdrawAmount(amount)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: withdrawAmount === amount ? '2px solid #083A85' : '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    background: withdrawAmount === amount ? '#EFF6FF' : 'white',
                    color: withdrawAmount === amount ? '#083A85' : '#6B7280',
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
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>
              Withdraw To
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '1rem',
                    border: selectedAccount === account.id ? '2px solid #083A85' : '1px solid #E5E7EB',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: selectedAccount === account.id ? '#F8FAFC' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Icon Container */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.75rem',
                    backgroundColor: `${account.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(account.type, account.color)}
                  </div>

                  {/* Account Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.125rem'
                    }}>
                      {account.label}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6B7280',
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

                  {/* Selection Indicator */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: selectedAccount === account.id ? 'none' : '2px solid #D1D5DB',
                    backgroundColor: selectedAccount === account.id ? '#083A85' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}>
                    {selectedAccount === account.id && <CheckIcon />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
                background: 'white',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || !selectedAccount}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: 'none',
                borderRadius: '0.75rem',
                background: !withdrawAmount || !selectedAccount ? '#9CA3AF' : '#083A85',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: !withdrawAmount || !selectedAccount ? 'not-allowed' : 'pointer',
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
        {hoveredIndex !== null && (
          <div style={{
            position: 'absolute',
            left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
            top: chartType === 'bar' ? `${points[hoveredIndex].y - 80}px` : `${points[hoveredIndex].y - 70}px`,
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid #F3F4F6'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>
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
              <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Earnings</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                ${points[hoveredIndex].value.toLocaleString()}
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

interface EarningsGaugeProps {
  completed: number;
  pending: number;
  withdrawn: number;
}

const EarningsGauge: React.FC<EarningsGaugeProps> = ({ completed, pending, withdrawn }) => {
  const total = completed + pending + withdrawn;
  const completedAngle = (completed / total) * 180;
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
  const [activeTimeFilter, setActiveTimeFilter] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('1W');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

Amount: ${transaction.amount}

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

  const earningsData = [
    { date: 'Nov 13', value: 650 },
    { date: 'Nov 14', value: 480 },
    { date: 'Nov 15', value: 720 },
    { date: 'Nov 16', value: 550 },
    { date: 'Nov 17', value: 380 },
    { date: 'Nov 18', value: 620 },
    { date: 'Nov 19', value: 450 }
  ];

  const transactions: Transaction[] = [
    { id: 1, date: 'Nov, 20 14:05 PM', clientName: 'Sarah Johnson', clientImage: 'https://randomuser.me/api/portraits/women/75.jpg', service: 'Wedding Photography', serviceType: 'Wedding', method: 'Credit Card', amount: '$450.0', amountNum: 450, status: 'completed', transactionId: '4****4492', requestId: 'AM26412' },
    { id: 2, date: 'Nov, 18 10:30 AM', clientName: 'Michael Brown', clientImage: 'https://randomuser.me/api/portraits/men/68.jpg', service: 'Birthday Party', serviceType: 'Birthday', method: 'Mobile Money', amount: '$300.0', amountNum: 300, status: 'pending', transactionId: '4****4493', requestId: 'AM26413' },
    { id: 3, date: 'Nov, 25 09:00 AM', clientName: 'Emily Davis', clientImage: 'https://randomuser.me/api/portraits/women/22.jpg', service: 'Corporate Event', serviceType: 'Corporate', method: '-', amount: '$500.0', amountNum: 500, status: 'in_progress', transactionId: '4****4494', requestId: 'AM26414' },
    { id: 4, date: 'Sep, 15 16:00 PM', clientName: 'James Wilson', clientImage: 'https://randomuser.me/api/portraits/men/44.jpg', service: 'Portrait Session', serviceType: 'Portrait', method: 'Bank Transfer', amount: '$350.0', amountNum: 350, status: 'withdrawn', transactionId: '4****4495', requestId: 'AM26415' },
    { id: 5, date: 'Nov, 25 14:00 PM', clientName: 'Lisa Anderson', clientImage: 'https://randomuser.me/api/portraits/women/44.jpg', service: 'Event Coverage', serviceType: 'Event', method: 'Credit Card', amount: '$200.0', amountNum: 200, status: 'initiated', transactionId: '4****4496', requestId: 'AM26416' },
    { id: 6, date: 'Oct, 01 11:00 AM', clientName: 'Robert Taylor', clientImage: 'https://randomuser.me/api/portraits/men/22.jpg', service: 'Corporate Headshots', serviceType: 'Corporate', method: 'Credit Card', amount: '$400.0', amountNum: 400, status: 'completed', transactionId: '4****4497', requestId: 'AM26417' },
    { id: 7, date: 'Nov, 12 15:30 PM', clientName: 'Jennifer Martinez', clientImage: 'https://randomuser.me/api/portraits/women/68.jpg', service: 'Wedding Reception', serviceType: 'Wedding', method: 'Mobile Money', amount: '$250.0', amountNum: 250, status: 'completed', transactionId: '4****4498', requestId: 'AM26418' },
    { id: 8, date: 'Nov, 28 10:00 AM', clientName: 'David Garcia', clientImage: 'https://randomuser.me/api/portraits/men/32.jpg', service: 'Birthday Party', serviceType: 'Birthday', method: '-', amount: '$350.0', amountNum: 350, status: 'pending', transactionId: '4****4499', requestId: 'AM26419' },
  ];

  // Calculate totals
  const totalCompleted = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amountNum, 0);
  const totalPending = transactions.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'initiated').reduce((sum, t) => sum + t.amountNum, 0);
  const totalWithdrawn = transactions.filter(t => t.status === 'withdrawn').reduce((sum, t) => sum + t.amountNum, 0);
  const availableBalance = totalCompleted;

  const totalPages = 5;
  const resultsPerPage = 8;
  const totalResults = transactions.length;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header with Withdraw Button */}
          <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600' }}>Transactions</h1>
              <p style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '0.25rem' }}>
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
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#EFF6FF', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WalletIcon />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Available to Withdraw</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>${availableBalance.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Previous Deposit</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>$450.00</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Last Withdrawal</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>$1,345.00</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Active Account</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>*****980</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Row - Earnings Chart and Earnings Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', marginBottom: '1rem' }}>

            {/* Earnings Chart */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Earnings</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>${(totalCompleted + totalPending + totalWithdrawn).toLocaleString()}</span>
                    <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: '500' }}>+23% vs last week</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Chart Type Selector */}
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', padding: '0.25rem' }}>
                    <button
                      onClick={() => setChartType('line')}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: chartType === 'line' ? 'white' : 'transparent',
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
                        backgroundColor: chartType === 'bar' ? 'white' : 'transparent',
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
                        backgroundColor: chartType === 'scatter' ? 'white' : 'transparent',
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
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F9FAFB', borderRadius: '0.375rem', padding: '0.25rem' }}>
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
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>Earnings Summary</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Current Period</div>
                </div>
                <button onClick={() => setShowReportModal(true)} style={{ fontSize: '0.85rem', color: '#2563EB', textDecoration: 'none', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>View report</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Completed</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>${totalCompleted.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Pending</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>${totalPending.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Withdrawn</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>${totalWithdrawn.toLocaleString()}</div>
                </div>
              </div>
              <EarningsGauge completed={totalCompleted} pending={totalPending} withdrawn={totalWithdrawn} />
            </div>
          </div>

          {/* Transaction History Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827' }}>Transaction History</h2>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#6B7280', cursor: 'pointer' }}>
                <CalendarIcon />
                19 Nov - 29 Nov 2024
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Client / Service</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Transaction ID</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: '#6B7280' }}>{transaction.date}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Image src={transaction.clientImage} alt={transaction.clientName} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{transaction.clientName}</div>
                          <ServiceTypeBadge type={transaction.serviceType} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.85rem', color: '#6B7280' }}>{transaction.method}</td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{transaction.amount}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}><StatusBadge status={transaction.status} /></td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{transaction.transactionId}</span>
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

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>Showing {resultsPerPage} of {totalResults} Results</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === 1 ? 0.5 : 1 }}>
                  <ChevronLeftIcon />
                </button>
                {[1, 2, 3].map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ width: '32px', height: '32px', border: currentPage === page ? '1px solid #083A85' : '1px solid #E5E7EB', borderRadius: '0.375rem', backgroundColor: currentPage === page ? '#083A85' : 'white', color: currentPage === page ? 'white' : '#6B7280', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                    {page}
                  </button>
                ))}
                <span style={{ padding: '0 0.5rem', color: '#6B7280' }}>...</span>
                <button onClick={() => setCurrentPage(totalPages)} style={{ width: '32px', height: '32px', border: currentPage === totalPages ? '1px solid #083A85' : '1px solid #E5E7EB', borderRadius: '0.375rem', backgroundColor: currentPage === totalPages ? '#083A85' : 'white', color: currentPage === totalPages ? 'white' : '#6B7280', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                  {totalPages}
                </button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.5rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
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
      />
    </div>
  );
};

export default TransactionsPage;
