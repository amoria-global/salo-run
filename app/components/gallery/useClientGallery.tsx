'use client';

// app/pages/client/gallery.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import EventConfirmModal from '@/app/components/EventConfirmModal';
import ArchiveRestoreFlow from '@/app/components/ArchiveRestoreFlow';
import Topbar from '@/app/components/topbar';
import Image from 'next/image';
import { useTheme } from '@/app/context/ThemeContext';
import { dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import SortDropdown from '@/app/components/SortDropdown';

// Photobook Interfaces
export interface PhotobookImage {
  url: string;
  sourceAlbumId: string;
  sourceAlbumTitle: string;
  addedAt: string;
}

export interface Photobook {
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
// flattened so `images` is a plain string[] of full URLs. the rest of
// this page treats images as URLs, not media-item objects.
export interface Album {
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
  /** Archived: locked after its 6 months of access ran out. Opening it offers to restore it. */
  isLocked: boolean;
  lockedAt: string | null;
  archiveFee: number | null;
  archiveCurrency: string | null;
  eventId: string | null;
}


export function useClientGallery() {
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
  const [albumTab, setAlbumTab] = useState<'all' | 'archived'>('all');
  const [restoreAlbum, setRestoreAlbum] = useState<Album | null>(null);
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
          isLocked: a.isLocked === true,
          lockedAt: (a.lockedAt as string) || null,
          archiveFee: typeof a.archiveFee === 'number' ? a.archiveFee : null,
          archiveCurrency: (a.archiveCurrency as string) || null,
          eventId: (a.eventId as string) || null,
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

  // Deep-link from album-detail's "Create photobook" CTA:
  //   /user/client/gallery?tab=photobooks&albumId=<uuid>&create=1
  // Switch into the photobook tab when ?tab=photobooks, and either open the
  // create modal (no existing photobook) or the per-album "add to photobook"
  // picker (photobook already exists) — without this, the client landed on
  // the gallery page and the CTA was effectively dead.
  const searchParams = useSearchParams();
  const [deepLinkConsumed, setDeepLinkConsumed] = useState(false);
  useEffect(() => {
    if (deepLinkConsumed || !searchParams) return;
    if (isLoadingAlbums) return;
    const tab = searchParams.get('tab');
    const albumId = searchParams.get('albumId');
    const create = searchParams.get('create');
    if (tab !== 'photobooks' && create !== '1' && !albumId) return;

    if (tab === 'photobooks') setViewingPhotobooks(true);

    if (create === '1' || albumId) {
      if (photobook && albumId) {
        const sourceAlbum = albums.find(a => a.id === albumId);
        if (sourceAlbum) {
          setAddToPhotobookAlbum(sourceAlbum);
          setSelectedImagesForPhotobook([]);
          setShowAddToPhotobookModal(true);
        }
      } else if (!photobook) {
        setShowCreatePhotobookModal(true);
      }
    }

    setDeepLinkConsumed(true);
  }, [searchParams, isLoadingAlbums, albums, photobook, deepLinkConsumed]);

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
    const matchesTab = albumTab === 'all' || album.isLocked;
    return matchesSearch && matchesCategory && matchesPhotographer && matchesTab;
  });
  const archivedCount = albums.filter((a) => a.isLocked).length;

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


  return {
    colors,
    actualTheme,
    albums,
    setAlbums,
    isLoadingAlbums,
    setIsLoadingAlbums,
    albumsError,
    setAlbumsError,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterPhotographer,
    setFilterPhotographer,
    showViewModal,
    setShowViewModal,
    selectedAlbum,
    setSelectedAlbum,
    showMultiSelectView,
    setShowMultiSelectView,
    multiSelectAlbum,
    setMultiSelectAlbum,
    selectedImages,
    setSelectedImages,
    isSelectMode,
    setIsSelectMode,
    showImageViewer,
    setShowImageViewer,
    viewerAlbum,
    setViewerAlbum,
    currentImageIndex,
    setCurrentImageIndex,
    showShareModal,
    setShowShareModal,
    shareAlbum,
    setShareAlbum,
    copiedLink,
    setCopiedLink,
    showDeleteModal,
    setShowDeleteModal,
    albumTab,
    setAlbumTab,
    restoreAlbum,
    setRestoreAlbum,
    albumToDelete,
    setAlbumToDelete,
    photobook,
    setPhotobook,
    showCreatePhotobookModal,
    setShowCreatePhotobookModal,
    showPhotobookModal,
    setShowPhotobookModal,
    viewingPhotobooks,
    setViewingPhotobooks,
    photobookName,
    setPhotobookName,
    photobookDescription,
    setPhotobookDescription,
    photobookThumbnailUrl,
    setPhotobookThumbnailUrl,
    showAddToPhotobookModal,
    setShowAddToPhotobookModal,
    addToPhotobookAlbum,
    setAddToPhotobookAlbum,
    selectedImagesForPhotobook,
    setSelectedImagesForPhotobook,
    showThumbnailSelector,
    setShowThumbnailSelector,
    removedAlbumIds,
    setRemovedAlbumIds,
    notificationModal,
    setNotificationModal,
    confirmationModal,
    setConfirmationModal,
    fetchAlbums,
    searchParams,
    deepLinkConsumed,
    setDeepLinkConsumed,
    categories,
    photographers,
    filteredAlbums,
    archivedCount,
    totalPhotos,
    totalDownloaded,
    totalFavorites,
    MAX_PHOTOBOOK_IMAGES,
    openMultiSelectView,
    closeMultiSelectView,
    openImageViewer,
    closeImageViewer,
    toggleImageSelection,
    selectAllImages,
    openDeleteModal,
    confirmDeleteAlbum,
    cancelDeleteAlbum,
    downloadImage,
    handleBulkDownload,
    handleDownloadCurrentImage,
    handleBulkDelete,
    getShareLink,
    handleCopyLink,
    handleKeyDown,
  };
}

export type ClientGalleryController = ReturnType<typeof useClientGallery>;
