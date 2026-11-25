'use client';

/**
 * "New photobook", in three steps: Albums, Photos, Details.
 *
 * Step 2 is two panes: the person's albums on the left (type chip and selected / total, "0/12 bought" for paid or priced
 * content) and the photo grid on the right with ticks, Select all and shift-click ranges. The server only lists photos
 * the person may add, so a paid or priced content photo they have not bought is never shown; a book uses ONE
 * photographer's photos, so albums of any other photographer switch off once a photo is chosen. The order photos are
 * ticked in is the book's order.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock } from 'lucide-react';
import Modal from '../ui/Modal';
import { useLanguage } from '@/app/context/LanguageContext';
import { pbCopy, photoCountLabel, type CopyKey } from '@/lib/photobookCopy';
import {
  createBook, eventTerms, listPickerAlbums, listPickerPhotos, sendBook, SOURCE_TONE,
  type PickerAlbum, type PickerPhoto, type SourceKey,
} from '@/lib/photobooks';
import { Chip } from '../glass/ui';

type Step = 'albums' | 'photos' | 'details';
type Picked = { id: string; thumb?: string; albumId: string; ownerId?: string };
type ChipKey = 'all' | SourceKey;
const CHIPS: { key: ChipKey; label: CopyKey }[] = [
  { key: 'all', label: 'chip_all' }, { key: 'event', label: 'chip_event' }, { key: 'free', label: 'chip_free' },
  { key: 'purchased', label: 'chip_purchased' }, { key: 'content', label: 'chip_content' }, { key: 'mine', label: 'chip_mine' },
];

export default function NewPhotobookModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { language } = useLanguage();
  const t = useCallback((k: CopyKey, p?: Record<string, string | number>) => pbCopy(language, k, p), [language]);

  const [albums, setAlbums] = useState<PickerAlbum[] | null>(null);
  const [albumsError, setAlbumsError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('albums');
  const [chip, setChip] = useState<ChipKey>('all');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, PickerPhoto[]>>({});
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [terms, setTerms] = useState<{ eventId: string; free: number; price: number; title?: string } | null>(null);
  const [name, setName] = useState('');
  const [layout, setLayout] = useState<'grid' | 'gallery-wall'>('grid');
  const [coverId, setCoverId] = useState<string | null>(null);
  const [linkEvent, setLinkEvent] = useState(true);
  const [busy, setBusy] = useState<'create' | 'send' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastIndex = useRef<number>(-1);

  useEffect(() => {
    let live = true;
    listPickerAlbums().then((a) => live && setAlbums(a)).catch((e: Error) => live && setAlbumsError(e.message));
    return () => { live = false; };
  }, []);

  const byId = useMemo(() => new Map((albums ?? []).map((a) => [a.id, a])), [albums]);
  const lockedOwner = picked[0]?.ownerId;
  const current = currentId ? byId.get(currentId) ?? null : null;
  const eventId = useMemo(() => {
    const ids = new Set(picked.map((p) => byId.get(p.albumId)?.eventId));
    return ids.size === 1 ? ([...ids][0] || undefined) : undefined;
  }, [picked, byId]);
  useEffect(() => {
    if (!eventId) return;
    let live = true;
    eventTerms(eventId).then((x) => live && setTerms({ eventId, free: x.freePhotosLimit, price: x.pricePerExtraPhoto, title: x.title })).catch(() => undefined);
    return () => { live = false; };
  }, [eventId]);
  const activeTerms = eventId && terms?.eventId === eventId ? terms : null;
  const extras = activeTerms ? Math.max(0, picked.length - activeTerms.free) : 0;

  const loadPhotos = useCallback(async (id: string) => {
    if (photos[id]) return;
    setLoadingPhotos(true);
    try {
      const items = await listPickerPhotos(id);
      setPhotos((p) => ({ ...p, [id]: items }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingPhotos(false);
    }
  }, [photos]);

  const openAlbum = (a: PickerAlbum) => {
    setCurrentId(a.id);
    setStep('photos');
    lastIndex.current = -1;
    void loadPhotos(a.id);
  };

  const list = current ? photos[current.id] ?? [] : [];
  const isOn = (id: string) => picked.some((x) => x.id === id);
  const add = (a: PickerAlbum, ps: PickerPhoto[]) =>
    setPicked((cur) => [...cur, ...ps.filter((p) => !cur.some((x) => x.id === p.id)).map((p) => ({ id: p.id, thumb: p.thumbUrl, albumId: a.id, ownerId: a.ownerId }))]);
  const click = (i: number, shift: boolean) => {
    if (!current) return;
    const p = list[i];
    if (shift && lastIndex.current >= 0) {
      const [lo, hi] = [Math.min(lastIndex.current, i), Math.max(lastIndex.current, i)];
      add(current, list.slice(lo, hi + 1));
    } else if (isOn(p.id)) {
      setPicked((cur) => cur.filter((x) => x.id !== p.id));
    } else {
      add(current, [p]);
    }
    lastIndex.current = i;
  };
  const allOn = list.length > 0 && list.every((p) => isOn(p.id));
  const selectAll = () => {
    if (!current) return;
    if (allOn) setPicked((cur) => cur.filter((x) => !list.some((p) => p.id === x.id)));
    else add(current, list);
  };
  const visible = (albums ?? []).filter((a) => chip === 'all' || a.sourceType === chip);

  const submit = async (send: boolean) => {
    setBusy(send ? 'send' : 'create');
    setError(null);
    let id: string | undefined;
    try {
      const cover = picked.find((p) => p.id === coverId)?.thumb ?? picked[0]?.thumb;
      const book = await createBook({ name: name.trim(), layout, mediaIds: picked.map((p) => p.id), coverImage: cover, eventId: linkEvent ? eventId : undefined });
      id = book.id;
      if (send) await sendBook(book.id, 'client');
      onCreated(book.id);
    } catch (e) {
      setError((e as Error).message);
      if (id) onCreated(id);
    } finally {
      setBusy(null);
    }
  };

  const crumbs = (['albums', 'photos', 'details'] as const).map((s, i) => (
    <span key={s} className={`pbk-crumb${step === s ? ' is-on' : ''}`}>{i + 1} {t(`step_${s}` as CopyKey)}</span>
  ));

  const footer = (
    <div className="pbk-foot">
      <span className="pbk-lock"><Lock size={13} aria-hidden /> {t('lock_note')}</span>
      <span className="pbk-selected">
        <strong>{t('n_selected', { n: picked.length })}</strong>
        {activeTerms ? <small>{t('free_up_to', { n: activeTerms.free })}{extras > 0 ? ` · ${t('extras_over', { n: extras, price: activeTerms.price })}` : ''}</small> : null}
      </span>
      {step !== 'albums' ? <button type="button" className="g-btn g-btn-ghost" onClick={() => setStep(step === 'details' ? 'photos' : 'albums')}>{t('back')}</button> : null}
      {step === 'details' ? (
        <>
          <button type="button" className="g-btn g-btn-ghost" disabled={!name.trim() || !!busy} onClick={() => void submit(false)}>{busy === 'create' ? t('creating') : t('create')}</button>
          <button type="button" className="g-btn g-btn-primary" disabled={!name.trim() || !!busy} onClick={() => void submit(true)}>{busy === 'send' ? t('sending') : t('create_send')}</button>
        </>
      ) : (
        <button type="button" className="g-btn g-btn-primary" disabled={picked.length === 0} onClick={() => setStep('details')}>{t('next')}</button>
      )}
    </div>
  );

  // Portalled to the body: inside the page it sat under the sidebar's stacking context and was clipped.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <Modal isOpen onClose={onClose} size="xl" title={t('new_book')} description={<span className="pbk-crumbs">{crumbs}</span>} footer={footer}>
      {step === 'albums' ? (
        <div className="pbk-pick">
          <div className="pbk-filters" role="group" aria-label={t('step_albums')}>
            {CHIPS.map((c) => <button key={c.key} type="button" aria-pressed={chip === c.key} className={`pbk-fchip${chip === c.key ? ' is-on' : ''}`} onClick={() => setChip(c.key)}>{t(c.label)}</button>)}
          </div>
          {albums === null && !albumsError ? <p className="gpf-help">…</p> : albumsError ? <p className="pbk-error" role="alert">{albumsError}</p> : visible.length === 0 ? (
            <div className="pbk-none"><strong>{t('albums_empty_title')}</strong><p>{t('albums_empty_body')}</p></div>
          ) : (
            <ul className="pbk-albums">
              {visible.map((a) => <AlbumRow key={a.id} a={a} lockedOwner={lockedOwner} picked={picked} on={false} onPick={() => openAlbum(a)} t={t} language={language} />)}
            </ul>
          )}
        </div>
      ) : null}

      {step === 'photos' ? (
        <div className="pbk-two">
          <ul className="pbk-albums pbk-left" aria-label={t('step_albums')}>
            {(albums ?? []).map((a) => <AlbumRow key={a.id} a={a} lockedOwner={lockedOwner} picked={picked} on={a.id === currentId} onPick={() => openAlbum(a)} t={t} language={language} />)}
          </ul>
          <div className="pbk-right">
            {current ? (
              <div className="pbk-photos-head">
                <strong className="g-ellipsis">{current.title}</strong>
                {list.length > 0 ? <button type="button" className="g-btn g-btn-ghost" onClick={selectAll}>{allOn ? t('clear_all') : t('select_all')}</button> : null}
              </div>
            ) : null}
            {loadingPhotos ? <p className="gpf-help">…</p> : list.length === 0 ? (
              <div className="pbk-none"><Lock size={18} aria-hidden /><strong>{t('no_photos')}</strong><p>{t('lock_note')}</p></div>
            ) : (
              <div className="pbk-photo-grid" role="group" aria-label={t('photos')}>
                {list.map((p, i) => {
                  const idx = picked.findIndex((x) => x.id === p.id);
                  return (
                    <button key={p.id} type="button" data-ck-shape="card" className={`pbk-photo${idx >= 0 ? ' is-on' : ''}`} aria-pressed={idx >= 0} aria-label={p.caption || `${t('photos')} ${i + 1}`} onClick={(e) => click(i, e.shiftKey)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.thumbUrl ? <img src={p.thumbUrl} alt="" loading="lazy" /> : <span className="pbk-noimg" />}
                      <span className="pbk-tick" aria-hidden>{idx >= 0 ? <><Check size={12} />{idx + 1}</> : null}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {step === 'details' ? (
        <div className="pbk-form">
          <label>{t('name_label')}
            <input className="ck-input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder={t('name_placeholder')} />
          </label>
          <fieldset className="pbk-radios"><legend>{t('layout_label')}</legend>
            {(['grid', 'gallery-wall'] as const).map((l) => (
              <label key={l} className={layout === l ? 'is-on' : ''}><input type="radio" name="pbk-layout" checked={layout === l} onChange={() => setLayout(l)} /> {t(l === 'grid' ? 'layout_grid' : 'layout_wall')}</label>
            ))}
          </fieldset>
          <div><span className="pbk-label">{t('cover_label')}</span><small className="gpf-help">{t('cover_hint')}</small>
            <div className="pbk-covers">
              {picked.slice(0, 60).map((p, i) => {
                const on = (coverId ?? picked[0]?.id) === p.id;
                return (
                  <button key={p.id} type="button" data-ck-shape="card" className={`pbk-cover${on ? ' is-on' : ''}`} aria-pressed={on} aria-label={`${t('cover_label')} ${i + 1}`} onClick={() => setCoverId(p.id)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.thumb ? <img src={p.thumb} alt="" loading="lazy" /> : <span className="pbk-noimg" />}
                  </button>
                );
              })}
            </div>
          </div>
          {eventId ? (
            <label className="pbk-event"><input type="checkbox" checked={linkEvent} onChange={(e) => setLinkEvent(e.target.checked)} />
              <span><strong>{t('event_label')}</strong><small>{linkEvent ? activeTerms?.title ?? byId.get(picked[0]?.albumId ?? '')?.eventTitle ?? '' : t('event_none')}</small></span>
            </label>
          ) : null}
          <p className="gpf-help">{photoCountLabel(language, picked.length)}</p>
        </div>
      ) : null}
      {error ? <p className="pbk-error" role="alert">{error}</p> : null}
    </Modal>,
    document.body,
  );
}

function AlbumRow({ a, lockedOwner, picked, on, onPick, t, language }: {
  a: PickerAlbum; lockedOwner?: string; picked: Picked[]; on: boolean; onPick: () => void;
  t: (k: CopyKey, p?: Record<string, string | number>) => string; language: string;
}) {
  const blocked = !!lockedOwner && !!a.ownerId && a.ownerId !== lockedOwner;
  const n = picked.filter((p) => p.albumId === a.id).length;
  return (
    <li>
      <button type="button" data-ck-shape="card" className={`pbk-album${on ? ' is-on' : ''}`} disabled={blocked} onClick={onPick} aria-current={on ? 'true' : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {a.coverUrl ? <img src={a.coverUrl} alt="" loading="lazy" /> : <span className="pbk-noimg" />}
        <span className="pbk-album-body">
          <strong className="g-ellipsis">{a.title}</strong>
          <Chip tone={SOURCE_TONE[a.sourceType as SourceKey] ?? 'neutral'}>{t(`src_${a.sourceType}` as CopyKey)}</Chip>
          {blocked ? <small className="pbk-warn">{t('one_photographer')}</small> : null}
        </span>
        <span className="pbk-count">{a.priced ? `${n}/${a.usableCount}` : `${n}/${a.photoCount}`}{a.priced ? ` ${language === 'en' ? 'bought' : ''}`.trimEnd() : ''}</span>
      </button>
    </li>
  );
}
