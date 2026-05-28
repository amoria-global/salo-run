'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import type { DetectedCountry } from './types';

/**
 * IP-detect the caller's ISO-2 country (with localStorage caching +
 * manual-override stickiness). Same contract as knockout's copy —
 * the only difference is salo-run uses plain fetch via getApiUrl()
 * instead of an apiClient wrapper.
 */

const STORAGE_KEY = 'payment.country';
const STORAGE_DETECTED_KEY = 'payment.country.detected';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedDetection {
  country: string | null;
  source: DetectedCountry['source'];
  at: number;
}

function readCache(key: string): CachedDetection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDetection;
    if (typeof parsed?.at !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: CachedDetection) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota / disabled */ }
}

export function usePaymentCountry() {
  const [country, setCountryState] = useState<string | null>(null);
  const [source, setSource] = useState<DetectedCountry['source']>('DEFAULT');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const manual = readCache(STORAGE_KEY);
    if (manual?.country) {
      setCountryState(manual.country);
      setSource('MANUAL');
      setSupported(true);
      setLoading(false);
      return;
    }

    const cached = readCache(STORAGE_DETECTED_KEY);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setCountryState(cached.country);
      setSource('CACHED');
      setSupported(!!cached.country);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/remote/public/payments/country`, {
          credentials: 'omit',
        });
        if (cancelled) return;
        const json = await res.json().catch(() => null);
        const data = json?.data as { country: string | null; source: DetectedCountry['source']; supported: boolean } | null;
        const detected = data?.country ?? null;
        const detectedSource = data?.source ?? 'DEFAULT';
        setCountryState(detected);
        setSource(detectedSource);
        setSupported(!!data?.supported);
        writeCache(STORAGE_DETECTED_KEY, { country: detected, source: detectedSource, at: Date.now() });
      } catch {
        if (!cancelled) {
          setCountryState(null);
          setSource('DEFAULT');
          setSupported(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const setCountry = useCallback((iso2: string | null) => {
    setCountryState(iso2);
    setSource(iso2 ? 'MANUAL' : 'DEFAULT');
    setSupported(!!iso2);
    if (iso2) {
      writeCache(STORAGE_KEY, { country: iso2, source: 'MANUAL', at: Date.now() });
    } else if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, []);

  return { country, source, supported, loading, setCountry };
}
