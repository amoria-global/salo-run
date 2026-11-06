'use client';

/**
 * Drives the Get started modal on an Events page: reads "Don't show this again" (browser cache first, then the account),
 * opens the modal when it should, and saves the checkbox to both. `show` is for the "Show getting started" button.
 *
 * The modal is for accounts that have created nothing at all: no events, hosted events, albums or photobooks. The extra
 * lists are read only when the events list is empty and the modal would otherwise open; a failed read counts as
 * "unknown" and keeps the modal closed.
 */
import { useEffect, useState } from 'react';
import { dashboardAuthFetch, useDashboardAuth } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { listHostedEvents } from '@/lib/hosting/hostedEvents';
import { GET_STARTED_PREF_KEY, getStartedActions, preferencesPath, markShown, shouldAutoOpen, shownThisSession, type GetStartedRole } from './getStarted';

export function useGetStarted({ role, canHost, canCreate = true, listLoaded, hasItems }: { role: GetStartedRole; canHost: boolean; canCreate?: boolean; listLoaded: boolean; hasItems: boolean }) {
  const { user } = useDashboardAuth();
  const actions = getStartedActions(role, { canHost, canCreate });
  const cacheKey = `${GET_STARTED_PREF_KEY}.${user?.id ?? 'anon'}`;
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<boolean | null>(null);
  const wantCheck = listLoaded && !hasItems && dismissed === false && actions.length > 0 && !shownThisSession();

  useEffect(() => {
    if (!wantCheck) return;
    let live = true;
    const apiUrl = getApiUrl();
    const rows = async (path: string): Promise<number> => {
      const res = await dashboardAuthFetch(`${apiUrl}${path}`);
      if (!res.ok) throw new Error(path);
      const body = await res.json();
      const d = body?.data;
      return Array.isArray(d) ? d.length : Array.isArray(d?.content) ? d.content.length : 0;
    };
    const checks: Promise<number>[] = [listHostedEvents(apiUrl, dashboardAuthFetch as (u: string, i?: RequestInit) => Promise<Response>).then((l) => l.length)];
    if (role === 'photographer') checks.push(rows('/api/remote/photographer/albums'), rows('/api/remote/photographer/photobooks'));
    else checks.push(rows('/api/remote/customer/events/photobooks'));
    Promise.all(checks).then((n) => live && setCreated(n.some((c) => c > 0))).catch(() => {});
    return () => { live = false; };
  }, [wantCheck, role]);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    let cached = false;
    try { cached = window.localStorage.getItem(cacheKey) === 'true'; } catch { /* private mode */ }
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}${preferencesPath(role)}`);
        const body = res.ok ? await res.json() : null;
        const remote = body?.action === 1 && body?.data?.[GET_STARTED_PREF_KEY] === 'true';
        if (remote) { try { window.localStorage.setItem(cacheKey, 'true'); } catch { /* ignore */ } }
        if (live) setDismissed(remote || cached);
      } catch {
        if (live) setDismissed(cached);
      }
    })();
    return () => { live = false; };
  }, [user?.id, role, cacheKey]);

  // Adjusted while rendering (React's pattern for "open when this becomes true"), so no effect sets it.
  if (!open && shouldAutoOpen({ actions: actions.length, listLoaded: listLoaded && created !== null, hasItems: hasItems || created === true, dismissed, shownThisSession: shownThisSession() })) {
    markShown();
    setOpen(true);
  }

  const close = () => setOpen(false);
  const show = () => { if (actions.length > 0) setOpen(true); };

  const setForever = (forever: boolean) => {
    setDismissed(forever);
    try { if (forever) window.localStorage.setItem(cacheKey, 'true'); else window.localStorage.removeItem(cacheKey); } catch { /* ignore */ }
    dashboardAuthFetch(`${getApiUrl()}${preferencesPath(role)}/${encodeURIComponent(GET_STARTED_PREF_KEY)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(forever) }),
    }).catch(() => {});
  };

  return { actions, open, dismissed: dismissed === true, close, show, setForever };
}
