"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { dashboardAuthFetch } from "../providers/AuthProvider";
import { useCurrency } from "../context/CurrencyContext";
import { initiateBookingPayment, pollPaymentStatus, getTelecomProvider, getPaymentMethodType } from '@/lib/xentripay';

// Heart Icon for donate section
export const HeartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="#F20C8F"
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

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

export interface Payment {
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

const PAYMENT_METHODS: Record<string, { label: string; image: string }> = {
  card: { label: 'Credit/Debit Card', image: '/cards.png' },
  mtn: { label: 'MTN Mobile Money', image: '/mtn.png' },
  airtel: { label: 'Airtel Mobile Money', image: '/airtel.png' },
};

const PayNowModal: React.FC<PayNowModalProps> = ({ isOpen, onClose, payment, onPaymentSuccess }) => {
  const { colors, actualTheme } = useTheme();
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [customDonation, setCustomDonation] = useState<string>('');
  const [donationSkipped, setDonationSkipped] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

  // XentriPay states
  const [paymentPhone, setPaymentPhone] = useState<string>('');
  const [xentriPayStep, setXentriPayStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [xentriPayError, setXentriPayError] = useState<string>('');
  const [xentriPayRefid, setXentriPayRefid] = useState<string>('');
  const stopPollingRef = React.useRef<(() => void) | null>(null);

  if (!payment) return null;

  const amountDue = payment.amountNum - payment.paidAmount;
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
    // Stop polling if active
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    setShowReceipt(false);
    setXentriPayStep('select');
    setXentriPayError('');
    setXentriPayRefid('');
    setPaymentPhone('');
    onClose();
  };

  const handlePayNow = async () => {
    if (!payment?.declarationId) {
      setXentriPayError('No payment declaration found');
      return;
    }

    // For mobile money, phone is required
    if (selectedPaymentMethod !== 'card' && !paymentPhone.trim()) {
      setXentriPayError('Please enter your phone number');
      return;
    }

    setPaymentLoading(true);
    setXentriPayError('');
    setXentriPayStep('processing');

    try {
      const telecom = getTelecomProvider(selectedPaymentMethod);
      const methodType = getPaymentMethodType(selectedPaymentMethod);
      const phone = selectedPaymentMethod === 'card' ? '0000000000' : paymentPhone.trim();

      const result = await initiateBookingPayment(
        payment.declarationId,
        phone,
        telecom,
        methodType
      );

      if (!result.success || !result.data) {
        setXentriPayError(result.error || 'Failed to initiate payment');
        setXentriPayStep('failed');
        setPaymentLoading(false);
        return;
      }

      setXentriPayRefid(result.data.refid);

      // For card payments, open the payment URL
      if (selectedPaymentMethod === 'card' && result.data.paymentUrl) {
        window.open(result.data.paymentUrl, '_blank');
      }

      // Start polling for status
      const stopPolling = pollPaymentStatus(result.data.refid, {
        onSuccess: () => {
          setXentriPayStep('success');
          setPaymentLoading(false);
        },
        onFailure: () => {
          setXentriPayStep('failed');
          setXentriPayError('Payment was not completed. Please try again.');
          setPaymentLoading(false);
        },
        onError: (error) => {
          setXentriPayStep('failed');
          setXentriPayError(error);
          setPaymentLoading(false);
        },
      });

      stopPollingRef.current = stopPolling;
    } catch (error) {
      setXentriPayError(error instanceof Error ? error.message : 'Payment failed');
      setXentriPayStep('failed');
      setPaymentLoading(false);
    }
  };

  const handleRetryPayment = () => {
    setXentriPayStep('select');
    setXentriPayError('');
    setXentriPayRefid('');
    setShowReceipt(false);
    setPaymentLoading(false);
  };

  // XentriPay Processing View
  if (xentriPayStep === 'processing') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Processing Payment" maxWidth="450px">
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1.5rem',
            border: '4px solid rgba(8, 58, 133, 0.2)',
            borderTopColor: '#083A85',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            {selectedPaymentMethod === 'card' ? 'Complete payment in your browser' : 'Check your phone'}
          </h4>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1rem', lineHeight: '1.5' }}>
            {selectedPaymentMethod === 'card'
              ? 'A payment page has been opened. Complete the payment there and we\'ll confirm it here.'
              : `A USSD prompt has been sent to your phone. Please approve the payment on your device.`}
          </p>
          <p style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
            This may take a few moments...
          </p>
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
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1.5rem',
            borderRadius: '50%', backgroundColor: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            Payment Completed!
          </h4>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem' }}>
            Your payment of {formatPrice(totalAmount)} has been received successfully.
          </p>
          <button
            onClick={() => {
              handleClose();
              if (onPaymentSuccess) onPaymentSuccess();
            }}
            style={{
              padding: '0.75rem 2rem',
              border: '2px solid #062a63',
              borderRadius: '0.5rem',
              background: '#083A85',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  // XentriPay Failed View
  if (xentriPayStep === 'failed') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Payment Failed" maxWidth="450px">
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1.5rem',
            borderRadius: '50%', backgroundColor: '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            Payment Failed
          </h4>
          <p style={{ fontSize: '0.9rem', color: '#EF4444', margin: '0 0 1.5rem' }}>
            {xentriPayError || 'Something went wrong. Please try again.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '0.75rem 1.5rem',
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
            <button
              onClick={handleRetryPayment}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #c00a72',
                borderRadius: '0.5rem',
                background: '#F20C8F',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Try Again
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
          {/* Receipt Card */}
          <div style={{
            backgroundColor: colors.bgTertiary,
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            border: `2px solid ${colors.borderPrimary}`
          }}>
            {/* Event */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Event</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{payment.eventName}</span>
            </div>
            {/* Photographer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Photographer</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{payment.photographerName}</span>
            </div>
            {/* Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Date</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{payment.date}</span>
            </div>
            {/* Invoice */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Invoice</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{payment.invoiceNumber}</span>
            </div>
            {/* Payment Method */}
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

            {/* Divider */}
            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />

            {/* Amount Due */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>Amount Due</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(amountDue)}</span>
            </div>
            {/* Donation (if any) */}
            {donationValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <HeartIcon />
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#F20C8F' }}>Donation</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F' }}>{formatPrice(donationValue)}</span>
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: colors.textPrimary }}>Total</span>
              <span style={{ fontSize: '1.3rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* XentriPay Error */}
          {xentriPayError && (
            <p style={{ fontSize: '0.85rem', color: '#EF4444', margin: '0 0 0.75rem', textAlign: 'center' }}>
              {xentriPayError}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => { setShowReceipt(false); setXentriPayError(''); }}
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
                opacity: paymentLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePayNow}
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
                transition: 'all 0.2s'
              }}
            >
              {paymentLoading ? 'Processing...' : `${payment.status === 'failed' ? 'Retry' : 'Pay'} ${formatPrice(totalAmount)}`}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Selection View (Phase 1)
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={payment.status === 'failed' ? 'Retry Payment' : 'Complete Payment'} maxWidth="450px">
      <div>
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
              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
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
          </div>

          {/* Phone Number Input (for mobile money) */}
          {(selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'airtel') && (
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 078XXXXXXX"
                value={paymentPhone}
                onChange={(e) => { setPaymentPhone(e.target.value); setXentriPayError(''); }}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#083A85';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.borderPrimary;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>
                Enter the {selectedPaymentMethod === 'mtn' ? 'MTN' : 'Airtel'} number to receive the payment prompt
              </p>
            </div>
          )}

          {/* Info text about payment accounts */}
          <p style={{
            fontSize: '0.86rem',
            color: colors.textSecondary,
            margin: '0.75rem 0 0 0',
            textAlign: 'center'
          }}>
            <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
            Manage your payment methods in <span
              onClick={() => router.push('/user/client/preferences?tab=payments')}
              style={{ color: colors.brandPrimary, fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
            >Preferences → Payment Accounts</span>
          </p>
        </div>

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
                    {formatPrice(parseFloat(amount))}
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

          {/* Donations Page Link — opens on the public platform */}
          <div style={{ marginTop: '0.5rem' }}>
            <a
              href={`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/donations`}
              target="_blank"
              rel="noopener noreferrer"
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
        {(!donationAddressed || !phoneValid) && (
          <p style={{
            fontSize: '0.86rem',
            color: '#EF4444',
            margin: '0 0 0.75rem 0',
            textAlign: 'center'
          }}>
            {!phoneValid ? 'Please enter your phone number' : 'Please select a donation amount or skip to continue'}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleClose}
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
            disabled={!isPayEnabled}
            onClick={() => setShowReceipt(true)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: !isPayEnabled ? '2px solid #9CA3AF' : '2px solid #062a63',
              borderRadius: '0.5rem',
              background: !isPayEnabled ? '#9CA3AF' : '#083A85',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: !isPayEnabled ? 'not-allowed' : 'pointer',
              opacity: !isPayEnabled ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PayNowModal;
