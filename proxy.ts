import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLandingUrl } from '@/lib/urls';

/**
 * Dashboard middleware for route protection
 * - Checks for auth token in URL query param or cookies
 * - Redirects to home app login if no token found
 * - Allows access to auth pages without token
 */
// Build the externally-visible URL for the current request. `request.nextUrl.href`
// reflects the internal Node host (`http://localhost:8097`) when the dashboard
// runs behind nginx, which breaks login round-trips: the landing app would
// receive `returnUrl=http://localhost:8097/...` and the user's browser can't
// reach that. nginx is configured to forward `x-forwarded-host` and
// `x-forwarded-proto`; honor them so the returnUrl is reachable.
function publicOrigin(request: NextRequest): string | null {
  const fwdHost = request.headers.get('x-forwarded-host');
  const host = fwdHost || request.headers.get('host');
  if (!host) return null;
  // Force https for production hosts. Cloudflare → origin is plain HTTP
  // (and may forward x-forwarded-proto: http), which is correct for the
  // ORIGIN hop but wrong for the PUBLIC URL the browser must follow.
  // Anything on a `localhost`/local-IP host stays http for dev.
  const isLocal = /^(localhost|127\.|\[?::1\]?)/.test(host);
  const proto = isLocal ? 'http' : 'https';
  return `${proto}://${host}`;
}

function publicHref(request: NextRequest): string {
  const origin = publicOrigin(request);
  if (origin) return `${origin}${request.nextUrl.pathname}${request.nextUrl.search}`;
  return request.nextUrl.href;
}

function publicRedirect(request: NextRequest, path: string): URL {
  const origin = publicOrigin(request);
  return new URL(path, origin || request.url);
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip auth redirects on every non-navigation request (RSC prefetches, RSC
  // payload fetches on Link click, server actions, server-component fetches).
  // Cross-origin redirects on a `fetch()` are blocked by the browser and
  // surface as
  //    TypeError: Failed to fetch RSC payload for …. Falling back to browser navigation
  // even though the actual navigation that follows works fine.
  //
  // `Sec-Fetch-Dest` is set by every modern browser:
  //   document            → top-level navigation (real click / URL bar / hard reload)
  //   empty / iframe / …  → fetch(), RSC prefetch, RSC click-fetch, etc.
  // Only the document case should be redirected. Everything else gets the
  // page rendered (or, for RSC, the same payload that the SSR navigation
  // would have produced) and lets AuthProvider on the client redirect if it
  // detects no session.
  //
  // Header names are case-insensitive per RFC 9110 so `headers.get` matches
  // any casing Next or the browser uses.
  const fetchDest = request.headers.get('sec-fetch-dest');
  const isBackgroundFetch =
    fetchDest !== null && fetchDest !== 'document';
  if (isBackgroundFetch && pathname.startsWith('/user')) {
    return NextResponse.next();
  }

  // Auth sources, in priority order:
  //  1. `amoria_auth`: HttpOnly cookie set by backend on .connekyt.com scope;
  //     the primary mechanism going forward.
  //  2. `authToken`: legacy JS-visible cookie set by the dashboard itself,
  //     kept while the frontend still uses it.
  //  3. `?token=…`: legacy URL handoff from the landing app. Removed by the
  //     landing security/remove-url-token-handoff change, but still accepted
  //     here so older open tabs don't break.
  const amoriaAuthCookie = request.cookies.get('amoria_auth')?.value;
  const cookieToken = request.cookies.get('authToken')?.value;
  const urlToken = searchParams.get('token');

  const hasToken = !!amoriaAuthCookie || !!cookieToken || !!urlToken;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/', // Home/role selection page
    '/auth',
    '/api/auth/callback', // Auth callback for receiving token from redirect
    '/_next',
    '/api',
    '/favicon.ico',
    '/logo.png',
  ];

  // Check if the current path is public (exact match for '/', prefix match for others)
  const isPublicPath = publicPaths.some(path =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );

  // Also check for static files
  const isStaticFile = pathname.includes('.') && !pathname.endsWith('.html');

  // Allow access to public paths and static files
  if (isPublicPath || isStaticFile) {
    return NextResponse.next();
  }

  // If token is in URL, allow access (AuthProvider will validate and store it)
  if (urlToken) {
    return NextResponse.next();
  }

  // If no token at all on protected routes, redirect to home app login
  if (!hasToken && pathname.startsWith('/user')) {
    const landingBase = getLandingUrl();
    const loginUrl = landingBase
      ? new URL(`${landingBase}/user/auth/login`)
      : new URL('/user/auth/login', request.url);

    // Add return URL so user can be redirected back after login
    loginUrl.searchParams.set('returnUrl', publicHref(request));

    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control: prevent users from accessing other roles' pages
  // Normalize: backend sends Coordinator/event_coordinator/EVENT_COORDINATOR → canonical 'event-coordinator'
  const rawRole = (request.cookies.get('userRole')?.value || '').toLowerCase().replace(/_/g, '-');
  const userRole = rawRole === 'coordinator' ? 'event-coordinator' : rawRole || undefined;

  // Defensive guard: If we have a role but no token, clear the role cookie to force re-auth
  if (userRole && !hasToken && pathname.startsWith('/user/')) {
    const landingBase2 = getLandingUrl();
    const loginUrl = landingBase2
      ? new URL(`${landingBase2}/user/auth/login`)
      : new URL('/user/auth/login', request.url);
    loginUrl.searchParams.set('returnUrl', publicHref(request));

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('userRole');
    return response;
  }

  if (userRole && pathname.startsWith('/user/')) {
    // Extract the role segment from the URL: /user/{role}/...
    const pathRole = pathname.split('/')[2]; // 'client', 'photographer', 'event-coordinator'

    if (pathRole && pathRole !== userRole) {
      // User is trying to access a different role's pages, so redirect to their correct dashboard
      const roleHomePaths: Record<string, string> = {
        'photographer': '/user/photographer/dashboard',
        'client': '/user/client/home',
        'event-coordinator': '/user/event-coordinator/home',
      };
      const correctPath = roleHomePaths[userRole];
      // If userRole is something unrecognized (e.g. a legacy/typo cookie),
      // sending them to /user/client/home creates a redirect loop because
      // pathRole=='client' still won't match userRole. Bail to landing
      // login and let the user re-auth cleanly.
      if (!correctPath) {
        const landingBase = getLandingUrl();
        const loginUrl = landingBase
          ? new URL(`${landingBase}/user/auth/login`)
          : publicRedirect(request, '/user/auth/login');
        loginUrl.searchParams.set('returnUrl', publicHref(request));
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('userRole');
        return response;
      }
      return NextResponse.redirect(publicRedirect(request, correctPath));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
