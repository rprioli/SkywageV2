/**
 * Flight database operations for Skywage Salary Calculator
 * Handles CRUD operations for flight duties with audit trail
 * Following existing Supabase patterns in the codebase
 */

import { supabase, Database } from '@/lib/supabase';
import { FlightDuty, AuditTrailEntry, ValidationResult } from '@/types/salary-calculator';
import { formatTimeValue, createTimestamp } from '@/lib/salary-calculator';

// Database types
type FlightRow = Database['public']['Tables']['flights']['Row'];
type FlightInsert = Database['public']['Tables']['flights']['Insert'];
type FlightUpdate = Database['public']['Tables']['flights']['Update'];

/**
 * Converts FlightDuty to database insert format
 * Populates both old and new schema columns for backward compatibility
 */
function flightDutyToInsert(flightDuty: FlightDuty, userId: string): FlightInsert {
  const insertData = {
    user_id: userId,
    date: flightDuty.date.toISOString().split('T')[0], // YYYY-MM-DD format

    // Salary calculator schema columns
    flight_numbers: flightDuty.flightNumbers,
    sectors: flightDuty.sectors,
    duty_type: flightDuty.dutyType,
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
 */
function rowToFlightDuty(row: FlightRow): FlightDuty {
  return {
    id: row.id,
    userId: row.user_id,
    date: new Date(row.date),
    flightNumbers: row.flight_numbers,
    sectors: row.sectors,
    dutyType: row.duty_type,
    reportTime: {
      hours: parseInt(row.report_time.split(':')[0]),
      minutes: parseInt(row.report_time.split(':')[1]),
      totalMinutes: parseInt(row.report_time.split(':')[0]) * 60 + parseInt(row.report_time.split(':')[1]),
      totalHours: (parseInt(row.report_time.split(':')[0]) * 60 + parseInt(row.report_time.split(':')[1])) / 60
    },
    debriefTime: {
      hours: parseInt(row.debrief_time.split(':')[0]),
      minutes: parseInt(row.debrief_time.split(':')[1]),
      totalMinutes: parseInt(row.debrief_time.split(':')[0]) * 60 + parseInt(row.debrief_time.split(':')[1]),
      totalHours: (parseInt(row.debrief_time.split(':')[0]) * 60 + parseInt(row.debrief_time.split(':')[1])) / 60
    },
    dutyHours: row.duty_hours,
    flightPay: row.flight_pay,
    isCrossDay: row.is_cross_day || false,
    dataSource: row.data_source || 'csv',
    originalData: row.original_data,
    lastEditedAt: row.last_edited_at ? new Date(row.last_edited_at) : undefined,
    lastEditedBy: row.last_edited_by || undefined,
    month: row.month,
    year: row.year,
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
      console.error('Error creating flight duty:', error);
      return { data: null, error: error.message };
    }

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    console.error('Error creating flight duty:', error);
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
      console.error('Database - Supabase insert error:', error);
      return { data: null, error: error.message };
    }

    const flightDutiesResult = data.map(rowToFlightDuty);
    return { data: flightDutiesResult, error: null };
  } catch (error) {
    console.error('Error creating flight duties:', error);
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
      console.error('Error fetching flight duties:', error);
      return { data: null, error: error.message };
    }

    const flightDuties = data.map(rowToFlightDuty);
    return { data: flightDuties, error: null };
  } catch (error) {
    console.error('Error fetching flight duties:', error);
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
      console.error('Error fetching flight duty:', error);
      return { data: null, error: error.message };
    }

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    console.error('Error fetching flight duty:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Updates a flight duty record
 */
export async function updateFlightDuty(
  flightId: string,
  updates: Partial<FlightDuty>,
  userId: string,
  changeReason?: string
): Promise<{ data: FlightDuty | null; error: string | null }> {
  try {
    // Get current data for audit trail
    const { data: currentData } = await getFlightDutyById(flightId, userId);
    
    // Prepare update data
    const updateData: FlightUpdate = {};
    
    if (updates.date) updateData.date = updates.date.toISOString().split('T')[0];
    if (updates.flightNumbers) updateData.flight_numbers = updates.flightNumbers;
    if (updates.sectors) updateData.sectors = updates.sectors;
    if (updates.dutyType) updateData.duty_type = updates.dutyType;
    if (updates.reportTime) updateData.report_time = formatTimeValue(updates.reportTime);
    if (updates.debriefTime) updateData.debrief_time = formatTimeValue(updates.debriefTime);
    if (updates.dutyHours !== undefined) updateData.duty_hours = updates.dutyHours;
    if (updates.flightPay !== undefined) updateData.flight_pay = updates.flightPay;
    if (updates.isCrossDay !== undefined) updateData.is_cross_day = updates.isCrossDay;
    if (updates.dataSource) updateData.data_source = updates.dataSource;
    if (updates.originalData) updateData.original_data = updates.originalData;
    
    updateData.last_edited_at = new Date().toISOString();
    updateData.last_edited_by = userId;

    const { data, error } = await supabase
      .from('flights')
      .update(updateData)
      .eq('id', flightId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating flight duty:', error);
      return { data: null, error: error.message };
    }

    // Create audit trail entry
    if (currentData) {
      await createAuditTrailEntry({
        flightId,
        userId,
        action: 'updated',
        oldData: currentData,
        newData: rowToFlightDuty(data),
        changeReason
      });
    }

    return { data: rowToFlightDuty(data), error: null };
  } catch (error) {
    console.error('Error updating flight duty:', error);
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
      console.error('Error deleting flight duty:', error);
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
    console.error('Error deleting flight duty:', error);
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
    const { data, error, count } = await supabase
      .from('flights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) {
      console.error('Error checking existing flight data:', error);
      return { exists: false, count: 0, error: error.message };
    }

    return {
      exists: (count || 0) > 0,
      count: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Error checking existing flight data:', error);
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
      console.error('Error deleting flight data by month:', error);
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
    console.error('Error deleting flight data by month:', error);
    return {
      deletedCount: 0,
      error: (error as Error).message
    };
  }
}

/**
 * Creates an audit trail entry
 */
async function createAuditTrailEntry(entry: {
  flightId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted';
  oldData?: any;
  newData?: any;
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
  } catch (error) {
    console.error('Error creating audit trail entry:', error);
    // Don't throw error for audit trail failures
  }
}
