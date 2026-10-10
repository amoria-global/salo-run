/**
 * Post My Event status rules shared by every dashboard screen. They are the
 * backend's own states (HybridMatchService), read here so the screens agree
 * with each other and with the mobile app. Nothing in this file decides
 * eligibility or availability; it only says how a state the server sent is
 * shown.
 */

export type BookingModeKey = 'DIRECT' | 'HYBRID';

export function modeOf(bookingMode?: string | null): BookingModeKey {
  return (bookingMode || '').toUpperCase() === 'HYBRID' ? 'HYBRID' : 'DIRECT';
}

/** A posted event that has no photographer yet. */
export const OPEN_HYBRID_STATUSES = [
  'MATCHING',
  'PUBLISHED_PENDING_ASSIGNMENT',
  'CANDIDATES_AVAILABLE',
  'MATCHES_AWAITING_SELECTION',
  'HYBRID_TIMEOUT',
  'MATCHING_FAILED',
] as const;

/** Statuses of a posted event still waiting for its photographer. */
export function isOpenHybrid(bookingMode?: string | null, status?: string | null, photographerId?: string | null): boolean {
  return modeOf(bookingMode) === 'HYBRID' && !photographerId
    && (OPEN_HYBRID_STATUSES as readonly string[]).includes((status || '').toUpperCase());
}

/** A posted event whose matching ended without anyone to choose. */
export function isEndedHybrid(status?: string | null): boolean {
  const s = (status || '').toUpperCase();
  return s === 'HYBRID_TIMEOUT' || s === 'MATCHING_FAILED';
}

/**
 * Events that are still ahead of the client: the Upcoming tab. Every open
 * Post My Event state is here, as is a booked one, so a posted event never
 * disappears from Upcoming while it waits for answers.
 */
const UPCOMING_STATUSES = new Set<string>([
  'UPCOMING', 'ONGOING', 'LIVE', 'PAUSED', 'PENDING', 'UNASSIGNED', 'BOOKED',
  'HYBRID_MATCHING',
  ...OPEN_HYBRID_STATUSES,
]);

export function isUpcomingEventStatus(status?: string | null): boolean {
  return UPCOMING_STATUSES.has((status || '').toUpperCase());
}

/** Plain words for event statuses, matching the mobile app. */
const FRIENDLY_STATUS: Record<string, string> = {
  MATCHING: 'Matching',
  PUBLISHED_PENDING_ASSIGNMENT: 'Finding photographers',
  CANDIDATES_AVAILABLE: 'Photographers said yes',
  MATCHES_AWAITING_SELECTION: 'Choose your photographer',
  HYBRID_TIMEOUT: 'Matching ended',
  MATCHING_FAILED: 'No match yet',
  UNASSIGNED: 'Needs a photographer',
  BOOKED: 'Booked',
};

export function friendlyEventStatus(status?: string | null): string {
  const s = (status || '').toUpperCase();
  return FRIENDLY_STATUS[s] || s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The photographer's opportunity tab that lists a given status: an open
 * invite is New, a yes waiting on the client is Waiting, everything else
 * (selected, not selected, declined, expired, closed) is History.
 */
export type OpportunityTab = 'PENDING_RESPONSE' | 'APPROVED' | 'ALL';

export function opportunityTabFor(status?: string | null): OpportunityTab {
  const s = (status || '').toUpperCase();
  if (s === 'INVITED') return 'PENDING_RESPONSE';
  if (s === 'APPROVED') return 'APPROVED';
  return 'ALL';
}

/**
 * The client's answers screen after a photographer was chosen: the event is
 * BOOKED and its match COMPLETED, so nobody is listed and nothing is pending.
 * That is a booking, not a match that ended without one.
 */
export function isMatchBooked(overview?: { status?: string | null; matchStatus?: string | null } | null): boolean {
  if (!overview) return false;
  return (overview.status || '').toUpperCase() === 'BOOKED'
    || (overview.matchStatus || '').toUpperCase() === 'COMPLETED';
}
