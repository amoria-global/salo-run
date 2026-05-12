"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { dashboardAuthFetch } from "../providers/AuthProvider";
import { useCurrency } from "../context/CurrencyContext";
import { initiateBookingPayment, initiateArchivePayment, pollPaymentStatus, getTelecomProvider, getPaymentMethodType, sanitizeErrorMessage } from '@/lib/xentripay';

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
  const { formatPrice, currencyId } = useCurrency();
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
    const isArchive = payment?.eventType === 'Archive Unlock';

    if (!isArchive && !payment?.declarationId) {
      setXentriPayError('This payment cannot be processed right now. The booking may not have been finalized yet. Please contact support if this persists.');
      return;
    }

    if (isArchive && !payment?.eventId) {
      setXentriPayError('No archived album event found. Please try again or contact support.');
      return;
    }

    // For mobile money, phone is required
    if (selectedPaymentMethod !== 'card' && !paymentPhone.trim()) {
      setXentriPayError(`Please enter your ${selectedPaymentMethod === 'mtn' ? 'MTN' : 'Airtel'} phone number to receive the payment prompt.`);
      return;
    }

    setPaymentLoading(true);
    setXentriPayError('');
    setXentriPayStep('processing');

    try {
      const telecom = getTelecomProvider(selectedPaymentMethod);
      const methodType = getPaymentMethodType(selectedPaymentMethod);
      const phone = selectedPaymentMethod === 'card' ? '' : paymentPhone.trim();

      let result;
      if (isArchive && payment?.eventId) {
        result = await initiateArchivePayment(
          payment.eventId,
          payment.amountNum,
          currencyId || 'RWF',
          phone,
          telecom,
          methodType,
          undefined,
          donationValue > 0 ? donationValue : undefined
        );
      } else {
        result = await initiateBookingPayment(
          payment!.declarationId!,
          phone,
          telecom,
          methodType,
          undefined,
          donationValue > 0 ? donationValue : undefined,
          currencyId
        );
      }

      if (!result.success || !result.data) {
        setXentriPayError(result.error || 'Payment could not be initiated. Please check your payment details and try again.');
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
          onPaymentSuccess?.();
        },
        onFailure: () => {
          setXentriPayStep('failed');
          setXentriPayError('Payment was not completed. If you were charged, the amount will be refunded automatically. Please try again.');
          setPaymentLoading(false);
        },
        onError: (error) => {
          setXentriPayStep('failed');
          setXentriPayError(sanitizeErrorMessage(error, 'Unable to check payment status. Please try again.'));
          setPaymentLoading(false);
        },
      });

      stopPollingRef.current = stopPolling;
    } catch (error) {
      setXentriPayError(sanitizeErrorMessage(error instanceof Error ? error.message : '', 'Something went wrong while processing your payment. Please check your connection and try again.'));
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
            Waiting for the gateway to confirm your payment — this can take up to a minute.
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
    <Modal isOpen={isOpen} onClose={handleClose} title={payment.status === 'failed' ? 'Retry payment' : 'Complete payment'} maxWidth="500px">
      <div>
        {/* Payment Method Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Select payment method
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {([
              { key: 'card' as const, label: 'Credit/Debit Card', desc: 'Pay with Visa, Mastercard, etc.' },
              { key: 'mtn' as const, label: 'MTN Mobile Money', desc: 'Pay via MTN MoMo' },
              { key: 'airtel' as const, label: 'Airtel Mobile Money', desc: 'Pay via Airtel Money' },
            ]).map((method) => {
              const isSelected = selectedPaymentMethod === method.key;
              return (
                <div
                  key={method.key}
                  onClick={() => setSelectedPaymentMethod(method.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '0.85rem 1rem',
                    border: `${isSelected ? '1.5px' : '1px'} solid ${isSelected ? '#083A85' : colors.borderPrimary}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isSelected
                      ? (actualTheme === 'dark'
                          ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.10) 100%)'
                          : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.03) 100%)')
                      : colors.bgCard,
                    boxShadow: isSelected ? '0 6px 14px rgba(8,58,133,0.14)' : '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: method.key === 'card' ? colors.bgCard : 'transparent',
                    border: method.key === 'card' ? `1px solid ${colors.borderPrimary}` : 'none',
                  }}>
                    {method.key === 'card' && (
                      <>
                        <Image src="/visa.png" alt="Visa" width={20} height={36} unoptimized style={{ objectFit: 'contain' }} />
                        <Image src="/master.png" alt="Mastercard" width={20} height={36} unoptimized style={{ objectFit: 'contain' }} />
                      </>
                    )}
                    {method.key === 'mtn' && (
                      <Image src="/mtn.png" alt="MTN Mobile Money" width={44} height={44} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    )}
                    {method.key === 'airtel' && (
                      <Image src="/airtel.png" alt="Airtel Mobile Money" width={44} height={44} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.005em' }}>{method.label}</div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 1 }}>{method.desc}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 9999,
                    border: `1.5px solid ${isSelected ? '#083A85' : colors.borderPrimary}`,
                    background: isSelected ? '#083A85' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.18s',
                    boxShadow: isSelected ? '0 4px 10px rgba(8,58,133,0.30)' : 'none',
                  }}>
                    {isSelected && <i className="bi bi-check" style={{ color: '#fff', fontSize: 14, lineHeight: 1 }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phone Number Input (for mobile money) */}
          {(selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'airtel') && (
            <div style={{ marginTop: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Phone number
              </label>
              <div style={{
                display: 'flex', alignItems: 'stretch',
                border: `1.5px solid ${colors.borderPrimary}`,
                borderRadius: 11,
                background: colors.bgCard,
                overflow: 'hidden',
                transition: 'border-color 0.18s, box-shadow 0.18s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', color: colors.textSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}>
                  <i className={`bi ${selectedPaymentMethod === 'mtn' ? 'bi-phone-vibrate-fill' : 'bi-phone-fill'}`} style={{ fontSize: 14 }} />
                </div>
                <input
                  type="tel"
                  placeholder="e.g. 078XXXXXXX"
                  value={paymentPhone}
                  onChange={(e) => { setPaymentPhone(e.target.value); setXentriPayError(''); }}
                  style={{
                    flex: 1,
                    padding: '0.7rem 0.85rem',
                    border: 'none',
                    fontSize: '0.92rem',
                    color: colors.textPrimary,
                    backgroundColor: 'transparent',
                    outline: 'none',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    const wrapper = e.currentTarget.closest('div')?.parentElement;
                    if (wrapper) {
                      wrapper.style.borderColor = '#083A85';
                      wrapper.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.14)';
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.currentTarget.closest('div')?.parentElement;
                    if (wrapper) {
                      wrapper.style.borderColor = colors.borderPrimary;
                      wrapper.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              <p style={{ fontSize: '0.76rem', color: colors.textSecondary, margin: '0.4rem 0 0 0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-info-circle" style={{ fontSize: 11 }} />
                Enter the {selectedPaymentMethod === 'mtn' ? 'MTN' : 'Airtel'} number to receive the payment prompt.
              </p>
            </div>
          )}

          {/* Info text about payment accounts */}
          <p style={{
            fontSize: '0.82rem',
            color: colors.textSecondary,
            margin: '0.85rem 0 0 0',
            textAlign: 'center',
            display: 'inline-flex',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}>
            <i className="bi bi-info-circle" style={{ fontSize: 12 }} />
            Manage your payment methods in <span
              onClick={() => router.push('/user/client/preferences?tab=payments')}
              style={{ color: '#083A85', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >Preferences → Payment Accounts</span>
          </p>
        </div>

        {/* Donation Section */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1.25rem',
          padding: '1.1rem 1.1rem 1rem',
          borderRadius: 16,
          border: `1px solid ${donationSkipped ? 'var(--ck-stroke)' : 'rgba(242, 12, 143, 0.28)'}`,
          background: actualTheme === 'dark'
            ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.10) 0%, rgba(8, 58, 133, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(242, 12, 143, 0.07) 0%, rgba(8, 58, 133, 0.03) 100%)',
          boxShadow: donationSkipped ? 'none' : '0 8px 20px rgba(242, 12, 143, 0.10)',
          transition: 'all 0.2s',
        }}>
          {/* gradient accent stripe */}
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
          }} />

          {/* Header */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(242, 12, 143, 0.12)',
                border: '1px solid rgba(242, 12, 143, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-heart-fill" style={{ fontSize: 14, color: '#F20C8F' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1,
                }}>Give back</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                  Support a cause
                </div>
              </div>
              <span style={{
                fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 9999,
                background: 'var(--ck-surface-soft)', border: '1px solid var(--ck-stroke)',
              }}>Optional</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '8px 0 0', lineHeight: 1.5 }}>
              Add a small donation to help fund community projects and initiatives.
            </p>
          </div>

          {!donationSkipped && (
            <>
              {/* Quick Amount Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
                {['5', '10', '25', '50'].map((amount) => {
                  const selected = donationAmount === amount;
                  return (
                    <button
                      key={amount}
                      onClick={() => handleSelectDonation(amount)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: selected ? '1.5px solid #F20C8F' : `1px solid var(--ck-stroke)`,
                        borderRadius: 10,
                        background: selected
                          ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.22)' : 'rgba(242, 12, 143, 0.10)')
                          : 'var(--ck-surface)',
                        color: selected ? '#F20C8F' : colors.textPrimary,
                        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.18s', flex: 1, minWidth: 0,
                        boxShadow: selected ? '0 4px 10px rgba(242, 12, 143, 0.18)' : 'none',
                      }}
                    >
                      {formatPrice(parseFloat(amount))}
                    </button>
                  );
                })}
                <button
                  onClick={() => handleSelectDonation('custom')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: donationAmount === 'custom' ? '1.5px solid #F20C8F' : `1px solid var(--ck-stroke)`,
                    borderRadius: 10,
                    background: donationAmount === 'custom'
                      ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.22)' : 'rgba(242, 12, 143, 0.10)')
                      : 'var(--ck-surface)',
                    color: donationAmount === 'custom' ? '#F20C8F' : colors.textPrimary,
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.18s', flex: 1, minWidth: 0,
                    boxShadow: donationAmount === 'custom' ? '0 4px 10px rgba(242, 12, 143, 0.18)' : 'none',
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
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: colors.textSecondary,
                  }}>$</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customDonation}
                    onChange={(e) => setCustomDonation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 1.85rem',
                      border: `1.5px solid ${customDonation ? '#F20C8F' : 'var(--ck-stroke)'}`,
                      borderRadius: 10,
                      fontSize: '0.88rem',
                      color: colors.textPrimary,
                      backgroundColor: 'var(--ck-surface)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F20C8F';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.14)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = customDonation ? '#F20C8F' : 'var(--ck-stroke)';
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
              width: '100%', padding: '0.55rem 1rem', borderRadius: 9999,
              border: donationSkipped ? '1.5px solid #F20C8F' : '1px solid var(--ck-stroke)',
              background: donationSkipped ? '#F20C8F' : 'var(--ck-surface)',
              color: donationSkipped ? '#fff' : colors.textSecondary,
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.18s', textAlign: 'center',
            }}
          >
            {donationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}
          </button>

          {/* Donations Page Link — opens on the public platform */}
          <div style={{ marginTop: '0.65rem', textAlign: 'left' }}>
            <a
              href={`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/donations`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.78rem',
                color: '#F20C8F',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Learn more about our donation program <i className="bi bi-arrow-right" style={{ fontSize: 11 }} />
            </a>
          </div>
        </div>

        {/* Validation Message */}
        {(!donationAddressed || !phoneValid) && (
          <div style={{
            padding: '0.55rem 0.85rem',
            marginBottom: '0.85rem',
            borderRadius: 10,
            background: actualTheme === 'dark' ? 'rgba(220,38,38,0.10)' : '#FEF2F2',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.32)' : '#FECACA'}`,
            color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
            fontSize: '0.84rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 13, flexShrink: 0 }} />
            <span>{!phoneValid ? 'Please enter your phone number' : 'Please select a donation amount or skip to continue'}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          paddingTop: '0.85rem',
          borderTop: `1px solid ${colors.borderPrimary}`,
        }}>
          <button
            onClick={handleClose}
            className="ck-btn ck-btn-soft"
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              fontSize: '0.9rem',
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
              flex: 2,
              padding: '0.65rem 1.1rem',
              borderRadius: 11,
              border: 'none',
              background: !isPayEnabled
                ? colors.bgTertiary
                : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
              color: !isPayEnabled ? colors.textSecondary : '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: !isPayEnabled ? 'not-allowed' : 'pointer',
              opacity: !isPayEnabled ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: !isPayEnabled ? 'none' : '0 6px 18px rgba(242,12,143,0.28)',
              letterSpacing: '-0.005em',
              transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (isPayEnabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <i className="bi bi-shield-lock-fill" style={{ fontSize: 13 }} />
            Proceed to payment
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PayNowModal;
