-- Migration: Add missing columns to quote_requests table
-- Run this in your Supabase SQL Editor to add columns needed for My Quotes area

-- Add quote_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'quote_id'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN quote_id TEXT UNIQUE;
    END IF;
END $$;

-- Add finishing column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'finishing'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN finishing TEXT;
    END IF;
END $$;

-- Add scale column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'scale'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN scale INTEGER DEFAULT 100;
    END IF;
END $$;

-- Add model_file_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'model_file_name'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN model_file_name TEXT;
    END IF;
END $$;

-- Add model_file_url column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'model_file_url'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN model_file_url TEXT;
    END IF;
END $$;

-- Add vertices column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'vertices'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN vertices INTEGER;
    END IF;
END $$;

-- Add triangles column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'triangles'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN triangles INTEGER;
    END IF;
END $$;

-- Add dimensions column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'dimensions'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN dimensions JSONB;
    END IF;
END $$;

-- Add base_cost column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'base_cost'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN base_cost DECIMAL(10,2);
    END IF;
END $$;

-- Add material_cost column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'material_cost'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN material_cost DECIMAL(10,2);
    END IF;
END $$;

-- Add finishing_cost column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'finishing_cost'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN finishing_cost DECIMAL(10,2);
    END IF;
END $$;

-- Add quantity_discount column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'quantity_discount'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN quantity_discount DECIMAL(10,2);
    END IF;
END $$;

-- Add total_cost column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'total_cost'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN total_cost DECIMAL(10,2);
    END IF;
END $$;

-- Add admin_notes column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quote_requests' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE quote_requests ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_quote_id ON quote_requests(quote_id);

-- Add RLS policy for authenticated users to view their own quotes
-- Using (select auth.uid()) for performance optimization (prevents re-evaluation per row)
-- NOTE: This policy is now replaced by the consolidated policy in supabase-setup.sql
-- The new consolidated policy is "Authenticated users can view own quotes"
DROP POLICY IF EXISTS "Users can view own quotes" ON quote_requests;
DROP POLICY IF EXISTS "Authenticated users can view own quotes" ON quote_requests;
CREATE POLICY "Authenticated users can view own quotes" ON quote_requests
    FOR SELECT
    TO authenticated
    USING (
        (select auth.uid()) = user_id
        OR user_id IS NULL
    );

-- Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_requests'
ORDER BY ordinal_position;
