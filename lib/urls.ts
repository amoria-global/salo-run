/**
 * Centralized URL configuration.
 * All cross-app URLs should use these helpers instead of hardcoding domains.
 */

/** The landing/public-facing app URL (connekt.app in production) */
export function getLandingUrl(): string {
  const url = process.env.NEXT_PUBLIC_LANDING_URL;
  if (!url) {
    console.warn('[config] NEXT_PUBLIC_LANDING_URL is not set');
    return '';
  }
  return url.replace(/\/+$/, '');
}

/** This dashboard app's own public URL */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.warn('[config] NEXT_PUBLIC_APP_URL is not set');
    return '';
  }
  return url.replace(/\/+$/, '');
}

/** Build a login redirect URL on the landing app */
export function getLoginUrl(params?: { returnUrl?: string; sessionExpired?: boolean }): string {
  const base = `${getLandingUrl()}/user/auth/login`;
  if (!params?.returnUrl && !params?.sessionExpired) return base;
  const url = new URL(base);
  if (params.returnUrl) url.searchParams.set('returnUrl', params.returnUrl);
  if (params.sessionExpired) url.searchParams.set('session_expired', 'true');
  return url.toString();
}

/** Build an event share link on the landing app */
export function getEventShareLink(eventId: string, hostId?: string): string {
  const base = `${getLandingUrl()}/user/event/${eventId}`;
  return hostId ? `${base}?hostId=${hostId}` : base;
}

/** Build a gallery share link on the landing app */
export function getGalleryShareLink(albumId: string): string {
  return `${getLandingUrl()}/gallery/${albumId}`;
}

/** Build a find-my-photos link on the landing app */
export function getFindMyPhotosLink(code: string): string {
  return `${getLandingUrl()}/find-my-photos?code=${code}`;
}

/** Build a photographer invite link on the landing app */
export function getPhotographerInviteLink(userId: string): string {
  return `${getLandingUrl()}/invite/photographer/${userId}`;
}

/** Build a photographer registration invite link */
export function getPhotographerRegisterLink(): string {
  return `${getLandingUrl()}/register/photographer?ref=invite`;
}

/** Build the donations page URL (on this dashboard) */
export function getDonationsPageUrl(): string {
  return `${getAppUrl()}/user/donations`;
}
