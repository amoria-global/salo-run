"use client";

import React from 'react';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'muted' | 'brand' | 'accent';

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const toneClass: Record<Tone, string> = {
  success: 'ck-status-success', warning: 'ck-status-warning',
  error: 'ck-status-error', info: 'ck-status-info',
  muted: 'ck-status-muted', brand: '', accent: '',
};

const toneInline: Record<Tone, React.CSSProperties> = {
  success: {}, warning: {}, error: {}, info: {}, muted: {},
  brand: { background: 'rgba(8, 58, 133, 0.10)', color: '#083A85' },
  accent: { background: 'rgba(242, 12, 143, 0.10)', color: '#F20C8F' },
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'muted', icon, children, className, style }) => (
  <span className={`ck-pill ${toneClass[tone]} ${className ?? ''}`} style={{ ...toneInline[tone], ...style }}>
    {icon}
    {children}
  </span>
);

export default Badge;
