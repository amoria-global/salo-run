'use client';

/**
 * The client and event-coordinator Homes in Compact Glass (Stage 2, behind the flag). The same endpoints, permissions
 * and actions as the old Homes (pages/client/home.tsx, pages/event-coordinator/home.tsx), laid out like the
 * photographer Home: hero with the role's actions and the Go live / My hosted events tiles, wallet card with the real
 * Withdraw modal, one period switch for the cards and the chart, Upcoming, and Recent activity. Each section has its
 * own skeleton, empty and error state.
 */
import { useMemo, useState } from 'react';
import { useHostGuess } from './useHostGuess';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CalendarDays, ChevronRight, CircleDollarSign, Clock3, Gift, History, Layers, Plus, Radio, Search, Star, Users } from 'lucide-react';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useTheme } from '@/app/context/ThemeContext';
import { useHostEntry } from '@/app/components/useHostEntry';
// Loaded only when Withdraw is opened.
const WithdrawModal = dynamic(() => import('@/app/components/WithdrawModal'), { ssr: false });
import { Money } from '../Money';
import { greetingKey, trendChip, upcoming, type Chip, type Period, type RawEvent, type Trend } from './homeData';
import { Empty, Kpi, ListSkeleton, SectionError, StatusChip } from './HomeParts';
import { useResource, type PerfPoint, type Wallet } from './useHomeData';

const PerformanceChart = dynamic(() => import('./PerformanceChart'), {
  ssr: false,
  loading: () => <div className="g-skeleton" style={{ height: 240 }} />,
});

type RoleKey = 'client' | 'event-coordinator';

interface Kpis { key: string; label: string; icon: React.ReactNode; tone: 'info' | 'pending' | 'accent' | 'warning'; money: boolean; value: (a: Rec, t: Rec) => number; trend?: string }
type Rec = Record<string, Trend | number | undefined>;

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);
const tv = (t: Rec, k: string) => (t[k] as Trend | undefined)?.value;

