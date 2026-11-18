'use client';

/**
 * The Compact Glass shell: one layout for every photographer, client and coordinator page, used only when the page
 * was served with the ui-glass flag (app/lib/uiGlass.ts). With the flag off it renders the page untouched, and the
 * page's own Sidebar and Topbar draw the old shell as before.
 *
 * Pages still mount their old <Sidebar/> and <Topbar/>; both render nothing under the flag, so the page needs no
 * change to sit inside this shell.
 */
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useStackTables } from './useStackTables';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, LogOut, X } from 'lucide-react';
import { useUiGlass } from '@/app/lib/useUiGlass';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/lib/usePermissions';
import { useWorkspace } from '@/app/providers/WorkspaceProvider';
import { useLanguage } from '@/app/context/LanguageContext';
import { useNavBadges } from '../navBadges';
import { SHARED_WORKSPACE_HIDDEN } from '../sidebar';
import { useTopbarState } from '../topbarState';
import { NAV, bottomNav, isActive, roleFromPath, subTabsFor, tabNav, type GlassNavItem, type GlassRole } from './nav';
import GlassTopbar from './GlassTopbar';
import GlassBanners from './GlassBanners';
import GlassDialogs from './GlassDialogs';

const COLLAPSE_KEY = 'ck-glass-sidebar-collapsed';

export default function GlassShell({ children }: { children: ReactNode }) {
  const glass = useUiGlass();
  if (!glass) return <>{children}</>;
  return <GlassFrame>{children}</GlassFrame>;
}

function GlassFrame({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname() || '';
  const role = roleFromPath(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  useStackTables(hostRef);
  const top = useTopbarState(role);
  // Polled once here and handed to the sidebar, drawer and tab bar.
  const badges = useNavBadges(role);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1'); } catch { /* private mode: default open */ }
  }, []);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* not remembered, still works */ }
      return !c;
    });
  }, []);

  // The drawer closes on navigation and on Escape.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="g-shell" data-collapsed={collapsed ? 'true' : 'false'}>
      {/* WCAG 2.4.1: the first Tab stop jumps over the sidebar and top bar to the page. */}
      <a href="#g-main" className="g-skip" onClick={(e) => { e.preventDefault(); const m = document.getElementById('g-main'); m?.focus(); m?.scrollIntoView({ block: 'start' }); }}>{t('Skip to content')}</a>
      <aside className="g-sidebar g-blur" aria-label="Main">
        <Brand role={role} />
        <Suspense fallback={null}><SidebarNav role={role} badges={badges} onLogout={() => top.setShowLogoutModal(true)} /></Suspense>
        <div style={{ padding: '0 12px 12px' }}>
          <CollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>
      </aside>

      <GlassTopbar role={role} state={top} onOpenMenu={() => setDrawerOpen(true)} />

      <div className="g-content">
        <div className="g-banners"><GlassBanners role={role} state={top} /></div>
        <SubTabs role={role} />
        <div id="g-main" tabIndex={-1} className="g-page-host" ref={hostRef}>{children}</div>
      </div>

      <Suspense fallback={null}><TabBar role={role} badges={badges} /></Suspense>

      {drawerOpen && (
        <>
          <div className="g-scrim" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="g-drawer g-blur" aria-label="Menu" role="dialog" aria-modal="true">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Brand role={role} />
              <DrawerClose onClose={() => setDrawerOpen(false)} />
            </div>
            <Suspense fallback={null}><SidebarNav role={role} badges={badges} onLogout={() => { setDrawerOpen(false); top.setShowLogoutModal(true); }} /></Suspense>
          </aside>
        </>
      )}

      <GlassDialogs role={role} state={top} />
    </div>
  );
}

/** Tabs between a page group's routes (Wallet, Transactions, All transactions, Payroll report). */
function SubTabs({ role }: { role: GlassRole }) {
  const pathname = usePathname() || '';
  const { t } = useLanguage();
  const { visible } = useVisible(role);
  const tabs = subTabsFor(role, pathname);
  if (!tabs) return null;
  // The same permission rule as the Wallet item: no payments permission, no money tabs.
  if (!visible({ key: 'Wallet', label: 'Wallet', href: '', icon: ChevronsLeft, requires: ['payments.view'] })) return null;
  return (
    <nav className="g-subtabs" aria-label={t('Wallet')}>
      {tabs.filter((x) => visible({ key: x.key ?? 'Wallet', label: x.label, href: x.href, icon: ChevronsLeft })).map((x) => (
        <Link key={x.href} href={x.href} aria-current={pathname === x.href || pathname.startsWith(`${x.href}/`) ? 'page' : undefined}>{t(x.label)}</Link>
      ))}
    </nav>
  );
}

