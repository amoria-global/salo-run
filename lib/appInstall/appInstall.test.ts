import { describe, expect, it } from 'vitest';
import { APP_STORE_URL, PLAY_STORE_URL, appDeepLinkFor, dismissUntil, isWizardRoute, shouldShowWizard, storeUrlFor } from './appInstall';

const q = (s = '') => new URLSearchParams(s);
const base = { platform: 'android' as const, pathname: '/user/photographer/collaborate/join/tok123', search: q(), now: 1_000_000, dismissedUntil: null, standalone: false };

describe('the dashboard get-the-app wizard', () => {
  it('shows only on a collaboration invite', () => {
    expect(isWizardRoute('/user/photographer/collaborate/join/tok123')).toBe(true);
    for (const p of ['/', '/user/photographer/collaborate', '/user/photographer/events', '/user/client/gallery', '/user/auth/login']) expect(isWizardRoute(p)).toBe(false);
  });
  it('shows to a phone, never to a desktop or an installed web app, and respects the switches and a dismissal', () => {
    expect(shouldShowWizard(base)).toBe(true);
    expect(shouldShowWizard({ ...base, platform: null })).toBe(false);
    expect(shouldShowWizard({ ...base, standalone: true })).toBe(false);
    expect(shouldShowWizard({ ...base, search: q('noapp=1') })).toBe(false);
    expect(shouldShowWizard({ ...base, dismissedUntil: dismissUntil(base.now) })).toBe(false);
    expect(shouldShowWizard({ ...base, search: q('app=1'), dismissedUntil: dismissUntil(base.now) })).toBe(true);
  });
  it('opens the invite in the app, and tags and codes the Google Play link', () => {
    expect(appDeepLinkFor('/user/photographer/collaborate/join/tok123')).toBe('connekt://collaborate/join/tok123');
    expect(appDeepLinkFor('/somewhere')).toBe('connekt://');
    expect(storeUrlFor('ios', 'ABCDEFGHJK')).toBe(APP_STORE_URL);
    expect(storeUrlFor('android')).toContain(PLAY_STORE_URL);
    expect(decodeURIComponent(storeUrlFor('android', 'ABCDEFGHJK'))).toContain('&dl=ABCDEFGHJK');
  });
});
