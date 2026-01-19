"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';

// Heart Icon for donate button (filled red)
export const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#EF4444" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#EF4444" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// White Heart Icon for modal header
const WhiteHeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Donate Button Component - styled like the pill button with red border
export const DonateButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.625rem 1.25rem',
      backgroundColor: 'white',
      border: '3px solid #EF4444',
      borderRadius: '9999px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      width: '100%'
    }}
    title="Make a donation to charity"
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#FEF2F2';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }}
  >
    <HeartIcon />
    <span style={{
      fontSize: '0.875rem',
      fontWeight: '700',
      color: '#1F2937',
      letterSpacing: '0.025em'
    }}>
      DONATE
    </span>
  </button>
);

// Close Icon
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Charity Icons
const FamilyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke="#F20C8F" strokeWidth="2"/>
    <path d="M3 18C3 15.2386 5.23858 13 8 13H10C12.7614 13 15 15.2386 15 18" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="17" cy="9" r="2.5" stroke="#F20C8F" strokeWidth="2"/>
    <path d="M21 18C21 16.3431 19.6569 15 18 15H16.5" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MedicalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#10B981" strokeWidth="2"/>
    <path d="M12 8V16M8 12H16" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SchoolIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L1 9L12 15L23 9L12 3Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.5 11.5V17C5.5 17 8 20 12 20C16 20 18.5 17 18.5 17V11.5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FoodIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8H19C20.1046 8 21 8.89543 21 10V11C21 12.6569 19.6569 14 18 14H6C4.34315 14 3 12.6569 3 11V10C3 8.89543 3.89543 8 5 8H6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 14V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 3V8M8 5L12 8L16 5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Donate Prompt Modal - asks user if they want to make a donation (Yes/No)
interface DonatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
}

