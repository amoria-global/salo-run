"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth } from '../../providers/AuthProvider';
import {
  StatCard,
  HeaderStat,
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

const ClientDashboard = () => {
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  // Pending Payments Data
  const pendingPayments: PendingPayment[] = [
    {
      id: 'PAY-001',
      eventName: 'Corporate Headshots',
      photographerName: 'Elite Photography',
      photographerImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
      amount: 500,
      paidAmount: 0,
      dueDate: '2025-07-25',
      status: 'pending'
    },
    {
      id: 'PAY-002',
      eventName: 'Family Portrait',
      photographerName: 'Mary Shots',
      photographerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
      amount: 250,
      paidAmount: 125,
      dueDate: '2025-07-30',
      status: 'partially_paid'
    },
    {
      id: 'PAY-003',
      eventName: 'Fashion Shoot',
      photographerName: 'Sarah Lens',
      photographerImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
      amount: 400,
      paidAmount: 0,
      dueDate: '2025-08-05',
      status: 'failed'
    }
  ];

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const hasFailedPayments = pendingPayments.some(p => p.status === 'failed');

  const performanceData = [
    { day: 'Sun', value1: 130, value2: 150 },
    { day: 'Mon', value1: 90, value2: 100 },
    { day: 'Tue', value1: 100, value2: 130 },
    { day: 'Wed', value1: 60, value2: 70 },
    { day: 'Thu', value1: 70, value2: 80 },
    { day: 'Fri', value1: 130, value2: 150 },
    { day: 'Sat', value1: 90, value2: 70 }
  ];

  const recentActivities = [
    { label: 'Photographer', value: 'John Studio' },
    { label: 'Payment', value: '-$450', valueColor: '#ff0066' },
    { label: 'Photos', value: 'wedding_gallery.zip' },
    { label: 'Package', value: 'Premium' },
    { label: 'Booking', value: 'Wedding Shoot',  valueColor: '#083A85' },
    { label: 'Last Activity', value: 'Today, 14. July 2025' }
  ];

  const photographers: Photographer[] = [
    {
      id: 'PHT-001',
      name: 'John Studio',
      event: 'Wedding',
      status: 'In Progress' as const,
      avatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg'
    },
    {
      id: 'PHT-002',
      name: 'Mary Shots',
      event: 'Birthday',
      status: 'Completed' as const,
      avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'
    },
    {
      id: 'PHT-003',
      name: 'Alex Frames',
      event: 'Festival',
      status: 'Pending' as const,
      avatar: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg'
    }
  ];

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const recentPayments = [
    {
      name: 'John Studio',
      type: 'Booking Payment',
      amount: '$1,950',
      avatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg'
    },
    {
      name: 'Mary Shots',
      type: 'Photo Package',
      amount: '$850',
      avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'
    },
    {
      name: 'Amoria',
      type: 'Platform Fee',
      amount: '$25.00',
      logo: '/logo.png'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: colors.bgPrimary
    }}>
      <style jsx>{`
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
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mobile-main-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-pending-payments {
            padding: 1rem !important;
          }
          .mobile-card {
            padding: 1rem !important;
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
        }
      `}</style>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="client" giftAmount={225.00} />

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
                }}>Spent</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>$9.64k</span>
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
                }}>12</span>
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
                }}>248</span>
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

      <div className="mobile-stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <StatCard
          title="Total Spent"
          value="$2,600"
          percentage="52.76%"
          timeframe="last week"
          icon={<MoneyIcon />}
          trend="up"
          href="/user/client/transactions"
        />
        <StatCard
          title="Pending"
          value="$700"
          percentage="36.8%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          href="/user/client/bookings"
        />
        <StatCard
          title="Bookings"
          value="12"
          percentage="5.4%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href="/user/client/bookings"
        />
        <StatCard
          title="Gifts"
          value="$225"
          percentage="12.5%"
          timeframe="last week"
          icon={<GiftIcon />}
          trend="up"
          href="/user/client/payments"
        />
        <StatCard
          title="Favorites"
          value="8"
          percentage="8%"
          timeframe="photographers"
          icon={<StarIcon />}
          trend="up"
          href="/user/client/photographers"
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
                  You have {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} totaling <strong>${totalPendingAmount}</strong> that need{pendingPayments.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
            <Link
              href="/user/client/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
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
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={payment.photographerImage}
                    alt={payment.photographerName}
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
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
                    {payment.eventName}
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
                    {payment.photographerName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: payment.status === 'failed' ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : (actualTheme === 'dark' ? '#60A5FA' : '#083A85')
                  }}>
                    ${payment.amount - payment.paidAmount}
                  </div>
                  <Link
                    href="/user/client/payments"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: payment.status === 'failed' ? '#F20C8F' : (actualTheme === 'dark' ? '#60A5FA' : '#083A85'),
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.25rem'
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
                        Pay
                      </>
                    )}
                  </Link>
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
                    <img
                      src={photographer.avatar}
                      alt={photographer.name}
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '9999px',
                        objectFit: 'cover'
                      }}
                    />
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
                    }}>{photographer.status}</span>
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
  );
};

export default ClientDashboard;
