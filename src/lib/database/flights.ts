/**
 * Flight database operations for Skywage Salary Calculator
 * Handles CRUD operations for flight duties with audit trail
 * Following existing Supabase patterns in the codebase
 */

import { supabase, Database } from '@/lib/supabase';
import { FlightDuty } from '@/types/salary-calculator';
import { formatTimeValue, parseTimeString } from '@/lib/salary-calculator';

// Database types
type FlightRow = Database['public']['Tables']['flights']['Row'];
type FlightInsert = Database['public']['Tables']['flights']['Insert'];

/**
 * Converts FlightDuty to database insert format
 * Populates both old and new schema columns for backward compatibility
 */
function flightDutyToInsert(flightDuty: FlightDuty, userId: string): FlightInsert {
  // Note: duty_type is cast to the database type which may be updated via migration
  // to include new types like 'rest' and 'annual_leave'
  const insertData: FlightInsert = {
    user_id: userId,
    date: flightDuty.date.toISOString().split('T')[0], // YYYY-MM-DD format
    // Old schema columns (for backward compatibility)
    flight_number: flightDuty.flightNumbers[0] || '',
    sector: flightDuty.sectors.join(' - '),
    reporting_time: formatTimeValue(flightDuty.reportTime),
    debriefing_time: formatTimeValue(flightDuty.debriefTime),
    hours: flightDuty.dutyHours,
    pay: flightDuty.flightPay,
    // New schema columns (salary calculator)
    flight_numbers: flightDuty.flightNumbers,
    sectors: flightDuty.sectors,
    duty_type: flightDuty.dutyType as FlightInsert['duty_type'],
    report_time: formatTimeValue(flightDuty.reportTime),
    debrief_time: formatTimeValue(flightDuty.debriefTime),
    duty_hours: flightDuty.dutyHours,
    flight_pay: flightDuty.flightPay,
    is_cross_day: flightDuty.isCrossDay,
    data_source: flightDuty.dataSource,
    original_data: flightDuty.originalData,
    last_edited_at: flightDuty.lastEditedAt?.toISOString(),
    last_edited_by: flightDuty.lastEditedBy,
    month: flightDuty.month,
    year: flightDuty.year
  };

  return insertData;
}

/**
 * Converts database row to FlightDuty
 * Handles both old and new schema columns
 * Prefers new schema columns when available, falls back to old schema
 */
