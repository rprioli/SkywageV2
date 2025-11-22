'use client';

/**
 * Friends Page
 * Allows users to manage their friends, send/accept requests
 * Phase 3 - Integrated Layout with Sidebar
 */

import { useState } from 'react';
import { useFriendsContext } from '@/contexts/FriendsProvider';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, UserPlus, Mail, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RosterComparison } from '@/components/friends/RosterComparison';
import { FriendListSidebar } from '@/components/friends/FriendListSidebar';
import { FriendWithProfile } from '@/lib/database/friends';
import { getFriendDisplayName } from '@/lib/database/friends';

export default function FriendsPage() {
  const {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    respondToRequest,
  } = useFriendsContext();

  const { isMobile, toggleSidebar } = useMobileNavigation();
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
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#3A3780' }}>
              Friends
            </h1>
            <p className="text-primary font-bold">
              Connect with colleagues and compare rosters
            </p>
          </div>

          {/* Mobile hamburger menu */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="shrink-0"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6 space-y-6">
        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Add Friend Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" style={{ color: '#4C49ED' }} />
              Add Friend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter friend's email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                disabled={sendingRequest}
              />
              <Button
                onClick={handleSendRequest}
                disabled={sendingRequest || !emailInput.trim()}
                style={{ backgroundColor: '#4C49ED' }}
                className="hover:opacity-90"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests Section */}
        {(pendingRequests.received.length > 0 || pendingRequests.sent.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" style={{ color: '#4C49ED' }} />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Received Requests */}
              {pendingRequests.received.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-600">
                    Received ({pendingRequests.received.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.received.map((request) => (
                      <div
                        key={request.friendshipId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{request.email}</p>
                          <p className="text-sm text-gray-500">
                            {request.airline} • {request.position}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(request.friendshipId)}
                            style={{ backgroundColor: '#6DDC91' }}
                            className="hover:opacity-90"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.friendshipId)}
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
                  <h3 className="font-semibold text-sm text-gray-600">
                    Sent ({pendingRequests.sent.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.sent.map((request) => (
                      <div
                        key={request.friendshipId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{request.email}</p>
                          <p className="text-sm text-gray-500">
                            {request.airline} • {request.position}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 ml-4">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Friends & Roster Comparison - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-32rem)]">
          {/* Left Column: Friend List Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <div className="border border-gray-200 rounded-lg overflow-hidden h-full bg-white">
              <FriendListSidebar
                friends={friends}
                loading={loading}
                selectedFriendId={selectedFriend?.userId || null}
                onSelectFriend={(friend) => setSelectedFriend(friend)}
              />
            </div>
          </div>

          {/* Right Column: Roster Comparison Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 h-full">
            {selectedFriend ? (
              <div className="h-full overflow-hidden">
                <RosterComparison
                  friendId={selectedFriend.userId}
                  friendEmail={getFriendDisplayName(selectedFriend)}
                  onClose={() => setSelectedFriend(null)}
                />
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50/50">
                <CardContent className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Select a friend to compare rosters
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Choose a friend from the list on the left to view and compare your rosters side by side
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

