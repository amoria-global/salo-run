"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

// Alert Icons
const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="#DC2626"/>
  </svg>
);

const CreditCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface PendingPayment {
  id: string;
  eventName: string;
  photographerName: string;
  photographerImage: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'failed' | 'partially_paid';
}

const ClientDashboard = () => {
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week');

  // Pending Payments Data
  const pendingPayments: PendingPayment[] = [
    {
      id: 'PAY-001',
      eventName: 'Corporate Headshots',
      photographerName: 'Elite Photography',
      photographerImage: 'https://randomuser.me/api/portraits/men/22.jpg',
      amount: 500,
      paidAmount: 0,
      dueDate: '2025-07-25',
      status: 'pending'
    },
    {
      id: 'PAY-002',
      eventName: 'Family Portrait',
      photographerName: 'Mary Shots',
      photographerImage: 'https://randomuser.me/api/portraits/women/68.jpg',
      amount: 250,
      paidAmount: 125,
      dueDate: '2025-07-30',
      status: 'partially_paid'
    },
    {
      id: 'PAY-003',
      eventName: 'Fashion Shoot',
      photographerName: 'Sarah Lens',
      photographerImage: 'https://randomuser.me/api/portraits/women/44.jpg',
      amount: 400,
      paidAmount: 0,
      dueDate: '2025-08-05',
      status: 'failed'
    }
  ];

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const hasFailedPayments = pendingPayments.some(p => p.status === 'failed');

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
    { label: 'Photographer', value: 'John Studio' },
    { label: 'Payment', value: '-$450', valueColor: '#ff0066' },
    { label: 'Photos', value: 'wedding_gallery.zip' },
    { label: 'Package', value: 'Premium' },
    { label: 'Booking', value: 'Wedding Shoot',  valueColor: '#083A85' },
    { label: 'Last Activity', value: 'Today, 14. July 2025' }
  ];

  const photographers = [
    {
      name: 'John Studio',
      event: 'Wedding',
      status: 'In Progress' as const,
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      name: 'Mary Shots',
      event: 'Birthday',
      status: 'Completed' as const,
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      name: 'Alex Frames',
      event: 'Festival',
      status: 'Pending' as const,
      avatar: 'https://randomuser.me/api/portraits/men/44.jpg'
    }
  ];

  const recentPayments = [
    {
      name: 'John Studio',
      type: 'Booking Payment',
      amount: '$1,950',
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      name: 'Mary Shots',
      type: 'Photo Package',
      amount: '$850',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      name: 'Amoria',
      type: 'Platform Fee',
      amount: '$25.00',
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
        <Topbar userRole="client" giftAmount={225.00} />

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
                }}>Spent</span>
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
                }}>Bookings</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: '#111827'
                }}>12</span>
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
                }}>Photos</span>
                <span style={{
                  fontSize: '1.25rem',
                  lineHeight: '1.75rem',
                  fontWeight: '700',
                  color: '#111827'
                }}>248</span>
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
          title="Total Spent"
          value="$2,600"
          percentage="52.76%"
          timeframe="last week"
          icon={<MoneyIcon />}
          trend="up"
          href="/user/client/transactions"
        />
        <StatCard
          title="Pending"
          value="$700"
          percentage="36.8%"
          timeframe="last week"
          icon={<ClockIcon />}
          trend="down"
          href="/user/client/bookings"
        />
        <StatCard
          title="Bookings"
          value="12"
          percentage="5.4%"
          timeframe="last week"
          icon={<UsersIcon />}
          trend="up"
          href="/user/client/bookings"
        />
        <StatCard
          title="Gifts"
          value="$225"
          percentage="12.5%"
          timeframe="last week"
          icon={<GiftIcon />}
          trend="up"
          href="/user/client/payments"
        />
        <StatCard
          title="Favorites"
          value="8"
          percentage="8%"
          timeframe="photographers"
          icon={<StarIcon />}
          trend="up"
          href="/user/client/photographers"
        />
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <div style={{
          backgroundColor: hasFailedPayments ? '#FEF2F2' : '#FFFBEB',
          border: `1px solid ${hasFailedPayments ? '#FECACA' : '#FDE68A'}`,
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                backgroundColor: hasFailedPayments ? '#FEE2E2' : '#FEF3C7',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangleIcon />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: hasFailedPayments ? '#DC2626' : '#D97706',
                  margin: 0
                }}>
                  {hasFailedPayments ? 'Payment Action Required' : 'Pending Payments'}
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: hasFailedPayments ? '#991B1B' : '#92400E',
                  margin: '0.25rem 0 0 0'
                }}>
                  You have {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} totaling <strong>${totalPendingAmount}</strong> that need{pendingPayments.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
            <Link
              href="/user/client/payments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#083A85',
                textDecoration: 'none'
              }}
            >
              View All
              <ChevronRightIcon />
            </Link>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}>
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  flex: '0 0 auto',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  minWidth: '280px',
                  border: payment.status === 'failed' ? '1px solid #FECACA' : '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <Image
                  src={payment.photographerImage}
                  alt={payment.photographerName}
                  width={40}
                  height={40}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {payment.eventName}
                    {payment.status === 'failed' && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626'
                      }}>
                        FAILED
                      </span>
                    )}
                    {payment.status === 'partially_paid' && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px',
                        backgroundColor: '#DBEAFE',
                        color: '#2563EB'
                      }}>
                        PARTIAL
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    {payment.photographerName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: payment.status === 'failed' ? '#DC2626' : '#083A85'
                  }}>
                    ${payment.amount - payment.paidAmount}
                  </div>
                  <Link
                    href="/user/client/payments"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: payment.status === 'failed' ? '#F20C8F' : '#083A85',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.25rem'
                    }}
                  >
                    {payment.status === 'failed' ? (
                      <>
                        <RefreshIcon />
                        Retry
                      </>
                    ) : (
                      <>
                        <CreditCardIcon />
                        Pay
                      </>
                    )}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              }}>Photographers</h2>
              <a href="#" style={{
                fontSize: '1rem',
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
              {photographers.map((photographer, index) => (
                <ClientItem key={index} {...photographer} />
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
              <a href="#" style={{
                fontSize: '1rem',
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
