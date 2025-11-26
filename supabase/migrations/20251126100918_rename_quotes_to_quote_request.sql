/*
  # Rename quotes table to quote_request for WordPress plugin compatibility
  
  This migration:
  1. Renames the existing quotes table to quote_request (singular)
  2. Sets up proper RLS policies for authenticated users
  3. Ensures WordPress plugin can access via service_role
  
  ## Changes
  - Rename table: quotes → quote_request
  - Update foreign key references
  - Drop old policies
  - Create new policies with proper authentication checks
  
  ## Security
  - INSERT: Authenticated users only (must provide user_id matching auth.uid())
  - SELECT: Users can only see their own quotes
  - UPDATE: Users can only update their own quotes
  - Service role: Full access for WordPress admin
*/

-- Step 1: Rename the table
ALTER TABLE IF EXISTS quotes RENAME TO quote_request;

-- Step 2: Drop all existing policies on the renamed table
DROP POLICY IF EXISTS "Anyone can insert quotes" ON quote_request;
DROP POLICY IF EXISTS "Service role full access" ON quote_request;
DROP POLICY IF EXISTS "Users can update own quotes" ON quote_request;
DROP POLICY IF EXISTS "View own quotes or service role" ON quote_request;

-- Step 3: Ensure RLS is enabled
ALTER TABLE quote_request ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new RLS policies

-- Policy 1: Authenticated users can INSERT their own quotes
-- IMPORTANT: user_id must match auth.uid()
CREATE POLICY "Authenticated users can insert own quotes"
ON quote_request
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can SELECT only their own quotes
CREATE POLICY "Users can view own quotes"
ON quote_request
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 3: Users can UPDATE only their own quotes
CREATE POLICY "Users can update own quotes"
ON quote_request
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Service role has full access (for WordPress plugin)
CREATE POLICY "Service role full access"
ON quote_request
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_request_user_id ON quote_request(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_request_quote_id ON quote_request(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_request_created_at ON quote_request(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_request_status ON quote_request(status);

-- Step 6: Add comment to table
COMMENT ON TABLE quote_request IS 'Quote requests from authenticated users. WordPress plugin reads from this table using service_role access.';