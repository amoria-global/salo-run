import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import type { PackageBenchmarkStats } from './offerBrief';

/**
 * "Post My Event" (hybrid booking) calls. Every path goes through the
 * /api/proxy route, which only forwards paths under api/remote/. Responses
 * are the backend's envelope ({ action, message, data }) and a 200 can still
 * be a failure, so `action` is checked. Nothing here invents a value the
 * backend didn't send: a failure is thrown, and a missing field stays missing.
 */

export type PhotographerType = 'FREELANCER' | 'STUDIO' | 'ANY';
export type LocationCoverage = 'SAME_CITY' | 'NEARBY_CITY' | 'ANY';
export type SmartMatchTier = 'PREMIUM' | 'PREFERRED' | 'SUGGESTED' | 'ALTERNATIVE';
export type RecommendationTier = 'HIGH' | 'MEDIUM' | 'LOW' | SmartMatchTier;
export type OpportunityDeliveryPolicy = 'CLIENT' | 'PHOTOGRAPHER_PACKAGE';
export type OpportunityPricingMode = 'CLIENT_OFFER' | 'PACKAGE';

export type ApproveOpportunityOptions = {
  deliveryPolicy?: OpportunityDeliveryPolicy;
  pricingMode?: OpportunityPricingMode;
  packageId?: string;
  packageName?: string;
  proposedPrice?: number;
  currency?: string;
  deliveryDays?: number;
  packageDescription?: string;
};

/** What the wizard offers; the same list the iOS and Android apps show. */
export interface HybridOptions {
  enabled: boolean;
  country: string;
  timezone: string;
  currency: string;
  eventTypes: { id: string; name: string }[];
  photographerSpecialties: { value: string; label: string }[];
  cities: { name: string; latitude: number; longitude: number }[];
  photographerTypes: { value: PhotographerType; label: string; description: string }[];
  coverageOptions: { value: LocationCoverage; label: string; description: string }[];
  budgetPresets: { label: string; min: number | null; max: number | null }[];
  timeStepMinutes: number;
  matchWindowHours: number[];
  defaultMatchWindowHours: number;
  inviteWindowMinutes: number;
  firstBatchSize: number;
  escrowOptions: number[];
  instagramRequired: boolean;
  packageBenchmarks?: PackageBenchmarkStats;
}

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
  /** Event type; ranks only. */
  specialty?: string;
  /** Required photographer specialty; filters. */
  photographerSpecialty?: string;
  locationCoverage?: LocationCoverage;
  eventId?: string;
  /** Client deliverables & turnaround scope for internal package recommendation pricing. */
  coverageMode?: string;
  clientType?: string;
  editedPhotos?: number;
  shortVideosQty?: number;
  shortVideosDuration?: string;
  longVideosQty?: number;
  longVideosDuration?: string;
  instantUpdates?: boolean;
  digitalDeliveryDays?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  photoBooksQty?: number;
  photoBookSize?: string;
  photoBookPages?: string;
  photoBookPhotos?: number;
  photoAlbumsQty?: number;
  photoAlbumSize?: string;
  photoAlbumPrints?: string;
  wallPortraitsQty?: number;
  wallPortraitSize?: string;
  wallPortraitFrame?: string;
  printProductionTime?: string;
  printProposedDate?: string;
  printCollectionMethod?: string;
  editingStyle?: string;
  usageRights?: string;
}

export interface MatchPreviewResult {
  count: number;
  matchCount: number;
  durationMinutes?: number;
  durationLabel?: string;
  firstBatchSize?: number;
  tierCounts?: Partial<Record<RecommendationTier, number>>;
  breakdown?: {
    total?: number;
    availableOnDate?: number;
    availableForFullEvent?: number;
    withinBudget?: number;
    typeMatched?: number;
    specialtyMatched?: number;
    inCoverage?: number;
    instagramEnriched?: number;
    sameCity?: number;
    nearbyFallback?: boolean;
  };
  /** Advisory package price bands computed from active uploaded photographer packages. */
  packagePriceLow?: number;
  packagePriceRecommended?: number;
  packagePricePriority?: number;
}

