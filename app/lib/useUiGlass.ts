'use client';

import { useSyncExternalStore } from 'react';
import { isGlassDocument } from './glassColors';

const noop = () => () => {};

/**
 * Whether this page was served with the Compact Glass UI. The class is set by the head script before React hydrates
 * and never changes during a visit, so there is nothing to subscribe to. The server snapshot is false, so markup that
 * depends on it renders after hydration rather than mismatching it.
 */
export function useUiGlass(): boolean {
  return useSyncExternalStore(noop, isGlassDocument, () => false);
}
