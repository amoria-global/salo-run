/**
 * Explore for a signed-in person: the items they saved and the Explore purchases made with their email. Everything shown is a
 * watermarked preview; the originals and full clips only come through the signed links of an unlocked purchase, which the server
 * issues for an unlock code and which expire (7 days, 5 downloads, photos viewable for 24 hours).
 */
import { getApiUrl } from '@/lib/api';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';

export interface SavedItem {
  id: string;
  mediaType: 'PHOTO' | 'VIDEO';
  title: string | null;
  creatorName: string;
  thumbnailUrl: string | null;
  aspectRatio: number;
  durationSeconds: number | null;
  priceAmount: number | null;
  priceCurrency: string;
}

export interface PurchaseRow { refid: string; paidAt: string | null; amount: number | null; currency: string | null; title: string | null; unlockCode: string | null }

export interface UnlockedItem { id: string; mediaType: 'PHOTO' | 'VIDEO'; title: string | null; thumbnailUrl: string | null; viewUrl: string | null; downloadUrl: string | null }
export interface Unlocked { refid: string; items: UnlockedItem[]; zipUrl: string }

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function envelope(res: Response): Promise<Raw> {
  let j: Raw = {};
  try { j = await res.json(); } catch { /* not JSON */ }
  if (!res.ok || j.action !== 1) {
    const e = new Error(j.message || `Request failed (${res.status})`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return j.data ?? {};
}

export function mapSaved(r: Raw): SavedItem {
  const w = Number(r.width) || 0, h = Number(r.height) || 0;
  const ratio = Number(r.aspectRatio) || (w && h ? w / h : 4 / 3);
  return {
    id: String(r.id), mediaType: r.mediaType === 'VIDEO' ? 'VIDEO' : 'PHOTO', title: r.title ?? null,
    creatorName: String(r.creator?.name ?? ''), thumbnailUrl: r.thumbnailUrl ?? null,
    aspectRatio: Math.min(2.2, Math.max(0.5, ratio)), durationSeconds: typeof r.durationSeconds === 'number' ? r.durationSeconds : null,
    priceAmount: typeof r.price?.amount === 'number' ? r.price.amount : null, priceCurrency: String(r.price?.currency ?? 'USD'),
  };
}

export async function listSaved(currency = 'USD'): Promise<SavedItem[]> {
  const d = await envelope(await dashboardAuthFetch(`${getApiUrl()}/api/remote/explore/saves?currency=${encodeURIComponent(currency)}`));
  return ((d.items as Raw[]) ?? []).map(mapSaved);
}

export async function unsave(id: string): Promise<void> {
  await envelope(await dashboardAuthFetch(`${getApiUrl()}/api/remote/explore/saves/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}

export async function listPurchases(): Promise<PurchaseRow[]> {
  const d = await envelope(await dashboardAuthFetch(`${getApiUrl()}/api/remote/explore/purchases`));
  return ((d.purchases as Raw[]) ?? []).map((p) => ({
    refid: String(p.refid), paidAt: p.paidAt ?? null, amount: typeof p.amount === 'number' ? p.amount : null,
    currency: p.currency ?? null, title: p.title ?? null, unlockCode: p.unlockCode ?? null,
  }));
}

/** Opens one purchase by its unlock code and returns fresh signed links. */
export async function unlock(code: string): Promise<Unlocked> {
  const res = await fetch(`${getApiUrl()}/api/public/content/unlock`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
  });
  const d = await envelope(res);
  return {
    refid: String(d.refid ?? ''), zipUrl: String(d.zipUrl ?? ''),
    items: ((d.items as Raw[]) ?? []).map((i) => ({
      id: String(i.id), mediaType: i.mediaType === 'VIDEO' ? 'VIDEO' : 'PHOTO', title: i.title ?? null,
      thumbnailUrl: i.thumbnailUrl ?? null, viewUrl: i.viewUrl ?? null, downloadUrl: i.downloadUrl ?? null,
    })),
  };
}

export function clockOf(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return '';
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}

/** Whole units for currencies without cents, two decimals for the others. */
export function priceText(amount: number | null, currency: string): string {
  if (amount == null) return '';
  const cents = ['USD', 'EUR', 'GBP'].includes(currency);
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en')}`;
  }
}
