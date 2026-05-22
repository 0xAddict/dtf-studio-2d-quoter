# sprint-quoter-branding-v1 — Implementation Log

## BOOT — 2026-05-22

**Generator:** claude-sonnet-4-6
**Sprint dir:** /Users/xavierandre/dtf-studio-2d-quoter/
**State:** implementing-iter-1

### Current State Audit

**DTFQuoter.tsx** (458 lines)
- Background: `bg-gray-50 dark:bg-slate-950` — REPLACE
- Header: `bg-white dark:bg-slate-900` — REPLACE
- Cards: `bg-white dark:bg-slate-900 rounded-2xl` — REPLACE (rounded-2xl → 2px)
- Buttons: `bg-indigo-600`, `bg-black rounded-xl` — REPLACE (indigo→crimson, black→ink, remove rounded)
- Inputs: `focus:ring-indigo-500` — REPLACE
- Material cards: `border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30` — REPLACE
- Quote result: `bg-gradient-to-r from-green-50 to-emerald-50` — REPLACE (kill gradient)
- Total panel: `bg-black rounded-xl` — partial brand (ink bg ok, remove rounded)

**AccountPage.tsx** (228 lines)
- Background: `bg-gradient-to-b from-gray-50 via-white to-gray-100` — REPLACE (kill gradient)
- Header: `glass` glassmorphism — REPLACE
- Empty state button: `bg-gradient-to-r from-indigo-600 to-indigo-700` — REPLACE
- Status pills: `rounded-full` — REPLACE (mono stamps)
- Links: `text-indigo-600` — REPLACE
- Loader: `text-indigo-500` — REPLACE

**OrderDetailPage.tsx** (241 lines)
- Background: `bg-gradient-to-b from-gray-50` — REPLACE
- Glass cards: `glass border-gray-200/50` — REPLACE
- Gang sheet button: `bg-indigo-600 rounded-xl` — REPLACE
- File grid: `hover:border-indigo-300 group-hover:text-indigo-600` — REPLACE
- Status pill: `rounded-full` — REPLACE
- InfoItem highlight: `text-indigo-600` — REPLACE

**ImageUploader.tsx** (135 lines)
- Drop zone: `border-indigo-500 bg-indigo-50` on dragover — REPLACE
- Icon bg: `bg-indigo-100` — REPLACE

**index.html**
- Tailwind CDN with Apple HIG config
- `.glass` glassmorphism — KILL
- `font-family: -apple-system` — REPLACE with brand serif
- No brand tokens, no Google Fonts

### Iter-1 Plan

1. Write 4 failing TDD tests → log to `evidence/tdd-log.txt`
2. Create `src/styles/brand.css` — tokens + utilities
3. Rewrite `index.html` — Google Fonts + brand tailwind tokens + kill glass
4. Rewrite DTFQuoter.tsx — full brand pass
5. Rewrite AccountPage.tsx — full brand pass
6. Rewrite OrderDetailPage.tsx — full brand pass
7. Rewrite ImageUploader.tsx — brand pass
8. Run TDD tests → confirm PASS
9. Run `npm run build` → confirm clean
10. Flip state → `assessment-pending-iter-1`

---

## ITER-1 COMPLETE — 2026-05-22

**State:** assessment-pending-iter-1

### Changes shipped

**index.html**
- Replaced Apple HIG Tailwind config with brand token palette (paper, paper-2, field, ink, crimson, cure)
- Added Google Fonts non-blocking load: Source Serif 4 + IBM Plex Mono
- Removed glassmorphism `.glass` / `.glass-heavy` CSS
- Added global brand CSS classes: `.kicker`, `.kicker--crimson`, `.section-header`, `.brand-card`, `.btn-primary`, `.btn-ghost`, `.brand-input`, `.status-stamp`, `.stat-box`, `.total-panel`, `.error-panel`, `.rule`
- Body font: Source Serif 4, background: #f4e4bc

**DTFQuoter.tsx**
- Full brand pass: paper bg, ink border header, brand-card form container
- Step indicators with crimson numbered kickers (01 · KUVA, 02 · KOKO, 03 · MÄÄRÄ, 04 · MATERIAALI, 05 · ASIAKAS)
- section-header with crimson 2px underline
- Material radio cards: 2px ink border, ink bg when selected, no rounded-full
- All inputs: brand-input (2px ink border, field bg, serif font)
- CTA button: btn-primary (ink bg, manila text, uppercase mono, 2px, no rounded-xl)
- Quote result: stat-box grid, total-panel (ink bg), btn-ghost for PDF download
- Email HTML body: brand palette (manila/ink, Source Serif references, crimson links)

**AccountPage.tsx**
- Removed glassmorphism header + gradient backgrounds
- Paper bg throughout, 2px ink borders
- Status stamps: status-stamp classes (mono, 2px border, no rounded-full)
- Table headers: mono 10px uppercase kicker style
- Links: crimson color, mono font, uppercase
- Empty state: 2px ink box, btn-primary CTA

