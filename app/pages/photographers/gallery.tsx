"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Sample gallery data
const galleryData = [
  {
    id: 1,
    title: 'Wedding Ceremony',
    category: 'Wedding',
    date: 'Jan 15, 2025',
    client: 'Kagabo Innocent',
    views: 234,
    likes: 45,
    thumbnail: '/images/wedding1.jpg',
    featured: true,
    sharedWithClient: true
  },
  {
    id: 2,
    title: 'Portrait Session',
    category: 'Portrait',
    date: 'Jan 14, 2025',
    client: 'Amora Smith',
    views: 189,
    likes: 32,
    thumbnail: '/images/portrait1.jpg',
    featured: false,
    sharedWithClient: true
  },
  {
    id: 3,
    title: 'Corporate Event',
    category: 'Event',
    date: 'Jan 13, 2025',
    client: 'Tech Corp',
    views: 156,
    likes: 28,
    thumbnail: '/images/event1.jpg',
    featured: true,
    sharedWithClient: false
  },
  {
    id: 4,
    title: 'Product Photography',
    category: 'Product',
    date: 'Jan 12, 2025',
    client: 'Asha Ross',
    views: 312,
    likes: 67,
    thumbnail: '/images/product1.jpg',
    featured: false,
    sharedWithClient: true
  },
  {
    id: 5,
    title: 'Family Portraits',
    category: 'Portrait',
    date: 'Jan 11, 2025',
    client: 'Penny Gloria',
    views: 201,
    likes: 41,
    thumbnail: '/images/family1.jpg',
    featured: false,
    sharedWithClient: false
  },
  {
    id: 6,
    title: 'Outdoor Wedding',
    category: 'Wedding',
    date: 'Jan 10, 2025',
    client: 'Sarah Johnson',
    views: 278,
    likes: 56,
    thumbnail: '/images/wedding2.jpg',
    featured: true,
    sharedWithClient: true
  },
  {
    id: 7,
    title: 'Fashion Shoot',
    category: 'Fashion',
    date: 'Jan 9, 2025',
    client: 'Mike Brown',
    views: 445,
    likes: 89,
    thumbnail: '/images/fashion1.jpg',
    featured: true,
    sharedWithClient: true
  },
  {
    id: 8,
    title: 'Architecture',
    category: 'Architecture',
    date: 'Jan 8, 2025',
    client: 'City Developers',
    views: 167,
    likes: 34,
    thumbnail: '/images/arch1.jpg',
    featured: false,
    sharedWithClient: false
  }
];

