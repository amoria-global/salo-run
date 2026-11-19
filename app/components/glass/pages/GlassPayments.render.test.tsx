import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));

import GlassClientPayments from './GlassClientPayments';
import GlassCoordinatorPayments from './GlassCoordinatorPayments';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pay = (over: Record<string, unknown> = {}) => ({
  id: 1, declarationId: 'd1', date: 'Nov 18, 2026', eventName: 'Kigali Gala', eventType: 'Booking', photographerName: 'QA Photographer',
  photographerImage: '', method: '-', amount: 'USD 60.00', amountNum: 60, paidAmount: 0, status: 'pending', invoiceNumber: 'INV-D1',
  escrowStatus: 'NONE', eventCompletionStatus: 'NOT_COMPLETED', ...over,
});
const usd = (n: number, from?: string) => `${from && from !== 'USD' ? `${from}->` : ''}USD ${n.toFixed(2)}`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctl = Record<string, any>;
function common(payments: Record<string, unknown>[], over: Record<string, unknown> = {}): Ctl {
  const fn = () => vi.fn();
  return {
    formatPrice: usd, payments, totalPaid: 0, totalPending: 0, totalFailed: 0, chartType: 'line', setChartType: fn(), activeTimeFilter: '1M', setActiveTimeFilter: fn(),
    setShowReportModal: fn(), handlePayNow: fn(), handleDownloadReceipt: fn(), handleViewPayment: fn(), hasWithdrawalMethod: false, setShowWithdrawModal: fn(),
    currentPage: 1, setCurrentPage: fn(), totalPages: 1, totalResults: payments.length, resultsPerPage: 8, ...over,
  };
}
const client = (payments: Record<string, unknown>[], over: Record<string, unknown> = {}): Ctl => common(payments, {
  paymentsLoaded: true, paymentsError: false, retryPayments: vi.fn(), highlightId: null, highlightRowRef: { current: null },
  giftStreams: [], totalGifts: 0, setShowGiftsPaymentMethodModal: vi.fn(), handleViewGiftSenders: vi.fn(), ...over,
});
const coordinator = (payments: Record<string, unknown>[], over: Record<string, unknown> = {}): Ctl => common(payments, {
  paymentsLoaded: true, isLoadingPayments: false, paymentsError: null, fetchPayments: vi.fn(), paginatedPayments: payments,
  streamFeeEvents: [], totalStreamFees: 0, giftPayments: [], totalGiftRevenue: 0, setShowStreamFeeWithdrawModal: vi.fn(), ...over,
});

let host: HTMLDivElement;
let root: Root;
/* eslint-disable @typescript-eslint/no-explicit-any */
const renderClient = async (c: unknown) => { await act(async () => { root.render(<GlassClientPayments ctl={c as any} modals={<div data-stub="modals" />} chart={<div data-stub="chart" />} />); }); };
const renderCoord = async (c: unknown) => { await act(async () => { root.render(<GlassCoordinatorPayments ctl={c as any} modals={<div data-stub="modals" />} chart={<div data-stub="chart" />} />); }); };
/* eslint-enable @typescript-eslint/no-explicit-any */
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassClientPayments', () => {
  it('shows a skeleton before the first answer, then the error with a retry', async () => {
    await renderClient(client([], { paymentsLoaded: false }));
    expect(text()).not.toContain('No payments yet');
    const c = client([], { paymentsError: true });
    await renderClient(c);
    await click(button(/Try again|Retry/));
    expect(c.retryPayments).toHaveBeenCalled();
  });

  it('empty state, the chart and the dialogs are always mounted', async () => {
    await renderClient(client([]));
    expect(text()).toContain('No payments yet');
    expect(host.querySelector('[data-stub=chart]')).toBeTruthy();
    expect(host.querySelector('[data-stub=modals]')).toBeTruthy();
  });

  it('row actions follow the classic rules, money carries the ISO code', async () => {
    const c = client([
      pay(),
      pay({ id: 2, invoiceNumber: 'INV-D2', escrowStatus: 'HELD', escrowPercentage: 50, eventCompletionStatus: 'COMPLETED' }),
      pay({ id: 3, invoiceNumber: 'INV-D3', escrowStatus: 'HELD', escrowPercentage: 50 }),
      pay({ id: 4, invoiceNumber: 'INV-D4', status: 'paid' }),
      pay({ id: 5, invoiceNumber: 'INV-D5', status: 'failed' }),
    ], { totalPending: 60 });
    await renderClient(c);
    expect(text()).toContain('USD 60.00');
    expect(text()).toContain('in pending payments');
    expect(Array.from(document.querySelectorAll('button')).filter((b) => b.textContent === 'Pay now')).toHaveLength(1);
    expect(text()).toContain('Awaiting completion');
    await click(button(/^Release funds$/));
    expect(c.handlePayNow).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    await click(button(/Download receipt INV-D4/));
    expect(c.handleDownloadReceipt).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }));
    await click(button(/^Retry$/));
    expect(c.handlePayNow).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
    await click(button(/View details INV-D1/));
    expect(c.handleViewPayment).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('gifts: set up withdrawal without a method, withdraw with one, senders per stream', async () => {
    const streams = [{ id: 7, streamTitle: 'Wedding live', date: 'Nov 1', platform: 'ConnektLive', gifters: [{ name: 'A', amount: 2, message: '' }, { name: 'B', amount: 3, message: 'hi' }] }];
    const c = client([], { giftStreams: streams, totalGifts: 5 });
    await renderClient(c);
    expect(text()).toContain('2 gifters');
    await click(button(/^Set up withdrawal$/));
    expect(c.setShowGiftsPaymentMethodModal).toHaveBeenCalledWith(true);
    await click(button(/^View senders$/));
    expect(c.handleViewGiftSenders).toHaveBeenCalledWith(streams[0]);
    const c2 = client([], { hasWithdrawalMethod: true });
    await renderClient(c2);
    await click(button(/^Withdraw$/));
    expect(c2.setShowWithdrawModal).toHaveBeenCalledWith(true);
  });
});

describe('GlassCoordinatorPayments', () => {
  it('has no escrow actions, converts ticket money from its currency, keeps a partial-load warning', async () => {
    const c = coordinator([pay({ escrowStatus: 'HELD', escrowPercentage: 50 })], {
      paymentsError: 'Could not load payments. Please refresh.',
      streamFeeEvents: [{ id: 's1', eventTitle: 'Gala live', viewerName: 'Viewer One', viewerEmail: '', date: '2026-11-10', amount: 5000, currency: 'RWF', method: 'MOMO', status: 'completed' }],
      giftPayments: [{ id: 'g1', eventTitle: 'Gala live', amount: 3, netAmount: 1.95, currency: 'USD', giftMessage: null, customerPhone: '0788123456', method: '-', status: 'completed', date: '2026-11-10' }],
    });
    await renderCoord(c);
    expect(text()).toContain('The totals below may be incomplete.');
    expect(text()).toContain('RWF->USD 5000.00');
    expect(text()).toContain('078****456');
    expect(text()).not.toContain('Awaiting completion');
    await click(button(/^Pay now$/));
    expect(c.handlePayNow).toHaveBeenCalled();
  });

  it('failed first load shows the error with a retry that refetches', async () => {
    const c = coordinator([], { paymentsError: 'Could not load payments. Please refresh.' });
    await renderCoord(c);
    await click(button(/Try again|Retry/));
    expect(c.fetchPayments).toHaveBeenCalled();
  });
});
