"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import { useTheme } from '../../context/ThemeContext';
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

/* ============================================
   FUTURE PLAN FEATURE - COMMENTED OUT FOR LATER USE
   Uncomment when API is ready to support this feature
   ============================================ */

/*
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
*/

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

interface PhotographerDashboardProps {
  userType?: 'photographer' | 'freelancer';
}

interface Client {
  id: string;
  name: string;
  event: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  avatar: string;
}

const PhotographerDashboard = ({ userType = 'photographer' }: PhotographerDashboardProps) => {
  const { colors, actualTheme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /* FUTURE PLAN FEATURE - State commented out for later use
  // Comparison mode state
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [futurePlans, setFuturePlans] = useState<FuturePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FuturePlan | null>(null);
  const [planTimePeriod, setPlanTimePeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FuturePlan | null>(null);

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
  */

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
      /* FUTURE PLAN FEATURE - commented out
      if (showPlanDropdown) {
        setShowPlanDropdown(false);
      }
      */
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]); // Removed showPlanDropdown from dependencies

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

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  /* FUTURE PLAN FEATURE - All functions commented out for later use
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
  */ // END FUTURE PLAN FEATURE FUNCTIONS

  const currentGreeting = greetings[greetingIndex];
  const staticMessage = getStaticMessage(timeOfDay);
  const performanceData = [
    { day: 'Sun', value1: 130, value2: 150 },
    { day: 'Mon', value1: 90, value2: 100 },
    { day: 'Tue', value1: 100, value2: 130 },
    { day: 'Wed', value1: 60, value2: 70 },
    { day: 'Thu', value1: 70, value2: 80 },
    { day: 'Fri', value1: 130, value2: 150 },
    { day: 'Sat', value1: 90, value2: 70 }
  ];

  const recentActivities = [
    { label: 'Customer', value: 'Joseph Mugabo' },
    { label: 'Transaction', value: '-450', valueColor: '#ff0066' },
    { label: 'Archive', value: 'jsm_wedd.mp4' },
    { label: 'Package', value: 'Tier 1' },
    { label: 'Referral', value: 'Pacific Uwitonze',  valueColor: '#083A85' },
    { label: 'Logs', value: 'Today, 14. July 2025' }
  ];

  const clients: Client[] = [
    {
      id: 'CLT-001',
      name: 'Kalisa Aime',
      event: 'Wedding',
      status: 'In Progress' as const,
      avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg'
    },
    {
      id: 'CLT-002',
      name: 'Ketty Bashabe',
      event: 'Birthday',
      status: 'Completed' as const,
      avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg'
    },
    {
      id: 'CLT-003',
      name: 'Juno Kizigenza',
      event: 'Festival',
      status: 'Pending' as const,
      avatar: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg'
    }
  ];

  const recentPayments = [
    {
      name: 'Kalisa Aime',
      type: 'Earnings',
      amount: '$1,950',
      avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg'
    },
    {
      name: 'Amoria',
      type: 'Archive commission',
      amount: '$50.80',
      logo: '/logo.png'
    },
    {
      name: 'Amoria',
      type: 'Referral bonus',
      amount: '$3.0',
      logo: '/logo.png'
    }
  ];

  // Determine the base path based on user type
  const basePath = userType === 'freelancer' ? '/user/freelancer' : '/user/photographer';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: colors.bgPrimary
    }}>
      <Sidebar />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Topbar userRole={userType} tipsAmount={275.00} bonusAmount={725.00} balanceAmount={4975.00} />

        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: colors.bgPrimary,
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.125rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                lineHeight: '2rem',
                color: colors.textPrimary,
                fontWeight: '600',
                transition: 'opacity 0.3s ease'
              }}>
                {currentGreeting}, <span style={{ fontWeight: '600', color: colors.brandPrimary }}>Diane</span>
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
              {/* FUTURE PLAN FEATURE - Comparison Mode UI commented out for later use
              <button
                onClick={toggleComparisonMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: isComparisonMode ? '2px solid #F20C8F' : `2px solid ${colors.borderPrimary}`,
                  backgroundColor: isComparisonMode ? '#F20C8F' : colors.bgCard,
                  color: isComparisonMode ? 'white' : colors.textSecondary,
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
                          border: `1px solid ${colors.borderPrimary}`,
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
              */}
              <div style={{
              backgroundColor: colors.bgCard,
              borderRadius: '0.5rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              boxShadow: colors.shadowSm,
              border: `1px solid ${colors.borderPrimary}`,
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
                }}>$9.64k</span>
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
                }}>26</span>
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
                }}>73.5%</span>
              </div>
            </div>
            </div>
          </header>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <StatCard
          title="Total Earnings"
          value="$2,600"
          percentage="52.76%"
          timeframe="last week"
          icon={<MoneyIcon />}
          trend="up"
          href={`${basePath}/earnings`}
          /* FUTURE PLAN FEATURE - comparison props commented out
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetEarnings}
          */
        />
        <StatCard
          title="Pending"
          value="$700"
          percentage="36.8%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          href={`${basePath}/pending-payments`}
          /* FUTURE PLAN FEATURE - comparison props commented out
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetPending}
          */
        />
        <StatCard
          title="Total clients"
          value="5.0"
          percentage="5.4%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href={`${basePath}/clients`}
          /* FUTURE PLAN FEATURE - comparison props commented out
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetClients}
          */
        />
        <StatCard
          title="Bonuses"
          value="$3.05"
          percentage="47.38%"
          timeframe="last week"
          icon={<GiftIcon />}
          trend="down"
          href={`${basePath}/bonuses`}
          /* FUTURE PLAN FEATURE - comparison props commented out
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetBonuses}
          */
        />
        <StatCard
          title="Ratings"
          value="3.9/5"
          percentage="8%"
          timeframe="last 120 reviews"
          icon={<StarIcon />}
          trend="up"
          href={`${basePath}/reviews`}
          /* FUTURE PLAN FEATURE - comparison props commented out
          isComparisonMode={isComparisonMode && !!selectedPlan}
          targetValue={selectedPlan?.targetRatings}
          */
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '1rem'
      }}>
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
            }}>Performance</h2>
            {/* FUTURE PLAN FEATURE - comparison title commented out
            Performance {isComparisonMode && selectedPlan && <span style={{ fontSize: '0.75rem', color: colors.textSecondary, fontWeight: '400' }}>(vs {selectedPlan.name})</span>}
            */}
            <PerformanceChart
              data={performanceData}
              height={200}
              /* FUTURE PLAN FEATURE - comparison props commented out
              isComparisonMode={isComparisonMode && !!selectedPlan}
              targetData={selectedPlan ? generatePerformanceTargets(selectedPlan) : undefined}
              */
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
                          border: `1px solid ${colors.borderPrimary}`,
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

      {/* FUTURE PLAN FEATURE - Modal commented out for later use - see comments in code above */}
    </div>
  );
};

export default PhotographerDashboard;