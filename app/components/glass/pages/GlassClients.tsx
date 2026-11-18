'use client';

/**
 * Clients in Compact Glass (design reference: connekyt-web-clients-reference.png). The behaviour is the classic page's,
 * shared through usePhotographerClients; this file is presentation only.
 *
 * Desktop: header with List/Grid and Add client, four summary cards, filters with readable counts and search, then a
 * fixed-column list (Client, Last booking, Bookings, Total spent, Review, Status, Actions) where nothing is positioned
 * over text. Phones and Grid: cards with a Last / Bookings / Spent strip, Message as the one primary action and tips
 * and the review as a quiet footer line. Tips live in the ⋯ menu, never as a big button.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Gift, Image as ImageIcon, LayoutGrid, List, MapPin, MessageSquare, Plus, Search, Star, Heart, Users, Copy } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { fetchPublicProfileUrl } from '@/app/lib/publicProfileLink';
import { Money } from '../Money';
import { fmtDay, plural } from '../format';
import {
  Avatar, Card, Chip, ConfirmDialog, EmptyState, ErrorState, GlassModal, OverflowMenu, PageHeader, RowsSkeleton, Segmented, VirtualRows,
} from '../ui';
import type { Client, ClientsController, FilterType, BookingsFilter, APIBooking } from '@/app/components/clients/usePhotographerClients';

const P = '/user/photographer';
const inboxHref = (c: Client) => `${P}/inbox?client=${encodeURIComponent(`${c.firstName} ${c.lastName}`)}`;
const GALLERY_HREF = `${P}/events`;
const nameOf = (c: Client) => `${c.firstName} ${c.lastName}`.trim() || 'Client';
const placeOf = (c: Client) => [c.location.city, c.location.country].filter(Boolean).join(', ');
const tipsOf = (c: Client) => c.tipsAndBonuses.filter((x) => x.type === 'tip').reduce((s, x) => s + (Number(x.amount) || 0), 0);
const isPendingPay = (s: string) => s === 'pending' || s === 'partially_paid' || s === 'failed';

type Sort = 'recent-desc' | 'recent-asc' | 'bookings-desc' | 'spent-desc';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'recent-desc', label: 'Most recent' }, { key: 'recent-asc', label: 'Oldest first' },
  { key: 'bookings-desc', label: 'Most bookings' }, { key: 'spent-desc', label: 'Highest spent' },
];

function useWide(min: number) {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const m = window.matchMedia(`(min-width: ${min}px)`);
    const on = () => setWide(m.matches);
    on(); m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [min]);
  return wide;
}

function StatusChip({ c }: { c: Client }) {
  const { t } = useLanguage();
  if (c.status === 'inactive') return <Chip tone="neutral">{t('Inactive')}</Chip>;
  if (!c.totalBookings) return <Chip tone="info">{t('New')}</Chip>;
  return <Chip tone="success">{t('Active')}</Chip>;
}

function ReviewText({ c }: { c: Client }) {
  const { t } = useLanguage();
  if (!c.review?.rating) return <span className="gc-quiet">{t('No review')}</span>;
  return <span className="gc-review"><Star size={14} aria-hidden className="gc-star" /> <span className="g-num">{Number(c.review.rating).toFixed(1)}</span><span className="sr-only"> {t('out of 5')}</span></span>;
}

function LastBooking({ c, stacked = true }: { c: Client; stacked?: boolean }) {
  const { t, language } = useLanguage();
  const kind = c.lastEventType || c.lastEventName;
  const when = fmtDay(c.lastBookingDate, language);
  if (!kind && !when) return <span className="gc-quiet">{t('No bookings yet')}</span>;
  return stacked
    ? <span className="gc-two"><strong className="g-ellipsis">{kind ? t(kind) : t('Booking')}</strong>{when ? <small className="g-ellipsis">{when}</small> : null}</span>
    : <strong className="g-ellipsis">{kind ? t(kind) : when}</strong>;
}

function ClientMenu({ c, ctl, onDetails }: { c: Client; ctl: ClientsController; onDetails: () => void }) {
  const { t } = useLanguage();
  return (
    <OverflowMenu label={`${t('More options for')} ${nameOf(c)}`} items={[
      { key: 'fav', label: <><Heart size={15} aria-hidden /> {c.isFavorite ? t('Remove from favorites') : t('Add to favorites')}</>, onSelect: () => ctl.toggleFavorite(c.id) },
      { key: 'tips', label: <><Gift size={15} aria-hidden /> {t('Tips and bonuses')}</>, onSelect: () => { ctl.setTipsClient(c); ctl.setShowTipsModal(true); } },
      { key: 'bookings', label: <><Users size={15} aria-hidden /> {t('View bookings')}</>, onSelect: onDetails },
      { key: 'delete', label: t('Remove client'), danger: true, onSelect: () => ctl.setDeleteConfirmClient(c) },
    ]} />
  );
}

function Actions({ c, ctl, onDetails, wide }: { c: Client; ctl: ClientsController; onDetails: () => void; wide?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className={`gc-actions${wide ? ' gc-actions-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
      <Link href={inboxHref(c)} className="g-btn g-btn-primary gc-message"><MessageSquare size={15} aria-hidden /> {t('Message')}</Link>
      <Link href={GALLERY_HREF} className="g-icon-btn" aria-label={`${t('Gallery')}: ${nameOf(c)}`} title={t('Gallery')}><ImageIcon size={17} aria-hidden /></Link>
      <ClientMenu c={c} ctl={ctl} onDetails={onDetails} />
    </div>
  );
}

function ListRow({ c, ctl }: { c: Client; ctl: ClientsController }) {
  const { t } = useLanguage();
  const place = placeOf(c);
  return (
    <div role="row" className="gc-row" tabIndex={0} onClick={() => ctl.setSelectedClient(c)}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) ctl.setSelectedClient(c); }} aria-label={nameOf(c)}>
      <div role="cell" className="gc-cell gc-who">
        <Avatar name={nameOf(c)} src={c.profileImage} size={40} />
        <span className="gc-two">
          <strong className="g-ellipsis">{nameOf(c)}{c.isFavorite ? <Heart size={13} aria-label={t('Favorite')} className="gc-fav" /> : null}</strong>
          <small className="g-ellipsis"><MapPin size={12} aria-hidden /> {place || t('Location not set')}</small>
        </span>
      </div>
      <div role="cell" className="gc-cell"><LastBooking c={c} /></div>
      <div role="cell" className="gc-cell g-num">{c.totalBookings}</div>
      <div role="cell" className="gc-cell"><Money amount={c.totalSpent} /></div>
      <div role="cell" className="gc-cell"><ReviewText c={c} /></div>
      <div role="cell" className="gc-cell"><StatusChip c={c} /></div>
      <div role="cell" className="gc-cell gc-cell-end"><Actions c={c} ctl={ctl} onDetails={() => ctl.setSelectedClient(c)} wide /></div>
    </div>
  );
}

function ClientCard({ c, ctl }: { c: Client; ctl: ClientsController }) {
  const { t } = useLanguage();
  const place = placeOf(c);
  const tips = tipsOf(c);
  return (
    <Card className="gc-card">
      <button type="button" className="gc-card-head" onClick={() => ctl.setSelectedClient(c)} aria-label={`${t('Details')}: ${nameOf(c)}`}>
        <Avatar name={nameOf(c)} src={c.profileImage} size={44} />
        <span className="gc-two">
          <strong className="g-ellipsis">{nameOf(c)}{c.isFavorite ? <Heart size={13} aria-label={t('Favorite')} className="gc-fav" /> : null}</strong>
          <small className="g-ellipsis"><MapPin size={12} aria-hidden /> {place || t('Location not set')}</small>
        </span>
        <StatusChip c={c} />
      </button>
      <dl className="gc-strip">
        <div><dt>{t('Last')}</dt><dd><LastBooking c={c} stacked={false} /></dd></div>
        <div><dt>{t('Bookings')}</dt><dd>{plural(c.totalBookings, 'booking', 'bookings', t)}</dd></div>
        <div><dt>{t('Spent')}</dt><dd><Money amount={c.totalSpent} /></dd></div>
      </dl>
      <Actions c={c} ctl={ctl} onDetails={() => ctl.setSelectedClient(c)} />
      <p className="gc-foot">
        <Gift size={13} aria-hidden /> {tips > 0 ? <>{t('Tips')} <Money amount={tips} /></> : t('No tips yet')}
        {' · '}
        {c.review?.rating ? <><Star size={12} aria-hidden className="gc-star" /> <span className="g-num">{Number(c.review.rating).toFixed(1)}</span></> : t('No review yet')}
      </p>
    </Card>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <Card className="gc-sum">
      <span className="gc-sum-label">{t(label)}</span>
      <strong className="g-num gc-sum-value">{value}</strong>
      {sub ? <small className="gc-sum-sub">{sub}</small> : null}
    </Card>
  );
}

function AddClientDialog({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { user } = useDashboardAuth();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = await fetchPublicProfileUrl(user);
        if (alive && url) setUrl(url);
      } catch { /* the copy button stays disabled */ }
    })();
    return () => { alive = false; };
  }, [user]);
  const copy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setNote(t('Link copied.')); } catch { setNote(url); }
  };
  return (
    <GlassModal title="Add a client" onClose={onClose} footer={
      <>
        <button type="button" className="g-btn g-btn-ghost" onClick={onClose}>{t('Close')}</button>
        <button type="button" className="g-btn g-btn-primary" disabled={!url} onClick={copy}><Copy size={15} aria-hidden /> {t('Copy profile link')}</button>
      </>
    }>
      <p className="gp-sub" style={{ margin: 0 }}>{t('Clients are added for you when they book you, buy your photos or message you. Share your profile link so new clients can find and book you.')}</p>
      {url ? <p className="gc-link g-ellipsis">{url.replace(/^https?:\/\//, '')}</p> : <p className="gp-sub">{t('Your public profile link is not available yet.')}</p>}
      {note ? <p role="status" className="gp-sub">{note}</p> : null}
    </GlassModal>
  );
}

function DetailsDialog({ c, ctl }: { c: Client; ctl: ClientsController }) {
  const { t, language } = useLanguage();
  const close = () => ctl.setSelectedClient(null);
  const place = placeOf(c);
  return (
    <GlassModal title="Client details" onClose={close} width={560} footer={
      <>
        <button type="button" className="g-btn gp-btn-quiet-danger" onClick={() => ctl.setDeleteConfirmClient(c)}>{t('Remove client')}</button>
        <Link href={GALLERY_HREF} className="g-btn g-btn-ghost"><ImageIcon size={15} aria-hidden /> {t('Gallery')}</Link>
        <Link href={inboxHref(c)} className="g-btn g-btn-primary"><MessageSquare size={15} aria-hidden /> {t('Message')}</Link>
      </>
    }>
      <div className="gc-detail-head">
        <Avatar name={nameOf(c)} src={c.profileImage} size={56} />
        <span className="gc-two">
          <strong>{nameOf(c)}{c.verified ? <span className="sr-only"> {t('Verified')}</span> : null}</strong>
          <small><MapPin size={12} aria-hidden /> {place || t('Location not set')}</small>
        </span>
        <button type="button" className="g-icon-btn" aria-pressed={c.isFavorite} aria-label={c.isFavorite ? t('Remove from favorites') : t('Add to favorites')} onClick={() => ctl.toggleFavorite(c.id)}>
          <Heart size={17} aria-hidden fill={c.isFavorite ? 'currentColor' : 'none'} className={c.isFavorite ? 'gc-fav' : undefined} />
        </button>
      </div>
      <dl className="gc-strip">
        <div><dt>{t('Bookings')}</dt><dd className="g-num">{c.totalBookings}</dd></div>
        <div><dt>{t('Total spent')}</dt><dd><Money amount={c.totalSpent} /></dd></div>
        <div><dt>{c.lastBookingDate ? t('Last booking') : t('Client since')}</dt><dd>{fmtDay(c.lastBookingDate || c.joinDate, language) || t('Not set')}</dd></div>
      </dl>
      {c.review?.rating ? (
        <section className="gc-section">
          <h3 className="gc-h">{t('Review')}</h3>
          <p className="gc-review"><Star size={14} aria-hidden className="gc-star" /> <span className="g-num">{Number(c.review.rating).toFixed(1)}</span> {c.review.reviewDate ? <small className="gc-quiet">· {fmtDay(c.review.reviewDate, language)}</small> : null}</p>
          {c.review.reviewText ? <p className="gp-sub" style={{ margin: 0 }}>{c.review.reviewText}</p> : null}
        </section>
      ) : null}
      <section className="gc-section">
        <h3 className="gc-h">{t('Recent bookings')}</h3>
        {c.bookings.length ? (
          <ul className="gc-blist">
            {c.bookings.map((b) => (
              <li key={b.id} className="gc-bitem">
                <span className="gc-two"><strong className="g-ellipsis">{b.eventName || t(b.eventType) || t('Booking')}</strong><small>{[t(b.eventType), fmtDay(b.eventDate, language)].filter(Boolean).join(' · ')}</small></span>
                <span className="gc-two gc-right"><Money amount={b.totalAmount} /><small>{isPendingPay(b.paymentStatus) ? <>{t('Paid')} <Money amount={b.paidAmount} /></> : t(b.paymentStatus === 'paid' ? 'Paid' : b.paymentStatus)}</small></span>
              </li>
            ))}
          </ul>
        ) : <p className="gc-quiet">{t('No bookings yet')}</p>}
      </section>
      <section className="gc-section">
        <h3 className="gc-h">{t('Contact')}</h3>
        <dl className="gc-contact">
          <div><dt>{t('Email')}</dt><dd className="g-ellipsis">{c.email || t('Not set')}</dd></div>
          <div><dt>{t('Phone')}</dt><dd>{c.phone || t('Not set')}</dd></div>
          <div><dt>{t('Last active')}</dt><dd>{fmtDay(c.lastActive, language) || t('Not set')}</dd></div>
        </dl>
      </section>
    </GlassModal>
  );
}

function TipsDialog({ c, ctl }: { c: Client; ctl: ClientsController }) {
  const { t, language } = useLanguage();
  const close = () => { ctl.setShowTipsModal(false); ctl.setTipsClient(null); };
  const tips = c.tipsAndBonuses.filter((x) => x.type === 'tip');
  const bonuses = c.tipsAndBonuses.filter((x) => x.type === 'bonus');
  const sum = (xs: typeof tips) => xs.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  return (
    <GlassModal title="Tips and bonuses" onClose={close} footer={<button type="button" className="g-btn g-btn-ghost" onClick={close}>{t('Close')}</button>}>
      <div className="gc-detail-head">
        <Avatar name={nameOf(c)} src={c.profileImage} size={44} />
        <span className="gc-two"><strong>{nameOf(c)}</strong><small>{placeOf(c) || t('Location not set')}</small></span>
      </div>
      <dl className="gc-strip">
        <div><dt>{t('Total tips received')}</dt><dd><Money amount={sum(tips)} /></dd></div>
        <div><dt>{t('Bonuses')}</dt><dd><Money amount={sum(bonuses)} /></dd></div>
      </dl>
      {c.tipsAndBonuses.length ? (
        <ul className="gc-blist">
          {c.tipsAndBonuses.map((x) => (
            <li key={x.id} className="gc-bitem">
              <span className="gc-two"><strong className="g-ellipsis">{x.eventName || t(x.type === 'tip' ? 'Tip' : 'Bonus')}</strong><small>{[t(x.type === 'tip' ? 'Tip' : 'Bonus'), fmtDay(x.date, language)].filter(Boolean).join(' · ')}</small>{x.message ? <small className="gc-quiet">“{x.message}”</small> : null}</span>
              <Money amount={x.amount} />
            </li>
          ))}
        </ul>
      ) : <p className="gc-quiet">{t('No tips yet')}</p>}
    </GlassModal>
  );
}

function BookingRequests({ ctl }: { ctl: ClientsController }) {
  const { t, language } = useLanguage();
  const tone = (s: string) => (s === 'pending' ? 'pending' : s === 'accepted' || s === 'confirmed' ? 'success' : 'error') as 'pending' | 'success' | 'error';
  const label = (s: string) => (s === 'accepted' || s === 'confirmed' ? 'Accepted' : s === 'rejected' || s === 'cancelled' ? 'Declined' : 'Pending');
  return (
    <>
      <div className="gp-toolbar">
        <Segmented<BookingsFilter> label="Filter booking requests" value={ctl.bookingsFilter} onChange={ctl.setBookingsFilter} options={[
          { key: 'all', label: 'All', count: ctl.bookings.length }, { key: 'pending', label: 'Pending', count: ctl.pendingCount },
          { key: 'accepted', label: 'Accepted', count: ctl.acceptedCount }, { key: 'rejected', label: 'Declined', count: ctl.rejectedCount },
        ]} />
      </div>
      {ctl.bookingsLoading && !ctl.bookings.length ? <RowsSkeleton rows={4} height={88} /> : !ctl.filteredBookings.length ? (
        <EmptyState title={ctl.bookings.length ? 'No booking requests match' : 'No booking requests yet'} body="New requests from clients show up here." />
      ) : (
        <ul className="gp-list gp-list-spaced">
          {ctl.filteredBookings.map((b: APIBooking) => {
            const s = ctl.getBookingStatus(b);
            const busy = ctl.processingBookingId === b.id;
            const where = b.location || b.address;
            return (
              <li key={b.id}>
                <Card className="gc-req">
                  <span className="gc-two">
                    <strong className="g-ellipsis">{ctl.getBookingClientName(b)}</strong>
                    <small>{[b.eventType ? t(b.eventType) : null, fmtDay(b.eventDate, language), b.eventTime || null].filter(Boolean).join(' · ')}</small>
                    {where ? <small className="g-ellipsis"><MapPin size={12} aria-hidden /> {where}</small> : null}
                    {b.packageName ? <small className="g-ellipsis">{t('Package')}: {b.packageName}</small> : null}
                    {b.notes ? <small className="gc-quiet">“{b.notes}”</small> : null}
                  </span>
                  <span className="gc-req-side">
                    <Money amount={ctl.getBookingAmount(b)} />
                    <Chip tone={tone(s)}>{t(label(s))}</Chip>
                    {s === 'pending' && (
                      <span className="gc-req-actions">
                        <button type="button" className="g-btn g-btn-ghost" disabled={busy} onClick={() => ctl.rejectBooking(b.id)}>{t('Decline')}</button>
                        <button type="button" className="g-btn g-btn-primary" disabled={busy} onClick={() => ctl.acceptBooking(b.id)}>{busy ? t('Please wait…') : t('Accept')}</button>
                      </span>
                    )}
                  </span>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function GlassClients({ ctl }: { ctl: ClientsController }) {
  const { t } = useLanguage();
  const wide = useWide(1024);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [adding, setAdding] = useState(false);
  const sort = `${ctl.sortBy}-${ctl.sortOrder}` as Sort;
  const setSort = (v: Sort) => { const [b, o] = v.split('-'); ctl.setSortBy(b as 'recent' | 'bookings' | 'spent'); ctl.setSortOrder(o as 'asc' | 'desc'); };
  const repeat = useMemo(() => ctl.clients.filter((c) => c.totalBookings >= 2).length, [ctl.clients]);
  const earned = useMemo(() => ctl.clients.reduce((s, c) => s + (c.totalSpent || 0), 0), [ctl.clients]);
  const bookingsTotal = useMemo(() => ctl.clients.reduce((s, c) => s + (c.totalBookings || 0), 0), [ctl.clients]);
  const showList = wide && layout === 'list';
  const list = ctl.filteredClients;

  return (
    <div className="gp-page gc-page">
      <PageHeader eyebrow="Clients" title="Your clients" subtitle="Everyone who booked you or bought your photos." action={
        <div className="gc-head-actions">
          {wide && (
            <div className="gp-seg gc-layout" role="group" aria-label={t('Layout')}>
              <button type="button" className={`gp-seg-btn${layout === 'list' ? ' is-on' : ''}`} aria-pressed={layout === 'list'} aria-label={t('List')} onClick={() => setLayout('list')}><List size={16} aria-hidden /></button>
              <button type="button" className={`gp-seg-btn${layout === 'grid' ? ' is-on' : ''}`} aria-pressed={layout === 'grid'} aria-label={t('Grid')} onClick={() => setLayout('grid')}><LayoutGrid size={16} aria-hidden /></button>
            </div>
          )}
          <button type="button" className="g-btn g-btn-primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden /> {t('Add client')}</button>
        </div>
      } />

      <Segmented<'clients' | 'bookings'> label="Clients or booking requests" value={ctl.pageTab} onChange={ctl.setPageTab} options={[
        { key: 'clients', label: 'Clients', count: ctl.clients.length },
        { key: 'bookings', label: 'Booking requests', count: ctl.pendingCount || null },
      ]} />

      {ctl.pageTab === 'bookings' ? <BookingRequests ctl={ctl} /> : (
        <>
          <div className="gc-sums">
            <SummaryCard label="Clients" value={ctl.clientsLoading ? '–' : ctl.clients.length} sub={plural(bookingsTotal, 'booking', 'bookings', t)} />
            <SummaryCard label="Repeat clients" value={ctl.clientsLoading ? '–' : repeat} sub={t('Booked you twice or more')} />
            <SummaryCard label="Total earned from clients" value={<Money amount={earned} />} sub={ctl.totalPendingAmount > 0 ? <>{t('Pending')} <Money amount={ctl.totalPendingAmount} /></> : t('Nothing pending')} />
            <SummaryCard label="Tips received" value={<Money amount={ctl.totalTips} />} sub={<>{t('Bonus')} <Money amount={ctl.platformBonus} /></>} />
          </div>

          <div className="gp-toolbar gc-toolbar">
            <Segmented<FilterType> label="Filter clients" value={ctl.activeFilter} onChange={ctl.setActiveFilter} options={[
              { key: 'all', label: wide ? 'All clients' : 'All', count: ctl.clients.length },
              { key: 'active', label: 'Active', count: ctl.clients.filter((c) => c.status === 'active').length },
              { key: 'favorites', label: wide ? 'Favorites' : 'Fav', count: ctl.clients.filter((c) => c.isFavorite).length },
              { key: 'pending_payments', label: wide ? 'Pending payments' : 'Pending', count: ctl.clientsWithPendingPayments.length },
            ]} />
            <div className="gc-tools">
              <label className="gc-search">
                <Search size={15} aria-hidden />
                <span className="sr-only">{t('Search clients')}</span>
                <input type="search" value={ctl.searchQuery} onChange={(e) => ctl.setSearchQuery(e.target.value)} placeholder={t('Search clients')} />
              </label>
              <label className="gc-sort">
                <span className="sr-only">{t('Sort clients')}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  {SORTS.map((s) => <option key={s.key} value={s.key}>{t(s.label)}</option>)}
                </select>
              </label>
            </div>
          </div>

          {ctl.clientsLoading ? <RowsSkeleton rows={5} height={64} /> : ctl.clientsError && !ctl.clients.length ? (
            <ErrorState message="We could not load your clients." onRetry={ctl.retryClients} />
          ) : !ctl.clients.length ? (
            <EmptyState icon={<Users size={20} />} title="No clients yet" body="When someone books you, buys your photos or messages you, they appear here."
              action={<button type="button" className="g-btn g-btn-primary" onClick={() => setAdding(true)}>{t('Share your profile')}</button>} />
          ) : !list.length ? (
            <EmptyState icon={<Search size={20} />} title="No clients match" body="Try another filter or search." />
          ) : showList ? (
            <Card className="gc-table" role="table" aria-label={t('Clients')}>
              <div role="row" className="gc-row gc-row-head">
                {['Client', 'Last booking', 'Bookings', 'Total spent', 'Review', 'Status', 'Actions'].map((h, i) => (
                  <div key={h} role="columnheader" className={`gc-cell${i === 6 ? ' gc-cell-end' : ''}`}>{t(h)}</div>
                ))}
              </div>
              <VirtualRows role="rowgroup" items={list} rowHeight={72} render={(c) => <ListRow key={c.id} c={c} ctl={ctl} />} />
            </Card>
          ) : (
            <div className="gc-grid">{list.map((c) => <ClientCard key={c.id} c={c} ctl={ctl} />)}</div>
          )}
        </>
      )}

      {adding && <AddClientDialog onClose={() => setAdding(false)} />}
      {ctl.selectedClient && <DetailsDialog c={ctl.selectedClient} ctl={ctl} />}
      {ctl.showTipsModal && ctl.tipsClient && <TipsDialog c={ctl.tipsClient} ctl={ctl} />}
      {ctl.deleteConfirmClient && (
        <ConfirmDialog title="Remove this client?" confirmLabel="Remove client" busy={ctl.deleting}
          body={`${nameOf(ctl.deleteConfirmClient)} ${t('will be removed from your clients. Their bookings and payments stay.')}`}
          onClose={() => !ctl.deleting && ctl.setDeleteConfirmClient(null)} onConfirm={() => ctl.deleteClient(ctl.deleteConfirmClient!.id)} />
      )}
    </div>
  );
}
