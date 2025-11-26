# Email Verification & Quote Management Implementation Plan

## Overview
Add email verification using Supabase Auth and enable users to view their saved quotes.

---

## Architecture

### 1. **Supabase Auth Setup**
Your Supabase project will handle:
- Email/password registration
- Email verification links
- User sessions & authentication
- Password reset (bonus feature)

### 2. **Database Schema**
Create a `quotes` table in Supabase to store all quotes:

```sql
-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,

  -- Model info
  model_file_name TEXT NOT NULL,
  model_file_url TEXT,
  material TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  timeline TEXT NOT NULL,
  finishing TEXT NOT NULL,
  scale INTEGER DEFAULT 100,

  -- Model stats
  vertices INTEGER,
  triangles INTEGER,
  dimensions JSONB, -- {x: "10mm", y: "20mm", z: "30mm"}

  -- Pricing
  base_cost DECIMAL(10,2),
  material_cost DECIMAL(10,2),
  finishing_cost DECIMAL(10,2),
  quantity_discount DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Status
  status TEXT DEFAULT 'pending', -- pending, reviewed, accepted, rejected
  admin_notes TEXT,

  -- Additional
  message TEXT
);

-- Add indexes
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_quote_id ON quotes(quote_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own quotes
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own quotes
CREATE POLICY "Users can insert own quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own quotes (optional - for cancellations)
CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Implementation Steps

### Step 1: Enable Supabase Email Auth

**In Supabase Dashboard:**
1. Go to Authentication → Settings
2. Enable Email provider
3. Configure email templates:
   - Confirm signup template
   - Reset password template
4. Set Site URL: `https://your-netlify-site.netlify.app`
5. Add redirect URLs:
   - `https://your-netlify-site.netlify.app/auth/callback`
   - `http://localhost:5173/auth/callback` (for dev)

### Step 2: Install Required Packages

```bash
npm install @supabase/auth-helpers-react
```

### Step 3: Create Auth Service

**File: `services/supabase/auth.ts`**

```typescript
import { supabase } from './client';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up new user
export async function signUp({ email, password, name }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name, // Store name in user metadata
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
}

// Sign in existing user
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  return { data, error };
}
```

### Step 4: Create Quote Database Service

**File: `services/supabase/quotes.ts`**

```typescript
import { supabase } from './client';

export interface QuoteData {
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  model_file_name: string;
  model_file_url?: string;
  material: string;
  quantity: number;
  timeline: string;
  finishing: string;
  scale: number;
  vertices: number;
  triangles: number;
  dimensions: { x: string; y: string; z: string };
  base_cost: number;
  material_cost: number;
  finishing_cost: number;
  quantity_discount: number;
  total_cost: number;
  message?: string;
}

// Save quote to database
export async function saveQuote(quoteData: QuoteData) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert([
      {
        user_id: user.id,
        ...quoteData,
      },
    ])
    .select()
    .single();

  return { data, error };
}

// Get all quotes for current user
export async function getUserQuotes() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return { data, error };
}

// Get single quote by ID
export async function getQuote(quoteId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_id', quoteId)
    .eq('user_id', user.id)
    .single();

  return { data, error };
}

// Update quote (for cancellations, etc.)
export async function updateQuoteStatus(quoteId: string, status: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('quote_id', quoteId)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error };
}
```

### Step 5: Update Application Flow

**Current Flow:**
1. Welcome Modal → Try Sample OR Get Quote
2. Email Modal (just captures email)
3. Upload model
4. Request quote

**New Flow with Verification:**
1. Welcome Modal → Try Sample OR Sign Up/Sign In
2. **Sign Up:** Enter email + password → Verification email sent
3. **Verify Email:** User clicks link in email → Redirect back to app
4. Upload model & request quote
5. **Quote saved to database** linked to user account
6. User can view "My Quotes" anytime

### Step 6: Create New Components

**Components to Create:**

1. **`SignUpModal.tsx`** - Registration form
   - Email field
   - Password field (with strength indicator)
   - Name field
   - "Sign Up" button
   - Link to Sign In modal

2. **`SignInModal.tsx`** - Login form
   - Email field
   - Password field
   - "Sign In" button
   - "Forgot password?" link
   - Link to Sign Up modal

