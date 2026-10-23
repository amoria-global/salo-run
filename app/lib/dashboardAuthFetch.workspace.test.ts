import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => '/', useRouter: () => ({ replace() {}, push() {} }) }));
vi.mock('@/lib/platformConfig', () => ({ getPlatformConfig: async () => ({}) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test', normalizeImageUrl: (u: string) => u }));

import { dashboardAuthFetch } from '../providers/AuthProvider';
import { WORKSPACE_LOST_EVENT, WORKSPACE_NOT_AVAILABLE, getActiveWorkspaceId, setActiveWorkspaceId } from './workspace';

/**
 * The one choke point every dashboard API call goes through: it must name the workspace on work calls only, and a
 * revoked or unknown workspace must drop the user back to their own instead of leaving the app on errors.
 */
const OWNER = '3f2a9c1e-5b7d-4c8e-9a10-0b1c2d3e4f50';
const sent: { url: string; headers: Record<string, string> }[] = [];

function reply(status: number, body: unknown) {
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    sent.push({ url: String(url), headers: { ...(init?.headers as Record<string, string>) } });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}

beforeEach(() => {
  window.localStorage.clear();
  sent.length = 0;
});
afterEach(() => window.localStorage.clear());

describe('dashboardAuthFetch with a workspace selected', () => {
  it('names the workspace on a work call and not on a personal one', async () => {
    reply(200, { action: 1 });
    setActiveWorkspaceId(OWNER);
    await dashboardAuthFetch('https://api.test/api/remote/photographer/events');
    await dashboardAuthFetch('https://api.test/api/remote/customer/profile');
    expect(sent[0].headers['X-Workspace-Id']).toBe(OWNER);
    expect(sent[1].headers['X-Workspace-Id']).toBeUndefined();
  });

  it('sends nothing extra in the photographer own workspace', async () => {
    reply(200, { action: 1 });
    await dashboardAuthFetch('https://api.test/api/remote/photographer/events');
    expect(sent[0].headers['X-Workspace-Id']).toBeUndefined();
  });

  it('drops a refused workspace and tells the app, on the fixed refusal only', async () => {
    const lost = vi.fn();
    window.addEventListener(WORKSPACE_LOST_EVENT, lost);
    setActiveWorkspaceId(OWNER);
    reply(403, { action: 0, message: WORKSPACE_NOT_AVAILABLE });
    const res = await dashboardAuthFetch('https://api.test/api/remote/photographer/events');
    expect(res.status).toBe(403);
    expect(getActiveWorkspaceId()).toBeNull();
    expect(lost).toHaveBeenCalledTimes(1);

    // An ordinary refusal (for example a money page) does not throw the user out of the workspace.
    setActiveWorkspaceId(OWNER);
    reply(403, { action: 0, message: 'This is not available in a shared workspace' });
    await dashboardAuthFetch('https://api.test/api/remote/photographer/balance');
    expect(getActiveWorkspaceId()).toBe(OWNER);
    expect(lost).toHaveBeenCalledTimes(1);
    window.removeEventListener(WORKSPACE_LOST_EVENT, lost);
  });
});
