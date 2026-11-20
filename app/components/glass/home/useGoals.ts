'use client';

/**
 * Goal plans for "Compare goals": the same /photographer/plans endpoints, the same localStorage keys and the same
 * rule (a name and an earnings target are required) as the old Home, so a plan made on either Home shows on both.
 */
import { useCallback, useEffect, useState } from 'react';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import type { Period } from './homeData';

export interface Plan {
  id: string; name: string; timePeriod: Period; customStartDate?: string; customEndDate?: string;
  targetEarnings: string; targetPending: string; targetClients: string; targetBonuses: string; targetRatings: string;
}
export type PlanDraft = Omit<Plan, 'id'>;

const MODE = 'connekt_comparison_mode', PLAN = 'connekt_comparison_plan_id';
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* not remembered */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const body = (p: PlanDraft) => JSON.stringify({
  name: p.name, timePeriod: p.timePeriod,
  customStartDate: p.timePeriod === 'custom' ? p.customStartDate || null : null,
  customEndDate: p.timePeriod === 'custom' ? p.customEndDate || null : null,
  targetEarnings: p.targetEarnings, targetPending: p.targetPending, targetClients: p.targetClients,
  targetBonuses: p.targetBonuses, targetRatings: p.targetRatings,
});

export function useGoals(enabled: boolean) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [active, setActive] = useState<Plan | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/plans`);
        const j = res.ok ? await res.json() : null;
        if (!j || j.action !== 1 || !Array.isArray(j.data)) return;
        const list: Plan[] = j.data.map((p: Record<string, unknown>) => ({
          id: String(p.id), name: String(p.name || ''), timePeriod: (p.timePeriod as Period) || 'week',
          customStartDate: (p.customStartDate as string) || undefined, customEndDate: (p.customEndDate as string) || undefined,
          targetEarnings: String(p.targetEarnings || '0'), targetPending: String(p.targetPending || '0'),
          targetClients: String(p.targetClients || '0'), targetBonuses: String(p.targetBonuses || '0'), targetRatings: String(p.targetRatings || '0'),
        }));
        setPlans(list);
        if (store.get(MODE) === 'true') {
          const keep = list.find((p) => p.id === store.get(PLAN));
          if (keep) setActive(keep); else { store.del(MODE); store.del(PLAN); }
        }
      } catch { /* goals are optional; the Home works without them */ }
    })();
  }, [enabled]);

  const select = useCallback((p: Plan | null) => {
    setActive(p);
    if (p) { store.set(MODE, 'true'); store.set(PLAN, p.id); } else { store.del(MODE); store.del(PLAN); }
  }, []);

  const save = useCallback(async (draft: PlanDraft, editingId?: string): Promise<Plan | null> => {
    if (!draft.name.trim() || !draft.targetEarnings.trim()) return null;
    setError(false);
    try {
      const url = `${getApiUrl()}/api/remote/photographer/plans${editingId ? `/${editingId}` : ''}`;
      const res = await dashboardAuthFetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: body(draft) });
      const j = res.ok ? await res.json() : null;
      if (!j || j.action !== 1) { setError(true); return null; }
      const plan: Plan = { ...draft, id: editingId || String(j.data?.id || `plan-${Date.now()}`) };
      setPlans((ps) => (editingId ? ps.map((x) => (x.id === editingId ? plan : x)) : [...ps, plan]));
      select(plan);
      return plan;
    } catch { setError(true); return null; }
  }, [select]);

  const remove = useCallback(async (id: string) => {
    setError(false);
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/plans/${id}`, { method: 'DELETE' });
      if (!res.ok) { setError(true); return; }
      setPlans((ps) => ps.filter((p) => p.id !== id));
      setActive((a) => { if (a?.id === id) { store.del(MODE); store.del(PLAN); return null; } return a; });
    } catch { setError(true); }
  }, []);

  return { plans, active, select, save, remove, error };
}
