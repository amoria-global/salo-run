'use client';

import React from 'react';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

/**
 * Chooses between the photographer's own workspace and the ones they were invited to. Shown only when there is
 * something to choose, so most photographers never see it. Switching reloads the dashboard, so nothing from one
 * workspace can linger in the other.
 */
export default function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const { workspaces, active, isShared, switchTo } = useWorkspace();
  if (workspaces.length === 0 && !isShared) return null;

  const value = active?.workspaceId ?? (isShared ? 'loading' : 'own');

  return (
    <div style={{ padding: compact ? '8px 12px' : '10px 14px 0' }}>
      <label
        htmlFor="ck-workspace-select"
        style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--ck-text-soft)', marginBottom: 4 }}
      >
        Workspace
      </label>
      <select
        id="ck-workspace-select"
        value={value}
        onChange={(e) => switchTo(e.target.value === 'own' ? null : e.target.value)}
        style={{
          width: '100%', padding: '8px 10px', fontSize: 13.5, fontWeight: 600, borderRadius: 10,
          border: '1px solid var(--ck-stroke)', background: 'var(--ck-surface)', color: 'var(--ck-text)', cursor: 'pointer',
        }}
      >
        <option value="own">My workspace</option>
        {isShared && !active && <option value="loading" disabled>Shared workspace</option>}
        {workspaces.map((w) => (
          <option key={w.workspaceId} value={w.workspaceId}>{w.owner.name}&apos;s workspace</option>
        ))}
      </select>
    </div>
  );
}
