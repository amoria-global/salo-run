"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Sample streams data
const streamsData = [
  {
    id: 1,
    title: 'Wedding Photography Workshop',
    description: 'Live tutorial on capturing perfect wedding moments',
    thumbnail: '/images/stream1.jpg',
    status: 'live' as const,
    viewers: 234,
    startTime: '2:30 PM',
    duration: '45 min',
    category: 'Workshop',
    isScheduled: false
  },
  {
    id: 2,
    title: 'Behind the Scenes: Portrait Session',
    description: 'Watch me photograph a professional portrait session',
    thumbnail: '/images/stream2.jpg',
    status: 'scheduled' as const,
    viewers: 0,
    startTime: 'Tomorrow, 3:00 PM',
    duration: '60 min',
    category: 'Behind the Scenes',
    isScheduled: true
  },
  {
    id: 3,
    title: 'Editing Masterclass: Lightroom Tips',
    description: 'Advanced photo editing techniques and workflows',
    thumbnail: '/images/stream3.jpg',
    status: 'ended' as const,
    viewers: 892,
    startTime: 'Yesterday, 4:00 PM',
    duration: '90 min',
    category: 'Tutorial',
    isScheduled: false
  },
  {
    id: 4,
    title: 'Q&A: Photography Business Tips',
    description: 'Ask me anything about building a photography business',
    thumbnail: '/images/stream4.jpg',
    status: 'ended' as const,
    viewers: 567,
    startTime: '3 days ago',
    duration: '50 min',
    category: 'Q&A',
    isScheduled: false
  },
  {
    id: 5,
    title: 'Client Gallery Showcase',
    description: 'Showcasing my recent work and client projects',
    thumbnail: '/images/stream5.jpg',
    status: 'scheduled' as const,
    viewers: 0,
    startTime: 'Jan 25, 5:00 PM',
    duration: '30 min',
    category: 'Showcase',
    isScheduled: true
  },
  {
    id: 6,
    title: 'Product Photography Basics',
    description: 'Learn the fundamentals of product photography',
    thumbnail: '/images/stream6.jpg',
    status: 'ended' as const,
    viewers: 445,
    startTime: 'Last week',
    duration: '75 min',
    category: 'Tutorial',
    isScheduled: false
  }
];

