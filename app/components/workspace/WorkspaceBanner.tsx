'use client';

import React from 'react';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';

/**
 * A slim bar on every page while someone is working inside another person's workspace, so nobody acts on the wrong
 * business's records without knowing it: "You're working in <Owner>'s workspace". A login with a business of its own is
 * offered the way back to it; a collaborator login has none, so it is offered the workspace picker instead.
 */
export default function WorkspaceBanner() {
  const { isShared, active, isCollaborator, hasOwnWorkspace, switchTo } = useWorkspace();
  if (!isShared) return null;
  const name = active ? `${active.owner.name}'s workspace` : 'a shared workspace';
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-[#083A85]/20 bg-[#083A85]/10 px-4 py-2 text-sm text-[var(--ck-text)] sm:px-6">
      <span>
        <i className="bi bi-person-workspace mr-2 text-[#083A85]" aria-hidden />
        You&apos;re working in <strong>{name}</strong>.{' '}
        {isCollaborator
          ? 'Money, the wallet and account settings stay with the owner.'
          : 'Your own account and wallet are separate.'}
      </span>
      <button type="button" onClick={() => switchTo(null)}
        className="rounded-full border border-[#083A85] px-3 py-1 text-xs font-semibold text-[#083A85] hover:bg-[#083A85] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#083A85]">
        {hasOwnWorkspace ? 'Back to my workspace' : 'Switch workspace'}
      </button>
    </div>
  );
}
