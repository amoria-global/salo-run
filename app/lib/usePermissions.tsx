'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { dashboardAuthFetch, useDashboardAuth } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

/**
 * RBAC permission context — fetched once per login from
 * GET /api/remote/team/me/permissions and cached for the session.
 *
 * Shape mirrors TeamController.mePermissions:
 *   { isOwner, organizationId, organizationName, roleId, roleName, permissions[] }
 *
 * Owners get every permission name in the registry from the backend;
 * team members get just what their role grants. Use the {@link Can}
 * component or the {@link hasPermission} returned by {@link usePermissions}
 * to gate UI elements.
 */
export interface PermissionContextValue {
  loading: boolean;
  isOwner: boolean;
  organizationId: string | null;
  organizationName: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: Set<string>;
  /** True iff the backend says this user must change their password
   *  before they can use the dashboard. Set by the invite flow on
   *  team members (TeamService.inviteTeamMember sets
   *  isPasswordChanged=false) and cleared by /set-new-password. */
  mustChangePassword: boolean;
  hasPermission: (perm: string) => boolean;
  hasAny: (perms: string[]) => boolean;
  hasAll: (perms: string[]) => boolean;
  refresh: () => Promise<void>;
}

const defaultCtx: PermissionContextValue = {
  loading: true,
  isOwner: false,
  organizationId: null,
  organizationName: null,
  roleId: null,
  roleName: null,
  permissions: new Set(),
  mustChangePassword: false,
  hasPermission: () => false,
  hasAny: () => false,
  hasAll: () => false,
  refresh: async () => {},
};

const PermissionContext = createContext<PermissionContextValue>(defaultCtx);

interface MePermsResponse {
  action?: number;
  data?: {
    isOwner?: boolean;
    organizationId?: string | null;
    organizationName?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    permissions?: string[];
    mustChangePassword?: boolean;
  };
}

// Cache key namespace + TTL. Stored in localStorage scoped by user.id so a
// browser shared across two team members never bleeds permissions between
// sessions. TTL is short — long enough to kill the initial-paint flash for
// returning users, short enough that a role-permission edit by the owner
// propagates to the team member within minutes (without that team member
// having to log out + back in).
const CACHE_KEY_PREFIX = 'connekyt:perms:';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedSnapshot {
  isOwner: boolean;
  organizationId: string | null;
  organizationName: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
  mustChangePassword?: boolean;
  ts: number;
}

function readCache(userId: string | null | undefined): CachedSnapshot | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSnapshot;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(userId: string | null | undefined, snap: Omit<CachedSnapshot, 'ts'>) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(CACHE_KEY_PREFIX + userId, JSON.stringify({ ...snap, ts: Date.now() }));
  } catch { /* quota or disabled — silent */ }
}

/**
 * Drop this near the root of every dashboard layout so child pages
 * can read permissions via {@link usePermissions} / {@link Can}.
 * Re-fetches when the authenticated user changes (login/logout/refresh).
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useDashboardAuth();
  // Seed from localStorage cache so sidebar/RouteGuard render with the
  // correct permission set on the very first paint (no flash of either
  // restricted items or missing items). Stale-while-revalidate: the
  // fetchPerms() below always re-runs and refreshes the state + cache.
  const [state, setState] = useState<PermissionContextValue>(() => {
    if (typeof window === 'undefined') return defaultCtx;
    const cached = readCache(user?.id ?? null);
    if (!cached) return defaultCtx;
    const perms = new Set<string>(cached.permissions);
    return {
      loading: false,
      isOwner: cached.isOwner,
      organizationId: cached.organizationId,
      organizationName: cached.organizationName,
      roleId: cached.roleId,
      roleName: cached.roleName,
      permissions: perms,
      mustChangePassword: !!cached.mustChangePassword,
      hasPermission: (p: string) => perms.has(p),
      hasAny: (ps: string[]) => ps.some(p => perms.has(p)),
      hasAll: (ps: string[]) => ps.every(p => perms.has(p)),
      refresh: async () => {},
    };
  });
  const inFlight = useRef(false);

  const fetchPerms = useCallback(async () => {
    if (inFlight.current) return;
    if (!isAuthenticated) {
      setState(s => ({ ...s, loading: false, permissions: new Set() }));
      return;
    }
    inFlight.current = true;
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/team/me/permissions`);
      if (!res.ok) {
        // 401 or 403 — caller may not have a Customer session (e.g. SysUser).
        // Fail closed: empty permission set, hasPermission() always false.
        setState({
          ...defaultCtx, loading: false,
          hasPermission: () => false, hasAny: () => false, hasAll: () => false,
          refresh: fetchPerms,
        });
        return;
      }
      const json: MePermsResponse = await res.json();
      const d = json.data || {};
      const perms = new Set<string>(Array.isArray(d.permissions) ? d.permissions : []);
      const snap = {
        isOwner: !!d.isOwner,
        organizationId: d.organizationId ?? null,
        organizationName: d.organizationName ?? null,
        roleId: d.roleId ?? null,
        roleName: d.roleName ?? null,
        permissions: Array.from(perms),
        mustChangePassword: !!d.mustChangePassword,
      };
      writeCache(user?.id ?? null, snap);
      setState({
        loading: false,
        ...snap,
        permissions: perms,
        hasPermission: (p: string) => perms.has(p),
        hasAny: (ps: string[]) => ps.some(p => perms.has(p)),
        hasAll: (ps: string[]) => ps.every(p => perms.has(p)),
        refresh: fetchPerms,
      });
    } catch {
      setState({
        ...defaultCtx, loading: false,
        hasPermission: () => false, hasAny: () => false, hasAll: () => false,
        refresh: fetchPerms,
      });
    } finally {
      inFlight.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  useEffect(() => { void fetchPerms(); }, [fetchPerms]);

  const value = useMemo(() => ({ ...state, refresh: fetchPerms }), [state, fetchPerms]);
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  return useContext(PermissionContext);
}

/**
 * Convenience render-gate. Renders children iff the caller has the
 * required permission(s). Pass `any` to require ONE of N; pass
 * `permission` to require exactly one; pass `all` to require every
 * one of N. While permissions are loading the fallback is shown,
 * not the children — fail-closed by default.
 */
interface CanProps {
  permission?: string;
  any?: string[];
  all?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
export function Can({ permission, any, all, fallback = null, children }: CanProps) {
  const { loading, hasPermission, hasAny, hasAll } = usePermissions();
  if (loading) return <>{fallback}</>;
  let ok = true;
  if (permission && !hasPermission(permission)) ok = false;
  if (ok && any && !hasAny(any)) ok = false;
  if (ok && all && !hasAll(all)) ok = false;
  return <>{ok ? children : fallback}</>;
}
