"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WHIPClient, WHEPPlayer } from '@/lib/whip-client';
import StreamGiftOverlay from './StreamGiftOverlay';

// ============================================
// TYPES
// ============================================

interface StreamPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  /** Render the preview and its controls inline, without the modal frame, header or backdrop (the host page supplies those). */
  embedded?: boolean;
  eventTitle: string;
  /** Event id used by the gift/reaction overlay to poll the live chat feed. */
  eventId?: string;
  whipUrl?: string;
  whepUrl?: string;
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
  onResetStream?: () => void;
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
  embedded = false,
  eventTitle,
  eventId,
  whipUrl,
  whepUrl,
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
  onResetStream,
  theme,
  colors,
}: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const whepRef = useRef<WHEPPlayer | null>(null);
  const whipRef = useRef<WHIPClient | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const checkInProgressRef = useRef(false);
  const [copiedField, setCopiedField] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [encoderDetected, setEncoderDetected] = useState(false);
  const [publishMode, setPublishMode] = useState<'browser' | 'obs'>('browser');
  const [isBrowserCapturing, setIsBrowserCapturing] = useState(false);
  const [browserCaptureError, setBrowserCaptureError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const hasCredentials = !!whipUrl;
  const isLive = connectionStatus === 'connected';
  const isPaused = connectionStatus === 'paused';
  const isEnded = connectionStatus === 'ended';
  const isDisconnected = connectionStatus === 'disconnected';
  const isTestPreview = isDisconnected && hasCredentials && encoderDetected;

  // Detect OBS encoder connection via WHEP probe. Only runs in OBS mode;
  // browser mode sets encoderDetected directly when the camera starts.
  useEffect(() => {
    if (publishMode === 'browser') return;
    if (!isDisconnected || !hasCredentials || !whepUrl || isEnded) {
      setEncoderDetected(false);
      return;
    }
    let cancelled = false;

    const checkEncoder = async () => {
      if (checkInProgressRef.current) return;
      checkInProgressRef.current = true;
      try {
        const testPlayer = new WHEPPlayer(whepUrl);
        const stream = await testPlayer.play();
        if (!cancelled && stream.getTracks().length > 0) {
          setEncoderDetected(true);
        }
        await testPlayer.stop();
      } catch {
        // OBS not connected yet
      } finally {
        checkInProgressRef.current = false;
      }
    };

    checkEncoder();
    const interval = setInterval(checkEncoder, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      checkInProgressRef.current = false;
    };
  }, [isDisconnected, hasCredentials, whepUrl, isEnded, publishMode]);

  // Callback ref to detect when video element mounts/unmounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoReady(!!node);
  }, []);

  // Cleanup WHEP playback on unmount or when going non-live/non-preview
  const showVideo = isLive || isTestPreview;
  useEffect(() => {
    if (!showVideo || !whepUrl) {
      if (whepRef.current) {
        whepRef.current.stop();
        whepRef.current = null;
      }
    }
  }, [showVideo, whepUrl]);

  // Cleanup browser capture on unmount
  useEffect(() => {
    return () => {
      if (whipRef.current) { const c = whipRef.current; whipRef.current = null; void c.stop(); }
      if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    };
  }, []);

  // WHEP playback setup
  useEffect(() => {
    if (!whepUrl || !videoRef.current || !showVideo || !videoReady) return;

    if (whepRef.current) {
      whepRef.current.stop();
      whepRef.current = null;
    }

    const video = videoRef.current;
    const player = new WHEPPlayer(whepUrl);
    whepRef.current = player;
    player.play().then((remoteStream) => {
      video.srcObject = remoteStream;
      video.muted = true;
      video.play().catch(() => {});
    }).catch(() => {
      // WHEP connection failed. will retry on next poll
    });

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [whepUrl, showVideo, videoReady]);

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  }, []);

  const handleEndConfirm = () => {
    setShowEndConfirm(false);
    if (whipRef.current) { const c = whipRef.current; whipRef.current = null; void c.stop(); }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    setIsBrowserCapturing(false);
    onEndStream();
  };

  // Start browser camera/mic capture and publish via WHIP
  const startBrowserCapture = async () => {
    if (!whipUrl) return;
    setBrowserCaptureError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;

      if (localPreviewRef.current) {
        localPreviewRef.current.srcObject = stream;
      }

      const client = new WHIPClient(whipUrl, (state) => {
        if (state === 'failed') {
          setBrowserCaptureError('Stream connection failed. Please stop and try again.');
          setIsBrowserCapturing(false);
          whipRef.current = null;
        } else if (state === 'connected') {
          setBrowserCaptureError(null);
        }
      });
      await client.publish(stream);
      whipRef.current = client;
      setIsBrowserCapturing(true);
      setEncoderDetected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setBrowserCaptureError('Camera/microphone permission denied. Please allow access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setBrowserCaptureError('No camera or microphone found on this device.');
      } else {
        setBrowserCaptureError(msg);
      }
    }
  };

  // Stop browser capture
  const stopBrowserCapture = () => {
    if (whipRef.current) { const c = whipRef.current; whipRef.current = null; void c.stop(); }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (localPreviewRef.current) { localPreviewRef.current.srcObject = null; }
    setIsBrowserCapturing(false);
    setEncoderDetected(false);
  };

  // Switch between browser camera and OBS modes
  const handleModeChange = (mode: 'browser' | 'obs') => {
    if (mode === 'obs' && isBrowserCapturing) {
      stopBrowserCapture();
    }
    if (mode === 'browser') {
      setEncoderDetected(false);
    }
    setPublishMode(mode);
  };

  if (!isOpen) return null;

  // ============================================
  // STYLES
  // ============================================

  const overlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1100,
    padding: '1rem',
  };

  const modal: React.CSSProperties = {
    position: 'relative',
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    width: '96%',
    maxWidth: '960px',
    maxHeight: '94vh',
    overflowY: 'auto',
    boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
    border: `1px solid ${colors.borderPrimary}`,
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
        borderRadius: 14,
        overflow: 'hidden',
        border: isLive
          ? '2px solid #10B981'
          : isTestPreview
            ? '2px solid #3B82F6'
            : `1px solid ${colors.borderPrimary}`,
        backgroundColor: '#000',
        boxShadow: isLive
          ? '0 12px 28px rgba(16,185,129,0.20)'
          : isTestPreview
            ? '0 12px 28px rgba(59,130,246,0.20)'
            : '0 8px 20px rgba(8,58,133,0.12)',
      }}>
        {/* Live or Test Preview: show WHEP player or local camera preview */}
        {(isLive || isTestPreview) && (whepUrl || isBrowserCapturing) ? (
          <>
            {/* Local camera preview (browser capture mode) */}
            {isBrowserCapturing && (
              <video
                ref={localPreviewRef}
                style={{ position: 'absolute', top: '10px', right: '10px', width: '120px', height: '90px', objectFit: 'cover', borderRadius: '0.4rem', border: '2px solid rgba(255,255,255,0.3)', zIndex: 5 }}
                playsInline
                muted
                autoPlay
              />
            )}
            <video
              ref={videoCallbackRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
              muted
              autoPlay
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
            background: 'radial-gradient(ellipse at center, rgba(8,58,133,0.30) 0%, rgba(0,0,0,1) 70%), linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '1.5rem 1rem',
            color: '#CBD5E1',
          }}>
            {isEnded ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(107,114,128,0.30) 0%, rgba(75,85,99,0.20) 100%)',
                  border: '1px solid rgba(107,114,128,0.40)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.85rem',
                  backdropFilter: 'blur(6px)',
                }}>
                  <i className="bi bi-stop-circle-fill" style={{ fontSize: 28, color: '#9CA3AF' }} />
                </div>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700, color: '#9CA3AF',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Broadcast finished</div>
                <div style={{ color: '#E5E7EB', fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                  Stream Ended
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.78rem', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
                  This stream has ended permanently and cannot be resumed.
                </div>
              </>
            ) : isPaused ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.85rem',
                  boxShadow: '0 12px 28px rgba(245,158,11,0.40)',
                }}>
                  <i className="bi bi-pause-fill" style={{ fontSize: 30, color: '#fff' }} />
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  padding: '0.28rem 0.75rem',
                  borderRadius: 9999,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.36)',
                }}>
                  <i className="bi bi-pause-fill" style={{ fontSize: 10 }} />
                  Paused
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '0.78rem', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
                  Stream is paused. Viewers see a paused state. Click Resume to continue.
                </div>
              </>
            ) : isDisconnected ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: hasCredentials
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.20) 0%, rgba(217,119,6,0.14) 100%)'
                    : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  border: hasCredentials ? '1px solid rgba(245,158,11,0.40)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.85rem',
                  boxShadow: hasCredentials ? 'none' : '0 12px 28px rgba(8,58,133,0.36)',
                  backdropFilter: hasCredentials ? 'blur(6px)' : 'none',
                }}>
                  {hasCredentials ? (
                    <div style={{
                      width: 32, height: 32,
                      border: '3px solid rgba(245,158,11,0.30)',
                      borderTopColor: '#F59E0B',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                  ) : (
                    <i className="bi bi-broadcast-pin" style={{ fontSize: 28, color: '#fff' }} />
                  )}
                </div>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700,
                  color: hasCredentials ? '#FCD34D' : '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>{hasCredentials ? 'Encoder pending' : 'Ready to set up'}</div>
                <div style={{ color: '#E5E7EB', fontSize: '0.98rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                  {hasCredentials ? 'Waiting for OBS' : 'No Stream Signal'}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.78rem', maxWidth: 320, textAlign: 'center', lineHeight: 1.5, marginBottom: hasCredentials ? 0 : '0.95rem' }}>
                  {hasCredentials
                    ? 'Configure OBS with the WHIP URL and click Start Streaming.'
                    : 'Get your WHIP URL to configure OBS and start streaming.'}
                </div>
                {!hasCredentials && (
                  <button onClick={onStartStream} style={{
                    padding: '0.7rem 1.5rem',
                    borderRadius: 11,
                    border: 'none',
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    letterSpacing: '-0.005em',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 10px 24px rgba(8,58,133,0.40)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(242,12,143,0.45)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(8,58,133,0.40)'; }}
                  >
                    <i className="bi bi-broadcast-pin" style={{ fontSize: 14 }} />
                    Get Stream Credentials
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* TikTok-style gift/reaction overlay. Pointer-events-none layer
            over the player; offsets clear the LIVE badge (top-left) and
            the viewer pill / local camera thumb (top-right). */}
        {eventId && (
          <StreamGiftOverlay
            eventId={eventId}
            active={isOpen}
            topLeftOffset={showVideo ? 44 : 12}
            topRightOffset={isBrowserCapturing ? 112 : isLive && viewerCount > 0 ? 40 : 12}
          />
        )}
      </div>

      {/* Stream stats row. when live or paused */}
      {(isLive || isPaused) && (
        <div style={{ display: 'flex', gap: 6, marginTop: '0.65rem' }}>
          {[
            { label: 'Health', value: streamHealth ? streamHealth.charAt(0).toUpperCase() + streamHealth.slice(1) : 'N/A', icon: 'bi-activity', color: streamHealth === 'good' ? '#10B981' : streamHealth === 'fair' ? '#F59E0B' : '#6B7280' },
            { label: 'Upload', value: uploadSpeed || 'N/A', icon: 'bi-arrow-up-circle-fill', color: '#3B82F6' },
            { label: 'Viewers', value: viewerCount.toLocaleString(), icon: 'bi-eye-fill', color: '#8B5CF6' },
            { label: 'Peak', value: peakViewers.toLocaleString(), icon: 'bi-graph-up-arrow', color: '#F20C8F' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1,
              background: colors.bgCard,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: 10,
              padding: '0.5rem 0.55rem',
              textAlign: 'center',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${stat.color}55`; e.currentTarget.style.boxShadow = `0 4px 10px ${stat.color}1f`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#F20C8F',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <i className={`bi ${stat.icon}`} style={{ fontSize: 9, color: stat.color }} />
                {stat.label}
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: stat.color, marginTop: 2, letterSpacing: '-0.01em' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderControlPanel = () => (
    <div style={{ flex: '1 1 45%', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Connection Status Bar */}
      <div style={{
        background: status.bg,
        borderRadius: 12,
        padding: '0.7rem 0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `1px solid ${status.color}33`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span aria-hidden style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
          background: `linear-gradient(180deg, ${status.color} 0%, ${status.color}AA 100%)`,
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: status.color,
            boxShadow: `0 0 8px ${status.color}, 0 0 16px ${status.color}66`,
            animation: isLive ? 'pulse 2s infinite' : isPaused ? 'pulse 3s infinite' : isDisconnected ? 'pulse 1.5s infinite' : 'none',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.005em' }}>{status.label}</span>
        </div>
        {isLive && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.7rem',
            color: colors.textSecondary,
            background: colors.bgCard,
            padding: '0.2rem 0.55rem',
            borderRadius: 9999,
            border: `1px solid ${colors.borderPrimary}`,
            fontWeight: 600,
          }}>
            <i className="bi bi-eye-fill" style={{ fontSize: 9, color: '#8B5CF6' }} />
            {viewerCount} watching
          </span>
        )}
      </div>

      {/* Stream Credentials. WHIP or RTMP fallback */}
      {!isEnded && hasCredentials && (
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(8,58,133,0.16) 0%, rgba(242,12,143,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.03) 100%)',
          border: `1px solid ${isDark ? 'rgba(8,58,133,0.30)' : 'rgba(8,58,133,0.12)'}`,
          borderRadius: 14,
          padding: '0.9rem 0.95rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
          }} />

          {/* Publish mode toggle */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: isDark ? 'rgba(0,0,0,0.20)' : 'rgba(8,58,133,0.05)',
            border: `1px solid ${isDark ? 'rgba(8,58,133,0.24)' : 'rgba(8,58,133,0.12)'}`,
            borderRadius: 11,
            padding: 4,
            marginBottom: '0.9rem',
          }}>
            {(['browser', 'obs'] as const).map((mode) => {
              const active = publishMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.7rem',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: active ? 800 : 600,
                    letterSpacing: '-0.005em',
                    color: active ? 'white' : colors.textSecondary,
                    background: active
                      ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                      : 'transparent',
                    boxShadow: active ? '0 4px 10px rgba(8,58,133,0.26)' : 'none',
                    transition: 'all 0.18s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <i className={`bi ${mode === 'browser' ? 'bi-camera-video-fill' : 'bi-broadcast-pin'}`} style={{ fontSize: 11 }} />
                  {mode === 'browser' ? 'Browser Camera' : 'OBS / Software'}
                </button>
              );
            })}
          </div>

          {publishMode === 'browser' ? (
            /* ─── Browser camera mode ─── */
            <div>
              {!isBrowserCapturing ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    background: isDark ? 'rgba(8,58,133,0.12)' : 'rgba(8,58,133,0.04)',
                    border: `1px solid ${isDark ? 'rgba(8,58,133,0.24)' : 'rgba(8,58,133,0.10)'}`,
                    borderRadius: 12,
                    padding: '0.85rem 1rem',
                    marginBottom: '0.85rem',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(8,58,133,0.26)',
                    }}>
                      <i className="bi bi-camera-video-fill" style={{ fontSize: 15, color: '#fff' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: colors.textPrimary, marginBottom: 3 }}>
                        Stream from your browser camera
                      </div>
                      <div style={{ fontSize: '0.78rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                        No external software needed. Your camera and microphone will stream directly to Cloudflare. Click Start Camera when ready.
                      </div>
                    </div>
                  </div>

                  {browserCaptureError && (
                    <div style={{
                      background: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.30)',
                      borderRadius: 10,
                      padding: '0.65rem 0.9rem',
                      marginBottom: '0.85rem',
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                    }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#EF4444', fontSize: 12, marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: isDark ? '#FCA5A5' : '#B91C1C', fontWeight: 500, lineHeight: 1.45 }}>{browserCaptureError}</span>
                    </div>
                  )}

                  <button
                    onClick={startBrowserCapture}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 11,
                      border: 'none',
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: 'white',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      boxShadow: '0 8px 18px rgba(8,58,133,0.28)',
                      letterSpacing: '-0.005em',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(8,58,133,0.34)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(8,58,133,0.28)'; }}
                  >
                    <i className="bi bi-camera-video-fill" style={{ fontSize: 13 }} />
                    Start Camera
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    background: isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.28)',
                    borderRadius: 12,
                    padding: '0.85rem 1rem',
                    marginBottom: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', boxShadow: '0 0 8px rgba(255,255,255,0.8)', animation: 'pulse 2s infinite' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDark ? '#6EE7B7' : '#065F46', marginBottom: 3 }}>
                        Camera Active
                      </div>
                      <div style={{ fontSize: '0.78rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                        Your stream is transmitting to Cloudflare. The preview above shows what viewers will see. Click Go Live when you are ready to broadcast.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={stopBrowserCapture}
                    style={{
                      width: '100%',
                      padding: '0.72rem 1rem',
                      borderRadius: 11,
                      border: `1px solid ${isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)'}`,
                      background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
                      color: isDark ? '#FCA5A5' : '#B91C1C',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      letterSpacing: '-0.005em',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)'; e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.10)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)'; e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)'; }}
                  >
                    <i className="bi bi-camera-video-off-fill" style={{ fontSize: 12 }} />
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ─── OBS / Software mode ─── */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-broadcast-pin" style={{ fontSize: 14, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WebRTC streaming</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.005em' }}>OBS Setup (WHIP)</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '0.9rem' }}>
                {[
                  'Open OBS. Go to File then Settings.',
                  'Go to the Stream tab.',
                  'Set Service to WHIP.',
                  'Paste the WHIP URL below into the Server field.',
                  'Leave Bearer Token empty.',
                  'Click Apply, then close Settings.',
                  'Click Start Streaming in OBS.',
                ].map((text, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '0.55rem 0.7rem',
                    background: colors.bgCard,
                    borderRadius: 10,
                    border: `1px solid ${colors.borderPrimary}`,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.25)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(8,58,133,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      color: 'white', fontSize: '0.68rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 3px 6px rgba(8,58,133,0.24)',
                      letterSpacing: '-0.005em',
                    }}>{i + 1}</div>
                    <span style={{ fontSize: '0.82rem', color: colors.textPrimary, lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* WHIP URL */}
              <label style={{
                display: 'block',
                fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '0.4rem',
              }}>WHIP URL</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: '0.4rem' }}>
                <input readOnly value={showKey ? whipUrl : `${whipUrl!.substring(0, 40)}...`} style={inputField} />
                <button onClick={() => setShowKey(!showKey)} style={smallBtn} title={showKey ? 'Hide' : 'Show'}>
                  <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 12 }} />
                </button>
                <button
                  onClick={() => handleCopy(whipUrl!, 'whipUrl')}
                  style={{
                    ...smallBtn,
                    ...(copiedField === 'whipUrl' ? {
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                    } : {}),
                  }}
                >
                  {copiedField === 'whipUrl' ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                </button>
              </div>
              <div style={{
                fontSize: '0.74rem',
                color: colors.textSecondary,
                marginBottom: '0.85rem',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontStyle: 'italic',
                opacity: 0.85,
              }}>
                <i className="bi bi-info-circle" style={{ fontSize: 10, color: '#F20C8F' }} />
                No stream key or bearer token needed. The URL is self-authenticating.
              </div>

              {/* Recommended OBS Encoder Settings */}
              <div style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(14,165,233,0.10) 0%, rgba(8,58,133,0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(240,249,255,0.55) 100%)',
                border: `1px solid ${isDark ? 'rgba(14,165,233,0.22)' : 'rgba(14,165,233,0.18)'}`,
                borderRadius: 12,
                padding: '0.85rem 0.95rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                  background: 'linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%)',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.55rem', paddingLeft: 4 }}>
                  <i className="bi bi-sliders" style={{ fontSize: 13, color: isDark ? '#7DD3FC' : '#0369A1' }} />
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 800,
                    color: isDark ? '#7DD3FC' : '#0369A1',
                    letterSpacing: '-0.005em',
                  }}>Recommended OBS Output Settings</div>
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: colors.textSecondary,
                  marginBottom: '0.6rem',
                  paddingLeft: 4,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  flexWrap: 'wrap',
                }}>
                  <i className="bi bi-arrow-right-short" style={{ fontSize: 14, color: '#F20C8F' }} />
                  <span>Go to OBS &rarr; File &rarr; Settings &rarr; Output (Simple mode).</span>
                </div>
                <div style={{
                  background: colors.bgCard,
                  border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.15)'}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: '0.55rem',
                }}>
                  <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{
                        background: isDark ? 'rgba(14,165,233,0.10)' : 'rgba(240,249,255,0.85)',
                        borderBottom: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.15)'}`,
                      }}>
                        <th style={{ textAlign: 'left', padding: '0.45rem 0.6rem', color: '#F20C8F', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Internet Speed</th>
                        <th style={{ textAlign: 'left', padding: '0.45rem 0.6rem', color: '#F20C8F', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bitrate</th>
                        <th style={{ textAlign: 'left', padding: '0.45rem 0.6rem', color: '#F20C8F', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resolution</th>
                        <th style={{ textAlign: 'left', padding: '0.45rem 0.6rem', color: '#F20C8F', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>FPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { speed: '5–10 Mbps', bitrate: '1500 Kbps', resolution: '854 × 480', fps: '30', tier: 'Basic', tierColor: '#9CA3AF' },
                        { speed: '10–25 Mbps', bitrate: '2500 Kbps', resolution: '1280 × 720', fps: '30', tier: 'Standard', tierColor: '#0EA5E9' },
                        { speed: '25–50 Mbps', bitrate: '4000 Kbps', resolution: '1280 × 720', fps: '30', tier: 'High', tierColor: '#10B981' },
                        { speed: '50+ Mbps', bitrate: '6000 Kbps', resolution: '1920 × 1080', fps: '30', tier: 'Premium', tierColor: '#F20C8F' },
                      ].map((row, i) => (
                        <tr key={i} style={{
                          borderBottom: i < 3 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(14,165,233,0.08)'}` : 'none',
                        }}>
                          <td style={{ padding: '0.5rem 0.6rem', color: colors.textPrimary, fontWeight: 700, letterSpacing: '-0.005em' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.tierColor, boxShadow: `0 0 6px ${row.tierColor}66` }} />
                              {row.speed}
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', color: colors.textPrimary, fontWeight: 600 }}>{row.bitrate}</td>
                          <td style={{ padding: '0.5rem 0.6rem', color: colors.textPrimary, fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.72rem' }}>{row.resolution}</td>
                          <td style={{ padding: '0.5rem 0.6rem', color: colors.textPrimary, fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.72rem' }}>{row.fps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 4, marginBottom: '0.5rem' }}>
                  {[
                    { label: 'Encoder', value: 'Software (x264)', icon: 'bi-cpu-fill' },
                    { label: 'Preset', value: 'veryfast', icon: 'bi-speedometer2' },
                    { label: 'Audio', value: 'Opus 160 Kbps', icon: 'bi-music-note-beamed' },
                  ].map((chip, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '0.22rem 0.55rem',
                      background: colors.bgCard,
                      border: `1px solid ${isDark ? 'rgba(14,165,233,0.20)' : 'rgba(14,165,233,0.18)'}`,
                      borderRadius: 9999,
                      fontSize: '0.66rem',
                      color: colors.textPrimary,
                      fontWeight: 600,
                    }}>
                      <i className={`bi ${chip.icon}`} style={{ fontSize: 10, color: '#0EA5E9' }} />
                      <span style={{ color: colors.textSecondary }}>{chip.label}:</span> <strong style={{ fontWeight: 700, letterSpacing: '-0.005em' }}>{chip.value}</strong>
                    </span>
                  ))}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: colors.textSecondary,
                  paddingLeft: 4,
                  fontStyle: 'italic',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  opacity: 0.85,
                }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: 10, color: '#10B981' }} />
                  No stream key or bearer token needed. The URL is self-authenticating.
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* No credentials yet. setup prompt */}
      {!isEnded && !hasCredentials && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem', maxWidth: 520, margin: '0 auto' }}>
          {/* Icon */}
          <div style={{
            width: 76, height: 76, borderRadius: 20,
            background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 14px 32px rgba(8,58,133,0.32)',
          }}>
            <i className="bi bi-broadcast-pin" style={{ fontSize: 32, color: '#fff' }} />
          </div>

          {/* Title + description */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 5,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <i className="bi bi-camera-reels-fill" style={{ fontSize: 11 }} />
              Streaming setup
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
              Set Up Your Live Stream
            </div>
            <div style={{ fontSize: '0.92rem', color: colors.textSecondary, lineHeight: 1.55, maxWidth: 400, margin: '0 auto' }}>
              Generate your stream credentials, then go live from your browser camera or via OBS with no extra software required.
            </div>
          </div>

          {/* Steps */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { step: '1', text: 'Click below to generate your stream credentials.', icon: 'bi-link-45deg' },
              { step: '2', text: 'Choose Browser Camera to stream directly from this device, or switch to OBS / Software for a dedicated encoder.', icon: 'bi-toggles' },
              { step: '3', text: 'Browser mode: click Start Camera. OBS mode: paste the WHIP URL into Settings then Stream then Server.', icon: 'bi-gear-fill' },
              { step: '4', text: 'A live preview appears above. Test your feed before going live.', icon: 'bi-play-circle-fill' },
              { step: '5', text: 'When ready, click Go Live to broadcast to your audience.', icon: 'bi-broadcast-pin' },
            ].map((item, idx) => (
              <div key={item.step} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: colors.bgCard,
                borderRadius: 12,
                padding: '0.75rem 0.85rem',
                border: `1px solid ${colors.borderPrimary}`,
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.10)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                  color: 'white', fontSize: '0.82rem', fontWeight: 800,
                  letterSpacing: '-0.005em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                }}>{item.step}</div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <i className={`bi ${item.icon}`} style={{ fontSize: 11, color: '#F20C8F' }} />
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Step {idx + 1}</span>
                  </div>
                  <span style={{ display: 'block', fontSize: '0.86rem', color: colors.textPrimary, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button onClick={onStartStream} style={{
            width: '100%',
            background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
            border: 'none',
            borderRadius: 12,
            padding: '0.9rem 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 12px 28px rgba(8,58,133,0.32)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 16px 34px rgba(242,12,143,0.38)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(8,58,133,0.32)'; }}
          >
            <i className="bi bi-broadcast-pin" style={{ fontSize: 16, color: '#fff' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', letterSpacing: '-0.005em' }}>Get Stream Credentials &amp; Test Stream</span>
          </button>
        </div>
      )}

      {/* Invite Token. hide when ended */}
      {!isEnded && inviteToken && (
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(242,12,143,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(242,12,143,0.04) 100%)',
          border: `1px solid ${isDark ? 'rgba(139,92,246,0.30)' : 'rgba(139,92,246,0.20)'}`,
          borderRadius: 12,
          padding: '0.85rem 0.95rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
            background: 'linear-gradient(180deg, #8B5CF6 0%, #F20C8F 100%)',
          }} />
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '0.45rem',
            paddingLeft: 4,
          }}>
            <i className="bi bi-key-fill" style={{ fontSize: 10 }} /> Viewer Invite Token
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input readOnly value={inviteToken} style={{
              ...inputField,
              textAlign: 'center',
              fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.18em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              background: isDark
                ? 'linear-gradient(135deg, rgba(8,58,133,0.16) 0%, rgba(242,12,143,0.08) 100%)'
                : colors.bgCard,
              color: '#083A85',
              padding: '0.65rem 0.85rem',
              border: `1px solid ${isDark ? 'rgba(139,92,246,0.30)' : 'rgba(139,92,246,0.20)'}`,
              borderRadius: 10,
            }} />
            <button
              onClick={() => handleCopy(inviteToken, 'inviteToken')}
              style={{
                ...smallBtn,
                padding: '0.6rem 0.85rem',
                fontSize: '0.78rem',
                borderRadius: 10,
                ...(copiedField === 'inviteToken' ? {
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                } : {}),
              }}
            >
              {copiedField === 'inviteToken' ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
            </button>
          </div>
          <div style={{ fontSize: '0.72rem', color: colors.textSecondary, marginTop: '0.45rem', paddingLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 5, fontStyle: 'italic', opacity: 0.85 }}>
            <i className="bi bi-info-circle" style={{ fontSize: 10, color: '#8B5CF6' }} />
            Share this with viewers to grant stream access.
          </div>
        </div>
      )}

      {/* Encoder Guide removed. OBS steps shown inline above Get RTMP button */}

      {/* Error */}
      {error && (
        <div style={{
          background: isDark ? 'rgba(220,38,38,0.16)' : 'rgba(254,242,242,0.85)',
          border: `1px solid ${isDark ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
          borderRadius: 11,
          padding: '0.65rem 0.85rem',
          display: 'flex', alignItems: 'center', gap: 7,
          position: 'relative', overflow: 'hidden',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
            background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
          }} />
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 14, color: '#DC2626', flexShrink: 0, marginLeft: 4 }} />
          <span style={{ fontSize: '0.82rem', color: isDark ? '#FCA5A5' : '#B91C1C', lineHeight: 1.4 }}>{error}</span>
        </div>
      )}

      {/* Test Preview info */}
      {isTestPreview && (
        <div style={{
          background: isDark ? 'rgba(59,130,246,0.14)' : 'rgba(239,246,255,0.85)',
          border: `1px solid ${isDark ? 'rgba(59,130,246,0.32)' : 'rgba(59,130,246,0.22)'}`,
          borderRadius: 11,
          padding: '0.7rem 0.9rem',
          display: 'flex', alignItems: 'flex-start', gap: 8,
          position: 'relative', overflow: 'hidden',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
            background: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)',
          }} />
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 4,
            boxShadow: '0 3px 8px rgba(59,130,246,0.32)',
          }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 11, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isDark ? '#93C5FD' : '#1D4ED8', letterSpacing: '-0.005em' }}>Encoder Connected</div>
            <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginTop: 2, lineHeight: 1.45 }}>Preview your stream above. When ready, click Go Live to broadcast to viewers.</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isEnded && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Go Live. encoder detected, ready to broadcast */}
          {isTestPreview && (
            <button
              onClick={onResumeStream}
              style={{
                width: '100%',
                padding: '0.8rem 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: 'white',
                fontSize: '0.92rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 10px 24px rgba(220,38,38,0.36)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(220,38,38,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(220,38,38,0.36)'; }}
            >
              <i className="bi bi-broadcast-pin" style={{ fontSize: 15 }} />
              Go Live
            </button>
          )}

          {/* Go Live. has credentials, still waiting for encoder (fallback) */}
          {isDisconnected && hasCredentials && !encoderDetected && (
            <button
              onClick={onResumeStream}
              style={{
                width: '100%',
                padding: '0.8rem 1.25rem',
                borderRadius: 12,
                border: `1px solid ${colors.borderPrimary}`,
                background: isDark ? 'rgba(107,114,128,0.20)' : 'rgba(243,244,246,0.85)',
                color: colors.textSecondary,
                fontSize: '0.92rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: 0.85,
              }}
            >
              <i className="bi bi-broadcast-pin" style={{ fontSize: 14, opacity: 0.7 }} />
              Go Live
            </button>
          )}

          {/* Paused. show Resume */}
          {isPaused && (
            <button
              onClick={onResumeStream}
              style={{
                width: '100%',
                padding: '0.8rem 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                fontSize: '0.92rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 10px 24px rgba(16,185,129,0.36)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(16,185,129,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(16,185,129,0.36)'; }}
            >
              <i className="bi bi-play-fill" style={{ fontSize: 16 }} />
              Resume Stream
            </button>
          )}

          {/* Live. show Pause + End Stream */}
          {isLive && (
            <>
              <button
                onClick={onPauseStream}
                style={{
                  width: '100%',
                  padding: '0.8rem 1.25rem',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 10px 24px rgba(245,158,11,0.36)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(245,158,11,0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(245,158,11,0.36)'; }}
              >
                <i className="bi bi-pause-fill" style={{ fontSize: 15 }} />
                Pause Stream
              </button>
              <button
                onClick={() => setShowEndConfirm(true)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1.25rem',
                  borderRadius: 12,
                  border: `1px solid ${isDark ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.30)'}`,
                  background: isDark ? 'rgba(220,38,38,0.12)' : 'rgba(254,242,242,0.55)',
                  color: isDark ? '#FCA5A5' : '#DC2626',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(220,38,38,0.12)' : 'rgba(254,242,242,0.55)'; e.currentTarget.style.color = isDark ? '#FCA5A5' : '#DC2626'; e.currentTarget.style.borderColor = isDark ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.30)'; }}
              >
                <i className="bi bi-stop-fill" style={{ fontSize: 14 }} />
                End Stream
              </button>
            </>
          )}

          {/* Paused. also allow End Stream */}
          {isPaused && (
            <button
              onClick={() => setShowEndConfirm(true)}
              style={{
                width: '100%',
                padding: '0.7rem 1.25rem',
                borderRadius: 12,
                border: `1px solid ${isDark ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.30)'}`,
                background: isDark ? 'rgba(220,38,38,0.12)' : 'rgba(254,242,242,0.55)',
                color: isDark ? '#FCA5A5' : '#DC2626',
                fontSize: '0.88rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(220,38,38,0.12)' : 'rgba(254,242,242,0.55)'; e.currentTarget.style.color = isDark ? '#FCA5A5' : '#DC2626'; e.currentTarget.style.borderColor = isDark ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.30)'; }}
            >
              <i className="bi bi-stop-fill" style={{ fontSize: 14 }} />
              End Stream
            </button>
          )}
        </div>
      )}

      {/* Ended state message + Reset option */}
      {isEnded && (
        <div style={{
          background: isDark ? 'rgba(107,114,128,0.14)' : 'rgba(249,250,251,0.85)',
          border: `1px solid ${colors.borderPrimary}`,
          borderRadius: 12,
          padding: '1.1rem 1rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #6B7280 0%, #9CA3AF 100%)',
          }} />
          <div style={{
            width: 44, height: 44, margin: '0 auto 0.5rem', borderRadius: 12,
            background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(107,114,128,0.30)',
          }}>
            <i className="bi bi-stop-circle-fill" style={{ fontSize: 20, color: '#fff' }} />
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: colors.textPrimary, marginBottom: 4, letterSpacing: '-0.005em' }}>Stream Ended</div>
          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: onResetStream ? '0.85rem' : 0, lineHeight: 1.45 }}>
            This stream has ended. {onResetStream ? 'You can restart with a fresh connection.' : 'You can close this window.'}
          </div>
          {onResetStream && (
            <button
              onClick={onResetStream}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 11,
                border: 'none',
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 8px 18px rgba(8,58,133,0.30)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(8,58,133,0.30)'; }}
            >
              <i className="bi bi-arrow-clockwise" style={{ fontSize: 13 }} />
              Reset &amp; Restart Stream
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  const bodyEl = (
    !hasCredentials && !isEnded ? (
            /* Phase 1: Get Credentials. single column, no video */
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
          )
  );
  const endConfirmEl = (
    showEndConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem',
        }} onClick={() => setShowEndConfirm(false)}>
          <div style={{
            position: 'relative',
            backgroundColor: colors.bgCard,
            borderRadius: 18,
            padding: '1.5rem 1.5rem 1.4rem',
            paddingTop: 'calc(1.5rem + 3px)',
            maxWidth: 440,
            width: '95%',
            boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
            border: `1px solid ${colors.borderPrimary}`,
          }} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
            }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 28px rgba(220,38,38,0.40)',
              }}>
                <i className="bi bi-stop-circle-fill" style={{ fontSize: 26, color: '#fff' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#DC2626',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>End broadcast</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                End Stream?
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.55, margin: '0 auto 0.65rem', textAlign: 'center', maxWidth: 380 }}>
              This will end the live stream for <strong style={{ color: colors.textPrimary }}>{eventTitle}</strong>. All viewers will be disconnected.
            </p>
            <p style={{ fontSize: '0.82rem', color: isDark ? '#FCA5A5' : '#B91C1C', lineHeight: 1.5, margin: '0 0 1.3rem', textAlign: 'center', fontWeight: 600 }}>
              You can restart the stream later using Reset &amp; Restart.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 11,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgTertiary || colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
              >
                Cancel
              </button>
              <button
                onClick={handleEndConfirm}
                style={{
                  flex: 1.4,
                  padding: '0.75rem 1rem',
                  borderRadius: 11,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  boxShadow: '0 8px 18px rgba(220,38,38,0.32)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(220,38,38,0.38)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(220,38,38,0.32)'; }}
              >
                <i className="bi bi-stop-circle-fill" style={{ fontSize: 13 }} />
                End Stream
              </button>
            </div>
          </div>
        </div>
      )
  );

  // Embedded: the host page already provides the header and the frame, so only the preview, its controls and the
  // end-stream confirmation are drawn.
  if (embedded) {
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
        {bodyEl}
        {endConfirmEl}
      </>
    );
  }

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
          {/* Brand top stripe */}
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            zIndex: 5,
          }} />
          {/* Header */}
          <div style={{
            background: isEnded
              ? (isDark
                ? 'linear-gradient(135deg, rgba(75,85,99,0.20) 0%, rgba(107,114,128,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(243,244,246,0.95) 0%, rgba(229,231,235,0.95) 100%)')
              : (isDark
                ? 'linear-gradient(135deg, rgba(8,58,133,0.30) 0%, rgba(242,12,143,0.18) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.08) 0%, rgba(242,12,143,0.06) 100%)'),
            padding: '1.15rem 1.5rem',
            borderRadius: '18px 18px 0 0',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: `1px solid ${colors.borderPrimary}`,
          }}>
            <div aria-hidden style={{ position: 'absolute', top: '-40px', right: '-40px', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(242,12,143,0.18), rgba(242,12,143,0))', pointerEvents: 'none' }} />
            <div aria-hidden style={{ position: 'absolute', bottom: '-50px', left: '-30px', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(8,58,133,0.18), rgba(8,58,133,0))', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11,
                  background: isLive
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : isTestPreview
                      ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                      : isEnded
                        ? 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
                        : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isLive
                    ? '0 8px 20px rgba(16,185,129,0.36)'
                    : isTestPreview
                      ? '0 8px 20px rgba(59,130,246,0.32)'
                      : isEnded
                        ? '0 6px 14px rgba(107,114,128,0.24)'
                        : '0 8px 20px rgba(8,58,133,0.30)',
                }}>
                  <i className={`bi ${isEnded ? 'bi-stop-circle-fill' : 'bi-broadcast-pin'}`} style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: 1,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <i className="bi bi-camera-reels-fill" style={{ fontSize: 10 }} />
                    Live broadcast
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                    {isEnded ? 'Stream Ended' : !hasCredentials ? 'Stream Setup' : isTestPreview ? 'Test Preview' : 'Live Stream Control'}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480 }}>{eventTitle}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isTestPreview && (
                  <div style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    padding: '0.28rem 0.65rem',
                    borderRadius: 9999,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 4px 10px rgba(59,130,246,0.36)',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 0 6px #fff', animation: 'pulse 2s infinite' }} />
                    Test
                  </div>
                )}
                {isLive && (
                  <div style={{
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    padding: '0.28rem 0.65rem',
                    borderRadius: 9999,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 4px 12px rgba(220,38,38,0.40)',
                    animation: 'pulse 2s infinite',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 0 6px #fff' }} />
                    Live
                  </div>
                )}
                {isPaused && (
                  <div style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    padding: '0.28rem 0.65rem',
                    borderRadius: 9999,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 4px 10px rgba(245,158,11,0.32)',
                  }}>
                    <i className="bi bi-pause-fill" style={{ fontSize: 10 }} />
                    Paused
                  </div>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 9,
                    width: 32, height: 32,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textSecondary,
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
                >
                  <i className="bi bi-x-lg" style={{ fontSize: 13 }} />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          {bodyEl}
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      {endConfirmEl}
    </>
  );
}
