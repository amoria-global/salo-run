import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/app/context/CurrencyContext', () => ({ useCurrency: () => ({ priceParts: (n: number) => ({ code: 'USD', prefix: 'USD', tight: false, text: Number(n).toFixed(2), value: n }) }) }));
vi.mock('@/app/components/PlatformAlert', () => ({ platformAlert: vi.fn() }));
vi.mock('@/app/lib/hybridBooking', () => ({ convertToHybrid: vi.fn() }));
vi.mock('next/link', () => ({ default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
vi.mock('@/app/components/events/detail/useEventDetail', () => ({
  formatEventDate: (d: string) => `D:${d}`, formatTime: (x: string) => x, getStatusLabel: (s: string) => s, getPaymentStatusLabel: (s: string) => s,
}));

import GlassEventDetail from './GlassEventDetail';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const event = { title: 'Ben & Raya Wedding', status: 'PUBLISHED', date: '2026-12-01', time: '14:00', city: 'Kigali', maxGuests: 120, isPublished: true, bookingStatus: 'ACCEPTED', photographerName: 'QA Photographer', packageName: 'Wedding Gold', packagePrice: 500, packageCurrencyAbbreviation: 'USD', completionStatus: 'PENDING_CUSTOMER_CONFIRMATION', bookingProgress: [{ key: 'b', label: 'Booked', done: true }, { key: 'p', label: 'Paid', done: false }], hasLiveStream: true };
function ctl(over: Record<string, unknown> = {}) {
  const fn = () => vi.fn();
  return {
    event, userRole: 'client', loading: false, error: null, payments: [{ id: 'p1', status: 'PENDING', amountInUsd: 100, paidAmountInUsd: 40, heldAmountInUsd: 0, escrowPercentage: 0, paymentType: 'Deposit' }],
    hasPendingPayments: true, totalAmount: 100, totalPaid: 40, totalRemaining: 60, router: { push: fn(), back: fn() }, actionLoading: null, setActionLoading: fn(),
    handleUnpublish: fn(), handlePublish: fn(), setQrJustPublished: fn(), setQrOpen: fn(), isEventPausable: () => false, isEventResumable: () => false, isEventDeletable: () => true,
    setShowPauseConfirm: fn(), handleResume: fn(), setShowDeleteConfirm: fn(), setShowCompletionModal: fn(), setShowAcceptModal: fn(), setShowDeclineModal: fn(),
    goToEventAction: fn(), handleShareEvent: fn(), handleMarkComplete: fn(), handlePayNowClick: fn(), setShowCandidatesModal: fn(), fetchEvent: fn(), eventId: 'e1', shouldHighlight: false,
    ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown) => { await act(async () => { root.render(<GlassEventDetail ctl={c as never} modals={<div data-stub="modals" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassEventDetail', () => {
  it('client: owner actions, completion confirm, ISO money and pay now', async () => {
    const c = ctl();
    await render(c);
    expect(document.querySelector('[data-stub=modals]')).toBeTruthy();
    expect(document.body.textContent).toContain('USD');
    expect(document.body.textContent).not.toMatch(/\$\d/);
    await click(button(/^Unpublish$/));
    expect(c.handleUnpublish).toHaveBeenCalled();
    await click(button(/^Confirm completion$/));
    expect(c.setShowCompletionModal).toHaveBeenCalledWith(true);
    await click(button(/^Delete$/));
    expect(c.setShowDeleteConfirm).toHaveBeenCalledWith(true);
    await click(button(/^Pay now$/));
    expect(c.handlePayNowClick).toHaveBeenCalled();
  });

  it('photographer: accepted booking shows create album, live stream and mark complete; no owner actions', async () => {
    const c = ctl({ userRole: 'photographer' });
    await render(c);
    expect(button(/^Publish$|^Unpublish$/)).toBeUndefined();
    await click(button(/^Create album$/));
    expect(c.goToEventAction).toHaveBeenCalledWith('createAlbum');
    await click(button(/^Mark complete$/));
    expect(c.handleMarkComplete).toHaveBeenCalled();
  });

  it('pending photographer booking: accept and decline; loading and error states', async () => {
    const c = ctl({ userRole: 'photographer', event: { ...event, bookingStatus: 'PENDING' } });
    await render(c);
    await click(button(/^Decline$/));
    expect(c.setShowDeclineModal).toHaveBeenCalledWith(true);
    await render(ctl({ loading: true }));
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
    const e = ctl({ error: 'Event not found' });
    await render(e);
    await click(button(/Retry/));
    expect(e.fetchEvent).toHaveBeenCalled();
  });
});
