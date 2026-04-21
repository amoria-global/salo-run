import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLandingUrl } from '@/lib/urls';

/**
 * Dashboard middleware for route protection
 * - Checks for auth token in URL query param or cookies
 * - Redirects to home app login if no token found
 * - Allows access to auth pages without token
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Auth sources, in priority order:
  //  1. `amoria_auth` — HttpOnly cookie set by backend on .connekyt.com scope;
  //     the primary mechanism going forward.
  //  2. `authToken` — legacy JS-visible cookie set by the dashboard itself,
  //     kept while the frontend still uses it.
  //  3. `?token=…` — legacy URL handoff from the landing app. Removed by the
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
    loginUrl.searchParams.set('returnUrl', request.nextUrl.href);

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
    loginUrl.searchParams.set('returnUrl', request.nextUrl.href);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('userRole');
    return response;
  }

  if (userRole && pathname.startsWith('/user/')) {
    // Extract the role segment from the URL: /user/{role}/...
    const pathRole = pathname.split('/')[2]; // 'client', 'photographer', 'event-coordinator'

    if (pathRole && pathRole !== userRole) {
      // User is trying to access a different role's pages — redirect to their correct dashboard
      const roleHomePaths: Record<string, string> = {
        'photographer': '/user/photographer/dashboard',
        'client': '/user/client/home',
        'event-coordinator': '/user/event-coordinator/home',
      };
      const correctPath = roleHomePaths[userRole] || '/user/client/home';
      return NextResponse.redirect(new URL(correctPath, request.url));
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
