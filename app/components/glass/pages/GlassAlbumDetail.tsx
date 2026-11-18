'use client';

/**
 * Album detail (client and coordinator gallery) in Compact Glass. Behaviour is the classic page's (useAlbumDetail,
 * moved verbatim): restore an archived album through the existing ArchiveRestoreFlow, delete behind a confirmation,
 * the client's Create photobook and Request changes shortcuts, and the photo lightbox.
 */
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Lock, MessageSquareWarning, RotateCw, Trash2, Unlock, X } from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import ArchiveRestoreFlow from '@/app/components/ArchiveRestoreFlow';
import { archivedMessage, archiveFeeText } from '@/lib/archivedCopy';
import { formatDateShort, getPaymentStatusLabel, type AlbumDetailController } from '@/app/components/gallery/useAlbumDetail';
import { Money } from '../Money';
import { Avatar, Card, Chip, ConfirmDialog, EmptyState, ErrorState, RowsSkeleton } from '../ui';

type Ctl = AlbumDetailController;

export function Lightbox({ images, index, onClose, onPrev, onNext }: { images: { url: string; caption?: string | null }[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowLeft') onPrev(); else if (e.key === 'ArrowRight') onNext(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, onPrev, onNext]);
  const img = images[index];
  return (
    <div className="gad-lightbox" role="dialog" aria-modal="true" aria-label={t('Photo viewer')} onClick={onClose}>
      <div className="gad-lightbox-top" onClick={(e) => e.stopPropagation()}>
        <span className="g-num">{index + 1} / {images.length}</span>
        <button type="button" className="g-icon-btn gad-lightbox-btn" aria-label={t('Close')} onClick={onClose}><X size={20} aria-hidden /></button>
      </div>
      {images.length > 1 && <button type="button" className="g-icon-btn gad-lightbox-btn gad-prev" aria-label={t('Previous photo')} onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft size={22} aria-hidden /></button>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gad-lightbox-img" src={img.url} alt={img.caption || ''} onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && <button type="button" className="g-icon-btn gad-lightbox-btn gad-next" aria-label={t('Next photo')} onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight size={22} aria-hidden /></button>}
      {img.caption ? <p className="gad-caption" onClick={(e) => e.stopPropagation()}>{img.caption}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const { t } = useLanguage();
  return <div><dt>{t(label)}</dt><dd>{value}</dd></div>;
}

export default function GlassAlbumDetail({ ctl: c }: { ctl: Ctl }) {
  const { t } = useLanguage();
  const a = c.album;
  if (c.loading) return <div className="gp-page ged-page"><RowsSkeleton rows={3} height={160} /></div>;
  if (c.error || !a) {
    return (
      <div className="gp-page ged-page">
        <button type="button" className="g-btn g-btn-ghost ged-back" onClick={c.handleGoBack}><ArrowLeft size={16} aria-hidden /> {t('Back to gallery')}</button>
        {c.error ? <ErrorState message={c.error} onRetry={() => c.fetchAlbum()} /> : <EmptyState title="Album not found" body="The album you are looking for may have been removed or does not exist." />}
      </div>
    );
  }
  const expired = a.expiresAt ? new Date(a.expiresAt) < new Date() : false;
  return (
    <div className="gp-page ged-page">
      <button type="button" className="g-btn g-btn-ghost ged-back" onClick={c.handleGoBack}><ArrowLeft size={16} aria-hidden /> {t('Back to gallery')}</button>
      <Card className="ged-hero">
        <div className="ged-hero-body">
          <div className="ged-title-row">
            <h1 className="g-display gp-title">{a.title}</h1>
            {a.category ? <Chip tone="info">{t(a.category)}</Chip> : null}
            <Chip tone={a.isLocked ? 'pending' : 'success'}>{a.isLocked ? <Lock size={12} aria-hidden /> : <Unlock size={12} aria-hidden />} {t(a.isLocked ? 'Archived' : 'Unlocked')}</Chip>
          </div>
          {c.userRole === 'client' && (
            <div className="gev-actions">
              <button type="button" className="g-btn g-btn-primary" onClick={() => { window.location.href = `/user/client/gallery?tab=photobooks&albumId=${encodeURIComponent(a.id)}&create=1`; }}><BookOpen size={15} aria-hidden /> {t('Create photobook')}</button>
              <button type="button" className="g-btn g-btn-ghost" onClick={() => {
                window.location.href = a.eventId ? `/user/client/events?requestChanges=${encodeURIComponent(a.eventId)}` : `/user/client/events?requestChangesAlbum=${encodeURIComponent(a.id)}`;
              }}><MessageSquareWarning size={15} aria-hidden /> {t('Request changes')}</button>
            </div>
          )}
        </div>
      </Card>

      <div className="ged-grid gad-grid">
        <div className="ged-col">
          <Card className="ged-card">
            <h2 className="gc-h">{t('Album info')}</h2>
            <dl className="ged-facts">
              <Row label="Title" value={a.title} />
              {a.category ? <Row label="Category" value={t(a.category)} /> : null}
              {a.date ? <Row label="Date" value={formatDateShort(a.date)} /> : null}
              {a.eventLocation ? <Row label="Location" value={a.eventLocation} /> : null}
              {a.receivedDate ? <Row label="Received" value={formatDateShort(a.receivedDate)} /> : null}
            </dl>
            <dl className="gc-strip">
              <div><dt>{t('Photos')}</dt><dd className="g-num">{a.photoCount}</dd></div>
              <div><dt>{t('Downloaded')}</dt><dd className="g-num">{a.downloadedCount}</dd></div>
              <div><dt>{t('Favorites')}</dt><dd className="g-num">{a.favoriteCount}</dd></div>
            </dl>
          </Card>
          <Card className="ged-card">
            <h2 className="gc-h">{t('Photos')} ({a.images.length})</h2>
            {a.isLocked ? (
              <div className="gpf-banner gpf-banner-warn"><Lock size={16} aria-hidden /><span><strong>{t('This album is archived')}</strong><br />{archivedMessage({ lockedAt: a.lockedAt, price: archiveFeeText(a.archiveFee, a.archiveCurrency) })}</span></div>
            ) : a.images.length === 0 ? (
              <EmptyState title="No photos in this album yet" />
            ) : (
              <div className="gad-thumbs">
                {a.images.map((img, i) => (
                  <button key={i} type="button" className="gad-thumb" onClick={() => c.openLightbox(i)} aria-label={`${t('Open photo')} ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.fileUrl} alt={img.caption || ''} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </Card>
          {a.payment ? (
            <Card className="ged-card">
              <h2 className="gc-h">{t('Payment info')}</h2>
              <dl className="ged-facts">
                <Row label="Amount due" value={<Money amount={a.payment.amountDue} />} />
                <Row label="Status" value={t(getPaymentStatusLabel(a.payment.status))} />
                {a.payment.eventName ? <Row label="Event" value={a.payment.eventName} /> : null}
                {a.payment.photographerName ? <Row label="Photographer" value={a.payment.photographerName} /> : null}
              </dl>
            </Card>
          ) : null}
        </div>
        <div className="ged-col">
          <Card className="ged-card">
            {a.isLocked && <button type="button" className="g-btn g-btn-primary" onClick={c.handleUnlock}><RotateCw size={15} aria-hidden /> {t('Restore album')}</button>}
            {c.actionError ? <p role="alert" className="gpf-banner gpf-banner-error">{t(c.actionError)}</p> : null}
            <button type="button" className="g-btn gp-btn-quiet-danger" onClick={() => c.setShowDeleteConfirm(true)}><Trash2 size={15} aria-hidden /> {t('Delete album')}</button>
          </Card>
          <Card className="ged-card">
            <h2 className="gc-h">{t('Photographer')}</h2>
            <div className="gc-detail-head"><Avatar name={a.photographer || '?'} src={a.photographerAvatar} size={44} /><strong>{a.photographer}</strong></div>
          </Card>
          <Card className="ged-card">
            <h2 className="gc-h">{t('Details')}</h2>
            <dl className="ged-facts">
              <Row label="Status" value={t(a.isLocked ? 'Archived' : 'Unlocked')} />
              <Row label="Event" value={t(a.isCompleted ? 'Completed' : 'In progress')} />
              <Row label="Photos" value={String(a.photoCount)} />
              {a.expiresAt ? <Row label="Expires" value={<span className={expired ? 'gad-expired' : undefined}>{formatDateShort(a.expiresAt)}</span>} /> : null}
            </dl>
          </Card>
        </div>
      </div>

      {c.lightboxIndex !== null && a.images.length > 0 && (
        <Lightbox images={a.images.map((m) => ({ url: m.fileUrl, caption: m.caption }))} index={c.lightboxIndex} onClose={c.closeLightbox} onPrev={c.goToPrevImage} onNext={c.goToNextImage} />
      )}
      {c.showDeleteConfirm && (
        <ConfirmDialog title="Delete this album?" body="It is removed from your gallery. This cannot be undone." confirmLabel="Delete" busy={c.actionLoading}
          onClose={() => c.setShowDeleteConfirm(false)} onConfirm={c.handleDelete} />
      )}
      {c.showRestore && (
        <ArchiveRestoreFlow album={{ id: a.id, title: a.title, eventId: a.eventId, photographer: a.photographer, lockedAt: a.lockedAt, archiveFee: a.archiveFee, archiveCurrency: a.archiveCurrency }}
          colors={c.colors} actualTheme={c.actualTheme} onClose={() => c.setShowRestore(false)} onRestored={() => { c.setShowRestore(false); c.fetchAlbum(); }} />
      )}
    </div>
  );
}
