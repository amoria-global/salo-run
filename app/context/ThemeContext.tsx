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

const detectRoleFromPath = (pathname: string | null): UserRole => {
  if (pathname && pathname.includes('/user/photographer')) return 'photographer';
  if (pathname && pathname.includes('/user/client')) return 'client';
  return 'default';
};

const getThemeStorageKey = (role: UserRole): string => {
  if (role === 'default') return 'connekt-theme';
  return `connekt-theme-${role}`;
};

/**
 * Light tokens — Connekyt landing language with Airbnb-inspired surfaces.
 * Page background is clearly off-white so white cards stand out; brand
 * stays Connekyt Blue (#083A85), accent stays Rausch (#F20C8F).
 */
const lightColors = {
  // Backgrounds — page (#F2F3F5) clearly distinct from cards (#FFFFFF)
  bgPrimary: '#F2F3F5',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#E9EAEE',
  bgSidebar: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgHover: '#E9EAEE',
  bgActive: '#083A85',
  bgInput: '#FFFFFF',
  bgModal: '#FFFFFF',
  bgOverlay: 'rgba(17, 24, 39, 0.45)',

  // Text
  textPrimary: '#14161A',
  textSecondary: '#4A4D55',
  textTertiary: '#797D86',
  textInverse: '#FFFFFF',
  textLink: '#083A85',

  // Borders
  borderPrimary: '#DCDDE2',
  borderSecondary: '#C3C5CD',
  borderFocus: '#083A85',

  // Brand
  brandPrimary: '#083A85',
  brandSecondary: '#0a4da8',
  brandAccent: '#F20C8F',
  brandAccentSoft: '#FF3DA0',

  // Status
  statusSuccess: '#10B981',
  statusSuccessBg: '#ECFDF5',
  statusWarning: '#F59E0B',
  statusWarningBg: '#FFFBEB',
  statusError: '#DC2626',
  statusErrorBg: '#FEF2F2',
  statusInfo: '#3B82F6',
  statusInfoBg: '#EFF6FF',

  // Shadows (Airbnb-inspired soft drop)
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 6px 16px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 12px 32px rgba(0, 0, 0, 0.12)',
  shadowXl: '0 20px 60px rgba(0, 0, 0, 0.18)',
  shadowCard: '0 1px 3px rgba(0, 0, 0, 0.06)',

  // Radii
  radiusSm: '8px',
  radius: '12px',
  radiusLg: '16px',
  radiusXl: '20px',
};

/**
 * Dark tokens — same Connekyt language, with cards visibly lighter than page.
 */
const darkColors = {
  bgPrimary: '#0B1120',         // page (deeper) so cards stand out
  bgSecondary: '#1E2944',       // cards (clearly lighter)
  bgTertiary: '#2B3754',
  bgSidebar: '#1E2944',
  bgCard: '#1E2944',
  bgHover: '#2B3754',
  bgActive: '#3B82F6',
  bgInput: '#2B3754',
  bgModal: '#1E2944',
  bgOverlay: 'rgba(0, 0, 0, 0.65)',

  textPrimary: '#F2F4F8',
  textSecondary: '#B6BFD2',
  textTertiary: '#8993AA',
  textInverse: '#0B1120',
  textLink: '#93C5FD',

  borderPrimary: '#3D4D70',     // visible against the surface
  borderSecondary: '#4F6090',
  borderFocus: '#60A5FA',

  brandPrimary: '#3B82F6',
  brandSecondary: '#60A5FA',
  brandAccent: '#F472B6',
  brandAccentSoft: '#FF6BBF',

  statusSuccess: '#34D399',
  statusSuccessBg: 'rgba(16, 185, 129, 0.15)',
  statusWarning: '#FBBF24',
  statusWarningBg: 'rgba(245, 158, 11, 0.15)',
  statusError: '#F87171',
  statusErrorBg: 'rgba(220, 38, 38, 0.15)',
  statusInfo: '#60A5FA',
  statusInfoBg: 'rgba(59, 130, 246, 0.15)',

  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.35)',
  shadowMd: '0 6px 16px rgba(0, 0, 0, 0.45)',
  shadowLg: '0 12px 32px rgba(0, 0, 0, 0.55)',
  shadowXl: '0 20px 60px rgba(0, 0, 0, 0.65)',
  shadowCard: '0 1px 3px rgba(0, 0, 0, 0.30)',

  radiusSm: '8px',
  radius: '12px',
  radiusLg: '16px',
  radiusXl: '20px',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [currentRole, setCurrentRole] = useState<UserRole>('default');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const role = detectRoleFromPath(pathname);
    setCurrentRole(role);
  }, [pathname]);

  useEffect(() => {
    const storageKey = getThemeStorageKey(currentRole);
    const savedTheme = localStorage.getItem(storageKey) as ThemeMode | null;
    if (savedTheme) setThemeState(savedTheme);
    else setThemeState('light');
    setIsInitialized(true);
  }, [currentRole]);

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

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (theme === 'system') computeActualTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    document.documentElement.setAttribute('data-theme', actualTheme);

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
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export { lightColors, darkColors };
