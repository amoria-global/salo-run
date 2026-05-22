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
  adminGetAuditLogs,
  adminReactivateWallet,
  adminReconcileWallet,
  type AdminWalletDetail,
  type ReconciliationResult,
  type WalletDTO,
  type WalletAuditLogDTO,
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

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<WalletAuditLogDTO[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);

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

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const result = await adminGetAuditLogs(walletId, auditPage, 10);
      setAuditLogs(result.content);
      setAuditTotalPages(result.totalPages);
    } catch {
      // Audit logs are supplementary. fail silently
    } finally {
      setAuditLoading(false);
    }
  }, [walletId, auditPage]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const applyWalletUpdate = (w: WalletDTO) => {
    setDetail((prev) => (prev ? { ...prev, wallet: w } : prev));
  };

  const handleReconcile = async () => {
    setBusy(true);
    setActionMsg(null);
    setActionError(null);
    try {
      const result: ReconciliationResult = await adminReconcileWallet(walletId);
      if (result.hasDrift) {
        setActionMsg(
          result.wasCorrected
            ? `Drift detected and corrected. ${result.message ?? ''}`
            : `Drift detected but NOT corrected. ${result.wasSuspended ? 'Wallet suspended.' : ''}`
        );
      } else {
        setActionMsg('No drift detected \u2014 wallet is reconciled.');
      }
      await load();
      loadAuditLogs();
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
      loadAuditLogs();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reactivate.');
    } finally {
      setBusy(false);
    }
  };

  const walletSubtitle = detail?.wallet
    ? detail.wallet.customerName
      ? `${detail.wallet.customerName} (${detail.wallet.customerEmail ?? detail.wallet.customerId})`
      : `Customer ${detail.wallet.customerId}`
    : '';

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
                {walletSubtitle}
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
            <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>Loading wallet\u2026</div>
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
                subtitle={walletSubtitle}
              />
              <WalletMovementsTable
                mode="admin"
                walletId={walletId}
                title="Recent movements"
                refreshKey={refreshKey}
                role="admin"
              />

              {/* Audit Log */}
              <div
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.borderPrimary}`,
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    margin: '0 0 1rem',
                  }}
                >
                  Audit Log
                </h3>

                {auditLoading && (
                  <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
                    Loading audit logs\u2026
                  </div>
                )}

                {!auditLoading && auditLogs.length === 0 && (
                  <div style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
                    No audit log entries yet.
                  </div>
                )}

                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      borderBottom: `1px solid ${colors.borderPrimary}`,
                      padding: '0.75rem 0',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: auditEventColor(log.eventType, colors),
                        }}
                      >
                        {log.eventType.replaceAll('_', ' ')}
                      </span>
                      <span style={{ color: colors.textSecondary, fontSize: '0.75rem' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.reason && (
                      <div style={{ color: colors.textSecondary, fontSize: '0.8125rem' }}>
                        {log.reason}
                      </div>
                    )}
                    {log.diffSummary && (
                      <details style={{ marginTop: '0.25rem' }}>
                        <summary
                          style={{
                            color: colors.textSecondary,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          View diff
                        </summary>
                        <pre
                          style={{
                            fontSize: '0.7rem',
                            color: colors.textSecondary,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            marginTop: '0.25rem',
                            backgroundColor: colors.bgPrimary,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                          }}
                        >
                          {log.diffSummary}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}

                {auditTotalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      disabled={auditPage === 0}
                      onClick={() => setAuditPage((p) => p - 1)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: `1px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgCard,
                        color: auditPage > 0 ? colors.textPrimary : colors.textSecondary,
                        cursor: auditPage > 0 ? 'pointer' : 'not-allowed',
                        opacity: auditPage > 0 ? 1 : 0.5,
                      }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                      Page {auditPage + 1} / {auditTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={auditPage >= auditTotalPages - 1}
                      onClick={() => setAuditPage((p) => p + 1)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: `1px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgCard,
                        color:
                          auditPage < auditTotalPages - 1
                            ? colors.textPrimary
                            : colors.textSecondary,
                        cursor: auditPage < auditTotalPages - 1 ? 'pointer' : 'not-allowed',
                        opacity: auditPage < auditTotalPages - 1 ? 1 : 0.5,
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
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
              loadAuditLogs();
            }}
          />
          <AdjustWalletModal
            isOpen={adjustOpen}
            walletId={walletId}
            onClose={() => setAdjustOpen(false)}
            onSuccess={() => {
              setActionMsg('Adjustment applied.');
              load();
              loadAuditLogs();
              setRefreshKey((k) => k + 1);
            }}
          />
        </>
      )}
    </div>
  );
}

type ColorsType = ReturnType<typeof useTheme>['colors'];

function auditEventColor(eventType: string, colors: ColorsType): string {
  if (eventType.includes('DRIFT')) return '#991B1B';
  if (eventType.includes('CORRECTED')) return '#166534';
  if (eventType === 'RECONCILE_OK') return '#166534';
  if (eventType === 'STATUS_CHANGED') return '#92400E';
  if (eventType === 'MANUAL_ADJUSTMENT') return '#1E40AF';
  return colors.textPrimary;
}

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
