"use client";

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors } = useTheme();

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
        color: colors.textSecondary
      }}>{label}</span>
      <span
        style={{
          fontSize: '0.9rem',
          lineHeight: '1rem',
          fontWeight: '600',
          textAlign: 'right',
          color: valueColor || colors.textPrimary
        }}
      >
        {value}
      </span>
    </div>
  );
};
