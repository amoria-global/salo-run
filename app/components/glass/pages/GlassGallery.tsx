'use client';

/**
 * Client and coordinator gallery in Compact Glass. Behaviour is the classic page's (useClientGallery, moved verbatim);
 * every dialog (album view, share, multi-select, viewer, photobook flows) is the classic ClientGalleryModals.
 *
 * Header like Home with Create photobook, four summary cards, All / Archived when there is anything archived,
 * search with category and photographer filters, then album cards (Grid) or rows (List): Browse (Restore when
 * archived), Share while there is no photobook yet, Delete through the page's confirmation. The photobook view is one
 * card with Browse, Share and Download.
 */
import { BookOpen, Download, Eye, Heart, Images, LayoutGrid, List, Plus, RotateCw, Search, Share2, Trash2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Avatar, Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton, Segmented } from '../ui';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ctl = any;
type Album = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  const { t } = useLanguage();
  return <Card className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{value}</strong></Card>;
}

function AlbumCard({ c, a, list }: { c: Ctl; a: Album; list: boolean }) {
  const { t } = useLanguage();
  const open = () => { if (a.isLocked) { c.setRestoreAlbum(a); return; } c.setSelectedAlbum(a); c.setShowViewModal(true); };
  return (
    <Card className={`gev-album${list ? ' is-list' : ''}`}>
      <button type="button" className="gev-cover" onClick={open} aria-label={`${t('Open album')} ${a.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.thumbnail || '/coverr.jpg'} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
        <span className="gev-cover-chips">
          <Chip tone="neutral"><Images size={12} aria-hidden /> {a.photoCount} {t(a.photoCount === 1 ? 'photo' : 'photos')}</Chip>
          {a.category ? <Chip tone="info">{t(a.category)}</Chip> : null}
          {a.isLocked ? <Chip tone="pending">{t('Archived')}</Chip> : null}
        </span>
      </button>
      <div className="gev-album-body">
        <span className="gc-two"><strong className="g-ellipsis">{a.title}</strong></span>
        <span className="ggl-by">
          <Avatar name={a.photographer || '?'} src={a.photographerAvatar} size={28} />
          <span className="gc-two"><small className="g-ellipsis">{a.photographer}</small><small>{t('Received')} {a.receivedDate}</small></span>
        </span>
        <div className="gev-actions">
          <button type="button" className="g-btn g-btn-primary gev-act" onClick={() => { if (a.isLocked) c.setRestoreAlbum(a); else c.openMultiSelectView(a); }}>
            {a.isLocked ? <RotateCw size={15} aria-hidden /> : <Eye size={15} aria-hidden />} {a.isLocked ? t('Restore') : t('Browse')}
          </button>
          {!c.photobook && <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => { c.setShareAlbum(a); c.setShowShareModal(true); }}><Share2 size={15} aria-hidden /> {t('Share')}</button>}
          <button type="button" className="g-icon-btn gpf-danger-icon" aria-label={`${t('Delete album')} ${a.title}`} onClick={() => c.openDeleteModal(a)}><Trash2 size={16} aria-hidden /></button>
        </div>
      </div>
    </Card>
  );
}

function PhotobookCard({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const pb = c.photobook;
  const downloadAll = async () => {
    for (let i = 0; i < pb.images.length; i++) {
      const img = pb.images[i];
      await c.downloadImage(img.url, `${pb.name.replace(/[^a-z0-9]/gi, '_')}_${i + 1}.jpg`);
      if (i < pb.images.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
  };
  return (
    <Card className="gev-album ggl-photobook">
      <button type="button" className="gev-cover" onClick={() => c.setShowPhotobookModal(true)} aria-label={`${t('Open photobook')} ${pb.name}`}>
        {pb.thumbnail
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={pb.thumbnail} alt="" />
          : <span className="ggl-placeholder" aria-hidden><BookOpen size={40} /></span>}
        <span className="gev-cover-chips"><Chip tone="neutral"><Images size={12} aria-hidden /> {pb.images.length} {t(pb.images.length === 1 ? 'photo' : 'photos')}</Chip></span>
      </button>
      <div className="gev-album-body">
        <span className="gc-two"><strong className="g-ellipsis">{pb.name}</strong>{pb.description ? <small>{pb.description}</small> : null}</span>
        {pb.images.length === 0 ? (
          <p className="gpf-help">{t('Select your preferred photos from the albums you received to add them to this photobook.')}</p>
        ) : (
          <div className="gev-actions">
            <button type="button" className="g-btn g-btn-primary gev-act" onClick={() => c.setShowPhotobookModal(true)}><Eye size={15} aria-hidden /> {t('Browse')}</button>
            <button type="button" className="g-btn g-btn-ghost gev-act" onClick={() => c.setNotificationModal({ show: true, title: 'Coming Soon', message: 'Share functionality coming soon!', type: 'info' })}><Share2 size={15} aria-hidden /> {t('Share')}</button>
            <button type="button" className="g-btn g-btn-ghost gev-act" onClick={downloadAll}><Download size={15} aria-hidden /> {t('Download')}</button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function GlassGallery({ ctl: c, modals }: { ctl: Ctl; modals: React.ReactNode }) {
  const { t } = useLanguage();
  const createPhotobook = () => {
    if (c.photobook) c.setNotificationModal({ show: true, title: 'Photobook Exists', message: 'You already have a photobook created. Only one photobook is supported at this time.', type: 'info' });
    else c.setShowCreatePhotobookModal(true);
  };
  return (
    <div className="gp-page gev-page">
      <PageHeader eyebrow="Library" title="My gallery" subtitle="Albums your photographers delivered, and your photobook." action={
        <span className="gc-head-actions">
          {c.photobook && <button type="button" className="g-btn g-btn-ghost" onClick={() => c.setViewingPhotobooks(!c.viewingPhotobooks)}><BookOpen size={16} aria-hidden /> {c.viewingPhotobooks ? t('View albums') : t('View photobook')}</button>}
          <button type="button" className="g-btn g-btn-primary" onClick={createPhotobook}><Plus size={16} aria-hidden /> {t('Create photobook')}</button>
        </span>
      } />
      <div className="gc-sums">
        <Stat label="Albums" value={c.albums.length} />
        <Stat label="Photos" value={Number(c.totalPhotos || 0).toLocaleString()} />
        <Stat label="Downloaded" value={c.totalDownloaded} />
        <Stat label="Favorites" value={<><Heart size={16} aria-hidden className="gc-fav" /> {c.totalFavorites}</>} />
      </div>
      {!c.viewingPhotobooks && (
        <div className="gp-toolbar gc-toolbar">
          {(c.archivedCount > 0 || c.albumTab === 'archived') ? (
            <Segmented<'all' | 'archived'> label="Albums" value={c.albumTab} onChange={c.setAlbumTab} options={[{ key: 'all', label: 'All albums' }, { key: 'archived', label: 'Archived', count: c.archivedCount }]} />
          ) : <span />}
          <div className="gc-tools ggl-tools">
            <label className="gc-search"><Search size={15} aria-hidden /><span className="sr-only">{t('Search albums or photographers')}</span>
              <input type="search" value={c.searchQuery} onChange={(e) => c.setSearchQuery(e.target.value)} placeholder={t('Search albums or photographers')} /></label>
            <label className="gc-sort"><span className="sr-only">{t('Category')}</span>
              <select value={c.filterCategory} onChange={(e) => c.setFilterCategory(e.target.value)}>
                {c.categories.map((x: string) => <option key={x} value={x}>{x === 'All' ? t('All categories') : t(x)}</option>)}
              </select></label>
            <label className="gc-sort"><span className="sr-only">{t('Photographer')}</span>
              <select value={c.filterPhotographer} onChange={(e) => c.setFilterPhotographer(e.target.value)}>
                {c.photographers.map((x: string) => <option key={x} value={x}>{x === 'All' ? t('All photographers') : x}</option>)}
              </select></label>
            <div className="gp-seg gc-layout" role="group" aria-label={t('Layout')}>
              <button type="button" className={`gp-seg-btn${c.viewMode === 'grid' ? ' is-on' : ''}`} aria-pressed={c.viewMode === 'grid'} aria-label={t('Grid')} onClick={() => c.setViewMode('grid')}><LayoutGrid size={16} aria-hidden /></button>
              <button type="button" className={`gp-seg-btn${c.viewMode === 'list' ? ' is-on' : ''}`} aria-pressed={c.viewMode === 'list'} aria-label={t('List')} onClick={() => c.setViewMode('list')}><List size={16} aria-hidden /></button>
            </div>
          </div>
        </div>
      )}
      {c.viewingPhotobooks && c.photobook ? <div className="gev-grid"><PhotobookCard c={c} /></div>
        : c.isLoadingAlbums ? <RowsSkeleton rows={3} height={240} />
        : c.albumsError ? <ErrorState message="We could not load your albums." onRetry={c.fetchAlbums} />
        : !c.albums.length ? <EmptyState icon={<Images size={20} />} title="No albums yet" body="Albums your photographers share after a completed event appear here, ready to browse, download and turn into a photobook." />
        : !c.filteredAlbums.length ? <EmptyState icon={<Search size={20} />} title="No albums match" body="Try another filter or search." />
        : <div className={c.viewMode === 'grid' ? 'gev-grid' : 'gev-list'}>{c.filteredAlbums.map((a: Album) => <AlbumCard key={a.id} c={c} a={a} list={c.viewMode === 'list'} />)}</div>}
      {modals}
    </div>
  );
}
