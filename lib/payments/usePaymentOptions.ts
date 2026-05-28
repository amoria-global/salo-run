'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import type { PaymentOptions } from './types';

/**
 * Fetches operators + currency for one country. Mirrors knockout's
 * hook. In-memory cache by country so reopening the same modal in the
 * same session doesn't re-hit the backend.
 */

const memCache = new Map<string, PaymentOptions>();

export function usePaymentOptions(country: string | null) {
  const [options, setOptions] = useState<PaymentOptions | null>(country ? memCache.get(country) ?? null : null);
  const [loading, setLoading] = useState<boolean>(!!country && !memCache.has(country));
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(country ? memCache.has(country) : false);

  useEffect(() => {
    if (!country) {
      setOptions(null);
      setSupported(false);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = memCache.get(country);
    if (cached) {
      setOptions(cached);
      setSupported(true);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/api/remote/public/payments/options?country=${encodeURIComponent(country)}`,
          { credentials: 'omit' }
        );
        if (cancelled) return;
        const json = await res.json().catch(() => null);
        const data = json?.data as PaymentOptions | null;
        if (json?.action === 1 && data?.operators) {
          memCache.set(country, data);
          setOptions(data);
          setSupported(true);
        } else {
          setOptions(null);
          setSupported(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load payment options');
        setOptions(null);
        setSupported(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [country]);

  return { options, loading, error, supported };
}
