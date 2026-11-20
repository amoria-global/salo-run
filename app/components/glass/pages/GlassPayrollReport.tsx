'use client';

/**
 * Payroll report (photographer) in Compact Glass. Behaviour is the classic page's (usePayrollReport, moved verbatim):
 * the same report, a failed load said out loud instead of a $0 report, and Print through the browser. The printable
 * area keeps its id and ref, so printing works as before.
 */
import { ArrowLeft, Printer, Receipt } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Card, Chip, EmptyState, ErrorState, PageHeader, RowsSkeleton, type Tone } from '../ui';
import type { PayrollReportController } from '@/app/components/transactions/usePayrollReport';

const tone = (s: string): Tone => (s.toLowerCase() === 'paid' ? 'success' : s.toLowerCase() === 'pending' ? 'pending' : s.toLowerCase() === 'initial' ? 'info' : 'neutral');

export default function GlassPayrollReport({ ctl: c }: { ctl: PayrollReportController }) {
  const { t } = useLanguage();
  const { reportRef } = c;
  const d = c.payrollData;
  return (
    <div className="g-page gpay-page">
      <button type="button" className="g-btn g-btn-ghost gpd-back" onClick={() => window.history.back()}><ArrowLeft size={16} aria-hidden /> {t('Back')}</button>
      <PageHeader eyebrow={t('Money')} title={t('Payroll report')}
        subtitle={d.period ? `${t('Period')}: ${d.period}${d.generatedDate ? ` · ${t('Generated')} ${d.generatedDate}` : ''}` : undefined}
        action={<button type="button" className="g-btn g-btn-primary" disabled={c.loading || c.loadError} onClick={c.handleDownloadPDF}><Printer size={16} aria-hidden /> {t('Print report')}</button>} />
      {c.loading ? (
        <Card className="gpay-card" aria-busy="true"><RowsSkeleton rows={4} /></Card>
      ) : c.loadError ? (
        <Card className="gpay-card"><ErrorState message={t('We could not load your payroll report. Please try again.')} onRetry={() => window.location.reload()} /></Card>
      ) : (
        <div id="printable-report" ref={reportRef} className="gpay-page">
          <div className="gc-sums">
            {([['Total earnings', d.total], ['Paid', d.paid], ['Pending', d.pending], ['Initial', d.initial]] as const).map(([label, v]) => (
              <Card key={label} className="gc-sum"><span className="gc-sum-label">{t(label)}</span><strong className="g-num gc-sum-value">{c.formatPrice(v)}</strong></Card>
            ))}
          </div>
          <Card className="gpay-card">
            <header className="gpay-card-head"><h2><Receipt size={18} aria-hidden /> {t('Earnings breakdown')}</h2></header>
            {d.transactions.length === 0 ? (
              <EmptyState icon={<Receipt size={28} aria-hidden />} title={t('No earnings in this period')} body={t('Paid bookings, tips and bonuses show here once they are recorded.')} />
            ) : (
              <table className="gpr-table">
                <thead><tr><th scope="col">{t('Date')}</th><th scope="col">{t('Description')}</th><th scope="col">{t('Type')}</th><th scope="col" className="is-num">{t('Amount')}</th><th scope="col">{t('Status')}</th></tr></thead>
                <tbody>
                  {d.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td data-label={t('Date')}>{tx.date}</td>
                      <td data-label={t('Description')}>{tx.description}</td>
                      <td data-label={t('Type')}>{t(tx.type)}</td>
                      <td data-label={t('Amount')} className="is-num g-num">{c.formatPrice(tx.amount)}</td>
                      <td data-label={t('Status')}><Chip tone={tone(tx.status)}>{t(tx.status)}</Chip></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><th scope="row" colSpan={3}>{t('Total')}</th><td className="is-num g-num">{c.formatPrice(d.total)}</td><td /></tr></tfoot>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
