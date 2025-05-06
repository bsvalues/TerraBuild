-- Migration: Rename marshall_swift_factor to cost_factor
-- Date: April 30, 2025

-- Step 1: Rename the table
ALTER TABLE IF EXISTS marshall_swift_factor RENAME TO cost_factor;

-- Step 2: Create a backward compatibility view to minimize disruption
CREATE OR REPLACE VIEW marshall_swift_factor AS
SELECT * FROM cost_factor;

-- Step 3: Update sequence name if it exists (optional, depends on your setup)
-- ALTER SEQUENCE marshall_swift_factor_id_seq RENAME TO cost_factor_id_seq;

-- Step 4: Rename any constraints and indexes as needed
-- Note: This is a simplified migration. In a production environment, 
-- you would want to explicitly identify and rename all constraints and indexes.

-- Uncomment and adjust these lines based on your actual database schema
-- ALTER INDEX marshall_swift_factor_pkey RENAME TO cost_factor_pkey;
-- ALTER INDEX idx_marshall_swift_year RENAME TO idx_cost_factor_year;