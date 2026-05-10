"use client";

/**
 * WalletMovementsTable — thin wrapper around the new ActivityFeed.
 *
 * Two modes:
 *   - mode="me"    → ActivityFeed fetches user movements via getMyWalletMovements()
 *   - mode="admin"  → Pre-loads movements from adminGetWallet() and passes them in
 *
 * Preserves the original props interface so existing page imports keep working.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  adminGetWallet,
  type WalletMovementDTO,
} from '@/lib/walletApi';
import { toRole, type DashboardRole } from '@/lib/moneyView';
import ActivityFeed from './money/ActivityFeed';
import ActivityDetailDrawer from './money/ActivityDetailDrawer';
import type { MoneyItem } from '@/lib/moneyView';

export interface WalletMovementsTableProps {
  mode: 'me' | 'admin';
  /** Required for mode="admin". */
  walletId?: string;
  /** Rows per page (defaults to 50). */
  pageSize?: number;
  /** Optional title (shown above the feed). */
  title?: string;
  /** Bump this value from the parent to force a refetch (e.g. after an adjust). */
  refreshKey?: number;
  /** Dashboard role for formatting. Falls back to 'admin' for admin mode. */
  role?: DashboardRole;
}

const WalletMovementsTable: React.FC<WalletMovementsTableProps> = ({
  mode,
  walletId,
  pageSize = 50,
  title,
  refreshKey = 0,
  role,
}) => {
  const { colors } = useTheme();
  const resolvedRole: DashboardRole = role ?? (mode === 'admin' ? 'admin' : 'client');

  // Admin mode: fetch movements ourselves and pass as static data
  const [adminMovements, setAdminMovements] = useState<WalletMovementDTO[]>([]);
  const [adminLoading, setAdminLoading] = useState(mode === 'admin');
  const [adminError, setAdminError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<MoneyItem | null>(null);

  const loadAdmin = useCallback(async () => {
    if (mode !== 'admin' || !walletId) return;
    setAdminLoading(true);
    setAdminError(null);
    try {
      const detail = await adminGetWallet(walletId);
      setAdminMovements(detail.recentMovements || []);
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : 'Failed to load movements');
    } finally {
      setAdminLoading(false);
    }
  }, [mode, walletId]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin, refreshKey]);

  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        padding: '1rem 0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${colors.borderPrimary}`,
      }}
    >
      {title && (
        <div style={{ padding: '0 1rem 0.5rem', fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
          {title}
        </div>
      )}

      {adminError && (
        <div
          style={{
            padding: '0.75rem',
            margin: '0 1rem 0.5rem',
            borderRadius: '0.5rem',
            backgroundColor: colors.statusErrorBg,
            color: colors.statusError,
            fontSize: '0.8125rem',
          }}
        >
          {adminError}
        </div>
      )}

      {mode === 'me' ? (
        <ActivityFeed
          role={resolvedRole}
          pageSize={pageSize}
          onRowClick={setSelectedItem}
        />
      ) : (
        <ActivityFeed
          role={resolvedRole}
          initialMovements={adminMovements}
          staticMode
          onRowClick={setSelectedItem}
        />
      )}

      <ActivityDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};

export default WalletMovementsTable;
