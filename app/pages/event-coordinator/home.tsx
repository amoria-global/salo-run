"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import PayNowModal, { Payment } from '../../components/UnlockModal';
import {
  StatCard,
  ActivityItem,
  PaymentItem,
  PerformanceChart,
  MoneyIcon,
  ClockIcon,
  UsersIcon,
  StarIcon
} from '../../components/dashboard';

// Live Stream Fee Icon
const LiveStreamFeeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <path d="M4.93 4.93a10 10 0 0 1 14.14 0M7.76 7.76a6 6 0 0 1 8.48 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Eye icon for view details
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Alert Icons
const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="#DC2626"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Heartwarming greeting variations based on time of day
const getGreetings = (timeOfDay: string) => {
  const morningGreetings = [
    "Good Morning",
    "Rise and Shine",
    "Beautiful Morning",
    "Lovely Morning",
    "Wonderful Morning",
    "Great Morning",
    "Happy Morning",
    "Blessed Morning"
  ];

  const afternoonGreetings = [
    "Good Afternoon",
    "Lovely Afternoon",
    "Beautiful Afternoon",
    "Wonderful Afternoon",
    "Great Afternoon",
    "Happy Afternoon",
    "Blessed Afternoon",
    "Amazing Afternoon"
  ];

  const eveningGreetings = [
    "Good Evening",
    "Lovely Evening",
    "Beautiful Evening",
    "Wonderful Evening",
    "Great Evening",
    "Happy Evening",
    "Peaceful Evening",
    "Relaxing Evening"
  ];

  const nightGreetings = [
    "Good Night",
    "Peaceful Night",
    "Lovely Night",
    "Beautiful Night",
    "Wonderful Night",
    "Quiet Night",
    "Restful Night",
    "Starry Night"
  ];

  switch (timeOfDay) {
    case 'morning': return morningGreetings;
    case 'afternoon': return afternoonGreetings;
    case 'evening': return eveningGreetings;
    default: return nightGreetings;
  }
};

