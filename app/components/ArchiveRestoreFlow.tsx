"use client";
import React, { useState } from 'react';
import EventConfirmModal from './EventConfirmModal';
import PayNowModal, { type Payment } from './UnlockModal';
import { archivedMessage, archiveFeeText, restoreDetail } from '@/lib/archivedCopy';

/**
 * Restoring an archived album: first a confirmation that states the date it was archived, the price and what the owner
 * gets, then the payment sheet the dashboard already uses for archive unlocks. The price is only shown here; the server
 * sets what is charged. Nothing is paid until the owner confirms.
 */
export interface ArchivedAlbum {
  id: string;
  title: string;
  /** The event the archive payment is made against. */
  eventId?: string | null;
  photographer?: string;
  lockedAt?: string | null;
  archiveFee?: number | null;
  archiveCurrency?: string | null;
}

interface Props {
  album: ArchivedAlbum;
  colors: { bgCard: string; borderPrimary: string; textPrimary: string; textSecondary: string };
  actualTheme: string;
  onClose: () => void;
  /** Called after the payment went through, so the page can reload the album. */
  onRestored: () => void;
}

const ArchiveRestoreFlow: React.FC<Props> = ({ album, colors, actualTheme, onClose, onRestored }) => {
  const [paying, setPaying] = useState(false);
  const price = archiveFeeText(album.archiveFee, album.archiveCurrency);

  if (paying) {
    const payment: Payment = {
      id: 0,
      eventId: album.eventId ?? undefined,
      date: '',
      eventName: album.title,
      eventType: 'Archive Unlock',
      photographerName: album.photographer ?? '',
      photographerImage: '',
      method: '',
      amount: price ?? '',
      amountNum: album.archiveFee ?? 0,
      paidAmount: 0,
      status: 'pending',
      invoiceNumber: '',
    };
    return <PayNowModal isOpen onClose={onClose} payment={payment} onPaymentSuccess={onRestored} />;
  }

  return (
    <EventConfirmModal
      tone="info"
      icon="bi-archive-fill"
      eyebrow="Archived album"
      title="Restore this album?"
      highlight={album.title}
      intro={archivedMessage({ lockedAt: album.lockedAt, price })}
      detail={album.eventId ? restoreDetail(price) : 'This album cannot be restored online right now. Please contact support and we will restore it for you.'}
      colors={colors}
      actualTheme={actualTheme}
      onClose={onClose}
      closeLabel={album.eventId ? 'Not now' : 'Close'}
      fullWidthClose={!album.eventId}
      primary={
        album.eventId
          ? { label: price ? `Restore for ${price}` : 'Restore album', icon: 'bi-arrow-counterclockwise', onClick: () => setPaying(true) }
          : undefined
      }
    />
  );
};

export default ArchiveRestoreFlow;
