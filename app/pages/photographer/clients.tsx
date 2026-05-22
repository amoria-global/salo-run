"use client";

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import SortDropdown from '../../components/SortDropdown';

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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  profileImage?: string;
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

// API Booking interface. flexible to handle various response shapes
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
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }} onClick={onClose}>
      <div className="mobile-modal" style={{
        position: 'relative',
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        padding: '1.5rem',
        paddingTop: 'calc(1.5rem + 3px)',
        maxWidth: maxWidth,
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
        border: `1px solid ${colors.borderPrimary}`,
      }} onClick={(e) => e.stopPropagation()}>
        <span aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
        }} />
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: colors.bgTertiary,
                border: `1px solid ${colors.borderPrimary}`,
                cursor: 'pointer',
                width: 30, height: 30,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textSecondary,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.color = colors.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: 13 }} />
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
  const { token, user } = useDashboardAuth();
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
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Page tab state
  const [pageTab, setPageTab] = useState<PageTab>('clients');

  // Bookings state
  const [bookings, setBookings] = useState<APIBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsFilter, setBookingsFilter] = useState<BookingsFilter>('all');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  // Fetch bookings on mount
  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  // Accept a booking
  const acceptBooking = async (bookingId: string) => {
    if (!user) return;
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
    if (!user) return;
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
      const [clientsRes, convRes, favRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/clients`),
        dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/favorite-clients`),
      ]);

      let favoriteIds: string[] = [];
      if (favRes.status === 'fulfilled' && favRes.value.ok) {
        const favData = await favRes.value.json();
        if (favData.action === 1 && favData.data) {
          favoriteIds = favData.data.map((id: any) => String(id));
        }
      }

      const normalizeImg = (url: string | undefined): string | undefined => normalizeImageUrl(url);
      let clientsMapped: Client[] = [];

      // Primary: use /photographer/clients (populated once backend deploys booking-based logic)
      if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
        const data = await clientsRes.value.json().catch(() => null);
        if (data?.data) {
          const clientList = Array.isArray(data.data) ? data.data : data.data.content || [];
          clientsMapped = clientList.map((c: any) => ({
            id: c.id || '',
            firstName: c.firstName || c.name?.split(' ')[0] || '',
            lastName: c.lastName || c.name?.split(' ').slice(1).join(' ') || '',
            email: c.email || '',
            phone: c.phone || c.phoneNumber || '',
            profileImage: normalizeImg(c.profilePicture || c.profileImage || undefined),
            coverImage: normalizeImg(c.coverImage || undefined) || '',
            location: {
              city: c.city || c.location?.city || '',
              country: c.country || c.location?.country || '',
            },
            totalBookings: c.totalBookings || 0,
            totalSpent: c.totalSpent || 0,
            joinDate: c.firstContactedAt || c.joinDate || c.createdAt || '',
            lastActive: c.firstContactedAt || c.lastActive || c.lastSeen || '',
            lastBookingDate: c.lastBookingDate || '',
            lastEventType: c.lastEventType || '',
            lastEventName: c.lastEventName || '',
            status: c.status === 'inactive' ? 'inactive' : 'active' as Client['status'],
            isFavorite: favoriteIds.includes(String(c.id)),
            verified: c.verified || c.isVerified || false,
            review: c.review || undefined,
            bookings: c.bookings || [],
            tipsAndBonuses: c.tipsAndBonuses || [],
          }));
        }
      }

      // Fallback: derive from chat conversations until backend deploys new /clients endpoint
      if (clientsMapped.length === 0 && convRes.status === 'fulfilled' && convRes.value.ok) {
        const convData = await convRes.value.json().catch(() => null);
        const convList = convData?.data || convData || [];
        if (Array.isArray(convList)) {
          const currentId = user?.id || '';
          clientsMapped = convList.map((conv: any) => {
            const partner = conv.participants?.find((p: any) => p.id !== currentId) || {};
            const pName = partner.name || conv.partnerName || conv.name || 'Client';
            const nameParts = pName.split(' ');
            return {
              id: partner.id || conv.partnerId || conv.id || '',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: '',
              phone: '',
              profileImage: normalizeImg(partner.image || conv.partnerImage || conv.image || undefined),
              coverImage: '',
              location: { city: '', country: '' },
              totalBookings: 0,
              totalSpent: 0,
              joinDate: '',
              lastActive: conv.lastMessage?.createdAt || '',
              lastBookingDate: '',
              lastEventType: '',
              lastEventName: '',
              status: 'active' as Client['status'],
              isFavorite: favoriteIds.includes(String(partner.id || conv.partnerId || conv.id)),
              verified: false,
              review: undefined,
              bookings: [],
              tipsAndBonuses: [],
            };
          });
        }
      }

      // Newest-added first. joinDate is mapped from firstContactedAt / joinDate / createdAt.
      clientsMapped.sort((a, b) => {
        const ta = a.joinDate ? new Date(a.joinDate).getTime() : 0;
        const tb = b.joinDate ? new Date(b.joinDate).getTime() : 0;
        return tb - ta;
      });
      setClients(clientsMapped);
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

  const deleteClient = async (id: string) => {
    setDeleting(true);
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id));
        if (selectedClient?.id === id) setSelectedClient(null);
        setDeleteConfirmClient(null);
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const totalBalance = balance?.availableBalance || 0;

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
        <Topbar userRole="photographer" />

        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: colors.bgPrimary, paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
          {/* Header */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', margin: '8px 0 22px' }}>
            <div className="mobile-header-title" style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>RELATIONSHIPS</div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: colors.textPrimary }}>My clients</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: colors.textSecondary }}>
                Manage relationships with clients who&apos;ve booked your services.
              </p>
            </div>
            <div className="mobile-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Sort Dropdown */}
              <SortDropdown
                value={`${sortBy}-${sortOrder}`}
                onChange={(v) => {
                  const [newSort, newOrder] = v.split('-');
                  setSortBy(newSort as typeof sortBy);
                  setSortOrder(newOrder as typeof sortOrder);
                }}
                options={[
                  { value: 'recent-desc', label: 'Most Recent', icon: 'bi-clock-history' },
                  { value: 'recent-asc', label: 'Oldest First', icon: 'bi-clock' },
                  { value: 'bookings-desc', label: 'Most Bookings', icon: 'bi-calendar-event-fill' },
                  { value: 'spent-desc', label: 'Highest Spent', icon: 'bi-cash-stack' },
                ]}
                minWidth={170}
              />
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
          <div className="ck-tabs" style={{ marginBottom: '1.5rem' }}>
            {[
              { key: 'clients' as PageTab, label: 'Clients', count: clients.length },
              { key: 'bookings' as PageTab, label: 'Bookings', count: bookings.length, pendingCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setPageTab(tab.key)}
                className={`ck-tab ${pageTab === tab.key ? 'is-active' : ''}`}
              >
                <span>{tab.label}</span>
                <span style={{
                  marginLeft: 6,
                  backgroundColor: pageTab === tab.key ? 'rgba(255,255,255,0.22)' : 'rgba(8,58,133,0.10)',
                  color: pageTab === tab.key ? '#fff' : '#083A85',
                  padding: '0.06rem 0.42rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}>
                  {tab.count}
                </span>
                {tab.key === 'bookings' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 4,
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    padding: '0.06rem 0.42rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
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
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {(() => {
              const totalBookingsCount = clients.reduce((sum, c) => sum + c.totalBookings, 0);
              const totalEarnedAmt = clients.reduce((sum, c) => sum + c.totalSpent, 0);
              const favoritesCount = clients.filter(c => c.isFavorite).length;
              const cards: Array<{
                label: string;
                value: string;
                accent: string;
                tint: string;
                icon: string;
                helper?: string;
                alert?: boolean;
              }> = [
                { label: 'Total Clients',   value: String(clients.length),         accent: '#083A85', tint: 'rgba(8,58,133,0.10)',  icon: 'bi-people-fill' },
                { label: 'Total Bookings',  value: String(totalBookingsCount),     accent: '#3B82F6', tint: 'rgba(59,130,246,0.12)', icon: 'bi-calendar-check-fill' },
                { label: 'Total Earned',    value: formatPrice(totalEarnedAmt),    accent: '#10B981', tint: 'rgba(16,185,129,0.12)', icon: 'bi-cash-stack' },
                { label: 'Tips',            value: formatPrice(totalTips),         accent: '#F59E0B', tint: 'rgba(245,158,11,0.12)', icon: 'bi-gift-fill', helper: 'From clients' },
                { label: 'Bonus',           value: formatPrice(platformBonus),     accent: '#16A34A', tint: 'rgba(22,163,74,0.12)',  icon: 'bi-award-fill', helper: `${totalCompletedEvents}/10 events (${bonusEligibleSets > 0 ? '10%' : '0%'})` },
                { label: 'Favorites',       value: String(favoritesCount),         accent: '#F20C8F', tint: 'rgba(242,12,143,0.12)', icon: 'bi-heart-fill' },
                { label: 'Pending Payments',value: formatPrice(totalPendingAmount),accent: '#DC2626', tint: 'rgba(220,38,38,0.12)',  icon: 'bi-exclamation-triangle-fill', alert: totalPendingAmount > 0 },
              ];
              return cards.map((stat) => (
                <div
                  key={stat.label}
                  className="ck-card mobile-stats-card"
                  style={{ position: 'relative', overflow: 'hidden', padding: '14px 14px 14px' }}
                >
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${stat.accent} 0%, #F20C8F 130%)`,
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: stat.tint,
                      border: `1px solid ${stat.accent}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className={`bi ${stat.icon}`} style={{ fontSize: 14, color: stat.accent }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: colors.textSecondary, marginBottom: 1, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.alert ? stat.accent : colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.value}</div>
                    </div>
                  </div>
                  {stat.helper && (
                    <div style={{ fontSize: '0.66rem', color: colors.textSecondary, marginTop: 8, fontWeight: 500 }}>{stat.helper}</div>
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Tabs */}
          <div className="ck-tabs mobile-tabs" style={{ marginBottom: '1.25rem' }}>
            {[
              { key: 'all', label: 'All Clients', count: clients.length },
              { key: 'active', label: 'Active', count: clients.filter(c => c.status === 'active').length },
              { key: 'favorites', label: 'Favorites', count: clients.filter(c => c.isFavorite).length },
              { key: 'pending_payments', label: 'Pending Payments', count: clientsWithPendingPayments.length, alert: true }
            ].map((tab) => {
              const isAlert = (tab as { alert?: boolean }).alert === true;
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as FilterType)}
                  className={`ck-tab ${isActive ? 'is-active' : ''}`}
                  style={isActive && isAlert ? { background: '#F20C8F', color: '#fff', borderColor: '#F20C8F' } : undefined}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    marginLeft: 6,
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.22)'
                      : (isAlert && tab.count > 0 ? '#FEE2E2' : 'rgba(8,58,133,0.10)'),
                    color: isActive
                      ? '#fff'
                      : (isAlert && tab.count > 0 ? '#DC2626' : '#083A85'),
                    padding: '0.06rem 0.42rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="mobile-search-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            {/* Search */}
            <div className="ck-search" style={{ flex: 1 }}>
              <i className="bi bi-search" />
              <input
                type="search"
                placeholder="Search your clients…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'ck-btn ck-btn-primary' : 'ck-btn ck-btn-soft'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              aria-pressed={showFilters}
            >
              <FilterIcon />
              Filters
            </button>
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '0.2rem 0.55rem',
              background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
              border: '1px solid rgba(8,58,133,0.18)',
              borderRadius: 9999,
              fontSize: '0.7rem',
              fontWeight: 700,
              color: actualTheme === 'dark' ? '#BFDBFE' : '#083A85',
              letterSpacing: '-0.005em',
            }}>
              <i className="bi bi-people-fill" style={{ fontSize: 10, color: '#F20C8F' }} />
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Clients Grid/List */}
          {clientsLoading ? (
            <div className="ck-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="ck-spinner" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.95rem', color: colors.textSecondary, fontWeight: 500 }}>Loading clients…</div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="ck-empty ck-card" style={{
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
                <i className="bi bi-people" style={{ fontSize: 26, color: '#083A85' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>No clients found</div>
                <p style={{ margin: '4px auto 0', fontSize: '0.9rem', color: colors.textSecondary, maxWidth: 420, lineHeight: 1.5 }}>
                  {activeFilter === 'favorites'
                    ? "You haven't added any clients to favorites yet. Star a client from their profile to see them here."
                    : 'Try adjusting your search or filters. Clients appear here once they book your services.'}
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="mobile-clients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {filteredClients.map((client, idx) => (
                <div
                  key={`${client.id}-${idx}`}
                  className="mobile-client-card"
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.10)',
                    border: `1px solid ${colors.borderPrimary}`,
                    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                    cursor: 'pointer',
                    padding: '1rem',
                    position: 'relative',
                  }}
                  onClick={() => setSelectedClient(client)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 38px -16px rgba(8,58,133,0.22)';
                    e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px -6px rgba(8, 58, 133, 0.10)';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                  }}
                >
                  {/* Header Row - Profile Image, Name, Actions */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.7rem' }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      padding: 2,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(8,58,133,0.20)',
                    }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        overflow: 'hidden', position: 'relative',
                        backgroundColor: colors.bgCard,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        {client.profileImage && (
                          <img src={client.profileImage} alt={client.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.firstName} {client.lastName}
                        </h3>
                        {client.verified && <VerifiedIcon />}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: '0.78rem', color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        <i className="bi bi-geo-alt-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                        {(client.location.city || client.location.country)
                          ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {client.location.city}{client.location.city && client.location.country ? ', ' : ''}{client.location.country}
                            </span>
                          : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Location not set</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          background: client.status === 'active'
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF'),
                          color: 'white',
                          padding: '0.18rem 0.5rem',
                          borderRadius: 9999,
                          fontSize: '0.6rem', fontWeight: 800,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          boxShadow: client.status === 'active' ? '0 3px 8px rgba(16,185,129,0.30)' : 'none',
                        }}>
                          {client.status === 'active' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }} />}
                          {client.status}
                        </span>
                        <span style={{
                          background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
                          color: actualTheme === 'dark' ? '#BFDBFE' : '#083A85',
                          padding: '0.18rem 0.55rem',
                          borderRadius: 9999,
                          fontSize: '0.66rem', fontWeight: 700,
                          letterSpacing: '-0.005em',
                          border: '1px solid rgba(8,58,133,0.18)',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <i className="bi bi-calendar-event-fill" style={{ fontSize: 9, color: '#F20C8F' }} />
                          {client.totalBookings} booking{client.totalBookings > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(client.id); }}
                        title={client.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: client.isFavorite
                            ? 'linear-gradient(135deg, #F20C8F 0%, #DB0A7F 100%)'
                            : colors.bgTertiary,
                          border: client.isFavorite ? 'none' : `1px solid ${colors.borderPrimary}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: client.isFavorite ? '#fff' : '#F20C8F',
                          boxShadow: client.isFavorite ? '0 4px 10px rgba(242,12,143,0.32)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        <i className={`bi ${client.isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: 12 }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmClient(client); }}
                        title="Remove client"
                        style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: colors.bgTertiary,
                          border: `1px solid ${colors.borderPrimary}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: colors.textSecondary,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgTertiary; e.currentTarget.style.color = colors.textSecondary; e.currentTarget.style.borderColor = colors.borderPrimary; }}
                      >
                        <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    background: actualTheme === 'dark'
                      ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                      : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
                    border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
                    borderRadius: 11,
                    marginBottom: '0.6rem',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <span aria-hidden style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                      background: 'linear-gradient(180deg, #083A85 0%, #F20C8F 100%)',
                    }} />
                    <div style={{ paddingLeft: 6, minWidth: 0 }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>
                        {client.lastEventType ? `Last · ${client.lastEventType}` : 'First Contact'}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.005em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className="bi bi-calendar3" style={{ fontSize: 10, color: colors.textSecondary }} />
                        {formatDate(client.lastBookingDate || client.joinDate)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Total Spent</div>
                      <div style={{
                        fontSize: '1.02rem', fontWeight: 800,
                        letterSpacing: '-0.01em',
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>{formatPrice(client.totalSpent)}</div>
                    </div>
                  </div>

                  {/* Review - Compact */}
                  {client.review ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '0.3rem 0.6rem',
                      background: actualTheme === 'dark' ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.08)',
                      border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.30)' : 'rgba(251,191,36,0.25)'}`,
                      borderRadius: 9999,
                      marginBottom: '0.6rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {renderStars(client.review.rating)}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: actualTheme === 'dark' ? '#FBBF24' : '#B45309', fontWeight: 700, letterSpacing: '-0.005em' }}>Reviewed</span>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.74rem', color: colors.textSecondary, fontStyle: 'italic', opacity: 0.75, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className="bi bi-star" style={{ fontSize: 10 }} />
                        No review yet
                      </span>
                    </div>
                  )}

                    {/* Payment Status for Bookings */}
                    {client.bookings.length > 0 && (
                      <div style={{ marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {client.bookings.slice(0, 2).map((booking) => {
                          const amountDue = booking.totalAmount - booking.paidAmount;
                          const isPaid = booking.paymentStatus === 'paid';
                          const isPending = booking.paymentStatus === 'pending';
                          const isPartiallyPaid = booking.paymentStatus === 'partially_paid';
                          const isFailed = booking.paymentStatus === 'failed';

                          const cfg = isPaid
                            ? { stripe: 'linear-gradient(180deg, #10B981 0%, #059669 100%)', pillGrad: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', tintBg: actualTheme === 'dark' ? 'rgba(16,185,129,0.14)' : 'rgba(220,252,231,0.55)', tintBorder: actualTheme === 'dark' ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.30)', text: actualTheme === 'dark' ? '#86EFAC' : '#065F46' }
                            : isPending
                            ? { stripe: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)', pillGrad: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', tintBg: actualTheme === 'dark' ? 'rgba(245,158,11,0.14)' : 'rgba(254,243,199,0.55)', tintBorder: actualTheme === 'dark' ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.30)', text: actualTheme === 'dark' ? '#FCD34D' : '#92400E' }
                            : isPartiallyPaid
                            ? { stripe: 'linear-gradient(180deg, #083A85 0%, #F20C8F 100%)', pillGrad: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)', tintBg: actualTheme === 'dark' ? 'rgba(8,58,133,0.18)' : 'rgba(219,234,254,0.55)', tintBorder: actualTheme === 'dark' ? 'rgba(8,58,133,0.35)' : 'rgba(8,58,133,0.22)', text: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF' }
                            : isFailed
                            ? { stripe: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)', pillGrad: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', tintBg: actualTheme === 'dark' ? 'rgba(220,38,38,0.16)' : 'rgba(254,226,226,0.55)', tintBorder: actualTheme === 'dark' ? 'rgba(220,38,38,0.35)' : 'rgba(220,38,38,0.30)', text: actualTheme === 'dark' ? '#FCA5A5' : '#991B1B' }
                            : { stripe: 'linear-gradient(180deg, #9CA3AF 0%, #6B7280 100%)', pillGrad: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)', tintBg: colors.bgTertiary, tintBorder: colors.borderPrimary, text: colors.textSecondary };

                          return (
                            <div key={booking.id} style={{
                              padding: '0.5rem 0.6rem 0.5rem 0.85rem',
                              background: cfg.tintBg,
                              border: `1px solid ${cfg.tintBorder}`,
                              borderRadius: 10,
                              position: 'relative', overflow: 'hidden',
                            }}>
                              <span aria-hidden style={{
                                position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                                background: cfg.stripe,
                              }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.8rem', color: colors.textPrimary, fontWeight: 700, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.eventName}</div>
                                  <span style={{
                                    background: cfg.pillGrad,
                                    color: 'white',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: 9999,
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    display: 'inline-flex', alignItems: 'center',
                                    marginTop: 3,
                                  }}>
                                    {booking.paymentStatus.replace('_', ' ')}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: cfg.text, letterSpacing: '-0.005em', flexShrink: 0 }}>
                                  {isPaid ? formatPrice(booking.totalAmount) : `${formatPrice(amountDue)} due`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Buttons - Compact */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/user/photographer/inbox?client=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.6rem',
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          letterSpacing: '-0.005em',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          textDecoration: 'none',
                          boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(242,12,143,0.32)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(8,58,133,0.28)'; }}
                      >
                        <i className="bi bi-chat-dots-fill" style={{ fontSize: 12 }} />
                        Message
                      </Link>
                      <Link
                        href="/user/photographer/events"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.6rem',
                          borderRadius: 10,
                          border: `1px solid ${colors.borderPrimary}`,
                          background: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          letterSpacing: '-0.005em',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          textDecoration: 'none',
                          transition: 'border-color 0.15s, background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.35)'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                      >
                        <i className="bi bi-images" style={{ fontSize: 12, color: '#F20C8F' }} />
                        Gallery
                      </Link>
                    </div>

                    {/* Tips Button - Compact */}
                    {(() => {
                      const tipTotal = client.tipsAndBonuses.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0);
                      const hasTip = tipTotal > 0;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTipsClient(client);
                            setShowTipsModal(true);
                          }}
                          style={{
                            width: '100%',
                            marginTop: 6,
                            padding: '0.5rem 0.6rem',
                            borderRadius: 10,
                            border: 'none',
                            background: hasTip
                              ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                              : 'linear-gradient(135deg, #F20C8F 0%, #DB0A7F 100%)',
                            color: 'white',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            letterSpacing: '-0.005em',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxShadow: hasTip ? '0 4px 10px rgba(245,158,11,0.30)' : '0 4px 10px rgba(242,12,143,0.30)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = hasTip ? '0 8px 18px rgba(245,158,11,0.35)' : '0 8px 18px rgba(242,12,143,0.35)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = hasTip ? '0 4px 10px rgba(245,158,11,0.30)' : '0 4px 10px rgba(242,12,143,0.30)'; }}
                        >
                          <i className={`bi ${hasTip ? 'bi-gift-fill' : 'bi-gift'}`} style={{ fontSize: 12 }} />
                          {hasTip ? `Tips · ${formatPrice(tipTotal)}` : 'No tips yet'}
                        </button>
                      );
                    })()}
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredClients.map((client, idx) => (
                <div
                  key={`${client.id}-${idx}`}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: 14,
                    padding: '0.95rem 1.1rem',
                    border: `1px solid ${colors.borderPrimary}`,
                    boxShadow: '0 4px 16px -6px rgba(8, 58, 133, 0.10)',
                    cursor: 'pointer',
                    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 20px 38px -16px rgba(8,58,133,0.22)';
                    e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px -6px rgba(8, 58, 133, 0.10)';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                  }}
                >
                  {/* Avatar with brand gradient ring */}
                  <div style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
                    <div style={{
                      width: 58, height: 58, borderRadius: '50%',
                      padding: 2,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      boxShadow: '0 4px 10px rgba(8,58,133,0.18)',
                    }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        overflow: 'hidden', position: 'relative',
                        backgroundColor: colors.bgCard,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                        </svg>
                        {client.profileImage && (
                          <img src={client.profileImage} alt={client.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name & Location */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: colors.textPrimary,
                        margin: 0,
                        letterSpacing: '-0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{client.firstName} {client.lastName}</h3>
                      {client.verified && <VerifiedIcon />}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(client.id); }}
                        title={client.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: client.isFavorite ? 'linear-gradient(135deg, #F20C8F 0%, #DB0A7F 100%)' : 'transparent',
                          border: client.isFavorite ? 'none' : `1px solid ${colors.borderPrimary}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: client.isFavorite ? '#fff' : '#F20C8F',
                          marginLeft: 2,
                          boxShadow: client.isFavorite ? '0 4px 10px rgba(242,12,143,0.30)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        <i className={`bi ${client.isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: 10 }} />
                      </button>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: '0.8rem', color: colors.textSecondary, maxWidth: '100%' }}>
                      <i className="bi bi-geo-alt-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                      {(client.location.city || client.location.country)
                        ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client.location.city}{client.location.city && client.location.country ? ', ' : ''}{client.location.country}
                          </span>
                        : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Location not set</span>}
                    </div>
                  </div>

                  {/* Last Booking */}
                  <div style={{ flex: '0 0 180px', minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 1,
                    }}>Last Booking</div>
                    {client.lastEventName ? (
                      <p style={{ fontSize: '0.86rem', fontWeight: 700, color: colors.textPrimary, margin: 0, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.lastEventName}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: 0, fontStyle: 'italic', opacity: 0.7 }}>None yet</p>
                    )}
                    <p style={{ fontSize: '0.74rem', color: colors.textSecondary, margin: 0, marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {client.lastEventType && <span style={{ textTransform: 'capitalize' }}>{client.lastEventType}</span>}
                      {client.lastEventType && (client.lastBookingDate || client.joinDate) && <span style={{ opacity: 0.5 }}>•</span>}
                      <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                      {formatDate(client.lastBookingDate || client.joinDate)}
                    </p>
                  </div>

                  {/* Bookings count */}
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 1,
                    }}>Bookings</div>
                    <p style={{ fontSize: '1.05rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                      {client.totalBookings}
                    </p>
                  </div>

                  {/* Total Spent with gradient text */}
                  <div style={{ flex: '0 0 110px', textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 1,
                    }}>Total Spent</div>
                    <p style={{
                      fontSize: '1.02rem', fontWeight: 800,
                      letterSpacing: '-0.01em',
                      margin: 0,
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>{formatPrice(client.totalSpent)}</p>
                  </div>

                  {/* Payment Status */}
                  <div style={{ flex: '0 0 110px', textAlign: 'center' }}>
                    {(() => {
                      const latestBooking = client.bookings[0];
                      if (!latestBooking) return <span style={{ fontSize: '0.78rem', color: colors.textSecondary, fontStyle: 'italic', opacity: 0.7 }}>No bookings</span>;
                      const isPaid = latestBooking.paymentStatus === 'paid';
                      const isPending = latestBooking.paymentStatus === 'pending';
                      const isPartial = latestBooking.paymentStatus === 'partially_paid';
                      const isFailed = latestBooking.paymentStatus === 'failed';
                      const grad = isPaid ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : isPending ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                        : isPartial ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                        : isFailed ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                        : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)';
                      const shadow = isPaid ? 'rgba(16,185,129,0.28)'
                        : isPending ? 'rgba(245,158,11,0.28)'
                        : isPartial ? 'rgba(8,58,133,0.28)'
                        : isFailed ? 'rgba(220,38,38,0.28)'
                        : 'rgba(0,0,0,0.12)';
                      return (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '0.22rem 0.6rem',
                          borderRadius: 9999,
                          background: grad,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: '#fff',
                          boxShadow: `0 3px 8px ${shadow}`,
                        }}>
                          {latestBooking.paymentStatus.replace('_', ' ')}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Client's Review */}
                  <div style={{ flex: '0 0 140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    {client.review ? (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '0.22rem 0.55rem',
                        borderRadius: 9999,
                        background: actualTheme === 'dark' ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.08)',
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.35)' : 'rgba(251,191,36,0.30)'}`,
                      }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>{renderStars(client.review.rating)}</div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: actualTheme === 'dark' ? '#FBBF24' : '#B45309',
                          letterSpacing: '-0.005em',
                        }}>Reviewed</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: colors.textSecondary, fontStyle: 'italic', opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <i className="bi bi-star" style={{ fontSize: 10 }} />
                        No review
                      </span>
                    )}
                  </div>

                  {/* Status pill */}
                  <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '0.22rem 0.55rem',
                      borderRadius: 9999,
                      background: client.status === 'active'
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#fff',
                      boxShadow: client.status === 'active' ? '0 3px 8px rgba(16,185,129,0.28)' : 'none',
                    }}>
                      {client.status === 'active' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }} />}
                      {client.status}
                    </span>
                  </div>

                  {/* Actions: Message, Gallery, Delete (icon-only chips) */}
                  <div style={{ flex: '0 0 auto', display: 'flex', gap: 5 }}>
                    <Link
                      href={`/user/photographer/inbox?client=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Message client"
                      style={{
                        width: 32, height: 32,
                        borderRadius: 9,
                        border: 'none',
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: 'white',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(8,58,133,0.28)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <i className="bi bi-chat-dots-fill" style={{ fontSize: 12 }} />
                    </Link>
                    <Link
                      href="/user/photographer/events"
                      onClick={(e) => e.stopPropagation()}
                      title="View gallery"
                      style={{
                        width: 32, height: 32,
                        borderRadius: 9,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgTertiary,
                        color: colors.textPrimary,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.15s, background-color 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                    >
                      <i className="bi bi-images" style={{ fontSize: 12, color: '#F20C8F' }} />
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmClient(client); }}
                      title="Remove client"
                      style={{
                        width: 32, height: 32,
                        borderRadius: 9,
                        border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
                        background: actualTheme === 'dark' ? 'rgba(220,38,38,0.14)' : 'rgba(254,242,242,0.85)',
                        color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = actualTheme === 'dark' ? 'rgba(220,38,38,0.14)' : 'rgba(254,242,242,0.85)'; e.currentTarget.style.color = actualTheme === 'dark' ? '#FCA5A5' : '#DC2626'; e.currentTarget.style.borderColor = actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'; }}
                    >
                      <i className="bi bi-trash3-fill" style={{ fontSize: 11 }} />
                    </button>
                  </div>

                  {/* Tips chip */}
                  <div style={{ flex: '0 0 auto' }}>
                    {(() => {
                      const tipTotal = client.tipsAndBonuses.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0);
                      const hasTip = tipTotal > 0;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTipsClient(client);
                            setShowTipsModal(true);
                          }}
                          title={hasTip ? `Tips received: ${formatPrice(tipTotal)}` : 'No tips yet'}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: 9,
                            border: 'none',
                            background: hasTip
                              ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                              : 'linear-gradient(135deg, #F20C8F 0%, #DB0A7F 100%)',
                            color: 'white',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '-0.005em',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: hasTip ? '0 4px 10px rgba(245,158,11,0.28)' : '0 4px 10px rgba(242,12,143,0.28)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <i className={`bi ${hasTip ? 'bi-gift-fill' : 'bi-gift'}`} style={{ fontSize: 11 }} />
                          {hasTip ? formatPrice(tipTotal) : 'No tips'}
                        </button>
                      );
                    })()}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                padding: 3,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(8,58,133,0.22)',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden', position: 'relative',
                  backgroundColor: colors.bgCard,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {selectedClient.profileImage && (
                    <img src={selectedClient.profileImage} alt={selectedClient.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h3>
                  {selectedClient.verified && <VerifiedIcon />}
                  <button
                    onClick={() => toggleFavorite(selectedClient.id)}
                    title={selectedClient.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: selectedClient.isFavorite ? 'linear-gradient(135deg, #F20C8F 0%, #DB0A7F 100%)' : 'transparent',
                      border: selectedClient.isFavorite ? 'none' : `1px solid ${colors.borderPrimary}`,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: selectedClient.isFavorite ? '#fff' : '#F20C8F',
                      boxShadow: selectedClient.isFavorite ? '0 4px 10px rgba(242,12,143,0.32)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className={`bi ${selectedClient.isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: 11 }} />
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0.3rem 0 0.25rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-envelope-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                  {selectedClient.email}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: colors.textSecondary }}>
                  <i className="bi bi-geo-alt-fill" style={{ fontSize: 11, color: '#F20C8F' }} />
                  {(selectedClient.location.city || selectedClient.location.country)
                    ? <span>{selectedClient.location.city}{selectedClient.location.city && selectedClient.location.country ? ', ' : ''}{selectedClient.location.country}</span>
                    : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Location not set</span>}
                </div>
              </div>
              <div style={{
                padding: '0.3rem 0.7rem',
                borderRadius: 9999,
                background: selectedClient.status === 'active'
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'white',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                boxShadow: selectedClient.status === 'active' ? '0 4px 10px rgba(16,185,129,0.30)' : 'none',
                flexShrink: 0,
              }}>
                {selectedClient.status === 'active' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }} />}
                {selectedClient.status}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.4rem' }}>
              {[
                { icon: 'bi-calendar-event-fill', value: selectedClient.totalBookings, label: 'Bookings', highlight: false },
                { icon: 'bi-cash-stack', value: formatPrice(selectedClient.totalSpent), label: 'Total Spent', highlight: true },
                { icon: 'bi-clock-history', value: formatDate(selectedClient.lastBookingDate || selectedClient.joinDate), label: selectedClient.lastBookingDate ? 'Last Booking' : 'First Contact', highlight: false, small: true },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: colors.bgCard,
                  border: `1px solid ${colors.borderPrimary}`,
                  padding: '0.8rem 0.65rem',
                  borderRadius: 12,
                  textAlign: 'center',
                  transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(8,58,133,0.10)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    margin: '0 auto 6px',
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.12) 0%, rgba(242,12,143,0.10) 100%)',
                    border: '1px solid rgba(8,58,133,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi ${stat.icon}`} style={{ fontSize: 11, color: '#083A85' }} />
                  </div>
                  <p style={{
                    fontSize: stat.small ? '0.88rem' : '1.15rem',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: colors.textPrimary,
                    margin: 0,
                    marginBottom: 2,
                    ...(stat.highlight ? {
                      background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    } : {}),
                  }}>{stat.value}</p>
                  <p style={{ fontSize: '0.7rem', color: colors.textSecondary, margin: 0, fontWeight: 600 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Client's Review */}
            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: '0.65rem',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <i className="bi bi-quote" style={{ fontSize: 11 }} /> Review for You
              </div>
              {selectedClient.review ? (
                <div style={{
                  padding: '0.95rem 1rem',
                  background: actualTheme === 'dark' ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.06)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.30)' : 'rgba(251,191,36,0.25)'}`,
                  borderRadius: 12,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', paddingLeft: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {renderStars(selectedClient.review.rating)}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: actualTheme === 'dark' ? '#FBBF24' : '#B45309', letterSpacing: '-0.005em' }}>
                      {selectedClient.review.rating}/5
                    </span>
                    <span style={{ fontSize: '0.74rem', color: colors.textSecondary, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                      {formatDate(selectedClient.review.reviewDate)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: colors.textPrimary, margin: 0, lineHeight: 1.55, fontStyle: 'italic', paddingLeft: 6 }}>
                    &ldquo;{selectedClient.review.reviewText}&rdquo;
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '1.1rem',
                  background: colors.bgTertiary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: 12,
                  textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
                    border: '1px solid rgba(8,58,133,0.16)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-chat-square-text" style={{ fontSize: 13, color: '#083A85' }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, fontStyle: 'italic' }}>
                    This client has not left a review yet
                  </p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: '0.65rem',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <i className="bi bi-person-vcard-fill" style={{ fontSize: 11 }} /> Contact Information
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: 'bi-envelope-fill', label: 'Email', value: selectedClient.email },
                  { icon: 'bi-telephone-fill', label: 'Phone', value: selectedClient.phone || '-' },
                  { icon: 'bi-clock-fill', label: 'Last Active', value: selectedClient.lastActive },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0.55rem 0.75rem',
                    background: colors.bgTertiary,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'linear-gradient(135deg, rgba(8,58,133,0.12) 0%, rgba(242,12,143,0.10) 100%)',
                      border: '1px solid rgba(8,58,133,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className={`bi ${row.icon}`} style={{ fontSize: 11, color: '#083A85' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#F20C8F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</div>
                    </div>
                  </div>
                ))}
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
            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                href={`/user/photographer/inbox?client=${encodeURIComponent(`${selectedClient.firstName} ${selectedClient.lastName}`)}`}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 11,
                  border: 'none',
                  background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  textDecoration: 'none',
                  boxShadow: '0 8px 18px rgba(8,58,133,0.30)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(242,12,143,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(8,58,133,0.30)'; }}
              >
                <i className="bi bi-chat-dots-fill" style={{ fontSize: 13 }} />
                Send Message
              </Link>
              <Link
                href="/user/photographer/events"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 11,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.35)'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
              >
                <i className="bi bi-images" style={{ fontSize: 13, color: '#F20C8F' }} />
                View Gallery
              </Link>
            </div>

            {/* Delete Client */}
            <button
              onClick={() => setDeleteConfirmClient(selectedClient)}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '0.6rem 1rem',
                borderRadius: 11,
                border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'}`,
                background: actualTheme === 'dark' ? 'rgba(220,38,38,0.16)' : 'rgba(254,242,242,0.85)',
                color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
                fontSize: '0.84rem',
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = actualTheme === 'dark' ? 'rgba(220,38,38,0.16)' : 'rgba(254,242,242,0.85)'; e.currentTarget.style.color = actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C'; e.currentTarget.style.borderColor = actualTheme === 'dark' ? 'rgba(220,38,38,0.40)' : 'rgba(220,38,38,0.25)'; }}
            >
              <i className="bi bi-trash3-fill" style={{ fontSize: 12 }} />
              Remove Client
            </button>
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
        {tipsClient && (() => {
          const tipsOnly = tipsClient.tipsAndBonuses.filter(t => t.type === 'tip');
          const totalTips = tipsOnly.reduce((sum, t) => sum + t.amount, 0);
          const hasTips = tipsOnly.length > 0;
          return (
          <div>
            {/* Client Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.1rem',
              padding: '0.85rem 0.95rem',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(242,12,143,0.10) 100%)'
                : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.04) 100%)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(8,58,133,0.32)' : 'rgba(8,58,133,0.14)'}`,
              borderRadius: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                padding: 2,
                background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 100%)',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(8,58,133,0.20)',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden', position: 'relative',
                  background: colors.bgCard,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {tipsClient.profileImage && (
                    <img src={tipsClient.profileImage} alt={tipsClient.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: colors.textPrimary, fontSize: '1rem', letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tipsClient.firstName} {tipsClient.lastName}
                </div>
                <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-geo-alt-fill" style={{ fontSize: 10, color: '#F20C8F' }} />
                  {(tipsClient.location.city || tipsClient.location.country)
                    ? `${tipsClient.location.city}${tipsClient.location.city && tipsClient.location.country ? ', ' : ''}${tipsClient.location.country}`
                    : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Location not set</span>}
                </div>
              </div>
            </div>

            {/* Total Summary Hero - Only Tips */}
            <div style={{
              background: hasTips
                ? 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
                : (actualTheme === 'dark' ? 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.10) 100%)' : 'linear-gradient(135deg, rgba(254,243,199,0.85) 0%, rgba(254,243,199,0.55) 100%)'),
              borderRadius: 14,
              padding: '1.25rem 1rem',
              textAlign: 'center',
              border: hasTips ? 'none' : `1px solid ${actualTheme === 'dark' ? 'rgba(245,158,11,0.40)' : 'rgba(245,158,11,0.30)'}`,
              marginBottom: '1.25rem',
              boxShadow: hasTips ? '0 12px 24px rgba(245,158,11,0.32)' : 'none',
              position: 'relative', overflow: 'hidden',
            }}>
              {!hasTips && (
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
                }} />
              )}
              <div style={{
                width: 44, height: 44, margin: '0 auto 0.55rem', borderRadius: 12,
                background: hasTips ? 'rgba(255,255,255,0.22)' : 'rgba(245,158,11,0.18)',
                border: hasTips ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(245,158,11,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>
                <i className={`bi ${hasTips ? 'bi-gift-fill' : 'bi-gift'}`} style={{ fontSize: 18, color: hasTips ? '#fff' : (actualTheme === 'dark' ? '#FCD34D' : '#B45309') }} />
              </div>
              <div style={{
                fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: hasTips ? '#fff' : (actualTheme === 'dark' ? '#FCD34D' : '#B45309'),
                lineHeight: 1.1,
                textShadow: hasTips ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              }}>
                {formatPrice(totalTips)}
              </div>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700,
                color: hasTips ? 'rgba(255,255,255,0.95)' : (actualTheme === 'dark' ? '#FCD34D' : '#92400E'),
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginTop: 4,
              }}>Total Tips Received</div>
              <div style={{
                fontSize: '0.78rem',
                color: hasTips ? 'rgba(255,255,255,0.85)' : colors.textSecondary,
                marginTop: 4,
                fontWeight: 500,
              }}>
                {tipsOnly.length} tip{tipsOnly.length !== 1 ? 's' : ''} from this client
              </div>
            </div>

            {/* Tips List */}
            <div>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: '0.65rem',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                <i className="bi bi-clock-history" style={{ fontSize: 11 }} /> Tips History
              </div>
              {hasTips ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tipsOnly.map((item) => (
                    <div key={item.id} style={{
                      padding: '0.85rem 0.95rem',
                      borderRadius: 12,
                      background: actualTheme === 'dark' ? 'rgba(251,191,36,0.10)' : 'rgba(254,251,235,0.85)',
                      border: `1px solid ${actualTheme === 'dark' ? 'rgba(251,191,36,0.30)' : 'rgba(251,191,36,0.32)'}`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <span aria-hidden style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                        background: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
                      }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, paddingLeft: 6, gap: 8 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '0.18rem 0.5rem',
                            borderRadius: 9999,
                            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                            color: 'white',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            boxShadow: '0 3px 8px rgba(245,158,11,0.30)',
                          }}>
                            <i className="bi bi-gift-fill" style={{ fontSize: 9 }} /> Tip
                          </span>
                          <span style={{ fontSize: '0.74rem', color: colors.textSecondary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <i className="bi bi-calendar3" style={{ fontSize: 10 }} />
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          letterSpacing: '-0.01em',
                          color: actualTheme === 'dark' ? '#FCD34D' : '#B45309',
                          flexShrink: 0,
                        }}>
                          +{formatPrice(item.amount)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textPrimary, marginBottom: 3, paddingLeft: 6, letterSpacing: '-0.005em' }}>
                        {item.eventName}
                      </div>
                      {item.message && (
                        <p style={{
                          fontSize: '0.8rem',
                          color: colors.textSecondary,
                          margin: 0,
                          fontStyle: 'italic',
                          paddingLeft: 6,
                          lineHeight: 1.5,
                        }}>
                          &ldquo;{item.message}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  background: colors.bgTertiary,
                  borderRadius: 12,
                  border: `1px solid ${colors.borderPrimary}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.08) 100%)',
                    border: '1px solid rgba(8,58,133,0.16)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-gift" style={{ fontSize: 18, color: '#083A85' }} />
                  </div>
                  <p style={{ fontSize: '0.9rem', color: colors.textPrimary, margin: 0, fontWeight: 700, letterSpacing: '-0.005em' }}>
                    No tips from this client yet
                  </p>
                  <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: 0, maxWidth: 320, lineHeight: 1.5 }}>
                    Tips will appear here when this client shows appreciation for your work.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setShowTipsModal(false);
                  setTipsClient(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: 11,
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
              >
                Close
              </button>
            </div>
          </div>
          );
        })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmClient}
        onClose={() => { if (!deleting) setDeleteConfirmClient(null); }}
        title="Remove Client"
        maxWidth="420px"
      >
        {deleteConfirmClient && (
          <div>
            {/* Danger icon hero */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                boxShadow: '0 12px 28px rgba(220,38,38,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-trash3-fill" style={{ fontSize: 24, color: '#fff' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 700, color: '#DC2626',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Remove client</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                Remove from your list?
              </h3>
            </div>

            {/* Client preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.1rem',
              padding: '0.85rem 0.95rem',
              background: actualTheme === 'dark' ? 'rgba(220,38,38,0.14)' : 'rgba(254,242,242,0.85)',
              border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.35)' : 'rgba(220,38,38,0.25)'}`,
              borderRadius: 12,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <span aria-hidden style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
              }} />
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                padding: 2,
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                flexShrink: 0,
                marginLeft: 6,
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  overflow: 'hidden', position: 'relative',
                  background: colors.bgCard,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                  </svg>
                  {deleteConfirmClient.profileImage && (
                    <img src={deleteConfirmClient.profileImage} alt={deleteConfirmClient.firstName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '0.98rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {deleteConfirmClient.firstName} {deleteConfirmClient.lastName}
                </p>
                <p style={{ fontSize: '0.78rem', color: colors.textSecondary, margin: '2px 0 0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-calendar-event-fill" style={{ fontSize: 10, color: '#DC2626' }} />
                  {deleteConfirmClient.totalBookings} booking{deleteConfirmClient.totalBookings !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: '0.9rem', color: colors.textSecondary, margin: '0 auto 0.45rem',
              textAlign: 'center', lineHeight: 1.55,
            }}>
              Are you sure you want to remove this client from your list?
            </p>
            <p style={{
              fontSize: '0.82rem',
              color: actualTheme === 'dark' ? '#FCA5A5' : '#B91C1C',
              margin: '0 0 1.4rem',
              textAlign: 'center',
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }}>
              This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteConfirmClient(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 11,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.borderColor = 'rgba(8,58,133,0.30)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteClient(deleteConfirmClient.id)}
                disabled={deleting}
                style={{
                  flex: 1.4,
                  padding: '0.75rem 1rem',
                  borderRadius: 11,
                  border: 'none',
                  background: deleting
                    ? (actualTheme === 'dark' ? '#4B5563' : '#9CA3AF')
                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  boxShadow: deleting ? 'none' : '0 8px 18px rgba(220,38,38,0.32)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(220,38,38,0.38)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = deleting ? 'none' : '0 8px 18px rgba(220,38,38,0.32)'; }}
              >
                {deleting ? (
                  <><i className="bi bi-arrow-clockwise" style={{ fontSize: 13, animation: 'spin 0.9s linear infinite' }} /> Removing...</>
                ) : (
                  <><i className="bi bi-trash3-fill" style={{ fontSize: 13 }} /> Remove</>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