/** Field names are the backend's CreateMatchRequestDTO. */
export interface MatchRequestPayload {
  title?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  photographerType?: PhotographerType;
  specialty?: string;
  photographerSpecialty?: string;
  locationCoverage?: LocationCoverage;
  expirationHours?: number;
  instructions?: string;
  city?: string;
  country?: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  minimumPhotos?: number;
  clientType?: string;
  digitalDeliveryDays?: number;
  printDeliveryMethod?: string;
  printDeliveryAddress?: string;
  printProposedDate?: string;
}

export interface HybridDraftPayload {
  eventId?: string;
  title?: string;
  eventType?: string;
  eventCategoryId?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  venue?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  minBudget?: number;
  maxBudget?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  minimumPhotos?: number;
  draftStep?: 1 | 2 | 3 | 4 | 5;
}

export interface HybridDraftResponse {
  id: string;
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  venue?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  eventStatus?: string;
  bookingStatus?: string;
  isPublished?: boolean;
  updatedAt?: string;
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
  durationHours?: number;
  durationMinutes?: number;
  durationLabel?: string;
  eventStartAt?: string;
  venue?: string;
  city?: string;
  distanceKm?: number;
  distanceLabel?: string;
  sameCity?: boolean;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  expiresAt?: string;
  invitedAt?: string;
  candidateExpiresAt?: string;
  responseDeadlineAt?: string;
  serverNow?: string;
  status: string;
  matchReasons: string[];
  instructions?: string;
  requiredSpecialty?: string;
  photographerTypeRequested?: string;
  matchedPackageId?: string;
  matchedPackageName?: string;
  matchedPackagePrice?: number;
  matchedPackageCurrency?: string;
  matchedPackageDeliveryDays?: number;
  matchedPackageDescription?: string;
  deliveryPolicy?: OpportunityDeliveryPolicy;
  pricingMode?: OpportunityPricingMode;
  proposedPrice?: number;
  hasLiveStream?: boolean;
  allowWishInvites?: boolean;
  minimumPhotos?: number;
}

export interface CandidateSummary {
  candidateId?: string;
  photographerId: string;
  photographerName: string;
  name: string;
  profilePicture?: string;
  avatar?: string;
  photographerType?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  distanceLabel?: string;
  city?: string;
  sameCity?: boolean;
  typicalPriceRange?: string;
  recommendationTier: RecommendationTier;
  smartTier?: SmartMatchTier;
  matchScore?: number;
  primarySpecialty?: string;
  rank?: number;
  instagramHandle?: string;
  instagramFollowers?: number;
  slug?: string;
  about?: string;
  specialties: string[];
  approvedAt?: string;
  deliveryPolicy?: OpportunityDeliveryPolicy;
  packageDeliveryDays?: number;
  packageDeliveryDescription?: string;
  matchedPackageId?: string;
  matchedPackageName?: string;
  matchedPackagePrice?: number;
  matchedPackageCurrency?: string;
  matchedPackagePhotos?: number;
  matchedPackageVideos?: number;
  matchedPackageHours?: number;
  pricingMode?: OpportunityPricingMode;
  proposedPrice?: number;
  agreedPrice?: number;
}

export interface CandidatesOverview {
  eventId: string;
  status?: string;
  bookingMode?: string;
  eventTitle?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  durationLabel?: string;
  eventStartAt?: string;
  city?: string;
  venue?: string;
  minBudget?: number;
  maxBudget?: number;
  candidates: CandidateSummary[];
  tierCounts: Partial<Record<RecommendationTier, number>>;
  matchStatus?: string;
  windowExpiresAt?: string;
  invitedCount: number;
  pendingCount: number;
  declinedCount: number;
  expiredCount: number;
  noLongerAvailableCount: number;
  canRepost: boolean;
  canConvertToDirect: boolean;
  serverNow?: string;
}

export interface SelectPhotographerPayload {
  candidateId?: string;
  photographerId: string;
  packageId?: string;
  agreedPrice?: number;
  proposedPrice?: number;
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
  alreadySelected?: boolean;
}

