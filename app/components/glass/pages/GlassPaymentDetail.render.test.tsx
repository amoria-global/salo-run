import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/lib/api', () => ({ normalizeImageUrl: (u: string | null) => u || undefined }));
vi.mock('@/app/components/UnlockModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-stub="paynow" /> : null) }));

import GlassPaymentDetail from './GlassPaymentDetail';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const payment = (over: Record<string, unknown> = {}) => ({
  id: 'abcdef1234', eventId: 'e1', eventTitle: 'Kigali Gala', photographerName: 'QA Photographer', photographerImage: null, amount: 78000,
  currencyAbbreviation: 'RWF', paymentType: 'BOOKING', status: 'PARTIAL', paidAmount: 39000, dueDate: '2026-12-01', createdAt: '2026-11-18T10:00:00',
  escrowStatus: 'HELD', escrowPercentage: 70, heldAmount: 0, releasedAmount: 0, eventCompletionStatus: 'NOT_COMPLETED', withdrawableAmount: 70,
  deliveryHeldAmount: 30, deliveryHeldReleased: false, amountInUsd: 60, paidAmountInUsd: 30, heldAmountInUsd: 42, releasedAmountInUsd: 0,
  withdrawableAmountInUsd: 21, deliveryHeldAmountInUsd: 9, ...over,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctl(over: Record<string, unknown> = {}): Record<string, any> {
  const p = payment();
  return {
    loading: false, error: null, payment: p, fetchPayment: vi.fn(), handleGoBack: vi.fn(), handlePayNow: vi.fn(), handleDownloadReceipt: vi.fn(),
    showPayNowModal: false, setShowPayNowModal: vi.fn(), payNowPayment: null, shouldHighlight: false,
    formatPrice: (n: number, from?: string) => `${from && from !== 'USD' ? from : 'USD'} ${n.toFixed(2)}`,
    remainingBalance: 30, paymentProgress: 50, isBooking: true, canPay: true, isPaid: false, has7030Split: true,
    withdrawablePercent: 70, deliveryHeldPercent: 30, ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const render = async (c: unknown) => { await act(async () => { root.render(<GlassPaymentDetail ctl={c as any} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassPaymentDetail', () => {
  it('loading shows a skeleton and Back; a failed load offers a retry, not-found does not', async () => {
    const c = ctl({ loading: true, payment: null });
    await render(c);
    expect(host.querySelector('[aria-busy=true]')).toBeTruthy();
    await click(button(/Back to Payments/));
    expect(c.handleGoBack).toHaveBeenCalled();
    const e = ctl({ payment: null, error: 'Failed to load payment' });
    await render(e);
    await click(button(/Try again|Retry/));
    expect(e.fetchPayment).toHaveBeenCalled();
    await render(ctl({ payment: null }));
    expect(text()).toContain('Payment not found');
    expect(button(/Try again|Retry/)).toBeFalsy();
  });

  it('USD total with the booking-currency figure, progress, escrow split and Pay now with the remainder', async () => {
    const c = ctl();
    await render(c);
    expect(text()).toContain('USD 60.00');
    expect(text()).toContain('RWF 78000.00');
    expect(host.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('50');
    expect(text()).toContain('Held in Escrow');
    expect(text()).toContain('Withdrawable');
    expect(text()).toContain('INV-ABCDEF12');
    await click(button(/^Pay now \(USD 30\.00\)$/));
    expect(c.handlePayNow).toHaveBeenCalled();
    await click(button(/Download receipt/));
    expect(c.handleDownloadReceipt).toHaveBeenCalled();
  });

  it('paid tips: no Pay now, no escrow card, a completed timeline step, the modal mounts when opened', async () => {
    await render(ctl({ payment: payment({ status: 'COMPLETED', paymentType: 'TIP', escrowPercentage: null, currencyAbbreviation: 'USD' }), canPay: false, isPaid: true, isBooking: false, has7030Split: false, showPayNowModal: true }));
    expect(button(/^Pay now/)).toBeFalsy();
    expect(text()).not.toContain('Escrow and milestone');
    expect(text()).toContain('Payment completed');
    expect(host.querySelector('[data-stub=paynow]')).toBeTruthy();
  });
});
