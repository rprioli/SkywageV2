/**
 * Friends database operations for Skywage
 * Handles CRUD operations for friendships with profile data
 * Following existing database patterns in the codebase
 */

import { supabase, Database } from '@/lib/supabase';

// Database types
type FriendshipRow = Database['public']['Tables']['friendships']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Friend data with profile information
export interface FriendWithProfile {
  friendshipId: string;
  userId: string;
  email: string;
  airline: string;
  position: 'CCM' | 'SCCM';
  nationality?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt: string | null;
}

// Pending request data
export interface PendingRequest {
  friendshipId: string;
  userId: string;
  email: string;
  airline: string;
  position: 'CCM' | 'SCCM';
  nationality?: string;
  createdAt: string;
  type: 'sent' | 'received';
}

/**
 * Find a user by email
 */
export async function findUserByEmail(
  email: string
): Promise<{ data: ProfileRow | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error finding user by email:', error);
      return { data: null, error: error.message };
    }

    // `maybeSingle` returns `data: null, error: null` when no rows are found
    return { data: data ?? null, error: null };
  } catch (error) {
    console.error('Error finding user by email:', error);
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
      console.error('Error fetching friends:', error);
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

    // Fetch profiles for all friends
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendUserIds);

    if (profilesError) {
      console.error('Error fetching friend profiles:', profilesError);
      return { data: null, error: profilesError.message };
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
        email: profile?.email || '',
        airline: profile?.airline || '',
        position: profile?.position || 'CCM',
        nationality: profile?.nationality,
        status: friendship.status as 'pending' | 'accepted' | 'rejected',
        createdAt: friendship.created_at,
        respondedAt: friendship.responded_at,
      };
    });

    return { data: friends, error: null };
  } catch (error) {
    console.error('Error fetching friends:', error);
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
      console.error('Error fetching pending requests:', error);
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

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for pending requests:', profilesError);
      return { data: null, error: profilesError.message };
    }

    // Map sent requests
    const sent: PendingRequest[] = sentRequests.map((friendship) => {
      const profile = profiles?.find((p) => p.id === friendship.receiver_id);
      return {
        friendshipId: friendship.id,
        userId: friendship.receiver_id,
        email: profile?.email || '',
        airline: profile?.airline || '',
        position: profile?.position || 'CCM',
        nationality: profile?.nationality,
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
        email: profile?.email || '',
        airline: profile?.airline || '',
        position: profile?.position || 'CCM',
        nationality: profile?.nationality,
        createdAt: friendship.created_at,
        type: 'received' as const,
      };
    });

    return { data: { sent, received }, error: null };
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  requesterId: string,
  receiverEmail: string
): Promise<{ data: FriendshipRow | null; error: string | null }> {
  try {
    // Find receiver by email
    const { data: receiver, error: findError } = await findUserByEmail(receiverEmail);

    if (findError) {
      return { data: null, error: findError };
    }

    if (!receiver) {
      return { data: null, error: 'User not found with that email' };
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
      console.error('Error checking existing friendship:', existingError);
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
          console.error('Error updating friendship:', updateError);
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
      console.error('Error creating friendship:', insertError);
      return { data: null, error: insertError.message };
    }

    return { data: newFriendship, error: null };
  } catch (error) {
    console.error('Error sending friend request:', error);
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
      console.error('Error fetching friendship:', fetchError);
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
      console.error('Error updating friendship:', updateError);
      return { data: null, error: updateError.message };
    }

    return { data: updated, error: null };
  } catch (error) {
    console.error('Error responding to friend request:', error);
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
      console.error('Error fetching friendship:', fetchError);
      return { error: fetchError.message };
    }

    // Delete the friendship
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (deleteError) {
      console.error('Error deleting friendship:', deleteError);
      return { error: deleteError.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error unfriending:', error);
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
      console.error('Error fetching pending requests count:', error);
      return { data: null, error: error.message };
    }

    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    return { data: null, error: (error as Error).message };
  }
}

