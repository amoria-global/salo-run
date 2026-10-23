"use client";

/**
 * The owner's view of how the album's collaborators are getting on: a summary of the whole album, then one card per
 * photographer who accepted the invitation, those who need the owner first.
 *
 * Each card says, in words and numbers (colour only repeats it): how many of their photos were added, how many wait
 * for the owner, how many were not accepted, how much of the album they account for, and when they last sent
 * something. From a card the owner goes straight to that person's photos. Presentational only: the page owns the data.
 */

import React from 'react';
import { Avatar, Badge, Button, Card } from '@/app/components/ui';
import { timeAgo } from '@/app/components/collab/parts';
import type { Contributor, ContributorState, ProgressTotals } from '@/app/lib/collabProgress';

/** Added to the album, waiting for the owner, not accepted. The brand pink marks what needs the owner. */
const COLORS = { approved: '#059669', pending: '#F20C8F', rejected: '#94A3B8' } as const;

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** A stacked bar of the three outcomes. Decorative for sighted users: the same numbers are written beside it. */
export function ProgressBar({ approved, pending, rejected, height = 10 }: { approved: number; pending: number; rejected: number; height?: number }) {
  const total = approved + pending + rejected;
  const label = total === 0
    ? 'No photos submitted yet'
    : `${plural(approved, 'photo', 'photos')} added, ${pending} waiting, ${rejected} not accepted`;
  return (
    <div role="img" aria-label={label} className="flex w-full overflow-hidden rounded-full bg-[var(--ck-surface-muted)]" style={{ height }}>
      {total > 0 && (
        <>
          {approved > 0 && <span style={{ flex: approved, background: COLORS.approved }} />}
          {pending > 0 && <span style={{ flex: pending, background: COLORS.pending }} />}
          {rejected > 0 && <span style={{ flex: rejected, background: COLORS.rejected }} />}
        </>
      )}
    </div>
  );
}

function Legend({ approved, pending, rejected }: { approved: number; pending: number; rejected: number }) {
  const item = (color: string, n: number, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <b className="font-semibold text-[var(--ck-text)]">{n}</b> {text}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ck-text-soft)]">
      {item(COLORS.approved, approved, 'added')}
      {item(COLORS.pending, pending, 'waiting')}
      {item(COLORS.rejected, rejected, 'not accepted')}
    </div>
  );
}

// ─── Album summary ───────────────────────────────────────────────

export function ProgressSummaryCard({ totals }: { totals: ProgressTotals }) {
  const { submitted, approved, pending, rejected, collaborators, contributing, waiting } = totals;
  const sentence = collaborators === 0
    ? 'Invite a photographer to start collecting photos for this album.'
    : submitted === 0
      ? `${plural(collaborators, 'photographer has', 'photographers have')} joined. Nobody has submitted a photo yet.`
      : `${contributing} of ${plural(collaborators, 'collaborator has', 'collaborators have')} submitted photos${waiting > 0 ? `, and ${waiting === 1 ? '1 is' : `${waiting} are`} waiting for you.` : '. You are all caught up.'}`;
  return (
    <Card>
      <section aria-labelledby="progress-h" data-testid="progress-summary">
        <h2 id="progress-h" className="text-base font-bold text-[var(--ck-text)]">Collaboration progress</h2>
        <p className="mt-1 text-sm text-[var(--ck-text-soft)]">{sentence}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Submitted" value={submitted} />
          <Stat label="Added to album" value={approved} color={COLORS.approved} />
          <Stat label="Waiting for you" value={pending} color={COLORS.pending} />
          <Stat label="Not accepted" value={rejected} color={COLORS.rejected} />
        </dl>
        <div className="mt-4"><ProgressBar approved={approved} pending={pending} rejected={rejected} height={12} /></div>
      </section>
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl bg-[var(--ck-surface-soft)] px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-[var(--ck-text-soft)]">
        {color && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />}
        {label}
      </dt>
      <dd className="text-2xl font-bold tabular-nums text-[var(--ck-text)]">{value}</dd>
    </div>
  );
}

