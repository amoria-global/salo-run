import { describe, expect, it } from 'vitest';
import { badgeFor, progressChip } from './ShareMenu';

describe('Share & invite card badge', () => {
  it('says Lower fees from 0 to 4 qualifying referrals', () => {
    for (const n of [0, 1, 4]) expect(badgeFor({ qualifying: n, feePercent: null, complete: false })).toEqual({ kind: 'lower', fee: null });
  });
  it('shows the real rate from the server from 5 to 19', () => {
    expect(badgeFor({ qualifying: 5, feePercent: 25, complete: false })).toEqual({ kind: 'fee', fee: 25 });
    expect(badgeFor({ qualifying: 7, feePercent: 23, complete: false })).toEqual({ kind: 'fee', fee: 23 });
    expect(badgeFor({ qualifying: 19, feePercent: 11, complete: false })).toEqual({ kind: 'fee', fee: 11 });
  });
  it('has no badge at 20 or while the stats are unknown', () => {
    expect(badgeFor({ qualifying: 20, feePercent: 10, complete: true })).toBeNull();
    expect(badgeFor(null)).toBeNull();
  });
});

describe('sheet progress chip', () => {
  it('counts to 5 first, then to 20', () => {
    expect(progressChip(3)).toBe('3/5');
    expect(progressChip(4)).toBe('4/5');
    expect(progressChip(5)).toBe('5/20');
    expect(progressChip(7)).toBe('7/20');
  });
});
