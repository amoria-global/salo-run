'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import AlbumCard from '@/app/components/Cards';
import PayNowModal from '@/app/components/UnlockModal';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { useCurrency } from '@/app/context/CurrencyContext';

import { Unlock } from 'lucide-react';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
import { fetchPlatformConfig, getPlatformConfig } from '@/lib/platformConfig';
import { initiatePhotobookExtrasPayment, pollPaymentStatus, getTelecomProvider } from '@/lib/xentripay';

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

interface Payment {
  id: number;
  declarationId?: string;
  eventId?: string;
  date: string;
  eventName: string;
  eventType: string;
  photographerName: string;
  photographerImage: string;
  method: string;
  amount: string;
  amountNum: number;
  paidAmount: number;
  status: PaymentStatus;
  invoiceNumber: string;
}


// Icons
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const GridIcon = ({ active, activeColor = "#083A85" }: { active?: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? activeColor : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ListIcon = ({ active, activeColor = "#083A85" }: { active?: boolean; activeColor?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? activeColor : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const AlbumsViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
  </svg>
);

const ArchivesViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="5" rx="1" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <path d="M4 8v10a2 2 0 002 2h12a2 2 0 002-2V8" stroke={active ? 'white' : 'currentColor'} strokeWidth="2"/>
    <path d="M10 12h4" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PhotobooksViewIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

// Social Media Icons with Brand Colors (matching My Events page)
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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/>
    <rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/>
  </svg>
);

<<<<<<< Updated upstream
// Album data placeholder - loaded from API
const clientAlbumsData: any[] = [];
=======
// Photobook Icons
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// Photobook Interfaces
interface PhotobookImage {
  url: string;
  sourceAlbumId: number;
  sourceAlbumTitle: string;
  addedAt: string;
}

interface Photobook {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  createdAt: string;
  images: PhotobookImage[];
  maxImages: number;
}

// Sample album data from photographers/freelancers
const clientAlbumsData = [
  {
    id: 1,
    title: 'Johnson Wedding - Ceremony',
    photographer: 'Sarah Anderson',
    photographerAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    receivedDate: 'Dec 18, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    photoCount: 45,
    downloadedCount: 12,
    favoriteCount: 8,
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800'
    ]
  },
  {
    id: 2,
    title: 'Johnson Wedding - Reception',
    photographer: 'Sarah Anderson',
    photographerAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    receivedDate: 'Dec 18, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
    photoCount: 78,
    downloadedCount: 35,
    favoriteCount: 22,
    images: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800'
    ]
  },
  {
    id: 3,
    title: 'Family Portrait Session',
    photographer: 'Mike Chen',
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Portrait',
    date: 'Nov 28, 2024',
    receivedDate: 'Dec 2, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
    photoCount: 32,
    downloadedCount: 28,
    favoriteCount: 15,
    images: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800',
      'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800'
    ]
  },
  {
    id: 4,
    title: 'Company Annual Gala',
    photographer: 'David Kim',
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Event',
    date: 'Nov 15, 2024',
    receivedDate: 'Nov 20, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    photoCount: 124,
    downloadedCount: 45,
    favoriteCount: 30,
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
    ]
  },
  {
    id: 5,
    title: 'Product Catalog - Spring Collection',
    photographer: 'Emily Zhang',
    photographerAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    category: 'Product',
    date: 'Oct 10, 2024',
    receivedDate: 'Oct 15, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    photoCount: 56,
    downloadedCount: 56,
    favoriteCount: 18,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800'
    ]
  },
  {
    id: 6,
    title: 'Birthday Celebration',
    photographer: 'Alex Rivera',
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Event',
    date: 'Sep 22, 2024',
    receivedDate: 'Sep 25, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400',
    photoCount: 89,
    downloadedCount: 67,
    favoriteCount: 42,
    images: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800'
    ]
  }
];
>>>>>>> Stashed changes


