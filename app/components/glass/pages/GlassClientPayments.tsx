'use client';

/**
 * Client Payments in Compact Glass. Behaviour is the classic page's (useClientPayments, moved verbatim); every dialog
 * (report, payment details, pay now, gift senders, withdrawal set-up, withdraw) is the classic PaymentsPageModals,
 * passed in as `modals`. The spending chart is the classic SpendingChart, passed in as `chart`.
 *
 * Header with View report, the pending-payments notice, four summary cards, the spending trend with its period and
 * chart-type switches, ConnektLive gifts with Withdraw or Set up withdrawal, then the payment history as rows with the
 * same actions as the classic table: Pay now, Release funds once the event is completed, Retry after a failure,
 * the receipt once paid, and View.
 */
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Eye, FileText, Gift, Receipt } from 'lucide-react';
import type React from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { plural } from '../format';
import { Avatar, Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton, Segmented, type Tone } from '../ui';
import type { ClientPaymentsController, PaymentStatus } from '@/app/components/payments/useClientPayments';

const STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'pending' },
  failed: { label: 'Failed', tone: 'error' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  partially_paid: { label: 'Partially paid', tone: 'info' },
};
const PERIODS = ['1W', '1M', '3M', '6M', '1Y'] as const;

function Stat({ label, value }: { label: string; value: ReactNode }) {
  const { t } = useLanguage();
  return <Card className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{value}</strong></Card>;
}

export interface RowPayment { id: number; date: string; eventName: string; eventType: string; photographerName: string; photographerImage?: string; amountNum: number; status: PaymentStatus; invoiceNumber: string; escrowStatus?: string; escrowPercentage?: number; eventCompletionStatus?: string }

/** One payment-history row. escrow: the client page's Release funds / Awaiting completion rules; the coordinator page has none. */
export function PaymentRow({ p, formatPrice, onPay, onReceipt, onView, escrow, highlighted = false, rowRef }: {
  p: RowPayment; formatPrice: (n: number) => string; onPay: () => void; onReceipt: () => void; onView: () => void;
  escrow: boolean; highlighted?: boolean; rowRef?: React.Ref<HTMLLIElement>;
}) {
  const { t } = useLanguage();
  const st = STATUS[p.status] ?? STATUS.pending;
  const held = escrow && p.escrowStatus === 'HELD';
  const completed = p.eventCompletionStatus === 'COMPLETED';
  return (
    <li ref={highlighted ? rowRef : undefined} className={`gpay-row${highlighted ? ' is-highlighted' : ''}`}>
      <span className="gpay-date">{p.date}</span>
      <span className="gpay-who">
        <Avatar name={p.photographerName} src={p.photographerImage} size={36} />
        <span className="gpay-who-text">
          <strong>{p.eventName}</strong>
          <small>{p.photographerName} · {t(p.eventType)}</small>
        </span>
      </span>
      <strong className="g-num gpay-amount">{formatPrice(p.amountNum)}</strong>
      <span className="gpay-status">
        <Chip tone={st.tone}>{t(st.label)}</Chip>
        {held ? <Chip tone="pending">{p.escrowPercentage}% {t('held')}</Chip> : null}
        {escrow && p.escrowStatus === 'RELEASED' ? <Chip tone="success">{t('Released')}</Chip> : null}
      </span>
      <span className="gpay-invoice">{p.invoiceNumber}</span>
      <span className="gpay-actions">
        {(p.status === 'pending' || p.status === 'partially_paid') && !held ? (
          <button type="button" className="g-btn g-btn-primary" onClick={onPay}>{t('Pay now')}</button>
        ) : null}
        {held && completed ? <button type="button" className="g-btn g-btn-primary" onClick={onPay}>{t('Release funds')}</button> : null}
        {held && !completed ? <span className="gpay-wait">{t('Awaiting completion')}</span> : null}
        {p.status === 'failed' ? <button type="button" className="g-btn" onClick={onPay}>{t('Retry')}</button> : null}
        {p.status === 'paid' ? (
          <button type="button" className="g-btn g-btn-ghost gpay-icon" onClick={onReceipt} aria-label={`${t('Download receipt')} ${p.invoiceNumber}`} title={t('Download receipt')}>
            <Download size={16} aria-hidden />
          </button>
        ) : null}
        <button type="button" className="g-btn g-btn-ghost gpay-icon" onClick={onView} aria-label={`${t('View details')} ${p.invoiceNumber}`} title={t('View details')}>
          <Eye size={16} aria-hidden />
        </button>
      </span>
    </li>
  );
}

