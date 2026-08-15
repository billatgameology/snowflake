# Plan — Linux CI hermeticity repair

- **Phase:** Repository maintenance; no charter phase reopened
- **Status:** done
- **Started:** 2026-08-15
- **Last touched:** 2026-08-15 by OpenAI Codex GPT-5

## Goal

Restore the required GitHub Actions `npm test` check without weakening archive validation or
misrepresenting NAS-only Phase 9 artifacts as CI evidence. Land this independently of the pending
Phase 9 closeout cleanup so that the cleanup can be judged against a green `main` baseline.

## Done when

The archive hardening tests run with the ZIP tooling available on macOS, Windows, and GitHub's
Ubuntu runner; the Phase 9 M-PK unit tests exercise the pure validator without requiring a mounted
NAS while an explicit attached-NAS integration test still verifies the registered source bytes;
exact `TMPDIR=/private/tmp npm test` passes locally; the repair PR's required `test` check passes;
and only then are the repair and pending cleanup PRs merged in that order.

## Approach

Use a small platform-specific ZIP listing/extraction adapter in the restore script: Info-ZIP on
macOS/Linux and the explicit System32 bsdtar path on Windows, while retaining the same name, type, collision,
membership, and digest checks. Replace the BSD-only duplicate-member test setup with a deterministic
ZIP fixture writer. Give Phase 9's pure validator deterministic row-envelope fixtures, and keep a
separate conditional integration test that rehashes the rights-bound rows when the NAS is attached.

## Steps

- [x] Confirm that `main` and the cleanup PR fail the same test set.
- [x] Implement and focus-test portable ZIP restore coverage.
- [x] Make Phase 9 validator tests hermetic and retain attached-NAS byte verification.
- [x] Run exact `TMPDIR=/private/tmp npm test`: 117/117 files and 1,985 passed / 7 skipped
  (`out/checks/npm-test-ci-linux-hermeticity.log`, SHA-256 `2e3891a1…31ea`).
- [x] Open, obtain green CI for, and merge [repair PR #6](https://github.com/billatgameology/snowflake/pull/6).
- [x] Update the cleanup branch from repaired `main`; its required green CI gates the merge.

## Out of scope

- Changing scientific results, Phase 9 registrations, or rights boundaries.
- Skipping archive security controls or treating an unavailable NAS as a successful byte check.
- Folding the repair into the unrelated cleanup commit.

## Tried and rejected

- Merging over the red required check: rejected because the same baseline defect would remain.
- Installing a particular tar implementation only in CI: rejected because production restore is
  documented as cross-platform and must select tooling it can actually drive.
- Tracking the NAS-only normalized rows: rejected because their recorded rights boundary keeps the
  row bodies off Git.

## Open questions

None.

## Review record

OpenAI Codex GPT-5, non-author with shared parent context, reviewed the ZIP adapter and fixtures plus
the hermetic/NAS test split. It independently ran the focused tests and typecheck and found no code
or test-semantic blockers. Limits: no independent full-suite, Ubuntu, or Windows execution; macOS
Info-ZIP and attached-NAS paths were executed.
