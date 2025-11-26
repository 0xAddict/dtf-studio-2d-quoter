# 🚀 Final Setup Instructions - Email Verification & Quote Management

## ✅ Implementation Complete!

All code has been implemented. Follow these final steps to get everything working.

---

## Step 1: Install Dependencies

```bash
npm install react-router-dom
npm install @supabase/supabase-js  # Should already be installed
```

---

## Step 2: Configure Supabase Database

### 2.1 Run SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-quotes-table.sql`
4. Paste and **Run** the SQL script

This will:
- Create the `quotes` table
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Add helpful comments

**Verify it worked:**
```sql
-- Run this in SQL Editor to verify
SELECT * FROM quotes LIMIT 1;
-- Should return empty result set (no error)
```

### 2.2 Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Email** provider
3. Click **Enable Email Provider**
4. Configure settings:
   - ✅ Enable Email provider
   - ✅ Confirm email (Required)
   - ❌ Secure email change (Optional)

### 2.3 Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   ```
   http://localhost:5173
   ```
   (Change to your Netlify URL after deployment)

3. Add **Redirect URLs**:
   ```
   http://localhost:5173/auth/callback
   https://your-site.netlify.app/auth/callback
   ```

### 2.4 Customize Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Edit the template:

**Subject:**
```
Verify your email for Hexea Forge
```

**Body (HTML):**
```html
<h2>Welcome to Hexea Forge!</h2>
<p>Hi there,</p>
<p>Thanks for signing up! Please verify your email address to start requesting quotes.</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
    Verify Email
  </a>
</p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Best regards,<br>The Hexea Forge Team</p>
```

---

## Step 3: Start Development Server

```bash
npm run dev
```

Your app should now be running at `http://localhost:5173`

---

## Step 4: Test the Complete Flow

### Test 1: User Registration
1. Open `http://localhost:5173`
2. Click **"Sign Up / Sign In"**
3. Click **"Sign up"** link
4. Fill in:
   - Name: Test User
   - Email: your-test-email@gmail.com
   - Password: testpassword123
5. Click **"Create Account"**
6. You should see "Check Your Email" screen

### Test 2: Email Verification
1. Check your email inbox (and spam folder!)
2. Click the verification link
3. You should be redirected to `/auth/callback`
4. Then automatically redirected back to the main app
5. You should now see your user menu in the header

### Test 3: Quote Submission
1. Upload a 3D model (or use sample)
2. Select material type
3. Click **"Request Quote"**
4. Fill in the quote form:
   - Name and email should be pre-filled
   - Select Timeline: Normal
   - Select Finishing: Standard
   - Add message (optional)
5. Click **"Send Quote Request"**
6. Check:
   - ✅ Email sent to your admin email (Web3Forms)
   - ✅ Quote saved to Supabase (check SQL Editor: `SELECT * FROM quotes;`)

### Test 4: View Quote History
1. Click your user menu in the header
2. Click **"My Quotes"**
3. You should see your submitted quote
4. Try:
   - Expanding quote details
   - Filtering by status
   - Searching by quote ID
   - Canceling a pending quote

### Test 5: Sign Out / Sign In
1. Click user menu → **"Sign Out"**
2. Welcome modal should appear
3. Click **"Sign Up / Sign In"** → **"Sign in"**
4. Enter your credentials
5. You should be signed in and see your quotes

---

## Step 5: Deploy to Netlify

### 5.1 Update Supabase Redirect URLs

Before deploying, update your redirect URLs in Supabase:

1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL**: `https://your-site.netlify.app`
3. Add to **Redirect URLs**: `https://your-site.netlify.app/auth/callback`

### 5.2 Set Environment Variables in Netlify

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Add these variables:

```
VITE_SUPABASE_URL=https://jqfudagohdkdtnplgtob.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs
VITE_WEB3FORMS_KEY=ad897559-e4df-411a-bcb7-086c366bf81f
```

### 5.3 Deploy

```bash
git push origin main  # or your deployment branch
```

Netlify will automatically build and deploy!

---

## 🎯 What's Working Now

### ✅ Authentication System
- User registration with email/password
- Email verification required before submitting quotes
- Secure session management
- Sign in / Sign out
- Protected routes

### ✅ Quote Management
- Submit quotes (authenticated users only)
- Quotes saved to Supabase database
- Email sent to admin via Web3Forms (unchanged)
- View quote history in "My Quotes"
- Filter and search quotes
- Cancel pending quotes
- Quote statistics dashboard

