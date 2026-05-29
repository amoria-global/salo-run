/**
 * Dashboard Donation API helpers
 * Uses public endpoints (no auth required) for standalone donation flow
 */

import { getApiUrl } from './api';

// ==================== Types ====================

export interface DonationTier {
  amount: number;
  currency: string;
}

export interface ExchangeRate {
  symbol: string;
  rateToUsd: number | null;
  rateUpdatedAt?: string;
}

export interface DonationTiersResponse {
  baseCurrency: string;
  tiers: DonationTier[];
  exchangeRates: Record<string, ExchangeRate>;
}

export interface PublicDonationRequest {
  amount: string;
  currencyId?: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export interface PublicDonationResponse {
  id: string;
  amount: number;
  currencyId: string;
  donorName: string;
  donorEmail: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface CurrencyInfo {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

// ==================== API Functions ====================

/**
 * Fetch donation tiers and exchange rates
 */
export async function getDonationTiers(): Promise<{ success: boolean; data?: DonationTiersResponse; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/remote/public/donation-tiers`);
    const json = await res.json();
    if (json.action === 1 && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.message || 'Failed to fetch donation tiers' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Fetch currency rates
 */
export async function getCurrencyRates(): Promise<{ success: boolean; data?: Record<string, ExchangeRate>; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/remote/public/currencies/rates`);
    const json = await res.json();
    if (json.action === 1 && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.message || 'Failed to fetch currency rates' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Fetch available currencies
 */
export async function getCurrencies(): Promise<{ success: boolean; data?: CurrencyInfo[]; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/remote/public/currencies`);
    const json = await res.json();
    if (json.action === 1 && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.message || 'Failed to fetch currencies' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Create a public donation record (no auth required)
 */
export async function createPublicDonation(data: PublicDonationRequest): Promise<{ success: boolean; data?: PublicDonationResponse; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append('amount', data.amount);
    if (data.currencyId) params.append('currencyId', data.currencyId);
    if (data.donorName) params.append('donorName', data.donorName);
    if (data.donorEmail) params.append('donorEmail', data.donorEmail);
    if (data.message) params.append('message', data.message);

    const res = await fetch(`${getApiUrl()}/api/remote/public/donations?${params.toString()}`, {
      method: 'POST',
    });
    const json = await res.json();
    if (json.action === 1 && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.message || 'Failed to create donation' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Initiate donation payment via XentriPay (public, no auth)
 */
export async function initiateDonationPayment(data: {
  donationId: string;
  phone?: string;
  telecomProvider?: string;
  paymentMethod?: string;
  redirectUrl?: string;
  /** ISO-2 country code. Drives backend PawaPay/XentriPay gateway selection. */
  country?: string;
}): Promise<{ success: boolean; data?: { refid: string; tid: string; paymentUrl?: string; status: string }; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/remote/public/payments/xentripay/initiate-donation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.action === 1 && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.message || 'Failed to initiate donation payment' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Check donation payment status (public, no auth)
 */
export async function checkDonationPaymentStatus(refid: string): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl()}/api/remote/public/payments/xentripay/status/${refid}`);
    const json = await res.json();
    if (json.action === 1 && json.data) {
      return { success: true, status: json.data.status };
    }
    return { success: false, error: json.message || 'Failed to check status' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Poll donation payment status until settled
 */
export function pollDonationStatus(
  refid: string,
  callbacks: { onSuccess: () => void; onFailure: () => void; onError: (err: string) => void },
  intervalMs = 5000,
  maxAttempts = 60
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;
    try {
      const res = await checkDonationPaymentStatus(refid);
      if (stopped) return;
      if (res.success) {
        if (res.status === 'SUCCESS') { callbacks.onSuccess(); return; }
        if (res.status === 'FAILED') { callbacks.onFailure(); return; }
      }
      if (attempts >= maxAttempts) { callbacks.onError('Payment status check timed out.'); return; }
      setTimeout(poll, intervalMs);
    } catch {
      if (stopped) return;
      if (attempts >= maxAttempts) { callbacks.onError('Unable to check payment status.'); return; }
      setTimeout(poll, intervalMs);
    }
  };

  setTimeout(poll, intervalMs);
  return () => { stopped = true; };
}
