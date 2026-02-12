"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type ThemeMode = 'light' | 'dark' | 'system';
export type UserRole = 'photographer' | 'client' | 'default';

interface ThemeContextType {
  theme: ThemeMode;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  colors: typeof lightColors;
  currentRole: UserRole;
}

// Function to detect role from pathname
const detectRoleFromPath = (pathname: string | null): UserRole => {
  if (pathname && pathname.includes('/user/photographer')) {
    return 'photographer';
  }
  if (pathname && pathname.includes('/user/client')) {
    return 'client';
  }
  return 'default';
};

// Get storage key based on role
const getThemeStorageKey = (role: UserRole): string => {
  if (role === 'default') {
    return 'connekt-theme';
  }
  return `connekt-theme-${role}`;
};

const lightColors = {
  // Backgrounds
  bgPrimary: '#F9FAFB',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F3F4F6',
  bgSidebar: '#f5f5f5',
  bgCard: '#F7F8FA',
  bgHover: '#E5E7EB',
  bgActive: '#083A85',
  bgInput: '#FFFFFF',
  bgModal: '#FFFFFF',
  bgOverlay: 'rgba(0, 0, 0, 0.5)',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#083A85',

  // Borders
  borderPrimary: '#E5E7EB',
  borderSecondary: '#D1D5DB',
  borderFocus: '#083A85',

  // Brand
  brandPrimary: '#083A85',
  brandSecondary: '#0a4da8',
  brandAccent: '#F20C8F',

  // Status
  statusSuccess: '#10B981',
  statusSuccessBg: '#D1FAE5',
  statusWarning: '#F59E0B',
  statusWarningBg: '#FEF3C7',
  statusError: '#DC2626',
  statusErrorBg: '#FEE2E2',
  statusInfo: '#3B82F6',
  statusInfoBg: '#DBEAFE',

  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
  shadowCard: '0 1px 3px rgba(0, 0, 0, 0.06)',
};

const darkColors = {
  // Backgrounds
  bgPrimary: '#111827',
  bgSecondary: '#1F2937',
  bgTertiary: '#374151',
  bgSidebar: '#1F2937',
  bgCard: '#1F2937',
  bgHover: '#374151',
  bgActive: '#3B82F6',
  bgInput: '#374151',
  bgModal: '#1F2937',
  bgOverlay: 'rgba(0, 0, 0, 0.7)',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111827',
  textLink: '#60A5FA',

  // Borders
  borderPrimary: '#374151',
  borderSecondary: '#4B5563',
  borderFocus: '#3B82F6',

  // Brand
  brandPrimary: '#3B82F6',
  brandSecondary: '#60A5FA',
  brandAccent: '#F472B6',

  // Status
  statusSuccess: '#34D399',
  statusSuccessBg: '#064E3B',
  statusWarning: '#FBBF24',
  statusWarningBg: '#78350F',
  statusError: '#F87171',
  statusErrorBg: '#7F1D1D',
  statusInfo: '#60A5FA',
  statusInfoBg: '#1E3A5F',

  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  shadowCard: '0 1px 3px rgba(0, 0, 0, 0.15)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [currentRole, setCurrentRole] = useState<UserRole>('default');
  const [isInitialized, setIsInitialized] = useState(false);

  // Detect role from pathname
  useEffect(() => {
    const role = detectRoleFromPath(pathname);
    setCurrentRole(role);
  }, [pathname]);

  // Initialize theme from localStorage based on current role
  useEffect(() => {
    const storageKey = getThemeStorageKey(currentRole);
    const savedTheme = localStorage.getItem(storageKey) as ThemeMode | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Default to light if no saved theme for this role
      setThemeState('light');
    }
    setIsInitialized(true);
  }, [currentRole]);

  // Handle system theme changes and compute actual theme
  useEffect(() => {
    if (!isInitialized) return;

    const computeActualTheme = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(prefersDark ? 'dark' : 'light');
      } else {
        setActualTheme(theme);
      }
    };

    computeActualTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        computeActualTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, isInitialized]);

  // Apply theme to document
  useEffect(() => {
    if (!isInitialized) return;

    document.documentElement.setAttribute('data-theme', actualTheme);

    // Apply CSS variables for theming
    const colors = actualTheme === 'dark' ? darkColors : lightColors;
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [actualTheme, isInitialized]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const storageKey = getThemeStorageKey(currentRole);
    localStorage.setItem(storageKey, newTheme);
  };

  const colors = actualTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, colors, currentRole }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { lightColors, darkColors };
