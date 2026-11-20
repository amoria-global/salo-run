'use client';

/** The Invite a photographer sheet: the share block, or the maximum state when the code has been withdrawn. */
import Modal from '@/app/components/ui/Modal';
import { useReferralCopy } from '@/app/lib/useReferralCopy';
import type { ReferralStats } from '@/app/lib/referral';
import InviteShare from './InviteShare';

export default function InviteSheet({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: ReferralStats }) {
  const rt = useReferralCopy();
  return (
    <Modal isOpen={open} onClose={onClose} size="sm" title={rt('invite')}>
      {stats.code
        ? <InviteShare code={stats.code} link={stats.link} />
        : <p className="gr-foot" data-testid="invite-unavailable">{rt('maxTitle')}</p>}
    </Modal>
  );
}
