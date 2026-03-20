'use client';

import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { HelpFAQ } from '@/components/help/HelpFAQ';

export default function HelpPage() {
  const { isDesktop, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-6 pt-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-3xl font-bold space-responsive-sm text-brand-ink">
              Help Center
            </h1>
            <p className="text-responsive-base text-primary font-bold">
              Frequently asked questions about Skywage
            </p>
          </div>

          {!isDesktop && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
                isSidebarOpen
                  ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                  : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="pb-6 space-y-4 md:space-y-6">
        <HelpFAQ />
      </div>
    </div>
  );
}