const Gallery = () => {
  const [photos, setPhotos] = useState(galleryData);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
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
      views: 0,
      likes: 0,
      thumbnail: URL.createObjectURL(file),
      featured: uploadFeatured,
      sharedWithClient: uploadShared
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
    views: photos.reduce((sum, photo) => sum + photo.views, 0),
    likes: photos.reduce((sum, photo) => sum + photo.likes, 0),
    featured: photos.filter(photo => photo.featured).length,
    shared: photos.filter(photo => photo.sharedWithClient).length,
    private: photos.filter(photo => !photo.sharedWithClient).length
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
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>My Gallery</h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>Store client photos and share them with your clients</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#083A85',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
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
              <i className="bi bi-upload"></i>
              Upload Photos
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#DBEAFE',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-images" style={{ fontSize: '1.25rem', color: '#2563EB' }}></i>
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Total Photos</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.total}</div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-eye" style={{ fontSize: '1.25rem', color: '#F59E0B' }}></i>
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Total Views</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.views.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#D1FAE5',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '1.25rem', color: '#059669' }}></i>
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Shared with Clients</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.shared}</div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-lock-fill" style={{ fontSize: '1.25rem', color: '#D97706' }}></i>
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Private Storage</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.private}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
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
                      border: filterCategory === category ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filterCategory === category ? '#083A85' : 'white',
                      color: filterCategory === category ? 'white' : '#374151',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (filterCategory !== category) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterCategory !== category) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6B7280',
                    fontSize: '0.875rem'
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search photos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      color: '#111827',
                      backgroundColor: 'white',
                      width: '250px'
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
                      padding: '0.375rem 0.625rem',
                      border: 'none',
                      backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                      color: viewMode === 'grid' ? '#083A85' : '#6B7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: viewMode === 'grid' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1rem' }}></i>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '0.375rem 0.625rem',
                      border: 'none',
                      backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                      color: viewMode === 'list' ? '#083A85' : '#6B7280',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: viewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    <i className="bi bi-list-ul" style={{ fontSize: '1rem' }}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Grid/List */}
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.75rem'
            }}>
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Image Placeholder */}
                  <div style={{
                    width: '100%',
                    height: '100px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <i className="bi bi-image" style={{ fontSize: '1.5rem', color: '#9CA3AF' }}></i>

                    {/* Shared Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.375rem',
                      left: '0.375rem',
                      backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                      padding: '0.125rem 0.35rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.55rem',
                      fontWeight: '600',
                      color: photo.sharedWithClient ? '#065F46' : '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}>
                      <i className={`bi ${photo.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{ fontSize: '0.5rem' }}></i>
                      {photo.sharedWithClient ? 'Shared' : 'Private'}
                    </div>

                    {photo.featured && (
                      <div style={{
                        position: 'absolute',
                        top: '0.375rem',
                        right: '0.375rem',
                        backgroundColor: '#FCD34D',
                        padding: '0.125rem 0.35rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.55rem',
                        fontWeight: '600',
                        color: '#92400E'
                      }}>
                        F
                      </div>
                    )}
                  </div>

                  {/* Photo Info */}
                  <div style={{ padding: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{photo.title}</h3>

                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.375rem',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: '0.25rem',
                      fontSize: '0.6rem',
                      fontWeight: '500',
                      marginBottom: '0.375rem'
                    }}>{photo.category}</span>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.65rem',
                      color: '#6B7280',
                      marginBottom: '0.375rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                        <i className="bi bi-eye" style={{ fontSize: '0.65rem' }}></i>
                        <span>{photo.views}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                        <i className="bi bi-heart" style={{ fontSize: '0.65rem' }}></i>
                        <span>{photo.likes}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem',
                      marginBottom: '0.375rem'
                    }}>
                      <button
                        onClick={() => toggleShareStatus(photo.id)}
                        style={{
                          flex: 1,
                          padding: '0.3rem',
                          backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.6rem',
                          fontWeight: '600',
                          color: photo.sharedWithClient ? '#065F46' : '#92400E',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.2rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <i className={`bi ${photo.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{ fontSize: '0.6rem' }}></i>
                        {photo.sharedWithClient ? 'Shared' : 'Share'}
                      </button>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.25rem'
                    }}>
                      <button
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowEditModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.3rem',
                          backgroundColor: '#F3F4F6',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '500',
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#E5E7EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }}
                      >
                        <i className="bi bi-pencil" style={{ fontSize: '0.65rem' }}></i>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowViewModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.3rem',
                          backgroundColor: '#083A85',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '500',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#062D6B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#083A85';
                        }}
                      >
                        <i className="bi bi-eye" style={{ fontSize: '0.65rem' }}></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Photo</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Category</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Client</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Date</th>
                    <th style={{
                      textAlign: 'center',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Stats</th>
                    <th style={{
                      textAlign: 'center',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPhotos.map((photo) => (
                    <tr
                      key={photo.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <i className="bi bi-image" style={{ fontSize: '1.5rem', color: '#9CA3AF' }}></i>
                          </div>
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#111827',
                              marginBottom: '0.25rem'
                            }}>{photo.title}</div>
                            {photo.featured && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.125rem 0.375rem',
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                borderRadius: '0.25rem',
                                fontSize: '0.65rem',
                                fontWeight: '600'
                              }}>
                                <i className="bi bi-star-fill"></i>
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.625rem',
                          backgroundColor: '#DBEAFE',
                          color: '#1E40AF',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>{photo.category}</span>
                      </td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}>{photo.client}</td>
                      <td style={{
                        padding: '1rem',
                        fontSize: '0.875rem',
                        color: '#6B7280'
                      }}>{photo.date}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: '#6B7280'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="bi bi-eye"></i>
                            <span>{photo.views}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="bi bi-heart"></i>
                            <span>{photo.likes}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'center'
                        }}>
                          <button
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '0.375rem',
                              border: 'none',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#E5E7EB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#F3F4F6';
                            }}
                            title="Edit"
                          >
                            <i className="bi bi-pencil" style={{ fontSize: '0.875rem' }}></i>
                          </button>
                          <button
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '0.375rem',
                              border: 'none',
                              backgroundColor: '#DBEAFE',
                              color: '#2563EB',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#BFDBFE';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#DBEAFE';
                            }}
                            title="View"
                          >
                            <i className="bi bi-eye" style={{ fontSize: '0.875rem' }}></i>
                          </button>
                          <button
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '0.375rem',
                              border: 'none',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FECACA';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash" style={{ fontSize: '0.875rem' }}></i>
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
              padding: '3rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <i className="bi bi-images" style={{ fontSize: '3rem', color: '#D1D5DB', marginBottom: '1rem' }}></i>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>No photos found</h3>
              <p style={{
                fontSize: '0.875rem',
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
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
              }}>Upload Photos</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '1rem' }}></i>
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
                padding: '3rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#083A85';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
            >
              <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#9CA3AF', marginBottom: '1rem' }}></i>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                margin: '0 0 0.5rem 0',
                fontWeight: '500'
              }}>
                {selectedFiles && selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Click to upload or drag and drop'}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                margin: 0
              }}>PNG, JPG, GIF up to 10MB (Multiple files allowed)</p>
            </label>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Title *</label>
                <input
                  type="text"
                  placeholder="Enter photo title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
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
                  fontWeight: '500',
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
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Description (Optional)</label>
                <textarea
                  placeholder="Enter photo description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="upload-featured"
                  checked={uploadFeatured}
                  onChange={(e) => setUploadFeatured(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#083A85'
                  }}
                />
                <label
                  htmlFor="upload-featured"
                  style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Mark as featured
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="upload-shared"
                  checked={uploadShared}
                  onChange={(e) => setUploadShared(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#059669'
                  }}
                />
                <label
                  htmlFor="upload-shared"
                  style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  <i className={`bi ${uploadShared ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{
                    fontSize: '0.875rem',
                    color: uploadShared ? '#059669' : '#D97706'
                  }}></i>
                  {uploadShared ? 'Share with client immediately' : 'Keep private (not shared)'}
                </label>
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
                  padding: '0.625rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  backgroundColor: '#083A85',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#062D6B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#083A85';
                }}
              >
                <i className="bi bi-upload"></i>
                Upload {selectedFiles && selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
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
              width: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Photo Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }}></i>
              </button>
            </div>

            {/* Photo Preview */}
            <div style={{
              width: '100%',
              height: '160px',
              backgroundColor: '#F3F4F6',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <i className="bi bi-image" style={{ fontSize: '3rem', color: '#9CA3AF' }}></i>
            </div>

            {/* Photo Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.375rem'
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>{selectedPhoto.title}</h3>
                  {selectedPhoto.featured && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.15rem 0.35rem',
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: '600'
                    }}>
                      Featured
                    </span>
                  )}
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.4rem',
                  backgroundColor: '#DBEAFE',
                  color: '#1E40AF',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '500'
                }}>{selectedPhoto.category}</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                padding: '0.625rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.2rem' }}>Client</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.client}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.2rem' }}>Date</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.2rem' }}>Views</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#111827' }}>
                    <i className="bi bi-eye" style={{ marginRight: '0.2rem', fontSize: '0.7rem' }}></i>
                    {selectedPhoto.views}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280', marginBottom: '0.2rem' }}>Likes</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#111827' }}>
                    <i className="bi bi-heart" style={{ marginRight: '0.2rem', fontSize: '0.7rem' }}></i>
                    {selectedPhoto.likes}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.25rem'
              }}>
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    backgroundColor: '#083A85',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#083A85';
                  }}
                >
                  Edit Photo
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
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
              }}>Edit Photo</h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '1rem' }}></i>
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Title</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.title}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Category</label>
                <select
                  defaultValue={selectedPhoto.category.toLowerCase()}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
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
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Client</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.client}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="edit-featured"
                  defaultChecked={selectedPhoto.featured}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#083A85'
                  }}
                />
                <label
                  htmlFor="edit-featured"
                  style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Mark as featured
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="edit-shared"
                  checked={selectedPhoto.sharedWithClient}
                  onChange={() => toggleShareStatus(selectedPhoto.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#059669'
                  }}
                />
                <label
                  htmlFor="edit-shared"
                  style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  <i className={`bi ${selectedPhoto.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{
                    fontSize: '0.875rem',
                    color: selectedPhoto.sharedWithClient ? '#059669' : '#D97706'
                  }}></i>
                  {selectedPhoto.sharedWithClient ? 'Shared with client' : 'Private (not shared)'}
                </label>
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
                  padding: '0.625rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  backgroundColor: '#083A85',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#062D6B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#083A85';
                }}
                onClick={() => {
                  // Handle save logic here
                  console.log('Saving photo changes...');
                  setShowEditModal(false);
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
