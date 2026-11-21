'use client';

/**
 * The Home "Grow your store" card (A) and its wide desktop layout (D, the same card, laid out wide from 760px).
 * It shows the photographer's share of every photo sale, "X of Y referrals" with a progress bar, how many more
 * unlock the next rate, the "How referrals count" link and the Invite and Milestones actions. At the cap it
 * shows "90% unlocked · Maximum rate active" with "View sale earnings", and the invite is gone for good.
 * Loading and error are designed states, not blank ones.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Info, Sparkles, UserPlus } from 'lucide-react';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { progressPct, targetOf, type ReferralStats } from '@/app/lib/referral';
import type { StatsState } from './useReferralStats';
import { HowItCountsSheet } from './HowReferralsCount';
import InviteSheet from './InviteSheet';

const P = '/user/photographer';

export function GrowCardView({ stats, onInvite, onHow }: { stats: ReferralStats; onInvite: () => void; onHow: () => void }) {
  const rt = useReferralCopy();
  const max = stats.maxRate || stats.qualifying >= stats.cap;
  const target = targetOf(stats.qualifying);
  const more = Math.max(0, target - stats.qualifying);
  return (
    <section className="g-panel gr-card gr-wide-ok" aria-labelledby="gr-title" data-testid="grow-card" data-state={max ? 'max' : 'active'}>
      <div className="gr-head">
        <span className="gr-icon" aria-hidden><Sparkles size={20} /></span>
        <div className="gr-title">
          <strong id="gr-title">{rt('growTitle')}</strong>
          <small>{rt('growSub')}</small>
        </div>
        <Link href={`${P}/milestones`} className="gr-link" data-testid="grow-milestones">{rt('milestones')} <ChevronRight size={14} aria-hidden /></Link>
      </div>
      {max ? (
        <div className="gr-max" data-testid="grow-max">
          <b>{rt('maxTitle')}</b>
        </div>
      ) : (
        <div className="gr-body">
          <div className="gr-rate">
            <b className="g-num" data-testid="grow-rate">{stats.sharePercent}%</b>
            <span>{rt('yourRate')}</span>
          </div>
          <div className="gr-prog">
            <div className="gr-prog-line" data-testid="grow-progress">{rt('progress', { n: stats.qualifying, target })}</div>
            <div className="gr-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct(stats.qualifying)} aria-label={rt('progress', { n: stats.qualifying, target })}>
              <i style={{ width: `${progressPct(stats.qualifying)}%` }} />
            </div>
            <div className="gr-prog-sub" data-testid="grow-more">{rt('moreUnlock', { more, rate: stats.nextSharePercent ?? 90 })}</div>
            <button type="button" className="gr-link" onClick={onHow} data-testid="grow-how">
              <Info size={13} aria-hidden /> {rt('howTitle')}
            </button>
          </div>
        </div>
      )}
      <div className="gr-actions">
        {max ? (
          <Link href={`${P}/transaction`} className="g-btn g-btn-primary" data-testid="grow-view-earnings">{rt('viewSaleEarnings')}</Link>
        ) : (
          <button type="button" className="g-btn g-btn-primary" onClick={onInvite} data-testid="grow-invite">
            <UserPlus size={16} aria-hidden /> {rt('invite')}
          </button>
        )}
      </div>
    </section>
  );
}

export function GrowCardSkeleton() {
  return (
    <section className="g-panel gr-card" aria-busy="true" data-testid="grow-loading">
      <div className="gr-skel">
        <div className="g-skeleton" style={{ height: 40, width: '60%' }} />
        <div className="g-skeleton" style={{ height: 48 }} />
        <div className="g-skeleton" style={{ height: 36 }} />
      </div>
    </section>
  );
}

export default function GrowCard({ state, onRetry }: { state: StatsState; onRetry: () => void }) {
  const rt = useReferralCopy();
  const [invite, setInvite] = useState(false);
  const [how, setHow] = useState(false);
  if (state.status === 'loading') return <GrowCardSkeleton />;
  if (state.status === 'error') {
    return (
      <section className="g-panel gr-card" data-testid="grow-error">
        <div className="gr-err" role="alert">
          <span>{rt('loadError')}</span>
          <button type="button" className="g-btn g-btn-ghost" onClick={onRetry}>{rt('retry')}</button>
        </div>
      </section>
    );
  }
  return (
    <>
      <GrowCardView stats={state.data} onInvite={() => setInvite(true)} onHow={() => setHow(true)} />
      <HowItCountsSheet open={how} onClose={() => setHow(false)} minUsd={state.data.minQualifyingUsd} />
      <InviteSheet open={invite} onClose={() => setInvite(false)} stats={state.data} />
    </>
  );
}
