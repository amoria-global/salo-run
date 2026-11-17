import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => ({ user: { id: 'u1' }, token: 't' }) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('../../context/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `$${n}` }) }));
vi.mock('@/app/context/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `$${n}` }) }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => ({ actualTheme: 'light', colors: new Proxy({}, { get: () => '#111' }) }) }));
vi.mock('../../components/sidebar', () => ({ default: () => null }));
vi.mock('../../components/topbar', () => ({ default: () => null }));
vi.mock('../../components/PlatformAlert', () => ({ platformAlert: vi.fn() }));
vi.mock('next/link', () => ({ default: ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => <a href={href} onClick={onClick}>{children}</a> }));
vi.mock('next/image', () => ({ default: () => null }));

import NotificationsPage from './notifications';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const now = Date.now();
const rows = [
  { id: 'n1', type: 'BOOKING', title: 'Booking confirmed', message: 'Your photographer confirmed', createdAt: new Date(now - 60_000).toISOString(), isRead: false, referenceId: 'ev1' },
  { id: 'n2', type: 'SECURITY', title: 'New sign-in', message: 'A new device signed in', createdAt: new Date(now - 3_600_000).toISOString(), isRead: true },
];
const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

let host: HTMLDivElement;
let root: Root;
const calls = (method: string, suffix: string) => mockFetch.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === method && String(c[0]).endsWith(suffix));
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const mount = async (role: 'client' | 'event-coordinator') => { await act(async () => { root.render(<NotificationsPage userRole={role} />); }); await flush(); };
const text = () => host.textContent || '';
const click = async (el: Element | null | undefined) => { await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await flush(); };
const buttonText = (re: RegExp) => Array.from(host.querySelectorAll('button')).find((b) => re.test(b.textContent || ''));

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    if (!init?.method && String(url).includes('/notifications?')) return res({ action: 1, data: { content: rows.map((r) => ({ ...r })) } });
    return res({ action: 1 });
  });
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.classList.remove('ui-glass'); });

describe.each([['client', 'customer'], ['event-coordinator', 'coordinator']] as const)('%s Notifications', (role, api) => {
  describe.each([['classic', false], ['Compact Glass', true]])('(%s)', (_n, glass) => {
    beforeEach(() => { if (glass) document.documentElement.classList.add('ui-glass'); });

    it(`loads the newest 50 from the ${api} endpoint, newest first`, async () => {
      await mount(role);
      expect(mockFetch.mock.calls[0][0]).toBe(`https://api.test/api/remote/${api}/notifications?page=0&size=50`);
      expect(text()).toContain('Booking confirmed');
      expect(text().indexOf('Booking confirmed')).toBeLessThan(text().indexOf('New sign-in'));
    });

    it('marks everything read', async () => {
      await mount(role);
      await click(buttonText(/Mark all as read/));
      expect(calls('PATCH', '/notifications/read-all')).toHaveLength(1);
      expect(String(calls('PATCH', '/notifications/read-all')[0][0])).toContain(`/${api}/`);
    });

    it('Delete all asks first', async () => {
      await mount(role);
      if (glass) {
        await click(buttonText(/^Delete all$/));
        await click(buttonText(/^Cancel$/));
        expect(calls('DELETE', '/notifications/all')).toHaveLength(0);
        await click(buttonText(/^Delete all$/));
        await click(Array.from(host.querySelectorAll('.gp-modal-foot button')).pop());
      } else {
        (window as unknown as { confirm: unknown }).confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
        await click(buttonText(/Delete all/));
        expect(calls('DELETE', '/notifications/all')).toHaveLength(0);
        await click(buttonText(/Delete all/));
      }
      expect(calls('DELETE', '/notifications/all')).toHaveLength(1);
    });
  });

  it('(Compact Glass) opening one links to the right place and Escape marks it read once', async () => {
    document.documentElement.classList.add('ui-glass');
    await mount(role);
    await click(host.querySelector('.gp-n-main'));
    const base = role === 'event-coordinator' ? '/user/event-coordinator' : '/user/client';
    expect(host.querySelector('[role=dialog] a')?.getAttribute('href')).toBe(`${base}/events/ev1?highlight=ev1`);
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    await flush();
    expect(calls('PATCH', '/notifications/n1/read')).toHaveLength(1);
  });
});
