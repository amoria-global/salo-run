/**
 * Photographer-hosted events: a photographer creates an event and streams it themselves.
 *
 * Backend (PhotographerHostedEventController @ /api/remote/photographer/hosted-events), behind a server flag.
 * The server decides who may host; the dashboard only reads that answer:
 *   GET  /eligibility       -> { enabled, canHostFree, canHostPaid, reason }
 *   POST /                  -> the created event (the host is both creator and streamer)
 *   GET  /?bucket=          -> the host's own events
 *   GET  /earnings-preview  -> what the host keeps of a ticket, computed by the server
 * Cover photo and publishing reuse the existing /customer/events/{id}/photo and /publish endpoints.
 *
 * Every function takes the authenticated fetch as an argument so the logic is testable without a session.
 */

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export type HostingReason = 'HOSTING_DISABLED' | 'NOT_A_PHOTOGRAPHER' | 'KYC_REQUIRED_FOR_PAID';

export type HostingEligibility = {
  enabled: boolean;
  canHostFree: boolean;
  canHostPaid: boolean;
  reason: HostingReason | null;
};

export type HostedEventInput = {
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  streamFee?: number;
  streamFeeCurrencyId?: string;
};

export type HostedEvent = {
  id: string;
  title: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  streamStatus?: string;
  /** The publication flag. Unpublished events stay listed for the host with an "Unpublished" badge. */
  published: boolean;
  streamFee?: number;
};

export type EarningsPreview = { hostPercent: string; platformPercent: string; hostEarnsPerTicket: number };
import { getEventStatus, type EventStatus } from '@/lib/events/eventStatus';

export type HostedBucket = 'upcoming' | 'live' | 'ended';

const REASONS: HostingReason[] = ['HOSTING_DISABLED', 'NOT_A_PHOTOGRAPHER', 'KYC_REQUIRED_FOR_PAID'];
const BASE = '/api/remote/photographer/hosted-events';

type Raw = Record<string, unknown>;

class HostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HostError';
  }
}

async function envelope(res: Response, fallback: string): Promise<Raw> {
  const body = (await res.json().catch(() => ({}))) as Raw;
  // HTTP 200 with action 0 is a refusal.
  if (!res.ok || body.action === 0) {
    throw new HostError(typeof body.message === 'string' && body.message ? body.message : fallback);
  }
  return body;
}

export function parseEligibility(data: unknown): HostingEligibility {
  const d = (data ?? {}) as Raw;
  return {
    enabled: d.enabled === true,
    canHostFree: d.canHostFree === true,
    canHostPaid: d.canHostPaid === true,
    reason: REASONS.find((r) => r === d.reason) ?? null,
  };
}

export async function getEligibility(apiUrl: string, fetcher: Fetcher): Promise<HostingEligibility> {
  const body = await envelope(await fetcher(`${apiUrl}${BASE}/eligibility`), 'Could not check hosting.');
  return parseEligibility(body.data);
}

export function mapHostedEvent(r: Raw): HostedEvent {
  const fee = typeof r.streamFee === 'number' ? r.streamFee : Number(r.streamFee);
  return {
    id: String(r.id ?? ''),
    title: typeof r.title === 'string' ? r.title : 'Untitled event',
    eventDate: typeof r.eventDate === 'string' ? r.eventDate : undefined,
    startTime: typeof r.startTime === 'string' ? r.startTime : undefined,
    endTime: typeof r.endTime === 'string' ? r.endTime : undefined,
    streamStatus: typeof r.streamStatus === 'string' ? r.streamStatus : undefined,
    published: r.isPublished === true || r.published === true,
    status: typeof r.eventStatus === 'string' ? r.eventStatus : typeof r.status === 'string' ? r.status : undefined,
    streamFee: Number.isFinite(fee) && fee > 0 ? fee : undefined,
  };
}

