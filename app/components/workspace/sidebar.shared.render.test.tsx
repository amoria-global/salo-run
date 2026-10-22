import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ shared: false, pathname: '/user/photographer/dashboard' }));

vi.mock('next/navigation', () => ({ usePathname: () => state.pathname, useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('../../providers/AuthProvider', () => ({
  dashboardAuthFetch: vi.fn(async () => new Response(JSON.stringify({ action: 1, data: 0 }), { status: 200 })),
  useDashboardAuth: () => ({ user: { id: 'u1', customerType: 'PHOTOGRAPHER', profileReviewStatus: 'ACCEPTED' }, logout: vi.fn() }),
}));
vi.mock('../../lib/usePermissions', () => ({ usePermissions: () => ({ loading: false, isOwner: true, hasAny: () => true, hasPermission: () => true }) }));
vi.mock('../../providers/WorkspaceProvider', () => ({
  useWorkspace: () => ({ workspaces: [], active: null, isShared: state.shared, loading: false, switchTo: vi.fn(), refresh: async () => {} }),
}));
vi.mock('@/app/providers/WorkspaceProvider', () => ({
  useWorkspace: () => ({ workspaces: [], active: null, isShared: state.shared, loading: false, switchTo: vi.fn(), refresh: async () => {} }),
}));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', getLandingUrl: () => 'https://landing.test', normalizeImageUrl: (u: string) => u }));

import Sidebar from '../sidebar';

/**
 * The menu in a shared workspace offers only what the server lets a collaborator do: no wallet, transactions,
 * donate, notifications, inbox, collaborate, profile or preferences. Opportunities stay. The owner's own menu is whole.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
const links = () => Array.from(host.querySelectorAll('a')).map((a) => (a.textContent || '').trim());

beforeEach(() => {
  state.shared = false;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('photographer sidebar', () => {
  it('offers the whole menu in the photographer own workspace', async () => {
    await act(async () => root.render(<Sidebar />));
    const l = links();
    for (const name of ['Home', 'Events', 'Clients', 'Wallet', 'Transactions', 'Collaborate', 'Notifications']) expect(l.join('|')).toContain(name);
  });

  it('offers only the work pages in a shared workspace', async () => {
    state.shared = true;
    await act(async () => root.render(<Sidebar />));
    const l = links().join('|');
    for (const name of ['Home', 'Events', 'Opportunities', 'Clients']) expect(l).toContain(name);
    for (const name of ['Wallet', 'Transactions', 'Donate', 'Notifications', 'Inbox', 'Collaborate', 'Profile', 'Preferences']) {
      expect(l, name).not.toContain(name);
    }
    expect(Array.from(host.querySelectorAll('a')).some((a) => /wallet|transaction|payroll/.test(a.getAttribute('href') || ''))).toBe(false);
  });
});
