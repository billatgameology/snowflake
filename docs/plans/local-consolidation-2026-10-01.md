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

## Integration and preservation record (in progress)

- Current main merged at `e34fb48`, reviewed education demos at `62b4017`, and the offline NAS
  builder at `b837a34`. The education page/asset bytes match their reviewed branch exactly.
  The progress-index conflict retains completed science and newer product state; obsolete
  date-lock assertions were removed in favor of main's existing calendar-date validation.
  Both independent NAS timestamp regression tests are retained. The focused transaction/index
  check passed 46 tests with 6 skipped (`npx vitest run runner/test/nas-asset-transaction-lib.test.ts
  runner/test/progress-index.test.ts`, 2026-10-01).
- The first exact `npm test` stopped at typecheck because this worktree lacked the merged
  `mediabunny` dependency. `npm install --ignore-scripts --no-audit --no-fund` installed the
  lockfile's packages without changing it. The installed-dependency exact suite is in progress;
  logs are `out/local-consolidation-2026-10-01/npm-test{,-installed}.log`.
- Public education verification and the NAS-backed offline build passed. The complete offline
  check exposed one real integration seam: its separate movie oracle still required a local
  research file although the builder and source-map oracle resolved NAS. The movie oracle now
  uses the same existing resolver while retaining its independently registered movie hash.
  This is a bounded integration fix, not a new verification layer.
- `local-worktree-closeout@2026-10-01` preserves 510 original generated files / 98,740,002 bytes
  plus a repository bundle (including all three old stashes), in 15 payload files / 151,154,825
  bytes. These values are copied from
  `docs/nas-assets/manifests/local-worktree-closeout/2026-10-01-verification.json`.
  Publication, fresh restore, every extracted member, and all stash objects passed. The ordinary
  `assets:verify --full` passed; `assets:verify-restored` must be run from the primary checkout
  after fast-forward, because the restore deliberately lives in its `out/restores/` and the CLI
  rejects a sibling checkout destination. This first refusal wrote or deleted nothing.
- The same verification record binds a read-only check of 140 private source files / 99,302,123
  bytes from the evidence worktree against both the existing `research-private-freeze@2026-08-11`
  NAS collection and the retained primary checkout. Both match. Its pre-existing primary hard
  links are permitted for this read-only comparison, not republished as a new collection.
- Backup recipe: the collection's `backup-invocation.mjs` and `members.json` name the 12 exact
  generated source trees and original hashes. Use the catalogued `assets:restore` command to a
  fresh `out/restores/local-worktree-closeout-2026-10-01`; extract each listed archive into a
  fresh directory and compare its tree with `members.json`. `repository.bundle` can be cloned
  with `git clone --bare`; the three saved stash commit IDs remain available by `git cat-file`.
  Restricted offline builds/restored source caches remain local or reproducible from the existing
  private collection. Dependencies, empty generator directories and synthetic tests are scratch.

## Tried and rejected

- Blanket worktree/branch deletion: education and offline-build commits were local-only, and
  ignored historical outputs still needed preservation.
- Merging the retired `checkpoint/phase10-s6-pre-freeze-do-not-merge-20260822`: its incomplete
  implementation is historical, not a ready deliverable.
