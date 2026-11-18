import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
const perms = vi.hoisted(() => ({ edit: true }));
const complete = {
  id: 'me', firstName: 'Joseph', lastName: 'Maranatha', email: 'j@x.test', phone: '+250788123456', address: 'Kigali', profilePicture: 'https://img.test/me.jpg',
  profileReviewStatus: 'ACCEPTED', kycStatus: 'APPROVED', customerType: 'Photographer', rating: 5, reviews: [], completedEvents: 3,
  specialties: [{ id: 's1', name: 'Wedding' }, { id: 's2', name: 'Portrait' }], spokenLanguages: ['EN'],
  projects: [{ id: 'p1', title: 'Wedding at Serena', description: 'Two days', year: '2025', image: '' }],
  workExperiences: [{ id: 'e1', position: 'Lead photographer', company: 'Studio', location: 'Kigali', startDate: '2020', endDate: 'Present', description: 'Covered more than one hundred weddings and corporate events across the region.' }],
};
const auth = vi.hoisted(() => ({ user: null as unknown, token: 't', refreshUserProfile: () => {} }));
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/app/lib/usePermissions', () => ({ usePermissions: () => ({ hasPermission: () => perms.edit }) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', normalizeImageUrl: (u?: string) => u, autoCapitalize: (s: string) => s, capitalizeWords: (s: string) => s }));
vi.mock('@/lib/platformConfig', () => ({ getPlatformConfig: async () => ({}) }));
vi.mock('localforage', () => ({ default: { createInstance: () => ({ getItem: async () => null, setItem: async () => {} }) } }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
const theme = vi.hoisted(() => ({ actualTheme: 'light', colors: new Proxy({}, { get: () => '#111' }) }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => theme }));
vi.mock('@/app/context/ThemeContext', () => ({ useTheme: () => theme }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => '/user/photographer/profile' }));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock('next/image', () => ({ default: () => null }));
const Stub = vi.hoisted(() => (name: string) => ({ default: () => React.createElement('div', { 'data-stub': name }) }));
vi.mock('../../components/sidebar', () => Stub('sidebar'));
vi.mock('../../components/topbar', () => Stub('topbar'));
vi.mock('@/app/components/ServiceAreaPanel', () => Stub('service-area'));
vi.mock('../../components/ServiceAreaPanel', () => Stub('service-area'));
vi.mock('@/app/components/packages/PhotographerPackagesManager', () => Stub('packages'));
vi.mock('../../components/packages/PhotographerPackagesManager', () => Stub('packages'));
vi.mock('@/app/components/GeoPricingManager', () => Stub('geo'));
vi.mock('@/app/components/ApprovalPendingModal', () => Stub('approval'));
vi.mock('../../components/ApprovalPendingModal', () => Stub('approval'));
vi.mock('@/app/components/KycVerificationModal', () => Stub('kyc'));
vi.mock('../../components/KycVerificationModal', () => Stub('kyc'));
vi.mock('../../components/KycBadge', () => Stub('kycbadge'));
vi.mock('../../components/EventConfirmModal', () => Stub('confirm'));
vi.mock('../../components/MoneyInput', () => Stub('money'));
vi.mock('@/app/components/phone/InternationalPhoneInput', () => Stub('phone'));
vi.mock('../../components/phone/InternationalPhoneInput', () => Stub('phone'));
vi.mock('@/app/components/hybrid/MatchingProfile', () => ({ MatchingProfileCard: () => <div data-stub="matching" /> }));
vi.mock('../../components/hybrid/MatchingProfile', () => ({ MatchingProfileCard: () => <div data-stub="matching" /> }));
vi.mock('../../components/PlatformAlert', () => ({ platformAlert: vi.fn() }));
vi.mock('@/app/components/PlatformAlert', () => ({ platformAlert: vi.fn() }));

import ProfilePage from './profile';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body, text: async () => '', clone() { return this; } }) as unknown as Response;

let host: HTMLDivElement;
let root: Root;
const flush = async () => { for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const text = () => document.body.textContent || '';
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await flush(); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const type = async (el: HTMLInputElement, v: string) => { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }); await flush(); };
const mount = async () => { await act(async () => { root.render(<ProfilePage />); }); await flush(); };

