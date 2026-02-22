"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';

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

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="1" fill="#6B7280"/>
    <circle cx="19" cy="12" r="1" fill="#6B7280"/>
    <circle cx="5" cy="12" r="1" fill="#6B7280"/>
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
  const { colors, actualTheme } = useTheme();
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

  const currentUserId = 'current-user';

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      participants: [
        { id: '1', name: 'Sarah Johnson', image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', userType: 'client', isOnline: true },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'Thank you for the beautiful photos!', senderId: '1', createdAt: '2025-07-19T14:30:00' },
      unreadCount: 2,
      isPinned: true,
      isMuted: false,
      bookingId: 'BK-001',
      messages: [
        { id: 'm1', conversationId: '1', senderId: '1', senderName: 'Sarah Johnson', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'Hi! I would like to book a wedding photoshoot', type: 'text', isRead: true, createdAt: '2025-07-19T10:00:00' },
        { id: 'm2', conversationId: '1', senderId: currentUserId, senderName: 'John Studio', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Hello Sarah! I would be happy to help. When is your wedding date?', type: 'text', isRead: true, createdAt: '2025-07-19T10:15:00' },
        { id: 'm3', conversationId: '1', senderId: '1', senderName: 'Sarah Johnson', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'It is on June 15th, 2025. Do you have availability?', type: 'text', isRead: true, createdAt: '2025-07-19T10:30:00' },
        { id: 'm4', conversationId: '1', senderId: currentUserId, senderName: 'John Studio', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Yes, I am available on that date! Let me send you my wedding packages.', type: 'text', isRead: true, createdAt: '2025-07-19T11:00:00' },
        { id: 'm5', conversationId: '1', senderId: '1', senderName: 'Sarah Johnson', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'That sounds great! When can we expect the photos?', type: 'text', isRead: false, createdAt: '2025-07-19T14:00:00' },
        { id: 'm6', conversationId: '1', senderId: '1', senderName: 'Sarah Johnson', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'Thank you for the beautiful photos!', type: 'text', isRead: false, createdAt: '2025-07-19T14:30:00' }
      ]
    },
    {
      id: '2',
      participants: [
        { id: '2', name: 'Michael Chen', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'client', isOnline: false, lastSeen: '2 hours ago' },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'When can we schedule the portrait session?', senderId: '2', createdAt: '2025-07-18T16:45:00' },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm7', conversationId: '2', senderId: '2', senderName: 'Michael Chen', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Hello, I saw your portfolio and I am interested in a corporate portrait session', type: 'text', isRead: true, createdAt: '2025-07-18T14:00:00' },
        { id: 'm8', conversationId: '2', senderId: currentUserId, senderName: 'John Studio', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Thank you for reaching out! I would love to work with you. What type of corporate portraits are you looking for?', type: 'text', isRead: true, createdAt: '2025-07-18T15:00:00' },
        { id: 'm9', conversationId: '2', senderId: '2', senderName: 'Michael Chen', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'When can we schedule the portrait session?', type: 'text', isRead: true, createdAt: '2025-07-18T16:45:00' }
      ]
    },
    {
      id: '3',
      participants: [
        { id: '3', name: 'Emily Rodriguez', image: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg', userType: 'client', isOnline: true },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'I received the edited photos. They look amazing!', senderId: '3', createdAt: '2025-07-17T09:30:00' },
      unreadCount: 1,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm10', conversationId: '3', senderId: currentUserId, senderName: 'John Studio', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Hi Emily! Your edited photos are ready. I have sent them to your email.', type: 'text', isRead: true, createdAt: '2025-07-16T18:00:00' },
        { id: 'm11', conversationId: '3', senderId: '3', senderName: 'Emily Rodriguez', senderImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg', content: 'I received the edited photos. They look amazing!', type: 'text', isRead: false, createdAt: '2025-07-17T09:30:00' }
      ]
    },
    {
      id: '4',
      participants: [
        { id: '4', name: 'David Park', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'client', isOnline: false, lastSeen: '1 day ago' },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'Can you also do video coverage?', senderId: '4', createdAt: '2025-07-15T11:20:00' },
      unreadCount: 0,
      isPinned: true,
      isMuted: true,
      bookingId: 'BK-002',
      messages: [
        { id: 'm13', conversationId: '4', senderId: '4', senderName: 'David Park', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Hi! I need photography for my product launch event in Seattle', type: 'text', isRead: true, createdAt: '2025-07-14T10:00:00' },
        { id: 'm14', conversationId: '4', senderId: currentUserId, senderName: 'John Studio', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Hello David! I would be glad to cover your event. Can you tell me more about it?', type: 'text', isRead: true, createdAt: '2025-07-14T14:00:00' },
        { id: 'm15', conversationId: '4', senderId: '4', senderName: 'David Park', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Can you also do video coverage?', type: 'text', isRead: true, createdAt: '2025-07-15T11:20:00' }
      ]
    },
    {
      id: '5',
      participants: [
        { id: '5', name: 'Jessica Williams', image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', userType: 'client', isOnline: true },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'Looking forward to the engagement shoot!', senderId: '5', createdAt: '2025-07-14T09:15:00' },
      unreadCount: 1,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm16', conversationId: '5', senderId: '5', senderName: 'Jessica Williams', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'Hi! We\'re getting engaged and need photos.', type: 'text', isRead: true, createdAt: '2025-07-13T15:00:00' },
        { id: 'm17', conversationId: '5', senderId: '5', senderName: 'Jessica Williams', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'Looking forward to the engagement shoot!', type: 'text', isRead: false, createdAt: '2025-07-14T09:15:00' }
      ]
    },
    {
      id: '6',
      participants: [
        { id: '6', name: 'Robert Martinez', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'client', isOnline: false, lastSeen: '3 hours ago' },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'Can you send me a quote for the real estate photos?', senderId: '6', createdAt: '2025-07-13T16:30:00' },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm18', conversationId: '6', senderId: '6', senderName: 'Robert Martinez', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'I have 5 properties that need professional photos.', type: 'text', isRead: true, createdAt: '2025-07-13T14:00:00' },
        { id: 'm19', conversationId: '6', senderId: '6', senderName: 'Robert Martinez', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Can you send me a quote for the real estate photos?', type: 'text', isRead: true, createdAt: '2025-07-13T16:30:00' }
      ]
    },
    {
      id: '7',
      participants: [
        { id: '7', name: 'Amanda Lee', image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', userType: 'client', isOnline: true },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'The family portraits turned out beautiful!', senderId: '7', createdAt: '2025-07-12T18:00:00' },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm20', conversationId: '7', senderId: '7', senderName: 'Amanda Lee', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'Thank you so much for the session yesterday!', type: 'text', isRead: true, createdAt: '2025-07-12T12:00:00' },
        { id: 'm21', conversationId: '7', senderId: '7', senderName: 'Amanda Lee', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'The family portraits turned out beautiful!', type: 'text', isRead: true, createdAt: '2025-07-12T18:00:00' }
      ]
    },
    {
      id: '8',
      participants: [
        { id: '8', name: 'Chris Thompson', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'client', isOnline: false, lastSeen: '5 hours ago' },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'Do you do sports photography?', senderId: '8', createdAt: '2025-07-11T14:45:00' },
      unreadCount: 2,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm22', conversationId: '8', senderId: '8', senderName: 'Chris Thompson', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Hey! I coach a youth soccer team.', type: 'text', isRead: true, createdAt: '2025-07-11T10:00:00' },
        { id: 'm23', conversationId: '8', senderId: '8', senderName: 'Chris Thompson', senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', content: 'Do you do sports photography?', type: 'text', isRead: false, createdAt: '2025-07-11T14:45:00' }
      ]
    },
    {
      id: '9',
      participants: [
        { id: '9', name: 'Sophia Brown', image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', userType: 'client', isOnline: true },
        { id: currentUserId, name: 'John Studio', image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', userType: 'photographer', isOnline: true }
      ],
      lastMessage: { content: 'I need maternity photos for next month.', senderId: '9', createdAt: '2025-07-10T11:30:00' },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      messages: [
        { id: 'm24', conversationId: '9', senderId: '9', senderName: 'Sophia Brown', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'Hi! I found your work on Instagram.', type: 'text', isRead: true, createdAt: '2025-07-10T09:00:00' },
        { id: 'm25', conversationId: '9', senderId: '9', senderName: 'Sophia Brown', senderImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', content: 'I need maternity photos for next month.', type: 'text', isRead: true, createdAt: '2025-07-10T11:30:00' }
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
      senderName: 'John Studio',
      senderImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
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

  // Message action handlers
  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditMessageContent(currentContent);
  };

  const saveEditedMessage = () => {
    if (!editingMessageId || !editMessageContent.trim() || !selectedConversation) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === editingMessageId ? { ...msg, content: editMessageContent } : msg
          )
        };
      }
      return conv;
    }));

    setEditingMessageId(null);
    setEditMessageContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedConversation) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        const updatedMessages = conv.messages.filter(msg => msg.id !== messageId);
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        return {
          ...conv,
          messages: updatedMessages,
          lastMessage: lastMsg ? { content: lastMsg.content, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt } : undefined
        };
      }
      return conv;
    }));
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
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
          <Topbar userRole="photographer" />
        </div>
        <div className="mobile-inbox-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', margin: '0 1.25rem 1rem 1.25rem' }}>

          {/* Conversations List */}
          <div className={`mobile-conversations-list ${selectedConversation ? 'mobile-chat-active' : ''}`} style={{
            width: '340px',
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem 0 0 0.75rem',
            border: `2px solid ${colors.borderPrimary}`,
            borderRight: `2px solid ${colors.borderPrimary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: colors.shadowSm
          }}>
            {/* Header */}
            <div className="mobile-conversations-list-header" style={{ padding: '1rem', borderBottom: `2px solid ${colors.borderPrimary}` }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '1rem' }}>Messages</h1>

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
                    border: `2px solid ${colors.borderSecondary}`,
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
              {filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;

                return (
                  <div
                    key={conv.id}
                    className="mobile-conversation-item"
                    onClick={() => setSelectedConversation(conv.id)}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedConversation === conv.id ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                      borderBottom: `2px solid ${colors.borderPrimary}`,
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        overflow: 'hidden'
                      }}>
                        <Image
                          src={other.image}
                          alt={other.name}
                          width={48}
                          height={48}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
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
            boxShadow: colors.shadowSm
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
                      className="mobile-back-button"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back
                    </button>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        overflow: 'hidden'
                      }}>
                        <Image
                          src={otherParticipant.image}
                          alt={otherParticipant.name}
                          width={44}
                          height={44}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
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
                      <span style={{ fontSize: '0.8rem', color: otherParticipant.isOnline ? '#10B981' : '#6B7280' }}>
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
                              <Image
                                src={message.senderImage}
                                alt={message.senderName}
                                width={32}
                                height={32}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                              />
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
                                  color: '#DC2626',
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
                                border: '2px solid #083A85',
                                borderRadius: '0.75rem',
                                padding: '0.75rem',
                                minWidth: '250px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                              }}>
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: '#083A85',
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
                                    border: '2px solid #D1D5DB',
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
                                      backgroundColor: colors.bgCard,
                                      border: '2px solid #D1D5DB',
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
                        border: '2px solid #D1D5DB',
                        borderRadius: '9999px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: colors.bgCard,
                        color: colors.textPrimary
                      }}
                    />
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
    </div>
  );
};

export default InboxPage;
