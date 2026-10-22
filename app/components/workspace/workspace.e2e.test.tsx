import http from 'node:http';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The REAL web client code against a REAL running backend. It does nothing unless the backend's WorkspaceClientsIT
 * starts a server and sets WS_E2E_URL: that test seeds the accounts, runs this file once per phase (alternating with
 * the mobile client, so an invitation sent from one client is answered from the other), then checks the database.
 *
 * Real here: the Workspace access tab, the invitation API client, dashboardAuthFetch (token, workspace header, fallback
 * on a refused workspace), and the workspace storage. Faked here: only the transport (node http instead of the
 * browser) and the page chrome around the tab.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BASE = process.env.WS_E2E_URL;
const PHASE = process.env.WS_E2E_PHASE ?? '';
const ME = process.env.WS_E2E_ME_ID ?? '';
const OWNER = process.env.WS_E2E_OWNER_ID ?? '';
const MEMBER_EMAIL = process.env.WS_E2E_MEMBER_EMAIL ?? '';
const MEMBER_NAME = process.env.WS_E2E_MEMBER_NAME ?? '';
const STRANGER_ID = process.env.WS_E2E_STRANGER_ID ?? '';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => '/', useRouter: () => ({ replace() {}, push() {} }) }));
vi.mock('@/lib/platformConfig', () => ({ getPlatformConfig: async () => ({}) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => process.env.WS_E2E_URL as string, normalizeImageUrl: (u: string) => u }));
vi.mock('@/app/providers/WorkspaceProvider', async () => {
  const ws = await import('@/app/lib/workspace');
  return { useWorkspace: () => ({ workspaces: [], active: null, isShared: false, loading: false, switchTo: (id: string | null) => ws.setActiveWorkspaceId(id), refresh: async () => {} }) };
});

import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import WorkspaceAccessTab from './WorkspaceAccessTab';
import { answerInvitation, listMyWorkspaces, listReceivedInvitations, listSentInvitations, revokeMembership, sendInvitation } from '@/app/lib/APIs/workspaces';
import { WORKSPACE_LOST_EVENT, getActiveWorkspaceId, setActiveWorkspaceId } from '@/app/lib/workspace';

/** A fetch over node http: the same wire the browser would use, without a browser. */
function nodeFetch(url: string, init: { method?: string; headers?: Record<string, string>; body?: unknown } = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = init.body == null ? undefined : String(init.body);
    const headers: Record<string, string | number> = { ...(init.headers ?? {}) };
    if (body !== undefined) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: init.method ?? 'GET', headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        const make = (): unknown => ({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode,
          headers: { get: (k: string) => { const v = res.headers[k.toLowerCase()]; return Array.isArray(v) ? v.join(',') : (v ?? null); } },
          text: async () => text,
          json: async () => JSON.parse(text),
          clone: make,
        });
        resolve(make());
      });
    });
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

const call = async (path: string, init?: RequestInit) => {
  const res = await dashboardAuthFetch(`${BASE}/api/remote${path}`, init);
  return { status: res.status, body: await res.json() };
};

let host: HTMLDivElement;
let root: Root;
const text = () => host.textContent || '';
const buttons = () => Array.from(host.querySelectorAll('button'));
const byText = (t: string) => buttons().filter((b) => (b.textContent || '').trim() === t).pop();
async function click(el: HTMLElement | undefined) {
  if (!el) throw new Error('control not found');
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}
async function type(id: string, value: string) {
  const el = host.querySelector<HTMLInputElement>('#' + id)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function mountTab() {
  await act(async () => { root.render(<WorkspaceAccessTab />); });
  // Let the real requests land.
  for (let i = 0; i < 20 && host.querySelector('[aria-busy="true"]'); i++) await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 150)); });
/** Waits for the real server to answer: the first request after start-up can take a second or two. */
async function waitForText(expected: string, ms = 15000) {
  const until = Date.now() + ms;
  while (!text().includes(expected) && Date.now() < until) await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
  expect(text()).toContain(expected);
}

