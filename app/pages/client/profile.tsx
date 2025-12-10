"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Camera icon for avatar edit
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
  </svg>
);

const ProfilePage = () => {
  const [isEditEnabled, setIsEditEnabled] = useState(false);

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

  // Form state
  const [formData, setFormData] = useState({
    fullName: 'Diane Marry',
    username: 'diane_marry',
    email: 'dianemarry@gmail.com',
    phoneCode: '+250',
    phoneNumber: '788 123 456',
    title: 'Client',
    country: 'Rwanda',
    province: 'Kigali City',
    district: 'Gasabo',
    sector: 'Kimironko',
    // Fields only for photographers/freelancers
    companyName: 'Personal',
    workLocation: 'Kigali, Rwanda',
    availabilityDays: 'Weekends',
    availableTime: '10:00 AM - 6:00 PM',
    bio: 'Passionate about capturing life\'s precious moments. Looking for talented photographers for weddings, events, and family portraits.'
  });

  // Profile image state
  const [profileImage, setProfileImage] = useState<string>('https://randomuser.me/api/portraits/women/65.jpg');

  // File input ref
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    if (isEditEnabled) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    color: '#374151',
    backgroundColor: isEditEnabled ? 'white' : '#F9FAFB',
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '500' as const,
    color: '#374151',
    marginBottom: '0.5rem'
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#F9FAFB'
    }}>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="client" giftAmount={225.00} />

        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#F9FAFB',
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          {/* Page Title */}
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1.25rem'
          }}>Profile</h1>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '1.5rem'
          }}>
            {/* Left Sidebar - Profile Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Profile Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E5E7EB'
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
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={100}
                      height={100}
                      style={{
                        borderRadius: '50%',
                        border: '4px solid white',
                        objectFit: 'cover'
                      }}
                    />
                    <button
                      onClick={() => profileInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        backgroundColor: '#083A85',
                        border: '2px solid #062a63',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                      <CameraIcon />
                    </button>
                  </div>
                </div>

                {/* Name and Role */}
                <div style={{
                  textAlign: 'center',
                  padding: '1rem 1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#083A85',
                    marginBottom: '0.25rem'
                  }}>Diane Marry</h2>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#6B7280'
                  }}>Client</p>
                </div>

                {/* Account Activity */}
                <div style={{
                  borderTop: '1px solid #E5E7EB',
                  padding: '1.25rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827',
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
                      <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Last Login</span>
                      <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '500' }}>Today, 2:30 PM</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Joined Since</span>
                      <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '500' }}>Jan 15, 2024</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>Last Updated</span>
                      <span style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '500' }}>Nov 20, 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Personal Information Form */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              {/* Header with Edit Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>Personal Information</h2>

                {/* Edit Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#6B7280'
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
                      backgroundColor: isEditEnabled ? '#083A85' : '#D1D5DB',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
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
                    color: isEditEnabled ? '#083A85' : '#6B7280'
                  }}>
                    {isEditEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{
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
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Username */}
                <div>
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true}
                    style={{...inputStyle, backgroundColor: '#F9FAFB', cursor: 'not-allowed'}}
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
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      disabled={!isEditEnabled}
                      placeholder="788 123 456"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    disabled={true}
                    style={{...inputStyle, backgroundColor: '#F9FAFB', cursor: 'not-allowed'}}
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

              {/* Update Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1.5rem'
              }}>
                <button
                  disabled={!isEditEnabled}
                  style={{
                    backgroundColor: isEditEnabled ? '#083A85' : '#9CA3AF',
                    color: 'white',
                    border: isEditEnabled ? '2px solid #062a63' : '2px solid #6B7280',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (isEditEnabled) {
                      e.currentTarget.style.backgroundColor = '#062a63';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isEditEnabled) {
                      e.currentTarget.style.backgroundColor = '#083A85';
                    }
                  }}
                >
                  Update
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
