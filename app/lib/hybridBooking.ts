import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';

/**
 * Hybrid booking calls. Every path goes through the /api/proxy route, which
 * only forwards paths under api/remote/; these used to call `${base}/events/...`
 * and every one was refused with a 403 by the proxy. Responses are the
 * backend's envelope ({ action, message, data }) and a 200 can still be a
 * failure, so `action` is checked. Nothing here invents a value the backend
 * didn't send: a failure is thrown, and a missing field stays missing.
 */

export type PhotographerType = 'FREELANCER' | 'STUDIO' | 'ANY';
export type LocationCoverage = 'SAME_CITY' | 'NEARBY_CITY' | 'ANY';
export type RecommendationTier = 'HIGH' | 'MEDIUM' | 'LOW';

/** Field names are the backend's MatchPreviewRequestDTO. */
export interface MatchPreviewPayload {
  eventDate: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  photographerType?: PhotographerType;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  specialty?: string;
  locationCoverage?: LocationCoverage;
}

export interface MatchPreviewResult {
  count: number;
  breakdown?: {
    availableOnDate?: number;
    withinBudget?: number;
    typeMatched?: number;
    instagramEnriched?: number;
  };
}

/** Field names are the backend's CreateMatchRequestDTO. */
export interface MatchRequestPayload {
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  photographerType?: PhotographerType;
  specialty?: string;
  locationCoverage?: LocationCoverage;
  expirationHours?: number;
  instructions?: string;
  city?: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
}

export interface PhotographerOpportunity {
  opportunityId: string;
  candidateId?: string;
  eventId: string;
  eventTitle: string;
  eventType?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  venue?: string;
  city?: string;
  distanceKm?: number;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  expiresAt?: string;
  invitedAt?: string;
  candidateExpiresAt?: string;
  status: string;
  matchReasons: string[];
  instructions?: string;
}

export interface CandidateSummary {
  candidateId?: string;
  photographerId: string;
  photographerName: string;
  profilePicture?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  /** The backend sends the photographer's package range as text, e.g. "100,000 - 150,000 RWF". */
  typicalPriceRange?: string;
  recommendationTier: RecommendationTier;
  rank?: number;
  instagramHandle?: string;
  instagramFollowers?: number;
}

export interface SelectPhotographerPayload {
  candidateId?: string;
  photographerId: string;
  packageId?: string;
  escrowPercentage?: number;
  notes?: string;
}

export interface SelectPhotographerResult {
  bookingId: string;
  declarationId: string;
  eventId: string;
  depositAmount?: number;
  currency?: string;
  escrowPercentage?: number;
}

type Envelope<T> = { action?: number; message?: string; error?: string; data?: T };

/** A refusal the UI can show; `code` is the backend's error code when it sent one. */
export class HybridApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'HybridApiError';
  }
}

const remote = (path: string) => `${getApiUrl()}/api/remote${path}`;

async function call<T>(path: string, init: RequestInit, fallbackMessage: string): Promise<T | undefined> {
  let res: Response;
  try {
    res = await dashboardAuthFetch(remote(path), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
  } catch {
    throw new HybridApiError('Network error. Check your connection and try again.', 0);
  }
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || body?.action !== 1) {
    throw new HybridApiError(body?.message || fallbackMessage, res.status, body?.error);
  }
  return body.data;
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);

/**
 * Live match count for the wizard. The count is the server's, including 0.
 */
export async function previewMatchCount(payload: MatchPreviewPayload): Promise<MatchPreviewResult> {
  const data = await call<Record<string, unknown>>(
    '/events/match-preview',
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not count matching photographers.',
  );
  const count = num(data?.matchCount);
  if (count === undefined) throw new HybridApiError('Could not count matching photographers.', 500);
  return { count, breakdown: data?.breakdown as MatchPreviewResult['breakdown'] };
}

/**
 * Publish the brief and alert matching photographers.
 */
