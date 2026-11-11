/**
 * "Sell photos": list photos for buyers on Find my photos. Mirrors the mobile app (src/features/gallery/sellPhotos.ts)
 * so both clients say the same words and apply the same rules.
 *
 * The public face search lists an album only when it is a standalone PAID album, published, not archived, with faces
 * indexed (backend PublicRemoteController.publicFaceSearch). The form checks what it can BEFORE saving, and a publish
 * that fails is shown with the real reason and a retry that never re-uploads.
 */

/** The Events page deep link that opens the album form preset to Sell photos. */
export const SELL_PHOTOS_QUERY = 'sell=1';

export const SELL_FORM_NOTE = 'These photos will be searchable on Find my photos after upload.';
export const SELL_SUBTITLE = 'Upload photos for buyers to find';
export const LISTED_FOR_DAYS = 60;
export const LISTING_NOTE = `Photos stay listed for ${LISTED_FOR_DAYS} days, then the album is archived. Buyers keep what they bought.`;
export const LISTED_HEADLINE = 'Your photos are being prepared for Find my photos';
export const FAILED_HEADLINE = 'Saved, but not on Find my photos yet';

export type SellField = 'title' | 'price' | 'photos';

/** What is missing before an album can reach Find my photos, by field. Empty means nothing is missing. */
export function sellFieldErrors(f: { title: string; price: string; currencyId: string; priceMsg: string | null; photoCount: number }): Partial<Record<SellField, string>> {
  const e: Partial<Record<SellField, string>> = {};
  if (!f.title.trim()) e.title = 'Add a title for this album.';
  if (!f.price.trim() || !f.currencyId) e.price = 'Enter a price per photo and choose a currency.';
  else if (f.priceMsg) e.price = f.priceMsg;
  if (f.photoCount < 1) e.photos = 'Add at least one photo so buyers have something to find.';
  return e;
}

export type PublishFailure = { kind: 'credits' | 'timeout' | 'other'; message: string };

/** Turns a failed publish (HTTP status plus the parsed body, or a thrown network error) into one friendly failure. */
export function describePublishFailure(r: { status?: number; body?: { message?: string; code?: string; needed?: number; balance?: number } | null; networkError?: boolean }): PublishFailure {
  const body = r.body ?? {};
  if (r.status === 402 || body.code === 'INSUFFICIENT_AI_CREDITS') {
    const need = typeof body.needed === 'number' ? ` You need ${body.needed} credit${body.needed === 1 ? '' : 's'}${typeof body.balance === 'number' ? ` and have ${body.balance}` : ''}.` : '';
    return { kind: 'credits', message: `Not enough credits to prepare these photos for Find my photos.${need} Top up, then retry.` };
  }
  if (r.status === 408 || r.status === 502 || r.status === 504) {
    return { kind: 'timeout', message: 'Preparing the photos is taking longer than usual. It keeps going on our side. Click Retry publishing in a minute to check.' };
  }
  if (r.networkError) {
    return { kind: 'other', message: 'We lost the connection before the photos were published. Check your internet and click Retry publishing.' };
  }
  return { kind: 'other', message: body.message?.trim() || 'The album is saved but could not be published to Find my photos. Click Retry publishing.' };
}

export type PublishOutcome =
  | { state: 'listed'; headline: string; status: string; facesIndexed: number; warn: boolean }
  | { state: 'failed'; headline: string; status: string; failure: PublishFailure };

export function publishOutcome(r: { published?: boolean; facesIndexed?: number; failure?: PublishFailure }): PublishOutcome {
  if (r.published) {
    const n = r.facesIndexed ?? 0;
    return n > 0
      ? { state: 'listed', headline: LISTED_HEADLINE, status: `Ready: ${n} ${n === 1 ? 'face' : 'faces'} indexed. Buyers can find these photos now.`, facesIndexed: n, warn: false }
      : { state: 'listed', headline: LISTED_HEADLINE, status: 'Published, but no faces were detected yet. A selfie search only matches photos with a clear face.', facesIndexed: 0, warn: true };
  }
  const failure = r.failure ?? { kind: 'other' as const, message: 'The album is saved but is not on Find my photos yet. Click Retry publishing.' };
  return { state: 'failed', headline: FAILED_HEADLINE, status: failure.message, failure };
}

/** The badge for a PAID standalone album buyers cannot find. Null when nothing is wrong (live, FREE, content, event album). */
export function notVisibleBadge(a: { isStandalone?: boolean; albumType?: string; isFreeAlbum?: boolean; faceRecognitionEnabled?: boolean }): string | null {
  const standalone = a.isStandalone === true || a.albumType === 'standalone';
  if (!standalone || a.isFreeAlbum) return null;
  return a.faceRecognitionEnabled ? null : 'Not visible on Find my photos';
}
