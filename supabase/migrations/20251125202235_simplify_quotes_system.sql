/*
  # Simplify Quotes System - Fresh Start

  This migration creates a clean, simple quote system:
  - Single quotes table (no separate quote_requests)
  - No auth required (optional user_id for logged-in users)
  - Minimal RLS (just allow everything for now)
  - All model data preserved
  
  ## Changes
  1. Drop all existing triggers and functions
  2. Drop both quote_requests and quotes tables
  3. Create new simple quotes table
  4. Set permissive RLS (anyone can insert/select)
*/

-- ============================================
-- PART 1: Clean up existing system
-- ============================================

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_sync_quote_request_insert ON quote_requests;
DROP TRIGGER IF EXISTS trigger_sync_quote_request_update ON quote_requests;
DROP TRIGGER IF EXISTS trigger_sync_quote_status ON quote_requests;

-- Drop all functions
DROP FUNCTION IF EXISTS sync_quote_request_to_quotes();
DROP FUNCTION IF EXISTS sync_quote_status_update();

-- Drop both tables (will recreate fresh)
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS quote_requests CASCADE;

-- ============================================
-- PART 2: Create new simple quotes table
-- ============================================

CREATE TABLE quotes (
    -- Primary identifiers
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User info (optional - null for anonymous submissions)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Customer information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_company TEXT,
    
    -- Model file information
    model_file_name TEXT NOT NULL,
    model_file_url TEXT,
    
    -- Quote specifications
    material TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    timeline TEXT NOT NULL,
    finishing TEXT NOT NULL,
    scale INTEGER DEFAULT 100,
    message TEXT,
    
    -- Model statistics
    vertices INTEGER,
    triangles INTEGER,
    dimensions JSONB,
    
    -- Pricing breakdown
    base_cost NUMERIC(10,2),
    material_cost NUMERIC(10,2),
    finishing_cost NUMERIC(10,2),
    quantity_discount NUMERIC(10,2),
    total_cost NUMERIC(10,2),
    
    -- Status and admin fields
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'cancelled')),
    admin_notes TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_quotes_user_id ON quotes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_quotes_quote_id ON quotes(quote_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_email ON quotes(customer_email);

-- ============================================
-- PART 3: Set up simple RLS policies
-- ============================================

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can insert quotes (anon or authenticated)
CREATE POLICY "Anyone can insert quotes"
ON quotes
FOR INSERT
WITH CHECK (true);

-- Policy 2: Anyone can select their own quotes by email (for anon users)
CREATE POLICY "Anyone can view quotes by email"
ON quotes
FOR SELECT
USING (
    customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.uid()
    OR auth.role() = 'anon'
);

-- Policy 3: Users can view their own quotes (for authenticated users)
CREATE POLICY "Users can view own quotes"
ON quotes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 4: Users can update their own quotes (for cancellation)
CREATE POLICY "Users can update own quotes"
ON quotes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Service role has full access (for admin/WordPress)
CREATE POLICY "Service role full access"
ON quotes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);