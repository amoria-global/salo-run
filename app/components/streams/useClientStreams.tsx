'use client';

// app/pages/client/streams.tsx's state, effects and handlers, moved verbatim so the classic page and the Compact Glass page share one
// source of truth (no behaviour change).

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '@/app/components/sidebar';
import EventConfirmModal from '@/app/components/EventConfirmModal';
import Topbar from '@/app/components/topbar';
import { useTheme } from '@/app/context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';

export interface ViewerMessage {
  id: string;
  viewerUsername: string;
  viewerAvatar: string;
  message: string;
  timestamp: string;
  time: string;
}

export interface ViewerVideo {
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

export interface CompletedStream {
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

export interface StreamsPageProps {
  userRole?: 'client' | 'event-coordinator';
}

export const normalizeImg = (url: string | undefined | null): string => {
  if (!url || url === 'null' || url.endsWith('/null')) return '';
  let u = url;
  if (!u.includes('/') && !u.startsWith('http')) {
    u = `${getApiUrl()}/uploads/profile/photos/${u}`;
  }
  // Fix backend path mismatch: /event/media/ should be /event/photos/
  u = u.replace('/uploads/event/media/', '/uploads/event/photos/');
  return normalizeImageUrl(u) || '';
};

export function useClientStreams({ userRole = 'client' }: StreamsPageProps) {
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

  // Glass view only: first answer received, and whether the last load failed (the classic page ignores both).
  const [streamsLoaded, setStreamsLoaded] = useState(false);
  const [streamsError, setStreamsError] = useState(false);
  const fetchStreams = useCallback(async () => {
    try {
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/streams`
        : `${apiUrl}/api/remote/customer/streams`;
      const res = await dashboardAuthFetch(endpoint);
      setStreamsError(!res.ok);
      if (res.ok) {
        const data = await res.json();
        const streamList: any[] = data.data || [];

        // Fetch chats and event data for all streams in parallel
        const [chatResults, eventResults] = await Promise.all([
          Promise.all(streamList.map((s: any) => fetchChatsForStream(s.eventId))),
          Promise.all(streamList.map(async (s: any) => {
            try {
              const evtRes = await dashboardAuthFetch(`${apiUrl}/api/remote/public/events/${s.eventId}`);
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
      setStreamsError(true);
    } finally {
      setStreamsLoaded(true);
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


  return {
    streamsLoaded,
    streamsError,
    colors,
    actualTheme,
    user,
    apiUrl,
    searchQuery,
    setSearchQuery,
    selectedStream,
    setSelectedStream,
    showMessagesModal,
    setShowMessagesModal,
    showVideosModal,
    setShowVideosModal,
    selectedVideo,
    setSelectedVideo,
    streams,
    setStreams,
    filterType,
    setFilterType,
    isVideoLoading,
    setIsVideoLoading,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    setIsDeleting,
    videoRef,
    fetchChatsForStream,
    fetchStreams,
    handleDeleteStream,
    filteredStreams,
    eventTypes,
    markVideoAsViewed,
    getUnviewedVideoCount,
    formatDate,
    cardStyle,
    userRole,
  };
}

export type ClientStreamsController = ReturnType<typeof useClientStreams>;
