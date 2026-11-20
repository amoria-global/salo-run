'use client';

/**
 * The top bar's state and data, moved verbatim out of topbar.tsx so the Compact Glass top bar
 * (components/glass) runs the very same notifications, wallet, pending-payment, availability and
 * menu logic. Behaviour change here changes both bars.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../providers/AuthProvider';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { getApiUrl } from '@/lib/api';
import type { Payment } from './UnlockModal';
import { desktopAlertPermission, freshUnread, playAlert, showDesktopAlert, strongestAlert } from '@/app/lib/notificationAlerts';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  referenceId?: string;
}

export function formatTimeAgo(dateStr: string): string {
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

export type TopbarRole = 'client' | 'photographer' | 'admin' | 'event-coordinator';

export function useTopbarState(userRole: TopbarRole = 'client') {
  const { actualTheme, setTheme, colors } = useTheme();
  const { user, logout, refreshUserProfile } = useDashboardAuth();
  const router = useRouter();
  const role = userRole;
  const { currency, setCurrency, formatPrice, currencies } = useCurrency();
  const { language, setLanguage, languages } = useLanguage();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  // A workspace collaborator has no identity check of its own to complete: that belongs to the owner.
  const { isCollaborator, isShared } = useWorkspace();
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

  // Photographer self-mark availability calendar (topbar). A date the
  // photographer toggles here HARD-blocks it on their public booking
  // calendar (clients can't book it) regardless of capacity.
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [availMonth, setAvailMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [availLoading, setAvailLoading] = useState(false);
  const [availSavingDate, setAvailSavingDate] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  // Notification ids from the previous poll; null until the first one, so the
  // backlog on page load doesn't ring.
  const seenNotifIdsRef = useRef<Set<string> | null>(null);
  const [desktopAlerts, setDesktopAlerts] = useState<NotificationPermission | 'unsupported'>('unsupported');
  useEffect(() => { setDesktopAlerts(desktopAlertPermission()); }, []);
  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const availabilityRef = useRef<HTMLDivElement>(null);

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
          const mapped: NotificationItem[] = items.map((n: any) => ({
            id: n.id, type: n.type || 'system',
            title: n.title || '', message: n.message || '',
            time: n.createdAt ? formatTimeAgo(n.createdAt) : '',
            read: n.isRead ?? true,
            actionUrl: n.link || undefined,
            referenceId: n.referenceId || undefined,
          }));
          // Ring or chime for what arrived since the last poll, and show it
          // as a desktop notification if the tab is in the background.
          const fresh = freshUnread(seenNotifIdsRef.current, mapped);
          seenNotifIdsRef.current = new Set(mapped.map((n) => n.id));
          const kind = strongestAlert(fresh);
          if (kind) playAlert(kind);
          fresh.slice(0, 3).forEach((n) => showDesktopAlert(n, (url) => router.push(url)));
          setNotifications(mapped);
        }
      }
      if (countRes.status === 'fulfilled' && countRes.value.ok) {
        const data = await countRes.value.json();
        if (data.action === 1) setUnreadCount(data.data ?? 0);
      }
    } catch { /* silent */ }
  }, [user, userRole, router]);

  const fetchFinancials = useCallback(async () => {
    if (!user) return;
    // In another photographer's workspace the wallet is the owner's, and the server refuses it there.
    if (isShared) return;
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
  }, [user, userRole, isShared]);

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
        case 'media':
        case 'streaming': case 'photobook':
          dest = refId ? `/user/photographer/events/${refId}` : '/user/photographer/events'; break;
        // The reference of an album notification is the album's id, so it opens the album, not an event with that id.
        case 'album':
          dest = refId ? `/user/photographer/collaborate/albums/${refId}` : '/user/photographer/collaborate'; break;
        // "Your stream is still live. End it?": the events page opens the stream controls for that event.
        case 'stream_reminder': dest = refId ? `/user/photographer/events?event=${refId}&action=stream` : '/user/photographer/events'; break;
        case 'security': dest = '/user/photographer/profile'; break;
      }
    } else if (userRole === 'event-coordinator') {
      switch (t) {
        case 'booking': case 'event': case 'photobook':
          dest = refId ? `/user/event-coordinator/events/${refId}` : '/user/event-coordinator/events'; break;
        case 'payment': case 'streamfee': case 'streaming':
          dest = refId ? `/user/event-coordinator/payments/${refId}` : '/user/event-coordinator/payments'; break;
        case 'album': dest = refId ? `/user/event-coordinator/gallery/albums/${refId}` : '/user/event-coordinator/gallery'; break;
        case 'media': dest = '/user/event-coordinator/gallery'; break;
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
        case 'album': dest = refId ? `/user/client/gallery/albums/${refId}` : '/user/client/gallery'; break;
        case 'media': dest = '/user/client/gallery'; break;
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
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
      if (availabilityRef.current && !availabilityRef.current.contains(event.target as Node)) setIsAvailabilityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // ─── Photographer availability self-mark ───
  const fetchBlockedDates = useCallback(async () => {
    if (userRole !== 'photographer' || !user) return;
    setAvailLoading(true);
    try {
      const apiUrl = getApiUrl();
      const today = new Date();
      const from = today.toISOString().slice(0, 10);
      const toD = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
      const to = toD.toISOString().slice(0, 10);
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/blocked-dates?from=${from}&to=${to}`,
        { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.action === 1 && Array.isArray(json.data)) {
          setBlockedDates(new Set(json.data as string[]));
        }
      }
    } catch { /* non-fatal. calendar just shows nothing blocked */ }
    finally { setAvailLoading(false); }
  }, [userRole, user]);

  useEffect(() => {
    if (isAvailabilityOpen) fetchBlockedDates();
  }, [isAvailabilityOpen, fetchBlockedDates]);

  const toggleBlockedDate = async (dateStr: string) => {
    if (availSavingDate) return; // one in-flight write at a time
    const apiUrl = getApiUrl();
    const wasBlocked = blockedDates.has(dateStr);
    setAvailSavingDate(dateStr);
    // Optimistic flip so the calendar feels instant.
    setBlockedDates(prev => {
      const n = new Set(prev);
      if (wasBlocked) n.delete(dateStr); else n.add(dateStr);
      return n;
    });
    try {
      const res = wasBlocked
        ? await dashboardAuthFetch(
            `${apiUrl}/api/remote/photographer/blocked-dates?date=${dateStr}`,
            { method: 'DELETE' })
        : await dashboardAuthFetch(
            `${apiUrl}/api/remote/photographer/blocked-dates`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: dateStr }) });
      const json = res.ok ? await res.json() : null;
      if (!res.ok || !json || json.action !== 1) throw new Error();
    } catch {
      // Revert the optimistic flip on any failure.
      setBlockedDates(prev => {
        const n = new Set(prev);
        if (wasBlocked) n.add(dateStr); else n.delete(dateStr);
        return n;
      });
    } finally {
      setAvailSavingDate(null);
    }
  };

  useEffect(() => {
    if (!isNotificationsOpen && expandedNotifId) {
      markAsRead(expandedNotifId);
      setExpandedNotifId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationsOpen]);

  /** The Pay now button of the pending-payment banner: opens the payment in place, else its page. */
  const openPendingPayment = async () => {
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
              date: p.createdAt, eventName: p.eventTitle || pendingPaymentWarning?.firstEvent || "",
              eventType: p.paymentType || '', photographerName: p.photographerName || '',
              photographerImage: p.photographerImage || '', method: '',
              amount: formatPrice(p.amount || 0, p.currencyAbbreviation || undefined),
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
  };

  return {
    openPendingPayment,
    actualTheme,
    setTheme,
    colors,
    user,
    logout,
    refreshUserProfile,
    router,
    role,
    currency,
    setCurrency,
    formatPrice,
    currencies,
    language,
    setLanguage,
    languages,
    isDropdownOpen,
    setIsDropdownOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    expandedNotifId,
    setExpandedNotifId,
    isCurrencyOpen,
    setIsCurrencyOpen,
    isLangOpen,
    setIsLangOpen,
    showLogoutModal,
    setShowLogoutModal,
    showKycModal,
    setShowKycModal,
    isCollaborator,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    giftAmount,
    setGiftAmount,
    selfLiveStreamFee,
    setSelfLiveStreamFee,
    selfBalanceAmount,
    setSelfBalanceAmount,
    selfTipsAmount,
    setSelfTipsAmount,
    selfBonusAmount,
    setSelfBonusAmount,
    walletBalance,
    setWalletBalance,
    walletStatus,
    setWalletStatus,
    pendingPaymentWarning,
    setPendingPaymentWarning,
    showPayNowModal,
    setShowPayNowModal,
    topbarPayment,
    setTopbarPayment,
    isAvailabilityOpen,
    setIsAvailabilityOpen,
    availMonth,
    setAvailMonth,
    blockedDates,
    setBlockedDates,
    availLoading,
    setAvailLoading,
    availSavingDate,
    setAvailSavingDate,
    dropdownRef,
    notificationsRef,
    seenNotifIdsRef,
    desktopAlerts,
    setDesktopAlerts,
    currencyRef,
    langRef,
    availabilityRef,
    getUserDisplayName,
    fetchNotifications,
    fetchFinancials,
    markAsRead,
    markAllAsRead,
    handleToggleExpand,
    handleNotificationClick,
    getNotificationIcon,
    fetchBlockedDates,
    toggleBlockedDate,
  };
}
