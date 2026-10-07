"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { sanitizeErrorMessage } from '@/lib/xentripay';
import { useCurrency } from '../context/CurrencyContext';
import PaymentCurrencyPreview from './PaymentCurrencyPreview';
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
  const { currencies, currency: globalCurrency } = useCurrency();
  const rwfRate = currencies.find(c => c.code === 'RWF')?.rate || 1460;

  // Display currency for the entire modal. every visible amount + the input
  // prefix + quick-amount presets re-render in this currency. Defaults to
  // whatever the user picked in the topbar but is then controlled by the
  // currency-preview panel's selector at the top of the modal.
  // Internally amounts continue to be tracked in RWF/USD as before; this
  // state only affects display + how the user's typed input is interpreted.
  const [displayCurrency, setDisplayCurrency] = useState<typeof globalCurrency>(globalCurrency);
  useEffect(() => { setDisplayCurrency(globalCurrency); }, [globalCurrency]);
  const displayInfo = currencies.find(c => c.code === displayCurrency)
    || currencies.find(c => c.code === 'RWF')!;
  const displayRate = displayInfo.rate || 1;
  // Convert helpers: RWF/USD amounts -> the user's chosen display currency.
  const rwfToDisplay = (rwf: number) => (rwf / rwfRate) * displayRate;
  const usdToDisplay = (usd: number) => usd * displayRate;
  // Format an RWF amount as it should appear in the modal's chosen display
  // currency, with the right symbol + decimal precision.
  const fmtFromRwf = (rwf: number) => `${displayInfo.symbol}${rwfToDisplay(rwf).toLocaleString('en-US', {
    minimumFractionDigits: displayInfo.decimals,
    maximumFractionDigits: displayInfo.decimals,
  })}`;
  const fmtFromUsd = (usd: number) => `${displayInfo.symbol}${usdToDisplay(usd).toLocaleString('en-US', {
    minimumFractionDigits: displayInfo.decimals,
    maximumFractionDigits: displayInfo.decimals,
  })}`;

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
  // Withdrawals need 2FA on. null while the status check is in flight.
  const [twoFactorOn, setTwoFactorOn] = useState<boolean | null>(null);

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

  // Fee preview (returned from initiate response)
  const [feePreview, setFeePreview] = useState<{
    totalFee: number; percentageFee: number; additionalCharge: number;
    netAmount: number; feePercentage: number;
  } | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const apiNamespace = role === 'client' ? 'customer' : role === 'photographer' ? 'photographer' : 'coordinator';
  const prefsPath = role === 'photographer' ? '/user/photographer/preferences?tab=payments'
    : role === 'event-coordinator' ? '/user/event-coordinator/preferences?tab=payments'
    : '/user/client/preferences?tab=payments';

  const twoFactorSetupPath = `/user/${role}/preferences?tab=security&setup2fa=true`;

  useEffect(() => {
    if (!isOpen) return;
    setTwoFactorOn(null);
    dashboardAuthFetch(`${getApiUrl()}/api/remote/customer/totp/status`)
      .then(res => res.json())
      .then(result => setTwoFactorOn(result?.action === 1 ? result.twoFactorEnabled === true : true))
      // If the check itself fails, show the form; the server still refuses without 2FA.
      .catch(() => setTwoFactorOn(true));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form'); setError(''); setWithdrawAmount(''); setDonationAmount(''); setCustomDonation('');
    setDonationSkipped(false); setShowCustomInput(false); setAccountsLoading(true);
    setVerificationId(''); setVerificationMethod(''); setOtpDigits(['', '', '', '', '', '']);
    setVerificationError(''); setCapturedSelfie(null); setResendCooldown(0); setIsResending(false); setFeePreview(null);
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

  // Source/total balances are stored on the wire in USD; convert to RWF
  // (the legacy canonical for this modal's math) once and to display
  // currency when rendering.
  const sourceBalanceRwf = Math.floor((selectedSource?.availableBalance || 0) * rwfRate);
  const totalBalanceRwf = Math.floor(sources.reduce((sum, s) => sum + s.availableBalance, 0) * rwfRate);

  // The user types `withdrawAmount` in the chosen displayCurrency. We derive
  // an RWF equivalent (for balance comparisons / errors against the legacy
  // RWF totals) and a USD equivalent (which is what the backend submit
  // expects on the wire. see /withdraw/initiate body below).
  const parsedDisplayAmount = parseFloat(withdrawAmount) || 0;
  const parsedUsdAmount = displayRate > 0 ? parsedDisplayAmount / displayRate : 0;
  const parsedRwfAmount = parsedUsdAmount * rwfRate;

  // Donation amount uses the same display-currency semantics: presets are
  // pre-converted to displayCurrency at render time (further down), and
  // customDonation is what the user typed in displayCurrency.
  const donationDisplayValue = donationAmount === 'custom'
    ? (parseFloat(customDonation) || 0)
    : (parseFloat(donationAmount) || 0);
  const donationUsdValue = displayRate > 0 ? donationDisplayValue / displayRate : 0;
  const donationAddressed = donationSkipped || donationDisplayValue > 0;

  const amountError = withdrawAmount !== '' && parsedDisplayAmount <= 0
    ? 'Please enter a withdrawal amount greater than zero.'
    : parsedRwfAmount > sourceBalanceRwf
      ? `Insufficient ${selectedSource?.label || ''} balance. Available: ${fmtFromRwf(sourceBalanceRwf)}`
      : '';
  const isWithdrawValid = parsedRwfAmount > 0 && parsedRwfAmount <= sourceBalanceRwf;
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
          // Submit USD on the wire. backend canonical. parsedUsdAmount and
          // donationUsdValue are derived above from the user's typed
          // displayCurrency input via /displayRate.
          amount: parsedUsdAmount,
          withdrawalMethodId: selectedAccount,
          donationAmount: donationUsdValue,
          isGiftWithdrawal: selectedSource?.isGiftWithdrawal || false,
          source: selectedSource?.source?.toUpperCase() || 'BALANCE',
        }),
      });
      const result = await res.json();
      if (result.action === 0 && result.twoFactorRequired) {
        setTwoFactorOn(false); setStep('form'); setIsWithdrawing(false); return;
      }
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
      // Success: capture fee preview and move to verification step
      const data = result.data;
      if (data.feePreview) {
        setFeePreview({
          totalFee: data.feePreview.totalFee ?? 0,
          percentageFee: data.feePreview.percentageFee ?? 0,
          additionalCharge: data.feePreview.additionalCharge ?? 0,
          netAmount: data.feePreview.netAmount ?? 0,
          feePercentage: data.feePreview.feePercentage ?? 0,
        });
      }
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
      if (result.action === 0 && result.twoFactorRequired) {
        setTwoFactorOn(false); setStep('form'); setIsVerifying(false); return;
      }
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
      // Verification succeeded, and that is the end of the client's part.
      // The backend has created the withdrawal as PENDING_APPROVAL, held the
      // funds and emailed finance; an admin's approval fires the payout
      // (AdminWithdrawalApprovalApiController). This used to call
      // /withdrawals/xentripay/process here, which refuses anything not
      // PENDING, so a request that went through was shown as failed, with a
      // "Try again" that started a second withdrawal on top of the held one.
      setStep('success');
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
      backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
      animation: 'ck-fade-in 180ms ease both',
    }} onClick={onClose}>
      <div className="mobile-modal" style={{
        backgroundColor: 'var(--ck-surface)',
        borderRadius: 20, width: 560, maxWidth: '100%',
        maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
        animation: 'ck-modal-pop 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mobile-modal-header" style={{
          padding: '18px 22px 16px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 12, borderBottom: '1px solid var(--ck-stroke)',
        }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em',
              color: 'var(--ck-text)', margin: 0,
            }}>
              {step === 'verification' ? getVerificationTitle() : 'Withdraw funds'}
            </h3>
            <p style={{
              fontSize: '0.88rem', color: 'var(--ck-text-soft)', margin: '4px 0 0',
            }}>
              {step === 'verification' ? getVerificationDescription() : 'Transfer earnings to your account.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 9999,
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ck-text)', transition: 'background 180ms', flexShrink: 0,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <i className="bi bi-x-lg" style={{ fontSize: 16 }} />
          </button>
        </div>

        <div className="mobile-modal-content" style={{ padding: '22px' }}>

          {/* Success State */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0 0.5rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', boxShadow: '0 12px 28px rgba(16,185,129,0.40)' }}>
                <i className="bi bi-check2" style={{ fontSize: 32, color: '#fff' }} />
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Withdrawal submitted</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>Request received</h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.55, marginBottom: '1.4rem', maxWidth: 360, margin: '0 auto 1.4rem' }}>The amount is set aside from your balance. Our team reviews each withdrawal before it is paid out to your account, and you will be notified when it is sent.</p>
              <button onClick={onClose} style={{
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: 11,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                fontSize: '0.92rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 8px 18px rgba(16,185,129,0.32)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <i className="bi bi-check2" style={{ fontSize: 13 }} />
                Done
              </button>
            </div>
          )}

          {/* Failed State */}
          {step === 'failed' && (
            <div style={{ textAlign: 'center', padding: '2rem 0 0.5rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: isKycRequired
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.1rem',
                boxShadow: isKycRequired ? '0 12px 28px rgba(245,158,11,0.40)' : '0 12px 28px rgba(220,38,38,0.40)',
              }}>
                <i className={`bi ${isKycRequired ? 'bi-shield-exclamation' : 'bi-x-octagon-fill'}`} style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: isKycRequired ? '#D97706' : '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                {isKycRequired ? 'Verification required' : 'Withdrawal failed'}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                {isKycRequired ? 'KYC Verification Required' : 'We couldn\'t process this withdrawal'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: isKycRequired ? (actualTheme === 'dark' ? '#FCD34D' : '#92400E') : (actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C'), marginBottom: '1.4rem', lineHeight: 1.55, maxWidth: 380, margin: '0 auto 1.4rem' }}>{error}</p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '0.75rem 1.4rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    background: colors.bgTertiary,
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                >
                  Close
                </button>
                {isKycRequired ? (
                  <button
                    onClick={() => { setShowKycModal(true); }}
                    style={{
                      padding: '0.75rem 1.4rem',
                      border: 'none',
                      borderRadius: 11,
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: 'white',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '-0.005em',
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      boxShadow: '0 8px 18px rgba(245,158,11,0.32)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="bi bi-shield-check" style={{ fontSize: 13 }} />
                    Complete KYC Verification
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('form')}
                    style={{
                      padding: '0.75rem 1.4rem',
                      border: 'none',
                      borderRadius: 11,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: 'white',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '-0.005em',
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      boxShadow: '0 8px 18px rgba(8,58,133,0.30)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="bi bi-arrow-clockwise" style={{ fontSize: 13 }} />
                    Try Again
                  </button>
                )}
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
              {/* Fee preview card */}
              {feePreview && (
                <div style={{
                  marginBottom: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  background: actualTheme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Withdrawal Summary
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Amount</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>
                      {fmtFromRwf(parsedRwfAmount)}
                    </span>
                  </div>
                  {feePreview.totalFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Fee ({feePreview.feePercentage}%{feePreview.additionalCharge > 0 ? ' + flat' : ''})
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D97706' }}>
                        -{fmtFromUsd(feePreview.totalFee)}
                      </span>
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${actualTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`, paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textPrimary }}>You receive</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>
                      {fmtFromUsd(feePreview.netAmount)}
                    </span>
                  </div>
                </div>
              )}

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
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={() => setStep('form')} disabled={isVerifying}
                  style={{
                    flex: 1, padding: '0.75rem 1rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: 700,
                    cursor: isVerifying ? 'not-allowed' : 'pointer', opacity: isVerifying ? 0.6 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isVerifying) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                >
                  Back
                </button>
                <button onClick={handleVerify} disabled={isVerifying}
                  style={{
                    flex: 1.4, padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: 11,
                    background: isVerifying
                      ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                      : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: 'white', fontSize: '0.92rem', fontWeight: 700,
                    letterSpacing: '-0.005em',
                    cursor: isVerifying ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: isVerifying ? 'none' : '0 8px 18px rgba(8,58,133,0.30)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isVerifying) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isVerifying ? 'none' : '0 8px 18px rgba(8,58,133,0.30)'; }}
                >
                  {isVerifying ? (
                    <>
                      <i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check" style={{ fontSize: 13 }} />
                      Verify & Withdraw
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {step === 'form' && twoFactorOn === null && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '2.5rem 0', color: colors.textSecondary, fontSize: '0.9rem' }}>
              <span className="ck-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Checking your account security…
            </div>
          )}

          {step === 'form' && twoFactorOn === false && (
            <div style={{ textAlign: 'center', padding: '2rem 0 0.5rem' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, #083A85 0%, #0B4DAE 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.1rem',
                boxShadow: '0 12px 28px rgba(8,58,133,0.35)',
              }}>
                <i className="bi bi-shield-lock-fill" style={{ fontSize: 28, color: '#fff' }} aria-hidden />
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Withdrawals paused
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                Turn on two-factor authentication to withdraw
              </h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.55, maxWidth: 380, margin: '0 auto 1.4rem' }}>
                Your wallet holds real money, so withdrawals need a code from your authenticator app. Your balance is safe and stays in your wallet until you turn it on.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={onClose} className="ck-btn ck-btn-soft" style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem' }}>
                  Not now
                </button>
                <a href={twoFactorSetupPath} className="ck-btn ck-btn-primary" style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: 13 }} aria-hidden />
                  Turn on 2FA
                </a>
              </div>
            </div>
          )}

          {step === 'form' && twoFactorOn === true && (
            <>
              {/* Available Balance Card. Connekyt brand gradient */}
              <div className="mobile-balance-display" style={{
                background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 60%, #1654b8 100%)',
                borderRadius: 16, padding: '22px 24px', marginBottom: 14,
                position: 'relative', overflow: 'hidden', color: '#ffffff',
              }}>
                <div style={{
                  position: 'absolute', top: -60, right: -60,
                  width: 200, height: 200, borderRadius: '50%',
                  background: 'radial-gradient(closest-side, rgba(242,12,143,0.30), rgba(242,12,143,0))',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', bottom: -80, left: -40,
                  width: 180, height: 180, borderRadius: '50%',
                  background: 'radial-gradient(closest-side, rgba(255,255,255,0.10), rgba(255,255,255,0))',
                  pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 9999,
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    fontSize: '0.66rem', fontWeight: 700,
                    letterSpacing: '0.10em', textTransform: 'uppercase',
                    color: '#fff', backdropFilter: 'blur(8px)', marginBottom: 10,
                  }}>
                    <i className="bi bi-wallet2" style={{ fontSize: 11 }} />
                    Available · {displayCurrency}
                  </span>
                  <div className="mobile-balance-display-amount" style={{
                    fontSize: '2.1rem', fontWeight: 800, color: 'white',
                    letterSpacing: '-0.025em', lineHeight: 1.05,
                    textShadow: '0 4px 30px rgba(0,0,0,0.18)',
                  }}>
                    {fmtFromRwf(totalBalanceRwf)}
                  </div>
                </div>
              </div>

              {/* Currency preview panel. pinned top-right under the balance
                  card, always visible. Shows every relevant RWF amount on the
                  modal converted to the user's preferred currency. Display-
                  only; the actual withdrawal still submits in RWF and the
                  backend converts to USD canonically before XentriPay. */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <PaymentCurrencyPreview
                  fromCurrency="RWF"
                  amounts={[
                    { label: 'Available balance', amount: totalBalanceRwf },
                    { label: 'Amount entered', amount: parsedRwfAmount },
                  ]}
                  onCurrencyChange={(code) => {
                    // When user picks a new display currency, the modal
                    // re-renders every visible amount in that currency
                    // (balance card, input prefix, quick presets, fee
                    // preview). The user's typed input semantics flip too:
                    // if they had "10" while on RWF, switching to USD now
                    // means the RWF rate equivalent (10 / 1460 ≈ 0.0068).
                    // Convert the input string so the underlying RWF amount
                    // stays the same instead of changing meaning.
                    const oldRate = displayInfo.rate || 1;
                    const newInfo = currencies.find(c => c.code === code) || displayInfo;
                    const newRate = newInfo.rate || 1;
                    if (withdrawAmount && oldRate > 0 && newRate > 0) {
                      const inUsd = parsedDisplayAmount / oldRate;
                      const inNew = inUsd * newRate;
                      setWithdrawAmount(inNew ? inNew.toFixed(newInfo.decimals) : '');
                    }
                    setDisplayCurrency(code);
                  }}
                />
              </div>

              {/* Amount Input */}
              <div className="mobile-input-section" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', fontWeight: '600', color: colors.textSecondary }}>{displayInfo.symbol}</span>
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
                {/* Quick amount buttons. Presets are a fraction of the
                    *selected source* balance (withdrawal is validated
                    per-source, not against the combined total. see
                    `amountError` / `sourceBalanceRwf`), so "Max" withdraws
                    exactly the chosen bucket. The display value is floored
                    to the display currency's precision so the round-trip
                    back to RWF never exceeds sourceBalanceRwf (which would
                    otherwise trip the insufficient-balance guard on Max). */}
                <div className="mobile-quick-amounts" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {[
                    { label: '25%', frac: 0.25 },
                    { label: '50%', frac: 0.5 },
                    { label: '75%', frac: 0.75 },
                    { label: 'Max', frac: 1 },
                  ].map(({ label, frac }) => {
                    const pow = Math.pow(10, displayInfo.decimals);
                    const rawDisp = rwfToDisplay(sourceBalanceRwf * frac);
                    const dispVal = Math.floor(rawDisp * pow) / pow;
                    const dispStr = dispVal.toFixed(displayInfo.decimals);
                    const selected = withdrawAmount === dispStr && dispVal > 0;
                    const disabled = sourceBalanceRwf <= 0;
                    return (
                      <button key={label} disabled={disabled} onClick={() => setWithdrawAmount(dispStr)}
                        title={dispVal > 0 ? `${displayInfo.symbol}${dispStr}` : undefined}
                        style={{
                          padding: '0.5rem', border: selected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem', background: selected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                          color: selected ? '#083A85' : colors.textSecondary, fontSize: '0.8rem', fontWeight: '600',
                          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s',
                        }}>
                        {label}
                      </button>
                    );
                  })}
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
                        <button key={s.source} data-ck-shape="card" onClick={() => !isDisabled && setSelectedSource(s)} disabled={isDisabled}
                          style={{
                            padding: '0.75rem', border: isSelected ? '2px solid #083A85' : `1px solid ${colors.borderPrimary}`,
                            borderRadius: '0.5rem', background: isDisabled ? colors.bgTertiary : isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                            opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.2s',
                          }}>
                          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.25rem', fontWeight: '500' }}>{s.label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isDisabled ? colors.textSecondary : colors.textPrimary }}>
                            {fmtFromUsd(s.availableBalance)}
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
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                        No Withdrawal Methods
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: colors.textSecondary, margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
                        You need to add a withdrawal method before you can withdraw funds.
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          window.location.href = `${prefsPath}&action=add-method`;
                        }}
                        className="ck-btn ck-btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <i className="bi bi-plus-lg" style={{ fontSize: 12 }} />
                        Add withdrawal method
                      </button>
                    </div>
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
                      padding: '3px 8px', borderRadius: 999,
                      background: 'var(--ck-surface-soft)', border: '1px solid var(--ck-stroke)',
                    }}>Optional</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '8px 0 0', lineHeight: 1.5 }}>
                    Add a small donation to help fund community projects and initiatives.
                  </p>
                </div>

                {!donationSkipped && (
                  <>
                    {/* Donation presets are RWF-canonical (500/1000/2500/5000),
                        rendered + stored in the user's chosen display currency
                        so the donation flow obeys the same per-modal currency
                        switching as the withdrawal amount above. */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {[500, 1000, 2500, 5000].map(rwfPreset => {
                        const dispVal = rwfToDisplay(rwfPreset);
                        const dispStr = dispVal.toFixed(displayInfo.decimals);
                        const selected = donationAmount === dispStr;
                        return (
                          <button key={rwfPreset} onClick={() => handleSelectDonation(dispStr)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              border: selected ? '1.5px solid #F20C8F' : `1px solid var(--ck-stroke)`,
                              borderRadius: 10,
                              background: selected
                                ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.22)' : 'rgba(242, 12, 143, 0.10)')
                                : 'var(--ck-surface)',
                              color: selected ? '#F20C8F' : colors.textPrimary,
                              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', flex: '1', minWidth: 0,
                              boxShadow: selected ? '0 4px 10px rgba(242, 12, 143, 0.18)' : 'none',
                            }}>
                            {fmtFromRwf(rwfPreset)}
                          </button>
                        );
                      })}
                      <button onClick={() => handleSelectDonation('custom')}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: donationAmount === 'custom' ? '1.5px solid #F20C8F' : `1px solid var(--ck-stroke)`,
                          borderRadius: 10,
                          background: donationAmount === 'custom'
                            ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.22)' : 'rgba(242, 12, 143, 0.10)')
                            : 'var(--ck-surface)',
                          color: donationAmount === 'custom' ? '#F20C8F' : colors.textPrimary,
                          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s', flex: '1', minWidth: 0,
                          boxShadow: donationAmount === 'custom' ? '0 4px 10px rgba(242, 12, 143, 0.18)' : 'none',
                        }}>
                        Custom
                      </button>
                    </div>

                    {showCustomInput && (
                      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', fontWeight: 700, color: colors.textSecondary }}>$</span>
                        <input type="number" placeholder="Enter amount" value={customDonation}
                          onChange={e => setCustomDonation(e.target.value)}
                          style={{
                            width: '100%', padding: '0.65rem 0.85rem 0.65rem 1.85rem',
                            border: `1.5px solid ${customDonation ? '#F20C8F' : 'var(--ck-stroke)'}`,
                            borderRadius: 10, fontSize: '0.88rem', color: colors.textPrimary,
                            backgroundColor: 'var(--ck-surface)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.14)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = customDonation ? '#F20C8F' : 'var(--ck-stroke)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    )}
                  </>
                )}

                <button onClick={handleSkipDonation}
                  style={{
                    width: '100%', padding: '0.55rem 1rem', borderRadius: 9999,
                    border: donationSkipped ? '1.5px solid #F20C8F' : '1px solid var(--ck-stroke)',
                    background: donationSkipped ? '#F20C8F' : 'var(--ck-surface)',
                    color: donationSkipped ? '#fff' : colors.textSecondary,
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', textAlign: 'center',
                  }}>
                  {donationSkipped ? '✓ Donation skipped' : 'No thanks, skip donation'}
                </button>

                <div style={{ marginTop: '0.65rem', textAlign: 'left' }}>
                  <a href="#" onClick={e => e.preventDefault()}
                    style={{ fontSize: '0.78rem', color: '#F20C8F', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Learn more about our donation program <i className="bi bi-arrow-right" style={{ fontSize: 11 }} />
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
              <div style={{
                display: 'flex', gap: 10, alignItems: 'center',
                padding: '14px 0 4px', marginTop: 8,
                borderTop: '1px solid var(--ck-stroke)', paddingTop: 16,
              }}>
                <button onClick={onClose} disabled={isWithdrawing}
                  className="ck-btn ck-btn-ghost"
                  style={{ flex: 1, padding: '11px 16px' }}>
                  Cancel
                </button>
                <button onClick={handleWithdraw} disabled={!isValid || isWithdrawing}
                  className="ck-btn ck-btn-primary"
                  style={{
                    flex: 1.4, padding: '11px 16px',
                    opacity: !isValid || isWithdrawing ? 0.55 : 1,
                    cursor: !isValid || isWithdrawing ? 'not-allowed' : 'pointer',
                  }}>
                  {isWithdrawing ? (
                    <>
                      <span className="ck-spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                      Processing…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bank" /> Withdraw funds
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
