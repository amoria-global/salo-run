import { cachedPaymentLimit, priceError } from '@/lib/paymentLimits';

// The minimum is per currency and comes from the backend (GET /payments/limits), the same figure the server enforces.
// Until it has loaded, only a malformed amount is refused and the server judges the rest.

/**
 * The message for a paid event price that cannot be accepted, or null. A price of 0 (free event) is always valid;
 * this only checks paid events.
 */
export const eventPriceError = (price: string, currencyCode: string): string | null => {
  const cleaned = price.replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n) || n === 0) return null;
  return priceError(cleaned, cachedPaymentLimit(currencyCode));
};

/** True when the price is invalid (below the currency-specific minimum). */
export const isEventPriceInvalid = (price: string, currencyCode: string): boolean => eventPriceError(price, currencyCode) !== null;
