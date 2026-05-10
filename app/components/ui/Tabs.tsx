"use client";

import React from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, active, onChange }) => (
  <div className="ck-tabs" role="tablist">
    {items.map((it) => (
      <button
        key={it.key}
        role="tab"
        aria-selected={active === it.key}
        className={`ck-tab ${active === it.key ? 'active' : ''}`}
        onClick={() => onChange(it.key)}
      >
        {it.icon && <span style={{ marginRight: 6 }}>{it.icon}</span>}
        {it.label}
        {typeof it.count === 'number' && (
          <span style={{
            marginLeft: 8,
            padding: '1px 7px',
            fontSize: '0.72rem',
            fontWeight: 600,
            borderRadius: 9999,
            background: active === it.key ? 'rgba(8,58,133,0.10)' : 'rgba(0,0,0,0.05)',
            color: active === it.key ? 'var(--ck-blue)' : 'var(--ck-text-soft)',
          }}>{it.count}</span>
        )}
      </button>
    ))}
  </div>
);

export default Tabs;
