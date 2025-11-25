import React from 'react';

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
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '0.875rem',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
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
          color: '#6B7280'
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
        color: '#000000'
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
            color: trend === 'up' ? '#059669' : '#DC2626'
          }}>
            {trend === 'up' ? '+' : ''}{percentage}
          </span>
          <span style={{
            fontSize: '0.85rem',
            lineHeight: '1rem',
            color: '#9CA3AF'
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
            color: '#0267FF'
          }} className="bi bi-box-arrow-up-right"></i>
        </a>
      </div>
    </div>
  );
};