export interface HybridProfile {
  instagramHandle?: string;
  instagramStatus: 'NONE' | 'PENDING' | 'CONNECTED' | 'NOT_FOUND';
  pendingInstagramHandle?: string;
  pendingInstagramRemoval?: boolean;
  city?: string;
  resolvedCity?: string;
  needsCity: boolean;
  needsInstagram: boolean;
}

const candidatePricingOverrides = new Map<string, ApproveOpportunityOptions>();

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
  noteServerTime((body?.data as any)?.serverNow);
  return body.data;
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);
const tier = (v: unknown): RecommendationTier =>
  v === 'HIGH' || v === 'MEDIUM' || v === 'LOW' ? v : 'LOW';
const smartTier = (v: unknown): SmartMatchTier | undefined =>
  v === 'PREMIUM' || v === 'PREFERRED' || v === 'SUGGESTED' || v === 'ALTERNATIVE' ? v : undefined;

// ───────────────────────── server clock ─────────────────────────

let serverOffsetMs = 0;

function noteServerTime(serverNow: unknown) {
  if (typeof serverNow !== 'string') return;
  const t = Date.parse(serverNow);
  if (Number.isFinite(t)) serverOffsetMs = t - Date.now();
}

export function serverNowMs(): number {
  return Date.now() + serverOffsetMs;
}

export async function syncServerClock(): Promise<void> {
  try {
    const data = await call<Record<string, unknown>>('/public/time', { method: 'GET' }, 'Clock unavailable.');
    noteServerTime(data?.now);
  } catch {
    // Keep the last known offset; countdowns still run.
  }
}

// ───────────────────────── options ─────────────────────────

let optionsCache: Promise<HybridOptions> | null = null;

/** The wizard's choices, fetched once per page load. */
export function getHybridOptions(): Promise<HybridOptions> {
  if (!optionsCache) {
    optionsCache = call<HybridOptions>('/public/hybrid/options', { method: 'GET' }, 'Could not load the event options.')
      .then((d) => {
        if (!d) throw new HybridApiError('Could not load the event options.', 500);
        return d;
      })
      .catch((e) => {
        optionsCache = null;
        throw e;
      });
  }
  return optionsCache;
}

// ───────────────────────── client: post and choose ─────────────────────────

/** Live match count for the wizard. The count is the server's, including 0. */
export async function previewMatchCount(payload: MatchPreviewPayload): Promise<MatchPreviewResult> {
  const data = await call<Record<string, unknown>>(
    '/events/match-preview',
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not count matching photographers.',
  );
  const count = num(data?.matchCount);
  if (count === undefined) throw new HybridApiError('Could not count matching photographers.', 500);
  return {
    count,
    matchCount: count,
    durationMinutes: num(data?.durationMinutes),
    durationLabel: str(data?.durationLabel),
    firstBatchSize: num(data?.firstBatchSize),
    tierCounts: (data?.tierCounts as MatchPreviewResult['tierCounts']) || undefined,
    breakdown: data?.breakdown as MatchPreviewResult['breakdown'],
    packagePriceLow: num(data?.packagePriceLow),
    packagePriceRecommended: num(data?.packagePriceRecommended),
    packagePricePriority: num(data?.packagePricePriority),
  };
}

/** Retrieve the signed-in user's latest unpublished hybrid event offer draft from the server. */
export async function getHybridDraft(): Promise<HybridDraftResponse | null> {
  try {
    const d = await call<Record<string, unknown>>(
      '/events/hybrid-draft',
      { method: 'GET' },
      'Could not load event draft.',
    );
    if (!d || !d.id) return null;
    return {
      id: String(d.id),
      title: str(d.title),
      description: str(d.description),
      eventDate: str(d.eventDate),
      startTime: str(d.startTime),
      endTime: str(d.endTime),
      city: str(d.city),
      venue: str(d.venue),
      location: str(d.location),
      minBudget: num(d.minBudget),
      maxBudget: num(d.maxBudget),
      eventStatus: str(d.eventStatus),
      bookingStatus: str(d.bookingStatus),
      isPublished: typeof d.isPublished === 'boolean' ? d.isPublished : false,
      updatedAt: str(d.updatedAt),
    };
  } catch {
    return null;
  }
}

