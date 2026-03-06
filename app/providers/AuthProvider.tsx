'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

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
  // New fields from profile-summary endpoint
  joinedFrom?: string;
  reviews?: unknown[];
  packages?: unknown[];
  profileReviewStatus?: string;
  reviewComment?: string;
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

/**
 * Normalize image URLs from the API to avoid mixed content issues.
 * In production, rewrites http://backend-ip/... to same-origin paths so images
 * are served through the server's reverse proxy.
 */
function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  // Backend returns http://host/uploads/null when no image is set — treat as no image
  if (url.includes('/null')) return undefined;
  if (typeof window === 'undefined') return url;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
  // The backend still returns image URLs with the old IP — handle both
  const OLD_BACKEND_IP = 'http://197.243.24.101';

  // In production, rewrite backend URLs to same-origin paths (server reverse-proxies to backend)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (url.startsWith(apiBase)) return url.replace(apiBase, '');
    if (url.startsWith(OLD_BACKEND_IP)) return url.replace(OLD_BACKEND_IP, '');
  }
  // In dev, rewrite old IP URLs to use the current API base
  if (url.startsWith(OLD_BACKEND_IP) && apiBase !== OLD_BACKEND_IP) {
    return url.replace(OLD_BACKEND_IP, apiBase);
  }
  return url;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Atomically save token to all storage locations
 * Prevents partial state writes during navigation
 */
