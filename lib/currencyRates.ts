/**
 * Display-currency rates. Pure TypeScript, no React.
 *
 * Money is authoritative in the currency it was recorded in (the wallet in USD,
 * a payment in the currency it was requested in). A converted figure is a
 * display aid built from the backend's rate, and it only exists when the backend
 * actually supplied a usable rate. There is deliberately NO built-in rate for
 * any currency except USD: a stale or invented number shown as current is worse
 * than showing the original amount, and on the withdrawal screen it changed the
 * amount that was submitted.
 *
 * rateToUsd semantics: "1 USD = X of this currency" (RWF 1300 means 1 USD = 1300 RWF).
 */

export type CurrencyCode = 'USD' | 'RWF' | 'EUR' | 'KES' | 'UGX' | 'TZS';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  /** Units of this currency per 1 USD. Only meaningful when rateLive is true. */
  rate: number;
  decimals: number;
  id?: string;
  /** True only when the backend supplied a finite rate greater than zero. */
  rateLive: boolean;
  /** When the backend last updated this rate, as it reported it. */
  rateUpdatedAt?: string | null;
}

const META: Omit<CurrencyInfo, 'rate' | 'rateLive'>[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: 'us', decimals: 2 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', flag: 'rw', decimals: 0 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: 'eu', decimals: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: 'ke', decimals: 0 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: 'ug', decimals: 0 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: 'tz', decimals: 0 },
];

/** Every currency known by name and precision; only USD has a rate until the backend supplies the others. */
export function initialCurrencies(): CurrencyInfo[] {
  return META.map((m) => ({
    ...m,
    rate: m.code === 'USD' ? 1 : 0,
    rateLive: m.code === 'USD',
    rateUpdatedAt: null,
  }));
}

/**
 * Merge the backend's rates response (`data` of /public/currencies/rates) into
 * the list. A currency becomes live only when its rateToUsd parses to a finite
 * number above zero; a missing, malformed, zero or negative entry leaves it not
 * live rather than falling back to anything.
 */
export function mergeLiveRates(base: CurrencyInfo[], apiData: unknown): CurrencyInfo[] {
  if (!apiData || typeof apiData !== 'object' || Array.isArray(apiData)) return base;
  const data = apiData as Record<string, { rateToUsd?: unknown; symbol?: unknown; name?: unknown; rateUpdatedAt?: unknown } | null>;
  return base.map((c) => {
    if (c.code === 'USD') return c;
    const entry = data[c.code];
    if (!entry || entry.rateToUsd == null) return c;
    const rate = typeof entry.rateToUsd === 'number' ? entry.rateToUsd : Number(String(entry.rateToUsd).trim());
    if (!Number.isFinite(rate) || rate <= 0) return c;
    return {
      ...c,
      rate,
      rateLive: true,
      rateUpdatedAt: typeof entry.rateUpdatedAt === 'string' ? entry.rateUpdatedAt : null,
      symbol: typeof entry.symbol === 'string' && entry.symbol ? entry.symbol : c.symbol,
      name: typeof entry.name === 'string' && entry.name ? entry.name : c.name,
    };
  });
}

export function isRateLive(currencies: CurrencyInfo[], code: string): boolean {
  return currencies.some((c) => c.code === code && c.rateLive && c.rate > 0);
}

/** Age check with a caller-chosen limit. No limit is applied anywhere by default (a business decision). */
export function isStale(info: CurrencyInfo, nowMs: number, maxAgeMs: number): boolean {
  if (info.code === 'USD') return false;
  if (!info.rateUpdatedAt) return true;
  const t = Date.parse(info.rateUpdatedAt);
  return !Number.isFinite(t) || nowMs - t > maxAgeMs;
}

/** amount in `from` expressed in `to`, or null when either rate is not live. Same currency needs no rate. */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  currencies: CurrencyInfo[],
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  const f = currencies.find((c) => c.code === from);
  const t = currencies.find((c) => c.code === to);
  if (!f || !t || !f.rateLive || !t.rateLive || f.rate <= 0 || t.rate <= 0) return null;
  return (amount / f.rate) * t.rate;
}

function render(info: CurrencyInfo, value: number): string {
  const text = value.toLocaleString('en-US', {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });
  if (info.code === 'USD') return `$${text}`;
  if (info.code === 'EUR') return `€${text}`;
  return `${info.symbol} ${text}`;
}

/**
 * Format `amount` (denominated in `from`, USD when omitted) for display in `to`.
 * When the conversion cannot be done from live rates the amount is shown in the
 * currency it is denominated in, never converted with a guess.
 */
export function formatMoney(
  amount: number,
  from: string | undefined,
  to: string,
  currencies: CurrencyInfo[],
): string {
  const source = from || 'USD';
  const converted = convertAmount(amount, source, to, currencies);
  if (converted !== null) {
    const target = currencies.find((c) => c.code === to);
    if (target) return render(target, converted);
  }
  const own = currencies.find((c) => c.code === source);
  if (own) return render(own, amount);
  return `${source} ${amount.toLocaleString('en-US')}`;
}
