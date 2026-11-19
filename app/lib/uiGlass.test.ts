import { afterEach, describe, expect, it } from 'vitest';
import {
  HEAD_SCRIPT, emailFromToken, isGlassPath, parseAllowlist, parseMode, glassEnabledFor,
} from './uiGlass';

const token = (sub: unknown) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ sub })}.signature`;
};

describe('the Compact Glass flag', () => {
  it('is off unless the server says allowlist or all', () => {
    expect(parseMode(undefined)).toBe('off');
    expect(parseMode('')).toBe('off');
    expect(parseMode('on')).toBe('off');
    expect(parseMode(' Allowlist ')).toBe('allowlist');
    expect(parseMode('ALL')).toBe('all');
  });

  it('reads the allowlist as lower-case emails and ignores anything else', () => {
    expect([...parseAllowlist(' QA+one@amoriaglobal.com, ,not-an-email,qa+two@amoriaglobal.com ')])
      .toEqual(['qa+one@amoriaglobal.com', 'qa+two@amoriaglobal.com']);
  });

  it('serves the new UI only to allowlisted accounts in allowlist mode', () => {
    const list = parseAllowlist('qa+one@amoriaglobal.com');
    expect(glassEnabledFor('allowlist', list, 'qa+one@amoriaglobal.com')).toBe(true);
    expect(glassEnabledFor('allowlist', list, 'someone@example.com')).toBe(false);
    expect(glassEnabledFor('allowlist', list, null)).toBe(false);
    expect(glassEnabledFor('off', list, 'qa+one@amoriaglobal.com')).toBe(false);
    expect(glassEnabledFor('all', new Set(), null)).toBe(true);
  });

  it('takes the email from the token subject and refuses anything unreadable', () => {
    expect(emailFromToken(token('QA+One@amoriaglobal.com'))).toBe('qa+one@amoriaglobal.com');
    expect(emailFromToken(token(42))).toBeNull();
    expect(emailFromToken(token('no-at-sign'))).toBeNull();
    expect(emailFromToken('a.b')).toBeNull();
    expect(emailFromToken('a.%%%.c')).toBeNull();
    expect(emailFromToken(undefined)).toBeNull();
  });

  it('covers the three dashboards and leaves admin on its own shell', () => {
    expect(isGlassPath('/user/photographer/dashboard')).toBe(true);
    expect(isGlassPath('/user/client')).toBe(true);
    expect(isGlassPath('/user/event-coordinator/home')).toBe(true);
    expect(isGlassPath('/user/admin/wallets')).toBe(false);
    expect(isGlassPath('/user/photographers')).toBe(false);
    expect(isGlassPath('/')).toBe(false);
  });

  it('covers the two pages every signed-in role shares, and no other auth page', () => {
    expect(isGlassPath('/user/not-authorized')).toBe(true);
    expect(isGlassPath('/user/auth/change-password')).toBe(true);
    expect(isGlassPath('/user/auth/login')).toBe(false);
    expect(isGlassPath('/user/not-authorized-x')).toBe(false);
  });
});

describe('the head script', () => {
  const run = (path: string, cookie: string, stored: Record<string, string>) => {
    const html = document.documentElement;
    html.removeAttribute('data-theme');
    html.className = '';
    window.history.replaceState(null, '', path);
    document.cookie.split(';').forEach((c) => {
      document.cookie = `${c.split('=')[0].trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    if (cookie) document.cookie = `${cookie}; path=/`;
    localStorage.clear();
    Object.entries(stored).forEach(([k, v]) => localStorage.setItem(k, v));
    new Function(HEAD_SCRIPT)();
    return { theme: html.getAttribute('data-theme'), glass: html.classList.contains('ui-glass') };
  };
  afterEach(() => localStorage.clear());

  it('sets the theme ThemeContext would set, from the same per-role key', () => {
    expect(run('/user/photographer/dashboard', '', { 'connekt-theme-photographer': 'dark' }).theme).toBe('dark');
    expect(run('/user/client/home', '', { 'connekt-theme-photographer': 'dark' }).theme).toBe('light');
    expect(run('/user/event-coordinator/home', '', { 'connekt-theme': 'dark' }).theme).toBe('dark');
    expect(run('/user/photographer/dashboard', '', {}).theme).toBe('light');
  });

  it('adds ui-glass only with the flag cookie on a redesigned dashboard', () => {
    expect(run('/user/photographer/dashboard', 'ck_ui=glass', {}).glass).toBe(true);
    expect(run('/user/photographer/dashboard', '', {}).glass).toBe(false);
    expect(run('/user/photographer/dashboard', 'ck_ui=classic', {}).glass).toBe(false);
    expect(run('/user/admin/wallets', 'ck_ui=glass', {}).glass).toBe(false);
  });

  it('adds ui-glass on the two shared pages too, and not on other auth pages', () => {
    expect(run('/user/not-authorized', 'ck_ui=glass', {}).glass).toBe(true);
    expect(run('/user/auth/change-password', 'ck_ui=glass', {}).glass).toBe(true);
    expect(run('/user/auth/login', 'ck_ui=glass', {}).glass).toBe(false);
  });
});
