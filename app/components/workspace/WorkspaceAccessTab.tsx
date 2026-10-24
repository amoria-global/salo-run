'use client';

/**
 * Workspace access, inside Collaborate. Separate from album collaboration on purpose: an album collaborator only
 * submits photos to one album, while a photographer invited here works inside the whole workspace (bookings, events,
 * albums, clients) but never sees the wallet, payments or account settings. The screen says so plainly.
 *
 * Two sides of one list: invitations this photographer sent, and invitations sent to them.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Badge, Button, Card, EmptyState, Modal, Skeleton } from '@/app/components/ui';
import {
  answerInvitation, cancelInvitation, getInvitePreview, leaveWorkspace, listReceivedInvitations, listSentInvitations,
  lookupPhotographer, resendInvitation, revokeMembership, sendInvitation, sendInvitationByEmail,
  type InvitablePerson, type InvitePreview, type WorkspaceInvitation,
} from '@/app/lib/APIs/workspaces';
import {
  inviteeActions, inviteFocus, ownerActionLabel, ownerActions, ownerMeaning, shortDate, sortInvitations, statusView,
  type InviteFocus, type OwnerAction,
} from '@/app/lib/workspaceStatus';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

type Notice = { kind: 'ok' | 'error'; text: string } | null;
type Confirm = { action: OwnerAction | 'leave'; invitation: WorkspaceInvitation } | null;

/**
 * `inviteId` is the id from an invitation link ("...?tab=workspace&invite=<id>"): the matching invitation is put first,
 * with a button that accepts it and opens the workspace. `onInviteHandled` is called once it has been answered, so the
 * page can drop the id from the address.
 */