function saveTokenToStorage(token: string): void {
  if (typeof window === 'undefined') return;

  try {
    // Save to localStorage first (fastest)
    localStorage.setItem('authToken', token);

    // Then save to cookie (can't fail silently)
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch (error) {
    console.error('[Dashboard Auth] Failed to save token to storage:', error);
    // Don't throw - partial save is better than no save
  }
}

function saveRefreshTokenToStorage(refreshToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${maxAge}; samesite=lax`;
  } catch (error) {
    console.error('[Dashboard Auth] Failed to save refresh token:', error);
  }
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
 * Get API URL
 */
function getApiUrl(): string {
  // In production, the server reverse-proxies /api/* to the backend directly
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

/**
 * Get API key
 */
function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
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
 * Set token in cookie
 */
function setTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; samesite=lax`;
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
async function attemptDashboardTokenRefresh(currentToken: string): Promise<string | null> {
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
            'api-token': getApiKey(),
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
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
    joinedFrom: data.joinedFrom || undefined,
    reviews: data.reviews || [],
    packages: data.packages || [],
    profileReviewStatus: data.profileReviewStatus || undefined,
    reviewComment: data.reviewComment || undefined,
  };
}

/**
 * Try fetching a single profile endpoint. Returns the parsed user on success, or null.
 * Does NOT handle 401 — caller is responsible for token refresh logic.
 */
async function tryFetchProfile(
  endpoint: string,
  token: string,
  roleName: string
): Promise<{ user: DashboardUser | null; status: number }> {
  try {
    const url = `${getApiUrl()}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'api-token': getApiKey(),
      },
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
async function fetchUserProfile(token: string): Promise<{ user: DashboardUser | null; reason: 'success' | 'unauthorized' | 'server_error' | 'network_error' }> {
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
      if (typeof window !== 'undefined') {
        const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://connekyt.com';
        const loginUrl = `${landingUrl}/user/auth/login?session_expired=true`;
        window.location.href = loginUrl;
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

  // Initialize from URL token, cookie, or localStorage
  useEffect(() => {
    const initAuth = async () => {
      // Check for token in URL params (primary method)
      const urlToken = searchParams.get('token');
      const urlRefreshToken = searchParams.get('refreshToken');
      // Check for token in cookie
      const cookieToken = getCookieToken();
      // Check localStorage
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;

      // Store refresh token if provided via URL or cookie
      if (urlRefreshToken) {
        saveRefreshTokenToStorage(urlRefreshToken);
      }

      // Priority: URL > cookie > localStorage
      const activeToken = urlToken || cookieToken || storedToken;

      if (activeToken) {
        // Fetch profile summary - this also validates the token (will fail if token is invalid)
        const { user: userProfile, reason } = await fetchUserProfile(activeToken);

        if (userProfile) {
          // Token may have been refreshed during profile fetch — use latest from storage
          const latestToken = (typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null) || activeToken;
          setToken(latestToken);
          setUser(userProfile);

          // Save token and user to cookie and localStorage atomically
          if (typeof window !== 'undefined') {
            saveTokenToStorage(latestToken);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
            // Store role cookie for middleware route protection
            if (userProfile.customerType) {
              document.cookie = `userRole=${userProfile.customerType.toLowerCase()}; path=/; max-age=${60*60*24*7}; samesite=lax`;
            }
          }

          // Clean up URL token params (security: don't leave tokens in history)
          if (urlToken && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('refreshToken');
            url.searchParams.delete('email'); // Clean up email too if present (legacy)
            window.history.replaceState({}, '', url.pathname + url.search);
          }
        } else if (reason === 'server_error' || reason === 'network_error') {
          // Backend is down or returning 500 — keep the token and use cached data if available
          // Do NOT clear auth — the token may still be valid, the backend is just broken
          if (storedUserStr) {
            try {
              const storedUser = JSON.parse(storedUserStr);
              setToken(activeToken);
              setUser(storedUser);
              saveTokenToStorage(activeToken);
            } catch {
              // Invalid JSON but still keep the token — don't clear auth
              setToken(activeToken);
              saveTokenToStorage(activeToken);
            }
          } else {
            // No cached data and backend is down — keep token, user stays null but auth isn't cleared
            setToken(activeToken);
            saveTokenToStorage(activeToken);
          }
        } else if (storedUserStr && storedToken === activeToken) {
          // Unauthorized but have cached data — use briefly (will redirect soon anyway)
          try {
            const storedUser = JSON.parse(storedUserStr);
            setToken(activeToken);
            setUser(storedUser);
          } catch {
            clearAuthFromStorage();
          }
        } else {
          // Unauthorized, no cache — clear storage
          clearAuthFromStorage();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [searchParams]);

  // Validate token and refresh profile every 5 minutes
  useEffect(() => {
    if (!token) return;

    const FIVE_MINUTES = 5 * 60 * 1000;

    const intervalId = setInterval(async () => {
      const { user: userProfile } = await fetchUserProfile(token);

      if (!userProfile) {
        // Don't clear state on server errors — keep existing user data
      } else {
        // Success — sync latest token from storage (may have been refreshed)
        const latestToken = (typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null) || token;
        if (latestToken !== token) {
          setToken(latestToken);
        }
        // Update user with fresh data
        setUser(userProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
          // Keep role cookie fresh
          if (userProfile.customerType) {
            document.cookie = `userRole=${userProfile.customerType.toLowerCase()}; path=/; max-age=${60*60*24*7}; samesite=lax`;
          }
        }
      }
    }, FIVE_MINUTES);

    return () => clearInterval(intervalId);
  }, [token]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_USER_KEY) {
        if (event.newValue) {
          try {
            const newUser = JSON.parse(event.newValue);
            setUser(newUser);
          } catch {
            setUser(null);
          }
        } else {
          // User was removed (logged out in another tab)
          setUser(null);
        }
      }

      // Also check for token changes
      if (event.key === AUTH_TOKEN_KEY) {
        if (!event.newValue) {
          // Token removed
          setToken(null);
          setUser(null);
        } else {
          setToken(event.newValue);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

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
            'api-token': getApiKey(),
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
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
  const logout = useCallback(() => {
    clearAuthFromStorage();
    setUser(null);
    setToken(null);
    setIsLoggingOut(true);

    if (typeof window !== 'undefined') {
      const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://connekyt.com';

      // Notify the landing page via postMessage (works when opened as a popup)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'LOGOUT' },
          landingUrl
        );
      }

      // Redirect to the public site's logout route so it can clear its own
      // auth state (localStorage, cookies) before forwarding to the login page.
      // This is necessary because postMessage via window.opener only works in
      // popup flows; in normal navigation window.opener is null.
      setTimeout(() => {
        window.location.href = `${landingUrl}/user/auth/logout?logged_out=true`;
      }, 1500);
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
    if (!token) {
      console.error('[Dashboard Auth] No token available for profile refresh');
      return false;
    }

    const { user: userProfile } = await fetchUserProfile(token);

    if (userProfile) {
      setUser(userProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
      }
      return true;
    }

    return false;
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !isLoading,
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
 * Automatically adds Bearer token and api-token headers.
 * On 401, attempts token refresh and retries the request once.
 * Pages can use this instead of raw fetch() for automatic token refresh.
 *
 * Usage: const response = await dashboardAuthFetch(`${apiUrl}/api/remote/...`);
 */
export async function dashboardAuthFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const currentToken = (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null) || getCookieToken();
  if (!currentToken) throw new Error('No auth token available');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${currentToken}`,
    'api-token': getApiKey(),
    ...(options.headers as Record<string, string> || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new Error(`Network request failed for ${url}: ${err instanceof Error ? err.message : 'Failed to fetch'}`);
  }

  if (response.status === 401) {
    const newToken = await attemptDashboardTokenRefresh(currentToken);
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      // ReadableStream bodies are consumed after the first fetch and cannot be retried.
      // FormData, string, ArrayBuffer etc. are safe to reuse.
      const bodyIsStream = options.body instanceof ReadableStream;
      if (bodyIsStream) {
        console.warn('[Dashboard Auth] Cannot retry 401: request body is a ReadableStream (already consumed)');
        return response;
      }
      try {
        response = await fetch(url, { ...options, headers });
      } catch (err) {
        throw new Error(`Network request failed on token-refresh retry for ${url}: ${err instanceof Error ? err.message : 'Failed to fetch'}`);
      }
    }
  }

  return response;
}

export default DashboardAuthProvider;
