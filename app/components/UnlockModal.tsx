"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { dashboardAuthFetch } from "../providers/AuthProvider";

// Heart Icon for donate button (filled red)
export const HeartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="#EF4444"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill="#EF4444"
      stroke="#EF4444"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// White Heart Icon for modal header
const WhiteHeartIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill="white"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}



// Donate Button Component - styled like the pill button with red border
export const DonateButton: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      padding: "0.625rem 1.25rem",
      backgroundColor: "white",
      border: "3px solid #EF4444",
      borderRadius: "9999px",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      width: "100%",
    }}
    title="Make a payment to charity"
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "#FEF2F2";
      e.currentTarget.style.boxShadow = "0 4px 6px rgba(239, 68, 68, 0.2)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "white";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
    }}
  >
    <HeartIcon />
    <span
      style={{
        fontSize: "0.875rem",
        fontWeight: "700",
        color: "#1F2937",
        letterSpacing: "0.025em",
      }}
    >
      DONATE
    </span>
  </button>
);

// Close Icon
const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Charity Icons
const FamilyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="7" r="3" stroke="#F20C8F" strokeWidth="2" />
    <path
      d="M3 18C3 15.2386 5.23858 13 8 13H10C12.7614 13 15 15.2386 15 18"
      stroke="#F20C8F"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="17" cy="9" r="2.5" stroke="#F20C8F" strokeWidth="2" />
    <path
      d="M21 18C21 16.3431 19.6569 15 18 15H16.5"
      stroke="#F20C8F"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MedicalIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="#10B981"
      strokeWidth="2"
    />
    <path
      d="M12 8V16M8 12H16"
      stroke="#10B981"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SchoolIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3L1 9L12 15L23 9L12 3Z"
      stroke="#3B82F6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 11.5V17C5.5 17 8 20 12 20C16 20 18.5 17 18.5 17V11.5"
      stroke="#3B82F6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FoodIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 8H19C20.1046 8 21 8.89543 21 10V11C21 12.6569 19.6569 14 18 14H6C4.34315 14 3 12.6569 3 11V10C3 8.89543 3.89543 8 5 8H6"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M6 14V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V14"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 3V8M8 5L12 8L16 5"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Donate Prompt Modal - asks user if they want to make a payment (Yes/No)
interface DonatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
}

