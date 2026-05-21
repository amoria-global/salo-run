'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '../lib/usePermissions';
import { matchRouteRule } from '../lib/routePermissions';

/**
 * Central permission gate for dashboard routes.
 *
 * Drop this inside a layout (photographer / client / event-coordinator)
 * and every page rendered under it is automatically checked against the
 * ROUTE_RULES table in {@link app/lib/routePermissions}. Owners hold
 * every permission so they always pass; restricted team members are
 * bounced to /user/not-authorized when their role doesn't include the
 * permissions the current page requires.
 *
 * Loading semantics:
 *   • While the permission set is still being fetched, children are
 *     rendered as-is. We accept a tiny flash of restricted content
 *     rather than a flash of blank page for the 99% case of owners.
 *     Server-side @PreAuthorize is the actual authoritative check —
 *     this guard is UX-only.
 *
 * Safe-by-omission:
 *   • Paths not present in ROUTE_RULES render freely (default-allow).
 *   • Adding a new restricted page is a single push to routePermissions.
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, hasAny } = usePermissions();

  const rule = useMemo(() => matchRouteRule(pathname), [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!rule) return;
    if (hasAny(rule.any)) return;
    // Build a single-use return URL so the not-authorized page can
    // offer "go back" without losing the original intent.
    const returnTo = pathname || '/';
    router.replace(`/user/not-authorized?required=${encodeURIComponent(rule.any.join(','))}&from=${encodeURIComponent(returnTo)}`);
  }, [loading, rule, hasAny, pathname, router]);

  return <>{children}</>;
}
