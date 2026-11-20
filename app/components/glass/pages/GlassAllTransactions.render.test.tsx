import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));

import GlassAllTransactions from './GlassAllTransactions';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const tx = (over: Record<string, unknown> = {}) => ({ id: 1, date: 'Nov 18', transactionId: 'TX-1', client: 'QA Client', service: 'Booking', method: 'MOMO', amount: 78000, currency: 'RWF', status: 'completed', requestId: 'AM1', ...over });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctl(list: Record<string, unknown>[], over: Record<string, unknown> = {}): Record<string, any> {
  const fn = () => vi.fn();
  return {
    transactions: list, filteredTransactions: list, isLoading: false, transactionsError: false, fetchTransactions: fn(), currentPage: 0, totalPages: 1,
    formatRowAmount: (n: number, ccy?: string) => `${ccy} ${n}`, searchQuery: '', setSearchQuery: fn(), filterStatus: 'All', setFilterStatus: fn(),
    handleDownload: fn(), handleView: fn(), highlightId: null, highlightRowRef: { current: null }, ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown) => { await act(async () => { root.render(<GlassAllTransactions ctl={c as never} modals={<div data-stub="modals" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassAllTransactions', () => {
  it('prints each row in its own currency and wires Download, View and the status filter', async () => {
    const c = ctl([tx()]);
    await render(c);
    expect(text()).toContain('RWF 78000');
    await click(button(/Download receipt TX-1/));
    expect(c.handleDownload).toHaveBeenCalled();
    await click(button(/View details TX-1/));
    expect(c.handleView).toHaveBeenCalled();
    await click(button(/^Pending$/));
    expect(c.setFilterStatus).toHaveBeenCalledWith('Pending');
    expect(host.querySelectorAll('[role=listitem]')).toHaveLength(1);
  });

  it('error with retry, empty, no match, and server paging', async () => {
    const e = ctl([], { transactionsError: true, currentPage: 2 });
    await render(e);
    await click(button(/Try again|Retry/));
    expect(e.fetchTransactions).toHaveBeenCalledWith(2);
    await render(ctl([]));
    expect(text()).toContain('No transactions yet');
    await render(ctl([tx()], { filteredTransactions: [] }));
    expect(text()).toContain('No transactions found');
    const p = ctl([tx()], { totalPages: 3, currentPage: 1 });
    await render(p);
    await click(button(/^Next$/));
    expect(p.fetchTransactions).toHaveBeenCalledWith(2);
  });
});
