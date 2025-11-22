'use client';

/**
 * Friend List Sidebar Component
 * Displays friends list with avatars, search, and selection
 * Phase 2 - Friends Feature Redesign
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { FriendWithProfile } from '@/lib/database/friends';
import { getFriendDisplayName, getFriendInitial } from '@/lib/database/friends';
import { cn } from '@/lib/utils';

interface FriendListSidebarProps {
  friends: FriendWithProfile[];
  loading: boolean;
  selectedFriendId: string | null;
  onSelectFriend: (friend: FriendWithProfile) => void;
}

export function FriendListSidebar({
  friends,
  loading,
  selectedFriendId,
  onSelectFriend,
}: FriendListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Client-side filtering based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;

    const query = searchQuery.toLowerCase();
    return friends.filter((friend) => {
      const displayName = getFriendDisplayName(friend).toLowerCase();
      const email = friend.email.toLowerCase();
      const airline = friend.airline.toLowerCase();
      
      return (
        displayName.includes(query) ||
        email.includes(query) ||
        airline.includes(query)
      );
    });
  }, [friends, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Friends</h2>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : filteredFriends.length === 0 ? (
          searchQuery ? (
            <EmptySearchState query={searchQuery} />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFriends.map((friend) => (
              <FriendListItem
                key={friend.friendshipId}
                friend={friend}
                isActive={friend.userId === selectedFriendId}
                onClick={() => onSelectFriend(friend)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Friend List Item
 */
interface FriendListItemProps {
  friend: FriendWithProfile;
  isActive: boolean;
  onClick: () => void;
}

function FriendListItem({ friend, isActive, onClick }: FriendListItemProps) {
  const displayName = getFriendDisplayName(friend);
  const initial = getFriendInitial(friend);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4C49ED]',
        isActive && 'bg-purple-50 border-l-4 border-[#4C49ED]'
      )}
    >
      {/* Avatar or Initial */}
      <div className="flex-shrink-0">
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              // Fallback to initial circle on image error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
                    <span class="text-white font-semibold text-lg">${initial}</span>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C49ED] to-[#6DDC91] flex items-center justify-center">
            <span className="text-white font-semibold text-lg">{initial}</span>
          </div>
        )}
      </div>

      {/* Friend Info */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            'font-medium truncate',
            isActive ? 'text-[#4C49ED]' : 'text-gray-900'
          )}
        >
          {displayName}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {friend.airline} • {friend.position}
        </p>
      </div>
    </button>
  );
}

/**
 * Loading State
 */
function LoadingState() {
  return (
    <div className="px-4 py-8 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State - No Friends Yet
 */
function EmptyState() {
  return (
    <div className="px-4 py-12 text-center">
      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 font-medium">No friends yet</p>
      <p className="text-sm text-gray-400 mt-1">
        Add friends to see them here
      </p>
    </div>
  );
}

/**
 * Empty Search State - No Results
 */
function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 font-medium">No results for &quot;{query}&quot;</p>
      <p className="text-sm text-gray-400 mt-1">
        Try searching by name, email, or airline
      </p>
    </div>
  );
}