beforeEach(() => {
  perms.edit = true; auth.user = { ...complete };
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url: string) => {
    if (String(url).endsWith('/photographer-categories')) return res({ action: 1, data: [{ id: 's1', name: 'Wedding' }, { id: 's2', name: 'Portrait' }, { id: 's3', name: 'Events' }] });
    if (String(url).endsWith('/public/currencies')) return res({ action: 1, data: [] });
    return res({ action: 1, data: [] });
  });
  vi.stubGlobal('fetch', (u: string, i?: RequestInit) => mockFetch(u, i));
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.classList.remove('ui-glass'); vi.unstubAllGlobals(); });

describe('Edit profile (classic)', () => {
  it('still renders the classic page with its Save control', async () => {
    await mount();
    expect(text()).toContain('Edit profile');
    expect(button(/Save changes/)).toBeTruthy();
    expect(document.querySelector('.gpf-page')).toBeNull();
  });
});

describe('Edit profile (Compact Glass)', () => {
  beforeEach(() => { document.documentElement.classList.add('ui-glass'); });

  it('header chip, completion copy with a capital E, four underline tabs, no overlay at 100%', async () => {
    await mount();
    expect(text()).toContain('Account active');
    expect(text()).toContain('Nice work. Every section clients look at is filled in.');
    expect(Array.from(document.querySelectorAll('[role=tab]')).map((x) => x.querySelector('.gpf-tab-long')?.textContent)).toEqual(['Overview', 'Portfolio', 'Working experience', 'Delivery packages']);
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(document.querySelector('[role=switch]')?.getAttribute('aria-checked')).toBe('false');
  });

  it('Save is muted until something changes; the unsaved bar can Discard (asks first) or Save', async () => {
    await mount();
    const save = () => document.querySelector('.gpf-desktop-only .gpf-save') as HTMLButtonElement;
    expect(save().disabled).toBe(true);
    await click(document.querySelector('[role=switch]'));
    expect(save().disabled).toBe(true);
    const name = document.querySelector('#gpf-name') as HTMLInputElement;
    await type(name, 'Joseph Studio');
    expect(save().disabled).toBe(false);
    expect(text()).toContain('You have unsaved changes');
    await click(button(/^Discard$/));
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('Discard your changes?');
    await click(Array.from(document.querySelectorAll('.gp-modal-foot button')).pop());
    expect((document.querySelector('#gpf-name') as HTMLInputElement).value).toBe('Joseph Maranatha');
    expect(text()).not.toContain('You have unsaved changes');
  });

  it('Save changes sends the details', async () => {
    await mount();
    await click(document.querySelector('[role=switch]'));
    await type(document.querySelector('#gpf-name') as HTMLInputElement, 'Joseph Studio');
    await click(document.querySelector('.gpf-desktop-only .gpf-save'));
    expect(mockFetch.mock.calls.some((c) => String(c[0]).endsWith('/photographer/update-important-details'))).toBe(true);
  });

  it('specialties are chips with a selected state; Delivery packages shows the packages manager', async () => {
    await mount();
    const chips = Array.from(document.querySelectorAll('.gpf-chip')).filter((c) => /Wedding|Portrait|Events/.test(c.textContent || ''));
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'false']);
    await click(document.querySelectorAll('[role=tab]')[3]);
    expect(document.querySelector('[data-stub=packages]')).toBeTruthy();
  });

  it('an incomplete profile opens the missing-fields dialog; Jump there closes it and opens the section', async () => {
    auth.user = { ...complete, projects: [], profileReviewStatus: 'PENDING' };
    await mount();
    expect(document.querySelector('[role=dialog]')?.textContent).toContain('Finish your profile');
    await click(button(/^Jump there$/));
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(document.querySelector('[role=tab][aria-selected=true]')?.textContent).toContain('Portfolio');
    // an account not yet approved can always submit while editing
    await click(document.querySelector('[role=switch]'));
    expect((document.querySelector('.gpf-desktop-only .gpf-save') as HTMLButtonElement).textContent).toContain('Submit profile');
    expect((document.querySelector('.gpf-desktop-only .gpf-save') as HTMLButtonElement).disabled).toBe(false);
  });

  it('team members without profile.edit see a view-only notice and a disabled form', async () => {
    perms.edit = false;
    await mount();
    expect(text()).toContain('View only');
    expect((document.querySelector('fieldset.gpf-fieldset') as HTMLFieldSetElement).disabled).toBe(true);
  });
});
