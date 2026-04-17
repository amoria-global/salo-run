'use client';

import React, { useState, useRef, useEffect } from 'react';

// Mobile Money (Rwanda) rejects collections below 100 RWF. The minimum only
// applies when the album is priced in RWF — other currencies pass through
// different rails and do not share this constraint.
export const MIN_PAID_ALBUM_PRICE_RWF = 100;

export const isPaidAlbumPriceInvalid = (price: string, currencyCode: string): boolean => {
  if (currencyCode !== 'RWF') return false;
  const n = parseFloat(price);
  if (isNaN(n)) return false;
  return n < MIN_PAID_ALBUM_PRICE_RWF;
};

const CURRENCY_FLAG_MAP: Record<string, string> = {
  USD: 'us', RWF: 'rw', EUR: 'eu', KES: 'ke', UGX: 'ug', TZS: 'tz', GBP: 'gb',
  NGN: 'ng', ZAR: 'za', GHS: 'gh', XAF: 'cm', XOF: 'sn', ETB: 'et', MAD: 'ma',
  EGP: 'eg', BIF: 'bi', CDF: 'cd', MWK: 'mw', ZMW: 'zm', BWP: 'bw', MZN: 'mz',
};

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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCurrency = currencies.find(c => c.code === currencyId || (c.id || c.code) === currencyId);
  const selectedCode = selectedCurrency?.code || '';
  const selectedFlag = CURRENCY_FLAG_MAP[selectedCode] || '';
  const priceInvalid = isPaidAlbumPriceInvalid(pricePerImage, selectedCode);
  const isRwf = selectedCode === 'RWF';

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

      {/* Price Per Image + Currency (side by side) */}
      <div style={{ marginBottom: '1rem' }}>
        <label
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Custom currency dropdown with flag images */}
          <div ref={dropdownRef} style={{ position: 'relative', minWidth: '120px' }}>
            <button
              type="button"
              onClick={() => !disabled && setShowDropdown(!showDropdown)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                width: '100%',
                textAlign: 'left' as const,
                padding: '0.6rem 0.75rem',
                fontSize: '0.85rem',
                border: `1px solid ${colors.border}`,
                borderRadius: '0.4rem',
                background: colors.background,
                color: colors.textPrimary,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              {selectedFlag && (
                <img
                  src={`https://flagcdn.com/w40/${selectedFlag}.png`}
                  alt=""
                  style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px' }}
                />
              )}
              <span style={{ flex: 1, fontSize: '0.85rem' }}>{selectedCode || 'Currency'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                <path d="M6 9L12 15L18 9" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 0.35rem)',
                left: 0,
                backgroundColor: colors.background,
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                border: `2px solid ${colors.border}`,
                padding: '0.4rem',
                minWidth: '200px',
                zIndex: 100,
                maxHeight: '220px',
                overflowY: 'auto',
              }}>
                {(currencies.length > 0 ? currencies : [
                  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '', rate: 1 },
                  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', flag: '', rate: 1 },
                  { code: 'EUR', name: 'Euro', symbol: '€', flag: '', rate: 1 },
                  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '', rate: 1 },
                  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '', rate: 1 },
                ]).map((c) => {
                  const flag = CURRENCY_FLAG_MAP[c.code] || '';
                  const isSelected = currencyId === c.code || currencyId === (c as CurrencyInfo & { id?: string }).id;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { onCurrencyChange(c.code); setShowDropdown(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {flag && <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />}
                        <span style={{ fontWeight: 600 }}>{c.code}</span>
                        {c.name && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{c.name}</span>}
                      </div>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="#083A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <input
            id="pricePerImage"
            type="number"
            min={isRwf ? MIN_PAID_ALBUM_PRICE_RWF : 0}
            step={isRwf ? 1 : 0.01}
            value={pricePerImage}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder={isRwf ? `Enter price (min ${MIN_PAID_ALBUM_PRICE_RWF})` : 'Enter price'}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              fontSize: '0.85rem',
              border: `1px solid ${priceInvalid ? '#ef4444' : colors.border}`,
              borderRadius: '0.4rem',
              background: colors.background,
              color: colors.textPrimary,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = priceInvalid ? '#ef4444' : '#3b82f6')}
            onBlur={(e) => (e.target.style.borderColor = priceInvalid ? '#ef4444' : colors.border)}
            required
          />
        </div>
        {priceInvalid && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.35rem' }}>
            Minimum price is {MIN_PAID_ALBUM_PRICE_RWF} RWF. Mobile Money collections below {MIN_PAID_ALBUM_PRICE_RWF} RWF are rejected by the payment provider.
          </div>
        )}
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
