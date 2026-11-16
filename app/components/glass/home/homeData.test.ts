import { describe, expect, it } from 'vitest';
import { activityRows, greetingKey, periodQuery, progress, trendChip, upcoming } from './homeData';

describe('one period switch for the cards and the chart', () => {
  it('uses the last 7 days for the chart when the cards show this week', () => {
    expect(periodQuery('week')).toEqual({ trends: 'period=week', performance: 'period=last7' });
    expect(periodQuery('today').performance).toBe('period=today');
    expect(periodQuery('month').trends).toBe('period=month');
  });
  it('sends the same custom range to both', () => {
    const q = periodQuery('custom', { from: '2026-11-01', to: '2026-11-10' });
    expect(q.trends).toBe('period=custom&from=2026-11-01&to=2026-11-10');
    expect(q.performance).toBe(q.trends);
  });
  it('falls back to the week until a custom range is complete', () => {
    expect(periodQuery('custom', { from: '2026-11-01', to: '' }).trends).toBe('period=week');
  });
});

describe('trend chips', () => {
  it('shows a percentage only when the previous period had data', () => {
    expect(trendChip({ changePercent: 12.34, trend: 'up' })).toEqual({ kind: 'up', percent: 12.3 });
    expect(trendChip({ changePercent: 40, trend: 'down' })).toEqual({ kind: 'down', percent: 40 });
  });
  it('says No change for 0 and nothing without a basis (never an invented +100%)', () => {
    expect(trendChip({ changePercent: 0, trend: 'neutral' })).toEqual({ kind: 'flat' });
    expect(trendChip({ changePercent: null, trend: 'neutral', value: 100000 })).toBeNull();
    expect(trendChip(undefined)).toBeNull();
  });
});

describe('upcoming events', () => {
  const ev = [
    { id: 'a', title: 'Kigali Gala', date: '2026-12-16', startTime: '18:00:00', location: 'Convention Centre', status: 'upcoming' },
    { id: 'b', title: 'Corporate', date: '2026-11-22', startTime: '10:00', location: { address: 'Jalia Hall', city: '' }, status: 'upcoming' },
    { id: 'c', title: 'Old', date: '2026-11-01', status: 'completed' },
    { id: 'd', title: 'Cancelled', date: '2026-11-30', status: 'cancelled' },
    { id: 'e', title: 'On air', date: '2026-11-16', status: 'ongoing' },
  ];
  it('lists the next ones soonest first, without past or ended events', () => {
    const u = upcoming(ev, '2026-11-16');
    expect(u.map((x) => x.id)).toEqual(['e', 'b', 'a']);
    expect(u[1]).toMatchObject({ day: '22', month: 'NOV', time: '10:00', place: 'Jalia Hall', status: 'upcoming' });
    expect(u[0].status).toBe('live');
  });
});

describe('recent activity rows', () => {
  it('uses the grouped amount for retried payments and never the raw value text', () => {
    const rows = activityRows([
      { id: 'payment:1', type: 'payment', label: 'Jambolush promotion', value: 'PENDING - 16304.347826', status: 'PENDING', amount: 16304.35, groupAmount: 48913.05, count: 3, currency: 'USD' },
      { id: 'payment:2', type: 'payment', label: 'Wedding', status: 'COMPLETED', amount: 60, count: 1, currency: 'USD' },
      { id: 'event:1', type: 'event', label: 'Kigali Gala', value: 'upcoming', status: 'upcoming' },
    ]);
    expect(rows[0]).toMatchObject({ amount: 48913.05, subtitle: 'pending:3', tone: 'pending', currency: 'USD' });
    expect(rows[1]).toMatchObject({ amount: 60, subtitle: 'received', tone: 'success' });
    expect(rows[2]).toMatchObject({ kind: 'event', amount: null, tone: 'info' });
    expect(JSON.stringify(rows)).not.toContain('16304.347826');
  });
  it('shows no amount for an old response or a collaborator (no amount fields)', () => {
    const [r] = activityRows([{ type: 'payment', label: 'X', value: 'PENDING - 10', status: 'PENDING' }]);
    expect(r.amount).toBeNull();
  });
});

describe('small rules', () => {
  it('greets by the local hour', () => {
    expect(greetingKey(7)).toBe('Good morning');
    expect(greetingKey(13)).toBe('Good afternoon');
    expect(greetingKey(19)).toBe('Good evening');
    expect(greetingKey(23)).toBe('Good night');
  });
  it('measures goal progress only against a real target', () => {
    expect(progress(50, '$100')).toBe(0.5);
    expect(progress(150, 100)).toBe(1);
    expect(progress(50, '')).toBeNull();
    expect(progress(null, 100)).toBeNull();
  });
});
