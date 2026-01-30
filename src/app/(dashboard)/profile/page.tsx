import { redirect } from 'next/navigation';

/**
 * Profile route redirect
 * This page now redirects to /settings for backward compatibility.
 * All profile/settings functionality has been moved to /settings.
 */
export default function ProfileRedirect() {
  redirect('/settings');
}
