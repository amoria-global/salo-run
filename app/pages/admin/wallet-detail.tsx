"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import WalletPanel from '../../components/WalletPanel';
import WalletMovementsTable from '../../components/WalletMovementsTable';
import SuspendWalletModal from '../../components/admin/SuspendWalletModal';
import AdjustWalletModal from '../../components/admin/AdjustWalletModal';
import { useTheme } from '../../context/ThemeContext';
import {
  adminGetWallet,
  adminReactivateWallet,
  adminReconcileWallet,
  type AdminWalletDetail,
  type ReconciliationResult,
  type WalletDTO,
} from '@/lib/walletApi';

export interface AdminWalletDetailPageProps {
  walletId: string;
}

export default function AdminWalletDetailPage({ walletId }: AdminWalletDetailPageProps) {
  const { colors } = useTheme();
  const [detail, setDetail] = useState<AdminWalletDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await adminGetWallet(walletId);
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    load();
  }, [load]);

  const applyWalletUpdate = (w: WalletDTO) => {
    setDetail((prev) => (prev ? { ...prev, wallet: w } : prev));
  };

  const handleReconcile = async () => {
    setBusy(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const result: ReconciliationResult = await adminReconcileWallet(walletId);
      if (result.driftDetected) {
        setActionMsg(
          result.corrected
            ? `Drift detected and corrected. Reason: ${result.reason ?? '—'}`
            : `Drift detected but NOT corrected. ${result.suspended ? 'Wallet suspended.' : ''}`
        );
      } else {
        setActionMsg('No drift detected — wallet is reconciled.');
      }
      await load();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reconcile.');
    } finally {
      setBusy(false);
    }
  };

  const handleReactivate = async () => {
    setBusy(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const updated = await adminReactivateWallet(walletId);
      applyWalletUpdate(updated);
      setActionMsg('Wallet reactivated.');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reactivate.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="admin" />

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div
            style={{
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Link
                href="/user/admin/wallets"
                style={{
                  fontSize: '0.8125rem',
                  color: colors.textSecondary,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginBottom: '0.5rem',
                }}
              >
                <i className="bi bi-arrow-left"></i> Back to wallets
              </Link>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                Wallet detail
              </h1>
              <p style={{ fontSize: '0.8125rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                <code>{walletId}</code>
              </p>
            </div>

            {detail && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <ActionButton
                  onClick={handleReconcile}
                  disabled={busy}
                  variant="neutral"
                  colors={colors}
                >
                  Reconcile
                </ActionButton>
                {detail.wallet.status === 'ACTIVE' ? (
                  <ActionButton
                    onClick={() => setSuspendOpen(true)}
                    disabled={busy}
                    variant="danger"
                    colors={colors}
                  >
                    Suspend
                  </ActionButton>
                ) : (
                  <ActionButton
                    onClick={handleReactivate}
                    disabled={busy}
                    variant="success"
                    colors={colors}
                  >
                    Reactivate
                  </ActionButton>
                )}
                <ActionButton
                  onClick={() => setAdjustOpen(true)}
                  disabled={busy}
                  variant="primary"
                  colors={colors}
                >
                  Adjust
                </ActionButton>
              </div>
            )}
          </div>

          {actionMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              {actionMsg}
            </div>
          )}
          {actionError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              {actionError}
            </div>
          )}

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

          {detail && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <WalletPanel
                wallet={detail.wallet}
                role="admin"
                title="Wallet snapshot"
                subtitle={`Customer ${detail.wallet.customerId}`}
              />
              <WalletMovementsTable
                mode="admin"
                walletId={walletId}
                title="Recent movements"
                refreshKey={refreshKey}
                role="admin"
              />
            </div>
          )}
        </div>
      </div>

      {detail && (
        <>
          <SuspendWalletModal
            isOpen={suspendOpen}
            walletId={walletId}
            onClose={() => setSuspendOpen(false)}
            onSuccess={(w) => {
              applyWalletUpdate(w);
              setActionMsg('Wallet suspended.');
            }}
          />
          <AdjustWalletModal
            isOpen={adjustOpen}
            walletId={walletId}
            onClose={() => setAdjustOpen(false)}
            onSuccess={() => {
              setActionMsg('Adjustment applied.');
              load();
              setRefreshKey((k) => k + 1);
            }}
          />
        </>
      )}
    </div>
  );
}

type ColorsType = ReturnType<typeof useTheme>['colors'];

function ActionButton({
  onClick,
  disabled,
  variant,
  colors,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'danger' | 'success' | 'neutral';
  colors: ColorsType;
  children: React.ReactNode;
}) {
  const styles: Record<typeof variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: '#083A85', fg: 'white', border: '#083A85' },
    danger: { bg: '#991B1B', fg: 'white', border: '#991B1B' },
    success: { bg: '#166534', fg: 'white', border: '#166534' },
    neutral: { bg: colors.bgCard, fg: colors.textPrimary, border: colors.borderPrimary },
  };
  const s = styles[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.fg,
        fontSize: '0.8125rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
