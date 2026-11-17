'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { platformAlert } from '../PlatformAlert';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
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
    // Post My Event invites and their outcomes; these used to fall through to 'payment'.
    case 'OPPORTUNITY': case 'HYBRID_OPPORTUNITY': case 'HYBRID_UPDATE': return 'opportunity';
    default: return 'payment';
  }
}

// Notification types specific to photographers
export type NotificationType = 'payment' | 'tip' | 'bonus' | 'security' | 'album' | 'review' | 'event' | 'photobook' | 'opportunity';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  amount?: number;
  actionUrl?: string;
  referenceId?: string;
}

/**
 * Everything the photographer Notifications page does besides drawing it: fetching the newest 50, mapping backend types,
 * reading (single, all, on closing the review dialog or leaving the page), the three deletes, the destination of each
 * type and the type filter. Shared by the classic page and the Compact Glass page so the two cannot drift.
 * options.escapeHandledByView: the glass dialog closes itself on Escape, so the hook must not do it a second time.
 */
export function usePhotographerNotifications(options: { escapeHandledByView?: boolean } = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [loading, setLoading] = useState(true);
  // Modal: clicking a row opens it; closing the modal auto-marks as read.
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const notifRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications?page=0&size=50`);

      if (notifRes && notifRes.ok) {
        const data = await notifRes.json();
        if (data.action === 1 && data.data) {
          const items = data.data.content || data.data || [];
          // Newest-created first. Mapped shape drops raw timestamp, so sort here.
          items.sort((a: any, b: any) => {
            const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          });
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
            referenceId: n.referenceId || undefined,
          })));
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

  // Modal open/close. Closing always marks the notification as read.
  const openNotifModal = (n: Notification) => { setSelectedNotif(n); };
  const closeNotifModal = () => {
    if (selectedNotif) markAsRead(selectedNotif.id);
    setSelectedNotif(null);
  };

  // Mirror the selected notification into a ref so the unmount cleanup reads
  // the latest value (the mount-time effect closure would see null forever).
  const selectedRef = useRef<Notification | null>(null);
  useEffect(() => { selectedRef.current = selectedNotif; }, [selectedNotif]);

  // If the user navigates away while the modal is open, treat that as review
  // and mark read. Fire-and-forget. backend /read endpoint is idempotent.
  useEffect(() => {
    return () => {
      const n = selectedRef.current;
      if (!n) return;
      const apiUrl = getApiUrl();
      dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications/${n.id}/read`, { method: 'PATCH' })
        .catch(() => { /* swallow. user is leaving the page */ });
    };
  }, []);

  // Close modal on Escape key.
  useEffect(() => {
    if (!selectedNotif || options.escapeHandledByView) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNotifModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNotif, options.escapeHandledByView]);

  const getNotificationDest = (notification: Notification): string | null => {
    const refId = notification.referenceId;
    switch (notification.type) {
      case 'payment': case 'tip': case 'bonus':
        return '/user/photographer/all-transactions';
      case 'security':
        return '/user/photographer/profile';
      case 'album': case 'event':
        return refId ? `/user/photographer/events/${refId}` : '/user/photographer/events';
      case 'photobook':
        return refId ? `/user/photographer/events/${refId}` : '/user/photographer/events';
      case 'review':
        return '/user/photographer/clients';
      case 'opportunity':
        return refId ? `/user/photographer/opportunities?candidate=${refId}` : '/user/photographer/opportunities';
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
        platformAlert(data.message || 'Failed to delete notification. The server did not process the request.');
        fetchNotifications();
      }
    } catch (err) {
      console.error('DELETE notification error:', err);
      platformAlert('Failed to delete notification. The feature may not be available yet.');
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
        platformAlert(data.message || 'Failed to clear read notifications. The server did not process the request.');
        fetchNotifications();
      }
    } catch {
      platformAlert('Failed to clear read notifications. The feature may not be available yet.');
      fetchNotifications();
    }
  };

  // The Compact Glass page asks through its own dialog and calls this directly; the classic page keeps the browser prompt.
  const deleteAllNotificationsConfirmed = async () => {
    const backup = [...notifications];
    setNotifications([]);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/notifications/all`, { method: 'DELETE' });
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

  const filterOptions: { value: 'all' | NotificationType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'payment', label: 'Payments' },
    { value: 'tip', label: 'Tips' },
    { value: 'bonus', label: 'Bonuses' },
    { value: 'security', label: 'Security' },
    { value: 'event', label: 'Events' },
    { value: 'review', label: 'Reviews' }
  ];

  return {
    notifications, activeFilter, setActiveFilter, loading, selectedNotif, setSelectedNotif, fetchNotifications, unreadCount,
    markAsRead, openNotifModal, closeNotifModal, getNotificationDest, markAllAsRead, deleteNotification, deleteAllRead,
    deleteAllNotifications, deleteAllNotificationsConfirmed, filteredNotifications, filterOptions,
  };
}
