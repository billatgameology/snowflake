# Local consolidation — 2026-10-01

Status: complete. Integration `f54cb7c` is pushed to main; only the primary worktree and local main
branch remain. All three original output trees are retained locally and the useful new snapshots
are verified on NAS. One unregistered empty directory remains Windows-locked (details below).
The website/film branch on the other computer is excluded and unchanged.

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

## Integration and preservation record

- Current main merged at `e34fb48`, reviewed education demos at `62b4017`, and the offline NAS
  builder at `b837a34`. The education page/asset bytes match their reviewed branch exactly.
  The progress-index conflict retains completed science and newer product state; obsolete
  date-lock assertions were removed in favor of main's existing calendar-date validation.
  Both independent NAS timestamp regression tests are retained. The focused transaction/index
  check passed 46 tests with 6 skipped (`npx vitest run runner/test/nas-asset-transaction-lib.test.ts
  runner/test/progress-index.test.ts`, 2026-10-01).
- The first exact `npm test` stopped at typecheck because this worktree lacked the merged
  `mediabunny` dependency. `npm install --ignore-scripts --no-audit --no-fund` installed the
  lockfile's packages without changing it. The installed-dependency exact suite has finished;
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

### Exact local closure disposition (reviewed before removal)

The maker's worktree-closure request covers these three extra checkouts, not the primary checkout:

- `G:/Code Files/snowflake-education-phase10`: head `564a95a` is pushed and an ancestor of the
  integration. Move its entire ignored `out/` into the primary checkout at
  `out/retained-worktrees-2026-10-01/education-out/` before removal. Its generated outputs are also
  in the verified closeout collection. Remaining ignored `node_modules/` and `app/dist/` are
  regenerable scratch. No ordinary untracked changes or running jobs were found.
- `G:/Code Files/snowflake-phase10-evidence`: head `f4e8962` is pushed and an ancestor of the
  integration. Move its entire `out/` to `out/retained-worktrees-2026-10-01/evidence-out/`, including
  the personal offline build and prior source restores. The selected historical outputs are also
  on NAS. The 140 ignored research files match NAS and retained primary copies by exact bytes;
  removing these duplicates does not remove the last workstation copy. Dependencies, app build,
  and the two empty `.tmp-c0v-*-generator/` directories are scratch.
- `G:/Code Files/snowflake-science-exploration`: close only after the integration checks end,
  all ready commits are pushed to main, and its entire `out/` is moved into primary
  `out/retained-worktrees-2026-10-01/science-out/`. This keeps original scientific output, private
  offline build, test logs, packing attempts and restore staging locally as well as preserving
  the useful completed run/output snapshots on NAS. Dependencies and app build are scratch.

Use resolved literal paths, absent destinations and `git worktree remove --force` only after
these dispositions are satisfied. Delete only the now-merged local education/evidence/science
branch refs. The retired checkpoint stays unmerged; its existing remote ref and the restored Git
bundle preserve it. Keep all remote refs, the three stashes, primary `.claude/` settings and all
other primary output. This is consolidation of checkout copies, not broad data pruning.

## Final integration checks and remaining closure

The exact full-suite log and failure-name comparison are bound in
`docs/nas-assets/manifests/local-worktree-closeout/2026-10-01-verification.json`:
196 passed / 26 failed files; 2,795 passed / 70 failed / 76 skipped tests, plus two suite-load
failures; exit 1 after 1,338.38 seconds. Rule 7 and both typechecks passed. This is not suite green.
All 18 prior science test failures and its suite-load failure recur by identical name. The added
35 catalog failures belong to the already documented main test debt. Sixteen other test failures
come from unchanged main code's Windows path/case, symlink-privilege and retired directory-fsync
assumptions. No historical numerical result or frozen artifact was changed to silence them.

Two additional byte seams were corrected: the compiled Run B scene now retains its original
pinned LF bytes on Windows, and the redundant root NAS-manifest attribute was removed because
main's nested manifest rule already keeps those JSON bytes exact. This also restores the original
Phase 8 root-attribute fingerprint. The final focused motion/Phase-8/catalog/progress run passes
43 tests in four files. The app builds with the corrected scene (`app-build-final.log`). The full
suite was not repeated after these bounded corrections.

