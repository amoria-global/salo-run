"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
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
  StarIcon,
} from '../../components/dashboard';
import { Card, Tabs, EmptyState, Badge } from '../../components/ui';

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

const HeroMiniStat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', padding: '4px 6px' }}>
    <div style={{
      fontSize: '0.68rem',
      fontWeight: 700,
      color: 'var(--ck-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>{label}</div>
    <div style={{
      fontSize: '1.15rem',
      fontWeight: 800,
      letterSpacing: '-0.01em',
      marginTop: 4,
      color,
      lineHeight: 1.1,
    }}>{value}</div>
  </div>
);

const greetingFor = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

const getStaticMessage = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Ready to discover photographers for your next event?';
  if (hour < 17) return 'Browse galleries and meet the people behind the lens.';
  if (hour < 21) return 'Relive the moments that mattered today.';
  return 'Late-night browsing? Your galleries are waiting.';
};

const ClientDashboard = () => {
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customApplied, setCustomApplied] = useState(false);

  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);

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
    { day: 'Sat', value1: 0, value2: 0 },
  ]);
  const [statTrends, setStatTrends] = useState<Record<string, { percentage: string; trend: 'up' | 'down' }>>({
    totalSpent: { percentage: '0%', trend: 'up' },
    pending: { percentage: '0%', trend: 'up' },
    bookings: { percentage: '0%', trend: 'up' },
    gifts: { percentage: '0%', trend: 'up' },
    favorites: { percentage: '0%', trend: 'up' },
  });

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

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.action === 1 && data.data) setAnalytics(data.data);
      }

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
    }
  }, [formatPrice, activeFilter, customApplied, customStartDate, customEndDate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

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

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const hasFailedPayments = pendingPayments.some(p => p.status === 'failed');
  const periodLabel = activeFilter === 'today' ? 'yesterday' : activeFilter === 'month' ? 'last month' : activeFilter === 'custom' && customStartDate && customEndDate ? `${customStartDate} → ${customEndDate}` : 'last week';

  const statusTone = (s: Photographer['status']): 'accent' | 'success' | 'warning' | 'muted' => {
    if (s === 'In Progress') return 'accent';
    if (s === 'Completed') return 'success';
    if (s === 'Pending') return 'warning';
    return 'muted';
  };

  const greeting = greetingFor(new Date().getHours());

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--ck-surface-soft)', width: '100%', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Topbar userRole="client" />

          <main className="ck-page" style={{ overflowY: 'auto', flex: 1 }}>
            {/* Hero greeting */}
            <section className="ck-fade-in-up dashboard-hero" style={{
              position: 'relative',
              borderRadius: 20,
              padding: '28px 28px 24px',
              background: 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.05) 100%)',
              border: '1px solid var(--ck-stroke)',
              marginBottom: 22,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 20,
              alignItems: 'center',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ck-pink)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Your dashboard
                </div>
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--ck-text)',
                  lineHeight: 1.1,
                }}>
                  {greeting}, <span className="ck-gradient-text">{user?.firstName || 'there'}</span>
                </h1>
                <p style={{ margin: '8px 0 0', color: 'var(--ck-text-soft)', fontSize: '0.95rem' }}>{getStaticMessage()}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <Link href="/user/client/photographers" className="ck-btn ck-btn-primary">
                    <i className="bi bi-camera" /> Find a photographer
                  </Link>
                  <Link href="/user/client/events" className="ck-btn ck-btn-ghost">
                    <i className="bi bi-calendar-event" /> My events
                  </Link>
                </div>
              </div>

              <div className="hero-stats-card" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(96px, 1fr))',
                gap: 8,
                background: 'var(--ck-surface)',
                border: '1px solid var(--ck-stroke)',
                borderRadius: 16,
                padding: 16,
                minWidth: 320,
                boxShadow: 'var(--ck-shadow-sm)',
                position: 'relative',
                zIndex: 1,
              }}>
                <HeroMiniStat label="Spent" value={formatPrice(analytics?.totalSpent || 0)} color="#083A85" />
                <HeroMiniStat label="Bookings" value={String(analytics?.totalBookings || 0)} color="#F20C8F" />
                <HeroMiniStat label="Photos" value={String(analytics?.totalPhotos || 0)} color="#10B981" />
              </div>
            </section>

            {/* Filter row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <Tabs
                active={activeFilter}
                onChange={(k) => setActiveFilter(k as any)}
                items={[
                  { key: 'today', label: 'Today' },
                  { key: 'week',  label: 'This week' },
                  { key: 'month', label: 'This month' },
                  { key: 'custom', label: 'Custom' },
                ]}
              />
              {activeFilter === 'custom' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" value={customStartDate} onChange={(e) => { setCustomStartDate(e.target.value); setCustomApplied(false); }}
                    className="ck-input" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                    max={customEndDate || undefined} />
                  <span style={{ color: 'var(--ck-text-muted)' }}>→</span>
                  <input type="date" value={customEndDate} onChange={(e) => { setCustomEndDate(e.target.value); setCustomApplied(false); }}
                    className="ck-input" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                    min={customStartDate || undefined} />
                  <button
                    className="ck-btn ck-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => { if (customStartDate && customEndDate) setCustomApplied(true); }}
                    disabled={!customStartDate || !customEndDate}
                  >Apply</button>
                </div>
              )}
            </div>

            {/* Stat cards */}
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 14,
              marginBottom: 22,
            }}>
              <StatCard title="Total Spent" value={formatPrice(analytics?.totalSpent || 0)} percentage={statTrends.totalSpent.percentage} timeframe={periodLabel} icon={<MoneyIcon />} trend={statTrends.totalSpent.trend} accentColor="#083A85" />
              <StatCard title="Pending" value={formatPrice(analytics?.pendingAmount || 0)} percentage={statTrends.pending.percentage} timeframe={periodLabel} icon={<ClockIcon />} trend={statTrends.pending.trend} accentColor="#F59E0B" />
              <StatCard title="Bookings" value={String(analytics?.totalBookings || 0)} percentage={statTrends.bookings.percentage} timeframe={periodLabel} icon={<UsersIcon />} trend={statTrends.bookings.trend} href="/user/client/events" accentColor="#3B82F6" />
              <StatCard title="Gifts" value={formatPrice(analytics?.gifts || 0)} percentage={statTrends.gifts.percentage} timeframe={periodLabel} icon={<GiftIcon />} trend={statTrends.gifts.trend} accentColor="#10B981" />
              <StatCard title="Favorites" value={String(analytics?.bookmarkedPhotographers || 0)} percentage={statTrends.favorites.percentage} timeframe={periodLabel} icon={<StarIcon />} trend={statTrends.favorites.trend} href="/user/client/photographers" accentColor="#F20C8F" />
            </div>

            {/* Pending Payments Alert */}
            {pendingPayments.length > 0 && (
              <Card style={{
                marginBottom: 22,
                background: hasFailedPayments ? 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 60%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 60%)',
                border: hasFailedPayments ? '1px solid #FECACA' : '1px solid #FDE68A',
              }} padding={20}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: hasFailedPayments ? '#FEE2E2' : '#FEF3C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className="bi bi-exclamation-triangle" style={{ color: hasFailedPayments ? '#DC2626' : '#F59E0B', fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: hasFailedPayments ? '#991B1B' : '#92400E' }}>
                        {hasFailedPayments ? 'Payment action required' : 'Pending payments'}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: hasFailedPayments ? '#991B1B' : '#92400E', opacity: 0.85 }}>
                        {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} totaling <strong>{formatPrice(totalPendingAmount)}</strong>
                      </p>
                    </div>
                  </div>
                  <Link href="/user/client/payments" className="ck-btn ck-btn-soft" style={{ background: 'rgba(255,255,255,0.7)' }}>
                    View all <i className="bi bi-arrow-right" />
                  </Link>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}>
                  {pendingPayments.slice(0, 4).map((p) => (
                    <div key={p.id} className="ck-card" style={{
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'var(--ck-surface)',
                      borderColor: p.status === 'failed' ? '#FECACA' : 'var(--ck-stroke)',
                    }}>
                      {p.photographerImage ? (
                        <img src={p.photographerImage} alt={p.photographerName} style={{ width: 38, height: 38, borderRadius: 9999, objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="ck-avatar" style={{ width: 38, height: 38 }}>{p.photographerName.charAt(0).toUpperCase()}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ck-text)' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.photographerName}</span>
                          {p.status === 'failed' && <Badge tone="error">Failed</Badge>}
                          {p.status === 'partially_paid' && <Badge tone="info">Partial</Badge>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ck-text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.eventName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: p.status === 'failed' ? '#DC2626' : 'var(--ck-blue)' }}>
                          {formatPrice(p.amount - p.paidAmount)}
                        </div>
                        <button onClick={() => handlePayNow(p)} className="ck-btn"
                          style={{
                            marginTop: 4,
                            padding: '5px 10px',
                            fontSize: '0.72rem',
                            background: p.status === 'failed' ? '#DC2626' : 'var(--ck-blue)',
                            color: '#fff',
                            border: 'none',
                          }}>
                          <i className={`bi ${p.status === 'failed' ? 'bi-arrow-clockwise' : 'bi-credit-card'}`} />
                          {p.status === 'failed' ? 'Retry' : 'Pay'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Main grid */}
            <div className="main-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 340px',
              gap: 16,
            }}>
              {/* Left column */}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card padding={20}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h2 className="ck-section-title" style={{ fontSize: '1.05rem' }}>Performance</h2>
                      <p className="ck-section-subtitle" style={{ fontSize: '0.82rem' }}>Activity over the {periodLabel}</p>
                    </div>
                  </div>
                  <PerformanceChart data={performanceData} height={210} />
                </Card>

                <Card padding={20}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h2 className="ck-section-title" style={{ fontSize: '1.05rem' }}>Photographers</h2>
                      <p className="ck-section-subtitle" style={{ fontSize: '0.82rem' }}>People you've worked with</p>
                    </div>
                    <Link href="/user/client/photographers" style={{ fontSize: '0.85rem', color: 'var(--ck-blue)', textDecoration: 'none', fontWeight: 600 }}>
                      See all →
                    </Link>
                  </div>
                  {photographers.length === 0 ? (
                    <EmptyState
                      icon={<i className="bi bi-camera" />}
                      title="No photographers yet"
                      description="When you book a photographer, they'll appear here."
                      action={<Link href="/user/client/photographers" className="ck-btn ck-btn-primary">Browse photographers</Link>}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {photographers.map((ph) => (
                        <div key={ph.id} className="ck-row" style={{ gap: 12 }}>
                          {ph.avatar ? (
                            <img src={ph.avatar} alt={ph.name} style={{ width: 36, height: 36, borderRadius: 9999, objectFit: 'cover', flexShrink: 0 }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <span className="ck-avatar">{ph.name.charAt(0).toUpperCase()}</span>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ck-text)' }}>{ph.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ck-text-soft)' }}>{ph.event}</div>
                          </div>
                          <Badge tone={statusTone(ph.status)}>{ph.status}</Badge>
                          <Link href="/user/client/photographers" aria-label="View"
                            style={{
                              width: 28, height: 28, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--ck-text-soft)', textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                            <i className="bi bi-arrow-up-right" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card padding={20}>
                  <h2 className="ck-section-title" style={{ fontSize: '1.05rem', marginBottom: 12 }}>Recent activity</h2>
                  {recentActivities.length === 0 ? (
                    <EmptyState icon={<i className="bi bi-activity" />} title="Nothing yet" description="Updates show up here as they happen." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {recentActivities.map((activity, i) => (
                        <ActivityItem key={i} {...activity} />
                      ))}
                    </div>
                  )}
                </Card>

                <Card padding={20}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 className="ck-section-title" style={{ fontSize: '1.05rem' }}>Recent payments</h2>
                    <Link href="/user/client/payments" style={{ fontSize: '0.85rem', color: 'var(--ck-blue)', textDecoration: 'none', fontWeight: 600 }}>
                      See all →
                    </Link>
                  </div>
                  {recentPayments.length === 0 ? (
                    <EmptyState icon={<i className="bi bi-credit-card-2-front" />} title="No payments yet" description="Your transactions will show here." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {recentPayments.map((payment, i) => (
                        <PaymentItem key={i} {...payment} />
                      ))}
                    </div>
                  )}
                </Card>

                <Card padding={20} style={{
                  background: 'linear-gradient(135deg, var(--ck-blue) 0%, #0a4da8 100%)',
                  color: '#fff',
                  border: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-heart-fill" style={{ fontSize: 18 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Make a difference</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: 2 }}>Support causes through Connekyt.</div>
                    </div>
                  </div>
                  <Link href="/user/client/donate" className="ck-btn"
                    style={{ marginTop: 14, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', width: '100%' }}>
                    Donate now <i className="bi bi-arrow-right" />
                  </Link>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
        onPaymentSuccess={() => { setShowPayNowModal(false); fetchDashboardData(); }}
      />

      <style jsx>{`
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .dashboard-hero { grid-template-columns: 1fr !important; }
          .hero-stats-card { min-width: 0 !important; }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .dashboard-hero { padding: 22px 18px 18px !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default ClientDashboard;
