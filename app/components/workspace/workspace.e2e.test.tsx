import http from 'node:http';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The REAL web client code against the REAL backend pipeline (real security chain, really signed tokens, real
 * controllers: see the backend's WorkspaceClientsCheck). It does nothing unless that test starts the server and sets
 * WS_E2E_URL: it seeds the accounts, runs this file once per phase (alternating with the mobile client, so an invitation
 * sent from one client is answered from the other), then checks the database.
 *
 * Real here: the Workspace access tab, the invitation API client, dashboardAuthFetch (token, workspace header, fallback
 * on a refused workspace), and the workspace storage. Faked here: only the transport (node http instead of a browser),
 * the workspace provider (replaced by a minimal one) and the page chrome around the tab. Not a browser run.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// Real endpoints on a cold JVM: the first requests can take several seconds.
vi.setConfig({ testTimeout: 90000 });

const BASE = process.env.WS_E2E_URL;
const PHASE = process.env.WS_E2E_PHASE ?? '';
const ME = process.env.WS_E2E_ME_ID ?? '';
const ME_TOKEN = process.env.WS_E2E_ME_TOKEN ?? '';
const STRANGER_TOKEN = process.env.WS_E2E_STRANGER_TOKEN ?? '';
const OWNER_BOOKING_ID = process.env.WS_E2E_OWNER_BOOKING_ID ?? '';
const OWNER_BOOKING_TITLE = process.env.WS_E2E_OWNER_BOOKING_TITLE ?? '';
const MEMBER_BOOKING_TITLE = process.env.WS_E2E_MEMBER_BOOKING_TITLE ?? '';
const OWNER = process.env.WS_E2E_OWNER_ID ?? '';
const MEMBER_EMAIL = process.env.WS_E2E_MEMBER_EMAIL ?? '';
const MEMBER_NAME = process.env.WS_E2E_MEMBER_NAME ?? '';
const NEWCOMER_EMAIL = process.env.WS_E2E_NEWCOMER_EMAIL ?? '';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => '/', useRouter: () => ({ replace() {}, push() {} }) }));
vi.mock('@/lib/platformConfig', () => ({ getPlatformConfig: async () => ({}) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => process.env.WS_E2E_URL as string, normalizeImageUrl: (u: string) => u }));
vi.mock('@/app/providers/WorkspaceProvider', async () => {
  const ws = await import('@/app/lib/workspace');
  return { useWorkspace: () => ({ workspaces: [], active: null, isShared: false, loading: false, switchTo: (id: string | null) => ws.setActiveWorkspaceId(id), refresh: async () => {} }) };
});

import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import WorkspaceAccessTab from './WorkspaceAccessTab';
import {
  answerInvitation, getInvitePreview, listMyWorkspaces, listReceivedInvitations, listSentInvitations, resendInvitation, revokeMembership,
  sendInvitation, sendInvitationByEmail,
} from '@/app/lib/APIs/workspaces';
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

