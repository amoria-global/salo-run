import { describe, expect, it } from 'vitest';
import { coverageHint, selfStreamFeeError } from './selfStream';

describe('selfStreamFeeError', () => {
  it('accepts 100 or more in any currency, as a plain number', () => {
    expect(selfStreamFeeError('100', 'RWF')).toBeNull();
    expect(selfStreamFeeError('2,500', 'USD')).toBeNull();
    expect(selfStreamFeeError('100', 'EUR')).toBeNull();
  });
  it('refuses less than 100, nothing and garbage, naming the currency', () => {
    expect(selfStreamFeeError('99', 'RWF')).toBe('An event you stream yourself needs a live stream fee of at least 100 RWF.');
    expect(selfStreamFeeError('50', 'USD')).toContain('100 USD');
    expect(selfStreamFeeError('', 'RWF')).not.toBeNull();
    expect(selfStreamFeeError('abc', 'RWF')).not.toBeNull();
    expect(selfStreamFeeError('0', 'RWF')).not.toBeNull();
  });
  it('words the two choices', () => {
    expect(coverageHint('PRIVATE')).toContain('go live yourself');
    expect(coverageHint('PUBLIC')).toContain('photographer covers');
  });
});
