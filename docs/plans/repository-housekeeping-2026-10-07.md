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
- [x] Repair historical catalog/source/recovery fixtures and Windows CLI path handling.
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
  a restore copy. Checkpoint `8dc0ee5` adds a bounded reread of the same source descriptor;
  source identity checks and all named corruption negative controls remain. Its focused suite
  passed 19 tests (`nas-restore-focused.log`). Windows ancestor-rename refusal and Phase 8
  original-publication fixtures passed 9 and 18 tests (`phase9-source-windows-focused.log`,
  `phase8-historical-focused.log`), without new skips or accepted pin changes.
- Historical checkpoints `57a1c4b` and `ace7183` retain original Git inputs and two digest-bound
  project-owned recovery archives as test-only fixtures. The combined `npx.cmd vitest run`
  over the 23 affected historical/progress test files passed 218 tests in 184.51 seconds;
  `historical-focused.log` and its error/exit record name the execution. The final catalog-only
  refinement passed 47 tests in 10 files (`catalog-focused-final.log`). Current source drift
  refusal controls remain; retired S6 attempts are test data, not an executable campaign queue.
- Product verification is complete: `npm.cmd run build --workspace app` exited zero, and the
  live `app/scripts/growth-gallery-smoke.mjs` and `app/scripts/dendrite-study-preview.mjs` checks
  exited zero against the task server on loopback port 5191. The gallery decoded 151 previews;
  Run B reached all 961,597 registered events with no browser errors. Exact executed URLs,
  commands, output and exit files are in primary `out/housekeeping-2026-10-07/` under
  `app-build`, `gallery-browser` and `run-b-browser`. The task restore receipt and all smoke
  reports/screenshots are preserved in that directory's `task-verification/` custody tree.
- Primary `local-prune-preview.json` inventories the four approved targets at 846,636,474 bytes.
  The local science recovery probe passed a fresh `npm.cmd run assets:verify-restored --
  --collection post-phase10-science-output@2026-10-01 --from
  out/restores/host-readiness-science-2026-10-07`: 15 files / 304,047,835 bytes, exact owner tree
  `7b512af0ca229cc6ea5ef21594d1a8dfb773be217b346fed5777865698c6802f`, recorded in
  `science-prune-verification.log`. Its removal is the maker-approved disposal of a redundant
  local recovery probe; original workstation outputs and governed collection custody remain.

## Tried and rejected

- Blanket `out/` deletion: the live gallery and current recovery receipts reside there.
- Repinning frozen evidence to changed source: this would erase the historical contract.
- Treating the recorded 70 failures as today's count: permissions and focused repairs changed
  since that integration run, so a new immutable baseline is required.

## Open questions

Any NAS batch lacking independent recovery or an exact duplicate identity remains retained with
its missing requirement named. That is a retention decision, not permission to discard it.
