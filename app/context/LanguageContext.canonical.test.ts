import { describe, expect, it } from 'vitest';
import dict from '@/lib/domTranslations.json';
import { getDashboardCanonical } from './LanguageContext';

/** The reference: the loop getDashboardCanonical used before the lookup map (first key wins). */
function bruteForce(raw: string) {
  const trimmed = raw.trim();
  const m = trimmed.match(/^([^:!?.]+)([:!?.]+)$/);
  const base = m ? m[1].trim() : trimmed;
  const exact = dict as Record<string, string[]>;
  if (exact[base]) return base;
  const lower = base.toLowerCase();
  for (const key of Object.keys(exact)) if (key.toLowerCase() === lower) return key;
  return null;
}

describe('getDashboardCanonical case-insensitive lookup', () => {
  it('returns what the old loop returned, for every dictionary key in three casings', () => {
    let compared = 0;
    for (const key of Object.keys(dict)) {
      for (const variant of [key, key.toLowerCase(), key.toUpperCase()]) {
        const want = bruteForce(variant);
        if (want === null) continue;
        expect(getDashboardCanonical(variant)?.canonical, variant).toBe(want);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(2000);
    // The reference is the old linear loop over the whole dictionary for each key (quadratic), so it needs longer than 5 s.
  }, 60_000);

  it('keeps the surrounding whitespace and trailing punctuation', () => {
    expect(getDashboardCanonical('  home: ')).toMatchObject({ canonical: 'Home', leading: '  ', suffix: ':', trailing: ' ' });
  });

  it('returns null for text that is not in the dictionary', () => {
    expect(getDashboardCanonical('Ben & Raya Wedding at Serena')).toBeNull();
    expect(getDashboardCanonical('   ')).toBeNull();
  });
});
