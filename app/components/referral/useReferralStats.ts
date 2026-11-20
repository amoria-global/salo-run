'use client';

/** One load of the referral stats per screen, shared by the card, the menu, the sheets and the checklist. */
import { useCallback, useEffect, useState } from 'react';
import { fetchMyReferral, type ReferralStats } from '@/app/lib/referral';

export type StatsState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: ReferralStats };

export function useReferralStats(enabled = true): [StatsState, () => void] {
  const [state, setState] = useState<StatsState>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchMyReferral()
      .then((data) => { if (alive) setState({ status: 'ready', data }); })
      .catch(() => { if (alive) setState({ status: 'error' }); });
    return () => { alive = false; };
  }, [enabled, tick]);
  const reload = useCallback(() => { setState({ status: 'loading' }); setTick((n) => n + 1); }, []);
  return [state, reload];
}
