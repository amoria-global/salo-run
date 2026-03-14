"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';

// ============================================
// TYPES
// ============================================

interface StreamPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  serverUrl?: string;
  streamKey?: string;
  playbackUrl?: string;
  inviteToken?: string;
  connectionStatus: 'idle' | 'waiting_for_encoder' | 'receiving_signal' | 'live';
  streamHealth?: string;
  uploadSpeed?: string;
  viewerCount?: number;
  peakViewers?: number;
  error?: string;
  onStartStream: () => void;
  onGoLive: () => void;
  onEndStream: () => void;
  theme: 'light' | 'dark';
  colors: {
    bgCard: string;
    bgPrimary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderPrimary: string;
    shadowLg: string;
  };
}

// ============================================
// ICONS
// ============================================

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const BroadcastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49" /><path d="M7.76 16.24a6 6 0 010-8.49" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M4.93 19.07a10 10 0 010-14.14" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EyeOnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ============================================
// COMPONENT
// ============================================

export default function StreamPreview({
  isOpen,
  onClose,
  eventTitle,
  serverUrl,
  streamKey,
  playbackUrl,
  inviteToken,
  connectionStatus,
  streamHealth,
  uploadSpeed,
  viewerCount = 0,
  peakViewers = 0,
  error,
  onStartStream,
  onGoLive,
  onEndStream,
  theme,
  colors,
}: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [copiedField, setCopiedField] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const isDark = theme === 'dark';
  const hasCredentials = !!(serverUrl && streamKey);
  const isLive = connectionStatus === 'live';
  const isWaiting = connectionStatus === 'waiting_for_encoder' || connectionStatus === 'receiving_signal';
  const isIdle = connectionStatus === 'idle';

  // Auto-expand guide when no credentials yet
  useEffect(() => {
    if (isOpen) {
      setShowGuide(!hasCredentials);
      setShowKey(false);
      setCopiedField('');
      setVideoError(false);
    }
  }, [isOpen]);

  // HLS player setup
  useEffect(() => {
    if (!playbackUrl || !videoRef.current) return;

    const video = videoRef.current;
    setVideoError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        liveBackBufferLength: 0,
        backBufferLength: 0,
        highBufferWatchdogPeriod: 1,
        maxBufferLength: 3,
        maxMaxBufferLength: 5,
        maxBufferSize: 0,
        maxBufferHole: 0.5,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 10,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 500,
      });
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = true;
        video.play().catch(() => {});
      });
      const liveEdgeInterval = setInterval(() => {
        if (hls.liveSyncPosition && video.currentTime > 0) {
          const drift = hls.liveSyncPosition - video.currentTime;
          if (drift > 4) {
            video.currentTime = hls.liveSyncPosition;
          } else if (drift > 2) {
            video.playbackRate = 1.05;
          } else {
            video.playbackRate = 1.0;
          }
        }
      }, 2000);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 1000);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setVideoError(true);
          }
        }
      });
      hlsRef.current = hls;
      (hls as unknown as Record<string, unknown>)._liveEdgeInterval = liveEdgeInterval;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      if (hlsRef.current) {
        const interval = (hlsRef.current as unknown as Record<string, unknown>)._liveEdgeInterval as ReturnType<typeof setInterval> | undefined;
        if (interval) clearInterval(interval);
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl]);

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  }, []);

  if (!isOpen) return null;

  // ============================================
  // STYLES
  // ============================================

  const overlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1100,
    backdropFilter: 'blur(4px)',
  };

  const modal: React.CSSProperties = {
    backgroundColor: colors.bgCard,
    borderRadius: '1rem',
    width: '96%',
    maxWidth: '960px',
    maxHeight: '94vh',
    overflowY: 'auto',
    boxShadow: isDark
      ? '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
  };

  const inputField: React.CSSProperties = {
    flex: 1,
    padding: '0.5rem 0.65rem',
    border: `1.5px solid ${colors.borderPrimary}`,
    borderRadius: '0.4rem',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    fontSize: '0.78rem',
    fontFamily: 'monospace',
    boxSizing: 'border-box' as const,
    minWidth: 0,
  };

  const smallBtn: React.CSSProperties = {
    padding: '0.5rem 0.6rem',
    border: `1.5px solid ${colors.borderPrimary}`,
    borderRadius: '0.4rem',
    backgroundColor: colors.bgCard,
    color: colors.textSecondary,
    fontSize: '0.7rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  };

  const actionBtn = (bg: string): React.CSSProperties => ({
    padding: '0.65rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: bg,
    color: 'white',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    width: '100%',
  });

  // Status configuration
  const statusConfig = {
    idle: { color: '#6B7280', label: 'Idle', bg: isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6' },
    waiting_for_encoder: { color: '#F59E0B', label: 'Waiting for Encoder', bg: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB' },
    receiving_signal: { color: '#3B82F6', label: 'Receiving Signal', bg: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF' },
    live: { color: '#10B981', label: 'Live', bg: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5' },
  };

  const status = statusConfig[connectionStatus];

  // ============================================
  // RENDER SECTIONS
  // ============================================

  const renderVideoPanel = () => (
    <div style={{ flex: '1 1 55%', minWidth: 0 }}>
      {/* Video Player */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: isLive ? '2px solid #10B981' : `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`,
      }}>
        {playbackUrl && !videoError ? (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
              muted
              autoPlay
              controls
            />
            {isBuffering && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}>
                <div style={{
                  width: '40px', height: '40px',
                  border: '3px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            )}
            {/* LIVE / PREVIEW badge */}
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              backgroundColor: isLive ? '#DC2626' : 'rgba(139,92,246,0.9)',
              color: 'white',
              padding: '0.2rem 0.55rem',
              borderRadius: '0.25rem',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              boxShadow: isLive ? '0 2px 8px rgba(220,38,38,0.4)' : 'none',
            }}>
              {isLive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white', animation: 'pulse 2s infinite' }} />}
              {isLive ? 'LIVE' : 'PREVIEW'}
            </div>
            {/* Viewer count */}
            {isLive && viewerCount > 0 && (
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}>{viewerCount.toLocaleString()} viewers</div>
            )}
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: isWaiting ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '0.75rem',
            }}>
              {isWaiting ? (
                <div style={{
                  width: '24px', height: '24px',
                  border: '3px solid rgba(245,158,11,0.3)',
                  borderTopColor: '#F59E0B',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              ) : (
                <BroadcastIcon />
              )}
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {videoError ? 'Playback Error' : isWaiting ? 'Waiting for OBS...' : 'No Stream Signal'}
            </div>
            <div style={{ color: '#64748B', fontSize: '0.73rem', maxWidth: '260px', textAlign: 'center', lineHeight: '1.4' }}>
              {videoError
                ? 'Check your encoder connection and try again.'
                : hasCredentials
                  ? 'Paste the credentials into OBS and click "Start Streaming".'
                  : 'Click "Start Stream" to generate your RTMP credentials.'}
            </div>
          </div>
        )}
      </div>

      {/* Stream stats row — only when live or has playback */}
      {(isLive || (isWaiting && playbackUrl)) && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
          {[
            { label: 'Health', value: streamHealth?.toUpperCase() || 'N/A', color: streamHealth === 'good' ? '#10B981' : streamHealth === 'fair' ? '#F59E0B' : '#6B7280' },
            { label: 'Upload', value: uploadSpeed || 'N/A', color: '#3B82F6' },
            { label: 'Viewers', value: viewerCount.toLocaleString(), color: '#8B5CF6' },
            { label: 'Peak', value: peakViewers.toLocaleString(), color: '#6B7280' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1,
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB',
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: '0.4rem',
              padding: '0.4rem 0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.6rem', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: stat.color, marginTop: '0.1rem' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderControlPanel = () => (
    <div style={{ flex: '1 1 45%', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Connection Status Bar */}
      <div style={{
        backgroundColor: status.bg,
        borderRadius: '0.5rem',
        padding: '0.6rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: status.color,
            animation: isLive ? 'pulse 2s infinite' : isWaiting ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary }}>{status.label}</span>
        </div>
        {isLive && <span style={{ fontSize: '0.73rem', color: colors.textSecondary }}>{viewerCount} watching</span>}
      </div>

      {/* RTMP Credentials */}
      {hasCredentials ? (
        <div style={{
          backgroundColor: isDark ? 'rgba(139,92,246,0.05)' : '#FAFAFE',
          border: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : '#EDE9FE'}`,
          borderRadius: '0.5rem',
          padding: '0.75rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.5rem' }}>RTMP Credentials</div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textTertiary, display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server URL</label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <input readOnly value={serverUrl} style={inputField} />
              <button onClick={() => handleCopy(serverUrl!, 'serverUrl')} style={smallBtn}>
                {copiedField === 'serverUrl' ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textTertiary, display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stream Key</label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <input readOnly value={showKey ? streamKey : '\u2022'.repeat(20)} style={inputField} />
              <button onClick={() => setShowKey(!showKey)} style={smallBtn}>{showKey ? <EyeOffIcon /> : <EyeOnIcon />}</button>
              <button onClick={() => handleCopy(streamKey!, 'streamKey')} style={smallBtn}>
                {copiedField === 'streamKey' ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : '#FFFBEB',
          border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : '#FDE68A'}`,
          borderRadius: '0.5rem',
          padding: '0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>&#x1F512;</span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary }}>No Credentials Yet</div>
            <div style={{ fontSize: '0.72rem', color: colors.textSecondary, marginTop: '0.1rem' }}>Click "Start Stream" to provision RTMP credentials.</div>
          </div>
        </div>
      )}

      {/* Invite Token */}
      {inviteToken && (
        <div style={{
          backgroundColor: isDark ? 'rgba(139,92,246,0.06)' : '#FAF5FF',
          border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : '#DDD6FE'}`,
          borderRadius: '0.5rem',
          padding: '0.75rem',
        }}>
          <label style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textTertiary, display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Viewer Invite Token</label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <input readOnly value={inviteToken} style={{ ...inputField, textAlign: 'center', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.12em', fontFamily: 'inherit' }} />
            <button onClick={() => handleCopy(inviteToken, 'inviteToken')} style={smallBtn}>
              {copiedField === 'inviteToken' ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
            </button>
          </div>
          <div style={{ fontSize: '0.65rem', color: colors.textTertiary, marginTop: '0.25rem' }}>Share with viewers to grant stream access.</div>
        </div>
      )}

      {/* Encoder Guide (collapsible) */}
      <div style={{
        backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#F0F7FF',
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.15)' : '#BFDBFE'}`,
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}>
        <button onClick={() => setShowGuide(!showGuide)} style={{
          width: '100%',
          padding: '0.6rem 0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          color: isDark ? '#60A5FA' : '#2563EB',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Encoder Setup Guide (OBS / Streamlabs)</span>
          <ChevronIcon open={showGuide} />
        </button>
        {showGuide && (
          <div style={{ padding: '0 0.75rem 0.75rem' }}>
            <ol style={{ fontSize: '0.72rem', color: colors.textSecondary, margin: 0, paddingLeft: '1.1rem', lineHeight: '1.7' }}>
              <li>Open OBS Studio and go to <strong>Settings &rarr; Stream</strong></li>
              <li>Set Service to <strong>"Custom..."</strong></li>
              <li>Paste the <strong>Server URL</strong> and <strong>Stream Key</strong> above</li>
              <li>Set output: <strong>1080p, 4500 kbps, x264/NVENC</strong></li>
              <li>Click <strong>"Start Streaming"</strong> in OBS</li>
              <li>Come back here and click <strong>"Go Live"</strong></li>
            </ol>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          backgroundColor: isDark ? 'rgba(220,38,38,0.08)' : '#FEF2F2',
          border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : '#FECACA'}`,
          borderRadius: '0.5rem',
          padding: '0.6rem 0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>&#x26A0;&#xFE0F;</span>
          <span style={{ fontSize: '0.78rem', color: isDark ? '#FCA5A5' : '#DC2626' }}>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <div style={{ marginTop: 'auto' }}>
        {isIdle && !hasCredentials && (
          <button onClick={onStartStream} style={actionBtn('#8B5CF6')}>
            <PlayIcon /> Start Stream
          </button>
        )}
        {isIdle && hasCredentials && (
          <button onClick={onGoLive} style={actionBtn('#10B981')}>
            <BroadcastIcon /> Resume Stream
          </button>
        )}
        {isWaiting && (
          <button onClick={onGoLive} style={actionBtn('#10B981')}>
            <BroadcastIcon /> {hasCredentials ? 'Go Live' : 'Go Live'}
          </button>
        )}
        {isLive && (
          <button onClick={onEndStream} style={actionBtn('#DC2626')}>
            <StopIcon /> End Stream
          </button>
        )}
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stream-modal { animation: slideUp 0.3s ease-out; }
        .stream-modal::-webkit-scrollbar { width: 6px; }
        .stream-modal::-webkit-scrollbar-track { background: transparent; }
        .stream-modal::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
      `}</style>
      <div style={overlay} onClick={onClose}>
        <div className="stream-modal" style={modal} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: '1.15rem 1.5rem',
            borderRadius: '1rem 1rem 0 0',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '0.5rem',
                  background: isLive
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isLive ? '0 0 20px rgba(16,185,129,0.3)' : 'none',
                }}>
                  <BroadcastIcon />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: 0 }}>
                    Live Stream Control
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>{eventTitle}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isLive && (
                  <div style={{
                    backgroundColor: '#DC2626',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    animation: 'pulse 2s infinite',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />
                    LIVE
                  </div>
                )}
                <button onClick={onClose} style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: '0.375rem',
                  padding: '0.35rem', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                }}>
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Body — Two-panel layout */}
          <div style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            gap: '1.25rem',
            flexWrap: 'wrap' as const,
          }}>
            {renderVideoPanel()}
            {renderControlPanel()}
          </div>
        </div>
      </div>
    </>
  );
}