export async function publishMatchRequest(
  eventId: string,
  payload: MatchRequestPayload,
): Promise<{ eventId: string; invitedCount?: number }> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/match-request`,
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not post your event to photographers.',
  );
  return { eventId, invitedCount: num(data?.invitedCount) };
}

/**
 * The photographer's open opportunities. Throws on failure so the view can
 * say it couldn't load, rather than showing an empty list.
 */
export async function getPhotographerOpportunities(): Promise<PhotographerOpportunity[]> {
  const data = await call<unknown>('/photographer/opportunities', { method: 'GET' }, 'Could not load opportunities.');
  const items = Array.isArray(data) ? data : [];
  return items.map((item: Record<string, unknown>) => {
    const candidateId = String(item.candidateId ?? '');
    return {
      opportunityId: candidateId,
      candidateId,
      eventId: String(item.eventId ?? ''),
      eventTitle: str(item.eventTitle) ?? 'Event',
      eventType: str(item.eventType),
      eventDate: str(item.eventDate) ?? '',
      startTime: str(item.startTime) ?? '',
      endTime: str(item.endTime),
      venue: str(item.venue),
      city: str(item.city),
      distanceKm: num(item.distanceKm),
      minBudget: num(item.minBudget),
      maxBudget: num(item.maxBudget),
      currency: str(item.currency),
      expiresAt: str(item.expiresAt),
      invitedAt: str(item.invitedAt),
      candidateExpiresAt: str(item.candidateExpiresAt),
      status: str(item.status) ?? 'INVITED',
      matchReasons: Array.isArray(item.matchReasons) ? (item.matchReasons as string[]) : [],
      instructions: str(item.instructions),
    };
  });
}

/** "I'm Available". Throws 409 NO_LONGER_AVAILABLE once the invite has closed. */
export async function approveOpportunity(opportunityId: string): Promise<void> {
  await call(
    `/opportunities/${encodeURIComponent(opportunityId)}/approve`,
    { method: 'POST' },
    'Could not approve this opportunity.',
  );
}

export async function rejectOpportunity(opportunityId: string): Promise<void> {
  await call(
    `/opportunities/${encodeURIComponent(opportunityId)}/reject`,
    { method: 'POST' },
    'Could not decline this opportunity.',
  );
}

/**
 * Approved candidates for the client's event, ranked by the server.
 */
export async function getEventCandidates(eventId: string): Promise<CandidateSummary[]> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/candidates`,
    { method: 'GET' },
    'Could not load candidates.',
  );
  const items = Array.isArray(data?.candidates) ? (data!.candidates as Record<string, unknown>[]) : [];
  return items.map((c) => {
    const insta = (c.instagram ?? null) as Record<string, unknown> | null;
    return {
      candidateId: str(c.candidateId),
      photographerId: String(c.photographerId ?? ''),
      photographerName: str(c.name) ?? 'Photographer',
      profilePicture: str(c.avatar),
      rating: num(c.rating),
      reviewCount: num(c.reviewCount),
      distanceKm: num(c.distanceKm),
      typicalPriceRange: str(c.typicalPriceRange),
      recommendationTier: (str(c.recommendationTier) ?? 'LOW') as RecommendationTier,
      rank: num(c.rank),
      instagramHandle: insta ? str(insta.handle) : undefined,
      instagramFollowers: insta ? num(insta.followersCount) : undefined,
    };
  });
}

/**
 * Select a candidate. Creates the booking and its payment declaration, so it
 * is sent once and never retried: after a network failure the selection may
 * already have gone through.
 */
export async function selectEventPhotographer(
  eventId: string,
  payload: SelectPhotographerPayload,
): Promise<SelectPhotographerResult> {
  try {
    const data = await call<Record<string, unknown>>(
      `/events/${encodeURIComponent(eventId)}/select-photographer`,
      { method: 'POST', body: JSON.stringify(payload) },
      'Could not confirm this photographer.',
    );
    return {
      bookingId: String(data?.bookingId ?? ''),
      declarationId: String(data?.declarationId ?? ''),
      eventId,
      depositAmount: num(data?.depositAmount),
      currency: str(data?.currency),
      escrowPercentage: num(data?.escrowPercentage),
    };
  } catch (e) {
    if (e instanceof HybridApiError && (e.status === 409 || e.code === 'NO_LONGER_AVAILABLE')) {
      throw new HybridApiError(
        'This photographer is no longer available for your event. Please choose another.',
        409,
        'NO_LONGER_AVAILABLE',
      );
    }
    if (e instanceof HybridApiError && e.status === 0) {
      throw new HybridApiError(
        "We couldn't confirm whether your selection went through. Refresh the event before selecting again.",
        0,
      );
    }
    throw e;
  }
}

/** Turn a declined direct booking into a hybrid brief. */
export async function convertToHybrid(eventId: string): Promise<void> {
  await call(
    `/events/${encodeURIComponent(eventId)}/convert-to-hybrid`,
    { method: 'POST' },
    'Could not convert this event to hybrid matching.',
  );
}

/** Turn a timed-out hybrid event back into direct booking. */
export async function convertToDirect(eventId: string): Promise<{ data?: Record<string, unknown> }> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/convert-to-direct`,
    { method: 'POST' },
    'Could not convert this event to direct booking.',
  );
  return { data };
}
