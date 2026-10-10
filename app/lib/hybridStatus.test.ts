import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  friendlyEventStatus,
  isMatchBooked,
  isOpenHybrid,
  isUpcomingEventStatus,
  opportunityTabFor,
} from './hybridStatus';

const ROOT = path.resolve(__dirname, '../..');
const src = (p: string) => readFileSync(path.join(ROOT, p), 'utf8');

describe('Post My Event status rules', () => {
  it('keeps every open Post My Event state on the Upcoming tab', () => {
    for (const s of ['MATCHING', 'PUBLISHED_PENDING_ASSIGNMENT', 'CANDIDATES_AVAILABLE', 'MATCHES_AWAITING_SELECTION', 'HYBRID_TIMEOUT', 'MATCHING_FAILED', 'BOOKED']) {
      expect(isUpcomingEventStatus(s), s).toBe(true);
    }
    expect(isUpcomingEventStatus('UPCOMING')).toBe(true);
    expect(isUpcomingEventStatus('completed')).toBe(false);
    expect(isUpcomingEventStatus('PUBLISHED')).toBe(false);
  });

  it('treats only a HYBRID event with no photographer as open', () => {
    expect(isOpenHybrid('HYBRID', 'CANDIDATES_AVAILABLE', null)).toBe(true);
    expect(isOpenHybrid(undefined, 'CANDIDATES_AVAILABLE', null)).toBe(false);
    expect(isOpenHybrid('DIRECT', 'UPCOMING', null)).toBe(false);
    expect(isOpenHybrid('HYBRID', 'BOOKED', null)).toBe(false);
    expect(isOpenHybrid('HYBRID', 'CANDIDATES_AVAILABLE', 'p1')).toBe(false);
  });

  it('never shows a raw status enum', () => {
    expect(friendlyEventStatus('PUBLISHED_PENDING_ASSIGNMENT')).toBe('Finding photographers');
    expect(friendlyEventStatus('CANDIDATES_AVAILABLE')).toBe('Photographers said yes');
    expect(friendlyEventStatus('SOME_NEW_STATE')).toBe('Some New State');
  });

  it('opens a notified opportunity on the tab that lists it', () => {
    expect(opportunityTabFor('INVITED')).toBe('PENDING_RESPONSE');
    expect(opportunityTabFor('APPROVED')).toBe('APPROVED');
    for (const s of ['SELECTED', 'NOT_SELECTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'NO_LONGER_AVAILABLE']) {
      expect(opportunityTabFor(s), s).toBe('ALL');
    }
  });

  it('reads a chosen photographer as booked, not as matching that ended', () => {
    expect(isMatchBooked({ status: 'BOOKED', matchStatus: 'COMPLETED' })).toBe(true);
    expect(isMatchBooked({ status: 'UPCOMING', matchStatus: 'COMPLETED' })).toBe(true);
    expect(isMatchBooked({ status: 'HYBRID_TIMEOUT', matchStatus: 'EXPIRED' })).toBe(false);
    expect(isMatchBooked({ status: 'MATCHING_FAILED', matchStatus: 'FAILED' })).toBe(false);
    expect(isMatchBooked(null)).toBe(false);
  });
});

describe('Post My Event screens use the shared rules', () => {
  it('the client events list keeps the booking mode the backend sends', () => {
    expect(src('app/pages/client/events.tsx')).toMatch(/bookingMode: \(evt\.bookingMode as string\) \|\| undefined/);
  });

  it('both events lists filter Upcoming through the shared rule', () => {
    expect(src('app/pages/client/events.tsx')).toContain('isUpcomingEventStatus(event.status)');
    expect(src('app/pages/event-coordinator/events.tsx')).toContain('isUpcomingEventStatus(event.status)');
  });

  it('the event page only claims matching is active for a posted event', () => {
    const page = src('app/pages/client/event-detail.tsx');
    expect(page).toContain('bookingMode: data.bookingMode || null');
    expect(page).toContain('isOpenHybrid(event.bookingMode, event.eventStatus || event.status, event.photographerId) ? (');
    expect(page).toContain('friendlyEventStatus(status)');
  });

  it('the answers modal shows a booked event as booked', () => {
    expect(src('app/components/hybrid/CandidatesShortlistModal.tsx')).toContain('isMatchBooked(data)');
  });

  it('the opportunities view follows a notification to the right tab', () => {
    expect(src('app/components/hybrid/PhotographerOpportunitiesView.tsx')).toContain('setTab(opportunityTabFor(o.status))');
  });
});
