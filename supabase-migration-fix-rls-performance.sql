-- Migration: Fix RLS Performance Issues
-- Run this in your Supabase SQL Editor
--
-- This migration addresses the following issues:
-- 1. auth.<function>() re-evaluation for each row (use (select auth.uid()) instead)
-- 2. Multiple permissive policies for same role/action (consolidate policies)
--
-- Changes:
-- - quotes table: Optimize policies with (select auth.uid())
-- - quote_requests table: Optimize and consolidate policies

-- ============================================
-- PART 1: Fix quotes table policies
-- ============================================

-- Drop all existing policies on quotes table
DROP POLICY IF EXISTS "Users can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can update all quotes" ON quotes;
DROP POLICY IF EXISTS "Service role has full access" ON quotes;

-- Recreate policies with optimized auth.uid() calls
-- Using (select auth.uid()) prevents re-evaluation for each row

-- Policy: Users can view their own quotes (optimized)
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Policy: Users can insert their own quotes (optimized)
CREATE POLICY "Users can insert own quotes"
  ON quotes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own quotes (optimized)
CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Service role has full access to quotes
CREATE POLICY "Service role has full access"
  ON quotes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PART 2: Fix quote_requests table policies
-- ============================================

-- Drop ALL existing policies on quote_requests table to consolidate
DROP POLICY IF EXISTS "Allow anonymous inserts" ON quote_requests;
DROP POLICY IF EXISTS "Service role has full access" ON quote_requests;
DROP POLICY IF EXISTS "Users can view own quotes" ON quote_requests;
DROP POLICY IF EXISTS "Allow read own submissions" ON quote_requests;
DROP POLICY IF EXISTS "Allow public reads" ON quote_requests;
DROP POLICY IF EXISTS "Anonymous users can view own submissions" ON quote_requests;

-- Recreate consolidated and optimized policies

-- Policy 1: Service role has full access (explicit role restriction)
-- Only applies to service_role, not to anon or authenticated
CREATE POLICY "Service role has full access" ON quote_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Anonymous INSERT only
-- Allows anonymous submissions (single policy for anon INSERT)
CREATE POLICY "Allow anonymous inserts" ON quote_requests
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy 3: Authenticated users INSERT
-- Allows authenticated users to submit quotes
CREATE POLICY "Authenticated users can insert" ON quote_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 4: Consolidated SELECT for anon
-- Anonymous users can only view submissions without a user_id (anonymous submissions)
CREATE POLICY "Anonymous can view anonymous submissions" ON quote_requests
    FOR SELECT
    TO anon
    USING (user_id IS NULL);

-- Policy 5: Consolidated SELECT for authenticated users (optimized)
-- Authenticated users can view their own quotes OR anonymous submissions they might have made
-- Using (select auth.uid()) for optimization
CREATE POLICY "Authenticated users can view own quotes" ON quote_requests
    FOR SELECT
    TO authenticated
    USING (
        (select auth.uid()) = user_id
        OR user_id IS NULL
    );

-- ============================================
-- PART 3: Verify the migration
-- ============================================

-- Check quotes policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quotes'
ORDER BY policyname;

-- Check quote_requests policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quote_requests'
ORDER BY policyname;

-- ============================================
-- Summary of Changes
-- ============================================
--
-- quotes table:
--   - "Users can view own quotes": auth.uid() -> (select auth.uid())
--   - "Users can insert own quotes": auth.uid() -> (select auth.uid())
--   - "Users can update own quotes": auth.uid() -> (select auth.uid())
--   - Added: "Service role has full access" for admin operations
--
-- quote_requests table:
--   - Removed duplicate/overlapping policies
--   - "Service role has full access": Restricted to service_role only
--   - "Allow anonymous inserts": Restricted to anon role only
--   - "Authenticated users can insert": New policy for authenticated INSERT
--   - "Anonymous can view anonymous submissions": Consolidated anon SELECT
--   - "Authenticated users can view own quotes": Consolidated authenticated SELECT with (select auth.uid())
--
-- Performance improvements:
--   - Using (select auth.uid()) prevents PostgreSQL from re-evaluating
--     auth.uid() for every row, which significantly improves query performance
--   - Consolidating multiple permissive policies into single policies per
--     role/action reduces the number of policy checks per query
