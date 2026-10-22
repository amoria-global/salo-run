'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, Search, Skeleton } from '@/app/components/ui';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { shortDate } from '@/app/lib/workspaceStatus';

/**
 * The clients of a workspace you were invited to. The owner's own Clients page is built around what each client has
 * spent and what is still due, which a collaborator may not see (the server also removes those fields from the
 * response), so this is a separate, smaller list of who the clients are and what they booked.
 */
interface SharedClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
  totalBookings?: number;
  lastBookingDate?: string | null;
  lastEventName?: string | null;
  lastEventType?: string | null;
  status?: string | null;
}

export default function SharedClients() {
  const [clients, setClients] = useState<SharedClient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/clients`);
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || body.action !== 1) throw new Error(body?.message || 'Could not load clients');
      const list = Array.isArray(body.data) ? body.data : body.data?.content ?? [];
      setClients(list as SharedClient[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load clients');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => (clients ?? []).filter((c) => !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)),
    [clients, q],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader eyebrow="Shared workspace" title="Clients" subtitle="The clients of this workspace and what they booked." />
      <div className="mb-5 w-full sm:w-80">
        <Search value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} aria-label="Search clients" placeholder="Search clients" />
      </div>

      {error ? (
        <Card>
          <EmptyState icon={<i className="bi bi-wifi-off" aria-hidden />} title="Could not load clients" description={error} action={<Button onClick={load}>Try again</Button>} />
        </Card>
      ) : clients === null ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading clients">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding={16}><Skeleton height={44} /></Card>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Card>
          <EmptyState icon={<i className="bi bi-people" aria-hidden />} title={q ? 'No client matches that search' : 'No clients yet'}
            description={q ? undefined : 'Clients appear here once they book this workspace.'} />
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <li key={c.id}>
              <Card padding={16}>
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar src={normalizeImageUrl(c.profilePicture || undefined)} name={c.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-[var(--ck-text)]">{c.name}</span>
                      {c.status && <Badge tone={c.status.toLowerCase() === 'active' ? 'success' : 'muted'}>{c.status}</Badge>}
                    </div>
                    <p className="text-sm text-[var(--ck-text-soft)]">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details'}
                    </p>
                    <p className="text-sm text-[var(--ck-text-soft)]">
                      {c.totalBookings ?? 0} {(c.totalBookings ?? 0) === 1 ? 'booking' : 'bookings'}
                      {c.lastEventName ? ` · Last: ${c.lastEventName}` : ''}
                      {c.lastBookingDate ? ` · ${shortDate(c.lastBookingDate)}` : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
