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
 * Sanitize backend error messages to be user-friendly.
 * Filters out technical Java/Spring exceptions and replaces with clear messages.
 */
export function sanitizeErrorMessage(msg: string, fallback: string): string {
  if (!msg) return fallback;

  // Map known backend errors to user-friendly messages
  const knownErrors: [RegExp, string][] = [
    [/Withdrawal method not set/i, 'No withdrawal method set. Please go to Preferences > Payment Accounts to add a withdrawal method before withdrawing.'],
    [/Insufficient.*balance|Insufficient.*funds/i, 'Insufficient balance for this withdrawal. Please check your available balance and try a smaller amount.'],
    [/No payment found/i, 'No pending payment found for this event. It may have already been paid or cancelled.'],
    [/Invalid.*currency/i, 'Currency not supported. Please select a valid currency and try again.'],
    [/event.*not found|event.*deleted/i, 'This event is no longer available. It may have been removed.'],
    [/Failed to initiate XentriPay|Failed to initiate collection/i, 'Payment gateway is temporarily unavailable. Please try again in a few minutes.'],
    [/Cannot determine XentriPay provider/i, 'Could not identify the payment provider for this account. Please remove and re-add your withdrawal method in Preferences > Payment Accounts.'],
    [/Token has expired|session.*expired/i, 'Your session has expired. Please refresh the page and try again.'],
    [/Missing required parameter/i, 'Some required information is missing. Please fill in all fields and try again.'],
  ];

  for (const [pattern, friendly] of knownErrors) {
    if (pattern.test(msg)) return friendly;
  }

  // Filter technical Java/Spring errors
  const technical = [
    'Malformed request body', 'HttpMessageNotReadableException', 'InsufficientAuthenticationException',
    'NoResourceFoundException', 'NullPointerException', 'SQLException', 'DataIntegrityViolation',
    'ConstraintViolationException', 'could not execute statement', 'Full authentication is required',
    'SignatureException', 'jackson', 'deserialize', 'hibernate', 'javax.persistence',
  ];
  if (technical.some(t => msg.toLowerCase().includes(t.toLowerCase()))) return fallback;

  // Strip Java class name prefixes like "SomeException: actual message"
  const colonIdx = msg.indexOf(':');
  if (colonIdx > 0 && colonIdx < 40 && /Exception|Error/.test(msg.substring(0, colonIdx))) {
    const cleaned = msg.substring(colonIdx + 1).trim();
    return cleaned || fallback;
  }
  return msg;
}

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
 * Initiate payment for a booking via eventId (server finds declaration internally)
 */
