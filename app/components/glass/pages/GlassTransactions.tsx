'use client';

/**
 * Photographer Transactions in Compact Glass. Behaviour is the classic page's (usePhotographerTransactions, moved
 * verbatim); every dialog (report, transaction details, withdraw, payment-account setup, tips) is the classic
 * TransactionsPageModals, passed in as `modals`; the earnings chart is the classic EarningsChart, passed as `chart`.
 *
 * Header with Withdraw funds (payment-account setup first when there is none, as before), the wallet warning, four
 * totals, the earnings trend, tips and the platform bonus with its progress, then the history as rows with the
 * receipt and details actions and the server pages.
 */
import { Award, ChevronLeft, ChevronRight, Download, Eye, FileText, Gift, Landmark, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Avatar, Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton, Segmented, type Tone } from '../ui';
import type { PhotographerTransactionsController, TransactionStatus } from '@/app/components/transactions/usePhotographerTransactions';

type Ctl = PhotographerTransactionsController;
const PERIODS = ['1W', '1M', '3M', '6M', '1Y'] as const;
const STATUS: Record<TransactionStatus, { label: string; tone: Tone }> = {
  completed: { label: 'Completed', tone: 'success' },
  pending: { label: 'Pending', tone: 'pending' },
  in_progress: { label: 'In progress', tone: 'info' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  initiated: { label: 'Initiated', tone: 'info' },
};

function Stat({ label, value }: { label: string; value: ReactNode }) {
  const { t } = useLanguage();
  return <Card className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{value}</strong></Card>;
}

function Bonus({ c }: { c: Ctl }) {
  const { t } = useLanguage();
  const goal = c.formatPrice(c.platformConfig.photographer.bonusAmount, c.platformConfig.photographer.bonusCurrencyId);
  const earned = c.wallet?.balanceBonuses != null ? c.formatPrice(c.wallet.balanceBonuses) : c.formatPrice(c.bonusStatus.amount ?? 0, c.bonusStatus.currencyAbbreviation);
  const pct = Math.min(100, c.BONUS_THRESHOLD > 0 ? (c.completedEventsCount / c.BONUS_THRESHOLD) * 100 : 0);
  const state = c.bonusApproved ? { tone: 'success' as Tone, label: 'Bonus earned' } : c.bonusPending ? { tone: 'pending' as Tone, label: 'Pending approval' } : c.bonusRejected ? { tone: 'error' as Tone, label: 'Not approved' } : { tone: 'neutral' as Tone, label: 'Not yet earned' };
  return (
    <Card className="gpay-card">
      <header className="gpay-card-head">
        <span>
          <h2><Award size={18} aria-hidden /> {t('Platform bonus')}</h2>
          <small>
            {c.bonusApproved ? `${t('Bonus earned for completing your first')} ${c.BONUS_THRESHOLD} ${t('events')}`
              : c.bonusPending ? t('Bonus pending admin approval')
                : c.bonusRejected ? t('Bonus request was not approved')
                  : `${t('Complete your first')} ${c.BONUS_THRESHOLD} ${t('events to earn')} ${goal}`}
          </small>
        </span>
        <Chip tone={state.tone}>{t(state.label)}</Chip>
      </header>
      <p className="gpay-gift-total"><span>{t(c.bonusApproved ? 'Bonus' : 'Bonus amount')}</span><strong className="g-num">{c.bonusApproved ? earned : goal}</strong></p>
      {c.bonusRejected && c.bonusStatus.adminComment ? <p className="gtx-comment"><small>{t('Admin comment')}</small> {c.bonusStatus.adminComment}</p> : null}
      <div className="gpd-progress">
        <span className="gpd-progress-label">
          <span>{t(c.bonusApproved ? 'Bonus achieved' : c.bonusPending ? 'Pending approval' : 'Progress to bonus')}</span>
          <span className="g-num">{Math.min(c.completedEventsCount, c.BONUS_THRESHOLD)}/{c.BONUS_THRESHOLD} {t('events')}</span>
        </span>
        <span className="gpd-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={t('Progress to bonus')}><span style={{ width: `${pct}%` }} /></span>
      </div>
      {!c.bonusReached ? <p className="gpay-muted">{c.eventsToBonus} {t(c.eventsToBonus === 1 ? 'event to go' : 'events to go')}</p> : null}
    </Card>
  );
}

export default function GlassTransactions({ ctl: c, modals, chart }: { ctl: Ctl; modals: ReactNode; chart: ReactNode }) {
  const { t } = useLanguage();
  const pages = Array.from({ length: Math.min(c.totalPages, 3) }, (_, i) => i);
  const withdraw = () => (c.hasPaymentAccount === false ? c.setShowSetupModal(true) : c.setShowWithdrawModal(true));
  return (
    <div className="g-page gpay-page">
      <PageHeader eyebrow={t('Money')} title={t('Transactions')} subtitle={t('Manage your earnings and view your complete transaction history.')}
        action={<span className="gtx-head-actions">
          <button type="button" className="g-btn" onClick={() => c.setShowReportModal(true)}><FileText size={16} aria-hidden /> {t('View report')}</button>
          <button type="button" className="g-btn g-btn-primary" onClick={withdraw}><Landmark size={16} aria-hidden /> {t('Withdraw funds')}</button>
        </span>} />

      {c.walletError ? (
        <Card className="gpay-notice" role="alert">
          <span><strong>{t('We could not load your wallet')}</strong><small>{t('The earnings below are not your real balance. Please refresh.')}</small></span>
        </Card>
      ) : null}

      <div className="gc-sums">
        <Stat label="Total earnings" value={c.formatPrice(c.totalCompleted + c.totalPending + c.totalWithdrawn)} />
        <Stat label="Completed" value={c.formatPrice(c.totalCompleted)} />
        <Stat label="Pending" value={c.formatPrice(c.totalPending)} />
        <Stat label="Withdrawn" value={c.formatPrice(c.totalWithdrawn)} />
      </div>

      <Card className="gpay-card">
        <header className="gpay-card-head">
          <h2>{t('Earnings trend')}</h2>
          <Segmented label={t('Chart type')} value={c.chartType} onChange={c.setChartType}
            options={[{ key: 'line', label: 'Line' }, { key: 'bar', label: 'Bar' }, { key: 'scatter', label: 'Scatter' }]} />
        </header>
        <Segmented label={t('Period')} value={c.activeTimeFilter} onChange={c.setActiveTimeFilter} options={PERIODS.map((k) => ({ key: k, label: k }))} />
        <div className="gpay-chart">{chart}</div>
      </Card>

      <div className="gpay-grid">
        <Card className="gpay-card">
          <header className="gpay-card-head">
            <span><h2><Gift size={18} aria-hidden /> {t('Tips from clients')}</h2><small>{t('Appreciation from your clients')}</small></span>
            <button type="button" className="g-btn g-btn-ghost" onClick={() => c.setShowTipsModal(true)}>{t('View all')}</button>
          </header>
          <p className="gpay-gift-total"><span>{t('Total tips')}</span><strong className="g-num">{c.formatPrice(c.totalTips)}</strong></p>
          {c.tipsData.length === 0 ? <p className="gpay-muted">{t('No tips yet.')}</p> : (
            <ul className="gpay-gifts">
              {c.tipsData.slice(0, 3).map((tip) => (
                <li key={tip.id}>
                  <span className="gpay-who-text"><strong>{tip.clientName}</strong><small>{tip.eventName} · {tip.date}</small></span>
                  <strong className="g-num">{c.formatPrice(tip.amount)}</strong>
                  <span />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Bonus c={c} />
      </div>

      <Card className="gpay-card">
        <header className="gpay-card-head"><h2><Receipt size={18} aria-hidden /> {t('Transaction history')}</h2></header>
        {c.isLoading && c.transactions.length === 0 ? <RowsSkeleton rows={5} /> : c.transactions.length === 0 ? (
          c.transactionsError ? <ErrorState message={t('We could not load your transactions.')} onRetry={() => { void c.fetchData(c.currentPage); }} />
            : <EmptyState icon={<Receipt size={28} aria-hidden />} title={t('No transactions yet')} body={t('Payments for your bookings, tips and withdrawals show here.')} />
        ) : (
          <>
            <div className="gpay-head" aria-hidden>
              <span>{t('Date')}</span><span>{t('Client / Service')}</span><span>{t('Amount')}</span><span>{t('Status')}</span><span>{t('Transaction ID')}</span><span />
            </div>
            <ul className="gpay-rows" aria-busy={c.isLoading}>
              {c.transactions.map((tx) => {
                const st = STATUS[tx.status] ?? STATUS.initiated;
                return (
                  <li key={tx.id} className="gpay-row">
                    <span className="gpay-date">{tx.date}</span>
                    <span className="gpay-who">
                      <Avatar name={tx.clientName || '?'} src={tx.clientImage || null} size={36} />
                      <span className="gpay-who-text"><strong>{tx.clientName}</strong><small>{t(tx.service || tx.serviceType)}{tx.method && tx.method !== '-' ? ` · ${tx.method}` : ''}</small></span>
                    </span>
                    <strong className="g-num gpay-amount">{c.formatPrice(tx.amountNum)}</strong>
                    <span className="gpay-status"><Chip tone={st.tone}>{t(st.label)}</Chip></span>
                    <span className="gpay-invoice">{tx.transactionId}</span>
                    <span className="gpay-actions">
                      {tx.status === 'completed' ? (
                        <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={`${t('Download receipt')} ${tx.transactionId}`} title={t('Download receipt')} onClick={() => c.handleDownloadReceipt(tx)}><Download size={16} aria-hidden /></button>
                      ) : null}
                      <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={`${t('View details')} ${tx.transactionId}`} title={t('View details')} onClick={() => c.handleViewTransaction(tx)}><Eye size={16} aria-hidden /></button>
                    </span>
                  </li>
                );
              })}
            </ul>
            {c.totalPages > 1 ? (
              <nav className="gpay-pager" aria-label={t('Transaction pages')}>
                <span>{t('Page')} {c.currentPage + 1} {t('of')} {c.totalPages}</span>
                <span className="gpay-pager-btns">
                  <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={t('Previous page')} disabled={c.currentPage === 0} onClick={() => c.fetchData(c.currentPage - 1)}><ChevronLeft size={16} aria-hidden /></button>
                  {pages.map((n) => (
                    <button key={n} type="button" className={`g-btn gpay-page-btn${c.currentPage === n ? ' is-on' : ''}`} aria-current={c.currentPage === n ? 'page' : undefined} onClick={() => c.fetchData(n)}>{n + 1}</button>
                  ))}
                  {c.totalPages > 3 ? (
                    <button type="button" className={`g-btn gpay-page-btn${c.currentPage === c.totalPages - 1 ? ' is-on' : ''}`} onClick={() => c.fetchData(c.totalPages - 1)}>{c.totalPages}</button>
                  ) : null}
                  <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={t('Next page')} disabled={c.currentPage >= c.totalPages - 1} onClick={() => c.fetchData(c.currentPage + 1)}><ChevronRight size={16} aria-hidden /></button>
                </span>
              </nav>
            ) : null}
          </>
        )}
      </Card>
      {modals}
    </div>
  );
}

