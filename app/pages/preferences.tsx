"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../components/sidebar';
import Topbar from '../components/topbar';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { dashboardAuthFetch, useDashboardAuth } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { validateAccountDetails } from '@/lib/xentripay';

// API response type
interface ApiResponse<T = unknown> {
  action: number;
  message?: string;
  data?: T;
}

// Preference payload for PUT
interface PreferencePayload {
  value: string;
  [key: string]: unknown;
}

interface PaymentMethod {
  id: string;
  type: 'mobile' | 'bank';
  methodType: string;
  name: string;
  details: string;
  isDefault: boolean;
  bankName?: string;
  accountName?: string;
}

interface PreferencesPageProps {
  userType?: 'photographer' | 'client' | 'event-coordinator';
}

// SVG Icons
const SunIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SystemIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MobileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Component to handle URL params - needs Suspense boundary
const TabParamHandler = ({
  setActiveTab,
  setShowAddPaymentModal
}: {
  setActiveTab: (tab: 'appearance' | 'payments' | 'notifications' | 'security') => void;
  setShowAddPaymentModal: (show: boolean) => void;
}) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const action = searchParams.get('action');

    // Auto-switch to payments tab
    if (tab === 'payments') {
      setActiveTab('payments');
    } else if (tab === 'notifications') {
      setActiveTab('notifications');
    } else if (tab === 'security') {
      setActiveTab('security');
    }

    // Auto-open add payment modal if action=add-method
    if (action === 'add-method' && tab === 'payments') {
      setTimeout(() => {
        setShowAddPaymentModal(true);
      }, 300); // Small delay to ensure tab content is rendered
    }
  }, [searchParams, setActiveTab, setShowAddPaymentModal]);

  return null;
};