export async function initiateBookingPayment(
  declarationId: string,
  phone: string,
  telecomProvider: string,
  paymentMethod: string,
  redirectUrl?: string,
  donationAmount?: number,
  currencyId?: string,
  escrowPercentage?: number
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const body: Record<string, unknown> = { declarationId, paymentMethod, redirectUrl };
    if (phone) body.phone = phone;
    if (telecomProvider) body.telecomProvider = telecomProvider;
    if (donationAmount && donationAmount > 0) body.donationAmount = donationAmount;
    if (currencyId) body.currencyId = currencyId;
    if (escrowPercentage) body.escrowPercentage = escrowPercentage;
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to initiate payment. Please try again.') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Initiate archive unlock payment via XentriPay
 */
export async function initiateArchivePayment(
  eventId: string,
  amount: number,
  currencyId: string,
  phone: string,
  telecomProvider: string,
  paymentMethod: string,
  redirectUrl?: string,
  donationAmount?: number
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const body: Record<string, unknown> = { eventId, amount, currencyId, paymentMethod };
    if (phone) body.phone = phone;
    if (telecomProvider) body.telecomProvider = telecomProvider;
    if (redirectUrl) body.redirectUrl = redirectUrl;
    if (donationAmount && donationAmount > 0) body.donationAmount = donationAmount;
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate-archive`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to initiate archive payment. Please try again.') };
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
  telecomProvider: string,
  donationAmount?: number
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const body: Record<string, unknown> = { eventId, amount, currencyId, phone, telecomProvider };
    if (donationAmount && donationAmount > 0) body.donationAmount = donationAmount;
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate-tip`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to initiate tip payment. Please try again.') };
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
  telecomProvider: string,
  donationAmount?: number
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const body: Record<string, unknown> = { eventId, amount, currencyId, phone, telecomProvider };
    if (donationAmount && donationAmount > 0) body.donationAmount = donationAmount;
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate-streaming`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to initiate streaming payment. Please try again.') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Initiate payment for photobook extra photos via XentriPay
 */
export async function initiatePhotobookExtrasPayment(
  photobookId: string,
  phone: string,
  telecomProvider: string,
  currencyId: string,
  donationAmount?: number
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const body: Record<string, unknown> = { photobookId, phone, telecomProvider, currencyId };
    if (donationAmount && donationAmount > 0) body.donationAmount = donationAmount;
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/initiate-photobook-extras`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to initiate photobook extras payment. Please try again.') };
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to check payment status. Please try again.') };
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
  intervalMs: number = 2000,
  maxAttempts: number = 150
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

// ==================== Escrow Release APIs ====================

/**
 * Release escrow funds. collects remaining balance after survey completion
 */
export async function releaseEscrowFunds(
  declarationId: string,
  phone: string,
  telecomProvider: string,
  paymentMethod: string,
  redirectUrl?: string
): Promise<{ success: boolean; data?: XentriPayResponse; error?: string }> {
  try {
    const body: Record<string, unknown> = { declarationId, phone, paymentMethod };
    if (telecomProvider) body.telecomProvider = telecomProvider;
    if (redirectUrl) body.redirectUrl = redirectUrl;
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/payments/xentripay/release-escrow`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to release escrow funds. Please try again.') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

// ==================== Survey APIs ====================

/**
 * Submit client satisfaction survey
 */
export async function submitSurvey(
  eventId: string,
  data: {
    attendedEvent: boolean;
    serviceDelivery: string;
    satisfactionLevel: string;
    deliverablesReceived: boolean;
    issuesDescription?: string;
    wouldBookAgain: boolean;
  }
): Promise<{ success: boolean; surveyId?: string; disputeFlagged?: boolean; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/client/surveys`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...data }),
      }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        success: true,
        surveyId: result.data.surveyId,
        disputeFlagged: result.data.disputeFlagged,
      };
    }

    return { success: false, error: result.message || 'Failed to submit survey' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Check if survey is completed for an event
 */
export async function isSurveyCompleted(
  eventId: string
): Promise<{ completed: boolean; error?: string }> {
  try {
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/client/surveys/${eventId}/completed`
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return { completed: result.data.completed };
    }

    return { completed: false };
  } catch {
    return { completed: false, error: 'Failed to check survey status' };
  }
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to validate account. Please try again.') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Validate account details before adding a withdrawal method
 * Calls XentriPay validate-name API with raw account number + provider ID
 */
export async function validateAccountDetails(
  accountNumber: string,
  bankId: string
): Promise<{ valid: boolean; registeredName?: string; error?: string }> {
  try {
    const params = new URLSearchParams({ accountNumber, bankId });
    const response = await dashboardAuthFetch(
      `${getApiUrl()}/api/remote/withdrawals/xentripay/validate-account-details?${params.toString()}`,
      { method: 'POST' }
    );

    const result = await response.json();

    if (result.action === 1 && result.data) {
      return {
        valid: true,
        registeredName: result.data.registeredName,
      };
    }

    return { valid: false, error: sanitizeErrorMessage(result.message, 'Account validation failed. Please check the account number.') };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error during validation' };
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

    return { success: false, error: sanitizeErrorMessage(result.message, 'Failed to process withdrawal. Please try again.') };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}
