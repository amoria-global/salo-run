import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';

export type PhotographerType = 'FREELANCER' | 'STUDIO' | 'ANY';
export type LocationCoverage = 'SAME_CITY' | 'NEARBY_CITY' | 'ANY';
export type RecommendationTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MatchPreviewPayload {
  eventDate: string;
  eventTime: string;
  durationHours?: number;
  city?: string;
  latitude?: number;
  longitude?: number;
  preferredPhotographerType?: PhotographerType;
  minBudget?: number;
  maxBudget?: number;
  specialty?: string;
  locationCoverage?: LocationCoverage;
}

export interface MatchPreviewResult {
  count: number;
  criteriaMatched?: string[];
  samplePhotographers?: Array<{
    id: string;
    name: string;
    profilePicture?: string;
    rating?: number;
    verifiedInstagram?: boolean;
  }>;
}

export interface PhotographerOpportunity {
  opportunityId: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  venue: string;
  city: string;
  distanceKm: number;
  minBudget: number;
  maxBudget: number;
  currency?: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  clientName: string;
  clientAvatar?: string;
  matchReasons: string[];
}

export interface CandidateSummary {
  photographerId: string;
  photographerName: string;
  profilePicture?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  proposedPackageId?: string;
  proposedPackageName?: string;
  price?: number;
  currency?: string;
  recommendationTier: RecommendationTier;
  compositeScore?: number;
  verifiedInstagram?: boolean;
  approvedAt?: string;
}

export interface SelectPhotographerPayload {
  photographerId: string;
  packageId?: string;
}

export interface SelectPhotographerResult {
  success: boolean;
  bookingId?: string;
  eventId: string;
  status: string;
  requiresPayment: boolean;
  depositAmount?: number;
  currency?: string;
}

/**
 * Live debounced match preview counter (Slide 04)
 */
export async function previewMatchCount(payload: MatchPreviewPayload): Promise<MatchPreviewResult> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/events/match-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Match preview failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    count: typeof data.count === 'number' ? data.count : (data.matchesCount ?? 0),
    criteriaMatched: data.criteriaMatched || ['date', 'coverage', 'budget', 'instagram'],
    samplePhotographers: data.samplePhotographers || [],
  };
}

/**
 * Publish hybrid brief and alert eligible photographers (Slide 05)
 */
export async function publishMatchRequest(
  eventId: string,
  payload: Partial<MatchPreviewPayload>
): Promise<{ success: boolean; eventId: string }> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/events/${encodeURIComponent(eventId)}/match-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Failed to publish match request (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  return {
    success: true,
    eventId: data.eventId || eventId,
  };
}

/**
 * Fetch photographer's open matching opportunities (Slide 07)
 */
export async function getPhotographerOpportunities(): Promise<PhotographerOpportunity[]> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/photographer/opportunities`);

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.opportunities || data.items || []);
  return items.map((item: any) => ({
    opportunityId: String(item.id || item.opportunityId),
    eventId: String(item.eventId),
    eventTitle: item.eventTitle || item.title || 'Private Event Brief',
    eventType: item.eventType || item.category || 'Celebration',
    eventDate: item.eventDate || item.date || '',
    startTime: item.startTime || item.time || '',
    endTime: item.endTime,
    venue: item.venue || item.venueName || item.location || 'Venue TBA',
    city: item.city || 'Kigali',
    distanceKm: Number(item.distanceKm ?? item.distance ?? 0),
    minBudget: Number(item.minBudget ?? 0),
    maxBudget: Number(item.maxBudget ?? item.budget ?? 0),
    currency: item.currency || 'RWF',
    expiresAt: item.expiresAt || new Date(Date.now() + 86400000).toISOString(),
    status: item.status || 'PENDING',
    clientName: item.clientName || 'Connekyt Client',
    clientAvatar: item.clientAvatar || item.clientPhoto,
    matchReasons: item.matchReasons || [
      'Available on event date',
      'Matches your coverage area',
      'Budget compatible with rates',
      'Instagram profile eligible',
    ],
  }));
}

/**
 * Photographer approves opportunity ("I'm Available") (Slide 08)
 */
export async function approveOpportunity(opportunityId: string): Promise<void> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/opportunities/${encodeURIComponent(opportunityId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || 'Failed to approve opportunity');
  }
}

/**
 * Photographer declines opportunity (Slide 08)
 */
export async function rejectOpportunity(opportunityId: string): Promise<void> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/opportunities/${encodeURIComponent(opportunityId)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || 'Failed to decline opportunity');
  }
}

/**
 * Client fetches approved candidates for a hybrid event (Slide 09)
 */
export async function getEventCandidates(eventId: string): Promise<CandidateSummary[]> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/events/${encodeURIComponent(eventId)}/candidates`);

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.candidates || data.items || []);
  return items.map((c: any) => ({
    photographerId: String(c.photographerId || c.id),
    photographerName: c.photographerName || c.name || 'Photographer',
    profilePicture: c.profilePicture || c.image || c.avatar,
    rating: Number(c.rating ?? 5.0),
    reviewCount: Number(c.reviewCount ?? c.reviewsCount ?? 0),
    distanceKm: Number(c.distanceKm ?? c.distance ?? 0),
    proposedPackageId: c.proposedPackageId || c.packageId,
    proposedPackageName: c.proposedPackageName || c.packageName || 'Full Event Coverage',
    price: Number(c.price ?? c.packagePrice ?? 0),
    currency: c.currency || 'RWF',
    recommendationTier: (c.recommendationTier || 'HIGH') as RecommendationTier,
    compositeScore: Number(c.compositeScore ?? 90),
    verifiedInstagram: Boolean(c.verifiedInstagram ?? true),
    approvedAt: c.approvedAt,
  }));
}

/**
 * Client selects candidate photographer with 409 concurrency lock handling (Slide 10)
 */
export async function selectEventPhotographer(
  eventId: string,
  payload: SelectPhotographerPayload
): Promise<SelectPhotographerResult> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/events/${encodeURIComponent(eventId)}/select-photographer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || 'This photographer was just booked by another client for this time slot.';
    const err = new Error(message);
    (err as any).code = 'NO_LONGER_AVAILABLE';
    throw err;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || 'Failed to select photographer');
  }

  const data = await res.json();
  return {
    success: true,
    bookingId: data.bookingId,
    eventId: data.eventId || eventId,
    status: data.status || 'ASSIGNED_PENDING_PAYMENT',
    requiresPayment: data.requiresPayment !== false,
    depositAmount: data.depositAmount,
    currency: data.currency || 'RWF',
  };
}

/**
 * 1-click Direct-to-Hybrid rescue conversion (Slide 22)
 */
export async function convertToHybrid(
  eventId: string,
  payload?: Partial<MatchPreviewPayload>
): Promise<{ success: boolean }> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/events/${encodeURIComponent(eventId)}/convert-to-hybrid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || 'Failed to convert event to hybrid matching');
  }

  return { success: true };
}

/**
 * 1-click Hybrid-to-Direct rescue conversion
 */
export async function convertToDirect(
  eventId: string
): Promise<{ success: boolean; data?: any }> {
  const base = getApiUrl();
  const res = await dashboardAuthFetch(`${base}/events/${encodeURIComponent(eventId)}/convert-to-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || 'Failed to convert event to direct booking');
  }

  const json = await res.json().catch(() => ({}));
  return { success: true, data: json?.data };
}
