/*
  # Add archived status to quote requests

  1. Changes
    - Add 'archived' as a valid status option to quote_request table
    - This allows users to hide completed/cancelled quotes from their view
    - Archived quotes remain in the database but are filtered from default views
  
  2. Security
    - No RLS changes needed - existing policies cover archived status
    - Users can only archive their own quotes (enforced by existing RLS)
*/

-- Add 'archived' to the status check constraint
DO $$
BEGIN
  -- Drop the existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quote_request_status_check' 
    AND table_name = 'quote_request'
  ) THEN
    ALTER TABLE quote_request DROP CONSTRAINT quote_request_status_check;
  END IF;
  
  -- Add the new constraint with 'archived' included
  ALTER TABLE quote_request ADD CONSTRAINT quote_request_status_check 
    CHECK (status IN ('pending', 'processing', 'reviewed', 'accepted', 'rejected', 'cancelled', 'archived'));
END $$;