### ✅ Security
- Row Level Security (users only see their own quotes)
- Email verification required
- Secure password storage (handled by Supabase)
- Protected API routes

### ✅ User Experience
- Seamless auth flow
- Pre-filled forms with user info
- Quote history accessible anytime
- Status tracking (pending/reviewed/accepted)
- Responsive design

---

## 🔧 Troubleshooting

### Issue: "User not authenticated" error

**Solution:**
- Check that AuthProvider is wrapping your app in App.tsx
- Make sure you're signed in
- Try signing out and back in

### Issue: "Email not verified" error

**Solution:**
- Check your email for verification link
- Click the link to verify
- If expired, try resending from sign-in page

### Issue: Quotes not saving to database

**Solution:**
1. Check Supabase SQL Editor for errors:
   ```sql
   SELECT * FROM quotes;
   ```
2. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'quotes';
   ```
3. Check browser console for errors
4. Make sure you're signed in AND email verified

### Issue: Email verification link doesn't work

**Solution:**
- Check redirect URLs in Supabase match your domain exactly
- Make sure `/auth/callback` route exists
- Check browser console for errors
- Try clearing cookies and trying again

### Issue: "Cannot find module 'react-router-dom'"

**Solution:**
```bash
npm install react-router-dom
```

### Issue: Welcome modal always appears

**Solution:**
- This is normal if not signed in
- Sign up and verify your email
- Check that useAuth hook is working (check browser console)

---

## 📊 Database Schema Reference

### `quotes` table columns:

```
id                UUID PRIMARY KEY
user_id           UUID (references auth.users)
quote_id          TEXT (e.g., "HF-ABC123")
created_at        TIMESTAMP

customer_name     TEXT
customer_email    TEXT
customer_phone    TEXT
customer_company  TEXT

model_file_name   TEXT
model_file_url    TEXT
material          TEXT
quantity          INTEGER
timeline          TEXT
finishing         TEXT
scale             INTEGER

vertices          INTEGER
triangles         INTEGER
dimensions        JSONB

base_cost         DECIMAL
material_cost     DECIMAL
finishing_cost    DECIMAL
quantity_discount DECIMAL
total_cost        DECIMAL

status            TEXT (pending/reviewed/accepted/rejected/cancelled)
admin_notes       TEXT
message           TEXT
```

---

## 🎨 Customization Ideas

### Add Admin Dashboard

Create an admin view to:
- See all quotes from all users
- Update quote status
- Add notes to quotes
- Email customers directly

### Add Notifications

- Email users when quote status changes
- Push notifications for quote updates
- SMS notifications (via Twilio)

### Add Payment Integration

- Stripe/PayPal for accepted quotes
- Invoice generation
- Payment history

### Add More Quote Details

- Delivery address
- Special instructions
- File revisions
- Quote expiration dates

---

## 📚 Documentation References

- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **React Router**: https://reactrouter.com/
- **Web3Forms**: https://web3forms.com/

---

## ✅ Final Checklist

Before going live:

- [ ] SQL migration run successfully
- [ ] Email auth enabled in Supabase
- [ ] Redirect URLs configured
- [ ] Environment variables set (locally and Netlify)
- [ ] Test user registration flow
- [ ] Test email verification
- [ ] Test quote submission
- [ ] Test quote history viewing
- [ ] Test sign out / sign in
- [ ] Verify quotes appear in database
- [ ] Verify admin emails still work
- [ ] Test on mobile devices
- [ ] Update Supabase URLs for production
- [ ] Deploy to Netlify
- [ ] Test production deployment

---

## 🎉 You're Done!

Your email verification and quote management system is now fully implemented!

Users can:
✅ Sign up with email verification
✅ Submit quotes (saved to database)
✅ View quote history
✅ Track quote status
✅ Cancel pending quotes

Admins still receive:
✅ Email notifications via Web3Forms
✅ All quote details in the email
✅ File download links

Everything works together seamlessly! 🚀

---

## 💡 Need Help?

If you encounter any issues:

1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify environment variables are loaded
4. Make sure you restarted dev server after .env changes
5. Check network tab for failed API calls
6. Verify SQL migration ran without errors

Common fixes:
- Restart dev server: `Ctrl+C` then `npm run dev`
- Clear browser cache and cookies
- Re-run SQL migration if table structure changed
- Double-check redirect URLs match exactly
