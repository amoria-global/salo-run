import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/app/context/LanguageContext', () => ({ useLanguage: () => ({ t: (s: string) => s, language: 'en' }) }));
const fetchMock = vi.fn();
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a) }));

import NewPhotobookModal from './NewPhotobookModal';

/**
 * The picker: albums with a type chip, only the photos the server lists, the one-photographer rule, Select all and
 * shift-click ranges, and the request it sends. The server is mocked: it answers like the real picker endpoints.
 */
const albums = [
  { id: 'a1', title: 'Wedding', sourceType: 'event', priced: false, photoCount: 4, usableCount: 4, ownerId: 'p1', ownerName: 'Joseph M.', eventId: 'ev1', eventTitle: 'Ben and Raya' },
  { id: 'a2', title: 'Kigali streets', sourceType: 'free', priced: false, photoCount: 2, usableCount: 2, ownerId: 'p1', ownerName: 'Joseph M.' },
  { id: 'a3', title: 'Sunset', sourceType: 'purchased', priced: true, photoCount: 12, usableCount: 2, ownerId: 'p2', ownerName: 'Aline U.' },
];
const photos: Record<string, { id: string; thumbUrl: string; sourceType: string }[]> = {
  a1: [1, 2, 3, 4].map((n) => ({ id: `e${n}`, thumbUrl: `https://x/e${n}.jpg`, sourceType: 'event' })),
  a2: [1, 2].map((n) => ({ id: `f${n}`, thumbUrl: `https://x/f${n}.jpg`, sourceType: 'free' })),
  a3: [1, 2].map((n) => ({ id: `s${n}`, thumbUrl: `https://x/s${n}.jpg`, sourceType: 'purchased' })),
};
const ok = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ action: 1, data }) });

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  fetchMock.mockReset();
  fetchMock.mockImplementation((url: string, init?: { method?: string; body?: string }) => {
    if (url.includes('/photobook/sources/') && url.includes('/photos')) return ok({ items: photos[url.split('/sources/')[1].split('/')[0]], total: 9 });
    if (url.endsWith('/photobook/sources')) return ok(albums);
    if (url.includes('/photobook/pricing')) return ok({ freePhotosLimit: 2, pricePerExtraPhoto: 1000, title: 'Ben and Raya' });
    if (init?.method === 'POST' && url.endsWith('/photobook')) return ok({ id: 'b1', name: 'Our day' });
    if (init?.method === 'POST' && url.endsWith('/send')) return ok({});
    return ok({});
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const mount = async () => {
  const fns = { onClose: vi.fn(), onCreated: vi.fn() };
  act(() => root.render(<NewPhotobookModal {...fns} />));
  await flush();
  return fns;
};
const btn = (text: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const albumBtn = (title: string) => [...document.querySelectorAll('button.pbk-album')].find((b) => b.textContent?.includes(title)) as HTMLButtonElement;
const photoBtns = () => [...document.querySelectorAll('button.pbk-photo')] as HTMLButtonElement[];

describe('New photobook picker', () => {
  it('lists every usable album with its type chip and, for paid albums, how many were bought', async () => {
    await mount();
    expect(albumBtn('Wedding').textContent).toContain('Event album');
    expect(albumBtn('Kigali streets').textContent).toContain('Free album');
    expect(albumBtn('Sunset').textContent).toContain('Purchased');
    expect(albumBtn('Sunset').textContent).toContain('0/2');
  });

  it('shows only the photos the server lists and the lock note', async () => {
    await mount();
    act(() => albumBtn('Sunset').click());
    await flush();
    expect(photoBtns().length).toBe(2);
    expect(document.body.textContent).toContain("Paid and content photos you haven't bought aren't shown");
  });

  it('numbers photos in the order they are ticked, selects all, and ranges with shift', async () => {
    await mount();
    act(() => albumBtn('Wedding').click());
    await flush();
    act(() => photoBtns()[2].click());
    act(() => photoBtns()[0].click());
    expect(photoBtns()[2].textContent).toContain('1');
    expect(photoBtns()[0].textContent).toContain('2');
    act(() => btn('Select all').click());
    expect(photoBtns().every((b) => b.getAttribute('aria-pressed') === 'true')).toBe(true);
    act(() => btn('Clear').click());
    act(() => photoBtns()[0].click());
    act(() => photoBtns()[3].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })));
    expect(photoBtns().filter((b) => b.getAttribute('aria-pressed') === 'true').length).toBe(4);
  });

  it('switches off albums of another photographer once a photo is chosen', async () => {
    await mount();
    act(() => albumBtn('Wedding').click());
    await flush();
    act(() => photoBtns()[0].click());
    expect(albumBtn('Sunset').disabled).toBe(true);
    expect(albumBtn('Sunset').textContent).toContain("A book can use one photographer's photos");
    expect(albumBtn('Kigali streets').disabled).toBe(false);
  });

  it('shows the free limit for an event book and the extras price when over it', async () => {
    await mount();
    act(() => albumBtn('Wedding').click());
    await flush();
    act(() => btn('Select all').click());
    await flush();
    expect(document.body.textContent).toContain('Free up to 2 for this event');
    expect(document.body.textContent).toContain('2 extra at 1000 each');
  });

  it('creates the book with the chosen photos in order, the event, and sends it when asked', async () => {
    const { onCreated } = await mount();
    act(() => albumBtn('Wedding').click());
    await flush();
    act(() => photoBtns()[1].click());
    act(() => photoBtns()[0].click());
    act(() => btn('Next').click());
    const name = document.querySelector('input.ck-input') as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    act(() => { set.call(name, 'Our day'); name.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { btn('Create and send to photographer').click(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    const post = fetchMock.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'POST' && String(c[0]).endsWith('/photobook'));
    const body = JSON.parse((post![1] as { body: string }).body);
    expect(body).toMatchObject({ name: 'Our day', mediaIds: ['e2', 'e1'], eventId: 'ev1', layout: 'grid', coverImage: 'https://x/e2.jpg' });
    expect(fetchMock.mock.calls.some((c) => String(c[0]).endsWith('/photobook/b1/send'))).toBe(true);
    expect(onCreated).toHaveBeenCalledWith('b1');
  });
});
