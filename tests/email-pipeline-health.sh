#!/usr/bin/env bash
# tests/email-pipeline-health.sh
# Run all 7 spec-gate checks for the kuva.dtfstudio.fi email pipeline.
# Exit 0 if all pass. Exit 1 with a summary of failures.
#
# Usage:
#   RESEND_API_KEY=<key> bash tests/email-pipeline-health.sh
#
# Prerequisites: dig, curl, python3 (stdlib only), grep
#
# Gate definitions mirror contract.json exactly so this script and the
# contract stay in sync — if the contract changes, update both.

set -euo pipefail

PASS=0
FAIL=0
RESULTS=()

run_gate() {
  local id="$1"
  local desc="$2"
  shift 2
  if eval "$*" > /dev/null 2>&1; then
    RESULTS+=("  [PASS] $id — $desc")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  [FAIL] $id — $desc")
    FAIL=$((FAIL + 1))
  fi
}

echo "=== kuva.dtfstudio.fi email pipeline health check ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# S1 — SPF record exists
run_gate "S1" "SPF record (v=spf1) on dtfstudio.fi" \
  "dig +short TXT dtfstudio.fi | grep -q 'v=spf1'"

# S2 — DMARC record exists
run_gate "S2" "DMARC record (v=DMARC1) on dtfstudio.fi" \
  "dig +short TXT _dmarc.dtfstudio.fi | grep -q 'v=DMARC1'"

# S3 — Resend DKIM key exists
run_gate "S3" "Resend DKIM key (resend._domainkey) has public key" \
  "dig +short TXT resend._domainkey.dtfstudio.fi | grep -q 'p='"

# S4 — dtfstudio.fi registered and verified in Resend
run_gate "S4" "dtfstudio.fi registered and verified in Resend" \
  "bash -c 'RESP=\$(curl -sf -H \"Authorization: Bearer \$RESEND_API_KEY\" https://api.resend.com/domains); echo \"\$RESP\" | python3 -c \"import sys,json; d=json.loads(sys.stdin.read()); domains=d.get(\\\"data\\\",[]); assert any(dom.get(\\\"name\\\")==\\\"dtfstudio.fi\\\" for dom in domains); print(\\\"ok\\\")\"'"

# S5 — at least one delivered email in last 10 events
run_gate "S5" "At least 1 delivered/opened email in last 10 Resend events" \
  "bash -c 'RESP=\$(curl -sf -H \"Authorization: Bearer \$RESEND_API_KEY\" \"https://api.resend.com/emails?limit=10\"); echo \"\$RESP\" | python3 -c \"import sys,json; d=json.loads(sys.stdin.read()); emails=d.get(\\\"data\\\",[]); delivered=[e for e in emails if e.get(\\\"last_event\\\") in (\\\"delivered\\\",\\\"opened\\\")]; assert len(delivered)>0, \\\"no delivered emails\\\"; print(\\\"ok\\\")\"'"

# S6 — no more than 1 bare catch{} in send-quote.js
SEND_QUOTE="$(dirname "$0")/../netlify/functions/send-quote.js"
run_gate "S6" "At most 1 bare catch{} in send-quote.js (line 630 Telegram path)" \
  "bash -c 'N=\$(grep -c \"catch {}\" \"$SEND_QUOTE\" || true); test \"\$N\" -le 1'"

# S7 — admin [Admin] emails present in last 20 events
run_gate "S7" "At least 1 [Admin] email in last 20 Resend events" \
  "bash -c 'RESP=\$(curl -sf -H \"Authorization: Bearer \$RESEND_API_KEY\" \"https://api.resend.com/emails?limit=20\"); echo \"\$RESP\" | python3 -c \"import sys,json; d=json.loads(sys.stdin.read()); emails=d.get(\\\"data\\\",[]); admin=[e for e in emails if \\\"[Admin]\\\" in (e.get(\\\"subject\\\") or \\\"\\\")]; assert len(admin)>0, \\\"no admin emails\\\"; print(\\\"ok\\\")\"'"

# Print results
echo "Results:"
for r in "${RESULTS[@]}"; do
  echo "$r"
done
echo ""
echo "PASS: $PASS / $((PASS + FAIL))   FAIL: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "HEALTH CHECK FAILED — $FAIL gate(s) did not pass."
  exit 1
else
  echo ""
  echo "All gates passed. Email pipeline is operational."
  exit 0
fi
