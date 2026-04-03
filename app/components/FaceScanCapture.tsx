"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface FaceScanCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  colors: Record<string, string>;
  actualTheme: string;
}

export default function FaceScanCapture({ onCapture, onClose, colors, actualTheme }: FaceScanCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Could not access camera. Please try again.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCaptured(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (captured) onCapture(captured);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {error ? (
        <div style={{ padding: '2rem 0' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8V12M12 16H12.01"/>
            </svg>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#DC2626', marginBottom: '1rem', lineHeight: '1.5' }}>{error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={() => { setError(''); startCamera(); }} style={{
              padding: '0.75rem 1.5rem', border: '2px solid #062a63', borderRadius: '0.75rem',
              background: '#083A85', color: 'white', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
            }}>Try Again</button>
            <button onClick={onClose} style={{
              padding: '0.75rem 1.5rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem',
              background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{
            position: 'relative', width: '100%', maxWidth: '320px', margin: '0 auto',
            borderRadius: '1rem', overflow: 'hidden', border: `3px solid ${captured ? '#16A34A' : '#083A85'}`,
          }}>
            {!captured ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
                {/* Face outline overlay */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: '55%', height: '70%', border: '3px dashed rgba(255,255,255,0.5)',
                  borderRadius: '50%', pointerEvents: 'none',
                }} />
                {!cameraReady && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: actualTheme === 'dark' ? '#1F2937' : '#F3F4F6',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#083A85',
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                    }} />
                  </div>
                )}
              </>
            ) : (
              <img src={captured} alt="Captured selfie" style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
            )}
          </div>

          <p style={{
            fontSize: '0.8rem', color: colors.textSecondary, margin: '0.75rem 0',
            lineHeight: '1.4',
          }}>
            {captured
              ? 'Review your photo. Make sure your face is clearly visible.'
              : 'Position your face within the oval and take a photo'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            {!captured ? (
              <button onClick={handleCapture} disabled={!cameraReady} style={{
                padding: '0.75rem 2rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                background: cameraReady ? '#083A85' : '#9CA3AF', color: 'white',
                fontSize: '0.9rem', fontWeight: '600',
                cursor: cameraReady ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Capture
              </button>
            ) : (
              <>
                <button onClick={handleRetake} style={{
                  padding: '0.75rem 1.5rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem',
                  background: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                }}>Retake</button>
                <button onClick={handleConfirm} style={{
                  padding: '0.75rem 1.5rem', border: '2px solid #062a63', borderRadius: '0.75rem',
                  background: '#083A85', color: 'white', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Use Photo
                </button>
              </>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
