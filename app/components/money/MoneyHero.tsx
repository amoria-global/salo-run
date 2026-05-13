'use client';

import React from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { WalletStats } from '@/lib/moneyView';

interface MoneyHeroProps {
  stats: WalletStats;
}

/**
 * Big hero balance card at the top of the wallet page —
 * Connekyt-branded gradient panel with the available balance front and center.
 */
export default function MoneyHero({ stats }: MoneyHeroProps) {
  const { formatPrice } = useCurrency();

  return (
    <div style={{
      position: 'relative',
      padding: '36px 28px 32px',
      background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 60%, #1654b8 100%)',
      color: '#ffffff',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(242,12,143,0.30), rgba(242,12,143,0))',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -60,
        width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(255,255,255,0.10), rgba(255,255,255,0))',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', gap: 6,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 9999,
          background: 'rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.18)',
          fontSize: '0.7rem', fontWeight: 700, color: '#ffffff',
          textTransform: 'uppercase', letterSpacing: '0.10em',
          backdropFilter: 'blur(8px)',
        }}>
          <i className="bi bi-wallet2" style={{ fontSize: 12 }} />
          {stats.hero.label}
        </span>

        <span style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
          marginTop: 6,
          color: '#ffffff',
          textShadow: '0 4px 30px rgba(0,0,0,0.20)',
        }}>
          {formatPrice(stats.hero.value)}
        </span>

        {stats.pendingChip && stats.pendingChip.value > 0 && (
          <div style={{
            marginTop: 10,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 9999,
            background: 'rgba(245, 158, 11, 0.18)',
            border: '1px solid rgba(245, 158, 11, 0.40)',
            color: '#FCD34D',
            fontSize: '0.78rem', fontWeight: 600,
          }}>
            <i className="bi bi-clock-history" style={{ fontSize: 11 }} />
            {stats.pendingChip.label}: {formatPrice(stats.pendingChip.value)}
          </div>
        )}

        {stats.status !== 'ACTIVE' && (
          <div style={{
            marginTop: 12, padding: '6px 14px', borderRadius: 9999,
            background: stats.status === 'SUSPENDED' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(220, 38, 38, 0.22)',
            border: stats.status === 'SUSPENDED' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(220, 38, 38, 0.45)',
            color: stats.status === 'SUSPENDED' ? '#FCD34D' : '#FCA5A5',
            fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <i className="bi bi-shield-exclamation" /> Wallet {stats.status.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}
