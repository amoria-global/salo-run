'use client';

/**
 * Data for the Compact Glass Home. The same endpoints the old Home calls, one state per section, so a slow or failing
 * call shows that section's loading or error state without blanking the rest. Every call goes through
 * dashboardAuthFetch, which adds the session and the workspace header, and checks the envelope's action.
 */
import { useCallback, useEffect, useState } from 'react';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

export function useResource<T>(path: string | null): [Loadable<T>, () => void] {
  const [state, setState] = useState<Loadable<T>>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    setState({ status: 'loading' });
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}${path}`);
        const body = res.ok ? await res.json() : null;
        if (!alive) return;
        if (!body || body.action !== 1) { setState({ status: 'error' }); return; }
        setState({ status: 'ready', data: body.data as T });
      } catch {
        if (alive) setState({ status: 'error' });
      }
    })();
    return () => { alive = false; };
  }, [path, tick]);
  const retry = useCallback(() => setTick((n) => n + 1), []);
  return [state, retry];
}

export interface Analytics { averageRating?: number; totalClients?: number; pendingPayments?: number; totalEarnings?: number }
export interface Wallet { balanceAvailable?: number; pendingAmount?: number; balanceBonuses?: number; balanceTips?: number; status?: string }
export interface PerfPoint { day: string; date?: string; value1: number; value2: number }