function Brand({ role }: { role: GlassRole }) {
  const home = role === 'photographer' ? '/user/photographer/dashboard' : `/user/${role}/home`;
  return (
    <Link href={home} className="g-brand" aria-label="Connekyt">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={28} height={28} />
      <span>Connekyt</span>
    </Link>
  );
}

function CollapseButton({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  const label = collapsed ? t('Expand sidebar') : t('Collapse sidebar');
  return (
    <button type="button" className="g-nav-link" onClick={onToggle} aria-label={label} title={label}>
      {collapsed ? <ChevronsRight size={18} aria-hidden /> : <ChevronsLeft size={18} aria-hidden />}
      <span className="g-nav-label">{t('Collapse menu')}</span>
    </button>
  );
}

function DrawerClose({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <button type="button" className="g-icon-btn" onClick={onClose} aria-label={t('Close')} style={{ marginLeft: 'auto', marginRight: 10 }}>
      <X size={20} aria-hidden />
    </button>
  );
}

/** The same filters as the old sidebar: permissions, owner-only, workspace rules and the not-yet-accepted lock. */
function useVisible(role: GlassRole) {
  const { user } = useDashboardAuth();
  const { hasAny } = usePermissions();
  const { isShared, isCollaborator } = useWorkspace();
  const hidden = (key: string) => role === 'photographer' && isShared
    && (SHARED_WORKSPACE_HIDDEN.has(key) || (isCollaborator && key === 'Wallet'));
  const visible = (i: GlassNavItem) => (!i.requires || hasAny(i.requires)) && !hidden(i.key);
  const locked = role === 'photographer' && !!user
    && (user.profileReviewStatus?.toUpperCase?.() ?? 'ACCEPTED') !== 'ACCEPTED';
  return { visible, locked };
}

type Badges = ReturnType<typeof useNavBadges>;

function SidebarNav({ role, badges, onLogout }: { role: GlassRole; badges: Badges; onLogout: () => void }) {
  const pathname = usePathname() || '';
  const search = useSearchParams()?.toString() || '';
  const { t } = useLanguage();
  const { visible, locked } = useVisible(role);
  const count = (i: GlassNavItem) => i.badge === 'notifications' ? badges.notificationCount
    : i.badge === 'messages' ? badges.messageCount : i.badge === 'opportunities' ? badges.opportunityCount : 0;

  const link = (i: GlassNavItem) => {
    const n = count(i);
    const current = isActive(i, pathname, search);
    const Icon = i.icon;
    return (
      <Link key={i.key} href={i.href} className="g-nav-link" aria-current={current ? 'page' : undefined}
        aria-disabled={locked ? 'true' : undefined} tabIndex={locked ? -1 : undefined} title={t(i.label)}>
        <Icon size={18} aria-hidden />
        <span className="g-nav-label g-ellipsis">{t(i.label)}</span>
        {n > 0 && <span className="g-badge" aria-label={`${n}`}>{n > 99 ? '99+' : n}</span>}
      </Link>
    );
  };

  return (
    <>
      <nav className="g-nav">
        {NAV[role].map((g) => {
          const items = g.items.filter(visible);
          if (!items.length) return null;
          return (
            <div key={g.label}>
              <div className="g-nav-group">{t(g.label)}</div>
              {items.map(link)}
            </div>
          );
        })}
      </nav>
      <div className="g-nav-bottom">
        {bottomNav(role).filter(visible).map(link)}
        <button type="button" className="g-nav-link g-danger" onClick={onLogout} title={t('Log out')}>
          <LogOut size={18} aria-hidden />
          <span className="g-nav-label">{t('Log out')}</span>
        </button>
      </div>
    </>
  );
}

function TabBar({ role, badges }: { role: GlassRole; badges: Badges }) {
  const pathname = usePathname() || '';
  const search = useSearchParams()?.toString() || '';
  const { t } = useLanguage();
  const { visible } = useVisible(role);
  return (
    <nav className="g-tabbar g-blur" aria-label={t('Main navigation')}>
      {tabNav(role).filter(visible).map((i) => {
        const Icon = i.icon;
        const current = isActive(i, pathname, search);
        const dot = (i.badge === 'messages' && badges.messageCount > 0)
          || (i.badge === 'opportunities' && badges.opportunityCount > 0);
        return (
          <Link key={i.key} href={i.href} className="g-tab" aria-current={current ? 'page' : undefined}>
            <Icon size={20} aria-hidden />
            <span className="g-ellipsis" style={{ maxWidth: '100%' }}>{t(i.label)}</span>
            {dot && <span className="g-tab-dot" aria-hidden />}
          </Link>
        );
      })}
    </nav>
  );
}
