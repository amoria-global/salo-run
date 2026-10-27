"use client";

/**
 * Host an event: a photographer creates an event and streams it themselves.
 * The server decides who may host (flag, photographer account, verification for paid) and this page only
 * reads that answer. Success is shown only after the server confirmed create, cover and publish; a failure
 * part-way keeps the event and the retry continues from the failed step.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { useTheme } from '../../context/ThemeContext';
import { getApiUrl } from '@/lib/api';
import StreamPreview from '../../components/StreamPreview';
import {
  UNPUBLISH_BODY, bucketOf, createHostedEvent, getEarningsPreview, getEligibility, listHostedEvents, publishActionFor, publishHostedEvent,
  runHostFlow, setEventPublished, uploadCover, validateHostForm,
  type EarningsPreview, type HostedBucket, type HostedEvent, type HostFormErrors, type HostingEligibility, type HostProgress,
} from '@/lib/hosting/hostedEvents';
import { formatEventDay, getEventStatus, isStartingSoon } from '@/lib/events/eventStatus';

type ConnStatus = 'disconnected' | 'connected' | 'paused' | 'ended';
type StreamState = {
  whipUrl?: string; whepUrl?: string; inviteToken?: string; connectionStatus: ConnStatus;
  streamHealth?: string; uploadSpeed?: string; viewerCount?: number; peakViewers?: number; error?: string;
};

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const TABS: { key: HostedBucket; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' }, { key: 'live', label: 'Live' }, { key: 'ended', label: 'Ended' },
];

export default function HostedEventsPage() {
  const { colors, actualTheme } = useTheme();
  const apiUrl = getApiUrl();
  const fetcher = dashboardAuthFetch as (url: string, init?: RequestInit) => Promise<Response>;

  const [elig, setElig] = useState<HostingEligibility | null>(null);
  const [eligError, setEligError] = useState<string | null>(null);
  const [events, setEvents] = useState<HostedEvent[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [tab, setTab] = useState<HostedBucket>('upcoming');
  // Go live on the dashboard opens the host form straight away (?new=1).
  const [showForm, setShowForm] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === '1');

  const loadElig = useCallback(() => {
    getEligibility(apiUrl, fetcher).then(setElig).catch((e: Error) => setEligError(e.message));
  }, [apiUrl, fetcher]);
  const loadEvents = useCallback(() => {
    listHostedEvents(apiUrl, fetcher).then(setEvents).catch((e: Error) => setListError(e.message));
  }, [apiUrl, fetcher]);
  useEffect(() => { loadElig(); }, [loadElig]);
  useEffect(() => { if (elig?.canHostFree) loadEvents(); }, [elig, loadEvents]);

  // Stream control for one event at a time, through the same endpoints the booked-events page uses.
  const [live, setLive] = useState<HostedEvent | null>(null);
  const [stream, setStream] = useState<StreamState>({ connectionStatus: 'disconnected' });
  const patch = (p: Partial<StreamState>) => setStream((s) => ({ ...s, ...p }));
  const post = async (path: string, fallback: string) => {
    const res = await fetcher(`${apiUrl}/api/remote/photographer/events/${live!.id}/stream/${path}`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.action === 0) throw new Error(body.message || fallback);
    return (body.data || body) as Record<string, string>;
  };
  const guarded = (fn: () => Promise<void>, fallback: string) => async () => {
    patch({ error: undefined });
    try { await fn(); } catch (e) { patch({ error: e instanceof Error ? e.message : fallback }); }
  };
  useEffect(() => {
    if (!live) return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetcher(`${apiUrl}/api/remote/photographer/events/${live.id}/stream/config`);
        const cfg = (await res.json()).data;
        if (!stop && cfg) patch({
          whipUrl: cfg.whipUrl || undefined, whepUrl: cfg.whepUrl || undefined, inviteToken: cfg.inviteToken || undefined,
          connectionStatus: (cfg.connectionStatus || 'disconnected') as ConnStatus,
          streamHealth: cfg.streamHealth, uploadSpeed: cfg.uploadSpeed, viewerCount: cfg.viewerCount || 0, peakViewers: cfg.peakViewers || 0,
        });
      } catch { /* polling errors are ignored */ }
    };
    void poll();
    const t = setInterval(poll, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [live, apiUrl, fetcher]);

  const openLive = (e: HostedEvent) => { setStream({ connectionStatus: 'disconnected' }); setLive(e); };

  // One rule for the tab, the badge and the actions: getEventStatus, from the stream and the date-times.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const shown = useMemo(() => (events ?? []).filter((e) => bucketOf(e, now) === tab), [events, tab, now]);
  const card: React.CSSProperties = { background: colors.bgCard, border: `1px solid ${colors.borderPrimary}`, borderRadius: 14, padding: 16 };

  if (eligError) {
    return <Notice colors={colors} title="Could not check hosting" body={eligError} action={{ label: 'Try again', onClick: () => { setEligError(null); loadElig(); } }} />;
  }
  if (!elig) return <p style={{ color: colors.textSecondary }}>Loading...</p>;
  if (!elig.canHostFree) {
    return (
      <Notice
        colors={colors}
        title="Hosting is not available"
        body={elig.reason === 'NOT_A_PHOTOGRAPHER'
          ? 'Hosting your own events is for photographer accounts.'
          : 'Hosting your own events is not available yet. We will let you know when it is.'}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Host</div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: colors.textPrimary }}>My hosted events</h1>
          <p style={{ margin: '4px 0 0', color: colors.textSecondary }}>Events you created and stream yourself, apart from the ones you were booked for.</p>
        </div>
        <button type="button" className="ck-btn-primary" onClick={() => setShowForm(true)} style={{ padding: '12px 20px', borderRadius: 9999, fontWeight: 700 }}>
          Host an event
        </button>
      </header>

      <div role="tablist" aria-label="Hosted events" style={{ display: 'flex', gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 9999, border: `1px solid ${colors.borderPrimary}`, cursor: 'pointer',
              background: tab === t.key ? colors.brandAccent : 'transparent', color: tab === t.key ? '#fff' : colors.textPrimary, fontWeight: 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      {listError && !events ? (
        <Notice colors={colors} title="Could not load your events" body={listError} action={{ label: 'Try again', onClick: () => { setListError(null); loadEvents(); } }} />
      ) : !events ? (
        <p style={{ color: colors.textSecondary }}>Loading your events...</p>
      ) : shown.length === 0 ? (
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ color: colors.textPrimary, fontWeight: 700, margin: 0 }}>
            {tab === 'live' ? 'Nothing live right now' : tab === 'ended' ? 'No ended events yet' : 'No upcoming events'}
          </p>
          <p style={{ color: colors.textSecondary }}>{tab === 'ended' ? 'Events you have streamed will show here.' : 'Create an event and go live in a minute.'}</p>
          {tab !== 'ended' ? <button type="button" onClick={() => setShowForm(true)} style={{ cursor: 'pointer' }}>Host an event</button> : null}
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {shown.map((e) => (
            <HostedRow key={e.id} event={e} now={now} colors={colors} card={card} onLive={() => openLive(e)}
              onChanged={loadEvents}
              setPublished={(published) => setEventPublished(apiUrl, fetcher, e.id, published)} />
          ))}
        </ul>
      )}

      {showForm ? (
        <HostForm
          elig={elig}
          apiUrl={apiUrl}
          fetcher={fetcher}
          colors={colors}
          onClose={() => setShowForm(false)}
          onDone={(id, goLive) => {
            setShowForm(false);
            listHostedEvents(apiUrl, fetcher).then((list) => {
              setEvents(list);
              if (goLive) { const e = list.find((x) => x.id === id); if (e) openLive(e); }
            }).catch((e: Error) => setListError(e.message));
          }}
        />
      ) : null}

      {live ? (
        <StreamPreview
          isOpen
          onClose={() => { setLive(null); loadEvents(); }}
          eventTitle={live.title}
          eventId={live.id}
          whipUrl={stream.whipUrl}
          whepUrl={stream.whepUrl}
          inviteToken={stream.inviteToken}
          connectionStatus={stream.connectionStatus}
          streamHealth={stream.streamHealth}
          uploadSpeed={stream.uploadSpeed}
          viewerCount={stream.viewerCount || 0}
          peakViewers={stream.peakViewers || 0}
          error={stream.error}
          onStartStream={guarded(async () => { const d = await post('start', 'Failed to start stream. Please try again.'); patch({ whipUrl: d.whipUrl, whepUrl: d.whepUrl }); }, 'Failed to start stream.')}
          onResumeStream={guarded(async () => { await post('resume', 'Failed to go live. Please try again.'); patch({ connectionStatus: 'connected' }); }, 'Failed to go live.')}
          onPauseStream={guarded(async () => { await post('pause', 'Failed to pause stream. Please try again.'); patch({ connectionStatus: 'paused' }); }, 'Failed to pause stream.')}
          onEndStream={guarded(async () => { await post('stop', 'Failed to end stream. Please try again.'); patch({ connectionStatus: 'ended' }); }, 'Failed to end stream.')}
          onResetStream={guarded(async () => { const d = await post('reset', 'Failed to reset stream.'); patch({ whipUrl: d.whipUrl, whepUrl: d.whepUrl, connectionStatus: 'disconnected' }); }, 'Failed to reset stream.')}
          theme={actualTheme as 'light' | 'dark'}
          colors={colors}
        />
      ) : null}
    </div>
  );
}