beforeEach(() => {
  (globalThis as { fetch: unknown }).fetch = nodeFetch;
  (window as unknown as { fetch: unknown }).fetch = nodeFetch;
  window.localStorage.clear();
  window.localStorage.setItem('authToken', 'test:' + ME);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const only = (phase: string) => (BASE && PHASE === phase ? it : it.skip);

describe('web client against the real backend', () => {
  only('invite')('the owner invites a photographer through the Workspace access tab', async () => {
    await mountTab();
    expect(text()).toContain('Let another photographer work in your workspace');
    await type('ws-email', MEMBER_EMAIL);
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await waitForText(MEMBER_NAME);
    await type('ws-note', 'Weddings this season');
    await click(byText('Send invitation'));
    await waitForText('Invitation sent to ' + MEMBER_NAME);

    const sent = await listSentInvitations();
    const mine = sent.find((i) => i.invitee.name === MEMBER_NAME)!;
    expect(mine.status).toBe('PENDING');
    expect(mine.note).toBe('Weddings this season');
    expect(mine.delivery).toBe('in_app');
    // A second invitation to the same photographer is refused by the server, not just hidden by the screen.
    await expect(sendInvitation(mine.invitee.id)).rejects.toThrow(/already waiting/);
  });

  only('accept')('the invited photographer accepts, works in the workspace, and is kept away from withdrawals and transactions', async () => {
    const received = await listReceivedInvitations();
    const pending = received.find((i) => i.status === 'PENDING')!;
    expect(pending.owner.id).toBe(OWNER);

    // Someone else's account cannot answer it.
    window.localStorage.setItem('authToken', 'test:' + STRANGER_ID);
    await expect(answerInvitation(pending.id, true)).rejects.toThrow('Invitation not found');
    window.localStorage.setItem('authToken', 'test:' + ME);

    await mountTab();
    expect(text()).toContain('Invitations for you');
    await click(byText('Accept'));
    await waitForText('Workspaces you can open');
    const mine = await listMyWorkspaces();
    expect(mine).toHaveLength(1);
    expect(mine[0].workspaceId).toBe(OWNER);
    expect(mine[0].access).toEqual({ business: true, financial: false, ownerAccount: false, manageMembers: false });

    // Open the workspace from the screen, the way a user would.
    await click(byText('Open workspace'));
    expect(getActiveWorkspaceId()).toBe(OWNER);

    // Work calls run as the owner with this photographer kept as the actor.
    const clients = await call('/photographer/clients');
    expect(clients.status).toBe(200);
    expect(clients.body.ranAs).toBe(OWNER);
    expect(clients.body.actor).toBe(ME);
    expect(clients.body.data[0].totalSpent).toBe(1250);
    expect(clients.body.data[0]).not.toHaveProperty('transactions');
    expect((await call('/photographer/balance')).body.balance).toBe(999);
    expect((await call('/photographer/bookings/b1/accept', { method: 'POST' })).body.bookingOwner).toBe(OWNER);

    // Withdrawals and transactions are refused by the server, and that does not throw the user out of the workspace.
    for (const [path, init] of [['/photographer/transactions', undefined], ['/wallet/me/movements', undefined], ['/photographer/withdraw', { method: 'POST' }]] as const) {
      const r = await call(path, init as RequestInit | undefined);
      expect(r.status, path).toBe(403);
      expect(JSON.stringify(r.body)).not.toContain('t1');
    }
    expect(getActiveWorkspaceId()).toBe(OWNER);

    // A call about the person themself does not carry the workspace.
    expect((await call('/customer/profile')).body.ranAs).toBe(ME);
    // Managing invitations from inside the workspace is not possible: it goes out without the workspace and acts as them.
    const sent = await listSentInvitations();
    expect(sent).toEqual([]);
  });

  only('revoke')('the owner removes access', async () => {
    const accepted = (await listSentInvitations()).find((i) => i.status === 'ACCEPTED')!;
    const ended = await revokeMembership(accepted.id);
    expect(ended.status).toBe('REVOKED');
  });

  only('after-revoke')('a removed collaborator is sent back to their own workspace on the very next request', async () => {
    const lost = vi.fn();
    window.addEventListener(WORKSPACE_LOST_EVENT, lost);
    setActiveWorkspaceId(OWNER);
    const r = await call('/photographer/clients');
    expect(r.status).toBe(403);
    expect(r.body.message).toBe('Workspace access is not available');
    expect(JSON.stringify(r.body)).not.toContain('Kigali');
    expect(getActiveWorkspaceId()).toBeNull();
    expect(lost).toHaveBeenCalledTimes(1);
    window.removeEventListener(WORKSPACE_LOST_EVENT, lost);

    // Their own account and workspace carry on.
    expect((await call('/photographer/clients')).body.ranAs).toBe(ME);
    expect(await listMyWorkspaces()).toEqual([]);
    const received = await listReceivedInvitations();
    expect(received.map((i) => i.status)).toEqual(['REVOKED']);
  });
});
