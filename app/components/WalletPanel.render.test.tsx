import { readFileSync } from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/providers/AuthProvider', () => ({
  useDashboardAuth: () => ({ isAuthenticated: false }),
  dashboardAuthFetch: vi.fn(),
}));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

import { CurrencyProvider } from '@/app/context/CurrencyContext';
import WalletPanel from './WalletPanel';
import type { WalletDTO } from '@/lib/walletApi';

/**
 * RENDERED components (react-dom in happy-dom, not a real browser): the real
 * WalletPanel, MoneyHero, MoneyStatCards and CurrencyProvider, given the real
 * /wallet/me payloads exported by the backend integration test for a SYNTHETIC
 * 100,000 RWF booking (photographer 95.50, platform 4.50, client 100.00 USD).
 * Only the rates request is faked.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fixture = (name: string): WalletDTO =>
  JSON.parse(readFileSync(path.resolve(__dirname, '../../lib/__fixtures__/backend-contract', name), 'utf8')).data;

const ratesBody = { action: 1, message: 'ok', data: { RWF: { rateToUsd: 1300, rateUpdatedAt: '2026-10-13T08:00:00', symbol: 'RF', name: 'Rwandan Franc' } } };
const idsBody = { action: 1, data: [] };

function mockRates(mode: 'live' | 'failing' | 'not-ok' | 'malformed') {
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = String(url);
    if (mode === 'failing') throw new TypeError('Failed to fetch');
    if (u.endsWith('/currencies/rates')) {
      if (mode === 'not-ok') return { ok: false, status: 503, json: async () => ({}) } as Response;
      if (mode === 'malformed') return { ok: true, status: 200, json: async () => ({ action: 1, data: { RWF: { rateToUsd: 'soon' } } }) } as Response;
      return { ok: true, status: 200, json: async () => ratesBody } as Response;
    }
    return { ok: true, status: 200, json: async () => idsBody } as Response;
  }) as typeof fetch;
}

let container: HTMLDivElement;
let root: Root;

async function render(ui: React.ReactElement) {
  await act(async () => {
    root.render(<CurrencyProvider>{ui}</CurrencyProvider>);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0)); // let the rates request settle
  });
  return container.textContent ?? '';
}

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('wallet panel as rendered, USD display', () => {
  beforeEach(() => mockRates('live'));

  it('photographer sees 95.50 available and the booking bucket, no NaN', async () => {
    const text = await render(<WalletPanel wallet={fixture('wallet-me-photographer.json')} role="photographer" title="My earnings" />);
    expect(text).toContain('Available to withdraw');
    expect(text).toContain('$95.50');
    expect(text).toContain('Booking earnings');
    expect(text).not.toMatch(/NaN|undefined/);
  });

  it('client sees 100.00 total spent', async () => {
    const text = await render(<WalletPanel wallet={fixture('wallet-me-client.json')} role="client" title="My wallet" />);
    expect(text).toContain('Total spent');
    expect(text).toContain('$100.00');
  });

  it('the platform wallet shows 4.50 in the admin view', async () => {
    const text = await render(<WalletPanel wallet={fixture('wallet-me-platform.json')} role="admin" title="Platform" />);
    expect(text).toContain('$4.50');
  });

  it('a genuine zero wallet renders as zero, not blank', async () => {
    const zero = { ...fixture('wallet-me-photographer.json'), balanceAvailable: 0, balanceBooking: 0 };
    const text = await render(<WalletPanel wallet={zero} role="photographer" title="My earnings" />);
    expect(text).toContain('$0.00');
  });

  it('a suspended wallet says so', async () => {
    const suspended = { ...fixture('wallet-me-photographer.json'), status: 'SUSPENDED', suspensionReason: 'DRIFT_DETECTED' };
    const text = await render(<WalletPanel wallet={suspended} role="photographer" title="My earnings" />);
    expect(text).toContain('Suspended');
    expect(text).toContain('DRIFT DETECTED');
  });
});

describe('wallet panel as rendered, RWF display', () => {
  beforeEach(() => localStorage.setItem('connekt-currency', 'RWF'));

  it('converts at the backend rate when the rates loaded: 95.50 USD is RF 124,150', async () => {
    mockRates('live');
    const text = await render(<WalletPanel wallet={fixture('wallet-me-photographer.json')} role="photographer" title="My earnings" />);
    expect(text).toContain('RF 124,150');
  });

  it.each(['failing', 'not-ok', 'malformed'] as const)(
    'shows 95.50 in USD, not a guessed RWF figure, when the rates request is %s',
    async (mode) => {
      mockRates(mode);
      const text = await render(<WalletPanel wallet={fixture('wallet-me-photographer.json')} role="photographer" title="My earnings" />);
      expect(text).toContain('$95.50');
      expect(text).not.toContain('RF ');
    },
  );
});
