import { describe, expect, it } from 'vitest';
import { canOwnerGoLive } from './ownerGoLive';

const NOW = Date.parse('2026-10-29T10:00:00+02:00');
const base = { eventVisibility: 'PRIVATE', status: 'PUBLISHED', date: '2026-10-30', time: '18:00', endTime: '20:00' };

describe('canOwnerGoLive', () => {
  it('offers Go live on a private event that has not ended', () => {
    expect(canOwnerGoLive(base, NOW)).toBe(true);
    expect(canOwnerGoLive({ ...base, status: 'ONGOING', date: '2026-10-29', time: '09:00', endTime: '23:00' }, NOW)).toBe(true);
  });
  it('never on a public event, which its photographer streams', () => {
    expect(canOwnerGoLive({ ...base, eventVisibility: 'PUBLIC' }, NOW)).toBe(false);
    expect(canOwnerGoLive({ ...base, eventVisibility: undefined }, NOW)).toBe(false);
  });
  it('not once the event is over, completed or cancelled', () => {
    expect(canOwnerGoLive({ ...base, status: 'COMPLETED' }, NOW)).toBe(false);
    expect(canOwnerGoLive({ ...base, status: 'CANCELLED' }, NOW)).toBe(false);
    expect(canOwnerGoLive({ ...base, date: '2026-05-30', time: '01:00', endTime: '02:00' }, NOW)).toBe(false);
  });
  it('is case-insensitive about the visibility', () => {
    expect(canOwnerGoLive({ ...base, eventVisibility: 'private' }, NOW)).toBe(true);
  });
});
