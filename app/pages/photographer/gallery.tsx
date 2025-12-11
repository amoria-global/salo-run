"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import Image from 'next/image';

// Icons
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#F20C8F' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.09924 19.7228 3.6929 19.0554 3.41524C18.3879 3.13757 17.6725 2.99414 16.95 2.99414C16.2275 2.99414 15.5121 3.13757 14.8446 3.41524C14.1772 3.6929 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99479 7.05 2.99479C5.59096 2.99479 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54478 7.04097 1.54478 8.5C1.54478 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.7571 11.2728 22.0348 10.6054C22.3124 9.93789 22.4559 9.22249 22.4559 8.5C22.4559 7.77751 22.3124 7.06211 22.0348 6.39464C21.7571 5.72718 21.3508 5.12075 20.84 4.61Z" stroke={filled ? '#F20C8F' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
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

// Navigation Icons for Image Viewer
const ChevronLeftIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ZoomInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FullscreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4L12 14.01L9 11.01" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Clients list for sharing - matching clients from clients page
const clientsList = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    profileImage: 'https://i.pinimg.com/1200x/e3/5e/d4/e35ed4e14e498e62d9bf66c987731f49.jpg'
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@email.com',
    profileImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@email.com',
    profileImage: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg'
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Park',
    email: 'dpark@email.com',
    profileImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg'
  },
  {
    id: '5',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.t@email.com',
    profileImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'
  },
  {
    id: '6',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'jwilson@email.com',
    profileImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg'
  }
];

// Sample gallery data with real images
const galleryData = [
  {
    id: 1,
    title: 'Wedding Ceremony',
    category: 'Wedding',
    date: 'Jan 15, 2025',
    client: 'Sarah & James',
    clientId: '1', // Sarah Johnson
    clientAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    views: 1234,
    likes: 245,
    downloads: 89,
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    featured: true,
    sharedWithClient: true,
    photoCount: 156,
    liked: true,
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200',
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200'
    ]
  },
  {
    id: 2,
    title: 'Portrait Session',
    category: 'Portrait',
    date: 'Jan 14, 2025',
    client: 'Emily Rodriguez',
    clientId: '3', // Emily Rodriguez
    clientAvatar: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    views: 856,
    likes: 132,
    downloads: 45,
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    featured: false,
    sharedWithClient: true,
    photoCount: 48,
    liked: false,
    images: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200'
    ]
  },
  {
    id: 3,
    title: 'Corporate Event',
    category: 'Event',
    date: 'Jan 13, 2025',
    client: 'Tech Corp Inc',
    clientId: '4', // David Park
    clientAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    views: 567,
    likes: 98,
    downloads: 34,
    thumbnail: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800',
    featured: true,
    sharedWithClient: false,
    photoCount: 234,
    liked: false,
    images: [
      'https://images.unsplash.com/photo-1560439514-4e9645039924?w=1200',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200',
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200'
    ]
  },
  {
    id: 4,
    title: 'Product Photography',
    category: 'Product',
    date: 'Jan 12, 2025',
    client: 'Fashion Brand',
    clientId: '5', // Lisa Thompson
    clientAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    views: 1567,
    likes: 367,
    downloads: 156,
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    featured: false,
    sharedWithClient: true,
    photoCount: 67,
    liked: true,
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200'
    ]
  },
  {
    id: 5,
    title: 'Family Portraits',
    category: 'Portrait',
    date: 'Jan 11, 2025',
    client: 'The Johnson Family',
    clientId: '1', // Sarah Johnson
    clientAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    views: 423,
    likes: 89,
    downloads: 23,
    thumbnail: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    featured: false,
    sharedWithClient: false,
    photoCount: 89,
    liked: false,
    images: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200',
      'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1200',
      'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1200',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200'
    ]
  },
  {
    id: 6,
    title: 'Beach Wedding',
    category: 'Wedding',
    date: 'Jan 10, 2025',
    client: 'Mike & Lisa',
    clientId: '5', // Lisa Thompson
    clientAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    views: 2345,
    likes: 456,
    downloads: 234,
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
    featured: true,
    sharedWithClient: true,
    photoCount: 312,
    liked: true,
    images: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200',
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200'
    ]
  },
  {
    id: 7,
    title: 'Fashion Editorial',
    category: 'Fashion',
    date: 'Jan 9, 2025',
    client: 'Vogue Studios',
    clientId: '3', // Emily Rodriguez
    clientAvatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    views: 3456,
    likes: 789,
    downloads: 345,
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
    featured: true,
    sharedWithClient: true,
    photoCount: 145,
    liked: false,
    images: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200',
      'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=1200',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'
    ]
  },
  {
    id: 8,
    title: 'Architecture Series',
    category: 'Architecture',
    date: 'Jan 8, 2025',
    client: 'City Developers',
    clientId: '4', // David Park
    clientAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    views: 678,
    likes: 134,
    downloads: 67,
    thumbnail: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
    featured: false,
    sharedWithClient: false,
    photoCount: 78,
    liked: false,
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200',
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200',
      'https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=1200',
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200',
      'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200'
    ]
  },
  {
    id: 9,
    title: 'Birthday Celebration',
    category: 'Event',
    date: 'Jan 7, 2025',
    client: 'Michael Chen',
    clientId: '2', // Michael Chen
    clientAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    views: 345,
    likes: 67,
    downloads: 12,
    thumbnail: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    featured: false,
    sharedWithClient: true,
    photoCount: 98,
    liked: false,
    images: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200',
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=1200',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200',
      'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=1200',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200',
      'https://images.unsplash.com/photo-1496843916299-590492c751f4?w=1200'
    ]
  }
];

