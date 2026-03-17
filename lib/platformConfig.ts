/**
 * Platform configuration fetched from backend.
 * Replaces hardcoded business values across the dashboard.
 */

import { getApiUrl } from './api';

export interface StoragePlan {
  id: string;
  name: string;
  price: number;
  currencyId: string;
  description: string;
  durationMonths?: number;
  billingCycle?: 'monthly' | 'yearly';
  cancelAfterMonths?: number;
  savingsPercent?: number;
}

export interface PlatformConfig {
  photographer: {
    bonusThreshold: number;
    bonusAmount: number;
    bonusCurrencyId: string;
    albumEditWindowDays: number;
  };
  gallery: {
    archiveExpiryDays: number;
    archiveWarningDays: number;
    storagePlans: StoragePlan[];
  };
  streaming: {
    groupSize: number;
  };
  security: {
    sessionTimeoutMs: number;
    sessionCheckIntervalMs: number;
  };
  uploads: {
    maxImageSizeMb: number;
  };
}

// Default fallback values (used if API fails)
export const DEFAULT_CONFIG: PlatformConfig = {
  photographer: {
    bonusThreshold: 10,
    bonusAmount: 50000,
    bonusCurrencyId: 'RWF',
    albumEditWindowDays: 7,
  },
  gallery: {
    archiveExpiryDays: 365,
    archiveWarningDays: 30,
    storagePlans: [
      { id: 'one-time', name: 'One-Time', price: 40, currencyId: 'USD', durationMonths: 5, description: '5 months access' },
      { id: 'archive-plus', name: 'Archive Plus', price: 14.99, currencyId: 'USD', billingCycle: 'monthly', cancelAfterMonths: 4, description: 'Cancel after 4 months' },
      { id: 'archive-pro', name: 'Archive Pro', price: 139.99, currencyId: 'USD', billingCycle: 'yearly', savingsPercent: 22, description: 'Best value — save 22%' },
    ],
  },
  streaming: { groupSize: 5 },
  security: { sessionTimeoutMs: 3600000, sessionCheckIntervalMs: 60000 },
  uploads: { maxImageSizeMb: 5 },
};

let cachedConfig: PlatformConfig | null = null;
let fetchPromise: Promise<PlatformConfig> | null = null;

/**
 * Fetch platform config from backend (cached after first call).
 */
export async function fetchPlatformConfig(): Promise<PlatformConfig> {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/remote/public/platform/config`);
      if (res.ok) {
        const result = await res.json();
        if (result.action === 1 && result.data) {
          cachedConfig = {
            photographer: { ...DEFAULT_CONFIG.photographer, ...result.data.photographer },
            gallery: {
              ...DEFAULT_CONFIG.gallery,
              ...result.data.gallery,
              storagePlans: result.data.gallery?.storagePlans?.length > 0
                ? result.data.gallery.storagePlans
                : DEFAULT_CONFIG.gallery.storagePlans,
            },
            streaming: { ...DEFAULT_CONFIG.streaming, ...result.data.streaming },
            security: { ...DEFAULT_CONFIG.security, ...result.data.security },
            uploads: { ...DEFAULT_CONFIG.uploads, ...result.data.uploads },
          };
          return cachedConfig;
        }
      }
    } catch { /* fall through to default */ }
    cachedConfig = DEFAULT_CONFIG;
    return cachedConfig;
  })();

  return fetchPromise;
}

/**
 * Get cached config synchronously (returns defaults if not yet fetched).
 */
export function getPlatformConfig(): PlatformConfig {
  return cachedConfig || DEFAULT_CONFIG;
}
