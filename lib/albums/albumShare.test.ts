import { describe, it, expect } from 'vitest';
import { albumQrFileName, albumShareUrl } from './albumShare';

describe('albumShareUrl', () => {
  it('uses the invite code for a paid or event album', () => {
    expect(albumShareUrl({ inviteCode: 'ALB1234ABCD' })).toBe('https://connekyt.com/user/find-my-photos?code=ALB1234ABCD');
  });
  it('uses the access code for a free album', () => {
    expect(albumShareUrl({ isFreeAlbum: true, accessCode: '482913', inviteCode: 'ALB1234ABCD' })).toBe('https://connekyt.com/user/find-my-photos?code=482913');
  });
  it('falls back to the invite code when a free album has no access code', () => {
    expect(albumShareUrl({ isFreeAlbum: true, inviteCode: 'ALB1234ABCD' })).toContain('code=ALB1234ABCD');
  });
  it('offers no link without a code, so a broken one is never shown', () => {
    expect(albumShareUrl({})).toBeNull();
    expect(albumShareUrl({ inviteCode: '' })).toBeNull();
  });
  it('never carries an email address', () => {
    expect(albumShareUrl({ isFreeAlbum: true, accessCode: '482913' })).not.toContain('@');
  });
});

describe('albumQrFileName', () => {
  it('keeps the file name safe', () => {
    expect(albumQrFileName('a1b2/../c3')).toBe('connekyt-album-qr-a1b2c3.png');
  });
});
