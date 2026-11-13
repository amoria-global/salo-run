import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ actualTheme: 'dark', colors: { bgCard: '#111', bgPrimary: '#000', textPrimary: '#fff', textSecondary: '#99a', borderPrimary: '#334', brandAccent: '#F20C8F' } }),
}));

import { EmptyResult, EventRowShell, EventsCalendar, EventsToolbar, GroupedEvents, SectionTabsBar } from './EventsBrowser';
import { dayKey } from '@/lib/events/calendarDays';
import { dayFilter, dayLabel, emptyInfo, type DateFilter } from '@/lib/events/eventsFilter';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const render = (el: React.ReactElement) => act(() => root.render(el));
const byLabel = (label: string) => host.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement | null;
const buttonText = (t: string) => [...host.querySelectorAll('button')].find((b) => b.textContent === t) as HTMLButtonElement;

describe('SectionTabsBar', () => {
  const tabs = [
    { key: 'events', label: 'Events', icon: 'bi-calendar-event' },
    { key: 'albums', label: 'Albums', icon: 'bi-images' },
    { key: 'photobooks', label: 'Photobooks', icon: 'bi-book' },
    { key: 'content', label: 'Content', icon: 'bi-newspaper' },
  ] as const;

  it('is one bar of equal 50px tabs with an icon and a label, the active one raised blue with white text', () => {
    const onChange = vi.fn();
    render(<SectionTabsBar tabs={tabs} value="events" onChange={onChange} />);
    const buttons = [...host.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(['Events', 'Albums', 'Photobooks', 'Content']);
    expect(buttons.map((b) => b.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    expect(buttons.every((b) => b.style.height === '50px' && b.querySelector('i.bi'))).toBe(true);
    expect(buttons[0].style.color).toBe('#fff');
    expect(buttons[1].style.color).toBe('#C9D5EA');
    act(() => buttons[2].click());
    expect(onChange).toHaveBeenCalledWith('photobooks');
  });
});

describe('EventsToolbar', () => {
  const counts = { all: 60, upcoming: 29, ongoing: 1, completed: 30 };
  const base = { counts, status: 'all' as const, onStatus: () => {}, date: null as DateFilter, onClearDate: () => {}, onPickDate: () => {}, layout: 'list' as const, onLayout: () => {}, search: '', onSearch: () => {} };

  it('shows the four chips with full labels and counts, Any date and the List | Calendar switch', () => {
    render(<EventsToolbar {...base} />);
    expect(host.textContent).toContain('Completed');
    expect(byLabel('All, 60')).toBeTruthy();
    expect(byLabel('Upcoming, 29')).toBeTruthy();
    expect(byLabel('Completed, 30')).toBeTruthy();
    expect(host.textContent).toContain('Any date');
    expect([...host.querySelectorAll('[role="radio"]')].map((b) => b.textContent?.trim())).toEqual(['List', 'Calendar']);
  });

  it('a picked date is a removable chip that clears the filter', () => {
    const onClear = vi.fn();
    render(<EventsToolbar {...base} date={dayFilter('2026-10-28')} onClearDate={onClear} />);
    const chip = byLabel('Wed, 28 Oct. Remove the date filter')!;
    expect(chip.textContent).toContain('Wed, 28 Oct');
    act(() => chip.click());
    expect(onClear).toHaveBeenCalled();
    expect(host.textContent).not.toContain('Any date');
  });
});

describe('EventsCalendar', () => {
  const today = dayKey(new Date());
  const events = [{ id: 'a', title: 'A', eventDate: today, startTime: '10:00', eventStatus: 'PUBLISHED' }];

  it('shows Month, Week and Agenda, and picking a day reports it as a day filter', () => {
    const onSelect = vi.fn();
    render(<EventsCalendar events={events} date={null} onSelect={onSelect} mode="month" onMode={() => {}} />);
    expect([...host.querySelectorAll('[role="tab"]')].map((b) => b.textContent)).toEqual(['Month', 'Week', 'Agenda']);
    act(() => byLabel(`${dayLabel(today)}, 1 event`)!.click());
    expect(onSelect).toHaveBeenCalledWith({ from: today, to: today });
  });

  it('week mode can pick the whole week as a range', () => {
    const onSelect = vi.fn();
    render(<EventsCalendar events={events} date={null} onSelect={onSelect} mode="week" onMode={() => {}} />);
    act(() => buttonText('Show the whole week').click());
    const arg = onSelect.mock.calls[0][0] as { from: string; to: string };
    expect(arg.from < arg.to).toBe(true);
  });
});

describe('list and empty result', () => {
  it('groups rows under Ongoing now, Upcoming and Completed, and opens a row on click', () => {
    const onOpen = vi.fn();
    render(
      <GroupedEvents
        groups={{ ongoing: ['live'], upcoming: ['next'], completed: ['past'] }}
        renderRow={(e, s) => <EventRowShell key={e} day="2026-10-28" title={e} meta="Wed, 1:00 PM" status={s} onOpen={onOpen} />}
      />,
    );
    const text = host.textContent!;
    expect(text.indexOf('Ongoing now')).toBeLessThan(text.indexOf('Upcoming'));
    expect(text.indexOf('Upcoming')).toBeLessThan(text.indexOf('Completed'));
    act(() => (host.querySelector('button[aria-label^="next."]') as HTMLButtonElement).click());
    expect(onOpen).toHaveBeenCalled();
  });

  it('says what is missing, how many are on other days, and offers Show all dates and Jump to next', () => {
    const now = Date.parse('2026-10-28T08:00:00Z');
    const events = [{ id: 'a', eventDate: '2026-11-27', startTime: '16:00', eventStatus: 'PUBLISHED' }];
    const info = emptyInfo(events, { status: 'upcoming', date: dayFilter('2026-10-28'), search: '' }, now);
    const onShow = vi.fn();
    const onJump = vi.fn();
    render(<EmptyResult info={info} canShowAll showAllLabel="Show all dates" onShowAll={onShow} onJump={onJump} />);
    expect(host.textContent).toContain('No upcoming events on Wed, 28 Oct');
    expect(host.textContent).toContain('1 upcoming event on other days.');
    act(() => buttonText('Show all dates').click());
    act(() => buttonText('Jump to next').click());
    expect(onShow).toHaveBeenCalled();
    expect(onJump).toHaveBeenCalled();
  });
});
