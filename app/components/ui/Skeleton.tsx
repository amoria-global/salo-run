"use client";

import React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%', height = 16, rounded = 8, className, style,
}) => (
  <div
    className={`ck-skeleton ${className ?? ''}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: typeof rounded === 'number' ? `${rounded}px` : rounded,
      ...style,
    }}
  />
);

export default Skeleton;
