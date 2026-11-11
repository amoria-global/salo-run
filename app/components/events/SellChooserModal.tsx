'use client';

/**
 * "What do you want to sell?": the modal every "Sell photos" entry opens BEFORE any form. Same words as the mobile
 * sheet. The last choice is remembered per browser and highlighted; the chooser itself is never skipped.
 */
import React, { useEffect, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import { SELL_CHOICES, SELL_CHOOSER_TITLE, SELL_LAST_CHOICE_KEY, parseSellChoice, type SellChoiceKey } from '../../../lib/albums/sellPhotos';

export function readLastSellChoice(): SellChoiceKey | null {
  try { return parseSellChoice(window.localStorage.getItem(SELL_LAST_CHOICE_KEY)); } catch { return null; }
}
export function rememberSellChoice(key: SellChoiceKey) {
  try { window.localStorage.setItem(SELL_LAST_CHOICE_KEY, key); } catch { /* private mode: nothing to remember */ }
}

export default function SellChooserModal({ onPick, onClose }: { onPick: (key: SellChoiceKey) => void; onClose: () => void }) {
  const [last] = useState<SellChoiceKey | null>(() => (typeof window === 'undefined' ? null : readLastSellChoice()));
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    bodyRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => { before?.focus?.(); };
  }, []);

  return (
    <Modal isOpen onClose={onClose} size="md" title={SELL_CHOOSER_TITLE}>
      <div ref={bodyRef} style={{ display: 'grid', gap: 10 }} data-testid="sell-chooser">
        {SELL_CHOICES.map((c) => {
          const isLast = last === c.key;
          return (
            <button
              key={c.key}
              type="button"
              data-testid={`sell-choice-${c.key}`}
              aria-label={`${c.title}. ${c.body}`}
              aria-pressed={isLast}
              onClick={() => { rememberSellChoice(c.key); onPick(c.key); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', minHeight: 72, padding: 12, borderRadius: 14, border: `1px solid ${isLast ? `rgb(${c.tone})` : 'var(--ck-stroke)'}`, background: 'transparent', color: 'var(--ck-text)', cursor: 'pointer' }}
            >
              <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${c.tone},0.16)`, color: `rgb(${c.tone})`, border: `1px solid rgba(${c.tone},0.35)` }}>
                <i className={`bi ${c.icon}`} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>
                  {c.title}
                  {isLast ? <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: `rgb(${c.tone})` }}>Last used</span> : null}
                </span>
                <span style={{ display: 'block', fontSize: 13, opacity: 0.75 }}>{c.body}</span>
              </span>
              <i className="bi bi-chevron-right" aria-hidden="true" style={{ opacity: 0.6 }} />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
