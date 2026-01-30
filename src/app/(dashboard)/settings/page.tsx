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

export default function SettingsPage() {
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  return (
    <div className="space-y-4">
      {/* Standard Page Header */}
      <div className="space-y-6 px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-3xl font-bold space-responsive-sm" style={{ color: '#3A3780' }}>
              Settings
            </h1>
            <p className="text-responsive-base text-primary font-bold">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Mobile Menu Toggle */}
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
      </div>

      {/* Main Content with Tabs */}
      <div className="responsive-container pb-6">
        <Tabs defaultValue="profile" className="w-full">
          {/* Tab Navigation - Mobile friendly with horizontal scroll */}
          <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
            <TabsList className="w-full sm:w-auto min-w-max bg-gray-100/80">
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3A3780] data-[state=active]:font-bold"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="preferences"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3A3780] data-[state=active]:font-bold"
              >
                Preferences
              </TabsTrigger>
              <TabsTrigger 
                value="subscription"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3A3780] data-[state=active]:font-bold"
              >
                Subscription
              </TabsTrigger>
              <TabsTrigger 
                value="professional"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3A3780] data-[state=active]:font-bold"
              >
                Professional Details
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="professional">
            <ProfessionalDetailsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
