"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';

function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}

// ============================================
// ICONS
// ============================================

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 9.4L7.55 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 16V8C20.9996 7.6493 20.9071 7.30483 20.7315 7.00116C20.556 6.69749 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69749 3.26846 7.00116C3.09294 7.30483 3.00036 7.6493 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.27 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BroadcastIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16.24 7.76C17.5 9.02 18.25 10.7 18.25 12.5C18.25 14.3 17.5 15.98 16.24 17.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.76 16.24C6.5 14.98 5.75 13.3 5.75 11.5C5.75 9.7 6.5 8.02 7.76 6.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
  </svg>
);

const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 5.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0119.18 17.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#F20C8F' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.09924 19.7228 3.6929 19.0554 3.41524C18.3879 3.13757 17.6725 2.99414 16.95 2.99414C16.2275 2.99414 15.5121 3.13757 14.8446 3.41524C14.1772 3.6929 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99479 7.05 2.99479C5.59096 2.99479 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54478 7.04097 1.54478 8.5C1.54478 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.3508 11.8792 21.7571 11.2728 22.0348 10.6054C22.3124 9.93789 22.4559 9.22249 22.4559 8.5C22.4559 7.77751 22.3124 7.06211 22.0348 6.39464C21.7571 5.72718 21.3508 5.12075 20.84 4.61Z" stroke={filled ? '#F20C8F' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/>
  </svg>
);

const ServerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FaceRecognitionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="16" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="2" y="16" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="16" y="16" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const InviteCodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// INTERFACES
// ============================================

type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

interface AssignedEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: { address: string; city: string; country: string };
  coverImage: string;
  status: EventStatus;
  clientName: string;
  clientImage: string;
  clientEmail: string;
  organizerName: string;
  packageName: string;
  packageId: string;
  hasLiveStream: boolean;
  guestCount: number;
  maxGuests: number;
  bookingId: string;
  totalAmount: number;
  createdAt: string;
}

interface StreamConfig {
  eventId: string;
  serverUrl: string;
  streamKey: string;
  connectionStatus: 'idle' | 'waiting_for_encoder' | 'receiving_signal' | 'live';
  streamHealth: 'good' | 'fair' | 'poor';
  uploadSpeed: string;
  viewerCount: number;
  peakViewers: number;
}

interface Album {
  id: string;
  title: string;
  description: string;
  category: string;
  eventId: string;
  eventTitle: string;
  clientId: string;
  clientName: string;
  coverImage: string;
  images: string[];
  photoCount: number;
  views: number;
  likes: number;
  downloads: number;
  shared: boolean;
  sharedWithClient: boolean;
  faceRecognitionEnabled: boolean;
  inviteCode: string | null;
  createdAt: string;
}

// ============================================
// EMPTY DEFAULTS (API data only — no mock data)
// ============================================

// View Toggle Icons
const EventsViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const AlbumsViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <path d="M21 15l-5-5L5 21" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// MAIN COMPONENT
// ============================================

