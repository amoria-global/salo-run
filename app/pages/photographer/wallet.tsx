"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import WalletPanel from '../../components/WalletPanel';
import WalletMovementsTable from '../../components/WalletMovementsTable';
import WithdrawModal from '../../components/WithdrawModal';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth } from '../../providers/AuthProvider';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';

export default function PhotographerWalletPage() {
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ck-surface-soft)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar userRole="photographer" />

        <main className="ck-page" style={{ overflowY: 'auto', flex: 1 }}>
          <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            gap: 16, flexWrap: 'wrap', margin: '8px 0 22px',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
              }}>Money</div>
              <h1 style={{
                margin: 0, fontSize: '1.85rem', fontWeight: 800,
                letterSpacing: '-0.02em', color: colors.textPrimary,
              }}>My wallet</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                {user?.firstName ? `${user.firstName}, your` : 'Your'} earnings, tips, bonuses, and withdrawal history.
              </p>
            </div>
            <button onClick={() => setShowWithdrawModal(true)} className="ck-btn ck-btn-primary"
              style={{ padding: '11px 20px', fontSize: '0.92rem' }}>
              <i className="bi bi-bank" /> Withdraw funds
            </button>
          </header>

          {loading && (
            <div className="ck-card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 10, color: colors.textSecondary }}>
              <span className="ck-spinner" /> Loading wallet…
            </div>
          )}

          {error && !loading && (
            <div style={{
              padding: '14px 18px', borderRadius: 12,
              background: '#FEF2F2', border: '1px solid #FECACA',
              color: '#991B1B', fontSize: '0.9rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="bi bi-exclamation-octagon-fill" /> {error}
            </div>
          )}

          {wallet && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <WalletPanel wallet={wallet} title="My earnings" role="photographer" />
              <WalletMovementsTable mode="me" title="Activity" role="photographer" />
            </div>
          )}
        </main>
      </div>

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        role="photographer"
        colors={colors}
        actualTheme={actualTheme}
      />
    </div>
  );
}
