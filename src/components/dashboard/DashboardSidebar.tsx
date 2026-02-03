'use client';

import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { useAuthentication } from '@/hooks/useAuthentication';
import { useFriendsContext } from '@/contexts/FriendsProvider';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMobileNavigation, useClickOutside } from '@/contexts/MobileNavigationProvider';
import {
  LayoutDashboard,
  BarChart,
  Settings,
  Users,
  LogOut,
  X
} from 'lucide-react';

// Default avatar as a data URL (simple user silhouette)
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMTkgMjFhNyA3IDAgMSAwLTE0IDB2LTFhNyA3IDAgMCAxIDE0IDB2MSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjQiLz48L3N2Zz4=';

export default function DashboardSidebar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { handleLogout, loading } = useAuthentication();
  const { pendingCount } = useFriendsContext();
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop, isSidebarOpen, closeSidebar } = useMobileNavigation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside on mobile/tablet
  useClickOutside(sidebarRef, closeSidebar, (isMobile || isTablet) && isSidebarOpen);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Statistics', href: '/statistics', icon: BarChart },
    { name: 'Friends', href: '/friends', icon: Users, badge: pendingCount },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Handle navigation link clicks on mobile - close sidebar
  const handleNavClick = () => {
    if (isMobile || isTablet) {
      closeSidebar();
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "bg-primary text-white flex flex-col shadow-lg transition-all duration-300 z-50",
        // Desktop: Fixed positioning, always visible
        isDesktop && "fixed top-0 left-0 h-screen w-[280px] rounded-r-3xl",
        // Tablet: Overlay sidebar (fixed positioning with slide animation)
        isTablet && [
          "fixed top-0 left-0 h-screen w-[240px] rounded-r-2xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        ],
        // Mobile: Overlay sidebar (fixed positioning with slide animation)
        isMobile && [
          "fixed top-0 left-0 h-screen w-[280px] rounded-r-3xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        ]
      )}
    >
      {/* Mobile Close Button */}
      {(isMobile || isTablet) && (
        <div className="flex justify-end px-4 pt-4 pb-0">
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className={cn(
        "flex justify-center",
        isMobile || isTablet ? "pt-0 pb-4 px-6" : "pt-12 pb-4 px-6"
      )}>
        <Logo
          variant="white"
          width={isMobile || isTablet ? 170 : 200}
          height={isMobile || isTablet ? 45 : 47}
        />
      </div>

      {/* Profile section */}
      <div className={cn(
        "flex flex-col items-center border-b border-white/10",
        isMobile || isTablet ? "px-6 pt-2 pb-6" : "px-8 pt-2 pb-6"
      )}>
        <div className={cn(
          "relative mb-4 group",
          isMobile || isTablet ? "w-16 h-16" : "w-20 h-20"
        )}>
          <div className="absolute inset-0 rounded-full border-2 border-accent opacity-70 transition-all duration-300 group-hover:opacity-100"></div>
          <div className="w-full h-full rounded-full bg-white/20 overflow-hidden">
            {/* Use avatar from profile (DB source of truth) with fallback to auth metadata */}
            <img
              src={profile?.avatar_url || user?.user_metadata?.avatar_url || DEFAULT_AVATAR}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
          </div>
        </div>
        <h3 className={cn(
          "font-bold uppercase tracking-wide text-center",
          isMobile || isTablet ? "text-sm" : "text-base"
        )}>
          {profile?.first_name || user?.user_metadata?.first_name} {profile?.last_name || user?.user_metadata?.last_name}
        </h3>
        <p className="text-xs text-white/60 truncate max-w-full mt-1 text-center">
          {user?.email}
        </p>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1",
        isMobile || isTablet ? "px-4 py-4" : "px-4 py-6"
      )}>
        <div className="mb-4 px-2 text-xs uppercase tracking-wider text-white/50 font-medium">
          Menu
        </div>
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center justify-between rounded-2xl text-sm font-medium uppercase tracking-wide transition-all duration-200",
                  // Touch-friendly padding on mobile
                  isMobile || isTablet ? "px-4 py-4" : "px-6 py-3",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-white text-primary"
                    : "text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10"
                )}
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors duration-200",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "text-accent"
                        : ""
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full"
                    style={{ backgroundColor: '#6DDC91', color: '#FFFFFF' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout button */}
      <div className={cn(
        "mt-auto border-t border-white/10",
        isMobile || isTablet ? "px-4 py-4 pb-6" : "px-4 py-6 pb-8"
      )}>
        <button
          onClick={handleLogout}
          disabled={loading}
          className={cn(
            "flex items-center w-full rounded-2xl text-sm font-medium uppercase tracking-wide text-white/80 hover:bg-white/5 hover:text-white hover:border-l-4 hover:border-accent transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50 active:bg-white/10",
            // Touch-friendly padding on mobile
            isMobile || isTablet ? "px-4 py-4" : "px-6 py-3"
          )}
          aria-label="Logout"
        >
          <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}
