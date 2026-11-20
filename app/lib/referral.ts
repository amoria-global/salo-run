/**
 * Milestone referral program ("Grow your store") client. Every call goes through dashboardAuthFetch (session and
 * workspace header) and reads the envelope's action. The server decides everything (rates, who counts, the cap);
 * the client only shows the result. Wording lives in contract/referral-copy.json (see referralCopy.ts).
 */
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

export type ReferralProblem =
  | 'INVALID' | 'NOT_ELIGIBLE' | 'LIMIT_REACHED' | 'SELF' | 'MUTUAL'
  | 'ALREADY_REFERRED' | 'QA_MISMATCH' | 'NOT_A_PHOTOGRAPHER';

export type ReferralStatus = 'pending' | 'under_review' | 'qualified' | 'revoked';
export type ReferralHint = 'waiting_verified_published' | 'waiting_first_sale' | 'under_review' | 'qualified' | 'revoked';

export interface ReferralRow {
  name: string;
  status: ReferralStatus;
  date: string;
  signedUp: boolean;
  verifiedPublished: boolean;
  firstSale: boolean;
  hint: ReferralHint;
}

export interface MyReferral { referrerName: string | null; status: ReferralStatus; verifiedPublished: boolean; firstSale: boolean }
export interface Unlocked { milestone: number; sharePercent: number }

export interface ReferralStats {
  code: string | null;
  link: string | null;
  qualifying: number;
  cap: number;
  sharePercent: number;
  nextMilestone: number | null;
  nextSharePercent: number | null;
  maxRate: boolean;
  complete: boolean;
  pending: number;
  underReview: number;
  minQualifyingUsd: number;
  referrals: ReferralRow[];
  hasReferrer: boolean;
  referrerName: string | null;
  myReferral: MyReferral | null;
  unlocked: Unlocked | null;
}

export interface Validation { valid: boolean; referrerName?: string; code?: string; problem?: ReferralProblem }

export const CAP = 40;
export const MILESTONES = [10, 20, 30, 40] as const;

export interface Tier { share: number; from: number; to: number; state: 'done' | 'current' | 'locked' | 'max' }

/** The five photo-sale tiers (share of every sale) with where the photographer stands. */
export function tiers(qualified: number): Tier[] {
  const defs = [
    { share: 70, from: 0, to: 9 }, { share: 75, from: 10, to: 19 }, { share: 80, from: 20, to: 29 },
    { share: 85, from: 30, to: 39 }, { share: 90, from: 40, to: 40 },
  ];
  return defs.map((d) => ({
    ...d,
    state: d.share === 90 ? (qualified >= 40 ? 'current' : 'max') : qualified > d.to ? 'done' : qualified >= d.from ? 'current' : 'locked',
  }));
}

/** 0 to 100 for the progress bar toward the next milestone (the whole bar at the cap). */
export function progressPct(qualified: number): number {
  if (qualified >= CAP) return 100;
  const base = Math.floor(qualified / 10) * 10;
  return Math.round(((qualified - base) / 10) * 100);
}

/** The target in "11 of 20 referrals": the next milestone, or 40 at the cap. */
export function targetOf(qualified: number): number {
  return qualified >= CAP ? CAP : (MILESTONES.find((m) => qualified < m) ?? CAP);
}

/** The sheet progress chip, e.g. 11/20. */
export function sheetChip(qualified: number): string {
  return `${qualified}/${targetOf(qualified)}`;
}

/** Share & invite badge: Earn 70% before 10, Unlock 75% while below 10 with progress, then Your share. Null at the cap. */
export function badgeFor(s: Pick<ReferralStats, 'qualifying' | 'sharePercent' | 'nextSharePercent' | 'maxRate'> | null):
  { kind: 'earn' | 'unlock' | 'share'; rate: number } | null {
  if (!s || s.maxRate) return null;
  if (s.qualifying >= 10) return { kind: 'share', rate: s.sharePercent };
  if (s.qualifying === 0) return { kind: 'earn', rate: 70 };
  return { kind: 'unlock', rate: s.nextSharePercent ?? 75 };
}

/** Round sale used in the money example, in the viewer's own currency (never converted). */
export function exampleSale(currency: string): number {
  return ['RWF', 'KES', 'TZS', 'UGX', 'BIF', 'XAF', 'XOF', 'NGN'].includes(currency.toUpperCase()) ? 10000 : 100;
}

/** What the next tier adds on a sale of {@code sale}: (next - now)% of it. */
export function extraOnSale(nowShare: number, nextShare: number | null, sale: number): number | null {
  return nextShare == null ? null : Math.round(((nextShare - nowShare) / 100) * sale);
}

export function statusKey(s: ReferralStatus): 'statusPending' | 'statusReview' | 'statusQualified' | 'statusRevoked' {
  return s === 'under_review' ? 'statusReview' : s === 'qualified' ? 'statusQualified' : s === 'revoked' ? 'statusRevoked' : 'statusPending';
}

export function hintKey(h: ReferralHint): 'hintWaitingVerified' | 'hintWaitingFirstSale' | 'hintUnderReview' | 'hintQualified' | 'hintRevoked' {
  switch (h) {
    case 'waiting_verified_published': return 'hintWaitingVerified';
    case 'waiting_first_sale': return 'hintWaitingFirstSale';
    case 'under_review': return 'hintUnderReview';
    case 'revoked': return 'hintRevoked';
    default: return 'hintQualified';
  }
}

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

/** The congratulations sheet was shown: the server stops offering it. */
export async function ackMilestone(): Promise<void> {
  try {
    await call('/api/remote/photographer/referral/milestone/ack', { method: 'POST' });
  } catch { /* offered again next open; harmless */ }
}
