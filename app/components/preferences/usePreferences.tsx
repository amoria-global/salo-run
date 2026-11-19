'use client';

// app/pages/preferences.tsx's behaviour, moved verbatim into a hook so the classic page and the Compact Glass page share one source
// of truth (no behaviour change).
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme, type ThemeMode } from "@/app/context/ThemeContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { dashboardAuthFetch, useDashboardAuth } from "@/app/providers/AuthProvider";
import { getApiUrl } from "@/lib/api";
import { validateAccountDetails } from "@/lib/xentripay";
import { type PhoneValue } from "@/app/components/phone/InternationalPhoneInput";
import { parsePhone } from "@/lib/phone/phoneKit";

// API response type
export interface ApiResponse<T = unknown> {
  action: number;
  message?: string;
  data?: T;
}

// Preference payload for PUT
export interface PreferencePayload {
  value: string;
  [key: string]: unknown;
}

export interface PaymentMethod {
  id: string;
  type: 'mobile' | 'bank';
  methodType: string;
  name: string;
  details: string;
  isDefault: boolean;
  bankName?: string;
  accountName?: string;
}

export interface PreferencesPageProps {
  userType?: 'photographer' | 'client' | 'event-coordinator';
}

// SVG Icons
export const SunIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const MoonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SystemIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M1 10H23" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const MobileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


// Component to handle URL params - needs Suspense boundary
export const TabParamHandler = ({
  setActiveTab,
  setShowAddPaymentModal
}: {
  setActiveTab: (tab: 'appearance' | 'payments' | 'notifications' | 'security' | 'referral') => void;
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
    } else if (tab === 'referral' || searchParams.get('addReferral') === '1') {
      setActiveTab('referral');
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

export function usePreferences(userType: 'photographer' | 'client' | 'event-coordinator' = 'photographer') {
  const { theme, setTheme, actualTheme, colors } = useTheme();
  const { language, setLanguage, languages } = useLanguage();
  const [activeTab, setActiveTab] = useState<'appearance' | 'payments' | 'notifications' | 'security' | 'referral'>('appearance');
  const { user, updateUser } = useDashboardAuth();
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentType, setPaymentType] = useState<'mtn' | 'airtel' | 'bank'>('mtn');

  // Form states
  // Mobile money number captured by InternationalPhoneInput — holds every
  // representation (digits/e164/iso2/validity). accountNumber submits
  // mobilePhone.digits ("250788123456", no '+') per the backend audit.
  const [mobilePhone, setMobilePhone] = useState<PhoneValue | null>(null);
  // Bumped on resetForm so the phone component remounts empty.
  const [phoneFieldKey, setPhoneFieldKey] = useState(0);
  const [accountHolderName, setAccountHolderName] = useState('');
  // Default the phone field's country to the user's saved profile phone.
  const defaultPhoneIso2 = React.useMemo(
    () => parsePhone(user?.phone || '').country?.iso2 ?? 'RW',
    [user?.phone]
  );

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


  // Two-factor authentication states
  const [totpEnabled, setTotpEnabled] = useState(user?.twoFactorEnabled || false);

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
    setMobilePhone(null);
    setPhoneFieldKey(k => k + 1);
    setAccountHolderName('');
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
    // ISO-2 country of the phone the user entered (from the international
    // phone input). The backend stores this on the withdrawal_method row
    // so payout routing can pick PawaPay for non-RW numbers and XentriPay
    // only for Rwanda.
    const country = mobilePhone?.iso2 ?? 'RW';
    const params = new URLSearchParams({
      methodType,
      accountName,
      accountNumber,
      bankName,
      isDefault: String(isDefault),
      country,
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
        accountNumber = mobilePhone?.digits ?? '';
        bankName = 'MTN Mobile Money';
        const provider = mobileProviders.find(p => p.name.toLowerCase().includes('mtn'));
        bankId = provider?.id || '63510';
      } else {
        methodType = 'MOBILE_MONEY';
        accountName = accountHolderName || 'Airtel Money';
        accountNumber = mobilePhone?.digits ?? '';
        bankName = 'Airtel Rwanda';
        const provider = mobileProviders.find(p => p.name.toLowerCase().includes('airtel'));
        bankId = provider?.id || '63514';
      }

      if (!accountNumber) {
        setValidationError('Please enter an account number.');
        setIsSavingPreference(false);
        return;
      }

      if ((paymentType === 'mtn' || paymentType === 'airtel') && !mobilePhone?.isValid) {
        setValidationError('Please enter a valid phone number.');
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
          // Names don't match. show confirmation dialog
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


  return {
    theme,
    setTheme,
    actualTheme,
    colors,
    language,
    setLanguage,
    languages,
    activeTab,
    setActiveTab,
    user,
    updateUser,
    showAddPaymentModal,
    setShowAddPaymentModal,
    showEditPaymentModal,
    setShowEditPaymentModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedPayment,
    setSelectedPayment,
    paymentType,
    setPaymentType,
    mobilePhone,
    setMobilePhone,
    phoneFieldKey,
    setPhoneFieldKey,
    accountHolderName,
    setAccountHolderName,
    defaultPhoneIso2,
    bankAccountNumber,
    setBankAccountNumber,
    bankAccountName,
    setBankAccountName,
    selectedBank,
    setSelectedBank,
    bankProviders,
    setBankProviders,
    mobileProviders,
    setMobileProviders,
    isValidating,
    setIsValidating,
    validatedName,
    setValidatedName,
    validationError,
    setValidationError,
    showNameMismatch,
    setShowNameMismatch,
    xentriPayName,
    setXentriPayName,
    enteredNameForMismatch,
    setEnteredNameForMismatch,
    pendingSaveData,
    setPendingSaveData,
    paymentMethods,
    setPaymentMethods,
    isSavingPreference,
    setIsSavingPreference,
    totpEnabled,
    setTotpEnabled,
    emailNotifications,
    setEmailNotifications,
    pushNotifications,
    setPushNotifications,
    securityAlerts,
    setSecurityAlerts,
    paymentNotifications,
    setPaymentNotifications,
    tipsAndBonuses,
    setTipsAndBonuses,
    albumNotifications,
    setAlbumNotifications,
    bookingNotifications,
    setBookingNotifications,
    giftNotifications,
    setGiftNotifications,
    streamFeeNotifications,
    setStreamFeeNotifications,
    preferencesBasePath,
    savePreference,
    deletePreference,
    themeOptions,
    withdrawalMethodBasePath,
    handleSetDefault,
    handleDeletePayment,
    resetForm,
    saveWithdrawalMethod,
    handleConfirmMismatchName,
    handleCancelMismatch,
    handleAddPayment,
    getPaymentIcon,
    getPaymentImage,
  };
}

export type PreferencesController = ReturnType<typeof usePreferences>;
