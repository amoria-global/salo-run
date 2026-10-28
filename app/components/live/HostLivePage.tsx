'use client';

/**
 * The host's Go Live page, laid out like the viewer's live page (docs/LIVE_EVENT_STRUCTURE.md):
 *   1 header   2 camera preview + Go live / End + stream health (StreamPreview, embedded)   3 info   4 tabs
 *   6 invite (prominent)   8 moderation queue   9 live chat.   Section 5, sending wishes, is hidden for the host.
 * It replaces the modal frame around StreamPreview with the page layout and passes every stream handler through, so
 * start, go live, pause, end and reset behave exactly as before.
 */
import React, { useMemo, useState } from 'react';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
import StreamPreview from '../StreamPreview';
import LiveChatPreviewDrawer from '../LiveChatPreviewDrawer';
import { HostWishInvitesRow } from '../wishes/HostWishInvitesRow';
import { EventHeader, EventInfo, EventTabs, InviteOthers, LiveSectionsStyles, ModerationQueue, WishVideoDialog, useHostWishes } from './index';
import { Icon } from './icons';
import type { LiveTab, Wish } from '@/lib/live/types';

type StreamPreviewProps = React.ComponentProps<typeof StreamPreview>;
type Props = Omit<StreamPreviewProps, 'embedded' | 'isOpen' | 'eventId'> & { eventId: string; /** The saved Wish invites setting; undefined on a server that predates it. */ wishInvites?: boolean };

export default function HostLivePage(props: Props) {
  const { eventId, eventTitle, onClose, connectionStatus, viewerCount = 0, theme } = props;
  const [tab, setTab] = useState<LiveTab>('live');
  const [chatOpen, setChatOpen] = useState(false);
  const [playing, setPlaying] = useState<Wish | null>(null);
  const fetcher = dashboardAuthFetch as (url: string, init?: RequestInit) => Promise<Response>;
  const hostWishes = useHostWishes(eventId, fetcher);
  const pending = useMemo(() => hostWishes.wishes.filter((w) => w.visibility === 'public' && w.status === 'pending').length, [hostWishes.wishes]);
  const [wishError, setWishError] = useState<string | null>(null);

  const onAir = connectionStatus === 'connected' || connectionStatus === 'paused';
  const share = async () => {
    const url = `https://connekyt.com/user/events/live-stream?eventId=${encodeURIComponent(eventId)}`;
    try {
      if (navigator.share) await navigator.share({ title: eventTitle, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* dismissed */
    }
  };
  const decide = (run: () => Promise<void>) => {
    setWishError(null);
    run().catch((e: unknown) => setWishError(e instanceof Error ? e.message : 'Could not update this wish.'));
  };

  return (
    <div
      className="lv lv-page"
      data-theme={theme}
      style={{ position: 'fixed', inset: 0, overflow: 'auto', zIndex: 1100, background: 'var(--lv-bg)' }}
      role="dialog"
      aria-label={`Go live: ${eventTitle}`}
    >
      <LiveSectionsStyles />
      <style>{`.lv-host-preview > div { max-width:none !important; }`}</style>
      <EventHeader title={eventTitle} onBack={onClose} onShare={share} />
      <div className="lv-grid">
        <div className="lv-left">
          <div className="lv-main">
            <div className="lv-host-preview">
              <StreamPreview {...props} eventId={eventId} isOpen embedded />
            </div>
            <EventInfo title={eventTitle} hostName="You" live={connectionStatus === 'connected'} viewerCount={onAir ? viewerCount : null} />
          </div>

          <div className="lv-tabs-wrap">
            <EventTabs value={tab} onChange={setTab} wishCount={pending || undefined} />
          </div>

          <div className="lv-panel" id={`lv-panel-${tab}`} role="tabpanel" aria-labelledby={`lv-tab-${tab}`}>
            {tab === 'live' ? (
              <section className="lv-card" aria-label="Live chat">
                <div>
                  <h3>Live chat</h3>
                  <p className="lv-sub">Read what viewers are saying while you broadcast.</p>
                </div>
                <div className="lv-btn-row">
                  <button type="button" className="lv-btn" onClick={() => setChatOpen(true)}>
                    <Icon name="message" size={16} /> Open chat
                  </button>
                </div>
              </section>
            ) : (
              <ModerationQueue
                state={hostWishes.state}
                wishes={hostWishes.wishes}
                busyId={hostWishes.busyId}
                onApprove={(w) => decide(() => hostWishes.approve(w))}
                onHide={(w) => decide(() => hostWishes.hide(w))}
                onRetry={hostWishes.reload}
                onPlay={setPlaying}
              />
            )}
            {wishError ? (
              <p className="lv-err" role="alert">
                {wishError}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="lv-side" aria-label="Invitations and wishes">
          <HostWishInvitesRow eventId={eventId} initial={props.wishInvites} fetcher={fetcher} />
          <InviteOthers eventId={eventId} title={eventTitle} prominent />
          {tab === 'live' ? (
            <ModerationQueue
              state={hostWishes.state}
              wishes={hostWishes.wishes}
              busyId={hostWishes.busyId}
              limit={3}
              onSeeAll={() => setTab('wishes')}
              onApprove={(w) => decide(() => hostWishes.approve(w))}
              onHide={(w) => decide(() => hostWishes.hide(w))}
              onRetry={hostWishes.reload}
              onPlay={setPlaying}
            />
          ) : null}
        </aside>
      </div>
      <WishVideoDialog wish={playing} onClose={() => setPlaying(null)} />
      <LiveChatPreviewDrawer eventId={chatOpen ? eventId : null} eventTitle={eventTitle} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
