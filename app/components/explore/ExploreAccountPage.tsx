'use client';

/**
 * Explore for a signed-in person, in the Compact Glass shell: "Saved" (the photos and clips they hearted, in a masonry) and
 * "My purchases" (what they bought with their email, opened with the unlock code into signed download links). Loading, empty
 * and error states each say what to do next. Nothing here ever shows an original: the grid shows watermarked previews, and a
 * purchase opens through links that expire.
 */
import { useCallback, useEffect, useState } from 'react';
import { Bookmark, Download, ExternalLink, Heart, Play, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { getLandingUrl } from '@/lib/api';
import {
  clockOf, listPurchases, listSaved, priceText, unlock, unsave,
  type PurchaseRow, type SavedItem, type Unlocked,
} from '@/lib/explore';
import { Card, EmptyState, ErrorState, GlassModal, PageHeader, RowsSkeleton } from '../glass/ui';

export type ExploreView = 'saved' | 'purchases';

const exploreUrl = () => `${(getLandingUrl() || 'https://connekyt.com').replace(/\/$/, '')}/explore`;

export default function ExploreAccountPage({ view }: { view: ExploreView }) {
  const { t } = useLanguage();
  return (
    <div className="gp-page">
      <PageHeader
        title={view === 'saved' ? 'Saved' : 'My purchases'}
        subtitle={view === 'saved' ? 'Photos and clips you kept from Explore.' : 'What you bought on Explore. Open one to download it.'}
        action={<a className="g-btn g-btn-ghost" href={exploreUrl()} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden /> {t('Open Explore')}</a>}
      />
      {view === 'saved' ? <Saved /> : <Purchases />}
    </div>
  );
}

function Saved() {
  const { t } = useLanguage();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try { setItems(await listSaved()); } catch (e) { setError(e instanceof Error ? e.message : 'We could not load your saved items.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const remove = async (id: string) => {
    setBusy(id);
    try { await unsave(id); setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev)); }
    catch (e) { setError(e instanceof Error ? e.message : 'We could not remove it.'); }
    finally { setBusy(null); }
  };

  if (error && !items) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <RowsSkeleton rows={4} height={140} />;
  if (items.length === 0) {
    return (
      <EmptyState icon={<Bookmark size={20} />} title="Nothing saved yet"
        body="Tap the heart on a photo or clip in Explore and it will wait for you here."
        action={<a className="g-btn g-btn-primary" href={exploreUrl()} target="_blank" rel="noopener noreferrer">{t('Open Explore')}</a>} />
    );
  }
  return (
    <>
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      <div className="xpl-masonry" aria-label={t('Saved')}>
        {items.map((it) => (
          <Card key={it.id} className="xpl-card">
            <a className="xpl-media" style={{ aspectRatio: String(it.aspectRatio) }} href={`${exploreUrl()}?item=${encodeURIComponent(it.id)}`} target="_blank" rel="noopener noreferrer"
              aria-label={`${it.title || (it.mediaType === 'VIDEO' ? t('Clip') : t('Photo'))}, ${it.creatorName}`}>
              {it.thumbnailUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={it.thumbnailUrl} alt="" loading="lazy" />}
              {it.mediaType === 'VIDEO' && <span className="xpl-badge"><Play size={11} aria-hidden /> {clockOf(it.durationSeconds) || t('Clip')}</span>}
            </a>
            <div className="xpl-body">
              <div className="xpl-body-text">
                <strong>{it.title || (it.mediaType === 'VIDEO' ? t('Clip') : t('Photo'))}</strong>
                <small>{it.creatorName}{it.priceAmount != null ? ` · ${priceText(it.priceAmount, it.priceCurrency)}` : ''}</small>
              </div>
              <button type="button" className="xpl-heart" aria-label={`${t('Remove from saved')}: ${it.title || ''}`} disabled={busy === it.id} onClick={() => void remove(it.id)}>
                <Heart size={18} aria-hidden fill="currentColor" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Purchases() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PurchaseRow[] | null>(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);
  const [opened, setOpened] = useState<{ row: PurchaseRow; data: Unlocked } | null>(null);
  const [openError, setOpenError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setRows(await listPurchases()); } catch (e) { setError(e instanceof Error ? e.message : 'We could not load your purchases.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = async (row: PurchaseRow) => {
    if (!row.unlockCode) { setOpenError('This purchase has no unlock code yet. Try again in a minute.'); return; }
    setOpening(row.refid); setOpenError('');
    try { setOpened({ row, data: await unlock(row.unlockCode) }); }
    catch (e) { setOpenError((e as { status?: number }).status === 429 ? 'Too many tries. Wait a few minutes and try again.' : 'We could not open this purchase.'); }
    finally { setOpening(null); }
  };

  if (error && !rows) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!rows) return <RowsSkeleton rows={4} height={64} />;
  if (rows.length === 0) {
    return (
      <EmptyState icon={<ShoppingBag size={20} />} title="No purchases yet"
        body="Photos and clips you buy on Explore with this email show up here. Bought as a guest? Use the same email and they appear."
        action={<a className="g-btn g-btn-primary" href={exploreUrl()} target="_blank" rel="noopener noreferrer">{t('Open Explore')}</a>} />
    );
  }
  return (
    <>
      {openError && <ErrorState message={openError} />}
      <ul className="xpl-list" aria-label={t('My purchases')}>
        {rows.map((r) => (
          <li key={r.refid}>
            <Card className="xpl-purchase">
              <div className="xpl-purchase-text">
                <strong>{r.title || t('Explore purchase')}</strong>
                <small>{r.paidAt ? new Date(r.paidAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}{r.amount != null && r.currency ? ` · ${priceText(r.amount, r.currency)}` : ''}</small>
              </div>
              <button type="button" className="g-btn g-btn-primary" disabled={opening === r.refid} onClick={() => void open(r)}>
                {opening === r.refid ? t('Opening…') : t('Open')}
              </button>
            </Card>
          </li>
        ))}
      </ul>
      {opened && (
        <GlassModal title={opened.row.title || 'Your files'} onClose={() => setOpened(null)} width={680}>
          <p className="xpl-note">{t('Links expire after 7 days or 5 downloads. Open this page again for new ones.')}</p>
          {opened.data.zipUrl && (
            <a className="g-btn g-btn-primary" href={opened.data.zipUrl} rel="noopener noreferrer"><Download size={14} aria-hidden /> {t('Download all photos (ZIP)')}</a>
          )}
          <div className="xpl-grid">
            {opened.data.items.map((u) => (
              <div key={u.id} className="xpl-file">
                {u.thumbnailUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={u.thumbnailUrl} alt="" loading="lazy" />}
                <small>{u.title || (u.mediaType === 'VIDEO' ? t('Clip') : t('Photo'))}</small>
                <a className="g-btn g-btn-ghost" href={u.viewUrl || u.downloadUrl || '#'} target="_blank" rel="noopener noreferrer"><Download size={14} aria-hidden /> {t('Download')}</a>
              </div>
            ))}
          </div>
        </GlassModal>
      )}
    </>
  );
}
