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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
 * Fetch photographer profile summary using Bearer token
 * This is the preferred method for authenticated users
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

    if (!response.ok) {
      console.error('[Dashboard Auth] Failed to fetch profile summary:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.action !== 1 || !result.data) {
      console.error('[Dashboard Auth] Invalid profile summary response:', result.message);
      return null;
    }

    const data = result.data;
    console.log('[Dashboard Auth] Fetched profile summary for:', data.firstName, data.lastName);

    // Map API response to DashboardUser format
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
      // New fields from profile-summary endpoint
      joinedFrom: data.joinedFrom || undefined,
      reviews: data.reviews || [],
      packages: data.packages || [],
      profileReviewStatus: data.profileReviewStatus || undefined,
      reviewComment: data.reviewComment || undefined,
    };
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
      // Check for token in cookie
      const cookieToken = getCookieToken();
      // Check localStorage
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;

      // Priority: URL > cookie > localStorage
      const activeToken = urlToken || cookieToken || storedToken;

      if (activeToken) {
        // Fetch profile summary - this also validates the token (will fail if token is invalid)
        const userProfile = await fetchPhotographerProfileSummary(activeToken);

        if (userProfile) {
          // Token is valid and profile fetched successfully
          setToken(activeToken);
          setUser(userProfile);

          // Save token and user to cookie and localStorage
          if (typeof window !== 'undefined') {
            setTokenCookie(activeToken);
            localStorage.setItem(AUTH_TOKEN_KEY, activeToken);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
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
            if (typeof window !== 'undefined') {
              localStorage.removeItem(AUTH_TOKEN_KEY);
              localStorage.removeItem(AUTH_USER_KEY);
              document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            }
          }
        } else {
          // Invalid token - clear storage
          if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
          }
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
      const userProfile = await fetchPhotographerProfileSummary(token);

      if (!userProfile) {
        console.log('[Dashboard Auth] Token validation failed, clearing session...');
        // Clear storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        }
        setToken(null);
        setUser(null);
      } else {
        // Update user with fresh data
        setUser(userProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userProfile));
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
    if (!token) return false;

    try {
      const response = await fetch(
        `${getApiUrl()}/api/remote/auth/api/v1/remote/refresh-token`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'api-token': getApiKey(),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[Dashboard Auth] Token refresh failed:', error);
      return false;
    }
  }, [token]);

  /**
   * Logout - clear all auth data
   */
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      // Clear auth cookie
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
    setUser(null);
    setToken(null);
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

export default DashboardAuthProvider;
