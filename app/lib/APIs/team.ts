/**
 * Team / RBAC API client — wraps /api/remote/team/*.
 *
 * All calls go through dashboardAuthFetch so the bearer + amoria_auth
 * cookie are attached. Backend returns {action, data, message}. These
 * helpers unwrap data + propagate the typed shape; on action=0 they
 * throw an Error with the backend's message so callers can
 * try/catch + setError(e.message).
 */

import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export interface RoleDto {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface MemberDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  active: boolean;
  role: { id: string; name: string } | null;
  invitedAt?: string | null;
  lastLogin?: string | null;
}

export interface PermissionCatalog {
  categories: Record<string, Array<{ name: string; description: string }>>;
  total: number;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  // Backend convention: {action: 0|1, data?, message?}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = body;
  if (!res.ok || b.action === 0) {
    throw new Error(b.message || `Request failed (${res.status})`);
  }
  return b.data as T;
}

// ─── Permissions catalog ───
export async function listPermissions(): Promise<PermissionCatalog> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/permissions`);
  return jsonOrThrow<PermissionCatalog>(res);
}

// ─── Roles ───
export async function listRoles(): Promise<{ roles: RoleDto[]; total: number }> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/roles`);
  return jsonOrThrow(res);
}

export async function createRole(input: {
  name: string; description?: string; permissions: string[];
}): Promise<{ role: RoleDto }> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow(res);
}

export async function updateRole(roleId: string, input: {
  name?: string; description?: string; permissions?: string[];
}): Promise<{ role: RoleDto }> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/roles/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow(res);
}

export async function deleteRole(roleId: string): Promise<void> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/roles/${roleId}`, {
    method: 'DELETE',
  });
  await jsonOrThrow(res);
}

// ─── Team members ───
export async function listMembers(): Promise<{ users: MemberDto[]; total: number }> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/users`);
  return jsonOrThrow(res);
}

export async function inviteMember(input: {
  email: string; firstName: string; lastName: string;
  roleId?: string | null; department?: string;
}): Promise<{ user: MemberDto; invited: boolean }> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow(res);
}

export async function updateMember(memberId: string, input: {
  roleId?: string; department?: string; active?: boolean;
}): Promise<{ user: MemberDto }> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/users/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow(res);
}

export async function setMemberActive(memberId: string, active: boolean): Promise<void> {
  const apiUrl = getApiUrl();
  const path = active ? 'activate' : 'deactivate';
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/users/${memberId}/${path}`, {
    method: 'POST',
  });
  await jsonOrThrow(res);
}

export async function removeMember(memberId: string): Promise<void> {
  const apiUrl = getApiUrl();
  const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/users/${memberId}`, {
    method: 'DELETE',
  });
  await jsonOrThrow(res);
}