/** The member's own booking id, read from their personal workspace (no workspace header). */
async function listMyOwnBookingId(): Promise<string> {
  const selected = getActiveWorkspaceId();
  setActiveWorkspaceId(null);
  try {
    const r = await call('/photographer/bookings');
    return r.body.data[0].id as string;
  } finally {
    setActiveWorkspaceId(selected);
  }
}

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
  window.localStorage.setItem('authToken', ME_TOKEN);
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
    expect(text()).toContain('What they can and cannot do');
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
    await expect(sendInvitation(mine.invitee.id as string)).rejects.toThrow(/already waiting/);
  });

  only('accept')('the invited photographer accepts, works in the workspace, and is kept away from withdrawals and transactions', async () => {
    const received = await listReceivedInvitations();
    const pending = received.find((i) => i.status === 'PENDING')!;
    expect(pending.owner.id).toBe(OWNER);

    // Someone else's account cannot answer it.
    window.localStorage.setItem('authToken', STRANGER_TOKEN);
    await expect(answerInvitation(pending.id, true)).rejects.toThrow('Invitation not found');
    window.localStorage.setItem('authToken', ME_TOKEN);

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

    // Work calls run in the OWNER's workspace: the owner's booking is listed with its amount, the member's own is not.
    const list = await call('/photographer/bookings');
    expect(list.status).toBe(200);
    const listed = JSON.stringify(list.body.data);
    expect(listed).toContain(OWNER_BOOKING_TITLE);
    expect(listed).not.toContain(MEMBER_BOOKING_TITLE);
    expect(listed).toContain('300');
    // The balance, the wallet summary, analytics and opportunities are available.
    const balance = await call('/photographer/balance');
    expect(balance.status).toBe(200);
    expect(balance.body.data).toHaveProperty('withdrawableBalance');
    const wallet = await call('/wallet/me');
    expect(wallet.status).toBe(200);
    expect(wallet.body.data).toHaveProperty('totalWithdrawn');
    expect((await call('/photographer/analytics')).status).toBe(200);
    expect((await call('/photographer/opportunities')).status).toBe(200);
    // The real booking rules apply: the owner's booking can be accepted, the member's own cannot, from here.
    const owned = await call('/photographer/bookings');
    const memberBookingId = (await listMyOwnBookingId());
    expect((await call(`/photographer/bookings/${memberBookingId}/accept`, { method: 'POST' })).status).toBe(403);
    const accepted = await call(`/photographer/bookings/${OWNER_BOOKING_ID}/accept`, { method: 'POST' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('ACCEPTED');
    expect(owned.status).toBe(200);

    // Withdrawals and transactions are refused by the real backend, and that does not drop the workspace selection.
    for (const [path, init] of [['/photographer/transactions', undefined], ['/wallet/me/movements', undefined], ['/photographer/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"amount":10}' }]] as const) {
      const r = await call(path, init as RequestInit | undefined);
      expect(r.status, path).toBe(403);
      expect(r.body.message).toBe('This is not available in a shared workspace');
    }
    expect(getActiveWorkspaceId()).toBe(OWNER);

    // A call about the person themself does not carry the workspace: under the real policy it would be refused if it did.
    expect(await listSentInvitations()).toEqual([]);
  });

  only('email-invite')('the owner invites an address with no account by email, through the Workspace access tab', async () => {
    await mountTab();
    await type('ws-email', NEWCOMER_EMAIL);
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await waitForText('No account uses this address yet');
    await click(byText('Email invitation'));
    await waitForText('Invitation emailed to ' + NEWCOMER_EMAIL);

    const mine = (await listSentInvitations()).find((i) => i.invitee.email === NEWCOMER_EMAIL)!;
    expect(mine.status).toBe('PENDING');
    expect(mine.delivery).toBe('email');
    expect(mine.invitee.registered).toBe(false);
    expect(mine.invitee.id).toBeNull();
    // The screen reads it as waiting for an account, with emailing it again as the move.
    await mountTab();
    await waitForText('No account yet');
    await waitForText('Emailed. Waiting for them to create an account and answer.');
    // The server, not just the screen, refuses a second invitation to the same address and an immediate second email.
    await expect(sendInvitationByEmail(NEWCOMER_EMAIL)).rejects.toThrow(/already waiting/);
    await expect(resendInvitation(mine.id)).rejects.toThrow(/just emailed/);
  });

  only('email-accept')('the person signs up with that address, opens the invitation from its link, accepts, and works in the workspace', async () => {
    // The invitation is theirs because the address is theirs: it appears for the new account, and only for it.
    const pending = (await listReceivedInvitations()).find((i) => i.status === 'PENDING')!;
    expect(pending.owner.id).toBe(OWNER);
    // What the link's page shows before sign-in: no token needed, and it knows the address now has an account.
    const preview = await getInvitePreview(pending.id);
    expect(preview).toMatchObject({ found: true, open: true, email: NEWCOMER_EMAIL, account: 'photographer' });
    // Someone else's account that was forwarded the link cannot answer it, and sees only the masked address.
    window.localStorage.setItem('authToken', STRANGER_TOKEN);
    await expect(answerInvitation(pending.id, true)).rejects.toThrow('Invitation not found');
    expect((await listReceivedInvitations()).map((i) => i.id)).not.toContain(pending.id);
    window.localStorage.setItem('authToken', ME_TOKEN);

    // Open it the way the link does: the invitation first, accepted and opened in one step.
    const handled = vi.fn();
    await act(async () => { root.render(<WorkspaceAccessTab inviteId={pending.id} onInviteHandled={handled} />); });
    await waitForText('Your invitation');
    await click(byText('Accept and open workspace'));
    for (let i = 0; i < 40 && getActiveWorkspaceId() !== OWNER; i++) await settle();
    expect(handled).toHaveBeenCalledTimes(1);
    expect(getActiveWorkspaceId()).toBe(OWNER);

    // Now a member like any other: the owner's booking, accepted for real; money stays with the owner.
    const listed = JSON.stringify((await call('/photographer/bookings')).body.data);
    expect(listed).toContain(OWNER_BOOKING_TITLE);
    expect(listed).not.toContain(MEMBER_BOOKING_TITLE);
    const accepted = await call(`/photographer/bookings/${OWNER_BOOKING_ID}/accept`, { method: 'POST' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('ACCEPTED');
    expect((await call('/photographer/transactions')).status).toBe(403);
    // The link's page no longer offers a finished invitation.
    expect(await getInvitePreview(pending.id)).toMatchObject({ found: true, open: false });
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
    const r = await call('/photographer/bookings');
    expect(r.status).toBe(403);
    expect(r.body.message).toBe('Workspace access is not available');
    expect(JSON.stringify(r.body)).not.toContain(OWNER_BOOKING_TITLE);
    expect(getActiveWorkspaceId()).toBeNull();
    expect(lost).toHaveBeenCalledTimes(1);
    window.removeEventListener(WORKSPACE_LOST_EVENT, lost);

    // Their own account and workspace carry on: their own booking, not the owner's.
    const own = await call('/photographer/bookings');
    expect(own.status).toBe(200);
    expect(JSON.stringify(own.body.data)).toContain(MEMBER_BOOKING_TITLE);
    expect(JSON.stringify(own.body.data)).not.toContain(OWNER_BOOKING_TITLE);
    expect((await call('/wallet/me')).status).toBe(200);
    expect(await listMyWorkspaces()).toEqual([]);
    const received = await listReceivedInvitations();
    expect(received.map((i) => i.status)).toEqual(['REVOKED']);
  });
});
