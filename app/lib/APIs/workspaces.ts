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

export interface WorkspaceInvitation {
  id: string;
  status: InvitationStatus;
  owner: WorkspacePerson;
  invitee: WorkspacePerson;
  note?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  respondedAt?: string | null;
  endedAt?: string | null;
  /** How the invitee is told. Always "in_app": nothing is emailed. */
  delivery?: string;
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

export async function lookupPhotographer(email: string): Promise<WorkspacePerson> {
  const d = await call<{ photographer: WorkspacePerson }>(`/lookup?email=${encodeURIComponent(email.trim())}`);
  return d.photographer;
}

export async function listSentInvitations(): Promise<WorkspaceInvitation[]> {
  return (await call<{ invitations: WorkspaceInvitation[] }>('/sent')).invitations;
}

export async function sendInvitation(inviteeId: string, note?: string): Promise<WorkspaceInvitation> {
  return (await call<{ invitation: WorkspaceInvitation }>('/invitations', json('POST', { inviteeId, note }))).invitation;
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
