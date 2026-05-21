'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/lib/usePermissions';

/**
 * Layout shared by /user/team/* pages.
 *
 * Renders a tab strip that respects whichever of the three sections
 * the caller has permission to see (Users requires users.view, Roles
 * requires roles.view, Permissions is visible to anyone with either).
 * PermissionProvider lives at the root layout so usePermissions() is
 * already populated by the time this renders.
 *
 * Hard gate: if the caller has none of the team perms we punt them back
 * to their role's dashboard. Owners always pass (implicit all-perms in
 * CustomerUserDetails).
 */
export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <TeamShell>{children}</TeamShell>;
}

function TeamShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useDashboardAuth();
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

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', color: 'rgba(0,0,0,0.55)' }}>
        Loading team…
      </div>
    );
  }

  const tabs: Array<{ name: string; href: string; require: string | string[] }> = [
    { name: 'Users', href: '/user/team/users', require: 'users.view' },
    { name: 'Roles', href: '/user/team/roles', require: 'roles.view' },
    { name: 'Permissions', href: '/user/team/permissions', require: ['roles.view', 'users.view'] },
  ];
  const visibleTabs = tabs.filter(t =>
    Array.isArray(t.require) ? hasAny(t.require) : hasAny([t.require]));

  return (
    <div style={{ minHeight: '100%', background: 'var(--ck-surface, #fff)' }}>
      <header style={{
        padding: '24px 24px 0',
        borderBottom: '1px solid var(--ck-border, #e5e7eb)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--ck-text, #111)' }}>
              Team
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--ck-text-muted, #6b7280)', margin: '6px 0 0' }}>
              {organizationName ? <>Organization: <strong>{organizationName}</strong> · </> : null}
              You're signed in as <strong>{roleName || (isOwner ? 'Owner' : '—')}</strong>.
            </p>
          </div>
        </div>
        <nav style={{ marginTop: 18, display: 'flex', gap: 4 }}>
          {visibleTabs.map(t => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5, fontWeight: 600,
                  color: active ? '#F20C8F' : 'var(--ck-text-muted, #6b7280)',
                  borderBottom: active ? '2px solid #F20C8F' : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'color .15s, border-color .15s',
                }}
              >
                {t.name}
              </Link>
            );
          })}
        </nav>
      </header>
      <main style={{ padding: '24px' }}>{children}</main>
    </div>
  );
}
