'use client';

// app/pages/client/inbox.tsx's behaviour, moved verbatim into a hook so the classic page and the Compact Glass page share one source
// of truth (no behaviour change).
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDashboardAuth, dashboardAuthFetch } from '@/app/providers/AuthProvider';
import { getApiUrl } from '@/lib/api';
import { checkMessageContent, checkMessageWithHistory } from '@/lib/messageFilter';
import { normalizeImg } from '@/app/components/chat/chatData';

export interface Participant {
  id: string;
  name: string;
  image: string;
  userType: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'booking_request' | 'system' | 'removed' | 'album_share';
  /** Compact Glass only: an own message still on its way, or one that failed and can be retried. */
  status?: 'sending' | 'failed';
  albumShare?: { albumIds: string[]; note?: string };
  attachments?: { type: string; url: string; name: string; size: number }[];
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: {
    content: string;
    type?: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  bookingId?: string;
  messages: Message[];
}


/** keepFailedBubble (Compact Glass): a message that fails to send stays in the thread, marked failed, with Retry;
  the classic page removes it and puts the text back in the field. */
export interface InboxOptions { keepFailedBubble?: boolean }

export function useClientInbox(userRole: 'client' | 'event-coordinator' = 'client', opts: InboxOptions = {}) {
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
  const [contentWarning, setContentWarning] = useState<string | null>(null);
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
  // Compact Glass states (the classic page never showed them): first list load done, list failed, threads loaded once.
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [conversationsError, setConversationsError] = useState(false);
  const [loadedThreads, setLoadedThreads] = useState<string[]>([]);
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
      setConversationsError(!res.ok);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversationsError(true);
    } finally {
      setConversationsLoaded(true);
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
      // Create a local conversation shell. the backend will create it on first message
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
                    albumShare: m.albumShare && Array.isArray(m.albumShare.albumIds) ? { albumIds: m.albumShare.albumIds.map(String), note: m.albumShare.note || undefined } : undefined,
                    attachments: m.attachments || [],
                    isRead: m.isRead ?? true,
                    createdAt: m.createdAt || m.sentAt || new Date().toISOString(),
                  })).concat((opts.keepFailedBubble ? conv.messages.filter(x => x.status === 'failed') : []) as never[]),
                }
              : conv
          ));
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadedThreads(prev => prev.includes(partnerId) ? prev : [...prev, partnerId]);
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
    // Always call markAsRead. avoids stale-closure issues where conversations
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
    const conv = conversations.find(c => c.id === selectedConversation);
    const recentMsgs = (conv?.messages || []).map(m => ({ content: m.content, senderId: m.senderId }));
    const filterResult = checkMessageWithHistory(messageInput, recentMsgs, currentUserId);
    if (filterResult.blocked) {
      setContentWarning(filterResult.reason);
      return;
    }
    setContentWarning(null);
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
      createdAt: new Date().toISOString(),
      ...(opts.keepFailedBubble ? { status: 'sending' as const } : {}),
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
              ? { ...conv, messages: conv.messages.map(msg => msg.id === tempMessage.id ? { ...msg, id: realId, status: undefined } : msg) }
              : conv
          ));
        }
      } else {
        // Revert optimistic update
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation
            ? { ...conv, messages: opts.keepFailedBubble ? conv.messages.map(msg => msg.id === tempMessage.id ? { ...msg, status: 'failed' as const } : msg) : conv.messages.filter(msg => msg.id !== tempMessage.id) }
            : conv
        ));
        if (!opts.keepFailedBubble) setMessageInput(content);
        setChatError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, messages: opts.keepFailedBubble ? conv.messages.map(msg => msg.id === tempMessage.id ? { ...msg, status: 'failed' as const } : msg) : conv.messages.filter(msg => msg.id !== tempMessage.id) }
          : conv
      ));
      if (!opts.keepFailedBubble) setMessageInput(content);
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
    const editFilterResult = checkMessageContent(editMessageContent);
    if (editFilterResult.blocked) {
      setContentWarning(editFilterResult.reason);
      return;
    }
    setContentWarning(null);

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
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/chat/messages/${msgId}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: currentUserId, content: newContent }) }
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
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/chat/messages/${messageId}?senderId=${currentUserId}`, { method: 'DELETE' });
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


  /** Compact Glass: send a failed bubble again, in place. */
  const retryMessage = async (tempId: string) => {
    const convId = selectedConversation;
    const msg = conversations.find(c => c.id === convId)?.messages.find(m => m.id === tempId);
    if (!convId || !msg) return;
    const mark = (patch: Partial<Message>) => setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...m, ...patch } : m) } : c));
    mark({ status: 'sending' });
    setChatError(null);
    try {
      const formData = new FormData();
      formData.append('senderId', currentUserId);
      formData.append('recipientId', convId);
      formData.append('content', msg.content);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/chat/send`, { method: 'POST', body: formData });
      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        mark({ id: result.data?.id || result.id || tempId, status: undefined });
      } else {
        const data = await res.json().catch(() => ({}));
        setChatError(data.message || 'Failed to send message. Please try again.');
        mark({ status: 'failed' });
      }
    } catch {
      setChatError('Failed to send message. Please try again.');
      mark({ status: 'failed' });
    }
  };

  return {
    conversationsLoaded,
    conversationsError,
    loadedThreads,
    retryMessage,
    user,
    searchParams,
    urlPhotographerId,
    selectedConversation,
    setSelectedConversation,
    searchQuery,
    setSearchQuery,
    messageInput,
    setMessageInput,
    activeFilter,
    setActiveFilter,
    showEmojiPicker,
    setShowEmojiPicker,
    activeEmojiCategory,
    setActiveEmojiCategory,
    messagesEndRef,
    emojiPickerRef,
    hoveredMessageId,
    setHoveredMessageId,
    editingMessageId,
    setEditingMessageId,
    editMessageContent,
    setEditMessageContent,
    isSending,
    setIsSending,
    chatError,
    setChatError,
    contentWarning,
    setContentWarning,
    conversationsRef,
    insertEmoji,
    currentUserId,
    apiUrl,
    conversations,
    setConversations,
    giftAmount,
    setGiftAmount,
    showNewChatModal,
    setShowNewChatModal,
    contacts,
    setContacts,
    isLoadingContacts,
    setIsLoadingContacts,
    contactSearchQuery,
    setContactSearchQuery,
    fetchConversations,
    fetchContacts,
    startConversation,
    loadMessages,
    markAsRead,
    handleSelectConversation,
    getOtherParticipant,
    formatTime,
    formatMessageTime,
    sendMessage,
    handleEditMessage,
    saveEditedMessage,
    cancelEdit,
    handleDeleteMessage,
    filteredConversations,
    selectedConv,
    otherParticipant,
  };
}

export type ClientInboxController = ReturnType<typeof useClientInbox>;
