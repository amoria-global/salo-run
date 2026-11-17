'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

type Store = Pick<Storage, 'getItem' | 'setItem'>;
const keyOf = (userId: string) => `ck:canHost:${userId}`;

/** What this browser remembers for the account: true, false, or null when unknown or storage is blocked. */
export function readHostGuess(store: Store | undefined, userId: string | undefined): boolean | null {
  if (!store || !userId) return null;
  try {
    const v = store.getItem(keyOf(userId));
    return v === null ? null : v === '1';
  } catch { return null; }
}

export function rememberHost(store: Store | undefined, userId: string | undefined, canHost: boolean): void {
  if (!store || !userId) return;
  try { store.setItem(keyOf(userId), canHost ? '1' : '0'); } catch { /* storage blocked */ }
}

const browserStore = (): Store | undefined => { try { return window.localStorage; } catch { return undefined; } };

/**
 * Whether this account could host the last time this browser loaded Home (null when unknown). The hero reserves the
 * Go Live tile space only when tiles are expected, so an account that cannot host does not see the hero shrink and
 * the wallet jump once eligibility arrives (layout shift). Per-browser convenience only.
 */
export function useHostGuess(userId: string | undefined, loaded: boolean, canHost: boolean): boolean | null {
  const [guess, setGuess] = useState<boolean | null>(null);
  useLayoutEffect(() => { setGuess(readHostGuess(browserStore(), userId)); }, [userId]);
  useEffect(() => { if (loaded) rememberHost(browserStore(), userId, canHost); }, [userId, loaded, canHost]);
  return guess;
}
