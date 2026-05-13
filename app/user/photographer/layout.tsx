'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboardAuth } from '@/app/providers/AuthProvider';

/**
 * Photographer-area layout. Wraps every /user/photographer/** route.
 *
 * Gate: a photographer whose profile is below 100% completion can't browse
 * other dashboard pages — they're punted back to /user/photographer/profile,
 * which is where the missing-fields banner + edit UI lives. The profile page
 * itself is exempt from the redirect so it can render the banner without
 * looping. Once the photographer fills in the missing sections (server
 * recomputes the percentage on each save), the gate falls away naturally.
 */
const PROFILE_PATH = '/user/photographer/profile';

export default function PhotographerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useDashboardAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) return;

    const type = (user.customerType || '').toUpperCase();
    const isPhotographerLike = type === 'PHOTOGRAPHER' || type === 'VIDEOGRAPHER';
    if (!isPhotographerLike) return;

    // Treat a missing percentage as "we don't know yet" — let it through
    // instead of bouncing them. The next profile fetch will populate it.
    const pct = typeof user.completionPercentage === 'number' ? user.completionPercentage : null;
    if (pct === null) return;
    if (pct >= 100) return;

    // Already on the profile page — let it render its banner.
    if (pathname && pathname.startsWith(PROFILE_PATH)) return;

    // The query flag tells the profile page this is a forced redirect (vs the
    // user navigating to /profile on their own). It uses it to surface a
    // one-shot toast and auto-jump to the first incomplete section.
    router.replace(`${PROFILE_PATH}?completionRequired=1`);
  }, [user, isAuthenticated, isLoading, pathname, router]);

  return <>{children}</>;
}
