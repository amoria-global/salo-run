/**
 * Dashboard XentriPay API Helper
 * Uses dashboardAuthFetch for authenticated requests to XentriPay endpoints
 */

import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from './api';

// ==================== Types ====================

export interface XentriPayResponse {
  refid: string;
  tid: string;
  paymentUrl?: string;
  status: string;
  message: string;
}

export interface XentriPayStatusResponse {
  refid: string;
  status: string; // 'PENDING' | 'SUCCESS' | 'FAILED'
  declarationStatus?: string;
  amount?: number;
  paidAmount?: number;
}

export interface XentriPayWithdrawalResponse {
  customerRef: string;
  status: string;
}

export interface XentriPayAccountValidation {
  accountName: string;
  valid: boolean;
}

// ==================== Helpers ====================

/**
 * Map frontend payment method to XentriPay telecom provider
 */
export function getTelecomProvider(method: string): string {
  switch (method) {
    case 'mtn': return 'MTN';
    case 'airtel': return 'AIRTEL';
    default: return '';
  }
}

/**
 * Map frontend payment method to XentriPay payment method type
 */
export function getPaymentMethodType(method: string): string {
  return method === 'card' ? 'CARD' : 'MOBILE_MONEY';
}

// ==================== Collection (Payment) APIs ====================

/**
 * Initiate payment for an existing payment declaration (booking)
 */
export async function initiateBookingPayment(
  declarationId: string,
  phone: string,
  telecomProvider: string,
  paymentMethod: string
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declarationId,
          phone,
          telecomProvider,
          paymentMethod,
        }),
      }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        data: {
          refid: result.data.refid,
          tid: result.data.tid,
          paymentUrl: result.data.paymentUrl,
          status: result.data.status || 'PENDING',
          message: result.data.message || result.message,
        },
      };
    }

    return { success: false, error: result.message || 'Failed to initiate payment' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Initiate tip payment via XentriPay
 */
export async function initiateTipPayment(
  eventId: string,
  amount: number,
  currencyId: string,
  phone: string,
  telecomProvider: string
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate-tip`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          amount,
          currencyId,
          phone,
          telecomProvider,
        }),
      }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        data: {
          refid: result.data.refid,
          tid: result.data.tid,
          paymentUrl: result.data.paymentUrl,
          status: result.data.status || 'PENDING',
          message: result.data.message || result.message,
        },
      };
    }

    return { success: false, error: result.message || 'Failed to initiate tip payment' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Initiate streaming/donation payment via XentriPay
 */
export async function initiateStreamingPayment(
  eventId: string,
  amount: number,
  currencyId: string,
  phone: string,
  telecomProvider: string
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate-streaming`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          amount,
          currencyId,
          phone,
          telecomProvider,
        }),
      }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        data: {
          refid: result.data.refid,
          tid: result.data.tid,
          paymentUrl: result.data.paymentUrl,
          status: result.data.status || 'PENDING',
          message: result.data.message || result.message,
        },
      };
    }

    return { success: false, error: result.message || 'Failed to initiate streaming payment' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Check payment status by reference ID
 */
export async function checkPaymentStatus(
  refid: string
): Promise<{ success: boolean; data?: XentriPayStatusResponse; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/status/${refid}`
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        data: {
          refid: result.data.refid,
          status: result.data.status,
          declarationStatus: result.data.declarationStatus,
          amount: result.data.amount,
          paidAmount: result.data.paidAmount,
        },
      };
    }

    return { success: false, error: result.message || 'Failed to check status' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Poll payment status until settled (SUCCESS or FAILED)
 * Returns a cleanup function to stop polling
 */
export function pollPaymentStatus(
  refid: string,
  callbacks: {
    onSuccess: (data: XentriPayStatusResponse) => void;
    onFailure: (data: XentriPayStatusResponse) => void;
    onError: (error: string) => void;
  },
  intervalMs: number = 5000,
  maxAttempts: number = 60
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const response = await checkPaymentStatus(refid);

      if (stopped) return;

      if (!response.success) {
        if (attempts >= maxAttempts) {
          callbacks.onError('Payment status check timed out. Please check your payment history.');
          return;
        }
        setTimeout(poll, intervalMs);
        return;
      }

      const status = response.data?.status;

      if (status === 'SUCCESS') {
        callbacks.onSuccess(response.data!);
        return;
      }

      if (status === 'FAILED') {
        callbacks.onFailure(response.data!);
        return;
      }

      // Still pending
      if (attempts >= maxAttempts) {
        callbacks.onError('Payment is taking longer than expected. Please check your payment history.');
        return;
      }

      setTimeout(poll, intervalMs);
    } catch {
      if (stopped) return;
      if (attempts >= maxAttempts) {
        callbacks.onError('Unable to check payment status. Please try again later.');
        return;
      }
      setTimeout(poll, intervalMs);
    }
  };

  // Start polling after initial delay
  setTimeout(poll, intervalMs);

  return () => { stopped = true; };
}

// ==================== Withdrawal (Payout) APIs ====================

/**
 * Validate withdrawal account with XentriPay
 */
export async function validateWithdrawalAccount(
  withdrawalMethodId: string
): Promise<{ success: boolean; data?: XentriPayAccountValidation; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/withdrawals/xentripay/validate-account`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalMethodId }),
      }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        data: {
          accountName: result.data.accountName,
          valid: result.data.valid,
        },
      };
    }

    return { success: false, error: result.message || 'Failed to validate account' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Process withdrawal via XentriPay payout
 */
export async function processWithdrawal(
  photographerTransactionId: string
): Promise<{ success: boolean; data?: XentriPayWithdrawalResponse; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/withdrawals/xentripay/process`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographerTransactionId }),
      }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        data: {
          customerRef: result.data.customerRef,
          status: result.data.status || 'PROCESSING',
        },
      };
    }

    return { success: false, error: result.message || 'Failed to process withdrawal' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}
