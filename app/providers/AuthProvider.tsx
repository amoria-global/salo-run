'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';

/**
 * Availability time structure from API
 */
export interface AvailabilityTime {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

/**
 * Availability day structure from API
 */
export interface UserAvailability {
  id?: string;
  dayOfWeek: string;
  startTime: AvailabilityTime;
  endTime: AvailabilityTime;
}

/**
 * Skill structure from API
 * Supports both skillPercentage (old format) and proficiencyLevel (new format)
 */
export interface UserSkill {
  id?: string;
  name: string;
  skillPercentage?: number;    // Old API format
  proficiencyLevel?: number;   // New API format (profile-summary)
}

/**
 * Equipment structure from API
 */
export interface UserEquipment {
  id?: string;
  name: string;
}

/**
 * Education level structure from API
 */
export interface UserEducation {
  id?: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
}

/**
 * Certification/Training structure from API
 */
export interface UserCertification {
  id?: string;
  title: string;
  institution: string;
  yearObtained: string;
  description: string;
  type: 'TRAINING' | 'CERTIFICATION';
}

/**
 * Project structure from API
 */
export interface UserProject {
  id?: string;
  title: string;
  description: string;
  year: number;
  projectImage?: string;
}

/**
 * Work Experience structure from API
 */
export interface UserWorkExperience {
  id?: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

/**
 * User data stored in dashboard auth context
 */
export interface DashboardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerId: string;
  customerType: string;
  profilePicture?: string;
  coverPicture?: string;
  address?: string;
  about?: string;
  professionalPhilosophy?: string;
  specialties?: string[];
  rating?: number;
  availabilities?: UserAvailability[];
  projects?: UserProject[];
  professionalSkills?: UserSkill[];
  equipments?: UserEquipment[];
  educationLevels?: UserEducation[];
  certifications?: UserCertification[];
  trainings?: UserCertification[];
  workExperiences?: UserWorkExperience[];
  // New fields from profile-summary endpoint
  joinedFrom?: string;
  reviews?: {
    id: string;
    reviewer: { id: string; firstName: string; lastName: string; profilePicture?: string; customerType?: string };
    rating: number;
    review: string;
    images?: string[];
    createdAt?: string;
  }[];
  completedEvents?: number;
  pendingChangesCount?: number;
  packages?: unknown[];
  profileReviewStatus?: string;
  reviewComment?: string;
  kycStatus?: string;
  preferredWithdrawalVerification?: string;
  twoFactorEnabled?: boolean;
  /**
   * Server-computed profile completion percentage (0-100). Authoritative —
   * the photographer dashboard layout gates navigation on this, so don't
   * shadow it with a client-side recomputation.
   */
  completionPercentage?: number;
}

/**
 * Dashboard Auth context type definition
 */
interface AuthContextType {
  user: DashboardUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<DashboardUser>) => void;
  refreshUserProfile: () => Promise<boolean>;
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const REFRESH_TOKEN_KEY = 'refreshToken';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth tokens are no longer stored in JS-accessible storage.
 *
 * Historically the JWT was written to localStorage and a non-HttpOnly cookie
 * so dashboardAuthFetch could attach it as a Bearer header. That made it
 * stealable via any XSS that executed on any dashboard page.
 *
 * We now rely on the `amoria_auth` HttpOnly cookie (scoped to .connekyt.com)
 * that the backend sets on login. The browser sends it automatically on
 * cross-origin fetches as long as `credentials: 'include'` is set — which
 * dashboardAuthFetch now does. JS never reads or writes the JWT.
 *
 * These writer functions are kept as explicit no-ops to preserve call-sites
 * across the provider. Any future attempt to persist a token will hit these
 * and do nothing instead of silently reintroducing the exposure.
 */
function saveTokenToStorage(_token: string): void {
  // Intentionally a no-op. See docblock above.
}

function saveRefreshTokenToStorage(_refreshToken: string): void {
  // Intentionally a no-op. See docblock above.
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Try localStorage first, then cookie
  const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (stored) return stored;
  const match = document.cookie.match(/(?:^|;\s*)refreshToken=([^;]*)/);
  return match ? match[1] : null;
}

/**
 * Atomically clear auth from all storage locations
 */
function clearAuthFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  } catch (error) {
    console.error('[Dashboard Auth] Failed to clear auth storage:', error);
  }
}

