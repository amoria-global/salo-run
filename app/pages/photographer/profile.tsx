"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import localforage from 'localforage';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useDashboardAuth } from '../../providers/AuthProvider';

/**
 * Get API URL - uses proxy in production to avoid mixed content
 */
function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}

// Configure localforage for profile form data
const profileFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'profile_form_draft'
});

// Storage key for the profile form
const PROFILE_FORM_KEY = 'profile_form_draft';

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
    username: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
    specialty: 'Photographer' | 'Videographer';
    country: string;
    province: string;
    district: string;
    sector: string;
    availability: {
      [key: string]: DayAvailability;
    };
    // Employment Information (optional)
    employmentStatus?: '' | 'self-employed' | 'employed';
    companyName?: string;
    companyAddress?: string;
    positionRole?: string;
    employmentType?: '' | 'full-time' | 'part-time' | 'contract';
  };
  overviewData: {
    about: string;
    specialties: string[];
    equipments: string[];
  };
  portfolioData: {
    beliefs: string;
    skills: { id: string; name: string; level: number }[];
    education: { id: string; degree: string; institution: string; fromYear: string; toYear: string; description: string }[];
    qualifications: { id: string; title: string; issuer: string; year: string; description: string }[];
    training: { id: string; name: string; year: string }[];
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

interface Education {
  id: string;
  degree: string;
  institution: string;
  fromYear: string;
  toYear: string;
  description: string;
}

interface Qualification {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

interface Training {
  id: string;
  name: string;
  issuer: string;
  year: string;
  description: string;
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

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface PhotographerProfilePageProps {
  userType?: 'photographer' | 'freelancer';
}

const PhotographerProfilePage = ({ userType = 'photographer' }: PhotographerProfilePageProps) => {
  const { colors, actualTheme } = useTheme();
  const { token, user } = useDashboardAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'experience'>('overview');
  const [savingEducation, setSavingEducation] = useState<string | null>(null);
  const [savingTraining, setSavingTraining] = useState<string | null>(null);
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const [savingEquipment, setSavingEquipment] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState<string | null>(null);
  const [savingProfilePicture, setSavingProfilePicture] = useState(false);
  const [savingCoverPhoto, setSavingCoverPhoto] = useState(false);

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
  const eastAfricanCountries = [
    { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
    { name: 'Uganda', code: '+256', flag: '🇺🇬' },
    { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
    { name: 'Burundi', code: '+257', flag: '🇧🇮' },
    { name: 'South Sudan', code: '+211', flag: '🇸🇸' },
  ];

  // Rwanda provinces and districts
  const rwandaProvinces: { [key: string]: string[] } = {
    'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
  };

  // Available specialties
  const availableSpecialties = [
    'Wedding', 'Birthday', 'Corporate', 'Portrait', 'Family', 'Events',
    'Concerts', 'Fashion', 'Product', 'Real Estate', 'Sports', 'Documentary'
  ];

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
    username: '',
    email: '',
    phoneCode: '+250',
    phoneNumber: '',
    specialty: 'Photographer' as 'Photographer' | 'Videographer',
    country: 'Rwanda',
    province: '',
    district: '',
    sector: '',
    availability: {} as { [key: string]: DayAvailability },
    // Employment Information
    employmentStatus: '' as '' | 'self-employed' | 'employed',
    companyName: '',
    companyAddress: '',
    positionRole: '',
    employmentType: '' as '' | 'full-time' | 'part-time' | 'contract',
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
    education: [] as Education[],
    qualifications: [] as Qualification[],
    training: [] as Training[],
    projects: [] as Project[],
  });

  // Experience Tab State - initialized empty, loaded from user context
  const [experienceData, setExperienceData] = useState({
    experiences: [] as Experience[],
  });

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

  // Input validation error states
  const [validationErrors, setValidationErrors] = useState({
    fullName: '',
    username: '',
    phoneNumber: ''
  });

  // Edit mode state - when false, all fields are disabled
  const [isEditEnabled, setIsEditEnabled] = useState(false);

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

  // Restore saved draft on component mount
  useEffect(() => {
    const restoreDraft = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const savedDraft = await profileFormStorage.getItem<any>(PROFILE_FORM_KEY);
        if (savedDraft) {
          setIsRestoringDraft(true);

          if (savedDraft.basicInfo) {
            // Migrate old format to new format if needed
            const restoredBasicInfo = { ...savedDraft.basicInfo };
            if (!restoredBasicInfo.availability) {
              // Old format detected - migrate to new availability structure
              restoredBasicInfo.availability = defaultAvailability;
            }
            // Ensure employment fields exist
            if (!restoredBasicInfo.employmentStatus) {
              restoredBasicInfo.employmentStatus = '';
              restoredBasicInfo.companyName = '';
              restoredBasicInfo.companyAddress = '';
              restoredBasicInfo.positionRole = '';
              restoredBasicInfo.employmentType = '';
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
    if (user) {
      // Set basic info from user
      setBasicInfo(prev => ({
        ...prev,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || '',
        phoneNumber: user.phone || '',
        specialty: (user.customerType === 'Videographer' ? 'Videographer' : 'Photographer') as 'Photographer' | 'Videographer',
      }));

      // Set overview data
      setOverviewData(prev => ({
        ...prev,
        about: user.about || '',
        specialties: user.specialties || [],
        equipments: user.equipments?.map(e => e.name) || [],
      }));

      // Set portfolio data
      setPortfolioData(prev => ({
        ...prev,
        beliefs: user.professionalPhilosophy || '',
        skills: user.professionalSkills?.map(s => ({
          id: s.id || String(Date.now()),
          name: s.name,
          level: s.skillPercentage,
        })) || [],
        education: user.educationLevels?.map(e => ({
          id: e.id || String(Date.now()),
          degree: e.degree,
          institution: e.institution,
          fromYear: e.startDate?.split('-')[0] || '',
          toYear: e.endDate?.split('-')[0] || 'Present',
          description: e.description || '',
        })) || [],
        qualifications: user.certifications?.map(c => ({
          id: c.id || String(Date.now()),
          title: c.title,
          issuer: c.institution,
          year: c.yearObtained,
          description: c.description || '',
        })) || [],
        training: user.trainings?.map(t => ({
          id: t.id || String(Date.now()),
          name: t.title,
          issuer: t.institution,
          year: t.yearObtained,
          description: t.description || '',
        })) || [],
        projects: user.projects?.map(p => ({
          id: p.id || String(Date.now()),
          image: p.projectImage || '',
          title: p.title,
          description: p.description || '',
          year: String(p.year),
        })) || [],
      }));

      // Set availability from user data
      if (user.availabilities && user.availabilities.length > 0) {
        const availabilityMap: { [key: string]: DayAvailability } = {};
        user.availabilities.forEach(a => {
          const day = a.dayOfWeek.charAt(0).toUpperCase() + a.dayOfWeek.slice(1).toLowerCase();
          const formatTime = (time: { hour: number; minute: number }) => {
            const hour = time.hour;
            const minute = time.minute;
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

      // Set images
      if (user.profilePicture) setProfileImage(user.profilePicture);
      if (user.coverPicture) setBannerImage(user.coverPicture);
    }
  }, [user]);

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    const fields = {
      // Basic Info (20%)
      basicInfo: {
        weight: 20,
        filled: [
          basicInfo.fullName,
          basicInfo.phoneNumber,
          basicInfo.country,
          basicInfo.province,
          basicInfo.district,
          profileImage,
        ].filter(Boolean).length,
        total: 6
      },
      // Overview (25%)
      overview: {
        weight: 25,
        filled: [
          overviewData.about.length > 50,
          overviewData.specialties.length >= 2,
          overviewData.equipments.length >= 1,
        ].filter(Boolean).length,
        total: 3
      },
      // Portfolio (35%)
      portfolio: {
        weight: 35,
        filled: [
          portfolioData.beliefs.length > 30,
          portfolioData.skills.length >= 2,
          portfolioData.education.length >= 1,
          portfolioData.qualifications.length >= 1,
          portfolioData.training.length >= 1,
        ].filter(Boolean).length,
        total: 5
      },
      // Experience (20%)
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
    if (percentage < 90) return '#3B82F6';
    return '#10B981';
  };

  // Handle image uploads
  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Specialty toggle
  const toggleSpecialty = (specialty: string) => {
    setOverviewData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
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

  // Education handlers
  const addEducation = () => {
    const newId = Date.now().toString();
    setNewlyAddedId(newId);
    setPortfolioData(prev => ({
      ...prev,
      education: [{ id: newId, degree: '', institution: '', fromYear: '', toYear: '', description: '' }, ...prev.education]
    }));
    setTimeout(() => setNewlyAddedId(null), 1500);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const removeEducation = async (id: string) => {
    const success = await deleteEducationFromAPI(id);
    if (success) {
      setPortfolioData(prev => ({
        ...prev,
        education: prev.education.filter(e => e.id !== id)
      }));
    }
    showToast(success ? 'success' : 'error',
      success ? 'Education deleted successfully' : 'Failed to delete education');
  };

  // Save education to API
  const saveEducationToAPI = async (edu: Education) => {
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    if (!edu.degree || !edu.institution) {
      console.error('Degree and institution are required');
      return false;
    }

    setSavingEducation(edu.id);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const response = await fetch(`${apiUrl}/api/remote/photographer/add-education-level`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          degree: edu.degree,
          institution: edu.institution,
          startDate: edu.fromYear ? `${edu.fromYear}-01-01` : '',
          endDate: edu.toYear === 'Present' ? '' : (edu.toYear ? `${edu.toYear}-01-01` : ''),
          description: edu.description || '',
        }),
      });

      if (!response.ok) {
        console.error('Failed to save education:', response.status);
        return false;
      }

      console.log('Education saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving education:', error);
      return false;
    } finally {
      setSavingEducation(null);
    }
  };

  // Add training/certification to API
  const addTrainingToAPI = async (training: Training, type: 'TRAINING' | 'CERTIFICATION' = 'TRAINING') => {
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    if (!training.name) {
      console.error('Training name is required');
      return false;
    }

    setSavingTraining(training.id);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const response = await fetch(`${apiUrl}/api/remote/photographer/add-trainting-certification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: training.name,
          institution: training.issuer || '',
          yearObtained: training.year || '',
          description: training.description || '',
          type: type,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add training:', response.status);
        return false;
      }

      console.log('Training added successfully');
      return true;
    } catch (error) {
      console.error('Error adding training:', error);
      return false;
    } finally {
      setSavingTraining(null);
    }
  };

  // Add skill to API
  const addSkillToAPI = async (skill: Skill) => {
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    if (!skill.name) {
      console.error('Skill name is required');
      return false;
    }

    setSavingSkill(skill.id);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const response = await fetch(`${apiUrl}/api/remote/photographer/add-professional-skills`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: skill.name,
          skillPercentage: skill.level,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add skill:', response.status);
        return false;
      }

      console.log('Skill added successfully');
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
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    if (!name) {
      console.error('Equipment name is required');
      return false;
    }

    setSavingEquipment(name);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const response = await fetch(`${apiUrl}/api/remote/photographer/add-equipment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add equipment:', response.status);
        return false;
      }

      console.log('Equipment added successfully');
      return true;
    } catch (error) {
      console.error('Error adding equipment:', error);
      return false;
    } finally {
      setSavingEquipment(null);
    }
  };

  // Helper to convert time string to API format
  const parseTimeToAPI = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { hour: 0, minute: 0, second: 0, nano: 0 };

    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return { hour, minute, second: 0, nano: 0 };
  };

  // Add availability to API
  const addAvailabilityToAPI = async (day: string, startTime: string, endTime: string) => {
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    setSavingAvailability(day);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const response = await fetch(`${apiUrl}/api/remote/photographer/add-availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
          'Content-Type': 'application/json',
        },
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
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    setSavingProfilePicture(true);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`${apiUrl}/api/remote/photographer/update-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Failed to save profile picture:', response.status);
        return false;
      }

      console.log('Profile picture saved successfully');
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
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    setSavingCoverPhoto(true);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const formData = new FormData();
      formData.append('coverPhoto', file);

      const response = await fetch(`${apiUrl}/api/remote/photographer/update-cover-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Failed to save cover photo:', response.status);
        return false;
      }

      console.log('Cover photo saved successfully');
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
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    if (!project.title) {
      console.error('Project title is required');
      return false;
    }

    setSavingProject(project.id);

    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';

      const formData = new FormData();
      formData.append('requestDTO', new Blob([JSON.stringify({
        title: project.title,
        description: project.description || '',
        year: parseInt(project.year) || new Date().getFullYear(),
      })], { type: 'application/json' }));

      // If we have an image file, use it; otherwise try to convert base64 to blob
      if (imageFile) {
        formData.append('projectImage', imageFile);
      } else if (project.image && project.image.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(project.image);
        const blob = await response.blob();
        formData.append('projectImage', blob, 'project-image.jpg');
      }

      const apiResponse = await fetch(`${apiUrl}/api/remote/photographer/add-project-portfolio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        console.error('Failed to add project:', apiResponse.status);
        return false;
      }

      console.log('Project added successfully');
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
    if (!token) return false;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/remote/photographer/delete-professional-skills/${skillId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting skill:', error);
      return false;
    }
  };

  // Delete equipment from API
  const deleteEquipmentFromAPI = async (equipmentId: string) => {
    if (!token) return false;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/remote/photographer/delete-equipment/${equipmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      return false;
    }
  };

  // Delete education from API
  const deleteEducationFromAPI = async (educationId: string) => {
    if (!token) return false;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/remote/photographer/delete-education-level/${educationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting education:', error);
      return false;
    }
  };

  // Delete availability from API
  const deleteAvailabilityFromAPI = async (availabilityId: string) => {
    if (!token) return false;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/remote/photographer/delete-availability/${availabilityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting availability:', error);
      return false;
    }
  };

  // Delete project from API
  const deleteProjectFromAPI = async (projectId: string) => {
    if (!token) return false;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/remote/photographer/delete-add-project-portfolio/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  // Delete training/certification from API
  const deleteTrainingFromAPI = async (trainingId: string) => {
    if (!token) return false;
    try {
      const apiUrl = getApiUrl();
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/remote/photographer/delete-trainting-certification/${trainingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'api-token': apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting training:', error);
      return false;
    }
  };

  // Qualification handlers
  const addQualification = () => {
    const newId = Date.now().toString();
    setNewlyAddedId(newId);
    setPortfolioData(prev => ({
      ...prev,
      qualifications: [{ id: newId, title: '', issuer: '', year: '', description: '' }, ...prev.qualifications]
    }));
    setTimeout(() => setNewlyAddedId(null), 1500);
  };

  const updateQualification = (id: string, field: keyof Qualification, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const removeQualification = async (id: string) => {
    const success = await deleteTrainingFromAPI(id); // Certifications use same endpoint as training
    if (success) {
      setPortfolioData(prev => ({
        ...prev,
        qualifications: prev.qualifications.filter(q => q.id !== id)
      }));
    }
    showToast(success ? 'success' : 'error',
      success ? 'Certification deleted successfully' : 'Failed to delete certification');
  };

  // Training handlers
  const addTraining = () => {
    const newId = Date.now().toString();
    setNewlyAddedId(newId);
    setPortfolioData(prev => ({
      ...prev,
      training: [{ id: newId, name: '', issuer: '', year: '', description: '' }, ...prev.training]
    }));
    setTimeout(() => setNewlyAddedId(null), 1500);
  };

  // Update training field
  const updateTraining = (id: string, field: keyof Training, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      training: prev.training.map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  const removeTraining = async (id: string) => {
    const success = await deleteTrainingFromAPI(id);
    if (success) {
      setPortfolioData(prev => ({
        ...prev,
        training: prev.training.filter(t => t.id !== id)
      }));
    }
    showToast(success ? 'success' : 'error',
      success ? 'Training deleted successfully' : 'Failed to delete training');
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

  const removeExperience = (id: string) => {
    setExperienceData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(e => e.id !== id)
    }));
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
      if (file.size > 5 * 1024 * 1024) {
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

  const errorMessageStyle = {
    color: '#EF4444',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    display: 'block'
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '600' as const,
    color: isActive ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
    backgroundColor: isActive ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent',
    border: 'none',
    borderBottom: isActive ? `3px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}` : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s'
  });

  const cardStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: colors.shadowSm,
    border: `1px solid ${colors.borderPrimary}`,
    marginBottom: '1.25rem'
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
        <Topbar userRole="photographer" tipsAmount={275.00} bonusAmount={725.00} balanceAmount={4975.00} />

        <div className="mobile-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: colors.bgPrimary,
          padding: '1.25rem'
        }}>
          {/* Page Header */}
          <div className="mobile-page-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: colors.textPrimary
            }}>Edit Profile</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Edit Toggle Switch */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: colors.textSecondary
                }}>Edit</span>
                <button
                  onClick={() => setIsEditEnabled(!isEditEnabled)}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: isEditEnabled ? '#083A85' : (actualTheme === 'dark' ? '#4B5563' : '#D1D5DB'),
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: colors.bgCard,
                    position: 'absolute',
                    top: '2px',
                    left: isEditEnabled ? '24px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                  }} />
                </button>
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: isEditEnabled ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : '#6B7280'
                }}>
                  {isEditEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {/* Save Changes Button */}
              <button
                className="save-button-enhanced"
                disabled={!isEditEnabled}
                style={{
                  backgroundColor: isEditEnabled ? '#083A85' : colors.bgTertiary,
                  color: isEditEnabled ? 'white' : colors.textSecondary,
                  border: isEditEnabled ? '2px solid #062a63' : `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isEditEnabled ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                Save Changes
              </button>
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

          {/* Profile Completion Card */}
          <div className="mobile-card completion-card-enhanced" style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #083A85 0%, #0a4da8 100%)',
            color: 'white',
            marginBottom: '1.5rem'
          }}>
            <div className="mobile-completion-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              {/* Circular Progress */}
              <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={getCompletionColor(profileCompletion)}
                    strokeWidth="12"
                    strokeDasharray={`${(profileCompletion / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{profileCompletion}%</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Complete</div>
                </div>
              </div>

              {/* Completion Info */}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Complete Your Profile
                </h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1rem', lineHeight: '1.5' }}>
                  A complete profile helps clients find you and understand your expertise.
                  Fill in all sections to maximize your visibility and booking potential.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {profileCompletion < 100 && (
                    <>
                      {!overviewData.about && (
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem'
                        }}>
                          + Add bio
                        </span>
                      )}
                      {overviewData.specialties.length < 2 && (
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem'
                        }}>
                          + Add specialties
                        </span>
                      )}
                      {portfolioData.skills.length < 2 && (
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem'
                        }}>
                          + Add skills
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: colors.shadowSm,
                border: `1px solid ${colors.borderPrimary}`
              }}>
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={profileInputRef}
                  onChange={handleProfileImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {/* Banner */}
                <div style={{
                  height: '100px',
                  background: bannerImage ? `url(${bannerImage}) center/cover no-repeat` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative'
                }}>
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                    <CameraIcon />
                  </button>
                </div>

                {/* Avatar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '-50px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid white',
                      backgroundColor: colors.bgTertiary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      ) : (
                        <span style={{ fontSize: '2rem', color: colors.textSecondary }}>
                          {basicInfo.fullName ? basicInfo.fullName.charAt(0).toUpperCase() : '?'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => profileInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        backgroundColor: '#083A85',
                        border: '2px solid #062a63',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                      <CameraIcon />
                    </button>
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
                  <p style={{
                    fontSize: '0.95rem',
                    color: colors.textSecondary
                  }}>{basicInfo.specialty}</p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#9CA3AF',
                    marginTop: '0.25rem'
                  }}>
                    {basicInfo.district}, {basicInfo.province}
                  </p>
                </div>

                {/* Stats */}
                <div className="mobile-profile-card-stats" style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '1rem',
                  borderTop: `1px solid ${colors.borderPrimary}`,
                  borderBottom: `1px solid ${colors.borderPrimary}`
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>4.9</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>127</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Reviews</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}>85</div>
                    <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>Jobs</div>
                  </div>
                </div>

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
                      <span style={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: '500' }}>Jan 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Tabbed Form */}
            <div className="mobile-profile-right">
              {/* Tabs */}
              <div className="mobile-tabs" style={{
                display: 'flex',
                backgroundColor: colors.bgCard,
                borderRadius: '0.75rem 0.75rem 0 0',
                borderBottom: '1px solid #E5E7EB',
                marginBottom: 0
              }}>
                <button onClick={() => setActiveTab('overview')} style={tabStyle(activeTab === 'overview')}>
                  Overview
                </button>
                <button onClick={() => setActiveTab('portfolio')} style={tabStyle(activeTab === 'portfolio')}>
                  Portfolio
                </button>
                <button onClick={() => setActiveTab('experience')} style={tabStyle(activeTab === 'experience')}>
                  Working Experience
                </button>
              </div>

              {/* Tab Content */}
              <div style={{
                backgroundColor: colors.bgCard,
                borderRadius: '0 0 0.75rem 0.75rem',
                padding: '1.5rem',
                boxShadow: colors.shadowSm,
                border: `1px solid ${colors.borderPrimary}`,
                borderTop: 'none'
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
                        <label style={labelStyle}>Full Name *</label>
                        <input
                          type="text"
                          value={basicInfo.fullName}
                          onChange={(e) => handleFullNameChange(e.target.value)}
                          disabled={!isEditEnabled}
                          style={validationErrors.fullName ? inputErrorStyle : inputStyle}
                        />
                        {validationErrors.fullName && (
                          <span style={errorMessageStyle}>{validationErrors.fullName}</span>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Username</label>
                        <input
                          type="text"
                          value={basicInfo.username}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                          disabled={!isEditEnabled}
                          style={validationErrors.username ? inputErrorStyle : inputStyle}
                        />
                        {validationErrors.username && (
                          <span style={errorMessageStyle}>{validationErrors.username}</span>
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
                          <select
                            value={basicInfo.phoneCode}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, phoneCode: e.target.value }))}
                            disabled={!isEditEnabled}
                            style={{ ...selectStyle, width: '110px' }}
                          >
                            {eastAfricanCountries.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
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
                        <label style={labelStyle}>Country</label>
                        <select
                          value={basicInfo.country}
                          disabled={!isEditEnabled}
                          onChange={(e) => {
                            setBasicInfo(prev => ({ ...prev, country: e.target.value }));
                            if (e.target.value !== 'Rwanda') {
                              setBasicInfo(prev => ({ ...prev, province: '', district: '', sector: '' }));
                            }
                          }}
                          style={selectStyle}
                        >
                          {eastAfricanCountries.map((country) => (
                            <option key={country.name} value={country.name}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Province</label>
                        {basicInfo.country === 'Rwanda' ? (
                          <select
                            value={basicInfo.province}
                            disabled={!isEditEnabled}
                            onChange={(e) => {
                              const districts = rwandaProvinces[e.target.value] || [];
                              setBasicInfo(prev => ({ ...prev, province: e.target.value, district: districts[0] || '' }));
                            }}
                            style={selectStyle}
                          >
                            {Object.keys(rwandaProvinces).map((province) => (
                              <option key={province} value={province}>{province}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={basicInfo.province}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, province: e.target.value }))}
                            placeholder="Enter province"
                            disabled={!isEditEnabled}
                            style={inputStyle}
                          />
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>District</label>
                        {basicInfo.country === 'Rwanda' && basicInfo.province ? (
                          <select
                            value={basicInfo.district}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, district: e.target.value }))}
                            disabled={!isEditEnabled}
                            style={selectStyle}
                          >
                            {(rwandaProvinces[basicInfo.province] || []).map((district) => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={basicInfo.district}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, district: e.target.value }))}
                            placeholder="Enter district"
                            disabled={!isEditEnabled}
                            style={inputStyle}
                          />
                        )}
                      </div>
                    </div>

                    {/* Employment Information Section (Optional) */}
                    <div style={sectionTitleStyle}>
                      <span>Employment Information</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '400', color: colors.textSecondary, marginLeft: '0.5rem' }}>(Optional)</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      If you work for a photography company or studio, you can add your employment details here
                    </p>
                    <div className="mobile-form-grid-2" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1.25rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div>
                        <label style={labelStyle}>Employment Status</label>
                        <select
                          value={basicInfo.employmentStatus}
                          disabled={!isEditEnabled}
                          onChange={(e) => setBasicInfo(prev => ({
                            ...prev,
                            employmentStatus: e.target.value as '' | 'self-employed' | 'employed',
                            // Clear company fields if switching to self-employed or empty
                            ...(e.target.value !== 'employed' ? {
                              companyName: '',
                              companyAddress: '',
                              positionRole: '',
                              employmentType: ''
                            } : {})
                          }))}
                          style={selectStyle}
                        >
                          <option value="">Not specified</option>
                          <option value="self-employed">Self-Employed / Independent</option>
                          <option value="employed">Employed by Company</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Employment Type</label>
                        <select
                          value={basicInfo.employmentType}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, employmentType: e.target.value as '' | 'full-time' | 'part-time' | 'contract' }))}
                          disabled={!isEditEnabled || basicInfo.employmentStatus !== 'employed'}
                          style={{
                            ...selectStyle,
                            opacity: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 0.5 : 1,
                            cursor: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="">Select type</option>
                          <option value="full-time">Full-Time</option>
                          <option value="part-time">Part-Time</option>
                          <option value="contract">Contract / Freelance</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Company Name</label>
                        <input
                          type="text"
                          value={basicInfo.companyName}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="e.g., Elite Photography Studios"
                          disabled={!isEditEnabled || basicInfo.employmentStatus !== 'employed'}
                          style={{
                            ...inputStyle,
                            opacity: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 0.5 : 1,
                            cursor: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Position / Role</label>
                        <input
                          type="text"
                          value={basicInfo.positionRole}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, positionRole: e.target.value }))}
                          placeholder="e.g., Senior Photographer"
                          disabled={!isEditEnabled || basicInfo.employmentStatus !== 'employed'}
                          style={{
                            ...inputStyle,
                            opacity: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 0.5 : 1,
                            cursor: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Company Address</label>
                        <input
                          type="text"
                          value={basicInfo.companyAddress}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, companyAddress: e.target.value }))}
                          placeholder="e.g., KN 5 Rd, Kigali, Rwanda"
                          disabled={!isEditEnabled || basicInfo.employmentStatus !== 'employed'}
                          style={{
                            ...inputStyle,
                            opacity: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 0.5 : 1,
                            cursor: (!isEditEnabled || basicInfo.employmentStatus !== 'employed') ? 'not-allowed' : 'text'
                          }}
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

                    {/* About */}
                    <div style={sectionTitleStyle}>
                      <span>About</span>
                    </div>
                    <textarea
                      value={overviewData.about}
                      onChange={(e) => setOverviewData(prev => ({ ...prev, about: e.target.value }))}
                      placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                      rows={4}
                      disabled={!isEditEnabled}
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: '2rem' }}
                    />

                    {/* Specialties */}
                    <div style={sectionTitleStyle}>
                      <span>Specialties *</span>
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
                      {availableSpecialties.map((specialty) => {
                        const isSelected = overviewData.specialties.includes(specialty);
                        return (
                          <button
                            key={specialty}
                            onClick={() => isEditEnabled && toggleSpecialty(specialty)}
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
                            {specialty}
                          </button>
                        );
                      })}
                    </div>

                    {/* Equipment */}
                    <div style={sectionTitleStyle}>
                      <span>Equipment</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, marginBottom: '1rem' }}>
                      List your photography equipment (cameras, lenses, drones, etc.)
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input
                        type="text"
                        value={newEquipment}
                        onChange={(e) => setNewEquipment(e.target.value)}
                        placeholder="e.g., Canon EOS R5"
                        onKeyPress={(e) => e.key === 'Enter' && isEditEnabled && addEquipment()}
                        disabled={!isEditEnabled}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={addEquipment}
                        disabled={!isEditEnabled}
                        style={{
                          backgroundColor: isEditEnabled ? '#083A85' : colors.bgTertiary,
                          color: isEditEnabled ? 'white' : colors.textSecondary,
                          border: isEditEnabled ? 'none' : `2px solid ${colors.borderPrimary}`,
                          borderRadius: '0.5rem',
                          padding: '0 1rem',
                          cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontWeight: '500',
                          opacity: isEditEnabled ? 1 : 0.6
                        }}
                      >
                        <PlusIcon /> Add
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {overviewData.equipments.map((equipment, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: colors.bgTertiary,
                            borderRadius: '0.5rem',
                            border: `1px solid ${colors.borderPrimary}`
                          }}
                        >
                          {editingEquipmentIndex === index ? (
                            <>
                              <input
                                type="text"
                                value={equipment}
                                onChange={(e) => updateEquipment(index, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingEquipmentIndex(null);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingEquipmentIndex(null);
                                  }
                                }}
                                autoFocus
                                style={{
                                  ...inputStyle,
                                  flex: 1,
                                  padding: '0.5rem 0.75rem'
                                }}
                              />
                              <button
                                onClick={() => setEditingEquipmentIndex(null)}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                                  border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85'
                                }}
                                title="Save"
                              >
                                <CheckIcon />
                              </button>
                            </>
                          ) : (
                            <>
                              <span style={{
                                flex: 1,
                                fontSize: '0.95rem',
                                color: colors.textPrimary
                              }}>
                                {equipment}
                              </span>
                              <button
                                onClick={() => isEditEnabled && setEditingEquipmentIndex(index)}
                                disabled={!isEditEnabled}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${colors.borderPrimary}`,
                                  borderRadius: '0.375rem',
                                  cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: colors.textTertiary,
                                  transition: 'all 0.2s',
                                  opacity: isEditEnabled ? 1 : 0.5
                                }}
                                onMouseEnter={(e) => {
                                  if (isEditEnabled) {
                                    e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF';
                                    e.currentTarget.style.borderColor = actualTheme === 'dark' ? '#60A5FA' : '#083A85';
                                    e.currentTarget.style.color = actualTheme === 'dark' ? '#60A5FA' : '#083A85';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = colors.borderPrimary;
                                  e.currentTarget.style.color = colors.textTertiary;
                                }}
                                title="Edit equipment"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (isEditEnabled) {
                                    setOverviewData(prev => ({
                                      ...prev,
                                      equipments: prev.equipments.filter((_, i) => i !== index)
                                    }));
                                  }
                                }}
                                disabled={!isEditEnabled}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${colors.borderPrimary}`,
                                  borderRadius: '0.375rem',
                                  cursor: isEditEnabled ? 'pointer' : 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: colors.textTertiary,
                                  transition: 'all 0.2s',
                                  opacity: isEditEnabled ? 1 : 0.5
                                }}
                                onMouseEnter={(e) => {
                                  if (isEditEnabled) {
                                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                                    e.currentTarget.style.borderColor = '#EF4444';
                                    e.currentTarget.style.color = '#EF4444';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = colors.borderPrimary;
                                  e.currentTarget.style.color = colors.textTertiary;
                                }}
                                title="Remove equipment"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div>
                    {/* Beliefs / Philosophy */}
                    <div style={sectionTitleStyle}>
                      <span>Professional Philosophy</span>
                    </div>
                    <textarea
                      value={portfolioData.beliefs}
                      onChange={(e) => setPortfolioData(prev => ({ ...prev, beliefs: e.target.value }))}
                      placeholder="Share your professional philosophy and what you believe makes great photography..."
                      rows={3}
                      disabled={!isEditEnabled}
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: '2rem' }}
                    />

                    {/* Skills */}
                    <div style={sectionTitleStyle}>
                      <span>Skills</span>
                      <button
                        onClick={addSkill}
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
                        <PlusIcon /> Add Skill
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                      {portfolioData.skills.map((skill) => (
                        <div key={skill.id} className="mobile-skill-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          backgroundColor: colors.bgTertiary,
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${colors.borderPrimary}`,
                          ...(newlyAddedId === skill.id ? newItemAnimation : {})
                        }}>
                          {editingSkillId === skill.id ? (
                            <>
                              <input
                                type="text"
                                value={skill.name}
                                onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && skill.name.trim()) {
                                    setEditingSkillId(null);
                                  }
                                  if (e.key === 'Escape') {
                                    if (!skill.name.trim()) {
                                      removeSkill(skill.id);
                                    } else {
                                      setEditingSkillId(null);
                                    }
                                  }
                                }}
                                placeholder="Skill name"
                                autoFocus
                                style={{ ...inputStyle, flex: 1, padding: '0.5rem 0.75rem' }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' }}>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={skill.level}
                                  onChange={(e) => updateSkill(skill.id, 'level', parseInt(e.target.value))}
                                  style={{ flex: 1, accentColor: actualTheme === 'dark' ? '#60A5FA' : '#083A85' }}
                                />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: actualTheme === 'dark' ? '#60A5FA' : '#083A85', minWidth: '40px' }}>
                                  {skill.level}%
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  if (skill.name.trim()) {
                                    setEditingSkillId(null);
                                  }
                                }}
                                disabled={!skill.name.trim()}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: skill.name.trim() ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgTertiary,
                                  border: `1px solid ${skill.name.trim() ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.borderPrimary}`,
                                  borderRadius: '0.375rem',
                                  cursor: skill.name.trim() ? 'pointer' : 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: skill.name.trim() ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textTertiary,
                                  opacity: skill.name.trim() ? 1 : 0.5
                                }}
                                title="Save"
                              >
                                <CheckIcon />
                              </button>
                              <button
                                onClick={() => removeSkill(skill.id)}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${colors.borderPrimary}`,
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
                                title="Remove skill"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <div style={{ flex: 1 }}>
                                <span style={{
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  color: colors.textPrimary
                                }}>
                                  {skill.name}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '160px' }}>
                                <div style={{
                                  flex: 1,
                                  height: '8px',
                                  backgroundColor: actualTheme === 'dark' ? '#374151' : '#E5E7EB',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${skill.level}%`,
                                    height: '100%',
                                    backgroundColor: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <span style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                                  minWidth: '40px'
                                }}>
                                  {skill.level}%
                                </span>
                              </div>
                              <button
                                onClick={() => setEditingSkillId(skill.id)}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${colors.borderPrimary}`,
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: colors.textTertiary,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF';
                                  e.currentTarget.style.borderColor = actualTheme === 'dark' ? '#60A5FA' : '#083A85';
                                  e.currentTarget.style.color = actualTheme === 'dark' ? '#60A5FA' : '#083A85';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = colors.borderPrimary;
                                  e.currentTarget.style.color = colors.textTertiary;
                                }}
                                title="Edit skill"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => removeSkill(skill.id)}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${colors.borderPrimary}`,
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
                                title="Remove skill"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  const success = await addSkillToAPI(skill);
                                  showToast(success ? 'success' : 'error',
                                    success ? 'Skill saved successfully' : 'Failed to save skill');
                                }}
                                disabled={savingSkill === skill.id || !skill.name}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: savingSkill === skill.id ? '#9CA3AF' : '#083A85',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: savingSkill === skill.id || !skill.name ? 'not-allowed' : 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                }}
                                title="Save to server"
                              >
                                {savingSkill === skill.id ? '...' : 'Save'}
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Education */}
                    <div style={sectionTitleStyle}>
                      <span>Education</span>
                      <button
                        onClick={addEducation}
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
                        <PlusIcon /> Add Education
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {portfolioData.education.map((edu) => (
                        <div key={edu.id} style={{
                          backgroundColor: colors.bgTertiary,
                          padding: '1.25rem',
                          borderRadius: '0.5rem',
                          position: 'relative',
                          ...(newlyAddedId === edu.id ? newItemAnimation : {})
                        }}>
                          <div className="mobile-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div>
                              <label style={labelStyle}>Degree/Certificate</label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="e.g., Bachelor of Fine Arts"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Institution</label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                placeholder="e.g., School of Visual Arts"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Duration</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select
                                  value={edu.fromYear}
                                  onChange={(e) => updateEducation(edu.id, 'fromYear', e.target.value)}
                                  style={{ ...inputStyle, flex: 1 }}
                                >
                                  <option value="">From Year</option>
                                  {yearOptions.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                                <span style={{ color: colors.textSecondary }}>to</span>
                                <select
                                  value={edu.toYear}
                                  onChange={(e) => updateEducation(edu.id, 'toYear', e.target.value)}
                                  style={{ ...inputStyle, flex: 1 }}
                                >
                                  <option value="">To Year</option>
                                  {yearOptionsWithPresent.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label style={labelStyle}>Description</label>
                              <input
                                type="text"
                                value={edu.description}
                                onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                                placeholder="Brief description"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                              onClick={() => removeEducation(edu.id)}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#EF4444',
                                border: '1px solid #EF4444',
                                borderRadius: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                            <button
                              onClick={async () => {
                                const success = await saveEducationToAPI(edu);
                                showToast(success ? 'success' : 'error',
                                  success ? 'Education saved successfully' : 'Failed to save education');
                              }}
                              disabled={savingEducation === edu.id || !edu.degree || !edu.institution}
                              style={{
                                backgroundColor: savingEducation === edu.id ? '#9CA3AF' : '#083A85',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: savingEducation === edu.id || !edu.degree || !edu.institution ? 'not-allowed' : 'pointer',
                                opacity: !edu.degree || !edu.institution ? 0.5 : 1,
                              }}
                            >
                              {savingEducation === edu.id ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Qualifications/Certifications */}
                    <div style={sectionTitleStyle}>
                      <span>Certifications</span>
                      <button
                        onClick={addQualification}
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
                        <PlusIcon /> Add Certification
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {portfolioData.qualifications.map((qual) => (
                        <div key={qual.id} style={{
                          backgroundColor: colors.bgTertiary,
                          padding: '1.25rem',
                          borderRadius: '0.5rem',
                          position: 'relative',
                          ...(newlyAddedId === qual.id ? newItemAnimation : {})
                        }}>
                          <div className="mobile-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div>
                              <label style={labelStyle}>Certificate Title</label>
                              <input
                                type="text"
                                value={qual.title}
                                onChange={(e) => updateQualification(qual.id, 'title', e.target.value)}
                                placeholder="e.g., Certified Professional Photographer"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Issuing Organization</label>
                              <input
                                type="text"
                                value={qual.issuer}
                                onChange={(e) => updateQualification(qual.id, 'issuer', e.target.value)}
                                placeholder="e.g., PPA"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Year Obtained</label>
                              <select
                                value={qual.year}
                                onChange={(e) => updateQualification(qual.id, 'year', e.target.value)}
                                style={inputStyle}
                              >
                                <option value="">Select Year</option>
                                {yearOptions.map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>Description</label>
                              <input
                                type="text"
                                value={qual.description}
                                onChange={(e) => updateQualification(qual.id, 'description', e.target.value)}
                                placeholder="Brief description"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Training */}
                    <div style={sectionTitleStyle}>
                      <span>Training & Workshops</span>
                      <button
                        onClick={addTraining}
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
                        <PlusIcon /> Add Training
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {portfolioData.training.map((training) => (
                        <div key={training.id} style={{
                          backgroundColor: colors.bgTertiary,
                          padding: '1.25rem',
                          borderRadius: '0.5rem',
                          position: 'relative',
                          ...(newlyAddedId === training.id ? newItemAnimation : {})
                        }}>
                          <button
                            onClick={() => removeTraining(training.id)}
                            style={{
                              position: 'absolute',
                              top: '0.75rem',
                              right: '0.75rem',
                              padding: '0.5rem',
                              backgroundColor: 'transparent',
                              border: `1px solid ${colors.borderPrimary}`,
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
                            title="Remove training"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', paddingRight: '2.5rem' }}>
                            <div>
                              <label style={labelStyle}>Training/Workshop Name</label>
                              <input
                                type="text"
                                value={training.name}
                                onChange={(e) => updateTraining(training.id, 'name', e.target.value)}
                                placeholder="e.g., Advanced Wedding Photography Workshop"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Issuing Institution</label>
                              <input
                                type="text"
                                value={training.issuer}
                                onChange={(e) => updateTraining(training.id, 'issuer', e.target.value)}
                                placeholder="e.g., Photography Academy"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Year Completed</label>
                              <select
                                value={training.year}
                                onChange={(e) => updateTraining(training.id, 'year', e.target.value)}
                                style={inputStyle}
                              >
                                <option value="">Select Year</option>
                                {yearOptions.map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>Description</label>
                              <input
                                type="text"
                                value={training.description}
                                onChange={(e) => updateTraining(training.id, 'description', e.target.value)}
                                placeholder="Brief description of what you learned"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                              onClick={async () => {
                                const success = await addTrainingToAPI(training, 'TRAINING');
                                showToast(success ? 'success' : 'error',
                                  success ? 'Training saved successfully' : 'Failed to save training');
                              }}
                              disabled={savingTraining === training.id || !training.name}
                              style={{
                                backgroundColor: savingTraining === training.id ? '#9CA3AF' : '#083A85',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: savingTraining === training.id || !training.name ? 'not-allowed' : 'pointer',
                                opacity: !training.name ? 0.5 : 1,
                              }}
                            >
                              {savingTraining === training.id ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Featured Projects */}
                    <div style={sectionTitleStyle}>
                      <span>Featured Projects</span>
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
                          border: `1px solid ${colors.borderPrimary}`
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
                                border: `1px solid ${colors.borderPrimary}`,
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

                      {/* Empty state */}
                      {portfolioData.projects.length === 0 && (
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
                      <span>Work Experience</span>
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
                          border: `1px solid ${colors.borderPrimary}`,
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
                              border: `1px solid ${colors.borderPrimary}`,
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
                        </div>
                      ))}

                      {experienceData.experiences.length === 0 && (
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
    </div>
  );
};

export default PhotographerProfilePage;
