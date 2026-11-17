'use client';

import { useEffect, useRef, useState } from 'react';
import { platformAlert } from '../PlatformAlert';
import { dashboardAuthFetch, useDashboardAuth } from '../../providers/AuthProvider';
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
    case 'PHOTOBOOK': case 'PHOTOBOOK_RECEIVED': return 'photobook';
    default: return 'booking';
  }
}

// Notification types specific to clients and event coordinators
export type NotificationType = 'album' | 'gift' | 'security' | 'booking' | 'photographer' | 'streamfee' | 'photobook';

export interface Notification {
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
  referenceId?: string;
}


/**
 * Everything the client and coordinator Notifications page does besides drawing it (the coordinator uses the same page with
 * userRole set): fetch the newest 50 for the role, map types, read one or all (also on closing the review dialog and on
 * leaving), the three deletes with their rollbacks, each type destination and the type filter. Shared by the classic page
 * and the Compact Glass page so the two cannot drift. options.escapeHandledByView: the glass dialog closes itself on Escape.
 */
export function useClientNotifications(userRole: 'client' | 'event-coordinator' = 'client', options: { escapeHandledByView?: boolean } = {}) {
  const { token, user } = useDashboardAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [loading, setLoading] = useState(true);
  // Modal: clicking a row opens it; closing the modal auto-marks as read.
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    // Cookie-only sessions have no JS-readable token, so gate purely on
    // the user object. dashboardAuthFetch sends the HttpOnly cookie
    // alongside any Bearer it can find.
    if (!user?.id) return;
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications?page=0&size=50`
        : `${apiUrl}/api/remote/customer/notifications?page=0&size=50`;
      const response = await dashboardAuthFetch(endpoint, { headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) {
        console.error(`[notifications] ${endpoint} -> HTTP ${response.status}`);
        throw new Error('Failed to fetch notifications');
      }
      const result = await response.json();

      // Backend wraps responses as { action: 1, data: ... }. The data can be:
      //   - a paginated object { content: [...], totalElements, ... }  (Spring page)
      //   - a raw array [...]
      // Mirror the topbar + photographer parser, which handles both shapes.
      const rawData = result?.data;
      const items = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.content) ? rawData.content : []);

      if (result?.action !== 1 || items.length === 0) {
        // Only loud-log when we expected items but got none. useful when
        // the unread-count endpoint reports >0 but the list endpoint comes
        // back empty (backend pagination/role-routing mismatch).
        console.warn('[notifications] unexpected response shape', {
          endpoint,
          action: result?.action,
          dataType: Array.isArray(rawData) ? 'array' : typeof rawData,
          itemsLen: items.length,
          raw: result,
        });
      }

      // Newest-created first. Mapped shape drops raw timestamp, so sort here.
      items.sort((a: any, b: any) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      const mapped: Notification[] = items.map((n: { id: string; title: string; message: string; type: string; isRead?: boolean; read?: boolean; link?: string; createdAt: string; referenceId?: string }) => ({
        id: n.id,
        type: mapBackendType(n.type, userRole),
        title: n.title,
        message: n.message,
        timestamp: formatRelativeTime(n.createdAt),
        read: n.isRead ?? n.read ?? false,
        actionUrl: n.link || undefined,
        referenceId: n.referenceId || undefined,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  // Modal open/close. Closing always marks the notification as read.
  const openNotifModal = (n: Notification) => { setSelectedNotif(n); };
  const closeNotifModal = () => {
    if (selectedNotif) markAsRead(selectedNotif.id);
    setSelectedNotif(null);
  };

  const selectedRef = useRef<Notification | null>(null);
  useEffect(() => { selectedRef.current = selectedNotif; }, [selectedNotif]);

  useEffect(() => {
    return () => {
      const n = selectedRef.current;
      if (!n) return;
      const apiUrl = getApiUrl();
      const readEndpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/notifications/${n.id}/read`
        : `${apiUrl}/api/remote/customer/notifications/${n.id}/read`;
      dashboardAuthFetch(readEndpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } })
        .catch(() => { /* swallow. user is leaving the page */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedNotif || options.escapeHandledByView) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNotifModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNotif, options.escapeHandledByView]);

  const getNotificationDest = (notification: Notification): string | null => {
    const base = userRole === 'event-coordinator' ? '/user/event-coordinator' : '/user/client';
    const refId = notification.referenceId;
    // Post My Event updates link to the event's candidates; open them there.
    const cand = (notification as any).actionUrl?.match?.(/^\/events\/([^/]+)\/candidates/);
    if (cand) return `${base}/events/${cand[1]}?candidates=1`;
    switch (notification.type) {
      case 'booking': case 'photobook':
        return refId ? `${base}/events/${refId}` : `${base}/events`;
      case 'gift':
        return refId ? `/user/client/payments/${refId}` : '/user/client/payments';
      case 'streamfee':
        return refId ? `/user/event-coordinator/payments/${refId}` : '/user/event-coordinator/payments';
      case 'photographer':
        return userRole === 'event-coordinator' ? '/user/event-coordinator/home' : '/user/client/photographers';
      case 'album':
        return userRole === 'event-coordinator' ? '/user/event-coordinator/gallery' : '/user/client/gallery';
      case 'security':
        return `${base}/profile`;
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
        platformAlert(data.message || 'Failed to delete notification.');
        if (backup) setNotifications(prev => [...prev, backup]);
      }
    } catch {
      platformAlert('Failed to delete notification.');
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
        platformAlert(data.message || 'Failed to clear read notifications.');
        setNotifications(prev => [...prev, ...backup]);
      }
    } catch {
      platformAlert('Failed to clear read notifications.');
      setNotifications(prev => [...prev, ...backup]);
    }
  };

  // The Compact Glass page asks through its own dialog and calls this directly; the classic page keeps the browser prompt.
  const deleteAllNotificationsConfirmed = async () => {
    const backup = [...notifications];
    setNotifications([]);
    try {
      const apiUrl = getApiUrl();
      const base = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${base}/notifications/all`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        platformAlert(data.message || 'Failed to delete all notifications.');
        setNotifications(backup);
      }
    } catch {
      platformAlert('Failed to delete all notifications.');
      setNotifications(backup);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    await deleteAllNotificationsConfirmed();
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

  return {
    notifications, activeFilter, setActiveFilter, loading, selectedNotif, setSelectedNotif, unreadCount, markAsRead, openNotifModal,
    closeNotifModal, getNotificationDest, markAllAsRead, deleteNotification, deleteAllRead, deleteAllNotifications,
    deleteAllNotificationsConfirmed, filteredNotifications, filterOptions,
  };
}