/**
 * Get token from cookie
 */
function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('authToken='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  return null;
}

/**
 * No-op: we no longer write the JWT to a JS-visible cookie. See docblock on
 * saveTokenToStorage above. Kept as a function so existing call sites compile.
 */
function setTokenCookie(_token: string): void {
  // Intentionally a no-op.
}

/**
 * One-shot migration: clear any legacy JWTs lingering in localStorage or the
 * old authToken cookie from before cookie-only auth shipped. Runs once per
 * page load on the client; is cheap and idempotent after that.
 */
function clearLegacyJwtStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  } catch {
    // Storage can be blocked in some privacy modes — ignore.
  }
}

/**
 * Map professional skills to support both API formats (skillPercentage and proficiencyLevel)
 */
function mapProfessionalSkills(skills: Array<{
  id?: string;
  name: string;
  proficiencyLevel?: number;
  skillPercentage?: number;
}>): UserSkill[] {
  return skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    skillPercentage: skill.skillPercentage ?? skill.proficiencyLevel ?? 0,
    proficiencyLevel: skill.proficiencyLevel ?? skill.skillPercentage ?? 0,
  }));
}

/**
 * Token refresh mutex — prevents multiple simultaneous refresh attempts
 */
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the auth token using the refresh endpoint.
 * Uses a mutex so concurrent 401s only trigger one refresh call.
 * Returns the new token on success, or null on failure.
 */
