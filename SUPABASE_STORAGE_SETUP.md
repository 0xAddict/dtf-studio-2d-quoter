# Supabase Storage Setup Guide

This guide explains how to set up the storage bucket for file attachments in quote requests.

## 📋 What You Need

A storage bucket named `attachments` that accepts:
- **3D Model Files**: STL, FBX, OBJ
- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word docs, text files
- **File Size Limit**: 50MB

---

## 🎯 Option 1: Dashboard (Recommended - No Errors!)

**This is the easiest method and prevents SQL errors:**

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure:
   - **Name**: `attachments`
   - **Public bucket**: Toggle **ON**
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: Add these one by one:
     - `application/octet-stream`
     - `model/stl`
     - `application/vnd.ms-pki.stl`
     - `model/obj`
     - `text/plain`
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/svg+xml`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
5. Click **"Create bucket"**
6. Go to the bucket's **Policies** tab
7. Click **"New policy"** → Select **"Allow public access"** template
8. Done! ✅

---

## 🔧 Option 2: SQL Scripts

### If Bucket Doesn't Exist Yet

Run `supabase-storage-setup.sql` in your Supabase SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  52428800,
  ARRAY[
    'application/octet-stream',
    'model/stl',
    'application/vnd.ms-pki.stl',
    'model/obj',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;
```

### If Bucket Already Exists

Run `supabase-storage-update-bucket.sql` to update it:

```sql
UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[...]::text[]
WHERE id = 'attachments';
```

---

## 🧹 Clean Up (If Needed)

If you need to start fresh, run `supabase-storage-cleanup.sql`:

```sql
-- Deletes all buckets and policies
DELETE FROM storage.objects WHERE bucket_id IN ('attachments', 'models', 'thumbnails');
DELETE FROM storage.buckets WHERE id IN ('attachments', 'models', 'thumbnails');
```

---

## ✅ Verify Setup

Run this query in Supabase SQL Editor:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'attachments';
```

You should see:
- `public`: `true`
- `file_size_limit`: `52428800`
- `allowed_mime_types`: Array with all the MIME types listed above

---

## 🚨 Troubleshooting

### "Bucket already exists" error
Use the update script instead: `supabase-storage-update-bucket.sql`

### "Not valid JSON" or "Internal server error"
Use the Dashboard method (Option 1) instead of SQL

### Files not uploading
1. Check bucket is public: `public = true`
2. Check policies allow public INSERT and SELECT
3. Check MIME type is in the allowed list
4. Check file size is under 50MB

---

## 📝 Files in This Setup

- `supabase-storage-setup.sql` - Create new bucket
- `supabase-storage-update-bucket.sql` - Update existing bucket
- `supabase-storage-cleanup.sql` - Delete all buckets
- `SUPABASE_STORAGE_SETUP.md` - This guide
