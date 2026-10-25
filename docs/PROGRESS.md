# Progress — The Virtual Cloud Chamber

This is the compact **current-state index**. Read it completely, then the affected active plan including **Tried and rejected**. The charter defines intended behavior; this index records state. The handoff mechanism is retired. [HANDOFF.md](HANDOFF.md) remains a tombstone.
- **Last updated:** 2026-10-24 by Codex
- **Storage/closeout policy:** [ADR 0061](decisions/0061-nas-backup-before-worktree-closeout.md) requires verified NAS recovery before output-owning worktree closure; new bulk run payloads stay out of Git. [HIL catch-up](plans/nas-worktree-closeout.md) published and freshly restored `hil-completed-runs@2026-10-09`: six archive/inventory payload files, 135501385 bytes, covering all 3745 HIL member files / 1587912611 bytes. Primary workstation copies remain; historical Git archives and active HIL execution are unchanged. The [verification record](nas-assets/manifests/hil-completed-runs/2026-10-09-verification.json) and catalogue supply exact recovery commands. Reuse verified immutable coverage rather than repeat a backup for identical bytes.
- **Execution policy:** maker direction 2026-10-21 selects the [two-host growth-dynamics campaign](plans/hil-bld-growth-dynamics-oct21.md): HIL up to 20 workers/24 long or uncertain rows, BLD up to 32 workers/92 shorter rows, resumable with no production wall timeout. HIL also owns all follow-ups so BLD can finish, preserve its output and shut down. This supersedes earlier allocations. HIL launched its 24-row queue at 2026-10-21 20:32 UTC: 20 workers and four queued cases, with initial checkpoints observed. BLD launched at 2026-10-21 21:26 UTC from `d7f76cb` with 32 workers and 60 queued rows, following the maker's explicit run approval. Its [launch receipt](../evidence/bld-growth-dynamics-2026-10-21/launch.json) records 32 checkpoints, 28 already advancing at observation; the [verification record](../evidence/bld-growth-dynamics-2026-10-21/verification.json) retains the non-green full check and scoped disposition.
  The [approved portfolio](plans/post-phase10-adaptive-discovery.md#exploration-portfolio-for-hil-and-bld)
  covers cavities, cold core/tip structure, seed memory, pressure/transport and environment history.
  Each host owns its named implementation and queue; numerical contracts remain shared. The new plan supersedes older allocations. Shared main publication includes `5c97292`; BLD's `b333782` is preserved by pushed tag `run/bld-first-batch-2026-10-08` and its
  [evidence/NAS records are imported](../evidence/hil-bld-pickup-2026-10-08/README.md), with HIL verification complete.
  HIL has 56 + 16 checked endpoints and BLD has 42. The [joint 114-case review](../evidence/hil-bld-joint-review-2026-10-08/README.md) identifies warm growth memory, prism-sensitive cold structure and age-sensitive seed response. These are internal model-development leads; the maker selected warm representation qualification.
  The [saved-data follow-up](../evidence/hil-bld-joint-review-2026-10-08/followup/README.md) locates pressure occupancy differences, separates inherited axial span from new growth, and shows the cold exception depends on observation stage. Exact `npm.cmd test` at `b465e1f` passed 235 files / 3045 tests, 23 skipped; [receipt and bounded review](../evidence/hil-bld-joint-review-2026-10-08/followup/verification.json) retain limits. The [warm refinement plan](plans/hil-warm-refinement.md) is now authorized.
  [HIL retirement](../evidence/hil-bld-joint-review-2026-10-08/retirement.json) is complete: only primary `main` remains. All 5828 output files / 2638078397 bytes are retained in primary `out/hil-retired-2026-10-08/`; compressed HIL evidence is tracked and pinned. Exact `npm.cmd test` at `862ff1f` passed 235 files / 3045 tests, 23 skipped ([receipt](../evidence/hil-bld-joint-review-2026-10-08/verification.json)).
- **New-host follow-up:** [complete](plans/new-host-acceptance-and-capacity-2026-10-07.md),
  locally integrated through `cf1386e`. Glass/camera browser and direct visual acceptance pass;
  the six comparison inputs and both small independent C-drive backups are restored and verified.
  The scoped core continuation matches uninterrupted bytes. Durable results and full-check receipts
  live in `evidence/new-host-readiness-2026-10-07/`. The single task checkout/ref are reconciled
  and removed at readiness closeout. Publication was deferred then and is included in the approved main update.
  The short-row ladder recommends 16 workers for its ordinary N64 workload (capacity receipt
  SHA-256 `eb79aa6ddcaddaf79c2ec45aa919e0a6e7363674bfe0dcfcb83dcb0b33b4936b`);
  this batch separately qualifies its registered experimental prefixes. Larger/mature configurations
  remain unqualified. Discovery-runner restart is verified; the completed second HIL batch independently qualified 1/4/8/16 and used sixteen workers.
- **Verification scope:** maker clarification is recorded through local `91c0684`: website/education
  presentation uses focused product/content checks; executable science and evidence retain rigorous
  requirements. The active glass/camera plan's inherited full-suite criterion is removed; historical
  test records remain. Its task worktree/ref are reconciled and removed; publication was deferred at that milestone.
- **Agent-rules cleanup:** [complete](plans/repository-housekeeping-2026-10-07.md#agent-rules-follow-up--2026-10-07),
  integrated into local main through `23de3a8`; its task worktree/ref are removed without force.
  Repeated detail now links to its authority while explicit learned warnings, required reading and
  existing enforcement remain. This integrated work is included in the approved main publication.
  Bounded text review has no unresolved finding (primary `out/agent-rules-cleanup-2026-10-07/review.json`).
- **Repository housekeeping:** [complete](plans/repository-housekeeping-2026-10-07.md), integrated
  into local `main` through `6f4e050`; its reconciled task worktree and branch are removed.
  This integrated work is included in the approved main publication. At housekeeping closeout, only the primary worktree remained.

## Historical records

Completed chronology and failed attempts are retained, not live instructions:

- [History through 2026-08-02](progress-history-through-2026-08-02.md): byte-frozen original archive.
- [Phase 6/8/9 history](progress-history-phases-6-8-9.md): preserved earlier phase-state record.
- [History through 2026-10-07](progress-history-through-2026-10-07.md): exact pre-housekeeping
  progress body, 156,106 bytes, SHA-256
  `9ae658394425a8e04caeb8509b01319f8400d10dde79a76c72fa05088b134340`.
  Removed worktree paths, old server/process claims and superseded launch instructions there are
  historical provenance. Open history only when a current record points to it or provenance is needed.

## Current state

**The registered HIL campaigns have finished; completed comparisons are ready for discussion.** The marked NAS was verified reachable again on October21; the new collection has successful full-hash publication and fresh recovery below. The primary checkout is
`C:/Users/biao3/Documents/GitHub/snowflake`; persistent `VCC_NAS_ROOT=Z:/` passes `detectNasMount()` at `z:/` in the [prelaunch receipt](../evidence/hil-domain-seed-2026-10-19/prelaunch.json). The October 18 credential failure is historical; no mapping or credential changes were made here.
The current host is Intel Core Ultra 9 285K (24 cores / 24 logical processors), 64 GB RAM and RTX 5080. The former Ryzen/RTX 3080 host's measurements do not establish this host's scientific worker budget. The [current measurement](plans/new-host-acceptance-and-capacity-2026-10-07.md#measured-host-budget--2026-10-07)
recommends 16 workers for its ordinary N64 three-cycle workload; the first batch has its own experimental
prefix qualification above. Larger domains/mature geometry remain outside both measured scopes.

The [completed readiness record](plans/local-consolidation-2026-10-01.md#new-windows-computer-readiness--2026-10-07)
and primary `out/host-readiness-2026-10-07/` receipts record Node v24.13.1, npm 11.8.0, Python
3.13.15/PyMuPDF, FFmpeg/FFprobe and Playwright Chromium; locked dependencies, Developer Mode,
long paths and the actual relative `CLAUDE.md` → `AGENTS.md` symlink are verified. Keep AGENTS canonical.
Both October NAS snapshots passed full verification; a fresh bounded science restore passed.
These are operational recovery checks, not new scientific results or source-prune authorization.

**The merged product catalog is complete.** The [named catalog](plans/named-crystal-animation-catalog.md)
contains 99 accepted animations / zero remaining. The completed [local gallery](plans/named-crystal-local-gallery.md),
[volume presentation](plans/named-crystal-volume-gallery.md),
[stability correction](plans/named-crystal-volume-stability-correction.md),
[animation selection queue](plans/gutcheck-animation-selection-queue.md) and
[dendrite studies](plans/dendrite-visual-studies.md) are downstream presentation work, without
quantitative-validation credit. The gallery reports 151 registered / 151 available inputs in
primary `out/host-readiness-2026-10-07/live-gallery-complete.json`.

The original Run B replay was recovered byte-for-byte from the existing deployed asset:
7,695,060 bytes, SHA-256 `475c1f7c227c45b005bfdb8691b1250599b405fa59902462110312a4f26ceb7d`.
Its exact destination, strict decode, occupancy identity and browser result are in primary
`out/host-readiness-2026-10-07/run-b-restore.json` and `run-b-browser-smoke.json`.
The other 150 registered inputs came from the render-closeout owner manifest. This restores compact
product inputs, not full scientific mesh trees, the complete glass/comparison bundle or a new NAS publication.
The tracked `npm run gallery:restore` now recovers those exact inputs and Run B into the chosen
checkout; `-- --check` verifies them without copying. See [local assets](local-assets.md).

**Local consolidation is complete.** The former Windows host integrated and pushed `f54cb7c` to
main, removed reconciled extra worktrees/branches, and retained its original output trees under
its `G:/Code Files/snowflake/out/`. This new computer holds the selected restorations above;
original-output custody is not inferred from a fresh checkout. The other computer's film branch
remains untouched. Housekeeping fast-forwarded local primary main and removed its reconciled task
worktree/ref without force. See [consolidation](plans/local-consolidation-2026-10-01.md) and primary
`out/housekeeping-2026-10-07/worktree-closeout.json` for the source/check/disposition record.

**Science is proceeding with bounded exploration.** The cavity/grid and early/late history
wave is complete in the [adaptive discovery plan](plans/post-phase10-adaptive-discovery.md).
Its closing findings, raw inventory and verification are recorded in
[the completed wave bundle](../evidence/post-phase10-wave-2026-10-01/README.md); exact retained
outputs are in `post-phase10-science-output@2026-10-01`. The first HIL replacement batch has finished as recorded above.
The maker resumed science planning after consolidation, with education handled separately. The
[approved portfolio](plans/post-phase10-adaptive-discovery.md#exploration-portfolio-for-hil-and-bld)
covers several independent exploration tracks. The earlier cavity grid/seed comparison becomes
one block within that program. Resource/restart qualification belongs to launch preparation;
reviewing existing results and designing other tracks can proceed now.

- **Phase 6 is COMPLETE (2026-08-20).** The accepted negative finding remains measured-only:
  no quantitative-validation label was earned. `gate6` exit 0 at `44488ab` re-derived the amended
  closure obligations; the numerical ladder is NO-PASS (criterion). The
  [science-first completion plan](plans/phase-6-science-first-completion.md),
  `research/phase6-conclusion.md` and pinned gate evidence own the details.
  The three-arm counts are measured-only ([pinned narrative](../evidence/phase6-three-arm-report/report.md)).
  They are not the registered conservative-intersection verdict: **not computed by decision 0045**.
  R15 and the full registered production campaign remain closed by that decision.
- **Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12).** The
  [8A plan](plans/phase-8-what-is-real.md) and [8B plan](plans/phase-8-measurement-corpus.md) are closed.
  Phase 8B writes separate artifacts; preserve `evidence/phase8-target-book/` byte-for-byte and
  rejected plot-adjudication history. Decision [0048](decisions/0048-focus-phase8b-on-phase9-ready-benchmarks.md)
  retains the successor corpus as model-development evidence, without held-out validation credit.
  [8A freeze](../evidence/phase8-target-book/freeze.json): 18 entries / 59,019 bytes, SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`.
  [8B report](../evidence/phase8b-benchmark-final-v1/report.json): 51 development records
  (18 P0 / 28 P1 / 5 P2), 252,134 native history rows, 431 plot points, zero held-out records.
- **Phase 9 is COMPLETE (development-only, 2026-08-13).** The
  [Phase 9 execution plan](plans/phase-9-execution.md) is complete under decision
  [0050](decisions/0050-adopt-phase9-modular-physics-experiments.md). The all-no-pass branch closed:
  zero items promoted; all Phase 8B records remain development evidence. Historical ordering and
  mapping limitations remain in the completed plan. Phase 9 cannot grant a quantitative-validation label.
  The [earlier draft](plans/phase-9-modular-physics-arms.md) is superseded design history;
  8B's report records its producer-time source identity. Use the completed execution plan.
- **Phase 10 is ACTIVE (continuing exploration, 2026-10-10).** [ADR 0062](decisions/0062-continue-phase10-exploration.md)
  keeps it open until the maker accepts multiple distinct promising leads; the [adaptive plan](plans/post-phase10-adaptive-discovery.md) governs the portfolio.
  The August verification package is complete-negative: its [execution plan](plans/phase-10-evidence-verification-execution.md)
  records B refusal, C0 criterion NO-PASS, C0V incomplete/non-PASS and zero S6 credit. `gate10` exit 0 at `e2cca93`
  re-derived that package closure. Do not resume retired S6 execution or reuse refused attempts.
  No C1–C5 row, habit row, validation claim or downstream authorization was earned.
- **Phase 7 remains unstarted and independently eligible.** It is on maker hold. A separately
  committed execution plan and isolated worktree are required before its work begins.

## Phase gates

The accepted gate outcomes are carried forward below. Phase 10 distinguishes its current scope from
the completed August package. Reproduction commands are not setup smoke tests; consult each plan.

| Phase | Current gate state | Reproduction/evidence |
|---|---|---|
| 0 | Complete, maker-asserted 2026-07-14 | Charter §2.8 knowledge checks; no automated metric is applicable. |
| 1 | Complete, maker-asserted 2026-07-15 | Informal UX sessions were positive; the four-task protocol was not run. [Plan](plans/phase-1-ux-spike.md). |
| 2a | Complete, maker-asserted 2026-07-15 | Seed 1, `128,128,64` hexPrism plate: symmetry error 0 through 4,800 ticks, AR `0.168831`; checkpoint SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389`. Repro: `node runner/src/main.ts grow --preset plate --dims 128,128,64 --ticks 10000 --seed 1 --out out/plate-gate.ckpt --enforce-gate`. |
| 2b | Complete 2026-07-20 | Clean `0dc0f86`, seed 1, `96³` hexPrism, extent 61: −5 °C AR `0.118644` plate; −15 °C AR `12.2000` column; symmetry error 0 and every relaxation converged. Repro: `node runner/src/main.ts gate2b`. |
| 3 | Complete, maker-asserted 2026-07-23 | `gate3` exit 0: depletion-ratio median `0.531454`, 90.2% below 1, radius 38, symmetry error 0. Repro: `node runner/src/main.ts gate3`. |
| 4 | Complete 2026-07-18 | `gate4` at `70a2496`: 24/24 blocking G-G records and 12/12 diagnostic LK records executed; `gatePass=true`, `passBDiagnosticPass=false`. Repro: `node runner/src/main.ts gate4`. |
| 5 | Complete, maker-asserted 2026-07-26 | Clean `c436df5`, observed Windows/Chromium/D3D12: 16/16 gate criteria, 560 bounded segments below 500 ms, zero device losses/errors/full-field display-frame reads, 16/16 negative controls rejected. Repro: `node runner/src/main.ts gate5-lane` and `node runner/src/main.ts gate5`. |
| 6 | **Complete 2026-08-20** | `gate6` exit 0 at `44488ab`: 13/13 criteria re-derive the amended obligations from committed evidence — strata freeze, three measured-only arms (3/90; 54/78·54/90; 5/78·5/90), ladder NO-PASS (criterion), narrative report, closure labels, 0043/0044 deferrals. Negative result accepted as the finding; no label upgraded. Repro: `node runner/src/main.ts gate6`. |
| 7 | Not started; independently eligible | Maker hold; a committed Phase 7 plan and isolated worktree are required. Product, held-out validation and v6 WGSL/preview-GPU parity remain its scope. |
| 8 | **Complete (8A + 8B)** | Immutable 8A book and separate all-development 8B successor remain pinned; no held-out row. [Completed plan](plans/phase-8-measurement-corpus.md). |
| 9 | **Complete (development-only)** | All-no-pass branch closed, zero items promoted. [Completed plan](plans/phase-9-execution.md); no validation credit. |
| 10 | **Active exploration; August verification package complete-negative** | `gate10` exit 0 at `e2cca93`: 7/7 closure checks re-derive the August package's `complete-negative`; terminal B refusal, C0 criterion NO-PASS, C0V incomplete/non-PASS and zero S6 credit. [Completed plan](plans/phase-10-evidence-verification-execution.md). This gate does not close current exploration. Repro: `node runner/src/main.ts gate10`. |

## Verification

Local closeout metadata checks passed: `npx.cmd vitest run runner/test/evidence-integrity.test.ts runner/test/progress-index.test.ts`
(**2 files / 18 tests**), `npm.cmd run lint:rule7` and `git -c core.whitespace=cr-at-eol diff --cached --check`.
The [closeout result](../evidence/new-host-readiness-2026-10-07/verification/closeout-checks.json)
binds commands, exits and exact logs; no implementation changes followed the full-check checkpoint.

New-host acceptance/evidence exact `npm.cmd test` at clean `cbe2542`, Node v24.13.1, exited zero:
**226 files / 2,950 tests passed, 23 skipped**, 803.18 seconds.
The tracked [full-check result](../evidence/new-host-readiness-2026-10-07/verification/full-check-result.json)
binds source, command, raw logs and exit; Rule 7 and both typechecks are included. Product acceptance
separately used five focused files / 59 tests, app build and the live browser/visual boundary.

The agent-rules cleanup's `npm.cmd run lint:rule7`, `git diff --check` and bounded text review
passed. Primary `out/agent-rules-cleanup-2026-10-07/document-checks-final.json` records 717 → 415
AGENTS lines, all 18 unchanged rule headings, resolved links/anchors and the actual CLAUDE symlink;
`review.json` records the repaired finding and review limits. This is prose verification, not a new
full-suite or scientific result. Accepted ADRs, charter, evidence and code remain unchanged.

Exact `npm.cmd test` at clean `f528d29`, Node v24.13.1, exited zero: **224 files / 2,945 tests passed,
23 skipped**, in 835.83 seconds. Primary `out/housekeeping-2026-10-07/final-v2-invocation.json`,
`final-v2.log` and `final-v2-result.json` record command, source and exit. Rule 7 and both typechecks
are included. Historical catalog/source/recovery fixtures now reopen their registered bytes;
current-source drift refusal and named corruption controls remain. Scientific pins are unchanged.

`npm.cmd run build --workspace app`, the live gallery smoke and exact Run B browser smoke passed.
All 151 previews decoded, and Run B reached all 961,597 registered events with zero browser errors;
primary housekeeping `app-build`, `gallery-browser`, `run-b-browser` and `task-verification/`
receipts name those checks. `gallery-closeout-parity.json` matches all 151 physical inputs in both
checkouts to their registered hashes. The immutable baseline (77 failed tests), first final run
and rejected attempts remain in the [housekeeping record](plans/repository-housekeeping-2026-10-07.md).

The approved cleanup removed **348 files / 846,636,474 bytes** (`local-prune-result.json`):
rebuildable primary `app/dist/`, downloaded Node ZIP, duplicate Run B download and redundant local
science recovery probe. Canonical gallery inputs, installed tools, primary dependencies and receipts remain.
The compact index and exact archives are checked by `runner/test/progress-index.test.ts`.
Use product-sized checks for isolated presentation work; scientific gates are not setup smoke tests.

The [bounded NAS review](plans/repository-housekeeping-2026-10-07.md#nas-retention-review) bound all
30 declared owner manifests across 35 entries. It retained unclassified and insufficiently preserved
custody, including recorded duplicate candidates. The two former-host backup sets now have verified
current C-drive copies and fresh-process recovery (37 files / 137,211,035 bytes; current task
`nas/independent-backup-recovery.json`, SHA-256
`e6cf3576f71a80407b4f5ed0833bf3b649e8dc751315e82d848af6277b961629`). Other backup gaps and mixed
custody remain retained. Primary `nas-retention-review.json` records the disposition requirements.

## Active plan

- [New-host acceptance and capacity](plans/new-host-acceptance-and-capacity-2026-10-07.md) coordinates
  the completed maker-authorized three work blocks and their preserved protocols/results.
- [Agent-rules follow-up](plans/repository-housekeeping-2026-10-07.md#agent-rules-follow-up--2026-10-07)
  is complete and locally integrated; accepted ADRs, science and evidence remain unchanged.
  Relevant failure/lesson/check references now belong in each existing
  work plan before its risky action; agent discipline is distinguished from automated enforcement.
- [Repository housekeeping](plans/repository-housekeeping-2026-10-07.md) is complete. Its required
  checks, approved cleanup, local fast-forward and non-force worktree/ref closeout are recorded.
- [Phase 10 adaptive exploration](plans/post-phase10-adaptive-discovery.md) now has the completed
  [October21 comparisons](../evidence/hil-results-review-2026-10-21/README.md): warm refinement, cold domain sensitivity, facet attribution and pressure/history. The maker endorsed growth dynamics and morphology selection and selected the [116-row HIL/BLD design](plans/hil-bld-growth-dynamics-oct21.md), with HIL's last locally recorded launch at `2f2d605` and BLD's completed queue at `d7f76cb` with verified NAS preservation. The [visual history](run-history-guide.html) covers 27 study waves through October 10.
  All six old HIL operational failures reached size endpoints through
  [same-source recovery](plans/hil-bld-first-batch.md#recovery-completion-2026-10-08).
  All 72 HIL rows pass existing operational checks; their event geometry was independently reconstructed.
- [Glass/camera follow-up](plans/explore-gutcheck-growth-glass-camera.md) has an implementation candidate
  with completed local browser/visual acceptance: current tracked glass record SHA-256
  `052b4c0f92fc1f8ea9b5c88219322c4fd3ceaba4db79051a93b587d6bd4c51c8`.
  Its restored comparison bundle and accepted views are distinct from the 151-input gallery.
  Publication and hardware/mobile/cross-browser performance remain outside this acceptance.
- [Render worktree closeout](plans/render-worktrees-nas-closeout.md) has merged publication and completed
  worktree/branch consolidation. Full cross-machine restoration of the roughly 215 GB collection pair
  and any pruning of retained original output remain separate pending decisions.
- [NAS governance](plans/nas-asset-governance.md) is implemented; retained source/custody disposal remains
  collection-specific. [Local assets](local-assets.md) explains reconstruction and Rule 15 retention.
- [Education chapter-1 production](plans/explore-education-ch1-video.md) retains its unfinished production
  and interpretation-review decisions. The other computer's film branch is outside this housekeeping task.

The [compact Run B volume plan](plans/explore-gutcheck-growth-volume.md) is implemented locally; full comparison-bundle NAS publication remains deferred. Recovering the deployed replay does not publish that bundle. Completed catalog/gallery/phase plans are references, not active launch instructions.

## Next step

**BLD output is preserved:** [terminal readout](../evidence/bld-growth-dynamics-2026-10-21/terminal-readout.json) checked 91 size endpoints/92 rows; `gd21-bld-w3-pDouble-early20-w3` failed convergence after 505 updates with intact checkpoints. [NAS recovery](nas-assets/manifests/bld-growth-dynamics/2026-10-21-v1-verification.json) verified all 2308 source files in `bld-growth-dynamics@2026-10-21-v1` on `S:/`. Findings/recovery bindings are committed locally as `c73c296`; exact `npm.cmd test` finished with 3070 passed/two existing Windows symlink-setup failures (no green claim). HIL should freshly restore using the [October24 commands](plans/hil-bld-growth-dynamics-oct21.md#bld-finished-output-preservation--october24) and complete frozen matched-cohort analysis. BLD local Git [closeout is complete](plans/hil-bld-growth-dynamics-oct21.md#bld-local-git-closeout--october24): only primary `main` remains. All originals are retained in primary `out/bld-retired-2026-10-24/out`, with matching before/after inventory and verified NAS recovery. The merged task branch/worktree and rebuildable remnants were removed under explicit maker authorization. Do not retry unchanged or prune retained output. The maker explicitly approved GitHub publication; `git push origin main` published source, findings and recovery/closeout records through `e6a9a52`. HIL can fetch main in its primary checkout, then follow the recorded restore commands.

**Check current host status for the [HIL growth-dynamics queue](plans/hil-bld-growth-dynamics-oct21.md#hil-executable-and-recovery--october21), then analyze completed matched groups.** It registers 116 new rows (HIL 24/BLD 92), up to 20/32 workers, finite scientific targets, completed-cycle resume and no wall deadline. HIL owns all fine-grid and larger-history cases; BLD owns the fixed N64 warm/facet/sentinel queue and can shut down after verified output handoff, without waiting for HIL. All 22 conditional reserve rows belong to HIL and require recorded selection/prediction before dispatch. The last recorded October21 observation had HIL running on `codex/hil-growth-dynamics-oct21` at `2f2d605f0ed8fdb8d78cdea02a58102a7001cb53`, with 20 live workers/four queued and 20 initial checkpoints observed. BLD's independent 92-row queue at fixed producer `d7f76cb` has ended; 91 size endpoints and one failed case are retained with verified BLD NAS recovery. Previous campaigns remain complete. Phase10 remains open under ADR0062.

- **Warm history:** the [six-row comparison](plans/hil-warm-refinement.md#completed-representation-readout--2026-10-21) gives early-only open-envelope depths 3.5/4.025/4.025 um at common largest center span 9.8 um, versus zero in all broad controls. Common-age and post-switch observations support continued growth in the coarse and both fine seed representations. This is a model history lead, not continuum convergence or a physical width law.
- **Cold domain:** the [eight-row comparison](plans/hil-domain-seed-oct19.md#completed-cold-domain-comparison--2026-10-21) preserves prism-enabled gap 2 versus control gaps 0–1 at registered tip 8/9 plateau samples in N64/N96. Ring counts and late common-age geometry differ; same spacing with a larger domain does not establish grid or domain independence.
- **Facet attribution:** the [sixteen-row comparison](plans/hil-facet-pressure-oct19.md#completed-matched-readouts--2026-10-21) gives basal/prism/both minus neither axial additions +6/-2/+4 layers at -6.5 C and +2/-4/-2 at -9.5 C, at shared age 16.499190872203283 s and both CFL settings. Late -9.5 C basal-minus-neither occupancy reverses sign under timestep halving; axial agreement does not qualify occupancy.
- **Pressure/history:** the same plan's twelve histories use joint post-event 7.547248938077988 s. Later-half early-minus-late axial growth remains .70 um at three pressures and both CFLs, but quarter 3 ties and quarter 4 supplies the advantage. All twelve source prefixes match; continued-source full windows at half/normal pressure are unavailable. See the linked report for brackets and fresh-seed static limits.

Use the fixed execution checkout `C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake`. Check for existing workers before invoking `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-hil-growth-dynamics-oct21.ps1 -Mode resume -Workers 20`. Preserve that checkout/runtime for exact resume; primary main records status separately. Logs are in `out/hil-growth-dynamics-oct21-controls/` and each row’s `attempts/`; the [launch receipt](../evidence/hil-growth-dynamics-2026-10-21/launch.json) binds commands, processes and checkpoints. [Verification](../evidence/hil-growth-dynamics-2026-10-21/verification.json): exact `npm.cmd test` passed 244 files / 3088 tests, 23 skipped; retained warm/cold/history reconstruction covers three endpoints/2269 updates. Complete W4/C1/H1 cohorts remain pending results; the new readout is individual reconstruction only. No reserve is queued, no capacity ladder was repeated, and production has no wall deadline. Fine predecessor rows took roughly 6–10 active days each; smaller timesteps/new contention may take longer.

**NAS preservation is verified.** The [October21 task](plans/hil-results-preservation-oct21.md) published external-evidence collection `hil-exploration-results@2026-10-21` for all seven output owners and supporting/detailed analysis bytes: 10,291 source files / 6,630,541,146 original bytes in 18 payload files / 739,465,345 bytes. The [receipt](nas-assets/manifests/hil-exploration-results/2026-10-21-verification.json) binds publication, fresh restore, every archive member and full catalogue hashes; the task plan gives exact restore commands. All output has been retained under primary `out/hil-retired-2026-10-21/<label>/out/` with exact before/after hashes; [local closeout](../evidence/hil-results-review-2026-10-21/closeout.json) retired all eight merged Git worktrees and local task branches; only primary/main remained at that closeout; the new HIL execution worktree is now active. The unmerged remote film branch is retained. Six dependency-only directory shells and five stale app attachments remain (tool limitations recorded in the plan). No useful output was pruned. Exact `npm.cmd test` completed with 240 passing/2 failing files (3071 passed, 3 failed, 23 skipped): the new collection census and omitted pause/resume reference are corrected; all 27 focused metadata checks and final Rule7 pass. No full-suite-green claim.

Existing representative [pause/resume before launch](../evidence/discovery-resume-2026-10-07/verification.json) remains verified; reuse its unchanged contract rather than repeat the probe.

The older [192-case wave](plans/hil-two-day-exploration-oct12.md) retains 191 checked endpoints and its one unresolved cooling solver failure. The [single requested retry](../evidence/hil-reboot-recovery-2026-10-15/retry-outcome.json) reproduced boundary nonconvergence at cell 145376 (sigma_b 1e-323 versus zero), update 414/extent 21. Preserve both attempts; diagnose separately before any numerical correction/newly identified rerun. Do not relax convergence or retry unchanged. The [102-case queue](plans/hil-large-batch-oct11.md), [ten-row exploration](plans/hil-exploration-oct10.md) and [eight-row supplement](plans/hil-supplement.md) are complete and must not be relaunched.

Earlier HIL originals remain in primary `out/hil-retired-2026-10-08/`; BLD recovery remains catalogue-bound to `bld-first-batch-output@2026-10-08`. Use `npm.cmd run assets:restore -- --collection bld-first-batch-output@2026-10-08 --to out/restores/bld-first-batch-output-next-review`, then its verify-restored command. Preserve producer identities; never resume BLD checkpoints with HIL code. Phase7 stays on hold, S6 stays closed, and education proceeds separately. Large older NAS restoration and unresolved custody/pruning remain separate decisions.