export const UnlockPromptModal: React.FC<DonatePromptModalProps> = ({
  isOpen,
  onClose,
  onYes,
  onNo,
}) => {
  const { colors, actualTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1150,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: "1rem",
          width: "400px",
          maxWidth: "95%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background:
                actualTheme === "dark"
                  ? "linear-gradient(135deg, rgba(242, 12, 143, 0.2) 0%, rgba(255, 107, 157, 0.1) 100%)"
                  : "linear-gradient(135deg, rgba(242, 12, 143, 0.15) 0%, rgba(255, 107, 157, 0.08) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              border: `2px solid ${
                actualTheme === "dark"
                  ? "rgba(242, 12, 143, 0.3)"
                  : "rgba(242, 12, 143, 0.2)"
              }`,
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="#F20C8F"
                stroke="#F20C8F"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: "0.75rem",
            }}
          >
            Would you like to make a payment?
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: colors.textSecondary,
              marginBottom: "1.5rem",
              lineHeight: "1.5",
            }}
          >
            Pay{" "}
            <strong
              style={{ color: "black", fontWeight: "bold", fontSize: "18px" }}
            >
              10$
            </strong>{" "}
            per Album to unlock photobooks
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onNo}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: "0.5rem",
                background: colors.bgTertiary,
                color: colors.textPrimary,
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              No, thanks
            </button>
            <button
              onClick={onYes}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                border: "2px solid #c00a72",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #F20C8F 0%, #FF6B9D 100%)",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Yes, continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

interface Payment {
  id: number;
  declarationId?: string;
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

interface PayNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onPaymentSuccess?: () => void;
}


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
function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}

const PayNowModal: React.FC<PayNowModalProps> = ({ isOpen, onClose, payment, onPaymentSuccess }) => {
  const { colors, actualTheme } = useTheme();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!payment) return null;

  const amountDue = payment.amountNum - payment.paidAmount;

  const handlePay = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const apiUrl = getApiUrl();
      const declarationId = payment.declarationId || payment.invoiceNumber;
      const queryParams = new URLSearchParams();
      queryParams.append('amount', amountDue.toString());
      queryParams.append('method', selectedPaymentMethod);

      const response = await dashboardAuthFetch(
        `${apiUrl}/api/remote/payments/${declarationId}/pay?${queryParams.toString()}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Payment failed (${response.status})`);
      }

      onPaymentSuccess?.();
      onClose();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment.status === 'failed' ? 'Retry Payment' : 'Complete Payment'} maxWidth="450px">
      <div>
        {/* Amount Summary */}
        <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Event</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>{payment.eventName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Photographer</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>{payment.photographerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>Amount Due</span>
            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
              ${amountDue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
            Select Payment Method
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Credit/Debit Card */}
            <div
              onClick={() => setSelectedPaymentMethod('card')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedPaymentMethod === 'card' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedPaymentMethod === 'card' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/cards.png" alt="Credit/Debit Card" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Credit/Debit Card</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay with Visa, Mastercard, etc.</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedPaymentMethod === 'card' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>

            {/* MTN Mobile Money */}
            <div
              onClick={() => setSelectedPaymentMethod('mtn')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedPaymentMethod === 'mtn' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedPaymentMethod === 'mtn' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/mtn.png" alt="MTN Mobile Money" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>MTN Mobile Money</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via MTN MoMo</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedPaymentMethod === 'mtn' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>

            {/* Airtel Mobile Money */}
            <div
              onClick={() => setSelectedPaymentMethod('airtel')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedPaymentMethod === 'airtel' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedPaymentMethod === 'airtel' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/airtel.png" alt="Airtel Mobile Money" width={48} height={48} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Airtel Mobile Money</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via Airtel Money</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedPaymentMethod === 'airtel' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>

            {/* Bank Transfer */}
            <div
              onClick={() => setSelectedPaymentMethod('bank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                border: selectedPaymentMethod === 'bank' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                cursor: 'pointer',
                backgroundColor: selectedPaymentMethod === 'bank' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/bank.png" alt="Bank Transfer" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Bank Transfer</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via bank account</div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selectedPaymentMethod === 'bank' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard
              }} />
            </div>
          </div>

          {/* Info text about payment accounts */}
          <p style={{
            fontSize: '0.8rem',
            color: colors.textSecondary,
            margin: '0.75rem 0 1.25rem 0',
            textAlign: 'center'
          }}>
            <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
            Manage your payment methods in <span
              onClick={() => router.push('/user/client/preferences?tab=payments')}
              style={{ color: colors.brandPrimary, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
            >Preferences → Payment Accounts</span>
          </p>
        </div>

        {/* Error message */}
        {paymentError && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: actualTheme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
            border: '1px solid #EF4444',
            borderRadius: '0.5rem',
            color: '#EF4444',
            fontSize: '0.85rem',
          }}>
            {paymentError}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={onClose}
            disabled={paymentLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: `2px solid ${colors.borderPrimary}`,
              borderRadius: '0.5rem',
              background: colors.bgTertiary,
              color: colors.textPrimary,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: paymentLoading ? 'not-allowed' : 'pointer',
              opacity: paymentLoading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={paymentLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: payment.status === 'failed' ? '2px solid #c00a72' : '2px solid #062a63',
              borderRadius: '0.5rem',
              background: payment.status === 'failed' ? '#F20C8F' : '#083A85',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: paymentLoading ? 'not-allowed' : 'pointer',
              opacity: paymentLoading ? 0.7 : 1,
            }}
          >
            {paymentLoading ? 'Processing...' : `${payment.status === 'failed' ? 'Retry Payment' : 'Pay'} $${amountDue.toLocaleString()}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PayNowModal;
