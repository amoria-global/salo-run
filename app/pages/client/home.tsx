"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import PayNowModal, { Payment } from '../../components/UnlockModal';
import {
  StatCard,
  ActivityItem,
  PaymentItem,
  PerformanceChart,
  MoneyIcon,
  ClockIcon,
  UsersIcon,
  GiftIcon,
  StarIcon
} from '../../components/dashboard';

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
    case 'morning': return "Ready to discover amazing photographers for your next event?";
    case 'afternoon': return "Perfect time to browse through your galleries!";
    case 'evening': return "Time to relive today's beautiful moments!";
    default: return "Late night browsing? Your galleries await!";
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
  photographerImage?: string;
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
  avatar?: string;
}

interface AnalyticsData {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  totalSpent: number;
  pendingAmount: number;
  gifts: number;
  totalPhotos: number;
  totalVideos: number;
  bookmarkedPhotographers: number;
  unreadNotifications: number;
}

interface ApiPayment {
  id: string;
  eventId: string;
  eventTitle: string;
  photographerName: string | null;
  photographerImage: string | null;
  amount: number;
  amountInUsd?: number;
  paidAmountInUsd?: number;
  currencyAbbreviation: string;
  paymentType: string;
  status: string;
  paidAmount: number;
  dueDate: string;
  createdAt: string;
}

