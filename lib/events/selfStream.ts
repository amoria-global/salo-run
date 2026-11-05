import { cachedPaymentLimit, priceError, type PaymentLimit } from '../paymentLimits';

/**
 * The self-stream choice on the create event form: "A photographer" (PUBLIC, a photographer covers and streams it) or
 * "I stream it myself" (PRIVATE, the owner goes live, no photographer and no booking, viewers pay to watch).
 * The server enforces the same rule: a private event must charge at least the minimum for the currency the owner
 * picked (PaymentLimitsService), so the check here asks the same endpoint instead of a bare number.
 */
export type EventCoverage = 'PUBLIC' | 'PRIVATE';

/** The message to show when a self-streamed event's fee cannot be accepted, or null. */
export function selfStreamFeeError(
  fee: string,
  currencyCode: string,
  limit: PaymentLimit | null = cachedPaymentLimit(currencyCode),
): string | null {
  const cleaned = String(fee ?? '').replace(/[^\d.]/g, '');
  if (!cleaned || !(Number(cleaned) > 0)) return 'An event you stream yourself needs a live stream fee.';
  return priceError(cleaned, limit);
}

export function coverageHint(value: EventCoverage): string {
  return value === 'PRIVATE'
    ? 'You go live yourself, with no photographer and no booking. Viewers pay to watch, so it needs a fee above the minimum for the currency you pick.'
    : 'A photographer covers your event and streams it. Published events appear on connekyt.com.';
}
