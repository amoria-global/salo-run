/**
 * What the Go live tiles need: whether the server lets this account host its own events, and the "N upcoming · N live"
 * line for My hosted events. The same hook for every role (photographer, client, coordinator); the server decides, so
 * with hosting off, or an account that cannot host, nothing shows.
 */
import { useEffect, useState } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getActiveWorkspaceId } from '@/app/lib/workspace';
import { getApiUrl } from '@/lib/api';
import { bucketOf, getEligibility, listHostedEvents } from '@/lib/hosting/hostedEvents';

export function useHostEntry(): { canHost: boolean; caption: string; loaded: boolean } {
  const apiUrl = getApiUrl();
  const [canHost, setCanHost] = useState(false);
  const [caption, setCaption] = useState('Upcoming, live and ended');
  // True once the eligibility answer is in, so a page can reserve the tiles' space instead of shifting when they appear.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Hosting is the account's own business, not part of another photographer's workspace (the server refuses it
    // there): no request, no Go live tile.
    if (getActiveWorkspaceId()) { setCanHost(false); setLoaded(true); return; }
    const authFetch = dashboardAuthFetch as (u: string, i?: RequestInit) => Promise<Response>;
    getEligibility(apiUrl, authFetch)
      .then((e) => {
        setCanHost(e.canHostFree);
        setLoaded(true);
        if (!e.canHostFree) return;
        return listHostedEvents(apiUrl, authFetch).then((list) => {
          const now = Date.now();
          const b = list.map((x) => bucketOf(x, now));
          setCaption(`${b.filter((x) => x === 'upcoming').length} upcoming \u00B7 ${b.filter((x) => x === 'live').length} live`);
        });
      })
      .catch(() => { setCanHost(false); setLoaded(true); });
  }, [apiUrl]);
  return { canHost, caption, loaded };
}
