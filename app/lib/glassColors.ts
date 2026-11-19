/**
 * The old ThemeContext colour names, pointed at the Compact Glass palette (the mobile app's src/theme/palettes.ts),
 * for pages not yet redesigned while the ui-glass flag is on. Values stay plain hex or rgba because 16 call sites
 * append a hex alpha to them (`${colors.brandPrimary}20`).
 */
import type { lightColors } from '../context/ThemeContext';

type Colors = typeof lightColors;

export const glassLightColors: Colors = {
  bgPrimary: '#F4F6FB',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#E9EAEE',
  bgSidebar: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgHover: '#E9EAEE',
  bgActive: '#3E6FD8',
  bgInput: '#FFFFFF',
  bgModal: '#FFFFFF',
  bgOverlay: 'rgba(0, 0, 0, 0.45)',
  textPrimary: '#0F1217',
  textSecondary: '#3A3D44',
  textTertiary: '#6A6D76',
  textInverse: '#FFFFFF',
  textLink: '#3461C8',
  borderPrimary: '#D4D6DC',
  borderSecondary: '#B5B7BF',
  borderFocus: '#3E6FD8',
  brandPrimary: '#3E6FD8',
  brandSecondary: '#2F64C8',
  brandAccent: '#F20C8F',
  brandAccentSoft: '#FF4FAE',
  // AA as text on white: the mobile palette's deep status tones, not the 500-weight Tailwind ones.
  statusSuccess: '#065F46',
  statusSuccessBg: '#ECFDF5',
  statusWarning: '#92400E',
  statusWarningBg: '#FFFBEB',
  statusError: '#991B1B',
  statusErrorBg: '#FEF2F2',
  statusInfo: '#1E40AF',
  statusInfoBg: '#EFF6FF',
  shadowSm: '0 1px 2px rgba(15, 18, 23, 0.06)',
  shadowMd: '0 6px 18px rgba(15, 18, 23, 0.08)',
  shadowLg: '0 16px 40px rgba(15, 18, 23, 0.14)',
  shadowXl: '0 20px 60px rgba(15, 18, 23, 0.18)',
  shadowCard: '0 1px 2px rgba(15, 18, 23, 0.06)',
  radiusSm: '8px',
  radius: '14px',
  radiusLg: '20px',
  radiusXl: '24px',
};

export const glassDarkColors: Colors = {
  bgPrimary: '#0A1220',
  bgSecondary: '#101B2E',
  bgTertiary: '#1B2B46',
  bgSidebar: '#101B2E',
  bgCard: '#16243C',
  bgHover: '#1B2B46',
  bgActive: '#3E6FD8',
  bgInput: '#1B2B46',
  bgModal: '#1D2F4D',
  bgOverlay: 'rgba(0, 0, 0, 0.65)',
  textPrimary: '#EAF0FA',
  textSecondary: '#C9D5EA',
  textTertiary: '#93A3BE',
  textInverse: '#0A1220',
  textLink: '#7FA2FF',
  borderPrimary: '#2A3B58',
  borderSecondary: '#3A4E72',
  borderFocus: '#5B8CFF',
  brandPrimary: '#3E6FD8',
  brandSecondary: '#5B8CFF',
  brandAccent: '#EE0E8F',
  brandAccentSoft: '#FF5DB8',
  statusSuccess: '#4ADE80',
  statusSuccessBg: '#0E2F22',
  statusWarning: '#F5B400',
  statusWarningBg: '#33260A',
  statusError: '#F87171',
  statusErrorBg: '#341A1D',
  statusInfo: '#8FB4FF',
  statusInfoBg: '#14335E',
  shadowSm: '0 2px 8px rgba(0, 0, 0, 0.35)',
  shadowMd: '0 10px 26px rgba(0, 0, 0, 0.45)',
  shadowLg: '0 20px 50px rgba(0, 0, 0, 0.55)',
  shadowXl: '0 24px 64px rgba(0, 0, 0, 0.65)',
  shadowCard: '0 2px 8px rgba(0, 0, 0, 0.35)',
  radiusSm: '8px',
  radius: '14px',
  radiusLg: '20px',
  radiusXl: '24px',
};

/** True when the page was served with the new UI (the head script set the class before paint). */
export function isGlassDocument(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('ui-glass');
}
