'use client';

/**
 * Friends Context Provider
 *
 * Provides shared friends state (friends, pending requests, pendingCount, etc.)
 * across dashboard components like the sidebar and /friends page, so updates
 * propagate immediately without duplicating fetch logic.
 */

import React, { createContext, useContext } from 'react';
import { useFriends as useFriendsHook } from '@/hooks/useFriends';

type FriendsContextType = ReturnType<typeof useFriendsHook>;

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
  children: React.ReactNode;
}

export function FriendsProvider({ children }: FriendsProviderProps) {
  const friendsState = useFriendsHook();

  return (
    <FriendsContext.Provider value={friendsState}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriendsContext(): FriendsContextType {
  const context = useContext(FriendsContext);

  if (context === undefined) {
    throw new Error('useFriendsContext must be used within a FriendsProvider');
  }

  return context;
}

