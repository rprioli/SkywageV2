/**
 * Audit trail database operations for Skywage Salary Calculator
 * Handles audit trail tracking for flight duty changes
 * Following existing Supabase patterns in the codebase
 */

import { supabase, Database } from '@/lib/supabase';
import { AuditTrailEntry } from '@/types/salary-calculator';

// Database types
type AuditTrailRow = Database['public']['Tables']['flight_audit_trail']['Row'];
type AuditTrailInsert = Database['public']['Tables']['flight_audit_trail']['Insert'];

/**
 * Converts AuditTrailEntry to database insert format
 */
function auditTrailToInsert(entry: AuditTrailEntry): AuditTrailInsert {
  return {
    flight_id: entry.flightId,
    user_id: entry.userId,
    action: entry.action,
    old_data: entry.oldData,
    new_data: entry.newData,
    change_reason: entry.changeReason
  };
}

/**
 * Converts database row to AuditTrailEntry
 */
function rowToAuditTrailEntry(row: AuditTrailRow): AuditTrailEntry {
  return {
    id: row.id,
    flightId: row.flight_id,
    userId: row.user_id,
    action: row.action,
    oldData: row.old_data as Record<string, unknown> | undefined,
    newData: row.new_data as Record<string, unknown> | undefined,
    changeReason: row.change_reason || undefined,
    createdAt: new Date(row.created_at)
  };
}

/**
 * Creates an audit trail entry
 */
export async function createAuditTrailEntry(
  entry: AuditTrailEntry
): Promise<{ data: AuditTrailEntry | null; error: string | null }> {
  try {
    const insertData = auditTrailToInsert(entry);
    
    const { data, error } = await supabase
      .from('flight_audit_trail')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating audit trail entry:', error);
      return { data: null, error: error.message };
    }

    return { data: rowToAuditTrailEntry(data), error: null };
  } catch (error) {
    console.error('Error creating audit trail entry:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets audit trail entries for a specific flight
 */
export async function getFlightAuditTrail(
  flightId: string,
  userId: string
): Promise<{ data: AuditTrailEntry[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('flight_audit_trail')
      .select('*')
      .eq('flight_id', flightId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flight audit trail:', error);
      return { data: null, error: error.message };
    }

    const auditEntries = data.map(rowToAuditTrailEntry);
    return { data: auditEntries, error: null };
  } catch (error) {
    console.error('Error fetching flight audit trail:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets audit trail entries for a user within a date range
 */
export async function getUserAuditTrail(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<{ data: AuditTrailEntry[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('flight_audit_trail')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user audit trail:', error);
      return { data: null, error: error.message };
    }

    const auditEntries = data.map(rowToAuditTrailEntry);
    return { data: auditEntries, error: null };
  } catch (error) {
    console.error('Error fetching user audit trail:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets audit trail entries for a specific month and year
 */
export async function getMonthlyAuditTrail(
  userId: string,
  month: number,
  year: number
): Promise<{ data: AuditTrailEntry[] | null; error: string | null }> {
  try {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return await getUserAuditTrail(userId, startDate, endDate);
  } catch (error) {
    console.error('Error fetching monthly audit trail:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets audit trail statistics for a user
 */
export async function getAuditTrailStats(
  userId: string,
  month?: number,
  year?: number
): Promise<{ 
  data: {
    totalChanges: number;
    createdCount: number;
    deletedCount: number;
    lastActivity?: Date;
  } | null;
  error: string | null 
}> {
  try {
    let query = supabase
      .from('flight_audit_trail')
      .select('action, created_at')
      .eq('user_id', userId);

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit trail stats:', error);
      return { data: null, error: error.message };
    }

    const stats = {
      totalChanges: data.length,
      createdCount: data.filter(entry => entry.action === 'created').length,
      deletedCount: data.filter(entry => entry.action === 'deleted').length,
      lastActivity: data.length > 0 ? new Date(data[0].created_at) : undefined
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching audit trail stats:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Deletes old audit trail entries (for cleanup)
 */
export async function cleanupAuditTrail(
  userId: string,
  olderThanDays: number = 365
): Promise<{ deletedCount: number; error: string | null }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('flight_audit_trail')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up audit trail:', error);
      return { deletedCount: 0, error: error.message };
    }

    return { deletedCount: data.length, error: null };
  } catch (error) {
    console.error('Error cleaning up audit trail:', error);
    return { deletedCount: 0, error: (error as Error).message };
  }
}

/**
 * Gets recent activity summary for dashboard
 */
export async function getRecentActivity(
  userId: string,
  limit: number = 10
): Promise<{ 
  data: {
    id: string;
    action: 'created' | 'updated' | 'deleted';
    flightId: string;
    changeReason?: string;
    createdAt: Date;
    summary: string;
  }[] | null; 
  error: string | null 
}> {
  try {
    const { data, error } = await supabase
      .from('flight_audit_trail')
      .select('id, flight_id, action, change_reason, created_at, new_data, old_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return { data: null, error: error.message };
    }

    const activities = data.map(entry => {
      let summary = '';
      
      switch (entry.action) {
        case 'created':
          const flightNumbers = entry.new_data?.flightNumbers || [];
          summary = `Created flight duty ${flightNumbers.join(', ')}`;
          break;
        case 'deleted':
          const deletedFlightNumbers = entry.old_data?.flightNumbers || [];
          summary = `Deleted flight duty ${deletedFlightNumbers.join(', ')}`;
          break;
      }

      return {
        id: entry.id,
        action: entry.action,
        flightId: entry.flight_id,
        changeReason: entry.change_reason || undefined,
        createdAt: new Date(entry.created_at),
        summary
      };
    });

    return { data: activities, error: null };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return { data: null, error: (error as Error).message };
  }
}