const COUNTRIES: { name: string; dialCode: string; flag: string; iso: string }[] = [
  { name: 'Benin', dialCode: '+229', flag: '🇧🇯', iso: 'bj' },
  { name: 'Botswana', dialCode: '+267', flag: '🇧🇼', iso: 'bw' },
  { name: 'Cameroon', dialCode: '+237', flag: '🇨🇲', iso: 'cm' },
  { name: 'Chad', dialCode: '+235', flag: '🇹🇩', iso: 'td' },
  { name: 'Congo (Brazzaville)', dialCode: '+242', flag: '🇨🇬', iso: 'cg' },
  { name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮', iso: 'ci' },
  { name: 'Eswatini', dialCode: '+268', flag: '🇸🇿', iso: 'sz' },
  { name: 'Gabon', dialCode: '+241', flag: '🇬🇦', iso: 'ga' },
  { name: 'Ghana', dialCode: '+233', flag: '🇬🇭', iso: 'gh' },
  { name: 'Kenya', dialCode: '+254', flag: '🇰🇪', iso: 'ke' },
  { name: 'Liberia', dialCode: '+231', flag: '🇱🇷', iso: 'lr' },
  { name: 'Madagascar', dialCode: '+261', flag: '🇲🇬', iso: 'mg' },
  { name: 'Malawi', dialCode: '+265', flag: '🇲🇼', iso: 'mw' },
  { name: 'Niger', dialCode: '+227', flag: '🇳🇪', iso: 'ne' },
  { name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', iso: 'ng' },
  { name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', iso: 'rw' },
  { name: 'Seychelles', dialCode: '+248', flag: '🇸🇨', iso: 'sc' },
  { name: 'South Africa', dialCode: '+27', flag: '🇿🇦', iso: 'za' },
  { name: 'South Sudan', dialCode: '+211', flag: '🇸🇸', iso: 'ss' },
  { name: 'Sudan', dialCode: '+249', flag: '🇸🇩', iso: 'sd' },
  { name: 'Uganda', dialCode: '+256', flag: '🇺🇬', iso: 'ug' },
  { name: 'Zambia', dialCode: '+260', flag: '🇿🇲', iso: 'zm' },
];

const PreferencesPage = ({ userType = 'photographer' }: PreferencesPageProps) => {
  const { theme, setTheme, actualTheme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'payments' | 'notifications' | 'security'>('appearance');
  const { user, updateUser } = useDashboardAuth();
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentType, setPaymentType] = useState<'mtn' | 'airtel' | 'bank'>('mtn');

  // Form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [countryCode, setCountryCode] = useState('+250');
  const [countryFlag, setCountryFlag] = useState('🇷🇼');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Bank transfer states
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankProviders, setBankProviders] = useState<{ id: string; name: string }[]>([]);
  const [mobileProviders, setMobileProviders] = useState<{ id: string; name: string }[]>([]);

  // Account validation states
  const [isValidating, setIsValidating] = useState(false);
  const [validatedName, setValidatedName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showNameMismatch, setShowNameMismatch] = useState(false);
  const [xentriPayName, setXentriPayName] = useState('');
  const [enteredNameForMismatch, setEnteredNameForMismatch] = useState('');
  const [pendingSaveData, setPendingSaveData] = useState<{
    methodType: string; accountName: string; accountNumber: string; bankName: string;
  } | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [isSavingPreference, setIsSavingPreference] = useState(false);

  // Withdrawal verification method
  const [withdrawalVerificationMethod, setWithdrawalVerificationMethod] = useState(
    user?.preferredWithdrawalVerification || 'EMAIL_OTP'
  );
  const [isSavingVerificationMethod, setIsSavingVerificationMethod] = useState(false);
  const [verificationMethodMessage, setVerificationMethodMessage] = useState('');

  // Two-factor authentication states
  const [totpEnabled, setTotpEnabled] = useState(user?.twoFactorEnabled || false);
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpStep, setTotpStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpMessage, setTotpMessage] = useState('');
  const [totpMessageType, setTotpMessageType] = useState<'success' | 'error'>('success');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCode, setDisableCode] = useState(['', '', '', '', '', '']);
  const totpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const disableInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Notification settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  // Role-specific notification toggles
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [tipsAndBonuses, setTipsAndBonuses] = useState(true);
  const [albumNotifications, setAlbumNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [giftNotifications, setGiftNotifications] = useState(true);
  const [streamFeeNotifications, setStreamFeeNotifications] = useState(true);

  // Resolve the preferences API base path based on user role
  const preferencesBasePath = userType === 'event-coordinator'
    ? '/api/remote/coordinator/preferences'
    : userType === 'photographer'
      ? '/api/remote/photographer/preferences'
      : '/api/remote/customer/preferences';

  // Load saved preferences from API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await dashboardAuthFetch(`${apiUrl}${preferencesBasePath}`);
        if (!response.ok) return;
        const result = await response.json();
        const prefs = result?.data || {};

        // Apply theme preference if saved
        if (prefs.theme && ['light', 'dark', 'system'].includes(prefs.theme)) {
          setTheme(prefs.theme as ThemeMode);
        }

        // Load withdrawal methods from API
        const wmBasePath = userType === 'event-coordinator'
          ? '/api/remote/customer/withdrawal-methods'
          : userType === 'photographer'
            ? '/api/remote/photographer/withdrawal-methods'
            : '/api/remote/customer/withdrawal-methods';
        try {
          const wmRes = await dashboardAuthFetch(`${apiUrl}${wmBasePath}`);
          if (wmRes.ok) {
            const wmResult = await wmRes.json();
            const methods = (wmResult?.data || []).map((m: any) => {
              const mt = (m.methodType || '').toUpperCase();
              const bn = (m.bankName || '').toLowerCase();
              const isAirtel = bn.includes('airtel');
              return {
                id: m.id,
                type: mt === 'BANK_TRANSFER' ? 'bank' : 'mobile',
                methodType: m.methodType,
                name: mt === 'BANK_TRANSFER' ? (m.bankName || 'Bank Transfer') : (isAirtel ? 'Airtel Money' : 'MTN Mobile Money'),
                details: m.accountNumber || '',
                isDefault: m.isDefault || false,
                bankName: m.bankName,
                accountName: m.accountName,
              } as PaymentMethod;
            });
            setPaymentMethods(methods);
          }
        } catch (e) {
          console.error('Failed to load withdrawal methods:', e);
        }

        // Load notification preferences
        if (prefs.email_notifications !== undefined) setEmailNotifications(prefs.email_notifications === 'true');
        if (prefs.push_notifications !== undefined) setPushNotifications(prefs.push_notifications === 'true');
        if (prefs.security_alerts !== undefined) setSecurityAlerts(prefs.security_alerts === 'true');
        if (prefs.payment_notifications !== undefined) setPaymentNotifications(prefs.payment_notifications === 'true');
        if (prefs.tips_and_bonuses !== undefined) setTipsAndBonuses(prefs.tips_and_bonuses === 'true');
        if (prefs.album_notifications !== undefined) setAlbumNotifications(prefs.album_notifications === 'true');
        if (prefs.booking_notifications !== undefined) setBookingNotifications(prefs.booking_notifications === 'true');
        if (prefs.gift_notifications !== undefined) setGiftNotifications(prefs.gift_notifications === 'true');
        if (prefs.stream_fee_notifications !== undefined) setStreamFeeNotifications(prefs.stream_fee_notifications === 'true');

        // (payment methods are loaded from withdrawal-methods API above)
      } catch (err) {
        console.error('Failed to load preferences:', err);
      }
    };
    loadPreferences();
  }, [userType, setTheme, preferencesBasePath]);

  // Save a preference to the API (PUT /preferences/{key})
  const savePreference = useCallback(async (key: string, value: string) => {
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}${preferencesBasePath}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const result: ApiResponse = await response.json();
      if (!response.ok || result.action !== 1) {
        console.error(`Failed to save preference "${key}":`, result.message);
      }
    } catch (err) {
      console.error(`Error saving preference "${key}":`, err);
    }
  }, [userType, preferencesBasePath]);

  // Delete a preference from the API (DELETE /preferences/{key})
  const deletePreference = useCallback(async (key: string) => {
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}${preferencesBasePath}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const result: ApiResponse = await response.json();
      if (!response.ok || result.action !== 1) {
        console.error(`Failed to delete preference "${key}":`, result.message);
      }
    } catch (err) {
      console.error(`Error deleting preference "${key}":`, err);
    }
  }, [userType, preferencesBasePath]);

  // Save withdrawal verification method
  const saveVerificationMethod = useCallback(async (method: string) => {
    setIsSavingVerificationMethod(true);
    setVerificationMethodMessage('');
    try {
      const apiUrl = getApiUrl();
      const basePath = userType === 'event-coordinator'
        ? '/api/remote/coordinator/withdrawal-verification-method'
        : '/api/remote/customer/withdrawal-verification-method';
      const response = await dashboardAuthFetch(`${apiUrl}${basePath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const result: ApiResponse = await response.json();
      if (response.ok && result.action === 1) {
        setWithdrawalVerificationMethod(method);
        updateUser({ preferredWithdrawalVerification: method });
        setVerificationMethodMessage('Verification method updated successfully');
      } else {
        setVerificationMethodMessage(result.message || 'Failed to update verification method');
        // Revert selection
        setWithdrawalVerificationMethod(user?.preferredWithdrawalVerification || 'EMAIL_OTP');
      }
    } catch (err) {
      console.error('Failed to save verification method:', err);
      setVerificationMethodMessage('Failed to update verification method');
      setWithdrawalVerificationMethod(user?.preferredWithdrawalVerification || 'EMAIL_OTP');
    } finally {
      setIsSavingVerificationMethod(false);
      setTimeout(() => setVerificationMethodMessage(''), 4000);
    }
  }, [userType, user, updateUser]);

  // Load TOTP status when security tab is active
  useEffect(() => {
    if (activeTab !== 'security') return;
    const fetchTotpStatus = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/totp/status`);
        if (!response.ok) return;
        const result = await response.json();
        if (result.action === 1) {
          setTotpEnabled(result.twoFactorEnabled);
          setTotpRequired(result.twoFactorRequired);
        }
      } catch { /* silent */ }
    };
    fetchTotpStatus();
  }, [activeTab]);

  // Auto-start setup if redirected with setup2fa flag
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup2fa') === 'true' && !totpEnabled && totpStep === 'idle') {
      handleTotpSetup();
    }
  }, [totpEnabled, totpRequired]);

  const handleTotpSetup = useCallback(async () => {
    setTotpLoading(true);
    setTotpMessage('');
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/totp/setup`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.action === 1) {
        setTotpQrCode(result.qrCode);
        setTotpSecret(result.secret);
        setTotpStep('setup');
        setTotpCode(['', '', '', '', '', '']);
      } else {
        setTotpMessage(result.message || 'Failed to start setup');
        setTotpMessageType('error');
      }
    } catch {
      setTotpMessage('Failed to start setup');
      setTotpMessageType('error');
    } finally {
      setTotpLoading(false);
    }
  }, []);

  const handleTotpEnable = useCallback(async () => {
    const code = totpCode.join('');
    if (code.length !== 6) return;
    setTotpLoading(true);
    setTotpMessage('');
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/totp/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (result.action === 1) {
        setTotpEnabled(true);
        setTotpStep('idle');
        setTotpMessage('Two-factor authentication enabled successfully');
        setTotpMessageType('success');
        updateUser({ twoFactorEnabled: true });
      } else {
        setTotpMessage(result.message || 'Invalid code');
        setTotpMessageType('error');
      }
    } catch {
      setTotpMessage('Failed to enable 2FA');
      setTotpMessageType('error');
    } finally {
      setTotpLoading(false);
      setTimeout(() => setTotpMessage(''), 5000);
    }
  }, [totpCode, updateUser]);

  const handleTotpDisable = useCallback(async () => {
    const code = disableCode.join('');
    if (code.length !== 6) return;
    setTotpLoading(true);
    setTotpMessage('');
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/totp/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (result.action === 1) {
        setTotpEnabled(false);
        setShowDisableConfirm(false);
        setDisableCode(['', '', '', '', '', '']);
        setTotpMessage('Two-factor authentication disabled');
        setTotpMessageType('success');
        updateUser({ twoFactorEnabled: false });
      } else {
        setTotpMessage(result.message || 'Failed to disable');
        setTotpMessageType('error');
      }
    } catch {
      setTotpMessage('Failed to disable 2FA');
      setTotpMessageType('error');
    } finally {
      setTotpLoading(false);
      setTimeout(() => setTotpMessage(''), 5000);
    }
  }, [disableCode, updateUser]);

  const handleTotpCodeChange = (index: number, value: string, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value && !/^\d$/.test(value)) return;
    setter(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (e.key === 'Backspace') {
      setter(prev => {
        if (!prev[index] && index > 0) {
          refs.current[index - 1]?.focus();
          return prev;
        }
        const next = [...prev];
        next[index] = '';
        return next;
      });
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleTotpPaste = (e: React.ClipboardEvent, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      setter(pasted.split('').concat(Array(6 - pasted.length).fill('')));
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Load bank providers when modal opens
  useEffect(() => {
    if (!showAddPaymentModal) return;
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/withdrawals/xentripay/providers`)
      .then(res => res.json())
      .then(result => {
        const banks = result?.data?.banks || [];
        const mobile = result?.data?.mobileMoney || [];
        setBankProviders(banks);
        setMobileProviders(mobile);
      })
      .catch(() => setBankProviders([]));
  }, [showAddPaymentModal]);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; description: string }[] = [
    { mode: 'light', label: 'Light', icon: <SunIcon />, description: 'Classic light theme for daytime use' },
    { mode: 'dark', label: 'Dark', icon: <MoonIcon />, description: 'Easy on the eyes in low light' },
    { mode: 'system', label: 'System', icon: <SystemIcon />, description: 'Automatically match your device settings' }
  ];

  const withdrawalMethodBasePath = userType === 'event-coordinator'
    ? '/api/remote/customer/withdrawal-methods'
    : userType === 'photographer'
      ? '/api/remote/photographer/withdrawal-methods'
      : '/api/remote/customer/withdrawal-methods';

  const handleSetDefault = async (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (!method) return;
    try {
      const apiUrl = getApiUrl();
      await dashboardAuthFetch(`${apiUrl}${withdrawalMethodBasePath}/${id}?methodType=${encodeURIComponent(method.methodType)}&accountName=${encodeURIComponent(method.accountName || method.name)}&accountNumber=${encodeURIComponent(method.details)}&bankName=${encodeURIComponent(method.bankName || '')}&isDefault=true`, {
        method: 'PUT',
      });
      setPaymentMethods(methods =>
        methods.map(m => ({ ...m, isDefault: m.id === id }))
      );
    } catch (err) {
      console.error('Failed to set default method:', err);
    }
  };

  const handleDeletePayment = async () => {
    if (selectedPayment) {
      try {
        const apiUrl = getApiUrl();
        await dashboardAuthFetch(`${apiUrl}${withdrawalMethodBasePath}/${selectedPayment.id}`, {
          method: 'DELETE',
        });
        setPaymentMethods(methods => methods.filter(m => m.id !== selectedPayment.id));
      } catch (err) {
        console.error('Failed to delete withdrawal method:', err);
      }
      setShowDeleteModal(false);
      setSelectedPayment(null);
    }
  };

  const resetForm = () => {
    setMobileNumber('');
    setAccountHolderName('');
    setCountryCode('+250');
    setCountryFlag('🇷🇼');
    setShowCountryDropdown(false);
    setCountrySearch('');
    setBankAccountNumber('');
    setBankAccountName('');
    setSelectedBank('');
    setPaymentType('mtn');
    setValidatedName('');
    setValidationError('');
    setShowNameMismatch(false);
    setXentriPayName('');
    setEnteredNameForMismatch('');
    setPendingSaveData(null);
  };

  const saveWithdrawalMethod = async (methodType: string, accountName: string, accountNumber: string, bankName: string) => {
    const apiUrl = getApiUrl();
    const isDefault = paymentMethods.length === 0;
    const params = new URLSearchParams({
      methodType,
      accountName,
      accountNumber,
      bankName,
      isDefault: String(isDefault),
    });

    const res = await dashboardAuthFetch(`${apiUrl}${withdrawalMethodBasePath}?${params.toString()}`, {
      method: 'POST',
    });
    const result = await res.json();

    if (res.ok && result.action === 1) {
      const m = result.data;
      const bn = (m.bankName || '').toLowerCase();
      const isAirtel = bn.includes('airtel');
      const newMethod: PaymentMethod = {
        id: m.id,
        type: methodType === 'BANK_TRANSFER' ? 'bank' : 'mobile',
        methodType: m.methodType,
        name: methodType === 'BANK_TRANSFER' ? (m.bankName || 'Bank Transfer') : (isAirtel ? 'Airtel Money' : 'MTN Mobile Money'),
        details: m.accountNumber || '',
        isDefault: m.isDefault || false,
        bankName: m.bankName,
        accountName: m.accountName,
      };
      setPaymentMethods([...paymentMethods, newMethod]);
    }
  };

  const handleConfirmMismatchName = async () => {
    if (!pendingSaveData) return;
    setIsSavingPreference(true);
    setShowNameMismatch(false);
    try {
      await saveWithdrawalMethod(pendingSaveData.methodType, pendingSaveData.accountName, pendingSaveData.accountNumber, pendingSaveData.bankName);
    } catch (err) {
      console.error('Failed to save withdrawal method:', err);
      setValidationError('Something went wrong. Please try again.');
    }
    setShowAddPaymentModal(false);
    setIsSavingPreference(false);
    setPendingSaveData(null);
    resetForm();
  };

  const handleCancelMismatch = () => {
    setShowNameMismatch(false);
    setPendingSaveData(null);
    setIsSavingPreference(false);
  };

  const handleAddPayment = async () => {
    setIsSavingPreference(true);
    setValidationError('');
    setShowNameMismatch(false);
    try {
      let methodType: string;
      let accountName: string;
      let accountNumber: string;
      let bankName: string;
      let bankId: string;

      if (paymentType === 'bank') {
        methodType = 'BANK_TRANSFER';
        accountName = bankAccountName;
        accountNumber = bankAccountNumber;
        bankName = selectedBank;
        const provider = bankProviders.find(b => b.name === selectedBank);
        bankId = provider?.id || '';
      } else if (paymentType === 'mtn') {
        methodType = 'MOBILE_MONEY';
        accountName = accountHolderName || 'MTN Mobile Money';
        accountNumber = mobileNumber ? `${countryCode}${mobileNumber.replace(/\s/g, '')}` : '';
        bankName = 'MTN Mobile Money';
        const provider = mobileProviders.find(p => p.name.toLowerCase().includes('mtn'));
        bankId = provider?.id || '63510';
      } else {
        methodType = 'MOBILE_MONEY';
        accountName = accountHolderName || 'Airtel Money';
        accountNumber = mobileNumber ? `${countryCode}${mobileNumber.replace(/\s/g, '')}` : '';
        bankName = 'Airtel Rwanda';
        const provider = mobileProviders.find(p => p.name.toLowerCase().includes('airtel'));
        bankId = provider?.id || '63514';
      }

      if (!accountNumber) {
        setValidationError('Please enter an account number.');
        setIsSavingPreference(false);
        return;
      }

      // Determine if this is mobile money (needs validation) or bank (skip validation)
      const isMobileMoney = methodType === 'MOBILE_MONEY';

      let nameToSave: string;

      if (!isMobileMoney) {
        // Bank transfer - skip validation, use entered name
        console.log('Skipping validation for bank transfer');
        nameToSave = accountName || bankAccountName || '';

        if (!nameToSave.trim()) {
          setValidationError('Please enter the account holder name.');
          setIsSavingPreference(false);
          return;
        }
      } else {
        // Mobile money - validate with XentriPay
        console.log('Validating mobile money account');
        setIsValidating(true);
        const validation = await validateAccountDetails(accountNumber, bankId);
        setIsValidating(false);

        if (!validation.valid) {
          setValidationError(validation.error || 'Account validation failed. Please check the account number.');
          setIsSavingPreference(false);
          return;
        }

        const registeredName = validation.registeredName || '';

        // Compare entered name with XentriPay registered name
        const enteredNorm = accountName.trim().toLowerCase();
        const xentriNorm = registeredName.trim().toLowerCase();

        if (!registeredName) {
          nameToSave = accountName;
        } else if (!accountName.trim() || enteredNorm === xentriNorm) {
          nameToSave = registeredName;
        } else {
          // Names don't match — show confirmation dialog
          setXentriPayName(registeredName);
          setEnteredNameForMismatch(accountName);
          setShowNameMismatch(true);
          setPendingSaveData({ methodType, accountName: registeredName, accountNumber, bankName });
          setIsSavingPreference(false);
          return;
        }
      }

      setValidatedName(nameToSave);
      await saveWithdrawalMethod(methodType, nameToSave, accountNumber, bankName);
    } catch (err) {
      console.error('Failed to add withdrawal method:', err);
      setValidationError('Something went wrong. Please try again.');
    }
    setShowAddPaymentModal(false);
    setIsSavingPreference(false);
    resetForm();
  };

  const getPaymentIcon = (type: 'mobile' | 'bank') => {
    switch (type) {
      case 'bank': return <CreditCardIcon />;
      case 'mobile': return <MobileIcon />;
    }
  };

  const getPaymentImage = (type: 'mobile' | 'bank', provider?: string) => {
    if (type === 'mobile') {
      if (provider?.toLowerCase().includes('mtn')) return '/mtn.png';
      if (provider?.toLowerCase().includes('airtel')) return '/airtel.png';
      return '/mtn.png';
    }
    return null; // bank uses icon, not image
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-pref-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
            overflow-x: hidden !important;
          }
          .mobile-pref-title {
            font-size: 1.4rem !important;
          }
          .mobile-pref-subtitle {
            font-size: 0.85rem !important;
          }
          .mobile-pref-tabs {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            padding-right: 0.5rem !important;
          }
          .mobile-pref-tabs::-webkit-scrollbar {
            display: none !important;
          }
          .mobile-pref-tabs button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            min-height: 40px !important;
            font-size: 0.8rem !important;
            padding: 0.4rem 0.625rem !important;
            gap: 0.25rem !important;
          }
          .mobile-pref-tabs button i {
            font-size: 0.85rem !important;
          }
          .mobile-theme-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mobile-pref-card {
            padding: 1rem !important;
            border-radius: 0.75rem !important;
          }
          .mobile-pref-card h2 {
            font-size: 1.1rem !important;
          }
          .mobile-payment-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .mobile-payment-actions {
            width: 100% !important;
            justify-content: flex-end !important;
          }
          .mobile-payment-actions button {
            min-height: 40px !important;
          }
          .mobile-notif-container > div > div > div {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .mobile-notif-container button {
            flex-shrink: 0 !important;
          }
          .mobile-modal-inner {
            margin: 0.5rem !important;
            margin-bottom: 4rem !important;
            padding: 1rem !important;
            padding-bottom: 1.5rem !important;
            max-height: calc(100vh - 8rem) !important;
            width: calc(100% - 1rem) !important;
            max-width: none !important;
          }
          .mobile-modal-inner h2 {
            font-size: 1.05rem !important;
          }
          .mobile-modal-inner input,
          .mobile-modal-inner select {
            min-height: 44px !important;
            font-size: 0.9rem !important;
          }
          .mobile-payment-option {
            gap: 0.625rem !important;
            padding: 0.625rem !important;
          }
          .mobile-payment-option-icon {
            width: 36px !important;
            height: 36px !important;
          }
          .mobile-payment-option-label {
            font-size: 0.85rem !important;
          }
          .mobile-payment-option-desc {
            font-size: 0.7rem !important;
          }
          .mobile-payment-option-radio {
            width: 16px !important;
            height: 16px !important;
          }
          .mobile-modal-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .mobile-modal-footer {
            flex-direction: column !important;
            gap: 0.5rem !important;
            margin-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
          .mobile-modal-footer button {
            width: 100% !important;
            min-height: 44px !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-pref-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-pref-title {
            font-size: 1.2rem !important;
          }
          .mobile-pref-tabs button {
            font-size: 0.75rem !important;
            padding: 0.375rem 0.5rem !important;
          }
        }
        @media (max-width: 375px) {
          .mobile-pref-content {
            padding: 0.5rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-pref-title {
            font-size: 1.1rem !important;
          }
          .mobile-pref-tabs button {
            font-size: 0.7rem !important;
            padding: 0.325rem 0.4rem !important;
          }
          .mobile-pref-tabs button i {
            display: none !important;
          }
        }
      `}</style>
      {/* Handle URL params for tab selection */}
      <Suspense fallback={null}>
        <TabParamHandler setActiveTab={setActiveTab} setShowAddPaymentModal={setShowAddPaymentModal} />
      </Suspense>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userType} />
        <div className="mobile-pref-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* Header */}
          <header style={{ marginBottom: 22 }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#F20C8F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>Settings</div>
            <h1 className="mobile-pref-title" style={{
              margin: 0,
              fontSize: '1.85rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: colors.textPrimary,
            }}>Preferences</h1>
            <p className="mobile-pref-subtitle" style={{
              margin: '4px 0 0',
              fontSize: '0.92rem',
              color: colors.textSecondary,
            }}>
              Customize your dashboard experience and manage payment settings.
            </p>
          </header>

          {/* Tabs — segmented pill control */}
          <div role="tablist" aria-label="Preferences sections" className="mobile-pref-tabs" style={{
            display: 'inline-flex',
            gap: 4,
            background: 'var(--ck-surface)',
            border: '1px solid var(--ck-stroke)',
            padding: 4,
            borderRadius: 12,
            marginBottom: 22,
            boxShadow: 'var(--ck-shadow-sm)',
            flexWrap: 'wrap',
          }}>
            {[
              { key: 'appearance' as const, label: 'Appearance', icon: 'bi-palette-fill' },
              { key: 'payments' as const, label: 'Payment accounts', icon: 'bi-wallet2' },
              { key: 'notifications' as const, label: 'Notifications', icon: 'bi-bell-fill' },
              { key: 'security' as const, label: 'Security', icon: 'bi-shield-lock-fill' },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  aria-selected={active}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: active ? 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--ck-text-soft)',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    cursor: 'pointer',
                    transition: 'background 200ms ease, color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
                    boxShadow: active ? '0 4px 12px rgba(8, 58, 133, 0.30)' : 'none',
                    whiteSpace: 'nowrap',
                    transform: active ? 'translateY(-1px)' : 'translateY(0)',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className={`bi ${tab.icon}`} style={{ fontSize: 14 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="mobile-pref-card ck-card" style={{
              padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(8,58,133,0.08)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-palette-fill" style={{ color: 'var(--ck-blue)', fontSize: 16 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    letterSpacing: '-0.005em',
                    color: 'var(--ck-text)',
                  }}>Theme mode</h2>
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '0.88rem',
                    color: 'var(--ck-text-soft)',
                    lineHeight: 1.4,
                  }}>
                    Choose how the dashboard looks to you. Select a single theme, or sync with your system settings.
                  </p>
                </div>
              </div>

              <div className="mobile-theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 520 }}>
                {themeOptions.map((option) => (
                  <button
                    key={option.mode}
                    onClick={() => {
                      setTheme(option.mode);
                      savePreference('theme', option.mode);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: theme === option.mode ? 'var(--ck-blue)' : 'var(--ck-stroke)',
                      background: theme === option.mode
                        ? 'rgba(8, 58, 133, 0.05)'
                        : 'var(--ck-surface)',
                      cursor: 'pointer',
                      transition: 'all 180ms var(--ck-ease)',
                      position: 'relative',
                      boxShadow: theme === option.mode ? '0 0 0 3px rgba(8,58,133,0.10)' : 'none',
                    }}
                  >
                    {/* Preview */}
                    <div style={{
                      width: '100%',
                      height: '56px',
                      borderRadius: '0.5rem',
                      backgroundColor: option.mode === 'dark' ? '#1F2937' : option.mode === 'light' ? '#F9FAFB' : (actualTheme === 'dark' ? '#1F2937' : '#F9FAFB'),
                      border: `1px solid ${option.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                      display: 'flex',
                      overflow: 'hidden'
                    }}>
                      {/* Mini sidebar preview */}
                      <div style={{
                        width: '24px',
                        backgroundColor: option.mode === 'dark' ? '#374151' : '#f5f5f5',
                        borderRight: `1px solid ${option.mode === 'dark' ? '#4B5563' : '#E5E7EB'}`
                      }} />
                      {/* Mini content preview */}
                      <div style={{ flex: 1, padding: '0.5rem' }}>
                        <div style={{
                          width: '60%',
                          height: '8px',
                          backgroundColor: option.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                          borderRadius: '2px',
                          marginBottom: '0.375rem'
                        }} />
                        <div style={{
                          width: '40%',
                          height: '6px',
                          backgroundColor: option.mode === 'dark' ? '#374151' : '#E5E7EB',
                          borderRadius: '2px',
                          marginBottom: '0.5rem'
                        }} />
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <div style={{
                            width: '30%',
                            height: '20px',
                            backgroundColor: option.mode === 'dark' ? '#374151' : '#FFFFFF',
                            borderRadius: '2px',
                            border: `1px solid ${option.mode === 'dark' ? '#4B5563' : '#E5E7EB'}`
                          }} />
                          <div style={{
                            width: '30%',
                            height: '20px',
                            backgroundColor: option.mode === 'dark' ? '#374151' : '#FFFFFF',
                            borderRadius: '2px',
                            border: `1px solid ${option.mode === 'dark' ? '#4B5563' : '#E5E7EB'}`
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Icon and label */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: theme === option.mode ? colors.brandPrimary : colors.textPrimary
                    }}>
                      {option.icon}
                      <span style={{ fontWeight: '600' }}>{option.label}</span>
                    </div>

                    <p style={{
                      fontSize: '0.7rem',
                      color: colors.textSecondary,
                      margin: 0,
                      textAlign: 'center'
                    }}>
                      {option.description}
                    </p>

                    {/* Selected indicator */}
                    {theme === option.mode && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: colors.brandPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <CheckIcon />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Current theme info */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: colors.bgTertiary,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  backgroundColor: colors.brandPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {actualTheme === 'dark' ? <MoonIcon /> : <SunIcon />}
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                    Currently using {actualTheme === 'dark' ? 'Dark' : 'Light'} mode
                  </p>
                  <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: '0.125rem 0 0 0' }}>
                    {theme === 'system'
                      ? 'Synced with your device\'s system preferences'
                      : `You've selected ${theme} mode manually`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              {/* Add Payment Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    backgroundColor: colors.brandPrimary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <PlusIcon />
                  Add Payment Account
                </button>
              </div>

              {/* Payment Methods List */}
              <div style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: '1rem',
                boxShadow: colors.shadowMd,
                border: `2px solid ${colors.borderPrimary}`,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '1.25rem',
                  borderBottom: `2px solid ${colors.borderPrimary}`
                }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                    Saved Payment Accounts
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>
                    Manage your accounts for payments and withdrawals
                  </p>
                </div>

                {paymentMethods.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: colors.bgTertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem auto',
                      color: colors.textTertiary
                    }}>
                      <CreditCardIcon />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                      No payment accounts saved
                    </p>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>
                      Add a mobile money or bank account to get started
                    </p>
                  </div>
                ) : (
                  <div>
                    {paymentMethods.map((method, index) => (
                      <div
                        key={method.id}
                        className="mobile-payment-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          borderBottom: index < paymentMethods.length - 1 ? `2px solid ${colors.borderPrimary}` : 'none',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
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
                            {method.type === 'bank' ? (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : getPaymentImage(method.type, method.name) ? (
                              <Image
                                src={getPaymentImage(method.type, method.name)!}
                                alt={method.name}
                                width={48}
                                height={48}
                                unoptimized
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                              />
                            ) : (
                              <MobileIcon />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                                {method.name}
                              </span>
                              {method.isDefault && (
                                <span style={{
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: colors.statusSuccessBg,
                                  color: colors.statusSuccess,
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  borderRadius: '9999px'
                                }}>
                                  Default
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.125rem 0 0 0' }}>
                              {method.details}
                              {method.accountName && ` • ${method.accountName}`}
                            </p>
                          </div>
                        </div>

                        <div className="mobile-payment-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {!method.isDefault && (
                            <button
                              onClick={() => handleSetDefault(method.id)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                backgroundColor: 'transparent',
                                color: colors.brandPrimary,
                                border: `1px solid ${colors.brandPrimary}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPayment(method);
                              setShowEditPaymentModal(true);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.bgTertiary,
                              color: colors.textSecondary,
                              border: `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(method);
                              setShowDeleteModal(true);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.statusErrorBg,
                              color: colors.statusError,
                              border: `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FCA5A5'}`,
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="mobile-pref-card mobile-notif-container" style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: colors.shadowMd,
              border: `2px solid ${colors.borderPrimary}`
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                Notification Settings
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem 0' }}>
                Choose which notifications you want to receive and how you want to be notified
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Email Notifications */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                      Email Notifications
                    </div>
                    <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                      Receive email alerts for important notifications
                    </div>
                  </div>
                  <button
                    onClick={() => { setEmailNotifications(!emailNotifications); savePreference('email_notifications', String(!emailNotifications)); }}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '13px',
                      border: 'none',
                      backgroundColor: emailNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: emailNotifications ? '25px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                {/* Push Notifications */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                      Push Notifications
                    </div>
                    <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                      Get instant push notifications on your device
                    </div>
                  </div>
                  <button
                    onClick={() => { setPushNotifications(!pushNotifications); savePreference('push_notifications', String(!pushNotifications)); }}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '13px',
                      border: 'none',
                      backgroundColor: pushNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: pushNotifications ? '25px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                {/* Divider */}
                <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.5rem 0' }} />

                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.25rem 0' }}>
                  Notification Categories
                </p>

                {/* Role-specific: Photographer - Payment Notifications */}
                {userType === 'photographer' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        Payment Notifications
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Notify me when I receive payments
                      </div>
                    </div>
                    <button
                      onClick={() => { setPaymentNotifications(!paymentNotifications); savePreference('payment_notifications', String(!paymentNotifications)); }}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: paymentNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: paymentNotifications ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                )}

                {/* Role-specific: Photographer - Tips & Bonuses */}
                {userType === 'photographer' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        Tips & Bonuses
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Notify me when I receive tips or bonuses
                      </div>
                    </div>
                    <button
                      onClick={() => { setTipsAndBonuses(!tipsAndBonuses); savePreference('tips_and_bonuses', String(!tipsAndBonuses)); }}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: tipsAndBonuses ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: tipsAndBonuses ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                )}

                {/* Role-specific: Client/Coordinator - Album Notifications */}
                {(userType === 'client' || userType === 'event-coordinator') && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        Album Notifications
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Notify me when new albums are shared or updated
                      </div>
                    </div>
                    <button
                      onClick={() => { setAlbumNotifications(!albumNotifications); savePreference('album_notifications', String(!albumNotifications)); }}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: albumNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: albumNotifications ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                )}

                {/* Role-specific: Client/Coordinator - Booking Notifications */}
                {(userType === 'client' || userType === 'event-coordinator') && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        Booking Notifications
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Notify me about booking updates and confirmations
                      </div>
                    </div>
                    <button
                      onClick={() => { setBookingNotifications(!bookingNotifications); savePreference('booking_notifications', String(!bookingNotifications)); }}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: bookingNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: bookingNotifications ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                )}

                {/* Role-specific: Client - Gift Notifications */}
                {userType === 'client' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        Gift Notifications
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Notify me when I receive gifts
                      </div>
                    </div>
                    <button
                      onClick={() => { setGiftNotifications(!giftNotifications); savePreference('gift_notifications', String(!giftNotifications)); }}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: giftNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: giftNotifications ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                )}

                {/* Role-specific: Coordinator - Stream Fee Notifications */}
                {userType === 'event-coordinator' && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        Stream Fee Notifications
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                        Notify me when I receive live stream access fee revenue
                      </div>
                    </div>
                    <button
                      onClick={() => { setStreamFeeNotifications(!streamFeeNotifications); savePreference('stream_fee_notifications', String(!streamFeeNotifications)); }}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        backgroundColor: streamFeeNotifications ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        flexShrink: 0
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: streamFeeNotifications ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  </div>
                )}

                {/* Security Alerts - all roles */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                      Security Alerts
                    </div>
                    <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                      Always notify me about security events (recommended)
                    </div>
                  </div>
                  <button
                    onClick={() => { setSecurityAlerts(!securityAlerts); savePreference('security_alerts', String(!securityAlerts)); }}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '13px',
                      border: 'none',
                      backgroundColor: securityAlerts ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.3s',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: securityAlerts ? '25px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
            {/* Two-Factor Authentication Card */}
            <div className="mobile-pref-card" style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: colors.shadowMd,
              border: `2px solid ${colors.borderPrimary}`,
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                  Two-Factor Authentication
                </h2>
                {totpEnabled && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: '600', color: '#166534',
                    backgroundColor: '#DCFCE7', padding: '0.25rem 0.75rem',
                    borderRadius: '1rem', border: '1px solid #BBF7D0',
                  }}>Enabled</span>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                Add an extra layer of security by requiring a code from your authenticator app when signing in.
              </p>

              {/* Mandatory banner */}
              {totpRequired && !totpEnabled && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                  backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                }}>
                  <i className="bi bi-exclamation-triangle" style={{ color: '#92400E', fontSize: '1rem', marginTop: '0.1rem' }} />
                  <p style={{ fontSize: '0.85rem', color: '#92400E', margin: 0, lineHeight: '1.5' }}>
                    Two-factor authentication is required for accounts with a balance. Please set it up to continue using your dashboard.
                  </p>
                </div>
              )}

              {/* Status message */}
              {totpMessage && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                  fontSize: '0.85rem',
                  backgroundColor: totpMessageType === 'success' ? '#DCFCE7' : '#FEE2E2',
                  color: totpMessageType === 'success' ? '#166534' : '#991B1B',
                  border: `1px solid ${totpMessageType === 'success' ? '#BBF7D0' : '#FECACA'}`,
                }}>
                  {totpMessage}
                </div>
              )}

              {/* Idle state: show enable or disable button */}
              {totpStep === 'idle' && !totpEnabled && (
                <button
                  onClick={handleTotpSetup}
                  disabled={totpLoading}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                    backgroundColor: '#083A85', color: 'white', border: 'none',
                    fontWeight: '600', fontSize: '0.9rem', cursor: totpLoading ? 'not-allowed' : 'pointer',
                    opacity: totpLoading ? 0.7 : 1, transition: 'all 0.2s',
                  }}
                >
                  {totpLoading ? 'Setting up...' : totpRequired ? 'Set Up Now' : 'Enable 2FA'}
                </button>
              )}

              {/* Enabled state: show disable button */}
              {totpStep === 'idle' && totpEnabled && !showDisableConfirm && (
                <button
                  onClick={() => { if (!totpRequired) { setShowDisableConfirm(true); setDisableCode(['', '', '', '', '', '']); } }}
                  disabled={totpRequired}
                  title={totpRequired ? 'Cannot disable while your account has a balance' : ''}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                    backgroundColor: 'transparent', color: totpRequired ? colors.textSecondary : '#DC2626',
                    border: `1px solid ${totpRequired ? colors.borderPrimary : '#DC2626'}`,
                    fontWeight: '600', fontSize: '0.9rem',
                    cursor: totpRequired ? 'not-allowed' : 'pointer',
                    opacity: totpRequired ? 0.5 : 1, transition: 'all 0.2s',
                  }}
                >
                  Disable 2FA
                </button>
              )}

              {/* Disable confirmation: enter TOTP code to disable */}
              {showDisableConfirm && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
                    Enter a code from your authenticator app to disable 2FA:
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                    {disableCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { disableInputRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleTotpCodeChange(i, e.target.value, disableInputRefs, setDisableCode)}
                        onKeyDown={e => handleTotpKeyDown(i, e, disableInputRefs, setDisableCode)}
                        onPaste={e => handleTotpPaste(e, disableInputRefs, setDisableCode)}
                        style={{
                          width: '44px', height: '50px', textAlign: 'center', fontSize: '1.25rem',
                          fontWeight: '700', borderRadius: '0.5rem',
                          border: `2px solid ${digit ? '#DC2626' : colors.borderPrimary}`,
                          backgroundColor: colors.bgTertiary, color: colors.textPrimary,
                          outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#DC2626'; }}
                        onBlur={e => { if (!digit) e.currentTarget.style.borderColor = colors.borderPrimary; }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleTotpDisable}
                      disabled={totpLoading || disableCode.some(d => !d)}
                      style={{
                        padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                        backgroundColor: '#DC2626', color: 'white', border: 'none',
                        fontWeight: '600', fontSize: '0.875rem',
                        cursor: (totpLoading || disableCode.some(d => !d)) ? 'not-allowed' : 'pointer',
                        opacity: (totpLoading || disableCode.some(d => !d)) ? 0.6 : 1,
                      }}
                    >
                      {totpLoading ? 'Disabling...' : 'Confirm Disable'}
                    </button>
                    <button
                      onClick={() => { setShowDisableConfirm(false); setDisableCode(['', '', '', '', '', '']); }}
                      style={{
                        padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                        backgroundColor: 'transparent', color: colors.textSecondary,
                        border: `1px solid ${colors.borderPrimary}`,
                        fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Setup step: show QR code */}
              {totpStep === 'setup' && (
                <div>
                  <div style={{
                    backgroundColor: actualTheme === 'dark' ? '#1F2937' : '#F9FAFB',
                    borderRadius: '0.75rem', padding: '1.5rem',
                    border: `1px solid ${colors.borderPrimary}`, textAlign: 'center',
                    marginBottom: '1.25rem',
                  }}>
                    <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    {totpQrCode && (
                      <div style={{ display: 'inline-block', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        <img src={totpQrCode} alt="TOTP QR Code" style={{ width: '200px', height: '200px' }} />
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.5rem' }}>
                        Or enter this key manually:
                      </p>
                      <div
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 1rem', backgroundColor: colors.bgTertiary,
                          borderRadius: '0.375rem', border: `1px solid ${colors.borderPrimary}`,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(totpSecret);
                          setTotpMessage('Secret copied to clipboard');
                          setTotpMessageType('success');
                          setTimeout(() => setTotpMessage(''), 2000);
                        }}
                      >
                        <code style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, letterSpacing: '0.05em' }}>
                          {totpSecret}
                        </code>
                        <i className="bi bi-clipboard" style={{ fontSize: '0.85rem', color: colors.textSecondary }} />
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: colors.textPrimary, fontWeight: '600', marginBottom: '0.75rem' }}>
                    Enter the 6-digit code from your app:
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                    {totpCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { totpInputRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleTotpCodeChange(i, e.target.value, totpInputRefs, setTotpCode)}
                        onKeyDown={e => handleTotpKeyDown(i, e, totpInputRefs, setTotpCode)}
                        onPaste={e => handleTotpPaste(e, totpInputRefs, setTotpCode)}
                        style={{
                          width: '44px', height: '50px', textAlign: 'center', fontSize: '1.25rem',
                          fontWeight: '700', borderRadius: '0.5rem',
                          border: `2px solid ${digit ? '#083A85' : colors.borderPrimary}`,
                          backgroundColor: colors.bgTertiary, color: colors.textPrimary,
                          outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }}
                        onBlur={e => { if (!digit) e.currentTarget.style.borderColor = colors.borderPrimary; }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleTotpEnable}
                      disabled={totpLoading || totpCode.some(d => !d)}
                      style={{
                        padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                        backgroundColor: '#083A85', color: 'white', border: 'none',
                        fontWeight: '600', fontSize: '0.9rem',
                        cursor: (totpLoading || totpCode.some(d => !d)) ? 'not-allowed' : 'pointer',
                        opacity: (totpLoading || totpCode.some(d => !d)) ? 0.6 : 1,
                      }}
                    >
                      {totpLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    {!totpRequired && (
                      <button
                        onClick={() => { setTotpStep('idle'); setTotpCode(['', '', '', '', '', '']); setTotpMessage(''); }}
                        style={{
                          padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                          backgroundColor: 'transparent', color: colors.textSecondary,
                          border: `1px solid ${colors.borderPrimary}`,
                          fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Withdrawal Verification Card */}
            <div className="mobile-pref-card" style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: colors.shadowMd,
              border: `2px solid ${colors.borderPrimary}`
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                Withdrawal Verification
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem 0' }}>
                Choose how to verify your identity before each withdrawal is processed.
              </p>

              {verificationMethodMessage && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  backgroundColor: verificationMethodMessage.includes('success') ? '#DCFCE7' : '#FEE2E2',
                  color: verificationMethodMessage.includes('success') ? '#166534' : '#991B1B',
                  border: `1px solid ${verificationMethodMessage.includes('success') ? '#BBF7D0' : '#FECACA'}`,
                }}>
                  {verificationMethodMessage}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {([
                  {
                    value: 'EMAIL_OTP',
                    label: 'Email OTP',
                    description: 'Receive a 6-digit code via email to verify each withdrawal',
                    icon: 'bi-envelope',
                    requiresKyc: false,
                  },
                  {
                    value: 'SMS_OTP',
                    label: 'SMS OTP',
                    description: 'Receive a 6-digit code via SMS to verify each withdrawal',
                    icon: 'bi-phone',
                    requiresKyc: false,
                  },
                  {
                    value: 'FACE_SCAN',
                    label: 'Face Scan',
                    description: 'Verify your identity with a live selfie compared to your KYC photo',
                    icon: 'bi-person-bounding-box',
                    requiresKyc: true,
                  },
                  {
                    value: 'FACE_SCAN_WITH_OTP',
                    label: 'Face Scan + OTP',
                    description: 'Maximum security: both face scan and OTP code required',
                    icon: 'bi-shield-check',
                    requiresKyc: true,
                  },
                ] as const).map((option) => {
                  const isSelected = withdrawalVerificationMethod === option.value;
                  const kycNotApproved = option.requiresKyc && user?.kycStatus !== 'APPROVED';
                  const isDisabled = isSavingVerificationMethod || kycNotApproved;

                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && saveVerificationMethod(option.value)}
                      disabled={isDisabled}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: isSelected
                          ? (actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.2)' : 'rgba(8, 58, 133, 0.05)')
                          : colors.bgTertiary,
                        borderRadius: '0.75rem',
                        border: `2px solid ${isSelected ? '#083A85' : colors.borderPrimary}`,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: kycNotApproved ? 0.5 : 1,
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        backgroundColor: isSelected ? '#083A85' : (actualTheme === 'dark' ? '#374151' : '#F3F4F6'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <i className={`bi ${option.icon}`} style={{
                          fontSize: '1.1rem',
                          color: isSelected ? 'white' : colors.textSecondary,
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: colors.textPrimary,
                          marginBottom: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}>
                          {option.label}
                          {isSelected && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              color: '#083A85',
                              backgroundColor: actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.3)' : 'rgba(8, 58, 133, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '1rem',
                            }}>Active</span>
                          )}
                          {isSavingVerificationMethod && isSelected && (
                            <div style={{
                              width: '14px', height: '14px',
                              border: '2px solid #E5E7EB', borderTopColor: '#083A85',
                              borderRadius: '50%', animation: 'spin 1s linear infinite',
                            }} />
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.4' }}>
                          {option.description}
                        </div>
                        {kycNotApproved && (
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#DC2626',
                            marginTop: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}>
                            <i className="bi bi-exclamation-circle" style={{ fontSize: '0.75rem' }} />
                            Requires approved KYC verification
                          </div>
                        )}
                      </div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#083A85' : colors.borderPrimary}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '0.25rem',
                      }}>
                        {isSelected && (
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#083A85',
                          }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{
                marginTop: '1.25rem',
                padding: '0.875rem 1rem',
                backgroundColor: actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.15)' : 'rgba(8, 58, 133, 0.04)',
                borderRadius: '0.75rem',
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.3)' : 'rgba(8, 58, 133, 0.1)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <i className="bi bi-info-circle" style={{ color: '#083A85', fontSize: '0.9rem', marginTop: '0.1rem' }} />
                  <p style={{ fontSize: '0.825rem', color: colors.textSecondary, margin: 0, lineHeight: '1.5' }}>
                    Each time you request a withdrawal, you will be asked to verify using your chosen method.
                    Face scan options require an approved KYC with a selfie on file.
                  </p>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bgOverlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => { setShowAddPaymentModal(false); resetForm(); }}
        >
          <div
            className="mobile-modal-inner"
            style={{
              backgroundColor: colors.bgModal,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '480px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: colors.shadowXl
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                Add Payment Account
              </h2>
              <button
                onClick={() => { setShowAddPaymentModal(false); resetForm(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: colors.textSecondary
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Payment Type Selection */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              {([
                { type: 'mtn' as const, label: 'MTN Mobile Money', description: 'Withdraw via MTN Mobile Money', image: '/mtn.png' },
                { type: 'airtel' as const, label: 'Airtel Money', description: 'Withdraw via Airtel Money', image: '/airtel.png' },
                { type: 'bank' as const, label: 'Bank Transfer', description: 'Withdraw to a Rwandan bank account', image: '' }
              ]).map((option) => (
                <div
                  key={option.type}
                  className="mobile-payment-option"
                  onClick={() => setPaymentType(option.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: paymentType === option.type ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.625rem',
                    cursor: 'pointer',
                    backgroundColor: paymentType === option.type ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="mobile-payment-option-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.375rem',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px'
                  }}>
                    {option.type === 'bank' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <Image
                        src={option.image}
                        alt={option.label}
                        width={40}
                        height={40}
                        unoptimized
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mobile-payment-option-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary }}>
                      {option.label}
                    </div>
                    <div className="mobile-payment-option-desc" style={{ fontSize: '0.75rem', color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {option.description}
                    </div>
                  </div>
                  <div className="mobile-payment-option-radio" style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: paymentType === option.type ? '5px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgCard,
                    flexShrink: 0
                  }} />
                </div>
              ))}
            </div>

            {/* Bank Transfer Form */}
            {paymentType === 'bank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Select Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderSecondary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgInput,
                      color: colors.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Choose a bank...</option>
                    {bankProviders.map((bank) => (
                      <option key={bank.id} value={bank.name}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your bank account number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderSecondary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgInput,
                      color: colors.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name as it appears on your bank account"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderSecondary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgInput,
                      color: colors.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mobile Money Phone Number Form (shared for MTN and Airtel) */}
            {(paymentType === 'mtn' || paymentType === 'airtel') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    {paymentType === 'mtn' ? 'MTN' : 'Airtel'} Phone Number
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                    {/* Country code selector */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => { setShowCountryDropdown(!showCountryDropdown); setCountrySearch(''); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.75rem 0.625rem',
                          border: `2px solid ${colors.borderSecondary}`,
                          borderRadius: '0.5rem',
                          backgroundColor: colors.bgInput,
                          color: colors.textPrimary,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          minWidth: '90px',
                        }}
                      >
                        <img src={`https://flagcdn.com/w40/${(COUNTRIES.find(c => c.dialCode === countryCode) || COUNTRIES[15]).iso}.png`} alt="" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
                        <span style={{ fontWeight: '500' }}>{countryCode}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {showCountryDropdown && (
                        <>
                          {/* Click-outside overlay */}
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                            onClick={() => setShowCountryDropdown(false)}
                          />
                          {/* Dropdown */}
                          <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            zIndex: 100,
                            backgroundColor: colors.bgCard,
                            border: `2px solid ${colors.borderPrimary}`,
                            borderRadius: '0.5rem',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            width: '240px',
                            maxHeight: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                          }}>
                            {/* Search */}
                            <div style={{ padding: '0.5rem', borderBottom: `1px solid ${colors.borderPrimary}`, flexShrink: 0 }}>
                              <input
                                type="text"
                                placeholder="Search country…"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                autoFocus
                                style={{
                                  width: '100%',
                                  padding: '0.375rem 0.5rem',
                                  border: `1px solid ${colors.borderSecondary}`,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.85rem',
                                  backgroundColor: colors.bgInput,
                                  color: colors.textPrimary,
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            {/* List */}
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                              {COUNTRIES
                                .filter(c =>
                                  c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                  c.dialCode.includes(countrySearch)
                                )
                                .map((c) => (
                                  <div
                                    key={c.name}
                                    onClick={() => {
                                      setCountryCode(c.dialCode);
                                      setCountryFlag(c.flag);
                                      setShowCountryDropdown(false);
                                      setCountrySearch('');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.5rem 0.75rem',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: colors.textPrimary,
                                      backgroundColor: countryCode === c.dialCode && countryFlag === c.flag
                                        ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                                        : 'transparent',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.bgHover; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = countryCode === c.dialCode && countryFlag === c.flag ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent'; }}
                                  >
                                    <img src={`https://flagcdn.com/w40/${c.iso}.png`} alt={c.name} style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                                    <span style={{ color: colors.textSecondary, flexShrink: 0 }}>{c.dialCode}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Phone number input */}
                    <input
                      type="tel"
                      placeholder="7XX XXX XXX"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: `2px solid ${colors.borderSecondary}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        backgroundColor: colors.bgInput,
                        color: colors.textPrimary,
                        outline: 'none',
                        boxSizing: 'border-box',
                        minWidth: 0,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name registered on your mobile money"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderSecondary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgInput,
                      color: colors.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Validation Feedback */}
            {validationError && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                fontSize: '0.85rem',
              }}>
                {validationError}
              </div>
            )}

            {/* Name Mismatch Confirmation */}
            {showNameMismatch && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: actualTheme === 'dark' ? '#2D2006' : '#FEF3C7',
                border: `1px solid ${actualTheme === 'dark' ? '#92400E' : '#F59E0B'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: actualTheme === 'dark' ? '#FBBF24' : '#92400E' }}>
                      Name mismatch
                    </p>
                    <p style={{ margin: '0.375rem 0 0', fontSize: '0.825rem', color: actualTheme === 'dark' ? '#FDE68A' : '#78350F', lineHeight: '1.4' }}>
                      You entered <strong>{enteredNameForMismatch}</strong>, but this account is registered as <strong>{xentriPayName}</strong>.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleCancelMismatch}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: `1px solid ${actualTheme === 'dark' ? '#92400E' : '#D97706'}`,
                      borderRadius: '0.375rem',
                      backgroundColor: 'transparent',
                      color: actualTheme === 'dark' ? '#FBBF24' : '#92400E',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleConfirmMismatchName}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      backgroundColor: actualTheme === 'dark' ? '#92400E' : '#D97706',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Use "{xentriPayName}"
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showNameMismatch && (
            <div className="mobile-modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center' }}>
              <button
                onClick={() => { setShowAddPaymentModal(false); resetForm(); }}
                disabled={isValidating || isSavingPreference}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: `2px solid ${colors.borderSecondary}`,
                  borderRadius: '0.5rem',
                  backgroundColor: 'transparent',
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isValidating || isSavingPreference ? 'not-allowed' : 'pointer',
                  opacity: isValidating || isSavingPreference ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={isValidating || isSavingPreference}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  backgroundColor: colors.brandPrimary,
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: isValidating || isSavingPreference ? 'not-allowed' : 'pointer',
                  opacity: isValidating || isSavingPreference ? 0.7 : 1,
                }}
              >
                {isValidating ? 'Validating...' : isSavingPreference ? 'Saving...' : 'Add Payment Account'}
              </button>
            </div>
            )}
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bgOverlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => { setShowDeleteModal(false); setSelectedPayment(null); }}
        >
          <div
            style={{
              backgroundColor: colors.bgModal,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: colors.shadowXl
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: colors.statusErrorBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21H20.44C20.79 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.97 3.15C12.67 2.98 12.34 2.89 12 2.89C11.66 2.89 11.33 2.98 11.03 3.15C10.73 3.32 10.47 3.56 10.29 3.86Z" stroke={colors.statusError} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: colors.textPrimary,
              margin: 0,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>Delete Payment Account</h2>

            <p style={{
              fontSize: '0.95rem',
              color: colors.textSecondary,
              margin: 0,
              marginBottom: '0.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{selectedPayment.name}&quot;</strong>?
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: colors.statusError,
              margin: 0,
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              This action cannot be undone.
            </p>

            <div className="mobile-modal-footer" style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedPayment(null); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderSecondary}`,
                  backgroundColor: 'transparent',
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <TrashIcon />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal - simplified for demo */}
      {showEditPaymentModal && selectedPayment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bgOverlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => { setShowEditPaymentModal(false); setSelectedPayment(null); }}
        >
          <div
            style={{
              backgroundColor: colors.bgModal,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: colors.shadowXl
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                Edit Payment Account
              </h2>
              <button
                onClick={() => { setShowEditPaymentModal(false); setSelectedPayment(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: colors.textSecondary
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: colors.bgTertiary,
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
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
                  {selectedPayment.type === 'bank' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : getPaymentImage(selectedPayment.type, selectedPayment.name) ? (
                    <Image
                      src={getPaymentImage(selectedPayment.type, selectedPayment.name)!}
                      alt={selectedPayment.name}
                      width={48}
                      height={48}
                      unoptimized
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <MobileIcon />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                    {selectedPayment.name}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.125rem 0 0 0' }}>
                    {selectedPayment.details}
                  </p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, textAlign: 'center', margin: '0 0 1.5rem 0' }}>
              For security reasons, you can only update the account by removing and adding a new one.
            </p>

            <button
              onClick={() => { setShowEditPaymentModal(false); setSelectedPayment(null); }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: colors.brandPrimary,
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesPage;
