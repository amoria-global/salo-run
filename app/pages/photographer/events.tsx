"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import localforage from 'localforage';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';

// ============================================
// SHARED TYPES AND INTERFACES
// ============================================

// Gallery Types
interface AddAlbumFormData {
  uploadTitle: string;
  uploadCategory: string;
  uploadClientId: string;
  uploadDescription: string;
  uploadFeatured: boolean;
  uploadShared: boolean;
  selectedCoverIndex: number;
  uploadedImagePreviews: string[];
  savedAt: number;
}

// Streams Types
type StreamStatus = 'scheduled' | 'preparing' | 'live' | 'ended' | 'replay_ready';

interface Stream {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  clientName: string;
  clientImage: string;
  title: string;
  description: string;
  status: StreamStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  coverImage: string;
  viewerCount: number;
  peakViewers: number;
  maxViewers: number;
  streamKey?: string;
  inviteUrl: string;
  isPublic: boolean;
  earnings: number;
  createdAt: string;
}

interface LiveComment {
  id: string;
  userName: string;
  userAvatar: string;
  message: string;
  time: string;
}

// ============================================
// GALLERY ICONS
// ============================================

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#F20C8F' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.09924 19.7228 3.6929 19.0554 3.41524C18.3879 3.13757 17.6725 2.99414 16.95 2.99414C16.2275 2.99414 15.5121 3.13757 14.8446 3.41524C14.1772 3.6929 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99479 7.05 2.99479C5.59096 2.99479 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54478 7.04097 1.54478 8.5C1.54478 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.7571 11.2728 22.0348 10.6054C22.3124 9.93789 22.4559 9.22249 22.4559 8.5C22.4559 7.77751 22.3124 7.06211 22.0348 6.39464C21.7571 5.72718 21.3508 5.12075 20.84 4.61Z" stroke={filled ? '#F20C8F' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
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

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Social Media Icons
const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/>
    <rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4L12 14.01L9 11.01" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

// ============================================
// STREAMS ICONS
// ============================================

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
  </svg>
);

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
  </svg>
);

const BroadcastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16.24 7.76C17.5 9.02 18.25 10.7 18.25 12.5C18.25 14.3 17.5 15.98 16.24 17.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.76 16.24C6.5 14.98 5.75 13.3 5.75 11.5C5.75 9.7 6.5 8.02 7.76 6.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93C21.03 6.89 22.15 9.6 22.15 12.5C22.15 15.4 21.03 18.11 19.07 20.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.93 19.07C2.97 17.11 1.85 14.4 1.85 11.5C1.85 8.6 2.97 5.89 4.93 3.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
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

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 10L22 6V18L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="1" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 19V23M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const VideoOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 16V17C16 18.1046 15.1046 19 14 19H4C2.89543 19 2 18.1046 2 17V7C2 5.89543 2.89543 5 4 5H5M9 5H14C15.1046 5 16 5.89543 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 12L22 8V16L20 14.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MicOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 9V12C9 13.6569 10.3431 15 12 15C12.3506 15 12.6872 14.9398 13 14.8293M15 10.5V4C15 2.34315 13.6569 1 12 1C10.3431 1 9 2.34315 9 4V4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 10V12C19 13.7108 18.4282 15.2922 17.4588 16.5588M5 10V12C5 15.866 8.13401 19 12 19C12.6917 19 13.3618 18.9091 14 18.7388" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 19V23M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Toggle View Icons
const GalleryViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
  </svg>
);

const StreamsViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <path d="M16.24 7.76C17.5 9.02 18.25 10.7 18.25 12.5C18.25 14.3 17.5 15.98 16.24 17.24" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.76 16.24C6.5 14.98 5.75 13.3 5.75 11.5C5.75 9.7 6.5 8.02 7.76 6.76" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93C21.03 6.89 22.15 9.6 22.15 12.5C22.15 15.4 21.03 18.11 19.07 20.07" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.93 19.07C2.97 17.11 1.85 14.4 1.85 11.5C1.85 8.6 2.97 5.89 4.93 3.93" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ============================================
// STORAGE CONFIGURATION
// ============================================

const galleryFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'gallery_album_draft'
});

const ADD_ALBUM_FORM_KEY = 'add_album_form_draft';

// ============================================
// MOCK DATA
// ============================================

// Gallery mock data
const galleryData = [
  {
    id: 1,
    title: 'Sarah & James Wedding',
    category: 'Wedding',
    date: '2025-06-15',
    photos: 156,
    featured: true,
    shared: true,
    sharedWithClient: true,
    clientId: 'client1',
    clientName: 'Sarah Mitchell',
    views: 1250,
    downloads: 89,
    likes: 234,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800'
    ]
  },
  {
    id: 2,
    title: 'Corporate Event 2025',
    category: 'Corporate',
    date: '2025-06-10',
    photos: 89,
    featured: false,
    shared: true,
    sharedWithClient: false,
    clientId: 'client2',
    clientName: 'Tech Solutions Ltd',
    views: 560,
    downloads: 45,
    likes: 78,
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
    ]
  },
  {
    id: 3,
    title: "Emma's 30th Birthday",
    category: 'Birthday',
    date: '2025-06-08',
    photos: 67,
    featured: true,
    shared: false,
    sharedWithClient: true,
    clientId: 'client3',
    clientName: 'Emma Johnson',
    views: 890,
    downloads: 56,
    likes: 145,
    coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800'
    ]
  },
  {
    id: 4,
    title: 'Product Launch Event',
    category: 'Corporate',
    date: '2025-06-05',
    photos: 124,
    featured: false,
    shared: true,
    sharedWithClient: true,
    clientId: 'client4',
    clientName: 'Innovation Inc',
    views: 2100,
    downloads: 167,
    likes: 312,
    coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
    ]
  },
  {
    id: 5,
    title: 'Baby Shower - The Millers',
    category: 'Baby Shower',
    date: '2025-06-01',
    photos: 45,
    featured: false,
    shared: true,
    sharedWithClient: true,
    clientId: 'client5',
    clientName: 'Rachel Miller',
    views: 340,
    downloads: 28,
    likes: 67,
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800'
    ]
  },
  {
    id: 6,
    title: 'Graduation Day 2025',
    category: 'Graduation',
    date: '2025-05-28',
    photos: 78,
    featured: true,
    shared: true,
    sharedWithClient: false,
    clientId: 'client6',
    clientName: 'Mark Williams',
    views: 1560,
    downloads: 234,
    likes: 189,
    coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'
    ]
  }
];

