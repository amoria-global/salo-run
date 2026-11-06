import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmYear, farYearMessage, formatLongDay, isFarFuture } from './farFutureDate';

const today = new Date(2026, 10, 6); // 6 Nov 2026

describe('far-future event dates', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks only for a date more than a year ahead', () => {
    expect(isFarFuture('2026-11-06', today)).toBe(false);
    expect(isFarFuture('2027-11-06', today)).toBe(false);
    expect(isFarFuture('2027-11-07', today)).toBe(true);
    expect(isFarFuture('2028-10-14', today)).toBe(true);
  });
  it('never asks about a past or unreadable date', () => {
    expect(isFarFuture('2020-01-01', today)).toBe(false);
    expect(isFarFuture('', today)).toBe(false);
    expect(isFarFuture(undefined, today)).toBe(false);
    expect(isFarFuture('soon', today)).toBe(false);
  });
  it('words the question with the full date', () => {
    expect(formatLongDay('2028-10-14')).toBe('14 Oct 2028');
    expect(farYearMessage('2028-10-14')).toBe('This event is on 14 Oct 2028. Is the year right?');
  });
  it('carries on for a near date without asking, and follows the answer for a far one', () => {
    const ask = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('window', { confirm: ask });
    expect(confirmYear('2026-12-01', today)).toBe(true);
    expect(ask).not.toHaveBeenCalled();
    expect(confirmYear('2028-10-14', today)).toBe(false);
    expect(ask).toHaveBeenCalledWith('This event is on 14 Oct 2028. Is the year right?');
    expect(confirmYear('2028-10-14', today)).toBe(true);
    vi.unstubAllGlobals();
  });
});
