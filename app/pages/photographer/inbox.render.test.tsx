import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
const auth = vi.hoisted(() => ({ user: { id: 'me', firstName: 'Joseph', lastName: 'M', profileReviewStatus: 'ACCEPTED' }, token: 't' }));
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a), useDashboardAuth: () => auth }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', normalizeImageUrl: (u?: string) => u }));
vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => ({ actualTheme: 'light', colors: new Proxy({}, { get: () => '#111' }) }) }));
vi.mock('@/app/context/ThemeContext', () => ({ useTheme: () => ({ actualTheme: 'light', colors: new Proxy({}, { get: () => '#111' }) }) }));
vi.mock('../../components/sidebar', () => ({ default: () => null }));
vi.mock('../../components/topbar', () => ({ default: () => null }));
vi.mock('next/navigation', () => ({ useSearchParams: () => params.value, useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => '/user/photographer/inbox' }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('../../providers/WorkspaceProvider', () => ({ useWorkspace: () => ({ isShared: false, isCollaborator: false }) }));
vi.mock('@/app/providers/WorkspaceProvider', () => ({ useWorkspace: () => ({ isShared: false, isCollaborator: false }) }));
vi.mock('../../components/chat/ChatAlbumShare', () => ({ SpecialMessage: () => null, ShareAlbumButton: () => <button type="button">Share album</button>, AlbumShareCard: () => null }));
vi.mock('@/app/components/chat/ChatAlbumShare', () => ({ SpecialMessage: () => null, ShareAlbumButton: () => <button type="button">Share album</button>, AlbumShareCard: () => null }));

import PhotographerInbox from './inbox';
import ClientInbox from '../client/inbox';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
Element.prototype.scrollIntoView = function () {};

const iso = (daysAgo: number, h: number, m: number) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d.toISOString().replace('Z', ''); };
const convs = [
  { id: 'mj', participants: [{ id: 'me', name: '', image: '', userType: 'photographer', isOnline: true }, { id: 'mj', name: 'Micheal Jackson', image: '', userType: 'client', isOnline: false, lastSeen: iso(1, 16, 50) }], lastMessage: { content: 'Thanks, Joseph.', senderId: 'mj', createdAt: iso(1, 21, 12) }, unreadCount: 0, isPinned: false },
  { id: 'ig', participants: [{ id: 'me', name: '', image: '', userType: 'photographer', isOnline: true }, { id: 'ig', name: 'Igihe Ltd', image: '', userType: 'client', isOnline: false }], lastMessage: { content: 'Can we move the shoot to Friday?', senderId: 'ig', createdAt: iso(0, 9, 0) }, unreadCount: 2, isPinned: false },
];
const msgs = [
  { id: 'm3', senderId: 'me', content: 'Booking confirmed.', createdAt: iso(1, 21, 10), isRead: true },
  { id: 'm1', senderId: 'mj', content: 'Hello! Are you free?', createdAt: iso(2, 17, 58), isRead: true },
  { id: 'm2', senderId: 'mj', content: 'This broke the rules', type: 'removed', createdAt: iso(2, 18, 30), isRead: true },
];
const res = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body, text: async () => '' }) as Response;
let sendOk = true;

let host: HTMLDivElement;
let root: Root;
const calls = (method: string, part: string) => mockFetch.mock.calls.filter((c) => ((c[1] as RequestInit | undefined)?.method || 'GET') === method && String(c[0]).includes(part));
const flush = async () => { for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const text = () => document.body.textContent || '';
const click = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await flush(); };
const button = (re: RegExp) => Array.from(document.querySelectorAll('button')).find((b) => re.test((b.textContent || '').trim()) || re.test(b.getAttribute('aria-label') || ''));
const type = async (el: HTMLTextAreaElement | HTMLInputElement, v: string) => {
  await act(async () => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

beforeEach(() => {
  sendOk = true; params.value = new URLSearchParams();
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith('/chat/conversations')) return res({ action: 1, data: convs.map((c) => ({ ...c })) });
    if (/\/chat\/messages\/[a-z]+$/.test(u) && !init?.method) return res({ action: 1, data: msgs.map((m) => ({ ...m })) });
    if (u.endsWith('/chat/send')) return sendOk ? res({ action: 1, data: { id: 'srv1' } }) : res({ message: 'Network down' }, false);
    if (u.includes('/photographers') || u.endsWith('/photographer/clients')) return res({ action: 1, data: [{ id: 'p9', firstName: 'Aline', lastName: 'Uwase' }] });
    return res({ action: 1, data: {} });
  });
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.documentElement.classList.remove('ui-glass'); vi.unstubAllGlobals(); });