/** Upsert (autosave) the signed-in user's hybrid event offer draft on the server. */
export async function saveHybridDraft(payload: HybridDraftPayload): Promise<HybridDraftResponse | null> {
  const d = await call<Record<string, unknown>>(
    '/events/hybrid-draft',
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not save event draft.',
  );
  if (!d || !d.id) return null;
  return {
    id: String(d.id),
    title: str(d.title),
    description: str(d.description),
    eventDate: str(d.eventDate),
    startTime: str(d.startTime),
    endTime: str(d.endTime),
    city: str(d.city),
    venue: str(d.venue),
    location: str(d.location),
    minBudget: num(d.minBudget),
    maxBudget: num(d.maxBudget),
    eventStatus: str(d.eventStatus),
    bookingStatus: str(d.bookingStatus),
    isPublished: typeof d.isPublished === 'boolean' ? d.isPublished : false,
    updatedAt: str(d.updatedAt),
  };
}

/** Delete an unpublished hybrid event offer draft on the server. */
export async function deleteHybridDraft(eventId: string): Promise<void> {
  if (!eventId) return;
  try {
    await call(`/events/hybrid-draft/${encodeURIComponent(eventId)}`, { method: 'DELETE' }, 'Could not delete event draft.');
  } catch {
    // Ignore delete failures on already-deleted drafts
  }
}

