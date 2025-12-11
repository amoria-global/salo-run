"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../../components/sidebar';
import Topbar from '../../components/topbar';

// Icons
const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaymentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 10H22" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V22M3 12H21" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8C12 8 12 5 9.5 5C7 5 7 8 9.5 8H12M12 8C12 8 12 5 14.5 5C17 5 17 8 14.5 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Notification types specific to freelancers
type NotificationType = 'payment' | 'tip' | 'bonus' | 'security' | 'album' | 'review';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  amount?: number;
  actionUrl?: string;
}

// Sample notifications data for freelancer
const freelancerNotifications: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $320.00 from Amanda Foster for Portrait Photography session',
    timestamp: '5 minutes ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    amount: 320.00,
    actionUrl: '/user/freelancer/transaction'
  },
  {
    id: '2',
    type: 'tip',
    title: 'New Tip Received',
    message: 'Kevin Brown sent you a $15.00 tip for your creative work!',
    timestamp: '30 minutes ago',
    read: false,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    amount: 15.00
  },
  {
    id: '3',
    type: 'security',
    title: 'Login from New Device',
    message: 'Your account was accessed from Safari on macOS. Location: New York, USA',
    timestamp: '2 hours ago',
    read: false,
    actionUrl: '/user/freelancer/profile'
  },
  {
    id: '4',
    type: 'bonus',
    title: 'Weekly Bonus Earned',
    message: 'You earned a $25.00 bonus for maintaining a 5-star rating this week!',
    timestamp: '3 hours ago',
    read: true,
    amount: 25.00
  },
  {
    id: '5',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $850.00 from Rachel Green for Event Coverage package',
    timestamp: '5 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    amount: 850.00,
    actionUrl: '/user/freelancer/transaction'
  },
  {
    id: '6',
    type: 'review',
    title: 'New 5-Star Review',
    message: 'Daniel Martinez left you a 5-star review: "Incredible talent! Best freelancer I\'ve worked with."',
    timestamp: '6 hours ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg'
  },
  {
    id: '7',
    type: 'tip',
    title: 'New Tip Received',
    message: 'Sophie Turner sent you a $30.00 tip with message: "Love the product shots!"',
    timestamp: 'Yesterday',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    amount: 30.00
  },
  {
    id: '8',
    type: 'security',
    title: 'Account Recovery Email Sent',
    message: 'A password recovery email was sent to your registered email address.',
    timestamp: 'Yesterday',
    read: true
  },
  {
    id: '9',
    type: 'bonus',
    title: 'Referral Bonus',
    message: 'Congratulations! You earned a $20.00 referral bonus for inviting Maria Garcia.',
    timestamp: '2 days ago',
    read: true,
    amount: 20.00
  },
  {
    id: '10',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $275.00 from Chris Anderson for Headshot Session',
    timestamp: '3 days ago',
    read: true,
    avatar: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    amount: 275.00,
    actionUrl: '/user/freelancer/transaction'
  }
];

const FreelancerNotifications = () => {
  const [notifications, setNotifications] = useState(freelancerNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'payment':
        return { icon: <PaymentIcon />, bg: '#DCFCE7', color: '#16A34A' };
      case 'tip':
        return { icon: <GiftIcon />, bg: '#FEF3C7', color: '#F59E0B' };
      case 'bonus':
        return { icon: <StarIcon />, bg: '#DBEAFE', color: '#2563EB' };
      case 'security':
        return { icon: <ShieldIcon />, bg: '#FEE2E2', color: '#DC2626' };
      case 'album':
        return { icon: <ImageIcon />, bg: '#F3E8FF', color: '#9333EA' };
      case 'review':
        return { icon: <StarIcon />, bg: '#FEF3C7', color: '#F59E0B' };
      default:
        return { icon: <BellIcon />, bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const filterOptions: { value: 'all' | NotificationType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'payment', label: 'Payments' },
    { value: 'tip', label: 'Tips' },
    { value: 'bonus', label: 'Bonuses' },
    { value: 'security', label: 'Security' },
    { value: 'review', label: 'Reviews' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar userRole="freelancer" tipsAmount={185.00} bonusAmount={420.00} balanceAmount={3250.00} />

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#EF4444',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px'
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p style={{
                fontSize: '0.95rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>
                Stay updated with your payments, tips, bonuses, and account activity
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <CheckIcon />
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title="Notification Settings"
              >
                <SettingsIcon />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Total Notifications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#083A85' }}>{notifications.length}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Unread</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{unreadCount}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Payments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16A34A' }}>
                {notifications.filter(n => n.type === 'payment').length}
              </div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.25rem' }}>Tips & Bonuses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>
                {notifications.filter(n => n.type === 'tip' || n.type === 'bonus').length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: activeFilter === option.value ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: activeFilter === option.value ? '#083A85' : 'white',
                    color: activeFilter === option.value ? 'white' : '#6B7280',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {notifications.some(n => n.read) && (
              <button
                onClick={deleteAllRead}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#DC2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s'
                }}
              >
                <TrashIcon />
                Clear read
              </button>
            )}
          </div>

          {/* Results Count */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Notifications List */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            {filteredNotifications.length === 0 ? (
              <div style={{
                padding: '4rem 1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: '#9CA3AF'
                }}>
                  <BellIcon />
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 0.5rem 0'
                }}>No notifications</h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#6B7280',
                  margin: 0
                }}>
                  {activeFilter === 'all'
                    ? "You're all caught up!"
                    : `No ${activeFilter} notifications yet`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const iconStyle = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderBottom: index < filteredNotifications.length - 1 ? '1px solid #F3F4F6' : 'none',
                      backgroundColor: notification.read ? 'white' : '#F0F9FF',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => markAsRead(notification.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? '#F9FAFB' : '#E0F2FE';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#F0F9FF';
                    }}
                  >
                    {/* Icon or Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: notification.avatar ? 'transparent' : iconStyle.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: iconStyle.color,
                      overflow: 'hidden'
                    }}>
                      {notification.avatar ? (
                        <Image
                          src={notification.avatar}
                          alt=""
                          width={48}
                          height={48}
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        iconStyle.icon
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.95rem',
                            fontWeight: notification.read ? '500' : '600',
                            color: '#111827'
                          }}>
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6'
                            }} />
                          )}
                          {notification.amount && (
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: notification.type === 'payment' ? '#16A34A'
                                : notification.type === 'tip' ? '#F59E0B'
                                : '#2563EB',
                              backgroundColor: notification.type === 'payment' ? '#DCFCE7'
                                : notification.type === 'tip' ? '#FEF3C7'
                                : '#DBEAFE',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}>
                              +${notification.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap'
                        }}>
                          {notification.timestamp}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {notification.message}
                      </p>

                      {/* Action buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginTop: '0.75rem'
                      }}>
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              color: '#083A85',
                              textDecoration: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View details
                          </Link>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            color: '#DC2626',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerNotifications;