interface GalleryProps {
  userType?: 'photographer' | 'freelancer';
}

const Gallery = ({ userType = 'photographer' }: GalleryProps) => {
  const [photos, setPhotos] = useState(galleryData);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<typeof galleryData[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePhoto, setSharePhoto] = useState<typeof galleryData[0] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Image Viewer State
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<typeof galleryData[0] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Multi-Select Gallery View State
  const [showMultiSelectView, setShowMultiSelectView] = useState(false);
  const [multiSelectAlbum, setMultiSelectAlbum] = useState<typeof galleryData[0] | null>(null);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Share to Client State
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [shareToClientSuccess, setShareToClientSuccess] = useState(false);
  const [shareType, setShareType] = useState<'album' | 'images'>('album'); // 'album' for full album, 'images' for selected images

  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadClient, setUploadClient] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadShared, setUploadShared] = useState(true);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<typeof galleryData[0] | null>(null);

  const toggleShareStatus = (photoId: number) => {
    setPhotos(photos.map(photo =>
      photo.id === photoId ? { ...photo, sharedWithClient: !photo.sharedWithClient } : photo
    ));
  };

  const openDeleteModal = (photo: typeof galleryData[0]) => {
    setAlbumToDelete(photo);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = () => {
    if (albumToDelete) {
      setPhotos(photos.filter(photo => photo.id !== albumToDelete.id));
      setShowDeleteModal(false);
      setAlbumToDelete(null);
    }
  };

  const cancelDeleteAlbum = () => {
    setShowDeleteModal(false);
    setAlbumToDelete(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      // Generate image previews
      const previews = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setUploadedImagePreviews(previews);
      setSelectedCoverIndex(0); // Default to first image as cover
    }
  };

  const resetUploadForm = () => {
    setSelectedFiles(null);
    setUploadedImagePreviews([]);
    setSelectedCoverIndex(0);
    setUploadTitle('');
    setUploadCategory('');
    setUploadClient('');
    setUploadDescription('');
    setUploadFeatured(false);
    setUploadShared(true);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getShareLink = (photo: typeof galleryData[0]) => {
    return `https://connekt.app/gallery/${photo.id}/${photo.title.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }
    if (!uploadTitle.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!uploadCategory) {
      alert('Please select a category');
      return;
    }
    if (!uploadClient.trim()) {
      alert('Please enter a client name');
      return;
    }

    // Create ONE album with all selected images
    const newAlbum = {
      id: photos.length + 1,
      title: uploadTitle,
      category: uploadCategory.charAt(0).toUpperCase() + uploadCategory.slice(1),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      client: uploadClient,
      clientId: '1', // Default to first client for uploads
      clientAvatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
      views: 0,
      likes: 0,
      downloads: 0,
      thumbnail: uploadedImagePreviews[selectedCoverIndex], // Use selected cover photo
      featured: uploadFeatured,
      sharedWithClient: uploadShared,
      photoCount: selectedFiles.length,
      liked: false,
      images: uploadedImagePreviews // All images in this single album
    };

    // Add the new album to the gallery
    setPhotos([newAlbum, ...photos]);

    // Reset form and close modal
    resetUploadForm();
    setShowUploadModal(false);

    alert(`Successfully uploaded ${selectedFiles.length} photo(s)!`);
  };

  const categories = ['All', 'Wedding', 'Portrait', 'Event', 'Product', 'Fashion', 'Architecture'];

  // Image Viewer Functions
  const openImageViewer = (album: typeof galleryData[0], startIndex: number = 0) => {
    setViewerAlbum(album);
    setCurrentImageIndex(startIndex);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    // Return to multi-select view if it was open before
    if (multiSelectAlbum) {
      setShowMultiSelectView(true);
    }
    setViewerAlbum(null);
    setCurrentImageIndex(0);
  };

  const goToPrevImage = () => {
    if (viewerAlbum) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? viewerAlbum.images.length - 1 : prev - 1
      );
    }
  };

  const goToNextImage = () => {
    if (viewerAlbum) {
      setCurrentImageIndex((prev) =>
        prev === viewerAlbum.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevImage();
    if (e.key === 'ArrowRight') goToNextImage();
    if (e.key === 'Escape') closeImageViewer();
  };

  // Multi-Select Gallery Functions
  const openMultiSelectView = (album: typeof galleryData[0]) => {
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

  const toggleImageSelection = (index: number) => {
    setSelectedImages(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllImages = () => {
    if (multiSelectAlbum) {
      setSelectedImages(multiSelectAlbum.images.map((_, index) => index));
    }
  };

  const deselectAllImages = () => {
    setSelectedImages([]);
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
        const index = selectedImages[i];
        const filename = `${albumName}_${index + 1}.jpg`;
        await downloadImage(multiSelectAlbum.images[index], filename);
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

  const handleBulkShare = () => {
    if (multiSelectAlbum && selectedImages.length > 0) {
      const shareText = `Check out these ${selectedImages.length} photos from "${multiSelectAlbum.title}"`;
      if (navigator.share) {
        navigator.share({
          title: multiSelectAlbum.title,
          text: shareText,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(shareText);
        alert('Share link copied to clipboard!');
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedImages.length > 0) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedImages.length} image(s)?`);
      if (confirmDelete) {
        alert(`${selectedImages.length} image(s) deleted successfully!`);
        setSelectedImages([]);
      }
    }
  };

  // Share to Client Functions
  const openClientSelector = (type: 'album' | 'images') => {
    setShareType(type);
    // Auto-select the dedicated client since each album has only one assigned client
    const dedicatedClientId = type === 'album' ? sharePhoto?.clientId : multiSelectAlbum?.clientId;
    setSelectedClientId(dedicatedClientId || null);
    setShareToClientSuccess(false);
    setShowClientSelector(true);
  };

  const closeClientSelector = () => {
    setShowClientSelector(false);
    setSelectedClientId(null);
    setShareToClientSuccess(false);
  };

  const handleShareToClient = () => {
    if (!selectedClientId) return;

    const client = clientsList.find(c => c.id === selectedClientId);
    if (!client) return;

    // Simulate sharing
    setShareToClientSuccess(true);

    // Auto close after 2 seconds
    setTimeout(() => {
      closeClientSelector();
      if (shareType === 'album' && sharePhoto) {
        // Update the album's sharedWithClient status
        setPhotos(photos.map(p =>
          p.id === sharePhoto.id ? { ...p, sharedWithClient: true } : p
        ));
      }
    }, 2000);
  };

  const handleBulkShareToClient = () => {
    if (selectedImages.length > 0) {
      openClientSelector('images');
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = filterCategory === 'All' || photo.category === filterCategory;
    const matchesSearch = photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         photo.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: photos.length,
    totalPhotos: photos.reduce((sum, photo) => sum + photo.photoCount, 0),
    featured: photos.filter(photo => photo.featured).length,
    shared: photos.filter(photo => photo.sharedWithClient).length,
    private: photos.filter(photo => !photo.sharedWithClient).length
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole={userType} tipsAmount={275.00} bonusAmount={725.00} balanceAmount={4975.00} />

        {/* Main Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>My Gallery</h1>
              <p style={{
                fontSize: '0.95rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>Manage and share your photo collections with clients</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#083A85',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'white',
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
              <i className="bi bi-plus-lg" style={{ fontSize: '1rem' }}></i>
              New Album
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Albums</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{stats.total}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Photos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{formatNumber(stats.totalPhotos)}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Shared</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>{stats.shared}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Private</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>{stats.private}</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Category Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: filterCategory === category ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: filterCategory === category ? '#083A85' : 'white',
                    color: filterCategory === category ? 'white' : '#6B7280',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.625rem 1rem 0.625rem 2.75rem',
                    border: '2px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    color: '#111827',
                    backgroundColor: 'white',
                    width: '280px'
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

              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                backgroundColor: '#F3F4F6',
                padding: '0.25rem',
                borderRadius: '0.5rem'
              }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <GridIcon active={viewMode === 'grid'} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ListIcon active={viewMode === 'list'} />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Showing {filteredPhotos.length} album{filteredPhotos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Gallery Grid - 3 columns */}
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem'
            }}>
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setShowViewModal(true);
                  }}
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
                  {/* Image Container */}
                  <div style={{
                    position: 'relative',
                    height: '200px',
                    overflow: 'hidden'
                  }}>
                    <Image
                      src={photo.thumbnail}
                      alt={photo.title}
                      fill
                      style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      pointerEvents: 'none'
                    }} />

                    {/* Top Left - Category Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      backgroundColor: 'rgba(8, 58, 133, 0.9)',
                      color: 'white',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {photo.category}
                    </div>

                    {/* Top Right - Featured Badge */}
                    {photo.featured && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem'
                      }}>
                        <div style={{
                          backgroundColor: '#FCD34D',
                          color: '#92400E',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <i className="bi bi-star-fill" style={{ fontSize: '0.65rem' }}></i>
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Bottom - Photo count */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      right: '0.75rem'
                    }}>
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#111827',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {photo.photoCount} photos
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '1rem' }}>
                    {/* Title & Client */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0,
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{photo.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image
                          src={photo.clientAvatar}
                          alt={photo.client}
                          width={24}
                          height={24}
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>{photo.client}</span>
                      </div>
                    </div>

                    {/* Date & Status */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #F3F4F6'
                    }}>
                      <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>{photo.date}</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: photo.sharedWithClient ? '#065F46' : '#92400E'
                      }}>
                        <i className={`bi ${photo.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{ fontSize: '0.7rem' }}></i>
                        {photo.sharedWithClient ? 'Shared' : 'Private'}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.75rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMultiSelectView(photo);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #062a63',
                          backgroundColor: '#083A85',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <EyeIcon />
                        Browse
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharePhoto(photo);
                          setShowShareModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #16A34A',
                          backgroundColor: '#F0FDF4',
                          color: '#16A34A',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <SendIcon />
                        Send
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(photo);
                          setShowEditModal(true);
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #9CA3AF',
                          backgroundColor: '#F3F4F6',
                          color: '#111827',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        title="Edit Album"
                      >
                        <i className="bi bi-pencil" style={{ fontSize: '0.9rem' }}></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(photo);
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '2px solid #FCA5A5',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '0.85rem',
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Album</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Client</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Photos</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPhotos.map((photo) => (
                    <tr
                      key={photo.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setShowViewModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                            <Image
                              src={photo.thumbnail}
                              alt={photo.title}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111827', margin: 0 }}>{photo.title}</h3>
                              {photo.featured && (
                                <span style={{
                                  backgroundColor: '#FEF3C7',
                                  color: '#92400E',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.65rem',
                                  fontWeight: '600'
                                }}>Featured</span>
                              )}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.5rem',
                              backgroundColor: '#DBEAFE',
                              color: '#1E40AF',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: '500',
                              marginTop: '0.25rem'
                            }}>{photo.category}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Image
                            src={photo.clientAvatar}
                            alt={photo.client}
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{photo.client}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{photo.date}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#083A85' }}>{photo.photoCount}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          backgroundColor: photo.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          color: photo.sharedWithClient ? '#065F46' : '#92400E'
                        }}>
                          <i className={`bi ${photo.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`} style={{ fontSize: '0.75rem' }}></i>
                          {photo.sharedWithClient ? 'Shared' : 'Private'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMultiSelectView(photo);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              border: '2px solid #062a63',
                              backgroundColor: '#083A85',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Browse Photos"
                          >
                            <ImageIcon />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharePhoto(photo);
                              setShowShareModal(true);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              border: '2px solid #16A34A',
                              backgroundColor: '#F0FDF4',
                              color: '#16A34A',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Send to Client"
                          >
                            <SendIcon />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPhoto(photo);
                              setShowEditModal(true);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              border: '2px solid #9CA3AF',
                              backgroundColor: '#F3F4F6',
                              color: '#111827',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Edit"
                          >
                            <i className="bi bi-pencil" style={{ fontSize: '0.9rem' }}></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(photo);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              border: '2px solid #FCA5A5',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Results */}
          {filteredPhotos.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '4rem 1.5rem',
              textAlign: 'center',
              border: '1px solid #E5E7EB'
            }}>
              <i className="bi bi-images" style={{ fontSize: '4rem', color: '#D1D5DB', marginBottom: '1rem' }}></i>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>No albums found</h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#6B7280',
                margin: 0
              }}>Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
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
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Create New Album</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Upload Area */}
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="file-upload"
              style={{
                display: 'block',
                border: '2px dashed #D1D5DB',
                borderRadius: '0.75rem',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <i className="bi bi-cloud-upload" style={{ fontSize: '1.75rem', color: '#2563EB' }}></i>
              </div>
              <p style={{
                fontSize: '0.95rem',
                color: '#374151',
                margin: '0 0 0.5rem 0',
                fontWeight: '500'
              }}>
                {selectedFiles && selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Click to upload photos'}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                margin: 0
              }}>PNG, JPG, GIF up to 10MB each</p>
            </label>

            {/* Cover Photo Selection */}
            {uploadedImagePreviews.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>Select Cover Photo *</label>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#6B7280',
                  margin: '0 0 0.75rem 0'
                }}>Click on an image to set it as the album cover</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.5rem',
                  border: '1px solid #E5E7EB'
                }}>
                  {uploadedImagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedCoverIndex(index)}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '0.375rem',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedCoverIndex === index ? '3px solid #083A85' : '2px solid transparent',
                        boxShadow: selectedCoverIndex === index ? '0 0 0 2px rgba(8, 58, 133, 0.2)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                      {selectedCoverIndex === index && (
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: '#083A85',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {selectedCoverIndex === index && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          backgroundColor: 'rgba(8, 58, 133, 0.9)',
                          padding: '2px 4px',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '600' }}>COVER</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Album Title *</label>
                <input
                  type="text"
                  placeholder="Enter album title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select category</option>
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="product">Product</option>
                  <option value="fashion">Fashion</option>
                  <option value="architecture">Architecture</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Client Name *</label>
                <input
                  type="text"
                  placeholder="Enter client name"
                  value={uploadClient}
                  onChange={(e) => setUploadClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="upload-featured"
                    checked={uploadFeatured}
                    onChange={(e) => setUploadFeatured(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#083A85' }}
                  />
                  <label htmlFor="upload-featured" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    Mark as featured
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="upload-shared"
                    checked={uploadShared}
                    onChange={(e) => setUploadShared(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                  />
                  <label htmlFor="upload-shared" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    Share with client
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #E5E7EB'
            }}>
              <button
                onClick={() => {
                  resetUploadForm();
                  setShowUploadModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#083A85',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="bi bi-plus-lg"></i>
                Create Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Photo Modal */}
      {showViewModal && selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
              backgroundColor: 'white',
              borderRadius: '1rem',
              width: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
              <Image
                src={selectedPhoto.thumbnail}
                alt={selectedPhoto.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
              {selectedPhoto.featured && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: '#FCD34D',
                  color: '#92400E',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <i className="bi bi-star-fill"></i>
                  Featured
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>{selectedPhoto.title}</h2>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.625rem',
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    borderRadius: '0.375rem',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    marginTop: '0.5rem'
                  }}>{selectedPhoto.category}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  backgroundColor: selectedPhoto.sharedWithClient ? '#D1FAE5' : '#FEF3C7',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: selectedPhoto.sharedWithClient ? '#065F46' : '#92400E'
                }}>
                  <i className={`bi ${selectedPhoto.sharedWithClient ? 'bi-check-circle-fill' : 'bi-lock-fill'}`}></i>
                  {selectedPhoto.sharedWithClient ? 'Shared' : 'Private'}
                </div>
              </div>

              {/* Client Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <Image
                  src={selectedPhoto.clientAvatar}
                  alt={selectedPhoto.client}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{selectedPhoto.client}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{selectedPhoto.date}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#083A85' }}>{selectedPhoto.photoCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Photos</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10B981' }}>{formatNumber(selectedPhoto.downloads)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Downloads</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openMultiSelectView(selectedPhoto);
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
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  <ImageIcon />
                  Browse Photos
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #D1D5DB',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                    Edit Album
                  </button>
                  <button
                    onClick={() => {
                      setSharePhoto(selectedPhoto);
                      setShowShareModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '2px solid #16A34A',
                      backgroundColor: '#F0FDF4',
                      color: '#16A34A',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <SendIcon />
                    Send to Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {showEditModal && selectedPhoto && (
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
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Edit Album</h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Preview Image */}
            <div style={{ position: 'relative', height: '160px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <Image
                src={selectedPhoto.thumbnail}
                alt={selectedPhoto.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Title</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.title}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Category</label>
                <select
                  defaultValue={selectedPhoto.category.toLowerCase()}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="wedding">Wedding</option>
                  <option value="portrait">Portrait</option>
                  <option value="event">Event</option>
                  <option value="product">Product</option>
                  <option value="fashion">Fashion</option>
                  <option value="architecture">Architecture</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Client</label>
                <input
                  type="text"
                  defaultValue={selectedPhoto.client}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#111827',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-featured"
                    defaultChecked={selectedPhoto.featured}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#083A85' }}
                  />
                  <label htmlFor="edit-featured" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    Mark as featured
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-shared"
                    checked={selectedPhoto.sharedWithClient}
                    onChange={() => toggleShareStatus(selectedPhoto.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                  />
                  <label htmlFor="edit-shared" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    Share with client
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #E5E7EB'
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Saving album changes...');
                  setShowEditModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#083A85',
                  border: '2px solid #062a63',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharePhoto && (
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
            zIndex: 1000,
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Send Album to Client</h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: '2px solid #D1D5DB',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                <Image src={sharePhoto.thumbnail} alt={sharePhoto.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>{sharePhoto.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{sharePhoto.photoCount} photos • {sharePhoto.client}</div>
              </div>
            </div>

            {/* Send to Client Section */}
            {(() => {
              const dedicatedClient = clientsList.find(c => c.id === sharePhoto.clientId);
              return dedicatedClient ? (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                    Send this album to the event client:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #BBF7D0' }}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <Image
                        src={dedicatedClient.profileImage}
                        alt={`${dedicatedClient.firstName} ${dedicatedClient.lastName}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                        {dedicatedClient.firstName} {dedicatedClient.lastName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{dedicatedClient.email}</div>
                    </div>
                    <div style={{ color: '#16A34A' }}>
                      <CheckCircleIcon />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClientId(dedicatedClient.id);
                      setShareType('album');
                      // Simulate sending
                      alert(`Album "${sharePhoto.title}" has been sent to ${dedicatedClient.firstName} ${dedicatedClient.lastName}!`);
                      setShowShareModal(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: 'none',
                      borderRadius: '0.5rem',
                      backgroundColor: '#16A34A',
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#15803D';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#16A34A';
                    }}
                  >
                    <SendIcon />
                    Send Album to {dedicatedClient.firstName}
                  </button>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#DC2626' }}>No client assigned to this album</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Client Selector Modal - For sending selected images from multi-select view */}
      {showClientSelector && multiSelectAlbum && (
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
            zIndex: 1100
          }}
          onClick={closeClientSelector}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '450px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!shareToClientSuccess ? (
              (() => {
                const dedicatedClient = clientsList.find(c => c.id === multiSelectAlbum.clientId);
                return dedicatedClient ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        Send {selectedImages.length} Image(s) to Event Client
                      </h3>
                      <button
                        onClick={closeClientSelector}
                        style={{
                          background: '#F3F4F6',
                          border: '2px solid #D1D5DB',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CloseIcon />
                      </button>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
                      Send the selected images to the event client:
                    </p>

                    {/* Dedicated Client Display */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1.25rem',
                      padding: '0.75rem',
                      backgroundColor: '#F0FDF4',
                      borderRadius: '0.5rem',
                      border: '2px solid #16A34A'
                    }}>
                      <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <Image
                          src={dedicatedClient.profileImage}
                          alt={`${dedicatedClient.firstName} ${dedicatedClient.lastName}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                          {dedicatedClient.firstName} {dedicatedClient.lastName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{dedicatedClient.email}</div>
                      </div>
                      <div style={{ color: '#16A34A' }}>
                        <CheckCircleIcon />
                      </div>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={() => {
                        setSelectedClientId(dedicatedClient.id);
                        handleShareToClient();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        backgroundColor: '#16A34A',
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#15803D';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#16A34A';
                      }}
                    >
                      <SendIcon />
                      Send {selectedImages.length} Image(s) to {dedicatedClient.firstName}
                    </button>
                  </>
                ) : (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#DC2626' }}>No client assigned to this album</div>
                  </div>
                );
              })()
            ) : (
              /* Success State */
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <CheckCircleIcon />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#166534', margin: '0 0 0.5rem 0' }}>
                  Sent Successfully!
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>
                  {clientsList.find(c => c.id === multiSelectAlbum?.clientId)?.firstName} will receive a notification with the selected images.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Image Viewer Modal */}
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
          onKeyDown={handleKeyDown}
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
                  <Image
                    src={viewerAlbum.thumbnail}
                    alt={viewerAlbum.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
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
                  }}>{viewerAlbum.client}</p>
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
                onClick={handleDownloadCurrentImage}
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
                  e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                  e.currentTarget.style.borderColor = '#083A85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Download image"
              >
                <DownloadIcon />
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
              onClick={goToPrevImage}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                e.currentTarget.style.borderColor = '#083A85';
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
              onClick={goToNextImage}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.8)';
                e.currentTarget.style.borderColor = '#083A85';
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
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
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

      {/* Multi-Select Gallery View Modal */}
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
                  {selectedImages.length} of {multiSelectAlbum.images.length} selected
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
                  Select All
                </button>
                <button
                  onClick={deselectAllImages}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Deselect All
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedImages.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                    onClick={handleBulkShareToClient}
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
                    <SendIcon />
                    Send to Client ({selectedImages.length})
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
                    <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                    Delete ({selectedImages.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Grid */}
          <div
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
              {multiSelectAlbum.images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    cursor: isSelectMode ? 'pointer' : 'default',
                    border: selectedImages.includes(index)
                      ? '3px solid #16A34A'
                      : '3px solid transparent',
                    transition: 'all 0.2s',
                    transform: selectedImages.includes(index) ? 'scale(0.98)' : 'scale(1)'
                  }}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleImageSelection(index);
                    } else {
                      // Open in image viewer (hide multi-select view but keep state)
                      setShowMultiSelectView(false);
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
                      backgroundColor: selectedImages.includes(index)
                        ? 'rgba(22, 163, 74, 0.3)'
                        : 'rgba(0, 0, 0, 0.2)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      padding: '0.75rem',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: selectedImages.includes(index)
                          ? 'none'
                          : '2px solid rgba(255, 255, 255, 0.8)',
                        backgroundColor: selectedImages.includes(index)
                          ? '#16A34A'
                          : 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        {selectedImages.includes(index) ? (
                          <i className="bi bi-check" style={{ fontSize: '1.1rem' }}></i>
                        ) : (
                          <span style={{ fontSize: '0.75rem' }}>{index + 1}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hover Actions (when not in select mode) */}
                  {!isSelectMode && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '1rem 0.75rem 0.75rem',
                        background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}
                      className="image-hover-actions"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0';
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Hide multi-select view but keep state to return to it
                          setShowMultiSelectView(false);
                          openImageViewer(multiSelectAlbum, index);
                        }}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: '#111827',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="View"
                      >
                        <EyeIcon />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = image;
                          link.download = `${multiSelectAlbum.title}-${index + 1}.jpg`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: '#083A85',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Download"
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  )}

                  {/* Image Number Badge */}
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
              ))}
            </div>
          </div>

          {/* Footer with Album Info */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Image
                  src={multiSelectAlbum.clientAvatar}
                  alt={multiSelectAlbum.client}
                  width={32}
                  height={32}
                  style={{ borderRadius: '50%' }}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                  {multiSelectAlbum.client}
                </span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                {multiSelectAlbum.date}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                {multiSelectAlbum.category}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              <DownloadIcon />
              <span style={{ fontSize: '0.875rem' }}>{formatNumber(multiSelectAlbum.downloads)}</span>
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
              backgroundColor: 'white',
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
              color: '#111827',
              margin: 0,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>Delete Album</h2>

            {/* Modal Content */}
            <p style={{
              fontSize: '0.95rem',
              color: '#6B7280',
              margin: 0,
              marginBottom: '0.5rem',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete <strong style={{ color: '#111827' }}>&quot;{albumToDelete.title}&quot;</strong>?
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
                  border: '2px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
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

export default Gallery;
