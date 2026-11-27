import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', getLandingUrl: () => 'https://connekyt.com', normalizeImageUrl: (u: string) => u }));
const mockFetch = vi.fn();
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a) }));

import ExploreAccountPage from './ExploreAccountPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ action: 1, data }) });
const item = (id: string, over: Record<string, unknown> = {}) => ({
  id, mediaType: 'PHOTO', title: `Item ${id}`, creator: { name: 'Aline Uwase' }, thumbnailUrl: `https://e.test/${id}.jpg`, aspectRatio: 1.3,
  price: { amount: 5, currency: 'USD' }, ...over,
});

let host: HTMLDivElement;
let root: Root;
const render = async (view: 'saved' | 'purchases') => { await act(async () => { root.render(<ExploreAccountPage view={view} />); }); await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const text = () => host.textContent || '';

beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); mockFetch.mockReset(); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe('Explore Saved and My purchases', () => {
  it('Saved lists the hearted items as watermarked previews with their creator', async () => {
    mockFetch.mockResolvedValue(ok({ items: [item('a'), item('b', { mediaType: 'VIDEO', durationSeconds: 100 })], ids: ['a', 'b'] }));
    await render('saved');
    expect(text()).toContain('Item a');
    expect(text()).toContain('Aline Uwase');
    expect(text()).toContain('1:40');
    expect(host.querySelectorAll('.xpl-card').length).toBe(2);
    expect(Array.from(host.querySelectorAll('img')).every((i) => /e\.test/.test(i.getAttribute('src') || ''))).toBe(true);
  });

  it('Saved says what to do when nothing is saved and offers Explore', async () => {
    mockFetch.mockResolvedValue(ok({ items: [], ids: [] }));
    await render('saved');
    expect(text()).toContain('Nothing saved yet');
    expect(Array.from(host.querySelectorAll('a')).some((a) => /connekyt\.com\/explore/.test(a.getAttribute('href') || ''))).toBe(true);
  });

  it('Saved shows an error with a retry when the server fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ action: 0, message: 'boom' }) });
    await render('saved');
    expect(host.querySelector('[role=alert]')).toBeTruthy();
    expect(text()).toContain('Retry');
  });

  it('removing a saved item calls the API and drops it from the grid', async () => {
    mockFetch.mockImplementation(async (url: string, init?: { method?: string }) => (init?.method === 'DELETE' ? ok({ saved: false }) : ok({ items: [item('a'), item('b')], ids: ['a', 'b'] })));
    await render('saved');
    const heart = host.querySelector('.xpl-heart') as HTMLElement;
    await act(async () => { heart.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(mockFetch.mock.calls.some((c) => c[1]?.method === 'DELETE' && /saves\/a$/.test(String(c[0])))).toBe(true);
    expect(host.querySelectorAll('.xpl-card').length).toBe(1);
  });

  it('My purchases lists purchases and opens one by its code into signed links', async () => {
    mockFetch.mockResolvedValue(ok({ purchases: [{ refid: 'R1', paidAt: '2026-11-26T20:00:00', amount: 15, currency: 'USD', title: 'Sky Edition', unlockCode: 'ABCD1234' }] }));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ action: 1, data: { refid: 'R1', zipUrl: 'https://api.test/api/public/content/download/tok', items: [{ id: 'p1', mediaType: 'PHOTO', title: 'Dusk', thumbnailUrl: 'https://e.test/t.jpg', viewUrl: 'https://api.test/own/v/photo/p1', downloadUrl: null }, { id: 'c1', mediaType: 'VIDEO', title: 'Clip', thumbnailUrl: null, viewUrl: null, downloadUrl: 'https://api.test/dl/tok/clip/c1' }] } }) })));
    await render('purchases');
    expect(text()).toContain('Sky Edition');
    const openBtn = Array.from(host.querySelectorAll('button')).find((b) => /^Open$/.test((b.textContent || '').trim())) as HTMLElement;
    await act(async () => { openBtn.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    const hrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') || '');
    expect(hrefs).toContain('https://api.test/api/public/content/download/tok');
    expect(hrefs).toContain('https://api.test/own/v/photo/p1');
    expect(hrefs).toContain('https://api.test/dl/tok/clip/c1');
  });

  it('My purchases says a guest purchase appears under the same email when there are none', async () => {
    mockFetch.mockResolvedValue(ok({ purchases: [] }));
    await render('purchases');
    expect(text()).toContain('No purchases yet');
    expect(text()).toMatch(/same email/);
  });
});
