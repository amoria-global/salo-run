"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import {
  adminListWallets,
  adminProvisionWallets,
  type WalletDTO,
  type WalletStatus,
  type SpringPage,
} from '@/lib/walletApi';

const STATUS_OPTIONS: WalletStatus[] = ['ACTIVE', 'SUSPENDED', 'CLOSED'];
const CUSTOMER_TYPE_OPTIONS = ['photographer', 'client', 'event-coordinator'];

export default function AdminWalletsPage() {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();

  const [status, setStatus] = useState<WalletStatus>('ACTIVE');
  const [customerType, setCustomerType] = useState<string>('');
  const [search, setSearch] = useState('');
  const [hasDrift, setHasDrift] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SpringPage<WalletDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Provision state
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminListWallets({
        status,
        customerType: customerType || undefined,
        search: search || undefined,
        hasDrift: hasDrift || undefined,
        sortBy,
        sortDir,
        page,
        size: 20,
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallets.');
    } finally {
      setLoading(false);
    }
  }, [status, customerType, search, hasDrift, sortBy, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleProvision = async () => {
    setProvisioning(true);
    setProvisionMsg(null);
    try {
      const result = await adminProvisionWallets();
      setProvisionMsg(
        result.provisioned > 0
          ? `Provisioned ${result.provisioned} missing wallet(s).`
          : 'All customers already have wallets.'
      );
      if (result.provisioned > 0) load();
    } catch (e) {
      setProvisionMsg(e instanceof Error ? e.message : 'Failed to provision.');
    } finally {
      setProvisioning(false);
    }
  };

  const totalPages = data?.totalPages ?? 1;
  const content = data?.content ?? [];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="admin" />

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* Header */}
          <div
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                Wallets
              </h1>
              <p style={{ fontSize: '0.875rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Inspect, reconcile, suspend, or manually adjust customer wallets.
              </p>
            </div>
            <button
              type="button"
              onClick={handleProvision}
              disabled={provisioning}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#083A85',
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: provisioning ? 'not-allowed' : 'pointer',
                opacity: provisioning ? 0.6 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {provisioning ? 'Provisioning\u2026' : 'Provision missing wallets'}
            </button>
          </div>

          {/* Provision feedback */}
          {provisionMsg && (
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
              {provisionMsg}
            </div>
          )}

          {/* Filters */}
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search name, email\u2026"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: `1px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgPrimary,
                color: colors.textPrimary,
                fontSize: '0.8125rem',
                minWidth: '180px',
                flex: '1 1 180px',
                maxWidth: '300px',
              }}
            />

            {/* Status */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: colors.textSecondary, fontWeight: 500 }}>
                Status:
              </span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(0); }}
                  style={pillStyle(colors, status === s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Customer type */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: colors.textSecondary, fontWeight: 500 }}>
                Type:
              </span>
              <button
                onClick={() => { setCustomerType(''); setPage(0); }}
                style={pillStyle(colors, customerType === '')}
              >
                All
              </button>
              {CUSTOMER_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setCustomerType(t); setPage(0); }}
                  style={pillStyle(colors, customerType === t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Drift toggle */}
            <label
              style={{
                fontSize: '0.8125rem',
                color: colors.textSecondary,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={hasDrift}
                onChange={(e) => { setHasDrift(e.target.checked); setPage(0); }}
              />
              Drift only
            </label>

            {/* Sort */}
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: colors.textSecondary, fontWeight: 500 }}>
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  fontSize: '0.75rem',
                  backgroundColor: colors.bgPrimary,
                  color: colors.textPrimary,
                }}
              >
                <option value="createdAt">Created</option>
                <option value="balance">Balance</option>
                <option value="driftCount">Drift Count</option>
                <option value="lastReconciled">Last Reconciled</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '0.375rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: colors.bgPrimary,
                  color: colors.textPrimary,
                }}
              >
                {sortDir === 'asc' ? '\u2191 ASC' : '\u2193 DESC'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Table */}
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                  <Th colors={colors}>Customer</Th>
                  <Th colors={colors}>Type</Th>
                  <Th colors={colors}>Status</Th>
                  <Th colors={colors} align="right">Available</Th>
                  <Th colors={colors} align="right">Held</Th>
                  <Th colors={colors} align="right">Pending</Th>
                  <Th colors={colors}>Last reconciled</Th>
                  <Th colors={colors}>Drift</Th>
                  <Th colors={colors}></Th>
                </tr>
              </thead>
              <tbody>
                {loading && content.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: '2rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: colors.textSecondary,
                      }}
                    >
                      Loading wallets\u2026
                    </td>
                  </tr>
                )}
                {!loading && content.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: '2rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: colors.textSecondary,
                      }}
                    >
                      No wallets match these filters.
                    </td>
                  </tr>
                )}
                {content.map((w) => (
                  <tr key={w.id} style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
                    <Td colors={colors}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                          {w.customerName || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: colors.textSecondary }}>
                          {w.customerEmail || w.customerId.slice(0, 8) + '\u2026'}
                        </div>
                      </div>
                    </Td>
                    <Td colors={colors}>{w.customerType}</Td>
                    <Td colors={colors}>
                      <StatusPill status={w.status} />
                    </Td>
                    <Td colors={colors} align="right">
                      <span
                        style={{
                          fontWeight: 600,
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                        }}
                      >
                        {formatPrice(w.balanceAvailable)}
                      </span>
                    </Td>
                    <Td colors={colors} align="right">{formatPrice(w.heldForDelivery)}</Td>
                    <Td colors={colors} align="right">{formatPrice(w.pendingAmount)}</Td>
                    <Td colors={colors}>
                      {w.lastReconciledAt
                        ? new Date(w.lastReconciledAt).toLocaleDateString()
                        : '\u2014'}
                    </Td>
                    <Td colors={colors}>
                      {w.consecutiveDriftCount > 0 ? (
                        <span style={{ color: '#92400E', fontWeight: 600 }}>
                          x{w.consecutiveDriftCount}
                        </span>
                      ) : (
                        '\u2014'
                      )}
                    </Td>
                    <Td colors={colors}>
                      <Link
                        href={`/user/admin/wallets/${w.id}`}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Inspect
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              fontSize: '0.8125rem',
              color: colors.textSecondary,
            }}
          >
            <span>
              Page {page + 1} of {totalPages} &middot; {data?.totalElements ?? 0} total
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => page > 0 && setPage(page - 1)}
                disabled={page === 0 || loading}
                style={pagBtn(colors, page > 0 && !loading)}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => page < totalPages - 1 && setPage(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                style={pagBtn(colors, page < totalPages - 1 && !loading)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Small helpers ====================

function StatusPill({ status }: { status: WalletStatus }) {
  const map: Record<WalletStatus, { bg: string; fg: string }> = {
    ACTIVE: { bg: '#DCFCE7', fg: '#166534' },
    SUSPENDED: { bg: '#FEE2E2', fg: '#991B1B' },
    CLOSED: { bg: '#F3F4F6', fg: '#374151' },
  };
  const c = map[status];
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: '0.7rem',
        fontWeight: 600,
        backgroundColor: c.bg,
        color: c.fg,
      }}
    >
      {status}
    </span>
  );
}

type ColorsType = ReturnType<typeof useTheme>['colors'];

function pillStyle(colors: ColorsType, active: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: active ? '#083A85' : colors.bgTertiary,
    color: active ? 'white' : colors.textSecondary,
  };
}

function Th({
  colors,
  children,
  align = 'left',
}: {
  colors: ColorsType;
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.625rem 0.5rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  colors,
  children,
  align = 'left',
}: {
  colors: ColorsType;
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      style={{
        textAlign: align,
        padding: '0.75rem 0.5rem',
        fontSize: '0.8125rem',
        color: colors.textPrimary,
      }}
    >
      {children}
    </td>
  );
}

function pagBtn(colors: ColorsType, enabled: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.875rem',
    borderRadius: '0.375rem',
    border: `1px solid ${colors.borderPrimary}`,
    backgroundColor: enabled ? colors.bgCard : colors.bgTertiary,
    color: enabled ? colors.textPrimary : colors.textSecondary,
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.6,
  };
}
