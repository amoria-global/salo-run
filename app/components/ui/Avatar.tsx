"use client";

import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const initial = (n?: string) => {
  if (!n) return '?';
  return n.trim().charAt(0).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 36, className, style }) => (
  <span
    className={`ck-avatar ${className ?? ''}`}
    style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4), ...style }}
  >
    {src ? <img src={src} alt={name ?? 'avatar'} /> : initial(name)}
  </span>
);

export default Avatar;
