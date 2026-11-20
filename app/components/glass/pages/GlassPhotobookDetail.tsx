'use client';

/**
 * Photobook detail (client and coordinator gallery) in Compact Glass. Behaviour is the classic page's
 * (usePhotobookDetail, moved verbatim): send to the photographer while a draft has photos, accept a resubmitted book,
 * pay for extra photos, delete a draft behind a confirmation, the status workflow and the photo lightbox.
 */
import { ArrowLeft, Check, CreditCard, Send, Trash2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { formatDateShort, getStatusLabel, getWorkflowStepIndex, WORKFLOW_STEPS, type PhotobookDetailController } from '@/app/components/gallery/usePhotobookDetail';
import { Lightbox } from './GlassAlbumDetail';
import { Money } from '../Money';
import { Avatar, Card, Chip, ConfirmDialog, EmptyState, ErrorState, RowsSkeleton } from '../ui';

type Ctl = PhotobookDetailController;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const { t } = useLanguage();
  return <div><dt>{t(label)}</dt><dd>{value}</dd></div>;
}

export default function GlassPhotobookDetail({ ctl: c }: { ctl: Ctl }) {
  const { t } = useLanguage();
  const p = c.photobook;
  if (c.loading) return <div className="gp-page ged-page"><RowsSkeleton rows={3} height={160} /></div>;
  if (c.error || !p) {
    return (
      <div className="gp-page ged-page">
        <button type="button" className="g-btn g-btn-ghost ged-back" onClick={c.handleGoBack}><ArrowLeft size={16} aria-hidden /> {t('Back to gallery')}</button>
        {c.error ? <ErrorState message={c.error} onRetry={() => c.fetchPhotobook()} /> : <EmptyState title="Photobook not found" body="It may have been removed." />}
      </div>
    );
  }
  const status = p.status?.toUpperCase();
  const step = getWorkflowStepIndex(p.status);
  return (
    <div className="gp-page ged-page">
      <button type="button" className="g-btn g-btn-ghost ged-back" onClick={c.handleGoBack}><ArrowLeft size={16} aria-hidden /> {t('Back to gallery')}</button>
      <Card className="ged-hero">
        <div className="ged-hero-body">
          <div className="ged-title-row">
            <h1 className="g-display gp-title">{p.name}</h1>
            <Chip tone={status === 'COMPLETED' ? 'success' : status === 'DRAFT' ? 'neutral' : 'info'}>{t(getStatusLabel(p.status))}</Chip>
          </div>
          {p.description ? <p className="gp-sub">{p.description}</p> : null}
        </div>
      </Card>
      <div className="ged-grid">
        <div className="ged-col">
          <Card className="ged-card">
            <h2 className="gc-h">{t('Status')}</h2>
            <ol className="gpd-steps">
              {WORKFLOW_STEPS.map((s, i) => (
                <li key={s.key} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} aria-current={i === step ? 'step' : undefined}>
                  <span className="ged-step-dot" aria-hidden>{i < step ? <Check size={14} /> : i + 1}</span>
                  <span>{t(s.label)}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="ged-card">
            <h2 className="gc-h">{t('Photos')} ({p.mediaItems.length})</h2>
            {p.mediaItems.length === 0 ? <EmptyState title="No photos added yet" body="Add photos from the albums you received." /> : (
              <div className="gad-thumbs">
                {p.mediaItems.map((m, i) => (
                  <button key={m.id} type="button" className="gad-thumb" onClick={() => c.openLightbox(i)} aria-label={`${t('Open photo')} ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.fileUrl} alt={m.caption || ''} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </Card>
          {p.freePhotosLimit != null ? (
            <Card className="ged-card">
              <h2 className="gc-h">{t('Pricing')}</h2>
              <dl className="ged-facts">
                <Row label="Free photos" value={String(p.freePhotosLimit)} />
                {p.extraPhotosCount != null ? <Row label="Extra photos" value={String(p.extraPhotosCount)} /> : null}
                {p.pricePerExtraPhoto != null ? <Row label="Price per extra photo" value={<Money amount={p.pricePerExtraPhoto} />} /> : null}
                {p.extraPhotosAmount != null ? <Row label="Extras total" value={<Money amount={p.extraPhotosAmount} />} /> : null}
                <Row label="Payment required" value={t(p.paymentRequired ? 'Yes' : 'No')} />
              </dl>
            </Card>
          ) : null}
        </div>
        <div className="ged-col">
          <Card className="ged-card">
            {status === 'DRAFT' && p.mediaItems.length > 0 && <button type="button" className="g-btn g-btn-primary" disabled={c.actionLoading} onClick={c.handleSend}><Send size={15} aria-hidden /> {t('Send to photographer')}</button>}
            {status === 'RESUBMITTED' && <button type="button" className="g-btn g-btn-primary" disabled={c.actionLoading} onClick={c.handleAccept}><Check size={15} aria-hidden /> {t('Accept photobook')}</button>}
            {status === 'PENDING_PAYMENT' && p.paymentDeclarationId && <button type="button" className="g-btn g-btn-primary" onClick={c.handlePayForExtras}><CreditCard size={15} aria-hidden /> {t('Pay for extras')}</button>}
            {status === 'DRAFT' && <button type="button" className="g-btn gp-btn-quiet-danger" onClick={() => c.setShowDeleteConfirm(true)}><Trash2 size={15} aria-hidden /> {t('Delete photobook')}</button>}
            {status !== 'DRAFT' && status !== 'RESUBMITTED' && !(status === 'PENDING_PAYMENT' && p.paymentDeclarationId) ? <p className="gpf-help">{t('Nothing to do right now.')}</p> : null}
          </Card>
          {p.photographerName ? (
            <Card className="ged-card"><h2 className="gc-h">{t('Photographer')}</h2><div className="gc-detail-head"><Avatar name={p.photographerName} size={44} /><strong>{p.photographerName}</strong></div></Card>
          ) : null}
          <Card className="ged-card">
            <h2 className="gc-h">{t('Details')}</h2>
            <dl className="ged-facts">
              {p.layout ? <Row label="Layout" value={t(p.layout)} /> : null}
              <Row label="Photos" value={String(p.mediaCount)} />
              <Row label="Created" value={formatDateShort(p.createdAt)} />
              {p.sentAt ? <Row label="Sent" value={formatDateShort(p.sentAt)} /> : null}
              {p.resubmittedAt ? <Row label="Resubmitted" value={formatDateShort(p.resubmittedAt)} /> : null}
              {p.senderName ? <Row label="Sender" value={p.senderName} /> : null}
            </dl>
          </Card>
        </div>
      </div>
      {c.lightboxIndex !== null && p.mediaItems.length > 0 && (
        <Lightbox images={p.mediaItems.map((m) => ({ url: m.fileUrl, caption: m.caption }))} index={c.lightboxIndex} onClose={c.closeLightbox} onPrev={c.goToPrevImage} onNext={c.goToNextImage} />
      )}
      {c.showDeleteConfirm && (
        <ConfirmDialog title="Delete this photobook?" body="The draft and the photos you picked for it are removed. This cannot be undone." confirmLabel="Delete" busy={c.actionLoading}
          onClose={() => c.setShowDeleteConfirm(false)} onConfirm={c.handleDelete} />
      )}
    </div>
  );
}
