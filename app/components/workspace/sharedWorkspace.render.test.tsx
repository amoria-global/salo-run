import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  pathname: '/user/photographer/dashboard',
  shared: false,
  active: null as null | { workspaceId: string; owner: { id: string; name: string; profilePicture: null } },
  replace: vi.fn(),
  switchTo: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('@/app/providers/WorkspaceProvider', () => ({
  useWorkspace: () => ({ workspaces: state.active ? [state.active] : [], active: state.active, isShared: state.shared, loading: false, switchTo: state.switchTo, refresh: async () => {} }),
}));
vi.mock('../../providers/WorkspaceProvider', () => ({
  useWorkspace: () => ({ workspaces: state.active ? [state.active] : [], active: state.active, isShared: state.shared, loading: false, switchTo: state.switchTo, refresh: async () => {} }),
}));
vi.mock('../../lib/usePermissions', () => ({
  usePermissions: () => ({ loading: false, isOwner: true, hasAny: () => true, hasPermission: () => true, roleName: 'Owner', organizationName: null }),
}));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: vi.fn(), useDashboardAuth: () => ({ user: { id: 'u1', customerType: 'PHOTOGRAPHER' } }) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', normalizeImageUrl: (u: string) => u }));

import RouteGuard from '../RouteGuard';
import WorkspaceBanner from './WorkspaceBanner';
import WorkspaceSwitcher from './WorkspaceSwitcher';

/**
 * Inside someone else's workspace the wallet and transaction pages are not part of the app: the route guard sends the
 * user away from them, and the banner always says whose workspace this is.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = { workspaceId: 'o1', owner: { id: 'o1', name: 'Aline Uwase', profilePicture: null } };
let host: HTMLDivElement;
let root: Root;
const render = async (el: React.ReactElement) => {
  await act(async () => {
    root.render(el);
  });
};

beforeEach(() => {
  state.pathname = '/user/photographer/dashboard';
  state.shared = false;
  state.active = null;
  state.replace.mockReset();
  state.switchTo.mockReset();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('route guard in a shared workspace', () => {
  it('sends the user away from every money, account and notification page', async () => {
    state.shared = true;
    state.active = OWNER;
    for (const p of ['wallet', 'transaction', 'all-transactions', 'payroll-report', 'preferences', 'profile', 'notifications', 'collaborate', 'donate']) {
      state.replace.mockReset();
      state.pathname = `/user/photographer/${p}`;
      await render(<RouteGuard><div>page</div></RouteGuard>);
      expect(state.replace, p).toHaveBeenCalledWith(expect.stringContaining('/user/not-authorized?required=workspace'));
    }
  });

  it('lets the work pages open', async () => {
    state.shared = true;
    for (const p of ['dashboard', 'events', 'clients']) {
      state.replace.mockReset();
      state.pathname = `/user/photographer/${p}`;
      await render(<RouteGuard><div>page</div></RouteGuard>);
      expect(state.replace, p).not.toHaveBeenCalled();
    }
  });

  it('keeps the wallet open in the photographer own workspace', async () => {
    state.pathname = '/user/photographer/wallet';
    await render(<RouteGuard><div>wallet</div></RouteGuard>);
    expect(state.replace).not.toHaveBeenCalled();
    expect(host.textContent).toContain('wallet');
  });
});

describe('workspace banner and switcher', () => {
  it('shows nothing in the own workspace', async () => {
    await render(<WorkspaceBanner />);
    expect(host.textContent).toBe('');
  });

  it('names the owner and offers the way back', async () => {
    state.shared = true;
    state.active = OWNER;
    await render(<WorkspaceBanner />);
    expect(host.textContent).toContain("Aline Uwase's workspace");
    expect(host.textContent).toContain('Your own account and wallet are separate');
    await act(async () => {
      (host.querySelector('button') as HTMLButtonElement).click();
    });
    expect(state.switchTo).toHaveBeenCalledWith(null);
  });

  it('is invisible to a photographer who was never invited anywhere', async () => {
    await render(<WorkspaceSwitcher />);
    expect(host.textContent).toBe('');
  });

  it('lets an invited photographer choose between their own and the shared workspace', async () => {
    state.active = OWNER;
    await render(<WorkspaceSwitcher />);
    const select = host.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(['My workspace', "Aline Uwase's workspace"]);
    await act(async () => {
      select.value = 'o1';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(state.switchTo).toHaveBeenCalledWith('o1');
  });
});
