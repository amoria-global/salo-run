'use client';

/**
 * "Get started with Events" as a centred modal: the same content as the mobile bottom sheet. Focus moves into the
 * modal when it opens and returns to the page when it closes; Escape, the backdrop, the close button and
 * "Explore on my own" close it for this session only.
 */
import React, { useEffect, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import type { GetStartedAction, GetStartedKey } from '../../lib/getStarted';

export default function GetStartedModal({
  actions, createLabel, initialDismissed = false, onPick, onClose, onDismissChange,
}: {
  actions: GetStartedAction[];
  /** The header create button's label, named in the tip. */
  createLabel: string;
  initialDismissed?: boolean;
  onPick: (key: GetStartedKey) => void;
  onClose: () => void;
  onDismissChange: (forever: boolean) => void;
}) {
  const [forever, setForever] = useState(initialDismissed);
  const bodyRef = useRef<HTMLDivElement>(null);
  const first = actions[0];

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    bodyRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => { before?.focus?.(); };
  }, []);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title="Get started with Events"
      description="What would you like to do first?"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {first ? (
            <button type="button" className="ck-btn ck-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onPick(first.key)}>
              <i className="bi bi-plus-lg" aria-hidden="true" /> {first.title}
            </button>
          ) : null}
          <button type="button" className="ck-btn ck-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Explore on my own</button>
        </div>
      }
    >
      <div ref={bodyRef} style={{ display: 'grid', gap: 10 }}>
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onPick(a.key)}
            aria-label={`${a.title}. ${a.body}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', minHeight: 64, padding: 12, borderRadius: 14, border: '1px solid var(--ck-stroke)', background: 'transparent', color: 'var(--ck-text)', cursor: 'pointer' }}
          >
            <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${a.tone},0.16)`, color: `rgb(${a.tone})`, border: `1px solid rgba(${a.tone},0.35)` }}>
              <i className={`bi ${a.icon}`} style={{ fontSize: 18 }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem' }}>{a.title}</span>
              <span style={{ display: 'block', fontSize: '0.84rem', color: 'var(--ck-text-soft)' }}>{a.body}</span>
            </span>
            <i className="bi bi-chevron-right" aria-hidden="true" style={{ color: 'var(--ck-text-soft)' }} />
          </button>
        ))}
        <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--ck-text-soft)' }}>
          You can always create from the blue <strong style={{ color: 'var(--ck-text)' }}>+ {createLabel}</strong> button at the top of this page.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: 'var(--ck-text-soft)', cursor: 'pointer', minHeight: 32 }}>
          <input
            type="checkbox"
            checked={forever}
            onChange={(e) => { setForever(e.target.checked); onDismissChange(e.target.checked); }}
          />
          Don&apos;t show this again
        </label>
      </div>
    </Modal>
  );
}
