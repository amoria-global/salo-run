"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';

// Icons
const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaymentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V22M3 12H21" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8C12 8 12 5 9.5 5C7 5 7 8 9.5 8H12M12 8C12 8 12 5 14.5 5C17 5 17 8 14.5 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Notification types specific to photographers
type NotificationType = 'payment' | 'tip' | 'bonus' | 'security' | 'album' | 'review';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  amount?: number;
  actionUrl?: string;
}

// Sample notifications data for photographer
const photographerNotifications: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $450.00 from Sarah Johnson for Wedding Photography package',
    timestamp: '2 minutes ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    amount: 450.00,
    actionUrl: '/user/photographer/transaction'
  },
  {
    id: '2',
    type: 'tip',
    title: 'New Tip Received',
    message: 'Michael Chen sent you a $25.00 tip for excellent service!',
    timestamp: '15 minutes ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    amount: 25.00
  },
  {
    id: '3',
    type: 'security',
    title: 'New Login Detected',
    message: 'A new login was detected from Chrome on Windows 11. Location: Kigali, Rwanda',
    timestamp: '1 hour ago',
    read: false,
    actionUrl: '/user/photographer/profile'
  },
  {
    id: '4',
    type: 'bonus',
    title: 'Referral Bonus Earned',
    message: 'You earned a $15.00 bonus for referring David Park to Amoria!',
    timestamp: '2 hours ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    amount: 15.00
  },
  {
    id: '5',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $1,200.00 from Emily Rodriguez for Corporate Event package',
    timestamp: '3 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    amount: 1200.00,
    actionUrl: '/user/photographer/transaction'
  },
  {
    id: '6',
    type: 'review',
    title: 'New 5-Star Review',
    message: 'Lisa Thompson left you a 5-star review: "Amazing photographer! Highly recommended!"',
    timestamp: '5 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'
  },
  {
    id: '7',
    type: 'tip',
    title: 'New Tip Received',
    message: 'James Wilson sent you a $50.00 tip with message: "Great work on the family portraits!"',
    timestamp: '6 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    amount: 50.00
  },
  {
    id: '8',
    type: 'security',
    title: 'Password Changed',
    message: 'Your password was successfully changed. If this wasn\'t you, please contact support.',
    timestamp: 'Yesterday',
    read: true
  },
  {
    id: '9',
    type: 'bonus',
    title: 'Monthly Performance Bonus',
    message: 'Congratulations! You earned a $75.00 performance bonus for completing 10+ bookings this month.',
    timestamp: 'Yesterday',
    read: true,
    amount: 75.00
  },
  {
    id: '10',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $350.00 from Alex Chen for Portrait Session',
    timestamp: '2 days ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    amount: 350.00,
    actionUrl: '/user/photographer/transaction'
  },
  {
    id: '11',
    type: 'security',
    title: 'Two-Factor Authentication Enabled',
    message: 'Two-factor authentication has been enabled on your account for enhanced security.',
    timestamp: '3 days ago',
    read: true
  },
  {
    id: '12',
    type: 'review',
    title: 'New 4-Star Review',
    message: 'Robert Kim left you a 4-star review: "Professional and creative. Would book again."',
    timestamp: '4 days ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg'
  }
];

