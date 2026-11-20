'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  approveOpportunity,
  getPhotographerOpportunities,
  getPhotographerOpportunity,
  rejectOpportunity,
  syncServerClock,
  type OpportunityFilter,
  type PhotographerOpportunity,
} from '@/app/lib/hybridBooking';
import { opportunityTabFor } from '@/app/lib/hybridStatus';

export const DECLINE_REASONS = ['Already booked', 'Too far', 'Budget too low', 'Not my specialty', 'Other'];

export type OpportunityNotice = { tone: 'success' | 'error' | 'info'; text: string };

/**
 * The behaviour of the Opportunities page, shared by the classic view and the Compact Glass view so the two cannot drift:
 * which tab is open, the list and its polling (10 s on New, 30 s elsewhere), the notification deep link, saying yes, and
 * passing with an optional reason. Presentation lives in the views.
 */
export function useOpportunities(focusCandidateId?: string | null) {
  const [tab, setTab] = useState<OpportunityFilter>('PENDING_RESPONSE');
  const [items, setItems] = useState<PhotographerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<OpportunityNotice | null>(null);
  const [declining, setDeclining] = useState<PhotographerOpportunity | null>(null);
  const [reason, setReason] = useState<string>('');

  const load = useCallback(async (which: OpportunityFilter) => {
    try {
      const data = await getPhotographerOpportunities(which);
      setItems(which === 'ALL' ? data.filter((d) => d.status !== 'INVITED' && d.status !== 'APPROVED') : data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load opportunities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncServerClock();
  }, []);

  useEffect(() => {
    setLoading(true);
    load(tab);
    const id = setInterval(() => load(tab), tab === 'PENDING_RESPONSE' ? 10000 : 30000);
    return () => clearInterval(id);
  }, [tab, load]);

  // A notification names one opportunity. Selected, not selected, expired or
  // closed ones are listed under History, not New, so open the tab that has it.
  useEffect(() => {
    if (!focusCandidateId) return;
    getPhotographerOpportunity(focusCandidateId)
      .then((o) => setTab(opportunityTabFor(o.status)))
      .catch(() => {});
  }, [focusCandidateId]);

  useEffect(() => {
    if (!focusCandidateId || loading) return;
    const el = document.getElementById(`opp-${focusCandidateId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusCandidateId, loading, items]);

  const approve = async (o: PhotographerOpportunity) => {
    setBusyId(o.opportunityId);
    setNotice(null);
    try {
      await approveOpportunity(o.opportunityId);
      setNotice({ tone: 'success', text: `You said yes to ${o.eventTitle}. The client will be told, and we'll let you know if they choose you.` });
      load(tab);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not send your answer.' });
      load(tab);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDecline = async () => {
    if (!declining) return;
    const o = declining;
    setBusyId(o.opportunityId);
    try {
      await rejectOpportunity(o.opportunityId, reason || undefined);
      setNotice({ tone: 'info', text: `You passed on ${o.eventTitle}. It goes to the next photographer.` });
      setDeclining(null);
      setReason('');
      load(tab);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Could not send your answer.' });
      setDeclining(null);
      load(tab);
    } finally {
      setBusyId(null);
    }
  };

  const startDecline = (o: PhotographerOpportunity) => { setReason(''); setDeclining(o); };

  return { tab, setTab, items, loading, error, busyId, notice, declining, setDeclining, reason, setReason, load, approve, confirmDecline, startDecline };
}
