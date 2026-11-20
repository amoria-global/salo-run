import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/app/context/ThemeContext', () => ({
  useTheme: () => ({ colors: new Proxy({}, { get: () => '#000' }), actualTheme: 'light' }),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

const api = vi.hoisted(() => ({
  list: vi.fn(), one: vi.fn(), approve: vi.fn(), reject: vi.fn(),
}));
vi.mock('@/app/lib/hybridBooking', async (orig) => {
  const actual = await orig<typeof import('@/app/lib/hybridBooking')>();
  return {
    ...actual,
    getPhotographerOpportunities: api.list,
    getPhotographerOpportunity: api.one,
    approveOpportunity: api.approve,
    rejectOpportunity: api.reject,
    syncServerClock: vi.fn(),
  };
});

import GlassOpportunities from './GlassOpportunities';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const opp = (over: Record<string, unknown> = {}) => ({
  opportunityId: 'o1', status: 'INVITED', eventTitle: 'Ben & Raya Wedding', eventType: 'Wedding', eventDate: '2030-11-28',
  startTime: '10:00:00', endTime: '16:00:00', durationLabel: '6 h', city: 'Kigali', venue: null, distanceLabel: '4 km',
  minBudget: null, maxBudget: null, matchReasons: ['Free for the whole event'], instructions: 'Bring a second shooter',
  responseDeadlineAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), eventStartAt: null, ...over,
});

let host: HTMLDivElement;
let root: Root;
const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const mount = async (el: React.ReactElement) => { await act(async () => { root.render(el); }); await flush(); };
const text = () => host.textContent || '';
const btn = (label: RegExp) => Array.from(host.querySelectorAll('button')).find((b) => label.test(b.textContent || '')) as HTMLButtonElement | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe('GlassOpportunities (parity with the classic page)', () => {
  it('lists an open opportunity with its facts, the match reasons and both actions', async () => {
    api.list.mockResolvedValue([opp()]);
    await mount(<GlassOpportunities />);
    expect(api.list).toHaveBeenCalledWith('PENDING_RESPONSE');
    expect(text()).toContain('Ben & Raya Wedding');
    expect(text()).toContain('Kigali');
    expect(text()).toContain('Free for the whole event');
    expect(text()).toContain('Bring a second shooter');
    expect(btn(/Yes, I'm available/)).toBeTruthy();
    expect(btn(/Not this time/)).toBeTruthy();
    expect(btn(/^New/)?.getAttribute('aria-selected')).toBe('true');
  });

  it('saying yes calls the approve endpoint and shows the confirmation', async () => {
    api.list.mockResolvedValue([opp()]);
    api.approve.mockResolvedValue({});
    await mount(<GlassOpportunities />);
    await act(async () => { btn(/Yes, I'm available/)!.click(); });
    await flush();
    expect(api.approve).toHaveBeenCalledWith('o1');
    expect(text()).toContain('You said yes to Ben & Raya Wedding');
  });

  it('passing opens a confirmation with the reasons, and sends the chosen reason', async () => {
    api.list.mockResolvedValue([opp()]);
    api.reject.mockResolvedValue({});
    await mount(<GlassOpportunities />);
    await act(async () => { btn(/Not this time/)!.click(); });
    expect(host.querySelector('[role=dialog]')).not.toBeNull();
    expect(api.reject).not.toHaveBeenCalled();
    await act(async () => { btn(/^Too far$/)!.click(); });
    await act(async () => { btn(/^Pass$/)!.click(); });
    await flush();
    expect(api.reject).toHaveBeenCalledWith('o1', 'Too far');
    expect(host.querySelector('[role=dialog]')).toBeNull();
    expect(text()).toContain('You passed on Ben & Raya Wedding');
  });

  it('"Keep it" closes the dialog without sending anything', async () => {
    api.list.mockResolvedValue([opp()]);
    await mount(<GlassOpportunities />);
    await act(async () => { btn(/Not this time/)!.click(); });
    await act(async () => { btn(/Keep it/)!.click(); });
    expect(api.reject).not.toHaveBeenCalled();
    expect(host.querySelector('[role=dialog]')).toBeNull();
  });

  it('shows the empty state with the matching-profile link on New, and loads the other tabs', async () => {
    api.list.mockResolvedValue([]);
    await mount(<GlassOpportunities />);
    expect(text()).toContain('No open opportunities right now');
    expect(host.querySelector('a[href="/user/photographer/profile#matching"]')).not.toBeNull();
    await act(async () => { btn(/Waiting for client/)!.click(); });
    await flush();
    expect(api.list).toHaveBeenLastCalledWith('APPROVED');
    expect(host.querySelector('a[href="/user/photographer/profile#matching"]')).toBeNull();
  });

  it('shows an error with Retry that loads again', async () => {
    api.list.mockRejectedValueOnce(new Error('Network down')).mockResolvedValue([opp()]);
    await mount(<GlassOpportunities />);
    expect(host.querySelector('[role=alert]')?.textContent).toContain('Network down');
    await act(async () => { btn(/Retry/)!.click(); });
    await flush();
    expect(text()).toContain('Ben & Raya Wedding');
  });

  it('opens History for a notification link to a closed opportunity', async () => {
    api.one.mockResolvedValue({ status: 'SELECTED' });
    api.list.mockResolvedValue([opp({ status: 'SELECTED', eventStartAt: new Date(Date.now() + 3600000).toISOString() })]);
    await mount(<GlassOpportunities focusCandidateId="o1" />);
    await flush();
    expect(api.list).toHaveBeenLastCalledWith('ALL');
    expect(host.querySelector('a[href="/user/photographer/events"]')?.textContent).toContain('Open booking');
  });
});
