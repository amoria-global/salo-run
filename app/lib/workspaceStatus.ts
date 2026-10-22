import type { InvitationStatus, WorkspaceInvitation } from './APIs/workspaces';

/**
 * How an invitation's status reads, and what each side may do about it. The server decides what is legal and
 * refuses the rest; this only chooses which buttons are worth showing, so nobody is offered an action that can
 * only fail.
 */

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'muted' | 'brand' | 'accent';

export interface StatusView {
  label: string;
  tone: Tone;
  /** One plain sentence for the person looking at the row. */
  meaning: { owner: string; invitee: string };
}

const VIEWS: Record<InvitationStatus, StatusView> = {
  PENDING: {
    label: 'Waiting',
    tone: 'warning',
    meaning: { owner: 'Waiting for them to answer.', invitee: 'Waiting for your answer.' },
  },
  ACCEPTED: {
    label: 'Active',
    tone: 'success',
    meaning: { owner: 'They can work in your workspace.', invitee: 'You can work in this workspace.' },
  },
  DECLINED: { label: 'Declined', tone: 'muted', meaning: { owner: 'They declined.', invitee: 'You declined.' } },
  CANCELLED: { label: 'Cancelled', tone: 'muted', meaning: { owner: 'You cancelled it.', invitee: 'It was cancelled.' } },
  EXPIRED: { label: 'Expired', tone: 'muted', meaning: { owner: 'It was not answered in time.', invitee: 'It expired before you answered.' } },
  REVOKED: { label: 'Removed', tone: 'error', meaning: { owner: 'You removed their access.', invitee: 'Your access was removed.' } },
  LEFT: { label: 'Left', tone: 'muted', meaning: { owner: 'They left your workspace.', invitee: 'You left this workspace.' } },
};

export function statusView(status: InvitationStatus): StatusView {
  return VIEWS[status] ?? { label: status, tone: 'muted', meaning: { owner: '', invitee: '' } };
}

export type OwnerAction = 'resend' | 'cancel' | 'revoke';
export type InviteeAction = 'accept' | 'decline' | 'open' | 'leave';

/** What the owner can do to an invitation they sent, in the order shown. */
export function ownerActions(status: InvitationStatus): OwnerAction[] {
  switch (status) {
    case 'PENDING': return ['resend', 'cancel'];
    case 'ACCEPTED': return ['revoke'];
    // Ended without a membership: sending it again is a fresh invitation.
    case 'DECLINED':
    case 'CANCELLED':
    case 'EXPIRED': return ['resend'];
    default: return [];
  }
}

/** What the invited photographer can do with an invitation they received. */
export function inviteeActions(status: InvitationStatus): InviteeAction[] {
  switch (status) {
    case 'PENDING': return ['accept', 'decline'];
    case 'ACCEPTED': return ['open', 'leave'];
    default: return [];
  }
}

/** Open invitations first (waiting, then active), then the rest by newest. */
export function sortInvitations<T extends Pick<WorkspaceInvitation, 'status' | 'createdAt'>>(list: readonly T[]): T[] {
  const rank = (s: InvitationStatus) => (s === 'PENDING' ? 0 : s === 'ACCEPTED' ? 1 : 2);
  return [...list].sort((a, b) => rank(a.status) - rank(b.status) || String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
}

/** "22 Oct 2026", or an empty string when there is no date. Fixed English month names, so it reads the same everywhere. */
export function shortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
