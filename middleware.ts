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
    '/auth',
    '/_next',
    '/api',
    '/favicon.ico',
    '/logo.png',
  ];

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

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
