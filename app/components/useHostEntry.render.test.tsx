import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
vi.mock('../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

import { useHostEntry } from './useHostEntry';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const res = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

function Probe() {
  const { canHost, caption } = useHostEntry();
  return <p>{canHost ? `yes|${caption}` : 'no'}</p>;
}

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
  await act(async () => { root.render(<Probe />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

describe('useHostEntry', () => {
  it('offers the tiles, with a count line, when the server says this account can host', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      url.includes('eligibility')
        ? res({ action: 1, data: { enabled: true, canHostFree: true, canHostPaid: false, reason: null } })
        : res({ action: 1, data: [{ id: 'u1', title: 'Friday', eventStatus: 'PUBLISHED', eventDate: '2099-11-10', isPublished: true }] }));
    await mount();
    expect(host.textContent).toBe('yes|1 upcoming \u00B7 0 live');
  });

  it('offers nothing to an account that cannot host, and never reads its events', async () => {
    mockFetch.mockImplementation(async () => res({ action: 1, data: { enabled: true, canHostFree: false, canHostPaid: false, reason: 'ROLE_CANNOT_HOST' } }));
    await mount();
    expect(host.textContent).toBe('no');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('offers nothing when the check fails', async () => {
    mockFetch.mockRejectedValue(new Error('down'));
    await mount();
    expect(host.textContent).toBe('no');
  });
});
