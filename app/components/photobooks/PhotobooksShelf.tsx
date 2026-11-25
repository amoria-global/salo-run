'use client';

/**
 * Photobooks shelf (Events area Photobooks tab and the /photobooks pages): a header with New photobook, the My
 * photobooks / Received switch with counts, filters that match the REAL statuses (All, In progress, Needs you,
 * Completed), search, and cards in a FIXED-WIDTH grid (254px, cover mosaic 232 x 150) that wraps and never stretches, so
 * a single book is one card, not a full-width block.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Image as ImageIcon, Plus, Search } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { pbCopy, photoCountLabel, type CopyKey } from '@/lib/photobookCopy';
import {
  bucketCounts, filterBooks, listMine, listReceived, SOURCE_TONE, sourcesOf, statusInfo,
  type FilterKey, type Pb, type Shelf,
} from '@/lib/photobooks';
import { Chip, EmptyState, ErrorState, RowsSkeleton } from '../glass/ui';
import NewPhotobookModal from '../events/NewPhotobookModal';
import PhotobooksHelp from './PhotobooksHelp';

export type PbRole = 'client' | 'photographer' | 'event-coordinator';

export function pbHref(role: PbRole, id: string, received: boolean): string {
  if (role === 'photographer') return `/user/photographer/photobooks/${id}${received ? '?received=1' : ''}`;
  return `/user/${role}/gallery/photobooks/${id}`;
}

const FILTERS: { key: FilterKey; label: CopyKey }[] = [
  { key: 'all', label: 'f_all' }, { key: 'progress', label: 'f_progress' }, { key: 'needs', label: 'f_needs' }, { key: 'done', label: 'f_done' },
];

function dateText(iso: string | undefined, lang: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString(lang === 'rw' ? 'en-GB' : lang, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Cover mosaic: one big photo and two small ones, or a "No photos" tile. */
export function PbMosaic({ photos, label }: { photos: (string | undefined)[]; label: string }) {
  const urls = photos.filter((u): u is string => !!u).slice(0, 3);
  if (urls.length === 0) {
    return <div className="pbk-mosaic pbk-empty" role="img" aria-label={label}><ImageIcon size={22} aria-hidden /><span>{label}</span></div>;
  }
  return (
    <div className="pbk-mosaic">
      {/* eslint-disable @next/next/no-img-element */}
      <img className="pbk-big" src={urls[0]} alt="" loading="lazy" />
      <div className="pbk-stack">
        {urls[1] ? <img src={urls[1]} alt="" loading="lazy" /> : <span />}
        {urls[2] ? <img src={urls[2]} alt="" loading="lazy" /> : <span />}
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}

function PbCard({ book, shelf, onOpen }: { book: Pb; shelf: Shelf; onOpen: () => void }) {
  const { language } = useLanguage();
  const info = statusInfo(book, shelf);
  const label = info.raw ? info.raw : pbCopy(language, info.key as CopyKey);
  const who = shelf === 'received'
    ? (book.senderName ? pbCopy(language, 'from_who', { name: book.senderName }) : undefined)
    : (book.toName ? pbCopy(language, 'to_who', { name: book.toName }) : undefined);
  const meta = [who, photoCountLabel(language, book.mediaCount) && book.mediaCount > 0 ? photoCountLabel(language, book.mediaCount) : dateText(book.sentAt ?? book.createdAt, language)].filter(Boolean).join(' · ');
  return (
    <button type="button" data-ck-shape="card" className="pbk-card" onClick={onOpen} aria-label={`${book.name}, ${label}`}>
      <PbMosaic photos={book.photos.map((p) => p.url)} label={book.mediaCount === 0 ? pbCopy(language, 'no_photos_left') : pbCopy(language, 'no_photos')} />
      <span className="pbk-body">
        <strong className="g-ellipsis">{book.name}</strong>
        {meta ? <small className="g-ellipsis">{meta}</small> : null}
        <span className="pbk-chips">
          <Chip tone={info.tone}>{label}</Chip>
          {sourcesOf(book).map((s) => <Chip key={s} tone={SOURCE_TONE[s]}>{pbCopy(language, `src_${s}` as CopyKey)}</Chip>)}
        </span>
      </span>
    </button>
  );
}

export default function PhotobooksShelf({ role, embedded = false }: { role: PbRole; embedded?: boolean }) {
  const router = useRouter();
  const { language, t: tr } = useLanguage();
  const t = useCallback((k: CopyKey, p?: Record<string, string | number>) => pbCopy(language, k, p), [language]);
  const isPhotographer = role === 'photographer';
  const [shelfChoice, setShelf] = useState<Shelf>('mine');
  const shelf: Shelf = isPhotographer ? shelfChoice : 'mine';
  const [mine, setMine] = useState<Pb[] | null>(null);
  const [received, setReceived] = useState<Pb[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, r] = await Promise.all([listMine(role), isPhotographer ? listReceived() : Promise.resolve([] as Pb[])]);
      setMine(m);
      setReceived(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [role, isPhotographer]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const books = useMemo(() => (shelf === 'received' ? received : mine) ?? [], [shelf, received, mine]);
  const counts = useMemo(() => bucketCounts(books, shelf), [books, shelf]);
  const list = useMemo(() => filterBooks(books, shelf, filter, query), [books, shelf, filter, query]);
  const loading = mine === null && !error;
  const filtering = !!query || filter !== 'all';

  return (
    <section className={`pbk-shelf${embedded ? ' is-embedded' : ''}`} aria-label={t('title')}>
      {!embedded ? (
        <header className="pbk-head">
          <div><p className="pbk-eyebrow">{tr('Events')}</p><h1 className="g-display gp-title">{t('title')}</h1></div>
          <button type="button" className="g-btn g-btn-primary" onClick={() => setCreating(true)}><Plus size={16} aria-hidden /> {t('new_book')}</button>
        </header>
      ) : (
        <div className="pbk-head-inline"><button type="button" className="g-btn g-btn-primary" onClick={() => setCreating(true)}><Plus size={16} aria-hidden /> {t('new_book')}</button></div>
      )}
      <PhotobooksHelp />
      <div className="pbk-bar">
        {isPhotographer ? (
          <div className="pbk-switch" role="tablist" aria-label={t('title')}>
            {(['mine', 'received'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={shelf === k} className={shelf === k ? 'is-on' : ''} onClick={() => { setShelf(k); setFilter('all'); }}>
                {t(k === 'mine' ? 'mine' : 'received')} <span className="pbk-n">{(k === 'mine' ? mine : received)?.length ?? 0}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="pbk-filters" role="group" aria-label={t('title')}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} className={`pbk-fchip${filter === f.key ? ' is-on' : ''}`} onClick={() => setFilter(f.key)}>
              {t(f.label)} <span className="pbk-n">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <label className="gc-search pbk-search"><Search size={15} aria-hidden /><span className="sr-only">{t('search')}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search')} /></label>
      </div>

      {loading ? <RowsSkeleton rows={2} height={220} /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : list.length === 0 ? (
        filtering ? <EmptyState icon={<Search size={20} />} title={t('filter_empty_title')} body={t('filter_empty_body')} />
          : shelf === 'received' ? <EmptyState icon={<BookOpen size={20} />} title={t('received_empty_title')} body={t('received_empty_body')} />
          : <EmptyState icon={<BookOpen size={20} />} title={t('list_empty_title')} body={t('list_empty_body')}
              action={<button type="button" className="g-btn g-btn-primary" onClick={() => setCreating(true)}><Plus size={16} aria-hidden /> {t('new_book')}</button>} />
      ) : (
        <div className="pbk-grid">
          {list.map((b) => <PbCard key={b.id} book={b} shelf={shelf} onOpen={() => router.push(pbHref(role, b.id, shelf === 'received'))} />)}
        </div>
      )}

      {creating ? <NewPhotobookModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); router.push(pbHref(role, id, false)); }} /> : null}
    </section>
  );
}
