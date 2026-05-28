/**
 * Shared types for the multi-country payment-method picker.
 * Mirrors the knockout copy verbatim — both apps consume the same
 * backend payload (PaymentOperatorRegistry).
 */

export type OperatorType = 'MOBILE_MONEY' | 'CARD';

export interface PaymentOperator {
  id: string;
  name: string;
  iconKey: string;
  type: OperatorType;
}

export interface PaymentOptions {
  country: string;
  currency: string;
  operators: PaymentOperator[];
  supportsCard: boolean;
  supportsMobileMoney: boolean;
}

export interface DetectedCountry {
  country: string | null;
  source: 'IP' | 'DEFAULT' | 'MANUAL' | 'CACHED';
  supported: boolean;
}
