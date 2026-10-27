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
import HostLivePage from '../../components/live/HostLivePage';
import {
  bucketOf, createHostedEvent, getEarningsPreview, getEligibility, listHostedEvents, publishHostedEvent,
  runHostFlow, uploadCover, validateHostForm,
  type EarningsPreview, type HostedBucket, type HostedEvent, type HostFormErrors, type HostingEligibility, type HostProgress,
} from '@/lib/hosting/hostedEvents';

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
  const [showForm, setShowForm] = useState(false);

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

  const shown = useMemo(() => (events ?? []).filter((e) => bucketOf(e.status) === tab), [events, tab]);
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
            <li key={e.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: colors.textPrimary }}>{e.title}</div>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{[e.eventDate, e.streamFee ? 'Paid' : 'Free'].filter(Boolean).join('  ')}</div>
              </div>
              {tab !== 'ended' ? (
                <button type="button" onClick={() => openLive(e)} aria-label={`${tab === 'live' ? 'Back to the stream of' : 'Go live with'} ${e.title}`}
                  style={{ padding: '8px 16px', borderRadius: 9999, border: `1px solid ${colors.brandAccent}`, background: 'transparent', color: colors.brandAccent, fontWeight: 700, cursor: 'pointer' }}>
                  {tab === 'live' ? 'Back to stream' : 'Go live'}
                </button>
              ) : null}
            </li>
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
        <HostLivePage
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
