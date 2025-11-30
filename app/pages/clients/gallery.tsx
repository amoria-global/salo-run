'use client';

import { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Sample data - client's photos from their projects
const clientGalleryData = [
  {
    id: 1,
    title: 'Ceremony Entrance',
    photographer: 'Sarah Anderson',
    project: 'Wedding Photography',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    favorite: false,
    downloaded: true
  },
  {
    id: 2,
    title: 'Reception Dance',
    photographer: 'Sarah Anderson',
    project: 'Wedding Photography',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    favorite: true,
    downloaded: false
  },
  {
    id: 3,
    title: 'Couple Portrait',
    photographer: 'Sarah Anderson',
    project: 'Wedding Photography',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    favorite: true,
    downloaded: true
  },
  {
    id: 4,
    title: 'Product Shot 1',
    photographer: 'Mike Chen',
    project: 'Product Catalog',
    category: 'Product',
    date: 'Nov 28, 2024',
    favorite: false,
    downloaded: false
  },
  {
    id: 5,
    title: 'Product Shot 2',
    photographer: 'Mike Chen',
    project: 'Product Catalog',
    category: 'Product',
    date: 'Nov 28, 2024',
    favorite: false,
    downloaded: true
  },
  {
    id: 6,
    title: 'Team Headshot',
    photographer: 'Emily Zhang',
    project: 'Corporate Portraits',
    category: 'Portrait',
    date: 'Oct 10, 2024',
    favorite: true,
    downloaded: true
  },
  {
    id: 7,
    title: 'Office Event',
    photographer: 'David Kim',
    project: 'Annual Gala',
    category: 'Event',
    date: 'Sep 5, 2024',
    favorite: false,
    downloaded: false
  },
  {
    id: 8,
    title: 'Group Photo',
    photographer: 'David Kim',
    project: 'Annual Gala',
    category: 'Event',
    date: 'Sep 5, 2024',
    favorite: true,
    downloaded: true
  }
];

const ClientGallery = () => {
  const [photos, setPhotos] = useState(clientGalleryData);
  const [filterProject, setFilterProject] = useState('All');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const projects = ['All', 'Wedding Photography', 'Product Catalog', 'Corporate Portraits', 'Annual Gala'];

  const filteredPhotos = photos.filter(photo => {
    const matchesProject = filterProject === 'All' || photo.project === filterProject;
    const matchesFavorites = !filterFavorites || photo.favorite;
    const matchesSearch = photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.photographer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.project.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesFavorites && matchesSearch;
  });

  const toggleFavorite = (photoId: number) => {
    setPhotos(photos.map(photo =>
      photo.id === photoId ? { ...photo, favorite: !photo.favorite } : photo
    ));
  };

  const handleDownload = (photoId: number) => {
    setPhotos(photos.map(photo =>
      photo.id === photoId ? { ...photo, downloaded: true } : photo
    ));
    console.log('Downloading photo:', photoId);
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
                margin: 0,
                marginBottom: '0.25rem'
              }}>My Gallery</h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0
              }}>View and download your photos from all projects</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setFilterFavorites(!filterFavorites)}
                style={{
                  padding: '0.625rem 1rem',
                  backgroundColor: filterFavorites ? '#083A85' : 'white',
                  border: filterFavorites ? 'none' : '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: filterFavorites ? 'white' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="bi bi-heart-fill" style={{ fontSize: '0.875rem' }}></i>
                {filterFavorites ? 'Show All' : 'Favorites Only'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#DBEAFE',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-image" style={{ fontSize: '1.25rem', color: '#083A85' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Total Photos</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>{photos.length}</p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#FEE2E2',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-heart-fill" style={{ fontSize: '1.25rem', color: '#DC2626' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Favorites</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {photos.filter(p => p.favorite).length}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#D1FAE5',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-download" style={{ fontSize: '1.25rem', color: '#059669' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Downloaded</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {photos.filter(p => p.downloaded).length}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-folder" style={{ fontSize: '1.25rem', color: '#D97706' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Projects</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {projects.length - 1}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              alignItems: 'end'
            }}>
              {/* Search */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Search Photos</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF',
                    fontSize: '0.875rem'
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search by title, photographer, or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem 0.5rem 2.25rem',
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
              </div>

              {/* Project Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Filter by Project</label>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
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
                  {projects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>View</label>
                <div style={{
                  display: 'inline-flex',
                  backgroundColor: '#F3F4F6',
                  padding: '0.25rem',
                  borderRadius: '0.5rem',
                  gap: '0.25rem'
                }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: viewMode === 'grid' ? '#083A85' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: viewMode === 'grid' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    <i className="bi bi-grid-3x3-gap" style={{ fontSize: '0.875rem' }}></i>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: viewMode === 'list' ? '#083A85' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: viewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    <i className="bi bi-list-ul" style={{ fontSize: '0.875rem' }}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Grid/List */}
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
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
                    height: '140px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <i className="bi bi-image" style={{ fontSize: '2rem', color: '#9CA3AF' }}></i>

                    {/* Favorite Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(photo.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: photo.favorite ? '#DC2626' : '#9CA3AF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                      }}
                    >
                      <i className={`bi ${photo.favorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: '1rem' }}></i>
                    </button>
                  </div>

                  {/* Photo Info */}
                  <div style={{ padding: '0.875rem' }}>
                    <h3 style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.375rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{photo.title}</h3>

                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      margin: 0,
                      marginBottom: '0.375rem'
                    }}>by {photo.photographer}</p>

                    <span style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.4rem',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: '500',
                      marginBottom: '0.625rem'
                    }}>{photo.category}</span>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.375rem'
                    }}>
                      <button
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowViewModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: '#083A85',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
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
                        <i className="bi bi-eye" style={{ fontSize: '0.75rem', marginRight: '0.25rem' }}></i>
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo.id);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: photo.downloaded ? '#F3F4F6' : '#10B981',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: photo.downloaded ? '#6B7280' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!photo.downloaded) {
                            e.currentTarget.style.backgroundColor = '#059669';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!photo.downloaded) {
                            e.currentTarget.style.backgroundColor = '#10B981';
                          }
                        }}
                      >
                        <i className={`bi ${photo.downloaded ? 'bi-check-circle' : 'bi-download'}`} style={{ fontSize: '0.75rem', marginRight: '0.25rem' }}></i>
                        {photo.downloaded ? 'Downloaded' : 'Download'}
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
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr auto',
                    gap: '1rem',
                    padding: '1rem',
                    borderBottom: index < filteredPhotos.length - 1 ? '1px solid #E5E7EB' : 'none',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '100px',
                    height: '70px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="bi bi-image" style={{ fontSize: '1.5rem', color: '#9CA3AF' }}></i>
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0
                      }}>{photo.title}</h3>
                      {photo.favorite && (
                        <i className="bi bi-heart-fill" style={{ fontSize: '0.75rem', color: '#DC2626' }}></i>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#6B7280',
                      margin: 0,
                      marginBottom: '0.375rem'
                    }}>by {photo.photographer} • {photo.project}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.375rem',
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        fontWeight: '500'
                      }}>{photo.category}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{photo.date}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleFavorite(photo.id)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'white',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
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
                      <i className={`bi ${photo.favorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: '0.8rem' }}></i>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setShowViewModal(true);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#083A85',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
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
                      <i className="bi bi-eye" style={{ fontSize: '0.8rem', marginRight: '0.25rem' }}></i>
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(photo.id)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: photo.downloaded ? '#F3F4F6' : '#10B981',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: photo.downloaded ? '#6B7280' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!photo.downloaded) {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!photo.downloaded) {
                          e.currentTarget.style.backgroundColor = '#10B981';
                        }
                      }}
                    >
                      <i className={`bi ${photo.downloaded ? 'bi-check-circle' : 'bi-download'}`} style={{ fontSize: '0.8rem', marginRight: '0.25rem' }}></i>
                      {photo.downloaded ? 'Downloaded' : 'Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
              width: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Photo Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
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
                <i className="bi bi-x-lg" style={{ fontSize: '0.875rem' }}></i>
              </button>
            </div>

            {/* Photo Preview */}
            <div style={{
              width: '100%',
              height: '250px',
              backgroundColor: '#F3F4F6',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <i className="bi bi-image" style={{ fontSize: '4rem', color: '#9CA3AF' }}></i>
            </div>

            {/* Photo Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>{selectedPhoto.title}</h3>
                  <button
                    onClick={() => toggleFavorite(selectedPhoto.id)}
                    style={{
                      padding: '0.375rem 0.625rem',
                      backgroundColor: selectedPhoto.favorite ? '#FEE2E2' : '#F3F4F6',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: selectedPhoto.favorite ? '#DC2626' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <i className={`bi ${selectedPhoto.favorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: '0.875rem' }}></i>
                  </button>
                </div>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.5rem',
                  backgroundColor: '#DBEAFE',
                  color: '#1E40AF',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>{selectedPhoto.category}</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                padding: '0.875rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Photographer</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.photographer}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Date</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.date}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Project</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.project}</div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
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
                    handleDownload(selectedPhoto.id);
                    setShowViewModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    backgroundColor: '#10B981',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10B981';
                  }}
                >
                  <i className="bi bi-download" style={{ marginRight: '0.5rem' }}></i>
                  Download Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;
