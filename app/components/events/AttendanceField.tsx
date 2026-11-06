'use client';

import React, { useId } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FieldError } from '../errors/FieldError';
import type { AttendanceChoice } from '@/lib/events/eventFormRules';

export const ATTENDANCE_LABEL = 'How can guests attend?';
export const ATTENDANCE_HELPER = 'Stream-only viewers get the live stream as their ticket. In person guests also need a venue.';

/** The DOM id every required field carries, so a blocked submit can scroll to it and focus it. */
export const eventFieldId = (key: string) => `event-field-${key}`;

/**
 * The required "How can guests attend?" field: In person + live stream | Live stream only, nothing pre-selected on a new
 * event (like Wish invites). It decides whether the venue fields are asked for, so the two can never disagree.
 */
export function AttendanceField({ value, onChange, error, disabled }: {
  value: AttendanceChoice | null;
  onChange: (next: AttendanceChoice) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const uid = useId();
  const errId = `${eventFieldId('attendance')}-error`;
  const RED = '#E61220';
  const opt = (label: string, choice: AttendanceChoice): React.ReactNode => {
    const selected = value === choice;
    return (
      <label
        style={{
          position: 'relative', minHeight: 44, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontWeight: 700, fontSize: 14, textAlign: 'center', padding: '0 8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
          background: selected ? colors.brandAccent : 'transparent',
          color: selected ? '#fff' : colors.textSecondary,
        }}
      >
        <input type="radio" name={`attendance-${uid}`} checked={selected} onChange={() => onChange(choice)} disabled={disabled}
          style={{ position: 'absolute', inset: 0, opacity: 0, margin: 0, cursor: 'inherit' }} />
        {selected ? <span aria-hidden="true">{'✓'}</span> : null}
        <span>{label}</span>
      </label>
    );
  };
  return (
    <fieldset id={eventFieldId('attendance')} aria-required="true" aria-invalid={error ? true : undefined} aria-describedby={error ? errId : undefined}
      style={{ margin: 0, minWidth: 0, padding: 14, borderRadius: 14, background: colors.bgCard, border: `1px solid ${error ? RED : colors.borderPrimary}` }}>
      <legend style={{ padding: '0 4px', fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>
        {ATTENDANCE_LABEL}<span aria-hidden="true" style={{ color: '#F20C8F' }}> *</span>
      </legend>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 12, background: colors.bgSecondary ?? 'rgba(0,0,0,0.12)', border: `1px solid ${error ? RED : colors.borderPrimary}` }}>
          {opt('In person + live stream', 'IN_PERSON')}
          {opt('Live stream only', 'STREAM_ONLY')}
        </div>
        {error ? <FieldError id={errId} message={error} /> : (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: colors.textSecondary }}>{ATTENDANCE_HELPER}</p>
        )}
      </div>
    </fieldset>
  );
}

/** Scrolls to the field that blocked a submit and focuses it (the first radio for a choice). Never opens "More options". */
export function focusEventField(key: string) {
  const el = document.getElementById(eventFieldId(key));
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const target = el.matches('input,select,textarea,button')
    ? el
    : (el.querySelector('input,select,textarea,button') as HTMLElement | null);
  target?.focus({ preventScroll: true });
}
