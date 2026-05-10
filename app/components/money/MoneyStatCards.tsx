'use client';

import React from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { StatCard } from '@/lib/moneyView';

interface MoneyStatCardsProps {
  cards: StatCard[];
}

/**
 * Brand-aligned palette for sub-balance cards.
 * `purple` is remapped to Rausch pink so the wallet stays on Connekyt's
 * primary blue + accent pink color story.
 */
const PALETTE: Record<StatCard['color'], { bar: string; tint: string; icon: string }> = {
  green:   { bar: '#10B981', tint: 'rgba(16,185,129,0.10)', icon: 'bi-cash-coin' },
  amber:   { bar: '#F59E0B', tint: 'rgba(245,158,11,0.12)', icon: 'bi-coin' },
  blue:    { bar: '#083A85', tint: 'rgba(8,58,133,0.10)',   icon: 'bi-bank' },
  red:     { bar: '#DC2626', tint: 'rgba(220,38,38,0.10)',  icon: 'bi-arrow-up-right-circle' },
  purple:  { bar: '#F20C8F', tint: 'rgba(242,12,143,0.10)', icon: 'bi-gift-fill' },
  neutral: { bar: '#797D86', tint: 'rgba(0,0,0,0.06)',      icon: 'bi-circle-half' },
};

export default function MoneyStatCards({ cards }: MoneyStatCardsProps) {
  const { formatPrice } = useCurrency();

  const visible = cards.filter((c) => !c.hidden);
  if (visible.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 12,
      padding: '20px 24px 24px',
      background: 'var(--ck-surface)',
    }}>
      {visible.map((card) => {
        const p = PALETTE[card.color] ?? PALETTE.neutral;
        return (
          <div
            key={card.label}
            className="ck-card ck-card-hover"
            style={{
              padding: 16,
              borderTop: `3px solid ${p.bar}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: p.tint,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`bi ${p.icon}`} style={{ color: p.bar, fontSize: 13 }} />
              </div>
              <div style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--ck-text-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{card.label}</div>
            </div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: p.bar,
              lineHeight: 1.1,
            }}>{formatPrice(card.value)}</div>
          </div>
        );
      })}
    </div>
  );
}
