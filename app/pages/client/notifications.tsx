"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';

function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapBackendType(backendType: string): NotificationType {
  switch (backendType?.toUpperCase()) {
    case 'MEDIA': return 'album';
    case 'PAYMENT': return 'gift';
    case 'BOOKING': return 'booking';
    case 'EVENT': return 'photographer';
    case 'SYSTEM': return 'security';
    default: return 'album';
  }
}

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

// Mock data removed - notifications are now fetched from the backend API

interface NotificationsPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const ClientNotifications = ({ userRole = 'client' }: NotificationsPageProps) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { token, user } = useDashboardAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token || !user?.id) return;
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications?page=0&size=50`
        : `${apiUrl}/api/remote/customer/notifications?page=0&size=50`;
      const response = await dashboardAuthFetch(endpoint, { headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const result = await response.json();
      const data = result?.data?.content || result?.data || [];
      const mapped: Notification[] = data.map((n: { id: string; title: string; message: string; type: string; isRead: boolean; link?: string; createdAt: string }) => ({
        id: n.id,
        type: mapBackendType(n.type),
        title: n.title,
        message: n.message,
        timestamp: formatRelativeTime(n.createdAt),
        read: n.isRead,
        actionUrl: n.link || undefined,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.id) {
      fetchNotifications();
    }
  }, [token, user?.id]);

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

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      const apiUrl = getApiUrl();
      const readEndpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/${id}/read`
        : `${apiUrl}/api/remote/customer/notifications/${id}/read`;
      await dashboardAuthFetch(readEndpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
      window.dispatchEvent(new Event('badge-update'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getNotificationDest = (notification: Notification): string | null => {
    if (notification.actionUrl) return notification.actionUrl;
    switch (notification.type) {
      case 'booking': return userRole === 'event-coordinator' ? '/user/event-coordinator/events' : '/user/client/bookings';
      case 'gift': return '/user/client/payments';
      case 'photographer': return userRole === 'event-coordinator' ? '/user/event-coordinator/photographers' : '/user/client/photographers';
      case 'album': return userRole === 'event-coordinator' ? '/user/event-coordinator/gallery' : '/user/client/gallery';
      case 'streamfee': return '/user/event-coordinator/payments';
      default: return null;
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const apiUrl = getApiUrl();
      const readAllEndpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/read-all`
        : `${apiUrl}/api/remote/customer/notifications/read-all`;
      await dashboardAuthFetch(readAllEndpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
      window.dispatchEvent(new Event('badge-update'));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/${id}`
        : `${apiUrl}/api/remote/customer/notifications/${id}`;
      const res = await dashboardAuthFetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete notification. The server did not process the request.');
        fetchNotifications();
      }
    } catch {
      alert('Failed to delete notification. The feature may not be available yet.');
      fetchNotifications();
    }
  };

  const deleteAllRead = async () => {
    setNotifications(prev => prev.filter(n => !n.read));
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/delete-read`
        : `${apiUrl}/api/remote/customer/notifications/delete-read`;
      const res = await dashboardAuthFetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to clear read notifications. The server did not process the request.');
        fetchNotifications();
      }
    } catch {
      alert('Failed to clear read notifications. The feature may not be available yet.');
      fetchNotifications();
    }
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
          <Topbar userRole={userRole} />

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
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #083A85' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Notifications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{notifications.length}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Unread</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{unreadCount}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #9333EA' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>New Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9333EA' }}>
                {notifications.filter(n => n.type === 'album').length}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #16A34A' }}>
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
                        {(() => {
                          const dest = getNotificationDest(notification);
                          return dest ? (
                            <Link
                              href={dest}
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                                textDecoration: 'none',
                                backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '9999px',
                                display: 'inline-block'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.type === 'album' ? 'View album' : 'View details'}
                            </Link>
                          ) : null;
                        })()}
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
