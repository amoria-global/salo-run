'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, Button, Card, PageHeader } from '@/app/components/ui';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

/**
 * The home of a workspace you were invited to. The owner's own dashboard is built around their earnings, balance and
 * payments, none of which a collaborator may see, so it is never loaded here: no money call is made and no figure is
 * drawn. What a collaborator can do is listed, and so is what stays with the owner, so nobody wonders where the
 * wallet went.
 */
const CAN_DO: { href: string; icon: string; title: string; body: string }[] = [
  { href: '/user/photographer/events', icon: 'bi-calendar-event', title: 'Events and bookings', body: 'Accept or decline requests, run events and streams, and deliver albums.' },
  { href: '/user/photographer/clients', icon: 'bi-people', title: 'Clients', body: 'See the clients of this workspace and their work.' },
];

const STAYS_WITH_OWNER = ['Wallet, balance and earnings', 'Payments, withdrawals and payout details', 'Account settings, security and verification', 'Notifications', 'Who else has access'];

export default function SharedWorkspaceHome() {
  const { active, switchTo } = useWorkspace();
  const ownerName = active?.owner.name ?? 'this photographer';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Shared workspace"
        title={`${ownerName}'s workspace`}
        subtitle="You are working here as a collaborator, signed in as yourself."
        actions={<Button variant="soft" onClick={() => switchTo(null)} iconLeft={<i className="bi bi-arrow-left-right" aria-hidden />}>Back to my workspace</Button>}
      />

      {active && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-5 py-3.5">
          <Avatar src={active.owner.profilePicture} name={active.owner.name} size={40} />
          <div className="text-sm text-[var(--ck-text-soft)]">
            Workspace owner <span className="font-semibold text-[var(--ck-text)]">{active.owner.name}</span>
          </div>
        </div>
      )}

      <h2 className="mb-3 text-base font-semibold text-[var(--ck-text)]">What you can do here</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAN_DO.map((c) => (
          <Link key={c.href} href={c.href}
            className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85] focus-visible:ring-offset-2">
            <Card hover>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#083A85]/10 text-[#083A85]" aria-hidden>
                  <i className={`bi ${c.icon}`} />
                </span>
                <div>
                  <div className="font-semibold text-[var(--ck-text)]">{c.title}</div>
                  <p className="mt-0.5 text-sm text-[var(--ck-text-soft)]">{c.body}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold text-[var(--ck-text)]">What stays with {ownerName}</h2>
      <Card>
        <ul className="space-y-2 text-sm text-[var(--ck-text-soft)]">
          {STAYS_WITH_OWNER.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <i className="bi bi-lock text-[var(--ck-text-soft)]" aria-hidden />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
