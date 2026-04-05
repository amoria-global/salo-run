"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { processWithdrawal, sanitizeErrorMessage } from '@/lib/xentripay';
import { useCurrency } from '../context/CurrencyContext';
import { HeartIcon } from './UnlockModal';
import KycVerificationModal from './KycVerificationModal';
import FaceScanCapture from './FaceScanCapture';

interface WithdrawAccount {
  id: string;
  type: 'mtn' | 'airtel' | 'bank';
  label: string;
  accountNumber: string;
  accountName: string;
  color: string;
}

interface WithdrawSource {
  source: string;
  label: string;
  availableBalance: number;
  isGiftWithdrawal: boolean;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'client' | 'event-coordinator' | 'photographer';
  colors: Record<string, string>;
  actualTheme: string;
}

const WithdrawIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MobileMoneyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="#F59E0B" strokeWidth="2"/><path d="M6 10H10M6 14H8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/></svg>
);

export default function WithdrawModal({ isOpen, onClose, role, colors, actualTheme }: WithdrawModalProps) {
  const { currencies } = useCurrency();
  const rwfRate = currencies.find(c => c.code === 'RWF')?.rate || 1460;

  const [accounts, setAccounts] = useState<WithdrawAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [sources, setSources] = useState<WithdrawSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<WithdrawSource | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [customDonation, setCustomDonation] = useState('');
  const [donationSkipped, setDonationSkipped] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [step, setStep] = useState<'form' | 'verification' | 'processing' | 'success' | 'failed'>('form');
  const [error, setError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isKycRequired, setIsKycRequired] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  // Verification state
  const [verificationId, setVerificationId] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [requiresFaceScan, setRequiresFaceScan] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const apiNamespace = role === 'client' ? 'customer' : role === 'photographer' ? 'photographer' : 'coordinator';
  const prefsPath = role === 'photographer' ? '/user/photographer/preferences?tab=payments'
    : role === 'event-coordinator' ? '/user/event-coordinator/preferences?tab=payments'
    : '/user/client/preferences?tab=payments';

  useEffect(() => {
    if (!isOpen) return;
    setStep('form'); setError(''); setWithdrawAmount(''); setDonationAmount(''); setCustomDonation('');
    setDonationSkipped(false); setShowCustomInput(false); setAccountsLoading(true);
    setVerificationId(''); setVerificationMethod(''); setOtpDigits(['', '', '', '', '', '']);
    setVerificationError(''); setCapturedSelfie(null); setResendCooldown(0); setIsResending(false);
    const apiUrl = getApiUrl();

    dashboardAuthFetch(`${apiUrl}/api/remote/${apiNamespace}/withdrawal-methods`)
      .then(res => res.json())
      .then(result => {
        const methods = result?.data || [];
        const loaded: WithdrawAccount[] = methods.map((m: any) => {
          const methodType = (m.methodType || '').toUpperCase();
          const bankName = (m.bankName || '').toLowerCase();
          const isAirtel = bankName.includes('airtel');
          const type: WithdrawAccount['type'] = methodType === 'BANK_TRANSFER' ? 'bank' : isAirtel ? 'airtel' : 'mtn';
          return {
            id: m.id as string, type,
            label: methodType === 'BANK_TRANSFER' ? (m.bankName || 'Bank Transfer') : (m.bankName || (isAirtel ? 'Airtel Money' : 'MTN Mobile Money')),
            accountNumber: m.accountNumber as string, accountName: m.accountName as string,
            color: type === 'bank' ? '#3B82F6' : type === 'airtel' ? '#ED1C24' : '#F59E0B',
          };
        });
        setAccounts(loaded);
        const def = methods.find((m: any) => m.isDefault);
        setSelectedAccount(def ? def.id : loaded.length > 0 ? loaded[0].id : '');
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));

    dashboardAuthFetch(`${apiUrl}/api/remote/${apiNamespace}/withdrawable-sources`)
      .then(res => res.json())
      .then(result => {
        if (result.action === 1 && Array.isArray(result.data)) {
          setSources(result.data);
          if (result.data.length > 0) setSelectedSource(result.data[0]);
        }
      })
      .catch(() => setSources([]));
  }, [isOpen, apiNamespace]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sourceBalanceRwf = Math.floor((selectedSource?.availableBalance || 0) * rwfRate);
  const totalBalanceRwf = Math.floor(sources.reduce((sum, s) => sum + s.availableBalance, 0) * rwfRate);
  const parsedAmount = parseFloat(withdrawAmount) || 0;
  const donationValue = donationAmount === 'custom' ? (parseFloat(customDonation) || 0) : (parseFloat(donationAmount) || 0);
  const donationAddressed = donationSkipped || donationValue > 0;
  const amountError = withdrawAmount !== '' && parsedAmount <= 0
    ? 'Please enter a withdrawal amount greater than zero.'
    : parsedAmount > sourceBalanceRwf
      ? `Insufficient ${selectedSource?.label || ''} balance. Available: RF ${sourceBalanceRwf.toLocaleString()}`
      : '';
  const isWithdrawValid = parsedAmount > 0 && parsedAmount <= sourceBalanceRwf;
  const isValid = isWithdrawValid && selectedAccount && donationAddressed && accounts.length > 0;

  const handleSelectDonation = (amount: string) => {
    setDonationSkipped(false);
    if (amount === 'custom') { setDonationAmount('custom'); setShowCustomInput(true); }
    else { setDonationAmount(amount); setShowCustomInput(false); }
  };

  const handleSkipDonation = () => {
    setDonationSkipped(true); setDonationAmount(''); setCustomDonation(''); setShowCustomInput(false);
  };

  // Step 1: Initiate withdrawal (sends verification)
  const handleWithdraw = async () => {
    setIsWithdrawing(true); setError(''); setStep('processing');
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${apiNamespace}/withdraw/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount / rwfRate, withdrawalMethodId: selectedAccount, donationAmount: donationValue / rwfRate,
          isGiftWithdrawal: selectedSource?.isGiftWithdrawal || false,
          source: selectedSource?.source?.toUpperCase() || 'BALANCE',
        }),
      });
      const result = await res.json();
      if (result.action === 0) {
        if (result.kycRequired) {
          setError('KYC verification is required before you can withdraw funds.');
          setIsKycRequired(true);
        } else {
          setError(sanitizeErrorMessage(result.message, 'Withdrawal failed. Please try again.'));
          setIsKycRequired(false);
        }
        setStep('failed'); setIsWithdrawing(false); return;
      }
      // Success: move to verification step
      const data = result.data;
      setVerificationId(data.verificationId);
      setVerificationMethod(data.method);
      setMaskedDestination(data.maskedDestination || '');
      setRequiresFaceScan(data.requiresFaceScan || false);
      setRequiresOtp(data.requiresOtp || false);
      setOtpDigits(['', '', '', '', '', '']);
      setCapturedSelfie(null);
      setVerificationError('');
      setRemainingAttempts(3);
      setStep('verification');
    } catch { setError('Network error. Please try again.'); setStep('failed'); }
    setIsWithdrawing(false);
  };

  // Step 2: Verify and complete withdrawal
  const handleVerify = async () => {
    setIsVerifying(true); setVerificationError('');
    try {
      const apiUrl = getApiUrl();
      const otp = requiresOtp ? otpDigits.join('') : undefined;
      const selfie = requiresFaceScan ? capturedSelfie : undefined;

      if (requiresOtp && (!otp || otp.length < 6)) {
        setVerificationError('Please enter the complete 6-digit code.');
        setIsVerifying(false); return;
      }
      if (requiresFaceScan && !selfie) {
        setVerificationError('Please capture your selfie for face verification.');
        setIsVerifying(false); return;
      }

      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${apiNamespace}/withdraw/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, otp, selfie }),
      });
      const result = await res.json();
      if (result.action === 0) {
        if (result.maxAttemptsReached) {
          setError('Maximum verification attempts reached. Please start a new withdrawal.');
          setStep('failed');
        } else if (result.expired) {
          setError('Verification has expired. Please start a new withdrawal.');
          setStep('failed');
        } else {
          setVerificationError(result.message || 'Verification failed.');
          if (result.remainingAttempts !== undefined) setRemainingAttempts(result.remainingAttempts);
          if (requiresOtp) setOtpDigits(['', '', '', '', '', '']);
          if (requiresFaceScan) setCapturedSelfie(null);
        }
        setIsVerifying(false); return;
      }
      // Verification succeeded - process payout
      setStep('processing');
      const transactionId = result.data?.transactionId || result.data?.id;
      if (!transactionId) {
        setError('Withdrawal could not be completed: missing transaction reference. Please contact support.');
        setStep('failed');
        setIsVerifying(false);
        return;
      }
      try {
        const payoutResult = await processWithdrawal(String(transactionId));
        setStep(payoutResult.success ? 'success' : 'failed');
        if (!payoutResult.success) setError(payoutResult.error || 'Payout processing failed.');
      } catch {
        setError('Network error while processing payout. Please try again.');
        setStep('failed');
      }
    } catch {
      setVerificationError('Network error. Please try again.');
    }
    setIsVerifying(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${apiNamespace}/withdraw/resend-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId }),
      });
      const result = await res.json();
      if (result.action === 1) {
        setResendCooldown(30);
        setMaskedDestination(result.data?.maskedDestination || maskedDestination);
        setOtpDigits(['', '', '', '', '', '']);
        setVerificationError('');
      } else {
        setVerificationError(result.message || 'Failed to resend code.');
      }
    } catch { setVerificationError('Failed to resend code.'); }
    setIsResending(false);
  };

  // OTP input handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setOtpDigits(newDigits);
    const nextEmpty = newDigits.findIndex(d => !d);
    otpInputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
  };

  if (!isOpen) return null;

  const getVerificationTitle = () => {
    switch (verificationMethod) {
      case 'SMS_OTP': return 'SMS Verification';
      case 'EMAIL_OTP': return 'Email Verification';
      case 'FACE_SCAN': return 'Face Verification';
      case 'FACE_SCAN_WITH_OTP': return 'Face + OTP Verification';
      default: return 'Verification';
    }
  };

  const getVerificationDescription = () => {
    switch (verificationMethod) {
      case 'SMS_OTP': return `Enter the 6-digit code sent to ${maskedDestination}`;
      case 'EMAIL_OTP': return `Enter the 6-digit code sent to ${maskedDestination}`;
      case 'FACE_SCAN': return 'Take a selfie to verify your identity';
      case 'FACE_SCAN_WITH_OTP': return `Take a selfie and enter the code sent to ${maskedDestination}`;
      default: return 'Please verify your identity to continue';
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div className="mobile-modal" style={{
        backgroundColor: colors.bgCard, borderRadius: '1rem', width: '520px', maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mobile-modal-header" style={{
          padding: '1.5rem 1.5rem 0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
              {step === 'verification' ? getVerificationTitle() : 'Withdraw Funds'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>
              {step === 'verification' ? getVerificationDescription() : 'Transfer earnings to your account'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, cursor: 'pointer',
            padding: '0.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.textPrimary, transition: 'background 0.2s'
          }}>
            <CloseIcon />
          </button>
        </div>

        <div className="mobile-modal-content" style={{ padding: '1.5rem' }}>

          {/* Success State */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.5rem' }}>Withdrawal Submitted!</h3>
              <p style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.5', marginBottom: '1.5rem' }}>Your withdrawal is being processed. You will be notified when it completes.</p>
              <button onClick={onClose} style={{
                flex: 1, padding: '0.875rem 2rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto',
              }}>Done</button>
            </div>
          )}

          {/* Failed State */}
          {step === 'failed' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: isKycRequired ? '#F59E0B' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: isKycRequired ? '0 4px 14px rgba(245,158,11,0.3)' : '0 4px 14px rgba(220,38,38,0.3)' }}>
                {isKycRequired ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/><path d="M12 8V12M12 16H12.01"/></svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                )}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.5rem' }}>
                {isKycRequired ? 'KYC Verification Required' : 'Withdrawal Failed'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: isKycRequired ? '#92400E' : '#DC2626', marginBottom: '1.5rem', lineHeight: '1.5' }}>{error}</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                {isKycRequired ? (
                  <button onClick={() => { setShowKycModal(true); }} style={{ padding: '0.875rem 1.5rem', border: '2px solid #062a63', borderRadius: '0.75rem', background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/><path d="M9 12L11 14L15 10"/></svg>
                    Complete KYC Verification
                  </button>
                ) : (
                  <button onClick={() => setStep('form')} style={{ padding: '0.875rem 1.5rem', border: '2px solid #062a63', borderRadius: '0.75rem', background: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Try Again</button>
                )}
                <button onClick={onClose} style={{ padding: '0.875rem 1.5rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem', background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )}

          {/* KYC Verification Modal */}
          <KycVerificationModal
            isOpen={showKycModal}
            onClose={() => setShowKycModal(false)}
            onSuccess={() => {
              setShowKycModal(false);
              setIsKycRequired(false);
              setTimeout(() => { handleWithdraw(); }, 500);
            }}
            colors={colors}
            actualTheme={actualTheme}
          />

          {/* Processing State */}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid #E5E7EB', borderTopColor: '#083A85', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.25rem' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '0.35rem' }}>Processing Withdrawal</p>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Please wait while we process your request...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Verification Step */}
          {step === 'verification' && (
            <div style={{ padding: '0.5rem 0' }}>
              {/* Verification icon */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #083A85 0%, #1E40AF 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                  boxShadow: '0 4px 14px rgba(8, 58, 133, 0.3)',
                }}>
                  {requiresFaceScan ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                      <path d="M9 12L11 14L15 10"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Face Scan Section */}
              {requiresFaceScan && !capturedSelfie && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <FaceScanCapture
                    onCapture={(base64) => setCapturedSelfie(base64)}
                    onClose={() => setStep('form')}
                    colors={colors}
                    actualTheme={actualTheme}
                  />
                </div>
              )}

              {/* Captured selfie preview */}
              {requiresFaceScan && capturedSelfie && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden',
                    border: '3px solid #16A34A', margin: '0 auto 0.5rem',
                  }}>
                    <img src={capturedSelfie} alt="Your selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  </div>
                  <button onClick={() => setCapturedSelfie(null)} style={{
                    fontSize: '0.8rem', color: '#083A85', background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline', fontWeight: '500',
                  }}>Retake Photo</button>
                </div>
              )}

              {/* OTP Input Section */}
              {requiresOtp && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block', textAlign: 'center', fontSize: '0.875rem',
                    fontWeight: '600', color: colors.textPrimary, marginBottom: '1rem',
                  }}>Enter Verification Code</label>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpInputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        style={{
                          width: '48px', height: '56px', textAlign: 'center', fontSize: '1.25rem',
                          fontWeight: '700', border: `2px solid ${digit ? '#083A85' : colors.borderPrimary}`,
                          borderRadius: '0.75rem', outline: 'none', color: colors.textPrimary,
                          backgroundColor: colors.bgCard, transition: 'border-color 0.2s',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = digit ? '#083A85' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    ))}
                  </div>

                  {/* Resend OTP */}
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    {resendCooldown > 0 ? (
                      <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                        Resend code in {resendCooldown}s
                      </span>
                    ) : (
                      <button onClick={handleResendOtp} disabled={isResending} style={{
                        fontSize: '0.8rem', color: '#083A85', background: 'none', border: 'none',
                        cursor: isResending ? 'not-allowed' : 'pointer', textDecoration: 'underline',
                        fontWeight: '500', opacity: isResending ? 0.6 : 1,
                      }}>{isResending ? 'Sending…' : 'Resend verification code'}</button>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Error */}
              {verificationError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', padding: '0.75rem',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                  border: '1px solid', borderColor: actualTheme === 'dark' ? 'rgba(239,68,68,0.3)' : '#FECACA',
                  borderRadius: '0.75rem', fontSize: '0.8rem', color: actualTheme === 'dark' ? '#F87171' : '#DC2626', fontWeight: '500',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{verificationError}</span>
                  {remainingAttempts < 3 && (
                    <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>
              )}

              {/* Verify + Cancel Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep('form')} disabled={isVerifying}
                  style={{
                    flex: 1, padding: '0.875rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem',
                    background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600',
                    cursor: isVerifying ? 'not-allowed' : 'pointer', opacity: isVerifying ? 0.6 : 1,
                  }}>
                  Back
                </button>
                <button onClick={handleVerify} disabled={isVerifying}
                  style={{
                    flex: 1, padding: '0.875rem 1rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                    background: isVerifying ? '#9CA3AF' : '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600',
                    cursor: isVerifying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}>
                  {isVerifying ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                        <path d="M9 12L11 14L15 10"/>
                      </svg>
                      Verify & Withdraw
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {step === 'form' && (
            <>
              {/* Available Balance Card */}
              <div className="mobile-balance-display" style={{
                background: 'linear-gradient(135deg, #083A85 0%, #1E40AF 100%)',
                borderRadius: '0.875rem', padding: '1.25rem', marginBottom: '1.5rem',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: '-30px', right: '40px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="mobile-balance-display-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Available Balance (RWF)
                  </div>
                  <div className="mobile-balance-display-amount" style={{ fontSize: '2rem', fontWeight: '700', color: 'white', letterSpacing: '-0.02em' }}>
                    RF {totalBalanceRwf.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mobile-input-section" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', fontWeight: '600', color: colors.textSecondary }}>RF</span>
                  <input type="text" placeholder="0.00" value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    style={{
                      width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', border: '2px solid #E5E7EB',
                      borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary,
                      outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                      backgroundColor: colors.bgCard,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {/* Quick amount buttons */}
                <div className="mobile-quick-amounts" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {['5000', '10000', '25000', '50000'].map(amount => (
                    <button key={amount} onClick={() => setWithdrawAmount(amount)}
                      style={{
                        padding: '0.5rem', border: withdrawAmount === amount ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.5rem', background: withdrawAmount === amount ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                        color: withdrawAmount === amount ? '#083A85' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                      RF {parseInt(amount).toLocaleString()}
                    </button>
                  ))}
                </div>
                {amountError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                    backgroundColor: actualTheme === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                    border: '1px solid', borderColor: actualTheme === 'dark' ? 'rgba(239,68,68,0.3)' : '#FECACA',
                    borderRadius: '0.5rem', fontSize: '0.8rem', color: actualTheme === 'dark' ? '#F87171' : '#DC2626', fontWeight: '500',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {amountError}
                  </div>
                )}
              </div>

              {/* Withdrawal Source Selection */}
              {sources.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary }}>Withdraw From</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {sources.map(s => {
                      const isSelected = selectedSource?.source === s.source;
                      const isDisabled = s.availableBalance <= 0;
                      return (
                        <button key={s.source} onClick={() => !isDisabled && setSelectedSource(s)} disabled={isDisabled}
                          style={{
                            padding: '0.75rem', border: isSelected ? '2px solid #083A85' : `1px solid ${colors.borderPrimary}`,
                            borderRadius: '0.5rem', background: isDisabled ? colors.bgTertiary : isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                            opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.2s',
                          }}>
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '500' }}>{s.label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isDisabled ? colors.textSecondary : colors.textPrimary }}>
                            RF {Math.floor(s.availableBalance * rwfRate).toLocaleString()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Account Selection */}
              <div className="mobile-account-section" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Payment Account</label>
                <div className="mobile-account-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {accountsLoading ? (
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, textAlign: 'center', padding: '1rem 0' }}>Loading accounts...</p>
                  ) : accounts.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, textAlign: 'center', padding: '1rem 0' }}>
                      No withdrawal accounts saved.{' '}
                      <span onClick={() => { onClose(); window.location.href = prefsPath; }}
                        style={{ color: '#083A85', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}>
                        Add one in Preferences → Payments
                      </span>
                    </p>
                  ) : null}
                  {accounts.map(account => (
                    <div key={account.id} onClick={() => setSelectedAccount(account.id)} className="mobile-account-item"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        border: selectedAccount === account.id ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.75rem', cursor: 'pointer',
                        backgroundColor: selectedAccount === account.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                        transition: 'all 0.2s',
                      }}>
                      <div className="mobile-account-image" style={{
                        width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                      }}>
                        {account.type === 'bank' ? (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : account.type === 'mtn' || account.type === 'airtel' ? (
                          <Image
                            src={account.type === 'mtn' ? '/mtn.png' : '/airtel.png'}
                            alt={account.label}
                            width={48}
                            height={48}
                            unoptimized
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        ) : (
                          <MobileMoneyIcon />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mobile-account-info" style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.125rem' }}>{account.label}</div>
                        <div className="mobile-account-number" style={{ fontSize: '0.8rem', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{account.accountNumber}</span>
                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                          <span>{account.accountName}</span>
                        </div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: selectedAccount === account.id ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgCard, flexShrink: 0,
                      }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info text */}
              <p className="mobile-info-text" style={{ fontSize: '0.86rem', color: colors.textSecondary, margin: '0.75rem 0 1.25rem 0', textAlign: 'center' }}>
                <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
                Manage your payment accounts in <span
                  onClick={() => { onClose(); window.location.href = prefsPath; }}
                  style={{ color: '#083A85', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}>
                  Preferences → Payment Accounts
                </span>
              </p>

              {/* Donation Section */}
              <div style={{
                marginBottom: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
                border: `2px solid ${donationSkipped ? colors.borderPrimary : (donationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.3)')}`,
                background: actualTheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(242, 12, 143, 0.05) 0%, rgba(255, 107, 157, 0.02) 100%)',
                transition: 'all 0.2s',
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
                      {['500', '1000', '2500', '5000'].map(amount => (
                        <button key={amount} onClick={() => handleSelectDonation(amount)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            border: donationAmount === amount ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                            borderRadius: '0.5rem',
                            background: donationAmount === amount ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                            color: donationAmount === amount ? '#F20C8F' : colors.textSecondary,
                            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0',
                          }}>
                          RF {parseInt(amount).toLocaleString()}
                        </button>
                      ))}
                      <button onClick={() => handleSelectDonation('custom')}
                        style={{
                          padding: '0.4rem 0.75rem',
                          border: donationAmount === 'custom' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem',
                          background: donationAmount === 'custom' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                          color: donationAmount === 'custom' ? '#F20C8F' : colors.textSecondary,
                          fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', flex: '1', minWidth: '0',
                        }}>
                        Custom
                      </button>
                    </div>

                    {showCustomInput && (
                      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary }}>$</span>
                        <input type="number" placeholder="Enter amount" value={customDonation}
                          onChange={e => setCustomDonation(e.target.value)}
                          style={{
                            width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem',
                            border: `2px solid ${customDonation ? '#F20C8F' : colors.borderPrimary}`,
                            borderRadius: '0.5rem', fontSize: '0.85rem', color: colors.textPrimary,
                            backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = customDonation ? '#F20C8F' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    )}
                  </>
                )}

                <button onClick={handleSkipDonation}
                  style={{
                    width: '100%', padding: '0.5rem 1rem', borderRadius: '9999px',
                    border: donationSkipped ? '2px solid #F20C8F' : '2px solid #6B7280',
                    background: donationSkipped ? '#F20C8F' : colors.bgTertiary,
                    color: donationSkipped ? 'white' : '#374151',
                    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                  }}>
                  {donationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}
                </button>

                <div style={{ marginTop: '0.5rem' }}>
                  <a href="#" onClick={e => e.preventDefault()}
                    style={{ fontSize: '0.81rem', color: '#F20C8F', textDecoration: 'none', fontWeight: '500' }}>
                    Learn more about our donation program →
                  </a>
                </div>
              </div>

              {/* Validation Message */}
              {!donationAddressed && (
                <p style={{ fontSize: '0.86rem', color: '#F20C8F', margin: '0 0 0.75rem 0', textAlign: 'center', fontWeight: '500' }}>
                  Please select a donation amount or skip to continue
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button onClick={onClose} disabled={isWithdrawing}
                  style={{
                    flex: 1, padding: '0.875rem 1rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem',
                    background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600',
                    cursor: isWithdrawing ? 'not-allowed' : 'pointer', opacity: isWithdrawing ? 0.6 : 1, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!isWithdrawing) e.currentTarget.style.background = colors.borderPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.background = colors.bgTertiary; }}>
                  Cancel
                </button>
                <button onClick={handleWithdraw} disabled={!isValid || isWithdrawing}
                  style={{
                    flex: 1, padding: '0.875rem 1rem',
                    border: !isValid || isWithdrawing ? '2px solid #9CA3AF' : '2px solid #062a63',
                    borderRadius: '0.75rem', background: !isValid || isWithdrawing ? '#9CA3AF' : '#083A85',
                    color: 'white', fontSize: '0.9rem', fontWeight: '600',
                    cursor: !isValid || isWithdrawing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
                  }}>
                  <WithdrawIcon />
                  {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