describe.each([['classic', false], ['Compact Glass', true]])('Photographer inbox (%s)', (_n, glass) => {
  beforeEach(() => { if (glass) document.documentElement.classList.add('ui-glass'); });

  it('lists conversations and opens one: loads its messages and marks it read', async () => {
    await act(async () => { root.render(<PhotographerInbox />); }); await flush();
    expect(text()).toContain('Micheal Jackson');
    expect(text()).toContain('Igihe Ltd');
    const row = Array.from(document.querySelectorAll('button, div')).find((b) => /^Igihe Ltd/.test((b.textContent || '').trim()) && (b as HTMLElement).onclick !== undefined);
    await click(glass ? document.querySelectorAll('.gi-conv')[1] : row);
    expect(calls('GET', '/chat/messages/ig').length).toBeGreaterThan(0);
    expect(calls('PATCH', '/chat/messages/ig/read')).toHaveLength(1);
  });
});

describe('Inbox (Compact Glass)', () => {
  beforeEach(() => { document.documentElement.classList.add('ui-glass'); });
  const open = async (el: React.ReactElement, idx = 0) => {
    await act(async () => { root.render(el); }); await flush();
    await click(document.querySelectorAll('.gi-conv')[idx]);
  };

  it('thread: oldest first, a divider above each day, own bubbles marked, removed text, readable last seen', async () => {
    await open(<PhotographerInbox />);
    const items = Array.from(document.querySelectorAll('.gi-messages > .gi-day')).map((d) => ({
      divider: d.querySelector('.gi-divider')?.textContent, first: d.querySelector('.gi-line')?.textContent,
    }));
    expect(items).toHaveLength(2);
    expect(items[0].first).toContain('Hello! Are you free?');
    expect(items[1].divider).toBe('Yesterday');
    expect(document.querySelector('.gi-day')!.firstElementChild!.className).toContain('gi-divider');
    const own = Array.from(document.querySelectorAll('.gi-line.is-own')).map((l) => l.textContent);
    expect(own.join(' ')).toContain('Booking confirmed.');
    expect(document.querySelector('.gi-removed em')?.textContent).toBe('Message removed');
    expect(text()).toMatch(/Last seen yesterday at \d{1,2}:\d{2}\s?(AM|PM)/);
    expect(text()).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(document.querySelector('[aria-label="Read"]')).toBeTruthy();
  });

  it('send failure keeps the bubble with Retry, which sends it again', async () => {
    await open(<PhotographerInbox />);
    sendOk = false;
    await type(document.querySelector('#gi-input') as HTMLTextAreaElement, 'See you at 10');
    await click(button(/^Send$/));
    expect(document.querySelector('.gi-bubble.is-failed')?.textContent).toContain('See you at 10');
    expect((document.querySelector('#gi-input') as HTMLTextAreaElement).value).toBe('');
    sendOk = true;
    await click(button(/Not sent\. Retry/));
    expect(calls('POST', '/chat/send')).toHaveLength(2);
    expect(document.querySelector('.gi-bubble.is-failed')).toBeNull();
  });

  it('delete asks first', async () => {
    await open(<PhotographerInbox />);
    await click(button(/^Delete message$/));
    await click(button(/^Cancel$/));
    expect(calls('DELETE', '/chat/messages/m3')).toHaveLength(0);
    await click(button(/^Delete message$/));
    await click(Array.from(document.querySelectorAll('.gp-modal-foot button')).pop());
    expect(calls('DELETE', '/chat/messages/m3')).toHaveLength(1);
  });

  it('Unread shows its count and Pinned filters to pinned conversations', async () => {
    await act(async () => { root.render(<PhotographerInbox />); }); await flush();
    expect(button(/^Unread/)?.querySelector('.gp-seg-count')?.textContent).toBe('1');
    expect(document.querySelector('.gi-count')?.textContent).toBe('2');
    await click(button(/^Pinned/));
    expect(text()).toContain('No pinned conversations');
  });

  it('empty and error states', async () => {
    mockFetch.mockImplementation(async (u: string) => (String(u).endsWith('/chat/conversations') ? res({ action: 1, data: [] }) : res({ action: 1 })));
    await act(async () => { root.render(<PhotographerInbox />); }); await flush();
    expect(text()).toContain('No messages yet');
    act(() => root.unmount()); root = createRoot(host);
    mockFetch.mockImplementation(async () => res({}, false));
    await act(async () => { root.render(<PhotographerInbox />); }); await flush();
    expect(text()).toContain('We could not load your messages.');
  });

  it.each([['client', '/customer/photographers'], ['event-coordinator', '/coordinator/photographers']] as const)('%s: New message lists contacts from %s', async (role, endpoint) => {
    await act(async () => { root.render(<ClientInbox userRole={role} />); }); await flush();
    await click(button(/^New$/));
    expect(calls('GET', endpoint)).toHaveLength(1);
    expect(text()).toContain('Aline Uwase');
  });
});
