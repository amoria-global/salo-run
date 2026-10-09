"use client";

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { HybridStyles, MODE_META, type BookingModeKey } from './hybridUi';

interface BookingModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDirect: () => void;
  onSelectHybrid: () => void;
}

const DETAILS: Record<BookingModeKey, { steps: string[]; bestWhen: string; time: string }> = {
  DIRECT: {
    steps: ['Browse photographers and their packages', 'Send a request to the one you like', 'They accept, you pay, you are booked'],
    bestWhen: 'You already know who you want, or want to compare portfolios yourself.',
    time: 'Depends on the photographer replying',
  },
  HYBRID: {
    steps: ['Describe your event, time and budget', 'Matching, available photographers are alerted', 'Pick from the ones who said yes'],
    bestWhen: 'You want the best available photographer near you without searching.',
    time: 'First answers usually within minutes',
  },
};

/**
 * The fork at the top of booking. Two clearly different cards, named the
 * same on web, iOS and Android, so a client always knows which path they are
 * on. Both end in the same booking, payment and escrow.
 */
export default function BookingModeSelectorModal({ isOpen, onClose, onSelectDirect, onSelectHybrid }: BookingModeSelectorModalProps) {
  const { colors } = useTheme();
  if (!isOpen) return null;

  const Card = ({ mode, onPick }: { mode: BookingModeKey; onPick: () => void }) => {
    const m = MODE_META[mode];
    const d = DETAILS[mode];
    return (
      <button type="button" onClick={onPick} className="hy-focus"
        style={{
          display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', padding: 20, borderRadius: 18,
          border: `2px solid ${m.color}33`, background: colors.bgCard, cursor: 'pointer', width: '100%',
          transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 30px -18px ${m.color}`; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${m.color}33`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden style={{ width: 46, height: 46, borderRadius: 14, background: m.soft, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            <i className={`bi ${m.icon}`} />
          </span>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: m.color }}>{m.short}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.textPrimary }}>{m.label}</div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.86rem', color: colors.textSecondary, lineHeight: 1.45 }}>{m.line}</p>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {d.steps.map((s, i) => (
            <li key={s} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: colors.textSecondary }}>
              <span aria-hidden style={{ width: 20, height: 20, borderRadius: '50%', background: m.soft, color: m.color, fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <div style={{ borderTop: `1px dashed ${colors.borderPrimary}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.76rem', color: colors.textTertiary }}><strong style={{ color: colors.textPrimary }}>Best when:</strong> {d.bestWhen}</span>
          <span style={{ fontSize: '0.76rem', color: colors.textTertiary }}><i className="bi bi-clock" aria-hidden /> {d.time}</span>
        </div>
        <span style={{ marginTop: 'auto', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: m.color, color: '#fff', fontWeight: 800, fontSize: '0.84rem' }}>
          {mode === 'DIRECT' ? 'Find a photographer' : 'Post my event'} <i className="bi bi-arrow-right" aria-hidden />
        </span>
      </button>
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hy-mode-title"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bgOverlay, backdropFilter: 'blur(6px)', padding: 16 }}
      onClick={onClose}>
      <HybridStyles />
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 820, maxHeight: '94vh', overflowY: 'auto', background: colors.bgModal, borderRadius: 24, padding: '1.5rem', position: 'relative', border: `1px solid ${colors.borderPrimary}` }}>
        <button type="button" onClick={onClose} aria-label="Close" className="hy-focus"
          style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: 'none', background: colors.bgTertiary, color: colors.textSecondary, cursor: 'pointer', fontSize: 18 }}>
          <i className="bi bi-x" aria-hidden />
        </button>
        <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 30px' }}>
          <h2 id="hy-mode-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: colors.textPrimary }}>How do you want to book a photographer?</h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: colors.textTertiary }}>Two ways in. Both end in the same secure booking and payment.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <Card mode="DIRECT" onPick={onSelectDirect} />
          <Card mode="HYBRID" onPick={onSelectHybrid} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.78rem', color: colors.textTertiary, textAlign: 'center' }}>
          <i className="bi bi-shield-check" aria-hidden style={{ color: colors.statusSuccess }} />
          Either way you pay 50%, 70% or 100% upfront, held by Connekyt until your photos are delivered.
        </div>
      </div>
    </div>
  );
}
