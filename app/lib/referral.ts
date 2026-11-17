/**
 * Photographer Referral Program client. Every call goes through dashboardAuthFetch (session and workspace
 * header) and reads the envelope's action. The server decides everything; the client only shows the result.
 */
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export type ReferralProblem =
  | 'INVALID' | 'NOT_ELIGIBLE' | 'LIMIT_REACHED' | 'SELF' | 'MUTUAL'
  | 'ALREADY_REFERRED' | 'QA_MISMATCH' | 'NOT_A_PHOTOGRAPHER';

export interface ReferralRow { name: string; status: 'pending' | 'under_review' | 'qualified' | 'revoked'; date: string }

export interface ReferralStats {
  code: string | null;
  link: string | null;
  qualifying: number;
  cap: number;
  feePercent: number | null;
  nextFeePercent: number | null;
  complete: boolean;
  referrals: ReferralRow[];
  hasReferrer: boolean;
  referrerName: string | null;
}

export interface Validation { valid: boolean; referrerName?: string; code?: string; problem?: ReferralProblem }

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Same parsing as the server: a bare code or a full link in, the 8 character code (or null) out. */
export function parseReferralCode(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim();
  const ref = s.toLowerCase().indexOf('ref=');
  if (ref >= 0) {
    s = s.slice(ref + 4);
    const amp = s.indexOf('&');
    if (amp >= 0) s = s.slice(0, amp);
  } else if (s.includes('/')) {
    s = s.slice(s.lastIndexOf('/') + 1);
  }
  s = s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (s.length !== 8) return null;
  for (const c of s) if (!ALPHABET.includes(c)) return null;
  return s;
}

/** The share link for a code. */
export function referralLink(code: string): string {
  return `https://connekyt.com/join?ref=${code}`;
}

/** The progress line under the code: how far to the first discount, the current fee, or the finished program. */
export function progressParts(s: Pick<ReferralStats, 'qualifying' | 'feePercent' | 'complete' | 'cap'>):
  { kind: 'unlock' | 'fee' | 'complete'; n: number; fee: number | null; pct: number } {
  const pct = Math.min(100, Math.round((s.qualifying / s.cap) * 100));
  if (s.complete) return { kind: 'complete', n: s.cap, fee: 10, pct: 100 };
  if (s.feePercent == null) return { kind: 'unlock', n: s.qualifying, fee: null, pct };
  return { kind: 'fee', n: s.qualifying, fee: s.feePercent, pct };
}

async function call<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; message?: string }> {
  const res = await dashboardAuthFetch(`${getApiUrl()}${path}`, init);
  let body: { action?: number; message?: string; data?: T } | null = null;
  try { body = await res.json(); } catch { body = null; }
  return { ok: !!body && body.action === 1, status: res.status, data: body?.data, message: body?.message };
}

export async function fetchMyReferral(): Promise<ReferralStats> {
  const r = await call<ReferralStats>('/api/remote/photographer/referral/me');
  if (!r.ok || !r.data) throw new Error('referral-load-failed');
  return r.data;
}

export async function validateCode(code: string): Promise<{ result?: Validation; tooMany?: boolean; error?: boolean }> {
  try {
    const r = await call<Validation>(`/api/remote/photographer/referral/validate?code=${encodeURIComponent(code)}`);
    if (r.status === 429) return { tooMany: true };
    if (!r.ok || !r.data) return { error: true };
    return { result: r.data };
  } catch {
    return { error: true };
  }
}

export async function attachCode(code: string): Promise<{ ok: boolean; referrerName?: string; problem?: ReferralProblem; tooMany?: boolean }> {
  const r = await call<{ referrerName?: string; problem?: ReferralProblem }>('/api/remote/photographer/referral/attach', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
  });
  if (r.status === 429) return { ok: false, tooMany: true };
  if (r.ok) return { ok: true, referrerName: r.data?.referrerName };
  return { ok: false, problem: r.data?.problem };
}

/** Message key (English, translated by the dashboard dictionary) for a validation problem. */
export function problemMessage(p: ReferralProblem | undefined): string {
  switch (p) {
    case 'LIMIT_REACHED': return 'This referrer has reached their limit';
    case 'NOT_ELIGIBLE': return "This referrer can't take new referrals right now";
    case 'SELF': return "You can't use your own code";
    case 'MUTUAL': return "This code can't be used";
    case 'ALREADY_REFERRED': return 'Your account already has a referrer';
    default: return "This code isn't valid";
  }
}
