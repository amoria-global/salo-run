'use client';

/**
 * The referred photographer's checklist on Home: "Help {referrer} unlock rewards: verify your account, publish your
 * first photo, make your first sale". Shown only while their referral has not qualified or been revoked, and it shows
 * the referrer's display name only. It disappears when the referral qualifies.
 */
import { Check, Circle, Gift } from 'lucide-react';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import type { MyReferral } from '@/app/lib/referral';

export function showReferredCard(my: MyReferral | null | undefined): boolean {
  return !!my && !!my.referrerName && my.status !== 'qualified' && my.status !== 'revoked';
}

export default function ReferredChecklistCard({ mine }: { mine: MyReferral | null | undefined }) {
  const rt = useReferralCopy();
  if (!showReferredCard(mine) || !mine) return null;
  const steps = [
    { on: mine.verifiedPublished, label: rt('checkVerified') },
    { on: mine.firstSale, label: rt('checkFirstSale') },
  ];
  return (
    <section className="g-panel gr-card" aria-labelledby="gr-ref-title" data-testid="referred-card">
      <div className="gr-head">
        <span className="gr-icon" aria-hidden><Gift size={20} /></span>
        <div className="gr-title">
          <strong id="gr-ref-title">{rt('referredCardTitle', { referrer: mine.referrerName ?? '' })}</strong>
          <small>{rt('referredCardSteps')}</small>
        </div>
      </div>
      <div className="gr-checks" role="list">
        {steps.map((s) => (
          <span key={s.label} role="listitem" data-on={s.on} data-testid="referred-step">
            {s.on ? <Check size={13} aria-hidden /> : <Circle size={11} aria-hidden />} {s.label}
          </span>
        ))}
      </div>
    </section>
  );
}
