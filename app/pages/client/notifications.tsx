"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

// Icons
const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V22M3 12H21" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8C12 8 12 5 9.5 5C7 5 7 8 9.5 8H12M12 8C12 8 12 5 14.5 5C17 5 17 8 14.5 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StreamFeeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 9.5C15 8.12 13.66 7 12 7C10.34 7 9 8.12 9 9.5C9 10.88 10.34 12 12 12C13.66 12 15 13.12 15 14.5C15 15.88 13.66 17 12 17C10.34 17 9 15.88 9 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Notification types specific to clients and event coordinators
type NotificationType = 'album' | 'gift' | 'security' | 'booking' | 'photographer' | 'streamfee';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  albumPreview?: string;
  amount?: number;
  actionUrl?: string;
}

// Sample notifications data for client dashboard
const clientNotifications: Notification[] = [
  {
    id: '1',
    type: 'album',
    title: 'New Album Received',
    message: 'John Studio shared "Wedding Ceremony" album with you - 156 photos',
    timestamp: '5 minutes ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg',
    albumPreview: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    actionUrl: '/user/client/gallery'
  },
  {
    id: '2',
    type: 'gift',
    title: 'Gift Received',
    message: 'You received a $50.00 gift credit from Amoria for being a loyal customer!',
    timestamp: '30 minutes ago',
    read: false,
    amount: 50.00
  },
  {
    id: '3',
    type: 'security',
    title: 'New Login Detected',
    message: 'Your account was accessed from Firefox on Windows 10. Location: Kigali, Rwanda',
    timestamp: '1 hour ago',
    read: false,
    actionUrl: '/user/client/profile'
  },
  {
    id: '4',
    type: 'album',
    title: 'New Album Received',
    message: 'Mary Shots shared "Birthday Party" album with you - 89 photos',
    timestamp: '2 hours ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    albumPreview: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    actionUrl: '/user/client/gallery'
  },
  {
    id: '5',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your photography session with Elite Photography has been confirmed for Dec 20, 2025',
    timestamp: '3 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    actionUrl: '/user/client/events'
  },
  {
    id: '6',
    type: 'gift',
    title: 'Welcome Gift',
    message: 'Welcome to Amoria! Here\'s a $25.00 gift credit to use on your first booking.',
    timestamp: '5 hours ago',
    read: true,
    amount: 25.00
  },
  {
    id: '7',
    type: 'photographer',
    title: 'Photographer Accepted Request',
    message: 'Sarah Lens accepted your photography request for the Fashion Shoot event',
    timestamp: '6 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    actionUrl: '/user/client/events'
  },
  {
    id: '8',
    type: 'security',
    title: 'Password Changed Successfully',
    message: 'Your password was successfully updated. If this wasn\'t you, contact support immediately.',
    timestamp: 'Yesterday',
    read: true
  },
  {
    id: '9',
    type: 'album',
    title: 'Album Updated',
    message: 'Alex Frames added 25 new photos to "Corporate Event" album',
    timestamp: 'Yesterday',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg',
    albumPreview: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=400',
    actionUrl: '/user/client/gallery'
  },
  {
    id: '10',
    type: 'gift',
    title: 'Referral Reward',
    message: 'You earned $15.00 gift credit for referring a friend to Amoria!',
    timestamp: '2 days ago',
    read: true,
    amount: 15.00
  },
  {
    id: '11',
    type: 'booking',
    title: 'Session Reminder',
    message: 'Reminder: Your family portrait session is tomorrow at 2:00 PM',
    timestamp: '2 days ago',
    read: true,
    actionUrl: '/user/client/events'
  },
  {
    id: '12',
    type: 'security',
    title: 'Two-Factor Authentication Enabled',
    message: 'Two-factor authentication has been enabled for your account security.',
    timestamp: '3 days ago',
    read: true
  }
];

