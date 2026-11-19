// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../../proxy';

const WS = '11111111-2222-3333-4444-555555555555';
const req = (path: string, cookies: Record<string, string>) => new NextRequest(new URL(`https://dashboard.test${path}`), {
  headers: { 'sec-fetch-dest': 'document', cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') },
});

describe('proxy: pages that are not part of a shared workspace', () => {
  it('sends a collaborator on Collaborate or the wallet to not-authorized before the page renders', () => {
    for (const path of ['/user/photographer/collaborate', '/user/photographer/wallet']) {
      const res = proxy(req(path, { amoria_auth: 'x', userRole: 'collaborator', ckws: WS }));
      const to = new URL(res.headers.get('location') || '');
      expect(to.pathname, path).toBe('/user/not-authorized');
      expect(to.searchParams.get('required')).toBe('workspace');
      expect(to.searchParams.get('from')).toBe(path);
    }
  });

  it('lets a collaborator open the workspace pages', () => {
    const res = proxy(req('/user/photographer/events', { amoria_auth: 'x', userRole: 'collaborator', ckws: WS }));
    expect(res.headers.get('location')).toBeNull();
  });

  it('a photographer member keeps the wallet but not the money history; outside a workspace nothing changes', () => {
    expect(proxy(req('/user/photographer/wallet', { amoria_auth: 'x', userRole: 'photographer', ckws: WS })).headers.get('location')).toBeNull();
    expect(new URL(proxy(req('/user/photographer/transaction', { amoria_auth: 'x', userRole: 'photographer', ckws: WS })).headers.get('location') || '').pathname).toBe('/user/not-authorized');
    expect(proxy(req('/user/photographer/collaborate', { amoria_auth: 'x', userRole: 'photographer' })).headers.get('location')).toBeNull();
  });
});
