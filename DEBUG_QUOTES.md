# 🔍 Debug: Why Quotes Aren't Saving

## Step 1: Check Browser Console

1. Open your app in the browser
2. Press **F12** or **Ctrl+Shift+I** (Cmd+Option+I on Mac)
3. Go to the **Console** tab
4. Submit a test quote
5. Look for these messages:

### What to Look For:

#### ✅ Good Signs:
```
🔧 Supabase Configuration:
  URL: ✅ https://jqfudagohdkdtnplgtob.supabase.co
  Anon Key: ✅ Configured
  Ready: ✅ Yes
```

```
Model file uploaded successfully: https://...
Quote saved to database successfully: {id: "...", ...}
```

#### ❌ Bad Signs:

**If you see:**
```
🔧 Supabase Configuration:
  URL: ❌ NOT CONFIGURED
  Anon Key: ❌ NOT CONFIGURED
  Ready: ❌ No - Please configure .env and restart dev server
```
**Fix:** Your dev server needs to be restarted after .env changes!

**If you see:**
```
Supabase not configured. Mock quote submission: {...}
```
**Fix:** The app thinks Supabase isn't configured. Restart dev server.

**If you see:**
```
Error saving quote to database: {...}
```
**This tells us:** The code is trying but failing. Copy the error message!

**If you see network errors:**
```
POST https://jqfudagohdkdtnplgtob.supabase.co/rest/v1/quote_request 400/500
```
**This tells us:** Request is being made but server is rejecting it. Check Network tab.

---

## Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Submit a quote
3. Look for requests to `supabase.co`

### What to Check:

#### Look for POST request to `/rest/v1/quote_request`:

- **If you DON'T see this request**: Code isn't calling submitQuote() at all
- **If you see it with Status 200-204**: Quote saved successfully! Check Supabase.
- **If you see it with Status 400**: Bad request - data format issue
- **If you see it with Status 401**: Authentication issue
- **If you see it with Status 403**: Permission denied (RLS issue)

#### Click on the failed request and check:
- **Headers tab**: Is the `Authorization` header present?
- **Payload tab**: What data is being sent?
- **Response tab**: What error message did Supabase return?

---

## Step 3: Restart Dev Server

**IMPORTANT**: After modifying `.env`, you MUST restart the dev server!

```bash
# Stop the dev server (Ctrl+C)
# Then restart
npm run dev
```

After restarting, check the console output. You should see:
```
✅ Supabase Configuration: Ready
```

---

## Step 4: Test Quote Submission Flow

Submit a quote and check each step:

1. **File Upload** (if model attached)
   - Console: "Model file uploaded successfully"
   - Or: "No model file to upload"

2. **Email Sending** (Web3Forms)
   - Should always succeed
   - Console shows no errors

3. **Database Save** (NEW - our fix)
   - Console: "Quote saved to database successfully"
   - Or: "Error saving quote to database: ..."

---

## Step 5: Common Issues

### Issue: "Supabase not configured" in console
**Cause**: Dev server not restarted after .env changes
**Fix**:
```bash
# Kill and restart
npm run dev
```

### Issue: No errors but quote doesn't save
**Cause**: Code might be silently failing
**Check**:
- Browser console for any red errors
- Network tab for failed requests
- Look for try-catch blocks swallowing errors

### Issue: Model data is too large
**Cause**: model_data JSON might be huge with all model info
**Fix**: We might need to simplify what we save

### Issue: TypeError or undefined errors
**Cause**: Missing fields in form data
**Check**: Are all required fields filled?

---

## Step 6: Manual Database Test

Let's verify the database works at all:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this:

```sql
-- Test insert
INSERT INTO quote_request (
  name,
  email,
  quantity,
  material,
  model_data
) VALUES (
  'Manual Test',
  'manual@test.com',
  1,
  'PLA',
  '{"test": true}'
);

-- Check it saved
SELECT * FROM quote_request
WHERE email = 'manual@test.com';
```

If this works, the database is fine. The issue is in the React app.

If this fails, there's a database problem.

---

## Step 7: Check Environment Variables

In browser console, type:
```javascript
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

These should show your actual values, not "undefined" or placeholders.

---

## Step 8: Simplified Test Code

Let's test with minimal code. In browser console:

```javascript
// Test Supabase connection directly
const { createClient } = await import('@supabase/supabase-js');

const supabase = createClient(
  'https://jqfudagohdkdtnplgtob.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs'
);

// Try to insert
const result = await supabase
  .from('quote_request')
  .insert({
    name: 'Console Test',
    email: 'console@test.com',
    quantity: 1,
    material: 'PLA',
    model_data: '{"test": true}'
  })
  .select()
  .single();

console.log('Result:', result);
```

If this works, Supabase is fine. The issue is in our React code.

---

## 📊 Report Back

Please check and tell me:

1. **What do you see in the Console tab?** (copy the messages)
2. **What do you see in the Network tab?** (any requests to supabase.co?)
3. **Did you restart the dev server after editing .env?**
4. **Can you manually insert into the database via SQL?**

With this info, I can pinpoint exactly what's wrong!
