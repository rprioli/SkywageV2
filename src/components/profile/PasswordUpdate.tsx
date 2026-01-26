'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { updatePassword } from '@/lib/auth';
import { ProfileSettingsRow } from './ProfileSettingsRow';
import { Button } from '@/components/ui/button';

export function PasswordUpdate() {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setUpdateSuccess(false);

      const { error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        // Check for reauthentication requirement
        if (updateError.message?.includes('reauth') || updateError.message?.includes('session')) {
          throw new Error('Please sign out and sign in again, then try changing your password');
        }
        throw new Error(updateError.message || 'Failed to update password');
      }

      setUpdateSuccess(true);
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');

      // Auto-hide success message after 3 seconds
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
    setError(null);
  };

  return (
    <ProfileSettingsRow
      label="Password"
      value="••••••••"
      action={{
        label: 'Edit',
        onClick: () => setIsEditing(true)
      }}
      isEditing={isEditing}
    >
      <div className="space-y-4">
        <div className="max-w-md space-y-3">
          <div>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </ProfileSettingsRow>
  );
}
