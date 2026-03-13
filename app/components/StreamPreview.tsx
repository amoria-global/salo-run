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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

const MonitorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const WifiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M8.53 16.11a6 6 0 016.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const BroadcastIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// ============================================
// STEP DEFINITIONS
// ============================================

const STEPS = [
  {
    id: 'setup',
    label: 'Setup Encoder',
    icon: SettingsIcon,
    description: 'Configure OBS or Streamlabs',
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: WifiIcon,
    description: 'Start waiting for signal',
  },
  {
    id: 'preview',
    label: 'Preview',
    icon: EyeIcon,
    description: 'Test your stream quality',
  },
  {
    id: 'golive',
    label: 'Go Live',
    icon: BroadcastIcon,
    description: 'Start broadcasting to viewers',
  },
] as const;

type StepId = typeof STEPS[number]['id'];

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
  onStartStream,
  onGoLive,
  onEndStream,
  theme,
  colors,
}: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>('setup');
  const [copiedField, setCopiedField] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Determine active step based on connection status
  useEffect(() => {
    if (connectionStatus === 'idle') {
      // Stay on current step (user might be reading setup instructions)
    } else if (connectionStatus === 'waiting_for_encoder' || connectionStatus === 'receiving_signal') {
      if (currentStep === 'setup') setCurrentStep('connect');
    } else if (connectionStatus === 'live') {
      setCurrentStep('preview');
    }
  }, [connectionStatus]);

  // HLS player setup
  useEffect(() => {
    if (!playbackUrl || !videoRef.current) return;

    const video = videoRef.current;
    setVideoError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        // Minimal buffering — stay as close to live edge as possible
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        liveBackBufferLength: 0,
        backBufferLength: 0,
        highBufferWatchdogPeriod: 1,
        // Fast segment loading
        maxBufferLength: 3,
        maxMaxBufferLength: 5,
        maxBufferSize: 0,
        maxBufferHole: 0.5,
        // Aggressive loading for live edge
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
      // Periodically snap to live edge to prevent drift
      const liveEdgeInterval = setInterval(() => {
        if (hls.liveSyncPosition && video.currentTime > 0) {
          const drift = hls.liveSyncPosition - video.currentTime;
          if (drift > 4) {
            // Too far behind — jump to live edge
            video.currentTime = hls.liveSyncPosition;
          } else if (drift > 2) {
            // Slightly behind — speed up playback to catch up
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
      // Store interval for cleanup
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
  }, [playbackUrl, currentStep]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (connectionStatus === 'live') {
        setCurrentStep('preview');
      } else if (connectionStatus === 'waiting_for_encoder' || connectionStatus === 'receiving_signal') {
        setCurrentStep('connect');
      } else {
        setCurrentStep('setup');
      }
      setShowKey(false);
      setCopiedField('');
      setVideoError(false);
    }
  }, [isOpen]);

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  }, []);

  const getStepIndex = (id: StepId) => STEPS.findIndex(s => s.id === id);
  const currentStepIndex = getStepIndex(currentStep);

  const getStepState = (stepId: StepId) => {
    const idx = getStepIndex(stepId);
    if (idx < currentStepIndex) return 'completed';
    if (idx === currentStepIndex) return 'active';
    return 'upcoming';
  };

  if (!isOpen) return null;

  // ============================================
  // STYLES
  // ============================================

  const isDark = theme === 'dark';

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
    width: '94%',
    maxWidth: '720px',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: isDark
      ? '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
  };

  const headerGradient: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: '1.5rem',
    borderRadius: '1rem 1rem 0 0',
    position: 'relative',
    overflow: 'hidden',
  };

  const inputField: React.CSSProperties = {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: `2px solid ${colors.borderPrimary}`,
    borderRadius: '0.5rem',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    boxSizing: 'border-box' as const,
  };

  const smallBtn: React.CSSProperties = {
    padding: '0.6rem 0.75rem',
    border: `2px solid ${colors.borderPrimary}`,
    borderRadius: '0.5rem',
    backgroundColor: colors.bgCard,
    color: colors.textSecondary,
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    transition: 'all 0.15s',
  };

  const actionBtn = (bg: string): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '0.625rem',
    border: 'none',
    backgroundColor: bg,
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    width: '100%',
    letterSpacing: '0.01em',
  });

  // ============================================
  // STEP CONTENT RENDERERS
  // ============================================

  const renderSetupStep = () => (
    <div>
      {/* Encoder guide card */}
      <div style={{
        backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#F0F7FF',
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#BFDBFE'}`,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <MonitorIcon />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: colors.textPrimary }}>Encoder Setup Guide</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { num: '1', title: 'Download & Open', desc: 'Install OBS Studio (free) or Streamlabs Desktop and open it' },
            { num: '2', title: 'Go to Stream Settings', desc: 'Navigate to Settings → Stream and set the Service to "Custom..."' },
            { num: '3', title: 'Paste Credentials', desc: 'Copy the Server URL and Stream Key below and paste them into OBS' },
            { num: '4', title: 'Configure Output', desc: 'Set output resolution to 1080p, bitrate to 4500 kbps, and encoder to x264 or NVENC' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                color: 'white', fontSize: '0.8rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{step.num}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '0.15rem' }}>{step.title}</div>
                <div style={{ fontSize: '0.78rem', color: colors.textSecondary, lineHeight: '1.4' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RTMP Credentials */}
      {serverUrl && streamKey ? (
        <div style={{
          backgroundColor: isDark ? 'rgba(139,92,246,0.06)' : '#FAF5FF',
          border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : '#E9D5FF'}`,
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.75rem' }}>RTMP Credentials</div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server URL</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input readOnly value={serverUrl} style={inputField} />
              <button onClick={() => handleCopy(serverUrl, 'serverUrl')} style={smallBtn}>
                {copiedField === 'serverUrl' ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stream Key</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input readOnly value={showKey ? streamKey : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'} style={inputField} />
              <button onClick={() => setShowKey(!showKey)} style={smallBtn}>{showKey ? <EyeOffIcon /> : <EyeOnIcon />}</button>
              <button onClick={() => handleCopy(streamKey, 'streamKey')} style={smallBtn}>
                {copiedField === 'streamKey' ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
          border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#FDE68A'}`,
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.25rem' }}>&#x1F512;</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>Credentials Not Yet Available</div>
            <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginTop: '0.15rem' }}>Click "Connect to Stream" below to generate your RTMP credentials.</div>
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => {
          if (!serverUrl || !streamKey) {
            onStartStream();
          }
          setCurrentStep('connect');
        }}
        style={actionBtn('#8B5CF6')}
      >
        {!serverUrl || !streamKey ? (
          <><WifiIcon /> Connect to Stream</>
        ) : (
          <>Next: Connect Encoder &rarr;</>
        )}
      </button>
    </div>
  );

  const renderConnectStep = () => {
    const isWaiting = connectionStatus === 'waiting_for_encoder' || connectionStatus === 'receiving_signal';
    const isConnected = connectionStatus === 'live';
    const isIdle = connectionStatus === 'idle';

    return (
      <div>
        {/* Connection Status Card */}
        <div style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB',
          border: `2px solid ${isConnected ? '#10B981' : isWaiting ? '#F59E0B' : colors.borderPrimary}`,
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '1.25rem',
          textAlign: 'center',
          transition: 'border-color 0.3s',
        }}>
          {/* Animated connection indicator */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isConnected
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : isWaiting
                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                : 'linear-gradient(135deg, #6B7280, #4B5563)',
            boxShadow: isConnected
              ? '0 0 30px rgba(16,185,129,0.3)'
              : isWaiting
                ? '0 0 30px rgba(245,158,11,0.3)'
                : 'none',
          }}>
            {isConnected ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : isWaiting ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M8.53 16.11a6 6 0 016.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            )}
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.35rem' }}>
            {isConnected ? 'Encoder Connected!' : isWaiting ? 'Waiting for Encoder...' : 'Not Connected'}
          </div>
          <div style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.5' }}>
            {isConnected
              ? 'Your encoder is sending data. You can now preview the stream quality.'
              : isWaiting
                ? 'Open OBS Studio and click "Start Streaming". The connection will be detected automatically.'
                : 'Start the stream connection first, then open your encoder.'}
          </div>
        </div>

        {/* Quick reminder */}
        {isWaiting && (
          <div style={{
            backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#EFF6FF',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#BFDBFE'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#60A5FA' : '#2563EB', marginBottom: '0.35rem' }}>Quick Checklist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { text: 'RTMP credentials pasted in OBS', done: true },
                { text: 'Output settings configured', done: true },
                { text: 'Click "Start Streaming" in OBS', done: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: item.done ? '#10B981' : colors.textSecondary }}>
                  {item.done ? <CheckIcon /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${colors.borderPrimary}` }} />}
                  <span style={{ textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.7 : 1 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isIdle && (
            <button onClick={() => { onStartStream(); }} style={actionBtn('#8B5CF6')}>
              <WifiIcon /> Start Connection
            </button>
          )}
          {isWaiting && (
            <button disabled style={{ ...actionBtn('#F59E0B'), opacity: 0.7, cursor: 'wait' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Waiting for encoder signal...
            </button>
          )}
          {isConnected && (
            <button onClick={() => setCurrentStep('preview')} style={actionBtn('#10B981')}>
              <EyeIcon /> Preview Stream &rarr;
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => (
    <div>
      {/* Video Player */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        marginBottom: '1rem',
        border: connectionStatus === 'live' ? '2px solid #10B981' : `2px solid ${colors.borderPrimary}`,
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
            {/* Buffering overlay */}
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
            {/* LIVE badge */}
            {connectionStatus === 'live' && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                backgroundColor: '#DC2626',
                color: 'white',
                padding: '0.25rem 0.6rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white', animation: 'pulse 2s infinite' }} />
                LIVE
              </div>
            )}
            {/* PREVIEW badge */}
            {connectionStatus !== 'live' && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                backgroundColor: 'rgba(139,92,246,0.9)',
                color: 'white',
                padding: '0.25rem 0.6rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
              }}>
                PREVIEW
              </div>
            )}
          </>
        ) : (
          /* No stream / waiting state */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(139,92,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <BroadcastIcon />
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              {videoError ? 'Stream playback error' : 'No stream signal detected'}
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', maxWidth: '280px', textAlign: 'center', lineHeight: '1.4' }}>
              {videoError
                ? 'There was an issue playing the stream. Make sure your encoder is sending data.'
                : 'Start streaming from your encoder to see the preview here. This is exactly what your viewers will see.'}
            </div>
          </div>
        )}
      </div>

      {/* Stream quality info */}
      {connectionStatus === 'live' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}>
          {[
            { label: 'Status', value: 'Receiving', color: '#10B981' },
            { label: 'Latency', value: 'Low', color: '#3B82F6' },
            { label: 'Quality', value: '1080p', color: '#8B5CF6' },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB',
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: '0.5rem',
              padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Viewer perspective note */}
      <div style={{
        backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : '#FAF5FF',
        border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : '#E9D5FF'}`,
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      }}>
        <EyeIcon />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '0.15rem' }}>Viewer Perspective</div>
          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, lineHeight: '1.5' }}>
            This is exactly how your live stream will appear to viewers on the event page. Check your framing, audio levels, and video quality before going live.
          </div>
        </div>
      </div>

      {/* Action */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setCurrentStep('golive')}
          style={actionBtn('#10B981')}
        >
          <BroadcastIcon /> Ready to Go Live &rarr;
        </button>
      </div>
    </div>
  );

  const renderGoLiveStep = () => {
    const isLive = connectionStatus === 'live';

    return (
      <div>
        {/* Final confirmation card */}
        <div style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB',
          border: `2px solid ${isLive ? '#10B981' : isDark ? 'rgba(139,92,246,0.3)' : '#E9D5FF'}`,
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '1.25rem',
          textAlign: 'center',
        }}>
          {isLive ? (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(16,185,129,0.3)',
                animation: 'pulse 2s infinite',
              }}>
                <BroadcastIcon />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginBottom: '0.35rem' }}>You Are Live!</div>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.5' }}>
                Your stream is now visible to all viewers with the invite token. You can monitor the stream from here or close this window.
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1rem',
                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BroadcastIcon />
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.5rem' }}>Ready to Broadcast?</div>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.5', maxWidth: '380px', margin: '0 auto' }}>
                Once you go live, viewers with the invite token will be able to watch your stream in real time on the event page.
              </div>
            </>
          )}
        </div>

        {/* Invite Token */}
        {inviteToken && (
          <div style={{
            backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : '#FAF5FF',
            border: `1px solid ${isDark ? 'rgba(139,92,246,0.25)' : '#DDD6FE'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Viewer Invite Token</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input readOnly value={inviteToken} style={{ ...inputField, textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.15em' }} />
              <button onClick={() => handleCopy(inviteToken, 'inviteToken')} style={smallBtn}>
                {copiedField === 'inviteToken' ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: colors.textTertiary, marginTop: '0.35rem' }}>Share this token with viewers so they can access the live stream.</div>
          </div>
        )}

        {/* Pre-flight checklist */}
        {!isLive && (
          <div style={{
            backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
            border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#FDE68A'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#FBBF24' : '#D97706', marginBottom: '0.5rem' }}>Pre-flight Checklist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                'Camera framing and angle look good',
                'Audio is clear and at the right level',
                'Stream quality is stable in preview',
                'Invite token shared with viewers',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: colors.textSecondary }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${colors.borderPrimary}`, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isLive ? (
            <button onClick={onGoLive} style={actionBtn('#10B981')}>
              <BroadcastIcon /> Go Live Now
            </button>
          ) : (
            <button onClick={onEndStream} style={actionBtn('#DC2626')}>
              <StopIcon /> End Stream
            </button>
          )}
        </div>
      </div>
    );
  };

  const stepRenderers: Record<StepId, () => React.ReactNode> = {
    setup: renderSetupStep,
    connect: renderConnectStep,
    preview: renderPreviewStep,
    golive: renderGoLiveStep,
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stream-preview-modal { animation: slideUp 0.3s ease-out; }
        .stream-preview-modal::-webkit-scrollbar { width: 6px; }
        .stream-preview-modal::-webkit-scrollbar-track { background: transparent; }
        .stream-preview-modal::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
        .step-btn:hover { opacity: 0.85; }
      `}</style>
      <div style={overlay} onClick={onClose}>
        <div className="stream-preview-modal" style={modal} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={headerGradient}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59,130,246,0.08)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <BroadcastIcon />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', margin: 0 }}>Stream Test &amp; Preview</h2>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{eventTitle}</p>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.375rem', padding: '0.4rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.15s' }}>
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div style={{ padding: '1.25rem 1.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              {STEPS.map((step, i) => {
                const state = getStepState(step.id);
                const StepIcon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <button
                      className="step-btn"
                      onClick={() => {
                        // Allow navigating to completed or current steps
                        if (state !== 'upcoming') setCurrentStep(step.id);
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                        background: 'none', border: 'none', cursor: state !== 'upcoming' ? 'pointer' : 'default',
                        padding: '0.25rem',
                        opacity: state === 'upcoming' ? 0.4 : 1,
                        transition: 'opacity 0.2s',
                        minWidth: '60px',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: state === 'completed'
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : state === 'active'
                            ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                            : isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                        color: state === 'completed' || state === 'active' ? 'white' : colors.textTertiary,
                        transition: 'all 0.3s',
                        boxShadow: state === 'active' ? '0 0 16px rgba(139,92,246,0.3)' : 'none',
                      }}>
                        {state === 'completed' ? <CheckIcon /> : <StepIcon />}
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: state === 'active' ? 700 : 500,
                        color: state === 'active' ? '#8B5CF6' : state === 'completed' ? '#10B981' : colors.textTertiary,
                        whiteSpace: 'nowrap',
                      }}>
                        {step.label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: '2px', margin: '0 0.25rem',
                        marginBottom: '1.2rem',
                        background: getStepState(STEPS[i + 1].id) !== 'upcoming'
                          ? 'linear-gradient(90deg, #10B981, #8B5CF6)'
                          : isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                        borderRadius: '1px',
                        transition: 'background 0.3s',
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            {/* Step description */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.15rem' }}>
                {STEPS[currentStepIndex].label}
              </div>
              <div style={{ fontSize: '0.82rem', color: colors.textSecondary }}>
                {STEPS[currentStepIndex].description}
              </div>
            </div>

            {stepRenderers[currentStep]()}
          </div>
        </div>
      </div>
    </>
  );
}
