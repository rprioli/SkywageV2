'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { setupAvatarsBucket } from '@/lib/setupStorage';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { UsernameUpdate } from '@/components/profile/UsernameUpdate';
import { NameUpdate } from '@/components/profile/NameUpdate';
import { NationalityUpdate } from '@/components/profile/NationalityUpdate';
import { PasswordUpdate } from '@/components/profile/PasswordUpdate';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { AlertTriangle } from 'lucide-react';

export const ProfileTab = () => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
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
    <div className="space-y-6">
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
          <NationalityUpdate />
        </ProfileSettingsSection>

        <ProfileSettingsSection title="Manage account">
          <DeleteAccountSection />
        </ProfileSettingsSection>
      </div>
    </div>
  );
};
