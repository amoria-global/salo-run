'use client';

/**
 * Coordinator Payments in Compact Glass. Behaviour is the classic page's (useCoordinatorPayments, moved verbatim);
 * every dialog (report, payment details, pay now, withdraw, stream-fee withdrawal set-up) is the classic
 * PaymentsPageModals, passed in as `modals`; the spending chart is the classic SpendingChart, passed in as `chart`.
 *
 * Header with View report, the load-failure and pending-payments notices, four summary cards, the spending trend,
 * live-stream revenue (ticket payments, with Withdraw or Set up withdrawal), gift earnings, then the payment history
 * with the classic table's actions: Pay now while pending, Retry after a failure, the receipt once paid, and View.
 * Stream ticket amounts are in the booking currency, so they are converted from it rather than read as USD.
 */
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, Gift, Radio, Receipt } from 'lucide-react';
import type React from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { fmtDay, plural } from '../format';
import { Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton, Segmented, type Tone } from '../ui';
import { PaymentRow } from './GlassClientPayments';
import type { CoordinatorPaymentsController } from '@/app/components/payments/useCoordinatorPayments';

const PERIODS = ['1W', '1M', '3M', '6M', '1Y'] as const;
const statusTone = (s: string): Tone => (s === 'completed' ? 'success' : s === 'failed' ? 'error' : 'pending');
const statusLabel = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Pending');
/** The classic page's sender masking: a bare phone number keeps its first three and last three digits. */
function senderOf(raw: string): string {
  const phoneOnly = raw && /^\d+$/.test(raw.replace(/[+\s]/g, ''));
  return phoneOnly ? raw.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : (raw || 'Anonymous');
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  const { t } = useLanguage();
  return <Card className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{value}</strong></Card>;
}

export default function GlassCoordinatorPayments({ ctl: c, modals, chart }: { ctl: CoordinatorPaymentsController; modals: ReactNode; chart: ReactNode }) {
  const { t, language } = useLanguage();
  const pages = Array.from({ length: Math.min(c.totalPages, 5) }, (_, i) => i + 1);
  const shown = Math.max(0, Math.min(c.resultsPerPage, c.totalResults - (c.currentPage - 1) * c.resultsPerPage));
  const loading = !c.paymentsLoaded || (c.isLoadingPayments && c.payments.length === 0);
  return (
    <div className="g-page gpay-page">
      <PageHeader
        title={t('Payments')}
        subtitle={t('Manage your payments and view transaction history')}
        action={<button type="button" className="g-btn" onClick={() => c.setShowReportModal(true)}><FileText size={16} aria-hidden /> {t('View report')}</button>}
      />

      {c.paymentsError && c.payments.length > 0 ? (
        <Card className="gpay-notice" role="alert">
          <AlertTriangle size={18} aria-hidden />
          <span><strong>{t(c.paymentsError)}</strong><small>{t('The totals below may be incomplete.')}</small></span>
        </Card>
      ) : null}

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

      <Card className="gpay-card">
        <header className="gpay-card-head">
          <h2>{t('Spending trend')}</h2>
          <Segmented label={t('Chart type')} value={c.chartType} onChange={c.setChartType}
            options={[{ key: 'line', label: 'Line' }, { key: 'bar', label: 'Bar' }, { key: 'scatter', label: 'Scatter' }]} />
        </header>
        <Segmented label={t('Period')} value={c.activeTimeFilter} onChange={c.setActiveTimeFilter} options={PERIODS.map((k) => ({ key: k, label: k }))} />
        <div className="gpay-chart">{chart}</div>
      </Card>

      <div className="gpay-grid">
        <Card className="gpay-card">
          <header className="gpay-card-head">
            <span>
              <h2><Radio size={18} aria-hidden /> {t('Live stream revenue')}</h2>
              <small>{t('From ticketed live-stream viewers on ConnektLive')}</small>
            </span>
            {c.hasWithdrawalMethod ? (
              <button type="button" className="g-btn g-btn-primary" onClick={() => c.setShowWithdrawModal(true)}>{t('Withdraw')}</button>
            ) : (
              <button type="button" className="g-btn" onClick={() => c.setShowStreamFeeWithdrawModal(true)}>{t('Set up withdrawal')}</button>
            )}
          </header>
          <p className="gpay-gift-total"><span>{t('Total revenue')}</span><strong className="g-num">{c.formatPrice(c.totalStreamFees)}</strong></p>
          {c.streamFeeEvents.length === 0 ? (
            <p className="gpay-muted">{t('No streaming payments yet. Entry fee payments from viewers will appear here.')}</p>
          ) : (
            <ul className="gpay-gifts">
              {c.streamFeeEvents.map((s) => (
                <li key={s.id}>
                  <span className="gpay-who-text">
                    <strong>{s.viewerName}</strong>
                    <small>{s.eventTitle} · {fmtDay(s.date, language) || '-'}</small>
                  </span>
                  <strong className="g-num">{c.formatPrice(s.amount, s.currency)}</strong>
                  <Chip tone={statusTone(s.status)}>{t(statusLabel(s.status))}</Chip>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gpay-card">
          <header className="gpay-card-head">
            <span>
              <h2><Gift size={18} aria-hidden /> {t('Gift earnings')}</h2>
              <small>{t('Gifts received from live-stream viewers')}</small>
            </span>
          </header>
          <p className="gpay-gift-total"><span>{t('Your share of gifts')}</span><strong className="g-num">{c.formatPrice(c.totalGiftRevenue)}</strong></p>
          {c.giftPayments.length === 0 ? (
            <p className="gpay-muted">{t('No gifts received yet. Gifts from live-stream viewers will appear here.')}</p>
          ) : (
            <ul className="gpay-gifts">
              {c.giftPayments.map((g) => (
                <li key={g.id}>
                  <span className="gpay-who-text">
                    <strong>{senderOf(g.customerPhone) === 'Anonymous' ? t('Anonymous') : senderOf(g.customerPhone)}</strong>
                    <small>{g.eventTitle} · {fmtDay(g.date, language) || '-'}{g.giftMessage ? ` · “${g.giftMessage}”` : ''}</small>
                  </span>
                  <strong className="g-num">{c.formatPrice(g.netAmount)}</strong>
                  <Chip tone={statusTone(g.status)}>{t(statusLabel(g.status))}</Chip>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="gpay-card">
        <header className="gpay-card-head"><h2><Receipt size={18} aria-hidden /> {t('Payment history')}</h2></header>
        {loading ? (
          <RowsSkeleton rows={5} />
        ) : c.paymentsError && c.payments.length === 0 ? (
          <ErrorState message={t(c.paymentsError)} onRetry={() => { void c.fetchPayments(); }} />
        ) : c.payments.length === 0 ? (
          <EmptyState icon={<Receipt size={28} aria-hidden />} title={t('No payments yet')} body={t('Payments for your bookings and purchases show here.')} />
        ) : (
          <>
            <div className="gpay-head" aria-hidden>
              <span>{t('Date')}</span><span>{t('Event / Photographer')}</span><span>{t('Amount')}</span><span>{t('Status')}</span><span>{t('Invoice')}</span><span />
            </div>
            <ul className="gpay-rows">
              {c.paginatedPayments.map((p) => (
                <PaymentRow key={p.id} p={p} escrow={false} formatPrice={c.formatPrice}
                  onPay={() => c.handlePayNow(p)} onReceipt={() => c.handleDownloadReceipt(p)} onView={() => c.handleViewPayment(p)} />
              ))}
            </ul>
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
