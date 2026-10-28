/**
 * The buyer-facing link for an album on Find My Photos, and the file name of its QR.
 * The host is fixed because it is the one MailService bakes into the invitation email, and
 * NEXT_PUBLIC_LANDING_URL has rendered "undefined" on builds where it was not injected.
 * The mobile app builds the same link (features/gallery/albumShare.ts), so a QR saved on
 * either platform scans to the same place.
 *   free album : ?code=<accessCode>
 *   otherwise  : ?code=<inviteCode>
 * The code is the secret; no email rides along.
 */
export const ALBUM_SHARE_HOST = 'https://connekyt.com';

export type AlbumShareCodes = { isFreeAlbum?: boolean; accessCode?: string | null; inviteCode?: string | null };

/** The share link, or null when the album has no code yet so nobody is offered a broken link. */
export function albumShareUrl(album: AlbumShareCodes): string | null {
  const code = album.isFreeAlbum && album.accessCode ? album.accessCode : album.inviteCode;
  if (!code) return null;
  return `${ALBUM_SHARE_HOST}/user/find-my-photos?code=${encodeURIComponent(code)}`;
}

export function albumQrFileName(albumId: string): string {
  return `connekyt-album-qr-${albumId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24)}.png`;
}
