"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';

// Icons
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#F20C8F' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.09924 19.7228 3.6929 19.0554 3.41524C18.3879 3.13757 17.6725 2.99414 16.95 2.99414C16.2275 2.99414 15.5121 3.13757 14.8446 3.41524C14.1772 3.6929 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99479 7.05 2.99479C5.59096 2.99479 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54478 7.04097 1.54478 8.5C1.54478 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.7571 11.2728 22.0348 10.6054C22.3124 9.93789 22.4559 9.22249 22.4559 8.5C22.4559 7.77751 22.3124 7.06211 22.0348 6.39464C21.7571 5.72718 21.3508 5.12075 20.84 4.61Z" stroke={filled ? '#F20C8F' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Sample gallery data with real images
const galleryData = [
  {
    id: 1,
    title: 'Wedding Ceremony',
    category: 'Wedding',
    date: 'Jan 15, 2025',
    client: 'Sarah & James',
    clientAvatar: 'https://randomuser.me/api/portraits/women/75.jpg',
    views: 1234,
    likes: 245,
    downloads: 89,
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    featured: true,
    sharedWithClient: true,
    photoCount: 156
  },
  {
    id: 2,
    title: 'Portrait Session',
    category: 'Portrait',
    date: 'Jan 14, 2025',
    client: 'Emily Rodriguez',
    clientAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    views: 856,
    likes: 132,
    downloads: 45,
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    featured: false,
    sharedWithClient: true,
    photoCount: 48
  },
  {
    id: 3,
    title: 'Corporate Event',
    category: 'Event',
    date: 'Jan 13, 2025',
    client: 'Tech Corp Inc',
    clientAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    views: 567,
    likes: 98,
    downloads: 34,
    thumbnail: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800',
    featured: true,
    sharedWithClient: false,
    photoCount: 234
  },
  {
    id: 4,
    title: 'Product Photography',
    category: 'Product',
    date: 'Jan 12, 2025',
    client: 'Fashion Brand',
    clientAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    views: 1567,
    likes: 367,
    downloads: 156,
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    featured: false,
    sharedWithClient: true,
    photoCount: 67
  },
  {
    id: 5,
    title: 'Family Portraits',
    category: 'Portrait',
    date: 'Jan 11, 2025',
    client: 'The Johnson Family',
    clientAvatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    views: 423,
    likes: 89,
    downloads: 23,
    thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    featured: false,
    sharedWithClient: false,
    photoCount: 89
  },
  {
    id: 6,
    title: 'Beach Wedding',
    category: 'Wedding',
    date: 'Jan 10, 2025',
    client: 'Mike & Lisa',
    clientAvatar: 'https://randomuser.me/api/portraits/women/33.jpg',
    views: 2345,
    likes: 456,
    downloads: 234,
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
    featured: true,
    sharedWithClient: true,
    photoCount: 312
  },
  {
    id: 7,
    title: 'Fashion Editorial',
    category: 'Fashion',
    date: 'Jan 9, 2025',
    client: 'Vogue Studios',
    clientAvatar: 'https://randomuser.me/api/portraits/women/55.jpg',
    views: 3456,
    likes: 789,
    downloads: 345,
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
    featured: true,
    sharedWithClient: true,
    photoCount: 145
  },
  {
    id: 8,
    title: 'Architecture Series',
    category: 'Architecture',
    date: 'Jan 8, 2025',
    client: 'City Developers',
    clientAvatar: 'https://randomuser.me/api/portraits/men/55.jpg',
    views: 678,
    likes: 134,
    downloads: 67,
    thumbnail: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    featured: false,
    sharedWithClient: false,
    photoCount: 78
  },
  {
    id: 9,
    title: 'Birthday Celebration',
    category: 'Event',
    date: 'Jan 7, 2025',
    client: 'Michael Chen',
    clientAvatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    views: 345,
    likes: 67,
    downloads: 12,
    thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    featured: false,
    sharedWithClient: true,
    photoCount: 98
  }
];

