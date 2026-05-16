'use client';

import React from 'react';

interface FreeAlbumFormProps {
  recipientEmail: string;
  onEmailChange: (email: string) => void;
  maxFreeDownloads?: string;
  onMaxFreeDownloadsChange?: (v: string) => void;
  pricePerExtraImage?: string;
  onPricePerExtraImageChange?: (v: string) => void;
  disabled?: boolean;
  colors?: {
    textPrimary: string;
    textSecondary: string;
    border: string;
    background: string;
  };
}

const FreeAlbumForm: React.FC<FreeAlbumFormProps> = ({
  recipientEmail,
  onEmailChange,
  maxFreeDownloads = '',
  onMaxFreeDownloadsChange,
  pricePerExtraImage = '',
  onPricePerExtraImageChange,
  disabled = false,
  colors = {
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    background: '#ffffff',
  },
}) => {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValid = recipientEmail ? validateEmail(recipientEmail) : true;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: '0.25rem' }}>
          ℹ️ FREE Album Details
        </div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', lineHeight: 1.4 }}>
          • Photos are NOT searchable via facial recognition<br />
          • Recipient gets email with access code<br />
          • Free downloads (or set a cap + price for extras below)<br />
          • Album expires in 60 days with 7-day warning
        </div>
      </div>

      {/* Recipient Email */}
      <div>
        <label
          htmlFor="recipientEmail"
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: colors.textPrimary,
            display: 'block',
            marginBottom: '0.35rem',
          }}
        >
          Recipient Email Address *
        </label>
        <input
          id="recipientEmail"
          type="email"
          value={recipientEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="recipient@example.com"
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            fontSize: '0.85rem',
            border: `1px solid ${!isValid && recipientEmail ? '#ef4444' : colors.border}`,
            borderRadius: '0.4rem',
            background: colors.background,
            color: colors.textPrimary,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = !isValid && recipientEmail ? '#ef4444' : '#10b981')}
          onBlur={(e) => (e.target.style.borderColor = !isValid && recipientEmail ? '#ef4444' : colors.border)}
          required
        />
        {!isValid && recipientEmail && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>
            Please enter a valid email address
          </div>
        )}
        <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.35rem' }}>
          An invitation email with access code will be sent to this address automatically
        </div>
      </div>

      {/* Optional: download cap + price per extra image */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="freeMaxDownloads" style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>
            Max free downloads
          </label>
          <input
            id="freeMaxDownloads"
            type="number"
            min={0}
            step={1}
            value={maxFreeDownloads}
            onChange={(e) => onMaxFreeDownloadsChange && onMaxFreeDownloadsChange(e.target.value)}
            placeholder="Blank = all free"
            disabled={disabled}
            style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.85rem', border: `1px solid ${colors.border}`, borderRadius: '0.4rem', background: colors.background, color: colors.textPrimary, outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="freeExtraPrice" style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>
            Price per extra image
          </label>
          <input
            id="freeExtraPrice"
            type="number"
            min={0}
            step="0.01"
            value={pricePerExtraImage}
            onChange={(e) => onPricePerExtraImageChange && onPricePerExtraImageChange(e.target.value)}
            placeholder="Blank = no extras"
            disabled={disabled}
            style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.85rem', border: `1px solid ${colors.border}`, borderRadius: '0.4rem', background: colors.background, color: colors.textPrimary, outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.35rem' }}>
        Leave both blank for a fully free album. Set a cap and the recipient gets that many
        free; selecting more charges the price per extra image (paid like a paid album).
      </div>

      {/* Access Code Info */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '0.4rem',
        }}
      >
        <div style={{ fontSize: '0.7rem', color: '#1e40af', lineHeight: 1.4 }}>
          <strong>✓ Access Code:</strong> A 6-digit code will be generated automatically<br />
          <strong>✓ Email Verification:</strong> Recipient must verify with OTP sent to their email<br />
          <strong>✓ Reusable:</strong> Recipient can return anytime within 60 days
        </div>
      </div>
    </div>
  );
};

export default FreeAlbumForm;
