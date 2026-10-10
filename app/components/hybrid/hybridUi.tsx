"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { serverNowMs, TIER_META, type RecommendationTier } from '@/app/lib/hybridBooking';

/**
 * The two ways to book, named and coloured the same everywhere (web, iOS,
 * Android) so nobody mistakes one for the other:
 * Direct is navy with a search icon, Post My Event is pink with a broadcast icon.
 */
export const MODE_META = {
  DIRECT: {
    label: 'Find a Photographer',
    short: 'Direct booking',
    icon: 'bi-search',
    color: '#083A85',
    soft: 'rgba(8,58,133,0.10)',
    line: 'You browse photographers, pick one, and send them a request.',
  },
  HYBRID: {
    label: 'Post My Event',
    short: 'Matched booking',
    icon: 'bi-broadcast',
    color: '#F20C8F',
    soft: 'rgba(242,12,143,0.10)',
    line: 'You describe the event; available photographers who fit say yes; you pick one.',
  },
} as const;

export type BookingModeKey = keyof typeof MODE_META;

export { modeOf } from '@/app/lib/hybridStatus';

export function ModeBadge({ mode, size = 'sm' }: { mode: BookingModeKey; size?: 'sm' | 'md' }) {
  const m = MODE_META[mode];
  return (
    <span
      title={m.line}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'md' ? '4px 10px' : '2px 8px',
        borderRadius: 999, background: m.soft, color: m.color,
        fontSize: size === 'md' ? '0.78rem' : '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      <i className={`bi ${m.icon}`} aria-hidden /> {m.label}
    </span>
  );
}

export function TierBadge({ tier }: { tier: RecommendationTier }) {
  const t = TIER_META[tier];
  return (
    <span
      title={t.hint}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 999,
        background: t.bg, color: t.color, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.02em',
      }}
    >
      <i className={`bi ${tier === 'HIGH' ? 'bi-stars' : tier === 'MEDIUM' ? 'bi-hand-thumbs-up' : 'bi-check2'}`} aria-hidden />
      {t.label}
    </span>
  );
}

