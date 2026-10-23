import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ shared: false }));

vi.mock('../../components/sidebar', () => ({ default: () => null }));
vi.mock('../../components/topbar', () => ({ default: () => null }));
vi.mock('../../components/WalletPanel', () => ({ default: ({ title }: { title: string }) => <section data-testid="overview">{title}: balance 120.50</section> }));
vi.mock('../../components/WalletMovementsTable', () => ({ default: () => <section data-testid="activity">Activity: SECRET-LEDGER-ENTRY</section> }));
vi.mock('../../components/WithdrawModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="withdraw-modal" /> : <span data-testid="withdraw-mounted" />) }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => ({ colors: { textPrimary: '#000', textSecondary: '#555' }, actualTheme: 'light' }) }));
vi.mock('../../providers/AuthProvider', () => ({ useDashboardAuth: () => ({ user: { firstName: 'Eric' } }) }));
vi.mock('@/app/lib/usePermissions', () => ({ Can: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/walletApi', () => ({ getMyWallet: vi.fn(async () => ({ status: 'ACTIVE', balanceAvailable: 120.5 })) }));
vi.mock('../../providers/WorkspaceProvider', () => ({
  useWorkspace: () => ({ isShared: state.shared, active: state.shared ? { owner: { name: 'Aline Uwase' } } : null }),
}));

import PhotographerWalletPage from './wallet';

/**
 * The Wallet page is one of the places money and its restrictions are tangled together: in a workspace the photographer
 * was invited to, the balance overview stays, and only withdrawing and the activity (transaction) list are left out.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
const mount = async () => {
  await act(async () => { root.render(<PhotographerWalletPage />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
};

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

describe('photographer wallet page', () => {
  it('shows the owner everything: overview, withdraw button and activity', async () => {
    await mount();
    expect(host.querySelector('[data-testid="overview"]')?.textContent).toContain('My earnings');
    expect(host.querySelector('[data-testid="activity"]')).not.toBeNull();
    expect(host.textContent).toContain('Withdraw funds');
    expect(host.querySelector('[data-testid="withdraw-mounted"]')).not.toBeNull();
  });

  it('shows a collaborator the balance overview but no withdraw button, no withdraw dialog and no activity list', async () => {
    state.shared = true;
    await mount();
    expect(host.querySelector('[data-testid="overview"]')?.textContent).toContain('Workspace earnings');
    expect(host.textContent).toContain("Aline Uwase's earnings, tips and bonuses");
    expect(host.querySelector('[data-testid="activity"]')).toBeNull();
    expect(host.textContent).not.toContain('SECRET-LEDGER-ENTRY');
    expect(host.textContent).not.toContain('Withdraw funds');
    expect(host.querySelector('[data-testid="withdraw-mounted"]')).toBeNull();
    expect(host.textContent).toContain('Withdrawals and the transaction history stay with the workspace owner');
  });
});
