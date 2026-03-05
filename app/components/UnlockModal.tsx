"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { dashboardAuthFetch } from "../providers/AuthProvider";
import { useCurrency } from "../context/CurrencyContext";

import { getApiUrl } from '@/lib/api';
import { getDonationsPageUrl } from '@/lib/urls';

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
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: isSelected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.75rem',
                    cursor: is100Locked ? 'not-allowed' : 'pointer',
                    backgroundColor: is100Locked
                      ? (actualTheme === 'dark' ? 'rgba(107, 114, 128, 0.1)' : '#F9FAFB')
                      : isSelected
                        ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                        : colors.bgCard,
                    opacity: is100Locked ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: is100Locked ? colors.textSecondary : colors.textPrimary }}>
                        {opt.label}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: opt.isEscrow ? '#FEF3C7' : '#D1FAE5',
                        color: opt.isEscrow ? '#92400E' : '#065F46',
                      }}>
                        {opt.isEscrow ? 'Escrow' : 'Direct'}
                      </span>
                      {is100Locked && (
                        <i className="bi bi-lock-fill" style={{ fontSize: '0.85rem', color: colors.textSecondary }} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: is100Locked ? colors.textSecondary : (actualTheme === 'dark' ? '#60A5FA' : '#083A85') }}>
                      {formatPrice(calcAmount)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.2rem' }}>
                      {is100Locked
                        ? 'Complete satisfaction survey to unlock'
                        : opt.isEscrow
                          ? 'Held by platform until you confirm satisfaction'
                          : 'Released directly to photographer'}
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgCard,
                    flexShrink: 0,
                  }} />
                </div>
              );
            })}
          </div>

          {/* Info box */}
          {selectedPercentage && selectedPercentage < 100 && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE'}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
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
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <i className="bi bi-check-circle-fill" style={{ color: '#10B981', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#6EE7B7' : '#065F46', lineHeight: '1.4' }}>
                Full payment will be released directly to the photographer.
              </span>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={handleClose} style={{
              flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
            }}>Cancel</button>
            <button
              disabled={!selectedPercentage}
              onClick={handlePercentageContinue}
              style={{
                flex: 1, padding: '0.75rem 1rem',
                border: !selectedPercentage ? '2px solid #9CA3AF' : '2px solid #062a63',
                borderRadius: '0.5rem', background: !selectedPercentage ? '#9CA3AF' : '#083A85',
                color: 'white', fontSize: '0.9rem', fontWeight: '600',
                cursor: !selectedPercentage ? 'not-allowed' : 'pointer', opacity: !selectedPercentage ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >Continue</button>
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
      fontSize: '0.8rem',
      fontWeight: '600' as const,
      cursor: 'pointer',
      transition: 'all 0.2s',
    });

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Service Confirmation" maxWidth="520px">
        <div>
          <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0', lineHeight: '1.4' }}>
            Please complete this survey before making a full (100%) payment. Your feedback helps ensure service quality.
          </p>

          {/* Q1 */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.attendedAsAgreed ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              1. Did the photographer attend the event as agreed?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, attendedAsAgreed: 'yes' }))} style={surveyOptionStyle(surveyResponses.attendedAsAgreed === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, attendedAsAgreed: 'no' }))} style={surveyOptionStyle(surveyResponses.attendedAsAgreed === 'no')}>No</button>
            </div>
          </div>

          {/* Q2 */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.serviceDelivered ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              2. Was the service delivered as expected?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, serviceDelivered: 'yes' }))} style={surveyOptionStyle(surveyResponses.serviceDelivered === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, serviceDelivered: 'partially' }))} style={surveyOptionStyle(surveyResponses.serviceDelivered === 'partially')}>Partially</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, serviceDelivered: 'no' }))} style={surveyOptionStyle(surveyResponses.serviceDelivered === 'no')}>No</button>
            </div>
          </div>

          {/* Q3 */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.qualitySatisfaction ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              3. Are you satisfied with the quality of service?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, qualitySatisfaction: 'very_satisfied' }))} style={surveyOptionStyle(surveyResponses.qualitySatisfaction === 'very_satisfied')}>Very Satisfied</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, qualitySatisfaction: 'satisfied' }))} style={surveyOptionStyle(surveyResponses.qualitySatisfaction === 'satisfied')}>Satisfied</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, qualitySatisfaction: 'not_satisfied' }))} style={surveyOptionStyle(surveyResponses.qualitySatisfaction === 'not_satisfied')}>Not Satisfied</button>
            </div>
          </div>

          {/* Q4 */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.deliverablesReceived ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              4. Have you received the agreed deliverables (photos/videos)?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, deliverablesReceived: 'yes' }))} style={surveyOptionStyle(surveyResponses.deliverablesReceived === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, deliverablesReceived: 'not_yet' }))} style={surveyOptionStyle(surveyResponses.deliverablesReceived === 'not_yet')}>Not Yet</button>
            </div>
          </div>

          {/* Q5 */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${colors.borderPrimary}` }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              5. Were there any issues during the service? <span style={{ fontWeight: '400', color: colors.textSecondary }}>(Optional)</span>
            </p>
            <textarea
              placeholder="Describe any issues..."
              value={surveyResponses.issuesDuringService}
              onChange={(e) => setSurveyResponses(p => ({ ...p, issuesDuringService: e.target.value }))}
              style={{
                width: '100%', minHeight: '60px', padding: '0.5rem 0.75rem',
                border: `1px solid ${colors.borderPrimary}`, borderRadius: '0.375rem',
                fontSize: '0.85rem', color: colors.textPrimary, backgroundColor: colors.bgCard,
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Q6 */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${surveyResponses.wouldBookAgain ? '#083A85' : colors.borderPrimary}`, transition: 'border-color 0.2s' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              6. Would you book this photographer again?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setSurveyResponses(p => ({ ...p, wouldBookAgain: 'yes' }))} style={surveyOptionStyle(surveyResponses.wouldBookAgain === 'yes')}>Yes</button>
              <button onClick={() => setSurveyResponses(p => ({ ...p, wouldBookAgain: 'no' }))} style={surveyOptionStyle(surveyResponses.wouldBookAgain === 'no')}>No</button>
            </div>
          </div>

          {/* Dispute warning */}
          {hasNegativeResponses() && (
            <div style={{
              backgroundColor: actualTheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F59E0B', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#FCD34D' : '#92400E', lineHeight: '1.4' }}>
                Your responses indicate potential issues. A review flag will be created for this booking.
              </span>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setStep('percentage')} style={{
              flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
            }}>Back</button>
            <button
              disabled={!isSurveyComplete()}
              onClick={handleSurveySubmit}
              style={{
                flex: 1, padding: '0.75rem 1rem',
                border: !isSurveyComplete() ? '2px solid #9CA3AF' : '2px solid #062a63',
                borderRadius: '0.5rem', background: !isSurveyComplete() ? '#9CA3AF' : '#083A85',
                color: 'white', fontSize: '0.9rem', fontWeight: '600',
                cursor: !isSurveyComplete() ? 'not-allowed' : 'pointer', opacity: !isSurveyComplete() ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >Submit & Continue</button>
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
          {/* Receipt Card */}
          <div style={{
            backgroundColor: colors.bgTertiary,
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            border: `2px solid ${colors.borderPrimary}`
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
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: selectedPercentage === 100 ? '#D1FAE5' : '#FEF3C7',
                color: selectedPercentage === 100 ? '#065F46' : '#92400E',
              }}>
                {selectedPercentage}% - {selectedPercentage === 100 ? 'Direct' : 'Escrow'}
              </span>
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

            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />

            {/* Amount Due */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>Amount Due ({selectedPercentage}%)</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(amountDue)}</span>
            </div>
            {/* Remaining Balance (for < 100%) */}
            {selectedPercentage && selectedPercentage < 100 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary }}>Remaining</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary }}>{formatPrice(fullAmountDue - amountDue)}</span>
              </div>
            )}
            {/* Donation */}
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

            {/* Total */}
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
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <i className="bi bi-shield-check" style={{ color: '#3B82F6', fontSize: '0.9rem', marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF', lineHeight: '1.4' }}>
                This payment will be held in escrow and released to the photographer once you confirm satisfaction.
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setStep('method')}
              disabled={paymentLoading}
              style={{
                flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
                background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600',
                cursor: paymentLoading ? 'not-allowed' : 'pointer',
              }}
            >Cancel</button>
            <button
              disabled={paymentLoading}
              onClick={async () => {
                setPaymentLoading(true);
                try {
                  const apiUrl = getApiUrl();
                  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/payments/pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      declarationId: String(payment.declarationId || payment.id),
                      amount: totalAmount,
                      method: selectedPaymentMethod,
                      donationAmount: donationValue > 0 ? donationValue : undefined,
                    }),
                  });
                  if (res.ok) {
                    handleClose();
                    onPaymentSuccess?.();
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.message || 'Payment failed. Please try again.');
                  }
                } catch {
                  alert('Payment failed. Please try again.');
                } finally {
                  setPaymentLoading(false);
                }
              }}
              style={{
                flex: 1, padding: '0.75rem 1rem',
                border: payment.status === 'failed' ? '2px solid #c00a72' : '2px solid #062a63',
                borderRadius: '0.5rem',
                background: paymentLoading ? '#9CA3AF' : (payment.status === 'failed' ? '#F20C8F' : '#083A85'),
                color: 'white', fontSize: '0.9rem', fontWeight: '600',
                cursor: paymentLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
              }}
            >
              {paymentLoading ? 'Processing...' : `${payment.status === 'failed' ? 'Retry' : 'Pay'} ${formatPrice(totalAmount)}`}
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

          {/* Donations Page Link */}
          <div style={{ marginTop: '0.5rem' }}>
            <a
              href={getDonationsPageUrl()}
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
        {!donationAddressed && (
          <p style={{
            fontSize: '0.86rem',
            color: '#EF4444',
            margin: '0 0 0.75rem 0',
            textAlign: 'center'
          }}>
            Please select a donation amount or skip to continue
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setStep('percentage')}
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
            Back
          </button>
          <button
            disabled={!isPayEnabled}
            onClick={() => setStep('receipt')}
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
