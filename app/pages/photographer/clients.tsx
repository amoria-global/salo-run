"use client";

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';

// API helpers
function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

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
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = ({ active, activeColor = '#083A85' }: { active: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2"/>
  </svg>
);

const ListIcon = ({ active, activeColor = '#083A85' }: { active: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="6" x2="21" y2="6" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke={active ? activeColor : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const GiftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V21" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8C12 8 12 5 9 5C6 5 6 8 9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8C12 8 12 5 15 5C18 5 18 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

interface ClientReview {
  rating: number;
  reviewText: string;
  reviewDate: string;
}

interface TipBonus {
  id: string;
  amount: number;
  type: 'tip' | 'bonus';
  eventName: string;
  date: string;
  message?: string;
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
  review?: ClientReview; // Review left by the client for the photographer
  bookings: Booking[];
  tipsAndBonuses: TipBonus[];
}

type FilterType = 'all' | 'active' | 'inactive' | 'favorites' | 'pending_payments';
type ViewMode = 'grid' | 'list';
type PageTab = 'clients' | 'bookings';
type BookingsFilter = 'all' | 'pending' | 'accepted' | 'rejected';

// API Booking interface — flexible to handle various response shapes
interface APIBooking {
  id: string;
  status?: string;
  bookingStatus?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  customerName?: string;
  customerEmail?: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  address?: string;
  packageName?: string;
  totalAmount?: number;
  amount?: number;
  price?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
      <div className="mobile-modal" style={{
        backgroundColor: colors.bgCard,
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: colors.bgTertiary,
                border: `2px solid ${colors.borderPrimary}`,
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textPrimary,
                transition: 'all 0.2s'
              }}
            >
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
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { token } = useDashboardAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'bookings' | 'spent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; client: Client } | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [tipsClient, setTipsClient] = useState<Client | null>(null);

  // Page tab state
  const [pageTab, setPageTab] = useState<PageTab>('clients');

  // Bookings state
  const [bookings, setBookings] = useState<APIBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsFilter, setBookingsFilter] = useState<BookingsFilter>('all');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const response = await dashboardAuthFetch(`${getApiUrl()}/api/remote/photographer/bookings`);
      const result = await response.json();
      if (result.action === 1 && Array.isArray(result.data)) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  // Fetch bookings on mount
  useEffect(() => {
    if (token) fetchBookings();
  }, [token, fetchBookings]);

  // Accept a booking
  const acceptBooking = async (bookingId: string) => {
    if (!token) return;
    setProcessingBookingId(bookingId);
    try {
      const response = await dashboardAuthFetch(
        `${getApiUrl()}/api/remote/photographer/bookings/${bookingId}/accept`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (result.action === 1) {
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to accept booking:', error);
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Reject a booking
  const rejectBooking = async (bookingId: string) => {
    if (!token) return;
    setProcessingBookingId(bookingId);
    try {
      const response = await dashboardAuthFetch(
        `${getApiUrl()}/api/remote/photographer/bookings/${bookingId}/reject`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (result.action === 1) {
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to reject booking:', error);
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Helper to get booking status
  const getBookingStatus = (booking: APIBooking): string => {
    return (booking.status || booking.bookingStatus || 'pending').toLowerCase();
  };

  // Helper to get client display name from booking
  const getBookingClientName = (booking: APIBooking): string => {
    return booking.clientName || booking.customerName || 'Unknown Client';
  };

  // Helper to get booking amount
  const getBookingAmount = (booking: APIBooking): number => {
    return booking.totalAmount || booking.amount || booking.price || 0;
  };

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    if (bookingsFilter === 'all') return true;
    const status = getBookingStatus(b);
    if (bookingsFilter === 'pending') return status === 'pending';
    if (bookingsFilter === 'accepted') return status === 'accepted' || status === 'confirmed';
    if (bookingsFilter === 'rejected') return status === 'rejected' || status === 'cancelled';
    return true;
  });

  // Booking counts
  const pendingCount = bookings.filter(b => getBookingStatus(b) === 'pending').length;
  const acceptedCount = bookings.filter(b => ['accepted', 'confirmed'].includes(getBookingStatus(b))).length;
  const rejectedCount = bookings.filter(b => ['rejected', 'cancelled'].includes(getBookingStatus(b))).length;

  // Clients data - fetched from API
  const [clientsLoading, setClientsLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);

  const fetchClients = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const [clientsRes, favRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/clients`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/favorite-clients`),
      ]);

      let favoriteIds: string[] = [];
      if (favRes.status === 'fulfilled' && favRes.value.ok) {
        const favData = await favRes.value.json();
        if (favData.action === 1 && favData.data) {
          favoriteIds = favData.data.map((id: any) => String(id));
        }
      }

      if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
        const data = await clientsRes.value.json();
        if (data.action === 1 && data.data) {
          const clientList = Array.isArray(data.data) ? data.data : data.data.content || [];
          const mapped: Client[] = clientList.map((c: any) => ({
            id: c.id || c.customerId || String(Math.random()),
            firstName: c.firstName || c.name?.split(' ')[0] || '',
            lastName: c.lastName || c.name?.split(' ').slice(1).join(' ') || '',
            email: c.email || '',
            phone: c.phone || c.phoneNumber || '',
            profileImage: c.profileImage || c.profilePicture || c.avatar || undefined,
            coverImage: c.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
            location: {
              city: c.city || c.location?.city || '',
              country: c.country || c.location?.country || '',
            },
            totalBookings: c.totalBookings || 0,
            totalSpent: c.totalSpent || 0,
            joinDate: c.joinDate || c.createdAt || '',
            lastActive: c.lastActive || c.lastSeen || '',
            lastBookingDate: c.lastBookingDate || '',
            lastEventType: c.lastEventType || '',
            lastEventName: c.lastEventName || '',
            status: c.status === 'inactive' ? 'inactive' : 'active' as Client['status'],
            isFavorite: favoriteIds.includes(String(c.id || c.customerId)),
            verified: c.verified || c.isVerified || false,
            review: c.review || undefined,
            bookings: c.bookings || [],
            tipsAndBonuses: c.tipsAndBonuses || [],
          }));
          setClients(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    const fetchBalance = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/balance`);
        if (res.ok) {
          const data = await res.json();
          if (data.action === 1 && data.data) setBalance(data.data);
        }
      } catch (err) { console.error('Failed to fetch balance:', err); }
    };
    fetchBalance();
  }, [fetchClients]);

  const [clients, setClients] = useState<Client[]>([]);

  const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Portrait', 'Fashion', 'Concert'];

  const toggleFavorite = async (id: string) => {
    setClients(prev => prev.map(c =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/favorite-clients/${id}`, { method: 'POST' });
      if (!res.ok) {
        // Rollback on failure
        setClients(prev => prev.map(c =>
          c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
        ));
      }
    } catch {
      setClients(prev => prev.map(c =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
      ));
    }
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

  // Balance values from API
  const totalTips = balance?.totalTips || 0;
  const totalCompletedEvents = clients.reduce((sum, c) => sum + c.bookings.filter((b: any) => b.status === 'completed').length, 0);
  const bonusEligibleSets = Math.floor(totalCompletedEvents / 10);
  const platformBonus = balance?.totalBonuses || 0;
  const totalBalance = balance?.totalBalance || balance?.balance || 0;

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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
            padding-bottom: 1rem !important;
            border-bottom: 2px solid rgba(8, 58, 133, 0.1) !important;
          }
          .mobile-header-title h1 {
            font-size: 1.4rem !important;
            font-weight: 700 !important;
          }
          .mobile-header-title p {
            font-size: 0.9rem !important;
          }
          .mobile-header-controls {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.75rem !important;
            margin-bottom: 1.5rem !important;
          }
          .mobile-stats-card {
            padding: 1rem !important;
            border-radius: 1rem !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            transition: all 0.2s ease !important;
          }
          .mobile-stats-card:active {
            transform: scale(0.98);
          }
          .mobile-stats-card > div:first-child {
            font-size: 0.75rem !important;
            font-weight: 600 !important;
          }
          .mobile-stats-card > div:nth-child(2) {
            font-size: 1.25rem !important;
            font-weight: 700 !important;
          }
          .mobile-stats-card > div:last-child {
            font-size: 0.7rem !important;
          }
          .mobile-tabs {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
            margin-bottom: 1.25rem !important;
          }
          .mobile-tabs button {
            font-size: 0.85rem !important;
            padding: 0.5rem 1rem !important;
            border-radius: 0.75rem !important;
            transition: all 0.2s ease !important;
          }
          .mobile-tabs button:active {
            transform: scale(0.95);
          }
          .mobile-search-bar {
            margin-bottom: 1.25rem !important;
          }
          .mobile-search-bar input {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            border-radius: 0.75rem !important;
          }
          .mobile-clients-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-client-card {
            padding: 1rem !important;
            border-radius: 1rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }
          .mobile-client-card:active {
            transform: scale(0.98);
          }
          .mobile-modal {
            width: 95% !important;
            max-height: 85vh !important;
            padding: 1.25rem !important;
            padding-bottom: 5rem !important;
            border-radius: 1rem !important;
          }
          .mobile-modal-content {
            padding-bottom: 3rem !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          .mobile-stats-card {
            padding: 0.75rem !important;
          }
          .mobile-stats-card > div:nth-child(2) {
            font-size: 1.1rem !important;
          }
          .mobile-header-title h1 {
            font-size: 1.2rem !important;
          }
          .mobile-tabs button {
            font-size: 0.8rem !important;
            padding: 0.4rem 0.75rem !important;
          }
          .mobile-modal {
            padding: 1rem !important;
            padding-bottom: 7rem !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <Sidebar />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar tipsAmount={totalTips} bonusAmount={platformBonus} balanceAmount={totalBalance} userRole="photographer" />

        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
          {/* Header */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="mobile-header-title">
              <h1 style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600' }}>My Clients</h1>
              <p style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Clients who&apos;ve booked your services - manage relationships
              </p>
            </div>
            <div className="mobile-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                    backgroundColor: colors.bgCard,
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
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
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: colors.bgTertiary, borderRadius: '0.375rem', padding: '0.25rem' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.375rem',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: viewMode === 'grid' ? colors.bgCard : 'transparent',
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
                    backgroundColor: viewMode === 'list' ? colors.bgCard : 'transparent',
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

          {/* Page Tabs: Clients | Bookings */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { key: 'clients' as PageTab, label: 'Clients', count: clients.length },
              { key: 'bookings' as PageTab, label: 'Bookings', count: bookings.length, pendingCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setPageTab(tab.key)}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: pageTab === tab.key ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  backgroundColor: pageTab === tab.key ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                  color: pageTab === tab.key ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                  fontSize: '0.9rem',
                  fontWeight: pageTab === tab.key ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: pageTab === tab.key ? 'rgba(8, 58, 133, 0.15)' : colors.bgTertiary,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                }}>
                  {tab.count}
                </span>
                {tab.key === 'bookings' && pendingCount > 0 && (
                  <span style={{
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}>
                    {pendingCount} pending
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Clients Tab Content */}
          {pageTab === 'clients' && (<>
          {/* Stats Cards */}
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="mobile-stats-card" style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #083A85' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Clients</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.brandPrimary }}>{clients.length}</div>
            </div>
            <div className="mobile-stats-card" style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Bookings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.brandPrimary }}>
                {clients.reduce((sum, c) => sum + c.totalBookings, 0)}
              </div>
            </div>
            <div className="mobile-stats-card" style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Earned</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.brandPrimary }}>
                {formatPrice(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
              </div>
            </div>
            <div className="mobile-stats-card" style={{ backgroundColor: totalTips > 0 ? (actualTheme === 'dark' ? '#78350F' : '#FFFBEB') : colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: totalTips > 0 ? `1px solid ${actualTheme === 'dark' ? '#92400E' : '#FCD34D'}` : `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.85rem', color: totalTips > 0 ? (actualTheme === 'dark' ? '#FCD34D' : '#92400E') : colors.textSecondary, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <GiftIcon />
                Tips
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalTips > 0 ? (actualTheme === 'dark' ? '#FCD34D' : '#F59E0B') : colors.textSecondary }}>
                {formatPrice(totalTips)}
              </div>
              <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.25rem' }}>From clients</div>
            </div>
            <div className="mobile-stats-card" style={{ backgroundColor: platformBonus > 0 ? (actualTheme === 'dark' ? '#14532D' : '#F0FDF4') : colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: platformBonus > 0 ? `1px solid ${actualTheme === 'dark' ? '#166534' : '#BBF7D0'}` : `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #16A34A' }}>
              <div style={{ fontSize: '0.85rem', color: platformBonus > 0 ? (actualTheme === 'dark' ? '#4ADE80' : '#166534') : colors.textSecondary, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <GiftIcon />
                Bonus
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: platformBonus > 0 ? (actualTheme === 'dark' ? '#4ADE80' : '#16A34A') : colors.textSecondary }}>
                {formatPrice(platformBonus)}
              </div>
              <div style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.25rem' }}>{totalCompletedEvents}/10 events ({bonusEligibleSets > 0 ? '10%' : '0%'})</div>
            </div>
            <div className="mobile-stats-card" style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #F20C8F' }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F20C8F' }}>
                {clients.filter(c => c.isFavorite).length}
              </div>
            </div>
            <div className="mobile-stats-card" style={{ backgroundColor: totalPendingAmount > 0 ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEF2F2') : colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: totalPendingAmount > 0 ? `1px solid ${actualTheme === 'dark' ? '#991B1B' : '#FECACA'}` : `2px solid ${colors.borderPrimary}`, borderLeft: '4px solid #DC2626' }}>
              <div style={{ fontSize: '0.85rem', color: totalPendingAmount > 0 ? (actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C') : colors.textSecondary, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {totalPendingAmount > 0 && <AlertCircleIcon />}
                Pending Payments
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalPendingAmount > 0 ? (actualTheme === 'dark' ? '#FCA5A5' : '#DC2626') : colors.textSecondary }}>
                {formatPrice(totalPendingAmount)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mobile-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
                    : colors.bgCard,
                  color: activeFilter === tab.key ? 'white' : colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: activeFilter === tab.key
                    ? 'rgba(255,255,255,0.2)'
                    : ((tab as { alert?: boolean }).alert && tab.count > 0 ? '#FEE2E2' : colors.bgTertiary),
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
          <div className="mobile-search-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
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
                backgroundColor: showFilters ? '#083A85' : colors.bgCard,
                color: showFilters ? 'white' : colors.textSecondary,
                border: `2px solid ${colors.borderPrimary}`,
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
            <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Showing {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Clients Grid/List */}
          {clientsLoading ? (
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', border: `2px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '1rem', color: colors.textSecondary }}>Loading clients...</div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', border: `2px solid ${colors.borderPrimary}` }}>
              <UserIcon />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginTop: '1rem' }}>No clients found</h3>
              <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                {activeFilter === 'favorites' ? 'You haven\'t added any clients to favorites yet.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="mobile-clients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="mobile-client-card"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    padding: '1rem',
                    position: 'relative'
                  }}
                  onClick={() => setSelectedClient(client)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(0, 0, 0, 0.2), 0 15px 30px -10px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Header Row - Profile Image, Name, Actions */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.625rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                      </svg>
                      {client.profileImage && (
                        <img src={client.profileImage} alt={client.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.firstName} {client.lastName}
                        </h3>
                        {client.verified && <VerifiedIcon />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                        <LocationIcon />
                        <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                          {client.location.city}, {client.location.country}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                        <span style={{
                          backgroundColor: client.status === 'active'
                            ? (actualTheme === 'dark' ? '#064E3B' : '#D1FAE5')
                            : (actualTheme === 'dark' ? '#374151' : '#F3F4F6'),
                          color: client.status === 'active'
                            ? (actualTheme === 'dark' ? '#6EE7B7' : '#065F46')
                            : (actualTheme === 'dark' ? '#9CA3AF' : '#6B7280'),
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {client.status}
                        </span>
                        <span style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {client.totalBookings} booking{client.totalBookings > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(client.id); }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Add to favorites"
                    >
                      <HeartIcon filled={client.isFavorite} />
                    </button>
                  </div>

                  {/* Quick Stats Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: colors.bgTertiary, borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Last: {client.lastEventType}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>{formatDate(client.lastBookingDate)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Total Spent</div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(client.totalSpent)}</div>
                    </div>
                  </div>

                  {/* Review - Compact */}
                  {client.review ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                        {renderStars(client.review.rating)}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: '500' }}>Reviewed</span>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>No review yet</span>
                    </div>
                  )}

                    {/* Payment Status for Bookings */}
                    {client.bookings.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        {client.bookings.slice(0, 2).map((booking) => {
                          const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                          const amountDue = booking.totalAmount - booking.paidAmount;
                          const isPaid = booking.paymentStatus === 'paid';
                          const isPending = booking.paymentStatus === 'pending';
                          const isPartiallyPaid = booking.paymentStatus === 'partially_paid';
                          const isFailed = booking.paymentStatus === 'failed';

                          const containerBg = isPaid
                            ? (actualTheme === 'dark' ? '#064E3B' : '#DCFCE7')
                            : isPending
                            ? (actualTheme === 'dark' ? '#78350F' : '#FEF3C7')
                            : isPartiallyPaid
                            ? (actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                            : isFailed
                            ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2')
                            : (actualTheme === 'dark' ? colors.bgTertiary : '#F9FAFB');
                          const containerBorder = isPaid
                            ? (actualTheme === 'dark' ? '#10B981' : '#86EFAC')
                            : isPending
                            ? (actualTheme === 'dark' ? '#F59E0B' : '#FCD34D')
                            : isPartiallyPaid
                            ? (actualTheme === 'dark' ? '#3B82F6' : '#93C5FD')
                            : isFailed
                            ? (actualTheme === 'dark' ? '#EF4444' : '#FCA5A5')
                            : (actualTheme === 'dark' ? colors.borderPrimary : '#E5E7EB');
                          const textColor = isPaid
                            ? (actualTheme === 'dark' ? '#6EE7B7' : '#15803D')
                            : isPending
                            ? (actualTheme === 'dark' ? '#FCD34D' : '#92400E')
                            : isPartiallyPaid
                            ? (actualTheme === 'dark' ? '#93C5FD' : '#1E40AF')
                            : isFailed
                            ? (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B')
                            : (actualTheme === 'dark' ? colors.textSecondary : '#6B7280');

                          return (
                            <div key={booking.id} style={{
                              padding: '0.375rem 0.5rem',
                              backgroundColor: containerBg,
                              borderRadius: '0.375rem',
                              border: `1px solid ${containerBorder}`,
                              marginBottom: '0.25rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '0.85rem', color: textColor, fontWeight: '500' }}>{booking.eventName}</div>
                                  <span style={{
                                    backgroundColor: paymentColor.bg,
                                    color: paymentColor.text,
                                    padding: '0.0625rem 0.25rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                  }}>
                                    {booking.paymentStatus.replace('_', ' ')}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: textColor }}>
                                  {isPaid ? formatPrice(booking.totalAmount) : `${formatPrice(amountDue)} due`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Buttons - Compact */}
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Link
                        href={`/user/photographer/inbox?client=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '0.375rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #062a63',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          textDecoration: 'none'
                        }}
                      >
                        <i className="bi bi-chat-dots" style={{ fontSize: '0.9rem' }}></i>
                        Message
                      </Link>
                      <Link
                        href="/user/photographer/events"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '0.375rem',
                          borderRadius: '0.375rem',
                          border: `2px solid ${colors.borderSecondary}`,
                          backgroundColor: colors.bgCard,
                          color: colors.textSecondary,
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          textDecoration: 'none'
                        }}
                      >
                        <i className="bi bi-image" style={{ fontSize: '0.9rem' }}></i>
                        Gallery
                      </Link>
                    </div>

                    {/* Tips Button - Compact */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTipsClient(client);
                        setShowTipsModal(true);
                      }}
                      style={{
                        width: '100%',
                        marginTop: '0.375rem',
                        padding: '0.375rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #C0096D',
                        backgroundColor: '#F20C8F',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <GiftIcon />
                      Tips: {client.tipsAndBonuses.filter(t => t.type === 'tip').length > 0
                        ? formatPrice(client.tipsAndBonuses.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0))
                        : 'None'
                      }
                    </button>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '1rem',
                    padding: '1rem',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 35px 60px -15px rgba(0, 0, 0, 0.2), 0 15px 30px -10px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.borderColor = '#083A85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                    </svg>
                    {client.profileImage && (
                      <img src={client.profileImage} alt={client.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>

                  {/* Name & Location */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: colors.textPrimary,
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
                      <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                        {client.location.city}, {client.location.country}
                      </span>
                    </div>
                  </div>

                  {/* Last Booking */}
                  <div style={{ flex: '0 0 180px' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: '500', color: colors.textPrimary, margin: 0, marginBottom: '0.125rem' }}>
                      {client.lastEventName}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>
                      {client.lastEventType} • {formatDate(client.lastBookingDate)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', margin: 0, marginBottom: '0.125rem' }}>
                      {client.totalBookings}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>Bookings</p>
                  </div>

                  <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.125rem' }}>
                      {formatPrice(client.totalSpent)}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0 }}>Total Spent</p>
                  </div>

                  {/* Payment Status */}
                  <div style={{ flex: '0 0 110px', textAlign: 'center' }}>
                    {(() => {
                      const latestBooking = client.bookings[0];
                      if (!latestBooking) return <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>No bookings</span>;

                      const paymentColor = getPaymentStatusColor(latestBooking.paymentStatus);
                      return (
                        <div style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: paymentColor.bg,
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: paymentColor.text,
                          textTransform: 'capitalize'
                        }}>
                          {latestBooking.paymentStatus.replace('_', ' ')}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Client's Review */}
                  <div style={{ flex: '0 0 140px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {client.review ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {renderStars(client.review.rating)}
                        <span style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE',
                          color: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          Reviewed
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>No review</span>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ flex: '0 0 70px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: client.status === 'active'
                        ? (actualTheme === 'dark' ? '#064E3B' : '#D1FAE5')
                        : (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2'),
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: client.status === 'active'
                        ? (actualTheme === 'dark' ? '#6EE7B7' : '#065F46')
                        : (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B'),
                      textTransform: 'capitalize'
                    }}>
                      {client.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.375rem' }}>
                    <Link
                      href={`/user/photographer/inbox?client=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #062a63',
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
                      href="/user/photographer/events"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: '0.375rem',
                        border: `2px solid ${colors.borderSecondary}`,
                        backgroundColor: colors.bgCard,
                        color: colors.textSecondary,
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

                  {/* Tips */}
                  <div style={{ flex: '0 0 100px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTipsClient(client);
                        setShowTipsModal(true);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #C0096D',
                        backgroundColor: '#F20C8F',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <GiftIcon />
                      Tips: {client.tipsAndBonuses.filter(t => t.type === 'tip').length > 0
                        ? formatPrice(client.tipsAndBonuses.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0))
                        : 'None'
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>)}

          {/* Bookings Tab Content */}
          {pageTab === 'bookings' && (
            <div>
              {/* Bookings Filter Tabs */}
              <div className="mobile-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {([
                  { key: 'all' as BookingsFilter, label: 'All', count: bookings.length },
                  { key: 'pending' as BookingsFilter, label: 'Pending', count: pendingCount },
                  { key: 'accepted' as BookingsFilter, label: 'Accepted', count: acceptedCount },
                  { key: 'rejected' as BookingsFilter, label: 'Rejected', count: rejectedCount },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setBookingsFilter(tab.key)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: bookingsFilter === tab.key ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                      borderRadius: '2rem',
                      backgroundColor: bookingsFilter === tab.key ? '#083A85' : colors.bgCard,
                      color: bookingsFilter === tab.key ? 'white' : colors.textSecondary,
                      fontSize: '0.85rem',
                      fontWeight: bookingsFilter === tab.key ? '600' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                    <span style={{
                      backgroundColor: bookingsFilter === tab.key ? 'rgba(255,255,255,0.2)' : colors.bgTertiary,
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bookings List */}
              {bookingsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      backgroundColor: colors.bgCard,
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}>
                      <div style={{ height: '1rem', width: '40%', backgroundColor: colors.bgTertiary, borderRadius: '0.25rem', marginBottom: '0.75rem' }} />
                      <div style={{ height: '0.875rem', width: '60%', backgroundColor: colors.bgTertiary, borderRadius: '0.25rem', marginBottom: '0.5rem' }} />
                      <div style={{ height: '0.875rem', width: '30%', backgroundColor: colors.bgTertiary, borderRadius: '0.25rem' }} />
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  padding: '3rem',
                  textAlign: 'center',
                  border: `2px solid ${colors.borderPrimary}`,
                }}>
                  <CalendarIcon />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, marginTop: '1rem' }}>
                    No bookings found
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginTop: '0.5rem' }}>
                    {bookingsFilter === 'pending'
                      ? 'No pending bookings to review.'
                      : bookingsFilter === 'accepted'
                      ? 'No accepted bookings yet.'
                      : bookingsFilter === 'rejected'
                      ? 'No rejected bookings.'
                      : 'You don\'t have any bookings yet. They will appear here when clients book your services.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredBookings.map(booking => {
                    const status = getBookingStatus(booking);
                    const isPending = status === 'pending';
                    const isProcessing = processingBookingId === booking.id;
                    const statusColors: Record<string, { bg: string; text: string }> = {
                      pending: { bg: '#FEF3C7', text: '#B45309' },
                      accepted: { bg: '#DCFCE7', text: '#15803D' },
                      confirmed: { bg: '#DCFCE7', text: '#15803D' },
                      rejected: { bg: '#FEE2E2', text: '#DC2626' },
                      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
                    };
                    const sc = statusColors[status] || { bg: '#F3F4F6', text: '#6B7280' };

                    return (
                      <div key={booking.id} style={{
                        backgroundColor: colors.bgCard,
                        borderRadius: '0.75rem',
                        padding: '1.25rem',
                        border: `1px solid ${isPending ? '#FCD34D' : colors.borderPrimary}`,
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                              {getBookingClientName(booking)}
                            </h4>
                            {(booking.eventType || booking.packageName) && (
                              <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                                {[booking.eventType, booking.packageName].filter(Boolean).join(' - ')}
                              </p>
                            )}
                          </div>
                          <span style={{
                            backgroundColor: sc.bg,
                            color: sc.text,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                          }}>
                            {status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
                          {booking.eventDate && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CalendarIcon /> {new Date(booking.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {booking.eventTime && ` at ${booking.eventTime}`}
                            </span>
                          )}
                          {(booking.location || booking.address) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <LocationIcon /> {booking.location || booking.address}
                            </span>
                          )}
                          {getBookingAmount(booking) > 0 && (
                            <span style={{ fontWeight: '600', color: colors.textPrimary }}>
                              {formatPrice(getBookingAmount(booking))}
                            </span>
                          )}
                        </div>

                        {booking.notes && (
                          <p style={{ fontSize: '0.85rem', color: colors.textTertiary, marginBottom: '0.75rem', fontStyle: 'italic' }}>
                            &ldquo;{booking.notes}&rdquo;
                          </p>
                        )}

                        {booking.createdAt && (
                          <p style={{ fontSize: '0.75rem', color: colors.textTertiary, marginBottom: isPending ? '0.75rem' : 0 }}>
                            Booked {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}

                        {isPending && (
                          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: `2px solid ${colors.borderPrimary}` }}>
                            <button
                              onClick={() => acceptBooking(booking.id)}
                              disabled={isProcessing}
                              style={{
                                flex: 1,
                                padding: '0.625rem 1rem',
                                backgroundColor: isProcessing ? '#9CA3AF' : '#15803D',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {isProcessing ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => rejectBooking(booking.id)}
                              disabled={isProcessing}
                              style={{
                                flex: 1,
                                padding: '0.625rem 1rem',
                                backgroundColor: 'transparent',
                                color: '#DC2626',
                                border: '2px solid #DC2626',
                                borderRadius: '0.5rem',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isProcessing ? 0.5 : 1,
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                </svg>
                {selectedClient.profileImage && (
                  <img src={selectedClient.profileImage} alt={selectedClient.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
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
                <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0.25rem 0' }}>{selectedClient.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <LocationIcon />
                  <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                    {selectedClient.location.city}, {selectedClient.location.country}
                  </span>
                </div>
              </div>
              <div style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: selectedClient.status === 'active'
                  ? (actualTheme === 'dark' ? '#064E3B' : '#D1FAE5')
                  : (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2'),
                fontSize: '0.8rem',
                fontWeight: '600',
                color: selectedClient.status === 'active'
                  ? (actualTheme === 'dark' ? '#6EE7B7' : '#065F46')
                  : (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B'),
                textTransform: 'capitalize'
              }}>
                {selectedClient.status}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: colors.bgTertiary, padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', margin: 0, marginBottom: '0.25rem' }}>
                  {selectedClient.totalBookings}
                </p>
                <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: 0 }}>Bookings</p>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', margin: 0, marginBottom: '0.25rem' }}>
                  {formatPrice(selectedClient.totalSpent)}
                </p>
                <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: 0 }}>Total Spent</p>
              </div>
              <div style={{ backgroundColor: colors.bgTertiary, padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, margin: 0, marginBottom: '0.25rem' }}>
                  {formatDate(selectedClient.joinDate)}
                </p>
                <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: 0 }}>Joined</p>
              </div>
            </div>

            {/* Client's Review */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Review for You</h4>
              {selectedClient.review ? (
                <div style={{ padding: '1rem', backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF', borderRadius: '0.5rem', border: `1px solid ${actualTheme === 'dark' ? '#2563EB' : '#BFDBFE'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                      {renderStars(selectedClient.review.rating)}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8' }}>
                      {selectedClient.review.rating}/5
                    </span>
                    <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                      {formatDate(selectedClient.review.reviewDate)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: colors.textPrimary, margin: 0, lineHeight: '1.5' }}>
                    &ldquo;{selectedClient.review.reviewText}&rdquo;
                  </p>
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: '#9CA3AF', margin: 0 }}>
                    This client has not left a review yet
                  </p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Contact Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className="bi bi-envelope" style={{ fontSize: '0.875rem', color: colors.textSecondary, width: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: colors.textPrimary }}>{selectedClient.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className="bi bi-telephone" style={{ fontSize: '0.875rem', color: colors.textSecondary, width: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: colors.textPrimary }}>{selectedClient.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className="bi bi-clock" style={{ fontSize: '0.875rem', color: colors.textSecondary, width: '1rem' }}></i>
                  <span style={{ fontSize: '0.85rem', color: colors.textPrimary }}>Last active {selectedClient.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Booking History */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>Recent Bookings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedClient.bookings.map((booking) => {
                  const paymentColor = getPaymentStatusColor(booking.paymentStatus);
                  const amountDue = booking.totalAmount - booking.paidAmount;
                  const isPaid = booking.paymentStatus === 'paid';
                  const isPending = booking.paymentStatus === 'pending';
                  const isPartiallyPaid = booking.paymentStatus === 'partially_paid';
                  const isFailed = booking.paymentStatus === 'failed';

                  // Determine container background and border color based on status
                  const containerBg = isPaid
                    ? (actualTheme === 'dark' ? '#064E3B' : '#DCFCE7')
                    : isPending
                    ? (actualTheme === 'dark' ? '#78350F' : '#FEF3C7')
                    : isPartiallyPaid
                    ? (actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                    : isFailed
                    ? (actualTheme === 'dark' ? '#7F1D1D' : '#FEE2E2')
                    : (actualTheme === 'dark' ? colors.bgTertiary : '#F9FAFB');
                  const containerBorder = isPaid
                    ? (actualTheme === 'dark' ? '#10B981' : '#86EFAC')
                    : isPending
                    ? (actualTheme === 'dark' ? '#F59E0B' : '#FCD34D')
                    : isPartiallyPaid
                    ? (actualTheme === 'dark' ? '#3B82F6' : '#93C5FD')
                    : isFailed
                    ? (actualTheme === 'dark' ? '#EF4444' : '#FCA5A5')
                    : (actualTheme === 'dark' ? colors.borderPrimary : '#E5E7EB');
                  const textColor = isPaid
                    ? (actualTheme === 'dark' ? '#6EE7B7' : '#15803D')
                    : isPending
                    ? (actualTheme === 'dark' ? '#FCD34D' : '#92400E')
                    : isPartiallyPaid
                    ? (actualTheme === 'dark' ? '#93C5FD' : '#1E40AF')
                    : isFailed
                    ? (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B')
                    : (actualTheme === 'dark' ? colors.textPrimary : '#111827');

                  return (
                    <div key={booking.id} style={{
                      padding: '0.75rem',
                      backgroundColor: containerBg,
                      borderRadius: '0.5rem',
                      border: `1px solid ${containerBorder}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: '500', color: textColor, margin: 0 }}>{booking.eventName}</p>
                        <p style={{ fontSize: '0.75rem', color: isPaid ? (actualTheme === 'dark' ? '#34D399' : '#166534') : isPending ? (actualTheme === 'dark' ? '#FBBF24' : '#A16207') : isPartiallyPaid ? (actualTheme === 'dark' ? '#60A5FA' : '#1E40AF') : isFailed ? (actualTheme === 'dark' ? '#F87171' : '#991B1B') : colors.textSecondary, margin: '0.125rem 0' }}>
                          {booking.eventType} • {formatDate(booking.eventDate)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: textColor, margin: 0 }}>
                          {isPaid ? formatPrice(booking.totalAmount) : `${formatPrice(amountDue)} due`}
                        </p>
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
                href={`/user/photographer/inbox?client=${encodeURIComponent(`${selectedClient.firstName} ${selectedClient.lastName}`)}`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
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
                href="/user/photographer/events"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderSecondary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
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

      {/* Tips Modal */}
      <Modal
        isOpen={showTipsModal && !!tipsClient}
        onClose={() => {
          setShowTipsModal(false);
          setTipsClient(null);
        }}
        title="Tips from Client"
        maxWidth="500px"
      >
        {tipsClient && (
          <div>
            {/* Client Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              padding: '0.75rem',
              backgroundColor: colors.bgTertiary,
              borderRadius: '0.5rem'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                </svg>
                {tipsClient.profileImage && (
                  <img src={tipsClient.profileImage} alt={tipsClient.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '0.95rem' }}>
                  {tipsClient.firstName} {tipsClient.lastName}
                </div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                  {tipsClient.location.city}, {tipsClient.location.country}
                </div>
              </div>
            </div>

            {/* Total Summary - Only Tips */}
            <div style={{
              backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7',
              borderRadius: '0.5rem',
              padding: '1rem',
              textAlign: 'center',
              border: `1px solid ${actualTheme === 'dark' ? '#92400E' : '#FCD34D'}`,
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#FCD34D' : '#B45309' }}>
                ${tipsClient.tipsAndBonuses.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0)}
              </div>
              <div style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#FBBF24' : '#92400E' }}>Total Tips Received</div>
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                {tipsClient.tipsAndBonuses.filter(t => t.type === 'tip').length} tip{tipsClient.tipsAndBonuses.filter(t => t.type === 'tip').length !== 1 ? 's' : ''} from this client
              </div>
            </div>

            {/* Tips List */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
                Tips History
              </h4>
              {tipsClient.tipsAndBonuses.filter(t => t.type === 'tip').length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tipsClient.tipsAndBonuses.filter(t => t.type === 'tip').map((item) => (
                    <div key={item.id} style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FFFBEB',
                      border: `1px solid ${actualTheme === 'dark' ? '#92400E' : '#FCD34D'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            backgroundColor: actualTheme === 'dark' ? '#92400E' : '#FEF3C7',
                            color: actualTheme === 'dark' ? '#FCD34D' : '#B45309',
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            TIP
                          </span>
                          <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: actualTheme === 'dark' ? '#FCD34D' : '#B45309'
                        }}>
                          +${item.amount}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        {item.eventName}
                      </div>
                      {item.message && (
                        <p style={{
                          fontSize: '0.8rem',
                          color: colors.textSecondary,
                          margin: 0,
                          fontStyle: 'italic'
                        }}>
                          &ldquo;{item.message}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  backgroundColor: colors.bgTertiary,
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                    <GiftIcon />
                  </div>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0 }}>
                    No tips from this client yet
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setShowTipsModal(false);
                  setTipsClient(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
