/**
 * What the Go live tiles need: whether the server lets this account host its own events, and the "N upcoming · N live"
 * line for My hosted events. The same hook for every role (photographer, client, coordinator); the server decides, so
 * with hosting off, or an account that cannot host, nothing shows.
 */
import { useEffect, useState } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { bucketOf, getEligibility, listHostedEvents } from '@/lib/hosting/hostedEvents';

export function useHostEntry(): { canHost: boolean; caption: string } {
  const apiUrl = getApiUrl();
  const [canHost, setCanHost] = useState(false);
  const [caption, setCaption] = useState('Upcoming, live and ended');
  useEffect(() => {
    const authFetch = dashboardAuthFetch as (u: string, i?: RequestInit) => Promise<Response>;
    getEligibility(apiUrl, authFetch)
      .then((e) => {
        setCanHost(e.canHostFree);
        if (!e.canHostFree) return;
        return listHostedEvents(apiUrl, authFetch).then((list) => {
          const now = Date.now();
          const b = list.map((x) => bucketOf(x, now));
          setCaption(`${b.filter((x) => x === 'upcoming').length} upcoming \u00B7 ${b.filter((x) => x === 'live').length} live`);
        });
      })
      .catch(() => setCanHost(false));
  }, [apiUrl]);
  return { canHost, caption };
}
