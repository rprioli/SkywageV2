'use client';

import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { useAuthentication } from '@/hooks/useAuthentication';
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
  X,
  HelpCircle
} from 'lucide-react';

// Default avatar as a data URL (simple user silhouette)
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMTkgMjFhNyA3IDAgMSAwLTE0IDB2LTFhNyA3IDAgMCAxIDE0IDB2MSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjQiLz48L3N2Zz4=';

export default function DashboardSidebar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { handleLogout, loading } = useAuthentication();
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop, isSidebarOpen, closeSidebar } = useMobileNavigation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside on mobile/tablet
  useClickOutside(sidebarRef, closeSidebar, (isMobile || isTablet) && isSidebarOpen);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Statistics', href: '/statistics', icon: BarChart },
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const accountItems = [
    { name: 'Help Center', href: '/help', icon: HelpCircle },
  ];

  // Handle navigation link clicks on mobile - close sidebar
  const handleNavClick = () => {
    if (isMobile || isTablet) {
      closeSidebar();
    }
  };

  const SidebarItem = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    
    return (
      <li>
        <Link
          href={item.href}
          onClick={handleNavClick}
          className={cn(
            "group flex items-center rounded-2xl px-4 py-3 text-sm font-normal transition-all duration-200 tracking-[-0.01em] leading-[24px]",
            isActive 
              ? "bg-white/10 text-white shadow-sm border border-white/20 backdrop-blur-sm" 
              : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <item.icon
            className={cn(
              "mr-4 h-5 w-5",
              isActive ? "text-white" : "text-white/70 group-hover:text-white"
            )}
            aria-hidden="true"
          />
          <span>{item.name}</span>
        </Link>
      </li>
    );
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
        "flex justify-center text-center",
        isMobile || isTablet ? "pt-0 pb-8 px-6" : "pt-12 pb-10 px-6"
      )}>
        <Logo
          variant="white"
          width={isMobile || isTablet ? 170 : 200}
          height={isMobile || isTablet ? 45 : 47}
        />
      </div>

      {/* Profile section */}
      <div className="flex flex-col items-center mb-10 px-6">
        <div className={cn(
          "relative mb-3",
          isMobile || isTablet ? "w-16 h-16" : "w-20 h-20"
        )}>
          <div className="w-full h-full rounded-full bg-white/20 overflow-hidden">
            <img
              src={profile?.avatar_url || user?.user_metadata?.avatar_url || DEFAULT_AVATAR}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
          </div>
        </div>
        <h3 className={cn(
          "font-semibold text-white text-center tracking-[-0.03em]",
          isMobile || isTablet ? "text-sm" : "text-base"
        )}>
          {profile?.first_name || user?.user_metadata?.first_name} {profile?.last_name || user?.user_metadata?.last_name}
        </h3>
        <p className="mt-1 text-xs text-white/60 truncate max-w-full text-center">
          {user?.email}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-8 overflow-y-auto scrollbar-hide">
        {/* Menu Section */}
        <div>
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Menu
          </h4>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <SidebarItem key={item.name} item={item} />
            ))}
          </ul>
        </div>

        {/* Account Section */}
        <div>
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Account
          </h4>
          <ul className="space-y-2">
            {accountItems.map((item) => (
              <SidebarItem key={item.name} item={item} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Logout button */}
      <div className={cn(
        "mt-auto",
        isMobile || isTablet ? "px-6 py-6" : "px-6 py-8"
      )}>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-transparent py-3 text-xs font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          aria-label="Logout"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          LOGOUT
        </button>
      </div>
    </div>
  );
}
