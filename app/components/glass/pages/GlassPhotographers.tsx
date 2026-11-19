'use client';

/**
 * Booked photographers (client and coordinator) in Compact Glass. Behaviour is the classic page's
 * (useBookedPhotographers, moved verbatim); every dialog (profile, rebook, review and tip, booking payment, invite,
 * report, success) is the classic BookedPhotographersPageModals, passed in as `modals`.
 *
 * Header with Invite new, the All / Favorites / Pending payments switch with counts, search, sort, event-type filter
 * and Grid / List, then one card per photographer: bookings with you, rating, last booking, total spent, the first
 * unpaid booking's Pay (Retry after a failure), Message, Review once an event is completed, Rebook, favourite and a ⋯
 * menu (View profile, Report). Opening a card shows the classic profile dialog.
 *
 * Message opens the inbox on that photographer (the classic button had no action).
 */
import Link from 'next/link';
import { BadgeCheck, Heart, MapPin, MessageCircle, RotateCw, Search, SlidersHorizontal, Star, UserPlus, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { plural } from '../format';
import { Avatar, Card, Chip, EmptyState, ErrorState, OverflowMenu, PageHeader, RowsSkeleton, Segmented } from '../ui';
import type { BookedPhotographersController } from '@/app/components/photographers/useBookedPhotographers';

type Ctl = BookedPhotographersController;
type Photographer = Ctl['photographers'][number];

const SORTS = [
  { value: 'recent-desc', label: 'Most recent' },
  { value: 'recent-asc', label: 'Oldest first' },
  { value: 'rating-desc', label: 'Highest rated' },
  { value: 'bookings-desc', label: 'Most booked' },
  { value: 'spent-desc', label: 'Most spent' },
];

function openRebook(c: Ctl, p: Photographer) {
  c.setRebookPhotographer(p); c.setSelectedRebookEventId(''); c.setRebookEventType(''); c.setRebookDate(''); c.setRebookTime('');
  c.setRebookLocation(''); c.setRebookNotes(''); c.setShowRebookModal(true);
}
function openReview(c: Ctl, p: Photographer) {
  c.setReviewPhotographer(p); c.setReviewRating(p.myRating || 5); c.setReviewText(p.myReview || ''); c.setTipAmount(''); c.setCustomTipAmount('');
  c.setShowReviewModal(true);
}

function PhotographerCard({ c, p, list }: { c: Ctl; p: Photographer; list: boolean }) {
  const { t } = useLanguage();
  const name = `${p.firstName} ${p.lastName}`.trim();
  const unpaid = p.bookings.find((b) => b.paymentStatus !== 'paid');
  const due = unpaid ? unpaid.totalAmount - unpaid.paidAmount : 0;
  const place = [p.location.city, p.location.country].filter(Boolean).join(', ');
  const inbox = `/user/${c.userRole === 'event-coordinator' ? 'event-coordinator' : 'client'}/inbox?photographerId=${encodeURIComponent(p.id)}`;
  const action = (e: React.MouseEvent, fn: () => void) => { e.stopPropagation(); fn(); };
  return (
    <Card className={`gph-card${list ? ' is-list' : ''}`}>
      {!list ? (
        <button type="button" className="gph-cover" onClick={() => c.setSelectedPhotographer(p)} aria-label={`${t('View profile')} ${name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.coverImage || '/coverr.jpg'} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
          <span className="gph-cover-chip"><Chip tone="neutral">{plural(p.totalBookingsWithClient, 'booking', 'bookings', t)}</Chip></span>
        </button>
      ) : null}
      <div className="gph-body">
        <div className="gph-who">
          <Avatar name={name || '?'} src={p.profileImage || null} size={list ? 44 : 52} />
          <button type="button" className="gph-name" onClick={() => c.setSelectedPhotographer(p)}>
            <strong>{name}{p.verified ? <BadgeCheck size={16} aria-label={t('Verified')} className="gph-verified" /> : null}</strong>
            {place ? <small><MapPin size={12} aria-hidden /> {place}</small> : null}
          </button>
          <button type="button" className={`g-btn g-btn-ghost gph-fav${p.isFavorite ? ' is-on' : ''}`} aria-pressed={p.isFavorite}
            aria-label={t(p.isFavorite ? 'Remove from favorites' : 'Add to favorites')} onClick={(e) => action(e, () => c.toggleFavorite(p.id))}>
            <Heart size={18} aria-hidden fill={p.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <OverflowMenu label={`${t('More actions')} ${name}`} items={[
            { key: 'profile', label: t('View profile'), onSelect: () => c.setSelectedPhotographer(p) },
            { key: 'report', label: t('Report'), danger: true, onSelect: () => { c.setReportPhotographer(p); c.setShowReportModal(true); } },
          ]} />
        </div>

        <div className="gph-facts">
          <span><Star size={14} aria-hidden className="gph-star" /> {p.rating ? p.rating.toFixed(1) : t('New')} <small>({plural(p.reviewCount, 'review', 'reviews', t)})</small></span>
          {list ? <span>{plural(p.totalBookingsWithClient, 'booking', 'bookings', t)}</span> : null}
          <span className="gph-spent"><small>{t('Total spent')}</small> <strong className="g-num">{c.formatPrice(p.totalSpent)}</strong></span>
        </div>
        {p.lastEventName || p.lastBookingDate ? (
          <p className="gph-last"><small>{t('Last booking')}</small> {p.lastEventName || '-'}{p.lastEventType ? ` · ${t(p.lastEventType)}` : ''}{p.lastBookingDate ? ` · ${c.formatDate(p.lastBookingDate)}` : ''}</p>
        ) : null}

        <div className="gph-actions">
          {unpaid ? (
            <button type="button" className="g-btn g-btn-primary" onClick={(e) => action(e, () => { c.setPaymentBooking({ photographer: p, booking: unpaid }); c.setShowPaymentModal(true); })}>
              {unpaid.paymentStatus === 'failed' ? <><RotateCw size={14} aria-hidden /> {t('Retry payment')}</> : <>{t('Pay')} {c.formatPrice(due)}</>}
            </button>
          ) : null}
          <Link className="g-btn" href={inbox} onClick={(e) => e.stopPropagation()}><MessageCircle size={16} aria-hidden /> {t('Message')}</Link>
          {c.hasCompletedEvent(p) ? (
            <button type="button" className="g-btn" onClick={(e) => action(e, () => openReview(c, p))}>
              <Star size={14} aria-hidden /> {t(p.myReview ? 'Edit review' : 'Review')}
            </button>
          ) : null}
          <button type="button" className="g-btn" onClick={(e) => action(e, () => openRebook(c, p))}><RotateCw size={14} aria-hidden /> {t('Rebook')}</button>
        </div>
      </div>
    </Card>
  );
}

export default function GlassPhotographers({ ctl: c, modals }: { ctl: Ctl; modals: ReactNode }) {
  const { t } = useLanguage();
  const list = c.viewMode === 'list';
  const favorites = c.photographers.filter((p) => p.isFavorite).length;
  let content: ReactNode;
  if (!c.photographersLoaded) content = <RowsSkeleton rows={4} height={120} />;
  else if (c.photographersError && c.photographers.length === 0) content = <ErrorState message={t('We could not load your photographers.')} onRetry={c.retryPhotographers} />;
  else if (c.photographers.length === 0) {
    content = (
      <EmptyState icon={<Users size={28} aria-hidden />} title={t('No booked photographers yet')}
        body={t('Photographers you book show here, with your bookings, payments and reviews.')}
        action={<button type="button" className="g-btn g-btn-primary" onClick={() => { c.setShowInviteModal(true); c.setInviteEmail(''); c.setInviteError(null); c.setInviteCopied(false); }}><UserPlus size={16} aria-hidden /> {t('Invite a photographer')}</button>} />
    );
  } else if (c.filteredPhotographers.length === 0) {
    content = <EmptyState icon={<Search size={28} aria-hidden />} title={t('No photographers found')} body={t('Try another search or clear the filter.')} />;
  } else {
    content = <div className={list ? 'gph-list' : 'gph-grid'}>{c.filteredPhotographers.map((p) => <PhotographerCard key={p.id} c={c} p={p} list={list} />)}</div>;
  }
  return (
    <div className="g-page gph-page">
      <PageHeader eyebrow={t('Relationships')} title={t('Booked photographers')}
        action={<button type="button" className="g-btn g-btn-primary" onClick={() => { c.setShowInviteModal(true); c.setInviteEmail(''); c.setInviteError(null); c.setInviteCopied(false); }}><UserPlus size={16} aria-hidden /> {t('Invite new')}</button>} />

      {c.photographersWithPendingPayments.length > 0 ? (
        <Card className="gpay-notice" role="status">
          <span>
            <strong>{t('You have')} {c.formatPrice(c.totalPendingAmount)} {t('in pending payments')}</strong>
            <small>{plural(c.photographersWithPendingPayments.length, 'photographer is waiting for payment', 'photographers are waiting for payment', t)}</small>
          </span>
          <button type="button" className="g-btn" onClick={() => c.setActiveTab('pending_payments')}>{t('Show')}</button>
        </Card>
      ) : null}

      <Segmented label={t('Photographers')} value={c.activeTab} onChange={(k) => c.setActiveTab(k)} options={[
        { key: 'all', label: 'All photographers', count: c.photographers.length },
        { key: 'favorites', label: 'Favorites', count: favorites },
        { key: 'pending_payments', label: 'Pending payments', count: c.photographersWithPendingPayments.length },
      ]} />

      <div className="gph-toolbar">
        <label className="gph-search">
          <Search size={16} aria-hidden />
          <input type="search" value={c.searchQuery} onChange={(e) => c.setSearchQuery(e.target.value)} placeholder={t('Search photographers')} aria-label={t('Search photographers')} />
        </label>
        <label className="gph-sort">
          <span className="sr-only">{t('Sort by')}</span>
          <select value={`${c.sortBy}-${c.sortOrder}`} aria-label={t('Sort by')} onChange={(e) => {
            const [s, o] = e.target.value.split('-');
            c.setSortBy(s as typeof c.sortBy); c.setSortOrder(o as typeof c.sortOrder);
          }}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{t(s.label)}</option>)}
          </select>
        </label>
        {c.specializations.length ? (
          <button type="button" className={`g-btn${c.showFilters || c.selectedSpecialization ? ' is-on' : ''}`} aria-expanded={c.showFilters} onClick={() => c.setShowFilters(!c.showFilters)}>
            <SlidersHorizontal size={16} aria-hidden /> {t('Filters')}
          </button>
        ) : null}
        <Segmented label={t('Layout')} value={c.viewMode} onChange={(k) => c.setViewMode(k)} options={[{ key: 'grid', label: 'Grid' }, { key: 'list', label: 'List' }]} />
      </div>
      {c.showFilters && c.specializations.length ? (
        <div className="gph-filters" role="group" aria-label={t('Event type')}>
          {c.specializations.map((s) => (
            <button key={s} type="button" className={`g-chip${c.selectedSpecialization === s ? ' is-active' : ''}`} aria-pressed={c.selectedSpecialization === s}
              onClick={() => c.setSelectedSpecialization(c.selectedSpecialization === s ? null : s)}>{t(s)}</button>
          ))}
          {c.selectedSpecialization ? <button type="button" className="g-btn g-btn-ghost" onClick={() => c.setSelectedSpecialization(null)}>{t('Clear filter')}</button> : null}
        </div>
      ) : null}

      {c.photographersLoaded && c.photographers.length > 0 ? (
        <p className="gph-count" aria-live="polite">{t('Showing')} {plural(c.filteredPhotographers.length, 'photographer', 'photographers', t)}</p>
      ) : null}
      {content}
      {modals}
    </div>
  );
}