/** Publish the brief and alert matching photographers. */
export async function publishMatchRequest(
  eventId: string,
  payload: MatchRequestPayload,
): Promise<{ eventId: string; invitedCount?: number; status?: string; alreadyPublished?: boolean }> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/match-request`,
    { method: 'POST', body: JSON.stringify(payload) },
    'Could not post your event to photographers.',
  );
  return {
    eventId,
    invitedCount: num(data?.invitedCount),
    status: str(data?.status),
    alreadyPublished: data?.alreadyPublished === true,
  };
}

function mapCandidate(c: Record<string, unknown>): CandidateSummary {
  const cid = String(c.candidateId ?? '');
  const override = candidatePricingOverrides.get(cid);
  const deliveryPolicy: OpportunityDeliveryPolicy =
    c.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' || override?.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE'
      ? 'PHOTOGRAPHER_PACKAGE'
      : 'CLIENT';
  const rawPricingMode = c.pricingMode ?? override?.pricingMode;
  const pricingMode: OpportunityPricingMode | undefined =
    rawPricingMode === 'PACKAGE' || rawPricingMode === 'CLIENT_OFFER'
      ? rawPricingMode
      : deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' &&
          (num(c.proposedPrice) != null || num(c.matchedPackagePrice) != null || override?.proposedPrice != null)
        ? 'PACKAGE'
        : undefined;
  const matchedPackagePrice =
    (override?.pricingMode === 'PACKAGE' && override?.proposedPrice != null ? override.proposedPrice : undefined) ??
    num(c.matchedPackagePrice) ??
    num(c.proposedPrice);
  const proposedPrice =
    num(c.proposedPrice) ??
    num(c.suggestedPrice) ??
    num(c.agreedPrice) ??
    override?.proposedPrice ??
    (deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' && pricingMode !== 'CLIENT_OFFER' ? matchedPackagePrice : undefined);

  const insta = (c.instagram ?? null) as Record<string, unknown> | null;
  const pName = str(c.name) ?? str(c.photographerName) ?? 'Photographer';
  const pAvatar = str(c.avatar) ?? str(c.profilePicture);
  return {
    candidateId: cid || undefined,
    photographerId: String(c.photographerId ?? ''),
    photographerName: pName,
    name: pName,
    profilePicture: pAvatar,
    avatar: pAvatar,
    photographerType: str(c.photographerType),
    rating: num(c.rating),
    reviewCount: num(c.reviewCount),
    distanceKm: num(c.distanceKm),
    distanceLabel: str(c.distanceLabel),
    city: str(c.city),
    sameCity: c.sameCity === true,
    typicalPriceRange: str(c.typicalPriceRange),
    recommendationTier: tier(c.recommendationTier),
    smartTier: smartTier(c.smartTier),
    matchScore: num(c.matchScore),
    primarySpecialty: str(c.primarySpecialty),
    rank: num(c.rank),
    instagramHandle: insta ? str(insta.handle) : str(c.instagramHandle),
    instagramFollowers: insta ? num(insta.followersCount) : num(c.instagramFollowers),
    slug: str(c.slug),
    about: str(c.about),
    specialties: Array.isArray(c.specialties) ? (c.specialties as string[]) : [],
    approvedAt: str(c.approvedAt),
    deliveryPolicy,
    packageDeliveryDays: override?.deliveryDays ?? num(c.packageDeliveryDays),
    packageDeliveryDescription: override?.packageDescription ?? str(c.packageDeliveryDescription),
    matchedPackageId: override?.packageId ?? str(c.matchedPackageId) ?? str(c.packageId),
    matchedPackageName: override?.packageName ?? str(c.matchedPackageName) ?? str(c.packageName),
    matchedPackagePrice,
    matchedPackageCurrency: override?.currency ?? str(c.matchedPackageCurrency) ?? str(c.currency),
    matchedPackagePhotos: num(c.matchedPackagePhotos),
    matchedPackageVideos: num(c.matchedPackageVideos),
    matchedPackageHours: num(c.matchedPackageHours),
    pricingMode,
    proposedPrice,
    agreedPrice: num(c.agreedPrice) ?? proposedPrice,
  };
}

/** Approved candidates and how the match is going. */
export async function getCandidatesOverview(eventId: string): Promise<CandidatesOverview> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/candidates`,
    { method: 'GET' },
    'Could not load candidates.',
  );
  const items = Array.isArray(data?.candidates) ? (data!.candidates as Record<string, unknown>[]) : [];
  return {
    eventId,
    status: str(data?.status),
    bookingMode: str(data?.bookingMode),
    eventTitle: str(data?.eventTitle),
    eventDate: str(data?.eventDate),
    startTime: str(data?.startTime),
    endTime: str(data?.endTime),
    durationLabel: str(data?.durationLabel),
    eventStartAt: str(data?.eventStartAt),
    city: str(data?.city),
    venue: str(data?.venue),
    minBudget: num(data?.minBudget),
    maxBudget: num(data?.maxBudget),
    candidates: items.map(mapCandidate),
    tierCounts: (data?.tierCounts as CandidatesOverview['tierCounts']) || {},
    matchStatus: str(data?.matchStatus),
    windowExpiresAt: str(data?.windowExpiresAt),
    invitedCount: num(data?.invitedCount) ?? 0,
    pendingCount: num(data?.pendingCount) ?? 0,
    declinedCount: num(data?.declinedCount) ?? 0,
    expiredCount: num(data?.expiredCount) ?? 0,
    noLongerAvailableCount: num(data?.noLongerAvailableCount) ?? 0,
    canRepost: data?.canRepost === true,
    canConvertToDirect: data?.canConvertToDirect === true,
    serverNow: str(data?.serverNow),
  };
}

/** Approved candidates for the client's event, ranked by the server. */
export async function getEventCandidates(eventId: string): Promise<CandidateSummary[]> {
  return (await getCandidatesOverview(eventId)).candidates;
}

/**
 * Select a candidate. Creates the booking and its payment declaration, so it
 * is sent once and never retried; the server answers a repeat with the same
 * booking.
 */
