'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import AlbumCard from '@/app/components/Cards';
import UnlockModal from '@/app/components/UnlockModal';
import PayNowModal from '@/app/components/UnlockModal';
import { Archive, ArchiveIcon, ArchiveRestore, Eye, GiftIcon, Pointer } from 'lucide-react';
import { useUserProfile } from '@/app/context/UserProfileContext';
import PostModal from '@/app/components/WelcomeunlockModal';
import DonateModal, { DonatePromptModal } from '@/app/components/DonateModal';

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';

interface Payment {
  id: number;
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

// Sample album data from photographers
const clientAlbumsData = [
  {
    id: 1,
    title: 'Johnson Wedding - Ceremony',
    photographer: 'Sarah Anderson',
    payment: {
      amountDue: 150.00,
      status: 'pending',
      eventName: 'Johnson Wedding',
      photographerName: 'Sarah Anderson'
    },
    photographerAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    category: 'Wedding',
    date: 'Dec 15, 2024',
    isArchived: false,
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
    payment: {
      amountDue: 150.00,
      status: 'pending',
      eventName: 'Johnson Wedding - Reception',
      photographerName: 'Sarah Anderson'
    },
    date: 'Dec 15, 2024',
    receivedDate: 'Dec 18, 2024',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400',
    photoCount: 78,
    downloadedCount: 35,
    isArchived: false,
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
    payment: {
      amountDue: 150,
      status: 'pending',
      eventName: 'Family Portrait Session',
      photographerName: 'Mike Chen'
    },
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Portrait',
    date: 'Nov 28, 2024',
    isArchived: true,
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
    payment: {
      amountDue: 150.00,
      status: 'pending',
      eventName: 'Company Annual Gala',
      photographerName: 'David Kim'
    },
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Event',
    date: 'Nov 15, 2024',
    isArchived: true,
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
    payment: {
      amountDue: 150.00,
      status: 'pending',
      eventName: 'Product Catalog - Spring Collection',
      photographerName: 'Emily Zhang'
    },
    photographerAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    category: 'Product',
    date: 'Oct 10, 2024',
    isArchived: true,
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
    payment: {
      amountDue: 150.00,
      status: 'pending',
      eventName: 'Birthday Celebration',
      photographerName: 'Alex Rivera'
    },
    photographerAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    category: 'Event',
    date: 'Sep 22, 2024',
    isArchived: false,
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

const payments: Payment[] = [
  { id: 1, date: 'Nov, 20 14:05 PM', eventName: 'Sarah & James Wedding', eventType: 'Wedding', photographerName: 'John Studio', photographerImage: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg', method: 'Credit Card', amount: '$450.0', amountNum: 450, paidAmount: 450, status: 'paid', invoiceNumber: 'INV-2024-001' },
  { id: 2, date: 'Nov, 18 10:30 AM', eventName: 'Emily\'s 5th Birthday', eventType: 'Birthday', photographerName: 'Mary Shots', photographerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', method: 'Mobile Money', amount: '$300.0', amountNum: 300, paidAmount: 150, status: 'partially_paid', invoiceNumber: 'INV-2024-002' },
  { id: 3, date: 'Nov, 25 09:00 AM', eventName: 'MTN Annual Conference', eventType: 'Corporate', photographerName: 'Elite Photography', photographerImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', method: '-', amount: '$500.0', amountNum: 500, paidAmount: 0, status: 'pending', invoiceNumber: 'INV-2024-003' },
  { id: 4, date: 'Sep, 15 16:00 PM', eventName: 'Nyege Nyege Festival', eventType: 'Festival', photographerName: 'Alex Frames', photographerImage: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg', method: 'Bank Transfer', amount: '$350.0', amountNum: 350, paidAmount: 350, status: 'paid', invoiceNumber: 'INV-2024-004' },
  { id: 5, date: 'Nov, 25 14:00 PM', eventName: 'Personal Photoshoot', eventType: 'Portrait', photographerName: 'Sarah Lens', photographerImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg', method: 'Credit Card', amount: '$200.0', amountNum: 200, paidAmount: 0, status: 'failed', invoiceNumber: 'INV-2024-005' },
  { id: 6, date: 'Oct, 01 11:00 AM', eventName: 'Product Launch Event', eventType: 'Corporate', photographerName: 'Elite Photography', photographerImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', method: 'Credit Card', amount: '$400.0', amountNum: 400, paidAmount: 400, status: 'refunded', invoiceNumber: 'INV-2024-006' },
  { id: 7, date: 'Nov, 12 15:30 PM', eventName: 'Baby Shower', eventType: 'Birthday', photographerName: 'Mary Shots', photographerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg', method: 'Mobile Money', amount: '$250.0', amountNum: 250, paidAmount: 250, status: 'paid', invoiceNumber: 'INV-2024-007' },
  { id: 8, date: 'Nov, 28 10:00 AM', eventName: 'Team Headshots', eventType: 'Corporate', photographerName: 'Elite Photography', photographerImage: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg', method: '-', amount: '$350.0', amountNum: 350, paidAmount: 0, status: 'pending', invoiceNumber: 'INV-2024-008' },
];

interface GalleryPageProps {
  userRole?: 'client' | 'event-coordinator';
}

const ClientGallery = ({ userRole = 'client' }: GalleryPageProps) => {
  const { colors, actualTheme } = useTheme();
  const [albums, setAlbums] = useState(clientAlbumsData);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPhotographer, setFilterPhotographer] = useState('All');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(clientAlbumsData[0]);

  // Multi-select view states
  const [showMultiSelectView, setShowMultiSelectView] = useState(false);
  const [multiSelectAlbum, setMultiSelectAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Image viewer states
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAlbum, setShareAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<typeof clientAlbumsData[0] | null>(null);

  // Photobook states
  const [pageView, setPageView] = useState<'albums' | 'photobooks' | 'archives'>('albums');
  const [photobooks, setPhotobooks] = useState<Array<{
    id: number;
    name: string;
    description: string;
    thumbnail: string;
    images: string[];
    layout: 'book-flip' | 'mosaic' | 'gallery-wall' | '';
    createdAt: string;
  }>>([]);
  const [showCreatePhotobookModal, setShowCreatePhotobookModal] = useState(false);

  const [photobookName, setPhotobookName] = useState('');
  const [photobookDescription, setPhotobookDescription] = useState('');
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [welcomeUnlockModalOpen, setWelcomeUnlockModalOpen] = useState(false);
  const [showDonateModal, setDonateModal] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedArchiveAlbum, setSelectedArchiveAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const MAX_IMAGE_SELECTION = 3;

  // Setup wizard states (Select Album → Layout → Images)
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupSelectedAlbum, setSetupSelectedAlbum] = useState<typeof clientAlbumsData[0] | null>(null);
  const [setupLayout, setSetupLayout] = useState<'book-flip' | 'mosaic' | 'gallery-wall'>('book-flip');
  const [setupSelectedImages, setSetupSelectedImages] = useState<string[]>([]);
  const [setupPhotobookId, setSetupPhotobookId] = useState<number | null>(null);
  const [setupCurrentImageIndex, setSetupCurrentImageIndex] = useState(0);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [setupCoverImage, setSetupCoverImage] = useState<string>('');
  const [step3ViewMode, setStep3ViewMode] = useState<'album-grid' | 'image-selection'>('album-grid');
  const { profile } = useUserProfile();

  const [showGiftsPaymentMethodModal, setShowGiftsPaymentMethodModal] = useState(false);
  const [showGiftsDonateModal, setShowGiftsDonateModal] = useState(false);
  const [showGiftsDonatePromptModal, setShowGiftsDonatePromptModal] = useState(false);
  const [selectedGiftPaymentMethod, setSelectedGiftPaymentMethod] = useState<string | null>(null);
  const [giftPaymentDetails, setGiftPaymentDetails] = useState({
    mtnNumber: '',
    airtelNumber: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
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

  const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Product'];
  const photographers = ['All', ...Array.from(new Set(albums.map(a => a.photographer)))];
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [payNowPayment, setPayNowPayment] = useState<Payment | null>(null);

  // Filter albums
  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         album.photographer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || album.category === filterCategory;
    const matchesPhotographer = filterPhotographer === 'All' || album.photographer === filterPhotographer;
    return matchesSearch && matchesCategory && matchesPhotographer;
  });

  // Stats
  const totalPhotos = albums.reduce((sum, a) => sum + a.photoCount, 0);
  const totalDownloaded = albums.reduce((sum, a) => sum + a.downloadedCount, 0);
  const totalFavorites = albums.reduce((sum, a) => sum + a.favoriteCount, 0);

  // Functions
  const openMultiSelectView = (album: typeof clientAlbumsData[0]) => {
    setMultiSelectAlbum(album);
    setSelectedImages([]);
    setIsSelectMode(false);
    setShowMultiSelectView(true);
  };

  const closeMultiSelectView = () => {
    setShowMultiSelectView(false);
    setMultiSelectAlbum(null);
    setSelectedImages([]);
    setIsSelectMode(false);
  };

  const openImageViewer = (album: typeof clientAlbumsData[0], startIndex: number = 0) => {
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
      if (selectedImages.length < MAX_IMAGE_SELECTION) {
        setSelectedImages([...selectedImages, image]);
      }
    }
  };

  const selectAllImages = () => {
    if (multiSelectAlbum) {
      if (selectedImages.length === Math.min(multiSelectAlbum.images.length, MAX_IMAGE_SELECTION)) {
        setSelectedImages([]);
      } else {
        setSelectedImages([...multiSelectAlbum.images].slice(0, MAX_IMAGE_SELECTION));
      }
    }
  };

  const openDeleteModal = (album: typeof clientAlbumsData[0]) => {
    setAlbumToDelete(album);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = () => {
    if (albumToDelete) {
      setAlbums(albums.filter(album => album.id !== albumToDelete.id));
      setShowDeleteModal(false);
      setAlbumToDelete(null);
    }
  };

  const handlePayNow = (payment: Payment) => {
    setPayNowPayment(payment);
    setShowPayNowModal(true);
    setShowPrompt(false);
  };

  const cancelDeleteAlbum = () => {
    setShowDeleteModal(false);
    setAlbumToDelete(null);
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

  const handleBulkDelete = () => {
    if (selectedImages.length > 0) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedImages.length} image(s)?`);
      if (confirmDelete) {
        setSelectedImages([]);
      }
    }
  };

  const getShareLink = (album: typeof clientAlbumsData[0]) => {
    return `https://connekt.com/gallery/${album.id}`;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Photobook functions
  const resetWizard = () => {
    setPhotobookName('');
    setPhotobookDescription('');
    setShowCreatePhotobookModal(false);
  };

  const createPhotobook = () => {
    if (!photobookName.trim()) return;
    const newPhotobook = {
      id: Date.now(),
      name: photobookName.trim(),
      description: photobookDescription.trim(),
      thumbnail: '',
      images: [] as string[],
      layout: '' as 'book-flip' | 'mosaic' | 'gallery-wall' | '',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setPhotobooks([...photobooks, newPhotobook]);
    resetWizard();
    setPageView('photobooks');
  };

  // Delete photobook functions
  const openDeletePhotobookModal = (photobook: typeof photobooks[0]) => {
    setPhotobookToDelete(photobook);
    setShowDeletePhotobookModal(true);
  };

  const confirmDeletePhotobook = () => {
    if (photobookToDelete) {
      setPhotobooks(photobooks.filter(pb => pb.id !== photobookToDelete.id));
      setShowDeletePhotobookModal(false);
      setPhotobookToDelete(null);
    }
  };

  const cancelDeletePhotobook = () => {
    setShowDeletePhotobookModal(false);
    setPhotobookToDelete(null);
  };

  // Setup wizard functions (Select Album → Layout → Images)
  const openSetupWizard = (photobook: typeof photobooks[0]) => {
    setSetupPhotobookId(photobook.id);
    setSetupSelectedAlbum(null);
    setSetupLayout(photobook.layout ? photobook.layout as 'book-flip' | 'mosaic' | 'gallery-wall' : 'book-flip');
    setSetupSelectedImages([...photobook.images]);
    setSetupStep(1);
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
  };

  // Opens the cover picker instead of saving directly
  const saveSetupWizard = () => {
    if (!setupPhotobookId || setupSelectedImages.length === 0) return;
    setSetupCoverImage(setupSelectedImages[0]);
    setShowCoverPicker(true);
  };

  // Actually saves after the user picks a cover
  const confirmSaveWithCover = () => {
    if (!setupPhotobookId || setupSelectedImages.length === 0) return;
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
    if (setupSelectedAlbum) {
      setAlbums(albums.filter(album => album.id !== setupSelectedAlbum.id));
    }
    resetSetupWizard();
  };

  const toggleSetupImageSelection = (image: string) => {
    if (setupSelectedImages.includes(image)) {
      setSetupSelectedImages(setupSelectedImages.filter(img => img !== image));
    } else {
      if (setupSelectedImages.length < MAX_IMAGE_SELECTION) {
        setSetupSelectedImages([...setupSelectedImages, image]);
      }
    }
  };

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

  const handlePhotobookBulkDelete = () => {
    if (photobookSelectedImages.length > 0 && selectedPhotobook) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${photobookSelectedImages.length} image(s) from this photobook?`);
      if (confirmDelete) {
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
        ...clientAlbumsData[0],
        title: selectedPhotobook.name,
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.bgPrimary }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 5rem !important;
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
            padding-bottom: 5rem !important;
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
            padding-bottom: 5rem !important;
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
      `}</style>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userRole} giftAmount={userRole === 'client' ? 225.00 : undefined} liveStreamFeeAmount={userRole === 'event-coordinator' ? 3250.00 : undefined} />

        {/* Main Content */}
        <div className="mobile-main-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Header */}
          <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 className="mobile-title" style={{ fontSize: '1.8rem', lineHeight: '2rem', color: colors.textPrimary, fontWeight: '600', margin: 0 }}>My Gallery</h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#16A34A'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Completed Events
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
                Albums and photos from your completed events, shared by your photographers
              </p>
            </div>
            <div className="mobile-header-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              <button
                onClick={() => setPageView(pageView === 'albums' ? 'archives' : 'albums')}
                style={{
                  cursor: 'pointer',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #F20C8F',
                  backgroundColor: '#F20C8F',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {pageView === 'albums' ? (
                  <Archive style={{width:'14px', height:'10px'}} />
                ) : (
                  <EyeIcon />
                )}
                {pageView === 'albums' ? 'View Archives' : 'View Photobooks'}
              </button>
              {photobooks.length > 0 && (
                <button
                  onClick={() => setPageView(pageView === 'albums' ? 'photobooks' : 'albums')}
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
                  <ImageIcon />
                  {pageView === 'albums' ? 'View Photobooks' : 'View Sent Albums'}
                </button>
              )}
              <button
                onClick={() => setShowCreatePhotobookModal(true)}
                disabled={photobooks.length > 0}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
                  backgroundColor: photobooks.length > 0 ? '#9CA3AF' : '#083A85',
                  color: 'white',
                  cursor: photobooks.length > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  whiteSpace: 'nowrap',
                  opacity: photobooks.length > 0 ? 0.7 : 1
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {photobooks.length > 0 ? 'Photobook Created' : 'Create Photobook'}
              </button>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="mobile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{albums.length}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Total Photos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{totalPhotos}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Downloaded</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>{totalDownloaded}</div>
            </div>
            <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${colors.borderPrimary}` }}>
              <div style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>Favorites</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>{totalFavorites}</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', border: `1px solid ${colors.borderPrimary}` }}>
            <div className="mobile-tabs" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search albums or photographers..."
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

              {/* Category Filter */}
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

              {/* Photographer Filter */}
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
            </div>
          </div>

          {/* Albums Grid/List or Photobooks View */}
          {pageView === 'albums' ? (
            <>
              {/* Albums Grid/List */}
              {viewMode === 'grid' ? (
                <div className="mobile-albums-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', border: `1px solid ${colors.borderPrimary}`, overflow: 'hidden' }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    borderBottom: `1px solid ${colors.borderPrimary}`,
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
                        borderBottom: `1px solid ${colors.borderPrimary}`,
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
                      <div style={{ position: 'relative', width: '80px', height: '50px', borderRadius: '0.375rem', overflow: 'hidden' }}>
                        <Image src={album.thumbnail} alt={album.title} fill style={{ objectFit: 'cover' }} />
                      </div>

                      {/* Album Title */}
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{album.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Received: {album.receivedDate}</div>
                      </div>

                      {/* Photographer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden' }}>
                          <Image src={album.photographerAvatar} alt={album.photographer} fill style={{ objectFit: 'cover' }} />
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
                  border: `1px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    <ImageIcon />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem 0' }}>
                    No Photobooks Yet
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: '0 0 1.25rem 0' }}>
                    Create a photobook and select your preferred images from sent albums to add them here.
                  </p>
                  <button
                    onClick={() => setShowCreatePhotobookModal(true)}
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
                  </button>
                </div>
              ) : (
                <div className="mobile-photobooks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {filteredPhotobooks.map((photobook) => (
                    <div
                      key={photobook.id}
                      style={{
                        backgroundColor: colors.bgCard,
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        border: `1px solid ${colors.borderPrimary}`,
                        transition: 'all 0.2s'
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
                      {/* Photobook Thumbnail */}
                      <div style={{ position: 'relative', height: '180px', overflow: 'hidden', backgroundColor: colors.bgTertiary }}>
                        {photobook.thumbnail ? (
                          <Image
                            src={photobook.thumbnail}
                            alt={photobook.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textSecondary }}>
                            <ImageIcon />
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
                        <div style={{
                          position: 'absolute',
                          bottom: '0.5rem',
                          left: '0.5rem',
                          display: 'flex',
                          gap: '0.375rem',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            backgroundColor: '#083A85',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                          }}>
                            Photobook
                          </div>
                          {photobook.layout && (
                            <div style={{
                              backgroundColor: photobook.layout === 'book-flip' ? '#7C3AED' : photobook.layout === 'mosaic' ? '#D97706' : '#059669',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.65rem',
                              fontWeight: '500',
                              textTransform: 'capitalize'
                            }}>
                              {photobook.layout === 'book-flip' ? 'Book Flip' : photobook.layout === 'mosaic' ? 'Mosaic' : 'Gallery Wall'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Photobook Info */}
                      <div style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600',display:'flex',justifyContent:'space-between',alignItems:'center', color: colors.textPrimary, margin: 0, marginBottom: '0.375rem' }}>
                        <span> {photobook.name}</span> <span style={{color:'green', backgroundColor:'#BBF7D0', padding:'0.23rem 0.39rem', borderRadius:'0.3 rem'}}>Unlocked</span>
                        </h3>
                        {photobook.description && (
                          <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>
                            {photobook.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                            {photobook.createdAt}
                          </span>
                          {photobook.layout && (
                            <span style={{
                              fontSize: '0.7rem',
                              color: photobook.layout === 'book-flip' ? '#7C3AED' : photobook.layout === 'mosaic' ? '#D97706' : '#059669',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {photobook.layout === 'book-flip' ? (
                                  <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></>
                                ) : photobook.layout === 'mosaic' ? (
                                  <><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></>
                                ) : (
                                  <><rect x="2" y="7" width="20" height="14" rx="2"></rect><line x1="12" y1="3" x2="12" y2="7"></line></>
                                )}
                              </svg>
                              {photobook.layout === 'book-flip' ? 'Book Flip' : photobook.layout === 'mosaic' ? 'Mosaic' : 'Gallery Wall'}
                            </span>
                          )}
                        </div>

                        {/* Empty Photobook Message */}
                        {photobook.images.length === 0 && (
                          <div style={{
                            padding: '0.75rem',
                            backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                            border: `1px solid ${actualTheme === 'dark' ? '#2563EB' : '#BFDBFE'}`,
                            borderRadius: '0.5rem',
                            marginBottom: '0.75rem'
                          }}>
                            <p style={{ fontSize: '0.75rem', color: actualTheme === 'dark' ? '#93C5FD' : '#1D4ED8', margin: 0, lineHeight: '1.4' }}>
                              Select an album to add images and configure your photobook.
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {photobook.images.length === 0 ? (
                            /* Empty photobook: Show Select Album button */
                            <button
                              onClick={() => openSetupWizard(photobook)}
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
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                              Select Album
                            </button>
                          ) : (
                            /* Configured photobook: Show View, Edit, Delete buttons */
                            <>
                              {/* View Button */}
                              <button
                                onClick={() => openPhotobookBrowse(photobook)}
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
                                View
                              </button>
                              {/* Edit Button */}
                              <button
                                onClick={() => openSetupWizard(photobook)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '2px solid #083A85',
                                  backgroundColor: 'transparent',
                                  color: '#083A85',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Edit
                              </button>
                              {/* Delete Button */}
                              <button
                                onClick={() => openDeletePhotobookModal(photobook)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '2px solid #DC2626',
                                  backgroundColor: 'transparent',
                                  color: '#DC2626',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Delete
                              </button>
                            </>
                          )}
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
              border: `1px solid ${colors.borderPrimary}`
            }}>
              {viewMode === 'grid' ? (
                <div className="mobile-albums-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '1.25rem' 
                }}>
                  {filteredAlbums
                    .filter(album => album.isArchived)
                    .map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        viewMode="grid"
                        colors={colors}
                        onCardClick={(album:any) => {
                          setSelectedArchiveAlbum(album);
                          setWelcomeUnlockModalOpen(true);
                        }}
                        onBrowseClick={(album) => {
                          alert('This album is archived');
                        }}
                      />
                    ))
                  }

                </div>
              ) : (
                /* List View */
                <div style={{ backgroundColor: colors.bgCard, borderRadius: '0.75rem', border: `1px solid ${colors.borderPrimary}`, overflow: 'hidden' }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 150px 120px 100px 150px',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: colors.bgTertiary,
                    borderBottom: `1px solid ${colors.borderPrimary}`,
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
                  {filteredAlbums
                    .filter(album => album.isArchived)
                    .map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        viewMode="list"
                        colors={colors}
                        onCardClick={(album) => {
                          setSelectedArchiveAlbum(album as any);
                          setWelcomeUnlockModalOpen(true);
                        }}
                        
                        onBrowseClick={(album) => {
                      
                          alert('This album is archived');
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* PROMPT MODAL - PLACED AT ROOT LEVEL */}
      {showPrompt && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '400px'
          }}>
            <DonatePromptModal
              isOpen={showPrompt}
              onClose={() => setShowPrompt(false)}
              onNo={() => {
                setShowPrompt(false);
                if (selectedArchiveAlbum?.payment) {
                  const paymentData: Payment = {
                    id: selectedArchiveAlbum.id,
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    eventName: selectedArchiveAlbum.payment.eventName,
                    eventType: selectedArchiveAlbum.category,
                    photographerName: selectedArchiveAlbum.payment.photographerName,
                    photographerImage: selectedArchiveAlbum.photographerAvatar,
                    method: '-',
                    amount: '$10.0',
                    amountNum: 10,
                    paidAmount: 0,
                    status: 'pending',
                    invoiceNumber: `INV-${new Date().getFullYear()}-${String(selectedArchiveAlbum.id).padStart(3, '0')}`
                  };
                  handlePayNow(paymentData);
                }
              }}
              onYes={() => {
                setShowPrompt(false);
                setDonateModal(true);
              }}
            />
            <button
              onClick={() => setShowPrompt(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DONATE MODAL - PLACED AT ROOT LEVEL */}
      {showDonateModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '400px'
          }}>
            <DonateModal
              isOpen={showDonateModal}
              onClose={() => setDonateModal(false)}
            />
            <button
              onClick={() => setDonateModal(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* UNLOCK MODAL - PLACED AT ROOT LEVEL */}
      {welcomeUnlockModalOpen && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '400px'
          }}>
            <PostModal
              onYes={() => {
                setWelcomeUnlockModalOpen(false);
                setShowPayNowModal(true);
              }}
              title="Would you like to unlock this Photobook?"
              description="Pay 10$ per Album to unlock photobooks"
              onNo={() => setWelcomeUnlockModalOpen(false)}
              onContinueToPayment={() => {
                setWelcomeUnlockModalOpen(false);
                setShowPrompt(true);
              }}
              onCancel={() => setWelcomeUnlockModalOpen(false)}
            />
            <button
              onClick={() => setWelcomeUnlockModalOpen(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PAY NOW MODAL - PLACED AT ROOT LEVEL */}
      <PayNowModal
        isOpen={showPayNowModal}
        onClose={() => setShowPayNowModal(false)}
        payment={payNowPayment}
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
              <Image src={selectedAlbum.thumbnail} alt={selectedAlbum.title} fill style={{ objectFit: 'cover' }} />
            </div>

            {/* Album Info */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: colors.textPrimary, margin: 0, marginBottom: '0.5rem' }}>
              {selectedAlbum.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                <Image src={selectedAlbum.photographerAvatar} alt={selectedAlbum.photographer} fill style={{ objectFit: 'cover' }} />
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.85rem', color: colors.textSecondary }}>
              <span>Category: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.category}</strong></span>
              <span>Received: <strong style={{ color: colors.textPrimary }}>{selectedAlbum.receivedDate}</strong></span>
            </div>

            {/* Action Buttons */}
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
                <Image src={shareAlbum.thumbnail} alt={shareAlbum.title} fill style={{ objectFit: 'cover' }} />
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
                      alert('QR Code feature coming soon!');
                    } else {
                      const url = option.getUrl(shareLink, shareAlbum.title);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    border: option.name === 'Copy Link' && copiedLink ? '1px solid #10B981' : `1px solid ${colors.borderPrimary}`,
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
            <div style={{ borderTop: `1px solid ${colors.borderPrimary}`, paddingTop: '1rem' }}>
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
              {/* Select Mode Toggle */}
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
                  {selectedImages.length} of {Math.min(multiSelectAlbum.images.length, MAX_IMAGE_SELECTION)} selected (max {MAX_IMAGE_SELECTION})
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
                <div className="mobile-bulk-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {selectedImages.length >= MAX_IMAGE_SELECTION && (
                    <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: '500' }}>
                      Max {MAX_IMAGE_SELECTION} images reached
                    </span>
                  )}
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
              {multiSelectAlbum.images.map((image, index) => {
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
                            <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Locked</span>
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && viewerAlbum && (
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
          onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
          tabIndex={0}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Image src={viewerAlbum.thumbnail} alt={viewerAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    margin: 0
                  }}>{viewerAlbum.title}</h3>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: 0
                  }}>{viewerAlbum.photographer}</p>
                </div>
              </div>
              <span style={{
                backgroundColor: 'rgba(8, 58, 133, 0.8)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                {currentImageIndex + 1} of {viewerAlbum.images.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleAddCurrentImageToPhotobook}
                disabled={
                  photobooks.length === 0 ||
                  (viewerAlbum ? photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex]) : false) ||
                  selectedImages.length >= MAX_IMAGE_SELECTION
                }
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: (
                    photobooks.length === 0 ||
                    (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ||
                    selectedImages.length >= MAX_IMAGE_SELECTION
                  ) ? 'rgba(255, 255, 255, 0.05)' : 'rgba(8, 58, 133, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: (
                    photobooks.length === 0 ||
                    (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ||
                    selectedImages.length >= MAX_IMAGE_SELECTION
                  ) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  opacity: (
                    photobooks.length === 0 ||
                    (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ||
                    selectedImages.length >= MAX_IMAGE_SELECTION
                  ) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                title={
                  photobooks.length === 0 ? 'Create a photobook first'
                  : (viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ? 'Already added'
                  : selectedImages.length >= MAX_IMAGE_SELECTION ? `Maximum ${MAX_IMAGE_SELECTION} images reached`
                  : 'Add to Photobook'
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {(viewerAlbum && photobooks[0]?.images.includes(viewerAlbum.images[currentImageIndex])) ? 'Added' : 'Add to Photobook'}
              </button>
              <button
                onClick={closeImageViewer}
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

          {/* Main Image Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '2rem',
            minHeight: 0
          }}>
            {/* Previous Button */}
            <button
              onClick={() => currentImageIndex > 0 && setCurrentImageIndex(currentImageIndex - 1)}
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: currentImageIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
                opacity: currentImageIndex > 0 ? 1 : 0.3
              }}
              onMouseEnter={(e) => {
                if (currentImageIndex > 0) {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ChevronLeftIcon />
            </button>

            {/* Image Display */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 100px'
            }}>
              <div style={{
                width: 'min(calc(100vh - 160px), calc(100vw - 250px))',
                height: 'min(calc(100vh - 160px), calc(100vw - 250px))',
                position: 'relative',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <Image
                  src={viewerAlbum.images[currentImageIndex]}
                  alt={`${viewerAlbum.title} - Image ${currentImageIndex + 1}`}
                  fill
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => currentImageIndex < viewerAlbum.images.length - 1 && setCurrentImageIndex(currentImageIndex + 1)}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: currentImageIndex < viewerAlbum.images.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
                opacity: currentImageIndex < viewerAlbum.images.length - 1 ? 1 : 0.3
              }}
              onMouseEnter={(e) => {
                if (currentImageIndex < viewerAlbum.images.length - 1) {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            padding: '1rem 1.5rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              justifyContent: 'center'
            }}>
              {viewerAlbum.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: currentImageIndex === index
                      ? '3px solid #083A85'
                      : '3px solid transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    opacity: currentImageIndex === index ? 1 : 0.6,
                    transform: currentImageIndex === index ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (currentImageIndex !== index) {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.borderColor = 'rgba(8, 58, 133, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentImageIndex !== index) {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                  {currentImageIndex === index && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#083A85'
                    }} />
                  )}
                </button>
              ))}
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
          onClick={resetWizard}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>Create Photobook</h2>
                <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: '0.25rem 0 0 0' }}>Give your photobook a name</p>
              </div>
              <button
                onClick={resetWizard}
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

            {/* Name & Description */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                  Photobook Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Our Wedding Day"
                  value={photobookName}
                  onChange={(e) => setPhotobookName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '0.375rem' }}>
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add a description for your photobook"
                  value={photobookDescription}
                  onChange={(e) => setPhotobookDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: `2px solid ${colors.borderPrimary}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    color: colors.textPrimary,
                    backgroundColor: colors.bgCard,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${colors.borderPrimary}` }}>
              <button
                onClick={resetWizard}
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
                onClick={createPhotobook}
                disabled={!photobookName.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #062a63',
                  backgroundColor: !photobookName.trim() ? '#9CA3AF' : '#083A85',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: !photobookName.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Create Photobook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal - Steps 1 & 2 (Album & Layout selection) */}
      {showSetupWizard && setupStep !== 3 && (
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
          onClick={resetSetupWizard}
        >
          <div
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
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${colors.borderPrimary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary }}>
                  {setupStep === 1 ? 'Select Album' : 'Select Layout'}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: colors.textSecondary }}>
                  Step {setupStep} of 3
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
              {[1, 2, 3].map(step => (
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
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 1.5rem'
            }}>
              {/* Step 1: Select Album */}
              {setupStep === 1 && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                    Choose an album to add images from:
                  </p>
                  {albums.length === 0 ? (
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
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>No albums available</p>
                      <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>Albums from your photographer will appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {albums.map(album => (
                        <div
                          key={album.id}
                          onClick={() => setSetupSelectedAlbum(album)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${setupSelectedAlbum?.id === album.id ? '#083A85' : colors.borderPrimary}`,
                            backgroundColor: setupSelectedAlbum?.id === album.id
                              ? (actualTheme === 'dark' ? '#0c2d5a' : '#EFF6FF')
                              : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{
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
                          {setupSelectedAlbum?.id === album.id && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#083A85" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="9 12 11.5 14.5 16 9.5"></polyline>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                        <div style={{
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
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: `1px solid ${colors.borderPrimary}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <button
                onClick={setupStep === 1 ? resetSetupWizard : () => setSetupStep(setupStep - 1)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.borderPrimary}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {setupStep === 1 ? 'Cancel' : 'Back'}
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Image src={setupSelectedAlbum.thumbnail} alt={setupSelectedAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>
                    {setupSelectedAlbum.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                    Step 3 of 3 · {setupSelectedAlbum.images.length} photos
                  </p>
                </div>
              </div>
              {/* Selection counter */}
              <span style={{
                backgroundColor: setupSelectedImages.length === MAX_IMAGE_SELECTION ? 'rgba(5, 150, 105, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {setupSelectedImages.length}/{MAX_IMAGE_SELECTION} selected
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              {setupSelectedAlbum.images.map((image, index) => {
                const isSelected = setupSelectedImages.includes(image);
                const isLocked = !isSelected && setupSelectedImages.length >= MAX_IMAGE_SELECTION;
                return (
                  <div
                    key={index}
                    onClick={() => !isLocked && toggleSetupImageSelection(image)}
                    onDoubleClick={() => {
                      setSetupCurrentImageIndex(index);
                      setStep3ViewMode('image-selection');
                    }}
                    style={{
                      position: 'relative',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: isSelected
                        ? '2px solid #083A85'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
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
                          backgroundColor: isSelected ? '#083A85' : 'rgba(0, 0, 0, 0.7)',
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
                            backgroundColor: '#16A34A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
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
          <div
            className="step3-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
            <div className="step3-header-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Image src={setupSelectedAlbum.thumbnail} alt={setupSelectedAlbum.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>
                    {setupSelectedAlbum.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                    {setupSelectedAlbum.photographer} · Step 3 of 3
                  </p>
                </div>
              </div>
              <span style={{
                backgroundColor: 'rgba(8, 58, 133, 0.8)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                {setupCurrentImageIndex + 1} of {setupSelectedAlbum.images.length}
              </span>
              {/* Selection counter */}
              <span style={{
                backgroundColor: setupSelectedImages.length === MAX_IMAGE_SELECTION ? 'rgba(5, 150, 105, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {setupSelectedImages.length}/{MAX_IMAGE_SELECTION} selected
              </span>
            </div>

            <div className="step3-header-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Select / Deselect / Locked button */}
              {(() => {
                const currentImg = setupSelectedAlbum.images[setupCurrentImageIndex];
                const isSel = setupSelectedImages.includes(currentImg);
                const isLck = !isSel && setupSelectedImages.length >= MAX_IMAGE_SELECTION;
                return (
                  <button
                    onClick={() => !isLck && toggleSetupImageSelection(currentImg)}
                    disabled={isLck}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: isSel ? 'rgba(220, 38, 38, 0.8)' : isLck ? 'rgba(255, 255, 255, 0.05)' : 'rgba(8, 58, 133, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      cursor: isLck ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      opacity: isLck ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                    title={isLck ? `Maximum ${MAX_IMAGE_SELECTION} images selected` : isSel ? 'Remove from selection' : 'Add to selection'}
                  >
                    {isSel ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="step3-btn-text">Remove</span>
                      </>
                    ) : isLck ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span className="step3-btn-text">Locked</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="step3-btn-text">Select</span>
                      </>
                    )}
                  </button>
                );
              })()}
              {/* Add to Photobook button */}
              {(() => {
                const currentImg = setupSelectedAlbum.images[setupCurrentImageIndex];
                const isAlreadyAdded = setupSelectedImages.includes(currentImg);
                const isMaxReached = setupSelectedImages.length >= MAX_IMAGE_SELECTION;
                return (
                  <button
                    onClick={() => {
                      if (!isAlreadyAdded && !isMaxReached) {
                        toggleSetupImageSelection(currentImg);
                      }
                    }}
                    disabled={isAlreadyAdded || isMaxReached}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: isAlreadyAdded ? 'rgba(5, 150, 105, 0.8)' : isMaxReached ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      cursor: isAlreadyAdded || isMaxReached ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      opacity: isMaxReached && !isAlreadyAdded ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                    title={isAlreadyAdded ? 'Already in photobook' : isMaxReached ? `Maximum ${MAX_IMAGE_SELECTION} images` : 'Add to photobook'}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span className="step3-btn-text">Added</span>
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span className="step3-btn-text">Add to Photobook</span>
                      </>
                    )}
                  </button>
                );
              })()}
              {/* Back button - go back to album grid */}
              <button
                onClick={() => setStep3ViewMode('album-grid')}
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
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span className="step3-btn-text">Back</span>
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
                <span className="step3-btn-text">Save</span>
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
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Main Image Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '2rem',
            minHeight: 0
          }}>
            {/* Previous Button */}
            <button
              className="step3-nav-button"
              onClick={() => setupCurrentImageIndex > 0 && setSetupCurrentImageIndex(setupCurrentImageIndex - 1)}
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: setupCurrentImageIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
                opacity: setupCurrentImageIndex > 0 ? 1 : 0.3
              }}
              onMouseEnter={(e) => {
                if (setupCurrentImageIndex > 0) {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ChevronLeftIcon />
            </button>

            {/* Image Display */}
            <div
              className="step3-fullscreen-image"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 70px'
              }}>
              <div style={{
                width: 'calc(100vw - 160px)',
                maxWidth: '1800px',
                height: 'calc(100vh - 180px)',
                position: 'relative',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <Image
                  src={setupSelectedAlbum.images[setupCurrentImageIndex]}
                  alt={`${setupSelectedAlbum.title} - Image ${setupCurrentImageIndex + 1}`}
                  fill
                  style={{ objectFit: 'contain' }}
                />
                {/* Selected badge on image */}
                {setupSelectedImages.includes(setupSelectedAlbum.images[setupCurrentImageIndex]) && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#083A85',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Selected
                  </div>
                )}
                {/* Locked badge on image */}
                {!setupSelectedImages.includes(setupSelectedAlbum.images[setupCurrentImageIndex]) && setupSelectedImages.length >= MAX_IMAGE_SELECTION && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Locked
                  </div>
                )}
              </div>
            </div>

            {/* Next Button */}
            <button
              className="step3-nav-button step3-nav-button-right"
              onClick={() => setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 && setSetupCurrentImageIndex(setupCurrentImageIndex + 1)}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
                opacity: setupCurrentImageIndex < setupSelectedAlbum.images.length - 1 ? 1 : 0.3
              }}
              onMouseEnter={(e) => {
                if (setupCurrentImageIndex < setupSelectedAlbum.images.length - 1) {
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div
            className="step3-thumbnail-strip"
            style={{
              padding: '0.5rem 1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}>
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
              justifyContent: 'center'
            }}>
              {setupSelectedAlbum.images.map((image, index) => {
                const isThumbSelected = setupSelectedImages.includes(image);
                const isThumbLocked = !isThumbSelected && setupSelectedImages.length >= MAX_IMAGE_SELECTION;
                return (
                  <button
                    className="step3-thumbnail"
                    key={index}
                    onClick={() => setSetupCurrentImageIndex(index)}
                    style={{
                      position: 'relative',
                      width: '48px',
                      height: '36px',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                      border: isThumbSelected
                        ? '2px solid #083A85'
                        : setupCurrentImageIndex === index
                          ? '2px solid rgba(255, 255, 255, 0.8)'
                          : '2px solid transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      opacity: isThumbLocked ? 0.4 : setupCurrentImageIndex === index ? 1 : 0.6,
                      transform: setupCurrentImageIndex === index ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Image src={image} alt={`Thumbnail ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                    {/* Selected checkmark on thumbnail */}
                    {isThumbSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '1px',
                        right: '1px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#083A85',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                    {/* Lock overlay on thumbnail */}
                    {isThumbLocked && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                    )}
                    {/* Active indicator bar */}
                    {setupCurrentImageIndex === index && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: isThumbSelected ? '#083A85' : 'white'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
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
              borderBottom: `1px solid ${colors.borderPrimary}`,
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
              borderTop: `1px solid ${colors.borderPrimary}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowCoverPicker(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.borderPrimary}`,
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
              {selectedPhotobook.images.map((image, index) => (
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
                      if (leftIdx < selectedPhotobook.images.length) {
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
                          style={{ objectFit: 'cover' }}
                        />
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
                      if (rightIdx < selectedPhotobook.images.length) {
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
                          style={{ objectFit: 'cover' }}
                        />
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
                {selectedPhotobook.images.map((image, index) => {
                  const isHero = index % 5 === 0;
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        gridColumn: isHero ? 'span 2' : 'span 1',
                        gridRow: isHero ? 'span 2' : 'span 1',
                        cursor: isPhotobookSelectMode ? 'pointer' : 'pointer',
                        border: photobookSelectedImages.includes(image)
                          ? '3px solid #16A34A'
                          : '3px solid transparent',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}
                      onClick={() => {
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
                        if (!isPhotobookSelectMode) {
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
                        style={{ objectFit: 'cover' }}
                      />

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
                {selectedPhotobook.images.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      maxWidth: index % 3 === 0 ? '700px' : index % 3 === 1 ? '500px' : '600px',
                      width: '100%',
                      cursor: isPhotobookSelectMode ? 'pointer' : 'pointer'
                    }}
                    onClick={() => {
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
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.9), 0 5px 15px rgba(0, 0, 0, 0.6)';
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
                        style={{ objectFit: 'cover' }}
                      />

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
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photobook Image Viewer */}
      {showPhotobookImageViewer && selectedPhotobook && selectedPhotobook.images.length > 0 && (
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedPhotobook.thumbnail && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <Image src={selectedPhotobook.thumbnail} alt={selectedPhotobook.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>{selectedPhotobook.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>Photobook</p>
                </div>
              </div>
              <span style={{
                backgroundColor: 'rgba(8, 58, 133, 0.8)',
                color: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                {photobookCurrentImageIndex + 1} of {selectedPhotobook.images.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  if (selectedPhotobook) {
                    const bookName = selectedPhotobook.name.replace(/[^a-z0-9]/gi, '_');
                    const filename = `${bookName}_${photobookCurrentImageIndex + 1}.jpg`;
                    downloadImage(selectedPhotobook.images[photobookCurrentImageIndex], filename);
                  }
                }}
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Download image"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={closePhotobookImageViewer}
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Main Image Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '2rem',
            minHeight: 0
          }}>
            {/* Previous Button */}
            <button
              onClick={() => photobookCurrentImageIndex > 0 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex - 1)}
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: photobookCurrentImageIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                opacity: photobookCurrentImageIndex > 0 ? 1 : 0.3
              }}
            >
              <ChevronLeftIcon />
            </button>

            {/* Image Display */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 100px'
            }}>
              <div style={{
                width: 'min(calc(100vh - 160px), calc(100vw - 250px))',
                height: 'min(calc(100vh - 160px), calc(100vw - 250px))',
                position: 'relative',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <Image
                  src={selectedPhotobook.images[photobookCurrentImageIndex]}
                  alt={`${selectedPhotobook.name} - Image ${photobookCurrentImageIndex + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => photobookCurrentImageIndex < selectedPhotobook.images.length - 1 && setPhotobookCurrentImageIndex(photobookCurrentImageIndex + 1)}
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                cursor: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                opacity: photobookCurrentImageIndex < selectedPhotobook.images.length - 1 ? 1 : 0.3
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            padding: '1rem 1.5rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              justifyContent: 'center'
            }}>
              {selectedPhotobook.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setPhotobookCurrentImageIndex(index)}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: photobookCurrentImageIndex === index
                      ? '3px solid #083A85'
                      : '3px solid transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    opacity: photobookCurrentImageIndex === index ? 1 : 0.6,
                    transform: photobookCurrentImageIndex === index ? 'scale(1.05)' : 'scale(1)'
                  }}
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
    </div>
  );
};

export default ClientGallery;