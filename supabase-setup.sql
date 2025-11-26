-- Hexea Forge - Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create quote_request table
-- ============================================

CREATE TABLE IF NOT EXISTS quote_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    model_id UUID,
    quote_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    quantity INTEGER NOT NULL,
    material TEXT NOT NULL,
    timeline TEXT,
    finishing TEXT,
    scale INTEGER DEFAULT 100,
    notes TEXT,
    model_data JSONB,
    -- Model file info
    model_file_name TEXT,
    model_file_url TEXT,
    -- Model stats
    vertices INTEGER,
    triangles INTEGER,
    dimensions JSONB,
    -- Pricing breakdown
    base_cost DECIMAL(10,2),
    material_cost DECIMAL(10,2),
    finishing_cost DECIMAL(10,2),
    quantity_discount DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    -- Status and notes
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quote_request_status
    ON quote_request(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id
    ON quote_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_quote_requests_quote_id
    ON quote_requests(quote_id);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status
    ON quote_requests(status);

CREATE INDEX IF NOT EXISTS idx_quote_request_created_at
    ON quote_request(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quote_request_email
    ON quote_request(email);

CREATE INDEX IF NOT EXISTS idx_quote_request_material
    ON quote_request(material);

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE quote_request ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Allow anonymous inserts" ON quote_request;
DROP POLICY IF EXISTS "Service role has full access" ON quote_request;
DROP POLICY IF EXISTS "Allow read own submissions" ON quote_request;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON quote_requests;
DROP POLICY IF EXISTS "Service role has full access" ON quote_requests;
DROP POLICY IF EXISTS "Allow read own submissions" ON quote_requests;
DROP POLICY IF EXISTS "Users can view own quotes" ON quote_requests;
DROP POLICY IF EXISTS "Allow public reads" ON quote_requests;
DROP POLICY IF EXISTS "Anonymous can view anonymous submissions" ON quote_requests;
DROP POLICY IF EXISTS "Authenticated users can insert" ON quote_requests;
DROP POLICY IF EXISTS "Authenticated users can view own quotes" ON quote_requests;

-- ============================================
-- 5. Create RLS Policies (Optimized & Consolidated)
-- ============================================
-- NOTE: Using (select auth.uid()) instead of auth.uid() for performance
-- This prevents PostgreSQL from re-evaluating auth.uid() for each row
--
-- Policies are explicitly assigned to specific roles to avoid
-- multiple permissive policies for the same role/action combination

-- Policy 1: Allow anonymous users to INSERT quotes
-- This allows the React app to submit quotes without authentication
CREATE POLICY "Allow anonymous inserts" ON quote_request
    FOR INSERT
    WITH CHECK (true);

-- Policy 2: Allow service_role full access
-- This allows the WordPress plugin (using service_role key) to manage all quotes
CREATE POLICY "Service role has full access" ON quote_request
-- Policy 1: Allow service_role full access
-- This allows the WordPress plugin (using service_role key) to manage all quotes
-- Explicitly restricted to service_role only
CREATE POLICY "Service role has full access" ON quote_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 3: Allow anyone to SELECT quotes (optional - for public viewing)
-- Remove this if you want quotes to be admin-only
CREATE POLICY "Allow read own submissions" ON quote_request
-- Policy 2: Allow anonymous users to INSERT quotes
-- This allows the React app to submit quotes without authentication
-- Explicitly restricted to anon role only
CREATE POLICY "Allow anonymous inserts" ON quote_requests
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to INSERT quotes
-- Explicitly restricted to authenticated role only
CREATE POLICY "Authenticated users can insert" ON quote_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 4: Allow anonymous users to view anonymous submissions
-- Anonymous users can only see submissions where user_id IS NULL
-- Explicitly restricted to anon role only (single SELECT policy for anon)
CREATE POLICY "Anonymous can view anonymous submissions" ON quote_requests
    FOR SELECT
    TO anon
    USING (user_id IS NULL);

-- Policy 5: Allow authenticated users to view their own quotes
-- Users can see quotes where user_id matches their auth.uid() OR anonymous submissions
-- Using (select auth.uid()) for performance optimization
-- Explicitly restricted to authenticated role only (single SELECT policy for authenticated)
CREATE POLICY "Authenticated users can view own quotes" ON quote_requests
    FOR SELECT
    TO authenticated
    USING (
        (select auth.uid()) = user_id
        OR user_id IS NULL
    );

-- ============================================
-- 6. Storage Bucket Setup
-- ============================================

-- Create attachments bucket (if not exists)
-- Note: This must be done through the Supabase UI or Dashboard
-- Go to Storage -> New Bucket -> Name: "attachments" -> Public: YES

-- Storage policies for attachments bucket
-- Run these after creating the bucket

DO $$
BEGIN
    -- Check if policies exist before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Public read access attachments'
    ) THEN
        CREATE POLICY "Public read access attachments" ON storage.objects
            FOR SELECT
            USING (bucket_id = 'attachments');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Public insert attachments'
    ) THEN
        CREATE POLICY "Public insert attachments" ON storage.objects
            FOR INSERT
            WITH CHECK (bucket_id = 'attachments');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Service role full access attachments'
    ) THEN
        CREATE POLICY "Service role full access attachments" ON storage.objects
            FOR ALL
            TO service_role
            USING (bucket_id = 'attachments')
            WITH CHECK (bucket_id = 'attachments');
    END IF;
END$$;

-- ============================================
-- 7. Verify setup
-- ============================================

-- Check if table exists and has correct structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_request'
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'quote_request';

-- Check if RLS is enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'quote_request';

-- Check policies
SELECT
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'quote_request';

-- ============================================
-- 8. Test data (optional - for testing)
-- ============================================

-- Insert a test quote to verify everything works
INSERT INTO quote_request (
    name,
    email,
    phone,
    company,
    quantity,
    material,
    timeline,
    notes,
    model_data,
    status
) VALUES (
    'Test User',
    'test@example.com',
    '+1234567890',
    'Test Company',
    5,
    'PLA - Affordable',
    'Normal (1-2 weeks)',
    'This is a test quote',
    '{"quoteId":"HF-TEST001","fileName":"test-model.stl","material":"PLA - Affordable","quantity":5,"pricing":{"baseCost":50,"materialCost":75,"finishingCost":0,"quantityDiscount":0,"total":125}}'::jsonb,
    'pending'
);

-- Verify test data was inserted
SELECT
    id,
    name,
    email,
    material,
    quantity,
    status,
    created_at
FROM quote_request
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- Setup Complete!
-- ============================================

-- Next steps:
-- 1. Create the 'attachments' storage bucket in the Supabase UI (if not exists)
-- 2. Configure your React app .env file with Supabase URL and anon key
-- 3. Configure WordPress plugin with Supabase URL and service_role key
-- 4. Test quote submission from the React app
-- 5. Verify quotes appear in WordPress dashboard

-- For troubleshooting:
-- - Check RLS policies: SELECT * FROM pg_policies WHERE tablename = 'quote_request';
-- - View recent quotes: SELECT * FROM quote_request ORDER BY created_at DESC LIMIT 10;
-- - Check storage policies: SELECT * FROM pg_policies WHERE schemaname = 'storage';
