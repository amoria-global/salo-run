"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  StarIcon,
} from '../../components/dashboard';
import { Card, Tabs, EmptyState, Badge } from '../../components/ui';

const LiveStreamFeeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ background: 'linear-gradient(135deg, #F20C8F 0%, #083A85 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <path d="M4.93 4.93a10 10 0 0 1 14.14 0M7.76 7.76a6 6 0 0 1 8.48 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const greetingFor = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

const getStaticMessage = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Ready to manage your upcoming events?';
  if (hour < 17) return 'Time to check stream earnings and event performance.';
  if (hour < 21) return 'Wrap up the day with a quick review.';
  return 'Late-night planning? Your dashboard is ready.';
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

const EventCoordinatorDashboard = () => {
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();

  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);

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
    { day: 'Sat', value1: 0, value2: 0 },
  ]);
  const [trends, setTrends] = useState<Record<string, { value: number; changePercent: number; trend: string }> | null>(null);

  const fetchTrends = useCallback(async (period: string, from?: string, to?: string) => {
    const apiUrl = getApiUrl();
    try {
      let url = `${apiUrl}/api/remote/coordinator/analytics/trends?period=${period}`;
      if (period === 'custom' && from && to) url += `&from=${from}&to=${to}`;
      const res = await dashboardAuthFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.action === 1 && data.data) setTrends(data.data);
      }
    } catch (error) {
      console.error('[Coordinator Dashboard] Error fetching trends:', error);
    }
  }, []);

  useEffect(() => {
    if (activeFilter === 'custom') return;
    fetchTrends(activeFilter);
  }, [activeFilter, fetchTrends]);

  // Performance chart fetch
  useEffect(() => {
    const apiUrl = getApiUrl();
    const period = activeFilter === 'custom' && customDateFrom && customDateTo
      ? `custom&from=${customDateFrom}&to=${customDateTo}`
      : activeFilter;
    dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/analytics/performance?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.action === 1 && Array.isArray(d.data)) {
          setPerformanceData(d.data.map((x: any) => ({ day: x.day || '', value1: Number(x.value1) || 0, value2: Number(x.value2) || 0 })));
        }
      }).catch(() => {});
  }, [activeFilter, customDateFrom, customDateTo]);

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

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.action === 1 && data.data) setAnalytics(data.data);
      }
      if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
        const data = await balanceRes.value.json();
        if (data.action === 1 && data.data) setBalanceData(data.data);
      }
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        const data = await paymentsRes.value.json();
        if (data.action === 1 && data.data) {
          const items = data.data.content || data.data || [];
          const pending: PendingPayment[] = items
            .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'SUCCESS')
            .map((p: any) => ({
              id: p.id || '',
              eventName: p.eventTitle || p.eventName || 'Event',
              photographerName: p.photographerName || 'Photographer',
              photographerImage: normalizeImageUrl(p.photographerImage || undefined) || '',
              amount: p.amountInUsd ?? p.amount ?? 0,
              paidAmount: p.paidAmountInUsd ?? p.paidAmount ?? 0,
              dueDate: p.dueDate ? p.dueDate.split('T')[0] : '',
              status: p.status === 'FAILED' ? 'failed' : p.status === 'PARTIAL' ? 'partially_paid' : 'pending' as PendingPayment['status'],
            }));
          setPendingPayments(pending);
          const pendingTxns = items
            .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'SUCCESS')
            .slice(0, 5)
            .map((p: any) => ({
              name: p.photographerName || p.eventTitle || 'Payment',
              type: p.status === 'PARTIAL' ? 'Partially paid' : p.status === 'FAILED' ? 'Failed' : 'Pending',
              amount: formatPrice(p.amountInUsd ?? p.amount ?? 0),
              avatar: normalizeImageUrl(p.photographerImage || undefined),
            }));
          setRecentPayments(pendingTxns);
        }
      }
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
            avatar: normalizeImageUrl(p.profilePicture || p.profileImage || undefined) || '',
          }));
          setPhotographers(mapped);
        }
      }
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
    }
  }, [formatPrice]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handlePayNow = (pending: PendingPayment) => {
    const payment: Payment = {
      id: parseInt(pending.id.replace(/\D/g, '')) || 0,
      declarationId: pending.id,
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

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const hasFailedPayments = pendingPayments.some(p => p.status === 'failed');
  const periodLabel = activeFilter === 'today' ? 'yesterday' : activeFilter === 'month' ? 'last month' : activeFilter === 'custom' && customDateFrom && customDateTo ? `${customDateFrom} → ${customDateTo}` : 'last week';
  const greeting = greetingFor(new Date().getHours());

  const trendFor = (key: string) => {
    const t = trends?.[key];
    if (!t) return { percentage: '0%', trend: 'up' as 'up' | 'down' };
    return {
      percentage: `${Math.abs(t.changePercent ?? 0).toFixed(1)}%`,
      trend: (t.trend === 'down' ? 'down' : 'up') as 'up' | 'down',
    };
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--ck-surface-soft)', width: '100%', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Topbar userRole="event-coordinator" />

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
                  Coordinator dashboard
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
                  <Link href="/user/event-coordinator/events" className="ck-btn ck-btn-primary">
                    <i className="bi bi-calendar-event" /> My events
                  </Link>
                  <Link href="/user/event-coordinator/streams" className="ck-btn ck-btn-ghost">
                    <i className="bi bi-broadcast" /> Live streams
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
                <HeroMiniStat label="Revenue" value={formatPrice(analytics?.totalRevenue || 0)} color="#083A85" />
                <HeroMiniStat label="Events" value={String(analytics?.totalEvents || 0)} color="#F20C8F" />
                <HeroMiniStat label="Streams" value={String(analytics?.activeStreams || 0)} color="#10B981" />
              </div>
            </section>

            {/* Filter row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <Tabs
                active={activeFilter}
                onChange={(k) => setActiveFilter(k as any)}
                items={[
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This week' },
                  { key: 'month', label: 'This month' },
                  { key: 'custom', label: 'Custom' },
                ]}
              />
              {activeFilter === 'custom' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="ck-input" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }} />
                  <span style={{ color: 'var(--ck-text-muted)' }}>→</span>
                  <input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)}
                    className="ck-input" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }} />
                  <button
                    className="ck-btn ck-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => { if (customDateFrom && customDateTo) fetchTrends('custom', customDateFrom, customDateTo); }}
                    disabled={!customDateFrom || !customDateTo}
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
              <StatCard title="Total Revenue" value={formatPrice(analytics?.totalRevenue || 0)} {...trendFor('totalRevenue')} timeframe={periodLabel} icon={<MoneyIcon />} accentColor="#083A85" />
              <StatCard title="Pending" value={formatPrice(analytics?.totalPending || 0)} {...trendFor('totalPending')} timeframe={periodLabel} icon={<ClockIcon />} accentColor="#F59E0B" />
              <StatCard title="Events" value={String(analytics?.totalEvents || 0)} {...trendFor('totalEvents')} timeframe={periodLabel} icon={<UsersIcon />} href="/user/event-coordinator/events" accentColor="#3B82F6" />
              <StatCard title="Photographers" value={String(analytics?.totalPhotographers || 0)} {...trendFor('totalPhotographers')} timeframe={periodLabel} icon={<StarIcon />} href="/user/event-coordinator/photographers" accentColor="#F20C8F" />
              <StatCard title="Stream Revenue" value={formatPrice(balanceData?.balanceStreamFees ?? 0)} {...trendFor('streamRevenue')} timeframe={periodLabel} icon={<LiveStreamFeeIcon />} accentColor="#10B981" />
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
                  <Link href="/user/event-coordinator/payments" className="ck-btn ck-btn-soft" style={{ background: 'rgba(255,255,255,0.7)' }}>
                    View all <i className="bi bi-arrow-right" />
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {pendingPayments.slice(0, 4).map((p) => (
                    <div key={p.id} className="ck-card" style={{
                      padding: 14, display: 'flex', alignItems: 'center', gap: 12,
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
                            marginTop: 4, padding: '5px 10px', fontSize: '0.72rem',
                            background: p.status === 'failed' ? '#DC2626' : 'var(--ck-blue)',
                            color: '#fff', border: 'none',
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
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card padding={20}>
                  <div style={{ marginBottom: 14 }}>
                    <h2 className="ck-section-title" style={{ fontSize: '1.05rem' }}>Performance</h2>
                    <p className="ck-section-subtitle" style={{ fontSize: '0.82rem' }}>Activity over the {periodLabel}</p>
                  </div>
                  <PerformanceChart data={performanceData} height={210} />
                </Card>

                <Card padding={20}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h2 className="ck-section-title" style={{ fontSize: '1.05rem' }}>Photographers</h2>
                      <p className="ck-section-subtitle" style={{ fontSize: '0.82rem' }}>Approved photographers ready to assign</p>
                    </div>
                    <Link href="/user/event-coordinator/photographers" style={{ fontSize: '0.85rem', color: 'var(--ck-blue)', textDecoration: 'none', fontWeight: 600 }}>
                      See all →
                    </Link>
                  </div>
                  {photographers.length === 0 ? (
                    <EmptyState
                      icon={<i className="bi bi-camera" />}
                      title="No photographers yet"
                      description="Approved photographers will appear here."
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
                          <Badge tone="success">Approved</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card padding={20}>
                  <h2 className="ck-section-title" style={{ fontSize: '1.05rem', marginBottom: 12 }}>Recent activity</h2>
                  {recentActivities.length === 0 ? (
                    <EmptyState icon={<i className="bi bi-activity" />} title="Nothing yet" description="Updates show up here as they happen." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {recentActivities.map((activity, i) => <ActivityItem key={i} {...activity} />)}
                    </div>
                  )}
                </Card>

                <Card padding={20}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 className="ck-section-title" style={{ fontSize: '1.05rem' }}>Recent payments</h2>
                    <Link href="/user/event-coordinator/payments" style={{ fontSize: '0.85rem', color: 'var(--ck-blue)', textDecoration: 'none', fontWeight: 600 }}>
                      See all →
                    </Link>
                  </div>
                  {recentPayments.length === 0 ? (
                    <EmptyState icon={<i className="bi bi-credit-card-2-front" />} title="No payments yet" description="Your transactions will show here." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {recentPayments.map((payment, i) => <PaymentItem key={i} {...payment} />)}
                    </div>
                  )}
                </Card>

                <Card padding={20} style={{
                  background: 'linear-gradient(135deg, var(--ck-pink) 0%, #ff4fae 100%)',
                  color: '#fff',
                  border: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-broadcast" style={{ fontSize: 18 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Go live with your events</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 2 }}>Stream events and earn revenue.</div>
                    </div>
                  </div>
                  <Link href="/user/event-coordinator/streams" className="ck-btn"
                    style={{ marginTop: 14, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', width: '100%' }}>
                    Manage streams <i className="bi bi-arrow-right" />
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

export default EventCoordinatorDashboard;
