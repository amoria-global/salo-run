import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
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
  { id: 'u1', title: 'Friday set', eventStatus: 'PUBLISHED', eventDate: '2026-11-10' },
  { id: 'e1', title: 'Old set', eventStatus: 'COMPLETED' },
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

  it('tells a non-photographer that hosting is for photographers', async () => {
    serve(elig({ canHostFree: false, reason: 'NOT_A_PHOTOGRAPHER' }));
    await mount();
    expect(host.textContent).toContain('photographer accounts');
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
