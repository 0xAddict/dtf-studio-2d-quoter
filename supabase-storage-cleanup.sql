-- ============================================
-- Supabase Storage Cleanup Script
-- ============================================
-- This script removes all storage buckets and their policies
-- Run this in your Supabase SQL Editor to clean up
-- ============================================

-- Drop all policies for storage.objects (affects all buckets)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Delete all objects from buckets (this must be done before deleting buckets)
DELETE FROM storage.objects WHERE bucket_id = 'attachments';
DELETE FROM storage.objects WHERE bucket_id = 'models';
DELETE FROM storage.objects WHERE bucket_id = 'thumbnails';

-- Delete the buckets
DELETE FROM storage.buckets WHERE id = 'attachments';
DELETE FROM storage.buckets WHERE id = 'models';
DELETE FROM storage.buckets WHERE id = 'thumbnails';

-- Drop the cleanup function if it exists
DROP FUNCTION IF EXISTS cleanup_old_attachments();

-- ============================================
-- Verification
-- ============================================
-- After running this, verify everything is deleted:
-- SELECT * FROM storage.buckets;
-- SELECT * FROM storage.objects;
-- ============================================
