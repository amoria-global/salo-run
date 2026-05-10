"use client";

import { useEffect, useState } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface PendingDeclaration {
  id: string;
  eventName: string;
  amount: number;
  currency: string;
  dueDate: string;
  escrowPercentage: number;
  milestoneSequence: number;
  isOverdue: boolean;
}

interface PendingMilestonePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingMilestonePaymentModal({ isOpen, onClose }: PendingMilestonePaymentModalProps) {
  const [pendingPayments, setPendingPayments] = useState<PendingDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/payments/pending-declarations`);
        const data = await res.json();
        if (data.action === 1) setPendingPayments(data.data || []);
      } catch (err) {
        console.error('Failed to fetch pending payments:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen || loading || pendingPayments.length === 0) return null;

  const firstPayment = pendingPayments[0];
  const remainingCount = pendingPayments.length - 1;
  const isOverdue = firstPayment.isOverdue;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={isOverdue ? 'Payment overdue' : 'Payment required'}
      description={isOverdue ? 'Your milestone payment is past due.' : 'A scheduled milestone payment is pending.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Later</Button>
          <Button
            variant={isOverdue ? 'danger' : 'primary'}
            onClick={() => { window.location.href = '/user/client/payments'; }}
            iconLeft={<i className="bi bi-credit-card" />}
          >
            Pay now
          </Button>
        </>
      }
    >
      <div style={{
        width: 56, height: 56, borderRadius: 9999,
        background: isOverdue ? '#FEE2E2' : '#FEF3C7',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        margin: '4px auto 14px',
      }}>
        <i
          className={`bi ${isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-clock-history'}`}
          style={{ fontSize: 24, color: isOverdue ? '#DC2626' : '#F59E0B' }}
        />
      </div>

      <div style={{
        background: 'var(--ck-surface-soft)',
        border: '1px solid var(--ck-stroke)',
        borderRadius: 12,
        padding: 16,
      }}>
        <Row label="Event" value={firstPayment.eventName} />
        <Row
          label="Amount due"
          value={`${firstPayment.currency} ${firstPayment.amount.toLocaleString()}`}
          valueStyle={{ color: isOverdue ? '#DC2626' : '#F59E0B', fontSize: '1.05rem', fontWeight: 800 }}
        />
        <Row
          label="Milestone"
          value={`${firstPayment.milestoneSequence === 1 ? 'First payment' : 'Second payment'} (${firstPayment.escrowPercentage}%)`}
          last
        />
      </div>

      {remainingCount > 0 && (
        <p style={{
          marginTop: 14, marginBottom: 0,
          fontSize: '0.85rem', color: 'var(--ck-text-soft)',
          textAlign: 'center', fontStyle: 'italic',
        }}>
          + {remainingCount} more pending payment{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </Modal>
  );
}

const Row = ({ label, value, valueStyle, last }: { label: string; value: React.ReactNode; valueStyle?: React.CSSProperties; last?: boolean; }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: last ? 0 : 10,
    marginBottom: last ? 0 : 10,
    borderBottom: last ? 'none' : '1px solid var(--ck-stroke-soft)',
  }}>
    <span style={{ fontSize: '0.82rem', color: 'var(--ck-text-soft)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ck-text)', textAlign: 'right', ...valueStyle }}>{value}</span>
  </div>
);
