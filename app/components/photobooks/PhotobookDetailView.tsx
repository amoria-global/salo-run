'use client';

/**
 * Photobook detail, two columns: the photos on the left (the photographer can drag to reorder and add their own), the
 * status card with the ONE action that matters now, the timeline and the details on the right. Same actions and wording
 * as the mobile app, for the owner (client, coordinator, or a photographer's own book) and for the photographer a book
 * was sent to. Photos the viewer does not own or hasn't bought arrive as watermarked thumbnails, or without a url.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Lock, Send, X } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { pbCopy, photoCountLabel, type CopyKey } from '@/lib/photobookCopy';
import {
  acceptBook, closeBook, deleteDraft, getBook, nextAction, requestChanges, resubmitBook, saveEdits, sendBook,
  SOURCE_TONE, sourcesOf, statusInfo, timelineOf, type Pb, type Shelf,
} from '@/lib/photobooks';
import { Chip, Card, ConfirmDialog, EmptyState, ErrorState, RowsSkeleton } from '../glass/ui';
import { Money } from '../glass/Money';
import type { PbRole } from './PhotobooksShelf';

function day(iso: string | undefined, lang: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
}

export default function PhotobookDetailView({ role }: { role: PbRole }) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const received = role === 'photographer' && search?.get('received') === '1';
  const shelf: Shelf = received ? 'received' : 'mine';
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const t = useCallback((k: CopyKey, p?: Record<string, string | number>) => pbCopy(language, k, p), [language]);

  const [book, setBook] = useState<Pb | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [changesOpen, setChangesOpen] = useState(false);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState<null | 'send' | 'accept' | 'resubmit' | 'close' | 'delete'>(null);
  const [viewer, setViewer] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setBook(await getBook(id, role, received));
      setOrder(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, role, received]);
  useEffect(() => { void load(); }, [load]);

  const photos = useMemo(() => {
    const base = book?.photos ?? [];
    if (!order) return base;
    const byId = new Map(base.map((p) => [p.id, p]));
    const ordered = order.map((x) => byId.get(x)).filter((p): p is NonNullable<typeof p> => !!p);
    return [...ordered, ...base.filter((p) => !order.includes(p.id))];
  }, [book?.photos, order]);

  const run = async (op: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setErr(null);
    try {
      await op();
      if (after) after(); else await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (error && !book) return <div className="gp-page ged-page"><ErrorState message={error} onRetry={() => void load()} /></div>;
  if (!book) return <div className="gp-page ged-page"><RowsSkeleton rows={3} height={160} /></div>;

  const info = statusInfo(book, shelf);
  const statusLabel = info.raw ? info.raw : t(info.key as CopyKey);
  const action = nextAction(book, shelf, photos.length > 0);
  const timeline = timelineOf(book);
  const isEvent = !!book.eventId;
  const canEdit = received && (book.status === 'SENT_TO_PHOTOGRAPHER' || book.status === 'PHOTOGRAPHER_EDITING');
  const dirty = !!order && order.join() !== book.photos.map((p) => p.id).join();
  const who = book.toName ?? book.senderName ?? '';
  const layoutName = book.layout === 'gallery-wall' ? t('layout_wall') : t('layout_grid');
  const waiting = action !== 'wait' ? undefined
    : received ? (book.status === 'PENDING_PAYMENT' ? t('w_pay_photog') : t('w_review_photog'))
      : book.status === 'PHOTOGRAPHER_EDITING' ? t('w_editing', { name: who || '…' }) : t('w_with', { name: who || '…' });
  const payBasePath = role === 'event-coordinator' ? 'event-coordinator' : 'client';

  const drop = (toId: string) => {
    if (!dragId || dragId === toId) return;
    const ids = photos.map((p) => p.id);
    ids.splice(ids.indexOf(toId), 0, ids.splice(ids.indexOf(dragId), 1)[0]);
    setOrder(ids);
    setDragId(null);
  };
  const saveAll = () => saveEdits(book.id, photos.map((p) => p.id));

  return (
    <div className="gp-page ged-page pbk-detail">
      <button type="button" className="g-btn g-btn-ghost ged-back" onClick={() => router.back()}><ArrowLeft size={16} aria-hidden /> {t('back')}</button>
      <div className="pbk-dhead">
        <h1 className="g-display gp-title">{book.name}</h1>
        <p className="gp-sub">{[photoCountLabel(language, photos.length), t('layout_row', { layout: layoutName })].filter(Boolean).join(' · ')}</p>
        <span className="pbk-chips">{sourcesOf(book).map((s) => <Chip key={s} tone={SOURCE_TONE[s]}>{t(`src_${s}` as CopyKey)}</Chip>)}</span>
      </div>
      <div className="ged-grid pbk-dgrid">
        <div className="ged-col">
          <Card className="ged-card">
            <div className="pbk-photos-head">
              <h2 className="gc-h">{t('photos')} ({photos.length})</h2>
              {canEdit ? <small className="gpf-help">{t('hold_reorder')}</small> : null}
            </div>
            {photos.length === 0 ? (
              <EmptyState title={t('no_photos_left')} body={canEdit ? t('edit_intro') : t('no_photos')} />
            ) : (
              <div className="pbk-photo-grid is-detail">
                {photos.map((p, i) => (
                  <div key={p.id} className={`pbk-photo${dragId === p.id ? ' is-drag' : ''}`}
                    draggable={canEdit} onDragStart={() => setDragId(p.id)} onDragOver={(e) => canEdit && e.preventDefault()} onDrop={() => drop(p.id)} onDragEnd={() => setDragId(null)}>
                    <button type="button" className="pbk-open" aria-label={p.caption || `${t('photos')} ${i + 1}`} onClick={() => setViewer(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.url ? <img src={p.url} alt={p.caption ?? ''} loading="lazy" /> : <span className="pbk-noimg"><Lock size={16} aria-hidden /></span>}
                      {!p.original ? <span className="pbk-wm">{t('watermarked')}</span> : null}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="ged-col">
          <Card className="ged-card pbk-status">
            <div className="pbk-status-head"><Chip tone={info.tone}>{statusLabel}</Chip>{who ? <small>{received ? t('from_who', { name: who }) : t('to_who', { name: who })}</small> : null}</div>
            {book.status === 'COMPLETED' ? <p>{book.closedByPhotographer ? t('w_closed') : t('w_done')}</p> : null}
            {waiting ? <p>{waiting}</p> : null}
            {book.changeRequestNote && (book.status === 'SENT_TO_PHOTOGRAPHER' || book.status === 'PHOTOGRAPHER_EDITING') ? <p className="pbk-note">{t('changes_note', { note: book.changeRequestNote })}</p> : null}

            {action === 'send' ? (<>
              <p>{t('act_send_body')}</p>
              <button type="button" className="g-btn g-btn-primary" disabled={busy} onClick={() => setConfirm('send')}><Send size={15} aria-hidden /> {t('act_send')}</button>
              <button type="button" className="g-btn gp-btn-quiet-danger" onClick={() => setConfirm('delete')}>{t('act_delete')}</button>
            </>) : null}
            {action === 'pay' ? (<>
              <p>{t('act_pay_body')}</p>
              {book.paymentDeclarationId ? (
                <button type="button" className="g-btn g-btn-primary" onClick={() => router.push(`/user/${payBasePath}/payments/${book.paymentDeclarationId}`)}>
                  <CreditCard size={15} aria-hidden /> {t('act_pay', { price: formatPrice(book.extraPhotosAmount ?? 0), n: book.extraPhotosCount ?? 0 })}
                </button>
              ) : null}
            </>) : null}
            {action === 'review' ? (<>
              <p>{t('review_body')} {isEvent ? t('accept_event') : t('accept_plain')}</p>
              {changesOpen ? (
                <div className="pbk-changes">
                  <label>{t('changes_title')}
                    <textarea className="ck-input" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('changes_placeholder')} />
                  </label>
                  <div className="pbk-btns">
                    <button type="button" className="g-btn g-btn-ghost" onClick={() => setChangesOpen(false)}>{t('cancel')}</button>
                    <button type="button" className="g-btn g-btn-primary" disabled={!note.trim() || busy} onClick={() => void run(() => requestChanges(book.id, role, note), () => { setChangesOpen(false); setNote(''); void load(); })}>{t('changes_send')}</button>
                  </div>
                </div>
              ) : (
                <div className="pbk-btns">
                  <button type="button" className="g-btn g-btn-primary" disabled={busy} onClick={() => setConfirm('accept')}><Check size={15} aria-hidden /> {t('act_accept')}</button>
                  <button type="button" className="g-btn g-btn-ghost" onClick={() => setChangesOpen(true)}>{t('act_changes')}</button>
                </div>
              )}
            </>) : null}
            {action === 'edit' || action === 'resubmit' ? (<>
              <p>{t('edit_intro')}</p>
              <div className="pbk-btns">
                <button type="button" className="g-btn g-btn-primary" disabled={busy || photos.length === 0} onClick={() => setConfirm('resubmit')}><Send size={15} aria-hidden /> {t('act_resubmit')}</button>
                {dirty ? <button type="button" className="g-btn g-btn-ghost" disabled={busy} onClick={() => void run(saveAll)}>{t('act_save')}</button> : null}
              </div>
              <button type="button" className="g-btn gp-btn-quiet-danger" onClick={() => setConfirm('close')}><X size={15} aria-hidden /> {t('act_close')}</button>
            </>) : null}
            {err ? <p className="pbk-error" role="alert">{err}</p> : null}
          </Card>

          <Card className="ged-card">
            <ol className="pbk-timeline">
              {timeline.map((s) => (
                <li key={s.key} className={`is-${s.state}`} aria-current={s.state === 'current' ? 'step' : undefined}>
                  <span className="pbk-dot" aria-hidden>{s.state === 'done' ? <Check size={12} /> : null}</span>
                  <span>{t(s.key)}</span><small>{day(s.date, language)}</small>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="ged-card">
            <h2 className="gc-h">{t('review_label')}</h2>
            <dl className="ged-facts">
              <div><dt>{t('layout_label')}</dt><dd>{layoutName}</dd></div>
              <div><dt>{t('photos')}</dt><dd>{photos.length}</dd></div>
              {book.freePhotosLimit != null && isEvent ? <div><dt>{t('free_photos')}</dt><dd>{book.freePhotosLimit}</dd></div> : null}
              {isEvent ? <div><dt>{t('extras_count')}</dt><dd>{book.extraPhotosCount ?? 0}</dd></div> : null}
              {book.pricePerExtraPhoto != null && isEvent ? <div><dt>{t('price_per_extra')}</dt><dd><Money amount={book.pricePerExtraPhoto} /></dd></div> : null}
            </dl>
          </Card>
        </div>
      </div>

      {viewer !== null && photos[viewer] ? (
        <div className="pbk-lightbox" role="dialog" aria-modal="true" aria-label={t('photos')} onClick={() => setViewer(null)}>
          <button type="button" className="pbk-lb-close g-icon-btn" aria-label={t('done')} onClick={() => setViewer(null)}><X size={20} aria-hidden /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photos[viewer].url ? <img src={photos[viewer].url} alt="" onClick={(e) => e.stopPropagation()} /> : <Lock size={40} aria-hidden />}
          {!photos[viewer].original ? <p>{t('watermarked')}</p> : null}
          <div className="pbk-lb-nav" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="g-btn g-btn-ghost" disabled={viewer === 0} onClick={() => setViewer(viewer - 1)}>{t('back')}</button>
            <span>{viewer + 1} / {photos.length}</span>
            <button type="button" className="g-btn g-btn-ghost" disabled={viewer >= photos.length - 1} onClick={() => setViewer(viewer + 1)}>{t('next')}</button>
          </div>
        </div>
      ) : null}

      {confirm === 'send' ? <ConfirmDialog title={t('confirm_send_title')} body={t('confirm_send_body')} confirmLabel={t('act_send')} cancelLabel={t('cancel')} danger={false} busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void run(() => sendBook(book.id, role))} /> : null}
      {confirm === 'accept' ? <ConfirmDialog title={t('act_accept')} body={isEvent ? t('accept_event') : t('accept_plain')} confirmLabel={t('act_accept')} cancelLabel={t('cancel')} danger={false} busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void run(() => acceptBook(book.id, role))} /> : null}
      {confirm === 'resubmit' ? <ConfirmDialog title={t('confirm_resubmit_title')} body={t('confirm_resubmit_body')} confirmLabel={t('act_resubmit')} cancelLabel={t('cancel')} danger={false} busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void run(async () => { if (dirty) await saveAll(); await resubmitBook(book.id); })} /> : null}
      {confirm === 'close' ? <ConfirmDialog title={t('confirm_close_title')} body={t('act_close_body')} confirmLabel={t('act_close')} cancelLabel={t('cancel')} busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void run(() => closeBook(book.id), () => router.back())} /> : null}
      {confirm === 'delete' ? <ConfirmDialog title={t('confirm_delete_title')} body={t('confirm_delete_body')} confirmLabel={t('act_delete')} cancelLabel={t('cancel')} busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void run(() => deleteDraft(book.id, role), () => router.back())} /> : null}
    </div>
  );
}
