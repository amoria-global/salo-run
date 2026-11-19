import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
const auth = vi.hoisted(() => ({ user: { id: 'me', email: 'me@x.test', phone: '+250788123456', twoFactorEnabled: false }, updateUser: () => {} }));
const themeCtl = vi.hoisted(() => ({ theme: 'light', setTheme: (() => {}) as (m: string) => void, actualTheme: 'light', colors: new Proxy({}, { get: () => '#111' }) }));
const lang = vi.hoisted(() => ({ language: 'en', setLanguage: (() => {}) as (c: string) => void, languages: [{ code: 'en', label: 'English', nativeLabel: 'English', flag: 'gb' }, { code: 'fr', label: 'French', nativeLabel: 'Français', flag: 'fr' }], t: (s: string) => s }));
const Stub = vi.hoisted(() => (name: string) => ({ default: () => React.createElement('div', { 'data-stub': name }) }));
vi.mock('../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('@/lib/xentripay', () => ({ validateAccountDetails: vi.fn(async () => ({ valid: true, registeredName: 'JOSEPH M' })) }));
vi.mock('../context/ThemeContext', () => ({ useTheme: () => themeCtl }));
vi.mock('@/app/context/ThemeContext', () => ({ useTheme: () => themeCtl }));
vi.mock('../context/LanguageContext', () => ({ useLanguage: () => lang }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => lang }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('../components/sidebar', () => Stub('sidebar'));
vi.mock('../components/topbar', () => Stub('topbar'));
vi.mock('../components/TwoFactorMethods', () => Stub('2fa'));
vi.mock('@/app/components/TwoFactorMethods', () => Stub('2fa'));
vi.mock('@/app/components/referral/AddReferralCode', () => Stub('referral'));
vi.mock('../components/phone/InternationalPhoneInput', () => Stub('phone'));
vi.mock('@/app/components/phone/InternationalPhoneInput', () => Stub('phone'));
vi.mock('../components/EventConfirmModal', () => Stub('confirm'));

import PreferencesPage from './preferences';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;
const methods = [{ id: 'w1', methodType: 'MOBILE_MONEY', bankName: 'MTN Mobile Money', accountNumber: '250788123456', accountName: 'JOSEPH M', isDefault: true },
  { id: 'w2', methodType: 'BANK_TRANSFER', bankName: 'Bank of Kigali', accountNumber: '000123', accountName: 'JOSEPH M', isDefault: false }];

let host: HTMLDivElement;
let root: Root;
const flush = async () => { for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const text = () => document.body.textContent || '';
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await flush(); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const calls = (method: string, part: string) => mockFetch.mock.calls.filter((c) => ((c[1] as RequestInit | undefined)?.method || 'GET') === method && String(c[0]).includes(part));
const mount = async (role: 'photographer' | 'client' | 'event-coordinator' = 'photographer') => { await act(async () => { root.render(<PreferencesPage userType={role} />); }); await flush(); };

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith('/preferences') && !init?.method) return res({ action: 1, data: { push_notifications: 'false' } });
    if (u.endsWith('/withdrawal-methods') && !init?.method) return res({ action: 1, data: methods });
    return res({ action: 1, data: {} });
  });
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.classList.remove('ui-glass'); });

describe('Preferences (classic)', () => {
  it('renders the classic page and loads preferences from the role endpoint', async () => {
    await mount('client');
    expect(calls('GET', '/customer/preferences')).toHaveLength(1);
    expect(document.querySelector('.gpr-page')).toBeNull();
  });
});

describe('Preferences (Compact Glass)', () => {
  beforeEach(() => { document.documentElement.classList.add('ui-glass'); });

  it('theme and language cards save their preference', async () => {
    await mount();
    await click(Array.from(document.querySelectorAll('.gpr-option')).find((b) => /Dark/.test(b.textContent || '')));
    expect(calls('PUT', '/photographer/preferences/theme')).toHaveLength(1);
    await click(Array.from(document.querySelectorAll('.gpr-lang')).find((b) => /Français/.test(b.textContent || '')));
    expect(calls('PUT', '/photographer/preferences/language')).toHaveLength(1);
  });

  it('notification switches reflect saved values and save on toggle; role rows differ', async () => {
    await mount('event-coordinator');
    await click(button(/^Notifications$/));
    const push = document.querySelector('[role=switch][aria-label="Push notifications"]');
    expect(push?.getAttribute('aria-checked')).toBe('false');
    await click(push);
    expect(push?.getAttribute('aria-checked')).toBe('true');
    expect(calls('PUT', '/coordinator/preferences/push_notifications')).toHaveLength(1);
    expect(text()).toContain('Stream fee notifications');
    expect(text()).not.toContain('Tips and bonuses');
  });

  it('payment accounts: default chip, set default, delete asks first', async () => {
    await mount();
    await click(button(/^Payment accounts$/));
    expect(text()).toContain('MTN Mobile Money');
    expect(text()).toContain('Default');
    await click(button(/^Set default$/));
    expect(calls('PUT', '/photographer/withdrawal-methods/w2').length).toBe(1);
    await click(button(/^Delete Bank of Kigali$/));
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('Delete this payment account?');
    await click(Array.from(document.querySelectorAll('.gp-modal-foot button')).pop());
    expect(calls('DELETE', '/photographer/withdrawal-methods/w2')).toHaveLength(1);
  });

  it('referral tab only for photographers', async () => {
    await mount('client');
    expect(button(/^Referral$/)).toBeUndefined();
  });
});
