"use client";

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { adminSuspendWallet, type WalletDTO } from '@/lib/walletApi';

export interface SuspendWalletModalProps {
  isOpen: boolean;
  walletId: string;
  onClose: () => void;
  onSuccess: (wallet: WalletDTO) => void;
}

const SuspendWalletModal: React.FC<SuspendWalletModalProps> = ({
  isOpen,
  walletId,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await adminSuspendWallet(walletId, reason.trim());
      onSuccess(updated);
      setReason('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to suspend wallet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: colors.textPrimary,
            margin: 0,
            marginBottom: '0.5rem',
          }}
        >
          Suspend wallet
        </h3>
        <p style={{ fontSize: '0.8125rem', color: colors.textSecondary, marginBottom: '1rem' }}>
          This freezes all ledger writes against this wallet. The owner will see a suspension badge
          and all credit/debit operations will be rejected by the server.
        </p>

        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.375rem',
          }}
        >
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Fraud investigation pending"
          style={{
            width: '100%',
            padding: '0.625rem',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.borderPrimary}`,
            backgroundColor: colors.bgCard,
            color: colors.textPrimary,
            fontSize: '0.875rem',
            resize: 'vertical',
            outline: 'none',
          }}
        />

        {error && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.625rem',
              borderRadius: '0.5rem',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontSize: '0.8125rem',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: `1px solid ${colors.borderPrimary}`,
              backgroundColor: colors.bgCard,
              color: colors.textPrimary,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#991B1B',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Suspending…' : 'Suspend wallet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendWalletModal;
