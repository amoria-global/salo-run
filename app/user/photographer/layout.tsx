'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboardAuth } from '@/app/providers/AuthProvider';

/**
 * Photographer-area layout. Wraps every /user/photographer/** route.
 *
 * Gate: a photographer whose profile is below 100% completion can't browse
 * other dashboard pages — they're punted back to /user/photographer/profile
 * the instant they land in the area (not just when they click a sidebar
 * link). The profile page itself is exempt from the redirect so it can
 * render the banner without looping. Once the photographer fills in the
 * missing sections, the server recomputes the percentage on each save and
 * the gate falls away naturally.
 *
 * Stale-session detail: legacy sessions cached the user object before the
 * backend started returning completionPercentage. If we see a photographer
 * without that field, we force one refreshUserProfile() to fetch fresh data
 * before deciding. Without this, every pre-deploy session would walk into
 * the dashboard once and never trigger the gate.
 */
const PROFILE_PATH = '/user/photographer/profile';

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, refreshUserProfile } = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Guard so we only force one refresh per session — otherwise a session
  // that legitimately can't get the field (network down, backend rolled
  // back) would loop into refresh forever.
  const refreshAttemptedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) return;

    const type = (user.customerType || '').toUpperCase();
    const isPhotographerLike = type === 'PHOTOGRAPHER' || type === 'VIDEOGRAPHER';
    if (!isPhotographerLike) return;

    const pct = typeof user.completionPercentage === 'number' ? user.completionPercentage : null;

    if (pct === null) {
      // Stale session — kick off one refresh attempt to populate the field.
      // The effect re-runs once the user object updates, and this branch
      // exits the second time around (pct will be a number, or we've
      // already tried and respected the guard).
      if (!refreshAttemptedRef.current) {
        refreshAttemptedRef.current = true;
        refreshUserProfile().catch(() => {
          // swallow — we'll let them through rather than block on a
          // network hiccup; the gate will catch up on the next route
          // change once the user object refreshes elsewhere.
        });
      }
      return;
    }

    if (pct >= 100) return;

    // Already on the profile page — let it render its banner.
    if (pathname && pathname.startsWith(PROFILE_PATH)) return;

    // The query flag tells the profile page this is a forced redirect (vs the
    // user navigating to /profile on their own). It uses it to surface a
    // one-shot toast and auto-jump to the first incomplete section.
    router.replace(`${PROFILE_PATH}?completionRequired=1`);
  }, [user, isAuthenticated, isLoading, pathname, router, refreshUserProfile]);

  return <>{children}</>;
}
