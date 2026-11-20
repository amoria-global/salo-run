import { describe, expect, it } from 'vitest';
import { subTabsFor } from './nav';

describe('wallet sub-tabs', () => {
  it('group a photographer\'s money pages and keep every old route as its own tab', () => {
    for (const p of ['wallet', 'transaction', 'all-transactions', 'payroll-report']) {
      const tabs = subTabsFor('photographer', `/user/photographer/${p}`);
      expect(tabs?.map((t) => t.href)).toEqual([
        '/user/photographer/wallet', '/user/photographer/transaction', '/user/photographer/all-transactions', '/user/photographer/payroll-report',
      ]);
    }
  });

  it('mark the transaction tabs with the sidebar item whose workspace rules hide them', () => {
    const tabs = subTabsFor('photographer', '/user/photographer/wallet')!;
    expect(tabs.find((t) => t.label === 'Wallet')?.key).toBeUndefined();
    expect(tabs.filter((t) => t.key === 'Transactions')).toHaveLength(3);
  });

  it('are not shown on other pages', () => {
    expect(subTabsFor('photographer', '/user/photographer/events')).toBeNull();
    expect(subTabsFor('photographer', '/user/photographer/dashboard')).toBeNull();
  });

  it('give clients and coordinators their own money pages', () => {
    expect(subTabsFor('client', '/user/client/payments')?.map((t) => t.label)).toEqual(['Wallet', 'Payments', 'Transactions']);
    expect(subTabsFor('event-coordinator', '/user/event-coordinator/wallet')?.map((t) => t.label)).toEqual(['Wallet', 'Payments']);
    expect(subTabsFor('client', '/user/client/home')).toBeNull();
  });
});
