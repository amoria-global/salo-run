import React from 'react';

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
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem'
      }}>
        {avatar && (
          <img
            src={avatar}
            alt={name}
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '9999px',
              objectFit: 'cover'
            }}
          />
        )}
        {logo && (
          <img
            src={logo}
            alt={name}
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '9999px',
              objectFit: 'cover',
              padding: '0.375rem',
              backgroundColor: '#F3F4F6'
            }}
          />
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
            color: '#111827'
          }}>{name}</span>
          <span style={{
            fontSize: '0.85rem',
            lineHeight: '1rem',
            color: '#6B7280'
          }}>{type}</span>
        </div>
      </div>
      <span style={{
        fontSize: '1rem',
        lineHeight: '1.25rem',
        fontWeight: '700',
        color: '#111827'
      }}>{amount}</span>
    </div>
  );
};
