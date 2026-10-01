# Local consolidation — 2026-10-01

Status: in progress. Maker requests saving, pushing, merging ready work and NAS backup before
closing the extra worktrees on this PC. The website/film branch on the other computer is excluded.

## Scope and approach

- Reuse `explore/post-phase10-discovery` and its existing worktree for integration; leave the
  primary checkout's untracked `.claude/` settings untouched.
- Preserve the education head `564a95a`, offline-build head `f4e8962`, science head `4093baf`
  and current remote main `929189b`. The first two formerly local-only heads are now pushed.
- Merge current `origin/main`, completed education work and the offline-build change, preserving
  both product and science state. Do not merge the explicitly retired S6 checkpoint branch.
- Reuse the existing NAS publication/restore machinery for useful local-only education and
  evidence-worktree output. Keep restricted research media out of public Git; verify an existing
  NAS copy or preserve them in a non-served private collection. The verified science snapshot
  `post-phase10-science-output@2026-10-01` already covers its retained run folders.
- Use focused merge checks while resolving conflicts, then one exact `npm test` at the stable
  scientific integration checkpoint, plus the education verifier/build for its changed boundary.
  Compare any failures with the existing saved baseline; never call a failing suite green.
- Push the tested integration, advance and push `main` without force, then close only extra local
  worktrees whose commits and useful ignored bytes are preserved. Keep remote history and the
  other computer's active website/film branch unchanged. Record exact removed paths and refs.

## Done when

Ready local work is reachable from pushed main; useful local-only outputs have verified recovery;
the surviving worktrees/branches and any explicit blockers are recorded in PROGRESS. No new science
campaign, scientific claim upgrade, historical fixture repair or remote branch deletion is included.

## Tried and rejected

- Blanket worktree/branch deletion: education and offline-build commits were local-only, and
  ignored historical outputs still needed preservation.
- Merging the retired `checkpoint/phase10-s6-pre-freeze-do-not-merge-20260822`: its incomplete
  implementation is historical, not a ready deliverable.
