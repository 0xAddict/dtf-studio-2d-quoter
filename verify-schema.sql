-- ============================================
-- Hexea Forge - Schema Verification Queries
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Get complete table schema with all details
-- ============================================
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'quote_request'
ORDER BY ordinal_position;

-- ============================================
-- 2. Check for any foreign key constraints
-- ============================================
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'quote_request';

-- ============================================
-- 3. Check all indexes on the table
-- ============================================
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'quote_request'
ORDER BY indexname;

-- ============================================
-- 4. Get exact column list (simple format)
-- ============================================
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'quote_request'
ORDER BY ordinal_position;

-- ============================================
-- 5. Sample a row to see actual data structure
-- ============================================
SELECT *
FROM quote_request
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- 6. Check if table exists and basic info
-- ============================================
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'quote_request';

-- ============================================
-- 7. Expected schema by WordPress plugin
-- ============================================
-- The plugin expects these columns:
--
-- id (UUID, primary key)
-- user_id (UUID, nullable)
-- model_id (UUID, nullable)
-- name (TEXT, required)
-- email (TEXT, required)
-- phone (TEXT, nullable)
-- company (TEXT, nullable)
-- quantity (INTEGER, required)
-- material (TEXT, required)
-- timeline (TEXT, nullable)
-- notes (TEXT, nullable)
-- model_data (JSONB, nullable)
-- status (TEXT, default 'pending')
-- created_at (TIMESTAMP WITH TIME ZONE, default NOW())
--
-- ============================================

-- ============================================
-- 8. Check if there's an old table name
-- ============================================
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename LIKE '%quote%';

-- ============================================
-- 9. Detailed data type check
-- ============================================
SELECT
    column_name,
    udt_name as data_type_details,
    CASE
        WHEN is_nullable = 'YES' THEN 'NULL'
        ELSE 'NOT NULL'
    END as nullable_status,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'quote_request'
ORDER BY ordinal_position;

-- ============================================
-- 10. Check RLS policies
-- ============================================
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
WHERE schemaname = 'public'
    AND tablename = 'quote_request';
