-- Check current status constraint
-- Run this in Supabase SQL Editor

-- Step 1: See what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'quotes_status_check';

-- Step 2: See what status values are currently in the database
SELECT DISTINCT status FROM quote_request;

-- Step 3: Drop the old constraint (if it exists)
ALTER TABLE quote_request DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Step 4: Add new constraint with all WordPress plugin statuses
ALTER TABLE quote_request ADD CONSTRAINT quotes_status_check
CHECK (status IN (
    'pending',
    'processing',
    'quoted',
    'approved',
    'in_production',
    'completed',
    'cancelled'
));

-- Step 5: Verify the new constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'quotes_status_check';
