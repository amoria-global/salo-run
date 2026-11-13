/** Day arithmetic for the Events calendar. Days are local "YYYY-MM-DD" keys; weeks start on Monday. */
const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function shiftDays(key: string, days: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

/** Monday-first week containing `key`. */
export function weekOf(key: string): string[] {
  const sinceMonday = (parseDayKey(key).getDay() + 6) % 7;
  const monday = shiftDays(key, -sinceMonday);
  return Array.from({ length: 7 }, (_, i) => shiftDays(monday, i));
}

/** Monday-first weeks covering the month that contains `key`, with the days around it that fill the grid. */
export function monthGrid(key: string): string[][] {
  const first = parseDayKey(key);
  first.setDate(1);
  const lastKey = dayKey(new Date(first.getFullYear(), first.getMonth() + 1, 0));
  const weeks: string[][] = [];
  let cursor = weekOf(dayKey(first))[0];
  while (cursor <= lastKey) {
    weeks.push(Array.from({ length: 7 }, (_, i) => shiftDays(cursor, i)));
    cursor = shiftDays(cursor, 7);
  }
  return weeks;
}

/** First day of the month `delta` months from the month containing `key`. */
export function shiftMonth(key: string, delta: number): string {
  const d = parseDayKey(key);
  return dayKey(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}