interface GalleryPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const ClientGallery = ({ userRole = 'client' }: GalleryPageProps) => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user, token } = useDashboardAuth();
  const apiUrl = getApiUrl();
  const [albums, setAlbums] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPhotographer, setFilterPhotographer] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);

  // Archives state (coordinator only)
  const [coordinatorArchives, setCoordinatorArchives] = useState<any[]>([]);

  // URL normalization (http → https proxy)
  const normalizeImg = (url: string | undefined | null): string => {
    if (!url || url === 'null' || url.endsWith('/null')) return '';
    return normalizeImageUrl(url) || '';
  };

  // --- Gallery API helpers (role-aware endpoints) ---
  const galleryBase = userRole === 'event-coordinator' ? 'coordinator/galleries' : 'customer/albums';

  // GET gallery detail
  const fetchGalleryDetail = useCallback(async (galleryId: string) => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${galleryBase}/${galleryId}`);
      if (res.ok) {
        const data = await res.json();
        return data.data || null;
      }
    } catch (err) {
      console.error('Failed to fetch gallery detail:', err);
    }
    return null;
  }, [apiUrl, galleryBase]);

  // PUT gallery
  const updateGallery = useCallback(async (galleryId: string, payload: Record<string, unknown>) => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${galleryBase}/${galleryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.action !== 1) {
        console.error('Failed to update gallery:', data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error updating gallery:', err);
      return false;
    }
  }, [apiUrl, galleryBase]);

  // DELETE gallery
  const deleteGallery = useCallback(async (galleryId: string) => {
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${galleryBase}/${galleryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Failed to delete gallery:', data.message || res.status);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error deleting gallery:', err);
      return false;
    }
  }, [apiUrl, galleryBase]);

  // PUT archive a gallery
  const archiveGallery = useCallback(async (archiveId: string) => {
    try {
      // Client: PUT /customer/albums/archives with body {albumId}
      // Coordinator: PUT /coordinator/archives/{id}
      const url = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/archives/${archiveId}`
        : `${apiUrl}/api/remote/customer/albums/archives`;
      const body = userRole === 'event-coordinator'
        ? JSON.stringify({})
        : JSON.stringify({ albumId: archiveId });
      const res = await dashboardAuthFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (!res.ok || data.action !== 1) {
        console.error('Failed to archive gallery:', data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error archiving gallery:', err);
      return false;
    }
  }, [apiUrl, userRole]);

  // DELETE unarchive/remove from archives
  const unarchiveGallery = useCallback(async (archiveId: string) => {
    try {
      // Client: DELETE /customer/albums/archives with body {albumId}
      // Coordinator: DELETE /coordinator/archives/{id}
      const url = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/archives/${archiveId}`
        : `${apiUrl}/api/remote/customer/albums/archives`;
      const body = userRole === 'event-coordinator'
        ? undefined
        : JSON.stringify({ albumId: archiveId });
      const res = await dashboardAuthFetch(url, {
        method: 'DELETE',
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body } : {}),
      });
      const data = await res.json();
      if (!res.ok || data.action !== 1) {
        console.error('Failed to unarchive gallery:', data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error unarchiving gallery:', err);
      return false;
    }
  }, [apiUrl, userRole]);

  // Fetch albums/galleries from API, enriched with photographer profile images
  const fetchAlbums = useCallback(async () => {
    try {
      // Fetch galleries and photographers in parallel
      const photogEndpoint = userRole === 'event-coordinator'
        ? `${apiUrl}/api/remote/coordinator/photographers?page=0&size=100`
        : `${apiUrl}/api/remote/customer/photographers?page=0&size=100`;
      // Both roles use /customer/albums — no role restriction on this endpoint
      const albumEndpoint = `${apiUrl}/api/remote/customer/albums`;

      const [albumRes, photogRes] = await Promise.allSettled([
        dashboardAuthFetch(albumEndpoint),
        dashboardAuthFetch(photogEndpoint).catch(() =>
          fetch(`${apiUrl}/api/remote/public/photographers/list?page=0&size=100`, {
            headers: { 'Content-Type': 'application/json' }
          })
        ),
      ]);

      // Build photographer lookup (same approach as home.tsx line 278-284)
      const photogById: Record<string, { name: string; profilePicture: string }> = {};
      const photogByName: Record<string, string> = {};
      let allPhotographers: { name: string; profilePicture: string }[] = [];
      if (photogRes.status === 'fulfilled' && photogRes.value.ok) {
        const pData = await photogRes.value.json();
        const photographers = pData.data?.content || pData.data || [];
        for (const p of photographers) {
          const name = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : (p.name || '');
          const pic = p.profilePicture || p.profileImage || '';
          if (p.id) photogById[p.id] = { name, profilePicture: pic };
          if (name && pic) photogByName[name.toLowerCase()] = pic;
          if (name) allPhotographers.push({ name, profilePicture: pic });
        }
      }

      if (albumRes.status === 'fulfilled' && albumRes.value.ok) {
        const data = await albumRes.value.json();
        const loaded = (data.data || []).map((a: any) => {
          // Try to resolve photographer info from the album itself
          const rawName = a.photographer || a.photographerName || '';
          const rawAvatar = a.photographerAvatar || a.photographerImage || '';
          const photogId = a.photographerId || '';

          // Resolve: by id → by name → first photographer with a profile picture
          const byId = photogId ? photogById[photogId] : null;
          const byName = rawName ? photogByName[rawName.toLowerCase()] : null;
          const firstWithPic = allPhotographers.find(p => p.profilePicture);

          const resolvedName = rawName || (byId?.name || '') || (firstWithPic?.name || '');
          const resolvedAvatar = rawAvatar || (byId?.profilePicture || '') || (byName || '') || (firstWithPic?.profilePicture || '');

          return {
            id: a.id,
            title: a.title || '',
            description: a.description || '',
            photographer: resolvedName,
            photographerAvatar: normalizeImg(resolvedAvatar),
            category: a.category || '',
            date: a.date || a.createdAt || '',
            isArchived: a.isArchived || a.isLocked || false,
            isLocked: a.isLocked || false,
            expiresAt: a.expiresAt || '',
            receivedDate: a.receivedDate || a.sentAt || '',
            thumbnail: normalizeImg(a.thumbnail || a.coverImage),
            photoCount: a.photoCount || a.imageCount || 0,
            downloadedCount: a.downloadedCount || 0,
            favoriteCount: a.favoriteCount || 0,
            images: (a.images || []).map((img: any) => normalizeImg(typeof img === 'string' ? img : img?.fileUrl || img?.url || '') || '').filter(Boolean),
            mediaIds: (a.images || []).map((img: any) => typeof img === 'object' ? img?.id || '' : '').filter(Boolean),
            eventId: a.eventId || '',
            eventTitle: a.eventTitle || '',
            eventDate: a.eventDate || '',
            eventLocation: a.eventLocation || '',
            shared: a.shared || a.sharedWithClient || false,
            payment: a.payment ? {
              amountDue: a.payment.amountDue || 0,
              status: a.payment.status || 'pending',
              eventName: a.payment.eventName || '',
              photographerName: a.payment.photographerName || '',
            } : undefined,
          };
        });
        setAlbums(loaded);
      }
    } catch (err) {
      console.error('Failed to fetch albums:', err);
    }
  }, [apiUrl, userRole]);

  useEffect(() => {
    if (user?.id) {
      fetchAlbums();
    }
  }, [user?.id, fetchAlbums]);

  // GET archives
  // Coordinator: GET /coordinator/archives (dedicated endpoint)
  // Client: GET /customer/archives does not exist — derive from main albums list filtered by isArchived
  const fetchCoordinatorArchives = useCallback(async () => {
    if (userRole !== 'event-coordinator') {
      // For client: archived albums are already in the main albums state with isArchived=true
      setCoordinatorArchives(prev => prev); // no-op; archivedAlbums will be computed from albums below
      return;
    }
    try {
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/coordinator/archives`);
      if (res.ok) {
        const data = await res.json();
        const archiveList = Array.isArray(data.data) ? data.data : data.data?.content || [];
        setCoordinatorArchives(archiveList.map((a: any) => {
          const rawName = a.photographerName || a.photographer || '';
          const rawAvatar = a.photographerAvatar || a.photographerImage || '';
          // Archive entity has 'event' (full object) not flat 'eventId'
          const resolvedEventId = a.eventId || a.event?.id || '';
          const resolvedEventTitle = a.eventTitle || a.event?.title || '';
          return {
            id: a.id,
            title: a.title || '',
            description: a.description || '',
            photographer: rawName,
            photographerAvatar: normalizeImg(rawAvatar),
            category: a.archiveType || a.category || '',
            date: a.createdAt || a.date || '',
            receivedDate: a.receivedDate || a.sentAt || a.createdAt || '',
            expiresAt: a.expiresAt || '',
            isArchived: true,
            isLocked: true,
            thumbnail: normalizeImg(a.coverImage || a.fileUrl || a.thumbnail),
            photoCount: a.imageCount || a.photoCount || 0,
            downloadedCount: 0,
            favoriteCount: 0,
            images: (a.images || []).map((img: any) => normalizeImg(typeof img === 'string' ? img : img?.fileUrl || img?.url || '') || '').filter(Boolean),
            mediaIds: (a.images || []).map((img: any) => typeof img === 'object' ? img?.id || '' : '').filter(Boolean),
            eventId: resolvedEventId,
            eventTitle: resolvedEventTitle,
            payment: a.payment ? {
              amountDue: a.payment.amountDue || 0,
              status: a.payment.status || 'pending',
              eventName: a.payment.eventName || '',
              photographerName: a.payment.photographerName || '',
            } : undefined,
          };
        }));
      }
    } catch (err) {
      console.error('Failed to fetch coordinator archives:', err);
    }
  }, [apiUrl, userRole]);

  // For client role: derive archived albums directly from the main albums state
  const clientArchivedAlbums = userRole !== 'event-coordinator' ? albums.filter(a => a.isArchived) : [];


  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

  // Multi-select view states
  const [showMultiSelectView, setShowMultiSelectView] = useState(false);
  const [multiSelectAlbum, setMultiSelectAlbum] = useState<any | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Image viewer states
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAlbum, setShareAlbum] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<any | null>(null);

  // Photobook states — persist selected view tab
  const [pageView, setPageView] = useState<'albums' | 'photobooks' | 'archives'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('connekt_gallery_view');
      if (saved === 'albums' || saved === 'photobooks' || saved === 'archives') return saved;
    }
    return 'albums';
  });
  useEffect(() => {
    localStorage.setItem('connekt_gallery_view', pageView);
  }, [pageView]);

  // Fetch coordinator archives when archives tab is selected
  useEffect(() => {
    if (pageView === 'archives' && user?.id) {
      fetchCoordinatorArchives();
    }
  }, [pageView, userRole, user?.id, fetchCoordinatorArchives]);

  const [photobooks, setPhotobooks] = useState<Array<{
    id: number | string;
    name: string;
    description: string;
    thumbnail: string;
    images: string[];
    mediaIds?: string[];
    layout: 'book-flip' | 'mosaic' | 'gallery-wall' | '';
    createdAt: string;
    isSent?: boolean;
    sentAt?: string;
    status?: string;
    freePhotosLimit?: number;
    extraPhotosCount?: number;
    extraPhotosAmount?: number;
    paymentRequired?: boolean;
    paymentDeclarationId?: string;
    resubmittedAt?: string;
    photographerName?: string;
    eventId?: string;
    pricePerExtraPhoto?: number;
    currencyId?: string;
  }>>([]);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  // Setup wizard states (Select Album → Layout → Images)
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupSelectedAlbum, setSetupSelectedAlbum] = useState<any | null>(null);
  const [setupLayout, setSetupLayout] = useState<'book-flip' | 'mosaic' | 'gallery-wall'>('book-flip');
  const [setupSelectedImages, setSetupSelectedImages] = useState<string[]>([]);
  const [setupPhotobookId, setSetupPhotobookId] = useState<number | string | null>(null);
  // Dynamic limit from the active photobook's package (falls back to 3)
  const activePhotobook = photobooks.find(pb => pb.id === setupPhotobookId) || photobooks[0];
  const MAX_IMAGE_SELECTION = activePhotobook?.freePhotosLimit || 3;
  const [setupCurrentImageIndex, setSetupCurrentImageIndex] = useState(0);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [setupCoverImage, setSetupCoverImage] = useState<string>('');
  const [step3ViewMode, setStep3ViewMode] = useState<'album-grid' | 'image-selection'>('album-grid');
  const [setupSelectMode, setSetupSelectMode] = useState(false);
  // Dynamic price from the active photobook's package (falls back to 1)
  const EXTRA_IMAGE_PRICE = activePhotobook?.pricePerExtraPhoto || 1;
  const EXTRA_CURRENCY = activePhotobook?.currencyId || 'RWF';
  const [extraUnlockedImages, setExtraUnlockedImages] = useState<string[]>([]);
  const [showExtraImagePayment, setShowExtraImagePayment] = useState(false);
  const [pendingUnlockImage, setPendingUnlockImage] = useState<string | null>(null);
  const [pendingUnlockImages, setPendingUnlockImages] = useState<string[]>([]);
  const [extraPaymentMethod, setExtraPaymentMethod] = useState<'card' | 'mtn' | 'airtel' | null>(null);
  const [extraPaymentShowReceipt, setExtraPaymentShowReceipt] = useState(false);
  const [extraDonationAmount, setExtraDonationAmount] = useState<string>('');
  const [extraCustomDonation, setExtraCustomDonation] = useState<string>('');
  const [extraDonationSkipped, setExtraDonationSkipped] = useState<boolean>(false);
  const [extraShowCustomInput, setExtraShowCustomInput] = useState<boolean>(false);
  const [showLimitReachedMessage, setShowLimitReachedMessage] = useState(false);
  const [hasSeenLimitMessage, setHasSeenLimitMessage] = useState(false);
  const { profile } = useUserProfile();

  const [showGiftsPaymentMethodModal, setShowGiftsPaymentMethodModal] = useState(false);
  const [selectedGiftPaymentMethod, setSelectedGiftPaymentMethod] = useState<string | null>(null);
  const [giftPaymentDetails, setGiftPaymentDetails] = useState({
    mtnNumber: '',
    airtelNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if Rwanda requires mobile money selection
  const isRwanda = profile.country === 'Rwanda';
  const hasMobileMoneySelected = selectedGiftPaymentMethod === 'mtn' || selectedGiftPaymentMethod === 'airtel';

  // Validate that Rwanda users have selected a mobile money option
  const validateGiftPaymentMethod = (): boolean => {
    if (isRwanda && !hasMobileMoneySelected) {
      setValidationError('For users in Rwanda, you must select either MTN or Airtel Mobile Money as a payment method.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Fetch photobooks from API
  const photobookBase = userRole === 'event-coordinator' ? 'coordinator/photobook' : 'events/photobook';
  const photobookListBase = userRole === 'event-coordinator' ? 'coordinator/photobooks' : 'events/photobooks';
  const mediaSelectBase = userRole === 'event-coordinator' ? 'coordinator/media' : 'events/media';
  useEffect(() => {
    if (!user?.id) return;
    const loadPhotobooks = async () => {
      try {
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${photobookListBase}`);
        if (res.ok) {
          const data = await res.json();
          const items = data?.data?.content || data?.data || [];
          if (items.length > 0) {
            setPhotobooks(items.map((pb: any, idx: number) => {
              const mediaItems = pb.mediaItems || pb.images || [];
              return {
                id: pb.id || idx,
                name: pb.name || pb.title || '',
                description: pb.description || '',
                thumbnail: normalizeImg(pb.coverImage || pb.thumbnail) || '',
                images: mediaItems.map((img: any) => typeof img === 'string' ? normalizeImg(img) || '' : normalizeImg(img?.fileUrl || img?.url || '') || '').filter(Boolean),
                mediaIds: mediaItems.map((img: any) => typeof img === 'object' ? img?.id || '' : '').filter(Boolean),
                layout: pb.layout || '',
                createdAt: pb.createdAt || '',
                isSent: pb.isSent || pb.sent || false,
                sentAt: pb.sentAt || '',
                status: pb.status || 'DRAFT',
                freePhotosLimit: pb.freePhotosLimit,
                extraPhotosCount: pb.extraPhotosCount || 0,
                extraPhotosAmount: pb.extraPhotosAmount || 0,
                paymentRequired: pb.paymentRequired || false,
                paymentDeclarationId: pb.paymentDeclarationId || '',
                resubmittedAt: pb.resubmittedAt || '',
                photographerName: pb.photographerName || '',
                eventId: pb.eventId || '',
                pricePerExtraPhoto: pb.pricePerExtraPhoto || 0,
                currencyId: pb.currencyId || '',
              };
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch photobooks:', err);
      }
    };
    loadPhotobooks();
  }, [userRole, user?.id, apiUrl]);

  // PATCH media/{mediaId}/select — toggle image selection
  const selectPhotobookMedia = useCallback(async (mediaId: string, selected: boolean) => {
    try {
      const res = await dashboardAuthFetch(
        `${apiUrl}/api/remote/${mediaSelectBase}/${mediaId}/select?selected=${selected}`,
        { method: 'PATCH' }
      );
      const data = await res.json();
      if (!res.ok || data.action === 0) {
        console.error('Failed to select photobook media:', data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error selecting photobook media:', err);
      return false;
    }
  }, [apiUrl, userRole]);

  // Delete photobook modal states
  const [showDeletePhotobookModal, setShowDeletePhotobookModal] = useState(false);
  const [photobookToDelete, setPhotobookToDelete] = useState<typeof photobooks[0] | null>(null);

  // Book flip state
  const [bookCurrentPage, setBookCurrentPage] = useState(0);

  // Photobook browse states
  const [showPhotobookBrowse, setShowPhotobookBrowse] = useState(false);
  const [selectedPhotobook, setSelectedPhotobook] = useState<typeof photobooks[0] | null>(null);
  const [photobookSelectedImages, setPhotobookSelectedImages] = useState<string[]>([]);
  const [isPhotobookSelectMode, setIsPhotobookSelectMode] = useState(false);
  const [showPhotobookImageViewer, setShowPhotobookImageViewer] = useState(false);
  const [photobookCurrentImageIndex, setPhotobookCurrentImageIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Photobook states
  const [photobook, setPhotobook] = useState<Photobook | null>(null);
  const [showCreatePhotobookModal, setShowCreatePhotobookModal] = useState(false);
  const [showPhotobookModal, setShowPhotobookModal] = useState(false);
  const [viewingPhotobooks, setViewingPhotobooks] = useState(false);
  const [photobookName, setPhotobookName] = useState('');
  const [photobookDescription, setPhotobookDescription] = useState('');
  const [photobookThumbnailUrl, setPhotobookThumbnailUrl] = useState<string | null>(null);

  // Add to Photobook states
  const [showAddToPhotobookModal, setShowAddToPhotobookModal] = useState(false);
  const [addToPhotobookAlbum, setAddToPhotobookAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [selectedImagesForPhotobook, setSelectedImagesForPhotobook] = useState<string[]>([]);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  // Track removed albums (hidden after adding to photobook)
  const [removedAlbumIds, setRemovedAlbumIds] = useState<number[]>([]);

  // Notification modal state
  const [notificationModal, setNotificationModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }>({ show: false, title: '', message: '', type: 'info' });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Product'];
  const photographers = ['All', ...Array.from(new Set(albums.map(a => a.photographer)))];
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);
  const [showPricingPlans, setShowPricingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'one-time' | 'plus' | 'pro' | null>(null);

  const STORAGE_PLANS = (() => {
    const cfg = getPlatformConfig();
    const plans = cfg.gallery.storagePlans;
    return [
      {
        id: 'one-time' as const,
        name: plans.find(p => p.id === 'one-time')?.name || 'One-Time',
        price: plans.find(p => p.id === 'one-time')?.price || 40,
        priceLabel: `$${plans.find(p => p.id === 'one-time')?.price || 40}`,
        billing: 'one-time payment',
        features: [
          `${plans.find(p => p.id === 'one-time')?.durationMonths || 5} months access`,
          'Renewable after expiry',
          'All albums unlocked',
          'No auto-renewal'
        ]
      },
      {
        id: 'plus' as const,
        name: plans.find(p => p.id === 'archive-plus')?.name || 'Archive Plus',
        price: plans.find(p => p.id === 'archive-plus')?.price || 14.99,
        priceLabel: `$${plans.find(p => p.id === 'archive-plus')?.price || 14.99}`,
        billing: '/month',
        popular: true,
        features: [
          'Monthly auto-renewal',
          `Cancel after ${plans.find(p => p.id === 'archive-plus')?.cancelAfterMonths || 4} months`,
          'All albums unlocked',
          'Continuous protection'
        ]
      },
      {
        id: 'pro' as const,
        name: plans.find(p => p.id === 'archive-pro')?.name || 'Archive Pro',
        price: plans.find(p => p.id === 'archive-pro')?.price || 139.99,
        priceLabel: `$${plans.find(p => p.id === 'archive-pro')?.price || 139.99}`,
        billing: '/year',
        bestValue: true,
        features: [
          'Annual auto-renewal',
          'Cancel anytime',
          'All albums unlocked',
          `Best value — save ${plans.find(p => p.id === 'archive-pro')?.savingsPercent || 22}%`
        ]
      }
    ];
  })();

  // --- Auto-archive expiry helpers (from platform config) ---
  const [archiveDays, setArchiveDays] = useState(365);
  const [warningDays, setWarningDays] = useState(30);
  useEffect(() => { fetchPlatformConfig().then(cfg => { setArchiveDays(cfg.gallery.archiveExpiryDays); setWarningDays(cfg.gallery.archiveWarningDays); }); }, []);
  const ARCHIVE_DAYS = archiveDays;
  const WARNING_DAYS = warningDays;

  const getAlbumExpiry = (album: any) => {
    // Use backend isLocked / expiresAt if available
    if (album.isLocked) return { expiresAt: new Date(album.expiresAt || 0), daysRemaining: 0, isExpired: true, isWarning: false };
    if (album.expiresAt) {
      const expMs = new Date(album.expiresAt).getTime();
      if (!isNaN(expMs)) {
        const daysRemaining = Math.ceil((expMs - Date.now()) / (24 * 60 * 60 * 1000));
        return { expiresAt: new Date(expMs), daysRemaining, isExpired: daysRemaining <= 0, isWarning: daysRemaining > 0 && daysRemaining <= WARNING_DAYS };
      }
    }
    // Fallback: client-side calculation from receivedDate
    const received = album.receivedDate || album.date;
    if (!received) return null;
    const receivedMs = new Date(received).getTime();
    if (isNaN(receivedMs)) return null;
    const expiresAt = new Date(receivedMs + ARCHIVE_DAYS * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return { expiresAt, daysRemaining, isExpired: daysRemaining <= 0, isWarning: daysRemaining > 0 && daysRemaining <= WARNING_DAYS };
  };

  // Filter albums - also exclude removed albums when not viewing photobooks
  const filteredAlbums = albums.filter(album => {
    // Hide removed albums unless viewing photobooks
    if (!viewingPhotobooks && removedAlbumIds.includes(album.id)) {
      return false;
    }
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         album.photographer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || album.category === filterCategory;
    const matchesPhotographer = filterPhotographer === 'All' || album.photographer === filterPhotographer;
    return matchesSearch && matchesCategory && matchesPhotographer;
  });

  // Stats - Albums
  const activeAlbums = albums.filter(a => !a.isArchived);
  const totalPhotos = activeAlbums.reduce((sum, a) => sum + a.photoCount, 0);
  const totalDownloaded = activeAlbums.reduce((sum, a) => sum + a.downloadedCount, 0);
  const totalFavorites = activeAlbums.reduce((sum, a) => sum + a.favoriteCount, 0);

  // Stats - Archives
  // Coordinator: uses dedicated coordinator/archives endpoint
  // Client: derived from main albums list (customer/archives endpoint doesn't exist)
  const archivedAlbums = userRole === 'event-coordinator' ? coordinatorArchives : clientArchivedAlbums;
  const archivedPhotos = archivedAlbums.reduce((sum, a) => sum + a.photoCount, 0);
  const archivedAmountDue = archivedAlbums.reduce((sum, a) => sum + (a.payment?.amountDue || 0), 0);

  // Stats - Photobooks
  const totalPhotobookImages = photobooks.reduce((sum, pb) => sum + pb.images.length, 0);

  // Functions
<<<<<<< Updated upstream
  const openMultiSelectView = (album: any) => {
=======
  // Max images limit for photobook (placeholder - will be set by backend later)
  const MAX_PHOTOBOOK_IMAGES = 10;

  const openMultiSelectView = (album: typeof clientAlbumsData[0]) => {
>>>>>>> Stashed changes
    setMultiSelectAlbum(album);
    setSelectedImages([]);
    // Auto-enter select mode when photobook exists
    setIsSelectMode(!!photobook);
    setShowMultiSelectView(true);
  };

  const closeMultiSelectView = () => {
    setShowMultiSelectView(false);
    setMultiSelectAlbum(null);
    setSelectedImages([]);
    setIsSelectMode(false);
  };

  const openImageViewer = (album: any, startIndex: number = 0) => {
    setViewerAlbum(album);
    setCurrentImageIndex(startIndex);
    setShowImageViewer(true);
    setShowMultiSelectView(false);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    if (multiSelectAlbum) {
      setShowMultiSelectView(true);
    }
    setViewerAlbum(null);
    setCurrentImageIndex(0);
  };

  const toggleImageSelection = (image: string) => {
    if (selectedImages.includes(image)) {
      setSelectedImages(selectedImages.filter(img => img !== image));
    } else {
<<<<<<< Updated upstream
      if (selectedImages.length < MAX_IMAGE_SELECTION) {
        setSelectedImages([...selectedImages, image]);
      }
=======
      // Enforce max limit when photobook exists
      if (photobook && selectedImages.length >= MAX_PHOTOBOOK_IMAGES) {
        setNotificationModal({ show: true, title: 'Maximum Reached', message: `You can only select up to ${MAX_PHOTOBOOK_IMAGES} images for your photobook.`, type: 'warning' });
        return;
      }
      setSelectedImages([...selectedImages, image]);
>>>>>>> Stashed changes
    }
  };

  const selectAllImages = () => {
    if (multiSelectAlbum) {
<<<<<<< Updated upstream
      if (selectedImages.length === Math.min(multiSelectAlbum.images.length, MAX_IMAGE_SELECTION)) {
        setSelectedImages([]);
      } else {
        setSelectedImages([...multiSelectAlbum.images].slice(0, MAX_IMAGE_SELECTION));
=======
      if (selectedImages.length === multiSelectAlbum.images.length || (photobook && selectedImages.length >= MAX_PHOTOBOOK_IMAGES)) {
        setSelectedImages([]);
      } else {
        // Cap at max when photobook exists
        if (photobook) {
          setSelectedImages(multiSelectAlbum.images.slice(0, MAX_PHOTOBOOK_IMAGES));
        } else {
          setSelectedImages([...multiSelectAlbum.images]);
        }
>>>>>>> Stashed changes
      }
    }
  };

  const openDeleteModal = (album: any) => {
    setAlbumToDelete(album);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = async () => {
    if (albumToDelete) {
      setIsProcessing(true);
      const success = await deleteGallery(albumToDelete.id);
      if (!success) {
        setIsProcessing(false);
        alert('Failed to delete album. Please try again.');
        return;
      }
      setAlbums(albums.filter(album => album.id !== albumToDelete.id));
      setShowDeleteModal(false);
      setAlbumToDelete(null);
      setIsProcessing(false);
    }
  };

  const handlePayNow = (payment: Payment) => {
    setPayNowPayment(payment);
    setShowPayNowModal(true);
  };

  const cancelDeleteAlbum = () => {
    setShowDeleteModal(false);
    setAlbumToDelete(null);
  };

  // Archive an album
  const handleArchiveAlbum = async (album: any) => {
    setIsProcessing(true);
    const success = await archiveGallery(album.id);
    if (success) {
      setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, isArchived: true } : a));
    } else {
      alert('Failed to archive album. Please try again.');
    }
    setIsProcessing(false);
  };

  // Unarchive an album
  const handleUnarchiveAlbum = async (album: any) => {
    setIsProcessing(true);
    const success = await unarchiveGallery(album.id);
    if (success) {
      setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, isArchived: false } : a));
    } else {
      alert('Failed to unarchive album. Please try again.');
    }
    setIsProcessing(false);
  };

  // Download a single image
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open image in new tab if fetch fails (e.g., CORS issues)
      window.open(imageUrl, '_blank');
    }
  };

  const handleBulkDownload = async () => {
    if (multiSelectAlbum && selectedImages.length > 0) {
      const albumName = multiSelectAlbum.title.replace(/[^a-z0-9]/gi, '_');
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const imageIndex = multiSelectAlbum.images.indexOf(image);
        const filename = `${albumName}_${imageIndex + 1}.jpg`;
        await downloadImage(image, filename);
        // Small delay between downloads to prevent browser blocking
        if (i < selectedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  // Download current image in viewer
  const handleDownloadCurrentImage = () => {
    if (viewerAlbum) {
      const albumName = viewerAlbum.title.replace(/[^a-z0-9]/gi, '_');
      const filename = `${albumName}_${currentImageIndex + 1}.jpg`;
      downloadImage(viewerAlbum.images[currentImageIndex], filename);
    }
  };

<<<<<<< Updated upstream
  const handleAddCurrentImageToPhotobook = () => {
    if (!viewerAlbum || photobooks.length === 0) return;
    const currentImage = viewerAlbum.images[currentImageIndex];
    const targetPhotobook = photobooks[0];
    if (targetPhotobook.images.includes(currentImage)) return;
    if (selectedImages.length >= MAX_IMAGE_SELECTION) return;
    const updatedPhotobooks = [...photobooks];
    updatedPhotobooks[0] = {
      ...updatedPhotobooks[0],
      images: [...updatedPhotobooks[0].images, currentImage],
      thumbnail: updatedPhotobooks[0].thumbnail || currentImage
    };
    setPhotobooks(updatedPhotobooks);
    setSelectedImages([...selectedImages, currentImage]);
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length > 0 && selectedAlbum) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedImages.length} image(s)?`);
      if (confirmDelete) {
        try {
          const deleteBase = userRole === 'event-coordinator' ? 'coordinator/galleries' : 'customer/albums';
          await dashboardAuthFetch(`${apiUrl}/api/remote/${deleteBase}/${selectedAlbum.id}/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedImages),
          });
        } catch (err) {
          console.error('Failed to bulk delete images:', err);
        }
        setSelectedImages([]);
      }
=======
  const handleBulkDelete = () => {
    if (selectedImages.length > 0) {
      const count = selectedImages.length;
      setConfirmationModal({
        show: true,
        title: 'Delete Images',
        message: `Are you sure you want to delete ${count} image(s)? This action cannot be undone.`,
        onConfirm: () => {
          setNotificationModal({ show: true, title: 'Images Deleted', message: `${count} image(s) deleted successfully!`, type: 'success' });
          setSelectedImages([]);
          setConfirmationModal({ show: false, title: '', message: '', onConfirm: () => {} });
        }
      });
>>>>>>> Stashed changes
    }
  };

  const getShareLink = (album: any) => {
    return `${process.env.NEXT_PUBLIC_LANDING_URL as string}/gallery/${album.id}`;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Delete photobook functions
  const openDeletePhotobookModal = (photobook: typeof photobooks[0]) => {
    setPhotobookToDelete(photobook);
    setShowDeletePhotobookModal(true);
  };

  const confirmDeletePhotobook = async () => {
    if (photobookToDelete) {
      setPhotobooks(photobooks.filter(pb => pb.id !== photobookToDelete.id));
      setShowDeletePhotobookModal(false);
      const id = photobookToDelete.id;
      setPhotobookToDelete(null);
      try {
        await dashboardAuthFetch(`${apiUrl}/api/remote/${photobookBase}/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete photobook:', err);
      }
    }
  };

  const cancelDeletePhotobook = () => {
    setShowDeletePhotobookModal(false);
    setPhotobookToDelete(null);
  };

  // Send photobook states
  const [showSendPhotobookModal, setShowSendPhotobookModal] = useState(false);
  const [photobookToSend, setPhotobookToSend] = useState<typeof photobooks[0] | null>(null);
  const [showPhotobookSuccessModal, setShowPhotobookSuccessModal] = useState(false);
  const [photobookSuccessMessage, setPhotobookSuccessMessage] = useState({ title: '', description: '' });

  // Photobook extras payment states
  const [showPhotobookPaymentModal, setShowPhotobookPaymentModal] = useState(false);
  const [photobookPaymentStep, setPhotobookPaymentStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [photobookPaymentPhone, setPhotobookPaymentPhone] = useState('');
  const [photobookPaymentMethod, setPhotobookPaymentMethod] = useState<'mtn' | 'airtel' | null>(null);
  const [photobookPaymentError, setPhotobookPaymentError] = useState('');
  const stopPhotobookPollingRef = useRef<(() => void) | null>(null);

  const handlePhotobookExtrasPayment = async () => {
    if (!selectedPhotobook || !photobookPaymentMethod || !photobookPaymentPhone.trim()) {
      setPhotobookPaymentError('Please select a payment method and enter your phone number');
      return;
    }

    setPhotobookPaymentError('');
    setPhotobookPaymentStep('processing');

    try {
      const telecom = getTelecomProvider(photobookPaymentMethod);
      const phone = photobookPaymentPhone.trim();
      const currencyId = (selectedPhotobook as any).currencyId || '';

      const result = await initiatePhotobookExtrasPayment(
        String(selectedPhotobook.id), phone, telecom, currencyId
      );

      if (!result.success || !result.data) {
        setPhotobookPaymentError(result.error || 'Failed to initiate payment');
        setPhotobookPaymentStep('failed');
        return;
      }

      const stopPolling = pollPaymentStatus(result.data.refid, {
        onSuccess: () => {
          setPhotobookPaymentStep('success');
          // Update photobook status locally
          setPhotobooks(prev => prev.map(p =>
            p.id === selectedPhotobook.id ? { ...p, status: 'RESUBMITTED', paymentRequired: false } : p
          ));
          if (selectedPhotobook) {
            setSelectedPhotobook({ ...selectedPhotobook, status: 'RESUBMITTED', paymentRequired: false });
          }
        },
        onFailure: () => {
          setPhotobookPaymentStep('failed');
          setPhotobookPaymentError('Payment was not completed. Please try again.');
        },
        onError: (error) => {
          setPhotobookPaymentStep('failed');
          setPhotobookPaymentError(error);
        },
      });
      stopPhotobookPollingRef.current = stopPolling;
    } catch (error) {
      setPhotobookPaymentError(error instanceof Error ? error.message : 'Payment failed');
      setPhotobookPaymentStep('failed');
    }
  };

  const resetPhotobookPayment = () => {
    setShowPhotobookPaymentModal(false);
    setPhotobookPaymentStep('select');
    setPhotobookPaymentPhone('');
    setPhotobookPaymentMethod(null);
    setPhotobookPaymentError('');
    if (stopPhotobookPollingRef.current) {
      stopPhotobookPollingRef.current();
      stopPhotobookPollingRef.current = null;
    }
  };

  const handleSendPhotobook = async () => {
    if (!photobookToSend) return;
    const pb = photobookToSend;

    setShowSendPhotobookModal(false);
    setPhotobookToSend(null);
    // Optimistic update
    setPhotobooks(prev => prev.map(p => p.id === pb.id ? { ...p, isSent: true, sentAt: new Date().toISOString(), status: 'SENT_TO_PHOTOGRAPHER' } : p));
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/${photobookBase}/${pb.id}/send`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to send photobook:', err);
    }
    setPhotobookSuccessMessage({
      title: 'Photobook Sent Successfully',
      description: `"${pb.name}" has been sent to the photographer. They will be notified and can view your selected photos.`,
    });
    setShowPhotobookSuccessModal(true);
  };

  const handleAcceptPhotobook = async (photobookId: number | string) => {
    setPhotobooks(prev => prev.map(p => p.id === photobookId ? { ...p, status: 'COMPLETED' } : p));
    try {
      await dashboardAuthFetch(`${apiUrl}/api/remote/${photobookBase}/${photobookId}/accept`, { method: 'POST' });
      setPhotobookSuccessMessage({
        title: 'Photobook Accepted',
        description: 'You have accepted the photographer\'s edits. The photobook is now complete.',
      });
      setShowPhotobookSuccessModal(true);
    } catch (err) {
      console.error('Failed to accept photobook:', err);
    }
  };

  // Setup wizard functions (Select Album → Layout → Images)
  const openSetupWizard = (photobook: typeof photobooks[0]) => {
    setSetupPhotobookId(photobook.id);
    // Find the source album by matching media IDs so user can select/deselect from all album images
    const pbMediaIds = new Set(photobook.mediaIds || []);
    const sourceAlbum = albums.find(a =>
      (a.mediaIds || []).some((id: string) => pbMediaIds.has(id))
    );
    if (sourceAlbum) {
      setSetupSelectedAlbum(sourceAlbum);
    } else {
      // Fallback: synthetic album from photobook data
      setSetupSelectedAlbum({
        id: photobook.id,
        title: photobook.name,
        thumbnail: photobook.thumbnail,
        images: [...photobook.images],
        mediaIds: [...(photobook.mediaIds || [])],
        photographer: '',
      });
    }
    setSetupLayout(photobook.layout ? photobook.layout as 'book-flip' | 'mosaic' | 'gallery-wall' : 'book-flip');
    setSetupSelectedImages([...photobook.images]);
    setSetupStep(2);
    setSetupCurrentImageIndex(0);
    setShowCoverPicker(false);
    setSetupCoverImage('');
    setShowSetupWizard(true);
  };

  const resetSetupWizard = () => {
    setShowSetupWizard(false);
    setSetupPhotobookId(null);
    setSetupSelectedAlbum(null);
    setSetupLayout('book-flip');
    setSetupSelectedImages([]);
    setSetupStep(1);
    setSetupCurrentImageIndex(0);
    setShowCoverPicker(false);
    setSetupCoverImage('');
    setStep3ViewMode('album-grid');
    setSetupSelectMode(false);
    setExtraUnlockedImages([]);
    setShowExtraImagePayment(false);
    setPendingUnlockImage(null);
    setExtraPaymentMethod(null);
    setExtraPaymentShowReceipt(false);
    setExtraDonationAmount('');
    setExtraCustomDonation('');
    setExtraDonationSkipped(false);
    setExtraShowCustomInput(false);
    setShowLimitReachedMessage(false);
    setHasSeenLimitMessage(false);
  };

  // Open wizard for NEW photobook creation (no existing photobook)
  const openCreateWizard = () => {
    setSetupPhotobookId(null);
    setSetupSelectedAlbum(null);
    setSetupLayout('book-flip');
    setSetupSelectedImages([]);
    setSetupStep(1);
    setSetupCurrentImageIndex(0);
    setShowCoverPicker(false);
    setSetupCoverImage('');
    setShowSetupWizard(true);
  };

  // Opens the cover picker instead of saving directly
  const saveSetupWizard = () => {
    if (setupSelectedImages.length === 0) return;
    setSetupCoverImage(setupSelectedImages[0]);
    setShowCoverPicker(true);
  };

  // Actually saves after the user picks a cover
  const confirmSaveWithCover = async () => {
    if (setupSelectedImages.length === 0) return;

    if (setupPhotobookId) {
      // Editing existing photobook
      const existingPb = photobooks.find(pb => pb.id === setupPhotobookId);
      const updatedPhotobooks = photobooks.map(pb => {
        if (pb.id === setupPhotobookId) {
          return {
            ...pb,
            images: [...setupSelectedImages],
            thumbnail: setupCoverImage || setupSelectedImages[0],
            layout: setupLayout as 'book-flip' | 'mosaic' | 'gallery-wall' | ''
          };
        }
        return pb;
      });
      setPhotobooks(updatedPhotobooks);

      // Persist to backend
      try {
        // Resolve media IDs from the source (selected album or existing photobook)
        const source = setupSelectedAlbum || existingPb;
        const selectedMediaIds = source?.mediaIds
          ? setupSelectedImages.map((imgUrl: string) => {
              const idx = (source.images || []).indexOf(imgUrl);
              return idx >= 0 ? source.mediaIds[idx] : null;
            }).filter(Boolean)
          : [];

        await dashboardAuthFetch(`${apiUrl}/api/remote/${photobookBase}/${setupPhotobookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: existingPb?.name || '',
            description: existingPb?.description || '',
            layout: setupLayout,
            coverImage: setupCoverImage || setupSelectedImages[0] || '',
            ...(selectedMediaIds.length > 0 ? { mediaIds: selectedMediaIds } : {}),
          }),
        });
      } catch (err) {
        console.error('Failed to update photobook:', err);
      }
    } else {
      // Creating new photobook
      const album = setupSelectedAlbum;
      const name = album?.title || 'Untitled Photobook';
      const description = album?.category ? `${album.category} — ${album.date || ''}` : album?.date || '';
      const newPhotobook = {
        id: Date.now(),
        name,
        description,
        thumbnail: setupCoverImage || setupSelectedImages[0],
        images: [...setupSelectedImages],
        layout: setupLayout as 'book-flip' | 'mosaic' | 'gallery-wall' | '',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      setPhotobooks(prev => [...prev, newPhotobook]);
      setPageView('photobooks');

      // Persist to backend
      try {
        // Collect media IDs from selected album images if available
        const selectedMediaIds = setupSelectedAlbum?.mediaIds
          ? setupSelectedImages.map((imgUrl: string) => {
              const idx = (setupSelectedAlbum.images || []).indexOf(imgUrl);
              return idx >= 0 ? setupSelectedAlbum.mediaIds[idx] : null;
            }).filter(Boolean)
          : [];

        const postBody: Record<string, any> = {
          name,
          description,
          layout: setupLayout,
          coverImage: setupCoverImage || setupSelectedImages[0] || '',
          ...(selectedMediaIds.length > 0 ? { mediaIds: selectedMediaIds } : {}),
        };
        // Pass eventId if the album is linked to an event
        if (setupSelectedAlbum?.eventId) {
          postBody.eventId = setupSelectedAlbum.eventId;
        }
        const res = await dashboardAuthFetch(`${apiUrl}/api/remote/${photobookBase}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody),
        });
        if (res.ok) {
          const result = await res.json();
          const created = result?.data;
          if (created?.id) {
            setPhotobooks(prev => prev.map(pb =>
              pb.id === newPhotobook.id ? {
                ...pb,
                id: created.id,
                status: created.status || 'DRAFT',
                freePhotosLimit: created.freePhotosLimit,
                extraPhotosCount: created.extraPhotosCount || 0,
                extraPhotosAmount: created.extraPhotosAmount || 0,
                paymentRequired: created.paymentRequired || false,
                eventId: created.eventId || '',
              } : pb
            ));
          }
        }
      } catch (err) {
        console.error('Failed to save photobook to backend:', err);
      }
    }

    if (setupSelectedAlbum) {
      setAlbums(albums.filter(album => album.id !== setupSelectedAlbum.id));
    }
    resetSetupWizard();
  };

  const toggleSetupImageSelection = (image: string) => {
    if (setupSelectedImages.includes(image)) {
      setSetupSelectedImages(setupSelectedImages.filter(img => img !== image));
      // If it was an extra unlocked image, remove from extras too
      if (extraUnlockedImages.includes(image)) {
        setExtraUnlockedImages(extraUnlockedImages.filter(img => img !== image));
      }
      // If it was a pending extra, remove from pending too
      if (pendingUnlockImages.includes(image)) {
        setPendingUnlockImages(pendingUnlockImages.filter(img => img !== image));
      }
    } else {
      if (setupSelectedImages.length < MAX_IMAGE_SELECTION) {
        const newSelection = [...setupSelectedImages, image];
        setSetupSelectedImages(newSelection);
        // Show limit reached message when hitting MAX
        if (newSelection.length === MAX_IMAGE_SELECTION && !hasSeenLimitMessage) {
          setShowLimitReachedMessage(true);
          setHasSeenLimitMessage(true);
        }
      } else if (extraUnlockedImages.includes(image)) {
        // Already unlocked extra — add it
        setSetupSelectedImages([...setupSelectedImages, image]);
      } else {
        // Beyond the free limit — add as pending extra and select it
        setPendingUnlockImages(prev => [...prev, image]);
        setSetupSelectedImages([...setupSelectedImages, image]);
        // Show limit message on first extra selection
        if (!hasSeenLimitMessage) {
          setShowLimitReachedMessage(true);
          setHasSeenLimitMessage(true);
        }
      }
    }
  };

  const handleUnlockExtraImage = (image?: string) => {
    if (image) setPendingUnlockImage(image);
    setExtraPaymentMethod(null);
    setExtraPaymentShowReceipt(false);
    setExtraDonationAmount('');
    setExtraCustomDonation('');
    setExtraDonationSkipped(false);
    setExtraShowCustomInput(false);
    setShowExtraImagePayment(true);
  };

  const handleExtraSelectDonation = (amount: string) => {
    setExtraDonationSkipped(false);
    if (amount === 'custom') {
      setExtraDonationAmount('custom');
      setExtraShowCustomInput(true);
    } else {
      setExtraDonationAmount(amount);
      setExtraShowCustomInput(false);
      setExtraCustomDonation('');
    }
  };

  const handleExtraSkipDonation = () => {
    setExtraDonationSkipped(true);
    setExtraDonationAmount('');
    setExtraCustomDonation('');
    setExtraShowCustomInput(false);
  };

  const extraDonationValue = extraDonationAmount === 'custom' ? (parseFloat(extraCustomDonation) || 0) : (parseFloat(extraDonationAmount) || 0);
  const extraDonationAddressed = extraDonationSkipped || extraDonationValue > 0;
  const pendingExtrasCount = pendingUnlockImages.length;
  const pendingExtrasCost = pendingExtrasCount * EXTRA_IMAGE_PRICE;
  const extraTotalWithDonation = pendingExtrasCost + extraDonationValue;

  const handleExtraImagePaymentConfirm = () => {
    if (pendingUnlockImage && extraPaymentMethod && extraDonationAddressed) {
      setExtraPaymentShowReceipt(true);
    }
  };

  const handleExtraImagePaymentDone = () => {
    // Unlock all pending extras
    const newUnlocked = [...extraUnlockedImages, ...pendingUnlockImages];
    if (pendingUnlockImage && !newUnlocked.includes(pendingUnlockImage)) {
      newUnlocked.push(pendingUnlockImage);
    }
    setExtraUnlockedImages(newUnlocked);
    setPendingUnlockImages([]);
    setShowExtraImagePayment(false);
    setPendingUnlockImage(null);
    setExtraPaymentMethod(null);
    setExtraPaymentShowReceipt(false);
    setExtraDonationAmount('');
    setExtraCustomDonation('');
    setExtraDonationSkipped(false);
    setExtraShowCustomInput(false);
  };

  const extraImagesTotalCost = (extraUnlockedImages.filter(img => setupSelectedImages.includes(img)).length + pendingUnlockImages.length) * EXTRA_IMAGE_PRICE;

  const handleAddToPhotobook = () => {
    if (selectedImages.length === 0 || photobooks.length === 0) return;
    const updatedPhotobooks = [...photobooks];
    const targetPhotobook = updatedPhotobooks[0];
    targetPhotobook.images = [...targetPhotobook.images, ...selectedImages];
    if (!targetPhotobook.thumbnail && selectedImages.length > 0) {
      targetPhotobook.thumbnail = selectedImages[0];
    }
    setPhotobooks(updatedPhotobooks);
    if (multiSelectAlbum) {
      setAlbums(albums.filter(album => album.id !== multiSelectAlbum.id));
    }
    setSelectedImages([]);
    setIsSelectMode(false);
    setShowMultiSelectView(false);
    setMultiSelectAlbum(null);
    setPageView('photobooks');
  };

  // Check if an image at a given index is locked (extra photo beyond free limit, unpaid)
  const isPhotobookImageLocked = (photobook: typeof photobooks[0], index: number): boolean => {
    if (photobook.status !== 'PENDING_PAYMENT') return false;
    const freeLimit = photobook.freePhotosLimit ?? photobook.images.length;
    return index >= freeLimit;
  };

  const openPhotobookBrowse = (photobook: typeof photobooks[0]) => {
    const browsePhotobook = photobook.layout ? photobook : { ...photobook, layout: 'book-flip' as const };
    setSelectedPhotobook(browsePhotobook);
    setPhotobookSelectedImages([]);
    setIsPhotobookSelectMode(false);
    setBookCurrentPage(0);
    setShowPhotobookBrowse(true);
  };

  const closePhotobookBrowse = () => {
    setShowPhotobookBrowse(false);
    setSelectedPhotobook(null);
    setPhotobookSelectedImages([]);
    setIsPhotobookSelectMode(false);
  };

  const openPhotobookImageViewer = (photobook: typeof photobooks[0], startIndex: number = 0) => {
    setSelectedPhotobook(photobook);
    setPhotobookCurrentImageIndex(startIndex);
    setShowPhotobookImageViewer(true);
    setShowPhotobookBrowse(false);
  };

  const closePhotobookImageViewer = () => {
    setShowPhotobookImageViewer(false);
    if (selectedPhotobook) {
      setShowPhotobookBrowse(true);
    }
    setPhotobookCurrentImageIndex(0);
  };

  const handlePhotobookBulkDownload = async () => {
    if (selectedPhotobook && photobookSelectedImages.length > 0) {
      const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
      for (let i = 0; i < photobookSelectedImages.length; i++) {
        const image = photobookSelectedImages[i];
        const imageIndex = selectedPhotobook.images.indexOf(image);
        const filename = `${bookName}_${imageIndex + 1}.jpg`;
        await downloadImage(image, filename);
        if (i < photobookSelectedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  const handlePhotobookBulkDelete = async () => {
    if (photobookSelectedImages.length > 0 && selectedPhotobook) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${photobookSelectedImages.length} image(s) from this photobook?`);
      if (confirmDelete) {
        try {
          const deletePhotobookBase = userRole === 'event-coordinator' ? 'coordinator/photobook' : 'customer/events/photobook';
          await dashboardAuthFetch(`${apiUrl}/api/remote/${deletePhotobookBase}/${selectedPhotobook.id}/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photobookSelectedImages),
          });
        } catch (err) {
          console.error('Failed to bulk delete photobook images:', err);
        }
        const updatedPhotobooks = photobooks.map(pb => {
          if (pb.id === selectedPhotobook.id) {
            return {
              ...pb,
              images: pb.images.filter(img => !photobookSelectedImages.includes(img))
            };
          }
          return pb;
        });
        setPhotobooks(updatedPhotobooks);
        setSelectedPhotobook({
          ...selectedPhotobook,
          images: selectedPhotobook.images.filter(img => !photobookSelectedImages.includes(img))
        });
        setPhotobookSelectedImages([]);
      }
    }
  };

  const handlePhotobookBulkShare = () => {
    if (photobookSelectedImages.length > 0 && selectedPhotobook) {
      setShareAlbum({
        id: selectedPhotobook.id,
        title: selectedPhotobook.name,
        photographer: '',
        photographerAvatar: '',
        category: '',
        date: '',
        isArchived: false,
        receivedDate: '',
        downloadedCount: 0,
        favoriteCount: 0,
        images: photobookSelectedImages,
        photoCount: photobookSelectedImages.length,
        thumbnail: selectedPhotobook.thumbnail || photobookSelectedImages[0]
      });
      setShowShareModal(true);
    }
  };

  const handleSetPhotobookThumbnail = (image: string) => {
    if (selectedPhotobook) {
      const updatedPhotobooks = photobooks.map(pb => {
        if (pb.id === selectedPhotobook.id) {
          return { ...pb, thumbnail: image };
        }
        return pb;
      });
      setPhotobooks(updatedPhotobooks);
      setSelectedPhotobook({ ...selectedPhotobook, thumbnail: image });
      setShowThumbnailSelector(false);
    }
  };

  // Filter photobooks based on search
  const filteredPhotobooks = photobooks.filter(pb => {
    const matchesSearch = pb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pb.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Keyboard navigation for image viewer
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showImageViewer || !viewerAlbum) return;

    if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (e.key === 'ArrowRight' && currentImageIndex < viewerAlbum.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (e.key === 'Escape') {
      closeImageViewer();
    }
  }, [showImageViewer, viewerAlbum, currentImageIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary, overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
            overflow-x: hidden !important;
          }
          .mobile-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .mobile-header-buttons {
            flex-wrap: wrap !important;
            gap: 0.375rem !important;
          }
          .mobile-header-buttons button {
            min-height: 40px !important;
          }
          .view-toggle-container {
            align-self: stretch !important;
          }
          .view-toggle-container button {
            font-size: 0.8rem !important;
            padding: 0.5rem 0.875rem !important;
            min-height: 40px !important;
          }
          .mobile-title {
            font-size: 1.5rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }
          .mobile-tabs {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          .mobile-tabs::-webkit-scrollbar {
            display: none !important;
          }
          .mobile-tabs button {
            flex-shrink: 0 !important;
            min-height: 40px !important;
          }
          .mobile-albums-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-photobooks-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-multi-select-header {
            padding: 0.75rem 1rem !important;
            flex-wrap: wrap !important;
            gap: 0.75rem !important;
          }
          .mobile-multi-select-title {
            font-size: 1rem !important;
          }
          .mobile-multi-select-grid {
            padding: 1rem !important;
          }
          .mobile-multi-select-grid > div {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mobile-select-controls {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            padding: 0.75rem 1rem !important;
          }
          .mobile-bulk-actions {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .mobile-bulk-actions button {
            font-size: 0.75rem !important;
            padding: 0.375rem 0.75rem !important;
          }
          .mobile-wizard-images {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .mobile-book-container {
            flex-direction: column !important;
            min-height: auto !important;
          }
          .mobile-book-container > div {
            height: 250px !important;
            border-radius: 0.5rem !important;
          }
          .mobile-mosaic-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-auto-rows: 150px !important;
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .mobile-multi-select-grid > div {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          .mobile-wizard-images {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mobile-header-buttons {
            gap: 0.25rem !important;
          }
          .mobile-header-buttons button {
            font-size: 0.7rem !important;
            padding: 0.375rem 0.5rem !important;
          }
          .mobile-book-container > div {
            height: 200px !important;
          }
          .mobile-mosaic-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-auto-rows: 120px !important;
          }
        }
        @media (max-width: 375px) {
          .mobile-main-content {
            padding: 0.5rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.375rem !important;
          }
          .mobile-stats-grid > div {
            padding: 0.5rem !important;
          }
          .mobile-header {
            gap: 0.75rem !important;
          }
          .mobile-header-buttons {
            flex-wrap: wrap !important;
            gap: 0.25rem !important;
          }
          .mobile-header-buttons button {
            font-size: 0.65rem !important;
            padding: 0.3rem 0.4rem !important;
          }
          .mobile-title {
            font-size: 1.25rem !important;
          }
          .mobile-albums-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mobile-photobooks-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .mobile-wizard-images {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.375rem !important;
          }
          .mobile-book-container {
            flex-direction: column !important;
            min-height: auto !important;
            gap: 0.25rem !important;
          }
          .mobile-book-container > div {
            height: 160px !important;
            border-radius: 0.375rem !important;
          }
          .mobile-mosaic-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            grid-auto-rows: 100px !important;
            gap: 0.375rem !important;
          }
          .mobile-multi-select-grid > div {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.375rem !important;
          }
          .mobile-select-controls {
            padding: 0.5rem 0.75rem !important;
          }
          .mobile-bulk-actions button {
            font-size: 0.7rem !important;
            padding: 0.3rem 0.5rem !important;
          }
        }

        /* Step 3 Fullscreen Image Viewer Responsive Styles */
        @media (max-width: 1024px) {
          .step3-fullscreen-image {
            width: calc(100vw - 140px) !important;
            max-width: none !important;
            height: calc(100vh - 160px) !important;
            padding: 0 60px !important;
          }
          .step3-nav-button {
            width: 48px !important;
            height: 48px !important;
          }
          .step3-thumbnail-strip {
            padding: 0.4rem 0.75rem !important;
          }
          .step3-thumbnail {
            width: 44px !important;
            height: 33px !important;
          }
        }

        @media (max-width: 768px) {
          .step3-fullscreen-image {
            width: calc(100vw - 100px) !important;
            height: calc(100vh - 140px) !important;
            padding: 0 40px !important;
          }
          .step3-nav-button {
            width: 40px !important;
            height: 40px !important;
            left: 0.5rem !important;
          }
          .step3-nav-button-right {
            right: 0.5rem !important;
            left: auto !important;
          }
          .step3-header {
            padding: 0.75rem 1rem !important;
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .step3-header-info {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .step3-header-buttons {
            gap: 0.4rem !important;
          }
          .step3-header-buttons button {
            padding: 0.4rem 0.6rem !important;
            font-size: 0.75rem !important;
          }
          .step3-btn-text {
            display: none !important;
          }
          .step3-thumbnail-strip {
            padding: 0.35rem 0.5rem !important;
          }
          .step3-thumbnail {
            width: 40px !important;
            height: 30px !important;
          }
          .step3-image-grid-container {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
            gap: 0.4rem !important;
          }
        }

        @media (max-width: 480px) {
          .step3-fullscreen-image {
            width: calc(100vw - 60px) !important;
            height: calc(100vh - 120px) !important;
            padding: 0 25px !important;
          }
          .step3-nav-button {
            width: 36px !important;
            height: 36px !important;
            left: 0.25rem !important;
          }
          .step3-nav-button-right {
            right: 0.25rem !important;
            left: auto !important;
          }
          .step3-header {
            padding: 0.5rem 0.75rem !important;
          }
          .step3-header-info {
            gap: 0.35rem !important;
          }
          .step3-header-info > div:first-child {
            display: none !important;
          }
          .step3-header-buttons button {
            padding: 0.35rem 0.5rem !important;
            font-size: 0.7rem !important;
          }
          .step3-thumbnail-strip {
            padding: 0.25rem 0.35rem !important;
            gap: 0.25rem !important;
          }
          .step3-thumbnail {
            width: 32px !important;
            height: 24px !important;
          }
          .step3-image-grid-container {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
            gap: 0.3rem !important;
            padding: 0.5rem !important;
          }
          .step3-grid-badge {
            width: 20px !important;
            height: 20px !important;
            font-size: 0.6rem !important;
          }
          .step3-grid-checkmark {
            width: 18px !important;
            height: 18px !important;
          }
        }

        /* Wizard modal mobile styles */
        @media (max-width: 768px) {
          .wizard-modal-overlay {
            padding: 0.5rem !important;
            padding-bottom: 5rem !important;
            align-items: flex-start !important;
            padding-top: 2rem !important;
          }
          .wizard-modal-inner {
            max-width: 100% !important;
            width: 100% !important;
            max-height: calc(100vh - 7rem) !important;
            border-radius: 0.75rem !important;
          }
          .wizard-header {
            padding: 1rem !important;
          }
          .wizard-header h2 {
            font-size: 1rem !important;
          }
          .wizard-body {
            padding: 0.75rem 1rem !important;
          }
          .wizard-footer {
            padding: 0.75rem 1rem !important;
          }
          .wizard-footer button {
            min-height: 44px !important;
            flex: 1 !important;
            font-size: 0.85rem !important;
          }
          .wizard-album-item {
            gap: 0.75rem !important;
            padding: 0.625rem !important;
          }
          .wizard-album-thumb {
            width: 52px !important;
            height: 52px !important;
          }
          .wizard-layout-item {
            gap: 0.75rem !important;
            padding: 0.75rem !important;
          }
          .wizard-layout-icon {
            width: 40px !important;
            height: 40px !important;
          }
          .step3-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            padding: 0.75rem 1rem !important;
          }
          .step3-header-left {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }
          .step3-header-right {
            width: 100% !important;
            justify-content: flex-end !important;
          }
          .step3-header-right button {
            min-height: 40px !important;
          }
        }
        @media (max-width: 375px) {
          .wizard-modal-overlay {
            padding: 0.25rem !important;
            padding-bottom: 5rem !important;
            padding-top: 1rem !important;
          }
          .wizard-modal-inner {
            border-radius: 0.5rem !important;
            max-height: calc(100vh - 6rem) !important;
          }
          .wizard-header {
            padding: 0.75rem !important;
          }
          .wizard-header h2 {
            font-size: 0.9rem !important;
          }
          .wizard-header p {
            font-size: 0.7rem !important;
          }
          .wizard-body {
            padding: 0.5rem 0.75rem !important;
          }
          .wizard-footer {
            padding: 0.5rem 0.75rem !important;
          }
          .wizard-footer button {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.8rem !important;
          }
          .wizard-album-thumb {
            width: 44px !important;
            height: 44px !important;
          }
          .wizard-album-item h4 {
            font-size: 0.8rem !important;
          }
          .wizard-album-item p {
            font-size: 0.7rem !important;
          }
          .wizard-layout-icon {
            width: 36px !important;
            height: 36px !important;
          }
          .wizard-layout-item h4 {
            font-size: 0.85rem !important;
          }
          .wizard-layout-item p {
            font-size: 0.7rem !important;
          }
          .step3-header-left > span {
            font-size: 0.7rem !important;
            padding: 0.25rem 0.5rem !important;
          }
          .step3-header-right button {
            padding: 0.375rem 0.5rem !important;
            font-size: 0.75rem !important;
          }
          .step3-album-info h3 {
            font-size: 0.85rem !important;
          }
          .step3-album-info p {
            font-size: 0.7rem !important;
          }
        }
      `}</style>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} />

        {/* Main Content */}
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Header with View Toggle */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600', margin: 0 }}>My Gallery</h1>
              <p className="mobile-subtitle" style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                {pageView === 'archives'
                  ? 'Browse and restore your archived albums'
                  : pageView === 'photobooks'
                  ? 'View your created photobooks and collections'
                  : 'Albums and photos from your completed events, shared by your photographers'}
              </p>
            </div>

            {/* View Toggle Buttons */}
            <div className="view-toggle-container" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              backgroundColor: actualTheme === 'dark' ? '#1E293B' : '#E2E8F0',
              padding: '0.375rem',
              borderRadius: '0.75rem',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <button
                onClick={() => setPageView('albums')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: pageView === 'albums'
                    ? '#F20C8F'
                    : (actualTheme === 'dark' ? 'transparent' : 'transparent'),
                  color: pageView === 'albums'
                    ? 'white'
                    : (actualTheme === 'dark' ? '#94A3B8' : '#64748B'),
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: pageView === 'albums'
                    ? '0 2px 8px rgba(242, 12, 143, 0.4)'
                    : 'none'
                }}
              >
                <AlbumsViewIcon active={pageView === 'albums'} />
                Albums
              </button>
              <button
                onClick={() => setPageView('archives')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: pageView === 'archives'
                    ? '#F20C8F'
                    : (actualTheme === 'dark' ? 'transparent' : 'transparent'),
                  color: pageView === 'archives'
                    ? 'white'
                    : (actualTheme === 'dark' ? '#94A3B8' : '#64748B'),
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: pageView === 'archives'
                    ? '0 2px 8px rgba(242, 12, 143, 0.4)'
                    : 'none'
                }}
              >
                <ArchivesViewIcon active={pageView === 'archives'} />
                Archived
              </button>
              <button
                onClick={() => setPageView('photobooks')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: pageView === 'photobooks'
                    ? '#F20C8F'
                    : (actualTheme === 'dark' ? 'transparent' : 'transparent'),
                  color: pageView === 'photobooks'
                    ? 'white'
                    : (actualTheme === 'dark' ? '#94A3B8' : '#64748B'),
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: pageView === 'photobooks'
                    ? '0 2px 8px rgba(242, 12, 143, 0.4)'
                    : 'none'
                }}
              >
                <PhotobooksViewIcon active={pageView === 'photobooks'} />
                Photobooks
              </button>

              {/* Photobook Buttons */}
              <button
                onClick={() => {
                  if (photobook) {
                    setNotificationModal({ show: true, title: 'Photobook Exists', message: 'You already have a photobook created. Only one photobook is supported at this time.', type: 'info' });
                  } else {
                    setShowCreatePhotobookModal(true);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                  backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF',
                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                <PlusIcon />
                Create Photobook
              </button>

              {photobook && (
                <button
                  onClick={() => setViewingPhotobooks(!viewingPhotobooks)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                    backgroundColor: viewingPhotobooks
                      ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85')
                      : (actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF'),
                    color: viewingPhotobooks ? 'white' : (actualTheme === 'dark' ? '#60A5FA' : '#083A85'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  <BookIcon />
                  {viewingPhotobooks ? 'View Sent Albums' : 'View Photobooks'}
                </button>
              )}
            </div>
          </header>

          {/* Action Buttons */}
          <div className="mobile-header-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: viewMode === 'grid' ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                backgroundColor: viewMode === 'grid' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF') : colors.bgCard,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <GridIcon active={viewMode === 'grid'} activeColor={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: viewMode === 'list' ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                backgroundColor: viewMode === 'list' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF') : colors.bgCard,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ListIcon active={viewMode === 'list'} activeColor={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} />
            </button>
            {albums.length > 0 && (
              <button
                onClick={openCreateWizard}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
                  backgroundColor: '#083A85',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create Photobook
              </button>
            )}
          </div>

          {/* Stats Cards - Adapt to current view */}
          {pageView === 'albums' ? (
            <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #083A85' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Albums</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{activeAlbums.length}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Photos</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{totalPhotos}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #16A34A' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Downloaded</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{totalDownloaded}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #DC2626' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Favorites</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>{totalFavorites}</div>
              </div>
            </div>
          ) : pageView === 'archives' ? (
            <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #DC2626' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Archived Albums</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>{archivedAlbums.length}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #083A85' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Archived Photos</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{archivedPhotos}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #F59E0B' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Amount Due</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>{formatPrice(archivedAmountDue)}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #EF4444' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Locked</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>{archivedAlbums.length}</div>
              </div>
            </div>
          ) : pageView === 'photobooks' ? (
            <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #083A85' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Photobooks</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{photobooks.length}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Images</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{totalPhotobookImages}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Available Albums</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{activeAlbums.length}</div>
              </div>
              <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Unlocked</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{photobooks.length}</div>
              </div>
            </div>
          ) : null}


          {/* Filters - Adapt to current view */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard }}>
            <div className="mobile-tabs" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder={
                    pageView === 'archives'
                      ? 'Search archived albums...'
                      : pageView === 'photobooks'
                      ? 'Search photobooks...'
                      : 'Search albums or photographers...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter - Albums & Archives views */}
              {(pageView === 'albums' || pageView === 'archives') && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    padding: '0.625rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    cursor: 'pointer'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                  ))}
                </select>
              )}

              {/* Photographer Filter - Albums & Archives views */}
              {(pageView === 'albums' || pageView === 'archives') && (
                <select
                  value={filterPhotographer}
                  onChange={(e) => setFilterPhotographer(e.target.value)}
                  style={{
                    padding: '0.625rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    cursor: 'pointer'
                  }}
                >
                  {photographers.map(p => (
                    <option key={p} value={p}>{p === 'All' ? 'All Photographers' : p}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

<<<<<<< Updated upstream
          {/* Albums Grid/List or Photobooks View */}
          {pageView === 'albums' ? (
            <>
              {/* Expiry warning banner */}
              {(() => {
                const expiringAlbums = filteredAlbums.filter(a => { const exp = getAlbumExpiry(a); return exp && exp.isWarning; });
                const expiredAlbums = filteredAlbums.filter(a => { const exp = getAlbumExpiry(a); return exp && exp.isExpired; });
                if (expiringAlbums.length === 0 && expiredAlbums.length === 0) return null;
                return (
                  <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {expiredAlbums.length > 0 && (
                      <div
                        onClick={() => setPageView('archives')}
                        style={{ padding: '0.75rem 1rem', backgroundColor: actualTheme === 'dark' ? 'rgba(220,38,38,0.15)' : '#FEF2F2', border: '1px solid', borderColor: actualTheme === 'dark' ? 'rgba(220,38,38,0.3)' : '#FECACA', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 600, flex: 1 }}>
                          {expiredAlbums.length} album{expiredAlbums.length !== 1 ? 's have' : ' has'} exceeded the {ARCHIVE_DAYS}-day free storage period and {expiredAlbums.length !== 1 ? 'are' : 'is'} now archived.
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                          Unlock Now &rarr;
                        </span>
                      </div>
                    )}
                    {expiringAlbums.length > 0 && (
                      <div style={{ padding: '0.75rem 1rem', backgroundColor: actualTheme === 'dark' ? 'rgba(234,179,8,0.15)' : '#FFFBEB', border: '1px solid', borderColor: actualTheme === 'dark' ? 'rgba(234,179,8,0.3)' : '#FDE68A', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span style={{ fontSize: '0.85rem', color: '#B45309', fontWeight: 600 }}>
                          {expiringAlbums.length} album{expiringAlbums.length !== 1 ? 's are' : ' is'} expiring within {WARNING_DAYS} days. Download your photos before they are archived.
                        </span>
                      </div>
                    )}
=======
          {/* Photobook View or Albums Grid/List */}
          {viewingPhotobooks && photobook ? (
            // Photobook View
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  border: `1px solid ${colors.borderPrimary}`,
                  cursor: 'pointer'
                }}
                onClick={() => setShowPhotobookModal(true)}
              >
                {/* Photobook Thumbnail */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden', backgroundColor: colors.bgTertiary }}>
                  {photobook.thumbnail ? (
                    <Image src={photobook.thumbnail} alt={photobook.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textSecondary }}>
                      <BookIcon />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {photobook.images.length} photos
                  </div>
                </div>

                {/* Photobook Info */}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
                    {photobook.name}
                  </h3>
                  {photobook.description && (
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, marginBottom: '0.75rem' }}>
                      {photobook.description}
                    </p>
                  )}

                  {photobook.images.length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EBF5FF',
                      borderRadius: '0.5rem',
                      border: `1px dashed ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '0.85rem', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', margin: 0 }}>
                        Select preferred images from sent albums to add to this Photobook.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPhotobookModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #062a63',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <EyeIcon />
                        Browse
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotificationModal({ show: true, title: 'Coming Soon', message: 'Share functionality coming soon!', type: 'info' });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <ShareIcon />
                        Share
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Download all images
                          for (let i = 0; i < photobook.images.length; i++) {
                            const img = photobook.images[i];
                            const filename = `${photobook.name.replace(/[^a-z0-9]/gi, '_')}_${i + 1}.jpg`;
                            await downloadImage(img.url, filename);
                            if (i < photobook.images.length - 1) {
                              await new Promise(resolve => setTimeout(resolve, 300));
                            }
                          }
                        }}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: `1px solid ${colors.borderPrimary}`,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedAlbum(album);
                    setShowViewModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Album Thumbnail */}
                  <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                    <Image
                      src={album.thumbnail}
                      alt={album.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {album.photoCount} photos
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      backgroundColor: '#083A85',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>
                      {album.category}
                    </div>
                  </div>

                  {/* Album Info */}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
                      {album.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                        <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>{album.photographer}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.75rem' }}>
                      Received: {album.receivedDate}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMultiSelectView(album);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #062a63',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <EyeIcon />
                        Browse
                      </button>
                      {!photobook && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareAlbum(album);
                            setShowShareModal(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #9CA3AF',
                            backgroundColor: colors.bgTertiary,
                            color: colors.textPrimary,
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <ShareIcon />
                          Share
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(album);
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #FCA5A5',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Delete Album"
                      >
                        <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                      </button>
                    </div>
>>>>>>> Stashed changes
                  </div>
                );
              })()}

              {/* Albums Grid/List */}
              {filteredAlbums.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  boxShadow: colors.shadowCard
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    <ImageIcon />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                    {albums.length === 0 ? 'No albums sent yet' : 'No albums match your search'}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0 }}>
                    {albums.length === 0 ? 'Albums sent by photographers will appear here.' : 'Try adjusting your filters.'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="mobile-albums-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {filteredAlbums.map((album) => (
                    <div
                      key={album.id}
                      style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {/* Blurred cover = glow effect */}
                      <img src={album.thumbnail || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                      {/* Inner card — clickable to browse */}
                      <div
                        onClick={() => { setSelectedAlbum(album); openMultiSelectView(album); }}
                        style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {/* Full-bleed cover image */}
                        <img src={album.thumbnail || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                        {/* TOP: category + photo count */}
                        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', right: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                          <div style={{ backgroundColor: '#083A85', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                            {album.category}
                          </div>
                          <div style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ImageIcon /> {album.photoCount}
                          </div>
                        </div>

                        {/* Expiry badge */}
                        {(() => {
                          const exp = getAlbumExpiry(album);
                          if (!exp) return null;
                          if (exp.isExpired) return (
                            <div style={{ position: 'absolute', top: '2.8rem', left: '0.6rem', backgroundColor: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(8px)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 700 }}>
                              Expired — Archived
                            </div>
                          );
                          if (exp.isWarning) return (
                            <div style={{ position: 'absolute', top: '2.8rem', left: '0.6rem', backgroundColor: 'rgba(234,179,8,0.85)', backdropFilter: 'blur(8px)', color: '#422006', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 700 }}>
                              Expires in {exp.daysRemaining} day{exp.daysRemaining !== 1 ? 's' : ''}
                            </div>
                          );
                          return (
                            <div style={{ position: 'absolute', top: '2.8rem', left: '0.6rem', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.8)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 600 }}>
                              {exp.daysRemaining} day{exp.daysRemaining !== 1 ? 's' : ''} remaining
                            </div>
                          );
                        })()}

                        {/* MIDDLE-BOTTOM: title + event info over image */}
                        <div style={{ position: 'absolute', bottom: '6.2rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '0.15rem' }}>
                            {album.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {album.eventTitle ? `${album.eventTitle}${album.eventDate ? ` — ${album.eventDate}` : ''}` : (album.receivedDate ? `Received: ${album.receivedDate}` : album.date)}
                          </div>
                        </div>

                        {/* Expired lock overlay */}
                        {getAlbumExpiry(album)?.isExpired && (
                          <div
                            onClick={(e) => { e.stopPropagation(); setPageView('archives'); }}
                            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5, borderRadius: '1.05rem', cursor: 'pointer' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>Storage Expired</span>
                            <span style={{ color: '#FCD34D', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.3rem', textDecoration: 'underline' }}>Go to Archives to Unlock</span>
                          </div>
                        )}

                        {/* FOOTER BAR: frosted glass */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                          {/* Photographer avatar + name + delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                            {album.photographerAvatar ? (
                              <img src={album.photographerAvatar} alt={album.photographer} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }} />
                            ) : null}
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', border: '2px solid rgba(255,255,255,0.3)', display: album.photographerAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                              {album.photographer.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{album.photographer}</span>
                            <button
                              onClick={() => openDeleteModal(album)}
                              title="Delete Album"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.38rem 0.5rem', backgroundColor: 'rgba(220,38,38,0.82)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.375rem', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, overflow: 'hidden' }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    borderBottom: `2px solid ${colors.borderPrimary}`,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: colors.textSecondary
                  }}>
                    <div></div>
                    <div>Album</div>
                    <div>Photographer</div>
                    <div>Photos</div>
                    <div>Category</div>
                    <div>Actions</div>
                  </div>

                  {/* Table Rows */}
                  {filteredAlbums.map((album) => (
                    <div
                      key={album.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        borderBottom: `2px solid ${colors.borderPrimary}`,
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => {
                        setSelectedAlbum(album);
                        setShowViewModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgTertiary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgCard;
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ position: 'relative', width: '80px', height: '50px', borderRadius: '0.375rem', overflow: 'hidden', backgroundColor: album.thumbnail ? 'transparent' : '#0D1B2A' }}>
                        <img src={album.thumbnail || '/coverr.jpg'} alt={album.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: album.thumbnail ? 'cover' : 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; (e.currentTarget as HTMLImageElement).style.objectFit = 'contain'; const p = e.currentTarget.parentElement; if (p) p.style.backgroundColor = '#0D1B2A'; }} />
                      </div>

                      {/* Album Title */}
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{album.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                          {album.eventTitle ? `${album.eventTitle}${album.eventDate ? ` — ${album.eventDate}` : ''}` : (album.receivedDate ? `Received: ${album.receivedDate}` : album.date)}
                        </div>
                        {(() => {
                          const exp = getAlbumExpiry(album);
                          if (!exp) return null;
                          const color = exp.isExpired ? '#DC2626' : exp.isWarning ? '#B45309' : '#6B7280';
                          const label = exp.isExpired ? 'Expired — Archived' : exp.isWarning ? `Expires in ${exp.daysRemaining} day${exp.daysRemaining !== 1 ? 's' : ''}` : `${exp.daysRemaining} days remaining`;
                          return <div style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: '0.15rem' }}>{label}</div>;
                        })()}
                      </div>

                      {/* Photographer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                          {album.photographerAvatar ? (
                            <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ margin: 'auto' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/></svg>
                          )}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: colors.textPrimary }}>{album.photographer}</span>
                      </div>

                      {/* Photos Count */}
                      <div style={{ fontSize: '0.9rem', color: colors.textPrimary }}>{album.photoCount} photos</div>

                      {/* Category */}
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {album.category}
                      </span>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openMultiSelectView(album);
                          }}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #062a63',
                            backgroundColor: '#083A85',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Browse
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(album);
                          }}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '2px solid #DC2626',
                            backgroundColor: '#DC2626',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : pageView === 'photobooks' ? (
            /* Photobooks View */
            <div>
              {filteredPhotobooks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  backgroundColor: colors.bgCard,
                  borderRadius: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  boxShadow: colors.shadowCard
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    <ImageIcon />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                    No Photobooks Yet
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.25rem 0' }}>
                    {albums.length > 0 ? 'Create a photobook and select your preferred images from sent albums to add them here.' : 'You need to receive an album from a photographer first before creating a photobook.'}
                  </p>
                  {albums.length > 0 && <button
                    onClick={openCreateWizard}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #062a63',
                      backgroundColor: '#083A85',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create Photobook
                  </button>}
                </div>
              ) : (
                <div className="mobile-photobooks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {filteredPhotobooks.map((photobook) => (
                    <div
                      key={photobook.id}
                      style={{ position: 'relative', height: '450px', borderRadius: '1.5rem', overflow: 'hidden', transition: 'transform 0.3s ease', willChange: 'transform' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {/* Blurred cover = glow effect */}
                      <img src={photobook.thumbnail || '/coverr.jpg'} alt="" style={{ position: 'absolute', inset: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', objectFit: 'cover', filter: 'blur(14px) brightness(0.7)', pointerEvents: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                      {/* Inner card — clickable */}
                      <div
                        onClick={() => { if (photobook.images.length > 0) openPhotobookBrowse(photobook); else openSetupWizard(photobook); }}
                        style={{ position: 'absolute', inset: '7px', borderRadius: '1.05rem', overflow: 'hidden', backgroundColor: '#000', cursor: 'pointer', transition: 'filter 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                      >
                        {/* Full-bleed cover image */}
                        <img src={photobook.thumbnail || '/coverr.jpg'} alt={photobook.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/coverr.jpg'; }} />
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />

                        {/* TOP: badges + photo count */}
                        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', right: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <div style={{ backgroundColor: '#083A85', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                              Photobook
                            </div>
                            {photobook.layout && (
                              <div style={{ backgroundColor: photobook.layout === 'book-flip' ? '#7C3AED' : photobook.layout === 'mosaic' ? '#D97706' : '#059669', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                {photobook.layout === 'book-flip' ? 'Book Flip' : photobook.layout === 'mosaic' ? 'Mosaic' : 'Gallery Wall'}
                              </div>
                            )}
                          </div>
                          <div style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'white', padding: '0.25rem 0.7rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ImageIcon /> {photobook.images.length}
                          </div>
                        </div>

                        {/* MIDDLE-BOTTOM: title content over image */}
                        <div style={{ position: 'absolute', bottom: '4.8rem', left: 0, right: 0, padding: '0 0.8rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>{photobook.createdAt}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                              {photobook.name}
                            </div>
                            {(() => {
                              const s = photobook.status || 'DRAFT';
                              const statusConfig: Record<string, { bg: string; label: string }> = {
                                DRAFT: { bg: '#6B7280', label: 'Draft' },
                                PENDING_PAYMENT: { bg: '#D97706', label: 'Payment Required' },
                                SENT_TO_PHOTOGRAPHER: { bg: '#2563EB', label: 'Sent' },
                                PHOTOGRAPHER_EDITING: { bg: '#7C3AED', label: 'Editing' },
                                RESUBMITTED: { bg: '#059669', label: 'Resubmitted' },
                                COMPLETED: { bg: '#16A34A', label: 'Completed' },
                              };
                              const cfg = statusConfig[s] || statusConfig.DRAFT;
                              return <span style={{ color: 'white', backgroundColor: cfg.bg, padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{cfg.label}</span>;
                            })()}
                          </div>
                          {photobook.description && (
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>{photobook.description}</div>
                          )}
                        </div>

                        {/* FOOTER BAR: frosted glass */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 1.05rem 1.05rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {photobook.images.length === 0 ? (
                              <button
                                onClick={() => openSetupWizard(photobook)}
                                style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                              >
                                <ImageIcon /> Select Album
                              </button>
                            ) : photobook.status === 'RESUBMITTED' ? (
                              <>
                                <button
                                  onClick={() => openPhotobookBrowse(photobook)}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <EyeIcon /> Review
                                </button>
                                <button
                                  onClick={() => handleAcceptPhotobook(photobook.id)}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  Accept
                                </button>
                              </>
                            ) : photobook.status === 'PENDING_PAYMENT' ? (
                              <>
                                <button
                                  onClick={() => openPhotobookBrowse(photobook)}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <EyeIcon /> View
                                </button>
                                <button
                                  onClick={() => openPhotobookBrowse(photobook)}
                                  style={{ flex: 1.2, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#D97706', color: 'white', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', textAlign: 'center' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                  Pay ${photobook.extraPhotosAmount}
                                </button>
                              </>
                            ) : photobook.isSent || ['SENT_TO_PHOTOGRAPHER', 'PHOTOGRAPHER_EDITING', 'COMPLETED'].includes(photobook.status || '') ? (
                              <>
                                <button
                                  onClick={() => openPhotobookBrowse(photobook)}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <EyeIcon /> View
                                </button>
                                <span style={{ flex: 0.8, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', backgroundColor: photobook.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : photobook.status === 'PHOTOGRAPHER_EDITING' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(37, 99, 235, 0.15)', color: photobook.status === 'COMPLETED' ? '#10B981' : photobook.status === 'PHOTOGRAPHER_EDITING' ? '#7C3AED' : '#2563EB', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                  {photobook.status === 'COMPLETED' ? (
                                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Done</>
                                  ) : photobook.status === 'PHOTOGRAPHER_EDITING' ? 'Editing' : 'Sent'}
                                </span>
                                <button
                                  onClick={() => openDeletePhotobookModal(photobook)}
                                  style={{ flex: 0.6, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#DC2626', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setPhotobookToSend(photobook); setShowSendPhotobookModal(true); }}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" /></svg>
                                  Send
                                </button>
                                <button
                                  onClick={() => openSetupWizard(photobook)}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#F20C8F', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDeletePhotobookModal(photobook)}
                                  style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#DC2626', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : pageView === 'archives' ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              border: `2px solid ${colors.borderPrimary}`
            }}>
              {/* Unlock All Button */}
              {archivedAlbums.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                  <button
                    onClick={() => {
                      setSelectedPlan(null);
                      setShowPricingPlans(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #062a63',
                      backgroundColor: '#083A85',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0a4a9e';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#083A85';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Unlock size={16} />
                    Unlock All Archived Albums
                  </button>
                </div>
              )}
              {archivedAlbums.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 1.5rem',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    backgroundColor: colors.bgTertiary, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="5" rx="1"></rect>
                      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
                      <line x1="10" y1="12" x2="14" y2="12"></line>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                    No Archived Albums
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, maxWidth: '400px', lineHeight: '1.5' }}>
                    Albums are automatically archived after {ARCHIVE_DAYS} days of free storage. Archived albums will appear here.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="mobile-albums-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.25rem'
                }}>
                  {archivedAlbums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        viewMode="grid"
                        colors={colors}
                        hideActionButton={true}
                        onCardClick={() => {}}
                        onBrowseClick={() => {}}
                      />
                    ))
                  }

                </div>
              ) : (
                /* List View */
                <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', border: `2px solid ${colors.borderPrimary}`, boxShadow: colors.shadowCard, overflow: 'hidden', textAlign: 'left' }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 150px 120px 100px',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    borderBottom: `2px solid ${colors.borderPrimary}`,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: colors.textSecondary
                  }}>
                    <div></div>
                    <div>Album</div>
                    <div>Photographer</div>
                    <div>Photos</div>
                    <div>Category</div>
                  </div>

                  {/* Table Rows */}
                  {archivedAlbums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        viewMode="list"
                        colors={colors}
                        hideActionButton={true}
                        onCardClick={() => {}}
                        onBrowseClick={() => {}}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : null
          }
        </div>
      </div>



      {/* STORAGE PRICING PLANS MODAL */}
      {showPricingPlans && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowPricingPlans(false)}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '720px',
            width: '94%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.375rem' }}>
                  Choose Your Storage Plan
                </h3>
                <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, lineHeight: '1.5' }}>
                  Keep your albums safe and accessible. Without an active plan, albums are archived after {ARCHIVE_DAYS} days of free storage.
                </p>
              </div>
              <button onClick={() => setShowPricingPlans(false)} style={{
                background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, cursor: 'pointer',
                padding: '0.5rem', borderRadius: '0.375rem', color: colors.textPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '1rem'
              }}>
                <CloseIcon />
              </button>
            </div>

            {/* Archived albums summary */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.625rem 0.75rem', marginBottom: '1.25rem',
              backgroundColor: colors.bgTertiary, borderRadius: '0.5rem',
              border: `1px solid ${colors.borderPrimary}`
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '0.375rem',
                backgroundColor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>
                  {archivedAlbums.length} Archived Album{archivedAlbums.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                  {archivedPhotos} photos total
                </div>
              </div>
              <span style={{
                backgroundColor: '#DC2626', color: 'white', padding: '0.2rem 0.5rem',
                borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0
              }}>Archived</span>
            </div>

            {/* Plan Cards */}
            <div style={{
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
              marginBottom: '1.25rem'
            }}>
              {STORAGE_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    flex: '1 1 180px',
                    minWidth: '180px',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '0.75rem',
                    border: (plan as any).popular
                      ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`
                      : `2px solid ${colors.borderPrimary}`,
                    padding: '1.25rem 1rem',
                    display: 'flex', flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Popular / Best Value badge */}
                  {(plan as any).popular && (
                    <div style={{
                      position: 'absolute', top: '-0.6rem', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#083A85', color: 'white',
                      padding: '0.15rem 0.6rem', borderRadius: '9999px',
                      fontSize: '0.7rem', fontWeight: '700', whiteSpace: 'nowrap'
                    }}>
                      Popular
                    </div>
                  )}
                  {(plan as any).bestValue && (
                    <div style={{
                      position: 'absolute', top: '-0.6rem', left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: '#059669', color: 'white',
                      padding: '0.15rem 0.6rem', borderRadius: '9999px',
                      fontSize: '0.7rem', fontWeight: '700', whiteSpace: 'nowrap'
                    }}>
                      Best Value
                    </div>
                  )}

                  {/* Plan Name */}
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: colors.textPrimary, marginBottom: '0.75rem', textAlign: 'center' }}>
                    {plan.name}
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '1.75rem', fontWeight: '800',
                      color: actualTheme === 'dark' ? '#60A5FA' : '#083A85'
                    }}>
                      {formatPrice(plan.price)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary, marginLeft: '0.125rem' }}>
                      {plan.billing}
                    </span>
                  </div>

                  {/* Features */}
                  <ul style={{
                    listStyle: 'none', padding: 0, margin: '0 0 1rem',
                    flex: 1
                  }}>
                    {plan.features.map((feature, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.375rem',
                        fontSize: '0.8rem', color: colors.textSecondary,
                        marginBottom: '0.4rem', lineHeight: '1.4'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

<<<<<<< Updated upstream
                  {/* Select Button */}
                  <button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      const paymentData: Payment = {
                        id: 0,
                        eventId: archivedAlbums[0]?.eventId || '',
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        eventName: `${plan.name} — Unlock All Archived Albums (${archivedAlbums.length})`,
                        eventType: 'Archive Unlock',
                        photographerName: 'Multiple Photographers',
                        photographerImage: archivedAlbums[0]?.photographerAvatar || undefined,
                        method: '-',
                        amount: formatPrice(plan.price),
                        amountNum: plan.price,
                        paidAmount: 0,
                        status: 'pending',
                        invoiceNumber: `INV-${new Date().getFullYear()}-ARCH-${String(archivedAlbums.length).padStart(3, '0')}`
                      };
                      setShowPricingPlans(false);
                      handlePayNow(paymentData);
                    }}
                    style={{
                      width: '100%', padding: '0.625rem 1rem',
                      border: (plan as any).popular ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`,
                      borderRadius: '0.5rem',
                      background: (plan as any).popular ? '#083A85' : colors.bgCard,
                      color: (plan as any).popular ? 'white' : colors.textPrimary,
                      fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Select Plan
                  </button>
=======
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMultiSelectView(album);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #062a63',
                        backgroundColor: '#083A85',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Browse
                    </button>
                    {!photobook && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareAlbum(album);
                          setShowShareModal(true);
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: colors.bgTertiary,
                          color: colors.textPrimary,
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Share
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(album);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '2px solid #FCA5A5',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete Album"
                    >
                      <i className="bi bi-trash" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                  </div>
>>>>>>> Stashed changes
                </div>
              ))}
            </div>

            {/* Info note */}
            <p style={{
              fontSize: '0.8rem', color: colors.textSecondary,
              margin: 0, textAlign: 'center', lineHeight: '1.5'
            }}>
              Your selected plan unlocks all archived albums and extends storage beyond the 1-year free period.
            </p>
          </div>
        </div>
      )}

      {/* PAY NOW MODAL - PLACED AT ROOT LEVEL */}
      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
        onPaymentSuccess={() => { fetchAlbums(); fetchCoordinatorArchives(); }}
      />

      {/* Album View Modal */}
      {showViewModal && selectedAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Album Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Album Preview */}
            <div style={{ position: 'relative', height: '250px', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
              {selectedAlbum.thumbnail ? (
                <Image src={selectedAlbum.thumbnail} alt={selectedAlbum.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgTertiary }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#9CA3AF" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke="#9CA3AF" strokeWidth="2"/><path d="M21 15l-5-5L5 21" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>

            {/* Album Info */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
              {selectedAlbum.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                {selectedAlbum.photographerAvatar ? (
                  <Image src={selectedAlbum.photographerAvatar} alt={selectedAlbum.photographer} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ margin: 'auto' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#9CA3AF" strokeWidth="2"/></svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{selectedAlbum.photographer}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Photographer</div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: colors.bgTertiary,
              borderRadius: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{selectedAlbum.photoCount}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Photos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16A34A' }}>{selectedAlbum.downloadedCount}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Downloaded</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#DC2626' }}>{selectedAlbum.favoriteCount}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Favorites</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem 1.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>
              {selectedAlbum.category && <span>Category: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.category}</strong></span>}
              {selectedAlbum.eventTitle && <span>Event: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.eventTitle}</strong></span>}
              {selectedAlbum.eventDate && <span>Event Date: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.eventDate}</strong></span>}
              {selectedAlbum.eventLocation && <span>Location: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.eventLocation}</strong></span>}
              {selectedAlbum.receivedDate && <span>Received: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.receivedDate}</strong></span>}
            </div>

            {/* Action Buttons */}
<<<<<<< Updated upstream
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openMultiSelectView(selectedAlbum);
                }}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ImageIcon />
                Browse Photos
              </button>
=======
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openMultiSelectView(selectedAlbum);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    border: '2px solid #062a63',
                    backgroundColor: '#083A85',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ImageIcon />
                  Browse Photos
                </button>
                {!photobook && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShareAlbum(selectedAlbum);
                      setShowShareModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #9CA3AF',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary,
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShareIcon />
                    Share Album
                  </button>
                )}
              </div>
              {photobook && (
                <p style={{ fontSize: '0.8rem', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', textAlign: 'center', margin: 0, fontWeight: '500' }}>
                  Browse photos to select and add to &quot;{photobook.name}&quot;
                </p>
              )}
>>>>>>> Stashed changes
            </div>
          </div>
        </div>
      )}

      {/* Share Modal with Social Media */}
      {showShareModal && shareAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Share Album</h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Album Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: colors.bgTertiary, borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                {shareAlbum.thumbnail ? (
                  <Image src={shareAlbum.thumbnail} alt={shareAlbum.title} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgTertiary }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#9CA3AF" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke="#9CA3AF" strokeWidth="2"/><path d="M21 15l-5-5L5 21" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '0.9rem' }}>{shareAlbum.title}</div>
                <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{shareAlbum.photoCount} photos • {shareAlbum.photographer}</div>
              </div>
            </div>

            {/* Social Media Share Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { name: 'WhatsApp', icon: <WhatsAppIcon />, color: '#25D366', getUrl: (link: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}` },
                { name: 'Facebook', icon: <FacebookIcon />, color: '#1877F2', getUrl: (link: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
                { name: 'Twitter', icon: <TwitterIcon />, color: '#1DA1F2', getUrl: (link: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}` },
                { name: 'Email', icon: <EmailIcon />, color: '#EA4335', getUrl: (link: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this album: ${link}`)}` },
                { name: 'Copy Link', icon: <LinkIcon />, color: colors.textSecondary, getUrl: () => '' },
                { name: 'QR Code', icon: <QRCodeIcon />, color: colors.textPrimary, getUrl: () => '' }
              ].map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    const shareLink = getShareLink(shareAlbum);
                    if (option.name === 'Copy Link') {
                      handleCopyLink(shareLink);
                    } else if (option.name === 'QR Code') {
                      setNotificationModal({ show: true, title: 'Coming Soon', message: 'QR Code feature coming soon!', type: 'info' });
                    } else {
                      const url = option.getUrl(shareLink, shareAlbum.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    border: option.name === 'Copy Link' && copiedLink ? '1px solid #10B981' : `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    background: option.name === 'Copy Link' && copiedLink ? (actualTheme === 'dark' ? '#14532D' : '#ECFDF5') : colors.bgCard,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: option.name === 'Copy Link' && copiedLink ? '#10B981' : colors.textPrimary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!(option.name === 'Copy Link' && copiedLink)) {
                      e.currentTarget.style.borderColor = option.color;
                      e.currentTarget.style.color = option.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(option.name === 'Copy Link' && copiedLink)) {
                      e.currentTarget.style.borderColor = colors.borderPrimary;
                      e.currentTarget.style.color = colors.textPrimary;
                    }
                  }}
                >
                  <span>{option.icon}</span>
                  <span>{option.name === 'Copy Link' && copiedLink ? 'Copied!' : option.name}</span>
                </button>
              ))}
            </div>

            {/* Album Link Input */}
            <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Album Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={getShareLink(shareAlbum)}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgTertiary
                  }}
                />
                <button
                  onClick={() => handleCopyLink(getShareLink(shareAlbum))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    border: copiedLink ? '2px solid #059669' : '2px solid #062a63',
                    borderRadius: '0.375rem',
                    background: copiedLink ? '#10B981' : '#083A85',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <CopyIcon />
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select View Modal */}
      {showMultiSelectView && multiSelectAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001
          }}
          onClick={closeMultiSelectView}
        >
          {/* Header */}
          <div
            className="mobile-multi-select-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 className="mobile-multi-select-title" style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>{multiSelectAlbum.title}</h2>
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>({multiSelectAlbum.images.length} photos)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Select Mode Toggle - hidden when photobook exists (always in select mode) */}
              {!photobook && (
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    if (isSelectMode) {
                      setSelectedImages([]);
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '2px solid',
                    borderColor: isSelectMode ? '#16A34A' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: isSelectMode ? '#16A34A' : 'transparent',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={false} />
                  {isSelectMode ? 'Exit Select Mode' : 'Select Mode'}
                </button>
              )}

              {/* Max images info when photobook exists */}
              {photobook && (
                <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.375rem' }}>
                  Max: {MAX_PHOTOBOOK_IMAGES} images
                </span>
              )}

              {/* Close Button */}
              <button
                onClick={closeMultiSelectView}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls (visible when in select mode) */}
          {isSelectMode && (
            <div
              className="mobile-select-controls"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                borderBottom: '1px solid rgba(22, 163, 74, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#16A34A'
                }}>
<<<<<<< Updated upstream
                  {selectedImages.length} of {Math.min(multiSelectAlbum.images.length, MAX_IMAGE_SELECTION)} selected (max {MAX_IMAGE_SELECTION})
=======
                  {selectedImages.length} of {photobook ? MAX_PHOTOBOOK_IMAGES : multiSelectAlbum.images.length} {photobook ? 'max' : ''} selected
>>>>>>> Stashed changes
                </span>
                <button
                  onClick={selectAllImages}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #16A34A',
                    backgroundColor: 'transparent',
                    color: '#16A34A',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {selectedImages.length === multiSelectAlbum.images.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Add to Photobook Action */}
              {selectedImages.length > 0 && (
<<<<<<< Updated upstream
                <div className="mobile-bulk-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {selectedImages.length >= MAX_IMAGE_SELECTION && (
                    <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: '500' }}>
                      Max {MAX_IMAGE_SELECTION} images reached
                    </span>
                  )}
                  <button
                    onClick={handleBulkDownload}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: '#16A34A',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <DownloadIcon />
                    Download ({selectedImages.length})
                  </button>
                  <button
                    onClick={handleAddToPhotobook}
                    disabled={photobooks.length === 0}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: photobooks.length > 0 ? '#083A85' : '#9CA3AF',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: photobooks.length > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <ImageIcon />
                    Add to Photobook ({selectedImages.length})
                  </button>
                  {photobooks.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>
                      Create a photobook first
                    </span>
=======
                <div className="mobile-bulk-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                  {photobook ? (
                    // When photobook exists: show "Add to Photobook" only
                    <button
                      onClick={() => {
                        if (!multiSelectAlbum) return;
                        // Add selected images to photobook
                        const newImages: PhotobookImage[] = selectedImages.map(url => ({
                          url,
                          sourceAlbumId: multiSelectAlbum.id,
                          sourceAlbumTitle: multiSelectAlbum.title,
                          addedAt: new Date().toISOString()
                        }));
                        setPhotobook({
                          ...photobook,
                          images: [...photobook.images, ...newImages]
                        });
                        // Remove album from view
                        setRemovedAlbumIds([...removedAlbumIds, multiSelectAlbum.id]);
                        // Close multi-select and show thumbnail selector
                        closeMultiSelectView();
                        setShowThumbnailSelector(true);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        backgroundColor: '#16A34A',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#15803D';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#16A34A';
                      }}
                    >
                      <BookIcon />
                      Add to Photobook ({selectedImages.length})
                    </button>
                  ) : (
                    // Original actions when no photobook: download, share, delete
                    <>
                      <button
                        onClick={handleBulkDownload}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#062D6B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#083A85';
                        }}
                      >
                        <DownloadIcon />
                        Download ({selectedImages.length})
                      </button>
                      <button
                        onClick={() => {
                          setShareAlbum(multiSelectAlbum);
                          setShowShareModal(true);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#16A34A',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#15803D';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#16A34A';
                        }}
                      >
                        <ShareIcon />
                        Share ({selectedImages.length})
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          backgroundColor: '#DC2626',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#B91C1C';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#DC2626';
                        }}
                      >
                        <TrashIcon />
                        Delete ({selectedImages.length})
                      </button>
                    </>
>>>>>>> Stashed changes
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image Grid */}
          <div
            className="mobile-multi-select-grid"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
<<<<<<< Updated upstream
              {multiSelectAlbum.images.map((image: string, index: number) => {
                const isDisabled = isSelectMode && selectedImages.length >= MAX_IMAGE_SELECTION && !selectedImages.includes(image);
                return (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      cursor: isSelectMode ? (isDisabled ? 'not-allowed' : 'pointer') : 'default',
                      border: selectedImages.includes(image)
                        ? '3px solid #16A34A'
                        : '3px solid transparent',
                      transition: 'all 0.2s',
                      transform: selectedImages.includes(image) ? 'scale(0.98)' : 'scale(1)',
                      opacity: isDisabled ? 0.4 : 1
                    }}
                    onClick={() => {
                      if (isSelectMode && !isDisabled) {
                        toggleImageSelection(image);
                      } else if (!isSelectMode) {
                        openImageViewer(multiSelectAlbum, index);
                      }
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${multiSelectAlbum.title} - Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
=======
              {multiSelectAlbum.images.map((image, index) => {
                const isMaxReached = photobook && selectedImages.length >= MAX_PHOTOBOOK_IMAGES;
                const isDisabled = isMaxReached && !selectedImages.includes(image);
                return (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: isDisabled ? 'not-allowed' : (isSelectMode ? 'pointer' : 'default'),
                    border: selectedImages.includes(image)
                      ? '3px solid #16A34A'
                      : '3px solid transparent',
                    transition: 'all 0.2s',
                    transform: selectedImages.includes(image) ? 'scale(0.98)' : 'scale(1)',
                    opacity: isDisabled ? 0.4 : 1,
                    pointerEvents: isDisabled ? 'none' : 'auto'
                  }}
                  onClick={() => {
                    if (isDisabled) return;
                    if (isSelectMode) {
                      toggleImageSelection(image);
                    } else {
                      openImageViewer(multiSelectAlbum, index);
                    }
                  }}
                >
                  <Image
                    src={image}
                    alt={`${multiSelectAlbum.title} - Image ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
>>>>>>> Stashed changes

                    {/* Selection Overlay */}
                    {isSelectMode && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: selectedImages.includes(image)
                          ? 'rgba(22, 163, 74, 0.3)'
                          : isDisabled ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isDisabled ? 'center' : 'flex-start',
                        justifyContent: isDisabled ? 'center' : 'flex-start',
                        padding: isDisabled ? '0' : '0.75rem',
                        transition: 'all 0.2s'
                      }}>
                        {isDisabled ? (
                          /* Lock Icon for locked images */
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Locked</span>
                          </div>
                        ) : (
                          /* Checkbox for selectable images */
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: selectedImages.includes(image)
                              ? 'none'
                              : '2px solid rgba(255, 255, 255, 0.8)',
                            backgroundColor: selectedImages.includes(image)
                              ? '#16A34A'
                              : 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            {selectedImages.includes(image) && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    )}

<<<<<<< Updated upstream
                    {/* Image Number Badge (when not in select mode) */}
                    {!isSelectMode && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {index + 1}
                      </div>
                    )}
                  </div>
=======
                  {/* Image Number Badge (when not in select mode) */}
                  {!isSelectMode && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {index + 1}
                    </div>
                  )}
                </div>
>>>>>>> Stashed changes
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && viewerAlbum && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}
          onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
          tabIndex={0}
        >
          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image
              src={viewerAlbum.images[currentImageIndex]}
              alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
              fill
              style={{ objectFit: 'contain', padding: '0 4rem' }}
              priority
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
            padding: '1rem 1.5rem 2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {viewerAlbum.thumbnail && (
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image src={viewerAlbum.thumbnail} alt={viewerAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white', margin: 0 }}>{viewerAlbum.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{viewerAlbum.photographer} &middot; {currentImageIndex + 1} / {viewerAlbum.images.length}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleAddCurrentImageToPhotobook}
                disabled={
                  photobooks.length === 0 ||
                  (viewerAlbum ? photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex]) : false) ||
                  selectedImages.length >= MAX_IMAGE_SELECTION
                }
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: (photobooks.length === 0 || (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) || selectedImages.length >= MAX_IMAGE_SELECTION) ? 'rgba(255,255,255,0.08)' : 'rgba(8,58,133,0.85)',
                  border: 'none', borderRadius: '0.5rem', color: 'white', cursor: (photobooks.length === 0 || (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) || selectedImages.length >= MAX_IMAGE_SELECTION) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: '600',
                  opacity: (photobooks.length === 0 || (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) || selectedImages.length >= MAX_IMAGE_SELECTION) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                title={photobooks.length === 0 ? 'Create a photobook first' : (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ? 'Already added' : selectedImages.length >= MAX_IMAGE_SELECTION ? `Maximum ${MAX_IMAGE_SELECTION} images reached` : 'Add to Photobook'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {(viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ? 'Added' : 'Photobook'}
              </button>
              <button
                onClick={handleDownloadCurrentImage}
                title="Download image"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.12)', border: 'none',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <DownloadIcon />
              </button>
              <button
                onClick={closeImageViewer}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.12)', border: 'none',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: currentImageIndex > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: currentImageIndex > 0 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (currentImageIndex > 0) e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex > 0 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (currentImageIndex < viewerAlbum.images.length - 1) e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = currentImageIndex < viewerAlbum.images.length - 1 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronRightIcon />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '2.5rem 1.5rem 1.25rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {viewerAlbum.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    position: 'relative', width: '56px', height: '42px', borderRadius: '0.375rem',
                    overflow: 'hidden', border: currentImageIndex === index ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                    opacity: currentImageIndex === index ? 1 : 0.5,
                    transform: currentImageIndex === index ? 'scale(1.1)' : 'scale(1)',
                    background: 'none', padding: 0
                  }}
                  onMouseEnter={(e) => { if (currentImageIndex !== index) e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { if (currentImageIndex !== index) e.currentTarget.style.opacity = '0.5'; }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal - Steps 1 & 2 (Album & Layout selection) */}
      {showSetupWizard && setupStep !== 3 && (
        <div
          className="wizard-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={resetSetupWizard}
        >
          <div
            className="wizard-modal-inner"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Wizard Header */}
            <div className="wizard-header" style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary }}>
                  {setupStep === 1 ? 'Select Album' : 'Select Layout'}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: colors.textSecondary }}>
                  {!setupPhotobookId ? 'Create Photobook — ' : 'Edit Photobook — '}Step {setupPhotobookId ? setupStep - 1 : setupStep} of {setupPhotobookId ? 2 : 3}
                </p>
              </div>
              <button
                onClick={resetSetupWizard}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  padding: '0.25rem'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Step Progress Bar */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '1rem 1.5rem 0.5rem',
            }}>
              {(setupPhotobookId ? [2, 3] : [1, 2, 3]).map(step => (
                <div key={step} style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: step <= setupStep ? '#083A85' : (actualTheme === 'dark' ? '#374151' : '#E5E7EB'),
                  transition: 'background-color 0.3s'
                }} />
              ))}
            </div>

            {/* Wizard Body */}
            <div className="wizard-body" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 1.5rem'
            }}>
              {/* Step 1: Select Album */}
              {setupStep === 1 && (() => {
                const albumsWithImages = albums.filter(a => a.images && a.images.length > 0);
                // Collect all media IDs already used in existing photobooks
                const usedMediaIds = new Set(photobooks.flatMap(pb => pb.mediaIds || []));
                const albumHasPhotobook = (album: any) => {
                  const ids = album.mediaIds || [];
                  return ids.length > 0 && ids.some((id: string) => usedMediaIds.has(id));
                };
                return (
                <div>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                    Choose an album to create your photobook from:
                  </p>
                  {albumsWithImages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: colors.textSecondary
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', opacity: 0.5 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>No albums with images available</p>
                      <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>Albums need to have photos before you can create a photobook.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {albumsWithImages.map(album => {
                        const hasPhotobook = albumHasPhotobook(album);
                        return (
                        <div
                          key={album.id}
                          className="wizard-album-item"
                          onClick={() => !hasPhotobook && setSetupSelectedAlbum(album)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${setupSelectedAlbum?.id === album.id ? '#083A85' : colors.borderPrimary}`,
                            backgroundColor: hasPhotobook
                              ? (actualTheme === 'dark' ? '#1a1a2e' : '#F3F4F6')
                              : setupSelectedAlbum?.id === album.id
                                ? (actualTheme === 'dark' ? '#0c2d5a' : '#EFF6FF')
                                : 'transparent',
                            cursor: hasPhotobook ? 'not-allowed' : 'pointer',
                            opacity: hasPhotobook ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          <div className="wizard-album-thumb" style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '0.375rem',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            <img
                              src={album.thumbnail}
                              alt={album.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {album.title}
                            </h4>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: colors.textSecondary }}>
                              {album.photographer} · {album.images.length} photos
                            </p>
                          </div>
                          {hasPhotobook ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#F20C8F', backgroundColor: 'rgba(242, 12, 143, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', whiteSpace: 'nowrap' }}>
                              Photobook Created
                            </span>
                          ) : setupSelectedAlbum?.id === album.id ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#083A85" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="9 12 11.5 14.5 16 9.5"></polyline>
                            </svg>
                          ) : null}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Step 2: Select Layout */}
              {setupStep === 2 && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                    Choose how your photobook will be displayed:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      {
                        value: 'book-flip' as const,
                        label: 'Book Flip',
                        description: 'Classic page-by-page book experience',
                        color: '#7C3AED',
                        icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></>
                      },
                      {
                        value: 'mosaic' as const,
                        label: 'Mosaic',
                        description: 'Dynamic grid layout with varied sizes',
                        color: '#D97706',
                        icon: <><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></>
                      },
                      {
                        value: 'gallery-wall' as const,
                        label: 'Gallery Wall',
                        description: 'Elegant wall-style photo display',
                        color: '#059669',
                        icon: <><rect x="2" y="7" width="20" height="14" rx="2"></rect><line x1="12" y1="3" x2="12" y2="7"></line></>
                      }
                    ].map(layout => (
                      <div
                        key={layout.value}
                        className="wizard-layout-item"
                        onClick={() => setSetupLayout(layout.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: `2px solid ${setupLayout === layout.value ? layout.color : colors.borderPrimary}`,
                          backgroundColor: setupLayout === layout.value
                            ? (actualTheme === 'dark' ? `${layout.color}15` : `${layout.color}10`)
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div className="wizard-layout-icon" style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '0.5rem',
                          backgroundColor: setupLayout === layout.value ? layout.color : (actualTheme === 'dark' ? '#374151' : '#E5E7EB'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'background-color 0.2s'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={setupLayout === layout.value ? 'white' : colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {layout.icon}
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: setupLayout === layout.value ? layout.color : colors.textPrimary
                          }}>
                            {layout.label}
                          </h4>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: colors.textSecondary }}>
                            {layout.description}
                          </p>
                        </div>
                        {setupLayout === layout.value && (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill={layout.color} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="9 12 11.5 14.5 16 9.5"></polyline>
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="wizard-footer" style={{
              padding: '1rem 1.5rem',
              borderTop: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <button
                onClick={(setupStep === 1 || (setupPhotobookId && setupStep === 2)) ? resetSetupWizard : () => setSetupStep(setupStep - 1)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {(setupStep === 1 || (setupPhotobookId && setupStep === 2)) ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={() => { setSetupCurrentImageIndex(0); setSetupStep(setupStep + 1); }}
                disabled={setupStep === 1 && !setupSelectedAlbum}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: (setupStep === 1 && !setupSelectedAlbum) ? '#9CA3AF' : '#083A85',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: (setupStep === 1 && !setupSelectedAlbum) ? 'not-allowed' : 'pointer',
                  opacity: (setupStep === 1 && !setupSelectedAlbum) ? 0.7 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Step 3 - Image Grid View */}
      {showSetupWizard && setupStep === 3 && step3ViewMode === 'album-grid' && setupSelectedAlbum && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2000
          }}
        >
          {/* Header */}
          <div className="step3-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="step3-header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  {setupSelectedAlbum.thumbnail && (
                    <Image src={setupSelectedAlbum.thumbnail} alt={setupSelectedAlbum.title} fill style={{ objectFit: 'cover' }} />
                  )}
                </div>
                <div className="step3-album-info">
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>
                    {setupSelectedAlbum.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                    Step {setupPhotobookId ? 2 : 3} of {setupPhotobookId ? 2 : 3} · {setupSelectedAlbum.images.length} photos
                  </p>
                </div>
              </div>
              {/* Select Mode Toggle */}
              <button
                onClick={() => setSetupSelectMode(!setupSelectMode)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: setupSelectMode ? '1px solid #083A85' : '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: setupSelectMode ? '#083A85' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                {setupSelectMode ? 'Done' : 'Select'}
              </button>
              {/* Select All / Deselect All (only in select mode) */}
              {setupSelectMode && (
                <button
                  onClick={() => {
                    if (setupSelectedImages.length === Math.min(MAX_IMAGE_SELECTION, setupSelectedAlbum.images.length)) {
                      setSetupSelectedImages([]);
                    } else {
                      setSetupSelectedImages(setupSelectedAlbum.images.slice(0, MAX_IMAGE_SELECTION));
                    }
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {setupSelectedImages.length === Math.min(MAX_IMAGE_SELECTION, setupSelectedAlbum.images.length) ? 'Deselect All' : `Select All (${MAX_IMAGE_SELECTION})`}
                </button>
              )}
              {/* Selection counter */}
              <span style={{
                backgroundColor: setupSelectedImages.length >= MAX_IMAGE_SELECTION ? 'rgba(5, 150, 105, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {setupSelectedImages.length}/{MAX_IMAGE_SELECTION} selected
                {extraUnlockedImages.filter(img => setupSelectedImages.includes(img)).length > 0 && (
                  <> + {extraUnlockedImages.filter(img => setupSelectedImages.includes(img)).length} extra</>
                )}
              </span>
              {extraImagesTotalCost > 0 && (
                <span style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.85)',
                  color: 'white',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  +${extraImagesTotalCost}
                </span>
              )}
            </div>
            <div className="step3-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Back button */}
              <button
                onClick={() => setSetupStep(2)}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Back
              </button>
              {/* Save button */}
              <button
                onClick={saveSetupWizard}
                disabled={setupSelectedImages.length === 0}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: setupSelectedImages.length === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(5, 150, 105, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: setupSelectedImages.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  opacity: setupSelectedImages.length === 0 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Save
              </button>
              {/* Close button */}
              <button
                onClick={resetSetupWizard}
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem'
          }}>
            <div
              className="step3-image-grid-container"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.5rem',
                maxWidth: '1000px',
                margin: '0 auto'
              }}>
              {setupSelectedAlbum.images.map((image: string, index: number) => {
                const isSelected = setupSelectedImages.includes(image);
                const isExtraUnlocked = extraUnlockedImages.includes(image);
                const isLocked = !isSelected && setupSelectedImages.length >= MAX_IMAGE_SELECTION && !isExtraUnlocked;
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (isLocked && !hasSeenLimitMessage) {
                        setShowLimitReachedMessage(true);
                        setHasSeenLimitMessage(true);
                      } else if (setupSelectMode) {
                        toggleSetupImageSelection(image);
                      } else {
                        setSetupCurrentImageIndex(index);
                        setStep3ViewMode('image-selection');
                      }
                    }}
                    style={{
                      position: 'relative',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: isSelected && isExtraUnlocked
                        ? '2px solid #7C3AED'
                        : isSelected
                        ? '2px solid #083A85'
                        : isExtraUnlocked
                        ? '2px solid rgba(124, 58, 237, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      opacity: isLocked ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Image Thumbnail */}
                    <div style={{
                      position: 'relative',
                      aspectRatio: '1/1',
                      overflow: 'hidden'
                    }}>
                      <Image
                        src={image}
                        alt={`Photo ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                      {/* Number Badge */}
                      <div
                        className="step3-grid-badge"
                        style={{
                          position: 'absolute',
                          top: '0.4rem',
                          right: '0.4rem',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isSelected && isExtraUnlocked ? '#7C3AED' : isSelected ? '#083A85' : 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          border: isSelected ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.3)'
                        }}>
                        {index + 1}
                      </div>
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div
                          className="step3-grid-checkmark"
                          style={{
                            position: 'absolute',
                            top: '0.4rem',
                            left: '0.4rem',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: isExtraUnlocked ? '#7C3AED' : '#16A34A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                      {/* Extra unlocked badge (not yet selected) */}
                      {isExtraUnlocked && !isSelected && (
                        <div style={{
                          position: 'absolute', top: '0.4rem', left: '0.4rem',
                          backgroundColor: 'rgba(124, 58, 237, 0.85)', padding: '0.15rem 0.4rem',
                          borderRadius: '0.25rem', fontSize: '0.6rem', fontWeight: '700', color: 'white'
                        }}>
                          UNLOCKED
                        </div>
                      )}
                      {/* Locked overlay */}
                      {isLocked && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Step 3 - Full-Screen Image Browser */}
      {showSetupWizard && setupStep === 3 && step3ViewMode === 'image-selection' && setupSelectedAlbum && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}>
          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image
              src={setupSelectedAlbum.images[setupCurrentImageIndex]}
              alt={`${setupSelectedAlbum.title} - Image ${setupCurrentImageIndex + 1}`}
              fill
              style={{ objectFit: 'contain', padding: '0 4rem' }}
              priority
            />
            {/* Selected badge on image */}
            {setupSelectedImages.includes(setupSelectedAlbum.images[setupCurrentImageIndex]) && (
              <div style={{
                position: 'absolute', top: '5rem', right: '5rem', zIndex: 5,
                backgroundColor: 'rgba(8,58,133,0.9)', color: 'white',
                padding: '0.5rem 0.75rem', borderRadius: '2rem',
                fontSize: '0.8rem', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '0.375rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Selected
              </div>
            )}
            {/* Locked badge + Unlock option on image */}
            {!setupSelectedImages.includes(setupSelectedAlbum.images[setupCurrentImageIndex]) && setupSelectedImages.length >= MAX_IMAGE_SELECTION && !extraUnlockedImages.includes(setupSelectedAlbum.images[setupCurrentImageIndex]) && (
              <div style={{
                position: 'absolute', top: '5rem', right: '5rem', zIndex: 5,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem'
              }}>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.75)', color: 'white',
                  padding: '0.5rem 0.75rem', borderRadius: '2rem',
                  fontSize: '0.8rem', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '0.375rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Locked
                </div>
                <button
                  onClick={() => handleUnlockExtraImage(setupSelectedAlbum.images[setupCurrentImageIndex])}
                  style={{
                    backgroundColor: 'rgba(8,58,133,0.9)', color: 'white',
                    padding: '0.5rem 1rem', borderRadius: '2rem', border: 'none',
                    fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(8,58,133,1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.9)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5"></path>
                  </svg>
                  Unlock for {formatPrice(EXTRA_IMAGE_PRICE)}
                </button>
              </div>
            )}
          </div>

          {/* Top Overlay */}
          <div
            className="step3-header"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              padding: '1rem 1.5rem 2.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
            <div className="step3-header-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {setupSelectedAlbum.thumbnail && (
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image src={setupSelectedAlbum.thumbnail} alt={setupSelectedAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white', margin: 0 }}>{setupSelectedAlbum.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  {setupSelectedAlbum.photographer} &middot; {setupCurrentImageIndex + 1} / {setupSelectedAlbum.images.length}
                </p>
              </div>
              <span style={{
                backgroundColor: setupSelectedImages.length >= MAX_IMAGE_SELECTION ? 'rgba(5,150,105,0.85)' : 'rgba(255,255,255,0.15)',
                color: 'white', padding: '0.35rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600'
              }}>
                {setupSelectedImages.length}/{MAX_IMAGE_SELECTION} selected
                {extraUnlockedImages.filter(img => setupSelectedImages.includes(img)).length > 0 && (
                  <> + {extraUnlockedImages.filter(img => setupSelectedImages.includes(img)).length} extra</>
                )}
              </span>
              {extraImagesTotalCost > 0 && (
                <span style={{
                  backgroundColor: 'rgba(124,58,237,0.85)',
                  color: 'white', padding: '0.35rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600'
                }}>
                  +${extraImagesTotalCost}
                </span>
              )}
            </div>

            <div className="step3-header-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Select / Deselect / Unlock button */}
              {(() => {
                const currentImg = setupSelectedAlbum.images[setupCurrentImageIndex];
                const isSel = setupSelectedImages.includes(currentImg);
                const isLck = !isSel && setupSelectedImages.length >= MAX_IMAGE_SELECTION && !extraUnlockedImages.includes(currentImg);
                const isUnlocked = !isSel && extraUnlockedImages.includes(currentImg);
                if (isLck) {
                  return (
                    <button
                      onClick={() => handleUnlockExtraImage(currentImg)}
                      style={{
                        padding: '0.45rem 0.7rem',
                        backgroundColor: 'rgba(8,58,133,0.85)',
                        border: 'none', borderRadius: '2rem', color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s'
                      }}
                      title={`Unlock this image for ${formatPrice(EXTRA_IMAGE_PRICE)}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5"></path>
                      </svg>
                      <span className="step3-btn-text">Unlock {formatPrice(EXTRA_IMAGE_PRICE)}</span>
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => toggleSetupImageSelection(currentImg)}
                    style={{
                      padding: '0.45rem 0.7rem',
                      backgroundColor: isSel ? 'rgba(220,38,38,0.85)' : 'rgba(8,58,133,0.85)',
                      border: 'none', borderRadius: '2rem', color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s'
                    }}
                    title={isSel ? 'Remove from selection' : isUnlocked ? 'Add unlocked image' : 'Add to selection'}
                  >
                    {isSel ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="step3-btn-text">Remove</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="step3-btn-text">Select</span>
                      </>
                    )}
                  </button>
                );
              })()}
              {/* Back button */}
              <button
                onClick={() => setStep3ViewMode('album-grid')}
                style={{
                  padding: '0.45rem 0.7rem', backgroundColor: 'rgba(255,255,255,0.12)',
                  border: 'none', borderRadius: '2rem', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span className="step3-btn-text">Back</span>
              </button>
              {/* Save button */}
              <button
                onClick={saveSetupWizard}
                disabled={setupSelectedImages.length === 0}
                style={{
                  padding: '0.45rem 0.7rem',
                  backgroundColor: setupSelectedImages.length === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(5,150,105,0.9)',
                  border: 'none', borderRadius: '2rem', color: 'white',
                  cursor: setupSelectedImages.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: '600',
                  opacity: setupSelectedImages.length === 0 ? 0.5 : 1, transition: 'all 0.2s'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="step3-btn-text">Save</span>
              </button>
              {/* Close button */}
              <button
                onClick={() => setStep3ViewMode('album-grid')}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.12)', border: 'none',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            className="step3-nav-button"
            onClick={() => setupCurrentImageIndex > 0 && setSetupCurrentImageIndex(setupCurrentImageIndex - 1)}
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: setupCurrentImageIndex > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: setupCurrentImageIndex > 0 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (setupCurrentImageIndex > 0) e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = setupCurrentImageIndex > 0 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronLeftIcon />
          </button>
          <button
            className="step3-nav-button step3-nav-button-right"
            onClick={() => setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 && setSetupCurrentImageIndex(setupCurrentImageIndex + 1)}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (setupCurrentImageIndex < setupSelectedAlbum.images.length - 1) e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronRightIcon />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div
            className="step3-thumbnail-strip"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
              padding: '2.5rem 1.5rem 1.25rem'
            }}>
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {setupSelectedAlbum.images.map((image: string, index: number) => {
                const isThumbSelected = setupSelectedImages.includes(image);
                const isThumbExtraUnlocked = extraUnlockedImages.includes(image);
                const isThumbLocked = !isThumbSelected && setupSelectedImages.length >= MAX_IMAGE_SELECTION && !isThumbExtraUnlocked;
                return (
                  <button
                    className="step3-thumbnail"
                    key={index}
                    onClick={() => setSetupCurrentImageIndex(index)}
                    style={{
                      position: 'relative', width: '50px', height: '38px', borderRadius: '0.3rem',
                      overflow: 'hidden',
                      border: isThumbSelected && isThumbExtraUnlocked ? '2px solid #7C3AED' : isThumbSelected ? '2px solid #4A90D9' : setupCurrentImageIndex === index ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                      opacity: isThumbLocked ? 0.3 : setupCurrentImageIndex === index ? 1 : 0.55,
                      transform: setupCurrentImageIndex === index ? 'scale(1.1)' : 'scale(1)',
                      background: 'none', padding: 0
                    }}
                  >
                    <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                    {/* Selected checkmark on thumbnail */}
                    {isThumbSelected && (
                      <div style={{
                        position: 'absolute', top: '1px', right: '1px',
                        width: '12px', height: '12px', borderRadius: '50%',
                        backgroundColor: isThumbExtraUnlocked ? '#7C3AED' : '#083A85', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                    {/* Lock overlay on thumbnail */}
                    {isThumbLocked && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Pop-up Message */}
      {showLimitReachedMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000
        }} onClick={() => setShowLimitReachedMessage(false)}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Info Icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: actualTheme === 'dark' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(8, 58, 133, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
              Selection Limit Reached
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 0.75rem', lineHeight: '1.5' }}>
              You&apos;ve selected the maximum of <strong style={{ color: colors.textPrimary }}>{MAX_IMAGE_SELECTION} images</strong> included in your photobook agreement.
            </p>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1.25rem', lineHeight: '1.5' }}>
              No worries! You can still unlock additional images for <strong style={{ color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{formatPrice(EXTRA_IMAGE_PRICE)} each</strong>. Simply tap the <strong style={{ color: colors.textPrimary }}>Unlock</strong> button on any locked image to add it to your selection.
            </p>

            <button
              onClick={() => setShowLimitReachedMessage(false)}
              style={{
                width: '100%', padding: '0.75rem 1rem',
                border: '2px solid #062a63', borderRadius: '0.5rem',
                background: '#083A85', color: 'white',
                fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Extra Image Payment Modal */}
      {showExtraImagePayment && (pendingUnlockImage || pendingUnlockImages.length > 0) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000
        }} onClick={() => { setShowExtraImagePayment(false); setPendingUnlockImage(null); setExtraPaymentMethod(null); setExtraPaymentShowReceipt(false); }}>
          <div style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '450px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                {extraPaymentShowReceipt ? 'Payment Summary' : `Unlock ${pendingExtrasCount > 1 ? `${pendingExtrasCount} Extra Images` : 'Extra Image'}`}
              </h3>
              <button onClick={() => { setShowExtraImagePayment(false); setPendingUnlockImage(null); setExtraPaymentMethod(null); setExtraPaymentShowReceipt(false); }} style={{
                background: colors.bgTertiary, border: `2px solid ${colors.borderPrimary}`, cursor: 'pointer',
                padding: '0.5rem', borderRadius: '0.375rem', color: colors.textPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CloseIcon />
              </button>
            </div>

            {extraPaymentShowReceipt ? (
              /* Receipt View (Phase 2) */
              <div>
                <div style={{
                  backgroundColor: colors.bgTertiary, borderRadius: '0.75rem',
                  padding: '1.25rem', marginBottom: '1.25rem',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  {/* Image Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '-0.5rem' }}>
                      {(pendingUnlockImages.length > 0 ? pendingUnlockImages : (pendingUnlockImage ? [pendingUnlockImage] : [])).slice(0, 3).map((img, i) => (
                        <div key={i} style={{ width: '40px', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', flexShrink: 0, marginLeft: i > 0 ? '-8px' : 0, border: `2px solid ${colors.bgCard}`, zIndex: 3 - i }}>
                          <Image src={img} alt={`Extra image ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                      {pendingExtrasCount > 3 && (
                        <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', marginLeft: '-8px', backgroundColor: colors.bgTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: colors.textSecondary, border: `2px solid ${colors.bgCard}` }}>
                          +{pendingExtrasCount - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>{pendingExtrasCount} Extra {pendingExtrasCount === 1 ? 'Image' : 'Images'}</div>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{formatPrice(EXTRA_IMAGE_PRICE)} per image</div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Payment Method</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
                        {extraPaymentMethod === 'card' ? (
                          <>
                            <Image src="/visa.png" alt="Visa" width={14} height={20} unoptimized style={{ objectFit: 'contain' }} />
                            <Image src="/master.png" alt="Mastercard" width={14} height={20} unoptimized style={{ objectFit: 'contain' }} />
                          </>
                        ) : (
                          <Image src={extraPaymentMethod === 'mtn' ? '/mtn.png' : '/airtel.png'} alt={extraPaymentMethod === 'mtn' ? 'MTN' : 'Airtel'} width={24} height={24} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>
                        {extraPaymentMethod === 'card' ? 'Credit/Debit Card' : extraPaymentMethod === 'mtn' ? 'MTN Mobile Money' : 'Airtel Mobile Money'}
                      </span>
                    </div>
                  </div>

                  {/* Already unlocked extras info */}
                  {extraUnlockedImages.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Previously Unlocked</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textPrimary }}>
                        {extraUnlockedImages.length} image{extraUnlockedImages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />

                  {/* Amount Due */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary }}>Image Unlock</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{formatPrice(EXTRA_IMAGE_PRICE)}</span>
                  </div>

                  {/* Donation (if any) */}
                  {extraDonationValue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <HeartIcon filled />
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#F20C8F' }}>Donation</span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#F20C8F' }}>{formatPrice(extraDonationValue)}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ borderTop: `2px solid ${colors.borderPrimary}`, margin: '0.75rem 0' }} />

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: colors.textPrimary }}>Total</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                      {formatPrice(extraTotalWithDonation)}
                    </span>
                  </div>
                </div>

                {/* Receipt Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setExtraPaymentShowReceipt(false)}
                    style={{
                      flex: 1, padding: '0.75rem 1rem',
                      border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
                      background: colors.bgTertiary, color: colors.textPrimary,
                      fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtraImagePaymentDone}
                    style={{
                      flex: 1, padding: '0.75rem 1rem',
                      border: '2px solid #062a63', borderRadius: '0.5rem',
                      background: '#083A85', color: 'white',
                      fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Pay {formatPrice(extraTotalWithDonation)}
                  </button>
                </div>
              </div>
            ) : (
              /* Selection View (Phase 1) */
              <div>
                {/* Image Preview */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '1.25rem', padding: '0.75rem',
                  backgroundColor: colors.bgTertiary, borderRadius: '0.75rem',
                  border: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                    {pendingUnlockImage && <Image src={pendingUnlockImage} alt="Extra image" fill style={{ objectFit: 'cover' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Unlock This Image</div>
                    <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: '0.125rem' }}>
                      Add as extra image for {formatPrice(EXTRA_IMAGE_PRICE)}
                    </div>
                    {extraUnlockedImages.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', marginTop: '0.25rem', fontWeight: '500' }}>
                        {extraUnlockedImages.length} extra already unlocked &middot; Running total: {formatPrice(extraImagesTotalCost + EXTRA_IMAGE_PRICE)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.75rem' }}>
                    Select Payment Method
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Credit/Debit Card */}
                    <div
                      onClick={() => setExtraPaymentMethod('card')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        border: extraPaymentMethod === 'card' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.75rem', cursor: 'pointer',
                        backgroundColor: extraPaymentMethod === 'card' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <Image src="/visa.png" alt="Visa" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                        <Image src="/master.png" alt="Mastercard" width={24} height={38} unoptimized style={{ objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Credit/Debit Card</div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay with Visa, Mastercard, etc.</div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: extraPaymentMethod === 'card' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgCard
                      }} />
                    </div>

                    {/* MTN Mobile Money */}
                    <div
                      onClick={() => setExtraPaymentMethod('mtn')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        border: extraPaymentMethod === 'mtn' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.75rem', cursor: 'pointer',
                        backgroundColor: extraPaymentMethod === 'mtn' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                        <Image src="/mtn.png" alt="MTN Mobile Money" width={48} height={48} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>MTN Mobile Money</div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via MTN MoMo</div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: extraPaymentMethod === 'mtn' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgCard
                      }} />
                    </div>

                    {/* Airtel Mobile Money */}
                    <div
                      onClick={() => setExtraPaymentMethod('airtel')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        border: extraPaymentMethod === 'airtel' ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        borderRadius: '0.75rem', cursor: 'pointer',
                        backgroundColor: extraPaymentMethod === 'airtel' ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                        <Image src="/airtel.png" alt="Airtel Mobile Money" width={48} height={48} unoptimized style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: colors.textPrimary }}>Airtel Mobile Money</div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Pay via Airtel Money</div>
                      </div>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        border: extraPaymentMethod === 'airtel' ? '6px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                        backgroundColor: colors.bgCard
                      }} />
                    </div>
                  </div>
                </div>

                {/* Donation Section */}
                <div style={{
                  marginBottom: '1.25rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${extraDonationSkipped ? colors.borderPrimary : (extraDonationValue > 0 ? '#F20C8F' : 'rgba(242, 12, 143, 0.3)')}`,
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(242, 12, 143, 0.08) 0%, rgba(255, 107, 157, 0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(242, 12, 143, 0.05) 0%, rgba(255, 107, 157, 0.02) 100%)',
                  transition: 'all 0.2s'
                }}>
                  {/* Header */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HeartIcon filled />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>Support a Cause</span>
                      <span style={{ fontSize: '0.81rem', color: colors.textSecondary, marginLeft: 'auto' }}>Optional</span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: colors.textSecondary, margin: '0.35rem 0 0 0', lineHeight: '1.4' }}>
                      Add a small donation to help fund community projects and initiatives
                    </p>
                  </div>

                  {!extraDonationSkipped && (
                    <>
                      {/* Quick Amount Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {['5', '10', '25', '50'].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => handleExtraSelectDonation(amount)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              border: extraDonationAmount === amount ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.5rem',
                              background: extraDonationAmount === amount
                                ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)')
                                : colors.bgCard,
                              color: extraDonationAmount === amount ? '#F20C8F' : colors.textSecondary,
                              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                              transition: 'all 0.2s', flex: '1', minWidth: '0'
                            }}
                          >
                            {formatPrice(parseFloat(amount))}
                          </button>
                        ))}
                        <button
                          onClick={() => handleExtraSelectDonation('custom')}
                          style={{
                            padding: '0.4rem 0.75rem',
                            border: extraDonationAmount === 'custom' ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                            borderRadius: '0.5rem',
                            background: extraDonationAmount === 'custom'
                              ? (actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.15)' : 'rgba(242, 12, 143, 0.08)')
                              : colors.bgCard,
                            color: extraDonationAmount === 'custom' ? '#F20C8F' : colors.textSecondary,
                            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.2s', flex: '1', minWidth: '0'
                          }}
                        >
                          Custom
                        </button>
                      </div>

                      {/* Custom Amount Input */}
                      {extraShowCustomInput && (
                        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                          <span style={{
                            position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                            fontSize: '0.9rem', fontWeight: '600', color: colors.textSecondary
                          }}>$</span>
                          <input
                            type="number"
                            placeholder="Enter amount"
                            value={extraCustomDonation}
                            onChange={(e) => setExtraCustomDonation(e.target.value)}
                            style={{
                              width: '100%', padding: '0.6rem 0.75rem 0.6rem 1.75rem',
                              border: `2px solid ${extraCustomDonation ? '#F20C8F' : colors.borderPrimary}`,
                              borderRadius: '0.5rem', fontSize: '0.85rem',
                              color: colors.textPrimary, backgroundColor: colors.bgCard,
                              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#F20C8F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(242, 12, 143, 0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = extraCustomDonation ? '#F20C8F' : colors.borderPrimary; e.currentTarget.style.boxShadow = 'none'; }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* No Thanks Button */}
                  <button
                    onClick={handleExtraSkipDonation}
                    style={{
                      width: '100%', padding: '0.5rem 1rem', borderRadius: '9999px',
                      border: extraDonationSkipped ? '2px solid #F20C8F' : '2px solid #6B7280',
                      background: extraDonationSkipped ? '#F20C8F' : colors.bgTertiary,
                      color: extraDonationSkipped ? 'white' : '#374151',
                      fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s', textAlign: 'center'
                    }}
                  >
                    {extraDonationSkipped ? '\u2713 Donation skipped' : 'No thanks, skip donation'}
                  </button>
                </div>

                {/* Validation Message */}
                {!extraDonationAddressed && (
                  <p style={{ fontSize: '0.86rem', color: '#EF4444', margin: '0 0 0.75rem 0', textAlign: 'center' }}>
                    Please select a donation amount or skip to continue
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    onClick={() => { setShowExtraImagePayment(false); setPendingUnlockImage(null); setExtraPaymentMethod(null); setExtraPaymentShowReceipt(false); }}
                    style={{
                      flex: 1, padding: '0.75rem 1rem',
                      border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.5rem',
                      background: colors.bgTertiary, color: colors.textPrimary,
                      fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!extraPaymentMethod || !extraDonationAddressed}
                    onClick={handleExtraImagePaymentConfirm}
                    style={{
                      flex: 1, padding: '0.75rem 1rem',
                      border: (!extraPaymentMethod || !extraDonationAddressed) ? '2px solid #9CA3AF' : '2px solid #062a63',
                      borderRadius: '0.5rem',
                      background: (!extraPaymentMethod || !extraDonationAddressed) ? '#9CA3AF' : '#083A85',
                      color: 'white', fontSize: '0.9rem', fontWeight: '600',
                      cursor: (!extraPaymentMethod || !extraDonationAddressed) ? 'not-allowed' : 'pointer',
                      opacity: (!extraPaymentMethod || !extraDonationAddressed) ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cover Picker Modal */}
      {showCoverPicker && setupSelectedImages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem'
          }}
          onClick={() => setShowCoverPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '480px',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary }}>
                  Choose Cover Photo
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: colors.textSecondary }}>
                  Tap an image to set it as your photobook cover
                </p>
              </div>
              <button
                onClick={() => setShowCoverPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  padding: '0.25rem'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Image Grid */}
            <div style={{ padding: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {setupSelectedImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setSetupCoverImage(image)}
                  style={{
                    position: 'relative',
                    width: '120px',
                    height: '120px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: setupCoverImage === image ? '3px solid #083A85' : `3px solid ${colors.borderPrimary}`,
                    transition: 'all 0.2s',
                    boxShadow: setupCoverImage === image ? '0 4px 12px rgba(8, 58, 133, 0.3)' : 'none',
                    transform: setupCoverImage === image ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <img
                    src={image}
                    alt={`Photo ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Selected cover indicator */}
                  {setupCoverImage === image && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(8, 58, 133, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#083A85',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span style={{
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                      }}>Cover</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowCoverPicker(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={confirmSaveWithCover}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photobook Confirmation Modal */}
      {showDeletePhotobookModal && photobookToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={cancelDeletePhotobook}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.textPrimary, margin: 0, marginBottom: '0.75rem', textAlign: 'center' }}>
              Delete Photobook
            </h2>
            <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: 0, marginBottom: '0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{photobookToDelete.name}&quot;</strong>?
            </p>
            <p style={{ fontSize: '0.85rem', color: '#DC2626', margin: 0, marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
              {photobookToDelete.images.length > 0
                ? `This action cannot be undone. All ${photobookToDelete.images.length} photos in this photobook will be removed.`
                : 'This action cannot be undone. This empty photobook will be permanently deleted.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={cancelDeletePhotobook}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePhotobook}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Photobook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Photobook Confirmation Modal */}
      {showSendPhotobookModal && photobookToSend && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}
          onClick={() => { setShowSendPhotobookModal(false); setPhotobookToSend(null); }}
        >
          <div
            style={{ backgroundColor: colors.bgCard, borderRadius: '1rem', padding: '1.5rem', width: '400px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const pbIds = new Set(photobookToSend.mediaIds || []);
              const sourceAlbum = albums.find(a => (a.mediaIds || []).some((id: string) => pbIds.has(id)));
              const photographerName = sourceAlbum?.photographer || 'Photographer';
              const photographerAvatar = sourceAlbum?.photographerAvatar;
              return (
                <>
                  {/* Photographer Profile */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
                    {photographerAvatar ? (
                      <img
                        src={photographerAvatar}
                        alt={photographerName}
                        style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.borderPrimary}`, marginBottom: '0.75rem' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement)?.style.setProperty('display', 'flex'); }}
                      />
                    ) : null}
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #083A85, #3B82F6)', border: `3px solid ${colors.borderPrimary}`, display: photographerAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      {photographerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>{photographerName}</h3>
                    <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Photographer</span>
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.75rem', textAlign: 'center' }}>
                    Send Photobook
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: colors.textSecondary, margin: '0 0 0.5rem', textAlign: 'center', lineHeight: '1.5' }}>
                    Send <strong style={{ color: colors.textPrimary }}>&quot;{photobookToSend.name}&quot;</strong> to {photographerName}?
                  </p>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1.5rem', textAlign: 'center' }}>
                    {photobookToSend.images.length} selected photo{photobookToSend.images.length !== 1 ? 's' : ''} will be shared. {photographerName} will be notified.
                  </p>
                </>
              );
            })()}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setShowSendPhotobookModal(false); setPhotobookToSend(null); }}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}`, backgroundColor: colors.bgCard, color: colors.textPrimary, fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendPhotobook}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                </svg>
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photobook Sent Success Modal */}
      {showPhotobookSuccessModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowPhotobookSuccessModal(false)}
        >
          <div
            style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1.75rem', maxWidth: '380px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: actualTheme === 'dark' ? '#052E16' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: colors.textPrimary, margin: '0 0 0.5rem' }}>{photobookSuccessMessage.title}</h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.25rem', lineHeight: '1.5' }}>{photobookSuccessMessage.description}</p>
            <button
              onClick={() => setShowPhotobookSuccessModal(false)}
              style={{ padding: '0.625rem 2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#083A85', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Selector Modal */}
      {showThumbnailSelector && selectedPhotobook && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => setShowThumbnailSelector(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Select Photobook Thumbnail</h2>
              <button
                onClick={() => setShowThumbnailSelector(false)}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
              Choose an image from this photobook to use as the cover thumbnail.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {selectedPhotobook.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSetPhotobookThumbnail(image)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: selectedPhotobook.thumbnail === image
                      ? '3px solid #083A85'
                      : `2px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Image src={image} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {selectedPhotobook.thumbnail === image && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(8, 58, 133, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photobook Browse Modal */}
      {showPhotobookBrowse && selectedPhotobook && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001
          }}
          onClick={closePhotobookBrowse}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>{selectedPhotobook.name}</h2>
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>({selectedPhotobook.images.length} photos)</span>
              <span style={{
                padding: '0.25rem 0.625rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: selectedPhotobook.layout === 'book-flip' ? 'rgba(124, 58, 237, 0.2)' : selectedPhotobook.layout === 'mosaic' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(5, 150, 105, 0.2)',
                color: selectedPhotobook.layout === 'book-flip' ? '#A78BFA' : selectedPhotobook.layout === 'mosaic' ? '#FCD34D' : '#6EE7B7',
                border: `1px solid ${selectedPhotobook.layout === 'book-flip' ? 'rgba(124, 58, 237, 0.4)' : selectedPhotobook.layout === 'mosaic' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(5, 150, 105, 0.4)'}`
              }}>
                {selectedPhotobook.layout === 'book-flip' ? 'Book Flip' : selectedPhotobook.layout === 'mosaic' ? 'Mosaic' : 'Gallery Wall'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Select Mode Toggle */}
              {selectedPhotobook.images.length > 0 && (
                <button
                  onClick={() => {
                    setIsPhotobookSelectMode(!isPhotobookSelectMode);
                    if (isPhotobookSelectMode) {
                      setPhotobookSelectedImages([]);
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '2px solid',
                    borderColor: isPhotobookSelectMode ? '#16A34A' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: isPhotobookSelectMode ? '#16A34A' : 'transparent',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <GridIcon active={false} />
                  {isPhotobookSelectMode ? 'Exit Select Mode' : 'Select Mode'}
                </button>
              )}

              {/* Set Thumbnail Button */}
              {selectedPhotobook.images.length > 0 && (
                <button
                  onClick={() => setShowThumbnailSelector(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ImageIcon />
                  Set Cover
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={closePhotobookBrowse}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls */}
          {isPhotobookSelectMode && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                borderBottom: '1px solid rgba(22, 163, 74, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#16A34A' }}>
                  {photobookSelectedImages.length} of {selectedPhotobook.images.length} selected
                </span>
                <button
                  onClick={() => {
                    if (photobookSelectedImages.length === selectedPhotobook.images.length) {
                      setPhotobookSelectedImages([]);
                    } else {
                      setPhotobookSelectedImages([...selectedPhotobook.images]);
                    }
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #16A34A',
                    backgroundColor: 'transparent',
                    color: '#16A34A',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {photobookSelectedImages.length === selectedPhotobook.images.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Bulk Actions - Share, Download, Delete */}
              {photobookSelectedImages.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handlePhotobookBulkDownload}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: '#083A85',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <DownloadIcon />
                    Download ({photobookSelectedImages.length})
                  </button>
                  <button
                    onClick={handlePhotobookBulkShare}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: '#16A34A',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShareIcon />
                    Share ({photobookSelectedImages.length})
                  </button>
                  <button
                    onClick={handlePhotobookBulkDelete}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: '#DC2626',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                    Delete ({photobookSelectedImages.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Required Banner */}
          {selectedPhotobook.status === 'PENDING_PAYMENT' && (selectedPhotobook.extraPhotosCount || 0) > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <div>
                  <span style={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.875rem' }}>
                    {selectedPhotobook.extraPhotosCount} extra photo{(selectedPhotobook.extraPhotosCount || 0) > 1 ? 's' : ''} locked
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    at ${selectedPhotobook.pricePerExtraPhoto || 0}/photo = ${selectedPhotobook.extraPhotosAmount || 0}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPhotobookPaymentModal(true);
                  setPhotobookPaymentStep('select');
                  setPhotobookPaymentError('');
                }}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#D97706',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Pay Now
              </button>
            </div>
          )}

          {/* Image Grid or Empty State */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedPhotobook.images.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  <ImageIcon />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: '0 0 0.5rem 0' }}>
                  No Images Yet
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 1rem 0', maxWidth: '400px', lineHeight: '1.5' }}>
                  Select your preferred images from the sent albums and add them to this photobook. Go to &quot;View Sent Albums&quot; and browse an album to select images.
                </p>
                <button
                  onClick={() => {
                    closePhotobookBrowse();
                    setPageView('albums');
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  View Sent Albums
                </button>
              </div>
            ) : selectedPhotobook.layout === 'book-flip' ? (
              /* Book Flip Layout */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '1.5rem'
              }}>
                {/* Book Container */}
                <div className="mobile-book-container" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0',
                  maxWidth: '900px',
                  width: '100%',
                  minHeight: '500px',
                  perspective: '1500px'
                }}>
                  {/* Left Page */}
                  <div style={{
                    flex: 1,
                    height: '500px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '0.5rem 0 0 0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRight: 'none',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '-5px 5px 20px rgba(0, 0, 0, 0.5)',
                    cursor: isPhotobookSelectMode ? 'pointer' : 'default'
                  }}
                    onClick={() => {
                      const leftIdx = bookCurrentPage * 2;
                      if (leftIdx < selectedPhotobook.images.length && !isPhotobookImageLocked(selectedPhotobook, leftIdx)) {
                        if (isPhotobookSelectMode) {
                          const img = selectedPhotobook.images[leftIdx];
                          if (photobookSelectedImages.includes(img)) {
                            setPhotobookSelectedImages(photobookSelectedImages.filter(i => i !== img));
                          } else {
                            setPhotobookSelectedImages([...photobookSelectedImages, img]);
                          }
                        } else {
                          openPhotobookImageViewer(selectedPhotobook, leftIdx);
                        }
                      }
                    }}
                  >
                    {bookCurrentPage * 2 < selectedPhotobook.images.length ? (
                      <>
                        <Image
                          src={selectedPhotobook.images[bookCurrentPage * 2]}
                          alt={`Page ${bookCurrentPage * 2 + 1}`}
                          fill
                          style={{ objectFit: 'cover', filter: isPhotobookImageLocked(selectedPhotobook, bookCurrentPage * 2) ? 'blur(20px) brightness(0.4)' : 'none' }}
                        />
                        {isPhotobookImageLocked(selectedPhotobook, bookCurrentPage * 2) && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span style={{ color: '#FCD34D', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.35rem' }}>Pay to unlock</span>
                          </div>
                        )}
                        {isPhotobookSelectMode && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2])
                              ? 'rgba(22, 163, 74, 0.3)'
                              : 'rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            padding: '1rem'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2]) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                              backgroundColor: photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2]) ? '#16A34A' : 'rgba(0, 0, 0, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              {photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2]) && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: '1rem',
                          left: '1rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem'
                        }}>
                          {bookCurrentPage * 2 + 1}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255, 255, 255, 0.3)' }}>
                        <span style={{ fontSize: '0.9rem' }}>End of book</span>
                      </div>
                    )}
                  </div>

                  {/* Book Spine */}
                  <div style={{
                    width: '4px',
                    height: '500px',
                    background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
                  }} />

                  {/* Right Page */}
                  <div style={{
                    flex: 1,
                    height: '500px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '0 0.5rem 0.5rem 0',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: 'none',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '5px 5px 20px rgba(0, 0, 0, 0.5)',
                    cursor: isPhotobookSelectMode ? 'pointer' : 'default'
                  }}
                    onClick={() => {
                      const rightIdx = bookCurrentPage * 2 + 1;
                      if (rightIdx < selectedPhotobook.images.length && !isPhotobookImageLocked(selectedPhotobook, rightIdx)) {
                        if (isPhotobookSelectMode) {
                          const img = selectedPhotobook.images[rightIdx];
                          if (photobookSelectedImages.includes(img)) {
                            setPhotobookSelectedImages(photobookSelectedImages.filter(i => i !== img));
                          } else {
                            setPhotobookSelectedImages([...photobookSelectedImages, img]);
                          }
                        } else {
                          openPhotobookImageViewer(selectedPhotobook, rightIdx);
                        }
                      }
                    }}
                  >
                    {bookCurrentPage * 2 + 1 < selectedPhotobook.images.length ? (
                      <>
                        <Image
                          src={selectedPhotobook.images[bookCurrentPage * 2 + 1]}
                          alt={`Page ${bookCurrentPage * 2 + 2}`}
                          fill
                          style={{ objectFit: 'cover', filter: isPhotobookImageLocked(selectedPhotobook, bookCurrentPage * 2 + 1) ? 'blur(20px) brightness(0.4)' : 'none' }}
                        />
                        {isPhotobookImageLocked(selectedPhotobook, bookCurrentPage * 2 + 1) && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span style={{ color: '#FCD34D', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.35rem' }}>Pay to unlock</span>
                          </div>
                        )}
                        {isPhotobookSelectMode && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2 + 1])
                              ? 'rgba(22, 163, 74, 0.3)'
                              : 'rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            padding: '1rem'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2 + 1]) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                              backgroundColor: photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2 + 1]) ? '#16A34A' : 'rgba(0, 0, 0, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              {photobookSelectedImages.includes(selectedPhotobook.images[bookCurrentPage * 2 + 1]) && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: '1rem',
                          right: '1rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem'
                        }}>
                          {bookCurrentPage * 2 + 2}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255, 255, 255, 0.3)' }}>
                        <span style={{ fontSize: '0.9rem' }}>End of book</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Navigation */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <button
                    onClick={() => setBookCurrentPage(Math.max(0, bookCurrentPage - 1))}
                    disabled={bookCurrentPage === 0}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      backgroundColor: bookCurrentPage === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                      color: bookCurrentPage === 0 ? 'rgba(255, 255, 255, 0.3)' : 'white',
                      cursor: bookCurrentPage === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <span style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    minWidth: '120px',
                    textAlign: 'center'
                  }}>
                    Page {bookCurrentPage + 1} of {Math.ceil(selectedPhotobook.images.length / 2)}
                  </span>

                  <button
                    onClick={() => setBookCurrentPage(Math.min(Math.ceil(selectedPhotobook.images.length / 2) - 1, bookCurrentPage + 1))}
                    disabled={bookCurrentPage >= Math.ceil(selectedPhotobook.images.length / 2) - 1}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      backgroundColor: bookCurrentPage >= Math.ceil(selectedPhotobook.images.length / 2) - 1 ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                      color: bookCurrentPage >= Math.ceil(selectedPhotobook.images.length / 2) - 1 ? 'rgba(255, 255, 255, 0.3)' : 'white',
                      cursor: bookCurrentPage >= Math.ceil(selectedPhotobook.images.length / 2) - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            ) : selectedPhotobook.layout === 'mosaic' ? (
              /* Mosaic Layout */
              <div className="mobile-mosaic-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridAutoRows: '180px',
                gap: '0.5rem'
              }}>
                {selectedPhotobook.images.map((image: string, index: number) => {
                  const isHero = index % 5 === 0;
                  const locked = isPhotobookImageLocked(selectedPhotobook, index);
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        gridColumn: isHero ? 'span 2' : 'span 1',
                        gridRow: isHero ? 'span 2' : 'span 1',
                        cursor: locked ? 'default' : (isPhotobookSelectMode ? 'pointer' : 'pointer'),
                        border: photobookSelectedImages.includes(image)
                          ? '3px solid #16A34A'
                          : '3px solid transparent',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}
                      onClick={() => {
                        if (locked) return;
                        if (isPhotobookSelectMode) {
                          if (photobookSelectedImages.includes(image)) {
                            setPhotobookSelectedImages(photobookSelectedImages.filter(img => img !== image));
                          } else {
                            setPhotobookSelectedImages([...photobookSelectedImages, image]);
                          }
                        } else {
                          openPhotobookImageViewer(selectedPhotobook, index);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!isPhotobookSelectMode && !locked) {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                      }}
                    >
                      <Image
                        src={image}
                        alt={`${selectedPhotobook.name} - Image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover', filter: locked ? 'blur(20px) brightness(0.4)' : 'none' }}
                      />

                      {/* Locked overlay */}
                      {locked && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          pointerEvents: 'none',
                        }}>
                          <svg width={isHero ? '32' : '24'} height={isHero ? '32' : '24'} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          <span style={{ color: '#FCD34D', fontSize: isHero ? '0.75rem' : '0.6rem', fontWeight: 700, marginTop: '0.25rem' }}>Locked</span>
                        </div>
                      )}

                      {/* Hover Gradient */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                        opacity: 0.7,
                        pointerEvents: 'none'
                      }} />

                      {/* Image Number */}
                      <div style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        left: '0.75rem',
                        color: 'white',
                        fontSize: isHero ? '1rem' : '0.75rem',
                        fontWeight: '600',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}>
                        {index + 1}
                      </div>

                      {/* Selection Overlay */}
                      {isPhotobookSelectMode && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: photobookSelectedImages.includes(image)
                            ? 'rgba(22, 163, 74, 0.3)'
                            : 'rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-end',
                          padding: '0.75rem'
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: photobookSelectedImages.includes(image) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                            backgroundColor: photobookSelectedImages.includes(image) ? '#16A34A' : 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            {photobookSelectedImages.includes(image) && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Gallery Wall Layout */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3rem',
                padding: '2rem 1rem',
                backgroundColor: '#0a0a0a',
                borderRadius: '1rem',
                minHeight: '100%'
              }}>
                {selectedPhotobook.images.map((image: string, index: number) => {
                  const locked = isPhotobookImageLocked(selectedPhotobook, index);
                  return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      maxWidth: index % 3 === 0 ? '700px' : index % 3 === 1 ? '500px' : '600px',
                      width: '100%',
                      cursor: locked ? 'default' : (isPhotobookSelectMode ? 'pointer' : 'pointer')
                    }}
                    onClick={() => {
                      if (locked) return;
                      if (isPhotobookSelectMode) {
                        if (photobookSelectedImages.includes(image)) {
                          setPhotobookSelectedImages(photobookSelectedImages.filter(img => img !== image));
                        } else {
                          setPhotobookSelectedImages([...photobookSelectedImages, image]);
                        }
                      } else {
                        openPhotobookImageViewer(selectedPhotobook, index);
                      }
                    }}
                  >
                    {/* Frame */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: index % 3 === 0 ? '16/10' : index % 3 === 1 ? '4/3' : '3/2',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                      border: photobookSelectedImages.includes(image)
                        ? '4px solid #16A34A'
                        : '4px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.5)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}
                      onMouseEnter={(e) => {
                        if (!locked) {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.9), 0 5px 15px rgba(0, 0, 0, 0.6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.5)';
                      }}
                    >
                      <Image
                        src={image}
                        alt={`${selectedPhotobook.name} - Image ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover', filter: locked ? 'blur(20px) brightness(0.4)' : 'none' }}
                      />

                      {/* Locked overlay */}
                      {locked && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          pointerEvents: 'none',
                        }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          <span style={{ color: '#FCD34D', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.35rem' }}>Pay to unlock</span>
                        </div>
                      )}

                      {/* Selection Overlay */}
                      {isPhotobookSelectMode && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: photobookSelectedImages.includes(image)
                            ? 'rgba(22, 163, 74, 0.25)'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-end',
                          padding: '1rem'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: photobookSelectedImages.includes(image) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                            backgroundColor: photobookSelectedImages.includes(image) ? '#16A34A' : 'rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            {photobookSelectedImages.includes(image) && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Museum Label */}
                    <div style={{
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      letterSpacing: '0.05em'
                    }}>
                      {selectedPhotobook.name} — {index + 1} of {selectedPhotobook.images.length}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photobook Extras Payment Modal */}
      {showPhotobookPaymentModal && selectedPhotobook && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={resetPhotobookPayment}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#1a1a2e', borderRadius: '1rem', padding: '2rem', maxWidth: '420px', width: '90%', color: 'white' }}
          >
            {photobookPaymentStep === 'select' && (
              <>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Pay for Extra Photos</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                  {selectedPhotobook.extraPhotosCount} extra photo{(selectedPhotobook.extraPhotosCount || 0) > 1 ? 's' : ''} at ${selectedPhotobook.pricePerExtraPhoto}/photo = <strong style={{ color: '#FCD34D' }}>${selectedPhotobook.extraPhotosAmount}</strong>
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.4rem' }}>Payment Method</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['mtn', 'airtel'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPhotobookPaymentMethod(method as 'mtn' | 'airtel')}
                        style={{
                          flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '2px solid',
                          borderColor: photobookPaymentMethod === method ? '#D97706' : 'rgba(255,255,255,0.2)',
                          backgroundColor: photobookPaymentMethod === method ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                          color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
                        }}
                      >
                        {method === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.4rem' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={photobookPaymentPhone}
                    onChange={(e) => setPhotobookPaymentPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {photobookPaymentError && (
                  <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>{photobookPaymentError}</p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={resetPhotobookPayment}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePhotobookExtrasPayment}
                    disabled={!photobookPaymentMethod || !photobookPaymentPhone.trim()}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none',
                      backgroundColor: (!photobookPaymentMethod || !photobookPaymentPhone.trim()) ? 'rgba(217, 119, 6, 0.4)' : '#D97706',
                      color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: (!photobookPaymentMethod || !photobookPaymentPhone.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Pay ${selectedPhotobook.extraPhotosAmount || 0}
                  </button>
                </div>
              </>
            )}

            {photobookPaymentStep === 'processing' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', border: '4px solid rgba(217, 119, 6, 0.2)', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Check your phone</h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                  A USSD prompt has been sent to your phone. Please approve the payment of ${selectedPhotobook.extraPhotosAmount} on your device.
                </p>
              </div>
            )}

            {photobookPaymentStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', backgroundColor: 'rgba(5, 150, 105, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Payment Successful!</h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                  All photos are now unlocked. You can review and accept your photobook.
                </p>
                <button
                  onClick={resetPhotobookPayment}
                  style={{ padding: '0.6rem 2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            )}

            {photobookPaymentStep === 'failed' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Payment Failed</h4>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                  {photobookPaymentError || 'Something went wrong. Please try again.'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button
                    onClick={resetPhotobookPayment}
                    style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setPhotobookPaymentStep('select'); setPhotobookPaymentError(''); }}
                    style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#D97706', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photobook Image Viewer */}
      {showPhotobookImageViewer && selectedPhotobook && selectedPhotobook.images.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 2000 }}>
          {/* Full-screen Image */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image
              src={selectedPhotobook.images[photobookCurrentImageIndex]}
              alt={`${selectedPhotobook.name} - Image ${photobookCurrentImageIndex + 1}`}
              fill
              style={{ objectFit: 'contain', padding: '0 4rem' }}
              priority
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
            padding: '1rem 1.5rem 2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {selectedPhotobook.thumbnail && (
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image src={selectedPhotobook.thumbnail} alt={selectedPhotobook.name} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white', margin: 0 }}>{selectedPhotobook.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Photobook &middot; {photobookCurrentImageIndex + 1} / {selectedPhotobook.images.length}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  if (selectedPhotobook) {
                    const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
                    const filename = `${bookName}_${photobookCurrentImageIndex + 1}.jpg`;
                    downloadImage(selectedPhotobook.images[photobookCurrentImageIndex], filename);
                  }
                }}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.12)', border: 'none',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Download image"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={closePhotobookImageViewer}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.12)', border: 'none',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => photobookCurrentImageIndex > 0 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex - 1)}
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: photobookCurrentImageIndex > 0 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: photobookCurrentImageIndex > 0 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (photobookCurrentImageIndex > 0) e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = photobookCurrentImageIndex > 0 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => photobookCurrentImageIndex < selectedPhotobook.images.length - 1 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex + 1)}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
              cursor: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 0.7 : 0
            }}
            onMouseEnter={(e) => { if (photobookCurrentImageIndex < selectedPhotobook.images.length - 1) e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(8,58,133,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? '0.7' : '0'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'; }}
          >
            <ChevronRightIcon />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '2.5rem 1.5rem 1.25rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', justifyContent: 'center', paddingBottom: '0.25rem' }}>
              {selectedPhotobook.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setPhotobookCurrentImageIndex(index)}
                  style={{
                    position: 'relative', width: '56px', height: '42px', borderRadius: '0.375rem',
                    overflow: 'hidden', border: photobookCurrentImageIndex === index ? '2px solid white' : '2px solid transparent',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                    opacity: photobookCurrentImageIndex === index ? 1 : 0.5,
                    transform: photobookCurrentImageIndex === index ? 'scale(1.1)' : 'scale(1)',
                    background: 'none', padding: 0
                  }}
                  onMouseEnter={(e) => { if (photobookCurrentImageIndex !== index) e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { if (photobookCurrentImageIndex !== index) e.currentTarget.style.opacity = '0.5'; }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && albumToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={cancelDeleteAlbum}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2rem', color: '#DC2626' }}></i>
              </div>
            </div>

            {/* Modal Header */}
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: colors.textPrimary,
              margin: 0,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>Delete Album</h2>

            {/* Modal Content */}
            <p style={{
              fontSize: '0.95rem',
              color: colors.textSecondary,
              margin: 0,
              marginBottom: '0.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>&quot;{albumToDelete.title}&quot;</strong>?
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: '#DC2626',
              margin: 0,
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              This action cannot be undone. All {albumToDelete.photoCount} photos will be permanently removed.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={cancelDeleteAlbum}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAlbum}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <i className="bi bi-trash" style={{ fontSize: '1rem' }}></i>
                Delete Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Photobook Modal */}
      {showCreatePhotobookModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={() => setShowCreatePhotobookModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
              maxWidth: '95%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Create Photobook</h2>
              <button
                onClick={() => setShowCreatePhotobookModal(false)}
                style={{
                  background: colors.bgTertiary,
                  border: `2px solid ${colors.borderPrimary}`,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Photobook Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Photobook Name *
              </label>
              <input
                type="text"
                value={photobookName}
                onChange={(e) => setPhotobookName(e.target.value)}
                placeholder="Enter photobook name"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  outline: 'none'
                }}
              />
            </div>

            {/* Photobook Description */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea
                value={photobookDescription}
                onChange={(e) => setPhotobookDescription(e.target.value)}
                placeholder="Enter a description for your photobook"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgCard,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* Thumbnail Selection from Albums */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: colors.textPrimary, marginBottom: '0.5rem' }}>
                Select Thumbnail (Optional)
              </label>
              <p style={{ fontSize: '0.8rem', color: colors.textSecondary, marginBottom: '0.75rem' }}>
                Choose a cover image from your sent albums
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setPhotobookThumbnailUrl(album.thumbnail)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: photobookThumbnailUrl === album.thumbnail ? '3px solid #083A85' : '2px solid transparent'
                    }}
                  >
                    <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                    {photobookThumbnailUrl === album.thumbnail && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px', color: 'white', backgroundColor: '#083A85', borderRadius: '50%', padding: '2px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCreatePhotobookModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!photobookName.trim()) {
                    setNotificationModal({ show: true, title: 'Required Field', message: 'Please enter a photobook name.', type: 'warning' });
                    return;
                  }
                  const newPhotobook: Photobook = {
                    id: Date.now().toString(),
                    name: photobookName,
                    description: photobookDescription,
                    thumbnail: photobookThumbnailUrl,
                    createdAt: new Date().toISOString(),
                    images: [],
                    maxImages: 100 // Placeholder
                  };
                  setPhotobook(newPhotobook);
                  setShowCreatePhotobookModal(false);
                  setPhotobookName('');
                  setPhotobookDescription('');
                  setPhotobookThumbnailUrl(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Photobook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Photobook Modal - Image Selection */}
      {showAddToPhotobookModal && addToPhotobookAlbum && photobook && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                Select Images for &quot;{photobook.name}&quot;
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.25rem 0 0' }}>
                From: {addToPhotobookAlbum.title} ({addToPhotobookAlbum.images.length} photos)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#16A34A', fontWeight: '600' }}>
                {selectedImagesForPhotobook.length} selected
              </span>
              <button
                onClick={() => {
                  setShowAddToPhotobookModal(false);
                  setAddToPhotobookAlbum(null);
                  setSelectedImagesForPhotobook([]);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Selection Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            borderBottom: '1px solid rgba(22, 163, 74, 0.3)'
          }}>
            <button
              onClick={() => {
                if (selectedImagesForPhotobook.length === addToPhotobookAlbum.images.length) {
                  setSelectedImagesForPhotobook([]);
                } else {
                  setSelectedImagesForPhotobook([...addToPhotobookAlbum.images]);
                }
              }}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #16A34A',
                backgroundColor: 'transparent',
                color: '#16A34A',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {selectedImagesForPhotobook.length === addToPhotobookAlbum.images.length ? 'Deselect All' : 'Select All'}
            </button>

            {selectedImagesForPhotobook.length > 0 && (
              <button
                onClick={() => {
                  // Add selected images to photobook
                  const newImages: PhotobookImage[] = selectedImagesForPhotobook.map(url => ({
                    url,
                    sourceAlbumId: addToPhotobookAlbum.id,
                    sourceAlbumTitle: addToPhotobookAlbum.title,
                    addedAt: new Date().toISOString()
                  }));

                  setPhotobook({
                    ...photobook,
                    images: [...photobook.images, ...newImages]
                  });

                  // Remove album from view
                  setRemovedAlbumIds([...removedAlbumIds, addToPhotobookAlbum.id]);

                  // Show thumbnail selector
                  setShowAddToPhotobookModal(false);
                  setShowThumbnailSelector(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <BookIcon />
                Add {selectedImagesForPhotobook.length} to Photobook
              </button>
            )}
          </div>

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {addToPhotobookAlbum.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (selectedImagesForPhotobook.includes(image)) {
                      setSelectedImagesForPhotobook(selectedImagesForPhotobook.filter(img => img !== image));
                    } else {
                      setSelectedImagesForPhotobook([...selectedImagesForPhotobook, image]);
                    }
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImagesForPhotobook.includes(image) ? '3px solid #16A34A' : '3px solid transparent',
                    transform: selectedImagesForPhotobook.includes(image) ? 'scale(0.98)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Image src={image} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: selectedImagesForPhotobook.includes(image) ? 'rgba(22, 163, 74, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    padding: '0.75rem'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: selectedImagesForPhotobook.includes(image) ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                      backgroundColor: selectedImagesForPhotobook.includes(image) ? '#16A34A' : 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {selectedImagesForPhotobook.includes(image) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Selector Modal - After adding images */}
      {showThumbnailSelector && photobook && photobook.images.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '600px',
              maxWidth: '95%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
              Select Photobook Thumbnail
            </h2>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, marginBottom: '1rem' }}>
              Choose a cover image for your photobook from the images you just added
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {photobook.images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setPhotobook({ ...photobook, thumbnail: image.url })}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: photobook.thumbnail === image.url ? '3px solid #083A85' : '2px solid transparent'
                  }}
                >
                  <Image src={image.url} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {photobook.thumbnail === image.url && (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', color: 'white', backgroundColor: '#083A85', borderRadius: '50%', padding: '2px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowThumbnailSelector(false);
                setAddToPhotobookAlbum(null);
                setSelectedImagesForPhotobook([]);
              }}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                border: '2px solid #062a63',
                backgroundColor: '#083A85',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Photobook Modal - Full View with Actions */}
      {showPhotobookModal && photobook && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1400
          }}
        >
          {/* Header with Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', margin: 0 }}>
                {photobook.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.25rem 0 0' }}>
                {photobook.images.length} photos
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Share Button */}
              <button
                onClick={() => {
                  setShowPhotobookModal(false);
                  setNotificationModal({ show: true, title: 'Coming Soon', message: 'Share functionality coming soon!', type: 'info' });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShareIcon />
                Share
              </button>

              {/* Download Button */}
              <button
                onClick={async () => {
                  // Download all images in photobook
                  for (let i = 0; i < photobook.images.length; i++) {
                    const img = photobook.images[i];
                    const filename = `${photobook.name.replace(/[^a-z0-9]/gi, '_')}_${i + 1}.jpg`;
                    await downloadImage(img.url, filename);
                    if (i < photobook.images.length - 1) {
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#083A85',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <DownloadIcon />
                Download All
              </button>

              {/* Delete Button */}
              <button
                onClick={() => {
                  setConfirmationModal({
                    show: true,
                    title: 'Delete Photobook',
                    message: 'Are you sure you want to delete this photobook? This action cannot be undone and all curated images will be lost.',
                    onConfirm: () => {
                      setPhotobook(null);
                      setRemovedAlbumIds([]);
                      setViewingPhotobooks(false);
                      setShowPhotobookModal(false);
                      setConfirmationModal({ show: false, title: '', message: '', onConfirm: () => {} });
                    }
                  });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: 'transparent',
                  color: '#DC2626',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <TrashIcon />
                Delete
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowPhotobookModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Image Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {photobook.images.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <BookIcon />
                  <p style={{ marginTop: '1rem' }}>No images yet. Switch to &quot;View Sent Albums&quot; to add images.</p>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {photobook.images.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Open image viewer
                      setViewerAlbum({
                        id: 0,
                        title: photobook.name,
                        photographer: '',
                        photographerAvatar: '',
                        category: '',
                        date: '',
                        receivedDate: '',
                        thumbnail: photobook.thumbnail || '',
                        photoCount: photobook.images.length,
                        downloadedCount: 0,
                        favoriteCount: 0,
                        images: photobook.images.map(img => img.url)
                      });
                      setCurrentImageIndex(index);
                      setShowImageViewer(true);
                      setShowPhotobookModal(false);
                    }}
                  >
                    <Image src={image.url} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem'
                    }}>
                      From: {image.sourceAlbumTitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setNotificationModal({ ...notificationModal, show: false })}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: notificationModal.type === 'success' ? '#DCFCE7' :
                                 notificationModal.type === 'error' ? '#FEE2E2' :
                                 notificationModal.type === 'warning' ? '#FEF3C7' : '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notificationModal.type === 'success' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {notificationModal.type === 'error' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                )}
                {notificationModal.type === 'warning' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                )}
                {notificationModal.type === 'info' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem', textAlign: 'center' }}>
              {notificationModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, marginBottom: '1.25rem', textAlign: 'center', lineHeight: '1.5' }}>
              {notificationModal.message}
            </p>
            <button
              onClick={() => setNotificationModal({ ...notificationModal, show: false })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #062a63',
                backgroundColor: '#083A85',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setConfirmationModal({ ...confirmationModal, show: false })}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '420px',
              maxWidth: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem', textAlign: 'center' }}>
              {confirmationModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              {confirmationModal.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmationModal({ ...confirmationModal, show: false })}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgCard,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #DC2626',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;