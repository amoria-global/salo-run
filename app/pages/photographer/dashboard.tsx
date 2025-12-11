"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
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
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetings, setGreetings] = useState(getGreetings(getTimeOfDay()));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

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
      backgroundColor: '#F9FAFB'
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
          backgroundColor: '#F9FAFB',
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
                color: '#111827',
                fontWeight: '600',
                transition: 'opacity 0.3s ease'
              }}>
                {currentGreeting}, <span style={{ fontWeight: '600', color: '#2563EB' }}>Diane</span>
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>
                {staticMessage}
              </p>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
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
                  color: '#083A85'
                }}>Earnings</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: '#111827'
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
                  color: '#083A85'
                }}>Clients</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: '#111827'
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
                  color: '#083A85'
                }}>Accuracy</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: '#111827'
                }}>73.5%</span>
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
            border: activeFilter === 'today' ? '2px solid #C0096D' : '2px solid #E5E7EB',
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'today' ? '#F20C8F' : 'white',
            color: activeFilter === 'today' ? 'white' : '#4B5563'
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
            border: activeFilter === 'week' ? '2px solid #C0096D' : '2px solid #E5E7EB',
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'week' ? '#F20C8F' : 'white',
            color: activeFilter === 'week' ? 'white' : '#4B5563'
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
            border: activeFilter === 'month' ? '2px solid #C0096D' : '2px solid #E5E7EB',
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'month' ? '#F20C8F' : 'white',
            color: activeFilter === 'month' ? 'white' : '#4B5563'
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
            border: activeFilter === 'custom' ? '2px solid #C0096D' : '2px solid #E5E7EB',
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            lineHeight: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: activeFilter === 'custom' ? '#F20C8F' : 'white',
            color: activeFilter === 'custom' ? 'white' : '#4B5563'
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
        />
        <StatCard
          title="Pending"
          value="$700"
          percentage="36.8%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          href={`${basePath}/pending-payments`}
        />
        <StatCard
          title="Total clients"
          value="5.0"
          percentage="5.4%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href={`${basePath}/clients`}
        />
        <StatCard
          title="Bonuses"
          value="$3.05"
          percentage="47.38%"
          timeframe="last week"
          icon={<GiftIcon />}
          trend="down"
          href={`${basePath}/bonuses`}
        />
        <StatCard
          title="Ratings"
          value="3.9/5"
          percentage="8%"
          timeframe="last 120 reviews"
          icon={<StarIcon />}
          trend="up"
          href={`${basePath}/reviews`}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '1rem'
      }}>
        <div>
          <section style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              lineHeight: '1.25rem',
              fontWeight: '100',
              color: '#111827',
              marginBottom: '1rem'
            }}>Performance</h2>
            <PerformanceChart data={performanceData} height={200} />
          </section>

          <section style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
                color: '#111827'
              }}>Clients</h2>
              <Link href={`${basePath}/clients`} style={{
                fontSize: '1rem',
                lineHeight: '1rem',
                color: '#2563EB',
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
                      return { backgroundColor: '#D1FAE5', color: '#059669' };
                    case 'Pending':
                      return { backgroundColor: '#FEF3C7', color: '#D97706' };
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
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
                        color: '#111827'
                      }}>{client.name}</span>
                      <span style={{
                        fontSize: '0.85rem',
                        lineHeight: '1rem',
                        color: '#6B7280'
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
                          color: '#9CA3AF',
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
                        onMouseEnter={(e) => e.currentTarget.style.color = '#4B5563'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                      >
                        <span>⋮</span>
                      </button>
                      {activeDropdown === client.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: 'white',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          border: '1px solid #E5E7EB',
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
                              color: '#374151',
                              textDecoration: 'none',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
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
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              lineHeight: '1.25rem',
              fontWeight: '100',
              color: '#111827',
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
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
                color: '#111827'
              }}>Recent payments</h2>
              <Link href={`${basePath}/transaction`} style={{
                fontSize: '1rem',
                lineHeight: '1rem',
                color: '#2563EB',
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
    </div>
  );
};

export default PhotographerDashboard;