'use client';

import React, { useState } from 'react';
import { usePaymentOptions } from '@/lib/payments/usePaymentOptions';
import { findCountry } from '@/lib/payments/supportedCountries';
import { CountryPicker } from './CountryPicker';
import type { PaymentOperator } from '@/lib/payments/types';

export interface PaymentMethodSelection {
  methodId: string;             // "card" or lowercased operator id
  type: 'MOBILE_MONEY' | 'CARD';
  operator: PaymentOperator | null;
}

interface Props {
  country: string | null;
  onCountryChange: (iso2: string) => void;
  selectedMethodId: string | null;
  onSelect: (selection: PaymentMethodSelection) => void;
  allowCard?: boolean;
  disabled?: boolean;
}

/**
 * Dynamic payment-method grid for salo-run. Same contract as
 * knockout's copy. Shows operators from usePaymentOptions(country),
 * with a "Card" tile if the country supports it. Falls back to
 * CountryPicker inline when the country has no PawaPay coverage.
 */
export const PaymentMethodPicker: React.FC<Props> = ({
  country, onCountryChange, selectedMethodId, onSelect, allowCard = true, disabled = false,
}) => {
  const { options, loading, supported, error } = usePaymentOptions(country);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const countryMeta = findCountry(country);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Loading payment options…</div>;
  }

  if (!country || !supported || !options || showCountryPicker) {
    return (
      <CountryPicker
        value={country}
        onChange={iso2 => { onCountryChange(iso2); setShowCountryPicker(false); }}
        title={!supported && country ? 'Mobile money not yet available here' : 'Choose your country'}
        hint={!supported && country
          ? `We don't have mobile-money operators for ${country} yet. Pick another country, or use a card.`
          : "We'll show the right operators for your country."}
      />
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '999px', fontSize: '12px', color: '#083A85', fontWeight: 700,
        }}>
          {countryMeta?.flag && <span style={{ fontSize: '13px' }}>{countryMeta.flag}</span>}
          <span>{countryMeta?.name ?? country} · {options.currency}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCountryPicker(true)}
          style={{ background: 'transparent', border: 'none', color: '#1f6bff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
        >
          Change country
        </button>
      </div>

      {error && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>{error}</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        {options.operators.map(op => {
          const selected = selectedMethodId === op.id.toLowerCase();
          return (
            <button
              key={op.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect({ methodId: op.id.toLowerCase(), type: 'MOBILE_MONEY', operator: op })}
              style={{
                padding: '14px 12px',
                background: selected ? '#EFF6FF' : '#fff',
                border: `1.5px solid ${selected ? '#1f6bff' : '#e5e7eb'}`,
                borderRadius: '12px', cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1, textAlign: 'center',
                fontSize: '13px', fontWeight: 600,
                color: selected ? '#083A85' : '#374151',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📱</div>
              {op.name}
            </button>
          );
        })}

        {allowCard && options.supportsCard && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect({ methodId: 'card', type: 'CARD', operator: null })}
            style={{
              padding: '14px 12px',
              background: selectedMethodId === 'card' ? '#EFF6FF' : '#fff',
              border: `1.5px solid ${selectedMethodId === 'card' ? '#1f6bff' : '#e5e7eb'}`,
              borderRadius: '12px', cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1, textAlign: 'center',
              fontSize: '13px', fontWeight: 600,
              color: selectedMethodId === 'card' ? '#083A85' : '#374151',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>💳</div>
            Visa / Mastercard
          </button>
        )}
      </div>
    </div>
  );
};
