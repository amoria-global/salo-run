"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import EventConfirmModal from '../../components/EventConfirmModal';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';

// Types
interface ViewerMessage {
  id: string;
  viewerUsername: string;
  viewerAvatar: string;
  message: string;
  timestamp: string;
  time: string;
}

interface ViewerVideo {
  id: string;
  viewerUsername: string;
  viewerAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  timestamp: string;
  time: string;
  viewed: boolean;
}

interface CompletedStream {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  photographerName: string;
  photographerImage: string;
  streamTitle: string;
  description: string;
  streamDate: string;
  streamTime: string;
  duration: string;
  coverImage: string;
  totalViewers: number;
  peakViewers: number;
  totalMessages: number;
  totalVideoMessages: number;
  replayUrl: string;
  messages: ViewerMessage[];
  videoMessages: ViewerVideo[];
}

// SVG Icons
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="5,3 19,12 5,21" fill="currentColor"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
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

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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

const BroadcastIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16.24 7.76C17.5 9.02 18.25 10.7 18.25 12.5C18.25 14.3 17.5 15.98 16.24 17.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.76 16.24C6.5 14.98 5.75 13.3 5.75 11.5C5.75 9.7 6.5 8.02 7.76 6.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.07 4.93C21.03 6.89 22.15 9.6 22.15 12.5C22.15 15.4 21.03 18.11 19.07 20.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.93 19.07C2.97 17.11 1.85 14.4 1.85 11.5C1.85 8.6 2.97 5.89 4.93 3.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '600px' }) => {
  const { colors } = useTheme();
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
        backgroundColor: colors.bgCard,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.375rem', cursor: 'pointer', padding: '0.5rem', color: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};


interface StreamsPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const normalizeImg = (url: string | undefined | null): string => {
  if (!url || url === 'null' || url.endsWith('/null')) return '';
  let u = url;
  if (!u.includes('/') && !u.startsWith('http')) {
    u = `${getApiUrl()}/uploads/profile/photos/${u}`;
  }
  // Fix backend path mismatch: /event/media/ should be /event/photos/
  u = u.replace('/uploads/event/media/', '/uploads/event/photos/');
  return normalizeImageUrl(u) || '';
};

const ClientStreamsPage = ({ userRole = 'client' }: StreamsPageProps) => {
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  const apiUrl = getApiUrl();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<CompletedStream | null>(null);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ViewerVideo | null>(null);
  const [streams, setStreams] = useState<CompletedStream[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompletedStream | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch streams from API
  // Fetch chats for a single stream from the dedicated endpoint
  const fetchChatsForStream = useCallback(async (eventId: string): Promise<{ messages: ViewerMessage[]; videoMessages: ViewerVideo[] }> => {
    const rolePrefix = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
    // Coordinator uses /streams/{eventId}/chats, customer uses /events/{eventId}/chats
    const chatsPath = userRole === 'event-coordinator'
      ? `${apiUrl}/api/remote/${rolePrefix}/streams/${eventId}/chats?page=0&size=500`
      : `${apiUrl}/api/remote/${rolePrefix}/events/${eventId}/chats?page=0&size=500`;
    try {
      const res = await dashboardAuthFetch(chatsPath);
      if (res.ok) {
        const chatData = await res.json();
        const allChats: any[] = chatData.data || chatData || [];
        const textMessages: ViewerMessage[] = allChats
          .filter((m: any) => !m.videoUrl)
          .map((m: any) => ({
            id: m.id,
            viewerUsername: m.viewerUsername || '',
            viewerAvatar: normalizeImg(m.viewerAvatar),
            message: m.message || '',
            timestamp: m.timestamp || '',
            time: m.time || '',
          }));
        const videoMessages: ViewerVideo[] = allChats
          .filter((m: any) => m.videoUrl)
          .map((v: any) => ({
            id: v.id,
            viewerUsername: v.viewerUsername || '',
            viewerAvatar: normalizeImg(v.viewerAvatar),
            videoUrl: normalizeImg(v.videoUrl),
            thumbnailUrl: normalizeImg(v.thumbnailUrl),
            duration: v.duration || '0:00',
            timestamp: v.timestamp || '',
            time: v.time || '',
            viewed: v.viewed || false,
          }));
        return { messages: textMessages, videoMessages };
      }
    } catch { /* ignore per-stream chat errors */ }
    return { messages: [], videoMessages: [] };
  }, [apiUrl, userRole]);

  const fetchStreams = useCallback(async () => {
    try {
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/streams`
        : `${apiUrl}/api/remote/customer/streams`;
      const res = await dashboardAuthFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const streamList: any[] = data.data || [];

        // Fetch chats and event data for all streams in parallel
        const [chatResults, eventResults] = await Promise.all([
          Promise.all(streamList.map((s: any) => fetchChatsForStream(s.eventId))),
          Promise.all(streamList.map(async (s: any) => {
            try {
              const evtRes = await fetch(`${apiUrl}/api/remote/public/events/${s.eventId}`);
              if (evtRes.ok) {
                const evtData = await evtRes.json();
                return evtData.data || null;
              }
            } catch { /* ignore */ }
            return null;
          })),
        ]);

        const loaded: CompletedStream[] = streamList.map((s: any, i: number) => {
          const { messages: inlineText, videoMessages: inlineVideo } = (() => {
            // Also check for inline messages (in case backend adds them later)
            const allInline: any[] = s.messages || [];
            return {
              messages: allInline.filter((m: any) => !m.videoUrl).map((m: any) => ({
                id: m.id,
                viewerUsername: m.viewerUsername || '',
                viewerAvatar: normalizeImg(m.viewerAvatar),
                message: m.message || '',
                timestamp: m.timestamp || '',
                time: m.time || '',
              })),
              videoMessages: allInline.filter((m: any) => m.videoUrl).map((v: any) => ({
                id: v.id,
                viewerUsername: v.viewerUsername || '',
                viewerAvatar: normalizeImg(v.viewerAvatar),
                videoUrl: normalizeImg(v.videoUrl),
                thumbnailUrl: normalizeImg(v.thumbnailUrl),
                duration: v.duration || '0:00',
                timestamp: v.timestamp || '',
                time: v.time || '',
                viewed: v.viewed || false,
              })),
            };
          })();

          // Merge: dedicated endpoint chats + any inline chats (deduplicated by id)
          const fetchedChats = chatResults[i];
          const allMessages = [...fetchedChats.messages, ...inlineText];
          const allVideos = [
            ...fetchedChats.videoMessages,
            ...inlineVideo,
            ...(s.videoMessages || []).map((v: any) => ({
              id: v.id,
              viewerUsername: v.viewerUsername || '',
              viewerAvatar: normalizeImg(v.viewerAvatar),
              videoUrl: normalizeImg(v.videoUrl),
              thumbnailUrl: normalizeImg(v.thumbnailUrl),
              duration: v.duration || '0:00',
              timestamp: v.timestamp || '',
              time: v.time || '',
              viewed: v.viewed || false,
            })),
          ];
          // Deduplicate by id
          const seenMsgIds = new Set<string>();
          const uniqueMessages = allMessages.filter(m => { if (seenMsgIds.has(m.id)) return false; seenMsgIds.add(m.id); return true; });
          const seenVidIds = new Set<string>();
          const uniqueVideos = allVideos.filter(v => { if (seenVidIds.has(v.id)) return false; seenVidIds.add(v.id); return true; });

          // Enrich with event data (cover image, photographer info)
          const evt = eventResults[i];
          const evtPhoto = evt?.eventPhoto || evt?.coverImage || '';
          const evtPhotographerName = evt?.photographerName || (evt?.photographer ? `${evt.photographer.firstName || ''} ${evt.photographer.lastName || ''}`.trim() : '');
          const evtPhotographerImage = evt?.photographerImage || evt?.photographer?.profilePicture || '';

          return {
            id: s.id,
            eventId: s.eventId,
            eventTitle: s.eventTitle || evt?.title || '',
            eventType: s.eventType || evt?.eventCategory?.name || '',
            photographerName: s.photographerName || evtPhotographerName || '',
            photographerImage: normalizeImg(s.photographerImage || evtPhotographerImage),
            streamTitle: s.streamTitle || '',
            description: s.description || evt?.description || '',
            streamDate: s.streamDate || evt?.eventDate || '',
            streamTime: s.streamTime || evt?.startTime || '',
            duration: s.duration || '0:00:00',
            coverImage: normalizeImg(s.coverImage || s.bannerImage || s.eventImage || evtPhoto),
            totalViewers: s.totalViewers || 0,
            peakViewers: s.peakViewers || 0,
            totalMessages: s.totalMessages || uniqueMessages.length,
            totalVideoMessages: s.totalVideoMessages || uniqueVideos.length,
            replayUrl: s.replayUrl || '',
            messages: uniqueMessages,
            videoMessages: uniqueVideos,
          };
        });
        // Newest-created first. Prefer streamDate (when the stream happened);
        // fall back to any createdAt the payload exposes.
        loaded.sort((a, b) => {
          const ta = a.streamDate ? new Date(a.streamDate).getTime() : 0;
          const tb = b.streamDate ? new Date(b.streamDate).getTime() : 0;
          return tb - ta;
        });
        setStreams(loaded);
      }
    } catch (err) {
      console.error('Failed to fetch streams:', err);
    }
  }, [apiUrl, userRole, fetchChatsForStream]);

  useEffect(() => {
    if (user?.id) {
      fetchStreams();
    }
  }, [user?.id, fetchStreams]);

  const handleDeleteStream = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const rolePrefix = userRole === 'event-coordinator' ? 'coordinator' : 'customer';
      // Try stream record id first, fallback to eventId
      const streamId = deleteTarget.id;
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${rolePrefix}/streams/${streamId}`, { method: 'DELETE' });
      if (res.ok) {
        setStreams(prev => prev.filter(s => s.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        // If failed with stream id, try with eventId
        if (deleteTarget.eventId && deleteTarget.eventId !== streamId) {
          const res2 = await dashboardAuthFetch(`${apiUrl}/api/remote/${rolePrefix}/streams/${deleteTarget.eventId}`, { method: 'DELETE' });
          if (res2.ok) {
            setStreams(prev => prev.filter(s => s.id !== deleteTarget.id));
            setDeleteTarget(null);
          }
        }
      }
    } catch { /* ignore */ }
    setIsDeleting(false);
  };

  // Load and play video when selectedVideo changes
  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      setIsVideoLoading(true);
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked by browser, user can click play
      });
    }
  }, [selectedVideo]);

  // Filter streams based on search and filter
  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          stream.streamTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          stream.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || stream.eventType.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Event types for filter
  const eventTypes = ['all', 'Wedding', 'Birthday', 'Corporate', 'Baby Shower'];

  // Mark video as viewed
  const markVideoAsViewed = async (streamId: string, videoId: string) => {
    setStreams(prev => prev.map(stream => {
      if (stream.id === streamId) {
        return {
          ...stream,
          videoMessages: stream.videoMessages.map(video =>
            video.id === videoId ? { ...video, viewed: true } : video
          )
        };
      }
      return stream;
    }));
    try {
      await dashboardAuthFetch(
        `${apiUrl}/api/remote/${userRole === 'event-coordinator' ? 'coordinator' : 'customer'}/streams/${streamId}/videos/${videoId}/viewed`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.error('Failed to mark video as viewed:', err);
    }
  };

  // Get unviewed video count
  const getUnviewedVideoCount = (stream: CompletedStream) => {
    return stream.videoMessages.filter(v => !v.viewed).length;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Card styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.bgCard,
    borderRadius: '0.75rem',
    border: `2px solid ${colors.borderPrimary}`,
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem;
          }
          .mobile-title {
            font-size: 1.5rem !important;
          }
          .mobile-subtitle {
            font-size: 0.85rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          .mobile-stats-grid > div {
            padding: 0.75rem !important;
          }
          .mobile-stats-grid > div > div > div:first-child {
            font-size: 0.7rem !important;
          }
          .mobile-stats-grid > div > div > div:last-child {
            font-size: 1rem !important;
          }
          .mobile-filters {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .mobile-search {
            width: 100% !important;
            max-width: 100% !important;
          }
          .mobile-search input {
            width: 100% !important;
            min-height: 44px !important;
          }
          .mobile-filter-buttons {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
            -webkit-overflow-scrolling: touch;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          .mobile-filter-buttons::-webkit-scrollbar {
            display: none !important;
          }
          .mobile-filter-buttons button {
            flex-shrink: 0 !important;
            min-height: 40px !important;
          }
          .mobile-streams-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            margin-bottom: 3rem !important;
          }
          .mobile-streams-grid button {
            min-height: 40px !important;
          }
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .mobile-modal {
            width: 95% !important;
            max-width: 95% !important;
            padding: 1rem !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.4rem !important;
          }
          .mobile-stats-grid > div {
            padding: 0.6rem !important;
          }
          .mobile-stats-grid > div > div > div:first-child {
            font-size: 0.65rem !important;
          }
          .mobile-stats-grid > div > div > div:last-child {
            font-size: 0.9rem !important;
          }
          .mobile-title {
            font-size: 1.3rem !important;
          }
          .mobile-subtitle {
            font-size: 0.8rem !important;
          }
          .mobile-filter-buttons button {
            font-size: 0.8rem !important;
            padding: 0.4rem 0.8rem !important;
          }
          .mobile-streams-grid {
            margin-bottom: 4rem !important;
          }
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* Page Header */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', margin: '8px 0 22px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>LIBRARY</div>
              <h1 className="mobile-title" style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: colors.textPrimary }}>
                Completed streams
              </h1>
              <p className="mobile-subtitle" style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                Browse messages and videos from your past event streams.
              </p>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {([
              { label: 'Total streams',  value: streams.length.toString(),                                                      accent: '#083A85', tint: 'rgba(8,58,133,0.10)',  icon: 'bi-broadcast-pin' },
              { label: 'Total viewers',  value: streams.reduce((acc, s) => acc + s.totalViewers, 0).toLocaleString(),           accent: '#10B981', tint: 'rgba(16,185,129,0.12)', icon: 'bi-people-fill' },
              { label: 'Chat messages',  value: streams.reduce((acc, s) => acc + s.totalMessages, 0).toString(),                accent: '#F59E0B', tint: 'rgba(245,158,11,0.12)', icon: 'bi-chat-dots-fill' },
              { label: 'Video messages', value: streams.reduce((acc, s) => acc + s.totalVideoMessages, 0).toString(),           accent: '#F20C8F', tint: 'rgba(242,12,143,0.12)', icon: 'bi-camera-video-fill' },
            ] as const).map((stat) => (
              <div
                key={stat.label}
                className="ck-card"
                style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px 16px', cursor: 'default' }}
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

          {/* Search and Filter Bar */}
          <div className="mobile-filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="ck-search mobile-search" style={{ flex: 1, maxWidth: 400, minWidth: 220 }}>
              <i className="bi bi-search" />
              <input
                type="search"
                placeholder="Search completed streams…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="ck-tabs mobile-filter-buttons filter-buttons">
              {eventTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`ck-tab ${filterType === type ? 'is-active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Streams Grid */}
          <div className="mobile-streams-grid streams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {filteredStreams.map((stream, index) => {
              const unviewedCount = getUnviewedVideoCount(stream);
              return (
                <div
                  key={stream.id ?? index}
                  style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {/* Blurred cover = glow effect */}
                  <img src={stream.coverImage || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                  {/* Inner card */}
                  <div
                    style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    {/* Full-bleed cover image */}
                    <img src={stream.coverImage || '/coverr.jpg'} alt={stream.streamTitle} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                    {/* TOP: event type + duration/unviewed + delete */}
                    <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', right: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        border: '1px solid rgba(255,255,255,0.18)',
                        boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                        pointerEvents: 'none',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff', boxShadow: '0 0 0 2px rgba(255,255,255,0.30)' }} />
                        {stream.eventType}
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {unviewedCount > 0 && (
                          <div style={{
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            color: 'white',
                            padding: '4px 9px',
                            borderRadius: 9999,
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(255,255,255,0.20)',
                            boxShadow: '0 4px 10px rgba(220,38,38,0.30)',
                            pointerEvents: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <i className="bi bi-dot" style={{ fontSize: 14, lineHeight: 0 }} />
                            {unviewedCount} new
                          </div>
                        )}
                        <div style={{
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          display: 'flex', alignItems: 'center', gap: 4,
                          border: '1px solid rgba(255,255,255,0.18)',
                          pointerEvents: 'none',
                        }}>
                          <ClockIcon /> {stream.duration}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(stream); }}
                          style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            color: 'rgba(255,255,255,0.9)',
                            width: 26, height: 26,
                            padding: 0,
                            borderRadius: 9,
                            border: '1px solid rgba(255,255,255,0.18)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderColor = '#DC2626';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(220,38,38,0.30)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.55)';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          title="Delete stream"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    {/* BOTTOM: title, date, photographer, stats, buttons — all overlaid */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                      {/* Title + date over image */}
                      <div style={{ padding: '0 0.8rem 0.5rem' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '0.15rem' }}>
                          {stream.streamTitle}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CalendarIcon /> {formatDate(stream.streamDate)} at {stream.streamTime}
                        </div>
                      </div>

                      {/* FOOTER: frosted glass */}
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: '0.75rem 1rem 0.85rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                        {/* Photographer + stats row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #083A85, #F20C8F)', border: '1.5px solid rgba(255,255,255,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.30)' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                            </svg>
                            {stream.photographerImage && (
                              <img src={stream.photographerImage} alt={stream.photographerName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, letterSpacing: '-0.005em' }}>{stream.photographerName}</span>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                            <div title={`${stream.totalViewers} viewers`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9999 }}>
                              <UsersIcon /> {stream.totalViewers}
                            </div>
                            <div title={`${stream.totalMessages} chat messages`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9999 }}>
                              <MessageIcon /> {stream.totalMessages}
                            </div>
                            <div title={`${stream.totalVideoMessages} video messages`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#fff', fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9999 }}>
                              <VideoIcon /> {stream.totalVideoMessages}
                            </div>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => { setSelectedStream(stream); setShowMessagesModal(true); }}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.7rem',
                              borderRadius: 9,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
                              color: '#fff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                              letterSpacing: '-0.005em',
                              transition: 'transform 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <MessageIcon /> View chats
                          </button>
                          <button
                            onClick={() => { setSelectedStream(stream); setShowVideosModal(true); }}
                            style={{
                              flex: 1,
                              padding: '0.5rem 0.7rem',
                              borderRadius: 9,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                              color: '#fff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 4px 10px rgba(220,38,38,0.30)',
                              letterSpacing: '-0.005em',
                              transition: 'transform 0.15s',
                              position: 'relative',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <VideoIcon /> Videos
                            {unviewedCount > 0 && (
                              <span style={{
                                marginLeft: 4,
                                padding: '1px 6px',
                                background: 'rgba(255,255,255,0.20)',
                                border: '1px solid rgba(255,255,255,0.30)',
                                borderRadius: 9999,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                              }}>{unviewedCount}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredStreams.length === 0 && (
            <div className="ck-empty" style={{
              background: colors.bgCard,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: 16,
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
                <i className="bi bi-broadcast-pin" style={{ fontSize: 26, color: '#083A85' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                  No completed streams found
                </div>
                <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 460, lineHeight: 1.5 }}>
                  {searchQuery || filterType !== 'all'
                    ? 'Try a different keyword or filter. Your past streams will appear here once they match.'
                    : 'Your completed event streams will appear here with viewer messages and videos.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Modal */}
      <Modal
        isOpen={showMessagesModal}
        onClose={() => {
          setShowMessagesModal(false);
          setSelectedStream(null);
        }}
        title={`Chat Messages - ${selectedStream?.streamTitle || ''}`}
        maxWidth="550px"
      >
        {selectedStream && (
          <div>
            <div style={{
              backgroundColor: colors.bgTertiary,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Total messages: <strong style={{ color: colors.textPrimary }}>{selectedStream.totalMessages}</strong>
              </span>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Stream date: <strong style={{ color: colors.textPrimary }}>{formatDate(selectedStream.streamDate)}</strong>
              </span>
            </div>

            <div>
              {selectedStream.messages.map((msg, index) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.875rem',
                    backgroundColor: index % 2 === 0 ? colors.bgCard : colors.bgTertiary,
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                    backgroundColor: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                    </svg>
                    {msg.viewerAvatar && (
                      <img src={msg.viewerAvatar} alt={msg.viewerUsername} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                        @{msg.viewerUsername}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{msg.time}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: colors.textPrimary, margin: 0, lineHeight: '1.5' }}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedStream.messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: colors.textSecondary }}>
                No messages were sent during this stream.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Video Messages Modal */}
      <Modal
        isOpen={showVideosModal}
        onClose={() => {
          setShowVideosModal(false);
          setSelectedStream(null);
          setSelectedVideo(null);
        }}
        title={`Video Messages - ${selectedStream?.streamTitle || ''}`}
        maxWidth="700px"
      >
        {selectedStream && (
          <div>
            <div style={{
              backgroundColor: colors.bgTertiary,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Total videos: <strong style={{ color: colors.textPrimary }}>{selectedStream.totalVideoMessages}</strong>
              </span>
              <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Max duration: <strong style={{ color: colors.textPrimary }}>1 minute</strong>
              </span>
            </div>

            {/* Selected Video Player */}
            {selectedVideo && (
              <div style={{
                marginBottom: '1rem',
                backgroundColor: '#111827',
                borderRadius: '0.5rem',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'relative' }}>
                  <video
                    ref={videoRef}
                    key={selectedVideo.id}
                    controls
                    playsInline
                    preload="auto"
                    onLoadedData={() => setIsVideoLoading(false)}
                    onCanPlay={() => setIsVideoLoading(false)}
                    onError={() => setIsVideoLoading(false)}
                    style={{
                      width: '100%',
                      height: '280px',
                      backgroundColor: '#000',
                      display: 'block',
                    }}
                    src={selectedVideo.videoUrl}
                  />
                  {isVideoLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #374151',
                        borderTopColor: '#083A85',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      <style>{`
                        @keyframes spin {
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#1F2937',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                      </svg>
                      {selectedVideo.viewerAvatar && (
                        <img src={selectedVideo.viewerAvatar} alt={selectedVideo.viewerUsername} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                    </div>
                    <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '500' }}>
                      @{selectedVideo.viewerUsername}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                    <span>{selectedVideo.duration}</span>
                    <span>{selectedVideo.time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Video Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              maxHeight: selectedVideo ? '200px' : '400px',
              overflowY: 'auto',
            }}>
              {selectedStream.videoMessages.map(video => (
                <div
                  key={video.id}
                  onClick={() => {
                    setSelectedVideo(video);
                    if (!video.viewed) {
                      markVideoAsViewed(selectedStream.id, video.id);
                    }
                  }}
                  style={{
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: selectedVideo?.id === video.id ? '3px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative', height: '100px', backgroundColor: '#0D1B2A' }}>
                    {video.videoUrl ? (
                      <video
                        src={`${video.videoUrl}#t=0.1`}
                        muted
                        playsInline
                        preload="metadata"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onLoadedMetadata={(e) => { try { (e.currentTarget as HTMLVideoElement).currentTime = 0.1; } catch {} }}
                      />
                    ) : (
                      <img src={video.thumbnailUrl || '/coverr.jpg'} alt={`Video from ${video.viewerUsername}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                    )}
                    {/* Play icon overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                    {!video.viewed && (
                      <div style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                      }}>
                        NEW
                      </div>
                    )}
                    {video.viewed && (
                      <div style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        backgroundColor: '#059669',
                        color: 'white',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <CheckIcon />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.25rem',
                      right: '0.25rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                    }}>
                      {video.duration}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                    }}>
                      <PlayIcon />
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: colors.bgCard }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', marginBottom: '0.125rem' }}>
                      @{video.viewerUsername}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: colors.textSecondary }}>
                      {video.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedStream.videoMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: colors.textSecondary }}>
                No video messages were sent during this stream.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <EventConfirmModal
          tone="danger"
          icon="bi-trash3-fill"
          eyebrow="Permanent action"
          title="Delete stream record?"
          highlight={deleteTarget.streamTitle}
          intro={<>This will permanently delete the stream record for <strong style={{ color: colors.textPrimary }}>&ldquo;{deleteTarget.streamTitle}&rdquo;</strong>.</>}
          detail="All chat messages and video messages from this stream will be removed. This action cannot be undone."
          colors={colors}
          actualTheme={actualTheme}
          onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
          closeLabel="Cancel"
          primary={{
            label: isDeleting ? 'Deleting…' : 'Delete stream',
            icon: 'bi-trash3-fill',
            tone: 'danger',
            onClick: handleDeleteStream,
          }}
        />
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ClientStreamsPage;
