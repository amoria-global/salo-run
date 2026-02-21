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
  // In production (Vercel), use the proxy to avoid mixed content
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
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
    profilePicture: data.profilePicture || undefined,
    coverPicture: data.coverPicture || undefined,
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
 * Fetch photographer profile summary using Bearer token
 * This is the preferred method for authenticated users
 * On 401, attempts token refresh before giving up
 */
async function fetchPhotographerProfileSummary(token: string): Promise<DashboardUser | null> {
  try {
    const response = await fetch(
      `${getApiUrl()}/api/remote/photographer/profile-summary`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': getApiKey(),
        },
      }
    );

    if (response.status === 401) {
      // Attempt token refresh before clearing session
      console.log('[Dashboard Auth] Got 401, attempting token refresh...');
      const newToken = await attemptDashboardTokenRefresh(token);
      if (newToken) {
        // Retry with new token
        const retryResponse = await fetch(
          `${getApiUrl()}/api/remote/photographer/profile-summary`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'api-token': getApiKey(),
            },
          }
        );
        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          if (retryResult.action === 1 && retryResult.data) {
            console.log('[Dashboard Auth] Profile fetch succeeded after token refresh');
            return mapProfileData(retryResult.data);
          }
        }
      }
      // Refresh failed — redirect WITHOUT clearing storage yet
      // The login page will handle storage clearing
      console.log('[Dashboard Auth] Token refresh failed, redirecting to login');
      if (typeof window !== 'undefined') {
        const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
        const loginUrl = `${landingUrl}/user/auth/login?session_expired=true`;
        window.location.href = loginUrl;
      }
      return null;
    }
    if (!response.ok) {
      console.error('[Dashboard Auth] Failed to fetch profile summary:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.action !== 1 || !result.data) {
      console.error('[Dashboard Auth] Invalid profile summary response:', result.message);
      return null;
    }

    console.log('[Dashboard Auth] Fetched profile summary for:', result.data.firstName, result.data.lastName);
    return mapProfileData(result.data);
  } catch (error) {
    console.error('[Dashboard Auth] Error fetching profile summary:', error);
    return null;
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
        const userProfile = await fetchPhotographerProfileSummary(activeToken);

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

          // Clean up URL token param
          if (urlToken && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('email'); // Clean up email too if present (legacy)
            window.history.replaceState({}, '', url.pathname + url.search);
          }
        } else if (storedUserStr && storedToken === activeToken) {
          // Profile fetch failed but we have cached data - use it temporarily
          // This handles offline/network issues
          try {
            const storedUser = JSON.parse(storedUserStr);
            setToken(activeToken);
            setUser(storedUser);
            console.log('[Dashboard Auth] Using cached user profile');
          } catch {
            // Invalid JSON - clear storage
            clearAuthFromStorage();
          }
        } else {
          // Invalid token - clear storage
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
      console.log('[Dashboard Auth] Running periodic profile refresh...');
      // fetchPhotographerProfileSummary now handles 401 internally:
      // on 401 it tries token refresh, retries, and redirects to login if refresh fails
      const userProfile = await fetchPhotographerProfileSummary(token);

      if (!userProfile) {
        // Profile fetch returned null — either a non-401 error (network issue)
        // or 401 handler already triggered redirect. Don't double-clear.
        console.log('[Dashboard Auth] Periodic profile refresh returned null');
      } else {
        // Success — sync latest token from storage (may have been refreshed)
        const latestToken = (typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null) || token;
        if (latestToken !== token) {
          console.log('[Dashboard Auth] Token was refreshed during periodic check, syncing state');
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
        console.log('[Dashboard Auth] Profile refresh successful');
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
    // Redirect to home app login
    if (typeof window !== 'undefined') {
      const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
      window.location.href = `${landingUrl}/user/auth/login`;
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

    console.log('[Dashboard Auth] Refreshing user profile...');
    const userProfile = await fetchPhotographerProfileSummary(token);

    if (userProfile) {
      setUser(userProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
      }
      console.log('[Dashboard Auth] Profile refreshed successfully');
      return true;
    }

    console.error('[Dashboard Auth] Failed to refresh profile');
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

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const newToken = await attemptDashboardTokenRefresh(currentToken);
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

export default DashboardAuthProvider;
