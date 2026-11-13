"use client";

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { HybridStyles, MODE_META } from './hybridUi';

interface BookingModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDirect: () => void;
  onSelectHybrid: () => void;
}

/**
 * The fork at the top of booking, matching the mobile app (`BookingModeSelector.tsx` step === 'select'):
 * 1. Browse Photographers (Direct)
 * 2. Create Your Event Offer (Post My Event / Hybrid)
 */
export default function BookingModeSelectorModal({
  isOpen,
  onClose,
  onSelectDirect,
  onSelectHybrid,
}: BookingModeSelectorModalProps) {
  const { colors } = useTheme();
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hy-mode-title"
      className="ck-keep-radius"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bgOverlay,
        backdropFilter: 'blur(6px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <HybridStyles />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '94vh',
          overflowY: 'auto',
          background: colors.bgModal,
          borderRadius: 24,
          padding: '1.5rem',
          position: 'relative',
          border: `1px solid ${colors.borderPrimary}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 id="hy-mode-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: colors.textPrimary }}>
            How would you like to book?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hy-focus"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: colors.bgTertiary,
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-x" aria-hidden />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Option 1: Browse Photographers (Direct) */}
          <button
            type="button"
            data-ck-shape="card"
            onClick={onSelectDirect}
            className="hy-focus"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              textAlign: 'left',
              padding: 20,
              borderRadius: 18,
              border: `2px solid ${MODE_META.DIRECT.color}33`,
              background: colors.bgCard,
              cursor: 'pointer',
              width: '100%',
              transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = MODE_META.DIRECT.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 14px 30px -18px ${MODE_META.DIRECT.color}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${MODE_META.DIRECT.color}33`;
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                aria-hidden
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: MODE_META.DIRECT.soft,
                  color: MODE_META.DIRECT.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <i className="bi bi-search" />
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: MODE_META.DIRECT.soft,
                  color: MODE_META.DIRECT.color,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                Direct
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.12rem', fontWeight: 800, color: colors.textPrimary }}>Browse Photographers</div>
              <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: colors.textSecondary, lineHeight: 1.45 }}>
                Look through portfolios, compare packages, and reach out directly to the photographer you want.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: colors.textTertiary, marginTop: 'auto' }}>
              <i className="bi bi-check-circle-fill" style={{ color: MODE_META.DIRECT.color }} aria-hidden />
              <span>You choose who to contact</span>
            </div>
            <span
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 15px',
                borderRadius: 10,
                background: MODE_META.DIRECT.color,
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.84rem',
              }}
            >
              Browse photographers <i className="bi bi-arrow-right" aria-hidden />
            </span>
          </button>

          {/* Option 2: Create Your Event Offer (Post My Event) */}
          <button
            type="button"
            data-ck-shape="card"
            onClick={onSelectHybrid}
            className="hy-focus"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              textAlign: 'left',
              padding: 20,
              borderRadius: 18,
              border: `2px solid ${MODE_META.HYBRID.color}55`,
              background: colors.bgCard,
              cursor: 'pointer',
              width: '100%',
              transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = MODE_META.HYBRID.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 14px 30px -18px ${MODE_META.HYBRID.color}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${MODE_META.HYBRID.color}55`;
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                aria-hidden
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: MODE_META.HYBRID.soft,
                  color: MODE_META.HYBRID.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                <i className="bi bi-broadcast" />
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: MODE_META.HYBRID.soft,
                  color: MODE_META.HYBRID.color,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                Post My Event
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.12rem', fontWeight: 800, color: colors.textPrimary }}>Create Your Event Offer</div>
              <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: colors.textSecondary, lineHeight: 1.45 }}>
                Select event details, digital coverage, print products &amp; delivery schedule. Available photographers accept or counter.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: colors.textTertiary, marginTop: 'auto' }}>
              <i className="bi bi-lightning-charge-fill" style={{ color: MODE_META.HYBRID.color }} aria-hidden />
              <span>5 quick steps • Fast responses</span>
            </div>
            <span
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 15px',
                borderRadius: 10,
                background: MODE_META.HYBRID.color,
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.84rem',
              }}
            >
              Create event offer <i className="bi bi-arrow-right" aria-hidden />
            </span>
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.78rem',
            color: colors.textTertiary,
            textAlign: 'center',
          }}
        >
          <i className="bi bi-shield-check" aria-hidden style={{ color: colors.statusSuccess }} />
          Either way you pay 50%, 70% or 100% upfront, held in escrow by Connekyt until your photos are delivered.
        </div>
      </div>
    </div>
  );
}
