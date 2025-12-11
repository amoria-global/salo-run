'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';

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

const GridIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#083A85" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ListIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#083A85" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/>
    <rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/>
  </svg>
);

// Sample album data from photographers/freelancers
const clientAlbumsData = [
  {
    id: 1,
    title: 'Johnson Wedding - Ceremony',
    photographer: 'Sarah Anderson',
    photographerAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    receivedDate: 'Dec 18, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    photoCount: 45,
    downloadedCount: 12,
    favoriteCount: 8,
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800'
    ]
  },
  {
    id: 2,
    title: 'Johnson Wedding - Reception',
    photographer: 'Sarah Anderson',
    photographerAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    receivedDate: 'Dec 18, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
    photoCount: 78,
    downloadedCount: 35,
    favoriteCount: 22,
    images: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800'
    ]
  },
  {
    id: 3,
    title: 'Family Portrait Session',
    photographer: 'Mike Chen',
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Portrait',
    date: 'Nov 28, 2024',
    receivedDate: 'Dec 2, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
    photoCount: 32,
    downloadedCount: 28,
    favoriteCount: 15,
    images: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
      'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800'
    ]
  },
  {
    id: 4,
    title: 'Company Annual Gala',
    photographer: 'David Kim',
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Event',
    date: 'Nov 15, 2024',
    receivedDate: 'Nov 20, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    photoCount: 124,
    downloadedCount: 45,
    favoriteCount: 30,
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
    ]
  },
  {
    id: 5,
    title: 'Product Catalog - Spring Collection',
    photographer: 'Emily Zhang',
    photographerAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    category: 'Product',
    date: 'Oct 10, 2024',
    receivedDate: 'Oct 15, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    photoCount: 56,
    downloadedCount: 56,
    favoriteCount: 18,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800'
    ]
  },
  {
    id: 6,
    title: 'Birthday Celebration',
    photographer: 'Alex Rivera',
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Event',
    date: 'Sep 22, 2024',
    receivedDate: 'Sep 25, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    photoCount: 89,
    downloadedCount: 67,
    favoriteCount: 42,
    images: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800'
    ]
  }
];

