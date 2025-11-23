-- ============================================
-- Supabase Storage Bucket Setup for Attachments
-- ============================================
-- This SQL script sets up the 'attachments' storage bucket
-- for storing quote request attachments (images, PDFs, documents)
--
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create the attachments storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,  -- Make files publicly accessible via URL
  10485760,  -- 10MB file size limit (adjust as needed)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for Attachments Bucket
-- ============================================

-- Policy 1: Allow anyone to upload files
-- This allows unauthenticated users to upload quote attachments
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'attachments');

-- Policy 2: Allow anyone to view/download files
-- This allows the uploaded files to be accessed via public URLs
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Policy 3: Only allow authenticated users to delete files (optional security)
-- This prevents random users from deleting attachments
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- ============================================
-- Optional: Create a cleanup function for old files
-- ============================================
-- This function can be used to automatically clean up old attachments
-- Run this manually or set up a cron job in Supabase to run it periodically

CREATE OR REPLACE FUNCTION cleanup_old_attachments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete attachments older than 90 days
  DELETE FROM storage.objects
  WHERE bucket_id = 'attachments'
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================
-- Notes:
-- ============================================
-- 1. The bucket is set to PUBLIC, so all uploaded files will be accessible via public URLs
-- 2. File size limit is set to 10MB - adjust the file_size_limit value if needed
-- 3. Allowed MIME types include common image and document formats
-- 4. The cleanup function is optional and should be called manually or via a cron job
--
-- To run the cleanup function manually:
-- SELECT cleanup_old_attachments();
--
-- To check if the bucket was created successfully:
-- SELECT * FROM storage.buckets WHERE id = 'attachments';
--
-- To view storage policies:
-- SELECT * FROM storage.policies WHERE bucket_id = 'attachments';
-- ============================================
