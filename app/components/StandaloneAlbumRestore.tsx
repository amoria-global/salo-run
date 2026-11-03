"use client";
import React, { useEffect, useState } from 'react';
import ArchiveRestoreFlow from './ArchiveRestoreFlow';
import EventConfirmModal from './EventConfirmModal';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

/**
 * Restoring an archived standalone (PAID or FREE) album from the photographer's gallery. Asks the server what the
 * restore costs, then runs the same confirm-then-pay flow as an event album. If the price cannot be loaded it says
 * why instead of opening a payment with no price.
 */
interface Props {
  album: { id: string; title: string; lockedAt?: string | null };
  colors: { bgCard: string; borderPrimary: string; textPrimary: string; textSecondary: string };
  actualTheme: string;
  onClose: () => void;
  onRestored: () => void;
}

type Quote = { fee: number; currency: string; lockedAt: string | null };

const StandaloneAlbumRestore: React.FC<Props> = ({ album, colors, actualTheme, onClose, onRestored }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/albums/${encodeURIComponent(album.id)}/restore-quote`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (json?.action === 1 && json.data) {
          setQuote({ fee: Number(json.data.fee), currency: String(json.data.currency || ''), lockedAt: json.data.lockedAt || album.lockedAt || null });
        } else {
          setError(json?.message || 'The restore price could not be loaded. Please try again.');
        }
      } catch {
        if (!cancelled) setError('The restore price could not be loaded. Check your connection and try again.');
      }
    })();
    return () => { cancelled = true; };
  }, [album.id, album.lockedAt]);

  if (error) {
    return (
      <EventConfirmModal
        tone="warning"
        icon="bi-archive-fill"
        eyebrow="Archived album"
        title="Cannot restore right now"
        highlight={album.title}
        intro={error}
        colors={colors}
        actualTheme={actualTheme}
        onClose={onClose}
        closeLabel="Close"
        fullWidthClose
      />
    );
  }
  if (!quote) return null;

  return (
    <ArchiveRestoreFlow
      album={{ id: album.id, title: album.title, galleryId: album.id, lockedAt: quote.lockedAt, archiveFee: quote.fee, archiveCurrency: quote.currency }}
      colors={colors}
      actualTheme={actualTheme}
      onClose={onClose}
      onRestored={onRestored}
    />
  );
};

export default StandaloneAlbumRestore;
