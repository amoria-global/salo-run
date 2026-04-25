'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';

// Icons
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const GridIcon = ({ active, activeColor = "#083A85" }: { active?: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? activeColor : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ListIcon = ({ active, activeColor = "#083A85" }: { active?: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? activeColor : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

// Social Media Icons with Brand Colors (matching My Events page)
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

// Photobook Icons
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// Photobook Interfaces
interface PhotobookImage {
  url: string;
  sourceAlbumId: string;
  sourceAlbumTitle: string;
  addedAt: string;
}

interface Photobook {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  createdAt: string;
  images: PhotobookImage[];
  maxImages: number;
}

// Album shape used across the gallery page. Sourced from
// GET /api/remote/customer/albums (ClientAlbumResponseDTO on the backend),
// flattened so `images` is a plain string[] of full URLs — the rest of
// this page treats images as URLs, not media-item objects.
interface Album {
  id: string;
  title: string;
  photographer: string;
  photographerAvatar: string;
  category: string;
  date: string;
  receivedDate: string;
  thumbnail: string;
  photoCount: number;
  downloadedCount: number;
  favoriteCount: number;
  images: string[];
}

const ClientGallery = () => {
  const { colors, actualTheme } = useTheme();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);
  const [albumsError, setAlbumsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPhotographer, setFilterPhotographer] = useState('All');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Multi-select view states
  const [showMultiSelectView, setShowMultiSelectView] = useState(false);
  const [multiSelectAlbum, setMultiSelectAlbum] = useState<Album | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Image viewer states
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<Album | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAlbum, setShareAlbum] = useState<Album | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

  // Photobook states
  const [photobook, setPhotobook] = useState<Photobook | null>(null);
  const [showCreatePhotobookModal, setShowCreatePhotobookModal] = useState(false);
  const [showPhotobookModal, setShowPhotobookModal] = useState(false);
  const [viewingPhotobooks, setViewingPhotobooks] = useState(false);
  const [photobookName, setPhotobookName] = useState('');
  const [photobookDescription, setPhotobookDescription] = useState('');
  const [photobookThumbnailUrl, setPhotobookThumbnailUrl] = useState<string | null>(null);

  // Add to Photobook states
  const [showAddToPhotobookModal, setShowAddToPhotobookModal] = useState(false);
  const [addToPhotobookAlbum, setAddToPhotobookAlbum] = useState<Album | null>(null);
  const [selectedImagesForPhotobook, setSelectedImagesForPhotobook] = useState<string[]>([]);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  // Track removed albums (hidden after adding to photobook)
  const [removedAlbumIds, setRemovedAlbumIds] = useState<string[]>([]);

  // Notification modal state
  const [notificationModal, setNotificationModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }>({ show: false, title: '', message: '', type: 'info' });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Fetch the signed-in customer's albums from the backend.
  // Backend returns ClientAlbumResponseDTO whose images field is a list of
  // media-item objects; we flatten to URL strings here so the rest of the
  // page (which treats images as string[]) doesn't have to change.
  const fetchAlbums = useCallback(async () => {
    setIsLoadingAlbums(true);
    setAlbumsError(null);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/albums`);
      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.status}`);
      }
      const json = await response.json();
      const list: Record<string, unknown>[] = json?.action === 1 && Array.isArray(json?.data) ? json.data : [];

      const mapped: Album[] = list.map((a) => {
        const rawImages = Array.isArray(a.images) ? (a.images as Record<string, unknown>[]) : [];
        const imageUrls = rawImages
          .map((img) => normalizeImageUrl((img?.fileUrl as string) || '') || '')
          .filter(Boolean);
        return {
          id: String(a.id ?? ''),
          title: (a.title as string) || 'Untitled Album',
          photographer: (a.photographer as string) || 'Unknown photographer',
          photographerAvatar: normalizeImageUrl((a.photographerAvatar as string) || '') || '',
          category: (a.category as string) || 'General',
          date: (a.date as string) || '',
          receivedDate: (a.receivedDate as string) || '',
          thumbnail: normalizeImageUrl((a.thumbnail as string) || '') || imageUrls[0] || '',
          photoCount: typeof a.photoCount === 'number' ? a.photoCount : 0,
          downloadedCount: typeof a.downloadedCount === 'number' ? a.downloadedCount : 0,
          favoriteCount: typeof a.favoriteCount === 'number' ? a.favoriteCount : 0,
          images: imageUrls,
        };
      });

      setAlbums(mapped);
    } catch (err) {
      setAlbumsError(err instanceof Error ? err.message : 'Failed to load albums');
      setAlbums([]);
    } finally {
      setIsLoadingAlbums(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Product'];
  const photographers = ['All', ...Array.from(new Set(albums.map(a => a.photographer)))];

  // Filter albums - also exclude removed albums when not viewing photobooks
  const filteredAlbums = albums.filter(album => {
    // Hide removed albums unless viewing photobooks
    if (!viewingPhotobooks && removedAlbumIds.includes(album.id)) {
      return false;
    }
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         album.photographer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || album.category === filterCategory;
    const matchesPhotographer = filterPhotographer === 'All' || album.photographer === filterPhotographer;
    return matchesSearch && matchesCategory && matchesPhotographer;
  });

  // Stats
  const totalPhotos = albums.reduce((sum, a) => sum + a.photoCount, 0);
  const totalDownloaded = albums.reduce((sum, a) => sum + a.downloadedCount, 0);
  const totalFavorites = albums.reduce((sum, a) => sum + a.favoriteCount, 0);

  // Functions
  // Max images limit for photobook (placeholder - will be set by backend later)
  const MAX_PHOTOBOOK_IMAGES = 10;

  const openMultiSelectView = (album: Album) => {
    setMultiSelectAlbum(album);
    setSelectedImages([]);
    // Auto-enter select mode when photobook exists
    setIsSelectMode(!!photobook);
    setShowMultiSelectView(true);
  };

  const closeMultiSelectView = () => {
    setShowMultiSelectView(false);
    setMultiSelectAlbum(null);
    setSelectedImages([]);
    setIsSelectMode(false);
  };

  const openImageViewer = (album: Album, startIndex: number = 0) => {
    setViewerAlbum(album);
    setCurrentImageIndex(startIndex);
    setShowImageViewer(true);
    setShowMultiSelectView(false);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    if (multiSelectAlbum) {
      setShowMultiSelectView(true);
    }
    setViewerAlbum(null);
    setCurrentImageIndex(0);
  };

  const toggleImageSelection = (image: string) => {
    if (selectedImages.includes(image)) {
      setSelectedImages(selectedImages.filter(img => img !== image));
    } else {
      // Enforce max limit when photobook exists
      if (photobook && selectedImages.length >= MAX_PHOTOBOOK_IMAGES) {
        setNotificationModal({ show: true, title: 'Maximum Reached', message: `You can only select up to ${MAX_PHOTOBOOK_IMAGES} images for your photobook.`, type: 'warning' });
        return;
      }
      setSelectedImages([...selectedImages, image]);
    }
  };

  const selectAllImages = () => {
    if (multiSelectAlbum) {
      if (selectedImages.length === multiSelectAlbum.images.length || (photobook && selectedImages.length >= MAX_PHOTOBOOK_IMAGES)) {
        setSelectedImages([]);
      } else {
        // Cap at max when photobook exists
        if (photobook) {
          setSelectedImages(multiSelectAlbum.images.slice(0, MAX_PHOTOBOOK_IMAGES));
        } else {
          setSelectedImages([...multiSelectAlbum.images]);
        }
      }
    }
  };

  const openDeleteModal = (album: Album) => {
    setAlbumToDelete(album);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = () => {
    if (albumToDelete) {
      setAlbums(albums.filter(album => album.id !== albumToDelete.id));
      setShowDeleteModal(false);
      setAlbumToDelete(null);
    }
  };

  const cancelDeleteAlbum = () => {
    setShowDeleteModal(false);
    setAlbumToDelete(null);
  };

  // Download a single image
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open image in new tab if fetch fails (e.g., CORS issues)
      window.open(imageUrl, '_blank');
    }
  };

  const handleBulkDownload = async () => {
    if (multiSelectAlbum && selectedImages.length > 0) {
      const albumName = multiSelectAlbum.title.replace(/[^a-z0-9]/gi, '_');
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const imageIndex = multiSelectAlbum.images.indexOf(image);
        const filename = `${albumName}_${imageIndex + 1}.jpg`;
        await downloadImage(image, filename);
        // Small delay between downloads to prevent browser blocking
        if (i < selectedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  // Download current image in viewer
  const handleDownloadCurrentImage = () => {
    if (viewerAlbum) {
      const albumName = viewerAlbum.title.replace(/[^a-z0-9]/gi, '_');
      const filename = `${albumName}_${currentImageIndex + 1}.jpg`;
      downloadImage(viewerAlbum.images[currentImageIndex], filename);
    }
  };

  const handleBulkDelete = () => {
    if (selectedImages.length > 0) {
      const count = selectedImages.length;
      setConfirmationModal({
        show: true,
        title: 'Delete Images',
        message: `Are you sure you want to delete ${count} image(s)? This action cannot be undone.`,
        onConfirm: () => {
          setNotificationModal({ show: true, title: 'Images Deleted', message: `${count} image(s) deleted successfully!`, type: 'success' });
          setSelectedImages([]);
          setConfirmationModal({ show: false, title: '', message: '', onConfirm: () => {} });
        }
      });
    }
  };

  const getShareLink = (album: Album) => {
    return `https://connekt.com/gallery/${album.id}`;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Keyboard navigation for image viewer
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showImageViewer || !viewerAlbum) return;

    if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (e.key === 'ArrowRight' && currentImageIndex < viewerAlbum.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (e.key === 'Escape') {
      closeImageViewer();
    }
  }, [showImageViewer, viewerAlbum, currentImageIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .mobile-title {
            font-size: 1.5rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .mobile-tabs {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .mobile-albums-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-multi-select-header {
            padding: 0.75rem 1rem !important;
            flex-wrap: wrap !important;
            gap: 0.75rem !important;
          }
          .mobile-multi-select-title {
            font-size: 1rem !important;
          }
          .mobile-multi-select-grid {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-multi-select-grid > div {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mobile-select-controls {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            padding: 0.75rem 1rem !important;
          }
          .mobile-bulk-actions {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .mobile-bulk-actions button {
            font-size: 0.75rem !important;
            padding: 0.375rem 0.75rem !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .mobile-multi-select-grid {
            padding-bottom: 10rem !important;
          }
          .mobile-multi-select-grid > div {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="client" />

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600', margin: 0 }}>My Gallery</h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#16A34A'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Completed Events
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Albums and photos from your completed events, shared by your photographers
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: viewMode === 'grid' ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                  backgroundColor: viewMode === 'grid' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF') : colors.bgCard,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <GridIcon active={viewMode === 'grid'} activeColor={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: viewMode === 'list' ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                  backgroundColor: viewMode === 'list' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF') : colors.bgCard,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ListIcon active={viewMode === 'list'} activeColor={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} />
              </button>

              {/* Photobook Buttons */}
              <button
                onClick={() => {
                  if (photobook) {
                    setNotificationModal({ show: true, title: 'Photobook Exists', message: 'You already have a photobook created. Only one photobook is supported at this time.', type: 'info' });
                  } else {
                    setShowCreatePhotobookModal(true);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                  backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF',
                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                <PlusIcon />
                Create Photobook
              </button>

              {photobook && (
                <button
                  onClick={() => setViewingPhotobooks(!viewingPhotobooks)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                    backgroundColor: viewingPhotobooks
                      ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85')
                      : (actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF'),
                    color: viewingPhotobooks ? 'white' : (actualTheme === 'dark' ? '#60A5FA' : '#083A85'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  <BookIcon />
                  {viewingPhotobooks ? 'View Sent Albums' : 'View Photobooks'}
                </button>
              )}
            </div>
          </header>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{albums.length}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Photos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{totalPhotos}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Downloaded</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{totalDownloaded}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>{totalFavorites}</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', border: `1px solid ${colors.borderPrimary}` }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search albums or photographers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '0.625rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>

              {/* Photographer Filter */}
              <select
                value={filterPhotographer}
                onChange={(e) => setFilterPhotographer(e.target.value)}
                style={{
                  padding: '0.625rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  cursor: 'pointer'
                }}
              >
                {photographers.map(p => (
                  <option key={p} value={p}>{p === 'All' ? 'All Photographers' : p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photobook View or Albums Grid/List */}
          {viewingPhotobooks && photobook ? (
            // Photobook View
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  border: `1px solid ${colors.borderPrimary}`,
                  cursor: 'pointer'
                }}
                onClick={() => setShowPhotobookModal(true)}
              >
                {/* Photobook Thumbnail */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden', backgroundColor: colors.bgTertiary }}>
                  {photobook.thumbnail ? (
                    <Image src={photobook.thumbnail} alt={photobook.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textSecondary }}>
                      <BookIcon />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {photobook.images.length} photos
                  </div>
                </div>

                {/* Photobook Info */}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
                    {photobook.name}
                  </h3>
                  {photobook.description && (
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, marginBottom: '0.75rem' }}>
                      {photobook.description}
                    </p>
                  )}

                  {photobook.images.length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF',
                      borderRadius: '0.5rem',
                      border: `1px dashed ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', margin: 0 }}>
                        Select preferred images from sent albums to add to this Photobook.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPhotobookModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #062a63',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <EyeIcon />
                        Browse
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotificationModal({ show: true, title: 'Coming Soon', message: 'Share functionality coming soon!', type: 'info' });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <ShareIcon />
                        Share
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Download all images
                          for (let i = 0; i < photobook.images.length; i++) {
                            const img = photobook.images[i];
                            const filename = `${photobook.name.replace(/[^a-z0-9]/gi, '_')}_${i + 1}.jpg`;
                            await downloadImage(img.url, filename);
                            if (i < photobook.images.length - 1) {
                              await new Promise(resolve => setTimeout(resolve, 300));
                            }
                          }
                        }}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isLoadingAlbums ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.borderPrimary}`,
              color: colors.textSecondary,
              fontSize: '0.95rem',
            }}>
              Loading your gallery…
            </div>
          ) : albumsError ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.borderPrimary}`,
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
                Couldn&apos;t load your albums
              </h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, marginBottom: '1rem' }}>{albumsError}</p>
              <button
                onClick={fetchAlbums}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                  backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF',
                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          ) : albums.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.borderPrimary}`,
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
                No albums yet
              </h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0 }}>
                Albums shared by your photographers after a completed event will appear here.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: `1px solid ${colors.borderPrimary}`,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedAlbum(album);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Album Thumbnail */}
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <Image
                      src={album.thumbnail}
                      alt={album.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {album.photoCount} photos
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>
                      {album.category}
                    </div>
                  </div>

                  {/* Album Info */}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
                      {album.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                        <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{album.photographer}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.75rem' }}>
                      Received: {album.receivedDate}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMultiSelectView(album);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #062a63',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <EyeIcon />
                        Browse
                      </button>
                      {!photobook && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareAlbum(album);
                            setShowShareModal(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #9CA3AF',
                            backgroundColor: colors.bgTertiary,
                            color: colors.textPrimary,
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <ShareIcon />
                          Share
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(album);
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #FCA5A5',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '0.8rem',
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
          ) : (
            /* List View */
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', border: `1px solid ${colors.borderPrimary}`, overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                gap: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: colors.bgTertiary,
                borderBottom: `1px solid ${colors.borderPrimary}`,
                fontSize: '0.8rem',
                fontWeight: '600',
                color: colors.textSecondary
              }}>
                <div></div>
                <div>Album</div>
                <div>Photographer</div>
                <div>Photos</div>
                <div>Category</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    borderBottom: `1px solid ${colors.borderPrimary}`,
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => {
                    setSelectedAlbum(album);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgCard;
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', width: '80px', height: '50px', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                  </div>

                  {/* Album Title */}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{album.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Received: {album.receivedDate}</div>
                  </div>

                  {/* Photographer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                      <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: colors.textPrimary }}>{album.photographer}</span>
                  </div>

                  {/* Photos Count */}
                  <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{album.photoCount} photos</div>

                  {/* Category */}
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {album.category}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMultiSelectView(album);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #062a63',
                        backgroundColor: '#083A85',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Browse
                    </button>
                    {!photobook && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareAlbum(album);
                          setShowShareModal(true);
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Share
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(album);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #FCA5A5',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete Album"
                    >
                      <i className="bi bi-trash" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Album View Modal */}
      {showViewModal && selectedAlbum && (
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
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Album Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
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

            {/* Album Preview */}
            <div style={{ position: 'relative', height: '250px', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <Image src={selectedAlbum.thumbnail} alt={selectedAlbum.title} fill style={{ objectFit: 'cover' }} />
            </div>

            {/* Album Info */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
              {selectedAlbum.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                <Image src={selectedAlbum.photographerAvatar} alt={selectedAlbum.photographer} fill style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{selectedAlbum.photographer}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Photographer</div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: colors.bgTertiary,
              borderRadius: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedAlbum.photoCount}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Photos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16A34A' }}>{selectedAlbum.downloadedCount}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Downloaded</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#DC2626' }}>{selectedAlbum.favoriteCount}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Favorites</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>
              <span>Category: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.category}</strong></span>
              <span>Received: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.receivedDate}</strong></span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openMultiSelectView(selectedAlbum);
                  }}
                  style={{
                    flex: 1,
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
                    gap: '0.5rem'
                  }}
                >
                  <ImageIcon />
                  Browse Photos
                </button>
                {!photobook && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShareAlbum(selectedAlbum);
                      setShowShareModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #9CA3AF',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary,
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShareIcon />
                    Share Album
                  </button>
                )}
              </div>
              {photobook && (
                <p style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', textAlign: 'center', margin: 0, fontWeight: '500' }}>
                  Browse photos to select and add to &quot;{photobook.name}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal with Social Media */}
      {showShareModal && shareAlbum && (
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
            zIndex: 2500,
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Share Album</h3>
              <button
                onClick={() => setShowShareModal(false)}
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

            {/* Album Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <Image src={shareAlbum.thumbnail} alt={shareAlbum.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '0.9rem' }}>{shareAlbum.title}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{shareAlbum.photoCount} photos • {shareAlbum.photographer}</div>
              </div>
            </div>

            {/* Social Media Share Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}` },
                { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}` },
                { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this album: ${link}`)}` },
                { name: 'Copy Link', icon: <LinkIcon />, color: colors.textSecondary, getUrl: () => '' },
                { name: 'QR Code', icon: <QRCodeIcon />, color: colors.textPrimary, getUrl: () => '' }
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    const shareLink = getShareLink(shareAlbum);
                    if (option.name === 'Copy Link') {
                      handleCopyLink(shareLink);
                    } else if (option.name === 'QR Code') {
                      setNotificationModal({ show: true, title: 'Coming Soon', message: 'QR Code feature coming soon!', type: 'info' });
                    } else {
                      const url = option.getUrl(shareLink, shareAlbum.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    border: option.name === 'Copy Link' && copiedLink ? '1px solid #10B981' : `1px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    background: option.name === 'Copy Link' && copiedLink ? (actualTheme === 'dark' ? '#14532D' : '#ECFDF5') : colors.bgCard,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: option.name === 'Copy Link' && copiedLink ? '#10B981' : colors.textPrimary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!(option.name === 'Copy Link' && copiedLink)) {
                      e.currentTarget.style.borderColor = option.color;
                      e.currentTarget.style.color = option.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(option.name === 'Copy Link' && copiedLink)) {
                      e.currentTarget.style.borderColor = colors.borderPrimary;
                      e.currentTarget.style.color = colors.textPrimary;
                    }
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.name === 'Copy Link' && copiedLink ? 'Copied!' : option.name}</span>
                </button>
              ))}
            </div>

            {/* Album Link Input */}
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Album Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={getShareLink(shareAlbum)}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgTertiary
                  }}
                />
                <button
                  onClick={() => handleCopyLink(getShareLink(shareAlbum))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    border: copiedLink ? '2px solid #059669' : '2px solid #062a63',
                    borderRadius: '0.375rem',
                    background: copiedLink ? '#10B981' : '#083A85',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <CopyIcon />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
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
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001
          }}
          onClick={closeMultiSelectView}
        >
          {/* Header */}
          <div
            className="mobile-multi-select-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 className="mobile-multi-select-title" style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>{multiSelectAlbum.title}</h2>
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>({multiSelectAlbum.images.length} photos)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Select Mode Toggle - hidden when photobook exists (always in select mode) */}
              {!photobook && (
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    if (isSelectMode) {
                      setSelectedImages([]);
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '2px solid',
                    borderColor: isSelectMode ? '#16A34A' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: isSelectMode ? '#16A34A' : 'transparent',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={false} />
                  {isSelectMode ? 'Exit Select Mode' : 'Select Mode'}
                </button>
              )}

              {/* Max images info when photobook exists */}
              {photobook && (
                <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.375rem' }}>
                  Max: {MAX_PHOTOBOOK_IMAGES} images
                </span>
              )}

              {/* Close Button */}
              <button
                onClick={closeMultiSelectView}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls (visible when in select mode) */}
          {isSelectMode && (
            <div
              className="mobile-select-controls"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                borderBottom: '1px solid rgba(22, 163, 74, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#16A34A'
                }}>
                  {selectedImages.length} of {photobook ? MAX_PHOTOBOOK_IMAGES : multiSelectAlbum.images.length} {photobook ? 'max' : ''} selected
                </span>
                <button
                  onClick={selectAllImages}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #16A34A',
                    backgroundColor: 'transparent',
                    color: '#16A34A',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {selectedImages.length === multiSelectAlbum.images.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedImages.length > 0 && (
                <div className="mobile-bulk-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                  {photobook ? (
                    // When photobook exists: show "Add to Photobook" only
                    <button
                      onClick={() => {
                        if (!multiSelectAlbum) return;
                        // Add selected images to photobook
                        const newImages: PhotobookImage[] = selectedImages.map(url => ({
                          url,
                          sourceAlbumId: multiSelectAlbum.id,
                          sourceAlbumTitle: multiSelectAlbum.title,
                          addedAt: new Date().toISOString()
                        }));
                        setPhotobook({
                          ...photobook,
                          images: [...photobook.images, ...newImages]
                        });
                        // Remove album from view
                        setRemovedAlbumIds([...removedAlbumIds, multiSelectAlbum.id]);
                        // Close multi-select and show thumbnail selector
                        closeMultiSelectView();
                        setShowThumbnailSelector(true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        backgroundColor: '#16A34A',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
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
                      <BookIcon />
                      Add to Photobook ({selectedImages.length})
                    </button>
                  ) : (
                    // Original actions when no photobook: download, share, delete
                    <>
                      <button
                        onClick={handleBulkDownload}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
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
                        <DownloadIcon />
                        Download ({selectedImages.length})
                      </button>
                      <button
                        onClick={() => {
                          setShareAlbum(multiSelectAlbum);
                          setShowShareModal(true);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#16A34A',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
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
                        <ShareIcon />
                        Share ({selectedImages.length})
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#DC2626',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#B91C1C';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#DC2626';
                        }}
                      >
                        <TrashIcon />
                        Delete ({selectedImages.length})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image Grid */}
          <div
            className="mobile-multi-select-grid"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {multiSelectAlbum.images.map((image, index) => {
                const isMaxReached = photobook && selectedImages.length >= MAX_PHOTOBOOK_IMAGES;
                const isDisabled = isMaxReached && !selectedImages.includes(image);
                return (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: isDisabled ? 'not-allowed' : (isSelectMode ? 'pointer' : 'default'),
                    border: selectedImages.includes(image)
                      ? '3px solid #16A34A'
                      : '3px solid transparent',
                    transition: 'all 0.2s',
                    transform: selectedImages.includes(image) ? 'scale(0.98)' : 'scale(1)',
                    opacity: isDisabled ? 0.4 : 1,
                    pointerEvents: isDisabled ? 'none' : 'auto'
                  }}
                  onClick={() => {
                    if (isDisabled) return;
                    if (isSelectMode) {
                      toggleImageSelection(image);
                    } else {
                      openImageViewer(multiSelectAlbum, index);
                    }
                  }}
                >
                  <Image
                    src={image}
                    alt={`${multiSelectAlbum.title} - Image ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />

                  {/* Selection Overlay */}
                  {isSelectMode && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: selectedImages.includes(image)
                        ? 'rgba(22, 163, 74, 0.3)'
                        : 'rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      padding: '0.75rem',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: selectedImages.includes(image)
                          ? 'none'
                          : '2px solid rgba(255, 255, 255, 0.8)',
                        backgroundColor: selectedImages.includes(image)
                          ? '#16A34A'
                          : 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        {selectedImages.includes(image) && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image Number Badge (when not in select mode) */}
                  {!isSelectMode && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {index + 1}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
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
            zIndex: 2000
          }}
          onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
          tabIndex={0}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Image src={viewerAlbum.thumbnail} alt={viewerAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    margin: 0
                  }}>{viewerAlbum.title}</h3>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: 0
                  }}>{viewerAlbum.photographer}</p>
                </div>
              </div>
              <span style={{
                backgroundColor: 'rgba(8, 58, 133, 0.8)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                {currentImageIndex + 1} of {viewerAlbum.images.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleDownloadCurrentImage}
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Download image"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={closeImageViewer}
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Main Image Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '2rem',
            minHeight: 0
          }}>
            {/* Previous Button */}
            <button
              onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: currentImageIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
                opacity: currentImageIndex > 0 ? 1 : 0.3
              }}
              onMouseEnter={(e) => {
                if (currentImageIndex > 0) {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ChevronLeftIcon />
            </button>

            {/* Image Display */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 100px'
            }}>
              <div style={{
                width: 'min(calc(100vh - 160px), calc(100vw - 250px))',
                height: 'min(calc(100vh - 160px), calc(100vw - 250px))',
                position: 'relative',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <Image
                  src={viewerAlbum.images[currentImageIndex]}
                  alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
                  fill
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
                opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 1 : 0.3
              }}
              onMouseEnter={(e) => {
                if (currentImageIndex < viewerAlbum.images.length - 1) {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            padding: '1rem 1.5rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              justifyContent: 'center'
            }}>
              {viewerAlbum.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: currentImageIndex === index
                      ? '3px solid #083A85'
                      : '3px solid transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    opacity: currentImageIndex === index ? 1 : 0.6,
                    transform: currentImageIndex === index ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (currentImageIndex !== index) {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentImageIndex !== index) {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {currentImageIndex === index && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#083A85'
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && albumToDelete && (
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
          onClick={cancelDeleteAlbum}
        >
          <div
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
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2rem', color: '#DC2626' }}></i>
              </div>
            </div>

            {/* Modal Header */}
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: colors.textPrimary,
              margin: 0,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>Delete Album</h2>

            {/* Modal Content */}
            <p style={{
              fontSize: '0.95rem',
              color: colors.textSecondary,
              margin: 0,
              marginBottom: '0.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{albumToDelete.title}&quot;</strong>?
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: '#DC2626',
              margin: 0,
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              This action cannot be undone. All {albumToDelete.photoCount} photos will be permanently removed.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={cancelDeleteAlbum}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <i className="bi bi-trash" style={{ fontSize: '1rem' }}></i>
                Delete Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Photobook Modal */}
      {showCreatePhotobookModal && (
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
          onClick={() => setShowCreatePhotobookModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
              maxWidth: '95%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Create Photobook</h2>
              <button
                onClick={() => setShowCreatePhotobookModal(false)}
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

            {/* Photobook Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Photobook Name *
              </label>
              <input
                type="text"
                value={photobookName}
                onChange={(e) => setPhotobookName(e.target.value)}
                placeholder="Enter photobook name"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  outline: 'none'
                }}
              />
            </div>

            {/* Photobook Description */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea
                value={photobookDescription}
                onChange={(e) => setPhotobookDescription(e.target.value)}
                placeholder="Enter a description for your photobook"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* Thumbnail Selection from Albums */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Select Thumbnail (Optional)
              </label>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
                Choose a cover image from your sent albums
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setPhotobookThumbnailUrl(album.thumbnail)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: photobookThumbnailUrl === album.thumbnail ? '3px solid #083A85' : '2px solid transparent'
                    }}
                  >
                    <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                    {photobookThumbnailUrl === album.thumbnail && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px', color: 'white', backgroundColor: '#083A85', borderRadius: '50%', padding: '2px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCreatePhotobookModal(false)}
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
                onClick={() => {
                  if (!photobookName.trim()) {
                    setNotificationModal({ show: true, title: 'Required Field', message: 'Please enter a photobook name.', type: 'warning' });
                    return;
                  }
                  const newPhotobook: Photobook = {
                    id: Date.now().toString(),
                    name: photobookName,
                    description: photobookDescription,
                    thumbnail: photobookThumbnailUrl,
                    createdAt: new Date().toISOString(),
                    images: [],
                    maxImages: 100 // Placeholder
                  };
                  setPhotobook(newPhotobook);
                  setShowCreatePhotobookModal(false);
                  setPhotobookName('');
                  setPhotobookDescription('');
                  setPhotobookThumbnailUrl(null);
                }}
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
                Create Photobook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Photobook Modal - Image Selection */}
      {showAddToPhotobookModal && addToPhotobookAlbum && photobook && (
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
            zIndex: 1200
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                Select Images for &quot;{photobook.name}&quot;
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.25rem 0 0' }}>
                From: {addToPhotobookAlbum.title} ({addToPhotobookAlbum.images.length} photos)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#16A34A', fontWeight: '600' }}>
                {selectedImagesForPhotobook.length} selected
              </span>
              <button
                onClick={() => {
                  setShowAddToPhotobookModal(false);
                  setAddToPhotobookAlbum(null);
                  setSelectedImagesForPhotobook([]);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            borderBottom: '1px solid rgba(22, 163, 74, 0.3)'
          }}>
            <button
              onClick={() => {
                if (selectedImagesForPhotobook.length === addToPhotobookAlbum.images.length) {
                  setSelectedImagesForPhotobook([]);
                } else {
                  setSelectedImagesForPhotobook([...addToPhotobookAlbum.images]);
                }
              }}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #16A34A',
                backgroundColor: 'transparent',
                color: '#16A34A',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {selectedImagesForPhotobook.length === addToPhotobookAlbum.images.length ? 'Deselect All' : 'Select All'}
            </button>

            {selectedImagesForPhotobook.length > 0 && (
              <button
                onClick={() => {
                  // Add selected images to photobook
                  const newImages: PhotobookImage[] = selectedImagesForPhotobook.map(url => ({
                    url,
                    sourceAlbumId: addToPhotobookAlbum.id,
                    sourceAlbumTitle: addToPhotobookAlbum.title,
                    addedAt: new Date().toISOString()
                  }));

                  setPhotobook({
                    ...photobook,
                    images: [...photobook.images, ...newImages]
                  });

                  // Remove album from view
                  setRemovedAlbumIds([...removedAlbumIds, addToPhotobookAlbum.id]);

                  // Show thumbnail selector
                  setShowAddToPhotobookModal(false);
                  setShowThumbnailSelector(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <BookIcon />
                Add {selectedImagesForPhotobook.length} to Photobook
              </button>
            )}
          </div>

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {addToPhotobookAlbum.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (selectedImagesForPhotobook.includes(image)) {
                      setSelectedImagesForPhotobook(selectedImagesForPhotobook.filter(img => img !== image));
                    } else {
                      setSelectedImagesForPhotobook([...selectedImagesForPhotobook, image]);
                    }
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImagesForPhotobook.includes(image) ? '3px solid #16A34A' : '3px solid transparent',
                    transform: selectedImagesForPhotobook.includes(image) ? 'scale(0.98)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Image src={image} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: selectedImagesForPhotobook.includes(image) ? 'rgba(22, 163, 74, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    padding: '0.75rem'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: selectedImagesForPhotobook.includes(image) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                      backgroundColor: selectedImagesForPhotobook.includes(image) ? '#16A34A' : 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {selectedImagesForPhotobook.includes(image) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Selector Modal - After adding images */}
      {showThumbnailSelector && photobook && photobook.images.length > 0 && (
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
            zIndex: 1300,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '600px',
              maxWidth: '95%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
              Select Photobook Thumbnail
            </h2>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1rem' }}>
              Choose a cover image for your photobook from the images you just added
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {photobook.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setPhotobook({ ...photobook, thumbnail: image.url })}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: photobook.thumbnail === image.url ? '3px solid #083A85' : '2px solid transparent'
                  }}
                >
                  <Image src={image.url} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {photobook.thumbnail === image.url && (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', color: 'white', backgroundColor: '#083A85', borderRadius: '50%', padding: '2px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowThumbnailSelector(false);
                setAddToPhotobookAlbum(null);
                setSelectedImagesForPhotobook([]);
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
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Photobook Modal - Full View with Actions */}
      {showPhotobookModal && photobook && (
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
            zIndex: 1400
          }}
        >
          {/* Header with Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                {photobook.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.25rem 0 0' }}>
                {photobook.images.length} photos
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Share Button */}
              <button
                onClick={() => {
                  setShowPhotobookModal(false);
                  setNotificationModal({ show: true, title: 'Coming Soon', message: 'Share functionality coming soon!', type: 'info' });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShareIcon />
                Share
              </button>

              {/* Download Button */}
              <button
                onClick={async () => {
                  // Download all images in photobook
                  for (let i = 0; i < photobook.images.length; i++) {
                    const img = photobook.images[i];
                    const filename = `${photobook.name.replace(/[^a-z0-9]/gi, '_')}_${i + 1}.jpg`;
                    await downloadImage(img.url, filename);
                    if (i < photobook.images.length - 1) {
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <DownloadIcon />
                Download All
              </button>

              {/* Delete Button */}
              <button
                onClick={() => {
                  setConfirmationModal({
                    show: true,
                    title: 'Delete Photobook',
                    message: 'Are you sure you want to delete this photobook? This action cannot be undone and all curated images will be lost.',
                    onConfirm: () => {
                      setPhotobook(null);
                      setRemovedAlbumIds([]);
                      setViewingPhotobooks(false);
                      setShowPhotobookModal(false);
                      setConfirmationModal({ show: false, title: '', message: '', onConfirm: () => {} });
                    }
                  });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: 'transparent',
                  color: '#DC2626',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <TrashIcon />
                Delete
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowPhotobookModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {photobook.images.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <BookIcon />
                  <p style={{ marginTop: '1rem' }}>No images yet. Switch to &quot;View Sent Albums&quot; to add images.</p>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {photobook.images.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Open image viewer
                      setViewerAlbum({
                        id: '',
                        title: photobook.name,
                        photographer: '',
                        photographerAvatar: '',
                        category: '',
                        date: '',
                        receivedDate: '',
                        thumbnail: photobook.thumbnail || '',
                        photoCount: photobook.images.length,
                        downloadedCount: 0,
                        favoriteCount: 0,
                        images: photobook.images.map(img => img.url)
                      });
                      setCurrentImageIndex(index);
                      setShowImageViewer(true);
                      setShowPhotobookModal(false);
                    }}
                  >
                    <Image src={image.url} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem'
                    }}>
                      From: {image.sourceAlbumTitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal.show && (
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
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setNotificationModal({ ...notificationModal, show: false })}
        >
          <div
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
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: notificationModal.type === 'success' ? '#DCFCE7' :
                                 notificationModal.type === 'error' ? '#FEE2E2' :
                                 notificationModal.type === 'warning' ? '#FEF3C7' : '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notificationModal.type === 'success' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {notificationModal.type === 'error' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                )}
                {notificationModal.type === 'warning' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                )}
                {notificationModal.type === 'info' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem', textAlign: 'center' }}>
              {notificationModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, marginBottom: '1.25rem', textAlign: 'center', lineHeight: '1.5' }}>
              {notificationModal.message}
            </p>
            <button
              onClick={() => setNotificationModal({ ...notificationModal, show: false })}
              style={{
                width: '100%',
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
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.show && (
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
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setConfirmationModal({ ...confirmationModal, show: false })}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '420px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem', textAlign: 'center' }}>
              {confirmationModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              {confirmationModal.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmationModal({ ...confirmationModal, show: false })}
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
                onClick={confirmationModal.onConfirm}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;
