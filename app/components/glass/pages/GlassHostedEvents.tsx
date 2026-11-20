'use client';

/**
 * My hosted events in Compact Glass. The list, the filter (Upcoming / Live / Ended), the row menu (Unpublish with its impact
 * warning and confirmation, Republish, wish invites), Go live / Back to stream and the Host an event form are the classic
 * page's own behaviour: rows use the shared useHostedRow hook and the form and stream are passed in. Only presentation is new.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { MoreHorizontal, Plus, Radio } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { UNPUBLISH_BODY, type HostedBucket, type HostedEvent, type HostingEligibility, type UnpublishImpact } from '@/lib/hosting/hostedEvents';
import { formatEventDay } from '@/lib/events/eventStatus';
import { wishInvitesStatus } from '@/lib/wishes/wishInvites';
import { useHostedRow } from '../../useHostedRow';
import { Card, Chip, ConfirmDialog, DateTile, EmptyState, ErrorState, PageHeader, RowsSkeleton, Segmented, type Tone } from '../ui';

const TABS: { key: HostedBucket; label: string }[] = [{ key: 'upcoming', label: 'Upcoming' }, { key: 'live', label: 'Live' }, { key: 'ended', label: 'Ended' }];

export interface HostedRowDeps {
  now: number;
  onLive: (e: HostedEvent) => void;
  onChanged: () => void;
  setPublished: (id: string, published: boolean) => Promise<void>;
  loadImpact: (id: string) => Promise<UnpublishImpact | undefined>;
  setInvites: (id: string, allow: boolean) => Promise<void>;
}

function GlassHostedRow({ event, deps }: { event: HostedEvent; deps: HostedRowDeps }) {
  const { t } = useLanguage();
  const r = useHostedRow(event, deps.now, {
    onChanged: deps.onChanged,
    setPublished: (p) => deps.setPublished(event.id, p),
    loadImpact: () => deps.loadImpact(event.id),
    setInvites: (a) => deps.setInvites(event.id, a),
  });
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!r.menu) return;
    const onDoc = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) r.setMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') r.setMenu(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [r.menu, r.setMenu]); // eslint-disable-line react-hooks/exhaustive-deps
  const tone: Tone = r.status === 'LIVE' ? 'error' : r.status === 'ENDED' ? 'neutral' : r.soon ? 'pending' : 'info';
  const day = formatEventDay(event.eventDate) || event.eventDate;
  return (
    <li>
      <Card className="gp-hosted">
        <div className="gp-hosted-main">
          <DateTile date={event.eventDate} />
          <div className="gp-row-text">
            <strong className="g-ellipsis">{event.title}</strong>
            <small className="g-ellipsis">{[day, event.streamFee ? t('Paid') : t('Free')].filter(Boolean).join(' · ')}</small>
            <span className="gp-chips-inline">
              <Chip tone={tone}>{r.status === 'LIVE' ? <Radio size={12} aria-hidden /> : null}{t(r.label)}</Chip>
              {!event.published && <Chip tone="pending">{t('Unpublished')}</Chip>}
            </span>
          </div>
        </div>
        <div className="gp-hosted-actions">
          {r.canGoLive && (
            <button type="button" className="g-btn gp-btn-live" onClick={() => deps.onLive(event)}
              aria-label={`${r.status === 'LIVE' ? t('Back to the stream of') : t('Go live with')} ${event.title}`}>
              <Radio size={15} aria-hidden /> {r.status === 'LIVE' ? t('Back to stream') : t('Go live')}
            </button>
          )}
          <div className="gp-menu-wrap" ref={menuRef}>
            <button type="button" className="g-icon-btn" aria-haspopup="menu" aria-expanded={r.menu}
              aria-label={`${t('More options for')} ${event.title}`} onClick={() => r.setMenu(!r.menu)}>
              <MoreHorizontal size={18} aria-hidden />
            </button>
            {r.menu && (
              <div role="menu" className="g-panel gp-menu">
                {r.action.kind === 'blocked' ? (
                  <div role="menuitem" className="gp-menu-note">{r.action.reason}</div>
                ) : r.action.kind === 'unpublish' ? (
                  <button type="button" role="menuitem" className="gp-menu-item" onClick={r.askUnpublish}>{t('Unpublish')}</button>
                ) : (
                  <button type="button" role="menuitem" className="gp-menu-item" disabled={r.busy} onClick={() => r.run(true)}>{r.busy ? t('Republishing...') : t('Republish')}</button>
                )}
                <button type="button" role="menuitem" className="gp-menu-item" disabled={r.busy} onClick={r.toggleInvites}>
                  {wishInvitesStatus(r.invites)} <span className="gp-menu-accent">{r.invites ? t('Turn off') : t('Turn on')}</span>
                </button>
                {r.error && !r.confirm ? <p role="alert" className="gp-menu-note" style={{ color: 'var(--g-error)' }}>{r.error}</p> : null}
              </div>
            )}
          </div>
        </div>
        {r.confirm && (
          <ConfirmDialog title="Unpublish this event?" confirmLabel="Unpublish" busy={r.busy} onClose={() => !r.busy && r.setConfirm(false)} onConfirm={() => r.run(false)}
            body={[UNPUBLISH_BODY, r.warning].filter(Boolean).join(' ')} />
        )}
      </Card>
      {r.confirm && r.error ? <p role="alert" className="gp-sub" style={{ color: 'var(--g-error)' }}>{r.error}</p> : null}
    </li>
  );
}

export default function GlassHostedEvents({ elig, eligError, onRetryElig, events, listError, onRetryEvents, tab, setTab, shown, onHost, deps, modals }: {
  elig: HostingEligibility | null; eligError: string | null; onRetryElig: () => void;
  events: HostedEvent[] | null; listError: string | null; onRetryEvents: () => void;
  tab: HostedBucket; setTab: (t: HostedBucket) => void; shown: HostedEvent[]; onHost: () => void; deps: HostedRowDeps; modals: ReactNode;
}) {
  const { t } = useLanguage();
  if (eligError) return <div className="gp-page gp-page-narrow"><ErrorState message={eligError} onRetry={onRetryElig} /></div>;
  if (!elig) return <div className="gp-page gp-page-narrow"><RowsSkeleton rows={3} /></div>;
  if (!elig.canHostFree) {
    return (
      <div className="gp-page gp-page-narrow">
        <EmptyState title="Hosting is not available"
          body={elig.reason === 'ROLE_CANNOT_HOST' || elig.reason === 'NOT_A_PHOTOGRAPHER'
            ? 'Hosting your own events is not available for this account type.'
            : 'Hosting your own events is not available yet. We will let you know when it is.'} />
      </div>
    );
  }
  const emptyTitle = tab === 'live' ? 'Nothing live right now' : tab === 'ended' ? 'No ended events yet' : 'No upcoming events';
  return (
    <div className="gp-page gp-page-narrow">
      <PageHeader eyebrow="Host" title="My hosted events" subtitle="Events you created and stream yourself, apart from the ones you were booked for."
        action={<button type="button" className="g-btn g-btn-primary" onClick={onHost}><Plus size={16} aria-hidden /> {t('Host an event')}</button>} />
      <Segmented<HostedBucket> label="Hosted events" value={tab} onChange={setTab} options={TABS} />
      {listError && !events ? (
        <ErrorState message={listError} onRetry={onRetryEvents} />
      ) : !events ? (
        <RowsSkeleton rows={3} height={84} />
      ) : shown.length === 0 ? (
        <EmptyState title={emptyTitle} body={tab === 'ended' ? 'Events you have streamed will show here.' : 'Create an event and go live in a minute.'}
          action={tab !== 'ended' ? <button type="button" className="g-btn g-btn-primary" onClick={onHost}>{t('Host an event')}</button> : undefined} />
      ) : (
        <ul className="gp-list gp-list-spaced">{shown.map((e) => <GlassHostedRow key={e.id} event={e} deps={deps} />)}</ul>
      )}
      {modals}
    </div>
  );
}
