import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
let hostProps: Record<string, unknown> = {};

vi.mock('../../providers/AuthProvider', () => ({ dashboardAuthFetch: (...a: unknown[]) => mockFetch(...a) }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: () => ({ colors: {}, actualTheme: 'light' }) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));
vi.mock('./HostLivePage', () => ({ default: (p: Record<string, unknown>) => { hostProps = p; return <div data-testid="host-live" />; } }));

import OwnerGoLive from './OwnerGoLive';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const json = (body: unknown, ok = true) => Promise.resolve({ ok, json: async () => body } as Response);

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  mockFetch.mockReset();
  hostProps = {};
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

const mount = async () => {
  await act(async () => root.render(<OwnerGoLive eventId="e1" eventTitle="My gala" allowWishInvites={false} onClose={() => undefined} />));
};

describe('OwnerGoLive', () => {
  it('reads the stream setup from the photographer stream config endpoint and passes it to the live page', async () => {
    mockFetch.mockImplementation(() => json({ action: 1, data: { whipUrl: 'https://cf/whip', whepUrl: 'https://cf/whep', connectionStatus: 'disconnected', viewerCount: 3 } }));
    await mount();
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.test/api/remote/photographer/events/e1/stream/config');
    expect(hostProps).toMatchObject({ eventId: 'e1', eventTitle: 'My gala', whipUrl: 'https://cf/whip', viewerCount: 3, wishInvites: false });
  });

  it('starts the stream through the stream start endpoint and shows the new WHIP URL for OBS', async () => {
    mockFetch.mockImplementation((url: string) => (String(url).endsWith('/stream/start') ? json({ action: 1, data: { whipUrl: 'https://cf/new-whip', whepUrl: 'https://cf/new-whep' } }) : json({ data: null })));
    await mount();
    await act(async () => { await (hostProps.onStartStream as () => Promise<void>)(); });
    expect(mockFetch).toHaveBeenCalledWith('https://api.test/api/remote/photographer/events/e1/stream/start', { method: 'POST' });
    expect(hostProps.whipUrl).toBe('https://cf/new-whip');
  });

  it('shows the server refusal as the error and does not pretend the stream went live', async () => {
    mockFetch.mockImplementation((url: string) => (String(url).endsWith('/stream/resume')
      ? json({ action: 0, message: 'You are not authorized to start streaming for this event' }, false)
      : json({ data: null })));
    await mount();
    await act(async () => { await (hostProps.onResumeStream as () => Promise<void>)(); });
    expect(hostProps.error).toBe('You are not authorized to start streaming for this event');
    expect(hostProps.connectionStatus).toBe('disconnected');
  });
});
