"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import localforage from 'localforage';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';

// Configure localforage for profile form data
const profileFormStorage = localforage.createInstance({
  name: 'connekt-dashboard',
  storeName: 'profile_form_draft'
});

// Storage key for the profile form
const PROFILE_FORM_KEY = 'profile_form_draft';

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
    availabilityStartDay: string;
    availabilityEndDay: string;
    availableStartTime: string;
    availableEndTime: string;
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
  userType: 'photographer' | 'freelancer';
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
  year: string;
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

interface PhotographerProfilePageProps {
  userType?: 'photographer' | 'freelancer';
}

const PhotographerProfilePage = ({ userType = 'photographer' }: PhotographerProfilePageProps) => {
  const { colors, actualTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'experience'>('overview');

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
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  // Year options for selectors (from 1970 to current year + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1970 + 11 }, (_, i) => (currentYear + 10 - i).toString());
  const yearOptionsWithPresent = ['Present', ...yearOptions];

  // Basic Information State
  const [basicInfo, setBasicInfo] = useState({
    fullName: 'John Smith',
    username: userType === 'freelancer' ? 'john_freelancer' : 'john_photographer',
    email: 'johnsmith@gmail.com',
    phoneCode: '+250',
    phoneNumber: '788 456 789',
    specialty: 'Photographer' as 'Photographer' | 'Videographer',
    country: 'Rwanda',
    province: 'Kigali City',
    district: 'Gasabo',
    sector: 'Remera',
    availabilityStartDay: 'Monday',
    availabilityEndDay: 'Saturday',
    availableStartTime: '8:00 AM',
    availableEndTime: '6:00 PM',
  });

  // Overview Tab State
  const [overviewData, setOverviewData] = useState({
    about: 'Professional photographer with over 10 years of experience specializing in weddings, corporate events, and portrait photography. Passionate about capturing life\'s precious moments with creativity and precision.',
    specialties: ['Wedding', 'Portrait', 'Corporate'] as string[],
    equipments: ['Canon EOS R5', 'Sony A7 IV', 'DJI Mavic 3 Pro'] as string[],
  });

  // Portfolio Tab State
  const [portfolioData, setPortfolioData] = useState({
    beliefs: 'I believe that every moment tells a story. My philosophy is to capture authentic emotions and create timeless memories that families will cherish for generations.',
    skills: [
      { id: '1', name: 'Portrait Photography', level: 95 },
      { id: '2', name: 'Wedding Photography', level: 90 },
      { id: '3', name: 'Event Coverage', level: 85 },
    ] as Skill[],
    education: [
      { id: '1', degree: 'Bachelor of Fine Arts in Photography', institution: 'School of Visual Arts', fromYear: '2015', toYear: '2019', description: 'Specialized in commercial and artistic photography with honors.' }
    ] as Education[],
    qualifications: [
      { id: '1', title: 'Certified Professional Photographer', issuer: 'Professional Photographers of America', year: '2020', description: 'Advanced certification in professional photography practices.' }
    ] as Qualification[],
    training: [
      { id: '1', name: 'Advanced Wedding Photography Workshop', year: '2022' },
      { id: '2', name: 'Lighting Masterclass by Peter Hurley', year: '2021' },
    ] as Training[],
    projects: [] as Project[],
  });

  // Experience Tab State
  const [experienceData, setExperienceData] = useState({
    experiences: [
      {
        id: '1',
        position: 'Lead Wedding Photographer',
        company: 'Elite Studios',
        location: 'Kigali, Rwanda',
        startDate: '2020',
        endDate: 'Present',
        description: 'Leading a team of photographers for high-end wedding coverage. Responsible for client consultations, creative direction, and post-production workflow.'
      },
      {
        id: '2',
        position: 'Freelance Photographer',
        company: 'Self-Employed',
        location: 'Kigali, Rwanda',
        startDate: '2018',
        endDate: '2020',
        description: 'Provided photography services for corporate events, portraits, and small weddings. Built a client base of over 50 regular customers.'
      }
    ] as Experience[],
  });

  // Image state
  const [profileImage, setProfileImage] = useState<string>('https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg');
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  // File input refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const projectImageInputRef = useRef<HTMLInputElement>(null);

  // New item input states
  const [newEquipment, setNewEquipment] = useState('');
  const [isRestoringDraft, setIsRestoringDraft] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save profile form data to IndexedDB
  const saveProfileDraft = useCallback(async () => {
    const formData: ProfileFormData = {
      basicInfo,
      overviewData,
      portfolioData,
      experienceData,
      userType,
      savedAt: Date.now()
    };

    try {
      await profileFormStorage.setItem(`${PROFILE_FORM_KEY}_${userType}`, formData);
    } catch (error) {
      console.error('Failed to save profile draft:', error);
    }
  }, [basicInfo, overviewData, portfolioData, experienceData, userType]);

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
        const savedDraft = await profileFormStorage.getItem<ProfileFormData>(`${PROFILE_FORM_KEY}_${userType}`);
        if (savedDraft && savedDraft.userType === userType) {
          setIsRestoringDraft(true);

          if (savedDraft.basicInfo) setBasicInfo(savedDraft.basicInfo);
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
  const addEquipment = () => {
    if (newEquipment.trim()) {
      setOverviewData(prev => ({
        ...prev,
        equipments: [...prev.equipments, newEquipment.trim()]
      }));
      setNewEquipment('');
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
    setPortfolioData(prev => ({
      ...prev,
      skills: [...prev.skills, { id: Date.now().toString(), name: '', level: 50 }]
    }));
  };

  const updateSkill = (id: string, field: keyof Skill, value: string | number) => {
    setPortfolioData(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  // Education handlers
  const addEducation = () => {
    setPortfolioData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: '', institution: '', fromYear: '', toYear: '', description: '' }]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  // Qualification handlers
  const addQualification = () => {
    setPortfolioData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { id: Date.now().toString(), title: '', issuer: '', year: '', description: '' }]
    }));
  };

  const updateQualification = (id: string, field: keyof Qualification, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  // Training handlers
  const addTraining = () => {
    setPortfolioData(prev => ({
      ...prev,
      training: [...prev.training, { id: Date.now().toString(), name: '', year: '' }]
    }));
  };

  // Update training field
  const updateTraining = (id: string, field: keyof Training, value: string) => {
    setPortfolioData(prev => ({
      ...prev,
      training: prev.training.map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  // Experience handlers
  const addExperience = () => {
    setExperienceData(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        id: Date.now().toString(),
        position: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperienceData(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
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
    border: `2px solid ${colors.borderPrimary}`,
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    color: colors.textPrimary,
    backgroundColor: colors.bgCard,
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: '0.5rem'
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
        <Topbar userRole={userType} tipsAmount={275.00} bonusAmount={725.00} balanceAmount={4975.00} />

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
            <button
              className="save-button-enhanced"
              style={{
                backgroundColor: '#083A85',
                color: 'white',
                border: '2px solid #062a63',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Save Changes
            </button>
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
                      border: '4px solid white'
                    }}>
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
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
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, fullName: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Username</label>
                        <input
                          type="text"
                          value={basicInfo.username}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, username: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input
                          type="email"
                          value={basicInfo.email}
                          disabled
                          style={{ ...inputStyle, backgroundColor: colors.bgTertiary, cursor: 'not-allowed' }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select
                            value={basicInfo.phoneCode}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, phoneCode: e.target.value }))}
                            style={{ ...inputStyle, width: '110px' }}
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
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Specialty *</label>
                        <select
                          value={basicInfo.specialty}
                          onChange={(e) => setBasicInfo(prev => ({ ...prev, specialty: e.target.value as 'Photographer' | 'Videographer' }))}
                          style={inputStyle}
                        >
                          <option value="Photographer">Photographer</option>
                          <option value="Videographer">Videographer</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Country</label>
                        <select
                          value={basicInfo.country}
                          onChange={(e) => {
                            setBasicInfo(prev => ({ ...prev, country: e.target.value }));
                            if (e.target.value !== 'Rwanda') {
                              setBasicInfo(prev => ({ ...prev, province: '', district: '', sector: '' }));
                            }
                          }}
                          style={inputStyle}
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
                            onChange={(e) => {
                              const districts = rwandaProvinces[e.target.value] || [];
                              setBasicInfo(prev => ({ ...prev, province: e.target.value, district: districts[0] || '' }));
                            }}
                            style={inputStyle}
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
                            style={inputStyle}
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
                            style={inputStyle}
                          />
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Availability Days</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            value={basicInfo.availabilityStartDay}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, availabilityStartDay: e.target.value }))}
                            style={{ ...inputStyle, flex: 1 }}
                          >
                            {daysOfWeek.map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                          <span style={{ color: colors.textSecondary }}>to</span>
                          <select
                            value={basicInfo.availabilityEndDay}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, availabilityEndDay: e.target.value }))}
                            style={{ ...inputStyle, flex: 1 }}
                          >
                            {daysOfWeek.map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Available Time</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            value={basicInfo.availableStartTime}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, availableStartTime: e.target.value }))}
                            style={{ ...inputStyle, flex: 1 }}
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          <span style={{ color: colors.textSecondary }}>to</span>
                          <select
                            value={basicInfo.availableEndTime}
                            onChange={(e) => setBasicInfo(prev => ({ ...prev, availableEndTime: e.target.value }))}
                            style={{ ...inputStyle, flex: 1 }}
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
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
                            onClick={() => toggleSpecialty(specialty)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '2rem',
                              border: isSelected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                              backgroundColor: isSelected ? (actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.bgCard,
                              color: isSelected ? (actualTheme === 'dark' ? '#60A5FA' : '#083A85') : colors.textSecondary,
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              transition: 'all 0.2s'
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
                        onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={addEquipment}
                        style={{
                          backgroundColor: '#083A85',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0 1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontWeight: '500'
                        }}
                      >
                        <PlusIcon /> Add
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {overviewData.equipments.map((equipment, index) => (
                        <input
                          key={index}
                          type="text"
                          value={equipment}
                          onChange={(e) => updateEquipment(index, e.target.value)}
                          style={{
                            ...inputStyle,
                            backgroundColor: colors.bgTertiary
                          }}
                        />
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
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: '2rem' }}
                    />

                    {/* Skills */}
                    <div style={sectionTitleStyle}>
                      <span>Skills</span>
                      <button
                        onClick={addSkill}
                        style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                          border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <PlusIcon /> Add Skill
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {portfolioData.skills.map((skill) => (
                        <div key={skill.id} className="mobile-skill-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          backgroundColor: colors.bgTertiary,
                          padding: '1rem',
                          borderRadius: '0.5rem'
                        }}>
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                            placeholder="Skill name"
                            style={{ ...inputStyle, flex: 1 }}
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
                        </div>
                      ))}
                    </div>

                    {/* Education */}
                    <div style={sectionTitleStyle}>
                      <span>Education</span>
                      <button
                        onClick={addEducation}
                        style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                          border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
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
                          borderRadius: '0.5rem'
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
                        </div>
                      ))}
                    </div>

                    {/* Qualifications/Certifications */}
                    <div style={sectionTitleStyle}>
                      <span>Certifications</span>
                      <button
                        onClick={addQualification}
                        style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                          border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
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
                          borderRadius: '0.5rem'
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
                        style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                          border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <PlusIcon /> Add Training
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {portfolioData.training.map((training) => (
                        <div key={training.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          backgroundColor: colors.bgTertiary,
                          padding: '1rem',
                          borderRadius: '0.5rem'
                        }}>
                          <input
                            type="text"
                            value={training.name}
                            onChange={(e) => updateTraining(training.id, 'name', e.target.value)}
                            placeholder="Training/Workshop name"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <select
                            value={training.year}
                            onChange={(e) => updateTraining(training.id, 'year', e.target.value)}
                            style={{ ...inputStyle, width: '140px' }}
                          >
                            <option value="">Year</option>
                            {yearOptions.map((year) => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Featured Projects */}
                    <div style={sectionTitleStyle}>
                      <span>Featured Projects</span>
                      <button
                        onClick={addProject}
                        style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                          border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
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
                              borderRadius: project.image ? '0' : '0.5rem'
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
                              <div style={{
                                position: 'absolute',
                                inset: 0,
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
                            style={{
                              backgroundColor: '#083A85',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              padding: '0.75rem 1.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
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
                        style={{
                          backgroundColor: actualTheme === 'dark' ? '#1E3A5F' : '#EFF6FF',
                          color: actualTheme === 'dark' ? '#60A5FA' : '#083A85',
                          border: `1px solid ${actualTheme === 'dark' ? '#60A5FA' : '#083A85'}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
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
                          border: `1px solid ${colors.borderPrimary}`
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
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
                            style={{
                              backgroundColor: '#083A85',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              padding: '0.75rem 1.5rem',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
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
    </div>
  );
};

export default PhotographerProfilePage;
