'use client';

import RouteGuard from '@/app/components/RouteGuard';

/**
 * Event-coordinator-area layout. Wraps every /user/event-coordinator/**
 * route in {@link RouteGuard} so per-page permission rules from
 * {@link app/lib/routePermissions} are enforced uniformly.
 *
 * No completion-percentage gate here (unlike the photographer layout)
 * because coordinator profiles don't carry the same review gating.
 */
export default function EventCoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
