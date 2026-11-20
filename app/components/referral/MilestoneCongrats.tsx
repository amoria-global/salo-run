'use client';

/**
 * The milestone congratulations sheet (C). Shown once, on the next dashboard open after 10, 20, 30 or 40 qualified
 * referrals: the server reports the unseen milestone in stats.unlocked, and closing the sheet tells the server so it
 * is not offered again. At 40 it says "Maximum rate unlocked".
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, UserPlus } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import { ackMilestone, CAP, type ReferralStats } from '@/app/lib/referral';
import InviteSheet from './InviteSheet';

export function MilestoneCongratsView({ stats, onClose, onInvite }: { stats: ReferralStats; onClose: () => void; onInvite: () => void }) {
  const rt = useReferralCopy();
  const u = stats.unlocked;
  if (!u) return null;
  const max = u.milestone >= CAP;
  const nextShare = stats.nextSharePercent ?? 90;
  const more = stats.nextMilestone != null ? Math.max(0, stats.nextMilestone - stats.qualifying) : 0;
  return (
    <Modal isOpen onClose={onClose} size="sm">
      <div className="gr-congrats" data-testid="milestone-congrats">
        <span className="gr-star" aria-hidden><Sparkles size={34} /></span>
        <span className="gr-eyebrow">{rt('congratsEyebrow')}</span>
        <h2>{max ? rt('congratsMaxTitle') : rt('congratsTitle', { rate: u.sharePercent })}</h2>
        <p className="gr-foot">
          {max ? rt('congratsMaxBody') : rt('congratsBody', { milestone: u.milestone, more, next: nextShare })}
        </p>
        {!max && stats.code && (
          <button type="button" className="g-btn g-btn-primary" onClick={onInvite} style={{ width: '100%', justifyContent: 'center' }}>
            <UserPlus size={16} aria-hidden /> {rt('inviteMore')}
          </button>
        )}
        <Link href="/user/photographer/milestones" className="gr-link" onClick={onClose}>{rt('viewMilestones')}</Link>
      </div>
    </Modal>
  );
}

/** Mounts the sheet when the server reports an unseen milestone, and acknowledges it once on close. */
export default function MilestoneCongrats({ stats }: { stats: ReferralStats | null }) {
  const [closed, setClosed] = useState(false);
  const [invite, setInvite] = useState(false);
  const acked = useRef(false);
  const open = !!stats?.unlocked && !closed;

  const close = () => {
    setClosed(true);
    if (!acked.current) { acked.current = true; void ackMilestone(); }
  };
  // Opening alone counts as seeing it: a crash or a tab close must not show it forever.
  useEffect(() => {
    if (open && !acked.current) { acked.current = true; void ackMilestone(); }
  }, [open]);

  if (!stats) return null;
  return (
    <>
      {open && <MilestoneCongratsView stats={stats} onClose={close} onInvite={() => { close(); setInvite(true); }} />}
      <InviteSheet open={invite} onClose={() => setInvite(false)} stats={stats} />
    </>
  );
}
