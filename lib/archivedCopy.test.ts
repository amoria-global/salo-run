import { describe, expect, it } from 'vitest';
import { archiveFeeText, archivedMessage, archivedOn, restoreDetail } from './archivedCopy';

describe('archived album copy', () => {
  it('names the archive date in Kigali time and has none for a bad date', () => {
    expect(archivedOn('2026-10-30T23:30:00Z')).toBe('31 October 2026');
    expect(archivedOn('2026-10-30T10:00:00')).toBe('30 October 2026');
    expect(archivedOn(undefined)).toBeNull();
    expect(archivedOn('nope')).toBeNull();
  });

  it('formats the fee and leaves it out when none is configured', () => {
    expect(archiveFeeText(5000, 'RWF')).toBe('RWF 5,000');
    expect(archiveFeeText(14.5, 'USD')).toBe('USD 14.5');
    expect(archiveFeeText(0, 'RWF')).toBeNull();
    expect(archiveFeeText(undefined, 'RWF')).toBeNull();
  });

  it('says when it was archived and what restoring costs, in plain language', () => {
    expect(archivedMessage({ lockedAt: '2026-10-30T10:00:00', price: 'RWF 5,000' }))
      .toBe('This album was archived on 30 October 2026. Restore it for RWF 5,000 to view and download again.');
    expect(archivedMessage({})).toBe('This album was archived. Restore it to view and download again.');
    expect(archivedMessage({ price: 'RWF 5,000' })).not.toMatch(/cold storage/i);
  });

  it('states the price and the year of access in the confirmation', () => {
    expect(restoreDetail('RWF 5,000')).toBe('You will pay RWF 5,000, and you will have access to the album again for 1 year.');
    expect(restoreDetail()).toContain('the archive fee');
  });
});
