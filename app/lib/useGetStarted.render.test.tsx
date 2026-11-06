import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fetchMock = vi.fn();
const hostedMock = vi.fn();
vi.mock('../providers/AuthProvider', () => ({
  useDashboardAuth: () => ({ user: { id: 'u1' } }),
  dashboardAuthFetch: (...a: unknown[]) => fetchMock(...a),
}));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'http://api' }));
vi.mock('@/lib/hosting/hostedEvents', () => ({ listHostedEvents: () => hostedMock() }));

import { useGetStarted } from './useGetStarted';
import { resetShown } from './getStarted';

let latest: ReturnType<typeof useGetStarted>;
function Probe({ hasItems = false, canCreate = true }: { hasItems?: boolean; canCreate?: boolean }) {
  latest = useGetStarted({ role: 'photographer', canHost: true, canCreate, listLoaded: true, hasItems });
  return null;
}

let root: Root;
let host: HTMLDivElement;
const json = (data: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve({ action: 1, data }) });
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const mount = async (props: React.ComponentProps<typeof Probe> = {}) => {
  resetShown();
  act(() => root.render(null));
  act(() => root.render(<Probe {...props} />));
  await settle();
  await settle();
};
let prefs: Record<string, string>;
let albums: unknown[];
let photobooks: unknown[];

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  window.localStorage.clear();
  prefs = {};
  albums = [];
  photobooks = [];
  hostedMock.mockResolvedValue([]);
  fetchMock.mockImplementation((url: string) => {
    if (url.endsWith('/photographer/preferences')) return json(prefs);
    if (url.endsWith('/photographer/albums')) return json(albums);
    if (url.endsWith('/photographer/photobooks')) return json(photobooks);
    return json({});
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('Get started opens only for an account that has created nothing', () => {
  it('opens when there are no events, hosted events, albums or photobooks', async () => {
    await mount();
    expect(latest.open).toBe(true);
  });

  it('stays closed when the account has albums, hosted events or photobooks', async () => {
    albums = [{ id: 'a' }];
    await mount();
    expect(latest.open).toBe(false);
    albums = [];
    hostedMock.mockResolvedValue([{ id: 'h' }]);
    await mount();
    expect(latest.open).toBe(false);
    hostedMock.mockResolvedValue([]);
    photobooks = [{ id: 'p' }];
    await mount();
    expect(latest.open).toBe(false);
  });

  it('stays closed when a read fails, when events exist, when dismissed on the account, or without the create permission', async () => {
    hostedMock.mockRejectedValue(new Error('offline'));
    await mount();
    expect(latest.open).toBe(false);
    hostedMock.mockResolvedValue([]);
    await mount({ hasItems: true });
    expect(latest.open).toBe(false);
    prefs = { 'events.getStarted.dismissed': 'true' };
    await mount();
    expect(latest.open).toBe(false);
    prefs = {};
    await mount({ canCreate: false });
    expect(latest.open).toBe(false);
  });

  it('opens at most once per browser session', async () => {
    await mount();
    expect(latest.open).toBe(true);
    act(() => latest.close());
    act(() => root.render(<Probe />));
    await settle();
    expect(latest.open).toBe(false);
  });
});
