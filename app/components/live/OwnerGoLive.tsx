'use client';

/**
 * Go live (camera or OBS / any external encoder) for one event, as a full page over the dashboard. It is the stream control
 * the photographer pages already use, in one place: start the stream and get the WHIP URL for OBS, go live, pause, end and
 * reset, with the same endpoints (/api/remote/photographer/events/{id}/stream/*) and the same live page around them.
 * The server decides who may broadcast an event (its photographer, a photographer hosting it, or the owner of a private
 * self-streamed event) and refuses everyone else, so a refusal is shown here as the error.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { useTheme } from '../../context/ThemeContext';
import { getApiUrl } from '@/lib/api';
import HostLivePage from './HostLivePage';

type ConnStatus = 'disconnected' | 'connected' | 'paused' | 'ended';
type StreamState = {
  whipUrl?: string; whepUrl?: string; inviteToken?: string; connectionStatus: ConnStatus;
  streamHealth?: string; uploadSpeed?: string; viewerCount?: number; peakViewers?: number; error?: string;
};

const POLL_MS = 5000;

export default function OwnerGoLive({ eventId, eventTitle, allowWishInvites, onClose }: {
  eventId: string;
  eventTitle: string;
  /** The saved Wish invites setting; undefined on a server that predates it. */
  allowWishInvites?: boolean;
  onClose: () => void;
}) {
  const { colors, actualTheme } = useTheme();
  const apiUrl = getApiUrl();
  const fetcher = dashboardAuthFetch as (url: string, init?: RequestInit) => Promise<Response>;
  const [stream, setStream] = useState<StreamState>({ connectionStatus: 'disconnected' });
  const patch = useCallback((p: Partial<StreamState>) => setStream((s) => ({ ...s, ...p })), []);

  const post = async (path: string, fallback: string) => {
    const res = await fetcher(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/${path}`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.action === 0) throw new Error(body.message || fallback);
    return (body.data || body) as Record<string, string>;
  };
  const guarded = (fn: () => Promise<void>, fallback: string) => async () => {
    patch({ error: undefined });
    try { await fn(); } catch (e) { patch({ error: e instanceof Error ? e.message : fallback }); }
  };

  // The stream's state from the server, every few seconds (credentials, connection, viewers, health).
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetcher(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/config`);
        const cfg = (await res.json()).data;
        if (!stop && cfg) patch({
          whipUrl: cfg.whipUrl || undefined, whepUrl: cfg.whepUrl || undefined, inviteToken: cfg.inviteToken || undefined,
          connectionStatus: (cfg.connectionStatus || 'disconnected') as ConnStatus,
          streamHealth: cfg.streamHealth, uploadSpeed: cfg.uploadSpeed, viewerCount: cfg.viewerCount || 0, peakViewers: cfg.peakViewers || 0,
        });
      } catch { /* polling errors are ignored */ }
    };
    void poll();
    const t = setInterval(poll, POLL_MS);
    return () => { stop = true; clearInterval(t); };
  }, [eventId, apiUrl, fetcher, patch]);

  return (
    <HostLivePage
      onClose={onClose}
      eventTitle={eventTitle}
      eventId={eventId}
      wishInvites={allowWishInvites}
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
  );
}
