'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { WalletStats } from '@/lib/moneyView';

interface MoneyHeroProps {
  stats: WalletStats;
}

/** Big hero number at the top of the wallet page. */
export default function MoneyHero({ stats }: MoneyHeroProps) {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1rem 1.5rem',
        gap: '0.25rem',
      }}
    >
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {stats.hero.label}
      </span>
      <span
        style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          color: colors.textPrimary,
          lineHeight: 1.1,
        }}
      >
        {formatPrice(stats.hero.value)}
      </span>

      {/* Pending chip */}
      {stats.pendingChip && stats.pendingChip.value > 0 && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: colors.statusWarningBg,
            color: colors.statusWarning,
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5l2.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {stats.pendingChip.label}: {formatPrice(stats.pendingChip.value)}
        </div>
      )}

      {/* Suspended / closed banner */}
      {stats.status !== 'ACTIVE' && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: stats.status === 'SUSPENDED' ? colors.statusWarningBg : colors.statusErrorBg,
            color: stats.status === 'SUSPENDED' ? colors.statusWarning : colors.statusError,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Wallet {stats.status.toLowerCase()}
        </div>
      )}
    </div>
  );
}