const ClientGallery = () => {
  const [albums, setAlbums] = useState(clientAlbumsData);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPhotographer, setFilterPhotographer] = useState('All');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<typeof clientAlbumsData[0] | null>(null);

  // Multi-select view states
  const [showMultiSelectView, setShowMultiSelectView] = useState(false);
  const [multiSelectAlbum, setMultiSelectAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Image viewer states
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAlbum, setShareAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<typeof clientAlbumsData[0] | null>(null);

  const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Product'];
  const photographers = ['All', ...Array.from(new Set(albums.map(a => a.photographer)))];

  // Filter albums
  const filteredAlbums = albums.filter(album => {
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
  const openMultiSelectView = (album: typeof clientAlbumsData[0]) => {
    setMultiSelectAlbum(album);
    setSelectedImages([]);
    setIsSelectMode(false);
    setShowMultiSelectView(true);
  };

  const closeMultiSelectView = () => {
    setShowMultiSelectView(false);
    setMultiSelectAlbum(null);
    setSelectedImages([]);
    setIsSelectMode(false);
  };

  const openImageViewer = (album: typeof clientAlbumsData[0], startIndex: number = 0) => {
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
      setSelectedImages([...selectedImages, image]);
    }
  };

  const selectAllImages = () => {
    if (multiSelectAlbum) {
      if (selectedImages.length === multiSelectAlbum.images.length) {
        setSelectedImages([]);
      } else {
        setSelectedImages([...multiSelectAlbum.images]);
      }
    }
  };

  const openDeleteModal = (album: typeof clientAlbumsData[0]) => {
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
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedImages.length} image(s)?`);
      if (confirmDelete) {
        alert(`${selectedImages.length} image(s) deleted successfully!`);
        setSelectedImages([]);
      }
    }
  };

  const getShareLink = (album: typeof clientAlbumsData[0]) => {
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="client" giftAmount={225.00} />

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600', margin: 0 }}>My Gallery</h1>
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
              <p style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Albums and photos from your completed events, shared by your photographers
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: viewMode === 'grid' ? '2px solid #083A85' : '2px solid #E5E7EB',
                  backgroundColor: viewMode === 'grid' ? '#EBF5FF' : 'white',
                  cursor: 'pointer',
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
                  borderRadius: '0.5rem',
                  border: viewMode === 'list' ? '2px solid #083A85' : '2px solid #E5E7EB',
                  backgroundColor: viewMode === 'list' ? '#EBF5FF' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ListIcon active={viewMode === 'list'} />
              </button>
            </div>
          </header>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{albums.length}</div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Photos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{totalPhotos}</div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Downloaded</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{totalDownloaded}</div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>{totalFavorites}</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
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
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#111827',
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
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#111827',
                  backgroundColor: 'white',
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
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#111827',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {photographers.map(p => (
                  <option key={p} value={p}>{p === 'All' ? 'All Photographers' : p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Albums Grid/List */}
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
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
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                      {album.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                        <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{album.photographer}</span>
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
                          backgroundColor: '#F3F4F6',
                          color: '#111827',
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
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                gap: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#6B7280'
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
                    borderBottom: '1px solid #E5E7EB',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => {
                    setSelectedAlbum(album);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', width: '80px', height: '50px', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                  </div>

                  {/* Album Title */}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{album.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Received: {album.receivedDate}</div>
                  </div>

                  {/* Photographer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                      <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#374151' }}>{album.photographer}</span>
                  </div>

                  {/* Photos Count */}
                  <div style={{ fontSize: '0.9rem', color: '#111827' }}>{album.photoCount} photos</div>

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
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Share
                    </button>
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
              backgroundColor: 'white',
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Album Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: '#374151',
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
              {selectedAlbum.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                <Image src={selectedAlbum.photographerAvatar} alt={selectedAlbum.photographer} fill style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{selectedAlbum.photographer}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Photographer</div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#F9FAFB',
              borderRadius: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedAlbum.photoCount}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Photos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16A34A' }}>{selectedAlbum.downloadedCount}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Downloaded</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#DC2626' }}>{selectedAlbum.favoriteCount}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Favorites</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#6B7280' }}>
              <span>Category: <strong style={{ color: '#111827' }}>{selectedAlbum.category}</strong></span>
              <span>Received: <strong style={{ color: '#111827' }}>{selectedAlbum.receivedDate}</strong></span>
            </div>

            {/* Action Buttons */}
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
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
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
              backgroundColor: 'white',
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Share Album</h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Album Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <Image src={shareAlbum.thumbnail} alt={shareAlbum.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{shareAlbum.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{shareAlbum.photoCount} photos • {shareAlbum.photographer}</div>
              </div>
            </div>

            {/* Social Media Share Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}` },
                { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}` },
                { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this album: ${link}`)}` },
                { name: 'Copy Link', icon: <LinkIcon />, color: '#6B7280', getUrl: () => '' },
                { name: 'QR Code', icon: <QRCodeIcon />, color: '#111827', getUrl: () => '' }
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    const shareLink = getShareLink(shareAlbum);
                    if (option.name === 'Copy Link') {
                      handleCopyLink(shareLink);
                    } else if (option.name === 'QR Code') {
                      alert('QR Code feature coming soon!');
                    } else {
                      const url = option.getUrl(shareLink, shareAlbum.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    border: option.name === 'Copy Link' && copiedLink ? '1px solid #10B981' : '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    background: option.name === 'Copy Link' && copiedLink ? '#ECFDF5' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: option.name === 'Copy Link' && copiedLink ? '#10B981' : '#374151',
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
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.name === 'Copy Link' && copiedLink ? 'Copied!' : option.name}</span>
                </button>
              ))}
            </div>

            {/* Album Link Input */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
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
                    border: '2px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#111827',
                    backgroundColor: '#F9FAFB'
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
              <h2 style={{
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
              {/* Select Mode Toggle */}
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
                  {selectedImages.length} of {multiSelectAlbum.images.length} selected
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                    <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                    Delete ({selectedImages.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Grid */}
          <div
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
              {multiSelectAlbum.images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: isSelectMode ? 'pointer' : 'default',
                    border: selectedImages.includes(image)
                      ? '3px solid #16A34A'
                      : '3px solid transparent',
                    transition: 'all 0.2s',
                    transform: selectedImages.includes(image) ? 'scale(0.98)' : 'scale(1)'
                  }}
                  onClick={() => {
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
              ))}
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
              backgroundColor: 'white',
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
              color: '#111827',
              margin: 0,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>Delete Album</h2>

            {/* Modal Content */}
            <p style={{
              fontSize: '0.95rem',
              color: '#6B7280',
              margin: 0,
              marginBottom: '0.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: '#111827' }}>&quot;{albumToDelete.title}&quot;</strong>?
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
                  border: '2px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
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
    </div>
  );
};

export default ClientGallery;
