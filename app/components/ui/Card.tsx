"use client";

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: number | string;
  accent?: 'blue' | 'pink' | 'gradient' | 'none';
}

export const Card: React.FC<CardProps> = ({
  hover = false, padding = 20, accent = 'none',
  className, style, children, ...rest
}) => {
  const accentBorder =
    accent === 'blue' ? { borderTop: '3px solid var(--ck-blue)' }
    : accent === 'pink' ? { borderTop: '3px solid var(--ck-pink)' }
    : accent === 'gradient' ? { backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, var(--ck-blue), var(--ck-pink))', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', border: '2px solid transparent' }
    : {};

  return (
    <div
      {...rest}
      className={`ck-card ${hover ? 'ck-card-hover' : ''} ${className ?? ''}`}
      style={{ padding: typeof padding === 'number' ? `${padding}px` : padding, ...accentBorder, ...style }}
    >
      {children}
    </div>
  );
};

export default Card;
