'use client';

/** Shared pieces of the Compact Glass Homes (photographer, client, coordinator): KPI card, chips, empty and error states. */
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import type { Chip } from './homeData';

/** Amounts already converted by the backend to the display currency: the ISO rule, "RWF 43,056", "$25.00". */
export function formatIso(v: number, code: string) {
  const zero = ['RWF', 'UGX', 'KES', 'TZS', 'XAF', 'XOF'].includes(code);
  const text = v.toLocaleString('en-US', { minimumFractionDigits: zero ? 0 : 2, maximumFractionDigits: zero ? 0 : 2 });
  return code === 'USD' ? `$${text}` : code === 'EUR' ? `€${text}` : `${code} ${text}`;
}
export function statusLabel(s: string, kind: 'payment' | 'event') {
  if (kind === 'event') return s === 'ongoing' ? 'Live' : s === 'completed' ? 'Ended' : 'Upcoming';
  return s === 'completed' || s === 'paid' ? 'Paid' : s === 'pending' || s === 'partial' ? 'Pending' : s === 'failed' ? 'Failed' : s === 'refunded' ? 'Refunded' : 'Payment';
}

export function Kpi({ icon, tone, label, value, chip, goal, spark, loading }: {
  icon: React.ReactNode; tone: 'info' | 'pending' | 'accent' | 'warning'; label: string; value: React.ReactNode;
  chip: Chip; goal: number | null; spark?: number[] | null; loading: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="g-panel gh-kpi">
      <div className="gh-kpi-head"><span>{label}</span><span className={`gh-kpi-icon gh-tone-${tone}`} aria-hidden>{icon}</span></div>
      {loading ? <div className="g-skeleton" style={{ height: 34, width: '70%' }} /> : <div className="gh-kpi-value">{value}</div>}
      <div className="gh-kpi-foot">
        {loading ? <span className="g-skeleton" style={{ height: 20, width: 90 }} /> : chip ? (
          chip.kind === 'flat'
            ? <span className="gh-chip gh-chip-flat">{t('No change')}</span>
            : <span className={`gh-chip gh-chip-${chip.kind}`}>{chip.kind === 'up' ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />} {chip.percent}% <span className="gh-vs">{t('vs previous period')}</span></span>
        ) : <span />}
        {spark && spark.some((v) => v > 0) && <Spark values={spark} />}
      </div>
      {goal != null && (
        <div className="gh-goal" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goal * 100)} aria-label={t('Progress to goal')}>
          <span style={{ width: `${goal * 100}%` }} />
        </div>
      )}
    </div>
  );
}

export function Spark({ values }: { values: number[] }) {
  const max = Math.max(...values, 1), w = 72, h = 24;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i * w) / Math.max(1, values.length - 1)).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} aria-hidden><path d={d} fill="none" stroke="var(--g-primary-light)" strokeWidth="2" strokeLinejoin="round" /></svg>;
}

export function StatusChip({ tone, label }: { tone: string; label: string }) {
  return <span className={`gh-status gh-tone-${tone}`}>{tone === 'live' && <i className="gh-live-dot" aria-hidden />}{label}</span>;
}

export function Hidden() {
  const { t } = useLanguage();
  return <span className="gh-hidden" title={t('Not shared in this workspace')}>{t('Not shared')}</span>;
}

export function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="gh-empty">
      <span className="gh-empty-icon" aria-hidden>{icon}</span>
      <strong>{title}</strong><small>{body}</small>
    </div>
  );
}

export function ListSkeleton() {
  return <div style={{ display: 'grid', gap: 10 }}>{[0, 1, 2].map((i) => <div key={i} className="g-skeleton" style={{ height: 52 }} />)}</div>;
}

export function SectionError({ onRetry, height }: { onRetry: () => void; height?: number }) {
  const { t } = useLanguage();
  return (
    <div className="gh-error" style={{ minHeight: height }} role="status">
      <strong>{t('We could not load this.')}</strong>
      <button type="button" className="g-btn g-btn-ghost" onClick={onRetry}>{t('Try again')}</button>
    </div>
  );
}

