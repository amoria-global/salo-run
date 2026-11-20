'use client';

/**
 * "How referrals count": the three numbered steps and the footer, in one card (Milestones, Program rules) and in a
 * sheet (opened from the Home card's info link). The wording is the shared contract/referral-copy.json text, and the
 * minimum is shown in the viewer's currency.
 */
import { Info } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useReferralCopy } from '@/app/lib/useReferralCopy';

export const DEFAULT_MIN_USD = 5;

export function HowItCountsBody({ minUsd = DEFAULT_MIN_USD }: { minUsd?: number }) {
  const rt = useReferralCopy();
  const { formatPrice } = useCurrency();
  return (
    <div data-testid="how-it-counts">
      <ol className="gr-steps">
        <li><span className="n" aria-hidden>1</span><span>{rt('step1')}</span></li>
        <li><span className="n" aria-hidden>2</span><span>{rt('step2')}</span></li>
        <li><span className="n" aria-hidden>3</span><span>{rt('step3', { min: formatPrice(minUsd) })}</span></li>
      </ol>
      <p className="gr-foot" style={{ marginTop: 10 }}>{rt('stepsFooter')}</p>
    </div>
  );
}

export function HowItCountsCard({ minUsd }: { minUsd?: number }) {
  const rt = useReferralCopy();
  return (
    <section className="g-panel" style={{ padding: 14, display: 'grid', gap: 10 }} aria-labelledby="gr-how-title">
      <h2 id="gr-how-title" className="gr-h2">{rt('howTitle')}</h2>
      <HowItCountsBody minUsd={minUsd} />
    </section>
  );
}

export function HowItCountsSheet({ open, onClose, minUsd }: { open: boolean; onClose: () => void; minUsd?: number }) {
  const rt = useReferralCopy();
  return (
    <Modal isOpen={open} onClose={onClose} size="sm" title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Info size={16} aria-hidden /> {rt('howTitle')}</span>}>
      <HowItCountsBody minUsd={minUsd} />
    </Modal>
  );
}
