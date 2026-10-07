# Local consolidation — 2026-10-01

Status: complete. Former Windows primary `G:/Code Files/snowflake` integrated and pushed
`f54cb7c` to main, reconciled its extra worktrees/branches, and retained all three original output
trees. Its empty Windows-locked residual directory is an old-host observation, not a directory on
the new computer. The 2026-10-07 readiness record below completes setup of current primary
`C:/Users/biao3/Documents/GitHub/snowflake` with selected verified restorations, not all original
bulk outputs. The other computer's website/film branch remains excluded and unchanged.
The current housekeeping task uses one additional isolated worktree; see PROGRESS for live refs.

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
The remaining closure instructions at this checkpoint were to verify the catalogued restore,
push main, retain the final science output, unregister its checkout and reconcile the exact
retired checkpoint ref. The completed closure and later separately authorized remote deletion
below supersede that checkpoint's instructions; never merge the retired implementation.

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
It is recoverable without merging; its local branch/worktree is already closed. The maker then
explicitly authorized deletion, and the remote checkpoint ref was deleted with an exact-head
lease. `plan/phase10-options` is absent from local and remote branch listings, so no deletion was
needed; its planning commit `bc75831` is an ancestor of main. Final `git ls-remote --heads origin`
lists only main and the other computer's untouched `explore/film-part1-plan`. Backups are retained.

Next: science remains paused. Windows consolidation and the new computer's setup are complete;
reconcile the other computer's film work only within its authorized task. A later experiment wave
starts in a fresh task worktree with a measured host budget and demonstrated pause/resume.
The 28-worker cap belongs to the former 32-logical-processor evidence host; do not transfer it to
the current 24-core host. Raw prior science is in the former primary's retained science-out tree
or its catalogued NAS snapshot; restore only needed inputs to the new task's expected path.

## New Windows computer readiness — 2026-10-07

Maker direction: verify the newly mapped NAS at `Z:/` and install missing tools so this computer
can continue from shared main. The source checkout starts clean at `94fabd2`; the task record
uses branch `chore/windows-host-readiness-2026-10-07` in the isolated sibling
`C:/Users/biao3/Documents/GitHub/snowflake-host-readiness`. Software and dependencies are installed
for the primary checkout, `C:/Users/biao3/Documents/GitHub/snowflake`.

Deliverable: the primary checkout resolves the marked NAS, runs the recorded Node engine with
locked dependencies, and passes a representative app build/browser smoke. Use the existing
`VCC_NAS_ROOT` setting for this host's drive letter. Install repository-needed Python/FFmpeg and
Playwright Chromium; repair the canonical instruction symlink without copying AGENTS into it.
Verify the science and local-worktree October snapshots by their owner manifests and exercise
a fresh bounded restore. Keep unique logs under primary `out/host-readiness-2026-10-07/`.
Also restore only the registered compact gallery inputs from the render closeout owner manifest
to their expected local product paths, verifying each source and copied digest. Full mesh trees
are outside this readiness pass. Any unavailable replay remains explicitly unavailable.

Done when tool versions, NAS verification/restore, Rule 7, typecheck, focused relevant tests and
app build/browser results are recorded here and in PROGRESS with their exact artifact paths.
This setup changes no solver, scientific claim, dependency lockfile, phase gate or remote branch.
The existing full-suite debt remains explicit; no campaign or full scientific suite is launched.
After the record is committed, fast-forward primary main locally and remove the temporary task
worktree/ref. This local machine record is not automatically pushed.

Status: readiness complete, including the maker-executed administrator settings and instruction
symlink repair. The final follow-up below records the exact verified state and receipts.

Installation receipt: primary `out/host-readiness-2026-10-07/tools.json` records Node v24.13.1,
npm 11.8.0, TypeScript 5.9.3, Playwright 1.61.1, Python 3.13.15, PyMuPDF 1.28.2 and
FFmpeg/FFprobe 9.0.2. Node's official archive SHA-256 matched (`node-install.json`). The final
`npm.cmd ci --ignore-scripts --no-audit --no-fund` and `npx.cmd playwright install chromium`
exited zero (`npm-ci-final.log`, `npm-ci-final.exit`, `playwright-install.log`,
`playwright-install.exit`); Chromium launches successfully. The dependency lockfile has no Git
diff; its raw SHA-256 is recorded in `tools.json`. User PATH and `VCC_NAS_ROOT=Z:/` are persistent.
Restart the terminal/Codex application to inherit them. Git `core.longpaths=true` is configured.

