'use client';

// The photographer Clients page's behaviour, moved verbatim out of app/pages/photographer/clients.tsx so the classic
// page and the Compact Glass page share one source of truth (no behaviour change). Fetches: clients (with the chat
// conversations fallback), favourites, balance and bookings; actions: favourite, delete, accept and reject a booking.
import { useState, useEffect, useCallback } from 'react';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { useWorkspace } from '../../providers/WorkspaceProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';

export interface Booking {
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

export interface ClientReview {
  rating: number;
  reviewText: string;
  reviewDate: string;
}

export interface TipBonus {
  id: string;
  amount: number;
  type: 'tip' | 'bonus';
  eventName: string;
  date: string;
  message?: string;
}

export interface Client {
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

export type FilterType = 'all' | 'active' | 'inactive' | 'favorites' | 'pending_payments';
export type ViewMode = 'grid' | 'list';
export type PageTab = 'clients' | 'bookings';
export type BookingsFilter = 'all' | 'pending' | 'accepted' | 'rejected';

// API Booking interface. flexible to handle various response shapes
export interface APIBooking {
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

export function usePhotographerClients() {
  const { token, user } = useDashboardAuth();
  const { isCollaborator } = useWorkspace();
  void token;
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
  // Glass page only: neither the clients list nor its chat fallback could be read (the classic page never showed this).
  const [clientsError, setClientsError] = useState(false);

  const fetchClients = useCallback(async () => {
    setClientsError(false);
    try {
      const apiUrl = getApiUrl();
      const [clientsRes, convRes, favRes] = await Promise.allSettled([
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/clients`),
        dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`),
        dashboardAuthFetch(`${apiUrl}/api/remote/photographer/favorite-clients`),
      ]);
      const unusable = (r: PromiseSettledResult<Response>) => r.status === 'rejected' || !r.value.ok;
      if (unusable(clientsRes) && unusable(convRes)) setClientsError(true);

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
      setClientsError(true);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    const fetchBalance = async () => {
      // A collaborator sees no money in the workspace it works in; the server refuses the balance there.
      if (isCollaborator) return;
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
  }, [fetchClients, isCollaborator]);

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

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const retryClients = () => { setClientsLoading(true); fetchClients(); };

  return {
    clientsError,
    retryClients,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    viewMode,
    setViewMode,
    selectedClient,
    setSelectedClient,
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    contextMenu,
    setContextMenu,
    showTipsModal,
    setShowTipsModal,
    tipsClient,
    setTipsClient,
    deleteConfirmClient,
    setDeleteConfirmClient,
    deleting,
    setDeleting,
    pageTab,
    setPageTab,
    bookings,
    setBookings,
    bookingsLoading,
    setBookingsLoading,
    bookingsFilter,
    setBookingsFilter,
    processingBookingId,
    setProcessingBookingId,
    fetchBookings,
    acceptBooking,
    rejectBooking,
    getBookingStatus,
    getBookingClientName,
    getBookingAmount,
    filteredBookings,
    pendingCount,
    acceptedCount,
    rejectedCount,
    clientsLoading,
    setClientsLoading,
    balance,
    setBalance,
    fetchClients,
    clients,
    setClients,
    eventTypes,
    toggleFavorite,
    deleteClient,
    formatDate,
    getPaymentStatusColor,
    clientsWithPendingPayments,
    totalPendingAmount,
    totalTips,
    totalCompletedEvents,
    bonusEligibleSets,
    platformBonus,
    totalBalance,
    filteredClients,
  };
}

export type ClientsController = ReturnType<typeof usePhotographerClients>;
