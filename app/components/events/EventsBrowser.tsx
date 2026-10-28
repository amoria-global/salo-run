'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { dayKey, monthGrid, parseDayKey, shiftDays, shiftMonth, weekOf } from '@/lib/events/calendarDays';
import {
  dateChipLabel, dayFilter, dayLabel, dayOf, rangeFilter, STATUS_LABEL,
  type Counts, type DateFilter, type EmptyInfo, type FilterItem, type Groups, type StatusFilter, type StatusKey,
} from '@/lib/events/eventsFilter';

const ACTIVE_BG = 'linear-gradient(180deg, #5B8CFF 0%, #3E6FD8 55%, #3360C4 100%)';
const SOFT = '#C9D5EA';

/**
 * One inset bar of equal tabs, each with an icon and a label, 50px tall, every tab visible without scrolling. The active
 * tab is a raised blue gradient pill with white text; inactive tabs use the soft light text colour, never a dim grey.
 * The same bar as the mobile app's Events screen.
 */
export function SectionTabsBar<K extends string>({ tabs, value, onChange, label = 'Library sections' }: {
  tabs: readonly { key: K; label: string; icon: string }[];
  value: K;
  onChange: (k: K) => void;
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <div role="tablist" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, gap: 4, padding: 4, borderRadius: 16, background: '#0F1B33', border: '1px solid #223457', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.35)' }}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.key)}
            style={{ height: 50, border: 0, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer', font: 'inherit', fontSize: 12.5, fontWeight: 700,
              background: on ? ACTIVE_BG : 'transparent', color: on ? '#fff' : SOFT, boxShadow: on ? '0 1px 0 rgba(255,255,255,0.35) inset, 0 6px 18px rgba(62,111,216,0.35)' : 'none' }}>
            <i className={`bi ${t.icon}`} aria-hidden="true" style={{ fontSize: 16 }} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type EventsLayout = 'list' | 'calendar';
const ORDER: StatusFilter[] = ['all', 'upcoming', 'ongoing', 'completed'];

/** Status chips with counts, the date chip ("Any date" or a removable picked day) and the List | Calendar switch. */
export function EventsToolbar({ counts, status, onStatus, date, onClearDate, onPickDate, layout, onLayout, search, onSearch }: {
  counts: Counts;
  status: StatusFilter;
  onStatus: (s: StatusFilter) => void;
  date: DateFilter;
  onClearDate: () => void;
  onPickDate: () => void;
  layout: EventsLayout;
  onLayout: (l: EventsLayout) => void;
  search: string;
  onSearch: (s: string) => void;
}) {
  const { colors } = useTheme();
  const pill = (on: boolean): React.CSSProperties => ({ minHeight: 40, padding: '0 14px', borderRadius: 9999, border: `1px solid ${on ? '#3E6FD8' : colors.borderPrimary}`, background: on ? 'rgba(62,111,216,0.18)' : 'transparent', color: on ? colors.textPrimary : colors.textSecondary, fontWeight: 700, cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 });
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div role="tablist" aria-label="Event status" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {ORDER.map((s) => (
          <button key={s} type="button" role="tab" aria-selected={status === s} aria-label={`${STATUS_LABEL[s]}, ${counts[s]}`} onClick={() => onStatus(s)} style={pill(status === s)}>
            {s === 'ongoing' ? <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: '#37d0e6' }} /> : null}
            <span>{STATUS_LABEL[s]}</span>
            <span style={{ minWidth: 22, height: 20, borderRadius: 10, padding: '0 6px', display: 'inline-grid', placeItems: 'center', fontSize: 12, background: 'rgba(0,0,0,0.25)' }}>{counts[s]}</span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, minWidth: 220, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9999, padding: '0 12px', minHeight: 40 }}>
          <i className="bi bi-search" aria-hidden="true" style={{ color: colors.textSecondary }} />
          <input aria-label="Search events" placeholder="Search events…" value={search} onChange={(e) => onSearch(e.target.value)} style={{ flex: 1, border: 0, outline: 0, background: 'transparent', color: colors.textPrimary, font: 'inherit' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        {date ? (
          <button type="button" onClick={onClearDate} aria-label={`${dateChipLabel(date)}. Remove the date filter`} style={{ ...pill(true), borderColor: '#7fa8ff' }}>
            <i className="bi bi-calendar3" aria-hidden="true" /> {dateChipLabel(date)} <i className="bi bi-x-circle-fill" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={onPickDate} aria-label="Any date. Choose a date in the calendar" style={pill(false)}>
            <i className="bi bi-calendar3" aria-hidden="true" /> Any date <i className="bi bi-chevron-down" aria-hidden="true" style={{ fontSize: 11 }} />
          </button>
        )}
        <div role="radiogroup" aria-label="Events layout" style={{ display: 'inline-flex', padding: 3, gap: 2, borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, background: colors.bgPrimary }}>
          {(['list', 'calendar'] as const).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={layout === l} onClick={() => onLayout(l)}
              style={{ minHeight: 36, padding: '0 14px', border: 0, borderRadius: 9, font: 'inherit', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: layout === l ? colors.bgCard : 'transparent', color: layout === l ? colors.textPrimary : colors.textSecondary }}>
              <i className={`bi ${l === 'list' ? 'bi-list-ul' : 'bi-calendar3'}`} aria-hidden="true" /> {l === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type CalendarMode = 'month' | 'week' | 'agenda';
const MODES: { key: CalendarMode; label: string }[] = [{ key: 'month', label: 'Month' }, { key: 'week', label: 'Week' }, { key: 'agenda', label: 'Agenda' }];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AGENDA_DAYS = 14;

const monthTitle = (k: string) => parseDayKey(k).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
function weekTitle(days: string[]): string {
  const a = parseDayKey(days[0]);
  const b = parseDayKey(days[6]);
  const m = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  return a.getMonth() === b.getMonth() ? `${a.getDate()} to ${b.getDate()} ${m(b)}` : `${a.getDate()} ${m(a)} to ${b.getDate()} ${m(b)}`;
}

/** Month, Week and Agenda, shown only when the user opens the calendar. Picking a day sets the date filter. */
export function EventsCalendar({ events, date, onSelect, mode, onMode }: {
  events: readonly FilterItem[];
  date: DateFilter;
  onSelect: (d: DateFilter) => void;
  mode: CalendarMode;
  onMode: (m: CalendarMode) => void;
}) {
  const { colors, actualTheme } = useTheme();
  const link = actualTheme === 'dark' ? '#7fa8ff' : '#1d4fd7';
  const today = dayKey(new Date());
  const [anchor, setAnchor] = useState(date?.from ?? today);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) {
      const d = dayOf(e);
      if (d) m.set(d, (m.get(d) ?? 0) + 1);
    }
    return m;
  }, [events]);
  const picked = (k: string) => !!date && k >= date.from && k <= date.to;
  const week = weekOf(anchor);
  const nav: React.CSSProperties = { width: 44, height: 44, borderRadius: 9999, border: 0, background: 'transparent', color: colors.textSecondary, cursor: 'pointer', fontSize: 16 };
  const card: React.CSSProperties = { background: colors.bgCard, border: `1px solid ${colors.borderPrimary}`, borderRadius: 16, padding: 14, display: 'grid', gap: 6, maxWidth: 520 };
  const dayBtn = (k: string, inMonth = true): React.CSSProperties => ({ minHeight: 46, border: picked(k) ? 0 : k === today ? '1px solid #7fa8ff' : 0, borderRadius: 10, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 2, cursor: 'pointer', font: 'inherit', fontWeight: 700, background: picked(k) ? '#2f6df0' : 'transparent', color: picked(k) ? '#fff' : inMonth ? colors.textPrimary : colors.textSecondary });
  const dot = (k: string): React.ReactNode => <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: counts.get(k) ? (picked(k) ? '#fff' : '#7fa8ff') : 'transparent' }} />;
  const label = (k: string) => `${dayLabel(k)}${counts.get(k) ? `, ${counts.get(k)} event${counts.get(k) === 1 ? '' : 's'}` : ', no events'}`;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div role="tablist" aria-label="Calendar mode" style={{ display: 'inline-flex', padding: 3, gap: 2, borderRadius: 12, border: `1px solid ${colors.borderPrimary}`, justifySelf: 'start' }}>
        {MODES.map((m) => (
          <button key={m.key} type="button" role="tab" aria-selected={mode === m.key} onClick={() => onMode(m.key)} style={{ minHeight: 36, padding: '0 14px', border: 0, borderRadius: 9, font: 'inherit', fontWeight: 700, cursor: 'pointer', background: mode === m.key ? colors.bgCard : 'transparent', color: mode === m.key ? colors.textPrimary : colors.textSecondary }}>{m.label}</button>
        ))}
      </div>

      {mode === 'month' ? (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" aria-label="Previous month" onClick={() => setAnchor(shiftMonth(anchor, -1))} style={nav}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
            <strong style={{ color: colors.textPrimary }} role="heading" aria-level={3}>{monthTitle(anchor)}</strong>
            <button type="button" aria-label="Next month" onClick={() => setAnchor(shiftMonth(anchor, 1))} style={nav}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', color: colors.textSecondary, fontSize: 12, fontWeight: 700 }}>{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
          {monthGrid(anchor).map((wk) => (
            <div key={wk[0]} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {wk.map((k) => (
                <button key={k} type="button" aria-pressed={picked(k)} aria-label={label(k)} onClick={() => onSelect(picked(k) && date?.from === date?.to ? null : dayFilter(k))} style={dayBtn(k, parseDayKey(k).getMonth() === parseDayKey(anchor).getMonth())}>
                  <span>{parseDayKey(k).getDate()}</span>{dot(k)}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {mode === 'week' ? (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" aria-label="Previous week" onClick={() => setAnchor(shiftDays(anchor, -7))} style={nav}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
            <strong style={{ color: colors.textPrimary }} role="heading" aria-level={3}>{weekTitle(week)}</strong>
            <button type="button" aria-label="Next week" onClick={() => setAnchor(shiftDays(anchor, 7))} style={nav}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {week.map((k) => (
              <button key={k} type="button" aria-pressed={picked(k)} aria-label={label(k)} onClick={() => onSelect(picked(k) && date?.from === date?.to ? null : dayFilter(k))} style={dayBtn(k)}>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{WEEKDAYS[(parseDayKey(k).getDay() + 6) % 7]}</span><span>{parseDayKey(k).getDate()}</span>{dot(k)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onSelect(rangeFilter(week[0], week[6]))} style={{ justifySelf: 'start', minHeight: 44, border: 0, background: 'transparent', color: link, fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>Show the whole week</button>
        </div>
      ) : null}

      {mode === 'agenda' ? (
        <div style={card}>
          <strong style={{ color: colors.textPrimary }} role="heading" aria-level={3}>Next {AGENDA_DAYS} days</strong>
          {Array.from({ length: AGENDA_DAYS }, (_, i) => shiftDays(today, i)).map((k) => {
            const n = counts.get(k) ?? 0;
            return (
              <button key={k} type="button" aria-pressed={picked(k)} aria-label={`${dayLabel(k)}, ${n} event${n === 1 ? '' : 's'}`} onClick={() => onSelect(picked(k) ? null : dayFilter(k))}
                style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', border: 0, borderRadius: 10, font: 'inherit', fontWeight: 700, cursor: 'pointer', background: picked(k) ? '#2f6df0' : 'transparent', color: picked(k) ? '#fff' : colors.textPrimary }}>
                <span>{dayLabel(k)}</span><span style={{ fontSize: 12.5, color: picked(k) ? '#fff' : n ? link : colors.textSecondary }}>{n ? `${n} event${n === 1 ? '' : 's'}` : 'Free'}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const SECTION_TITLES: Record<StatusKey, string> = { ongoing: 'Ongoing now', upcoming: 'Upcoming', completed: 'Completed' };

/** A compact row: date tile, title, "Sun · 1:00 PM · Kabuga", status pill, then the row's actions and a chevron. */
export function EventRowShell({ day, title, meta, status, pending, onOpen, actions }: {
  day: string | null;
  title: string;
  meta: string;
  status: StatusKey;
  pending?: boolean;
  onOpen: () => void;
  actions?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const d = day ? parseDayKey(day) : null;
  const live = status === 'ongoing';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, background: colors.bgCard, border: `1px solid ${live ? '#37d0e6' : colors.borderPrimary}`, flexWrap: 'wrap' }}>
      <button type="button" onClick={onOpen} aria-label={`${title}. ${meta}. ${live ? 'Ongoing' : status === 'completed' ? 'Completed' : pending ? 'Awaiting your reply' : 'Upcoming'}`}
        style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: colors.textPrimary }}>
        {d ? (
          <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 12, background: colors.bgPrimary, border: `1px solid ${colors.borderPrimary}`, display: 'grid', placeItems: 'center', alignContent: 'center', flex: 'none' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#F20C8F', letterSpacing: '0.06em' }}>{d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</span>
            <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</span>
          </span>
        ) : null}
        <span style={{ minWidth: 0, display: 'grid', gap: 2 }}>
          <strong style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</strong>
          <span style={{ fontSize: 13.5, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>
        </span>
        {live ? <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 9999, border: '1px solid #37d0e6', color: '#37d0e6' }}>ONGOING</span> : pending ? <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 9999, border: '1px solid #F59E0B', color: '#F59E0B' }}>PENDING</span> : null}
        <i className="bi bi-chevron-right" aria-hidden="true" style={{ color: colors.textSecondary }} />
      </button>
      {actions ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

/** The list under the filters: Ongoing now, then Upcoming (soonest first), then Completed (newest first). */
export function GroupedEvents<T>({ groups, renderRow }: { groups: Groups<T>; renderRow: (e: T, s: StatusKey) => React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {(['ongoing', 'upcoming', 'completed'] as const).map((s) => groups[s].length ? (
        <section key={s} aria-label={SECTION_TITLES[s]} style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 12, letterSpacing: '0.1em', color: colors.textSecondary, textTransform: 'uppercase' }}>{SECTION_TITLES[s]} <span style={{ fontWeight: 600 }}>{groups[s].length}</span></h3>
          {groups[s].map((e) => renderRow(e, s))}
        </section>
      ) : null)}
    </div>
  );
}

/** What to say when a filter returns nothing. */
export function EmptyResult({ info, canShowAll, onShowAll, showAllLabel, onJump }: { info: EmptyInfo; canShowAll: boolean; onShowAll: () => void; showAllLabel: string; onJump: () => void }) {
  const { colors, actualTheme } = useTheme();
  const link = actualTheme === 'dark' ? '#7fa8ff' : '#1d4fd7';
  const btn: React.CSSProperties = { minHeight: 44, padding: '0 18px', borderRadius: 9999, border: `1px solid ${link}`, background: 'transparent', color: link, fontWeight: 700, cursor: 'pointer', font: 'inherit' };
  return (
    <div role="status" style={{ textAlign: 'center', padding: '28px 12px', display: 'grid', gap: 8, justifyItems: 'center' }}>
      <strong style={{ fontSize: 17, color: colors.textPrimary }}>{info.title}</strong>
      {info.otherDays ? <span style={{ color: colors.textSecondary }}>{info.otherDays}</span> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        {canShowAll ? <button type="button" onClick={onShowAll} style={btn}>{showAllLabel}</button> : null}
        {info.nextDay ? <button type="button" onClick={onJump} style={btn}>Jump to next</button> : null}
      </div>
    </div>
  );
}
