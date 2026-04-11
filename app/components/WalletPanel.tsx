"use client";

/**
 * WalletPanel - full breakdown of a wallet, including every sub-balance and
 * status indicators. Consumed by the per-role "My Wallet" pages and by the
 * admin wallet-detail page (read-only).
 *
 * Pure presentational component: caller is responsible for fetching the
 * WalletDTO (via walletApi.ts) and passing it in via props. That keeps the
 * same panel reusable for "my wallet" and "admin viewing someone's wallet".
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { WalletDTO } from '@/lib/walletApi';

export interface WalletPanelProps {
  wallet: WalletDTO;
  /** Optional heading override (e.g. "Photographer wallet", "Client wallet"). */
  title?: string;
  /** Optional subtitle (e.g. customer email). */
  subtitle?: string;
  /** Render in a compact mode (fewer rows). */
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
  title = 'My Wallet',
  subtitle,
  compact = false,
}) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();

  const rowsPrimary: Array<{ label: string; value: number; hint?: string }> = [
    { label: 'Available balance', value: wallet.balanceAvailable, hint: 'Ready to withdraw' },
    { label: 'Pending', value: wallet.pendingAmount, hint: 'Declared but not yet released' },
    { label: 'Held for delivery', value: wallet.heldForDelivery, hint: 'Awaiting media delivery' },
    { label: 'Blocked', value: wallet.blockedAmount, hint: 'Locked by admin / disputes' },
  ];

  const rowsBreakdown: Array<{ label: string; value: number }> = [
    { label: 'Tips', value: wallet.balanceTips },
    { label: 'Bonuses', value: wallet.balanceBonuses },
    { label: 'Gifts', value: wallet.balanceGifts },
    { label: 'Stream fees', value: wallet.balanceStreamFees },
    { label: 'Donations', value: wallet.balanceDonations },
  ];

  const rowsLifetime: Array<{ label: string; value: number }> = [
    { label: 'Total withdrawn', value: wallet.totalWithdrawn },
    { label: 'Total refunded', value: wallet.totalRefunded },
    { label: 'Client spent', value: wallet.clientSpent },
  ];

  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${colors.borderPrimary}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
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
          {subtitle && (
            <div style={{ fontSize: '0.875rem', color: colors.textSecondary, marginBottom: '0.5rem' }}>
              {subtitle}
            </div>
          )}
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
              lineHeight: 1.1,
            }}
          >
            {formatPrice(wallet.balanceAvailable)}
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
            USD · {wallet.customerType}
          </div>
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

      {wallet.suspensionReason && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
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

      {/* Primary rows */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: compact ? 0 : '1.25rem',
        }}
      >
        {rowsPrimary.map((row) => (
          <StatCard
            key={row.label}
            label={row.label}
            hint={row.hint}
            value={formatPrice(row.value)}
            colors={colors}
          />
        ))}
      </div>

      {!compact && (
        <>
          {/* Breakdown section */}
          <SectionHeading colors={colors}>Category breakdown</SectionHeading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            {rowsBreakdown.map((row) => (
              <MiniRow key={row.label} label={row.label} value={formatPrice(row.value)} colors={colors} />
            ))}
          </div>

          {/* Lifetime section */}
          <SectionHeading colors={colors}>Lifetime totals</SectionHeading>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            {rowsLifetime.map((row) => (
              <MiniRow key={row.label} label={row.label} value={formatPrice(row.value)} colors={colors} />
            ))}
          </div>

          {/* Meta footer */}
          <div
            style={{
              paddingTop: '1rem',
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
            {wallet.lastReconciledAt ? (
              <span>
                Last reconciled: {new Date(wallet.lastReconciledAt).toLocaleString()}
              </span>
            ) : (
              <span>Never reconciled</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ------------- Sub-components -------------

type ColorsType = ReturnType<typeof useTheme>['colors'];

function StatCard({
  label,
  value,
  hint,
  colors,
}: {
  label: string;
  value: string;
  hint?: string;
  colors: ColorsType;
}) {
  return (
    <div
      style={{
        padding: '0.875rem 1rem',
        borderRadius: '0.625rem',
        backgroundColor: colors.bgTertiary,
        border: `1px solid ${colors.borderPrimary}`,
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: colors.textSecondary,
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: colors.textPrimary }}>{value}</div>
      {hint && (
        <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.125rem' }}>{hint}</div>
      )}
    </div>
  );
}

function MiniRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ColorsType;
}) {
  return (
    <div
      style={{
        padding: '0.625rem 0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: colors.bgTertiary,
      }}
    >
      <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginBottom: '0.125rem' }}>{label}</div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.textPrimary }}>{value}</div>
    </div>
  );
}

function SectionHeading({ colors, children }: { colors: ColorsType; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.075em',
        color: colors.textSecondary,
        marginBottom: '0.5rem',
      }}
    >
      {children}
    </div>
  );
}

export default WalletPanel;
