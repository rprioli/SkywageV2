'use client';

/**
 * Manual Flight Entry Page for Skywage Salary Calculator
 * Phase 4: Complete manual entry workflow page
 * Following existing page patterns from Phase 3
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  ArrowLeft, 
  AlertCircle,
  User,
  Settings
} from 'lucide-react';

import { ManualFlightEntry } from '@/components/salary-calculator/ManualFlightEntry';
import { Position } from '@/types/salary-calculator';
import { getProfile } from '@/lib/db';

export default function ManualEntryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Component state
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile to get position
  useEffect(() => {
    async function loadUserProfile() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile(user.id);
        if (profile) {
          setPosition(profile.position as Position);
        } else {
          setError('User profile not found. Please complete your profile setup.');
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadUserProfile();
    }
  }, [user, authLoading]);

  // Handle navigation back to calculator
  const handleBackToCalculator = () => {
    router.push('/salary-calculator');
  };

  // Handle navigation to profile
  const handleGoToProfile = () => {
    router.push('/profile');
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          {/* Form skeleton */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to access manual flight entry.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            {error.includes('profile') && (
              <Button onClick={handleGoToProfile} className="w-full">
                <User className="mr-2 h-4 w-4" />
                Complete Profile Setup
              </Button>
            )}
            
            <Button variant="outline" onClick={handleBackToCalculator} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculator
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No position set
  if (!position) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Please set your position (CCM or SCCM) in your profile to use manual flight entry.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoToProfile} className="w-full">
              <User className="mr-2 h-4 w-4" />
              Update Profile
            </Button>
            
            <Button variant="outline" onClick={handleBackToCalculator} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculator
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto px-4 py-8">
      <ManualFlightEntry 
        position={position}
        onBack={handleBackToCalculator}
      />
    </div>
  );
}
