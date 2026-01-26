'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/contexts/ProfileProvider';
import { setupAvatarsBucket } from '@/lib/setupStorage';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePlanBanner } from '@/components/profile/ProfilePlanBanner';
import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { UsernameUpdate } from '@/components/profile/UsernameUpdate';
import { NameUpdate } from '@/components/profile/NameUpdate';
import { PositionUpdate } from '@/components/profile/PositionUpdate';
import { NationalityUpdate } from '@/components/profile/NationalityUpdate';
import { PasswordUpdate } from '@/components/profile/PasswordUpdate';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
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
  const airline = profile?.airline || user?.user_metadata?.airline || '';
  const position = profile?.position || user?.user_metadata?.position || '';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Storage Error Banner */}
      {bucketError && (
        <div className="mb-6 p-4 border border-destructive/50 rounded-md bg-destructive/10 flex items-start gap-3">
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

      {/* Header */}
      <ProfileHeader 
        fullName={fullName}
        email={email}
        onAvatarUploadComplete={handleAvatarUploadComplete}
      />

      {/* Plan Banner */}
      <ProfilePlanBanner 
        airline={airline} 
        position={position} 
      />

      {/* Personal Details Section */}
      <ProfileSettingsSection title="Personal details">
        <NameUpdate />
        <UsernameUpdate />
        <ProfileSettingsRow 
          label="Email address" 
          value={email}
          // Email is typically immutable or requires a specific flow, keeping it read-only for now as per previous implementation
        />
        <PasswordUpdate />
      </ProfileSettingsSection>

      {/* Professional Details Section */}
      <ProfileSettingsSection title="Professional details">
        <PositionUpdate />
        <NationalityUpdate />
      </ProfileSettingsSection>

      {/* Manage Account Section */}
      <ProfileSettingsSection title="Manage account">
        <DeleteAccountSection />
      </ProfileSettingsSection>
    </div>
  );
}
