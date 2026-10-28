'use client';

import React, { useId } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  WISH_INVITES_ERROR_ID,
  WISH_INVITES_FIELD_ID,
  WISH_INVITES_HELPER,
  WISH_INVITES_LABEL,
  WISH_INVITES_QUESTION,
} from '@/lib/wishes/wishInvites';

/**
 * The required "Wish invites" field: a label, the question, an Enable | Disable choice with nothing pre-selected on a new
 * event, and the helper. A native radio group (arrow keys and screen readers work as expected); the error is linked to the
 * group with aria-describedby. One component and one set of words for every role's create and edit form, the same as the
 * mobile app and the landing site.
 */
export function WishInvitesField({ value, onChange, error, disabled, name }: {
  value: boolean | null;
  onChange: (next: boolean) => void;
  error?: string | null;
  disabled?: boolean;
  name?: string;
}) {
  const { colors } = useTheme();
  const uid = useId();
  const group = name ?? `wish-invites-${uid}`;
  const RED = '#E61220';
  const describedBy = error ? WISH_INVITES_ERROR_ID : `${WISH_INVITES_FIELD_ID}-helper`;
  const opt = (label: string, on: boolean): React.ReactNode => {
    const selected = value === on;
    return (
      <label
        style={{
          position: 'relative', minHeight: 44, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontWeight: 700, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
          background: selected ? (on ? 'linear-gradient(180deg,#46d6ea,#1fb6cf)' : colors.brandAccent) : 'transparent',
          color: selected ? (on ? '#04202a' : '#fff') : colors.textSecondary,
        }}
      >
        <input type="radio" name={group} checked={selected} onChange={() => onChange(on)} disabled={disabled}
          style={{ position: 'absolute', inset: 0, opacity: 0, margin: 0, cursor: 'inherit' }} />
        {selected ? <span aria-hidden="true">{'✓'}</span> : null}
        <span>{label}</span>
      </label>
    );
  };
  return (
    <fieldset id={WISH_INVITES_FIELD_ID} aria-required="true" aria-invalid={error ? true : undefined} aria-describedby={describedBy}
      style={{ margin: 0, minWidth: 0, padding: 14, borderRadius: 14, background: colors.bgCard, border: `1px solid ${error ? RED : colors.borderPrimary}` }}>
      <legend style={{ padding: '0 4px', fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>
        {WISH_INVITES_LABEL}<span aria-hidden="true" style={{ color: '#F20C8F' }}> *</span>
      </legend>
      <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: colors.textSecondary }}>{WISH_INVITES_QUESTION}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 12, background: colors.bgSecondary ?? 'rgba(0,0,0,0.12)', border: `1px solid ${error ? RED : colors.borderPrimary}` }}>
        {opt('Enable', true)}
        {opt('Disable', false)}
      </div>
      {error ? (
        <p id={WISH_INVITES_ERROR_ID} role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: RED }}>{'ⓘ'} {error}</p>
      ) : (
        <p id={`${WISH_INVITES_FIELD_ID}-helper`} style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: colors.textSecondary }}>{WISH_INVITES_HELPER}</p>
      )}
      </div>
    </fieldset>
  );
}

/** Brings the field into view and focuses its group when it blocks a submit. */
export function focusWishInvitesField() {
  const el = document.getElementById(WISH_INVITES_FIELD_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el.querySelector('input[type="radio"]') as HTMLInputElement | null)?.focus({ preventScroll: true });
}
