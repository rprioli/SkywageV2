-- Migration: Add 'business_promotion' duty type to flights table
-- Date: 2025-01-30
-- Description: Updates the duty_type CHECK constraint to include 'business_promotion' duty type

-- Drop the existing constraint
ALTER TABLE flights DROP CONSTRAINT IF EXISTS flights_duty_type_check;

-- Add the new constraint with 'business_promotion' included
ALTER TABLE flights ADD CONSTRAINT flights_duty_type_check 
  CHECK (duty_type IN ('turnaround', 'layover', 'asby', 'recurrent', 'sby', 'off', 'business_promotion'));

-- Update the comment
COMMENT ON COLUMN flights.duty_type IS 'Type of duty: turnaround, layover, asby, recurrent, sby, off, business_promotion';

