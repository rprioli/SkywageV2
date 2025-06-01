-- Skywage Salary Calculator Database Schema
-- Phase 2: Database Schema & Basic Infrastructure
-- Run this script in Supabase SQL Editor

-- =====================================================
-- 1. Enhanced flights table for salary calculator
-- =====================================================

CREATE TABLE IF NOT EXISTS flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  flight_numbers TEXT[] NOT NULL DEFAULT '{}',
  sectors TEXT[] NOT NULL DEFAULT '{}',
  duty_type VARCHAR(20) NOT NULL CHECK (duty_type IN ('turnaround', 'layover', 'asby', 'sby', 'off')),
  report_time TIME NOT NULL,
  debrief_time TIME NOT NULL,
  duty_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  flight_pay DECIMAL(8,2) NOT NULL DEFAULT 0,
  is_cross_day BOOLEAN DEFAULT FALSE,
  data_source VARCHAR(20) DEFAULT 'csv' CHECK (data_source IN ('csv', 'manual', 'edited')),
  original_data JSONB,
  last_edited_at TIMESTAMP,
  last_edited_by UUID REFERENCES auth.users(id),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. Flight audit trail table
-- =====================================================

CREATE TABLE IF NOT EXISTS flight_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL, -- Not FK to allow tracking deleted flights
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  old_data JSONB,
  new_data JSONB,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. Layover rest periods table
-- =====================================================

CREATE TABLE IF NOT EXISTS layover_rest_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  outbound_flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
  inbound_flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
  rest_start_time TIMESTAMP NOT NULL,
  rest_end_time TIMESTAMP NOT NULL,
  rest_hours DECIMAL(5,2) NOT NULL CHECK (rest_hours >= 0),
  per_diem_pay DECIMAL(8,2) NOT NULL DEFAULT 0,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. Enhanced monthly calculations table
-- =====================================================

-- Drop existing monthly_calculations table if it exists (backup data first if needed)
-- DROP TABLE IF EXISTS monthly_calculations;

CREATE TABLE IF NOT EXISTS monthly_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  
  -- Fixed components
  basic_salary DECIMAL(8,2) NOT NULL DEFAULT 0,
  housing_allowance DECIMAL(8,2) NOT NULL DEFAULT 0,
  transport_allowance DECIMAL(8,2) NOT NULL DEFAULT 0,
  
  -- Variable components
  total_duty_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  flight_pay DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_rest_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  per_diem_pay DECIMAL(8,2) NOT NULL DEFAULT 0,
  asby_count INTEGER NOT NULL DEFAULT 0,
  asby_pay DECIMAL(8,2) NOT NULL DEFAULT 0,
  
  -- Totals
  total_fixed DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_variable DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_salary DECIMAL(8,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one calculation per user per month/year
  UNIQUE(user_id, month, year)
);

-- =====================================================
-- 5. Indexes for performance
-- =====================================================

-- Flights table indexes
CREATE INDEX IF NOT EXISTS idx_flights_user_month_year ON flights(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_flights_date ON flights(date);
CREATE INDEX IF NOT EXISTS idx_flights_duty_type ON flights(duty_type);
CREATE INDEX IF NOT EXISTS idx_flights_data_source ON flights(data_source);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_flight_id ON flight_audit_trail(flight_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON flight_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON flight_audit_trail(created_at);

-- Layover rest periods indexes
CREATE INDEX IF NOT EXISTS idx_layover_rest_user_month_year ON layover_rest_periods(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_layover_rest_outbound_flight ON layover_rest_periods(outbound_flight_id);
CREATE INDEX IF NOT EXISTS idx_layover_rest_inbound_flight ON layover_rest_periods(inbound_flight_id);

-- Monthly calculations indexes
CREATE INDEX IF NOT EXISTS idx_monthly_calc_user_id ON monthly_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_calc_year_month ON monthly_calculations(year, month);

-- =====================================================
-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE layover_rest_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_calculations ENABLE ROW LEVEL SECURITY;

-- Flights table policies
CREATE POLICY "Users can only access their own flights" ON flights
  FOR ALL USING (auth.uid() = user_id);

-- Flight audit trail policies
CREATE POLICY "Users can only access their own audit trail" ON flight_audit_trail
  FOR ALL USING (auth.uid() = user_id);

-- Layover rest periods policies
CREATE POLICY "Users can only access their own rest periods" ON layover_rest_periods
  FOR ALL USING (auth.uid() = user_id);

-- Monthly calculations policies
CREATE POLICY "Users can only access their own calculations" ON monthly_calculations
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 7. Triggers for updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for flights table
CREATE TRIGGER update_flights_updated_at 
  BEFORE UPDATE ON flights 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for monthly_calculations table
CREATE TRIGGER update_monthly_calculations_updated_at 
  BEFORE UPDATE ON monthly_calculations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. Comments for documentation
-- =====================================================

COMMENT ON TABLE flights IS 'Flight duties for salary calculation with enhanced schema';
COMMENT ON TABLE flight_audit_trail IS 'Audit trail for tracking changes to flight duties';
COMMENT ON TABLE layover_rest_periods IS 'Rest periods between layover flights for per diem calculation';
COMMENT ON TABLE monthly_calculations IS 'Monthly salary calculations with detailed breakdown';

COMMENT ON COLUMN flights.flight_numbers IS 'Array of flight numbers (multiple for turnarounds)';
COMMENT ON COLUMN flights.sectors IS 'Array of sectors (e.g., ["DXB-CMB", "CMB-DXB"])';
COMMENT ON COLUMN flights.duty_type IS 'Type of duty: turnaround, layover, asby, sby, off';
COMMENT ON COLUMN flights.is_cross_day IS 'Whether debrief time is next day';
COMMENT ON COLUMN flights.data_source IS 'Source of data: csv, manual, edited';
COMMENT ON COLUMN flights.original_data IS 'Original CSV data for audit purposes';

-- =====================================================
-- 9. Sample data validation
-- =====================================================

-- Validate that the schema was created correctly
DO $$
BEGIN
  -- Check if all tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flights') THEN
    RAISE EXCEPTION 'flights table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flight_audit_trail') THEN
    RAISE EXCEPTION 'flight_audit_trail table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'layover_rest_periods') THEN
    RAISE EXCEPTION 'layover_rest_periods table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_calculations') THEN
    RAISE EXCEPTION 'monthly_calculations table was not created';
  END IF;
  
  RAISE NOTICE 'All salary calculator tables created successfully!';
END $$;
