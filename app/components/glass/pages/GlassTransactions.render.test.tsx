import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));

import GlassTransactions from './GlassTransactions';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const tx = (over: Record<string, unknown> = {}) => ({ id: 1, date: 'Nov, 18 06:00', clientName: 'QA Client', clientImage: '', service: 'Booking', serviceType: 'Wedding', method: 'MOMO', amount: '$60', amountNum: 60, status: 'completed', transactionId: 'TX-1', requestId: 'AM1', ...over });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctl(list: Record<string, unknown>[], over: Record<string, unknown> = {}): Record<string, any> {
  const fn = () => vi.fn();
  return {
    transactions: list, isLoading: false, transactionsError: false, walletError: false, fetchData: fn(), currentPage: 0, totalPages: 1,
    formatPrice: (n: number) => `USD ${Number(n).toFixed(2)}`, totalCompleted: 60, totalPending: 0, totalWithdrawn: 0, totalTips: 5, tipsData: [],
    chartType: 'line', setChartType: fn(), activeTimeFilter: '1M', setActiveTimeFilter: fn(), setShowReportModal: fn(), setShowTipsModal: fn(),
    hasPaymentAccount: true, setShowSetupModal: fn(), setShowWithdrawModal: fn(), handleDownloadReceipt: fn(), handleViewTransaction: fn(),
    platformConfig: { photographer: { bonusAmount: 50, bonusCurrencyId: 'USD', bonusThreshold: 5 } }, bonusStatus: { status: 'NONE' }, wallet: null,
    BONUS_THRESHOLD: 5, completedEventsCount: 2, bonusApproved: false, bonusPending: false, bonusRejected: false, bonusReached: false, eventsToBonus: 3, ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown) => { await act(async () => { root.render(<GlassTransactions ctl={c as never} modals={<div data-stub="modals" />} chart={<div data-stub="chart" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassTransactions', () => {
  it('withdraw goes to account setup first when there is no payment account', async () => {
    const c = ctl([tx()], { hasPaymentAccount: false });
    await render(c);
    await click(button(/^Withdraw funds$/));
    expect(c.setShowSetupModal).toHaveBeenCalledWith(true);
    expect(c.setShowWithdrawModal).not.toHaveBeenCalled();
  });

  it('rows: receipt only when completed, details always; bonus progress; wallet warning', async () => {
    const c = ctl([tx(), tx({ id: 2, status: 'pending', transactionId: 'TX-2' })], { walletError: true });
    await render(c);
    expect(text()).toContain('We could not load your wallet');
    expect(button(/Download receipt TX-2/)).toBeFalsy();
    await click(button(/Download receipt TX-1/));
    expect(c.handleDownloadReceipt).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    await click(button(/View details TX-2/));
    expect(c.handleViewTransaction).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(host.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('40');
    expect(text()).toContain('3 events to go');
  });

  it('empty, failed history with retry, and the skeleton while loading', async () => {
    await render(ctl([]));
    expect(text()).toContain('No transactions yet');
    const e = ctl([], { transactionsError: true, currentPage: 0 });
    await render(e);
    await click(button(/Try again|Retry/));
    expect(e.fetchData).toHaveBeenCalledWith(0);
    await render(ctl([], { isLoading: true }));
    expect(text()).not.toContain('No transactions yet');
  });
});
