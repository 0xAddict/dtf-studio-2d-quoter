#!/usr/bin/env bash
# tests/email-pipeline-health.sh
#
# Contract-driven spec-gate runner for the kuva.dtfstudio.fi email pipeline.
# Assertions are NOT hand-mirrored — they are derived directly from:
#   tests/email-pipeline-spec-gate.json  (vendored copy, CI-portable)
#   — or —
#   dtf-helsinki-site/.harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json
#   (canonical, used as fallback when running inside the dtf-helsinki-site dev tree)
#
# Spec-gate source priority:
#   1. tests/email-pipeline-spec-gate.json (vendored; present in this repo; works in CI)
#   2. canonical contract.json in the sibling dtf-helsinki-site repo (local dev fallback)
#   → ERROR: exit 2 if neither is found
#
# Update the vendored copy with: bash tests/sync-spec-gate.sh
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

# Spec-gate source: vendored copy (CI-safe) → canonical contract.json (local dev fallback)
VENDORED_SPEC_GATE="$SCRIPT_DIR/email-pipeline-spec-gate.json"
CANONICAL_CONTRACT="$REPO_ROOT/../../dtf-helsinki-site/.harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json"

if [[ -f "$VENDORED_SPEC_GATE" ]]; then
  # CI-portable path: read spec_gate directly from vendored JSON array
  SPEC_GATE_SRC="$VENDORED_SPEC_GATE"
  SPEC_GATE_MODE="direct"   # file IS the spec_gate array, not a full contract
  CONTRACT_LABEL="vendored: $VENDORED_SPEC_GATE"
elif [[ -f "$CANONICAL_CONTRACT" ]]; then
  # Local dev fallback: extract spec_gate from canonical contract.json
  SPEC_GATE_SRC="$CANONICAL_CONTRACT"
  SPEC_GATE_MODE="contract" # file is full contract, need .spec_gate
  CONTRACT_LABEL="canonical: $CANONICAL_CONTRACT"
else
  echo "ERROR: spec-gate source not found." >&2
  echo "  Looked for vendored:  $VENDORED_SPEC_GATE" >&2
  echo "  Looked for canonical: $CANONICAL_CONTRACT" >&2
  echo "  Run 'bash tests/sync-spec-gate.sh' to create the vendored copy." >&2
  exit 2
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed" >&2
  exit 2
fi

PASS=0
FAIL=0
RESULTS=()

# jq filter differs: vendored file IS the array; canonical contract has it nested under .spec_gate
if [[ "$SPEC_GATE_MODE" == "direct" ]]; then
  JQ_ARRAY="."
else
  JQ_ARRAY=".spec_gate"
fi

TOTAL=$(jq "${JQ_ARRAY} | length" "$SPEC_GATE_SRC")

echo "=== kuva.dtfstudio.fi email pipeline health check ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Spec-gate: $CONTRACT_LABEL"
echo "Gates:     $TOTAL"
echo ""

# Iterate spec_gate[] from source file
for i in $(seq 0 $((TOTAL - 1))); do
  id=$(jq -r "${JQ_ARRAY}[$i].id" "$SPEC_GATE_SRC")
  intent=$(jq -r "${JQ_ARRAY}[$i].intent" "$SPEC_GATE_SRC")
  must_pass=$(jq -r "${JQ_ARRAY}[$i].must_pass" "$SPEC_GATE_SRC")

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
