'use client';

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

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
  const { colors, actualTheme } = useTheme();
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
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
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
          position: 'relative',
          background: colors.bgCard,
          borderRadius: 18,
          maxWidth: 500,
          width: '100%',
          padding: 0,
          boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
          border: `1px solid ${colors.borderPrimary}`,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: success
            ? 'linear-gradient(90deg, #10B981 0%, #16A34A 100%)'
            : 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
        }} />
        <div style={{ padding: '1.5rem 1.5rem 1.4rem', position: 'relative' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isSending}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14,
              background: colors.bgTertiary,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: 9,
              cursor: isSending ? 'not-allowed' : 'pointer',
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.textSecondary,
              opacity: isSending ? 0.5 : 1,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { if (!isSending) { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: 12 }} />
          </button>

          {success ? (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '1rem 0 0.5rem' }}>
              <div style={{
                width: 60, height: 60, margin: '0 auto 1rem',
                borderRadius: 18,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 24px rgba(16,185,129,0.32)',
              }}>
                <i className="bi bi-check2" style={{ color: '#fff', fontSize: 26 }} />
              </div>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#10B981',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Email delivered</div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
                Invitation Sent!
              </h4>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                Email has been sent to <strong style={{ color: colors.textPrimary }}>{recipientEmail}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
                  boxShadow: '0 10px 24px rgba(8,58,133,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-envelope-paper-fill" style={{ fontSize: 24, color: '#fff' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
                <div style={{
                  fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Email invitation</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                  Send Album Invitation
                </h3>
              </div>

              {/* Album Details */}
              <div style={{
                background: actualTheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                  : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
                borderRadius: 12,
                padding: '0.9rem 1rem',
                marginBottom: '0.9rem',
              }}>
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{
                    fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 2,
                  }}>Album Title</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.005em' }}>{albumTitle}</div>
                </div>
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{
                    fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 2,
                  }}>Recipient Email</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.005em', wordBreak: 'break-all' }}>{recipientEmail}</div>
                </div>
                <div>
                  <div style={{
                    fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}>Access Code</div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {accessCode}
                  </div>
                </div>
              </div>

              {/* Information */}
              <div style={{
                background: actualTheme === 'dark' ? 'rgba(59,130,246,0.10)' : 'rgba(239,246,255,0.7)',
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(59,130,246,0.30)' : 'rgba(59,130,246,0.20)'}`,
                borderRadius: 11,
                padding: '0.85rem 0.95rem',
                marginBottom: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                  background: 'linear-gradient(180deg, #083A85 0%, #0a4da8 100%)',
                }} />
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700,
                  color: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 6,
                  paddingLeft: 6,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <i className="bi bi-envelope-fill" style={{ fontSize: 11 }} />
                  What will be sent
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.6rem',
                  fontSize: '0.82rem',
                  color: actualTheme === 'dark' ? '#BFDBFE' : '#1E40AF',
                  lineHeight: 1.55,
                }}>
                  <li>Welcome email with album access link</li>
                  <li>6-digit access code for verification</li>
                  <li>Instructions to view and download photos</li>
                  <li>60-day access period information</li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  fontSize: '0.85rem',
                  color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
                  margin: '0 0 0.95rem',
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  disabled={isSending}
                  style={{
                    padding: '0.7rem 1.2rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    background: colors.bgTertiary,
                    color: colors.textPrimary,
                    cursor: isSending ? 'not-allowed' : 'pointer',
                    opacity: isSending ? 0.5 : 1,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isSending) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  style={{
                    padding: '0.7rem 1.4rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    border: 'none',
                    borderRadius: 11,
                    background: isSending
                      ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                      : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: '#fff',
                    cursor: isSending ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    boxShadow: isSending ? 'none' : '0 8px 18px rgba(8,58,133,0.30)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isSending) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isSending ? 'none' : '0 8px 18px rgba(8,58,133,0.30)'; }}
                >
                  {isSending ? (
                    <>
                      <i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill" style={{ fontSize: 13 }} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
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
