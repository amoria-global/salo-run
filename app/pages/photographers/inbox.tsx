"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Sample conversations data - matching clients from clients.tsx
const conversationsData = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    clientAvatar: '/avatars/user1.jpg',
    lastMessage: 'Thank you for the beautiful photos!',
    timestamp: '2 min ago',
    unread: 3,
    isOnline: true,
    messages: [
      { id: 1, sender: 'client', text: 'Hi! I would like to book a wedding photoshoot', time: '10:30 AM', date: 'Today' },
      { id: 2, sender: 'photographer', text: 'Hello Sarah! I would be happy to help. When is your wedding date?', time: '10:32 AM', date: 'Today' },
      { id: 3, sender: 'client', text: 'It is on June 15th, 2025. Do you have availability?', time: '10:35 AM', date: 'Today' },
      { id: 4, sender: 'photographer', text: 'Yes, I am available on that date! Let me send you my wedding packages.', time: '10:37 AM', date: 'Today' },
      { id: 5, sender: 'client', text: 'Thank you for the beautiful photos!', time: '10:40 AM', date: 'Today' },
    ]
  },
  {
    id: 2,
    clientName: 'Michael Chen',
    clientAvatar: '/avatars/user2.jpg',
    lastMessage: 'When can we schedule the portrait session?',
    timestamp: '1 hour ago',
    unread: 1,
    isOnline: true,
    messages: [
      { id: 1, sender: 'client', text: 'Hello, I saw your portfolio and I am interested in a corporate portrait session', time: '9:15 AM', date: 'Today' },
      { id: 2, sender: 'photographer', text: 'Thank you for reaching out! I would love to work with you. What type of corporate portraits are you looking for?', time: '9:20 AM', date: 'Today' },
      { id: 3, sender: 'client', text: 'When can we schedule the portrait session?', time: '9:45 AM', date: 'Today' },
    ]
  },
  {
    id: 3,
    clientName: 'Emily Rodriguez',
    clientAvatar: '/avatars/user3.jpg',
    lastMessage: 'I received the edited photos. They look amazing!',
    timestamp: '3 hours ago',
    unread: 0,
    isOnline: false,
    messages: [
      { id: 1, sender: 'photographer', text: 'Hi Emily! Your edited photos are ready. I have sent them to your email.', time: '8:00 AM', date: 'Today' },
      { id: 2, sender: 'client', text: 'I received the edited photos. They look amazing!', time: '8:30 AM', date: 'Today' },
    ]
  },
  {
    id: 4,
    clientName: 'David Park',
    clientAvatar: '/avatars/user4.jpg',
    lastMessage: 'Can you also do video coverage?',
    timestamp: 'Yesterday',
    unread: 0,
    isOnline: true,
    messages: [
      { id: 1, sender: 'client', text: 'Hi! I need photography for my product launch event in Seattle', time: '3:20 PM', date: 'Yesterday' },
      { id: 2, sender: 'photographer', text: 'Hello David! I would be glad to cover your event. Can you tell me more about it?', time: '3:25 PM', date: 'Yesterday' },
      { id: 3, sender: 'client', text: 'Can you also do video coverage?', time: '3:30 PM', date: 'Yesterday' },
    ]
  },
  {
    id: 5,
    clientName: 'Lisa Thompson',
    clientAvatar: '/avatars/user5.jpg',
    lastMessage: 'Thank you! I will send the deposit today.',
    timestamp: '30 mins ago',
    unread: 2,
    isOnline: true,
    messages: [
      { id: 1, sender: 'client', text: 'Hi! I would like to book you for another photoshoot', time: '2:00 PM', date: 'Today' },
      { id: 2, sender: 'photographer', text: 'Hello Lisa! Great to hear from you again. What type of photoshoot are you looking for this time?', time: '2:10 PM', date: 'Today' },
      { id: 3, sender: 'client', text: 'I need new headshots for my company website', time: '2:12 PM', date: 'Today' },
      { id: 4, sender: 'photographer', text: 'Perfect! I can do that. My headshot package is $350. Would you like to proceed?', time: '2:15 PM', date: 'Today' },
      { id: 5, sender: 'client', text: 'Thank you! I will send the deposit today.', time: '2:20 PM', date: 'Today' },
    ]
  },
  {
    id: 6,
    clientName: 'James Wilson',
    clientAvatar: '/avatars/user6.jpg',
    lastMessage: 'Looking forward to working with you!',
    timestamp: '1 month ago',
    unread: 0,
    isOnline: false,
    messages: [
      { id: 1, sender: 'client', text: 'Hi! Do you offer family portrait packages?', time: '11:00 AM', date: '1 month ago' },
      { id: 2, sender: 'photographer', text: 'Yes! I have several family portrait packages. Let me share the details with you.', time: '11:15 AM', date: '1 month ago' },
      { id: 3, sender: 'client', text: 'Looking forward to working with you!', time: '11:30 AM', date: '1 month ago' },
    ]
  },
];

