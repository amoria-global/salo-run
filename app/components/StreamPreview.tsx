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
  connectionStatus: 'disconnected' | 'connected' | 'paused' | 'ended';
  streamHealth?: string;
  uploadSpeed?: string;
  viewerCount?: number;
  peakViewers?: number;
  error?: string;
  onStartStream: () => void;
  onResumeStream: () => void;
  onPauseStream: () => void;
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

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
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


const WarningIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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
  onResumeStream,
  onPauseStream,
  onEndStream,
  theme,
  colors,
}: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [copiedField, setCopiedField] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [encoderDetected, setEncoderDetected] = useState(false);

  const isDark = theme === 'dark';
  const hasCredentials = !!(serverUrl && streamKey);
  const isLive = connectionStatus === 'connected';
  const isPaused = connectionStatus === 'paused';
  const isEnded = connectionStatus === 'ended';
  const isDisconnected = connectionStatus === 'disconnected';
  const isTestPreview = isDisconnected && hasCredentials && encoderDetected;

  // Poll HLS manifest to detect OBS encoder connection
  useEffect(() => {
    if (!isDisconnected || !hasCredentials || !playbackUrl || isEnded) {
      setEncoderDetected(false);
      return;
    }
    let cancelled = false;
    const checkManifest = async () => {
      try {
        const res = await fetch(playbackUrl, { method: 'HEAD', mode: 'cors' });
        if (!cancelled && res.ok) setEncoderDetected(true);
      } catch {
        // Also try GET in case HEAD is blocked by CORS
        try {
          const res = await fetch(playbackUrl, { mode: 'cors' });
          if (!cancelled && res.ok) setEncoderDetected(true);
        } catch { /* not yet available */ }
      }
    };
    checkManifest();
    const interval = setInterval(checkManifest, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isDisconnected, hasCredentials, playbackUrl, isEnded]);

  // Callback ref to detect when video element mounts/unmounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoReady(!!node);
  }, []);

  // Cleanup HLS on unmount or when going non-live/non-preview
  const showVideo = isLive || isTestPreview;
  useEffect(() => {
    if (!showVideo || !playbackUrl) {
      if (hlsRef.current) {
        const interval = (hlsRef.current as unknown as Record<string, unknown>)._liveEdgeInterval as ReturnType<typeof setInterval> | undefined;
        if (interval) clearInterval(interval);
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }
  }, [showVideo, playbackUrl]);

  // HLS player setup — triggered when video element is ready AND we're live/previewing with a URL
  useEffect(() => {
    if (!playbackUrl || !videoRef.current || !showVideo || !videoReady) return;

    // Destroy previous instance if URL changed
    if (hlsRef.current) {
      const interval = (hlsRef.current as unknown as Record<string, unknown>)._liveEdgeInterval as ReturnType<typeof setInterval> | undefined;
      if (interval) clearInterval(interval);
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

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
    };
  }, [playbackUrl, showVideo, videoReady]);

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  }, []);

  const handleEndConfirm = () => {
    setShowEndConfirm(false);
    onEndStream();
  };

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
  const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
    disconnected: { color: '#F59E0B', label: 'Waiting for Encoder', bg: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB' },
    connected: { color: '#10B981', label: 'Live', bg: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5' },
    paused: { color: '#F59E0B', label: 'Paused', bg: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB' },
    ended: { color: '#6B7280', label: 'Ended', bg: isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6' },
  };

  const status = isTestPreview
    ? { color: '#3B82F6', label: 'Test Preview', bg: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF' }
    : statusConfig[connectionStatus] || statusConfig.disconnected;

  // ============================================
  // RENDER SECTIONS
  // ============================================

  const renderVideoPanel = () => (
    <div style={{ flex: '1 1 55%', minWidth: 0 }}>
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '220px',
        aspectRatio: '16/9',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: isLive ? '2px solid #10B981' : isTestPreview ? '2px solid #3B82F6' : `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`,
        backgroundColor: '#000',
      }}>
        {/* Live or Test Preview: show HLS player */}
        {(isLive || isTestPreview) && playbackUrl ? (
          <>
            <video
              ref={videoCallbackRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
              muted
              autoPlay
              controls
              crossOrigin="anonymous"
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
            {/* Status badge */}
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              backgroundColor: isTestPreview ? '#3B82F6' : '#DC2626',
              color: 'white',
              padding: isTestPreview ? '0.25rem 0.65rem' : '0.2rem 0.55rem',
              borderRadius: isTestPreview ? '0.35rem' : '0.25rem',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              boxShadow: isTestPreview ? '0 0 8px rgba(59,130,246,0.5)' : '0 2px 8px rgba(220,38,38,0.4)',
              animation: isTestPreview ? 'twinkle 2s ease-in-out infinite' : 'none',
            }}>
              {isTestPreview ? (
                <>
                  <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'white', animation: 'twinkleDot 1.2s ease-in-out infinite' }} />
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'white', animation: 'twinkleDot 1.2s ease-in-out 0.3s infinite' }} />
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'white', animation: 'twinkleDot 1.2s ease-in-out 0.6s infinite' }} />
                  </div>
                  TEST PREVIEW
                </>
              ) : (
                <>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white', animation: 'pulse 2s infinite' }} />
                  LIVE
                </>
              )}
            </div>
            {/* Viewer count overlay */}
            {isLive && viewerCount > 0 && (
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}>{viewerCount.toLocaleString()} viewer{viewerCount !== 1 ? 's' : ''}</div>
            )}
          </>
        ) : (
          /* Status placeholder for non-live states */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '1.5rem 1rem',
            color: '#CBD5E1',
          }}>
            {isEnded ? (
              <>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(107,114,128,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <StopIcon />
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Stream Ended
                </div>
                <div style={{ color: '#4B5563', fontSize: '0.73rem', maxWidth: '280px', textAlign: 'center', lineHeight: '1.4' }}>
                  This stream has ended permanently and cannot be resumed.
                </div>
              </>
            ) : isPaused ? (
              <>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <PauseIcon />
                </div>
                <div style={{
                  backgroundColor: 'rgba(245,158,11,0.9)',
                  color: 'white',
                  padding: '0.25rem 0.7rem',
                  borderRadius: '0.3rem',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  marginBottom: '0.6rem',
                }}>
                  PAUSED
                </div>
                <div style={{ color: '#64748B', fontSize: '0.73rem', maxWidth: '280px', textAlign: 'center', lineHeight: '1.4' }}>
                  Stream is paused. Viewers see a paused state. Click Resume to continue.
                </div>
              </>
            ) : isDisconnected ? (
              <>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: hasCredentials ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  {hasCredentials ? (
                    <div style={{
                      width: '28px', height: '28px',
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
                  {hasCredentials ? 'Waiting for OBS...' : 'No Stream Signal'}
                </div>
                <div style={{ color: '#64748B', fontSize: '0.73rem', maxWidth: '280px', textAlign: 'center', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                  {hasCredentials
                    ? 'Paste the credentials into OBS and click "Start Streaming".'
                    : 'Get your RTMP credentials to configure your encoder.'}
                </div>
                {!hasCredentials && (
                  <button onClick={onStartStream} style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px -2px rgba(14,165,233,0.4)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(14,165,233,0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(14,165,233,0.4)'; }}
                  >
                    <BroadcastIcon /> Get RTMP Credentials
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Stream stats row — when live or paused */}
      {(isLive || isPaused) && (
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
            animation: isLive ? 'pulse 2s infinite' : isPaused ? 'pulse 3s infinite' : isDisconnected ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary }}>{status.label}</span>
        </div>
        {isLive && <span style={{ fontSize: '0.73rem', color: colors.textSecondary }}>{viewerCount} watching</span>}
      </div>

      {/* RTMP Credentials — hide when ended */}
      {!isEnded && hasCredentials && (
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
      )}

      {/* No credentials yet — setup prompt */}
      {!isEnded && !hasCredentials && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '480px', margin: '0 auto' }}>
          {/* Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(2,132,199,0.1) 100%)'
              : 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0EA5E9',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49" /><path d="M7.76 16.24a6 6 0 010-8.49" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M4.93 19.07a10 10 0 010-14.14" />
            </svg>
          </div>

          {/* Title + description */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.4rem' }}>
              Set Up Your Live Stream
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textSecondary, lineHeight: '1.5' }}>
              Get your RTMP credentials, paste them into your encoder (OBS / Streamlabs), and test your stream before going live.
            </div>
          </div>

          {/* Steps */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { step: '1', text: 'Click below to generate your RTMP server URL and stream key' },
              { step: '2', text: 'Open OBS, go to Settings > Stream, paste the credentials' },
              { step: '3', text: 'Start streaming in OBS to preview and test your feed' },
              { step: '4', text: 'When ready, click Go Live to broadcast to your audience' },
            ].map(item => (
              <div key={item.step} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                borderRadius: '0.5rem',
                padding: '0.6rem 0.75rem',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'}`,
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: 'white', fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{item.step}</div>
                <span style={{ fontSize: '0.78rem', color: colors.textSecondary }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button onClick={onStartStream} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
            border: 'none',
            borderRadius: '0.625rem',
            padding: '0.85rem 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 4px 14px -3px rgba(14,165,233,0.45)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px -3px rgba(14,165,233,0.55)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px -3px rgba(14,165,233,0.45)'; }}
          >
            <BroadcastIcon />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Get RTMP Credentials &amp; Test Stream</span>
          </button>
        </div>
      )}

      {/* Invite Token — hide when ended */}
      {!isEnded && inviteToken && (
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

      {/* Encoder Guide removed — OBS steps shown inline above Get RTMP button */}

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

      {/* Test Preview info */}
      {isTestPreview && (
        <div style={{
          backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#EFF6FF',
          border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#BFDBFE'}`,
          borderRadius: '0.5rem',
          padding: '0.65rem 0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: isDark ? '#93C5FD' : '#1D4ED8' }}>Encoder Connected</div>
            <div style={{ fontSize: '0.68rem', color: colors.textSecondary, marginTop: '0.1rem' }}>Preview your stream above. When ready, click Go Live to broadcast to viewers.</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isEnded && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

          {/* Go Live — encoder detected, ready to broadcast */}
          {isTestPreview && (
            <button onClick={onResumeStream} style={actionBtn('#10B981')}>
              <BroadcastIcon /> Go Live
            </button>
          )}

          {/* Go Live — has credentials, still waiting for encoder (fallback) */}
          {isDisconnected && hasCredentials && !encoderDetected && (
            <button onClick={onResumeStream} style={{ ...actionBtn('#6B7280'), opacity: 0.7 }}>
              <BroadcastIcon /> Go Live
            </button>
          )}

          {/* Paused — show Resume */}
          {isPaused && (
            <button onClick={onResumeStream} style={actionBtn('#10B981')}>
              <PlayIcon /> Resume Stream
            </button>
          )}

          {/* Live — show Pause + End Stream */}
          {isLive && (
            <>
              <button onClick={onPauseStream} style={actionBtn('#F59E0B')}>
                <PauseIcon /> Pause Stream
              </button>
              <button onClick={() => setShowEndConfirm(true)} style={{ ...actionBtn('#DC2626'), backgroundColor: 'transparent', border: '2px solid #DC2626', color: '#DC2626' }}>
                <StopIcon /> End Stream
              </button>
            </>
          )}

          {/* Paused — also allow End Stream */}
          {isPaused && (
            <button onClick={() => setShowEndConfirm(true)} style={{ ...actionBtn('#DC2626'), backgroundColor: 'transparent', border: '2px solid #DC2626', color: '#DC2626' }}>
              <StopIcon /> End Stream
            </button>
          )}
        </div>
      )}

      {/* Ended state message */}
      {isEnded && (
        <div style={{
          backgroundColor: isDark ? 'rgba(107,114,128,0.1)' : '#F9FAFB',
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '0.25rem' }}>Stream Completed</div>
          <div style={{ fontSize: '0.73rem', color: colors.textSecondary }}>This stream has ended permanently. You can close this window.</div>
        </div>
      )}
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
        @keyframes twinkle {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px rgba(59,130,246,0.4), 0 0 8px rgba(59,130,246,0.2); }
          25% { opacity: 0.85; box-shadow: 0 0 8px rgba(59,130,246,0.6), 0 0 16px rgba(59,130,246,0.3); }
          50% { opacity: 1; box-shadow: 0 0 12px rgba(59,130,246,0.8), 0 0 24px rgba(59,130,246,0.4); }
          75% { opacity: 0.9; box-shadow: 0 0 6px rgba(59,130,246,0.5), 0 0 12px rgba(59,130,246,0.25); }
        }
        @keyframes twinkleDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }
        .stream-modal { animation: slideUp 0.3s ease-out; }
        .stream-modal::-webkit-scrollbar { width: 6px; }
        .stream-modal::-webkit-scrollbar-track { background: transparent; }
        .stream-modal::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
      `}</style>
      <div style={overlay} onClick={onClose}>
        <div className="stream-modal" style={modal} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{
            background: isEnded
              ? `linear-gradient(135deg, ${isDark ? '#1f1f1f' : '#374151'} 0%, ${isDark ? '#2d2d2d' : '#4B5563'} 100%)`
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
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
                    : isTestPreview
                      ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                      : isEnded
                        ? 'linear-gradient(135deg, #6B7280, #4B5563)'
                        : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isLive ? '0 0 20px rgba(16,185,129,0.3)' : isTestPreview ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
                }}>
                  <BroadcastIcon />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: 0 }}>
                    {isEnded ? 'Stream Ended' : !hasCredentials ? 'Stream Setup' : isTestPreview ? 'Test Preview' : 'Live Stream Control'}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>{eventTitle}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isTestPreview && (
                  <div style={{
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white', animation: 'pulse 2s infinite' }} />
                    TEST
                  </div>
                )}
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
                {isPaused && (
                  <div style={{
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                  }}>
                    PAUSED
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

          {/* Body */}
          {!hasCredentials && !isEnded ? (
            /* Phase 1: Get Credentials — single column, no video */
            <div style={{ padding: '2rem 1.5rem' }}>
              {renderControlPanel()}
            </div>
          ) : (
            /* Phase 2+: Two-panel layout with video */
            <div style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap' as const,
            }}>
              {renderVideoPanel()}
              {renderControlPanel()}
            </div>
          )}
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowEndConfirm(false)}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: isDark
              ? '0 25px 60px rgba(0,0,0,0.6)'
              : '0 25px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <WarningIcon />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
              End Stream Permanently?
            </h3>
            <p style={{ fontSize: '0.82rem', color: colors.textSecondary, lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              This will <strong style={{ color: '#DC2626' }}>permanently end</strong> the live stream for <strong style={{ color: colors.textPrimary }}>{eventTitle}</strong>. All viewers will be disconnected and the stream cannot be resumed or restarted.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  border: `1.5px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEndConfirm}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                End Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
