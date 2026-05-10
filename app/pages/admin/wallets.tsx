"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useCurrency } from '@/app/context/CurrencyContext';
import {
  adminListWallets,
  adminProvisionWallets,
  type WalletDTO,
  type WalletStatus,
  type SpringPage,
} from '@/lib/walletApi';
import { Card, PageHeader, Search, Tabs, Badge, Button, EmptyState } from '../../components/ui';

const STATUS_OPTIONS: WalletStatus[] = ['ACTIVE', 'SUSPENDED', 'CLOSED'];
const CUSTOMER_TYPE_OPTIONS = ['photographer', 'client', 'event-coordinator'];

export default function AdminWalletsPage() {
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

  useEffect(() => { load(); }, [load]);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
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

  const statusTone = (s: WalletStatus): 'success' | 'error' | 'muted' => {
    if (s === 'ACTIVE') return 'success';
    if (s === 'SUSPENDED') return 'error';
    return 'muted';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ck-surface-soft)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar userRole="admin" />

        <main className="ck-page" style={{ overflowY: 'auto', flex: 1 }}>
          <PageHeader
            eyebrow="Admin"
            title="Wallets"
            subtitle="Inspect, reconcile, suspend, or manually adjust customer wallets."
            actions={
              <Button
                variant="primary"
                onClick={handleProvision}
                loading={provisioning}
                iconLeft={<i className="bi bi-plus-circle" />}
              >
                Provision missing
              </Button>
            }
          />

          {provisionMsg && (
            <Card style={{ marginBottom: 14, background: '#EFF6FF', borderColor: '#BFDBFE' }} padding={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E40AF', fontSize: '0.88rem' }}>
                <i className="bi bi-info-circle-fill" />
                <span>{provisionMsg}</span>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card padding={16} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200, maxWidth: 320 }}>
                <Search
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onClear={() => setSearchInput('')}
                  placeholder="Search name, email…"
                />
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ck-text-soft)' }}>Status</span>
                <Tabs
                  active={status}
                  onChange={(k) => { setStatus(k as WalletStatus); setPage(0); }}
                  items={STATUS_OPTIONS.map(s => ({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ck-text-soft)' }}>Type</span>
                <Tabs
                  active={customerType || 'all'}
                  onChange={(k) => { setCustomerType(k === 'all' ? '' : k); setPage(0); }}
                  items={[
                    { key: 'all', label: 'All' },
                    ...CUSTOMER_TYPE_OPTIONS.map(t => ({ key: t, label: t.replace('-', ' ') })),
                  ]}
                />
              </div>

              <label style={{
                fontSize: '0.85rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                padding: '7px 12px', borderRadius: 9999, border: '1px solid var(--ck-stroke)',
                background: hasDrift ? 'rgba(242,12,143,0.08)' : 'var(--ck-surface)',
                color: hasDrift ? '#F20C8F' : 'var(--ck-text)',
              }}>
                <input
                  type="checkbox"
                  checked={hasDrift}
                  onChange={(e) => { setHasDrift(e.target.checked); setPage(0); }}
                  style={{ accentColor: '#F20C8F' }}
                />
                Drift only
              </label>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ck-text-soft)' }}>Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="ck-input"
                  style={{ width: 'auto', padding: '7px 10px', fontSize: '0.85rem' }}
                >
                  <option value="createdAt">Created</option>
                  <option value="balance">Balance</option>
                  <option value="driftCount">Drift Count</option>
                  <option value="lastReconciled">Last Reconciled</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                  className="ck-btn ck-btn-ghost"
                  style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                  aria-label={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
                >
                  <i className={`bi ${sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down'}`} /> {sortDir.toUpperCase()}
                </button>
              </div>
            </div>
          </Card>

          {error && (
            <Card style={{ marginBottom: 14, background: '#FEF2F2', borderColor: '#FECACA' }} padding={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontSize: '0.88rem' }}>
                <i className="bi bi-exclamation-octagon-fill" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {/* Table */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--ck-surface-soft)' }}>
                    <Th>Customer</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th align="right">Available</Th>
                    <Th align="right">Held</Th>
                    <Th align="right">Pending</Th>
                    <Th>Last reconciled</Th>
                    <Th>Drift</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  {loading && content.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--ck-text-soft)' }}>
                          <span className="ck-spinner" /> Loading wallets…
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && content.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 0 }}>
                        <EmptyState
                          icon={<i className="bi bi-wallet2" />}
                          title="No wallets match"
                          description="Try adjusting filters or clearing the search."
                        />
                      </td>
                    </tr>
                  )}
                  {content.map((w) => (
                    <tr
                      key={w.id}
                      style={{ borderTop: '1px solid var(--ck-stroke)' }}
                    >
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="ck-avatar" style={{ width: 32, height: 32, fontSize: '0.78rem' }}>
                            {(w.customerName || w.customerEmail || 'U').charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ck-text)' }}>
                              {w.customerName || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ck-text-soft)' }}>
                              {w.customerEmail || w.customerId.slice(0, 8) + '…'}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="ck-pill" style={{ background: 'rgba(8,58,133,0.06)', color: 'var(--ck-blue)', textTransform: 'capitalize' }}>{w.customerType}</span>
                      </Td>
                      <Td><Badge tone={statusTone(w.status)}>{w.status}</Badge></Td>
                      <Td align="right">
                        <span style={{ fontWeight: 700, color: 'var(--ck-blue)' }}>{formatPrice(w.balanceAvailable)}</span>
                      </Td>
                      <Td align="right">{formatPrice(w.heldForDelivery)}</Td>
                      <Td align="right">{formatPrice(w.pendingAmount)}</Td>
                      <Td>{w.lastReconciledAt ? new Date(w.lastReconciledAt).toLocaleDateString() : '—'}</Td>
                      <Td>
                        {w.consecutiveDriftCount > 0
                          ? <Badge tone="warning">×{w.consecutiveDriftCount}</Badge>
                          : '—'}
                      </Td>
                      <Td>
                        <Link
                          href={`/user/admin/wallets/${w.id}`}
                          className="ck-btn ck-btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          Inspect <i className="bi bi-arrow-right" />
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
            fontSize: '0.85rem',
            color: 'var(--ck-text-soft)',
          }}>
            <span>Page {page + 1} of {totalPages} · {data?.totalElements ?? 0} total</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" disabled={page === 0 || loading} onClick={() => page > 0 && setPage(page - 1)}>
                <i className="bi bi-arrow-left" /> Previous
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages - 1 || loading} onClick={() => page < totalPages - 1 && setPage(page + 1)}>
                Next <i className="bi bi-arrow-right" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th style={{
      textAlign: align,
      padding: '12px 16px',
      fontSize: '0.7rem',
      fontWeight: 700,
      color: 'var(--ck-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>{children}</th>
  );
}

function Td({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td style={{
      textAlign: align,
      padding: '14px 16px',
      fontSize: '0.88rem',
      color: 'var(--ck-text)',
      verticalAlign: 'middle',
    }}>{children}</td>
  );
}
