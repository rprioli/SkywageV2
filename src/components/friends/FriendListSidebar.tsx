'use client';

/**
 * Friend List Sidebar Component
 * Displays friends list with avatars, search, and multi-selection
 * Phase 4 - Design alignment with Dashboard page
 * Phase 4b - Multi-friend comparison support
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, UserPlus, X } from 'lucide-react';
import { FriendWithProfile, PendingRequest, getAvatarColor } from '@/lib/database/friends';
import { getFriendDisplayName, getFriendInitial } from '@/lib/database/friends';
import { cn } from '@/lib/utils';

/** Maximum number of friends that can be compared at once */
const MAX_SELECTED_FRIENDS = 5;

interface FriendListSidebarProps {
  friends: FriendWithProfile[];
  loading: boolean;
  /** Array of selected friend user IDs for multi-selection */
  selectedFriendIds: string[];
  /** Toggle friend selection (add or remove from comparison) */
  onToggleFriend: (friend: FriendWithProfile) => void;
  /** Clear all selected friends (optional) */
  onClearSelection?: () => void;
  
  // Add Friend & Pending Requests Props
  pendingRequests: {
    sent: PendingRequest[];
    received: PendingRequest[];
  };
  onSendRequest: (username: string) => Promise<void>;
  onAcceptRequest: (id: string) => Promise<void>;
  onRejectRequest: (id: string) => Promise<void>;
  sendingRequest: boolean;
}

