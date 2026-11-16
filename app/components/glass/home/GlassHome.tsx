'use client';

/**
 * The photographer Home in Compact Glass (Stage 2). Shown only under the ui-glass flag; the old Home is untouched.
 * Hero (greeting, Go live and My hosted events, Sell photos, New package, Compare goals), wallet card, one period
 * switch driving the four cards and the chart, Upcoming and Recent activity. Each section has its own skeleton,
 * empty and error state; nothing shifts when data arrives.
 */
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ChevronRight, CircleDollarSign, Clock3, History, Layers, Plus,
  Radio, Star, Tag, Target, Users,
} from 'lucide-react';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';
import { usePermissions } from '@/app/lib/usePermissions';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useTheme } from '@/app/context/ThemeContext';
import { useHostEntry } from '@/app/components/useHostEntry';
import WithdrawModal from '@/app/components/WithdrawModal';
import { SELL_PHOTOS_QUERY } from '@/lib/albums/sellPhotos';
import { Money } from '../Money';
import {
  activityRows, greetingKey, periodQuery, progress, trendChip, upcoming,
  type Chip, type Period, type RawActivity, type RawEvent, type Range, type Trend,
} from './homeData';
import { useResource, type Analytics, type PerfPoint, type Wallet } from './useHomeData';
import { useGoals } from './useGoals';
import GoalsSheet from './GoalsSheet';

const PerformanceChart = dynamic(() => import('./PerformanceChart'), {
  ssr: false,
  loading: () => <div className="g-skeleton" style={{ height: 240 }} />,
});

const P = '/user/photographer';

