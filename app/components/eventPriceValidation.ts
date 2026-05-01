// Mobile Money (Rwanda) rejects collections below 100 RWF.
// For all other currencies the minimum is 1 unit (e.g. $1 USD, 1 EUR).
export const MIN_EVENT_PRICE_RWF = 100;
export const MIN_EVENT_PRICE_OTHER = 1;

/**
 * Returns true when the price is invalid (below the currency-specific minimum).
 * A price of 0 (free event) is always valid — this only checks paid events.
 */
export const isEventPriceInvalid = (price: string, currencyCode: string): boolean => {
  const n = parseFloat(price.replace(/[^\d.]/g, ''));
  if (isNaN(n) || n === 0) return false;
  const min = currencyCode === 'RWF' ? MIN_EVENT_PRICE_RWF : MIN_EVENT_PRICE_OTHER;
  return n < min;
};

/**
 * Returns the human-readable minimum price string for error messages.
 */
export const getMinEventPriceLabel = (currencyCode: string): string => {
  if (currencyCode === 'RWF') return `${MIN_EVENT_PRICE_RWF} RWF`;
  return `${MIN_EVENT_PRICE_OTHER} ${currencyCode}`;
};
