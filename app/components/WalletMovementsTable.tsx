"use client";

/**
 * WalletMovementsTable - paginated table of wallet movements.
 *
 * Two modes:
 *   - mode="me"        → calls getMyWalletMovements() (user-facing)
 *   - mode="admin"     → calls adminGetWallet(walletId) and reads
 *                        detail.recentMovements (admin-facing)
 *
 * For the admin mode we piggy-back on the detail endpoint (which already
 * ships the 50 most recent movements) rather than introducing a new
 * admin-side /movements endpoint — keeps the surface area small.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import {
  getMyWalletMovements,
  adminGetWallet,
  type WalletMovementDTO,
} from '@/lib/walletApi';

export interface WalletMovementsTableProps {
  mode: 'me' | 'admin';
  /** Required for mode="admin". */
  walletId?: string;
  /** Rows per page (defaults to 20 for "me", ignored for admin). */
  pageSize?: number;
  /** Optional title. */
  title?: string;
  /** Bump this value from the parent to force a refetch (e.g. after an adjust). */
  refreshKey?: number;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WalletMovementsTable: React.FC<WalletMovementsTableProps> = ({
  mode,
  walletId,
  pageSize = 20,
  title = 'Movements',
  refreshKey = 0,
}) => {
  const { colors } = useTheme();
  const { formatPrice } = useCurrency();

  const [rows, setRows] = useState<WalletMovementDTO[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'me') {
          const result = await getMyWalletMovements(p, pageSize);
          setRows(result.content);
          setTotalPages(result.totalPages || 1);
          setTotalElements(result.totalElements || 0);
          setPage(result.number ?? p);
        } else {
          if (!walletId) {
            setRows([]);
            setTotalPages(1);
            setTotalElements(0);
            return;
          }
          const detail = await adminGetWallet(walletId);
          setRows(detail.recentMovements || []);
          setTotalPages(1);
          setTotalElements((detail.recentMovements || []).length);
          setPage(0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load movements');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [mode, walletId, pageSize]
  );

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, walletId, refreshKey]);

  const canPrev = mode === 'me' && page > 0 && !loading;
  const canNext = mode === 'me' && page < totalPages - 1 && !loading;

  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${colors.borderPrimary}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h3>
          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.125rem' }}>
            {loading ? 'Loading…' : `${totalElements} entr${totalElements === 1 ? 'y' : 'ies'}`}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}>
              <Th colors={colors}>Date</Th>
              <Th colors={colors}>Category</Th>
              <Th colors={colors}>Direction</Th>
              <Th colors={colors}>Source</Th>
              <Th colors={colors} align="right">
                Amount (USD)
              </Th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: colors.textSecondary,
                  }}
                >
                  Loading movements…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: colors.textSecondary,
                  }}
                >
                  No movements yet.
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const isCredit = m.direction === 'CREDIT';
              return (
                <tr
                  key={m.id}
                  style={{ borderBottom: `1px solid ${colors.borderPrimary}` }}
                >
                  <Td colors={colors}>{formatDate(m.createdAt)}</Td>
                  <Td colors={colors}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: colors.bgTertiary,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: colors.textPrimary,
                      }}
                    >
                      {String(m.category).replaceAll('_', ' ')}
                    </span>
                  </Td>
                  <Td colors={colors}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 9999,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2',
                        color: isCredit ? '#166534' : '#991B1B',
                      }}
                    >
                      {m.direction}
                    </span>
                  </Td>
                  <Td colors={colors}>
                    <div style={{ fontSize: '0.8125rem' }}>{m.sourceType}</div>
                    {m.description && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: colors.textSecondary,
                          marginTop: '0.125rem',
                        }}
                      >
                        {m.description}
                      </div>
                    )}
                  </Td>
                  <Td colors={colors} align="right">
                    <span
                      style={{
                        fontWeight: 600,
                        color: isCredit ? '#166534' : '#991B1B',
                      }}
                    >
                      {isCredit ? '+' : '−'} {formatPrice(m.amountUsd)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {mode === 'me' && totalPages > 1 && (
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
            Page {page + 1} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => canPrev && load(page - 1)}
              disabled={!canPrev}
              style={paginationBtn(colors, canPrev)}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => canNext && load(page + 1)}
              disabled={!canNext}
              style={paginationBtn(colors, canNext)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function Th({
  colors,
  children,
  align = 'left',
}: {
  colors: ColorsType;
  children: React.ReactNode;
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
  children: React.ReactNode;
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

type ColorsType = ReturnType<typeof useTheme>['colors'];

function paginationBtn(colors: ColorsType, enabled: boolean): React.CSSProperties {
  return {
    padding: '0.375rem 0.75rem',
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

export default WalletMovementsTable;
