'use client';

/**
 * Payment detail (client and coordinator) in Compact Glass. Behaviour is the classic page's (usePaymentDetail, moved
 * verbatim): the same fetch, Pay now through PayNowModal with a refetch on success, the same text receipt, Back.
 *
 * Header with the event, type and status; the amount card (total in USD with the booking-currency figure beside it,
 * progress, paid, remaining, currency); escrow and milestone for bookings, with the 70/30 split bar when it applies;
 * the timeline; then the photographer and a details list. Loading, not-found and error states have their own layout.
 */
import { ArrowLeft, CalendarClock, CheckCircle2, Download, Lock, Unlock } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import PayNowModal from '@/app/components/UnlockModal';
import { normalizeImageUrl } from '@/lib/api';
import { Avatar, Card, Chip, ErrorState, RowsSkeleton, type Tone } from '../ui';
import {
  formatDateShort, formatDateTime, getEscrowStatusLabel, getStatusLabel, type PaymentDetailController,
} from '@/app/components/payments/usePaymentDetail';

const statusTone = (s: string): Tone => {
  switch (s?.toUpperCase()) {
    case 'COMPLETED': case 'PAID': return 'success';
    case 'PENDING': return 'pending';
    case 'PARTIAL': return 'info';
    case 'FAILED': return 'error';
    default: return 'neutral';
  }
};
const escrowTone = (s: string): Tone => (s?.toUpperCase() === 'RELEASED' ? 'success' : s?.toUpperCase() === 'PENDING_HOLD' ? 'pending' : 'info');
const humanType = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, ' ') : '');

