'use client';

import React from 'react';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

/**
 * A slim bar on every page while the photographer is working inside someone else's workspace, so nobody acts on the
 * wrong photographer's records without knowing it. Always offers the way back to their own workspace.
 */
export default function WorkspaceBanner() {
  const { isShared, active, switchTo } = useWorkspace();
  if (!isShared) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-[#083A85]/20 bg-[#083A85]/10 px-4 py-2 text-sm text-[var(--ck-text)] sm:px-6">
      <span>
        <i className="bi bi-person-workspace mr-2 text-[#083A85]" aria-hidden />
        Working in <strong>{active ? `${active.owner.name}'s workspace` : 'a shared workspace'}</strong>. Your own account and wallet are separate.
      </span>
      <button type="button" onClick={() => switchTo(null)}
        className="rounded-full border border-[#083A85] px-3 py-1 text-xs font-semibold text-[#083A85] hover:bg-[#083A85] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]">
        Back to my workspace
      </button>
    </div>
  );
}
