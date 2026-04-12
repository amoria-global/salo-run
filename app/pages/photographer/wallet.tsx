"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import WalletPanel from '../../components/WalletPanel';
import WalletMovementsTable from '../../components/WalletMovementsTable';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth } from '../../providers/AuthProvider';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';

export default function PhotographerWalletPage() {
  const { colors } = useTheme();
  const { user } = useDashboardAuth();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const w = await getMyWallet();
        if (!cancelled) setWallet(w);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load wallet');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          userRole="photographer"
          balanceAmount={wallet?.balanceAvailable ?? 0}
          tipsAmount={wallet?.balanceTips ?? 0}
          bonusAmount={wallet?.balanceBonuses ?? 0}
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              My Wallet
            </h1>
            <p style={{ fontSize: '0.875rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
              {user?.firstName ? `${user.firstName}, your ` : 'Your '}earnings, tips, bonuses, and withdrawal history.
            </p>
          </div>

          {loading && (
            <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>Loading wallet…</div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {wallet && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <WalletPanel wallet={wallet} title="My Earnings" role="photographer" />
              <WalletMovementsTable mode="me" title="Activity" role="photographer" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
