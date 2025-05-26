'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { NationalityUpdate } from '@/components/profile/NationalityUpdate';
import { PositionUpdate } from '@/components/profile/PositionUpdate';
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
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="p-6 border border-border rounded-lg bg-card">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
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

          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{user?.user_metadata?.first_name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{user?.user_metadata?.last_name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Airline</p>
                <p className="font-medium">{user?.user_metadata?.airline || 'N/A'}</p>
              </div>

              <div>
                <PositionUpdate />
              </div>

              <div className="col-span-1 md:col-span-2">
                <NationalityUpdate />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