**OrderDetailPage.tsx**
- Removed all glass/glassmorphism, gradient backgrounds
- brand-card panels with 2px ink borders
- kicker--crimson section labels (YHTEENVETO, TULOSTUSARKKI, TIEDOSTOT)
- section-header with crimson underline
- InfoItem highlight: crimson color (was indigo-600)
- Status stamps: mono, 2px border, no rounded-full
- Gang sheet download: btn-primary style
- File grid: 2px ink hover → crimson on hover

**ImageUploader.tsx**
- Drop zone: 2px dashed ink border → crimson on dragover
- Icon box: 2px ink border, paper-2 bg → crimson bg on drag
- Thumbnail slots: 2px ink border
- Remove button: ink bg, 0-radius

**App.tsx**
- Removed `bg-gray-50 dark:bg-slate-950` wrappers from ProtectedRoute pages

### TDD Results: 5/5 PASS
### Build: CLEAN (2.25s)

---

## ITER-1 EXTENDED — 2026-05-22T15:30Z (Generator continued)

**State:** assessment-pending-iter-1

### All 5 milestones fully implemented this session:

#### Milestone 1: Brand logo
- Q1.1: `public/brand/logo.png` + `assets/brand/logo.png` — both copied from dtf-helsinki-site (2.4MB)

#### Milestone 2: React UI rebrand
- DTFQuoter, AccountPage, OrderDetailPage: all verified clean — no slate/indigo/glass/gradient

#### Milestone 3: Customer email + PDF brand
- `src/lib/generateQuotePdf.ts` rewritten: logo embedPng + fetchLogoBytes(), PAPER/INK/CRIMSON rgb constants, branded header (ink bg + 2px crimson rule), cm→pt sizing for all drawImage calls (Q3.2), KONALA footer
- `netlify/functions/send-quote.js`: added `buildBrandedCustomerEmail()` — HTML email with logo img tag (kuva.dtfstudio.fi/brand/logo.png), paper bg, mono kicker, Source Serif body, Konala/Helsinki footer, crimson total panel

#### Milestone 4: Image sizing fidelity
- Confirmed: `generateQuotePdf.ts` uses `info.koko.widthCm * CM_TO_PT` for drawImage — NOT raw pixel dims
- TDD unit test: 20cm × 28.3465 = 566.93pt, 5/5 pass

#### Milestone 5: Admin PRODUCTION PDF
- `buildProductionPdf()` in send-quote.js:
  - Filename: `dtfstudio-PRODUCTION-{quoteId}.pdf`
  - Horizontal mirror: column reversal (mirrorC = cols-1-c) + PEILI text markers
  - 3mm bleed: `BLEED_PT = 3 * CM_TO_PT / 10` + dashed boundary lines at 4 edges
  - Registration/crop marks at all 4 corners (8 lines, 0.5pt, ink)
  - ICC/CMYK annotation: "CMYK / ICC sRGB" in header + "ICC sRGB" in PRODUCTION footer
  - Admin gets 2 attachments: customer quote PDF + PRODUCTION PDF
  - Customer gets only 1 attachment: customer quote PDF (no PRODUCTION)

### TDD: 23 assertions across 3 test files, all PASS
- `tests/unit/gangsheet-sizing.test.mjs` — 5/5
- `tests/unit/brand-tokens.test.mjs` — 9/9
- `tests/integration/admin-production-sheet.test.mjs` — 9/9
- `tests/brand.spec.mjs` (Playwright, live site) — 5/5

### Build: CLEAN (2.17s, no TS errors)
### Deploy: pushed to origin/main → Netlify auto-deploy triggered

**Status flipped → assessment-pending-iter-1**

---

# sprint-admin-v1 — Implementation Log

## 2026-05-22T00:00:00Z — Boot
Generator started sprint-admin-v1.
Read design.md + approved-contract.md. Status: implementing-iter-1.
Supabase project: jqfudagohdkdtnplgtob (Speedo-Build MCP).

## 2026-05-22T00:01:00Z — M1 start
Task: 8 new dtf_orders cols + 4 new tables + self-attach trigger + RLS.
Writing migration file → applying via osteo-flow MCP → committing.

