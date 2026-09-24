"use client";

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { submitSurvey } from '@/lib/xentripay';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  icon?: string; // bootstrap icon class without leading "bi "
  iconTone?: 'info' | 'success';
  children: React.ReactNode;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ isOpen, onClose, title, eyebrow, icon, iconTone = 'info', children }) => {
  const { colors } = useTheme();
  if (!isOpen) return null;

  const iconGradient = iconTone === 'success'
    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)';
  const iconShadow = iconTone === 'success'
    ? '0 10px 24px rgba(16,185,129,0.30)'
    : '0 10px 24px rgba(8,58,133,0.30)';

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: 'relative',
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        width: '100%', maxWidth: 540, maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
        border: `1px solid ${colors.borderPrimary}`,
      }}>
        <span aria-hidden style={{
          position: 'sticky', top: 0, left: 0, right: 0, height: 3, display: 'block',
          background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
          zIndex: 2,
        }} />
        <div style={{ padding: '1.4rem 1.5rem 1.4rem', position: 'relative' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14,
              background: colors.bgTertiary,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: 9,
              cursor: 'pointer',
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.textSecondary,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: 12 }} />
          </button>
          {icon && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: iconGradient,
                boxShadow: iconShadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${icon}`} style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
            {eyebrow && (
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>{eyebrow}</div>
            )}
            <h3 style={{
              fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary,
              margin: 0, letterSpacing: '-0.01em',
            }}>{title}</h3>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

interface SatisfactionSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  photographerName: string;
  onSurveyComplete: (disputeFlagged: boolean, comment: string) => void;
}

type OptionValue = string | boolean | null;

interface QuestionOption {
  label: string;
  value: OptionValue;
  color?: string;
}

// Module scope: defined inside the modal it was a new component type on
// every render, so React remounted each label.
const QuestionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{
    display: 'block',
    fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '0.45rem',
  }}>{children}</label>
);

const SatisfactionSurveyModal: React.FC<SatisfactionSurveyModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventName,
  photographerName,
  onSurveyComplete,
}) => {
  const { colors, actualTheme } = useTheme();

  const [attendedEvent, setAttendedEvent] = useState<boolean | null>(null);
  const [serviceDelivery, setServiceDelivery] = useState<string>('');
  const [satisfactionLevel, setSatisfactionLevel] = useState<string>('');
  const [deliverablesReceived, setDeliverablesReceived] = useState<boolean | null>(null);
  const [issuesDescription, setIssuesDescription] = useState<string>('');
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isFormValid =
    attendedEvent !== null &&
    serviceDelivery !== '' &&
    satisfactionLevel !== '' &&
    deliverablesReceived !== null &&
    wouldBookAgain !== null;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    setError('');

    const result = await submitSurvey(eventId, {
      attendedEvent: attendedEvent!,
      serviceDelivery,
      satisfactionLevel,
      deliverablesReceived: deliverablesReceived!,
      issuesDescription: issuesDescription.trim() || undefined,
      wouldBookAgain: wouldBookAgain!,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      const surveyComment = issuesDescription.trim();
      setTimeout(() => {
        onSurveyComplete(result.disputeFlagged || false, surveyComment);
      }, 1500);
    } else {
      setError(result.error || 'Failed to submit survey. Please try again.');
    }
  };

  const renderOptionButtons = (
    options: QuestionOption[],
    selected: OptionValue,
    onSelect: (value: any) => void
  ) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: '0.55rem 0.9rem',
              border: `1px solid ${isActive ? 'rgba(8,58,133,0.45)' : colors.borderPrimary}`,
              borderRadius: 11,
              background: isActive
                ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                : colors.bgCard,
              color: isActive ? '#fff' : colors.textPrimary,
              fontSize: '0.85rem',
              fontWeight: isActive ? 700 : 600,
              letterSpacing: '-0.005em',
              cursor: 'pointer',
              transition: 'all 0.18s',
              flex: options.length <= 3 ? '1' : undefined,
              minWidth: 0,
              textAlign: 'center',
              boxShadow: isActive ? '0 6px 14px rgba(8,58,133,0.22)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  if (submitted) {
    return (
      <ModalOverlay isOpen={isOpen} onClose={onClose} title="Thank you for your feedback!" eyebrow="Survey submitted" icon="bi-check2-circle" iconTone="success">
        <p style={{ textAlign: 'center', fontSize: '0.92rem', color: colors.textSecondary, margin: '0 auto 0.5rem', maxWidth: 380, lineHeight: 1.5 }}>
          Your responses have been recorded. You can now proceed with your payment.
        </p>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} title="Service Confirmation" eyebrow="Before you pay" icon="bi-clipboard-check-fill">
      <div>
        <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 auto 1.25rem', textAlign: 'center', lineHeight: 1.55, maxWidth: 440 }}>
          Before completing payment for <strong style={{ color: colors.textPrimary }}>{eventName}</strong>, please confirm your experience
          with <strong style={{ color: colors.textPrimary }}>{photographerName}</strong>.
        </p>

        {/* Q1 */}
        <div style={{ marginBottom: '1.05rem' }}>
          <QuestionLabel>1. Did the photographer attend the event as agreed?</QuestionLabel>
          {renderOptionButtons(
            [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
            attendedEvent,
            setAttendedEvent
          )}
        </div>

        {/* Q2 */}
        <div style={{ marginBottom: '1.05rem' }}>
          <QuestionLabel>2. Was the service delivered as expected?</QuestionLabel>
          {renderOptionButtons(
            [
              { label: 'Yes', value: 'YES' },
              { label: 'Partially', value: 'PARTIALLY' },
              { label: 'No', value: 'NO' },
            ],
            serviceDelivery,
            setServiceDelivery
          )}
        </div>

        {/* Q3 */}
        <div style={{ marginBottom: '1.05rem' }}>
          <QuestionLabel>3. Are you satisfied with the quality of service?</QuestionLabel>
          {renderOptionButtons(
            [
              { label: 'Very satisfied', value: 'VERY_SATISFIED' },
              { label: 'Satisfied', value: 'SATISFIED' },
              { label: 'Not satisfied', value: 'NOT_SATISFIED' },
            ],
            satisfactionLevel,
            setSatisfactionLevel
          )}
        </div>

        {/* Q4 */}
        <div style={{ marginBottom: '1.05rem' }}>
          <QuestionLabel>4. Have you received the agreed deliverables (photos/videos)?</QuestionLabel>
          {renderOptionButtons(
            [
              { label: 'Yes', value: true },
              { label: 'Not yet', value: false },
            ],
            deliverablesReceived,
            setDeliverablesReceived
          )}
        </div>

        {/* Q5 */}
        <div style={{ marginBottom: '1.05rem' }}>
          <QuestionLabel>5. Were there any issues during the service?</QuestionLabel>
          <textarea
            placeholder="Describe any issues (optional)"
            value={issuesDescription}
            onChange={(e) => setIssuesDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '0.7rem 0.85rem',
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: 11,
              fontSize: '0.88rem', color: colors.textPrimary,
              backgroundColor: colors.bgCard, outline: 'none', boxSizing: 'border-box',
              resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(242,12,143,0.50)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242,12,143,0.10)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Q6 */}
        <div style={{ marginBottom: '1.3rem' }}>
          <QuestionLabel>6. Would you book this photographer again?</QuestionLabel>
          {renderOptionButtons(
            [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
            wouldBookAgain,
            setWouldBookAgain
          )}
        </div>

        {error && (
          <div style={{
            fontSize: '0.85rem',
            color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
            margin: '0 0 0.85rem',
            padding: '0.6rem 0.85rem',
            background: actualTheme === 'dark' ? 'rgba(220,38,38,0.18)' : 'rgba(254,242,242,0.85)',
            border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 13 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.75rem 1rem',
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: 11,
              background: colors.bgTertiary,
              color: colors.textPrimary,
              fontSize: '0.9rem', fontWeight: 700,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
          >
            Cancel
          </button>
          <button
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
            style={{
              flex: 1.4, padding: '0.75rem 1rem',
              border: 'none', borderRadius: 11,
              background: (!isFormValid || isSubmitting)
                ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
              color: 'white', fontSize: '0.92rem', fontWeight: 700,
              letterSpacing: '-0.005em',
              cursor: (!isFormValid || isSubmitting) ? 'not-allowed' : 'pointer',
              opacity: (!isFormValid || isSubmitting) ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: (!isFormValid || isSubmitting) ? 'none' : '0 8px 18px rgba(8,58,133,0.30)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { if (isFormValid && !isSubmitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = (!isFormValid || isSubmitting) ? 'none' : '0 8px 18px rgba(8,58,133,0.30)'; }}
          >
            {isSubmitting ? (
              <><i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} /> Submitting...</>
            ) : (
              <><i className="bi bi-check2-circle" style={{ fontSize: 13 }} /> Submit Confirmation</>
            )}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default SatisfactionSurveyModal;