const Gallery = () => {
  const [photos, setPhotos] = useState(galleryData);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<typeof galleryData[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadClient, setUploadClient] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadShared, setUploadShared] = useState(true);

  const toggleLike = (photoId: number) => {
    setPhotos(photos.map(photo =>
      photo.id === photoId ? { ...photo, likes: photo.likes + 1 } : photo
    ));
  };

  const toggleShareStatus = (photoId: number) => {
    setPhotos(photos.map(photo =>
      photo.id === photoId ? { ...photo, sharedWithClient: !photo.sharedWithClient } : photo
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const resetUploadForm = () => {
    setSelectedFiles(null);
    setUploadTitle('');
    setUploadCategory('');
    setUploadClient('');
    setUploadDescription('');
    setUploadFeatured(false);
    setUploadShared(true);
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }
    if (!uploadTitle.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!uploadCategory) {
      alert('Please select a category');
      return;
    }
    if (!uploadClient.trim()) {
      alert('Please enter a client name');
      return;
    }

    // Create new photo entries
    const newPhotos = Array.from(selectedFiles).map((file, index) => ({
      id: photos.length + index + 1,
      title: selectedFiles.length > 1 ? `${uploadTitle} ${index + 1}` : uploadTitle,
      category: uploadCategory.charAt(0).toUpperCase() + uploadCategory.slice(1),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      client: uploadClient,
      clientAvatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
      views: 0,
      likes: 0,
      downloads: 0,
      thumbnail: URL.createObjectURL(file),
      featured: uploadFeatured,
      sharedWithClient: uploadShared,
      photoCount: selectedFiles.length
    }));

    // Add new photos to the gallery
    setPhotos([...newPhotos, ...photos]);

    // Reset form and close modal
    resetUploadForm();
    setShowUploadModal(false);

    alert(`Successfully uploaded ${selectedFiles.length} photo(s)!`);
  };

  const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Product', 'Fashion', 'Architecture'];

  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = filterCategory === 'All' || photo.category === filterCategory;
    const matchesSearch = photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: photos.length,
    totalPhotos: photos.reduce((sum, photo) => sum + photo.photoCount, 0),
    views: photos.reduce((sum, photo) => sum + photo.views, 0),
    likes: photos.reduce((sum, photo) => sum + photo.likes, 0),
    featured: photos.filter(photo => photo.featured).length,
    shared: photos.filter(photo => photo.sharedWithClient).length,
    private: photos.filter(photo => !photo.sharedWithClient).length
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>My Gallery</h1>
              <p style={{
                fontSize: '0.95rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>Manage and share your photo collections with clients</p>
            </div>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{stats.total}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Photos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{formatNumber(stats.totalPhotos)}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Views</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{formatNumber(stats.views)}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Shared</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>{stats.shared}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Private</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>{stats.private}</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Category Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: filterCategory === category ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: filterCategory === category ? '#083A85' : 'white',
                    color: filterCategory === category ? 'white' : '#6B7280',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.625rem 1rem 0.625rem 2.75rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white',
                    width: '280px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                backgroundColor: '#F3F4F6',
                padding: '0.25rem',
                borderRadius: '0.5rem'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
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
                    backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
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
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Showing {filteredPhotos.length} album{filteredPhotos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Gallery Grid - 3 columns */}
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem'
            }}>
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Image Container */}
                  <div style={{
                    position: 'relative',
                    height: '200px',
                    overflow: 'hidden'
                  }}>
                    <Image
                      src={photo.thumbnail}
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

                    {/* Top Right - Featured Badge & Like */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      {photo.featured && (
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
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(photo.id);
                        }}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <HeartIcon filled={photo.likes > 200} />
                      </button>
                    </div>

                    {/* Bottom - Stats on image */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        color: 'white',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <EyeIcon /> {formatNumber(photo.views)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="bi bi-heart-fill" style={{ color: '#F20C8F' }}></i> {formatNumber(photo.likes)}
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#111827',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {photo.photoCount} photos
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '1rem' }}>
                    {/* Title & Client */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0,
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{photo.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image
                          src={photo.clientAvatar}
                          alt={photo.client}
                          width={24}
                          height={24}
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{photo.client}</span>
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
                      <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{photo.date}</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: photo.sharedWithClient ? '#065F46' : '#92400E'
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
                          toggleShareStatus(photo.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#083A85',
                          color: photo.sharedWithClient ? '#065F46' : 'white',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ShareIcon />
                        {photo.sharedWithClient ? 'Shared' : 'Share'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(photo);
                          setShowEditModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #E5E7EB',
                          backgroundColor: 'white',
                          color: '#6B7280',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <i className="bi bi-pencil" style={{ fontSize: '0.875rem' }}></i>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              border: '1px solid #E5E7EB'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Album</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Client</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Photos</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Views</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPhotos.map((photo) => (
                    <tr
                      key={photo.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setShowViewModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                            <Image
                              src={photo.thumbnail}
                              alt={photo.title}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', margin: 0 }}>{photo.title}</h3>
                              {photo.featured && (
                                <span style={{
                                  backgroundColor: '#FEF3C7',
                                  color: '#92400E',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.65rem',
                                  fontWeight: '600'
                                }}>Featured</span>
                              )}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.5rem',
                              backgroundColor: '#DBEAFE',
                              color: '#1E40AF',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: '500',
                              marginTop: '0.25rem'
                            }}>{photo.category}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Image
                            src={photo.clientAvatar}
                            alt={photo.client}
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{photo.client}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{photo.date}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#083A85' }}>{photo.photoCount}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.85rem', color: '#6B7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <EyeIcon /> {formatNumber(photo.views)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="bi bi-heart-fill" style={{ color: '#F20C8F', fontSize: '0.8rem' }}></i> {formatNumber(photo.likes)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          color: photo.sharedWithClient ? '#065F46' : '#92400E'
                        }}>
                          <i className={`bi ${photo.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{ fontSize: '0.75rem' }}></i>
                          {photo.sharedWithClient ? 'Shared' : 'Private'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShareStatus(photo.id);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              border: 'none',
                              backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#DBEAFE',
                              color: photo.sharedWithClient ? '#059669' : '#2563EB',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title={photo.sharedWithClient ? 'Unshare' : 'Share'}
                          >
                            <ShareIcon />
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
                              borderRadius: '0.5rem',
                              border: 'none',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Edit"
                          >
                            <i className="bi bi-pencil" style={{ fontSize: '0.9rem' }}></i>
                          </button>
                          <button
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              border: 'none',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Results */}
          {filteredPhotos.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '4rem 1.5rem',
              textAlign: 'center',
              border: '1px solid #E5E7EB'
            }}>
              <i className="bi bi-images" style={{ fontSize: '4rem', color: '#D1D5DB', marginBottom: '1rem' }}></i>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>No albums found</h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#6B7280',
                margin: 0
              }}>Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>

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
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
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
                color: '#111827',
                margin: 0
              }}>Create New Album</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

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
                backgroundColor: '#F9FAFB',
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
              <p style={{
                fontSize: '0.95rem',
                color: '#374151',
                margin: '0 0 0.5rem 0',
                fontWeight: '500'
              }}>
                {selectedFiles && selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Click to upload photos'}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                margin: 0
              }}>PNG, JPG, GIF up to 10MB each</p>
            </label>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Album Title *</label>
                <input
                  type="text"
                  placeholder="Enter album title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select category</option>
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="product">Product</option>
                  <option value="fashion">Fashion</option>
                  <option value="architecture">Architecture</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Client Name *</label>
                <input
                  type="text"
                  placeholder="Enter client name"
                  value={uploadClient}
                  onChange={(e) => setUploadClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="upload-featured"
                    checked={uploadFeatured}
                    onChange={(e) => setUploadFeatured(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#083A85' }}
                  />
                  <label htmlFor="upload-featured" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    Mark as featured
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="upload-shared"
                    checked={uploadShared}
                    onChange={(e) => setUploadShared(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                  />
                  <label htmlFor="upload-shared" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
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
              borderTop: '1px solid #E5E7EB'
            }}>
              <button
                onClick={() => {
                  resetUploadForm();
                  setShowUploadModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#083A85',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="bi bi-plus-lg"></i>
                Create Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Photo Modal */}
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
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              width: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div style={{ position: 'relative', height: '300px' }}>
              <Image
                src={selectedPhoto.thumbnail}
                alt={selectedPhoto.title}
                fill
                style={{ objectFit: 'cover', borderRadius: '1rem 1rem 0 0' }}
              />
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>{selectedPhoto.title}</h2>
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
                  backgroundColor: selectedPhoto.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: selectedPhoto.sharedWithClient ? '#065F46' : '#92400E'
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
                backgroundColor: '#F9FAFB',
                borderRadius: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <Image
                  src={selectedPhoto.clientAvatar}
                  alt={selectedPhoto.client}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.client}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{selectedPhoto.date}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedPhoto.photoCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Photos</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{formatNumber(selectedPhoto.views)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Views</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#F20C8F' }}>{formatNumber(selectedPhoto.likes)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Likes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10B981' }}>{formatNumber(selectedPhoto.downloads)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Downloads</div>
                </div>
              </div>

              {/* Actions */}
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
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white',
                    color: '#374151',
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
                  onClick={() => toggleShareStatus(selectedPhoto.id)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: selectedPhoto.sharedWithClient ? '#FEF3C7' : '#083A85',
                    color: selectedPhoto.sharedWithClient ? '#92400E' : 'white',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ShareIcon />
                  {selectedPhoto.sharedWithClient ? 'Unshare' : 'Share with Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
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
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
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
                color: '#111827',
                margin: 0
              }}>Edit Album</h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Preview Image */}
            <div style={{ position: 'relative', height: '160px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <Image
                src={selectedPhoto.thumbnail}
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
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Title</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.title}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Category</label>
                <select
                  defaultValue={selectedPhoto.category.toLowerCase()}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="product">Product</option>
                  <option value="fashion">Fashion</option>
                  <option value="architecture">Architecture</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Client</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.client}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
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
                  <label htmlFor="edit-featured" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
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
                  <label htmlFor="edit-shared" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
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
              borderTop: '1px solid #E5E7EB'
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
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
                  border: 'none',
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
    </div>
  );
};

export default Gallery;
