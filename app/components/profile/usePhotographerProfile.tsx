'use client';

// app/pages/photographer/profile.tsx's behaviour, moved verbatim into a hook so the classic page and the Compact Glass page share one source
// of truth (no behaviour change).
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import localforage from "localforage";
import { platformAlert } from "@/app/components/PlatformAlert";
import { eastAfricanCountries } from "@/app/components/CountrySelect";
import { type PhoneValue } from "@/app/components/phone/InternationalPhoneInput";
import { parsePhone } from "@/lib/phone/phoneKit";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboardAuth, dashboardAuthFetch } from "@/app/providers/AuthProvider";
import { usePermissions } from "@/app/lib/usePermissions";
import { getApiUrl, normalizeImageUrl, autoCapitalize, capitalizeWords } from "@/lib/api";
import { getPlatformConfig } from "@/lib/platformConfig";
import { normalizeExperienceDraft, normalizeOverviewDraft, normalizePortfolioDraft } from "@/lib/profileDraft";

// Types
// Configure localforage for profile form data
const profileFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'profile_form_draft'
});

// Storage key for the profile form
const PROFILE_FORM_KEY = 'profile_form_draft';


// Interface for day availability
export interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

// Interface for saved profile form data
export interface ProfileFormData {
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

export interface Skill {
  id: string;
  name: string;
  level: number;
}

export interface Project {
  id: string;
  image: string;
  title: string;
  description: string;
  year: string;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface PackageFeature {
  id: string;
  featureName: string;
  isIncluded: boolean;
  displayOrder: number;
}

export interface DeliveryPackage {
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
  // OUTDOOR (required event packages) vs STUDIO (optional indoor session
  // packages). Same backend table; the dashboard renders them as two
  // separate sections. Defaults to OUTDOOR for any package the backend
  // returns without a serviceType (i.e. pre-migration rows).
  serviceType?: 'OUTDOOR' | 'STUDIO';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export interface PendingChange {
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


export function usePhotographerProfile(userType: 'photographer' | 'freelancer' = 'photographer') {
  const { colors, actualTheme } = useTheme();
  const { token, user, refreshUserProfile } = useDashboardAuth();
  const { hasPermission } = usePermissions();
  // Team members without profile.edit see this page in read-only mode -
  // they can view the owner's profile (the data is the owner's, swapped
  // in by PhotographerService.getPhotographerProfileSummary) but can't
  // mutate it. The backend belt-and-braces is @PreAuthorize on every
  // /api/remote/photographer/* mutation endpoint, so even if the form
  // were re-enabled in devtools, the save would 403.
  const canEditProfile = hasPermission('profile.edit');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'experience' | 'packages'>('overview');
  // ?tab=packages opens the packages tab directly (the Packages link in the Compact Glass sidebar). Other values are
  // ignored, so the page opens on Overview as before.
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'packages' || tab === 'portfolio' || tab === 'experience') setActiveTab(tab);
  }, [searchParams]);
  // Geo-pricing manager target (a package to price by location).
  const [geoPkg, setGeoPkg] = useState<{ id: string; name?: string } | null>(null);
  // Guards the bounce-arrival toast so it only fires once per redirect, even
  // if React re-renders or the user navigates away and back.
  const bounceHandledRef = useRef(false);
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

  // Missing-fields banner overlay state.
  // When profile < 100% and the user hasn't yet clicked "Jump there",
  // the banner sits as a centered overlay above the profile content so
  // the user must engage with it. Once they pick a section to fix, it
  // collapses to the normal top-of-page banner so they can actually
  // see and edit the form fields they're jumping to.
  const [missingFieldsOverlayDismissed, setMissingFieldsOverlayDismissed] = useState(false);

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
  // Tier palette synced with the connekyt-landing booking wizard so the
  // photographer's package cards match what clients see when they pick a
  // package on the landing site. Each tier gets a metallic gradient + a
  // matching soft tint for chips/badges.
  const TIER_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string; glow: string }> = {
    Silver: {
      bg: actualTheme === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(203,213,225,0.45)',
      text: actualTheme === 'dark' ? '#CBD5E1' : '#475569',
      border: '#94A3B8',
      gradient: 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 45%, #64748B 100%)',
      glow: 'rgba(100,116,139,0.32)',
    },
    Gold: {
      bg: actualTheme === 'dark' ? 'rgba(245,158,11,0.18)' : 'rgba(254,243,199,0.55)',
      text: actualTheme === 'dark' ? '#FCD34D' : '#92400E',
      border: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)',
      glow: 'rgba(217,119,6,0.32)',
    },
    Diamond: {
      bg: actualTheme === 'dark' ? 'rgba(59,130,246,0.18)' : 'rgba(219,234,254,0.55)',
      text: actualTheme === 'dark' ? '#93C5FD' : '#1E40AF',
      border: '#3B82F6',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #A78BFA 55%, #3B82F6 100%)',
      glow: 'rgba(59,130,246,0.32)',
    },
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