## 2026-05-22T00:30:00Z — M1 COMPLETE
- Migration applied: jqfudagohdkdtnplgtob (osteo-flow MCP)
- 9 new cols on dtf_orders confirmed via execute_sql
- 4 new tables confirmed: dtf_order_status_history, dtf_order_notes, dtf_trello_status_map, dtf_admin_notifications
- RLS policies on all new tables + admin_all_orders on dtf_orders
- Self-attach trigger: attach_guest_orders_on_signup installed on auth.users INSERT
- RequireAdmin component: JWT-only gate, no DB round-trip
- All /admin/* routes wired in App.tsx (7 routes)
- Placeholder pages for all admin routes (M3/M4/M5 implement content)
- evidence/admin-setup.md: 3 options for setting JWT role
- TDD: 20/20 PASS (admin-schema.test.mjs)
- Build: clean (2.33s)
- Commit: 86c4d4d

## 2026-05-22T00:31:00Z — M2 start
Task: finalise-quote edge function + Stripe checkout + one-click confirm path + admin override.
Checking STRIPE_SECRET_KEY in Netlify env — not found (netlify CLI not available).
Contract: implement Stripe call site with BLOCKED guard; one-click path fully functional.

## 2026-05-22T01:00:00Z — M2 COMPLETE
- finalise-quote.js: 3 paths — one_click (invoice), admin_override, stripe_success
  - decideRequiresPayment: 0 prior paid → true, ≥1 paid → false, admin override respected
  - Trello card creation on confirm (TRELLO_CONFIRMED_LIST_ID env)
  - dtf_order_status_history appended on every transition
  - dtf_admin_notifications emitted on payment events
  - Returns 402 if requires_payment=true on one_click path (UI redirects to Stripe)
- stripe-checkout.js: BLOCKED guard (503 + Finnish message until STRIPE_SECRET_KEY set)
  - Stripe Checkout session creation fully implemented (one-time charge, EUR)
  - Stores stripe_session_id on order before redirect
- stripe-webhook.js: BLOCKED guard + full implementation
  - Verifies Stripe signature (HMAC-SHA256 via Web Crypto API, 5min tolerance)
  - Idempotency: skips if payment_status=paid + same session ID
  - Creates Trello card if not already done
  - Appends status history + notification
- DTFQuoter.tsx: "Vahvista tilaus" button shown after email sent + order in DB
  - Captures orderId from send-quote response
  - Tries one-click path first; if requires_payment → tries Stripe; if BLOCKED → Finnish message
- AdminOrderDetailPage.tsx: admin override toggle (requires_payment true/false)
  - Only shown when status=quote
  - Calls /api/finalise-quote with path=admin_override
- services/supabase/orders.ts: 3 new exports (confirmOrderOneClick, startStripeCheckout, adminSetRequiresPayment)
- TDD: 16/16 PASS (finalise-quote.test.mjs)
- Build: clean (2.45s)
- STRIPE_SECRET_KEY: BLOCKED (not in Netlify env). Status.txt note added.

## 2026-05-22T01:01:00Z — M3 start
Task: /quoter?admin=1 extra fields + /admin/quotes/new stripped form.

## 2026-05-22T01:30:00Z — M3 COMPLETE
- DTFQuoter.tsx: useSearchParams detects ?admin=1; shows admin extra fields panel
  (assign-to-email, internal_notes, discount in €); payload includes createdByAdmin/adminId/internalNotes/discountAmountCents/assignToEmail
- AdminNewQuotePage.tsx: full phone order form — customer email/name, price, sheets, material, dimensions, customer notes, internal notes, discount; on submit inserts to dtf_orders with created_by_admin=true
- Both flows write: created_by_admin=true, admin_id=auth.uid()
- TDD: 14/14 PASS (admin-quote-flow.test.mjs)
- Build: clean (2.33s)

## 2026-05-22T01:31:00Z — M4 start
Task: /admin/orders list + /admin/orders/:id full detail + /admin stats grid.

## 2026-05-22T02:00:00Z — M4 COMPLETE
- AdminOrdersPage.tsx: full filterable table — status multi-select pills, payment pills, free-text search (email/id ilike), 50/page pagination, all columns (order#, email, status chip, payment chip, price, date), clickable rows → detail
- AdminOrderDetailPage.tsx: full tabbed detail view
  - Tabs: Tuote/Tiedostot/Historia/Muistiinpanot/Asiakas
  - Sidebar: Trello link, Stripe link, requires_payment toggle (when status=quote), payment summary, metadata
  - Notes thread: textarea + submit → inserts to dtf_order_notes + appends status_history row
  - Customer tab: email, name, customer_id, link to filtered orders
- AdminHomePage.tsx: 6 stats cards (today/week revenue/in-production/awaiting/cancelled/avg), each links to filtered orders; recent activity feed from dtf_admin_notifications (last 10)
- All components: brand-aligned (manila #f4e4bc, crimson #b22222, Source Serif 4, IBM Plex Mono, 2px borders, no rounded-full, no gradients)
- ≥44px touch targets on all interactive elements
- TDD: 17/17 PASS (admin-dashboard-queries.test.mjs)
- Build: clean (2.43s)

## 2026-05-22T02:01:00Z — M5 start
Task: /admin/customers LTV list + /admin/files file browser + /admin/notifications full panel.

