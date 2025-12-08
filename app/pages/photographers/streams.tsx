"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Types
type StreamStatus = 'scheduled' | 'preparing' | 'live' | 'ended' | 'replay_ready';

interface Stream {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  clientName: string;
  clientImage: string;
  title: string;
  description: string;
  status: StreamStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  coverImage: string;
  viewerCount: number;
  peakViewers: number;
  maxViewers: number;
  streamKey?: string;
  inviteUrl: string;
  isPublic: boolean;
  earnings: number;
  createdAt: string;
}

interface LiveComment {
  id: string;
  userName: string;
  userAvatar: string;
  message: string;
  time: string;
}

// SVG Icons
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
  </svg>
);

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
  </svg>
);

const BroadcastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16.24 7.76C17.5 9.02 18.25 10.7 18.25 12.5C18.25 14.3 17.5 15.98 16.24 17.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.76 16.24C6.5 14.98 5.75 13.3 5.75 11.5C5.75 9.7 6.5 8.02 7.76 6.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93C21.03 6.89 22.15 9.6 22.15 12.5C22.15 15.4 21.03 18.11 19.07 20.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.93 19.07C2.97 17.11 1.85 14.4 1.85 11.5C1.85 8.6 2.97 5.89 4.93 3.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V18M15 9.5C15 8.12 13.88 7 12.5 7H11C9.34 7 8 8.34 8 10C8 11.66 9.34 13 11 13H13C14.66 13 16 14.34 16 16C16 17.66 14.66 19 13 19H11.5C10.12 19 9 17.88 9 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="1" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 19V23M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Stream Status Badge Component
const StreamStatusBadge: React.FC<{ status: StreamStatus }> = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'scheduled':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
      case 'preparing':
        return { backgroundColor: '#FEF3C7', color: '#B45309' };
      case 'live':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'ended':
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
      case 'replay_ready':
        return { backgroundColor: '#E0E7FF', color: '#5B21B6' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const style = getStatusStyle();
  const labelMap: Record<StreamStatus, string> = {
    'scheduled': 'Scheduled',
    'preparing': 'Preparing',
    'live': 'LIVE',
    'ended': 'Ended',
    'replay_ready': 'Replay Ready'
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      ...style
    }}>
      {status === 'live' && (
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#DC2626',
          animation: 'pulse 1.5s infinite'
        }}/>
      )}
      {labelMap[status]}
    </span>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6B7280' }}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const PhotographerStreamsPage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStreamDetails, setShowStreamDetails] = useState<Stream | null>(null);
  const [showControlPanel, setShowControlPanel] = useState<Stream | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState<Stream | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  // Mock live comments
  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', userName: 'Sarah Johnson', userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg', message: 'This is beautiful! Amazing shots!', time: '2 min ago' },
    { id: '2', userName: 'Michael Chen', userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg', message: 'Can you show more of the venue?', time: '5 min ago' },
    { id: '3', userName: 'Emma Davis', userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', message: 'The lighting is perfect!', time: '8 min ago' },
    { id: '4', userName: 'David Wilson', userAvatar: 'https://randomuser.me/api/portraits/men/75.jpg', message: 'Love this! Keep up the great work!', time: '10 min ago' },
  ]);

  const [streams, setStreams] = useState<Stream[]>([
    {
      id: 'str1',
      eventId: 'evt1',
      eventTitle: 'Sarah & James Wedding',
      eventType: 'Wedding',
      clientName: 'Sarah Mitchell',
      clientImage: 'https://randomuser.me/api/portraits/women/44.jpg',
      title: 'Wedding Ceremony Live Stream',
      description: 'Streaming the beautiful garden wedding ceremony from Kigali Convention Center.',
      status: 'live',
      scheduledDate: '2025-08-15',
      scheduledTime: '14:00',
      duration: '2:35:42',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      viewerCount: 234,
      peakViewers: 287,
      maxViewers: 500,
      streamKey: 'sk_live_7x9K2mNpQrS4tUvW',
      inviteUrl: 'https://connekt.app/stream/str_7x9K2mNpQrS4',
      isPublic: false,
      earnings: 150,
      createdAt: '2025-06-01'
    },
    {
      id: 'str2',
      eventId: 'evt2',
      eventTitle: 'My 30th Birthday Bash',
      eventType: 'Birthday',
      clientName: 'Emma Johnson',
      clientImage: 'https://randomuser.me/api/portraits/women/68.jpg',
      title: '30th Birthday Live Celebration',
      description: 'Celebrating three decades of life! Live from Lake Kivu Resort.',
      status: 'scheduled',
      scheduledDate: '2025-07-25',
      scheduledTime: '18:00',
      duration: '4 hours',
      coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      viewerCount: 0,
      peakViewers: 0,
      maxViewers: 200,
      streamKey: 'sk_live_3pL8wYzTuV5H6xQr',
      inviteUrl: 'https://connekt.app/stream/str_3pL8wYzTuV5H',
      isPublic: true,
      earnings: 0,
      createdAt: '2025-06-15'
    },
    {
      id: 'str3',
      eventId: 'evt3',
      eventTitle: 'Corporate Event 2025',
      eventType: 'Corporate',
      clientName: 'Tech Solutions Ltd',
      clientImage: 'https://randomuser.me/api/portraits/men/45.jpg',
      title: 'Annual Conference Live Stream',
      description: 'Streaming the annual tech conference with keynote speeches and panels.',
      status: 'preparing',
      scheduledDate: '2025-07-20',
      scheduledTime: '09:00',
      duration: '6 hours',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      viewerCount: 0,
      peakViewers: 0,
      maxViewers: 1000,
      streamKey: 'sk_live_9dF4kBnCxM1J2pQr',
      inviteUrl: 'https://connekt.app/stream/str_9dF4kBnCxM1J',
      isPublic: true,
      earnings: 0,
      createdAt: '2025-07-01'
    },
    {
      id: 'str4',
      eventId: 'evt4',
      eventTitle: 'Baby Shower - Emma',
      eventType: 'Baby Shower',
      clientName: 'Rachel Green',
      clientImage: 'https://randomuser.me/api/portraits/women/33.jpg',
      title: 'Baby Emma Welcome Party',
      description: 'A lovely afternoon celebrating the upcoming arrival of baby Emma.',
      status: 'replay_ready',
      scheduledDate: '2025-05-20',
      scheduledTime: '14:00',
      duration: '2:15:30',
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      viewerCount: 89,
      peakViewers: 112,
      maxViewers: 100,
      inviteUrl: 'https://connekt.app/stream/str_5hR2vJmLnP8W',
      isPublic: false,
      earnings: 75,
      createdAt: '2025-04-01'
    },
    {
      id: 'str5',
      eventId: 'evt5',
      eventTitle: 'Graduation Party 2024',
      eventType: 'Graduation',
      clientName: 'Mark Williams',
      clientImage: 'https://randomuser.me/api/portraits/men/22.jpg',
      title: 'Graduation Ceremony Stream',
      description: 'Watch the graduation ceremony and celebration with family and friends.',
      status: 'ended',
      scheduledDate: '2024-12-15',
      scheduledTime: '17:00',
      duration: '3:45:00',
      coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      viewerCount: 234,
      peakViewers: 298,
      maxViewers: 300,
      inviteUrl: 'https://connekt.app/stream/str_1qA6tXsGdK4Y',
      isPublic: true,
      earnings: 120,
      createdAt: '2024-11-01'
    }
  ]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const comment: LiveComment = {
      id: Date.now().toString(),
      userName: 'You (Photographer)',
      userAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
      message: newComment,
      time: 'Just now'
    };

    setLiveComments([comment, ...liveComments]);
    setNewComment('');
  };

  const handleDeleteStream = () => {
    if (streamToDelete) {
      setStreams(streams.filter(s => s.id !== streamToDelete.id));
      setStreamToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleStartStream = (stream: Stream) => {
    setStreams(streams.map(s =>
      s.id === stream.id ? { ...s, status: 'live' as StreamStatus } : s
    ));
  };

  const handleEndStream = (stream: Stream) => {
    setStreams(streams.map(s =>
      s.id === stream.id ? { ...s, status: 'ended' as StreamStatus } : s
    ));
    setShowControlPanel(null);
  };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = searchQuery === '' ||
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'live') return matchesSearch && stream.status === 'live';
    if (activeTab === 'upcoming') return matchesSearch && (stream.status === 'scheduled' || stream.status === 'preparing');
    if (activeTab === 'past') return matchesSearch && (stream.status === 'ended' || stream.status === 'replay_ready');
    return matchesSearch;
  });

  const stats = {
    total: streams.length,
    live: streams.filter(s => s.status === 'live').length,
    upcoming: streams.filter(s => s.status === 'scheduled' || s.status === 'preparing').length,
    totalEarnings: streams.reduce((sum, s) => sum + s.earnings, 0),
    totalViewers: streams.reduce((sum, s) => sum + s.peakViewers, 0)
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', padding: '1.25rem' }}>

          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600', margin: 0 }}>My Streams</h1>
              <p style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Manage and control your live event streams
              </p>
            </div>
          </header>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Streams', value: stats.total, icon: <BroadcastIcon />, color: '#2563EB', bg: '#DBEAFE' },
              { label: 'Live Now', value: stats.live, icon: <PlayIcon />, color: '#059669', bg: '#D1FAE5' },
              { label: 'Upcoming', value: stats.upcoming, icon: <CalendarIcon />, color: '#D97706', bg: '#FEF3C7' },
              { label: 'Total Viewers', value: stats.totalViewers.toLocaleString(), icon: <EyeIcon />, color: '#7C3AED', bg: '#EDE9FE' },
              { label: 'Total Earnings', value: `$${stats.totalEarnings}`, icon: <DollarIcon />, color: '#059669', bg: '#D1FAE5' }
            ].map((stat, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: stat.bg,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color
                  }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', padding: '0.25rem' }}>
              {([
                { key: 'all' as const, label: 'All Streams' },
                { key: 'live' as const, label: 'Live' },
                { key: 'upcoming' as const, label: 'Upcoming' },
                { key: 'past' as const, label: 'Past' }
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: activeTab === tab.key ? 'white' : 'transparent',
                    color: activeTab === tab.key ? '#111827' : '#6B7280',
                    boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', width: '300px' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search streams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  backgroundColor: 'white'
                }}
              />
            </div>
          </div>

          {/* Streams Grid */}
          {filteredStreams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ color: '#9CA3AF', marginBottom: '1rem' }}>
                <BroadcastIcon />
              </div>
              <p style={{ fontSize: '1rem', color: '#6B7280' }}>No streams found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredStreams.map((stream) => (
                <div
                  key={stream.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: stream.status === 'live' ? '2px solid #10B981' : '1px solid #E5E7EB',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Cover Image */}
                  <div style={{ position: 'relative', height: '160px' }}>
                    <Image
                      src={stream.coverImage}
                      alt={stream.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                      <StreamStatusBadge status={stream.status} />
                    </div>
                    {/* Live Viewer Count */}
                    {stream.status === 'live' && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <EyeIcon />
                        {stream.viewerCount} watching
                      </div>
                    )}
                    {/* Event Type */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}>
                      {stream.eventType}
                    </div>
                    {/* Earnings */}
                    {stream.earnings > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        right: '0.75rem',
                        backgroundColor: '#D1FAE5',
                        color: '#059669',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        ${stream.earnings}
                      </div>
                    )}
                  </div>

                  {/* Stream Info */}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem', margin: 0 }}>
                      {stream.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.25rem 0 0.75rem 0' }}>
                      {stream.eventTitle}
                    </p>

                    {/* Client Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Image
                        src={stream.clientImage}
                        alt={stream.clientName}
                        width={24}
                        height={24}
                        style={{ borderRadius: '50%' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#374151' }}>
                        {stream.clientName}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6B7280' }}>
                        <CalendarIcon />
                        <span style={{ fontSize: '0.8rem' }}>{formatDate(stream.scheduledDate)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6B7280' }}>
                        <ClockIcon />
                        <span style={{ fontSize: '0.8rem' }}>{stream.status === 'live' ? stream.duration : stream.scheduledTime}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                      {stream.status === 'live' && (
                        <button
                          onClick={() => setShowControlPanel(stream)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <BroadcastIcon />
                          Control Panel
                        </button>
                      )}
                      {stream.status === 'preparing' && (
                        <button
                          onClick={() => handleStartStream(stream)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                            backgroundColor: '#083A85',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <PlayIcon />
                          Go Live
                        </button>
                      )}
                      {stream.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => setShowStreamDetails(stream)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              backgroundColor: '#083A85',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <SettingsIcon />
                            Setup
                          </button>
                          <button
                            onClick={() => { setStreamToDelete(stream); setShowDeleteModal(true); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </>
                      )}
                      {(stream.status === 'ended' || stream.status === 'replay_ready') && (
                        <button
                          onClick={() => setShowStreamDetails(stream)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                            backgroundColor: '#7C3AED',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <EyeIcon />
                          View Stats
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stream Control Panel Modal */}
      {showControlPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: '1600px',
            backgroundColor: '#111827',
            overflow: 'hidden'
          }}>
            {/* Main Stream View */}
            <div style={{ flex: '1 1 70%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                backgroundColor: '#1F2937',
                borderBottom: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#DC2626',
                    color: 'white',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      animation: 'pulse 1.5s infinite'
                    }}/>
                    LIVE
                  </div>
                  <div>
                    <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                      {showControlPanel.title}
                    </h2>
                    <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                      {showControlPanel.eventTitle}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF' }}>
                    <EyeIcon />
                    <span style={{ fontSize: '0.875rem' }}>{showControlPanel.viewerCount} watching</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF' }}>
                    <ClockIcon />
                    <span style={{ fontSize: '0.875rem' }}>{showControlPanel.duration}</span>
                  </div>
                  <button
                    onClick={() => setShowControlPanel(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      padding: '0.5rem'
                    }}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/* Video Preview */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
                position: 'relative'
              }}>
                <Image
                  src={showControlPanel.coverImage}
                  alt="Stream Preview"
                  fill
                  style={{ objectFit: 'cover', opacity: 0.5 }}
                />
                <div style={{
                  position: 'relative',
                  textAlign: 'center',
                  color: 'white',
                  zIndex: 1
                }}>
                  <VideoIcon />
                  <p style={{ margin: '1rem 0 0 0', fontSize: '1rem' }}>Live Stream Preview</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#9CA3AF' }}>
                    Camera and microphone are active
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div style={{
                padding: '1rem 1.5rem',
                backgroundColor: '#1F2937',
                borderTop: '1px solid #374151',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: isVideoOn ? '#374151' : '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <VideoIcon />
                    {isVideoOn ? 'Camera On' : 'Camera Off'}
                  </button>
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: isMicOn ? '#374151' : '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <MicIcon />
                    {isMicOn ? 'Mic On' : 'Mic Off'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <SettingsIcon />
                    Settings
                  </button>
                  <button
                    onClick={() => handleEndStream(showControlPanel)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <StopIcon />
                    End Stream
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Sidebar */}
            <div style={{
              flex: '0 0 30%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1F2937',
              borderLeft: '1px solid #374151'
            }}>
              {/* Chat Header */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #374151'
              }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MessageIcon />
                  Live Chat
                </h3>
              </div>

              {/* Chat Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {liveComments.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', gap: '0.75rem' }}>
                    <Image
                      src={comment.userAvatar}
                      alt={comment.userName}
                      width={32}
                      height={32}
                      style={{ borderRadius: '50%', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                          {comment.userName}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                          {comment.time}
                        </span>
                      </div>
                      <p style={{ color: '#D1D5DB', fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
                        {comment.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div style={{
                padding: '1rem',
                borderTop: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#374151',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!newComment.trim()}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: newComment.trim() ? '#10B981' : '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Details Modal */}
      <Modal isOpen={!!showStreamDetails} onClose={() => setShowStreamDetails(null)} title="Stream Details" maxWidth="600px">
        {showStreamDetails && (
          <div>
            {/* Cover Image */}
            <div style={{ position: 'relative', height: '180px', margin: '-1.5rem -1.5rem 1.25rem -1.5rem', overflow: 'hidden' }}>
              <Image
                src={showStreamDetails.coverImage}
                alt={showStreamDetails.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <StreamStatusBadge status={showStreamDetails.status} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: '0 0 0.25rem 0' }}>
              {showStreamDetails.title}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: '0 0 1rem 0' }}>
              {showStreamDetails.eventTitle}
            </p>

            {/* Client Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <Image
                src={showStreamDetails.clientImage}
                alt={showStreamDetails.clientName}
                width={40}
                height={40}
                style={{ borderRadius: '50%' }}
              />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{showStreamDetails.clientName}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Client</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <CalendarIcon />
                  <span style={{ fontSize: '0.8rem' }}>Date & Time</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>
                  {formatDate(showStreamDetails.scheduledDate)} at {showStreamDetails.scheduledTime}
                </div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <ClockIcon />
                  <span style={{ fontSize: '0.8rem' }}>Duration</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{showStreamDetails.duration}</div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <UsersIcon />
                  <span style={{ fontSize: '0.8rem' }}>Peak Viewers</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>
                  {showStreamDetails.peakViewers} / {showStreamDetails.maxViewers}
                </div>
              </div>
              <div style={{ backgroundColor: '#D1FAE5', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#059669' }}>
                  <DollarIcon />
                  <span style={{ fontSize: '0.8rem' }}>Earnings</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#059669' }}>${showStreamDetails.earnings}</div>
              </div>
            </div>

            {/* Stream Key (for scheduled streams) */}
            {showStreamDetails.streamKey && showStreamDetails.status === 'scheduled' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Stream Key</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    value={showStreamDetails.streamKey}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.625rem 0.875rem',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#F9FAFB'
                    }}
                  />
                  <button
                    onClick={() => handleCopyKey(showStreamDetails.streamKey!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.625rem 1rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      background: copiedKey ? '#10B981' : '#083A85',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <CopyIcon />
                    {copiedKey ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.5rem 0 0 0' }}>
                  Use this key with OBS or your streaming software
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Cancel Stream">
        {streamToDelete && (
          <div>
            <p style={{ fontSize: '0.95rem', color: '#6B7280', marginBottom: '1rem' }}>
              Are you sure you want to cancel <strong>{streamToDelete.title}</strong>? The client will be notified.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Keep Stream
              </button>
              <button
                onClick={handleDeleteStream}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: '#DC2626',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel Stream
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default PhotographerStreamsPage;
