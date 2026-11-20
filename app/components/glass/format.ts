/**
 * Dates, times and plurals for the Compact Glass pages, in the viewer's language and timezone.
 *
 * The backend writes LocalDateTime values without a zone ("2026-11-17T16:50:54.172819"). The server and its JVM run
 * on UTC, so a zone-less timestamp is read as UTC and then shown in the viewer's own timezone; a date-only value
 * ("2026-05-25") is a calendar day and is never shifted.
 */

const LOCALES: Record<string, string> = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES', rw: 'rw-RW', sw: 'sw-TZ' };
export const localeFor = (lang?: string) => LOCALES[lang || 'en'] || 'en-GB';
/** 12-hour times like the app ("4:50 PM") in English; the other languages use their own clock. */
const timeLocale = (lang?: string) => (!lang || lang === 'en' ? 'en-US' : localeFor(lang));

export function parseServerDate(v: string | number | Date | null | undefined): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
  const s = String(v).trim();
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    d = new Date(s.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1') + 'Z');
  } else {
    d = new Date(s);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayOffset = (d: Date, now: Date) => {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
};

/** "25 May 2026" (the year is dropped for this year when `short`). Empty string for a missing or bad date. */
export function fmtDay(v: Parameters<typeof parseServerDate>[0], lang?: string, opts: { short?: boolean } = {}): string {
  const d = parseServerDate(v); if (!d) return '';
  const now = new Date();
  const year = opts.short && d.getFullYear() === now.getFullYear() ? undefined : 'numeric';
  return d.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short', year });
}

/** "4:50 PM" */
export function fmtTime(v: Parameters<typeof parseServerDate>[0], lang?: string): string {
  const d = parseServerDate(v); if (!d) return '';
  return d.toLocaleTimeString(timeLocale(lang), { hour: 'numeric', minute: '2-digit' });
}

type T = (s: string) => string;

/** A divider above each day of messages: "Today", "Yesterday", or "Tue, 6 Oct" (with the year when not this year). */
export function fmtDayDivider(v: Parameters<typeof parseServerDate>[0], t: T, lang?: string, now = new Date()): string {
  const d = parseServerDate(v); if (!d) return '';
  const off = dayOffset(d, now);
  if (off === 0) return t('Today');
  if (off === 1) return t('Yesterday');
  return d.toLocaleDateString(localeFor(lang), { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

/** The conversation list's time: "4:50 PM" today, "Yesterday", the weekday this week, else "6 Oct". */
export function fmtListTime(v: Parameters<typeof parseServerDate>[0], t: T, lang?: string, now = new Date()): string {
  const d = parseServerDate(v); if (!d) return '';
  const off = dayOffset(d, now);
  if (off === 0) return fmtTime(d, lang);
  if (off === 1) return t('Yesterday');
  if (off > 1 && off < 7) return d.toLocaleDateString(localeFor(lang), { weekday: 'short' });
  return fmtDay(d, lang, { short: true });
}

/** "Last seen yesterday at 4:50 PM", "Last seen today at 9:12 AM", "Last seen on 6 Oct at 5:58 PM". */
export function fmtLastSeen(v: Parameters<typeof parseServerDate>[0], t: T, lang?: string, now = new Date()): string {
  const d = parseServerDate(v); if (!d) return '';
  const off = dayOffset(d, now);
  const at = fmtTime(d, lang);
  if (off === 0) return `${t('Last seen today at')} ${at}`;
  if (off === 1) return `${t('Last seen yesterday at')} ${at}`;
  return `${t('Last seen on')} ${fmtDay(d, lang, { short: true })} ${t('at')} ${at}`;
}

/** "1 booking", "5 bookings": the noun is translated as a whole word, never glued to the number. */
export function plural(n: number, one: string, many: string, t: T): string {
  return `${n} ${t(n === 1 ? one : many)}`;
}

export { sameDay };
