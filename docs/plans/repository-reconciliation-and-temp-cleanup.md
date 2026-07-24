# Plan — Repository reconciliation and temporary-workspace cleanup

- **Phase:** Cross-phase repository maintenance after Phase 2b v5p
- **Status:** in progress
- **Started:** 2026-07-23
- **Last touched:** 2026-07-23 by Codex

## Goal

Integrate the reviewed Phase 2b aggregate-v5/v5p history and passing terminal evidence into
`main`, preserve every load-bearing gate artifact under the stable ignored `out/` evidence tree,
remove redundant `.tmp-*` worktrees, repositories, and generated visual-control directories, and
leave a clean Git handoff with the next charter action stated truthfully.

## Done when

This maintenance task does not change a charter gate. It is complete when:

- every Phase 2b v5/v5p commit is reachable from `main`, including decisions 0013–0015,
  synchronized charter/spec changes, tests, and the reviewed concurrent runner;
- the terminal v5p log, empty stderr, exit-status file, and both authenticated checkpoints are
  preserved at stable paths with their byte lengths and SHA-256 values recorded;
- the v4 terminal evidence and interrupted sequential-v5 logs remain preserved and correctly
  classified;
- `docs/PROGRESS.md` and the Phase 2b plans record the v5p exit-0 result and close Phase 2b only
  against its registered metrics;
- the exact root test command passes on consolidated `main`;
- all in-repository `.tmp-*` directories are removed only after their Git state and retained
  artifacts are proven redundant, registered worktree metadata is pruned, and `git status` is
  clean.

## Approach

1. Preserve the pre-existing primary-tree edits after proving they are byte-identical to
   isolated commit `a224719`; do not discard or reinterpret them.
2. Fetch the isolated repository's reviewed head `0dc0f86` into a named local integration ref
   and merge it with the primary branch's execution-host preference.
3. Copy Phase 2b evidence from the v4 and v5/v5p isolated trees into versioned directories below
   `out/phase2b/`, then re-hash every destination against its source.
4. Record the terminal v5p result, artifact hashes, review status, and completed steps in the
   authoritative plans and `docs/PROGRESS.md`.
5. Run exact root verification on the consolidated tree.
6. Remove registered temporary worktrees through Git, remove the separately cloned v5p
   repository and generated-output directories with validated absolute targets, prune worktree
   metadata, and ignore future root `.tmp-*`/debug-log noise.

## Steps

- [x] Inventory all root `.tmp-*` directories, Git identities, dirty states, sizes, and live
  processes.
- [x] Commit this plan before reconciliation or deletion.
- [x] Integrate the isolated Phase 2b history into `main`.
- [x] Preserve and authenticate v4, interrupted-v5, and passing-v5p artifacts under `out/phase2b/`.
- [x] Update the Phase 2b plans and `docs/PROGRESS.md` with the terminal gate result.
- [x] Pass exact root verification on consolidated `main`.
- [ ] Remove redundant temporary worktrees and generated directories, then verify clean Git state.
- [ ] Mark this plan complete and leave the next concrete charter action in `docs/PROGRESS.md`.

## Out of scope

- Re-running any Phase 2b gate or changing its solver, protocol, thresholds, or evidence.
- Deleting canonical Phase 3 or Phase 4 evidence under the primary `out/` tree.
- Starting Phase 5 or silently changing its backend/hardware contract.
- Marking Phase 3 complete without the maker assertion required by its handoff.

## Tried and rejected

- **Delete every `.tmp-*` path immediately.** Rejected: the v5p directory is a separate clean Git
  repository containing unmerged reviewed commits and the only copies of the passing artifacts.
- **Ignore the directories without reconciling them.** Rejected: this leaves authoritative state
  split across repositories and makes a future cleanup capable of destroying the Phase 2b result.
- **Commit generated checkpoints and logs to Git.** Rejected: `out/` is deliberately ignored;
  reproducibility facts and hashes belong in tracked plans while large run bytes remain local.

## Open questions

None for cleanup. Phase 5 planning must separately reconcile the charter's original RTX 4080 /
Metal+D3D12 hardware assumption with the current RTX 3080 Windows host; this cleanup does not
silently amend that contract.

## Verification evidence

After merge and evidence reconciliation, exact `npm test` passed: Rule 7 clean over 159 files,
both TypeScript projects clean, and 43 test files / 793 tests green. The retained output is
`out/repository-reconciliation-npm-test.log`. The final v5p evidence copy was independently
re-hashed byte-for-byte against its isolated source before any cleanup target was removed.
