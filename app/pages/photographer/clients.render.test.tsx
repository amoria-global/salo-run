import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
const auth = vi.hoisted(() => ({ user: { id: 'p1' }, token: 't' }));
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', normalizeImageUrl: (u?: string) => u }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
const money = { formatPrice: (n: number) => `$${n}`, priceParts: (n: number) => ({ code: 'USD', prefix: 'USD', tight: false, text: Number(n).toFixed(2), value: n }) };
vi.mock('@/app/context/CurrencyContext', () => ({ useCurrency: () => money }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => ({ actualTheme: 'light', colors: new Proxy({}, { get: () => '#111' }) }) }));
vi.mock('../../components/sidebar', () => ({ default: () => null }));
vi.mock('../../components/topbar', () => ({ default: () => null }));
vi.mock('next/link', () => ({ default: ({ href, children, onClick, className, ...rest }: { href: string; children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; className?: string }) => <a href={href} onClick={onClick} className={className} {...rest}>{children}</a> }));
vi.mock('next/image', () => ({ default: () => null }));

import ClientsPage from './clients';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const clients = [
  { id: 'c1', firstName: 'Solange', lastName: 'Ahishakiye', email: 's@x.test', city: 'Kigali', totalBookings: 1, totalSpent: 0.07, firstContactedAt: '2026-05-25T10:00:00', lastBookingDate: '2026-05-25', lastEventType: 'Academic', status: 'active', bookings: [], tipsAndBonuses: [] },
  { id: 'c2', firstName: 'Mugwiza', lastName: 'Jackson', email: 'm@x.test', city: 'Kigali', totalBookings: 2, totalSpent: 412.5, firstContactedAt: '2026-04-01T10:00:00', lastBookingDate: '2026-11-10', lastEventType: 'Wedding', status: 'active', review: { rating: 4.8, reviewText: 'Great', reviewDate: '2026-11-11' }, bookings: [], tipsAndBonuses: [] },
  { id: 'c3', firstName: 'Micheal', lastName: 'Jackson', email: '', totalBookings: 0, totalSpent: 0, firstContactedAt: '2026-03-01T10:00:00', status: 'active', bookings: [], tipsAndBonuses: [] },
];
const bookings = [{ id: 'b1', status: 'PENDING', clientName: 'Igihe Ltd', eventType: 'Corporate', eventDate: '2026-12-01', totalAmount: 200 }];
const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;
let mode: 'ok' | 'empty' | 'down' = 'ok';

let host: HTMLDivElement;
let root: Root;
const calls = (method: string, suffix: string) => mockFetch.mock.calls.filter((c) => ((c[1] as RequestInit | undefined)?.method || 'GET') === method && String(c[0]).endsWith(suffix));
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const mount = async () => { await act(async () => { root.render(<ClientsPage />); }); await flush(); };
const text = () => document.body.textContent || '';
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await flush(); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));

beforeEach(() => {
  mode = 'ok';
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (mode === 'down' && !init?.method) return res({}, false);
    if (u.endsWith('/photographer/clients') && !init?.method) return res({ action: 1, data: mode === 'empty' ? [] : clients.map((c) => ({ ...c })) });
    if (u.endsWith('/chat/conversations')) return res({ action: 1, data: [] });
    if (u.endsWith('/favorite-clients') && !init?.method) return res({ action: 1, data: ['c2'] });
    if (u.endsWith('/photographer/bookings')) return res({ action: 1, data: mode === 'empty' ? [] : bookings.map((b) => ({ ...b })) });
    if (u.endsWith('/photographer/balance')) return res({ action: 1, data: { totalTips: 0, totalBonuses: 0 } });
    return res({ action: 1 });
  });
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.classList.remove('ui-glass'); vi.unstubAllGlobals(); });

