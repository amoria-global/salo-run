import { NextRequest, NextResponse } from 'next/server';
import { getLandingUrl } from '@/lib/urls';

/**
 * Auth callback route
 * Receives token from redirect header, sets it as a cookie, and redirects to dashboard
 */
export async function GET(request: NextRequest) {
  // Extract tokens from request headers
  const token = request.headers.get('token');
  const refreshToken = request.headers.get('refreshToken');

  if (!token) {
    // No token in header - redirect to login
    return NextResponse.redirect(new URL(`${getLandingUrl()}/user/auth/login`));
  }

  // Route to the correct dashboard based on user type
  // Normalize: backend sends "Coordinator", "event_coordinator", "event-coordinator" etc.
  const raw = (request.nextUrl.searchParams.get('type') || '').toLowerCase();
  const customerType = (raw === 'coordinator' || raw === 'event_coordinator')
    ? 'event-coordinator'
    : raw;
  let route = '/'; // default to role selection
  if (customerType === 'photographer') route = '/user/photographer/dashboard';
  else if (customerType === 'client') route = '/user/client/home';
  else if (customerType === 'event-coordinator') route = '/user/event-coordinator/home';
  const dashboardUrl = new URL(route, request.url);
  const response = NextResponse.redirect(dashboardUrl);

  // Set auth token as cookie
  response.cookies.set('authToken', token, {
    httpOnly: false, // Allow client-side access for AuthProvider
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  // Set refresh token as cookie if provided
  if (refreshToken) {
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }

  return response;
}
