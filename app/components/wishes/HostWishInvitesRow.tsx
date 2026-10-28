'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getApiUrl } from '@/lib/api';
import { setWishInvites } from '@/lib/hosting/hostedEvents';
import { invitesOn, wishInvitesStatus } from '@/lib/wishes/wishInvites';

/**
 * The host's own view of the Wish invites setting: "Wish invites: On" with a shortcut to change it. It only controls what
 * viewers see; the host can always share the event themselves. Changing it needs no form and works while the event is live.
 */
export function HostWishInvitesRow({ eventId, initial, fetcher }: {
  eventId: string;
  initial?: boolean;
  fetcher: (url: string, init?: RequestInit) => Promise<Response>;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState<boolean | undefined>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setValue(initial), [initial]);

  const on = invitesOn(value);
  const toggle = async () => {
    setBusy(true);
    setError(null);
    const next = !on;
    setValue(next);
    try {
      await setWishInvites(getApiUrl(), fetcher, eventId, next);
    } catch (e) {
      setValue(on);
      setError(e instanceof Error ? e.message : 'Could not change wish invites. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <span aria-hidden="true" style={{ color: on ? '#1fb6cf' : colors.textSecondary }}>{'●'}</span>
        <span role="status" style={{ flex: 1, fontSize: '0.92rem', fontWeight: 700, color: colors.textPrimary }}>{wishInvitesStatus(value)}</span>
        <button type="button" onClick={toggle} disabled={busy} aria-label={on ? 'Turn off wish invites' : 'Turn on wish invites'}
          style={{ minHeight: 36, padding: '0 14px', borderRadius: 9999, border: `1px solid ${colors.borderPrimary}`, background: 'transparent', color: colors.brandAccent, fontWeight: 700, cursor: 'pointer' }}>
          {on ? 'Turn off' : 'Turn on'}
        </button>
      </div>
      {error ? <p role="alert" style={{ margin: 0, color: '#DC2626', fontSize: '0.8rem' }}>{error}</p> : null}
    </div>
  );
}
