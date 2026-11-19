'use client';

// app/pages/client/photobook-detail.tsx's state, effects and handlers, moved verbatim (no behaviour change).

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';


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

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
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

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Photobook {
  id: string;
  name: string;
  description: string | null;
  layout: string | null;
  coverImage: string | null;
  isSent: boolean;
  sentAt: string | null;
  senderName: string | null;
  mediaCount: number;
  mediaItems: MediaItem[];
  createdAt: string;
  status: string;
  freePhotosLimit: number | null;
  extraPhotosCount: number | null;
  extraPhotosAmount: number | null;
  paymentRequired: boolean;
  paymentDeclarationId: string | null;
  resubmittedAt: string | null;
  photographerName: string | null;
  eventId: string | null;
  pricePerExtraPhoto: number | null;
  currencyId: string | null;
}

export interface MediaItem {
  id: string;
  fileUrl: string;
  caption: string | null;
  sortOrder: number;
}

export interface PhotobookDetailPageProps {
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

export const getStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'DRAFT': return '#6B7280';
    case 'SENT_TO_PHOTOGRAPHER': return '#3B82F6';
    case 'PHOTOGRAPHER_EDITING': return '#F59E0B';
    case 'RESUBMITTED': return '#8B5CF6';
    case 'PENDING_PAYMENT': return '#EF4444';
    case 'COMPLETED': return '#10B981';
    default: return '#6B7280';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'DRAFT': return 'Draft';
    case 'SENT_TO_PHOTOGRAPHER': return 'Sent to Photographer';
    case 'PHOTOGRAPHER_EDITING': return 'Photographer Editing';
    case 'RESUBMITTED': return 'Resubmitted';
    case 'PENDING_PAYMENT': return 'Pending Payment';
    case 'COMPLETED': return 'Completed';
    default: return status || 'Unknown';
  }
};

export const WORKFLOW_STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT_TO_PHOTOGRAPHER', label: 'Sent to Photographer' },
  { key: 'PHOTOGRAPHER_EDITING', label: 'Photographer Editing' },
  { key: 'RESUBMITTED', label: 'Resubmitted / Pending Payment' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const getWorkflowStepIndex = (status: string): number => {
  const upper = status?.toUpperCase();
  switch (upper) {
    case 'DRAFT': return 0;
    case 'SENT_TO_PHOTOGRAPHER': return 1;
    case 'PHOTOGRAPHER_EDITING': return 2;
    case 'RESUBMITTED':
    case 'PENDING_PAYMENT': return 3;
    case 'COMPLETED': return 4;
    default: return 0;
  }
};

// ── Component ──────────────────────────────────────────────────────────────────


export function usePhotobookDetail(userRole: PhotobookDetailPageProps['userRole']) {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { token } = useDashboardAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [photobook, setPhotobook] = useState<Photobook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const rolePrefix = userRole === 'event-coordinator' ? 'coordinator' : 'events';

  const fetchPhotobook = useCallback(async () => {
    // Cookie-only sessions have no JS-readable token. dashboardAuthFetch
    // sends the HttpOnly cookie regardless, so gate only on id.
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = getApiUrl();
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/photobooks/${id}`
        : `${apiUrl}/api/remote/events/photobooks/${id}`;
      const res = await dashboardAuthFetch(endpoint);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Photobook not found.');
        } else {
          setError('Failed to load photobook details. Please try again.');
        }
        setLoading(false);
        return;
      }
      const result = await res.json();
      const data = result.data || result;
      setPhotobook({
        id: data.id,
        name: data.name || 'Untitled Photobook',
        description: data.description || null,
        layout: data.layout || null,
        coverImage: normalizeImageUrl(data.coverImage) || null,
        isSent: Boolean(data.isSent),
        sentAt: data.sentAt || null,
        senderName: data.senderName || null,
        mediaCount: Number(data.mediaCount) || 0,
        mediaItems: (data.mediaItems || []).map((item: any) => ({
          id: item.id,
          fileUrl: normalizeImageUrl(item.fileUrl) || '',
          caption: item.caption || null,
          sortOrder: item.sortOrder || 0,
        })),
        createdAt: data.createdAt || '',
        status: data.status || 'DRAFT',
        freePhotosLimit: data.freePhotosLimit != null ? Number(data.freePhotosLimit) : null,
        extraPhotosCount: data.extraPhotosCount != null ? Number(data.extraPhotosCount) : null,
        extraPhotosAmount: data.extraPhotosAmount != null ? Number(data.extraPhotosAmount) : null,
        paymentRequired: Boolean(data.paymentRequired),
        paymentDeclarationId: data.paymentDeclarationId || null,
        resubmittedAt: data.resubmittedAt || null,
        photographerName: data.photographerName || null,
        eventId: data.eventId || null,
        pricePerExtraPhoto: data.pricePerExtraPhoto != null ? Number(data.pricePerExtraPhoto) : null,
        currencyId: data.currencyId || null,
      });
    } catch (err) {
      console.error('Failed to fetch photobook:', err);
      setError('An error occurred while loading photobook details.');
    } finally {
      setLoading(false);
    }
  }, [id, userRole]);

  useEffect(() => {
    fetchPhotobook();
  }, [fetchPhotobook]);

  const handleGoBack = () => {
    router.back();
  };

  const handleSend = async () => {
    if (!photobook || actionLoading) return;
    setActionLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${rolePrefix}/photobook/${id}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchPhotobook();
      }
    } catch (err) {
      console.error('Failed to send photobook:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!photobook || actionLoading) return;
    setActionLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${rolePrefix}/photobook/${id}/accept`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchPhotobook();
      }
    } catch (err) {
      console.error('Failed to accept photobook:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayForExtras = () => {
    if (!photobook?.paymentDeclarationId) return;
    const basePath = userRole === 'event-coordinator' ? 'event-coordinator' : 'client';
    router.push(`/user/${basePath}/payments/${photobook.paymentDeclarationId}`);
  };

  const handleDelete = async () => {
    if (!photobook || actionLoading) return;
    setActionLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${rolePrefix}/photobook/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.back();
      }
    } catch (err) {
      console.error('Failed to delete photobook:', err);
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
    if (lightboxIndex === null || !photobook) return;
    setLightboxIndex(lightboxIndex === 0 ? photobook.mediaItems.length - 1 : lightboxIndex - 1);
  };

  const goToNextImage = () => {
    if (lightboxIndex === null || !photobook) return;
    setLightboxIndex(lightboxIndex === photobook.mediaItems.length - 1 ? 0 : lightboxIndex + 1);
  };


  return {
    colors,
    actualTheme,
    formatPrice,
    token,
    router,
    params,
    id,
    photobook,
    setPhotobook,
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
    rolePrefix,
    fetchPhotobook,
    handleGoBack,
    handleSend,
    handleAccept,
    handlePayForExtras,
    handleDelete,
    openLightbox,
    closeLightbox,
    goToPrevImage,
    goToNextImage,
    userRole,
  };
}

export type PhotobookDetailController = ReturnType<typeof usePhotobookDetail>;
