# Troubleshooting "Failed to Fetch" Error

## Common Causes and Fixes

### 1. Check Netlify Environment Variables

**Problem:** Environment variables not set in Netlify dashboard

**Fix:**
1. Go to: Netlify Dashboard → Your Site → Site settings → Environment variables
2. Verify these are set:
   ```
   VITE_SUPABASE_URL=https://jqfudagohdkdtnplgtob.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs
   VITE_WEB3FORMS_KEY=ad897559-e4df-411a-bcb7-086c366bf81f
   ```
3. After adding/updating, **trigger a new deploy**

### 2. Enable Email Authentication in Supabase

**Problem:** Email provider not enabled

**Fix:**
1. Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob)
2. Navigate to: **Authentication** → **Providers**
3. Find **Email** provider
4. Click **Enable** and ensure:
   - ✅ Enable Email provider is ON
   - ✅ Confirm email is ON

### 3. Configure Redirect URLs

**Problem:** Auth callback fails due to incorrect redirect URL

**Fix:**
1. Go to: **Authentication** → **URL Configuration**
2. Set **Site URL**:
   ```
   https://moonlit-faun-a29b39.netlify.app
   ```
3. Add **Redirect URLs** (both):
   ```
   http://localhost:5173/auth/callback
   https://moonlit-faun-a29b39.netlify.app/auth/callback
   ```
4. Click **Save**

### 4. Create Database Tables

**Problem:** Tables don't exist in Supabase

**Fix:**

#### A. Create `quotes` table (for user history):
1. Go to: **SQL Editor** in Supabase Dashboard
2. Copy the entire content of `supabase-quotes-table.sql`
3. Paste and click **Run**

#### B. Verify `quote_requests` table exists (for WordPress):
1. Go to: **Table Editor** in Supabase
2. Check if `quote_requests` table exists
3. If not, run this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS quote_requests (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     company TEXT,
     quantity INTEGER NOT NULL,
     material TEXT NOT NULL,
     timeline TEXT,
     notes TEXT,
     model_data JSONB,
     status TEXT DEFAULT 'pending'
   );
   ```

### 5. Check Browser Console

**What to look for:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages:
   - `Failed to fetch` → Network/CORS issue
   - `Invalid API key` → Wrong Supabase key
   - `relation "quotes" does not exist` → Table not created
   - `Email not enabled` → Email auth disabled

### 6. Test Specific Features

#### Test Sign Up:
1. Open: https://moonlit-faun-a29b39.netlify.app
2. Click "Sign Up / Sign In"
3. Try to create account
4. Check browser console for errors

#### Test Quote Submission (without auth):
1. Upload a 3D model
2. Fill form (don't sign in)
3. Submit quote
4. Should go to WordPress system only

#### Test Quote Submission (with auth):
1. Sign up and verify email
2. Sign in
3. Upload model and submit quote
4. Should go to BOTH WordPress AND user history

### 7. Verify Supabase Storage Buckets

**Problem:** File upload fails

**Fix:**
1. Go to: **Storage** in Supabase Dashboard
2. Verify these buckets exist:
   - `models`
   - `thumbnails`
   - `attachments`
3. If missing, create them with **Public** access

### 8. Check Network Tab

1. Open DevTools → **Network** tab
2. Try the action that fails
3. Look for failed requests:
   - Red status codes (400, 401, 403, 500)
   - Click on failed request
   - Check **Response** tab for error message

## Quick Diagnostic Checklist

- [ ] Environment variables set in Netlify
- [ ] Email authentication enabled in Supabase
- [ ] Redirect URLs configured
- [ ] `quotes` table created (run SQL migration)
- [ ] `quote_requests` table exists
- [ ] Storage buckets exist
- [ ] Browser console checked for specific errors

## Still Having Issues?

If the error persists:
1. Copy the **exact error message** from browser console
2. Check which action triggers it (signup, signin, quote submission)
3. Screenshot the error if possible
4. Check Supabase Dashboard → **Logs** for backend errors
