'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import type { MoneyItem } from '@/lib/moneyView';
import { COLOR_MAP } from '@/lib/moneyView';

interface ActivityRowProps {
  item: MoneyItem;
  onClick?: (item: MoneyItem) => void;
}

/** Single row in the activity feed. Fully presentational. data comes from moneyView.ts. */
export default function ActivityRow({ item, onClick }: ActivityRowProps) {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();

  const palette = COLOR_MAP[item.color];
  const isDark = actualTheme === 'dark';

  const sign = item.direction === 'in' ? '+' : '-';
  const amountColor = item.direction === 'in' ? '#059669' : colors.textPrimary;

  const formattedTime = formatRelativeTime(item.timestamp);

  return (
    <div
      onClick={onClick ? () => onClick(item) : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = colors.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Direction icon */}
      <div
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '50%',
          backgroundColor: isDark ? `${palette.text}22` : palette.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

      {/* Title + subtitle + tag */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: colors.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 500,
              padding: '0.125rem 0.375rem',
              borderRadius: '9999px',
              backgroundColor: isDark ? `${palette.text}22` : palette.bg,
              color: palette.text,
              whiteSpace: 'nowrap',
            }}
          >
            {item.tag}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginTop: '0.125rem',
          }}
        >
          {item.subtitle && (
            <span
              style={{
                fontSize: '0.75rem',
                color: colors.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.subtitle}
            </span>
          )}
          {item.subtitle && (
            <span style={{ fontSize: '0.75rem', color: colors.textTertiary }}>
              &middot;
            </span>
          )}
          <span
            style={{
              fontSize: '0.75rem',
              color: colors.textTertiary,
              whiteSpace: 'nowrap',
            }}
          >
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Amount */}
      <span
        style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: amountColor,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {sign}{formatPrice(item.amount)}
      </span>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (isNaN(then)) return '';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  // Older than a week. show date
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
