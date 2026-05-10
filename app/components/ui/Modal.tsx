"use client";

import React, { useEffect } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  hideClose?: boolean;
  /** When true, clicking backdrop does NOT close (useful for forms in flight). */
  lockBackdrop?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Connekyt Modal — Airbnb-inspired milky-white surface, soft shadow, rounded.
 * On mobile slides up from the bottom.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  hideClose = false,
  lockBackdrop = false,
  footer,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lockBackdrop) onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, lockBackdrop, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : '';

  return (
    <>
      <div className="ck-modal-backdrop" onClick={() => { if (!lockBackdrop) onClose(); }} />
      <div className="ck-modal-shell">
        <div className={`ck-modal-card ${sizeClass}`} role="dialog" aria-modal="true">
          {(title || !hideClose) && (
            <div className="ck-modal-header">
              <div style={{ minWidth: 0, flex: 1 }}>
                {title && (
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: 'var(--ck-text)',
                  }}>{title}</h3>
                )}
                {description && (
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '0.875rem',
                    color: 'var(--ck-text-soft)',
                  }}>{description}</p>
                )}
              </div>
              {!hideClose && (
                <button className="ck-modal-close" onClick={onClose} aria-label="Close">
                  <i className="bi bi-x-lg" style={{ fontSize: 16 }} />
                </button>
              )}
            </div>
          )}
          <div className="ck-modal-body">{children}</div>
          {footer && <div className="ck-modal-footer">{footer}</div>}
        </div>
      </div>
    </>
  );
};

export default Modal;
