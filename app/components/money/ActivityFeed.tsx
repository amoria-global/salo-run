'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import type { WalletMovementDTO, SpringPage } from '@/lib/walletApi';
import { getMyWalletMovements } from '@/lib/walletApi';
import {
  formatWalletMovement,
  getFilterTags,
  type DashboardRole,
  type MoneyItem,
} from '@/lib/moneyView';
import ActivityRow from './ActivityRow';

interface ActivityFeedProps {
  role: DashboardRole;
  /** Optionally pass pre-loaded movements (e.g. admin detail page). */
  initialMovements?: WalletMovementDTO[];
  /** When true, disables the built-in fetch and only renders initialMovements. */
  staticMode?: boolean;
  /** Callback when a row is clicked (for opening detail drawer). */
  onRowClick?: (item: MoneyItem) => void;
  /** Page size for API calls. Default 50. */
  pageSize?: number;
}

/**
 * Stateful activity feed. Fetches wallet movements, applies role-aware formatting,
 * supports filter pills and pagination.
 */
export default function ActivityFeed({
  role,
  initialMovements,
  staticMode = false,
  onRowClick,
  pageSize = 50,
}: ActivityFeedProps) {
  const { colors } = useTheme();

  const [movements, setMovements] = useState<WalletMovementDTO[]>(initialMovements || []);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(!staticMode && !initialMovements);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = getFilterTags(role);

  // Fetch movements
  const fetchMovements = useCallback(
    async (p: number) => {
      if (staticMode) return;
      setLoading(true);
      setError(null);
      try {
        const result: SpringPage<WalletMovementDTO> = await getMyWalletMovements(p, pageSize);
        setMovements(result.content);
        setTotalPages(result.totalPages);
        setPage(result.number);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    },
    [staticMode, pageSize],
  );

  useEffect(() => {
    if (!staticMode && !initialMovements) {
      fetchMovements(0);
    }
  }, [fetchMovements, staticMode, initialMovements]);

  // Update when initialMovements changes (admin detail reloads)
  useEffect(() => {
    if (initialMovements) {
      setMovements(initialMovements);
    }
  }, [initialMovements]);

  // Format + filter movements
  const items: MoneyItem[] = [];
  for (const m of movements) {
    const item = formatWalletMovement(m, role);
    if (!item) continue;
    if (activeFilter !== 'All' && item.tag !== activeFilter) continue;
    items.push(item);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
        }}
      >
        <span
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          Activity
        </span>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.375rem',
          overflowX: 'auto',
          padding: '0 1rem 0.25rem',
          scrollbarWidth: 'none',
        }}
      >
        {filters.map((tag) => {
          const active = tag === activeFilter;
          return (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: active ? 600 : 400,
                backgroundColor: active ? colors.brandPrimary : colors.bgTertiary,
                color: active ? '#fff' : colors.textSecondary,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '1.5rem',
              height: '1.5rem',
              border: `2px solid ${colors.borderPrimary}`,
              borderTopColor: colors.brandPrimary,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem',
            margin: '0 1rem',
            borderRadius: '0.5rem',
            backgroundColor: colors.statusErrorBg,
            color: colors.statusError,
            fontSize: '0.8125rem',
            textAlign: 'center',
          }}
        >
          {error}
          <button
            onClick={() => fetchMovements(page)}
            style={{
              marginLeft: '0.5rem',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: colors.textTertiary,
            fontSize: '0.8125rem',
          }}
        >
          {activeFilter === 'All'
            ? 'No activity yet'
            : `No ${activeFilter.toLowerCase()} activity`}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} onClick={onRowClick} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!staticMode && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
          }}
        >
          <button
            disabled={page === 0}
            onClick={() => fetchMovements(page - 1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.borderPrimary}`,
              backgroundColor: colors.bgSecondary,
              color: page === 0 ? colors.textTertiary : colors.textPrimary,
              fontSize: '0.75rem',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span
            style={{
              fontSize: '0.75rem',
              color: colors.textSecondary,
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => fetchMovements(page + 1)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: `1px solid ${colors.borderPrimary}`,
              backgroundColor: colors.bgSecondary,
              color:
                page >= totalPages - 1
                  ? colors.textTertiary
                  : colors.textPrimary,
              fontSize: '0.75rem',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
