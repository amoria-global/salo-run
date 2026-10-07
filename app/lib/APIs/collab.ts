/**
 * Album collaboration API client, wraps /api/remote/photographer/collab/*.
 *
 * Replaces the retired Team client. An album owner invites fellow
 * photographers with a link; collaborators submit photos; the owner
 * approves each one into the album or rejects it. The backend answers
 * {action, data, message}; action 0 is a failure even on HTTP 200, so every
 * helper throws the backend's message for the caller to show.
 */

import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type InviteState = 'OPEN' | 'OWNER' | 'ALREADY_MEMBER' | 'REMOVED' | 'REVOKED' | 'EXPIRED';

export interface Person {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface CollabAlbum {
  id: string;
  title: string;
  albumType?: string | null;
  coverImage?: string | null;
  imageCount: number;
  createdAt?: string | null;
}

export interface OwnedAlbum extends CollabAlbum {
  collaboratorCount: number;
  pendingCount: number;
}

export interface JoinedAlbum extends CollabAlbum {
  owner: Person;
  joinedAt?: string | null;
  counts: { pending: number; approved: number; rejected: number };
}

export interface Invite {
  id: string;
  token: string;
  link: string;
  note?: string | null;
  expiresAt: string;
  createdAt?: string | null;
  /** Photographers who joined through this link and are still collaborating. */
  joinedCount: number;
}

export interface Collaborator extends Person {
  membershipId: string;
  joinedAt?: string | null;
}

export interface Submission {
  id: string;
  albumId: string;
  imageUrl: string | null;
  thumbnailUrl?: string | null;
  originalUrl?: string | null;
  caption?: string | null;
  status: SubmissionStatus;
  reviewNote?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  collaborator: Person;
}

export interface OwnedAlbumDetail {
  album: CollabAlbum;
  collaborators: Collaborator[];
  invites: Invite[];
  submissions: Submission[];
}

export interface JoinedAlbumDetail {
  album: CollabAlbum;
  owner: Person;
  submissions: Submission[];
}

export interface InvitePreview {
  album: CollabAlbum;
  owner: Person;
  state: InviteState;
  expiresAt: string;
}

export interface ReviewResult {
  reviewed: string[];
  skipped: string[];
  duplicates: string[];
  status: SubmissionStatus;
}

const base = () => `${getApiUrl()}/api/remote/photographer/collab`;

async function unwrap<T>(res: Response): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok || body.action === 0) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body.data as T;
}

function json(method: string, payload?: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  };
}

// ─── Owner ───

export async function listOwnedAlbums(): Promise<OwnedAlbum[]> {
  const data = await unwrap<{ albums: OwnedAlbum[] }>(await dashboardAuthFetch(`${base()}/albums`));
  return data.albums;
}

export async function getOwnedAlbum(albumId: string): Promise<OwnedAlbumDetail> {
  return unwrap(await dashboardAuthFetch(`${base()}/albums/${albumId}`));
}

export async function createInvite(albumId: string, note?: string): Promise<Invite> {
  const data = await unwrap<{ invite: Invite }>(
    await dashboardAuthFetch(`${base()}/albums/${albumId}/invites`, json('POST', { note: note || null })),
  );
  return data.invite;
}

/** Removes a collaborator from the album. */
export async function removeCollaborator(membershipId: string): Promise<void> {
  await unwrap(await dashboardAuthFetch(`${base()}/members/${membershipId}`, { method: 'DELETE' }));
}

/** Cancels an invite link. Photographers who already joined through it stay. */
export async function cancelInvite(inviteId: string): Promise<void> {
  await unwrap(await dashboardAuthFetch(`${base()}/links/${inviteId}`, { method: 'DELETE' }));
}

export async function reviewSubmissions(
  ids: string[], decision: 'APPROVE' | 'REJECT', note?: string,
): Promise<ReviewResult> {
  return unwrap(await dashboardAuthFetch(`${base()}/submissions/review`, json('POST', { ids, decision, note: note || null })));
}

// ─── Collaborator ───

export async function previewInvite(token: string): Promise<InvitePreview> {
  return unwrap(await dashboardAuthFetch(`${base()}/invites/${encodeURIComponent(token)}`));
}

export async function acceptInvite(token: string): Promise<CollabAlbum & { owner: Person }> {
  const data = await unwrap<{ album: CollabAlbum & { owner: Person } }>(
    await dashboardAuthFetch(`${base()}/invites/${encodeURIComponent(token)}/accept`, { method: 'POST' }),
  );
  return data.album;
}

export async function listJoinedAlbums(): Promise<JoinedAlbum[]> {
  const data = await unwrap<{ albums: JoinedAlbum[] }>(await dashboardAuthFetch(`${base()}/joined`));
  return data.albums;
}

export async function getJoinedAlbum(albumId: string): Promise<JoinedAlbumDetail> {
  return unwrap(await dashboardAuthFetch(`${base()}/joined/${albumId}`));
}

export async function submitPhoto(albumId: string, file: File, caption?: string): Promise<Submission> {
  const form = new FormData();
  form.append('file', file);
  if (caption) form.append('caption', caption);
  const data = await unwrap<{ submission: Submission }>(
    await dashboardAuthFetch(`${base()}/joined/${albumId}/submissions`, { method: 'POST', body: form }),
  );
  return data.submission;
}

export async function withdrawSubmission(submissionId: string): Promise<void> {
  await unwrap(await dashboardAuthFetch(`${base()}/submissions/${submissionId}`, { method: 'DELETE' }));
}

export async function leaveAlbum(albumId: string): Promise<void> {
  await unwrap(await dashboardAuthFetch(`${base()}/joined/${albumId}/leave`, { method: 'POST' }));
}

export { tokenFromInput } from '../collabLink';