interface ApiActivity {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const ClientDashboard = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customApplied, setCustomApplied] = useState(false);

  // API data state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ label: string; value: string; valueColor?: string }[]>([]);
  const [recentPayments, setRecentPayments] = useState<{ name: string; type: string; amount: string; avatar?: string }[]>([]);
  const [performanceData, setPerformanceData] = useState([
    { day: 'Sun', value1: 0, value2: 0 },
    { day: 'Mon', value1: 0, value2: 0 },
    { day: 'Tue', value1: 0, value2: 0 },
    { day: 'Wed', value1: 0, value2: 0 },
    { day: 'Thu', value1: 0, value2: 0 },
    { day: 'Fri', value1: 0, value2: 0 },
    { day: 'Sat', value1: 0, value2: 0 }
  ]);
  const [statTrends, setStatTrends] = useState<Record<string, { percentage: string; trend: 'up' | 'down' }>>({
    totalSpent: { percentage: '0%', trend: 'up' },
    pending: { percentage: '0%', trend: 'up' },
    bookings: { percentage: '0%', trend: 'up' },
    gifts: { percentage: '0%', trend: 'up' },
    favorites: { percentage: '0%', trend: 'up' },
  });
  const [isLoading, setIsLoading] = useState(true);


  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    const apiUrl = getApiUrl();
    const periodParam = activeFilter === 'today' ? 'today' : activeFilter === 'month' ? 'month' : 'week';
    const customDateQuery = activeFilter === 'custom' && customApplied && customStartDate && customEndDate
      ? `&startDate=${customStartDate}&endDate=${customEndDate}` : '';
    const perfQuery = activeFilter === 'custom' && customApplied && customStartDate && customEndDate
      ? `period=custom${customDateQuery}` : `period=${periodParam}`;
    const trendsQuery = activeFilter === 'custom' && customApplied && customStartDate && customEndDate
      ? `period=custom&from=${customStartDate}&to=${customEndDate}` : `period=${periodParam}`;
    try {
      const [analyticsRes, pendingRes, photographersRes, activitiesRes, paymentsRes, performanceRes, trendsRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics`),
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/payments/pending`),
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics/photographers?size=5`),
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics/recent-activities?size=6`),
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics/recent-payments?size=5`),
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics/performance?${perfQuery}`),
        dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics/trends?${trendsQuery}`),
      ]);

      // Analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.action === 1 && data.data) {
          setAnalytics(data.data);
        }
      }

      // Pending Payments
      if (pendingRes.status === 'fulfilled' && pendingRes.value.ok) {
        const data = await pendingRes.value.json();
        if (data.action === 1 && data.data) {
          const mapped: PendingPayment[] = (data.data as ApiPayment[]).map((p) => ({
            id: p.id,
            eventName: p.eventTitle || 'Event',
            photographerName: p.photographerName || 'Photographer',
            photographerImage: normalizeImageUrl(p.photographerImage || undefined),
            amount: p.amountInUsd ?? p.amount,
            paidAmount: p.paidAmountInUsd ?? p.paidAmount ?? 0,
            dueDate: p.dueDate ? p.dueDate.split('T')[0] : '',
            status: p.status === 'PARTIAL' ? 'partially_paid' : p.status === 'FAILED' ? 'failed' : 'pending' as PendingPayment['status'],
          }));
          setPendingPayments(mapped);
        }
      }

      // Photographers
      if (photographersRes.status === 'fulfilled' && photographersRes.value.ok) {
        const data = await photographersRes.value.json();
        if (data.action === 1 && data.data) {
          const mapped: Photographer[] = (data.data as Array<{ id: string; name: string; event: string; status: string; avatar: string | null }>).map((p) => ({
            id: p.id,
            name: p.name,
            event: p.event || 'Event',
            status: (p.status as Photographer['status']) || 'Pending',
            avatar: normalizeImageUrl(p.avatar || undefined),
          }));
          setPhotographers(mapped);
        }
      }

      // Recent Activities
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
        const data = await activitiesRes.value.json();
        if (data.action === 1 && data.data) {
          const mapped = (data.data as ApiActivity[]).map((a) => ({
            label: a.type ? a.type.charAt(0) + a.type.slice(1).toLowerCase() : 'Activity',
            value: a.title || a.message,
          }));
          setRecentActivities(mapped);
        }
      }

      // Recent Transactions — show pending/unpaid photographers
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        const data = await paymentsRes.value.json();
        if (data.action === 1 && data.data) {
          const pendingTxns = (data.data as ApiPayment[])
            .filter((p) => p.status !== 'COMPLETED' && p.status !== 'SUCCESS')
            .slice(0, 5)
            .map((p) => ({
              name: p.photographerName || 'Payment',
              type: p.status === 'PARTIAL' ? 'Partially paid' : p.status === 'FAILED' ? 'Failed' : 'Pending',
              amount: formatPrice(p.amountInUsd ?? p.amount),
              avatar: normalizeImageUrl(p.photographerImage || undefined),
            }));
          setRecentPayments(pendingTxns);
        }
      }

      // Performance Chart
      if (performanceRes.status === 'fulfilled' && performanceRes.value.ok) {
        const data = await performanceRes.value.json();
        if (data.action === 1 && Array.isArray(data.data)) {
          setPerformanceData(data.data.map((d: any) => ({
            day: d.day || '',
            value1: Number(d.value1) || 0,
            value2: Number(d.value2) || 0,
          })));
        }
      }

      // Stat Trends
      if (trendsRes.status === 'fulfilled' && trendsRes.value.ok) {
        const data = await trendsRes.value.json();
        if (data.action === 1 && data.data) {
          const t = data.data;
          const fmt = (m: any) => ({
            percentage: m?.changePercent != null ? `${Math.abs(m.changePercent).toFixed(1)}%` : '0%',
            trend: (m?.trend === 'down' ? 'down' : 'up') as 'up' | 'down',
          });
          setStatTrends({
            totalSpent: fmt(t.totalSpent),
            pending: fmt(t.pending),
            bookings: fmt(t.events),
            gifts: fmt(t.gifts),
            favorites: fmt(t.photographers),
          });
        }
      }
    } catch (error) {
      console.error('[Client Dashboard] Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formatPrice, activeFilter, customApplied, customStartDate, customEndDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePayNow = (pending: PendingPayment) => {
    const payment: Payment = {
      id: parseInt(pending.id.replace(/\D/g, '')) || 0,
      declarationId: pending.id,
      date: pending.dueDate,
      eventName: pending.eventName,
      eventType: 'Photography',
      photographerName: pending.photographerName,
      photographerImage: pending.photographerImage ?? '',
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

  const periodLabel = activeFilter === 'today' ? 'yesterday' : activeFilter === 'month' ? 'last month' : activeFilter === 'custom' && customStartDate && customEndDate ? `${customStartDate} - ${customEndDate}` : 'last week';

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
          .mobile-pending-header {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-pending-header .mobile-view-all-link {
            align-self: flex-start !important;
          }
          .mobile-pending-card {
            min-width: 240px !important;
          }
          .mobile-card {
            padding: 1rem !important;
          }
          .mobile-photographer-row {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .mobile-photographer-status {
            order: 4 !important;
            margin-left: 2.875rem !important;
          }
          .mobile-photographer-menu {
            position: absolute !important;
            top: 0.5rem !important;
            right: 0 !important;
          }
          .mobile-photographer-menu button {
            padding: 0.5rem !important;
            min-width: 44px !important;
            min-height: 44px !important;
          }
          .mobile-pay-btn {
            min-height: 40px !important;
            padding: 0.5rem 1rem !important;
            font-size: 0.8rem !important;
          }
          .mobile-custom-dates {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
          }
          .mobile-custom-dates > div {
            width: 100% !important;
          }
          .mobile-custom-dates input[type="date"] {
            flex: 1 !important;
            width: 100% !important;
            min-height: 40px !important;
          }
          .mobile-custom-dates button {
            width: 100% !important;
            min-height: 40px !important;
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
          .mobile-pending-card {
            min-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .mobile-pending-cards-scroll {
            flex-direction: column !important;
            overflow-x: visible !important;
          }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }
      `}</style>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="client" giftAmount={analytics?.gifts || 0} />

        <div className="mobile-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: colors.bgPrimary,
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          {/* KYC Warning Banner */}
          {user && user.kycStatus !== 'APPROVED' && user.customerType !== 'Viewer' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
              padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.5rem',
              backgroundColor: user.kycStatus === 'REJECTED'
                ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEF2F2')
                : user.kycStatus === 'PENDING'
                  ? (actualTheme === 'dark' ? '#78350F' : '#FFFBEB')
                  : (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF'),
              color: user.kycStatus === 'REJECTED'
                ? (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B')
                : user.kycStatus === 'PENDING'
                  ? (actualTheme === 'dark' ? '#FDE68A' : '#92400E')
                  : (actualTheme === 'dark' ? '#93C5FD' : '#1E40AF'),
              border: `1px solid ${user.kycStatus === 'REJECTED' ? '#F87171' : user.kycStatus === 'PENDING' ? '#F59E0B' : '#3B82F6'}40`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, fontSize: '0.85rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{user.kycStatus === 'REJECTED' ? '\u2716' : user.kycStatus === 'PENDING' ? '\u23F3' : '\u26A0'}</span>
                <span style={{ fontWeight: 600 }}>
                  {user.kycStatus === 'PENDING' && 'Your KYC verification is under review'}
                  {user.kycStatus === 'REJECTED' && 'Your KYC verification was rejected. Please resubmit.'}
                  {(!user.kycStatus || user.kycStatus === 'NOT_SUBMITTED') && 'Complete KYC verification to unlock withdrawals and all features'}
                </span>
              </div>
              {user.kycStatus !== 'PENDING' && (
                <button
                  onClick={() => router.push('/user/client/profile')}
                  style={{
                    backgroundColor: user.kycStatus === 'REJECTED' ? '#EF4444' : '#3B82F6',
                    color: '#FFFFFF', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '0.375rem',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {user.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}
                </button>
              )}
            </div>
          )}

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
                }}>Spent</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{formatPrice(analytics?.totalSpent || 0)}</span>
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
                }}>Bookings</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{analytics?.totalBookings || 0}</span>
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
                }}>Photos</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{analytics?.totalPhotos || 0}</span>
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
        <div className="mobile-custom-dates" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary, whiteSpace: 'nowrap' }}>From</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => { setCustomStartDate(e.target.value); setCustomApplied(false); }}
              max={customEndDate || undefined}
              style={{
                padding: '0.4rem 0.625rem',
                borderRadius: '0.375rem',
                border: `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard,
                color: colors.textPrimary,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary, whiteSpace: 'nowrap' }}>To</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => { setCustomEndDate(e.target.value); setCustomApplied(false); }}
              min={customStartDate || undefined}
              style={{
                padding: '0.4rem 0.625rem',
                borderRadius: '0.375rem',
                border: `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgCard,
                color: colors.textPrimary,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <button
            onClick={() => { if (customStartDate && customEndDate) setCustomApplied(true); }}
            disabled={!customStartDate || !customEndDate}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: customStartDate && customEndDate ? '#F20C8F' : colors.borderPrimary,
              color: customStartDate && customEndDate ? 'white' : colors.textTertiary,
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: customStartDate && customEndDate ? 'pointer' : 'not-allowed',
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
          title="Total Spent"
          value={formatPrice(analytics?.totalSpent || 0)}
          percentage={statTrends.totalSpent.percentage}
          timeframe={periodLabel}
          icon={<MoneyIcon />}
          trend={statTrends.totalSpent.trend}
          accentColor="#083A85"
        />
        <StatCard
          title="Pending"
          value={formatPrice(analytics?.pendingAmount || 0)}
          percentage={statTrends.pending.percentage}
          timeframe={periodLabel}
          icon={<ClockIcon />}
          trend={statTrends.pending.trend}
          accentColor="#F59E0B"
        />
        <StatCard
          title="Bookings"
          value={String(analytics?.totalBookings || 0)}
          percentage={statTrends.bookings.percentage}
          timeframe={periodLabel}
          icon={<UsersIcon />}
          trend={statTrends.bookings.trend}
          href="/user/client/events"
          accentColor="#3B82F6"
        />
        <StatCard
          title="Gifts"
          value={formatPrice(analytics?.gifts || 0)}
          percentage={statTrends.gifts.percentage}
          timeframe={periodLabel}
          icon={<GiftIcon />}
          trend={statTrends.gifts.trend}
          accentColor="#10B981"
        />
        <StatCard
          title="Favorites"
          value={String(analytics?.bookmarkedPhotographers || 0)}
          percentage={statTrends.favorites.percentage}
          timeframe={periodLabel}
          icon={<StarIcon />}
          trend={statTrends.favorites.trend}
          href="/user/client/photographers"
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
          <div className="mobile-pending-header" style={{
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
              className="mobile-view-all-link"
              href="/user/client/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                textDecoration: 'none',
                flexShrink: 0
              }}
            >
              View All
              <ChevronRightIcon />
            </Link>
          </div>

          <div className="mobile-pending-cards-scroll" style={{
            display: 'flex',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}>
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="mobile-pending-card"
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
                    color: payment.status === 'failed' ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : (actualTheme === 'dark' ? '#60A5FA' : '#083A85')
                  }}>
                    {formatPrice(payment.amount - payment.paidAmount)}
                  </div>
                  <button
                    className="mobile-pay-btn"
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
        gap: '1rem',
        minWidth: 0
      }}>
        <div style={{ minWidth: 0 }}>
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
            }}>Performance</h2>
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
              <Link href="/user/client/photographers" style={{
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
                      return { backgroundColor: actualTheme === 'dark' ? '#831843' : '#FCE7F3', color: actualTheme === 'dark' ? '#F9A8D4' : '#DB2777' };
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
                    className="mobile-photographer-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      transition: 'background-color 0.3s',
                      position: 'relative'
                    }}
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
                    <span className="mobile-photographer-status" style={{
                      paddingLeft: '0.625rem',
                      paddingRight: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem',
                      lineHeight: '1rem',
                      fontWeight: '600',
                      ...getStatusStyle()
                    }}>{photographer.status}</span>
                    <div className="mobile-photographer-menu" style={{ position: 'relative' }}>
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
                            href="/user/client/photographers"
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
              }}>Recent payments</h2>
              <Link href="/user/client/payments" style={{
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

      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
        onPaymentSuccess={() => { setShowPayNowModal(false); fetchDashboardData(); }}
      />
    </>
  );
};

export default ClientDashboard;
