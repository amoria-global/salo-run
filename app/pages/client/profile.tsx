"use client";

import React, { useState } from 'react';
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

  // Form state
  const [formData, setFormData] = useState({
    fullName: 'Diane Marry',
    username: 'diane_marry',
    email: 'dianemarry@gmail.com',
    phone: '+250 788 123 456',
    title: 'Client',
    country: 'Rwanda',
    companyName: 'Personal',
    workLocation: 'Kigali, Rwanda',
    availabilityDays: 'Weekends',
    availableTime: '10:00 AM - 6:00 PM',
    bio: 'Passionate about capturing life\'s precious moments. Looking for talented photographers for weddings, events, and family portraits.'
  });

  const handleInputChange = (field: string, value: string) => {
    if (isEditEnabled) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #E5E7EB',
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
        <Topbar />

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
                {/* Cover Photo */}
                <div style={{
                  height: '100px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative'
                }}>
                  <button style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CameraIcon />
                  </button>
                </div>

                {/* Avatar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '-50px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Image
                      src="https://randomuser.me/api/portraits/women/65.jpg"
                      alt="Profile"
                      width={100}
                      height={100}
                      style={{
                        borderRadius: '50%',
                        border: '4px solid white',
                        objectFit: 'cover'
                      }}
                    />
                    <button style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      backgroundColor: '#083A85',
                      border: 'none',
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

                {/* About Section */}
                <div style={{
                  borderTop: '1px solid #E5E7EB',
                  padding: '1.25rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '0.75rem'
                  }}>About</h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#6B7280',
                    lineHeight: '1.5'
                  }}>
                    Passionate about capturing life&apos;s precious moments. Looking for
                    talented photographers for weddings and events.
                  </p>
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Country */}
                <div>
                  <label style={labelStyle}>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label style={labelStyle}>Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Work Location */}
                <div>
                  <label style={labelStyle}>Work Location</label>
                  <input
                    type="text"
                    value={formData.workLocation}
                    onChange={(e) => handleInputChange('workLocation', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Availability Days */}
                <div>
                  <label style={labelStyle}>Availability Days</label>
                  <input
                    type="text"
                    value={formData.availabilityDays}
                    onChange={(e) => handleInputChange('availabilityDays', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Available Time */}
                <div>
                  <label style={labelStyle}>Available Time</label>
                  <input
                    type="text"
                    value={formData.availableTime}
                    onChange={(e) => handleInputChange('availableTime', e.target.value)}
                    disabled={!isEditEnabled}
                    style={inputStyle}
                  />
                </div>

                {/* Bio - Full Width */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditEnabled}
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: '100px'
                    }}
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
                    border: 'none',
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