export default function GlassClientPayments({ ctl: c, modals, chart }: { ctl: ClientPaymentsController; modals: ReactNode; chart: ReactNode }) {
  const { t } = useLanguage();
  const pages = Array.from({ length: Math.min(c.totalPages, 5) }, (_, i) => i + 1);
  const shown = Math.max(0, Math.min(c.resultsPerPage, c.totalResults - (c.currentPage - 1) * c.resultsPerPage));
  return (
    <div className="g-page gpay-page">
      <PageHeader
        title={t('Payments')}
        subtitle={t('Manage your payments and view transaction history')}
        action={<button type="button" className="g-btn" onClick={() => c.setShowReportModal(true)}><FileText size={16} aria-hidden /> {t('View report')}</button>}
      />

      {c.totalPending > 0 ? (
        <Card className="gpay-notice" role="status">
          <AlertTriangle size={18} aria-hidden />
          <span>
            <strong>{t('You have')} {c.formatPrice(c.totalPending)} {t('in pending payments')}</strong>
            <small>{t('Please complete your outstanding payments to avoid booking cancellations.')}</small>
          </span>
        </Card>
      ) : null}

      <div className="gc-sums">
        <Stat label="Total spending" value={c.formatPrice(c.totalPaid + c.totalPending + c.totalFailed)} />
        <Stat label="Paid" value={c.formatPrice(c.totalPaid)} />
        <Stat label="Pending" value={c.formatPrice(c.totalPending)} />
        <Stat label="Failed" value={c.formatPrice(c.totalFailed)} />
      </div>

      <div className="gpay-grid">
        <Card className="gpay-card">
          <header className="gpay-card-head">
            <h2>{t('Spending trend')}</h2>
            <Segmented label={t('Chart type')} value={c.chartType} onChange={c.setChartType}
              options={[{ key: 'line', label: 'Line' }, { key: 'bar', label: 'Bar' }, { key: 'scatter', label: 'Scatter' }]} />
          </header>
          <Segmented label={t('Period')} value={c.activeTimeFilter} onChange={c.setActiveTimeFilter}
            options={PERIODS.map((k) => ({ key: k, label: k }))} />
          <div className="gpay-chart">{chart}</div>
        </Card>

        <Card className="gpay-card">
          <header className="gpay-card-head">
            <span>
              <h2><Gift size={18} aria-hidden /> {t('Gifts received')}</h2>
              <small>{t('From live-stream viewers on ConnektLive')}</small>
            </span>
            {c.hasWithdrawalMethod ? (
              <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowWithdrawModal(true)}>{t('Withdraw')}</button>
            ) : (
              <button type="button" className="g-btn" onClick={() => c.setShowGiftsPaymentMethodModal(true)}>{t('Set up withdrawal')}</button>
            )}
          </header>
          <p className="gpay-gift-total"><span>{t('Total gifts')}</span><strong className="g-num">{c.formatPrice(c.totalGifts)}</strong></p>
          {c.giftStreams.length === 0 ? (
            <p className="gpay-muted">{t('No gifts yet. Gifts from your live streams show here.')}</p>
          ) : (
            <ul className="gpay-gifts">
              {c.giftStreams.map((s) => {
                const total = s.gifters.reduce((sum, g) => sum + g.amount, 0);
                return (
                  <li key={s.id}>
                    <span className="gpay-who-text">
                      <strong>{s.streamTitle}</strong>
                      <small>{s.date} · {plural(s.gifters.length, 'gifter', 'gifters', t)}</small>
                    </span>
                    <strong className="g-num">{c.formatPrice(total)}</strong>
                    <button type="button" className="g-btn g-btn-ghost" onClick={() => c.handleViewGiftSenders(s)}>{t('View senders')}</button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="gpay-card">
        <header className="gpay-card-head"><h2><Receipt size={18} aria-hidden /> {t('Payment history')}</h2></header>
        {!c.paymentsLoaded ? (
          <RowsSkeleton rows={5} />
        ) : c.paymentsError && c.payments.length === 0 ? (
          <ErrorState message={t('We could not load your payments.')} onRetry={c.retryPayments} />
        ) : c.payments.length === 0 ? (
          <EmptyState icon={<Receipt size={28} aria-hidden />} title={t('No payments yet')} body={t('Payments for your bookings and purchases show here.')} />
        ) : (
          <>
            <div className="gpay-head" aria-hidden>
              <span>{t('Date')}</span><span>{t('Event / Photographer')}</span><span>{t('Amount')}</span><span>{t('Status')}</span><span>{t('Invoice')}</span><span />
            </div>
            <ul className="gpay-rows">{c.payments.map((p) => (
              <PaymentRow key={p.id} p={p} escrow formatPrice={c.formatPrice} onPay={() => c.handlePayNow(p)} onReceipt={() => c.handleDownloadReceipt(p)} onView={() => c.handleViewPayment(p)}
                highlighted={c.highlightId != null && String(p.declarationId) === c.highlightId} rowRef={c.highlightRowRef as unknown as React.Ref<HTMLLIElement>} />
            ))}</ul>
            <nav className="gpay-pager" aria-label={t('Payment pages')}>
              <span>{t('Showing')} {shown} {t('of')} {plural(c.totalResults, 'result', 'results', t)}</span>
              <span className="gpay-pager-btns">
                <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={t('Previous page')} disabled={c.currentPage === 1} onClick={() => c.setCurrentPage(Math.max(1, c.currentPage - 1))}><ChevronLeft size={16} aria-hidden /></button>
                {pages.map((n) => (
                  <button key={n} type="button" className={`g-btn gpay-page-btn${c.currentPage === n ? ' is-on' : ''}`} aria-current={c.currentPage === n ? 'page' : undefined} onClick={() => c.setCurrentPage(n)}>{n}</button>
                ))}
                {c.totalPages > 5 ? (
                  <button type="button" className={`g-btn gpay-page-btn${c.currentPage === c.totalPages ? ' is-on' : ''}`} onClick={() => c.setCurrentPage(c.totalPages)}>{c.totalPages}</button>
                ) : null}
                <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={t('Next page')} disabled={c.currentPage === c.totalPages} onClick={() => c.setCurrentPage(Math.min(c.totalPages, c.currentPage + 1))}><ChevronRight size={16} aria-hidden /></button>
              </span>
            </nav>
          </>
        )}
      </Card>
      {modals}
    </div>
  );
}
