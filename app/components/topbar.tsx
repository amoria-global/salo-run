"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";
import { useCurrency } from "../context/CurrencyContext";

function getApiUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

// Icons for dropdown menu
const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 20C5 17.2386 7.23858 15 10 15H14C16.7614 15 19 17.2386 19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PreferencesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="8" r="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="16" r="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="10" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="10" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="8" x2="4" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="16" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

interface TopbarProps {
  bonusAmount?: number;
  tipsAmount?: number; // Tips from viewers/clients
  giftAmount?: number;
  balanceAmount?: number; // For photographer - unwithdrawn paid amount + tips + bonuses
  liveStreamFeeAmount?: number; // For event-coordinator - Live Stream Access Fee revenue
  userRole?: 'client' | 'photographer' | 'admin' | 'event-coordinator';
}

export default function Topbar({ bonusAmount, tipsAmount, giftAmount: giftAmountProp, balanceAmount, liveStreamFeeAmount, userRole = 'client' }: TopbarProps) {
  const { colors, actualTheme, theme, setTheme } = useTheme();
  const { user, logout, token } = useDashboardAuth();
  const router = useRouter();
  const { currency, setCurrency, formatPrice, currencies } = useCurrency();

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'photographer':
        return 'Photographer';
      case 'admin':
        return 'Admin';
      case 'event-coordinator':
        return 'Event Coordinator';
      case 'client':
      default:
        return 'Client';
    }
  };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [giftAmount, setGiftAmount] = useState(giftAmountProp ?? 0);
  const [selfLiveStreamFee, setSelfLiveStreamFee] = useState(0);
  const [selfBalanceAmount, setSelfBalanceAmount] = useState(0);
  const [selfTipsAmount, setSelfTipsAmount] = useState(0);
  const [selfBonusAmount, setSelfBonusAmount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    const apiUrl = getApiUrl();
    const notifBase = userRole === 'event-coordinator' ? 'coordinator' : userRole === 'photographer' ? 'photographer' : 'customer';
    try {
      const [notifRes, countRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifBase}/notifications?page=0&size=20`, { method: 'GET' }),
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifBase}/notifications/unread-count`, { method: 'GET' }),
      ]);

      if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
        const data = await notifRes.value.json();
        if (data.action === 1 && Array.isArray(data.data)) {
          setNotifications(data.data.map((n: any) => ({
            id: n.id,
            type: n.type || 'system',
            title: n.title || '',
            message: n.message || '',
            time: n.createdAt ? formatTimeAgo(n.createdAt) : '',
            read: n.isRead ?? true,
            actionUrl: n.link || undefined,
          })));
        }
      }
      if (countRes.status === 'fulfilled' && countRes.value.ok) {
        const data = await countRes.value.json();
        if (data.action === 1) setUnreadCount(data.data ?? 0);
      }
    } catch {
      // silent fail
    }
  }, [token, userRole]);

  const fetchFinancials = useCallback(async () => {
    if (!token) return;
    const apiUrl = getApiUrl();
    try {
      if (userRole === 'event-coordinator') {
        if (liveStreamFeeAmount === undefined) {
          const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/balance`, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            if (data.action === 1 && data.data) {
              setSelfLiveStreamFee(data.data.totalEarnings ?? 0);
            }
          }
        }
      } else if (userRole === 'photographer') {
        if (balanceAmount === undefined || tipsAmount === undefined || bonusAmount === undefined) {
          const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/balance`, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            if (data.action === 1 && data.data) {
              if (balanceAmount === undefined) setSelfBalanceAmount(data.data.availableBalance ?? data.data.totalPaid ?? 0);
              if (tipsAmount === undefined) setSelfTipsAmount(data.data.totalTips ?? 0);
              if (bonusAmount === undefined) setSelfBonusAmount(data.data.totalBonuses ?? data.data.bonus ?? 0);
            }
          }
        }
      } else {
        if (giftAmountProp === undefined) {
          const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics`, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            if (data.action === 1 && data.data) {
              setGiftAmount(data.data.gifts ?? 0);
            }
          }
        }
      }
    } catch {
      // silent fail
    }
  }, [token, userRole, giftAmountProp, liveStreamFeeAmount, balanceAmount, tipsAmount, bonusAmount]);

  useEffect(() => {
    if (giftAmountProp !== undefined) setGiftAmount(giftAmountProp);
  }, [giftAmountProp]);

  useEffect(() => {
    fetchNotifications();
    fetchFinancials();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchFinancials]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    const apiUrl = getApiUrl();
    const base = userRole === 'event-coordinator' ? 'coordinator' : userRole === 'photographer' ? 'photographer' : 'customer';
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/${base}/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // silent fail
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    const apiUrl = getApiUrl();
    const base = userRole === 'event-coordinator' ? 'coordinator' : userRole === 'photographer' ? 'photographer' : 'customer';
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/${base}/notifications/read-all`, { method: 'PATCH' });
    } catch {
      // silent fail
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    setIsNotificationsOpen(false);
    const dest = notification.actionUrl || (() => {
      const t = notification.type?.toLowerCase();
      if (userRole === 'photographer') {
        if (t === 'payment' || t === 'tip' || t === 'bonus') return '/user/photographer/all-transactions';
      } else if (userRole === 'event-coordinator') {
        if (t === 'booking' || t === 'event') return '/user/event-coordinator/events';
        if (t === 'payment' || t === 'streamfee') return '/user/event-coordinator/payments';
        if (t === 'album' || t === 'media') return '/user/event-coordinator/gallery';
      } else {
        if (t === 'booking') return '/user/client/bookings';
        if (t === 'payment') return '/user/client/payments';
        if (t === 'album' || t === 'media') return '/user/client/gallery';
      }
      return null;
    })();
    if (dest) router.push(dest);
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
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <style jsx>{`
        /* Desktop styles - keep everything as is */
        .topbar-container {
          /* All desktop styles are handled by inline styles */
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .topbar-container {
            border-radius: 0.75rem !important;
            margin-left: 3.5rem !important;
            margin-right: 0.5rem !important;
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
            padding-top: 0.4rem !important;
            padding-bottom: 0.4rem !important;
            flex-wrap: nowrap !important;
            gap: 0.5rem !important;
          }

          .topbar-title {
            font-size: 0.9rem !important;
            line-height: 1.2rem !important;
            white-space: nowrap !important;
          }

          .topbar-right {
            gap: 0.4rem !important;
            flex-wrap: nowrap !important;
            justify-content: flex-end !important;
            overflow-x: auto !important;
          }

          /* Compact labels and values on mobile */
          .topbar-balance span:first-child,
          .topbar-tips span:first-child,
          .topbar-bonus span:first-child {
            font-size: 0.7rem !important;
            font-weight: 500 !important;
          }

          .topbar-balance span:last-child,
          .topbar-tips span:last-child,
          .topbar-bonus span:last-child {
            font-size: 0.8rem !important;
            font-weight: 600 !important;
          }

          .topbar-balance,
          .topbar-tips,
          .topbar-bonus {
            gap: 0.15rem !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          /* Hide profile name and amount on mobile, but keep avatar */
          .topbar-profile-info {
            display: none !important;
          }

          /* Ensure profile avatar and dropdown still work */
          .profile-dropdown-container {
            position: relative !important;
          }

          .profile-dropdown-container > div:first-child {
            cursor: pointer !important;
          }

          .profile-dropdown-container img {
            width: 2rem !important;
            height: 2rem !important;
          }

          /* Make dropdown menu centered on mobile with margin */
          .profile-dropdown-container > div:nth-child(2) {
            position: absolute !important;
            top: calc(100% + 0.5rem) !important;
            right: 1rem !important;
            left: auto !important;
            transform: none !important;
            z-index: 1002 !important;
          }

          /* Make notifications dropdown centered at top on mobile */
          .notifications-container > div:nth-child(2) {
            position: fixed !important;
            top: 5rem !important;
            right: auto !important;
            left: 1rem !important;
            transform: none !important;
            width: calc(100vw - 2rem) !important;
            max-width: 340px !important;
            z-index: 1002 !important;
          }

          /* Adjust notification content for mobile */
          .notifications-container > div:nth-child(2) > div:nth-child(2) {
            max-height: 280px !important;
          }

          /* Reduce padding and font sizes in notification items on mobile */
          .notifications-container > div:nth-child(2) > div:nth-child(2) > div {
            padding: 0.6rem 0.75rem !important;
          }

          .notifications-container > div:nth-child(2) > div:nth-child(1) {
            padding: 0.75rem 0.75rem !important;
          }

          .notifications-container > div:nth-child(2) > div:nth-child(1) h3 {
            font-size: 0.9rem !important;
          }

          .notifications-container > div:nth-child(2) > div:nth-child(3) {
            padding: 0.6rem !important;
          }

          /* Ensure topbar doesn't clip dropdown */
          .topbar-container {
            overflow: visible !important;
          }

          .topbar-right {
            overflow: visible !important;
          }
        }

        /* Extra small mobile (phones in portrait) */
        @media (max-width: 480px) {
          .topbar-container {
            margin-left: 3.25rem !important;
            margin-right: 0.25rem !important;
            padding-left: 0.35rem !important;
            padding-right: 0.35rem !important;
            flex-direction: column !important;
            gap: 0.5rem !important;
          }

          .topbar-title {
            font-size: 0.85rem !important;
            line-height: 1.1rem !important;
            text-align: center !important;
            width: 100% !important;
          }

          .topbar-right {
            width: 100% !important;
            justify-content: space-between !important;
            gap: 0.3rem !important;
          }

          .topbar-balance span:first-child,
          .topbar-tips span:first-child,
          .topbar-bonus span:first-child {
            font-size: 0.65rem !important;
          }

          .topbar-balance span:last-child,
          .topbar-tips span:last-child,
          .topbar-bonus span:last-child {
            font-size: 0.75rem !important;
          }

          .profile-dropdown-container img {
            width: 1.75rem !important;
            height: 1.75rem !important;
          }
        }
      `}</style>
      <div className="topbar-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '1.2rem',
      paddingRight: '1.2rem',
      paddingTop: '0.4rem',
      paddingBottom: '0.4rem',
      backgroundColor: colors.bgSecondary,
      borderRadius: '9999px',
      marginLeft: '1.5rem',
      marginRight: '1.5rem',
      marginTop: '0.75rem',
      marginBottom: '0.75rem',
      border: `2px solid ${colors.borderPrimary}`,
      boxShadow: colors.shadowSm
    }}>
      {/* Left side - Dashboard title */}
      <h1 className="topbar-title" style={{
        fontSize: '1.35rem',
        lineHeight: '1.75rem',
        color: colors.textSecondary
      }}>{getRoleDisplayName(userRole)} Dashboard</h1>

      {/* Right side - Notification, Bonus, and Profile */}
      <div className="topbar-right" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {/* Theme Toggle */}
        <div
          onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
          style={{
            cursor: 'pointer',
            color: colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          title={actualTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {actualTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </div>

        {/* Notification Bell */}
        <div
          ref={notificationsRef}
          className="notifications-container"
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
              color: colors.textSecondary
            }} className="bi bi-bell"></i>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-0.55rem',
                right: '-0.45rem',
                backgroundColor: '#EF4444',
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
              backgroundColor: colors.bgSecondary,
              borderRadius: '0.75rem',
              boxShadow: colors.shadowLg,
              border: `2px solid ${colors.borderPrimary}`,
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
                borderBottom: `2px solid ${colors.borderPrimary}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Notifications</h3>
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
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          padding: '0.875rem 1rem',
                          borderBottom: `1px solid ${colors.bgTertiary}`,
                          backgroundColor: notification.read ? colors.bgSecondary : (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF'),
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = notification.read ? colors.bgTertiary : (actualTheme === 'dark' ? '#234B6E' : '#E0F2FE');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = notification.read ? colors.bgSecondary : (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF');
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
                              color: colors.textPrimary
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
                            color: colors.textSecondary,
                            margin: '0.25rem 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {notification.message}
                          </p>
                          <span style={{
                            fontSize: '0.7rem',
                            color: colors.textTertiary,
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
                borderTop: `2px solid ${colors.borderPrimary}`,
                textAlign: 'center'
              }}>
                <Link
                  href={userRole === 'photographer'
                    ? '/user/photographer/notifications'
                    : userRole === 'event-coordinator'
                      ? '/user/event-coordinator/notifications'
                      : '/user/client/notifications'}
                  style={{
                    color: '#2563EB',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Currency Selector */}
        <div
          ref={currencyRef}
          style={{ position: 'relative' }}
        >
          <button
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '9999px',
              border: `2px solid ${colors.borderPrimary}`,
              background: colors.bgTertiary,
              color: colors.textPrimary,
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <img src={`https://flagcdn.com/w40/${currencies.find(c => c.code === currency)?.flag}.png`} alt="" style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
            {currency}
            <i style={{
              fontSize: '0.6rem',
              color: colors.textSecondary,
              transform: isCurrencyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} className="bi bi-chevron-down"></i>
          </button>

          {isCurrencyOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              backgroundColor: colors.bgSecondary,
              borderRadius: '0.75rem',
              boxShadow: colors.shadowLg,
              border: `2px solid ${colors.borderPrimary}`,
              padding: '0.5rem',
              minWidth: '180px',
              zIndex: 50
            }}>
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setIsCurrencyOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: currency === c.code ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent',
                    color: colors.textPrimary,
                    fontSize: '0.85rem',
                    fontWeight: currency === c.code ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (currency !== c.code) e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    if (currency !== c.code) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={`https://flagcdn.com/w40/${c.flag}.png`} alt={c.name} style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
                    <span style={{ fontWeight: '600' }}>{c.code}</span>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{c.name}</span>
                  </div>
                  {currency === c.code && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Balance - Shows for photographer only */}
        {userRole === 'photographer' && (
          <div className="topbar-balance" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '1.12rem',
              lineHeight: '1.5rem',
              fontWeight: '600',
              color: colors.textPrimary
            }}>Balance:</span>
            <span style={{
              fontSize: '1.15rem',
              lineHeight: '1.5rem',
              fontWeight: '700',
              color: (balanceAmount ?? selfBalanceAmount) > 0 ? colors.brandPrimary : colors.textSecondary
            }}>{formatPrice(balanceAmount ?? selfBalanceAmount)}</span>
          </div>
        )}

        {/* Tips - Shows for photographer only (from clients/viewers) */}
        {userRole === 'photographer' && (
          <div className="topbar-tips" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '1.12rem',
              lineHeight: '1.5rem',
              fontWeight: '600',
              color: colors.textPrimary
            }}>Tips:</span>
            <span style={{
              fontSize: '1.15rem',
              lineHeight: '1.5rem',
              fontWeight: '600',
              color: (tipsAmount ?? selfTipsAmount) > 0 ? '#F59E0B' : colors.textSecondary
            }}>{formatPrice(tipsAmount ?? selfTipsAmount)}</span>
          </div>
        )}

        {/* Bonus/Gift/Live Stream Fees - Shows Gift for clients, Live Stream Fees for event-coordinator, Bonus for photographers (platform rewards) */}
        <div className="topbar-bonus" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '1.12rem',
            lineHeight: '1.5rem',
            fontWeight: '600',
            color: colors.textPrimary
          }}>{userRole === 'client' ? 'Gifts:' : userRole === 'event-coordinator' ? 'Stream Fees:' : 'Bonus:'}</span>
          <span style={{
            fontSize: '1.15rem',
            lineHeight: '1.5rem',
            fontWeight: '600',
            color: userRole === 'client'
              ? (giftAmount > 0 ? colors.statusSuccess : colors.brandPrimary)
              : userRole === 'event-coordinator'
                ? ((liveStreamFeeAmount ?? selfLiveStreamFee) > 0 ? colors.statusSuccess : colors.brandPrimary)
                : ((bonusAmount ?? selfBonusAmount) > 0 ? colors.statusSuccess : colors.brandPrimary)
          }}>{formatPrice(userRole === 'client'
            ? giftAmount
            : userRole === 'event-coordinator'
              ? (liveStreamFeeAmount ?? selfLiveStreamFee)
              : (bonusAmount ?? selfBonusAmount))}</span>
        </div>

        {/* Profile with Dropdown */}
        <div
          ref={dropdownRef}
          className="profile-dropdown-container"
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
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                style={{
                  borderRadius: '9999px',
                  objectFit: 'cover',
                  width: '2.5rem',
                  height: '2.5rem'
                }}
              />
            ) : (
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                backgroundColor: '#083A85',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '1rem',
              }}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div className="topbar-profile-info" style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{
                fontSize: '1.12rem',
                lineHeight: '1.5rem',
                fontWeight: '700',
                color: colors.brandPrimary
              }}>{getUserDisplayName()}</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1.5rem',
                  fontWeight: '600',
                  color: colors.textPrimary
                }}>{formatPrice(userRole === 'client'
                  ? giftAmount
                  : userRole === 'event-coordinator'
                    ? (liveStreamFeeAmount ?? selfLiveStreamFee)
                    : (balanceAmount ?? selfBalanceAmount))}</span>
                <i style={{
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  color: colors.textSecondary,
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
              backgroundColor: colors.bgSecondary,
              borderRadius: '0.75rem',
              boxShadow: colors.shadowLg,
              border: `2px solid ${colors.borderPrimary}`,
              padding: '1.25rem',
              minWidth: '220px',
              zIndex: 50
            }}>
              {/* User Info Header */}
              <div style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: `2px solid ${colors.borderPrimary}`
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: colors.brandPrimary,
                  marginBottom: '0.25rem'
                }}>
                  {getUserDisplayName()}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: colors.textSecondary
                }}>
                  {user?.email && <span>{user.email}</span>}
                </div>
              </div>

              {/* Menu Items */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <a
                  href={`/user/${userRole}/profile`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: colors.textSecondary,
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ProfileIcon />
                  Profile settings
                </a>

                <button
                  onClick={() => router.push(`/user/${userRole}/preferences`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'none',
                    color: colors.textSecondary,
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <PreferencesIcon />
                  Preferences
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowLogoutModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'none',
                    color: colors.textSecondary,
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Logout Confirmation Modal */}
    {showLogoutModal && (
      <div
        onClick={() => setShowLogoutModal(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '380px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: actualTheme === 'dark' ? '#3B1A1A' : '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,17 21,12 16,7" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            Are you sure you want to logout?
          </h3>

          {/* Description */}
          <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1.5rem', lineHeight: '1.5' }}>
            You will be signed out of your account and redirected to the login page.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                flex: 1,
                padding: '0.625rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
              style={{
                flex: 1,
                padding: '0.625rem',
                border: '2px solid #B91C1C',
                borderRadius: '0.5rem',
                backgroundColor: '#DC2626',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
