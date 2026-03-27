"use client";

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface PaymentItemProps {
  name: string;
  type: string;
  amount: string;
  avatar?: string;
  logo?: string;
}

export const PaymentItem: React.FC<PaymentItemProps> = ({
  name,
  type,
  amount,
  avatar,
  logo
}) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        transition: 'background-color 0.3s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem'
      }}>
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '9999px',
              objectFit: 'cover'
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '9999px',
            backgroundColor: colors.bgTertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: colors.textSecondary,
            flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem'
        }}>
          <span style={{
            fontSize: '1rem',
            lineHeight: '1.25rem',
            fontWeight: '700',
            color: colors.textPrimary
          }}>{name}</span>
          <span style={{
            fontSize: '0.85rem',
            lineHeight: '1rem',
            color: colors.textSecondary
          }}>{type}</span>
        </div>
      </div>
      <span style={{
        fontSize: '1rem',
        lineHeight: '1.25rem',
        fontWeight: '700',
        color: colors.textPrimary
      }}>{amount}</span>
    </div>
  );
};
