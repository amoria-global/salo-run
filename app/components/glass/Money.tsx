'use client';

import { useCurrency } from '@/app/context/CurrencyContext';

/**
 * An amount in the viewer's display currency, with its ISO code (the mobile rule, lib/currencyRates moneyParts):
 * "RWF 1,647", "$25.00". The code is set smaller than the number so the figure leads.
 */
export function Money({ amount, from, size = 'inherit' }: { amount: number; from?: string; size?: string }) {
  const { priceParts } = useCurrency();
  const p = priceParts(amount, from);
  return (
    <span className="g-num" style={{ fontSize: size, whiteSpace: 'nowrap' }} aria-label={p.tight ? `${p.prefix}${p.text}` : `${p.prefix} ${p.text}`}>
      {p.tight
        ? <>{p.prefix}{p.text}</>
        : <><span style={{ fontSize: '0.72em', fontWeight: 600, color: 'var(--g-text-soft)' }}>{p.prefix} </span>{p.text}</>}
    </span>
  );
}
