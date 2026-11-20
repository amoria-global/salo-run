'use client';

// app/pages/event-coordinator/profile.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/app/components/sidebar';
import { platformAlert } from '@/app/components/PlatformAlert';
import Topbar from '@/app/components/topbar';
import CountrySelect, { eastAfricanCountries } from '@/app/components/CountrySelect';
import InternationalPhoneInput, { type PhoneValue } from '@/app/components/phone/InternationalPhoneInput';
import { parsePhone } from '@/lib/phone/phoneKit';
import { useTheme } from '@/app/context/ThemeContext';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, autoCapitalize, capitalizeWords } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';
import KycBadge from '@/app/components/KycBadge';
import KycVerificationModal from '@/app/components/KycVerificationModal';


export interface CoordinatorProfilePayload {
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

export interface ApiResponse<T = unknown> {
  action: number;
  message?: string;
  data?: T;
}

export function useCoordinatorProfile() {
  const { colors, actualTheme } = useTheme();
  const { profile, updateProfile } = useUserProfile();
  const { token, user } = useDashboardAuth();
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  // East African countries with phone codes
  // East African countries imported from CountrySelect component

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
        country: profile.country || prev.country,
        province: profile.province || prev.province,
        district: profile.district || prev.district,
        sector: profile.sector || prev.sector,
      }));
    }
  }, [profile.fullName, profile.username, profile.email, profile.phoneCode, profile.phoneNumber, profile.country, profile.province, profile.district, profile.sector]);

  // Load coordinator business fields from API
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

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
      const [firstName, ...lastParts] = capitalizeWords(formData.fullName.trim()).split(' ');
      const lastName = lastParts.join(' ');

      const payload: CoordinatorProfilePayload = {
        firstName: firstName || '',
        lastName: lastName || '',
        // International digits without '+' (e.g. "250788123456") — the
        // canonical wire format per the backend phone-format audit.
        phone: phoneValue?.digits || undefined,
        address: capitalizeWords(address),
        organizationName: capitalizeWords(formData.organizationName || ''),
        businessType: capitalizeWords(formData.businessType || ''),
        taxId: formData.taxId,
        businessAddress: capitalizeWords(formData.businessAddress || ''),
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

      // Keep the shared profile context in sync with the phone just saved
      // so other pages (payment prefills, etc.) pick it up immediately.
      if (phoneValue?.dial && phoneValue.nsn) {
        updateProfile({ phoneCode: `+${phoneValue.dial}`, phoneNumber: phoneValue.nsn });
      }
      platformAlert('Profile updated successfully!');
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

      // Upload to API via dedicated profile picture endpoint
      if (user) {
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


  return {
    colors,
    actualTheme,
    profile,
    updateProfile,
    token,
    user,
    isEditEnabled,
    setIsEditEnabled,
    isSaving,
    setIsSaving,
    isUploadingImage,
    setIsUploadingImage,
    showKycModal,
    setShowKycModal,
    rwandaProvinces,
    formData,
    setFormData,
    profileImage,
    setProfileImage,
    profileInputRef,
    validationErrors,
    setValidationErrors,
    phoneValue,
    setPhoneValue,
    savedPhone,
    handleSaveProfile,
    handleInputChange,
    handleFullNameChange,
    handleUsernameChange,
    handleProfileImageUpload,
    inputStyle,
    inputErrorStyle,
    errorMessageStyle,
    labelStyle,
  };
}

export type CoordinatorProfileController = ReturnType<typeof useCoordinatorProfile>;
