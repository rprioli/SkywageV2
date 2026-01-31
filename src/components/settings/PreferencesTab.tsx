'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileSettingsSection } from '@/components/profile/ProfileSettingsSection';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  UserPreferences, 
  DEFAULT_PREFERENCES,
  loadUserPreferences, 
  saveUserPreference 
} from '@/lib/user-preferences';
import { Loader2 } from 'lucide-react';

interface PreferenceRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Reusable preference row with switch toggle
 */
const PreferenceRow = ({
  id,
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: PreferenceRowProps) => {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="flex-1 min-w-0 mr-4">
        <Label 
          htmlFor={id}
          className="text-base font-bold text-brand-ink cursor-pointer"
        >
          {label}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={`${id}-description`}
        className="data-[state=checked]:bg-[#4C49ED]"
      />
    </div>
  );
};

/**
 * PreferencesTab - User preferences with toggle switches
 * Preferences are persisted in user_settings.settings JSON
 */
export const PreferencesTab = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Don't set loading to true here to avoid spinner on initial mount if data is fast
      // or if we want to show skeleton/default state instead
      // setLoading(true); 
      setError(null);

      const { preferences: loadedPrefs, error: loadError } = await loadUserPreferences(user.id);
      
      if (loadError) {
        setError(loadError);
      }
      
      setPreferences(loadedPrefs);
      setLoading(false);
    };

    loadPrefs();
  }, [user?.id]);

  // Handle preference toggle with optimistic UI
  const handlePreferenceChange = useCallback(async (
    key: keyof UserPreferences,
    value: boolean
  ) => {
    if (!user?.id) return;

    // Optimistic update
    const previousValue = preferences[key];
    setPreferences(prev => ({ ...prev, [key]: value }));
    setError(null);

    const { success, error: saveError } = await saveUserPreference(user.id, key, value);

    if (!success) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      setError(saveError || 'Failed to save preference');
    }
  }, [user?.id, preferences]);

  // Removed explicit loading spinner to improve UX
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center py-12">
  //       <Loader2 className="h-6 w-6 animate-spin text-[#4C49ED]" />
  //       <span className="ml-2 text-muted-foreground">Loading preferences...</span>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <ProfileSettingsSection title="Privacy">
        <div className="divide-y divide-border">
          <PreferenceRow
            id="hideRosterFromFriends"
            label="Hide roster from friends"
            description="When enabled, your friends won't be able to see your roster in the roster comparison feature."
            checked={preferences.hideRosterFromFriends}
            onCheckedChange={(checked) => handlePreferenceChange('hideRosterFromFriends', checked)}
          />
        </div>
      </ProfileSettingsSection>

      <ProfileSettingsSection title="Display">
        <div className="divide-y divide-border">
          <PreferenceRow
            id="hideDaysOffOnDashboard"
            label="Hide days off on dashboard"
            description="When enabled, days off (OFF, annual leave) will be hidden from the duty list on your dashboard."
            checked={preferences.hideDaysOffOnDashboard}
            onCheckedChange={(checked) => handlePreferenceChange('hideDaysOffOnDashboard', checked)}
          />
        </div>
      </ProfileSettingsSection>
    </div>
  );
};
