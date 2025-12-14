"use client";

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string;
  percentage: string;
  timeframe: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  href?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  percentage,
  timeframe,
  icon,
  trend = 'up',
  href
}) => {
  const { colors } = useTheme();

  return (
    <div style={{
      backgroundColor: colors.bgCard,
      borderRadius: '0.5rem',
      padding: '0.875rem',
      boxShadow: colors.shadowSm,
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        minHeight: '2.25rem'
      }}>
        <span style={{
          fontSize: '0.9rem',
          lineHeight: '1rem',
          color: colors.textSecondary
        }}>{title}</span>
        <div style={{
          width: '2.25rem',
          height: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          lineHeight: '1.75rem',
          flexShrink: 0
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontWeight: '700',
        marginBottom: '0.375rem',
        color: colors.textPrimary
      }}>{value}</div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <span style={{
            fontSize: '0.85rem',
            lineHeight: '1rem',
            fontWeight: '600',
            color: trend === 'up' ? colors.statusSuccess : colors.statusError
          }}>
            {trend === 'up' ? '+' : ''}{percentage}
          </span>
          <span style={{
            fontSize: '0.85rem',
            lineHeight: '1rem',
            color: colors.textTertiary
          }}>{timeframe}</span>
        </div>
        <a
          href={href || '#'}
          style={{
            padding: '0.25rem',
            cursor: 'pointer',
            transition: 'opacity 0.3s',
            textDecoration: 'none'
          }}
          title="View details"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <i style={{
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            color: colors.textLink
          }} className="bi bi-box-arrow-up-right"></i>
        </a>
      </div>
    </div>
  );
};
