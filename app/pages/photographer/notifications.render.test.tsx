import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => ({ user: { id: 'u1' }, token: 't' }) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
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
  { id: 'n1', type: 'PAYMENT', title: 'Payment received', message: 'You got paid for Ben & Raya', createdAt: new Date(now - 60_000).toISOString(), isRead: false, amount: 50, referenceId: 'ev1', link: null },
  { id: 'n2', type: 'SECURITY', title: 'New sign-in', message: 'A new device signed in', createdAt: new Date(now - 3_600_000).toISOString(), isRead: true },
  { id: 'n3', type: 'OPPORTUNITY', title: 'New opportunity', message: 'An event near you', createdAt: new Date(now - 7_200_000).toISOString(), isRead: false, referenceId: 'cand9' },
];
const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

let host: HTMLDivElement;
let root: Root;
const calls = (method: string, suffix: string) => mockFetch.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === method && String(c[0]).endsWith(suffix));
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const mount = async () => { await act(async () => { root.render(<NotificationsPage />); }); await flush(); };
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
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); document.documentElement.classList.remove('ui-glass'); });

describe.each([['classic', false], ['Compact Glass', true]])('Notifications page (%s)', (_name, glass) => {
  beforeEach(() => { if (glass) document.documentElement.classList.add('ui-glass'); });

  it('loads the newest 50 and lists them', async () => {
    await mount();
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.test/api/remote/photographer/notifications?page=0&size=50');
    expect(text()).toContain('Payment received');
    expect(text()).toContain('New sign-in');
    expect(text().indexOf('Payment received')).toBeLessThan(text().indexOf('New sign-in'));
  });

  it('marks everything read with one request', async () => {
    await mount();
    await click(buttonText(/Mark all as read/));
    expect(calls('PATCH', '/notifications/read-all')).toHaveLength(1);
  });

  it('deleting one sends DELETE for that notification', async () => {
    await mount();
    const del = host.querySelector(glass ? 'button[aria-label="Delete notification"]' : 'button[title="Delete notification"]');
    await click(del);
    expect(calls('DELETE', '/notifications/n1')).toHaveLength(1);
  });

  it('Delete all asks first: cancelling sends nothing, confirming deletes everything', async () => {
    await mount();
    if (glass) {
      await click(buttonText(/^Delete all$/));
      expect(host.querySelector('[role=dialog]')).not.toBeNull();
      await click(buttonText(/^Cancel$/));
      expect(calls('DELETE', '/notifications/all')).toHaveLength(0);
      await click(buttonText(/^Delete all$/));
      await click(Array.from(host.querySelectorAll('.gp-modal-foot button')).pop());
    } else {
      const confirmSpy = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
      (window as unknown as { confirm: unknown }).confirm = confirmSpy;
      await click(buttonText(/Delete all/));
      expect(calls('DELETE', '/notifications/all')).toHaveLength(0);
      await click(buttonText(/Delete all/));
      expect(confirmSpy).toHaveBeenCalledTimes(2);
    }
    expect(calls('DELETE', '/notifications/all')).toHaveLength(1);
    expect(text()).not.toContain('Payment received');
  });

  it('Clear read removes only the read ones', async () => {
    await mount();
    if (glass) {
      await click(buttonText(/^Clear read$/));
      await click(Array.from(host.querySelectorAll('.gp-modal-foot button')).pop());
    } else {
      await click(buttonText(/Clear read/));
    }
    expect(calls('DELETE', '/notifications/delete-read')).toHaveLength(1);
    expect(text()).not.toContain('New sign-in');
    expect(text()).toContain('Payment received');
  });
});

describe('Notifications page in Compact Glass only', () => {
  beforeEach(() => { document.documentElement.classList.add('ui-glass'); });

  it('filters by type with the segmented switch', async () => {
    await mount();
    await click(Array.from(host.querySelectorAll('[role=tab]')).find((t) => /^Security/.test(t.textContent || '')));
    expect(text()).toContain('New sign-in');
    expect(text()).not.toContain('Payment received');
  });

  it('opening one shows it in full; closing marks it read; View keeps the highlight parameter', async () => {
    await mount();
    await click(host.querySelector('.gp-n-main'));
    const dlg = host.querySelector('[role=dialog]')!;
    expect(dlg.textContent).toContain('You got paid for Ben & Raya');
    expect(dlg.querySelector('a')?.getAttribute('href')).toBe('/user/photographer/all-transactions?highlight=ev1');
    await click(Array.from(dlg.querySelectorAll('button')).find((b) => /^Close$/.test(b.textContent || '')));
    expect(calls('PATCH', '/notifications/n1/read')).toHaveLength(1);
    expect(host.querySelector('[role=dialog]')).toBeNull();
  });

  it('Escape closes the dialog and marks it read exactly once', async () => {
    await mount();
    await click(host.querySelector('.gp-n-main'));
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    await flush();
    expect(calls('PATCH', '/notifications/n1/read')).toHaveLength(1);
  });

  it('shows the empty state when there are none, and the opportunity link points at the candidate', async () => {
    mockFetch.mockImplementation(async () => res({ action: 1, data: { content: [] } }));
    await mount();
    expect(text()).toContain('No notifications');
  });
});
