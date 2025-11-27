-- Migration: Add rest and annual_leave duty types
-- Description: Updates the duty_type CHECK constraint to include 'rest' and 'annual_leave' duty types

-- Drop existing constraint
ALTER TABLE flights DROP CONSTRAINT IF EXISTS flights_duty_type_check;

-- Add updated constraint with new duty types
ALTER TABLE flights ADD CONSTRAINT flights_duty_type_check 
  CHECK (duty_type IN ('turnaround', 'layover', 'asby', 'recurrent', 'sby', 'off', 'business_promotion', 'rest', 'annual_leave'));

