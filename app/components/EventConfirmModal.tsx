"use client";

import React from 'react';

/**
 * Shared confirm/warning modal used across the events pages
 * (Publish, Unpublish, Photo Required, Photographer Required, Pending Booking,
 * Ongoing Stream Block, etc.).
 *
 * Visually mirrors the rest of the Connekyt dashboard: soft brand-blue backdrop blur,
 * brand-gradient top stripe, gradient icon tile, uppercase eyebrow + bold title,
 * brand-styled primary action with a hover lift.
 */

type Tone = 'success' | 'warning' | 'danger' | 'info';

const TONE_MAP: Record<Tone, {
  topStripe: string;
  iconGradient: string;
  iconShadow: string;
  detailColor: string;
  detailDarkColor: string;
  primaryGradient: string;
  primaryShadow: string;
}> = {
  success: {
    topStripe: 'linear-gradient(90deg, #10B981 0%, #16A34A 100%)',
    iconGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    iconShadow: '0 10px 24px rgba(16,185,129,0.30)',
    detailColor: '#059669',
    detailDarkColor: '#4ADE80',
    primaryGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    primaryShadow: '0 6px 18px rgba(16,185,129,0.32)',
  },
  warning: {
    topStripe: 'linear-gradient(90deg, #F59E0B 0%, #F20C8F 130%)',
    iconGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    iconShadow: '0 10px 24px rgba(245,158,11,0.30)',
    detailColor: '#92400E',
    detailDarkColor: '#FCD34D',
    primaryGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    primaryShadow: '0 6px 18px rgba(245,158,11,0.32)',
  },
  danger: {
    topStripe: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
    iconGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    iconShadow: '0 10px 24px rgba(220,38,38,0.30)',
    detailColor: '#991B1B',
    detailDarkColor: '#FCA5A5',
    primaryGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    primaryShadow: '0 6px 18px rgba(220,38,38,0.32)',
  },
  info: {
    topStripe: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
    iconGradient: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
    iconShadow: '0 10px 24px rgba(8,58,133,0.30)',
    detailColor: '#1E40AF',
    detailDarkColor: '#93C5FD',
    primaryGradient: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
    primaryShadow: '0 6px 18px rgba(242,12,143,0.28)',
  },
};

interface PrimaryAction {
  label: string;
  icon?: string;
  onClick: () => void;
  tone?: Tone; // overrides the modal's tone for the primary button if set
}

interface EventConfirmModalProps {
  tone: Tone;
  icon: string; // bootstrap icon class without the leading "bi "
  eyebrow: string;
  title: string;
  highlight?: string;
  intro: React.ReactNode;
  detail?: React.ReactNode;
  colors: { bgCard: string; borderPrimary: string; textPrimary: string; textSecondary: string };
  actualTheme: string;
  onClose: () => void;
  closeLabel?: string;
  primary?: PrimaryAction;
  fullWidthClose?: boolean; // for info-only modals with no primary action
}

const EventConfirmModal: React.FC<EventConfirmModalProps> = ({
  tone,
  icon,
  eyebrow,
  title,
  intro,
  detail,
  colors,
  actualTheme,
  onClose,
  closeLabel = 'Cancel',
  primary,
  fullWidthClose = false,
}) => {
  const t = TONE_MAP[tone];
  const primaryTone = primary?.tone ? TONE_MAP[primary.tone] : t;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: colors.bgCard,
          borderRadius: 18,
          width: 460,
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
              width: 64, height: 64, borderRadius: 18,
              background: t.iconGradient,
              boxShadow: t.iconShadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`bi ${icon}`} style={{ fontSize: 26, color: '#fff' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
            <div style={{
              fontSize: '0.66rem', fontWeight: 700,
              color: '#F20C8F',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 4,
            }}>{eyebrow}</div>
            <h2 style={{
              fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary,
              margin: 0, letterSpacing: '-0.01em',
            }}>{title}</h2>
          </div>
          <p style={{
            fontSize: '0.92rem', color: colors.textSecondary,
            margin: '0 auto 0.65rem', textAlign: 'center', lineHeight: 1.55,
            maxWidth: 380,
          }}>
            {intro}
          </p>
          {detail && (
            <p style={{
              fontSize: '0.84rem',
              color: actualTheme === 'dark' ? t.detailDarkColor : t.detailColor,
              margin: '0 auto 1.4rem', textAlign: 'center', fontWeight: 500, lineHeight: 1.5,
              maxWidth: 380,
            }}>
              {detail}
            </p>
          )}
          <div style={{
            display: 'flex',
            gap: '0.6rem',
            paddingTop: detail ? 0 : '0.5rem',
          }}>
            <button
              type="button"
              onClick={onClose}
              className="ck-btn ck-btn-soft"
              style={{
                flex: fullWidthClose ? 1 : 1,
                padding: '0.65rem 1rem',
                fontSize: '0.9rem',
              }}
            >
              {closeLabel}
            </button>
            {primary && (
              <button
                type="button"
                onClick={primary.onClick}
                style={{
                  flex: 1.6,
                  padding: '0.65rem 1.1rem',
                  borderRadius: 11,
                  border: 'none',
                  background: primaryTone.primaryGradient,
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: primaryTone.primaryShadow,
                  letterSpacing: '-0.005em',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {primary.icon && <i className={`bi ${primary.icon}`} style={{ fontSize: 13 }} />}
                {primary.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventConfirmModal;
