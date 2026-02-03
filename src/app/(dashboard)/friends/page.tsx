'use client';

/**
 * Friends Page
 * Allows users to manage their friends, send/accept requests
 * Phase 4 - Design alignment with Dashboard page
 * Phase 4b - Multi-friend comparison support
 */

import { useState } from 'react';
import { useFriendsContext } from '@/contexts/FriendsProvider';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMultiFriendComparison } from '@/hooks/useMultiFriendComparison';
import { MultiRosterComparison } from '@/components/friends/MultiRosterComparison';
import { FriendListSidebar } from '@/components/friends/FriendListSidebar';
import { FriendWithProfile } from '@/lib/database/friends';

/** Maximum number of friends that can be compared at once */
const MAX_SELECTED_FRIENDS = 5;

export default function FriendsPage() {
  const {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    respondToRequest,
  } = useFriendsContext();

  const { isMobile, toggleSidebar, isSidebarOpen } = useMobileNavigation();
  const { showSuccess, showError } = useToast();

  const [sendingRequest, setSendingRequest] = useState(false);
  
  // Multi-friend selection state
  const [selectedFriends, setSelectedFriends] = useState<FriendWithProfile[]>([]);

  // Multi-friend comparison data fetching
  const {
    gridData,
    loading: comparisonLoading,
    error: comparisonError,
    month,
    year,
    goToPreviousMonth,
    goToNextMonth,
  } = useMultiFriendComparison(selectedFriends);

  /**
   * Toggle friend selection for comparison
   * Adds friend if not selected, removes if already selected
   * Shows error if trying to add when max is reached
   */
  const handleToggleFriend = (friend: FriendWithProfile) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f.userId === friend.userId);
      
      if (isSelected) {
        // Remove from selection
        return prev.filter((f) => f.userId !== friend.userId);
      }
      
      // Check if max is reached before adding
      if (prev.length >= MAX_SELECTED_FRIENDS) {
        showError(`Maximum ${MAX_SELECTED_FRIENDS} friends can be compared at once`);
        return prev;
      }
      
      // Add to selection
      return [...prev, friend];
    });
  };

  /**
   * Handle sending a friend request
   */
  const handleSendRequest = async (username: string) => {
    setSendingRequest(true);
    const result = await sendFriendRequest(username.toLowerCase());
    setSendingRequest(false);

    if (result.success) {
      showSuccess('Friend request sent!');
    } else {
      showError('Failed to send request', { description: result.error });
    }
  };

  /**
   * Handle accepting a friend request
   */
  const handleAccept = async (friendshipId: string) => {
    const result = await respondToRequest(friendshipId, 'accepted');
    if (result.success) {
      showSuccess('Friend request accepted!');
    } else {
      showError('Failed to accept request', { description: result.error });
    }
  };

  /**
   * Handle rejecting a friend request
   */
  const handleReject = async (friendshipId: string) => {
    const result = await respondToRequest(friendshipId, 'rejected');
    if (result.success) {
      showSuccess('Friend request rejected');
    } else {
      showError('Failed to reject request', { description: result.error });
    }
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-6 px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-3xl font-bold space-responsive-sm text-brand-ink">
              Friends
            </h1>
            <p className="text-responsive-base text-primary font-bold">
              Connect with colleagues and compare rosters
            </p>
          </div>

          {/* Mobile hamburger menu - matching Dashboard styling */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`flex-shrink-0 p-3 rounded-lg touch-target transition-colors ${
                isSidebarOpen
                  ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                  : 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="responsive-container pb-6 space-y-4 md:space-y-6">
        {/* Error State */}
        {error && (
          <Card className="bg-red-50 rounded-3xl !border-0 !shadow-none">
            <CardContent className="card-responsive-padding">
              <p className="text-red-600 text-responsive-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Friends & Roster Comparison - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
          {/* Left Column: Friend List Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden h-full">
              <FriendListSidebar
                friends={friends}
                loading={loading}
                selectedFriendIds={selectedFriends.map((f) => f.userId)}
                onToggleFriend={handleToggleFriend}
                onClearSelection={() => setSelectedFriends([])}
                pendingRequests={pendingRequests}
                onSendRequest={handleSendRequest}
                onAcceptRequest={handleAccept}
                onRejectRequest={handleReject}
                sendingRequest={sendingRequest}
              />
            </Card>
          </div>

          {/* Right Column: Roster Comparison Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 h-full">
            {selectedFriends.length > 0 ? (
              <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden h-full">
                <MultiRosterComparison
                  gridData={gridData}
                  loading={comparisonLoading}
                  error={comparisonError}
                  month={month}
                  year={year}
                  onPreviousMonth={goToPreviousMonth}
                  onNextMonth={goToNextMonth}
                />
              </Card>
            ) : (
              <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden h-full flex items-center justify-center relative">
                 {/* Subtle radial gradient background */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />
                 
                <CardContent className="text-center py-6 md:py-8 relative z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-50">
                    <Users className="h-10 w-10 md:h-12 md:w-12 text-slate-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-brand-ink">
                    Select Friends to Compare
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-base md:text-lg leading-relaxed font-medium">
                    Click on friends from the list to select them for roster comparison (up to {MAX_SELECTED_FRIENDS} friends)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}