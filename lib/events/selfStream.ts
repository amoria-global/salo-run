/**
 * The self-stream choice on the create event form: "A photographer" (PUBLIC, a photographer covers and streams it) or
 * "I stream it myself" (PRIVATE, the owner goes live, no photographer and no booking, viewers pay to watch).
 * The server enforces the same rule: a private event must charge at least 100, a plain number in whichever currency
 * the owner picked, so the check here is the same plain number and not the booking price rule.
 */
export const MIN_SELF_STREAM_FEE = 100;

export type EventCoverage = 'PUBLIC' | 'PRIVATE';

/** The message to show when a self-streamed event's fee cannot be accepted, or null. */
export function selfStreamFeeError(fee: string, currencyCode: string): string | null {
  const n = Number(String(fee ?? '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n < MIN_SELF_STREAM_FEE) {
    return `An event you stream yourself needs a live stream fee of at least ${MIN_SELF_STREAM_FEE} ${currencyCode || ''}`.trim() + '.';
  }
  return null;
}

export function coverageHint(value: EventCoverage): string {
  return value === 'PRIVATE'
    ? 'You go live yourself, with no photographer and no booking. Viewers pay to watch, so it needs a fee of at least 100 in the currency you pick.'
    : 'A photographer covers your event and streams it. Published events appear on connekyt.com.';
}
