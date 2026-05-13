"use client";

/**
 * WalletPanel - role-aware wallet summary.
 *
 * Delegates to MoneyHero + MoneyStatCards for the role-specific view.
 */

import React from 'react';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { WalletDTO } from '@/lib/walletApi';
import { selectWalletStats, toRole, type DashboardRole } from '@/lib/moneyView';
import MoneyHero from './money/MoneyHero';
import MoneyStatCards from './money/MoneyStatCards';

export interface WalletPanelProps {
  wallet: WalletDTO;
  role?: DashboardRole;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

function StatusPill({ status }: { status: WalletDTO['status'] }) {
  const map: Record<WalletDTO['status'], { bg: string; fg: string }> = {
    ACTIVE:    { bg: 'rgba(16,185,129,0.12)', fg: '#065F46' },
    SUSPENDED: { bg: 'rgba(245,158,11,0.14)', fg: '#92400E' },
    CLOSED:    { bg: 'var(--ck-surface-muted)', fg: 'var(--ck-text-soft)' },
  };
  const c = map[status] ?? map.CLOSED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 9999,
      fontSize: '0.72rem', fontWeight: 700,
      background: c.bg, color: c.fg,
      letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 9999,
        background: status === 'ACTIVE' ? '#10B981' : status === 'SUSPENDED' ? '#F59E0B' : '#797D86',
      }} />
      {status}
    </span>
  );
}

const WalletPanel: React.FC<WalletPanelProps> = ({
  wallet, role, title, subtitle, compact = false,
}) => {
  const { formatPrice } = useCurrency();

  const resolvedRole = role ?? toRole(wallet.customerType);
  const stats = selectWalletStats(wallet, resolvedRole);
  const isAdmin = resolvedRole === 'admin';

  return (
    <div className="ck-card" style={{ padding: 0, overflow: 'hidden' }}>
      {isAdmin && (
        <div style={{
          padding: '18px 24px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            {title && (
              <div style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#F20C8F', fontWeight: 700, marginBottom: 4,
              }}>{title}</div>
            )}
            {subtitle && (
              <div style={{ fontSize: '0.92rem', color: 'var(--ck-text-soft)' }}>{subtitle}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <StatusPill status={wallet.status} />
            {wallet.consecutiveDriftCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 9999,
                fontSize: '0.7rem', fontWeight: 700,
                background: '#FEF3C7', color: '#92400E',
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 10 }} />
                Drift ×{wallet.consecutiveDriftCount}
              </span>
            )}
          </div>
        </div>
      )}

      {wallet.suspensionReason && (
        <div style={{
          margin: '14px 24px 0', padding: '12px 16px', borderRadius: 12,
          background: '#FFFBEB', border: '1px solid #FDE68A',
          color: '#92400E', fontSize: '0.85rem',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: 2 }} />
          <div>
            <strong>Suspended:</strong> {wallet.suspensionReason.replaceAll('_', ' ')}
            {wallet.suspendedAt && (
              <span style={{ opacity: 0.8, marginLeft: 6 }}>
                ({new Date(wallet.suspendedAt).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      )}

      <MoneyHero stats={stats} />

      {!compact && <MoneyStatCards cards={stats.cards} />}

      {isAdmin && !compact && (
        <div style={{
          padding: '14px 24px 18px',
          borderTop: '1px solid var(--ck-stroke)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.78rem', color: 'var(--ck-text-soft)',
          flexWrap: 'wrap', gap: 10,
          background: 'var(--ck-surface-soft)',
        }}>
          <span><i className="bi bi-calendar-plus" /> Created: {new Date(wallet.createdAt).toLocaleDateString()}</span>
          <span><i className="bi bi-person-circle" /> {wallet.customerType} · {formatPrice(wallet.clientSpent)} total spend</span>
          {wallet.lastReconciledAt
            ? <span><i className="bi bi-arrow-repeat" /> Last reconciled: {new Date(wallet.lastReconciledAt).toLocaleString()}</span>
            : <span><i className="bi bi-clock" /> Never reconciled</span>}
        </div>
      )}
    </div>
  );
};

export default WalletPanel;
