'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { setupAvatarsBucket } from '@/lib/setupStorage';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { UsernameUpdate } from '@/components/profile/UsernameUpdate';
import { NameUpdate } from '@/components/profile/NameUpdate';
import { PositionUpdate } from '@/components/profile/PositionUpdate';
import { NationalityUpdate } from '@/components/profile/NationalityUpdate';
import { PasswordUpdate } from '@/components/profile/PasswordUpdate';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { AlertTriangle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();
  const [bucketError, setBucketError] = useState<string | null>(null);

  // Check if avatars bucket exists
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { success, error } = await setupAvatarsBucket();

        if (!success && error) {
          setBucketError(error);
        }
      } catch {
        setBucketError('An unexpected error occurred while checking storage configuration');
      }
    };

    checkBucket();
  }, []);

  const handleAvatarUploadComplete = () => {
    refreshProfile();
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'N/A';
  const email = profile?.email || user?.email || 'N/A';

  return (
    <div className="space-y-4">
      {/* Standard Page Header */}
      <div className="space-y-6 px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-3xl font-bold space-responsive-sm" style={{ color: '#3A3780' }}>
              Profile
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

      {/* Main Content */}
      <div className="responsive-container pb-6 space-y-6">
        {/* Storage Error Banner */}
        {bucketError && (
          <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Storage Configuration Error</h3>
              <p className="text-sm text-destructive/90 mb-2">{bucketError}</p>
              <p className="text-xs text-muted-foreground">
                The administrator needs to set up the storage bucket and policies for profile pictures.
              </p>
            </div>
          </div>
        )}

        {/* Profile Identity Card */}
        <ProfileHeader 
          fullName={fullName}
          email={email}
          onAvatarUploadComplete={handleAvatarUploadComplete}
        />

        {/* Settings Sections Grid */}
        <div className="grid grid-cols-1 gap-6">
          <ProfileSettingsSection title="Personal details">
            <NameUpdate />
            <UsernameUpdate />
            <ProfileSettingsRow 
              label="Email address" 
              value={email}
            />
            <PasswordUpdate />
          </ProfileSettingsSection>

          <ProfileSettingsSection title="Professional details">
            <PositionUpdate />
            <NationalityUpdate />
          </ProfileSettingsSection>

          <ProfileSettingsSection title="Manage account">
            <DeleteAccountSection />
          </ProfileSettingsSection>
        </div>
      </div>
    </div>
  );
}