export const DonatePromptModal: React.FC<DonatePromptModalProps> = ({ isOpen, onClose, onYes, onNo }) => {
  const { colors, actualTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1150,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: colors.bgCard,
        borderRadius: '1rem',
        width: '400px',
        maxWidth: '95%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '1.5rem',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: actualTheme === 'dark'
              ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.2) 0%, rgba(255, 107, 157, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(242, 12, 143, 0.15) 0%, rgba(255, 107, 157, 0.08) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            border: `2px solid ${actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.3)' : 'rgba(242, 12, 143, 0.2)'}`
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#F20C8F" stroke="#F20C8F" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
            Would you like to make a donation?
          </h3>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Your contribution helps support families in need, medical bills, school requirements, and food for children.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onNo}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.5rem',
                background: colors.bgTertiary,
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              No, thanks
            </button>
            <button
              onClick={onYes}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid #c00a72',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #F20C8F 0%, #FF6B9D 100%)',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
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

const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const { colors, actualTheme } = useTheme();
  const router = useRouter();
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');

  if (!isOpen) return null;

  const handleDonate = () => {
    console.log('Donating:', donationAmount, 'via:', selectedPaymentMethod);
    onClose();
    setDonationAmount('');
    setSelectedPaymentMethod('card');
  };

  const causeItems = [
    {
      icon: <FamilyIcon />,
      title: 'Poor Families Charity',
      description: 'Help families in need with essential support'
    },
    {
      icon: <MedicalIcon />,
      title: 'Medical Insurance & Bills',
      description: 'Cover healthcare costs for those who cannot afford'
    },
    {
      icon: <SchoolIcon />,
      title: 'School Requirements',
      description: 'Provide books, uniforms, and supplies for children'
    },
    {
      icon: <FoodIcon />,
      title: 'Food for Children',
      description: 'Ensure no child goes hungry'
    }
  ];

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .donate-modal {
            width: 95% !important;
            margin: 0.5rem;
            max-height: 85vh !important;
            overflow-y: auto !important;
          }
          .donate-modal-header {
            flex-direction: column !important;
            gap: 0.5rem;
          }
          .donate-modal-header button {
            position: absolute;
            top: 1rem;
            right: 1rem;
          }
          .donate-modal-content {
            padding: 1rem !important;
            padding-bottom: 3rem !important;
          }
          .donate-causes-grid {
            grid-template-columns: 1fr !important;
          }
          .donate-quick-amounts {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .donate-actions {
            flex-direction: column !important;
            margin-bottom: 2rem !important;
            gap: 0.5rem !important;
          }
          .donate-actions button {
            width: 100% !important;
            min-height: 42px !important;
          }
          .donate-cause-item {
            padding: 0.75rem !important;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }} onClick={onClose}>
        <div className="donate-modal" style={{
          backgroundColor: colors.bgCard,
          borderRadius: '1rem',
          width: '480px',
          maxWidth: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="donate-modal-header" style={{
            padding: '1.5rem 1.5rem 0 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'relative'
          }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F20C8F 0%, #FF6B9D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <HeartIcon />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                Make a Donation
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.5rem 0 0 0' }}>
              Your contribution makes a difference
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: colors.bgTertiary,
              border: `2px solid ${colors.borderPrimary}`,
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textPrimary,
              transition: 'background 0.2s'
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="donate-modal-content" style={{ padding: '1.25rem 1.5rem 1.5rem 1.5rem' }}>
          {/* Causes Description */}
          <div style={{
            background: actualTheme === 'dark' ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.1) 0%, rgba(255, 107, 157, 0.05) 100%)' : 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)',
            borderRadius: '0.875rem',
            padding: '1rem',
            marginBottom: '1.25rem',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.2)' : 'rgba(242, 12, 143, 0.15)'}`
          }}>
            <p style={{
              fontSize: '0.9rem',
              color: colors.textPrimary,
              margin: '0 0 1rem 0',
              fontWeight: '500',
              lineHeight: '1.5'
            }}>
              Your donation helps support:
            </p>
            <div className="donate-causes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {causeItems.map((cause, index) => (
                <div key={index} className="donate-cause-item" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  padding: '0.5rem',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {cause.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.125rem' }}>
                      {cause.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: colors.textSecondary, lineHeight: '1.3' }}>
                      {cause.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '0.5rem'
            }}>
              Donation Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: colors.textSecondary
              }}>$</span>
              <input
                type="text"
                placeholder="0.00"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F20C8F';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.borderPrimary;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            {/* Quick amount buttons */}
            <div className="donate-quick-amounts" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
              {['5', '10', '25', '50', '100'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDonationAmount(amount)}
                  style={{
                    padding: '0.5rem',
                    border: donationAmount === amount ? '2px solid #F20C8F' : `1px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    background: donationAmount === amount ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)') : colors.bgCard,
                    color: donationAmount === amount ? '#F20C8F' : colors.textSecondary,
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

          {/* Payment Method Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '0.75rem'
            }}>
              Payment Method
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {/* Credit/Debit Card */}
              <div
                onClick={() => setSelectedPaymentMethod('card')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem',
                  border: selectedPaymentMethod === 'card' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: selectedPaymentMethod === 'card' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.1)' : 'rgba(242, 12, 143, 0.05)') : colors.bgCard,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src="/cards.png" alt="Credit/Debit Card" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Credit/Debit Card</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Visa, Mastercard, etc.</div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedPaymentMethod === 'card' ? '5px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
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
                  padding: '0.875rem',
                  border: selectedPaymentMethod === 'mtn' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: selectedPaymentMethod === 'mtn' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.1)' : 'rgba(242, 12, 143, 0.05)') : colors.bgCard,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src="/mtn.png" alt="MTN Mobile Money" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>MTN Mobile Money</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Pay via MTN MoMo</div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedPaymentMethod === 'mtn' ? '5px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
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
                  padding: '0.875rem',
                  border: selectedPaymentMethod === 'airtel' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: selectedPaymentMethod === 'airtel' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.1)' : 'rgba(242, 12, 143, 0.05)') : colors.bgCard,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src="/airtel.png" alt="Airtel Mobile Money" width={40} height={40} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Airtel Mobile Money</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Pay via Airtel Money</div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedPaymentMethod === 'airtel' ? '5px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
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
                  padding: '0.875rem',
                  border: selectedPaymentMethod === 'bank' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: selectedPaymentMethod === 'bank' ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.1)' : 'rgba(242, 12, 143, 0.05)') : colors.bgCard,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src="/bank.png" alt="Bank Transfer" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Bank Transfer</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Pay via bank account</div>
                </div>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: selectedPaymentMethod === 'bank' ? '5px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard
                }} />
              </div>
            </div>

            {/* Info text about payment accounts */}
            <p style={{
              fontSize: '0.8rem',
              color: colors.textSecondary,
              margin: '0.75rem 0 0 0',
              textAlign: 'center'
            }}>
              <i className="bi bi-info-circle" style={{ marginRight: '0.375rem' }}></i>
              Manage your payment methods in <span
                onClick={() => router.push('/user/client/preferences?tab=payments')}
                style={{ color: '#F20C8F', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
              >Preferences → Payment Accounts</span>
            </p>
          </div>

          {/* Actions */}
          <div className="donate-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.75rem',
                background: colors.bgTertiary,
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDonate}
              disabled={!donationAmount}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: !donationAmount ? '2px solid #9CA3AF' : '2px solid #c00a72',
                borderRadius: '0.75rem',
                background: !donationAmount ? '#9CA3AF' : 'linear-gradient(135deg, #F20C8F 0%, #FF6B9D 100%)',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: !donationAmount ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <HeartIcon />
              Donate {donationAmount ? `$${donationAmount}` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default DonateModal;