export default function GlassHome() {
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  const { isShared, isCollaborator } = useWorkspace();
  const { hasPermission } = usePermissions();
  const { canHost, caption: hostedCaption, loaded: hostLoaded } = useHostEntry();
  const router = useRouter();

  // Same rule as the old Home: a photographer whose profile is not accepted is sent to the profile page. In someone
  // else's workspace the review status that matters is the owner's, so the viewer's own is not checked there.
  useEffect(() => {
    if (!isShared && user && user.profileReviewStatus?.toUpperCase() !== 'ACCEPTED') router.replace(`${P}/profile`);
  }, [user, router, isShared]);

  const [period, setPeriod] = useState<Period>('week');
  const [range, setRange] = useState<Range>({ from: '', to: '' });
  const q = periodQuery(period, range);
  const [analytics] = useResource<Analytics>('/api/remote/photographer/analytics');
  const [wallet, retryWallet] = useResource<Wallet>(isCollaborator || isShared ? null : '/api/remote/wallet/me');
  const [trends, retryTrends] = useResource<Record<string, Trend>>(`/api/remote/photographer/analytics/trends?${q.trends}`);
  const [perf, retryPerf] = useResource<PerfPoint[]>(`/api/remote/photographer/performance?${q.performance}`);
  const [events, retryEvents] = useResource<RawEvent[]>('/api/remote/photographer/events');
  const [acts, retryActs] = useResource<RawActivity[]>(`/api/remote/photographer/activities?displayCurrency=${encodeURIComponent(currency)}`);
  const goals = useGoals(!isShared);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const today = useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, []);
  const next = events.status === 'ready' ? upcoming(Array.isArray(events.data) ? events.data : [], today, language) : [];
  const thisMonth = events.status === 'ready' && Array.isArray(events.data)
    ? events.data.filter((e) => e.date && e.date.slice(0, 7) === today.slice(0, 7)).length : null;
  const liveNow = events.status === 'ready' && Array.isArray(events.data)
    ? events.data.filter((e) => String(e.status || '').toLowerCase() === 'ongoing').length : 0;

  const tr = trends.status === 'ready' ? trends.data : {};
  // Money a collaborator may not see: known from the workspace role, and also from the data itself, since the backend
  // removes these fields for a collaborator. Either way the cards say Not shared rather than show a made-up 0.
  const moneyHidden = isCollaborator || (trends.status === 'ready' && !!trends.data && !('totalEarnings' in trends.data) && 'clients' in trends.data);
  // The wallet card is the viewer's own money: shown for their own business, not inside someone else's workspace.
  const showWallet = !moneyHidden && !isShared;
  const firstName = user?.firstName || '';
  const greet = t(greetingKey(new Date().getHours()));
  const target = goals.active;

  return (
    <div className="gh">
      {/* ── Hero + wallet ─────────────────────────────────────────── */}
      <div className={`gh-top${showWallet ? "" : " gh-top-solo"}`}>
        <section className="g-panel gh-hero" aria-labelledby="gh-greeting">
          <div className="gh-hero-text">
            <div className="gh-eyebrow">{t('Photographer dashboard')}</div>
            <h1 id="gh-greeting" className="g-display gh-h1">
              {greet}{firstName ? ', ' : ''}<span className="gh-name">{firstName}</span>
            </h1>
            <p className="gh-sub">
              {thisMonth == null ? ' ' : liveNow > 0
                ? `${t('Events this month')}: ${thisMonth} · ${t('Live now')}: ${liveNow}`
                : `${t('Events this month')}: ${thisMonth}`}
            </p>
            <div className="gh-actions">
              {hasPermission('events.create') && !isShared && (
                <Link href={`${P}/events?${SELL_PHOTOS_QUERY}`} className="g-btn g-btn-primary" data-testid="home-sell-photos">
                  <Tag size={16} aria-hidden /> {t('Sell photos')}
                </Link>
              )}
              {!isShared && (
                <Link href={`${P}/profile?tab=packages`} className="g-btn g-btn-ghost"><Plus size={16} aria-hidden /> {t('New package')}</Link>
              )}
              {!isShared && (
                <button type="button" className="g-btn g-btn-ghost" onClick={() => setGoalsOpen(true)} aria-pressed={!!target}>
                  <Target size={16} aria-hidden /> <span className="g-ellipsis" style={{ maxWidth: 180 }}>{target ? target.name : t('Compare goals')}</span>
                </button>
              )}
            </div>
          </div>
          {!hostLoaded && !isShared && <div className="gh-tiles gh-tiles-wait" aria-hidden><div className="g-skeleton" /><div className="g-skeleton" /></div>}
          {canHost && !isShared && (
            <div className="gh-tiles">
              <Link href={`${P}/host?new=1`} className="gh-tile gh-tile-live">
                <span className="gh-tile-icon" aria-hidden><Radio size={18} /></span>
                <span className="gh-tile-text"><strong>{t('Go Live')}</strong><small>{t('Host your own event')}</small></span>
                <ChevronRight size={16} aria-hidden />
              </Link>
              <Link href={`${P}/host`} className="gh-tile gh-tile-hosted">
                <span className="gh-tile-icon" aria-hidden><Layers size={18} /></span>
                <span className="gh-tile-text"><strong>{t('My hosted events')}</strong><small className="g-ellipsis">{hostedCaption}</small></span>
                <ChevronRight size={16} aria-hidden />
              </Link>
            </div>
          )}
        </section>

        {showWallet && (
          <section className="gh-wallet" aria-label={t('Wallet balance')}>
            <div className="gh-wallet-head"><span>{t('Wallet balance')}</span><span className="gh-pill">{currency}</span></div>
            {wallet.status === 'loading' && <div className="g-skeleton" style={{ height: 40, width: '60%', opacity: 0.4 }} />}
            {wallet.status === 'error' && (
              <button type="button" className="gh-wallet-retry" onClick={retryWallet}>{t('Could not load your balance. Try again')}</button>
            )}
            {wallet.status === 'ready' && (
              <>
                <div className="g-num gh-wallet-amount"><Money amount={Number(wallet.data.balanceAvailable) || 0} /></div>
                <div className="gh-wallet-meta">
                  <span>{t('Pending')} <Money amount={Number(wallet.data.pendingAmount) || 0} /></span>
                  <span>{t('Bonuses')} <Money amount={Number(wallet.data.balanceBonuses) || 0} /></span>
                </div>
              </>
            )}
            <div className="gh-wallet-actions">
              <button type="button" className="g-btn gh-btn-white" onClick={() => setWithdrawOpen(true)}>{t('Withdraw')}</button>
              <Link href={`${P}/transaction`} className="g-btn gh-btn-glass"><History size={16} aria-hidden /> {t('Payment history')}</Link>
            </div>
          </section>
        )}
      </div>

      {/* ── Overview: one switch for the cards and the chart ───────── */}
      <div className="gh-overview-head">
        <h2 className="g-display gh-h2">{t('Overview')}</h2>
        <div className="g-seg" role="group" aria-label={t('Choose a period')}>
          {(['today', 'week', 'month', 'custom'] as Period[]).map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {t(p === 'today' ? 'Today' : p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'Custom')}
            </button>
          ))}
        </div>
      </div>
      {period === 'custom' && (
        <div className="gh-range">
          <label>{t('From')} <input type="date" className="g-select" value={range.from} max={range.to || today} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></label>
          <label>{t('To')} <input type="date" className="g-select" value={range.to} min={range.from} max={today} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></label>
          {!(range.from && range.to) && <span className="gh-muted">{t('Pick both dates to see that range.')}</span>}
        </div>
      )}

      {trends.status === 'error' ? (
        <SectionError onRetry={retryTrends} />
      ) : (
        <div className="gh-kpis">
          <Kpi icon={<CircleDollarSign size={16} />} tone="info" label={t('Total earnings')} loading={trends.status === 'loading'}
            value={moneyHidden ? <Hidden /> : <Money amount={Number(tr.totalEarnings?.value) || 0} />}
            chip={moneyHidden ? null : trendChip(tr.totalEarnings)} goal={target ? progress(Number(tr.totalEarnings?.value) || 0, target.targetEarnings) : null}
            spark={perf.status === 'ready' && !moneyHidden ? perf.data.map((p) => Number(p.value1) || 0) : null} />
          <Kpi icon={<Clock3 size={16} />} tone="pending" label={t('Pending payouts')} loading={trends.status === 'loading' && analytics.status === 'loading'}
            value={moneyHidden ? <Hidden /> : <Money amount={Number(tr.pendingPayouts?.value ?? (analytics.status === 'ready' ? analytics.data.pendingPayments : 0)) || 0} />}
            chip={moneyHidden ? null : trendChip(tr.pendingPayouts)} goal={target ? progress(Number(tr.pendingPayouts?.value) || 0, target.targetPending) : null} />
          <Kpi icon={<Users size={16} />} tone="accent" label={t('Clients')} loading={trends.status === 'loading'}
            value={<span className="g-num">{Number(tr.clients?.value) || 0}</span>} chip={trendChip(tr.clients)}
            goal={target ? progress(Number(tr.clients?.value) || 0, target.targetClients) : null} />
          <Kpi icon={<Star size={16} />} tone="warning" label={t('Rating')} loading={analytics.status === 'loading'}
            value={analytics.status === 'ready'
              ? <span className="g-num">{(Number(analytics.data.averageRating) || 0).toFixed(1)}<small className="gh-of"> / 5</small></span>
              : <span className="g-num">–</span>}
            chip={null} goal={target && analytics.status === 'ready' ? progress(Number(analytics.data.averageRating) || 0, target.targetRatings) : null} />
        </div>
      )}

      {/* ── Performance + Upcoming ──────────────────────────────────── */}
      <div className="gh-grid">
        <section className="g-panel gh-card" aria-labelledby="gh-perf">
          <div className="gh-card-head">
            <div>
              <h2 id="gh-perf" className="g-display gh-h3">{t('Performance')}</h2>
              <p className="gh-muted">{t(moneyHidden ? 'Bookings in this period' : 'Earnings and bookings in this period')}</p>
            </div>
            <div className="gh-legend" aria-hidden>
              {!moneyHidden && <span><i className="gh-dot-earn" /> {t('Earnings')}</span>}
              <span><i className="gh-dot-book" /> {t('Bookings')}</span>
            </div>
          </div>
          {perf.status === 'loading' && <div className="g-skeleton" style={{ height: 240 }} />}
          {perf.status === 'error' && <SectionError onRetry={retryPerf} height={240} />}
          {perf.status === 'ready' && <PerformanceChart points={Array.isArray(perf.data) ? perf.data : []} moneyHidden={moneyHidden} />}
        </section>

        <section className="g-panel gh-card" aria-labelledby="gh-up">
          <div className="gh-card-head">
            <h2 id="gh-up" className="g-display gh-h3">{t('Upcoming')}</h2>
            <Link href={`${P}/events`} className="gh-link">{t('See all')}</Link>
          </div>
          {events.status === 'loading' && <ListSkeleton />}
          {events.status === 'error' && <SectionError onRetry={retryEvents} />}
          {events.status === 'ready' && next.length === 0 && (
            <Empty icon={<CalendarDays size={22} />} title={t('No upcoming events')} body={t('New bookings will appear here.')} />
          )}
          {events.status === 'ready' && next.length > 0 && (
            <ul className="gh-list">
              {next.map((e) => (
                <li key={e.id}>
                  <Link href={`${P}/events/${e.id}`} className="gh-row">
                    <span className="gh-date"><strong className="g-num">{e.day}</strong><small>{e.month}</small></span>
                    <span className="gh-row-text">
                      <strong className="g-ellipsis">{e.title}</strong>
                      <small className="g-ellipsis">{[e.time, e.place].filter(Boolean).join(' · ') || ' '}</small>
                    </span>
                    <StatusChip tone={e.status === 'live' ? 'live' : e.status === 'pending' ? 'pending' : 'info'}
                      label={t(e.status === 'live' ? 'Live' : e.status === 'pending' ? 'Pending' : 'Upcoming')} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Recent activity ─────────────────────────────────────────── */}
      <section className="g-panel gh-card" aria-labelledby="gh-act">
        <div className="gh-card-head">
          <h2 id="gh-act" className="g-display gh-h3">{t('Recent activity')}</h2>
          {!moneyHidden && <Link href={`${P}/transaction`} className="gh-link">{t('See all')}</Link>}
        </div>
        {acts.status === 'loading' && <ListSkeleton />}
        {acts.status === 'error' && <SectionError onRetry={retryActs} />}
        {acts.status === 'ready' && (() => {
          const rows = activityRows(Array.isArray(acts.data) ? acts.data : []);
          if (!rows.length) return <Empty icon={<History size={22} />} title={t('Nothing in the last 30 days')} body={t('Payments and event updates will appear here.')} />;
          return (
            <ul className="gh-list">
              {rows.map((r) => {
                const [sub, n] = r.subtitle.split(':');
                const subtitle = sub === 'pending' ? (n ? `${t('Payment pending')} · ${n} ${t('attempts')}` : t('Payment pending'))
                  : sub === 'received' ? t('Payment received') : sub === 'event' ? t('Event') : t('Payment');
                const inner = (
                  <>
                    <span className={`gh-act-icon gh-tone-${r.tone}`} aria-hidden>{r.kind === 'payment' ? <CircleDollarSign size={16} /> : <CalendarDays size={16} />}</span>
                    <span className="gh-row-text"><strong className="g-ellipsis">{r.title}</strong><small className="g-ellipsis">{subtitle}</small></span>
                    <span className="gh-act-end">
                      {r.amount != null && r.currency && <strong className="g-num">{formatIso(r.amount, r.currency)}</strong>}
                      <StatusChip tone={r.tone} label={t(statusLabel(r.status, r.kind))} />
                    </span>
                  </>
                );
                return <li key={r.key}>{r.link ? <Link href={r.link} className="gh-row">{inner}</Link> : <div className="gh-row">{inner}</div>}</li>;
              })}
            </ul>
          );
        })()}
      </section>

      <GoalsSheet open={goalsOpen} onClose={() => setGoalsOpen(false)} goals={goals} onPeriod={setPeriod} />
      <WithdrawModal isOpen={withdrawOpen} onClose={() => { setWithdrawOpen(false); retryWallet(); }} role="photographer"
        colors={colors as unknown as Record<string, string>} actualTheme={actualTheme} />
    </div>
  );
}

/** Amounts already converted by the backend to the display currency: the ISO rule, "RWF 43,056", "$25.00". */
function formatIso(v: number, code: string) {
  const zero = ['RWF', 'UGX', 'KES', 'TZS', 'XAF', 'XOF'].includes(code);
  const text = v.toLocaleString('en-US', { minimumFractionDigits: zero ? 0 : 2, maximumFractionDigits: zero ? 0 : 2 });
  return code === 'USD' ? `$${text}` : code === 'EUR' ? `€${text}` : `${code} ${text}`;
}
function statusLabel(s: string, kind: 'payment' | 'event') {
  if (kind === 'event') return s === 'ongoing' ? 'Live' : s === 'completed' ? 'Ended' : 'Upcoming';
  return s === 'completed' || s === 'paid' ? 'Paid' : s === 'pending' || s === 'partial' ? 'Pending' : s === 'failed' ? 'Failed' : s === 'refunded' ? 'Refunded' : 'Payment';
}

function Kpi({ icon, tone, label, value, chip, goal, spark, loading }: {
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

function Spark({ values }: { values: number[] }) {
  const max = Math.max(...values, 1), w = 72, h = 24;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i * w) / Math.max(1, values.length - 1)).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} aria-hidden><path d={d} fill="none" stroke="var(--g-primary-light)" strokeWidth="2" strokeLinejoin="round" /></svg>;
}

function StatusChip({ tone, label }: { tone: string; label: string }) {
  return <span className={`gh-status gh-tone-${tone}`}>{tone === 'live' && <i className="gh-live-dot" aria-hidden />}{label}</span>;
}

function Hidden() {
  const { t } = useLanguage();
  return <span className="gh-hidden" title={t('Not shared in this workspace')}>{t('Not shared')}</span>;
}

function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="gh-empty">
      <span className="gh-empty-icon" aria-hidden>{icon}</span>
      <strong>{title}</strong><small>{body}</small>
    </div>
  );
}

function ListSkeleton() {
  return <div style={{ display: 'grid', gap: 10 }}>{[0, 1, 2].map((i) => <div key={i} className="g-skeleton" style={{ height: 52 }} />)}</div>;
}

function SectionError({ onRetry, height }: { onRetry: () => void; height?: number }) {
  const { t } = useLanguage();
  return (
    <div className="gh-error" style={{ minHeight: height }} role="status">
      <strong>{t('We could not load this.')}</strong>
      <button type="button" className="g-btn g-btn-ghost" onClick={onRetry}>{t('Try again')}</button>
    </div>
  );
}

