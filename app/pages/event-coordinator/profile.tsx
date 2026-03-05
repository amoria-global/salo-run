"use client";

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';

function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

// API response types for coordinator profile
interface CoordinatorProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  organizationName?: string;
  businessType?: string;
  taxId?: string;
  businessAddress?: string;
  website?: string;
}

interface ApiResponse<T = unknown> {
  action: number;
  message?: string;
  data?: T;
}

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

  // East African countries with phone codes
  const eastAfricanCountries = [
    { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
    { name: 'Uganda', code: '+256', flag: '🇺🇬' },
    { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
    { name: 'Burundi', code: '+257', flag: '🇧🇮' },
    { name: 'South Sudan', code: '+211', flag: '🇸🇸' },
  ];

  // Rwanda provinces and districts
  const rwandaProvinces: { [key: string]: string[] } = {
    'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
  };

  // Form state - uses profile data from context, business fields loaded from API
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    username: profile.username,
    email: profile.email,
    phoneCode: profile.phoneCode,
    phoneNumber: profile.phoneNumber,
    title: 'Event Coordinator',
    country: profile.country,
    province: profile.province,
    district: profile.district,
    sector: profile.sector,
    organizationName: '',
    businessType: '',
    taxId: '',
    businessAddress: '',
    website: ''
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
        country: profile.country || prev.country,
        province: profile.province || prev.province,
        district: profile.district || prev.district,
        sector: profile.sector || prev.sector,
      }));
    }
  }, [profile.fullName, profile.username, profile.email, profile.phoneCode, profile.phoneNumber, profile.country, profile.province, profile.district, profile.sector]);

  // Load coordinator business fields from API
  useEffect(() => {
    if (!token) return;
    const loadProfile = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/profile`);
        if (response.ok) {
          const result = await response.json();
          const data = result?.data;
          if (data) {
            setFormData(prev => ({
              ...prev,
              organizationName: data.organizationName || prev.organizationName,
              businessType: data.businessType || prev.businessType,
              taxId: data.taxId || prev.taxId,
              businessAddress: data.businessAddress || prev.businessAddress,
              website: data.website || prev.website,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load coordinator profile:', err);
      }
    };
    loadProfile();
  }, [token]);

  // Save profile to API
  const handleSaveProfile = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const apiUrl = getApiUrl();
      const [firstName, ...lastParts] = formData.fullName.trim().split(' ');
      const lastName = lastParts.join(' ');

      const payload: CoordinatorProfilePayload = {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: `${formData.phoneCode}${formData.phoneNumber.replace(/\s/g, '')}`,
        address: [formData.sector, formData.district, formData.province, formData.country].filter(Boolean).join(', '),
        organizationName: formData.organizationName,
        businessType: formData.businessType,
        taxId: formData.taxId,
        businessAddress: formData.businessAddress,
        website: formData.website,
      };

      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || result.action !== 1) {
        throw new Error(result.message || `Failed to save: ${response.status}`);
      }

      alert('Profile updated successfully!');
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

      // Upload to API via dedicated profile picture endpoint
      if (token) {
        setIsUploadingImage(true);
        try {
          const apiUrl = getApiUrl();
          const uploadData = new FormData();
          uploadData.append('profilePicture', file);
          const response = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/profile/picture`, {
            method: 'POST',
            body: uploadData,
          });
          if (!response.ok) {
            console.error('Failed to upload profile picture:', response.status);
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
      backgroundColor: colors.bgPrimary
    }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
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
      `}</style>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="event-coordinator" />

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
                  }}>Event Coordinator</p>
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
                    <select
                      value={formData.phoneCode}
                      onChange={(e) => handleInputChange('phoneCode', e.target.value)}
                      disabled={!isEditEnabled}
                      style={{
                        ...inputStyle,
                        width: '120px',
                        cursor: isEditEnabled ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {eastAfricanCountries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
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
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      handleInputChange('country', e.target.value);
                      // Reset province, district, sector when country changes
                      if (e.target.value !== 'Rwanda') {
                        setFormData(prev => ({ ...prev, province: '', district: '', sector: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, province: 'Kigali City', district: 'Gasabo', sector: '' }));
                      }
                    }}
                    disabled={!isEditEnabled}
                    style={{
                      ...inputStyle,
                      cursor: isEditEnabled ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {eastAfricanCountries.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
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

              {/* Business Information Section */}
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: colors.textPrimary,
                marginTop: '2rem',
                marginBottom: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: `2px solid ${colors.borderPrimary}`
              }}>Business Information</h2>

              <div className="mobile-form-grid-2" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.25rem'
              }}>
                {/* Organization Name */}
                <div>
                  <label style={labelStyle}>Organization Name</label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    disabled={!isEditEnabled}
                    placeholder="Enter organization name"
                    style={inputStyle}
                  />
                </div>

                {/* Business Type */}
                <div>
                  <label style={labelStyle}>Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    disabled={!isEditEnabled}
                    style={{
                      ...inputStyle,
                      cursor: isEditEnabled ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select business type</option>
                    <option value="Event Management Company">Event Management Company</option>
                    <option value="Concert & Festival Organizer">Concert & Festival Organizer</option>
                    <option value="Wedding & Ceremony Planner">Wedding & Ceremony Planner</option>
                    <option value="Corporate Event Agency">Corporate Event Agency</option>
                    <option value="Sports & Entertainment Venue">Sports & Entertainment Venue</option>
                    <option value="Theater & Performing Arts">Theater & Performing Arts</option>
                    <option value="Nightclub & Lounge">Nightclub & Lounge</option>
                    <option value="Music Production Company">Music Production Company</option>
                    <option value="Film & Media Production">Film & Media Production</option>
                    <option value="Broadcasting & Streaming Service">Broadcasting & Streaming Service</option>
                    <option value="Artist Management Agency">Artist Management Agency</option>
                    <option value="Talent & Booking Agency">Talent & Booking Agency</option>
                    <option value="PR & Marketing Agency">PR & Marketing Agency</option>
                    <option value="Hotel & Hospitality">Hotel & Hospitality</option>
                    <option value="Conference & Convention Center">Conference & Convention Center</option>
                    <option value="Religious Organization">Religious Organization</option>
                    <option value="Non-Profit & Charity">Non-Profit & Charity</option>
                    <option value="Educational Institution">Educational Institution</option>
                    <option value="Government Agency">Government Agency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Tax ID */}
                <div>
                  <label style={labelStyle}>Tax ID / TIN</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    disabled={!isEditEnabled}
                    placeholder="Enter tax ID"
                    style={inputStyle}
                  />
                </div>

                {/* Business Address */}
                <div>
                  <label style={labelStyle}>Business Address</label>
                  <input
                    type="text"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    disabled={!isEditEnabled}
                    placeholder="Enter business address"
                    style={inputStyle}
                  />
                </div>

                {/* Website */}
                <div>
                  <label style={labelStyle}>Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditEnabled}
                    placeholder="Enter website URL"
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
