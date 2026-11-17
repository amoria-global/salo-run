'use client';

import { useState } from 'react';
import { publishActionFor, unpublishWarning, type HostedEvent, type UnpublishImpact } from '@/lib/hosting/hostedEvents';
import { getEventStatus, isStartingSoon } from '@/lib/events/eventStatus';
import { invitesOn } from '@/lib/wishes/wishInvites';

export interface HostedRowActions {
  setPublished: (published: boolean) => Promise<void>;
  loadImpact: () => Promise<UnpublishImpact | undefined>;
  setInvites: (allow: boolean) => Promise<void>;
  onChanged: () => void;
}

/**
 * The behaviour of one row on My hosted events, shared by the classic list and the Compact Glass list: the status rule
 * (getEventStatus), whether Go live is offered, the three-dot menu, Unpublish with its impact warning and confirmation,
 * Republish, and the wish-invites switch. Presentation lives in the views.
 */
export function useHostedRow(event: HostedEvent, now: number, a: HostedRowActions) {
  const status = getEventStatus(event, now);
  const soon = isStartingSoon(event, now);
  const action = publishActionFor(event.published, status);
  const canGoLive = status !== 'ENDED' && event.published;
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<UnpublishImpact | undefined>();
  const warning = unpublishWarning(impact);
  const [invites, setInvitesOn] = useState(invitesOn(event.allowWishInvites));
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'That did not work. Please try again.');
  const toggleInvites = async () => {
    setBusy(true); setError(null);
    try { await a.setInvites(!invites); setInvitesOn(!invites); setMenu(false); a.onChanged(); }
    catch (e) { fail(e); }
    finally { setBusy(false); }
  };
  const run = async (published: boolean) => {
    setBusy(true); setError(null);
    try { await a.setPublished(published); setConfirm(false); setMenu(false); a.onChanged(); }
    catch (e) { fail(e); }
    finally { setBusy(false); }
  };
  const askUnpublish = () => { setMenu(false); setImpact(undefined); setConfirm(true); void a.loadImpact().then(setImpact); };
  const label = status === 'LIVE' ? 'Live now' : status === 'ENDED' ? 'Ended' : soon ? 'Starting soon' : 'Upcoming';
  return { status, soon, action, canGoLive, menu, setMenu, confirm, setConfirm, busy, error, warning, invites, toggleInvites, run, askUnpublish, label };
}
