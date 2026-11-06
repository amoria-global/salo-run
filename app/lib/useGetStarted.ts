'use client';

/**
 * Drives the Get started modal on an Events page: reads "Don't show this again" (browser cache first, then the account),
 * opens the modal when it should, and saves the checkbox to both. `show` is for the "Show getting started" button.
 */
import { useEffect, useState } from 'react';
import { dashboardAuthFetch, useDashboardAuth } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { GET_STARTED_PREF_KEY, getStartedActions, preferencesPath, markShown, shouldAutoOpen, shownThisSession, type GetStartedRole } from './getStarted';

export function useGetStarted({ role, canHost, canCreate = true, listLoaded, hasItems }: { role: GetStartedRole; canHost: boolean; canCreate?: boolean; listLoaded: boolean; hasItems: boolean }) {
  const { user } = useDashboardAuth();
  const actions = getStartedActions(role, { canHost, canCreate });
  const cacheKey = `${GET_STARTED_PREF_KEY}.${user?.id ?? 'anon'}`;
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

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
  if (!open && shouldAutoOpen({ actions: actions.length, listLoaded, hasItems, dismissed, shownThisSession: shownThisSession() })) {
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
