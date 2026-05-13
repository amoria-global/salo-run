"use client";

import React from 'react';

interface HeaderStatProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export const HeaderStat: React.FC<HeaderStatProps> = ({ label, value, icon }) => (
  <div style={{
    background: 'var(--ck-surface)',
    border: '1px solid var(--ck-stroke)',
    borderRadius: 12,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: 'var(--ck-shadow-sm)',
  }}>
    {icon && (
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'linear-gradient(135deg, rgba(8,58,133,0.08), rgba(242,12,143,0.06))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: 'var(--ck-blue)',
      }}>{icon}</div>
    )}
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ck-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ck-text)', lineHeight: 1.1, marginTop: 2 }}>{value}</div>
    </div>
  </div>
);
