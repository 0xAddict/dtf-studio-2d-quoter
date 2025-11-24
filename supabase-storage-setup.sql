-- ============================================
-- Supabase Storage Bucket Setup for Attachments
-- ============================================
-- IMPORTANT: Use the Supabase Dashboard instead!
-- Go to Storage > Create Bucket > Name: "attachments" > Public: ON
-- ============================================
--
-- If you must use SQL, run ONLY the bucket creation first,
-- then add policies through the Supabase Dashboard UI.
--
-- This SQL approach often fails due to RLS conflicts.
-- ============================================

-- Step 1: Create bucket (simplest approach - no MIME type restrictions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification (run after creation):
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'attachments';
-- ============================================