const PhotographerEventsPage = () => {
  const { colors, actualTheme } = useTheme();
  const { user, token } = useDashboardAuth();
  const { formatPrice } = useCurrency();
  const apiUrl = getApiUrl();

  const [activeTab, setActiveTab] = useState<'events' | 'albums'>('events');
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AssignedEvent | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showStreamSetupModal, setShowStreamSetupModal] = useState(false);
  const [streamConfigs, setStreamConfigs] = useState<Record<string, StreamConfig>>({});
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [markCompleteTarget, setMarkCompleteTarget] = useState<AssignedEvent | null>(null);
  const [markingCompletedId, setMarkingCompletedId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumFilter, setAlbumFilter] = useState<'all' | 'shared' | 'unshared'>('all');
  const [albumSearch, setAlbumSearch] = useState('');
  const [albumViewMode, setAlbumViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [createAlbumEventId, setCreateAlbumEventId] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumCategory, setAlbumCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [showAlbumBrowseModal, setShowAlbumBrowseModal] = useState(false);
  const [showAlbumEditModal, setShowAlbumEditModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFaceRecognitionModal, setShowFaceRecognitionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<Album | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editCoverIndex, setEditCoverIndex] = useState(0);
  const [isUploadingAlbum, setIsUploadingAlbum] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [mediaIdMap, setMediaIdMap] = useState<Record<string, string>>({});

  // Fetch events from API
  useEffect(() => {
    if (!user?.id) return;
    const loadEvents = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events`);
        if (res.ok) {
          const result = await res.json();
          const data = result?.data || [];
          if (data.length > 0) {
            const mapped: AssignedEvent[] = data.map((e: any) => ({
              id: e.id,
              title: e.title || '',
              description: e.description || '',
              eventType: e.eventType || '',
              category: e.category || '',
              date: e.date || '',
              startTime: e.startTime || '',
              endTime: e.endTime || '',
              duration: '',
              location: e.location || { address: '', city: '', country: '' },
              coverImage: e.coverImage || '',
              status: e.status || 'upcoming',
              clientName: e.clientName || '',
              clientImage: e.clientImage || '',
              clientEmail: e.clientEmail || '',
              organizerName: e.organizerName || '',
              packageName: e.packageName || '',
              packageId: e.packageId || '',
              hasLiveStream: e.hasLiveStream || false,
              guestCount: e.guestCount || 0,
              maxGuests: e.maxGuests || 0,
              bookingId: e.bookingId || e.id,
              totalAmount: e.totalAmount || 0,
              createdAt: e.createdAt || '',
            }));
            setEvents(mapped);
          } else {
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      }
    };
    loadEvents();
  }, [user?.id, apiUrl]);

  // Fetch albums from API (galleries)
  useEffect(() => {
    if (!user?.id) return;
    const loadAlbums = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/galleries`);
        if (res.ok) {
          const result = await res.json();
          const data = result?.data || [];
          if (data.length > 0) {
            const mapped: Album[] = data.map((a: any) => ({
              id: a.id,
              title: a.title || '',
              description: a.description || '',
              category: a.category || '',
              eventId: a.eventId || '',
              eventTitle: a.eventTitle || '',
              clientId: a.clientId || '',
              clientName: a.clientName || '',
              coverImage: a.coverImage || a.thumbnail || '',
              images: a.images || [],
              photoCount: a.photoCount || a.imageCount || 0,
              views: a.views || 0,
              likes: a.likes || 0,
              downloads: a.downloads || 0,
              shared: a.shared || false,
              sharedWithClient: a.sharedWithClient || false,
              faceRecognitionEnabled: a.faceRecognitionEnabled || false,
              inviteCode: a.inviteCode || null,
              createdAt: a.createdAt || '',
            }));
            setAlbums(mapped);
          } else {
            setAlbums([]);
          }
        } else {
          setAlbums([]);
        }
      } catch {
        setAlbums([]);
      }
    };
    loadAlbums();
  }, [user?.id, apiUrl]);

  // Fetch stream configs for events with live stream
  useEffect(() => {
    if (events.length === 0) return;
    const loadStreamConfigs = async () => {
      const configs: Record<string, StreamConfig> = {};
      for (const event of events.filter(e => e.hasLiveStream)) {
        try {
          const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${event.id}/stream/config`);
          if (res.ok) {
            const result = await res.json();
            if (result?.data) configs[event.id] = result.data;
          }
        } catch { /* use default */ }
      }
      if (Object.keys(configs).length > 0) {
        setStreamConfigs(prev => ({ ...prev, ...configs }));
      } else {
        setStreamConfigs({});
      }
    };
    loadStreamConfigs();
  }, [events, apiUrl]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (time: string) => { const [h, m] = time.split(':'); const hour = parseInt(h); return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`; };

  const getStatusBadge = (status: EventStatus) => {
    const map: Record<EventStatus, { bg: string; color: string; label: string }> = {
      upcoming: { bg: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', color: actualTheme === 'dark' ? '#FBBF24' : '#D97706', label: 'Upcoming' },
      ongoing: { bg: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE', color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB', label: 'Ongoing' },
      completed: { bg: actualTheme === 'dark' ? '#064E3B' : '#D1FAE5', color: actualTheme === 'dark' ? '#34D399' : '#059669', label: 'Completed' },
      cancelled: { bg: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2', color: actualTheme === 'dark' ? '#F87171' : '#DC2626', label: 'Cancelled' },
    };
    return map[status];
  };

  const generateInviteCode = () => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let r = ''; for (let i = 0; i < 8; i++) r += c.charAt(Math.floor(Math.random() * c.length)); return r; };
  const handleCopyField = (text: string, field: string) => { navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(''), 2000); };
  const handleCopyLink = (text: string) => { navigator.clipboard.writeText(text); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
  const handleCopyInviteCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedInviteCode(true); setTimeout(() => setCopiedInviteCode(false), 2000); };

  const handleStartStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'waiting_for_encoder' } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/start`, { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to start stream:', res.status);
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'idle' } }));
      }
    } catch (err) {
      console.error('Error starting stream:', err);
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'idle' } }));
    }
  };

  const handleGoLive = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'live', uploadSpeed: '4.2 Mbps', streamHealth: 'good' } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/resume`, { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to go live:', res.status);
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'waiting_for_encoder', uploadSpeed: '0 Mbps' } }));
      }
    } catch (err) {
      console.error('Error going live:', err);
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'waiting_for_encoder', uploadSpeed: '0 Mbps' } }));
    }
  };

  const handleEndStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'idle', uploadSpeed: '0 Mbps' } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/stop`, { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to stop stream:', res.status);
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'live' } }));
      }
    } catch (err) {
      console.error('Error stopping stream:', err);
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'live' } }));
    }
  };

  const handleMarkCompleted = async (eventId: string) => {
    setMarkingCompletedId(eventId);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/mark-completed`, { method: 'POST' });
      if (res.ok) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' as EventStatus } : e));
      } else {
        console.error('Failed to mark event completed:', res.status);
      }
    } catch (err) {
      console.error('Error marking event completed:', err);
    } finally {
      setMarkingCompletedId(null);
      setMarkCompleteTarget(null);
    }
  };

  const uploadMediaToEvent = async (eventId: string, file: File): Promise<{ id: string; url: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/events/${eventId}/media/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const media = data.data || data;
        return { id: media.id || '', url: media.url || media.fileUrl || media.mediaUrl || '' };
      }
      console.error('Failed to upload media:', res.status);
      return null;
    } catch (err) {
      console.error('Error uploading media:', err);
      return null;
    }
  };

  const fetchEventMedia = async (eventId: string): Promise<{ id: string; url: string }[]> => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/events/${eventId}/media`);
      if (res.ok) {
        const data = await res.json();
        const mediaList = data.data || [];
        return mediaList.map((m: any) => ({ id: m.id || '', url: m.url || m.fileUrl || m.mediaUrl || '' }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching event media:', err);
      return [];
    }
  };

  const deleteEventMedia = async (eventId: string, mediaId: string): Promise<boolean> => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/events/${eventId}/media/${mediaId}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('Error deleting media:', err);
      return false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return; setSelectedFiles(files);
    const previews: string[] = [];
    Array.from(files).forEach(file => { const reader = new FileReader(); reader.onload = (ev) => { previews.push(ev.target?.result as string); if (previews.length === files.length) setUploadedImagePreviews([...previews]); }; reader.readAsDataURL(file); });
  };

  const handleOpenCreateAlbum = async (eventId?: string) => {
    if (eventId) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setCreateAlbumEventId(eventId);
        setAlbumTitle(`${event.title} Album`);
        setAlbumCategory(event.eventType);
        setAlbumDescription(`Photo collection from ${event.title}`);
        // Fetch existing event media
        const existingMedia = await fetchEventMedia(eventId);
        if (existingMedia.length > 0) {
          setUploadedImagePreviews(existingMedia.map(m => m.url));
          const idMap: Record<string, string> = {};
          existingMedia.forEach(m => { idMap[m.url] = m.id; });
          setMediaIdMap(prev => ({ ...prev, ...idMap }));
        }
      }
    } else {
      setCreateAlbumEventId(''); setAlbumTitle(''); setAlbumCategory(''); setAlbumDescription('');
      setUploadedImagePreviews([]);
    }
    setSelectedFiles(null); setSelectedCoverIndex(0); setShowCreateAlbumModal(true);
  };

  const handleEventSelectForAlbum = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setCreateAlbumEventId(eventId);
      setAlbumTitle(`${event.title} Album`);
      setAlbumCategory(event.eventType);
      setAlbumDescription(`Photo collection from ${event.title}`);
      // Fetch existing event media
      const existingMedia = await fetchEventMedia(eventId);
      if (existingMedia.length > 0) {
        setUploadedImagePreviews(existingMedia.map(m => m.url));
        const idMap: Record<string, string> = {};
        existingMedia.forEach(m => { idMap[m.url] = m.id; });
        setMediaIdMap(prev => ({ ...prev, ...idMap }));
      } else {
        setUploadedImagePreviews([]);
      }
      setSelectedCoverIndex(0);
    }
  };

  const handleCreateAlbum = async () => {
    const event = events.find(e => e.id === createAlbumEventId); if (!event || !albumTitle) return;
    setIsUploadingAlbum(true);
    let albumImages = uploadedImagePreviews.length > 0 ? [...uploadedImagePreviews] : [event.coverImage];
    let albumCover = uploadedImagePreviews[selectedCoverIndex] || event.coverImage;

    // Upload files to event via API if files are selected
    if (selectedFiles && selectedFiles.length > 0) {
      const uploadedUrls: string[] = [];
      const idMap: Record<string, string> = {};
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}...`);
        const result = await uploadMediaToEvent(event.id, selectedFiles[i]);
        if (result && result.url) {
          uploadedUrls.push(result.url);
          idMap[result.url] = result.id;
        }
      }
      if (uploadedUrls.length > 0) {
        albumImages = uploadedUrls;
        albumCover = uploadedUrls[Math.min(selectedCoverIndex, uploadedUrls.length - 1)];
        setMediaIdMap(prev => ({ ...prev, ...idMap }));
      }
    }

    const newAlbum: Album = { id: `a${Date.now()}`, title: albumTitle, description: albumDescription, category: albumCategory, eventId: event.id, eventTitle: event.title, clientId: event.bookingId, clientName: event.clientName, coverImage: albumCover, images: albumImages, photoCount: albumImages.length, views: 0, likes: 0, downloads: 0, shared: false, sharedWithClient: false, faceRecognitionEnabled: false, inviteCode: null, createdAt: new Date().toISOString().split('T')[0] };
    setAlbums(prev => [newAlbum, ...prev]); setShowCreateAlbumModal(false); setActiveTab('albums');
    setIsUploadingAlbum(false); setUploadProgress('');

    // Persist album to backend
    try {
      const formData = new FormData();
      formData.append('title', albumTitle);
      if (albumDescription) formData.append('description', albumDescription);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/galleries`, { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        const backendId = result?.data?.id;
        if (backendId) {
          setAlbums(prev => prev.map(a => a.id === newAlbum.id ? { ...a, id: backendId } : a));
        }
      }
    } catch (err) { console.error('Failed to persist album:', err); }
  };

  const handleOpenEdit = (album: Album) => { setSelectedAlbum(album); setEditTitle(album.title); setEditDescription(album.description); setEditCategory(album.category); setEditImages([...album.images]); setEditCoverIndex(album.images.indexOf(album.coverImage) >= 0 ? album.images.indexOf(album.coverImage) : 0); setShowAlbumEditModal(true); };
  const handleSaveEdit = async () => { if (!selectedAlbum || editImages.length === 0) return; const coverIdx = Math.min(editCoverIndex, editImages.length - 1); setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, title: editTitle, description: editDescription, category: editCategory, images: editImages, coverImage: editImages[coverIdx], photoCount: editImages.length } : a)); setShowAlbumEditModal(false); try { const formData = new FormData(); formData.append('title', editTitle); formData.append('description', editDescription); await dashboardAuthFetch(`${apiUrl}/api/remote/customer/galleries/${selectedAlbum.id}`, { method: 'PUT', body: formData }); } catch (err) { console.error('Failed to update album:', err); } };
  const handleEditFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || !selectedAlbum) return;
    for (const file of Array.from(files)) {
      const result = await uploadMediaToEvent(selectedAlbum.eventId, file);
      if (result && result.url) {
        setEditImages(prev => [...prev, result.url]);
        setMediaIdMap(prev => ({ ...prev, [result.url]: result.id }));
      } else {
        // Fallback to local preview if upload fails
        const reader = new FileReader();
        reader.onload = (ev) => { setEditImages(prev => [...prev, ev.target?.result as string]); };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };
  const handleEditImageRemove = async (index: number) => {
    const imageUrl = editImages[index];
    const mediaId = mediaIdMap[imageUrl];
    // Delete from server if we have a media ID
    if (mediaId && selectedAlbum) {
      deleteEventMedia(selectedAlbum.eventId, mediaId);
      setMediaIdMap(prev => { const updated = { ...prev }; delete updated[imageUrl]; return updated; });
    }
    setEditImages(prev => { const updated = prev.filter((_, i) => i !== index); if (editCoverIndex >= updated.length) setEditCoverIndex(Math.max(0, updated.length - 1)); else if (editCoverIndex === index) setEditCoverIndex(0); else if (editCoverIndex > index) setEditCoverIndex(editCoverIndex - 1); return updated; });
  };
  const handleToggleFaceRecognition = async (album: Album) => { let inviteCode = album.inviteCode; if (!album.faceRecognitionEnabled && !inviteCode) { try { const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${album.id}/invite-code`, { method: 'POST' }); if (res.ok) { const result = await res.json(); inviteCode = result?.data?.inviteCode || generateInviteCode(); } else { inviteCode = generateInviteCode(); } } catch { inviteCode = generateInviteCode(); } } const updated = { ...album, faceRecognitionEnabled: !album.faceRecognitionEnabled, inviteCode }; setAlbums(prev => prev.map(a => a.id === album.id ? updated : a)); setSelectedAlbum(updated); };
  const handleSendToClient = async (album: Album) => { setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, sharedWithClient: true, shared: true } : a)); setShowSendModal(false); try { await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${album.id}/send`, { method: 'POST' }); } catch (err) { console.error('Failed to send album:', err); } };
  const handleDeleteAlbum = async () => { if (!albumToDelete) return; setAlbums(prev => prev.filter(a => a.id !== albumToDelete.id)); setShowDeleteConfirm(false); const id = albumToDelete.id; setAlbumToDelete(null); try { await dashboardAuthFetch(`${apiUrl}/api/remote/customer/galleries/${id}`, { method: 'DELETE' }); } catch (err) { console.error('Failed to delete album:', err); } };

  const handleBrowseKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showAlbumBrowseModal || !viewerAlbum) return;
    if (e.key === 'ArrowLeft' && currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
    else if (e.key === 'ArrowRight' && currentImageIndex < viewerAlbum.images.length - 1) setCurrentImageIndex(currentImageIndex + 1);
    else if (e.key === 'Escape') setShowAlbumBrowseModal(false);
  }, [showAlbumBrowseModal, viewerAlbum, currentImageIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleBrowseKeyDown);
    return () => window.removeEventListener('keydown', handleBrowseKeyDown);
  }, [handleBrowseKeyDown]);

  const filteredEvents = events.filter(e => {
    const matchesFilter = eventFilter === 'all' || e.status === eventFilter;
    const matchesSearch = e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.clientName.toLowerCase().includes(eventSearch.toLowerCase()) || e.eventType.toLowerCase().includes(eventSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const filteredAlbums = albums.filter(a => {
    const matchesFilter = albumFilter === 'all' || (albumFilter === 'shared' ? a.shared : !a.shared);
    const matchesSearch = a.title.toLowerCase().includes(albumSearch.toLowerCase()) || a.clientName.toLowerCase().includes(albumSearch.toLowerCase()) || a.category.toLowerCase().includes(albumSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const completedEvents = events.filter(e => e.status === 'completed');
  const eventCounts = { all: events.length, upcoming: events.filter(e => e.status === 'upcoming').length, ongoing: events.filter(e => e.status === 'ongoing').length, completed: completedEvents.length };

  const viewToggleBtnStyle = (isActive: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', backgroundColor: isActive ? '#F20C8F' : 'transparent', color: isActive ? 'white' : (actualTheme === 'dark' ? '#94A3B8' : '#64748B'), border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 2px 8px rgba(242, 12, 143, 0.4)' : 'none' });
  const filterBtnStyle = (isActive: boolean): React.CSSProperties => ({ padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: isActive ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`, backgroundColor: isActive ? '#F20C8F' : colors.bgCard, color: isActive ? 'white' : colors.textSecondary, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' });
  const cardStyle: React.CSSProperties = { backgroundColor: colors.bgCard, borderRadius: '0.75rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowSm, overflow: 'hidden', transition: 'box-shadow 0.2s' };
  const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modalContent = (maxW: string): React.CSSProperties => ({ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.5rem', width: '92%', maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: colors.shadowLg });
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '0.9rem', boxSizing: 'border-box' as const };
  const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '2px solid #083A85', backgroundColor: '#083A85', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
  const secondaryBtn: React.CSSProperties = { padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textSecondary, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
  const smallActionBtn: React.CSSProperties = { padding: '0.35rem 0.65rem', borderRadius: '0.375rem', border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textSecondary, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s' };

  // === RENDER ===
  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .events-page-grid { grid-template-columns: 1fr 1fr !important; }
          .events-page-stats { grid-template-columns: 1fr 1fr !important; }
          .events-page-header { flex-direction: column !important; gap: 0.75rem !important; }
          .events-page-filters { flex-wrap: wrap !important; }
          .events-page-main { padding: 0.75rem !important; }
        }
        @media (max-width: 480px) {
          .events-page-grid { grid-template-columns: 1fr !important; }
          .events-page-stats { grid-template-columns: 1fr 1fr !important; }
          .events-page-filters { overflow-x: auto !important; flex-wrap: nowrap !important; }
          .events-page-main { padding: 0.5rem !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar userRole="photographer" />
          <div className="events-page-main" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

            {/* Page Header + View Toggle */}
            <header className="events-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Events & Albums</h1>
                <p style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                  {activeTab === 'events'
                    ? 'Manage your assigned events, live streams, and event lifecycle'
                    : 'Browse and manage your created photo albums'}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                backgroundColor: actualTheme === 'dark' ? '#1E293B' : '#E2E8F0',
                padding: '0.375rem', borderRadius: '0.75rem',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <button onClick={() => setActiveTab('events')} style={viewToggleBtnStyle(activeTab === 'events')}>
                  <EventsViewIcon active={activeTab === 'events'} /> Events
                </button>
                <button onClick={() => setActiveTab('albums')} style={viewToggleBtnStyle(activeTab === 'albums')}>
                  <AlbumsViewIcon active={activeTab === 'albums'} /> Albums
                </button>
              </div>
            </header>

            {/* ==================== EVENTS TAB ==================== */}
            {activeTab === 'events' && (
              <>
                {/* Stat Cards */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Total Events', value: eventCounts.all, accent: colors.brandPrimary },
                    { label: 'Upcoming', value: eventCounts.upcoming, accent: '#F59E0B' },
                    { label: 'Ongoing', value: eventCounts.ongoing, accent: '#3B82F6' },
                    { label: 'Completed', value: eventCounts.completed, accent: '#10B981' },
                  ] as const).map(stat => (
                    <div key={stat.label} style={{ backgroundColor: colors.bgCard, borderRadius: '0.5rem', padding: '0.875rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowSm, borderLeft: `4px solid ${stat.accent}` }}>
                      <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>{stat.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Filters + Search */}
                <div className="events-page-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {(['all', 'upcoming', 'ongoing', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setEventFilter(f)} style={filterBtnStyle(eventFilter === f)}>
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>({eventCounts[f]})</span>}
                    </button>
                  ))}
                  <div style={{ marginLeft: 'auto', position: 'relative', minWidth: '200px' }}>
                    <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}><SearchIcon /></div>
                    <input placeholder="Search events..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2.5rem' }} />
                  </div>
                </div>

                {/* Event Cards Grid */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {filteredEvents.map(event => {
                    const badge = getStatusBadge(event.status);
                    const streamCfg = event.hasLiveStream ? streamConfigs[event.id] : null;
                    const isLive = streamCfg?.connectionStatus === 'live';
                    return (
                      <div key={event.id} style={cardStyle}>
                        {/* Cover Image */}
                        <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                          <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {/* Status Badge */}
                          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', backgroundColor: badge.bg, color: badge.color, padding: '0.2rem 0.6rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>{badge.label}</div>
                          {/* Live Stream Badge */}
                          {event.hasLiveStream && (
                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: isLive ? '#DC2626' : (actualTheme === 'dark' ? '#374151' : '#F3F4F6'), color: isLive ? 'white' : colors.textSecondary, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', animation: isLive ? 'pulse 2s infinite' : 'none' }}>
                              <BroadcastIcon /> {isLive ? 'LIVE' : 'Live Stream'}
                            </div>
                          )}
                          {/* Viewer count for live */}
                          {isLive && streamCfg && (
                            <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>{streamCfg.viewerCount.toLocaleString()} viewers</div>
                          )}
                        </div>
                        {/* Card Content */}
                        <div style={{ padding: '0.875rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary, margin: '0 0 0.5rem 0', lineHeight: '1.3' }}>{event.title}</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CalendarIcon /> {formatDate(event.date)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ClockIcon /> {formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><LocationIcon /> {event.location.city}, {event.location.country}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><UserIcon /> {event.clientName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PackageIcon /> {event.packageName}</div>
                          </div>
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button onClick={() => { setSelectedEvent(event); setShowEventDetailModal(true); }} style={{ ...smallActionBtn, backgroundColor: colors.bgTertiary, color: colors.textPrimary }}>
                              <EyeIcon /> Details
                            </button>
                            {event.hasLiveStream && (event.status === 'upcoming' || event.status === 'ongoing') && (
                              <button onClick={() => { setSelectedEvent(event); setShowStreamSetupModal(true); setShowStreamKey(false); }} style={{ ...smallActionBtn, backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', color: 'white' }}>
                                <BroadcastIcon /> Stream Setup
                              </button>
                            )}
                            {event.status === 'completed' && (
                              <button onClick={() => handleOpenCreateAlbum(event.id)} style={{ ...smallActionBtn, backgroundColor: '#10B981', borderColor: '#10B981', color: 'white' }}>
                                <PlusIcon /> Create Album
                              </button>
                            )}
                            {event.hasLiveStream && event.status === 'ongoing' && (
                              <button onClick={() => setMarkCompleteTarget(event)} style={{ ...smallActionBtn, backgroundColor: '#059669', borderColor: '#059669', color: 'white' }}>
                                <CheckCircleIcon /> Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredEvents.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: colors.textTertiary }}>
                    <CalendarIcon /><p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>No events found</p>
                  </div>
                )}
              </>
            )}

            {/* ==================== ALBUMS TAB ==================== */}
            {activeTab === 'albums' && (
              <>
                {/* Stats */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Total Albums', value: albums.length, accent: colors.brandPrimary },
                    { label: 'Shared', value: albums.filter(a => a.shared).length, accent: '#10B981' },
                    { label: 'Total Photos', value: albums.reduce((s, a) => s + a.photoCount, 0), accent: '#F59E0B' },
                    { label: 'Total Views', value: albums.reduce((s, a) => s + a.views, 0), accent: '#8B5CF6' },
                  ] as const).map(stat => (
                    <div key={stat.label} style={{ backgroundColor: colors.bgCard, borderRadius: '0.5rem', padding: '0.875rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowSm, borderLeft: `4px solid ${stat.accent}` }}>
                      <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>{stat.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.textPrimary }}>{stat.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                {/* Filters + Search + Actions */}
                <div className="events-page-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {(['all', 'shared', 'unshared'] as const).map(f => (
                    <button key={f} onClick={() => setAlbumFilter(f)} style={filterBtnStyle(albumFilter === f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                    <button onClick={() => setAlbumViewMode('grid')} style={{ ...smallActionBtn, borderColor: albumViewMode === 'grid' ? colors.brandPrimary : colors.borderPrimary }}><GridIcon active={albumViewMode === 'grid'} /></button>
                    <button onClick={() => setAlbumViewMode('list')} style={{ ...smallActionBtn, borderColor: albumViewMode === 'list' ? colors.brandPrimary : colors.borderPrimary }}><ListIcon active={albumViewMode === 'list'} /></button>
                  </div>
                  <button onClick={() => handleOpenCreateAlbum()} style={{ ...primaryBtn, marginLeft: '0.5rem', padding: '0.4rem 0.875rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PlusIcon /> New Album</button>
                  <div style={{ marginLeft: 'auto', position: 'relative', minWidth: '200px' }}>
                    <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}><SearchIcon /></div>
                    <input placeholder="Search albums..." value={albumSearch} onChange={e => setAlbumSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2.5rem' }} />
                  </div>
                </div>

                {/* Album Cards */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: albumViewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr', gap: '1rem' }}>
                  {filteredAlbums.map(album => (
                    <div key={album.id} style={{ ...cardStyle, display: albumViewMode === 'list' ? 'flex' : 'block' }}>
                      {/* Cover */}
                      <div style={{ position: 'relative', height: albumViewMode === 'list' ? '140px' : '180px', width: albumViewMode === 'list' ? '200px' : '100%', flexShrink: 0, overflow: 'hidden' }}>
                        <img src={album.coverImage} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}>{album.photoCount} photos</div>
                        {album.shared && (
                          <div style={{ position: 'absolute', top: '0.4rem', left: '0.4rem', backgroundColor: '#10B981', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.65rem', fontWeight: 600 }}>Shared</div>
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ padding: '0.875rem', flex: 1 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary, margin: '0 0 0.3rem 0' }}>{album.title}</h3>
                        <div style={{ fontSize: '0.78rem', color: colors.textTertiary, marginBottom: '0.3rem' }}>From: {album.eventTitle}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: colors.textSecondary, marginBottom: '0.3rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><UserIcon /> {album.clientName}</span>
                          <span>{album.category}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: colors.textTertiary, marginBottom: '0.5rem' }}>{formatDate(album.createdAt)}</div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '0.65rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><EyeIcon /> {album.views}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><HeartIcon filled={false} /> {album.likes}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><DownloadIcon /> {album.downloads}</span>
                        </div>
                        {/* Browse Button - Primary action */}
                        <button onClick={() => { setSelectedAlbum(album); setViewerAlbum(album); setCurrentImageIndex(0); setShowAlbumBrowseModal(true); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', width: '100%', padding: '0.45rem', fontSize: '0.78rem', fontWeight: 600, backgroundColor: '#083A85', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '0.35rem' }}><EyeIcon /> Browse Photos</button>
                        {/* Actions Row: Send, Face AI, Edit, Delete */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {album.sharedWithClient ? (
                            <span style={{ ...smallActionBtn, backgroundColor: '#059669', borderColor: '#059669', color: 'white', cursor: 'default', opacity: 0.85 }}><CheckCircleIcon /> Sent</span>
                          ) : (
                            <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} style={{ ...smallActionBtn, backgroundColor: '#083A85', borderColor: '#083A85', color: 'white' }}><SendIcon /> Send</button>
                          )}
                          <button onClick={() => { const updated = !album.inviteCode ? { ...album, inviteCode: generateInviteCode(), faceRecognitionEnabled: true } : { ...album, faceRecognitionEnabled: true }; setAlbums(prev => prev.map(a => a.id === album.id ? updated : a)); setSelectedAlbum(updated); setShowFaceRecognitionModal(true); }} style={{ ...smallActionBtn, backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', color: 'white' }}><FaceRecognitionIcon /> Face AI</button>
                          <button onClick={() => handleOpenEdit(album)} style={{ ...smallActionBtn, backgroundColor: colors.bgTertiary, color: colors.textPrimary }}><EditIcon /> Edit</button>
                          <button onClick={() => { setAlbumToDelete(album); setShowDeleteConfirm(true); }} style={{ ...smallActionBtn, backgroundColor: '#DC2626', borderColor: '#DC2626', color: 'white' }}><TrashIcon /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredAlbums.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: colors.textTertiary }}>
                    <ImageIcon /><p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>No albums found. Create one from a completed event!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div style={modalOverlay} onClick={() => setShowEventDetailModal(false)}>
          <div style={modalContent('600px')} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Event Details</h2>
              <button onClick={() => setShowEventDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><CloseIcon /></button>
            </div>
            <img src={selectedEvent.coverImage} alt={selectedEvent.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {(() => { const b = getStatusBadge(selectedEvent.status); return <span style={{ backgroundColor: b.bg, color: b.color, padding: '0.2rem 0.6rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>{b.label}</span>; })()}
              {selectedEvent.hasLiveStream && <span style={{ backgroundColor: actualTheme === 'dark' ? '#374151' : '#F3F4F6', color: '#8B5CF6', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BroadcastIcon /> Live Stream</span>}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>{selectedEvent.title}</h3>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem', lineHeight: '1.4' }}>{selectedEvent.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: colors.textSecondary }}>
              <div><strong style={{ color: colors.textPrimary }}>Date:</strong> {formatDate(selectedEvent.date)}</div>
              <div><strong style={{ color: colors.textPrimary }}>Time:</strong> {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</div>
              <div><strong style={{ color: colors.textPrimary }}>Location:</strong> {selectedEvent.location.address}, {selectedEvent.location.city}</div>
              <div><strong style={{ color: colors.textPrimary }}>Client:</strong> {selectedEvent.clientName}</div>
              <div><strong style={{ color: colors.textPrimary }}>Package:</strong> {selectedEvent.packageName}</div>
              <div><strong style={{ color: colors.textPrimary }}>Event Type:</strong> {selectedEvent.eventType}</div>
              <div><strong style={{ color: colors.textPrimary }}>Guests:</strong> {selectedEvent.guestCount} / {selectedEvent.maxGuests}</div>
              <div><strong style={{ color: colors.textPrimary }}>Amount:</strong> {formatPrice(selectedEvent.totalAmount)}</div>
            </div>
            {selectedEvent.status === 'completed' && (
              <div style={{ marginTop: '1.25rem' }}>
                <button onClick={() => { setShowEventDetailModal(false); handleOpenCreateAlbum(selectedEvent.id); }} style={{ ...primaryBtn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><PlusIcon /> Create Album from this Event</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stream Setup Modal */}
      {showStreamSetupModal && selectedEvent && selectedEvent.hasLiveStream && (
        <div style={modalOverlay} onClick={() => setShowStreamSetupModal(false)}>
          <div style={modalContent('550px')} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Live Stream Setup</h2>
                <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>{selectedEvent.title}</p>
              </div>
              <button onClick={() => setShowStreamSetupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><CloseIcon /></button>
            </div>
            {(() => {
              const cfg = streamConfigs[selectedEvent.id];
              if (!cfg) return <p style={{ color: colors.textSecondary }}>No stream configuration available.</p>;
              const statusColors: Record<string, string> = { idle: '#6B7280', waiting_for_encoder: '#F59E0B', receiving_signal: '#3B82F6', live: '#10B981' };
              const statusLabels: Record<string, string> = { idle: 'Idle', waiting_for_encoder: 'Waiting for Encoder', receiving_signal: 'Receiving Signal', live: 'Live' };
              const healthColors: Record<string, string> = { good: '#10B981', fair: '#F59E0B', poor: '#DC2626' };
              return (
                <>
                  {/* Connection Status */}
                  <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColors[cfg.connectionStatus], animation: cfg.connectionStatus === 'live' ? 'pulse 2s infinite' : 'none' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>{statusLabels[cfg.connectionStatus]}</span>
                    </div>
                    {cfg.connectionStatus === 'live' && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{cfg.viewerCount.toLocaleString()} viewers</span>}
                  </div>
                  {/* RTMP Config */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Server URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input readOnly value={cfg.serverUrl} style={{ ...inputStyle, flex: 1, fontSize: '0.8rem' }} />
                      <button onClick={() => handleCopyField(cfg.serverUrl, 'serverUrl')} style={smallActionBtn}>{copiedField === 'serverUrl' ? 'Copied!' : <><CopyIcon /> Copy</>}</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Stream Key</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input readOnly value={showStreamKey ? cfg.streamKey : '••••••••••••••••'} style={{ ...inputStyle, flex: 1, fontSize: '0.8rem' }} />
                      <button onClick={() => setShowStreamKey(!showStreamKey)} style={smallActionBtn}>{showStreamKey ? <EyeOffIcon /> : <EyeIcon />}</button>
                      <button onClick={() => handleCopyField(cfg.streamKey, 'streamKey')} style={smallActionBtn}>{copiedField === 'streamKey' ? 'Copied!' : <><CopyIcon /> Copy</>}</button>
                    </div>
                  </div>
                  {/* Stream Health */}
                  {cfg.connectionStatus === 'live' && (
                    <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, marginBottom: '0.5rem' }}>Stream Health</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: colors.textSecondary }}>
                        <span>Health: <strong style={{ color: healthColors[cfg.streamHealth] }}>{cfg.streamHealth.toUpperCase()}</strong></span>
                        <span>Upload: <strong>{cfg.uploadSpeed}</strong></span>
                        <span>Peak: <strong>{cfg.peakViewers.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  )}
                  {/* Encoder Instructions */}
                  <div style={{ backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', border: `1px solid ${actualTheme === 'dark' ? '#2563EB' : '#BFDBFE'}` }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB', marginBottom: '0.35rem' }}>Encoder Setup (OBS / Streamlabs)</div>
                    <ol style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                      <li>Open OBS Studio and go to Settings → Stream</li>
                      <li>Set Service to "Custom" and paste the Server URL above</li>
                      <li>Paste the Stream Key in the Stream Key field</li>
                      <li>Click "Start Streaming" in OBS, then click "Go Live" below</li>
                    </ol>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {cfg.connectionStatus === 'idle' && (
                      <button onClick={() => handleStartStream(selectedEvent.id)} style={{ ...primaryBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}><PlayIcon /> Start Waiting for Encoder</button>
                    )}
                    {cfg.connectionStatus === 'waiting_for_encoder' && (
                      <button onClick={() => handleGoLive(selectedEvent.id)} style={{ ...primaryBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#10B981', borderColor: '#10B981' }}><PlayIcon /> Go Live</button>
                    )}
                    {cfg.connectionStatus === 'live' && (
                      <button onClick={() => handleEndStream(selectedEvent.id)} style={{ ...primaryBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#DC2626', borderColor: '#DC2626' }}><StopIcon /> End Stream</button>
                    )}
                    <button onClick={() => setShowStreamSetupModal(false)} style={secondaryBtn}>Close</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Mark Complete Confirmation Modal */}
      {markCompleteTarget && (
        <div style={modalOverlay} onClick={() => setMarkCompleteTarget(null)}>
          <div style={modalContent('420px')} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, margin: '0 0 0.75rem 0' }}>Mark Event as Complete</h2>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem', lineHeight: '1.4' }}>
              Are you sure the live stream for <strong style={{ color: colors.textPrimary }}>{markCompleteTarget.title}</strong> is complete? This will mark the event as completed.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setMarkCompleteTarget(null)} style={secondaryBtn}>Cancel</button>
              <button onClick={() => handleMarkCompleted(markCompleteTarget.id)} disabled={!!markingCompletedId} style={{ ...primaryBtn, backgroundColor: '#10B981', borderColor: '#10B981', opacity: markingCompletedId ? 0.7 : 1 }}>
                {markingCompletedId ? 'Processing...' : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateAlbumModal && (
        <div style={modalOverlay} onClick={() => setShowCreateAlbumModal(false)}>
          <div style={modalContent('600px')} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Create Album</h2>
              <button onClick={() => setShowCreateAlbumModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><CloseIcon /></button>
            </div>
            {/* Select Event */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Select Completed Event *</label>
              <select value={createAlbumEventId} onChange={e => handleEventSelectForAlbum(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Choose an event...</option>
                {completedEvents.map(e => <option key={e.id} value={e.id}>{e.title} - {formatDate(e.date)}</option>)}
              </select>
            </div>
            {createAlbumEventId && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Album Title *</label>
                  <input value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} style={inputStyle} placeholder="Enter album title" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Category</label>
                    <input value={albumCategory} onChange={e => setAlbumCategory(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Client</label>
                    <input readOnly value={events.find(e => e.id === createAlbumEventId)?.clientName || ''} style={{ ...inputStyle, opacity: 0.7 }} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Description</label>
                  <textarea value={albumDescription} onChange={e => setAlbumDescription(e.target.value)} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
                </div>
                {/* Image Upload */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Upload Photos</label>
                  <div style={{ border: `2px dashed ${colors.borderPrimary}`, borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: colors.bgTertiary }} onClick={() => document.getElementById('album-file-input')?.click()}>
                    <ImageIcon />
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.5rem 0 0 0' }}>Click to upload photos or drag & drop</p>
                    <input id="album-file-input" type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                  </div>
                  {uploadedImagePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {uploadedImagePreviews.map((preview, i) => (
                        <div key={i} onClick={() => setSelectedCoverIndex(i)} style={{ position: 'relative', borderRadius: '0.375rem', overflow: 'hidden', cursor: 'pointer', border: selectedCoverIndex === i ? '3px solid #F20C8F' : `2px solid ${colors.borderPrimary}`, aspectRatio: '1' }}>
                          <img src={preview} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {selectedCoverIndex === i && <div style={{ position: 'absolute', top: '2px', left: '2px', backgroundColor: '#F20C8F', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', fontWeight: 600 }}>Cover</div>}
                          <button onClick={(e) => { e.stopPropagation(); setUploadedImagePreviews(prev => prev.filter((_, idx) => idx !== i)); if (selectedCoverIndex >= uploadedImagePreviews.length - 1) setSelectedCoverIndex(Math.max(0, uploadedImagePreviews.length - 2)); else if (selectedCoverIndex === i) setSelectedCoverIndex(0); else if (selectedCoverIndex > i) setSelectedCoverIndex(selectedCoverIndex - 1); }} style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.85)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreateAlbumModal(false)} style={secondaryBtn}>Cancel</button>
                  <button onClick={handleCreateAlbum} disabled={!albumTitle || !createAlbumEventId || isUploadingAlbum} style={{ ...primaryBtn, opacity: (!albumTitle || !createAlbumEventId || isUploadingAlbum) ? 0.5 : 1 }}>{isUploadingAlbum ? (uploadProgress || 'Uploading...') : 'Create Album'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Album Browse / Image Viewer Modal */}
      {showAlbumBrowseModal && viewerAlbum && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}>
          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={viewerAlbum.images[currentImageIndex]}
              alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
              style={{ maxWidth: 'calc(100% - 8rem)', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
            padding: '1rem 1.5rem 2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {viewerAlbum.coverImage && (
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={viewerAlbum.coverImage} alt={viewerAlbum.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: 0 }}>{viewerAlbum.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{viewerAlbum.clientName} &middot; {currentImageIndex + 1} / {viewerAlbum.images.length}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAlbumBrowseModal(false)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.12)', border: 'none',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Navigation - Left */}
          <button
            onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: currentImageIndex > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: currentImageIndex > 0 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (currentImageIndex > 0) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex > 0 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronLeftIcon />
          </button>

          {/* Navigation - Right */}
          <button
            onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (currentImageIndex < viewerAlbum.images.length - 1) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex < viewerAlbum.images.length - 1 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronRightIcon />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '2.5rem 1.5rem 1.25rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {viewerAlbum.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    position: 'relative', width: '56px', height: '42px', borderRadius: '0.375rem',
                    overflow: 'hidden', border: currentImageIndex === index ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                    opacity: currentImageIndex === index ? 1 : 0.5,
                    transform: currentImageIndex === index ? 'scale(1.1)' : 'scale(1)',
                    background: 'none', padding: 0
                  }}
                  onMouseEnter={(e) => { if (currentImageIndex !== index) e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { if (currentImageIndex !== index) e.currentTarget.style.opacity = '0.5'; }}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Send Album Modal */}
      {showSendModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowSendModal(false)}>
          <div style={modalContent('460px')} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', backgroundColor: '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><SendIcon /></div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Send Album</h2>
                  <p style={{ fontSize: '0.75rem', color: colors.textTertiary, margin: 0 }}>Deliver photos to your client</p>
                </div>
              </div>
              <button onClick={() => setShowSendModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: '0.25rem' }}><CloseIcon /></button>
            </div>

            {/* Album Preview */}
            <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '1.25rem' }}>
              <img src={selectedAlbum.coverImage} alt={selectedAlbum.title} style={{ width: '64px', height: '64px', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedAlbum.title}</div>
                <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginTop: '0.2rem' }}>{selectedAlbum.photoCount} photos &middot; {selectedAlbum.category}</div>
                <div style={{ fontSize: '0.75rem', color: colors.textTertiary, marginTop: '0.15rem' }}>From: {selectedAlbum.eventTitle}</div>
              </div>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.5rem' }}>Recipient</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgTertiary, borderRadius: '0.625rem', padding: '0.875rem 1rem', border: `1px solid ${colors.borderPrimary}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>{selectedAlbum.clientName.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.textPrimary }}>{selectedAlbum.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textTertiary }}>Booked client</div>
                  </div>
                </div>
                {selectedAlbum.sharedWithClient ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: actualTheme === 'dark' ? 'rgba(16,185,129,0.15)' : '#D1FAE5', color: actualTheme === 'dark' ? '#34D399' : '#059669', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    <CheckCircleIcon /> Delivered
                  </div>
                ) : (
                  <button onClick={() => handleSendToClient(selectedAlbum)} style={{ ...primaryBtn, padding: '0.45rem 1.25rem', fontSize: '0.8rem', borderRadius: '2rem' }}>Send Now</button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Face Recognition Modal */}
      {showFaceRecognitionModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowFaceRecognitionModal(false)}>
          <div style={modalContent('480px')} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Face Recognition</h2>
              <button onClick={() => setShowFaceRecognitionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><CloseIcon /></button>
            </div>
            {/* Album Info */}
            <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
              <img src={selectedAlbum.coverImage} alt={selectedAlbum.title} style={{ width: '60px', height: '60px', borderRadius: '0.375rem', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textPrimary }}>{selectedAlbum.title}</div>
                <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginTop: '0.15rem' }}>{selectedAlbum.photoCount} photos &middot; {selectedAlbum.clientName}</div>
                <div style={{ fontSize: '0.75rem', color: colors.textTertiary, marginTop: '0.15rem' }}>From: {selectedAlbum.eventTitle}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem', lineHeight: '1.5' }}>
              Upload this album to the <strong style={{ color: colors.textPrimary }}>Find-My-Photos</strong> page so event attendees can use face recognition to find their photos. Share the invite code below to help them filter results.
            </p>
            {/* Invite Code */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Invite Code</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input readOnly value={selectedAlbum.inviteCode || ''} style={{ ...inputStyle, flex: 1, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center' }} />
                <button onClick={() => handleCopyInviteCode(selectedAlbum.inviteCode!)} style={smallActionBtn}>{copiedInviteCode ? 'Copied!' : <><CopyIcon /> Copy</>}</button>
              </div>
            </div>
            {/* Find-My-Photos Link */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Find-My-Photos Link</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input readOnly value={`https://connekt.rw/find-my-photos?code=${selectedAlbum.inviteCode}`} style={{ ...inputStyle, flex: 1, fontSize: '0.8rem' }} />
                <button onClick={() => handleCopyLink(`https://connekt.rw/find-my-photos?code=${selectedAlbum.inviteCode}`)} style={smallActionBtn}>{copiedLink ? 'Copied!' : <><CopyIcon /> Copy</>}</button>
              </div>
            </div>
            {/* Upload Button */}
            <button onClick={() => { setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, faceRecognitionEnabled: true } : a)); setSelectedAlbum({ ...selectedAlbum, faceRecognitionEnabled: true }); setShowFaceRecognitionModal(false); }} style={{ ...primaryBtn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}>
              <FaceRecognitionIcon /> Upload to Find-My-Photos
            </button>
            {selectedAlbum.faceRecognitionEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: actualTheme === 'dark' ? 'rgba(16,185,129,0.1)' : '#D1FAE5', borderRadius: '0.375rem', fontSize: '0.8rem', color: actualTheme === 'dark' ? '#34D399' : '#059669', fontWeight: 500 }}>
                <CheckCircleIcon /> Album is live on Find-My-Photos
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {showAlbumEditModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowAlbumEditModal(false)}>
          <div style={modalContent('600px')} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Edit Album</h2>
              <button onClick={() => setShowAlbumEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><CloseIcon /></button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Category</label>
                <input value={editCategory} onChange={e => setEditCategory(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Photos</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', opacity: 0.7, cursor: 'default' }}>{editImages.length} image{editImages.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, display: 'block', marginBottom: '0.35rem' }}>Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
            </div>
            {/* Images Section */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary }}>Album Images</label>
                <button onClick={() => document.getElementById('edit-album-file-input')?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#083A85', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}><PlusIcon /> Add Photos</button>
                <input id="edit-album-file-input" type="file" multiple accept="image/*" onChange={handleEditFileAdd} style={{ display: 'none' }} />
              </div>
              {editImages.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto', padding: '0.25rem' }}>
                  {editImages.map((image, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: '0.375rem', overflow: 'hidden', aspectRatio: '1', border: editCoverIndex === i ? '3px solid #F20C8F' : `2px solid ${colors.borderPrimary}`, cursor: 'pointer' }} onClick={() => setEditCoverIndex(i)}>
                      <img src={image} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {editCoverIndex === i && <div style={{ position: 'absolute', top: '2px', left: '2px', backgroundColor: '#F20C8F', color: 'white', fontSize: '0.55rem', padding: '0.1rem 0.25rem', borderRadius: '0.2rem', fontWeight: 700 }}>Cover</div>}
                      <button onClick={(e) => { e.stopPropagation(); handleEditImageRemove(i); }} style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.85)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>&times;</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ border: `2px dashed ${colors.borderPrimary}`, borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', backgroundColor: colors.bgTertiary }}>
                  <p style={{ fontSize: '0.8rem', color: colors.textTertiary, margin: 0 }}>No images. Click &quot;Add Photos&quot; to upload.</p>
                </div>
              )}
              <p style={{ fontSize: '0.7rem', color: colors.textTertiary, margin: '0.35rem 0 0 0' }}>Click an image to set it as cover. Click &times; to remove.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAlbumEditModal(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editImages.length === 0} style={{ ...primaryBtn, opacity: editImages.length === 0 ? 0.5 : 1 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && albumToDelete && (
        <div style={modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={modalContent('400px')} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, margin: '0 0 0.75rem 0' }}>Delete Album</h2>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem' }}>
              Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>{albumToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleDeleteAlbum} style={{ ...primaryBtn, backgroundColor: '#DC2626', borderColor: '#DC2626' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotographerEventsPage;