const Streams = () => {
  const [streams, setStreams] = useState(streamsData);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState<any>(null);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Form state for creating/scheduling streams
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamCategory, setStreamCategory] = useState('');
  const [streamDate, setStreamDate] = useState('');
  const [streamTime, setStreamTime] = useState('');
  const [streamDuration, setStreamDuration] = useState('');

  // Mock live viewers and comments
  const [liveViewers] = useState([
    { id: 1, name: 'Sarah Johnson', avatar: '/avatars/user1.jpg', isActive: true },
    { id: 2, name: 'Michael Chen', avatar: '/avatars/user2.jpg', isActive: true },
    { id: 3, name: 'Emma Davis', avatar: '/avatars/user3.jpg', isActive: false },
    { id: 4, name: 'David Wilson', avatar: '/avatars/user4.jpg', isActive: true },
    { id: 5, name: 'Lisa Anderson', avatar: '/avatars/user5.jpg', isActive: true },
  ]);

  const [liveComments, setLiveComments] = useState([
    { id: 1, user: 'Sarah Johnson', message: 'Great lighting setup!', time: '2 min ago', avatar: '/avatars/user1.jpg' },
    { id: 2, user: 'Michael Chen', message: 'Can you show the camera settings?', time: '5 min ago', avatar: '/avatars/user2.jpg' },
    { id: 3, user: 'David Wilson', message: 'This is so helpful, thank you!', time: '8 min ago', avatar: '/avatars/user4.jpg' },
    { id: 4, user: 'Lisa Anderson', message: 'What lens are you using?', time: '10 min ago', avatar: '/avatars/user5.jpg' },
    { id: 5, user: 'Sarah Johnson', message: 'Love the composition tips', time: '12 min ago', avatar: '/avatars/user1.jpg' },
  ]);

  const statusFilters = ['all', 'live', 'scheduled', 'ended'];

  const filteredStreams = streams.filter(stream => {
    const matchesStatus = filterStatus === 'all' || stream.status === filterStatus;
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: streams.length,
    live: streams.filter(s => s.status === 'live').length,
    scheduled: streams.filter(s => s.status === 'scheduled').length,
    totalViewers: streams.reduce((sum, s) => sum + s.viewers, 0)
  };

  const resetCreateForm = () => {
    setStreamTitle('');
    setStreamDescription('');
    setStreamCategory('');
    setStreamDate('');
    setStreamTime('');
    setStreamDuration('');
  };

  const handleCreateStream = () => {
    if (!streamTitle.trim()) {
      return;
    }
    if (!streamCategory) {
      return;
    }
    if (!streamDate || !streamTime) {
      return;
    }

    const newStream = {
      id: streams.length + 1,
      title: streamTitle,
      description: streamDescription,
      thumbnail: '/images/stream-placeholder.jpg',
      status: 'scheduled' as const,
      viewers: 0,
      startTime: `${streamDate}, ${streamTime}`,
      duration: streamDuration || '60 min',
      category: streamCategory,
      isScheduled: true
    };

    setStreams([newStream, ...streams]);
    resetCreateForm();
    setShowCreateModal(false);
  };

  const handleEditStream = () => {
    if (!streamTitle.trim() || !streamCategory || !streamDate || !streamTime) {
      return;
    }

    const updatedStreams = streams.map(stream =>
      stream.id === selectedStream.id
        ? {
            ...stream,
            title: streamTitle,
            description: streamDescription,
            category: streamCategory,
            startTime: `${streamDate}, ${streamTime}`,
            duration: streamDuration || stream.duration
          }
        : stream
    );

    setStreams(updatedStreams);
    resetCreateForm();
    setShowEditModal(false);
    setSelectedStream(null);
  };

  const handleDeleteStream = () => {
    if (streamToDelete) {
      setStreams(streams.filter(s => s.id !== streamToDelete.id));
      setShowDeleteModal(false);
      setStreamToDelete(null);
    }
  };

  const openEditModal = (stream: any) => {
    setSelectedStream(stream);
    setStreamTitle(stream.title);
    setStreamDescription(stream.description);
    setStreamCategory(stream.category);
    // Parse date and time from startTime string (simplified)
    setStreamDate('');
    setStreamTime('');
    setStreamDuration(stream.duration);
    setShowEditModal(true);
  };

  const openDeleteModal = (stream: any) => {
    setStreamToDelete(stream);
    setShowDeleteModal(true);
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: liveComments.length + 1,
      user: 'You (Photographer)',
      message: newComment,
      time: 'Just now',
      avatar: '/avatars/photographer.jpg'
    };

    setLiveComments([comment, ...liveComments]);
    setNewComment('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#10B981';
      case 'scheduled': return '#F59E0B';
      case 'ended': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'live': return '#D1FAE5';
      case 'scheduled': return '#FEF3C7';
      case 'ended': return '#F3F4F6';
      default: return '#F3F4F6';
    }
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
          padding: '1rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Live Streams</h1>
              <p style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                marginTop: '0.125rem'
              }}>Broadcast live sessions and connect with your audience</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#083A85',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: '500',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#062D6B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#083A85';
              }}
            >
              <i className="bi bi-broadcast" style={{ fontSize: '0.875rem' }}></i>
              Schedule
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#DBEAFE',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="bi bi-broadcast" style={{ fontSize: '1rem', color: '#2563EB' }}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Total Streams</div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.total}</div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#D1FAE5',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="bi bi-record-circle" style={{ fontSize: '1rem', color: '#10B981' }}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Live Now</div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.live}</div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="bi bi-calendar-check" style={{ fontSize: '1rem', color: '#F59E0B' }}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Scheduled</div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.scheduled}</div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#E0E7FF',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="bi bi-eye" style={{ fontSize: '1rem', color: '#6366F1' }}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    marginBottom: '0.125rem'
                  }}>Total Views</div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#111827'
                  }}>{stats.totalViewers.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              {/* Status Filters */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: filterStatus === status ? 'none' : '1px solid #D1D5DB',
                      backgroundColor: filterStatus === status ? '#083A85' : 'white',
                      color: filterStatus === status ? 'white' : '#374151',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => {
                      if (filterStatus !== status) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filterStatus !== status) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{
                  position: 'absolute',
                  left: '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280',
                  fontSize: '0.75rem'
                }}></i>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.375rem 0.625rem 0.375rem 1.875rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white',
                    width: '180px'
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
            </div>
          </div>

          {/* Streams Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.875rem'
          }}>
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
                onClick={() => {
                  setSelectedStream(stream);
                  setShowStreamModal(true);
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: '100%',
                  height: '130px',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <i className="bi bi-play-circle" style={{ fontSize: '2rem', color: '#9CA3AF' }}></i>

                  {/* Status Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    backgroundColor: getStatusBgColor(stream.status),
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: getStatusColor(stream.status),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    textTransform: 'uppercase'
                  }}>
                    {stream.status === 'live' && <i className="bi bi-record-circle-fill" style={{ fontSize: '0.625rem' }}></i>}
                    {stream.status === 'scheduled' && <i className="bi bi-calendar-check" style={{ fontSize: '0.625rem' }}></i>}
                    {stream.status}
                  </div>

                  {/* Viewer Count for Live Streams */}
                  {stream.status === 'live' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <i className="bi bi-eye-fill" style={{ fontSize: '0.65rem' }}></i>
                      {stream.viewers}
                    </div>
                  )}
                </div>

                {/* Stream Info */}
                <div style={{ padding: '0.75rem' }}>
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
                      margin: 0,
                      flex: 1,
                      lineHeight: '1.3'
                    }}>{stream.title}</h3>
                  </div>

                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    margin: '0 0 0.5rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>{stream.description}</p>

                  <div style={{
                    display: 'flex',
                    gap: '0.375rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.4rem',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: '500'
                    }}>{stream.category}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #F3F4F6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="bi bi-clock" style={{ fontSize: '0.65rem' }}></i>
                      <span>{stream.startTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="bi bi-hourglass-split" style={{ fontSize: '0.65rem' }}></i>
                      <span>{stream.duration}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.375rem',
                    marginTop: '0.75rem'
                  }}>
                    {stream.status === 'live' && (
                      <button
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          backgroundColor: '#10B981',
                          border: 'none',
                          borderRadius: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStream(stream);
                          setShowStreamModal(true);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#10B981';
                        }}
                      >
                        <i className="bi bi-broadcast" style={{ fontSize: '0.75rem' }}></i>
                        Join Live
                      </button>
                    )}
                    {stream.status === 'scheduled' && (
                      <>
                        <button
                          style={{
                            flex: 1,
                            padding: '0.4rem',
                            backgroundColor: '#083A85',
                            border: 'none',
                            borderRadius: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(stream);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#062D6B';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#083A85';
                          }}
                        >
                          <i className="bi bi-pencil" style={{ fontSize: '0.7rem' }}></i>
                          Edit
                        </button>
                        <button
                          style={{
                            flex: 1,
                            padding: '0.4rem',
                            backgroundColor: '#F3F4F6',
                            border: 'none',
                            borderRadius: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(stream);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#E5E7EB';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#F3F4F6';
                          }}
                        >
                          <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }}></i>
                          Cancel
                        </button>
                      </>
                    )}
                    {stream.status === 'ended' && (
                      <button
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          backgroundColor: '#F3F4F6',
                          border: 'none',
                          borderRadius: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStream(stream);
                          setShowStreamModal(true);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#E5E7EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }}
                      >
                        <i className="bi bi-play-circle" style={{ fontSize: '0.75rem' }}></i>
                        Replay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredStreams.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem 1rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}>
              <i className="bi bi-broadcast" style={{ fontSize: '2rem', color: '#D1D5DB', marginBottom: '0.75rem' }}></i>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.375rem 0'
              }}>No streams found</h3>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                margin: 0
              }}>Try adjusting your filters or create a new stream</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Schedule Stream Modal */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
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
              }}>Schedule New Stream</h2>
              <button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(false);
                }}
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
                }}>Stream Title *</label>
                <input
                  type="text"
                  placeholder="Enter stream title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
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
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value)}
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
                  <option value="Workshop">Workshop</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Behind the Scenes">Behind the Scenes</option>
                  <option value="Q&A">Q&A</option>
                  <option value="Showcase">Showcase</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Description</label>
                <textarea
                  placeholder="Describe what viewers will learn or see"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>Date *</label>
                  <input
                    type="date"
                    value={streamDate}
                    onChange={(e) => setStreamDate(e.target.value)}
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
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>Time *</label>
                  <input
                    type="time"
                    value={streamTime}
                    onChange={(e) => setStreamTime(e.target.value)}
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
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Expected Duration</label>
                <select
                  value={streamDuration}
                  onChange={(e) => setStreamDuration(e.target.value)}
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
                  <option value="30 min">30 minutes</option>
                  <option value="45 min">45 minutes</option>
                  <option value="60 min">60 minutes</option>
                  <option value="90 min">90 minutes</option>
                  <option value="120 min">120 minutes</option>
                </select>
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
                  resetCreateForm();
                  setShowCreateModal(false);
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
                onClick={handleCreateStream}
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
                <i className="bi bi-calendar-check"></i>
                Schedule Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Details Modal */}
      {showStreamModal && selectedStream && (
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
          onClick={() => setShowStreamModal(false)}
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
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Stream Details</h2>
              <button
                onClick={() => setShowStreamModal(false)}
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

            {/* Stream Preview */}
            <div style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#F3F4F6',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              position: 'relative'
            }}>
              <i className="bi bi-play-circle" style={{ fontSize: '4rem', color: '#9CA3AF' }}></i>
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                backgroundColor: getStatusBgColor(selectedStream.status),
                padding: '0.25rem 0.625rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: getStatusColor(selectedStream.status),
                textTransform: 'uppercase'
              }}>
                {selectedStream.status}
              </div>
            </div>

            {/* Stream Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 0.375rem 0'
                }}>{selectedStream.title}</h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  margin: 0
                }}>{selectedStream.description}</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Category</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{selectedStream.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Duration</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{selectedStream.duration}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Start Time</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{selectedStream.startTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Viewers</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                    {selectedStream.status === 'live' ? `${selectedStream.viewers} watching` : `${selectedStream.viewers} total`}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <button
                  onClick={() => setShowStreamModal(false)}
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
                    if (selectedStream.status === 'scheduled') {
                      setShowStreamModal(false);
                      openEditModal(selectedStream);
                    } else if (selectedStream.status === 'ended') {
                      setShowStreamModal(false);
                      setShowReplayModal(true);
                    } else if (selectedStream.status === 'live') {
                      setShowStreamModal(false);
                      setShowReplayModal(true);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.625rem 1rem',
                    backgroundColor: selectedStream.status === 'live' ? '#10B981' : '#083A85',
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
                    e.currentTarget.style.backgroundColor = selectedStream.status === 'live' ? '#059669' : '#062D6B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = selectedStream.status === 'live' ? '#10B981' : '#083A85';
                  }}
                >
                  {selectedStream.status === 'live' && (
                    <>
                      <i className="bi bi-broadcast"></i>
                      Join Stream
                    </>
                  )}
                  {selectedStream.status === 'scheduled' && (
                    <>
                      <i className="bi bi-pencil"></i>
                      Edit Stream
                    </>
                  )}
                  {selectedStream.status === 'ended' && (
                    <>
                      <i className="bi bi-play-circle"></i>
                      Watch Replay
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stream Modal */}
      {showEditModal && selectedStream && (
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
          onClick={() => {
            setShowEditModal(false);
            resetCreateForm();
            setSelectedStream(null);
          }}
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
              }}>Edit Stream</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetCreateForm();
                  setSelectedStream(null);
                }}
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
                }}>Stream Title *</label>
                <input
                  type="text"
                  placeholder="Enter stream title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
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
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value)}
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
                  <option value="Workshop">Workshop</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Behind the Scenes">Behind the Scenes</option>
                  <option value="Q&A">Q&A</option>
                  <option value="Showcase">Showcase</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Description</label>
                <textarea
                  placeholder="Describe what viewers will learn or see"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>Date *</label>
                  <input
                    type="date"
                    value={streamDate}
                    onChange={(e) => setStreamDate(e.target.value)}
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
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>Time *</label>
                  <input
                    type="time"
                    value={streamTime}
                    onChange={(e) => setStreamTime(e.target.value)}
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
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Expected Duration</label>
                <select
                  value={streamDuration}
                  onChange={(e) => setStreamDuration(e.target.value)}
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
                  <option value="30 min">30 minutes</option>
                  <option value="45 min">45 minutes</option>
                  <option value="60 min">60 minutes</option>
                  <option value="90 min">90 minutes</option>
                  <option value="120 min">120 minutes</option>
                </select>
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
                  setShowEditModal(false);
                  resetCreateForm();
                  setSelectedStream(null);
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
                onClick={handleEditStream}
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
                <i className="bi bi-check-lg"></i>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && streamToDelete && (
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
          onClick={() => {
            setShowDeleteModal(false);
            setStreamToDelete(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '1.5rem', color: '#DC2626' }}></i>
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>Cancel Stream</h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  margin: '0.25rem 0 0 0'
                }}>This action cannot be undone</p>
              </div>
            </div>

            {/* Confirmation Message */}
            <p style={{
              fontSize: '0.875rem',
              color: '#374151',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              Are you sure you want to cancel <strong>{streamToDelete.title}</strong>? This will permanently remove the scheduled stream.
            </p>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStreamToDelete(null);
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
                Keep Stream
              </button>
              <button
                onClick={handleDeleteStream}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  backgroundColor: '#DC2626',
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
                  e.currentTarget.style.backgroundColor = '#B91C1C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#DC2626';
                }}
              >
                <i className="bi bi-x-lg"></i>
                Cancel Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replay Viewer Modal */}
      {showReplayModal && selectedStream && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => {
            setShowReplayModal(false);
            setSelectedStream(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#000',
              borderRadius: '0.75rem',
              width: '90%',
              maxWidth: selectedStream.status === 'live' ? '1400px' : '1200px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'row'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Video Section */}
            <div style={{
              flex: selectedStream.status === 'live' ? '1 1 70%' : '1',
              display: 'flex',
              flexDirection: 'column'
            }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              backgroundColor: '#1a1a1a',
              borderBottom: '1px solid #333'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0
                }}>{selectedStream.title}</h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#9CA3AF',
                  margin: '0.25rem 0 0 0'
                }}>
                  {selectedStream.viewers.toLocaleString()} views • {selectedStream.startTime}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReplayModal(false);
                  setSelectedStream(null);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#333',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '1.125rem' }}></i>
              </button>
            </div>

            {/* Video Player Area */}
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {/* Placeholder for video player */}
              <div style={{
                textAlign: 'center',
                color: '#9CA3AF'
              }}>
                <i className="bi bi-play-circle" style={{ fontSize: '5rem', marginBottom: '1rem' }}></i>
                <p style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  margin: '0 0 0.5rem 0',
                  color: 'white'
                }}>Replay Player</p>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0
                }}>Video player would load here</p>
                <p style={{
                  fontSize: '0.75rem',
                  margin: '0.5rem 0 0 0',
                  color: '#6B7280'
                }}>Duration: {selectedStream.duration}</p>
              </div>
            </div>

            {/* Stream Info */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#1a1a1a'
            }}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#374151',
                  color: '#9CA3AF',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>{selectedStream.category}</span>
                <span style={{
                  display: 'inline-block',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#374151',
                  color: '#9CA3AF',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  <i className="bi bi-clock" style={{ marginRight: '0.375rem' }}></i>
                  {selectedStream.duration}
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#D1D5DB',
                margin: 0,
                lineHeight: '1.5'
              }}>{selectedStream.description}</p>
            </div>
            </div>

            {/* Live Chat Sidebar - Only show for live streams */}
            {selectedStream.status === 'live' && (
              <div style={{
                flex: '0 0 30%',
                backgroundColor: '#1a1a1a',
                borderLeft: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
              }}>
                {/* Chat Header */}
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid #333',
                  backgroundColor: '#0f0f0f'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <i className="bi bi-people-fill" style={{ color: '#10B981' }}></i>
                      Live Viewers ({liveViewers.filter(v => v.isActive).length})
                    </h3>
                  </div>

                  {/* Active Viewers List */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {liveViewers.filter(v => v.isActive).map(viewer => (
                      <div
                        key={viewer.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          backgroundColor: '#262626',
                          padding: '0.375rem 0.625rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          color: '#D1D5DB'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#083A85',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          {viewer.name.charAt(0)}
                        </div>
                        <span>{viewer.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid #333'
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    margin: '0 0 0.75rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <i className="bi bi-chat-dots-fill" style={{ color: '#10B981' }}></i>
                    Live Chat
                  </h3>
                </div>

                {/* Comments List */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {liveComments.map(comment => (
                    <div key={comment.id} style={{
                      display: 'flex',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#083A85',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {comment.user.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: '600',
                            color: 'white'
                          }}>{comment.user}</span>
                          <span style={{
                            fontSize: '0.6875rem',
                            color: '#6B7280'
                          }}>{comment.time}</span>
                        </div>
                        <p style={{
                          fontSize: '0.8125rem',
                          color: '#D1D5DB',
                          margin: 0,
                          lineHeight: '1.4'
                        }}>{comment.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid #333',
                  backgroundColor: '#0f0f0f'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <input
                      type="text"
                      placeholder="Send a message..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendComment();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '0.625rem 0.75rem',
                        backgroundColor: '#262626',
                        border: '1px solid #404040',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#10B981';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#404040';
                      }}
                    />
                    <button
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                      style={{
                        padding: '0.625rem 1rem',
                        backgroundColor: newComment.trim() ? '#10B981' : '#374151',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}
                      onMouseEnter={(e) => {
                        if (newComment.trim()) {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newComment.trim()) {
                          e.currentTarget.style.backgroundColor = '#10B981';
                        }
                      }}
                    >
                      <i className="bi bi-send-fill"></i>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Streams;
