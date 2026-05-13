"use client";

import React from 'react';

interface PaymentItemProps {
  name: string;
  type: string;
  amount: string;
  avatar?: string;
  logo?: string;
}

export const PaymentItem: React.FC<PaymentItemProps> = ({ name, type, amount, avatar }) => (
  <div className="ck-row" style={{ justifyContent: 'space-between', padding: '10px 12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      {avatar ? (
        <img src={avatar} alt={name}
          style={{ width: 36, height: 36, borderRadius: 9999, objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <span className="ck-avatar" style={{ width: 36, height: 36 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '0.92rem', fontWeight: 600, color: 'var(--ck-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ck-text-soft)', marginTop: 1 }}>{type}</div>
      </div>
    </div>
    <span style={{
      fontSize: '0.95rem', fontWeight: 700, color: 'var(--ck-text)',
      flexShrink: 0, marginLeft: 8,
    }}>{amount}</span>
  </div>
);
