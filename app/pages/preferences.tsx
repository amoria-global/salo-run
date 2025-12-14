"use client";

import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import Topbar from '../components/topbar';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'mobile';
  name: string;
  details: string;
  isDefault: boolean;
  icon: string;
  lastFour?: string;
  expiryDate?: string;
}

interface PreferencesPageProps {
  userType?: 'photographer' | 'freelancer' | 'client';
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

const BankIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const PreferencesPage = ({ userType = 'photographer' }: PreferencesPageProps) => {
  const { theme, setTheme, actualTheme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'payments'>('appearance');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [paymentType, setPaymentType] = useState<'card' | 'bank' | 'mobile'>('card');

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa',
      details: 'Visa ending in 4242',
      lastFour: '4242',
      expiryDate: '12/26',
      isDefault: true,
      icon: 'bi-credit-card-2-front'
    },
    {
      id: '2',
      type: 'bank',
      name: 'Bank of Kigali',
      details: 'Account ending in 7890',
      lastFour: '7890',
      isDefault: false,
      icon: 'bi-bank'
    },
    {
      id: '3',
      type: 'mobile',
      name: 'MTN Mobile Money',
      details: '+250 78X XXX X89',
      lastFour: 'X89',
      isDefault: false,
      icon: 'bi-phone'
    }
  ]);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode; description: string }[] = [
    { mode: 'light', label: 'Light', icon: <SunIcon />, description: 'Classic light theme for daytime use' },
    { mode: 'dark', label: 'Dark', icon: <MoonIcon />, description: 'Easy on the eyes in low light' },
    { mode: 'system', label: 'System', icon: <SystemIcon />, description: 'Automatically match your device settings' }
  ];

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const handleDeletePayment = () => {
    if (selectedPayment) {
      setPaymentMethods(methods => methods.filter(m => m.id !== selectedPayment.id));
      setShowDeleteModal(false);
      setSelectedPayment(null);
    }
  };

  const resetForm = () => {
    setCardNumber('');
    setCardName('');
    setExpiryDate('');
    setCvv('');
    setBankName('');
    setAccountNumber('');
    setRoutingNumber('');
    setMobileProvider('');
    setMobileNumber('');
    setPaymentType('card');
  };

  const handleAddPayment = () => {
    let newPayment: PaymentMethod;

    if (paymentType === 'card') {
      const lastFour = cardNumber.replace(/\s/g, '').slice(-4);
      newPayment = {
        id: Date.now().toString(),
        type: 'card',
        name: cardName || 'Card',
        details: `Card ending in ${lastFour}`,
        lastFour,
        expiryDate,
        isDefault: paymentMethods.length === 0,
        icon: 'bi-credit-card-2-front'
      };
    } else if (paymentType === 'bank') {
      const lastFour = accountNumber.slice(-4);
      newPayment = {
        id: Date.now().toString(),
        type: 'bank',
        name: bankName,
        details: `Account ending in ${lastFour}`,
        lastFour,
        isDefault: paymentMethods.length === 0,
        icon: 'bi-bank'
      };
    } else {
      const lastFour = mobileNumber.slice(-3);
      newPayment = {
        id: Date.now().toString(),
        type: 'mobile',
        name: mobileProvider,
        details: mobileNumber.replace(/(\d{3})(\d{2})(\d{3})(\d{3})/, '+$1 $2X XXX X$4').slice(0, -2) + lastFour.slice(-2),
        lastFour,
        isDefault: paymentMethods.length === 0,
        icon: 'bi-phone'
      };
    }

    setPaymentMethods([...paymentMethods, newPayment]);
    setShowAddPaymentModal(false);
    resetForm();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').slice(0, 19) : '';
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const getPaymentIcon = (type: 'card' | 'bank' | 'mobile') => {
    switch (type) {
      case 'card': return <CreditCardIcon />;
      case 'bank': return <BankIcon />;
      case 'mobile': return <MobileIcon />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userType} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* Header */}
          <header style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
              Preferences
            </h1>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
              Customize your dashboard experience and manage payment settings
            </p>
          </header>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            backgroundColor: colors.bgTertiary,
            borderRadius: '0.5rem',
            padding: '0.25rem',
            width: 'fit-content',
            marginBottom: '1.5rem'
          }}>
            {[
              { key: 'appearance' as const, label: 'Appearance', icon: 'bi-palette' },
              { key: 'payments' as const, label: 'Payment Accounts', icon: 'bi-wallet2' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? colors.bgSecondary : 'transparent',
                  color: activeTab === tab.key ? colors.textPrimary : colors.textSecondary,
                  boxShadow: activeTab === tab.key ? colors.shadowSm : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <i className={`bi ${tab.icon}`} style={{ fontSize: '1rem' }}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: colors.shadowMd,
              border: `1px solid ${colors.borderPrimary}`
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                Theme Mode
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem 0' }}>
                Choose how the dashboard looks to you. Select a single theme, or sync with your system settings.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {themeOptions.map((option) => (
                  <button
                    key={option.mode}
                    onClick={() => setTheme(option.mode)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1.5rem',
                      borderRadius: '0.75rem',
                      border: theme === option.mode
                        ? `2px solid ${colors.brandPrimary}`
                        : `2px solid ${colors.borderPrimary}`,
                      backgroundColor: theme === option.mode
                        ? actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(8, 58, 133, 0.05)'
                        : colors.bgTertiary,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {/* Preview */}
                    <div style={{
                      width: '100%',
                      height: '80px',
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
                      fontSize: '0.8rem',
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
                  Add Payment Method
                </button>
              </div>

              {/* Payment Methods List */}
              <div style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: '1rem',
                boxShadow: colors.shadowMd,
                border: `1px solid ${colors.borderPrimary}`,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '1.25rem',
                  borderBottom: `1px solid ${colors.borderPrimary}`
                }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                    Saved Payment Methods
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>
                    Manage your payment methods for bookings and transactions
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
                      No payment methods saved
                    </p>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>
                      Add a card, bank account, or mobile money to get started
                    </p>
                  </div>
                ) : (
                  <div>
                    {paymentMethods.map((method, index) => (
                      <div
                        key={method.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          borderBottom: index < paymentMethods.length - 1 ? `1px solid ${colors.borderPrimary}` : 'none',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '0.5rem',
                            backgroundColor: method.type === 'card' ? '#DBEAFE' : method.type === 'bank' ? '#D1FAE5' : '#FEF3C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: method.type === 'card' ? '#2563EB' : method.type === 'bank' ? '#059669' : '#D97706'
                          }}>
                            {getPaymentIcon(method.type)}
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
                              {method.expiryDate && ` • Expires ${method.expiryDate}`}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                              border: `1px solid ${colors.borderPrimary}`,
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
                Add Payment Method
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

            {/* Payment Type Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {[
                { type: 'card' as const, label: 'Card', icon: <CreditCardIcon /> },
                { type: 'bank' as const, label: 'Bank Account', icon: <BankIcon /> },
                { type: 'mobile' as const, label: 'Mobile Money', icon: <MobileIcon /> }
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => setPaymentType(option.type)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: paymentType === option.type
                      ? `2px solid ${colors.brandPrimary}`
                      : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    backgroundColor: paymentType === option.type
                      ? actualTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(8, 58, 133, 0.05)'
                      : 'transparent',
                    color: paymentType === option.type ? colors.brandPrimary : colors.textSecondary,
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Card Form */}
            {paymentType === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
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
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      maxLength={5}
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
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
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
              </div>
            )}

            {/* Bank Form */}
            {paymentType === 'bank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Bank Name
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderSecondary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgInput,
                      color: colors.textPrimary,
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select a bank</option>
                    <option value="Bank of Kigali">Bank of Kigali</option>
                    <option value="Equity Bank">Equity Bank</option>
                    <option value="I&M Bank">I&M Bank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="Ecobank">Ecobank</option>
                    <option value="KCB Bank">KCB Bank</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
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
                    Routing Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter routing number"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
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

            {/* Mobile Money Form */}
            {paymentType === 'mobile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Mobile Provider
                  </label>
                  <select
                    value={mobileProvider}
                    onChange={(e) => setMobileProvider(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderSecondary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgInput,
                      color: colors.textPrimary,
                      outline: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select provider</option>
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+250 78X XXX XXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => { setShowAddPaymentModal(false); resetForm(); }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: `2px solid ${colors.borderSecondary}`,
                  borderRadius: '0.5rem',
                  backgroundColor: 'transparent',
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                style={{
                  flex: 1,
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
                Add Payment Method
              </button>
            </div>
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
            }}>Delete Payment Method</h2>

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

            <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                Edit Payment Method
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  backgroundColor: selectedPayment.type === 'card' ? '#DBEAFE' : selectedPayment.type === 'bank' ? '#D1FAE5' : '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedPayment.type === 'card' ? '#2563EB' : selectedPayment.type === 'bank' ? '#059669' : '#D97706'
                }}>
                  {getPaymentIcon(selectedPayment.type)}
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
              For security reasons, you can only update the payment method by removing and adding a new one.
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
