'use client';

/**
 * Friends Page
 * Allows users to manage their friends, send/accept requests
 * Phase 2 - Core Friends UI & API
 */

import { useState } from 'react';
import { useFriendsContext } from '@/contexts/FriendsProvider';
import { useMobileNavigation } from '@/contexts/MobileNavigationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Menu, UserPlus, Mail, Check, X, UserMinus, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RosterComparison } from '@/components/friends/RosterComparison';

export default function FriendsPage() {
  const {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    respondToRequest,
    unfriend,
  } = useFriendsContext();

  const { isMobile, toggleSidebar } = useMobileNavigation();
  const { showSuccess, showError } = useToast();

  const [emailInput, setEmailInput] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; email: string } | null>(null);

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

  /**
   * Handle unfriending a user
   */
  const handleUnfriend = async (friendshipId: string, friendEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${friendEmail} from your friends?`)) {
      return;
    }

    const result = await unfriend(friendshipId);
    if (result.success) {
      showSuccess('Friend removed');
    } else {
      showError('Failed to remove friend', { description: result.error });
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

        {/* Friends List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: '#4C49ED' }} />
              My Friends ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No friends yet</p>
                <p className="text-sm mt-1">Add friends to compare rosters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.email}</p>
                      <p className="text-sm text-gray-500">
                        {friend.airline} • {friend.position}
                        {friend.nationality && ` • ${friend.nationality}`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFriend({ id: friend.userId, email: friend.email })}
                        className="text-[#4C49ED] hover:text-[#4C49ED] hover:bg-purple-50"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnfriend(friend.friendshipId, friend.email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roster Comparison Section */}
        {selectedFriend && (
          <RosterComparison
            friendId={selectedFriend.id}
            friendEmail={selectedFriend.email}
            onClose={() => setSelectedFriend(null)}
          />
        )}
      </div>
    </div>
  );
}

