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

const ArchiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 8V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8" stroke="currentColor" strokeWidth="2"/>
    <path d="M10 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

interface Album {
  id: string;
  title: string;
  photographerId: string | null;
  photographer: string;
  photographerAvatar: string | null;
  category: string;
  date: string | null;
  eventLocation: string | null;
  isArchived: boolean;
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

interface MediaItem {
  id: string;
  fileUrl: string;
  caption: string | null;
  sortOrder: number;
}

interface AlbumPayment {
  amountDue: number;
  status: string | null;
  eventName: string | null;
  photographerName: string | null;
}

interface AlbumDetailPageProps {
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

const getPaymentStatusColor = (status: string | null): string => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return '#10B981';
    case 'PAID': return '#10B981';
    case 'PENDING': return '#F59E0B';
    case 'PARTIAL': return '#3B82F6';
    case 'FAILED': return '#EF4444';
    default: return '#6B7280';
  }
};

const getPaymentStatusLabel = (status: string | null): string => {
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

const AlbumDetailPage: React.FC<AlbumDetailPageProps> = ({ userRole }) => {
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
        photographerId: data.photographerId || null,
        photographer: data.photographer || 'Unknown Photographer',
        photographerAvatar: normalizeImageUrl(data.photographerAvatar) || null,
        category: data.category || '',
        date: data.date || null,
        eventLocation: data.eventLocation || null,
        isArchived: Boolean(data.isArchived),
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

  const handleUnlock = () => {
    if (!album) return;
    router.push(`/${userRole === 'event-coordinator' ? 'user/event-coordinator' : 'user/client'}/gallery/albums`);
  };

  const handleArchive = async () => {
    if (!album || actionLoading) return;
    setActionLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/albums/archives`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: id }),
      });
      if (res.ok) {
        await fetchAlbum();
      }
    } catch (err) {
      console.error('Failed to archive album:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async () => {
    if (!album || actionLoading) return;
    setActionLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/albums/archives`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: id }),
      });
      if (res.ok) {
        await fetchAlbum();
      }
    } catch (err) {
      console.error('Failed to unarchive album:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!album || actionLoading) return;
    setActionLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/albums/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.back();
      }
    } catch (err) {
      console.error('Failed to delete album:', err);
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
              <p style={{ color: colors.textSecondary, fontSize: '0.95rem' }}>Loading album details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !album) {
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
                {error || 'Album not found'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
                The album you are looking for may have been removed or does not exist.
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

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .ad-two-col {
            grid-template-columns: 1fr !important;
          }
          .ad-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .ad-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .ad-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .ad-images-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .ad-action-buttons {
            flex-direction: column !important;
          }
          .ad-action-buttons button {
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .ad-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .ad-images-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div className="ad-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, padding: '1.25rem' }}>

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
            Back to Albums
          </button>

          {/* ── Album Header ─────────────────────────────────────────── */}
          <div
            className="ad-header-row"
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
                {album.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {/* Category badge */}
                {album.category && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: '#083A85',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                  }}>
                    {album.category}
                  </span>
                )}
                {/* Locked/Unlocked badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: album.isLocked ? '#F59E0B' : '#10B981',
                  backgroundColor: album.isLocked ? '#F59E0B18' : '#10B98118',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.75rem',
                  border: `1px solid ${album.isLocked ? '#F59E0B40' : '#10B98140'}`,
                }}>
                  {album.isLocked ? <LockIcon /> : <UnlockIcon />}
                  {album.isLocked ? 'Locked' : 'Unlocked'}
                </span>
                {/* Archived badge */}
                {album.isArchived && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6B7280',
                    backgroundColor: '#6B728018',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    border: '1px solid #6B728040',
                  }}>
                    <ArchiveIcon />
                    Archived
                  </span>
                )}
              </div>
            </div>

            {/* Client actions on a delivered album. Previously the
                only path to a photobook was via /gallery, which buried
                the workflow. Both buttons are scoped to the client
                role so photographer/admin views aren't disturbed. */}
            {userRole === 'client' && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/user/client/gallery?tab=photobooks&albumId=${encodeURIComponent(album.id)}&create=1`;
                    }
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: '#083A85', color: '#fff', border: 'none',
                    borderRadius: '0.5rem', padding: '0.55rem 1rem',
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <i className="bi bi-book-half" />
                  Create photobook
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/user/client/events?requestChanges=${encodeURIComponent(album.id)}`;
                    }
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'transparent', color: '#F59E0B',
                    border: '1.5px solid #F59E0B', borderRadius: '0.5rem',
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise" />
                  Request changes
                </button>
              </div>
            )}
          </div>

          {/* ── Two Column Layout ──────────────────────────────────────── */}
          <div className="ad-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>

            {/* ── Left Column ────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Album Info Card ──────────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <ImageIcon />
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Album Info</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
                  <InfoRow label="Title" value={album.title} colors={colors} />
                  {album.category && (
                    <InfoRow label="Category" value={album.category} colors={colors} />
                  )}
                  {album.date && (
                    <InfoRow label="Date" value={formatDateShort(album.date)} colors={colors} />
                  )}
                  {album.eventLocation && (
                    <InfoRow label="Location" value={album.eventLocation} colors={colors} />
                  )}
                  {album.receivedDate && (
                    <InfoRow label="Received" value={formatDateShort(album.receivedDate)} colors={colors} />
                  )}
                </div>

                {/* Stats grid */}
                <div className="ad-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#3B82F6' }}><ImageIcon /></span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3B82F6' }}>
                      {album.photoCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.15rem' }}>Photos</div>
                  </div>
                  <div style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#10B981' }}><DownloadIcon /></span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10B981' }}>
                      {album.downloadedCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.15rem' }}>Downloaded</div>
                  </div>
                  <div style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#EF4444' }}><HeartIcon /></span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#EF4444' }}>
                      {album.favoriteCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.15rem' }}>Favorites</div>
                  </div>
                </div>
              </div>

              {/* ── Images Grid Card ─────────────────────────────────── */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.borderPrimary}`,
                padding: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ color: colors.textSecondary }}><ImageIcon /></span>
                  <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                    Images ({album.images.length})
                  </h2>
                </div>

                {album.isLocked ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    backgroundColor: actualTheme === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
                    borderRadius: '0.75rem',
                    border: `1px solid ${actualTheme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)'}`,
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#F59E0B20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      color: '#F59E0B',
                    }}>
                      <LockIcon />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                      Album is Locked
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>
                      Unlock this album to view and download images.
                    </p>
                  </div>
                ) : album.images.length === 0 ? (
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
                      No Images Yet
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>
                      This album does not contain any images yet.
                    </p>
                  </div>
                ) : (
                  <div className="ad-images-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.5rem',
                  }}>
                    {album.images.map((img, index) => (
                      <div
                        key={img.id}
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
                          src={img.fileUrl}
                          alt={img.caption || `Image ${index + 1}`}
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

              {/* ── Payment Info Card ────────────────────────────────── */}
              {album.payment && (
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  padding: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <CreditCardIcon />
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Payment Info</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <InfoRow
                      label="Amount Due"
                      value={formatPrice(album.payment.amountDue)}
                      colors={colors}
                    />
                    <InfoRow
                      label="Status"
                      value={getPaymentStatusLabel(album.payment.status)}
                      colors={colors}
                      valueColor={getPaymentStatusColor(album.payment.status)}
                    />
                    {album.payment.eventName && (
                      <InfoRow
                        label="Event"
                        value={album.payment.eventName}
                        colors={colors}
                      />
                    )}
                    {album.payment.photographerName && (
                      <InfoRow
                        label="Photographer"
                        value={album.payment.photographerName}
                        colors={colors}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right Column ───────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ── Action Buttons ─────────────────────────────────────── */}
              <div
                className="ad-action-buttons"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Unlock button (if locked) */}
                {album.isLocked && (
                  <button
                    onClick={handleUnlock}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      border: '2px solid #D97706',
                      borderRadius: '0.5rem',
                      padding: '0.875rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <UnlockIcon />
                    Unlock Album
                  </button>
                )}

                {/* Archive / Unarchive button */}
                <button
                  onClick={album.isArchived ? handleUnarchive : handleArchive}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                    color: actualTheme === 'dark' ? '#93C5FD' : '#083A85',
                    border: `2px solid ${actualTheme === 'dark' ? '#2563EB40' : '#083A8530'}`,
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  <ArchiveIcon />
                  {album.isArchived ? 'Unarchive Album' : 'Archive Album'}
                </button>

                {/* Delete button */}
                {!showDeleteConfirm ? (
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
                    Delete Album
                  </button>
                ) : (
                  <div style={{
                    backgroundColor: actualTheme === 'dark' ? '#3B1A1A' : '#FEF2F2',
                    border: `2px solid ${actualTheme === 'dark' ? '#EF444440' : '#EF444430'}`,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                  }}>
                    <p style={{ fontSize: '0.85rem', color: '#EF4444', fontWeight: '600', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
                      Are you sure you want to delete this album? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                          borderRadius: '0.375rem',
                          padding: '0.625rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        <TrashIcon />
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{
                          flex: 1,
                          backgroundColor: colors.bgPrimary,
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderPrimary}`,
                          borderRadius: '0.375rem',
                          padding: '0.625rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Photographer Info Card ──────────────────────────────── */}
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
                    {album.photographerAvatar && (
                      <img
                        src={album.photographerAvatar}
                        alt={album.photographer}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>
                      {album.photographer}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.15rem' }}>
                      Photographer
                    </div>
                  </div>
                </div>
              </div>

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
                    value={album.isLocked ? 'Locked' : 'Unlocked'}
                    colors={colors}
                    valueColor={album.isLocked ? '#F59E0B' : '#10B981'}
                  />
                  <InfoRow
                    label="Archived"
                    value={album.isArchived ? 'Yes' : 'No'}
                    colors={colors}
                    valueColor={album.isArchived ? '#6B7280' : colors.textPrimary}
                  />
                  <InfoRow
                    label="Photos"
                    value={String(album.photoCount)}
                    colors={colors}
                  />
                  {album.expiresAt && (
                    <InfoRow
                      label="Expires"
                      value={formatDateShort(album.expiresAt)}
                      colors={colors}
                      valueColor={new Date(album.expiresAt) < new Date() ? '#EF4444' : colors.textPrimary}
                    />
                  )}
                  {album.date && (
                    <InfoRow
                      label="Date"
                      value={formatDateShort(album.date)}
                      colors={colors}
                    />
                  )}
                  {album.eventLocation && (
                    <InfoRow
                      label="Location"
                      value={album.eventLocation}
                      colors={colors}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightboxIndex !== null && album.images.length > 0 && (
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
            {lightboxIndex + 1} / {album.images.length}
          </div>

          {/* Previous button */}
          {album.images.length > 1 && (
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
          {album.images.length > 1 && (
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
            src={album.images[lightboxIndex].fileUrl}
            alt={album.images[lightboxIndex].caption || `Image ${lightboxIndex + 1}`}
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
          {album.images[lightboxIndex].caption && (
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
              {album.images[lightboxIndex].caption}
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

export default AlbumDetailPage;
