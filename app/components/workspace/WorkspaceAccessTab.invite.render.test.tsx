import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  listSentInvitations: vi.fn(),
  listReceivedInvitations: vi.fn(),
  lookupPhotographer: vi.fn(),
  sendInvitation: vi.fn(),
  sendInvitationByEmail: vi.fn(),
  getInvitePreview: vi.fn(),
  resendInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
  revokeMembership: vi.fn(),
  answerInvitation: vi.fn(),
  leaveWorkspace: vi.fn(),
}));
const ws = vi.hoisted(() => ({ switchTo: vi.fn(async () => {}), refresh: vi.fn(async () => {}) }));

vi.mock('@/app/lib/APIs/workspaces', () => api);
vi.mock('@/app/providers/WorkspaceProvider', () => ({ useWorkspace: () => ({ ...ws, workspaces: [], active: null, isShared: false, loading: false }) }));
vi.mock('@/app/providers/AuthProvider', () => ({ dashboardAuthFetch: vi.fn(), useDashboardAuth: () => ({}) }));
vi.mock('@/lib/api', () => ({ getApiUrl: () => 'https://api.test' }));

import WorkspaceAccessTab from './WorkspaceAccessTab';

/**
 * Inviting someone who has no account yet, and opening an invitation from its link: what the owner sees when the
 * address has no account, how an emailed invitation reads, and what the person who opened the link is offered in each
 * case (accept and open, already joined, ended, sent to another address, no longer open, could not be read).
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ID = '3f2a9c1e-5b7d-4c8e-9a10-0b1c2d3e4f50';
const person = (id: string | null, name: string, extra: Record<string, unknown> = {}) => ({ id, name, customerType: 'Photographer', profilePicture: null, ...extra });
const inv = (o: Record<string, unknown> = {}) => ({
  id: ID, status: 'PENDING', owner: person('o1', 'Aline Uwase'), invitee: person('p1', 'Eric Mugisha'),
  note: null, createdAt: '2026-10-20T09:00:00', expiresAt: '2026-11-03T09:00:00', delivery: 'in_app', ...o,
});

let host: HTMLDivElement;
let root: Root;

async function mount(props: { inviteId?: string | null; onInviteHandled?: () => void } = {}) {
  await act(async () => { root.render(<WorkspaceAccessTab {...props} />); });
  await act(async () => {});
  await act(async () => {});
}
const text = () => host.textContent || '';
const buttons = () => Array.from(host.querySelectorAll('button'));
const byText = (t: string) => buttons().find((b) => (b.textContent || '').trim() === t);
const byLabel = (l: string) => buttons().find((b) => b.getAttribute('aria-label') === l);
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
const submit = async () => {
  await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
};
const focusCard = () => host.querySelector('[data-testid="invite-focus"]');

beforeEach(() => {
  Object.values(api).forEach((m) => m.mockReset());
  ws.switchTo.mockClear();
  api.listSentInvitations.mockResolvedValue([]);
  api.listReceivedInvitations.mockResolvedValue([]);
  api.getInvitePreview.mockResolvedValue(null);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('inviting an address with no account yet', () => {
  const NEW = person(null, 'new@example.com', { registered: false, email: 'new@example.com' });

  it('says no account uses it, that they will be emailed, and offers to email the invitation', async () => {
    api.lookupPhotographer.mockResolvedValue(NEW);
    await mount();
    await type('ws-email', 'new@example.com');
    await submit();
    expect(api.lookupPhotographer).toHaveBeenCalledWith('new@example.com');
    expect(text()).toContain('No account uses this address yet');
    expect(text()).toContain('create a photographer account with this exact address');
    expect(byText('Email invitation')).toBeTruthy();
    expect(byText('Send invitation')).toBeUndefined();
  });

  it('emails it once by address, not by account, and says so', async () => {
    api.lookupPhotographer.mockResolvedValue(NEW);
    api.sendInvitationByEmail.mockResolvedValue(inv({ id: 'n', invitee: NEW, delivery: 'email' }));
    await mount();
    await type('ws-email', 'new@example.com');
    await submit();
    await click(byText('Email invitation'));
    expect(api.sendInvitationByEmail).toHaveBeenCalledTimes(1);
    expect(api.sendInvitationByEmail).toHaveBeenCalledWith('new@example.com', undefined);
    expect(api.sendInvitation).not.toHaveBeenCalled();
    expect(text()).toContain('Invitation emailed to new@example.com');
    expect(text()).toContain('create an account with that address first');
  });

  it('keeps an account holder on the ordinary in-app invitation', async () => {
    api.lookupPhotographer.mockResolvedValue(person('p9', 'Grace Mutoni', { registered: true, email: 'grace@example.com' }));
    api.sendInvitation.mockResolvedValue(inv({ id: 'n', invitee: person('p9', 'Grace Mutoni') }));
    await mount();
    await type('ws-email', 'grace@example.com');
    await submit();
    expect(text()).toContain('Grace Mutoni');
    await click(byText('Send invitation'));
    expect(api.sendInvitation).toHaveBeenCalledWith('p9', undefined);
    expect(api.sendInvitationByEmail).not.toHaveBeenCalled();
  });

  it('shows an emailed invitation as waiting for an account, with emailing it again as the move', async () => {
    api.listSentInvitations.mockResolvedValue([inv({ id: 'e', invitee: NEW, delivery: 'email' })]);
    await mount();
    expect(text()).toContain('new@example.com');
    expect(text()).toContain('No account yet');
    expect(text()).toContain('Emailed. Waiting for them to create an account and answer.');
    expect(byLabel('Email again: new@example.com')).toBeTruthy();
    expect(byLabel('Cancel: new@example.com')).toBeTruthy();
  });

  it('refuses to send again when the server says it was just emailed, and says why', async () => {
    api.listSentInvitations.mockResolvedValue([inv({ id: 'e', invitee: NEW, delivery: 'email' })]);
    api.resendInvitation.mockRejectedValue(new Error('This invitation was just emailed. Try again in a few minutes.'));
    await mount();
    await click(byLabel('Email again: new@example.com'));
    expect(text()).toContain('just emailed');
  });
});

describe('opening an invitation from its link', () => {
  it('puts a waiting invitation first and accepts it and opens the workspace in one step', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv()]);
    api.answerInvitation.mockResolvedValue(inv({ status: 'ACCEPTED' }));
    const handled = vi.fn();
    await mount({ inviteId: ID, onInviteHandled: handled });
    expect(focusCard()).not.toBeNull();
    expect(text()).toContain('Your invitation');
    expect(text()).toContain('Aline Uwase invited you to work in their workspace');
    // It is on the card, not listed a second time under "Invitations for you".
    expect(text()).not.toContain('Invitations for you');
    await click(byText('Accept and open workspace'));
    expect(api.answerInvitation).toHaveBeenCalledWith(ID, true);
    expect(handled).toHaveBeenCalledTimes(1);
    expect(ws.switchTo).toHaveBeenCalledWith('o1');
  });

  it('can be declined from the card, and does not open anything', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv()]);
    api.answerInvitation.mockResolvedValue(inv({ status: 'DECLINED' }));
    const handled = vi.fn();
    await mount({ inviteId: ID, onInviteHandled: handled });
    await click(byText('Decline'));
    expect(api.answerInvitation).toHaveBeenCalledWith(ID, false);
    expect(ws.switchTo).not.toHaveBeenCalled();
    expect(handled).toHaveBeenCalled();
  });

  it('does not accept twice on a double tap', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv()]);
    let release!: () => void;
    api.answerInvitation.mockImplementation(() => new Promise((r) => { release = () => r(inv({ status: 'ACCEPTED' })); }));
    await mount({ inviteId: ID });
    const accept = byText('Accept and open workspace')!;
    await act(async () => {
      accept.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      accept.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    release();
    await act(async () => {});
    expect(api.answerInvitation).toHaveBeenCalledTimes(1);
  });

  it('shows a failed accept as an error and does not open the workspace', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv()]);
    api.answerInvitation.mockRejectedValue(new Error('This invitation has expired. Ask for a new one.'));
    await mount({ inviteId: ID });
    await click(byText('Accept and open workspace'));
    expect(text()).toContain('has expired');
    expect(ws.switchTo).not.toHaveBeenCalled();
  });

  it('offers to open the workspace when it is already accepted', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv({ status: 'ACCEPTED' })]);
    await mount({ inviteId: ID });
    expect(text()).toContain("You already work in Aline Uwase's workspace");
    await click(byText('Open workspace'));
    expect(ws.switchTo).toHaveBeenCalledWith('o1');
  });

  it('says an ended invitation ended, and that nothing can be accepted', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv({ status: 'REVOKED' })]);
    await mount({ inviteId: ID });
    expect(text()).toContain('is removed');
    expect(byText('Accept and open workspace')).toBeUndefined();
  });

  it('says it was sent to another address, without printing that address in full, when this account cannot answer it', async () => {
    api.getInvitePreview.mockResolvedValue({ found: true, open: true, status: 'PENDING', ownerName: 'Aline Uwase', email: 'intended.person@example.com', account: 'none' });
    await mount({ inviteId: ID });
    expect(api.getInvitePreview).toHaveBeenCalledWith(ID);
    expect(text()).toContain('sent to i•••@example.com');
    expect(text()).toContain('Sign out, then sign in or create an account with that address');
    expect(text()).not.toContain('intended.person');
    expect(byText('Accept and open workspace')).toBeUndefined();
  });

  it('says it is no longer open when the preview says so', async () => {
    api.getInvitePreview.mockResolvedValue({ found: true, open: false, status: 'CANCELLED' });
    await mount({ inviteId: ID });
    expect(text()).toContain('no longer open');
  });

  it('falls back to a plain message when the preview cannot be read', async () => {
    api.getInvitePreview.mockResolvedValue(null);
    await mount({ inviteId: ID });
    expect(text()).toContain('We could not open this invitation');
  });

  it('does not ask for a preview when the invitation is this account\'s own', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv()]);
    await mount({ inviteId: ID });
    expect(api.getInvitePreview).not.toHaveBeenCalled();
  });

  it('shows nothing extra without an invitation link', async () => {
    api.listReceivedInvitations.mockResolvedValue([inv()]);
    await mount();
    expect(focusCard()).toBeNull();
    expect(text()).toContain('Invitations for you');
    expect(api.getInvitePreview).not.toHaveBeenCalled();
  });

  it('can be dismissed', async () => {
    api.getInvitePreview.mockResolvedValue({ found: false, open: false });
    const handled = vi.fn();
    await mount({ inviteId: ID, onInviteHandled: handled });
    await click(byText('Dismiss'));
    expect(handled).toHaveBeenCalledTimes(1);
  });
});
