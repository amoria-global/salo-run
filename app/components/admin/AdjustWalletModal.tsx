"use client";

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  adminAdjustWallet,
  type WalletCategory,
  type WalletDirection,
  type WalletMovementDTO,
} from '@/lib/walletApi';

export interface AdjustWalletModalProps {
  isOpen: boolean;
  walletId: string;
  onClose: () => void;
  onSuccess: (movement: WalletMovementDTO | null) => void;
}

const CATEGORY_OPTIONS: WalletCategory[] = [
  'BALANCE',
  'TIPS',
  'BONUSES',
  'GIFTS',
  'STREAM_FEES',
  'DONATIONS',
  'HELD',
  'PENDING',
  'BLOCKED',
  'WITHDRAWAL',
  'REFUND',
  'CLIENT_SPEND',
];

const AdjustWalletModal: React.FC<AdjustWalletModalProps> = ({
  isOpen,
  walletId,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [category, setCategory] = useState<WalletCategory>('BALANCE');
  const [direction, setDirection] = useState<WalletDirection>('CREDIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setCategory('BALANCE');
    setDirection('CREDIT');
    setAmount('');
    setReason('');
    setError(null);
  };

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const movement = await adminAdjustWallet(walletId, {
        category,
        direction,
        amount: parsed,
        reason: reason.trim(),
      });
      onSuccess(movement);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply adjustment.');
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
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
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
          Manual wallet adjustment
        </h3>
        <p style={{ fontSize: '0.8125rem', color: colors.textSecondary, marginBottom: '1rem' }}>
          Creates an audited ledger movement. Use for manual corrections, compensations, or
          refunds that do not map to an organic transaction.
        </p>

        {/* Category */}
        <FieldLabel colors={colors}>Category</FieldLabel>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as WalletCategory)}
          style={{
            width: '100%',
            padding: '0.5rem 0.625rem',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.borderPrimary}`,
            backgroundColor: colors.bgCard,
            color: colors.textPrimary,
            fontSize: '0.875rem',
            marginBottom: '1rem',
            outline: 'none',
          }}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c.replaceAll('_', ' ')}
            </option>
          ))}
        </select>

        {/* Direction */}
        <FieldLabel colors={colors}>Direction</FieldLabel>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['CREDIT', 'DEBIT'] as WalletDirection[]).map((d) => {
            const active = direction === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${active ? (d === 'CREDIT' ? '#166534' : '#991B1B') : colors.borderPrimary}`,
                  backgroundColor: active
                    ? d === 'CREDIT'
                      ? '#DCFCE7'
                      : '#FEE2E2'
                    : colors.bgCard,
                  color: active
                    ? d === 'CREDIT'
                      ? '#166534'
                      : '#991B1B'
                    : colors.textPrimary,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <FieldLabel colors={colors}>Amount (USD)</FieldLabel>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={{
            width: '100%',
            padding: '0.5rem 0.625rem',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.borderPrimary}`,
            backgroundColor: colors.bgCard,
            color: colors.textPrimary,
            fontSize: '0.875rem',
            marginBottom: '1rem',
            outline: 'none',
          }}
        />

        {/* Reason */}
        <FieldLabel colors={colors}>Reason</FieldLabel>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Compensation for lost event media"
          style={{
            width: '100%',
            padding: '0.5rem 0.625rem',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.borderPrimary}`,
            backgroundColor: colors.bgCard,
            color: colors.textPrimary,
            fontSize: '0.875rem',
            resize: 'vertical',
            outline: 'none',
            marginBottom: '1rem',
          }}
        />

        {error && (
          <div
            style={{
              padding: '0.625rem',
              borderRadius: '0.5rem',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
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
              backgroundColor: '#083A85',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Applying…' : 'Apply adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};

function FieldLabel({
  colors,
  children,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  children: React.ReactNode;
}) {
  return (
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
      {children}
    </label>
  );
}

export default AdjustWalletModal;
