"use client";

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  percentage?: string;
  timeframe?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  href?: string;
  accentColor?: string;
  isComparisonMode?: boolean;
  targetValue?: string;
}

const parseNumericValue = (value: string): number => {
  const cleaned = value.replace(/[$,]/g, '');
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

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
  accentColor,
  isComparisonMode = false,
  targetValue,
}) => {
  const progress = isComparisonMode && targetValue ? calculateProgress(value, targetValue) : 0;
  const isGoalMet = progress >= 100;

  return (
    <div className="ck-card ck-card-hover" style={{
      padding: 18,
      position: 'relative',
      overflow: 'hidden',
      ...(accentColor ? { borderTop: `3px solid ${accentColor}` } : {}),
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: 'var(--ck-text-soft)',
          letterSpacing: '0.01em',
        }}>{title}</span>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(8,58,133,0.08) 0%, rgba(242,12,143,0.06) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}>{icon}</div>
      </div>

      <div style={{
        fontSize: '1.6rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: 'var(--ck-text)',
        lineHeight: 1.15,
        marginBottom: isComparisonMode && targetValue ? 6 : 8,
      }}>{value}</div>

      {isComparisonMode && targetValue && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ck-text-muted)' }}>Target:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F20C8F' }}>{targetValue}</span>
            <span className="ck-pill" style={{
              background: isGoalMet ? 'rgba(16,185,129,0.10)' : 'rgba(242,12,143,0.10)',
              color: isGoalMet ? '#065F46' : '#F20C8F',
            }}>{progress.toFixed(0)}%</span>
          </div>
          <div style={{
            height: 4,
            background: 'var(--ck-stroke)',
            borderRadius: 9999,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: isGoalMet ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #F20C8F, #FF3DA0)',
              transition: 'width 480ms var(--ck-ease)',
            }} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 }}>
        {percentage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.78rem', fontWeight: 700,
              color: trend === 'up' ? '#065F46' : '#991B1B',
              padding: '2px 7px',
              borderRadius: 9999,
              background: trend === 'up' ? '#ECFDF5' : '#FEF2F2',
            }}>
              <i className={`bi ${trend === 'up' ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`} style={{ fontSize: 10 }} />
              {trend === 'up' ? '+' : ''}{percentage}
            </span>
            {timeframe && <span style={{ fontSize: '0.75rem', color: 'var(--ck-text-muted)' }}>{timeframe}</span>}
          </div>
        ) : <div />}
        {href && (
          <a
            href={href}
            title="View details"
            style={{
              width: 28, height: 28, borderRadius: 9999,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--ck-surface-muted)',
              color: 'var(--ck-blue)',
              transition: 'background 180ms',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(8,58,133,0.10)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ck-surface-muted)'; }}
          >
            <i className="bi bi-arrow-up-right" style={{ fontSize: 12 }} />
          </a>
        )}
      </div>
    </div>
  );
};
