"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import CompleteProfileModal from '../../components/CompleteProfileModal';

function getApiUrl(): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://197.243.24.101';
}
import {
  StatCard,
  ActivityItem,
  PaymentItem,
  PerformanceChart,
  MoneyIcon,
  ClockIcon,
  UsersIcon,
  GiftIcon,
  StarIcon
} from '../../components/dashboard';

// Compare icon for toggle button
const CompareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3H5C3.89543 3 3 3.89543 3 5V9M9 3V1M9 3V5M9 3H11M15 3H19C20.1046 3 21 3.89543 21 5V9M15 3V1M15 3V5M15 3H13M3 15V19C3 20.1046 3.89543 21 5 21H9M3 15H1M3 15H5M3 15V13M21 15V19C21 20.1046 20.1046 21 19 21H15M21 15H23M21 15H19M21 15V13M9 21V23M9 21V19M9 21H11M15 21V23M15 21V19M15 21H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8V16M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Target icon for future plan
const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Edit icon
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Future Plan interface
interface FuturePlan {
  id: string;
  name: string;
  timePeriod: 'today' | 'week' | 'month' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  targetEarnings: string;
  targetPending: string;
  targetClients: string;
  targetBonuses: string;
  targetRatings: string;
  targetPerformance: {
    day: string;
    value1: number;
    value2: number;
  }[];
  createdAt: string;
}

// Eye icon for view details
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Heartwarming greeting variations based on time of day
const getGreetings = (timeOfDay: string) => {
  const morningGreetings = [
    "Good Morning",
    "Rise and Shine",
    "Beautiful Morning",
    "Lovely Morning",
    "Wonderful Morning",
    "Great Morning",
    "Happy Morning",
    "Blessed Morning"
  ];

  const afternoonGreetings = [
    "Good Afternoon",
    "Lovely Afternoon",
    "Beautiful Afternoon",
    "Wonderful Afternoon",
    "Great Afternoon",
    "Happy Afternoon",
    "Blessed Afternoon",
    "Amazing Afternoon"
  ];

  const eveningGreetings = [
    "Good Evening",
    "Lovely Evening",
    "Beautiful Evening",
    "Wonderful Evening",
    "Great Evening",
    "Happy Evening",
    "Peaceful Evening",
    "Relaxing Evening"
  ];

  const nightGreetings = [
    "Good Night",
    "Peaceful Night",
    "Lovely Night",
    "Beautiful Night",
    "Wonderful Night",
    "Quiet Night",
    "Restful Night",
    "Starry Night"
  ];

  switch (timeOfDay) {
    case 'morning': return morningGreetings;
    case 'afternoon': return afternoonGreetings;
    case 'evening': return eveningGreetings;
    default: return nightGreetings;
  }
};

