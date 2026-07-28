"use client";

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/sidebar';
import { platformAlert } from '../../components/PlatformAlert';
import Topbar from '../../components/topbar';
import CountrySelect, { eastAfricanCountries } from '../../components/CountrySelect';
import InternationalPhoneInput, { type PhoneValue } from '../../components/phone/InternationalPhoneInput';
import { parsePhone } from '@/lib/phone/phoneKit';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, capitalizeWords } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';
import KycBadge from '../../components/KycBadge';
import KycVerificationModal from '../../components/KycVerificationModal';

// Camera icon for avatar edit
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
  </svg>
);

const ProfilePage = () => {
  const { colors, actualTheme } = useTheme();
  const { profile, updateProfile } = useUserProfile();
  const { token, user } = useDashboardAuth();
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  // East African countries imported from CountrySelect component

  // Rwanda provinces and districts
  const rwandaProvinces: { [key: string]: string[] } = {
    'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
  };

  // Form state - uses profile data from context (will be from backend later)
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    username: profile.username,
    email: profile.email,
    phoneCode: profile.phoneCode,
    phoneNumber: profile.phoneNumber,
    title: profile.title,
    country: profile.country,
    province: profile.province,
    district: profile.district,
    sector: profile.sector,
    // Fields only for photographers
    companyName: 'Personal',
    workLocation: 'Kigali, Rwanda',
    availabilityDays: 'Weekends',
    availableTime: '10:00 AM - 6:00 PM',
    bio: 'Passionate about capturing life\'s precious moments. Looking for talented photographers for weddings, events, and family portraits.'
  });

  // Profile image state - initialized from context/user data
  const [profileImage, setProfileImage] = useState<string>(profile.profilePicture || '');

  // File input ref
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Input validation error states
  const [validationErrors, setValidationErrors] = useState({
    fullName: '',
    username: '',
    phoneNumber: ''
  });

  // International phone input: the saved profile phone (code + national
  // number) is parsed once with phoneKit so the component can be seeded
  // with the right country + national digits. phoneValue always mirrors
  // what the field currently shows.
  const [phoneValue, setPhoneValue] = useState<PhoneValue | null>(null);
  const savedPhone = React.useMemo(
    () => parsePhone(`${profile.phoneCode || ''}${profile.phoneNumber || ''}`),
    [profile.phoneCode, profile.phoneNumber]
  );

  // Sync profile image from user data when it loads
  useEffect(() => {
    if (user?.profilePicture) setProfileImage(user.profilePicture);
  }, [user?.profilePicture]);

  // Sync form data when profile context updates
  useEffect(() => {
    if (profile.fullName) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.fullName,
        username: profile.username,
        email: profile.email,
        phoneCode: profile.phoneCode,
        phoneNumber: profile.phoneNumber,
        title: profile.title,
        country: profile.country || prev.country,
        province: profile.province || prev.province,
        district: profile.district || prev.district,
        sector: profile.sector || prev.sector,
      }));
    }
  }, [profile.fullName, profile.username, profile.email, profile.phoneCode, profile.phoneNumber, profile.title, profile.country, profile.province, profile.district, profile.sector]);

  // Save profile to API
  const handleSaveProfile = async () => {
    if (!user) return;
    const address = [formData.sector, formData.district, formData.province, formData.country].filter(Boolean).join(', ');
    if (!address.trim()) {
      platformAlert('Location / Address is required. Please fill in at least your district and country.');
      return;
    }
    if (phoneValue?.nsn && !phoneValue.isValid) {
      platformAlert('Please enter a valid phone number.');
      return;
    }
    setIsSaving(true);
    try {
      const apiUrl = getApiUrl();
      const nameParts = capitalizeWords(formData.fullName.trim()).split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      // International digits without '+' (e.g. "250788123456") — the
      // canonical wire format per the backend phone-format audit.
      const phone = phoneValue?.digits ?? '';
      const capitalizedAddress = capitalizeWords(address);

      const params = new URLSearchParams();
      if (firstName) params.append('firstName', firstName);
      if (lastName) params.append('lastName', lastName);
      if (phone) params.append('phone', phone);
      if (capitalizedAddress) params.append('address', capitalizedAddress);

      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/profile?${params.toString()}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }

      const result = await response.json();
      if (result.action === 1) {
        // Keep the shared profile context in sync with the phone just saved
        // so other pages (payment prefills, etc.) pick it up immediately.
        if (phoneValue?.dial && phoneValue.nsn) {
          updateProfile({ phoneCode: `+${phoneValue.dial}`, phoneNumber: phoneValue.nsn });
        }
        platformAlert('Profile updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      platformAlert(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (isEditEnabled) {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Update the shared UserProfileContext for profile fields
      const profileFields = ['fullName', 'username', 'email', 'phoneCode', 'phoneNumber', 'title', 'country', 'province', 'district', 'sector'];
      if (profileFields.includes(field)) {
        updateProfile({ [field]: value });
      }
    }
  };

  // Validation handlers for sensitive input fields
  const handleFullNameChange = (value: string) => {
    if (!isEditEnabled) return;
    // Allow only letters, spaces, and common name characters (hyphens, apostrophes)
    if (value === '' || /^[a-zA-Z\s'-]*$/.test(value)) {
      handleInputChange('fullName', value);
      setValidationErrors(prev => ({ ...prev, fullName: '' }));
    } else {
      setValidationErrors(prev => ({ ...prev, fullName: 'Only letters, spaces, hyphens and apostrophes allowed' }));
    }
  };

  const handleUsernameChange = (value: string) => {
    if (!isEditEnabled) return;
    // Allow only alphanumeric characters and underscores
    if (value === '' || /^[a-zA-Z0-9_]*$/.test(value)) {
      handleInputChange('username', value);
      setValidationErrors(prev => ({ ...prev, username: '' }));
    } else {
      setValidationErrors(prev => ({ ...prev, username: 'Only letters, numbers and underscores allowed' }));
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        platformAlert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > getPlatformConfig().uploads.maxImageSizeMb * 1024 * 1024) {
        platformAlert('Image size should be less than 5MB');
        return;
      }
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to API
      if (user) {
        setIsUploadingImage(true);
        try {
          const apiUrl = getApiUrl();
          const uploadData = new FormData();
          uploadData.append('profilePicture', file);
          const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/profile/profile-picture`, {
            method: 'POST',
            body: uploadData,
          });
          if (!response.ok) {
            console.error('Failed to upload profile picture:', response.status);
            platformAlert('Failed to upload profile picture. Please try again.');
          }
        } catch (err) {
          console.error('Profile picture upload error:', err);
        } finally {
          setIsUploadingImage(false);
        }
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.9rem',
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: colors.borderPrimary,
    borderRadius: 11,
    fontSize: '0.92rem',
    color: colors.textPrimary,
    backgroundColor: isEditEnabled ? colors.bgCard : colors.bgTertiary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.18s, background-color 0.18s, box-shadow 0.18s'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: 'rgba(220,38,38,0.50)',
    boxShadow: '0 0 0 3px rgba(220,38,38,0.10)'
  };

  const errorMessageStyle = {
    color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
    fontSize: '0.74rem',
    marginTop: '0.35rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 600,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: '700' as const,
    color: '#F20C8F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '0.5rem',
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: colors.bgPrimary,
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
            overflow-x: hidden !important;
          }
          .mobile-form-grid-2 input,
          .mobile-form-grid-2 select {
            min-height: 44px !important;
            font-size: 0.9rem !important;
          }
          .mobile-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
            padding: 1.25rem !important;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.05) 0%, rgba(8, 58, 133, 0.02) 100%) !important;
            border-radius: 1rem !important;
            border: 1px solid rgba(8, 58, 133, 0.1) !important;
          }
          .mobile-page-header h1 {
            font-size: 1.4rem !important;
            font-weight: 700 !important;
            color: #083A85 !important;
          }
          .mobile-profile-section {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          .mobile-profile-left {
            width: 100% !important;
            max-width: 100% !important;
            order: 1 !important;
          }
          .mobile-profile-right {
            width: 100% !important;
            order: 2 !important;
          }
          .mobile-tabs {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
            border-radius: 1rem 1rem 0 0 !important;
            padding: 0.75rem !important;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.03) 0%, rgba(8, 58, 133, 0.01) 100%) !important;
          }
          .mobile-tabs button {
            flex: 1 !important;
            min-width: auto !important;
            font-size: 0.9rem !important;
            padding: 0.75rem !important;
            font-weight: 600 !important;
            border-radius: 0.625rem !important;
            transition: all 0.2s ease !important;
          }
          .mobile-tabs button:active {
            transform: scale(0.98);
          }
          .mobile-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-card {
            padding: 1.25rem !important;
            border-radius: 1rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          }
          .mobile-section-actions {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-section-actions button {
            width: 100% !important;
            padding: 0.875rem 1rem !important;
            border-radius: 0.75rem !important;
            transition: all 0.2s ease !important;
            font-weight: 600 !important;
          }
          .mobile-section-actions button:active {
            transform: scale(0.98);
          }
          .mobile-profile-card-name {
            padding: 1rem 1.25rem 0.75rem !important;
          }
          .mobile-profile-card-stats {
            padding: 1rem 1.25rem !important;
          }
          .mobile-profile-card-activity {
            padding: 1rem 1.25rem !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-page-header {
            padding: 1rem !important;
          }
          .mobile-page-header h1 {
            font-size: 1.2rem !important;
          }
          .mobile-tabs {
            padding: 0.5rem !important;
          }
          .mobile-tabs button {
            font-size: 0.85rem !important;
            padding: 0.625rem 0.5rem !important;
          }
          .mobile-card {
            padding: 1rem !important;
          }
          .mobile-profile-card-name {
            padding: 0.75rem 1rem 0.5rem !important;
          }
          .mobile-profile-card-name h2 {
            font-size: 1rem !important;
            margin-bottom: 0.25rem !important;
          }
          .mobile-profile-card-name p:first-of-type {
            font-size: 0.8rem !important;
            margin-bottom: 0.15rem !important;
          }
          .mobile-profile-card-name p:last-of-type {
            font-size: 0.75rem !important;
          }
          .mobile-profile-card-stats {
            padding: 0.75rem 1rem !important;
          }
          .mobile-profile-card-stats > div > div:first-child {
            font-size: 1.1rem !important;
            margin-bottom: 0.15rem !important;
          }
          .mobile-profile-card-stats > div > div:last-child {
            font-size: 0.7rem !important;
          }
          .mobile-profile-card-activity {
            padding: 0.875rem 1rem !important;
          }
          .mobile-profile-card-activity h3 {
            font-size: 0.8rem !important;
            margin-bottom: 0.625rem !important;
          }
          .mobile-profile-card-activity span {
            font-size: 0.75rem !important;
          }
        }
        @media (max-width: 375px) {
          .mobile-main-content {
            padding: 0.5rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-page-header h1 {
            font-size: 1.1rem !important;
          }
          .mobile-tabs button {
            font-size: 0.78rem !important;
            padding: 0.5rem 0.375rem !important;
          }
          .mobile-form-grid-2 input,
          .mobile-form-grid-2 select {
            font-size: 0.85rem !important;
            padding: 0.625rem 0.75rem !important;
          }
        }
      `}</style>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="client" />

        <div className="mobile-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: colors.bgPrimary,
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          {/* Page Title */}
          <h1 className="mobile-page-header" style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '1.25rem'
          }}>Profile</h1>

          {/* Main Content Grid */}
          <div className="mobile-profile-section" style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '1.5rem'
          }}>
            {/* Left Sidebar - Profile Card */}
            <div className="mobile-profile-left" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Profile Card */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.12)',
                border: `1px solid ${colors.borderPrimary}`,
                position: 'relative',
              }}>
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                  zIndex: 2,
                }} />
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={profileInputRef}
                  onChange={handleProfileImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                {/* Avatar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '1.6rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 108,
                      height: 108,
                      borderRadius: '50%',
                      padding: 3,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: '0 8px 20px rgba(8,58,133,0.22)',
                    }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        overflow: 'hidden',
                        background: colors.bgCard,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{
                              fontSize: '2.2rem',
                              fontWeight: 800,
                              letterSpacing: '-0.02em',
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}>
                              {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        )}
                        {isUploadingImage && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                          }}>
                            <div style={{
                              width: 22,
                              height: 22,
                              border: '2px solid #fff',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => isEditEnabled && profileInputRef.current?.click()}
                      disabled={!isEditEnabled}
                      aria-label="Upload profile picture"
                      title={isEditEnabled ? 'Upload profile picture' : 'Enable editing to upload'}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: isEditEnabled
                          ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                          : (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF'),
                        border: `2px solid ${colors.bgCard}`,
                        borderRadius: '50%',
                        width: 34,
                        height: 34,
                        cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isEditEnabled ? 1 : 0.7,
                        boxShadow: isEditEnabled ? '0 6px 14px rgba(242,12,143,0.32)' : '0 3px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => { if (isEditEnabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <i className="bi bi-camera-fill" style={{ color: '#fff', fontSize: 13 }} />
                    </button>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="mobile-profile-card-name" style={{
                  textAlign: 'center',
                  padding: '0.85rem 1.5rem 1rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: colors.textPrimary,
                    margin: 0, marginBottom: '0.2rem',
                    letterSpacing: '-0.01em',
                  }}>{formData.fullName || 'User'}</h2>
                  {user?.kycStatus === 'APPROVED' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
                      <KycBadge kycStatus={user.kycStatus} size="sm" />
                    </div>
                  )}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '0.25rem 0.65rem',
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
                    border: '1px solid rgba(8,58,133,0.18)',
                    borderRadius: 9999,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: actualTheme === 'dark' ? '#BFDBFE' : '#083A85',
                    letterSpacing: '-0.005em',
                  }}>
                    <i className="bi bi-person-badge-fill" style={{ fontSize: 10, color: '#F20C8F' }} />
                    {formData.title || 'Client'}
                  </div>
                </div>

                {/* KYC Verification Banner */}
                {user?.kycStatus && user.kycStatus !== 'APPROVED' && user.customerType !== 'Viewer' && (() => {
                  const isPending = user.kycStatus === 'PENDING';
                  const isRejected = user.kycStatus === 'REJECTED';
                  const tone = isPending ? 'warning' : isRejected ? 'danger' : 'info';
                  const t = {
                    warning: { stripe: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)', icon: 'bi-shield-exclamation', heading: '#B45309', iconColor: '#D97706' },
                    danger:  { stripe: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)', icon: 'bi-shield-x', heading: '#B91C1C', iconColor: '#DC2626' },
                    info:    { stripe: 'linear-gradient(180deg, #083A85 0%, #F20C8F 100%)', icon: 'bi-shield-fill-check', heading: '#1E40AF', iconColor: '#083A85' },
                  }[tone];
                  const bg = isPending
                    ? (actualTheme === 'dark' ? 'rgba(245,158,11,0.14)' : 'rgba(254,243,199,0.55)')
                    : isRejected
                    ? (actualTheme === 'dark' ? 'rgba(220,38,38,0.16)' : 'rgba(254,242,242,0.85)')
                    : (actualTheme === 'dark' ? 'rgba(8,58,133,0.18)' : 'rgba(239,246,255,0.85)');
                  const border = isPending
                    ? (actualTheme === 'dark' ? 'rgba(245,158,11,0.40)' : 'rgba(245,158,11,0.30)')
                    : isRejected
                    ? (actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)')
                    : (actualTheme === 'dark' ? 'rgba(8,58,133,0.40)' : 'rgba(8,58,133,0.22)');
                  return (
                    <div style={{
                      padding: '0.85rem 0.95rem 0.95rem',
                      margin: '0 1.25rem 1rem',
                      borderRadius: 12,
                      background: bg,
                      border: `1px solid ${border}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                        background: t.stripe,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.35rem', paddingLeft: 6 }}>
                        <i className={`bi ${t.icon}`} style={{ fontSize: 14, color: t.iconColor }} />
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 800,
                          color: actualTheme === 'dark' ? '#fff' : t.heading,
                          letterSpacing: '-0.005em',
                        }}>
                          {isPending ? 'KYC Under Review' : isRejected ? 'KYC Rejected' : 'KYC Required'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.78rem', margin: 0, lineHeight: 1.5,
                        paddingLeft: 6,
                        color: actualTheme === 'dark' ? '#E5E7EB' : t.heading,
                        opacity: actualTheme === 'dark' ? 0.92 : 1,
                      }}>
                        {isPending
                          ? 'Your identity verification is being reviewed.'
                          : isRejected
                          ? 'Your KYC was rejected. Please resubmit.'
                          : 'Complete identity verification to enable withdrawals.'}
                      </p>
                      {!isPending && (
                        <button onClick={() => setShowKycModal(true)} style={{
                          marginTop: '0.65rem',
                          marginLeft: 6,
                          padding: '0.5rem 0.9rem',
                          fontSize: '0.78rem', fontWeight: 700,
                          letterSpacing: '-0.005em',
                          border: 'none', borderRadius: 9, cursor: 'pointer',
                          background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                          color: 'white',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(242,12,143,0.32)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.28)'; }}
                        >
                          <i className="bi bi-shield-check" style={{ fontSize: 12 }} />
                          {isRejected ? 'Resubmit KYC' : 'Complete KYC'}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Account Activity */}
                <div className="mobile-profile-card-activity" style={{
                  borderTop: `1px solid ${colors.borderPrimary}`,
                  padding: '1.1rem 1.25rem 1.25rem'
                }}>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: '0.75rem',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <i className="bi bi-activity" style={{ fontSize: 11 }} />
                    Account Activity
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.7rem',
                      background: colors.bgTertiary,
                      borderRadius: 9,
                      border: `1px solid ${colors.borderPrimary}`,
                    }}>
                      <span style={{ fontSize: '0.82rem', color: colors.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <i className="bi bi-clock-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                        Last Login
                      </span>
                      <span style={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: 700, letterSpacing: '-0.005em' }}>Today</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.7rem',
                      background: colors.bgTertiary,
                      borderRadius: 9,
                      border: `1px solid ${colors.borderPrimary}`,
                    }}>
                      <span style={{ fontSize: '0.82rem', color: colors.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <i className="bi bi-calendar-heart-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                        Joined Since
                      </span>
                      <span style={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: 700, letterSpacing: '-0.005em' }}>
                        {user?.joinedFrom ? new Date(user.joinedFrom).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Personal Information Form */}
            <div className="mobile-profile-right mobile-card" style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              padding: '1.5rem',
              boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.12)',
              border: `1px solid ${colors.borderPrimary}`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <span aria-hidden style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              }} />
              {/* Header with Edit Toggle */}
              <div className="mobile-section-actions" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.12) 0%, rgba(242,12,143,0.10) 100%)',
                    border: '1px solid rgba(8,58,133,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className="bi bi-person-vcard-fill" style={{ fontSize: 14, color: '#083A85' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 1,
                    }}>Your details</div>
                    <h2 style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}>Personal Information</h2>
                  </div>
                </div>

                {/* Edit Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: colors.textSecondary,
                    letterSpacing: '-0.005em',
                  }}>Edit</span>
                  <button
                    onClick={() => setIsEditEnabled(!isEditEnabled)}
                    aria-pressed={isEditEnabled}
                    aria-label={isEditEnabled ? 'Disable editing' : 'Enable editing'}
                    style={{
                      width: 50,
                      height: 28,
                      borderRadius: 14,
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      background: isEditEnabled
                        ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                        : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                      boxShadow: isEditEnabled ? '0 6px 14px rgba(242,12,143,0.30), inset 0 0 0 1px rgba(255,255,255,0.20)' : 'inset 0 1px 3px rgba(0,0,0,0.10)',
                      transition: 'background 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: isEditEnabled ? 25 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.20)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`bi ${isEditEnabled ? 'bi-pencil-fill' : 'bi-lock-fill'}`} style={{
                        fontSize: 9,
                        color: isEditEnabled ? '#F20C8F' : '#9CA3AF',
                      }} />
                    </div>
                  </button>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: isEditEnabled ? '#F20C8F' : (actualTheme === 'dark' ? '#9CA3AF' : '#6B7280'),
                    letterSpacing: '-0.005em',
                    minWidth: 60,
                  }}>
                    {isEditEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div className="mobile-form-grid-2" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.25rem'
              }}>
                {/* Full Name */}
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    disabled={!isEditEnabled}
                    style={validationErrors.fullName ? inputErrorStyle : inputStyle}
                  />
                  {validationErrors.fullName && (
                    <span style={errorMessageStyle}>{validationErrors.fullName}</span>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    disabled={!isEditEnabled}
                    style={validationErrors.username ? inputErrorStyle : inputStyle}
                  />
                  {validationErrors.username && (
                    <span style={errorMessageStyle}>{validationErrors.username}</span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true}
                    style={{...inputStyle, backgroundColor: colors.bgTertiary, cursor: 'not-allowed'}}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Phone</label>
                  <InternationalPhoneInput
                    key={`${savedPhone.country?.iso2 ?? 'none'}-${savedPhone.nsn}`}
                    defaultIso2={savedPhone.country?.iso2}
                    initialNsn={savedPhone.nsn}
                    disabled={!isEditEnabled}
                    dark={actualTheme === 'dark'}
                    ariaLabel="Phone number"
                    onChange={(value) => setPhoneValue(value)}
                  />
                </div>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    disabled={true}
                    style={{...inputStyle, backgroundColor: colors.bgTertiary, cursor: 'not-allowed'}}
                  />
                </div>

                {/* Country */}
                <div>
                  <label style={labelStyle}>Country</label>
                  <CountrySelect
                    countries={eastAfricanCountries}
                    value={formData.country}
                    onChange={(val) => {
                      handleInputChange('country', val);
                      if (val !== 'Rwanda') {
                        setFormData(prev => ({ ...prev, province: '', district: '', sector: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, province: 'Kigali City', district: 'Gasabo', sector: '' }));
                      }
                    }}
                    valueKey="name"
                    displayKey="name"
                    disabled={!isEditEnabled}
                    inputStyle={{ ...inputStyle, cursor: isEditEnabled ? 'pointer' : 'not-allowed' }}
                    colors={colors}
                    actualTheme={actualTheme}
                  />
                </div>

                {/* Province - Only show dropdown for Rwanda */}
                <div>
                  <label style={labelStyle}>Province</label>
                  {formData.country === 'Rwanda' ? (
                    <select
                      value={formData.province}
                      onChange={(e) => {
                        handleInputChange('province', e.target.value);
                        // Reset district when province changes
                        const districts = rwandaProvinces[e.target.value] || [];
                        setFormData(prev => ({ ...prev, province: e.target.value, district: districts[0] || '', sector: '' }));
                      }}
                      disabled={!isEditEnabled}
                      style={{
                        ...inputStyle,
                        cursor: isEditEnabled ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {Object.keys(rwandaProvinces).map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      disabled={!isEditEnabled}
                      placeholder="Enter province/region"
                      style={inputStyle}
                    />
                  )}
                </div>

                {/* District */}
                <div>
                  <label style={labelStyle}>District</label>
                  {formData.country === 'Rwanda' && formData.province ? (
                    <select
                      value={formData.district}
                      onChange={(e) => {
                        handleInputChange('district', e.target.value);
                        setFormData(prev => ({ ...prev, district: e.target.value, sector: '' }));
                      }}
                      disabled={!isEditEnabled}
                      style={{
                        ...inputStyle,
                        cursor: isEditEnabled ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {(rwandaProvinces[formData.province] || []).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      disabled={!isEditEnabled}
                      placeholder="Enter district"
                      style={inputStyle}
                    />
                  )}
                </div>

                {/* Sector */}
                <div>
                  <label style={labelStyle}>Sector</label>
                  <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    disabled={!isEditEnabled}
                    placeholder="Enter sector"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Update Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1.5rem'
              }}>
                <button
                  disabled={!isEditEnabled || isSaving}
                  onClick={handleSaveProfile}
                  style={{
                    backgroundColor: isEditEnabled && !isSaving ? '#083A85' : '#9CA3AF',
                    color: 'white',
                    border: isEditEnabled ? '2px solid #062a63' : '2px solid #6B7280',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isEditEnabled && !isSaving ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (isEditEnabled && !isSaving) {
                      e.currentTarget.style.backgroundColor = '#062a63';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isEditEnabled && !isSaving) {
                      e.currentTarget.style.backgroundColor = '#083A85';
                    }
                  }}
                >
                  {isSaving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Verification Modal */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={() => setShowKycModal(false)}
        colors={colors}
        actualTheme={actualTheme}
      />
    </div>
  );
};

export default ProfilePage;