export async function listHostedEvents(apiUrl: string, fetcher: Fetcher): Promise<HostedEvent[]> {
  const body = await envelope(await fetcher(`${apiUrl}${BASE}`), 'Could not load your events.');
  return (Array.isArray(body.data) ? (body.data as Raw[]) : []).map(mapHostedEvent).filter((e) => e.id);
}

export async function createHostedEvent(apiUrl: string, fetcher: Fetcher, input: HostedEventInput): Promise<HostedEvent> {
  const res = await fetcher(`${apiUrl}${BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const event = mapHostedEvent(((await envelope(res, 'Could not create the event.')).data ?? {}) as Raw);
  if (!event.id) throw new HostError('The server did not return the new event.');
  return event;
}

export async function uploadCover(apiUrl: string, fetcher: Fetcher, eventId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  await envelope(
    await fetcher(`${apiUrl}/api/remote/customer/events/${encodeURIComponent(eventId)}/photo`, { method: 'POST', body: form }),
    'The cover photo could not be uploaded.',
  );
}

export async function publishHostedEvent(apiUrl: string, fetcher: Fetcher, eventId: string): Promise<void> {
  await envelope(
    await fetcher(`${apiUrl}/api/remote/customer/events/${encodeURIComponent(eventId)}/publish`, { method: 'POST' }),
    'Could not publish the event.',
  );
}

export async function getEarningsPreview(apiUrl: string, fetcher: Fetcher, fee: number): Promise<EarningsPreview> {
  const body = await envelope(
    await fetcher(`${apiUrl}${BASE}/earnings-preview?fee=${encodeURIComponent(String(fee))}`),
    'Could not load the earnings preview.',
  );
  const d = (body.data ?? {}) as Raw;
  const earns = typeof d.hostEarnsPerTicket === 'number' ? d.hostEarnsPerTicket : Number(d.hostEarnsPerTicket);
  return {
    hostPercent: String(d.hostPercent ?? ''),
    platformPercent: String(d.platformPercent ?? ''),
    hostEarnsPerTicket: Number.isFinite(earns) ? earns : 0,
  };
}

// The publish sequence, resumable.

export type HostProgress = { eventId?: string; coverDone?: boolean };
export type HostDeps = {
  create: (input: HostedEventInput) => Promise<{ id: string }>;
  uploadCover: (eventId: string, file: File) => Promise<void>;
  publish: (eventId: string) => Promise<void>;
};
export type HostResult =
  | { status: 'done'; eventId: string; progress: HostProgress }
  | { status: 'failed'; step: 'create' | 'cover' | 'publish'; message: string; progress: HostProgress };

const messageOf = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

/**
 * create -> cover -> publish. A step that succeeded is not repeated on retry, so a failure after create
 * never leads to a second event, and the caller treats the event as live-ready only when status is 'done'.
 */
export async function runHostFlow(
  deps: HostDeps,
  input: HostedEventInput,
  cover: File,
  previous: HostProgress = {},
): Promise<HostResult> {
  const progress: HostProgress = { ...previous };
  if (!progress.eventId) {
    try {
      progress.eventId = (await deps.create(input)).id;
    } catch (e) {
      return { status: 'failed', step: 'create', message: messageOf(e, 'Could not create the event.'), progress };
    }
  }
  if (!progress.coverDone) {
    try {
      await deps.uploadCover(progress.eventId, cover);
      progress.coverDone = true;
    } catch (e) {
      return { status: 'failed', step: 'cover', message: messageOf(e, 'The cover photo could not be uploaded.'), progress };
    }
  }
  try {
    await deps.publish(progress.eventId);
  } catch (e) {
    return { status: 'failed', step: 'publish', message: messageOf(e, 'Could not publish the event.'), progress };
  }
  return { status: 'done', eventId: progress.eventId, progress };
}

export type HostForm = { title: string; date: string; startTime: string; paid: boolean; price: string };
export type HostFormErrors = Partial<Record<'title' | 'date' | 'startTime' | 'price' | 'cover', string>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateHostForm(form: HostForm, hasCover: boolean, today: string): HostFormErrors {
  const errors: HostFormErrors = {};
  if (form.title.trim().length < 3) errors.title = 'Give your event a title of at least 3 characters.';
  if (!DATE.test(form.date) || Number.isNaN(Date.parse(form.date))) errors.date = 'Pick a date.';
  else if (form.date < today) errors.date = 'The date cannot be in the past.';
  if (form.startTime.trim() !== '' && !TIME.test(form.startTime.trim())) errors.startTime = 'Use 24-hour time, like 18:30.';
  if (form.paid) {
    const n = Number(form.price);
    if (!Number.isFinite(n) || n <= 0) errors.price = 'Enter a price above zero.';
  }
  if (!hasCover) errors.cover = 'Add a cover photo.';
  return errors;
}

export function bucketOf(event?: string | HostedEvent, now: number = Date.now()): HostedBucket {
  if (event && typeof event === 'object') {
    const s = getEventStatus(event, now);
    return s === 'LIVE' ? 'live' : s === 'ENDED' ? 'ended' : 'upcoming';
  }
  const s = (event ?? '').toUpperCase();
  if (s === 'ONGOING' || s === 'LIVE') return 'live';
  if (s === 'COMPLETED' || s === 'ENDED') return 'ended';
  return 'upcoming';
}

/** Publish or unpublish, through the endpoints the booked-events page already uses. */
export async function setEventPublished(apiUrl: string, fetcher: Fetcher, eventId: string, published: boolean): Promise<void> {
  await envelope(
    await fetcher(`${apiUrl}/api/remote/customer/events/${encodeURIComponent(eventId)}/${published ? 'publish' : 'unpublish'}`, { method: 'POST' }),
    published ? 'Could not republish the event.' : 'Could not unpublish the event.',
  );
}

/** The server hides and restores an ended event by flipping only its publish flag (deployed 2026-10-28). */
export const ENDED_UNPUBLISH_SUPPORTED = true;

export type UnpublishImpact = { bookings?: number; ticketsSold?: number };

/** Bookings and sold tickets the confirm dialog warns about. Never throws: no warning beats a blocked dialog. */
export async function getUnpublishImpact(apiUrl: string, fetcher: Fetcher, eventId: string): Promise<UnpublishImpact | undefined> {
  try {
    const res = await fetcher(`${apiUrl}/api/remote/customer/events/${encodeURIComponent(eventId)}/unpublish-impact`, { method: 'GET' });
    const body = (await res.json().catch(() => ({}))) as { action?: number; data?: UnpublishImpact };
    return res.ok && body.action === 1 ? body.data : undefined;
  } catch {
    return undefined;
  }
}

export function unpublishWarning(impact?: UnpublishImpact): string | undefined {
  const parts: string[] = [];
  if (impact?.bookings) parts.push(`${impact.bookings} booking${impact.bookings === 1 ? '' : 's'}`);
  if (impact?.ticketsSold) parts.push(`${impact.ticketsSold} ticket${impact.ticketsSold === 1 ? '' : 's'} sold`);
  return parts.length ? `This event has ${parts.join(' and ')}. People who already have one will not be able to open the public page.` : undefined;
}

export type PublishAction = { kind: 'unpublish' } | { kind: 'republish' } | { kind: 'blocked'; reason: string } | { kind: 'none' };

export function publishActionFor(published: boolean, status: EventStatus, endedSupported = ENDED_UNPUBLISH_SUPPORTED): PublishAction {
  if (status === 'LIVE') return { kind: 'blocked', reason: 'End the stream first' };
  if (!published) return endedSupported || status !== 'ENDED' ? { kind: 'republish' } : { kind: 'none' };
  if (status === 'ENDED' && !endedSupported) return { kind: 'none' };
  return { kind: 'unpublish' };
}

export const UNPUBLISH_BODY = 'It will be hidden from Explore and its public link will stop working. Your photos, wishes and data are kept, and you can republish it at any time.';
