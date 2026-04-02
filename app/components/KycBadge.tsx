"use client";
import React from 'react';

interface KycBadgeProps {
  kycStatus: string;
  size?: 'sm' | 'md';
}

export default function KycBadge({ kycStatus, size = 'sm' }: KycBadgeProps) {
  if (kycStatus !== 'APPROVED') return null;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: '9999px', fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
      fontWeight: '600', backgroundColor: '#ECFDF5', color: '#059669',
      border: '1px solid #A7F3D0',
    }}>
      <svg width={size === 'sm' ? '12' : '14'} height={size === 'sm' ? '12' : '14'} viewBox="0 0 24 24" fill="none">
        <path d="M9 12L11 14L15 10M12 3L14.5 5.5L18 5L17.5 8.5L20 11L17.5 13.5L18 17L14.5 16.5L12 19L9.5 16.5L6 17L6.5 13.5L4 11L6.5 8.5L6 5L9.5 5.5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      KYC Verified
    </span>
  );
}
