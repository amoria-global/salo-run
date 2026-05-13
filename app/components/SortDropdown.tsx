"use client";

/**
 * Branded sort/filter dropdown that replaces native <select> across the dashboard.
 *
 * Native browser dropdowns can't be styled — they fall back to the OS theme
 * (flat solid-blue highlight, default fonts, no brand language). This
 * component renders a small button + popover menu that matches the rest of
 * the Connekyt dashboard: brand border, brand-pink uppercase eyebrow on the
 * selected option, brand-blue→pink gradient indicator, soft brand-blue
 * drop shadow, branded hover state.
 *
 * Keeps the same API shape as the previous native <select>:
 *   <SortDropdown value={...} onChange={...} options={[{ value, label }]} />
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface SortOption {
  value: string;
  label: string;
  /** Optional bootstrap icon class without the leading `bi `. */
  icon?: string;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  /** Bootstrap icon class for the trigger button (without leading `bi `). Defaults to bi-sort-down. */
  buttonIcon?: string;
  /** Placeholder when current value isn't in options. */
  placeholder?: string;
  /** Override the trigger button width (e.g. '180px'). */
  minWidth?: number | string;
  /** Optional label rendered above the button (e.g. "Sort by"). */
  label?: string;
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options,
  buttonIcon = 'bi-sort-down',
  placeholder = 'Sort',
  minWidth,
  label,
  className,
}) => {
  const { colors, actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = options.find(o => o.value === value);

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleSelect = useCallback((v: string) => {
    onChange(v);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative', display: 'inline-block', minWidth }}>
      {label && (
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: '#F20C8F',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>{label}</div>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%',
          background: colors.bgCard,
          border: `1px solid ${isOpen ? 'rgba(8,58,133,0.45)' : colors.borderPrimary}`,
          borderRadius: 11,
          padding: '0.5rem 0.85rem 0.5rem 0.75rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '-0.005em',
          color: colors.textPrimary,
          cursor: 'pointer',
          outline: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          minWidth: minWidth ?? 160,
          boxShadow: isOpen ? '0 0 0 3px rgba(8,58,133,0.10)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.borderColor = colors.borderPrimary; }}
      >
        <i className={`bi ${buttonIcon}`} style={{ fontSize: 13, color: '#F20C8F', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className="bi bi-chevron-down" style={{
          fontSize: 11,
          color: colors.textSecondary,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.18s',
          flexShrink: 0,
        }} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '100%',
            background: colors.bgCard,
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: 12,
            boxShadow: '0 16px 36px -12px rgba(8,58,133,0.25), 0 4px 12px -4px rgba(0,0,0,0.08)',
            padding: 5,
            zIndex: 100,
            overflow: 'hidden',
            // Brand top stripe peek
            backgroundClip: 'padding-box',
          }}
        >
          {/* Brand top stripe */}
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            borderTopLeftRadius: 12, borderTopRightRadius: 12,
          }} />
          <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '0.5rem 0.7rem',
                    border: 'none',
                    background: isSelected
                      ? (actualTheme === 'dark'
                        ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                        : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.05) 100%)')
                      : 'transparent',
                    color: colors.textPrimary,
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 800 : 600,
                    letterSpacing: '-0.005em',
                    cursor: 'pointer',
                    borderRadius: 8,
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = actualTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(8,58,133,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Left selected indicator — brand gradient bar */}
                  {isSelected && (
                    <span aria-hidden style={{
                      position: 'absolute',
                      left: 0, top: '20%', bottom: '20%', width: 3,
                      background: 'linear-gradient(180deg, #083A85 0%, #F20C8F 100%)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  {opt.icon && (
                    <i className={`bi ${opt.icon}`} style={{
                      fontSize: 12,
                      color: isSelected ? '#F20C8F' : colors.textSecondary,
                      width: 14, textAlign: 'center',
                      flexShrink: 0,
                    }} />
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <i className="bi bi-check2" style={{
                      fontSize: 14,
                      color: '#F20C8F',
                      fontWeight: 800,
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
