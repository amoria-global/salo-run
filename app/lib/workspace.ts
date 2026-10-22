/**
 * Which workspace the photographer is working in, and what that means for the app.
 *
 * A photographer can be invited to work inside another photographer's workspace. The server decides what that
 * allows (the backend refuses money and owner-account operations itself, from a live membership, on every request).
 * This module only keeps the dashboard honest about it: it remembers the chosen workspace, adds it to the calls that
 * belong to it, and lists the pages that make no sense there so they are hidden instead of failing.
 *
 * Nothing here grants anything. A stale or forged value in storage is answered with a refusal by the server, and
 * {@link WORKSPACE_LOST_EVENT} then sends the user back to their own workspace.
 */

export const WORKSPACE_HEADER = 'X-Workspace-Id';
export const WORKSPACE_LOST_EVENT = 'ck:workspace-lost';
export const WORKSPACE_CHANGED_EVENT = 'ck:workspace-changed';

/** The server's refusal for "not a member" and "no such workspace". Both read the same on purpose. */
export const WORKSPACE_NOT_AVAILABLE = 'Workspace access is not available';

const STORAGE_KEY = 'connekyt:workspace';

/** The workspace the user chose, or null for their own. */
export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && /^[0-9a-f-]{36}$/i.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function setActiveWorkspaceId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage disabled: the user simply stays in their own workspace */
  }
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
}

/**
 * Calls that are about the signed-in person, not the workspace, so they never carry the workspace header: sign-in,
 * their own profile and security, their own notifications and permissions, and the invitation endpoints themselves.
 */
const PERSONAL_PATHS = [
  '/api/remote/auth/',
  '/api/remote/public/',
  '/api/remote/customer/profile',
  '/api/remote/customer/kyc',
  '/api/remote/customer/totp',
  '/api/remote/customer/notifications',
  '/api/remote/photographer/notifications',
  '/api/remote/photographer/workspaces',
  '/api/remote/photographer/profile-summary',
  '/api/remote/photographer/pending-changes',
  '/api/remote/photographer/update-important-details',
  '/api/remote/photographer/submit-profile',
  '/api/remote/team/',
];

export function isPersonalCall(url: string): boolean {
  let path = url;
  try {
    path = new URL(url, 'https://x.invalid').pathname;
  } catch {
    /* a bare path */
  }
  const i = path.indexOf('/api/remote/');
  const rest = i >= 0 ? path.slice(i) : path;
  return PERSONAL_PATHS.some((p) => rest.startsWith(p));
}

/** The header to add to a call, if the call belongs to the active workspace. */
export function workspaceHeaders(url: string, workspaceId: string | null = getActiveWorkspaceId()): Record<string, string> {
  if (!workspaceId || isPersonalCall(url)) return {};
  return { [WORKSPACE_HEADER]: workspaceId };
}

/**
 * Pages of the photographer area that are not available while working in someone else's workspace: everything about
 * money, the owner's account and notifications, and managing who else is invited. The server refuses the matching
 * calls regardless; this keeps the menus and routes honest.
 */
export const SHARED_BLOCKED_PREFIXES = [
  '/user/photographer/wallet',
  '/user/photographer/transaction',
  '/user/photographer/all-transactions',
  '/user/photographer/payroll-report',
  '/user/photographer/donate',
  '/user/photographer/preferences',
  '/user/photographer/profile',
  '/user/photographer/notifications',
  '/user/photographer/collaborate',
];

export function isBlockedInSharedWorkspace(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return SHARED_BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** What the server says a member may do in a workspace. Fixed by the policy; shown, never trusted. */
export interface WorkspaceAccess {
  business: boolean;
  financial: boolean;
  ownerAccount: boolean;
  manageMembers: boolean;
}
