'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

export function DeleteAccountSection() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Close dialog and redirect to home page
      setIsDialogOpen(false);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setConfirmText('');
      setError(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-destructive/30 rounded-lg p-6 bg-destructive/5">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-2">Delete Account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
            All your flight data, calculations, friendships, and uploaded files will be permanently removed.
          </p>

          <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm Account Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This will permanently delete your account and all associated data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your profile and personal information</li>
                    <li>All flight data and salary calculations</li>
                    <li>All friendships and friend requests</li>
                    <li>Uploaded avatars and files</li>
                  </ul>
                  <p className="font-semibold text-destructive">
                    This action cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <label htmlFor="confirm-delete" className="text-sm font-medium">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm:
                    </label>
                    <Input
                      id="confirm-delete"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="font-mono"
                      disabled={isDeleting}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteAccount();
                  }}
                  disabled={isDeleting || confirmText !== 'DELETE'}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
