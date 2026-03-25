'use client';

import React, { useState } from 'react';

interface SendFreeInvitationModalProps {
  albumTitle: string;
  recipientEmail: string;
  accessCode: string;
  onClose: () => void;
  onSend: () => Promise<void>;
}

const SendFreeInvitationModal: React.FC<SendFreeInvitationModalProps> = ({
  albumTitle,
  recipientEmail,
  accessCode,
  onClose,
  onSend,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    setError('');

    try {
      await onSend();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          maxWidth: '500px',
          width: '100%',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
              Send Album Invitation
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
              Email invitation to recipient
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            style={{
              background: 'none',
              border: 'none',
              cursor: isSending ? 'not-allowed' : 'pointer',
              color: '#9ca3af',
              padding: '0.25rem',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {success ? (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#10b981', margin: '0 0 0.5rem' }}>
              Invitation Sent!
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Email has been sent to {recipientEmail}
            </p>
          </div>
        ) : (
          <>
            {/* Album Details */}
            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>Album Title</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{albumTitle}</div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>Recipient Email</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{recipientEmail}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>Access Code</div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#3b82f6',
                    letterSpacing: '0.15em',
                  }}
                >
                  {accessCode}
                </div>
              </div>
            </div>

            {/* Information */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '0.5rem',
                padding: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.6 }}>
                <strong>📧 What will be sent:</strong>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                  <li>Welcome email with album access link</li>
                  <li>6-digit access code for verification</li>
                  <li>Instructions to view and download photos</li>
                  <li>60-day access period information</li>
                </ul>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                disabled={isSending}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: '#ffffff',
                  color: '#6b7280',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  opacity: isSending ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                style={{
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: isSending ? '#9ca3af' : '#3b82f6',
                  color: '#ffffff',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {isSending ? (
                  <>
                    <svg
                      style={{ animation: 'spin 1s linear infinite' }}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        opacity="0.75"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SendFreeInvitationModal;
