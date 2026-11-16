'use client';

/**
 * Sidebar badge counts (notifications, unread messages, open opportunities), moved verbatim out of sidebar.tsx so the
 * Compact Glass sidebar and tab bar count exactly as the old sidebar does. Polls every 30 s and listens for the
 * `badge-update` and `inbox:totalCount` events the pages already send.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDashboardAuth, dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export type NavRole = 'photographer' | 'client' | 'event-coordinator' | 'admin';

export function useNavBadges(currentRole: NavRole) {
  const pathname = usePathname();
  const { user } = useDashboardAuth();
  const currentUserId = user?.id || '';

  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [opportunityCount, setOpportunityCount] = useState(0);
  const lastInboxEventTimeRef = useRef<number>(0);

  const fetchBadgeCounts = useCallback(async () => {
    if (!user) return;
    const fetchStartTime = Date.now();
    const apiUrl = getApiUrl();
    const notifPrefix = currentRole === 'photographer' ? 'photographer' : currentRole === 'event-coordinator' ? 'coordinator' : 'customer';
    const isOnInboxPage = pathname?.includes('/inbox');
    try {
      const [notifRes, convRes] = await Promise.all([
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifPrefix}/notifications/unread-count`, { method: 'GET' }),
        dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`, { method: 'GET' }),
      ]);
      if (currentRole === 'photographer') {
        // Open Post My Event invites; each has a short response window, so they get their own badge.
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/opportunities/count`, { method: 'GET' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d?.action === 1) setOpportunityCount(Number(d.data?.pending) || 0); })
          .catch(() => {});
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.action === 1) setNotificationCount(data.data ?? 0);
      }
      if (convRes.ok && !isOnInboxPage) {
        const data = await convRes.json();
        const list = data.data || data || [];
        if (Array.isArray(list)) {
          const validList = currentUserId
            ? list.filter((c: any) => (c.participants || []).some((p: any) => p.id && p.id !== currentUserId))
            : list;
          const total = validList.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          if (lastInboxEventTimeRef.current <= fetchStartTime) setMessageCount(total);
        }
      }
    } catch { /* silent */ }
  }, [user, currentRole, pathname, currentUserId]);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    const handleBadgeUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'notification') {
        setNotificationCount(prev => Math.max(0, prev - (detail.count || 1)));
      } else fetchBadgeCounts();
    };
    window.addEventListener('badge-update', handleBadgeUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('badge-update', handleBadgeUpdate);
    };
  }, [fetchBadgeCounts]);

  useEffect(() => {
    const handleTotalCount = (e: Event) => {
      const total = (e as CustomEvent<{ total: number }>).detail?.total ?? 0;
      setMessageCount(total);
      lastInboxEventTimeRef.current = Date.now();
    };
    window.addEventListener('inbox:totalCount', handleTotalCount);
    return () => window.removeEventListener('inbox:totalCount', handleTotalCount);
  }, []);

  return { notificationCount, messageCount, opportunityCount };
}
