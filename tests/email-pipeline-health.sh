#!/usr/bin/env bash
# tests/email-pipeline-health.sh
#
# Contract-driven spec-gate runner for the kuva.dtfstudio.fi email pipeline.
# Assertions are NOT hand-mirrored — they are derived directly from:
#   .harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json
#   (field: spec_gate[].must_pass)
#
# At startup the script locates contract.json relative to the repo root
# (resolved via the script's own path so invocation directory is irrelevant),
# then uses jq to iterate spec_gate[], executing each must_pass command in a
# subshell. Adding, removing, or editing a gate in contract.json is the single
# source of truth — this script needs no corresponding edit.
#
# Usage:
#   RESEND_API_KEY=<key> bash tests/email-pipeline-health.sh
#
# Prerequisites: jq, bash ≥4, dig, curl, python3 (stdlib only), grep
#
# Exit 0 if all gates pass. Exit 1 with a per-gate summary of failures.

set -uo pipefail

# Resolve paths relative to the script itself so the script is path-portable
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# contract.json lives in the dtf-helsinki-site harness tree, two levels above the repo root
# Repo root is: /Users/xavierandre/dtf-studio-2d-quoter-wt/dtf-program-00-kuva-email-debug
# So ../../ = /Users/xavierandre/ then dtf-helsinki-site/...
CONTRACT="$REPO_ROOT/../../dtf-helsinki-site/.harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json"

if [[ ! -f "$CONTRACT" ]]; then
  echo "ERROR: contract.json not found at: $CONTRACT" >&2
  exit 2
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed" >&2
  exit 2
fi

PASS=0
FAIL=0
RESULTS=()

TOTAL=$(jq '.spec_gate | length' "$CONTRACT")

echo "=== kuva.dtfstudio.fi email pipeline health check ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Contract:  $CONTRACT"
echo "Gates:     $TOTAL"
echo ""

# Iterate spec_gate[] from contract.json
for i in $(seq 0 $((TOTAL - 1))); do
  id=$(jq -r ".spec_gate[$i].id" "$CONTRACT")
  intent=$(jq -r ".spec_gate[$i].intent" "$CONTRACT")
  must_pass=$(jq -r ".spec_gate[$i].must_pass" "$CONTRACT")

  # Run the must_pass command in a subshell; silence stdout/stderr for clean output
  if (eval "$must_pass") > /dev/null 2>&1; then
    RESULTS+=("  [$((i+1))/$TOTAL] $id: PASS — $intent")
    PASS=$((PASS + 1))
  else
    RESULTS+=("  [$((i+1))/$TOTAL] $id: FAIL — $intent")
    FAIL=$((FAIL + 1))
  fi
done

echo "Results:"
for r in "${RESULTS[@]}"; do
  echo "$r"
done
echo ""
echo "PASS: $PASS / $TOTAL   FAIL: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "HEALTH CHECK FAILED — $FAIL gate(s) did not pass."
  exit 1
else
  echo ""
  echo "All gates passed. Email pipeline is operational."
  exit 0
fi