describe.each([['classic', false], ['Compact Glass', true]])('Clients (%s)', (_n, glass) => {
  beforeEach(() => { if (glass) document.documentElement.classList.add('ui-glass'); });

  it('loads clients, favourites, balance and bookings from the photographer endpoints', async () => {
    await mount();
    for (const s of ['/photographer/clients', '/chat/conversations', '/photographer/favorite-clients', '/photographer/balance', '/photographer/bookings']) {
      expect(calls('GET', s).length).toBeGreaterThan(0);
    }
    expect(text()).toContain('Solange');
    expect(text()).toContain('Mugwiza');
  });

  it('favourite toggles through the API', async () => {
    await mount();
    if (glass) {
      await click(button(/More options for Solange/));
      await click(button(/Add to favorites/));
    } else {
      const heart = Array.from(document.querySelectorAll('button')).find((b) => b.closest('[style]') && /Solange/.test(b.closest('div[style*="cursor"]')?.textContent || '') && !b.textContent?.trim());
      await click(heart || button(/favorite/i));
    }
    expect(calls('POST', '/favorite-clients/c1').length + calls('POST', '/favorite-clients/c2').length + calls('POST', '/favorite-clients/c3').length).toBe(1);
  });
});

describe('Clients (Compact Glass only)', () => {
  beforeEach(() => { document.documentElement.classList.add('ui-glass'); });

  it('shows the reference columns in order, ISO amounts, plurals and readable states', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {} }));
    await mount();
    const heads = Array.from(document.querySelectorAll('[role=columnheader]')).map((h) => h.textContent);
    expect(heads).toEqual(['Client', 'Last booking', 'Bookings', 'Total spent', 'Review', 'Status', 'Actions']);
    expect(text()).toContain('USD');
    expect(text()).not.toMatch(/\$\d/);
    expect(text()).toContain('No bookings yet');
    expect(text()).toContain('Location not set');
    expect(text()).toContain('No review');
    expect(text()).not.toMatch(/Bookingsec|undefined|NaN/);
    // filter counts are readable badges
    const fav = button(/^Favorites/);
    expect(fav?.querySelector('.gp-seg-count')?.textContent).toBe('1');
  });

  it('phone cards use plurals and quiet tips text, never a tips button', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    await mount();
    expect(text()).toContain('1 booking');
    expect(text()).toContain('2 bookings');
    expect(text()).toContain('0 bookings');
    expect(text()).toContain('No tips yet');
    expect(button(/^No tips/)).toBeUndefined();
  });

  it('Message links to the inbox with the client name; Gallery links to events', async () => {
    await mount();
    const msg = Array.from(document.querySelectorAll('a')).find((a) => /Message/.test(a.textContent || '') && /Solange/.test(a.getAttribute('href') || ''));
    expect(msg?.getAttribute('href')).toBe('/user/photographer/inbox?client=Solange%20Ahishakiye');
    expect(document.querySelector('a[aria-label^="Gallery"]')?.getAttribute('href')).toBe('/user/photographer/events');
  });

  it('Remove client asks first, then deletes', async () => {
    await mount();
    await click(button(/More options for Solange/));
    await click(button(/^Remove client$/));
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('Remove this client?');
    await click(button(/^Cancel$/));
    expect(calls('DELETE', '/photographer/clients/c1')).toHaveLength(0);
    await click(button(/More options for Solange/));
    await click(button(/^Remove client$/));
    await click(Array.from(document.querySelectorAll('.gp-modal-foot button')).pop());
    expect(calls('DELETE', '/photographer/clients/c1')).toHaveLength(1);
    expect(text()).not.toContain('Solange');
  });

  it('booking requests: accept posts and refreshes', async () => {
    await mount();
    await click(button(/^Booking requests/));
    expect(text()).toContain('Igihe Ltd');
    await click(button(/^Accept$/));
    expect(calls('POST', '/photographer/bookings/b1/accept')).toHaveLength(1);
  });

  it('empty and error states', async () => {
    mode = 'empty';
    await mount();
    expect(text()).toContain('No clients yet');
    act(() => root.unmount()); root = createRoot(host);
    mode = 'down';
    await mount();
    expect(text()).toContain('We could not load your clients.');
    mode = 'ok';
    await click(button(/Retry/));
    expect(text()).toContain('Solange');
  });

  it('loading shows a skeleton', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    await act(async () => { root.render(<ClientsPage />); });
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
