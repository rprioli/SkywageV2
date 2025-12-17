'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface StatisticsHeaderProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const StatisticsHeader = ({
  isMobile,
  isSidebarOpen,
  toggleSidebar,
}: StatisticsHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-responsive-3xl font-bold space-responsive-sm" style={{ color: '#3A3780' }}>
          Statistics
        </h1>
        <p className="text-responsive-base text-primary font-bold">
          View your earnings statistics and flight data analytics.
        </p>
      </div>

      {/* Hamburger Menu - Mobile Only */}
      {isMobile && (
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
  );
};

