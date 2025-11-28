'use client';

/**
 * Friends Page
 * Allows users to manage their friends, send/accept requests
 * Phase 4 - Design alignment with Dashboard page
 */

import { useState } from 'react';
import { useFriendsContext } from '@/contexts/FriendsProvider';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, UserPlus, Mail, Check, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RosterComparison } from '@/components/friends/RosterComparison';
import { FriendListSidebar } from '@/components/friends/FriendListSidebar';
import { FriendWithProfile } from '@/lib/database/friends';

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

  const [emailInput, setEmailInput] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);

  /**
   * Handle sending a friend request
   */
  const handleSendRequest = async () => {
    if (!emailInput.trim()) {
      showError('Email required', { description: 'Please enter an email address' });
      return;
    }

    setSendingRequest(true);
    const result = await sendFriendRequest(emailInput.trim().toLowerCase());
    setSendingRequest(false);

    if (result.success) {
      showSuccess('Friend request sent!');
      setEmailInput('');
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
            <h1 className="text-responsive-3xl font-bold space-responsive-sm" style={{ color: '#3A3780' }}>
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

        {/* Add Friend Section */}
        <Card className="bg-white rounded-3xl !border-0 !shadow-none">
          <CardHeader className="card-responsive-padding pb-0">
            <CardTitle className="flex items-center gap-2 text-responsive-xl" style={{ color: '#3A3780' }}>
              <UserPlus className="h-5 w-5" style={{ color: '#4C49ED' }} />
              Add Friend
            </CardTitle>
          </CardHeader>
          <CardContent className="card-responsive-padding pt-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                type="email"
                placeholder="Enter friend's email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                disabled={sendingRequest}
                className="flex-1"
              />
              <Button
                onClick={handleSendRequest}
                disabled={sendingRequest || !emailInput.trim()}
                style={{ backgroundColor: '#4C49ED' }}
                className="hover:opacity-90 whitespace-nowrap"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests Section */}
        {(pendingRequests.received.length > 0 || pendingRequests.sent.length > 0) && (
          <Card className="bg-white rounded-3xl !border-0 !shadow-none">
            <CardHeader className="card-responsive-padding pb-0">
              <CardTitle className="flex items-center gap-2 text-responsive-xl" style={{ color: '#3A3780' }}>
                <Mail className="h-5 w-5" style={{ color: '#4C49ED' }} />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="card-responsive-padding pt-4 space-y-4">
              {/* Received Requests */}
              {pendingRequests.received.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-responsive-sm text-gray-600">
                    Received ({pendingRequests.received.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.received.map((request) => (
                      <div
                        key={request.friendshipId}
                        className="flex items-center justify-between p-3 md:p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-responsive-base">{request.email}</p>
                          <p className="text-responsive-sm text-gray-500">
                            {request.airline} • {request.position}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(request.friendshipId)}
                            style={{ backgroundColor: '#6DDC91' }}
                            className="hover:opacity-90 rounded-xl"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.friendshipId)}
                            className="rounded-xl"
                          >
                            <X className="h-4 w-4" />
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
                  <h3 className="font-semibold text-responsive-sm text-gray-600">
                    Sent ({pendingRequests.sent.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.sent.map((request) => (
                      <div
                        key={request.friendshipId}
                        className="flex items-center justify-between p-3 md:p-4 bg-gray-50/50 rounded-2xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-responsive-base">{request.email}</p>
                          <p className="text-responsive-sm text-gray-500">
                            {request.airline} • {request.position}
                          </p>
                        </div>
                        <span className="text-responsive-sm text-gray-500 ml-4">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Friends & Roster Comparison - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[calc(100vh-32rem)] min-h-[400px]">
          {/* Left Column: Friend List Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden h-full">
              <FriendListSidebar
                friends={friends}
                loading={loading}
                selectedFriendId={selectedFriend?.userId || null}
                onSelectFriend={(friend) => setSelectedFriend(friend)}
              />
            </Card>
          </div>

          {/* Right Column: Roster Comparison Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 h-full">
            {selectedFriend ? (
              <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden h-full">
                <RosterComparison
                  friend={selectedFriend}
                  onClose={() => setSelectedFriend(null)}
                />
              </Card>
            ) : (
              <Card className="bg-white rounded-3xl !border-0 !shadow-none overflow-hidden h-full flex items-center justify-center">
                <CardContent className="text-center py-6 md:py-8">
                  <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-gray-400" />
                  <h3 className="text-responsive-2xl font-bold space-responsive-md tracking-tight" style={{ color: '#3A3780' }}>
                    Select a Friend
                  </h3>
                  <p className="text-responsive-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Choose a friend from the list to view and compare your rosters side by side
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

