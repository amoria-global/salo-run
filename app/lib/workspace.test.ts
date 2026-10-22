import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  WORKSPACE_HEADER,
  getActiveWorkspaceId,
  isBlockedInSharedWorkspace,
  isPersonalCall,
  setActiveWorkspaceId,
  workspaceHeaders,
} from './workspace';
import { inviteeActions, ownerActions, shortDate, sortInvitations, statusView } from './workspaceStatus';

const OWNER = '3f2a9c1e-5b7d-4c8e-9a10-0b1c2d3e4f50';

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe('active workspace', () => {
  it('starts in the photographer own workspace', () => {
    expect(getActiveWorkspaceId()).toBeNull();
    expect(workspaceHeaders('https://api.test/api/remote/photographer/events')).toEqual({});
  });

  it('remembers a chosen workspace and forgets it again', () => {
    setActiveWorkspaceId(OWNER);
    expect(getActiveWorkspaceId()).toBe(OWNER);
    setActiveWorkspaceId(null);
    expect(getActiveWorkspaceId()).toBeNull();
  });

  it('ignores a stored value that is not a workspace id', () => {
    window.localStorage.setItem('connekyt:workspace', 'not-an-id');
    expect(getActiveWorkspaceId()).toBeNull();
    window.localStorage.setItem('connekyt:workspace', '<script>');
    expect(getActiveWorkspaceId()).toBeNull();
  });
});

describe('which calls carry the workspace', () => {
  beforeEach(() => setActiveWorkspaceId(OWNER));

  it('names the workspace on the work calls', () => {
    for (const path of ['/photographer/events', '/photographer/clients', '/photographer/bookings/b1/accept', '/customer/galleries', '/photographer/albums']) {
      expect(workspaceHeaders(`https://api.test/api/remote${path}`)).toEqual({ [WORKSPACE_HEADER]: OWNER });
    }
  });

  it('keeps calls about the signed-in person themself out of the workspace', () => {
    for (const path of [
      '/auth/refresh', '/public/events', '/customer/profile', '/customer/kyc/status', '/customer/totp/enable',
      '/customer/notifications', '/photographer/notifications/unread-count', '/photographer/workspaces/mine',
      '/photographer/profile-summary', '/team/me/permissions',
    ]) {
      expect(isPersonalCall(`https://api.test/api/remote${path}`)).toBe(true);
      expect(workspaceHeaders(`https://api.test/api/remote${path}`)).toEqual({});
    }
  });

  it('handles a bare path and a query string', () => {
    expect(workspaceHeaders('/api/remote/photographer/events?page=0')).toEqual({ [WORKSPACE_HEADER]: OWNER });
    expect(isPersonalCall('/api/remote/photographer/workspaces/sent?x=1')).toBe(true);
  });
});

describe('pages that do not exist in a shared workspace', () => {
  it('blocks money, account and notification pages and their sub pages', () => {
    for (const p of ['wallet', 'transaction', 'all-transactions', 'payroll-report', 'donate', 'preferences', 'profile', 'notifications', 'collaborate']) {
      expect(isBlockedInSharedWorkspace(`/user/photographer/${p}`)).toBe(true);
      expect(isBlockedInSharedWorkspace(`/user/photographer/${p}/anything`)).toBe(true);
    }
  });

  it('leaves the work pages open', () => {
    for (const p of ['/user/photographer/dashboard', '/user/photographer/events', '/user/photographer/events/e1', '/user/photographer/clients']) {
      expect(isBlockedInSharedWorkspace(p)).toBe(false);
    }
    expect(isBlockedInSharedWorkspace(null)).toBe(false);
  });

  it('does not block a path that merely starts with the same letters', () => {
    expect(isBlockedInSharedWorkspace('/user/photographer/walletish')).toBe(false);
  });
});

describe('invitation status rules', () => {
  it('offers the owner only moves that can work', () => {
    expect(ownerActions('PENDING')).toEqual(['resend', 'cancel']);
    expect(ownerActions('ACCEPTED')).toEqual(['revoke']);
    expect(ownerActions('DECLINED')).toEqual(['resend']);
    expect(ownerActions('EXPIRED')).toEqual(['resend']);
    expect(ownerActions('CANCELLED')).toEqual(['resend']);
    expect(ownerActions('REVOKED')).toEqual([]);
    expect(ownerActions('LEFT')).toEqual([]);
  });

  it('offers the invited photographer only moves that can work', () => {
    expect(inviteeActions('PENDING')).toEqual(['accept', 'decline']);
    expect(inviteeActions('ACCEPTED')).toEqual(['open', 'leave']);
    for (const s of ['DECLINED', 'CANCELLED', 'EXPIRED', 'REVOKED', 'LEFT'] as const) expect(inviteeActions(s)).toEqual([]);
  });

  it('words every status in plain terms', () => {
    expect(statusView('PENDING').label).toBe('Waiting');
    expect(statusView('ACCEPTED').tone).toBe('success');
    expect(statusView('REVOKED').meaning.invitee).toBe('Your access was removed.');
  });

  it('puts waiting then active invitations first, newest first within a group', () => {
    const sorted = sortInvitations([
      { status: 'DECLINED', createdAt: '2026-10-20T10:00:00' },
      { status: 'ACCEPTED', createdAt: '2026-10-01T10:00:00' },
      { status: 'PENDING', createdAt: '2026-10-10T10:00:00' },
      { status: 'PENDING', createdAt: '2026-10-21T10:00:00' },
    ]);
    expect(sorted.map((x) => x.status + x.createdAt.slice(8, 10))).toEqual(['PENDING21', 'PENDING10', 'ACCEPTED01', 'DECLINED20']);
  });

  it('formats dates the same everywhere and tolerates missing ones', () => {
    expect(shortDate('2026-10-22T09:30:00')).toBe('22 Oct 2026');
    expect(shortDate(null)).toBe('');
    expect(shortDate('nonsense')).toBe('');
  });
});
