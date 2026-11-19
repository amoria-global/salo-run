'use client';

// The wallet pages' load (photographer, client, coordinator), moved verbatim so the classic pages and the Compact
// Glass wallet share one source of truth. `reload` is new and only used by the glass view's Try again.
import { useCallback, useEffect, useState } from 'react';
import { getMyWallet, type WalletDTO } from '@/lib/walletApi';

export function useMyWallet() {
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const w = await getMyWallet();
        if (!cancelled) setWallet(w);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load wallet');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  return { wallet, loading, error, reload };
}
