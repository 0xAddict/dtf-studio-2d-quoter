# email-pipeline-spec-gate.json

This is a vendored snapshot of the `spec_gate` array from the canonical contract:

```
dtf-helsinki-site/.harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json
field: spec_gate[]
```

## Why it exists

`tests/email-pipeline-health.sh` derives all 7 gate assertions from this array at
runtime. In CI (GitHub Actions), only `dtf-studio-2d-quoter` is checked out — the
sibling `dtf-helsinki-site` repo is not present. Vendoring this array makes the health
check self-contained in CI.

## Keeping it in sync

Run `tests/sync-spec-gate.sh` whenever the canonical contract changes. The script
diffs the current vendored copy against the canonical and fails loudly if they differ.

```bash
# Update vendored copy from canonical
bash tests/sync-spec-gate.sh

# Check only (used by CI drift check step)
bash tests/sync-spec-gate.sh --check
```

## Canonical location

The canonical `contract.json` lives in the `0xAddict/dtf-helsinki-site` repo:

```
.harness/program/dtf-2026-05/epics/00-kuva-email-debug/contract.json
```

Do NOT edit `email-pipeline-spec-gate.json` directly — edit the canonical contract
and then run `sync-spec-gate.sh`.
