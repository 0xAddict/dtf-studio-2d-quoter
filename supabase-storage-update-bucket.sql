-- ============================================
-- Update Attachments Bucket for 3D Model Files
-- ============================================
-- This updates the attachments bucket to allow STL, FBX, and OBJ files
-- Run this in your Supabase SQL Editor
-- ============================================

-- Update the bucket to allow 3D model file types
UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = '{"application/octet-stream","model/stl","application/vnd.ms-pki.stl","model/obj","text/plain","image/jpeg","image/png","image/gif","image/webp","image/svg+xml","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'::text[]
WHERE id = 'attachments';

-- Verify the update
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'attachments';
