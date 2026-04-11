/**
 * Wallet API helpers for the dashboard.
 * All calls go through dashboardAuthFetch so Bearer token, api-token header,
 * and 401 → refresh → retry are handled for free.
 */

import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

// ==================== Types (mirror server DTOs) ====================

export type WalletStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export type WalletCategory =
  | 'BALANCE'
  | 'TIPS'
  | 'BONUSES'
  | 'GIFTS'
  | 'STREAM_FEES'
  | 'DONATIONS'
  | 'HELD'
  | 'PENDING'
  | 'BLOCKED'
  | 'WITHDRAWAL'
  | 'REFUND'
  | 'CLIENT_SPEND';

export type WalletDirection = 'CREDIT' | 'DEBIT';

export interface WalletDTO {
  id: string;
  customerId: string;
  customerType: string;
  balanceAvailable: number;
  balanceTips: number;
  balanceBonuses: number;
  balanceGifts: number;
  balanceStreamFees: number;
  balanceDonations: number;
  heldForDelivery: number;
  pendingAmount: number;
  blockedAmount: number;
  totalWithdrawn: number;
  totalRefunded: number;
  clientSpent: number;
  status: WalletStatus;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  lastReconciledAt?: string | null;
  consecutiveDriftCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletMovementDTO {
  id: string;
  walletId: string;
  category: WalletCategory | string;
  direction: WalletDirection;
  amountUsd: number;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  sourceType: string;
  sourceId?: string | null;
  description?: string | null;
  actorId?: string | null;
  createdAt: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

export interface ReconciliationResult {
  walletId: string;
  driftDetected: boolean;
  corrected: boolean;
  suspended: boolean;
  diff?: Record<string, { before: number; after: number }>;
  reason?: string;
}

export interface AdminListWalletsParams {
  status?: WalletStatus | string;
  customerType?: string;
  page?: number;
  size?: number;
}

export interface AdjustWalletRequest {
  category: WalletCategory | string;
  direction: WalletDirection;
  amount: number;
  reason: string;
}

interface BackendEnvelope<T> {
  action: number;
  message: string;
  data: T;
}

// ==================== Internal helper ====================

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiUrl()}${path}`;
  const res = await dashboardAuthFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let parsed: BackendEnvelope<T> | null = null;
  try {
    parsed = text ? (JSON.parse(text) as BackendEnvelope<T>) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok || !parsed || parsed.action !== 1) {
    const msg = parsed?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return parsed.data;
}

// ==================== User-facing ====================

export function getMyWallet(): Promise<WalletDTO> {
  return request<WalletDTO>('/api/remote/wallet/me');
}

export function getMyWalletMovements(
  page: number = 0,
  size: number = 50
): Promise<SpringPage<WalletMovementDTO>> {
  return request<SpringPage<WalletMovementDTO>>(
    `/api/remote/wallet/me/movements?page=${encodeURIComponent(
      page
    )}&size=${encodeURIComponent(size)}`
  );
}

// ==================== Admin ====================

export function adminListWallets(
  params: AdminListWalletsParams = {}
): Promise<SpringPage<WalletDTO>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.customerType) qs.set('customerType', params.customerType);
  qs.set('page', String(params.page ?? 0));
  qs.set('size', String(params.size ?? 20));
  return request<SpringPage<WalletDTO>>(
    `/api/remote/admin/wallets?${qs.toString()}`
  );
}

export interface AdminWalletDetail {
  wallet: WalletDTO;
  recentMovements: WalletMovementDTO[];
}

export function adminGetWallet(id: string): Promise<AdminWalletDetail> {
  return request<AdminWalletDetail>(`/api/remote/admin/wallets/${id}`);
}

export function adminReconcileWallet(
  id: string
): Promise<ReconciliationResult> {
  return request<ReconciliationResult>(
    `/api/remote/admin/wallets/${id}/reconcile`,
    { method: 'POST' }
  );
}

export function adminSuspendWallet(
  id: string,
  reason: string
): Promise<WalletDTO> {
  return request<WalletDTO>(`/api/remote/admin/wallets/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function adminReactivateWallet(id: string): Promise<WalletDTO> {
  return request<WalletDTO>(`/api/remote/admin/wallets/${id}/reactivate`, {
    method: 'POST',
  });
}

export function adminAdjustWallet(
  id: string,
  body: AdjustWalletRequest
): Promise<WalletMovementDTO | null> {
  return request<WalletMovementDTO | null>(
    `/api/remote/admin/wallets/${id}/adjust`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}
