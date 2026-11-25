/**
 * Photobooks on the web: the same model as the mobile app (src/features/photobooks), against the same backend.
 *
 * A book is a photo selection from event, free, purchased or content albums of ONE photographer. The server decides what
 * each viewer may see: originals only for owners and buyers, a watermarked thumbnail (or no url) for everyone else, and
 * only photos the person may add are ever listed by the picker. Statuses are the backend's real ones:
 * DRAFT, SENT_TO_PHOTOGRAPHER, PHOTOGRAPHER_EDITING, PENDING_PAYMENT, RESUBMITTED, COMPLETED. There is no Published or
 * Delivered status, and a COMPLETED book the photographer closed is "Closed by photographer".
 */
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';

export type Shelf = 'mine' | 'received';
export type Bucket = 'progress' | 'needs' | 'done';
export type FilterKey = 'all' | Bucket;
export type Tone = 'success' | 'pending' | 'error' | 'info' | 'neutral' | 'accent';
export type SourceKey = 'event' | 'free' | 'purchased' | 'content' | 'mine';

export type PbPhoto = { id: string; url?: string; /** The public thumbnail: safe for grids, needs no session. */ thumb?: string; caption?: string; sourceType?: string; original: boolean; watermarked: boolean };

export type Pb = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  coverImage?: string;
  toName?: string;
  senderName?: string;
  mediaCount: number;
  createdAt?: string;
  sentAt?: string;
  editedAt?: string;
  resubmittedAt?: string;
  completedAt?: string;
  changeRequestedAt?: string;
  changeRequestNote?: string;
  closedByPhotographer: boolean;
  layout?: string;
  eventId?: string;
  sourceType?: string;
  sources: string[];
  photos: PbPhoto[];
  freePhotosLimit?: number;
  extraPhotosCount?: number;
  extraPhotosAmount?: number;
  pricePerExtraPhoto?: number;
  paymentRequired: boolean;
  paymentDeclarationId?: string;
  currencyId?: string;
};

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);

