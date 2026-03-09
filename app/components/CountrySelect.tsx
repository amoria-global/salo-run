"use client";

import React, { useState, useRef, useEffect } from 'react';

export interface CountryOption {
  name: string;
  code: string;       // dial code like "+250"
  iso: string;        // ISO 3166-1 alpha-2 lowercase for flagcdn, e.g. "rw"
}

// East African countries used in profile pages
export const eastAfricanCountries: CountryOption[] = [
  { name: 'Rwanda', code: '+250', iso: 'rw' },
  { name: 'Kenya', code: '+254', iso: 'ke' },
  { name: 'Uganda', code: '+256', iso: 'ug' },
  { name: 'Tanzania', code: '+255', iso: 'tz' },
  { name: 'Burundi', code: '+257', iso: 'bi' },
  { name: 'South Sudan', code: '+211', iso: 'ss' },
];

interface CountrySelectProps {
  countries: CountryOption[];
  value: string;
  onChange: (value: string) => void;
  /** 'code' for dial codes, 'name' for country names */
  valueKey: 'code' | 'name';
  /** What to show in closed state: 'code' = flag+dialCode, 'name' = flag+name */
  displayKey?: 'code' | 'name';
  disabled?: boolean;
  inputStyle?: React.CSSProperties;
  colors: {
    bgSecondary: string;
    bgTertiary: string;
    borderPrimary: string;
    textPrimary: string;
    textSecondary: string;
    shadowLg?: string;
  };
  actualTheme?: 'dark' | 'light';
  width?: string;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  countries,
  value,
  onChange,
  valueKey,
  displayKey,
  disabled = false,
  inputStyle = {},
  colors,
  actualTheme = 'light',
  width,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const display = displayKey || valueKey;

  const selected = countries.find(c => c[valueKey] === value) || countries[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: 'relative', width: width || '100%' }}>
      <button
        type="button"
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        style={{
          ...inputStyle,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          textAlign: 'left',
          background: inputStyle.backgroundColor || inputStyle.background as string || colors.bgSecondary,
        }}
      >
        <img
          src={`https://flagcdn.com/w40/${selected.iso}.png`}
          alt={selected.name}
          style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
        />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {display === 'code' ? selected.code : selected.name}
        </span>
        <i
          style={{
            fontSize: '0.6rem',
            color: colors.textSecondary,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
          className="bi bi-chevron-down"
        />
      </button>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: colors.bgSecondary,
          borderRadius: '0.75rem',
          boxShadow: colors.shadowLg || '0 10px 25px rgba(0,0,0,0.15)',
          border: `2px solid ${colors.borderPrimary}`,
          padding: '0.35rem',
          zIndex: 50,
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {countries.map((c) => (
            <button
              type="button"
              key={c.iso}
              onClick={() => { onChange(c[valueKey]); setIsOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0.45rem 0.6rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: value === c[valueKey]
                  ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                  : 'transparent',
                color: colors.textPrimary,
                fontSize: '0.85rem',
                fontWeight: value === c[valueKey] ? '600' : '400',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                if (value !== c[valueKey]) e.currentTarget.style.backgroundColor = colors.bgTertiary;
              }}
              onMouseLeave={(e) => {
                if (value !== c[valueKey]) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <img
                src={`https://flagcdn.com/w40/${c.iso}.png`}
                alt={c.name}
                style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
              />
              {display === 'code' ? (
                <>
                  <span style={{ fontWeight: '600' }}>{c.code}</span>
                  <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{c.name}</span>
                </>
              ) : (
                <>
                  <span>{c.name}</span>
                  <span style={{ fontSize: '0.8rem', color: colors.textSecondary, marginLeft: 'auto' }}>{c.code}</span>
                </>
              )}
              {value === c[valueKey] && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: display === 'code' ? 'auto' : undefined, flexShrink: 0 }}>
                  <path d="M20 6L9 17L4 12" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
