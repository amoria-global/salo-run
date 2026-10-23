"use client";

/**
 * The first thing on the Collaborate page: two clearly different ways to work with another photographer.
 *  - Workspace access: they work in your whole business (bookings, clients, events, opportunities).
 *  - Album collaboration: they add photos to one album and see nothing else.
 * It is a radio group, so a keyboard or screen reader user hears "Share your whole workspace" and "Share one album"
 * as the two answers to one question, and the chosen answer is also marked by colour, a check and a border.
 */

import React from 'react';

export type CollaborateMode = 'workspace' | 'albums';

interface Option {
  mode: CollaborateMode;
  icon: string;
  badge: string;
  title: string;
  lead: string;
  points: string[];
}

export const COLLABORATE_OPTIONS: Option[] = [
  {
    mode: 'workspace',
    icon: 'bi-briefcase-fill',
    badge: 'Whole workspace',
    title: 'Workspace access',
    lead: 'Let another photographer work in your business.',
    points: ['They sign in with their own account', 'They handle bookings, clients and events with you', 'Withdrawals and transactions stay with you'],
  },
  {
    mode: 'albums',
    icon: 'bi-images',
    badge: 'One album',
    title: 'Album collaboration',
    lead: 'Share a single album so others can add photos.',
    points: ['You invite them with a link', 'They add photos, you choose what goes in', 'They never see your bookings, clients or money'],
  },
];

export function CollaborateModeChooser({ mode, onChange }: { mode: CollaborateMode; onChange: (mode: CollaborateMode) => void }) {
  const move = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const next = COLLABORATE_OPTIONS[(index + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : COLLABORATE_OPTIONS.length - 1)) % COLLABORATE_OPTIONS.length];
    onChange(next.mode);
  };

  return (
    <div role="radiogroup" aria-label="How do you want to work with another photographer?" className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
      {COLLABORATE_OPTIONS.map((o, i) => {
        const on = mode === o.mode;
        return (
          <button
            key={o.mode}
            type="button"
            data-ck-shape="card"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.mode)}
            onKeyDown={(e) => move(e, i)}
            className="group relative flex flex-col items-start gap-3 border-2 p-5 text-left transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-blue)] focus-visible:ring-offset-2"
            style={{
              borderRadius: 'var(--ck-radius-lg)',
              borderColor: on ? 'var(--ck-blue)' : 'var(--ck-stroke-soft)',
              background: on ? 'color-mix(in srgb, var(--ck-blue) 6%, var(--ck-surface))' : 'var(--ck-surface)',
              boxShadow: on ? 'var(--ck-shadow)' : 'var(--ck-shadow-sm)',
            }}
          >
            <span className="flex w-full items-center gap-3">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                style={on
                  ? { background: 'var(--ck-blue)', color: '#fff' }
                  : { background: 'var(--ck-surface-soft)', color: 'var(--ck-text-soft)' }}
              >
                <i className={`bi ${o.icon}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: on ? 'var(--ck-pink)' : 'var(--ck-text-muted)' }}>{o.badge}</span>
                <span className="block text-base font-bold text-[var(--ck-text)]">{o.title}</span>
              </span>
              <span
                aria-hidden
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs"
                style={on
                  ? { background: 'var(--ck-blue)', borderColor: 'var(--ck-blue)', color: '#fff' }
                  : { borderColor: 'var(--ck-stroke)', color: 'transparent' }}
              >
                <i className="bi bi-check-lg" />
              </span>
            </span>
            <span className="text-sm font-medium text-[var(--ck-text)]">{o.lead}</span>
            <ul className="space-y-1.5 text-sm text-[var(--ck-text-soft)]">
              {o.points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <i className="bi bi-check2 mt-0.5 shrink-0" style={{ color: on ? 'var(--ck-blue)' : 'var(--ck-text-muted)' }} aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

/** A one-line pointer to the other mode, so someone in the wrong place can cross over without hunting for it. */
export function CrossLink({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <p className="mt-6 flex flex-wrap items-center gap-x-2 rounded-xl bg-[var(--ck-surface-soft)] px-4 py-3 text-sm text-[var(--ck-text-soft)]">
      <i className="bi bi-info-circle text-[var(--ck-text-muted)]" aria-hidden />
      <span>{text}</span>
      <button type="button" onClick={onClick} className="font-semibold text-[var(--ck-blue)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-blue)]">{action}</button>
    </p>
  );
}

export default CollaborateModeChooser;
