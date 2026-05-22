"use client";

/**
 * WalletMovementsTable. thin wrapper around the new ActivityFeed.
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
    <div className="ck-card" style={{ padding: 0, overflow: 'hidden' }}>
      {title && (
        <div style={{
          padding: '18px 24px 12px',
          borderBottom: '1px solid var(--ck-stroke)',
          background: 'var(--ck-surface)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(8,58,133,0.08)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="bi bi-arrow-left-right" style={{ color: 'var(--ck-blue)', fontSize: 14 }} />
          </div>
          <div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: 'var(--ck-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Transactions</div>
            <div style={{
              fontSize: '1rem', fontWeight: 700, color: 'var(--ck-text)',
              letterSpacing: '-0.005em',
            }}>{title}</div>
          </div>
        </div>
      )}

      {adminError && (
        <div style={{
          padding: '10px 14px', margin: '12px 18px', borderRadius: 10,
          background: '#FEF2F2', border: '1px solid #FECACA',
          color: '#991B1B', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="bi bi-exclamation-octagon-fill" /> {adminError}
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
