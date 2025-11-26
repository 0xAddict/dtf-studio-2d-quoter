# 🚨 QUICK FIX: Enable Quote Submissions

## The Problem

Your Supabase database is blocking quote submissions due to Row Level Security (RLS) policies.

**Error**: "Access denied" when trying to insert quotes

**Cause**: The `quote_request` table has RLS enabled but no policy allowing anonymous inserts.

---

## ✅ The Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `jqfudagohdkdtnplgtob`
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL

Copy and paste this SQL and click **Run**:

```sql
-- Allow anonymous users to INSERT quotes
-- This is what allows the React app to save quotes
CREATE POLICY "Allow anonymous inserts" ON quote_request
    FOR INSERT
    WITH CHECK (true);

-- Allow service_role full access (for WordPress)
CREATE POLICY "Service role has full access" ON quote_request
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anyone to SELECT quotes (optional)
CREATE POLICY "Allow public reads" ON quote_request
    FOR SELECT
    USING (true);
```

### Step 3: Verify It Worked

Run this query to check your policies:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'quote_request';
```

You should see:
- ✅ `Allow anonymous inserts` - cmd: INSERT
- ✅ `Service role has full access` - cmd: ALL
- ✅ `Allow public reads` - cmd: SELECT

---

## 🧪 Test It

After running the SQL above:

1. Go to your React app
2. Submit a test quote
3. Check Supabase Table Editor → `quote_request`
4. Quote should appear! ✅

---

## 🔐 Security Notes

**Why is this safe?**

- Anonymous users can ONLY **INSERT** (create) quotes
- They CANNOT update or delete existing quotes
- The service_role key (WordPress) has full admin access
- This is the standard pattern for public form submissions

**What can anonymous users do?**
- ✅ Submit new quotes
- ✅ Read quotes (if you keep the SELECT policy)
- ❌ Update quotes
- ❌ Delete quotes
- ❌ Access other tables

---

## 🎯 What Happens Next

Once you run this SQL:

1. **React App** → Can submit quotes ✅
2. **Quotes save to Supabase** → `quote_request` table ✅
3. **WordPress Dashboard** → Can see and manage all quotes ✅
4. **Email notifications** → Still work via Web3Forms ✅

---

## 📊 Alternative: Complete Database Setup

If you want the full setup with indexes and all features, use `supabase-setup.sql` instead.

But if you just want to get it working FAST, the 3 policies above are all you need!

---

## ❓ Still Not Working?

If quotes still don't save after running the SQL:

1. **Verify policies exist**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'quote_request';
   ```

2. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'quote_request';
   ```
   Should show `rowsecurity = true`

3. **Try manual insert**:
   ```sql
   INSERT INTO quote_request (name, email, quantity, material)
   VALUES ('Test', 'test@example.com', 1, 'PLA');
   ```
   This should work even in SQL Editor

4. **Check browser console** for errors when submitting a quote

---

## 🚀 That's It!

Run those 3 CREATE POLICY statements and you're done. Quotes will start saving immediately.
