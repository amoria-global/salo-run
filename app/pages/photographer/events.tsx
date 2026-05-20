"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/sidebar';
import { platformAlert } from '../../components/PlatformAlert';
import EventConfirmModal from '../../components/EventConfirmModal';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';
import StreamPreview from '../../components/StreamPreview';
import AlbumTypeSelector, { type AlbumType } from '../../components/AlbumTypeSelector';
import PaidAlbumForm, { MIN_PAID_ALBUM_PRICE_RWF, isPaidAlbumPriceInvalid } from '../../components/PaidAlbumForm';
import { useHighlightOnMount } from '@/lib/useHighlightOnMount';
import FreeAlbumForm from '../../components/FreeAlbumForm';
import SendFreeInvitationModal from '../../components/SendFreeInvitationModal';

const CURRENCY_FLAG_MAP: Record<string, string> = {
  USD: 'us', RWF: 'rw', EUR: 'eu', KES: 'ke', UGX: 'ug', TZS: 'tz', GBP: 'gb',
};

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

type EventStatus = 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

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
  isPublished: boolean;
  guestCount: number;
  maxGuests: number;
  bookingId: string;
  bookingStatus?: string;
  escrowPercentage?: number;
  totalAmount: number;
  createdAt: string;
}

interface StreamConfig {
  eventId: string;
  whipUrl?: string;
  whepUrl?: string;
  connectionStatus: 'disconnected' | 'connected' | 'paused' | 'ended';
  streamHealth: 'good' | 'fair' | 'poor';
  uploadSpeed: string;
  viewerCount: number;
  peakViewers: number;
  inviteToken?: string;
  streamType?: 'entry_fee' | 'invite_token';
  error?: string;
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
  eventDate: string;
  clientImage: string;
  sentAt: string;
  expiresAt: string;
  albumType?: 'event' | 'standalone';
  isStandalone?: boolean;
  location?: string;
  albumDate?: string;
}


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
const PhotobooksViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// MAIN COMPONENT
// ============================================