export function mapPb(r: Raw): Pb {
  const items = Array.isArray(r.mediaItems) ? (r.mediaItems as Raw[]) : [];
  return {
    id: String(r.id ?? ''),
    name: str(r.name) ?? 'Photobook',
    description: str(r.description),
    status: str(r.status),
    coverImage: normalizeImageUrl(str(r.coverImage)) || undefined,
    toName: str(r.photographerName),
    senderName: str(r.senderName),
    mediaCount: num(r.mediaCount) ?? items.length,
    createdAt: str(r.createdAt),
    sentAt: str(r.sentAt),
    editedAt: str(r.editedAt),
    resubmittedAt: str(r.resubmittedAt),
    completedAt: str(r.completedAt),
    changeRequestedAt: str(r.changeRequestedAt),
    changeRequestNote: str(r.changeRequestNote),
    closedByPhotographer: r.closedByPhotographer === true,
    layout: str(r.layout),
    eventId: str(r.eventId),
    sourceType: str(r.sourceType),
    sources: Array.isArray(r.sources) ? (r.sources as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    photos: items.map((m) => ({
      id: String(m.id ?? ''),
      url: normalizeImageUrl(str(m.fileUrl)) || undefined,
      thumb: normalizeImageUrl(str(m.thumbUrl)) || undefined,
      caption: str(m.caption),
      sourceType: str(m.sourceType),
      original: m.original === true,
      watermarked: m.watermarked === true,
    })).filter((p) => p.id),
    freePhotosLimit: num(r.freePhotosLimit),
    extraPhotosCount: num(r.extraPhotosCount),
    extraPhotosAmount: num(r.extraPhotosAmount),
    pricePerExtraPhoto: num(r.pricePerExtraPhoto),
    paymentRequired: r.paymentRequired === true,
    paymentDeclarationId: str(r.paymentDeclarationId),
    currencyId: str(r.currencyId),
  };
}

// Status, filters, action, timeline

export type StatusKey = 'st_draft' | 'st_with' | 'st_editing' | 'st_pay' | 'st_review' | 'st_done' | 'st_closed' | 'st_new' | 'st_changes' | 'st_wait_pay' | 'st_wait_review';
export type StatusInfo = { key: StatusKey; tone: Tone; bucket: Bucket; raw?: string };
type StatusFields = Pick<Pb, 'status' | 'closedByPhotographer' | 'changeRequestedAt'>;

export function statusInfo(b: StatusFields, shelf: Shelf = 'mine'): StatusInfo {
  const s = (b.status ?? '').toUpperCase();
  if (s === 'COMPLETED') {
    return b.closedByPhotographer ? { key: 'st_closed', tone: 'neutral', bucket: 'done' } : { key: 'st_done', tone: 'success', bucket: 'done' };
  }
  if (shelf === 'received') {
    switch (s) {
      case 'SENT_TO_PHOTOGRAPHER':
        return b.changeRequestedAt ? { key: 'st_changes', tone: 'accent', bucket: 'needs' } : { key: 'st_new', tone: 'accent', bucket: 'needs' };
      case 'PHOTOGRAPHER_EDITING':
        return { key: 'st_editing', tone: 'info', bucket: 'progress' };
      case 'PENDING_PAYMENT':
        return { key: 'st_wait_pay', tone: 'neutral', bucket: 'progress' };
      case 'RESUBMITTED':
        return { key: 'st_wait_review', tone: 'neutral', bucket: 'progress' };
      default:
        return { key: 'st_draft', tone: 'neutral', bucket: 'progress', raw: b.status };
    }
  }
  switch (s) {
    case 'DRAFT': return { key: 'st_draft', tone: 'neutral', bucket: 'progress' };
    case 'SENT_TO_PHOTOGRAPHER': return { key: 'st_with', tone: 'info', bucket: 'progress' };
    case 'PHOTOGRAPHER_EDITING': return { key: 'st_editing', tone: 'info', bucket: 'progress' };
    case 'PENDING_PAYMENT': return { key: 'st_pay', tone: 'pending', bucket: 'needs' };
    case 'RESUBMITTED': return { key: 'st_review', tone: 'accent', bucket: 'needs' };
    default: return { key: 'st_draft', tone: 'neutral', bucket: 'progress', raw: b.status };
  }
}

export function filterBooks<T extends StatusFields & { name: string; description?: string; toName?: string; senderName?: string }>(
  books: T[], shelf: Shelf, filter: FilterKey, query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return books.filter((b) => {
    if (filter !== 'all' && statusInfo(b, shelf).bucket !== filter) return false;
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || (b.description ?? '').toLowerCase().includes(q)
      || (b.toName ?? '').toLowerCase().includes(q) || (b.senderName ?? '').toLowerCase().includes(q);
  });
}

export function bucketCounts(books: StatusFields[], shelf: Shelf): Record<FilterKey, number> {
  const c: Record<FilterKey, number> = { all: books.length, progress: 0, needs: 0, done: 0 };
  for (const b of books) c[statusInfo(b, shelf).bucket] += 1;
  return c;
}

const SOURCE_ORDER: SourceKey[] = ['event', 'free', 'purchased', 'content', 'mine'];
export const SOURCE_TONE: Record<SourceKey, Tone> = { event: 'info', free: 'success', purchased: 'pending', content: 'neutral', mine: 'neutral' };

export function sourcesOf(b: Pick<Pb, 'sources' | 'sourceType'>): SourceKey[] {
  const raw = (b.sources.length ? b.sources : b.sourceType ? [b.sourceType] : []).map((s) => s.toLowerCase());
  return SOURCE_ORDER.filter((k) => raw.includes(k));
}

export type NextAction = 'send' | 'pay' | 'review' | 'edit' | 'resubmit' | 'wait' | 'none';

export function nextAction(b: Pick<Pb, 'status'>, shelf: Shelf, hasPhotos: boolean): NextAction {
  const s = (b.status ?? '').toUpperCase();
  if (s === 'COMPLETED') return 'none';
  if (shelf === 'received') {
    if (s === 'SENT_TO_PHOTOGRAPHER') return 'edit';
    if (s === 'PHOTOGRAPHER_EDITING') return 'resubmit';
    return 'wait';
  }
  if (s === 'DRAFT') return hasPhotos ? 'send' : 'none';
  if (s === 'PENDING_PAYMENT') return 'pay';
  if (s === 'RESUBMITTED') return 'review';
  return 'wait';
}

export type TimelineKey = 'tl_created' | 'tl_sent' | 'tl_edited' | 'tl_payment' | 'tl_review' | 'tl_done' | 'tl_closed';
export type TimelineStep = { key: TimelineKey; state: 'done' | 'current' | 'todo'; date?: string };
const ORDER: Record<string, number> = { DRAFT: 0, SENT_TO_PHOTOGRAPHER: 1, PHOTOGRAPHER_EDITING: 2, PENDING_PAYMENT: 3, RESUBMITTED: 4, COMPLETED: 5 };

export function timelineOf(b: Pb): TimelineStep[] {
  const s = (b.status ?? '').toUpperCase();
  const at = ORDER[s] ?? 0;
  const withPayment = (b.extraPhotosAmount ?? 0) > 0 || s === 'PENDING_PAYMENT';
  const mk = (key: TimelineKey, step: number, date?: string): TimelineStep => ({
    key, date, state: s === 'COMPLETED' || step < at ? 'done' : step === at ? 'current' : 'todo',
  });
  const steps: TimelineStep[] = [mk('tl_created', -1, b.createdAt), mk('tl_sent', 1, b.sentAt), mk('tl_edited', 2, b.editedAt)];
  if (withPayment) steps.push(mk('tl_payment', 3));
  steps.push(mk('tl_review', 4, b.resubmittedAt));
  steps.push({ key: b.closedByPhotographer ? 'tl_closed' : 'tl_done', date: b.completedAt, state: s === 'COMPLETED' ? 'done' : 'todo' });
  if (s === 'DRAFT') steps[0].state = 'done';
  if (s === 'SENT_TO_PHOTOGRAPHER' && b.changeRequestedAt) {
    const edited = steps.find((x) => x.key === 'tl_edited');
    if (edited) edited.state = 'current';
  }
  return steps;
}

// API

const base = () => `${getApiUrl()}/api/remote`;
const rows = (d: unknown): Raw[] => (Array.isArray(d) ? (d as Raw[]) : Array.isArray((d as { content?: unknown })?.content) ? ((d as { content: Raw[] }).content) : []);

export class PbError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function call(path: string, init?: RequestInit): Promise<Raw> {
  const res = await dashboardAuthFetch(`${base()}${path}`, init);
  const body = (await res.json().catch(() => null)) as Raw | null;
  // An HTTP 200 carrying action 0 is a failure.
  if (!res.ok || (body && body.action === 0)) throw new PbError(str(body?.message) ?? 'Something went wrong. Try again.', res.status);
  return body ?? {};
}
const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Which API namespace the signed-in role uses for its own books (coordinators have their own). */
export const ownerPrefix = (role: 'client' | 'photographer' | 'event-coordinator') => (role === 'event-coordinator' ? 'coordinator' : 'customer/events');

export async function listMine(role: 'client' | 'photographer' | 'event-coordinator'): Promise<Pb[]> {
  const b = await call(`/${ownerPrefix(role)}/photobooks`);
  return rows(b.data).map(mapPb).filter((p) => p.id);
}
export async function listReceived(): Promise<Pb[]> {
  const b = await call('/photographer/photobooks');
  return rows(b.data).map(mapPb).filter((p) => p.id);
}
export async function getBook(id: string, role: 'client' | 'photographer' | 'event-coordinator', received: boolean): Promise<Pb> {
  const b = await call(received ? `/photographer/photobooks/${id}` : `/${ownerPrefix(role)}/photobooks/${id}`);
  return mapPb((b.data ?? {}) as Raw);
}
export const sendBook = (id: string, role: 'client' | 'photographer' | 'event-coordinator') => call(`/${ownerPrefix(role)}/photobook/${id}/send`, { method: 'POST' });
export const acceptBook = (id: string, role: 'client' | 'photographer' | 'event-coordinator') => call(`/${ownerPrefix(role)}/photobook/${id}/accept`, { method: 'POST' });
export const requestChanges = (id: string, role: 'client' | 'photographer' | 'event-coordinator', note: string) =>
  call(`/${ownerPrefix(role)}/photobook/${id}/request-changes`, json({ note: note.trim() }));
export const deleteDraft = (id: string, role: 'client' | 'photographer' | 'event-coordinator') => call(`/${ownerPrefix(role)}/photobook/${id}`, { method: 'DELETE' });
export const resubmitBook = (id: string) => call(`/photographer/photobooks/${id}/resubmit`, { method: 'POST' });
export const closeBook = (id: string) => call(`/photographer/photobooks/${id}`, { method: 'DELETE' });
export const saveEdits = (id: string, mediaIds: string[]) =>
  call(`/photographer/photobooks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaIds }) });

export type CreateInput = { name: string; mediaIds: string[]; layout: string; coverImage?: string; eventId?: string };
export async function createBook(input: CreateInput): Promise<Pb> {
  const b = await call('/customer/events/photobook', json(input));
  return mapPb((b.data ?? {}) as Raw);
}

export type PickerAlbum = {
  id: string; title: string; sourceType: string; priced: boolean; photoCount: number; usableCount: number;
  ownerId?: string; ownerName?: string; eventId?: string; eventTitle?: string; coverUrl?: string;
};
export type PickerPhoto = { id: string; thumbUrl?: string; sourceType: string; caption?: string };

export async function listPickerAlbums(): Promise<PickerAlbum[]> {
  const b = await call('/customer/events/photobook/sources');
  return rows(b.data).map((r) => ({
    id: String(r.id ?? ''), title: str(r.title) ?? 'Album', sourceType: str(r.sourceType) ?? 'event', priced: r.priced === true,
    photoCount: num(r.photoCount) ?? 0, usableCount: num(r.usableCount) ?? 0, ownerId: str(r.ownerId), ownerName: str(r.ownerName),
    eventId: str(r.eventId), eventTitle: str(r.eventTitle), coverUrl: normalizeImageUrl(str(r.coverUrl)) || undefined,
  })).filter((a) => a.id);
}
export async function listPickerPhotos(albumId: string): Promise<PickerPhoto[]> {
  const b = await call(`/customer/events/photobook/sources/${albumId}/photos?page=0&size=300`);
  const d = (b.data ?? {}) as Raw;
  return (Array.isArray(d.items) ? (d.items as Raw[]) : []).map((r) => ({
    id: String(r.id ?? ''), thumbUrl: normalizeImageUrl(str(r.thumbUrl)) || undefined, sourceType: str(r.sourceType) ?? 'event', caption: str(r.caption),
  })).filter((p) => p.id);
}
export async function eventTerms(eventId: string): Promise<{ freePhotosLimit: number; pricePerExtraPhoto: number; title?: string }> {
  const b = await call(`/customer/events/photobook/pricing?eventId=${encodeURIComponent(eventId)}`);
  const d = (b.data ?? {}) as Raw;
  return { freePhotosLimit: num(d.freePhotosLimit) ?? 0, pricePerExtraPhoto: Number(d.pricePerExtraPhoto ?? 0) || 0, title: str(d.title) };
}
