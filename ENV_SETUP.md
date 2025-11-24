# Environment Setup Guide

## ⚠️ IMPORTANT: Configure Your Supabase Credentials

Your `.env` file is currently empty. You need to add your Supabase credentials for file uploads to work.

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **Settings** (gear icon) in the left sidebar
4. Go to **API** section
5. Copy these two values:
   - **Project URL** (e.g., `https://jqfudagohdkdtnplgtob.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 2: Update Your .env File

Edit `/home/user/Hexea---3D-Viewer/.env` and add:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jqfudagohdkdtnplgtob.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here

# Web3Forms API key
VITE_WEB3FORMS_KEY=ad897559-e4df-411a-bcb7-086c366bf81f
```

**Replace:**
- `https://jqfudagohdkdtnplgtob.supabase.co` with your actual Project URL
- `your-actual-anon-key-here` with your actual anon public key

## Step 3: Restart Your Development Server

After updating .env:
```bash
npm run dev
```

---

## How The Upload Works (WITHOUT Web3Forms Pro)

Since you're using the free version of Web3Forms, here's how attachments work:

### Current Flow:

1. **User uploads model** → Stored in React state
2. **User submits quote** → Two things happen:

   **A. Upload to Supabase (Independent):**
   ```typescript
   const uploadResults = await uploadMultipleFiles(
     [modelFile],
     'ATTACHMENTS',
     `quotes/${quote.quoteId}`
   );
   // Result: https://jqfudagohdkdtnplgtob.supabase.co/storage/v1/object/public/attachments/quotes/HF-ABC123/file.stl
   ```

   **B. Send email via Web3Forms (Free):**
   ```json
   {
     "model_info": "Model Details: ...\n\nModel File:\n{URL}",
     "attachments": "{URL}"
   }
   ```

3. **Email received** → Contains clickable link to download model from Supabase

### Email Format:

```
Model Details:
- File: model.stl
- Material: PLA
- Scale: 100%
...

Model File:
https://jqfudagohdkdtnplgtob.supabase.co/storage/v1/object/public/attachments/quotes/HF-ABC123/model.stl
```

---

## Troubleshooting

### Issue: No attachment link in email

**Cause:** Supabase credentials not configured in `.env`

**Solution:** Follow Steps 1-3 above

**Check browser console:**
```javascript
// If you see this:
⚠ "No model file to upload with quote"
// Or:
⚠ "Model file upload failed: [error details]"

// Then Supabase isn't configured properly
```

### Issue: Upload fails with error

**Possible causes:**
1. Invalid Supabase credentials
2. Bucket doesn't exist
3. Storage policies not set

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage.buckets WHERE id = 'attachments';
```

Should return a row with `public = true`

---

## Current File Structure

```
Project Root
├── .env                          ← YOU NEED TO CONFIGURE THIS
├── .env.example                  ← Template
├── components/
│   ├── QuoteRequestModal.tsx    ← Handles upload + email
│   └── ModelViewer.tsx           ← Stores model file
├── services/
│   └── supabase/
│       ├── client.ts             ← Reads .env credentials
│       └── storage.ts            ← Upload functions
└── supabase-storage-setup.sql   ← Run this in Supabase
```

---

## Test The Upload

After configuring `.env`:

1. Upload a model in the viewer
2. Click "Request Quote"
3. Fill out the form
4. Submit
5. Check browser console for:
   ```
   ✓ Model file uploaded successfully: https://...
   ```
6. Check your email for the download link

---

## Security Note

The `.env` file is already in `.gitignore` - your credentials won't be committed to git.
