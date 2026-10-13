import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  convertAmount,
  formatMoney,
  initialCurrencies,
  isRateLive,
  isStale,
  mergeLiveRates,
} from './currencyRates';

// The backend serves rateToUsd as "1 USD = X units" (RWF 1300 means 1 USD = 1300 RWF).
const rates = (over: Record<string, unknown> = {}) => ({
  RWF: { rateToUsd: 1300, rateUpdatedAt: '2026-10-13T08:00:00', symbol: 'RF', name: 'Rwandan Franc' },
  KES: { rateToUsd: '130.5' },
  ...over,
});
const live = () => mergeLiveRates(initialCurrencies(), rates());
const none = () => initialCurrencies();

describe('no invented rates', () => {
  it('only USD has a rate before the backend answers', () => {
    const c = none();
    expect(c.find((x) => x.code === 'USD')).toMatchObject({ rate: 1, rateLive: true });
    for (const x of c.filter((y) => y.code !== 'USD')) {
      expect(x.rateLive).toBe(false);
      expect(x.rate).toBe(0);
    }
    expect(isRateLive(c, 'RWF')).toBe(false);
  });

  it('no source file keeps a hardcoded RWF fallback rate', () => {
    const root = path.resolve(__dirname, '..');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (['node_modules', '.next', '.git', '__fixtures__', '_design-sandbox', '.claude'].includes(name)) continue;
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) && /\b1460\b/.test(readFileSync(full, 'utf8'))) {
          offenders.push(path.relative(root, full));
        }
      }
    };
    walk(path.join(root, 'app'));
    walk(path.join(root, 'lib'));
    expect(offenders).toEqual([]);
  });
});

describe('merging the backend rates', () => {
  it('makes a currency live only from a usable rate, keeping the timestamp', () => {
    const c = live();
    expect(c.find((x) => x.code === 'RWF')).toMatchObject({ rate: 1300, rateLive: true, rateUpdatedAt: '2026-10-13T08:00:00' });
    expect(c.find((x) => x.code === 'KES')).toMatchObject({ rate: 130.5, rateLive: true, rateUpdatedAt: null });
    expect(c.find((x) => x.code === 'EUR')?.rateLive).toBe(false); // not supplied: stays unknown, not defaulted
  });

  it.each([
    ['text', 'abc'],
    ['empty string', ''],
    ['zero', 0],
    ['negative', -5],
    ['NaN', NaN],
    ['Infinity', 'Infinity'],
    ['null', null],
    ['object', {}],
  ])('a malformed rate (%s) leaves the currency not live', (_n, bad) => {
    const c = mergeLiveRates(initialCurrencies(), { RWF: { rateToUsd: bad }, KES: { rateToUsd: 130 } });
    expect(c.find((x) => x.code === 'RWF')).toMatchObject({ rateLive: false, rate: 0 });
    expect(c.find((x) => x.code === 'KES')?.rateLive).toBe(true); // one bad entry does not poison the rest
  });

  it.each([[undefined], [null], ['text'], [[]], [42]])('an unusable payload (%j) changes nothing', (payload) => {
    expect(mergeLiveRates(initialCurrencies(), payload)).toEqual(initialCurrencies());
  });
});

describe('conversion and display', () => {
  it('converts across currencies at the backend rate', () => {
    const c = live();
    expect(convertAmount(130000, 'RWF', 'USD', c)).toBeCloseTo(100, 6);
    expect(convertAmount(95.5, 'USD', 'RWF', c)).toBeCloseTo(124150, 6);
    expect(convertAmount(1300, 'RWF', 'KES', c)).toBeCloseTo(130.5, 6);
  });

  it('refuses to convert when either rate is not live, instead of guessing', () => {
    expect(convertAmount(95.5, 'USD', 'RWF', none())).toBeNull();
    expect(convertAmount(1000, 'RWF', 'USD', none())).toBeNull();
    expect(convertAmount(Number.NaN, 'USD', 'USD', live())).toBeNull();
  });

  it('shows an amount in its own currency when the display currency has no rate', () => {
    expect(formatMoney(95.5, 'USD', 'RWF', none())).toBe('$95.50');
    expect(formatMoney(124150, 'RWF', 'USD', none())).toBe('RF 124,150');
    expect(formatMoney(5, 'XYZ', 'USD', live())).toBe('XYZ 5');
  });

  it('converts for display when rates are live', () => {
    expect(formatMoney(95.5, 'USD', 'RWF', live())).toBe('RF 124,150');
    expect(formatMoney(130000, 'RWF', 'USD', live())).toBe('$100.00');
  });

  it('an amount shown in the currency it was recorded in never depends on a rate', () => {
    const later = mergeLiveRates(initialCurrencies(), { RWF: { rateToUsd: 1500 } });
    expect(formatMoney(130000, 'RWF', 'RWF', none())).toBe('RF 130,000');
    expect(formatMoney(130000, 'RWF', 'RWF', live())).toBe(formatMoney(130000, 'RWF', 'RWF', later));
    expect(formatMoney(95.5, 'USD', 'USD', none())).toBe('$95.50');
  });

  it('rounds at the currency precision, display only', () => {
    expect(formatMoney(0.125, 'USD', 'USD', live())).toBe('$0.13');
    expect(formatMoney(0.124999, 'USD', 'USD', live())).toBe('$0.12');
    expect(formatMoney(0.5, 'RWF', 'RWF', live())).toBe('RF 1');
    expect(formatMoney(0.49, 'RWF', 'RWF', live())).toBe('RF 0');
    expect(formatMoney(0, 'USD', 'USD', live())).toBe('$0.00'); // a genuine zero still shows as zero
  });
});

describe('stale rates', () => {
  const now = Date.parse('2026-10-13T12:00:00Z');
  const day = 24 * 60 * 60 * 1000;
  it('reports age against a limit the caller chooses; there is no default policy', () => {
    const c = live().find((x) => x.code === 'RWF')!;
    expect(isStale(c, now, 2 * day)).toBe(false);
    expect(isStale({ ...c, rateUpdatedAt: '2026-09-01T00:00:00Z' }, now, 2 * day)).toBe(true);
  });
  it('a rate with no or unreadable timestamp cannot be shown to be fresh', () => {
    const c = live().find((x) => x.code === 'KES')!;
    expect(isStale(c, now, 2 * day)).toBe(true);
    expect(isStale({ ...c, rateUpdatedAt: 'not a date' }, now, 2 * day)).toBe(true);
  });
  it('USD is never stale', () => {
    expect(isStale(none().find((x) => x.code === 'USD')!, now, 0)).toBe(false);
  });
});
