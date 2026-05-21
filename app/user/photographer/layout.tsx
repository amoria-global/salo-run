'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboardAuth } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/lib/usePermissions';
import RouteGuard from '@/app/components/RouteGuard';

/**
 * Photographer-area layout. Wraps every /user/photographer/** route.
 *
 * Gate: a photographer whose profile is below 100% completion can't browse
 * other dashboard pages — they're punted back to /user/photographer/profile
 * the instant the layout knows their completion percentage. The profile
 * page itself is exempt so the redirect doesn't loop. Once the photographer
 * fills in the missing sections, the server recomputes the percentage on
 * each save and the gate falls away naturally.
 *
 * Stale-session note: legacy clients cached their user object before the
 * backend started returning completionPercentage. When the layout sees an
 * undefined value, it lets the user through — AuthProvider's initAuth
 * already re-fetches the profile on every page load, so the field will
 * arrive on the next nav at the latest, and the periodic 4h refresh covers
 * long-lived tabs. We intentionally do NOT trigger our own refresh here:
 * doing so previously stacked with AuthProvider's own fetch and could
 * deadlock the dashboard's Loading state.
 */
const PROFILE_PATH = '/user/photographer/profile';

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useDashboardAuth();
  const { isOwner, loading: permsLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) return;

    const type = (user.customerType || '').toUpperCase();
    const isPhotographerLike = type === 'PHOTOGRAPHER' || type === 'VIDEOGRAPHER';
    if (!isPhotographerLike) return;

    // ── Team-member exemption (RBAC) ──
    // The profile-completion gate only applies to the organization owner.
    // An invited team member inherits the owner's customerType so the
    // dashboard role-routing keeps working, but they don't have their own
    // profile to complete — bouncing them to /profile would lock them out
    // of the dashboard forever with no way to finish setup. The flag comes
    // straight off the user object (PhotographerResponseDTO.isTeamMember)
    // so no async /me/permissions fetch is needed for this gate to fire
    // correctly on the very first render.
    if (user.isTeamMember === true) return;
    // Belt-and-braces: usePermissions().isOwner is still correct once
    // perms have loaded; keep the check as a backup for any edge case
    // where the profile endpoint hasn't yet shipped isTeamMember.
    if (permsLoading) return;
    if (!isOwner) return;

    // Missing field means stale session — let it through. AuthProvider's
    // own fetch will populate it shortly.
    const pct = typeof user.completionPercentage === 'number' ? user.completionPercentage : null;
    if (pct === null) return;
    if (pct >= 100) return;

    // Already on the profile page — let it render its banner.
    if (pathname && pathname.startsWith(PROFILE_PATH)) return;

    // The query flag tells the profile page this is a forced redirect (vs the
    // user navigating to /profile on their own). It uses it to surface a
    // one-shot toast and auto-jump to the first incomplete section.
    router.replace(`${PROFILE_PATH}?completionRequired=1`);
  }, [user, isAuthenticated, isLoading, pathname, router, isOwner, permsLoading]);

  // RouteGuard consults ROUTE_RULES in app/lib/routePermissions and
  // bounces restricted team members to /user/not-authorized when the
  // current pathname requires permissions they don't hold. Owners
  // pass every gate; this is pure UX (server still enforces).
  return <RouteGuard>{children}</RouteGuard>;
}
