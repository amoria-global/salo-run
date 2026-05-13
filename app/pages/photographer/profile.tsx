"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import CountrySelect, { eastAfricanCountries } from '../../components/CountrySelect';
import ApprovalPendingModal from '../../components/ApprovalPendingModal';
import KycBadge from '../../components/KycBadge';
import KycVerificationModal from '../../components/KycVerificationModal';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import { getApiUrl, normalizeImageUrl, autoCapitalize, capitalizeWords } from '@/lib/api';
import { getPlatformConfig } from '@/lib/platformConfig';

// Configure localforage for profile form data
const profileFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'profile_form_draft'
});

// Storage key for the profile form
const PROFILE_FORM_KEY = 'profile_form_draft';

const CURRENCY_FLAG_MAP: Record<string, string> = {
  USD: 'us', RWF: 'rw', EUR: 'eu', KES: 'ke', UGX: 'ug', TZS: 'tz', GBP: 'gb',
};

// Interface for day availability
interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

// Interface for saved profile form data
interface ProfileFormData {
  basicInfo: {
    fullName: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
    specialty: 'Photographer' | 'Videographer';
    address: string;
    availability: {
      [key: string]: DayAvailability;
    };
  };
  overviewData: {
    about: string;
    specialties: string[];
    equipments: string[];
  };
  portfolioData: {
    beliefs: string;
    skills: { id: string; name: string; level: number }[];
    projects: { id: string; image: string; title: string; description: string; year: string }[];
  };
  experienceData: {
    experiences: { id: string; position: string; company: string; location: string; startDate: string; endDate: string; description: string }[];
  };
  savedAt: number;
}

// Icons
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


// Types
interface Skill {
  id: string;
  name: string;
  level: number;
}

interface Project {
  id: string;
  image: string;
  title: string;
  description: string;
  year: string;
}

interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface PackageFeature {
  id: string;
  featureName: string;
  isIncluded: boolean;
  displayOrder: number;
}

interface DeliveryPackage {
  id: string;
  packageName: string;
  price: string;
  currencyId: string;
  priceUnit: string;
  durationHours: string;
  description: string;
  isActive: boolean;
  hasLiveStream: boolean;
  features: PackageFeature[];
  includedPhotos: string;
  includedVideos: string;
  extraPhotoPrice: string;
  extraVideoPrice: string;
  photobookPhotos: string;
  deliveryDays: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface PendingChange {
  id: string;
  fieldName: string;
  fieldCategory?: string;
  changeType?: string;
  payload?: string;
  imageData?: string;
  oldValue: string;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
  reviewComment?: string;
  adminComment?: string;
}

interface PhotographerProfilePageProps {
  userType?: 'photographer' | 'freelancer';
}

const PhotographerProfilePage = ({ userType = 'photographer' }: PhotographerProfilePageProps) => {
  const { colors, actualTheme } = useTheme();
  const { token, user, refreshUserProfile } = useDashboardAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'experience' | 'packages'>('overview');
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const [savingEquipment, setSavingEquipment] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState<string | null>(null);
  const [savingProfilePicture, setSavingProfilePicture] = useState(false);
  const [savingCoverPhoto, setSavingCoverPhoto] = useState(false);
  const [savingImportantDetails, setSavingImportantDetails] = useState(false);
  const importantDetailsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // KYC state
  const [showKycModal, setShowKycModal] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper functions
  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // East African countries with phone codes
  // East African countries imported from CountrySelect component

  // Rwanda provinces and districts
  const rwandaProvinces: { [key: string]: string[] } = {
    'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
  };

  // Package tier definitions
  // Silver (tier 1): photographer sets specific photo/video counts, no unlimited
  // Gold    (tier 2): photographer sets specific photo/video counts, no unlimited
  // Diamond  (tier 3): "Unlimited photos & videos" locked and always included
  const PACKAGE_TIER: Record<string, number> = { Silver: 1, Gold: 2, Diamond: 3 };
  const TIER_LABELS: Record<string, string> = { Silver: 'Silver', Gold: 'Gold', Diamond: 'Diamond' };
  const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Silver:  { bg: actualTheme === 'dark' ? '#1C3238' : '#ECFDF5', text: actualTheme === 'dark' ? '#34D399' : '#065F46', border: '#10B981' },
    Gold:    { bg: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF', text: actualTheme === 'dark' ? '#60A5FA' : '#083A85', border: '#3B82F6' },
    Diamond: { bg: actualTheme === 'dark' ? '#2D1B69' : '#F5F3FF', text: actualTheme === 'dark' ? '#A78BFA' : '#4C1D95', border: '#8B5CF6' },
  };

  // Features selectable by photographer (excludes "Unlimited photos & videos" for Silver/Gold)
  const SELECTABLE_FEATURES: Record<string, string[]> = {
    Silver: [
      'Online gallery storage (provided by platform)',
      'Digital Memory Sharing Experience',
      'Printed photo album',
      'Other preferences',
    ],
    Gold: [
      'Online gallery storage (provided by platform)',
      'Digital Memory Sharing Experience',
      'Printed photo album',
      'Other preferences',
    ],
    Diamond: [
      'Online gallery storage (provided by platform)',
      'Digital Memory Sharing Experience',
      'Printed photo album',
      'Live-streaming',
      'Other preferences',
    ],
  };

  // All possible features (used for display of "not included" items)
  const ALL_FEATURES = [
    'Online gallery storage (provided by platform)',
    'Digital Memory Sharing Experience',
    'Printed photo album',
    'Live-streaming',
    'Other preferences',
  ];

  // Legacy helper kept for savePackageToAPI — returns features to persist
  const getFeaturesForPackage = (packageName: string) => {
    if (packageName === 'Diamond') {
      return SELECTABLE_FEATURES['Diamond'] || [];
    }
    return SELECTABLE_FEATURES[packageName] || [];
  };

  // Specialties fetched from API — [{id, name}]
  const [availableSpecialties, setAvailableSpecialties] = useState<{ id: string; name: string }[]>([]);

  // Days and time options
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeOptions = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM',
    '12:00 AM'
  ];

  // Year options for selectors (from 1970 to current year + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1970 + 11 }, (_, i) => (currentYear + 10 - i).toString());
  const yearOptionsWithPresent = ['Present', ...yearOptions];

  // Default availability for each day
  const defaultAvailability: { [key: string]: DayAvailability } = {
    Monday: { enabled: true, startTime: '8:00 AM', endTime: '6:00 PM' },
    Tuesday: { enabled: true, startTime: '8:00 AM', endTime: '6:00 PM' },
    Wednesday: { enabled: true, startTime: '8:00 AM', endTime: '6:00 PM' },
    Thursday: { enabled: true, startTime: '8:00 AM', endTime: '6:00 PM' },
    Friday: { enabled: true, startTime: '8:00 AM', endTime: '6:00 PM' },
    Saturday: { enabled: true, startTime: '9:00 AM', endTime: '4:00 PM' },
    Sunday: { enabled: false, startTime: '9:00 AM', endTime: '4:00 PM' },
  };

