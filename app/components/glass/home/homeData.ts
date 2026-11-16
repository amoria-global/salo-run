/**
 * Pure rules behind the Compact Glass Home (no React, no fetch), so they can be tested directly.
 */

export type Period = 'today' | 'week' | 'month' | 'custom';
export interface Range { from: string; to: string } // yyyy-mm-dd, inclusive

/** Query strings for the trends and performance endpoints. The chart's week is the last 7 days, like the trends. */
export function periodQuery(p: Period, range?: Range | null): { trends: string; performance: string } {
  if (p === 'custom' && range?.from && range?.to) {
    const r = `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
    return { trends: `period=custom&${r}`, performance: `period=custom&${r}` };
  }
  if (p === 'today') return { trends: 'period=today', performance: 'period=today' };
  if (p === 'month') return { trends: 'period=month', performance: 'period=month' };
  return { trends: 'period=week', performance: 'period=last7' };
}

export interface Trend { value?: number | null; changePercent?: number | null; trend?: string | null; currency?: string }

/**
 * What the chip under a card says. A percentage only when the previous period had data (the backend then sends a
 * number); 0 reads "No change"; no basis (null or missing) shows nothing rather than an invented +100%.
 */
export type Chip = { kind: 'up' | 'down'; percent: number } | { kind: 'flat' } | null;
export function trendChip(t?: Trend | null): Chip {
  if (!t || typeof t.changePercent !== 'number' || Number.isNaN(t.changePercent)) return null;
  const pct = Math.abs(t.changePercent);
  if (pct === 0 || t.trend === 'neutral') return { kind: 'flat' };
  return { kind: t.trend === 'down' ? 'down' : 'up', percent: Math.round(pct * 10) / 10 };
}

export interface RawEvent {
  id?: string; title?: string; date?: string; startTime?: string | null;
  /** /photographer/events sends { address, city, country }; other lists send a string. */
  location?: string | { address?: string; city?: string } | null;
  status?: string | null; eventStatus?: string | null; streamStatus?: string | null;
}
export interface UpcomingItem { id: string; title: string; date: string; day: string; month: string; time: string | null; place: string | null; status: 'live' | 'upcoming' | 'pending' }

const ENDED = new Set(['completed', 'cancelled', 'canceled', 'rejected', 'declined', 'ended']);

/** The next events (today onwards, not ended), soonest first. Live means broadcasting now (status "ongoing"). */
export function upcoming(events: RawEvent[], today: string, locale = 'en', limit = 4): UpcomingItem[] {
  return events
    .filter((e) => e.id && e.date && e.date.slice(0, 10) >= today)
    .filter((e) => !ENDED.has(String(e.status || '').toLowerCase()) && !ENDED.has(String(e.eventStatus || '').toLowerCase()))
    .sort((a, b) => (a.date! + (a.startTime || '')).localeCompare(b.date! + (b.startTime || '')))
    .slice(0, limit)
    .map((e) => {
      const d = new Date(`${e.date!.slice(0, 10)}T00:00:00`);
      const s = String(e.status || '').toLowerCase();
      const ev = String(e.eventStatus || '').toUpperCase();
      return {
        id: e.id!, title: e.title || '', date: e.date!.slice(0, 10),
        day: String(d.getDate()).padStart(2, '0'),
        month: d.toLocaleDateString(locale, { month: 'short' }).toUpperCase(),
        time: e.startTime ? String(e.startTime).slice(0, 5) : null,
        place: (typeof e.location === 'object' && e.location ? [e.location.address, e.location.city].filter(Boolean).join(', ') : e.location) || null,
        status: s === 'ongoing' ? 'live' : ev === 'PENDING' || s === 'pending' ? 'pending' : 'upcoming',
      };
    });
}

export interface RawActivity {
  id?: string; label?: string; value?: string; type?: string; status?: string; amount?: number | null;
  currency?: string | null; groupAmount?: number | null; count?: number; date?: string | null; link?: string | null;
}
export interface ActivityRow {
  key: string; kind: 'payment' | 'event'; title: string; subtitle: string; amount: number | null; currency: string | null;
  status: string; tone: 'success' | 'pending' | 'error' | 'info' | 'live'; link: string | null;
}

/**
 * One row per real item, from the structured fields the backend now sends (groupAmount and count for retried
 * payments). Older responses without them still render, with no amount rather than the raw "STATUS - 16304.347826".
 */
export function activityRows(raw: RawActivity[]): ActivityRow[] {
  return raw.map((a, i) => {
    const kind = a.type === 'payment' ? 'payment' : 'event';
    const status = String(a.status || (kind === 'event' ? a.value : '') || '').toLowerCase();
    const count = typeof a.count === 'number' ? a.count : 1;
    const amount = typeof a.groupAmount === 'number' ? a.groupAmount : typeof a.amount === 'number' ? a.amount : null;
    let tone: ActivityRow['tone'] = 'info';
    let subtitle: string;
    if (kind === 'payment') {
      tone = status === 'completed' || status === 'paid' ? 'success' : status === 'pending' || status === 'partial' ? 'pending'
        : status === 'failed' || status === 'refunded' || status === 'cancelled' ? 'error' : 'info';
      subtitle = tone === 'pending' ? (count > 1 ? `pending:${count}` : 'pending') : tone === 'success' ? 'received' : status || 'payment';
    } else {
      tone = status === 'ongoing' ? 'live' : status === 'completed' ? 'success' : 'info';
      subtitle = 'event';
    }
    return { key: a.id || `${kind}-${i}`, kind, title: a.label || '', subtitle, amount, currency: a.currency || null, status, tone, link: a.link || null };
  });
}

/** Greeting by local hour: morning 5-11, afternoon 12-16, evening 17-20, night otherwise. */
export function greetingKey(hour: number): 'Good morning' | 'Good afternoon' | 'Good evening' | 'Good night' {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

/** Goal progress, 0..1 (capped), or null when there is no target to measure against. */
export function progress(actual: number | null | undefined, target: string | number | null | undefined): number | null {
  const t = typeof target === 'number' ? target : parseFloat(String(target ?? '').replace(/[^0-9.]/g, ''));
  if (!t || !Number.isFinite(t) || t <= 0 || actual == null) return null;
  return Math.max(0, Math.min(1, actual / t));
}