const PhotographerEventsPage = () => {
  const { colors, actualTheme } = useTheme();
  const { user, token } = useDashboardAuth();
  const { formatPrice, currencies } = useCurrency();
  const apiUrl = getApiUrl();

  const [activeTab, setActiveTab] = useState<'events' | 'albums' | 'photobooks'>(() => {
    if (typeof window !== 'undefined') {
      // Query param takes priority (e.g. from notification click)
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get('tab');
      if (qTab === 'albums' || qTab === 'photobooks' || qTab === 'events') {
        window.history.replaceState({}, '', window.location.pathname);
        return qTab;
      }
      // Otherwise restore from localStorage
      const saved = localStorage.getItem('connekt_events_tab');
      if (saved === 'events' || saved === 'albums' || saved === 'photobooks') return saved;
    }
    return 'events';
  });
  useEffect(() => {
    localStorage.setItem('connekt_events_tab', activeTab);
  }, [activeTab]);
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const highlightId = useHighlightOnMount();
  const highlightCardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (highlightId && highlightCardRef.current) {
      highlightCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, events.length]);
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AssignedEvent | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showStreamPreview, setShowStreamPreview] = useState(false);
  const [showUnpublishedModal, setShowUnpublishedModal] = useState(false);
  const [streamConfigs, setStreamConfigs] = useState<Record<string, StreamConfig>>({});
  const [copiedField, setCopiedField] = useState('');
  const [markCompleteTarget, setMarkCompleteTarget] = useState<AssignedEvent | null>(null);
  const [markingCompletedId, setMarkingCompletedId] = useState<string | null>(null);
  const [bookingActionTarget, setBookingActionTarget] = useState<AssignedEvent | null>(null);
  const [bookingActionType, setBookingActionType] = useState<'accept' | 'decline' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [bookingActionLoading, setBookingActionLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumFilter, setAlbumFilter] = useState<'all' | 'shared' | 'unshared'>('all');
  const [albumSearch, setAlbumSearch] = useState('');
  const [albumViewMode, setAlbumViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [createAlbumMode, setCreateAlbumMode] = useState<'event' | 'standalone'>('event');
  const [createAlbumEventId, setCreateAlbumEventId] = useState('');
  const [standaloneLocation, setStandaloneLocation] = useState('');
  const [standaloneDate, setStandaloneDate] = useState('');
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
  const [faceAIPrice, setFaceAIPrice] = useState('');
  const [faceAICurrency, setFaceAICurrency] = useState('');
  const [showFaceAICurrencyDropdown, setShowFaceAICurrencyDropdown] = useState(false);
  const faceAICurrencyRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [showAlbumSuccessModal, setShowAlbumSuccessModal] = useState(false);
  const [albumSuccessMessage, setAlbumSuccessMessage] = useState({ title: '', description: '' });
  // Soft delete (dismiss) state
  const [showDismissEventModal, setShowDismissEventModal] = useState(false);
  const [eventToDismiss, setEventToDismiss] = useState<AssignedEvent | null>(null);
  const [showDismissAlbumModal, setShowDismissAlbumModal] = useState(false);
  const [albumToDismiss, setAlbumToDismiss] = useState<Album | null>(null);
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
  // PAID/FREE standalone album states
  const [standaloneAlbumType, setStandaloneAlbumType] = useState<AlbumType>('PAID');
  const [paidAlbumPrice, setPaidAlbumPrice] = useState('');
  const [paidAlbumCurrencyId, setPaidAlbumCurrencyId] = useState('');
  const paidAlbumCurrencyCode = currencies.find(c => c.code === paidAlbumCurrencyId || (c.id || c.code) === paidAlbumCurrencyId)?.code || '';
  const paidAlbumPriceInvalid = isPaidAlbumPriceInvalid(paidAlbumPrice, paidAlbumCurrencyCode);
  const [freeAlbumEmail, setFreeAlbumEmail] = useState('');
  // Optional free-album download cap + price per extra image (blank = all free).
  // freeExtraCurrencyId required by the backend when freeExtraPrice > 0 so
  // the client cap+pay flow on knockout knows what to charge in. Defaults to
  // whatever was last picked for the paid-album form so the photographer
  // doesn't have to re-select on every album.
  const [freeMaxDownloads, setFreeMaxDownloads] = useState('');
  const [freeExtraPrice, setFreeExtraPrice] = useState('');
  const [freeExtraCurrencyId, setFreeExtraCurrencyId] = useState('');
  const [showSendFreeInvitationModal, setShowSendFreeInvitationModal] = useState(false);
  const [freeAlbumToSend, setFreeAlbumToSend] = useState<{ albumId: string; title: string; email: string; accessCode: string } | null>(null);
  const [albumSuccessModal, setAlbumSuccessModal] = useState<{ type: 'paid' | 'free'; title: string; inviteCode?: string; email?: string; accessCode?: string; photoCount: number } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [mediaIdMap, setMediaIdMap] = useState<Record<string, string>>({});

  // Photobooks state
  interface Photobook {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    images: string[];
    mediaIds?: string[];
    layout: string;
    createdAt: string;
    sentAt: string;
    senderName: string;
    status?: string;
    freePhotosLimit?: number;
    extraPhotosCount?: number;
    extraPhotosAmount?: number;
    photographerName?: string;
    resubmittedAt?: string;
  }
  const [receivedPhotobooks, setReceivedPhotobooks] = useState<Photobook[]>([]);
  const [photobookSearch, setPhotobookSearch] = useState('');
  const [selectedPhotobook, setSelectedPhotobook] = useState<Photobook | null>(null);
  // Phase 1: Grid browse with select mode
  const [showPhotobookBrowse, setShowPhotobookBrowse] = useState(false);
  const [photobookSelectedImages, setPhotobookSelectedImages] = useState<string[]>([]);
  const [isPhotobookSelectMode, setIsPhotobookSelectMode] = useState(false);
  // Phase 2: Full-screen single image viewer
  const [showPhotobookImageViewer, setShowPhotobookImageViewer] = useState(false);
  const [photobookCurrentImageIndex, setPhotobookCurrentImageIndex] = useState(0);
  const [showDeletePhotobookModal, setShowDeletePhotobookModal] = useState(false);
  const [photobookToDelete, setPhotobookToDelete] = useState<Photobook | null>(null);
  const [photobookToResubmit, setPhotobookToResubmit] = useState<Photobook | null>(null);
  const [isResubmittingPhotobook, setIsResubmittingPhotobook] = useState(false);

  const handleDeletePhotobook = async () => {
    if (!photobookToDelete) return;
    const id = photobookToDelete.id;
    setReceivedPhotobooks(prev => prev.filter(pb => pb.id !== id));
    setShowDeletePhotobookModal(false);
    setPhotobookToDelete(null);
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/photobooks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete photobook:', err);
    }
  };

  const handleResubmitPhotobook = async (photobook: Photobook) => {
    if (!photobook) return;
    setIsResubmittingPhotobook(true);
    setReceivedPhotobooks(prev => prev.map(pb =>
      pb.id === photobook.id ? { ...pb, status: 'RESUBMITTED', resubmittedAt: new Date().toISOString() } : pb
    ));
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/photobooks/${photobook.id}/resubmit`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to resubmit photobook:', err);
    } finally {
      setIsResubmittingPhotobook(false);
      setPhotobookToResubmit(null);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(url, '_blank');
    }
  };

  const downloadAllImages = async (photobook: Photobook) => {
    for (let i = 0; i < photobook.images.length; i++) {
      await downloadImage(photobook.images[i], `${photobook.name.replace(/\s+/g, '_')}_${i + 1}.jpg`);
    }
  };

  const openPhotobookBrowse = (photobook: Photobook) => {
    setSelectedPhotobook(photobook);
    setPhotobookSelectedImages([]);
    setIsPhotobookSelectMode(false);
    setShowPhotobookBrowse(true);
  };

  const closePhotobookBrowse = () => {
    setShowPhotobookBrowse(false);
    setSelectedPhotobook(null);
    setPhotobookSelectedImages([]);
    setIsPhotobookSelectMode(false);
  };

  const openPhotobookImageViewer = (photobook: Photobook, startIndex: number = 0) => {
    setSelectedPhotobook(photobook);
    setPhotobookCurrentImageIndex(startIndex);
    setShowPhotobookImageViewer(true);
    setShowPhotobookBrowse(false);
  };

  const closePhotobookImageViewer = () => {
    setShowPhotobookImageViewer(false);
    if (selectedPhotobook) {
      setShowPhotobookBrowse(true);
    }
    setPhotobookCurrentImageIndex(0);
  };

  const handlePhotobookBulkDownload = async () => {
    if (selectedPhotobook && photobookSelectedImages.length > 0) {
      const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
      for (let i = 0; i < photobookSelectedImages.length; i++) {
        const image = photobookSelectedImages[i];
        const imageIndex = selectedPhotobook.images.indexOf(image);
        const filename = `${bookName}_${imageIndex + 1}.jpg`;
        await downloadImage(image, filename);
        if (i < photobookSelectedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  const normalizeImg = (url: string | undefined | null): string | undefined => {
    if (!url || url === 'null' || url.endsWith('/null')) return undefined;
    let u = url;
    // If it's a bare filename (no slashes, no protocol), construct full URL
    if (!u.includes('/') && !u.startsWith('http')) {
      u = `${getApiUrl()}/uploads/profile/photos/${u}`;
    }
    return normalizeImageUrl(u);
  };

  // Fetch events from API
  useEffect(() => {
    if (!user?.id) return;
    const loadEvents = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events?page=0&size=100`);
        if (res.ok) {
          const result = await res.json();
          const data = Array.isArray(result?.data) ? result.data : result?.data?.content || [];
          if (data.length > 0) {
            const mapped: AssignedEvent[] = data.map((e: any) => ({
              id: e.id,
              title: e.title || '',
              description: e.description || '',
              eventType: (typeof e.eventType === 'object' && e.eventType !== null ? (e.eventType as Record<string, unknown>).name as string : e.eventType)
                || (typeof e.eventCategory === 'object' && e.eventCategory !== null ? (e.eventCategory as Record<string, unknown>).name as string : e.eventCategory)
                || (typeof e.category === 'object' && e.category !== null ? (e.category as Record<string, unknown>).name as string : e.category)
                || '',
              category: (typeof e.eventCategory === 'object' && e.eventCategory !== null ? (e.eventCategory as Record<string, unknown>).name as string : e.eventCategory)
                || (typeof e.category === 'object' && e.category !== null ? (e.category as Record<string, unknown>).name as string : e.category)
                || (typeof e.eventType === 'object' && e.eventType !== null ? (e.eventType as Record<string, unknown>).name as string : e.eventType)
                || '',
              date: e.date || '',
              startTime: e.startTime || '',
              endTime: e.endTime || '',
              duration: '',
              location: e.location || { address: '', city: '', country: '' },
              coverImage: normalizeImg(e.coverImage || e.bannerImage) || '',
              status: (() => {
                switch ((e.eventStatus || e.status || '')?.toUpperCase()) {
                  case 'PENDING': case 'PROPOSED': case 'ASSIGNED': return 'pending';
                  case 'UPCOMING': case 'PUBLISHED': return 'upcoming';
                  case 'ONGOING': case 'IN_PROGRESS': return 'ongoing';
                  case 'COMPLETED': case 'DONE': return 'completed';
                  case 'CANCELLED': case 'CANCELED': return 'cancelled';
                  default: return 'upcoming';
                }
              })() as EventStatus,
              clientName: e.clientName || '',
              clientImage: normalizeImg(e.clientImage) || '',
              clientEmail: e.clientEmail || '',
              organizerName: e.organizerName || '',
              packageName: e.packageName || '',
              packageId: e.packageId || '',
              hasLiveStream: e.hasLiveStream || false,
              isPublished: e.isPublished === true || e.eventStatus === 'PUBLISHED' || e.isEventPublished === true || false,
              guestCount: e.guestCount || 0,
              maxGuests: e.maxGuests || 0,
              bookingId: e.bookingId || e.id,
              bookingStatus: e.bookingStatus || '',
              escrowPercentage: e.escrowPercentage || 50,
              totalAmount: e.totalAmount || 0,
              createdAt: e.createdAt || '',
            }));
            // Enrich isPublished from public events (photographer DTO may omit it)
            try {
              const pubRes = await fetch(`${apiUrl}/api/remote/public/events/list?size=100`);
              if (pubRes.ok) {
                const pubResult = await pubRes.json();
                const pubEvents = pubResult?.data?.content || pubResult?.data || [];
                const publishedIds = new Set(pubEvents.filter((pe: any) => pe.isPublished).map((pe: any) => pe.id));
                mapped.forEach(ev => { if (publishedIds.has(ev.id)) ev.isPublished = true; });
              }
            } catch { /* ignore */ }
            // Newest-created first. ISO timestamps include milliseconds so ties
            // inside the same second break naturally by ms precision.
            mapped.sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            });
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
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums`);
        const result = await res.json();
        if (res.ok) {
          const data = Array.isArray(result?.data) ? result.data : result?.data?.content || [];
          if (data.length > 0) {
            // Build URL → image ID map for deletion support
            const idMap: Record<string, string> = {};
            data.forEach((a: any) => {
              (a.images || []).forEach((img: any) => {
                if (typeof img === 'object' && img?.id) {
                  const url = normalizeImg(img.fileUrl || img.url || '');
                  if (url) idMap[url] = img.id;
                }
              });
            });
            setMediaIdMap(prev => ({ ...prev, ...idMap }));

            const mapped: Album[] = data.map((a: any) => ({
              id: a.id,
              title: a.title || '',
              description: a.description || '',
              category: a.category || '',
              eventId: a.eventId || '',
              eventTitle: a.eventTitle || '',
              clientId: a.clientId || '',
              clientName: a.clientName || '',
              coverImage: normalizeImg(a.coverImage || a.thumbnail) || '',
              images: (a.images || []).map((img: any) => normalizeImg(typeof img === 'string' ? img : img?.fileUrl || img?.url || '') || '').filter(Boolean),
              photoCount: a.photoCount || a.imageCount || 0,
              views: a.views || 0,
              likes: a.likes || 0,
              downloads: a.downloads || 0,
              shared: a.shared || a.sent || false,
              sharedWithClient: a.sharedWithClient || a.sent || false,
              faceRecognitionEnabled: a.faceRecognitionEnabled || false,
              inviteCode: a.inviteCode || null,
              createdAt: a.createdAt || '',
              eventDate: a.eventDate || a.date || '',
              clientImage: normalizeImg(a.clientImage) || '',
              sentAt: a.sentAt || a.deliveredAt || '',
              expiresAt: a.expiresAt || '',
              albumType: a.albumType || (a.isStandalone ? 'standalone' : 'event'),
              isStandalone: a.isStandalone || a.albumType === 'standalone' || false,
              location: a.location || '',
              albumDate: a.albumDate || '',
            }));
            // Newest-created first. Ties break by ms inside the ISO timestamp.
            mapped.sort((a: Album, b: Album) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            });
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

  // Fetch received photobooks
  useEffect(() => {
    if (!user?.id) return;
    const loadPhotobooks = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/photobooks`);
        if (res.ok) {
          const result = await res.json();
          const items = result?.data?.content || result?.data || [];
          if (Array.isArray(items)) {
            setReceivedPhotobooks(items.map((pb: any) => {
              const mediaItems = pb.mediaItems || pb.images || [];
              return {
                id: pb.id || '',
                name: pb.name || pb.title || '',
                description: pb.description || '',
                thumbnail: normalizeImg(pb.coverImage || pb.thumbnail) || '',
                images: mediaItems.map((img: any) => typeof img === 'string' ? normalizeImg(img) || '' : normalizeImg(img?.fileUrl || img?.url || '') || '').filter(Boolean),
                mediaIds: mediaItems.map((img: any) => typeof img === 'object' ? img?.id || '' : '').filter(Boolean),
                layout: pb.layout || '',
                createdAt: pb.createdAt || '',
                sentAt: pb.sentAt || '',
                senderName: pb.senderName || pb.clientName || pb.coordinatorName || '',
                status: pb.status || 'SENT_TO_PHOTOGRAPHER',
                freePhotosLimit: pb.freePhotosLimit,
                extraPhotosCount: pb.extraPhotosCount || 0,
                extraPhotosAmount: pb.extraPhotosAmount || 0,
                resubmittedAt: pb.resubmittedAt || '',
              };
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch photobooks:', err);
      }
    };
    loadPhotobooks();
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
            if (result?.data) {
              const cfg = result.data;
              const connStatus: string = cfg.connectionStatus || 'disconnected';
              // Also fetch public event for playbackUrl and streamType
              let hlsUrl = '';
              let streamType = '';
              try {
                const pubRes = await fetch(`${apiUrl}/api/remote/public/events/${event.id}`);
                if (pubRes.ok) {
                  const pubData = await pubRes.json();
                  hlsUrl = pubData.data?.hlsManifestUrl || '';
                  streamType = pubData.data?.streamType || '';
                  // Construct HLS URL from liveInputId if hlsManifestUrl is missing
                  if (!hlsUrl && pubData.data?.liveInputId) {
                    hlsUrl = `https://customer-ngk2huwatflljurq.cloudflarestream.com/${pubData.data.liveInputId}/manifest/video.m3u8`;
                  }
                }
              } catch { /* ignore */ }
              configs[event.id] = {
                ...cfg,
                connectionStatus: connStatus as StreamConfig['connectionStatus'],
                playbackUrl: hlsUrl || cfg.hlsManifestUrl || '',
                streamType: (streamType || '') as StreamConfig['streamType'],
              };
            }
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

  // Close face AI currency dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (faceAICurrencyRef.current && !faceAICurrencyRef.current.contains(e.target as Node)) {
        setShowFaceAICurrencyDropdown(false);
      }
    };
    if (showFaceAICurrencyDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFaceAICurrencyDropdown]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (time: string) => { const [h, m] = time.split(':'); const hour = parseInt(h); return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`; };

  const getStatusBadge = (status: EventStatus) => {
    const map: Record<EventStatus, { bg: string; color: string; label: string }> = {
      pending: { bg: actualTheme === 'dark' ? '#312E81' : '#EDE9FE', color: actualTheme === 'dark' ? '#A78BFA' : '#7C3AED', label: 'Pending Approval' },
      upcoming: { bg: actualTheme === 'dark' ? '#78350F' : '#c29c04', color: actualTheme === 'dark' ? '#FBBF24' : '#FFFFFF', label: 'Upcoming' },
      ongoing: { bg: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE', color: actualTheme === 'dark' ? '#60A5FA' : '#2563EB', label: 'Ongoing' },
      completed: { bg: actualTheme === 'dark' ? '#064E3B' : '#D1FAE5', color: actualTheme === 'dark' ? '#34D399' : '#059669', label: 'Completed' },
      cancelled: { bg: actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2', color: actualTheme === 'dark' ? '#F87171' : '#DC2626', label: 'Cancelled' },
    };
    return map[status];
  };

  // Opens the Face AI modal, generating the invite code from the API if one doesn't exist yet
  const handleOpenFaceAI = async (album: Album) => {
    let updated = album;
    if (!album.inviteCode) {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${album.id}/invite-code`, { method: 'POST' });
        if (res.ok) {
          const result = await res.json();
          const code = result?.data?.inviteCode || result?.data?.code || result?.data;
          if (code && typeof code === 'string') {
            updated = { ...album, inviteCode: code, faceRecognitionEnabled: album.faceRecognitionEnabled };
          }
        }
      } catch (err) {
        console.error('Failed to generate invite code:', err);
      }
      if (updated.inviteCode) {
        setAlbums(prev => prev.map(a => a.id === album.id ? updated : a));
      }
    }
    setSelectedAlbum(updated);
    setShowFaceRecognitionModal(true);
    setFaceAIPrice('');
    setFaceAICurrency('');
    setShowFaceAICurrencyDropdown(false);
  };

  const handleCopyField = (text: string, field: string) => { navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(''), 2000); };
  const handleCopyLink = (text: string) => { navigator.clipboard.writeText(text); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
  const handleCopyInviteCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedInviteCode(true); setTimeout(() => setCopiedInviteCode(false), 2000); };

  const handleStartStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/start`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to start stream. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: msg } }));
        return;
      }
      const startData = await res.json().catch(() => ({}));
      const sData = startData.data || startData;
      const whipUrlVal = sData.whipUrl || '';
      const whepUrlVal = sData.whepUrl || '';
      const inviteToken = sData.inviteToken || '';
      const connStatus = sData.connectionStatus || 'disconnected';

      if (whipUrlVal) {
        setStreamConfigs(prev => ({
          ...prev,
          [eventId]: {
            ...prev[eventId],
            eventId,
            whipUrl: whipUrlVal,
            whepUrl: whepUrlVal,
            connectionStatus: connStatus as StreamConfig['connectionStatus'],
            streamHealth: 'unknown' as StreamConfig['streamHealth'],
            uploadSpeed: '0 Mbps',
            viewerCount: 0,
            peakViewers: 0,
            inviteToken,
          }
        }));
      } else {
        // Fallback: fetch from /stream/config
        const configRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          const cfg = configData.data || {};
          setStreamConfigs(prev => ({
            ...prev,
            [eventId]: {
              ...prev[eventId],
              eventId,
              whipUrl: cfg.whipUrl || '',
              whepUrl: cfg.whepUrl || '',
              connectionStatus: (cfg.connectionStatus || 'disconnected') as StreamConfig['connectionStatus'],
              streamHealth: cfg.streamHealth || 'unknown',
              uploadSpeed: cfg.uploadSpeed || '0 Mbps',
              viewerCount: cfg.viewerCount || 0,
              peakViewers: cfg.peakViewers || 0,
              inviteToken: cfg.inviteToken || '',
            }
          }));
        }
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: 'Failed to start stream. Please try again.' } }));
    }
  };

  const handleResumeStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'connected', error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/resume`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to go live. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: msg } }));
      } else {
        const data = await res.json().catch(() => ({}));
        const rData = data.data || data;
        if (rData.inviteToken) {
          setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], inviteToken: rData.inviteToken } }));
        }
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'ongoing' as EventStatus } : e));
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'disconnected', error: 'Failed to go live. Please try again.' } }));
    }
  };

  const handlePauseStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/pause`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to pause stream. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: msg } }));
      } else {
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'paused' } }));
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: 'Failed to pause stream. Please try again.' } }));
    }
  };

  const handleEndStream = async (eventId: string) => {
    setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: undefined } }));
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/stop`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || 'Failed to end stream. Please try again.';
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: msg } }));
      } else {
        // Stream permanently ended — credentials cleared by backend
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], connectionStatus: 'ended', serverUrl: undefined, streamKey: undefined } }));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' as EventStatus } : e));
      }
    } catch (err) {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: 'Failed to end stream. Please try again.' } }));
    }
  };

  const handleResetStream = async (eventId: string) => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const sData = data.data || data;
        setStreamConfigs(prev => ({
          ...prev,
          [eventId]: {
            ...prev[eventId],
            eventId,
            whipUrl: sData.whipUrl || '',
            whepUrl: sData.whepUrl || '',
            connectionStatus: 'disconnected',
            streamHealth: 'unknown' as StreamConfig['streamHealth'],
            uploadSpeed: '0 Mbps',
            viewerCount: 0,
            peakViewers: 0,
            error: undefined,
          }
        }));
      } else {
        const err = await res.json().catch(() => ({}));
        setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: err.message || 'Failed to reset stream.' } }));
      }
    } catch {
      setStreamConfigs(prev => ({ ...prev, [eventId]: { ...prev[eventId], error: 'Failed to reset stream. Please try again.' } }));
    }
  };

  // Poll stream config every 5s when stream preview or setup modal is open
  useEffect(() => {
    if (!selectedEvent) return;
    if (!showStreamPreview) return;
    const eventId = selectedEvent.id;
    const poll = async () => {
      try {
        // Fetch stream config for RTMP credentials + connection status
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/stream/config`);
        if (res.ok) {
          const data = await res.json();
          const cfg = data.data;
          if (cfg) {
            const connStatus: string = cfg.connectionStatus || 'disconnected';
            // Fetch public event for whepUrl and streamType
            let pubStreamType = '';
            let pubWhepUrl = '';
            try {
              const pubRes = await fetch(`${apiUrl}/api/remote/public/events/${eventId}`);
              if (pubRes.ok) {
                const pubData = await pubRes.json();
                pubStreamType = pubData.data?.streamType || '';
                pubWhepUrl = pubData.data?.whepUrl || '';
              }
            } catch { /* ignore */ }
            setStreamConfigs(prev => ({
              ...prev,
              [eventId]: {
                ...prev[eventId],
                eventId,
                whipUrl: cfg.whipUrl || prev[eventId]?.whipUrl || '',
                whepUrl: cfg.whepUrl || pubWhepUrl || prev[eventId]?.whepUrl || '',
                connectionStatus: connStatus as StreamConfig['connectionStatus'],
                streamHealth: cfg.streamHealth || 'unknown',
                uploadSpeed: cfg.uploadSpeed || '0 Mbps',
                viewerCount: cfg.viewerCount || 0,
                peakViewers: cfg.peakViewers || 0,
                inviteToken: cfg.inviteToken || prev[eventId]?.inviteToken || '',
                streamType: (pubStreamType || prev[eventId]?.streamType || '') as StreamConfig['streamType'],
              }
            }));
          }
        }
      } catch { /* ignore polling errors */ }
    };
    poll(); // Run immediately
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent, showStreamPreview, apiUrl]);

  const handleMarkCompleted = async (eventId: string) => {
    setMarkingCompletedId(eventId);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/mark-completed`, { method: 'POST' });
      if (res.ok) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' as EventStatus } : e));
      } else {
        const data = await res.json().catch(() => ({}));
        platformAlert(data.message || 'Failed to mark event as completed. Please try again.');
      }
    } catch (err) {
      platformAlert('Failed to mark event as completed. Please try again.');
    } finally {
      setMarkingCompletedId(null);
      setMarkCompleteTarget(null);
    }
  };

  const openBookingAction = (event: AssignedEvent, action: 'accept' | 'decline') => {
    setBookingActionTarget(event);
    setBookingActionType(action);
    setDeclineReason('');
    setShowEventDetailModal(false);
  };

  const closeBookingAction = () => {
    setBookingActionTarget(null);
    setBookingActionType(null);
    setDeclineReason('');
    setBookingActionLoading(false);
  };

  const handleConfirmBookingAction = async () => {
    if (!bookingActionTarget || !bookingActionType) return;
    setBookingActionLoading(true);
    try {
      const endpoint = bookingActionType === 'accept' ? 'accept' : 'decline';
      const body = bookingActionType === 'decline' && declineReason
        ? JSON.stringify({ reason: declineReason })
        : undefined;
      const headers: Record<string, string> = {};
      if (body) headers['Content-Type'] = 'application/json';
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/photographer/events/${bookingActionTarget.id}/${endpoint}`,
        { method: 'POST', body, headers }
      );
      if (res.ok) {
        if (bookingActionType === 'accept') {
          setEvents(prev => prev.map(e => e.id === bookingActionTarget.id
            ? { ...e, bookingStatus: 'ACCEPTED' }
            : e
          ));
        } else {
          setEvents(prev => prev.filter(e => e.id !== bookingActionTarget.id));
        }
        closeBookingAction();
      } else {
        const errorText = await res.text().catch(() => '');
        platformAlert(`Failed to ${bookingActionType} booking: ${res.status} ${errorText}`);
        setBookingActionLoading(false);
      }
    } catch (err) {
      console.error(`Error ${bookingActionType}ing booking:`, err);
      platformAlert(`Failed to ${bookingActionType} booking. Please try again.`);
      setBookingActionLoading(false);
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

  const uploadImageToAlbum = async (albumId: string, file: File): Promise<{ id: string; url: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${albumId}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const img = data.data || data;
        return { id: img.id || '', url: img.url || img.fileUrl || img.imageUrl || img.mediaUrl || '' };
      }
      console.error('Failed to upload album image:', res.status, data);
      return null;
    } catch (err) {
      console.error('Error uploading album image:', err);
      return null;
    }
  };

  const fetchEventMedia = async (eventId: string): Promise<{ id: string; url: string }[]> => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/media`);
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
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${eventId}/media/${mediaId}`, { method: 'DELETE' });
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

  // Check if an event already has an album (sent albums block creation permanently)
  const eventHasAlbum = (eventId: string): { exists: boolean; sent: boolean } => {
    const album = albums.find(a => a.eventId === eventId);
    if (!album) return { exists: false, sent: false };
    return { exists: true, sent: album.shared || album.sharedWithClient };
  };

  const canCreateAlbumForEvent = (eventId: string): boolean => {
    const { exists, sent } = eventHasAlbum(eventId);
    if (!exists) return true;    // no album yet → can create
    if (sent) return false;       // album sent → permanently blocked
    return false;                 // album exists unsent → still blocked (must delete first)
  };

  // 7-day edit window for sent albums; unsent albums can always be edited
  const EDIT_WINDOW_DAYS = getPlatformConfig().photographer.albumEditWindowDays;
  // Resolve the date the album was sent
  const getAlbumSentMs = (album: Album): number | null => {
    if (album.sentAt) return new Date(album.sentAt).getTime();
    if (album.expiresAt) return new Date(album.expiresAt).getTime() - 365 * 24 * 60 * 60 * 1000;
    // Fallback: use createdAt (album is typically sent shortly after creation)
    if (album.createdAt) return new Date(album.createdAt).getTime();
    return null;
  };

  const canEditAlbum = (album: Album): boolean => {
    if (!album.shared && !album.sharedWithClient) return true; // not sent → always editable
    const sentMs = getAlbumSentMs(album);
    if (!sentMs || isNaN(sentMs)) return true; // no date info → allow editing (don't block without reason)
    const daysSinceSent = (Date.now() - sentMs) / (24 * 60 * 60 * 1000);
    return daysSinceSent <= EDIT_WINDOW_DAYS;
  };

  const getEditDaysRemaining = (album: Album): number | null => {
    if (!album.shared && !album.sharedWithClient) return null; // not sent
    const sentMs = getAlbumSentMs(album);
    if (!sentMs || isNaN(sentMs)) return EDIT_WINDOW_DAYS;
    return Math.max(0, Math.ceil(EDIT_WINDOW_DAYS - (Date.now() - sentMs) / (24 * 60 * 60 * 1000)));
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
    setCreateAlbumMode('event'); setStandaloneLocation(''); setStandaloneDate('');
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
    const isStandalone = createAlbumMode === 'standalone';
    const event = isStandalone ? null : events.find(e => e.id === createAlbumEventId);
    if (!isStandalone && (!event || !albumTitle)) return;
    if (isStandalone && !albumTitle) return;

    // Validate PAID/FREE album fields
    if (isStandalone && standaloneAlbumType === 'PAID') {
      if (!paidAlbumPrice || !paidAlbumCurrencyId) {
        platformAlert('Please fill in price and currency for PAID album');
        return;
      }
      if (paidAlbumPriceInvalid) {
        platformAlert(`Minimum price for a PAID album in RWF is ${MIN_PAID_ALBUM_PRICE_RWF}. Mobile Money collections below ${MIN_PAID_ALBUM_PRICE_RWF} RWF are rejected by the payment provider.`);
        return;
      }
    }
    if (isStandalone && standaloneAlbumType === 'FREE' && !freeAlbumEmail) {
      platformAlert('Please enter recipient email for FREE album');
      return;
    }

    setIsUploadingAlbum(true);

    // 1. Create album on backend first
    let backendAlbumId = '';
    let backendInviteCode = '';
    let backendAccessCode = '';
    try {
      setUploadProgress('Creating album...');
      const formData = new FormData();
      formData.append('title', albumTitle);
      if (albumDescription) formData.append('description', albumDescription);
      if (albumCategory) formData.append('category', albumCategory);

      // Determine endpoint based on album mode and type
      let endpoint = `${apiUrl}/api/remote/photographer/albums`;
      if (isStandalone) {
        if (standaloneAlbumType === 'PAID') {
          endpoint = `${apiUrl}/api/remote/photographer/albums/paid`;
          formData.append('pricePerImage', paidAlbumPrice);
          formData.append('currencyId', paidAlbumCurrencyId);
        } else {
          endpoint = `${apiUrl}/api/remote/photographer/albums/free`;
          formData.append('recipientEmail', freeAlbumEmail);
          // Optional download cap + price for extras. Blank = whole album
          // free to download (unchanged behaviour).
          if (freeMaxDownloads && String(freeMaxDownloads).trim() !== '') {
            formData.append('maxFreeDownloads', String(freeMaxDownloads).trim());
          }
          if (freeExtraPrice && String(freeExtraPrice).trim() !== '') {
            formData.append('pricePerExtraImage', String(freeExtraPrice).trim());
            // Currency only relevant when there's actually a price to charge.
            // Fall back to the paid-album currency the photographer just
            // picked so we don't make them double-select.
            const effectiveCurrency = freeExtraCurrencyId || paidAlbumCurrencyId;
            if (effectiveCurrency) formData.append('currencyId', effectiveCurrency);
          }
        }
        if (standaloneLocation) formData.append('location', standaloneLocation);
        if (standaloneDate) formData.append('date', standaloneDate);
      } else {
        formData.append('eventId', event!.id);
      }

      const res = await dashboardAuthFetch(endpoint, { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json();
        backendAlbumId = result?.data?.id || '';
        backendInviteCode = result?.data?.inviteCode || '';
        backendAccessCode = result?.data?.accessCode || '';

        // For FREE albums, send invitation email automatically
        if (isStandalone && standaloneAlbumType === 'FREE' && backendAlbumId) {
          try {
            setUploadProgress('Sending invitation...');
            const sendRes = await dashboardAuthFetch(
              `${apiUrl}/api/remote/photographer/albums/${backendAlbumId}/send-free`,
              { method: 'POST' }
            );
            if (sendRes.ok) {
              const sendResult = await sendRes.json();
              backendAccessCode = sendResult?.data?.accessCode || '';
              backendInviteCode = backendAccessCode || backendInviteCode;
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) { console.error('Failed to create album:', err); }

    if (!backendAlbumId) {
      setIsUploadingAlbum(false); setUploadProgress('');
      platformAlert('Failed to create album. Please try again.');
      return;
    }

    // 2. Upload images to the album
    let albumImages: string[] = isStandalone ? [] : [event!.coverImage];
    let albumCover = isStandalone ? '' : event!.coverImage;

    if (selectedFiles && selectedFiles.length > 0) {
      const uploadedUrls: string[] = [];
      const idMap: Record<string, string> = {};
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}...`);
        const result = await uploadImageToAlbum(backendAlbumId, selectedFiles[i]);
        if (result && result.url) {
          const normalizedUrl = normalizeImg(result.url) || result.url;
          uploadedUrls.push(normalizedUrl);
          idMap[normalizedUrl] = result.id;
        }
      }
      if (uploadedUrls.length > 0) {
        albumImages = uploadedUrls;
        albumCover = uploadedUrls[Math.min(selectedCoverIndex, uploadedUrls.length - 1)];
        setMediaIdMap(prev => ({ ...prev, ...idMap }));
      }
    }

    // 3. Auto-publish PAID standalone albums to Face AI
    let publishedToFaceAI = false;
    if (isStandalone && standaloneAlbumType === 'PAID' && backendAlbumId) {
      try {
        setUploadProgress('Publishing to Face AI...');
        const pubRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${backendAlbumId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricePerImage: parseFloat(paidAlbumPrice), currencyId: paidAlbumCurrencyId }),
        });
        if (pubRes.ok) {
          const pubResult = await pubRes.json();
          backendInviteCode = pubResult?.data?.inviteCode || backendInviteCode;
          publishedToFaceAI = true;
          // If publish didn't return an invite code, generate one
          if (!backendInviteCode) {
            try {
              const codeRes = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${backendAlbumId}/invite-code`, { method: 'POST' });
              if (codeRes.ok) {
                const codeResult = await codeRes.json();
                backendInviteCode = codeResult?.data?.inviteCode || codeResult?.data?.code || '';
              }
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
    }

    const newAlbum: Album = {
      id: backendAlbumId, title: albumTitle, description: albumDescription, category: albumCategory,
      eventId: isStandalone ? '' : event!.id, eventTitle: isStandalone ? '' : event!.title,
      clientId: isStandalone ? '' : event!.bookingId, clientName: isStandalone ? '' : event!.clientName,
      coverImage: albumCover, images: albumImages, photoCount: albumImages.length,
      views: 0, likes: 0, downloads: 0, shared: false, sharedWithClient: false,
      faceRecognitionEnabled: publishedToFaceAI, inviteCode: backendInviteCode || null,
      createdAt: new Date().toISOString().split('T')[0],
      eventDate: isStandalone ? standaloneDate : event!.date,
      clientImage: isStandalone ? '' : event!.clientImage, sentAt: '', expiresAt: '',
      albumType: isStandalone ? 'standalone' : 'event', isStandalone,
      location: isStandalone ? standaloneLocation : '', albumDate: isStandalone ? standaloneDate : '',
    };
    setAlbums(prev => [newAlbum, ...prev]);
    setShowCreateAlbumModal(false);
    setActiveTab('albums');
    setIsUploadingAlbum(false);
    setUploadProgress('');

    // Show success modal for standalone albums
    if (isStandalone) {
      setAlbumSuccessModal({
        type: standaloneAlbumType === 'PAID' ? 'paid' : 'free',
        title: albumTitle,
        inviteCode: backendInviteCode || undefined,
        email: standaloneAlbumType === 'FREE' ? freeAlbumEmail : undefined,
        accessCode: backendAccessCode || undefined,
        photoCount: albumImages.length,
      });
    }

    // Reset form fields
    setAlbumTitle('');
    setAlbumDescription('');
    setAlbumCategory('');
    setStandaloneLocation('');
    setStandaloneDate('');
    setPaidAlbumPrice('');
    setPaidAlbumCurrencyId('');
    setFreeAlbumEmail('');
    setUploadedImagePreviews([]);
    setSelectedFiles(null);
  };

  const handleOpenEdit = (album: Album) => { setSelectedAlbum(album); setEditTitle(album.title); setEditDescription(album.description); setEditCategory(album.category); setEditImages([...album.images]); setEditCoverIndex(album.images.indexOf(album.coverImage) >= 0 ? album.images.indexOf(album.coverImage) : 0); setShowAlbumEditModal(true); };
  const handleSaveEdit = async () => {
    if (!selectedAlbum || editImages.length === 0) return;
    const coverIdx = Math.min(editCoverIndex, editImages.length - 1);
    const newCoverImage = editImages[coverIdx];
    setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, title: editTitle, description: editDescription, category: editCategory, images: editImages, coverImage: newCoverImage, photoCount: editImages.length } : a));
    setShowAlbumEditModal(false);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('category', editCategory);
      formData.append('coverImageUrl', newCoverImage);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${selectedAlbum.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!res.ok) console.error('Failed to update album:', await res.text());
    } catch (err) {
      console.error('Failed to update album:', err);
    }
  };
  const handleEditFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || !selectedAlbum) return;
    for (const file of Array.from(files)) {
      const result = await uploadImageToAlbum(selectedAlbum.id, file);
      if (result && result.url) {
        const nUrl = normalizeImg(result.url) || result.url;
        setEditImages(prev => [...prev, nUrl]);
        setMediaIdMap(prev => ({ ...prev, [nUrl]: result.id }));
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
    const imageId = mediaIdMap[imageUrl];
    // Delete from album on server if we have an image ID
    if (imageId && selectedAlbum) {
      try {
        await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${selectedAlbum.id}/images/${imageId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete album image:', err);
      }
      setMediaIdMap(prev => { const updated = { ...prev }; delete updated[imageUrl]; return updated; });
    }
    setEditImages(prev => { const updated = prev.filter((_, i) => i !== index); if (editCoverIndex >= updated.length) setEditCoverIndex(Math.max(0, updated.length - 1)); else if (editCoverIndex === index) setEditCoverIndex(0); else if (editCoverIndex > index) setEditCoverIndex(editCoverIndex - 1); return updated; });
  };
  const handleToggleFaceRecognition = async (album: Album) => { let inviteCode = album.inviteCode; if (!album.faceRecognitionEnabled && !inviteCode) { try { const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${album.id}/invite-code`, { method: 'POST' }); if (res.ok) { const result = await res.json(); inviteCode = result?.data?.inviteCode || result?.data?.code || (typeof result?.data === 'string' ? result.data : null); } } catch (err) { console.error('Failed to generate invite code:', err); } } const updated = { ...album, faceRecognitionEnabled: !album.faceRecognitionEnabled, inviteCode }; setAlbums(prev => prev.map(a => a.id === album.id ? updated : a)); setSelectedAlbum(updated); };
  const handleSendToClient = async (album: Album) => {
    setShowSendModal(false);
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${album.id}/send`, { method: 'POST' });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        setAlbumSuccessMessage({
          title: 'Failed to Send Album',
          description: errorBody?.message || 'Failed to send album. Please try again.',
        });
        setShowAlbumSuccessModal(true);
        return;
      }
      setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, sharedWithClient: true, shared: true } : a));
      setAlbumSuccessMessage({
        title: 'Album Sent Successfully',
        description: `"${album.title}" has been delivered to ${album.clientName}. They can now view and download their photos.`,
      });
      setShowAlbumSuccessModal(true);
    } catch (err) {
      console.error('Failed to send album:', err);
    }
  };
  const handleDeleteAlbum = async () => { if (!albumToDelete) return; setAlbums(prev => prev.filter(a => a.id !== albumToDelete.id)); setShowDeleteConfirm(false); const id = albumToDelete.id; setAlbumToDelete(null); try { await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${id}`, { method: 'DELETE' }); } catch (err) { console.error('Failed to delete album:', err); } };

  // Soft delete (dismiss) handlers
  const handleDismissEvent = async () => {
    if (!eventToDismiss) return;
    const id = eventToDismiss.id;
    setEvents(prev => prev.filter(e => e.id !== id));
    setShowDismissEventModal(false);
    setEventToDismiss(null);
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/events/${id}/dismiss`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to dismiss event:', err);
    }
  };

  const handleDismissAlbum = async () => {
    if (!albumToDismiss) return;
    const id = albumToDismiss.id;
    setAlbums(prev => prev.filter(a => a.id !== id));
    setShowDismissAlbumModal(false);
    setAlbumToDismiss(null);
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${id}/dismiss`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to dismiss album:', err);
    }
  };

  // Check if event can be dismissed (album has been created for it)
  const canDismissEvent = (event: AssignedEvent): boolean => {
    return eventHasAlbum(event.id).exists;
  };

  // Check if album can be dismissed (sent to client AND Face AI enabled)
  const canDismissAlbum = (album: Album): boolean => {
    return album.sharedWithClient && album.faceRecognitionEnabled;
  };

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

  const viewToggleBtnStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 18px',
    background: isActive ? 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)' : 'transparent',
    color: isActive ? '#ffffff' : 'var(--ck-text-soft)',
    border: 'none', borderRadius: 10,
    fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.005em',
    cursor: 'pointer',
    transition: 'background 200ms ease, color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
    boxShadow: isActive ? '0 4px 12px rgba(8, 58, 133, 0.30)' : 'none',
    whiteSpace: 'nowrap',
    transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
  });
  const filterBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 9, border: 'none',
    backgroundColor: isActive ? 'var(--ck-surface)' : 'transparent',
    color: isActive ? 'var(--ck-text)' : 'var(--ck-text-soft)',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
    transition: 'background 180ms, color 180ms',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
    whiteSpace: 'nowrap',
  });
  const cardStyle: React.CSSProperties = { backgroundColor: colors.bgCard, borderRadius: 14, border: `1px solid ${colors.borderPrimary}`, boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.10)', overflow: 'hidden', transition: 'box-shadow 0.2s, border-color 0.2s' };
  const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
  const modalContent = (maxW: string): React.CSSProperties => ({ position: 'relative', backgroundColor: colors.bgCard, borderRadius: 18, paddingTop: 'calc(1.5rem + 3px)', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '1.5rem', width: '95%', maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)', border: `1px solid ${colors.borderPrimary}` });
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.85rem', borderRadius: 11, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.9rem', boxSizing: 'border-box' as const, outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s' };
  const primaryBtn: React.CSSProperties = { padding: '0.7rem 1.2rem', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', color: 'white', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 8px 18px rgba(8,58,133,0.30)', transition: 'transform 0.15s, box-shadow 0.15s' };
  const secondaryBtn: React.CSSProperties = { padding: '0.7rem 1.2rem', borderRadius: 11, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em', cursor: 'pointer', transition: 'border-color 0.15s' };
  const smallActionBtn: React.CSSProperties = { padding: '0.4rem 0.7rem', borderRadius: 9, border: `1px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'border-color 0.15s, background-color 0.15s' };

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
            <header className="events-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', margin: '8px 0 22px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
                }}>Library</div>
                <h1 style={{
                  margin: 0, fontSize: '1.85rem', fontWeight: 800,
                  letterSpacing: '-0.02em', color: colors.textPrimary,
                }}>Events & albums</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                  {activeTab === 'events'
                    ? 'Manage your assigned events, live streams, and event lifecycle.'
                    : activeTab === 'albums'
                    ? 'Browse and manage your created photo albums.'
                    : 'Curate and share photobooks with your clients.'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, color: 'var(--ck-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>View</span>
                <div role="tablist" aria-label="Switch view" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'var(--ck-surface)', border: '1px solid var(--ck-stroke)',
                  padding: 4, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                  <button onClick={() => setActiveTab('events')} role="tab" aria-selected={activeTab === 'events'} style={viewToggleBtnStyle(activeTab === 'events')}>
                    <i className="bi bi-calendar-event" style={{ fontSize: 15 }} /> Events
                  </button>
                  <button onClick={() => setActiveTab('albums')} role="tab" aria-selected={activeTab === 'albums'} style={viewToggleBtnStyle(activeTab === 'albums')}>
                    <i className="bi bi-images" style={{ fontSize: 15 }} /> Albums
                  </button>
                  <button onClick={() => setActiveTab('photobooks')} role="tab" aria-selected={activeTab === 'photobooks'} style={viewToggleBtnStyle(activeTab === 'photobooks')}>
                    <i className="bi bi-book" style={{ fontSize: 15 }} /> Photobooks
                  </button>
                </div>
              </div>
            </header>

            {/* ==================== EVENTS TAB ==================== */}
            {activeTab === 'events' && (
              <>
                {/* Stat Cards */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Total Events', value: eventCounts.all, accent: '#083A85', icon: 'bi-calendar3', tint: 'rgba(8,58,133,0.10)' },
                    { label: 'Upcoming', value: eventCounts.upcoming, accent: '#F59E0B', icon: 'bi-hourglass-split', tint: 'rgba(245,158,11,0.12)' },
                    { label: 'Ongoing', value: eventCounts.ongoing, accent: '#3B82F6', icon: 'bi-broadcast-pin', tint: 'rgba(59,130,246,0.12)' },
                    { label: 'Completed', value: eventCounts.completed, accent: '#10B981', icon: 'bi-check2-circle', tint: 'rgba(16,185,129,0.12)' },
                  ] as const).map(stat => (
                    <div
                      key={stat.label}
                      className="ck-card"
                      style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px 16px' }}
                    >
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: stat.tint,
                          border: `1px solid ${stat.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`bi ${stat.icon}`} style={{ fontSize: 16, color: stat.accent }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: 2, fontWeight: 600 }}>{stat.label}</div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{stat.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters + Search */}
                <div className="events-page-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div className="ck-tabs">
                    {(['all', 'upcoming', 'ongoing', 'completed'] as const).map(f => (
                      <button key={f} onClick={() => setEventFilter(f)} className={`ck-tab ${eventFilter === f ? 'is-active' : ''}`}>
                        <span>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</span>
                        <span style={{
                          marginLeft: 6,
                          backgroundColor: eventFilter === f ? 'rgba(255,255,255,0.22)' : 'rgba(8,58,133,0.10)',
                          color: eventFilter === f ? '#fff' : '#083A85',
                          padding: '0.06rem 0.42rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}>
                          {eventCounts[f]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="ck-search" style={{ marginLeft: 'auto', minWidth: 240, maxWidth: 320 }}>
                    <i className="bi bi-search" />
                    <input placeholder="Search events…" value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
                  </div>
                </div>

                {/* Event Cards Grid */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1rem' }}>
                  {filteredEvents.map(event => {
                    const badge = getStatusBadge(event.status);
                    const streamCfg = event.hasLiveStream ? streamConfigs[event.id] : null;
                    const isLive = streamCfg?.connectionStatus === 'connected';
                    const isHighlighted = highlightId != null && String(event.id) === highlightId;
                    return (
                      /* Outer glow wrapper — blurred image border */
                      <div
                        key={event.id}
                        ref={isHighlighted ? highlightCardRef : null}
                        className={isHighlighted ? 'notif-highlight-pop' : undefined}
                        style={{ position: 'relative', height: '450px', borderRadius: '1.25rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <img src={event.coverImage || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {/* Inner card — clickable to open details */}
                        <div
                          onClick={() => { setSelectedEvent(event); setShowEventDetailModal(true); }}
                          style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                          {/* Full-bleed cover image */}
                          <img src={event.coverImage || '/coverr.jpg'} alt={event.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                          {/* Gradient overlay */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                          {/* TOP: date badge + status badge + live badge */}
                          <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', right: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              <div style={{
                                background: 'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                color: 'white',
                                padding: '0.28rem 0.7rem',
                                borderRadius: 9999,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                border: '1px solid rgba(255,255,255,0.18)',
                              }}>
                                <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                                {formatDate(event.date)}
                              </div>
                              <div style={{
                                backgroundColor: badge.bg, color: badge.color,
                                padding: '0.28rem 0.65rem',
                                borderRadius: 9999,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(255,255,255,0.25)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                              }}>{badge.label}</div>
                            </div>
                            {event.hasLiveStream && event.status !== 'completed' && (
                              <div style={{
                                background: isLive
                                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                  : 'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                color: 'white',
                                padding: '0.28rem 0.65rem',
                                borderRadius: 9999,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                animation: isLive ? 'pulse 2s infinite' : 'none',
                                border: '1px solid rgba(255,255,255,0.25)',
                                boxShadow: isLive ? '0 4px 12px rgba(220,38,38,0.40)' : '0 4px 10px rgba(0,0,0,0.20)',
                              }}>
                                {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }} />}
                                <i className="bi bi-broadcast-pin" style={{ fontSize: 10 }} /> {isLive ? 'LIVE' : 'Stream'}
                              </div>
                            )}
                          </div>

                          {/* Viewer count for live */}
                          {isLive && streamCfg && event.status !== 'completed' && (
                            <div style={{ position: 'absolute', top: '2.5rem', right: '0.6rem', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 600, pointerEvents: 'none' }}>{streamCfg.viewerCount.toLocaleString()} viewers</div>
                          )}

                          {/* MIDDLE-BOTTOM: title + location over image */}
                          <div style={{ position: 'absolute', bottom: '6.2rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '0.25rem', marginTop: '-0.5rem' }}>
                              {event.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="10" r="3" stroke="rgba(255,255,255,0.85)" strokeWidth="3"/>
                              </svg>
                              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[event.location.city, event.location.country].filter(Boolean).join(', ') || event.location.address || 'No location'}</span>
                            </div>
                          </div>

                          {/* FOOTER BAR: frosted glass */}
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                            {/* Client avatar + name + time */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                                {event.clientImage ? (
                                  <img src={event.clientImage} alt={event.clientName} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.45)', objectFit: 'cover', flexShrink: 0, boxShadow: '0 3px 8px rgba(0,0,0,0.30)' }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                                ) : null}
                                <div style={{
                                  width: 34, height: 34, borderRadius: '50%',
                                  padding: 2,
                                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                                  display: event.clientImage ? 'none' : 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 4px 10px rgba(8,58,133,0.36), 0 0 0 1px rgba(255,255,255,0.18)',
                                }}>
                                  <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0a4da8 0%, #DB0A7F 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.01em',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.30)',
                                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.18)',
                                  }}>
                                    {event.clientName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.clientName}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(255,255,255,0.12)', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.67rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, flexShrink: 0 }}>
                                <ClockIcon /> {formatTime(event.startTime)}
                              </div>
                            </div>
                            {/* Action buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                              {event.bookingStatus?.toUpperCase() === 'PENDING' ? (
                                <>
                                  <button onClick={() => openBookingAction(event, 'accept')} style={{
                                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    padding: '0.42rem 0', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(16,185,129,0.32)',
                                    transition: 'transform 0.15s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                  >
                                    <i className="bi bi-check2-circle" style={{ fontSize: 12 }} /> Accept
                                  </button>
                                  <button onClick={() => openBookingAction(event, 'decline')} style={{
                                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    padding: '0.42rem 0', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                    color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(220,38,38,0.30)',
                                    transition: 'transform 0.15s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                  >
                                    <i className="bi bi-x-circle-fill" style={{ fontSize: 12 }} /> Deny
                                  </button>
                                </>
                              ) : (
                                <>
                                  {event.hasLiveStream && (event.status === 'upcoming' || event.status === 'ongoing') && (
                                    <button onClick={() => {
                                      setSelectedEvent(event);
                                      if (!event.isPublished) {
                                        setShowUnpublishedModal(true);
                                      } else {
                                        setShowStreamPreview(true);
                                      }
                                    }} style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                      padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                      background: isLive
                                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                        : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                      color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                      boxShadow: isLive ? '0 4px 10px rgba(220,38,38,0.36)' : '0 4px 10px rgba(139,92,246,0.32)',
                                      animation: isLive ? 'pulse 2s infinite' : 'none',
                                      transition: 'transform 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <i className="bi bi-broadcast-pin" style={{ fontSize: 11 }} /> {isLive ? 'LIVE' : 'Live Stream'}
                                    </button>
                                  )}
                                  {(event.status === 'completed' || event.bookingStatus?.toUpperCase() === 'ACCEPTED') && canCreateAlbumForEvent(event.id) && (
                                    <button onClick={() => {
                                      if (!event.isPublished) {
                                        setSelectedEvent(event);
                                        setShowUnpublishedModal(true);
                                      } else {
                                        handleOpenCreateAlbum(event.id);
                                      }
                                    }} style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                      padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                      color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                      boxShadow: '0 4px 10px rgba(8,58,133,0.32)',
                                      transition: 'transform 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <i className="bi bi-plus-circle-fill" style={{ fontSize: 11 }} /> Create Album
                                    </button>
                                  )}
                                  {(event.status === 'completed' || event.bookingStatus?.toUpperCase() === 'ACCEPTED') && !canCreateAlbumForEvent(event.id) && eventHasAlbum(event.id).sent && (
                                    <div style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 5,
                                      padding: '0.42rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '-0.005em',
                                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                      color: 'white', borderRadius: 9,
                                      boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                                    }}>
                                      <i className="bi bi-send-check-fill" style={{ fontSize: 11 }} /> Album Sent
                                    </div>
                                  )}
                                  {event.hasLiveStream && event.status === 'ongoing' && (
                                    <button onClick={() => setMarkCompleteTarget(event)} style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                      padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                      color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                      boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                                      transition: 'transform 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <i className="bi bi-check2-all" style={{ fontSize: 12 }} /> Complete
                                    </button>
                                  )}
                                  {event.bookingStatus?.toUpperCase() === 'ACCEPTED' && (
                                    <div style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 5,
                                      padding: '0.42rem 0.65rem', borderRadius: 9,
                                      fontSize: '0.7rem', color: 'white', fontWeight: 700, letterSpacing: '-0.005em',
                                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                      boxShadow: '0 4px 10px rgba(16,185,129,0.28)',
                                    }}>
                                      <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Accepted
                                    </div>
                                  )}
                                  {canDismissEvent(event) && (
                                    <button onClick={() => { setEventToDismiss(event); setShowDismissEventModal(true); }} title="Dismiss Event" style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      padding: '0.42rem 0.55rem',
                                      background: 'rgba(220,38,38,0.85)',
                                      backdropFilter: 'blur(6px)',
                                      color: 'white', border: '1px solid rgba(255,255,255,0.18)',
                                      borderRadius: 9, cursor: 'pointer',
                                      transition: 'transform 0.15s, background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                                    >
                                      <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                                    </button>
                                  )}
                                  <div style={{
                                    marginLeft: 'auto',
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                    padding: '0.42rem 0.7rem', borderRadius: 9,
                                    fontSize: '0.7rem', color: 'white', fontWeight: 700, letterSpacing: '-0.005em',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                                  }}>
                                    <i className="bi bi-box-seam-fill" style={{ fontSize: 11 }} /> {event.packageName}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredEvents.length === 0 && (
                  <div className="ck-empty" style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 16,
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.10) 100%)',
                      border: '1px solid var(--ck-stroke)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-calendar3" style={{ fontSize: 26, color: '#083A85' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>No events found</div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: colors.textSecondary }}>
                        {eventFilter === 'all' ? 'Events you’re assigned to will appear here.' : `Try a different filter or search term.`}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ==================== ALBUMS TAB ==================== */}
            {activeTab === 'albums' && (
              <>
                {/* Stats */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Total Albums', value: albums.length, accent: '#083A85', icon: 'bi-images', tint: 'rgba(8,58,133,0.10)' },
                    { label: 'Shared', value: albums.filter(a => a.shared).length, accent: '#10B981', icon: 'bi-share-fill', tint: 'rgba(16,185,129,0.12)' },
                    { label: 'Total Photos', value: albums.reduce((s, a) => s + a.photoCount, 0), accent: '#F59E0B', icon: 'bi-camera-fill', tint: 'rgba(245,158,11,0.12)' },
                    { label: 'Total Views', value: albums.reduce((s, a) => s + a.views, 0), accent: '#F20C8F', icon: 'bi-eye-fill', tint: 'rgba(242,12,143,0.12)' },
                  ] as const).map(stat => (
                    <div
                      key={stat.label}
                      className="ck-card"
                      style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px 16px' }}
                    >
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: stat.tint,
                          border: `1px solid ${stat.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`bi ${stat.icon}`} style={{ fontSize: 16, color: stat.accent }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: 2, fontWeight: 600 }}>{stat.label}</div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{stat.value.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters + Search + Actions */}
                <div className="events-page-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <div className="ck-tabs">
                    {(['all', 'shared', 'unshared'] as const).map(f => (
                      <button key={f} onClick={() => setAlbumFilter(f)} className={`ck-tab ${albumFilter === f ? 'is-active' : ''}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => setAlbumViewMode('grid')} style={{ ...smallActionBtn, borderColor: albumViewMode === 'grid' ? colors.brandPrimary : colors.borderPrimary }}><GridIcon active={albumViewMode === 'grid'} /></button>
                    <button onClick={() => setAlbumViewMode('list')} style={{ ...smallActionBtn, borderColor: albumViewMode === 'list' ? colors.brandPrimary : colors.borderPrimary }}><ListIcon active={albumViewMode === 'list'} /></button>
                  </div>
                  <button onClick={() => handleOpenCreateAlbum()} className="ck-btn ck-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <PlusIcon /> New Album
                  </button>
                  <div className="ck-search" style={{ marginLeft: 'auto', minWidth: 240, maxWidth: 320 }}>
                    <i className="bi bi-search" />
                    <input placeholder="Search albums…" value={albumSearch} onChange={e => setAlbumSearch(e.target.value)} />
                  </div>
                </div>

                {/* Album Cards */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: albumViewMode === 'grid' ? 'repeat(auto-fill, minmax(380px, 1fr))' : '1fr', gap: '1rem' }}>
                  {filteredAlbums.map(album => {
                    const matchedEvent = events.find(e => e.id === album.eventId);
                    const displayDate = album.eventDate || matchedEvent?.date || album.createdAt;
                    const clientImg = album.clientImage || matchedEvent?.clientImage || '';
                    return albumViewMode === 'grid' ? (
                    /* ── GRID VIEW: outer glow wrapper + inner card ── */
                    <div key={album.id} style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                      {/* Blurred cover image behind card = image-based border glow */}
                      <img src={album.coverImage || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                      {/* Inner card — clickable to browse album */}
                      <div
                        onClick={() => { setSelectedAlbum(album); setViewerAlbum(album); setCurrentImageIndex(0); setShowAlbumBrowseModal(true); }}
                        style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {/* Full-bleed cover image spanning entire inner card */}
                        <img src={album.coverImage || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {/* Gradient overlay — lighter so image shows through */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                        {/* TOP: date badge + shared badge */}
                        <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', right: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                          <div style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: 'white',
                            padding: '0.28rem 0.7rem',
                            borderRadius: 9999,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            border: '1px solid rgba(255,255,255,0.18)',
                          }}>
                            <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                            {formatDate(displayDate)}
                          </div>
                          {album.shared && (
                            <div style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: 'white',
                              padding: '0.28rem 0.65rem',
                              borderRadius: 9999,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              border: '1px solid rgba(255,255,255,0.25)',
                              boxShadow: '0 4px 10px rgba(16,185,129,0.32)',
                            }}>
                              <i className="bi bi-share-fill" style={{ fontSize: 10 }} /> Shared
                            </div>
                          )}
                        </div>

                        {/* MIDDLE-BOTTOM: title content over image */}
                        <div style={{ position: 'absolute', bottom: '5.8rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>{album.isStandalone ? (album.location || 'Personal Album') : album.eventTitle}</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                            {album.title}
                          </div>
                        </div>

                        {/* FOOTER BAR: frosted glass over blurred cover image */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                          {/* Client avatar + name (or Personal badge for standalone) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, marginBottom: '0.5rem' }}>
                            {album.isStandalone ? (
                              <>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>
                                  <ImageIcon />
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Personal Album</span>
                              </>
                            ) : (
                              <>
                                {clientImg ? (
                                  <img src={clientImg} alt={album.clientName} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.45)', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.30)' }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                                ) : null}
                                <div style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  padding: 1.5,
                                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                                  display: clientImg ? 'none' : 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 3px 8px rgba(8,58,133,0.36), 0 0 0 1px rgba(255,255,255,0.18)',
                                }}>
                                  <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0a4da8 0%, #DB0A7F 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.005em',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.30)',
                                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 3px rgba(0,0,0,0.18)',
                                  }}>
                                    {album.clientName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.clientName}</span>
                              </>
                            )}
                          </div>
                          {/* Action buttons + photo count pill */}
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                            {!album.isStandalone && (album.sharedWithClient ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.42rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white', borderRadius: 9,
                                boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                              }}>
                                <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Sent
                              </span>
                            ) : (
                              <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} title="Send to Client" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(8,58,133,0.32)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-send-fill" style={{ fontSize: 11 }} /> Send
                              </button>
                            ))}
                            {!(album.isStandalone && album.albumType === 'standalone' && !album.faceRecognitionEnabled && !album.inviteCode) && (
                              album.faceRecognitionEnabled ? (
                                <span onClick={() => handleOpenFaceAI(album)} title="Album is live on Find-My-Photos" style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  padding: '0.42rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                  <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> On Face AI
                                </span>
                              ) : !album.isStandalone ? (
                                <button onClick={() => handleOpenFaceAI(album)} title="Face AI / Find-My-Photos" style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  padding: '0.42rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.32)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                  <i className="bi bi-person-bounding-box" style={{ fontSize: 11 }} /> Face AI
                                </button>
                              ) : null
                            )}
                            {canEditAlbum(album) && (
                              <button onClick={() => handleOpenEdit(album)} title={album.sharedWithClient ? `Edit (${getEditDaysRemaining(album)} days left)` : 'Edit Album'} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.42rem 0.55rem',
                                background: 'rgba(255,255,255,0.14)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                              >
                                <i className="bi bi-pencil-fill" style={{ fontSize: 11 }} />
                              </button>
                            )}
                            {!album.sharedWithClient ? (
                              <button onClick={() => { setAlbumToDelete(album); setShowDeleteConfirm(true); }} title="Delete Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.42rem 0.55rem',
                                background: 'rgba(220,38,38,0.85)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                              >
                                <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                              </button>
                            ) : canDismissAlbum(album) ? (
                              <button onClick={() => { setAlbumToDismiss(album); setShowDismissAlbumModal(true); }} title="Dismiss Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.42rem 0.55rem',
                                background: 'rgba(220,38,38,0.85)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                              >
                                <i className="bi bi-x-octagon-fill" style={{ fontSize: 11 }} />
                              </button>
                            ) : null}
                            <div style={{
                              marginLeft: 'auto',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              padding: '0.42rem 0.7rem', borderRadius: 9,
                              fontSize: '0.7rem', color: 'white', fontWeight: 700, letterSpacing: '-0.005em',
                              flexShrink: 0,
                              boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                            }}>
                              <i className="bi bi-images" style={{ fontSize: 11 }} /> {album.photoCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                    /* ── LIST VIEW ── */
                    <div key={album.id} style={{ ...cardStyle, position: 'relative', height: 160, display: 'flex', flexDirection: 'row' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.boxShadow = '0 12px 28px -10px rgba(8,58,133,0.22)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = '0 4px 16px -6px rgba(8, 58, 133, 0.10)'; }}
                    >
                      {/* Image side with overlay */}
                      <div style={{ position: 'relative', width: 220, flexShrink: 0, overflow: 'hidden' }}>
                        <img src={album.coverImage || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }} />
                        <div style={{
                          position: 'absolute', top: 10, left: 10,
                          background: 'rgba(0,0,0,0.55)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: 'white',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 9999,
                          fontSize: '0.66rem', fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          border: '1px solid rgba(255,255,255,0.18)',
                        }}>
                          <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                          {formatDate(displayDate)}
                        </div>
                        {album.shared && (
                          <div style={{
                            position: 'absolute', bottom: 10, left: 10,
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 9999,
                            fontSize: '0.64rem', fontWeight: 800,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            border: '1px solid rgba(255,255,255,0.25)',
                            boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                          }}>
                            <i className="bi bi-share-fill" style={{ fontSize: 9 }} /> Shared
                          </div>
                        )}
                      </div>
                      {/* Content side */}
                      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                        <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                          <div>
                            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{album.isStandalone ? (album.location || 'Personal Album') : album.eventTitle}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.005em' }}>{album.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: colors.textSecondary }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                {clientImg ? (
                                  <img src={clientImg} alt={album.clientName} style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${colors.borderPrimary}`, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                                ) : null}
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #F20C8F)', border: `1px solid ${colors.borderPrimary}`, display: clientImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 800 }}>{album.clientName.charAt(0).toUpperCase()}</div>
                                <span style={{ fontWeight: 600, color: colors.textPrimary }}>{album.clientName}</span>
                              </div>
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                padding: '0.18rem 0.55rem', borderRadius: 9999,
                                fontSize: '0.66rem', color: 'white', fontWeight: 700,
                                boxShadow: '0 3px 8px rgba(8,58,133,0.24)',
                              }}>
                                <i className="bi bi-images" style={{ fontSize: 10 }} /> {album.photoCount}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => { setSelectedAlbum(album); setViewerAlbum(album); setCurrentImageIndex(0); setShowAlbumBrowseModal(true); }} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                              transition: 'transform 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            ><i className="bi bi-eye-fill" style={{ fontSize: 11 }} /> Browse</button>
                            {!album.isStandalone && (album.sharedWithClient ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white', borderRadius: 9, cursor: 'default',
                                boxShadow: '0 4px 10px rgba(16,185,129,0.28)',
                              }}><i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Sent</span>
                            ) : (
                              <button onClick={() => { setSelectedAlbum(album); setShowSendModal(true); }} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(16,185,129,0.28)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-send-fill" style={{ fontSize: 11 }} /> Send</button>
                            ))}
                            {!(album.isStandalone && !album.faceRecognitionEnabled && !album.inviteCode) && (
                              album.faceRecognitionEnabled ? (
                                <span onClick={() => handleOpenFaceAI(album)} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.28)',
                                }}><i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> On Face AI</span>
                              ) : !album.isStandalone ? (
                                <button onClick={() => handleOpenFaceAI(album)} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                  color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(139,92,246,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                ><i className="bi bi-person-bounding-box" style={{ fontSize: 11 }} /> Face AI</button>
                              ) : null
                            )}
                            {canEditAlbum(album) && (
                              <button onClick={() => handleOpenEdit(album)} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                                background: colors.bgTertiary,
                                color: colors.textPrimary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                              ><i className="bi bi-pencil-fill" style={{ fontSize: 11 }} /> Edit{album.sharedWithClient ? ` (${getEditDaysRemaining(album)}d)` : ''}</button>
                            )}
                            {!album.sharedWithClient ? (
                              <button onClick={() => { setAlbumToDelete(album); setShowDeleteConfirm(true); }} title="Delete Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.4rem 0.6rem',
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(220,38,38,0.28)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-trash3-fill" style={{ fontSize: 11 }} /></button>
                            ) : canDismissAlbum(album) ? (
                              <button onClick={() => { setAlbumToDismiss(album); setShowDismissAlbumModal(true); }} title="Dismiss Album" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0.4rem 0.6rem',
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(220,38,38,0.28)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              ><i className="bi bi-x-octagon-fill" style={{ fontSize: 11 }} /></button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
                {filteredAlbums.length === 0 && (
                  <div className="ck-empty" style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 16,
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.10) 100%)',
                      border: '1px solid var(--ck-stroke)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-images" style={{ fontSize: 26, color: '#083A85' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>No albums found</div>
                      <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 460, lineHeight: 1.5 }}>
                        Create one from an event or start a personal album to get going.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ==================== PHOTOBOOKS TAB ==================== */}
            {activeTab === 'photobooks' && (
              <>
                {/* Stats */}
                <div className="events-page-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {([
                    { label: 'Received Photobooks', value: receivedPhotobooks.length, accent: '#083A85', icon: 'bi-book-half', tint: 'rgba(8,58,133,0.10)' },
                    { label: 'Total Photos', value: receivedPhotobooks.reduce((s, pb) => s + pb.images.length, 0), accent: '#F59E0B', icon: 'bi-camera-fill', tint: 'rgba(245,158,11,0.12)' },
                    { label: 'Recent (7 days)', value: receivedPhotobooks.filter(pb => { const d = new Date(pb.sentAt || pb.createdAt); return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000; }).length, accent: '#10B981', icon: 'bi-clock-history', tint: 'rgba(16,185,129,0.12)' },
                  ] as const).map(stat => (
                    <div
                      key={stat.label}
                      className="ck-card"
                      style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px 16px' }}
                    >
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                      }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: stat.tint,
                          border: `1px solid ${stat.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className={`bi ${stat.icon}`} style={{ fontSize: 16, color: stat.accent }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: 2, fontWeight: 600 }}>{stat.label}</div>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{stat.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div className="ck-search" style={{ flex: 1, maxWidth: 420 }}>
                    <i className="bi bi-search" />
                    <input
                      value={photobookSearch}
                      onChange={(e) => setPhotobookSearch(e.target.value)}
                      placeholder="Search photobooks…"
                    />
                  </div>
                </div>

                {/* Photobook Cards Grid */}
                <div className="events-page-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {receivedPhotobooks
                    .filter(pb => !photobookSearch || pb.name.toLowerCase().includes(photobookSearch.toLowerCase()) || pb.senderName.toLowerCase().includes(photobookSearch.toLowerCase()))
                    .map(pb => (
                    <div
                      key={pb.id}
                      style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {/* Blurred cover = glow effect */}
                      <img src={pb.thumbnail || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                      {/* Inner card */}
                      <div
                        onClick={() => { if (pb.images.length > 0) openPhotobookBrowse(pb); }}
                        style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {/* Full-bleed cover image */}
                        <img src={pb.thumbnail || '/coverr.jpg'} alt={pb.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                        {/* TOP: badges */}
                        <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', right: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              color: 'white',
                              padding: '0.28rem 0.7rem',
                              borderRadius: 9999,
                              fontSize: '0.65rem', fontWeight: 800,
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              border: '1px solid rgba(255,255,255,0.25)',
                              boxShadow: '0 4px 10px rgba(8,58,133,0.32)',
                            }}>
                              <i className="bi bi-book-half" style={{ fontSize: 10 }} /> Photobook
                            </div>
                            {pb.layout && (() => {
                              const cfg: Record<string, { grad: string; shadow: string; icon: string }> = {
                                'book-flip': { grad: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', shadow: '0 4px 10px rgba(139,92,246,0.32)', icon: 'bi-journal-bookmark-fill' },
                                'mosaic': { grad: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadow: '0 4px 10px rgba(245,158,11,0.32)', icon: 'bi-grid-3x3-gap-fill' },
                                'grid': { grad: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', shadow: '0 4px 10px rgba(99,102,241,0.32)', icon: 'bi-grid-fill' },
                                'gallery-wall': { grad: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: '0 4px 10px rgba(16,185,129,0.32)', icon: 'bi-grid-1x2-fill' },
                              };
                              const c = cfg[pb.layout] || cfg['gallery-wall'];
                              return (
                                <div style={{
                                  background: c.grad,
                                  color: 'white',
                                  padding: '0.28rem 0.65rem',
                                  borderRadius: 9999,
                                  fontSize: '0.62rem', fontWeight: 800,
                                  letterSpacing: '0.06em', textTransform: 'uppercase',
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  border: '1px solid rgba(255,255,255,0.25)',
                                  boxShadow: c.shadow,
                                }}>
                                  <i className={`bi ${c.icon}`} style={{ fontSize: 10 }} />
                                  {pb.layout === 'book-flip' ? 'Book Flip' : pb.layout === 'mosaic' ? 'Mosaic' : pb.layout === 'gallery-wall' ? 'Gallery Wall' : pb.layout.replace(/-/g, ' ')}
                                </div>
                              );
                            })()}
                          </div>
                          <div style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: 'white',
                            padding: '0.28rem 0.65rem',
                            borderRadius: 9999,
                            fontSize: '0.66rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            border: '1px solid rgba(255,255,255,0.18)',
                          }}>
                            <i className="bi bi-images" style={{ fontSize: 10 }} /> {pb.images.length}
                          </div>
                        </div>

                        {/* MIDDLE-BOTTOM: title content */}
                        <div style={{ position: 'absolute', bottom: '4.8rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>
                            From: {pb.senderName || 'Client'} &middot; {pb.sentAt ? new Date(pb.sentAt).toLocaleDateString() : pb.createdAt ? new Date(pb.createdAt).toLocaleDateString() : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                              {pb.name}
                            </div>
                            {(() => {
                              const s = pb.status || 'SENT_TO_PHOTOGRAPHER';
                              const cfg: Record<string, { grad: string; shadow: string; label: string; icon: string }> = {
                                SENT_TO_PHOTOGRAPHER: { grad: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', shadow: '0 3px 8px rgba(37,99,235,0.36)', label: 'Received', icon: 'bi-inbox-fill' },
                                PHOTOGRAPHER_EDITING: { grad: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', shadow: '0 3px 8px rgba(139,92,246,0.36)', label: 'Editing', icon: 'bi-pencil-fill' },
                                RESUBMITTED: { grad: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', shadow: '0 3px 8px rgba(16,185,129,0.36)', label: 'Resubmitted', icon: 'bi-arrow-return-left' },
                                COMPLETED: { grad: 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)', shadow: '0 3px 8px rgba(16,185,129,0.36)', label: 'Completed', icon: 'bi-check2-all' },
                              };
                              const c = cfg[s] || cfg.SENT_TO_PHOTOGRAPHER;
                              return <span style={{
                                color: 'white',
                                background: c.grad,
                                padding: '0.2rem 0.55rem',
                                borderRadius: 9999,
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                border: '1px solid rgba(255,255,255,0.25)',
                                boxShadow: c.shadow,
                              }}><i className={`bi ${c.icon}`} style={{ fontSize: 9 }} />{c.label}</span>;
                            })()}
                          </div>
                          {pb.description && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{pb.description}</div>
                          )}
                        </div>

                        {/* FOOTER BAR: frosted glass */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openPhotobookBrowse(pb)}
                              style={{
                                flex: 1,
                                padding: '0.42rem 0.65rem',
                                borderRadius: 9, border: 'none',
                                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                                color: 'white',
                                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em',
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                                transition: 'transform 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              <i className="bi bi-eye-fill" style={{ fontSize: 11 }} /> View
                            </button>
                            {(pb.status === 'SENT_TO_PHOTOGRAPHER' || pb.status === 'PHOTOGRAPHER_EDITING') && (
                              <button
                                onClick={() => setPhotobookToResubmit(pb)}
                                style={{
                                  flex: 1,
                                  padding: '0.42rem 0.65rem',
                                  borderRadius: 9, border: 'none',
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: 'white',
                                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-send-fill" style={{ fontSize: 11 }} />
                                Send Back
                              </button>
                            )}
                            {pb.status === 'RESUBMITTED' && (
                              <span style={{
                                flex: 1,
                                padding: '0.42rem 0.65rem',
                                borderRadius: 9,
                                background: 'rgba(16,185,129,0.18)',
                                border: '1px solid rgba(16,185,129,0.35)',
                                color: '#10B981',
                                fontSize: '0.74rem', fontWeight: 700, letterSpacing: '-0.005em',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              }}>
                                <i className="bi bi-hourglass-split" style={{ fontSize: 11 }} />
                                Awaiting Review
                              </span>
                            )}
                            {pb.status === 'COMPLETED' && (
                              <span style={{
                                flex: 1,
                                padding: '0.42rem 0.65rem',
                                borderRadius: 9,
                                background: 'rgba(16,185,129,0.18)',
                                border: '1px solid rgba(16,185,129,0.35)',
                                color: '#10B981',
                                fontSize: '0.74rem', fontWeight: 700, letterSpacing: '-0.005em',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              }}>
                                <i className="bi bi-check2-all" style={{ fontSize: 12 }} />
                                Accepted
                              </span>
                            )}
                            {(!pb.status || !['SENT_TO_PHOTOGRAPHER', 'PHOTOGRAPHER_EDITING', 'RESUBMITTED', 'COMPLETED'].includes(pb.status)) && (
                              <button
                                onClick={() => downloadAllImages(pb)}
                                style={{
                                  flex: 1,
                                  padding: '0.42rem 0.65rem',
                                  borderRadius: 9, border: 'none',
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  color: 'white',
                                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '-0.005em',
                                  cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                  boxShadow: '0 4px 10px rgba(16,185,129,0.30)',
                                  transition: 'transform 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                <i className="bi bi-download" style={{ fontSize: 11 }} /> Download
                              </button>
                            )}
                            <button
                              onClick={() => { setPhotobookToDelete(pb); setShowDeletePhotobookModal(true); }}
                              title="Delete Photobook"
                              style={{
                                padding: '0.42rem 0.55rem',
                                borderRadius: 9,
                                background: 'rgba(220,38,38,0.85)',
                                backdropFilter: 'blur(6px)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.18)',
                                cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(220,38,38,0.85)'; }}
                            >
                              <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {receivedPhotobooks.filter(pb => !photobookSearch || pb.name.toLowerCase().includes(photobookSearch.toLowerCase()) || pb.senderName.toLowerCase().includes(photobookSearch.toLowerCase())).length === 0 && (
                  <div className="ck-empty" style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 16,
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 18,
                      background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.10) 100%)',
                      border: '1px solid var(--ck-stroke)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="bi bi-book" style={{ fontSize: 26, color: '#083A85' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                        {photobookSearch ? 'No photobooks match your search' : 'No photobooks yet'}
                      </div>
                      <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 460, lineHeight: 1.5 }}>
                        {photobookSearch
                          ? 'Try a different keyword or clear the search.'
                          : 'Clients and coordinators can send you photobooks with their preferred photo selections. They’ll appear here for review and resubmission.'}
                      </p>
                    </div>
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
          <div style={modalContent('620px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Event details</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>{selectedEvent.title}</h2>
              </div>
              <button onClick={() => setShowEventDetailModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>

            <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', backgroundColor: selectedEvent.coverImage ? 'transparent' : '#0D1B2A', border: `1px solid ${colors.borderPrimary}` }}>
              <img src={selectedEvent.coverImage || '/coverr.jpg'} alt={selectedEvent.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedEvent.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.30) 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(() => { const b = getStatusBadge(selectedEvent.status); return <span style={{
                  background: b.bg, color: b.color,
                  padding: '0.28rem 0.65rem', borderRadius: 9999,
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                }}>{b.label}</span>; })()}
                {selectedEvent.hasLiveStream && (
                  <span style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: 'white',
                    padding: '0.28rem 0.65rem', borderRadius: 9999,
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    boxShadow: '0 4px 10px rgba(139,92,246,0.32)',
                  }}>
                    <i className="bi bi-broadcast-pin" style={{ fontSize: 10 }} /> Live Stream
                  </span>
                )}
              </div>
            </div>

            {selectedEvent.description && (
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.1rem', lineHeight: 1.55 }}>{selectedEvent.description}</p>
            )}

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem',
              marginBottom: '1.1rem',
            }}>
              {[
                { icon: 'bi-calendar3', label: 'Date', value: formatDate(selectedEvent.date) },
                { icon: 'bi-clock', label: 'Time', value: `${formatTime(selectedEvent.startTime)} – ${formatTime(selectedEvent.endTime)}` },
                { icon: 'bi-geo-alt-fill', label: 'Location', value: [selectedEvent.location.address, selectedEvent.location.city, selectedEvent.location.country].filter(Boolean).join(', ') || 'No location' },
                { icon: 'bi-person-fill', label: 'Client', value: selectedEvent.clientName },
                { icon: 'bi-box-seam-fill', label: 'Package', value: selectedEvent.packageName },
                { icon: 'bi-tag-fill', label: 'Event Type', value: selectedEvent.eventType },
                { icon: 'bi-people-fill', label: 'Guests', value: `${selectedEvent.guestCount} / ${selectedEvent.maxGuests}` },
                { icon: 'bi-cash-stack', label: 'Amount', value: formatPrice(selectedEvent.totalAmount), highlight: true },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0.6rem 0.75rem',
                  background: colors.bgTertiary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: 10,
                  minWidth: 0,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.12) 0%, rgba(242,12,143,0.10) 100%)',
                    border: '1px solid rgba(8,58,133,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`bi ${item.icon}`} style={{ fontSize: 12, color: '#083A85' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</div>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 700, color: colors.textPrimary,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      ...(item.highlight ? {
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      } : {}),
                    }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedEvent.bookingStatus?.toUpperCase() === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                <button onClick={() => openBookingAction(selectedEvent, 'accept')} style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white', border: 'none', borderRadius: 11, cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(16,185,129,0.30)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <i className="bi bi-check2-circle" style={{ fontSize: 13 }} /> Accept
                </button>
                <button onClick={() => openBookingAction(selectedEvent, 'decline')} style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white', border: 'none', borderRadius: 11, cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(220,38,38,0.30)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <i className="bi bi-x-circle-fill" style={{ fontSize: 13 }} /> Deny
                </button>
              </div>
            )}
            {(selectedEvent.status === 'completed' || selectedEvent.bookingStatus?.toUpperCase() === 'ACCEPTED') && canCreateAlbumForEvent(selectedEvent.id) && (
              <button onClick={() => { setShowEventDetailModal(false); handleOpenCreateAlbum(selectedEvent.id); }} style={{
                ...primaryBtn,
                width: '100%',
                marginTop: '0.5rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(8,58,133,0.30)'; }}
              ><i className="bi bi-plus-circle-fill" style={{ fontSize: 13 }} /> Create Album from this Event</button>
            )}
            {(selectedEvent.status === 'completed' || selectedEvent.bookingStatus?.toUpperCase() === 'ACCEPTED') && !canCreateAlbumForEvent(selectedEvent.id) && (() => {
              const sent = eventHasAlbum(selectedEvent.id).sent;
              return (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.7rem 0.85rem',
                  background: sent
                    ? (actualTheme === 'dark' ? 'rgba(16,185,129,0.16)' : 'rgba(236,253,245,0.85)')
                    : (actualTheme === 'dark' ? 'rgba(234,179,8,0.14)' : 'rgba(254,243,199,0.55)'),
                  border: `1px solid ${sent ? (actualTheme === 'dark' ? 'rgba(16,185,129,0.40)' : 'rgba(16,185,129,0.30)') : (actualTheme === 'dark' ? 'rgba(245,158,11,0.40)' : 'rgba(245,158,11,0.30)')}`,
                  borderRadius: 11,
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: sent ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
                  }} />
                  <i className={`bi ${sent ? 'bi-send-check-fill' : 'bi-info-circle-fill'}`} style={{ fontSize: 14, color: sent ? '#059669' : '#D97706', marginLeft: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: sent ? (actualTheme === 'dark' ? '#86EFAC' : '#065F46') : (actualTheme === 'dark' ? '#FCD34D' : '#92400E') }}>
                    {sent ? 'Album already created and sent for this event.' : 'Album already created for this event. Delete it first to create a new one.'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Unpublished Event Modal */}
      {showUnpublishedModal && selectedEvent && (
        <EventConfirmModal
          tone="warning"
          icon="bi-shield-exclamation"
          eyebrow="Not yet published"
          title="Event Not Published"
          intro={<>Live streaming and album creation are only available for published events. Please ask the event creator to publish <strong style={{ color: colors.textPrimary }}>{selectedEvent.title}</strong> first.</>}
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowUnpublishedModal(false)}
          closeLabel="Got it"
          fullWidthClose
        />
      )}

      {/* Live Stream Control Modal */}
      {selectedEvent && (
        <StreamPreview
          isOpen={showStreamPreview}
          onClose={() => setShowStreamPreview(false)}
          eventTitle={selectedEvent.title}
          whipUrl={streamConfigs[selectedEvent.id]?.whipUrl}
          whepUrl={streamConfigs[selectedEvent.id]?.whepUrl}
          inviteToken={streamConfigs[selectedEvent.id]?.streamType === 'entry_fee' ? undefined : streamConfigs[selectedEvent.id]?.inviteToken}
          connectionStatus={streamConfigs[selectedEvent.id]?.connectionStatus || 'disconnected'}
          streamHealth={streamConfigs[selectedEvent.id]?.streamHealth}
          uploadSpeed={streamConfigs[selectedEvent.id]?.uploadSpeed}
          viewerCount={streamConfigs[selectedEvent.id]?.viewerCount || 0}
          peakViewers={streamConfigs[selectedEvent.id]?.peakViewers || 0}
          error={streamConfigs[selectedEvent.id]?.error}
          onStartStream={() => handleStartStream(selectedEvent.id)}
          onResumeStream={() => handleResumeStream(selectedEvent.id)}
          onPauseStream={() => handlePauseStream(selectedEvent.id)}
          onEndStream={() => handleEndStream(selectedEvent.id)}
          onResetStream={() => handleResetStream(selectedEvent.id)}
          theme={actualTheme as 'light' | 'dark'}
          colors={colors}
        />
      )}

      {/* Mark Complete Confirmation Modal */}
      {markCompleteTarget && (
        <EventConfirmModal
          tone="success"
          icon="bi-check2-all"
          eyebrow="Mark complete"
          title="Mark Event as Complete"
          intro={<>Are you sure the live stream for <strong style={{ color: colors.textPrimary }}>{markCompleteTarget.title}</strong> is complete?</>}
          detail="This will mark the event as completed."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setMarkCompleteTarget(null)}
          closeLabel="Cancel"
          primary={{
            label: markingCompletedId ? 'Processing...' : 'Confirm Complete',
            icon: markingCompletedId ? 'bi-arrow-clockwise' : 'bi-check2-circle',
            onClick: () => handleMarkCompleted(markCompleteTarget.id),
            tone: 'success',
          }}
        />
      )}

      {/* Booking Accept/Decline Confirmation Modal */}
      {bookingActionTarget && bookingActionType && (() => {
        const isAccept = bookingActionType === 'accept';
        const toneStripe = isAccept ? 'linear-gradient(90deg, #10B981 0%, #16A34A 100%)' : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)';
        const toneGradient = isAccept ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
        const toneShadow = isAccept ? '0 12px 28px rgba(16,185,129,0.40)' : '0 12px 28px rgba(220,38,38,0.40)';
        return (
        <div style={modalOverlay} onClick={closeBookingAction}>
          <div style={modalContent('500px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: toneStripe, zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: toneGradient,
                boxShadow: toneShadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`bi ${isAccept ? 'bi-check2-circle' : 'bi-x-octagon-fill'}`} style={{ fontSize: 26, color: '#fff' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: isAccept ? '#059669' : '#DC2626',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
              }}>{isAccept ? 'Confirm acceptance' : 'Confirm decline'}</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                {isAccept ? 'Accept Booking' : 'Decline Booking'}
              </h2>
            </div>

            {/* Event Summary */}
            <div style={{
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.12) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
              borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Event</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.65rem', letterSpacing: '-0.005em' }}>{bookingActionTarget.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.75rem', fontSize: '0.8rem', color: colors.textSecondary }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-calendar3" style={{ fontSize: 11, color: '#F20C8F' }} /> {formatDate(bookingActionTarget.date)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-clock" style={{ fontSize: 11, color: '#F20C8F' }} /> {formatTime(bookingActionTarget.startTime)} – {formatTime(bookingActionTarget.endTime)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-person-fill" style={{ fontSize: 11, color: '#F20C8F' }} /> {bookingActionTarget.clientName}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}><i className="bi bi-geo-alt-fill" style={{ fontSize: 11, color: '#F20C8F', flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingActionTarget.location.address || [bookingActionTarget.location.city, bookingActionTarget.location.country].filter(Boolean).join(', ') || 'N/A'}</span></div>
                {bookingActionTarget.packageName && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="bi bi-box-seam-fill" style={{ fontSize: 11, color: '#F20C8F' }} /> {bookingActionTarget.packageName}</div>}
                {bookingActionTarget.totalAmount > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: colors.textPrimary }}><i className="bi bi-cash-stack" style={{ fontSize: 11, color: '#F20C8F' }} /> {formatPrice(bookingActionTarget.totalAmount)}</div>}
              </div>
            </div>

            {/* Payment Terms Info — only show on accept */}
            {isAccept && bookingActionTarget.escrowPercentage && (
              <div style={{
                background: actualTheme === 'dark' ? 'rgba(8,58,133,0.18)' : 'rgba(239,246,255,0.85)',
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.40)' : 'rgba(8,58,133,0.22)'}`,
                borderRadius: 11,
                padding: '0.7rem 0.85rem',
                marginBottom: '1rem',
                position: 'relative', overflow: 'hidden',
              }}>
                <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #083A85 0%, #F20C8F 100%)' }} />
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, paddingLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: 11 }} /> Payment Terms
                </div>
                <div style={{ fontSize: '0.82rem', color: actualTheme === 'dark' ? '#BFDBFE' : '#1E40AF', lineHeight: 1.5, paddingLeft: 6 }}>
                  {bookingActionTarget.escrowPercentage === 100
                    ? '100% paid upfront by the client, held in escrow and released upon event completion.'
                    : `${bookingActionTarget.escrowPercentage}% paid upfront (held in escrow) + ${100 - bookingActionTarget.escrowPercentage}% upon event completion.`}
                </div>
              </div>
            )}

            {isAccept ? (
              <p style={{ fontSize: '0.88rem', color: colors.textSecondary, marginBottom: '1.25rem', lineHeight: 1.55, textAlign: 'center' }}>
                By accepting, you confirm your availability for this event. The client will be notified and a payment will be initiated.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '0.88rem', color: colors.textSecondary, marginBottom: '0.75rem', lineHeight: 1.55 }}>
                  The client will be notified and can assign another photographer. Please provide a reason (optional):
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Reason</label>
                  <select
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    style={{ ...inputStyle, marginBottom: '0.5rem', cursor: 'pointer' }}
                  >
                    <option value="">Select a reason (optional)</option>
                    <option value="Scheduling conflict">Scheduling conflict</option>
                    <option value="Location too far">Location too far</option>
                    <option value="Rate doesn't match">Rate doesn&apos;t match expectations</option>
                    <option value="Already booked">Already booked for this date</option>
                    <option value="Personal reasons">Personal reasons</option>
                    <option value="Other">Other</option>
                  </select>
                  {declineReason === 'Other' && (
                    <textarea
                      placeholder="Please specify your reason..."
                      onChange={e => setDeclineReason(e.target.value === '' ? 'Other' : e.target.value)}
                      style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeBookingAction} style={secondaryBtn}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
              >Cancel</button>
              <button
                onClick={handleConfirmBookingAction}
                disabled={bookingActionLoading}
                style={{
                  padding: '0.7rem 1.4rem',
                  borderRadius: 11,
                  border: 'none',
                  background: bookingActionLoading
                    ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                    : toneGradient,
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: bookingActionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  boxShadow: bookingActionLoading ? 'none' : (isAccept ? '0 8px 18px rgba(16,185,129,0.32)' : '0 8px 18px rgba(220,38,38,0.32)'),
                  opacity: bookingActionLoading ? 0.7 : 1,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { if (!bookingActionLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {bookingActionLoading ? (
                  <><i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} /> Processing...</>
                ) : (
                  <><i className={`bi ${isAccept ? 'bi-check2-circle' : 'bi-x-circle-fill'}`} style={{ fontSize: 13 }} /> {isAccept ? 'Confirm Accept' : 'Confirm Decline'}</>
                )}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Create Album Modal */}
      {showCreateAlbumModal && (
        <div style={modalOverlay} onClick={() => setShowCreateAlbumModal(false)}>
          <div style={modalContent('620px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-plus-circle-fill" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>New collection</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Create Album</h2>
                </div>
              </div>
              <button onClick={() => setShowCreateAlbumModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>
            {/* Album Type Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.1rem' }}>
              <button onClick={() => { setCreateAlbumMode('event'); setCreateAlbumEventId(''); setAlbumTitle(''); setAlbumDescription(''); setAlbumCategory(''); setUploadedImagePreviews([]); setSelectedFiles(null); }} style={{
                flex: 1, padding: '0.8rem 0.9rem',
                borderRadius: 12,
                border: `1px solid ${createAlbumMode === 'event' ? 'rgba(8,58,133,0.45)' : colors.borderPrimary}`,
                background: createAlbumMode === 'event'
                  ? (actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(8,58,133,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                    : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.04) 100%)')
                  : colors.bgCard,
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                color: createAlbumMode === 'event' ? '#083A85' : colors.textPrimary,
                transition: 'all 0.18s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: createAlbumMode === 'event' ? '0 6px 14px rgba(8,58,133,0.14)' : 'none',
              }}>
                <i className="bi bi-calendar-event-fill" style={{ fontSize: 13, color: createAlbumMode === 'event' ? '#F20C8F' : colors.textSecondary }} />
                Event Album
              </button>
              <button onClick={() => { setCreateAlbumMode('standalone'); setCreateAlbumEventId(''); setAlbumTitle(''); setAlbumDescription(''); setAlbumCategory(''); setStandaloneLocation(''); setStandaloneDate(''); setUploadedImagePreviews([]); setSelectedFiles(null); }} style={{
                flex: 1, padding: '0.8rem 0.9rem',
                borderRadius: 12,
                border: `1px solid ${createAlbumMode === 'standalone' ? 'rgba(139,92,246,0.50)' : colors.borderPrimary}`,
                background: createAlbumMode === 'standalone'
                  ? (actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(242,12,143,0.14) 100%)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(242,12,143,0.04) 100%)')
                  : colors.bgCard,
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 800,
                letterSpacing: '-0.005em',
                color: createAlbumMode === 'standalone' ? '#7C3AED' : colors.textPrimary,
                transition: 'all 0.18s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: createAlbumMode === 'standalone' ? '0 6px 14px rgba(139,92,246,0.16)' : 'none',
              }}>
                <i className="bi bi-person-vcard-fill" style={{ fontSize: 13, color: createAlbumMode === 'standalone' ? '#F20C8F' : colors.textSecondary }} />
                Personal Album
              </button>
            </div>
            {createAlbumMode === 'standalone' && (
              <>
                <div style={{
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.16) 0%, rgba(242,12,143,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(242,12,143,0.04) 100%)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(139,92,246,0.30)' : 'rgba(139,92,246,0.20)'}`,
                  borderRadius: 11,
                  padding: '0.7rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', gap: 9,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #8B5CF6 0%, #F20C8F 100%)',
                  }} />
                  <i className="bi bi-info-circle-fill" style={{ fontSize: 14, color: '#8B5CF6', flexShrink: 0, marginLeft: 4 }} />
                  <span style={{ fontSize: '0.82rem', color: colors.textPrimary, lineHeight: 1.5 }}>
                    Personal albums can be <strong style={{ color: '#083A85', fontWeight: 700 }}>PAID</strong> with facial recognition enabled, or <strong style={{ color: '#059669', fontWeight: 700 }}>FREE</strong> with private email access.
                  </span>
                </div>
                {/* Album Type Selector */}
                <AlbumTypeSelector
                  selectedType={standaloneAlbumType}
                  onChange={setStandaloneAlbumType}
                />
              </>
            )}
            {/* Select Event (event mode only) */}
            {createAlbumMode === 'event' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Select Event <span style={{ color: '#EF4444' }}>*</span></label>
                <select value={createAlbumEventId} onChange={e => handleEventSelectForAlbum(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Choose an event...</option>
                  {events.filter(e => (e.bookingStatus?.toUpperCase() === 'ACCEPTED' || e.status === 'completed') && canCreateAlbumForEvent(e.id)).map(e => <option key={e.id} value={e.id}>{e.title} - {formatDate(e.date)}</option>)}
                </select>
              </div>
            )}
            {(createAlbumMode === 'standalone' || createAlbumEventId) && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Album Title <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} style={inputStyle} placeholder="Enter album title" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Category</label>
                    {createAlbumMode === 'standalone' ? (
                      <select value={albumCategory} onChange={e => setAlbumCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Select category...</option>
                        {['Wedding', 'Portrait', 'Corporate', 'Birthday', 'Concert', 'Sports', 'Fashion', 'Conference', 'Graduation', 'Festival', 'Religious', 'Cultural', 'Entertainment', 'Other'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <input value={albumCategory} onChange={e => setAlbumCategory(e.target.value)} style={inputStyle} />
                    )}
                  </div>
                  {createAlbumMode === 'event' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Client</label>
                      <input readOnly value={events.find(e => e.id === createAlbumEventId)?.clientName || ''} style={{ ...inputStyle, opacity: 0.7 }} />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Date</label>
                      <input type="date" value={standaloneDate} onChange={e => setStandaloneDate(e.target.value)} style={inputStyle} />
                    </div>
                  )}
                </div>
                {createAlbumMode === 'standalone' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Location</label>
                    <input value={standaloneLocation} onChange={e => setStandaloneLocation(e.target.value)} style={inputStyle} placeholder="e.g. Kigali, Rwanda" />
                  </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Description</label>
                  <textarea value={albumDescription} onChange={e => setAlbumDescription(e.target.value)} style={{ ...inputStyle, minHeight: 84, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {/* PAID/FREE Album Forms */}
                {createAlbumMode === 'standalone' && (
                  <>
                    {standaloneAlbumType === 'PAID' ? (
                      <PaidAlbumForm
                        pricePerImage={paidAlbumPrice}
                        onPriceChange={setPaidAlbumPrice}
                        currencyId={paidAlbumCurrencyId}
                        onCurrencyChange={setPaidAlbumCurrencyId}
                        currencies={currencies}
                        colors={{ textPrimary: colors.textPrimary, textSecondary: colors.textSecondary, border: colors.borderPrimary, background: colors.bgTertiary }}
                      />
                    ) : (
                      <FreeAlbumForm
                        recipientEmail={freeAlbumEmail}
                        onEmailChange={setFreeAlbumEmail}
                        maxFreeDownloads={freeMaxDownloads}
                        onMaxFreeDownloadsChange={setFreeMaxDownloads}
                        pricePerExtraImage={freeExtraPrice}
                        onPricePerExtraImageChange={setFreeExtraPrice}
                        currencyId={freeExtraCurrencyId || paidAlbumCurrencyId}
                        onCurrencyChange={setFreeExtraCurrencyId}
                        currencies={currencies}
                        colors={{ textPrimary: colors.textPrimary, textSecondary: colors.textSecondary, border: colors.borderPrimary, background: colors.bgTertiary }}
                      />
                    )}
                  </>
                )}
                {/* Image Upload */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Upload Photos</label>
                  <div style={{
                    border: `2px dashed ${actualTheme === 'dark' ? 'rgba(242,12,143,0.30)' : 'rgba(242,12,143,0.35)'}`,
                    borderRadius: 12,
                    padding: '1.6rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: actualTheme === 'dark'
                      ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                  onClick={() => document.getElementById('album-file-input')?.click()}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = actualTheme === 'dark' ? 'rgba(242,12,143,0.30)' : 'rgba(242,12,143,0.35)'; }}
                  >
                    <div style={{
                      width: 44, height: 44, margin: '0 auto 0.5rem',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 18px rgba(242,12,143,0.30)',
                    }}>
                      <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: 20, color: '#fff' }} />
                    </div>
                    <p style={{ fontSize: '0.88rem', color: colors.textPrimary, margin: '0.5rem 0 0 0', fontWeight: 700, letterSpacing: '-0.005em' }}>Click to upload photos</p>
                    <p style={{ fontSize: '0.76rem', color: colors.textSecondary, margin: '2px 0 0 0' }}>or drag & drop your files here</p>
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
                  <button
                    onClick={handleCreateAlbum}
                    disabled={
                      !albumTitle ||
                      (createAlbumMode === 'event' && !createAlbumEventId) ||
                      (createAlbumMode === 'standalone' && standaloneAlbumType === 'PAID' && (!paidAlbumPrice || !paidAlbumCurrencyId || paidAlbumPriceInvalid)) ||
                      (createAlbumMode === 'standalone' && standaloneAlbumType === 'FREE' && !freeAlbumEmail) ||
                      isUploadingAlbum
                    }
                    style={{
                      ...primaryBtn,
                      opacity: (
                        !albumTitle ||
                        (createAlbumMode === 'event' && !createAlbumEventId) ||
                        (createAlbumMode === 'standalone' && standaloneAlbumType === 'PAID' && (!paidAlbumPrice || !paidAlbumCurrencyId || paidAlbumPriceInvalid)) ||
                        (createAlbumMode === 'standalone' && standaloneAlbumType === 'FREE' && !freeAlbumEmail) ||
                        isUploadingAlbum
                      ) ? 0.5 : 1
                    }}
                  >
                    {isUploadingAlbum ? (uploadProgress || 'Uploading...') : (createAlbumMode === 'standalone' && standaloneAlbumType === 'PAID' ? 'Publish to Face AI' : createAlbumMode === 'standalone' && standaloneAlbumType === 'FREE' ? 'Create & Send Invitation' : 'Create Album')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Send FREE Album Invitation Modal */}
      {showSendFreeInvitationModal && freeAlbumToSend && (
        <SendFreeInvitationModal
          albumTitle={freeAlbumToSend.title}
          recipientEmail={freeAlbumToSend.email}
          accessCode={freeAlbumToSend.accessCode}
          onClose={() => {
            setShowSendFreeInvitationModal(false);
            setFreeAlbumToSend(null);
          }}
          onSend={async () => {
            // Send invitation via API
            try {
              const res = await dashboardAuthFetch(
                `${apiUrl}/api/remote/photographer/albums/${freeAlbumToSend.albumId}/send-free`,
                { method: 'POST' }
              );
              if (!res.ok) {
                throw new Error('Failed to send invitation');
              }
            } catch (err) {
              throw err;
            }
          }}
        />
      )}

      {/* Album Success Modal */}
      {albumSuccessModal && (
        <div style={modalOverlay} onClick={() => setAlbumSuccessModal(null)}>
          <div style={{ ...modalContent('480px'), textAlign: 'center' as const }} onClick={e => e.stopPropagation()}>
            {/* Success icon */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: albumSuccessModal.type === 'paid' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={albumSuccessModal.type === 'paid' ? '#3B82F6' : '#10B981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: colors.textPrimary, margin: '0 0 0.35rem' }}>
              {albumSuccessModal.type === 'paid' ? 'Published to Face AI' : 'Album Created & Invitation Sent'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1.25rem' }}>
              {albumSuccessModal.type === 'paid'
                ? `"${albumSuccessModal.title}" is now live on Find My Photos with ${albumSuccessModal.photoCount} photos.`
                : `"${albumSuccessModal.title}" has been created and an invitation has been sent.`}
            </p>

            {/* Details card */}
            <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.75rem', padding: '1.5rem 1.25rem', marginBottom: '1.25rem', textAlign: 'center' as const }}>
              {albumSuccessModal.type === 'paid' && albumSuccessModal.inviteCode && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Invite Code</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{albumSuccessModal.inviteCode}</div>
                </div>
              )}
              {albumSuccessModal.type === 'paid' && albumSuccessModal.inviteCode && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Find My Photos Link</div>
                  <div style={{ fontSize: '0.78rem', color: colors.textPrimary, wordBreak: 'break-all' }}>{`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${albumSuccessModal.inviteCode}`}</div>
                </div>
              )}
              {albumSuccessModal.type === 'free' && albumSuccessModal.email && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Invitation Sent To</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary }}>{albumSuccessModal.email}</div>
                </div>
              )}
              {albumSuccessModal.type === 'free' && albumSuccessModal.accessCode && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Access Code</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.3em', fontFamily: 'monospace' }}>{albumSuccessModal.accessCode}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.7rem', color: colors.textTertiary, marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Photos</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.textPrimary }}>{albumSuccessModal.photoCount} uploaded</div>
              </div>
            </div>

            {/* Copy + Done buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {(albumSuccessModal.inviteCode || albumSuccessModal.accessCode) && (
                <button
                  onClick={() => {
                    const code = albumSuccessModal.type === 'paid' ? albumSuccessModal.inviteCode : albumSuccessModal.accessCode;
                    if (!code) return;
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(code).then(() => {
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }).catch(() => {
                          // Fallback for clipboard API failure
                          const ta = document.createElement('textarea');
                          ta.value = code;
                          ta.style.position = 'fixed';
                          ta.style.opacity = '0';
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        });
                      } else {
                        // Fallback for browsers without clipboard API
                        const ta = document.createElement('textarea');
                        ta.value = code;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                      }
                    } catch {
                      // Last resort fallback
                      window.prompt('Copy this code:', code);
                    }
                  }}
                  style={{ ...secondaryBtn, minWidth: '160px' }}
                >
                  {codeCopied ? 'Copied!' : `Copy ${albumSuccessModal.type === 'paid' ? 'Invite Code' : 'Access Code'}`}
                </button>
              )}
              <button onClick={() => setAlbumSuccessModal(null)} style={primaryBtn}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Album Browse / Image Viewer Modal */}
      {showAlbumBrowseModal && viewerAlbum && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}>
          {/* Radial cinematic backdrop tint */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(8,58,133,0.18) 0%, rgba(0,0,0,0) 65%)',
            pointerEvents: 'none',
          }} />
          {/* Top brand stripe */}
          <span aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 15,
            background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
            boxShadow: '0 0 18px rgba(242,12,143,0.45)',
          }} />

          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={viewerAlbum.images[currentImageIndex]}
              alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
              style={{ maxWidth: 'calc(100% - 8rem)', maxHeight: 'calc(100% - 9rem)', objectFit: 'contain', borderRadius: 10, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.55)' }}
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.30) 60%, transparent 100%)',
            padding: '1.1rem 1.5rem 2.2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                padding: 2,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(8,58,133,0.32)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', backgroundColor: viewerAlbum.coverImage ? 'transparent' : '#0D1B2A', position: 'relative' }}>
                  <img src={viewerAlbum.coverImage || '/coverr.jpg'} alt={viewerAlbum.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: viewerAlbum.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.6rem', fontWeight: 800, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 2,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <i className="bi bi-images" style={{ fontSize: 10 }} /> Album viewer
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{viewerAlbum.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.12)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 9999,
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}>
                    <i className="bi bi-person-fill" style={{ fontSize: 9 }} /> {viewerAlbum.clientName}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.7rem', color: 'white',
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    padding: '0.15rem 0.6rem',
                    borderRadius: 9999,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    boxShadow: '0 3px 8px rgba(8,58,133,0.30)',
                  }}>
                    {currentImageIndex + 1} / {viewerAlbum.images.length}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAlbumBrowseModal(false)}
              aria-label="Close viewer"
              style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.18s, transform 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'rotate(0)'; }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* Navigation - Left */}
          <button
            onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
            aria-label="Previous photo"
            style={{
              position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'white',
              cursor: currentImageIndex > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: currentImageIndex > 0 ? 0.78 : 0,
              boxShadow: '0 8px 18px rgba(0,0,0,0.30)',
            }}
            onMouseEnter={(e) => { if (currentImageIndex > 0) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex > 0 ? '0.78' : '0'; e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >
            <i className="bi bi-chevron-left" style={{ fontSize: 20, fontWeight: 800 }} />
          </button>

          {/* Navigation - Right */}
          <button
            onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
            aria-label="Next photo"
            style={{
              position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'white',
              cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 0.78 : 0,
              boxShadow: '0 8px 18px rgba(0,0,0,0.30)',
            }}
            onMouseEnter={(e) => { if (currentImageIndex < viewerAlbum.images.length - 1) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex < viewerAlbum.images.length - 1 ? '0.78' : '0'; e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
          >
            <i className="bi bi-chevron-right" style={{ fontSize: 20, fontWeight: 800 }} />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '2.5rem 1.5rem 1.4rem'
          }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {viewerAlbum.images.map((image: string, index: number) => {
                const active = currentImageIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Photo ${index + 1}`}
                    style={{
                      position: 'relative', width: 64, height: 48,
                      borderRadius: 8,
                      padding: active ? 2 : 0,
                      background: active ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)' : 'transparent',
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.20)',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.18s',
                      opacity: active ? 1 : 0.55,
                      transform: active ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: active ? '0 6px 14px rgba(242,12,143,0.32)' : 'none',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1.04)'; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.transform = 'scale(1)'; } }}
                  >
                    <div style={{ width: '100%', height: '100%', borderRadius: active ? 6 : 8, overflow: 'hidden' }}>
                      <img src={image} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Send Album Modal */}
      {showSendModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowSendModal(false)}>
          <div style={modalContent('480px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-send-fill" style={{ fontSize: 15 }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Deliver photos</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Send Album</h2>
                </div>
              </div>
              <button onClick={() => setShowSendModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>

            {/* Album Preview */}
            <div style={{
              display: 'flex', gap: '0.85rem',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
              borderRadius: 12,
              padding: '0.85rem 0.95rem',
              marginBottom: '1.1rem',
              alignItems: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 11,
                padding: 2,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(8,58,133,0.22)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', backgroundColor: selectedAlbum.coverImage ? 'transparent' : '#0D1B2A', position: 'relative' }}>
                  <img src={selectedAlbum.coverImage || '/coverr.jpg'} alt={selectedAlbum.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedAlbum.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{selectedAlbum.category || 'Album'}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.005em' }}>{selectedAlbum.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.76rem', color: colors.textSecondary }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="bi bi-images" style={{ fontSize: 10, color: '#F20C8F' }} /> {selectedAlbum.photoCount} photos
                  </span>
                  {selectedAlbum.eventTitle && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <i className="bi bi-calendar-event-fill" style={{ fontSize: 10, color: '#F20C8F', marginRight: 4 }} />
                        {selectedAlbum.eventTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '0.45rem',
              }}>Recipient</label>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: colors.bgCard,
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: 12,
                padding: '0.85rem 1rem',
                gap: 12,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    padding: 2,
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 6px 14px rgba(8,58,133,0.28), 0 0 0 1px rgba(255,255,255,0.18)',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0a4da8 0%, #DB0A7F 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      letterSpacing: '-0.01em',
                      textShadow: '0 1px 2px rgba(0,0,0,0.30)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.18)',
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {selectedAlbum.clientName.charAt(0).toUpperCase()}
                      {(() => { const img = selectedAlbum.clientImage || events.find(e => e.id === selectedAlbum.eventId)?.clientImage || ''; return img ? <img src={img} alt={selectedAlbum.clientName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null; })()}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAlbum.clientName}</div>
                    <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <i className="bi bi-bookmark-heart-fill" style={{ fontSize: 9, color: '#F20C8F' }} />
                      Booked client
                    </div>
                  </div>
                </div>
                {selectedAlbum.sharedWithClient ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 9999,
                    fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                    boxShadow: '0 4px 10px rgba(16,185,129,0.32)',
                    flexShrink: 0,
                  }}>
                    <i className="bi bi-check2-circle" style={{ fontSize: 11 }} /> Delivered
                  </div>
                ) : (
                  <button onClick={() => handleSendToClient(selectedAlbum)} style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: 9999,
                    border: 'none',
                    background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: 'white',
                    fontSize: '0.82rem', fontWeight: 700,
                    letterSpacing: '-0.005em',
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 6px 14px rgba(8,58,133,0.30)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 22px rgba(242,12,143,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.30)'; }}
                  >
                    <i className="bi bi-send-fill" style={{ fontSize: 12 }} />
                    Send Now
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Face Recognition Modal */}
      {showFaceRecognitionModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowFaceRecognitionModal(false)}>
          <div style={modalContent('500px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8B5CF6 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(139,92,246,0.32)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-person-bounding-box" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Find-my-photos</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Face Recognition</h2>
                </div>
              </div>
              <button onClick={() => setShowFaceRecognitionModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>
            {/* Album Info */}
            <div style={{
              display: 'flex', gap: '0.85rem',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(139,92,246,0.32)' : 'rgba(139,92,246,0.18)'}`,
              borderRadius: 12,
              padding: '0.85rem 0.95rem',
              marginBottom: '1rem',
              alignItems: 'center',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 11,
                padding: 2,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(139,92,246,0.24)',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', backgroundColor: selectedAlbum.coverImage ? 'transparent' : '#0D1B2A', position: 'relative' }}>
                  <img src={selectedAlbum.coverImage || '/coverr.jpg'} alt={selectedAlbum.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: selectedAlbum.coverImage ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  {selectedAlbum.isStandalone ? 'Personal Album' : (selectedAlbum.category || 'Event Album')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAlbum.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: '0.76rem', color: colors.textSecondary, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <i className="bi bi-images" style={{ fontSize: 10, color: '#F20C8F' }} /> {selectedAlbum.photoCount} photos
                  </span>
                  {selectedAlbum.clientName && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className="bi bi-person-fill" style={{ fontSize: 10, color: '#F20C8F' }} /> {selectedAlbum.clientName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {selectedAlbum.faceRecognitionEnabled ? (
              <>
                {/* Already live — show status + invite code + link */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0.7rem 0.85rem',
                  background: actualTheme === 'dark' ? 'rgba(16,185,129,0.18)' : 'rgba(209,250,229,0.85)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(16,185,129,0.40)' : 'rgba(16,185,129,0.32)'}`,
                  borderRadius: 11,
                  fontSize: '0.86rem',
                  color: actualTheme === 'dark' ? '#86EFAC' : '#065F46',
                  fontWeight: 700, letterSpacing: '-0.005em',
                  marginBottom: '1rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
                  }} />
                  <i className="bi bi-shield-fill-check" style={{ fontSize: 14, color: '#10B981', marginLeft: 4 }} />
                  Album is live on Find-My-Photos
                </div>
                {selectedAlbum.inviteCode && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Invite Code</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input readOnly value={selectedAlbum.inviteCode} style={{
                          ...inputStyle,
                          flex: 1,
                          fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.2em',
                          textAlign: 'center',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          background: actualTheme === 'dark'
                            ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                            : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                          color: '#083A85',
                          WebkitBackgroundClip: 'padding-box',
                          backgroundClip: 'padding-box',
                          padding: '0.85rem 1rem',
                        }} />
                        <button onClick={() => handleCopyInviteCode(selectedAlbum.inviteCode!)} style={{
                          ...smallActionBtn,
                          padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                          background: copiedInviteCode ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                          color: copiedInviteCode ? 'white' : colors.textPrimary,
                          border: copiedInviteCode ? 'none' : `1px solid ${colors.borderPrimary}`,
                          boxShadow: copiedInviteCode ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                        }}
                        onMouseEnter={(e) => { if (!copiedInviteCode) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                        onMouseLeave={(e) => { if (!copiedInviteCode) e.currentTarget.style.borderColor = colors.borderPrimary; }}
                        >
                          {copiedInviteCode ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Find-My-Photos Link</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input readOnly value={`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${selectedAlbum.inviteCode}`} style={{ ...inputStyle, flex: 1, fontSize: '0.78rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
                        <button onClick={() => handleCopyLink(`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${selectedAlbum.inviteCode}`)} style={{
                          ...smallActionBtn,
                          padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                          background: copiedLink ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                          color: copiedLink ? 'white' : colors.textPrimary,
                          border: copiedLink ? 'none' : `1px solid ${colors.borderPrimary}`,
                          boxShadow: copiedLink ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                        }}
                        onMouseEnter={(e) => { if (!copiedLink) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                        onMouseLeave={(e) => { if (!copiedLink) e.currentTarget.style.borderColor = colors.borderPrimary; }}
                        >
                          {copiedLink ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Not yet sent — show form */}
                <p style={{ fontSize: '0.88rem', color: colors.textSecondary, marginBottom: '1rem', lineHeight: 1.55 }}>
                  Upload this album to <strong style={{ color: colors.textPrimary }}>Find-My-Photos</strong> so event attendees can use face recognition to find their photos. Share the invite code below to help them filter results.
                </p>
                {/* Invite Code */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Invite Code</label>
                  {selectedAlbum.inviteCode ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input readOnly value={selectedAlbum.inviteCode} style={{
                        ...inputStyle,
                        flex: 1,
                        fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.2em',
                        textAlign: 'center',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        background: actualTheme === 'dark'
                          ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                          : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                        color: '#083A85',
                        padding: '0.85rem 1rem',
                      }} />
                      <button onClick={() => handleCopyInviteCode(selectedAlbum.inviteCode!)} style={{
                        ...smallActionBtn,
                        padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                        background: copiedInviteCode ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                        color: copiedInviteCode ? 'white' : colors.textPrimary,
                        border: copiedInviteCode ? 'none' : `1px solid ${colors.borderPrimary}`,
                        boxShadow: copiedInviteCode ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                      }}>
                        {copiedInviteCode ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      background: actualTheme === 'dark' ? 'rgba(220,38,38,0.18)' : 'rgba(254,242,242,0.85)',
                      border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
                      borderRadius: 10,
                      fontSize: '0.84rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
                      fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 13 }} />
                      Failed to generate invite code. Close and try again.
                    </div>
                  )}
                </div>
                {/* Find-My-Photos Link */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Find-My-Photos Link</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input readOnly value={`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${selectedAlbum.inviteCode}`} style={{ ...inputStyle, flex: 1, fontSize: '0.78rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
                    <button onClick={() => handleCopyLink(`${process.env.NEXT_PUBLIC_LANDING_URL as string}/user/find-my-photos?code=${selectedAlbum.inviteCode}`)} style={{
                      ...smallActionBtn,
                      padding: '0.6rem 0.95rem', fontSize: '0.82rem',
                      background: copiedLink ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : colors.bgCard,
                      color: copiedLink ? 'white' : colors.textPrimary,
                      border: copiedLink ? 'none' : `1px solid ${colors.borderPrimary}`,
                      boxShadow: copiedLink ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                    }}>
                      {copiedLink ? <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Copied!</> : <><i className="bi bi-clipboard-fill" style={{ fontSize: 11 }} /> Copy</>}
                    </button>
                  </div>
                </div>
                {/* Price Per Image */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>
                    Price Per Image {selectedAlbum.isStandalone ? '(optional)' : <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: '0 0 0.55rem 0' }}>{selectedAlbum.isStandalone ? 'Optionally set a price per photo. Leave empty for free downloads.' : 'Set the price users will pay to download each photo on Find-My-Photos.'}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div ref={faceAICurrencyRef} style={{ position: 'relative', minWidth: '120px' }}>
                      <button type="button" onClick={() => setShowFaceAICurrencyDropdown(!showFaceAICurrencyDropdown)}
                        style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', width: '100%', textAlign: 'left' as const, padding: '0.75rem' }}>
                        {(() => {
                          const selCode = currencies.find(c => (c.id || c.code) === faceAICurrency)?.code || '';
                          return (
                            <>
                              {CURRENCY_FLAG_MAP[selCode] && <img src={`https://flagcdn.com/w40/${CURRENCY_FLAG_MAP[selCode]}.png`} alt="" style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />}
                              <span style={{ flex: 1, fontSize: '0.85rem' }}>{selCode || 'Currency'}</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: showFaceAICurrencyDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                                <path d="M6 9L12 15L18 9" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </>
                          );
                        })()}
                      </button>
                      {showFaceAICurrencyDropdown && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 0.35rem)', left: 0, backgroundColor: colors.bgSecondary, borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `2px solid ${colors.borderPrimary}`, padding: '0.4rem', minWidth: '200px', zIndex: 100 }}>
                          {(currencies.length > 0 ? currencies.map(c => ({ val: c.id || c.code, code: c.code, name: c.name })) : [{ val: 'USD', code: 'USD', name: '' }, { val: 'RWF', code: 'RWF', name: '' }, { val: 'EUR', code: 'EUR', name: '' }, { val: 'GBP', code: 'GBP', name: '' }, { val: 'KES', code: 'KES', name: '' }]).map(opt => {
                            const flag = CURRENCY_FLAG_MAP[opt.code] || '';
                            const isSelected = faceAICurrency === opt.val;
                            return (
                              <button key={opt.val} type="button" onClick={() => { setFaceAICurrency(opt.val); setShowFaceAICurrencyDropdown(false); }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', border: 'none', background: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent', color: colors.textPrimary, fontSize: '0.85rem', fontWeight: isSelected ? '600' : '400', cursor: 'pointer', gap: '0.5rem' }}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {flag && <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />}
                                  <span style={{ fontWeight: '600' }}>{opt.code}</span>
                                  {opt.name && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{opt.name}</span>}
                                </div>
                                {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <input type="number" min={selectedAlbum.isStandalone ? 0 : 1} step="0.01" value={faceAIPrice} onChange={e => setFaceAIPrice(e.target.value)} placeholder={selectedAlbum.isStandalone ? 'Free if empty' : 'Min 1.00'} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                  {faceAIPrice && parseFloat(faceAIPrice) < 1 && !selectedAlbum.isStandalone && (
                    <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Minimum price is 1.00</p>
                  )}
                </div>
                {/* Upload Button */}
                <button onClick={async () => {
                  const updated = { ...selectedAlbum, faceRecognitionEnabled: true };
                  setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? updated : a));
                  setSelectedAlbum(updated);
                  setShowFaceRecognitionModal(false);
                  try {
                    // Publish with pricing — triggers Rekognition face indexing without notifying client
                    const publishBody: Record<string, unknown> = {};
                    if (faceAIPrice && parseFloat(faceAIPrice) > 0) {
                      publishBody.pricePerImage = parseFloat(faceAIPrice);
                      publishBody.currencyId = faceAICurrency;
                    }
                    await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/albums/${selectedAlbum.id}/publish`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(publishBody),
                    });
                  } catch (err) {
                    console.error('Failed to enable face recognition on album:', err);
                  }
                  setAlbumSuccessMessage({
                    title: 'Album Uploaded to Find-My-Photos',
                    description: `"${selectedAlbum.title}" is now live. Share the invite code with event attendees so they can find their photos using face recognition.`,
                  });
                  setShowAlbumSuccessModal(true);
                }} disabled={(() => {
                  if (!selectedAlbum.inviteCode) return true;
                  if (selectedAlbum.isStandalone) {
                    // Standalone: price optional, but if provided must be valid
                    if (faceAIPrice && parseFloat(faceAIPrice) > 0 && !faceAICurrency) return true;
                    return false;
                  }
                  // Event album: price + currency required
                  return !faceAIPrice || parseFloat(faceAIPrice) < 1 || !faceAICurrency;
                })()} style={(() => {
                  const isDisabled = (() => {
                    if (!selectedAlbum.inviteCode) return true;
                    if (selectedAlbum.isStandalone) {
                      if (faceAIPrice && parseFloat(faceAIPrice) > 0 && !faceAICurrency) return true;
                      return false;
                    }
                    return !faceAIPrice || parseFloat(faceAIPrice) < 1 || !faceAICurrency;
                  })();
                  return { ...primaryBtn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: isDisabled ? (actualTheme === 'dark' ? '#374151' : '#D1D5DB') : '#8B5CF6', borderColor: isDisabled ? (actualTheme === 'dark' ? '#374151' : '#D1D5DB') : '#8B5CF6', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1 };
                })()}>
                  <FaceRecognitionIcon /> Upload to Find-My-Photos
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {showAlbumEditModal && selectedAlbum && (
        <div style={modalOverlay} onClick={() => setShowAlbumEditModal(false)}>
          <div style={modalContent('620px')} onClick={e => e.stopPropagation()}>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)', zIndex: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 14px rgba(8,58,133,0.28)',
                  flexShrink: 0,
                }}>
                  <i className="bi bi-pencil-square" style={{ fontSize: 16, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Edit details</div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>Edit Album</h2>
                </div>
              </div>
              <button onClick={() => setShowAlbumEditModal(false)} aria-label="Close" style={{
                background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`, borderRadius: 9,
                cursor: 'pointer', width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
              ><i className="bi bi-x-lg" style={{ fontSize: 13 }} /></button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Category</label>
                <input value={editCategory} onChange={e => setEditCategory(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Photos</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', opacity: 0.7, cursor: 'default' }}>{editImages.length} image{editImages.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            {/* Images Section */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Album Images</label>
                <button onClick={() => document.getElementById('edit-album-file-input')?.click()} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '0.4rem 0.7rem', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '-0.005em',
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                ><i className="bi bi-plus-circle-fill" style={{ fontSize: 12 }} /> Add Photos</button>
                <input id="edit-album-file-input" type="file" multiple accept="image/*" onChange={handleEditFileAdd} style={{ display: 'none' }} />
              </div>
              {editImages.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, maxHeight: 260, overflowY: 'auto', padding: 4 }}>
                  {editImages.map((image, i) => {
                    const isCover = editCoverIndex === i;
                    return (
                      <div key={i} style={{
                        position: 'relative',
                        borderRadius: 10,
                        overflow: 'hidden',
                        aspectRatio: '1',
                        padding: isCover ? 2 : 0,
                        background: isCover ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)' : 'transparent',
                        border: isCover ? 'none' : `1px solid ${colors.borderPrimary}`,
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        boxShadow: isCover ? '0 6px 14px rgba(242,12,143,0.30)' : 'none',
                      }}
                      onClick={() => setEditCoverIndex(i)}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: isCover ? 8 : 9, overflow: 'hidden' }}>
                          <img src={image} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {isCover && (
                            <div style={{
                              position: 'absolute', top: 4, left: 4,
                              background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                              color: 'white',
                              fontSize: '0.55rem', fontWeight: 800,
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              padding: '0.15rem 0.4rem',
                              borderRadius: 9999,
                              boxShadow: '0 3px 8px rgba(8,58,133,0.32)',
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              border: '1px solid rgba(255,255,255,0.30)',
                            }}>
                              <i className="bi bi-star-fill" style={{ fontSize: 7 }} /> Cover
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleEditImageRemove(i); }} style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 22, height: 22,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            border: '1px solid rgba(255,255,255,0.30)',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 3px 8px rgba(220,38,38,0.36)',
                            transition: 'transform 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          aria-label="Remove image"
                          ><i className="bi bi-x" style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  border: `2px dashed ${actualTheme === 'dark' ? 'rgba(242,12,143,0.30)' : 'rgba(242,12,143,0.35)'}`,
                  borderRadius: 12,
                  padding: '1.5rem 1rem', textAlign: 'center',
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.04) 100%)',
                }}>
                  <i className="bi bi-images" style={{ fontSize: 22, color: '#F20C8F' }} />
                  <p style={{ fontSize: '0.85rem', color: colors.textPrimary, margin: '0.4rem 0 0 0', fontWeight: 600 }}>No images yet</p>
                  <p style={{ fontSize: '0.76rem', color: colors.textSecondary, margin: '2px 0 0 0' }}>Click <strong style={{ color: '#F20C8F' }}>Add Photos</strong> to upload.</p>
                </div>
              )}
              <p style={{ fontSize: '0.74rem', color: colors.textSecondary, margin: '0.5rem 0 0 0', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-info-circle" style={{ fontSize: 10, color: '#F20C8F' }} />
                Click an image to set as cover. Click <strong style={{ fontWeight: 700 }}>×</strong> to remove.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAlbumEditModal(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={editImages.length === 0} style={{ ...primaryBtn, opacity: editImages.length === 0 ? 0.5 : 1 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Delete Album Warning Modal */}
      {showDeleteConfirm && albumToDelete && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Delete album"
          title="Delete Album?"
          intro={<>You are about to permanently delete <strong style={{ color: colors.textPrimary }}>&quot;{albumToDelete.title}&quot;</strong>.</>}
          detail="This action cannot be undone."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDeleteConfirm(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Delete',
            icon: 'bi-trash3-fill',
            onClick: handleDeleteAlbum,
            tone: 'danger',
          }}
        />
      )}

      {/* Dismiss Event Confirmation Modal */}
      {showDismissEventModal && eventToDismiss && (
        <EventConfirmModal
          tone="danger"
          icon="bi-x-octagon-fill"
          eyebrow="Dismiss event"
          title="Dismiss Event?"
          intro={<><strong style={{ color: colors.textPrimary }}>{eventToDismiss.title}</strong> will be removed from your events list.</>}
          detail="The event and its album will still exist for the client."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDismissEventModal(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Dismiss',
            icon: 'bi-x-octagon-fill',
            onClick: handleDismissEvent,
            tone: 'danger',
          }}
        />
      )}

      {/* Dismiss Album Confirmation Modal */}
      {showDismissAlbumModal && albumToDismiss && (
        <EventConfirmModal
          tone="danger"
          icon="bi-x-octagon-fill"
          eyebrow="Dismiss album"
          title="Dismiss Album?"
          intro={<><strong style={{ color: colors.textPrimary }}>{albumToDismiss.title}</strong> will be removed from your albums list. The album and its photos will still be accessible to the client.</>}
          detail={albumToDismiss.faceRecognitionEnabled
            ? 'Warning: This album is published to Find-My-Photos. Dismissing it will unpublish it and images will no longer appear there.'
            : undefined}
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowDismissAlbumModal(false)}
          closeLabel="Cancel"
          primary={{
            label: 'Dismiss',
            icon: 'bi-x-octagon-fill',
            onClick: handleDismissAlbum,
            tone: 'danger',
          }}
        />
      )}

      {/* Album Action Success Modal */}
      {showAlbumSuccessModal && (
        <EventConfirmModal
          tone="success"
          icon="bi-check2-circle"
          eyebrow="Success"
          title={albumSuccessMessage.title}
          intro={albumSuccessMessage.description}
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => setShowAlbumSuccessModal(false)}
          closeLabel="Done"
          fullWidthClose
        />
      )}

      {/* Photobook Image Viewer */}
      {/* Resubmit Photobook Confirmation Modal */}
      {photobookToResubmit && (
        <EventConfirmModal
          tone="success"
          icon="bi-send-check-fill"
          eyebrow="Send back to client"
          title="Resubmit Photobook?"
          intro={<>You&apos;re about to send <strong style={{ color: colors.textPrimary }}>&quot;{photobookToResubmit.name}&quot;</strong> back to <strong style={{ color: colors.textPrimary }}>{photobookToResubmit.senderName || 'the client'}</strong> for review.</>}
          detail="The client will be notified that their photobook is ready for review. You won't be able to make further edits unless they send it back."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => { if (!isResubmittingPhotobook) setPhotobookToResubmit(null); }}
          closeLabel="Cancel"
          primary={{
            label: isResubmittingPhotobook ? 'Sending...' : 'Send Back',
            icon: isResubmittingPhotobook ? 'bi-arrow-clockwise' : 'bi-send-fill',
            onClick: () => { if (!isResubmittingPhotobook) handleResubmitPhotobook(photobookToResubmit); },
            tone: 'success',
          }}
        />
      )}

      {/* Delete Photobook Confirmation Modal */}
      {showDeletePhotobookModal && photobookToDelete && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Delete photobook"
          title="Delete Photobook"
          intro={<>Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{photobookToDelete.name}&quot;</strong>?</>}
          detail="This action cannot be undone."
          colors={{ bgCard: colors.bgCard, borderPrimary: colors.borderPrimary, textPrimary: colors.textPrimary, textSecondary: colors.textSecondary }}
          actualTheme={actualTheme}
          onClose={() => { setShowDeletePhotobookModal(false); setPhotobookToDelete(null); }}
          closeLabel="Cancel"
          primary={{
            label: 'Delete',
            icon: 'bi-trash3-fill',
            onClick: handleDeletePhotobook,
            tone: 'danger',
          }}
        />
      )}

      {/* Phase 1: Grid Browse with Select Mode */}
      {showPhotobookBrowse && selectedPhotobook && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', display: 'flex', flexDirection: 'column', zIndex: 1001 }}
          onClick={closePhotobookBrowse}
        >
          {/* Header */}
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>{selectedPhotobook.name}</h2>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>({selectedPhotobook.images.length} photos)</span>
              {selectedPhotobook.layout && (
                <span style={{
                  padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600',
                  backgroundColor: selectedPhotobook.layout === 'book-flip' ? 'rgba(124, 58, 237, 0.2)' : selectedPhotobook.layout === 'mosaic' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(5, 150, 105, 0.2)',
                  color: selectedPhotobook.layout === 'book-flip' ? '#A78BFA' : selectedPhotobook.layout === 'mosaic' ? '#FCD34D' : '#6EE7B7',
                  border: `1px solid ${selectedPhotobook.layout === 'book-flip' ? 'rgba(124, 58, 237, 0.4)' : selectedPhotobook.layout === 'mosaic' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(5, 150, 105, 0.4)'}`
                }}>
                  {selectedPhotobook.layout === 'book-flip' ? 'Book Flip' : selectedPhotobook.layout === 'mosaic' ? 'Mosaic' : selectedPhotobook.layout === 'gallery-wall' ? 'Gallery Wall' : selectedPhotobook.layout.replace(/-/g, ' ')}
                </span>
              )}
              {selectedPhotobook.senderName && (
                <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>From: {selectedPhotobook.senderName}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Select Mode Toggle */}
              {selectedPhotobook.images.length > 0 && (
                <button
                  onClick={() => {
                    setIsPhotobookSelectMode(!isPhotobookSelectMode);
                    if (isPhotobookSelectMode) setPhotobookSelectedImages([]);
                  }}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '2px solid',
                    borderColor: isPhotobookSelectMode ? '#16A34A' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: isPhotobookSelectMode ? '#16A34A' : 'transparent',
                    color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={false} />
                  {isPhotobookSelectMode ? 'Exit Select Mode' : 'Select Mode'}
                </button>
              )}
              {/* Close Button */}
              <button
                onClick={closePhotobookBrowse}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls Bar */}
          {isPhotobookSelectMode && (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', borderBottom: '1px solid rgba(22, 163, 74, 0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16A34A' }}>
                  {photobookSelectedImages.length} of {selectedPhotobook.images.length} selected
                </span>
                <button
                  onClick={() => {
                    if (photobookSelectedImages.length === selectedPhotobook.images.length) {
                      setPhotobookSelectedImages([]);
                    } else {
                      setPhotobookSelectedImages([...selectedPhotobook.images]);
                    }
                  }}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #16A34A', backgroundColor: 'transparent', color: '#16A34A', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  {photobookSelectedImages.length === selectedPhotobook.images.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {photobookSelectedImages.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handlePhotobookBulkDownload}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <DownloadIcon />
                    Download ({photobookSelectedImages.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {selectedPhotobook.images.map((image: string, index: number) => (
                <div
                  key={index}
                  style={{
                    position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden',
                    cursor: 'pointer', border: photobookSelectedImages.includes(image) ? '3px solid #16A34A' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (isPhotobookSelectMode) {
                      if (photobookSelectedImages.includes(image)) {
                        setPhotobookSelectedImages(photobookSelectedImages.filter((img: string) => img !== image));
                      } else {
                        setPhotobookSelectedImages([...photobookSelectedImages, image]);
                      }
                    } else {
                      openPhotobookImageViewer(selectedPhotobook, index);
                    }
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <Image src={image} alt={`${selectedPhotobook.name} - Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {/* Selection overlay */}
                  {isPhotobookSelectMode && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: photobookSelectedImages.includes(image) ? 'rgba(22, 163, 74, 0.25)' : 'transparent',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0.5rem'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: photobookSelectedImages.includes(image) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                        backgroundColor: photobookSelectedImages.includes(image) ? '#16A34A' : 'rgba(0, 0, 0, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}>
                        {photobookSelectedImages.includes(image) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Image number badge */}
                  {!isPhotobookSelectMode && (
                    <div style={{
                      position: 'absolute', bottom: '0.4rem', left: '0.4rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white',
                      padding: '0.15rem 0.5rem', borderRadius: '0.75rem', fontSize: '0.7rem', fontWeight: '600'
                    }}>
                      {index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Full-screen Single Image Viewer */}
      {showPhotobookImageViewer && selectedPhotobook && selectedPhotobook.images.length > 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 35%, rgba(20,24,40,0.97) 0%, rgba(0,0,0,1) 80%)',
          zIndex: 2000,
        }}>
          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image
              src={selectedPhotobook.images[photobookCurrentImageIndex]}
              alt={`${selectedPhotobook.name} - Image ${photobookCurrentImageIndex + 1}`}
              fill
              style={{ objectFit: 'contain', padding: '5rem 4rem' }}
              priority
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0.85rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          }}>
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              opacity: 0.85,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              {selectedPhotobook.thumbnail && (
                <div style={{
                  width: 40, height: 40, borderRadius: 10, overflow: 'hidden', position: 'relative',
                  flexShrink: 0, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 10px rgba(0,0,0,0.40)',
                }}>
                  <Image src={selectedPhotobook.thumbnail} alt={selectedPhotobook.name} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1,
                }}>Photobook</div>
                <h3 style={{
                  fontSize: '0.98rem', fontWeight: 800, color: 'white',
                  margin: 0, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '40vw',
                }}>{selectedPhotobook.name}</h3>
                {selectedPhotobook.senderName && (
                  <p style={{
                    fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.60)',
                    margin: '2px 0 0', display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <i className="bi bi-person-fill" style={{ fontSize: 10 }} />
                    From {selectedPhotobook.senderName}
                  </p>
                )}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                color: 'white',
                padding: '4px 11px',
                borderRadius: 9999,
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 4px 12px rgba(242,12,143,0.30)',
              }}>
                <i className="bi bi-image" style={{ fontSize: 10 }} />
                {photobookCurrentImageIndex + 1} <span style={{ opacity: 0.6 }}>/</span> {selectedPhotobook.images.length}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => {
                  const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
                  const filename = `${bookName}_${photobookCurrentImageIndex + 1}.jpg`;
                  downloadImage(selectedPhotobook.images[photobookCurrentImageIndex], filename);
                }}
                style={{
                  width: 36, height: 36, padding: 0,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: 10,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(242,12,143,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Download image"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={closePhotobookImageViewer}
                style={{
                  width: 36, height: 36, padding: 0,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: 10,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                  e.currentTarget.style.borderColor = '#DC2626';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Close (Esc)"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => photobookCurrentImageIndex > 0 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex - 1)}
            disabled={photobookCurrentImageIndex === 0}
            aria-label="Previous photo"
            style={{
              position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'white',
              cursor: photobookCurrentImageIndex > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: photobookCurrentImageIndex > 0 ? 1 : 0.25,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              if (photobookCurrentImageIndex > 0) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(242,12,143,0.34)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => photobookCurrentImageIndex < selectedPhotobook.images.length - 1 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex + 1)}
            disabled={photobookCurrentImageIndex === selectedPhotobook.images.length - 1}
            aria-label="Next photo"
            style={{
              position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'white',
              cursor: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              opacity: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 1 : 0.25,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              if (photobookCurrentImageIndex < selectedPhotobook.images.length - 1) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(242,12,143,0.34)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
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
              {selectedPhotobook.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setPhotobookCurrentImageIndex(index)}
                  style={{
                    position: 'relative', width: '56px', height: '42px', borderRadius: '0.375rem',
                    overflow: 'hidden', border: photobookCurrentImageIndex === index ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                    opacity: photobookCurrentImageIndex === index ? 1 : 0.5,
                    transform: photobookCurrentImageIndex === index ? 'scale(1.1)' : 'scale(1)',
                    background: 'none', padding: 0
                  }}
                  onMouseEnter={(e) => { if (photobookCurrentImageIndex !== index) e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { if (photobookCurrentImageIndex !== index) e.currentTarget.style.opacity = '0.5'; }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotographerEventsPage;
