'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { albumQrFileName, albumShareUrl, type AlbumShareCodes } from '@/lib/albums/albumShare';
import { brandedQrPngDataUrl } from '@/lib/qr/brandedQr';

/**
 * Share options for an album that is live on Find My Photos: the link, a branded QR code to scan or print, and a PNG
 * download. The mobile app offers the same three (features/gallery/AlbumShareSheet), so a photographer finds the same
 * thing on either platform.
 */
export function AlbumShareCard({ albumId, title, album }: { albumId: string; title: string; album: AlbumShareCodes }) {
  const { colors } = useTheme();
  const link = albumShareUrl(album);
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setQr(null);
    if (link) brandedQrPngDataUrl(link, { width: 360 }).then((u) => live && setQr(u)).catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [link]);

  if (!link) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Link copied.');
    } catch {
      setNote('Could not copy. Select the link and copy it.');
    }
  };
  const onDownload = async () => {
    try {
      const url = await brandedQrPngDataUrl(link, { width: 960 });
      const a = document.createElement('a');
      a.href = url;
      a.download = albumQrFileName(albumId);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setNote('QR saved as a PNG.');
    } catch {
      setNote('Could not save the QR. Please try again.');
    }
  };

  const btn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, padding: '0 0.9rem',
    borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${colors.borderPrimary}`, background: colors.bgCard, color: colors.textPrimary,
  } as const;

  return (
    <section aria-label={`Share ${title}`} style={{ border: `1px solid ${colors.borderPrimary}`, borderRadius: 14, padding: '0.9rem', marginBottom: '1rem', background: colors.bgTertiary }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        Share with attendees
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 132, height: 132, borderRadius: 12, background: '#fff', padding: 6, flexShrink: 0, border: `1px solid ${colors.borderPrimary}` }}>
          {qr ? (
            // A data: URL made in the browser; next/image has nothing to optimise here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR code for ${title} on Find My Photos`} style={{ width: '100%', height: '100%', display: 'block' }} />
          ) : null}
        </div>
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, lineHeight: 1.5 }}>
            Attendees scan the code or open the link, take a selfie and find their photos.
          </div>
          <div style={{ fontSize: '0.76rem', color: colors.textPrimary, wordBreak: 'break-all' }}>{link}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={btn} onClick={onCopy}><i className="bi bi-link-45deg" aria-hidden /> Copy link</button>
            <button type="button" style={btn} onClick={onDownload}><i className="bi bi-download" aria-hidden /> Download QR</button>
          </div>
        </div>
      </div>
      <div role="status" aria-live="polite" style={{ minHeight: 16, marginTop: 6, fontSize: '0.74rem', color: colors.textSecondary }}>{note}</div>
    </section>
  );
}
