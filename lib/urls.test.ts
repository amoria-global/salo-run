import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLandingUrl, getAppUrl, getLoginUrl, getEventShareLink, getGalleryShareLink, getEventQrLink } from './urls';

/**
 * The first test in this repo (CONN-TEST-2).
 *
 * getLoginUrl is where an expired session sends the user, so it is squarely in
 * the auth path this epic is about: if `session_expired` is dropped, the
 * landing page cannot explain why the user is suddenly signed out, and if
 * `returnUrl` is dropped they lose their place. Both are easy to break while
 * refactoring and invisible to a type check.
 *
 * These read process.env, so each test sets it explicitly rather than relying
 * on whatever .env the runner happened to load.
 */
const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_LANDING_URL = 'https://connekyt.com';
  process.env.NEXT_PUBLIC_APP_URL = 'https://dashboard.connekyt.com';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe('getLandingUrl / getAppUrl', () => {
  it('strips trailing slashes so callers can concatenate safely', () => {
    process.env.NEXT_PUBLIC_LANDING_URL = 'https://connekyt.com///';
    // Without this, every derived link would contain a double slash.
    expect(getLandingUrl()).toBe('https://connekyt.com');
  });

  it('returns an empty string and warns when unset, rather than "undefined/..."', () => {
    delete process.env.NEXT_PUBLIC_LANDING_URL;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getLandingUrl()).toBe('');
    expect(warn).toHaveBeenCalled();
  });

  it('keeps the two app URLs separate', () => {
    // They are different deployments; conflating them sends signed-in users to
    // the public site and anonymous visitors to the dashboard.
    expect(getAppUrl()).toBe('https://dashboard.connekyt.com');
    expect(getLandingUrl()).not.toBe(getAppUrl());
  });
});

describe('getLoginUrl', () => {
  it('is a bare login URL when nothing is asked of it', () => {
    expect(getLoginUrl()).toBe('https://connekyt.com/user/auth/login');
    expect(getLoginUrl({})).toBe('https://connekyt.com/user/auth/login');
  });

  it('carries returnUrl so the user lands back where they were', () => {
    const url = new URL(getLoginUrl({ returnUrl: '/user/client/profile' }));
    expect(url.searchParams.get('returnUrl')).toBe('/user/client/profile');
  });

  it('flags an expired session so the login page can say why', () => {
    const url = new URL(getLoginUrl({ sessionExpired: true }));
    expect(url.searchParams.get('session_expired')).toBe('true');
  });

  it('carries both at once', () => {
    const url = new URL(getLoginUrl({ returnUrl: '/user/client/wallet', sessionExpired: true }));
    expect(url.searchParams.get('returnUrl')).toBe('/user/client/wallet');
    expect(url.searchParams.get('session_expired')).toBe('true');
  });

  it('encodes a returnUrl that itself has a query string', () => {
    // Naive concatenation would truncate at the inner "?" and drop the rest.
    const url = new URL(getLoginUrl({ returnUrl: '/user/client/photos?album=42&page=2' }));
    expect(url.searchParams.get('returnUrl')).toBe('/user/client/photos?album=42&page=2');
  });
});

describe('share links', () => {
  it('builds an event link, with and without a host', () => {
    expect(getEventShareLink('e1')).toBe('https://connekyt.com/user/event/e1');
    expect(getEventShareLink('e1', 'h9')).toBe('https://connekyt.com/user/event/e1?hostId=h9');
  });

  it('builds a gallery link', () => {
    expect(getGalleryShareLink('a7')).toBe('https://connekyt.com/gallery/a7');
  });
});

describe('getEventQrLink', () => {
  it('points at the landing view-event path and flags the visit as a QR scan', () => {
    expect(getEventQrLink('evt-1')).toBe('https://connekyt.com/user/events/view-event?id=evt-1&src=qr');
  });

  it('encodes the id so an odd value cannot break out of the query', () => {
    expect(getEventQrLink('a&b=c')).toBe('https://connekyt.com/user/events/view-event?id=a%26b%3Dc&src=qr');
  });
});
