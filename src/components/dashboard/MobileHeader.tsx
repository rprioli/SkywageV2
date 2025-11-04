'use client';

/**
 * Mobile Header Component for Skywage Dashboard
 * Provides hamburger menu and branding for mobile navigation
 * Only visible on mobile devices (< 768px)
 */

import { Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';

export function MobileHeader() {
  const { toggleSidebar, isSidebarOpen } = useMobileNavigation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 lg:hidden safe-area-inset-top">
      <div className="flex items-center justify-between px-4 py-3 touch-target">
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={`p-3 rounded-lg touch-target transition-colors ${
            isSidebarOpen
              ? 'bg-primary/10 hover:bg-primary/20 text-primary'
              : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
          }`}
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo */}
        <div className="flex-1 flex justify-center">
          <Logo variant="color" width={120} height={32} />
        </div>

        {/* Spacer to balance the layout */}
        <div className="w-10" />
      </div>
    </header>
  );
}
