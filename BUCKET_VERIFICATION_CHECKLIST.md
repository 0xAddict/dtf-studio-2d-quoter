# Supabase Bucket Configuration Checklist

## Step 1: Check if Bucket Exists

Go to your Supabase Dashboard:
1. Open https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob
2. Click **Storage** in the left sidebar
3. Look for a bucket named **"attachments"**

**What to tell me:**
- [ ] Does the "attachments" bucket exist? (Yes/No)
- [ ] If yes, is it marked as "Public"? (Yes/No)

---

## Step 2: Run This SQL Query

Go to **SQL Editor** in Supabase and run:

```sql
-- Check bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'attachments';
```

**Copy and paste the entire result here** (or tell me what you see)

Expected result should look like:
```
id: attachments
name: attachments
public: true
file_size_limit: 52428800
allowed_mime_types: {application/octet-stream,model/stl,...}
```

---

## Step 3: Check Storage Policies

In Supabase Dashboard:
1. Go to **Storage** → Click on **attachments** bucket
2. Click on **Policies** tab
3. Look for policies that allow INSERT and SELECT

**What to tell me:**
- How many policies exist?
- What do they say? (e.g., "Allow public uploads", "Allow public downloads")

Or run this SQL:

```sql
-- Check storage policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

**Copy and paste the result**

---

## Step 4: Environment Variables Status

In your browser console (where you're running the app), what do you see?

Look for this message:
```
🔧 Supabase Configuration:
  URL: ???
  Anon Key: ???
  Ready: ???
```

**Tell me:**
- What does it say for URL? (❌ NOT CONFIGURED or ✅ with URL?)
- What does it say for Anon Key? (❌ NOT CONFIGURED or ✅ Configured?)
- What does it say for Ready? (❌ No or ✅ Yes?)

---

## Step 5: Did You Restart Dev Server?

**CRITICAL:** After updating `.env`, did you:
1. Stop the dev server (Ctrl+C)
2. Run `npm run dev` again

- [ ] Yes, I restarted
- [ ] No, not yet

---

## Quick Fix Attempt

If bucket doesn't exist, run this SQL in Supabase:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Add upload policy
CREATE POLICY IF NOT EXISTS "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'attachments');

-- Add download policy
CREATE POLICY IF NOT EXISTS "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');
```

---

## Summary of What I Need:

1. ✅ **Bucket exists?** Yes/No
2. ✅ **Bucket is public?** Yes/No
3. ✅ **SQL query result** from Step 2
4. ✅ **Policies exist?** How many and what they say
5. ✅ **Console log** from Step 4 showing config status
6. ✅ **Did you restart dev server?** Yes/No

Once you provide this info, I can tell you exactly what's wrong! 🔍
