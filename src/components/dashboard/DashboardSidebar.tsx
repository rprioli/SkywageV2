'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { useAuthentication } from '@/hooks/useAuthentication';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart,
  User,
  Settings,
  LogOut,
  Calculator
} from 'lucide-react';

// Default avatar as a data URL (simple user silhouette)
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMTkgMjFhNyA3IDAgMSAwLTE0IDB2LTFhNyA3IDAgMCAxIDE0IDB2MSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjQiLz48L3N2Zz4=';

export default function DashboardSidebar() {
  const { user } = useAuth();
  const { handleLogout, loading } = useAuthentication();
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Salary Calculator', href: '/salary-calculator', icon: Calculator },
    { name: 'Statistics', href: '/statistics', icon: BarChart },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-[280px] bg-primary text-white flex flex-col h-full rounded-r-3xl shadow-lg">
      {/* Logo */}
      <div className="py-8 px-6 flex justify-center">
        <Logo variant="white" width={170} height={45} />
      </div>

      {/* Profile section */}
      <div className="px-8 py-6 flex flex-col items-center border-b border-white/10">
        <div className="relative w-20 h-20 mb-4 group">
          <div className="absolute inset-0 rounded-full border-2 border-accent opacity-70 transition-all duration-300 group-hover:opacity-100"></div>
          <div className="w-full h-full rounded-full bg-white/20 overflow-hidden">
            {/* Use a default avatar or user avatar if available */}
            <img
              src={user?.user_metadata?.avatar_url || DEFAULT_AVATAR}
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
          </div>
        </div>
        <h3 className="font-bold text-base uppercase tracking-wide">
          {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
        </h3>
        <p className="text-xs text-white/60 truncate max-w-full mt-1">
          {user?.email}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="mb-4 px-2 text-xs uppercase tracking-wider text-white/50 font-medium">
          Menu
        </div>
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3 rounded-lg text-sm font-medium uppercase tracking-wide transition-all duration-200",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-white text-primary"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                )}
                aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
              >
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
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout button */}
      <div className="px-4 py-6 pb-8 mt-auto border-t border-white/10">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center w-full px-6 py-3 rounded-lg text-sm font-medium uppercase tracking-wide text-white/80 hover:bg-white/5 hover:text-white hover:border-l-4 hover:border-accent transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Logout"
        >
          <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}
