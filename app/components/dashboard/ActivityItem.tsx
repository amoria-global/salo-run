import React from 'react';

interface ActivityItemProps {
  label: string;
  value: string;
  valueColor?: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  label,
  value,
  valueColor
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '0.375rem',
      paddingBottom: '0.375rem'
    }}>
      <span style={{
        fontSize: '0.9rem',
        lineHeight: '1rem',
        color: '#6B7280'
      }}>{label}</span>
      <span
        style={{
          fontSize: '0.9rem',
          lineHeight: '1rem',
          fontWeight: '600',
          textAlign: 'right',
          color: valueColor || '#111827'
        }}
      >
        {value}
      </span>
    </div>
  );
};
