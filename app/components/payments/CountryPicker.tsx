'use client';

import React, { useMemo, useState } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/payments/supportedCountries';

interface CountryPickerProps {
  value: string | null;
  onChange: (iso2: string) => void;
  title?: string;
  hint?: string;
}

/**
 * Inline searchable country grid. Used as fallback when IP-detect
 * returns a country with no PawaPay coverage, and as "change country"
 * inside PaymentMethodPicker. Renders inline (not a modal) so it
 * composes inside existing payment surfaces.
 */
export const CountryPicker: React.FC<CountryPickerProps> = ({ value, onChange, title, hint }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORTED_COUNTRIES;
    return SUPPORTED_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.iso2.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  }, [query]);

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#083A85', margin: '0 0 6px 0' }}>
          {title}
        </h4>
      )}
      {hint && (
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' }}>{hint}</p>
      )}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search country…"
        style={{
          width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
          borderRadius: '10px', fontSize: '14px', marginBottom: '10px', outline: 'none',
        }}
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '8px',
        maxHeight: '260px',
        overflowY: 'auto',
      }}>
        {filtered.map(c => {
          const selected = value?.toUpperCase() === c.iso2;
          return (
            <button
              key={c.iso2}
              type="button"
              onClick={() => onChange(c.iso2)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px',
                background: selected ? '#EFF6FF' : '#fff',
                border: `1px solid ${selected ? '#1f6bff' : '#e5e7eb'}`,
                borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                fontSize: '13px', fontWeight: 600,
                color: selected ? '#083A85' : '#374151',
              }}
            >
              <span style={{ fontSize: '18px' }}>{c.flag}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>{c.dialCode}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
            No matching countries
          </p>
        )}
      </div>
    </div>
  );
};
