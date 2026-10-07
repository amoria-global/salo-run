"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useDashboardAuth, dashboardAuthFetch } from '../../providers/AuthProvider';
import CompleteProfileModal from '../../components/CompleteProfileModal';
import { getApiUrl, normalizeImageUrl } from '@/lib/api';
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
  avatar?: string;
}

const HeroMiniStat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', padding: '4px 6px' }}>
    <div style={{
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#797D86',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>{label}</div>
    <div style={{
      fontSize: '1.15rem',
      fontWeight: 800,
      letterSpacing: '-0.01em',
      marginTop: 4,
      color,
      lineHeight: 1.1,
    }}>{value}</div>
  </div>
);

const PhotographerDashboard = () => {
  const { colors, actualTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const { user } = useDashboardAuth();
  const router = useRouter();

  // Redirect pending/rejected photographers to their profile page
  useEffect(() => {
    if (user && user.profileReviewStatus?.toUpperCase() !== 'ACCEPTED') {
      router.replace('/user/photographer/profile');
    }
  }, [user, router]);
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Comparison mode state (persisted to localStorage)
  const [isComparisonMode, setIsComparisonMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('connekt_comparison_mode') === 'true';
    }
    return false;
  });
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
  const [recentPayments, setRecentPayments] = useState<{ name: string; type: string; amount: string; avatar?: string }[]>([]);
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
        const [analyticsRes, balanceRes, clientsRes, convRes, transactionsRes] = await Promise.allSettled([
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/analytics`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/balance`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/clients`),
          dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/transactions?page=0&size=5`),
        ]);
        const normalizeImg = (url: string | undefined) => normalizeImageUrl(url);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
          const data = await analyticsRes.value.json();
          if (data.action === 1 && data.data) setAnalytics(data.data);
        }
        if (balanceRes.status === 'fulfilled' && balanceRes.value.ok) {
          const data = await balanceRes.value.json();
          if (data.action === 1 && data.data) setBalance(data.data);
        }
        // Primary: /photographer/clients; Fallback: chat conversations
        {
          let clientsMapped: Client[] = [];
          if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
            const data = await clientsRes.value.json().catch(() => null);

            if (data?.data) {
              const rawList = Array.isArray(data.data) ? data.data : data.data.content || [];
              clientsMapped = rawList.slice(0, 3).map((c: any) => ({
                id: c.id || '',
                name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client',
                event: c.lastEventType || 'Photography',
                status: (c.status === 'COMPLETED' || c.status === 'completed' ? 'Completed' : c.status === 'CONTACTED' || c.status === 'active' ? 'In Progress' : 'Pending') as Client['status'],
                avatar: normalizeImg(c.profilePicture || c.profileImage || undefined),
              }));
            }
          }
          if (clientsMapped.length === 0 && convRes.status === 'fulfilled' && convRes.value.ok) {
            const convData = await convRes.value.json().catch(() => null);
            const convList = convData?.data || convData || [];
            if (Array.isArray(convList)) {
              const currentId = user?.id || '';
              clientsMapped = convList.slice(0, 3).map((conv: any) => {
                const partner = conv.participants?.find((p: any) => p.id !== currentId) || {};
                return {
                  id: partner.id || conv.partnerId || conv.id || '',
                  name: partner.name || conv.partnerName || conv.name || 'Client',
                  event: 'Photography',
                  status: 'In Progress' as Client['status'],
                  avatar: normalizeImg(partner.image || conv.partnerImage || conv.image || undefined),
                };
              });
            }
          }
          setApiClients(clientsMapped);
        }
        if (transactionsRes.status === 'fulfilled' && transactionsRes.value.ok) {
          const data = await transactionsRes.value.json();
          if (data.data) {
            const txns = Array.isArray(data.data) ? data.data : data.data.content || [];
            const completed = txns
              .filter((t: any) => {
                const s = (t.status || '').toUpperCase();
                return s === 'COMPLETED' || s === 'SUCCESS';
              })
              .slice(0, 3)
              .map((t: any) => ({
                name: t.clientName || t.customerName || t.photographerName || 'Payment',
                type: t.paymentType || t.type || t.service || 'Earnings',
                amount: formatPrice(t.amount || 0),
                avatar: normalizeImg(t.clientImage || t.customerImage || t.photographerImage || undefined),
              }));
            setRecentPayments(completed);
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
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/analytics/trends?period=${periodParam}`),
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
            const fmt = (m: any) => ({
              percentage: m?.changePercent != null ? `${Math.abs(m.changePercent).toFixed(1)}%` : '0%',
              trend: (m?.trend === 'down' ? 'down' : 'up') as 'up' | 'down',
            });
            setStatTrends({
              totalEarnings: fmt(t.totalEarnings),
              pending: fmt(t.pending),
              clients: fmt(t.clients),
              bonuses: fmt(t.bonuses),
              rating: fmt(t.rating),
            });
          }
        }
      } catch (error) {
        console.error('[Photographer Dashboard] Error fetching filtered data:', error);
      }
    };
    fetchFilteredData();
  }, [activeFilter]);

  // Fetch activities and plans from API
  useEffect(() => {
    const fetchActivitiesAndPlans = async () => {
      const apiUrl = getApiUrl();
      try {
        const [activitiesRes, plansRes] = await Promise.allSettled([
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/activities`),
          dashboardAuthFetch(`${apiUrl}/api/remote/photographer/plans`),
        ]);

        if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
          const data = await activitiesRes.value.json();
          if (data.action === 1 && Array.isArray(data.data)) {
            setRecentActivities(data.data.map((a: any) => ({
              label: a.label || '',
              value: a.value || '',
              valueColor: a.type === 'payment' ? '#16A34A' : undefined,
            })));
          }
        }

        if (plansRes.status === 'fulfilled' && plansRes.value.ok) {
          const data = await plansRes.value.json();
          if (data.action === 1 && Array.isArray(data.data) && data.data.length > 0) {
            const mapped: FuturePlan[] = data.data.map((p: any) => ({
              id: p.id,
              name: p.name || '',
              timePeriod: p.timePeriod || 'week',
              customStartDate: p.customStartDate || undefined,
              customEndDate: p.customEndDate || undefined,
              targetEarnings: p.targetEarnings || '0',
              targetPending: p.targetPending || '0',
              targetClients: p.targetClients || '0',
              targetBonuses: p.targetBonuses || '0',
              targetRatings: p.targetRatings || '0',
              targetPerformance: [],
              createdAt: p.createdAt || '',
            }));
            setFuturePlans(mapped);
            // Restore comparison mode from localStorage
            const savedPlanId = localStorage.getItem('connekt_comparison_plan_id');
            const savedMode = localStorage.getItem('connekt_comparison_mode') === 'true';
            if (savedMode && savedPlanId) {
              const restored = mapped.find(p => p.id === savedPlanId);
              if (restored) {
                setSelectedPlan(restored);
                setIsComparisonMode(true);
                setActiveFilter(restored.timePeriod);
              } else {
                // Saved plan no longer exists, clear persistence
                localStorage.removeItem('connekt_comparison_mode');
                localStorage.removeItem('connekt_comparison_plan_id');
                setIsComparisonMode(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch activities/plans:', err);
      }
    };
    fetchActivitiesAndPlans();
  }, []);

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
      // Profile is complete when the surfaces still shown to clients are
      // populated: contact details, specialties, education/certifications.
      // Equipment/About/Philosophy/Skills/Training were removed from the
      // profile editor.
      const isIncomplete = !user.address
        || !user.specialties?.length
        || !user.educationLevels?.length;

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
  const handleCreatePlan = async () => {
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
      targetPerformance: [],
      createdAt: new Date().toISOString()
    };

    setFuturePlans(prev => [...prev, newPlan]);
    setSelectedPlan(newPlan);
    setShowPlanModal(false);
    setIsComparisonMode(true);
    setActiveFilter(planTimePeriod);
    resetPlanForm();
    localStorage.setItem('connekt_comparison_mode', 'true');
    localStorage.setItem('connekt_comparison_plan_id', newPlan.id);

    // Persist to backend
    try {
      const apiUrl = getApiUrl();
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlan.name,
          timePeriod: newPlan.timePeriod,
          customStartDate: newPlan.customStartDate || null,
          customEndDate: newPlan.customEndDate || null,
          targetEarnings: newPlan.targetEarnings,
          targetPending: newPlan.targetPending,
          targetClients: newPlan.targetClients,
          targetBonuses: newPlan.targetBonuses,
          targetRatings: newPlan.targetRatings,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result?.data?.id) {
          const realId = result.data.id;
          setFuturePlans(prev => prev.map(p => p.id === newPlan.id ? { ...p, id: realId } : p));
          setSelectedPlan(prev => prev?.id === newPlan.id ? { ...prev, id: realId } : prev);
          localStorage.setItem('connekt_comparison_plan_id', realId);
        }
      }
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  };

  // Handle selecting an existing plan
  const handleSelectPlan = (plan: FuturePlan) => {
    setSelectedPlan(plan);
    setIsComparisonMode(true);
    setActiveFilter(plan.timePeriod);
    localStorage.setItem('connekt_comparison_mode', 'true');
    localStorage.setItem('connekt_comparison_plan_id', plan.id);
  };

  // Handle deleting a plan
  const handleDeletePlan = async (planId: string) => {
    setFuturePlans(prev => prev.filter(p => p.id !== planId));
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
      setIsComparisonMode(false);
      localStorage.removeItem('connekt_comparison_mode');
      localStorage.removeItem('connekt_comparison_plan_id');
    }
    try {
      const apiUrl = getApiUrl();
      await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/plans/${planId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete plan:', err);
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
  const handleSavePlan = async () => {
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

      if (selectedPlan?.id === editingPlan.id) {
        setSelectedPlan(updatedPlan);
      }

      setActiveFilter(planTimePeriod);
      setEditingPlan(null);

      // Persist update to backend
      try {
        const apiUrl = getApiUrl();
        await dashboardAuthFetch(`${apiUrl}/api/remote/photographer/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updatedPlan.name,
            timePeriod: updatedPlan.timePeriod,
            customStartDate: updatedPlan.customStartDate || null,
            customEndDate: updatedPlan.customEndDate || null,
            targetEarnings: updatedPlan.targetEarnings,
            targetPending: updatedPlan.targetPending,
            targetClients: updatedPlan.targetClients,
            targetBonuses: updatedPlan.targetBonuses,
            targetRatings: updatedPlan.targetRatings,
          }),
        });
      } catch (err) {
        console.error('Failed to update plan:', err);
      }
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
      localStorage.removeItem('connekt_comparison_mode');
      localStorage.removeItem('connekt_comparison_plan_id');
    } else if (futurePlans.length > 0) {
      setSelectedPlan(futurePlans[0]);
      setIsComparisonMode(true);
      setActiveFilter(futurePlans[0].timePeriod);
      localStorage.setItem('connekt_comparison_mode', 'true');
      localStorage.setItem('connekt_comparison_plan_id', futurePlans[0].id);
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

        .filter-buttons {
          margin-bottom: 1rem;
        }

        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
        }

        @media (max-width: 1100px) {
          .stat-cards-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 1024px) {
          .dashboard-header {
            grid-template-columns: 1fr !important;
          }
          .hero-stats-card {
            min-width: 0 !important;
          }
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .dashboard-main {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-top: 0.75rem !important;
          }
          .dashboard-header {
            padding: 22px 18px 18px !important;
          }
          .stat-cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .filter-buttons {
            overflow-x: auto;
          }
        }
        @media (max-width: 480px) {
          .dashboard-main {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .stat-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <Sidebar />

        <div className="dashboard-content">
          <Topbar userRole="photographer" />

          <div className="dashboard-main">
            <header className="dashboard-header ck-fade-in-up" style={{
              position: 'relative',
              borderRadius: 20,
              padding: '28px 28px 24px',
              background: 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(242,12,143,0.05) 100%)',
              border: `1px solid ${colors.borderPrimary}`,
              marginBottom: 22,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 20,
              alignItems: 'center',
              overflow: 'hidden',
            }}>
              {/* decorative accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#F20C8F',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Photographer dashboard</div>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: colors.textPrimary,
                lineHeight: 1.1,
                transition: 'opacity 0.3s ease',
              }}>
                {currentGreeting}, <span className="ck-gradient-text">{user?.firstName || 'there'}</span>
              </h1>
              <p style={{
                fontSize: '0.95rem',
                color: colors.textSecondary,
                margin: '8px 0 0',
              }}>
                {staticMessage}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button
                onClick={toggleComparisonMode}
                title={isComparisonMode ? 'Exit comparison mode' : 'Set target goals and compare them against your real stats to track progress'}
                className="ck-btn"
                style={{
                  background: isComparisonMode
                    ? 'linear-gradient(135deg, #F20C8F 0%, #ff4fae 100%)'
                    : 'var(--ck-blue)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: isComparisonMode ? '0 6px 14px rgba(242,12,143,0.22)' : '0 6px 14px rgba(8,58,133,0.22)',
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
              </div>
            </div>
            <div className="hero-stats-card" style={{
              backgroundColor: colors.bgCard,
              borderRadius: 16,
              padding: 16,
              boxShadow: colors.shadowSm,
              border: `1px solid ${colors.borderPrimary}`,
              display: 'grid',
              gridTemplateColumns: balance?.heldForDelivery > 0 ? 'repeat(4, minmax(96px, 1fr))' : 'repeat(3, minmax(96px, 1fr))',
              gap: 8,
              minWidth: balance?.heldForDelivery > 0 ? 420 : 320,
              position: 'relative',
              zIndex: 1,
            }}>
              <HeroMiniStat label="Earnings" value={formatPrice(analytics?.totalEarnings || analytics?.earnings || 0)} color="#083A85" />
              <HeroMiniStat label="Clients"  value={String(analytics?.totalClients || analytics?.clients || 0)} color="#F20C8F" />
              <HeroMiniStat label="Accuracy" value={analytics?.accuracy ? `${analytics.accuracy}%` : '0%'} color="#10B981" />
              {balance?.heldForDelivery > 0 && (
                <HeroMiniStat
                  label="In escrow"
                  value={formatPrice(balance.heldForDelivery)}
                  color="#F59E0B"
                />
              )}
            </div>
          </header>

      <div className="filter-buttons" style={{
        display: 'inline-flex',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: colors.bgTertiary,
        border: `1px solid ${colors.borderPrimary}`,
        marginBottom: 18,
      }}>
        {([
          { key: 'today', label: 'Today' },
          { key: 'week',  label: 'This week' },
          { key: 'month', label: 'This month' },
          { key: 'custom', label: 'Custom' },
        ] as const).map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: active ? colors.textPrimary : colors.textSecondary,
                background: active ? colors.bgCard : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 180ms ease, color 180ms ease',
                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Comparison mode guide banner */}
      {isComparisonMode && selectedPlan && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.625rem 1rem',
          marginBottom: '0.75rem',
          backgroundColor: actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.08)' : '#FDF2F8',
          border: `1px solid ${actualTheme === 'dark' ? 'rgba(242, 12, 143, 0.25)' : '#FBCFE8'}`,
          borderRadius: '0.5rem',
          fontSize: '0.8rem',
          color: actualTheme === 'dark' ? '#F9A8D4' : '#9D174D',
          lineHeight: '1.4',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>
            Comparing with <strong>{selectedPlan.name}</strong>. Stat cards show progress bars toward your targets.
            The performance chart overlays target values alongside actual data. Switch plans or click <strong>&quot;Exit Comparison&quot;</strong> when done.
          </span>
        </div>
      )}

      <div className="stat-cards-grid">
        <StatCard
          title="Total Earnings"
          value={formatPrice(analytics?.totalEarnings || 0)}
          percentage={statTrends.totalEarnings.percentage}
          timeframe={periodLabel}
          icon={<MoneyIcon />}
          trend={statTrends.totalEarnings.trend}
          href={`${basePath}/all-transactions`}
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
          href={`${basePath}/all-transactions`}
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
          href={`${basePath}/all-transactions`}
          accentColor="#10B981"
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetBonuses}
        />
        <StatCard
          title="Ratings"
          value={analytics?.averageRating ? `${analytics.averageRating.toFixed(1)}/5` : '5.0/5'}
          percentage={statTrends.rating.percentage}
          timeframe={periodLabel}
          icon={<StarIcon />}
          trend={statTrends.rating.trend}
          href={`${basePath}/profile`}
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
                    {client.avatar ? (
                      <img
                        src={client.avatar}
                        alt={client.name}
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: '9999px',
                          objectFit: 'cover'
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#6B7280', flexShrink: 0 }}>{client.name.charAt(0)}</div>
                    )}
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
      {showPlanModal && (() => {
        const planInputStyle: React.CSSProperties = {
          width: '100%',
          padding: '0.7rem 0.95rem',
          borderRadius: 11,
          border: `1.5px solid ${colors.borderPrimary}`,
          backgroundColor: colors.bgCard,
          color: colors.textPrimary,
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          boxSizing: 'border-box',
        };
        const planLabelStyle: React.CSSProperties = {
          display: 'block',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: colors.textSecondary,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        };
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
        }}
          onClick={() => { setShowPlanModal(false); resetPlanForm(); }}
        >
          <style>{`
            .plan-modal input:focus,
            .plan-modal select:focus,
            .plan-modal textarea:focus {
              border-color: #083A85 !important;
              box-shadow: 0 0 0 3px rgba(8,58,133,0.14) !important;
            }
          `}</style>
          <div
            className="plan-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: colors.bgCard,
              borderRadius: 18,
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
              border: `1px solid ${colors.borderPrimary}`,
            }}
          >
            {/* Brand top stripe */}
            <span aria-hidden style={{
              position: 'sticky', top: 0, left: 0, right: 0, height: 3, display: 'block',
              background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
              zIndex: 2,
            }} />

            <div style={{ padding: '1.4rem 1.5rem 1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: 'rgba(242,12,143,0.10)',
                    border: '1px solid rgba(242,12,143,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: '#F20C8F',
                  }}>
                    {editingPlan ? <EditIcon /> : <TargetIcon />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                      Goal tracking
                    </div>
                    <h2 style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}>
                      {editingPlan ? 'Edit future plan' : 'Create future plan'}
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '3px 0 0', lineHeight: 1.45 }}>
                      Set targets to compare against your live stats, and track progress at a glance.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    resetPlanForm();
                  }}
                  aria-label="Close"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    width: 32, height: 32, padding: 0,
                    borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textSecondary,
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = colors.borderPrimary;
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Guide Tips */}
              {!editingPlan && (
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: actualTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(8,58,133,0.18) 0%, rgba(59,130,246,0.10) 100%)'
                    : 'linear-gradient(135deg, rgba(8,58,133,0.05) 0%, rgba(59,130,246,0.03) 100%)',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(99,162,255,0.30)' : 'rgba(8,58,133,0.20)'}`,
                  borderRadius: 11,
                  padding: '0.85rem 1rem 0.85rem 1.1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.55,
                  color: actualTheme === 'dark' ? '#93C5FD' : '#1E3A8A',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #083A85 0%, #F20C8F 130%)',
                  }} />
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: '#fff',
                    border: '1px solid rgba(8,58,133,0.20)',
                    boxShadow: '0 4px 10px rgba(8,58,133,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className="bi bi-lightbulb-fill" style={{ fontSize: 14, color: '#083A85' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#083A85', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                      How it works
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      <li>Set a <strong>plan name</strong> and <strong>time period</strong> matching how you want to track progress.</li>
                      <li>Fill in <strong>target values</strong> for the stats you care about. Leave others blank to skip them.</li>
                      <li>After saving, click <strong>“Compare Goals”</strong> on the dashboard to overlay your targets on real stats.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={planLabelStyle}>Plan name *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Q1 Goals, Weekly Target"
                  style={planInputStyle}
                />
              </div>

              {/* Time Period Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={planLabelStyle}>Time period</label>
                <div className="ck-tabs" style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
                  {(['today', 'week', 'month', 'custom'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setPlanTimePeriod(period)}
                      className={`ck-tab ${planTimePeriod === period ? 'is-active' : ''}`}
                      style={planTimePeriod === period ? {
                        background: 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(242,12,143,0.25)',
                      } : undefined}
                    >
                      {period === 'today' ? 'Today' : period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'Custom'}
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
                    <label style={planLabelStyle}>Start date</label>
                    <input
                      type="date"
                      value={planForm.customStartDate}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, customStartDate: e.target.value }))}
                      style={planInputStyle}
                    />
                  </div>
                  <div>
                    <label style={planLabelStyle}>End date</label>
                    <input
                      type="date"
                      value={planForm.customEndDate}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, customEndDate: e.target.value }))}
                      style={planInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Target Stats Fields */}
              <div style={{
                borderTop: `1px solid ${colors.borderPrimary}`,
                paddingTop: '1.1rem',
                marginTop: '0.5rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(8,58,133,0.10)',
                    border: '1px solid rgba(8,58,133,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className="bi bi-graph-up-arrow" style={{ fontSize: 13, color: '#083A85' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Targets
                    </div>
                    <h3 style={{
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: colors.textPrimary,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}>Target statistics</h3>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.85rem'
                }}>
                  {([
                    { key: 'targetEarnings', label: 'Target earnings *', placeholder: 'e.g., $5,000', icon: 'bi-cash-stack', accent: '#10B981' },
                    { key: 'targetPending',  label: 'Target pending',    placeholder: 'e.g., $500',   icon: 'bi-hourglass-split', accent: '#F59E0B' },
                    { key: 'targetClients',  label: 'Target clients',    placeholder: 'e.g., 10',     icon: 'bi-people-fill', accent: '#083A85' },
                    { key: 'targetBonuses',  label: 'Target bonuses',    placeholder: 'e.g., $100',   icon: 'bi-award-fill', accent: '#16A34A' },
                    { key: 'targetRatings',  label: 'Target ratings',    placeholder: 'e.g., 4.5/5',  icon: 'bi-star-fill', accent: '#F59E0B' },
                  ] as const).map((field) => (
                    <div key={field.key}>
                      <label style={{ ...planLabelStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <i className={`bi ${field.icon}`} style={{ fontSize: 11, color: field.accent }} />
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={planForm[field.key]}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={planInputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.6rem',
                paddingTop: '0.5rem',
                borderTop: `1px solid ${colors.borderPrimary}`,
                marginTop: '0.5rem',
              }}>
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    resetPlanForm();
                  }}
                  className="ck-btn ck-btn-soft"
                  style={{
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.88rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlan}
                  disabled={!planForm.name || !planForm.targetEarnings}
                  style={{
                    padding: '0.65rem 1.3rem',
                    borderRadius: 11,
                    border: 'none',
                    background: (!planForm.name || !planForm.targetEarnings)
                      ? colors.bgTertiary
                      : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
                    color: (!planForm.name || !planForm.targetEarnings) ? colors.textSecondary : '#fff',
                    cursor: (!planForm.name || !planForm.targetEarnings) ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: (!planForm.name || !planForm.targetEarnings) ? 'none' : '0 6px 18px rgba(242,12,143,0.28)',
                    opacity: (!planForm.name || !planForm.targetEarnings) ? 0.7 : 1,
                    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
                    letterSpacing: '-0.005em',
                  }}
                  onMouseEnter={(e) => { if (planForm.name && planForm.targetEarnings) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <i className={`bi ${editingPlan ? 'bi-check2-circle' : 'bi-flag-fill'}`} style={{ fontSize: 13 }} />
                  {editingPlan ? 'Save changes' : 'Create plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
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