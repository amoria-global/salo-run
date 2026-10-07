"use client";

import React from 'react';
import Sidebar from '../sidebar';
import Topbar from '../topbar';

/**
 * Standard dashboard frame (sidebar + topbar + scrolling main) for the
 * collaborate routes, matching what the other photographer pages render, so
 * the sidebar navigation stays available on every collaborate screen.
 */
export default function CollabShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="collab-shell">
      <style>{`
        .collab-shell { display: flex; height: 100vh; width: 100%; max-width: 100vw; overflow: hidden; background: #f3f4f6; }
        .collab-shell-content { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
        .collab-shell-main { flex: 1; overflow-y: auto; }
        @media (max-width: 768px) { .collab-shell-main { padding-bottom: 8rem; } }
      `}</style>
      <Sidebar />
      <div className="collab-shell-content">
        <Topbar userRole="photographer" />
        <div className="collab-shell-main">{children}</div>
      </div>
    </div>
  );
}
