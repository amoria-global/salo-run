import { describe, expect, it } from 'vitest';
import { parseReferralCode, problemMessage, progressParts, referralLink } from './referral';

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

describe('progressParts', () => {
  const base = { cap: 20 };
  it('counts toward the first discount below 5', () => {
    expect(progressParts({ ...base, qualifying: 3, feePercent: null, complete: false })).toMatchObject({ kind: 'unlock', n: 3, pct: 15 });
  });
  it('shows the current fee from 5', () => {
    expect(progressParts({ ...base, qualifying: 7, feePercent: 23, complete: false })).toMatchObject({ kind: 'fee', n: 7, fee: 23, pct: 35 });
  });
  it('is complete at 20 with a 10% fee', () => {
    expect(progressParts({ ...base, qualifying: 20, feePercent: 10, complete: true })).toMatchObject({ kind: 'complete', fee: 10, pct: 100 });
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
