'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { referralText, type CopyKey } from '@/app/lib/referralCopy';

/** `rt('progress', { n: 11, target: 20 })` in the viewer's language. */
export function useReferralCopy() {
  const { language } = useLanguage();
  return useCallback((key: CopyKey, vars?: Record<string, string | number>) => referralText(language, key, vars), [language]);
}