// Mock clients for sharing
const mockClients = [
  { id: 'client1', name: 'Sarah Mitchell', avatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg' },
  { id: 'client2', name: 'Tech Solutions Ltd', avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg' },
  { id: 'client3', name: 'Emma Johnson', avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg' },
  { id: 'client4', name: 'Innovation Inc', avatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg' },
  { id: 'client5', name: 'Rachel Miller', avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg' },
  { id: 'client6', name: 'Mark Williams', avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg' },
];

// Streams mock data
const streamsData: Stream[] = [
  {
    id: 'str1',
    eventId: 'evt1',
    eventTitle: 'Sarah & James Wedding',
    eventType: 'Wedding',
    clientName: 'Sarah Mitchell',
    clientImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    title: 'Wedding Ceremony Live Stream',
    description: 'Streaming the beautiful garden wedding ceremony from Kigali Convention Center.',
    status: 'live',
    scheduledDate: '2025-08-15',
    scheduledTime: '14:00',
    duration: '2:35:42',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    viewerCount: 234,
    peakViewers: 287,
    maxViewers: 500,
    streamKey: 'sk_live_7x9K2mNpQrS4tUvW',
    inviteUrl: 'https://connekt.app/stream/str_7x9K2mNpQrS4',
    isPublic: false,
    earnings: 150,
    createdAt: '2025-06-01'
  },
  {
    id: 'str2',
    eventId: 'evt2',
    eventTitle: 'My 30th Birthday Bash',
    eventType: 'Birthday',
    clientName: 'Emma Johnson',
    clientImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    title: '30th Birthday Live Celebration',
    description: 'Celebrating three decades of life! Live from Lake Kivu Resort.',
    status: 'scheduled',
    scheduledDate: '2025-07-25',
    scheduledTime: '18:00',
    duration: '4 hours',
    coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    viewerCount: 0,
    peakViewers: 0,
    maxViewers: 200,
    streamKey: 'sk_live_3pL8wYzTuV5H6xQr',
    inviteUrl: 'https://connekt.app/stream/str_3pL8wYzTuV5H',
    isPublic: true,
    earnings: 0,
    createdAt: '2025-06-15'
  },
  {
    id: 'str3',
    eventId: 'evt3',
    eventTitle: 'Corporate Event 2025',
    eventType: 'Corporate',
    clientName: 'Tech Solutions Ltd',
    clientImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    title: 'Annual Conference Live Stream',
    description: 'Streaming the annual tech conference with keynote speeches and panels.',
    status: 'preparing',
    scheduledDate: '2025-07-20',
    scheduledTime: '09:00',
    duration: '6 hours',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    viewerCount: 0,
    peakViewers: 0,
    maxViewers: 1000,
    streamKey: 'sk_live_9dF4kBnCxM1J2pQr',
    inviteUrl: 'https://connekt.app/stream/str_9dF4kBnCxM1J',
    isPublic: true,
    earnings: 0,
    createdAt: '2025-07-01'
  },
  {
    id: 'str4',
    eventId: 'evt4',
    eventTitle: 'Baby Shower - Emma',
    eventType: 'Baby Shower',
    clientName: 'Rachel Green',
    clientImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    title: 'Baby Emma Welcome Party',
    description: 'A lovely afternoon celebrating the upcoming arrival of baby Emma.',
    status: 'replay_ready',
    scheduledDate: '2025-05-20',
    scheduledTime: '14:00',
    duration: '2:15:30',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    viewerCount: 89,
    peakViewers: 112,
    maxViewers: 100,
    inviteUrl: 'https://connekt.app/stream/str_5hR2vJmLnP8W',
    isPublic: false,
    earnings: 75,
    createdAt: '2025-04-01'
  },
  {
    id: 'str5',
    eventId: 'evt5',
    eventTitle: 'Graduation Party 2024',
    eventType: 'Graduation',
    clientName: 'Mark Williams',
    clientImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    title: 'Graduation Ceremony Stream',
    description: 'Watch the graduation ceremony and celebration with family and friends.',
    status: 'ended',
    scheduledDate: '2024-12-15',
    scheduledTime: '17:00',
    duration: '3:45:00',
    coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    viewerCount: 234,
    peakViewers: 298,
    maxViewers: 300,
    inviteUrl: 'https://connekt.app/stream/str_1qA6tXsGdK4Y',
    isPublic: true,
    earnings: 120,
    createdAt: '2024-11-01'
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

const PhotographerEventsPage = () => {
  const { colors, actualTheme } = useTheme();

  // View toggle state
  const [activeView, setActiveView] = useState<'gallery' | 'streams'>('gallery');

  // ============================================
  // GALLERY STATE
  // ============================================
  const [photos, setPhotos] = useState(galleryData);
  const [filterCategory, setFilterCategory] = useState('All');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<typeof galleryData[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePhoto, setSharePhoto] = useState<typeof galleryData[0] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Image Viewer State
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<typeof galleryData[0] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Multi-Select Gallery View State
  const [showMultiSelectView, setShowMultiSelectView] = useState(false);
  const [multiSelectAlbum, setMultiSelectAlbum] = useState<typeof galleryData[0] | null>(null);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Share to Client State
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [shareToClientSuccess, setShareToClientSuccess] = useState(false);
  const [shareType, setShareType] = useState<'album' | 'images'>('album');
  const [maxImagesInput, setMaxImagesInput] = useState<string>('');

  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadClientId, setUploadClientId] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadShared, setUploadShared] = useState(true);

  // Delete confirmation modal state
  const [showGalleryDeleteModal, setShowGalleryDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<typeof galleryData[0] | null>(null);

  // Auto-save state
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // STREAMS STATE
  // ============================================
  const [streamsActiveTab, setStreamsActiveTab] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [streamsSearchQuery, setStreamsSearchQuery] = useState('');
  const [showStreamDetails, setShowStreamDetails] = useState<Stream | null>(null);
  const [showControlPanel, setShowControlPanel] = useState<Stream | null>(null);
  const [showStreamsDeleteModal, setShowStreamsDeleteModal] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState<Stream | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', userName: 'Sarah Johnson', userAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg', message: 'This is beautiful! Amazing shots!', time: '2 min ago' },
    { id: '2', userName: 'Michael Chen', userAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', message: 'Can you show more of the venue?', time: '5 min ago' },
    { id: '3', userName: 'Emma Davis', userAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', message: 'The lighting is perfect!', time: '8 min ago' },
    { id: '4', userName: 'David Wilson', userAvatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg', message: 'Love this! Keep up the great work!', time: '10 min ago' },
  ]);

  const [streams, setStreams] = useState<Stream[]>(streamsData);

  // ============================================
  // GALLERY FUNCTIONS
  // ============================================

  const saveAlbumDraft = useCallback(async () => {
    const formData: AddAlbumFormData = {
      uploadTitle,
      uploadCategory,
      uploadClientId,
      uploadDescription,
      uploadFeatured,
      uploadShared,
      selectedCoverIndex,
      uploadedImagePreviews,
      savedAt: Date.now()
    };

    const hasData = uploadTitle || uploadCategory || uploadClientId ||
                    uploadDescription || uploadedImagePreviews.length > 0;

    if (hasData) {
      try {
        await galleryFormStorage.setItem(ADD_ALBUM_FORM_KEY, formData);
      } catch (error) {
        console.error('Failed to save album draft:', error);
      }
    }
  }, [uploadTitle, uploadCategory, uploadClientId, uploadDescription, uploadFeatured, uploadShared, selectedCoverIndex, uploadedImagePreviews]);

  useEffect(() => {
    if (showUploadModal && !isRestoringDraft) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveAlbumDraft();
      }, 500);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [showUploadModal, isRestoringDraft, saveAlbumDraft]);

  useEffect(() => {
    const restoreDraft = async () => {
      if (showUploadModal) {
        try {
          const savedDraft = await galleryFormStorage.getItem<AddAlbumFormData>(ADD_ALBUM_FORM_KEY);
          if (savedDraft) {
            setIsRestoringDraft(true);
            setUploadTitle(savedDraft.uploadTitle || '');
            setUploadCategory(savedDraft.uploadCategory || '');
            setUploadClientId(savedDraft.uploadClientId || '');
            setUploadDescription(savedDraft.uploadDescription || '');
            setUploadFeatured(savedDraft.uploadFeatured || false);
            setUploadShared(savedDraft.uploadShared !== undefined ? savedDraft.uploadShared : true);
            setSelectedCoverIndex(savedDraft.selectedCoverIndex || 0);
            setUploadedImagePreviews(savedDraft.uploadedImagePreviews || []);

            setShowDraftRestoredNotice(true);
            setTimeout(() => setShowDraftRestoredNotice(false), 3000);
            setTimeout(() => setIsRestoringDraft(false), 100);
          }
        } catch (error) {
          console.error('Failed to restore album draft:', error);
        }
      }
    };

    restoreDraft();
  }, [showUploadModal]);

  const clearAlbumDraft = useCallback(async () => {
    try {
      await galleryFormStorage.removeItem(ADD_ALBUM_FORM_KEY);
    } catch (error) {
      console.error('Failed to clear album draft:', error);
    }
  }, []);

  const resetUploadForm = (clearDraft: boolean = true) => {
    setSelectedFiles(null);
    setUploadedImagePreviews([]);
    setSelectedCoverIndex(0);
    setUploadTitle('');
    setUploadCategory('');
    setUploadClientId('');
    setUploadDescription('');
    setUploadFeatured(false);
    setUploadShared(true);
    if (clearDraft) {
      clearAlbumDraft();
    }
  };

  const toggleShareStatus = (photoId: number) => {
    setPhotos(photos.map(photo =>
      photo.id === photoId ? { ...photo, sharedWithClient: !photo.sharedWithClient } : photo
    ));
  };

  const openGalleryDeleteModal = (photo: typeof galleryData[0]) => {
    setAlbumToDelete(photo);
    setShowGalleryDeleteModal(true);
  };

  const confirmDeleteAlbum = () => {
    if (albumToDelete) {
      setPhotos(photos.filter(photo => photo.id !== albumToDelete.id));
      setShowGalleryDeleteModal(false);
      setAlbumToDelete(null);
    }
  };

  const cancelDeleteAlbum = () => {
    setShowGalleryDeleteModal(false);
    setAlbumToDelete(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      const previews = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setUploadedImagePreviews(previews);
      setSelectedCoverIndex(0);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getShareLink = (photo: typeof galleryData[0]) => {
    return `https://connekt.app/gallery/${photo.id}/${photo.title.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const handleUpload = () => {
    if (!uploadTitle || uploadedImagePreviews.length === 0) return;

    const newAlbum = {
      id: Date.now(),
      title: uploadTitle,
      category: uploadCategory || 'Other',
      date: new Date().toISOString().split('T')[0],
      photos: uploadedImagePreviews.length,
      featured: uploadFeatured,
      shared: uploadShared,
      sharedWithClient: false,
      clientId: uploadClientId,
      clientName: mockClients.find(c => c.id === uploadClientId)?.name || 'Unknown Client',
      views: 0,
      downloads: 0,
      likes: 0,
      coverImage: uploadedImagePreviews[selectedCoverIndex],
      images: uploadedImagePreviews
    };

    setPhotos([newAlbum, ...photos]);
    resetUploadForm(true);
    setShowUploadModal(false);
  };

  const categories = ['All', 'Wedding', 'Corporate', 'Birthday', 'Baby Shower', 'Graduation', 'Other'];

  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = filterCategory === 'All' || photo.category === filterCategory;
    const matchesSearch = gallerySearchQuery === '' ||
      photo.title.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
      photo.clientName.toLowerCase().includes(gallerySearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const galleryStats = {
    total: photos.length,
    photos: photos.reduce((acc, p) => acc + p.photos, 0),
    views: photos.reduce((acc, p) => acc + p.views, 0),
    shared: photos.filter(p => p.sharedWithClient).length
  };

  // Format number for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Open multi-select view with album
  const openMultiSelectView = (album: typeof galleryData[0]) => {
    setMultiSelectAlbum(album);
    setSelectedImages([]);
    setIsSelectMode(false);
    setShowMultiSelectView(true);
  };

  // Close multi-select view
  const closeMultiSelectView = () => {
    setShowMultiSelectView(false);
    setMultiSelectAlbum(null);
    setSelectedImages([]);
    setIsSelectMode(false);
  };

  // Client Selector Functions
  const openClientSelector = (type: 'album' | 'images') => {
    setShareType(type);
    const dedicatedClientId = type === 'album' ? sharePhoto?.clientId : multiSelectAlbum?.clientId;
    setSelectedClientId(dedicatedClientId || null);
    setShareToClientSuccess(false);
    setShowClientSelector(true);
  };

  const closeClientSelector = () => {
    setShowClientSelector(false);
    setSelectedClientId(null);
    setShareToClientSuccess(false);
  };

  const handleShareToClient = () => {
    if (!selectedClientId) return;

    const client = mockClients.find(c => c.id === selectedClientId);
    if (!client) return;

    // Simulate sharing
    setShareToClientSuccess(true);

    // Auto close after 2 seconds
    setTimeout(() => {
      closeClientSelector();
      if (shareType === 'album' && sharePhoto) {
        setPhotos(photos.map(p =>
          p.id === sharePhoto.id ? { ...p, sharedWithClient: true } : p
        ));
      }
    }, 2000);
  };

  const handleBulkShareToClient = () => {
    if (selectedImages.length > 0) {
      openClientSelector('images');
    }
  };

  // ============================================
  // STREAMS FUNCTIONS
  // ============================================

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const comment: LiveComment = {
      id: Date.now().toString(),
      userName: 'You (Photographer)',
      userAvatar: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg',
      message: newComment,
      time: 'Just now'
    };

    setLiveComments([comment, ...liveComments]);
    setNewComment('');
  };

  const handleDeleteStream = () => {
    if (streamToDelete) {
      setStreams(streams.filter(s => s.id !== streamToDelete.id));
      setStreamToDelete(null);
      setShowStreamsDeleteModal(false);
    }
  };

  const handleStartStream = (stream: Stream) => {
    setStreams(streams.map(s =>
      s.id === stream.id ? { ...s, status: 'live' as StreamStatus } : s
    ));
  };

  const handleEndStream = (stream: Stream) => {
    setStreams(streams.map(s =>
      s.id === stream.id ? { ...s, status: 'ended' as StreamStatus } : s
    ));
    setShowControlPanel(null);
  };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = streamsSearchQuery === '' ||
      stream.title.toLowerCase().includes(streamsSearchQuery.toLowerCase()) ||
      stream.eventTitle.toLowerCase().includes(streamsSearchQuery.toLowerCase()) ||
      stream.clientName.toLowerCase().includes(streamsSearchQuery.toLowerCase());

    if (streamsActiveTab === 'live') return matchesSearch && stream.status === 'live';
    if (streamsActiveTab === 'upcoming') return matchesSearch && (stream.status === 'scheduled' || stream.status === 'preparing');
    if (streamsActiveTab === 'past') return matchesSearch && (stream.status === 'ended' || stream.status === 'replay_ready');
    return matchesSearch;
  });

  const streamsStats = {
    total: streams.length,
    live: streams.filter(s => s.status === 'live').length,
    upcoming: streams.filter(s => s.status === 'scheduled' || s.status === 'preparing').length,
    totalEarnings: streams.reduce((acc, s) => acc + s.earnings, 0)
  };

  const getStatusColor = (status: StreamStatus) => {
    switch (status) {
      case 'live': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: '#EF4444' };
      case 'scheduled': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: '#3B82F6' };
      case 'preparing': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: '#F59E0B' };
      case 'ended': return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280', border: '#6B7280' };
      case 'replay_ready': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: '#10B981' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280', border: '#6B7280' };
    }
  };

  const getStatusLabel = (status: StreamStatus) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'scheduled': return 'Scheduled';
      case 'preparing': return 'Preparing';
      case 'ended': return 'Ended';
      case 'replay_ready': return 'Replay Ready';
      default: return status;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <style jsx>{`
        .events-container {
          display: flex;
          height: 100vh;
          background-color: ${colors.bgPrimary};
        }

        .events-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .events-main {
          flex: 1;
          overflow-y: auto;
          background-color: ${colors.bgPrimary};
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .events-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .events-main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-top: 0.75rem !important;
          }
          .events-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .mobile-title {
            font-size: 1.4rem !important;
          }
          .mobile-subtitle {
            font-size: 0.85rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mobile-filters {
            flex-wrap: wrap !important;
          }
          .events-header button {
            font-size: 0.75rem !important;
            padding: 0.4rem 0.6rem !important;
          }
          .mobile-filters button {
            font-size: 0.7rem !important;
            padding: 0.3rem 0.6rem !important;
          }
          .mobile-gallery-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mobile-modal {
            width: 98% !important;
            max-width: 98% !important;
            padding: 0.75rem !important;
          }
          .mobile-browse-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.375rem !important;
          }
          .view-toggle-container {
            width: 100% !important;
            justify-content: center !important;
          }
          .mobile-streams-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            margin-bottom: 3rem !important;
          }
        }

        @media (max-width: 640px) {
          .mobile-streams-grid {
            margin-bottom: 4rem !important;
          }
        }
      `}</style>

      <div className="events-container">
        <Sidebar />

        <div className="events-content">
          <Topbar userRole="photographer" tipsAmount={275.00} bonusAmount={725.00} balanceAmount={4975.00} />

          {/* Main Content */}
          <div className="events-main">
          {/* Header with View Toggle */}
          <div className="events-header">
            <div>
              <h1 className="mobile-title" style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: colors.textPrimary,
                margin: 0
              }}>Events</h1>
              <p className="mobile-subtitle" style={{
                fontSize: '0.95rem',
                color: colors.textSecondary,
                marginTop: '0.25rem'
              }}>
                {activeView === 'gallery'
                  ? 'Manage and share your photo collections with clients'
                  : 'Manage your live streams and recordings'}
              </p>
            </div>

            {/* View Toggle Buttons */}
            <div className="view-toggle-container" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: colors.bgTertiary,
              padding: '0.25rem',
              borderRadius: '0.5rem',
              border: `1px solid ${colors.borderPrimary}`
            }}>
              <button
                onClick={() => setActiveView('gallery')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: activeView === 'gallery' ? '#083A85' : 'transparent',
                  color: activeView === 'gallery' ? 'white' : colors.textSecondary,
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <GalleryViewIcon active={activeView === 'gallery'} />
                Gallery
              </button>
              <button
                onClick={() => setActiveView('streams')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: activeView === 'streams' ? '#083A85' : 'transparent',
                  color: activeView === 'streams' ? 'white' : colors.textSecondary,
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <StreamsViewIcon active={activeView === 'streams'} />
                Streams
              </button>
            </div>
          </div>

          {/* ============================================ */}
          {/* GALLERY VIEW */}
          {/* ============================================ */}
          {activeView === 'gallery' && (
            <>
              {/* Action Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#083A85',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: '1rem' }}></i>
                  New Album
                </button>
              </div>

              {/* Stats Cards */}
              <div className="mobile-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Albums</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{galleryStats.total}</div>
                </div>
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Photos</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{galleryStats.photos}</div>
                </div>
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Shared</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>{galleryStats.shared}</div>
                </div>
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Private</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>{galleryStats.total - galleryStats.shared}</div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="mobile-filters" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {/* Category Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: filterCategory === cat ? 'none' : `1px solid ${colors.borderPrimary}`,
                        backgroundColor: filterCategory === cat ? '#083A85' : colors.bgCard,
                        color: filterCategory === cat ? 'white' : colors.textSecondary,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="mobile-search-section" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>
                      <SearchIcon />
                    </div>
                    <input
                      type="text"
                      placeholder="Search albums..."
                      value={gallerySearchQuery}
                      onChange={(e) => setGallerySearchQuery(e.target.value)}
                      style={{
                        padding: '0.625rem 1rem 0.625rem 2.75rem',
                        border: '2px solid #D1D5DB',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        color: colors.textPrimary,
                        backgroundColor: colors.bgCard,
                        width: '280px'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#083A85';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="mobile-view-toggle" style={{
                    display: 'flex',
                    gap: '0.25rem',
                    backgroundColor: colors.bgTertiary,
                    padding: '0.25rem',
                    borderRadius: '0.5rem'
                  }}>
                    <button
                      onClick={() => setViewMode('grid')}
                      style={{
                        padding: '0.5rem',
                        border: 'none',
                        backgroundColor: viewMode === 'grid' ? colors.bgCard : 'transparent',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <GridIcon active={viewMode === 'grid'} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      style={{
                        padding: '0.5rem',
                        border: 'none',
                        backgroundColor: viewMode === 'list' ? colors.bgCard : 'transparent',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ListIcon active={viewMode === 'list'} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                  Showing {filteredPhotos.length} album{filteredPhotos.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Gallery Grid - 3 columns */}
              <div className="mobile-gallery-grid" style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr',
                gap: '1.25rem'
              }}>
                {filteredPhotos.map(photo => (
                  <div
                    key={photo.id}
                    style={{
                      backgroundColor: colors.bgCard,
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setViewerAlbum(photo);
                      setCurrentImageIndex(0);
                      setShowMultiSelectView(true);
                      setMultiSelectAlbum(photo);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(0, 0, 0, 0.2), 0 15px 30px -10px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.borderColor = '#083A85';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Image Container */}
                    <div style={{
                      position: 'relative',
                      height: '200px',
                      overflow: 'hidden'
                    }}>
                      <Image
                        src={photo.coverImage}
                        alt={photo.title}
                        fill
                        style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      {/* Gradient Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                        pointerEvents: 'none'
                      }} />

                      {/* Top Left - Category Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        backgroundColor: 'rgba(8, 58, 133, 0.9)',
                        color: 'white',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {photo.category}
                      </div>

                      {/* Top Right - Featured Badge */}
                      {photo.featured && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem'
                        }}>
                          <div style={{
                            backgroundColor: '#FCD34D',
                            color: '#92400E',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <i className="bi bi-star-fill" style={{ fontSize: '0.65rem' }}></i>
                            Featured
                          </div>
                        </div>
                      )}

                      {/* Bottom - Photo count */}
                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        right: '0.75rem'
                      }}>
                        <div style={{
                          backgroundColor: actualTheme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255,255,255,0.9)',
                          color: colors.textPrimary,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {photo.photos} photos
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="mobile-album-card-content" style={{ padding: '1rem' }}>
                      {/* Title & Client */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: colors.textPrimary,
                          margin: 0,
                          marginBottom: '0.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{photo.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>{photo.clientName}</span>
                        </div>
                      </div>

                      {/* Date & Status */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #F3F4F6'
                      }}>
                        <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>{photo.date}</span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          backgroundColor: photo.sharedWithClient
                            ? (actualTheme === 'dark' ? '#064E3B' : '#D1FAE5')
                            : (actualTheme === 'dark' ? '#78350F' : '#FEF3C7'),
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          color: photo.sharedWithClient
                            ? (actualTheme === 'dark' ? '#6EE7B7' : '#065F46')
                            : (actualTheme === 'dark' ? '#FCD34D' : '#92400E')
                        }}>
                          <i className={`bi ${photo.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{ fontSize: '0.7rem' }}></i>
                          {photo.sharedWithClient ? 'Shared' : 'Private'}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.75rem'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                            setShowViewModal(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #062a63',
                            backgroundColor: '#083A85',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <EyeIcon />
                          Browse
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharePhoto(photo);
                            setShowShareModal(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #16A34A',
                            backgroundColor: '#F0FDF4',
                            color: '#16A34A',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <SendIcon />
                          Send
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                            setShowEditModal(true);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: `2px solid ${colors.borderSecondary}`,
                            backgroundColor: colors.bgTertiary,
                            color: colors.textPrimary,
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          title="Edit Album"
                        >
                          <i className="bi bi-pencil" style={{ fontSize: '0.9rem' }}></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGalleryDeleteModal(photo);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #FCA5A5',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          title="Delete Album"
                        >
                          <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPhotos.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  color: colors.textSecondary
                }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No albums found</p>
                  <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </>
          )}

          {/* ============================================ */}
          {/* STREAMS VIEW */}
          {/* ============================================ */}
          {activeView === 'streams' && (
            <>
              {/* Stats Cards */}
              <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Streams', value: streamsStats.total, icon: <BroadcastIcon />, color: '#2563EB', bg: '#DBEAFE' },
                  { label: 'Live Now', value: streamsStats.live, icon: <PlayIcon />, color: '#059669', bg: '#D1FAE5' },
                  { label: 'Upcoming', value: streamsStats.upcoming, icon: <CalendarIcon />, color: '#D97706', bg: '#FEF3C7' },
                  { label: 'Total Viewers', value: streams.reduce((sum, s) => sum + s.peakViewers, 0).toLocaleString(), icon: <EyeIcon />, color: '#7C3AED', bg: '#EDE9FE' },
                  { label: 'Total Earnings', value: `$${streamsStats.totalEarnings}`, icon: <DollarIcon />, color: '#059669', bg: '#D1FAE5' }
                ].map((stat, index) => (
                  <div key={index} style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: colors.shadowSm,
                    border: `1px solid ${colors.borderPrimary}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: stat.bg,
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color
                      }}>
                        {stat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{stat.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="mobile-filters" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {/* Tab Filter */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['all', 'live', 'upcoming', 'past'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setStreamsActiveTab(tab)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: streamsActiveTab === tab
                          ? (actualTheme === 'dark' ? '#1E3A5F' : '#083A85')
                          : colors.bgTertiary,
                        color: streamsActiveTab === tab ? 'white' : colors.textSecondary,
                        border: `1px solid ${streamsActiveTab === tab ? '#083A85' : colors.borderPrimary}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab === 'all' ? 'All Streams' : tab}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <SearchIcon />
                  <input
                    type="text"
                    placeholder="Search streams..."
                    value={streamsSearchQuery}
                    onChange={(e) => setStreamsSearchQuery(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      marginLeft: '0.5rem',
                      fontSize: '0.9rem',
                      color: colors.textPrimary,
                      width: '150px'
                    }}
                  />
                </div>
              </div>

              {/* Streams Grid */}
              <div className="mobile-streams-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.25rem'
              }}>
                {filteredStreams.map(stream => (
                  <div
                    key={stream.id}
                    style={{
                      backgroundColor: colors.bgCard,
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      border: stream.status === 'live' ? '2px solid #10B981' : '1px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(0, 0, 0, 0.2), 0 15px 30px -10px rgba(0, 0, 0, 0.15)';
                      if (stream.status !== 'live') {
                        e.currentTarget.style.borderColor = '#083A85';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = stream.status === 'live' ? '#10B981' : 'rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Cover Image */}
                    <div style={{ position: 'relative', height: '160px' }}>
                      <Image
                        src={stream.coverImage}
                        alt={stream.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                      {/* Status Badge */}
                      <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: stream.status === 'live' ? (actualTheme === 'dark' ? '#14532D' : '#D1FAE5') :
                                          stream.status === 'scheduled' ? (actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE') :
                                          stream.status === 'preparing' ? (actualTheme === 'dark' ? '#78350F' : '#FEF3C7') :
                                          stream.status === 'replay_ready' ? (actualTheme === 'dark' ? '#4C1D95' : '#E0E7FF') :
                                          (actualTheme === 'dark' ? '#374151' : '#F3F4F6'),
                          color: stream.status === 'live' ? (actualTheme === 'dark' ? '#4ADE80' : '#059669') :
                                stream.status === 'scheduled' ? (actualTheme === 'dark' ? '#60A5FA' : '#1D4ED8') :
                                stream.status === 'preparing' ? (actualTheme === 'dark' ? '#FCD34D' : '#B45309') :
                                stream.status === 'replay_ready' ? (actualTheme === 'dark' ? '#A78BFA' : '#5B21B6') :
                                (actualTheme === 'dark' ? '#9CA3AF' : '#6B7280')
                        }}>
                          {stream.status === 'live' && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#DC2626',
                              animation: 'pulse 1.5s infinite'
                            }}/>
                          )}
                          {getStatusLabel(stream.status)}
                        </span>
                      </div>
                      {/* Live Viewer Count */}
                      {stream.status === 'live' && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <EyeIcon />
                          {stream.viewerCount} watching
                        </div>
                      )}
                      {/* Event Type */}
                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '0.75rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        {stream.eventType}
                      </div>
                      {/* Earnings */}
                      {stream.earnings > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0.75rem',
                          right: '0.75rem',
                          backgroundColor: actualTheme === 'dark' ? '#14532D' : '#D1FAE5',
                          color: actualTheme === 'dark' ? '#4ADE80' : '#059669',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          ${stream.earnings}
                        </div>
                      )}
                    </div>

                    {/* Stream Info */}
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.25rem', margin: 0 }}>
                        {stream.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.25rem 0 0.75rem 0' }}>
                        {stream.eventTitle}
                      </p>

                      {/* Client Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                          <Image
                            src={stream.clientImage}
                            alt={stream.clientName}
                            width={24}
                            height={24}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                          {stream.clientName}
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: colors.textSecondary }}>
                          <CalendarIcon />
                          <span style={{ fontSize: '0.85rem' }}>{formatDate(stream.scheduledDate)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: colors.textSecondary }}>
                          <ClockIcon />
                          <span style={{ fontSize: '0.85rem' }}>{stream.status === 'live' ? stream.duration : stream.scheduledTime}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
                        {stream.status === 'live' && (
                          <button
                            onClick={() => setShowControlPanel(stream)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              border: '2px solid #2563EB',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <BroadcastIcon />
                            Control Panel
                          </button>
                        )}
                        {stream.status === 'preparing' && (
                          <button
                            onClick={() => handleStartStream(stream)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              backgroundColor: '#DC2626',
                              color: 'white',
                              border: '2px solid #B91C1C',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <PlayIcon />
                            Go Live
                          </button>
                        )}
                        {stream.status === 'scheduled' && (
                          <button
                            onClick={() => setShowStreamDetails(stream)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              backgroundColor: '#083A85',
                              color: 'white',
                              border: '2px solid #062a63',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <SettingsIcon />
                            Setup
                          </button>
                        )}
                        {(stream.status === 'ended' || stream.status === 'replay_ready') && (
                          <button
                            onClick={() => setShowStreamDetails(stream)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              backgroundColor: '#F20C8F',
                              color: 'white',
                              border: '2px solid #C0096D',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <EyeIcon />
                            View Stats
                          </button>
                        )}
                        {/* Delete button - shown for all statuses except live */}
                        {stream.status !== 'live' && (
                          <button
                            onClick={() => {
                              setStreamToDelete(stream);
                              setShowStreamsDeleteModal(true);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: '2px solid #FCA5A5',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Delete Stream"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredStreams.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  color: colors.textSecondary
                }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No streams found</p>
                  <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Stream Control Panel Modal - Live Event */}
      {showControlPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowControlPanel(null)}>
          <div className="mobile-modal mobile-control-panel" style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0 0 0.75rem 0.75rem',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            paddingBottom: '5rem'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Cover Image with Live Badge */}
            <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
              <Image
                src={showControlPanel.coverImage}
                alt={showControlPanel.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              {/* Live Badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#DC2626',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '700'
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: colors.bgCard,
                  animation: 'pulse 1.5s infinite'
                }}/>
                LIVE NOW
              </div>
              {/* Close Button */}
              <button
                onClick={() => setShowControlPanel(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textPrimary
                }}
              >
                <CloseIcon />
              </button>
              {/* Stats Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.85rem'
                }}>
                  <EyeIcon />
                  <span style={{ fontWeight: '600' }}>{showControlPanel.viewerCount}</span> viewers
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.85rem'
                }}>
                  <ClockIcon />
                  <span style={{ fontWeight: '600' }}>{showControlPanel.duration}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                {showControlPanel.eventTitle}
              </h2>
              <h3 style={{ fontSize: '1rem', fontWeight: '500', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                {showControlPanel.title}
              </h3>

              {/* Stream URL */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                  Stream Viewing Link
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={showControlPanel.inviteUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary
                    }}
                  />
                  <button
                    onClick={() => handleCopyKey(showControlPanel.inviteUrl)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.75rem 1rem',
                      border: copiedKey ? '2px solid #059669' : '2px solid #062a63',
                      borderRadius: '0.5rem',
                      background: copiedKey ? '#10B981' : '#083A85',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <CopyIcon />
                    {copiedKey ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* End Stream Button */}
              <button
                onClick={() => handleEndStream(showControlPanel)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: '2px solid #B91C1C',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <StopIcon />
                End Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Details Modal */}
      {showStreamDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowStreamDetails(null)}>
          <div className="mobile-modal" style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            paddingBottom: '3rem'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Cover Image */}
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden', borderRadius: '0.75rem 0.75rem 0 0' }}>
              <Image
                src={showStreamDetails.coverImage}
                alt={showStreamDetails.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <button
                onClick={() => setShowStreamDetails(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: colors.textPrimary
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.25rem 0' }}>
                {showStreamDetails.title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                {showStreamDetails.eventTitle}
              </p>

              {/* Client Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                  <Image
                    src={showStreamDetails.clientImage}
                    alt={showStreamDetails.clientName}
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{showStreamDetails.clientName}</div>
                  <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Client</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                    <CalendarIcon />
                    <span style={{ fontSize: '0.8rem' }}>Date & Time</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                    {formatDate(showStreamDetails.scheduledDate)} at {showStreamDetails.scheduledTime}
                  </div>
                </div>
                <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                    <UsersIcon />
                    <span style={{ fontSize: '0.8rem' }}>Peak Viewers</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                    {showStreamDetails.peakViewers} / {showStreamDetails.maxViewers}
                  </div>
                </div>
                <div style={{ backgroundColor: actualTheme === 'dark' ? '#14532D' : '#D1FAE5', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: actualTheme === 'dark' ? '#4ADE80' : '#059669' }}>
                    <DollarIcon />
                    <span style={{ fontSize: '0.8rem' }}>Earnings</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: actualTheme === 'dark' ? '#4ADE80' : '#059669' }}>${showStreamDetails.earnings}</div>
                </div>
                <div style={{ backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: colors.textSecondary }}>
                    <ClockIcon />
                    <span style={{ fontSize: '0.8rem' }}>Duration</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>{showStreamDetails.duration}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streams Delete Confirmation Modal */}
      {showStreamsDeleteModal && streamToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => { setShowStreamsDeleteModal(false); setStreamToDelete(null); }}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21H20.44C20.79 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.97 3.15C12.67 2.98 12.34 2.89 12 2.89C11.66 2.89 11.33 2.98 11.03 3.15C10.73 3.32 10.47 3.56 10.29 3.86Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>Delete Stream</h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '1.5rem', textAlign: 'center' }}>
              Are you sure you want to delete &quot;{streamToDelete.title}&quot;? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setShowStreamsDeleteModal(false); setStreamToDelete(null); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStream}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <TrashIcon />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Delete Confirmation Modal */}
      {showGalleryDeleteModal && albumToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => { setShowGalleryDeleteModal(false); setAlbumToDelete(null); }}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21H20.44C20.79 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.97 3.15C12.67 2.98 12.34 2.89 12 2.89C11.66 2.89 11.33 2.98 11.03 3.15C10.73 3.32 10.47 3.56 10.29 3.86Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>Delete Album</h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '1.5rem', textAlign: 'center' }}>
              Are you sure you want to delete &quot;{albumToDelete.title}&quot;? This will permanently remove all {albumToDelete.photos} photos.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setShowGalleryDeleteModal(false); setAlbumToDelete(null); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAlbum}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <TrashIcon />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Photo Modal - Album Details */}
      {showViewModal && selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              width: '600px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
              <Image
                src={selectedPhoto.coverImage}
                alt={selectedPhoto.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textPrimary
                }}
              >
                <CloseIcon />
              </button>
              {selectedPhoto.featured && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: '#FCD34D',
                  color: '#92400E',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <i className="bi bi-star-fill"></i>
                  Featured
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>{selectedPhoto.title}</h2>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.625rem',
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    borderRadius: '0.375rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    marginTop: '0.5rem'
                  }}>{selectedPhoto.category}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  backgroundColor: selectedPhoto.sharedWithClient
                    ? (actualTheme === 'dark' ? '#064E3B' : '#D1FAE5')
                    : (actualTheme === 'dark' ? '#78350F' : '#FEF3C7'),
                  padding: '0.375rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: selectedPhoto.sharedWithClient
                    ? (actualTheme === 'dark' ? '#6EE7B7' : '#065F46')
                    : (actualTheme === 'dark' ? '#FCD34D' : '#92400E')
                }}>
                  <i className={`bi ${selectedPhoto.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`}></i>
                  {selectedPhoto.sharedWithClient ? 'Shared' : 'Private'}
                </div>
              </div>

              {/* Client Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: colors.bgTertiary,
                borderRadius: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={mockClients.find(c => c.id === selectedPhoto.clientId)?.avatar || 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'}
                    alt={selectedPhoto.clientName}
                    width={48}
                    height={48}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary }}>{selectedPhoto.clientName}</div>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{selectedPhoto.date}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedPhoto.photos}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Photos</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10B981' }}>{formatNumber(selectedPhoto.downloads)}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Downloads</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openMultiSelectView(selectedPhoto);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '2px solid #062a63',
                    backgroundColor: '#083A85',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  <ImageIcon />
                  Browse Photos
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                    Edit Album
                  </button>
                  <button
                    onClick={() => {
                      setSharePhoto(selectedPhoto);
                      setShowShareModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #16A34A',
                      backgroundColor: '#F0FDF4',
                      color: '#16A34A',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <SendIcon />
                    Send to Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal - Enhanced with maxImages and dedicated client */}
      {showShareModal && sharePhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => { setShowShareModal(false); setSharePhoto(null); setMaxImagesInput(''); }}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Send Album to Client</h3>
              <button
                onClick={() => { setShowShareModal(false); setSharePhoto(null); setMaxImagesInput(''); }}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderSecondary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Album Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <Image src={sharePhoto.coverImage} alt={sharePhoto.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '0.9rem' }}>{sharePhoto.title}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{sharePhoto.photos} photos • {sharePhoto.clientName}</div>
              </div>
            </div>

            {/* Maximum Images Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                Maximum Images
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter number of maximum images to be selected"
                value={maxImagesInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (/^\d+$/.test(val) && parseInt(val) > 0)) {
                    setMaxImagesInput(val);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  border: `2px solid ${maxImagesInput && parseInt(maxImagesInput) > 0 ? '#16A34A' : colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {!maxImagesInput && (
                <p style={{ fontSize: '0.75rem', color: '#F59E0B', margin: '0.375rem 0 0 0' }}>
                  Please enter the maximum number of images the client can select
                </p>
              )}
            </div>

            {/* Send to Client Section */}
            {(() => {
              const dedicatedClient = mockClients.find(c => c.id === sharePhoto.clientId);
              const isSendEnabled = maxImagesInput && parseInt(maxImagesInput) > 0;
              return dedicatedClient ? (
                <div style={{
                  backgroundColor: actualTheme === 'dark' ? '#064E3B' : '#F0FDF4',
                  border: `1px solid ${actualTheme === 'dark' ? '#065F46' : '#BBF7D0'}`,
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
                    Send this album to the event client:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: colors.bgCard, borderRadius: '0.5rem', border: `1px solid ${actualTheme === 'dark' ? '#065F46' : '#BBF7D0'}` }}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <Image
                        src={dedicatedClient.avatar}
                        alt={dedicatedClient.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>
                        {dedicatedClient.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Event Client</div>
                    </div>
                    <div style={{ color: '#16A34A' }}>
                      <CheckCircleIcon />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isSendEnabled) return;
                      setSelectedClientId(dedicatedClient.id);
                      setShareType('album');
                      setShowShareModal(false);
                      setMaxImagesInput('');
                      // Simulate success
                      setPhotos(photos.map(p =>
                        p.id === sharePhoto.id ? { ...p, sharedWithClient: true } : p
                      ));
                    }}
                    disabled={!isSendEnabled}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: 'none',
                      borderRadius: '0.5rem',
                      backgroundColor: isSendEnabled ? '#16A34A' : '#9CA3AF',
                      color: 'white',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: isSendEnabled ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      opacity: isSendEnabled ? 1 : 0.7
                    }}
                    onMouseEnter={(e) => {
                      if (isSendEnabled) e.currentTarget.style.backgroundColor = '#15803D';
                    }}
                    onMouseLeave={(e) => {
                      if (isSendEnabled) e.currentTarget.style.backgroundColor = '#16A34A';
                    }}
                  >
                    <SendIcon />
                    Send Album to {dedicatedClient.name.split(' ')[0]}
                  </button>
                </div>
              ) : (
                <div style={{
                  backgroundColor: actualTheme === 'dark' ? '#7F1D1D' : '#FEF2F2',
                  border: `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FECACA'}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' }}>No client assigned to this album</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Album Modal - Enhanced with Preview */}
      {showEditModal && selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: colors.textPrimary,
                margin: 0
              }}>Edit Album</h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textPrimary
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Preview Image */}
            <div style={{ position: 'relative', height: '160px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <Image
                src={selectedPhoto.coverImage}
                alt={selectedPhoto.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '0.5rem'
                }}>Title</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.title}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '0.5rem'
                }}>Category</label>
                <select
                  defaultValue={selectedPhoto.category.toLowerCase()}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    cursor: 'pointer'
                  }}
                >
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="corporate">Corporate</option>
                  <option value="birthday">Birthday</option>
                  <option value="baby shower">Baby Shower</option>
                  <option value="graduation">Graduation</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '0.5rem'
                }}>Client</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.clientName}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-featured"
                    defaultChecked={selectedPhoto.featured}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#083A85' }}
                  />
                  <label htmlFor="edit-featured" style={{ fontSize: '0.875rem', color: colors.textPrimary, cursor: 'pointer' }}>
                    Mark as featured
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-shared"
                    checked={selectedPhoto.sharedWithClient}
                    onChange={() => toggleShareStatus(selectedPhoto.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                  />
                  <label htmlFor="edit-shared" style={{ fontSize: '0.875rem', color: colors.textPrimary, cursor: 'pointer' }}>
                    Share with client
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${colors.borderPrimary}`
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Saving album changes...');
                  setShowEditModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#083A85',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => { resetUploadForm(false); setShowUploadModal(false); }}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              paddingBottom: '3rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>Create New Album</h2>
              <button
                onClick={() => { resetUploadForm(false); setShowUploadModal(false); }}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textPrimary
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Draft Restored Notice */}
            {showDraftRestoredNotice && (
              <div style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #10B981',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ color: '#047857', fontSize: '0.875rem', fontWeight: '500' }}>
                  Your previous draft has been restored
                </span>
              </div>
            )}

            {/* Upload Area */}
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="file-upload"
              style={{
                display: 'block',
                border: '2px dashed #D1D5DB',
                borderRadius: '0.75rem',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                backgroundColor: colors.bgTertiary,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <i className="bi bi-cloud-upload" style={{ fontSize: '1.75rem', color: '#2563EB' }}></i>
              </div>
              <p style={{ fontSize: '0.95rem', color: colors.textPrimary, margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                {selectedFiles && selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Click to upload photos'}
              </p>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: 0 }}>PNG, JPG, GIF up to 10MB each</p>
            </label>

            {/* Cover Photo Selection */}
            {uploadedImagePreviews.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
                  Select Cover Photo *
                </label>
                <div className="mobile-browse-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  {uploadedImagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedCoverIndex(index)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '0.375rem',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedCoverIndex === index ? '3px solid #083A85' : '2px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Image src={preview} alt={`Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                      {selectedCoverIndex === index && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          backgroundColor: 'rgba(8, 58, 133, 0.9)',
                          padding: '2px 4px',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '600' }}>COVER</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                  Album Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter album title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                  Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select category</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Graduation">Graduation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                  Select Client *
                </label>
                <div style={{
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  backgroundColor: colors.bgCard
                }}>
                  {mockClients.map((client) => (
                    <label
                      key={client.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${colors.borderPrimary}`,
                        backgroundColor: uploadClientId === client.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#F0F9FF') : colors.bgCard
                      }}
                    >
                      <input
                        type="radio"
                        name="upload-client"
                        value={client.id}
                        checked={uploadClientId === client.id}
                        onChange={() => setUploadClientId(client.id)}
                        style={{ width: '16px', height: '16px', accentColor: '#083A85' }}
                      />
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
                        <Image src={client.avatar} alt={client.name} width={32} height={32} style={{ objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{client.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={uploadFeatured}
                    onChange={(e) => setUploadFeatured(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#083A85' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: colors.textPrimary }}>Featured</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={uploadShared}
                    onChange={(e) => setUploadShared(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#083A85' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: colors.textPrimary }}>Share with Client</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => { resetUploadForm(false); setShowUploadModal(false); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { handleUpload(); setShowUploadModal(false); }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select View Modal */}
      {showMultiSelectView && multiSelectAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>{multiSelectAlbum.title}</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.25rem 0 0 0' }}>
                {multiSelectAlbum.photos} photos • {multiSelectAlbum.clientName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: isSelectMode ? '2px solid #10B981' : '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: isSelectMode ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {isSelectMode ? 'Exit Select' : 'Select Images'}
              </button>
              <button
                onClick={() => { setShowMultiSelectView(false); setMultiSelectAlbum(null); setSelectedImages([]); setIsSelectMode(false); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {multiSelectAlbum.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (isSelectMode) {
                      setSelectedImages(prev =>
                        prev.includes(index)
                          ? prev.filter(i => i !== index)
                          : [...prev, index]
                      );
                    } else {
                      setViewerAlbum(multiSelectAlbum);
                      setCurrentImageIndex(index);
                      setShowImageViewer(true);
                    }
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImages.includes(index) ? '3px solid #10B981' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <Image src={image} alt={`Photo ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {isSelectMode && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: selectedImages.includes(index) ? '#10B981' : 'rgba(255, 255, 255, 0.9)',
                      border: selectedImages.includes(index) ? '2px solid #10B981' : '2px solid #D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedImages.includes(index) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer with actions when in select mode */}
          {isSelectMode && selectedImages.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              padding: '1rem 1.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: 'white', alignSelf: 'center', marginRight: 'auto' }}>
                {selectedImages.length} selected
              </span>
              <button style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '2px solid #3B82F6',
                backgroundColor: '#3B82F6',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <DownloadIcon />
                Download
              </button>
              <button
                onClick={handleBulkShareToClient}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '2px solid #16A34A',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                <SendIcon />
                Send to Client
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && viewerAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1100
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' && currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
            if (e.key === 'ArrowRight' && currentImageIndex < viewerAlbum.images.length - 1) setCurrentImageIndex(currentImageIndex + 1);
            if (e.key === 'Escape') { setShowImageViewer(false); setViewerAlbum(null); }
          }}
          tabIndex={0}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ color: 'white' }}>
              <span style={{ fontSize: '0.9rem' }}>{currentImageIndex + 1} / {viewerAlbum.images.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <DownloadIcon />
                Download
              </button>
              <button
                onClick={() => { setShowImageViewer(false); setViewerAlbum(null); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Main Image */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '2rem'
          }}>
            {/* Prev Button */}
            {currentImageIndex > 0 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeftIcon />
              </button>
            )}

            {/* Image */}
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '80vh' }}>
              <Image
                src={viewerAlbum.images[currentImageIndex]}
                alt={`Photo ${currentImageIndex + 1}`}
                width={1200}
                height={800}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </div>

            {/* Next Button */}
            {currentImageIndex < viewerAlbum.images.length - 1 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRightIcon />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '1rem',
            overflowX: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center'
          }}>
            {viewerAlbum.images.map((image, index) => (
              <div
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '0.375rem',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: currentImageIndex === index ? '3px solid #083A85' : '3px solid transparent',
                  opacity: currentImageIndex === index ? 1 : 0.6,
                  flexShrink: 0,
                  position: 'relative'
                }}
              >
                <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Selector Modal - For sending selected images from multi-select view */}
      {showClientSelector && multiSelectAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}
          onClick={closeClientSelector}
        >
          <div
            className="mobile-modal"
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '450px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!shareToClientSuccess ? (
              (() => {
                const dedicatedClient = mockClients.find(c => c.id === multiSelectAlbum.clientId);
                return dedicatedClient ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                        Send {selectedImages.length} Image(s) to Event Client
                      </h3>
                      <button
                        onClick={closeClientSelector}
                        style={{
                          background: colors.bgTertiary,
                          border: `2px solid ${colors.borderPrimary}`,
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          color: colors.textPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CloseIcon />
                      </button>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      Send the selected images to the event client:
                    </p>

                    {/* Dedicated Client Display */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1.25rem',
                      padding: '0.75rem',
                      backgroundColor: '#F0FDF4',
                      borderRadius: '0.5rem',
                      border: '2px solid #16A34A'
                    }}>
                      <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <Image
                          src={dedicatedClient.avatar}
                          alt={dedicatedClient.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>
                          {dedicatedClient.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Event Client</div>
                      </div>
                      <div style={{ color: '#16A34A' }}>
                        <CheckCircleIcon />
                      </div>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={() => {
                        setSelectedClientId(dedicatedClient.id);
                        handleShareToClient();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        backgroundColor: '#16A34A',
                        color: 'white',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#15803D';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#16A34A';
                      }}
                    >
                      <SendIcon />
                      Send {selectedImages.length} Image(s) to {dedicatedClient.name.split(' ')[0]}
                    </button>
                  </>
                ) : (
                  <div style={{
                    backgroundColor: actualTheme === 'dark' ? '#7F1D1D' : '#FEF2F2',
                    border: `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FECACA'}`,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626' }}>No client assigned to this album</div>
                  </div>
                );
              })()
            ) : (
              /* Success State */
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <CheckCircleIcon />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#166534', margin: '0 0 0.5rem 0' }}>
                  Sent Successfully!
                </h3>
                <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0 }}>
                  {mockClients.find(c => c.id === multiSelectAlbum?.clientId)?.name.split(' ')[0]} will receive a notification with the selected images.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pulse Animation for Live indicators */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default PhotographerEventsPage;
