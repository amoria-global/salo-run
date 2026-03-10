"use client";

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import CountrySelect, { eastAfricanCountries } from '../../components/CountrySelect';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

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
    if (!token) return;
    setIsSaving(true);
    try {
      const apiUrl = getApiUrl();
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const phone = `${formData.phoneCode}${formData.phoneNumber.replace(/\s/g, '')}`;
      const address = [formData.sector, formData.district, formData.province, formData.country].filter(Boolean).join(', ');

      const params = new URLSearchParams();
      if (firstName) params.append('firstName', firstName);
      if (lastName) params.append('lastName', lastName);
      if (phone) params.append('phone', phone);
      if (address) params.append('address', address);

      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/profile?${params.toString()}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }

      const result = await response.json();
      if (result.action === 1) {
        alert('Profile updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save profile');
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

  const handlePhoneNumberChange = (value: string) => {
    if (!isEditEnabled) return;
    // Allow only numbers and spaces (for formatting like "788 456 789")
    if (value === '' || /^[\d\s]*$/.test(value)) {
      handleInputChange('phoneNumber', value);
      setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
    } else {
      setValidationErrors(prev => ({ ...prev, phoneNumber: 'Only numbers and spaces allowed' }));
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to API
      if (token) {
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
            alert('Failed to upload profile picture. Please try again.');
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
    padding: '0.75rem 1rem',
    borderWidth: '2px',
    borderStyle: 'solid' as const,
    borderColor: colors.borderPrimary,
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    color: colors.textPrimary,
    backgroundColor: isEditEnabled ? colors.bgCard : colors.bgTertiary,
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#EF4444'
  };

  const errorMessageStyle = {
    color: '#EF4444',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    display: 'block'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: '0.5rem'
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
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${colors.borderPrimary}`
              }}>
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
                  marginTop: '1.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid white',
                      backgroundColor: colors.bgTertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      ) : (
                        <span style={{ fontSize: '2rem', color: colors.textSecondary, fontWeight: '600' }}>
                          {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
                        </span>
                      )}
                      {isUploadingImage && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #fff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => isEditEnabled && profileInputRef.current?.click()}
                      disabled={!isEditEnabled}
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        backgroundColor: isEditEnabled ? '#083A85' : '#9CA3AF',
                        border: isEditEnabled ? '2px solid #062a63' : '2px solid #6B7280',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isEditEnabled ? 1 : 0.5,
                      }}>
                      <CameraIcon />
                    </button>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="mobile-profile-card-name" style={{
                  textAlign: 'center',
                  padding: '1rem 1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                    marginBottom: '0.25rem'
                  }}>{formData.fullName || 'User'}</h2>
                  <p style={{
                    fontSize: '0.95rem',
                    color: colors.textSecondary
                  }}>{formData.title || 'Client'}</p>
                </div>

                {/* Account Activity */}
                <div className="mobile-profile-card-activity" style={{
                  borderTop: `2px solid ${colors.borderPrimary}`,
                  padding: '1.25rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: '0.75rem'
                  }}>Account Activity</h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Last Login</span>
                      <span style={{ fontSize: '0.9rem', color: colors.textPrimary, fontWeight: '500' }}>Today</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Joined Since</span>
                      <span style={{ fontSize: '0.9rem', color: colors.textPrimary, fontWeight: '500' }}>
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
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: `2px solid ${colors.borderPrimary}`
            }}>
              {/* Header with Edit Toggle */}
              <div className="mobile-section-actions" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: colors.textPrimary
                }}>Personal Information</h2>

                {/* Edit Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    color: colors.textSecondary
                  }}>Edit</span>
                  <button
                    onClick={() => setIsEditEnabled(!isEditEnabled)}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundColor: isEditEnabled ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: colors.bgCard,
                      position: 'absolute',
                      top: '2px',
                      left: isEditEnabled ? '24px' : '2px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                    }} />
                  </button>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: isEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : '#6B7280'
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <CountrySelect
                      countries={eastAfricanCountries}
                      value={formData.phoneCode}
                      onChange={(val) => handleInputChange('phoneCode', val)}
                      valueKey="code"
                      displayKey="code"
                      disabled={!isEditEnabled}
                      inputStyle={{ ...inputStyle, cursor: isEditEnabled ? 'pointer' : 'not-allowed' }}
                      colors={colors}
                      actualTheme={actualTheme}
                      width="140px"
                    />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      disabled={!isEditEnabled}
                      placeholder="788 123 456"
                      style={validationErrors.phoneNumber ? { ...inputErrorStyle, flex: 1 } : { ...inputStyle, flex: 1 }}
                    />
                  </div>
                  {validationErrors.phoneNumber && (
                    <span style={errorMessageStyle}>{validationErrors.phoneNumber}</span>
                  )}
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
    </div>
  );
};

export default ProfilePage;
