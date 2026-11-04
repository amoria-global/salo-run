'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDashboardAuth } from './AuthProvider';
import { listMyWorkspaces, type WorkspaceMembership } from '../lib/APIs/workspaces';
import {
  WORKSPACE_CHANGED_EVENT,
  WORKSPACE_LOST_EVENT,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from '../lib/workspace';

/**
 * The workspace context: the person's own business, or a workspace they were invited to.
 *
 * `isShared` is true as soon as a workspace other than their own is selected, even before the list of memberships
 * has loaded, so money pages never flash while it does. Switching reloads the page on purpose: nothing from one
 * workspace (state, caches, half-loaded lists) can then show up in the other.
 *
 * `isCollaborator` is true for a workspace collaborator: a private login that exists only to work in workspaces (its
 * customer type says so, so it is known before the list loads), or any login working in a workspace it joined as a
 * collaborator. A collaborator has no wallet at all; an older photographer member still sees the balance overview.
 */
export interface WorkspaceContextValue {
  /** The memberships the person can switch into. Empty for most people. */
  workspaces: WorkspaceMembership[];
  /** The selected shared workspace, when its details have loaded. */
  active: WorkspaceMembership | null;
  /** A workspace other than their own is selected. */
  isShared: boolean;
  /** Working as a workspace collaborator: no wallet, balance or money figures. */
  isCollaborator: boolean;
  /** A collaborator login has no business of its own to go back to. */
  hasOwnWorkspace: boolean;
  loading: boolean;
  /** Switch to a workspace id, or null for their own. Reloads the dashboard home. */
  switchTo: (id: string | null) => void;
  refresh: () => Promise<void>;
}

const HOME = '/user/photographer/dashboard';

const defaultCtx: WorkspaceContextValue = {
  workspaces: [],
  active: null,
  isShared: false,
  isCollaborator: false,
  hasOwnWorkspace: true,
  loading: false,
  switchTo: () => {},
  refresh: async () => {},
};

const WorkspaceContext = createContext<WorkspaceContextValue>(defaultCtx);

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useDashboardAuth();
  const [activeId, setActiveId] = useState<string | null>(() => getActiveWorkspaceId());
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [loading, setLoading] = useState(false);

  const type = (user?.customerType || '').toUpperCase();
  const isPhotographer = type === 'PHOTOGRAPHER' || type === 'VIDEOGRAPHER';
  const isCollaboratorLogin = type === 'COLLABORATOR';
  // Photographers may have been invited; any login may be working in a workspace it joined; a collaborator always is.
  const mayHaveWorkspaces = isPhotographer || isCollaboratorLogin || activeId !== null;

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !mayHaveWorkspaces) {
      setWorkspaces([]);
      return;
    }
    setLoading(true);
    try {
      const list = await listMyWorkspaces();
      setWorkspaces(list);
      // A selection that is no longer a live membership is dropped: the server would refuse it anyway.
      const stored = getActiveWorkspaceId();
      if (stored && !list.some((w) => w.workspaceId === stored)) {
        setActiveWorkspaceId(null);
        // A collaborator has no business of its own: with nothing left it goes back to choose again.
        if (isCollaboratorLogin && typeof window !== 'undefined') {
          const landing = process.env.NEXT_PUBLIC_LANDING_URL || '';
          window.location.assign(`${landing}/user/workspace/choose`);
        }
      }
    } catch {
      // Could not load the list (offline, server error). Keep what is selected: the server decides on each call.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, mayHaveWorkspaces, isCollaboratorLogin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const sync = () => setActiveId(getActiveWorkspaceId());
    const lost = () => {
      setActiveId(null);
      // Back to their own workspace on a clean page, whatever they were looking at.
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/user/photographer')) {
        // A full load on purpose: nothing from the workspace that was lost may stay in memory.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(HOME);
      }
    };
    window.addEventListener(WORKSPACE_CHANGED_EVENT, sync);
    window.addEventListener(WORKSPACE_LOST_EVENT, lost);
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, sync);
      window.removeEventListener(WORKSPACE_LOST_EVENT, lost);
    };
  }, []);

  const switchTo = useCallback((id: string | null) => {
    setActiveWorkspaceId(id);
    // A collaborator login has no business of its own: leaving a workspace means choosing another on the sign-in site.
    if (id === null && isCollaboratorLogin) {
      const landing = process.env.NEXT_PUBLIC_LANDING_URL || '';
      window.location.assign(`${landing}/user/workspace/choose`);
      return;
    }
    // A full load on purpose: no state or cache from one workspace may show up in the other.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(HOME);
  }, [isCollaboratorLogin]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const active = activeId ? workspaces.find((w) => w.workspaceId === activeId) ?? null : null;
    const isShared = activeId !== null;
    const isCollaborator = isCollaboratorLogin || (isShared && active?.role === 'COLLABORATOR');
    return { workspaces, active, isShared, isCollaborator, hasOwnWorkspace: !isCollaboratorLogin, loading, switchTo, refresh };
  }, [activeId, workspaces, loading, switchTo, refresh, isCollaboratorLogin]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
