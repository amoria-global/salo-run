"use client";

import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional bottom-row content, e.g., tab pills or filter row. */
  belowActions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  belowActions,
}) => (
  <header className="ck-page-header">
    <div style={{ minWidth: 0 }}>
      {eyebrow && (
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--ck-pink)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}>{eyebrow}</div>
      )}
      <h1 className="ck-page-title">{title}</h1>
      {subtitle && <p className="ck-page-subtitle">{subtitle}</p>}
      {belowActions && <div style={{ marginTop: 14 }}>{belowActions}</div>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>}
  </header>
);

export default PageHeader;
