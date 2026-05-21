/**
 * Centralised route → permission map.
 *
 * Single source of truth that {@link RouteGuard} consults to decide
 * whether the current caller can view a page. Owners hold every
 * permission (PermissionRegistry on the backend) so they always pass;
 * invited team members pass only if their role's permissions intersect
 * the rule for their current path.
 *
 * Rule shape:
 *   { pattern: '/user/photographer/wallet', any: ['payments.view'] }
 * The pattern is a literal prefix match against the URL pathname so
 * sub-routes inherit the parent's gate automatically (the photographer
 * /events/[id] detail page inherits /events' events.view requirement).
 *
 * Default-allow: paths not matched by ANY rule render freely. We curated
 * the rule set to lock down meaningful surfaces (work, money, team
 * management) while leaving safe utility pages (profile, preferences,
 * notifications, donate) open. Adding a new restricted route is a
 * single push to this file — no per-page wrapping required.
 *
 * Update protocol when adding a new restricted page:
 *   1. Add a route entry here pointing at the page's URL prefix.
 *   2. Choose the loosest reasonable permission (favour `*.view` for
 *      browsing surfaces, `*.manage` for action surfaces).
 *   3. RouteGuard picks it up on the next render; no other change.
 */

export interface RouteRule {
  /** URL pathname prefix this rule applies to. Longest prefix wins. */
  pattern: string;
  /** Pass iff the caller has AT LEAST ONE of these permission names. */
  any: string[];
}

export const ROUTE_RULES: RouteRule[] = [
  // ─── Photographer ───────────────────────────────────────────────
  { pattern: '/user/photographer/events',          any: ['events.view'] },
  { pattern: '/user/photographer/clients',         any: ['bookings.view'] },
  { pattern: '/user/photographer/inbox',           any: ['messages.view'] },
  { pattern: '/user/photographer/wallet',          any: ['payments.view'] },
  { pattern: '/user/photographer/transaction',     any: ['payments.view'] },
  { pattern: '/user/photographer/all-transactions',any: ['payments.view'] },
  { pattern: '/user/photographer/payroll-report',  any: ['payments.manage'] },

  // ─── Client ─────────────────────────────────────────────────────
  { pattern: '/user/client/events',                any: ['events.view'] },
  { pattern: '/user/client/inbox',                 any: ['messages.view'] },
  { pattern: '/user/client/photographers',         any: ['bookings.view'] },
  { pattern: '/user/client/payments',              any: ['payments.view'] },
  { pattern: '/user/client/wallet',                any: ['payments.view'] },

  // ─── Event coordinator ──────────────────────────────────────────
  { pattern: '/user/event-coordinator/events',         any: ['events.view'] },
  { pattern: '/user/event-coordinator/inbox',          any: ['messages.view'] },
  { pattern: '/user/event-coordinator/photographers',  any: ['bookings.view'] },
  { pattern: '/user/event-coordinator/payments',       any: ['payments.view'] },
  { pattern: '/user/event-coordinator/wallet',         any: ['payments.view'] },

  // ─── Team (self-gated by /user/team/layout.tsx, listed here for completeness) ─
  { pattern: '/user/team/users',       any: ['users.view'] },
  { pattern: '/user/team/roles',       any: ['roles.view'] },
  { pattern: '/user/team/permissions', any: ['users.view', 'roles.view'] },
];

/**
 * Find the most-specific rule for a pathname, or null if no rule
 * matches (default-allow). "Most specific" = longest prefix.
 */
export function matchRouteRule(pathname: string | null | undefined): RouteRule | null {
  if (!pathname) return null;
  let best: RouteRule | null = null;
  for (const r of ROUTE_RULES) {
    if (pathname === r.pattern || pathname.startsWith(r.pattern + '/') || pathname.startsWith(r.pattern + '?')) {
      if (!best || r.pattern.length > best.pattern.length) best = r;
    }
  }
  return best;
}
