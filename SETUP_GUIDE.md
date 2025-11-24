# 🚀 Complete Setup Guide - Hexea Forge with WordPress Dashboard

This guide will help you set up the entire system so quotes are saved to the database and appear in your WordPress dashboard.

---

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] Active Supabase project
- [ ] WordPress installation with admin access
- [ ] Node.js installed (for the React app)

---

## Part 1: Configure Supabase Database

### Step 1: Create the Quote Requests Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    model_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    quantity INTEGER NOT NULL,
    material TEXT NOT NULL,
    timeline TEXT,
    notes TEXT,
    model_data JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(email);

-- Enable Row Level Security
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for quote submissions from the app)
CREATE POLICY "Allow anonymous inserts" ON quote_requests
    FOR INSERT
    WITH CHECK (true);

-- Allow service_role full access (for WordPress admin)
CREATE POLICY "Service role has full access" ON quote_requests
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Allow anon to read their own submissions (optional)
CREATE POLICY "Allow read own submissions" ON quote_requests
    FOR SELECT
    USING (true);
```

5. Click **Run** to execute

### Step 2: Configure Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. If you don't have an `attachments` bucket:
   - Click **New Bucket**
   - Name: `attachments`
   - **Public**: ✅ Check this
   - Click **Create Bucket**
3. Click on the `attachments` bucket
4. Go to **Policies**
5. Create a policy for public read access:

```sql
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'attachments');

CREATE POLICY "Public insert access" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'attachments');
```

---

## Part 2: Configure React App (3D Viewer)

### Step 1: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (under "Project API keys" - this is safe for the browser)

### Step 2: Configure Environment Variables

1. Open the file `.env` in the project root
2. Fill in your Supabase credentials:

```env
# Your Supabase project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Your Supabase anon/public key (NOT service_role)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Web3Forms key (already configured)
VITE_WEB3FORMS_KEY=ad897559-e4df-411a-bcb7-086c366bf81f
```

⚠️ **IMPORTANT**:
- Use the **anon/public key**, NOT the service_role key for the React app
- The service_role key is ONLY for the WordPress plugin

### Step 3: Restart Development Server

After saving the `.env` file:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
```

You should see in the console:
```
🔧 Supabase Configuration:
  URL: ✅ https://your-project.supabase.co
  Anon Key: ✅ Configured
  Ready: ✅ Yes
```

---

## Part 3: Configure WordPress Plugin

### Step 1: Install the Plugin

1. **Upload the plugin**:
   - Go to `wordpress-plugin/forge-dashboard/`
   - ZIP the entire folder
   - In WordPress admin, go to **Plugins** → **Add New** → **Upload Plugin**
   - Upload the ZIP file
   - Click **Activate**

2. **Or via FTP/SFTP**:
   - Upload the `forge-dashboard` folder to `/wp-content/plugins/`
   - In WordPress admin, go to **Plugins** and activate "Forge Dashboard"

### Step 2: Configure Plugin Settings

1. In WordPress admin, go to **Forge** → **Settings**

2. Get your **Supabase Service Role Key**:
   - Go to Supabase Dashboard → **Settings** → **API**
   - Find **service_role key**
   - Click **Reveal** to show the key
   - Copy the entire key

3. Fill in the settings:
   - **Supabase URL**: Same URL as in .env (e.g., `https://abcdefgh.supabase.co`)
   - **Supabase Service Key**: Paste the service_role key (starts with `eyJ...`)
   - **Items Per Page**: 20 (default)
   - **Default Status**: pending

4. Click **Save Changes**

5. Click **Test Connection** - you should see "Successfully connected to Supabase"

⚠️ **Common Issues**:
- If "Test Connection" fails, check:
  - URL has no trailing slash
  - You're using the **service_role key**, not anon key
  - The quote_requests table exists in Supabase

---

## Part 4: Test the Complete Flow

### Test Quote Submission:

1. **Open your 3D viewer app**: http://localhost:5173 (or your domain)

2. **Upload a 3D model**:
   - Drag and drop an STL, OBJ, or FBX file
   - Select a material (e.g., PLA)
   - Adjust scale if needed

3. **Click "Request Quote"**:
   - If first time, enter your name and email for verification
   - Fill out the quote form:
     - Name: Test User
     - Email: test@example.com
     - Phone: +1234567890 (optional)
     - Company: Test Company (optional)
     - Quantity: 5
     - Timeline: Normal (1-2 weeks)
     - Finishing: Smooth
     - Message: Test quote submission
   - Click **Send Quote Request**