// Static subtitle based on time of day
const getStaticMessage = (timeOfDay: string) => {
  switch (timeOfDay) {
    case 'morning': return "Ready to capture some beautiful moments today?";
    case 'afternoon': return "Keep up the great work! Your clients love what you do.";
    case 'evening': return "What a day! Time to review those amazing shots.";
    default: return "Burning the midnight oil? Your dedication is inspiring!";
  }
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

interface Client {
  id: string;
  name: string;
  event: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  avatar: string;
}

const PhotographerDashboard = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Comparison mode state
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [futurePlans, setFuturePlans] = useState<FuturePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FuturePlan | null>(null);
  const [planTimePeriod, setPlanTimePeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FuturePlan | null>(null);

  // Profile completion modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // API data state
  const [analytics, setAnalytics] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [apiClients, setApiClients] = useState<Client[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ label: string; value: string; valueColor?: string }[]>([]);
  const [recentPayments, setRecentPayments] = useState<{ name: string; type: string; amount: string; avatar?: string; logo?: string }[]>([]);
  const [performanceData, setPerformanceData] = useState([
    { day: 'Sun', value1: 0, value2: 0 },
    { day: 'Mon', value1: 0, value2: 0 },
    { day: 'Tue', value1: 0, value2: 0 },
    { day: 'Wed', value1: 0, value2: 0 },
    { day: 'Thu', value1: 0, value2: 0 },
    { day: 'Fri', value1: 0, value2: 0 },
    { day: 'Sat', value1: 0, value2: 0 }
  ]);
  const [statTrends, setStatTrends] = useState<Record<string, { percentage: string; trend: 'up' | 'down' }>>({
    totalEarnings: { percentage: '0%', trend: 'up' },
    pending: { percentage: '0%', trend: 'up' },
    clients: { percentage: '0%', trend: 'up' },
    bonuses: { percentage: '0%', trend: 'up' },
    rating: { percentage: '0%', trend: 'up' },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch static dashboard data (once on mount)
  useEffect(() => {
    const fetchStaticData = async () => {
      const apiUrl = getApiUrl();
      try {
        const [analyticsRes, balanceRes, clientsRes, transactionsRes] = await Promise.allSettled([
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/analytics`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/balance`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/clients`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/transactions?page=0&size=5`),
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
          const data = await analyticsRes.value.json();
          if (data.action === 1 && data.data) setAnalytics(data.data);
        }
        if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
          const data = await balanceRes.value.json();
          if (data.action === 1 && data.data) setBalance(data.data);
        }
        if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
          const data = await clientsRes.value.json();
          if (data.action === 1 && data.data) {
            const mapped: Client[] = (Array.isArray(data.data) ? data.data : data.data.content || []).slice(0, 3).map((c: any) => ({
              id: c.id || c.customerId || String(Math.random()),
              name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client',
              event: c.lastEventType || c.eventType || 'Photography',
              status: (c.status === 'active' ? 'In Progress' : c.status === 'completed' ? 'Completed' : 'Pending') as Client['status'],
              avatar: c.profileImage || c.profilePicture || c.avatar || '/default-avatar.png',
            }));
            setApiClients(mapped);
          }
        }
        if (transactionsRes.status === 'fulfilled' && transactionsRes.value.ok) {
          const data = await transactionsRes.value.json();
          if (data.action === 1 && data.data) {
            const txns = Array.isArray(data.data) ? data.data : data.data.content || [];
            const mapped = txns.slice(0, 3).map((t: any) => ({
              name: t.clientName || t.customerName || t.photographerName || 'Payment',
              type: t.paymentType || t.type || t.service || 'Earnings',
              amount: formatPrice(t.amount || 0),
              avatar: t.clientImage || t.customerImage || t.photographerImage || undefined,
              logo: (!t.clientImage && !t.customerImage) ? '/logo.png' : undefined,
            }));
            setRecentPayments(mapped);
          }
        }
      } catch (error) {
        console.error('[Photographer Dashboard] Error fetching static data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaticData();
  }, []);

  // Fetch performance chart & trends (re-fetches when filter changes)
  useEffect(() => {
    const fetchFilteredData = async () => {
      const apiUrl = getApiUrl();
      const periodParam = activeFilter === 'today' ? 'today' : activeFilter === 'month' ? 'month' : 'week';
      try {
        const [performanceRes, trendsRes] = await Promise.allSettled([
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/performance?period=${periodParam}`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/trends?period=${periodParam}`),
        ]);

        if (performanceRes.status === 'fulfilled' && performanceRes.value.ok) {
          const data = await performanceRes.value.json();
          if (data.action === 1 && Array.isArray(data.data)) {
            setPerformanceData(data.data.map((d: any) => ({
              day: d.day || '',
              value1: Number(d.value1) || 0,
              value2: Number(d.value2) || 0,
            })));
          }
        }

        if (trendsRes.status === 'fulfilled' && trendsRes.value.ok) {
          const data = await trendsRes.value.json();
          if (data.action === 1 && data.data) {
            const t = data.data;
            setStatTrends({
              totalEarnings: { percentage: t.totalEarnings?.percentage || '0%', trend: t.totalEarnings?.trend || 'up' },
              pending: { percentage: t.pending?.percentage || '0%', trend: t.pending?.trend || 'up' },
              clients: { percentage: t.clients?.percentage || '0%', trend: t.clients?.trend || 'up' },
              bonuses: { percentage: t.bonuses?.percentage || '0%', trend: t.bonuses?.trend || 'up' },
              rating: { percentage: t.rating?.percentage || '0%', trend: t.rating?.trend || 'up' },
            });
          }
        }
      } catch (error) {
        console.error('[Photographer Dashboard] Error fetching filtered data:', error);
      }
    };
    fetchFilteredData();
  }, [activeFilter]);

  // Form state for creating future plan
  const [planForm, setPlanForm] = useState({
    name: '',
    targetEarnings: '',
    targetPending: '',
    targetClients: '',
    targetBonuses: '',
    targetRatings: '',
    customStartDate: '',
    customEndDate: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
      if (showPlanDropdown) {
        setShowPlanDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown, showPlanDropdown]);

  useEffect(() => {
    // Update time of day and greetings
    const updateTimeOfDay = () => {
      const newTimeOfDay = getTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
        setTimeOfDay(newTimeOfDay);
        setGreetings(getGreetings(newTimeOfDay));
        setGreetingIndex(0);
      }
    };

    // Cycle through greetings every 5 seconds
    const greetingInterval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % greetings.length);
    }, 5000);

    // Check time of day every minute
    const timeInterval = setInterval(updateTimeOfDay, 60000);

    return () => {
      clearInterval(greetingInterval);
      clearInterval(timeInterval);
    };
  }, [timeOfDay, greetings.length]);

  // Show profile completion modal when profile fields are missing
  useEffect(() => {
    if (user && user.customerType?.toLowerCase() === 'photographer') {
      const isIncomplete = !user.about || !user.address ||
        !user.specialties?.length || !user.equipments?.length ||
        !user.professionalPhilosophy || !user.professionalSkills?.length ||
        !user.educationLevels?.length ||
        (!user.certifications?.length && !user.trainings?.length);

      if (isIncomplete) {
        const skipped = localStorage.getItem('profileModalSkipped');
        if (skipped) {
          try {
            const { timestamp } = JSON.parse(skipped);
            const thirtyMin = 30 * 60 * 1000;
            setShowProfileModal(Date.now() - timestamp > thirtyMin);
          } catch {
            setShowProfileModal(true);
          }
        } else {
          setShowProfileModal(true);
        }
      } else {
        setShowProfileModal(false);
      }
    }
  }, [user]);

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // Reset plan form
  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      targetEarnings: '',
      targetPending: '',
      targetClients: '',
      targetBonuses: '',
      targetRatings: '',
      customStartDate: '',
      customEndDate: ''
    });
    setPlanTimePeriod('week');
    setEditingPlan(null);
  };

  // Helper to parse numeric value from target string
  const parseTargetValue = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[$,]/g, '');
    const match = cleaned.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Generate performance target data from stat targets
  // This distributes the target values across the week for visualization
  const generatePerformanceTargets = (plan: FuturePlan) => {
    const earningsTarget = parseTargetValue(plan.targetEarnings);
    const clientsTarget = parseTargetValue(plan.targetClients);

    // Distribute targets across the week (value1 = earnings-based, value2 = clients-based)
    // Using weighted distribution to match typical work patterns
    const weeklyWeights = [0.08, 0.15, 0.18, 0.17, 0.18, 0.16, 0.08]; // Sun-Sat weights
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return days.map((day, index) => ({
      day,
      value1: Math.round(earningsTarget * weeklyWeights[index] * 10) / 10, // Scale for chart visibility
      value2: Math.round(clientsTarget * weeklyWeights[index] * 20) // Scale clients for chart
    }));
  };

  // Handle creating a new future plan
  const handleCreatePlan = () => {
    if (!planForm.name || !planForm.targetEarnings) {
      return; // Basic validation
    }

    const newPlan: FuturePlan = {
      id: `plan-${Date.now()}`,
      name: planForm.name,
      timePeriod: planTimePeriod,
      customStartDate: planTimePeriod === 'custom' ? planForm.customStartDate : undefined,
      customEndDate: planTimePeriod === 'custom' ? planForm.customEndDate : undefined,
      targetEarnings: planForm.targetEarnings,
      targetPending: planForm.targetPending,
      targetClients: planForm.targetClients,
      targetBonuses: planForm.targetBonuses,
      targetRatings: planForm.targetRatings,
      targetPerformance: [], // Will be generated dynamically
      createdAt: new Date().toISOString()
    };

    setFuturePlans(prev => [...prev, newPlan]);
    setSelectedPlan(newPlan);
    setShowPlanModal(false);
    setIsComparisonMode(true);
    // Sync the dashboard filter with the plan's time period
    setActiveFilter(planTimePeriod);
    resetPlanForm();
  };

  // Handle selecting an existing plan
  const handleSelectPlan = (plan: FuturePlan) => {
    setSelectedPlan(plan);
    setIsComparisonMode(true);
    // Sync the dashboard filter with the selected plan's time period
    setActiveFilter(plan.timePeriod);
  };

  // Handle deleting a plan
  const handleDeletePlan = (planId: string) => {
    setFuturePlans(prev => prev.filter(p => p.id !== planId));
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
      setIsComparisonMode(false);
    }
  };

  // Handle editing a plan - populate form with plan data
  const handleEditPlan = (plan: FuturePlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      targetEarnings: plan.targetEarnings,
      targetPending: plan.targetPending,
      targetClients: plan.targetClients,
      targetBonuses: plan.targetBonuses,
      targetRatings: plan.targetRatings,
      customStartDate: plan.customStartDate || '',
      customEndDate: plan.customEndDate || ''
    });
    setPlanTimePeriod(plan.timePeriod);
    setShowPlanModal(true);
    setShowPlanDropdown(false);
  };

  // Handle saving plan (create or update)
  const handleSavePlan = () => {
    if (!planForm.name || !planForm.targetEarnings) {
      return; // Basic validation
    }

    if (editingPlan) {
      // Update existing plan
      const updatedPlan: FuturePlan = {
        ...editingPlan,
        name: planForm.name,
        timePeriod: planTimePeriod,
        customStartDate: planTimePeriod === 'custom' ? planForm.customStartDate : undefined,
        customEndDate: planTimePeriod === 'custom' ? planForm.customEndDate : undefined,
        targetEarnings: planForm.targetEarnings,
        targetPending: planForm.targetPending,
        targetClients: planForm.targetClients,
        targetBonuses: planForm.targetBonuses,
        targetRatings: planForm.targetRatings
      };

      setFuturePlans(prev => prev.map(p => p.id === editingPlan.id ? updatedPlan : p));

      // Update selected plan if it's the one being edited
      if (selectedPlan?.id === editingPlan.id) {
        setSelectedPlan(updatedPlan);
      }

      setActiveFilter(planTimePeriod);
      setEditingPlan(null);
    } else {
      // Create new plan
      handleCreatePlan();
      return; // handleCreatePlan already resets form
    }

    setShowPlanModal(false);
    resetPlanForm();
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    if (isComparisonMode) {
      setIsComparisonMode(false);
      setSelectedPlan(null);
    } else if (futurePlans.length > 0) {
      setSelectedPlan(futurePlans[0]);
      setIsComparisonMode(true);
      // Sync filter with first plan's time period
      setActiveFilter(futurePlans[0].timePeriod);
    } else {
      // Initialize modal time period from current filter
      setPlanTimePeriod(activeFilter);
      setShowPlanModal(true);
    }
  };

  const currentGreeting = greetings[greetingIndex];
  const staticMessage = getStaticMessage(timeOfDay);

  const clients: Client[] = apiClients;

  // Base path for navigation
  const basePath = '/user/photographer';
  const periodLabel = activeFilter === 'today' ? 'yesterday' : activeFilter === 'month' ? 'last month' : 'last week';

  return (
    <>
      <style jsx>{`
        /* Desktop styles */
        .dashboard-container {
          display: flex;
          height: 100vh;
          background-color: ${colors.bgPrimary};
        }

        .dashboard-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dashboard-main {
          flex: 1;
          overflow-y: auto;
          background-color: ${colors.bgPrimary};
          padding-left: 1.25rem;
          padding-right: 1.25rem;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.125rem;
        }

        .header-stats {
          background-color: ${colors.bgCard};
          border-radius: 0.5rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          box-shadow: ${colors.shadowSm};
          border: 2px solid ${colors.borderPrimary};
          display: flex;
          gap: 2rem;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1rem;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .dashboard-main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-top: 0.75rem !important;
          }

          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }

          .header-stats {
            width: 100% !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            gap: 1rem !important;
            overflow-x: auto !important;
            justify-content: center !important;
          }

          .filter-buttons {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
          }

          .stat-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }

          .main-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }

        /* Extra small mobile (phones in portrait) */
        @media (max-width: 480px) {
          .dashboard-main {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <Sidebar />

        <div className="dashboard-content">
          <Topbar userRole="photographer" tipsAmount={balance?.totalTips || 0} bonusAmount={balance?.totalBonuses || analytics?.bonuses || 0} balanceAmount={balance?.totalBalance || balance?.balance || 0} />

          <div className="dashboard-main">
            <header className="dashboard-header">
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                lineHeight: '2rem',
                color: colors.textPrimary,
                fontWeight: '600',
                transition: 'opacity 0.3s ease'
              }}>
                {currentGreeting}, <span style={{ fontWeight: '600', color: colors.brandPrimary }}>{user?.firstName || 'there'}</span>
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: colors.textSecondary,
                marginTop: '0.25rem'
              }}>
                {staticMessage}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={toggleComparisonMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: isComparisonMode ? '2px solid #F20C8F' : '2px solid #0c943e',
                  backgroundColor: isComparisonMode ? '#F20C8F' : '#0c943e',
                  color: isComparisonMode ? 'white' : 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                  boxShadow: colors.shadowSm
                }}
              >
                <CompareIcon />
                {isComparisonMode ? 'Exit Comparison' : 'Compare Goals'}
              </button>
              {isComparisonMode && (
                <>
                  {futurePlans.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPlanDropdown(!showPlanDropdown);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: `2px solid ${colors.borderPrimary}`,
                          backgroundColor: colors.bgCard,
                          color: colors.textPrimary,
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.3s',
                          boxShadow: colors.shadowSm,
                          minWidth: '160px',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <TargetIcon />
                          {selectedPlan?.name || 'Select Plan'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transform: showPlanDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {showPlanDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          backgroundColor: colors.bgCard,
                          borderRadius: '0.5rem',
                          boxShadow: colors.shadowLg,
                          border: `2px solid ${colors.borderPrimary}`,
                          zIndex: 100,
                          minWidth: '220px',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {futurePlans.map((plan) => (
                            <div
                              key={plan.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                backgroundColor: selectedPlan?.id === plan.id ? 'rgba(242, 12, 143, 0.1)' : 'transparent',
                                borderLeft: selectedPlan?.id === plan.id ? '3px solid #F20C8F' : '3px solid transparent',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedPlan?.id !== plan.id) {
                                  e.currentTarget.style.backgroundColor = colors.bgHover;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedPlan?.id !== plan.id) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <div
                                onClick={() => {
                                  handleSelectPlan(plan);
                                  setShowPlanDropdown(false);
                                }}
                                style={{ flex: 1 }}
                              >
                                <div style={{
                                  fontWeight: '600',
                                  color: colors.textPrimary,
                                  fontSize: '0.875rem'
                                }}>{plan.name}</div>
                                <div style={{
                                  fontSize: '0.7rem',
                                  color: colors.textSecondary,
                                  marginTop: '0.125rem'
                                }}>
                                  {plan.timePeriod === 'custom'
                                    ? `${plan.customStartDate} - ${plan.customEndDate}`
                                    : plan.timePeriod === 'today' ? 'Today' : plan.timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPlan(plan);
                                  }}
                                  style={{
                                    padding: '0.375rem',
                                    color: colors.textTertiary,
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '0.25rem',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = colors.brandPrimary;
                                    e.currentTarget.style.backgroundColor = 'rgba(8, 58, 133, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = colors.textTertiary;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Edit plan"
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePlan(plan.id);
                                    if (futurePlans.length === 1) {
                                      setShowPlanDropdown(false);
                                    }
                                  }}
                                  style={{
                                    padding: '0.375rem',
                                    color: colors.textTertiary,
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '0.25rem',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ff4444';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = colors.textTertiary;
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Delete plan"
                                >
                                  <CloseIcon />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setPlanTimePeriod(activeFilter);
                      setShowPlanModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.brandPrimary}`,
                      backgroundColor: colors.brandPrimary,
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                      boxShadow: colors.shadowSm
                    }}
                  >
                    <TargetIcon />
                    New Plan
                  </button>
                </>
              )}
              <div style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.5rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              boxShadow: colors.shadowSm,
              border: `2px solid ${colors.borderPrimary}`,
              display: 'flex',
              gap: '2rem'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: colors.brandPrimary
                }}>Earnings</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{formatPrice(analytics?.totalEarnings || analytics?.earnings || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: colors.brandPrimary
                }}>Clients</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{analytics?.totalClients || analytics?.clients || 0}</span>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '1rem',
                  lineHeight: '1rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  color: colors.brandPrimary
                }}>Accuracy</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: colors.textPrimary
                }}>{analytics?.accuracy ? `${analytics.accuracy}%` : '0%'}</span>
              </div>
            </div>
            </div>
          </header>

      <div className="filter-buttons">
        <button
          onClick={() => setActiveFilter('today')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'today' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'today' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'today' ? 'white' : colors.textSecondary
          }}
        >
          Today
        </button>
        <button
          onClick={() => setActiveFilter('week')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'week' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'week' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'week' ? 'white' : colors.textSecondary
          }}
        >
          This week
        </button>
        <button
          onClick={() => setActiveFilter('month')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'month' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'month' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'month' ? 'white' : colors.textSecondary
          }}
        >
          This Month
        </button>
        <button
          onClick={() => setActiveFilter('custom')}
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '0.875rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            border: activeFilter === 'custom' ? '2px solid #C0096D' : `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'custom' ? '#F20C8F' : colors.bgCard,
            color: activeFilter === 'custom' ? 'white' : colors.textSecondary
          }}
        >
          Custom
        </button>
      </div>

      <div className="stat-cards-grid">
        <StatCard
          title="Total Earnings"
          value={formatPrice(analytics?.totalEarnings || 0)}
          percentage={statTrends.totalEarnings.percentage}
          timeframe={periodLabel}
          icon={<MoneyIcon />}
          trend={statTrends.totalEarnings.trend}
          href={`${basePath}/earnings`}
          accentColor="#083A85"
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetEarnings}
        />
        <StatCard
          title="Pending"
          value={formatPrice(analytics?.pendingPayments || 0)}
          percentage={statTrends.pending.percentage}
          timeframe={periodLabel}
          icon={<ClockIcon />}
          trend={statTrends.pending.trend}
          href={`${basePath}/pending-payments`}
          accentColor="#F59E0B"
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetPending}
        />
        <StatCard
          title="Total clients"
          value={String(analytics?.totalClients || 0)}
          percentage={statTrends.clients.percentage}
          timeframe={periodLabel}
          icon={<UsersIcon />}
          trend={statTrends.clients.trend}
          href={`${basePath}/clients`}
          accentColor="#3B82F6"
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetClients}
        />
        <StatCard
          title="Bonuses"
          value={formatPrice(analytics?.bonuses || 0)}
          percentage={statTrends.bonuses.percentage}
          timeframe={periodLabel}
          icon={<GiftIcon />}
          trend={statTrends.bonuses.trend}
          href={`${basePath}/bonuses`}
          accentColor="#10B981"
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetBonuses}
        />
        <StatCard
          title="Ratings"
          value={analytics?.averageRating ? `${analytics.averageRating.toFixed(1)}/5` : '0/5'}
          percentage={statTrends.rating.percentage}
          timeframe={periodLabel}
          icon={<StarIcon />}
          trend={statTrends.rating.trend}
          href={`${basePath}/reviews`}
          accentColor="#8B5CF6"
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetRatings}
        />
      </div>

      <div className="main-grid">
        <div>
          <section style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm,
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              lineHeight: '1.25rem',
              fontWeight: '100',
              color: colors.textPrimary,
              marginBottom: '1rem'
            }}>Performance {isComparisonMode && selectedPlan && <span style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: '400' }}>(vs {selectedPlan.name})</span>}</h2>
            <PerformanceChart
              data={performanceData}
              height={200}
              isComparisonMode={isComparisonMode && !!selectedPlan}
              targetData={selectedPlan ? generatePerformanceTargets(selectedPlan) : undefined}
            />
          </section>

          <section style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <h2 style={{
                fontSize: '1.2rem',
                lineHeight: '1.25rem',
                fontWeight: '100',
                color: colors.textPrimary
              }}>Clients</h2>
              <Link href={`${basePath}/clients`} style={{
                fontSize: '1rem',
                lineHeight: '1rem',
                color: colors.textLink,
                fontWeight: '500',
                textDecoration: 'none'
              }}>See all</Link>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}>
              {clients.map((client) => {
                const getStatusStyle = () => {
                  switch (client.status) {
                    case 'In Progress':
                      return { backgroundColor: '#FCE7F3', color: '#DB2777' };
                    case 'Completed':
                      return { backgroundColor: actualTheme === 'dark' ? '#064E3B' : '#D1FAE5', color: actualTheme === 'dark' ? '#34D399' : '#059669' };
                    case 'Pending':
                      return { backgroundColor: actualTheme === 'dark' ? '#78350F' : '#FEF3C7', color: actualTheme === 'dark' ? '#FBBF24' : '#D97706' };
                    default:
                      return {};
                  }
                };

                return (
                  <div
                    key={client.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      transition: 'background-color 0.3s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img
                      src={client.avatar}
                      alt={client.name}
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '9999px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.125rem'
                    }}>
                      <span style={{
                        fontSize: '1rem',
                        lineHeight: '1.25rem',
                        fontWeight: '700',
                        color: colors.textPrimary
                      }}>{client.name}</span>
                      <span style={{
                        fontSize: '0.85rem',
                        lineHeight: '1rem',
                        color: colors.textSecondary
                      }}>{client.event}</span>
                    </div>
                    <span style={{
                      paddingLeft: '0.625rem',
                      paddingRight: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.85rem',
                      lineHeight: '1rem',
                      fontWeight: '600',
                      ...getStatusStyle()
                    }}>{client.status}</span>
                    <div style={{ position: 'relative' }}>
                      <button
                        style={{
                          padding: '0.25rem',
                          color: colors.textTertiary,
                          fontSize: '1.25rem',
                          lineHeight: '1.75rem',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          transition: 'color 0.3s'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(client.id);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = colors.textSecondary}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.textTertiary}
                      >
                        <span>⋮</span>
                      </button>
                      {activeDropdown === client.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: colors.bgCard,
                          borderRadius: '0.5rem',
                          boxShadow: colors.shadowMd,
                          border: `2px solid ${colors.borderPrimary}`,
                          zIndex: 10,
                          minWidth: '140px',
                          overflow: 'hidden'
                        }}>
                          <Link
                            href={`${basePath}/clients`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem 0.875rem',
                              fontSize: '0.875rem',
                              color: colors.textPrimary,
                              textDecoration: 'none',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgHover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <EyeIcon />
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div>
          <section style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm,
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              lineHeight: '1.25rem',
              fontWeight: '100',
              color: colors.textPrimary,
              marginBottom: '0.875rem'
            }}>Recent Activities</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </section>

          <section style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: colors.shadowSm
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <h2 style={{
                fontSize: '1.2rem',
                lineHeight: '1.25rem',
                fontWeight: '100',
                color: colors.textPrimary
              }}>Recent payments</h2>
              <Link href={`${basePath}/transaction`} style={{
                fontSize: '1rem',
                lineHeight: '1rem',
                color: colors.textLink,
                fontWeight: '500',
                textDecoration: 'none'
              }}>See all</Link>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}>
              {recentPayments.map((payment, index) => (
                <PaymentItem key={index} {...payment} />
              ))}
            </div>
          </section>
        </div>
      </div>

        </div>
      </div>

      {/* Future Plan Creation Modal */}
      {showPlanModal && (
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
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: colors.shadowLg
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {editingPlan ? <EditIcon /> : <TargetIcon />}
                {editingPlan ? 'Edit Future Plan' : 'Create Future Plan'}
              </h2>
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  resetPlanForm();
                }}
                style={{
                  padding: '0.5rem',
                  color: colors.textTertiary,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '0.25rem'
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Plan Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: '0.5rem'
              }}>Plan Name *</label>
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Q1 Goals, Weekly Target"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: colors.bgPrimary,
                  color: colors.textPrimary,
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Time Period Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: colors.textSecondary,
                marginBottom: '0.5rem'
              }}>Time Period</label>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {(['today', 'week', 'month', 'custom'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setPlanTimePeriod(period)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: planTimePeriod === period ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                      backgroundColor: planTimePeriod === period ? '#F20C8F' : colors.bgPrimary,
                      color: planTimePeriod === period ? 'white' : colors.textSecondary,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            {planTimePeriod === 'custom' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>Start Date</label>
                  <input
                    type="date"
                    value={planForm.customStartDate}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, customStartDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>End Date</label>
                  <input
                    type="date"
                    value={planForm.customEndDate}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, customEndDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Target Stats Fields */}
            <div style={{
              borderTop: `2px solid ${colors.borderPrimary}`,
              paddingTop: '1rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '1rem'
              }}>Target Statistics</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>Target Earnings *</label>
                  <input
                    type="text"
                    value={planForm.targetEarnings}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, targetEarnings: e.target.value }))}
                    placeholder="e.g., $5,000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>Target Pending</label>
                  <input
                    type="text"
                    value={planForm.targetPending}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, targetPending: e.target.value }))}
                    placeholder="e.g., $500"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>Target Clients</label>
                  <input
                    type="text"
                    value={planForm.targetClients}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, targetClients: e.target.value }))}
                    placeholder="e.g., 10"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>Target Bonuses</label>
                  <input
                    type="text"
                    value={planForm.targetBonuses}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, targetBonuses: e.target.value }))}
                    placeholder="e.g., $100"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: colors.textSecondary,
                    marginBottom: '0.5rem'
                  }}>Target Ratings</label>
                  <input
                    type="text"
                    value={planForm.targetRatings}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, targetRatings: e.target.value }))}
                    placeholder="e.g., 4.5/5"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.borderPrimary}`,
                      backgroundColor: colors.bgPrimary,
                      color: colors.textPrimary,
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  resetPlanForm();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                disabled={!planForm.name || !planForm.targetEarnings}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: (!planForm.name || !planForm.targetEarnings) ? colors.textTertiary : '#F20C8F',
                  color: 'white',
                  cursor: (!planForm.name || !planForm.targetEarnings) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {editingPlan ? <EditIcon /> : <TargetIcon />}
                {editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Profile Completion Modal for new photographers - DISABLED
      <CompleteProfileModal
        isOpen={showProfileModal}
        onComplete={() => {
          setShowProfileModal(false);
        }}
        onSkip={() => {
          localStorage.setItem('profileModalSkipped', JSON.stringify({ timestamp: Date.now() }));
          setShowProfileModal(false);
        }}
      />
      */}
    </>
  );
};

export default PhotographerDashboard;