export async function selectEventPhotographer(
  eventId: string,
  payload: SelectPhotographerPayload,
): Promise<SelectPhotographerResult> {
  try {
    const data = await call<Record<string, unknown>>(
      `/events/${encodeURIComponent(eventId)}/select-photographer`,
      {
        method: 'POST',
        body: JSON.stringify({
          candidateId: payload.candidateId,
          photographerId: payload.photographerId,
          packageId: payload.packageId,
          ...(payload.agreedPrice != null ? { agreedPrice: payload.agreedPrice, proposedPrice: payload.proposedPrice ?? payload.agreedPrice } : {}),
          escrowPercentage: payload.escrowPercentage ?? 50,
          notes: payload.notes,
        }),
      },
      'Could not confirm this photographer.',
    );
    return {
      bookingId: String(data?.bookingId ?? ''),
      declarationId: String(data?.declarationId ?? ''),
      eventId,
      depositAmount: num(data?.depositAmount),
      currency: str(data?.currency),
      escrowPercentage: num(data?.escrowPercentage),
      alreadySelected: data?.alreadySelected === true,
    };
  } catch (e) {
    if (e instanceof HybridApiError && (e.status === 409 || e.code === 'NO_LONGER_AVAILABLE')) {
      throw new HybridApiError(
        e.message && e.status === 409 ? e.message : 'This photographer is no longer available for your event. Please choose another.',
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

/** Turn a declined or unassigned direct booking into a posted event. */
export async function convertToHybrid(eventId: string): Promise<{ invitedCount?: number; status?: string }> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/convert-to-hybrid`,
    { method: 'POST' },
    'Could not post this event to photographers.',
  );
  return { invitedCount: num(data?.invitedCount), status: str(data?.status) };
}

/** Stop matching and book from the marketplace instead. */
export async function convertToDirect(eventId: string): Promise<{ data?: Record<string, unknown> }> {
  const data = await call<Record<string, unknown>>(
    `/events/${encodeURIComponent(eventId)}/convert-to-direct`,
    { method: 'POST' },
    'Could not switch this event to Find a Photographer.',
  );
  return { data };
}

// ───────────────────────── photographer: opportunities ─────────────────────────

function mapOpportunity(item: Record<string, unknown>): PhotographerOpportunity {
  const candidateId = String(item.candidateId ?? '');
  const override = candidatePricingOverrides.get(candidateId);
  const deliveryPolicy: OpportunityDeliveryPolicy =
    item.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE' || override?.deliveryPolicy === 'PHOTOGRAPHER_PACKAGE'
      ? 'PHOTOGRAPHER_PACKAGE'
      : 'CLIENT';
  const rawPricingMode = item.pricingMode ?? override?.pricingMode;
  const pricingMode: OpportunityPricingMode | undefined =
    rawPricingMode === 'PACKAGE' || rawPricingMode === 'CLIENT_OFFER' ? rawPricingMode : undefined;

  return {
    opportunityId: candidateId,
    candidateId,
    eventId: String(item.eventId ?? ''),
    eventTitle: str(item.eventTitle) ?? 'Event',
    eventType: str(item.eventType),
    eventDate: str(item.eventDate) ?? '',
    startTime: str(item.startTime) ?? '',
    endTime: str(item.endTime),
    durationHours: num(item.durationHours),
    durationMinutes: num(item.durationMinutes),
    durationLabel: str(item.durationLabel),
    eventStartAt: str(item.eventStartAt),
    venue: str(item.venue),
    city: str(item.city),
    distanceKm: num(item.distanceKm),
    distanceLabel: str(item.distanceLabel),
    sameCity: item.sameCity === true,
    minBudget: num(item.minBudget),
    maxBudget: num(item.maxBudget),
    currency: str(item.currency),
    expiresAt: str(item.expiresAt),
    invitedAt: str(item.invitedAt),
    candidateExpiresAt: str(item.candidateExpiresAt),
    responseDeadlineAt: str(item.responseDeadlineAt) ?? str(item.candidateExpiresAt),
    serverNow: str(item.serverNow),
    status: str(item.status) ?? 'INVITED',
    matchReasons: Array.isArray(item.matchReasons) ? (item.matchReasons as string[]) : [],
    instructions: str(item.instructions),
    requiredSpecialty: str(item.requiredSpecialty),
    photographerTypeRequested: str(item.photographerTypeRequested),
    matchedPackageId: override?.packageId ?? str(item.matchedPackageId),
    matchedPackageName: override?.packageName ?? str(item.matchedPackageName),
    matchedPackagePrice:
      (override?.pricingMode === 'PACKAGE' && override?.proposedPrice != null ? override.proposedPrice : undefined) ??
      num(item.matchedPackagePrice),
    matchedPackageCurrency: override?.currency ?? str(item.matchedPackageCurrency),
    matchedPackageDeliveryDays: override?.deliveryDays ?? num(item.matchedPackageDeliveryDays),
    matchedPackageDescription: override?.packageDescription ?? str(item.matchedPackageDescription),
    deliveryPolicy,
    pricingMode,
    proposedPrice: num(item.proposedPrice) ?? override?.proposedPrice,
    hasLiveStream: typeof item.hasLiveStream === 'boolean' ? item.hasLiveStream : undefined,
    allowWishInvites: typeof item.allowWishInvites === 'boolean' ? item.allowWishInvites : undefined,
    minimumPhotos: num(item.minimumPhotos),
  };
}

export type OpportunityFilter = 'PENDING_RESPONSE' | 'APPROVED' | 'ALL';

export async function getPhotographerOpportunities(filter: OpportunityFilter = 'PENDING_RESPONSE'): Promise<PhotographerOpportunity[]> {
  const data = await call<unknown>(
    `/photographer/opportunities?status=${filter}`,
    { method: 'GET' },
    'Could not load opportunities.',
  );
  const items = Array.isArray(data) ? data : [];
  if (items[0] && typeof items[0] === 'object') noteServerTime((items[0] as any).serverNow);
  return items.map((item: Record<string, unknown>) => mapOpportunity(item));
}

export async function getPhotographerOpportunity(candidateId: string): Promise<PhotographerOpportunity> {
  const data = await call<Record<string, unknown>>(
    `/photographer/opportunities/${encodeURIComponent(candidateId)}`,
    { method: 'GET' },
    'Could not load this opportunity.',
  );
  if (!data) throw new HybridApiError('Could not load this opportunity.', 500);
  return mapOpportunity(data);
}

export async function getOpportunityCounts(): Promise<{ pending: number; awaitingClient: number }> {
  const data = await call<Record<string, unknown>>(
    '/photographer/opportunities/count',
    { method: 'GET' },
    'Could not load opportunity counts.',
  );
  return { pending: num(data?.pending) ?? 0, awaitingClient: num(data?.awaitingClient) ?? 0 };
}

export async function approveOpportunity(opportunityId: string, options?: ApproveOpportunityOptions): Promise<void> {
  if (options) {
    candidatePricingOverrides.set(opportunityId, options);
  }
  const body: Record<string, unknown> = {};
  if (options?.deliveryPolicy) body.deliveryPolicy = options.deliveryPolicy;
  if (options?.pricingMode) body.pricingMode = options.pricingMode;
  if (options?.packageId) {
    body.packageId = options.packageId;
    body.matchedPackageId = options.packageId;
  }
  if (options?.packageName) {
    body.packageName = options.packageName;
    body.matchedPackageName = options.packageName;
  }
  if (options?.proposedPrice != null) {
    body.proposedPrice = options.proposedPrice;
    body.suggestedPrice = options.proposedPrice;
    body.matchedPackagePrice = options.proposedPrice;
  }
  if (options?.currency) {
    body.currency = options.currency;
    body.matchedPackageCurrency = options.currency;
  }
  if (options?.deliveryDays != null) {
    body.packageDeliveryDays = options.deliveryDays;
    body.deliveryDays = options.deliveryDays;
  }
  if (options?.packageDescription) {
    body.packageDeliveryDescription = options.packageDescription;
  }
  const hasBody = Object.keys(body).length > 0;
  await call(
    `/opportunities/${encodeURIComponent(opportunityId)}/approve`,
    { method: 'POST', ...(hasBody ? { body: JSON.stringify(body) } : {}) },
    'Could not approve this opportunity.',
  );
}

export async function rejectOpportunity(opportunityId: string, reason?: string): Promise<void> {
  await call(
    `/opportunities/${encodeURIComponent(opportunityId)}/reject`,
    { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) },
    'Could not decline this opportunity.',
  );
}

// ───────────────────────── photographer: matching profile ─────────────────────────

export async function getHybridProfile(): Promise<HybridProfile> {
  const data = await call<Record<string, unknown>>('/photographer/hybrid-profile', { method: 'GET' }, 'Could not load your matching profile.');
  return mapProfile(data);
}

export async function saveHybridProfile(update: { instagramHandle?: string; city?: string }): Promise<HybridProfile> {
  const data = await call<Record<string, unknown>>(
    '/photographer/hybrid-profile',
    { method: 'PUT', body: JSON.stringify(update) },
    'Could not save. Please try again.',
  );
  return mapProfile(data);
}

function mapProfile(data: Record<string, unknown> | undefined): HybridProfile {
  const status = str(data?.instagramStatus);
  return {
    instagramHandle: str(data?.instagramHandle),
    instagramStatus: status === 'CONNECTED' || status === 'PENDING' || status === 'NOT_FOUND' ? status : 'NONE',
    pendingInstagramHandle: str(data?.pendingInstagramHandle),
    pendingInstagramRemoval: data?.pendingInstagramRemoval === true,
    city: str(data?.city),
    resolvedCity: str(data?.resolvedCity),
    needsCity: data?.needsCity === true,
    needsInstagram: data?.needsInstagram === true,
  };
}

// ───────────────────────── formatting shared by the screens ─────────────────────────

export function formatRwf(n?: number | null): string {
  if (n === undefined || n === null) return '';
  return `${Math.round(n).toLocaleString('en-US')} RWF`;
}

export function budgetLabel(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${Math.round(min).toLocaleString('en-US')} - ${formatRwf(max)}`;
  if (max != null) return `Up to ${formatRwf(max)}`;
  return `From ${formatRwf(min)}`;
}

/** "18:00:00" to "18:00". */
export const hhmm = (t?: string) => (t ? t.slice(0, 5) : '');

/** Minutes between two "HH:mm" times; an end at or before the start runs past midnight. */
export function durationBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins;
}

export function durationText(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hrs = h === 0 ? '' : `${h} ${h === 1 ? 'hr' : 'hrs'}`;
  return m === 0 ? hrs : `${hrs ? hrs + ' ' : ''}${m} min`;
}

export const TIER_META: Record<RecommendationTier, { label: string; hint: string; color: string; bg: string; icon: string }> = {
  HIGH: { label: 'Top match', hint: 'Closest fit to what you asked for', color: '#047857', bg: 'rgba(16,185,129,0.12)', icon: 'bi-stars' },
  MEDIUM: { label: 'Good match', hint: 'Fits most of your requirements', color: '#083A85', bg: 'rgba(8,58,133,0.10)', icon: 'bi-hand-thumbs-up' },
  LOW: { label: 'Possible match', hint: 'Available, with fewer requirements matched', color: '#9A3412', bg: 'rgba(234,88,12,0.10)', icon: 'bi-check2' },
  PREMIUM: { label: 'Premium choice', hint: 'Strongest all-round fit for your event', color: '#D9621A', bg: 'rgba(217,98,26,0.12)', icon: 'bi-star-fill' },
  PREFERRED: { label: 'Preferred choice', hint: 'A very good fit for your event', color: '#F20C8F', bg: 'rgba(238,14,143,0.10)', icon: 'bi-award' },
  SUGGESTED: { label: 'Suggested choice', hint: 'A solid option worth a look', color: '#083A85', bg: 'rgba(62,111,216,0.14)', icon: 'bi-people' },
  ALTERNATIVE: { label: 'Alternative choice', hint: 'Available, with a looser fit', color: '#64748B', bg: 'rgba(147,163,190,0.16)', icon: 'bi-person' },
};

export const SMART_TIER_ORDER: SmartMatchTier[] = ['PREMIUM', 'PREFERRED', 'SUGGESTED', 'ALTERNATIVE'];

export function smartTierOf(c: { smartTier?: SmartMatchTier; recommendationTier: RecommendationTier }): SmartMatchTier {
  if (c.smartTier) return c.smartTier;
  const t = c.recommendationTier;
  if (t === 'HIGH') return 'PREMIUM';
  if (t === 'MEDIUM') return 'PREFERRED';
  if (t === 'LOW') return 'SUGGESTED';
  return t;
}
