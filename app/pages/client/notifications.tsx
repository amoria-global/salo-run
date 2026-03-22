"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

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

function mapBackendType(backendType: string, role: string = 'client'): NotificationType {
  switch (backendType?.toUpperCase()) {
    case 'MEDIA': case 'ALBUM': case 'GALLERY': return 'album';
    case 'PAYMENT': return role === 'event-coordinator' ? 'streamfee' : 'gift';
    case 'BOOKING': return 'booking';
    case 'EVENT': return 'booking';
    case 'SYSTEM': case 'SECURITY': return 'security';
    default: return 'booking';
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
        type: mapBackendType(n.type, userRole),
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
    // Ignore backend actionUrl — use role-aware routing instead
    const base = userRole === 'event-coordinator' ? '/user/event-coordinator' : '/user/client';
    switch (notification.type) {
      case 'booking': return `${base}/events`;
      case 'gift': return '/user/client/payments';
      case 'photographer': return userRole === 'event-coordinator' ? '/user/event-coordinator/home' : '/user/client/photographers';
      case 'album': return userRole === 'event-coordinator' ? '/user/event-coordinator/gallery' : '/user/client/gallery';
      case 'streamfee': return '/user/event-coordinator/payments';
      case 'security': return `${base}/profile`;
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
    const backup = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/${id}`
        : `${apiUrl}/api/remote/customer/notifications/${id}`;
      const res = await dashboardAuthFetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete notification.');
        if (backup) setNotifications(prev => [...prev, backup]);
      }
    } catch {
      alert('Failed to delete notification.');
      if (backup) setNotifications(prev => [...prev, backup]);
    }
  };

  const deleteAllRead = async () => {
    const backup = notifications.filter(n => n.read);
    setNotifications(prev => prev.filter(n => !n.read));
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/delete-read`
        : `${apiUrl}/api/remote/customer/notifications/delete-read`;
      const res = await dashboardAuthFetch(endpoint, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to clear read notifications.');
        setNotifications(prev => [...prev, ...backup]);
      }
    } catch {
      alert('Failed to clear read notifications.');
      setNotifications(prev => [...prev, ...backup]);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    const backup = [...notifications];
    setNotifications([]);
    try {
      const apiUrl = getApiUrl();
      const base = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${base}/notifications/all`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete all notifications.');
        setNotifications(backup);
      }
    } catch {
      alert('Failed to delete all notifications.');
      setNotifications(backup);
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
          .notifications-container {
            overflow: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
          }

          .notifications-content {
            width: 100% !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
          }

          .notifications-main {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
            overflow-x: hidden !important;
          }

          .notifications-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }

          .notifications-header h1 {
            font-size: 1.4rem !important;
          }

          .notifications-header p {
            font-size: 0.85rem !important;
          }

          .header-actions {
            width: 100% !important;
          }

          .header-actions button {
            min-height: 44px !important;
            font-size: 0.85rem !important;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }

          .stat-card {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
            padding: 1rem !important;
          }

          .stat-card > div:first-child {
            font-size: 0.8rem !important;
            margin-bottom: 0.25rem !important;
          }

          .stat-card > div:last-child {
            font-size: 1.3rem !important;
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
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            padding-bottom: 0.25rem !important;
          }

          .filter-buttons::-webkit-scrollbar {
            display: none !important;
          }

          .filter-buttons button {
            flex-shrink: 0 !important;
            min-height: 40px !important;
          }

          .notification-item {
            flex-direction: column !important;
            gap: 0.625rem !important;
            padding: 0.875rem 1rem !important;
          }

          .notification-icon {
            width: 40px !important;
            height: 40px !important;
          }

          .notification-title {
            font-size: 0.85rem !important;
          }

          .notification-message {
            font-size: 0.8rem !important;
          }

          .notification-actions button,
          .notification-actions a {
            min-height: 36px !important;
            min-width: 36px !important;
            padding: 0.35rem 0.5rem !important;
          }
        }

        /* Extra small mobile (phones in portrait) */
        @media (max-width: 480px) {
          .notifications-main {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }

          .notifications-header h1 {
            font-size: 1.25rem !important;
          }

          .stats-grid {
            gap: 0.5rem !important;
          }

          .stat-card {
            padding: 0.75rem !important;
          }

          .stat-card > div:first-child {
            font-size: 0.7rem !important;
          }

          .stat-card > div:last-child {
            font-size: 1.1rem !important;
          }

          .filter-buttons button {
            font-size: 0.8rem !important;
            padding: 0.4rem 0.75rem !important;
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

            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
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
                  Delete all
                </button>
              )}
            </div>
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
              filteredNotifications.map((notification) => {
                const iconStyle = getNotificationIcon(notification.type);
                const dest = getNotificationDest(notification);
                const isUnread = !notification.read;
                return (
                  <div
                    key={notification.id}
                    className="notification-item"
                    onClick={() => { markAsRead(notification.id); if (dest) window.location.href = dest; }}
                    style={{
                      display: 'flex',
                      gap: '0.875rem',
                      padding: '1rem 1.25rem',
                      marginBottom: '0.5rem',
                      borderRadius: '0.75rem',
                      backgroundColor: isUnread
                        ? (actualTheme === 'dark' ? 'rgba(59,130,246,0.12)' : '#EFF6FF')
                        : (actualTheme === 'dark' ? colors.bgCard : '#FAFAFA'),
                      border: `1.5px solid ${isUnread
                        ? (actualTheme === 'dark' ? 'rgba(59,130,246,0.3)' : '#BFDBFE')
                        : (actualTheme === 'dark' ? colors.borderPrimary : '#E5E7EB')}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative' as const,
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = actualTheme === 'dark'
                        ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Left accent line for unread */}
                    {isUnread && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                        background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)',
                        borderRadius: '3px 0 0 3px',
                      }} />
                    )}

                    {/* Icon */}
                    <div className="notification-icon" style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: iconStyle.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: iconStyle.color,
                      overflow: 'hidden',
                      boxShadow: `0 2px 8px ${actualTheme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                      {notification.avatar ? (
                        <Image src={notification.avatar} alt="" width={44} height={44} style={{ objectFit: 'cover', borderRadius: '12px' }} />
                      ) : (
                        iconStyle.icon
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span className="notification-title" style={{
                            fontSize: '0.9rem',
                            fontWeight: isUnread ? 700 : 500,
                            color: colors.textPrimary,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                          }}>
                            {notification.title}
                          </span>
                          {isUnread && (
                            <div style={{
                              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                              boxShadow: '0 0 6px rgba(59,130,246,0.4)',
                            }} />
                          )}
                        </div>
                        <span style={{
                          fontSize: '0.75rem', color: colors.textSecondary,
                          whiteSpace: 'nowrap' as const, flexShrink: 0,
                        }}>
                          {notification.timestamp}
                        </span>
                      </div>

                      <p className="notification-message" style={{
                        fontSize: '0.82rem', color: colors.textSecondary,
                        margin: '0 0 0.5rem 0', lineHeight: '1.45',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      }}>
                        {notification.message}
                      </p>

                      {/* Album Preview */}
                      {notification.albumPreview && (
                        <div style={{
                          marginBottom: '0.5rem', width: '120px', height: '80px',
                          borderRadius: '8px', overflow: 'hidden', position: 'relative' as const,
                          boxShadow: `0 2px 6px ${actualTheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                        }}>
                          <Image src={notification.albumPreview} alt="Album preview" fill style={{ objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Bottom row: amount badge + type badge + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
                        {notification.amount && (
                          <span style={{
                            fontSize: '0.78rem', fontWeight: 700,
                            color: '#16A34A',
                            backgroundColor: actualTheme === 'dark' ? 'rgba(22,163,74,0.15)' : '#DCFCE7',
                            padding: '0.2rem 0.6rem', borderRadius: '6px',
                          }}>
                            +{formatPrice(notification.amount)}
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600,
                          color: iconStyle.color,
                          backgroundColor: iconStyle.bg,
                          padding: '0.15rem 0.5rem', borderRadius: '6px',
                          textTransform: 'capitalize' as const,
                        }}>
                          {notification.type}
                        </span>
                        <div className="notification-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {isUnread && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                fontSize: '0.78rem', fontWeight: 600,
                                color: actualTheme === 'dark' ? '#4ADE80' : '#059669',
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                transition: 'opacity 0.2s',
                              }}
                              title="Mark as read"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                              Read
                            </button>
                          )}
                          {dest && (
                            <Link
                              href={dest}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
                                color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                              }}
                            >
                              View
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </Link>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem',
                              color: colors.textSecondary, display: 'flex', alignItems: 'center',
                              opacity: 0.5, transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#DC2626'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = colors.textSecondary; }}
                            title="Delete notification"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          </button>
                        </div>
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
