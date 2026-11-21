import { describe, expect, it } from 'vitest';
import {
  badgeFor, exampleSale, extraOnSale, hintKey, parseReferralCode, problemMessage, progressPct, referralLink, sheetChip,
  statusKey, targetOf, tiers,
} from './referral';

describe('parseReferralCode', () => {
  it('takes a bare code or a full link', () => {
    expect(parseReferralCode(' abcd2345 ')).toBe('ABCD2345');
    expect(parseReferralCode('https://connekyt.com/join?ref=ABCD2345&x=1')).toBe('ABCD2345');
  });
  it('rejects look-alike characters and wrong lengths', () => {
    expect(parseReferralCode('ABCD0OI1')).toBeNull();
    expect(parseReferralCode('ABC')).toBeNull();
    expect(parseReferralCode(null)).toBeNull();
  });
});

describe('tiers (photo sale share)', () => {
  const share = (n: number) => tiers(n).find((t) => t.state === 'current')?.share;
  it('lands on the right tier at every boundary', () => {
    const cases: Array<[number, number]> = [[0, 70], [9, 70], [10, 75], [19, 75], [20, 80], [29, 80], [30, 85], [39, 85], [40, 90]];
    for (const [n, s] of cases) expect(share(n), `at ${n}`).toBe(s);
  });
  it('marks lower tiers done, higher ones locked and the 90% row as the maximum until reached', () => {
    expect(tiers(11).map((t) => t.state)).toEqual(['done', 'current', 'locked', 'locked', 'max']);
    expect(tiers(0).map((t) => t.state)).toEqual(['current', 'locked', 'locked', 'locked', 'max']);
    expect(tiers(40).map((t) => t.state)).toEqual(['done', 'done', 'done', 'done', 'current']);
  });
});

describe('progress', () => {
  it('counts toward the next milestone and ends at 40', () => {
    expect([0, 9, 10, 11, 19, 20, 39, 40].map(targetOf)).toEqual([10, 10, 20, 20, 20, 30, 40, 40]);
    expect(progressPct(0)).toBe(0);
    expect(progressPct(11)).toBe(10);
    expect(progressPct(15)).toBe(50);
    expect(progressPct(39)).toBe(90);
    expect(progressPct(40)).toBe(100);
    expect(sheetChip(11)).toBe('11/20');
    expect(sheetChip(3)).toBe('3/10');
    expect(sheetChip(40)).toBe('40/40');
  });
});

describe('Share & invite badge', () => {
  const s = (qualifying: number, sharePercent: number, nextSharePercent: number | null, maxRate = false) => ({ qualifying, sharePercent, nextSharePercent, maxRate });
  it('says Earn 70% at 0, Unlock 75% before 10, then Your share', () => {
    expect(badgeFor(s(0, 70, 75))).toEqual({ kind: 'earn', rate: 70 });
    expect(badgeFor(s(4, 70, 75))).toEqual({ kind: 'unlock', rate: 75 });
    expect(badgeFor(s(11, 75, 80))).toEqual({ kind: 'share', rate: 75 });
    expect(badgeFor(s(39, 85, 90))).toEqual({ kind: 'share', rate: 85 });
  });
  it('has no badge at 40 or while the stats are unknown', () => {
    expect(badgeFor(s(40, 90, null, true))).toBeNull();
    expect(badgeFor(null)).toBeNull();
  });
});

describe('money example in the viewer currency', () => {
  it('shows what the next tier adds on a round sale', () => {
    expect(extraOnSale(75, 80, 10000)).toBe(500);
    expect(extraOnSale(70, 75, 100)).toBe(5);
    expect(extraOnSale(90, null, 10000)).toBeNull();
  });
  it('uses 10,000 for francs and shillings and 100 elsewhere', () => {
    expect(exampleSale('RWF')).toBe(10000);
    expect(exampleSale('kes')).toBe(10000);
    expect(exampleSale('USD')).toBe(100);
  });
});

describe('row status and hints', () => {
  it('maps statuses and hint keys without exposing a fraud signal', () => {
    expect(statusKey('under_review')).toBe('statusReview');
    expect(statusKey('pending')).toBe('statusPending');
    expect(statusKey('qualified')).toBe('statusQualified');
    expect(statusKey('revoked')).toBe('statusRevoked');
    expect(hintKey('waiting_first_sale')).toBe('hintWaitingFirstSale');
    expect(hintKey('waiting_verified_published')).toBe('hintWaitingVerified');
    expect(hintKey('under_review')).toBe('hintUnderReview');
    expect(hintKey('revoked')).toBe('hintRevoked');
    expect(hintKey('qualified')).toBe('hintQualified');
  });
});

describe('links and messages', () => {
  it('builds the join link', () => {
    expect(referralLink('ABCD2345')).toBe('https://connekyt.com/join?ref=ABCD2345');
  });
  it('maps every server problem to a message', () => {
    expect(problemMessage('LIMIT_REACHED')).toBe('This referrer has reached their limit');
    expect(problemMessage(undefined)).toBe("This code isn't valid");
  });
});
