"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Icons
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Social Media Icons with Brand Colors
const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/>
    <rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/>
  </svg>
);

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  date: string;
  time: string;
  duration: string;
  location: {
    address: string;
    city: string;
    country: string;
  };
  coverImage: string;
  guestCount: number;
  maxGuests: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  hasPhotographer: boolean;
  photographerName?: string;
  photographerImage?: string;
  shareLink: string;
  createdAt: string;
}

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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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

const MyEventsPage = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<Event | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);

  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Sarah & James Wedding',
      description: 'A beautiful garden wedding ceremony and reception at Kigali Convention Center. Join us to celebrate the union of Sarah and James.',
      eventType: 'Wedding',
      date: '2025-08-15',
      time: '14:00',
      duration: '6 hours',
      location: { address: 'Kigali Convention Center', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      guestCount: 156,
      maxGuests: 200,
      status: 'upcoming',
      hasPhotographer: true,
      photographerName: 'John Studio',
      photographerImage: 'https://randomuser.me/api/portraits/men/75.jpg',
      shareLink: 'https://connekt.app/event/evt_7x9K2mNpQrS4',
      createdAt: '2025-06-01'
    },
    {
      id: '2',
      title: 'My 30th Birthday Bash',
      description: 'Celebrating three decades of life! Join us for an evening of fun, music, and memories.',
      eventType: 'Birthday',
      date: '2025-07-25',
      time: '18:00',
      duration: '4 hours',
      location: { address: 'Lake Kivu Resort', city: 'Gisenyi', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      guestCount: 45,
      maxGuests: 80,
      status: 'upcoming',
      hasPhotographer: true,
      photographerName: 'Mary Shots',
      photographerImage: 'https://randomuser.me/api/portraits/women/68.jpg',
      shareLink: 'https://connekt.app/event/evt_3pL8wYzTuV5H',
      createdAt: '2025-06-15'
    },
    {
      id: '3',
      title: 'Company Team Building 2025',
      description: 'Annual team building event for our amazing team. Activities, workshops, and team bonding.',
      eventType: 'Corporate',
      date: '2025-09-10',
      time: '09:00',
      duration: '8 hours',
      location: { address: 'Serena Hotel', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      guestCount: 75,
      maxGuests: 100,
      status: 'upcoming',
      hasPhotographer: false,
      shareLink: 'https://connekt.app/event/evt_9dF4kBnCxM1J',
      createdAt: '2025-07-01'
    },
    {
      id: '4',
      title: 'Baby Shower - Emma',
      description: 'Welcoming baby Emma! A lovely afternoon celebrating the upcoming arrival.',
      eventType: 'Baby Shower',
      date: '2025-05-20',
      time: '14:00',
      duration: '3 hours',
      location: { address: 'Radisson Blu', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      guestCount: 35,
      maxGuests: 50,
      status: 'completed',
      hasPhotographer: true,
      photographerName: 'David Captures',
      photographerImage: 'https://randomuser.me/api/portraits/men/32.jpg',
      shareLink: 'https://connekt.app/event/evt_5hR2vJmLnP8W',
      createdAt: '2025-04-01'
    },
    {
      id: '5',
      title: 'Graduation Party 2024',
      description: 'Celebrating academic achievements! A memorable evening with family and friends.',
      eventType: 'Graduation',
      date: '2024-12-15',
      time: '17:00',
      duration: '5 hours',
      location: { address: 'Marriott Hotel', city: 'Kigali', country: 'Rwanda' },
      coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      guestCount: 120,
      maxGuests: 150,
      status: 'completed',
      hasPhotographer: true,
      photographerName: 'Elite Photography',
      photographerImage: 'https://randomuser.me/api/portraits/men/22.jpg',
      shareLink: 'https://connekt.app/event/evt_1qA6tXsGdK4Y',
      createdAt: '2024-11-01'
    }
  ]);

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Baby Shower', 'Graduation', 'Anniversary', 'Engagement', 'Other'];

  const handleDeleteEvent = () => {
    if (deleteEvent) {
      setEvents(prev => prev.filter(e => e.id !== deleteEvent.id));
      setDeleteEvent(null);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
      case 'ongoing':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'completed':
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
      case 'cancelled':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'upcoming') {
      return matchesSearch && (event.status === 'upcoming' || event.status === 'ongoing');
    } else if (activeTab === 'past') {
      return matchesSearch && (event.status === 'completed' || event.status === 'cancelled');
    }
    return matchesSearch;
  });

  const upcomingCount = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;
  const pastCount = events.filter(e => e.status === 'completed' || e.status === 'cancelled').length;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>

          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600' }}>My Events</h1>
              <p style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Create and manage your events
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <PlusIcon />
              Create Event
            </button>
          </header>

          {/* Search */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', backgroundColor: '#F3F4F6', borderRadius: '0.5rem', padding: '0.25rem', width: 'fit-content' }}>
            {([
              { key: 'upcoming' as const, label: 'Upcoming', count: upcomingCount },
              { key: 'past' as const, label: 'Past', count: pastCount },
              { key: 'all' as const, label: 'All Events', count: events.length }
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
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
                <span style={{
                  backgroundColor: activeTab === tab.key ? '#083A85' : '#E5E7EB',
                  color: activeTab === tab.key ? 'white' : '#6B7280',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '1rem', color: '#6B7280' }}>No events found.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#083A85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <PlusIcon />
                Create Your First Event
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  {/* Cover Image */}
                  <div style={{ position: 'relative', height: '160px' }}>
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      ...getStatusBadgeStyle(event.status),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {event.status}
                    </div>
                    {/* Event Type */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {event.eventType}
                    </div>
                    {/* Photographer Badge */}
                    {event.hasPhotographer && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        left: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        <CameraIcon />
                        {event.photographerName}
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                      {event.title}
                    </h3>

                    {/* Date & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6B7280' }}>
                        <CalendarIcon />
                        <span style={{ fontSize: '0.85rem' }}>{formatDate(event.date)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6B7280' }}>
                        <ClockIcon />
                        <span style={{ fontSize: '0.85rem' }}>{event.time}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', color: '#6B7280' }}>
                      <LocationIcon />
                      <span style={{ fontSize: '0.85rem' }}>{event.location.city}, {event.location.country}</span>
                    </div>

                    {/* Guest Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', color: '#6B7280' }}>
                      <UsersIcon />
                      <span style={{ fontSize: '0.85rem' }}>{event.guestCount} / {event.maxGuests} guests</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setShowEventDetails(event)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => { setShareEvent(event); setShowShareModal(true); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                          title="Share Event"
                        >
                          <ShareIcon />
                        </button>
                      </div>
                      {event.status === 'upcoming' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'white',
                              color: '#374151',
                              border: '1px solid #E5E7EB',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                            title="Edit Event"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => { setDeleteEvent(event); setShowDeleteModal(true); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'white',
                              color: '#DC2626',
                              border: '1px solid #FEE2E2',
                              borderRadius: '0.375rem',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                            title="Cancel Event"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Event" maxWidth="600px">
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Event Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Sarah & James Wedding"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Event Type *
            </label>
            <select style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              backgroundColor: 'white'
            }}>
              <option value="">Select event type</option>
              {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Date *
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Time *
              </label>
              <input
                type="time"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Location *
            </label>
            <input
              type="text"
              placeholder="Enter venue address"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                City *
              </label>
              <input
                type="text"
                placeholder="e.g., Kigali"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Country *
              </label>
              <select style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                backgroundColor: 'white'
              }}>
                <option value="Rwanda">Rwanda</option>
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Burundi">Burundi</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Maximum Guests
            </label>
            <input
              type="number"
              placeholder="e.g., 100"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Description
            </label>
            <textarea
              placeholder="Tell your guests about this event..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                padding: '0.75rem 1.25rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#374151',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: '0.5rem',
                background: '#083A85',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Event
            </button>
          </div>
        </div>
      </Modal>

      {/* Event Details Modal */}
      <Modal isOpen={!!showEventDetails} onClose={() => setShowEventDetails(null)} title="Event Details" maxWidth="600px">
        {showEventDetails && (
          <div>
            {/* Cover Image */}
            <div style={{ position: 'relative', height: '180px', margin: '-1.5rem -1.5rem 1.25rem -1.5rem', overflow: 'hidden' }}>
              <Image
                src={showEventDetails.coverImage}
                alt={showEventDetails.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                ...getStatusBadgeStyle(showEventDetails.status),
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {showEventDetails.status}
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
              {showEventDetails.title}
            </h2>

            <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              {showEventDetails.description}
            </p>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <CalendarIcon />
                  <span style={{ fontSize: '0.8rem' }}>Date & Time</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>
                  {formatDate(showEventDetails.date)} at {showEventDetails.time}
                </div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <ClockIcon />
                  <span style={{ fontSize: '0.8rem' }}>Duration</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{showEventDetails.duration}</div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <LocationIcon />
                  <span style={{ fontSize: '0.8rem' }}>Location</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>
                  {showEventDetails.location.address}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                  {showEventDetails.location.city}, {showEventDetails.location.country}
                </div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#6B7280' }}>
                  <UsersIcon />
                  <span style={{ fontSize: '0.8rem' }}>Guests</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>
                  {showEventDetails.guestCount} / {showEventDetails.maxGuests} confirmed
                </div>
              </div>
            </div>

            {/* Photographer Info */}
            {showEventDetails.hasPhotographer && (
              <div style={{ backgroundColor: '#F0F9FF', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#0369A1', marginBottom: '0.5rem', fontWeight: '600' }}>Booked Photographer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Image
                    src={showEventDetails.photographerImage || ''}
                    alt={showEventDetails.photographerName || ''}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%' }}
                  />
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>
                    {showEventDetails.photographerName}
                  </span>
                </div>
              </div>
            )}

            {!showEventDetails.hasPhotographer && showEventDetails.status === 'upcoming' && (
              <div style={{ backgroundColor: '#FEF3C7', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#92400E', marginBottom: '0.5rem', fontWeight: '600' }}>
                  No Photographer Booked
                </div>
                <p style={{ fontSize: '0.85rem', color: '#92400E', marginBottom: '0.75rem' }}>
                  Don&apos;t miss capturing your special moments!
                </p>
                <button
                  style={{
                    backgroundColor: '#083A85',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Find a Photographer
                </button>
              </div>
            )}

            {/* Share Link */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Share Link</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={showEventDetails.shareLink}
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
                  onClick={() => {
                    navigator.clipboard.writeText(showEventDetails.shareLink);
                    alert('Link copied to clipboard!');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: '#083A85',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <CopyIcon />
                  Copy
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {showEventDetails.status === 'upcoming' && (
                <>
                  <button
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'white',
                      color: '#374151',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <EditIcon />
                    Edit Event
                  </button>
                  <button
                    onClick={() => { setShowEventDetails(null); setDeleteEvent(showEventDetails); setShowDeleteModal(true); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'white',
                      color: '#DC2626',
                      border: '1px solid #FEE2E2',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <TrashIcon />
                    Cancel
                  </button>
                </>
              )}
              {showEventDetails.status === 'completed' && (
                <button
                  style={{
                    flex: 1,
                    backgroundColor: '#083A85',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View Photos & Gallery
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Event">
        {shareEvent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <Image src={shareEvent.coverImage} alt={shareEvent.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{shareEvent.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{formatDate(shareEvent.date)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}` },
                { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}` },
                { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this event: ${link}`)}` },
                { name: 'Copy Link', icon: <LinkIcon />, color: '#6B7280', getUrl: () => '' },
                { name: 'QR Code', icon: <QRCodeIcon />, color: '#111827', getUrl: () => '' }
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    if (option.name === 'Copy Link') {
                      navigator.clipboard.writeText(shareEvent.shareLink);
                      alert('Link copied to clipboard!');
                    } else if (option.name === 'QR Code') {
                      // QR Code would require a library, show alert for now
                      alert('QR Code feature coming soon!');
                    } else {
                      const url = option.getUrl(shareEvent.shareLink, shareEvent.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = option.color;
                    e.currentTarget.style.color = option.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Event Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={shareEvent.shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#F9FAFB'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareEvent.shareLink);
                    alert('Link copied to clipboard!');
                  }}
                  style={{
                    padding: '0.625rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: '#083A85',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Cancel Event">
        {deleteEvent && (
          <div>
            <p style={{ fontSize: '0.95rem', color: '#6B7280', marginBottom: '1rem' }}>
              Are you sure you want to cancel <strong>{deleteEvent.title}</strong>? This action cannot be undone.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#DC2626', marginBottom: '1.5rem', backgroundColor: '#FEE2E2', padding: '0.75rem', borderRadius: '0.5rem' }}>
              All guests will be notified and any booked photographer will be released.
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
                Keep Event
              </button>
              <button
                onClick={handleDeleteEvent}
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
                Cancel Event
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyEventsPage;
