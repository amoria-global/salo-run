'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { MoneyItem } from '@/lib/moneyView';
import { COLOR_MAP } from '@/lib/moneyView';

interface ActivityDetailDrawerProps {
  item: MoneyItem | null;
  onClose: () => void;
}

/**
 * Slide-over drawer showing details for a single activity row.
 * Pass `item={null}` to hide it.
 */
export default function ActivityDetailDrawer({
  item,
  onClose,
}: ActivityDetailDrawerProps) {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const isDark = actualTheme === 'dark';

  if (!item) return null;

  const palette = COLOR_MAP[item.color];

  const rows: { label: string; value: string }[] = [
    { label: 'Amount', value: `${item.direction === 'in' ? '+' : '-'}${formatPrice(item.amount)}` },
  ];

  if (item.originalAmount && item.originalCurrency) {
    rows.push({
      label: 'Original amount',
      value: `${item.originalCurrency} ${item.originalAmount.toLocaleString()}`,
    });
  }

  rows.push({ label: 'Category', value: item.tag });
  rows.push({
    label: 'Date',
    value: new Date(item.timestamp).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  });

  if (item.sourceType) {
    rows.push({
      label: 'Source',
      value: item.sourceType.replace(/_/g, ' ').toLowerCase(),
    });
  }

  if (item.subtitle) {
    rows.push({ label: 'Details', value: item.subtitle });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: colors.bgOverlay,
          zIndex: 998,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '24rem',
          backgroundColor: colors.bgSecondary,
          boxShadow: colors.shadowXl,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease-out',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to   { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: `1px solid ${colors.borderPrimary}`,
          }}
        >
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            Transaction details
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: colors.textSecondary,
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Hero */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.5rem 1rem',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: isDark ? `${palette.text}22` : palette.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              {item.direction === 'in' ? (
                <path
                  d="M8 3v10m0 0l-4-4m4 4l4-4"
                  stroke={palette.text}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M8 13V3m0 0L4 7m4-4l4 4"
                  stroke={palette.text}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>

          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {item.title}
          </span>

          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: item.direction === 'in' ? '#059669' : colors.textPrimary,
            }}
          >
            {item.direction === 'in' ? '+' : '-'}{formatPrice(item.amount)}
          </span>

          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: isDark ? `${palette.text}22` : palette.bg,
              color: palette.text,
            }}
          >
            {item.tag}
          </span>
        </div>

        {/* Detail rows */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 1.25rem 1.25rem',
          }}
        >
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.625rem 0',
                borderBottom: `1px solid ${colors.borderPrimary}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: colors.textSecondary,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: colors.textPrimary,
                  textAlign: 'right',
                  maxWidth: '60%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
