"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

const normalizeImg = (url: string | undefined | null): string => {
  if (!url || url === 'null' || url.endsWith('/null')) return '';
  let u = url;
  if (!u.includes('/') && !u.startsWith('http')) {
    u = `${process.env.NEXT_PUBLIC_API_URL!}/uploads/profile/photos/${u}`;
  }
  return u.replace(process.env.NEXT_PUBLIC_OLD_API_URL!, process.env.NEXT_PUBLIC_API_URL!);
};

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="2"/>
    <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="9" cy="9" r="1" fill="#6B7280"/>
    <circle cx="15" cy="9" r="1" fill="#6B7280"/>
  </svg>
);

// Emoji categories with comprehensive emoji sets
const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '👄', '🫶', '🤲', '👐', '🙌', '👏', '🤝', '🫂'],
  'Objects': ['📷', '📸', '📹', '🎥', '📽️', '🎬', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪'],
  'Celebrations': ['🎉', '🎊', '🎁', '🎈', '🎀', '🎂', '🍰', '🧁', '🎄', '🎃', '🎆', '🎇', '✨', '🎯', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '🎮', '🕹️', '🎲', '🧩', '♟️', '🎭', '🎨', '🎼', '🎵', '🎶', '🎤', '🎧', '🎷', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁'],
  'Nature': ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🎋', '🎍', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌈', '☔', '⚡', '❄️', '☃️', '⛄', '🔥', '💧', '🌊'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔']
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckDoubleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L7 17L2 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6L11 17L9 15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 3.5L18.5 6.5L14.5 10.5L17.5 17.5L12 12L6.5 17.5L9.5 10.5L5.5 6.5L8.5 3.5L11 8L15.5 3.5Z" stroke="#F20C8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Message Action Icons
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Participant {
  id: string;
  name: string;
  image: string;
  userType: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'booking_request' | 'system';
  attachments?: { type: string; url: string; name: string; size: number }[];
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  bookingId?: string;
  messages: Message[];
}

interface InboxPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const InboxPage = ({ userRole = 'client' }: InboxPageProps) => {
  const { colors, actualTheme } = useTheme();
  const { user } = useDashboardAuth();
  const searchParams = useSearchParams();
  const urlPhotographerId = searchParams.get('photographerId');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Smileys');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  // Ref so markAsRead can read current unreadCounts without a stale closure
  const conversationsRef = useRef<Conversation[]>([]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const currentUserId = user?.id || '';
  const apiUrl = getApiUrl();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [giftAmount, setGiftAmount] = useState(0);

  // New Chat states
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string; image: string; speciality?: string }[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Keep ref in sync so callbacks can read current unreadCounts without stale closure
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`);
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            id: c.id || c.partnerId || '',
            participants: c.participants || [
              { id: currentUserId, name: '', image: '', userType: userRole, isOnline: true },
              { id: c.partnerId || c.id, name: c.partnerName || c.name || '', image: normalizeImg(c.partnerImage || c.image), userType: 'photographer', isOnline: false },
            ],
            lastMessage: c.lastMessage || (c.lastMessageContent ? { content: c.lastMessageContent, senderId: c.lastSenderId || '', createdAt: c.lastMessageAt || '' } : undefined),
            unreadCount: c.unreadCount || 0,
            isPinned: c.isPinned || false,
            isMuted: c.isMuted || false,
            messages: [],
          }));
          setConversations(mapped);
          // Immediately sync the sidebar badge with the server's actual unread total
          const totalUnread = mapped.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          window.dispatchEvent(new CustomEvent('inbox:totalCount', { detail: { total: totalUnread } }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [apiUrl, currentUserId, userRole]);

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Fetch booked photographers / contacts for New Chat
  const fetchContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const endpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/photographers`
        : `${apiUrl}/api/remote/customer/photographers`;
      const res = await dashboardAuthFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const list = (data.data?.content || data.data || []).map((p: any) => ({
          id: p.id || '',
          name: `${(p.firstName || '')} ${(p.lastName || '')}`.trim() || p.name || 'Photographer',
          image: normalizeImg(p.profilePicture || p.image),
          speciality: p.speciality || p.category || '',
        }));
        setContacts(list);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [apiUrl, userRole]);

  // Start or open conversation with a contact
  const startConversation = (contact: { id: string; name: string; image: string }) => {
    // Check if conversation already exists
    const existing = conversations.find(conv =>
      conv.participants.some(p => p.id === contact.id)
    );
    if (existing) {
      handleSelectConversation(existing.id);
    } else {
      // Create a local conversation shell — the backend will create it on first message
      const newConv: Conversation = {
        id: contact.id,
        participants: [
          { id: currentUserId, name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '', image: normalizeImg(user?.profilePicture), userType: userRole, isOnline: true },
          { id: contact.id, name: contact.name, image: normalizeImg(contact.image), userType: 'photographer', isOnline: false },
        ],
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        messages: [],
      };
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(contact.id);
    }
    setShowNewChatModal(false);
    setContactSearchQuery('');
  };

  // Fetch gift amount for topbar
  useEffect(() => {
    if (userRole !== 'client') return;
    (async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/analytics`);
        if (res.ok) {
          const data = await res.json();
          if (data.action === 1 && data.data) {
            setGiftAmount(Number(data.data.gifts) || 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch gift amount:', err);
      }
    })();
  }, [apiUrl, userRole]);

  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/chat/messages/${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        const msgs = data.data || data || [];
        if (Array.isArray(msgs)) {
          setConversations(prev => prev.map(conv =>
            conv.id === partnerId
              ? {
                  ...conv,
                  messages: msgs.map((m: any) => ({
                    id: m.id || '',
                    conversationId: partnerId,
                    senderId: m.senderId || m.sender?.id || '',
                    senderName: m.senderName || m.sender?.name || '',
                    senderImage: normalizeImg(m.senderImage || m.sender?.image),
                    content: m.content || m.message || '',
                    type: (m.type || 'text') as Message['type'],
                    attachments: m.attachments || [],
                    isRead: m.isRead ?? true,
                    createdAt: m.createdAt || m.sentAt || new Date().toISOString(),
                  })),
                }
              : conv
          ));
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [apiUrl]);

  const markAsRead = useCallback(async (partnerId: string) => {
    // Compute the new unread total from the ref (always current, no stale-closure risk)
    // by zeroing out the conversation being read, then dispatch the exact total so the
    // sidebar badge is always accurate regardless of timing.
    const newTotal = conversationsRef.current
      .map(conv => conv.id === partnerId ? { ...conv, unreadCount: 0 } : conv)
      .reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    setConversations(prev => prev.map(conv =>
      conv.id === partnerId ? { ...conv, unreadCount: 0 } : conv
    ));
    window.dispatchEvent(new CustomEvent('inbox:totalCount', { detail: { total: newTotal } }));
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/chat/messages/${partnerId}/read`, { method: 'PATCH' });
      window.dispatchEvent(new Event('badge-update'));
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  }, [apiUrl]);

  const handleSelectConversation = useCallback((convId: string) => {
    setSelectedConversation(convId);
    loadMessages(convId);
    // Always call markAsRead — avoids stale-closure issues where conversations
    // may not be loaded yet when this fires. The API is idempotent.
    markAsRead(convId);
  }, [loadMessages, markAsRead]);

  // Auto-open conversation when redirected from public platform with ?photographerId=
  useEffect(() => {
    if (!urlPhotographerId || selectedConversation) return;
    setSelectedConversation(urlPhotographerId);
    loadMessages(urlPhotographerId);
  }, [urlPhotographerId, selectedConversation, loadMessages]);

  // Poll messages for active conversation to receive edits/new messages from other party
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => {
      loadMessages(selectedConversation);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation, loadMessages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, conversations]);

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== currentUserId);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    if (isSending) return;
    const content = messageInput;
    setMessageInput('');
    setIsSending(true);
    setChatError(null);

    // Optimistic local update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation,
      senderId: currentUserId,
      senderName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '',
      senderImage: normalizeImg(user?.profilePicture),
      content,
      type: 'text',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          messages: [...conv.messages, tempMessage],
          lastMessage: { content, senderId: currentUserId, createdAt: tempMessage.createdAt }
        };
      }
      return conv;
    }));

    try {
      const formData = new FormData();
      formData.append('senderId', currentUserId);
      formData.append('recipientId', selectedConversation);
      formData.append('content', content);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/chat/send`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const result = await res.json();
        const realId = result.data?.id || result.id;
        if (realId) {
          setConversations(prev => prev.map(conv =>
            conv.id === selectedConversation
              ? { ...conv, messages: conv.messages.map(msg => msg.id === tempMessage.id ? { ...msg, id: realId } : msg) }
              : conv
          ));
        }
      } else {
        // Revert optimistic update
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation
            ? { ...conv, messages: conv.messages.filter(msg => msg.id !== tempMessage.id) }
            : conv
        ));
        setMessageInput(content);
        setChatError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, messages: conv.messages.filter(msg => msg.id !== tempMessage.id) }
          : conv
      ));
      setMessageInput(content);
      setChatError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Message action handlers
  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditMessageContent(currentContent);
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editMessageContent.trim() || !selectedConversation) return;

    const msgId = editingMessageId;
    const newContent = editMessageContent;
    const conv = conversations.find(c => c.id === selectedConversation);
    const originalContent = conv?.messages.find(m => m.id === msgId)?.content ?? newContent;
    setEditingMessageId(null);
    setEditMessageContent('');
    setChatError(null);

    // Optimistic update
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConversation) {
        return {
          ...c,
          messages: c.messages.map(msg =>
            msg.id === msgId ? { ...msg, content: newContent } : msg
          )
        };
      }
      return c;
    }));

    try {
      const formData = new FormData();
      formData.append('senderId', currentUserId);
      formData.append('content', newContent);
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/chat/messages/${msgId}`,
        { method: 'PUT', body: formData }
      );
      if (!res.ok) {
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation
            ? { ...c, messages: c.messages.map(msg => msg.id === msgId ? { ...msg, content: originalContent } : msg) }
            : c
        ));
        setChatError('Failed to edit message. Please try again.');
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation
          ? { ...c, messages: c.messages.map(msg => msg.id === msgId ? { ...msg, content: originalContent } : msg) }
          : c
      ));
      setChatError('Failed to edit message. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedConversation) return;

    const conv = conversations.find(c => c.id === selectedConversation);
    const deletedMessage = conv?.messages.find(m => m.id === messageId);
    setChatError(null);

    // Optimistic update
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConversation) {
        const updatedMessages = c.messages.filter(msg => msg.id !== messageId);
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        return {
          ...c,
          messages: updatedMessages,
          lastMessage: lastMsg ? { content: lastMsg.content, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt } : undefined
        };
      }
      return c;
    }));

    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/chat/messages/${messageId}`, { method: 'DELETE' });
      if (!res.ok && deletedMessage) {
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation
            ? { ...c, messages: [...c.messages, deletedMessage].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) }
            : c
        ));
        setChatError('Failed to delete message. Please try again.');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      if (deletedMessage) {
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation
            ? { ...c, messages: [...c.messages, deletedMessage].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) }
            : c
        ));
      }
      setChatError('Failed to delete message. Please try again.');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    const matchesSearch = searchQuery === '' || other?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'unread') return matchesSearch && conv.unreadCount > 0;
    return matchesSearch;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-inbox-container {
            margin: 0 !important;
          }
          .mobile-conversations-list {
            width: 100% !important;
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-top: none !important;
          }
          .mobile-conversations-list.mobile-chat-active {
            display: none !important;
          }
          .mobile-topbar {
            display: block;
          }
          .mobile-topbar.mobile-chat-active {
            display: none !important;
          }
          .mobile-chat-area {
            display: none !important;
            width: 100% !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .mobile-chat-area.mobile-chat-active {
            display: flex !important;
          }
          .mobile-conversations-list-header {
            padding: 1.25rem 1rem !important;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.05) 0%, rgba(8, 58, 133, 0.02) 100%) !important;
            border-bottom: 2px solid rgba(8, 58, 133, 0.1) !important;
          }
          .mobile-conversations-list-header h1 {
            font-size: 1.3rem !important;
            font-weight: 700 !important;
          }
          .mobile-filter-tabs {
            margin-top: 1rem !important;
          }
          .mobile-filter-tabs button {
            border-radius: 0.5rem !important;
            transition: all 0.2s ease !important;
          }
          .mobile-messages-area {
            padding: 1.5rem 1rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-message-input-container {
            padding: 1rem !important;
            padding-bottom: 5rem !important;
            background: rgba(8, 58, 133, 0.02) !important;
            border-top: 2px solid rgba(8, 58, 133, 0.1) !important;
          }
          .mobile-message-input-container input {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            border: 2px solid rgba(8, 58, 133, 0.15) !important;
          }
          .mobile-message-input-container textarea {
            font-size: 0.9rem !important;
            padding: 0.625rem !important;
          }
          .mobile-back-button {
            display: flex !important;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(8, 58, 133, 0.1);
            border: none;
            border-radius: 0.5rem;
            color: #083A85;
            font-weight: 600;
            cursor: pointer;
            margin-right: 0.5rem;
            transition: all 0.2s ease;
          }
          .mobile-back-button:active {
            transform: scale(0.95);
            background: rgba(8, 58, 133, 0.15);
          }
          .mobile-conversation-item {
            border-radius: 0.75rem !important;
            margin: 0.5rem 0.75rem !important;
            border: 1px solid rgba(8, 58, 133, 0.1) !important;
            transition: all 0.2s ease !important;
          }
          .mobile-conversation-item:active {
            transform: scale(0.98);
          }
        }
        @media (max-width: 640px) {
          .mobile-conversations-list-header h1 {
            font-size: 1.15rem !important;
          }
          .mobile-filter-tabs button {
            font-size: 0.75rem !important;
            padding: 0.5rem 0.75rem !important;
            min-height: 36px !important;
          }
          .mobile-messages-area {
            padding: 1rem 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-message-input-container {
            padding: 0.75rem !important;
            padding-bottom: 7rem !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-back-button {
            display: none !important;
          }
        }
      `}</style>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className={`mobile-topbar ${selectedConversation ? 'mobile-chat-active' : ''}`}>
          <Topbar userRole={userRole} />
        </div>
        <div className="mobile-inbox-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', margin: '0 1.25rem 1rem 1.25rem' }}>

          {/* Conversations List */}
          <div className={`mobile-conversations-list ${selectedConversation ? 'mobile-chat-active' : ''}`} style={{
            width: '340px',
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem 0 0 0.75rem',
            border: '1px solid #D1D5DB',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div className="mobile-conversations-list-header" style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Messages</h1>
                <button
                  onClick={() => { setShowNewChatModal(true); setContactSearchQuery(''); fetchContacts(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    border: '2px solid #062a63',
                    borderRadius: '0.375rem',
                    backgroundColor: '#083A85',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Chat
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem 0.625rem 2.5rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filter Tabs */}
              <div className="mobile-filter-tabs" style={{ display: 'flex', gap: '0.25rem' }}>
                {(['all', 'unread', 'pinned'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      backgroundColor: activeFilter === filter ? '#083A85' : 'transparent',
                      color: activeFilter === filter ? 'white' : '#6B7280',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', color: colors.textSecondary }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '0.75rem' }}>
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    {searchQuery || activeFilter !== 'all' ? 'No conversations match your filter' : 'No conversations yet. Start a new chat!'}
                  </p>
                </div>
              )}
              {filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="mobile-conversation-item"
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedConversation === conv.id
                        ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF')
                        : conv.unreadCount > 0
                          ? (actualTheme === 'dark' ? '#162032' : '#F5F9FF')
                          : colors.bgCard,
                      borderBottom: `2px solid ${colors.borderPrimary}`,
                      borderLeft: conv.unreadCount > 0 && selectedConversation !== conv.id
                        ? '3px solid #F20C8F'
                        : '3px solid transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {other.image ? (
                          <img
                            src={other.image}
                            alt={other.name}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }}
                          />
                        ) : null}
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', display: other.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>
                          {other.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </div>
                      {other.isOnline && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#10B981',
                          borderRadius: '50%',
                          border: '2px solid white'
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: conv.unreadCount > 0 ? '600' : '500', color: colors.textPrimary }}>
                            {other.name}
                          </span>
                          {conv.isPinned && <PinIcon />}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                          {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                          fontSize: '0.85rem',
                          color: conv.unreadCount > 0 ? colors.textPrimary : colors.textSecondary,
                          fontWeight: conv.unreadCount > 0 ? '500' : '400',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px'
                        }}>
                          {conv.lastMessage?.senderId === currentUserId && 'You: '}
                          {conv.lastMessage?.content}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span style={{
                            backgroundColor: '#F20C8F',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '9999px',
                            minWidth: '18px',
                            textAlign: 'center'
                          }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`mobile-chat-area ${selectedConversation ? 'mobile-chat-active' : ''}`} style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: '0 0.75rem 0.75rem 0',
            border: `2px solid ${colors.borderPrimary}`,
            borderLeft: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {selectedConv && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderBottom: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="mobile-back-button"
                      style={{ display: 'none' }}
                    >
                      ← Back
                    </button>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {otherParticipant.image ? (
                          <img
                            src={otherParticipant.image}
                            alt={otherParticipant.name}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }}
                          />
                        ) : null}
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', display: otherParticipant.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem', fontWeight: 700 }}>
                          {otherParticipant.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </div>
                      {otherParticipant.isOnline && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '10px',
                          height: '10px',
                          backgroundColor: '#10B981',
                          borderRadius: '50%',
                          border: '2px solid white'
                        }} />
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>{otherParticipant.name}</h2>
                      <span style={{ fontSize: '0.8rem', color: otherParticipant.isOnline ? '#10B981' : colors.textSecondary }}>
                        {otherParticipant.isOnline ? 'Online' : `Last seen ${otherParticipant.lastSeen}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="mobile-messages-area" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', backgroundColor: colors.bgTertiary }}>
                  {selectedConv.messages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const showAvatar = index === 0 || selectedConv.messages[index - 1].senderId !== message.senderId;
                    const isEditing = editingMessageId === message.id;

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          marginBottom: '0.75rem'
                        }}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '70%', position: 'relative' }}>
                          {!isOwn && showAvatar && (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              alignSelf: 'flex-end',
                              flexShrink: 0
                            }}>
                              {message.senderImage ? (
                                <img
                                  src={message.senderImage}
                                  alt={message.senderName}
                                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }}
                                />
                              ) : null}
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', display: message.senderImage ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                                {message.senderName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            </div>
                          )}
                          {!isOwn && !showAvatar && <div style={{ width: '32px' }} />}

                          {/* Message Actions - Left side for own messages */}
                          {isOwn && hoveredMessageId === message.id && !isEditing && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              alignSelf: 'center'
                            }}>
                              <button
                                onClick={() => handleEditMessage(message.id, message.content)}
                                style={{
                                  padding: '0.375rem',
                                  backgroundColor: colors.bgCard,
                                  border: `2px solid ${colors.borderPrimary}`,
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: colors.textSecondary,
                                  transition: 'all 0.2s'
                                }}
                                title="Edit message"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                style={{
                                  padding: '0.375rem',
                                  backgroundColor: colors.bgCard,
                                  border: `2px solid ${colors.borderPrimary}`,
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
                                  transition: 'all 0.2s'
                                }}
                                title="Delete message"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          )}

                          <div>
                            {isEditing ? (
                              <div style={{
                                backgroundColor: colors.bgCard,
                                border: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                                borderRadius: '0.75rem',
                                padding: '0.75rem',
                                minWidth: '250px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                              }}>
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                                  fontWeight: '600',
                                  marginBottom: '0.375rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  Edit Message
                                </div>
                                <input
                                  type="text"
                                  value={editMessageContent}
                                  onChange={(e) => setEditMessageContent(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && saveEditedMessage()}
                                  style={{
                                    width: '100%',
                                    padding: '0.625rem 0.75rem',
                                    border: `2px solid ${colors.borderPrimary}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    marginBottom: '0.625rem',
                                    color: colors.textPrimary,
                                    backgroundColor: colors.bgPrimary
                                  }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={cancelEdit}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      backgroundColor: colors.bgTertiary,
                                      border: `2px solid ${colors.borderPrimary}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.8rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      color: colors.textSecondary
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={saveEditedMessage}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      backgroundColor: '#083A85',
                                      border: '2px solid #062a63',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.8rem',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      color: 'white'
                                    }}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                backgroundColor: isOwn ? '#083A85' : colors.bgCard,
                                color: isOwn ? 'white' : colors.textPrimary,
                                padding: '0.75rem 1rem',
                                borderRadius: isOwn ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                                boxShadow: colors.shadowSm,
                                border: isOwn ? 'none' : `2px solid ${colors.borderPrimary}`
                              }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{message.content}</p>
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              gap: '0.25rem',
                              marginTop: '0.25rem'
                            }}>
                              <span style={{ fontSize: '0.7rem', color: colors.textSecondary }}>{formatMessageTime(message.createdAt)}</span>
                              {isOwn && (message.isRead ? <CheckDoubleIcon /> : <CheckIcon />)}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="mobile-message-input-container" style={{ padding: '1rem 1.25rem', borderTop: `2px solid ${colors.borderPrimary}`, position: 'relative' }}>
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '1rem',
                        backgroundColor: colors.bgCard,
                        borderRadius: '0.75rem',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                        width: '320px',
                        height: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        marginBottom: '0.5rem',
                        border: '2px solid #D1D5DB'
                      }}
                    >
                      {/* Category Tabs */}
                      <div
                        style={{
                          display: 'flex',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          borderBottom: '2px solid #E5E7EB',
                          padding: '0.5rem',
                          gap: '0.375rem',
                          scrollbarWidth: 'thin',
                          backgroundColor: colors.bgPrimary,
                          flexShrink: 0,
                          WebkitOverflowScrolling: 'touch',
                          msOverflowStyle: 'none',
                          scrollBehavior: 'smooth'
                        }}
                        className="emoji-tabs-scroll"
                      >
                        {Object.keys(emojiCategories).map((category) => (
                          <button
                            key={category}
                            onClick={() => setActiveEmojiCategory(category)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              border: `2px solid ${activeEmojiCategory === category ? '#083A85' : colors.borderPrimary}`,
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              backgroundColor: activeEmojiCategory === category ? '#083A85' : colors.bgCard,
                              color: activeEmojiCategory === category ? 'white' : colors.textSecondary,
                              whiteSpace: 'nowrap',
                              transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
                              flexShrink: 0,
                              boxSizing: 'border-box'
                            }}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      {/* Emoji Grid */}
                      <div style={{
                        padding: '0.75rem',
                        overflowY: 'auto',
                        flex: 1,
                        minHeight: 0
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 1fr)',
                          gap: '0.25rem'
                        }}>
                          {emojiCategories[activeEmojiCategory as keyof typeof emojiCategories].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => insertEmoji(emoji)}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                fontSize: '1.5rem',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgTertiary}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem',
                      color: '#DC2626',
                    }}>
                      <span>{chatError}</span>
                      <button onClick={() => setChatError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1rem', lineHeight: 1, padding: '0 0.25rem' }}>✕</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgTertiary}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <EmojiIcon />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        border: `2px solid ${colors.borderPrimary}`,
                        borderRadius: '9999px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || isSending}
                      style={{
                        backgroundColor: messageInput.trim() && !isSending ? '#083A85' : '#D1D5DB',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: messageInput.trim() && !isSending ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textSecondary
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.5rem' }}>Select a conversation</h3>
                <p style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Choose a conversation from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div
          onClick={() => setShowNewChatModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: `2px solid ${colors.borderPrimary}`,
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>New Chat</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: colors.textSecondary,
                  fontSize: '1.25rem',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: `1px solid ${colors.borderPrimary}` }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: `2px solid ${colors.borderPrimary}`,
                backgroundColor: colors.bgTertiary,
              }}>
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                  }}
                />
              </div>
            </div>

            {/* Contact List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
              {isLoadingContacts ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                  <span style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Loading contacts...</span>
                </div>
              ) : contacts.filter(c =>
                c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                (c.speciality || '').toLowerCase().includes(contactSearchQuery.toLowerCase())
              ).length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '0.75rem' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                    {contactSearchQuery ? 'No contacts match your search' : 'No booked photographers found'}
                  </span>
                </div>
              ) : (
                contacts
                  .filter(c =>
                    c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                    (c.speciality || '').toLowerCase().includes(contactSearchQuery.toLowerCase())
                  )
                  .map((contact) => {
                    const alreadyHasConvo = conversations.some(conv => conv.participants.some(p => p.id === contact.id));
                    return (
                      <button
                        key={contact.id}
                        onClick={() => startConversation(contact)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.625rem 1.25rem',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgTertiary)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Avatar */}
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                          </svg>
                          {contact.image && (
                            <img src={contact.image} alt={contact.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                        </div>

                        {/* Name + Speciality */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {contact.name}
                          </div>
                          {contact.speciality && (
                            <div style={{ fontSize: '0.78rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {contact.speciality}
                            </div>
                          )}
                        </div>

                        {/* Existing conversation indicator */}
                        {alreadyHasConvo && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#3B82F6',
                            backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontWeight: '500',
                            flexShrink: 0,
                          }}>
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
