/**
 * Friends database operations for Skywage
 * Handles CRUD operations for friendships with profile data
 * Following existing database patterns in the codebase
 */

import { supabase, Database } from '@/lib/supabase';

// Database types
type FriendshipRow = Database['public']['Tables']['friendships']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Public profile data returned by RPC
export interface PublicProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  airline: string;
  position: 'CCM' | 'SCCM';
  avatar_url: string | null;
}

// Friend data with profile information
export interface FriendWithProfile {
  friendshipId: string;
  userId: string;
  username: string;
  airline: string;
  position: 'CCM' | 'SCCM';
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt: string | null;
}

// Pending request data
export interface PendingRequest {
  friendshipId: string;
  userId: string;
  username: string;
  airline: string;
  position: 'CCM' | 'SCCM';
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  type: 'sent' | 'received';
}

/**
 * Find a user by username using SECURITY DEFINER RPC
 */
export async function findUserByUsername(
  username: string
): Promise<{ data: PublicProfile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .rpc('find_profile_by_username', { p_username: username.toLowerCase() });

    if (error) {
      return { data: null, error: error.message };
    }

    // RPC returns an array, we want the first (and only) result
    const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    return { data: profile, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Get public profiles by IDs using SECURITY DEFINER RPC
 */
async function getPublicProfilesByIds(
  userIds: string[]
): Promise<{ data: PublicProfile[] | null; error: string | null }> {
  try {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .rpc('get_profiles_public_by_ids', { p_ids: userIds });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Get all accepted friends for a user with their profile data
 */
export async function getFriendsForUser(
  userId: string
): Promise<{ data: FriendWithProfile[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        receiver_id,
        status,
        created_at,
        responded_at
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Get friend user IDs (the other person in each friendship)
    const friendUserIds = data.map((friendship) =>
      friendship.requester_id === userId
        ? friendship.receiver_id
        : friendship.requester_id
    );

    // Fetch public profiles for all friends via RPC
    const { data: profiles, error: profilesError } = await getPublicProfilesByIds(friendUserIds);

    if (profilesError) {
      return { data: null, error: profilesError };
    }

    // Map friendships to FriendWithProfile
    const friends: FriendWithProfile[] = data.map((friendship) => {
      const friendUserId =
        friendship.requester_id === userId
          ? friendship.receiver_id
          : friendship.requester_id;
      const profile = profiles?.find((p) => p.id === friendUserId);

      return {
        friendshipId: friendship.id,
        userId: friendUserId,
        username: profile?.username || 'unknown',
        airline: profile?.airline || '',
        position: profile?.position || 'CCM',
        firstName: profile?.first_name || undefined,
        lastName: profile?.last_name || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        status: friendship.status as 'pending' | 'accepted' | 'rejected',
        createdAt: friendship.created_at,
        respondedAt: friendship.responded_at,
      };
    });

    return { data: friends, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Get pending friend requests (both sent and received)
 */
export async function getPendingFriendRequests(
  userId: string
): Promise<{ data: { sent: PendingRequest[]; received: PendingRequest[] } | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        receiver_id,
        status,
        created_at
      `)
      .eq('status', 'pending')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: { sent: [], received: [] }, error: null };
    }

    // Separate sent vs received
    const sentRequests = data.filter((f) => f.requester_id === userId);
    const receivedRequests = data.filter((f) => f.receiver_id === userId);

    // Get all user IDs we need profiles for
    const userIds = [
      ...sentRequests.map((f) => f.receiver_id),
      ...receivedRequests.map((f) => f.requester_id),
    ];

    // Fetch public profiles via RPC
    const { data: profiles, error: profilesError } = await getPublicProfilesByIds(userIds);

    if (profilesError) {
      return { data: null, error: profilesError };
    }

    // Map sent requests
    const sent: PendingRequest[] = sentRequests.map((friendship) => {
      const profile = profiles?.find((p) => p.id === friendship.receiver_id);
      return {
        friendshipId: friendship.id,
        userId: friendship.receiver_id,
        username: profile?.username || 'unknown',
        airline: profile?.airline || '',
        position: profile?.position || 'CCM',
        firstName: profile?.first_name || undefined,
        lastName: profile?.last_name || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        createdAt: friendship.created_at,
        type: 'sent' as const,
      };
    });

    // Map received requests
    const received: PendingRequest[] = receivedRequests.map((friendship) => {
      const profile = profiles?.find((p) => p.id === friendship.requester_id);
      return {
        friendshipId: friendship.id,
        userId: friendship.requester_id,
        username: profile?.username || 'unknown',
        airline: profile?.airline || '',
        position: profile?.position || 'CCM',
        firstName: profile?.first_name || undefined,
        lastName: profile?.last_name || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        createdAt: friendship.created_at,
        type: 'received' as const,
      };
    });

    return { data: { sent, received }, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Send a friend request by username
 */
export async function sendFriendRequest(
  requesterId: string,
  receiverUsername: string
): Promise<{ data: FriendshipRow | null; error: string | null }> {
  try {
    // Find receiver by username using RPC
    const { data: receiver, error: findError } = await findUserByUsername(receiverUsername);

    if (findError) {
      return { data: null, error: findError };
    }

    if (!receiver) {
      return { data: null, error: 'User not found with that username' };
    }

    // Check if requester is trying to add themselves
    if (receiver.id === requesterId) {
      return { data: null, error: 'You cannot send a friend request to yourself' };
    }

    // Check if friendship already exists (in either direction)
    const { data: existing, error: existingError } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiver.id}),and(requester_id.eq.${receiver.id},receiver_id.eq.${requesterId})`)
      .maybeSingle();

    if (existingError) {
      return { data: null, error: existingError.message };
    }

    if (existing) {
      if (existing.status === 'pending') {
        return { data: null, error: 'Friend request already pending' };
      } else if (existing.status === 'accepted') {
        return { data: null, error: 'You are already friends with this user' };
      } else if (existing.status === 'rejected') {
        // Update existing rejected friendship to pending
        const { data: updated, error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'pending', responded_at: null })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return { data: null, error: updateError.message };
        }

        return { data: updated, error: null };
      }
    }

    // Create new friendship
    const { data: newFriendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        receiver_id: receiver.id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: newFriendship, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Respond to a friend request (accept or reject)
 */
export async function respondToFriendRequest(
  friendshipId: string,
  userId: string,
  newStatus: 'accepted' | 'rejected'
): Promise<{ data: FriendshipRow | null; error: string | null }> {
  try {
    // Verify the user is the receiver of this request
    const { error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return { data: null, error: 'Friend request not found or already responded to' };
      }
      return { data: null, error: fetchError.message };
    }

    // Update the friendship status
    const { data: updated, error: updateError } = await supabase
      .from('friendships')
      .update({ status: newStatus })
      .eq('id', friendshipId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Unfriend a user (delete the friendship)
 */
export async function unfriend(
  friendshipId: string,
  userId: string
): Promise<{ error: string | null }> {
  try {
    // Verify the user is part of this friendship
    const { error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return { error: 'Friendship not found' };
      }
      return { error: fetchError.message };
    }

    // Delete the friendship
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Get count of pending friend requests received by user
 */
export async function getPendingRequestsCount(
  userId: string
): Promise<{ data: number | null; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: count || 0, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Get display name for a friend
 * Returns "First Last" if available, otherwise falls back to username
 */
export function getFriendDisplayName(friend: FriendWithProfile | PendingRequest): string {
  if (friend.firstName && friend.lastName) {
    return `${friend.firstName} ${friend.lastName}`;
  }
  if (friend.firstName) {
    return friend.firstName;
  }
  if (friend.lastName) {
    return friend.lastName;
  }
  return friend.username;
}

/**
 * Get initial letter for a friend's avatar
 * Returns first letter of first name, or first letter of username if name not available
 */
export function getFriendInitial(friend: FriendWithProfile | PendingRequest): string {
  if (friend.firstName) {
    return friend.firstName.charAt(0).toUpperCase();
  }
  if (friend.lastName) {
    return friend.lastName.charAt(0).toUpperCase();
  }
  return friend.username.charAt(0).toUpperCase();
}

/**
 * Generate a consistent color based on string ID
 */
export function getAvatarColor(id: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  if (id) {
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  
  return colors[Math.abs(hash) % colors.length];
}

