import { describe, expect, it } from 'vitest';
import { monthGrid, shiftDays, shiftMonth, weekOf } from './calendarDays';

describe('calendarDays', () => {
  it('weeks start on Monday and cover seven days', () => {
    expect(weekOf('2026-10-28')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
    expect(weekOf('2026-11-01')[0]).toBe('2026-10-26');
  });
  it('shifts across month ends', () => {
    expect(shiftDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-01');
  });
  it('fills the month grid with whole Monday-first weeks', () => {
    const g = monthGrid('2026-10-15');
    expect(g[0][0]).toBe('2026-09-28');
    expect(g[g.length - 1][6]).toBe('2026-11-01');
    expect(g.every((w) => w.length === 7)).toBe(true);
  });
});
