'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { getProfile } from '@/lib/db';
import { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
  setProfile: () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load profile from database
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: profileError } = await getProfile(user.id);

      if (profileError) {
        throw new Error(profileError.message || 'Failed to load profile');
      }

      setProfile(data);
    } catch (err) {
      setError(err as Error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refresh profile on demand
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value = {
    profile,
    loading,
    error,
    refreshProfile,
    setProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