// Static subtitle based on time of day
const getStaticMessage = (timeOfDay: string) => {
  switch (timeOfDay) {
    case 'morning': return "Ready to manage your upcoming events?";
    case 'afternoon': return "Perfect time to check your live stream earnings!";
    case 'evening': return "Time to review today's event performance!";
    default: return "Late night planning? Your events dashboard awaits!";
  }
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

interface PendingPayment {
  id: string;
  eventName: string;
  photographerName: string;
  photographerImage: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'failed' | 'partially_paid';
}

interface Photographer {
  id: string;
  name: string;
  event: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  avatar: string;
}

interface CoordinatorAnalyticsData {
  totalCustomers: number;
  totalPhotographers: number;
  totalEvents: number;
  eventsByStatus: Record<string, number>;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  pendingProfileReviews: number;
  activeStreams: number;
  totalNotifications: number;
  unreadContactMessages: number;
}

const EventCoordinatorDashboard = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasPaymentAccount, setHasPaymentAccount] = useState<boolean | null>(null);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);

  // API data state
  const [analytics, setAnalytics] = useState<CoordinatorAnalyticsData | null>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ label: string; value: string; valueColor?: string }[]>([]);
  const [recentPayments, setRecentPayments] = useState<{ name: string; type: string; amount: string; avatar?: string; logo?: string }[]>([]);
  const [performanceData, setPerformanceData] = useState([
    { day: 'Sun', value1: 0, value2: 0 },
    { day: 'Mon', value1: 0, value2: 0 },
    { day: 'Tue', value1: 0, value2: 0 },
    { day: 'Wed', value1: 0, value2: 0 },
    { day: 'Thu', value1: 0, value2: 0 },
    { day: 'Fri', value1: 0, value2: 0 },
    { day: 'Sat', value1: 0, value2: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    const apiUrl = getApiUrl();
    try {
      const [analyticsRes, balanceRes, paymentsRes, photographersRes, notificationsRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/analytics`),
        dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/balance`),
        dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/payments?page=0&size=10`),
        dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/photographers?page=0&size=5`),
        dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/notifications?page=0&size=6`),
      ]);

      // Analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.action === 1 && data.data) {
          setAnalytics(data.data);
        }
      }

      // Balance
      if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
        const data = await balanceRes.value.json();
        if (data.action === 1 && data.data) {
          setBalanceData(data.data);
        }
      }

      // Payments → pendingPayments + recentPayments
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        const data = await paymentsRes.value.json();
        if (data.action === 1 && data.data) {
          const items = data.data.content || data.data || [];
          // Pending payments
          const pending: PendingPayment[] = items
            .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'SUCCESS')
            .map((p: any) => ({
              id: p.id || '',
              eventName: p.eventTitle || p.eventName || 'Event',
              photographerName: p.photographerName || 'Photographer',
              photographerImage: ((url: string | undefined) => url && !url.includes('/null') ? url.replace('http://197.243.24.101', 'https://backend.connekyt.com') : undefined)(p.photographerImage || undefined),
              amount: p.amount || 0,
              paidAmount: p.paidAmount || 0,
              dueDate: p.dueDate ? p.dueDate.split('T')[0] : '',
              status: p.status === 'FAILED' ? 'failed' : p.status === 'PARTIAL' ? 'partially_paid' : 'pending' as PendingPayment['status'],
            }));
          setPendingPayments(pending);
          // Recent transactions — show all non-completed (pending/unpaid)
          const pendingTxns = items
            .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'SUCCESS')
            .slice(0, 5)
            .map((p: any) => ({
              name: p.photographerName || p.eventTitle || 'Payment',
              type: p.status === 'PARTIAL' ? 'Partially paid' : p.status === 'FAILED' ? 'Failed' : 'Pending',
              amount: formatPrice(p.amount || 0),
              avatar: ((url: string | undefined) => url && !url.includes('/null') ? url.replace('http://197.243.24.101', 'https://backend.connekyt.com') : undefined)(p.photographerImage || undefined),
            }));
          setRecentPayments(pendingTxns);
        }
      }

      // Photographers
      if (photographersRes.status === 'fulfilled' && photographersRes.value.ok) {
        const data = await photographersRes.value.json();
        if (data.action === 1 && data.data) {
          const items = data.data.content || data.data || [];
          const approved = items.filter((p: any) => p.profileReviewStatus === 'ACCEPTED');
          const mapped: Photographer[] = approved.slice(0, 5).map((p: any) => ({
            id: p.id || '',
            name: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name || 'Photographer',
            event: p.specialties?.[0]?.name || p.specialties?.[0] || p.specializations?.[0] || '',
            status: 'Completed' as const,
            avatar: ((url: string | undefined) => url && !url.includes('/null') ? url.replace('http://197.243.24.101', 'https://backend.connekyt.com') : undefined)(p.profilePicture || p.profileImage || undefined),
          }));
          setPhotographers(mapped);
        }
      }

      // Notifications → recentActivities
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value.ok) {
        const data = await notificationsRes.value.json();
        if (data.action === 1 && data.data) {
          const items = data.data.content || data.data || [];
          const mapped = items.slice(0, 6).map((n: any) => ({
            label: n.type ? n.type.charAt(0) + n.type.slice(1).toLowerCase().replace(/_/g, ' ') : 'Activity',
            value: n.title || n.message || '',
          }));
          setRecentActivities(mapped);
        }
      }
    } catch (error) {
      console.error('[Coordinator Dashboard] Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formatPrice]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/preferences`)
      .then(res => res.json())
      .then(result => {
        const prefs = result?.data || {};
        setHasPaymentAccount(Object.keys(prefs).some(k => k.startsWith('payment_method_')));
      })
      .catch(() => setHasPaymentAccount(null));
  }, []);

  const handlePayNow = (pending: PendingPayment) => {
    if (hasPaymentAccount === false) {
      setShowSetupModal(true);
      return;
    }
    const payment: Payment = {
      id: parseInt(pending.id.replace(/\D/g, '')) || 0,
      date: pending.dueDate,
      eventName: pending.eventName,
      eventType: 'Event',
      photographerName: pending.photographerName,
      photographerImage: pending.photographerImage,
      method: 'card',
      amount: `$${(pending.amount - pending.paidAmount).toFixed(2)}`,
      amountNum: pending.amount - pending.paidAmount,
      paidAmount: pending.paidAmount,
      status: pending.status === 'partially_paid' ? 'pending' : pending.status,
      invoiceNumber: pending.id,
    };
    setPayNowPayment(payment);
    setShowPayNowModal(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  useEffect(() => {
    // Update time of day and greetings
    const updateTimeOfDay = () => {
      const newTimeOfDay = getTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
        setTimeOfDay(newTimeOfDay);
        setGreetings(getGreetings(newTimeOfDay));
        setGreetingIndex(0);
      }
    };

    // Cycle through greetings every 5 seconds
    const greetingInterval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 5000);

    // Check time of day every minute
    const timeInterval = setInterval(updateTimeOfDay, 60000);

    return () => {
      clearInterval(greetingInterval);
      clearInterval(timeInterval);
    };
  }, [timeOfDay, greetings.length]);

  const currentGreeting = greetings[greetingIndex];
  const staticMessage = getStaticMessage(timeOfDay);

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const hasFailedPayments = pendingPayments.some(p => p.status === 'failed');

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  return (
    <>
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: colors.bgPrimary,
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw'
    }}>
      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .mobile-main-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .mobile-header h1 {
            font-size: 1.5rem !important;
          }
          .mobile-header-stats {
            width: 100% !important;
            flex-direction: column !important;
            gap: 0.75rem !important;
            padding: 1rem !important;
          }
          .mobile-header-stat {
            width: 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            padding: 0.75rem !important;
            border-bottom: 2px solid ${colors.borderPrimary} !important;
          }
          .mobile-header-stat:last-child {
            border-bottom: none !important;
          }
          .mobile-filter-tabs {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .mobile-filter-tabs button {
            font-size: 0.85rem !important;
            padding: 0.5rem 0.75rem !important;
          }
          .mobile-custom-date-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.5rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .mobile-main-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-pending-payments {
            padding: 1rem !important;
          }
          .mobile-pending-payments > div:first-child {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-pending-payments > div:first-child > a {
            align-self: flex-start !important;
          }
          .mobile-card {
            padding: 1rem !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .mobile-main-grid {
            min-width: 0 !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .mobile-main-grid > div {
            min-width: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-header h1 {
            font-size: 1.3rem !important;
          }
          .mobile-filter-tabs button {
            font-size: 0.8rem !important;
            padding: 0.5rem 0.625rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-pending-payments > div:nth-child(2) {
            flex-direction: column !important;
            overflow-x: visible !important;
          }
          .mobile-pending-payments > div:nth-child(2) > div {
            min-width: 100% !important;
            flex: 1 1 100% !important;
          }
        }
        @media (max-width: 480px) {
          .mobile-filter-tabs {
            gap: 0.35rem !important;
          }
          .mobile-filter-tabs button {
            font-size: 0.75rem !important;
            padding: 0.4rem 0.5rem !important;
          }
        }
      `}</style>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="event-coordinator" />

        <div className="mobile-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: colors.bgPrimary,
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          <header className="mobile-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.125rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                lineHeight: '2rem',
                color: colors.textPrimary,
                fontWeight: '600',
                transition: 'opacity 0.3s ease'
              }}>
                {currentGreeting}, <span style={{ fontWeight: '600', color: colors.brandPrimary }}>{user?.firstName || 'there'}</span>
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: colors.textSecondary,
                marginTop: '0.25rem'
              }}>
                {staticMessage}
              </p>
            </div>
            <div className="mobile-header-stats" style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.5rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              boxShadow: colors.shadowSm,
              border: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              gap: '2rem'
            }}>
              <div className="mobile-header-stat" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: colors.brandPrimary
                }}>Revenue</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{formatPrice(analytics?.totalRevenue ?? balanceData?.totalDeclared ?? 0)}</span>
              </div>
              <div className="mobile-header-stat" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: colors.brandPrimary
                }}>Events</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{analytics?.totalEvents ?? 0}</span>
              </div>
              <div className="mobile-header-stat" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: colors.brandPrimary
                }}>Viewers</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{(analytics?.activeStreams ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </header>

      <div className="mobile-filter-tabs" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <button
          onClick={() => setActiveFilter('today')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'today' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'today' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'today' ? 'white' : colors.textSecondary
          }}
        >
          Today
        </button>
        <button
          onClick={() => setActiveFilter('week')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'week' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'week' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'week' ? 'white' : colors.textSecondary
          }}
        >
          This week
        </button>
        <button
          onClick={() => setActiveFilter('month')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'month' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'month' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'month' ? 'white' : colors.textSecondary
          }}
        >
          This Month
        </button>
        <button
          onClick={() => setActiveFilter('custom')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'custom' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'custom' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'custom' ? 'white' : colors.textSecondary
          }}
        >
          Custom
        </button>
      </div>

      {activeFilter === 'custom' && (
        <div className="mobile-custom-date-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: colors.textSecondary, whiteSpace: 'nowrap' }}>From</label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '0.375rem',
                border: `1px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard,
                color: colors.textPrimary,
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: colors.textSecondary, whiteSpace: 'nowrap' }}>To</label>
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: '0.375rem',
                border: `1px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard,
                color: colors.textPrimary,
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={() => {
              if (customDateFrom && customDateTo) {
                // TODO: trigger data fetch with customDateFrom and customDateTo
                console.log('Custom range:', customDateFrom, 'to', customDateTo);
              }
            }}
            disabled={!customDateFrom || !customDateTo}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: (!customDateFrom || !customDateTo) ? colors.borderPrimary : '#F20C8F',
              color: (!customDateFrom || !customDateTo) ? colors.textSecondary : 'white',
              fontSize: '0.85rem',
              cursor: (!customDateFrom || !customDateTo) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            Apply
          </button>
        </div>
      )}

      <div className="mobile-stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <StatCard
          title="Total Revenue"
          value={formatPrice(analytics?.totalRevenue ?? balanceData?.totalDeclared ?? 0)}
          percentage="62.3%"
          timeframe="last week"
          icon={<MoneyIcon />}
          trend="up"
          accentColor="#083A85"
        />
        <StatCard
          title="Pending"
          value={formatPrice(analytics?.totalPending ?? balanceData?.totalPending ?? 0)}
          percentage="28.5%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          accentColor="#F59E0B"
        />
        <StatCard
          title="Events"
          value={String(analytics?.totalEvents ?? 0)}
          percentage="15.2%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href="/user/event-coordinator/events"
          accentColor="#3B82F6"
        />
        <StatCard
          title="Stream Fees"
          value={formatPrice(balanceData?.totalEarnings ?? 0)}
          percentage="45.8%"
          timeframe="last week"
          icon={<LiveStreamFeeIcon />}
          trend="up"
          accentColor="#10B981"
        />
        <StatCard
          title="Photographers"
          value={String(analytics?.totalPhotographers ?? 0)}
          percentage="10%"
          timeframe="total"
          icon={<StarIcon />}
          trend="up"
          href="/user/event-coordinator/photographers"
          accentColor="#8B5CF6"
        />
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <div className="mobile-pending-payments" style={{
          backgroundColor: hasFailedPayments ? (actualTheme === 'dark' ? '#450A0A' : '#FEF2F2') : (actualTheme === 'dark' ? '#422006' : '#FFFBEB'),
          border: `1px solid ${hasFailedPayments ? (actualTheme === 'dark' ? '#991B1B' : '#FECACA') : (actualTheme === 'dark' ? '#854D0E' : '#FDE68A')}`,
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                backgroundColor: hasFailedPayments ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2') : (actualTheme === 'dark' ? '#78350F' : '#FEF3C7'),
                borderRadius: '0.5rem',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangleIcon />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: hasFailedPayments ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : (actualTheme === 'dark' ? '#FCD34D' : '#D97706'),
                  margin: 0
                }}>
                  {hasFailedPayments ? 'Payment Action Required' : 'Pending Payments'}
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: hasFailedPayments ? (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B') : (actualTheme === 'dark' ? '#FCD34D' : '#92400E'),
                  margin: '0.25rem 0 0 0'
                }}>
                  You have {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} totaling <strong>{formatPrice(totalPendingAmount)}</strong> that need{pendingPayments.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
            <Link
              href="/user/event-coordinator/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: actualTheme === 'dark' ? '#60A5FA' : '#C0096D',
                textDecoration: 'none'
              }}
            >
              View All
              <ChevronRightIcon />
            </Link>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}>
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  flex: '0 0 auto',
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  minWidth: '280px',
                  border: payment.status === 'failed' ? `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FECACA'}` : `2px solid ${colors.borderPrimary}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {payment.photographerImage && (
                    <img src={payment.photographerImage} alt={payment.photographerName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {payment.photographerName}
                    {payment.status === 'failed' && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px',
                        backgroundColor: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2',
                        color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626'
                      }}>
                        FAILED
                      </span>
                    )}
                    {payment.status === 'partially_paid' && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px',
                        backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE',
                        color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB'
                      }}>
                        PARTIAL
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                    {payment.eventName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: payment.status === 'failed' ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : (actualTheme === 'dark' ? '#60A5FA' : '#C0096D')
                  }}>
                    {formatPrice(payment.amount - payment.paidAmount)}
                  </div>
                  <button
                    onClick={() => handlePayNow(payment)}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: payment.status === 'failed' ? '#DC2626' : '#083A85',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      borderRadius: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {payment.status === 'failed' ? (
                      <>
                        <RefreshIcon />
                        Retry
                      </>
                    ) : (
                      <>
                        <CreditCardIcon />
                        Pay Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mobile-main-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '1rem'
      }}>
        <div>
          <section className="mobile-card" style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm,
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              lineHeight: '1.25rem',
              fontWeight: '100',
              color: colors.textPrimary,
              marginBottom: '1rem'
            }}>Event Performance</h2>
            <PerformanceChart data={performanceData} height={200} />
          </section>

          <section className="mobile-card" style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <h2 style={{
                fontSize: '1.2rem',
                lineHeight: '1.25rem',
                fontWeight: '100',
                color: colors.textPrimary
              }}>Photographers</h2>
              <Link href="/user/event-coordinator/photographers" style={{
                fontSize: '1rem',
                lineHeight: '1rem',
                color: colors.textLink,
                fontWeight: '500',
                textDecoration: 'none'
              }}>See all</Link>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}>
              {photographers.map((photographer) => {
                const getStatusStyle = () => {
                  switch (photographer.status) {
                    case 'In Progress':
                      return { backgroundColor: actualTheme === 'dark' ? '#831843' : '#FCE7F3', color: actualTheme === 'dark' ? '#F9A8D4' : '#C0096D' };
                    case 'Completed':
                      return { backgroundColor: actualTheme === 'dark' ? '#064E3B' : '#D1FAE5', color: actualTheme === 'dark' ? '#34D399' : '#059669' };
                    case 'Pending':
                      return { backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', color: actualTheme === 'dark' ? '#FBBF24' : '#D97706' };
                    default:
                      return {};
                  }
                };

                return (
                  <div
                    key={photographer.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      transition: 'background-color 0.3s',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push('/user/event-coordinator/photographers')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                      </svg>
                      {photographer.avatar && (
                        <img src={photographer.avatar} alt={photographer.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                    </div>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.125rem'
                    }}>
                      <span style={{
                        fontSize: '1rem',
                        lineHeight: '1.25rem',
                        fontWeight: '700',
                        color: colors.textPrimary
                      }}>{photographer.name}</span>
                      <span style={{
                        fontSize: '0.85rem',
                        lineHeight: '1rem',
                        color: colors.textSecondary
                      }}>{photographer.event}</span>
                    </div>
                    <span style={{
                      paddingLeft: '0.625rem',
                      paddingRight: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem',
                      lineHeight: '1rem',
                      fontWeight: '600',
                      ...getStatusStyle()
                    }}>{photographer.status === 'Completed' ? 'Approved' : photographer.status}</span>
                    <div style={{ position: 'relative' }}>
                      <button
                        style={{
                          padding: '0.25rem',
                          color: colors.textTertiary,
                          fontSize: '1.25rem',
                          lineHeight: '1.75rem',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          transition: 'color 0.3s'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(photographer.id);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = colors.textSecondary}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
                      >
                        <span>⋮</span>
                      </button>
                      {activeDropdown === photographer.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: colors.bgCard,
                          borderRadius: '0.5rem',
                          boxShadow: colors.shadowMd,
                          border: `2px solid ${colors.borderPrimary}`,
                          zIndex: 10,
                          minWidth: '140px',
                          overflow: 'hidden'
                        }}>
                          <Link
                            href="/user/event-coordinator/photographers"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem 0.875rem',
                              fontSize: '0.875rem',
                              color: colors.textPrimary,
                              textDecoration: 'none',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <EyeIcon />
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div>
          <section className="mobile-card" style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm,
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              lineHeight: '1.25rem',
              fontWeight: '100',
              color: colors.textPrimary,
              marginBottom: '0.875rem'
            }}>Recent Activities</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </section>

          <section className="mobile-card" style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <h2 style={{
                fontSize: '1.2rem',
                lineHeight: '1.25rem',
                fontWeight: '100',
                color: colors.textPrimary
              }}>Recent Transactions</h2>
              <Link href="/user/event-coordinator/payments" style={{
                fontSize: '1rem',
                lineHeight: '1rem',
                color: colors.textLink,
                fontWeight: '500',
                textDecoration: 'none'
              }}>See all</Link>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}>
              {recentPayments.map((payment, index) => (
                <PaymentItem key={index} {...payment} />
              ))}
            </div>
          </section>
        </div>
      </div>
        </div>
      </div>
    </div>

      {showSetupModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowSetupModal(false)}
        >
          <div
            style={{ backgroundColor: colors.bgCard, borderRadius: '1rem', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="6" width="22" height="15" rx="2" stroke="#083A85" strokeWidth="2"/>
                <path d="M1 10H23" stroke="#083A85" strokeWidth="2"/>
                <circle cx="6" cy="15" r="1.5" fill="#083A85"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.75rem 0' }}>
              Payment Account Required
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.5rem 0', lineHeight: '1.6' }}>
              You need to set up a payment account before making payments. Add one in Preferences → Payment Accounts.
            </p>
            <button
              onClick={() => { setShowSetupModal(false); router.push('/user/event-coordinator/preferences?tab=payments'); }}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#083A85', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '0.75rem' }}
            >
              Set Up Payment Account
            </button>
            <button
              onClick={() => setShowSetupModal(false)}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: colors.textSecondary, border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
      />
    </>
  );
};

export default EventCoordinatorDashboard;
