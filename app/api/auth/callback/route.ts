import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth callback route
 * Receives token from redirect header, sets it as a cookie, and redirects to dashboard
 */
export async function GET(request: NextRequest) {
  // Extract token from request header
  const token = request.headers.get('token');

  if (!token) {
    // No token in header - redirect to login
    const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL(`${landingUrl}/user/auth/login`));
  }

  // Create response that redirects to dashboard
  const dashboardUrl = new URL('/user/photographer/dashboard', request.url);
  const response = NextResponse.redirect(dashboardUrl);

  // Set auth token as cookie
  response.cookies.set('authToken', token, {
    httpOnly: false, // Allow client-side access for AuthProvider
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
