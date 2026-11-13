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
/**
 * The same choice as a cookie. The sign-in site hands a workspace to this app in the URL, and the edge proxy (which cannot
 * read localStorage) must know a workspace was chosen to let a collaborator or client login reach the photographer pages
 * for it. The cookie decides nothing about access: the server checks a live membership on every call.
 */
export const WORKSPACE_COOKIE = 'ckws';
const UUID = /^[0-9a-f-]{36}$/i;

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + WORKSPACE_COOKIE + '=([^;]*)'));
  return m && UUID.test(m[1]) ? m[1] : null;
}

function writeCookie(id: string | null): void {
  if (typeof document === 'undefined') return;
  document.cookie = id
    ? `${WORKSPACE_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
    : `${WORKSPACE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** The workspace the user chose, or null for their own. */
export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromCookie = readCookie();
  if (fromCookie) return fromCookie;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && UUID.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function setActiveWorkspaceId(id: string | null): void {
  if (typeof window === 'undefined') return;
  writeCookie(id);
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage disabled: the cookie still carries the choice */
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
  '/api/remote/photographer/workspaces',
  // The collaborator picker and the login's own profile: they run as the signed-in person, never inside a workspace.
  '/api/remote/collaborator',
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
 * Pages of the photographer area that are not available while working in someone else's workspace: the transaction
 * history and payroll, donating, the owner's account settings, and managing who else is invited. The Wallet page IS
 * available (its overview shows the balance); its withdraw button and activity list are left out of it. The server
 * refuses the matching calls regardless; this keeps the menus and routes honest.
 */
export const SHARED_BLOCKED_PREFIXES = [
  '/user/photographer/transaction',
  '/user/photographer/all-transactions',
  '/user/photographer/payroll-report',
  '/user/photographer/donate',
  '/user/photographer/preferences',
  '/user/photographer/profile',
  '/user/photographer/collaborate',
];

/**
 * Added for a workspace collaborator (every invitation made now): the wallet is not part of their workspace at all, not
 * even the balance overview an older photographer member still gets.
 */
export const COLLABORATOR_BLOCKED_PREFIXES = ['/user/photographer/wallet'];

export function isBlockedInSharedWorkspace(pathname: string | null | undefined, collaborator = false): boolean {
  if (!pathname) return false;
  const blocked = collaborator ? [...SHARED_BLOCKED_PREFIXES, ...COLLABORATOR_BLOCKED_PREFIXES] : SHARED_BLOCKED_PREFIXES;
  return blocked.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/** What the server says a member may do in a workspace. Fixed by the policy; shown, never trusted. */
export interface WorkspaceAccess {
  business: boolean;
  financial: boolean;
  ownerAccount: boolean;
  manageMembers: boolean;
}
