import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    actualTheme: 'light',
    colors: { bgCard: '#fff', bgPrimary: '#fff', bgTertiary: '#eee', textPrimary: '#000', textSecondary: '#444', textTertiary: '#888', borderPrimary: '#ccc', brandAccent: '#F20C8F', shadowLg: 'none' },
  }),
}));
vi.mock('../../components/StreamPreview', () => ({ default: ({ eventTitle }: { eventTitle: string }) => <div data-testid="stream">{eventTitle}</div> }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

import HostedEventsPage from './hosted-events';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const res = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
const elig = (o: Record<string, unknown> = {}) => res({ action: 1, data: { enabled: true, canHostFree: true, canHostPaid: false, reason: null, ...o } });
const events = [
  { id: 'u1', title: 'Friday set', eventStatus: 'PUBLISHED', eventDate: '2099-11-10', isPublished: true },
  { id: 'e1', title: 'Old set', eventStatus: 'COMPLETED', isPublished: true },
];

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  mockFetch.mockReset();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function mount() {
  await act(async () => { root.render(<HostedEventsPage />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
function serve(eligibility: Response, list: Response | Error = res({ action: 1, data: events })) {
  mockFetch.mockImplementation(async (url: string) => {
    if (url.includes('eligibility')) return eligibility;
    if (list instanceof Error) throw list;
    return list;
  });
}
const buttonByText = (t: string) => [...host.querySelectorAll('button')].find((b) => b.textContent?.includes(t));

describe('HostedEventsPage', () => {
  it('says hosting is not available, and offers no form, when the server has it off', async () => {
    serve(elig({ enabled: false, canHostFree: false, reason: 'HOSTING_DISABLED' }));
    await mount();
    expect(host.textContent).toContain('Hosting is not available');
    expect(buttonByText('Host an event')).toBeUndefined();
  });

  it('tells an account that cannot host (a viewer) that hosting is not available for it', async () => {
    serve(elig({ canHostFree: false, reason: 'ROLE_CANNOT_HOST' }));
    await mount();
    expect(host.textContent).toContain('not available for this account type');
  });

  it('sends a client or coordinator to their own profile to verify, not the photographer one', async () => {
    serve(elig({ canHostPaid: false, reason: 'KYC_REQUIRED_FOR_PAID' }));
    await act(async () => { root.render(<HostedEventsPage profilePath="/user/client/profile" />); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    await act(async () => { buttonByText('Host an event')!.click(); });
    const link = [...host.querySelectorAll('a')].find((a) => a.textContent?.includes('Verify my identity'));
    expect(link?.getAttribute('href')).toBe('/user/client/profile');
  });

  it('shows an error with a retry when eligibility cannot be read', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'));
    await mount();
    expect(host.textContent).toContain('Network down');
    expect(buttonByText('Try again')).toBeDefined();
  });

  it('lists upcoming events and opens the stream controls for one', async () => {
    serve(elig());
    await mount();
    expect(host.textContent).toContain('Friday set');
    expect(host.textContent).not.toContain('Old set');
    await act(async () => { (host.querySelector('button[aria-label="Go live with Friday set"]') as HTMLButtonElement).click(); });
    expect(host.querySelector('[data-testid="stream"]')?.textContent).toBe('Friday set');
  });

  it('shows an empty state with a next step, and an error with a retry when the list fails', async () => {
    serve(elig(), res({ action: 1, data: [] }));
    await mount();
    expect(host.textContent).toContain('No upcoming events');
    act(() => root.unmount());
    root = createRoot(host);
    serve(elig(), new Error('List down'));
    await mount();
    expect(host.textContent).toContain('List down');
  });

  it('blocks both publish buttons until Wish invites is chosen, shows a linked error, then sends the choice', async () => {
    serve(elig());
    await mount();
    await act(async () => { buttonByText('Host an event')!.click(); });
    expect(host.textContent).toContain('Wish invites');
    expect(host.textContent).toContain('Allow viewers to invite friends and family to send message and video wishes?');
    const radios = () => [...host.querySelectorAll('fieldset input[type="radio"]')] as HTMLInputElement[];
    expect(radios()).toHaveLength(2);
    expect(radios().some((r) => r.checked)).toBe(false);
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' });
    const input = host.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => { Object.defineProperty(input, 'files', { value: [file], configurable: true }); input.dispatchEvent(new Event('change', { bubbles: true })); });
    const title = host.querySelector('input[placeholder^="e.g. Friday"]') as HTMLInputElement;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(title, 'Rooftop set'); title.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { buttonByText('Publish and go live')!.click(); });
    await act(async () => { buttonByText('Publish and schedule for later')!.click(); });
    const alert = host.querySelector('fieldset [role="alert"]')!;
    expect(alert.textContent).toContain('Choose whether viewers can invite others');
    expect(host.querySelector('fieldset')!.getAttribute('aria-describedby')).toBe(alert.id);
    expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(false);

    await act(async () => { radios()[1].click(); });
    expect(host.querySelector('fieldset [role="alert"]')).toBeNull();
    expect(radios()[1].checked).toBe(true);
  });

  it('locks Paid behind verification and refuses to submit without a cover', async () => {
    serve(elig());
    await mount();
    await act(async () => { buttonByText('Host an event')!.click(); });
    expect(host.textContent).toContain('identity verification');
    expect((host.querySelector('button[role="radio"]:last-child') as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { buttonByText('Publish and go live')!.click(); });
    expect(host.textContent).toContain('Add a cover photo.');
    expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(false);
  });
});

/**
 * Parity under Compact Glass: the same server calls, the same rules (what is listed, when Go live is offered, what
 * Unpublish asks and sends, wish invites), only the presentation differs. The classic tests above run with the class off.
 */
describe('HostedEventsPage in Compact Glass', () => {
  beforeEach(() => { document.documentElement.classList.add('ui-glass'); });
  afterEach(() => { document.documentElement.classList.remove('ui-glass'); });
  const postsTo = (suffix: string) => mockFetch.mock.calls.filter((c) => String(c[0]).endsWith(suffix) && (c[1] as RequestInit | undefined)?.method === 'POST');

  it('uses the glass layout and keeps the same states: not available, error with retry, empty', async () => {
    serve(elig({ enabled: false, canHostFree: false, reason: 'HOSTING_DISABLED' }));
    await mount();
    expect(host.querySelector('.gp-page')).not.toBeNull();
    expect(host.textContent).toContain('Hosting is not available');
    expect(buttonByText('Host an event')).toBeUndefined();

    act(() => root.unmount()); root = createRoot(host);
    mockFetch.mockReset(); mockFetch.mockRejectedValue(new Error('Network down'));
    await mount();
    expect(host.querySelector('[role=alert]')?.textContent).toContain('Network down');
    expect(buttonByText('Retry')).toBeDefined();

    act(() => root.unmount()); root = createRoot(host);
    serve(elig(), res({ action: 1, data: [] }));
    await mount();
    expect(host.textContent).toContain('No upcoming events');
    expect(buttonByText('Host an event')).toBeDefined();
  });

  it('lists only the selected bucket, switches with the tabs, and opens the stream controls', async () => {
    serve(elig());
    await mount();
    expect(host.textContent).toContain('Friday set');
    expect(host.textContent).not.toContain('Old set');
    await act(async () => { (host.querySelectorAll('[role=tab]')[2] as HTMLElement).click(); });
    expect(host.textContent).toContain('Old set');
    expect(host.querySelector('button[aria-label^="Go live with Old set"]')).toBeNull();
    await act(async () => { (host.querySelectorAll('[role=tab]')[0] as HTMLElement).click(); });
    await act(async () => { (host.querySelector('button[aria-label="Go live with Friday set"]') as HTMLButtonElement).click(); });
    expect(host.querySelector('[data-testid="stream"]')?.textContent).toBe('Friday set');
  });

  it('Unpublish asks first, explains what happens, and only then sends the request', async () => {
    serve(elig());
    await mount();
    await act(async () => { (host.querySelector('button[aria-label="More options for Friday set"]') as HTMLButtonElement).click(); });
    await act(async () => { [...host.querySelectorAll('[role=menuitem]')].find((m) => m.textContent === 'Unpublish')!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(host.querySelector('[role=dialog]')?.textContent).toContain('It will be hidden from Explore');
    expect(postsTo('/unpublish')).toHaveLength(0);
    await act(async () => { buttonByText('Cancel')!.click(); });
    expect(host.querySelector('[role=dialog]')).toBeNull();
    expect(postsTo('/unpublish')).toHaveLength(0);

    await act(async () => { (host.querySelector('button[aria-label="More options for Friday set"]') as HTMLButtonElement).click(); });
    await act(async () => { [...host.querySelectorAll('[role=menuitem]')].find((m) => m.textContent === 'Unpublish')!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { [...host.querySelectorAll('.gp-modal-foot button')].pop()!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(postsTo('/unpublish')).toHaveLength(1);
  });

  it('the wish-invites switch in the menu sends the opposite of its current value', async () => {
    serve(elig());
    await mount();
    await act(async () => { (host.querySelector('button[aria-label="More options for Friday set"]') as HTMLButtonElement).click(); });
    const item = [...host.querySelectorAll('[role=menuitem]')].find((m) => /Wish invites/i.test(m.textContent || ''))!;
    expect(item.textContent).toContain('Turn off');
    await act(async () => { item.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const put = mockFetch.mock.calls.find((c) => String(c[0]).endsWith('/wish-invites') && (c[1] as RequestInit | undefined)?.method === 'PUT');
    expect(put).toBeTruthy();
    expect(String((put![1] as RequestInit).body)).toContain('false');
  });

  it('the Host an event form still opens with its rules (identity check for paid, cover required)', async () => {
    serve(elig());
    await mount();
    await act(async () => { buttonByText('Host an event')!.click(); });
    expect(host.textContent).toContain('identity verification');
    await act(async () => { buttonByText('Publish and go live')!.click(); });
    expect(host.textContent).toContain('Add a cover photo.');
    expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(false);
  });
});