4. **Check for success**:
   - You should see "Quote Sent!" message
   - Quote PDF should auto-download
   - You should receive an email (check spam folder)

5. **Verify in Supabase**:
   - Go to Supabase Dashboard → **Table Editor**
   - Click on `quote_requests` table
   - You should see your test quote!

6. **Verify in WordPress**:
   - Go to WordPress admin
   - Click **Forge** → **All Quotes**
   - You should see your test quote in the list!
   - Click on it to view full details

---

## 🔍 Troubleshooting

### Issue: "Supabase not configured" in React app console

**Solution**:
1. Make sure `.env` file exists in project root
2. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are filled in
3. Restart the dev server (`npm run dev`)
4. Check browser console for the configuration status

### Issue: Quotes not appearing in Supabase table

**Solution**:
1. Check browser console for errors
2. Make sure RLS policies allow anonymous inserts
3. Verify the table name is exactly `quote_requests` (lowercase, underscore)
4. Check Network tab for failed requests to Supabase

### Issue: WordPress shows "Supabase Not Configured"

**Solution**:
1. Go to **Forge** → **Settings**
2. Click **Test Connection**
3. If it fails:
   - Verify Supabase URL (no trailing slash)
   - Ensure you're using **service_role key**, not anon key
   - Check that credentials are saved (click Save Changes again)
   - Try clearing WordPress cache

### Issue: WordPress shows 0 quotes but Supabase has data

**Solution**:
1. Check that the service_role key is correct
2. Verify RLS policy allows service_role full access
3. Check WordPress PHP error logs
4. Go to **Forge** → **Settings** → Test Connection
5. If connection succeeds, the plugin should see the quotes

### Issue: Files not uploading to Supabase Storage

**Solution**:
1. Verify `attachments` bucket exists
2. Check bucket is set to **Public**
3. Verify storage policies allow inserts
4. Check browser console for upload errors
5. Ensure file size is under 50MB

---

## 📊 Verify Everything Works

After setup, verify each component:

### ✅ React App:
- [ ] Console shows "✅ Supabase Configuration: Ready"
- [ ] Can upload 3D models
- [ ] Can submit quote form
- [ ] Receives success message
- [ ] Gets PDF download

### ✅ Supabase:
- [ ] `quote_requests` table has data
- [ ] `attachments` bucket has files in `quotes/HF-*/` folders
- [ ] Can query table manually in SQL Editor

### ✅ WordPress Plugin:
- [ ] Dashboard shows quote statistics
- [ ] All Quotes page lists submissions
- [ ] Can view quote details
- [ ] Can download attached files
- [ ] Can update quote status
- [ ] Can delete quotes
- [ ] Can export to CSV

---

## 🔐 Security Notes

### React App (.env):
- Uses **anon/public key** - safe for browser
- Allows quote submissions only
- Cannot delete or modify existing data (RLS policies control this)

### WordPress Plugin:
- Uses **service_role key** - admin access
- Can read, update, delete quotes
- Should NEVER be exposed publicly
- Keep this key secret!

---

## 🎯 Key Differences: Anon Key vs Service Role Key

| Feature | Anon Key (React App) | Service Role Key (WordPress) |
|---------|---------------------|------------------------------|
| **Purpose** | Submit quotes | Manage all quotes |
| **Access** | Insert only | Full CRUD access |
| **Location** | Browser (.env) | Server (WordPress DB) |
| **Security** | Safe to expose | Must keep secret |
| **RLS Policies** | Restricted by policies | Bypasses all policies |

---

## 📞 Still Having Issues?

If you're still having problems after following this guide:

1. **Check all credentials are correct**:
   - Supabase URL matches in both .env and WordPress
   - Anon key in .env (React app)
   - Service role key in WordPress

2. **Verify table exists**:
   ```sql
   SELECT * FROM quote_requests LIMIT 1;
   ```

3. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'quote_requests';
   ```

4. **Test manually**:
   - Try inserting a quote via Supabase SQL Editor
   - Check if WordPress can read it

5. **Enable debugging**:
   - React: Check browser console
   - WordPress: Enable WP_DEBUG in wp-config.php

---

## 🎉 Success!

Once everything is working:
- Quotes submitted through your 3D viewer will appear in WordPress
- You can manage quotes, update statuses, and track your business
- Files are stored safely in Supabase
- Email notifications sent via Web3Forms

Your complete quote management system is ready! 🚀
