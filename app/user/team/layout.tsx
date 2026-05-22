'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/context/ThemeContext';
import { usePermissions } from '@/app/lib/usePermissions';

/**
 * Layout shared by /user/team/* pages.
 *
 * Wraps the Team tabs in the standard dashboard chrome (Sidebar + Topbar)
 * so the page matches every other dashboard route. PermissionProvider
 * lives at the root layout, so usePermissions() is already populated.
 *
 * Hard gate: if the caller has none of the team perms we punt them back
 * to their role's dashboard. Owners always pass (implicit all-perms).
 *
 * The Topbar's userRole prop drives notifications/inbox fetching. We
 * map customerType → the topbar's enum so a photographer-owned team
 * member's notifications panel reads from the photographer endpoint.
 */
export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useDashboardAuth();
  const { colors } = useTheme();
  const { loading, hasAny, organizationName, roleName, isOwner } = usePermissions();

  // Bounce out if the user has zero team permissions.
  useEffect(() => {
    if (loading) return;
    const ok = hasAny(['users.view', 'roles.view']);
    if (!ok) {
      const role = (user?.customerType || '').toUpperCase();
      const home =
        role === 'PHOTOGRAPHER' || role === 'VIDEOGRAPHER' ? '/user/photographer/dashboard' :
        role === 'EVENT_COORDINATOR' ? '/user/event-coordinator/home' :
        '/user/client/home';
      router.replace(home);
    }
  }, [loading, hasAny, router, user?.customerType]);

  const topbarRole: 'client' | 'photographer' | 'event-coordinator' = useMemo(() => {
    const t = (user?.customerType || '').toUpperCase();
    if (t === 'PHOTOGRAPHER' || t === 'VIDEOGRAPHER') return 'photographer';
    if (t === 'EVENT_COORDINATOR') return 'event-coordinator';
    return 'client';
  }, [user?.customerType]);

  const tabs: Array<{ name: string; href: string; require: string | string[] }> = [
    { name: 'Users', href: '/user/team/users', require: 'users.view' },
    { name: 'Roles', href: '/user/team/roles', require: 'roles.view' },
    { name: 'Permissions', href: '/user/team/permissions', require: ['roles.view', 'users.view'] },
  ];
  const visibleTabs = tabs.filter(t =>
    Array.isArray(t.require) ? hasAny(t.require) : hasAny([t.require]));

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ck-surface-soft)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar userRole={topbarRole} />

        <main className="ck-page" style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px 24px', color: colors.textSecondary }}>
              Loading team…
            </div>
          ) : (
            <>
              <header style={{ margin: '8px 0 18px' }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
                }}>Team</div>
                <h1 style={{
                  margin: 0, fontSize: '1.85rem', fontWeight: 800,
                  letterSpacing: '-0.02em', color: colors.textPrimary,
                }}>Manage your team</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                  {organizationName ? <>Organization: <strong>{organizationName}</strong> · </> : null}
                  You're signed in as <strong>{roleName || (isOwner ? 'Owner' : '-')}</strong>.
                </p>

                <nav style={{ marginTop: 18, display: 'flex', gap: 4, borderBottom: `1px solid ${colors.borderPrimary}` }}>
                  {visibleTabs.map(t => {
                    const active = pathname === t.href;
                    return (
                      <Link
                        key={t.href}
                        href={t.href}
                        style={{
                          padding: '10px 14px',
                          fontSize: 13.5, fontWeight: 600,
                          color: active ? '#F20C8F' : colors.textSecondary,
                          borderBottom: active ? '2px solid #F20C8F' : '2px solid transparent',
                          textDecoration: 'none',
                          marginBottom: -1,
                          transition: 'color .15s, border-color .15s',
                        }}
                      >
                        {t.name}
                      </Link>
                    );
                  })}
                </nav>
              </header>

              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
