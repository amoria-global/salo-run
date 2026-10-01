'use client';

import React, { useState } from 'react';
import { usePaymentOptions } from '@/lib/payments/usePaymentOptions';
import { findCountry } from '@/lib/payments/supportedCountries';
import { iconForOperator, CARD_ICON } from '@/lib/payments/operatorIcons';
import { CountryPicker } from './CountryPicker';
import { PaymentMethodChooser } from './PaymentMethodChooser';
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

      <PaymentMethodChooser
        tone="light"
        accent="#083A85"
        disabled={disabled}
        selectedId={selectedMethodId}
        methods={[
          ...options.operators.map(op => ({ id: op.id.toLowerCase(), name: op.name, image: iconForOperator(op.iconKey) })),
          ...(allowCard && options.supportsCard ? [{ id: 'card', name: 'VISA & Master Card', image: CARD_ICON }] : []),
        ]}
        onSelect={id => {
          if (id === 'card') { onSelect({ methodId: 'card', type: 'CARD', operator: null }); return; }
          const op = options.operators.find(o => o.id.toLowerCase() === id);
          if (op) onSelect({ methodId: id, type: 'MOBILE_MONEY', operator: op });
        }}
      />
    </div>
  );
};
