/**
 * useFriends Hook
 * 
 * Manages friends data fetching and state.
 * Provides functions for sending requests, responding, and unfriending.
 * Follows existing hook patterns in the codebase.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import {
  FriendWithProfile,
  PendingRequest,
  getFriendsForUser,
  getPendingFriendRequests,
  getPendingRequestsCount,
  sendFriendRequest as sendFriendRequestDb,
  respondToFriendRequest as respondToFriendRequestDb,
  unfriend as unfriendDb,
} from '@/lib/database/friends';

interface UseFriendsReturn {
  friends: FriendWithProfile[];
  pendingRequests: { sent: PendingRequest[]; received: PendingRequest[] };
  pendingCount: number;
  loading: boolean;
  error: string | null;
  sendFriendRequest: (username: string) => Promise<{ success: boolean; error?: string }>;
  respondToRequest: (friendshipId: string, status: 'accepted' | 'rejected') => Promise<{ success: boolean; error?: string }>;
  unfriend: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
  const { user } = useAuth();

  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ sent: PendingRequest[]; received: PendingRequest[] }>({
    sent: [],
    received: [],
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;

  /**
   * Fetch friends data directly from Supabase using shared database helpers.
   * This follows the same pattern as other parts of the app and avoids
   * server-side auth/cookie issues with custom API routes.
   */
  const fetchFriends = useCallback(async () => {
    if (!userId) {
      // If we don't have a user yet (initial load), just reset state without error.
      setFriends([]);
      setPendingRequests({ sent: [], received: [] });
      setPendingCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [friendsResult, pendingResult, countResult] = await Promise.all([
        getFriendsForUser(userId),
        getPendingFriendRequests(userId),
        getPendingRequestsCount(userId),
      ]);

      if (friendsResult.error || pendingResult.error || countResult.error) {
        const errorMessage =
          friendsResult.error ??
          pendingResult.error ??
          countResult.error ??
          'Failed to fetch friends';
        throw new Error(errorMessage);
      }

      setFriends(friendsResult.data || []);
      setPendingRequests(pendingResult.data || { sent: [], received: [] });
      setPendingCount(countResult.data || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Send a friend request by username
   */
  const sendFriendRequest = useCallback(
    async (username: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const normalizedUsername = username.trim().toLowerCase();
        const { error: dbError } = await sendFriendRequestDb(userId, normalizedUsername);

        if (dbError) {
          return { success: false, error: dbError };
        }

        // Refetch friends data to update the list
        await fetchFriends();

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        return { success: false, error: errorMessage };
      }
    },
    [userId, fetchFriends]
  );

  /**
   * Respond to a friend request
   */
  const respondToRequest = useCallback(
    async (
      friendshipId: string,
      status: 'accepted' | 'rejected'
    ): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const { error: dbError } = await respondToFriendRequestDb(
          friendshipId,
          userId,
          status
        );

        if (dbError) {
          return { success: false, error: dbError };
        }

        // Refetch friends data to update the list
        await fetchFriends();

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        return { success: false, error: errorMessage };
      }
    },
    [userId, fetchFriends]
  );

  /**
   * Unfriend a user
   */
  const unfriendUser = useCallback(
    async (friendshipId: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const { error: dbError } = await unfriendDb(friendshipId, userId);

        if (dbError) {
          return { success: false, error: dbError };
        }

        // Refetch friends data to update the list
        await fetchFriends();

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        return { success: false, error: errorMessage };
      }
    },
    [userId, fetchFriends]
  );

  // Fetch friends on mount and when the authenticated user changes
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    pendingCount,
    loading,
    error,
    sendFriendRequest,
    respondToRequest,
    unfriend: unfriendUser,
    refetch: fetchFriends,
  };
}

