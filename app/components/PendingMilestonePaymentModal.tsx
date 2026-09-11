"use client";

import { useEffect, useRef, useState } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { initiateBookingPayment, pollPaymentStatus, sanitizeErrorMessage } from '@/lib/xentripay';
import { usePaymentCountry } from '@/lib/payments/usePaymentCountry';
import { PaymentMethodPicker, type PaymentMethodSelection } from './payments/PaymentMethodPicker';
import InternationalPhoneInput, { type PhoneValue } from './phone/InternationalPhoneInput';
import type { PaymentOperator } from '@/lib/payments/types';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
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

type Step =
  | 'overview'    // shows payment summary + Pay Now CTA
  | 'method'      // pick MTN / Airtel / Card
  | 'phone'       // collect MoMo phone number
  | 'processing'  // poll XentriPay until SUCCESS / FAILED
  | 'success'
  | 'failed';


/**
 * Dashboard "Payment required" alert. Embeds the full XentriPay payment
 * flow inline — clicking Pay Now opens the method selector, phone input,
 * and processing/success screens right here. Previous behaviour
 * (window.location.href = '/user/client/payments') did nothing visible
 * when the user was already on that page.
 */
export default function PendingMilestonePaymentModal({ isOpen, onClose }: PendingMilestonePaymentModalProps) {
  const { currencyId } = useCurrency();
  const { actualTheme } = useTheme();
  const [pendingPayments, setPendingPayments] = useState<PendingDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('overview');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<PaymentOperator | null>(null);
  // IP-detected (overridable) payment country drives both the operator
  // list shown and the backend gateway routing (PawaPay primary,
  // XentriPay backup for RW).
  const { country: payCountry, setCountry: setPayCountry } = usePaymentCountry();
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const stopPollingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset on close so the next open starts at the overview step.
      setStep('overview');
      setPhone(null);
      setError('');
      setSubmitting(false);
      if (stopPollingRef.current) { stopPollingRef.current(); stopPollingRef.current = null; }
      return;
    }
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

  useEffect(() => () => {
    // Belt-and-suspenders: cancel any in-flight polling if the
    // component unmounts mid-flow.
    if (stopPollingRef.current) stopPollingRef.current();
  }, []);

  // EVERY hook call must live above this early-return. The earlier
  // version had a third useEffect below this guard — first render
  // (loading=true) returned null and skipped it; second render
  // (loading=false) ran it, changing the hook count and tripping
  // React error #310. Because PendingMilestonePaymentModal is mounted
  // by app/user/client/layout.tsx, that crash took down the entire
  // client tree and rendered Chrome's "page couldn't load" on every
  // /user/client/* route. Photographer/coordinator layouts don't mount
  // this modal, so they were unaffected.
  if (!isOpen || loading || pendingPayments.length === 0) return null;

  const firstPayment = pendingPayments[0];
  const remainingCount = pendingPayments.length - 1;
  const isOverdue = firstPayment.isOverdue;

  const handleInitiatePayment = async () => {
    setError('');
    if (!selectedMethod) { setError('Please select a payment method.'); return; }
    if (selectedMethod !== 'card' && !phone?.isValid) {
      setError('Please enter a valid phone number for the selected country.');
      return;
    }
    setSubmitting(true);
    setStep('processing');
    try {
      const telecom = selectedMethod === 'card' ? '' : (selectedOperator?.id ?? selectedMethod.toUpperCase());
      const methodType = selectedMethod === 'card' ? 'CARD' : 'MOBILE_MONEY';
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      const redirectUrl = selectedMethod === 'card'
        ? (currentUrl.startsWith('http://') ? 'https://connekyt.com/user/client/payments' : currentUrl)
        : undefined;

      const result = await initiateBookingPayment(
        firstPayment.id,
        phone?.digits ?? '',
        telecom,
        methodType,
        redirectUrl,
        undefined,
        currencyId,
        undefined,
        payCountry ?? undefined
      );

      if (!result.success || !result.data) {
        setError(result.error || 'Payment could not be initiated. Please check your payment details and try again.');
        setStep('failed');
        setSubmitting(false);
        return;
      }

      if (selectedMethod === 'card' && result.data.paymentUrl) {
        window.open(result.data.paymentUrl, '_blank');
      }

      stopPollingRef.current = pollPaymentStatus(result.data.refid, {
        onSuccess: () => { setStep('success'); setSubmitting(false); },
        onFailure: () => {
          setStep('failed');
          setError('Payment was not completed. If you were charged, the amount will be refunded automatically.');
          setSubmitting(false);
        },
        onError: (e) => {
          setStep('failed');
          setError(sanitizeErrorMessage(e, 'Unable to check payment status. Please try again.'));
          setSubmitting(false);
        },
      });
    } catch (e) {
      setError(sanitizeErrorMessage(e instanceof Error ? e.message : '', 'Something went wrong while processing your payment.'));
      setStep('failed');
      setSubmitting(false);
    }
  };

  // ─── Step renderers ────────────────────────────────────────────────────
  const renderOverview = () => (
    <>
      <div style={{
        width: 56, height: 56, borderRadius: 9999,
        background: isOverdue ? '#FEE2E2' : '#FEF3C7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '4px auto 14px',
      }}>
        <i className={`bi ${isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-clock-history'}`}
          style={{ fontSize: 24, color: isOverdue ? '#DC2626' : '#F59E0B' }} />
      </div>

      <div style={{
        background: 'var(--ck-surface-soft)',
        border: '1px solid var(--ck-stroke)',
        borderRadius: 12, padding: 16,
      }}>
        <Row label="Event" value={firstPayment.eventName} />
        <Row label="Amount due" value={`${firstPayment.currency} ${firstPayment.amount.toLocaleString()}`}
          valueStyle={{ color: isOverdue ? '#DC2626' : '#F59E0B', fontSize: '1.05rem', fontWeight: 800 }} />
        <Row label="Milestone"
          value={`${firstPayment.milestoneSequence === 1 ? 'First payment' : 'Second payment'} (${firstPayment.escrowPercentage}%)`}
          last />
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
    </>
  );

  const renderMethodPicker = () => (
    <div>
      <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: 'var(--ck-text-soft)' }}>
        Choose how you want to pay <strong>{firstPayment.currency} {firstPayment.amount.toLocaleString()}</strong>:
      </p>
      <PaymentMethodPicker
        country={payCountry}
        onCountryChange={(iso2) => { setPayCountry(iso2); setSelectedMethod(''); setSelectedOperator(null); }}
        selectedMethodId={selectedMethod || null}
        onSelect={(sel: PaymentMethodSelection) => { setSelectedMethod(sel.methodId); setSelectedOperator(sel.operator); setError(''); }}
        allowCard
        disabled={submitting}
      />
    </div>
  );

  const renderPhoneInput = () => (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ck-text-soft)', marginBottom: 6 }}>
        {selectedOperator?.name ?? 'Mobile money'} phone number
      </label>
      <InternationalPhoneInput
        defaultIso2={payCountry}
        dark={actualTheme === 'dark'}
        ariaLabel={`${selectedOperator?.name ?? 'Mobile money'} phone number`}
        onChange={(value) => { setPhone(value); setError(''); }}
      />
      {error && (
        <p style={{ marginTop: 8, marginBottom: 0, fontSize: '0.8rem', color: '#DC2626' }}>{error}</p>
      )}
    </div>
  );

  const renderProcessing = () => (
    <div style={{ textAlign: 'center', padding: '14px 0' }}>
      <div style={{
        width: 56, height: 56, margin: '0 auto 14px',
        border: '4px solid rgba(8, 58, 133, 0.2)', borderTopColor: '#083A85',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: 'var(--ck-text)' }}>
        {selectedMethod === 'card' ? 'Complete payment in the new tab' : 'Check your phone'}
      </p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ck-text-soft)' }}>
        {selectedMethod === 'card'
          ? 'Waiting for the card gateway to confirm — this stays open until done.'
          : 'A USSD prompt has been sent. Approve it to complete the payment.'}
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '14px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 9999, background: '#DCFCE7',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
      }}>
        <i className="bi bi-check2" style={{ fontSize: 28, color: '#15803D' }} />
      </div>
      <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--ck-text)' }}>
        Payment received
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ck-text-soft)' }}>
        Thanks. Your milestone for &quot;{firstPayment.eventName}&quot; is settled.
      </p>
    </div>
  );

  const renderFailed = () => (
    <div style={{ textAlign: 'center', padding: '14px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 9999, background: '#FEE2E2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
      }}>
        <i className="bi bi-x-octagon-fill" style={{ fontSize: 28, color: '#DC2626' }} />
      </div>
      <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--ck-text)' }}>
        Payment didn&apos;t go through
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ck-text-soft)' }}>{error || 'Please try again.'}</p>
    </div>
  );

  // ─── Footer renderers (per step) ───────────────────────────────────────
  const renderFooter = () => {
    if (step === 'overview') {
      return (
        <>
          <Button variant="ghost" onClick={onClose}>Later</Button>
          <Button
            variant={isOverdue ? 'danger' : 'primary'}
            onClick={() => setStep('method')}
            iconLeft={<i className="bi bi-credit-card" />}
          >Pay now</Button>
        </>
      );
    }
    if (step === 'method') {
      return (
        <>
          <Button variant="ghost" onClick={() => setStep('overview')}>Back</Button>
          <Button
            variant="primary"
            onClick={() => {
              // Card has no phone step — fire initiate immediately and let
              // it transition to 'processing' itself. Inlining avoids a
              // useEffect-on-step that previously sat below the early-
              // return and tripped React error #310.
              if (selectedMethod === 'card') {
                handleInitiatePayment();
              } else {
                setStep('phone');
              }
            }}
          >Continue</Button>
        </>
      );
    }
    if (step === 'phone') {
      return (
        <>
          <Button variant="ghost" onClick={() => setStep('method')}>Back</Button>
          <Button variant="primary" disabled={submitting} onClick={handleInitiatePayment}>
            {submitting ? 'Sending…' : 'Pay now'}
          </Button>
        </>
      );
    }
    if (step === 'success') {
      return <Button variant="primary" onClick={() => { onClose(); if (typeof window !== 'undefined') window.location.reload(); }}>Done</Button>;
    }
    if (step === 'failed') {
      return (
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => { setStep('method'); setError(''); }}>Try again</Button>
        </>
      );
    }
    // processing - no footer buttons (would interrupt)
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        step === 'overview' ? (isOverdue ? 'Payment overdue' : 'Payment required')
        : step === 'method' ? 'Choose payment method'
        : step === 'phone' ? 'Enter phone number'
        : step === 'processing' ? 'Processing payment'
        : step === 'success' ? 'All set'
        : 'Payment failed'
      }
      description={
        step === 'overview'
          ? (isOverdue ? 'Your milestone payment is past due.' : 'A scheduled milestone payment is pending.')
          : undefined
      }
      footer={renderFooter()}
    >
      {step === 'overview' && renderOverview()}
      {step === 'method' && renderMethodPicker()}
      {step === 'phone' && renderPhoneInput()}
      {step === 'processing' && renderProcessing()}
      {step === 'success' && renderSuccess()}
      {step === 'failed' && renderFailed()}
    </Modal>
  );
}

const Row = ({ label, value, valueStyle, last }: { label: string; value: React.ReactNode; valueStyle?: React.CSSProperties; last?: boolean; }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    paddingBottom: last ? 0 : 10, marginBottom: last ? 0 : 10,
    borderBottom: last ? 'none' : '1px solid var(--ck-stroke-soft)',
  }}>
    <span style={{ fontSize: '0.82rem', color: 'var(--ck-text-soft)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ck-text)', textAlign: 'right', ...valueStyle }}>{value}</span>
  </div>
);

