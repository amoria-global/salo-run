import { describe, expect, it } from 'vitest';
import copy from '@/contract/referral-copy.json';
import { copyLanguages, referralText, type CopyKey } from './referralCopy';

const tables = copy as unknown as Record<string, Record<string, string>>;
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('shared referral copy', () => {
  it('has every key in all five languages', () => {
    const keys = Object.keys(tables.en).sort();
    for (const l of copyLanguages()) expect(Object.keys(tables[l]).sort(), l).toEqual(keys);
  });
  it('keeps the same placeholders in every language', () => {
    for (const k of Object.keys(tables.en)) {
      for (const l of copyLanguages()) expect(placeholders(tables[l][k]), `${l}.${k}`).toBe(placeholders(tables.en[k]));
    }
  });
  it('never uses an em or en dash as punctuation', () => {
    for (const l of copyLanguages()) for (const [k, v] of Object.entries(tables[l])) expect(/[–—]/.test(v), `${l}.${k}`).toBe(false);
  });
  it('words the qualifying rule exactly as specified', () => {
    expect(tables.en.step1).toBe('Your friend signs up with your link or code.');
    expect(tables.en.step2).toBe('Their account is verified and they publish their first photo for sale.');
    expect(tables.en.step3).toBe('They make their first real sale or paid job (from a client, at least {min}).');
    expect(tables.en.stepsFooter).toBe('Only then does it count toward your next milestone. Referrals that look suspicious are reviewed first.');
    expect(tables.en.shareLine).toBe('A referral counts after your friend is verified, publishes a photo and makes their first sale.');
  });
  it('never says which fraud check fired', () => {
    for (const k of ['hintUnderReview', 'hintRevoked', 'notifChecking', 'notifNotQualified', 'policyFraud'] as CopyKey[]) {
      expect(tables.en[k].toLowerCase()).not.toMatch(/phone|payout|device|same buyer|ip address|kyc/);
    }
  });
  it('fills placeholders and falls back to English', () => {
    expect(referralText('en', 'progress', { n: 11, target: 20 })).toBe('11 of 20 referrals');
    expect(referralText('en', 'moreUnlock', { more: 9, rate: 80 })).toBe('9 more to unlock 80%');
    expect(referralText('en', 'congratsTitle', { rate: 75 })).toBe('You now earn 75% on every photo you sell');
    expect(referralText('fr', 'invite')).toBe('Inviter un photographe');
    expect(referralText('xx', 'invite')).toBe('Invite a photographer');
  });
});
