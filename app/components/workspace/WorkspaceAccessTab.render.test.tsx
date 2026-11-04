import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  listSentInvitations: vi.fn(),
  listReceivedInvitations: vi.fn(),
  sendInvitationByEmail: vi.fn(),
  listWorkspaceActivity: vi.fn(),
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
  api.listWorkspaceActivity.mockResolvedValue([]);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('workspace access tab', () => {
  it('explains what a workspace collaborator can and cannot do', async () => {
    await mount();
    expect(text()).toContain('What they can and cannot do');
    expect(text()).toContain('never see your wallet, balance, withdrawals, transactions, payouts or payment methods');
    expect(text()).toContain('cannot invite or remove other collaborators');
    expect(text()).toContain('You have not invited anyone yet');
    expect(text()).toContain('Invite a collaborator');
  });

  it('asks for an email only: no Find photographer step, and no need for an account', async () => {
    await mount();
    expect(text()).not.toContain('Find photographer');
    expect(text()).toContain('They do not need a Connekyt account');
    expect(byText('Email invitation')).toBeTruthy();
  });

  it('shows when a collaborator was last active, and what they did by name for the owner', async () => {
    api.listSentInvitations.mockResolvedValue([
      inv({ id: 'b', status: 'ACCEPTED', role: 'COLLABORATOR', lastActiveAt: '2026-11-03T10:00:00' }),
      inv({ id: 'c', status: 'ACCEPTED', role: 'COLLABORATOR', invitee: person('p2', 'Chantal Ineza'), lastActiveAt: null }),
    ]);
    api.listWorkspaceActivity.mockResolvedValue([
      { id: 'e1', at: '2026-11-03T10:00:00', actor: 'Eric Mugisha', outcome: 'done', method: 'POST', what: 'POST photographer/bookings/:id/accept', status: 200, summary: 'by Eric Mugisha for Aline Uwase' },
      { id: 'e2', at: '2026-11-03T10:05:00', actor: 'Eric Mugisha', outcome: 'refused', method: 'GET', what: 'GET wallet/me', status: 403, summary: 'by Eric Mugisha for Aline Uwase' },
    ]);
    await mount();
    expect(text()).toContain('Last active');
    expect(text()).toContain('Not active yet');
    expect(api.listWorkspaceActivity).not.toHaveBeenCalled();
    await click(byText('Show'));
    expect(text()).toContain('by Eric Mugisha for Aline Uwase');
    expect(text()).toContain('POST photographer/bookings/:id/accept');
    expect(text()).toContain('refused');
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

  it('emails an invitation to any address, once, and clears the form', async () => {
    api.sendInvitationByEmail.mockResolvedValue(inv({ id: 'n', role: 'COLLABORATOR', invitee: { id: null, name: 'grace@example.com', registered: false } }));
    await mount();
    await type('ws-email', 'grace@example.com');
    await type('ws-note', 'Weddings in June');
    // Two quick submits make one request.
    await act(async () => {
      const form = host.querySelector('form')!;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(api.sendInvitationByEmail).toHaveBeenCalledTimes(1);
    expect(api.sendInvitationByEmail).toHaveBeenCalledWith('grace@example.com', 'Weddings in June');
    expect(text()).toContain('Invitation emailed to grace@example.com');
    expect(text()).toContain('expires in 7 days');
    expect((host.querySelector('#ws-email') as HTMLInputElement).value).toBe('');
  });

  it('says plainly when the server refuses an invitation, and does not claim it was sent', async () => {
    api.sendInvitationByEmail.mockRejectedValue(new Error('An invitation to this email is already waiting. Use Resend to send it again.'));
    await mount();
    await type('ws-email', 'grace@example.com');
    await submit();
    expect(text()).toContain('already waiting');
    expect(text()).not.toContain('Invitation emailed to');
    // What was typed stays, so it can be corrected.
    expect((host.querySelector('#ws-email') as HTMLInputElement).value).toBe('grace@example.com');
  });

  it('lets the invited photographer accept, once, and open the workspace', async () => {
    api.listReceivedInvitations.mockResolvedValueOnce([inv({ id: 'r1', status: 'PENDING' })]);
    api.answerInvitation.mockResolvedValue(inv({ id: 'r1', status: 'ACCEPTED' }));
    await mount();
    expect(text()).toContain('Invitations for you');
    expect(text()).toContain("Aline Uwase's workspace");
    expect(text()).toContain('Money, the wallet and account settings stay with them');
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
