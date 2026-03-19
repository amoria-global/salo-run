"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
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

function mapBackendType(backendType: string): NotificationType {
  switch (backendType?.toUpperCase()) {
    case 'PAYMENT': return 'payment';
    case 'TIP': return 'tip';
    case 'BONUS': return 'bonus';
    case 'SECURITY': case 'SYSTEM': return 'security';
    case 'MEDIA': case 'ALBUM': return 'album';
    case 'REVIEW': return 'review';
    case 'BOOKING': case 'EVENT': case 'ASSIGNMENT': return 'event';
    case 'PHOTOBOOK': case 'PHOTOBOOK_RECEIVED': return 'photobook';
    default: return 'payment';
  }
}

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

// Notification types specific to photographers
type NotificationType = 'payment' | 'tip' | 'bonus' | 'security' | 'album' | 'review' | 'event' | 'photobook';

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


const Notifications = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user, token } = useDashboardAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const [notifRes, balRes] = await Promise.all([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications?page=0&size=50`),
        balance ? Promise.resolve(null) : dashboardAuthFetch(`${apiUrl}/api/remote/photographer/balance`),
      ]);

      if (notifRes && notifRes.ok) {
        const data = await notifRes.json();
        if (data.action === 1 && data.data) {
          const items = data.data.content || data.data || [];
          setNotifications(items.map((n: any) => ({
            id: n.id,
            type: mapBackendType(n.type),
            title: n.title,
            message: n.message,
            timestamp: n.createdAt ? formatRelativeTime(n.createdAt) : '',
            read: n.isRead ?? n.read ?? false,
            avatar: n.avatar || undefined,
            amount: n.amount || undefined,
            actionUrl: n.link || undefined,
          })));
        }
      }

      if (balRes && balRes.ok) {
        const data = await balRes.json();
        if (data.action === 1 && data.data) {
          setBalance(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      case 'event':
        return { icon: <ImageIcon />, bg: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE', color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB' };
      case 'photobook':
        return { icon: <ImageIcon />, bg: actualTheme === 'dark' ? '#4A1D6A' : '#F3E8FF', color: actualTheme === 'dark' ? '#D8B4FE' : '#7C3AED' };
      default:
        return { icon: <BellIcon />, bg: colors.bgTertiary, color: colors.textSecondary };
    }
  };

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (notif?.read) return;
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    window.dispatchEvent(new CustomEvent('badge-update', { detail: { type: 'notification', count: 1 } }));
    try {
      const apiUrl = getApiUrl();
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getNotificationDest = (notification: Notification): string | null => {
    // Ignore backend actionUrl — use role-aware routing instead
    switch (notification.type) {
      case 'payment': case 'tip': case 'bonus': return '/user/photographer/all-transactions';
      case 'security': return '/user/photographer/profile';
      case 'album': case 'event': return '/user/photographer/events';
      case 'photobook': return '/user/photographer/events?tab=photobooks';
      case 'review': return '/user/photographer/clients';
      default: return null;
    }
  };

  const markAllAsRead = async () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (unreadCount > 0) {
      window.dispatchEvent(new CustomEvent('badge-update', { detail: { type: 'notification', count: unreadCount } }));
    }
    try {
      const apiUrl = getApiUrl();
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications/read-all`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      console.log('DELETE notification response:', { status: res.status, ok: res.ok, data });
      if (!res.ok) {
        alert(data.message || 'Failed to delete notification. The server did not process the request.');
        fetchNotifications();
      }
    } catch (err) {
      console.error('DELETE notification error:', err);
      alert('Failed to delete notification. The feature may not be available yet.');
      fetchNotifications();
    }
  };

  const deleteAllRead = async () => {
    setNotifications(prev => prev.filter(n => !n.read));
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications/delete-read`, { method: 'DELETE' });
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

  const filterOptions: { value: 'all' | NotificationType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'payment', label: 'Payments' },
    { value: 'tip', label: 'Tips' },
    { value: 'bonus', label: 'Bonuses' },
    { value: 'security', label: 'Security' },
    { value: 'event', label: 'Events' },
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
          overflow: hidden;
          width: 100%;
          max-width: 100vw;
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
            padding: 1rem !important;
            padding-bottom: 8rem !important;
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
            -webkit-overflow-scrolling: touch;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }

          .filter-buttons::-webkit-scrollbar {
            display: none !important;
          }

          .filter-buttons button {
            flex-shrink: 0 !important;
            min-height: 40px !important;
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
          <Topbar userRole="photographer" tipsAmount={balance?.totalTips || 0} bonusAmount={balance?.totalBonuses || 0} balanceAmount={balance?.availableBalance || 0} />

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
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #083A85' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Notifications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.brandPrimary }}>{notifications.length}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Unread</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{unreadCount}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #16A34A' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Payments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                {notifications.filter(n => n.type === 'payment').length}
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
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
              filteredNotifications.map((notification) => {
                const iconStyle = getNotificationIcon(notification.type);
                const dest = getNotificationDest(notification);
                const isUnread = !notification.read;
                return (
                  <div
                    key={notification.id}
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
                    <div style={{
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
                          <span style={{
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

                      <p style={{
                        fontSize: '0.82rem', color: colors.textSecondary,
                        margin: '0 0 0.5rem 0', lineHeight: '1.45',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      }}>
                        {notification.message}
                      </p>

                      {/* Bottom row: amount badge + type badge + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
                        {notification.amount && (
                          <span style={{
                            fontSize: '0.78rem', fontWeight: 700,
                            color: notification.type === 'payment' ? '#16A34A' : notification.type === 'tip' ? '#F59E0B' : '#2563EB',
                            backgroundColor: notification.type === 'payment' ? (actualTheme === 'dark' ? 'rgba(22,163,74,0.15)' : '#DCFCE7')
                              : notification.type === 'tip' ? (actualTheme === 'dark' ? 'rgba(245,158,11,0.15)' : '#FEF3C7')
                              : (actualTheme === 'dark' ? 'rgba(37,99,235,0.15)' : '#DBEAFE'),
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
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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

export default Notifications;