async function attemptDashboardTokenRefresh(currentToken: string | null): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        console.warn('[Dashboard Auth] No refresh token available');
        return null;
      }

      const response = await fetch(
        `${getApiUrl()}/api/remote/auth/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          saveTokenToStorage(data.token);
          // Save new refresh token if provided
          if (data.refreshToken) {
            saveRefreshTokenToStorage(data.refreshToken);
          }
          console.log('[Dashboard Auth] Token refreshed successfully');
          return data.token;
        }
      }
      return null;
    } catch (error) {
      console.error('[Dashboard Auth] Token refresh failed:', error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Map API profile data to DashboardUser format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfileData(data: any): DashboardUser {
  return {
    id: data.id || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    customerId: data.id || '',
    customerType: data.customerType || '',
    profilePicture: normalizeImageUrl(data.profilePicture),
    coverPicture: normalizeImageUrl(data.coverPicture),
    address: data.address || undefined,
    about: data.about || undefined,
    professionalPhilosophy: data.professionalPhilosophy || undefined,
    specialties: data.specialties || [],
    rating: data.rating || 0,
    availabilities: data.availabilities || [],
    projects: data.projects || [],
    professionalSkills: mapProfessionalSkills(data.professionalSkills || []),
    equipments: data.equipments || [],
    educationLevels: data.educationLevels || [],
    certifications: data.certifications || [],
    trainings: data.trainings || [],
    workExperiences: data.workExperiences || [],
    joinedFrom: data.joinedFrom || undefined,
    reviews: data.reviews || [],
    completedEvents: data.completedEvents || 0,
    pendingChangesCount: data.pendingChangesCount || 0,
    packages: data.packages || [],
    profileReviewStatus: data.profileReviewStatus || undefined,
    reviewComment: data.reviewComment || undefined,
    kycStatus: data.kycStatus || undefined,
    preferredWithdrawalVerification: data.preferredWithdrawalVerification || 'EMAIL_OTP',
    twoFactorEnabled: data.twoFactorEnabled === true,
    completionPercentage: typeof data.completionPercentage === 'number' ? data.completionPercentage : undefined,
  };
}

/**
 * Try fetching a single profile endpoint. Returns the parsed user on success, or null.
 * Does NOT handle 401 — caller is responsible for token refresh logic.
 */
async function tryFetchProfile(
  endpoint: string,
  token: string | null,
  roleName: string
): Promise<{ user: DashboardUser | null; status: number }> {
  try {
    const url = `${getApiUrl()}${endpoint}`;
    const headers: Record<string, string> = {};
    // Bearer is only attached if the caller happens to have a token (legacy
    // in-memory value). The amoria_auth HttpOnly cookie — sent because of
    // credentials: 'include' — is the primary auth signal.
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn(`[Dashboard Auth] ${roleName} profile returned ${response.status}`);
      return { user: null, status: response.status };
    }

    const result = await response.json();
    if (result.action === 1 && result.data) {
      const userData = mapProfileData(result.data);
      // Ensure customerType is set — infer from endpoint if API didn't return it
      if (!userData.customerType) {
        if (roleName === 'photographer') userData.customerType = 'PHOTOGRAPHER';
        else if (roleName === 'coordinator') userData.customerType = 'EVENT_COORDINATOR';
        else if (roleName === 'customer') userData.customerType = 'CLIENT';
      }
      return { user: userData, status: response.status };
    }
    return { user: null, status: response.status };
  } catch (err) {
    console.warn(`[Dashboard Auth] ${roleName} profile network error:`, err);
    return { user: null, status: 0 };
  }
}

/**
 * Profile endpoints to try, in order.
 * Each role has a different profile endpoint on the backend.
 */
const PROFILE_ENDPOINTS = [
  { endpoint: '/api/remote/photographer/profile-summary', role: 'photographer' },
  { endpoint: '/api/remote/coordinator/profile', role: 'coordinator' },
  { endpoint: '/api/remote/customer/profile', role: 'customer' },
];

/**
 * Fetch user profile using Bearer token.
 * Tries photographer, coordinator, and customer endpoints in order.
 * On 401, attempts token refresh and retries all endpoints.
 */
async function fetchUserProfile(token: string | null): Promise<{ user: DashboardUser | null; reason: 'success' | 'unauthorized' | 'server_error' | 'network_error' }> {
  try {
    // Try each role endpoint until one succeeds
    let got401 = false;
    let gotServerError = false;
    for (const { endpoint, role } of PROFILE_ENDPOINTS) {
      const { user, status } = await tryFetchProfile(endpoint, token, role);
      if (user) return { user, reason: 'success' };
      if (status === 401) { got401 = true; break; }
      if (status >= 500) { gotServerError = true; }
      // 403/404 means wrong role — try next endpoint
    }

    // If any endpoint returned 401, attempt token refresh and retry all
    if (got401) {
      const newToken = await attemptDashboardTokenRefresh(token);
      if (newToken) {
        for (const { endpoint, role } of PROFILE_ENDPOINTS) {
          const { user } = await tryFetchProfile(endpoint, newToken, role);
          if (user) return { user, reason: 'success' };
        }
      }
      // Token refresh failed — redirect photographer to login to prevent stale data
      if (typeof window !== 'undefined') {
        const isPhotographer = window.location.pathname.includes('/photographer') ||
          document.cookie.includes('userRole=photographer');
        if (isPhotographer) {
          clearAuthFromStorage();
          const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL as string;
          window.location.href = `${landingUrl}/user/auth/login?session_expired=true`;
        }
      }
      return { user: null, reason: 'unauthorized' };
    }

    // All endpoints failed with non-401 errors
    console.error(`[Dashboard Auth] All profile endpoints failed (server errors: ${gotServerError}). API URL: ${getApiUrl()}. Is the backend running?`);
    return { user: null, reason: gotServerError ? 'server_error' : 'network_error' };
  } catch (error) {
    console.error('[Dashboard Auth] Error fetching user profile:', error);
    return { user: null, reason: 'network_error' };
  }
}

/**
 * Inner component that uses searchParams
 */
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize auth using the amoria_auth HttpOnly cookie the backend set on
  // the landing app's login. JS can't read that cookie, but the browser sends
  // it automatically on every fetch to backend.connekyt.com (credentials:
  // 'include' is set inside fetchUserProfile). So the only state we need
  // here is "call the backend; if profile comes back, the user is
  // authenticated".
  useEffect(() => {
    const initAuth = async () => {
      // One-shot migration: wipe any legacy JWT from localStorage/authToken
      // cookie. The HttpOnly amoria_auth cookie is the only JWT on the
      // client going forward. Runs before any other auth work so an XSS that
      // fires during initAuth can't grab a stale token.
      clearLegacyJwtStorage();

      // Legacy handoff: landing used to redirect with ?token=… in the URL.
      // The landing app no longer emits that, but strip it on the way in so
      // the JWT doesn't linger in browser history on any open tab from
      // before the migration.
      const urlToken = searchParams.get('token');
      if (urlToken && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('refreshToken');
        url.searchParams.delete('email');
        window.history.replaceState({}, '', url.pathname + url.search);
      }

      // Read any cached user profile so the UI has something to render
      // instantly while the authoritative fetch is in flight. The cache is
      // profile data only (name, role, etc.) — it does NOT contain a JWT.
      const storedUserStr = typeof window !== 'undefined'
          ? localStorage.getItem(AUTH_USER_KEY) : null;

      // Always attempt the profile fetch — no Bearer token needed; the cookie
      // carries auth. If it succeeds, we're authenticated. If it 401s, we're
      // not, and we'll show the logged-out UI (middleware will redirect to
      // the landing login on any /user/* navigation).
      //
      // Hard 15s ceiling. fetchUserProfile already catches errors and times
      // out the upstream fetch in the proxy at 30s, but in local dev the
      // proxy itself can stall (e.g. DNS hiccup to backend.connekyt.com from
      // the Next.js Node process, or a fresh Turbopack worker still warming
      // up) and that bubbles up as a Promise that never settles. Without a
      // ceiling the Suspense fallback sits at "Loading..." forever; with
      // one, we fall back to the cached user (if any) and let the page
      // render so the user can at least retry.
      const PROFILE_INIT_TIMEOUT_MS = 15_000;
      let timedOut = false;
      const timeoutPromise = new Promise<{ user: null; reason: 'network_error' }>((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve({ user: null, reason: 'network_error' });
        }, PROFILE_INIT_TIMEOUT_MS);
      });
      const { user: userProfile, reason } = await Promise.race([
        fetchUserProfile(null),
        timeoutPromise,
      ]);
      if (timedOut) {
        console.warn(`[Dashboard Auth] Profile fetch did not settle within ${PROFILE_INIT_TIMEOUT_MS}ms — falling back to cached state. Check the network tab for the in-flight request to ${getApiUrl()}/api/remote/<role>/profile-summary.`);
      }

      if (userProfile) {
        setUser(userProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
          if (userProfile.customerType) {
            document.cookie = `userRole=${userProfile.customerType.toLowerCase()}; path=/; max-age=${60*60*24}; samesite=lax`;
          }
        }
      } else if (reason === 'server_error' || reason === 'network_error') {
        // Backend is down (or the fetch hit the local-dev timeout above) —
        // fall back to cached profile so the UI renders. The user is still
        // "authenticated" per the cookie; we just can't talk to the backend
        // right now. Real 401s clear state below.
        if (storedUserStr) {
          try { setUser(JSON.parse(storedUserStr)); } catch { /* ignore */ }
        }
      } else {
        // reason === 'unauthorized': cookie is missing/expired.
        // Leave user null; fetchUserProfile already redirected photographers.
      }

      setIsLoading(false);
    };

    initAuth();
  }, [searchParams]);

  // Proactively re-fetch the profile every 4 hours. The backend's
  // /profile-summary call triggers JwtAuthFilter, which handles silent
  // refresh server-side if the token is near expiry — so the cookie value
  // stays fresh without us doing anything client-side. This interval also
  // surfaces the user as logged out the moment the session becomes invalid
  // (e.g. the refresh token is revoked), without waiting for them to click
  // something that hits the backend.
  useEffect(() => {
    if (!user) return;

    const INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

    const intervalId = setInterval(async () => {
      const { user: userProfile, reason } = await fetchUserProfile(null);
      if (userProfile) {
        setUser(userProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
          if (userProfile.customerType) {
            document.cookie = `userRole=${userProfile.customerType.toLowerCase()}; path=/; max-age=${60*60*24}; samesite=lax`;
          }
        }
      } else if (reason === 'unauthorized') {
        console.warn('[Dashboard Auth] Session invalidated — redirecting to login');
        clearAuthFromStorage();
        setUser(null);
        const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL as string;
        window.location.href = `${landingUrl}/user/auth/login?session_expired=true`;
      }
      // server_error / network_error: keep current user state, try again next tick.
    }, INTERVAL);

    return () => clearInterval(intervalId);
  }, [user]);

  // Cross-tab sync: when another tab clears the cached user profile (logout
  // in a different tab), reflect that here. We no longer listen for
  // AUTH_TOKEN_KEY changes because the JWT no longer lives in localStorage.
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== AUTH_USER_KEY) return;
      if (event.newValue) {
        try { setUser(JSON.parse(event.newValue)); } catch { setUser(null); }
      } else {
        setUser(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // 2FA enforcement: if user has balance > 0 and no 2FA, redirect to preferences setup
  useEffect(() => {
    if (!token || !user || isLoading) return;
    // Skip if already on the preferences page (avoid redirect loop)
    if (typeof window !== 'undefined' && window.location.search.includes('setup2fa=true')) return;

    // Only check if 2FA is not already enabled
    if (user.twoFactorEnabled) return;

    const checkTotpRequirement = async () => {
      try {
        const apiUrl = getApiUrl();
        // Use credentials: 'include' so the HttpOnly amoria_auth cookie
        // authenticates cookie-only sessions (empty local Bearer token).
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${apiUrl}/api/remote/customer/totp/status`, {
          headers,
          credentials: 'include',
        });
        if (!response.ok) return;
        const result = await response.json();
        if (result.action === 1 && result.twoFactorRequired && !result.twoFactorEnabled) {
          // Redirect to preferences security tab with setup2fa flag
          if (typeof window !== 'undefined') {
            const role = user.customerType?.toLowerCase() === 'event_coordinator'
              ? 'event-coordinator'
              : user.customerType?.toLowerCase() || 'photographer';
            window.location.href = `/user/${role}/preferences?tab=security&setup2fa=true`;
          }
        }
      } catch {
        // Silently fail — don't block the user if the check fails
      }
    };

    checkTotpRequirement();
  }, [token, user, isLoading]);

  // Inactivity timeout for client & coordinator roles (1 hour)
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!token || !user) return;

    const role = user.customerType?.toUpperCase();
    // Only apply to client and coordinator — photographers keep sessions indefinitely
    if (role === 'PHOTOGRAPHER') return;

    const cfg = getPlatformConfig().security;
    const INACTIVITY_LIMIT = cfg.sessionTimeoutMs;
    const CHECK_INTERVAL = cfg.sessionCheckIntervalMs;

    const resetTimer = () => { lastActivityRef.current = Date.now(); };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_LIMIT) {
        clearInterval(intervalId);
        events.forEach(e => window.removeEventListener(e, resetTimer));
        // Redirect to login with session_expired flag
        clearAuthFromStorage();
        setUser(null);
        setToken(null);
        const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL as string;
        window.location.href = `${landingUrl}/user/auth/login?session_expired=true`;
      }
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [token, user]);

  /**
   * Refresh the auth token
   */
  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) return false;

    try {
      const response = await fetch(
        `${getApiUrl()}/api/remote/auth/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          saveTokenToStorage(data.token);
          if (data.refreshToken) {
            saveRefreshTokenToStorage(data.refreshToken);
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[Dashboard Auth] Token refresh failed:', error);
      return false;
    }
  }, []);

  /**
   * Logout - clear all auth data
   */
  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    // Tell the backend to revoke the refresh token AND clear the amoria_auth
    // HttpOnly cookie (via Set-Cookie Max-Age=0 with Domain=.connekyt.com).
    // That cookie is HttpOnly so JS can't delete it — only the backend can.
    // Without this round-trip, the landing app would still see the user as
    // authenticated because the .connekyt.com cookie would survive the
    // redirect, breaking cross-app logout sync.
    try {
      const currentToken = (typeof window !== 'undefined'
          ? localStorage.getItem('authToken') : null) || getCookieToken();
      const refreshTokenValue = getRefreshToken();
      await fetch(`${getApiUrl()}/api/remote/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: currentToken,
          refreshToken: refreshTokenValue,
        }),
        credentials: 'include',
      });
    } catch (err) {
      // Fall through — if the backend is unreachable we still complete local
      // logout and redirect. The cookie will expire on its own eventually.
      console.warn('[Dashboard Auth] Backend logout failed; clearing locally only', err);
    }

    clearAuthFromStorage();
    setUser(null);
    setToken(null);

    if (typeof window !== 'undefined') {
      const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL as string;
      window.location.href = `${landingUrl}/?logged_out=true`;
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((userData: Partial<DashboardUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  /**
   * Refresh user profile from API
   * Call this after any profile update operation to get fresh data
   */
  const refreshUserProfile = useCallback(async (): Promise<boolean> => {
    // No token needed — the amoria_auth HttpOnly cookie carries auth.
    const { user: userProfile } = await fetchUserProfile(null);
    if (userProfile) {
      setUser(userProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
      }
      return true;
    }
    return false;
  }, []);

  const value: AuthContextType = {
    user,
    // `token` is kept in the context for source-compat but is intentionally
    // always null — the JWT is never surfaced to JS. Components should
    // derive auth state from `isAuthenticated` or `user` instead.
    token,
    isAuthenticated: !!user && !isLoading,
    isLoading,
    logout,
    refreshToken: refreshTokenFn,
    updateUser,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoggingOut && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#DC2626',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.95rem',
          fontWeight: '500',
          animation: 'fadeInDown 0.3s ease-out',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          You have been logged out successfully
          <style>{`
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateX(-50%) translateY(-1rem); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

/**
 * DashboardAuthProvider component
 * Manages authentication state for the dashboard app
 * - Reads token from URL query param (passed from home app)
 * - Validates token with backend
 * - Stores token in localStorage
 * - Redirects to home login if no valid token
 */
export function DashboardAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#083A85',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  );
}

/**
 * Hook to access dashboard auth context
 */
export function useDashboardAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within a DashboardAuthProvider');
  }
  return context;
}

/**
 * Authenticated fetch utility for dashboard pages.
 * Automatically adds the Bearer token header.
 * On 401, attempts token refresh and retries the request once.
 * Pages can use this instead of raw fetch() for automatic token refresh.
 *
 * Usage: const response = await dashboardAuthFetch(`${apiUrl}/api/remote/...`);
 */
export async function dashboardAuthFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Auth source priority:
  //   1. Bearer from localStorage/authToken cookie — legacy, still dominant for
  //      existing sessions that predate the .connekyt.com HttpOnly cookie.
  //   2. The amoria_auth HttpOnly cookie — travels automatically on cross-
  //      origin requests as long as credentials: 'include' is set below, since
  //      dashboard.connekyt.com and backend.connekyt.com share a registrable
  //      site (connekyt.com → SameSite=Lax permits the subresource cookie).
  //
  // When (1) isn't available, we fall through to a cookie-only request
  // instead of synthesising a 401 — that unblocks users whose session moved
  // to cookie-only (no localStorage token) after the JWT-in-URL handoff was
  // removed from the landing app.
  const currentToken = (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null) || getCookieToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  // credentials: 'include' makes the browser send the amoria_auth HttpOnly
  // cookie on this cross-origin request. Backend CORS allow-list is strict
  // and Access-Control-Allow-Credentials is set, so the cookie only travels
  // to our own domains.
  const fetchOpts: RequestInit = { ...options, headers, credentials: 'include' };

  // Retry network-level failures (e.g. dev backend reloading) up to 2 extra times
  // with short backoff. Only retries on fetch throws — HTTP error statuses pass through.
  const fetchWithRetry = async (u: string, init: RequestInit): Promise<Response> => {
    const bodyIsStream = init.body instanceof ReadableStream;
    const maxAttempts = bodyIsStream ? 1 : 3;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fetch(u, init);
      } catch (err) {
        lastErr = err;
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 300 * attempt));
        }
      }
    }
    throw new Error(`Network request failed for ${u}: ${lastErr instanceof Error ? lastErr.message : 'Failed to fetch'}`);
  };

  let response = await fetchWithRetry(url, fetchOpts);

  if (response.status === 401) {
    // Try one refresh cycle. Works for both Bearer-holding sessions (uses the
    // stored refresh token) and cookie-only sessions (refresh endpoint reads
    // its own cookie if present).
    const newToken = await attemptDashboardTokenRefresh(currentToken || '');
    if (!newToken) {
      if (typeof window !== 'undefined') {
        const isPhotographer = window.location.pathname.includes('/photographer') ||
          document.cookie.includes('userRole=photographer');
        if (isPhotographer) {
          clearAuthFromStorage();
          const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL as string;
          window.location.href = `${landingUrl}/user/auth/login?session_expired=true`;
        }
      }
      return response;
    }
    headers['Authorization'] = `Bearer ${newToken}`;
    // ReadableStream bodies are consumed after the first fetch and cannot be retried.
    // FormData, string, ArrayBuffer etc. are safe to reuse.
    const bodyIsStream = options.body instanceof ReadableStream;
    if (bodyIsStream) {
      console.warn('[Dashboard Auth] Cannot retry 401: request body is a ReadableStream (already consumed)');
      return response;
    }
    response = await fetchWithRetry(url, { ...options, headers, credentials: 'include' });
  }

  return response;
}

export default DashboardAuthProvider;
