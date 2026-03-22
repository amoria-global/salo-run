"use client";

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { submitSurvey } from '@/lib/xentripay';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ isOpen, onClose, title, children }) => {
  const { colors } = useTheme();
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: colors.bgCard, borderRadius: '1rem',
        width: '100%', maxWidth: '500px', maxHeight: '90vh',
        overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: `1px solid ${colors.borderPrimary}`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.borderPrimary}`,
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.5rem', color: colors.textSecondary, lineHeight: 1,
          }}>&times;</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
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
  onSurveyComplete: (disputeFlagged: boolean) => void;
}

type OptionValue = string | boolean | null;

interface QuestionOption {
  label: string;
  value: OptionValue;
  color?: string;
}

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
      setTimeout(() => {
        onSurveyComplete(result.disputeFlagged || false);
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: '0.5rem 1rem',
              border: isActive ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
              borderRadius: '0.5rem',
              background: isActive
                ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                : colors.bgTertiary,
              color: isActive ? (actualTheme === 'dark' ? '#93C5FD' : '#083A85') : colors.textSecondary,
              fontSize: '0.85rem',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flex: options.length <= 3 ? '1' : undefined,
              minWidth: '0',
              textAlign: 'center',
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
      <ModalOverlay isOpen={isOpen} onClose={onClose} title="Survey Submitted">
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 1rem', borderRadius: '50%',
            backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            Thank you for your feedback!
          </h4>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
            You can now proceed with your payment.
          </p>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} title="Service Confirmation">
      <div>
        <p style={{ fontSize: '0.88rem', color: colors.textSecondary, margin: '0 0 1.25rem', lineHeight: '1.5' }}>
          Before completing payment for <strong>{eventName}</strong>, please confirm your experience
          with <strong>{photographerName}</strong>.
        </p>

        {/* Q1: Attended Event */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            1. Did the photographer attend the event as agreed?
          </label>
          {renderOptionButtons(
            [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
            attendedEvent,
            setAttendedEvent
          )}
        </div>

        {/* Q2: Service Delivery */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            2. Was the service delivered as expected?
          </label>
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

        {/* Q3: Satisfaction Level */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            3. Are you satisfied with the quality of service?
          </label>
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

        {/* Q4: Deliverables Received */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            4. Have you received the agreed deliverables (photos/videos)?
          </label>
          {renderOptionButtons(
            [
              { label: 'Yes', value: true },
              { label: 'Not yet', value: false },
            ],
            deliverablesReceived,
            setDeliverablesReceived
          )}
        </div>

        {/* Q5: Issues */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            5. Were there any issues during the service?
          </label>
          <textarea
            placeholder="Describe any issues (optional)"
            value={issuesDescription}
            onChange={(e) => setIssuesDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '0.7rem', border: `2px solid ${colors.borderPrimary}`,
              borderRadius: '0.5rem', fontSize: '0.85rem', color: colors.textPrimary,
              backgroundColor: colors.bgTertiary, outline: 'none', boxSizing: 'border-box',
              resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#083A85'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
          />
        </div>

        {/* Q6: Would Book Again */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
            6. Would you book this photographer again?
          </label>
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
          <p style={{ fontSize: '0.85rem', color: '#EF4444', margin: '0 0 0.75rem', textAlign: 'center' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.75rem 1rem', border: `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.5rem', background: colors.bgTertiary, color: colors.textPrimary,
            fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
          }}>Cancel</button>
          <button
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
            style={{
              flex: 1, padding: '0.75rem 1rem',
              border: '2px solid #062a63', borderRadius: '0.5rem',
              background: (!isFormValid || isSubmitting) ? '#9CA3AF' : '#083A85',
              color: 'white', fontSize: '0.9rem', fontWeight: '600',
              cursor: (!isFormValid || isSubmitting) ? 'not-allowed' : 'pointer',
              opacity: (!isFormValid || isSubmitting) ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Confirmation'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default SatisfactionSurveyModal;
