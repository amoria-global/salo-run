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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Sample notifications data
const notificationsData = [
  { id: 1, type: 'payment', title: 'Payment Received', message: 'You received $250.00 from Kagabo Innocent', time: '2 min ago', read: false },
  { id: 2, type: 'booking', title: 'New Booking', message: 'Wedding photography session booked for Dec 15', time: '15 min ago', read: false },
  { id: 3, type: 'system', title: 'Profile Updated', message: 'Your profile information was successfully updated', time: '1 hour ago', read: false },
  { id: 4, type: 'payment', title: 'Bonus Credited', message: 'Referral bonus of $3.00 has been credited', time: '2 hours ago', read: true },
  { id: 5, type: 'booking', title: 'Booking Reminder', message: 'Upcoming session with Penny Gloria tomorrow', time: '3 hours ago', read: true },
  { id: 6, type: 'system', title: 'New Feature', message: 'Check out the new transaction reports feature', time: '5 hours ago', read: true },
  { id: 7, type: 'payment', title: 'Payment Pending', message: 'Payment of $500.00 is awaiting approval', time: '1 day ago', read: true },
  { id: 8, type: 'booking', title: 'Session Completed', message: 'Corporate event photography marked complete', time: '1 day ago', read: true },
  { id: 9, type: 'system', title: 'Security Alert', message: 'New login detected from Chrome on Windows', time: '2 days ago', read: true },
];

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationsData);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return { bg: '#DCFCE7', color: '#16A34A', icon: '$' };
      case 'booking':
        return { bg: '#DBEAFE', color: '#2563EB', icon: '📅' };
      case 'system':
        return { bg: '#F3E8FF', color: '#9333EA', icon: '⚙' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', icon: '•' };
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
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
        <div
          ref={notificationsRef}
          style={{
            position: 'relative'
          }}
        >
          <div
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <i style={{
              fontSize: '1.35rem',
              lineHeight: '1.75rem',
              color: '#374151'
            }} className="bi bi-bell"></i>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-0.55rem',
                right: '-0.45rem',
                backgroundColor: '#EC4899',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '9999px',
                minWidth: '1.2rem',
                height: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 0.25rem'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.75rem)',
              right: '-100px',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E5E7EB',
              width: '360px',
              maxHeight: '480px',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px'
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <CheckIcon />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div style={{
                maxHeight: '380px',
                overflowY: 'auto'
              }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6B7280'
                  }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const iconStyle = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          padding: '0.875rem 1rem',
                          borderBottom: '1px solid #F3F4F6',
                          backgroundColor: notification.read ? 'white' : '#F0F9FF',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = notification.read ? '#F9FAFB' : '#E0F2FE';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#F0F9FF';
                        }}
                      >
                        {/* Icon */}
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: iconStyle.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{ color: iconStyle.color, fontSize: '0.9rem', fontWeight: '600' }}>
                            {iconStyle.icon}
                          </span>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                          }}>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: notification.read ? '500' : '600',
                              color: '#111827'
                            }}>
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#3B82F6',
                                flexShrink: 0,
                                marginTop: '0.25rem'
                              }} />
                            )}
                          </div>
                          <p style={{
                            fontSize: '0.8rem',
                            color: '#6B7280',
                            margin: '0.25rem 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {notification.message}
                          </p>
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#9CA3AF',
                            marginTop: '0.25rem',
                            display: 'block'
                          }}>
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '0.75rem',
                borderTop: '1px solid #E5E7EB',
                textAlign: 'center'
              }}>
                <a
                  href="/notifications"
                  style={{
                    color: '#2563EB',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  View all notifications
                </a>
              </div>
            </div>
          )}
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
