import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Dashboard middleware for route protection
 * - Checks for auth token in URL query param or cookies
 * - Redirects to home app login if no token found
 * - Allows access to auth pages without token
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check for token in URL query params (passed from home app)
  const urlToken = searchParams.get('token');

  // Check for token in cookies (set by the app after initial load)
  const cookieToken = request.cookies.get('authToken')?.value;

  // Check localStorage token via a custom header (set by client-side)
  // Note: localStorage isn't directly accessible in middleware, so we rely on URL token or cookies

  const hasToken = !!urlToken || !!cookieToken;

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
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
    const loginUrl = new URL(`${landingUrl}/user/auth/login`);

    // Add return URL so user can be redirected back after login
    loginUrl.searchParams.set('returnUrl', request.nextUrl.href);

    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control: prevent users from accessing other roles' pages
  const userRole = request.cookies.get('userRole')?.value?.toLowerCase();

  // Defensive guard: If we have a role but no token, clear the role cookie to force re-auth
  if (userRole && !hasToken && pathname.startsWith('/user/')) {
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
    const loginUrl = new URL(`${landingUrl}/user/auth/login`, request.url);
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
