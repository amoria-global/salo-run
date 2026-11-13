/**
 * The "get the app" wizard on the dashboard. The only link the dashboard shares with someone who may not have the app is
 * a photographer's collaboration invite (/user/photographer/collaborate/join/<token>), so that is the only page it shows
 * on. The same rules as the website's wizard (connekyt.com, lib/appInstall): phones only, a dismissal lasts 3 days, the
 * Google Play link carries the saved destination, and the saved destination is a path the backend accepts.
 */
export type MobilePlatform = 'android' | 'ios' | null;

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amoria.connekyt.app';
export const APP_STORE_URL = 'https://apps.apple.com/app/id6811336076';

export const DISMISS_KEY = 'connekyt.appWizard.dismissedUntil';
export const PENDING_INSTALL_KEY = 'connekyt.appWizard.pendingInstall';
export const DISMISS_DAYS = 3;
export const PENDING_INSTALL_HOURS = 24;

export function detectMobilePlatform(): MobilePlatform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  return null;
}

const COLLAB_JOIN = /^\/user\/photographer\/collaborate\/join\/([^/]+)\/?$/;

export function isWizardRoute(pathname: string): boolean {
  return COLLAB_JOIN.test(pathname);
}

export function appDeepLinkFor(pathname: string): string {
  const m = pathname.match(COLLAB_JOIN);
  return m && /^[A-Za-z0-9_-]{1,128}$/.test(decodeURIComponent(m[1])) ? `connekt://collaborate/join/${m[1]}` : 'connekt://';
}

export function storeUrlFor(platform: Exclude<MobilePlatform, null>, code: string | null = null): string {
  if (platform === 'ios') return APP_STORE_URL;
  const referrer = `utm_source=connekyt_dashboard&utm_medium=share_link&utm_campaign=app_install_wizard${code ? `&dl=${code}` : ''}`;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
}

export function shouldShowWizard(input: {
  platform: MobilePlatform;
  pathname: string;
  search: URLSearchParams;
  now: number;
  dismissedUntil: number | null;
  standalone: boolean;
}): boolean {
  const { platform, pathname, search, now, dismissedUntil, standalone } = input;
  if (!platform || standalone || !isWizardRoute(pathname)) return false;
  if (search.get('noapp') === '1' || search.get('app') === '0') return false;
  if (search.get('app') === '1') return true;
  return !(dismissedUntil !== null && dismissedUntil > now);
}

export const dismissUntil = (now: number): number => now + DISMISS_DAYS * 24 * 3600 * 1000;

export function isPendingInstall(at: number | null, now: number): boolean {
  return at !== null && now - at < PENDING_INSTALL_HOURS * 3600 * 1000;
}
