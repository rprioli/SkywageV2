/**
 * useFriends Hook
 * 
 * Manages friends data fetching and state.
 * Provides functions for sending requests, responding, and unfriending.
 * Follows existing hook patterns in the codebase.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FriendWithProfile, PendingRequest } from '@/lib/database/friends';

interface UseFriendsReturn {
  friends: FriendWithProfile[];
  pendingRequests: { sent: PendingRequest[]; received: PendingRequest[] };
  pendingCount: number;
  loading: boolean;
  error: string | null;
  sendFriendRequest: (email: string) => Promise<{ success: boolean; error?: string }>;
  respondToRequest: (friendshipId: string, status: 'accepted' | 'rejected') => Promise<{ success: boolean; error?: string }>;
  unfriend: (friendshipId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ sent: PendingRequest[]; received: PendingRequest[] }>({
    sent: [],
    received: [],
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch friends data from API
   */
  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/friends/list');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch friends');
      }

      const data = await response.json();
      
      setFriends(data.friends || []);
      setPendingRequests(data.pending || { sent: [], received: [] });
      setPendingCount(data.pendingCount || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send a friend request
   */
  const sendFriendRequest = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/friends/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send friend request' };
      }

      // Refetch friends data to update the list
      await fetchFriends();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }, [fetchFriends]);

  /**
   * Respond to a friend request
   */
  const respondToRequest = useCallback(async (
    friendshipId: string,
    status: 'accepted' | 'rejected'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to respond to friend request' };
      }

      // Refetch friends data to update the list
      await fetchFriends();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }, [fetchFriends]);

  /**
   * Unfriend a user
   */
  const unfriendUser = useCallback(async (friendshipId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/friends/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to unfriend user' };
      }

      // Refetch friends data to update the list
      await fetchFriends();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }, [fetchFriends]);

  // Fetch friends on mount
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
    respondToRequest: respondToRequest,
    unfriend: unfriendUser,
    refetch: fetchFriends,
  };
}

