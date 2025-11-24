# Netlify Deployment Guide

## 🚀 Setting Up Environment Variables in Netlify

Your Supabase credentials need to be configured in Netlify for the file upload to work in production.

### Step 1: Access Netlify Environment Variables

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Navigate to **Site settings** → **Environment variables** (or **Build & deploy** → **Environment**)
4. Click **Add a variable** or **New variable**

### Step 2: Add These 3 Variables

Add each of these environment variables:

#### Variable 1: VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://jqfudagohdkdtnplgtob.supabase.co`
- **Scopes**: ✅ All deploy contexts (Production, Deploy Previews, Branch deploys)

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZnVkYWdvaGRrZHRucGxndG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTAxNjksImV4cCI6MjA3OTM4NjE2OX0.ZoWPSpqNI23TXY1FsdwS4-gbJxzLkbXp97Hmq-hxsjs`
- **Scopes**: ✅ All deploy contexts

#### Variable 3: VITE_WEB3FORMS_KEY
- **Key**: `VITE_WEB3FORMS_KEY`
- **Value**: `ad897559-e4df-411a-bcb7-086c366bf81f`
- **Scopes**: ✅ All deploy contexts

### Step 3: Redeploy Your Site

After adding the variables:
1. Click **Save**
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**

Or push a new commit to trigger a deployment.

---

## ✅ How File Upload Works on Netlify

### Upload Flow (Production):

```
User uploads 3D model → Stored in browser memory (React state)
         ↓
User submits quote form
         ↓
[CLIENT-SIDE] Model file uploads to Supabase
         ├─→ POST to https://jqfudagohdkdtnplgtob.supabase.co/storage/v1/object/attachments/...
         └─→ Returns public URL
         ↓
[CLIENT-SIDE] Email sent via Web3Forms API
         └─→ Includes Supabase URL in message body
         ↓
Email received with clickable download link
```

**Key Points:**
- ✅ Upload happens **client-side** (in the browser)
- ✅ No server/backend needed
- ✅ Works with Netlify static hosting
- ✅ Environment variables are bundled at build time (Vite)

---

## 🔒 Security Note

Your Supabase **anon key** is public and safe to expose:
- It's designed to be used in client-side applications
- Access is controlled by Supabase Row Level Security (RLS) policies
- Storage bucket policies control who can upload/download

---

## 📋 Verification Checklist

After deploying to Netlify, verify:

### 1. Environment Variables Are Set
```bash
# Check Netlify dashboard
Site Settings → Environment variables
```
Should see all 3 variables listed.

### 2. Build Includes Variables
Check build logs in Netlify for:
```
Environment variables
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_WEB3FORMS_KEY
```

### 3. Test Upload in Production

1. Visit your Netlify site
2. Upload a 3D model
3. Request a quote
4. Open browser DevTools → Console
5. Look for:
   ```
   ✓ Model file uploaded successfully: https://...
   ```
6. Check email for the download link

---

## 🐛 Troubleshooting

### Issue: "No model file to upload with quote" in console

**Cause:** Environment variables not set or build not updated

**Solution:**
1. Verify variables in Netlify dashboard
2. Trigger a new deploy
3. Clear browser cache

### Issue: Upload fails with 403 error

**Cause:** Supabase storage policies not configured

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Check bucket "attachments" exists and is public
3. Verify storage policies allow public INSERT and SELECT
4. Run `supabase-storage-setup.sql` if needed

### Issue: Email doesn't include link

**Cause:** Upload is failing silently

**Check:**
1. Browser console for error messages
2. Network tab for failed requests to Supabase
3. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct

---

## 📁 File Structure in Supabase

Once working, files will be stored as:

```
Supabase Storage
└── attachments/
    └── quotes/
        ├── HF-ABC123/
        │   └── 1234567890-xyz789.stl
        ├── HF-DEF456/
        │   └── 1234567891-abc123.fbx
        └── ...
```

Each quote gets its own folder with a unique ID.

---

## 📧 Email Format

The email will include:

```
Model Details:
- File: model.stl
- Material: PLA - Affordable
- Scale: 100%
- Quantity: 1 pcs
...

Model File:
https://jqfudagohdkdtnplgtob.supabase.co/storage/v1/object/public/attachments/quotes/HF-ABC123/1234567890-xyz789.stl
```

The link is **clickable** and downloads directly from Supabase.

---

## 🔄 Local vs Production

| Aspect | Local Dev | Production (Netlify) |
|--------|-----------|---------------------|
| Env File | `.env` | Netlify environment variables |
| Upload | Client-side | Client-side (same) |
| Build | Vite dev server | Netlify build |
| Access | localhost:5173 | your-site.netlify.app |

Both use the **same Supabase bucket** and credentials!

---

## ⚡ Quick Start Commands

```bash
# Local development
npm run dev

# Build for production (test locally)
npm run build
npm run preview

# Deploy to Netlify
git push origin main  # or your branch
# Netlify auto-deploys
```

---

## 📞 Need Help?

If uploads still don't work after following this guide:

1. Check Netlify build logs for errors
2. Check browser console for JavaScript errors
3. Verify Supabase bucket exists and is public
4. Verify all 3 environment variables are set in Netlify
5. Test file upload directly in Supabase Storage UI
