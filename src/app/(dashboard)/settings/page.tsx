'use client';

import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ProfileTab,
  PreferencesTab,
  SubscriptionTab,
  ProfessionalDetailsTab,
} from '@/components/settings';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { isMobile, isDesktop, toggleSidebar, isSidebarOpen } = useMobileNavigation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 0);
    // Use a small tolerance for rounding errors
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const tabs = [
    { value: 'profile', label: 'Profile' },
    { value: 'preferences', label: 'Preferences' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'professional', label: 'Professional Details' },
  ];

  const triggerClasses = "group data-[state=active]:bg-transparent data-[state=active]:text-brand-ink data-[state=active]:shadow-none rounded-none border-b-[3px] border-transparent data-[state=active]:border-brand-ink pb-3 -mb-[1.5px] text-base transition-all duration-300 ease-in-out";

  return (
    <div className="space-y-8">
      {/* Standard Page Header */}
      <div className="space-y-6 pt-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-3xl font-bold space-responsive-sm text-brand-ink">
              Settings
            </h1>
            <p className="text-responsive-base text-primary font-bold">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Mobile/Tablet Menu Toggle */}
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

      {/* Main Content with Tabs */}
      <div className="pb-6">
        <Tabs defaultValue="profile" className="w-full space-y-8">
          {/* Tab Navigation - Mobile friendly with horizontal scroll and fade indicators */}
          <div className="relative -mx-2 px-2">
            {/* Left Fade Indicator */}
            <div 
              className={cn(
                "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
                showLeftFade ? "opacity-100" : "opacity-0"
              )} 
            />

            {/* Scroll Container */}
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="overflow-x-auto scrollbar-hide"
            >
              <TabsList className="w-full sm:w-auto min-w-max bg-transparent p-0 justify-start border-b border-gray-200 h-auto">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={triggerClasses}>
                    <div className="grid place-items-center">
                      <span className="font-bold opacity-0 row-start-1 col-start-1" aria-hidden="true">
                        {tab.label}
                      </span>
                      <span className="font-medium group-data-[state=active]:font-bold row-start-1 col-start-1">
                        {tab.label}
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Right Fade Indicator */}
            <div 
              className={cn(
                "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
                showRightFade ? "opacity-100" : "opacity-0"
              )} 
            />
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="preferences" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <PreferencesTab />
            </TabsContent>

            <TabsContent value="subscription" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <SubscriptionTab />
            </TabsContent>

            <TabsContent value="professional" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <ProfessionalDetailsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