const CONFIG = {
  client: {
    base: '/user/client',
    eyebrow: 'Your dashboard',
    analytics: '/api/remote/customer/analytics',
    trends: (q: string) => `/api/remote/customer/analytics/trends?${q}`,
    performance: (q: string) => `/api/remote/customer/analytics/performance?${q}`,
    events: '/api/remote/customer/events?page=0&size=100',
    activity: '/api/remote/customer/analytics/recent-activities?size=6',
    chartMoney: 'Spending', chartCount: 'Bookings', chartSub: 'Spending and bookings in this period',
    actions: [
      { href: '/user/client/photographers', label: 'Find a Photographer', icon: <Search size={16} aria-hidden />, primary: true },
      { href: '/user/client/events?post=1', label: 'Post My Event', icon: <Plus size={16} aria-hidden />, primary: false },
    ],
    kpis: [
      { key: 'spent', label: 'Total spent', icon: <CircleDollarSign size={16} />, tone: 'info', money: true, trend: 'totalSpent', value: (a, t) => num(tv(t, 'totalSpent') ?? a.totalSpent) },
      { key: 'pending', label: 'Pending', icon: <Clock3 size={16} />, tone: 'pending', money: true, trend: 'pending', value: (a, t) => num(tv(t, 'pending') ?? a.pendingAmount) },
      { key: 'bookings', label: 'Bookings', icon: <Users size={16} />, tone: 'accent', money: false, trend: 'bookings', value: (a, t) => num(tv(t, 'bookings') ?? a.totalBookings) },
      { key: 'gifts', label: 'Gifts', icon: <Gift size={16} />, tone: 'info', money: true, trend: 'gifts', value: (a, t) => num(tv(t, 'gifts') ?? a.gifts) },
      { key: 'favorites', label: 'Favorites', icon: <Star size={16} />, tone: 'warning', money: false, trend: 'favorites', value: (a) => num(a.bookmarkedPhotographers) },
    ] as Kpis[],
  },
  'event-coordinator': {
    base: '/user/event-coordinator',
    eyebrow: 'Coordinator dashboard',
    analytics: '/api/remote/coordinator/analytics',
    trends: (q: string) => `/api/remote/coordinator/analytics/trends?${q}`,
    performance: (q: string) => `/api/remote/coordinator/analytics/performance?${q}`,
    events: '/api/remote/coordinator/events?page=0&size=100',
    activity: '/api/remote/coordinator/notifications?page=0&size=6',
    chartMoney: 'Revenue', chartCount: 'Events', chartSub: 'Revenue and events in this period',
    actions: [
      { href: '/user/event-coordinator/events?post=1', label: 'Post My Event', icon: <Plus size={16} aria-hidden />, primary: true },
      { href: '/user/event-coordinator/photographers', label: 'Find a Photographer', icon: <Search size={16} aria-hidden />, primary: false },
      { href: '/user/event-coordinator/streams', label: 'Streams', icon: <Radio size={16} aria-hidden />, primary: false },
    ],
    kpis: [
      { key: 'revenue', label: 'Total revenue', icon: <CircleDollarSign size={16} />, tone: 'info', money: true, trend: 'totalRevenue', value: (a, t) => num(tv(t, 'totalRevenue') ?? a.totalRevenue) },
      { key: 'pending', label: 'Pending', icon: <Clock3 size={16} />, tone: 'pending', money: true, trend: 'pending', value: (a, t) => num(tv(t, 'pending') ?? a.totalPending) },
      { key: 'events', label: 'Events', icon: <CalendarDays size={16} />, tone: 'accent', money: false, trend: 'events', value: (a, t) => num(tv(t, 'events') ?? a.totalEvents) },
      { key: 'streams', label: 'Stream fees', icon: <Radio size={16} />, tone: 'info', money: true, trend: 'streamFees', value: (_a, t) => num(tv(t, 'streamFees')) },
      { key: 'photographers', label: 'Photographers', icon: <Star size={16} />, tone: 'warning', money: false, trend: 'photographers', value: (a, t) => num(tv(t, 'photographers') ?? a.totalPhotographers) },
    ] as Kpis[],
  },
} as const;

interface ActivityItem { id?: string; type?: string; title?: string; message?: string; createdAt?: string }

