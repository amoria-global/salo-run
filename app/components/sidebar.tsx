"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

type UserRole = "photographer" | "client" | "freelancer";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

// Role-based navigation configurations
const roleNavigationMap: Record<UserRole, NavigationItem[]> = {
  photographer: [
    { name: "Home", href: "/", icon: "bi-house" },
    { name: "Transactions", href: "/transactions", icon: "bi-arrow-repeat" },
    { name: "Gallery", href: "/gallery", icon: "bi-image" },
    { name: "Streams", href: "/streams", icon: "bi-broadcast" },
    { name: "Inbox", href: "/inbox", icon: "bi-chat-dots" },
    { name: "Clients", href: "/clients", icon: "bi-people" },
  ],
  client: [
    { name: "Home", href: "/", icon: "bi-house" },
    { name: "My Photos", href: "/my-photos", icon: "bi-image" },
    { name: "Photographers", href: "/photographers", icon: "bi-camera" },
    { name: "Bookings", href: "/bookings", icon: "bi-calendar-check" },
    { name: "Payments", href: "/payments", icon: "bi-credit-card" },
    { name: "Inbox", href: "/inbox", icon: "bi-chat-dots" },
  ],
  freelancer: [
    { name: "Home", href: "/", icon: "bi-house" },
    { name: "Projects", href: "/projects", icon: "bi-folder" },
    { name: "Clients", href: "/clients", icon: "bi-people" },
    { name: "Invoices", href: "/invoices", icon: "bi-file-text" },
    { name: "Transactions", href: "/transactions", icon: "bi-arrow-repeat" },
    { name: "Portfolio", href: "/portfolio", icon: "bi-image" },
    { name: "Inbox", href: "/inbox", icon: "bi-chat-dots" },
  ],
};

const bottomNavigationItems: NavigationItem[] = [
  { name: "Profile", href: "/profile", icon: "bi-person" },
  { name: "Preferences", href: "/preferences", icon: "bi-sliders" },
  { name: "Logout", href: "/logout", icon: "bi-box-arrow-right" },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Local state for role - change "photographer" to "client" or "freelancer" to test different roles
  const [currentRole, setCurrentRole] = useState<UserRole>("photographer");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = roleNavigationMap[currentRole];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`flex h-screen flex-col bg-[#f5f5f5] transition-all duration-300 rounded-r-[18px] ${isCollapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        {!isCollapsed && (
          <Link href="/" className="flex items-center cursor-pointer">
            <span className="text-2xl font-bold text-gray-900 leading-none">Amoria</span>
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="-ml-2" />
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="text-black hover:text-black transition-colors cursor-pointer"
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
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-md px-3 py-2.5 text-[15px] font-normal transition-all duration-200 ${
                isActive
                  ? "bg-[#083A85] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 active:bg-gray-300"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <i className={`bi ${item.icon} text-[18px]`}></i>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <nav className="space-y-0.5 border-t border-gray-300 px-3 py-3">
        {bottomNavigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-md px-3 py-2.5 text-[15px] font-normal transition-all duration-200 ${
                isActive
                  ? "bg-[#083A85] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-200 hover:text-gray-900 active:bg-gray-300"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <i className={`bi ${item.icon} text-[18px]`}></i>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
