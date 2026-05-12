"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
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

interface Photobook {
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

interface MediaItem {
  id: string;
  fileUrl: string;
  caption: string | null;
  sortOrder: number;
}

interface PhotobookDetailPageProps {
  userRole: 'client' | 'event-coordinator';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDateShort = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const getStatusColor = (status: string): string => {
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

const getStatusLabel = (status: string): string => {
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

const WORKFLOW_STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT_TO_PHOTOGRAPHER', label: 'Sent to Photographer' },
  { key: 'PHOTOGRAPHER_EDITING', label: 'Photographer Editing' },
  { key: 'RESUBMITTED', label: 'Resubmitted / Pending Payment' },
  { key: 'COMPLETED', label: 'Completed' },
];

const getWorkflowStepIndex = (status: string): number => {
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

const PhotobookDetailPage: React.FC<PhotobookDetailPageProps> = ({ userRole }) => {
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

  // ── Render ─────────────────────────────────────────────────────────────────

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar userRole={userRole} />
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${colors.borderPrimary}`,
                borderTopColor: '#083A85',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: colors.textSecondary, fontSize: '0.95rem' }}>Loading photobook details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !photobook) {
    return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar userRole={userRole} />
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                {error || 'Photobook not found'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
                The photobook you are looking for may have been removed or does not exist.
              </p>
              <button
                onClick={handleGoBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#083A85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeftIcon />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main content ───────────────────────────────────────────────────────────

  const currentStepIndex = getWorkflowStepIndex(photobook.status);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .pb-two-col {
            grid-template-columns: 1fr !important;
          }
          .pb-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .pb-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .pb-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .pb-images-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .pb-action-buttons {
            flex-direction: column !important;
          }
          .pb-action-buttons button {
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .pb-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .pb-images-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div className="pb-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem' }}>

          {/* ── Back Button ────────────────────────────────────────────── */}
          <button
            onClick={handleGoBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '0.25rem 0',
              marginBottom: '1.25rem',
            }}
          >
            <ArrowLeftIcon />
            Back to Gallery
          </button>

          {/* ── Photobook Header ─────────────────────────────────────── */}
          <div
            className="pb-header-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: colors.textPrimary, margin: 0, lineHeight: '1.3' }}>
                {photobook.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {/* Status badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: getStatusColor(photobook.status),
                  borderRadius: '9999px',
                  padding: '0.25rem 0.75rem',
                }}>
                  {getStatusLabel(photobook.status)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Two Column Layout ──────────────────────────────────────── */}
          <div className="pb-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>

            {/* ── Left Column ────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Photobook Info Card ───────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <BookIcon />
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Photobook Info</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <InfoRow label="Name" value={photobook.name} colors={colors} />
                  {photobook.description && (
                    <InfoRow label="Description" value={photobook.description} colors={colors} />
                  )}
                  {photobook.layout && (
                    <InfoRow label="Layout" value={photobook.layout} colors={colors} />
                  )}
                  <InfoRow label="Created" value={formatDateShort(photobook.createdAt)} colors={colors} />
                  {photobook.sentAt && (
                    <InfoRow label="Sent" value={formatDateShort(photobook.sentAt)} colors={colors} />
                  )}
                  <InfoRow label="Media Count" value={String(photobook.mediaCount)} colors={colors} />
                  {photobook.senderName && (
                    <InfoRow label="Sender" value={photobook.senderName} colors={colors} />
                  )}
                </div>
              </div>

              {/* ── Status Workflow Card ──────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ color: colors.textSecondary }}><ClockIcon /></span>
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Status Workflow</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {WORKFLOW_STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;

                    return (
                      <div key={step.key} style={{ display: 'flex', gap: '0.875rem', position: 'relative' }}>
                        {/* Timeline line + dot */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: '24px',
                          flexShrink: 0,
                        }}>
                          {/* Dot */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted
                              ? '#10B981'
                              : isCurrent
                                ? getStatusColor(photobook.status)
                                : actualTheme === 'dark' ? '#374151' : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: isCurrent
                              ? `3px solid ${getStatusColor(photobook.status)}40`
                              : 'none',
                          }}>
                            {isCompleted ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : isCurrent ? (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                              }} />
                            ) : null}
                          </div>
                          {/* Connecting line */}
                          {index < WORKFLOW_STEPS.length - 1 && (
                            <div style={{
                              width: '2px',
                              flex: 1,
                              minHeight: '24px',
                              backgroundColor: isCompleted
                                ? '#10B981'
                                : actualTheme === 'dark' ? '#374151' : '#E5E7EB',
                            }} />
                          )}
                        </div>

                        {/* Step content */}
                        <div style={{
                          paddingBottom: index < WORKFLOW_STEPS.length - 1 ? '1.25rem' : 0,
                          paddingTop: '0.1rem',
                        }}>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: isCurrent ? '700' : isCompleted ? '600' : '400',
                            color: isPending
                              ? colors.textSecondary
                              : isCurrent
                                ? getStatusColor(photobook.status)
                                : colors.textPrimary,
                            opacity: isPending ? 0.5 : 1,
                          }}>
                            {step.label}
                          </div>
                          {isCurrent && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: colors.textSecondary,
                              marginTop: '0.2rem',
                            }}>
                              Current step
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Pricing Info Card ─────────────────────────────────── */}
              {photobook.freePhotosLimit != null && (
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  padding: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{ color: colors.textSecondary }}><DollarIcon /></span>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Pricing Info</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <InfoRow label="Free Photos Limit" value={String(photobook.freePhotosLimit)} colors={colors} />
                    {photobook.extraPhotosCount != null && (
                      <InfoRow label="Extra Photos" value={String(photobook.extraPhotosCount)} colors={colors} />
                    )}
                    {photobook.pricePerExtraPhoto != null && (
                      <InfoRow label="Price per Extra" value={formatPrice(photobook.pricePerExtraPhoto)} colors={colors} />
                    )}
                    {photobook.extraPhotosAmount != null && (
                      <InfoRow
                        label="Total Extras Amount"
                        value={formatPrice(photobook.extraPhotosAmount)}
                        colors={colors}
                        valueColor="#EF4444"
                      />
                    )}
                    <InfoRow
                      label="Payment Required"
                      value={photobook.paymentRequired ? 'Yes' : 'No'}
                      colors={colors}
                      valueColor={photobook.paymentRequired ? '#EF4444' : '#10B981'}
                    />
                  </div>
                </div>
              )}

              {/* ── Media Grid Card ───────────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ color: colors.textSecondary }}><ImageIcon /></span>
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                    Media ({photobook.mediaItems.length})
                  </h2>
                </div>

                {photobook.mediaItems.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.75rem',
                    border: `1px solid ${colors.borderPrimary}`,
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: actualTheme === 'dark' ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      color: colors.textSecondary,
                    }}>
                      <ImageIcon />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                      No Media Yet
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>
                      This photobook does not contain any media yet.
                    </p>
                  </div>
                ) : (
                  <div className="pb-images-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.5rem',
                  }}>
                    {photobook.mediaItems.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => openLightbox(index)}
                        style={{
                          position: 'relative',
                          paddingBottom: '100%',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: colors.bgPrimary,
                          border: `1px solid ${colors.borderPrimary}`,
                        }}
                      >
                        <img
                          src={item.fileUrl}
                          alt={item.caption || `Image ${index + 1}`}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.2s ease',
                          }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column ───────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Action Buttons ─────────────────────────────────────── */}
              <div
                className="pb-action-buttons"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Send to Photographer (if DRAFT & has media) */}
                {photobook.status?.toUpperCase() === 'DRAFT' && photobook.mediaItems.length > 0 && (
                  <button
                    onClick={handleSend}
                    disabled={actionLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      border: '2px solid #062D6B',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      width: '100%',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    <SendIcon />
                    Send to Photographer
                  </button>
                )}

                {/* Accept Photobook (if RESUBMITTED) */}
                {photobook.status?.toUpperCase() === 'RESUBMITTED' && (
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: '2px solid #059669',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      width: '100%',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    <CheckCircleIcon />
                    Accept Photobook
                  </button>
                )}

                {/* Pay for Extras (if PENDING_PAYMENT & paymentDeclarationId) */}
                {photobook.status?.toUpperCase() === 'PENDING_PAYMENT' && photobook.paymentDeclarationId && (
                  <button
                    onClick={handlePayForExtras}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      border: '2px solid #062D6B',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <DollarIcon />
                    Pay for Extras
                  </button>
                )}

                {/* Delete Photobook (if DRAFT) */}
                {photobook.status?.toUpperCase() === 'DRAFT' && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: actualTheme === 'dark' ? '#3B1A1A' : '#FEF2F2',
                      color: '#EF4444',
                      border: `2px solid ${actualTheme === 'dark' ? '#EF444440' : '#EF444430'}`,
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <TrashIcon />
                    Delete Photobook
                  </button>
                )}
              </div>

              {/* ── Photographer Info Card ──────────────────────────────── */}
              {photobook.photographerName && (
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  padding: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Photographer</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      border: `2px solid ${colors.borderPrimary}`,
                    }}>
                      <UserIcon />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                        {photobook.photographerName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.15rem' }}>
                        Photographer
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Quick Info Card ────────────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '1rem' }}>Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <InfoRow
                    label="Status"
                    value={getStatusLabel(photobook.status)}
                    colors={colors}
                    valueColor={getStatusColor(photobook.status)}
                  />
                  {photobook.layout && (
                    <InfoRow
                      label="Layout"
                      value={photobook.layout}
                      colors={colors}
                    />
                  )}
                  <InfoRow
                    label="Media"
                    value={String(photobook.mediaCount)}
                    colors={colors}
                  />
                  <InfoRow
                    label="Created"
                    value={formatDateShort(photobook.createdAt)}
                    colors={colors}
                  />
                  {photobook.sentAt && (
                    <InfoRow
                      label="Sent"
                      value={formatDateShort(photobook.sentAt)}
                      colors={colors}
                    />
                  )}
                  {photobook.resubmittedAt && (
                    <InfoRow
                      label="Resubmitted"
                      value={formatDateShort(photobook.resubmittedAt)}
                      colors={colors}
                    />
                  )}
                  {photobook.eventId && (
                    <InfoRow
                      label="Event"
                      value={photobook.eventId}
                      colors={colors}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.borderPrimary}`,
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#EF4444',
            }}>
              <TrashIcon />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
              Delete Photobook
            </h3>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>
              Are you sure you want to delete this photobook? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.bgPrimary,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                <TrashIcon />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightboxIndex !== null && photobook.mediaItems.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </button>

          {/* Image counter */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '500',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            zIndex: 10,
          }}>
            {lightboxIndex + 1} / {photobook.mediaItems.length}
          </div>

          {/* Previous button */}
          {photobook.mediaItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <ChevronLeftIcon />
            </button>
          )}

          {/* Next button */}
          {photobook.mediaItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <ChevronRightIcon />
            </button>
          )}

          {/* Image */}
          <img
            src={photobook.mediaItems[lightboxIndex].fileUrl}
            alt={photobook.mediaItems[lightboxIndex].caption || `Image ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '0.5rem',
              userSelect: 'none',
            }}
          />

          {/* Caption */}
          {photobook.mediaItems[lightboxIndex].caption && (
            <div style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '0.9rem',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              maxWidth: '80vw',
              textAlign: 'center',
              zIndex: 10,
            }}>
              {photobook.mediaItems[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, colors, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{label}</span>
    <span style={{
      fontSize: '0.85rem',
      fontWeight: '600',
      color: valueColor || colors.textPrimary,
      maxWidth: '60%',
      textAlign: 'right',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  </div>
);

export default PhotobookDetailPage;
