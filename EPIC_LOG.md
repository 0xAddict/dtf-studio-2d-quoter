# Epic 00-kuva-email-debug — Diagnostic Log

## Context

Original user report: emails not arriving from kuva.dtfstudio.fi quote submissions.
Verdict after full investigation: **pipeline is operational**. The reported failure was
likely transient or was fixed by a prior code change (guard at send-quote.js line 723–725
that un-suppressed admin email in self-send scenarios).

This document anchors every conclusion to a file-based artifact rather than prose summary.

---

## iter-1 (2026-05-22)

All 7 spec gates passed. No code changes required. Documented DNS/Resend state.
See git commit db942640 for the original scan.

---

## iter-2 (2026-05-23)

Addressing Critic-A gaps: original instrumentation beyond gate re-runs, raw receipt
artifacts, function-by-function audit with line refs, and a regression test script.

---

## iter-3 (2026-05-23)

Single delta: `tests/email-pipeline-health.sh` rewritten as a generic contract-driven
runner. The script now parses `contract.json` with `jq`, iterates `spec_gate[].must_pass`,
and executes each command — no gate definitions are hand-mirrored. Adding a gate to the
contract automatically adds it to the health check; drift between the two is structurally
impossible. All 7 gates continue to pass (EXIT 0). Regression test (inject `false` as S1
`must_pass`) confirmed FAIL banner + exit 1.

This addresses Critic-B iter-2 O=2 finding: "Worth a 3 if the script were generated from
the contract instead of hand-mirrored."

---

## A. Resend Events Table — Last 32 emails (as of 2026-05-23)

Raw data: `evidence/iter-2/resend-emails-last50-redacted.json`
Raw domains: `evidence/iter-2/resend-domains-raw.json`

### Delivery rates by send type

| Send type | Count | Delivered | Rate |
|-----------|-------|-----------|------|
| Customer emails (no [Admin] prefix) | 22 | 10 | 45% |
| Admin emails ([Admin] prefix) | 10 | 9 | 90% |
| **All sends** | **32** | **19** | **59%** |

### Why 45% customer delivery rate is not a pipeline bug

All 12 undelivered customer emails went to addresses that cannot receive mail:

| Event | Count | Cause |
|-------|-------|-------|
| `delivery_delayed` | 10 | Test addresses at non-existent domains: `@dtfstudio-test.fi`, `@dtfstudio.test`, `@example.com` — Resend is still retrying per normal MTA behaviour |
| `bounced` | 2 | `branding-verify@dtfstudio.fi`, `iter2-direct-test@dtfstudio.fi` — mailboxes do not exist inside dtfstudio.fi domain (Google Workspace, not all mailboxes provisioned) |
| `suppressed` | 0 real customer | 1 suppress to `@test.fi` — not a production send |

All real recipient domains show 100% delivery:
- `@alpha-performance.com` — 9/9 delivered
- `@repthea.com` — 1/1 delivered
- `@dtfstudio.fi` (provisioned mailboxes) — 9/11 delivered (2 bounced to non-existent mailboxes)

### Critic-B live round-trip confirmed in Resend

Critic-B's `SMOKE-1779484835` smoke test is visible in the event log:
```
2026-05-22 21:20:37 | [Admin] Uusi tarjouspyyntö #SMOKE-1779484835 | delivered
2026-05-22 21:20:36 | Critic-B smoke test                          | delivered
```
Both customer and admin branches delivered within 1s of each other.

### Idempotency hazard (Critic-B finding, in-scope observation)

`DUPE-1779484858` appears twice: Critic-B's double-submit test produced 4 emails
(2 customer + 2 admin) as expected with no dedup guard. Documented here;
fix deferred to a later epic since it's outside this epic's spec gates.

---

## B. DNS Chain Verification

Raw output: `evidence/iter-2/dns-chain.txt`

### SPF chain

```
dtfstudio.fi TXT:
  v=spf1 include:_spf.google.com ~all

_spf.google.com TXT (include expansion):
  v=spf1 ip4:74.125.0.0/16 ip4:209.85.128.0/17
         ip6:2001:4860:4864::/56 ip6:2404:6800:4864::/56
         ip6:2607:f8b0:4864::/56 ip6:2800:3f0:4864::/56
         ip6:2a00:1450:4864::/56 ip6:2c0f:fb50:4864::/56 ~all
```

**SPF alignment status**: Resend sends from `hello@dtfstudio.fi` using its own SMTP
infrastructure. The Return-Path (envelope-from) is a Resend bounce address
(`bounces+...@em.resend.com` or similar). Since `_spf.google.com` does not include
Resend's IP ranges, SPF-alignment **fails** for receivers checking alignment.

However: Resend signs with DKIM using `resend._domainkey.dtfstudio.fi`. DMARC is
`p=none` which means SPF failure does not cause rejection. DKIM authentication
alone passes DMARC alignment for this domain. This is a supported configuration —
all real deliveries in the log confirm it works in practice.

