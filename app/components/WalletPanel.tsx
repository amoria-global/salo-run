"use client";

/**
 * WalletPanel - role-aware wallet summary.
 *
 * Delegates to MoneyHero + MoneyStatCards for the role-specific view.
 * Admin mode retains the full detailed breakdown (suspension reason,
 * drift count, reconciliation timestamps).
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { WalletDTO } from '@/lib/walletApi';
import { selectWalletStats, toRole, type DashboardRole } from '@/lib/moneyView';
import MoneyHero from './money/MoneyHero';
import MoneyStatCards from './money/MoneyStatCards';

export interface WalletPanelProps {
  wallet: WalletDTO;
  /** Dashboard role — determines which sub-balances to show. */
  role?: DashboardRole;
  /** Optional heading override. */
  title?: string;
  /** Optional subtitle (e.g. customer email for admin). */
  subtitle?: string;
  /** Compact mode hides the card grid. */
  compact?: boolean;
}

function StatusPill({ status }: { status: WalletDTO['status'] }) {
  const map: Record<WalletDTO['status'], { bg: string; fg: string }> = {
    ACTIVE: { bg: '#DCFCE7', fg: '#166534' },
    SUSPENDED: { bg: '#FEE2E2', fg: '#991B1B' },
    CLOSED: { bg: '#F3F4F6', fg: '#374151' },
  };
  const color = map[status] ?? map.CLOSED;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: color.bg,
        color: color.fg,
        letterSpacing: '0.025em',
      }}
    >
      {status}
    </span>
  );
}

const WalletPanel: React.FC<WalletPanelProps> = ({
  wallet,
  role,
  title,
  subtitle,
  compact = false,
}) => {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();

  // Resolve role — fall back to customerType on the wallet, then 'client'
  const resolvedRole = role ?? toRole(wallet.customerType);
  const stats = selectWalletStats(wallet, resolvedRole);
  const isAdmin = resolvedRole === 'admin';

  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${colors.borderPrimary}`,
        overflow: 'hidden',
      }}
    >
      {/* Admin header band — status pill, drift indicator */}
      {isAdmin && (
        <div
          style={{
            padding: '1rem 1.5rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            {title && (
              <div
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.075em',
                  color: colors.textSecondary,
                  marginBottom: '0.25rem',
                }}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <StatusPill status={wallet.status} />
            {wallet.consecutiveDriftCount > 0 && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 9999,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                }}
              >
                Drift x{wallet.consecutiveDriftCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Non-admin title */}
      {!isAdmin && title && (
        <div
          style={{
            padding: '1rem 1.5rem 0',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.075em',
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}

      {/* Suspension banner */}
      {wallet.suspensionReason && (
        <div
          style={{
            padding: '0.75rem 1.5rem',
            margin: '0.75rem 1.5rem 0',
            borderRadius: '0.5rem',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            fontSize: '0.8125rem',
          }}
        >
          <strong>Suspended:</strong> {wallet.suspensionReason.replaceAll('_', ' ')}
          {wallet.suspendedAt && (
            <span style={{ opacity: 0.8, marginLeft: '0.5rem' }}>
              ({new Date(wallet.suspendedAt).toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Hero number */}
      <MoneyHero stats={stats} />

      {/* Stat cards */}
      {!compact && <MoneyStatCards cards={stats.cards} />}

      {/* Admin meta footer */}
      {isAdmin && !compact && (
        <div
          style={{
            padding: '0.75rem 1.5rem 1rem',
            borderTop: `1px solid ${colors.borderPrimary}`,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: colors.textSecondary,
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            Created: {new Date(wallet.createdAt).toLocaleDateString()}
          </span>
          <span>
            {wallet.customerType} &middot; {formatPrice(wallet.clientSpent)} total spend
          </span>
          {wallet.lastReconciledAt ? (
            <span>
              Last reconciled: {new Date(wallet.lastReconciledAt).toLocaleString()}
            </span>
          ) : (
            <span>Never reconciled</span>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletPanel;