function Kv({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useLanguage();
  return <div className="gpd-kv"><span>{t(label)}</span><strong>{children}</strong></div>;
}

export default function GlassPaymentDetail({ ctl: c }: { ctl: PaymentDetailController }) {
  const { t } = useLanguage();
  const back = (
    <button type="button" className="g-btn g-btn-ghost gpd-back" onClick={c.handleGoBack}><ArrowLeft size={16} aria-hidden /> {t('Back to Payments')}</button>
  );
  if (c.loading) {
    return <div className="g-page gpd-page" aria-busy="true">{back}<Card className="gpd-card"><RowsSkeleton rows={4} height={64} /></Card></div>;
  }
  const p = c.payment;
  if (c.error || !p) {
    return (
      <div className="g-page gpd-page">
        {back}
        <Card className="gpd-card">
          <ErrorState message={`${t(c.error || 'Payment not found')}. ${t('The payment you are looking for may have been removed or does not exist.')}`} onRetry={c.error ? () => { void c.fetchPayment(); } : undefined} />
        </Card>
      </div>
    );
  }
  const status = getStatusLabel(p.status);
  const progress = Math.max(0, Math.min(100, Number(c.paymentProgress) || 0));
  const held = p.escrowStatus?.toUpperCase() === 'HELD';
  const overdue = !c.isPaid && p.dueDate ? new Date(p.dueDate) < new Date() : false;
  return (
    <div className={`g-page gpd-page${c.shouldHighlight ? ' is-highlighted' : ''}`}>
      {back}
      <header className="gpd-head">
        <div>
          <h1>{p.eventTitle}</h1>
          <div className="gpd-chips">
            <Chip tone="neutral">{t(humanType(p.paymentType))}</Chip>
            <Chip tone={statusTone(p.status)}>{t(status)}</Chip>
          </div>
        </div>
        <div className="gpd-actions">
          {c.canPay ? (
            <button type="button" className="g-btn g-btn-primary" onClick={c.handlePayNow}>
              {t('Pay now')}{c.remainingBalance > 0 ? ` (${c.formatPrice(c.remainingBalance)})` : ''}
            </button>
          ) : null}
          <button type="button" className="g-btn" onClick={c.handleDownloadReceipt}><Download size={16} aria-hidden /> {t('Download receipt')}</button>
        </div>
      </header>

      <div className="gpd-grid">
        <div className="gpd-main">
          <Card className="gpd-card">
            <h2>{t('Payment amount')}</h2>
            <div className="gpd-total">
              <span>{t('Total amount')}</span>
              <strong className="g-num">{c.formatPrice(p.amountInUsd)}</strong>
              {p.currencyAbbreviation && p.currencyAbbreviation !== 'USD' ? <small className="g-num">{c.formatPrice(p.amount, p.currencyAbbreviation)}</small> : null}
            </div>
            <div className="gpd-progress">
              <span className="gpd-progress-label"><span>{t('Payment progress')}</span><span className="g-num">{progress.toFixed(0)}%</span></span>
              <span className="gpd-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={t('Payment progress')}>
                <span style={{ width: `${progress}%` }} />
              </span>
            </div>
            <div className="gpd-kvs">
              <Kv label="Paid"><span className="g-num">{c.formatPrice(p.paidAmountInUsd)}</span></Kv>
              <Kv label="Remaining"><span className="g-num">{c.formatPrice(Math.max(c.remainingBalance, 0))}</span></Kv>
              <Kv label="Currency">{p.currencyAbbreviation}</Kv>
            </div>
          </Card>

          {c.isBooking && p.escrowPercentage ? (
            <Card className="gpd-card">
              <h2>{t('Escrow and milestone')}</h2>
              <div className="gpd-kvs">
                <Kv label="Escrow percentage">{p.escrowPercentage}%</Kv>
                <Kv label="Escrow status">
                  <Chip tone={escrowTone(p.escrowStatus || '')}>{held ? <Lock size={12} aria-hidden /> : <Unlock size={12} aria-hidden />} {t(getEscrowStatusLabel(p.escrowStatus || ''))}</Chip>
                </Kv>
                <Kv label="Held amount"><span className="g-num">{c.formatPrice(p.heldAmountInUsd)}</span></Kv>
                <Kv label="Released amount"><span className="g-num">{c.formatPrice(p.releasedAmountInUsd)}</span></Kv>
              </div>
              {c.has7030Split ? (
                <div className="gpd-split">
                  <span className="gpd-split-bar" aria-hidden>
                    <span className="is-a" style={{ width: `${c.withdrawablePercent}%` }} />
                    <span className="is-b" style={{ width: `${c.deliveryHeldPercent}%` }} />
                  </span>
                  <span className="gpd-split-legend">
                    <span><i className="is-a" aria-hidden /> {t('Withdrawable')} <strong className="g-num">{c.formatPrice(p.withdrawableAmountInUsd)}</strong> ({c.withdrawablePercent.toFixed(0)}%)</span>
                    <span><i className="is-b" aria-hidden /> {t('Held for delivery')} <strong className="g-num">{c.formatPrice(p.deliveryHeldAmountInUsd)}</strong> ({c.deliveryHeldPercent.toFixed(0)}%)</span>
                  </span>
                  <small>{t(p.deliveryHeldReleased ? 'Delivery-held funds have been released' : 'Delivery-held funds are pending release')}</small>
                </div>
              ) : null}
              {p.eventCompletionStatus ? (
                <p className="gpd-muted">{t('Event')}: {t(p.eventCompletionStatus === 'COMPLETED' ? 'Completed' : humanType(p.eventCompletionStatus))}</p>
              ) : null}
            </Card>
          ) : null}

          <Card className="gpd-card">
            <h2>{t('Payment timeline')}</h2>
            <ol className="gpd-timeline">
              <li><CalendarClock size={16} aria-hidden /><span><strong>{t('Created')}</strong><small>{formatDateTime(p.createdAt)}</small></span></li>
              {p.dueDate ? (
                <li className={c.isPaid ? 'is-done' : overdue ? 'is-late' : 'is-wait'}>
                  <CalendarClock size={16} aria-hidden /><span><strong>{t('Due date')}</strong><small>{formatDateShort(p.dueDate)}{overdue ? ` · ${t('Overdue')}` : ''}</small></span>
                </li>
              ) : null}
              {c.isPaid ? (
                <li className="is-done"><CheckCircle2 size={16} aria-hidden /><span><strong>{t('Payment completed')}</strong><small>{formatDateTime(p.createdAt)}</small></span></li>
              ) : null}
            </ol>
          </Card>
        </div>

        <aside className="gpd-side">
          <Card className="gpd-card">
            <h2>{t('Photographer')}</h2>
            <div className="gpd-person">
              <Avatar name={p.photographerName || '?'} src={normalizeImageUrl(p.photographerImage) || null} size={48} />
              <span><strong>{p.photographerName}</strong><small>{t('Photographer')}</small></span>
            </div>
          </Card>
          <Card className="gpd-card">
            <h2>{t('Details')}</h2>
            <div className="gpd-kvs is-list">
              <Kv label="Event">{p.eventTitle}</Kv>
              <Kv label="Payment type">{t(humanType(p.paymentType))}</Kv>
              <Kv label="Status"><Chip tone={statusTone(p.status)}>{t(status)}</Chip></Kv>
              <Kv label="Created">{formatDateShort(p.createdAt)}</Kv>
              {p.dueDate ? <Kv label="Due date">{formatDateShort(p.dueDate)}</Kv> : null}
              {c.isBooking && p.escrowPercentage ? <Kv label="Escrow">{p.escrowPercentage}% · {t(getEscrowStatusLabel(p.escrowStatus || ''))}</Kv> : null}
              <Kv label="Invoice"><span className="gpd-mono">INV-{String(p.id).substring(0, 8).toUpperCase()}</span></Kv>
            </div>
          </Card>
        </aside>
      </div>

      <PayNowModal
        isOpen={c.showPayNowModal}
        onClose={() => c.setShowPayNowModal(false)}
        payment={c.payNowPayment}
        onPaymentSuccess={() => { c.setShowPayNowModal(false); c.fetchPayment(); }}
      />
    </div>
  );
}
