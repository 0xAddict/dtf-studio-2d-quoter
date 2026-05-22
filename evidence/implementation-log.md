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
