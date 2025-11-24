-- ============================================
-- Update Attachments Bucket for 3D Model Files
-- ============================================
-- This updates the attachments bucket to allow STL, FBX, and OBJ files
-- Run this in your Supabase SQL Editor
-- ============================================

-- Update the bucket to allow 3D model file types
UPDATE storage.buckets
SET
  file_size_limit = 52428800,  -- 50MB limit for 3D models
  allowed_mime_types = ARRAY[
    'application/octet-stream',  -- STL, FBX, OBJ files
    'model/stl',                 -- STL (official MIME type)
    'application/vnd.ms-pki.stl', -- STL (Windows)
    'model/obj',                 -- OBJ (official MIME type)
    'text/plain',                -- OBJ can be text/plain
    'image/jpeg',                -- Images
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',           -- Documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]::text[]
WHERE id = 'attachments';

-- Verify the update
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'attachments';