export function rowToFlightDuty(row: FlightRow): FlightDuty {
  // Prefer new schema columns, fall back to old schema
  const flightNumbers = row.flight_numbers && row.flight_numbers.length > 0
    ? row.flight_numbers
    : [row.flight_number];

  const sectors = row.sectors && row.sectors.length > 0
    ? row.sectors
    : (row.sector ? row.sector.split(' - ') : []);

  const dutyType = row.duty_type || 'turnaround';

  // Get time strings, preferring new schema columns
  const reportTimeStr = row.report_time || row.reporting_time || '';
  const debriefTimeStr = row.debrief_time || row.debriefing_time || '';

  // Parse times with fallback for invalid formats
  let reportTime = parseTimeString(reportTimeStr);
  let debriefTime = parseTimeString(debriefTimeStr);

  // If parsing fails, create a default time value
  if (!reportTime.success || !reportTime.timeValue) {
    reportTime = {
      success: true,
      timeValue: { hours: 0, minutes: 0, totalMinutes: 0, totalHours: 0 },
      isCrossDay: false
    };
  }

  if (!debriefTime.success || !debriefTime.timeValue) {
    debriefTime = {
      success: true,
      timeValue: { hours: 0, minutes: 0, totalMinutes: 0, totalHours: 0 },
      isCrossDay: false
    };
  }

  return {
    id: row.id,
    userId: row.user_id,
    date: new Date(row.date),
    flightNumbers,
    sectors,
    dutyType,
    reportTime: reportTime.timeValue!,
    debriefTime: debriefTime.timeValue!,
    dutyHours: row.duty_hours ?? row.hours,
    flightPay: row.flight_pay ?? row.pay,
    isCrossDay: row.is_cross_day ?? false,
    dataSource: row.data_source ?? 'csv',
    originalData: row.original_data as Record<string, unknown> | undefined,
    lastEditedAt: row.last_edited_at ? new Date(row.last_edited_at) : undefined,
    lastEditedBy: row.last_edited_by,
    month: row.month ?? new Date(row.date).getMonth() + 1,
    year: row.year ?? new Date(row.date).getFullYear(),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

/**
 * Creates a new flight duty record
 */
export async function createFlightDuty(
  flightDuty: FlightDuty,
  userId: string
): Promise<{ data: FlightDuty | null; error: string | null }> {
  try {
    const insertData = flightDutyToInsert(flightDuty, userId);
    
    const { data, error } = await supabase
      .from('flights')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Creates multiple flight duty records in a transaction
 */
export async function createFlightDuties(
  flightDuties: FlightDuty[],
  userId: string
): Promise<{ data: FlightDuty[] | null; error: string | null }> {
  try {
    const insertData = flightDuties.map(duty => flightDutyToInsert(duty, userId));
    const { data, error } = await supabase
      .from('flights')
      .insert(insertData)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    const flightDutiesResult = data.map(rowToFlightDuty);
    return { data: flightDutiesResult, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets flight duties for a specific month and year
 */
export async function getFlightDutiesByMonth(
  userId: string,
  month: number,
  year: number
): Promise<{ data: FlightDuty[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Convert rows to FlightDuty, filtering out any that fail conversion
    const flightDuties: FlightDuty[] = [];
    for (const row of data) {
      try {
        flightDuties.push(rowToFlightDuty(row));
      } catch {
        // Skip this row and continue with others
      }
    }

    return { data: flightDuties, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets flight duties for a month with a lookahead window into the next month
 * Used for cross-month layover pairing (e.g., outbound on Dec 31, inbound on Jan 2)
 */
export async function getFlightDutiesByMonthWithLookahead(
  userId: string,
  month: number,
  year: number,
  lookaheadDays: number = 3
): Promise<{ data: FlightDuty[] | null; error: string | null }> {
  try {
    // Calculate month start and end dates in UTC
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0)); // Last day of the month
    
    // Add lookahead days to month end
    const lookaheadEnd = new Date(monthEnd);
    lookaheadEnd.setUTCDate(lookaheadEnd.getUTCDate() + lookaheadDays);
    
    // Format as YYYY-MM-DD for database query
    const startDateStr = monthStart.toISOString().split('T')[0];
    const endDateStr = lookaheadEnd.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Convert rows to FlightDuty, filtering out any that fail conversion
    const flightDuties: FlightDuty[] = [];
    for (const row of data) {
      try {
        flightDuties.push(rowToFlightDuty(row));
      } catch {
        // Skip this row and continue with others
      }
    }

    return { data: flightDuties, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets all flight duties for a specific year
 */
export async function getFlightDutiesByYear(
  userId: string,
  year: number
): Promise<{ data: FlightDuty[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Convert rows to FlightDuty, filtering out any that fail conversion
    const flightDuties: FlightDuty[] = [];
    for (const row of data) {
      try {
        flightDuties.push(rowToFlightDuty(row));
      } catch {
        // Skip this row and continue with others
      }
    }

    return { data: flightDuties, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets a specific flight duty by ID
 */
export async function getFlightDutyById(
  flightId: string,
  userId: string
): Promise<{ data: FlightDuty | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', flightId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}



/**
 * Updates flight duty times and recalculates dependent values
 * Preserves original data on first edit
 */
export async function updateFlightDuty(
  flightId: string,
  updates: {
    reportTime: { hours: number; minutes: number; totalMinutes: number; totalHours: number };
    debriefTime: { hours: number; minutes: number; totalMinutes: number; totalHours: number };
    dutyHours: number;
    flightPay: number;
    isCrossDay: boolean;
  },
  userId: string,
  changeReason?: string
): Promise<{ data: FlightDuty | null; error: string | null }> {
  try {
    // Get current data for audit trail and original data preservation
    const { data: currentData, error: fetchError } = await getFlightDutyById(flightId, userId);

    if (fetchError || !currentData) {
      return { data: null, error: fetchError || 'Flight duty not found' };
    }

    // Preserve original data on first edit (if not already edited)
    const originalData = currentData.dataSource === 'edited'
      ? currentData.originalData // Keep existing original data
      : { // Store current data as original
          reportTime: currentData.reportTime,
          debriefTime: currentData.debriefTime,
          dutyHours: currentData.dutyHours,
          flightPay: currentData.flightPay,
          isCrossDay: currentData.isCrossDay,
          dataSource: currentData.dataSource
        };

    // Format times for database
    const reportTimeStr = formatTimeValue(updates.reportTime);
    const debriefTimeStr = formatTimeValue(updates.debriefTime);

    // Update database with both old and new schema columns
    const { data, error } = await supabase
      .from('flights')
      .update({
        // Old schema columns (for backward compatibility)
        reporting_time: reportTimeStr,
        debriefing_time: debriefTimeStr,
        hours: updates.dutyHours,
        pay: updates.flightPay,
        // New schema columns
        report_time: reportTimeStr,
        debrief_time: debriefTimeStr,
        duty_hours: updates.dutyHours,
        flight_pay: updates.flightPay,
        is_cross_day: updates.isCrossDay,
        data_source: 'edited',
        original_data: originalData,
        last_edited_at: new Date().toISOString(),
        last_edited_by: userId
      })
      .eq('id', flightId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Create audit trail entry
    await createAuditTrailEntry({
      flightId,
      userId,
      action: 'updated',
      oldData: currentData,
      newData: rowToFlightDuty(data),
      changeReason
    });

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Reverts a flight duty to its original values
 * Only works if the flight has been edited and has original data
 */
export async function revertFlightDuty(
  flightId: string,
  userId: string,
  changeReason?: string
): Promise<{ data: FlightDuty | null; error: string | null }> {
  try {
    // Get current data
    const { data: currentData, error: fetchError } = await getFlightDutyById(flightId, userId);

    if (fetchError || !currentData) {
      return { data: null, error: fetchError || 'Flight duty not found' };
    }

    // Check if flight has been edited and has original data
    if (currentData.dataSource !== 'edited' || !currentData.originalData) {
      return { data: null, error: 'Flight duty has not been edited or has no original data' };
    }

    const original = currentData.originalData as {
      reportTime: { hours: number; minutes: number; totalMinutes: number; totalHours: number };
      debriefTime: { hours: number; minutes: number; totalMinutes: number; totalHours: number };
      dutyHours: number;
      flightPay: number;
      isCrossDay: boolean;
      dataSource: 'csv' | 'manual' | 'edited';
    };

    // Format times for database
    const reportTimeStr = formatTimeValue(original.reportTime);
    const debriefTimeStr = formatTimeValue(original.debriefTime);

    // Restore original values
    const { data, error } = await supabase
      .from('flights')
      .update({
        // Old schema columns (for backward compatibility)
        reporting_time: reportTimeStr,
        debriefing_time: debriefTimeStr,
        hours: original.dutyHours,
        pay: original.flightPay,
        // New schema columns
        report_time: reportTimeStr,
        debrief_time: debriefTimeStr,
        duty_hours: original.dutyHours,
        flight_pay: original.flightPay,
        is_cross_day: original.isCrossDay,
        data_source: original.dataSource,
        original_data: null, // Clear original data since we're reverting
        last_edited_at: null,
        last_edited_by: null
      })
      .eq('id', flightId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Create audit trail entry (using 'updated' action since 'reverted' is not in DB constraint)
    await createAuditTrailEntry({
      flightId,
      userId,
      action: 'updated',
      oldData: currentData,
      newData: rowToFlightDuty(data),
      changeReason: changeReason || 'Reverted to original values'
    });

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Deletes a flight duty record
 */
export async function deleteFlightDuty(
  flightId: string,
  userId: string,
  changeReason?: string
): Promise<{ error: string | null }> {
  try {
    // Get current data for audit trail
    const { data: currentData } = await getFlightDutyById(flightId, userId);

    const { error } = await supabase
      .from('flights')
      .delete()
      .eq('id', flightId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    // Create audit trail entry
    if (currentData) {
      await createAuditTrailEntry({
        flightId,
        userId,
        action: 'deleted',
        oldData: currentData,
        changeReason
      });
    }

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Checks if flight data exists for a specific month and year
 */
export async function checkExistingFlightData(
  userId: string,
  month: number,
  year: number
): Promise<{ exists: boolean; count: number; error: string | null }> {
  try {
    const { error, count } = await supabase
      .from('flights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) {
      return { exists: false, count: 0, error: error.message };
    }

    return {
      exists: (count || 0) > 0,
      count: count || 0,
      error: null
    };
  } catch (error) {
    return {
      exists: false,
      count: 0,
      error: (error as Error).message
    };
  }
}

/**
 * Deletes all flight data for a specific month and year
 */
export async function deleteFlightDataByMonth(
  userId: string,
  month: number,
  year: number,
  changeReason?: string
): Promise<{ deletedCount: number; error: string | null }> {
  try {
    // First get all flights for audit trail
    const { data: existingFlights } = await supabase
      .from('flights')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    // Delete all flights for the month
    const { data, error } = await supabase
      .from('flights')
      .delete()
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .select('id');

    if (error) {
      return { deletedCount: 0, error: error.message };
    }

    // Create audit trail entries for deleted flights
    if (existingFlights && existingFlights.length > 0) {
      const auditPromises = existingFlights.map(flight =>
        createAuditTrailEntry({
          flightId: flight.id,
          userId,
          action: 'deleted',
          oldData: rowToFlightDuty(flight),
          changeReason: changeReason || `Monthly roster replacement - ${month}/${year}`
        })
      );

      await Promise.all(auditPromises);
    }

    return {
      deletedCount: data?.length || 0,
      error: null
    };
  } catch (error) {
    return {
      deletedCount: 0,
      error: (error as Error).message
    };
  }
}

/**
 * Updates computed flight duty values (duty hours and flight pay) without marking as user-edited
 * Used for system recalculations (e.g., fixing BP duty calculations)
 */
export async function updateFlightDutyComputedValues(
  flightId: string,
  updates: {
    dutyHours: number;
    flightPay: number;
  },
  userId: string,
  changeReason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get current data for audit trail
    const { data: currentData, error: fetchError } = await getFlightDutyById(flightId, userId);

    if (fetchError || !currentData) {
      return { success: false, error: fetchError || 'Flight duty not found' };
    }

    // Update database with both old and new schema columns
    // Do NOT change data_source or original_data - this is a system recalculation
    const { error } = await supabase
      .from('flights')
      .update({
        // Old schema columns (for backward compatibility)
        hours: updates.dutyHours,
        pay: updates.flightPay,
        // New schema columns
        duty_hours: updates.dutyHours,
        flight_pay: updates.flightPay
      })
      .eq('id', flightId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Create audit trail entry for system recalculation
    await createAuditTrailEntry({
      flightId,
      userId,
      action: 'updated',
      oldData: { dutyHours: currentData.dutyHours, flightPay: currentData.flightPay },
      newData: updates,
      changeReason: changeReason || 'System recalculation'
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Creates an audit trail entry
 */
async function createAuditTrailEntry(entry: {
  flightId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted';
  oldData?: unknown;
  newData?: unknown;
  changeReason?: string;
}): Promise<void> {
  try {
    await supabase
      .from('flight_audit_trail')
      .insert({
        flight_id: entry.flightId,
        user_id: entry.userId,
        action: entry.action,
        old_data: entry.oldData,
        new_data: entry.newData,
        change_reason: entry.changeReason
      });
  } catch {
    // Don't throw error for audit trail failures
  }
}
