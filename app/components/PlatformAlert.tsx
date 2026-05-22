"use client";

/**
 * Replacement for the native browser `alert()` dialog.
 *
 * Native `alert()` shows an ugly chrome-styled prompt ("localhost:3001 says...")
 * that breaks the dashboard's visual language. This component mounts once at the
 * root and renders a Connekyt-styled modal whenever any code calls
 * `platformAlert(message)`. drop-in replacement.
 *
 * Usage:
 *   import { platformAlert } from '@/app/components/PlatformAlert';
 *   platformAlert('Cannot delete this event. There are payments associated with it.');
 *   platformAlert('Action failed', { tone: 'danger', title: 'Whoops' });
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

type AlertTone = 'info' | 'success' | 'warning' | 'danger';

interface AlertPayload {
  message: string;
  title?: string;
  tone?: AlertTone;
  okLabel?: string;
}

const TONE_MAP: Record<AlertTone, {
  topStripe: string;
  iconGradient: string;
  iconShadow: string;
  icon: string;
  eyebrow: string;
}> = {
  info: {
    topStripe: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
    iconGradient: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
    iconShadow: '0 10px 24px rgba(8,58,133,0.30)',
    icon: 'bi-info-circle-fill',
    eyebrow: 'Heads up',
  },
  success: {
    topStripe: 'linear-gradient(90deg, #10B981 0%, #16A34A 100%)',
    iconGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    iconShadow: '0 10px 24px rgba(16,185,129,0.30)',
    icon: 'bi-check-circle-fill',
    eyebrow: 'Success',
  },
  warning: {
    topStripe: 'linear-gradient(90deg, #F59E0B 0%, #F20C8F 130%)',
    iconGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    iconShadow: '0 10px 24px rgba(245,158,11,0.30)',
    icon: 'bi-exclamation-triangle-fill',
    eyebrow: 'Heads up',
  },
  danger: {
    topStripe: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
    iconGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    iconShadow: '0 10px 24px rgba(220,38,38,0.30)',
    icon: 'bi-x-octagon-fill',
    eyebrow: 'Cannot proceed',
  },
};

const EVENT_NAME = 'connekyt:platform-alert';

/**
 * Imperative API. Dispatches a window event that the mounted <PlatformAlert />
 * picks up. Works from anywhere. page handlers, fetch error catches, etc.
 */
export function platformAlert(message: string, options: Omit<AlertPayload, 'message'> = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AlertPayload>(EVENT_NAME, {
    detail: { message, ...options },
  }));
}

/**
 * Heuristic tone picker so callers can keep `alert(err.message)` calls untouched
 * and still get a colored modal that matches the message's intent.
 */
function inferTone(message: string): AlertTone {
  const m = message.toLowerCase();
  if (m.includes('success') || m.includes('saved') || m.includes('copied')) return 'success';
  if (m.includes('cannot') || m.includes("can't") || m.includes('rejected') || m.includes('failed') || m.includes('error')) return 'danger';
  if (m.includes('please') || m.includes('required') || m.includes('warning') || m.includes('coming soon') || m.includes('minimum')) return 'warning';
  return 'info';
}

const PlatformAlert: React.FC = () => {
  const { colors } = useTheme();
  const [queue, setQueue] = useState<AlertPayload[]>([]);
  const current = queue[0];

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<AlertPayload>;
      if (!ev.detail || !ev.detail.message) return;
      setQueue((prev) => [...prev, ev.detail]);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const handleClose = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  // Esc-to-close
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, handleClose]);

  if (!current) return null;

  const tone = current.tone || inferTone(current.message);
  const t = TONE_MAP[tone];
  const title = current.title || (tone === 'success' ? 'Done' : tone === 'danger' ? 'Action blocked' : tone === 'warning' ? 'Please review' : 'Notice');

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={handleClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="platform-alert-title"
        style={{
          position: 'relative',
          backgroundColor: colors.bgCard,
          borderRadius: 18,
          width: 440,
          maxWidth: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
          border: `1px solid ${colors.borderPrimary}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden style={{
          position: 'sticky', top: 0, left: 0, right: 0, height: 3, display: 'block',
          background: t.topStripe,
          zIndex: 2,
        }} />
        <div style={{ padding: '1.6rem 1.5rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: t.iconGradient,
              boxShadow: t.iconShadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`bi ${t.icon}`} style={{ fontSize: 24, color: '#fff' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
            <div style={{
              fontSize: '0.66rem', fontWeight: 700,
              color: '#F20C8F',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 4,
            }}>{t.eyebrow}</div>
            <h2 id="platform-alert-title" style={{
              fontSize: '1.18rem', fontWeight: 800, color: colors.textPrimary,
              margin: 0, letterSpacing: '-0.01em',
            }}>{title}</h2>
          </div>
          <p style={{
            fontSize: '0.92rem', color: colors.textSecondary,
            margin: '0 auto 1.4rem', textAlign: 'center', lineHeight: 1.55,
            maxWidth: 360,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {current.message}
          </p>
          <button
            type="button"
            onClick={handleClose}
            autoFocus
            style={{
              width: '100%',
              padding: '0.7rem 1.1rem',
              borderRadius: 11,
              border: 'none',
              background: tone === 'danger'
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                : tone === 'success'
                ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)'
                : tone === 'warning'
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
              color: '#fff',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: tone === 'danger'
                ? '0 6px 18px rgba(220,38,38,0.32)'
                : tone === 'success'
                ? '0 6px 18px rgba(16,185,129,0.32)'
                : tone === 'warning'
                ? '0 6px 18px rgba(245,158,11,0.32)'
                : '0 6px 18px rgba(242,12,143,0.28)',
              letterSpacing: '-0.005em',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <i className="bi bi-check2" style={{ fontSize: 13 }} />
            {current.okLabel || 'Got it'}
          </button>
          {queue.length > 1 && (
            <p style={{
              fontSize: '0.72rem', color: colors.textSecondary,
              margin: '0.65rem 0 0', textAlign: 'center', opacity: 0.7,
            }}>
              +{queue.length - 1} more {queue.length - 1 === 1 ? 'message' : 'messages'} waiting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformAlert;