// ─── One collaborator ────────────────────────────────────────────

const STATE: Record<ContributorState, { tone: 'accent' | 'success' | 'muted'; label: (c: Contributor) => string }> = {
  waiting: { tone: 'accent', label: (c) => `${c.pending} to review` },
  up_to_date: { tone: 'success', label: () => 'Up to date' },
  not_started: { tone: 'muted', label: () => 'No photos yet' },
};

export function ContributorCard({ c, onReview, onSeePhotos, onRemove }: {
  c: Contributor;
  onReview: (id: string) => void;
  onSeePhotos: (id: string) => void;
  onRemove?: (c: Contributor) => void;
}) {
  const state = STATE[c.state];
  const joined = c.joinedAt ? `Joined ${timeAgo(c.joinedAt)}` : 'No longer a collaborator';
  const last = c.lastSubmittedAt ? `last photo ${timeAgo(c.lastSubmittedAt)}` : 'nothing submitted yet';
  const facts: string[] = [];
  if (c.approved > 0 && c.share !== null) facts.push(`Accounts for ${c.share}% of this album`);
  if (c.decided > 0 && c.acceptRate !== null) facts.push(`${c.acceptRate}% of reviewed photos were added`);
  return (
    <li>
      <Card padding={16}>
        <article aria-label={`${c.name}, ${state.label(c)}`} data-testid="contributor-card" data-state={c.state} className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar src={c.avatar} name={c.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-[var(--ck-text)]">{c.name}</h3>
                <Badge tone={state.tone}>{state.label(c)}</Badge>
              </div>
              <p className="text-sm text-[var(--ck-text-soft)]">{joined}, {last}.</p>
            </div>
          </div>

          {c.state === 'not_started' ? (
            <p className="rounded-xl bg-[var(--ck-surface-soft)] px-3 py-2 text-sm text-[var(--ck-text-soft)]">
              Accepted your invitation but has not sent a photo yet.
            </p>
          ) : (
            <>
              <ProgressBar approved={c.approved} pending={c.pending} rejected={c.rejected} />
              <Legend approved={c.approved} pending={c.pending} rejected={c.rejected} />
              {facts.length > 0 && <p className="text-sm text-[var(--ck-text-soft)]">{facts.join('. ')}.</p>}
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {c.pending > 0 && (
              <Button size="sm" onClick={() => onReview(c.id)} iconLeft={<i className="bi bi-inbox" aria-hidden />}>
                Review their photos ({c.pending})
              </Button>
            )}
            {c.total > 0 && (
              <Button size="sm" variant="soft" onClick={() => onSeePhotos(c.id)} iconLeft={<i className="bi bi-images" aria-hidden />}>
                All their photos ({c.total})
              </Button>
            )}
            {onRemove && c.membershipId && (
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onRemove(c)} aria-label={`Remove ${c.name}`}>Remove</Button>
            )}
          </div>
        </article>
      </Card>
    </li>
  );
}

// ─── The list ────────────────────────────────────────────────────

export function ContributorList({ contributors, former, onReview, onSeePhotos, onRemove }: {
  contributors: Contributor[];
  former: Contributor[];
  onReview: (id: string) => void;
  onSeePhotos: (id: string) => void;
  onRemove: (c: Contributor) => void;
}) {
  return (
    <>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Collaborators">
        {contributors.map((c) => <ContributorCard key={c.id} c={c} onReview={onReview} onSeePhotos={onSeePhotos} onRemove={onRemove} />)}
      </ul>
      {former.length > 0 && (
        <details className="mt-5 rounded-2xl border border-[var(--ck-stroke-soft)] bg-[var(--ck-surface)] p-4" data-testid="former-contributors">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--ck-text)]">
            Past collaborators ({former.length})
          </summary>
          <p className="mt-2 text-sm text-[var(--ck-text-soft)]">Their photos stay in the album and are counted above.</p>
          <ul className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {former.map((c) => <ContributorCard key={c.id} c={c} onReview={onReview} onSeePhotos={onSeePhotos} />)}
          </ul>
        </details>
      )}
    </>
  );
}
