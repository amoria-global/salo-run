"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import WalletPanel from '../../components/WalletPanel';
import WalletMovementsTable from '../../components/WalletMovementsTable';
import WithdrawModal from '../../components/WithdrawModal';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth } from '../../providers/AuthProvider';
import { Can } from '@/app/lib/usePermissions';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';
import { useWorkspace } from '../../providers/WorkspaceProvider';

export default function PhotographerWalletPage() {
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  // In a workspace the photographer was invited to, the balance and summaries are visible; withdrawing and the activity
  // list (the transaction history) stay with the owner.
  const { isShared, active } = useWorkspace();
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
                {isShared
                  ? `${active ? `${active.owner.name}'s` : 'This workspace\'s'} earnings, tips and bonuses.`
                  : `${user?.firstName ? `${user.firstName}, your` : 'Your'} earnings, tips, bonuses, and withdrawal history.`}
              </p>
            </div>
            {/* Withdrawals are a payments.manage action. Restricted team
                members (e.g. Editor, Support) see the wallet but can't
                request a withdrawal; only Finance / Manager-style roles
                granted payments.manage do. Owners always pass. */}
            {!isShared && <Can permission="payments.manage">
              <button onClick={() => setShowWithdrawModal(true)} className="ck-btn ck-btn-primary"
                style={{ padding: '11px 20px', fontSize: '0.92rem' }}>
                <i className="bi bi-bank" /> Withdraw funds
              </button>
            </Can>}
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
              <WalletPanel wallet={wallet} title={isShared ? 'Workspace earnings' : 'My earnings'} role="photographer" />
              {isShared ? (
                <div role="note" className="ck-card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center', color: colors.textSecondary, fontSize: '0.9rem' }}>
                  <i className="bi bi-lock" aria-hidden />
                  <span>Withdrawals and the transaction history stay with the workspace owner.</span>
                </div>
              ) : (
                <WalletMovementsTable mode="me" title="Activity" role="photographer" />
              )}
            </div>
          )}
        </main>
      </div>

      {!isShared && <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        role="photographer"
        colors={colors}
        actualTheme={actualTheme}
      />}
    </div>
  );
}
