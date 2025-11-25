"use client";

import React, { useState } from 'react';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';
import {
  StatCard,
  HeaderStat,
  ActivityItem,
  ClientItem,
  PaymentItem,
  PerformanceChart,
  MoneyIcon,
  ClockIcon,
  UsersIcon,
  GiftIcon,
  StarIcon
} from '../../components/dashboard';

const ClientDashboard = () => {
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');
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

  const clients = [
    {
      name: 'Kalisa Aime',
      event: 'Wedding',
      status: 'In Progress' as const,
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      name: 'Ketty Bashabe',
      event: 'Birthday',
      status: 'Completed' as const,
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      name: 'Juno Kizigenza',
      event: 'Festival',
      status: 'Pending' as const,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    }
  ];

  const recentPayments = [
    {
      name: 'Kalisa Aime',
      type: 'Earnings',
      amount: '$1,950',
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
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
        <Topbar />

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
                color: '#111827'
              }}>
                Good Morning, <span style={{ fontWeight: '600', color: '#083A85' }}>Diane</span>
              </h1>
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
            border: activeFilter === 'today' ? '1px solid #F20C8F' : '1px solid #E5E7EB',
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
            border: activeFilter === 'week' ? '1px solid #F20C8F' : '1px solid #E5E7EB',
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
            border: activeFilter === 'month' ? '1px solid #F20C8F' : '1px solid #E5E7EB',
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
            border: activeFilter === 'custom' ? '1px solid #F20C8F' : '1px solid #E5E7EB',
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
          href="/client/earnings"
        />
        <StatCard
          title="Pending"
          value="$700"
          percentage="36.8%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          href="/client/pending-payments"
        />
        <StatCard
          title="Total clients"
          value="5.0"
          percentage="5.4%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href="/client/clients"
        />
        <StatCard
          title="Bonuses"
          value="$3.05"
          percentage="47.38%"
          timeframe="last week"
          icon={<GiftIcon />}
          trend="down"
          href="/client/bonuses"
        />
        <StatCard
          title="Ratings"
          value="3.9/5"
          percentage="8%"
          timeframe="last 120 reviews"
          icon={<StarIcon />}
          trend="up"
          href="/client/reviews"
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
              fontSize: '1.5rem',
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
                fontSize: '1.5rem',
                lineHeight: '1.25rem',
                fontWeight: '100',
                color: '#111827'
              }}>Clients</h2>
              <a href="#" style={{
                fontSize: '1.12rem',
                lineHeight: '1rem',
                color: '#2563EB',
                fontWeight: '500',
                textDecoration: 'none'
              }}>See all</a>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}>
              {clients.map((client, index) => (
                <ClientItem key={index} {...client} />
              ))}
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
              fontSize: '1.5rem',
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
                fontSize: '1.5rem',
                lineHeight: '1.25rem',
                fontWeight: '100',
                color: '#111827'
              }}>Recent payments</h2>
              <a href="#" style={{
                fontSize: '1.12rem',
                lineHeight: '1rem',
                color: '#2563EB',
                fontWeight: '500',
                textDecoration: 'none'
              }}>See all</a>
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

export default ClientDashboard;
