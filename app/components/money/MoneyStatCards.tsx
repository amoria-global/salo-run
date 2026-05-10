'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { StatCard } from '@/lib/moneyView';
import { COLOR_MAP } from '@/lib/moneyView';

interface MoneyStatCardsProps {
  cards: StatCard[];
}

/** Grid of sub-balance stat cards below the hero. Only shows non-hidden cards. */
export default function MoneyStatCards({ cards }: MoneyStatCardsProps) {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const isDark = actualTheme === 'dark';

  const visible = cards.filter((c) => !c.hidden);
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.75rem',
        padding: '0 1rem 1rem',
      }}
    >
      {visible.map((card) => {
        const palette = COLOR_MAP[card.color];

        return (
          <div
            key={card.label}
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? colors.bgTertiary : colors.bgSecondary,
              border: `1px solid ${isDark ? colors.borderPrimary : palette.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {card.label}
            </span>
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: palette.text,
              }}
            >
              {formatPrice(card.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
