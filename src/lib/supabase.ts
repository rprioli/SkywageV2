import { createClient } from '@supabase/supabase-js';

// These environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use Supabase's default storage which handles SSR properly
    // This eliminates custom cookie parsing issues and hydration mismatches
  },
  global: {
    headers: {
      'X-Client-Info': 'skywage-v2@1.0.0',
    },
  },
  // Add timeout and retry configuration for better reliability
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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
          nationality?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          airline: string;
          position: 'CCM' | 'SCCM';
          nationality?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          airline?: string;
          position?: 'CCM' | 'SCCM';
          nationality?: string;
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
      // Enhanced flights table for salary calculator (includes both old and new schema)
      flights: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          // Old schema columns (for backward compatibility)
          flight_number: string;
          sector: string;
          reporting_time: string;
          debriefing_time: string;
          hours: number;
          pay: number;
          is_outbound?: boolean;
          is_turnaround?: boolean;
          is_layover?: boolean;
          is_asby?: boolean;
          // New schema columns (salary calculator)
          flight_numbers: string[];
          sectors: string[];
          duty_type: 'turnaround' | 'layover' | 'asby' | 'sby' | 'off' | 'business_promotion';
          report_time: string;
          debrief_time: string;
          duty_hours: number;
          flight_pay: number;
          is_cross_day: boolean;
          data_source: 'csv' | 'manual' | 'edited';
          original_data?: any;
          last_edited_at?: string;
          last_edited_by?: string;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          // Old schema columns (for backward compatibility)
          flight_number: string;
          sector: string;
          reporting_time: string;
          debriefing_time: string;
          hours: number;
          pay: number;
          is_outbound?: boolean;
          is_turnaround?: boolean;
          is_layover?: boolean;
          is_asby?: boolean;
          // New schema columns (salary calculator)
          flight_numbers?: string[];
          sectors?: string[];
          duty_type?: 'turnaround' | 'layover' | 'asby' | 'sby' | 'off' | 'business_promotion';
          report_time?: string;
          debrief_time?: string;
          duty_hours?: number;
          flight_pay?: number;
          is_cross_day?: boolean;
          data_source?: 'csv' | 'manual' | 'edited';
          original_data?: any;
          last_edited_at?: string;
          last_edited_by?: string;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          // Old schema columns (for backward compatibility)
          flight_number?: string;
          sector?: string;
          reporting_time?: string;
          debriefing_time?: string;
          hours?: number;
          pay?: number;
          is_outbound?: boolean;
          is_turnaround?: boolean;
          is_layover?: boolean;
          is_asby?: boolean;
          // New schema columns (salary calculator)
          flight_numbers?: string[];
          sectors?: string[];
          duty_type?: 'turnaround' | 'layover' | 'asby' | 'sby' | 'off' | 'business_promotion';
          report_time?: string;
          debrief_time?: string;
          duty_hours?: number;
          flight_pay?: number;
          is_cross_day?: boolean;
          data_source?: 'csv' | 'manual' | 'edited';
          original_data?: any;
          last_edited_at?: string;
          last_edited_by?: string;
          month?: number;
          year?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Flight audit trail table
      flight_audit_trail: {
        Row: {
          id: string;
          flight_id: string;
          user_id: string;
          action: 'created' | 'updated' | 'deleted';
          old_data?: any;
          new_data?: any;
          change_reason?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          flight_id: string;
          user_id: string;
          action: 'created' | 'updated' | 'deleted';
          old_data?: any;
          new_data?: any;
          change_reason?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          flight_id?: string;
          user_id?: string;
          action?: 'created' | 'updated' | 'deleted';
          old_data?: any;
          new_data?: any;
          change_reason?: string;
          created_at?: string;
        };
      };
      // Layover rest periods table
      layover_rest_periods: {
        Row: {
          id: string;
          user_id: string;
          outbound_flight_id: string;
          inbound_flight_id: string;
          rest_start_time: string;
          rest_end_time: string;
          rest_hours: number;
          per_diem_pay: number;
          month: number;
          year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          outbound_flight_id: string;
          inbound_flight_id: string;
          rest_start_time: string;
          rest_end_time: string;
          rest_hours: number;
          per_diem_pay: number;
          month: number;
          year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outbound_flight_id?: string;
          inbound_flight_id?: string;
          rest_start_time?: string;
          rest_end_time?: string;
          rest_hours?: number;
          per_diem_pay?: number;
          month?: number;
          year?: number;
          created_at?: string;
        };
      };
      // Enhanced monthly calculations table
      monthly_calculations: {
        Row: {
          id: string;
          user_id: string;
          month: number;
          year: number;
          basic_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          total_duty_hours: number;
          flight_pay: number;
          total_rest_hours: number;
          per_diem_pay: number;
          asby_count: number;
          asby_pay: number;
          total_fixed: number;
          total_variable: number;
          total_salary: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: number;
          year: number;
          basic_salary: number;
          housing_allowance: number;
          transport_allowance: number;
          total_duty_hours: number;
          flight_pay: number;
          total_rest_hours: number;
          per_diem_pay: number;
          asby_count: number;
          asby_pay: number;
          total_fixed: number;
          total_variable: number;
          total_salary: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: number;
          year?: number;
          basic_salary?: number;
          housing_allowance?: number;
          transport_allowance?: number;
          total_duty_hours?: number;
          flight_pay?: number;
          total_rest_hours?: number;
          per_diem_pay?: number;
          asby_count?: number;
          asby_pay?: number;
          total_fixed?: number;
          total_variable?: number;
          total_salary?: number;
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
