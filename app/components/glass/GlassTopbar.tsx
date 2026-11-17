'use client';

/**
 * Compact Glass top bar. Desktop: page title, search (Ctrl/Cmd+K), the Available toggle (photographers), the wallet
 * balance, the bell and the avatar menu, which now holds theme, language and currency. Phones: menu, logo, bell and
 * avatar only, so nothing overlaps at 360 to 430px.
 *
 * Every behaviour comes from useTopbarState, the same hook the old top bar runs.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle, Bell, BellRing, CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Monitor, Moon, Search,
  ShieldCheck, Sun, User, Wallet,
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useTheme } from '@/app/context/ThemeContext';
import { requestDesktopAlerts } from '@/app/lib/notificationAlerts';
import type { useTopbarState } from '../topbarState';
import { NAV, bottomNav, type GlassRole } from './nav';
import dynamic from 'next/dynamic';
const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });
import { Money } from './Money';

type TopState = ReturnType<typeof useTopbarState>;

const ROLE_LABEL: Record<GlassRole, string> = {
  photographer: 'Photographer', client: 'Client', 'event-coordinator': 'Event Coordinator',
};

export default function GlassTopbar({ role, state, onOpenMenu }: { role: GlassRole; state: TopState; onOpenMenu: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname() || '';
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl+K / Cmd+K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const title = useMemo(() => {
    const all = [...NAV[role].flatMap((g) => g.items), ...bottomNav(role)];
    const hit = all.find((i) => {
      const path = i.href.split('?')[0];
      return pathname === path || pathname.startsWith(`${path}/`) || i.alsoActive?.some((p) => pathname.startsWith(p));
    });
    return hit?.label ?? 'Dashboard';
  }, [pathname, role]);

  return (
    <header className="g-topbar g-blur">
      <button type="button" className="g-icon-btn g-only-mobile" onClick={onOpenMenu} aria-label={t('Open menu')}>
        <Menu size={20} aria-hidden />
      </button>
      <Link href={role === 'photographer' ? '/user/photographer/dashboard' : `/user/${role}/home`}
        className="g-only-mobile g-brand" style={{ height: 'auto', padding: 0, gap: 8 }} aria-label="Connekyt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={26} height={26} />
        <span style={{ fontSize: '1rem' }}>Connekyt</span>
      </Link>

      <div className="g-title g-only-desktop">
        <small>{t(ROLE_LABEL[role])}</small>
        <strong className="g-ellipsis">{t(title)}</strong>
      </div>

      <button type="button" className="g-search g-only-desktop" onClick={() => setPaletteOpen(true)}
        aria-label={t('Search')} style={{ marginLeft: 16 }}>
        <Search size={16} aria-hidden />
        <span className="g-ellipsis">{t('Search pages and actions')}</span>
        <span className="g-kbd" aria-hidden>Ctrl K</span>
      </button>

      <div className="g-spacer" />

      {role === 'photographer' && <AvailableToggle state={state} />}
      <PayRequiredChip role={role} state={state} />
      <BalanceChip role={role} state={state} />
      <Notifications role={role} state={state} />
      <AvatarMenu role={role} state={state} />

      {paletteOpen && <CommandPalette role={role} onClose={() => setPaletteOpen(false)} />}
    </header>
  );
}

/* ── Available: today's state of the photographer's own calendar ──────────────────────────────────────────────── */

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function AvailableToggle({ state }: { state: TopState }) {
  const { t } = useLanguage();
  const { isAvailabilityOpen, setIsAvailabilityOpen, availabilityRef, blockedDates, availSavingDate, toggleBlockedDate,
    fetchBlockedDates, availMonth, setAvailMonth, availLoading } = state;
  const today = iso(new Date());
  // Load once so the chip can say whether today is free; the calendar refreshes when opened.
  useEffect(() => { fetchBlockedDates(); }, [fetchBlockedDates]);
  const available = !blockedDates.has(today);

  const days = useMemo(() => {
    const first = new Date(availMonth.year, availMonth.month, 1);
    const lead = (first.getDay() + 6) % 7; // weeks start on Monday
    const count = new Date(availMonth.year, availMonth.month + 1, 0).getDate();
    return { lead, count };
  }, [availMonth]);
  // Month and weekday names in the viewer's language, from the browser, not the dictionary: two-letter day keys would
  // also rewrite any matching text elsewhere (LanguageContext translates every exactly matching text node).
  const { language } = useLanguage();
  const monthName = new Date(availMonth.year, availMonth.month, 1)
    .toLocaleDateString(language, { month: 'long', year: 'numeric' });
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(language, { weekday: 'narrow' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i))); // 2024-01-01 is a Monday
  }, [language]);
  const step = (n: number) => setAvailMonth((m: { year: number; month: number }) => {
    const d = new Date(m.year, m.month + n, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="g-pop g-only-desktop" ref={availabilityRef}>
      <button type="button" className="g-chip" aria-expanded={isAvailabilityOpen}
        onClick={() => setIsAvailabilityOpen((o: boolean) => !o)}
        title={t('Days you mark here cannot be booked')}>
        <span className={`g-dot${available ? '' : ' off'}`} aria-hidden />
        {available ? t('Available') : t('Unavailable today')}
        <ChevronDown size={14} aria-hidden />
      </button>
      {isAvailabilityOpen && (
        <div className="g-menu g-blur" role="dialog" aria-label={t('Availability')} style={{ width: 320 }}>
          <div className="g-menu-row">
            <span>{t('Available today')}</span>
            <button type="button" role="switch" aria-checked={available} aria-label={t('Available today')}
              disabled={availSavingDate === today} onClick={() => toggleBlockedDate(today)}
              style={{ width: 44, height: 26, borderRadius: 999, border: '1px solid var(--g-stroke)', padding: 2, cursor: 'pointer',
                background: available ? 'var(--g-success)' : 'var(--g-muted)', display: 'inline-flex',
                justifyContent: available ? 'flex-end' : 'flex-start', transition: 'background 150ms' }}>
              <span aria-hidden style={{ width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: 'var(--g-shadow-1)' }} />
            </button>
          </div>
          <div className="g-menu-sep" />
          <div className="g-menu-row">
            <button type="button" className="g-icon-btn" onClick={() => step(-1)} aria-label={t('Previous month')}><ChevronLeft size={16} /></button>
            <strong style={{ fontSize: '0.875rem' }}>{monthName}</strong>
            <button type="button" className="g-icon-btn" onClick={() => step(1)} aria-label={t('Next month')}><ChevronRight size={16} /></button>
          </div>
          <div className="g-cal" aria-busy={availLoading}>
            {weekdays.map((d, i) => <span key={i}>{d}</span>)}
            {Array.from({ length: days.lead }).map((_, i) => <span key={`l${i}`} />)}
            {Array.from({ length: days.count }).map((_, i) => {
              const d = iso(new Date(availMonth.year, availMonth.month, i + 1));
              const past = d < today;
              const blocked = blockedDates.has(d);
              return (
                <button key={d} type="button" disabled={past || availSavingDate === d} aria-pressed={blocked}
                  aria-label={`${d} ${blocked ? t('Unavailable') : t('Available')}`} onClick={() => toggleBlockedDate(d)}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p style={{ margin: '0 10px 8px', fontSize: '0.75rem', color: 'var(--g-text-muted)' }}>
            <CalendarCheck size={12} aria-hidden style={{ verticalAlign: -2, marginRight: 4 }} />
            {t('Days you mark here cannot be booked')}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Payment required: a chip in the bar (fixed height), so it never pushes the page down ───────────────────────── */

function PayRequiredChip({ role, state }: { role: GlassRole; state: TopState }) {
  const { t } = useLanguage();
  const p = state.pendingPaymentWarning;
  if (!p || (role !== 'client' && role !== 'event-coordinator')) return null;
  return (
    <button type="button" className="g-chip g-pay-chip" onClick={state.openPendingPayment}
      aria-label={`${t('Payment required')}: ${p.firstEvent}${p.count > 1 ? ` +${p.count - 1}` : ''}`}>
      <AlertTriangle size={15} aria-hidden />
      <span className="g-pay-chip-text">{t('Payment required')} · <Money amount={p.totalAmount} /></span>
      <strong>{t('Pay now')}</strong>
    </button>
  );
}

/* ── Balance ───────────────────────────────────────────────────────────────────────────────────────────────────── */

function BalanceChip({ role, state }: { role: GlassRole; state: TopState }) {
  const { t } = useLanguage();
  // Only once the wallet answered: a collaborator, or a failed fetch, shows no balance rather than a made-up 0.
  if (state.walletBalance === null) return null;
  const amount = role === 'photographer' ? state.selfBalanceAmount : state.walletBalance;
  return (
    <Link href={`/user/${role}/wallet`} className="g-chip g-only-desktop" aria-label={t('Wallet balance')}>
      <Wallet size={15} aria-hidden style={{ color: 'var(--g-primary-light)' }} />
      <Money amount={amount} />
      {state.walletStatus === 'SUSPENDED' && (
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--g-error)' }}>{t('Suspended')}</span>
      )}
    </Link>
  );
}

/* ── Notifications ─────────────────────────────────────────────────────────────────────────────────────────────── */

function Notifications({ role, state }: { role: GlassRole; state: TopState }) {
  const { t } = useLanguage();
  const { notificationsRef, isNotificationsOpen, setIsNotificationsOpen, notifications, unreadCount, markAllAsRead,
    handleNotificationClick, desktopAlerts, setDesktopAlerts } = state;
  return (
    <div className="g-pop" ref={notificationsRef}>
      <button type="button" className="g-icon-btn" aria-expanded={isNotificationsOpen}
        aria-label={unreadCount > 0 ? `${t('Notifications')}, ${unreadCount} ${t('unread')}` : t('Notifications')}
        onClick={() => setIsNotificationsOpen((o: boolean) => !o)}>
        <Bell size={20} aria-hidden />
        {unreadCount > 0 && <span className="g-count-dot" aria-hidden>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {isNotificationsOpen && (
        <div className="g-menu g-blur" role="dialog" aria-label={t('Notifications')} style={{ width: 360 }}>
          <div className="g-menu-head">
            <strong className="g-display">{t('Notifications')}</strong>
            {unreadCount > 0 && (
              <button type="button" className="g-chip" style={{ height: 28 }} onClick={markAllAsRead}>{t('Mark all as read')}</button>
            )}
          </div>
          {desktopAlerts === 'default' && (
            <button type="button" className="g-menu-item" onClick={async () => setDesktopAlerts(await requestDesktopAlerts())}>
              <BellRing size={16} aria-hidden /> {t('Turn on desktop alerts')}
            </button>
          )}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--g-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                {t('No notifications yet')}
              </p>
            ) : notifications.slice(0, 12).map((n) => (
              <button key={n.id} type="button" className="g-notif" data-unread={!n.read} onClick={() => handleNotificationClick(n)}>
                <span className="g-dot" aria-hidden style={{ marginTop: 6, background: n.read ? 'transparent' : 'var(--g-accent)' }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="g-ellipsis" style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem' }}>{n.title}</span>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    fontSize: '0.8125rem', color: 'var(--g-text-soft)' }}>{n.message}</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--g-text-muted)', flexShrink: 0 }}>{n.time}</span>
              </button>
            ))}
          </div>
          <div className="g-menu-sep" />
          <Link href={`/user/${role}/notifications`} className="g-menu-item" onClick={() => setIsNotificationsOpen(false)}>
            {t('View all')}
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Avatar menu: account, theme, language, currency, log out ──────────────────────────────────────────────────── */

function AvatarMenu({ role, state }: { role: GlassRole; state: TopState }) {
  const { t } = useLanguage();
  const { currencies } = useCurrency();
  const { user, dropdownRef, isDropdownOpen, setIsDropdownOpen, getUserDisplayName, setTheme, language, setLanguage,
    languages, currency, setCurrency, setShowLogoutModal, setShowKycModal, isCollaborator } = state;
  const name = getUserDisplayName();
  const initials = name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  const { theme: stored } = useTheme();
  const needsKyc = !!user && user.kycStatus !== 'APPROVED' && user.customerType !== 'Viewer' && !isCollaborator
    && user.kycStatus !== 'PENDING';

  return (
    <div className="g-pop" ref={dropdownRef}>
      <button type="button" className="g-chip" style={{ padding: '0 6px 0 3px', gap: 6 }} aria-expanded={isDropdownOpen}
        aria-label={t('Account menu')} onClick={() => setIsDropdownOpen((o: boolean) => !o)}>
        {user?.profilePicture
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="g-avatar" src={user.profilePicture} alt="" width={32} height={32} />
          : <span className="g-avatar" aria-hidden>{initials}</span>}
        <span className="g-only-desktop g-ellipsis" style={{ maxWidth: 120 }}>{user?.firstName || name}</span>
        <ChevronDown size={14} aria-hidden className="g-only-desktop" />
      </button>
      {isDropdownOpen && (
        <div className="g-menu g-blur" role="menu" aria-label={t('Account menu')} style={{ width: 300 }}>
          <div className="g-menu-head" style={{ justifyContent: 'flex-start' }}>
            <span style={{ minWidth: 0 }}>
              <strong className="g-ellipsis" style={{ display: 'block' }}>{name}</strong>
              {user?.email && <span className="g-ellipsis" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g-text-muted)' }}>{user.email}</span>}
            </span>
          </div>
          <div className="g-menu-sep" />
          <Link href={`/user/${role}/profile`} className="g-menu-item" role="menuitem" onClick={() => setIsDropdownOpen(false)}>
            <User size={16} aria-hidden /> {t('Profile')}
          </Link>
          {needsKyc && (
            <button type="button" className="g-menu-item" role="menuitem" onClick={() => { setIsDropdownOpen(false); setShowKycModal(true); }}>
              <ShieldCheck size={16} aria-hidden /> {t('Verify your identity')}
            </button>
          )}
          <div className="g-menu-sep" />
          <div className="g-menu-row">
            <span>{t('Color theme')}</span>
            <div className="g-seg" role="group" aria-label={t('Color theme')}>
              {([['light', Sun], ['dark', Moon], ['system', Monitor]] as const).map(([mode, Icon]) => (
                <button key={mode} type="button" aria-pressed={stored === mode} aria-label={t(mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System')}
                  onClick={() => setTheme(mode)}>
                  <Icon size={14} aria-hidden />
                </button>
              ))}
            </div>
          </div>
          <label className="g-menu-row">
            <span>{t('Language')}</span>
            <select className="g-select" value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
              {languages.map((l: { code: string; nativeLabel: string }) => <option key={l.code} value={l.code}>{l.nativeLabel}</option>)}
            </select>
          </label>
          <label className="g-menu-row">
            <span>{t('Currency')}</span>
            <select className="g-select" value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)}>
              {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </label>
          <div className="g-menu-sep" />
          <button type="button" className="g-menu-item" role="menuitem" style={{ color: 'var(--g-error)' }}
            onClick={() => { setIsDropdownOpen(false); setShowLogoutModal(true); }}>
            <LogOut size={16} aria-hidden /> {t('Log out')}
          </button>
        </div>
      )}
    </div>
  );
}
