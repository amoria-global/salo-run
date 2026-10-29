'use client';

import type { CSSProperties } from 'react';
import CurrencySelect from './CurrencySelect';
import { coverageHint, type EventCoverage } from '@/lib/events/selfStream';

type Colors = {
  textPrimary: string; textSecondary: string; borderPrimary: string; bgTertiary: string; bgSecondary: string;
};

/**
 * "Who covers this event?" on the create event form: a photographer, or the owner streaming it themselves. When the owner
 * streams it (and `showFee`), the live stream fee and its currency are asked for here; the coordinator form already has its
 * own pricing section, so it passes showFee false. The photographer assignment is hidden by the page while this is private.
 */
export default function EventCoverageChoice({
  value, onChange, colors, showFee = false, fee = '', onFee, currencyCode = 'RWF', onCurrency, currencies = [], error,
}: {
  value: EventCoverage;
  onChange: (v: EventCoverage) => void;
  colors: Colors;
  showFee?: boolean;
  fee?: string;
  onFee?: (v: string) => void;
  currencyCode?: string;
  onCurrency?: (code: string) => void;
  currencies?: { code: string; name?: string }[];
  error?: string | null;
}) {
  const seg = (active: boolean): CSSProperties => ({
    flex: 1, padding: '0.7rem 0.75rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
    border: `2px solid ${active ? '#083A85' : colors.borderPrimary}`,
    background: active ? '#083A85' : colors.bgSecondary, color: active ? '#fff' : colors.textSecondary,
  });
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.6rem' }} id="coverage-label">Who covers this event?</div>
      <div role="group" aria-labelledby="coverage-label" style={{ display: 'flex', gap: 8 }}>
        <button type="button" aria-pressed={value === 'PUBLIC'} onClick={() => onChange('PUBLIC')} style={seg(value === 'PUBLIC')}>A photographer</button>
        <button type="button" aria-pressed={value === 'PRIVATE'} onClick={() => onChange('PRIVATE')} style={seg(value === 'PRIVATE')}>I stream it myself</button>
      </div>
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', lineHeight: 1.45, color: colors.textSecondary }}>{coverageHint(value)}</p>
      {value === 'PRIVATE' && showFee ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 8, marginTop: '0.75rem', alignItems: 'end' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>
            Live stream fee *
            <input
              inputMode="numeric" value={fee} onChange={(e) => onFee?.(e.target.value)} placeholder="e.g., 2000" aria-invalid={!!error}
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '0.625rem', border: `2px solid ${error ? '#DC2626' : colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, background: colors.bgSecondary }}
            />
          </label>
          <CurrencySelect
            value={currencyCode} onChange={(c) => onCurrency?.(c)} placeholder="Currency"
            options={currencies.map((c) => ({ value: c.code, code: c.code, name: c.name }))}
            style={{ padding: '0.625rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem', fontSize: '0.9rem', color: colors.textPrimary, background: colors.bgSecondary }}
          />
        </div>
      ) : null}
      {error ? <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: '#DC2626' }}>{error}</p> : null}
    </div>
  );
}
