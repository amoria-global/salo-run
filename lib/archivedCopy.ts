/**
 * What an archived album tells its owner, in plain language. An album is archived when it is locked after its year of
 * access ran out; restoring it takes a payment of the archive fee. The same wording is used by the mobile app.
 */

/** "30 October 2026", in Kigali time, or null when the date is missing or unreadable. */
export function archivedOn(lockedAt?: string | null): string | null {
  if (!lockedAt) return null;
  const d = new Date(lockedAt);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Kigali' }).format(d);
}

/** "RWF 5,000" from a fee and a currency abbreviation, or null when no fee is configured. */
export function archiveFeeText(fee?: number | null, currency?: string | null): string | null {
  if (typeof fee !== 'number' || !(fee > 0)) return null;
  const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(fee);
  return currency ? `${currency} ${amount}` : amount;
}

/** The sentence shown for an archived album. */
export function archivedMessage(opts: { lockedAt?: string | null; price?: string | null }): string {
  const date = archivedOn(opts.lockedAt);
  const lead = date ? `This album was archived on ${date}.` : 'This album was archived.';
  return opts.price ? `${lead} Restore it for ${opts.price} to view and download again.` : `${lead} Restore it to view and download again.`;
}

/** The detail line of the confirmation shown before the owner is taken to pay. */
export function restoreDetail(price?: string | null): string {
  return `${price ? `You will pay ${price}` : 'You will pay the archive fee'}, and you will have access to the album again for 1 year.`;
}
