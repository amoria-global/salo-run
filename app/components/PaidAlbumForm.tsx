'use client';

import React from 'react';

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number;
}

interface PaidAlbumFormProps {
  pricePerImage: string;
  onPriceChange: (price: string) => void;
  currencyId: string;
  onCurrencyChange: (currencyId: string) => void;
  currencies: CurrencyInfo[];
  disabled?: boolean;
  colors?: {
    textPrimary: string;
    textSecondary: string;
    border: string;
    background: string;
  };
}

const PaidAlbumForm: React.FC<PaidAlbumFormProps> = ({
  pricePerImage,
  onPriceChange,
  currencyId,
  onCurrencyChange,
  currencies,
  disabled = false,
  colors = {
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    background: '#ffffff',
  },
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.25rem' }}>
          ℹ️ PAID Album Details
        </div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', lineHeight: 1.4 }}>
          • Photos will be indexed for facial recognition search<br />
          • Platform takes 30% commission on each photo sale<br />
          • Album expires in 60 days with 7-day warning
        </div>
      </div>

      {/* Price Per Image */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="pricePerImage"
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: colors.textPrimary,
            display: 'block',
            marginBottom: '0.35rem',
          }}
        >
          Price Per Image *
        </label>
        <input
          id="pricePerImage"
          type="number"
          min="0"
          step="0.01"
          value={pricePerImage}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="Enter price (e.g., 10.00)"
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            fontSize: '0.85rem',
            border: `1px solid ${colors.border}`,
            borderRadius: '0.4rem',
            background: colors.background,
            color: colors.textPrimary,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
          required
        />
      </div>

      {/* Currency Selection */}
      <div>
        <label
          htmlFor="currency"
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: colors.textPrimary,
            display: 'block',
            marginBottom: '0.35rem',
          }}
        >
          Currency *
        </label>
        <select
          id="currency"
          value={currencyId}
          onChange={(e) => onCurrencyChange(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            fontSize: '0.85rem',
            border: `1px solid ${colors.border}`,
            borderRadius: '0.4rem',
            background: colors.background,
            color: colors.textPrimary,
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
          required
        >
          <option value="">Select currency</option>
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} ({currency.symbol}) - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Commission Notice */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '0.4rem',
        }}
      >
        <div style={{ fontSize: '0.7rem', color: '#92400e', lineHeight: 1.4 }}>
          <strong>Commission:</strong> You receive 70% of each photo sale. Platform takes 30%.
          {pricePerImage && !isNaN(parseFloat(pricePerImage)) && (
            <>
              <br />
              <strong>Example:</strong> {currencies.find(c => c.code === currencyId)?.symbol || '$'}
              {parseFloat(pricePerImage).toFixed(2)} per photo → You earn{' '}
              {currencies.find(c => c.code === currencyId)?.symbol || '$'}
              {(parseFloat(pricePerImage) * 0.7).toFixed(2)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaidAlbumForm;
