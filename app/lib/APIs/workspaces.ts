/**
 * Workspace invitations API client, wraps /api/remote/photographer/workspaces/*.
 *
 * A photographer invites another photographer to work inside their workspace. The backend owns every rule and every
 * status change; this client only asks. It answers {action, data, message}, and action 0 is a failure even on HTTP
 * 200, so every helper throws the backend's message for the caller to show.
 */

import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import type { WorkspaceAccess } from '../workspace';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' | 'REVOKED' | 'LEFT';

export interface WorkspacePerson {
  id: string;
  name: string;
  customerType?: string | null;
  profilePicture?: string | null;
}

/**
 * The person an invitation is for. Usually an account, but an invitation can go to an address with no account yet:
 * then `id` is null, `registered` is false and `name` is the address.
 */
export interface InvitablePerson extends Omit<WorkspacePerson, 'id'> {
  id: string | null;
  /** False when the address has no account yet. Absent on older servers, which means an account. */
  registered?: boolean;
  email?: string | null;
}

export interface WorkspaceInvitation {
  id: string;
  status: InvitationStatus;
  owner: WorkspacePerson;
  invitee: InvitablePerson;
  note?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  respondedAt?: string | null;
  endedAt?: string | null;
  /** The address it was sent to. */
  inviteeEmail?: string | null;
  /** "email" when it went to an address with no account yet, "in_app" when it went to an account. */
  delivery?: string;
  emailedAt?: string | null;
}

/** What the invitation link shows before sign-in: who invited, to which address, and whether it has an account. */
export interface InvitePreview {
  found: boolean;
  open: boolean;
  status?: string;
  ownerName?: string;
  email?: string;
  account?: 'none' | 'photographer' | 'other';
}

export interface WorkspaceMembership {
  workspaceId: string;
  invitationId: string;
  owner: WorkspacePerson;
  joinedAt?: string | null;
  access: WorkspaceAccess;
}

const base = () => `${getApiUrl()}/api/remote/photographer/workspaces`;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await dashboardAuthFetch(`${base()}${path}`, init);
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  let body: { action?: number; data?: T; message?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok || !body || body.action !== 1) {
    throw new Error(body?.message || 'Something went wrong. Please try again.');
  }
  return body.data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Finds a photographer by exact email. An address with no account answers with `registered: false` and can be invited by email. */
export async function lookupPhotographer(email: string): Promise<InvitablePerson> {
  const d = await call<{ photographer: InvitablePerson }>(`/lookup?allowUnregistered=true&email=${encodeURIComponent(email.trim())}`);
  return d.photographer;
}

export async function listSentInvitations(): Promise<WorkspaceInvitation[]> {
  return (await call<{ invitations: WorkspaceInvitation[] }>('/sent')).invitations;
}

export async function sendInvitation(inviteeId: string, note?: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>('/invitations', json('POST', { inviteeId, note }))).invitation;
}

/** Invites an address that has no account yet: they are emailed a link and join once they sign up with that address. */
export async function sendInvitationByEmail(email: string, note?: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>('/invitations', json('POST', { email: email.trim(), note }))).invitation;
}

/**
 * The public preview of an invitation link, for a signed-in person who may not be the invited address. Null when it
 * cannot be read, so the caller falls back to a plain message rather than a broken screen.
 */
export async function getInvitePreview(id: string): Promise<InvitePreview | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/remote/public/workspace-invitations/${encodeURIComponent(id)}`);
    const body = await res.json();
    return res.ok && body && body.action === 1 ? (body.data as InvitePreview) : null;
  } catch {
    return null;
  }
}

export async function resendInvitation(id: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>(`/invitations/${id}/resend`, json('POST'))).invitation;
}

export async function cancelInvitation(id: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>(`/invitations/${id}`, json('DELETE'))).invitation;
}

export async function revokeMembership(id: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>(`/invitations/${id}/revoke`, json('POST'))).invitation;
}

export async function listReceivedInvitations(): Promise<WorkspaceInvitation[]> {
  return (await call<{ invitations: WorkspaceInvitation[] }>('/received')).invitations;
}

export async function answerInvitation(id: string, accept: boolean): Promise<WorkspaceInvitation> {
  // Two literal calls, so the contract test can see and check both paths.
  const res = accept
    ? await call<{ invitation: WorkspaceInvitation }>(`/received/${id}/accept`, json('POST'))
    : await call<{ invitation: WorkspaceInvitation }>(`/received/${id}/decline`, json('POST'));
  return res.invitation;
}

export async function leaveWorkspace(invitationId: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>(`/received/${invitationId}/leave`, json('POST'))).invitation;
}

export async function listMyWorkspaces(): Promise<WorkspaceMembership[]> {
  return (await call<{ workspaces: WorkspaceMembership[] }>('/mine')).workspaces;
}