NAS: the share marker matches, `detectNasMount()` returns `z:/`, and
`npm.cmd run assets:verify` exits zero with no defects (`nas-metadata-verify.log`). Independent
streamed hashes plus the project's two `assets:verify -- --collection <id> --full` commands
agree on science 15 files / 304,047,835 bytes and closeout 15 files / 151,154,825 bytes
(`nas-independent-hashes.json`, `nas-science-full.log`, `nas-closeout-full.log`). The science
snapshot was restored through `assets:restore` to primary
`out/restores/host-readiness-science-2026-10-07/`; `assets:verify-restored` exits zero and reports
tree SHA-256 `7b512af0ca229cc6ea5ef21594d1a8dfb773be217b346fed5777865698c6802f`
(`nas-science-restore.log`, `nas-science-restore-verify.log`). This is packed local recovery,
not another scientific result or source-prune authorization.

Gallery: the exact selected source/copy hash checks restored 150 registered inputs /
372,671,658 bytes from `render-worktrees-closeout@2026-09-04` (`gallery-restore.json`). No full
scientific mesh tree was copied. The live `/growth-studies/index.json` reports 151 registered /
150 available, with only original `run-b` unavailable (`live-gallery-index-summary.json`). Its
compact candidate digest does not appear in the tracked recovery owner manifests searched here;
the previous local-candidate/deferred-publication status is preserved. Do not regenerate or replace
that historical candidate to fill the card.

Executable checks: `npm.cmd run lint:rule7`, `npm.cmd run typecheck`, and
`npm.cmd run build --workspace app` exit zero (`rule7-primary.log`, `typecheck.log`, `app-build.log`).
The focused Vitest command in `focused-tests.log` passes 3 files / 21 tests for progress,
evidence integrity and product-asset handling; its additional nonexistent `nas-root.test.ts`
filter selected no file, so no NAS-root test-suite execution is claimed. NAS checks above are
actual attached-share CLI execution. The existing `dendrite-study-preview.mjs` smoke passes its
seed/endpoint/seek/four-view/UI/mobile/reduced-motion checks with zero browser errors
(`browser-smoke.log`, primary `out/dendrite-styles/browser-smoke.json`), and the rendered
comparison image was visually inspected. The existing `growth-gallery-smoke.mjs` passes all
151 card/preview checks, filtering, real Compose selection, keyboard/mobile controls and broken-image
fallback with zero errors (`gallery-smoke.log`, primary `out/growth-gallery/browser-smoke.json`).
The dev server runs at `http://127.0.0.1:5191/dendrite-styles.html?browse=1`, with the owned PID
and separate stdout/stderr at `dev-server.pid`, `dev-server.log`, `dev-server.error.log`.

Initial Windows step: `host-settings-before-admin.json` records Developer Mode absent, system
`LongPathsEnabled=0`, Git `core.symlinks=false` and the unchanged nine-byte `CLAUDE.md` placeholder.
The native administrator launch reported user cancellation (`windows-development-launch.json`).
The exact prepared settings script is `enable-windows-development.ps1`; it changes only Developer
Mode and system long-path support. A later approved administrator execution permits restoring the
actual relative `CLAUDE.md` -> `AGENTS.md` symlink and enabling Git symlink handling. Never replace
the link with a copied instruction file. No full suite, scientific campaign, NAS publication or
cleanup of historical source bytes ran. Existing full-suite debt is unchanged. Local installation
diagnostics are operational scratch, not scientific claim-bearing evidence.

### Final readiness follow-up — 2026-10-07

The maker requests resolution of both remaining items. Reuse the readiness task branch and
sibling worktree from primary `3c74a51`. Retry the prepared native administrator launch, verify
both registry values, then restore the relative instruction symlink and exercise a long local
path. Search existing Git and governed NAS records, including bounded archive member lists, for
the original Run B compact asset. Restore only bytes matching its registered digest and length
to the existing product input path, then decode and check the live gallery. If the historical
asset is held only on another computer, record its exact required source rather than substituting
a new bake. Keep recovery receipts in primary `out/host-readiness-2026-10-07/`.

Done when both items are verified or an actual external access blocker is precisely identified;
update this plan and PROGRESS, run the focused progress check and Rule 7 for record changes, and
fast-forward primary main locally before removing the empty task worktree/ref. No scientific
campaign, publication, remote branch change, or historical-byte cleanup is part of this follow-up.