  // Basic Information State - initialized empty, loaded from user context
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    email: '',
    phoneCode: '+250',
    phoneNumber: '',
    specialty: 'Photographer' as 'Photographer' | 'Videographer',
    address: '',
    availability: {} as { [key: string]: DayAvailability },
  });

  // Overview Tab State - initialized empty, loaded from user context
  const [overviewData, setOverviewData] = useState({
    about: '',
    specialties: [] as string[],
    equipments: [] as string[],
  });

  // Portfolio Tab State - initialized empty, loaded from user context
  const [portfolioData, setPortfolioData] = useState({
    beliefs: '',
    skills: [] as Skill[],
    projects: [] as Project[],
  });

  // Experience Tab State - initialized empty, loaded from user context
  const [experienceData, setExperienceData] = useState({
    experiences: [] as Experience[],
  });

  // Delivery Packages Tab State
  const [isPackageEditEnabled, setIsPackageEditEnabled] = useState(false);
  const [packages, setPackages] = useState<DeliveryPackage[]>([]);
  const [savingPackageId, setSavingPackageId] = useState<string | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<{ id: string; code: string; name: string }[]>([]);
  const [openCurrencyPkgId, setOpenCurrencyPkgId] = useState<string | null>(null);
  const currencyDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Package handler functions
  const addPackage = () => {
    const newId = Date.now().toString();
    setNewlyAddedId(newId);
    const newPackage: DeliveryPackage = {
      id: newId,
      packageName: '',
      price: '',
      currencyId: 'USD',
      priceUnit: 'per event',
      durationHours: '',
      description: '',
      isActive: true,
      hasLiveStream: false,
      features: [],
      includedPhotos: '',
      includedVideos: '',
      extraPhotoPrice: '',
      extraVideoPrice: '',
      photobookPhotos: '',
      deliveryDays: '',
    };
    setPackages(prev => [newPackage, ...prev]);
    setExpandedPackageId(newId);
    setTimeout(() => setNewlyAddedId(null), 1500);
  };

  const updatePackage = (id: string, field: keyof DeliveryPackage, value: string | boolean) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      // When package name changes, auto-populate features and set hasLiveStream
      if (field === 'packageName' && typeof value === 'string') {
        const allowed = SELECTABLE_FEATURES[value] || [];
        // Auto-populate all features as included; keep existing toggles for features that carry over
        updated.features = allowed.map((featureName, idx) => {
          const existing = updated.features.find(f => f.featureName === featureName);
          return { id: existing?.id || `feat-${idx}`, featureName, isIncluded: existing ? existing.isIncluded : true, displayOrder: idx };
        });
        // Only Diamond packages have live streaming
        updated.hasLiveStream = value === 'Diamond';
      }
      return updated;
    }));
  };

  const removePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
    if (expandedPackageId === id) setExpandedPackageId(null);
  };

  const addFeatureToPackage = (packageId: string) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p;
      const newFeature: PackageFeature = {
        id: Date.now().toString(),
        featureName: '',
        isIncluded: true,
        displayOrder: p.features.length + 1,
      };
      return { ...p, features: [...p.features, newFeature] };
    }));
  };

  const updateFeature = (packageId: string, featureId: string, field: keyof PackageFeature, value: string | boolean | number) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p;
      return {
        ...p,
        features: p.features.map(f => f.id === featureId ? { ...f, [field]: value } : f),
      };
    }));
  };

  const removeFeature = (packageId: string, featureId: string) => {
    setPackages(prev => prev.map(p => {
      if (p.id !== packageId) return p;
      return {
        ...p,
        features: p.features
          .filter(f => f.id !== featureId)
          .map((f, idx) => ({ ...f, displayOrder: idx + 1 })),
      };
    }));
  };

  const savePackageToAPI = async (pkg: DeliveryPackage) => {
    if (!user) {
      showToast('error', 'Not authenticated');
      return;
    }
    if (!pkg.packageName) {
      showToast('error', 'Package name is required');
      return;
    }

    // Validate delivery days order: Diamond < Gold < Silver
    const days = parseInt(pkg.deliveryDays) || 0;
    if (days > 0) {
      const premiumPkg = packages.find(p => p.packageName === 'Diamond' && p.id !== pkg.id);
      const customPkg = packages.find(p => p.packageName === 'Gold' && p.id !== pkg.id);
      const essentialPkg = packages.find(p => p.packageName === 'Silver' && p.id !== pkg.id);
      const premiumDays = parseInt(premiumPkg?.deliveryDays || '0') || 0;
      const customDays = parseInt(customPkg?.deliveryDays || '0') || 0;
      const essentialDays = parseInt(essentialPkg?.deliveryDays || '0') || 0;

      if (pkg.packageName === 'Diamond') {
        if (customDays > 0 && days >= customDays) { showToast('error', `Diamond delivery (${days}d) must be faster than Gold (${customDays}d)`); return; }
        if (essentialDays > 0 && days >= essentialDays) { showToast('error', `Diamond delivery (${days}d) must be faster than Silver (${essentialDays}d)`); return; }
      }
      if (pkg.packageName === 'Gold') {
        if (premiumDays > 0 && days <= premiumDays) { showToast('error', `Gold delivery (${days}d) must be slower than Diamond (${premiumDays}d)`); return; }
        if (essentialDays > 0 && days >= essentialDays) { showToast('error', `Gold delivery (${days}d) must be faster than Silver (${essentialDays}d)`); return; }
      }
      if (pkg.packageName === 'Silver') {
        if (customDays > 0 && days <= customDays) { showToast('error', `Silver delivery (${days}d) must be slower than Gold (${customDays}d)`); return; }
        if (premiumDays > 0 && days <= premiumDays) { showToast('error', `Silver delivery (${days}d) must be slower than Diamond (${premiumDays}d)`); return; }
      }
    }

    // Validate photo/video counts: Diamond > Gold > Silver
    const photos = parseInt(pkg.includedPhotos) || 0;
    const videos = parseInt(pkg.includedVideos) || 0;
    if (photos > 0 || videos > 0) {
      const premiumPkg = packages.find(p => p.packageName === 'Diamond' && p.id !== pkg.id);
      const customPkg = packages.find(p => p.packageName === 'Gold' && p.id !== pkg.id);
      const essentialPkg = packages.find(p => p.packageName === 'Silver' && p.id !== pkg.id);
      const pPhotos = parseInt(premiumPkg?.includedPhotos || '0') || 0;
      const cPhotos = parseInt(customPkg?.includedPhotos || '0') || 0;
      const ePhotos = parseInt(essentialPkg?.includedPhotos || '0') || 0;
      const pVideos = parseInt(premiumPkg?.includedVideos || '0') || 0;
      const cVideos = parseInt(customPkg?.includedVideos || '0') || 0;
      const eVideos = parseInt(essentialPkg?.includedVideos || '0') || 0;

      if (pkg.packageName === 'Diamond') {
        if (photos > 0 && cPhotos > 0 && photos <= cPhotos) { showToast('error', `Diamond photos (${photos}) must be more than Gold (${cPhotos})`); return; }
        if (photos > 0 && ePhotos > 0 && photos <= ePhotos) { showToast('error', `Diamond photos (${photos}) must be more than Silver (${ePhotos})`); return; }
        if (videos > 0 && cVideos > 0 && videos <= cVideos) { showToast('error', `Diamond videos (${videos}) must be more than Gold (${cVideos})`); return; }
        if (videos > 0 && eVideos > 0 && videos <= eVideos) { showToast('error', `Diamond videos (${videos}) must be more than Silver (${eVideos})`); return; }
      }
      if (pkg.packageName === 'Gold') {
        if (photos > 0 && pPhotos > 0 && photos >= pPhotos) { showToast('error', `Gold photos (${photos}) must be less than Diamond (${pPhotos})`); return; }
        if (photos > 0 && ePhotos > 0 && photos <= ePhotos) { showToast('error', `Gold photos (${photos}) must be more than Silver (${ePhotos})`); return; }
        if (videos > 0 && pVideos > 0 && videos >= pVideos) { showToast('error', `Gold videos (${videos}) must be less than Diamond (${pVideos})`); return; }
        if (videos > 0 && eVideos > 0 && videos <= eVideos) { showToast('error', `Gold videos (${videos}) must be more than Silver (${eVideos})`); return; }
      }
      if (pkg.packageName === 'Silver') {
        if (photos > 0 && cPhotos > 0 && photos >= cPhotos) { showToast('error', `Silver photos (${photos}) must be less than Gold (${cPhotos})`); return; }
        if (videos > 0 && cVideos > 0 && videos >= cVideos) { showToast('error', `Silver videos (${videos}) must be less than Gold (${cVideos})`); return; }
      }
    }

    // Resolve currencyId to UUID
    const isUUID = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    const resolvedCurrencyId = isUUID(pkg.currencyId)
      ? pkg.currencyId
      : currencies.find(c => c.code === pkg.currencyId || c.name === pkg.currencyId)?.id || null;

    if (!resolvedCurrencyId) {
      showToast('error', 'Please select a currency');
      return;
    }

    setSavingPackageId(pkg.id);
    try {
      const apiUrl = getApiUrl();
      const isExisting = isUUID(pkg.id);
      const url = isExisting
        ? `${apiUrl}/api/remote/photographer/packages/${pkg.id}`
        : `${apiUrl}/api/remote/photographer/packages`;
      const response = await dashboardAuthFetch(url, {
        method: isExisting ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: capitalizeWords(pkg.packageName),
          price: parseFloat(pkg.price) || 0,
          currencyId: resolvedCurrencyId,
          priceUnit: pkg.priceUnit,
          durationHours: parseFloat(pkg.durationHours) || 0,
          description: autoCapitalize(pkg.description),
          isActive: pkg.isActive,
          hasLiveStream: pkg.hasLiveStream,
          includedPhotos: parseInt(pkg.includedPhotos) || 0,
          includedVideos: parseInt(pkg.includedVideos) || 0,
          extraPhotoPrice: parseFloat(pkg.extraPhotoPrice) || 0,
          extraVideoPrice: parseFloat(pkg.extraVideoPrice) || 0,
          photobookPhotos: parseInt(pkg.photobookPhotos) || null,
          deliveryDays: parseInt(pkg.deliveryDays) || 0,
          features: pkg.features
            .filter(f => f.featureName && f.featureName !== 'Same-day preview' && (SELECTABLE_FEATURES[pkg.packageName] || []).includes(f.featureName))
            .map((f, idx) => ({ featureName: f.featureName, isIncluded: f.isIncluded, displayOrder: idx })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to save ${pkg.packageName}: ${response.status} ${errorText}`);
      }

      showToast('success', `Package "${pkg.packageName}" saved successfully`);
    } catch (error) {
      console.error('Error saving package:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to save package');
    } finally {
      setSavingPackageId(null);
    }
  };

  // Image state - initialized empty, loaded from user context
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  // File input refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const projectImageInputRef = useRef<HTMLInputElement>(null);

  // New item input states
  const [newEquipment, setNewEquipment] = useState('');
  const [editingEquipmentIndex, setEditingEquipmentIndex] = useState<number | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextUserSync = useRef(false);

  // Input validation error states
  const [validationErrors, setValidationErrors] = useState({
    fullName: '',
    username: '',
    phoneNumber: ''
  });

  // Edit mode state - when false, all fields are disabled
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  // Pending profile changes state (for approved accounts modifying sensitive fields)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const isAccountAccepted = user?.profileReviewStatus?.toUpperCase() === 'ACCEPTED';

  // Fetch pending changes for approved accounts
  const fetchPendingChanges = useCallback(async () => {
    if (!user || !isAccountAccepted) return;
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/pending-changes`);
      if (res.ok) {
        const result = await res.json();
        if (result.data && Array.isArray(result.data)) {
          setPendingChanges(result.data.filter((c: PendingChange) => c.status === 'PENDING'));
        }
      }
    } catch (error) {
      console.error('Failed to fetch pending changes:', error);
    }
  }, [user, isAccountAccepted]);

  // Helper: check if a field has pending changes (matches fieldName or fieldCategory)
  const getFieldPendingChanges = useCallback((fieldName: string) => {
    const categoryMap: Record<string, string> = { projects: 'PROJECT', specialties: 'SPECIALTY', workExperiences: 'WORK_EXPERIENCE' };
    const category = categoryMap[fieldName];
    return pendingChanges.filter(c => c.fieldName === fieldName || (category && c.fieldCategory === category));
  }, [pendingChanges]);

  // Helper: check if response indicates change was routed to pending
  const checkPendingResponse = async (response: Response): Promise<boolean> => {
    try {
      const result = await response.clone().json();
      // Backend returns a flag or message indicating pending approval routing
      if (result.pendingApproval || result.message?.toLowerCase().includes('pending')) {
        return true;
      }
    } catch {
      // Not JSON or no pending indicator
    }
    return false;
  };

  // Save all changes handler for the "Save Changes" button
  const handleSaveAllChanges = async () => {
    if (!user) return;
    setIsSavingAll(true);
    try {
      const [firstName, ...rest] = capitalizeWords(basicInfo.fullName.trim()).split(' ');
      const lastName = rest.join(' ');
      const success = await saveImportantDetailsToAPI({
        firstName: firstName || '',
        lastName: lastName || '',
        phone: basicInfo.phoneCode && basicInfo.phoneNumber
          ? `${basicInfo.phoneCode}${basicInfo.phoneNumber.replace(/\s/g, '')}`
          : undefined,
        about: autoCapitalize(overviewData.about),
        address: capitalizeWords(basicInfo.address),
        specialtyIds: overviewData.specialties,
        professionalPhilosophy: autoCapitalize(portfolioData.beliefs),
      });
      if (success) {
        showToast('success', 'Profile saved successfully!');
        // Show approval modal if profile is not yet approved
        if (user?.profileReviewStatus?.toUpperCase() !== 'ACCEPTED') {
          setShowApprovalModal(true);
        }
      } else {
        showToast('error', 'Failed to save profile');
      }
    } catch {
      showToast('error', 'Failed to save profile');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Save all availability days
  const handleSaveAvailability = async () => {
    if (!user) return;
    setIsSavingAvailability(true);
    try {
      const daysToSave = daysOfWeek.filter(day => basicInfo.availability?.[day]?.enabled);
      let allSuccess = true;
      for (const day of daysToSave) {
        const dayData = basicInfo.availability[day];
        const success = await addAvailabilityToAPI(day, dayData.startTime, dayData.endTime);
        if (!success) allSuccess = false;
      }
      if (allSuccess) {
        showToast('success', 'Availability saved successfully!');
      } else {
        showToast('error', 'Some availability entries failed to save');
      }
    } catch {
      showToast('error', 'Failed to save availability');
    } finally {
      setIsSavingAvailability(false);
    }
  };

  // Validation handlers for sensitive input fields
  const handleFullNameChange = (value: string) => {
    // Allow only letters, spaces, and common name characters (hyphens, apostrophes)
    if (value === '' || /^[a-zA-Z\s'-]*$/.test(value)) {
      setBasicInfo(prev => ({ ...prev, fullName: value }));
      setValidationErrors(prev => ({ ...prev, fullName: '' }));
    } else {
      setValidationErrors(prev => ({ ...prev, fullName: 'Only letters, spaces, hyphens and apostrophes allowed' }));
    }
  };

  const handleUsernameChange = (value: string) => {
    // Allow only alphanumeric characters and underscores
    if (value === '' || /^[a-zA-Z0-9_]*$/.test(value)) {
      setBasicInfo(prev => ({ ...prev, username: value }));
      setValidationErrors(prev => ({ ...prev, username: '' }));
    } else {
      setValidationErrors(prev => ({ ...prev, username: 'Only letters, numbers and underscores allowed' }));
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    // Allow only numbers and spaces (for formatting like "788 456 789")
    if (value === '' || /^[\d\s]*$/.test(value)) {
      setBasicInfo(prev => ({ ...prev, phoneNumber: value }));
      setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
    } else {
      setValidationErrors(prev => ({ ...prev, phoneNumber: 'Only numbers and spaces allowed' }));
    }
  };

  // Auto-save profile form data to IndexedDB
  const saveProfileDraft = useCallback(async () => {
    const formData: ProfileFormData = {
      basicInfo,
      overviewData,
      portfolioData,
      experienceData,
      savedAt: Date.now()
    };

    try {
      await profileFormStorage.setItem(PROFILE_FORM_KEY, formData);
    } catch (error) {
      console.error('Failed to save profile draft:', error);
    }
  }, [basicInfo, overviewData, portfolioData, experienceData]);

  // Debounced auto-save when form fields change
  useEffect(() => {
    if (!isRestoringDraft) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveProfileDraft();
      }, 1000); // Save after 1 second of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isRestoringDraft, saveProfileDraft]);

  // Fetch available specialties from API on mount (with retry on transient network failures)
  useEffect(() => {
    let cancelled = false;
    const fetchSpecialties = async () => {
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/remote/photographer-categories`;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.error('Failed to fetch specialties, status:', response.status);
            return;
          }
          const result = await response.json();
          if (cancelled) return;
          if (result.data && Array.isArray(result.data)) {
            setAvailableSpecialties(result.data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          }
          return;
        } catch (error) {
          if (attempt === maxAttempts) {
            console.error('Failed to fetch specialties after retries:', error);
            return;
          }
          await new Promise(r => setTimeout(r, 400 * attempt));
        }
      }
    };
    fetchSpecialties();
    return () => { cancelled = true; };
  }, []);

  // Fetch currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await dashboardAuthFetch(`${apiUrl}/api/remote/public/currencies`);
        if (response.ok) {
          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            setCurrencies(result.data.map((c: { id: string; code?: string; currencyCode?: string; name?: string; currencyName?: string }) => ({
              id: c.id,
              code: c.code || c.currencyCode || '',
              name: c.name || c.currencyName || '',
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
      }
    };
    fetchCurrencies();
  }, []);

  // Close currency dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (openCurrencyPkgId) {
        const el = currencyDropdownRefs.current[openCurrencyPkgId];
        if (el && !el.contains(e.target as Node)) setOpenCurrencyPkgId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openCurrencyPkgId]);

  // Restore saved draft on component mount
  useEffect(() => {
    const restoreDraft = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const savedDraft = await profileFormStorage.getItem<any>(PROFILE_FORM_KEY);
        if (savedDraft) {
          setIsRestoringDraft(true);

          if (savedDraft.basicInfo) {
            const restoredBasicInfo = { ...savedDraft.basicInfo };
            if (!restoredBasicInfo.availability) {
              restoredBasicInfo.availability = defaultAvailability;
            }
            setBasicInfo(restoredBasicInfo);
          }
          if (savedDraft.overviewData) setOverviewData(savedDraft.overviewData);
          if (savedDraft.portfolioData) setPortfolioData(savedDraft.portfolioData);
          if (savedDraft.experienceData) setExperienceData(savedDraft.experienceData);

          // Show notice that draft was restored
          setShowDraftRestoredNotice(true);
          setTimeout(() => setShowDraftRestoredNotice(false), 3000);

          // Allow auto-save after restoration is complete
          setTimeout(() => setIsRestoringDraft(false), 100);
        }
      } catch (error) {
        console.error('Failed to restore profile draft:', error);
      }
    };

    restoreDraft();
  }, [userType]);

  // Load user data from auth context
  useEffect(() => {
    if (skipNextUserSync.current) {
      skipNextUserSync.current = false;
      return;
    }
    if (user) {
      // Strip country code prefix from phone number to avoid duplication with the selector
      let phone = user.phone || '';
      let detectedCode = '+250'; // default
      for (const c of eastAfricanCountries) {
        if (phone.startsWith(c.code)) {
          phone = phone.slice(c.code.length);
          detectedCode = c.code;
          break;
        }
        const digits = c.code.replace('+', '');
        if (phone.startsWith(digits)) {
          phone = phone.slice(digits.length);
          detectedCode = c.code;
          break;
        }
      }

      // Set basic info from user
      setBasicInfo(prev => ({
        ...prev,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || '',
        phoneCode: detectedCode,
        phoneNumber: phone,
        specialty: (user.customerType === 'Videographer' ? 'Videographer' : 'Photographer') as 'Photographer' | 'Videographer',
        address: user.address || '',
      }));

      // Set overview data
      setOverviewData(prev => ({
        ...prev,
        about: user.about || '',
        // Store specialty IDs for saving; backend returns [{id, name}] but AuthProvider types as string[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        specialties: (user.specialties as any[])?.map((s) => typeof s === 'object' ? (s.id || s.name) : s) || [],
        equipments: user.equipments?.map(e => e.name) || [],
      }));

      // Set portfolio data
      setPortfolioData(prev => ({
        ...prev,
        beliefs: user.professionalPhilosophy || '',
        skills: user.professionalSkills?.map(s => ({
          id: s.id || String(Date.now()),
          name: s.name,
          level: s.skillPercentage ?? s.proficiencyLevel ?? 0,
        })) || [],
        projects: user.projects?.map(p => ({
          id: p.id || String(Date.now()),
          image: p.projectImage || '',
          title: p.title,
          description: p.description || '',
          year: String(p.year),
        })) || [],
      }));

      // Set experience data from user
      if (user.workExperiences && user.workExperiences.length > 0) {
        setExperienceData({
          experiences: user.workExperiences.map(e => ({
            id: e.id || String(Date.now()),
            position: e.position || '',
            company: e.company || '',
            location: e.location || '',
            startDate: e.startDate?.split('-')[0] || '',
            endDate: e.endDate ? e.endDate.split('-')[0] : 'Present',
            description: e.description || '',
          })),
        });
      }

      // Set availability from user data
      if (user.availabilities && user.availabilities.length > 0) {
        const availabilityMap: { [key: string]: DayAvailability } = {};
        user.availabilities.forEach(a => {
          const day = a.dayOfWeek.charAt(0).toUpperCase() + a.dayOfWeek.slice(1).toLowerCase();
          const formatTime = (time: string | { hour: number; minute: number }) => {
            let hour: number, minute: number;
            if (typeof time === 'string') {
              const parts = time.split(':');
              hour = parseInt(parts[0], 10);
              minute = parseInt(parts[1], 10);
            } else {
              hour = time.hour;
              minute = time.minute;
            }
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
          };
          availabilityMap[day] = {
            enabled: true,
            startTime: formatTime(a.startTime),
            endTime: formatTime(a.endTime),
          };
        });
        // Fill in missing days as disabled
        daysOfWeek.forEach(day => {
          if (!availabilityMap[day]) {
            availabilityMap[day] = { enabled: false, startTime: '9:00 AM', endTime: '5:00 PM' };
          }
        });
        setBasicInfo(prev => ({ ...prev, availability: availabilityMap }));
      }

      // Set packages from user data
      if (user.packages && Array.isArray(user.packages) && user.packages.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPackages(user.packages.map((p: any) => ({
          id: p.id || String(Date.now() + Math.random()),
          packageName: p.packageName || '',
          price: String(p.price ?? ''),
          currencyId: p.currencyId || p.currencyAbbreviation || 'USD',
          priceUnit: p.priceUnit || 'per event',
          durationHours: String(p.durationHours ?? ''),
          description: p.description || '',
          isActive: p.isActive ?? true,
          hasLiveStream: p.packageName === 'Diamond' ? true : (p.hasLiveStream ?? false),
          features: (() => {
            const apiFeatures = (p.features || []).map((f: any) => ({
              id: f.id || String(Date.now()),
              featureName: f.featureName || '',
              isIncluded: f.isIncluded ?? true,
              displayOrder: f.displayOrder || 0,
            }));
            // Auto-populate features if empty but package name is set
            if (apiFeatures.length === 0 && p.packageName) {
              const allowed = SELECTABLE_FEATURES[p.packageName] || [];
              return allowed.map((featureName: string, idx: number) => ({
                id: `feat-${idx}`,
                featureName,
                isIncluded: true,
                displayOrder: idx,
              }));
            }
            return apiFeatures;
          })(),
          includedPhotos: String(p.includedPhotos ?? ''),
          includedVideos: String(p.includedVideos ?? ''),
          extraPhotoPrice: String(p.extraPhotoPrice ?? ''),
          extraVideoPrice: String(p.extraVideoPrice ?? ''),
          photobookPhotos: p.photobookPhotos != null ? String(p.photobookPhotos) : '',
          deliveryDays: String(p.deliveryDays ?? ''),
        })));
      }

      // Set images
      if (user.profilePicture) setProfileImage(user.profilePicture);
      if (user.coverPicture) setBannerImage(user.coverPicture);
    }
  }, [user]);

  // Fetch pending changes for approved accounts
  useEffect(() => {
    fetchPendingChanges();
  }, [fetchPendingChanges]);

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    // Completion checks only weight fields still present on the profile.
    // About/Bio, Equipment, Skills, Education, Certifications and standalone
    // Training were dropped from the photographer profile; counting them
    // here would lock everyone below 100% with nothing to fill.
    const fields = {
      // Basic Info (25%)
      basicInfo: {
        weight: 25,
        filled: [
          basicInfo.fullName,
          basicInfo.phoneNumber,
          basicInfo.address,
          profileImage,
        ].filter(Boolean).length,
        total: 4
      },
      // Overview — specialties only (25%)
      overview: {
        weight: 25,
        filled: [
          overviewData.specialties.length >= 2,
        ].filter(Boolean).length,
        total: 1
      },
      // Portfolio — at least one featured project (30%)
      portfolio: {
        weight: 30,
        filled: [
          portfolioData.projects.length >= 1,
        ].filter(Boolean).length,
        total: 1
      },
      // Experience — at least one entry, with a written description (20%)
      experience: {
        weight: 20,
        filled: [
          experienceData.experiences.length >= 1,
          experienceData.experiences.some(e => e.description.length > 50),
        ].filter(Boolean).length,
        total: 2
      }
    };

    let totalPercentage = 0;
    Object.values(fields).forEach(section => {
      totalPercentage += (section.filled / section.total) * section.weight;
    });

    return Math.round(totalPercentage);
  }, [basicInfo, overviewData, portfolioData, experienceData, profileImage]);

  // Get completion color
  const getCompletionColor = (percentage: number) => {
    if (percentage < 30) return '#EF4444';
    if (percentage < 60) return '#F59E0B';
    if (percentage < 85) return '#3B82F6';
    return '#10B981';
  };

  // Render pending approval badge for a field
  const renderPendingBadge = (fieldName: string) => {
    if (!isAccountAccepted) return null;
    const changes = getFieldPendingChanges(fieldName);
    if (changes.length === 0) return null;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: '600',
        color: 'white',
        backgroundColor: '#e68a00',
        marginLeft: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}>
        <i className="bi bi-hourglass-split" style={{ fontSize: '10px' }}></i>
        {changes.length} Pending
      </span>
    );
  };

  // Helper: get pending ADD items for a field and parse their payloads
  const getPendingAddItems = useCallback((fieldName: string) => {
    return getFieldPendingChanges(fieldName)
      .filter(c => c.changeType === 'ADD' && c.payload)
      .map(c => {
        try { return { ...JSON.parse(c.payload || '{}'), _pendingId: c.id, _imageData: c.imageData }; }
        catch { return { _pendingId: c.id, _imageData: c.imageData }; }
      });
  }, [getFieldPendingChanges]);

  // Pending tag style
  const pendingTagStyle: React.CSSProperties = {
    fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.4rem',
    borderRadius: '9999px', backgroundColor: '#e68a00', color: 'white',
    whiteSpace: 'nowrap',
  };

  // Handle image uploads
  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > getPlatformConfig().uploads.maxImageSizeMb * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Save to API
      saveProfilePictureToAPI(file);
    }
  };

  const handleBannerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > getPlatformConfig().uploads.maxImageSizeMb * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Save to API
      saveCoverPhotoToAPI(file);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setOverviewData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  // Equipment handlers
  const addEquipment = async () => {
    if (newEquipment.trim()) {
      const equipmentName = newEquipment.trim();
      // Add to local state
      setOverviewData(prev => ({
        ...prev,
        equipments: [...prev.equipments, equipmentName]
      }));
      setNewEquipment('');
      // Also add to API and show toast
      const success = await addEquipmentToAPI(equipmentName);
      showToast(success ? 'success' : 'error',
        success ? 'Equipment added successfully' : 'Failed to add equipment');
    }
  };

  // Update equipment
  const updateEquipment = (index: number, value: string) => {
    setOverviewData(prev => ({
      ...prev,
      equipments: prev.equipments.map((eq, i) => i === index ? value : eq)
    }));
  };

  // Skill handlers
  const addSkill = () => {
    const newSkillId = Date.now().toString();
    setNewlyAddedId(newSkillId);
    setPortfolioData(prev => ({
      ...prev,
      skills: [{ id: newSkillId, name: '', level: 50 }, ...prev.skills]
    }));
    setEditingSkillId(newSkillId);
    setTimeout(() => setNewlyAddedId(null), 1500);
  };

  const removeSkill = async (id: string) => {
    const success = await deleteSkillFromAPI(id);
    if (success) {
      setPortfolioData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s.id !== id)
      }));
      if (editingSkillId === id) {
        setEditingSkillId(null);
      }
    }
    showToast(success ? 'success' : 'error',
      success ? 'Skill deleted successfully' : 'Failed to delete skill');
  };

  const updateSkill = (id: string, field: keyof Skill, value: string | number) => {
    setPortfolioData(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  // Education / training / certification handlers removed per product request.

  // Add skill to API
  const addSkillToAPI = async (skill: Skill) => {
    if (!user) {
      console.error('Not authenticated');
      return false;
    }

    if (!skill.name) {
      console.error('Skill name is required');
      return false;
    }

    setSavingSkill(skill.id);

    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/add-professional-skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: capitalizeWords(skill.name),
          skillPercentage: skill.level,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add skill:', response.status);
        return false;
      }

      const isPending = await checkPendingResponse(response);
      if (isPending) {
        showToast('success', 'Skill change submitted for admin approval');
        await fetchPendingChanges();
      } else {
        console.log('Skill added successfully');
      }
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error adding skill:', error);
      return false;
    } finally {
      setSavingSkill(null);
    }
  };

  // Add equipment to API
  const addEquipmentToAPI = async (name: string) => {
    if (!user) {
      console.error('Not authenticated');
      return false;
    }

    if (!name) {
      console.error('Equipment name is required');
      return false;
    }

    setSavingEquipment(name);

    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/add-equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: capitalizeWords(name),
        }),
      });

      if (!response.ok) {
        console.error('Failed to add equipment:', response.status);
        return false;
      }

      const isPending = await checkPendingResponse(response);
      if (isPending) {
        showToast('success', 'Equipment change submitted for admin approval');
        await fetchPendingChanges();
      } else {
        console.log('Equipment added successfully');
      }
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error adding equipment:', error);
      return false;
    } finally {
      setSavingEquipment(null);
    }
  };

  // Save important details to API
  const saveImportantDetailsToAPI = async (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    about?: string;
    address?: string;
    specialtyIds?: string[];
    professionalPhilosophy?: string;
  }): Promise<boolean> => {
    if (!user) return false;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/update-important-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) return false;
      const isPending = await checkPendingResponse(response);
      if (isPending) {
        showToast('success', 'Some changes submitted for admin approval');
        await fetchPendingChanges();
      }
      skipNextUserSync.current = true;
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error saving important details:', error);
      return false;
    }
  };

  // Debounced auto-save for important details (2s debounce to batch rapid changes)
  const debouncedSaveImportantDetails = useCallback((data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    about?: string;
    address?: string;
    specialtyIds?: string[];
    professionalPhilosophy?: string;
  }) => {
    if (importantDetailsTimeoutRef.current) {
      clearTimeout(importantDetailsTimeoutRef.current);
    }
    importantDetailsTimeoutRef.current = setTimeout(async () => {
      setSavingImportantDetails(true);
      const success = await saveImportantDetailsToAPI(data);
      setSavingImportantDetails(false);
      if (success) {
        showToast('success', 'Changes saved');
      }
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (importantDetailsTimeoutRef.current) {
        clearTimeout(importantDetailsTimeoutRef.current);
      }
    };
  }, []);

  // Helper to convert time string to API format
  const parseTimeToAPI = (timeStr: string): string => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "00:00:00";

    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  };

  // Add availability to API
  const addAvailabilityToAPI = async (day: string, startTime: string, endTime: string) => {
    if (!user) {
      console.error('Not authenticated');
      return false;
    }

    setSavingAvailability(day);

    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/add-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: day.toUpperCase(),
          startTime: parseTimeToAPI(startTime),
          endTime: parseTimeToAPI(endTime),
        }),
      });

      if (!response.ok) {
        console.error('Failed to add availability:', response.status);
        return false;
      }

      console.log('Availability added successfully');
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error adding availability:', error);
      return false;
    } finally {
      setSavingAvailability(null);
    }
  };

  // Save profile picture to API
  const saveProfilePictureToAPI = async (file: File) => {
    if (!user) {
      console.error('Not authenticated');
      return false;
    }

    setSavingProfilePicture(true);

    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/update-profile-picture`, {
        method: 'POST',
        headers: {},
        body: formData,
      });

      if (!response.ok) {
        console.error('Failed to save profile picture:', response.status);
        return false;
      }

      console.log('Profile picture saved successfully');
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error saving profile picture:', error);
      return false;
    } finally {
      setSavingProfilePicture(false);
    }
  };

  // Save cover photo to API
  const saveCoverPhotoToAPI = async (file: File) => {
    if (!user) {
      console.error('Not authenticated');
      return false;
    }

    setSavingCoverPhoto(true);

    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('coverPhoto', file);

      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/update-cover-photo`, {
        method: 'POST',
        headers: {},
        body: formData,
      });

      if (!response.ok) {
        console.error('Failed to save cover photo:', response.status);
        return false;
      }

      console.log('Cover photo saved successfully');
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error saving cover photo:', error);
      return false;
    } finally {
      setSavingCoverPhoto(false);
    }
  };

  // Add project to API (multipart/form-data)
  const addProjectToAPI = async (project: Project, imageFile?: File) => {
    if (!user) {
      console.error('Not authenticated');
      return false;
    }

    if (!project.title) {
      console.error('Project title is required');
      return false;
    }

    setSavingProject(project.id);

    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('requestDTO', new Blob([JSON.stringify({
        title: capitalizeWords(project.title),
        description: autoCapitalize(project.description || ''),
        year: parseInt(project.year) || new Date().getFullYear(),
      })], { type: 'application/json' }));

      // If we have an image file, use it; otherwise try to convert base64 to blob.
      // CSP connect-src doesn't allow data: URLs, so decode in-process instead
      // of round-tripping through fetch().
      if (imageFile) {
        formData.append('projectImage', imageFile);
      } else if (project.image && project.image.startsWith('data:')) {
        const [meta, b64] = project.image.split(',', 2);
        if (b64) {
          const mime = /data:([^;]+)/.exec(meta)?.[1] || 'image/jpeg';
          const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          formData.append('projectImage', blob, `project-image.${ext}`);
        }
      }

      const apiResponse = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/add-project-portfolio`, {
        method: 'POST',
        headers: {},
        body: formData,
      });

      if (!apiResponse.ok) {
        console.error('Failed to add project:', apiResponse.status);
        return false;
      }

      const isPending = await checkPendingResponse(apiResponse);
      if (isPending) {
        showToast('success', 'Project change submitted for admin approval');
        await fetchPendingChanges();
      } else {
        console.log('Project added successfully');
      }
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error adding project:', error);
      return false;
    } finally {
      setSavingProject(null);
    }
  };

  // Delete skill from API
  const deleteSkillFromAPI = async (skillId: string) => {
    if (!user) return false;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/delete-professional-skills/${skillId}`, {
        method: 'POST',
        headers: {},
      });
      if (response.ok) {
        await refreshUserProfile();
      }
      return response.ok;
    } catch (error) {
      console.error('Error deleting skill:', error);
      return false;
    }
  };

  // Delete equipment from API
  const deleteEquipmentFromAPI = async (equipmentId: string) => {
    if (!user) return false;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/delete-equipment/${equipmentId}`, {
        method: 'POST',
        headers: {},
      });
      if (response.ok) {
        await refreshUserProfile();
      }
      return response.ok;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      return false;
    }
  };

  // Delete availability from API
  const deleteAvailabilityFromAPI = async (availabilityId: string) => {
    if (!user) return false;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/delete-availability/${availabilityId}`, {
        method: 'POST',
        headers: {},
      });
      if (response.ok) {
        await refreshUserProfile();
      }
      return response.ok;
    } catch (error) {
      console.error('Error deleting availability:', error);
      return false;
    }
  };

  // Delete project from API
  const deleteProjectFromAPI = async (projectId: string) => {
    if (!user) return false;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/delete-add-project-portfolio/${projectId}`, {
        method: 'POST',
        headers: {},
      });
      if (response.ok) {
        await refreshUserProfile();
      }
      return response.ok;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  // Save work experience to API
  const [savingExperience, setSavingExperience] = useState<string | null>(null);

  const saveExperienceToAPI = async (exp: Experience) => {
    if (!user) return false;
    if (!exp.position || !exp.company) {
      showToast('error', 'Position and company are required');
      return false;
    }
    setSavingExperience(exp.id);
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/add-work-experience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: capitalizeWords(exp.position),
          company: capitalizeWords(exp.company),
          location: capitalizeWords(exp.location || ''),
          startDate: exp.startDate ? `${exp.startDate}-01-01` : '',
          endDate: exp.endDate === 'Present' ? '' : (exp.endDate ? `${exp.endDate}-01-01` : ''),
          description: autoCapitalize(exp.description || ''),
        }),
      });
      if (!response.ok) return false;
      const isPending = await checkPendingResponse(response);
      if (isPending) {
        showToast('success', 'Experience change submitted for admin approval');
        await fetchPendingChanges();
      } else {
        showToast('success', 'Experience saved successfully');
      }
      await refreshUserProfile();
      return true;
    } catch (error) {
      console.error('Error saving experience:', error);
      return false;
    } finally {
      setSavingExperience(null);
    }
  };

  const deleteExperienceFromAPI = async (experienceId: string) => {
    if (!user) return false;
    try {
      const apiUrl = getApiUrl();
      const response = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/delete-work-experience/${experienceId}`, {
        method: 'POST',
        headers: {},
      });
      if (response.ok) {
        const isPending = await checkPendingResponse(response);
        if (isPending) {
          showToast('success', 'Experience deletion submitted for admin approval');
          await fetchPendingChanges();
        }
        await refreshUserProfile();
      }
      return response.ok;
    } catch (error) {
      console.error('Error deleting experience:', error);
      return false;
    }
  };

  // Experience handlers
  const addExperience = () => {
    const newId = Date.now().toString();
    setNewlyAddedId(newId);
    setExperienceData(prev => ({
      ...prev,
      experiences: [{
        id: newId,
        position: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }, ...prev.experiences]
    }));
    setTimeout(() => setNewlyAddedId(null), 1500);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperienceData(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const removeExperience = async (id: string) => {
    const success = await deleteExperienceFromAPI(id);
    if (success) {
      setExperienceData(prev => ({
        ...prev,
        experiences: prev.experiences.filter(e => e.id !== id)
      }));
    }
    showToast(success ? 'success' : 'error',
      success ? 'Experience deleted successfully' : 'Failed to delete experience');
  };

  // Project handlers
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      image: '',
      title: '',
      description: '',
      year: new Date().getFullYear().toString()
    };
    setPortfolioData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removeProject = async (id: string) => {
    const success = await deleteProjectFromAPI(id);
    if (success) {
      setPortfolioData(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id)
      }));
    }
    showToast(success ? 'success' : 'error',
      success ? 'Project deleted successfully' : 'Failed to delete project');
  };

  const handleProjectImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editingProjectId) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > getPlatformConfig().uploads.maxImageSizeMb * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProject(editingProjectId, 'image', reader.result as string);
        setEditingProjectId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Styles
  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderWidth: '2px',
    borderStyle: 'solid' as const,
    borderColor: colors.borderPrimary,
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    color: colors.textPrimary,
    backgroundColor: isEditEnabled ? colors.bgCard : colors.bgTertiary,
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s',
    cursor: isEditEnabled ? 'text' : 'not-allowed',
    opacity: isEditEnabled ? 1 : 0.7
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: '0.5rem'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#EF4444'
  };

  // Style for select inputs
  const selectStyle = {
    ...inputStyle,
    cursor: isEditEnabled ? 'pointer' : 'not-allowed'
  };

  // Package-specific styles (use isPackageEditEnabled)
  const pkgInputStyle = {
    ...inputStyle,
    backgroundColor: isPackageEditEnabled ? colors.bgCard : colors.bgTertiary,
    cursor: isPackageEditEnabled ? 'text' : 'not-allowed',
    opacity: isPackageEditEnabled ? 1 : 0.7,
  };
  const pkgSelectStyle = {
    ...pkgInputStyle,
    cursor: isPackageEditEnabled ? 'pointer' : 'not-allowed',
  };

  const errorMessageStyle = {
    color: '#EF4444',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    display: 'block'
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '14px 20px',
    fontSize: '0.92rem',
    fontWeight: 600 as const,
    color: isActive ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive
      ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`
      : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 180ms ease, border-color 180ms ease',
    whiteSpace: 'nowrap' as const,
    letterSpacing: '-0.005em',
  });

  const cardStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    border: `1px solid ${colors.borderPrimary}`,
    marginBottom: '20px',
  };

  const sectionTitleStyle = {
    fontSize: '1.1rem',
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  // Animation style for newly added items
  const newItemAnimation = {
    animation: 'slideDown 0.5s ease-out, highlight 1.5s ease-out',
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: colors.bgPrimary
    }}>
      <style>{`
        /* Desktop enhancements */
        .profile-header-enhanced {
          background: linear-gradient(135deg, rgba(8, 58, 133, 0.03) 0%, rgba(8, 58, 133, 0.01) 100%);
          padding: 1.5rem;
          border-radius: 1rem;
          margin-bottom: 1.5rem;
        }
        .save-button-enhanced {
          background: linear-gradient(135deg, #083A85 0%, #0a4da8 100%) !important;
          box-shadow: 0 4px 16px rgba(8, 58, 133, 0.3) !important;
          transition: all 0.3s ease !important;
        }
        .save-button-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(8, 58, 133, 0.4) !important;
        }
        .save-button-enhanced:active {
          transform: translateY(0);
        }
        .completion-card-enhanced {
          box-shadow: 0 8px 24px rgba(8, 58, 133, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        .profile-card-enhanced {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
          transition: all 0.3s ease !important;
        }
        .profile-card-enhanced:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }
        .tab-button-enhanced {
          transition: all 0.3s ease !important;
          position: relative !important;
        }
        .tab-button-enhanced:hover {
          transform: translateY(-2px);
        }
        .input-enhanced {
          transition: all 0.2s ease !important;
          border-radius: 0.75rem !important;
        }
        .input-enhanced:focus {
          box-shadow: 0 0 0 3px rgba(8, 58, 133, 0.1) !important;
          border-color: #083A85 !important;
        }
        .add-button-enhanced {
          background: linear-gradient(135deg, rgba(8, 58, 133, 0.1) 0%, rgba(8, 58, 133, 0.05) 100%) !important;
          transition: all 0.2s ease !important;
        }
        .add-button-enhanced:hover {
          background: linear-gradient(135deg, rgba(8, 58, 133, 0.15) 0%, rgba(8, 58, 133, 0.1) 100%) !important;
          transform: translateY(-1px);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .mobile-main-content {
            padding: 1rem !important;
            padding-bottom: 8rem !important;
          }
          .mobile-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
            padding: 1.25rem !important;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.05) 0%, rgba(8, 58, 133, 0.02) 100%) !important;
            border-radius: 1rem !important;
            border: 1px solid rgba(8, 58, 133, 0.1) !important;
          }
          .mobile-page-header h1 {
            font-size: 1.4rem !important;
            font-weight: 700 !important;
            color: #083A85 !important;
          }
          .mobile-page-header button {
            width: 100% !important;
            justify-content: center !important;
            padding: 1rem 1.5rem !important;
            font-size: 1rem !important;
            font-weight: 600 !important;
            border-radius: 0.75rem !important;
            background: linear-gradient(135deg, #083A85 0%, #0a4da8 100%) !important;
            box-shadow: 0 6px 16px rgba(8, 58, 133, 0.3) !important;
            transition: all 0.2s ease !important;
          }
          .mobile-page-header button:active {
            transform: scale(0.98);
            box-shadow: 0 4px 12px rgba(8, 58, 133, 0.2) !important;
          }
          .mobile-completion-card {
            flex-direction: column !important;
            gap: 1.5rem !important;
            text-align: center !important;
            padding: 2rem 1.5rem !important;
          }
          .mobile-profile-section {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          .mobile-profile-left {
            width: 100% !important;
            max-width: 100% !important;
            order: 1 !important;
          }
          .mobile-profile-right {
            width: 100% !important;
            order: 2 !important;
          }
          .mobile-tabs {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
            border-radius: 1rem 1rem 0 0 !important;
            padding: 0.75rem !important;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.03) 0%, rgba(8, 58, 133, 0.01) 100%) !important;
          }
          .mobile-tabs button {
            flex: 1 !important;
            min-width: auto !important;
            font-size: 0.9rem !important;
            padding: 0.75rem !important;
            font-weight: 600 !important;
            border-radius: 0.625rem !important;
            transition: all 0.2s ease !important;
          }
          .mobile-tabs button:active {
            transform: scale(0.98);
          }
          .mobile-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-form-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-form-grid-4 {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-skill-item {
            flex-direction: column !important;
            gap: 0.75rem !important;
            border-radius: 1rem !important;
            padding: 1.25rem !important;
            background: linear-gradient(135deg, rgba(8, 58, 133, 0.03) 0%, rgba(8, 58, 133, 0.01) 100%) !important;
            border: 1px solid rgba(8, 58, 133, 0.1) !important;
          }
          .mobile-skill-item > div:first-child {
            width: 100% !important;
          }
          .mobile-skill-item > div:last-child {
            width: 100% !important;
          }
          .mobile-card {
            padding: 1.25rem !important;
            border-radius: 1rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          }
          .mobile-section-actions {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .mobile-section-actions button {
            width: 100% !important;
            padding: 0.875rem 1rem !important;
            border-radius: 0.75rem !important;
            transition: all 0.2s ease !important;
            font-weight: 600 !important;
          }
          .mobile-section-actions button:active {
            transform: scale(0.98);
          }
        }
        @media (max-width: 640px) {
          .mobile-main-content {
            padding: 0.75rem !important;
            padding-bottom: 10rem !important;
          }
          .mobile-page-header {
            padding: 1rem !important;
          }
          .mobile-page-header h1 {
            font-size: 1.2rem !important;
          }
          .mobile-page-header button {
            font-size: 0.95rem !important;
            padding: 0.875rem 1.25rem !important;
          }
          .mobile-tabs {
            padding: 0.5rem !important;
          }
          .mobile-tabs button {
            font-size: 0.85rem !important;
            padding: 0.625rem 0.5rem !important;
          }
          .mobile-card {
            padding: 1rem !important;
          }
          .mobile-skill-item {
            padding: 1rem !important;
          }
          .mobile-profile-card-name {
            padding: 0.75rem 1rem 0.5rem !important;
          }
          .mobile-profile-card-name h2 {
            font-size: 1rem !important;
            margin-bottom: 0.25rem !important;
          }
          .mobile-profile-card-name p:first-of-type {
            font-size: 0.8rem !important;
            margin-bottom: 0.15rem !important;
          }
          .mobile-profile-card-name p:last-of-type {
            font-size: 0.75rem !important;
          }
          .mobile-profile-card-stats {
            padding: 0.75rem 1rem !important;
          }
          .mobile-profile-card-stats > div > div:first-child {
            font-size: 1.1rem !important;
            margin-bottom: 0.15rem !important;
          }
          .mobile-profile-card-stats > div > div:last-child {
            font-size: 0.7rem !important;
          }
          .mobile-profile-card-activity {
            padding: 0.875rem 1rem !important;
          }
          .mobile-profile-card-activity h3 {
            font-size: 0.8rem !important;
            margin-bottom: 0.625rem !important;
          }
          .mobile-profile-card-activity span {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole="photographer" />

        <div className="mobile-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: colors.bgPrimary,
          padding: '1.25rem'
        }}>
          {/*
            Missing-fields banner. When the profile is below 100%, the
            PhotographerLayout has already redirected every other route to
            this page — this banner is what tells the user why, and shows
            the four sections they need to finish before they can move on.
          */}
          {profileCompletion < 100 && (() => {
            const basicMissing: string[] = [];
            if (!basicInfo.fullName) basicMissing.push('Full name');
            if (!basicInfo.phoneNumber) basicMissing.push('Phone number');
            if (!basicInfo.address) basicMissing.push('Working city');
            if (!profileImage) basicMissing.push('Profile photo');

            const specialtiesOk = overviewData.specialties.length >= 2;
            const portfolioOk = portfolioData.projects.length >= 1;
            const hasExp = experienceData.experiences.length >= 1;
            const hasLongDesc = experienceData.experiences.some(e => e.description.length > 50);
            const experienceOk = hasExp && hasLongDesc;

            const items = [
              { label: 'Basic info (name, phone, working city, profile photo)', ok: basicMissing.length === 0, detail: basicMissing.length ? 'Missing: ' + basicMissing.join(', ') : null },
              { label: 'At least 2 specialties selected', ok: specialtiesOk, detail: specialtiesOk ? null : `Currently ${overviewData.specialties.length}` },
              { label: 'At least 1 portfolio project', ok: portfolioOk, detail: portfolioOk ? null : `Currently ${portfolioData.projects.length}` },
              { label: 'At least 1 work experience with a description (50+ chars)', ok: experienceOk, detail: !hasExp ? 'No entries yet' : (!hasLongDesc ? 'Add a description over 50 characters to one of your entries' : null) },
            ];

            return (
              <div style={{
                marginBottom: '1.25rem',
                padding: '1.25rem 1.5rem',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{
                    flex: '0 0 auto',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}>
                    <i className="bi bi-pencil-square" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                      Finish your profile to unlock the dashboard
                    </div>
                    <div style={{ fontSize: '0.88rem', color: colors.textSecondary, lineHeight: 1.5 }}>
                      You're at <strong style={{ color: '#D97706' }}>{profileCompletion}%</strong>.
                      Clients only see photographers with a 100% profile, and the rest of the dashboard stays
                      locked until each of the items below is checked off.
                    </div>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, display: 'grid', gap: 8 }}>
                  {items.map((it, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: it.ok ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.6)',
                      border: it.ok ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(0, 0, 0, 0.06)',
                    }}>
                      <i className={it.ok ? 'bi bi-check-circle-fill' : 'bi bi-circle'} style={{
                        color: it.ok ? '#10B981' : '#9CA3AF',
                        fontSize: '1.05rem',
                        marginTop: 2,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textPrimary }}>{it.label}</div>
                        {it.detail && (
                          <div style={{ fontSize: '0.8rem', color: colors.textSecondary, marginTop: 2 }}>{it.detail}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Page Header */}
          <div className="mobile-page-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#F20C8F',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}>Profile</div>
              <h1 style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: colors.textPrimary,
                margin: 0,
              }}>Edit profile</h1>
              <p style={{
                margin: '4px 0 0',
                fontSize: '0.92rem',
                color: colors.textSecondary,
              }}>Keep your information current so clients find and trust you.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user?.profileReviewStatus && (() => {
                const status = user.profileReviewStatus.toLowerCase();
                const config = status === 'accepted'
                  ? { label: 'Account active',     dot: '#10B981', toneClass: 'ck-status-success', icon: 'bi-check-circle-fill' }
                  : status === 'rejected'
                  ? { label: 'Changes needed',     dot: '#DC2626', toneClass: 'ck-status-error',   icon: 'bi-exclamation-circle-fill' }
                  : profileCompletion < 85
                  ? { label: 'Profile incomplete', dot: '#F59E0B', toneClass: 'ck-status-warning', icon: 'bi-pencil-square' }
                  : { label: 'Under review',       dot: '#3B82F6', toneClass: 'ck-status-info',    icon: 'bi-hourglass-split' };
                return (
                  <span className={config.toneClass} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 14px',
                    borderRadius: 9999,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: 9999,
                      background: config.dot,
                      boxShadow: '0 0 0 3px rgba(255,255,255,0.55)',
                    }} />
                    {config.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Draft Restored Notice */}
          {showDraftRestoredNotice && (
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #10B981',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ color: '#047857', fontSize: '0.875rem', fontWeight: '500' }}>
                Your previous changes have been restored
              </span>
            </div>
          )}

          {/* Account Status Banner */}
          {user?.profileReviewStatus && user.profileReviewStatus.toLowerCase() !== 'accepted' && (() => {
            const status = user.profileReviewStatus.toLowerCase();
            const isIncomplete = profileCompletion < 85;
            const isRejected = status === 'rejected';

            if (isRejected) {
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #d41919 0%, #a81212 100%)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  color: 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <i className="bi bi-x-circle-fill" style={{ fontSize: '24px', color: 'white' }}></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: '700', color: 'white' }}>
                        Your profile needs changes before it can be approved
                      </h4>
                      <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>
                        Our team has reviewed your profile and found some areas that need attention. Please review the feedback, update the required sections, and save your profile again to resubmit for review.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            if (isIncomplete) {
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #e68a00 0%, #cc7a00 100%)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  color: 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <i className="bi bi-pencil-square" style={{ fontSize: '24px', color: 'white' }}></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: '700', color: 'white' }}>
                        Complete your profile to get started
                      </h4>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>
                        Your profile is currently at <strong style={{ color: 'white' }}>{profileCompletion}%</strong>. To submit your profile for approval, you need to fill out at least <strong style={{ color: 'white' }}>85%</strong> of your profile information. This includes your bio, specialties, skills, experience, and portfolio details.
                      </p>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontStyle: 'italic' }}>
                        Once your profile reaches 85%, it will be automatically submitted for review by our team.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Profile is >= 90% but still pending — under review
            return (
              <div style={{
                background: 'linear-gradient(135deg, #0066cc 0%, #004d99 100%)',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                color: 'white',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <i className="bi bi-hourglass-split" style={{ fontSize: '24px', color: 'white' }}></i>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: '700', color: 'white' }}>
                      Your profile is under review
                    </h4>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7' }}>
                      Thank you for completing your profile! Our team is currently reviewing your information to verify your credentials and ensure quality standards. This process typically takes a few hours.
                    </p>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontStyle: 'italic' }}>
                      You will be notified once your account is approved and you can start receiving bookings from clients.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pending Profile Changes Banner */}
          {isAccountAccepted && pendingChanges.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #e68a00 0%, #cc7a00 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: '22px', color: 'white' }}></i>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: '700', color: 'white' }}>
                    {pendingChanges.length} Profile Change{pendingChanges.length !== 1 ? 's' : ''} Pending Approval
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
                    You have modified sensitive profile fields. These changes are being reviewed by our team and will be applied once approved. Look for the <strong>&quot;Pending&quot;</strong> badges on each section below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Completion Card — always shown so photographers can
              see their score at a glance (chips below self-hide at 100%). */}
          {(
            <div className="mobile-card completion-card-enhanced" style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.borderPrimary}`,
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* subtle gradient accent strip */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              }} />
              <div className="mobile-completion-card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {/* Circular Progress */}
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r="42" fill="none" stroke={colors.borderPrimary} strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="42"
                      fill="none"
                      stroke="url(#ck-progress-gradient)"
                      strokeWidth="8"
                      strokeDasharray={`${(profileCompletion / 100) * 264} 264`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="ck-progress-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#083A85" />
                        <stop offset="100%" stopColor="#F20C8F" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '1.4rem', fontWeight: 800, lineHeight: 1,
                      color: colors.textPrimary, letterSpacing: '-0.02em',
                    }}>{profileCompletion}%</div>
                    <div style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      color: colors.textSecondary, marginTop: 2,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Complete</div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: '1.05rem', fontWeight: 800,
                    color: colors.textPrimary, margin: 0,
                    letterSpacing: '-0.01em',
                  }}>
                    {profileCompletion >= 100 ? 'Your profile is complete' : 'Complete your profile'}
                  </h2>
                  <p style={{
                    fontSize: '0.88rem', color: colors.textSecondary,
                    margin: '4px 0 12px', lineHeight: 1.5,
                  }}>
                    {profileCompletion >= 100
                      ? 'Nice work — every section clients look at is filled in.'
                      : 'A complete profile helps clients find you and trust your expertise.'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!profileImage && (
                      <button onClick={() => setActiveTab('overview')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 9999,
                        background: 'rgba(8,58,133,0.08)', color: '#083A85',
                        border: '1px solid rgba(8,58,133,0.18)',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        <i className="bi bi-plus-lg" style={{ fontSize: 11 }} /> Add profile photo
                      </button>
                    )}
                    {overviewData.specialties.length < 2 && (
                      <button onClick={() => setActiveTab('overview')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 9999,
                        background: 'rgba(8,58,133,0.08)', color: '#083A85',
                        border: '1px solid rgba(8,58,133,0.18)',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        <i className="bi bi-plus-lg" style={{ fontSize: 11 }} /> Add specialties
                      </button>
                    )}
                    {portfolioData.projects.length < 1 && (
                      <button onClick={() => setActiveTab('portfolio')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 9999,
                        background: 'rgba(242,12,143,0.08)', color: '#F20C8F',
                        border: '1px solid rgba(242,12,143,0.20)',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        <i className="bi bi-plus-lg" style={{ fontSize: 11 }} /> Add a project
                      </button>
                    )}
                    {experienceData.experiences.length < 1 && (
                      <button onClick={() => setActiveTab('experience')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 9999,
                        background: 'rgba(242,12,143,0.08)', color: '#F20C8F',
                        border: '1px solid rgba(242,12,143,0.20)',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        <i className="bi bi-plus-lg" style={{ fontSize: 11 }} /> Add experience
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="mobile-profile-section" style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '1.5rem'
          }}>
            {/* Left Sidebar - Profile Card */}
            <div className="mobile-profile-left">
              {/* Profile Card */}
              <div className="profile-card-enhanced" style={{
                backgroundColor: colors.bgCard,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                border: `1px solid ${colors.borderPrimary}`,
              }}>
                {/* Hidden file inputs */}
                <input type="file" ref={profileInputRef} onChange={handleProfileImageUpload} accept="image/*" style={{ display: 'none' }} />
                <input type="file" ref={bannerInputRef} onChange={handleBannerImageUpload} accept="image/*" style={{ display: 'none' }} />

                {/* Banner — Connekyt brand gradient */}
                <div style={{
                  height: 96,
                  background: bannerImage
                    ? `url(${bannerImage}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #083A85 0%, #0a4da8 55%, #F20C8F 130%)',
                  position: 'relative',
                }}>
                  <button
                    onClick={() => isEditEnabled && bannerInputRef.current?.click()}
                    disabled={!isEditEnabled}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: 9999,
                      width: 32, height: 32, padding: 0,
                      cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: isEditEnabled ? 1 : 0.4,
                      backdropFilter: 'blur(6px)',
                      color: '#fff',
                    }}
                    aria-label="Change banner"
                  >
                    <i className="bi bi-camera" style={{ fontSize: 13 }} />
                  </button>
                </div>

                {/* Avatar */}
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  marginTop: -48, position: 'relative',
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 96, height: 96,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `4px solid ${colors.bgCard}`,
                      background: profileImage ? colors.bgTertiary : 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                    }}>
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      ) : (
                        <span style={{ fontSize: '2rem', color: '#fff', fontWeight: 700 }}>
                          {basicInfo.fullName ? basicInfo.fullName.charAt(0).toUpperCase() : '?'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => isEditEnabled && profileInputRef.current?.click()}
                      disabled={!isEditEnabled}
                      style={{
                        position: 'absolute', bottom: -2, left: -2,
                        backgroundColor: '#083A85',
                        border: `2px solid ${colors.bgCard}`,
                        borderRadius: '50%',
                        width: 30, height: 30,
                        cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: isEditEnabled ? 1 : 0.5,
                        boxShadow: '0 4px 10px rgba(8,58,133,0.30)',
                        zIndex: 2,
                        color: '#fff',
                      }}
                      aria-label="Change avatar"
                    >
                      <i className="bi bi-camera" style={{ fontSize: 12 }} />
                    </button>
                    {/* Verified Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '28px',
                      height: '28px',
                      zIndex: 2,
                    }}>
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1L14.4 3.3L17.5 2.6L18.4 5.6L21.4 6.5L20.7 9.6L23 12L20.7 14.4L21.4 17.5L18.4 18.4L17.5 21.4L14.4 20.7L12 23L9.6 20.7L6.5 21.4L5.6 18.4L2.6 17.5L3.3 14.4L1 12L3.3 9.6L2.6 6.5L5.6 5.6L6.5 2.6L9.6 3.3L12 1Z"
                          fill={user?.profileReviewStatus?.toUpperCase() === 'ACCEPTED' ? '#1DA1F2' : '#9CA3AF'}
                        />
                        <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="mobile-profile-card-name" style={{
                  textAlign: 'center',
                  padding: '1rem 1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                    marginBottom: '0.25rem'
                  }}>{basicInfo.fullName}</h2>
                  {user?.kycStatus === 'APPROVED' && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                      <KycBadge kycStatus={user.kycStatus} size="sm" />
                    </div>
                  )}
                  <p style={{
                    fontSize: '0.95rem',
                    color: colors.textSecondary
                  }}>{basicInfo.specialty}</p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#9CA3AF',
                    marginTop: '0.25rem'
                  }}>
                    {basicInfo.address}
                  </p>
                </div>

                {/* Stats */}
                <div className="mobile-profile-card-stats" style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '1rem',
                  borderTop: `2px solid ${colors.borderPrimary}`,
                  borderBottom: `2px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{user?.rating?.toFixed(1) || '5.0'}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{user?.reviews?.length || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Reviews</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>{user?.completedEvents || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Completed Jobs</div>
                  </div>
                </div>

                {/* KYC Verification Banner */}
                {user?.kycStatus && user.kycStatus !== 'APPROVED' && user.customerType !== 'Viewer' && (
                  <div style={{
                    padding: '1rem 1.25rem', margin: '0 1.25rem',
                    borderRadius: '0.75rem', marginBottom: '0.75rem',
                    backgroundColor: user.kycStatus === 'PENDING' ? '#FFFBEB' : user.kycStatus === 'REJECTED' ? '#FEF2F2' : '#F0F9FF',
                    border: `1px solid ${user.kycStatus === 'PENDING' ? '#FDE68A' : user.kycStatus === 'REJECTED' ? '#FECACA' : '#BFDBFE'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={user.kycStatus === 'PENDING' ? '#D97706' : user.kycStatus === 'REJECTED' ? '#DC2626' : '#2563EB'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                      </svg>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: '600',
                        color: user.kycStatus === 'PENDING' ? '#92400E' : user.kycStatus === 'REJECTED' ? '#991B1B' : '#1E40AF',
                      }}>
                        {user.kycStatus === 'PENDING' ? 'KYC Under Review' : user.kycStatus === 'REJECTED' ? 'KYC Rejected' : 'KYC Required'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.75rem', margin: 0, lineHeight: '1.4',
                      color: user.kycStatus === 'PENDING' ? '#92400E' : user.kycStatus === 'REJECTED' ? '#991B1B' : '#1E40AF',
                    }}>
                      {user.kycStatus === 'PENDING'
                        ? 'Your identity verification is being reviewed.'
                        : user.kycStatus === 'REJECTED'
                        ? 'Your KYC was rejected. Please resubmit.'
                        : 'Complete identity verification to enable withdrawals.'}
                    </p>
                    {user.kycStatus !== 'PENDING' && (
                      <button onClick={() => setShowKycModal(true)} style={{
                        marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: '600',
                        border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                        backgroundColor: '#083A85', color: 'white',
                      }}>
                        {user.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}
                      </button>
                    )}
                  </div>
                )}

                {/* Account Activity */}
                <div className="mobile-profile-card-activity" style={{
                  padding: '1.25rem'
                }}>
                  <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: '0.75rem'
                  }}>Account Activity</h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Last Login</span>
                      <span style={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: '500' }}>Today</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Member Since</span>
                      <span style={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: '500' }}>
                        {user?.joinedFrom ? new Date(user.joinedFrom).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Reviews */}
                {user?.reviews && user.reviews.length > 0 && (
                  <div style={{ padding: '1.25rem', borderTop: `2px solid ${colors.borderPrimary}` }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Client Reviews ({user.reviews.length})
                    </h3>

                    {/* Average Rating Display */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      marginBottom: '1rem', padding: '0.75rem',
                      backgroundColor: actualTheme === 'dark' ? '#1a2332' : '#F8FAFC',
                      borderRadius: '0.5rem'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>
                        {user.rating?.toFixed(1) || '5.0'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '0.15rem' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= Math.round(user.rating || 5) ? '#F59E0B' : 'none'} stroke={star <= Math.round(user.rating || 5) ? '#F59E0B' : '#D1D5DB'} strokeWidth="2">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                            </svg>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                          Based on {user.reviews.length} review{user.reviews.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Review Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {user.reviews.slice(0, 5).map((rev) => (
                        <div key={rev.id} style={{
                          padding: '0.75rem',
                          border: `1px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem',
                          backgroundColor: colors.bgCard,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              overflow: 'hidden', backgroundColor: colors.bgTertiary, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {rev.reviewer?.profilePicture ? (
                                <img src={normalizeImageUrl(rev.reviewer.profilePicture) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }}
                                />
                              ) : null}
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: colors.textSecondary, display: rev.reviewer?.profilePicture ? 'none' : 'flex' }}>
                                {(rev.reviewer?.firstName || '?').charAt(0)}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: colors.textPrimary }}>
                                {rev.reviewer?.firstName} {rev.reviewer?.lastName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill={star <= rev.rating ? '#F59E0B' : 'none'} stroke={star <= rev.rating ? '#F59E0B' : '#D1D5DB'} strokeWidth="2">
                                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                    </svg>
                                  ))}
                                </div>
                                {rev.createdAt && (
                                  <span style={{ fontSize: '0.7rem', color: colors.textSecondary }}>
                                    {(() => {
                                      const diff = Date.now() - new Date(rev.createdAt).getTime();
                                      const mins = Math.floor(diff / 60000);
                                      if (mins < 60) return `${mins}m ago`;
                                      const hrs = Math.floor(mins / 60);
                                      if (hrs < 24) return `${hrs}h ago`;
                                      const days = Math.floor(hrs / 24);
                                      if (days < 7) return `${days}d ago`;
                                      const weeks = Math.floor(days / 7);
                                      if (weeks < 5) return `${weeks}w ago`;
                                      const months = Math.floor(days / 30);
                                      if (months < 12) return `${months}mo ago`;
                                      return `${Math.floor(months / 12)}y ago`;
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {rev.review && (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textSecondary, lineHeight: '1.5' }}>
                              {rev.review}
                            </p>
                          )}
                          {rev.images && rev.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              {rev.images.map((img, i) => (
                                <div key={i} style={{ width: '48px', height: '48px', borderRadius: '0.25rem', overflow: 'hidden' }}>
                                  <img src={normalizeImageUrl(img) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {user.reviews.length > 5 && (
                        <p style={{ fontSize: '0.8rem', color: colors.textSecondary, textAlign: 'center', margin: '0.25rem 0 0' }}>
                          + {user.reviews.length - 5} more review{user.reviews.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Tabbed Form */}
            <div className="mobile-profile-right">
              {/* Tabs + Edit / Submit controls */}
              <div className="mobile-tabs-bar" style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                backgroundColor: colors.bgCard,
                borderRadius: '16px 16px 0 0',
                borderBottom: `1px solid ${colors.borderPrimary}`,
                borderTop: `1px solid ${colors.borderPrimary}`,
                borderLeft: `1px solid ${colors.borderPrimary}`,
                borderRight: `1px solid ${colors.borderPrimary}`,
                marginBottom: 0,
                padding: '4px 12px 0',
              }}>
                <div className="mobile-tabs" style={{ display: 'flex', flex: 1, minWidth: 0, gap: 4 }}>
                  <button onClick={() => setActiveTab('overview')} style={tabStyle(activeTab === 'overview')}>
                    Overview
                  </button>
                  <button onClick={() => setActiveTab('portfolio')} style={tabStyle(activeTab === 'portfolio')}>
                    Portfolio
                  </button>
                  <button onClick={() => setActiveTab('experience')} style={tabStyle(activeTab === 'experience')}>
                    Working experience
                  </button>
                  <button onClick={() => setActiveTab('packages')} style={tabStyle(activeTab === 'packages')}>
                    Delivery packages
                  </button>
                </div>
                <div className="mobile-tabs-actions" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 4px',
                  flexShrink: 0,
                }}>
                  {/* Edit Toggle Switch */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px',
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: 9999,
                    background: isEditEnabled ? 'rgba(8,58,133,0.06)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 180ms',
                  }}>
                    <span style={{
                      fontSize: '0.82rem',
                      color: isEditEnabled ? '#083A85' : colors.textSecondary,
                      fontWeight: 600,
                    }}>{isEditEnabled ? 'Editing' : 'Edit'}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditEnabled(!isEditEnabled)}
                      aria-label="Toggle edit"
                      style={{
                        width: 36, height: 20, borderRadius: 9999, border: 'none',
                        cursor: 'pointer', position: 'relative',
                        backgroundColor: isEditEnabled ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                        transition: 'background-color 180ms',
                        padding: 0,
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        backgroundColor: '#fff',
                        position: 'absolute', top: 2,
                        left: isEditEnabled ? 18 : 2,
                        transition: 'left 180ms',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
                      }} />
                    </button>
                  </label>
                  {/* Save / Submit Button */}
                  {(() => {
                    const btnLabel = !isAccountAccepted
                      ? 'Submit profile'
                      : pendingChanges.length > 0
                      ? 'Submit changes'
                      : 'Save changes';
                    const btnSavingLabel = 'Saving…';
                    const enabled = isEditEnabled && !isSavingAll;
                    return (
                      <button
                        className="save-button-enhanced"
                        disabled={!enabled}
                        onClick={handleSaveAllChanges}
                        style={{
                          background: enabled ? '#083A85' : colors.bgTertiary,
                          color: enabled ? '#fff' : colors.textSecondary,
                          border: 'none',
                          borderRadius: 10,
                          padding: '9px 18px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: enabled ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', gap: 8,
                          opacity: enabled ? 1 : 0.55,
                          transition: 'all 180ms',
                          whiteSpace: 'nowrap',
                          boxShadow: enabled ? '0 6px 14px rgba(8,58,133,0.22)' : 'none',
                        }}
                      >
                        {isSavingAll && (
                          <span style={{
                            width: 14, height: 14,
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'ck-spin 0.8s linear infinite',
                          }} />
                        )}
                        {!isSavingAll && <i className="bi bi-check2" style={{ fontSize: 14 }} />}
                        {isSavingAll ? btnSavingLabel : btnLabel}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Tab Content */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0 0 16px 16px',
                padding: '24px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                borderRight: `1px solid ${colors.borderPrimary}`,
                borderBottom: `1px solid ${colors.borderPrimary}`,
                borderLeft: `1px solid ${colors.borderPrimary}`,
              }}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    {/* Basic Information */}
                    <div style={sectionTitleStyle}>
                      <span>Basic Information</span>
                    </div>
                    <div className="mobile-form-grid-2" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={labelStyle}>Preferred Username *</label>
                        <input
                          type="text"
                          value={basicInfo.fullName}
                          onChange={(e) => handleFullNameChange(e.target.value)}
                          disabled={!isEditEnabled}
                          placeholder="e.g. Joe Photocuts — the name clients know you by"
                          style={validationErrors.fullName ? inputErrorStyle : inputStyle}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #94a3b8)', marginTop: '0.25rem', display: 'block' }}>
                          Your working/viral name as known by clients. Real legal names are not required.
                        </span>
                        {validationErrors.fullName && (
                          <span style={errorMessageStyle}>{validationErrors.fullName}</span>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input
                          type="email"
                          value={basicInfo.email}
                          disabled
                          style={{ ...inputStyle, backgroundColor: colors.bgTertiary, cursor: 'not-allowed', opacity: 0.7 }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <CountrySelect
                            countries={eastAfricanCountries}
                            value={basicInfo.phoneCode}
                            onChange={(val) => setBasicInfo(prev => ({ ...prev, phoneCode: val }))}
                            valueKey="code"
                            displayKey="code"
                            disabled={!isEditEnabled}
                            inputStyle={selectStyle}
                            colors={colors}
                            actualTheme={actualTheme}
                            width="140px"
                          />
                          <input
                            type="tel"
                            maxLength={15}
                            value={basicInfo.phoneNumber}
                            onChange={(e) => handlePhoneNumberChange(e.target.value)}
                            disabled={!isEditEnabled}
                            style={validationErrors.phoneNumber ? { ...inputErrorStyle, flex: 1 } : { ...inputStyle, flex: 1 }}
                          />
                        </div>
                        {validationErrors.phoneNumber && (
                          <span style={errorMessageStyle}>{validationErrors.phoneNumber}</span>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Specialty *</label>
                        <select
                          value={basicInfo.specialty}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, specialty: e.target.value as 'Photographer' | 'Videographer' }))}
                          disabled={!isEditEnabled}
                          style={selectStyle}
                        >
                          <option value="Photographer">Photographer</option>
                          <option value="Videographer">Videographer</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Location / Working Area</label>
                        <input
                          type="text"
                          value={basicInfo.address}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="e.g., Kigali, Rwanda"
                          disabled={!isEditEnabled}
                          style={inputStyle}
                        />
                      </div>
                    </div>


                    {/* Availability Days Section */}
                    <div style={sectionTitleStyle}>
                      <span>Availability Days</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      Set your available hours for each day of the week
                    </p>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      marginBottom: '2rem'
                    }}>
                      {daysOfWeek.map((day) => {
                        const dayAvailability = basicInfo.availability?.[day] || defaultAvailability[day];
                        return (
                          <div
                            key={day}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              padding: '0.75rem 1rem',
                              backgroundColor: dayAvailability.enabled ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgTertiary,
                              borderRadius: '0.5rem',
                              border: dayAvailability.enabled ? `2px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : `2px solid ${colors.borderPrimary}`,
                              transition: 'all 0.2s'
                            }}
                          >
                            {/* Day Toggle */}
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              minWidth: '140px',
                              cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                              opacity: isEditEnabled ? 1 : 0.7
                            }}>
                              <input
                                type="checkbox"
                                checked={dayAvailability.enabled}
                                disabled={!isEditEnabled}
                                onChange={(e) => setBasicInfo(prev => ({
                                  ...prev,
                                  availability: {
                                    ...prev.availability,
                                    [day]: { ...prev.availability[day], enabled: e.target.checked }
                                  }
                                }))}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  accentColor: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                                  cursor: isEditEnabled ? 'pointer' : 'not-allowed'
                                }}
                              />
                              <span style={{
                                fontWeight: '600',
                                color: dayAvailability.enabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                                fontSize: '0.95rem'
                              }}>
                                {day}
                              </span>
                            </label>

                            {/* Time Range */}
                            {dayAvailability.enabled ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                <select
                                  value={dayAvailability.startTime}
                                  disabled={!isEditEnabled}
                                  onChange={(e) => setBasicInfo(prev => ({
                                    ...prev,
                                    availability: {
                                      ...prev.availability,
                                      [day]: { ...prev.availability[day], startTime: e.target.value }
                                    }
                                  }))}
                                  style={{ ...selectStyle, flex: 1, padding: '0.5rem 0.75rem' }}
                                >
                                  {timeOptions.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                                <span style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>to</span>
                                <select
                                  value={dayAvailability.endTime}
                                  disabled={!isEditEnabled}
                                  onChange={(e) => setBasicInfo(prev => ({
                                    ...prev,
                                    availability: {
                                      ...prev.availability,
                                      [day]: { ...prev.availability[day], endTime: e.target.value }
                                    }
                                  }))}
                                  style={{ ...selectStyle, flex: 1, padding: '0.5rem 0.75rem' }}
                                >
                                  {timeOptions.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span style={{
                                color: colors.textTertiary,
                                fontSize: '0.875rem',
                                fontStyle: 'italic'
                              }}>
                                Not available
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Save Availability Button */}
                    {isEditEnabled && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button
                          onClick={handleSaveAvailability}
                          disabled={isSavingAvailability}
                          style={{
                            backgroundColor: isSavingAvailability ? '#6B7280' : '#083A85',
                            color: 'white',
                            border: '2px solid #062a63',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: isSavingAvailability ? 'not-allowed' : 'pointer',
                            opacity: isSavingAvailability ? 0.7 : 1,
                          }}
                        >
                          {isSavingAvailability ? 'Saving...' : 'Save Availability'}
                        </button>
                      </div>
                    )}

                    {/* About section removed per product request */}

                    {/* Specialties */}
                    <div style={sectionTitleStyle}>
                      <span>Specialties *{renderPendingBadge('specialties')}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      Select the categories that best describe your photography services (select at least 2)
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '2rem'
                    }}>
                      {availableSpecialties.map((s) => {
                        const isSelected = overviewData.specialties.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => isEditEnabled && toggleSpecialty(s.id)}
                            disabled={!isEditEnabled}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '2rem',
                              border: isSelected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                              backgroundColor: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                              color: isSelected ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              transition: 'all 0.2s',
                              opacity: isEditEnabled ? 1 : 0.7
                            }}
                          >
                            {isSelected && <CheckIcon />}
                            {s.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Equipment section removed per product request */}
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div>
                    {/* Beliefs / Philosophy section removed per product request */}
                    {/* Skills section removed per product request */}
                    {/* Education & Certifications section removed per product request */}
                    {/* Training & Workshops section removed per product request */}
                    {/* Featured Projects */}
                    <div style={sectionTitleStyle}>
                      <span>Featured Projects{renderPendingBadge('projects')}</span>
                      <button
                        onClick={addProject}
                        disabled={!isEditEnabled}
                        style={{
                          backgroundColor: isEditEnabled ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgTertiary,
                          color: isEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                          border: `1px solid ${isEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.borderPrimary}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          opacity: isEditEnabled ? 1 : 0.6
                        }}
                      >
                        <PlusIcon /> Add Project
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      Showcase your best work with images and descriptions
                    </p>

                    {/* Hidden file input for project images */}
                    <input
                      type="file"
                      ref={projectImageInputRef}
                      onChange={handleProjectImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    <div className="mobile-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      {portfolioData.projects.map((project) => (
                        <div key={project.id} style={{
                          backgroundColor: colors.bgTertiary,
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          border: `2px solid ${colors.borderPrimary}`
                        }}>
                          {/* Project Image */}
                          <div
                            onClick={() => {
                              setEditingProjectId(project.id);
                              projectImageInputRef.current?.click();
                            }}
                            style={{
                              height: '160px',
                              position: 'relative',
                              backgroundColor: project.image ? 'transparent' : (actualTheme === 'dark' ? '#374151' : '#E5E7EB'),
                              backgroundImage: project.image ? `url(${project.image})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'opacity 0.2s',
                              border: project.image ? 'none' : `2px dashed ${actualTheme === 'dark' ? '#6B7280' : '#9CA3AF'}`,
                              margin: project.image ? '0' : '0.5rem',
                              borderRadius: project.image ? '0' : '0.5rem',
                              overflow: 'hidden'
                            }}
                          >
                            {!project.image && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: colors.textTertiary
                              }}>
                                <ImageIcon />
                                <span style={{ fontSize: '0.85rem' }}>Click to upload image</span>
                              </div>
                            )}
                            {project.image && (
                              <div
                                className="project-image-overlay"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                              >
                                <span style={{ color: 'white', fontSize: '0.85rem' }}>Change image</span>
                              </div>
                            )}
                          </div>

                          {/* Project Details */}
                          <div style={{ padding: '1rem' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Project Title</label>
                              <input
                                type="text"
                                value={project.title}
                                onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                                placeholder="e.g., Wedding at Serena Hotel"
                                style={{ ...inputStyle, fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                              />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Year</label>
                              <select
                                value={project.year}
                                onChange={(e) => updateProject(project.id, 'year', e.target.value)}
                                style={{ ...inputStyle, fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                              >
                                <option value="">Select Year</option>
                                {yearOptions.map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Description</label>
                              <textarea
                                value={project.description}
                                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                placeholder="Brief description of the project..."
                                rows={2}
                                style={{ ...inputStyle, fontSize: '0.9rem', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                              />
                            </div>
                            {/* Delete Button */}
                            <button
                              onClick={() => removeProject(project.id)}
                              style={{
                                width: '100%',
                                marginTop: '1rem',
                                padding: '0.5rem',
                                backgroundColor: 'transparent',
                                border: `2px solid ${colors.borderPrimary}`,
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                color: colors.textTertiary,
                                fontSize: '0.85rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE2E2';
                                e.currentTarget.style.borderColor = '#EF4444';
                                e.currentTarget.style.color = '#EF4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = colors.borderPrimary;
                                e.currentTarget.style.color = colors.textTertiary;
                              }}
                              title="Remove project"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Remove Project
                            </button>
                            {/* Save Button */}
                            <button
                              onClick={async () => {
                                const success = await addProjectToAPI(project);
                                showToast(success ? 'success' : 'error',
                                  success ? 'Project saved successfully' : 'Failed to save project');
                              }}
                              disabled={savingProject === project.id || !project.title}
                              style={{
                                width: '100%',
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: savingProject === project.id ? '#9CA3AF' : '#083A85',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: savingProject === project.id || !project.title ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                opacity: !project.title ? 0.5 : 1,
                              }}
                            >
                              {savingProject === project.id ? 'Saving...' : 'Save Project'}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Pending projects from admin review */}
                      {getFieldPendingChanges('projects').filter(c => c.changeType === 'ADD' && c.payload).map((change) => {
                        const data = (() => { try { return JSON.parse(change.payload || '{}'); } catch { return {}; } })();
                        const imgUrl = change.imageData ? `https://backend.connekyt.com/uploads/photographer/projects/images/${change.imageData}` : '';
                        return (
                          <div key={change.id} style={{
                            backgroundColor: colors.bgTertiary,
                            borderRadius: '0.75rem',
                            overflow: 'hidden',
                            border: `2px solid ${actualTheme === 'dark' ? '#92400E' : '#FDE68A'}`,
                            opacity: 0.85,
                            position: 'relative',
                          }}>
                            <div style={{
                              height: '160px',
                              backgroundColor: imgUrl ? 'transparent' : (actualTheme === 'dark' ? '#374151' : '#E5E7EB'),
                              backgroundImage: imgUrl ? `url(${imgUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {!imgUrl && <ImageIcon />}
                            </div>
                            <div style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary, margin: 0, flex: 1 }}>{data.title || 'Untitled'}</h4>
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: '700', padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px', backgroundColor: '#e68a00', color: 'white',
                                  whiteSpace: 'nowrap',
                                }}>Pending</span>
                              </div>
                              {data.year && <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.25rem' }}>{data.year}</p>}
                              {data.description && <p style={{ fontSize: '0.8rem', color: colors.textSecondary, margin: 0, lineHeight: '1.4' }}>{data.description.length > 80 ? data.description.slice(0, 80) + '...' : data.description}</p>}
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty state */}
                      {portfolioData.projects.length === 0 && getFieldPendingChanges('projects').length === 0 && (
                        <div style={{
                          gridColumn: 'span 2',
                          textAlign: 'center',
                          padding: '3rem',
                          backgroundColor: colors.bgTertiary,
                          borderRadius: '0.75rem',
                          border: '2px dashed #E5E7EB'
                        }}>
                          <div style={{ color: '#9CA3AF', marginBottom: '1rem' }}>
                            <ImageIcon />
                          </div>
                          <p style={{ color: colors.textSecondary, marginBottom: '1rem' }}>
                            No projects added yet. Showcase your best work!
                          </p>
                          <button
                            onClick={addProject}
                            disabled={!isEditEnabled}
                            style={{
                              backgroundColor: isEditEnabled ? '#083A85' : colors.bgTertiary,
                              color: isEditEnabled ? 'white' : colors.textSecondary,
                              border: isEditEnabled ? 'none' : `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.5rem',
                              padding: '0.75rem 1.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              opacity: isEditEnabled ? 1 : 0.6
                            }}
                          >
                            <PlusIcon /> Add Your First Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                  <div>
                    <div style={sectionTitleStyle}>
                      <span>Work Experience{renderPendingBadge('workExperiences')}</span>
                      <button
                        onClick={addExperience}
                        disabled={!isEditEnabled}
                        style={{
                          backgroundColor: isEditEnabled ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgTertiary,
                          color: isEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                          border: `1px solid ${isEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.borderPrimary}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          opacity: isEditEnabled ? 1 : 0.6
                        }}
                      >
                        <PlusIcon /> Add Experience
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
                      Add your relevant work experience to showcase your professional background
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {experienceData.experiences.map((exp) => (
                        <div key={exp.id} style={{
                          backgroundColor: colors.bgTertiary,
                          padding: '1.5rem',
                          borderRadius: '0.75rem',
                          border: `2px solid ${colors.borderPrimary}`,
                          position: 'relative',
                          ...(newlyAddedId === exp.id ? newItemAnimation : {})
                        }}>
                          <button
                            onClick={() => removeExperience(exp.id)}
                            style={{
                              position: 'absolute',
                              top: '0.75rem',
                              right: '0.75rem',
                              padding: '0.5rem',
                              backgroundColor: 'transparent',
                              border: `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: colors.textTertiary,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                              e.currentTarget.style.borderColor = '#EF4444';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = colors.borderPrimary;
                              e.currentTarget.style.color = colors.textTertiary;
                            }}
                            title="Remove experience"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem', paddingRight: '2.5rem' }}>
                            <div>
                              <label style={labelStyle}>Position/Title *</label>
                              <input
                                type="text"
                                value={exp.position}
                                onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                                placeholder="e.g., Lead Wedding Photographer"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Company/Organization *</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                placeholder="e.g., Elite Studios"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Location</label>
                              <input
                                type="text"
                                value={exp.location}
                                onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                placeholder="e.g., Kigali, Rwanda"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Duration</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select
                                  value={exp.startDate}
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                  style={{ ...inputStyle, flex: 1 }}
                                >
                                  <option value="">Start Year</option>
                                  {yearOptions.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                                <span style={{ color: colors.textSecondary }}>to</span>
                                <select
                                  value={exp.endDate}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  style={{ ...inputStyle, flex: 1 }}
                                >
                                  <option value="">End Year</option>
                                  {yearOptionsWithPresent.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label style={labelStyle}>Description</label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                              placeholder="Describe your responsibilities, achievements, and key projects..."
                              rows={3}
                              style={{ ...inputStyle, resize: 'vertical' }}
                            />
                          </div>

                          {/* Save Experience Button */}
                          {isEditEnabled && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                              <button
                                onClick={() => saveExperienceToAPI(exp)}
                                disabled={savingExperience === exp.id || !exp.position || !exp.company}
                                style={{
                                  backgroundColor: (savingExperience === exp.id || !exp.position || !exp.company) ? '#9CA3AF' : '#083A85',
                                  color: 'white', border: 'none', borderRadius: '0.5rem',
                                  padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: '600',
                                  cursor: (savingExperience === exp.id || !exp.position || !exp.company) ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}
                              >
                                {savingExperience === exp.id ? 'Saving...' : 'Save Experience'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Pending work experience items */}
                      {getPendingAddItems('workExperiences').map((item) => (
                        <div key={item._pendingId} style={{
                          padding: '1rem', backgroundColor: colors.bgTertiary,
                          borderRadius: '0.75rem', border: `2px solid ${actualTheme === 'dark' ? '#92400E' : '#FDE68A'}`, opacity: 0.85,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.textPrimary }}>{item.position || 'Position'}</div>
                            <div style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{item.company || ''}{item.location ? ` · ${item.location}` : ''}</div>
                            {item.startDate && <div style={{ fontSize: '0.75rem', color: colors.textTertiary }}>{item.startDate}{item.endDate ? ` - ${item.endDate}` : ' - Present'}</div>}
                          </div>
                          <span style={pendingTagStyle}>Pending</span>
                        </div>
                      ))}

                      {experienceData.experiences.length === 0 && getPendingAddItems('workExperiences').length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '3rem',
                          backgroundColor: colors.bgTertiary,
                          borderRadius: '0.75rem',
                          border: '2px dashed #E5E7EB'
                        }}>
                          <p style={{ color: colors.textSecondary, marginBottom: '1rem' }}>
                            No work experience added yet
                          </p>
                          <button
                            onClick={addExperience}
                            disabled={!isEditEnabled}
                            style={{
                              backgroundColor: isEditEnabled ? '#083A85' : colors.bgTertiary,
                              color: isEditEnabled ? 'white' : colors.textSecondary,
                              border: isEditEnabled ? 'none' : `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.5rem',
                              padding: '0.75rem 1.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              opacity: isEditEnabled ? 1 : 0.6
                            }}
                          >
                            <PlusIcon /> Add Your First Experience
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Packages Tab */}
                {activeTab === 'packages' && (
                  <div>
                    {/* Edit Toggle for Packages */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, flex: 1, lineHeight: '1.5' }}>
                        Create and manage your delivery packages. Toggle edit mode to make changes.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                        <div
                          onClick={() => setIsPackageEditEnabled(!isPackageEditEnabled)}
                          style={{
                            width: '48px', height: '26px', borderRadius: '13px',
                            backgroundColor: isPackageEditEnabled ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                            cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s',
                          }}
                        >
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            backgroundColor: 'white', position: 'absolute', top: '2px',
                            left: isPackageEditEnabled ? '24px' : '2px', transition: 'left 0.2s',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.85rem', fontWeight: '600',
                          color: isPackageEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : '#6B7280'
                        }}>
                          {isPackageEditEnabled ? 'Editing' : 'Edit'}
                        </span>
                      </div>
                    </div>

                    <div style={{ position: 'relative', opacity: isPackageEditEnabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                    {!isPackageEditEnabled && <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'not-allowed' }} />}

                    {/* Your Packages Section */}
                    <div style={sectionTitleStyle}>
                      <span>Your Packages</span>
                      <button
                        onClick={addPackage}
                        disabled={!isPackageEditEnabled || packages.length >= 3}
                        style={{
                          backgroundColor: (isPackageEditEnabled && packages.length < 3) ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgTertiary,
                          color: (isPackageEditEnabled && packages.length < 3) ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                          border: `1px solid ${(isPackageEditEnabled && packages.length < 3) ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.borderPrimary}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: (isPackageEditEnabled && packages.length < 3) ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          opacity: (isPackageEditEnabled && packages.length < 3) ? 1 : 0.6
                        }}
                      >
                        <PlusIcon /> Add Package {packages.length > 0 ? `(${3 - packages.length} left)` : ''}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1.5rem' }}>
                      Create and customize your delivery packages with pricing, duration, and features
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {packages.map((pkg) => (
                        <div key={pkg.id} style={{
                          backgroundColor: colors.bgTertiary,
                          padding: '1.5rem',
                          borderRadius: '0.75rem',
                          border: `2px solid ${colors.borderPrimary}`,
                          position: 'relative',
                          ...(newlyAddedId === pkg.id ? newItemAnimation : {})
                        }}>
                          {/* Collapse/Expand Header */}
                          <div
                            onClick={() => setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.5rem',
                                backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                              <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                                  {pkg.packageName || 'New Package'}
                                </h3>
                                {pkg.price && (
                                  <span style={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                                    {parseFloat(pkg.price).toLocaleString()} {currencies.find(c => c.id === pkg.currencyId || c.code === pkg.currencyId)?.code || pkg.currencyId} · {pkg.priceUnit}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: pkg.isActive ? '#10B981' : '#EF4444'
                              }} />
                              {isPackageEditEnabled && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); removePackage(pkg.id); }}
                                  style={{
                                    padding: '0.35rem', backgroundColor: 'transparent',
                                    border: `1.5px solid ${colors.borderPrimary}`, borderRadius: '0.3rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: colors.textTertiary, transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textTertiary; }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                              )}
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: expandedPackageId === pkg.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                <path d="M6 9L12 15L18 9" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>

                          {/* Expanded Form Content */}
                          {expandedPackageId === pkg.id && (
                            <div style={{ marginTop: '1.5rem', borderTop: `2px solid ${colors.borderPrimary}`, paddingTop: '1.5rem' }}>
                              {/* Row 1: Package Name + Active toggle */}
                              <div className="mobile-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
                                <div>
                                  <label style={labelStyle}>Package Name *</label>
                                  <select value={pkg.packageName}
                                    onChange={(e) => updatePackage(pkg.id, 'packageName', e.target.value)}
                                    disabled={!isPackageEditEnabled} style={pkgSelectStyle}>
                                    <option value="">Select a package</option>
                                    {['Silver', 'Gold', 'Diamond']
                                      .filter(name => name === pkg.packageName || !packages.some(p => p.id !== pkg.id && p.packageName === name))
                                      .map(name => (
                                        <option key={name} value={name}>{name}</option>
                                      ))}
                                  </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: colors.textPrimary }}>Active</label>
                                    <div
                                      onClick={() => isPackageEditEnabled && updatePackage(pkg.id, 'isActive', !pkg.isActive)}
                                      style={{
                                        width: '44px', height: '24px', borderRadius: '12px',
                                        backgroundColor: pkg.isActive ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                                        cursor: isPackageEditEnabled ? 'pointer' : 'not-allowed',
                                        position: 'relative', transition: 'background-color 0.2s',
                                      }}
                                    >
                                      <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        backgroundColor: 'white', position: 'absolute', top: '2px',
                                        left: pkg.isActive ? '22px' : '2px', transition: 'left 0.2s',
                                      }} />
                                    </div>
                                  </div>
                                  {pkg.packageName === 'Diamond' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backgroundColor: actualTheme === 'dark' ? '#4C1D9520' : '#F5F3FF', border: `1px solid ${actualTheme === 'dark' ? '#A78BFA30' : '#DDD6FE'}` }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill={actualTheme === 'dark' ? '#A78BFA' : '#7C3AED'}><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93a10 10 0 0 1 14.14 0" stroke={actualTheme === 'dark' ? '#A78BFA' : '#7C3AED'} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M7.76 7.76a6 6 0 0 1 8.48 0" stroke={actualTheme === 'dark' ? '#A78BFA' : '#7C3AED'} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                                      <span style={{ fontSize: '0.7rem', fontWeight: '600', color: actualTheme === 'dark' ? '#A78BFA' : '#7C3AED' }}>Live Stream</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: Price + Currency + Price Unit + Duration */}
                              <div className="mobile-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                  <label style={labelStyle}>Price *</label>
                                  <input type="number" min="0" value={pkg.price}
                                    onChange={(e) => updatePackage(pkg.id, 'price', e.target.value)}
                                    placeholder="Enter price" disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Currency *</label>
                                  {(() => {
                                    const allOpts = currencies.length > 0
                                      ? currencies.map(c => ({ val: c.id, code: c.code, name: c.name }))
                                      : [{ val: 'USD', code: 'USD', name: '' }, { val: 'RWF', code: 'RWF', name: '' }, { val: 'EUR', code: 'EUR', name: '' }, { val: 'GBP', code: 'GBP', name: '' }, { val: 'KES', code: 'KES', name: '' }];
                                    const selectedCode = allOpts.find(o => o.val === pkg.currencyId || o.code === pkg.currencyId)?.code || '';
                                    const isDropdownOpen = openCurrencyPkgId === pkg.id;
                                    return (
                                      <div ref={(el) => { currencyDropdownRefs.current[pkg.id] = el; }} style={{ position: 'relative' }}>
                                        <button type="button" disabled={!isPackageEditEnabled} onClick={() => isPackageEditEnabled && setOpenCurrencyPkgId(isDropdownOpen ? null : pkg.id)}
                                          style={{ ...pkgSelectStyle, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: isPackageEditEnabled ? 'pointer' : 'not-allowed', opacity: isPackageEditEnabled ? 1 : 0.6, width: '100%', textAlign: 'left' }}>
                                          {CURRENCY_FLAG_MAP[selectedCode] && <img src={`https://flagcdn.com/w40/${CURRENCY_FLAG_MAP[selectedCode]}.png`} alt="" style={{ width: '18px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />}
                                          <span style={{ flex: 1 }}>{selectedCode || 'Select'}</span>
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                                            <path d="M6 9L12 15L18 9" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </button>
                                        {isDropdownOpen && (
                                          <div style={{ position: 'absolute', top: 'calc(100% + 0.35rem)', left: 0, backgroundColor: colors.bgSecondary, borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `2px solid ${colors.borderPrimary}`, padding: '0.4rem', minWidth: '200px', zIndex: 100 }}>
                                            {allOpts.map(opt => {
                                              const flag = CURRENCY_FLAG_MAP[opt.code] || '';
                                              const isSelected = pkg.currencyId === opt.val || pkg.currencyId === opt.code;
                                              return (
                                                <button key={opt.val} type="button" onClick={() => { updatePackage(pkg.id, 'currencyId', opt.val); setOpenCurrencyPkgId(null); }}
                                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', border: 'none', background: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent', color: colors.textPrimary, fontSize: '0.85rem', fontWeight: isSelected ? '600' : '400', cursor: 'pointer', gap: '0.5rem' }}
                                                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = colors.bgTertiary; }}
                                                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {flag && <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />}
                                                    <span style={{ fontWeight: '600' }}>{opt.code}</span>
                                                    {opt.name && <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>{opt.name}</span>}
                                                  </div>
                                                  {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke={actualTheme === 'dark' ? '#60A5FA' : '#083A85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div>
                                  <label style={labelStyle}>Price Unit *</label>
                                  <select value={pkg.priceUnit}
                                    onChange={(e) => updatePackage(pkg.id, 'priceUnit', e.target.value)}
                                    disabled={!isPackageEditEnabled} style={pkgSelectStyle}>
                                    <option value="per event">Per Event</option>
                                    <option value="per hour">Per Hour</option>
                                    <option value="per day">Per Day</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Duration (hours) *</label>
                                  <input type="number" min="0" value={pkg.durationHours}
                                    onChange={(e) => updatePackage(pkg.id, 'durationHours', e.target.value)}
                                    placeholder="e.g., 4" disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                </div>
                              </div>

                              {/* Time Delivery */}
                              <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Time Delivery (days) *</label>
                                <p style={{ fontSize: '0.75rem', color: colors.textTertiary, margin: '0 0 0.5rem 0' }}>
                                  {pkg.packageName === 'Diamond' ? 'Diamond should have the fastest delivery time.' : pkg.packageName === 'Gold' ? 'Must be faster than Silver but slower than Diamond.' : pkg.packageName === 'Silver' ? 'Silver has the longest delivery time.' : 'Set the number of days for photo delivery.'}
                                </p>
                                <input type="number" min="1" value={pkg.deliveryDays}
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    updatePackage(pkg.id, 'deliveryDays', newVal);
                                  }}
                                  placeholder={pkg.packageName === 'Diamond' ? 'e.g., 3' : pkg.packageName === 'Gold' ? 'e.g., 7' : pkg.packageName === 'Silver' ? 'e.g., 14' : 'e.g., 7'}
                                  disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                {/* Validation warning */}
                                {(() => {
                                  const days = parseInt(pkg.deliveryDays) || 0;
                                  if (days <= 0) return null;
                                  const premiumPkg = packages.find(p => p.packageName === 'Diamond');
                                  const customPkg = packages.find(p => p.packageName === 'Gold');
                                  const essentialPkg = packages.find(p => p.packageName === 'Silver');
                                  const premiumDays = parseInt(premiumPkg?.deliveryDays || '0') || 0;
                                  const customDays = parseInt(customPkg?.deliveryDays || '0') || 0;
                                  const essentialDays = parseInt(essentialPkg?.deliveryDays || '0') || 0;

                                  if (pkg.packageName === 'Diamond') {
                                    if (customDays > 0 && days >= customDays) return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Diamond delivery must be faster (fewer days) than Gold ({customDays} days)</p>;
                                    if (essentialDays > 0 && days >= essentialDays) return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Diamond delivery must be faster (fewer days) than Silver ({essentialDays} days)</p>;
                                  }
                                  if (pkg.packageName === 'Gold') {
                                    if (premiumDays > 0 && days <= premiumDays) return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Gold delivery must be slower (more days) than Diamond ({premiumDays} days)</p>;
                                    if (essentialDays > 0 && days >= essentialDays) return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Gold delivery must be faster (fewer days) than Silver ({essentialDays} days)</p>;
                                  }
                                  if (pkg.packageName === 'Silver') {
                                    if (customDays > 0 && days <= customDays) return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Silver delivery must be slower (more days) than Gold ({customDays} days)</p>;
                                    if (premiumDays > 0 && days <= premiumDays) return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.35rem 0 0 0' }}>Silver delivery must be slower (more days) than Diamond ({premiumDays} days)</p>;
                                  }
                                  return null;
                                })()}
                              </div>

                              {/* Row 3: Description */}
                              <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea value={pkg.description}
                                  onChange={(e) => updatePackage(pkg.id, 'description', e.target.value)}
                                  placeholder="Describe what this package includes..."
                                  rows={3} disabled={!isPackageEditEnabled}
                                  style={{ ...pkgInputStyle, resize: 'vertical' as const }} />
                              </div>

                              {/* Photobook & Media Section */}
                              {pkg.packageName && (
                                <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: actualTheme === 'dark' ? 'rgba(139,92,246,0.05)' : '#FAFAFE', borderRadius: '0.625rem', border: `1px solid ${actualTheme === 'dark' ? 'rgba(139,92,246,0.15)' : '#EDE9FE'}` }}>
                                  <label style={{ ...labelStyle, fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={actualTheme === 'dark' ? '#A78BFA' : '#7C3AED'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    Photobook & Media
                                  </label>

                                  {/* Included counts — all packages */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div>
                                      <label style={{ ...labelStyle, fontSize: '0.78rem', color: colors.textSecondary }}>Photos included</label>
                                      <input type="number" min="0" value={pkg.includedPhotos}
                                        onChange={(e) => updatePackage(pkg.id, 'includedPhotos', e.target.value)}
                                        placeholder={pkg.packageName === 'Diamond' ? 'e.g. 500' : 'e.g. 100'} disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                    </div>
                                    <div>
                                      <label style={{ ...labelStyle, fontSize: '0.78rem', color: colors.textSecondary }}>Videos included</label>
                                      <input type="number" min="0" value={pkg.includedVideos}
                                        onChange={(e) => updatePackage(pkg.id, 'includedVideos', e.target.value)}
                                        placeholder={pkg.packageName === 'Diamond' ? 'e.g. 20' : 'e.g. 5'} disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                    </div>
                                  </div>
                                  {/* Validation: Diamond must have more than other packages */}
                                  {pkg.packageName === 'Diamond' && (() => {
                                    const premPhotos = parseInt(pkg.includedPhotos) || 0;
                                    const premVideos = parseInt(pkg.includedVideos) || 0;
                                    const customPkg = packages.find(p => p.packageName === 'Gold');
                                    const essentialPkg = packages.find(p => p.packageName === 'Silver');
                                    const customPhotos = parseInt(customPkg?.includedPhotos || '0') || 0;
                                    const essentialPhotos = parseInt(essentialPkg?.includedPhotos || '0') || 0;
                                    const customVideos = parseInt(customPkg?.includedVideos || '0') || 0;
                                    const essentialVideos = parseInt(essentialPkg?.includedVideos || '0') || 0;
                                    const warnings: string[] = [];
                                    if (premPhotos > 0 && customPhotos > 0 && premPhotos <= customPhotos) warnings.push(`Diamond photos (${premPhotos}) must be more than Gold (${customPhotos})`);
                                    if (premPhotos > 0 && essentialPhotos > 0 && premPhotos <= essentialPhotos) warnings.push(`Diamond photos (${premPhotos}) must be more than Silver (${essentialPhotos})`);
                                    if (premVideos > 0 && customVideos > 0 && premVideos <= customVideos) warnings.push(`Diamond videos (${premVideos}) must be more than Gold (${customVideos})`);
                                    if (premVideos > 0 && essentialVideos > 0 && premVideos <= essentialVideos) warnings.push(`Diamond videos (${premVideos}) must be more than Silver (${essentialVideos})`);
                                    return warnings.length > 0 ? <div style={{ marginBottom: '0.5rem' }}>{warnings.map((w, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.2rem 0 0 0' }}>{w}</p>)}</div> : null;
                                  })()}
                                  {pkg.packageName === 'Gold' && (() => {
                                    const photos = parseInt(pkg.includedPhotos) || 0;
                                    const videos = parseInt(pkg.includedVideos) || 0;
                                    const premiumPkg = packages.find(p => p.packageName === 'Diamond');
                                    const essentialPkg = packages.find(p => p.packageName === 'Silver');
                                    const premPhotos = parseInt(premiumPkg?.includedPhotos || '0') || 0;
                                    const essentialPhotos = parseInt(essentialPkg?.includedPhotos || '0') || 0;
                                    const premVideos = parseInt(premiumPkg?.includedVideos || '0') || 0;
                                    const essentialVideos = parseInt(essentialPkg?.includedVideos || '0') || 0;
                                    const warnings: string[] = [];
                                    if (photos > 0 && premPhotos > 0 && photos >= premPhotos) warnings.push(`Gold photos (${photos}) must be less than Diamond (${premPhotos})`);
                                    if (photos > 0 && essentialPhotos > 0 && photos <= essentialPhotos) warnings.push(`Gold photos (${photos}) must be more than Silver (${essentialPhotos})`);
                                    if (videos > 0 && premVideos > 0 && videos >= premVideos) warnings.push(`Gold videos (${videos}) must be less than Diamond (${premVideos})`);
                                    if (videos > 0 && essentialVideos > 0 && videos <= essentialVideos) warnings.push(`Gold videos (${videos}) must be more than Silver (${essentialVideos})`);
                                    return warnings.length > 0 ? <div style={{ marginBottom: '0.5rem' }}>{warnings.map((w, i) => <p key={i} style={{ fontSize: '0.75rem', color: '#EF4444', margin: '0.2rem 0 0 0' }}>{w}</p>)}</div> : null;
                                  })()}

                                  {/* Printed photobook limit */}
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ ...labelStyle, fontSize: '0.78rem', color: colors.textSecondary }}>Printed photobook photos</label>
                                    <input type="number" min="0" value={pkg.photobookPhotos}
                                      onChange={(e) => updatePackage(pkg.id, 'photobookPhotos', e.target.value)}
                                      placeholder={pkg.packageName === 'Diamond' ? 'e.g. 50' : 'e.g. 20'} disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                    <span style={{ fontSize: '0.7rem', color: colors.textSecondary, marginTop: '0.25rem', display: 'block' }}>
                                      Number of photos the client can select for their printed photo album. Extra selections will be charged per photo.
                                    </span>
                                  </div>

                                  {/* Extra photo/video pricing */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                      <label style={{ ...labelStyle, fontSize: '0.78rem', color: colors.textSecondary }}>Price per extra photo</label>
                                      <input type="number" min="0" value={pkg.extraPhotoPrice}
                                        onChange={(e) => updatePackage(pkg.id, 'extraPhotoPrice', e.target.value)}
                                        placeholder="e.g. 500" disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                    </div>
                                    <div>
                                      <label style={{ ...labelStyle, fontSize: '0.78rem', color: colors.textSecondary }}>Price per extra video</label>
                                      <input type="number" min="0" value={pkg.extraVideoPrice}
                                        onChange={(e) => updatePackage(pkg.id, 'extraVideoPrice', e.target.value)}
                                        placeholder="e.g. 1000" disabled={!isPackageEditEnabled} style={pkgInputStyle} />
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: colors.textSecondary, marginTop: '0.4rem', display: 'block' }}>
                                    Set the price clients pay for each additional photo or video beyond the included amount in their photobook.
                                  </span>
                                </div>
                              )}

                              {/* Row 4: Features */}
                              <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Included Features</label>
                                {pkg.packageName ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {/* Selectable features for this package tier */}
                                    {(SELECTABLE_FEATURES[pkg.packageName] || []).map((feature) => {
                                      const isChecked = pkg.features.some(f => f.featureName === feature && f.isIncluded);
                                      return (
                                        <div key={feature}
                                          onClick={() => {
                                            if (!isPackageEditEnabled) return;
                                            const existing = pkg.features.find(f => f.featureName === feature);
                                            if (existing) {
                                              setPackages(prev => prev.map(p => p.id !== pkg.id ? p : {
                                                ...p, features: p.features.map(f => f.featureName === feature ? { ...f, isIncluded: !f.isIncluded } : f)
                                              }));
                                            } else {
                                              setPackages(prev => prev.map(p => p.id !== pkg.id ? p : {
                                                ...p, features: [...p.features, { id: String(Date.now()), featureName: feature, isIncluded: true, displayOrder: p.features.length + 1 }]
                                              }));
                                            }
                                          }}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: isChecked ? colors.bgTertiary : (actualTheme === 'dark' ? 'rgba(75,85,99,0.2)' : 'rgba(0,0,0,0.03)'),
                                            borderRadius: '0.375rem',
                                            border: `1px solid ${isChecked ? colors.borderPrimary : 'transparent'}`,
                                            cursor: isPackageEditEnabled ? 'pointer' : 'default',
                                            opacity: isChecked ? 1 : 0.55,
                                            transition: 'all 0.15s',
                                          }}>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                            {isChecked
                                              ? <path d="M20 6L9 17L4 12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                              : <path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            }
                                          </svg>
                                          <span style={{ fontSize: '0.85rem', color: isChecked ? colors.textPrimary : colors.textSecondary, textDecoration: isChecked ? 'none' : 'line-through' }}>{feature}</span>
                                        </div>
                                      );
                                    })}
                                    {/* Features not available at this tier */}
                                    {ALL_FEATURES.filter(f => {
                                      return !(SELECTABLE_FEATURES[pkg.packageName] || []).includes(f);
                                    }).map((feature) => (
                                      <div key={feature} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.5rem 0.75rem',
                                        backgroundColor: actualTheme === 'dark' ? 'rgba(75,85,99,0.1)' : 'rgba(0,0,0,0.02)',
                                        borderRadius: '0.375rem',
                                        border: `1px solid transparent`,
                                        opacity: 0.35,
                                      }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                          <path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span style={{ fontSize: '0.85rem', color: colors.textSecondary, textDecoration: 'line-through' }}>{feature}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.8rem', color: colors.textSecondary, fontStyle: 'italic', margin: 0 }}>
                                    Select a package to see included features.
                                  </p>
                                )}
                              </div>

                              {/* Save Button (per package) */}
                              {isPackageEditEnabled && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => savePackageToAPI(pkg)}
                                    disabled={savingPackageId === pkg.id || !pkg.packageName}
                                    style={{
                                      backgroundColor: (savingPackageId === pkg.id || !pkg.packageName) ? '#9CA3AF' : '#083A85',
                                      color: 'white', border: 'none', borderRadius: '0.5rem',
                                      padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: '600',
                                      cursor: (savingPackageId === pkg.id || !pkg.packageName) ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    {savingPackageId === pkg.id ? (
                                      <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                                          <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <CheckIcon />
                                        Save Package
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {packages.length === 0 && (
                        <div style={{
                          textAlign: 'center', padding: '3rem',
                          backgroundColor: colors.bgTertiary, borderRadius: '0.75rem',
                          border: '2px dashed #E5E7EB'
                        }}>
                          <p style={{ color: colors.textSecondary, marginBottom: '1rem' }}>
                            No delivery packages created yet
                          </p>
                          <button onClick={addPackage} disabled={!isPackageEditEnabled}
                            style={{
                              backgroundColor: isPackageEditEnabled ? '#083A85' : colors.bgTertiary,
                              color: isPackageEditEnabled ? 'white' : colors.textSecondary,
                              border: isPackageEditEnabled ? 'none' : `2px solid ${colors.borderPrimary}`,
                              borderRadius: '0.5rem', padding: '0.75rem 1.5rem',
                              fontSize: '0.9rem', fontWeight: '500',
                              cursor: isPackageEditEnabled ? 'pointer' : 'not-allowed',
                              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                              opacity: isPackageEditEnabled ? 1 : 0.6
                            }}
                          >
                            <PlusIcon /> Create Your First Package
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Your Listed Packages Summary */}
                    {packages.filter(p => p.packageName).length > 0 && (
                      <div style={{ marginBottom: '2rem' }}>
                        <div style={sectionTitleStyle}>
                          <span>Your Listed Packages</span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                          gap: '1rem'
                        }}>
                          {packages.filter(p => p.packageName).sort((a, b) => (PACKAGE_TIER[a.packageName] ?? 99) - (PACKAGE_TIER[b.packageName] ?? 99)).map((pkg) => {
                            const tierColor = TIER_COLORS[pkg.packageName] || { bg: colors.bgTertiary, text: colors.textPrimary, border: colors.borderPrimary };
                            const currencyCode = currencies.find(c => c.id === pkg.currencyId || c.code === pkg.currencyId)?.code || 'RWF';
                            const includedFeatures = pkg.features.filter(f => f.featureName && f.isIncluded && f.featureName !== 'Same-day preview');
                            return (
                            <div key={pkg.id} style={{
                              backgroundColor: colors.bgCard,
                              borderRadius: '1rem',
                              padding: '0',
                              border: `1px solid ${actualTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              overflow: 'hidden',
                              boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)',
                            }}
                            onClick={() => setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              {/* Top accent bar */}
                              <div style={{ height: '4px', background: `linear-gradient(90deg, ${tierColor.border}, ${tierColor.border}80)` }} />

                              <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
                                {/* Header: name + tier badge */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                                    {pkg.packageName}
                                  </h4>
                                  {pkg.packageName && TIER_LABELS[pkg.packageName] && (
                                    <span style={{
                                      fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem',
                                      borderRadius: '1rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                                      backgroundColor: tierColor.bg,
                                      color: tierColor.text,
                                      border: `1px solid ${tierColor.border}30`,
                                    }}>
                                      {TIER_LABELS[pkg.packageName]}
                                    </span>
                                  )}
                                </div>

                                {/* Price */}
                                {pkg.price && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: '800', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', letterSpacing: '-0.02em' }}>
                                      {parseFloat(pkg.price).toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: colors.textSecondary, marginLeft: '0.35rem' }}>{currencyCode}</span>
                                  </div>
                                )}

                                {/* Duration */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: colors.textSecondary, backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', padding: '0.25rem 0.6rem', borderRadius: '1rem' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                    {pkg.durationHours || '0'} hours
                                  </span>
                                  {pkg.deliveryDays && parseInt(pkg.deliveryDays) > 0 && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: colors.textSecondary, backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', padding: '0.25rem 0.6rem', borderRadius: '1rem' }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      {pkg.deliveryDays}-day delivery
                                    </span>
                                  )}
                                </div>

                                {/* Media coverage */}
                                <p style={{ fontSize: '0.8rem', fontWeight: '600', color: pkg.packageName === 'Diamond' ? (actualTheme === 'dark' ? '#A78BFA' : '#7C3AED') : colors.textSecondary, marginBottom: '0.25rem' }}>
                                  {[pkg.includedPhotos ? `${pkg.includedPhotos} photos` : '', pkg.includedVideos ? `${pkg.includedVideos} videos` : ''].filter(Boolean).join(' · ') || 'Set photo/video count'}
                                </p>
                              </div>

                              {/* Features */}
                              {includedFeatures.length > 0 && (
                                <div style={{
                                  borderTop: `1px solid ${actualTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                  padding: '0.75rem 1.25rem',
                                  display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1,
                                  backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                                }}>
                                  {includedFeatures.map((f, idx) => (
                                    <div key={`${pkg.id}-feat-${idx}`} style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      fontSize: '0.8rem', color: colors.textPrimary,
                                    }}>
                                      <CheckIcon />
                                      {f.featureName}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Footer: status + live stream badge */}
                              <div style={{
                                padding: '0.75rem 1.25rem',
                                borderTop: `1px solid ${actualTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              }}>
                                <span style={{
                                  fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem',
                                  borderRadius: '1rem',
                                  backgroundColor: pkg.isActive ? (actualTheme === 'dark' ? '#065F4620' : '#D1FAE5') : (actualTheme === 'dark' ? '#7F1D1D20' : '#FEE2E2'),
                                  color: pkg.isActive ? (actualTheme === 'dark' ? '#6EE7B7' : '#065F46') : (actualTheme === 'dark' ? '#FCA5A5' : '#991B1B'),
                                }}>
                                  {pkg.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {pkg.hasLiveStream && (
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: '600', padding: '0.2rem 0.6rem',
                                    borderRadius: '1rem',
                                    backgroundColor: actualTheme === 'dark' ? '#4C1D9520' : '#F5F3FF',
                                    color: actualTheme === 'dark' ? '#A78BFA' : '#7C3AED',
                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                  }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93a10 10 0 0 1 14.14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M7.76 7.76a6 6 0 0 1 8.48 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                                    Live Stream
                                  </span>
                                )}
                              </div>
                            </div>
                          );})}
                        </div>
                      </div>
                    )}
                    </div>{/* end pointer-events wrapper */}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '200px'
            }}
          >
            {toast.type === 'success' ? <CheckIcon /> : <XIcon />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0 0.25rem',
                fontSize: '1.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Show approval pending modal after profile save */}
      <ApprovalPendingModal isOpen={showApprovalModal} profileCompletion={profileCompletion} />

      {/* KYC Verification Modal */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={() => { setShowKycModal(false); refreshUserProfile(); }}
        colors={colors}
        actualTheme={actualTheme}
      />
    </div>
  );
};

export default PhotographerProfilePage;
