'use client';

/**
 * Wallet sale details (E): "You earned RWF 7,500 · 75% of a RWF 10,000 photo sale", then the selling price, the rate
 * at sale, the platform share and the confirmed time. The numbers are the snapshot the backend stored when the payment
 * was confirmed, so they never change afterwards and refunds use the same split. Renders nothing when the transaction
 * has no snapshot (not a photo sale, or a sale from before the milestone program).
 */
import { useCurrency } from '@/app/context/CurrencyContext';
import { useReferralCopy } from '@/app/lib/useReferralCopy';

export interface SaleSplit {
  sellingPrice: number;
  ratePercent: number;
  platformShare: number;
  photographerShare: number;
  confirmedAt?: string | null;
  currency?: string;
}

/** Reads the snapshot off a raw transaction row, or null when the backend sent none. */
export function parseSaleSplit(raw: unknown): SaleSplit | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const sellingPrice = n(r.sellingPrice);
  const ratePercent = n(r.ratePercent);
  const platformShare = n(r.platformShare);
  const photographerShare = n(r.photographerShare);
  if (sellingPrice == null || ratePercent == null || platformShare == null || photographerShare == null) return null;
  return {
    sellingPrice, ratePercent, platformShare, photographerShare,
    confirmedAt: typeof r.confirmedAt === 'string' ? r.confirmedAt : null,
    currency: typeof r.currency === 'string' ? r.currency : undefined,
  };
}

export default function SaleSplitDetails({ split }: { split: SaleSplit | null | undefined }) {
  const rt = useReferralCopy();
  const { formatPriceIso } = useCurrency();
  if (!split) return null;
  const money = (v: number) => formatPriceIso(v, split.currency);
  const when = split.confirmedAt ? new Date(split.confirmedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <section className="gr-sale" aria-label={rt('saleYouEarned')} data-testid="sale-split">
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--g-text-muted)' }}>{rt('saleYouEarned')}</div>
        <div className="g-num" style={{ fontSize: '1.6rem', fontWeight: 800 }} data-testid="sale-earned">{money(split.photographerShare)}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--g-text-soft)' }} data-testid="sale-line">{rt('saleLine', { rate: split.ratePercent, sale: money(split.sellingPrice) })}</div>
      </div>
      <div className="gr-sale-row"><span>{rt('saleSellingPrice')}</span><b className="g-num">{money(split.sellingPrice)}</b></div>
      <div className="gr-sale-row"><span>{rt('saleRateAtSale')}</span><b className="g-num">{split.ratePercent}%</b></div>
      <div className="gr-sale-row"><span>{rt('salePlatformShare')}</span><b className="g-num">{money(split.platformShare)}</b></div>
      {when && <div className="gr-sale-row"><span>{rt('saleConfirmed')}</span><b>{when}</b></div>}
      <p className="gr-foot">{rt('saleFootnote')}</p>
    </section>
  );
}