// Sample notifications data for event coordinator dashboard
const eventCoordinatorNotifications: Notification[] = [
  {
    id: '1',
    type: 'album',
    title: 'New Album Received',
    message: 'John Studio shared "Tech Summit 2025" album with you - 245 photos',
    timestamp: '5 minutes ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg',
    albumPreview: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    actionUrl: '/user/event-coordinator/gallery'
  },
  {
    id: '2',
    type: 'streamfee',
    title: 'Stream Fee Payment Received',
    message: 'You received $3,675.00 from 245 viewers for "Tech Summit 2025" live stream',
    timestamp: '30 minutes ago',
    read: false,
    amount: 3675.00
  },
  {
    id: '3',
    type: 'security',
    title: 'New Login Detected',
    message: 'Your account was accessed from Firefox on Windows 10. Location: Kigali, Rwanda',
    timestamp: '1 hour ago',
    read: false,
    actionUrl: '/user/event-coordinator/profile'
  },
  {
    id: '4',
    type: 'streamfee',
    title: 'Stream Fee Payment Received',
    message: 'You received $2,100.00 from 140 viewers for "Music Festival Night" live stream',
    timestamp: '2 hours ago',
    read: false,
    amount: 2100.00
  },
  {
    id: '5',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your photography session with Elite Photography has been confirmed for Dec 20, 2025',
    timestamp: '3 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    actionUrl: '/user/event-coordinator/events'
  },
  {
    id: '6',
    type: 'streamfee',
    title: 'Withdrawal Completed',
    message: 'Your withdrawal of $5,000.00 to MTN Mobile Money has been processed successfully',
    timestamp: '5 hours ago',
    read: true,
    amount: 5000.00
  },
  {
    id: '7',
    type: 'photographer',
    title: 'Photographer Accepted Request',
    message: 'Sarah Lens accepted your photography request for the Corporate Gala event',
    timestamp: '6 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    actionUrl: '/user/event-coordinator/events'
  },
  {
    id: '8',
    type: 'security',
    title: 'Password Changed Successfully',
    message: 'Your password was successfully updated. If this wasn\'t you, contact support immediately.',
    timestamp: 'Yesterday',
    read: true
  },
  {
    id: '9',
    type: 'album',
    title: 'Album Updated',
    message: 'Alex Frames added 50 new photos to "Annual Conference" album',
    timestamp: 'Yesterday',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg',
    albumPreview: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=400',
    actionUrl: '/user/event-coordinator/gallery'
  },
  {
    id: '10',
    type: 'streamfee',
    title: 'New Viewers Joined',
    message: '89 new paid viewers joined your "Product Launch" live stream',
    timestamp: '2 days ago',
    read: true,
    amount: 1335.00
  },
  {
    id: '11',
    type: 'booking',
    title: 'Event Reminder',
    message: 'Reminder: Your corporate event photography session is tomorrow at 2:00 PM',
    timestamp: '2 days ago',
    read: true,
    actionUrl: '/user/event-coordinator/events'
  },
  {
    id: '12',
    type: 'security',
    title: 'Two-Factor Authentication Enabled',
    message: 'Two-factor authentication has been enabled for your account security.',
    timestamp: '3 days ago',
    read: true
  }
];

interface NotificationsPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const ClientNotifications = ({ userRole = 'client' }: NotificationsPageProps) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const initialNotifications = userRole === 'event-coordinator' ? eventCoordinatorNotifications : clientNotifications;
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'album':
        return { icon: <ImageIcon />, bg: actualTheme === 'dark' ? '#581C87' : '#F3E8FF', color: actualTheme === 'dark' ? '#C084FC' : '#9333EA' };
      case 'gift':
        return { icon: <GiftIcon />, bg: actualTheme === 'dark' ? '#14532D' : '#DCFCE7', color: actualTheme === 'dark' ? '#4ADE80' : '#16A34A' };
      case 'streamfee':
        return { icon: <StreamFeeIcon />, bg: actualTheme === 'dark' ? '#14532D' : '#DCFCE7', color: actualTheme === 'dark' ? '#4ADE80' : '#16A34A' };
      case 'security':
        return { icon: <ShieldIcon />, bg: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2', color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' };
      case 'booking':
        return { icon: <CalendarIcon />, bg: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE', color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB' };
      case 'photographer':
        return { icon: <CameraIcon />, bg: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', color: actualTheme === 'dark' ? '#FCD34D' : '#F59E0B' };
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

  const filterOptions: { value: 'all' | NotificationType; label: string }[] = userRole === 'event-coordinator'
    ? [
        { value: 'all', label: 'All' },
        { value: 'album', label: 'Albums' },
        { value: 'streamfee', label: 'Stream Fees' },
        { value: 'booking', label: 'Bookings' },
        { value: 'security', label: 'Security' }
      ]
    : [
        { value: 'all', label: 'All' },
        { value: 'album', label: 'Albums' },
        { value: 'gift', label: 'Gifts' },
        { value: 'booking', label: 'Bookings' },
        { value: 'security', label: 'Security' }
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

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .notifications-main {
            padding: 0.75rem !important;
            padding-bottom: 5rem !important;
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
        }

        /* Extra small mobile (phones in portrait) */
        @media (max-width: 480px) {
          .notifications-main {
            padding: 0.5rem !important;
            padding-bottom: 6rem !important;
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
          <Topbar userRole={userRole} giftAmount={userRole === 'client' ? 225.00 : undefined} liveStreamFeeAmount={userRole === 'event-coordinator' ? 3250.00 : undefined} />

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
                Stay updated with new albums, {userRole === 'event-coordinator' ? 'stream fees' : 'gifts'}, bookings, and account activity
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
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{notifications.length}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Unread</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{unreadCount}</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>New Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9333EA' }}>
                {notifications.filter(n => n.type === 'album').length}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
                {userRole === 'event-coordinator' ? 'Stream Fees' : 'Gifts Received'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                {notifications.filter(n => n.type === (userRole === 'event-coordinator' ? 'streamfee' : 'gift')).length}
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
                  backgroundColor: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2',
                  border: `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FECACA'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
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
                              color: '#16A34A',
                              backgroundColor: '#DCFCE7',
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

                      {/* Album Preview for album notifications */}
                      {notification.albumPreview && (
                        <div style={{
                          marginTop: '0.75rem',
                          width: '120px',
                          height: '80px',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <Image
                            src={notification.albumPreview}
                            alt="Album preview"
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}

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
                              color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                              textDecoration: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notification.type === 'album' ? 'View album' : 'View details'}
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
    </>
  );
};

export default ClientNotifications;
