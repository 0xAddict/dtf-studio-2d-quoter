# Authentication & Quote Management Flow Diagrams

## Current Flow (No Auth)

```
┌─────────────────┐
│  Welcome Modal  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐  ┌▼──────────┐
│ Sample │  │ Get Quote │
└────────┘  └─────┬─────┘
                  │
           ┌──────▼──────┐
           │ Email Modal │
           │ (Name+Email)│
           └──────┬──────┘
                  │
            ┌─────▼─────┐
            │Upload Model│
            └─────┬─────┘
                  │
           ┌──────▼──────┐
           │Quote Request│
           │    Modal    │
           └──────┬──────┘
                  │
            ┌─────▼─────┐
            │ Submit to │
            │ Web3Forms │
            └───────────┘

   ❌ No quote history
   ❌ No verification
   ❌ Anonymous submissions
```

---

## Proposed Flow (With Auth & Verification)

```
┌─────────────────┐
│  Welcome Modal  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼────┐  ┌▼───────────┐
│ Sample │  │ Sign Up /  │
│ (No    │  │  Sign In   │
│  Auth) │  └─────┬──────┘
└────────┘        │
              ┌───┴────┐
              │        │
       ┌──────▼──┐  ┌──▼──────┐
       │ Sign Up │  │ Sign In │
       └────┬────┘  └────┬────┘
            │            │
     ┌──────▼──────┐     │
     │Email Sent   │     │
     │"Check Email"│     │
     └──────┬──────┘     │
            │            │
     ┌──────▼──────┐     │
     │User clicks  │     │
     │link in email│     │
     └──────┬──────┘     │
            │            │
     ┌──────▼──────┐     │
     │Email Verified│    │
     └──────┬──────┘     │
            │            │
            └─────┬──────┘
                  │
           ┌──────▼──────┐
           │ Logged In   │
           │ Main App    │
           └──────┬──────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼────┐     ┌──────▼─────┐
    │ Upload  │     │ My Quotes  │
    │ Model   │     │ Dashboard  │
    └────┬────┘     └──────┬─────┘
         │                 │
    ┌────▼────┐     ┌──────▼─────┐
    │ Request │     │View History│
    │  Quote  │     │Download PDF│
    └────┬────┘     │Check Status│
         │          └────────────┘
         │
    ┌────▼────┐
    │Save to  │
    │Database │
    │   +     │
    │Web3Forms│
    └─────────┘

   ✅ Verified email
   ✅ Quote history
   ✅ User accounts
   ✅ Status tracking
```

---

## Detailed State Diagram

```
START
  │
  ▼
┌─────────────────────────────────┐
│   Check Authentication Status   │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼────┐   ┌────▼────┐
   │Logged In│   │Anonymous│
   └────┬────┘   └────┬────┘
        │             │
        │        ┌────▼────┐
        │        │ Welcome │
        │        │  Modal  │
        │        └────┬────┘
        │             │
        │        ┌────┴────┐
        │        │         │
        │    ┌───▼──┐  ┌───▼────┐
        │    │Sample│  │Sign Up/│
        │    │      │  │Sign In │
        │    └──────┘  └───┬────┘
        │                  │
        │             ┌────▼────┐
        │             │  Auth   │
        │             │ Process │
        │             └────┬────┘
        │                  │
        └──────────────────┘
                      │
              ┌───────▼────────┐
              │  Main App UI   │
              │                │
              │ • Upload Model │
              │ • My Quotes    │
              │ • User Menu    │
              └───────┬────────┘
                      │
              ┌───────┴────────┐
              │                │
         ┌────▼─────┐    ┌─────▼────┐
         │  Quote   │    │   View   │
         │ Request  │    │  Quotes  │
         └────┬─────┘    └─────┬────┘
              │                │
         ┌────▼─────┐    ┌─────▼────┐
         │  Save to │    │  Filter  │
         │ Database │    │  Search  │
         └────┬─────┘    │ Download │
              │          └──────────┘
         ┌────▼─────┐
         │Send Email│
         │(Web3Forms)│
         └──────────┘
```

---

## Database Relationships

```
┌──────────────────┐
│   auth.users     │  (Managed by Supabase)
│                  │
│ • id (UUID)      │
│ • email          │
│ • created_at     │
│ • user_metadata  │ ← Contains user's name
└────────┬─────────┘
         │
         │ 1:N relationship
         │
         ▼
┌──────────────────┐
│     quotes       │  (Your custom table)
│                  │
│ • id             │
│ • user_id (FK)   │ ← Links to auth.users.id
│ • quote_id       │
│ • created_at     │
│                  │
│ Customer Info:   │
│ • customer_name  │
│ • customer_email │
│ • customer_phone │
│                  │
│ Model Info:      │
│ • model_file_url │
│ • material       │
│ • quantity       │
│ • timeline       │
│ • finishing      │
│                  │
│ Pricing:         │
│ • base_cost      │
│ • material_cost  │
│ • total_cost     │
│                  │
│ Status:          │
│ • status         │ ← pending/reviewed/accepted
│ • admin_notes    │
└──────────────────┘
```

