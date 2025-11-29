/**
 * Monthly calculations database operations for Skywage Salary Calculator
 * Handles CRUD operations for monthly salary calculations and layover rest periods
 * Following existing Supabase patterns in the codebase
 */

import { supabase, Database } from '@/lib/supabase';
import { MonthlyCalculation, LayoverRestPeriod } from '@/types/salary-calculator';

// Database types
type MonthlyCalculationRow = Database['public']['Tables']['monthly_calculations']['Row'];
type MonthlyCalculationInsert = Database['public']['Tables']['monthly_calculations']['Insert'];

type LayoverRestPeriodRow = Database['public']['Tables']['layover_rest_periods']['Row'];
type LayoverRestPeriodInsert = Database['public']['Tables']['layover_rest_periods']['Insert'];

/**
 * Converts MonthlyCalculation to database insert format
 */
function monthlyCalculationToInsert(calculation: MonthlyCalculation, userId: string): MonthlyCalculationInsert {
  return {
    user_id: userId,
    month: calculation.month,
    year: calculation.year,
    basic_salary: calculation.basicSalary,
    housing_allowance: calculation.housingAllowance,
    transport_allowance: calculation.transportAllowance,
    total_duty_hours: calculation.totalDutyHours,
    flight_pay: calculation.flightPay,
    total_rest_hours: calculation.totalRestHours,
    per_diem_pay: calculation.perDiemPay,
    asby_count: calculation.asbyCount,
    asby_pay: calculation.asbyPay,
    total_fixed: calculation.totalFixed,
    total_variable: calculation.totalVariable,
    total_salary: calculation.totalSalary
  };
}

/**
 * Converts database row to MonthlyCalculation
 */
