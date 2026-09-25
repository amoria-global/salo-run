"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";
import { usePermissions } from "../lib/usePermissions";
import { getLandingUrl } from "@/lib/urls";
import { getApiUrl } from '@/lib/api';
import Modal from './ui/Modal';
import Button from './ui/Button';

type UserRole = "photographer" | "client" | "event-coordinator" | "admin";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  group?: string;
  // Optional permission gate. If set, the item is hidden when the
  // caller's permission set doesn't include any of these names.
  // Owners hold every permission so this only ever hides items for
  // restricted team members.
  requires?: string[];
  // When true, the item is shown ONLY to organisation owners. Use
  // for structurally owner-only surfaces (e.g. team management) so
  // a team-member role that happens to be seeded with the matching
  // permissions still can't see the link.
  ownerOnly?: boolean;
}

// Single Team entry-point. The /user/team layout already renders an
// internal tab strip for Users / Roles / Permissions, so duplicating
// those as separate sidebar items would be redundant. Owner-only —
// invited team members never see the link in their sidebar, even if
// the default role they were assigned was seeded with users.view /
// roles.view.
const TEAM_ITEMS: NavigationItem[] = [
  { name: "Team", href: "/user/team/users", icon: "bi-people-fill", group: 'Team', ownerOnly: true },
];

const roleNavigationMap: Record<UserRole, NavigationItem[]> = {
  photographer: [
    { name: "Home", href: "/user/photographer/dashboard", icon: "bi-house-door", group: 'Overview' },
    { name: "Notifications", href: "/user/photographer/notifications", icon: "bi-bell", group: 'Overview' },
    { name: "Inbox", href: "/user/photographer/inbox", icon: "bi-chat-dots", group: 'Overview', requires: ['messages.view'] },
    { name: "Events", href: "/user/photographer/events", icon: "bi-calendar-event", group: 'Work', requires: ['events.view'] },
    { name: "Clients", href: "/user/photographer/clients", icon: "bi-people", group: 'Work', requires: ['bookings.view'] },
    { name: "Wallet", href: "/user/photographer/wallet", icon: "bi-wallet2", group: 'Money', requires: ['payments.view'] },
    { name: "Transactions", href: "/user/photographer/transaction", icon: "bi-arrow-left-right", group: 'Money', requires: ['payments.view'] },
    { name: "Donate", href: "/user/photographer/donate", icon: "bi-heart", group: 'Money' },
    ...TEAM_ITEMS,
  ],
  client: [
    { name: "Home", href: "/user/client/home", icon: "bi-house-door", group: 'Overview' },
    { name: "Notifications", href: "/user/client/notifications", icon: "bi-bell", group: 'Overview' },
    { name: "Inbox", href: "/user/client/inbox", icon: "bi-chat-dots", group: 'Overview', requires: ['messages.view'] },
    { name: "My Events", href: "/user/client/events", icon: "bi-calendar-event", group: 'Work', requires: ['events.view'] },
    { name: "Streams", href: "/user/client/streams", icon: "bi-broadcast", group: 'Work' },
    { name: "Gallery", href: "/user/client/gallery", icon: "bi-image", group: 'Work' },
    { name: "Photographers", href: "/user/client/photographers", icon: "bi-camera", group: 'Work', requires: ['bookings.view'] },
    { name: "Payments", href: "/user/client/payments", icon: "bi-credit-card", group: 'Money', requires: ['payments.view'] },
    { name: "Wallet", href: "/user/client/wallet", icon: "bi-wallet2", group: 'Money', requires: ['payments.view'] },
    { name: "Donate", href: "/user/client/donate", icon: "bi-heart", group: 'Money' },
    ...TEAM_ITEMS,
  ],
  "event-coordinator": [
    { name: "Home", href: "/user/event-coordinator/home", icon: "bi-house-door", group: 'Overview' },
    { name: "Notifications", href: "/user/event-coordinator/notifications", icon: "bi-bell", group: 'Overview' },
    { name: "Inbox", href: "/user/event-coordinator/inbox", icon: "bi-chat-dots", group: 'Overview', requires: ['messages.view'] },
    { name: "My Events", href: "/user/event-coordinator/events", icon: "bi-calendar-event", group: 'Work', requires: ['events.view'] },
    { name: "Streams", href: "/user/event-coordinator/streams", icon: "bi-broadcast", group: 'Work' },
    { name: "Gallery", href: "/user/event-coordinator/gallery", icon: "bi-image", group: 'Work' },
    { name: "Photographers", href: "/user/event-coordinator/photographers", icon: "bi-camera", group: 'Work', requires: ['bookings.view'] },
    { name: "Payments", href: "/user/event-coordinator/payments", icon: "bi-credit-card", group: 'Money', requires: ['payments.view'] },
    { name: "Wallet", href: "/user/event-coordinator/wallet", icon: "bi-wallet2", group: 'Money', requires: ['payments.view'] },
    { name: "Donate", href: "/user/event-coordinator/donate", icon: "bi-heart", group: 'Money' },
    ...TEAM_ITEMS,
  ],
  admin: [
    { name: "Wallets", href: "/user/admin/wallets", icon: "bi-wallet2", group: 'Admin' },
  ],
};

