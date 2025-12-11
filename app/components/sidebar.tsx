"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useMemo } from "react";

type UserRole = "photographer" | "client" | "freelancer";

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
    freelancer: { notifications: 3, messages: 4 },
    client: { notifications: 4, messages: 2 }
  };
  return counts[role];
};

// Role-based navigation configurations
const roleNavigationMap: Record<UserRole, NavigationItem[]> = {
  photographer: [
    { name: "Home", href: "/user/photographer/dashboard", icon: "bi-house" },
    { name: "Notifications", href: "/user/photographer/notifications", icon: "bi-bell" },
    { name: "Transactions", href: "/user/photographer/transaction", icon: "bi-arrow-repeat" },
    { name: "Gallery", href: "/user/photographer/gallery", icon: "bi-image" },
    { name: "Streams", href: "/user/photographer/streams", icon: "bi-broadcast" },
    { name: "Inbox", href: "/user/photographer/inbox", icon: "bi-chat-dots" },
    { name: "Clients", href: "/user/photographer/clients", icon: "bi-people" },
  ],
  freelancer: [
    { name: "Home", href: "/user/freelancer/dashboard", icon: "bi-house" },
    { name: "Notifications", href: "/user/freelancer/notifications", icon: "bi-bell" },
    { name: "Transactions", href: "/user/freelancer/transaction", icon: "bi-arrow-repeat" },
    { name: "Gallery", href: "/user/freelancer/gallery", icon: "bi-image" },
    { name: "Streams", href: "/user/freelancer/streams", icon: "bi-broadcast" },
    { name: "Inbox", href: "/user/freelancer/inbox", icon: "bi-chat-dots" },
    { name: "Clients", href: "/user/freelancer/clients", icon: "bi-people" },
  ],
  client: [
    { name: "Home", href: "/user/client/home", icon: "bi-house" },
    { name: "Notifications", href: "/user/client/notifications", icon: "bi-bell" },
    { name: "My Events", href: "/user/client/events", icon: "bi-calendar-event" },
    { name: "Gallery", href: "/user/client/gallery", icon: "bi-image" },
    { name: "Photographers", href: "/user/client/photographers", icon: "bi-camera" },
    { name: "Payments", href: "/user/client/payments", icon: "bi-credit-card" },
    { name: "Inbox", href: "/user/client/inbox", icon: "bi-chat-dots" },
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
  } else if (role === "freelancer") {
    return [
      { name: "Profile", href: "/user/freelancer/profile", icon: "bi-person" },
      { name: "Preferences", href: "/user/freelancer/preferences", icon: "bi-sliders" },
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
  if (pathname && pathname.includes("/user/freelancer")) {
    return "freelancer";
  }
  return "client";
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <aside style={{
      display: 'flex',
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5',
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
              color: '#111827',
              lineHeight: '1'
            }}>Amoria</span>
            <Image
              src="/logo.png"
              alt="Logo"
              width={48}
              height={59}
              style={{
                marginLeft: '-0.625rem'
              }}
            />
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          style={{
            color: 'black',
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
        gap: '0.125rem'
      }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
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
                backgroundColor: isActive ? '#083A85' : 'transparent',
                color: isActive ? 'white' : '#15191F',
                boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                textDecoration: 'none'
              }}
              title={isCollapsed ? item.name : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseDown={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#D1D5DB';
                }
              }}
              onMouseUp={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
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
                    boxShadow: '0 0 0 2px #f5f5f5, 0 1px 3px rgba(239, 68, 68, 0.3)'
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
        borderTop: '1px solid #D1D5DB',
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
                backgroundColor: isActive ? '#083A85' : 'transparent',
                color: isActive ? 'white' : '#374151',
                boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                textDecoration: 'none'
              }}
              title={isCollapsed ? item.name : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseDown={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#D1D5DB';
                }
              }}
              onMouseUp={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
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
  );
}
