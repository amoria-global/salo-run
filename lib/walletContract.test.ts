import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authFetch = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => authFetch(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

import { getMyWallet, getMyWalletMovements, type WalletDTO, type WalletMovementDTO } from './walletApi';
import { formatWalletMovement, selectWalletStats } from './moneyView';

/**
 * Behaviour tests on the REAL backend payloads (see __fixtures__/backend-contract/README.md).
 * The oracle numbers are worked out by hand from the booking rules, not read from
 * the fixtures: a 100,000 RWF booking at 1,000 RWF per USD, photographer fee 9% of
 * the 50% upfront milestone:
 *   photographer 0.91 x 50 + 20 + 30 = 95.50 USD, platform 4.50 USD, client paid 100.00 USD
 */
const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(__dirname, '__fixtures__/backend-contract', name), 'utf8'));
const respond = (body: unknown, status = 200) =>
  authFetch.mockResolvedValueOnce({
    ok: status < 400,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  });

beforeEach(() => authFetch.mockReset());

describe('wallet payload to dashboard figures', () => {
  it('photographer sees 95.50 available, matching the single booking bucket, nothing pending', async () => {
    respond(fixture('wallet-me-photographer.json'));
    const stats = selectWalletStats(await getMyWallet(), 'photographer');
    expect(stats.hero.value).toBeCloseTo(95.5, 4);
    const visible = stats.cards.filter(c => !c.hidden);
    expect(visible.map(c => c.label)).toEqual(['Booking earnings']);
    expect(visible[0].value).toBeCloseTo(95.5, 4);
    expect(stats.pendingChip).toBeNull();
  });

  it('client sees 100.00 spent and no available balance', async () => {
    respond(fixture('wallet-me-client.json'));
    const stats = selectWalletStats(await getMyWallet(), 'client');
    expect(stats.hero.label).toBe('Total spent');
    expect(stats.hero.value).toBeCloseTo(100, 4);
    expect(stats.cards.find(c => c.label === 'Available balance')?.hidden).toBe(true);
  });

  it('the platform wallet shows 4.50 in the admin view', async () => {
    respond(fixture('wallet-me-platform.json'));
    expect(selectWalletStats(await getMyWallet(), 'admin').hero.value).toBeCloseTo(4.5, 4);
  });

  it('the three parties together account for the 100.00 collected', () => {
    const photographer = fixture('wallet-me-photographer.json').data as WalletDTO;
    const platform = fixture('wallet-me-platform.json').data as WalletDTO;
    const client = fixture('wallet-me-client.json').data as WalletDTO;
    expect(photographer.balanceAvailable + platform.balanceBooking).toBeCloseTo(client.clientSpent, 4);
  });

  it('photographer activity rows are all credits and sum to the balance', async () => {
    respond(fixture('wallet-movements-photographer.json'));
    const page = await getMyWalletMovements();
    const rows = page.content.map(m => formatWalletMovement(m as WalletMovementDTO, 'photographer')).filter(Boolean);
    expect(rows.length).toBe(page.content.length);
    expect(rows.every(r => r!.direction === 'in')).toBe(true);
    expect(rows.reduce((t, r) => t + r!.amount, 0)).toBeCloseTo(95.5, 4);
  });

  it('client activity shows the 100.00 payment as money out', async () => {
    respond(fixture('wallet-movements-client.json'));
    const page = await getMyWalletMovements();
    const rows = page.content.map(m => formatWalletMovement(m as WalletMovementDTO, 'client')).filter(Boolean);
    const out = rows.filter(r => r!.direction === 'out').reduce((t, r) => t + r!.amount, 0);
    expect(out).toBeCloseTo(100, 4);
  });
});

describe('failures never become a balance', () => {
  it('an HTTP 200 carrying action 0 is an error', async () => {
    respond({ action: 0, message: 'Wallet unavailable', data: null });
    await expect(getMyWallet()).rejects.toThrow('Wallet unavailable');
  });
  it('a server error is an error', async () => {
    respond('Internal Server Error', 500);
    await expect(getMyWallet()).rejects.toThrow(/status 500/);
  });
  it('a non-JSON body is an error', async () => {
    respond('<html>gateway timeout</html>');
    await expect(getMyWallet()).rejects.toThrow();
  });
  it('a network failure is an error', async () => {
    authFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(getMyWallet()).rejects.toThrow('Failed to fetch');
  });
  it('success with no data is an error, not an empty wallet', async () => {
    respond({ action: 1, message: 'ok', data: null });
    await expect(getMyWallet()).rejects.toThrow(/empty/);
  });
  it('success with a missing money field is an error, not NaN or zero', async () => {
    const data = { ...fixture('wallet-me-photographer.json').data };
    delete data.balanceAvailable;
    respond({ action: 1, message: 'ok', data });
    await expect(getMyWallet()).rejects.toThrow(/incomplete/);
  });
  it('a genuine zero wallet is accepted and shown as zero', async () => {
    const data = { ...fixture('wallet-me-photographer.json').data };
    for (const k of ['balanceAvailable', 'balanceBooking', 'pendingAmount', 'heldForDelivery', 'totalWithdrawn', 'totalRefunded', 'clientSpent']) {
      data[k] = 0;
    }
    respond({ action: 1, message: 'ok', data });
    const stats = selectWalletStats(await getMyWallet(), 'photographer');
    expect(stats.hero.value).toBe(0);
    expect(stats.cards.every(c => c.hidden)).toBe(true);
  });
  it('an empty history is an empty page, not an error', async () => {
    respond({ action: 1, message: 'ok', data: { content: [], totalElements: 0, number: 0, size: 50 } });
    expect((await getMyWalletMovements()).content).toEqual([]);
  });
});
