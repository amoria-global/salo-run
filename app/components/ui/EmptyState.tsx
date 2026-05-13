"use client";

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="ck-empty">
    {icon && <div className="ck-empty-icon">{icon}</div>}
    <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--ck-text)' }}>{title}</h3>
    {description && (
      <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--ck-text-soft)', maxWidth: 380 }}>{description}</p>
    )}
    {action && <div style={{ marginTop: 18 }}>{action}</div>}
  </div>
);

export default EmptyState;
