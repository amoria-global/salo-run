"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

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

const AttachmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59718 21.9983 8.005 21.9983C6.41282 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42975 14.0991 2.00846 15.16 2.00846C16.2209 2.00846 17.2394 2.42975 17.99 3.18C18.7403 3.93063 19.1615 4.94905 19.1615 6.01C19.1615 7.07095 18.7403 8.08938 17.99 8.84L9.41 17.41C9.03472 17.7853 8.52573 17.996 7.995 17.996C7.46427 17.996 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99398 16.5257 5.99398 15.995C5.99398 15.4643 6.20472 14.9553 6.58 14.58L14.54 6.63" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="#6B7280"/>
    <path d="M21 15L16 10L5 21" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="1" fill="#6B7280"/>
    <circle cx="12" cy="12" r="1" fill="#6B7280"/>
    <circle cx="12" cy="19" r="1" fill="#6B7280"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1469 21.5901 20.9046 21.7335 20.6408 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5342 11.19 18.85C8.77383 17.3147 6.72534 15.2662 5.19 12.85C3.49998 10.2412 2.44824 7.27099 2.12 4.18C2.09501 3.90347 2.12788 3.62476 2.2165 3.36162C2.30513 3.09849 2.44757 2.85669 2.63477 2.65162C2.82196 2.44655 3.04981 2.28271 3.30379 2.17052C3.55778 2.05833 3.83234 2.00026 4.11 2H7.11C7.59531 1.99522 8.06579 2.16708 8.43376 2.48354C8.80173 2.79999 9.04208 3.23945 9.11 3.72C9.23662 4.68007 9.47145 5.62273 9.81 6.53C9.94455 6.88792 9.97366 7.27691 9.89391 7.65088C9.81415 8.02485 9.62886 8.36811 9.36 8.64L8.09 9.91C9.51356 12.4136 11.5864 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9752 14.1859 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 7L16 12L23 17V7Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="5" width="15" height="14" rx="2" stroke="#6B7280" strokeWidth="2"/>
  </svg>
);

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

