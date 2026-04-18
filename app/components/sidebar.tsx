"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth, dashboardAuthFetch } from "../providers/AuthProvider";
import { getLandingUrl } from "@/lib/urls";

type UserRole = "photographer" | "client" | "event-coordinator" | "admin";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

import { getApiUrl } from '@/lib/api';

// Role-based navigation configurations
const roleNavigationMap: Record<UserRole, NavigationItem[]> = {
  photographer: [
    { name: "Home", href: "/user/photographer/dashboard", icon: "bi-house" },
    { name: "Notifications", href: "/user/photographer/notifications", icon: "bi-bell" },
    { name: "Transactions", href: "/user/photographer/transaction", icon: "bi-arrow-repeat" },
    { name: "Wallet", href: "/user/photographer/wallet", icon: "bi-wallet2" },
    { name: "Donate", href: "/user/photographer/donate", icon: "bi-heart-fill" },
    { name: "Events", href: "/user/photographer/events", icon: "bi-calendar-event" },
    { name: "Inbox", href: "/user/photographer/inbox", icon: "bi-chat-dots" },
    { name: "Clients", href: "/user/photographer/clients", icon: "bi-people" },
  ],
  client: [
    { name: "Home", href: "/user/client/home", icon: "bi-house" },
    { name: "Notifications", href: "/user/client/notifications", icon: "bi-bell" },
    { name: "My Events", href: "/user/client/events", icon: "bi-calendar-event" },
    { name: "Streams", href: "/user/client/streams", icon: "bi-broadcast" },
    { name: "Gallery", href: "/user/client/gallery", icon: "bi-image" },
    { name: "Photographers", href: "/user/client/photographers", icon: "bi-camera" },
    { name: "Payments", href: "/user/client/payments", icon: "bi-credit-card" },
    { name: "Wallet", href: "/user/client/wallet", icon: "bi-wallet2" },
    { name: "Donate", href: "/user/client/donate", icon: "bi-heart-fill" },
    { name: "Inbox", href: "/user/client/inbox", icon: "bi-chat-dots" },
  ],
  "event-coordinator": [
    { name: "Home", href: "/user/event-coordinator/home", icon: "bi-house" },
    { name: "Notifications", href: "/user/event-coordinator/notifications", icon: "bi-bell" },
    { name: "My Events", href: "/user/event-coordinator/events", icon: "bi-calendar-event" },
    { name: "Streams", href: "/user/event-coordinator/streams", icon: "bi-broadcast" },
    { name: "Gallery", href: "/user/event-coordinator/gallery", icon: "bi-image" },
    { name: "Photographers", href: "/user/event-coordinator/photographers", icon: "bi-camera" },
    { name: "Payments", href: "/user/event-coordinator/payments", icon: "bi-credit-card" },
    { name: "Wallet", href: "/user/event-coordinator/wallet", icon: "bi-wallet2" },
    { name: "Donate", href: "/user/event-coordinator/donate", icon: "bi-heart-fill" },
    { name: "Inbox", href: "/user/event-coordinator/inbox", icon: "bi-chat-dots" },
  ],
  admin: [
    { name: "Wallets", href: "/user/admin/wallets", icon: "bi-wallet2" },
  ],
};

