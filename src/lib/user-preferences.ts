/**
 * User preferences utilities for Skywage
 * Provides typed access to user preferences stored in user_settings.settings JSON
 */

import { getUserSettings, createUserSettings, updateUserSettings } from './db';

/**
 * Typed user preferences model
 * All preferences should have explicit boolean defaults
 */
export interface UserPreferences {
  /** Hide your roster from friends in roster comparison */
  hideRosterFromFriends: boolean;
  /** Hide days off (OFF, annual leave) on the dashboard duty list */
  hideDaysOffOnDashboard: boolean;
}

/**
 * Default values for all preferences
 * Used when settings don't exist or a specific preference is missing
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  hideRosterFromFriends: false,
  hideDaysOffOnDashboard: false,
};

const defaultPreferencesSettingsRecord: Record<string, unknown> = {
  hideRosterFromFriends: DEFAULT_PREFERENCES.hideRosterFromFriends,
  hideDaysOffOnDashboard: DEFAULT_PREFERENCES.hideDaysOffOnDashboard,
};

/**
 * Parse raw settings JSON into typed UserPreferences
 * Safely handles missing/malformed values by falling back to defaults
 */
export const parsePreferences = (settings: Record<string, unknown> | null | undefined): UserPreferences => {
  if (!settings) {
    return { ...DEFAULT_PREFERENCES };
  }

  return {
    hideRosterFromFriends: typeof settings.hideRosterFromFriends === 'boolean' 
      ? settings.hideRosterFromFriends 
      : DEFAULT_PREFERENCES.hideRosterFromFriends,
    hideDaysOffOnDashboard: typeof settings.hideDaysOffOnDashboard === 'boolean' 
      ? settings.hideDaysOffOnDashboard 
      : DEFAULT_PREFERENCES.hideDaysOffOnDashboard,
  };
};

/**
 * Load user preferences from the database
 * Creates default settings row if it doesn't exist
 */
export const loadUserPreferences = async (userId: string): Promise<{
  preferences: UserPreferences;
  error: string | null;
}> => {
  try {
    const { data, error } = await getUserSettings(userId);

    // If no settings exist yet, create default settings
    if (error?.code === 'PGRST116' || !data) {
      const { data: newData, error: createError } = await createUserSettings({
        user_id: userId,
        settings: defaultPreferencesSettingsRecord,
      });

      if (createError) {
        // If creation fails (e.g., RLS or constraint), return defaults without error
        // The user can still use the app, preferences just won't persist
        console.warn('Could not create user settings:', createError.message);
        return { preferences: { ...DEFAULT_PREFERENCES }, error: null };
      }

      return { 
        preferences: parsePreferences(newData?.settings), 
        error: null 
      };
    }

    if (error) {
      return { preferences: { ...DEFAULT_PREFERENCES }, error: error.message };
    }

    return { preferences: parsePreferences(data.settings), error: null };
  } catch (err) {
    return { 
      preferences: { ...DEFAULT_PREFERENCES }, 
      error: err instanceof Error ? err.message : 'Unknown error loading preferences' 
    };
  }
};

/**
 * Save a single preference value
 * Merges with existing preferences to avoid overwriting other settings
 */
export const saveUserPreference = async <K extends keyof UserPreferences>(
  userId: string,
  key: K,
  value: UserPreferences[K]
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // First, load existing settings to merge with
    const { data: existingData } = await getUserSettings(userId);
    
    const existingSettings = existingData?.settings || {};
    const updatedSettings = {
      ...existingSettings,
      [key]: value,
    };

    // If no settings row exists, create one
    if (!existingData) {
      const { error: createError } = await createUserSettings({
        user_id: userId,
        settings: updatedSettings,
      });

      if (createError) {
        return { success: false, error: createError.message };
      }

      return { success: true, error: null };
    }

    // Update existing settings
    const { error: updateError } = await updateUserSettings(userId, {
      settings: updatedSettings,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error saving preference' 
    };
  }
};

/**
 * Save multiple preferences at once
 */
export const saveUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // First, load existing settings to merge with
    const { data: existingData } = await getUserSettings(userId);
    
    const existingSettings = existingData?.settings || {};
    const updatedSettings = {
      ...existingSettings,
      ...preferences,
    };

    // If no settings row exists, create one
    if (!existingData) {
      const { error: createError } = await createUserSettings({
        user_id: userId,
        settings: updatedSettings,
      });

      if (createError) {
        return { success: false, error: createError.message };
      }

      return { success: true, error: null };
    }

    // Update existing settings
    const { error: updateError } = await updateUserSettings(userId, {
      settings: updatedSettings,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error saving preferences' 
    };
  }
};
