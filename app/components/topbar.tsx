"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";
import { useCurrency } from "../context/CurrencyContext";
import { getApiUrl } from '@/lib/api';
import PayNowModal from './UnlockModal';
import type { Payment } from './UnlockModal';
import Modal from './ui/Modal';
import Button from './ui/Button';
import KycVerificationModal from './KycVerificationModal';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  referenceId?: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  return `${Math.floor(diffDays / 30)}mo`;
}

interface TopbarProps {
  userRole?: 'client' | 'photographer' | 'admin' | 'event-coordinator';
}

const roleLabel = (r: string) => r === 'photographer' ? 'Photographer'
  : r === 'admin' ? 'Admin'
  : r === 'event-coordinator' ? 'Event Coordinator'
  : 'Client';

export default function Topbar({ userRole = 'client' }: TopbarProps) {
  const { actualTheme, setTheme, colors } = useTheme();
  const { user, logout, refreshUserProfile } = useDashboardAuth();
  const router = useRouter();
  const { currency, setCurrency, formatPrice, currencies } = useCurrency();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [giftAmount, setGiftAmount] = useState(0);
  const [selfLiveStreamFee, setSelfLiveStreamFee] = useState(0);
  const [selfBalanceAmount, setSelfBalanceAmount] = useState(0);
  const [selfTipsAmount, setSelfTipsAmount] = useState(0);
  const [selfBonusAmount, setSelfBonusAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletStatus, setWalletStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'CLOSED' | null>(null);
  const [pendingPaymentWarning, setPendingPaymentWarning] = useState<{count: number; totalAmount: number; firstEvent: string; firstEventId?: string; firstPaymentId?: string} | null>(null);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [topbarPayment, setTopbarPayment] = useState<Payment | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const apiUrl = getApiUrl();
    const notifBase = userRole === 'event-coordinator' ? 'coordinator' : userRole === 'photographer' ? 'photographer' : 'customer';
    try {
      const [notifRes, countRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifBase}/notifications?page=0&size=20`, { method: 'GET' }),
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifBase}/notifications/unread-count`, { method: 'GET' }),
      ]);
      if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
        const data = await notifRes.value.json();
        if (data.action === 1 && (Array.isArray(data.data) || data.data?.content)) {
          const items = Array.isArray(data.data) ? data.data : data.data?.content || [];
          setNotifications(items.map((n: any) => ({
            id: n.id, type: n.type || 'system',
            title: n.title || '', message: n.message || '',
            time: n.createdAt ? formatTimeAgo(n.createdAt) : '',
            read: n.isRead ?? true,
            actionUrl: n.link || undefined,
            referenceId: n.referenceId || undefined,
          })));
        }
      }
      if (countRes.status === 'fulfilled' && countRes.value.ok) {
        const data = await countRes.value.json();
        if (data.action === 1) setUnreadCount(data.data ?? 0);
      }
    } catch { /* silent */ }
  }, [user, userRole]);

  const fetchFinancials = useCallback(async () => {
    if (!user) return;
    const apiUrl = getApiUrl();
    try {
      if (userRole !== 'admin') {
        try {
          const walletRes = await dashboardAuthFetch(`${apiUrl}/api/remote/wallet/me`, { method: 'GET' });
          if (walletRes.ok) {
            const walletJson = await walletRes.json();
            if (walletJson.action === 1 && walletJson.data) {
              const w = walletJson.data;
              setWalletBalance(w.balanceAvailable ?? 0);
              setWalletStatus(w.status ?? null);
              if (userRole === 'photographer') {
                setSelfBalanceAmount(w.balanceAvailable ?? 0);
                setSelfTipsAmount(w.balanceTips ?? 0);
                setSelfBonusAmount(w.balanceBonuses ?? 0);
              } else if (userRole === 'event-coordinator') {
                setSelfLiveStreamFee(w.balanceStreamFees ?? 0);
              } else if (userRole === 'client') {
                setGiftAmount(w.balanceGifts ?? 0);
              }
            }
          }
        } catch { /* silent */ }
      }
      if (userRole === 'client' || userRole === 'event-coordinator') {
        const pendingBase = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
        const pendingRes = await dashboardAuthFetch(`${apiUrl}/api/remote/${pendingBase}/payments/pending`, { method: 'GET' });
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          if (pendingData.action === 1 && Array.isArray(pendingData.data) && pendingData.data.length > 0) {
            const payments = pendingData.data;
            const total = payments.reduce((sum: number, p: any) => sum + ((p.amountInUsd ?? p.amount ?? 0) - (p.paidAmountInUsd ?? p.paidAmount ?? 0)), 0);
            setPendingPaymentWarning({
              count: payments.length, totalAmount: total,
              firstEvent: payments[0]?.eventTitle ?? 'Unknown Event',
              firstEventId: payments[0]?.eventId ?? undefined,
              firstPaymentId: payments[0]?.id ?? undefined,
            });
          } else setPendingPaymentWarning(null);
        }
      }
    } catch { /* silent */ }
  }, [user, userRole]);

  useEffect(() => {
    fetchNotifications();
    fetchFinancials();
    const interval = setInterval(fetchNotifications, 30000);
    const onBadgeUpdate = () => { fetchNotifications(); };
    window.addEventListener('badge-update', onBadgeUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('badge-update', onBadgeUpdate);
    };
  }, [fetchNotifications, fetchFinancials]);

  const markAsRead = async (id: string) => {
    const wasUnread = notifications.find(n => n.id === id && !n.read);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('badge-update'));
    }
    const apiUrl = getApiUrl();
    const base = userRole === 'event-coordinator' ? 'coordinator' : userRole === 'photographer' ? 'photographer' : 'customer';
    try { await dashboardAuthFetch(`${apiUrl}/api/remote/${base}/notifications/${id}/read`, { method: 'PATCH' }); } catch { /* silent */ }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    window.dispatchEvent(new Event('badge-update'));
    const apiUrl = getApiUrl();
    const base = userRole === 'event-coordinator' ? 'coordinator' : userRole === 'photographer' ? 'photographer' : 'customer';
    try { await dashboardAuthFetch(`${apiUrl}/api/remote/${base}/notifications/read-all`, { method: 'PATCH' }); } catch { /* silent */ }
  };

  const handleToggleExpand = (notificationId: string) => {
    setExpandedNotifId(prev => {
      if (prev === notificationId) { markAsRead(prev); return null; }
      if (prev) markAsRead(prev);
      return notificationId;
    });
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    setIsNotificationsOpen(false);
    const t = notification.type?.toLowerCase();
    const refId = notification.referenceId;
    let dest: string | null = null;
    if (userRole === 'photographer') {
      switch (t) {
        case 'payment': case 'tip': case 'bonus': case 'withdrawal': dest = '/user/photographer/transaction'; break;
        case 'booking': case 'event':
        case 'album': case 'media':
        case 'streaming': case 'photobook':
          dest = refId ? `/user/photographer/events/${refId}` : '/user/photographer/events'; break;
        case 'security': dest = '/user/photographer/profile'; break;
      }
    } else if (userRole === 'event-coordinator') {
      switch (t) {
        case 'booking': case 'event': case 'photobook':
          dest = refId ? `/user/event-coordinator/events/${refId}` : '/user/event-coordinator/events'; break;
        case 'payment': case 'streamfee': case 'streaming':
          dest = refId ? `/user/event-coordinator/payments/${refId}` : '/user/event-coordinator/payments'; break;
        case 'album': case 'media': dest = '/user/event-coordinator/gallery'; break;
        case 'photographer': dest = '/user/event-coordinator/home'; break;
        case 'security': dest = '/user/event-coordinator/profile'; break;
      }
    } else {
      switch (t) {
        case 'booking': case 'event': case 'photobook':
          dest = refId ? `/user/client/events/${refId}` : '/user/client/events'; break;
        case 'payment':
          dest = refId ? `/user/client/payments/${refId}` : '/user/client/payments'; break;
        case 'gift': dest = '/user/client/payments'; break;
        case 'album': case 'media': dest = '/user/client/gallery'; break;
        case 'photographer': dest = '/user/client/photographers'; break;
        case 'security': dest = '/user/client/profile'; break;
        case 'streaming': dest = '/user/client/streams'; break;
      }
    }
    const rolePath = userRole === 'photographer' ? 'photographer'
      : userRole === 'event-coordinator' ? 'event-coordinator' : 'client';
    dest = dest || notification.actionUrl || `/user/${rolePath}/notifications`;
    router.push(dest);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return { bg: '#ECFDF5', color: '#10B981', icon: 'bi-cash-coin' };
      case 'booking': return { bg: '#EFF6FF', color: '#083A85', icon: 'bi-calendar-event' };
      case 'gift':    return { bg: 'rgba(242,12,143,0.10)', color: '#F20C8F', icon: 'bi-gift' };
      case 'system':  return { bg: '#F5F5F7', color: '#595959', icon: 'bi-gear' };
      case 'security':return { bg: '#FFFBEB', color: '#F59E0B', icon: 'bi-shield-lock' };
      case 'streaming':return { bg: '#FEF2F2', color: '#DC2626', icon: 'bi-broadcast' };
      default:        return { bg: '#F5F5F7', color: '#595959', icon: 'bi-bell' };
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) setIsCurrencyOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen && expandedNotifId) {
      markAsRead(expandedNotifId);
      setExpandedNotifId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationsOpen]);

  return (
    <>
      <header className="ck-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <h1 style={{
            margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ck-text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} className="topbar-title">
            {roleLabel(userRole)} Dashboard
          </h1>
        </div>

        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {(userRole === 'client' || userRole === 'event-coordinator') && walletBalance !== null && (
            <Link href={`/user/${userRole}/wallet`} className="topbar-wallet" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 9999,
              background: 'var(--ck-surface-muted)', border: '1px solid var(--ck-stroke)',
              textDecoration: 'none', color: 'var(--ck-text)',
              fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              <i className="bi bi-wallet2" style={{ color: 'var(--ck-blue)', fontSize: 14 }} />
              <span>${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {walletStatus === 'SUSPENDED' && (
                <span className="ck-pill ck-status-error" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>SUSPENDED</span>
              )}
            </Link>
          )}

          {userRole === 'photographer' && (
            <>
              <div className="topbar-balance" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9999,
                background: 'var(--ck-surface-muted)', border: '1px solid var(--ck-stroke)',
                fontSize: '0.85rem', fontWeight: 600,
              }}>
                <i className="bi bi-bank" style={{ color: 'var(--ck-blue)', fontSize: 14 }} />
                <span style={{ color: 'var(--ck-text-soft)' }}>Balance</span>
                <span style={{ color: 'var(--ck-text)', fontWeight: 700 }}>{formatPrice(selfBalanceAmount)}</span>
              </div>
              <div className="topbar-tips" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9999,
                background: 'rgba(242,12,143,0.08)', border: '1px solid rgba(242,12,143,0.18)',
                fontSize: '0.85rem', fontWeight: 600,
              }}>
                <i className="bi bi-coin" style={{ color: '#F20C8F', fontSize: 14 }} />
                <span style={{ color: '#F20C8F', fontWeight: 700 }}>{formatPrice(selfTipsAmount)}</span>
              </div>
            </>
          )}

          <button
            onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="topbar-theme-btn"
            style={{
              border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)',
              borderRadius: 9999, width: 36, height: 36,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ck-text-soft)',
            }}
            title={actualTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <i className={`bi ${actualTheme === 'dark' ? 'bi-sun' : 'bi-moon'}`} style={{ fontSize: 15 }} />
          </button>

          <div ref={currencyRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 9999,
                border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)',
                color: 'var(--ck-text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <img src={`https://flagcdn.com/w40/${currencies.find(c => c.code === currency)?.flag}.png`} alt=""
                style={{ width: 18, height: 14, objectFit: 'cover', borderRadius: 2 }} />
              {currency}
              <i className="bi bi-chevron-down" style={{ fontSize: 10, transform: isCurrencyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }} />
            </button>
            {isCurrencyOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 14, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', padding: 6, minWidth: 220, zIndex: 50,
              }}>
                {currencies.map((c) => (
                  <button key={c.code} onClick={() => { setCurrency(c.code); setIsCurrencyOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: currency === c.code ? 'var(--ck-surface-muted)' : 'transparent',
                      color: 'var(--ck-text)', fontSize: '0.85rem',
                      fontWeight: currency === c.code ? 600 : 500, cursor: 'pointer', gap: 8,
                    }}
                    onMouseEnter={(e) => { if (currency !== c.code) e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                    onMouseLeave={(e) => { if (currency !== c.code) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={`https://flagcdn.com/w40/${c.flag}.png`} alt="" style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2 }} />
                      <span style={{ fontWeight: 700 }}>{c.code}</span>
                      <span style={{ color: 'var(--ck-text-soft)' }}>{c.name}</span>
                    </span>
                    {currency === c.code && <i className="bi bi-check-lg" style={{ color: 'var(--ck-blue)' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={notificationsRef} style={{ position: 'relative' }}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{
                position: 'relative', width: 36, height: 36, borderRadius: 9999,
                background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
                cursor: 'pointer', color: 'var(--ck-text-soft)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }} aria-label="Notifications">
              <i className="bi bi-bell" style={{ fontSize: 15 }} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#F20C8F', color: 'white',
                  fontSize: 10, fontWeight: 700, borderRadius: 9999,
                  minWidth: 18, height: 18, padding: '0 4px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--ck-surface)',
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 16, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', width: 380, maxWidth: 'calc(100vw - 24px)',
                zIndex: 50, overflow: 'hidden',
              }} className="ck-fade-in-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--ck-stroke)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="ck-pill" style={{ background: 'rgba(242,12,143,0.10)', color: '#F20C8F', padding: '2px 8px' }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{
                      background: 'none', border: 'none', color: 'var(--ck-blue)',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    }}>Mark all read</button>
                  )}
                </div>

                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ck-text-soft)' }}>
                      <i className="bi bi-bell-slash" style={{ fontSize: 26, color: 'var(--ck-text-muted)', display: 'block', marginBottom: 8 }} />
                      <div style={{ fontSize: '0.88rem' }}>You're all caught up</div>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const ico = getNotificationIcon(notification.type);
                      const isExpanded = expandedNotifId === notification.id;
                      return (
                        <div key={notification.id} onClick={() => handleToggleExpand(notification.id)}
                          style={{
                            display: 'flex', gap: 12, padding: '12px 18px',
                            borderBottom: '1px solid var(--ck-stroke-soft)',
                            background: notification.read ? 'transparent' : 'rgba(8,58,133,0.03)',
                            cursor: 'pointer', transition: 'background 180ms',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(8,58,133,0.03)'; }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9999, background: ico.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <i className={`bi ${ico.icon}`} style={{ color: ico.color, fontSize: 14 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: notification.read ? 500 : 700, color: 'var(--ck-text)' }}>{notification.title}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--ck-text-muted)', flexShrink: 0 }}>{notification.time}</span>
                            </div>
                            <p style={{
                              margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--ck-text-soft)',
                              overflow: isExpanded ? 'visible' : 'hidden',
                              textOverflow: isExpanded ? 'clip' : 'ellipsis',
                              whiteSpace: isExpanded ? 'normal' : 'nowrap',
                              wordBreak: isExpanded ? 'break-word' : 'normal', lineHeight: 1.4,
                            }}>{notification.message}</p>
                            {isExpanded && (
                              <button onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                                style={{
                                  marginTop: 8, padding: '5px 10px', borderRadius: 8,
                                  border: '1px solid var(--ck-blue)', background: 'transparent',
                                  color: 'var(--ck-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                }}>Open <i className="bi bi-arrow-right" /></button>
                            )}
                          </div>
                          {!notification.read && (
                            <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#F20C8F', alignSelf: 'center', flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ padding: 12, borderTop: '1px solid var(--ck-stroke)', textAlign: 'center', background: 'var(--ck-surface-soft)' }}>
                  <Link href={`/user/${userRole === 'admin' ? 'client' : userRole}/notifications`}
                    style={{ color: 'var(--ck-blue)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                    onClick={() => setIsNotificationsOpen(false)}>View all notifications →</Link>
                </div>
              </div>
            )}
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: 4, paddingRight: 10, borderRadius: 9999,
                background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)', cursor: 'pointer',
              }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" style={{ width: 30, height: 30, borderRadius: 9999, objectFit: 'cover' }} />
              ) : (
                <span className="ck-avatar" style={{ width: 30, height: 30, fontSize: '0.78rem' }}>
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
              <span className="topbar-profile-info" style={{
                fontSize: '0.85rem', fontWeight: 600, color: 'var(--ck-text)',
                whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{getUserDisplayName().split(' ')[0]}</span>
              <i className="bi bi-chevron-down" style={{
                fontSize: 10, color: 'var(--ck-text-soft)',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms',
              }} />
            </button>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'var(--ck-surface)', borderRadius: 16, boxShadow: 'var(--ck-shadow-lg)',
                border: '1px solid var(--ck-stroke)', minWidth: 250, overflow: 'hidden', zIndex: 50,
              }} className="ck-fade-in-up">
                <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--ck-stroke)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ck-text)' }}>{getUserDisplayName()}</div>
                  {user?.email && <div style={{ fontSize: '0.8rem', color: 'var(--ck-text-soft)', marginTop: 2 }}>{user.email}</div>}
                  <div style={{ marginTop: 8 }}>
                    <span className="ck-pill" style={{ background: 'rgba(8,58,133,0.08)', color: 'var(--ck-blue)' }}>
                      <i className="bi bi-person-badge" /> {roleLabel(userRole)}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 6 }}>
                  <Link href={`/user/${userRole}/profile`} onClick={() => setIsDropdownOpen(false)}
                    className="ck-row" style={{ textDecoration: 'none', color: 'var(--ck-text)' }}>
                    <i className="bi bi-person" style={{ fontSize: 16, marginRight: 10, color: 'var(--ck-text-soft)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Profile</span>
                  </Link>
                  {userRole !== 'admin' && (
                    <Link href={`/user/${userRole}/wallet`} onClick={() => setIsDropdownOpen(false)}
                      className="ck-row" style={{ textDecoration: 'none', color: 'var(--ck-text)' }}>
                      <i className="bi bi-wallet2" style={{ fontSize: 16, marginRight: 10, color: 'var(--ck-text-soft)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Wallet</span>
                    </Link>
                  )}
                  {userRole !== 'admin' && (
                    <Link href={`/user/${userRole}/preferences`} onClick={() => setIsDropdownOpen(false)}
                      className="ck-row" style={{ textDecoration: 'none', color: 'var(--ck-text)' }}>
                      <i className="bi bi-sliders" style={{ fontSize: 16, marginRight: 10, color: 'var(--ck-text-soft)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Preferences</span>
                    </Link>
                  )}
                </div>
                <div style={{ height: 1, background: 'var(--ck-stroke)' }} />
                <button onClick={() => { setIsDropdownOpen(false); setShowLogoutModal(true); }}
                  className="ck-row"
                  style={{
                    width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                    color: '#DC2626', margin: 6, padding: '12px 14px',
                  }}>
                  <i className="bi bi-box-arrow-right" style={{ fontSize: 16, marginRight: 10 }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {pendingPaymentWarning && (userRole === 'client' || userRole === 'event-coordinator') && (
        <div style={{
          margin: '10px 24px 0', padding: '14px 18px',
          background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
          borderLeft: '3px solid #F59E0B', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--ck-shadow-sm)',
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.10)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#F59E0B', fontSize: 16 }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ck-text)', letterSpacing: '-0.005em' }}>
              Payment required · {formatPrice(pendingPaymentWarning.totalAmount)}
            </div>
            <div style={{
              fontSize: '0.78rem', color: 'var(--ck-text-soft)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {pendingPaymentWarning.firstEvent}
              {pendingPaymentWarning.count > 1 ? ` and ${pendingPaymentWarning.count - 1} other${pendingPaymentWarning.count - 1 > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <button onClick={async () => {
            const paymentId = pendingPaymentWarning?.firstPaymentId;
            if (!paymentId) {
              const base = userRole === 'event-coordinator' ? '/user/event-coordinator' : '/user/client';
              router.push(`${base}/payments`); return;
            }
            try {
              const apiUrl = getApiUrl();
              const pendingBase = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
              const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${pendingBase}/payments/${paymentId}`, { method: 'GET' });
              if (res.ok) {
                const data = await res.json();
                if (data.action === 1 && data.data) {
                  const p = data.data;
                  setTopbarPayment({
                    id: typeof p.id === 'string' ? parseInt(p.id, 10) || 0 : p.id,
                    declarationId: String(p.id), eventId: p.eventId,
                    date: p.createdAt, eventName: p.eventTitle || pendingPaymentWarning.firstEvent,
                    eventType: p.paymentType || '', photographerName: p.photographerName || '',
                    photographerImage: p.photographerImage || '', method: '',
                    amount: `${p.currencyAbbreviation || ''} ${p.amount || 0}`,
                    amountNum: p.amount || 0, paidAmount: p.paidAmount || 0,
                    status: (p.status?.toLowerCase() || 'pending') as any,
                    invoiceNumber: `INV-${String(p.id).substring(0, 8).toUpperCase()}`,
                  });
                  setShowPayNowModal(true); return;
                }
              }
            } catch { /* fallback */ }
            const base = userRole === 'event-coordinator' ? '/user/event-coordinator' : '/user/client';
            router.push(`${base}/payments/${paymentId}`);
          }}
          style={{
            flexShrink: 0, padding: '8px 16px',
            fontSize: '0.82rem', fontWeight: 600, borderRadius: 9, border: 'none',
            background: '#F59E0B', color: '#fff', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'all 180ms', boxShadow: '0 4px 10px rgba(245,158,11,0.25)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#D97706'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F59E0B'; }}>
            Pay now <i className="bi bi-arrow-right" style={{ fontSize: 12 }} />
          </button>
        </div>
      )}

      {user && user.kycStatus !== 'APPROVED' && userRole !== 'admin' && user.customerType !== 'Viewer' && !pendingPaymentWarning && (() => {
        const isPending = user.kycStatus === 'PENDING';
        const isRejected = user.kycStatus === 'REJECTED';
        const cfg = isRejected
          ? { accent: '#DC2626', tint: 'rgba(220,38,38,0.10)', icon: 'bi-shield-exclamation', title: 'KYC verification rejected', detail: 'Your submission needs corrections. Resubmit to continue.' }
          : isPending
          ? { accent: '#3B82F6', tint: 'rgba(59,130,246,0.10)', icon: 'bi-shield-check', title: 'KYC under review', detail: 'We’re verifying your details. This typically takes a few hours.' }
          : { accent: '#083A85', tint: 'rgba(8,58,133,0.10)', icon: 'bi-shield-lock', title: 'Verify your identity', detail: 'Complete KYC to unlock withdrawals and full platform features.' };
        return (
          <div style={{
            margin: '10px 24px 0', padding: '14px 18px',
            background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
            borderLeft: `3px solid ${cfg.accent}`, borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: 'var(--ck-shadow-sm)',
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10, background: cfg.tint,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className={`bi ${cfg.icon}`} style={{ color: cfg.accent, fontSize: 16 }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ck-text)', letterSpacing: '-0.005em' }}>{cfg.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ck-text-soft)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.detail}</div>
            </div>
            {!isPending && (
              <button onClick={() => setShowKycModal(true)}
                style={{
                  flexShrink: 0, padding: '8px 16px',
                  fontSize: '0.82rem', fontWeight: 600, borderRadius: 9, border: 'none',
                  background: cfg.accent, color: '#fff', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 180ms',
                  boxShadow: `0 4px 10px ${isRejected ? 'rgba(220,38,38,0.25)' : 'rgba(8,58,133,0.25)'}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                {isRejected ? 'Resubmit' : 'Complete KYC'} <i className="bi bi-arrow-right" style={{ fontSize: 12 }} />
              </button>
            )}
          </div>
        );
      })()}

      <PayNowModal isOpen={showPayNowModal}
        onClose={() => { setShowPayNowModal(false); setTopbarPayment(null); }}
        payment={topbarPayment}
        onPaymentSuccess={() => { setShowPayNowModal(false); setTopbarPayment(null); fetchFinancials(); }} />

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
        size="sm" title="Sign out of Connekyt?"
        description="You'll need to sign in again to access your dashboard."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setShowLogoutModal(false); logout(); }}>Sign out</Button>
          </>
        }>
        <div style={{
          width: 56, height: 56, borderRadius: 9999, background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 8px',
        }}>
          <i className="bi bi-box-arrow-right" style={{ color: '#DC2626', fontSize: 22 }} />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--ck-text-soft)', margin: 0 }}>
          Your session will end on this device.
        </p>
      </Modal>

      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={() => { setShowKycModal(false); refreshUserProfile(); }}
        colors={colors as unknown as Record<string, string>}
        actualTheme={actualTheme}
      />

      <style jsx>{`
        @media (max-width: 768px) {
          .topbar-title { display: none; }
          .topbar-wallet, .topbar-balance, .topbar-tips { display: none !important; }
          .topbar-profile-info { display: none; }
        }
        @media (max-width: 1024px) {
          .topbar-balance, .topbar-tips { display: none !important; }
        }
      `}</style>
    </>
  );
}
