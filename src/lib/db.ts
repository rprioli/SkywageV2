import { supabase, Database } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Profile types
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Flight types
type Flight = Database['public']['Tables']['flights']['Row'];
type FlightInsert = Database['public']['Tables']['flights']['Insert'];
type FlightUpdate = Database['public']['Tables']['flights']['Update'];

// Monthly calculation types
type MonthlyCalculation = Database['public']['Tables']['monthly_calculations']['Row'];
type MonthlyCalculationInsert = Database['public']['Tables']['monthly_calculations']['Insert'];
type MonthlyCalculationUpdate = Database['public']['Tables']['monthly_calculations']['Update'];

// User settings types
type UserSettings = Database['public']['Tables']['user_settings']['Row'];
type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

// Profile functions
export async function getProfile(userId: string): Promise<{ 
  data: Profile | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

export async function createProfile(profile: ProfileInsert): Promise<{ 
  data: Profile | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();
  
  return { data, error };
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<{ 
  data: Profile | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}

// Flight functions
export async function getFlights(userId: string): Promise<{ 
  data: Flight[] | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  return { data, error };
}

export async function getFlightsByMonth(userId: string, month: string, year: number): Promise<{ 
  data: Flight[] | null; 
  error: PostgrestError | null 
}> {
  // Create date range for the month
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0]; // Last day of month
  
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  
  return { data, error };
}

export async function createFlight(flight: FlightInsert): Promise<{ 
  data: Flight | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('flights')
    .insert(flight)
    .select()
    .single();
  
  return { data, error };
}

export async function updateFlight(flightId: string, updates: FlightUpdate): Promise<{ 
  data: Flight | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('flights')
    .update(updates)
    .eq('id', flightId)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteFlight(flightId: string): Promise<{ 
  error: PostgrestError | null 
}> {
  const { error } = await supabase
    .from('flights')
    .delete()
    .eq('id', flightId);
  
  return { error };
}

// Monthly calculation functions
export async function getMonthlyCalculations(userId: string): Promise<{ 
  data: MonthlyCalculation[] | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('monthly_calculations')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  
  return { data, error };
}

export async function getMonthlyCalculation(userId: string, month: string, year: number): Promise<{ 
  data: MonthlyCalculation | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('monthly_calculations')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single();
  
  return { data, error };
}

export async function createMonthlyCalculation(calculation: MonthlyCalculationInsert): Promise<{ 
  data: MonthlyCalculation | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('monthly_calculations')
    .insert(calculation)
    .select()
    .single();
  
  return { data, error };
}

export async function updateMonthlyCalculation(calculationId: string, updates: MonthlyCalculationUpdate): Promise<{ 
  data: MonthlyCalculation | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('monthly_calculations')
    .update(updates)
    .eq('id', calculationId)
    .select()
    .single();
  
  return { data, error };
}

// User settings functions
export async function getUserSettings(userId: string): Promise<{ 
  data: UserSettings | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
}

export async function createUserSettings(settings: UserSettingsInsert): Promise<{ 
  data: UserSettings | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('user_settings')
    .insert(settings)
    .select()
    .single();
  
  return { data, error };
}

export async function updateUserSettings(userId: string, updates: UserSettingsUpdate): Promise<{ 
  data: UserSettings | null; 
  error: PostgrestError | null 
}> {
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  return { data, error };
}