const InboxPage = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = 'current-user';

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      participants: [
        { id: '1', name: 'John Studio', image: 'https://randomuser.me/api/portraits/men/75.jpg', userType: 'photographer', isOnline: true },
        { id: currentUserId, name: 'Diane Mary', image: 'https://randomuser.me/api/portraits/women/65.jpg', userType: 'client', isOnline: true }
      ],
      lastMessage: { content: 'Great! I\'ll have the photos ready by Friday.', senderId: '1', createdAt: '2025-07-19T14:30:00' },
      unreadCount: 2,
      isPinned: true,
      isMuted: false,
      bookingId: 'BK-001',
      messages: [
        { id: 'm1', conversationId: '1', senderId: '1', senderName: 'John Studio', senderImage: 'https://randomuser.me/api/portraits/men/75.jpg', content: 'Hi Diane! Thank you for booking with me for your wedding photos.', type: 'text', isRead: true, createdAt: '2025-07-19T10:00:00' },
        { id: 'm2', conversationId: '1', senderId: currentUserId, senderName: 'Diane Mary', senderImage: 'https://randomuser.me/api/portraits/women/65.jpg', content: 'Hi John! We\'re so excited to work with you. The venue is confirmed for July 20th.', type: 'text', isRead: true, createdAt: '2025-07-19T10:15:00' },
        { id: 'm3', conversationId: '1', senderId: '1', senderName: 'John Studio', senderImage: 'https://randomuser.me/api/portraits/men/75.jpg', content: 'Perfect! I\'ll be there at 2 PM to set up. Is there anything specific you\'d like me to capture?', type: 'text', isRead: true, createdAt: '2025-07-19T10:30:00' },
        { id: 'm4', conversationId: '1', senderId: currentUserId, senderName: 'Diane Mary', senderImage: 'https://randomuser.me/api/portraits/women/65.jpg', content: 'Yes! We want lots of candid shots and definitely the first dance. Can you also do a few formal family portraits?', type: 'text', isRead: true, createdAt: '2025-07-19T11:00:00' },
        { id: 'm5', conversationId: '1', senderId: '1', senderName: 'John Studio', senderImage: 'https://randomuser.me/api/portraits/men/75.jpg', content: 'Absolutely! I\'ll prepare a shot list. When can we expect the photos?', type: 'text', isRead: false, createdAt: '2025-07-19T14:00:00' },
        { id: 'm6', conversationId: '1', senderId: '1', senderName: 'John Studio', senderImage: 'https://randomuser.me/api/portraits/men/75.jpg', content: 'Great! I\'ll have the photos ready by Friday.', type: 'text', isRead: false, createdAt: '2025-07-19T14:30:00' }
      ]
    },
    {
      id: '2',
      participants: [
        { id: '2', name: 'Mary Shots', image: 'https://randomuser.me/api/portraits/women/68.jpg', userType: 'photographer', isOnline: false, lastSeen: '2 hours ago' },
        { id: currentUserId, name: 'Diane Mary', image: 'https://randomuser.me/api/portraits/women/65.jpg', userType: 'client', isOnline: true }
      ],
      lastMessage: { content: 'The birthday party photos are uploaded to your gallery!', senderId: '2', createdAt: '2025-07-18T16:45:00' },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm7', conversationId: '2', senderId: '2', senderName: 'Mary Shots', senderImage: 'https://randomuser.me/api/portraits/women/68.jpg', content: 'Hi! Your birthday party was so much fun to photograph!', type: 'text', isRead: true, createdAt: '2025-07-18T14:00:00' },
        { id: 'm8', conversationId: '2', senderId: currentUserId, senderName: 'Diane Mary', senderImage: 'https://randomuser.me/api/portraits/women/65.jpg', content: 'Thank you Mary! When can I see the photos?', type: 'text', isRead: true, createdAt: '2025-07-18T15:00:00' },
        { id: 'm9', conversationId: '2', senderId: '2', senderName: 'Mary Shots', senderImage: 'https://randomuser.me/api/portraits/women/68.jpg', content: 'The birthday party photos are uploaded to your gallery!', type: 'text', isRead: true, createdAt: '2025-07-18T16:45:00' }
      ]
    },
    {
      id: '3',
      participants: [
        { id: '3', name: 'Alex Frames', image: 'https://randomuser.me/api/portraits/men/44.jpg', userType: 'photographer', isOnline: true },
        { id: currentUserId, name: 'Diane Mary', image: 'https://randomuser.me/api/portraits/women/65.jpg', userType: 'client', isOnline: true }
      ],
      lastMessage: { content: 'I\'d love to discuss the festival shoot!', senderId: currentUserId, createdAt: '2025-07-17T09:30:00' },
      unreadCount: 1,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm10', conversationId: '3', senderId: currentUserId, senderName: 'Diane Mary', senderImage: 'https://randomuser.me/api/portraits/women/65.jpg', content: 'Hi Alex! I saw your festival photography work and it\'s amazing!', type: 'text', isRead: true, createdAt: '2025-07-16T18:00:00' },
        { id: 'm11', conversationId: '3', senderId: '3', senderName: 'Alex Frames', senderImage: 'https://randomuser.me/api/portraits/men/44.jpg', content: 'Thank you so much! I really enjoy capturing the energy of live events.', type: 'text', isRead: false, createdAt: '2025-07-17T08:00:00' },
        { id: 'm12', conversationId: '3', senderId: currentUserId, senderName: 'Diane Mary', senderImage: 'https://randomuser.me/api/portraits/women/65.jpg', content: 'I\'d love to discuss the festival shoot!', type: 'text', isRead: true, createdAt: '2025-07-17T09:30:00' }
      ]
    },
    {
      id: '4',
      participants: [
        { id: '4', name: 'Elite Photography', image: 'https://randomuser.me/api/portraits/men/22.jpg', userType: 'photographer', isOnline: false, lastSeen: '1 day ago' },
        { id: currentUserId, name: 'Diane Mary', image: 'https://randomuser.me/api/portraits/women/65.jpg', userType: 'client', isOnline: true }
      ],
      lastMessage: { content: 'Your corporate headshots are scheduled for next Monday.', senderId: '4', createdAt: '2025-07-15T11:20:00' },
      unreadCount: 0,
      isPinned: true,
      isMuted: true,
      bookingId: 'BK-002',
      messages: [
        { id: 'm13', conversationId: '4', senderId: '4', senderName: 'Elite Photography', senderImage: 'https://randomuser.me/api/portraits/men/22.jpg', content: 'Hello! Confirming your booking for corporate headshots.', type: 'text', isRead: true, createdAt: '2025-07-14T10:00:00' },
        { id: 'm14', conversationId: '4', senderId: currentUserId, senderName: 'Diane Mary', senderImage: 'https://randomuser.me/api/portraits/women/65.jpg', content: 'Great! What time should we be there?', type: 'text', isRead: true, createdAt: '2025-07-14T14:00:00' },
        { id: 'm15', conversationId: '4', senderId: '4', senderName: 'Elite Photography', senderImage: 'https://randomuser.me/api/portraits/men/22.jpg', content: 'Your corporate headshots are scheduled for next Monday.', type: 'text', isRead: true, createdAt: '2025-07-15T11:20:00' }
      ]
    }
  ]);

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

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: selectedConversation,
      senderId: currentUserId,
      senderName: 'Diane Mary',
      senderImage: 'https://randomuser.me/api/portraits/women/65.jpg',
      content: messageInput,
      type: 'text',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: { content: messageInput, senderId: currentUserId, createdAt: newMessage.createdAt }
        };
      }
      return conv;
    }));

    setMessageInput('');
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    const matchesSearch = searchQuery === '' || other?.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'unread') return matchesSearch && conv.unreadCount > 0;
    if (activeFilter === 'pinned') return matchesSearch && conv.isPinned;
    return matchesSearch;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="client" giftAmount={225.00} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', margin: '0 1.25rem 1rem 1.25rem' }}>

          {/* Conversations List */}
          <div style={{
            width: '340px',
            backgroundColor: 'white',
            borderRadius: '0.75rem 0 0 0.75rem',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Messages</h1>

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
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#F9FAFB',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
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
              {filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedConversation === conv.id ? '#EFF6FF' : 'white',
                      borderBottom: '1px solid #F3F4F6',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={other.image}
                        alt={other.name}
                        width={48}
                        height={48}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
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
                          <span style={{ fontSize: '0.95rem', fontWeight: conv.unreadCount > 0 ? '600' : '500', color: '#111827' }}>
                            {other.name}
                          </span>
                          {conv.isPinned && <PinIcon />}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                          fontSize: '0.85rem',
                          color: conv.unreadCount > 0 ? '#374151' : '#6B7280',
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
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '0 0.75rem 0.75rem 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {selectedConv && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #E5E7EB'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={otherParticipant.image}
                        alt={otherParticipant.name}
                        width={44}
                        height={44}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
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
                      <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>{otherParticipant.name}</h2>
                      <span style={{ fontSize: '0.8rem', color: otherParticipant.isOnline ? '#10B981' : '#6B7280' }}>
                        {otherParticipant.isOnline ? 'Online' : `Last seen ${otherParticipant.lastSeen}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                      <PhoneIcon />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                      <VideoIcon />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                      <MoreIcon />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', backgroundColor: '#F9FAFB' }}>
                  {selectedConv.messages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const showAvatar = index === 0 || selectedConv.messages[index - 1].senderId !== message.senderId;

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '70%' }}>
                          {!isOwn && showAvatar && (
                            <Image
                              src={message.senderImage}
                              alt={message.senderName}
                              width={32}
                              height={32}
                              style={{ borderRadius: '50%', objectFit: 'cover', alignSelf: 'flex-end' }}
                            />
                          )}
                          {!isOwn && !showAvatar && <div style={{ width: '32px' }} />}
                          <div>
                            <div style={{
                              backgroundColor: isOwn ? '#083A85' : 'white',
                              color: isOwn ? 'white' : '#111827',
                              padding: '0.75rem 1rem',
                              borderRadius: isOwn ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}>
                              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{message.content}</p>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              gap: '0.25rem',
                              marginTop: '0.25rem'
                            }}>
                              <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{formatMessageTime(message.createdAt)}</span>
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
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                      <AttachmentIcon />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                      <ImageIcon />
                    </button>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid #E5E7EB',
                          borderRadius: '9999px',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: '#F9FAFB'
                        }}
                      />
                      <button style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}>
                        <EmojiIcon />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      style={{
                        backgroundColor: messageInput.trim() ? '#083A85' : '#D1D5DB',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
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
                color: '#6B7280'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#F3F4F6',
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Select a conversation</h3>
                <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Choose a conversation from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