---

## Component Architecture

```
App.tsx
 │
 ├─── AuthProvider (Context)
 │     └─── Provides: user, signIn, signUp, signOut
 │
 ├─── Router
 │     │
 │     ├─── / (Main Page)
 │     │     │
 │     │     ├─── WelcomeModal
 │     │     │     ├─── SignUpModal
 │     │     │     └─── SignInModal
 │     │     │
 │     │     ├─── ModelViewer
 │     │     │     ├─── Header
 │     │     │     │     └─── UserMenu
 │     │     │     │
 │     │     │     ├─── QuoteRequestModal
 │     │     │     │     └─── Saves to DB
 │     │     │     │
 │     │     │     └─── Scene
 │     │     │
 │     │     └─── EmailVerificationModal
 │     │
 │     ├─── /my-quotes (Protected Route)
 │     │     │
 │     │     └─── MyQuotesPage
 │     │           ├─── QuoteCard (x N)
 │     │           │     ├─── Status Badge
 │     │           │     ├─── Quote Details
 │     │           │     └─── Download PDF Button
 │     │           │
 │     │           └─── Filters/Search
 │     │
 │     └─── /auth/callback
 │           └─── AuthCallback
 │                 └─── Handles email verification redirect
```

---

## API Call Flow

### Sign Up Flow:
```
User fills form
     │
     ▼
SignUpModal calls signUp()
     │
     ▼
supabase.auth.signUp({
  email,
  password,
  options: { emailRedirectTo: callback }
})
     │
     ▼
Supabase sends verification email
     │
     ▼
Show "Check your email" modal
     │
     ▼
User clicks link in email
     │
     ▼
Redirected to /auth/callback?token=...
     │
     ▼
AuthCallback component verifies token
     │
     ▼
supabase.auth.getSession()
     │
     ▼
User is logged in → Redirect to main app
```

### Submit Quote Flow:
```
User fills quote form
     │
     ▼
QuoteRequestModal.handleSubmit()
     │
     ├─── Upload file to Supabase Storage
     │
     ├─── Generate quote data
     │
     ├─── Save to database
     │     │
     │     ▼
     │   supabase.from('quotes').insert({
     │     user_id: currentUser.id,
     │     ...quoteData
     │   })
     │
     └─── Send email via Web3Forms
           │
           ▼
     Success → Show confirmation
```

### View Quotes Flow:
```
User navigates to My Quotes
     │
     ▼
MyQuotesPage.useEffect()
     │
     ▼
getUserQuotes()
     │
     ▼
supabase
  .from('quotes')
  .select('*')
  .eq('user_id', currentUser.id)
  .order('created_at', DESC)
     │
     ▼
Display quotes in cards
     │
     ├─── Show status badge
     ├─── Show quote details
     └─── Download PDF button
```

---

## Security Flow (RLS)

```
User makes request to database
     │
     ▼
Supabase checks JWT token
     │
     ├─── Valid token?
     │     │
     │     ├─── Yes → Extract user_id
     │     │          │
     │     │          ▼
     │     │     Check RLS Policy
     │     │          │
     │     │          ├─── SELECT: user_id matches?
     │     │          ├─── INSERT: user_id matches?
     │     │          └─── UPDATE: user_id matches?
     │     │                │
     │     │                ├─── Yes → Allow
     │     │                └─── No → Deny
     │     │
     │     └─── No → Reject request
     │
     ▼
Return data or error
```

---

## Email Verification States

```
┌──────────────┐
│ Unverified   │
│              │
│ • Can sign up│
│ • Can log in │
│ • Cannot     │
│   submit     │
│   quotes     │
└──────┬───────┘
       │
       │ Clicks verification link
       │
       ▼
┌──────────────┐
│  Verifying   │
│              │
│ • Processing │
│   token      │
│ • Updating   │
│   status     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Verified    │
│              │
│ • Can submit │
│   quotes     │
│ • Full access│
│ • View       │
│   history    │
└──────────────┘
```

---

## Session Management

```
User logs in
     │
     ▼
Supabase creates session
     │
     ├─── Access token (expires in 1 hour)
     └─── Refresh token (expires in 60 days)
          │
          │ Stored in localStorage
          │
          ▼
     App checks session on every page load
          │
          ├─── Valid? → Continue
          │
          └─── Expired?
                │
                ▼
           Refresh token valid?
                │
                ├─── Yes → Get new access token
                │
                └─── No → Redirect to sign in
```

This flow ensures users stay logged in across sessions!
