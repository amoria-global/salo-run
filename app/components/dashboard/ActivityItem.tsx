"use client";

import React from 'react';

interface ActivityItemProps {
  label: string;
  value: string;
  valueColor?: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ label, value, valueColor }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  }}>
    <span style={{ fontSize: '0.88rem', color: 'var(--ck-text-soft)' }}>{label}</span>
    <span style={{
      fontSize: '0.92rem',
      fontWeight: 700,
      textAlign: 'right',
      color: valueColor || 'var(--ck-text)',
    }}>{value}</span>
  </div>
);
