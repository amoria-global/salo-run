import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

import GlassPhotographers from './GlassPhotographers';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const booking = (over: Record<string, unknown> = {}) => ({ id: 'b1', eventName: 'Kigali Gala', eventType: 'Gala', eventDate: '2026-12-01', eventTime: '18:00', duration: '4h', location: 'Kigali', packageName: 'Gold', totalAmount: 100, paidAmount: 40, paymentStatus: 'partially_paid', status: 'upcoming', ...over });
const ph = (over: Record<string, unknown> = {}) => ({
  id: 'p1', firstName: 'Ada', lastName: 'Lens', profileImage: '', coverImage: '', portfolioImages: [], bio: '', specializations: ['Wedding'], experience: 3,
  location: { city: 'Kigali', country: 'Rwanda' }, rating: 4.5, reviewCount: 1, completedBookings: 1, verified: true, startingPrice: 50, responseTime: '1h',
  isFavorite: false, isAvailable: true, languages: [], equipment: [], lastBookingDate: '2026-11-01', lastEventType: 'Wedding', lastEventName: 'Ada wedding',
  totalBookingsWithClient: 2, totalSpent: 140, bookings: [booking()], ...over,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ctl(list: Record<string, unknown>[], over: Record<string, unknown> = {}): Record<string, any> {
  const fn = () => vi.fn();
  return {
    photographersLoaded: true, photographersError: false, retryPhotographers: fn(), photographers: list, filteredPhotographers: list, userRole: 'client',
    viewMode: 'grid', setViewMode: fn(), activeTab: 'all', setActiveTab: fn(), searchQuery: '', setSearchQuery: fn(), sortBy: 'recent', sortOrder: 'desc', setSortBy: fn(), setSortOrder: fn(),
    specializations: ['Wedding'], selectedSpecialization: null, setSelectedSpecialization: fn(), showFilters: false, setShowFilters: fn(),
    photographersWithPendingPayments: list.filter((p) => (p.bookings as { paymentStatus: string }[]).some((b) => b.paymentStatus !== 'paid')), totalPendingAmount: 60,
    formatPrice: (n: number) => `USD ${n.toFixed(2)}`, formatDate: (d: string) => d, hasCompletedEvent: () => true, toggleFavorite: fn(),
    setSelectedPhotographer: fn(), setReportPhotographer: fn(), setShowReportModal: fn(), setPaymentBooking: fn(), setShowPaymentModal: fn(),
    setRebookPhotographer: fn(), setSelectedRebookEventId: fn(), setRebookEventType: fn(), setRebookDate: fn(), setRebookTime: fn(), setRebookLocation: fn(), setRebookNotes: fn(), setShowRebookModal: fn(),
    setReviewPhotographer: fn(), setReviewRating: fn(), setReviewText: fn(), setTipAmount: fn(), setCustomTipAmount: fn(), setShowReviewModal: fn(),
    setShowInviteModal: fn(), setInviteEmail: fn(), setInviteError: fn(), setInviteCopied: fn(), ...over,
  };
}

let host: HTMLDivElement;
let root: Root;
const render = async (c: unknown) => { await act(async () => { root.render(<GlassPhotographers ctl={c as never} modals={<div data-stub="modals" />} />); }); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassPhotographers', () => {
  it('skeleton first, error with retry, empty with invite, no match after filtering', async () => {
    await render(ctl([], { photographersLoaded: false }));
    expect(text()).not.toContain('No booked photographers yet');
    const e = ctl([], { photographersError: true });
    await render(e);
    await click(button(/Try again|Retry/));
    expect(e.retryPhotographers).toHaveBeenCalled();
    const empty = ctl([]);
    await render(empty);
    await click(button(/^Invite a photographer$/));
    expect(empty.setShowInviteModal).toHaveBeenCalledWith(true);
    await render(ctl([ph()], { filteredPhotographers: [] }));
    expect(text()).toContain('No photographers found');
  });

  it('pays the first unpaid booking, messages through the inbox, reviews and rebooks with fresh state', async () => {
    const c = ctl([ph()]);
    await render(c);
    expect(text()).toContain('2 bookings');
    expect(text()).toContain('in pending payments');
    await click(button(/^Pay USD 60\.00$/));
    expect(c.setPaymentBooking).toHaveBeenCalledWith(expect.objectContaining({ booking: expect.objectContaining({ id: 'b1' }) }));
    expect(c.setShowPaymentModal).toHaveBeenCalledWith(true);
    expect(host.querySelector('a[href="/user/client/inbox?photographerId=p1"]')).toBeTruthy();
    await click(button(/^Review$/));
    expect(c.setReviewRating).toHaveBeenCalledWith(5);
    expect(c.setShowReviewModal).toHaveBeenCalledWith(true);
    await click(button(/^Rebook$/));
    expect(c.setRebookDate).toHaveBeenCalledWith('');
    expect(c.setShowRebookModal).toHaveBeenCalledWith(true);
    await click(button(/Add to favorites/));
    expect(c.toggleFavorite).toHaveBeenCalledWith('p1');
    expect(c.setSelectedPhotographer).not.toHaveBeenCalled();
  });

  it('coordinator inbox link, failed payment says Retry payment, the dialogs are mounted', async () => {
    await render(ctl([ph({ bookings: [booking({ paymentStatus: 'failed' })] })], { userRole: 'event-coordinator' }));
    expect(host.querySelector('a[href="/user/event-coordinator/inbox?photographerId=p1"]')).toBeTruthy();
    expect(button(/^Retry payment$/)).toBeTruthy();
    expect(host.querySelector('[data-stub=modals]')).toBeTruthy();
  });
});
