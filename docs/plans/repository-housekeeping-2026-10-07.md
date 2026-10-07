# Plan — Repository housekeeping

- **Phase:** cross-cutting maintenance; no scientific phase reopened
- **Status:** in progress
- **Started:** 2026-10-07
- **Last touched:** 2026-10-07 by Codex
- **Worktree:** `C:/Users/biao3/Documents/GitHub/snowflake-housekeeping`
- **Branch:** `chore/repository-housekeeping-2026-10-07`, from `7c58f8b`

## Goal

Make the merged repository straightforward to resume on this Windows computer: current live
records, reproducible tests and gallery recovery, explicit retired commands, consistent metadata
ignore rules, and removal of reviewed redundant local bytes. Review NAS retention by collection
and custody batch. Preserve accepted science, original evidence, private sources and gallery inputs.

## Done when

This maintenance task has no charter milestone. The compact progress index has at most 250 lines,
links retained chronology and actual active plans, and contains no instructions to use removed
worktrees. README, plan headers, host descriptions and retention guidance agree with current state.
Historical tests use their exact registered inputs without rewriting scientific pins. The stable
final `npm test` exits zero; app build and a live gallery smoke pass. A tracked restore command
recovers the registered gallery inputs by digest. Exact local cleanup targets are verified before
removal and receipts remain. NAS disposition records distinguish retained sources, verified
duplicates, scratch and unresolved material; unknown or insufficiently preserved bytes stay intact.

## Approach

Run one immutable primary-checkout baseline while implementation proceeds in the task worktree.
Split documentation, historical test fixtures and portable tooling into non-overlapping lanes.
Use original Git/archive bytes for historical tests and retain present-source drift/refusal checks;
never repin accepted evidence to current source to make a test pass. Use focused checks during work,
then exact `npm test` once the mixed evidence/test/configuration changes are stable, as Rule 6 requires.
No new scientific campaign or phase gate is launched.

Operational logs and cleanup/NAS inventories live in primary `out/housekeeping-2026-10-07/`.
Preserve the two frozen progress archives and tombstones; save the present live index as a separate
dated historical record before compaction. Use the existing NAS catalogue, owner manifests,
receipts and restore verifier for retention review. Broad deletion and guessed classification are
outside the authorized cleanup. The maker has approved the previously named redundant local files
and optional verified packed restore; execute only those exact targets after final checks.

## Steps

- [x] Capture exact immutable baseline command, logs, results and failure names.
- [x] Compact live state; repair README, host/retention guidance and completed plan headers.
- [ ] Repair historical catalog/source/recovery fixtures and Windows CLI path handling.
- [x] Retire the forbidden legacy publisher entry point; preserve historical derivation controls.
- [x] Add precise research metadata ignore exceptions and exact development runtime selection.
- [x] Track the smallest gallery restore command and verify it against existing exact inputs.
- [ ] Review NAS collection/custody inventories and record bounded dispositions.
- [ ] Verify and remove `app/dist/`, the downloaded Node ZIP, duplicate Run B download, and the
      packed readiness science restore. Retain canonical assets, logs, scripts and receipts.
- [ ] Run final required checks, record results, reconcile task state into local primary main,
      remove the empty task worktree/ref. Do not push automatically.

## Out of scope

Solver evolution, numerical expectations, accepted ADRs/charter, frozen evidence bytes, scientific
labels, Phase 7 or retired S6 execution, the other computer's film branch, copyrighted/private media
publication, and deletion of unclassified NAS material or original workstation outputs.

## Execution record

- Immutable primary `7c58f8b`, Node v24.13.1: `npm.cmd test` exited 1 after 675.50 seconds;
  27 files failed / 195 passed, 77 tests failed / 2,826 passed / 46 skipped. Command identity,
  complete stdout/stderr, failure names and exit record are in primary
  `out/housekeeping-2026-10-07/baseline-invocation.json`, `baseline.log`,
  `baseline.error.log` and `baseline-result.json`. This is the fresh baseline, not a gate result.
- Documentation checkpoint `c05b204` preserves the exact old index in a separate dated archive,
  compacts current state, and corrects setup, retention and completed-plan guidance. Tooling
  checkpoint `fa81419` supplies portable CLI entry detection, exact runtime selection, precise
  public metadata ignore exceptions, and refusal of the retired legacy publisher.
- `npm.cmd run gallery:restore` in the fresh task worktree restored all 151 registered inputs,
  totaling 380,366,718 bytes, without running a solver. The 150 NAS rows are bound to the existing
  render-closeout owner; Run B is bound to its registered digest and existing public asset.
  Primary `out/housekeeping-2026-10-07/gallery-fresh-restore.log` and the task's
  `out/growth-gallery/restore.json` record the exact rows. The command also verified primary's
  existing inputs and placed its missing local Run B copy; the sibling website copy remains.
  `npx.cmd vitest run runner/test/growth-gallery-restore.test.ts runner/test/growth-study-assets.test.ts`
  passed 9 tests; `npm.cmd run typecheck` passed. Their named `gallery-restore-focused` and
  `gallery-typecheck` logs/exit records are in the primary housekeeping directory.
- A fresh Windows reproduction found that a same-length edit can retain file timestamps during
  a restore copy. The NAS restore lane is adding a bounded reread of the same source descriptor;
  source identity checks and the corruption negative controls remain required.

## Tried and rejected

- Blanket `out/` deletion: the live gallery and current recovery receipts reside there.
- Repinning frozen evidence to changed source: this would erase the historical contract.
- Treating the recorded 70 failures as today's count: permissions and focused repairs changed
  since that integration run, so a new immutable baseline is required.

## Open questions

Any NAS batch lacking independent recovery or an exact duplicate identity remains retained with
its missing requirement named. That is a retention decision, not permission to discard it.