const getBottomNavigationItems = (role: UserRole): NavigationItem[] => {
  // Preferences holds sensitive org settings (KYC, withdrawal verification,
  // 2FA on the owner account, etc.) - gated by settings.manage so a
  // restricted team member without that perm can't see or open it. Owners
  // hold every permission so they always pass.
  if (role === "photographer") {
    return [
      { name: "Profile", href: "/user/photographer/profile", icon: "bi-person" },
      { name: "Preferences", href: "/user/photographer/preferences", icon: "bi-sliders", requires: ['settings.manage'] },
      { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
    ];
  } else if (role === "event-coordinator") {
    return [
      { name: "Profile", href: "/user/event-coordinator/profile", icon: "bi-person" },
      { name: "Preferences", href: "/user/event-coordinator/preferences", icon: "bi-sliders", requires: ['settings.manage'] },
      { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
    ];
  } else if (role === "admin") {
    return [{ name: "Logout", href: "/", icon: "bi-box-arrow-right" }];
  }
  return [
    { name: "Profile", href: "/user/client/profile", icon: "bi-person" },
    { name: "Preferences", href: "/user/client/preferences", icon: "bi-sliders", requires: ['settings.manage'] },
    { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
  ];
};

const roleFromCustomerType = (customerType: string | null | undefined): UserRole | null => {
  const t = (customerType || '').toUpperCase();
  if (t === 'PHOTOGRAPHER' || t === 'VIDEOGRAPHER') return 'photographer';
  if (t === 'EVENT_COORDINATOR') return 'event-coordinator';
  // USER was merged into Client; a session minted before that still says USER.
  if (t === 'CLIENT' || t === 'INDIVIDUAL' || t === 'USER') return 'client';
  return null;
};

// Resolve which role's nav to render. URL path is the primary signal
// for role-specific sections (/user/photographer, /user/admin, …) but
// shared sections (/user/team, /user/not-authorized, /user/auth) live
// outside any role bucket - for those we fall back to the authenticated
// user's customerType so a photographer browsing /user/team doesn't see
// the client sidebar wired with /user/client/* links.
const detectRole = (pathname: string | null, customerType: string | null | undefined): UserRole => {
  if (pathname && pathname.includes("/user/admin")) return "admin";
  if (pathname && pathname.includes("/user/photographer")) return "photographer";
  if (pathname && pathname.includes("/user/event-coordinator")) return "event-coordinator";
  if (pathname && pathname.includes("/user/client")) return "client";
  return roleFromCustomerType(customerType) ?? "client";
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useDashboardAuth();
  // hasAny() reads from the permission set fetched by PermissionProvider.
  // Until that resolves, the set is empty so gated items stay hidden.
  const { hasAny, isOwner } = usePermissions();
  const currentUserId = user?.id || '';
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentRole = useMemo(() => detectRole(pathname, user?.customerType), [pathname, user?.customerType]);

  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const lastInboxEventTimeRef = useRef<number>(0);

  const fetchBadgeCounts = useCallback(async () => {
    if (!user) return;
    const fetchStartTime = Date.now();
    const apiUrl = getApiUrl();
    const notifPrefix = currentRole === 'photographer' ? 'photographer' : currentRole === 'event-coordinator' ? 'coordinator' : 'customer';
    const isOnInboxPage = pathname?.includes('/inbox');
    try {
      const [notifRes, convRes] = await Promise.all([
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifPrefix}/notifications/unread-count`, { method: 'GET' }),
        dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`, { method: 'GET' }),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.action === 1) setNotificationCount(data.data ?? 0);
      }
      if (convRes.ok && !isOnInboxPage) {
        const data = await convRes.json();
        const list = data.data || data || [];
        if (Array.isArray(list)) {
          const validList = currentUserId
            ? list.filter((c: any) => (c.participants || []).some((p: any) => p.id && p.id !== currentUserId))
            : list;
          const total = validList.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          if (lastInboxEventTimeRef.current <= fetchStartTime) setMessageCount(total);
        }
      }
    } catch { /* silent */ }
  }, [user, currentRole, pathname, currentUserId]);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    const handleBadgeUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'notification') {
        setNotificationCount(prev => Math.max(0, prev - (detail.count || 1)));
      } else fetchBadgeCounts();
    };
    window.addEventListener('badge-update', handleBadgeUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('badge-update', handleBadgeUpdate);
    };
  }, [fetchBadgeCounts]);

  useEffect(() => {
    const handleTotalCount = (e: Event) => {
      const total = (e as CustomEvent<{ total: number }>).detail?.total ?? 0;
      setMessageCount(total);
      lastInboxEventTimeRef.current = Date.now();
    };
    window.addEventListener('inbox:totalCount', handleTotalCount);
    return () => window.removeEventListener('inbox:totalCount', handleTotalCount);
  }, []);

  const isNotAccepted = currentRole === 'photographer'
    && !!user
    && (user.profileReviewStatus?.toUpperCase?.() ?? 'ACCEPTED') !== 'ACCEPTED';

  const navigationItems = roleNavigationMap[currentRole]
    // Strict permission gate: items with `requires` are hidden until the
    // permission fetch confirms the caller holds at least one of them.
    // No fail-open during loading - a team member without the perm must
    // NEVER see the tab, not even for a frame (was causing a flash of
    // restricted items on initial render). Owners see un-gated items
    // immediately and the rest pop in once /api/remote/team/me/permissions
    // resolves (usually <300ms). ownerOnly is the strictest tier and
    // hides the item from every non-owner regardless of which perms
    // their role was seeded with.
    .filter(item => !item.ownerOnly || isOwner)
    .filter(item => !item.requires || hasAny(item.requires))
    .map(item => {
      if (item.name === "Notifications") return { ...item, badge: notificationCount };
      if (item.name === "Inbox") return { ...item, badge: messageCount };
      return item;
    });
  // Same filters as the main nav for the bottom nav.
  const bottomNavigationItems = getBottomNavigationItems(currentRole)
    .filter(item => !item.ownerOnly || isOwner)
    .filter(item => !item.requires || hasAny(item.requires));

  const groups = useMemo(() => {
    const map = new Map<string, NavigationItem[]>();
    navigationItems.forEach(it => {
      const k = it.group ?? 'Main';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    });
    return Array.from(map.entries());
  }, [navigationItems]);

  const closeMobile = () => setIsMobileMenuOpen(false);

  const renderNavLink = (item: NavigationItem) => {
    const isActive = pathname === item.href ||
      (item.name === 'Transactions' && pathname === `/user/${currentRole}/all-transactions`);
    const disabled = isNotAccepted;
    const Inner = (
      <>
        <i className={`bi ${item.icon}`} />
        {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.name}</span>}
        {!isCollapsed && item.badge && item.badge > 0 ? (
          <span style={{
            background: '#F20C8F', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
            borderRadius: 9999, minWidth: 20, height: 20, padding: '0 6px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        ) : null}
        {isCollapsed && item.badge && item.badge > 0 ? (
          <span style={{
            position: 'absolute', top: 4, right: 4, width: 8, height: 8,
            borderRadius: 9999, background: '#F20C8F', boxShadow: '0 0 0 2px var(--ck-surface)',
          }} />
        ) : null}
      </>
    );
    if (disabled) {
      return (
        <div key={item.name} className="ck-side-link"
          style={{ opacity: 0.4, cursor: 'not-allowed', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          title={isCollapsed ? item.name : undefined}>
          {Inner}
        </div>
      );
    }
    return (
      <Link key={item.name} href={item.href} onClick={closeMobile}
        className={`ck-side-link ${isActive ? 'active' : ''}`}
        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        title={isCollapsed ? item.name : undefined}>
        {Inner}
      </Link>
    );
  };

  return (
    <>
      <style jsx>{`
        .sidebar-container {
          display: flex; flex-direction: column;
          height: 100vh; background: var(--ck-surface);
          border-right: 1px solid var(--ck-stroke);
          transition: width 0.25s var(--ck-ease);
          width: ${isCollapsed ? '4.5rem' : '15.5rem'};
          flex-shrink: 0; z-index: 30;
        }
        .mobile-menu-button { display: none; }
        .mobile-overlay { display: none; }
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed !important;
            left: ${isMobileMenuOpen ? '0' : '-100%'} !important;
            top: 0 !important; z-index: 1000 !important;
            width: 16rem !important;
            transition: left 0.3s var(--ck-ease) !important;
            box-shadow: ${isMobileMenuOpen ? '8px 0 32px rgba(0,0,0,0.15)' : 'none'};
          }
          .mobile-menu-button {
            display: flex !important; position: fixed !important;
            top: 0.85rem !important; left: 0.6rem !important; z-index: 1001 !important;
            background: var(--ck-surface) !important;
            border: 1px solid var(--ck-stroke) !important;
            border-radius: 10px !important; padding: 0.45rem 0.6rem !important;
            cursor: pointer !important; box-shadow: var(--ck-shadow-sm) !important;
            color: var(--ck-text);
          }
          .mobile-overlay {
            display: ${isMobileMenuOpen ? 'block' : 'none'} !important;
            position: fixed !important; inset: 0 !important;
            background: rgba(0,0,0,0.45) !important; z-index: 999 !important;
          }
          .sidebar-toggle-desktop { display: none !important; }
        }
      `}</style>

      <button className="mobile-menu-button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Open menu">
        <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: 18 }} />
      </button>
      <div className="mobile-overlay" onClick={closeMobile} />

      <aside className="sidebar-container">
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '18px 12px' : '14px 18px 14px 22px',
          borderBottom: '1px solid var(--ck-stroke)', height: 64,
          background: 'linear-gradient(180deg, rgba(8,58,133,0.03) 0%, transparent 100%)',
        }}>
          {!isCollapsed ? (
            <Link href={getLandingUrl()} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <img src="/logo.png" alt="Connekyt Logo"
                style={{ width: 49, height: 49, objectFit: 'contain', position: 'relative', top: -1, left: -15 }} />
              <span className="ck-brand-text" style={{
                fontWeight: 700, fontSize: '1.3rem', marginLeft: -20, letterSpacing: '0.3px',
              }}>Connekyt</span>
            </Link>
          ) : (
            <Link href={getLandingUrl()} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/logo.png" alt="Connekyt" style={{ width: 39, height: 39, objectFit: 'contain' }} />
            </Link>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle-desktop"
            aria-label="Collapse sidebar"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--ck-text-soft)', padding: 4, borderRadius: 8,
              display: isCollapsed ? 'none' : 'inline-flex', alignItems: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ck-surface-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <i className="bi bi-chevron-double-left" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map(([groupName, items]) => (
            <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!isCollapsed && <div className="ck-side-section">{groupName}</div>}
              {items.map(renderNavLink)}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <nav style={{ padding: '12px', borderTop: '1px solid var(--ck-stroke)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bottomNavigationItems.map((item) => {
            const isActive = pathname === item.href;
            const isLogout = item.name === 'Logout';
            const isProfile = item.name === 'Profile';
            const isDisabledItem = isNotAccepted && !isLogout && !isProfile;
            const inner = (
              <>
                <i className={`bi ${item.icon}`} />
                {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.name}</span>}
              </>
            );
            if (isDisabledItem) {
              return (
                <div key={item.name} className="ck-side-link"
                  style={{ opacity: 0.4, cursor: 'not-allowed', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                  {inner}
                </div>
              );
            }
            return (
              <Link key={item.name} href={item.href}
                onClick={(e) => {
                  if (isLogout) { e.preventDefault(); setShowLogoutModal(true); }
                  else closeMobile();
                }}
                className={`ck-side-link ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  ...(isLogout ? { color: '#DC2626' } : {}),
                }}>
                {inner}
              </Link>
            );
          })}
          {isCollapsed && (
            <button onClick={() => setIsCollapsed(false)} aria-label="Expand sidebar"
              style={{
                marginTop: 8, background: 'transparent',
                border: '1px dashed var(--ck-stroke)', borderRadius: 10,
                padding: 8, cursor: 'pointer', color: 'var(--ck-text-soft)',
              }}>
              <i className="bi bi-chevron-double-right" style={{ fontSize: 13 }} />
            </button>
          )}
        </nav>
      </aside>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}
        size="sm" title="Sign out of Connekyt?"
        description="You'll need to sign in again to access your dashboard."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setShowLogoutModal(false); logout(); }}>Sign out</Button>
          </>
        }>
        <div style={{
          width: 56, height: 56, borderRadius: 9999,
          background: '#FEF2F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 4px',
        }}>
          <i className="bi bi-box-arrow-right" style={{ color: '#DC2626', fontSize: 22 }} />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--ck-text-soft)', margin: '8px 0 0' }}>
          Your session will end on this device.
        </p>
      </Modal>
    </>
  );
}
