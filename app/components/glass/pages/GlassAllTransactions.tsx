'use client';

/**
 * All transactions (photographer) in Compact Glass. Behaviour is the classic page's (useAllTransactions, moved
 * verbatim): rows come back already converted to the display currency, so each amount is printed with its own
 * currency tag (formatRowAmount), never converted again. The details dialog is the classic AllTransactionsModals.
 *
 * Back, search, the status filter, then the rows (long lists are windowed) with Download and View, and the server
 * pages. A row linked from a notification is highlighted and scrolled to, as before.
 */
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Eye, Receipt, Search } from 'lucide-react';
import type React from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Avatar, Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton, VirtualRows, type Tone } from '../ui';
import type { AllTransactionsController } from '@/app/components/transactions/useAllTransactions';

type Ctl = AllTransactionsController;
const FILTERS = ['All', 'Pending', 'In progress', 'Initiated', 'Completed'];
const tone = (s: string): Tone => {
  const k = String(s).toLowerCase();
  return k === 'completed' ? 'success' : k === 'pending' ? 'pending' : k === 'failed' ? 'error' : k === 'withdrawn' ? 'neutral' : 'info';
};

export default function GlassAllTransactions({ ctl: c, modals }: { ctl: Ctl; modals: ReactNode }) {
  const { t } = useLanguage();
  const rows = c.filteredTransactions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (tx: any) => {
    const highlighted = c.highlightId != null && String(tx.id) === c.highlightId;
    return (
      <div role="listitem" key={tx.id} ref={highlighted ? (c.highlightRowRef as unknown as React.Ref<HTMLDivElement>) : undefined} className={`gpay-row${highlighted ? ' is-highlighted' : ''}`}>
        <span className="gpay-date">{tx.date}</span>
        <span className="gpay-who">
          <Avatar name={tx.client || '?'} size={36} />
          <span className="gpay-who-text"><strong>{tx.client}</strong><small>{t(tx.service)}{tx.method && tx.method !== 'N/A' ? ` · ${tx.method}` : ''}</small></span>
        </span>
        <strong className="g-num gpay-amount">{c.formatRowAmount(tx.amount, tx.currency)}</strong>
        <span className="gpay-status"><Chip tone={tone(tx.status)}>{t(String(tx.status).replace(/_/g, ' ').replace(/^\w/, (m: string) => m.toUpperCase()))}</Chip></span>
        <span className="gpay-invoice">{tx.transactionId}</span>
        <span className="gpay-actions">
          <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={`${t('Download receipt')} ${tx.transactionId}`} title={t('Download receipt')} onClick={() => c.handleDownload(tx)}><Download size={16} aria-hidden /></button>
          <button type="button" className="g-btn g-btn-ghost gpay-icon" aria-label={`${t('View details')} ${tx.transactionId}`} title={t('View details')} onClick={() => c.handleView(tx)}><Eye size={16} aria-hidden /></button>
        </span>
      </div>
    );
  };
  let list: ReactNode;
  if (c.isLoading && c.transactions.length === 0) list = <RowsSkeleton rows={6} />;
  else if (c.transactionsError && c.transactions.length === 0) list = <ErrorState message={t('We could not load your transactions.')} onRetry={() => { void c.fetchTransactions(c.currentPage); }} />;
  else if (c.transactions.length === 0) list = <EmptyState icon={<Receipt size={28} aria-hidden />} title={t('No transactions yet')} body={t('Payments for your bookings, tips and withdrawals show here.')} />;
  else if (rows.length === 0) list = <EmptyState icon={<Search size={28} aria-hidden />} title={t('No transactions found')} body={t('Try adjusting your filters or search query')} />;
  else {
    list = (
      <>
        <div className="gpay-head" aria-hidden>
          <span>{t('Date')}</span><span>{t('Client / Service')}</span><span>{t('Amount')}</span><span>{t('Status')}</span><span>{t('Transaction ID')}</span><span />
        </div>
        <VirtualRows items={rows} rowHeight={72} className="gpay-rows" role="list" render={(tx) => row(tx)} />
      </>
    );
  }
  return (
    <div className="g-page gpay-page">
      <button type="button" className="g-btn g-btn-ghost gpd-back" onClick={() => window.history.back()}><ArrowLeft size={16} aria-hidden /> {t('Back')}</button>
      <PageHeader eyebrow={t('Money')} title={t('All transactions')} subtitle={t('Your complete earnings and payment history')} />
      <div className="gph-toolbar">
        <label className="gph-search">
          <Search size={16} aria-hidden />
          <input type="search" value={c.searchQuery} onChange={(e) => c.setSearchQuery(e.target.value)} placeholder={t('Search transactions')} aria-label={t('Search transactions')} />
        </label>
        <div className="gph-filters" role="group" aria-label={t('Status')}>
          {FILTERS.map((s) => (
            <button key={s} type="button" className={`g-chip${c.filterStatus === s ? ' is-active' : ''}`} aria-pressed={c.filterStatus === s} onClick={() => c.setFilterStatus(s)}>{t(s)}</button>
          ))}
        </div>
      </div>
      <Card className="gpay-card">
        {list}
        {c.totalPages > 1 ? (
          <nav className="gpay-pager" aria-label={t('Transaction pages')}>
            <span>{t('Page')} {c.currentPage + 1} {t('of')} {c.totalPages}</span>
            <span className="gpay-pager-btns">
              <button type="button" className="g-btn" disabled={c.currentPage === 0} onClick={() => c.fetchTransactions(c.currentPage - 1)}><ChevronLeft size={16} aria-hidden /> {t('Previous')}</button>
              <button type="button" className="g-btn" disabled={c.currentPage >= c.totalPages - 1} onClick={() => c.fetchTransactions(c.currentPage + 1)}>{t('Next')} <ChevronRight size={16} aria-hidden /></button>
            </span>
          </nav>
        ) : null}
      </Card>
      {modals}
    </div>
  );
}
