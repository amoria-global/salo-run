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
  // Comparison mode props
  isComparisonMode?: boolean;
  targetValue?: string;
}

// Helper to parse numeric value from string like "$2,600" or "3.9/5"
const parseNumericValue = (value: string): number => {
  const cleaned = value.replace(/[$,]/g, '');
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

// Calculate progress percentage
const calculateProgress = (current: string, target: string): number => {
  const currentNum = parseNumericValue(current);
  const targetNum = parseNumericValue(target);
  if (targetNum === 0) return 0;
  return Math.min((currentNum / targetNum) * 100, 100);
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  percentage,
  timeframe,
  icon,
  trend = 'up',
  href,
  isComparisonMode = false,
  targetValue
}) => {
  const { colors } = useTheme();

  const progress = isComparisonMode && targetValue ? calculateProgress(value, targetValue) : 0;
  const isGoalMet = progress >= 100;

  return (
    <div style={{
      backgroundColor: colors.bgCard,
      borderRadius: '0.5rem',
      padding: '0.875rem',
      boxShadow: colors.shadowSm,
      height: '100%',
      border: isComparisonMode ? `2px solid ${isGoalMet ? colors.statusSuccess : colors.brandAccent}` : 'none',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Progress bar background for comparison mode */}
      {isComparisonMode && targetValue && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: colors.borderPrimary
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: isGoalMet ? colors.statusSuccess : '#F20C8F',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
      )}

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

      {/* Current Value */}
      <div style={{
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontWeight: '700',
        marginBottom: isComparisonMode && targetValue ? '0.25rem' : '0.375rem',
        color: colors.textPrimary
      }}>{value}</div>

      {/* Target Value (Comparison Mode) */}
      {isComparisonMode && targetValue && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.375rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: colors.textTertiary
          }}>Target:</span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#F20C8F'
          }}>{targetValue}</span>
          <span style={{
            fontSize: '0.7rem',
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            backgroundColor: isGoalMet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(242, 12, 143, 0.1)',
            color: isGoalMet ? colors.statusSuccess : '#F20C8F',
            fontWeight: '600'
          }}>
            {progress.toFixed(0)}%
          </span>
        </div>
      )}

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
