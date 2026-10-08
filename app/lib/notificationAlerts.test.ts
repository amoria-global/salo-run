import { describe, expect, it } from 'vitest';
import { alertKind, freshUnread, strongestAlert } from './notificationAlerts';

describe('dashboard notification alerts', () => {
  it('rings for booking requests and opportunities, chimes for other booking and payment changes', () => {
    expect(alertKind({ id: '1', type: 'BOOKING', title: 'New Booking Request' })).toBe('ring');
    expect(alertKind({ id: '2', type: 'OPPORTUNITY', title: 'New opportunity' })).toBe('ring');
    expect(alertKind({ id: '3', type: 'BOOKING', title: 'Booking Accepted' })).toBe('chime');
    expect(alertKind({ id: '4', type: 'PAYMENT', title: 'Deposit Received' })).toBe('chime');
    expect(alertKind({ id: '5', type: 'EVENT', title: 'New Guest Joined' })).toBeNull();
  });

  it('never alerts on the first poll, so the backlog stays quiet', () => {
    expect(freshUnread(null, [{ id: 'a', read: false }])).toEqual([]);
  });

  it('alerts only for unread notifications it has not seen', () => {
    const seen = new Set(['a']);
    const items = [
      { id: 'a', read: false },
      { id: 'b', read: false },
      { id: 'c', read: true },
    ];
    expect(freshUnread(seen, items).map((n) => n.id)).toEqual(['b']);
  });

  it('a ring beats a chime when several arrive together', () => {
    expect(
      strongestAlert([
        { id: '1', type: 'PAYMENT' },
        { id: '2', type: 'BOOKING', title: 'New Booking Request' },
      ]),
    ).toBe('ring');
    expect(strongestAlert([{ id: '1', type: 'EVENT' }])).toBeNull();
  });
});
