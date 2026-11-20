'use client';

/**
 * The referrer's list: each referral shows its own progress as three small checks (Signed up, Verified & published,
 * First sale), a status chip and a one-line hint. Under review and revoked rows show only the neutral line, never
 * which check was involved. Empty state is designed.
 */
import { Check, Circle } from 'lucide-react';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { hintKey, statusKey, type ReferralRow } from '@/app/lib/referral';

function CheckItem({ on, label }: { on: boolean; label: string }) {
  return (
    <span data-on={on} data-testid="ref-check">
      {on ? <Check size={13} aria-hidden /> : <Circle size={11} aria-hidden />} {label}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{on ? ' (done)' : ' (waiting)'}</span>
    </span>
  );
}

export function ReferralRowView({ row }: { row: ReferralRow }) {
  const rt = useReferralCopy();
  const quiet = row.status === 'under_review' || row.status === 'revoked';
  return (
    <li className="gr-ref" data-testid="referral-row" data-status={row.status}>
      <div className="gr-ref-top">
        <strong>{row.name}</strong>
        <span className="gr-chip" data-s={row.status} data-testid="referral-status">{rt(statusKey(row.status))}</span>
      </div>
      {!quiet && (
        <div className="gr-checks" aria-label={rt('howTitle')}>
          <CheckItem on={row.signedUp} label={rt('checkSignedUp')} />
          <CheckItem on={row.verifiedPublished} label={rt('checkVerified')} />
          <CheckItem on={row.firstSale} label={rt('checkFirstSale')} />
        </div>
      )}
      <p className="gr-hint" data-testid="referral-hint">{rt(hintKey(row.hint))}</p>
    </li>
  );
}

export default function ReferralList({ rows }: { rows: ReferralRow[] }) {
  const rt = useReferralCopy();
  if (rows.length === 0) {
    return (
      <div className="gr-empty" data-testid="referral-empty">
        <strong>{rt('emptyTitle')}</strong>
        <span>{rt('emptyBody')}</span>
      </div>
    );
  }
  return <ul className="gr-refs">{rows.map((r, i) => <ReferralRowView key={`${r.name}-${r.date}-${i}`} row={r} />)}</ul>;
}
