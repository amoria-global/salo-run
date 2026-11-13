'use client';

import { cachedPaymentLimit, priceError } from '@/lib/paymentLimits';
import MoneyInput from './MoneyInput';
import React from 'react';

// The minimum price is per currency and comes from the backend (GET /payments/limits), the same figure the server
// enforces. Until it has loaded only a malformed amount is refused and the server judges the rest.
export const paidAlbumPriceError = (price: string, currencyCode: string): string | null =>
  priceError(price, cachedPaymentLimit(currencyCode));

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number;
  id?: string;
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
  const selectedCurrency = currencies.find(c => c.code === currencyId || (c.id || c.code) === currencyId);
  const selectedCode = selectedCurrency?.code || '';

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
          PAID Album Details
        </div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', lineHeight: 1.4 }}>
          • Photos will be indexed for facial recognition search<br />
          • Platform takes 30% commission on each photo sale<br />
          • Album expires in 60 days with 7-day warning
        </div>
      </div>

      {/* Price and currency in one field */}
      <MoneyInput
        label="Price Per Image"
        required
        id="pricePerImage"
        value={pricePerImage}
        onChange={onPriceChange}
        currencyId={selectedCurrency ? (selectedCurrency.code) : ''}
        onCurrencyChange={onCurrencyChange}
        currencies={currencies.map((c) => ({ value: c.code, code: c.code, name: c.name }))}
        placeholder="Enter price per photo"
        disabled={disabled}
      />

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
              <strong>Example:</strong> {selectedCurrency?.symbol || '$'}
              {parseFloat(pricePerImage).toFixed(2)} per photo → You earn{' '}
              {selectedCurrency?.symbol || '$'}
              {(parseFloat(pricePerImage) * 0.7).toFixed(2)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaidAlbumForm;