export function FriendListSidebar({
  friends,
  loading,
  selectedFriendIds,
  onToggleFriend,
  onClearSelection,
  pendingRequests,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  sendingRequest,
}: FriendListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  // Client-side filtering based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;

    const query = searchQuery.toLowerCase();
    return friends.filter((friend) => {
      const displayName = getFriendDisplayName(friend).toLowerCase();
      const username = friend.username.toLowerCase();
      const airline = friend.airline.toLowerCase();
      
      return (
        displayName.includes(query) ||
        username.includes(query) ||
        airline.includes(query)
      );
    });
  }, [friends, searchQuery]);

  const handleSendRequest = async () => {
    if (!usernameInput.trim()) return;
    await onSendRequest(usernameInput.trim());
    setUsernameInput('');
  };

  const hasPendingRequests = pendingRequests.received.length > 0 || pendingRequests.sent.length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Add Friend Section */}
      <div className="card-responsive-padding pb-3 space-y-3">
        <h2 className="flex items-center gap-2 text-responsive-base font-bold text-brand-ink">
          <UserPlus className="h-5 w-5" style={{ color: '#4C49ED' }} />
          Add Friend
        </h2>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
            disabled={sendingRequest}
            className="w-full rounded-xl h-10 py-2"
          />
          <Button
            onClick={handleSendRequest}
            disabled={sendingRequest || !usernameInput.trim()}
            style={{ backgroundColor: '#4C49ED' }}
            className="w-full hover:opacity-90 whitespace-nowrap rounded-xl h-10"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Send Request
          </Button>
        </div>
      </div>

      <div className="px-4">
        <div className="h-px bg-gray-100" />
      </div>

      {/* Pending Requests Section */}
      {hasPendingRequests && (
        <>
          <div className="card-responsive-padding py-3 space-y-3">
             {/* Received Requests */}
             {pendingRequests.received.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Received Requests
                </h3>
                <div className="space-y-2">
                  {pendingRequests.received.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="p-3 bg-gray-50/80 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                           <div className={cn(
                             "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                             getAvatarColor(request.userId)
                           )}>
                             {getFriendInitial(request)}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm text-gray-900">
                             {getFriendDisplayName(request)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {request.airline} • {request.position}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onAcceptRequest(request.friendshipId)}
                          style={{ backgroundColor: '#6DDC91' }}
                          className="flex-1 h-8 hover:opacity-90 rounded-lg text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRejectRequest(request.friendshipId)}
                          className="flex-1 h-8 rounded-lg text-xs"
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {pendingRequests.sent.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  Sent Requests
                </h3>
                <div className="space-y-2">
                  {pendingRequests.sent.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl"
                    >
                      <div className="flex-shrink-0">
                         <div className={cn(
                           "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                           getAvatarColor(request.userId)
                         )}>
                           {getFriendInitial(request)}
                         </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm text-gray-900">
                           {getFriendDisplayName(request)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Pending
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-4">
            <div className="h-px bg-gray-100" />
          </div>
        </>
      )}

      {/* Friends List Header */}
      <div className="card-responsive-padding py-3 space-y-3">
        <div className="flex items-center justify-between h-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Your Friends
          </h2>
          {/* Selection count badge and clear button */}
          {selectedFriendIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#4C49ED] bg-[#4C49ED]/10 px-2 py-0.5 rounded-full">
                {selectedFriendIds.length}/{MAX_SELECTED_FRIENDS}
              </span>
              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Clear all selected friends"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute input-icon-left h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-with-left-icon rounded-xl border-gray-200 h-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto px-2 md:px-3 pb-2">
        {loading ? (
          <LoadingState />
        ) : filteredFriends.length === 0 ? (
          searchQuery ? (
            <EmptySearchState query={searchQuery} />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="space-y-1">
            {filteredFriends.map((friend) => (
              <FriendListItem
                key={friend.friendshipId}
                friend={friend}
                isSelected={selectedFriendIds.includes(friend.userId)}
                isMaxReached={selectedFriendIds.length >= MAX_SELECTED_FRIENDS}
                onClick={() => onToggleFriend(friend)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Friend List Item with multi-selection support
 */
interface FriendListItemProps {
  friend: FriendWithProfile;
  isSelected: boolean;
  isMaxReached: boolean;
  onClick: () => void;
}

function FriendListItem({ friend, isSelected, isMaxReached, onClick }: FriendListItemProps) {
  const displayName = getFriendDisplayName(friend);
  const initial = getFriendInitial(friend);
  const avatarColor = getAvatarColor(friend.userId);

  // Disable clicking if max is reached and this friend is not already selected
  const isDisabled = !isSelected && isMaxReached;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'w-full px-3 md:px-4 py-3 flex items-center gap-3 rounded-2xl transition-all duration-200',
        'focus:outline-none',
        isSelected 
          ? 'bg-[#4C49ED]/10' 
          : 'hover:bg-gray-50/80 active:bg-gray-100',
        isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
      )}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${displayName} for comparison`}
    >
      {/* Avatar or Initial with selection indicator */}
      <div className="flex-shrink-0 relative">
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
                  <div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center">
                    <span class="text-white font-semibold text-lg">${initial}</span>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            avatarColor
          )}>
            <span className="text-white font-semibold text-lg">{initial}</span>
          </div>
        )}
      </div>

      {/* Friend Info */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            'font-medium truncate text-responsive-sm',
            isSelected ? 'text-[#4C49ED]' : 'text-gray-900'
          )}
        >
          {displayName}
        </p>
        <p className="text-responsive-xs text-gray-500 truncate">
          {friend.position}
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
    <div className="px-2 py-6 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse p-3">
          <div className="w-10 h-10 rounded-full bg-gray-100"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded-lg w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
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
    <div className="px-4 py-8 text-center">
      <Users className="h-8 w-8 mx-auto mb-3 text-gray-400" />
      <p className="text-sm font-bold text-brand-ink">No friends yet</p>
      <p className="text-xs text-gray-500 mt-1">
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
    <div className="px-4 py-8 text-center">
      <Search className="h-8 w-8 mx-auto mb-3 text-gray-400" />
      <p className="text-sm font-bold text-brand-ink">No results</p>
      <p className="text-xs text-gray-500 mt-1">
        No friends matching "{query}"
      </p>
    </div>
  );
}