Public education verification passes all 191 checks for 37 pages / 205 visual roots. The offline
run passed 194 of 195 checks, including all browser profiles, source-map checks and negative
controls; its one local-only movie-lookup failure was corrected and the unchanged registered-hash
oracle rerun directly with exit 0. The exact reports, commands and hashes are in the same tracked
verification record. This does not pretend that the pre-fix offline command exited zero.

The education and evidence worktrees are unregistered, their merged local refs removed, and their
entire output trees retained in primary as specified above. Git's Windows removal left residual
tracked/dependency files, which were removed only from the reviewed exact directories. The evidence
checkout's now-empty root is held open by another process; leave it rather than killing that process.
After fast-forwarding primary, run the catalogued closeout restore verification there, push main,
move the final science output, and unregister that checkout. Remove the local retired checkpoint
ref only while it exactly matches its existing remote ref; never merge it or delete that remote.

## Completed local closure

- Primary `G:/Code Files/snowflake` fast-forwarded to `f54cb7c`, which was pushed to `origin/main`.
  Its declared dependencies are synced without a lockfile change. The existing primary scene
  needed one LF-only normalization after the attribute merge; its working/index/HEAD bytes now
  all match the original pinned SHA-256, with no scene-content change. Private `.claude/` settings
  remain in place and out of Git.
- The ordinary catalogued `assets:verify-restored` command passed from primary: 15 files /
  151,154,825 bytes, tree SHA-256 `517e56391a09041b61a1bcacc6990af1ae3e67d69380c4957325a3cb35d7f52d`.
  Command/result and the exact closure state are in the tracked closeout verification JSON.
- `git worktree list --porcelain` now lists only primary; `git branch -vv` lists only main.
  Education, evidence and science local refs are removed. The retired checkpoint local ref was
  removed only after matching its existing remote head `b595652`; it was never merged. All remote
  refs and all three stashes remain, and the other computer's website/film branch was not changed.
- All three `out/` roots were moved intact to primary under
  `out/retained-worktrees-2026-10-01/{education-out,evidence-out,science-out}/`. In particular,
  every integration log path above beginning `out/local-consolidation-2026-10-01/` now resolves
  beneath `out/retained-worktrees-2026-10-01/science-out/local-consolidation-2026-10-01/`.
  No original run-output tree was discarded. The catalogued science and closeout snapshots also
  remain on NAS; retained private source bytes still exist in primary and their private collection.
- `G:/Code Files/snowflake-phase10-evidence` is an empty, unregistered directory held open by
  another Windows process. No process was killed to remove it. It can be removed non-recursively
  after that application closes or Windows restarts; no data recovery depends on this empty folder.

### Subsequent remote branch cleanup — 2026-10-01

At the maker's request, deleted only `explore/post-phase10-discovery`, `docs/education-phase10`,
`docs/education-ch30-33-demos`, and `phase10/evidence-verification` on origin after fetching and
confirming each exact head is an ancestor of origin/main. The atomic deletion used exact-head
leases; `git ls-remote --heads origin` then showed only main, `explore/film-part1-plan`, and the
retired checkpoint. No commits were merged or source/output files removed in this cleanup.

The checkpoint safety question was checked against the already restored closeout backup:
`git bundle list-heads out/restores/local-worktree-closeout-2026-10-01/repository.bundle` includes
`b5956524c9110b67b3f36a1d4cd9407d471b0aae` under the retired checkpoint name, and `git cat-file -t`
in the restored `repository.git` resolves that head as a commit. The bundle's SHA-256 matches the
tracked verification record's `a1e208af77ecc4f1a145eadc96d56f7456d35850605ada3adf5b65e05972939e`.
It is recoverable without merging; its local branch/worktree is already closed. Its remote ref
remains until the maker explicitly requests its deletion. The other computer's branch is untouched.

Next: remain paused. Use pushed main as the common grounding point; reconcile the other machines'
active branches there when ready. A later experiment wave should start in fresh task worktrees,
partition independent cases across the two PCs, retain the 28-worker cap here, and demonstrate
pause/resume before a long launch. Raw prior science is in the retained science-out tree or its
catalogued NAS snapshot; restore only the needed campaign to the new task's expected output path.

## Tried and rejected

- Blanket worktree/branch deletion: education and offline-build commits were local-only, and
  ignored historical outputs still needed preservation.
- Merging the retired `checkpoint/phase10-s6-pre-freeze-do-not-merge-20260822`: its incomplete
  implementation is historical, not a ready deliverable.
