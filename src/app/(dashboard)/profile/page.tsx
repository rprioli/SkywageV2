'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { NationalityUpdate } from '@/components/profile/NationalityUpdate';
import { PositionUpdate } from '@/components/profile/PositionUpdate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Info, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setupAvatarsBucket } from '@/lib/setupStorage';

export default function ProfilePage() {
  const { user } = useAuth();
  const [avatarUpdated, setAvatarUpdated] = useState(false);
  const [bucketError, setBucketError] = useState<string | null>(null);

  // Check if avatars bucket exists
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { success, error } = await setupAvatarsBucket();

        if (!success && error) {
          console.error('Failed to set up avatars bucket:', error);
          setBucketError(error);
        }
      } catch (err) {
        console.error('Unexpected error checking avatars bucket:', err);
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>Your Profile</h1>
          <p className="text-primary font-bold">
            Manage your account information and preferences
          </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">First Name</p>
                <p className="font-medium">{user?.user_metadata?.first_name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                <p className="font-medium">{user?.user_metadata?.last_name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Airline</p>
                <p className="font-medium">{user?.user_metadata?.airline || 'N/A'}</p>
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
      </div>
    </div>
  );
}