function rowToMonthlyCalculation(row: MonthlyCalculationRow): MonthlyCalculation {
  return {
    id: row.id,
    userId: row.user_id,
    month: row.month,
    year: row.year,
    basicSalary: row.basic_salary,
    housingAllowance: row.housing_allowance,
    transportAllowance: row.transport_allowance,
    totalDutyHours: row.total_duty_hours,
    flightPay: row.flight_pay,
    totalRestHours: row.total_rest_hours,
    perDiemPay: row.per_diem_pay,
    asbyCount: row.asby_count,
    asbyPay: row.asby_pay,
    totalFixed: row.total_fixed,
    totalVariable: row.total_variable,
    totalSalary: row.total_salary,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

/**
 * Converts LayoverRestPeriod to database insert format
 */
function layoverRestPeriodToInsert(restPeriod: LayoverRestPeriod, userId: string): LayoverRestPeriodInsert {
  return {
    user_id: userId,
    outbound_flight_id: restPeriod.outboundFlightId,
    inbound_flight_id: restPeriod.inboundFlightId,
    rest_start_time: restPeriod.restStartTime.toISOString(),
    rest_end_time: restPeriod.restEndTime.toISOString(),
    rest_hours: restPeriod.restHours,
    per_diem_pay: restPeriod.perDiemPay,
    month: restPeriod.month,
    year: restPeriod.year
  };
}

/**
 * Converts database row to LayoverRestPeriod
 */
function rowToLayoverRestPeriod(row: LayoverRestPeriodRow): LayoverRestPeriod {
  return {
    id: row.id,
    userId: row.user_id,
    outboundFlightId: row.outbound_flight_id,
    inboundFlightId: row.inbound_flight_id,
    restStartTime: new Date(row.rest_start_time),
    restEndTime: new Date(row.rest_end_time),
    restHours: row.rest_hours,
    perDiemPay: row.per_diem_pay,
    month: row.month,
    year: row.year,
    createdAt: new Date(row.created_at)
  };
}

/**
 * Creates or updates a monthly calculation
 */
export async function upsertMonthlyCalculation(
  calculation: MonthlyCalculation,
  userId: string
): Promise<{ data: MonthlyCalculation | null; error: string | null }> {
  try {
    if (!calculation) {
      return { data: null, error: 'Calculation data is missing' };
    }

    if (!calculation.month || !calculation.year) {
      return { data: null, error: 'Calculation missing required month/year data' };
    }

    const insertData = monthlyCalculationToInsert(calculation, userId);
    
    const { data, error } = await supabase
      .from('monthly_calculations')
      .upsert(insertData, {
        onConflict: 'user_id,month,year'
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: rowToMonthlyCalculation(data), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets monthly calculation for a specific month and year
 */
export async function getMonthlyCalculation(
  userId: string,
  month: number,
  year: number
): Promise<{ data: MonthlyCalculation | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('monthly_calculations')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return { data: null, error: null };
      }
      console.error('Error fetching monthly calculation:', error);
      return { data: null, error: error.message };
    }

    return { data: rowToMonthlyCalculation(data), error: null };
  } catch (error) {
    console.error('Error fetching monthly calculation:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets all monthly calculations for a user
 */
export async function getAllMonthlyCalculations(
  userId: string
): Promise<{ data: MonthlyCalculation[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('monthly_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching monthly calculations:', error);
      return { data: null, error: error.message };
    }

    const calculations = data.map(rowToMonthlyCalculation);
    return { data: calculations, error: null };
  } catch (error) {
    console.error('Error fetching monthly calculations:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Creates layover rest periods
 */
export async function createLayoverRestPeriods(
  restPeriods: LayoverRestPeriod[],
  userId: string
): Promise<{ data: LayoverRestPeriod[] | null; error: string | null }> {
  try {
    // Validate that all rest periods have valid flight IDs
    const invalidPeriods = restPeriods.filter(period =>
      !period.outboundFlightId || !period.inboundFlightId
    );

    if (invalidPeriods.length > 0) {
      console.error('Invalid layover rest periods found:', invalidPeriods.length, 'periods');
      return {
        data: null,
        error: `${invalidPeriods.length} layover rest periods have missing flight IDs`
      };
    }

    const insertData = restPeriods.map(period => layoverRestPeriodToInsert(period, userId));



    const { data, error } = await supabase
      .from('layover_rest_periods')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error creating layover rest periods:', error);



      // Provide more specific error information
      if (error.code === '23503') {
        return { data: null, error: 'Foreign key constraint violation: Referenced flight IDs do not exist in the flights table' };
      }

      return { data: null, error: error.message };
    }

    const restPeriodsResult = data.map(rowToLayoverRestPeriod);
    return { data: restPeriodsResult, error: null };
  } catch (error) {
    console.error('Error creating layover rest periods:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Gets layover rest periods for a specific month and year
 */
export async function getLayoverRestPeriods(
  userId: string,
  month: number,
  year: number
): Promise<{ data: LayoverRestPeriod[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('layover_rest_periods')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .order('rest_start_time', { ascending: true });

    if (error) {
      console.error('Error fetching layover rest periods:', error);
      return { data: null, error: error.message };
    }

    const restPeriods = data.map(rowToLayoverRestPeriod);
    return { data: restPeriods, error: null };
  } catch (error) {
    console.error('Error fetching layover rest periods:', error);
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Deletes all layover rest periods for a specific month and year
 */
export async function deleteLayoverRestPeriods(
  userId: string,
  month: number,
  year: number
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('layover_rest_periods')
      .delete()
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) {
      console.error('Error deleting layover rest periods:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting layover rest periods:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Deletes monthly calculation for a specific month and year
 */
export async function deleteMonthlyCalculation(
  userId: string,
  month: number,
  year: number
): Promise<{ deleted: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('monthly_calculations')
      .delete()
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year);

    if (error) {
      console.error('Error deleting monthly calculation:', error);
      return { deleted: false, error: error.message };
    }

    return { deleted: true, error: null };
  } catch (error) {
    console.error('Error deleting monthly calculation:', error);
    return { deleted: false, error: (error as Error).message };
  }
}

/**
 * Gets calculation summary for multiple months
 */
export async function getCalculationSummary(
  userId: string,
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): Promise<{ data: MonthlyCalculation[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('monthly_calculations')
      .select('*')
      .eq('user_id', userId)
      .gte('year', startYear)
      .lte('year', endYear)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (error) {
      console.error('Error fetching calculation summary:', error);
      return { data: null, error: error.message };
    }

    // Filter by month range if within the same year
    let filteredData = data;
    if (startYear === endYear) {
      filteredData = data.filter(calc =>
        calc.month >= startMonth && calc.month <= endMonth
      );
    } else {
      filteredData = data.filter(calc =>
        (calc.year === startYear && calc.month >= startMonth) ||
        (calc.year === endYear && calc.month <= endMonth) ||
        (calc.year > startYear && calc.year < endYear)
      );
    }

    const calculations = filteredData.map(rowToMonthlyCalculation);
    return { data: calculations, error: null };
  } catch (error) {
    console.error('Error fetching calculation summary:', error);
    return { data: null, error: (error as Error).message };
  }
}
