'use client';

/**
 * The Milestones page (B, in the dashboard shell): current rate, progress, the money example in the viewer's
 * currency, the "How referrals count" card, the five tier rows, the invite block, the referral list with per-referral
 * progress, pending and under-review counts, the Program rules link and a store stats strip. Loading, empty and error
 * states are designed. Store stats show only what the existing endpoints provide.
 */
import Link from 'next/link';
import { Check, Lock, Sparkles } from 'lucide-react';
import { Money } from '@/app/components/glass/Money';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { exampleSale, extraOnSale, progressPct, targetOf, tiers, type ReferralStats } from '@/app/lib/referral';
import { useResource } from '@/app/components/glass/home/useHomeData';
import { HowItCountsCard } from './HowReferralsCount';
import InviteShare from './InviteShare';
import ReferralList from './ReferralList';
import { useReferralStats } from './useReferralStats';

const POLICY_URL = 'https://connekyt.com/referral-program';

interface StoreStats { earnings: number | null; earningsCurrency?: string; available: number | null; photosSold: number | null; topAlbum: string | null }

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="gr-stat"><small>{label}</small><b className="g-num">{children}</b></div>;
}

export function StoreStatsStrip({ stats }: { stats: StoreStats }) {
  const rt = useReferralCopy();
  return (
    <section aria-labelledby="gr-store" style={{ display: 'grid', gap: 8 }} data-testid="store-stats">
      <h2 id="gr-store" className="gr-h2">{rt('storeStats')}</h2>
      <div className="gr-stats">
        {stats.earnings != null && <StatTile label={rt('statEarnings')}><Money amount={stats.earnings} from={stats.earningsCurrency} /></StatTile>}
        {stats.photosSold != null && <StatTile label={rt('statPhotosSold')}>{stats.photosSold}</StatTile>}
        {stats.available != null && <StatTile label={rt('statAvailable')}><Money amount={stats.available} /></StatTile>}
        {stats.topAlbum && <StatTile label={rt('statTopAlbum')}>{stats.topAlbum}</StatTile>}
      </div>
    </section>
  );
}

