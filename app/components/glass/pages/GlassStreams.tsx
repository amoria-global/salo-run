'use client';

/**
 * Completed streams (client and coordinator) in Compact Glass. Behaviour is the classic page's (useClientStreams,
 * moved verbatim); the chat, video and delete dialogs are the classic ClientStreamsPageModals, passed in as `modals`.
 *
 * Header, four totals, search and the event-type filter, then one card per stream: cover with type, duration and a
 * badge for unwatched video messages, title, date, photographer, viewers, chats and videos, with Chats and Videos
 * buttons and Delete. Loading, failed-load, empty and no-match states.
 */
import { CalendarDays, Clock, MessageSquare, Radio, Search, Trash2, Users, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { fmtDay, plural } from '../format';
import { Avatar, Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton } from '../ui';
import type { ClientStreamsController } from '@/app/components/streams/useClientStreams';

type Ctl = ClientStreamsController;

function Stat({ label, value }: { label: string; value: ReactNode }) {
  const { t } = useLanguage();
  return <Card className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{value}</strong></Card>;
}

export default function GlassStreams({ ctl: c, modals }: { ctl: Ctl; modals: ReactNode }) {
  const { t, language } = useLanguage();
  const sum = (k: 'totalViewers' | 'totalMessages' | 'totalVideoMessages') => c.streams.reduce((a, s) => a + (s[k] || 0), 0);
  let content: ReactNode;
  if (!c.streamsLoaded) content = <RowsSkeleton rows={3} height={140} />;
  else if (c.streamsError && c.streams.length === 0) content = <ErrorState message={t('We could not load your streams.')} onRetry={() => { void c.fetchStreams(); }} />;
  else if (c.streams.length === 0) content = <EmptyState icon={<Radio size={28} aria-hidden />} title={t('No completed streams yet')} body={t('When a live stream of your event ends, its chat and video messages are kept here.')} />;
  else if (c.filteredStreams.length === 0) content = <EmptyState icon={<Search size={28} aria-hidden />} title={t('No completed streams found')} body={t('Try another search or clear the filter.')} />;
  else {
    content = (
      <div className="gst-grid">
        {c.filteredStreams.map((s, i) => {
          const unseen = c.getUnviewedVideoCount(s);
          return (
            <Card key={s.id ?? i} className="gst-card">
              <div className="gst-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.coverImage || '/coverr.jpg'} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                <span className="gst-cover-chips">
                  {s.eventType ? <Chip tone="neutral">{t(s.eventType)}</Chip> : null}
                  {unseen > 0 ? <Chip tone="accent">{plural(unseen, 'new video', 'new videos', t)}</Chip> : null}
                </span>
                {s.duration ? <span className="gst-duration"><Clock size={12} aria-hidden /> {s.duration}</span> : null}
              </div>
              <div className="gst-body">
                <div className="gst-title">
                  <strong>{s.streamTitle}</strong>
                  <button type="button" className="g-btn g-btn-ghost gst-icon" aria-label={`${t('Delete')} ${s.streamTitle}`} onClick={() => c.setDeleteTarget(s)}>
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
                <small className="gst-meta"><CalendarDays size={13} aria-hidden /> {fmtDay(s.streamDate, language) || c.formatDate(s.streamDate)}{s.streamTime ? ` · ${s.streamTime}` : ''}</small>
                {s.photographerName ? (
                  <span className="gst-person"><Avatar name={s.photographerName} src={s.photographerImage || null} size={28} /> {s.photographerName}</span>
                ) : null}
                <div className="gst-facts">
                  <span title={t('Viewers')}><Users size={14} aria-hidden /> <span className="g-num">{s.totalViewers}</span> <span className="sr-only">{t('Viewers')}</span></span>
                  <span title={t('Chat messages')}><MessageSquare size={14} aria-hidden /> <span className="g-num">{s.totalMessages}</span> <span className="sr-only">{t('Chat messages')}</span></span>
                  <span title={t('Video messages')}><Video size={14} aria-hidden /> <span className="g-num">{s.totalVideoMessages}</span> <span className="sr-only">{t('Video messages')}</span></span>
                </div>
                <div className="gst-actions">
                  <button type="button" className="g-btn" onClick={() => { c.setSelectedStream(s); c.setShowMessagesModal(true); }}><MessageSquare size={16} aria-hidden /> {t('Chats')}</button>
                  <button type="button" className="g-btn" onClick={() => { c.setSelectedStream(s); c.setShowVideosModal(true); }}><Video size={16} aria-hidden /> {t('Videos')}</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
  return (
    <div className="g-page gst-page">
      <PageHeader eyebrow={t('Library')} title={t('Completed streams')} subtitle={t('Browse messages and videos from your past event streams.')} />
      <div className="gc-sums">
        <Stat label="Total streams" value={c.streams.length} />
        <Stat label="Total viewers" value={sum('totalViewers').toLocaleString()} />
        <Stat label="Chat messages" value={sum('totalMessages')} />
        <Stat label="Video messages" value={sum('totalVideoMessages')} />
      </div>
      <div className="gph-toolbar">
        <label className="gph-search">
          <Search size={16} aria-hidden />
          <input type="search" value={c.searchQuery} onChange={(e) => c.setSearchQuery(e.target.value)} placeholder={t('Search streams')} aria-label={t('Search streams')} />
        </label>
        <div className="gph-filters" role="group" aria-label={t('Event type')}>
          {c.eventTypes.map((type) => (
            <button key={type} type="button" className={`g-chip${c.filterType === type ? ' is-active' : ''}`} aria-pressed={c.filterType === type} onClick={() => c.setFilterType(type)}>
              {t(type === 'all' ? 'All' : type)}
            </button>
          ))}
        </div>
      </div>
      {content}
      {modals}
    </div>
  );
}
