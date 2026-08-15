# Plan — Linux CI hermeticity repair

- **Phase:** Repository maintenance; no charter phase reopened
- **Status:** in progress
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

Use a small platform-specific ZIP listing/extraction adapter in the restore script: the existing
bsdtar path on macOS/Windows and Info-ZIP on Linux, while retaining the same name, type, collision,
membership, and digest checks. Replace the BSD-only duplicate-member test setup with a deterministic
ZIP fixture writer. Give Phase 9's pure validator deterministic row-envelope fixtures, and keep a
separate conditional integration test that rehashes the rights-bound rows when the NAS is attached.

## Steps

- [x] Confirm that `main` and the cleanup PR fail the same eleven tests.
- [ ] Implement and focus-test portable ZIP restore coverage.
- [ ] Make Phase 9 validator tests hermetic and retain attached-NAS byte verification.
- [ ] Run exact `TMPDIR=/private/tmp npm test` and record the result.
- [ ] Open, obtain green CI for, and merge the repair PR.
- [ ] Update the cleanup branch from repaired `main`, obtain green CI, and merge it.

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