export function MilestonesView({ stats, store }: { stats: ReferralStats; store: StoreStats }) {
  const rt = useReferralCopy();
  const { currency, formatPriceIso } = useCurrency();
  const max = stats.maxRate || stats.qualifying >= stats.cap;
  const target = targetOf(stats.qualifying);
  const more = Math.max(0, target - stats.qualifying);
  const sale = exampleSale(currency);
  const extra = extraOnSale(stats.sharePercent, stats.nextSharePercent, sale);
  const rows = tiers(stats.qualifying);

  return (
    <div className="gr-page" data-testid="milestones-page">
      <section className="g-panel gr-hero" aria-labelledby="gr-rate-h">
        <span className="gr-eyebrow">{rt('yourRate')}</span>
        <div className="gr-big g-num" id="gr-rate-h" data-testid="ms-rate">{stats.sharePercent}%<small>{rt('ofEvery')}</small></div>
        {max ? (
          <div className="gr-more" data-testid="ms-max">{rt('maxTitle')}</div>
        ) : (
          <>
            <div style={{ fontWeight: 700 }} data-testid="ms-progress">{rt('progressQualified', { n: stats.qualifying, target })}</div>
            <div className="gr-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct(stats.qualifying)} aria-label={rt('progressQualified', { n: stats.qualifying, target })}>
              <i style={{ width: `${progressPct(stats.qualifying)}%` }} />
            </div>
            <div className="gr-more" data-testid="ms-more">{rt('moreReferralsUnlock', { more, rate: stats.nextSharePercent ?? 90 })}</div>
            {extra != null && (
              <div className="gr-foot" data-testid="ms-example">{rt('moneyExample', { amount: formatPriceIso(extra, currency), sale: formatPriceIso(sale, currency) })}</div>
            )}
          </>
        )}
      </section>

      <HowItCountsCard minUsd={stats.minQualifyingUsd} />

      <section aria-labelledby="gr-tiers-h" style={{ display: 'grid', gap: 8 }}>
        <h2 id="gr-tiers-h" className="gr-h2">{rt('earningsMilestones')}</h2>
        <div className="gr-tiers">
          {rows.map((t) => {
            const sub = t.share === 70
              ? (t.state === 'current' ? rt('tierCurrent', { n: stats.qualifying, target }) : rt('tierStarting'))
              : t.share === 90 ? rt('tierMax')
              : t.state === 'current' ? rt('tierCurrent', { n: stats.qualifying, target })
              : t.state === 'locked' && t.from === stats.nextMilestone ? rt('tierMoreToUnlock', { more })
              : t.state === 'locked' ? rt('tierLocked') : rt('tierRange', { from: t.from, to: t.to });
            return (
              <div key={t.share} className="gr-tier" data-state={t.state} data-testid="tier-row" aria-current={t.state === 'current' ? 'true' : undefined}>
                <span className="pct g-num">{t.share}%</span>
                <span className="txt">
                  <strong>{t.share === 90 ? rt('tierExact', { n: 40 }) : rt('tierRange', { from: t.from, to: t.to })}</strong>
                  <small>{sub}</small>
                </span>
                <span className="state" aria-hidden>
                  {t.state === 'done' ? <Check size={18} /> : t.state === 'locked' ? <Lock size={16} /> : t.share === 90 ? <Sparkles size={18} /> : <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--g-accent)', display: 'inline-block' }} />}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {!max && (
        <section className="g-panel" style={{ padding: 14, display: 'grid', gap: 8 }} aria-labelledby="gr-invite-h">
          <h2 id="gr-invite-h" className="gr-h2">{rt('invite')}</h2>
          <InviteShare code={stats.code} link={stats.link} />
          <div className="gr-foot" data-testid="ms-counts">
            {rt('pendingCount', { n: stats.pending })} · {rt('reviewCount', { n: stats.underReview })} · <a className="gr-link" href={POLICY_URL} target="_blank" rel="noopener noreferrer">{rt('programRules')}</a>
          </div>
        </section>
      )}
      {max && (
        <p className="gr-foot"><a className="gr-link" href={POLICY_URL} target="_blank" rel="noopener noreferrer">{rt('programRules')}</a> · <Link className="gr-link" href="/user/photographer/transaction">{rt('viewSaleEarnings')}</Link></p>
      )}

      <section aria-labelledby="gr-list-h" style={{ display: 'grid', gap: 8 }}>
        <h2 id="gr-list-h" className="gr-h2">{rt('milestones')}</h2>
        <ReferralList rows={stats.referrals} />
      </section>

      <StoreStatsStrip stats={store} />
    </div>
  );
}

export default function MilestonesPage() {
  const rt = useReferralCopy();
  const [state, reload] = useReferralStats();
  const [trends] = useResource<Record<string, { value?: number | null; currency?: string }>>('/api/remote/photographer/analytics/trends?period=month');
  const [wallet] = useResource<{ balanceAvailable?: number }>('/api/remote/wallet/me');

  if (state.status === 'loading') {
    return (
      <div className="gr-page" aria-busy="true" data-testid="milestones-loading">
        <div className="g-skeleton" style={{ height: 160, borderRadius: 18 }} />
        <div className="g-skeleton" style={{ height: 120 }} />
        <div className="g-skeleton" style={{ height: 220 }} />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="gr-page">
        <div className="g-panel gr-card" data-testid="milestones-error">
          <div className="gr-err" role="alert"><span>{rt('loadError')}</span><button type="button" className="g-btn g-btn-ghost" onClick={reload}>{rt('retry')}</button></div>
        </div>
      </div>
    );
  }
  const t = trends.status === 'ready' ? trends.data?.totalEarnings : undefined;
  const store: StoreStats = {
    earnings: t && typeof t.value === 'number' ? t.value : null,
    earningsCurrency: t?.currency,
    available: wallet.status === 'ready' && typeof wallet.data?.balanceAvailable === 'number' ? wallet.data.balanceAvailable : null,
    // No existing endpoint reports photos sold or the top-selling album yet: the tiles stay hidden until the backend does.
    photosSold: null,
    topAlbum: null,
  };
  return <MilestonesView stats={state.data} store={store} />;
}