  // Legacy helper kept for savePackageToAPI. returns features to persist
  const getFeaturesForPackage = (packageName: string) => {
    if (packageName === 'Diamond') {
      return SELECTABLE_FEATURES['Diamond'] || [];
    }
    return SELECTABLE_FEATURES[packageName] || [];
  };

  // Specialties fetched from API. [{id, name}]
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

  // International phone input: the saved phone (code + national number,
  // hydrated into basicInfo from the user context or the local draft) is
  // parsed with phoneKit so the component is seeded with the right country
  // and national digits. phoneValue always mirrors what the field shows.
  const [phoneValue, setPhoneValue] = useState<PhoneValue | null>(null);
  const savedPhone = useMemo(
    () => parsePhone(`${basicInfo.phoneCode || ''}${basicInfo.phoneNumber || ''}`),
    [basicInfo.phoneCode, basicInfo.phoneNumber]
  );

  // Overview Tab State - initialized empty, loaded from user context.
  // spokenLanguages is now required by /update-important-details — the
  // save button blocks until at least one is picked.
  const [overviewData, setOverviewData] = useState({
    about: '',
    specialties: [] as string[],
    spokenLanguages: [] as string[],
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
  const [packageToRemove, setPackageToRemove] = useState<DeliveryPackage | null>(null);
  const [currencies, setCurrencies] = useState<{ id: string; code: string; name: string }[]>([]);
  const [openCurrencyPkgId, setOpenCurrencyPkgId] = useState<string | null>(null);
  const currencyDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Indoor studio packages get their own edit toggle so the photographer
  // can edit one section at a time without unlocking the other.
  const [isStudioPackageEditEnabled, setIsStudioPackageEditEnabled] = useState(false);

  // Split the unified packages array into the two presentation buckets.
  // Anything without a serviceType (pre-migration rows) is treated as
  // OUTDOOR so it stays in the existing event-packages section.
  const outdoorPackages = packages.filter(p => p.serviceType !== 'STUDIO');
  const studioPackages = packages.filter(p => p.serviceType === 'STUDIO');

  // Indoor studio sessions are now package-based (handled via the same
  // `packages` array, just with serviceType=STUDIO). The legacy rate-based
  // saveStudioRate / removeStudioRate / dismissStudioBanner handlers were
  // removed along with their UI section above.

  // Package handler functions. serviceType selects whether the new row is
  // an outdoor (event) package or an indoor (studio session) package.
  // They share the same backend table and the same editor card, just
  // rendered in two sections of the profile.
  const addPackage = (serviceType: 'OUTDOOR' | 'STUDIO' = 'OUTDOOR') => {
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
      serviceType,
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

    // Delivery days: no min/max numeric limit anymore. The only rule is a
    // single-direction tier ordering. a higher tier must deliver strictly
    // faster (fewer days) than the tier directly below it:
    //   Diamond < Gold   and   Gold < Silver
    // Each tier checks ONLY its immediate cheaper neighbour; Silver is the
    // base tier and has no constraint. (Diamond < Silver is implied
    // transitively, so it isn't checked separately.) Non-tier/custom
    // package names are unconstrained.
    const days = parseInt(pkg.deliveryDays) || 0;
    // Tier comparisons are scoped to packages of the SAME serviceType so an
    // outdoor Diamond doesn't get compared to a studio Silver (they share
    // names but are independent product lines).
    const sameService = (p: DeliveryPackage) =>
      (p.serviceType ?? 'OUTDOOR') === (pkg.serviceType ?? 'OUTDOOR');

    if (days > 0) {
      const goldDays = parseInt(
        packages.find(p => sameService(p) && p.packageName === 'Gold' && p.id !== pkg.id)?.deliveryDays || '0') || 0;
      const silverDays = parseInt(
        packages.find(p => sameService(p) && p.packageName === 'Silver' && p.id !== pkg.id)?.deliveryDays || '0') || 0;

      if (pkg.packageName === 'Diamond' && goldDays > 0 && days >= goldDays) {
        showToast('error', `Diamond delivery (${days}d) must be faster than Gold (${goldDays}d)`);
        return;
      }
      if (pkg.packageName === 'Gold' && silverDays > 0 && days >= silverDays) {
        showToast('error', `Gold delivery (${days}d) must be faster than Silver (${silverDays}d)`);
        return;
      }
    }

    // Validate photo/video counts: Diamond > Gold > Silver (scoped per
    // serviceType. see sameService above).
    const photos = parseInt(pkg.includedPhotos) || 0;
    const videos = parseInt(pkg.includedVideos) || 0;
    if (photos > 0 || videos > 0) {
      const premiumPkg = packages.find(p => sameService(p) && p.packageName === 'Diamond' && p.id !== pkg.id);
      const customPkg = packages.find(p => sameService(p) && p.packageName === 'Gold' && p.id !== pkg.id);
      const essentialPkg = packages.find(p => sameService(p) && p.packageName === 'Silver' && p.id !== pkg.id);
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
          // Backend defaults to OUTDOOR when serviceType is missing, so
          // sending it explicitly is only strictly required for STUDIO,
          // but always sending it keeps the dedup-by-(name,serviceType)
          // upsert key honest for both kinds.
          serviceType: pkg.serviceType === 'STUDIO' ? 'STUDIO' : 'OUTDOOR',
          features: pkg.features
            .filter(f => f.featureName && f.featureName !== 'Same-day preview' && (SELECTABLE_FEATURES[pkg.packageName] || []).includes(f.featureName))
            .map((f, idx) => ({ featureName: f.featureName, isIncluded: f.isIncluded, displayOrder: idx })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to save ${pkg.packageName}: ${response.status} ${errorText}`);
      }

      // Swap the local temporary id (Date.now-based) for the backend UUID
      // so subsequent edits PUT to the right /packages/{uuid} URL and the
      // editor-vs-summary toggle (which keys off isUUID(pkg.id)) treats this
      // row as a saved one. Outdoor sees this too. harmless because the
      // UUID just replaces an equivalent id.
      try {
        const body = await response.json();
        const newId = body?.data?.id;
        if (newId && typeof newId === 'string' && newId !== pkg.id) {
          setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, id: newId } : p));
        }
      } catch { /* response body parse is best-effort */ }

      // Studio packages: collapse the editor card after a successful save
      // so the photographer is left with only the summary card preview.
      // Outdoor keeps the existing inline-expanded behavior (its editor body
      // is gated by expandedPackageId already).
      if (pkg.serviceType === 'STUDIO') {
        setExpandedPackageId(null);
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
    if (phoneValue?.nsn && !phoneValue.isValid) {
      showToast('error', 'Please enter a valid phone number');
      return;
    }
    setIsSavingAll(true);
    try {
      const [firstName, ...rest] = capitalizeWords(basicInfo.fullName.trim()).split(' ');
      const lastName = rest.join(' ');
      const success = await saveImportantDetailsToAPI({
        firstName: firstName || '',
        lastName: lastName || '',
        // International digits without '+' (e.g. "250788123456") — the
        // canonical wire format per the backend phone-format audit.
        phone: phoneValue?.digits || undefined,
        about: autoCapitalize(overviewData.about),
        address: capitalizeWords(basicInfo.address),
        specialtyIds: overviewData.specialties,
        spokenLanguages: overviewData.spokenLanguages,
        professionalPhilosophy: autoCapitalize(portfolioData.beliefs),
      });
      if (success) {
        // Keep basicInfo (and the auto-saved draft) in sync with the phone
        // just saved.
        if (phoneValue?.dial && phoneValue.nsn) {
          const dial = phoneValue.dial;
          const nsn = phoneValue.nsn;
          setBasicInfo(prev => ({ ...prev, phoneCode: `+${dial}`, phoneNumber: nsn }));
        }
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
          // A draft saved by an older build can lack lists added later (spokenLanguages), and the
          // completion score reads .length on them. Normalise so every list exists.
          if (savedDraft.overviewData) setOverviewData(normalizeOverviewDraft(savedDraft.overviewData));
          if (savedDraft.portfolioData) setPortfolioData(normalizePortfolioDraft<Skill, Project>(savedDraft.portfolioData));
          if (savedDraft.experienceData) setExperienceData(normalizeExperienceDraft<Experience>(savedDraft.experienceData));

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
        // spokenLanguages comes back from the profile-summary response
        // as an array of upper-case codes. Hydrate so the photographer
        // sees their existing picks without re-selecting.
        spokenLanguages: ((user as { spokenLanguages?: string[] }).spokenLanguages || []).filter(Boolean),
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
          // Pre-migration backend rows have no serviceType. default to
          // OUTDOOR so they render in the existing event-packages section
          // instead of leaking into the new indoor section by mistake.
          serviceType: (p.serviceType === 'STUDIO' ? 'STUDIO' : 'OUTDOOR') as 'OUTDOOR' | 'STUDIO',
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
      // Overview. specialties + at least one spoken language (25%
      // bucket split across two required fields so the completion
      // percentage doesn't jump from 0 → 100 on the section).
      overview: {
        weight: 25,
        filled: [
          overviewData.specialties.length >= 2,
          overviewData.spokenLanguages.length >= 1,
        ].filter(Boolean).length,
        total: 2
      },
      // Portfolio. at least one featured project (30%)
      portfolio: {
        weight: 30,
        filled: [
          portfolioData.projects.length >= 1,
        ].filter(Boolean).length,
        total: 1
      },
      // Experience. at least one entry, with a written description (20%)
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

  /**
   * The first section that still has a gap, in the order the banner lists
   * them. Drives both the bounce-arrival auto-jump and the per-row "Jump
   * there" buttons on the missing-fields banner. Returns null when nothing
   * is missing.
   */
  const firstMissingTarget = useMemo<
    null | { section: 'basic' | 'overview' | 'portfolio' | 'experience'; label: string }
  >(() => {
    if (!basicInfo.fullName || !basicInfo.phoneNumber || !basicInfo.address || !profileImage) {
      return { section: 'basic', label: 'basic info' };
    }
    if (overviewData.specialties.length < 2) {
      return { section: 'overview', label: 'specialties' };
    }
    if (overviewData.spokenLanguages.length < 1) {
      return { section: 'overview', label: 'spoken languages' };
    }
    if (portfolioData.projects.length < 1) {
      return { section: 'portfolio', label: 'portfolio' };
    }
    const hasExp = experienceData.experiences.length >= 1;
    const hasLongDesc = experienceData.experiences.some(e => e.description.length > 50);
    if (!hasExp || !hasLongDesc) {
      return { section: 'experience', label: 'work experience' };
    }
    return null;
  }, [basicInfo, overviewData, portfolioData, experienceData, profileImage]);

  /**
   * Maps a banner section to the user action that surfaces it. Basic info is
   * always-visible at the top of the page (not in a tab), so jumping there
   * means scrolling to the top; the others are tabs.
   */
  const jumpToSection = useCallback((section: 'basic' | 'overview' | 'portfolio' | 'experience') => {
    // NOTE: we deliberately do NOT dismiss the missing-fields overlay here.
    // jumpToSection is also called programmatically from the redirect
    // handler (after the platformAlert "Got it" modal closes), and
    // auto-dismissing there would collapse the overlay before the user
    // ever interacts with it. The actual dismissal happens on the user's
    // click on a "Jump there" pill inside the banner.
    if (section !== 'basic') {
      setActiveTab(section);
    }
    if (typeof window === 'undefined') return;
    // Find the actual scroll container. the dashboard puts every page inside
    // a flex column whose middle child has overflowY:auto. window.scrollTo is
    // useless here because the document itself doesn't scroll. Walk up from
    // the target until we find something that does, then scroll that.
    const targetId = section === 'basic' ? 'profile-basic-info-section' : 'profile-tabs-section';
    const target = document.getElementById(targetId);
    if (!target) return;
    let scrollParent: HTMLElement | null = target.parentElement;
    while (scrollParent) {
      const style = window.getComputedStyle(scrollParent);
      if (/(auto|scroll)/.test(style.overflowY) && scrollParent.scrollHeight > scrollParent.clientHeight) break;
      scrollParent = scrollParent.parentElement;
    }
    if (scrollParent) {
      const offset = target.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top + scrollParent.scrollTop;
      // Small breathing room above the section header. The banner is no
      // longer sticky, so we don't need to clear its height. just give
      // the section a bit of margin from the very top so it doesn't slam
      // into the topbar.
      scrollParent.scrollTo({ top: Math.max(0, offset - 24), behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  /**
   * Bounce-arrival handler. When PhotographerLayout redirects an incomplete
   * photographer here, it appends ?completionRequired=1. We surface a
   * one-shot toast that explains why they landed here, auto-switch to the
   * first incomplete tab so they don't have to hunt for it, and strip the
   * query param so a refresh doesn't re-fire the toast.
   */
  useEffect(() => {
    if (bounceHandledRef.current) return;
    if (!searchParams) return;
    if (searchParams.get('completionRequired') !== '1') return;
    // Don't fire until the form data has actually loaded from the API/cache;
    // firstMissingTarget would return 'basic' for an empty initial state.
    if (!user) return;

    bounceHandledRef.current = true;

    const target = firstMissingTarget;
    if (target) {
      platformAlert(
        `You need to reach 100% profile completion before you can use the rest of the dashboard. ` +
        `Start with your ${target.label}. the section is open below.`,
        { tone: 'warning', title: 'Finish your profile to continue' }
      );
      jumpToSection(target.section);
    }

    // Clear the param so a refresh / back-nav doesn't re-fire the toast.
    router.replace('/user/photographer/profile');
  }, [searchParams, user, firstMissingTarget, jumpToSection, router]);

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

  const toggleSpokenLanguage = (code: string) => {
    setOverviewData(prev => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.includes(code)
        ? prev.spokenLanguages.filter(c => c !== code)
        : [...prev.spokenLanguages, code],
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
    spokenLanguages?: string[];
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
    spokenLanguages?: string[];
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

  // Package prices: the price and its currency are one field (MoneyInput). A package has ONE currency, so the main
  // price and the extra photo and video prices all edit the same pkg.currencyId. Packages are not held to the listing
  // minimum by the server, so the field shows no minimum.
  const pkgMoneyCurrencies = currencies.map((c) => ({ value: c.id as string, code: c.code, name: c.name }));
  const pkgMoneyCurrencyId = (pkg: DeliveryPackage) =>
    pkgMoneyCurrencies.find((o) => o.value === pkg.currencyId || o.code === pkg.currencyId)?.value ?? '';

  const errorMessageStyle = {
    color: 'var(--g-error, #EF4444)',
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


  return {
    colors,
    actualTheme,
    token,
    user,
    refreshUserProfile,
    hasPermission,
    canEditProfile,
    router,
    searchParams,
    activeTab,
    setActiveTab,
    geoPkg,
    setGeoPkg,
    bounceHandledRef,
    savingSkill,
    setSavingSkill,
    savingEquipment,
    setSavingEquipment,
    savingAvailability,
    setSavingAvailability,
    savingProject,
    setSavingProject,
    savingProfilePicture,
    setSavingProfilePicture,
    savingCoverPhoto,
    setSavingCoverPhoto,
    savingImportantDetails,
    setSavingImportantDetails,
    importantDetailsTimeoutRef,
    showKycModal,
    setShowKycModal,
    missingFieldsOverlayDismissed,
    setMissingFieldsOverlayDismissed,
    toasts,
    setToasts,
    showToast,
    dismissToast,
    rwandaProvinces,
    PACKAGE_TIER,
    TIER_LABELS,
    TIER_COLORS,
    SELECTABLE_FEATURES,
    ALL_FEATURES,
    getFeaturesForPackage,
    availableSpecialties,
    setAvailableSpecialties,
    daysOfWeek,
    timeOptions,
    currentYear,
    yearOptions,
    yearOptionsWithPresent,
    defaultAvailability,
    basicInfo,
    setBasicInfo,
    phoneValue,
    setPhoneValue,
    savedPhone,
    overviewData,
    setOverviewData,
    portfolioData,
    setPortfolioData,
    experienceData,
    setExperienceData,
    isPackageEditEnabled,
    setIsPackageEditEnabled,
    packages,
    setPackages,
    savingPackageId,
    setSavingPackageId,
    expandedPackageId,
    setExpandedPackageId,
    packageToRemove,
    setPackageToRemove,
    currencies,
    setCurrencies,
    openCurrencyPkgId,
    setOpenCurrencyPkgId,
    currencyDropdownRefs,
    isStudioPackageEditEnabled,
    setIsStudioPackageEditEnabled,
    outdoorPackages,
    studioPackages,
    addPackage,
    updatePackage,
    removePackage,
    addFeatureToPackage,
    updateFeature,
    removeFeature,
    savePackageToAPI,
    profileImage,
    setProfileImage,
    bannerImage,
    setBannerImage,
    profileInputRef,
    bannerInputRef,
    projectImageInputRef,
    newEquipment,
    setNewEquipment,
    editingEquipmentIndex,
    setEditingEquipmentIndex,
    editingSkillId,
    setEditingSkillId,
    newlyAddedId,
    setNewlyAddedId,
    isRestoringDraft,
    setIsRestoringDraft,
    showDraftRestoredNotice,
    setShowDraftRestoredNotice,
    autoSaveTimeoutRef,
    skipNextUserSync,
    validationErrors,
    setValidationErrors,
    isEditEnabled,
    setIsEditEnabled,
    isSavingAll,
    setIsSavingAll,
    showApprovalModal,
    setShowApprovalModal,
    isSavingAvailability,
    setIsSavingAvailability,
    pendingChanges,
    setPendingChanges,
    isAccountAccepted,
    fetchPendingChanges,
    getFieldPendingChanges,
    checkPendingResponse,
    handleSaveAllChanges,
    handleSaveAvailability,
    handleFullNameChange,
    handleUsernameChange,
    saveProfileDraft,
    profileCompletion,
    firstMissingTarget,
    jumpToSection,
    getCompletionColor,
    renderPendingBadge,
    getPendingAddItems,
    pendingTagStyle,
    handleProfileImageUpload,
    handleBannerImageUpload,
    toggleSpecialty,
    toggleSpokenLanguage,
    addEquipment,
    updateEquipment,
    addSkill,
    removeSkill,
    updateSkill,
    addSkillToAPI,
    addEquipmentToAPI,
    saveImportantDetailsToAPI,
    debouncedSaveImportantDetails,
    parseTimeToAPI,
    addAvailabilityToAPI,
    saveProfilePictureToAPI,
    saveCoverPhotoToAPI,
    addProjectToAPI,
    deleteSkillFromAPI,
    deleteEquipmentFromAPI,
    deleteAvailabilityFromAPI,
    deleteProjectFromAPI,
    savingExperience,
    setSavingExperience,
    saveExperienceToAPI,
    deleteExperienceFromAPI,
    addExperience,
    updateExperience,
    removeExperience,
    editingProjectId,
    setEditingProjectId,
    addProject,
    updateProject,
    removeProject,
    handleProjectImageUpload,
    inputStyle,
    labelStyle,
    inputErrorStyle,
    selectStyle,
    pkgInputStyle,
    pkgSelectStyle,
    pkgMoneyCurrencies,
    pkgMoneyCurrencyId,
    errorMessageStyle,
    tabStyle,
    cardStyle,
    sectionTitleStyle,
    newItemAnimation,
  };
}

export type PhotographerProfileController = ReturnType<typeof usePhotographerProfile>;
