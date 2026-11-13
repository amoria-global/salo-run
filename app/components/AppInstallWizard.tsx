'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  DISMISS_KEY,
  PENDING_INSTALL_KEY,
  appDeepLinkFor,
  detectMobilePlatform,
  dismissUntil,
  isPendingInstall,
  shouldShowWizard,
  storeUrlFor,
  type MobilePlatform,
} from '@/lib/appInstall/appInstall';
import { saveDeferredLink } from '@/lib/appInstall/deferredLink';

/**
 * The "get the app" wizard for the one link the dashboard shares with people who may not have the app: a photographer's
 * collaboration invite. Same behaviour as the website's wizard: on a phone it leads with the store, offers "I already
 * have the app" (fires the app link and watches whether the page was handed over) and "Continue on the web", and it saves
 * the invite so the installed app opens it after sign-up.
 */
const PROBE_MS = 1600;
const NAVY = '#083A85';
const PINK = '#F20C8F';

type Phase = 'closed' | 'welcome' | 'checking' | 'missing' | 'returned';

const BENEFITS = [
  'Join the shared album and add your photos in a few taps',
  'Get an instant alert when the owner approves you',
  'Everything you shoot, share and sell in one place',
];

function readNumber(key: string): number | null {
  try {
    const v = Number(window.localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* private mode: it just asks again */ }
}

export default function AppInstallWizard(): React.JSX.Element | null {
  const pathname = usePathname() || '/';
  const search = useSearchParams();
  const searchKey = search.toString();
  const [platform, setPlatform] = useState<MobilePlatform>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = detectMobilePlatform();
    setPlatform(p);
    const now = Date.now();
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const show = shouldShowWizard({ platform: p, pathname, search: new URLSearchParams(searchKey), now, dismissedUntil: readNumber(DISMISS_KEY), standalone: !!standalone });
    setPhase(!show ? 'closed' : isPendingInstall(readNumber(PENDING_INSTALL_KEY), now) ? 'returned' : 'welcome');
  }, [pathname, searchKey]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  const continueOnWeb = useCallback(() => {
    clearTimer();
    safeSet(DISMISS_KEY, String(dismissUntil(Date.now())));
    setPhase('closed');
  }, [clearTimer]);

  const goToStore = useCallback(async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!platform) return;
    safeSet(PENDING_INSTALL_KEY, String(Date.now()));
    const code = await saveDeferredLink(pathname, platform);
    window.location.href = storeUrlFor(platform, code);
  }, [platform, pathname]);

  const openApp = useCallback(() => {
    setPhase('checking');
    let handedOver = false;
    const mark = () => { handedOver = true; };
    const onVisibility = () => { if (document.visibilityState === 'hidden') handedOver = true; };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', mark);
    window.addEventListener('blur', mark);
    clearTimer();
    timerRef.current = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', mark);
      window.removeEventListener('blur', mark);
      if (handedOver) {
        try { window.localStorage.removeItem(PENDING_INSTALL_KEY); } catch { /* ignore */ }
        setPhase('closed');
      } else {
        setPhase('missing');
      }
    }, PROBE_MS);
    window.location.href = appDeepLinkFor(pathname);
  }, [clearTimer, pathname]);

  useEffect(() => {
    if (phase === 'closed') return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') continueOnWeb(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener('keydown', onKey); };
  }, [phase, continueOnWeb]);

  if (phase === 'closed' || !platform) return null;

  const storeName = platform === 'ios' ? 'App Store' : 'Google Play';
  const title = phase === 'missing' ? 'We could not open the app' : phase === 'returned' ? 'Installed it? Open the app' : phase === 'checking' ? 'Looking for the app...' : 'Get the Connekyt app';
  const lead = phase === 'missing' ? 'It does not look installed on this phone yet. Download it, then open this invite again.'
    : phase === 'returned' ? 'Open this invite in the app to carry on where you left off.'
      : phase === 'checking' ? 'One moment.' : 'You were invited to collaborate on an album. The app is the best way to join, and it is free.';

  return (
    <div role="presentation" onClick={continueOnWeb} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(5,8,18,0.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="app-wizard-title" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: '#fff', color: '#0f172a', position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0', padding: '28px 22px calc(20px + env(safe-area-inset-bottom))', boxShadow: '0 -16px 48px rgba(8,58,133,0.28)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${NAVY} 0%, #0F4FB6 45%, ${PINK} 100%)` }} />
        <h2 id="app-wizard-title" style={{ fontSize: 21, fontWeight: 800, margin: '0 0 6px', color: NAVY, lineHeight: 1.2 }}>{title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.45, color: '#475569', margin: '0 0 14px' }}>{lead}</p>
        {phase === 'welcome' && (
          <ul style={{ margin: '0 0 18px', padding: '0 0 0 18px', display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
            {BENEFITS.map((b) => <li key={b}>{b}</li>)}
          </ul>
        )}
        {phase === 'returned' ? (
          <button type="button" onClick={openApp} style={primaryStyle}>Open in the app</button>
        ) : phase === 'checking' ? (
          <button type="button" disabled style={{ ...primaryStyle, opacity: 0.7, cursor: 'wait' }}>Opening...</button>
        ) : (
          <a href={storeUrlFor(platform)} onClick={goToStore} rel="noopener" style={primaryStyle}>
            {phase === 'missing' ? `Download from ${storeName}` : `Get the app on ${storeName}`}
          </a>
        )}
        {phase !== 'checking' && (
          <button type="button" onClick={phase === 'returned' ? () => { void goToStore(); } : openApp} style={secondaryStyle}>
            {phase === 'returned' ? `Not installed? Open ${storeName}` : phase === 'missing' ? 'I installed it, open the app' : 'I already have the app'}
          </button>
        )}
        <button type="button" onClick={continueOnWeb} style={linkStyle}>Continue on the web</button>
      </div>
    </div>
  );
}

const primaryStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box', padding: '14px 18px', borderRadius: 14, border: 'none',
  cursor: 'pointer', minHeight: 52, background: `linear-gradient(135deg, ${NAVY} 0%, #0F4FB6 100%)`, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
  boxShadow: '0 6px 18px rgba(8,58,133,0.3)',
};
const secondaryStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 10, padding: '12px 18px', borderRadius: 14, minHeight: 46, background: 'transparent', color: NAVY,
  border: '1px solid rgba(8,58,133,0.25)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const linkStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, padding: '12px 18px', minHeight: 44, background: 'transparent', color: '#64748b', border: 'none',
  fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
};
