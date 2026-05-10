"use client";

import React from 'react';

type Variant = 'primary' | 'accent' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '7px 12px', fontSize: '0.82rem', borderRadius: 8 },
  md: { padding: '10px 18px', fontSize: '0.9rem', borderRadius: 10 },
  lg: { padding: '13px 22px', fontSize: '1rem', borderRadius: 12 },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  iconLeft,
  iconRight,
  fullWidth,
  disabled,
  className,
  children,
  style,
  ...rest
}) => {
  const variantClass =
    variant === 'primary' ? 'ck-btn-primary'
    : variant === 'accent' ? 'ck-btn-accent'
    : variant === 'ghost' ? 'ck-btn-ghost'
    : variant === 'soft' ? 'ck-btn-soft'
    : 'ck-btn-primary';

  const dangerStyle: React.CSSProperties = variant === 'danger'
    ? { background: '#DC2626', color: '#fff', border: 'none' }
    : {};

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`ck-btn ${variantClass} ${className ?? ''}`}
      style={{
        ...sizeStyles[size],
        ...(fullWidth ? { width: '100%' } : {}),
        ...dangerStyle,
        ...style,
      }}
    >
      {loading ? <span className="ck-spinner" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
};

export default Button;
