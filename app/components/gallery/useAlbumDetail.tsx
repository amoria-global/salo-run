'use client';

// app/pages/client/album-detail.tsx's state, effects and handlers, moved verbatim (no behaviour change).

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import ArchiveRestoreFlow from '@/app/components/ArchiveRestoreFlow';
import { archivedMessage, archiveFeeText } from '@/lib/archivedCopy';


// ── Icons ──────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Album {
  id: string;
  title: string;
  eventId: string | null;
  photographerId: string | null;
  photographer: string;
  photographerAvatar: string | null;
  category: string;
  date: string | null;
  eventLocation: string | null;
  /** Locked after its 6 months of access ran out (same fact as isLocked). Not the event's completion. */
  isArchived: boolean;
  /** The client confirmed the event is complete. */
  isCompleted: boolean;
  lockedAt: string | null;
  archiveFee: number | null;
  archiveCurrency: string | null;
  receivedDate: string | null;
  thumbnail: string | null;
  photoCount: number;
  downloadedCount: number;
  favoriteCount: number;
  images: MediaItem[];
  payment: AlbumPayment | null;
  expiresAt: string | null;
  isLocked: boolean;
  storageSubscriptionId: string | null;
}

export interface MediaItem {
  id: string;
  fileUrl: string;
  caption: string | null;
  sortOrder: number;
}

export interface AlbumPayment {
  amountDue: number;
  status: string | null;
  eventName: string | null;
  photographerName: string | null;
}

export interface AlbumDetailPageProps {
  userRole: 'client' | 'event-coordinator';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const getPaymentStatusColor = (status: string | null): string => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return '#10B981';
    case 'PAID': return '#10B981';
    case 'PENDING': return '#F59E0B';
    case 'PARTIAL': return '#3B82F6';
    case 'FAILED': return '#EF4444';
    default: return '#6B7280';
  }
};

export const getPaymentStatusLabel = (status: string | null): string => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'Paid';
    case 'PAID': return 'Paid';
    case 'PENDING': return 'Pending';
    case 'PARTIAL': return 'Partially Paid';
    case 'FAILED': return 'Failed';
    default: return status || 'Unknown';
  }
};

// ── Component ──────────────────────────────────────────────────────────────────


export function useAlbumDetail(userRole: AlbumDetailPageProps['userRole']) {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { token } = useDashboardAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAlbum = useCallback(async () => {
    // Cookie-only sessions have no JS-readable token. dashboardAuthFetch
    // sends the HttpOnly cookie regardless, so gate only on id.
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/galleries/${id}`
        : `${apiUrl}/api/remote/customer/albums/${id}`;
      const res = await dashboardAuthFetch(endpoint);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Album not found.');
        } else {
          setError('Failed to load album details. Please try again.');
        }
        setLoading(false);
        return;
      }
      const result = await res.json();
      const data = result.data || result;
      setAlbum({
        id: data.id,
        title: data.title || 'Untitled Album',
        eventId: data.eventId || null,
        photographerId: data.photographerId || null,
        photographer: data.photographer || 'Unknown Photographer',
        photographerAvatar: normalizeImageUrl(data.photographerAvatar) || null,
        category: data.category || '',
        date: data.date || null,
        eventLocation: data.eventLocation || null,
        isArchived: Boolean(data.isArchived),
        isCompleted: Boolean(data.isCompleted),
        lockedAt: data.lockedAt || null,
        archiveFee: typeof data.archiveFee === 'number' ? data.archiveFee : null,
        archiveCurrency: data.archiveCurrency || null,
        receivedDate: data.receivedDate || null,
        thumbnail: normalizeImageUrl(data.thumbnail) || null,
        photoCount: Number(data.photoCount) || 0,
        downloadedCount: Number(data.downloadedCount) || 0,
        favoriteCount: Number(data.favoriteCount) || 0,
        images: (data.images || []).map((img: any) => ({
          id: img.id,
          fileUrl: normalizeImageUrl(img.fileUrl) || '',
          caption: img.caption || null,
          sortOrder: img.sortOrder || 0,
        })),
        payment: data.payment ? {
          amountDue: Number(data.payment.amountDue) || 0,
          status: data.payment.status || null,
          eventName: data.payment.eventName || null,
          photographerName: data.payment.photographerName || null,
        } : null,
        expiresAt: data.expiresAt || null,
        isLocked: Boolean(data.isLocked),
        storageSubscriptionId: data.storageSubscriptionId || null,
      });
    } catch (err) {
      console.error('Failed to fetch album:', err);
      setError('An error occurred while loading album details.');
    } finally {
      setLoading(false);
    }
  }, [id, userRole]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  const handleGoBack = () => {
    router.back();
  };

  const [showRestore, setShowRestore] = useState(false);
  const handleUnlock = () => {
    if (!album) return;
    setShowRestore(true);
  };

  const handleDelete = async () => {
    if (!album || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/albums/${id}`, {
        method: 'DELETE',
      });
      const body = await res.json().catch(() => null);
      // The backend answers 200 with action 0 for some failures, so both are checked.
      if (res.ok && body?.action !== 0) {
        router.back();
      } else {
        setActionError(body?.message || 'This album could not be deleted. Please try again.');
      }
    } catch (err) {
      console.error('Failed to delete album:', err);
      setActionError('This album could not be deleted. Check your connection and try again.');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goToPrevImage = () => {
    if (lightboxIndex === null || !album) return;
    setLightboxIndex(lightboxIndex === 0 ? album.images.length - 1 : lightboxIndex - 1);
  };

  const goToNextImage = () => {
    if (lightboxIndex === null || !album) return;
    setLightboxIndex(lightboxIndex === album.images.length - 1 ? 0 : lightboxIndex + 1);
  };


  return {
    colors,
    actualTheme,
    formatPrice,
    token,
    router,
    params,
    id,
    album,
    setAlbum,
    loading,
    setLoading,
    error,
    setError,
    lightboxIndex,
    setLightboxIndex,
    showDeleteConfirm,
    setShowDeleteConfirm,
    actionLoading,
    setActionLoading,
    actionError,
    setActionError,
    fetchAlbum,
    handleGoBack,
    showRestore,
    setShowRestore,
    handleUnlock,
    handleDelete,
    openLightbox,
    closeLightbox,
    goToPrevImage,
    goToNextImage,
    userRole,
  };
}

export type AlbumDetailController = ReturnType<typeof useAlbumDetail>;
