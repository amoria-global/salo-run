'use client';

import React from 'react';
import { useTheme } from '../context/ThemeContext';

export type AlbumType = 'PAID' | 'FREE';

interface AlbumTypeSelectorProps {
  selectedType: AlbumType;
  onChange: (type: AlbumType) => void;
  disabled?: boolean;
}

interface OptionConfig {
  value: AlbumType;
  title: string;
  eyebrow: string;
  icon: string;
  features: { icon: string; text: string }[];
  accent: string;
  accentDark: string;
  gradient: string;
  shadowColor: string;
  tintLight: string;
  tintDark: string;
  borderTintLight: string;
  borderTintDark: string;
}

const OPTIONS: OptionConfig[] = [
  {
    value: 'PAID',
    title: 'PAID Album',
    eyebrow: 'Monetized',
    icon: 'bi-person-bounding-box',
    features: [
      { icon: 'bi-search', text: 'Publicly searchable via facial recognition' },
      { icon: 'bi-percent', text: '30% platform commission' },
      { icon: 'bi-currency-dollar', text: 'Set price per image' },
    ],
    accent: '#083A85',
    accentDark: '#BFDBFE',
    gradient: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
    shadowColor: 'rgba(8,58,133,0.32)',
    tintLight: 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.04) 100%)',
    tintDark: 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)',
    borderTintLight: 'rgba(8,58,133,0.45)',
    borderTintDark: 'rgba(8,58,133,0.50)',
  },
  {
    value: 'FREE',
    title: 'FREE Album',
    eyebrow: 'Private invite',
    icon: 'bi-envelope-paper-fill',
    features: [
      { icon: 'bi-link-45deg', text: 'Private link with email verification' },
      { icon: 'bi-gift-fill', text: '0% commission (100% free)' },
      { icon: 'bi-person-fill-check', text: 'Single recipient access' },
    ],
    accent: '#059669',
    accentDark: '#6EE7B7',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    shadowColor: 'rgba(16,185,129,0.32)',
    tintLight: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.04) 100%)',
    tintDark: 'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(5,150,105,0.14) 100%)',
    borderTintLight: 'rgba(16,185,129,0.45)',
    borderTintDark: 'rgba(16,185,129,0.50)',
  },
];

const AlbumTypeSelector: React.FC<AlbumTypeSelectorProps> = ({
  selectedType,
  onChange,
  disabled = false,
}) => {
  const { colors, actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.62rem',
        fontWeight: 700,
        color: '#F20C8F',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.55rem',
      }}>
        Album Type <span style={{ color: '#EF4444' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {OPTIONS.map((opt) => {
          const isSelected = selectedType === opt.value;
          const headingColor = isSelected ? (isDark ? opt.accentDark : opt.accent) : colors.textPrimary;
          const selectedBorder = isDark ? opt.borderTintDark : opt.borderTintLight;
          return (
            <button
              key={opt.value}
              type="button"
              // Opts this card out of the app-wide pill rule in globals.css,
              // which would otherwise force border-radius: 9999px on it.
              data-ck-shape="card"
              onClick={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              aria-pressed={isSelected}
              style={{
                flex: '1 1 220px',
                position: 'relative',
                padding: 0,
                border: `1px solid ${isSelected ? selectedBorder : colors.borderPrimary}`,
                borderRadius: 16,
                background: isSelected ? (isDark ? opt.tintDark : opt.tintLight) : colors.bgCard,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
                textAlign: 'left',
                overflow: 'hidden',
                // Inset ring thickens the selected edge without shifting layout.
                boxShadow: isSelected
                  ? `inset 0 0 0 1px ${selectedBorder}, 0 10px 24px -10px ${opt.shadowColor}`
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (disabled || isSelected) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.borderColor = isDark ? opt.borderTintDark : opt.borderTintLight;
                e.currentTarget.style.boxShadow = `0 8px 18px -8px ${opt.shadowColor}`;
              }}
              onMouseLeave={(e) => {
                if (disabled || isSelected) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = colors.borderPrimary;
                e.currentTarget.style.boxShadow = 'none';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${isDark ? opt.accentDark : opt.accent}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {/* Top accent stripe when selected */}
              {isSelected && (
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: opt.gradient,
                }} />
              )}

              <div style={{ padding: '0.95rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Top row: icon tile + radio */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: isSelected
                      ? opt.gradient
                      : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'),
                    border: isSelected
                      ? 'none'
                      : `1px solid ${colors.borderPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 6px 14px ${opt.shadowColor}` : 'none',
                    transition: 'all 0.18s',
                  }}>
                    <i
                      className={`bi ${opt.icon}`}
                      style={{
                        fontSize: 16,
                        color: isSelected ? '#fff' : colors.textSecondary,
                      }}
                    />
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: isSelected ? opt.gradient : 'transparent',
                    border: isSelected ? 'none' : `1.5px solid ${colors.borderPrimary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 3px 8px ${opt.shadowColor}` : 'none',
                    transition: 'all 0.18s',
                  }}>
                    {isSelected && <i className="bi bi-check2" style={{ color: '#fff', fontSize: 12, fontWeight: 800 }} />}
                  </div>
                </div>

                {/* Title + eyebrow */}
                <div>
                  <div style={{
                    fontSize: '0.6rem', fontWeight: 700,
                    color: isSelected ? (isDark ? opt.accentDark : opt.accent) : colors.textSecondary,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: 3,
                  }}>{opt.eyebrow}</div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: headingColor,
                    letterSpacing: '-0.005em',
                  }}>
                    {opt.title}
                  </div>
                </div>

                {/* Features as checkmark list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                  {opt.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 5,
                        background: isSelected
                          ? (isDark ? `${opt.accent}33` : `${opt.accent}1A`)
                          : (isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                        border: `1px solid ${isSelected ? `${opt.accent}40` : colors.borderPrimary}`,
                      }}>
                        <i className={`bi ${feat.icon}`} style={{
                          fontSize: 8,
                          color: isSelected ? (isDark ? opt.accentDark : opt.accent) : colors.textSecondary,
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.76rem',
                        color: colors.textSecondary,
                        lineHeight: 1.45,
                      }}>{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AlbumTypeSelector;