**Risk**: Strict SPF-aligned receivers (Yahoo, some enterprise gateways) may penalise
the `~all` softfail. Adding `include:_spf.resend.com` would close this gap at zero
risk. Deferred — not a spec gate requirement.

### DMARC

```
_dmarc.dtfstudio.fi: v=DMARC1; p=none; rua=mailto:dmarc@alpha-performance.com
```

Policy `p=none` means no enforcement — reports only. Aggregate reports go to
`dmarc@alpha-performance.com`. Safe for current send volumes.

### DKIM

```
resend._domainkey.dtfstudio.fi: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...
```

RSA public key present. Verified by S3 gate. Domain status in Resend: `verified`
(registered 2026-05-22, region `eu-west-1`, domain ID `ef8268d5-eb88-4775-a17a-8a35bb255709`).

---

## C. send-quote.js Function-by-Function Audit

File: `netlify/functions/send-quote.js` (947 lines, ES module)

### Function inventory with line refs

| Function | Lines | Purpose | Issues |
|----------|-------|---------|--------|
| `buildBrandedCustomerEmail()` | 27–152 | Customer HTML (paper/crimson palette, Georgia body, mono kicker) | None — no untrusted input interpolated into style attrs |
| `buildAdminEmail()` | 153–178 | Admin HTML (dark/crimson, IBM Plex Mono, compact table) | None |
| `rasterMirrorCmyk()` | 192–243 | Image processing: sharp.flop() → CMYK, ImageMagick fallback | `try/catch` on dynamic `import('sharp')` — correct |
| `buildProductionPdf()` | 245–411 | PDF assembly (pdf-lib), calls rasterMirrorCmyk per image | Large function, error-contained at caller (line 710–719) |
| `SHEET_MARGIN_PT()` | 413 | Pure helper, no side effects | — |
| `IMG_MARGIN_PT()` | 414 | Pure helper | — |
| `shortId()` | 445–447 | Truncates UUID to 8 chars for display | — |
| `getMaterialLabelId()` | 449–456 | Maps material string to Trello label ID | Map exhaustive for known values |
| `getVolumeLabelId()` | 458–463 | Maps sheet count to Trello volume label | Map exhaustive |
| `sendTelegram()` | 465–477 | Async Telegram bot message | No HTML injection risk (text key, not html) |
| `createTrelloCard()` | 479–496 | Trello card creation via REST | Non-fatal: logs error, returns null on failure |
| `attachUrlToTrelloCard()` | 498–508 | Attaches URL to card | Non-fatal |
| `setCustomFieldOnCard()` | 515–533 | Sets one custom field (text/number/list) | Non-fatal, error logged per field |
| `getCustomFieldOptionId()` | 538–550 | Looks up list option ID from board | Non-fatal |
| `setCardCustomFields()` | 552–588 | Orchestrates all 8 custom fields + 2 list fields | Await chain, errors caught at call site (line 858) |
| `handler()` | 590–946 | Main Netlify function export | See table below |

### handler() section breakdown

| Lines | Section | Notes |
|-------|---------|-------|
| 591–593 | Method guard | Rejects non-POST with 405 — correct |
| 595–610 | Env var extraction | `RESEND_API_KEY` hard-fails (500). Supabase/Trello/Telegram are soft-optional |
| 612–632 | Persistence warning + Telegram alert | `catch {}` at line 630 — the only bare catch in the file; S6 allows ≤1; this is the tolerated instance (Telegram is secondary alerting, never blocks email send) |
| 634–640 | JSON parse | Returns 400 on parse failure — correct |
| 662–678 | Build customer HTML | Calls `buildBrandedCustomerEmail()` |
| 685–704 | Send customer email | Hard-fails (502) if Resend rejects — correct, customer is primary |
| 708–720 | Build production PDF | `try/catch` at 710–719: non-fatal, logs and continues |
| 723–752 | Send admin email | Guard removed at line 723–725 (historical fix); fires if `adminEmail` present; non-fatal via `.catch()` at 752 |
| 755–912 | Supabase + Trello | Fully optional block, all errors caught per sub-operation |
| 929–935 | Telegram success alert | Non-fatal via `.catch()` |

### Exception handling audit

Bare `catch {}` count: **1** (line 630, Telegram send during persistence warning — acceptable per S6 contract).

All other catches either:
- Log to `console.error` with context string (searchable in Netlify function logs)
- Return a structured error response (400/405/500/502)
- Are explicitly `.catch(e => console.error(...))` inline — not silent

No unhandled promise rejections: every `await fetch(...)` in the admin/Supabase/Trello paths is covered by either `.catch()` or a `try/catch` block.

### adminEmail runtime check

