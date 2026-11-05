import { describe, expect, it } from 'vitest';
import { coverageHint, selfStreamFeeError } from './selfStream';

const usd = { currency: 'USD', minimum: '0.08', decimals: 2, wholeNumbersOnly: false };
const rwf = { currency: 'RWF', minimum: '100', decimals: 0, wholeNumbersOnly: true };

describe('selfStreamFeeError', () => {
  it('judges the fee in the currency picked, so USD 4 is fine', () => {
    expect(selfStreamFeeError('100', 'RWF', rwf)).toBeNull();
    expect(selfStreamFeeError('4', 'USD', usd)).toBeNull();
    expect(selfStreamFeeError('2,500', 'USD', usd)).toBeNull();
  });
  it('refuses less than the minimum, nothing and garbage, naming the currency', () => {
    expect(selfStreamFeeError('99', 'RWF', rwf)).toBe("The minimum price in RWF is 100. Mobile Money can't process smaller payments.");
    expect(selfStreamFeeError('0.05', 'USD', usd)).toContain('The minimum price in USD is 0.08.');
    expect(selfStreamFeeError('', 'RWF', rwf)).not.toBeNull();
    expect(selfStreamFeeError('abc', 'RWF', rwf)).not.toBeNull();
    expect(selfStreamFeeError('0', 'RWF', rwf)).not.toBeNull();
  });
  it('leaves the minimum to the server while it is unknown', () => {
    expect(selfStreamFeeError('4', 'USD', null)).toBeNull();
  });
  it('words the two choices', () => {
    expect(coverageHint('PRIVATE')).toContain('go live yourself');
    expect(coverageHint('PUBLIC')).toContain('photographer covers');
  });
});
