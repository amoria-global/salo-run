/**
 * The one source of wording for the milestone referral program. contract/referral-copy.json is owned by the backend
 * and copied here verbatim, so the policy page, Help, emails and every screen say the same thing. Placeholders are
 * written {name}. A missing key or language falls back to English, then to the key itself.
 */
import copy from '@/contract/referral-copy.json';

export type CopyLang = 'en' | 'sw' | 'rw' | 'fr' | 'es';
export type CopyKey = Exclude<keyof typeof copy.en, never>;

const tables = copy as unknown as Record<string, Record<string, string>>;

export function referralText(lang: string, key: CopyKey, vars?: Record<string, string | number>): string {
  const raw = tables[lang]?.[key] ?? tables.en?.[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function copyLanguages(): CopyLang[] {
  return ['en', 'sw', 'rw', 'fr', 'es'];
}
