"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

// Icons for dropdown menu
const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#374151" strokeWidth="2"/>
    <path d="M5 20C5 17.2386 7.23858 15 10 15H14C16.7614 15 19 17.2386 19 20" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PreferencesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="8" r="2" stroke="#374151" strokeWidth="2"/>
    <circle cx="6" cy="16" r="2" stroke="#374151" strokeWidth="2"/>
    <line x1="10" y1="8" x2="20" y2="8" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
    <line x1="10" y1="16" x2="20" y2="16" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="8" x2="4" y2="8" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="16" x2="4" y2="16" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16,17 21,12 16,7" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '1.2rem',
      paddingRight: '1.2rem',
      paddingTop: '0.4rem',
      paddingBottom: '0.4rem',
      backgroundColor: 'white',
      borderRadius: '9999px',
      marginLeft: '1.5rem',
      marginRight: '1.5rem',
      marginTop: '0.75rem',
      marginBottom: '0.75rem',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      {/* Left side - Dashboard title */}
      <h1 style={{
        fontSize: '1.35rem',
        lineHeight: '1.75rem',
        color: '#4B5563'
      }}>Dashboard</h1>

      {/* Right side - Notification, Bonus, and Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Notification Bell */}
        <div style={{
          position: 'relative',
          cursor: 'pointer'
        }}>
          <i style={{
            fontSize: '1.35rem',
            lineHeight: '1.75rem',
            color: '#374151'
          }} className="bi bi-bell"></i>
          <span style={{
            position: 'absolute',
            top: '-0.55rem',
            right: '-0.45rem',
            backgroundColor: '#EC4899',
            color: 'white',
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '9999px',
            width: '1.3rem',
            height: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            9+
          </span>
        </div>

        {/* Bonus */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '1.12rem',
            lineHeight: '1.5rem',
            fontWeight: '600',
            color: '#111827'
          }}>Bonus:</span>
          <span style={{
            fontSize: '1.15rem',
            lineHeight: '1.5rem',
            fontWeight: '600',
            color: '#083A85'
          }}>$3.00</span>
        </div>

        {/* Profile with Dropdown */}
        <div
          ref={dropdownRef}
          style={{
            position: 'relative'
          }}
        >
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <Image
              src="https://randomuser.me/api/portraits/women/65.jpg"
              alt="Profile"
              width={40}
              height={40}
              style={{
                borderRadius: '9999px',
                objectFit: 'cover',
                width: '2.5rem',
                height: '2.5rem'
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{
                fontSize: '1.12rem',
                lineHeight: '1.5rem',
                fontWeight: '700',
                color: '#083A85'
              }}>Diane Mary</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1.5rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>$0.00</span>
                <i style={{
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  color: '#374151',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} className="bi bi-chevron-down"></i>
              </div>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.75rem)',
              right: 0,
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E5E7EB',
              padding: '1.25rem',
              minWidth: '220px',
              zIndex: 50
            }}>
              {/* User Info Header */}
              <div style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#083A85',
                  marginBottom: '0.25rem'
                }}>
                  Diane Marry
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#374151'
                }}>
                  ID: <span style={{ color: '#EC4899', fontWeight: '600' }}>12004573</span>
                </div>
              </div>

              {/* Menu Items */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <a
                  href="/user/client/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ProfileIcon />
                  Profile settings
                </a>

                <a
                  href="/preferences"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <PreferencesIcon />
                  Preferences
                </a>

                <a
                  href="/logout"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogoutIcon />
                  Logout
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