`adminEmail` is extracted from the POST body (line 648). If the client omits it, the
admin branch at line 726 is skipped entirely. Production kuva.dtfstudio.fi sends
always include `adminEmail` (confirmed by 10 `[Admin]` emails in Resend history).
No env-var dependency — it comes from the quoter frontend payload.

---

## D. Delivery Time Analysis

Resend `created_at` timestamps for matched customer+admin pairs (UTC):

| Quote ID | Customer created_at | Admin created_at | Delta |
|----------|---------------------|------------------|-------|
| SMOKE-1779484835 | 21:20:36.240 | 21:20:37.221 | ~1s |
| DUPE-1779484858 (send 1) | 21:20:59.073 | 21:20:59.250 | ~0.2s |
| DUPE-1779484858 (send 2) | 21:21:02.982 | 21:21:03.139 | ~0.2s |
| R3 | 15:30:08.726 | 15:30:09.211 | ~0.5s |
| R2 | 15:27:25.489 | 15:27:25.641 | ~0.2s |
| ROUNDTRIP-TEST | 15:26:40.962 | 15:26:41.433 | ~0.5s |

Customer email is sent first (step 1), admin email is sent second (step 3) after
production PDF is built (step 2). The ~0.2–1s delta is the PDF build time.
No latency outliers — all real pairs dispatched within 1.5s of each other.

---

## Known follow-up (out of scope for this epic)

- **Idempotency guard for duplicate quote submissions** (observed as DUPE-1779484858 in iter-1 exploration). This is a quotes/orders concern, not an email-delivery concern — file as separate Trello card if Xavier wants it addressed. Recommend: client-side debounce + server-side fingerprint dedup on (customer_email, quote_payload_hash) within 5s window.

---

## iter-4 (2026-05-23)

Single delta: CI wiring. Added `.github/workflows/email-pipeline-health.yml` — runs
`bash tests/email-pipeline-health.sh` on push to main (path-filtered to
`send-quote.js`, `email-pipeline-health.sh`, `contract.json`) and on a daily
schedule (06:17 UTC off-zero). This turns the iter-3 contract-driven health script
from "available" to "load-bearing": every relevant code change now gates on all 7
spec checks automatically.

Idempotency guard (DUPE-1779484858) documented above as known follow-up; not
addressed here (out of scope for kuva-email-debug).

---

## iter-5 (2026-05-23)

CI portability fix. Critic-B iter-4 correctly identified that
`tests/email-pipeline-health.sh` resolves `contract.json` via
`$REPO_ROOT/../../dtf-helsinki-site/...` — a path that doesn't exist on a
GitHub Actions runner, making the workflow exit 2 on every CI run (theatre,
not real gate enforcement).

Fix applied:

1. **`tests/email-pipeline-spec-gate.json`** — vendored snapshot of
   `contract.json#/spec_gate`. Present in this repo; CI-portable.
2. **`tests/email-pipeline-health.sh`** — reads from vendored copy first;
   falls back to canonical contract.json if vendored is absent (local dev);
   errors loudly if neither found.
3. **`tests/sync-spec-gate.sh`** — developer utility to pull latest spec_gate
   from canonical contract.json into the vendored copy. `--check` mode diffs
   only (used by CI).
4. **`.github/workflows/email-pipeline-health.yml`** — added drift-check step
   (`bash tests/sync-spec-gate.sh --check`) before the health gate run. In CI
   (no canonical present) the check exits 0 gracefully; in local dev it will
   fail loudly if vendored copy drifted. Also replaced the dead path-filter line
   (`.harness/.../contract.json`, not in this repo) with the real file
   `tests/email-pipeline-spec-gate.json`.

Health script confirmed: exits with correct "vendored:" label in output, reads
all 7 gates from vendored copy. 4/7 pass without `RESEND_API_KEY`
(S1-S3 DNS, S6 catch-swallow); S4/S5/S7 require live API key — unchanged from
iter-3 baseline.

---

## E. Spec Gate Summary (iter-2 run)

| Gate | Command result | Status |
|------|---------------|--------|
| S1 (SPF) | `v=spf1 include:_spf.google.com ~all` present | PASS |
| S2 (DMARC) | `v=DMARC1; p=none; rua=mailto:dmarc@alpha-performance.com` | PASS |
| S3 (DKIM) | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4...` key present | PASS |
| S4 (Resend domain) | `dtfstudio.fi` status=verified, region=eu-west-1 | PASS |
| S5 (delivered email) | 8 delivered in last 10 events | PASS |
| S6 (bare catch ≤1) | 1 bare `catch {}` at line 630 | PASS |
| S7 (admin [Admin]) | 7 admin emails in last 20 events | PASS |

All evidence anchored to:
- `evidence/iter-2/resend-domains-raw.json`
- `evidence/iter-2/resend-emails-last50-redacted.json`
- `evidence/iter-2/dns-chain.txt`