const Inbox = () => {
  const searchParams = useSearchParams();
  const clientName = searchParams.get('client');

  const [conversations, setConversations] = useState(conversationsData);
  const [selectedConversation, setSelectedConversation] = useState(() => {
    // Find conversation by client name if provided, otherwise default to first
    if (clientName) {
      const found = conversationsData.find(conv =>
        conv.clientName.toLowerCase() === clientName.toLowerCase()
      );
      return found || conversationsData[0];
    }
    return conversationsData[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Update selected conversation when client query param changes
  useEffect(() => {
    if (clientName) {
      const found = conversations.find(conv =>
        conv.clientName.toLowerCase() === clientName.toLowerCase()
      );
      if (found) {
        setSelectedConversation(found);
      }
    }
  }, [clientName, conversations]);

  // Common emojis organized by category
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '💪', '🦾', '🦿', '🦵', '🦶'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    'Objects': ['🎉', '🎊', '🎁', '🎈', '🎀', '🎂', '🍰', '🎄', '🎃', '🎆', '🎇', '✨', '🎯', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋']
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnread = !filterUnread || conv.unread > 0;
    return matchesSearch && matchesUnread;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Create new message object
    const now = new Date();
    const newMsg = {
      id: selectedConversation.messages.length + 1,
      sender: 'photographer' as const,
      text: newMessage.trim(),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: 'Today'
    };

    // Update the selected conversation with the new message
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMsg],
      lastMessage: newMessage.trim(),
      timestamp: 'Just now'
    };

    // Update conversations list
    const updatedConversations = conversations.map(conv =>
      conv.id === selectedConversation.id ? updatedConversation : conv
    );

    setConversations(updatedConversations);
    setSelectedConversation(updatedConversation);
    setNewMessage('');
  };

  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  };

  const handleAttachmentClick = () => {
    // In a real app, this would open a file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.doc,.docx';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const fileNames = Array.from(files).map((f: any) => f.name).join(', ');
        alert(`Selected files: ${fileNames}\n\nIn a real app, these would be uploaded and attached to your message.`);
      }
    };
    input.click();
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />

        <main style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
          {/* Conversations List Sidebar */}
          {isSidebarVisible && (
          <div style={{
            width: '380px',
            backgroundColor: '#FAFAFA',
            borderRight: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 5rem)'
          }}>
            {/* Inbox Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <h1 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>Chats</h1>
                <button
                  onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                  style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  border: '1px solid #E5E7EB',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
                >
                  <i className="bi bi-layout-sidebar-inset" style={{ fontSize: '1.125rem' }}></i>
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6B7280',
                    fontSize: '1rem'
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search for Messages"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                      border: '2px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontWeight: '400'
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
                <button style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '0.5rem',
                  border: '2px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                >
                  <i className="bi bi-sliders" style={{ fontSize: '1.125rem' }}></i>
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div style={{
              flex: 1,
              overflowY: 'auto'
            }}>
              {filteredConversations.length === 0 ? (
                <div style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#9CA3AF'
                }}>
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    style={{
                      padding: '0.625rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedConversation?.id === conv.id ? 'white' : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative',
                      borderLeft: selectedConversation?.id === conv.id ? '3px solid #083A85' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedConversation?.id !== conv.id) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedConversation?.id !== conv.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#083A85',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {conv.clientName.charAt(0)}
                        </div>
                        {conv.isOnline && (
                          <div style={{
                            position: 'absolute',
                            bottom: '1px',
                            right: '1px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#10B981',
                            border: '2px solid white',
                            borderRadius: '50%'
                          }}></div>
                        )}
                      </div>

                      {/* Message Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '0.125rem'
                        }}>
                          <h3 style={{
                            fontSize: '0.8125rem',
                            fontWeight: conv.unread > 0 ? '600' : '500',
                            color: '#111827',
                            margin: 0
                          }}>{conv.clientName}</h3>
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            flexShrink: 0,
                            marginLeft: '0.5rem'
                          }}>{conv.timestamp}</span>
                        </div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: conv.unread > 0 ? '#374151' : '#9CA3AF',
                          fontWeight: conv.unread > 0 ? '500' : '400',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.lastMessage}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {conv.unread > 0 && (
                        <div style={{
                          minWidth: '18px',
                          height: '18px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          padding: '0 0.2rem'
                        }}>
                          {conv.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {/* Chat Window */}
          {selectedConversation && (
            <div style={{
              flex: 1,
              backgroundColor: '#E8E8E8',
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 5rem)'
            }}>
              {/* Chat Header */}
              <div style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'white',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  {/* Toggle Sidebar Button - Only show when sidebar is hidden */}
                  {!isSidebarVisible && (
                    <button
                      onClick={() => setIsSidebarVisible(true)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '0.375rem',
                        border: '1px solid #E5E7EB',
                        backgroundColor: 'white',
                        color: '#6B7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <i className="bi bi-layout-sidebar-inset" style={{ fontSize: '1rem' }}></i>
                    </button>
                  )}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#083A85',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: 'white'
                    }}>
                      {selectedConversation.clientName.charAt(0)}
                    </div>
                    {selectedConversation.isOnline && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#10B981',
                        border: '2px solid white',
                        borderRadius: '50%'
                      }}></div>
                    )}
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>{selectedConversation.clientName}</h2>
                    <p style={{
                      fontSize: '0.75rem',
                      color: selectedConversation.isOnline ? '#10B981' : '#9CA3AF',
                      margin: '0.125rem 0 0 0'
                    }}>
                      {selectedConversation.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                backgroundColor: '#E8E8E8',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {/* Date Separator */}
                <div style={{
                  textAlign: 'center',
                  padding: '0.375rem 0'
                }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    color: '#6B7280',
                    backgroundColor: 'white',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '0.75rem',
                    display: 'inline-block'
                  }}>
                    Today
                  </span>
                </div>
                {selectedConversation.messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      flexDirection: message.sender === 'photographer' ? 'row-reverse' : 'row',
                      gap: '0.5rem',
                      alignItems: 'flex-end'
                    }}
                  >
                    {/* Avatar for client messages */}
                    {message.sender === 'client' && (
                      <div style={{
                        width: '28px',
                        height: '28px',
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
                        {selectedConversation.clientName.charAt(0)}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div style={{
                      maxWidth: '60%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.sender === 'photographer' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.875rem',
                        backgroundColor: message.sender === 'photographer' ? '#083A85' : 'white',
                        color: message.sender === 'photographer' ? 'white' : '#111827',
                        boxShadow: message.sender === 'client' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none',
                        borderTopRightRadius: message.sender === 'photographer' ? '0.375rem' : '0.875rem',
                        borderTopLeftRadius: message.sender === 'client' ? '0.375rem' : '0.875rem'
                      }}>
                        <p style={{
                          fontSize: '0.8125rem',
                          margin: 0,
                          lineHeight: '1.5'
                        }}>
                          {message.text}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: '0.25rem',
                        paddingLeft: message.sender === 'client' ? '0.375rem' : '0',
                        paddingRight: message.sender === 'photographer' ? '0.375rem' : '0'
                      }}>
                        <span style={{
                          fontSize: '0.625rem',
                          color: '#9CA3AF'
                        }}>
                          {message.time}
                        </span>
                        {message.sender === 'photographer' && (
                          <i className="bi bi-check-all" style={{ fontSize: '0.75rem', color: '#10B981' }}></i>
                        )}
                      </div>
                    </div>

                    {/* Spacer for photographer messages */}
                    {message.sender === 'photographer' && (
                      <div style={{ width: '28px', flexShrink: 0 }}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'white',
                borderTop: '1px solid #E5E7EB',
                position: 'relative'
              }}>
                {/* Emoji Picker Modal */}
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '1.25rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'white',
                    borderRadius: '0.625rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #E5E7EB',
                    width: '320px',
                    maxHeight: '350px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    <div style={{
                      padding: '0.625rem 0.875rem',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1
                    }}>
                      <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        color: '#111827'
                      }}>Emojis</span>
                      <button
                        onClick={() => setShowEmojiPicker(false)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: '#F3F4F6',
                          color: '#6B7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6875rem'
                        }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div style={{ padding: '0.625rem' }}>
                      {Object.entries(emojiCategories).map(([category, emojis]) => (
                        <div key={category} style={{ marginBottom: '0.75rem' }}>
                          <div style={{
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                            color: '#6B7280',
                            marginBottom: '0.375rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {category}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '0.25rem'
                          }}>
                            {emojis.map((emoji, index) => (
                              <button
                                key={`${category}-${index}`}
                                onClick={() => handleEmojiSelect(emoji)}
                                style={{
                                  width: '100%',
                                  aspectRatio: '1',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  borderRadius: '0.25rem',
                                  fontSize: '1.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '0.375rem',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  padding: '0.25rem',
                  borderRadius: '1.25rem',
                  border: '2px solid #E5E7EB',
                  transition: 'all 0.2s'
                }}>
                  {/* Emoji Button */}
                  <button
                    title="Add emoji"
                    onClick={handleEmojiClick}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: showEmojiPicker ? '#E5E7EB' : 'transparent',
                      color: showEmojiPicker ? '#083A85' : '#6B7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (!showEmojiPicker) {
                        e.currentTarget.style.backgroundColor = '#E5E7EB';
                        e.currentTarget.style.color = '#111827';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showEmojiPicker) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6B7280';
                      }
                    }}
                  >
                    <i className="bi bi-emoji-smile" style={{ fontSize: '1rem' }}></i>
                  </button>

                  {/* Attachment Button */}
                  <button
                    title="Attach file"
                    onClick={handleAttachmentClick}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#6B7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E5E7EB';
                      e.currentTarget.style.color = '#111827';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }}
                  >
                    <i className="bi bi-paperclip" style={{ fontSize: '1rem' }}></i>
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.375rem 0.75rem',
                      border: 'none',
                      borderRadius: '1rem',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontWeight: '400'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement!.style.borderColor = '#083A85';
                      e.currentTarget.parentElement!.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement!.style.borderColor = '#E5E7EB';
                      e.currentTarget.parentElement!.style.boxShadow = 'none';
                    }}
                  />

                  {/* Send Button */}
                  <button
                    title="Send message"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: newMessage.trim() ? '#083A85' : '#D1D5DB',
                      color: 'white',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      boxShadow: newMessage.trim() ? '0 2px 8px rgba(8, 58, 133, 0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (newMessage.trim()) {
                        e.currentTarget.style.backgroundColor = '#0A4BA0';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newMessage.trim()) {
                        e.currentTarget.style.backgroundColor = '#083A85';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <i className="bi bi-send-fill" style={{ fontSize: '0.875rem' }}></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Inbox;
