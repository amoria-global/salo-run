"use client";

import { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import Link from 'next/link';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#FBBF24' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#F20C8F' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.09924 19.7228 3.6929 19.0554 3.41524C18.3879 3.13757 17.6725 2.99414 16.95 2.99414C16.2275 2.99414 15.5121 3.13757 14.8446 3.41524C14.1772 3.6929 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99479 7.05 2.99479C5.59096 2.99479 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54478 7.04097 1.54478 8.5C1.54478 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.7571 11.2728 22.0348 10.6054C22.3124 9.93789 22.4559 9.22249 22.4559 8.5C22.4559 7.77751 22.3124 7.06211 22.0348 6.39464C21.7571 5.72718 21.3508 5.12075 20.84 4.61Z" stroke={filled ? '#F20C8F' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="#6B7280" strokeWidth="2"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2"/>
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="6" x2="21" y2="6" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke={active ? '#083A85' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

interface Booking {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  duration: string;
  location: string;
  packageName: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partially_paid' | 'failed';
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string;
  coverImage: string;
  location: {
    city: string;
    country: string;
  };
  totalBookings: number;
  totalSpent: number;
  joinDate: string;
  lastActive: string;
  lastBookingDate: string;
  lastEventType: string;
  lastEventName: string;
  status: 'active' | 'inactive';
  isFavorite: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  bookings: Booking[];
}

type FilterType = 'all' | 'active' | 'inactive' | 'favorites' | 'pending_payments';
type ViewMode = 'grid' | 'list';

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
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
              <CloseIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'bookings' | 'spent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; client: Client } | null>(null);

  // Sample clients data with real images
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 234 567 8900',
      profileImage: 'https://randomuser.me/api/portraits/women/75.jpg',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      location: { city: 'New York', country: 'USA' },
      totalBookings: 12,
      totalSpent: 5400,
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      lastBookingDate: '2024-11-15',
      lastEventType: 'Wedding',
      lastEventName: 'Sarah & James Wedding',
      status: 'active',
      isFavorite: true,
      verified: true,
      rating: 4.9,
      reviewCount: 8,
      bookings: [
        {
          id: 'BK-001',
          eventName: 'Sarah & James Wedding',
          eventType: 'Wedding',
          eventDate: '2024-11-15',
          eventTime: '14:00',
          duration: '8 hours',
          location: 'Central Park, NYC',
          packageName: 'Premium Wedding',
          totalAmount: 1500,
          paidAmount: 1500,
          paymentStatus: 'paid',
          status: 'completed'
        },
        {
          id: 'BK-008',
          eventName: 'Anniversary Photos',
          eventType: 'Portrait',
          eventDate: '2025-01-20',
          eventTime: '16:00',
          duration: '2 hours',
          location: 'Studio, NYC',
          packageName: 'Portrait Session',
          totalAmount: 300,
          paidAmount: 150,
          paymentStatus: 'partially_paid',
          status: 'upcoming'
        }
      ]
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'mchen@email.com',
      phone: '+1 234 567 8901',
      profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
      coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      location: { city: 'San Francisco', country: 'USA' },
      totalBookings: 8,
      totalSpent: 3200,
      joinDate: '2024-02-20',
      lastActive: '1 day ago',
      lastBookingDate: '2024-10-28',
      lastEventType: 'Birthday',
      lastEventName: 'Michael\'s 30th Birthday',
      status: 'active',
      isFavorite: false,
      verified: true,
      rating: 4.7,
      reviewCount: 5,
      bookings: [
        {
          id: 'BK-002',
          eventName: 'Michael\'s 30th Birthday',
          eventType: 'Birthday',
          eventDate: '2024-10-28',
          eventTime: '18:00',
          duration: '4 hours',
          location: 'Private Venue, SF',
          packageName: 'Event Coverage',
          totalAmount: 600,
          paidAmount: 600,
          paymentStatus: 'paid',
          status: 'completed'
        }
      ]
    },
    {
      id: '3',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@email.com',
      phone: '+1 234 567 8902',
      profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
      coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      location: { city: 'Miami', country: 'USA' },
      totalBookings: 15,
      totalSpent: 7800,
      joinDate: '2023-11-10',
      lastActive: '2 weeks ago',
      lastBookingDate: '2024-09-20',
      lastEventType: 'Concert',
      lastEventName: 'Summer Music Festival',
      status: 'inactive',
      isFavorite: true,
      verified: false,
      rating: 4.8,
      reviewCount: 12,
      bookings: [
        {
          id: 'BK-003',
          eventName: 'Summer Music Festival',
          eventType: 'Concert',
          eventDate: '2024-09-20',
          eventTime: '16:00',
          duration: '6 hours',
          location: 'Bayfront Park, Miami',
          packageName: 'Festival Coverage',
          totalAmount: 800,
          paidAmount: 800,
          paymentStatus: 'paid',
          status: 'completed'
        }
      ]
    },
    {
      id: '4',
      firstName: 'David',
      lastName: 'Park',
      email: 'dpark@email.com',
      phone: '+1 234 567 8903',
      profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
      coverImage: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800',
      location: { city: 'Seattle', country: 'USA' },
      totalBookings: 6,
      totalSpent: 2100,
      joinDate: '2024-03-05',
      lastActive: '5 hours ago',
      lastBookingDate: '2024-11-01',
      lastEventType: 'Corporate',
      lastEventName: 'Tech Company Headshots',
      status: 'active',
      isFavorite: false,
      verified: true,
      rating: 4.6,
      reviewCount: 4,
      bookings: [
        {
          id: 'BK-004',
          eventName: 'Tech Company Headshots',
          eventType: 'Corporate',
          eventDate: '2024-11-01',
          eventTime: '09:00',
          duration: '4 hours',
          location: 'Tech Hub, Seattle',
          packageName: 'Corporate Package',
          totalAmount: 500,
          paidAmount: 500,
          paymentStatus: 'paid',
          status: 'completed'
        },
        {
          id: 'BK-010',
          eventName: 'Team Building Event',
          eventType: 'Corporate',
          eventDate: '2025-01-15',
          eventTime: '10:00',
          duration: '3 hours',
          location: 'Company HQ',
          packageName: 'Event Coverage',
          totalAmount: 450,
          paidAmount: 0,
          paymentStatus: 'pending',
          status: 'upcoming'
        }
      ]
    },
    {
      id: '5',
      firstName: 'Lisa',
      lastName: 'Thompson',
      email: 'lisa.t@email.com',
      phone: '+1 234 567 8904',
      profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
      coverImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
      location: { city: 'Austin', country: 'USA' },
      totalBookings: 20,
      totalSpent: 12500,
      joinDate: '2023-09-01',
      lastActive: '30 mins ago',
      lastBookingDate: '2024-08-15',
      lastEventType: 'Fashion',
      lastEventName: 'Summer Fashion Shoot',
      status: 'active',
      isFavorite: true,
      verified: true,
      rating: 5.0,
      reviewCount: 18,
      bookings: [
        {
          id: 'BK-005',
          eventName: 'Summer Fashion Shoot',
          eventType: 'Fashion',
          eventDate: '2024-08-15',
          eventTime: '14:00',
          duration: '5 hours',
          location: 'Studio, Austin',
          packageName: 'Fashion Editorial',
          totalAmount: 1200,
          paidAmount: 1200,
          paymentStatus: 'paid',
          status: 'completed'
        }
      ]
    },
    {
      id: '6',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'jwilson@email.com',
      phone: '+1 234 567 8905',
      profileImage: 'https://randomuser.me/api/portraits/men/55.jpg',
      coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      location: { city: 'Boston', country: 'USA' },
      totalBookings: 4,
      totalSpent: 1800,
      joinDate: '2024-04-12',
      lastActive: '1 month ago',
      lastBookingDate: '2024-06-20',
      lastEventType: 'Wedding',
      lastEventName: 'James & Maria Wedding',
      status: 'inactive',
      isFavorite: false,
      verified: false,
      rating: 4.5,
      reviewCount: 3,
      bookings: [
        {
          id: 'BK-006',
          eventName: 'James & Maria Wedding',
          eventType: 'Wedding',
          eventDate: '2024-06-20',
          eventTime: '15:00',
          duration: '6 hours',
          location: 'Harbor View, Boston',
          packageName: 'Wedding Basic',
          totalAmount: 900,
          paidAmount: 900,
          paymentStatus: 'paid',
          status: 'completed'
        }
      ]
    }
  ]);

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Portrait', 'Fashion', 'Concert'];

  const toggleFavorite = (id: string) => {
    setClients(prev => prev.map(c =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return { bg: '#DCFCE7', text: '#15803D' };
      case 'pending': return { bg: '#FEF3C7', text: '#B45309' };
      case 'partially_paid': return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'failed': return { bg: '#FEE2E2', text: '#DC2626' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  // Get clients with pending payments
  const clientsWithPendingPayments = clients.filter(c =>
    c.bookings.some(b => b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid' || b.paymentStatus === 'failed')
  );

  // Calculate total pending amount
  const totalPendingAmount = clients.reduce((sum, c) => {
    return sum + c.bookings.reduce((bookingSum, b) => {
      if (b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid' || b.paymentStatus === 'failed') {
        return bookingSum + (b.totalAmount - b.paidAmount);
      }
      return bookingSum;
    }, 0);
  }, 0);

  // Filter clients based on search query and active filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'active') return matchesSearch && client.status === 'active';
    if (activeFilter === 'inactive') return matchesSearch && client.status === 'inactive';
    if (activeFilter === 'favorites') return matchesSearch && client.isFavorite;
    if (activeFilter === 'pending_payments') return matchesSearch && client.bookings.some(b =>
      b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid' || b.paymentStatus === 'failed'
    );

    return matchesSearch;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'recent':
        comparison = new Date(a.lastBookingDate).getTime() - new Date(b.lastBookingDate).getTime();
        break;
      case 'bookings':
        comparison = a.totalBookings - b.totalBookings;
        break;
      case 'spent':
        comparison = a.totalSpent - b.totalSpent;
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= Math.floor(rating)} />
        ))}
      </div>
    );
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar />

        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: '#111827', fontWeight: '600' }}>My Clients</h1>
              <p style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Clients who&apos;ve booked your services - manage relationships
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Sort Dropdown */}
              <div style={{ position: 'relative' }}>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSort, newOrder] = e.target.value.split('-');
                    setSortBy(newSort as typeof sortBy);
                    setSortOrder(newOrder as typeof sortOrder);
                  }}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    fontSize: '0.9rem',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <option value="recent-desc">Most Recent</option>
                  <option value="recent-asc">Oldest First</option>
                  <option value="bookings-desc">Most Bookings</option>
                  <option value="spent-desc">Highest Spent</option>
                </select>
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <SortIcon />
                </div>
              </div>
              {/* View Mode Toggle */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', padding: '0.25rem' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                    boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={viewMode === 'grid'} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <ListIcon active={viewMode === 'list'} />
                </button>
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Clients</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{clients.length}</div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Bookings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>
                {clients.reduce((sum, c) => sum + c.totalBookings, 0)}
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Earned</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>
                ${clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F20C8F' }}>
                {clients.filter(c => c.isFavorite).length}
              </div>
            </div>
            <div style={{ backgroundColor: totalPendingAmount > 0 ? '#FEF2F2' : 'white', borderRadius: '0.75rem', padding: '1rem', border: totalPendingAmount > 0 ? '1px solid #FECACA' : '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.85rem', color: totalPendingAmount > 0 ? '#B91C1C' : '#6B7280', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {totalPendingAmount > 0 && <AlertCircleIcon />}
                Pending Payments
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalPendingAmount > 0 ? '#DC2626' : '#6B7280' }}>
                ${totalPendingAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'all', label: 'All Clients', count: clients.length },
              { key: 'active', label: 'Active', count: clients.filter(c => c.status === 'active').length },
              { key: 'favorites', label: 'Favorites', count: clients.filter(c => c.isFavorite).length },
              { key: 'pending_payments', label: 'Pending Payments', count: clientsWithPendingPayments.length, alert: true }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as FilterType)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: activeFilter === tab.key
                    ? ((tab as { alert?: boolean }).alert ? '#F20C8F' : '#083A85')
                    : 'white',
                  color: activeFilter === tab.key ? 'white' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: activeFilter === tab.key
                    ? 'rgba(255,255,255,0.2)'
                    : ((tab as { alert?: boolean }).alert && tab.count > 0 ? '#FEE2E2' : '#F3F4F6'),
                  color: (tab as { alert?: boolean }).alert && tab.count > 0 && activeFilter !== tab.key ? '#DC2626' : undefined,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Search */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search your clients..."
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
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: showFilters ? '#083A85' : 'white',
                color: showFilters ? 'white' : '#6B7280',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <FilterIcon />
              Filters
            </button>
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Clients Grid/List */}
          {filteredClients.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', border: '1px solid #E5E7EB' }}>
              <UserIcon />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', marginTop: '1rem' }}>No clients found</h3>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.5rem' }}>
                {activeFilter === 'favorites' ? 'You haven\'t added any clients to favorites yet.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => setSelectedClient(client)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Cover Image */}
                  <div style={{ position: 'relative', height: '140px' }}>
                    <Image
                      src={client.coverImage}
                      alt={`${client.firstName}'s events`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Bookings Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CalendarIcon /> {client.totalBookings} booking{client.totalBookings > 1 ? 's' : ''}
                    </div>
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      backgroundColor: client.status === 'active' ? '#10B981' : '#6B7280',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {client.status}
                    </div>
                    {/* Action Buttons */}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(client.id); }}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '0.25rem',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Add to favorites"
                      >
                        <HeartIcon filled={client.isFavorite} />
                      </button>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '-2.5rem' }}>
                      <Image
                        src={client.profileImage}
                        alt={client.firstName}
                        width={60}
                        height={60}
                        style={{ borderRadius: '50%', border: '3px solid white', objectFit: 'cover' }}
                      />
                      <div style={{ marginTop: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            {client.firstName} {client.lastName}
                          </h3>
                          {client.verified && <VerifiedIcon />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <LocationIcon />
                          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                            {client.location.city}, {client.location.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Last Booking Info */}
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Last Booking</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111827' }}>{client.lastEventName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>
                        {client.lastEventType} • {formatDate(client.lastBookingDate)}
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {renderStars(client.rating)}
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{client.rating}</span>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>({client.reviewCount} reviews)</span>
                    </div>

                    {/* Total Spent */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #E5E7EB'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Total Spent</span>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#083A85' }}>${client.totalSpent.toLocaleString()}</span>
                    </div>

                    {/* Payment Status for Pending Bookings */}
                    {client.bookings.some(b => b.paymentStatus !== 'paid') && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#FEF3C7', borderRadius: '0.375rem' }}>
                        {client.bookings.filter(b => b.paymentStatus !== 'paid').slice(0, 1).map((booking) => {
                          const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                          const amountDue = booking.totalAmount - booking.paidAmount;
                          return (
                            <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '500' }}>{booking.eventName}</div>
                                <span style={{
                                  backgroundColor: paymentColor.bg,
                                  color: paymentColor.text,
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.65rem',
                                  fontWeight: '600',
                                  textTransform: 'capitalize'
                                }}>
                                  {booking.paymentStatus.replace('_', ' ')}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#B45309' }}>
                                ${amountDue} due
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <Link
                        href={`/user/photographers/inbox?client=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          textDecoration: 'none'
                        }}
                      >
                        <i className="bi bi-chat-dots" style={{ fontSize: '0.875rem' }}></i>
                        Message
                      </Link>
                      <Link
                        href="/user/photographers/gallery"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #D1D5DB',
                          backgroundColor: 'white',
                          color: '#6B7280',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          textDecoration: 'none'
                        }}
                      >
                        <i className="bi bi-image" style={{ fontSize: '0.875rem' }}></i>
                        Gallery
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Avatar */}
                  <Image
                    src={client.profileImage}
                    alt={client.firstName}
                    width={56}
                    height={56}
                    style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />

                  {/* Name & Location */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{client.firstName} {client.lastName}</h3>
                      {client.verified && <VerifiedIcon />}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(client.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', marginLeft: '0.25rem' }}
                      >
                        <HeartIcon filled={client.isFavorite} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <LocationIcon />
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                        {client.location.city}, {client.location.country}
                      </span>
                    </div>
                  </div>

                  {/* Last Booking */}
                  <div style={{ flex: '0 0 180px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '500', color: '#111827', margin: 0, marginBottom: '0.125rem' }}>
                      {client.lastEventName}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                      {client.lastEventType} • {formatDate(client.lastBookingDate)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#083A85', margin: 0, marginBottom: '0.125rem' }}>
                      {client.totalBookings}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#6B7280', margin: 0 }}>Bookings</p>
                  </div>

                  <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827', margin: 0, marginBottom: '0.125rem' }}>
                      ${client.totalSpent.toLocaleString()}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#6B7280', margin: 0 }}>Total Spent</p>
                  </div>

                  {/* Rating */}
                  <div style={{ flex: '0 0 100px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {renderStars(client.rating)}
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{client.rating}</span>
                  </div>

                  {/* Status */}
                  <div style={{ flex: '0 0 70px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: client.status === 'active' ? '#D1FAE5' : '#FEE2E2',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: client.status === 'active' ? '#065F46' : '#991B1B',
                      textTransform: 'capitalize'
                    }}>
                      {client.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.375rem' }}>
                    <Link
                      href={`/user/photographers/inbox?client=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #083A85',
                        backgroundColor: '#083A85',
                        color: 'white',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="bi bi-chat-dots"></i>
                    </Link>
                    <Link
                      href="/user/photographers/gallery"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #D1D5DB',
                        backgroundColor: 'white',
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="bi bi-image"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Detail Modal */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title="Client Details"
        maxWidth="600px"
      >
        {selectedClient && (
          <div>
            {/* Client Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Image
                src={selectedClient.profileImage}
                alt={selectedClient.firstName}
                width={80}
                height={80}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h3>
                  {selectedClient.verified && <VerifiedIcon />}
                  <button
                    onClick={() => toggleFavorite(selectedClient.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <HeartIcon filled={selectedClient.isFavorite} />
                  </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: '0.25rem 0' }}>{selectedClient.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <LocationIcon />
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                    {selectedClient.location.city}, {selectedClient.location.country}
                  </span>
                </div>
              </div>
              <div style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: selectedClient.status === 'active' ? '#D1FAE5' : '#FEE2E2',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: selectedClient.status === 'active' ? '#065F46' : '#991B1B',
                textTransform: 'capitalize'
              }}>
                {selectedClient.status}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85', margin: 0, marginBottom: '0.25rem' }}>
                  {selectedClient.totalBookings}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Bookings</p>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85', margin: 0, marginBottom: '0.25rem' }}>
                  ${selectedClient.totalSpent.toLocaleString()}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Total Spent</p>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  {renderStars(selectedClient.rating)}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>{selectedClient.reviewCount} reviews</p>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>
                  {formatDate(selectedClient.joinDate)}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Joined</p>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>Contact Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className="bi bi-envelope" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: '#374151' }}>{selectedClient.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className="bi bi-telephone" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: '#374151' }}>{selectedClient.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className="bi bi-clock" style={{ fontSize: '0.875rem', color: '#6B7280', width: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: '#374151' }}>Last active {selectedClient.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Booking History */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>Recent Bookings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedClient.bookings.map((booking) => {
                  const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                  return (
                    <div key={booking.id} style={{
                      padding: '0.75rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: '500', color: '#111827', margin: 0 }}>{booking.eventName}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.125rem 0' }}>
                          {booking.eventType} • {formatDate(booking.eventDate)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827', margin: 0 }}>${booking.totalAmount}</p>
                        <span style={{
                          backgroundColor: paymentColor.bg,
                          color: paymentColor.text,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {booking.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href={`/user/photographers/inbox?client=${encodeURIComponent(`${selectedClient.firstName} ${selectedClient.lastName}`)}`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
              >
                <i className="bi bi-chat-dots" style={{ fontSize: '1rem' }}></i>
                Send Message
              </Link>
              <Link
                href="/user/photographers/gallery"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none'
                }}
              >
                <i className="bi bi-image" style={{ fontSize: '1rem' }}></i>
                View Gallery
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
