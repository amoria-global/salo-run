import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.mock('../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('./UnlockModal', () => ({
  default: ({ payment }: { payment: { eventType: string; eventId?: string; galleryId?: string } }) => (
    <div data-testid="pay">{`pay ${payment.eventType} event=${payment.eventId ?? '-'} gallery=${payment.galleryId ?? '-'}`}</div>
  ),
}));

import StandaloneAlbumRestore from './StandaloneAlbumRestore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const colors = { bgCard: '#fff', borderPrimary: '#ccc', textPrimary: '#000', textSecondary: '#444' };
const album = { id: 'g1', title: 'Sunset shoot' };

let root: Root; let host: HTMLDivElement;
beforeEach(() => { fetchMock.mockReset(); host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 20)); }); };
const button = (t: string) => [...document.body.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(t)) as HTMLButtonElement | undefined;
const respond = (json: unknown) => fetchMock.mockResolvedValue({ ok: true, json: async () => json });

describe('StandaloneAlbumRestore', () => {
  it('asks the server for the price, confirms it, then pays against the album itself', async () => {
    respond({ action: 1, data: { fee: 5000, currency: 'RWF', lockedAt: '2026-10-30T10:00:00' } });
    act(() => root.render(<StandaloneAlbumRestore album={album} colors={colors} actualTheme="light" onClose={() => {}} onRestored={() => {}} />));
    await flush();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/remote/photographer/albums/g1/restore-quote');
    const text = document.body.textContent ?? '';
    expect(text).toContain('This album was archived on 30 October 2026. Restore it for RWF 5,000 to view and download again.');
    expect(document.body.querySelector('[data-testid="pay"]')).toBeNull();
    act(() => button('Restore for RWF 5,000')!.click());
    expect(document.body.querySelector('[data-testid="pay"]')?.textContent).toBe('pay Archive Unlock event=- gallery=g1');
  });

  it('says why when the price cannot be loaded, and opens no payment', async () => {
    respond({ action: 0, message: 'You are not authorized to restore this album.' });
    act(() => root.render(<StandaloneAlbumRestore album={album} colors={colors} actualTheme="light" onClose={() => {}} onRestored={() => {}} />));
    await flush();
    expect(document.body.textContent).toContain('You are not authorized to restore this album.');
    expect(button('Restore for')).toBeUndefined();
    expect(document.body.querySelector('[data-testid="pay"]')).toBeNull();
  });

  it('says so when the network fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    act(() => root.render(<StandaloneAlbumRestore album={album} colors={colors} actualTheme="light" onClose={() => {}} onRestored={() => {}} />));
    await flush();
    expect(document.body.textContent).toContain('could not be loaded');
  });
});
