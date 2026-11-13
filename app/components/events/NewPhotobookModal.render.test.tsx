import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fetchMock = vi.fn();
vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a) }));

import NewPhotobookModal, { selectableImages } from './NewPhotobookModal';

const albums = [
  { id: 'a1', title: 'Wedding', eventId: 'ev1', images: ['u1', 'u2', 'u3'] },
  { id: 'a2', title: 'Birthday', images: ['u9'] },
];
const mediaIdMap = { u1: 'm1', u2: 'm2', u9: 'm9' }; // u3 has no id: it cannot be named in the request

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  fetchMock.mockReset();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const mount = (props: Partial<React.ComponentProps<typeof NewPhotobookModal>> = {}) => {
  const fns = { onClose: vi.fn(), onCreated: vi.fn() };
  act(() => root.render(<NewPhotobookModal apiUrl="http://api" albums={albums} mediaIdMap={mediaIdMap} {...fns} {...props} />));
  return fns;
};
const byText = (t: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(t)) as HTMLButtonElement;
const type = (el: HTMLInputElement, value: string) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => { set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
};

describe('New photobook', () => {
  it('lists only photos it can name by id', () => {
    expect(selectableImages(albums[0], mediaIdMap)).toEqual([{ url: 'u1', id: 'm1' }, { url: 'u2', id: 'm2' }]);
    mount();
    expect(document.querySelectorAll('button[aria-pressed]').length).toBe(2);
  });

  it('asks for a name and at least one photo before sending anything', () => {
    mount();
    act(() => byText('Create photobook').click());
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('Give the photobook a name.');
    type(document.querySelector('input.ck-input') as HTMLInputElement, 'Our day');
    act(() => byText('Create photobook').click());
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('Choose at least one photo.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates it with the chosen photos, the album event and the first photo as cover', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ action: 1 }) });
    const { onCreated } = mount();
    type(document.querySelector('input.ck-input') as HTMLInputElement, 'Our day');
    act(() => (document.querySelectorAll('button[aria-pressed]')[1] as HTMLButtonElement).click());
    await act(async () => { byText('Create photobook').click(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api/api/remote/customer/events/photobook');
    expect(JSON.parse(init.body)).toEqual({ name: 'Our day', mediaIds: ['m2'], layout: 'GRID', coverImage: 'u2', eventId: 'ev1' });
    expect(onCreated).toHaveBeenCalled();
  });

  it('shows the server message when it says no (HTTP 200 with action 0 is a failure)', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ action: 0, message: 'Photobook limit reached' }) });
    const { onCreated } = mount();
    type(document.querySelector('input.ck-input') as HTMLInputElement, 'Our day');
    act(() => (document.querySelectorAll('button[aria-pressed]')[0] as HTMLButtonElement).click());
    await act(async () => { byText('Create photobook').click(); });
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('Photobook limit reached');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('says so when there is no album yet', () => {
    mount({ albums: [] });
    expect(document.body.textContent).toContain('You need an album with photos first.');
  });
});
