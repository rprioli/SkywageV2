import { createClient } from '@supabase/supabase-js';

// These environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export types for better type safety
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          airline: string;
          position: 'CCM' | 'SCCM';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          airline: string;
          position: 'CCM' | 'SCCM';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          airline?: string;
          position?: 'CCM' | 'SCCM';
          created_at?: string;
          updated_at?: string;
        };
      };
      flights: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          flight_number: string;
          sector: string;
          report_time: string;
          departure_time: string;
          arrival_time: string;
          debriefing_time: string;
          duty_hours: number;
          flight_hours: number;
          pay: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          flight_number: string;
          sector: string;
          report_time: string;
          departure_time: string;
          arrival_time: string;
          debriefing_time: string;
          duty_hours: number;
          flight_hours: number;
          pay: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          flight_number?: string;
          sector?: string;
          report_time?: string;
          departure_time?: string;
          arrival_time?: string;
          debriefing_time?: string;
          duty_hours?: number;
          flight_hours?: number;
          pay?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_calculations: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          year: number;
          basic_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          flight_pay: number;
          layover_pay: number;
          standby_pay: number;
          total_pay: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          year: number;
          basic_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          flight_pay: number;
          layover_pay: number;
          standby_pay: number;
          total_pay: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          year?: number;
          basic_salary?: number;
          housing_allowance?: number;
          transport_allowance?: number;
          flight_pay?: number;
          layover_pay?: number;
          standby_pay?: number;
          total_pay?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          settings: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          settings?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
