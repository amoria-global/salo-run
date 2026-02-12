"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useDashboardAuth } from "../providers/AuthProvider";

type UserRole = "photographer" | "client" | "event-coordinator";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

// Badge counts for notifications and messages (in real app, these would come from API/context)
const getNotificationCounts = (role: UserRole) => {
  // Sample notification counts - in production, these would be fetched from backend
  const counts = {
    photographer: { notifications: 5, messages: 6 },
    client: { notifications: 4, messages: 2 },
    "event-coordinator": { notifications: 6, messages: 3 }
  };
  return counts[role];
};

// Role-based navigation configurations
const roleNavigationMap: Record<UserRole, NavigationItem[]> = {
  photographer: [
    { name: "Home", href: "/user/photographer/dashboard", icon: "bi-house" },
    { name: "Notifications", href: "/user/photographer/notifications", icon: "bi-bell" },
    { name: "Transactions", href: "/user/photographer/transaction", icon: "bi-arrow-repeat" },
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
    { name: "Inbox", href: "/user/event-coordinator/inbox", icon: "bi-chat-dots" },
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
  const { logout } = useDashboardAuth();

  // Automatically detect role from current URL path
  const currentRole = useMemo(() => detectRoleFromPath(pathname), [pathname]);

  const notificationCounts = getNotificationCounts(currentRole);
  const navigationItems = roleNavigationMap[currentRole].map(item => {
    // Add badge counts for Notifications and Inbox
    if (item.name === "Notifications") {
      return { ...item, badge: notificationCounts.notifications };
    }
    if (item.name === "Inbox") {
      return { ...item, badge: notificationCounts.messages };
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
            left: 0.5rem !important;
            z-index: 1001 !important;
            background-color: ${colors.bgSecondary} !important;
            border: 2px solid ${colors.borderPrimary} !important;
            border-radius: 0.5rem !important;
            padding: 0.4rem !important;
            cursor: pointer !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: ${colors.shadowMd} !important;
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
        }

        /* Very small mobile */
        @media (max-width: 480px) {
          .sidebar-container {
            width: 14rem !important;
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
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
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
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: colors.textPrimary,
              lineHeight: '1'
            }}>Amoria</span>
            <Image
              src={actualTheme === 'dark' ? '/fav.png' : '/logo.png'}
              alt="Logo"
              width={actualTheme === 'dark' ? 42 : 48}
              height={actualTheme === 'dark' ? 47 : 59}
              style={{
                marginLeft: actualTheme === 'dark' ? '-0.48rem' : '-0.625rem'
              }}
            />
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
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobileMenu}
              style={{
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
                fontWeight: '400',
                transition: 'all 0.2s',
                backgroundColor: isActive ? colors.bgActive : 'transparent',
                color: isActive ? colors.textInverse : colors.textPrimary,
                boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                textDecoration: 'none'
              }}
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

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (item.name === 'Logout') {
                  e.preventDefault();
                  logout();
                } else {
                  closeMobileMenu();
                }
              }}
              style={{
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
                fontWeight: '400',
                transition: 'all 0.2s',
                backgroundColor: isActive ? colors.bgActive : 'transparent',
                color: isActive ? colors.textInverse : colors.textPrimary,
                boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                textDecoration: 'none'
              }}
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
    </>
  );
}
