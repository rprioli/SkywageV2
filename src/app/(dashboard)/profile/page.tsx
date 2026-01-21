'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { NationalityUpdate } from '@/components/profile/NationalityUpdate';
import { PositionUpdate } from '@/components/profile/PositionUpdate';
import { UsernameUpdate } from '@/components/profile/UsernameUpdate';
import { NameUpdate } from '@/components/profile/NameUpdate';
import { PasswordUpdate } from '@/components/profile/PasswordUpdate';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Info, Settings, Menu, Lock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setupAvatarsBucket } from '@/lib/setupStorage';
import { getProfile } from '@/lib/db';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';

export default function ProfilePage() {
  const { user } = useAuth();
  const [avatarUpdated, setAvatarUpdated] = useState(false);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [profileAirline, setProfileAirline] = useState<string>('');

  // Get mobile navigation context
  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();

  // Load profile data from database (source of truth)
  useEffect(() => {
    const loadProfileData = async () => {
      if (user?.id) {
        try {
          const { data: profile, error } = await getProfile(user.id);
          if (profile && !error) {
            setProfileEmail(profile.email || '');
            setProfileAirline(profile.airline || '');
          }
        } catch {
          // Fallback to auth data if DB fails
          setProfileEmail(user?.email || '');
          setProfileAirline(user?.user_metadata?.airline || '');
        }
      }
    };

    loadProfileData();
  }, [user?.id, user?.email, user?.user_metadata?.airline]);

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
    setAvatarUpdated(true);
    setBucketError(null);

    // Hide the success message after 3 seconds
    setTimeout(() => {
      setAvatarUpdated(false);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header and Profile - Grouped with consistent spacing */}
      <div className="space-y-6 px-6 pt-6">
        {/* Header with integrated hamburger menu on mobile */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>Your Profile</h1>
            <p className="text-primary font-bold">
              Manage your account information and preferences
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
      </div>

      {/* Cards Grid */}
      <div className="space-y-6 px-6">
        {/* Profile Picture Card */}
        <Card className="bg-white rounded-3xl !border-0 !shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
              <UserCircle className="h-5 w-5 text-primary" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {bucketError ? (
                <div className="mb-4 p-4 border border-destructive/50 rounded-md bg-destructive/10 max-w-md">
                  <h3 className="font-semibold text-destructive mb-1">Storage Configuration Error</h3>
                  <p className="text-sm text-destructive/90 mb-2">{bucketError}</p>
                  <p className="text-xs text-muted-foreground">
                    The administrator needs to set up the storage bucket and policies for profile pictures.
                  </p>
                </div>
              ) : (
                <AvatarUpload onUploadComplete={handleAvatarUploadComplete} size={150} />
              )}

              {avatarUpdated && (
                <div className="mt-2 text-center text-sm text-accent">
                  Profile picture updated successfully!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="bg-white rounded-3xl !border-0 !shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
              <Info className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <UsernameUpdate />
              </div>

              <NameUpdate />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{profileEmail || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Airline</p>
                  <p className="font-medium">{profileAirline || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card className="bg-white rounded-3xl !border-0 !shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
              <Settings className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <PositionUpdate />
              </div>

              <div className="col-span-1 md:col-span-2">
                <NationalityUpdate />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="bg-white rounded-3xl !border-0 !shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2" style={{ color: '#3A3780' }}>
              <Lock className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <PasswordUpdate />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone - Delete Account */}
        <Card className="bg-white rounded-3xl !border-0 !shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
