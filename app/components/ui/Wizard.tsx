"use client";

import React from 'react';
import Modal from './Modal';

export interface WizardStep {
  /** Step label shown in the rail (optional). */
  label?: string;
  /** Title rendered at top of body. */
  title?: React.ReactNode;
  /** Optional helper line under the title. */
  description?: React.ReactNode;
  /** Step body. */
  content: React.ReactNode;
  /** Disable Next/Continue when a step is invalid. */
  canContinue?: boolean;
  /** Override the next-button label. */
  nextLabel?: string;
  /** Custom render for the entire footer (overrides default Back/Next). */
  footer?: React.ReactNode;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  step: number;
  steps: WizardStep[];
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  finishLabel?: string;
  /** Disable closing via backdrop. */
  lockBackdrop?: boolean;
}

/**
 * Connekyt Wizard — multi-step modal with a thin progress rail.
 * Pure white background, soft shadow, slides up on mobile.
 */
export const Wizard: React.FC<WizardProps> = ({
  isOpen,
  onClose,
  step,
  steps,
  onBack,
  onNext,
  onFinish,
  size = 'md',
  finishLabel = 'Finish',
  lockBackdrop,
}) => {
  if (!isOpen) return null;
  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;
  const isFirst = step === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose={false} size={size} lockBackdrop={lockBackdrop}
      title={current.title}
      description={current.description}
      footer={current.footer ?? (
        <>
          {!isFirst && (
            <button className="ck-btn ck-btn-ghost" onClick={onBack}>
              <i className="bi bi-arrow-left" /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            className="ck-btn ck-btn-primary"
            onClick={isLast ? onFinish : onNext}
            disabled={current.canContinue === false}
          >
            {isLast ? finishLabel : (current.nextLabel ?? 'Continue')}
            {!isLast && <i className="bi bi-arrow-right" />}
          </button>
        </>
      )}
    >
      <div className="ck-wizard-rail" style={{ marginInline: -22, marginTop: -22, marginBottom: 22 }}>
        {steps.map((_, i) => (
          <div key={i} className={`ck-wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`} />
        ))}
      </div>
      <div className="ck-fade-in-up">{current.content}</div>
    </Modal>
  );
};

export default Wizard;