export default function RoleHome({ role }: { role: RoleKey }) {
  const cfg = CONFIG[role];
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  const { isCollaborator } = useWorkspace();
  const { canHost, caption: hostedCaption, loaded: hostLoaded } = useHostEntry();
  const hostGuess = useHostGuess(user?.id, hostLoaded, canHost);

  const [period, setPeriod] = useState<Period>('week');
  const [range, setRange] = useState({ from: '', to: '' });
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const custom = period === 'custom' && range.from && range.to;
  const tq = custom ? `period=custom&from=${range.from}&to=${range.to}` : `period=${period === 'custom' ? 'week' : period}`;
  const pq = custom ? `period=custom&startDate=${range.from}&endDate=${range.to}` : `period=${period === 'custom' ? 'week' : period}`;

  const [analytics] = useResource<Rec>(cfg.analytics);
  const [trends, retryTrends] = useResource<Record<string, Trend>>(cfg.trends(tq));
  const [perf, retryPerf] = useResource<PerfPoint[]>(cfg.performance(pq));
  const [events, retryEvents] = useResource<RawEvent[] | { content: RawEvent[] }>(cfg.events);
  const [acts, retryActs] = useResource<ActivityItem[] | { content: ActivityItem[] }>(cfg.activity);
  const [wallet, retryWallet] = useResource<Wallet>(isCollaborator ? null : '/api/remote/wallet/me');

  const today = useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, []);
  const eventList = events.status === 'ready' ? (Array.isArray(events.data) ? events.data : events.data?.content ?? []) : [];
  const next = upcoming(eventList, today, language);
  const actList = acts.status === 'ready' ? (Array.isArray(acts.data) ? acts.data : acts.data?.content ?? []) : [];
  const a = analytics.status === 'ready' ? analytics.data : {};
  const tr = (trends.status === 'ready' ? trends.data : {}) as unknown as Rec;
  const chipFor = (k?: string): Chip => (k ? trendChip((tr as Record<string, Trend>)[k]) : null);
  const firstName = user?.firstName || '';

  return (
    <div className="gh">
      <div className="gh-top">
        <section className="g-panel gh-hero" aria-labelledby="gh-greeting">
          <div className="gh-hero-text">
            <div className="gh-eyebrow">{t(cfg.eyebrow)}</div>
            <h1 id="gh-greeting" className="g-display gh-h1">
              {t(greetingKey(new Date().getHours()))}{firstName ? ', ' : ''}<span className="gh-name">{firstName}</span>
            </h1>
            <p className="gh-sub">{events.status === 'ready' ? `${t('Upcoming')}: ${next.length}` : ' '}</p>
            <div className="gh-actions">
              {cfg.actions.map((x) => (
                <Link key={x.href} href={x.href} className={`g-btn ${x.primary ? 'g-btn-primary' : 'g-btn-ghost'}`}>{x.icon} {t(x.label)}</Link>
              ))}
            </div>
          </div>
          {!hostLoaded && hostGuess !== false && <div className="gh-tiles gh-tiles-wait" aria-hidden><div className="g-skeleton" /><div className="g-skeleton" /></div>}
          {canHost && (
            <div className="gh-tiles">
              <Link href={`${cfg.base}/host?new=1`} className="gh-tile gh-tile-live">
                <span className="gh-tile-icon" aria-hidden><Radio size={18} /></span>
                <span className="gh-tile-text"><strong>{t('Go Live')}</strong><small>{t('Host your own event')}</small></span>
                <ChevronRight size={16} aria-hidden />
              </Link>
              <Link href={`${cfg.base}/host`} className="gh-tile gh-tile-hosted">
                <span className="gh-tile-icon" aria-hidden><Layers size={18} /></span>
                <span className="gh-tile-text"><strong>{t('My hosted events')}</strong><small className="g-ellipsis">{hostedCaption}</small></span>
                <ChevronRight size={16} aria-hidden />
              </Link>
            </div>
          )}
        </section>

        <section className="gh-wallet" aria-label={t('Wallet balance')}>
          <div className="gh-wallet-head"><span>{t('Wallet balance')}</span><span className="gh-pill">{currency}</span></div>
          {wallet.status === 'loading' && <div className="g-skeleton" style={{ height: 40, width: '60%', opacity: 0.4 }} />}
          {wallet.status === 'error' && <button type="button" className="gh-wallet-retry" onClick={retryWallet}>{t('Could not load your balance. Try again')}</button>}
          {wallet.status === 'ready' && (
            <div className="g-num gh-wallet-amount"><Money amount={num(wallet.data.balanceAvailable)} /></div>
          )}
          <div className="gh-wallet-actions">
            <button type="button" className="g-btn gh-btn-white" onClick={() => setWithdrawOpen(true)}>{t('Withdraw')}</button>
            <Link href={`${cfg.base}/payments`} className="g-btn gh-btn-glass"><History size={16} aria-hidden /> {t('Payment history')}</Link>
          </div>
        </section>
      </div>

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

      {trends.status === 'error' ? <SectionError onRetry={retryTrends} /> : (
        <div className="gh-kpis gh-kpis-auto">
          {cfg.kpis.map((k) => {
            const v = k.value(a, tr);
            return (
              <Kpi key={k.key} icon={k.icon} tone={k.tone} label={t(k.label)} loading={trends.status === 'loading' && analytics.status === 'loading'}
                value={k.money ? <Money amount={v} /> : <span className="g-num">{v}</span>} chip={chipFor(k.trend)} goal={null} />
            );
          })}
        </div>
      )}

      <div className="gh-grid">
        <section className="g-panel gh-card" aria-labelledby="gh-perf">
          <div className="gh-card-head">
            <div><h2 id="gh-perf" className="g-display gh-h3">{t('Performance')}</h2><p className="gh-muted">{t(cfg.chartSub)}</p></div>
            <div className="gh-legend" aria-hidden>
              <span><i className="gh-dot-earn" /> {t(cfg.chartMoney)}</span><span><i className="gh-dot-book" /> {t(cfg.chartCount)}</span>
            </div>
          </div>
          {perf.status === 'loading' && <div className="g-skeleton" style={{ height: 240 }} />}
          {perf.status === 'error' && <SectionError onRetry={retryPerf} height={240} />}
          {perf.status === 'ready' && <PerformanceChart points={Array.isArray(perf.data) ? perf.data : []} moneyLabel={cfg.chartMoney} countLabel={cfg.chartCount} />}
        </section>

        <section className="g-panel gh-card" aria-labelledby="gh-up">
          <div className="gh-card-head">
            <h2 id="gh-up" className="g-display gh-h3">{t('Upcoming')}</h2>
            <Link href={`${cfg.base}/events`} className="gh-link">{t('See all')}</Link>
          </div>
          {events.status === 'loading' && <ListSkeleton />}
          {events.status === 'error' && <SectionError onRetry={retryEvents} />}
          {events.status === 'ready' && next.length === 0 && <Empty icon={<CalendarDays size={22} />} title={t('No upcoming events')} body={t('New bookings will appear here.')} />}
          {events.status === 'ready' && next.length > 0 && (
            <ul className="gh-list">
              {next.map((e) => (
                <li key={e.id}>
                  <Link href={`${cfg.base}/events/${e.id}`} className="gh-row">
                    <span className="gh-date"><strong className="g-num">{e.day}</strong><small>{e.month}</small></span>
                    <span className="gh-row-text"><strong className="g-ellipsis">{e.title}</strong><small className="g-ellipsis">{[e.time, e.place].filter(Boolean).join(' · ') || ' '}</small></span>
                    <StatusChip tone={e.status === 'live' ? 'live' : e.status === 'pending' ? 'pending' : 'info'} label={t(e.status === 'live' ? 'Live' : e.status === 'pending' ? 'Pending' : 'Upcoming')} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="g-panel gh-card" aria-labelledby="gh-act">
        <div className="gh-card-head">
          <h2 id="gh-act" className="g-display gh-h3">{t('Recent activity')}</h2>
          <Link href={`${cfg.base}/notifications`} className="gh-link">{t('See all')}</Link>
        </div>
        {acts.status === 'loading' && <ListSkeleton />}
        {acts.status === 'error' && <SectionError onRetry={retryActs} />}
        {acts.status === 'ready' && actList.length === 0 && <Empty icon={<History size={22} />} title={t('Nothing in the last 30 days')} body={t('Payments and event updates will appear here.')} />}
        {acts.status === 'ready' && actList.length > 0 && (
          <ul className="gh-list">
            {actList.slice(0, 6).map((x, i) => (
              <li key={x.id || i}>
                <div className="gh-row">
                  <span className="gh-act-icon gh-tone-info" aria-hidden><CalendarDays size={16} /></span>
                  <span className="gh-row-text"><strong className="g-ellipsis">{x.title || x.message || ''}</strong><small className="g-ellipsis">{x.type ? x.type.charAt(0) + x.type.slice(1).toLowerCase() : t('Event')}</small></span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {withdrawOpen && <WithdrawModal isOpen={withdrawOpen} onClose={() => { setWithdrawOpen(false); retryWallet(); }} role={role}
        colors={colors as unknown as Record<string, string>} actualTheme={actualTheme} />}
    </div>
  );
}