/** Time left until an instant, on the server's clock; ticks every second. */
export function useCountdown(targetIso?: string | null) {
  const target = targetIso ? Date.parse(targetIso) : NaN;
  const [now, setNow] = useState(() => serverNowMs());
  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const id = setInterval(() => setNow(serverNowMs()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!Number.isFinite(target)) return null;
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return {
    done: ms <= 0,
    ms,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "01d 22h 18m 14s" or "14m 05s". */
export function CountdownText({ to, doneText = 'Now' }: { to?: string | null; doneText?: string }) {
  const c = useCountdown(to);
  if (!c) return null;
  if (c.done) return <>{doneText}</>;
  if (c.days > 0) return <>{pad(c.days)}d {pad(c.hours)}h {pad(c.minutes)}m {pad(c.seconds)}s</>;
  if (c.hours > 0) return <>{pad(c.hours)}h {pad(c.minutes)}m {pad(c.seconds)}s</>;
  return <>{pad(c.minutes)}m {pad(c.seconds)}s</>;
}

/** A large event-start clock for booked events. */
export function EventStartClock({ startAt, label = 'Event starts in' }: { startAt?: string | null; label?: string }) {
  const { colors } = useTheme();
  const c = useCountdown(startAt);
  if (!c) return null;
  const parts: [number, string][] = [[c.days, 'days'], [c.hours, 'hrs'], [c.minutes, 'min'], [c.seconds, 'sec']];
  return (
    <div aria-live="off" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textTertiary }}>
        {c.done ? 'Event time' : label}
      </span>
      {c.done ? (
        <span style={{ fontWeight: 800, color: colors.brandPrimary }}>The event has started</span>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          {parts.map(([v, l]) => (
            <div key={l} style={{ minWidth: 52, textAlign: 'center', padding: '6px 4px', borderRadius: 10, background: colors.bgTertiary }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{pad(v)}</div>
              <div style={{ fontSize: '0.62rem', color: colors.textTertiary, fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A selectable pill. Behaves as a radio inside a role="radiogroup". */
export function Chip({
  selected, onClick, children, icon, disabled,
}: { selected: boolean; onClick: () => void; children: React.ReactNode; icon?: string; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className="hy-focus"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
        border: `1.5px solid ${selected ? colors.brandPrimary : colors.borderPrimary}`,
        background: selected ? colors.brandPrimary : colors.bgCard,
        color: selected ? '#fff' : colors.textPrimary,
        fontSize: '0.84rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {icon && <i className={`bi ${icon}`} aria-hidden />}
      {children}
    </button>
  );
}

/** A larger radio card with a title and a one-line description. */
export function OptionCard({
  selected, onClick, title, description, icon, accent,
}: { selected: boolean; onClick: () => void; title: string; description?: string; icon?: string; accent?: string }) {
  const { colors } = useTheme();
  const tone = accent || colors.brandPrimary;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="hy-focus"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', width: '100%',
        padding: '12px 14px', borderRadius: 14,
        border: `2px solid ${selected ? tone : colors.borderPrimary}`,
        background: selected ? `${tone}12` : colors.bgCard, cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          border: `2px solid ${selected ? tone : colors.borderSecondary}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone }} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.88rem', color: colors.textPrimary }}>
          {icon && <i className={`bi ${icon}`} aria-hidden style={{ color: tone }} />}
          {title}
        </span>
        {description && <span style={{ fontSize: '0.76rem', color: colors.textTertiary, lineHeight: 1.4 }}>{description}</span>}
      </span>
    </button>
  );
}

export function FieldLabel({ children, htmlFor, hint, required }: { children: React.ReactNode; htmlFor?: string; hint?: string; required?: boolean }) {
  const { colors } = useTheme();
  return (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: colors.textPrimary }}>
        {children}{required && <span aria-hidden style={{ color: colors.brandAccent }}> *</span>}
      </label>
      {hint && <span style={{ fontSize: '0.74rem', color: colors.textTertiary }}>{hint}</span>}
    </div>
  );
}

/** Shared input / select styling, theme aware. */
export function useFieldStyle(): React.CSSProperties {
  const { colors } = useTheme();
  return {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: 12,
    border: `1.5px solid ${colors.borderPrimary}`, background: colors.bgInput,
    color: colors.textPrimary, fontSize: '0.9rem', outline: 'none',
  };
}

export function Notice({ tone, children, icon }: { tone: 'error' | 'info' | 'success' | 'warning'; children: React.ReactNode; icon?: string }) {
  const { colors } = useTheme();
  const map = {
    error: [colors.statusError, colors.statusErrorBg, 'bi-exclamation-octagon'],
    info: [colors.statusInfo, colors.statusInfoBg, 'bi-info-circle'],
    success: [colors.statusSuccess, colors.statusSuccessBg, 'bi-check-circle'],
    warning: [colors.statusWarning, colors.statusWarningBg, 'bi-exclamation-triangle'],
  } as const;
  const [fg, bg, ic] = map[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} style={{
      display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12,
      background: bg, border: `1px solid ${fg}55`, color: colors.textPrimary, fontSize: '0.84rem', lineHeight: 1.45,
    }}>
      <i className={`bi ${icon || ic}`} aria-hidden style={{ color: fg, marginTop: 1 }} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

/** Focus ring for the custom controls above; mounted once per screen. */
export function HybridStyles() {
  return (
    <style>{`
      .hy-focus:focus-visible { outline: 3px solid #F20C8F; outline-offset: 2px; }
      .hy-input:focus { border-color: #083A85 !important; box-shadow: 0 0 0 3px rgba(8,58,133,0.15); }
      @keyframes hy-pulse { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
      @keyframes hy-spin { to { transform: rotate(360deg) } }
    `}</style>
  );
}

export { friendlyEventStatus, isOpenHybrid, isEndedHybrid, isUpcomingEventStatus } from '@/app/lib/hybridStatus';
