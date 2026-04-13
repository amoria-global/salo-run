'use client';

import { useEffect, useState } from 'react';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

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

export default function PersistentPaymentBanner() {
  const [pending, setPending] = useState<PendingDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  async function fetchPendingPayments() {
    try {
      const res = await dashboardAuthFetch(`${getApiUrl()}/api/remote/payments/pending-declarations`);
      const data = await res.json();
      if (data.action === 1) {
        setPending(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending payments:', err);
    } finally {
      setLoading(false);
    }
  }

  const visiblePayments = pending.filter(p => !dismissed.has(p.id));

  if (loading || visiblePayments.length === 0) return null;

  const firstPayment = visiblePayments[0];
  const remainingCount = visiblePayments.length - 1;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: firstPayment.isOverdue ? '#dc2626' : '#f59e0b',
      color: 'white',
      padding: '1rem',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <strong>⚠️ Payment Required</strong>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
          {firstPayment.eventName} — {firstPayment.currency} {firstPayment.amount.toLocaleString()}
          {firstPayment.isOverdue && ' (OVERDUE)'}
          {remainingCount > 0 && ` +${remainingCount} more`}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => window.location.href = '/client/payments'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: firstPayment.isOverdue ? '#dc2626' : '#f59e0b',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
          Pay Now
        </button>
        <button
          onClick={() => setDismissed(prev => new Set([...prev, firstPayment.id]))}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
          ✕
        </button>
      </div>
    </div>
  );
}
