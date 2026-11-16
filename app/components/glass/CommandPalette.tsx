'use client';

/**
 * Ctrl/Cmd+K search. Stage 1 searches the pages and actions the viewer can open (the same list and permission rules
 * as the sidebar). Searching events, clients and packages by name needs a non-admin search endpoint, which the
 * backend does not have yet (GlobalSearchController is admin-only).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { usePermissions } from '@/app/lib/usePermissions';
import { NAV, bottomNav, type GlassNavItem, type GlassRole } from './nav';

export default function CommandPalette({ role, onClose }: { role: GlassRole; onClose: () => void }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { hasAny } = usePermissions();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);

  const items = useMemo(() => {
    const all: GlassNavItem[] = [...NAV[role].flatMap((g) => g.items), ...bottomNav(role)]
      .filter((i) => !i.requires || hasAny(i.requires));
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((i) => t(i.label).toLowerCase().includes(needle) || i.label.toLowerCase().includes(needle)) : all;
  }, [q, role, hasAny, t]);
  useEffect(() => { setSel(0); }, [q]);

  const go = (i?: GlassNavItem) => { if (!i) return; onClose(); router.push(i.href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') go(items[sel]);
  };

  return (
    <>
      <div className="g-scrim" onClick={onClose} aria-hidden />
      <div className="g-palette g-blur" role="dialog" aria-modal="true" aria-label={t('Search')}>
        <div className="g-palette-input">
          <Search size={18} aria-hidden />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder={t('Search pages and actions')} aria-label={t('Search')} role="combobox"
            aria-expanded="true" aria-controls="g-palette-list" aria-activedescendant={items[sel] ? `g-pal-${items[sel].key}` : undefined} />
        </div>
        {items.length === 0 ? (
          <div className="g-palette-empty">{t('No results')}</div>
        ) : (
          <ul id="g-palette-list" role="listbox">
            {items.map((i, n) => {
              const Icon = i.icon;
              return (
                <li key={i.key} id={`g-pal-${i.key}`} role="option" aria-selected={n === sel} onMouseEnter={() => setSel(n)}>
                  <button type="button" className="g-menu-item" onClick={() => go(i)}>
                    <Icon size={16} aria-hidden /> <span style={{ flex: 1 }}>{t(i.label)}</span>
                    {n === sel && <CornerDownLeft size={14} aria-hidden style={{ color: 'var(--g-text-muted)' }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
