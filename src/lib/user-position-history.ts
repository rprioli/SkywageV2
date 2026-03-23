/**
 * User Position History — single source of truth for effective-dated position resolution.
 *
 * This module is the ONLY place that answers "which position (CCM/SCCM) applies
 * for a given user in a given month?" All salary calculation workflows (upload,
 * manual entry, recalculation, edits) must use getUserPositionForMonth instead of
 * reading profiles.position or receiving position as a prop.
 *
 * Key rule: for month (Y,M), use the latest history row where effective date <= (Y,M).
 */

import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateProfile } from './db';
import { Position } from '@/types/salary-calculator';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PositionHistoryEntry {
  id: string;
  userId: string;
  position: Position;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  createdAt: Date;
}

export interface AddPositionChangeResult {
  success: boolean;
  entry: PositionHistoryEntry | null;
  error: string | null;
}

export interface DeletePositionChangeResult {
  success: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row ↔ type conversion
// ─────────────────────────────────────────────────────────────────────────────

type HistoryRow = {
  id: string;
  user_id: string;
  position: string;
  effective_from_year: number;
  effective_from_month: number;
  created_at: string;
};

const rowToEntry = (row: HistoryRow): PositionHistoryEntry => ({
  id: row.id,
  userId: row.user_id,
  position: row.position as Position,
  effectiveFromYear: row.effective_from_year,
  effectiveFromMonth: row.effective_from_month,
  createdAt: new Date(row.created_at),
});

// ─────────────────────────────────────────────────────────────────────────────
// Core resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the position (CCM or SCCM) that applies to a user in a given month.
 *
 * This is the canonical resolver used by every calculation workflow.
 * It queries the position timeline and returns the latest entry whose
 * effective date is <= the requested (year, month).
 *
 * Falls back to profiles.position if no history row is found (data integrity guard).
 */
export async function getUserPositionForMonth(
  userId: string,
  year: number,
  month: number,
  client: SupabaseClient = supabase
): Promise<Position> {
  // Query: latest history entry with effective date <= (year, month)
  const { data, error } = await client
    .from('user_position_history')
    .select('*')
    .eq('user_id', userId)
    .or(
      `effective_from_year.lt.${year},and(effective_from_year.eq.${year},effective_from_month.lte.${month})`
    )
    .order('effective_from_year', { ascending: false })
    .order('effective_from_month', { ascending: false })
    .limit(1)
    .single();

  if (!error && data) {
    return data.position as Position;
  }

  // Fallback: read current position from profiles table (data integrity guard)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('position')
    .eq('id', userId)
    .single();

  if (!profileError && profile?.position) {
    return profile.position as Position;
  }

  // Should never reach here for valid users. Throw so callers surface the issue.
  throw new Error(
    `Cannot resolve position for user ${userId} at ${year}-${month}. ` +
    'No position history row found and profiles fallback failed. ' +
    'Ensure the user has a baseline position history entry.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the full position history timeline for a user, sorted chronologically
 * (oldest first). Used to render the Role History UI.
 */
export async function getUserPositionTimeline(
  userId: string,
  client: SupabaseClient = supabase
): Promise<{ data: PositionHistoryEntry[]; error: string | null }> {
  const { data, error } = await client
    .from('user_position_history')
    .select('*')
    .eq('user_id', userId)
    .order('effective_from_year', { ascending: true })
    .order('effective_from_month', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (data as HistoryRow[]).map(rowToEntry),
    error: null,
  };
}

/**
 * Adds a new position change to the user's timeline.
 *
 * After inserting, automatically syncs profiles.position to the latest effective
 * position for the current calendar month (mandatory for display consistency).
 */
export async function addPositionChange(
  userId: string,
  position: Position,
  effectiveFromYear: number,
  effectiveFromMonth: number,
  client: SupabaseClient = supabase
): Promise<AddPositionChangeResult> {
  // Upsert: if the user already has an entry for this exact month, update it
  const { data, error } = await client
    .from('user_position_history')
    .upsert(
      {
        user_id: userId,
        position,
        effective_from_year: effectiveFromYear,
        effective_from_month: effectiveFromMonth,
      },
      { onConflict: 'user_id,effective_from_year,effective_from_month' }
    )
    .select()
    .single();

  if (error) {
    return { success: false, entry: null, error: error.message };
  }

  // Sync profiles.position to the latest effective position for the current month
  await syncProfilesPosition(userId, client);

  return {
    success: true,
    entry: rowToEntry(data as HistoryRow),
    error: null,
  };
}

/**
 * Updates an existing position history entry (change the position or effective month).
 *
 * After updating, automatically syncs profiles.position.
 */
export async function updatePositionChange(
  id: string,
  userId: string,
  updates: { position?: Position; effectiveFromYear?: number; effectiveFromMonth?: number },
  client: SupabaseClient = supabase
): Promise<AddPositionChangeResult> {
  const updatePayload: Record<string, unknown> = {};
  if (updates.position !== undefined) updatePayload.position = updates.position;
  if (updates.effectiveFromYear !== undefined) updatePayload.effective_from_year = updates.effectiveFromYear;
  if (updates.effectiveFromMonth !== undefined) updatePayload.effective_from_month = updates.effectiveFromMonth;

  const { data, error } = await client
    .from('user_position_history')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, entry: null, error: error.message };
  }

  // Sync profiles.position to the latest effective position for the current month
  await syncProfilesPosition(userId, client);

  return {
    success: true,
    entry: rowToEntry(data as HistoryRow),
    error: null,
  };
}

/**
 * Deletes a position history entry.
 *
 * Guardrail: prevents deleting the earliest (baseline) entry if it's the only one.
 * After deletion, automatically syncs profiles.position.
 */
export async function deletePositionChange(
  id: string,
  userId: string,
  client: SupabaseClient = supabase
): Promise<DeletePositionChangeResult> {
  // Fetch all entries to check if this is the only one
  const { data: allEntries, error: fetchError } = await client
    .from('user_position_history')
    .select('id')
    .eq('user_id', userId);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!allEntries || allEntries.length <= 1) {
    return {
      success: false,
      error: 'Cannot delete the baseline position entry. At least one position history entry is required.',
    };
  }

