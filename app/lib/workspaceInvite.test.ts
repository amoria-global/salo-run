import { describe, expect, it } from 'vitest';
import type { InvitePreview, WorkspaceInvitation } from './APIs/workspaces';
import { inviteFocus, inviteIdFromParam, maskEmail, ownerActionLabel, ownerMeaning } from './workspaceStatus';

/**
 * The pure rules behind the invitation link: which id the address names, what the link means for the person who
 * opened it, and how an invitation to an address with no account yet reads to the owner who sent it.
 */
const ID = '3f2a9c1e-5b7d-4c8e-9a10-0b1c2d3e4f50';

const person = (id: string | null, name: string, extra: Record<string, unknown> = {}) => ({ id, name, customerType: 'Photographer', profilePicture: null, ...extra });
const inv = (o: Partial<WorkspaceInvitation> & Record<string, unknown> = {}): WorkspaceInvitation => ({
  id: ID, status: 'PENDING', owner: person('o1', 'Aline Uwase') as WorkspaceInvitation['owner'], invitee: person('p1', 'Eric Mugisha') as WorkspaceInvitation['invitee'],
  createdAt: '2026-10-20T09:00:00', expiresAt: '2026-11-03T09:00:00', ...o,
}) as WorkspaceInvitation;

describe('inviteIdFromParam', () => {
  it('accepts an id, trims it and lower-cases it', () => {
    expect(inviteIdFromParam(`  ${ID.toUpperCase()} `)).toBe(ID);
  });
  it('rejects anything that is not an id', () => {
    for (const bad of [null, undefined, '', '   ', 'abc', ID + 'x', '../../etc/passwd', `${ID}&x=1`]) expect(inviteIdFromParam(bad as string)).toBeNull();
  });
});

describe('maskEmail', () => {
  it('keeps the first letter and the domain', () => {
    expect(maskEmail('eric.mugisha@example.com')).toBe('e•••@example.com');
  });
  it('says something sensible when there is no address', () => {
    expect(maskEmail(null)).toBe('another email address');
    expect(maskEmail('not-an-email')).toBe('another email address');
  });
});

describe('inviteFocus', () => {
  const preview = (o: Partial<InvitePreview>): InvitePreview => ({ found: true, open: true, status: 'PENDING', ownerName: 'Aline Uwase', email: 'eric@example.com', account: 'photographer', ...o });

  it('finds a waiting invitation among the account\'s own', () => {
    const f = inviteFocus([inv()], ID, null);
    expect(f.kind).toBe('pending');
  });
  it('recognises one already accepted, and says how another one ended', () => {
    expect(inviteFocus([inv({ status: 'ACCEPTED' })], ID, null).kind).toBe('accepted');
    const ended = inviteFocus([inv({ status: 'REVOKED' })], ID, null);
    expect(ended).toMatchObject({ kind: 'ended', label: 'removed' });
    expect(inviteFocus([inv({ status: 'EXPIRED' })], ID, null)).toMatchObject({ kind: 'ended', label: 'expired' });
  });
  it('says the invitation went to another address when it is open but not this account\'s', () => {
    const f = inviteFocus([inv({ id: 'someone-elses' })], ID, preview({}));
    expect(f).toEqual({ kind: 'mismatch', maskedEmail: 'e•••@example.com' });
  });
  it('says it is closed when the preview says it is finished or unknown', () => {
    expect(inviteFocus([], ID, preview({ open: false, status: 'CANCELLED' })).kind).toBe('closed');
    expect(inviteFocus([], ID, { found: false, open: false }).kind).toBe('closed');
  });
  it('falls back to a plain message when the preview could not be read', () => {
    expect(inviteFocus([], ID, null).kind).toBe('unavailable');
  });
  it('never exposes more than the masked address for another account\'s invitation', () => {
    const f = inviteFocus([], ID, preview({ email: 'secret.person@example.com', ownerName: 'Aline Uwase' }));
    expect(JSON.stringify(f)).not.toContain('secret.person');
    expect(JSON.stringify(f)).not.toContain('Aline');
  });
});

describe('an invitation to an address with no account yet, as the owner reads it', () => {
  const emailed = inv({ invitee: person(null, 'new@example.com', { registered: false, email: 'new@example.com' }) as WorkspaceInvitation['invitee'] });
  it('says it is waiting for them to create an account', () => {
    expect(ownerMeaning(emailed)).toBe('Emailed. Waiting for them to create an account and answer.');
    expect(ownerMeaning(inv())).toBe('Waiting for them to answer.');
  });
  it('only changes the wording while it is waiting', () => {
    expect(ownerMeaning({ ...emailed, status: 'CANCELLED' })).toBe('You cancelled it.');
    expect(ownerMeaning({ ...emailed, status: 'ACCEPTED' })).toBe('They can work in your workspace.');
  });
  it('calls sending it again emailing it again', () => {
    expect(ownerActionLabel('resend', emailed)).toBe('Email again');
    expect(ownerActionLabel('resend', inv())).toBe('Send again');
    expect(ownerActionLabel('cancel', emailed)).toBe('Cancel');
    expect(ownerActionLabel('revoke', emailed)).toBe('Remove access');
  });
});