const Notifications = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const [notifications, setNotifications] = useState(photographerNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'payment':
        return { icon: <PaymentIcon />, bg: actualTheme === 'dark' ? '#14532D' : '#DCFCE7', color: actualTheme === 'dark' ? '#4ADE80' : '#16A34A' };
      case 'tip':
        return { icon: <GiftIcon />, bg: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', color: actualTheme === 'dark' ? '#FCD34D' : '#F59E0B' };
      case 'bonus':
        return { icon: <StarIcon />, bg: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE', color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB' };
      case 'security':
        return { icon: <ShieldIcon />, bg: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2', color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' };
      case 'album':
        return { icon: <ImageIcon />, bg: actualTheme === 'dark' ? '#581C87' : '#F3E8FF', color: actualTheme === 'dark' ? '#C084FC' : '#9333EA' };
      case 'review':
        return { icon: <StarIcon />, bg: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', color: actualTheme === 'dark' ? '#FCD34D' : '#F59E0B' };
      default:
        return { icon: <BellIcon />, bg: colors.bgTertiary, color: colors.textSecondary };
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const filterOptions: { value: 'all' | NotificationType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'payment', label: 'Payments' },
    { value: 'tip', label: 'Tips' },
    { value: 'bonus', label: 'Bonuses' },
    { value: 'security', label: 'Security' },
    { value: 'review', label: 'Reviews' }
  ];

  return (
    <>
      <style jsx>{`
        /* Desktop styles */
        .notifications-container {
          display: flex;
          height: 100vh;
          background-color: ${colors.bgPrimary};
        }

        .notifications-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .notifications-main {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background-color: ${colors.bgCard};
          border-radius: 0.75rem;
          padding: 1.25rem;
          border: 2px solid ${colors.borderPrimary};
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .settings-panel {
          background-color: ${colors.bgCard};
          border-radius: 0.75rem;
          border: 2px solid ${colors.borderPrimary};
          padding: 1.5rem;
          box-shadow: ${colors.shadowLg};
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .settings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 2px solid ${colors.borderPrimary};
        }

        .settings-item:last-child {
          border-bottom: none;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .notifications-main {
            padding: 0.75rem !important;
          }

          .notifications-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }

          .header-actions {
            width: 100% !important;
            justify-content: space-between !important;
          }

          .stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 0.5rem !important;
          }

          .stat-card {
            aspect-ratio: 1 / 1 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
            padding: 0.75rem !important;
          }

          .stat-card > div:first-child {
            font-size: 0.7rem !important;
            margin-bottom: 0.15rem !important;
          }

          .stat-card > div:last-child {
            font-size: 1.1rem !important;
          }

          .filters-section {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }

          .filter-buttons {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
          }

          .settings-modal-overlay {
            padding: 0.5rem !important;
          }

          .settings-panel {
            padding: 1rem !important;
            max-height: 85vh !important;
          }

          .settings-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            padding-bottom: 0.75rem !important;
          }

          .settings-item > div:first-child {
            width: 100% !important;
          }
        }

        /* Extra small mobile (phones in portrait) */
        @media (max-width: 480px) {
          .notifications-main {
            padding: 0.5rem !important;
          }

          .stats-grid {
            gap: 0.4rem !important;
          }

          .stat-card {
            padding: 0.5rem !important;
          }

          .stat-card > div:first-child {
            font-size: 0.65rem !important;
          }

          .stat-card > div:last-child {
            font-size: 1rem !important;
          }
        }
      `}</style>

      <div className="notifications-container">
        <Sidebar />

        <div className="notifications-content">
          <Topbar userRole="photographer" />

          <div className="notifications-main">
          {/* Header */}
          <div className="notifications-header">
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: colors.textPrimary,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#EF4444',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px'
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p style={{
                fontSize: '0.95rem',
                color: colors.textSecondary,
                marginTop: '0.25rem'
              }}>
                Stay updated with your payments, tips, bonuses, and account activity
              </p>
            </div>

            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: colors.bgCard,
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <CheckIcon />
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '0.625rem',
                  backgroundColor: colors.bgCard,
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title="Notification Settings"
              >
                <SettingsIcon />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Notifications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.brandPrimary }}>{notifications.length}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Unread</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{unreadCount}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Payments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                {notifications.filter(n => n.type === 'payment').length}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Tips & Bonuses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>
                {notifications.filter(n => n.type === 'tip' || n.type === 'bonus').length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-buttons">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: activeFilter === option.value ? 'none' : `2px solid ${colors.borderPrimary}`,
                    backgroundColor: activeFilter === option.value ? '#083A85' : colors.bgCard,
                    color: activeFilter === option.value ? 'white' : colors.textSecondary,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {notifications.some(n => n.read) && (
              <button
                onClick={deleteAllRead}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#DC2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s'
                }}
              >
                <TrashIcon />
                Clear read
              </button>
            )}
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Notifications List */}
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            border: `2px solid ${colors.borderPrimary}`,
            overflow: 'hidden'
          }}>
            {filteredNotifications.length === 0 ? (
              <div style={{
                padding: '4rem 1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: colors.bgTertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: colors.textSecondary
                }}>
                  <BellIcon />
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  margin: '0 0 0.5rem 0'
                }}>No notifications</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: colors.textSecondary,
                  margin: 0
                }}>
                  {activeFilter === 'all'
                    ? "You're all caught up!"
                    : `No ${activeFilter} notifications yet`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const iconStyle = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderBottom: index < filteredNotifications.length - 1 ? `2px solid ${colors.borderPrimary}` : 'none',
                      backgroundColor: notification.read ? colors.bgCard : (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF'),
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => markAsRead(notification.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? colors.bgTertiary : (actualTheme === 'dark' ? '#2D4A6F' : '#E0F2FE');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? colors.bgCard : (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF');
                    }}
                  >
                    {/* Icon or Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: notification.avatar ? 'transparent' : iconStyle.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: iconStyle.color,
                      overflow: 'hidden'
                    }}>
                      {notification.avatar ? (
                        <Image
                          src={notification.avatar}
                          alt=""
                          width={48}
                          height={48}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        iconStyle.icon
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.95rem',
                            fontWeight: notification.read ? '500' : '600',
                            color: colors.textPrimary
                          }}>
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6'
                            }} />
                          )}
                          {notification.amount && (
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: notification.type === 'payment' ? '#16A34A'
                                : notification.type === 'tip' ? '#F59E0B'
                                : '#2563EB',
                              backgroundColor: notification.type === 'payment' ? '#DCFCE7'
                                : notification.type === 'tip' ? '#FEF3C7'
                                : '#DBEAFE',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}>
                              +{formatPrice(notification.amount)}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap'
                        }}>
                          {notification.timestamp}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '0.875rem',
                        color: colors.textSecondary,
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {notification.message}
                      </p>

                      {/* Action buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginTop: '0.75rem'
                      }}>
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              color: '#083A85',
                              textDecoration: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View details
                          </Link>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            color: '#DC2626',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Notification Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}>
                <h2 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  margin: 0
                }}>
                  Notification Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    lineHeight: '1',
                    padding: 0
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {/* Email Notifications */}
                <div className="settings-item">
                  <div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: colors.textPrimary,
                      marginBottom: '0.25rem'
                    }}>
                      Email Notifications
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary
                    }}>
                      Receive email alerts for important notifications
                    </div>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#083A85',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s',
                        transform: 'translateX(24px)'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="settings-item">
                  <div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: colors.textPrimary,
                      marginBottom: '0.25rem'
                    }}>
                      Push Notifications
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary
                    }}>
                      Get instant push notifications on your device
                    </div>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#083A85',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s',
                        transform: 'translateX(24px)'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Payment Notifications */}
                <div className="settings-item">
                  <div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: colors.textPrimary,
                      marginBottom: '0.25rem'
                    }}>
                      Payment Notifications
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary
                    }}>
                      Notify me when I receive payments
                    </div>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#083A85',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s',
                        transform: 'translateX(24px)'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Tips & Bonuses Notifications */}
                <div className="settings-item">
                  <div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: colors.textPrimary,
                      marginBottom: '0.25rem'
                    }}>
                      Tips & Bonuses
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary
                    }}>
                      Notify me when I receive tips or bonuses
                    </div>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#083A85',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s',
                        transform: 'translateX(24px)'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Security Alerts */}
                <div className="settings-item">
                  <div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: colors.textPrimary,
                      marginBottom: '0.25rem'
                    }}>
                      Security Alerts
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: colors.textSecondary
                    }}>
                      Always notify me about security events (recommended)
                    </div>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#083A85',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s',
                        transform: 'translateX(24px)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
