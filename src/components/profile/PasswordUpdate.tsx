'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { updatePassword } from '@/lib/auth';

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
    <div>
      <p className="text-sm text-muted-foreground">Password</p>

      {isEditing ? (
        <div className="mt-1 space-y-3">
          <div>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full mb-2"
            />
          </div>
          <div>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full mb-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-muted text-foreground rounded-md hover:bg-muted/90 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="font-medium">••••••••</p>
          <button
            onClick={() => {
              setIsEditing(true);
              setUpdateSuccess(false);
              if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            Change
          </button>

          {updateSuccess && (
            <span className="text-xs text-accent">Password updated successfully!</span>
          )}
        </div>
      )}
    </div>
  );
}