Run B recovery is complete. The other computer's untouched film branch at
`4f7a03207f8e42f650074a1d7601d2f126800320` names the live host and exact release allowlist in
`docs/plans/explore-nivogenesis-public-release.md`, and binds this asset's URL/digest/size in
`docs/video/part1-score.json`. Downloaded
`https://nivogenesis.web.app/growth/run-b-growth-v1.bin` matches the original registered identity:
7,695,060 bytes and SHA-256 `475c1f7c227c45b005bfdb8691b1250599b405fa59902462110312a4f26ceb7d`.
An independent read-only agent fetch agrees. Primary `run-b-restore.json` under the setup directory
records the exact copy to `C:/Users/biao3/Documents/GitHub/snowcrystal_website/public/growth/run-b-growth-v1.bin`,
strict decode, 961,597 events, 19 seed sites, final tick 70,000 and 593 x 593 x 17 crop.
The event-reconstructed full occupancy digest is the original
`9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7`.
This is local recovery of existing bytes; no new solver result or NAS publication is claimed.

`live-gallery-complete.json` reports 151 registered / 151 available and the exact Run B source
digest. The earlier dev server had stopped; the first Run B smoke therefore failed connection
before loading (`run-b-browser-smoke-first.log`). Restarted
`npm.cmd run dev --workspace app -- --host 127.0.0.1 --port 5191 --strictPort`; the owned PID and
stdout/stderr are `dev-server-followup.pid`, `dev-server-followup.log`, and
`dev-server-followup.error.log`. With `DENDRITE_STUDY_URL` set to
`http://127.0.0.1:5191/dendrite-styles.html?capture=1&crystal=run-b`, the existing
`node app/scripts/dendrite-study-preview.mjs` passes seed/endpoint/reverse-seek/UI/four-view/mobile
and reduced-motion checks with zero browser errors (`run-b-browser-smoke.json`,
`run-b-browser-smoke.log`, exit zero). Its comparison image was visually inspected. The previous
smoke report is preserved as `browser-smoke-before-run-b.json`. The follow-up
`npm.cmd run build --workspace app` exits zero (`app-build-complete.log`, `.exit`), including the
recovered input. This does not close the separate glass/camera visual-acceptance plan.

The native retry also reported cancellation (`windows-development-retry-launch.json`). The maker
then ran `finish-windows-readiness.ps1` from Administrator PowerShell; its exit file records zero.
`windows-readiness-complete.json` records Developer Mode and system long paths enabled. Fresh root
checks confirm both registry values are 1, Git `core.symlinks=true` / `core.longpaths=true`, and
actual `CLAUDE.md` -> `AGENTS.md` symbolic linkage. The refreshed `host-settings.json` agrees; its
initial pending-state receipt is retained as `host-settings-before-admin.json`.

`instruction-links.json` records a successful 364-character create/read path probe and unchanged
canonical AGENTS.md SHA-256 `129a5386d79dfde478c4212b0fc09e81557129e5509c5348b520f908b6d951cf`.
An independent agent verified the same actual link, canonical Git blob unchanged, clean primary
checkout, and unchanged restored Run B digest. A fresh task checkout from `8c21ece` at the same
readiness sibling path creates the real relative instruction symlink without elevation. Both
remaining items are resolved; no further administrator step is needed.

Record checks: `npm.cmd run lint:rule7` exits zero with 1,925 files scanned
(`rule7-followup.log`); `npx.cmd vitest run runner/test/progress-index.test.ts` passes all nine
tests (`progress-followup.log`). The PowerShell/Node repair scripts parsed successfully and the
maker's administrator execution completed their host checks. The task documentation is fast-forwarded
into local primary main; the empty task worktree/ref is removed after the disposition check.
Nothing is pushed, and recovered product bytes and setup receipts remain in their primary paths.

## Tried and rejected

- Blanket worktree/branch deletion: education and offline-build commits were local-only, and
  ignored historical outputs still needed preservation.
- Merging the retired `checkpoint/phase10-s6-pre-freeze-do-not-merge-20260822`: its incomplete
  implementation is historical, not a ready deliverable.
- New-host npm installation first used PowerShell's stop-on-error mode, which treated a native
  npm notice as an exception after packages installed. The final invocation uses native exit status
  and succeeds; the first log is retained, not reported as a successful command wrapper.
- Windows refused unprivileged symlink creation. The administrator prompt was canceled; neither
  an instruction-file copy nor a privilege bypass was substituted.
