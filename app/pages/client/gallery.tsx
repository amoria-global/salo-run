'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import EventConfirmModal from '../../components/EventConfirmModal';
import ArchiveRestoreFlow from '../../components/ArchiveRestoreFlow';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import { dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import SortDropdown from '../../components/SortDropdown';

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
// flattened so `images` is a plain string[] of full URLs. the rest of
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
  /** Archived: locked after its year of access ran out. Opening it offers to restore it. */
  isLocked: boolean;
  lockedAt: string | null;
  archiveFee: number | null;
  archiveCurrency: string | null;
  eventId: string | null;
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
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', margin: '8px 0 22px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>LIBRARY</div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 9px',
                  background: actualTheme === 'dark' ? 'rgba(22,163,74,0.16)' : '#ECFDF5',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(22,163,74,0.35)' : '#BBF7D0'}`,
                  borderRadius: 9999,
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: actualTheme === 'dark' ? '#4ADE80' : '#166534',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: 10 }} />
                  Completed events
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: colors.textPrimary }}>My gallery</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                Albums and photos from your completed events, shared by your photographers.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* View mode toggle (ck-tabs style segmented pill) */}
              <div className="ck-tabs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`ck-tab ${viewMode === 'grid' ? 'is-active' : ''}`}
                  title="Grid view"
                  style={{ padding: '7px 12px' }}
                >
                  <i className="bi bi-grid-fill" style={{ fontSize: 13 }} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`ck-tab ${viewMode === 'list' ? 'is-active' : ''}`}
                  title="List view"
                  style={{ padding: '7px 12px' }}
                >
                  <i className="bi bi-list-ul" style={{ fontSize: 14 }} />
                </button>
              </div>

              {/* Create Photobook */}
              <button
                onClick={() => {
                  if (photobook) {
                    setNotificationModal({ show: true, title: 'Photobook Exists', message: 'You already have a photobook created. Only one photobook is supported at this time.', type: 'info' });
                  } else {
                    setShowCreatePhotobookModal(true);
                  }
                }}
                className="ck-btn ck-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <i className="bi bi-plus-lg" style={{ fontSize: 12 }} />
                Create photobook
              </button>

              {photobook && (
                <button
                  onClick={() => setViewingPhotobooks(!viewingPhotobooks)}
                  className={viewingPhotobooks ? 'ck-btn ck-btn-primary' : 'ck-btn ck-btn-soft'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <i className="bi bi-book-half" style={{ fontSize: 13 }} />
                  {viewingPhotobooks ? 'View sent albums' : 'View photobooks'}
                </button>
              )}
            </div>
          </header>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {([
              { label: 'Total albums', value: albums.length.toString(),  accent: '#083A85', tint: 'rgba(8,58,133,0.10)',  icon: 'bi-images' },
              { label: 'Total photos', value: totalPhotos.toLocaleString(), accent: '#3B82F6', tint: 'rgba(59,130,246,0.12)', icon: 'bi-camera-fill' },
              { label: 'Downloaded',   value: totalDownloaded.toString(), accent: '#16A34A', tint: 'rgba(22,163,74,0.12)', icon: 'bi-download' },
              { label: 'Favorites',    value: totalFavorites.toString(),  accent: '#F20C8F', tint: 'rgba(242,12,143,0.12)', icon: 'bi-heart-fill' },
            ] as const).map((stat) => (
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

          {/* Albums | Archived. Archived albums are the locked ones; the tab appears once there is one. */}
          {!viewingPhotobooks && (archivedCount > 0 || albumTab === 'archived') && (
            <div className="ck-tabs" style={{ marginBottom: '1rem' }} role="tablist" aria-label="Albums">
              <button type="button" role="tab" aria-selected={albumTab === 'all'} onClick={() => setAlbumTab('all')} className={`ck-tab ${albumTab === 'all' ? 'is-active' : ''}`}>
                All albums
              </button>
              <button type="button" role="tab" aria-selected={albumTab === 'archived'} onClick={() => setAlbumTab('archived')} className={`ck-tab ${albumTab === 'archived' ? 'is-active' : ''}`}>
                <i className="bi bi-archive-fill" style={{ fontSize: 12, marginRight: 6 }} />
                Archived ({archivedCount})
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="ck-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div className="ck-search" style={{ flex: 1, minWidth: 220 }}>
                <i className="bi bi-search" />
                <input
                  type="search"
                  placeholder="Search albums or photographers…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <SortDropdown
                value={filterCategory}
                onChange={setFilterCategory}
                buttonIcon="bi-tag-fill"
                options={categories.map(cat => ({ value: cat, label: cat === 'All' ? 'All categories' : cat, icon: cat === 'All' ? 'bi-grid-3x3-gap-fill' : 'bi-tag-fill' }))}
                minWidth={170}
              />

              {/* Photographer Filter */}
              <SortDropdown
                value={filterPhotographer}
                onChange={setFilterPhotographer}
                buttonIcon="bi-camera-fill"
                options={photographers.map(p => ({ value: p, label: p === 'All' ? 'All photographers' : p, icon: p === 'All' ? 'bi-people-fill' : 'bi-person-fill' }))}
                minWidth={190}
              />
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
            <div className="ck-empty ck-card" style={{
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
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                  No albums yet
                </div>
                <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 460, lineHeight: 1.5 }}>
                  Albums shared by your photographers after a completed event will appear here, ready for you to browse, download, and turn into a photobook.
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: `1px solid ${colors.borderPrimary}`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (album.isLocked) { setRestoreAlbum(album); return; }
                    setSelectedAlbum(album);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 14px 28px -10px rgba(8,58,133,0.18)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                  }}
                >
                  {/* Album Thumbnail */}
                  <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                    <Image
                      src={album.thumbnail}
                      alt={album.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {album.isLocked && (
                      <div style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(8,58,133,0.85)', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.25)' }}>
                        <i className="bi bi-lock-fill" style={{ fontSize: 11 }} />
                        Archived
                      </div>
                    )}
                    {/* Soft gradient overlay for badge legibility */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.30) 100%)', pointerEvents: 'none' }} />
                    {/* Photo count pill */}
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255,255,255,0.20)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <i className="bi bi-images" style={{ fontSize: 10 }} />
                      {album.photoCount} photos
                    </div>
                    {/* Category pill */}
                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255,255,255,0.20)',
                      boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: 9999, background: '#fff', boxShadow: '0 0 0 2px rgba(255,255,255,0.30)' }} />
                      {album.category}
                    </div>
                  </div>

                  {/* Album Info */}
                  <div style={{ padding: '0.95rem 1rem 1rem' }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: colors.textPrimary, margin: 0, marginBottom: '0.5rem', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {album.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{
                        position: 'relative', width: 22, height: 22, borderRadius: '50%',
                        overflow: 'hidden', flexShrink: 0,
                        border: '1.5px solid rgba(8,58,133,0.20)',
                      }}>
                        <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{album.photographer}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: colors.textSecondary, marginBottom: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <i className="bi bi-calendar-event" style={{ fontSize: 11, color: '#F20C8F' }} />
                      <span style={{ fontWeight: 500 }}>Received:</span>
                      <span style={{ fontWeight: 600, color: colors.textPrimary }}>{album.receivedDate}</span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMultiSelectView(album);
                        }}
                        style={{
                          flex: 1.5,
                          padding: '0.55rem 0.8rem',
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          boxShadow: '0 4px 12px rgba(8,58,133,0.22)',
                          letterSpacing: '-0.005em',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => { e.stopPropagation(); e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
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
                            padding: '0.55rem 0.8rem',
                            borderRadius: 10,
                            border: `1px solid ${colors.borderPrimary}`,
                            background: colors.bgCard,
                            color: colors.textPrimary,
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'transform 0.15s, border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            e.currentTarget.style.borderColor = '#083A85';
                            e.currentTarget.style.background = actualTheme === 'dark' ? 'rgba(8,58,133,0.10)' : 'rgba(8,58,133,0.04)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.borderPrimary;
                            e.currentTarget.style.background = colors.bgCard;
                            e.currentTarget.style.transform = 'translateY(0)';
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
                          width: 36, height: 36,
                          padding: 0,
                          borderRadius: 10,
                          border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.32)' : '#FCA5A5'}`,
                          background: actualTheme === 'dark' ? 'rgba(220,38,38,0.12)' : '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                        }}
                        title="Delete album"
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.borderColor = '#DC2626';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.30)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = actualTheme === 'dark' ? 'rgba(220,38,38,0.12)' : '#FEF2F2';
                          e.currentTarget.style.color = '#DC2626';
                          e.currentTarget.style.borderColor = actualTheme === 'dark' ? 'rgba(220,38,38,0.32)' : '#FCA5A5';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <i className="bi bi-trash3-fill" style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.borderPrimary}`,
              overflow: 'hidden',
              boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.10)',
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 170px 110px 110px 170px',
                gap: '1rem',
                padding: '0.7rem 1.1rem',
                background: actualTheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(8,58,133,0.16) 0%, rgba(242,12,143,0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.03) 100%)',
                borderBottom: `1px solid ${colors.borderPrimary}`,
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#F20C8F',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                <div></div>
                <div>Album</div>
                <div>Photographer</div>
                <div>Photos</div>
                <div>Category</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {filteredAlbums.map((album, idx) => (
                <div
                  key={album.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 170px 110px 110px 170px',
                    gap: '1rem',
                    padding: '0.85rem 1.1rem',
                    borderBottom: idx < filteredAlbums.length - 1 ? `1px solid ${colors.borderPrimary}` : 'none',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.18s',
                  }}
                  onClick={() => {
                    if (album.isLocked) { setRestoreAlbum(album); return; }
                    setSelectedAlbum(album);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? 'rgba(8,58,133,0.10)' : 'rgba(8,58,133,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    position: 'relative',
                    width: 80, height: 54,
                    borderRadius: 9,
                    overflow: 'hidden',
                    border: `1px solid ${colors.borderPrimary}`,
                    boxShadow: '0 3px 8px rgba(8,58,133,0.12)',
                  }}>
                    <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                    {album.isLocked && (
                      <div title="Archived" style={{ position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: 9999, background: 'rgba(8,58,133,0.85)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-lock-fill" style={{ fontSize: 10 }} />
                      </div>
                    )}
                  </div>

                  {/* Album Title */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.92rem', fontWeight: 800, color: colors.textPrimary,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{album.title}</div>
                    <div style={{
                      fontSize: '0.74rem', color: colors.textSecondary,
                      marginTop: 2,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <i className="bi bi-calendar3" style={{ fontSize: 10, color: '#F20C8F' }} />
                      Received {album.receivedDate}
                    </div>
                  </div>

                  {/* Photographer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      padding: 1.5,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      boxShadow: '0 3px 6px rgba(8,58,133,0.18)',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'relative', width: '100%', height: '100%',
                        borderRadius: '50%', overflow: 'hidden',
                        background: colors.bgCard,
                      }}>
                        <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.84rem', fontWeight: 700, color: colors.textPrimary,
                      letterSpacing: '-0.005em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{album.photographer}</span>
                  </div>

                  {/* Photos Count */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: colors.textPrimary,
                    letterSpacing: '-0.005em',
                  }}>
                    <i className="bi bi-images" style={{ fontSize: 12, color: '#F20C8F' }} />
                    {album.photoCount} <span style={{ color: colors.textSecondary, fontWeight: 600 }}>photos</span>
                  </div>

                  {/* Category */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '0.22rem 0.6rem',
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
                    border: '1px solid rgba(8,58,133,0.18)',
                    color: actualTheme === 'dark' ? '#BFDBFE' : '#083A85',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    width: 'fit-content',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <i className="bi bi-tag-fill" style={{ fontSize: 9, color: '#F20C8F' }} />
                    {album.category}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMultiSelectView(album);
                      }}
                      title="Browse album"
                      style={{
                        padding: '0.4rem 0.7rem',
                        borderRadius: 9,
                        border: 'none',
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: 'white',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        letterSpacing: '-0.005em',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <i className="bi bi-eye-fill" style={{ fontSize: 11 }} />
                      Browse
                    </button>
                    {!photobook && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareAlbum(album);
                          setShowShareModal(true);
                        }}
                        title="Share album"
                        style={{
                          width: 32, height: 32,
                          borderRadius: 9,
                          border: `1px solid ${colors.borderPrimary}`,
                          background: colors.bgTertiary,
                          color: colors.textPrimary,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                      >
                        <i className="bi bi-share-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(album);
                      }}
                      title="Delete album"
                      style={{
                        width: 32, height: 32,
                        borderRadius: 9,
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
                        background: actualTheme === 'dark' ? 'rgba(220,38,38,0.14)' : 'rgba(254,242,242,0.85)',
                        color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = actualTheme === 'dark' ? 'rgba(220,38,38,0.14)' : 'rgba(254,242,242,0.85)'; e.currentTarget.style.color = actualTheme === 'dark' ? '#FCA5A5' : '#DC2626'; e.currentTarget.style.borderColor = actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'; }}
                    >
                      <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
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
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: colors.bgCard,
              borderRadius: 18,
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
              border: `1px solid ${colors.borderPrimary}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'sticky', top: 0, left: 0, right: 0, height: 3, display: 'block',
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              zIndex: 2,
            }} />
            <div style={{ padding: '1.4rem 1.5rem 1.5rem' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: 'rgba(8,58,133,0.10)',
                    border: '1px solid rgba(8,58,133,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: '#083A85',
                  }}>
                    <i className="bi bi-images" style={{ fontSize: 17 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Album</div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                      Album details
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  aria-label="Close"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    width: 32, height: 32, padding: 0,
                    borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textSecondary,
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Album Preview */}
              <div style={{ position: 'relative', height: 240, borderRadius: 14, overflow: 'hidden', marginBottom: '1.1rem', boxShadow: '0 12px 24px -10px rgba(0,0,0,0.30)' }}>
                <Image src={selectedAlbum.thumbnail} alt={selectedAlbum.title} fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />
                {/* Category pill */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  color: '#fff', padding: '4px 10px', borderRadius: 9999,
                  fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.20)',
                  boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: 9999, background: '#fff', boxShadow: '0 0 0 2px rgba(255,255,255,0.30)' }} />
                  {selectedAlbum.category}
                </div>
                {/* Title overlay at bottom */}
                <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                  <h3 style={{
                    fontSize: '1.05rem', fontWeight: 800, color: '#fff',
                    margin: 0, letterSpacing: '-0.005em',
                    textShadow: '0 2px 6px rgba(0,0,0,0.50)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {selectedAlbum.title}
                  </h3>
                </div>
              </div>

              {/* Photographer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem',
                padding: '0.7rem 0.85rem',
                background: actualTheme === 'dark' ? 'rgba(8,58,133,0.10)' : '#F9FAFB',
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: 11,
              }}>
                <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(8,58,133,0.25)' }}>
                  <Image src={selectedAlbum.photographerAvatar} alt={selectedAlbum.photographer} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAlbum.photographer}</div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Photographer</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Received</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: colors.textPrimary, marginTop: 1 }}>{selectedAlbum.receivedDate}</div>
                </div>
              </div>

              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: '1.25rem',
              }}>
                {([
                  { label: 'Photos',     value: selectedAlbum.photoCount,      accent: '#083A85', tint: 'rgba(8,58,133,0.10)',   icon: 'bi-images' },
                  { label: 'Downloaded', value: selectedAlbum.downloadedCount, accent: '#16A34A', tint: 'rgba(22,163,74,0.12)',  icon: 'bi-download' },
                  { label: 'Favorites',  value: selectedAlbum.favoriteCount,   accent: '#F20C8F', tint: 'rgba(242,12,143,0.12)', icon: 'bi-heart-fill' },
                ] as const).map((stat) => (
                  <div key={stat.label} style={{
                    position: 'relative', overflow: 'hidden',
                    padding: '0.7rem 0.75rem',
                    background: colors.bgCard,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    textAlign: 'center',
                  }}>
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                    }} />
                    <div style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: stat.tint,
                      border: `1px solid ${stat.accent}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '4px auto 6px',
                    }}>
                      <i className={`bi ${stat.icon}`} style={{ fontSize: 12, color: stat.accent }} />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.6rem',
                paddingTop: '0.85rem',
                borderTop: `1px solid ${colors.borderPrimary}`,
              }}>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openMultiSelectView(selectedAlbum);
                    }}
                    style={{
                      flex: 1.5,
                      padding: '0.7rem 1rem',
                      borderRadius: 11,
                      border: 'none',
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: '#fff',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 6px 18px rgba(242,12,143,0.28)',
                      letterSpacing: '-0.005em',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: 13 }} />
                    Browse photos
                  </button>
                  {!photobook && (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setShareAlbum(selectedAlbum);
                        setShowShareModal(true);
                      }}
                      className="ck-btn ck-btn-soft"
                      style={{
                        flex: 1,
                        padding: '0.7rem 1rem',
                        fontSize: '0.92rem',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <ShareIcon />
                      Share album
                    </button>
                  )}
                </div>
                {photobook && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 10,
                    background: actualTheme === 'dark'
                      ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                      : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.03) 100%)',
                    border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.30)' : 'rgba(8,58,133,0.18)'}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontSize: '0.82rem',
                    color: actualTheme === 'dark' ? '#93C5FD' : '#083A85',
                    fontWeight: 600,
                  }}>
                    <i className="bi bi-book-half" style={{ fontSize: 12 }} />
                    Browse photos to select and add to &ldquo;{photobook.name}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal with Social Media */}
      {showShareModal && shareAlbum && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2500, padding: '1rem',
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: colors.bgCard,
              borderRadius: 18,
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
              border: `1px solid ${colors.borderPrimary}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'sticky', top: 0, left: 0, right: 0, height: 3, display: 'block',
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              zIndex: 2,
            }} />
            <div style={{ padding: '1.4rem 1.5rem 1.5rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: 'rgba(242,12,143,0.10)',
                    border: '1px solid rgba(242,12,143,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: '#F20C8F',
                  }}>
                    <ShareIcon />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Share</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                      Share album
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '3px 0 0 0', lineHeight: 1.45 }}>
                      Send the album link to friends or share it on social media.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  aria-label="Close"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    width: 32, height: 32, padding: 0,
                    borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textSecondary,
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Album Preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: '1.25rem',
                padding: '0.7rem 0.9rem',
                background: actualTheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(8,58,133,0.20) 0%, rgba(242,12,143,0.10) 100%)'
                  : 'linear-gradient(135deg, rgba(8,58,133,0.06) 0%, rgba(242,12,143,0.03) 100%)',
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.30)' : 'rgba(8,58,133,0.18)'}`,
                borderRadius: 12,
              }}>
                <div style={{ position: 'relative', width: 56, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={shareAlbum.thumbnail} alt={shareAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: colors.textPrimary, fontSize: '0.95rem', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareAlbum.title}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: colors.textSecondary, marginTop: 2 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <i className="bi bi-images" style={{ fontSize: 11 }} />
                      {shareAlbum.photoCount} photos
                    </span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareAlbum.photographer}</span>
                  </div>
                </div>
              </div>

              {/* "Share via" eyebrow */}
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.55rem' }}>Share via</div>

              {/* Social Media Share Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
                {[
                  { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}` },
                  { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                  { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}` },
                  { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this album: ${link}`)}` },
                  { name: 'Copy Link', icon: <LinkIcon />, color: '#083A85', getUrl: () => '' },
                  { name: 'QR Code', icon: <QRCodeIcon />, color: '#F20C8F', getUrl: () => '' }
                ].map((option) => {
                  const isCopyActive = option.name === 'Copy Link' && copiedLink;
                  return (
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
                      padding: '0.85rem 0.6rem',
                      border: isCopyActive ? '1.5px solid #10B981' : `1px solid ${colors.borderPrimary}`,
                      borderRadius: 12,
                      background: isCopyActive
                        ? (actualTheme === 'dark' ? 'rgba(16,185,129,0.14)' : '#ECFDF5')
                        : colors.bgCard,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isCopyActive ? '#10B981' : colors.textPrimary,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'transform 0.15s, border-color 0.18s, background 0.18s, box-shadow 0.18s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                    onMouseEnter={(e) => {
                      if (isCopyActive) return;
                      e.currentTarget.style.borderColor = option.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 14px ${option.color}25`;
                    }}
                    onMouseLeave={(e) => {
                      if (isCopyActive) return;
                      e.currentTarget.style.borderColor = colors.borderPrimary;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isCopyActive ? '#10B981' : `${option.color}18`,
                      border: `1px solid ${isCopyActive ? '#10B981' : `${option.color}38`}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCopyActive ? '#fff' : option.color,
                    }}>{option.icon}</div>
                    <span>{isCopyActive ? 'Copied!' : option.name}</span>
                  </button>
                );})}
              </div>

              {/* Album Link Input */}
              <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                  Album link
                </label>
                <div style={{
                  display: 'flex', alignItems: 'stretch',
                  border: `1.5px solid ${colors.borderPrimary}`,
                  borderRadius: 11,
                  background: colors.bgTertiary,
                  overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.7rem', color: colors.textSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}>
                    <i className="bi bi-link-45deg" style={{ fontSize: 16 }} />
                  </div>
                  <input
                    type="text"
                    value={getShareLink(shareAlbum)}
                    readOnly
                    onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      border: 'none',
                      fontSize: '0.84rem',
                      backgroundColor: 'transparent',
                      color: colors.textPrimary,
                      outline: 'none',
                      minWidth: 0,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    }}
                  />
                  <button
                    onClick={() => handleCopyLink(getShareLink(shareAlbum))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0 1rem',
                      border: 'none',
                      borderLeft: `1px solid ${colors.borderPrimary}`,
                      background: copiedLink
                        ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)'
                        : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'filter 0.15s',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.005em',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <i className={`bi ${copiedLink ? 'bi-check2' : 'bi-clipboard'}`} style={{ fontSize: 13 }} />
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
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
            background: 'radial-gradient(circle at 50% 30%, rgba(20,24,40,0.97) 0%, rgba(0,0,0,0.99) 70%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
          }}
          onClick={closeMultiSelectView}
        >
          {/* Header */}
          <div
            className="mobile-multi-select-header"
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: '0.9rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              opacity: 0.85,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(242,12,143,0.16)',
                border: '1px solid rgba(242,12,143,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-images" style={{ fontSize: 15, color: '#F20C8F' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700, color: '#F20C8F',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1,
                }}>Viewing album</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <h2 className="mobile-multi-select-title" style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'white',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '50vw',
                  }}>{multiSelectAlbum.title}</h2>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: 9999,
                    background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
                  }}>
                    <i className="bi bi-camera-fill" style={{ fontSize: 9 }} />
                    {multiSelectAlbum.images.length} photos
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    padding: '0.5rem 0.95rem',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: isSelectMode ? 'transparent' : 'rgba(255, 255, 255, 0.22)',
                    background: isSelectMode
                      ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)'
                      : 'rgba(255,255,255,0.08)',
                    color: 'white',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: isSelectMode ? '0 4px 12px rgba(16,185,129,0.30)' : 'none',
                    letterSpacing: '-0.005em',
                    transition: 'all 0.18s',
                    backdropFilter: isSelectMode ? 'none' : 'blur(6px)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelectMode) e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelectMode) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <i className={`bi ${isSelectMode ? 'bi-x-circle' : 'bi-check2-square'}`} style={{ fontSize: 13 }} />
                  {isSelectMode ? 'Exit select' : 'Select mode'}
                </button>
              )}

              {/* Max images info when photobook exists */}
              {photobook && (
                <span style={{
                  fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 9999,
                  background: 'rgba(124,58,237,0.20)', border: '1px solid rgba(124,58,237,0.40)',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <i className="bi bi-book-half" style={{ fontSize: 10, color: '#C4B5FD' }} />
                  Max {MAX_PHOTOBOOK_IMAGES} images
                </span>
              )}

              {/* Close Button */}
              <button
                onClick={closeMultiSelectView}
                aria-label="Close viewer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  cursor: 'pointer',
                  width: 36, height: 36, padding: 0,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
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
                gap: 12,
                flexWrap: 'wrap',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(180deg, rgba(22,163,74,0.18) 0%, rgba(22,163,74,0.06) 100%)',
                borderBottom: '1px solid rgba(22, 163, 74, 0.30)',
                backdropFilter: 'blur(6px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: '0.82rem', fontWeight: 700, color: '#4ADE80',
                  letterSpacing: '-0.005em',
                }}>
                  <i className="bi bi-check2-circle" style={{ fontSize: 14 }} />
                  <span>
                    <strong style={{ color: '#fff', fontWeight: 800 }}>{selectedImages.length}</strong>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}> of </span>
                    <strong style={{ color: '#fff', fontWeight: 800 }}>{photobook ? MAX_PHOTOBOOK_IMAGES : multiSelectAlbum.images.length}</strong>
                    {photobook ? ' max' : ''} selected
                  </span>
                </span>
                <button
                  onClick={selectAllImages}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 9,
                    border: '1px solid rgba(74,222,128,0.50)',
                    background: 'rgba(74,222,128,0.10)',
                    color: '#4ADE80',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(74,222,128,0.20)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(74,222,128,0.10)';
                  }}
                >
                  <i className={`bi ${selectedImages.length === multiSelectAlbum.images.length ? 'bi-x-square' : 'bi-check2-all'}`} style={{ fontSize: 12 }} />
                  {selectedImages.length === multiSelectAlbum.images.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedImages.length > 0 && (
                <div className="mobile-bulk-actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #F20C8F 100%)',
                        color: 'white',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 14px rgba(124,58,237,0.34)',
                        letterSpacing: '-0.005em',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <BookIcon />
                      Add to photobook ({selectedImages.length})
                    </button>
                  ) : (
                    // Original actions when no photobook: download, share, delete
                    <>
                      <button
                        onClick={handleBulkDownload}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(8,58,133,0.34)',
                          letterSpacing: '-0.005em',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
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
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(16,185,129,0.34)',
                          letterSpacing: '-0.005em',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <ShareIcon />
                        Share ({selectedImages.length})
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(220,38,38,0.34)',
                          letterSpacing: '-0.005em',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
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
              padding: '1.5rem',
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
                const isSelected = selectedImages.includes(image);
                return (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 14,
                    overflow: 'hidden',
                    cursor: isDisabled ? 'not-allowed' : (isSelectMode ? 'pointer' : 'zoom-in'),
                    border: isSelected
                      ? '2px solid #16A34A'
                      : '1px solid rgba(255,255,255,0.08)',
                    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                    transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                    opacity: isDisabled ? 0.4 : 1,
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    boxShadow: isSelected
                      ? '0 8px 22px rgba(22,163,74,0.40)'
                      : '0 4px 12px rgba(0,0,0,0.40)',
                  }}
                  onMouseEnter={(e) => {
                    if (isDisabled || isSelected) return;
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.55)';
                    e.currentTarget.style.borderColor = 'rgba(242,12,143,0.50)';
                  }}
                  onMouseLeave={(e) => {
                    if (isDisabled || isSelected) return;
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.40)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
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

                  {/* Bottom gradient for badge legibility */}
                  <div aria-hidden style={{
                    position: 'absolute', inset: 0,
                    background: isSelected
                      ? 'linear-gradient(to bottom, rgba(22,163,74,0.30) 0%, rgba(22,163,74,0) 30%, rgba(22,163,74,0) 60%, rgba(22,163,74,0.45) 100%)'
                      : 'linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)',
                    pointerEvents: 'none',
                    transition: 'background 0.2s',
                  }} />

                  {/* Selection Overlay */}
                  {isSelectMode && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      padding: '0.75rem',
                      transition: 'all 0.2s',
                      pointerEvents: 'none',
                    }}>
                      <div style={{
                        width: 30, height: 30,
                        borderRadius: '50%',
                        border: isSelected ? 'none' : '1.5px solid rgba(255, 255, 255, 0.85)',
                        background: isSelected
                          ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)'
                          : 'rgba(0, 0, 0, 0.30)',
                        backdropFilter: isSelected ? 'none' : 'blur(6px)',
                        boxShadow: isSelected ? '0 4px 12px rgba(22,163,74,0.45)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                        transition: 'all 0.18s',
                      }}>
                        {isSelected && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                      top: 8, right: 8,
                      background: 'rgba(0, 0, 0, 0.55)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: 9999,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      border: '1px solid rgba(255,255,255,0.18)',
                      minWidth: 22,
                      textAlign: 'center',
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

      {/* Image Viewer Modal. full-screen cinematic lightbox */}
      {showImageViewer && viewerAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 50% 35%, rgba(20,24,40,0.97) 0%, rgba(0,0,0,1) 80%)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2000,
          }}
          onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
          tabIndex={0}
        >
          {/* Header */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            <span aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              opacity: 0.85,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                overflow: 'hidden', position: 'relative', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.40)',
              }}>
                <Image src={viewerAlbum.thumbnail} alt={viewerAlbum.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{
                  fontSize: '0.98rem', fontWeight: 800, color: 'white',
                  margin: 0, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '40vw',
                }}>{viewerAlbum.title}</h3>
                <p style={{
                  fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)',
                  margin: '2px 0 0', display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <i className="bi bi-camera" style={{ fontSize: 10 }} />
                  {viewerAlbum.photographer}
                </p>
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
                {currentImageIndex + 1} <span style={{ opacity: 0.6 }}>/</span> {viewerAlbum.images.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleDownloadCurrentImage}
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
                onClick={closeImageViewer}
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

          {/* Main Image Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '2rem',
            minHeight: 0,
          }}>
            {/* Previous Button */}
            <button
              onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
              disabled={currentImageIndex === 0}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 52, height: 52,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'white',
                cursor: currentImageIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
                zIndex: 10,
                opacity: currentImageIndex > 0 ? 1 : 0.25,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                if (currentImageIndex > 0) {
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

            {/* Image Display */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 100px',
            }}>
              <div style={{
                width: 'min(calc(100vh - 200px), calc(100vw - 280px))',
                height: 'min(calc(100vh - 200px), calc(100vw - 280px))',
                position: 'relative',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255,255,255,0.06)',
              }}>
                <Image
                  src={viewerAlbum.images[currentImageIndex]}
                  alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
              disabled={currentImageIndex === viewerAlbum.images.length - 1}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 52, height: 52,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'white',
                cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
                zIndex: 10,
                opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 1 : 0.25,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                if (currentImageIndex < viewerAlbum.images.length - 1) {
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
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            padding: '0.85rem 1.5rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: '0.35rem',
              justifyContent: 'center',
              scrollbarWidth: 'thin',
            }}>
              {viewerAlbum.images.map((image, index) => {
                const isActive = currentImageIndex === index;
                return (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`Go to photo ${index + 1}`}
                  style={{
                    position: 'relative',
                    width: 78, height: 58,
                    borderRadius: 9,
                    overflow: 'hidden',
                    border: isActive ? '2px solid #F20C8F' : '1px solid rgba(255,255,255,0.10)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.18s',
                    opacity: isActive ? 1 : 0.55,
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isActive ? '0 6px 16px rgba(242,12,143,0.34)' : 'none',
                    padding: 0,
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = '0.95';
                      e.currentTarget.style.borderColor = 'rgba(242,12,143,0.45)';
                      e.currentTarget.style.transform = 'scale(1.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.opacity = '0.55';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {isActive && (
                    <>
                      {/* Active indicator dot */}
                      <span style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 8, height: 8, borderRadius: 9999,
                        background: '#F20C8F',
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.55)',
                      }} />
                      {/* Bottom accent bar */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
                      }} />
                    </>
                  )}
                </button>
              );})}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {restoreAlbum && (
        <ArchiveRestoreFlow
          album={restoreAlbum}
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => setRestoreAlbum(null)}
          onRestored={() => { setRestoreAlbum(null); setAlbumTab('all'); fetchAlbums(); }}
        />
      )}

      {showDeleteModal && albumToDelete && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Permanent action"
          title="Delete album?"
          highlight={albumToDelete.title}
          intro={<>Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&ldquo;{albumToDelete.title}&rdquo;</strong>?</>}
          detail={`This action cannot be undone. All ${albumToDelete.photoCount} photos will be permanently removed.`}
          colors={colors}
          actualTheme={actualTheme}
          onClose={cancelDeleteAlbum}
          closeLabel="Cancel"
          primary={{
            label: 'Delete album',
            icon: 'bi-trash3-fill',
            tone: 'danger',
            onClick: confirmDeleteAlbum,
          }}
        />
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
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
          onClick={() => setShowCreatePhotobookModal(false)}
        >
          <style>{`
            .photobook-modal input:focus,
            .photobook-modal textarea:focus {
              border-color: #083A85 !important;
              box-shadow: 0 0 0 3px rgba(8,58,133,0.14) !important;
            }
          `}</style>
          <div
            className="photobook-modal"
            style={{
              position: 'relative',
              backgroundColor: colors.bgCard,
              borderRadius: 18,
              width: 540,
              maxWidth: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
              border: `1px solid ${colors.borderPrimary}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'sticky', top: 0, left: 0, right: 0, height: 3, display: 'block',
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              zIndex: 2,
            }} />

            <div style={{ padding: '1.4rem 1.5rem 1.5rem' }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: 'rgba(242,12,143,0.10)',
                    border: '1px solid rgba(242,12,143,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className="bi bi-book-half" style={{ fontSize: 16, color: '#F20C8F' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                      Curate
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                      Create photobook
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '3px 0 0 0', lineHeight: 1.45 }}>
                      Bundle your favorite shots into a shareable photobook.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreatePhotobookModal(false)}
                  aria-label="Close"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    width: 32, height: 32, padding: 0,
                    borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textSecondary,
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Photobook Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Photobook name *
                </label>
                <input
                  type="text"
                  value={photobookName}
                  onChange={(e) => setPhotobookName(e.target.value)}
                  placeholder="e.g., Wedding highlights 2026"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.95rem',
                    border: `1.5px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                  }}
                />
              </div>

              {/* Photobook Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Description
                </label>
                <textarea
                  value={photobookDescription}
                  onChange={(e) => setPhotobookDescription(e.target.value)}
                  placeholder="Add a short description for your photobook…"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.95rem',
                    border: `1.5px solid ${colors.borderPrimary}`,
                    borderRadius: 11,
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                  }}
                />
              </div>

              {/* Thumbnail Selection from Albums */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Cover thumbnail
                  </label>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, color: colors.textSecondary,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    padding: '2px 7px', borderRadius: 9999,
                    background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`,
                  }}>Optional</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: colors.textSecondary, marginBottom: '0.65rem', lineHeight: 1.45 }}>
                  Pick a cover image from your sent albums. You can change it later.
                </p>
                {albums.length === 0 ? (
                  <div style={{
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    background: actualTheme === 'dark'
                      ? 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.06) 100%)'
                      : 'linear-gradient(135deg, rgba(8,58,133,0.04) 0%, rgba(242,12,143,0.03) 100%)',
                    border: `1.5px dashed ${actualTheme === 'dark' ? 'rgba(99,162,255,0.35)' : 'rgba(8,58,133,0.28)'}`,
                    borderRadius: 12,
                    color: colors.textSecondary,
                    fontSize: '0.82rem',
                  }}>
                    No albums yet. Covers will appear here once your photographers share albums.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: 220, overflowY: 'auto', padding: 2 }}>
                    {albums.map((album) => {
                      const isSelected = photobookThumbnailUrl === album.thumbnail;
                      return (
                        <div
                          key={album.id}
                          onClick={() => setPhotobookThumbnailUrl(album.thumbnail)}
                          title={album.title}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: 10,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `2px solid ${isSelected ? '#F20C8F' : 'transparent'}`,
                            boxShadow: isSelected
                              ? '0 6px 14px rgba(242,12,143,0.30)'
                              : '0 1px 2px rgba(0,0,0,0.06)',
                            transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                          {isSelected && (
                            <>
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(242,12,143,0) 50%, rgba(242,12,143,0.45) 100%)', pointerEvents: 'none' }} />
                              <div style={{
                                position: 'absolute', top: 6, right: 6,
                                color: '#fff', background: '#F20C8F',
                                borderRadius: 9999, width: 20, height: 20,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(242,12,143,0.40)',
                              }}>
                                <i className="bi bi-check" style={{ fontSize: 14, lineHeight: 1 }} />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.6rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${colors.borderPrimary}`,
              }}>
                <button
                  onClick={() => setShowCreatePhotobookModal(false)}
                  className="ck-btn ck-btn-soft"
                  style={{ flex: 1, padding: '0.65rem 1rem', fontSize: '0.9rem' }}
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
                  disabled={!photobookName.trim()}
                  style={{
                    flex: 2,
                    padding: '0.65rem 1.1rem',
                    borderRadius: 11,
                    border: 'none',
                    background: !photobookName.trim()
                      ? colors.bgTertiary
                      : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: !photobookName.trim() ? colors.textSecondary : '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: !photobookName.trim() ? 'not-allowed' : 'pointer',
                    opacity: !photobookName.trim() ? 0.7 : 1,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: !photobookName.trim() ? 'none' : '0 6px 18px rgba(242,12,143,0.28)',
                    letterSpacing: '-0.005em',
                    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { if (photobookName.trim()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <i className="bi bi-book-half" style={{ fontSize: 13 }} />
                  Create photobook
                </button>
              </div>
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
                        images: photobook.images.map(img => img.url),
                        isLocked: false,
                        lockedAt: null,
                        archiveFee: null,
                        archiveCurrency: null,
                        eventId: null,
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
