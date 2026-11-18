/**
 * The Compact Glass redesign is served behind one flag, decided at the edge (proxy.ts) and handed to the page as the
 * `ck_ui` cookie, which an inline script in the root layout turns into the `ui-glass` class on <html> before first
 * paint. Nothing of the new UI (tokens, fonts, shell) applies without that class, so with the flag off the dashboard
 * is exactly what it was.
 *
 * Server settings, read from the environment only:
 *   UI_GLASS            off | allowlist | all      (default off)
 *   UI_GLASS_ALLOWLIST  comma-separated account emails, used when UI_GLASS=allowlist
 *
 * Rollback: set UI_GLASS=off and restart the service. The cookie is cleared on the next page load.
 *
 * The decision reads the email from the session token without verifying it. That is enough for a cosmetic switch:
 * the backend still checks the token and every permission on each call, so a forged cookie or token shows a different
 * layout and nothing more.
 */

export const UI_GLASS_COOKIE = 'ck_ui';
export const UI_GLASS_CLASS = 'ui-glass';

export type UiGlassMode = 'off' | 'allowlist' | 'all';

export function parseMode(raw: string | undefined | null): UiGlassMode {
  const v = (raw || '').trim().toLowerCase();
  return v === 'allowlist' || v === 'all' ? v : 'off';
}

export function parseAllowlist(raw: string | undefined | null): Set<string> {
  return new Set(
    (raw || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes('@')),
  );
}

/** The `sub` (account email) of a JWT, unverified. Null for anything that is not a readable token. */
export function emailFromToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof json.sub === 'string' && json.sub.includes('@') ? json.sub.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Admin keeps its current shell; the redesign covers the photographer, client and coordinator dashboards. */
export function isGlassPath(pathname: string): boolean {
  return /^\/user\/(photographer|client|event-coordinator)(\/|$)/.test(pathname);
}

export function glassEnabledFor(mode: UiGlassMode, allowlist: Set<string>, email: string | null): boolean {
  if (mode === 'all') return true;
  if (mode === 'allowlist') return !!email && allowlist.has(email);
  return false;
}

/**
 * Runs in <head> before the body paints. It only adds attributes the app would add a moment later anyway:
 *  - data-theme, from the same localStorage key ThemeContext reads, so a dark-theme user no longer sees the light
 *    theme flash on load. Both UIs get this; it does not change how either looks once loaded.
 *  - the ui-glass class, when the flag cookie is set and the path is a redesigned dashboard.
 *  - the self-hosted icon stylesheet, inserted from script so it does not block rendering (icons appear a moment later).
 * It must stay in step with ThemeContext's detectRoleFromPath and getThemeStorageKey.
 */
/** Bootstrap Icons 1.11.3, self-hosted (public/vendor). Added by the head script so it never blocks the first paint. */
export const ICONS_CSS = '/vendor/bootstrap-icons-1.11.3/bootstrap-icons.min.css';

export const HEAD_SCRIPT = `(function(){try{var d=document.documentElement,p=location.pathname;
var r=p.indexOf('/user/photographer')>-1?'photographer':p.indexOf('/user/client')>-1?'client':'default';
var k=r==='default'?'connekt-theme':'connekt-theme-'+r;var t=null;try{t=localStorage.getItem(k)}catch(e){}
if(t==='system'){t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
if(t!=='dark')t='light';d.setAttribute('data-theme',t);
if(/(?:^|;\\s*)${UI_GLASS_COOKIE}=glass(?:;|$)/.test(document.cookie)&&/^\\/user\\/(photographer|client|event-coordinator)(\\/|$)/.test(p)){d.classList.add('${UI_GLASS_CLASS}')}
}catch(e){}try{var l=document.createElement('link');l.rel='stylesheet';l.href='${ICONS_CSS}';document.head.appendChild(l)}catch(e){}})();`;