type Colors = ReturnType<typeof useTheme>['colors'];

const RED = '#E61220';

function HostedRow({ event, now, colors, card, onLive, onChanged, setPublished }: {
  event: HostedEvent; now: number; colors: Colors; card: React.CSSProperties;
  onLive: () => void; onChanged: () => void; setPublished: (published: boolean) => Promise<void>;
}) {
  const status = getEventStatus(event, now);
  const soon = isStartingSoon(event, now);
  const action = publishActionFor(event.published, status);
  const canGoLive = status !== 'ENDED' && event.published;
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = status === 'LIVE' ? 'Live now' : status === 'ENDED' ? 'Ended' : soon ? 'Starting soon' : 'Upcoming';
  const badge: React.CSSProperties = { padding: '2px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, border: '1px solid currentColor' };
  const item: React.CSSProperties = { width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 0, color: colors.textPrimary, cursor: 'pointer', fontWeight: 600 };
  const run = async (published: boolean) => {
    setBusy(true); setError(null);
    try { await setPublished(published); setConfirm(false); setMenu(false); onChanged(); }
    catch (e) { setError(e instanceof Error ? e.message : 'That did not work. Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <li style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontWeight: 700, color: colors.textPrimary }}>{event.title}</div>
        <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{[formatEventDay(event.eventDate) || event.eventDate, event.streamFee ? 'Paid' : 'Free'].filter(Boolean).join('  ')}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ ...badge, color: status === 'LIVE' ? RED : status === 'ENDED' ? colors.textSecondary : colors.brandAccent }}>{label}</span>
          {!event.published ? <span style={{ ...badge, color: '#B45309' }}>Unpublished</span> : null}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {canGoLive ? (
          <button type="button" onClick={onLive} aria-label={`${status === 'LIVE' ? 'Back to the stream of' : 'Go live with'} ${event.title}`}
            style={{ padding: '8px 16px', borderRadius: 9999, border: `1px solid ${RED}`, background: 'rgba(230,18,32,0.10)', color: RED, fontWeight: 700, cursor: 'pointer' }}>
            {status === 'LIVE' ? 'Back to stream' : 'Go live'}
          </button>
        ) : null}
        {action.kind !== 'none' ? (
          <div style={{ position: 'relative' }}>
            <button type="button" aria-haspopup="menu" aria-expanded={menu} aria-label={`More options for ${event.title}`} onClick={() => setMenu((m) => !m)}
              style={{ width: 40, height: 40, borderRadius: 9999, border: `1px solid ${colors.borderPrimary}`, background: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontSize: 18 }}>
              {'\u22EF'}
            </button>
            {menu ? (
              <div role="menu" style={{ position: 'absolute', right: 0, top: 44, zIndex: 20, minWidth: 190, padding: 6, borderRadius: 12, background: colors.bgCard, border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.shadowLg }}>
                {action.kind === 'blocked' ? (
                  <div role="menuitem" style={{ padding: '10px 12px', color: colors.textSecondary }}>{action.reason}</div>
                ) : action.kind === 'unpublish' ? (
                  <button type="button" role="menuitem" onClick={() => { setMenu(false); setConfirm(true); }} style={item}>Unpublish</button>
                ) : (
                  <button type="button" role="menuitem" disabled={busy} onClick={() => run(true)} style={item}>{busy ? 'Republishing...' : 'Republish'}</button>
                )}
                {error && !confirm ? <p role="alert" style={{ color: RED, margin: '4px 12px' }}>{error}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {confirm ? (
        <div role="dialog" aria-modal="true" aria-label="Unpublish this event" style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onMouseDown={(ev) => { if (ev.target === ev.currentTarget && !busy) setConfirm(false); }}>
          <div style={{ ...card, maxWidth: 440, width: '100%', display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: colors.textPrimary }}>Unpublish this event?</h2>
            <p style={{ margin: 0, color: colors.textSecondary }}>{UNPUBLISH_BODY}</p>
            {error ? <p role="alert" style={{ margin: 0, color: RED }}>{error}</p> : null}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" disabled={busy} onClick={() => setConfirm(false)} style={{ padding: '10px 18px', borderRadius: 9999, border: `1px solid ${colors.borderPrimary}`, background: 'transparent', color: colors.textPrimary, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => run(false)} style={{ padding: '10px 18px', borderRadius: 9999, border: 0, background: RED, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{busy ? 'Unpublishing...' : 'Unpublish'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Notice({ colors, title, body, action }: { colors: Colors; title: string; body: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div role="status" style={{ background: colors.bgCard, border: `1px solid ${colors.borderPrimary}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
      <h2 style={{ margin: 0, color: colors.textPrimary }}>{title}</h2>
      <p style={{ color: colors.textSecondary }}>{body}</p>
      {action ? <button type="button" onClick={action.onClick} style={{ cursor: 'pointer' }}>{action.label}</button> : null}
    </div>
  );
}

function HostForm({ elig, apiUrl, fetcher, colors, onClose, onDone }: {
  elig: HostingEligibility; apiUrl: string; fetcher: (u: string, i?: RequestInit) => Promise<Response>;
  colors: Colors; onClose: () => void; onDone: (eventId: string, goLive: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayYmd());
  const [startTime, setStartTime] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [errors, setErrors] = useState<HostFormErrors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  const progress = useRef<HostProgress>({});
  const [preview, setPreview] = useState<(EarningsPreview & { fee: number }) | null>(null);

  const priceNow = Number(price);
  useEffect(() => {
    if (!paid || !Number.isFinite(priceNow) || priceNow <= 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      getEarningsPreview(apiUrl, fetcher, priceNow).then((p) => { if (!cancelled) setPreview({ ...p, fee: priceNow }); }).catch(() => undefined);
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [paid, priceNow, apiUrl, fetcher]);
  const livePreview = paid && preview && preview.fee === priceNow ? preview : null;

  const submit = async (goLive: boolean) => {
    if (inFlight.current) return;
    const found = validateHostForm({ title, date, startTime, paid, price }, !!cover, todayYmd());
    setErrors(found);
    if (Object.keys(found).length > 0 || !cover) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const result = await runHostFlow(
        {
          create: (input) => createHostedEvent(apiUrl, fetcher, input),
          uploadCover: (id, file) => uploadCover(apiUrl, fetcher, id, file),
          publish: (id) => publishHostedEvent(apiUrl, fetcher, id),
        },
        {
          title: title.trim(), eventDate: date, startTime: startTime.trim() || undefined,
          description: description.trim() || undefined, location: location.trim() || undefined,
          streamFee: paid ? priceNow : undefined,
        },
        cover,
        progress.current,
      );
      progress.current = result.progress;
      setSaved(!!result.progress.eventId);
      if (result.status === 'failed') {
        setFailure(result.step === 'create' ? result.message : `${result.message} Your event is saved. Press the button again to continue where it stopped.`);
        return;
      }
      onDone(result.eventId, goLive);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const field: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${colors.borderPrimary}`, background: colors.bgPrimary, color: colors.textPrimary };
  const label: React.CSSProperties = { display: 'grid', gap: 6, color: colors.textSecondary, fontSize: '0.85rem', fontWeight: 600 };
  const err = (m?: string) => (m ? <span role="alert" style={{ color: '#DC2626', fontSize: '0.8rem' }}>{m}</span> : null);

  return (
    <div role="dialog" aria-modal="true" aria-label="Host an event" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }}>
      <div style={{ background: colors.bgCard, borderRadius: 16, padding: 24, width: 'min(560px, 100%)', maxHeight: '90vh', overflow: 'auto', display: 'grid', gap: 14 }}>
        <h2 style={{ margin: 0, color: colors.textPrimary }}>Host an event</h2>
        <label style={label}>Cover photo
          <input type="file" accept="image/*" disabled={busy} onChange={(e) => { setCover(e.target.files?.[0] ?? null); setErrors((x) => ({ ...x, cover: undefined })); }} />
          {err(errors.cover)}
        </label>
        <label style={label}>Title
          <input style={field} value={title} maxLength={120} disabled={busy} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Friday night live set" />
          {err(errors.title)}
        </label>
        <div role="radiogroup" aria-label="Ticket" style={{ display: 'flex', gap: 8 }}>
          {(['Free', 'Paid'] as const).map((k) => {
            const isPaid = k === 'Paid';
            const locked = isPaid && !elig.canHostPaid;
            return (
              <button key={k} type="button" role="radio" aria-checked={paid === isPaid} disabled={busy || locked} onClick={() => setPaid(isPaid)}
                style={{ padding: '8px 18px', borderRadius: 9999, border: `1px solid ${colors.borderPrimary}`, fontWeight: 700, cursor: locked ? 'not-allowed' : 'pointer',
                  background: paid === isPaid ? colors.brandAccent : 'transparent', color: paid === isPaid ? '#fff' : colors.textPrimary, opacity: locked ? 0.5 : 1 }}>
                {k}
              </button>
            );
          })}
        </div>
        {!elig.canHostPaid ? (
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: '0.88rem' }}>
            Paid events need your identity verification to be approved first. Free events are open to you now.{' '}
            <Link href="/user/photographer/profile" style={{ color: colors.brandAccent, fontWeight: 700 }}>Verify my identity</Link>
          </p>
        ) : null}
        {paid ? (
          <label style={label}>Price
            <input style={field} inputMode="decimal" value={price} disabled={busy} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 5000" />
            {err(errors.price)}
            {livePreview ? <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{`You keep ${livePreview.hostPercent}% of each ticket, about ${Math.round(livePreview.hostEarnsPerTicket).toLocaleString()}. The platform keeps ${livePreview.platformPercent}%.`}</span> : null}
          </label>
        ) : null}
        <label style={label}>Date
          <input style={field} type="date" min={todayYmd()} value={date} disabled={busy} onChange={(e) => setDate(e.target.value)} />
          {err(errors.date)}
        </label>
        <label style={label}>Start time (optional)
          <input style={field} type="time" value={startTime} disabled={busy} onChange={(e) => setStartTime(e.target.value)} />
          {err(errors.startTime)}
        </label>
        <label style={label}>Where (optional)
          <input style={field} value={location} disabled={busy} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label style={label}>Description (optional)
          <textarea style={field} rows={3} value={description} disabled={busy} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: '0.85rem' }}>
          When you go live your browser will ask for camera and microphone access. A steady connection keeps the stream smooth.
        </p>
        {failure ? <p role="alert" style={{ margin: 0, color: '#DC2626' }}>{failure}</p> : null}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={busy} style={{ cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={() => void submit(false)} disabled={busy} style={{ cursor: 'pointer' }}>Publish and schedule for later</button>
          <button type="button" className="ck-btn-primary" onClick={() => void submit(true)} disabled={busy} style={{ padding: '10px 20px', borderRadius: 9999, fontWeight: 700, cursor: 'pointer' }}>
            {busy ? 'Working...' : failure && saved ? 'Try again' : 'Publish and go live'}
          </button>
        </div>
      </div>
    </div>
  );
}
