#!/usr/bin/env bash
# tests/sync-spec-gate.sh
#
# Sync the vendored spec_gate copy from the canonical contract.json.
#
# Usage:
#   bash tests/sync-spec-gate.sh          # update vendored copy
#   bash tests/sync-spec-gate.sh --check  # drift-check only (no write); exits 1 if drift
#
# The canonical contract lives in the dtf-helsinki-site sibling repo.
# This script is intended for LOCAL developer use. In CI the vendored copy is
# already present in-repo; CI only runs --check to verify it hasn't drifted.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

VENDORED="$SCRIPT_DIR/email-pipeline-spec-gate.json"
CANONICAL="$REPO_ROOT/../../dtf-helsinki-site/.harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json"

CHECK_ONLY=0
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=1
fi

# --check mode: canonical may not be present (CI). If absent, skip drift check.
if [[ $CHECK_ONLY -eq 1 ]]; then
  if [[ ! -f "$CANONICAL" ]]; then
    echo "sync-spec-gate.sh --check: canonical contract not present (expected in CI). Drift check skipped."
    exit 0
  fi
fi

if [[ ! -f "$CANONICAL" ]]; then
  echo "ERROR: canonical contract.json not found at: $CANONICAL" >&2
  echo "       Are you in the dtf-studio-2d-quoter worktree with dtf-helsinki-site as a sibling?" >&2
  exit 2
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required but not installed" >&2
  exit 2
fi

FRESH=$(jq '.spec_gate' "$CANONICAL")

if [[ ! -f "$VENDORED" ]]; then
  if [[ $CHECK_ONLY -eq 1 ]]; then
    echo "ERROR: vendored spec-gate file missing: $VENDORED" >&2
    exit 1
  fi
  echo "$FRESH" > "$VENDORED"
  echo "Created vendored copy: $VENDORED"
  exit 0
fi

CURRENT=$(cat "$VENDORED")

if [[ "$FRESH" == "$CURRENT" ]]; then
  echo "No drift detected. Vendored copy is up to date."
  exit 0
fi

echo "DRIFT DETECTED between canonical contract and vendored copy."
echo ""
diff <(echo "$CURRENT") <(echo "$FRESH") || true
echo ""

if [[ $CHECK_ONLY -eq 1 ]]; then
  echo "ERROR: Run 'bash tests/sync-spec-gate.sh' to update the vendored copy." >&2
  exit 1
fi

echo "$FRESH" > "$VENDORED"
echo "Vendored copy updated: $VENDORED"
echo "Commit tests/email-pipeline-spec-gate.json along with any contract.json changes."
