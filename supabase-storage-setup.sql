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

-- Step 1: Create bucket with 3D model file support
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  52428800,  -- 50MB limit for 3D models
  ARRAY[
    'application/octet-stream',  -- STL, FBX, OBJ files
    'model/stl',                 -- STL (official MIME type)
    'application/vnd.ms-pki.stl', -- STL (Windows)
    'model/obj',                 -- OBJ (official MIME type)
    'text/plain',                -- OBJ files and text
    'image/jpeg',                -- Images
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',           -- Documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Verification (run after creation):
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'attachments';
-- ============================================
