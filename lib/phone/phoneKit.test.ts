import { describe, it, expect } from 'vitest';
import { phoneCountryFor, readTypedPhone, formatNsn, type PhoneCountry } from './phoneKit';

/**
 * The phone field showed the dial code twice: "+250" on the country button
 * and "+250 788 230 905" in the input. The input now holds the national
 * number only, so readTypedPhone must turn anything a user types or pastes
 * into (country, national digits) without a dial code leaking into the value.
 */
const RW = phoneCountryFor('RW') as PhoneCountry;
const KE = phoneCountryFor('KE') as PhoneCountry;

describe('readTypedPhone', () => {
  it('keeps typed national digits as they are', () => {
    expect(readTypedPhone('788 230 905', RW)).toEqual({ country: RW, nsn: '788230905' });
  });

  it('never reads short national digits as a dial code', () => {
    // "7" is the Russia/Kazakhstan dial code; typing a Rwandan number must not flip it.
    expect(readTypedPhone('7', RW).country.iso2).toBe('RW');
    expect(readTypedPhone('788', RW)).toEqual({ country: RW, nsn: '788' });
  });

  it('strips the trunk 0', () => {
    expect(readTypedPhone('0788230905', RW)).toEqual({ country: RW, nsn: '788230905' });
  });

  it('removes a pasted dial code instead of duplicating it', () => {
    expect(readTypedPhone('+250 788 230 905', RW)).toEqual({ country: RW, nsn: '788230905' });
    expect(readTypedPhone('250788230905', RW)).toEqual({ country: RW, nsn: '788230905' });
  });

  it('re-detects the country from a pasted international number', () => {
    expect(readTypedPhone('+254712345678', RW)).toEqual({ country: KE, nsn: '712345678' });
    expect(readTypedPhone('250788230905', KE)).toEqual({ country: RW, nsn: '788230905' });
  });

  it('the displayed value carries no dial code', () => {
    const { country, nsn } = readTypedPhone('+250788230905', RW);
    expect(formatNsn(country, nsn)).toBe('788 230 905');
  });
});
