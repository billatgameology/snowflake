# Validation — NAS asset governance implementation unit

- **Date:** 2026-08-15
- **Runner:** coordinator/developer session on macOS
- **Scope:** final pre-commit code, catalogue, policy, bootstrap, and legacy-restore unit

## Combined governance boundary

The coordinator ran:

```text
TMPDIR=/private/tmp npx vitest run runner/test/nas-asset-lib.test.ts runner/test/nas-assets-catalog.test.ts runner/test/nas-assets.test.ts runner/test/nas-mount-identity.test.ts runner/test/nas-asset-bootstrap.test.ts runner/test/nas-asset-transaction-lib.test.ts runner/test/nas-asset-selection-lib.test.ts runner/test/nas-asset-legacy-restore.test.ts runner/test/nas-asset-restore-cli.test.ts runner/test/gutcheck-build-index-catalog.test.ts runner/test/vite-nas-serving.test.ts runner/test/phase9-nas.test.ts
npm run typecheck
npm run lint:rule7
```

The focused command exited 0 with 12 test files and 229 tests passed. Both typechecks exited 0.
Rule 7 was clean over 1,006 scanned files.

## Exact repository suite

The required macOS command ran after the final executable, test, catalogue, and operational-doc
repairs:

```text
TMPDIR=/private/tmp npm test
```

It exited 0. Rule 7 was clean over 1,006 files; both typechecks passed; Vitest reported 129 test
files passed, 2,209 tests passed, 7 skipped, and duration 415.63 seconds. The process started at
17:44:55 local time. No suite result was inferred from a focused command. An earlier green run
predated the final ledger/catalogue corrections, and another attempt was stopped after concurrent
working-tree edits were detected; neither superseded run supplies this result. The cited run used
the isolated immutable governance worktree.

## Closing review provenance and limits

The reviewer was an OpenAI Codex GPT-5-family non-author subagent with shared
coordinator/developer context. It independently inspected the immutable tree; ran the 12-file / 229
test boundary, both typechecks, Rule 7, and diff checks; recomputed the catalogue/ledger and tracked
manifest bindings; and ran attached read-only owner-manifest verification plus bootstrap dry-run.
A separate non-author legacy-restore reviewer replayed the forged-catalogue exploit recorded in
[`nas-asset-legacy-restore-20260815.md`](nas-asset-legacy-restore-20260815.md).

The exact full-suite run above was performed by the coordinator/developer session, not by the
reviewer. The review did not rerun that full suite, enumerate the attached share, hash or restore
payloads, write the NAS, execute Windows `S:/` or SMB/ACL behavior, verify an independent backup,
handle credential custody, publish a forward transaction, or execute a prune. Five unrelated
education/Phase-9 working-tree files were outside the immutable reviewed tree. Closing verdict:
**PASS — zero blockers**.
