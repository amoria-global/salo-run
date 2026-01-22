'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

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
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Get the landing URL for login redirect
 */
function getLandingUrl(): string {
  return process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';
}

/**
 * Get API URL
 */
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}

/**
 * Get API key
 */
function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
}

/**
 * Redirect to login page on home app
 */
function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    const landingUrl = getLandingUrl();
    window.location.href = `${landingUrl}/user/auth/login`;
  }
}

/**
 * Validate token with backend
 */
async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${getApiUrl()}/api/remote/auth/validate-token?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
        headers: {
          'api-token': getApiKey(),
        },
      }
    );
    return response.ok;
  } catch (error) {
    console.error('[Dashboard Auth] Token validation failed:', error);
    return false;
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

  // Initialize from URL token or localStorage
  useEffect(() => {
    const initAuth = async () => {
      // Check for token in URL (passed from home app)
      const urlToken = searchParams.get('token');
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;

      const activeToken = urlToken || storedToken;

      if (activeToken) {
        // Validate token with backend
        const isValid = await validateToken(activeToken);

        if (isValid) {
          setToken(activeToken);

          // Store token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, activeToken);
          }

          // If URL had token, clean it up from URL
          if (urlToken && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.pathname + url.search);
          }

          // Load user data from localStorage if available
          if (storedUserStr) {
            try {
              const storedUser = JSON.parse(storedUserStr);
              setUser(storedUser);
            } catch {
              // Invalid JSON, ignore
            }
          }
        } else {
          // Invalid token - clear storage and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
          }
          redirectToLogin();
          return;
        }
      } else {
        // No token at all - redirect to login
        redirectToLogin();
        return;
      }

      setIsLoading(false);
    };

    initAuth();
  }, [searchParams]);

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
          redirectToLogin();
        }
      }

      // Also check for token changes
      if (event.key === AUTH_TOKEN_KEY) {
        if (!event.newValue) {
          // Token removed, redirect to login
          setToken(null);
          setUser(null);
          redirectToLogin();
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
   * Logout - clear all auth data and redirect to home login
   */
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
    setUser(null);
    setToken(null);
    redirectToLogin();
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

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !isLoading,
    isLoading,
    logout,
    refreshToken: refreshTokenFn,
    updateUser,
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
