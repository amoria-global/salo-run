import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  listSentInvitations: vi.fn(),
  listReceivedInvitations: vi.fn(),
  lookupPhotographer: vi.fn(),
  sendInvitation: vi.fn(),
  resendInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
  revokeMembership: vi.fn(),
  answerInvitation: vi.fn(),
  leaveWorkspace: vi.fn(),
}));
const ws = vi.hoisted(() => ({ switchTo: vi.fn(), refresh: vi.fn(async () => {}) }));

vi.mock('@/app/lib/APIs/workspaces', () => api);
vi.mock('@/app/providers/WorkspaceProvider', () => ({ useWorkspace: () => ({ ...ws, workspaces: [], active: null, isShared: false, loading: false }) }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: vi.fn(), useDashboardAuth: () => ({}) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

import WorkspaceAccessTab from './WorkspaceAccessTab';

/**
 * The Workspace access tab rendered over faked invitation endpoints (react-dom in happy-dom): what each side sees,
 * the moves offered per status, confirmation before anything destructive, one request per tap, and an error that
 * reads as an error rather than a silent success.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const person = (id: string, name: string) => ({ id, name, customerType: 'Photographer', profilePicture: null });
const inv = (o: Record<string, unknown>) => ({
  id: 'i1', status: 'PENDING', owner: person('o1', 'Aline Uwase'), invitee: person('p1', 'Eric Mugisha'),
  note: null, createdAt: '2026-10-20T09:00:00', expiresAt: '2026-11-03T09:00:00', delivery: 'in_app', ...o,
});

let host: HTMLDivElement;
let root: Root;

async function mount() {
  await act(async () => {
    root.render(<WorkspaceAccessTab />);
  });
  await act(async () => {});
}
const text = () => host.textContent || '';
const buttons = () => Array.from(host.querySelectorAll('button'));
const byText = (t: string) => buttons().find((b) => (b.textContent || '').trim() === t);
const lastByText = (t: string) => buttons().filter((b) => (b.textContent || "").trim() === t).pop();
const byLabel = (l: string) => buttons().find((b) => b.getAttribute('aria-label') === l);
async function click(el: HTMLElement | undefined) {
  if (!el) throw new Error('control not found');
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}
async function type(id: string, value: string) {
  const el = host.querySelector<HTMLInputElement>('#' + id)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
const submit = async () => {
  await act(async () => {
    host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
};

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset());
  ws.switchTo.mockReset();
  api.listSentInvitations.mockResolvedValue([]);
  api.listReceivedInvitations.mockResolvedValue([]);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('workspace access tab', () => {
  it('explains what an invited photographer can and cannot do', async () => {
    await mount();
    expect(text()).toContain('Let another photographer work in your workspace');
    expect(text()).toContain('cannot see your wallet, payments or account settings');
    expect(text()).toContain('You have not invited anyone yet');
  });

  it('lists what was sent with its status and the right moves', async () => {
    api.listSentInvitations.mockResolvedValue([
      inv({ id: 'a', status: 'PENDING' }),
      inv({ id: 'b', status: 'ACCEPTED', invitee: person('p2', 'Chantal Ineza') }),
      inv({ id: 'c', status: 'DECLINED', invitee: person('p3', 'Jean Bosco') }),
      inv({ id: 'd', status: 'REVOKED', invitee: person('p4', 'Olive Kamali') }),
    ]);
    await mount();
    expect(text()).toContain('Eric Mugisha');
    expect(text()).toContain('Waiting');
    expect(text()).toContain('Active');
    expect(text()).toContain('Declined');
    expect(text()).toContain('Removed');
    expect(byLabel('Send again: Eric Mugisha')).toBeTruthy();
    expect(byLabel('Cancel: Eric Mugisha')).toBeTruthy();
    expect(byLabel('Remove access: Chantal Ineza')).toBeTruthy();
    expect(byLabel('Send again: Jean Bosco')).toBeTruthy();
    // A removed member has no inline move; the owner invites again from the form.
    expect(byLabel('Send again: Olive Kamali')).toBeUndefined();
    expect(byLabel('Remove access: Olive Kamali')).toBeUndefined();
  });

  it('asks before cancelling and only then asks the server', async () => {
    api.listSentInvitations.mockResolvedValue([inv({ id: 'a' })]);
    api.cancelInvitation.mockResolvedValue(inv({ id: 'a', status: 'CANCELLED' }));
    await mount();
    await click(byLabel('Cancel: Eric Mugisha'));
    expect(api.cancelInvitation).not.toHaveBeenCalled();
    expect(text()).toContain('Cancel this invitation?');
    await click(byText('Cancel invitation'));
    expect(api.cancelInvitation).toHaveBeenCalledWith('a');
    expect(text()).toContain('Invitation cancelled.');
  });

  it('asks before removing access, then removes it', async () => {
    api.listSentInvitations.mockResolvedValue([inv({ id: 'b', status: 'ACCEPTED' })]);
    api.revokeMembership.mockResolvedValue(inv({ id: 'b', status: 'REVOKED' }));
    await mount();
    await click(byLabel('Remove access: Eric Mugisha'));
    expect(text()).toContain('lose access to your workspace right away');
    await click(lastByText('Remove access'));
    expect(api.revokeMembership).toHaveBeenCalledWith('b');
  });

  it('finds a photographer by email, sends once, and clears the form', async () => {
    api.lookupPhotographer.mockResolvedValue(person('p9', 'Grace Mutoni'));
    api.sendInvitation.mockResolvedValue(inv({ id: 'n', invitee: person('p9', 'Grace Mutoni') }));
    await mount();
    await type('ws-email', 'grace@example.com');
    await submit();
    expect(api.lookupPhotographer).toHaveBeenCalledWith('grace@example.com');
    expect(text()).toContain('Grace Mutoni');
    await type('ws-note', 'Weddings in June');
    const send = byText('Send invitation')!;
    // Two quick taps make one request.
    await act(async () => {
      send.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      send.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(api.sendInvitation).toHaveBeenCalledTimes(1);
    expect(api.sendInvitation).toHaveBeenCalledWith('p9', 'Weddings in June');
    expect(text()).toContain('Invitation sent to Grace Mutoni');
    expect((host.querySelector('#ws-email') as HTMLInputElement).value).toBe('');
  });

  it('says plainly when no photographer matches, and when the server refuses a duplicate', async () => {
    api.lookupPhotographer.mockRejectedValueOnce(new Error('No photographer account uses that email'));
    await mount();
    await type('ws-email', 'nobody@example.com');
    await submit();
    expect(text()).toContain('No photographer account uses that email');
    expect(byText('Send invitation')).toBeUndefined();

    api.lookupPhotographer.mockResolvedValue(person('p9', 'Grace Mutoni'));
    api.sendInvitation.mockRejectedValue(new Error('An invitation to this photographer is already waiting'));
    await type('ws-email', 'grace@example.com');
    await submit();
    await click(byText('Send invitation'));
    expect(text()).toContain('already waiting');
    // The invitation was not recorded as sent.
    expect(text()).not.toContain('Invitation sent to');
  });

  it('lets the invited photographer accept, once, and open the workspace', async () => {
    api.listReceivedInvitations.mockResolvedValueOnce([inv({ id: 'r1', status: 'PENDING' })]);
    api.answerInvitation.mockResolvedValue(inv({ id: 'r1', status: 'ACCEPTED' }));
    await mount();
    expect(text()).toContain('Invitations for you');
    expect(text()).toContain("Aline Uwase's workspace");
    expect(text()).toContain('Wallet and payments stay with them');
    // The list is read again after the answer, and then shows the accepted workspace.
    api.listReceivedInvitations.mockResolvedValue([inv({ id: 'r1', status: 'ACCEPTED' })]);
    const accept = byText('Accept')!;
    await act(async () => {
      accept.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      accept.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(api.answerInvitation).toHaveBeenCalledTimes(1);
    expect(api.answerInvitation).toHaveBeenCalledWith('r1', true);

    await click(byText('Open workspace'));
    expect(ws.switchTo).toHaveBeenCalledWith('o1');
  });

  it('declines on request', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv({ id: 'r1' })]);
    api.answerInvitation.mockResolvedValue(inv({ id: 'r1', status: 'DECLINED' }));
    await mount();
    await click(byText('Decline'));
    expect(api.answerInvitation).toHaveBeenCalledWith('r1', false);
  });

  it('shows the server error and refreshes when a move fails because the invitation moved on', async () => {
    api.listSentInvitations.mockResolvedValue([inv({ id: 'a', status: 'ACCEPTED' })]);
    api.revokeMembership.mockRejectedValue(new Error('Only a photographer who has joined can be removed'));
    await mount();
    const before = api.listSentInvitations.mock.calls.length;
    await click(byLabel('Remove access: Eric Mugisha'));
    await click(lastByText('Remove access'));
    expect(text()).toContain('Only a photographer who has joined can be removed');
    expect(api.listSentInvitations.mock.calls.length).toBeGreaterThan(before);
  });

  it('shows a loading state, then an error with a retry that works', async () => {
    api.listSentInvitations.mockRejectedValueOnce(new Error('Server is down'));
    await mount();
    expect(text()).toContain('Could not load invitations');
    expect(text()).toContain('Server is down');
    api.listSentInvitations.mockResolvedValue([inv({})]);
    await click(byText('Try again'));
    expect(text()).toContain('Eric Mugisha');
  });
});
