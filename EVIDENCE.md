# Email Pipeline Evidence — Reproducibility Guide

This document describes how to re-run every evidence-collection step used in
`EPIC_LOG.md`. Anyone with `RESEND_API_KEY` and network access can replay these.

---

## Prerequisites

```bash
export RESEND_API_KEY=<key from /Users/xavierandre/Alpha_Order_Management/.env>
```

---

## 1. DNS chain verification

```bash
# SPF record (S1 gate)
dig +short TXT dtfstudio.fi

# SPF include expansion (what IPs are authorised)
dig +short TXT _spf.google.com

# DMARC record (S2 gate)
dig +short TXT _dmarc.dtfstudio.fi

# DKIM key (S3 gate)
dig +short TXT resend._domainkey.dtfstudio.fi

# MX records (to understand where inbound mail goes)
dig +short MX dtfstudio.fi

# Name servers
dig +short NS dtfstudio.fi
```

Expected state (as of 2026-05-23):
- SPF: `v=spf1 include:_spf.google.com ~all` (softfail; Google IPs only)
- DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@alpha-performance.com`
- DKIM: RSA public key present (`p=MIGfMA0G...`)
- MX: `smtp.google.com` (Google Workspace)
- NS: Namecheap nameservers

Artifacts: `evidence/iter-2/dns-chain.txt`

---

## 2. Resend domain registration check (S4 gate)

```bash
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/domains | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
for dom in d.get('data', []):
    print(dom.get('name'), dom.get('status'), dom.get('region'))
"
```

Expected: `dtfstudio.fi verified eu-west-1`

Artifact: `evidence/iter-2/resend-domains-raw.json`

---

## 3. Resend events analysis (S5 + S7 gates)

```bash
# Fetch last 50 emails
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/emails?limit=50" | python3 -c "
import sys, json
from collections import defaultdict
d = json.loads(sys.stdin.read())
emails = d.get('data', [])
events = defaultdict(int)
for e in emails: events[e.get('last_event','?')] += 1
print('Event counts:', dict(events))
admin = [e for e in emails if '[Admin]' in (e.get('subject') or '')]
print('Admin emails:', len(admin))
delivered = [e for e in emails[:10] if e.get('last_event') in ('delivered','opened')]
print('Delivered in last 10:', len(delivered))
"
```

Artifact: `evidence/iter-2/resend-emails-last50-redacted.json`

To get full event history with delivery breakdown by recipient domain, run the
analysis script in `EPIC_LOG.md §A`.

---

## 4. Bare catch{} count (S6 gate)

```bash
grep -n "catch {}" netlify/functions/send-quote.js
```

Expected: exactly 1 result — line 630 (Telegram alert path).

---

## 5. Live end-to-end smoke test

POST a minimal quote to the live function. Requires knowing the production Netlify URL.

```bash
# The function is deployed at kuva.dtfstudio.fi/.netlify/functions/send-quote
# Use a real deliverable address for `to` and `adminEmail`
curl -s -X POST https://kuva.dtfstudio.fi/.netlify/functions/send-quote \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "adminEmail": "admin@dtfstudio.fi",
    "quoteId": "SMOKE-MANUAL-'$(date +%s)'",
    "customerName": "Test User",
    "quoteEur": 42.50,
    "sheetCount": 3,
    "material": "cotton",
    "sizeCm": {"width": 30, "height": 40, "quantity": 5}
  }' | python3 -m json.tool
```

Then verify delivery in Resend:

```bash
# Poll for the email (replace SMOKE-MANUAL-XXXX with your quoteId)
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/emails?limit=5" | python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
for e in d.get('data', []):
    print(e.get('created_at','')[:19], e.get('last_event',''), e.get('subject','')[:60])
"
```

Expected: two emails within seconds — one customer, one `[Admin]`, both `delivered`
within ~60s of the POST.

---

## 6. Run all 7 spec gates as one command

```bash
bash tests/email-pipeline-health.sh
```

See `tests/email-pipeline-health.sh` for the complete gate runner.

---

## Artifact index

| File | Contents | Gate |
|------|----------|------|
| `evidence/iter-2/dns-chain.txt` | Raw `dig +short` outputs for all DNS records | S1, S2, S3 |
| `evidence/iter-2/resend-domains-raw.json` | Full Resend `/domains` API response | S4 |
| `evidence/iter-2/resend-emails-last50-redacted.json` | Last 50 Resend email events (PII redacted) | S5, S7 |
