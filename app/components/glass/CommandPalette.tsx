'use client';

/**
 * Ctrl/Cmd+K search. Pages and actions the viewer can open (the sidebar's list and permission rules) match instantly;
 * once two characters are typed the account's own events, clients and packages are searched on the server
 * (GET /api/remote/{photographer,customer,coordinator}/search, at most 20 results, workspace-aware). If the search
 * cannot be reached, or the viewer is going too fast (429), the pages still work.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CornerDownLeft, Package, Search, Users } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { usePermissions } from '@/app/lib/usePermissions';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { NAV, bottomNav, type GlassNavItem, type GlassRole } from './nav';

interface Hit { id: string; title: string; date?: string }
interface Found { events: Hit[]; clients: Hit[]; packages: Hit[] }
interface Row { key: string; label: string; sub?: string; href: string; icon: React.ReactNode; group: 'page' | 'event' | 'client' | 'package' }

const SEARCH_PATH: Record<GlassRole, string> = {
  photographer: '/api/remote/photographer/search',
  client: '/api/remote/customer/search',
  'event-coordinator': '/api/remote/coordinator/search',
};

export default function CommandPalette({ role, onClose }: { role: GlassRole; onClose: () => void }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { hasAny } = usePermissions();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [found, setFound] = useState<Found | null>(null);
  const [searching, setSearching] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);

  // Server search, debounced; a newer keystroke cancels the older request's result.
  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2) { setFound(null); setSearching(false); return; }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await dashboardAuthFetch(`${getApiUrl()}${SEARCH_PATH[role]}?q=${encodeURIComponent(needle)}`);
        const body = res.ok ? await res.json() : null;
        if (alive) setFound(body && body.action === 1 ? (body.data as Found) : null);
      } catch { if (alive) setFound(null); }
      finally { if (alive) setSearching(false); }
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, role]);

  const base = role === 'photographer' ? '/user/photographer' : `/user/${role}`;
  const rows = useMemo<Row[]>(() => {
    const all: GlassNavItem[] = [...NAV[role].flatMap((g) => g.items), ...bottomNav(role)].filter((i) => !i.requires || hasAny(i.requires));
    const needle = q.trim().toLowerCase();
    const pages: Row[] = (needle ? all.filter((i) => t(i.label).toLowerCase().includes(needle) || i.label.toLowerCase().includes(needle)) : all)
      .map((i) => { const Icon = i.icon; return { key: `p-${i.key}`, label: t(i.label), href: i.href, icon: <Icon size={16} aria-hidden />, group: 'page' as const }; });
    const out: Row[] = [];
    for (const e of found?.events ?? []) out.push({ key: `e-${e.id}`, label: e.title, sub: e.date, href: `${base}/events/${e.id}`, icon: <CalendarDays size={16} aria-hidden />, group: 'event' });
    for (const c of found?.clients ?? []) out.push({ key: `c-${c.id}`, label: c.title, href: `${base}/clients`, icon: <Users size={16} aria-hidden />, group: 'client' });
    for (const p of found?.packages ?? []) out.push({ key: `k-${p.id}`, label: p.title, href: `${base}/profile?tab=packages`, icon: <Package size={16} aria-hidden />, group: 'package' });
    return [...out, ...pages];
  }, [q, role, hasAny, t, found, base]);
  useEffect(() => { setSel(0); }, [q, found]);

  const go = (r?: Row) => { if (!r) return; onClose(); router.push(r.href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, rows.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') go(rows[sel]);
  };
  const GROUP: Record<Row['group'], string> = { page: 'Pages', event: 'Events', client: 'Clients', package: 'Packages' };

  return (
    <>
      <div className="g-scrim" onClick={onClose} aria-hidden />
      <div className="g-palette g-blur" role="dialog" aria-modal="true" aria-label={t('Search')}>
        <div className="g-palette-input">
          <Search size={18} aria-hidden />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder={t('Search pages and actions')} aria-label={t('Search')} role="combobox"
            aria-expanded="true" aria-controls="g-palette-list" aria-activedescendant={rows[sel] ? `g-pal-${rows[sel].key}` : undefined} />
        </div>
        {rows.length === 0 ? (
          <div className="g-palette-empty">{searching ? t('Searching…') : t('No results')}</div>
        ) : (
          <ul id="g-palette-list" role="listbox">
            {rows.map((r, n) => (
              <li key={r.key} id={`g-pal-${r.key}`} role="option" aria-selected={n === sel} onMouseEnter={() => setSel(n)}>
                {(n === 0 || rows[n - 1].group !== r.group) && <div className="g-nav-group" style={{ margin: '8px 0 2px' }}>{t(GROUP[r.group])}</div>}
                <button type="button" className="g-menu-item" onClick={() => go(r)}>
                  {r.icon} <span className="g-ellipsis" style={{ flex: 1 }}>{r.label}</span>
                  {r.sub && <small style={{ color: 'var(--g-text-muted)' }}>{r.sub}</small>}
                  {n === sel && <CornerDownLeft size={14} aria-hidden style={{ color: 'var(--g-text-muted)' }} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