3. **`EmailVerificationModal.tsx`** - After signup
   - Shows "Check your email" message
   - Resend verification link button
   - Instructions

4. **`AuthCallback.tsx`** - Route: `/auth/callback`
   - Handles redirect after email verification
   - Shows success message
   - Redirects to main app

5. **`MyQuotesPage.tsx`** - Quote history dashboard
   - List of all user's quotes
   - Quote details (expandable cards)
   - Download PDF button
   - Status badges (pending, reviewed, etc.)
   - Filter/search functionality

6. **`UserMenu.tsx`** - Header user menu
   - Shows user name/email
   - "My Quotes" link
   - "Sign Out" button

### Step 7: Update Existing Components

**`WelcomeModal.tsx`**
- Change "Get Quote" button to "Sign Up / Sign In"
- Keep "Try Sample" button (no auth required)

**`QuoteRequestModal.tsx`**
- After successful submission, save quote to database
- Pre-fill name/email from authenticated user
- Don't allow editing of email (it's verified)

**`ModelViewer.tsx`**
- Add user menu to header
- Check authentication status on mount
- If not authenticated, show welcome modal

---

## User Experience Flow

### For New Users:

1. **Land on site** → See Welcome Modal
2. **Click "Sign Up"** → Enter email, password, name
3. **Sign up successful** → See "Check your email" screen
4. **Check email** → Click verification link
5. **Redirected back** → Email verified, logged in
6. **Upload model** → Request quote
7. **Quote submitted** → Saved to database, email sent
8. **View "My Quotes"** → See all submitted quotes with status

### For Returning Users:

1. **Land on site** → See Welcome Modal
2. **Click "Sign In"** → Enter email + password
3. **Logged in** → See main interface
4. **Click "My Quotes"** → View quote history
5. **Submit new quote** → Saved to account

---

## Environment Variables

No new variables needed! Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Email Templates (Supabase)

### Confirmation Email Template:

**Subject:** Confirm your email for Hexea Forge

**Body:**
```html
<h2>Welcome to Hexea Forge!</h2>
<p>Thanks for signing up. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

---

## Security Considerations

1. **RLS Policies** - Users can only access their own quotes
2. **Email Verification** - Required before submitting quotes
3. **Secure Passwords** - Minimum 8 characters (enforced by Supabase)
4. **Session Management** - Automatic token refresh
5. **File Storage** - Files linked to verified users only

---

## Optional Enhancements

### 1. **Magic Link Auth** (Passwordless)
Instead of passwords, users receive a magic link via email:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://your-site.com/auth/callback',
  }
});
```

### 2. **Social Auth** (Google, GitHub)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

### 3. **Admin Dashboard**
- View all quotes from all users
- Update quote status
- Add notes to quotes
- Send responses to customers

### 4. **Email Notifications**
- Quote status updates
- When admin reviews quote
- Price adjustments

### 5. **Quote Revisions**
- Allow users to modify pending quotes
- Request changes from admin feedback

---

## Migration Path

**If you want to implement this gradually:**

### Phase 1: Basic Auth
- Add sign up/sign in modals
- Email verification
- Store quotes in database
- Users can't see old quotes yet

### Phase 2: Quote History
- Add "My Quotes" page
- View all submitted quotes
- Download PDFs

### Phase 3: Status Updates
- Admin can update quote status
- Users see status in real-time
- Email notifications

### Phase 4: Advanced Features
- Quote revisions
- Admin dashboard
- Payment integration (if needed)

---

## Cost Considerations

**Supabase Free Tier Includes:**
- 50,000 monthly active users
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests

This should be more than enough for a 3D printing quote system!

---

## Next Steps

If you want to proceed with this implementation:

1. **Run the SQL** in Supabase to create the quotes table
2. **Enable email auth** in Supabase dashboard
3. **Configure email templates** with your branding
4. **I can implement the code** for all the new components
5. **Test the flow** end-to-end
6. **Deploy** to Netlify with confidence

Would you like me to start implementing this? I can:
- Create all the new components
- Update existing components
- Set up the auth flow
- Add the "My Quotes" dashboard
- Or just implement specific parts first

Let me know how you'd like to proceed!