// Role-based bottom navigations
const getBottomNavigationItems = (role: UserRole): NavigationItem[] => {
  if (role === "photographer") {
    return [
      { name: "Profile", href: "/user/photographer/profile", icon: "bi-person" },
      { name: "Preferences", href: "/user/photographer/preferences", icon: "bi-sliders" },
      { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
    ];
  } else if (role === "event-coordinator") {
    return [
      { name: "Profile", href: "/user/event-coordinator/profile", icon: "bi-person" },
      { name: "Preferences", href: "/user/event-coordinator/preferences", icon: "bi-sliders" },
      { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
    ];
  } else if (role === "admin") {
    return [
      { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
    ];
  } else {
    return [
      { name: "Profile", href: "/user/client/profile", icon: "bi-person" },
      { name: "Preferences", href: "/user/client/preferences", icon: "bi-sliders" },
      { name: "Logout", href: "/", icon: "bi-box-arrow-right" },
    ];
  }
};

// Function to detect role from pathname
const detectRoleFromPath = (pathname: string | null): UserRole => {
  if (pathname && pathname.includes("/user/admin")) {
    return "admin";
  }
  if (pathname && pathname.includes("/user/photographer")) {
    return "photographer";
  }
  if (pathname && pathname.includes("/user/event-coordinator")) {
    return "event-coordinator";
  }
  return "client";
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { colors, actualTheme } = useTheme();
  const { logout, token, user } = useDashboardAuth();
  const currentUserId = user?.id || '';
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Automatically detect role from current URL path
  const currentRole = useMemo(() => detectRoleFromPath(pathname), [pathname]);

  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  // Tracks the timestamp of the last inbox:totalCount event so that any
  // fetchBadgeCounts API response that started BEFORE this event is ignored.
  // This prevents a slow/in-flight poll from overwriting a badge that was
  // just set to 0 by a read operation.
  const lastInboxEventTimeRef = useRef<number>(0);

  const fetchBadgeCounts = useCallback(async () => {
    if (!token) return;
    const fetchStartTime = Date.now();
    const apiUrl = getApiUrl();
    const notifPrefix = currentRole === 'photographer' ? 'photographer' : currentRole === 'event-coordinator' ? 'coordinator' : 'customer';
    const isOnInboxPage = pathname?.includes('/inbox');
    try {
      const [notifRes, convRes] = await Promise.all([
        dashboardAuthFetch(`${apiUrl}/api/remote/${notifPrefix}/notifications/unread-count`, { method: 'GET' }),
        dashboardAuthFetch(`${apiUrl}/api/remote/chat/conversations`, { method: 'GET' }),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.action === 1) setNotificationCount(data.data ?? 0);
      }
      if (convRes.ok && !isOnInboxPage) {
        const data = await convRes.json();
        const list = data.data || data || [];
        if (Array.isArray(list)) {
          const validList = currentUserId
            ? list.filter((c: any) =>
                (c.participants || []).some((p: any) => p.id && p.id !== currentUserId)
              )
            : list;
          const total = validList.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
          if (lastInboxEventTimeRef.current <= fetchStartTime) {
            setMessageCount(total);
          }
        }
      }
    } catch {
      // silent fail
    }
  }, [token, currentRole, pathname, currentUserId]);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    const handleBadgeUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'notification') {
        setNotificationCount(prev => Math.max(0, prev - (detail.count || 1)));
      } else {
        fetchBadgeCounts();
      }
    };
    window.addEventListener('badge-update', handleBadgeUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('badge-update', handleBadgeUpdate);
    };
  }, [fetchBadgeCounts]);

  // Immediately set the sidebar badge to the server's exact total when the inbox
  // page dispatches fresh conversation data (on load or on read).
  useEffect(() => {
    const handleTotalCount = (e: Event) => {
      const total = (e as CustomEvent<{ total: number }>).detail?.total ?? 0;
      setMessageCount(total);
      // Record when this event fired so fetchBadgeCounts can detect the race.
      lastInboxEventTimeRef.current = Date.now();
    };
    window.addEventListener('inbox:totalCount', handleTotalCount);
    return () => window.removeEventListener('inbox:totalCount', handleTotalCount);
  }, []);

  // Check if photographer is not accepted (pending or rejected) — restrict to profile only
  const isNotAccepted = currentRole === 'photographer' && user?.profileReviewStatus?.toUpperCase() !== 'ACCEPTED';

  const navigationItems = roleNavigationMap[currentRole].map(item => {
    if (item.name === "Notifications") {
      return { ...item, badge: notificationCount };
    }
    if (item.name === "Inbox") {
      return { ...item, badge: messageCount };
    }
    return item;
  });
  const bottomNavigationItems = getBottomNavigationItems(currentRole);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <style jsx>{`
        /* Desktop styles */
        .sidebar-container {
          /* All desktop styles are handled by inline styles */
        }

        .mobile-menu-button {
          display: none;
        }

        .mobile-overlay {
          display: none;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed !important;
            left: ${isMobileMenuOpen ? '0' : '-100%'} !important;
            top: 0 !important;
            z-index: 1000 !important;
            width: 16rem !important;
            transition: left 0.3s ease-in-out !important;
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            box-shadow: ${isMobileMenuOpen ? '2px 0 10px rgba(0, 0, 0, 0.3)' : 'none'} !important;
          }

          .mobile-menu-button {
            display: flex !important;
            position: fixed !important;
            top: 1rem !important;
            left: ${isMobileMenuOpen ? '16.5rem' : '0.5rem'} !important;
            z-index: 1001 !important;
            background-color: ${colors.bgSecondary} !important;
            border: 2px solid ${colors.borderPrimary} !important;
            border-radius: 0.5rem !important;
            padding: 0.4rem !important;
            cursor: pointer !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: ${colors.shadowMd} !important;
            transition: left 0.3s ease-in-out !important;
          }

          .mobile-overlay {
            display: ${isMobileMenuOpen ? 'block' : 'none'} !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            z-index: 999 !important;
          }

          .sidebar-toggle-desktop {
            display: none !important;
          }

          .sidebar-logo-icon {
            width: 39px !important;
            height: 39px !important;
          }

          .sidebar-logo-text {
            font-size: 1.25rem !important;
          }
        }

        /* Very small mobile */
        @media (max-width: 480px) {
          .sidebar-container {
            width: 14rem !important;
          }

          .mobile-menu-button {
            left: ${isMobileMenuOpen ? '14.5rem' : '0.5rem'} !important;
          }
        }
      `}</style>

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={toggleMobileMenu}
        style={{
          color: colors.textPrimary
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isMobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </>
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      <div className="mobile-overlay" onClick={closeMobileMenu} />

      <aside className="sidebar-container" style={{
      display: 'flex',
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: colors.bgSidebar,
      transition: 'all 0.3s',
      borderTopRightRadius: '18px',
      borderBottomRightRadius: '18px',
      width: isCollapsed ? '4rem' : '14rem'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingTop: '1.25rem',
        paddingBottom: '1.25rem'
      }}>
        {!isCollapsed && (
          <Link href={getLandingUrl()} className="sidebar-logo-link" style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            textDecoration: 'none',
            flexShrink: 0,
          }}>
            <img
              src="/logo.png"
              alt="Connekyt Logo"
              className="sidebar-logo-icon"
              style={{
                width: '49px',
                height: '49px',
                objectFit: 'contain',
                position: 'relative',
                top: '-1px',
                left: '-15px',
              }}
            />
            <span className="sidebar-logo-text" style={{
              fontWeight: '700',
              color: '#083A85',
              fontSize: '1.3rem',
              marginLeft: '-20px',
              letterSpacing: '0.3px',
            }}>Connekyt</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-desktop"
          style={{
            color: colors.textPrimary,
            transition: 'color 0.3s',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: 0
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="7.8" y1="3" x2="7.8" y2="21"/>
          </svg>
        </button>
      </div>

      {/* Main Navigation */}
      <nav style={{
        flex: 1,
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
        paddingTop: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem',
        overflowY: 'auto',
        minHeight: 0
      }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.name === 'Transactions' && pathname === `/user/${currentRole}/all-transactions`);

          const navStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '0.75rem',
            borderRadius: '0.375rem',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            fontSize: '15px',
            fontWeight: '400' as const,
            transition: 'all 0.2s',
            backgroundColor: isActive && !isNotAccepted ? colors.bgActive : 'transparent',
            color: isNotAccepted ? colors.textSecondary : (isActive ? colors.textInverse : colors.textPrimary),
            boxShadow: isActive && !isNotAccepted ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
            textDecoration: 'none',
            opacity: isNotAccepted ? 0.4 : 1,
            cursor: isNotAccepted ? 'not-allowed' : 'pointer',
            pointerEvents: isNotAccepted ? 'none' as const : 'auto' as const,
          };

          if (isNotAccepted) {
            return (
              <div key={item.name} style={navStyle} title={isCollapsed ? item.name : undefined}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i style={{ fontSize: '18px' }} className={`bi ${item.icon}`}></i>
                </div>
                {!isCollapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <span>{item.name}</span>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobileMenu}
              style={navStyle}
              title={isCollapsed ? item.name : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = colors.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onMouseDown={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE';
                }
              }}
              onMouseUp={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = colors.bgHover;
                }
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i style={{ fontSize: '18px' }} className={`bi ${item.icon}`}></i>
                {/* Badge for collapsed sidebar */}
                {isCollapsed && item.badge && item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-10px',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '9999px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: `0 0 0 2px ${colors.bgSidebar}, 0 1px 3px rgba(239, 68, 68, 0.3)`
                  }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <span>{item.name}</span>
                  {/* Badge for expanded sidebar */}
                  {item.badge && item.badge > 0 && (
                    <span style={{
                      backgroundColor: '#EF4444',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '10px',
                      minWidth: '24px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 8px',
                      boxShadow: '0 1px 3px rgba(239, 68, 68, 0.25)'
                    }}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <nav style={{
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        borderTop: `2px solid ${colors.borderPrimary}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem'
      }}>
        {bottomNavigationItems.map((item) => {
          const isActive = pathname === item.href;
          const isLogout = item.name === 'Logout';
          const isProfile = item.name === 'Profile';
          const isDisabledItem = isNotAccepted && !isLogout && !isProfile;

          const bottomNavStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '0.75rem',
            borderRadius: '0.375rem',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            fontSize: '15px',
            fontWeight: '400' as const,
            transition: 'all 0.2s',
            backgroundColor: isActive && !isDisabledItem ? colors.bgActive : 'transparent',
            color: isDisabledItem ? colors.textSecondary : (isActive ? colors.textInverse : colors.textPrimary),
            boxShadow: isActive && !isDisabledItem ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
            textDecoration: 'none',
            opacity: isDisabledItem ? 0.4 : 1,
            cursor: isDisabledItem ? 'not-allowed' : 'pointer',
            pointerEvents: isDisabledItem ? 'none' as const : 'auto' as const,
          };

          if (isDisabledItem) {
            return (
              <div key={item.name} style={bottomNavStyle} title={isCollapsed ? item.name : undefined}>
                <i style={{ fontSize: '18px' }} className={`bi ${item.icon}`}></i>
                {!isCollapsed && <span>{item.name}</span>}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (isLogout) {
                  e.preventDefault();
                  setShowLogoutModal(true);
                } else {
                  closeMobileMenu();
                }
              }}
              style={bottomNavStyle}
              title={isCollapsed ? item.name : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = colors.bgHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onMouseDown={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = actualTheme === 'dark' ? '#1E3A5F' : '#DBEAFE';
                }
              }}
              onMouseUp={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = colors.bgHover;
                }
              }}
            >
              <i style={{ fontSize: '18px' }} className={`bi ${item.icon}`}></i>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>

    {/* Logout Confirmation Modal */}
    {showLogoutModal && (
      <div
        onClick={() => setShowLogoutModal(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '380px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: actualTheme === 'dark' ? '#3B1A1A' : '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,17 21,12 16,7" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.textPrimary, margin: '0 0 0.5rem' }}>
            Are you sure you want to logout?
          </h3>

          {/* Description */}
          <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1.5rem', lineHeight: '1.5' }}>
            You will be signed out of your account and redirected to the login page.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                flex: 1,
                padding: '0.625rem',
                border: `2px solid ${colors.borderPrimary}`,
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
              style={{
                flex: 1,
                padding: '0.625rem',
                border: '2px solid #B91C1C',
                borderRadius: '0.5rem',
                backgroundColor: '#DC2626',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