export default function WorkspaceAccessTab({ inviteId = null, onInviteHandled }: { inviteId?: string | null; onInviteHandled?: () => void } = {}) {
  const { switchTo, refresh: refreshWorkspaces } = useWorkspace();
  // The public preview, asked only when the link's invitation is not one of this account's own.
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(undefined);
  const [sent, setSent] = useState<WorkspaceInvitation[] | null>(null);
  const [received, setReceived] = useState<WorkspaceInvitation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  // A ref as well as state: two quick taps in one render must still make one request.
  const working = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, r] = await Promise.all([listSentInvitations(), listReceivedInvitations()]);
      setSent(s);
      setReceived(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load invitations');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const foundInReceived = !!inviteId && !!received && received.some((i) => i.id === inviteId);
  useEffect(() => {
    if (!inviteId || received === null || foundInReceived) return;
    let live = true;
    getInvitePreview(inviteId).then((p) => { if (live) setPreview(p); });
    return () => { live = false; };
  }, [inviteId, received, foundInReceived]);

  const focus: InviteFocus | null = inviteId && received !== null && (foundInReceived || preview !== undefined)
    ? inviteFocus(received, inviteId, preview ?? null)
    : null;
  const focusId = focus && (focus.kind === 'pending' || focus.kind === 'accepted' || focus.kind === 'ended') ? focus.invitation.id : null;

  /** Runs one request at a time per row; a second tap on the same button while it runs does nothing. */
  const run = async (key: string, work: () => Promise<unknown>, success: string) => {
    if (working.current) return;
    working.current = true;
    setBusy(key);
    setNotice(null);
    try {
      await work();
      setNotice({ kind: 'ok', text: success });
      await load();
      void refreshWorkspaces();
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Something went wrong' });
      // The server may have moved the invitation on (answered or cancelled elsewhere): show what is true now.
      void load();
    } finally {
      working.current = false;
      setBusy(null);
    }
  };

  const doOwner = (action: OwnerAction, inv: WorkspaceInvitation) => {
    if (action === 'resend') return run(inv.id + action, () => resendInvitation(inv.id), 'Invitation sent again.');
    if (action === 'cancel') return run(inv.id + action, () => cancelInvitation(inv.id), 'Invitation cancelled.');
    return run(inv.id + action, () => revokeMembership(inv.id), `${inv.invitee.name} no longer has access.`);
  };

  const loading = sent === null || received === null;
  // The linked invitation has its own card above, so it is not listed a second time.
  const listed = (received ?? []).filter((i) => i.id !== focusId);
  const pendingForMe = listed.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {inviteId && !loading && !error && (
        focus ? (
          <InviteFocusCard focus={focus} busy={busy}
            onAcceptAndOpen={async (inv) => {
              if (working.current) return;
              working.current = true;
              setBusy(inv.id + 'accept');
              setNotice(null);
              try {
                await answerInvitation(inv.id, true);
                onInviteHandled?.();
                // Switching reloads the page into the owner's workspace, so nothing after this needs to run.
                await switchTo(inv.owner.id as string);
              } catch (e) {
                setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Something went wrong' });
                void load();
              } finally {
                working.current = false;
                setBusy(null);
              }
            }}
            onDecline={(inv) => run(inv.id + 'decline', async () => { await answerInvitation(inv.id, false); onInviteHandled?.(); }, 'Invitation declined.')}
            onOpen={(inv) => { onInviteHandled?.(); void switchTo(inv.owner.id as string); }}
            onDismiss={() => onInviteHandled?.()} />
        ) : (
          <Card padding={16}><Skeleton height={16} width="45%" /></Card>
        )
      )}

      <Card accent="gradient">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#083A85]/10 text-[#083A85]" aria-hidden>
            <i className="bi bi-person-workspace text-xl" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[var(--ck-text)]">What they can and cannot do</h2>
            <p className="mt-1 text-sm text-[var(--ck-text-soft)]">
              They can handle bookings, events, opportunities, albums and clients with you, and see your balance and analytics. They cannot withdraw, see transactions or change account settings, and they do not become you.
            </p>
          </div>
        </div>
      </Card>

      <div aria-live="polite">
        {notice && (
          <div role={notice.kind === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-sm ${notice.kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {notice.text}
          </div>
        )}
      </div>

      {error ? (
        <Card>
          <EmptyState icon={<i className="bi bi-wifi-off" aria-hidden />} title="Could not load invitations" description={error}
            action={<Button onClick={load}>Try again</Button>} />
        </Card>
      ) : loading ? (
        <ListSkeleton />
      ) : (
        <>
          {pendingForMe > 0 && (
            <section aria-labelledby="ws-for-me">
              <h3 id="ws-for-me" className="mb-3 text-base font-semibold text-[var(--ck-text)]">Invitations for you</h3>
              <ul className="space-y-3">
                {sortInvitations(listed).filter((i) => i.status === 'PENDING').map((inv) => (
                  <ReceivedRow key={inv.id} inv={inv} busy={busy} onAccept={() => run(inv.id + 'accept', () => answerInvitation(inv.id, true), `You joined ${inv.owner.name}'s workspace.`)}
                    onDecline={() => run(inv.id + 'decline', () => answerInvitation(inv.id, false), 'Invitation declined.')}
                    onOpen={() => switchTo(inv.owner.id)} onLeave={() => setConfirm({ action: 'leave', invitation: inv })} />
                ))}
              </ul>
            </section>
          )}

          {listed.some((i) => i.status === 'ACCEPTED') && (
            <section aria-labelledby="ws-joined">
              <h3 id="ws-joined" className="mb-3 text-base font-semibold text-[var(--ck-text)]">Workspaces you can open</h3>
              <ul className="space-y-3">
                {listed.filter((i) => i.status === 'ACCEPTED').map((inv) => (
                  <ReceivedRow key={inv.id} inv={inv} busy={busy} onAccept={() => {}} onDecline={() => {}}
                    onOpen={() => switchTo(inv.owner.id)} onLeave={() => setConfirm({ action: 'leave', invitation: inv })} />
                ))}
              </ul>
            </section>
          )}

          <InviteForm onSent={async (text) => { setNotice({ kind: 'ok', text }); await load(); }} />

          <section aria-labelledby="ws-sent">
            <h3 id="ws-sent" className="mb-3 text-base font-semibold text-[var(--ck-text)]">Invitations you sent</h3>
            {(sent ?? []).length === 0 ? (
              <Card>
                <EmptyState icon={<i className="bi bi-send" aria-hidden />} title="You have not invited anyone yet"
                  description="Find a photographer by their email above. If they have an account they see the invitation in their app and get it by email. If not, we email them a link to create one." />
              </Card>
            ) : (
              <ul className="space-y-3">
                {sortInvitations(sent ?? []).map((inv) => (
                  <SentRow key={inv.id} inv={inv} busy={busy}
                    onAction={(a) => (a === 'cancel' || a === 'revoke' ? setConfirm({ action: a, invitation: inv }) : doOwner(a, inv))} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} busy={busy !== null}
        onConfirm={async () => {
          const c = confirm;
          setConfirm(null);
          if (!c) return;
          if (c.action === 'leave') await run(c.invitation.id + 'leave', () => leaveWorkspace(c.invitation.id), 'You left the workspace.');
          else await doOwner(c.action, c.invitation);
        }} />
    </div>
  );
}

// ─── Invite form ─────────────────────────────────────────────────

function InviteForm({ onSent }: { onSent: (text: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<InvitablePerson | null>(null);
  const [note, setNote] = useState('');
  const [looking, setLooking] = useState(false);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const inFlight = useRef(false);

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current || !email.trim()) return;
    inFlight.current = true;
    setLooking(true);
    setProblem(null);
    setFound(null);
    try {
      setFound(await lookupPhotographer(email));
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not look that up');
    } finally {
      inFlight.current = false;
      setLooking(false);
    }
  };

  const send = async () => {
    if (!found || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setProblem(null);
    try {
      if (found.registered === false) {
        const address = found.email || email.trim();
        await sendInvitationByEmail(address, note.trim() || undefined);
        setFound(null);
        setEmail('');
        setNote('');
        await onSent(`Invitation emailed to ${address}. They will need to create an account with that address first.`);
        return;
      }
      await sendInvitation(found.id as string, note.trim() || undefined);
      const name = found.name;
      setFound(null);
      setEmail('');
      setNote('');
      await onSent(`Invitation sent to ${name}. They will see it in their app and by email.`);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not send the invitation');
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <Card>
      <h3 className="text-base font-semibold text-[var(--ck-text)]">Invite a photographer</h3>
      <form onSubmit={find} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="ws-email" className="mb-1 block text-sm font-medium text-[var(--ck-text)]">Their email</label>
          <input id="ws-email" type="email" inputMode="email" autoComplete="off" value={email}
            onChange={(e) => { setEmail(e.target.value); setFound(null); setProblem(null); }}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-3 py-2.5 text-sm text-[var(--ck-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]" />
        </div>
        <Button type="submit" variant="soft" loading={looking} disabled={looking || !email.trim()}>Find photographer</Button>
      </form>

      {problem && <p role="alert" className="mt-3 text-sm text-red-600">{problem}</p>}

      {found && (
        <div className="mt-4 rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface-muted)] p-4">
          {found.registered === false ? (
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ck-surface)] text-[var(--ck-text-soft)]" aria-hidden>
                <i className="bi bi-envelope" />
              </span>
              <div className="min-w-0">
                <div className="truncate font-semibold text-[var(--ck-text)]">{found.email || email.trim()}</div>
                <div className="text-sm text-[var(--ck-text-soft)]">
                  No account uses this address yet. We will email them a link. They create a photographer account with this exact address, then accept your invitation.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar src={found.profilePicture} name={found.name} size={40} />
              <div className="min-w-0">
                <div className="truncate font-semibold text-[var(--ck-text)]">{found.name}</div>
                <div className="text-xs text-[var(--ck-text-soft)]">{found.customerType || 'Photographer'}</div>
              </div>
            </div>
          )}
          <label htmlFor="ws-note" className="mt-3 mb-1 block text-sm font-medium text-[var(--ck-text)]">Add a note (optional)</label>
          <input id="ws-note" type="text" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="For example: help me with weddings this season"
            className="w-full rounded-xl border border-[var(--ck-stroke)] bg-[var(--ck-surface)] px-3 py-2.5 text-sm text-[var(--ck-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]" />
          <div className="mt-3 flex justify-end">
            <Button onClick={send} loading={sending} disabled={sending}>{found.registered === false ? 'Email invitation' : 'Send invitation'}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Rows ────────────────────────────────────────────────────────

function SentRow({ inv, busy, onAction }: { inv: WorkspaceInvitation; busy: string | null; onAction: (a: OwnerAction) => void }) {
  const v = statusView(inv.status);
  const when = inv.status === 'PENDING' ? `Sent ${shortDate(inv.createdAt)}. Expires ${shortDate(inv.expiresAt)}.` : `Sent ${shortDate(inv.createdAt)}.`;
  return (
    <li>
      <Card padding={16}>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar src={inv.invitee.profilePicture} name={inv.invitee.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-[var(--ck-text)]">{inv.invitee.name}</span>
              {inv.invitee.registered === false && <Badge tone="info" icon={<i className="bi bi-envelope" aria-hidden />}>No account yet</Badge>}
              <Badge tone={v.tone}>{v.label}</Badge>
            </div>
            <p className="text-sm text-[var(--ck-text-soft)]">{ownerMeaning(inv)} {when}</p>
            {inv.note && <p className="mt-1 text-sm italic text-[var(--ck-text-soft)]">&ldquo;{inv.note}&rdquo;</p>}
          </div>
          <div className="flex gap-2">
            {ownerActions(inv.status).map((a) => (
              <Button key={a} size="sm" variant={a === 'resend' ? 'soft' : 'ghost'} loading={busy === inv.id + a} disabled={busy !== null}
                aria-label={`${ownerActionLabel(a, inv)}: ${inv.invitee.name}`} onClick={() => onAction(a)}>
                {ownerActionLabel(a, inv)}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </li>
  );
}

function ReceivedRow({ inv, busy, onAccept, onDecline, onOpen, onLeave }: {
  inv: WorkspaceInvitation; busy: string | null; onAccept: () => void; onDecline: () => void; onOpen: () => void; onLeave: () => void;
}) {
  const v = statusView(inv.status);
  const actions = inviteeActions(inv.status);
  return (
    <li>
      <Card padding={16}>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar src={inv.owner.profilePicture} name={inv.owner.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-[var(--ck-text)]">{inv.owner.name}&apos;s workspace</span>
              <Badge tone={v.tone}>{v.label}</Badge>
            </div>
            <p className="text-sm text-[var(--ck-text-soft)]">
              {inv.status === 'PENDING'
                ? `${inv.owner.name} invited you to work in their workspace. You would handle bookings, events, albums and clients, and see their balance and analytics. Withdrawals and transactions stay with them.`
                : v.meaning.invitee}
            </p>
          </div>
          <div className="flex gap-2">
            {actions.includes('accept') && <Button size="sm" loading={busy === inv.id + 'accept'} disabled={busy !== null} onClick={onAccept}>Accept</Button>}
            {actions.includes('decline') && <Button size="sm" variant="ghost" loading={busy === inv.id + 'decline'} disabled={busy !== null} onClick={onDecline}>Decline</Button>}
            {actions.includes('open') && <Button size="sm" disabled={busy !== null} onClick={onOpen}>Open workspace</Button>}
            {actions.includes('leave') && <Button size="sm" variant="ghost" disabled={busy !== null} onClick={onLeave}>Leave</Button>}
          </div>
        </div>
      </Card>
    </li>
  );
}

// ─── The invitation a link points at ─────────────────────────────

function InviteFocusCard({ focus, busy, onAcceptAndOpen, onDecline, onOpen, onDismiss }: {
  focus: InviteFocus; busy: string | null;
  onAcceptAndOpen: (inv: WorkspaceInvitation) => void; onDecline: (inv: WorkspaceInvitation) => void;
  onOpen: (inv: WorkspaceInvitation) => void; onDismiss: () => void;
}) {
  const shell = 'rounded-2xl border-2 p-5';
  if (focus.kind === 'pending') {
    const inv = focus.invitation;
    return (
      <section aria-label="Your invitation" data-testid="invite-focus" className={`${shell} border-[#083A85] bg-[#083A85]/5`}>
        <div className="flex items-start gap-4">
          <Avatar src={inv.owner.profilePicture} name={inv.owner.name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F20C8F]">Your invitation</p>
            <h2 className="text-lg font-bold text-[var(--ck-text)]">{inv.owner.name} invited you to work in their workspace</h2>
            <p className="mt-1 text-sm text-[var(--ck-text-soft)]">
              You would handle bookings, events, albums and clients with them, and see their balance and analytics. Withdrawals and transactions stay with them, and your own account stays separate.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button loading={busy === inv.id + 'accept'} disabled={busy !== null} onClick={() => onAcceptAndOpen(inv)}>Accept and open workspace</Button>
              <Button variant="ghost" loading={busy === inv.id + 'decline'} disabled={busy !== null} onClick={() => onDecline(inv)}>Decline</Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  if (focus.kind === 'accepted') {
    const inv = focus.invitation;
    return (
      <section aria-label="Your invitation" data-testid="invite-focus" className={`${shell} border-emerald-300 bg-emerald-50`}>
        <h2 className="text-base font-bold text-emerald-800">You already work in {inv.owner.name}&apos;s workspace</h2>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => onOpen(inv)}>Open workspace</Button>
          <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
        </div>
      </section>
    );
  }
  const message = focus.kind === 'ended'
    ? `This invitation from ${focus.invitation.owner.name} is ${focus.label}. Ask them to send a new one if you still want to work together.`
    : focus.kind === 'mismatch'
      ? `This invitation was sent to ${focus.maskedEmail}, which is not the account you are signed in with. Sign out, then sign in or create an account with that address to accept it.`
      : focus.kind === 'closed'
        ? 'This invitation is no longer open. It may have been answered, cancelled or expired. Ask the photographer to send a new one.'
        : 'We could not open this invitation. Check your connection, and that you are signed in with the address it was sent to.';
  return (
    <section role="alert" aria-label="Your invitation" data-testid="invite-focus" className={`${shell} border-amber-300 bg-amber-50`}>
      <p className="text-sm font-medium text-amber-900">{message}</p>
      <div className="mt-3"><Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button></div>
    </section>
  );
}

// ─── Confirm ─────────────────────────────────────────────────────

function ConfirmModal({ confirm, onClose, onConfirm, busy }: { confirm: Confirm; onClose: () => void; onConfirm: () => void; busy: boolean }) {
  if (!confirm) return null;
  const { action, invitation } = confirm;
  const text = action === 'revoke'
    ? `${invitation.invitee.name} will lose access to your workspace right away. You can invite them again later.`
    : action === 'cancel'
      ? `${invitation.invitee.name} will no longer be able to accept this invitation.`
      : `You will stop working in ${invitation.owner.name}'s workspace. They can invite you again.`;
  const title = action === 'revoke' ? 'Remove access?' : action === 'cancel' ? 'Cancel this invitation?' : 'Leave this workspace?';
  return (
    <Modal isOpen onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Keep</Button>
        <Button variant="danger" disabled={busy} onClick={onConfirm}>{action === 'leave' ? 'Leave' : action === 'cancel' ? 'Cancel invitation' : 'Remove access'}</Button>
      </>}>
      <p className="text-sm text-[var(--ck-text-soft)]">{text}</p>
    </Modal>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading invitations">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} padding={16}>
          <div className="flex items-center gap-3">
            <Skeleton height={40} width={40} rounded={999} />
            <div className="flex-1 space-y-2">
              <Skeleton height={16} width="40%" />
              <Skeleton height={12} width="65%" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