  const { error } = await client
    .from('user_position_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Sync profiles.position to the latest effective position for the current month
  await syncProfilesPosition(userId, client);

  return { success: true, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// profiles.position sync (mandatory after any timeline change)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Syncs profiles.position to the latest effective position for the current calendar
 * month. Called automatically after every add/update/delete of a timeline entry.
 *
 * This keeps the dashboard, friends feature, and all display components consistent
 * with the timeline without requiring callers to think about it.
 */
export async function syncProfilesPosition(
  userId: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  try {
    const currentPosition = await getUserPositionForMonth(userId, currentYear, currentMonth, client);
    await updateProfile(userId, { position: currentPosition });
  } catch {
    // Non-fatal: if sync fails, the next page load will still use the correct
    // position from the history table. Log for debugging.
    console.warn(`[user-position-history] Failed to sync profiles.position for user ${userId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for UI / recalculation scope
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the list of months (year+month pairs) that have data (flights or
 * calculations) and are affected by a position change at or after the given
 * effective month.
 *
 * Used to scope recalculation: only months >= effective month need recalculation.
 */
export async function getAffectedMonthsFrom(
  userId: string,
  effectiveYear: number,
  effectiveMonth: number,
  client: SupabaseClient = supabase
): Promise<Array<{ month: number; year: number }>> {
  const { data, error } = await client
    .from('monthly_calculations')
    .select('month, year')
    .eq('user_id', userId)
    .or(
      `year.gt.${effectiveYear},and(year.eq.${effectiveYear},month.gte.${effectiveMonth})`
    )
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({ month: row.month, year: row.year }));
}

/**
 * Returns the month immediately before the effective month (for cross-month
 * layover pairing recalculation).
 */
export const getPreviousMonth = (
  year: number,
  month: number
): { month: number; year: number } => {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
};
